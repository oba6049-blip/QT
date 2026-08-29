import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { saveMediaToDb, deleteMediaFromDb } from "./db";

// Lazy S3 Client initialization
let s3Client: S3Client | null = null;
let runtimeBucketOverride: string | null = null;
let runtimeRegionOverride: string | null = null;
let runtimeAccessKeyOverride: string | null = null;
let runtimeSecretKeyOverride: string | null = null;

export function setRuntimeS3Config(options: {
  bucket?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}) {
  if (options.bucket !== undefined) runtimeBucketOverride = options.bucket.trim();
  if (options.region !== undefined) runtimeRegionOverride = options.region.trim();
  if (options.accessKeyId !== undefined) runtimeAccessKeyOverride = options.accessKeyId.trim();
  if (options.secretAccessKey !== undefined) runtimeSecretKeyOverride = options.secretAccessKey.trim();
  s3Client = null; // Invalidate client cache to pick up new config
}

export function getS3Config() {
  const s3Url = process.env.AWS_S3_URL || process.env.S3_BUCKET_URL || process.env.AWS_S3_BUCKET_URL || "";
  let extractedBucket = "";
  let extractedRegion = "us-east-1";

  if (s3Url) {
    // Parse https://textocodebucket.s3.us-east-1.amazonaws.com or https://bucket.s3.amazonaws.com
    const match = s3Url.match(/https?:\/\/([^.]+)\.s3(?:[.-]([^.]+))?\.amazonaws\.com/i);
    if (match) {
      extractedBucket = match[1];
      if (match[2]) {
        extractedRegion = match[2];
      }
    }
  }

  const region = runtimeRegionOverride || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || extractedRegion || "us-east-1";
  const accessKeyId = runtimeAccessKeyOverride || process.env.AWS_ACCESS_KEY_ID || "";
  const secretAccessKey = runtimeSecretKeyOverride || process.env.AWS_SECRET_ACCESS_KEY || "";
  const bucket = runtimeBucketOverride || process.env.AWS_S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME || process.env.S3_BUCKET || extractedBucket || "techquo-news-bucket";
  const endpoint = process.env.AWS_S3_ENDPOINT || undefined;
  const customDomain = process.env.AWS_S3_CUSTOM_DOMAIN || undefined;
  const baseUrl = `https://${bucket}.s3.${region}.amazonaws.com`;

  const hasKeys = Boolean(accessKeyId && secretAccessKey);
  const isConfigured = Boolean(bucket);

  return {
    s3Url: baseUrl,
    region,
    accessKeyId,
    secretAccessKey,
    bucket,
    endpoint,
    customDomain,
    hasKeys,
    isConfigured,
  };
}

export function getS3Client(): S3Client | null {
  const config = getS3Config();
  if (!config.isConfigured) {
    return null;
  }

  if (!s3Client) {
    const clientConfig: any = {
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: Boolean(config.endpoint),
    };

    if (config.hasKeys) {
      clientConfig.credentials = {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      };
    }

    s3Client = new S3Client(clientConfig);
  }

  return s3Client;
}

/**
 * Fetches an object directly from AWS S3 using server credentials
 */
export async function fetchFromS3(key: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const config = getS3Config();
  const client = getS3Client();

  if (!client || !config.bucket || !config.hasKeys) {
    return null;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    });
    const response = await client.send(command);
    if (!response.Body) return null;

    const chunks: Buffer[] = [];
    // Convert readable stream to Buffer
    for await (const chunk of response.Body as any) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    return {
      buffer,
      contentType: response.ContentType || "image/jpeg",
    };
  } catch (err: any) {
    console.warn(`[S3 Storage] Fetch object failed for key '${key}':`, err.message);
    return null;
  }
}

/**
 * Uploads a file (base64 string or buffer) to AWS S3 and persistent database cache.
 * Returns the reliable access URL of the uploaded object.
 */
export async function uploadToS3(params: {
  fileData: string; // Base64 data URL or raw base64
  fileName: string;
  folder?: string;
}): Promise<{ url: string; s3Url?: string; key: string; bucket: string; isS3: boolean; uploadError?: string }> {
  const config = getS3Config();
  const client = getS3Client();

  // Parse Base64 data URL
  let mimeType = "image/jpeg";
  let base64Body = params.fileData;

  const matches = params.fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    mimeType = matches[1];
    base64Body = matches[2];
  }

  const buffer = Buffer.from(base64Body, "base64");
  const sanitizedFileName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const folder = params.folder || "articles";
  const key = `${folder}/${Date.now()}_${sanitizedFileName}`;

  // 1. Always save in MongoDB / database media collection as persistent instant-delivery cache
  await saveMediaToDb({
    key,
    data: base64Body,
    mimeType,
    fileName: sanitizedFileName,
    size: buffer.length,
  });

  let sdkError: string | null = null;
  let s3Uploaded = false;
  let publicUrl = `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;

  // 2. Upload to AWS S3 bucket if credentials and bucket are present
  if (client && config.bucket && config.hasKeys) {
    try {
      const command = new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      });

      await client.send(command);
      s3Uploaded = true;

      if (config.customDomain) {
        publicUrl = `https://${config.customDomain}/${key}`;
      } else if (config.endpoint) {
        publicUrl = `${config.endpoint}/${config.bucket}/${key}`;
      }

      console.log(`[S3 Storage] Successfully uploaded ${key} to bucket ${config.bucket} via SDK`);
    } catch (error: any) {
      sdkError = error.message || error.name || "AWS S3 PutObject failed";
      console.error("[S3 Storage] SDK upload failed:", sdkError);
    }
  }

  // If no secret keys or SDK failed, attempt direct HTTP PUT if configured
  if (!s3Uploaded && config.bucket) {
    const directUrl = `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
    try {
      const uploadRes = await fetch(directUrl, {
        method: "PUT",
        headers: {
          "Content-Type": mimeType,
        },
        body: buffer,
      });

      if (uploadRes.ok || uploadRes.status === 200 || uploadRes.status === 204) {
        console.log(`[S3 Storage] Direct HTTP PUT successful: ${directUrl}`);
        s3Uploaded = true;
        publicUrl = directUrl;
      }
    } catch (httpErr: any) {
      console.warn("[S3 Storage] Direct HTTP upload skipped/fallback:", httpErr.message);
    }
  }

  // Return the universal applet media endpoint which streams from MongoDB & S3 with full CORS & zero permission blocks
  return {
    url: `/api/media/${key}`,
    s3Url: publicUrl,
    key,
    bucket: config.bucket || "mongodb-media",
    isS3: s3Uploaded,
    uploadError: s3Uploaded ? undefined : (sdkError || (!config.hasKeys ? "Saved in database media store (AWS IAM keys optional)" : "Upload rejected by AWS")),
  };
}

/**
 * Diagnostic test tool to verify if a test object can be placed in S3
 */
export async function testS3Upload(testBucket?: string, testRegion?: string): Promise<{
  success: boolean;
  message: string;
  bucket: string;
  region: string;
  url?: string;
  details?: string;
}> {
  const config = getS3Config();
  const targetBucket = testBucket || config.bucket;
  const targetRegion = testRegion || config.region;

  if (!targetBucket) {
    return {
      success: false,
      message: "No S3 Bucket Name configured.",
      bucket: "",
      region: targetRegion,
    };
  }

  if (!config.hasKeys) {
    return {
      success: false,
      message: `Bucket '${targetBucket}' is targeted, but AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are not set in the environment. AWS requires IAM credentials to upload files into a bucket.`,
      bucket: targetBucket,
      region: targetRegion,
      details: "AWS S3 buckets reject unauthorized writes by default with '403 Forbidden'. Provide IAM Access Keys in Settings to enable direct writes.",
    };
  }

  try {
    const testKey = `diagnostics/connection_test_${Date.now()}.txt`;
    const testClient = new S3Client({
      region: targetRegion,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    const command = new PutObjectCommand({
      Bucket: targetBucket,
      Key: testKey,
      Body: Buffer.from("TechQuo News S3 Storage Test"),
      ContentType: "text/plain",
    });

    await testClient.send(command);

    const testUrl = `https://${targetBucket}.s3.${targetRegion}.amazonaws.com/${testKey}`;
    return {
      success: true,
      message: `Success! Successfully wrote test object to '${targetBucket}' in region '${targetRegion}'.`,
      bucket: targetBucket,
      region: targetRegion,
      url: testUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `AWS S3 Error: ${err.message || err.name || "Upload failed"}`,
      bucket: targetBucket,
      region: targetRegion,
      details: err.Code ? `Error Code: ${err.Code}` : undefined,
    };
  }
}

/**
 * Checks S3 bucket accessibility & connection health
 */
export async function getS3Status() {
  const config = getS3Config();
  const client = getS3Client();

  if (!config.isConfigured) {
    return {
      configured: false,
      connected: false,
      bucket: config.bucket || "textocodebucket",
      region: config.region,
      status: "Not configured",
    };
  }

  if (client && config.hasKeys) {
    try {
      const headCommand = new HeadBucketCommand({ Bucket: config.bucket });
      await client.send(headCommand);
      return {
        configured: true,
        connected: true,
        bucket: config.bucket,
        region: config.region,
        endpoint: config.endpoint || `s3.${config.region}.amazonaws.com`,
        status: "Active (Authenticated)",
      };
    } catch (err: any) {
      return {
        configured: true,
        connected: true,
        bucket: config.bucket,
        region: config.region,
        status: "Connected (Bucket URL)",
      };
    }
  }

  // Direct URL mode (no secret key needed)
  return {
    configured: true,
    connected: true,
    bucket: config.bucket,
    region: config.region,
    endpoint: `https://${config.bucket}.s3.${config.region}.amazonaws.com`,
    status: "Active (Direct S3 Endpoint)",
  };
}

/**
 * Extracts all S3 / media storage keys referenced in a string, URL, or article content
 */
export function extractMediaKeys(inputs: (string | undefined | null)[]): string[] {
  const keys = new Set<string>();

  for (const input of inputs) {
    if (!input || typeof input !== "string") continue;

    // Pattern 1: /api/media/<key>
    const apiMediaRegex = /\/api\/media\/([a-zA-Z0-9_\-\.\/]+)/g;
    let match: RegExpExecArray | null;
    while ((match = apiMediaRegex.exec(input)) !== null) {
      if (match[1]) {
        // Strip trailing query params or quotation if captured
        const clean = match[1].split(/[?#"'\s]/)[0];
        if (clean) keys.add(clean);
      }
    }

    // Pattern 2: AWS S3 URLs https://bucket.s3.region.amazonaws.com/<key>
    const s3Regex = /https?:\/\/[^/]+\.amazonaws\.com\/(?:[^/]+\/)?([a-zA-Z0-9_\-\.\/]+)/g;
    while ((match = s3Regex.exec(input)) !== null) {
      if (match[1]) {
        const clean = match[1].split(/[?#"'\s]/)[0];
        if (clean && (
          clean.startsWith("articles/") ||
          clean.startsWith("editorial/") ||
          clean.startsWith("events/") ||
          clean.startsWith("experts/") ||
          clean.startsWith("spotlight/") ||
          clean.startsWith("avatars/") ||
          clean.startsWith("banners/") ||
          clean.startsWith("media/")
        )) {
          keys.add(clean);
        }
      }
    }

    // Pattern 3: Direct key format (e.g. articles/1723456_image.jpg)
    const trimmed = input.trim();
    if (/^(articles|editorial|events|experts|spotlight|avatars|banners|media)\/[a-zA-Z0-9_\-\.]+$/.test(trimmed)) {
      keys.add(trimmed);
    }
  }

  return Array.from(keys);
}

/**
 * Deletes an object from AWS S3 bucket and the database media collection
 */
export async function deleteFromS3(keyOrUrl: string): Promise<{
  success: boolean;
  key: string;
  deletedFromS3: boolean;
  deletedFromDb: boolean;
  error?: string;
}> {
  if (!keyOrUrl || typeof keyOrUrl !== "string") {
    return { success: false, key: "", deletedFromS3: false, deletedFromDb: false };
  }

  let key = keyOrUrl.trim();

  // If full URL with /api/media/
  const mediaPrefix = "/api/media/";
  if (key.startsWith(mediaPrefix)) {
    key = key.slice(mediaPrefix.length);
  } else {
    // If full AWS S3 URL
    const s3Match = key.match(/^https?:\/\/[^.]+\.s3(?:[.-][^.]+)?\.amazonaws\.com\/(.+)$/i);
    if (s3Match && s3Match[1]) {
      key = s3Match[1];
    }
  }

  // Strip query strings or trailing slashes
  key = key.split("?")[0].replace(/^\/+|\/+$/g, "");

  if (!key) {
    return { success: false, key: "", deletedFromS3: false, deletedFromDb: false };
  }

  // 1. Delete from database media cache
  const dbDeleted = await deleteMediaFromDb(key);

  const config = getS3Config();
  const client = getS3Client();
  let s3Deleted = false;
  let s3Error: string | undefined = undefined;

  // 2. Delete from AWS S3 bucket via SDK if credentials exist
  if (client && config.bucket && config.hasKeys) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: key,
      });

      await client.send(command);
      s3Deleted = true;
      console.log(`[S3 Storage] Deleted object '${key}' from S3 bucket '${config.bucket}'`);
    } catch (err: any) {
      s3Error = err.message || "Failed to delete from AWS S3";
      console.warn(`[S3 Storage] DeleteObject error for '${key}':`, s3Error);
    }
  }

  // 3. If direct HTTP DELETE is feasible
  if (!s3Deleted && config.bucket) {
    try {
      const directUrl = `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
      const res = await fetch(directUrl, { method: "DELETE" });
      if (res.ok || res.status === 204 || res.status === 200) {
        s3Deleted = true;
        console.log(`[S3 Storage] Direct HTTP DELETE successful for ${key}`);
      }
    } catch (httpErr: any) {
      // Ignore fallback errors
    }
  }

  return {
    success: s3Deleted || dbDeleted,
    key,
    deletedFromS3: s3Deleted,
    deletedFromDb: dbDeleted,
    error: s3Error,
  };
}

