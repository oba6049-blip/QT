import { MongoClient, ObjectId, Db } from "mongodb";
import { ARTICLES, AUTHORS, EVENTS } from "../src/constants";

// Configuration
let currentMongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "";
let currentDbName = process.env.MONGODB_DB_NAME || "techquo_news";

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
  contributors: any[] = [];
  events: any[] = [];
  experts: any[] = [];
  spotlights: any[] = [];
  subscribers: any[] = [];
  users: any[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    // Seed default real contributors
    this.contributors = [
      {
        _id: "contrib_hafsat",
        id: "contrib_hafsat",
        name: "Hafsat Itanola",
        slug: "hafsat-itanola",
        profileImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
        title: "Guest Contributor",
        contributorType: "guest",
        bio: "Hafsat Itanola is a financial writer and guest analyst examining ethical investment models, financial literacy, and personal wealth development in Nigeria.",
        longBio: "Hafsat Itanola is a guest contributor specializing in ethical finance, financial literacy advocacy, and sustainable wealth-building strategies within Nigeria and emerging African markets. Her work focuses on bridging information gaps for retail investors and promoting informed financial decision-making.",
        email: "hafsat.itanola@techquonews.com",
        showEmail: false,
        socialLinks: {
          linkedin: "https://linkedin.com",
          twitter: "https://x.com",
          website: "https://techquonews.com/contributors/hafsat-itanola"
        },
        expertise: ["FinTech", "Ethical Investing", "Financial Literacy", "Personal Finance"],
        status: "active",
        joinedAt: "August 2026",
        createdAt: new Date("2026-08-28").toISOString(),
      }
    ];

    // Seed default real articles
    this.articles = [
      {
        _id: "art_real_1",
        id: "art_real_1",
        title: "Halal Investing in Nigeria: A Practical Guide for Ethical Wealth Building",
        slug: "halal-investing-in-nigeria-a-practical-guide-for-ethical-wealth-building",
        category: "FinTech",
        contributorId: "contrib_hafsat",
        author: "Hafsat Itanola",
        authorDesignation: "Guest Contributor",
        authorImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
        postedBy: "user_root_admin",
        postedByName: "TechQuo News Editorial Team",
        date: "August 28, 2026",
        publishedAt: "2026-08-28T16:40:00Z",
        readTime: "6 min",
        image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=1200",
        excerpt: "A comprehensive analysis of Shariah-compliant investments, ethical financial instruments, and wealth accumulation opportunities in Nigeria.",
        content: `## Principles of Halal Investing\n\nHalal investing is rooted in ethical financial principles that prioritize transparency, risk-sharing, and social responsibility while avoiding interest (Riba) and prohibited commercial activities.\n\n## Practical Investment Vehicles in Nigeria\nFrom Sukuk sovereign bonds to ethical mutual funds, Nigerian retail investors have expanding avenues to align capital with core personal values.`,
        featured: true,
        trending: true,
        tags: ["FinTech", "Halal Investing", "Wealth Building", "Nigeria"],
        status: "published",
        createdAt: new Date("2026-08-28T16:40:00Z").toISOString(),
      },
      {
        _id: "art_real_2",
        id: "art_real_2",
        title: "The Hidden Cost of Financial Illiteracy in Nigeria",
        slug: "the-hidden-cost-of-financial-illiteracy-in-nigeria",
        category: "FinTech",
        contributorId: "contrib_hafsat",
        author: "Hafsat Itanola",
        authorDesignation: "Guest Contributor",
        authorImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
        postedBy: "user_root_admin",
        postedByName: "TechQuo News Editorial Team",
        date: "August 28, 2026",
        publishedAt: "2026-08-28T16:45:00Z",
        readTime: "7 min",
        image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1200",
        excerpt: "Examining how knowledge gaps in personal budgeting, predatory lending risks, and unvetted investment schemes impact economic stability.",
        content: `## The Compounding Burden of Financial Gaps\n\nFinancial illiteracy continues to exact a heavy toll across developing economies. Without foundational knowledge on risk assessment, debt compounding, and emergency planning, individuals remain vulnerable to preventable financial distress.`,
        featured: true,
        trending: true,
        tags: ["Financial Literacy", "Economics", "FinTech", "Personal Finance"],
        status: "published",
        createdAt: new Date("2026-08-28T16:45:00Z").toISOString(),
      }
    ];

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
          "create-contributor",
          "manage-contributors",
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
      registrationLink: "https://techquonews.com/events",
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
      website: "https://techquonews.com",
      contributionsCount: parseInt(author.stats.match(/\d+/)?.[0] || "30", 10),
      createdAt: new Date().toISOString(),
    }));

    // Seed spotlights
    this.spotlights = [
      {
        _id: "spotlight_1",
        id: "1",
        slug: "ngozi-adeleke-korapay-technologies",
        founderName: "Ngozi Adeleke",
        companyName: "KoraPay Technologies",
        title: "Pioneering Pan-African Cross-Border Settlement Rails",
        story: "How Ngozi Adeleke is architecting frictionless financial infrastructure connecting over 20 African currencies with global enterprise treasury desks.",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800",
        link: "https://korapay.com",
        author: "Nurudeen Subair",
        authorDesignation: "Editor-in-Chief",
        postedBy: "user_root_admin",
        postedByName: "Nurudeen Subair",
        createdAt: new Date().toISOString(),
      },
      {
        _id: "spotlight_2",
        id: "2",
        slug: "tariq-mansour-heliogrid-energy",
        founderName: "Tariq Mansour",
        companyName: "HelioGrid Energy",
        title: "Decentralized Micro-Grids for Clean Industrial Energy",
        story: "Deploying AI-monitored solar storage grids across Sub-Saharan manufacturing hubs to cut industrial power costs by over 45%.",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800",
        link: "https://heliogrid.energy",
        author: "Hafsat Itanola",
        authorDesignation: "FinTech & Wealth Columnist",
        postedBy: "user_root_admin",
        postedByName: "Nurudeen Subair",
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

// Helper to generate URL-safe slugs
export function generateSlug(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
      "Cloud Engineering Continues to Become One of the Most Important Skills for Technology Professionals",
      "The Future of Artificial Intelligence in Africa: From Foundation Models to Localized Solutions",
      "How Cloud Technology Is Transforming Businesses and Scale-ups Across Emerging Markets",
      "Pan-African Payment Rails: Why Real-Time Settlements Are Unlocking Intra-Continental Trade",
      "Building Resilient Distributed Systems for High-Volume Mobile Money Integrations",
    ];
    await (database.collection("articles") as any).deleteMany({
      $or: [
        { title: { $in: mockTitles } },
        { id: { $in: ["1", "2", "3", "4", "art_cloud_engineering_1", "art_ai_africa_2", "art_cloud_scaleup_3", "art_fintech_rails_4", "art_distributed_systems_5"] } },
        { _id: { $in: ["article_1", "article_2", "article_3", "article_4", "art_cloud_engineering_1", "art_ai_africa_2", "art_cloud_scaleup_3", "art_fintech_rails_4", "art_distributed_systems_5"] } },
      ],
    });

    // Remove legacy mock contributors
    await (database.collection("contributors") as any).deleteMany({
      $or: [
        { slug: { $in: ["oladosu-ibrahim", "elena-rodriguez", "dr-sarah-miller", "james-chen"] } },
        { name: { $in: ["Oladosu Ibrahim", "Elena Rodriguez", "Dr. Sarah Miller", "James Chen"] } },
      ],
    });
    console.log("[MongoDB] Cleaned any legacy mock articles and mock contributors.");

    // Sync all distinct authors from real articles into contributors if missing
    const realArticles = await database.collection("articles").find({}).toArray();
    for (const art of realArticles) {
      if (art.author && art.author.trim()) {
        const authorName = art.author.trim();
        const authorSlug = generateSlug(authorName);
        const existingContrib = await database.collection("contributors").findOne({
          $or: [{ name: authorName }, { slug: authorSlug }],
        });

        let contributorDocId = "";
        if (!existingContrib) {
          const newContrib = {
            name: authorName,
            slug: authorSlug,
            title: art.authorDesignation || "Contributor",
            profileImage: art.authorImage || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
            avatar: art.authorImage || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
            bio: `${authorName} is a technology and finance contributor at TechQuo News.`,
            longBio: `${authorName} covers market trends, financial technology, and digital innovations across Africa.`,
            email: `${authorSlug}@techquonews.com`,
            showEmail: false,
            socialLinks: {
              linkedin: "https://linkedin.com",
              twitter: "https://x.com",
            },
            expertise: [art.category || "Technology", "Africa"],
            status: "active",
            joinedAt: "August 2026",
            createdAt: new Date(),
          };
          const inserted = await database.collection("contributors").insertOne(newContrib as any);
          contributorDocId = inserted.insertedId.toString();
          console.log(`[MongoDB] Auto-registered contributor: ${authorName}`);
        } else {
          contributorDocId = existingContrib._id ? existingContrib._id.toString() : (existingContrib.id || "");
        }

        // Ensure article has slug, contributorId, and postedByName
        const updates: any = {};
        if (!art.slug) {
          updates.slug = generateSlug(art.title);
        }
        if (!art.contributorId && contributorDocId) {
          updates.contributorId = contributorDocId;
        }
        if (!art.postedByName) {
          updates.postedByName = "TechQuo News Editorial Team";
        }
        if (Object.keys(updates).length > 0) {
          await database.collection("articles").updateOne({ _id: art._id }, { $set: updates });
        }
      }
    }

    // Ensure all spotlights have postedByName, author attribution, and SEO slugs
    const existingSpotlights = await database.collection("spotlights").find({}).toArray();
    for (const spot of existingSpotlights) {
      const spotUpdates: any = {};
      if (!spot.postedByName) {
        spotUpdates.postedByName = "TechQuo News Editorial Team";
      }
      if (!spot.author) {
        spotUpdates.author = "TechQuo Editorial Staff";
      }
      if (!spot.authorDesignation) {
        spotUpdates.authorDesignation = "Staff Reporter";
      }
      if (!spot.slug) {
        spotUpdates.slug = generateSlug(`${spot.founderName || ""}-${spot.companyName || ""}`) || generateSlug(spot.title || `spotlight-${spot._id}`);
      }
      if (Object.keys(spotUpdates).length > 0) {
        await database.collection("spotlights").updateOne({ _id: spot._id }, { $set: spotUpdates });
      }
    }

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
// CONTRIBUTORS API
// -------------------------------------------------------------

export async function getContributorsFromDb(filter: { status?: string; contributorType?: string } = {}) {
  const database = await getDb();
  let rawContributors: any[] = [];

  if (database) {
    try {
      const query: any = {};
      if (filter.status) {
        query.status = filter.status;
      }
      if (filter.contributorType) {
        query.contributorType = filter.contributorType;
      }
      const docs = await database.collection("contributors").find(query).sort({ name: 1 }).toArray();
      rawContributors = docs.map(formatDoc);
    } catch (e) {
      console.error("[MongoDB] Error fetching contributors:", e);
    }
  }

  if (!rawContributors.length && !database) {
    let results = [...fallbackDb.contributors];
    if (filter.status) {
      results = results.filter((c) => c.status === filter.status);
    }
    if (filter.contributorType) {
      results = results.filter((c) => (c.contributorType || 'staff') === filter.contributorType);
    }
    rawContributors = results.map(formatDoc);
  }

  // Dynamically compute total published articles for each contributor
  const allArticles = await getRawArticlesList();
  return rawContributors.map((c) => {
    const matchingArticles = allArticles.filter((art) => {
      const matchId = art.contributorId && (art.contributorId === c.id || art.contributorId === c._id);
      const matchName = art.author && art.author.trim().toLowerCase() === c.name.trim().toLowerCase();
      return matchId || matchName;
    });
    return {
      ...c,
      totalArticles: matchingArticles.length,
      publishedArticlesCount: matchingArticles.length,
    };
  });
}

export async function getContributorByIdFromDb(idOrSlug: string) {
  if (!idOrSlug) return null;
  const cleanKey = idOrSlug.trim().toLowerCase();
  const database = await getDb();
  let foundDoc: any = null;

  if (database) {
    try {
      const objId = toObjectId(idOrSlug);
      const query: any = {
        $or: [
          { slug: { $regex: new RegExp(`^${cleanKey}$`, "i") } },
          { id: idOrSlug },
          { _id: idOrSlug as any },
        ],
      };
      if (objId) {
        query.$or.push({ _id: objId });
      }
      const doc = await database.collection("contributors").findOne(query);
      if (doc) foundDoc = formatDoc(doc);
    } catch (e) {
      console.error("[MongoDB] Error fetching contributor by id/slug:", e);
    }
  }

  if (!foundDoc) {
    const fallback = fallbackDb.contributors.find(
      (c) =>
        (c.slug && c.slug.toLowerCase() === cleanKey) ||
        c.id === idOrSlug ||
        c._id === idOrSlug ||
        (c.name && generateSlug(c.name) === cleanKey)
    );
    if (fallback) foundDoc = formatDoc(fallback);
  }

  if (!foundDoc) return null;

  // Enrich with live article count
  const allArticles = await getRawArticlesList();
  const matchingArticles = allArticles.filter((art) => {
    const matchId = art.contributorId && (art.contributorId === foundDoc.id || art.contributorId === foundDoc._id);
    const matchName = art.author && art.author.trim().toLowerCase() === foundDoc.name.trim().toLowerCase();
    return matchId || matchName;
  });

  return {
    ...foundDoc,
    totalArticles: matchingArticles.length,
    publishedArticlesCount: matchingArticles.length,
  };
}

export async function getContributorBySlugFromDb(slug: string) {
  return getContributorByIdFromDb(slug);
}

export async function createContributorInDb(data: any) {
  const database = await getDb();
  let baseSlug = generateSlug(data.slug || data.name || `contributor-${Date.now()}`);
  if (!baseSlug) baseSlug = `contributor-${Date.now()}`;

  // Ensure slug uniqueness
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await getContributorByIdFromDb(slug);
    if (!existing) break;
    slug = `${baseSlug}-${counter++}`;
  }

  const newContributor = {
    name: (data.name || "").trim(),
    slug: slug,
    title: (data.title || (data.contributorType === "guest" ? "Guest Contributor" : "Contributor")).trim(),
    contributorType: data.contributorType === "guest" ? "guest" : "staff",
    bio: (data.bio || "").trim(),
    longBio: (data.longBio || data.bio || "").trim(),
    profileImage: normalizeImageUrl(data.profileImage || data.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"),
    avatar: normalizeImageUrl(data.profileImage || data.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"),
    email: (data.email || "").trim().toLowerCase(),
    showEmail: Boolean(data.showEmail),
    socialLinks: {
      linkedin: data.socialLinks?.linkedin || data.linkedin || "",
      twitter: data.socialLinks?.twitter || data.twitter || "",
      website: data.socialLinks?.website || data.website || "",
      github: data.socialLinks?.github || data.github || "",
    },
    expertise: Array.isArray(data.expertise)
      ? data.expertise.filter(Boolean)
      : typeof data.expertise === "string"
      ? data.expertise.split(",").map((s: string) => s.trim()).filter(Boolean)
      : ["Technology"],
    status: data.status === "inactive" ? "inactive" : "active",
    joinedAt: data.joinedAt || new Date().toISOString().split("T")[0],
    createdAt: new Date().toISOString(),
  };

  if (database) {
    try {
      const res = await database.collection("contributors").insertOne(newContributor as any);
      return res.insertedId.toString();
    } catch (e) {
      console.error("[MongoDB] Error creating contributor:", e);
    }
  }

  const generatedId = `contrib_${Date.now()}`;
  fallbackDb.contributors.unshift({
    _id: generatedId,
    id: generatedId,
    ...newContributor,
  });
  return generatedId;
}

export async function updateContributorInDb(id: string, data: any) {
  const database = await getDb();
  const updates: any = { ...data };
  delete updates._id;
  delete updates.id;

  if (updates.slug) {
    updates.slug = generateSlug(updates.slug);
  }
  if (updates.profileImage) {
    updates.profileImage = normalizeImageUrl(updates.profileImage);
    updates.avatar = updates.profileImage;
  }
  if (updates.avatar && !updates.profileImage) {
    updates.profileImage = normalizeImageUrl(updates.avatar);
    updates.avatar = updates.profileImage;
  }
  if (typeof updates.expertise === "string") {
    updates.expertise = updates.expertise.split(",").map((s: string) => s.trim()).filter(Boolean);
  }
  updates.updatedAt = new Date().toISOString();

  if (database) {
    try {
      const objId = toObjectId(id);
      const query = objId ? { $or: [{ _id: objId }, { id: id }, { slug: id }] } : { $or: [{ id: id }, { slug: id }] };
      const res = await database.collection("contributors").updateOne(query, { $set: updates });
      return res.matchedCount > 0;
    } catch (e) {
      console.error("[MongoDB] Error updating contributor:", e);
    }
  }

  const idx = fallbackDb.contributors.findIndex((c) => c.id === id || c._id === id || c.slug === id);
  if (idx !== -1) {
    fallbackDb.contributors[idx] = { ...fallbackDb.contributors[idx], ...updates };
    return true;
  }
  return false;
}

export async function deleteContributorFromDb(id: string) {
  const database = await getDb();
  if (database) {
    try {
      const objId = toObjectId(id);
      const query = objId ? { $or: [{ _id: objId }, { id: id }, { slug: id }] } : { $or: [{ id: id }, { slug: id }] };
      const res = await database.collection("contributors").deleteOne(query);
      return res.deletedCount > 0;
    } catch (e) {
      console.error("[MongoDB] Error deleting contributor:", e);
    }
  }

  const initialLen = fallbackDb.contributors.length;
  fallbackDb.contributors = fallbackDb.contributors.filter((c) => c.id !== id && c._id !== id && c.slug !== id);
  return fallbackDb.contributors.length < initialLen;
}

// -------------------------------------------------------------
// ARTICLES API (WITH CONTRIBUTOR RELATIONSHIPS)
// -------------------------------------------------------------

// Internal helper to get raw articles list without circular enrichment
async function getRawArticlesList(): Promise<any[]> {
  const database = await getDb();
  if (database) {
    try {
      const docs = await database.collection("articles").find({}).sort({ createdAt: -1 }).toArray();
      if (docs.length) return docs.map(formatDoc);
    } catch (e) {
      console.error("[MongoDB] Error fetching raw articles:", e);
    }
  }
  return [...fallbackDb.articles].map(formatDoc);
}

// Helper to enrich article with resolved Contributor object & URL slug
async function enrichArticleWithContributor(articleDoc: any, contributorsList?: any[]): Promise<any> {
  if (!articleDoc) return null;
  const formatted = formatDoc(articleDoc);

  // Guarantee valid URL slug
  if (!formatted.slug && formatted.title) {
    formatted.slug = generateSlug(formatted.title);
  }

  const contributors = contributorsList || (await getContributorsFromDb());

  // Match contributor by contributorId, ID, or Author name
  let contributor: any = null;
  if (formatted.contributorId) {
    contributor = contributors.find(
      (c) => c.id === formatted.contributorId || c._id === formatted.contributorId || c.slug === formatted.contributorId
    );
  }
  if (!contributor && formatted.author) {
    const cleanAuthor = formatted.author.trim().toLowerCase();
    contributor = contributors.find((c) => c.name.trim().toLowerCase() === cleanAuthor);
  }

  if (contributor) {
    formatted.contributorId = contributor.id || contributor._id;
    formatted.contributor = {
      id: contributor.id || contributor._id,
      name: contributor.name,
      slug: contributor.slug || generateSlug(contributor.name),
      profileImage: contributor.profileImage || contributor.avatar,
      title: contributor.title,
      contributorType: contributor.contributorType || 'staff',
      bio: contributor.bio,
      longBio: contributor.longBio,
      socialLinks: contributor.socialLinks,
      expertise: contributor.expertise,
      status: contributor.status,
      joinedAt: contributor.joinedAt,
      totalArticles: contributor.totalArticles,
    };
    formatted.author = contributor.name;
    formatted.authorDesignation = contributor.title || formatted.authorDesignation || "Contributor";
    formatted.authorImage = contributor.profileImage || contributor.avatar || formatted.authorImage;
  }

  return formatted;
}

export async function getArticlesFromDb(
  filter: { featured?: boolean; category?: string; limit?: number; trending?: boolean; contributorId?: string; tag?: string } = {}
) {
  const database = await getDb();
  let rawDocs: any[] = [];

  if (database) {
    try {
      const query: any = {};
      if (filter.featured !== undefined) {
        query.featured = filter.featured;
      }
      if (filter.trending !== undefined) {
        query.trending = filter.trending;
      }
      if (filter.category) {
        query.category = { $regex: new RegExp(`^${filter.category}$`, "i") };
      }
      if (filter.contributorId) {
        query.$or = [{ contributorId: filter.contributorId }, { author: filter.contributorId }];
      }
      if (filter.tag) {
        query.tags = { $in: [new RegExp(`^${filter.tag}$`, "i")] };
      }

      let cursor = database.collection("articles").find(query).sort({ publishedAt: -1, createdAt: -1 });
      if (filter.limit) {
        cursor = cursor.limit(filter.limit);
      }
      rawDocs = await cursor.toArray();

      // If queried for featured or trending specifically but none had the explicit boolean,
      // fallback to the real latest articles in the DB
      if (!rawDocs.length && (filter.featured === true || filter.trending === true)) {
        let fallbackQuery: any = {};
        if (filter.category) {
          fallbackQuery.category = { $regex: new RegExp(`^${filter.category}$`, "i") };
        }
        let fallbackCursor = database.collection("articles").find(fallbackQuery).sort({ publishedAt: -1, createdAt: -1 });
        if (filter.limit) {
          fallbackCursor = fallbackCursor.limit(filter.limit);
        } else if (filter.featured) {
          fallbackCursor = fallbackCursor.limit(1);
        }
        rawDocs = await fallbackCursor.toArray();
      }
    } catch (e) {
      console.error("[MongoDB] Error fetching articles:", e);
    }
  }

  if (!rawDocs.length && !database) {
    let results = [...fallbackDb.articles];
    if (filter.featured !== undefined) {
      results = results.filter((a) => a.featured === filter.featured);
    }
    if (filter.trending !== undefined) {
      results = results.filter((a) => a.trending === filter.trending);
    }
    if (filter.category) {
      results = results.filter((a) => (a.category || "").toLowerCase() === filter.category!.toLowerCase());
    }
    if (filter.contributorId) {
      results = results.filter(
        (a) =>
          a.contributorId === filter.contributorId ||
          (a.author && a.author.toLowerCase() === filter.contributorId!.toLowerCase())
      );
    }
    if (filter.tag) {
      results = results.filter(
        (a) => Array.isArray(a.tags) && a.tags.some((t: string) => t.toLowerCase() === filter.tag!.toLowerCase())
      );
    }
    results.sort((a, b) => {
      const timeA = new Date(a.publishedAt || a.date || a.createdAt || 0).getTime();
      const timeB = new Date(b.publishedAt || b.date || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
    if (filter.limit) {
      results = results.slice(0, filter.limit);
    }
    rawDocs = results;
  }

  const contributors = await getContributorsFromDb();
  const enrichedArticles = await Promise.all(
    rawDocs.map((doc) => enrichArticleWithContributor(doc, contributors))
  );
  return enrichedArticles;
}

export async function getArticleByIdFromDb(idOrSlug: string) {
  if (!idOrSlug) return null;
  const cleanKey = idOrSlug.trim().toLowerCase();
  const database = await getDb();
  let foundDoc: any = null;

  if (database) {
    try {
      const objId = toObjectId(idOrSlug);
      const query: any = {
        $or: [
          { slug: { $regex: new RegExp(`^${cleanKey}$`, "i") } },
          { id: idOrSlug },
          { _id: idOrSlug as any },
        ],
      };
      if (objId) {
        query.$or.push({ _id: objId });
      }
      foundDoc = await database.collection("articles").findOne(query);
    } catch (e) {
      console.error("[MongoDB] Error fetching article by ID or slug:", e);
    }
  }

  if (!foundDoc) {
    foundDoc = fallbackDb.articles.find(
      (a) =>
        (a.slug && a.slug.toLowerCase() === cleanKey) ||
        a.id === idOrSlug ||
        a._id === idOrSlug ||
        (a.title && generateSlug(a.title) === cleanKey)
    );
  }

  if (!foundDoc) return null;

  return enrichArticleWithContributor(foundDoc);
}

export async function getArticleBySlugFromDb(slug: string) {
  return getArticleByIdFromDb(slug);
}

export async function getArticlesByContributorSlug(slugOrId: string) {
  const contributor = await getContributorByIdFromDb(slugOrId);
  if (!contributor) return [];

  const allArticles = await getArticlesFromDb();
  return allArticles.filter(
    (a) =>
      (a.contributorId && (a.contributorId === contributor.id || a.contributorId === contributor._id)) ||
      (a.author && a.author.trim().toLowerCase() === contributor.name.trim().toLowerCase())
  );
}

export async function createArticleInDb(data: any) {
  const database = await getDb();
  let slug = generateSlug(data.slug || data.title || `article-${Date.now()}`);
  if (!slug) slug = `article-${Date.now()}`;

  // If contributorId provided, look up contributor for sync
  let contributorName = data.author;
  let contributorDesignation = data.authorDesignation;
  let contributorImage = data.authorImage;

  if (data.contributorId) {
    const contributor = await getContributorByIdFromDb(data.contributorId);
    if (contributor) {
      contributorName = contributor.name;
      contributorDesignation = contributor.title;
      contributorImage = contributor.profileImage || contributor.avatar;
    }
  }

  // Handle date and backdating synchronization
  let dateStr = data.date || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  let publishedAt = data.publishedAt;
  if (!publishedAt && data.date) {
    const parsed = new Date(data.date);
    if (!isNaN(parsed.getTime())) {
      publishedAt = parsed.toISOString();
    }
  }
  if (!publishedAt) {
    publishedAt = new Date().toISOString();
  }

  const newArticle = {
    ...data,
    slug,
    author: contributorName || data.author || "Editorial Staff",
    authorDesignation: contributorDesignation || data.authorDesignation || "Contributor",
    authorImage: normalizeImageUrl(contributorImage || data.authorImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"),
    contributorId: data.contributorId || "",
    image: normalizeImageUrl(data.image),
    tags: Array.isArray(data.tags)
      ? data.tags.filter(Boolean)
      : typeof data.tags === "string"
      ? data.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
      : [],
    status: data.status || "published",
    date: dateStr,
    createdAt: data.createdAt || publishedAt,
    publishedAt: publishedAt,
  };

  if (database) {
    try {
      const res = await database.collection("articles").insertOne(newArticle as any);
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
  const updates: any = { ...data };
  delete updates._id;
  delete updates.id;

  if (updates.slug) {
    updates.slug = generateSlug(updates.slug);
  }
  if (updates.image) {
    updates.image = normalizeImageUrl(updates.image);
  }
  if (updates.contributorId) {
    const contributor = await getContributorByIdFromDb(updates.contributorId);
    if (contributor) {
      updates.author = contributor.name;
      updates.authorDesignation = contributor.title;
      updates.authorImage = contributor.profileImage || contributor.avatar;
    }
  }
  if (typeof updates.tags === "string") {
    updates.tags = updates.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
  }
  // Sync date & publishedAt for backdating
  if (updates.date && !updates.publishedAt) {
    const parsed = new Date(updates.date);
    if (!isNaN(parsed.getTime())) {
      updates.publishedAt = parsed.toISOString();
    }
  } else if (updates.publishedAt && !updates.date) {
    const parsed = new Date(updates.publishedAt);
    if (!isNaN(parsed.getTime())) {
      updates.date = parsed.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    }
  }
  updates.updatedAt = new Date().toISOString();

  if (database) {
    try {
      const objId = toObjectId(id);
      const query = objId ? { $or: [{ _id: objId }, { id: id }, { slug: id }] } : { $or: [{ id: id }, { slug: id }] };
      const res = await database.collection("articles").updateOne(query, { $set: updates });
      return res.matchedCount > 0;
    } catch (e) {
      console.error("[MongoDB] Error updating article:", e);
    }
  }

  const idx = fallbackDb.articles.findIndex((a) => a.id === id || a._id === id || a.slug === id);
  if (idx !== -1) {
    fallbackDb.articles[idx] = { ...fallbackDb.articles[idx], ...updates };
    return true;
  }
  return false;
}

export async function deleteArticleFromDb(id: string) {
  const database = await getDb();
  if (database) {
    try {
      const objId = toObjectId(id);
      const query = objId ? { $or: [{ _id: objId }, { id: id }, { slug: id }] } : { $or: [{ id: id }, { slug: id }] };
      const res = await database.collection("articles").deleteOne(query);
      return res.deletedCount > 0;
    } catch (e) {
      console.error("[MongoDB] Error deleting article:", e);
    }
  }

  const initialLen = fallbackDb.articles.length;
  fallbackDb.articles = fallbackDb.articles.filter((a) => a.id !== id && a._id !== id && a.slug !== id);
  return fallbackDb.articles.length < initialLen;
}

// -------------------------------------------------------------
// UNIFIED SEARCH API (CONTRIBUTORS & ARTICLES)
// -------------------------------------------------------------

export async function searchContentFromDb(query: string) {
  const cleanQuery = (query || "").trim().toLowerCase();
  if (!cleanQuery) {
    return { articles: [], contributors: [] };
  }

  const [allContributors, allArticles] = await Promise.all([
    getContributorsFromDb(),
    getArticlesFromDb(),
  ]);

  // Match contributors by name, title, bio, expertise, or slug
  const matchingContributors = allContributors.filter((c) => {
    const inName = c.name && c.name.toLowerCase().includes(cleanQuery);
    const inTitle = c.title && c.title.toLowerCase().includes(cleanQuery);
    const inBio = c.bio && c.bio.toLowerCase().includes(cleanQuery);
    const inSlug = c.slug && c.slug.toLowerCase().includes(cleanQuery);
    const inExpertise = Array.isArray(c.expertise) && c.expertise.some((e: string) => e.toLowerCase().includes(cleanQuery));
    return inName || inTitle || inBio || inSlug || inExpertise;
  });

  // Match articles by title, excerpt, content, tags, category, or author
  const matchingArticles = allArticles.filter((a) => {
    const inTitle = a.title && a.title.toLowerCase().includes(cleanQuery);
    const inExcerpt = a.excerpt && a.excerpt.toLowerCase().includes(cleanQuery);
    const inContent = a.content && a.content.toLowerCase().includes(cleanQuery);
    const inCategory = a.category && a.category.toLowerCase().includes(cleanQuery);
    const inAuthor = a.author && a.author.toLowerCase().includes(cleanQuery);
    const inTags = Array.isArray(a.tags) && a.tags.some((t: string) => t.toLowerCase().includes(cleanQuery));
    return inTitle || inExcerpt || inContent || inCategory || inAuthor || inTags;
  });

  return {
    contributors: matchingContributors,
    articles: matchingArticles,
  };
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

function enrichSpotlight(spotlight: any) {
  if (!spotlight) return null;
  const formatted = formatDoc(spotlight);
  if (formatted && !formatted.slug) {
    formatted.slug = generateSlug(`${formatted.founderName || ""}-${formatted.companyName || ""}`) || generateSlug(formatted.title || `spotlight-${formatted.id}`);
  }
  return formatted;
}

export async function getSpotlightsFromDb() {
  const database = await getDb();
  if (database) {
    try {
      const docs = await database.collection("spotlights").find({}).sort({ createdAt: -1 }).toArray();
      return docs.map(enrichSpotlight);
    } catch (e) {
      console.error("[MongoDB] Error fetching spotlights:", e);
    }
  }
  return fallbackDb.spotlights.map(enrichSpotlight);
}

export async function getSpotlightByIdFromDb(idOrSlug: string) {
  if (!idOrSlug) return null;
  const cleanKey = idOrSlug.trim().toLowerCase();
  const database = await getDb();
  let foundDoc: any = null;

  if (database) {
    try {
      const objId = toObjectId(idOrSlug);
      const query: any = {
        $or: [
          { slug: { $regex: new RegExp(`^${cleanKey}$`, "i") } },
          { id: idOrSlug },
          { _id: idOrSlug as any },
        ],
      };
      if (objId) {
        query.$or.push({ _id: objId });
      }
      const doc = await database.collection("spotlights").findOne(query);
      if (doc) foundDoc = doc;
    } catch (e) {
      console.error("[MongoDB] Error fetching spotlight by ID/slug:", e);
    }
  }

  if (!foundDoc) {
    const fallback = fallbackDb.spotlights.find(
      (s) =>
        (s.slug && s.slug.toLowerCase() === cleanKey) ||
        s.id === idOrSlug ||
        s._id === idOrSlug ||
        (s.founderName && s.companyName && generateSlug(`${s.founderName}-${s.companyName}`) === cleanKey) ||
        (s.title && generateSlug(s.title) === cleanKey)
    );
    if (fallback) foundDoc = fallback;
  }

  return enrichSpotlight(foundDoc);
}

export async function createSpotlightInDb(data: any) {
  const database = await getDb();
  let baseSlug = generateSlug(data.slug || `${data.founderName || ""}-${data.companyName || ""}` || data.title || `spotlight-${Date.now()}`);
  if (!baseSlug) baseSlug = `spotlight-${Date.now()}`;

  // Ensure unique slug
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await getSpotlightByIdFromDb(slug);
    if (!existing) break;
    slug = `${baseSlug}-${counter++}`;
  }

  const newSpotlight = {
    ...data,
    slug,
    createdAt: new Date().toISOString(),
  };

  if (database) {
    try {
      const res = await database.collection("spotlights").insertOne(newSpotlight as any);
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
  const updates: any = { ...data };
  delete updates._id;
  delete updates.id;

  if (updates.slug) {
    updates.slug = generateSlug(updates.slug);
  } else if (updates.founderName && updates.companyName && !data.slug) {
    // Keep existing or generate clean slug
    updates.slug = generateSlug(`${updates.founderName}-${updates.companyName}`);
  }
  updates.updatedAt = new Date().toISOString();

  if (database) {
    try {
      const objId = toObjectId(id);
      const query = objId ? { $or: [{ _id: objId }, { id: id }, { slug: id }] } : { $or: [{ id: id }, { slug: id }] };
      const res = await database.collection("spotlights").updateOne(query, { $set: updates });
      return res.matchedCount > 0;
    } catch (e) {
      console.error("[MongoDB] Error updating spotlight:", e);
    }
  }

  const idx = fallbackDb.spotlights.findIndex((s) => s.id === id || s._id === id || s.slug === id);
  if (idx !== -1) {
    fallbackDb.spotlights[idx] = { ...fallbackDb.spotlights[idx], ...updates };
    return true;
  }
  return false;
}

export async function deleteSpotlightFromDb(id: string) {
  const database = await getDb();
  if (database) {
    try {
      const objId = toObjectId(id);
      const query = objId ? { $or: [{ _id: objId }, { id: id }, { slug: id }] } : { $or: [{ id: id }, { _id: id as any }, { slug: id }] };
      const res = await database.collection("spotlights").deleteOne(query);
      return res.deletedCount > 0;
    } catch (e) {
      console.error("[MongoDB] Error deleting spotlight:", e);
    }
  }

  const initialLen = fallbackDb.spotlights.length;
  fallbackDb.spotlights = fallbackDb.spotlights.filter((s) => s.id !== id && s._id !== id && s.slug !== id);
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
  try {
    let database: Db | null = null;
    try {
      database = await getDb();
    } catch (dbErr) {
      console.warn("[MongoDB Status] getDb exception:", dbErr);
    }
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
          database.collection("articles").countDocuments().catch(() => 0),
          database.collection("events").countDocuments().catch(() => 0),
          database.collection("experts").countDocuments().catch(() => 0),
          database.collection("spotlights").countDocuments().catch(() => 0),
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
  } catch (err: any) {
    return {
      type: "in-memory-fallback",
      connected: false,
      connectionError: err?.message || "Status check error",
      dbName: currentDbName,
      host: "in-memory-store",
      counts: {
        articles: fallbackDb.articles.length,
        events: fallbackDb.events.length,
        experts: fallbackDb.experts.length,
        spotlights: fallbackDb.spotlights.length,
      },
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }
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
    password: data.password || "TechQuo2026!",
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
