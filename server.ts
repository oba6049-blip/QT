import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { createApp } from "./server/app";
import { 
  getArticleByIdFromDb, 
  getContributorByIdFromDb, 
  getArticlesFromDb,
  getSpotlightByIdFromDb,
  getSpotlightsFromDb
} from "./server/db";
import { 
  getBaseUrl, 
  getSiteName, 
  normalizeCategorySlug,
  generateSlug,
  toAbsoluteUrl,
  cleanPlainText
} from "./server/seo";

// Load environment variables
dotenv.config();

function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatArticleBodyToHtml(content: string): string {
  if (!content) return "";
  
  if (content.includes("<p>") || content.includes("<h2") || content.includes("<div>")) {
    return `<div class="article-rich-content" style="line-height:1.8;color:#334155;font-size:1.125rem;">${content}</div>`;
  }

  const blocks = content.split(/\n\n+/);
  const htmlBlocks = blocks.map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return "";

    if (trimmed.startsWith("### ")) {
      return `<h3 style="font-size:1.35rem;font-weight:700;color:#0f172a;margin:1.75rem 0 0.75rem;line-height:1.3;">${escapeHtml(trimmed.slice(4))}</h3>`;
    }
    if (trimmed.startsWith("## ")) {
      return `<h2 style="font-size:1.65rem;font-weight:700;color:#0f172a;margin:2rem 0 1rem;line-height:1.3;">${escapeHtml(trimmed.slice(3))}</h2>`;
    }
    if (trimmed.startsWith("# ")) {
      return `<h2 style="font-size:1.85rem;font-weight:800;color:#0f172a;margin:2rem 0 1rem;line-height:1.2;">${escapeHtml(trimmed.slice(2))}</h2>`;
    }
    if (trimmed.startsWith("> ")) {
      return `<blockquote style="border-left:4px solid #0052FF;padding:0.75rem 1rem;margin:1.5rem 0;background:#f8fafc;color:#475569;font-style:italic;border-radius:0 4px 4px 0;">${escapeHtml(trimmed.slice(2))}</blockquote>`;
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const items = trimmed.split(/\n[-*]\s+/).filter(Boolean);
      return `<ul style="margin:1rem 0 1.5rem 1.5rem;list-style-type:disc;color:#334155;">${items.map(item => `<li style="margin-bottom:0.5rem;line-height:1.7;">${escapeHtml(item.replace(/^[-*]\s+/, ""))}</li>`).join("")}</ul>`;
    }

    return `<p style="margin-bottom:1.5rem;line-height:1.8;color:#334155;">${escapeHtml(trimmed)}</p>`;
  });

  return htmlBlocks.join("\n");
}

function generateArticlePrerenderHtml(article: any, baseUrl: string, canonicalUrl: string): string {
  const title = article.title || "TechQuo News Article";
  const author = article.author || "TechQuo Editorial Staff";
  const category = article.category || "Technology";
  const date = article.date || (article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "");
  const excerpt = article.excerpt || "";
  const image = article.image ? toAbsoluteUrl(article.image, baseUrl) : "";
  const bodyHtml = formatArticleBodyToHtml(article.content || "");
  const categorySlug = normalizeCategorySlug(category);

  return `
    <article id="server-prerender-article" style="max-width:860px;margin:0 auto;padding:2rem 1.25rem 4rem;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <nav aria-label="Breadcrumb" style="margin-bottom:1.25rem;font-size:0.875rem;color:#64748b;">
        <a href="${baseUrl}/" style="color:#0052FF;text-decoration:none;">Home</a> &raquo; 
        <a href="${baseUrl}/${categorySlug}" style="color:#0052FF;text-decoration:none;">${escapeHtml(category)}</a>
      </nav>
      <span style="display:inline-block;padding:0.25rem 0.625rem;background:#EEF2FF;color:#0052FF;font-weight:700;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;border-radius:4px;margin-bottom:1rem;">${escapeHtml(category)}</span>
      <h1 style="font-size:2.5rem;font-weight:800;line-height:1.2;color:#0f172a;margin-bottom:1.25rem;">${escapeHtml(title)}</h1>
      ${excerpt ? `<p style="font-size:1.25rem;color:#475569;line-height:1.6;margin-bottom:1.5rem;font-weight:400;">${escapeHtml(excerpt)}</p>` : ''}
      <div style="display:flex;align-items:center;gap:0.75rem;color:#64748b;font-size:0.875rem;margin-bottom:1.75rem;padding-bottom:1.25rem;border-bottom:1px solid #e2e8f0;flex-wrap:wrap;">
        <span>By <strong>${escapeHtml(author)}</strong></span>
        ${date ? `<span>&bull;</span><time datetime="${article.publishedAt || ''}">${escapeHtml(date)}</time>` : ''}
      </div>
      ${image ? `<div style="margin-bottom:2.25rem;"><img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" style="width:100%;max-height:520px;object-fit:cover;border-radius:8px;" /></div>` : ''}
      <div class="article-body-content" style="font-size:1.125rem;">
        ${bodyHtml}
      </div>
    </article>
  `;
}

function generateContributorPrerenderHtml(contributor: any, articles: any[], baseUrl: string): string {
  const name = contributor.name || "Contributor";
  const title = contributor.title || "Technology Contributor";
  const bio = contributor.bio || "";
  const avatar = contributor.profileImage || contributor.avatar ? toAbsoluteUrl(contributor.profileImage || contributor.avatar, baseUrl) : "";

  return `
    <div id="server-prerender-contributor" style="max-width:860px;margin:0 auto;padding:2rem 1.25rem 4rem;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="display:flex;gap:1.5rem;align-items:center;margin-bottom:2rem;flex-wrap:wrap;">
        ${avatar ? `<img src="${escapeHtml(avatar)}" alt="${escapeHtml(name)}" style="width:96px;height:96px;border-radius:50%;object-fit:cover;" />` : ''}
        <div>
          <h1 style="font-size:2rem;font-weight:800;color:#0f172a;margin-bottom:0.25rem;">${escapeHtml(name)}</h1>
          <p style="color:#0052FF;font-weight:600;margin-bottom:0.5rem;">${escapeHtml(title)}</p>
        </div>
      </div>
      ${bio ? `<p style="font-size:1.125rem;color:#475569;line-height:1.7;margin-bottom:2.5rem;">${escapeHtml(bio)}</p>` : ''}
      <h2 style="font-size:1.5rem;font-weight:700;color:#0f172a;margin-bottom:1.25rem;border-bottom:1px solid #e2e8f0;padding-bottom:0.5rem;">Articles by ${escapeHtml(name)}</h2>
      <div style="display:flex;flex-direction:column;gap:1.5rem;">
        ${articles.map(a => `
          <div style="padding:1rem 0;border-bottom:1px solid #f1f5f9;">
            <a href="${baseUrl}/${normalizeCategorySlug(a.category || 'technology')}/${a.slug || a.id}" style="font-size:1.25rem;font-weight:700;color:#0f172a;text-decoration:none;display:block;margin-bottom:0.5rem;">${escapeHtml(a.title)}</a>
            ${a.excerpt ? `<p style="color:#64748b;font-size:0.95rem;line-height:1.5;">${escapeHtml(a.excerpt)}</p>` : ''}
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function generateSpotlightPrerenderHtml(spotlight: any, baseUrl: string): string {
  const title = spotlight.title || "Founder Spotlight";
  const founderName = spotlight.founderName || "Founder";
  const companyName = spotlight.companyName || "Startup";
  const story = spotlight.story || "";
  const image = spotlight.image ? toAbsoluteUrl(spotlight.image, baseUrl) : "";

  return `
    <article id="server-prerender-spotlight" style="max-width:860px;margin:0 auto;padding:2rem 1.25rem 4rem;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <span style="display:inline-block;padding:0.25rem 0.625rem;background:#EEF2FF;color:#0052FF;font-weight:700;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;border-radius:4px;margin-bottom:1rem;">Founder Spotlight</span>
      <h1 style="font-size:2.5rem;font-weight:800;line-height:1.2;color:#0f172a;margin-bottom:0.5rem;">${escapeHtml(title)}</h1>
      <p style="font-size:1.25rem;color:#0052FF;font-weight:600;margin-bottom:1.5rem;">${escapeHtml(founderName)}, Founder of ${escapeHtml(companyName)}</p>
      ${image ? `<div style="margin-bottom:2rem;"><img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" style="width:100%;max-height:500px;object-fit:cover;border-radius:8px;" /></div>` : ''}
      <div style="font-size:1.125rem;line-height:1.8;color:#334155;">
        ${formatArticleBodyToHtml(story)}
      </div>
    </article>
  `;
}

function generate404PrerenderHtml(baseUrl: string, message: string = "Page Not Found"): string {
  return `
    <div id="server-prerender-404" style="min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:4rem 1.25rem;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <span style="font-size:1rem;font-weight:800;color:#0052FF;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.75rem;">Error 404</span>
      <h1 style="font-size:2.75rem;font-weight:900;color:#0f172a;margin-bottom:1rem;">${escapeHtml(message)}</h1>
      <p style="font-size:1.125rem;color:#64748b;margin-bottom:2rem;max-width:520px;line-height:1.6;">The page or article you are looking for has been moved, unpublished, or does not exist.</p>
      <a href="${baseUrl}/" style="display:inline-block;padding:0.875rem 2rem;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:700;border-radius:6px;text-transform:uppercase;letter-spacing:0.05em;font-size:0.875rem;">Return to Front Page</a>
    </div>
  `;
}

function injectPrerenderedContent(html: string, bodyContent: string): string {
  if (html.includes('<div id="root"></div>')) {
    return html.replace('<div id="root"></div>', `<div id="root">${bodyContent}</div>`);
  }
  if (html.includes('<div id="root">')) {
    return html.replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${bodyContent}</div>`);
  }
  return html;
}

function injectMetaTags(html: string, options: {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  image?: string;
  robots?: string;
  ogType?: string;
  schemaJson?: any;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  authorName?: string;
  twitterCreator?: string;
  baseUrl?: string;
  bodyContent?: string;
}) {
  let output = html;
  const siteName = getSiteName();
  const baseUrl = options.baseUrl || "https://www.techquonews.com";
  const title = options.title || `${siteName} | African Tech, FinTech & Startup Insights`;
  const description = options.description || "A premium digital media and news publishing platform for African tech, fintech, venture capital, and startup insights.";
  const rawImage = options.image || "/og-image.png";
  const absoluteImage = toAbsoluteUrl(rawImage, baseUrl);
  const robots = options.robots || "index, follow";
  const ogType = options.ogType || "website";
  const canonicalUrl = options.canonicalUrl ? toAbsoluteUrl(options.canonicalUrl, baseUrl) : baseUrl;

  // Escape helpers for HTML attributes
  const safeTitle = title.replace(/"/g, "&quot;");
  const safeDescription = description.replace(/"/g, "&quot;");
  const safeImage = absoluteImage.replace(/"/g, "&quot;");

  // 1. Replace or update Title
  output = output.replace(/<title>.*?<\/title>/i, `<title>${safeTitle}</title>`);
  
  // 2. Replace meta descriptions
  if (output.includes('id="meta-description"')) {
    output = output.replace(/id="meta-description" content=".*?"/i, `id="meta-description" content="${safeDescription}"`);
  } else {
    output = output.replace(/<meta name="description" content=".*?"/i, `<meta name="description" content="${safeDescription}"`);
  }
  
  // 3. Replace OpenGraph tags with absolute values
  if (output.includes('id="og-title"')) {
    output = output.replace(/id="og-title" content=".*?"/i, `id="og-title" content="${safeTitle}"`);
  }
  if (output.includes('id="og-description"')) {
    output = output.replace(/id="og-description" content=".*?"/i, `id="og-description" content="${safeDescription}"`);
  }
  if (output.includes('id="og-image"')) {
    output = output.replace(/id="og-image" content=".*?"/i, `id="og-image" content="${safeImage}"`);
  }
  if (output.includes('property="og:type"')) {
    output = output.replace(/property="og:type" content=".*?"/i, `property="og:type" content="${ogType}"`);
  }

  // 4. Replace Twitter tags with absolute values
  if (output.includes('id="twitter-title"')) {
    output = output.replace(/id="twitter-title" content=".*?"/i, `id="twitter-title" content="${safeTitle}"`);
  }
  if (output.includes('id="twitter-description"')) {
    output = output.replace(/id="twitter-description" content=".*?"/i, `id="twitter-description" content="${safeDescription}"`);
  }
  if (output.includes('id="twitter-image"')) {
    output = output.replace(/id="twitter-image" content=".*?"/i, `id="twitter-image" content="${safeImage}"`);
  }

  // 5. Build rich social preview head additions (WhatsApp, LinkedIn, Twitter, Facebook, Slack, iMessage)
  let headAdditions = `\n  <!-- Search Engine Crawl Directives -->\n  <meta name="robots" content="${robots}" />`;
  headAdditions += `\n  <link rel="canonical" href="${canonicalUrl}" />`;
  headAdditions += `\n  <meta property="og:url" content="${canonicalUrl}" />`;
  headAdditions += `\n  <meta property="og:site_name" content="${siteName}" />`;
  
  // High-Resolution WhatsApp & Facebook Image Metadata
  headAdditions += `\n  <meta property="og:image:secure_url" content="${safeImage}" />`;
  headAdditions += `\n  <meta property="og:image:width" content="1200" />`;
  headAdditions += `\n  <meta property="og:image:height" content="630" />`;
  headAdditions += `\n  <meta property="og:image:alt" content="${safeTitle}" />`;
  
  // Image MIME type detection
  if (safeImage.endsWith(".png")) {
    headAdditions += `\n  <meta property="og:image:type" content="image/png" />`;
  } else if (safeImage.endsWith(".webp")) {
    headAdditions += `\n  <meta property="og:image:type" content="image/webp" />`;
  } else {
    headAdditions += `\n  <meta property="og:image:type" content="image/jpeg" />`;
  }

  // Twitter Extra Card Directives
  headAdditions += `\n  <meta name="twitter:site" content="@TechQuoNews" />`;
  if (options.twitterCreator) {
    headAdditions += `\n  <meta name="twitter:creator" content="${options.twitterCreator}" />`;
  }
  headAdditions += `\n  <meta name="twitter:image:alt" content="${safeTitle}" />`;

  // Article Specific Open Graph Properties
  if (ogType === "article") {
    if (options.publishedTime) {
      headAdditions += `\n  <meta property="article:published_time" content="${options.publishedTime}" />`;
    }
    if (options.modifiedTime) {
      headAdditions += `\n  <meta property="article:modified_time" content="${options.modifiedTime}" />`;
    }
    if (options.section) {
      headAdditions += `\n  <meta property="article:section" content="${options.section}" />`;
    }
    if (options.authorName) {
      headAdditions += `\n  <meta property="article:author" content="${options.authorName}" />`;
      headAdditions += `\n  <meta name="author" content="${options.authorName}" />`;
    }
  }

  // Structured Data JSON-LD
  if (options.schemaJson) {
    headAdditions += `\n  <script type="application/ld+json">${JSON.stringify(options.schemaJson)}</script>`;
  }

  output = output.replace("</head>", `${headAdditions}\n</head>`);

  // Inject initial HTML body content for search engines & zero-JS crawlers
  if (options.bodyContent) {
    output = injectPrerenderedContent(output, options.bodyContent);
  }

  return output;
}

async function startServer() {
  // Create Express application with all API routes and middleware configured
  const app = createApp();
  const PORT = 3000;

  // -------------------------------------------------------------
  // VITE & CLIENT APP HANDLING
  // -------------------------------------------------------------

  let vite: any;
  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist"), { index: false }));
  }

  // Template loader helper
  async function loadTemplate(url: string): Promise<string> {
    const indexHtmlPath = process.env.NODE_ENV !== "production"
      ? path.resolve(process.cwd(), "index.html")
      : path.resolve(process.cwd(), "dist/index.html");

    let template = fs.readFileSync(indexHtmlPath, "utf-8");
    if (process.env.NODE_ENV !== "production" && vite) {
      template = await vite.transformIndexHtml(url, template);
    }
    return template;
  }

  // 1. Contributor profile routes
  app.get(["/contributors/:slug", "/contributor/:slug"], async (req, res, next) => {
    const { slug } = req.params;
    try {
      let template = await loadTemplate(req.originalUrl);
      const baseUrl = getBaseUrl(req);
      const contributor = await getContributorByIdFromDb(slug);

      if (contributor) {
        // Check if contributor has published articles
        const allArticles = await getArticlesFromDb();
        const contributorArticles = allArticles.filter(
          (a) => a.status === "published" && 
                 (a.contributorId === contributor.id || a.contributorId === contributor._id || 
                  (a.author && a.author.toLowerCase().trim() === contributor.name.toLowerCase().trim()))
        );
        const publishedCount = contributorArticles.length;

        const isIndexable = contributor.status === "active" && publishedCount > 0;
        const title = `${contributor.name} - ${contributor.title || "Technology Contributor"} | TechQuo News`;
        const description = contributor.bio || `Read articles and insights by ${contributor.name}, a ${contributor.title || "Technology Contributor"} at TechQuo News.`;
        const image = contributor.profileImage || contributor.avatar || "/og-image.png";
        const canonicalUrl = `${baseUrl}/contributors/${contributor.slug || slug}`;

        const schemaJsonLd = {
          "@context": "https://schema.org",
          "@type": "Person",
          "name": contributor.name,
          "jobTitle": contributor.title || "Technology Contributor",
          "worksFor": {
            "@type": "Organization",
            "name": "TechQuo News",
            "url": baseUrl,
          },
          "description": contributor.bio,
          "image": image,
          "url": canonicalUrl,
          "sameAs": [
            contributor.socialLinks?.linkedin,
            contributor.socialLinks?.twitter,
            contributor.socialLinks?.website,
            contributor.socialLinks?.github,
          ].filter(Boolean),
        };

        const bodyContent = generateContributorPrerenderHtml(contributor, contributorArticles, baseUrl);

        template = injectMetaTags(template, {
          title,
          description,
          image,
          canonicalUrl,
          robots: isIndexable ? "index, follow" : "noindex, follow",
          ogType: "profile",
          schemaJson: schemaJsonLd,
          baseUrl,
          authorName: contributor.name,
          bodyContent,
        });

        return res.status(200).set({ "Content-Type": "text/html" }).end(template);
      }

      // Contributor not found -> Return real HTTP 404
      template = injectMetaTags(template, {
        title: "Contributor Profile Not Found | TechQuo News",
        description: "The contributor profile you are looking for has been removed or does not exist.",
        robots: "noindex, nofollow",
        bodyContent: generate404PrerenderHtml(baseUrl, "Contributor Profile Not Found"),
      });
      return res.status(404).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      if (process.env.NODE_ENV !== "production" && vite) {
        vite.ssrFixStacktrace(e as Error);
      }
      next(e);
    }
  });

  // 2. Legacy /article/:id route - 301 Redirect to canonical /:category/:slug
  app.get("/article/:id", async (req, res, next) => {
    const { id } = req.params;
    try {
      const baseUrl = getBaseUrl(req);
      const article = await getArticleByIdFromDb(id);

      if (article) {
        const catSlug = normalizeCategorySlug(article.category || "technology");
        const artSlug = article.slug || (article.title ? generateSlug(article.title) : (article.id || id));
        // Permanent 301 redirect to canonical SEO clean URL: /:category/:slug
        return res.redirect(301, `/${catSlug}/${artSlug}`);
      }

      let template = await loadTemplate(req.originalUrl);
      template = injectMetaTags(template, {
        title: "Article Not Found | TechQuo News",
        robots: "noindex, nofollow",
        bodyContent: generate404PrerenderHtml(baseUrl, "Article Not Found"),
      });
      return res.status(404).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      if (process.env.NODE_ENV !== "production" && vite) {
        vite.ssrFixStacktrace(e as Error);
      }
      next(e);
    }
  });

  // 3. Founder & Startup Spotlight Routes: /spotlight/:id and /spotlights
  app.get(["/spotlight/:id", "/spotlights/:id"], async (req, res, next) => {
    const { id } = req.params;
    try {
      let template = await loadTemplate(req.originalUrl);
      const baseUrl = getBaseUrl(req);
      const spotlight = await getSpotlightByIdFromDb(id);

      if (spotlight) {
        const spotSlug = spotlight.slug || spotlight.id || id;
        const cleanSnippet = cleanPlainText(spotlight.story || spotlight.title || "", 160);

        const title = `${spotlight.founderName}, Founder of ${spotlight.companyName} | Founder Spotlight | TechQuo News`;
        const description = `${spotlight.title}. How ${spotlight.founderName} is building ${spotlight.companyName}: ${cleanSnippet}`;
        const image = spotlight.image || "/og-image.png";
        const canonicalUrl = `${baseUrl}/spotlight/${spotSlug}`;

        const authorSlug = spotlight.contributor?.slug || 
          (spotlight.author ? spotlight.author.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') : 'editorial-staff');

        const schemaJsonLd = {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": spotlight.title,
          "description": cleanSnippet,
          "image": [toAbsoluteUrl(image, baseUrl)],
          "datePublished": spotlight.createdAt || new Date().toISOString(),
          "dateModified": spotlight.updatedAt || spotlight.createdAt || new Date().toISOString(),
          "author": {
            "@type": "Person",
            "name": spotlight.author || "TechQuo Editorial Staff",
            "url": `${baseUrl}/contributors/${authorSlug}`
          },
          "about": [
            {
              "@type": "Person",
              "name": spotlight.founderName,
              "jobTitle": "Founder & Visionary",
              "worksFor": {
                "@type": "Organization",
                "name": spotlight.companyName,
                "url": spotlight.link || undefined
              }
            },
            {
              "@type": "Organization",
              "name": spotlight.companyName,
              "url": spotlight.link || undefined
            }
          ],
          "publisher": {
            "@type": "Organization",
            "name": "TechQuo News",
            "url": baseUrl,
            "logo": {
              "@type": "ImageObject",
              "url": `${baseUrl}/logo.png`
            }
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": canonicalUrl
          }
        };

        const bodyContent = generateSpotlightPrerenderHtml(spotlight, baseUrl);

        template = injectMetaTags(template, {
          title,
          description,
          image,
          canonicalUrl,
          robots: "index, follow",
          ogType: "article",
          schemaJson: schemaJsonLd,
          publishedTime: spotlight.createdAt,
          modifiedTime: spotlight.updatedAt || spotlight.createdAt,
          section: "Founder Spotlight",
          authorName: spotlight.author || "TechQuo Editorial Staff",
          baseUrl,
          bodyContent,
        });

        return res.status(200).set({ "Content-Type": "text/html" }).end(template);
      }

      // Spotlight not found -> Return HTTP 404
      template = injectMetaTags(template, {
        title: "Founder Spotlight Not Found | TechQuo News",
        robots: "noindex, nofollow",
        bodyContent: generate404PrerenderHtml(baseUrl, "Founder Spotlight Not Found"),
      });
      return res.status(404).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      if (process.env.NODE_ENV !== "production" && vite) {
        vite.ssrFixStacktrace(e as Error);
      }
      next(e);
    }
  });

  app.get("/spotlights", async (req, res, next) => {
    try {
      let template = await loadTemplate(req.originalUrl);
      const baseUrl = getBaseUrl(req);
      const spotlights = await getSpotlightsFromDb();

      const title = "Founder & Startup Spotlights | TechQuo News";
      const description = "In-depth profiles, visionary journeys, and breakthrough startup narratives from African tech founders, builders, and enterprise innovators.";
      const canonicalUrl = `${baseUrl}/spotlights`;

      const itemListElements = spotlights.slice(0, 10).map((spot, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Article",
          "name": `${spot.founderName} - ${spot.companyName}`,
          "headline": spot.title,
          "url": `${baseUrl}/spotlight/${spot.slug || spot.id}`,
          "image": toAbsoluteUrl(spot.image, baseUrl)
        }
      }));

      const schemaJsonLd = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": title,
        "description": description,
        "url": canonicalUrl,
        "publisher": {
          "@type": "Organization",
          "name": "TechQuo News",
          "url": baseUrl
        },
        "mainEntity": {
          "@type": "ItemList",
          "itemListElement": itemListElements
        }
      };

      template = injectMetaTags(template, {
        title,
        description,
        canonicalUrl,
        robots: "index, follow",
        ogType: "website",
        schemaJson: schemaJsonLd,
        baseUrl,
      });

      return res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      if (process.env.NODE_ENV !== "production" && vite) {
        vite.ssrFixStacktrace(e as Error);
      }
      next(e);
    }
  });

  // 3. Category & Canonical Article Routes: /:category and /:category/:slug
  const knownCategories = ["technology", "fintech", "business", "startups", "events", "career"];

  app.get("/:category/:slug", async (req, res, next) => {
    const { category, slug } = req.params;

    // Skip static assets or reserved prefixes
    if (category === "api" || category === "admin" || category === "assets" || category.includes(".")) {
      return next();
    }

    try {
      let template = await loadTemplate(req.originalUrl);
      const baseUrl = getBaseUrl(req);
      const article = await getArticleByIdFromDb(slug);

      if (article) {
        const catSlug = normalizeCategorySlug(article.category || category);
        const artSlug = article.slug || slug;
        const title = `${article.title} | TechQuo News`;
        const description = cleanPlainText(article.excerpt || article.content || "Read this article on TechQuo News", 160);
        const image = article.image || "/og-image.png";
        const canonicalUrl = `${baseUrl}/${catSlug}/${artSlug}`;
        const isPublished = article.status === "published" && article.visibility !== "private" && !article.deleted;

        const authorSlug = article.contributor?.slug || (article.author ? article.author.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') : 'editorial-staff');

        const schemaJsonLd = {
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          "headline": article.title,
          "description": description,
          "image": [toAbsoluteUrl(image, baseUrl)],
          "datePublished": article.publishedAt || article.createdAt,
          "dateModified": article.updatedAt || article.publishedAt || article.createdAt,
          "author": {
            "@type": "Person",
            "name": article.author || "Editorial Staff",
            "url": `${baseUrl}/contributors/${authorSlug}`
          },
          "publisher": {
            "@type": "Organization",
            "name": "TechQuo News",
            "url": baseUrl,
            "logo": {
              "@type": "ImageObject",
              "url": `${baseUrl}/logo.png`
            }
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": canonicalUrl
          }
        };

        const bodyContent = generateArticlePrerenderHtml(article, baseUrl, canonicalUrl);

        template = injectMetaTags(template, {
          title,
          description,
          image,
          canonicalUrl,
          robots: isPublished ? "index, follow" : "noindex, nofollow",
          ogType: "article",
          schemaJson: schemaJsonLd,
          publishedTime: article.publishedAt || article.createdAt,
          modifiedTime: article.updatedAt || article.publishedAt || article.createdAt,
          section: article.category,
          authorName: article.author,
          baseUrl,
          bodyContent,
        });

        return res.status(200).set({ "Content-Type": "text/html" }).end(template);
      }

      // Article not found -> Return real HTTP 404
      template = injectMetaTags(template, {
        title: "Article Not Found | TechQuo News",
        description: "The story you are looking for has been removed, unpublished, or does not exist.",
        robots: "noindex, nofollow",
        bodyContent: generate404PrerenderHtml(baseUrl, "Article Not Found"),
      });
      return res.status(404).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      if (process.env.NODE_ENV !== "production" && vite) {
        vite.ssrFixStacktrace(e as Error);
      }
      next(e);
    }
  });

  // 4. Catch-all for Category, Static, Admin, and Homepage SSR Tag Injection
  app.get("*", async (req, res, next) => {
    // Skip API routes so they are never served HTML
    if (req.path.startsWith("/api/") || req.originalUrl.startsWith("/api/")) {
      return res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.path}` });
    }

    // Skip static files with extensions
    if (req.originalUrl.includes(".") && !req.originalUrl.endsWith(".html")) {
      return next();
    }

    try {
      let template = await loadTemplate(req.originalUrl);
      const baseUrl = getBaseUrl(req);
      const pathname = req.path.replace(/\/+$/, "") || "/";

      // 4A. Admin & Private Routes
      if (
        pathname.startsWith("/admin") ||
        pathname === "/login" ||
        pathname === "/register" ||
        pathname === "/settings" ||
        pathname === "/profile" ||
        pathname === "/search"
      ) {
        template = injectMetaTags(template, {
          title: "Admin Dashboard | TechQuo News",
          robots: "noindex, nofollow",
        });
        return res.status(200).set({ "Content-Type": "text/html" }).end(template);
      }

      // 4B. Static Pages
      if (pathname === "/about") {
        template = injectMetaTags(template, {
          title: "About TechQuo News | African Tech, FinTech & Startup Insights",
          description: "TechQuo News is the authoritative tech media platform reporting on African technology innovation, venture capital, fintech rails, and digital business developments.",
          canonicalUrl: `${baseUrl}/about`,
          robots: "index, follow",
        });
        return res.status(200).set({ "Content-Type": "text/html" }).end(template);
      }

      if (pathname === "/contact") {
        template = injectMetaTags(template, {
          title: "Contact Us | TechQuo News",
          description: "Get in touch with TechQuo News editorial newsroom, press team, and corporate headquarters for news tips, op-ed submissions, and inquiries.",
          canonicalUrl: `${baseUrl}/contact`,
          robots: "index, follow",
        });
        return res.status(200).set({ "Content-Type": "text/html" }).end(template);
      }

      if (pathname === "/partnerships") {
        template = injectMetaTags(template, {
          title: "Partnerships & Advertising | TechQuo News",
          description: "Partner with TechQuo News to reach high-impact decision makers, tech founders, venture capitalists, and software engineers across Africa and globally.",
          canonicalUrl: `${baseUrl}/partnerships`,
          robots: "index, follow",
        });
        return res.status(200).set({ "Content-Type": "text/html" }).end(template);
      }

      if (pathname === "/trending") {
        template = injectMetaTags(template, {
          title: "Trending Tech News & Breaking Market Analysis | TechQuo News",
          description: "Discover the most read and trending African technology news, venture capital rounds, and startup breakthroughs on TechQuo News.",
          canonicalUrl: `${baseUrl}/trending`,
          robots: "index, follow",
        });
        return res.status(200).set({ "Content-Type": "text/html" }).end(template);
      }

      if (pathname === "/contributors") {
        template = injectMetaTags(template, {
          title: "Editorial Contributors Directory | TechQuo News",
          description: "Explore profiles, column archives, and tech analyses from TechQuo News verified expert columnists and guest engineers.",
          canonicalUrl: `${baseUrl}/contributors`,
          robots: "index, follow",
        });
        return res.status(200).set({ "Content-Type": "text/html" }).end(template);
      }

      if (pathname === "/events") {
        template = injectMetaTags(template, {
          title: "Technology Events & Summits | TechQuo News",
          description: "Pan-African tech summits, hackathons, and investor mixers curated by TechQuo News.",
          canonicalUrl: `${baseUrl}/events`,
          robots: "index, follow",
        });
        return res.status(200).set({ "Content-Type": "text/html" }).end(template);
      }

      // 4C. Category Pages: /technology, /fintech, /business, /startups, /career, /category/:category
      const categoryMatch = pathname.match(/^\/(technology|fintech|business|startups|career|category\/([a-zA-Z0-9_-]+))$/i);
      if (categoryMatch) {
        const rawCat = categoryMatch[2] || categoryMatch[1];
        const cleanCat = normalizeCategorySlug(rawCat);
        const displayCategory = cleanCat.charAt(0).toUpperCase() + cleanCat.slice(1);

        template = injectMetaTags(template, {
          title: `${displayCategory} News & Analysis | TechQuo News`,
          description: `Read the latest ${displayCategory} news, tech market insights, startup rounds, and industry analysis on TechQuo News.`,
          canonicalUrl: `${baseUrl}/${cleanCat}`,
          robots: "index, follow",
        });
        return res.status(200).set({ "Content-Type": "text/html" }).end(template);
      }

      // 4D. Homepage /
      if (pathname === "/" || pathname === "") {
        const websiteSchema = {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${baseUrl}/#organization`,
              "name": "TechQuo News",
              "url": baseUrl,
              "logo": {
                "@type": "ImageObject",
                "@id": `${baseUrl}/#logo`,
                "url": `${baseUrl}/logo.png`,
                "caption": "TechQuo News"
              },
              "sameAs": [
                "https://twitter.com/techquonews",
                "https://linkedin.com/company/techquonews"
              ]
            },
            {
              "@type": "WebSite",
              "@id": `${baseUrl}/#website`,
              "url": baseUrl,
              "name": "TechQuo News",
              "description": "A premium digital media and news publishing platform for African tech, fintech, venture capital, and startup insights.",
              "publisher": {
                "@id": `${baseUrl}/#organization`
              }
            }
          ]
        };

        template = injectMetaTags(template, {
          title: "TechQuo News | African Tech, FinTech & Startup Insights",
          description: "A premium digital media and news publishing platform for African tech, fintech, venture capital, and startup insights.",
          canonicalUrl: `${baseUrl}/`,
          robots: "index, follow",
          ogType: "website",
          schemaJson: websiteSchema,
        });

        return res.status(200).set({ "Content-Type": "text/html" }).end(template);
      }

      // 4E. Unknown Route -> Real HTTP 404
      template = injectMetaTags(template, {
        title: "Page Not Found | TechQuo News",
        description: "The page you are looking for does not exist on TechQuo News.",
        robots: "noindex, nofollow",
        bodyContent: generate404PrerenderHtml(baseUrl, "Page Not Found"),
      });
      return res.status(404).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      if (process.env.NODE_ENV !== "production" && vite) {
        vite.ssrFixStacktrace(e as Error);
      }
      next(e);
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
