import { getArticlesFromDb, getContributorsFromDb } from "./db";

// Helper to get configured site base URL without trailing slash
export function getBaseUrl(req?: any): string {
  let siteUrl = process.env.SITE_URL || 
                 process.env.NEXT_PUBLIC_SITE_URL || 
                 process.env.VITE_SITE_URL;

  if (!siteUrl || siteUrl.includes("localhost")) {
    // If running with real host header that is not localhost, use it if production-like,
    // otherwise default to the official production URL
    if (req && req.headers && req.headers.host && !req.headers.host.includes("localhost") && !req.headers.host.includes("127.0.0.1")) {
      const proto = req.headers["x-forwarded-proto"] || "https";
      siteUrl = `${proto}://${req.headers.host}`;
    } else {
      siteUrl = "https://techquonews.com";
    }
  }

  return siteUrl.replace(/\/+$/, "");
}

export function getSiteName(): string {
  return "TechQuo News";
}

export function normalizeCategorySlug(category?: string): string {
  if (!category) return "technology";
  const clean = category
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return clean || "technology";
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatIsoDate(dateVal?: any): string {
  if (!dateVal) return new Date().toISOString();
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return new Date().toISOString();
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// Generate Dynamic XML Sitemap based strictly on live MongoDB records
export async function generateSitemapXml(baseUrl: string): Promise<string> {
  const cleanBase = baseUrl.replace(/\/+$/, "");

  // 1. Fetch only published articles
  const allArticles = await getArticlesFromDb();
  const publishedArticles = allArticles.filter(
    (a) => a.status === "published" && a.visibility !== "private" && !a.deleted
  );

  // 2. Fetch contributors and calculate real published article counts
  const allContributors = await getContributorsFromDb();
  
  // Count published articles per contributor
  const contributorPublishedCounts = new Map<string, number>();
  for (const article of publishedArticles) {
    const authorName = (article.author || "").toLowerCase().trim();
    const contribId = article.contributorId || article.contributor?.id || article.contributor?._id;
    const contribSlug = article.contributor?.slug;

    if (contribId) {
      contributorPublishedCounts.set(contribId, (contributorPublishedCounts.get(contribId) || 0) + 1);
    }
    if (contribSlug) {
      contributorPublishedCounts.set(contribSlug, (contributorPublishedCounts.get(contribSlug) || 0) + 1);
    }
    if (authorName) {
      contributorPublishedCounts.set(authorName, (contributorPublishedCounts.get(authorName) || 0) + 1);
    }
  }

  // Filter active contributors with >= 1 published article
  const eligibleContributors = allContributors.filter((c) => {
    if (c.status !== "active") return false;
    const idCount = c.id ? (contributorPublishedCounts.get(c.id) || 0) : 0;
    const _idCount = c._id ? (contributorPublishedCounts.get(c._id) || 0) : 0;
    const slugCount = c.slug ? (contributorPublishedCounts.get(c.slug) || 0) : 0;
    const nameCount = c.name ? (contributorPublishedCounts.get(c.name.toLowerCase().trim()) || 0) : 0;
    const totalPub = Math.max(idCount, _idCount, slugCount, nameCount, c.publishedArticlesCount || 0);
    return totalPub > 0;
  });

  // 3. Find unique categories with published articles
  const standardCategories = ["technology", "fintech", "business", "startups", "events", "career"];
  const categoryMap = new Map<string, string>(); // slug -> latest article date
  
  for (const cat of standardCategories) {
    categoryMap.set(cat, new Date().toISOString());
  }

  for (const article of publishedArticles) {
    const catSlug = normalizeCategorySlug(article.category);
    const artDate = formatIsoDate(article.updatedAt || article.publishedAt || article.createdAt);
    const existingDate = categoryMap.get(catSlug);
    if (!existingDate || new Date(artDate) > new Date(existingDate)) {
      categoryMap.set(catSlug, artDate);
    }
  }

  // Find latest site-wide update date
  let latestSiteDate = new Date().toISOString();
  if (publishedArticles.length > 0) {
    const sorted = [...publishedArticles].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.publishedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.publishedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
    latestSiteDate = formatIsoDate(sorted[0].updatedAt || sorted[0].publishedAt || sorted[0].createdAt);
  }

  // Build XML URL entries
  const urlEntries: string[] = [];

  // 1. Homepage
  urlEntries.push(`  <url>
    <loc>${escapeXml(`${cleanBase}/`)}</loc>
    <lastmod>${latestSiteDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`);

  // 2. Published Articles
  for (const article of publishedArticles) {
    const catSlug = normalizeCategorySlug(article.category);
    const artSlug = article.slug || article.id;
    const articleUrl = `${cleanBase}/${catSlug}/${artSlug}`;
    const articleLastMod = formatIsoDate(article.updatedAt || article.publishedAt || article.createdAt);

    // Calculate priority: recent articles (< 30 days) get 0.9, others 0.8
    const articleAgeDays = (Date.now() - new Date(articleLastMod).getTime()) / (1000 * 60 * 60 * 24);
    const priority = articleAgeDays <= 30 ? "0.9" : "0.8";

    urlEntries.push(`  <url>
    <loc>${escapeXml(articleUrl)}</loc>
    <lastmod>${articleLastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`);
  }

  // 3. Public Contributors (active with >= 1 published article)
  for (const contributor of eligibleContributors) {
    const contribSlug = contributor.slug;
    if (!contribSlug) continue;
    const contribUrl = `${cleanBase}/contributors/${contribSlug}`;
    const contribLastMod = formatIsoDate(contributor.updatedAt || contributor.createdAt || latestSiteDate);

    urlEntries.push(`  <url>
    <loc>${escapeXml(contribUrl)}</loc>
    <lastmod>${contribLastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
  }

  // 4. Public Category Pages
  for (const [catSlug, catLastMod] of categoryMap.entries()) {
    const catUrl = `${cleanBase}/${catSlug}`;
    urlEntries.push(`  <url>
    <loc>${escapeXml(catUrl)}</loc>
    <lastmod>${catLastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  // 5. Important Static Pages
  const staticPages = [
    { path: "/about", priority: "0.6", changefreq: "monthly" },
    { path: "/contact", priority: "0.6", changefreq: "monthly" },
    { path: "/partnerships", priority: "0.6", changefreq: "monthly" },
    { path: "/contributors", priority: "0.7", changefreq: "weekly" },
    { path: "/trending", priority: "0.8", changefreq: "daily" },
  ];

  for (const page of staticPages) {
    urlEntries.push(`  <url>
    <loc>${escapeXml(`${cleanBase}${page.path}`)}</loc>
    <lastmod>${latestSiteDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join("\n")}
</urlset>`;
}

// Generate production-ready robots.txt
export function generateRobotsTxt(baseUrl: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  return [
    "User-agent: *",
    "Allow: /",
    "Allow: /technology/",
    "Allow: /fintech/",
    "Allow: /business/",
    "Allow: /startups/",
    "Allow: /events",
    "Allow: /career/",
    "Allow: /contributors/",
    "Allow: /about",
    "Allow: /contact",
    "Allow: /partnerships",
    "Allow: /trending",
    "Disallow: /admin/",
    "Disallow: /admin",
    "Disallow: /dashboard/",
    "Disallow: /dashboard",
    "Disallow: /api/",
    "Disallow: /login",
    "Disallow: /register",
    "Disallow: /settings",
    "Disallow: /profile",
    "Disallow: /search",
    "",
    `Sitemap: ${cleanBase}/sitemap.xml`,
    ""
  ].join("\r\n");
}
