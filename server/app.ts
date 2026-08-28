import express from "express";
import dotenv from "dotenv";
import {
  getArticlesFromDb,
  getArticleByIdFromDb,
  createArticleInDb,
  updateArticleInDb,
  deleteArticleFromDb,
  getEventsFromDb,
  getEventByIdFromDb,
  createEventInDb,
  updateEventInDb,
  deleteEventFromDb,
  getExpertsFromDb,
  getExpertByIdFromDb,
  createExpertInDb,
  updateExpertInDb,
  deleteExpertFromDb,
  getSpotlightsFromDb,
  getSpotlightByIdFromDb,
  createSpotlightInDb,
  updateSpotlightInDb,
  deleteSpotlightFromDb,
  addSubscriberToDb,
  getDbStatus,
  getMediaFromDb,
  saveMediaToDb,
  setRuntimeMongoConfig,
  getUsersFromDb,
  getUserByIdFromDb,
  getUserByEmailWithPassword,
  createUserInDb,
  updateUserInDb,
  deleteUserInDb,
  changeUserPasswordInDb
} from "./db";
import {
  uploadToS3,
  deleteFromS3,
  extractMediaKeys,
  getS3Status,
  testS3Upload,
  setRuntimeS3Config,
  getS3Config,
  fetchFromS3
} from "./s3";

// Load environment variables
dotenv.config();

export function createApp(): express.Application {
  const app = express();

  // Middleware for JSON and form data (with 10mb limit for images)
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // CORS headers
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // -------------------------------------------------------------
  // API ROUTES
  // -------------------------------------------------------------

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/status", async (req, res) => {
    try {
      const [dbStatus, s3Status] = await Promise.all([
        getDbStatus(),
        getS3Status()
      ]);
      res.json({
        ...dbStatus,
        storage: s3Status,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Storage / S3 specific status endpoint
  app.get("/api/storage/status", async (req, res) => {
    try {
      const s3Status = await getS3Status();
      const config = getS3Config();
      res.json({
        ...s3Status,
        hasKeys: config.hasKeys,
        bucket: config.bucket,
        region: config.region,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Storage S3 diagnostic test endpoint
  app.post("/api/storage/test", async (req, res) => {
    try {
      const { bucket, region } = req.body || {};
      const result = await testS3Upload(bucket, region);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Update runtime MongoDB configuration dynamically
  app.post("/api/database/config", async (req, res) => {
    try {
      const { uri, dbName } = req.body;
      setRuntimeMongoConfig({ uri, dbName });
      const dbStatus = await getDbStatus();
      res.json({ success: true, dbStatus, message: "Database configuration updated successfully" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Update runtime S3 configuration dynamically
  app.post("/api/storage/config", async (req, res) => {
    try {
      const { bucket, region, accessKeyId, secretAccessKey } = req.body;
      setRuntimeS3Config({ bucket, region, accessKeyId, secretAccessKey });
      const s3Status = await getS3Status();
      res.json({ success: true, s3Status, message: "Storage configuration updated successfully" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Helper function to serve media from MongoDB cache or authenticated AWS S3 fetch
  async function serveMedia(key: string, res: express.Response) {
    try {
      // 1. Check persistent database media store first
      const mediaDoc = await getMediaFromDb(key);
      if (mediaDoc && mediaDoc.data) {
        const buffer = Buffer.from(mediaDoc.data, "base64");
        res.set("Content-Type", mediaDoc.mimeType || "image/jpeg");
        res.set("Cache-Control", "public, max-age=31536000, immutable");
        res.set("Access-Control-Allow-Origin", "*");
        return res.send(buffer);
      }

      // 2. Fetch authenticated from AWS S3 (bypassing any bucket public blocks)
      const s3Data = await fetchFromS3(key);
      if (s3Data && s3Data.buffer) {
        res.set("Content-Type", s3Data.contentType || "image/jpeg");
        res.set("Cache-Control", "public, max-age=31536000, immutable");
        res.set("Access-Control-Allow-Origin", "*");
        
        // Cache in DB for fast future loads
        saveMediaToDb({
          key,
          data: s3Data.buffer.toString("base64"),
          mimeType: s3Data.contentType,
          fileName: key.split("/").pop() || "media_file",
          size: s3Data.buffer.length,
        }).catch(err => console.warn("[Media Cache] Background save warning:", err));

        return res.send(s3Data.buffer);
      }

      // 3. Fallback placeholder if not found
      return res.status(404).send("Media asset not found");
    } catch (err: any) {
      console.error("[Media Serve] Error serving key:", key, err);
      return res.status(500).send("Error loading media asset");
    }
  }

  // Media serving endpoints
  app.get("/api/media/:folder/:filename", async (req, res) => {
    const key = `${req.params.folder}/${req.params.filename}`;
    await serveMedia(key, res);
  });

  app.get("/api/media/:filename", async (req, res) => {
    const key = req.params.filename;
    await serveMedia(key, res);
  });

  // Direct media deletion endpoints
  app.delete("/api/media/:folder/:filename", async (req, res) => {
    try {
      const key = `${req.params.folder}/${req.params.filename}`;
      const result = await deleteFromS3(key);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/media/:filename", async (req, res) => {
    try {
      const key = req.params.filename;
      const result = await deleteFromS3(key);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Media proxy endpoint for remote / S3 URLs that lack CORS
  app.get("/api/media-proxy", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).send("No target url specified");
    }
    try {
      const s3Match = targetUrl.match(/https?:\/\/[^/]+\.amazonaws\.com\/(.+)/i);
      if (s3Match && s3Match[1]) {
        return await serveMedia(s3Match[1], res);
      }

      const response = await fetch(targetUrl);
      if (!response.ok) {
        return res.status(response.status).send("Failed to retrieve image from source");
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get("content-type") || "image/jpeg";
      res.set("Content-Type", contentType);
      res.set("Cache-Control", "public, max-age=86400");
      res.set("Access-Control-Allow-Origin", "*");
      return res.send(buffer);
    } catch (err: any) {
      return res.status(500).send("Proxy error: " + err.message);
    }
  });

  // Image Upload handler (AWS S3 Object Storage with resilient fallback)
  app.post("/api/upload", async (req, res) => {
    try {
      const { image, name, folder } = req.body;
      if (!image) {
        return res.status(400).json({ error: "No image payload provided" });
      }

      const result = await uploadToS3({
        fileData: image,
        fileName: name || "editorial_image",
        folder: folder || "editorial",
      });

      res.json({
        url: result.url,
        s3Url: result.s3Url,
        key: result.key,
        bucket: result.bucket,
        storageType: result.isS3 ? "aws-s3" : "database-media",
        name: name || "uploaded-image",
      });
    } catch (e: any) {
      console.error("Upload error in /api/upload:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // ---------------- ARTICLES ----------------
  app.get("/api/articles", async (req, res) => {
    try {
      const featured = req.query.featured !== undefined ? req.query.featured === "true" : undefined;
      const category = typeof req.query.category === "string" ? req.query.category : undefined;
      const trending = req.query.trending === "true";
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : (trending ? 6 : (featured ? 1 : 50));

      const articles = await getArticlesFromDb({ featured, category, limit, trending });
      res.json(articles);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/articles/:id", async (req, res) => {
    try {
      const article = await getArticleByIdFromDb(req.params.id);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      res.json(article);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/articles", async (req, res) => {
    try {
      const id = await createArticleInDb(req.body);
      res.status(201).json({ id, message: "Article created successfully" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/articles/:id", async (req, res) => {
    try {
      const success = await updateArticleInDb(req.params.id, req.body);
      res.json({ success });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/articles/:id", async (req, res) => {
    try {
      const article = await getArticleByIdFromDb(req.params.id);
      const success = await deleteArticleFromDb(req.params.id);

      // Auto-delete all associated images from S3 bucket and media storage
      if (article) {
        const keys = extractMediaKeys([
          article.image,
          article.thumbnail,
          article.content,
        ]);
        for (const key of keys) {
          try {
            await deleteFromS3(key);
          } catch (delErr) {
            console.warn(`[S3 Auto-delete] Error cleaning up image key '${key}':`, delErr);
          }
        }
      }

      res.json({ success });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---------------- EVENTS ----------------
  app.get("/api/events", async (req, res) => {
    try {
      const events = await getEventsFromDb();
      res.json(events);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await getEventByIdFromDb(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const id = await createEventInDb(req.body);
      res.status(201).json({ id, message: "Event created successfully" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/events/:id", async (req, res) => {
    try {
      const success = await updateEventInDb(req.params.id, req.body);
      res.json({ success });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      const event = await getEventByIdFromDb(req.params.id);
      const success = await deleteEventFromDb(req.params.id);

      // Auto-delete event image(s) from S3 bucket
      if (event) {
        const keys = extractMediaKeys([event.image, event.description]);
        for (const key of keys) {
          try {
            await deleteFromS3(key);
          } catch (delErr) {
            console.warn(`[S3 Auto-delete] Error cleaning up event image key '${key}':`, delErr);
          }
        }
      }

      res.json({ success });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---------------- EXPERTS ----------------
  app.get("/api/experts", async (req, res) => {
    try {
      const experts = await getExpertsFromDb();
      res.json(experts);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/experts/:id", async (req, res) => {
    try {
      const expert = await getExpertByIdFromDb(req.params.id);
      if (!expert) {
        return res.status(404).json({ error: "Expert not found" });
      }
      res.json(expert);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/experts", async (req, res) => {
    try {
      const id = await createExpertInDb(req.body);
      res.status(201).json({ id, message: "Expert created successfully" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/experts/:id", async (req, res) => {
    try {
      const success = await updateExpertInDb(req.params.id, req.body);
      res.json({ success });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/experts/:id", async (req, res) => {
    try {
      const expert = await getExpertByIdFromDb(req.params.id);
      const success = await deleteExpertFromDb(req.params.id);

      // Auto-delete expert avatar/image from S3 bucket
      if (expert) {
        const keys = extractMediaKeys([expert.avatar, expert.image, expert.bio]);
        for (const key of keys) {
          try {
            await deleteFromS3(key);
          } catch (delErr) {
            console.warn(`[S3 Auto-delete] Error cleaning up expert image key '${key}':`, delErr);
          }
        }
      }

      res.json({ success });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---------------- SPOTLIGHTS ----------------
  app.get("/api/spotlight", async (req, res) => {
    try {
      const spotlights = await getSpotlightsFromDb();
      res.json(spotlights);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/spotlight/:id", async (req, res) => {
    try {
      const spotlight = await getSpotlightByIdFromDb(req.params.id);
      if (!spotlight) {
        return res.status(404).json({ error: "Spotlight story not found" });
      }
      res.json(spotlight);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/spotlight", async (req, res) => {
    try {
      const id = await createSpotlightInDb(req.body);
      res.status(201).json({ id, message: "Spotlight story created successfully" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/spotlight/:id", async (req, res) => {
    try {
      const success = await updateSpotlightInDb(req.params.id, req.body);
      res.json({ success });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/spotlight/:id", async (req, res) => {
    try {
      const spotlight = await getSpotlightByIdFromDb(req.params.id);
      const success = await deleteSpotlightFromDb(req.params.id);

      // Auto-delete spotlight image from S3 bucket
      if (spotlight) {
        const keys = extractMediaKeys([spotlight.image, spotlight.story]);
        for (const key of keys) {
          try {
            await deleteFromS3(key);
          } catch (delErr) {
            console.warn(`[S3 Auto-delete] Error cleaning up spotlight image key '${key}':`, delErr);
          }
        }
      }

      res.json({ success });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---------------- NEWSLETTER ----------------
  app.post("/api/newsletter", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      await addSubscriberToDb(email);
      res.json({ success: true, message: "Subscribed successfully" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---------------- AUTHENTICATION & TEAM MANAGEMENT ----------------
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const cleanEmail = (email || "").toLowerCase().trim();

      if (!cleanEmail || !password) {
        return res.status(400).json({ error: "Please provide both email and password." });
      }

      // Check root superadmin hardcoded fallback if needed
      let user = await getUserByEmailWithPassword(cleanEmail);

      // If user not found in DB yet but matches root superadmin email and password, create or return root admin
      if (!user && cleanEmail === "subairnurudeen20@gmail.com" && password === "Subair__@09") {
        user = {
          id: "user_root_admin",
          email: "subairnurudeen20@gmail.com",
          password: "Subair__@09",
          displayName: "Nurudeen Subair",
          role: "superadmin",
          allowedTabs: [
            "create",
            "manage",
            "create-event",
            "manage-events",
            "create-expert",
            "manage-experts",
            "create-spotlight",
            "manage-spotlight",
            "storage",
            "team"
          ],
          designation: "Editor-in-Chief & Super Admin",
          status: "active",
        };
      }

      if (!user) {
        return res.status(401).json({ error: `Access restricted. ${cleanEmail} is not registered for editorial console.` });
      }

      if (user.status === "suspended") {
        return res.status(403).json({ error: "Your administrator account has been suspended. Please contact the Editor-in-Chief." });
      }

      // Check password
      if (user.password !== password) {
        if (cleanEmail === "subairnurudeen20@gmail.com" && password === "Subair__@09") {
          // Allowed for superadmin recovery
        } else {
          return res.status(401).json({ error: "Invalid password. Please check your credentials and try again." });
        }
      }

      // Update last login
      updateUserInDb(user.id || user._id, { lastLoginAt: new Date().toISOString() }).catch(() => {});

      const safeUserSession = {
        uid: user.id || user._id || `user_${cleanEmail}`,
        email: user.email,
        displayName: user.displayName || cleanEmail.split("@")[0],
        role: user.role || "author",
        allowedTabs: user.allowedTabs || ["create", "manage"],
        designation: user.designation || "Editorial Team Member",
        status: user.status || "active",
        mustChangePassword: user.mustChangePassword !== undefined ? Boolean(user.mustChangePassword) : false,
        emailVerified: true,
      };

      res.json({ success: true, user: safeUserSession });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Change password endpoint
  app.post("/api/auth/change-password", async (req, res) => {
    try {
      const { email, currentPassword, newPassword } = req.body;
      const cleanEmail = (email || "").toLowerCase().trim();

      if (!cleanEmail || !newPassword) {
        return res.status(400).json({ error: "Email and new password are required." });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long." });
      }

      const user = await getUserByEmailWithPassword(cleanEmail);
      if (!user && cleanEmail !== "subairnurudeen20@gmail.com") {
        return res.status(404).json({ error: "User account not found." });
      }

      // If user is not in mustChangePassword mode, verify current password
      if (user && !user.mustChangePassword && currentPassword) {
        if (user.password !== currentPassword && !(cleanEmail === "subairnurudeen20@gmail.com" && currentPassword === "Subair__@09")) {
          return res.status(401).json({ error: "Current password is incorrect." });
        }
      }

      await changeUserPasswordInDb(cleanEmail, newPassword);

      const updatedUser = await getUserByEmailWithPassword(cleanEmail);
      const safeUserSession = {
        uid: updatedUser?.id || updatedUser?._id || user?.id || `user_${cleanEmail}`,
        email: cleanEmail,
        displayName: updatedUser?.displayName || user?.displayName || cleanEmail.split("@")[0],
        role: updatedUser?.role || user?.role || "author",
        allowedTabs: updatedUser?.allowedTabs || user?.allowedTabs || ["create", "manage"],
        designation: updatedUser?.designation || user?.designation || "Editorial Team Member",
        status: updatedUser?.status || user?.status || "active",
        mustChangePassword: false,
        emailVerified: true,
      };

      res.json({ success: true, message: "Password updated successfully!", user: safeUserSession });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get all users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await getUsersFromDb();
      res.json(users);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Create a new staff user
  app.post("/api/users", async (req, res) => {
    try {
      const { email, password, displayName, role, allowedTabs, designation, status } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email address is required." });
      }
      if (!password) {
        return res.status(400).json({ error: "Password is required." });
      }

      const createdUser = await createUserInDb({
        email,
        password,
        displayName,
        role: role || "author",
        allowedTabs: Array.isArray(allowedTabs) ? allowedTabs : ["create", "manage"],
        designation: designation || "Editorial Team Member",
        status: status || "active",
      });

      res.status(201).json({ success: true, user: createdUser, message: "User account created successfully" });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Update existing staff user
  app.put("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const success = await updateUserInDb(id, updates);
      if (!success) {
        return res.status(404).json({ error: "User not found or no changes made." });
      }
      const updatedUser = await getUserByIdFromDb(id);
      res.json({ success: true, user: updatedUser, message: "User updated successfully" });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Delete staff user
  app.delete("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await getUserByIdFromDb(id);
      const success = await deleteUserInDb(id);

      // Auto-delete user avatar from S3 if present
      if (user) {
        const keys = extractMediaKeys([user.photoURL, (user as any).avatar]);
        for (const key of keys) {
          try {
            await deleteFromS3(key);
          } catch (delErr) {
            console.warn(`[S3 Auto-delete] Error cleaning up user image key '${key}':`, delErr);
          }
        }
      }

      res.json({ success, message: "User deleted successfully" });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  return app;
}

const app = createApp();
export default app;
