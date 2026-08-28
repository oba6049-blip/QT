import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { createApp } from "./server/app";
import { getArticleByIdFromDb } from "./server/db";

// Load environment variables
dotenv.config();

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

  // Handle article routes for meta tag injection (OpenGraph & Twitter Cards)
  app.get("/article/:id", async (req, res, next) => {
    const { id } = req.params;
    try {
      let template: string;
      const indexHtmlPath = process.env.NODE_ENV !== "production"
        ? path.resolve(process.cwd(), "index.html")
        : path.resolve(process.cwd(), "dist/index.html");

      template = fs.readFileSync(indexHtmlPath, "utf-8");

      if (process.env.NODE_ENV !== "production" && vite) {
        template = await vite.transformIndexHtml(req.originalUrl, template);
      }

      // Fetch article data from MongoDB / persistent store
      const article = await getArticleByIdFromDb(id);

      if (article) {
        const title = `${article.title} | Quotient Africa`;
        const description = article.excerpt || "Read this article on Quotient Africa";
        const image = article.image || "/og-image.png";

        // Perform dynamic tag injection
        template = template
          .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
          .replace(/id="meta-description" content=".*?"/, `id="meta-description" content="${description}"`)
          .replace(/id="og-title" content=".*?"/, `id="og-title" content="${title}"`)
          .replace(/id="og-description" content=".*?"/, `id="og-description" content="${description}"`)
          .replace(/id="og-image" content=".*?"/, `id="og-image" content="${image}"`)
          .replace(/id="twitter-title" content=".*?"/, `id="twitter-title" content="${title}"`)
          .replace(/id="twitter-description" content=".*?"/, `id="twitter-description" content="${description}"`)
          .replace(/id="twitter-image" content=".*?"/, `id="twitter-image" content="${image}"`);
      }

      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      if (process.env.NODE_ENV !== "production" && vite) {
        vite.ssrFixStacktrace(e as Error);
      }
      next(e);
    }
  });

  // All other frontend routes serve index.html
  app.get("*", async (req, res, next) => {
    if (req.originalUrl.includes(".") && !req.originalUrl.endsWith(".html")) return next();

    try {
      let template: string;
      const indexHtmlPath = process.env.NODE_ENV !== "production"
        ? path.resolve(process.cwd(), "index.html")
        : path.resolve(process.cwd(), "dist/index.html");

      template = fs.readFileSync(indexHtmlPath, "utf-8");

      if (process.env.NODE_ENV !== "production" && vite) {
        template = await vite.transformIndexHtml(req.originalUrl, template);
      }
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
