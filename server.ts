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
  toAbsoluteUrl,
  cleanPlainText
} from "./server/seo";

// Load environment variables
dotenv.config();

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
}) {
  let output = html;
  const siteName = getSiteName();
  const baseUrl = options.baseUrl || "https://techquonews.com";
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
        const publishedCount = allArticles.filter(
          (a) => a.status === "published" && 
                 (a.contributorId === contributor.id || a.contributorId === contributor._id || 
                  (a.author && a.author.toLowerCase().trim() === contributor.name.toLowerCase().trim()))
        ).length;

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
        });
      }

      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      if (process.env.NODE_ENV !== "production" && vite) {
        vite.ssrFixStacktrace(e as Error);
      }
      next(e);
    }
  });

  // 2. Legacy /article/:id route
  app.get("/article/:id", async (req, res, next) => {
    const { id } = req.params;
    try {
      let template = await loadTemplate(req.originalUrl);
      const baseUrl = getBaseUrl(req);
      const article = await getArticleByIdFromDb(id);

      if (article) {
        const catSlug = normalizeCategorySlug(article.category);
        const artSlug = article.slug || article.id || id;
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
        });
      }

      res.status(200).set({ "Content-Type": "text/html" }).end(template);
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
        });

        return res.status(200).set({ "Content-Type": "text/html" }).end(template);
      }

      // If not found, pass to SPA fallback
      next();
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
        });

        return res.status(200).set({ "Content-Type": "text/html" }).end(template);
      }

      // If not article, pass down
      next();
    } catch (e) {
      if (process.env.NODE_ENV !== "production" && vite) {
        vite.ssrFixStacktrace(e as Error);
      }
      next(e);
    }
  });

  // 4. Catch-all for Category, Static, Admin, and Homepage SSR Tag Injection
  app.get("*", async (req, res, next) => {
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

      res.status(200).set({ "Content-Type": "text/html" }).end(template);
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
