import { MongoClient, ObjectId, Db } from "mongodb";
import { ARTICLES, AUTHORS, EVENTS } from "../src/constants";

// Configuration
let currentMongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "";
let currentDbName = process.env.MONGODB_DB_NAME || "quotient_africa";

let client: MongoClient | null = null;
let db: Db | null = null;
let isConnected = false;
let lastConnectAttemptTime = 0;
let lastConnectError: string | null = null;
let connectPromise: Promise<Db | null> | null = null;
const RECONNECT_COOLDOWN_MS = 60000; // Wait 60s before retrying unreachable remote server

export function setRuntimeMongoConfig(config: { uri?: string; dbName?: string }) {
  if (config.uri !== undefined) {
    currentMongoUri = config.uri.trim();
  }
  if (config.dbName !== undefined) {
    currentDbName = config.dbName.trim();
  }
  // Reset connection state to allow immediate reconnect attempt
  if (client) {
    client.close().catch(() => {});
  }
  client = null;
  db = null;
  isConnected = false;
  lastConnectAttemptTime = 0;
  lastConnectError = null;
  connectPromise = null;
}

// In-memory fallback database for local/preview resilience when MONGODB_URI is not set
class FallbackDatabase {
  articles: any[] = [];
  events: any[] = [];
  experts: any[] = [];
  spotlights: any[] = [];
  subscribers: any[] = [];
  users: any[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    // No mock articles - starts pristine for user-published content
    this.articles = [];

    // Seed default root superadmin
    this.users = [
      {
        _id: "user_root_admin",
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
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
        createdBy: "system",
      }
    ];

    // Seed events
    this.events = EVENTS.map((e, idx) => ({
      _id: `event_${idx + 1}`,
      id: String(idx + 1),
      ...e,
      description: "Experience the future of finance, technology, and market innovations at our curated summit.",
      time: "10:00 AM - 4:00 PM GMT",
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800",
      registrationLink: "https://quotientsafrica.com/events",
      createdAt: new Date().toISOString(),
    }));

    // Seed experts
    this.experts = AUTHORS.map((author, idx) => ({
      _id: `expert_${idx + 1}`,
      id: String(idx + 1),
      name: author.name,
      title: author.role,
      bio: `Award-winning investigative tech journalist and analyst covering ${author.role} across Africa and emerging markets.`,
      image: author.avatar,
      twitter: `https://twitter.com/${author.name.toLowerCase().replace(/\s+/g, '')}`,
      linkedin: `https://linkedin.com/in/${author.name.toLowerCase().replace(/\s+/g, '')}`,
      website: "https://quotientsafrica.com",
      contributionsCount: parseInt(author.stats.match(/\d+/)?.[0] || "30", 10),
      createdAt: new Date().toISOString(),
    }));

    // Seed spotlights
    this.spotlights = [
      {
        _id: "spotlight_1",
        id: "1",
        founderName: "Ngozi Adeleke",
        companyName: "KoraPay Technologies",
        title: "Pioneering Pan-African Cross-Border Settlement Rails",
        story: "How Ngozi Adeleke is architecting frictionless financial infrastructure connecting over 20 African currencies with global enterprise treasury desks.",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800",
        link: "https://korapay.com",
        createdAt: new Date().toISOString(),
      },
      {
        _id: "spotlight_2",
        id: "2",
        founderName: "Tariq Mansour",
        companyName: "HelioGrid Energy",
        title: "Decentralized Micro-Grids for Clean Industrial Energy",
        story: "Deploying AI-monitored solar storage grids across Sub-Saharan manufacturing hubs to cut industrial power costs by over 45%.",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800",
        link: "https://heliogrid.energy",
        createdAt: new Date().toISOString(),
      }
    ];
  }
}

const fallbackDb = new FallbackDatabase();
const fallbackMediaCache = new Map<string, any>();

// Helper to normalize image URLs so AWS S3 URLs with private permissions are routed via reliable backend proxy
export function normalizeImageUrl(url?: string): string {
  if (!url) return "";
  // Check if it's an AWS S3 URL
  const s3Match = url.match(/^https?:\/\/[^.]+\.s3(?:[.-][^.]+)?\.amazonaws\.com\/(.+)$/i);
  if (s3Match && s3Match[1]) {
    return `/api/media/${s3Match[1]}`;
  }
  return url;
}

// Format MongoDB doc to client-compatible shape
function formatDoc(doc: any) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  const formatted: any = {
    id: _id ? _id.toString() : doc.id,
    ...rest,
  };
  if (formatted.image) {
    formatted.image = normalizeImageUrl(formatted.image);
  }
  if (formatted.avatar) {
    formatted.avatar = normalizeImageUrl(formatted.avatar);
  }
  return formatted;
}

// Convert string to ObjectId if valid
function toObjectId(id: string) {
  try {
    if (ObjectId.isValid(id) && id.length === 24) {
      return new ObjectId(id);
    }
  } catch {
    // Ignore and return query by string ID
  }
  return null;
}

// MongoDB connection manager with singleton promise & fast failover
export async function getDb(): Promise<Db | null> {
  if (db && isConnected) return db;
  if (!currentMongoUri) {
    return null;
  }

  // If a previous attempt recently failed, skip waiting and immediately use the in-memory fallback
  const now = Date.now();
  if (lastConnectError && now - lastConnectAttemptTime < RECONNECT_COOLDOWN_MS) {
    return null;
  }

  // Reuse ongoing connection promise if multiple requests arrive simultaneously
  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
    lastConnectAttemptTime = Date.now();
    let tempClient: MongoClient | null = null;
    try {
      tempClient = new MongoClient(currentMongoUri, {
        serverSelectionTimeoutMS: 2000,
        connectTimeoutMS: 2000,
      });

      await tempClient.connect();
      client = tempClient;
      db = client.db(currentDbName || undefined);
      isConnected = true;
      lastConnectError = null;
      console.log(`[MongoDB] Connected successfully to database: ${db.databaseName}`);
      await seedMongoIfEmpty(db);
      return db;
    } catch (error: any) {
      lastConnectError = error?.message || "Connection failed";
      isConnected = false;
      db = null;
      if (tempClient) {
        tempClient.close().catch(() => {});
      }
      client = null;

      // Log clean diagnostic once per cooldown window
      console.warn(
        `[MongoDB] Remote database (${currentMongoUri.split("@")[1]?.split("/")[0] || "endpoint"}) currently unreachable (${lastConnectError}). Seamlessly operating with robust in-memory database store.`
      );
      return null;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

// Auto clean mock articles and seed other collections if empty
async function seedMongoIfEmpty(database: Db) {
  try {
    // Actively purge any legacy mock articles
    const mockTitles = [
      "The Future of Quantum Computing in Fintech",
      "Sustainable Architecture: Building the Net-Zero Startups of Tomorrow",
      "Next-Gen Semiconductors: Beyond the 2nm Frontier",
      "The Rise of Autonomous Supply Chains",
    ];
    await (database.collection("articles") as any).deleteMany({
      $or: [
        { title: { $in: mockTitles } },
        { id: { $in: ["1", "2", "3", "4"] } },
        { _id: { $in: ["article_1", "article_2", "article_3", "article_4"] } },
      ],
    });
    console.log("[MongoDB] Cleaned any legacy mock articles.");

    const eventsCount = await database.collection("events").countDocuments();
    if (eventsCount === 0) {
      console.log("[MongoDB] Seeding events collection...");
      const eventsToSeed = fallbackDb.events.map(({ _id, id, ...rest }) => ({
        ...rest,
        createdAt: new Date(),
      }));
      await database.collection("events").insertMany(eventsToSeed);
    }

    const expertsCount = await database.collection("experts").countDocuments();
    if (expertsCount === 0) {
      console.log("[MongoDB] Seeding experts collection...");
      const expertsToSeed = fallbackDb.experts.map(({ _id, id, ...rest }) => ({
        ...rest,
        createdAt: new Date(),
      }));
      await database.collection("experts").insertMany(expertsToSeed);
    }

    const spotlightsCount = await database.collection("spotlights").countDocuments();
    if (spotlightsCount === 0) {
      console.log("[MongoDB] Seeding spotlights collection...");
      const spotlightsToSeed = fallbackDb.spotlights.map(({ _id, id, ...rest }) => ({
        ...rest,
        createdAt: new Date(),
      }));
      await database.collection("spotlights").insertMany(spotlightsToSeed);
    }

    const usersCount = await database.collection("users").countDocuments();
    if (usersCount === 0) {
      console.log("[MongoDB] Seeding root superadmin user...");
      const usersToSeed = fallbackDb.users.map(({ _id, id, ...rest }) => ({
        ...rest,
        createdAt: new Date(),
      }));
      await database.collection("users").insertMany(usersToSeed);
    }
  } catch (err) {
    console.error("[MongoDB] Error auto-seeding database:", err);
  }
}

// -------------------------------------------------------------
// ARTICLES API
// -------------------------------------------------------------

export async function getArticlesFromDb(filter: { featured?: boolean; category?: string; limit?: number; trending?: boolean } = {}) {
  const database = await getDb();
  if (database) {
    try {
      const query: any = {};
      if (filter.featured !== undefined) {
        query.featured = filter.featured;
      }
      if (filter.category) {
        query.category = { $regex: new RegExp(`^${filter.category}$`, "i") };
      }

      let cursor = database.collection("articles").find(query).sort({ createdAt: -1 });
      if (filter.limit) {
        cursor = cursor.limit(filter.limit);
      }
      const docs = await cursor.toArray();
      return docs.map(formatDoc);
    } catch (e) {
      console.error("[MongoDB] Error fetching articles:", e);
    }
  }

  // Fallback
  let results = [...fallbackDb.articles];
  if (filter.featured !== undefined) {
    results = results.filter((a) => a.featured === filter.featured);
  }
  if (filter.category) {
    results = results.filter((a) => a.category.toLowerCase() === filter.category!.toLowerCase());
  }
  if (filter.limit) {
    results = results.slice(0, filter.limit);
  }
  return results;
}

export async function getArticleByIdFromDb(id: string) {
  const database = await getDb();
  if (database) {
    try {
      const objId = toObjectId(id);
      const query = objId ? { $or: [{ _id: objId }, { id: id }, { _id: id as any }] } : { $or: [{ id: id }, { _id: id as any }] };
      const doc = await database.collection("articles").findOne(query);
      if (doc) return formatDoc(doc);
    } catch (e) {
      console.error("[MongoDB] Error fetching article by ID:", e);
    }
  }

  const found = fallbackDb.articles.find((a) => a.id === id || a._id === id);
  return found || null;
}

export async function createArticleInDb(data: any) {
  const database = await getDb();
  const newArticle = {
    ...data,
    createdAt: new Date(),
  };

  if (database) {
    try {
      const res = await database.collection("articles").insertOne(newArticle);
      return res.insertedId.toString();
    } catch (e) {
      console.error("[MongoDB] Error creating article:", e);
    }
  }

  const generatedId = `art_${Date.now()}`;
  fallbackDb.articles.unshift({
    _id: generatedId,
    id: generatedId,
    ...newArticle,
  });
  return generatedId;
}

export async function updateArticleInDb(id: string, data: any) {
  const database = await getDb();
  if (database) {
    try {
      const objId = toObjectId(id);
      const query = objId ? { $or: [{ _id: objId }, { id: id }] } : { id: id };
      const res = await database.collection("articles").updateOne(query, { $set: data });
      return res.matchedCount > 0;
    } catch (e) {
      console.error("[MongoDB] Error updating article:", e);
    }
  }

  const idx = fallbackDb.articles.findIndex((a) => a.id === id || a._id === id);
  if (idx !== -1) {
    fallbackDb.articles[idx] = { ...fallbackDb.articles[idx], ...data };
    return true;
  }
  return false;
}

export async function deleteArticleFromDb(id: string) {
  const database = await getDb();
  if (database) {
    try {
      const objId = toObjectId(id);
      const query = objId ? { $or: [{ _id: objId }, { id: id }] } : { $or: [{ id: id }, { _id: id as any }] };
      const res = await database.collection("articles").deleteOne(query);
      return res.deletedCount > 0;
    } catch (e) {
      console.error("[MongoDB] Error deleting article:", e);
    }
  }

  const initialLen = fallbackDb.articles.length;
  fallbackDb.articles = fallbackDb.articles.filter((a) => a.id !== id && a._id !== id);
  return fallbackDb.articles.length < initialLen;
}

// -------------------------------------------------------------
// EVENTS API
// -------------------------------------------------------------

export async function getEventsFromDb() {
  const database = await getDb();
  if (database) {
    try {
      const docs = await database.collection("events").find({}).sort({ date: 1 }).toArray();
      return docs.map(formatDoc);
    } catch (e) {
      console.error("[MongoDB] Error fetching events:", e);
    }
  }
  return [...fallbackDb.events];
}

export async function getEventByIdFromDb(id: string) {
  const database = await getDb();
  if (database) {
    try {
      const objId = toObjectId(id);
      const query = objId ? { $or: [{ _id: objId }, { id: id }] } : { $or: [{ id: id }, { _id: id as any }] };
      const doc = await database.collection("events").findOne(query);
      if (doc) return formatDoc(doc);
    } catch (e) {
      console.error("[MongoDB] Error fetching event by ID:", e);
    }
  }
  return fallbackDb.events.find((e) => e.id === id || e._id === id) || null;
}

export async function createEventInDb(data: any) {
  const database = await getDb();
  const newEvent = {
    ...data,
    createdAt: new Date(),
  };

  if (database) {
    try {
      const res = await database.collection("events").insertOne(newEvent);
      return res.insertedId.toString();
    } catch (e) {
      console.error("[MongoDB] Error creating event:", e);
    }
  }

  const generatedId = `evt_${Date.now()}`;
  fallbackDb.events.unshift({
    _id: generatedId,
    id: generatedId,
    ...newEvent,
  });
  return generatedId;
}

export async function updateEventInDb(id: string, data: any) {
  const database = await getDb();
  if (database) {
    try {
      const objId = toObjectId(id);
      const query = objId ? { $or: [{ _id: objId }, { id: id }] } : { id: id };
      const res = await database.collection("events").updateOne(query, { $set: data });
      return res.matchedCount > 0;
    } catch (e) {
      console.error("[MongoDB] Error updating event:", e);
    }
  }

  const idx = fallbackDb.events.findIndex((e) => e.id === id || e._id === id);
  if (idx !== -1) {
    fallbackDb.events[idx] = { ...fallbackDb.events[idx], ...data };
    return true;
  }
  return false;
}

export async function deleteEventFromDb(id: string) {
  const database = await getDb();
  if (database) {
    try {
      const objId = toObjectId(id);
      const query = objId ? { $or: [{ _id: objId }, { id: id }] } : { $or: [{ id: id }, { _id: id as any }] };
      const res = await database.collection("events").deleteOne(query);
      return res.deletedCount > 0;
    } catch (e) {
      console.error("[MongoDB] Error deleting event:", e);
    }
  }

  const initialLen = fallbackDb.events.length;
  fallbackDb.events = fallbackDb.events.filter((e) => e.id !== id && e._id !== id);
  return fallbackDb.events.length < initialLen;
}

// -------------------------------------------------------------
// EXPERTS API
// -------------------------------------------------------------

export async function getExpertsFromDb() {
  const database = await getDb();
  if (database) {
    try {
      const docs = await database.collection("experts").find({}).sort({ name: 1 }).toArray();
      return docs.map(formatDoc);
    } catch (e) {
      console.error("[MongoDB] Error fetching experts:", e);
    }
  }
  return [...fallbackDb.experts];
}

export async function getExpertByIdFromDb(id: string) {
  const database = await getDb();
  if (database) {
    try {
      const objId = toObjectId(id);
      const query = objId ? { $or: [{ _id: objId }, { id: id }] } : { $or: [{ id: id }, { _id: id as any }] };
      const doc = await database.collection("experts").findOne(query);
      if (doc) return formatDoc(doc);
    } catch (e) {
      console.error("[MongoDB] Error fetching expert by ID:", e);
    }
  }
  return fallbackDb.experts.find((ex) => ex.id === id || ex._id === id) || null;
}

export async function createExpertInDb(data: any) {
  const database = await getDb();
  const newExpert = {
    ...data,
    createdAt: new Date(),
  };

  if (database) {
    try {
      const res = await database.collection("experts").insertOne(newExpert);
      return res.insertedId.toString();
    } catch (e) {
      console.error("[MongoDB] Error creating expert:", e);
    }
  }

  const generatedId = `exp_${Date.now()}`;
  fallbackDb.experts.push({
    _id: generatedId,
    id: generatedId,
    ...newExpert,
  });
  return generatedId;
}

export async function updateExpertInDb(id: string, data: any) {
  const database = await getDb();
  if (database) {
    try {
      const objId = toObjectId(id);
      const query = objId ? { $or: [{ _id: objId }, { id: id }] } : { id: id };
      const res = await database.collection("experts").updateOne(query, { $set: data });
      return res.matchedCount > 0;
    } catch (e) {
      console.error("[MongoDB] Error updating expert:", e);
    }
  }

  const idx = fallbackDb.experts.findIndex((ex) => ex.id === id || ex._id === id);
  if (idx !== -1) {
    fallbackDb.experts[idx] = { ...fallbackDb.experts[idx], ...data };
    return true;
  }
  return false;
}

export async function deleteExpertFromDb(id: string) {
  const database = await getDb();
  if (database) {
    try {
      const objId = toObjectId(id);
      const query = objId ? { $or: [{ _id: objId }, { id: id }] } : { $or: [{ id: id }, { _id: id as any }] };
      const res = await database.collection("experts").deleteOne(query);
      return res.deletedCount > 0;
    } catch (e) {
      console.error("[MongoDB] Error deleting expert:", e);
    }
  }

  const initialLen = fallbackDb.experts.length;
  fallbackDb.experts = fallbackDb.experts.filter((ex) => ex.id !== id && ex._id !== id);
  return fallbackDb.experts.length < initialLen;
}

// -------------------------------------------------------------
// SPOTLIGHTS API
// -------------------------------------------------------------

export async function getSpotlightsFromDb() {
  const database = await getDb();
  if (database) {
    try {
      const docs = await database.collection("spotlights").find({}).sort({ createdAt: -1 }).toArray();
      return docs.map(formatDoc);
    } catch (e) {
      console.error("[MongoDB] Error fetching spotlights:", e);
    }
  }
  return [...fallbackDb.spotlights];
}

export async function getSpotlightByIdFromDb(id: string) {
  const database = await getDb();
  if (database) {
    try {
      const objId = toObjectId(id);
      const query = objId ? { $or: [{ _id: objId }, { id: id }] } : { $or: [{ id: id }, { _id: id as any }] };
      const doc = await database.collection("spotlights").findOne(query);
      if (doc) return formatDoc(doc);
    } catch (e) {
      console.error("[MongoDB] Error fetching spotlight by ID:", e);
    }
  }
  return fallbackDb.spotlights.find((s) => s.id === id || s._id === id) || null;
}

export async function createSpotlightInDb(data: any) {
  const database = await getDb();
  const newSpotlight = {
    ...data,
    createdAt: new Date(),
  };

  if (database) {
    try {
      const res = await database.collection("spotlights").insertOne(newSpotlight);
      return res.insertedId.toString();
    } catch (e) {
      console.error("[MongoDB] Error creating spotlight:", e);
    }
  }

  const generatedId = `spot_${Date.now()}`;
  fallbackDb.spotlights.unshift({
    _id: generatedId,
    id: generatedId,
    ...newSpotlight,
  });
  return generatedId;
}

export async function updateSpotlightInDb(id: string, data: any) {
  const database = await getDb();
  if (database) {
    try {
      const objId = toObjectId(id);
      const query = objId ? { $or: [{ _id: objId }, { id: id }] } : { id: id };
      const res = await database.collection("spotlights").updateOne(query, { $set: data });
      return res.matchedCount > 0;
    } catch (e) {
      console.error("[MongoDB] Error updating spotlight:", e);
    }
  }

  const idx = fallbackDb.spotlights.findIndex((s) => s.id === id || s._id === id);
  if (idx !== -1) {
    fallbackDb.spotlights[idx] = { ...fallbackDb.spotlights[idx], ...data };
    return true;
  }
  return false;
}

export async function deleteSpotlightFromDb(id: string) {
  const database = await getDb();
  if (database) {
    try {
      const objId = toObjectId(id);
      const query = objId ? { $or: [{ _id: objId }, { id: id }] } : { $or: [{ id: id }, { _id: id as any }] };
      const res = await database.collection("spotlights").deleteOne(query);
      return res.deletedCount > 0;
    } catch (e) {
      console.error("[MongoDB] Error deleting spotlight:", e);
    }
  }

  const initialLen = fallbackDb.spotlights.length;
  fallbackDb.spotlights = fallbackDb.spotlights.filter((s) => s.id !== id && s._id !== id);
  return fallbackDb.spotlights.length < initialLen;
}

// -------------------------------------------------------------
// NEWSLETTER SUBSCRIBERS
// -------------------------------------------------------------

export async function addSubscriberToDb(email: string) {
  const database = await getDb();
  const sub = { email: email.toLowerCase().trim(), subscribedAt: new Date() };

  if (database) {
    try {
      await database.collection("subscribers").updateOne(
        { email: sub.email },
        { $setOnInsert: sub },
        { upsert: true }
      );
      return true;
    } catch (e) {
      console.error("[MongoDB] Error adding subscriber:", e);
    }
  }

  if (!fallbackDb.subscribers.some((s) => s.email === sub.email)) {
    fallbackDb.subscribers.push(sub);
  }
  return true;
}

// -------------------------------------------------------------
// STATUS / HEALTH
// -------------------------------------------------------------

export async function getDbStatus() {
  const startTime = Date.now();
  const database = await getDb();
  const latencyMs = Date.now() - startTime;

  let counts = { articles: 0, events: 0, experts: 0, spotlights: 0 };
  let hostInfo = "in-memory-store";

  if (currentMongoUri) {
    const match = currentMongoUri.match(/@([^/?]+)/);
    if (match && match[1]) {
      hostInfo = match[1];
    } else {
      hostInfo = "custom-mongo-host";
    }
  }

  if (database) {
    try {
      const [articles, events, experts, spotlights] = await Promise.all([
        database.collection("articles").countDocuments(),
        database.collection("events").countDocuments(),
        database.collection("experts").countDocuments(),
        database.collection("spotlights").countDocuments(),
      ]);
      counts = { articles, events, experts, spotlights };
    } catch (e) {
      console.error("Error fetching db counts:", e);
    }
  } else {
    counts = {
      articles: fallbackDb.articles.length,
      events: fallbackDb.events.length,
      experts: fallbackDb.experts.length,
      spotlights: fallbackDb.spotlights.length,
    };
  }

  return {
    type: database ? "mongodb" : "in-memory-fallback",
    connected: !!database,
    connectionError: lastConnectError,
    dbName: database ? database.databaseName : currentDbName,
    host: hostInfo,
    counts,
    latencyMs,
    timestamp: new Date().toISOString(),
  };
}

// -------------------------------------------------------------
// MEDIA STORAGE (High-res binaries, base64 payloads & S3 sync)
// -------------------------------------------------------------

export async function saveMediaToDb(media: {
  key: string;
  data: string;
  mimeType: string;
  fileName: string;
  size: number;
}): Promise<boolean> {
  const database = await getDb();
  if (database) {
    try {
      await database.collection("media").updateOne(
        { key: media.key },
        {
          $set: {
            ...media,
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
      return true;
    } catch (e) {
      console.error("[MongoDB] Error saving media document:", e);
    }
  }
  fallbackMediaCache.set(media.key, {
    ...media,
    createdAt: new Date(),
  });
  return true;
}

export async function getMediaFromDb(key: string): Promise<{
  data: string;
  mimeType: string;
  fileName?: string;
  size?: number;
} | null> {
  const database = await getDb();
  if (database) {
    try {
      const doc = await database.collection("media").findOne({ key });
      if (doc) {
        return {
          data: doc.data,
          mimeType: doc.mimeType || "image/jpeg",
          fileName: doc.fileName,
          size: doc.size,
        };
      }
    } catch (e) {
      console.error("[MongoDB] Error getting media document:", e);
    }
  }
  const cached = fallbackMediaCache.get(key);
  if (cached) {
    return {
      data: cached.data,
      mimeType: cached.mimeType || "image/jpeg",
      fileName: cached.fileName,
      size: cached.size,
    };
  }
  return null;
}

export async function deleteMediaFromDb(key: string): Promise<boolean> {
  const database = await getDb();
  if (database) {
    try {
      const res = await database.collection("media").deleteOne({ key });
      fallbackMediaCache.delete(key);
      return res.deletedCount > 0;
    } catch (e) {
      console.error("[MongoDB] Error deleting media document:", e);
    }
  }
  const existed = fallbackMediaCache.has(key);
  fallbackMediaCache.delete(key);
  return existed;
}

// -------------------------------------------------------------
// USER MANAGEMENT & RBAC API
// -------------------------------------------------------------

export async function getUsersFromDb() {
  const database = await getDb();
  if (database) {
    try {
      const docs = await database.collection("users").find({}).sort({ createdAt: -1 }).toArray();
      return docs.map((d) => {
        const formatted = formatDoc(d);
        const { password, ...safeUser } = formatted;
        return safeUser;
      });
    } catch (e) {
      console.error("[MongoDB] Error fetching users:", e);
    }
  }
  return fallbackDb.users.map((u) => {
    const { password, ...safeUser } = u;
    return { ...safeUser };
  });
}

export async function getUserByIdFromDb(id: string) {
  const database = await getDb();
  if (database) {
    try {
      const objId = toObjectId(id);
      const query = objId ? { $or: [{ _id: objId }, { id: id }] } : { $or: [{ id: id }, { _id: id as any }] };
      const doc = await database.collection("users").findOne(query);
      if (doc) {
        const formatted = formatDoc(doc);
        const { password, ...safeUser } = formatted;
        return safeUser;
      }
    } catch (e) {
      console.error("[MongoDB] Error fetching user by ID:", e);
    }
  }
  const u = fallbackDb.users.find((user) => user.id === id || user._id === id);
  if (!u) return null;
  const { password, ...safeUser } = u;
  return { ...safeUser };
}

export async function getUserByEmailWithPassword(email: string) {
  const cleanEmail = email.toLowerCase().trim();
  const database = await getDb();
  if (database) {
    try {
      const doc = await database.collection("users").findOne({ email: cleanEmail });
      if (doc) return formatDoc(doc);
    } catch (e) {
      console.error("[MongoDB] Error fetching user by email:", e);
    }
  }
  return fallbackDb.users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
}

export async function createUserInDb(data: any) {
  const cleanEmail = (data.email || "").toLowerCase().trim();
  if (!cleanEmail) throw new Error("Email address is required");

  // Check uniqueness
  const existing = await getUserByEmailWithPassword(cleanEmail);
  if (existing) {
    throw new Error(`A user with email ${cleanEmail} already exists`);
  }

  const generatedId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newUser = {
    id: generatedId,
    email: cleanEmail,
    password: data.password || "Quotient2026!",
    displayName: data.displayName || cleanEmail.split("@")[0],
    role: data.role || "author",
    allowedTabs: Array.isArray(data.allowedTabs) && data.allowedTabs.length > 0 
      ? data.allowedTabs 
      : ["create", "manage"],
    designation: data.designation || "Editorial Contributor",
    status: data.status || "active",
    mustChangePassword: data.mustChangePassword !== undefined ? data.mustChangePassword : true,
    createdAt: new Date().toISOString(),
    createdBy: data.createdBy || "system",
  };

  const database = await getDb();
  if (database) {
    try {
      await database.collection("users").insertOne(newUser);
      const { password, ...safeUser } = newUser;
      return safeUser;
    } catch (e) {
      console.error("[MongoDB] Error creating user:", e);
    }
  }

  fallbackDb.users.push(newUser);
  const { password, ...safeUser } = newUser;
  return safeUser;
}

export async function changeUserPasswordInDb(email: string, newPassword: string) {
  const cleanEmail = (email || "").toLowerCase().trim();
  if (!cleanEmail || !newPassword) {
    throw new Error("Email and new password are required.");
  }

  const database = await getDb();
  if (database) {
    try {
      const res = await database.collection("users").updateOne(
        { email: cleanEmail },
        { 
          $set: { 
            password: newPassword, 
            mustChangePassword: false,
            passwordChangedAt: new Date().toISOString()
          } 
        }
      );
      if (res.matchedCount > 0) return true;
    } catch (e) {
      console.error("[MongoDB] Error updating user password:", e);
    }
  }

  const idx = fallbackDb.users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
  if (idx !== -1) {
    fallbackDb.users[idx].password = newPassword;
    fallbackDb.users[idx].mustChangePassword = false;
    fallbackDb.users[idx].passwordChangedAt = new Date().toISOString();
    return true;
  }

  // If root admin offline
  if (cleanEmail === "subairnurudeen20@gmail.com") {
    return true;
  }

  return false;
}

export async function updateUserInDb(id: string, updates: any) {
  const sanitizedUpdates = { ...updates };
  delete sanitizedUpdates._id;
  delete sanitizedUpdates.id;
  if (sanitizedUpdates.email) {
    sanitizedUpdates.email = sanitizedUpdates.email.toLowerCase().trim();
  }

  const database = await getDb();
  if (database) {
    try {
      const objId = toObjectId(id);
      const query = objId ? { $or: [{ _id: objId }, { id: id }] } : { $or: [{ id: id }, { _id: id as any }] };
      const res = await database.collection("users").updateOne(query, { $set: sanitizedUpdates });
      return res.matchedCount > 0;
    } catch (e) {
      console.error("[MongoDB] Error updating user:", e);
    }
  }

  const idx = fallbackDb.users.findIndex((u) => u.id === id || u._id === id);
  if (idx !== -1) {
    fallbackDb.users[idx] = { ...fallbackDb.users[idx], ...sanitizedUpdates };
    return true;
  }
  return false;
}

export async function deleteUserInDb(id: string) {
  // Prevent deleting root superadmin
  const user = await getUserByIdFromDb(id);
  if (user && (user.email || "").toLowerCase() === "subairnurudeen20@gmail.com") {
    throw new Error("The primary super administrator account cannot be deleted.");
  }
  if (id.toLowerCase() === "subairnurudeen20@gmail.com") {
    throw new Error("The primary super administrator account cannot be deleted.");
  }

  const database = await getDb();
  if (database) {
    try {
      const objId = toObjectId(id);
      const query = objId 
        ? { $or: [{ _id: objId }, { id: id }, { email: id.toLowerCase() }] } 
        : { $or: [{ id: id }, { _id: id as any }, { email: id.toLowerCase() }] };
      const res = await database.collection("users").deleteOne(query);
      
      fallbackDb.users = fallbackDb.users.filter(
        (u) => u.id !== id && u._id !== id && u.email.toLowerCase() !== id.toLowerCase()
      );
      if (res.deletedCount > 0) {
        return true;
      }
    } catch (e) {
      console.error("[MongoDB] Error deleting user:", e);
    }
  }

  const initialLen = fallbackDb.users.length;
  fallbackDb.users = fallbackDb.users.filter(
    (u) => u.id !== id && u._id !== id && u.email.toLowerCase() !== id.toLowerCase()
  );
  return fallbackDb.users.length < initialLen;
}
