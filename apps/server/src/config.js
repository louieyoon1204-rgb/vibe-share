import path from "node:path";

import { parsePositiveInt } from "./utils.js";

const GB = 1024 * 1024 * 1024;
const MB = 1024 * 1024;

export function loadConfig(repoRoot) {
  const maxFileSizeGb = parsePositiveInt(process.env.MAX_FILE_SIZE_GB, 100);
  const legacyRelayMaxMb = parsePositiveInt(process.env.LEGACY_RELAY_MAX_FILE_SIZE_MB, 100);
  const appMode = process.env.APP_MODE || "development";
  const storageDriver = process.env.STORAGE_DRIVER || "local";
  const databaseDriver = process.env.DATABASE_DRIVER || (process.env.DATABASE_URL ? "postgres" : "json");
  const cacheDriver = process.env.CACHE_DRIVER || (process.env.REDIS_URL ? "redis" : "memory");
  const realtimeAdapter = process.env.SOCKET_IO_ADAPTER || (process.env.REDIS_URL ? "redis" : "memory");

  const config = {
    appMode,
    storageDriver,
    databaseDriver,
    cacheDriver,
    realtimeAdapter,
    port: parsePositiveInt(process.env.SERVER_PORT || process.env.PORT, 4000),
    sessionTtlMs: parsePositiveInt(process.env.SESSION_TTL_MS, 30 * 60 * 1000),
    transferTtlMs: parsePositiveInt(process.env.TRANSFER_TTL_MS, 60 * 60 * 1000),
    cleanupIntervalMs: parsePositiveInt(process.env.CLEANUP_INTERVAL_MS, 60 * 1000),
    maxFileSizeBytes: maxFileSizeGb * GB,
    legacyRelayMaxFileSizeBytes: legacyRelayMaxMb * MB,
    chunkSizeBytes: parsePositiveInt(process.env.UPLOAD_CHUNK_SIZE_MB, 16) * MB,
    chunkUploadMaxBytes: parsePositiveInt(process.env.UPLOAD_CHUNK_MAX_MB, 64) * MB,
    signedUrlTtlSeconds: parsePositiveInt(process.env.SIGNED_URL_TTL_SECONDS, 900),
    corsOrigin: process.env.CORS_ORIGIN || "*",
    uploadDir: process.env.UPLOAD_DIR
      ? path.resolve(repoRoot, process.env.UPLOAD_DIR)
      : path.join(repoRoot, ".tmp", "uploads"),
    metadataFile: process.env.METADATA_FILE
      ? path.resolve(repoRoot, process.env.METADATA_FILE)
      : path.join(repoRoot, ".tmp", "metadata.json"),
    allowedMimeTypes: parseList(process.env.ALLOWED_MIME_TYPES),
    rateLimitWindowMs: parsePositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 60 * 1000),
    rateLimitMax: parsePositiveInt(process.env.RATE_LIMIT_MAX, 600),
    malwareScanWebhookUrl: process.env.MALWARE_SCAN_WEBHOOK_URL || "",
    publicSiteUrl: process.env.PUBLIC_SITE_URL || "https://vibeshare.app",
    publicWebAppUrl: process.env.PUBLIC_WEB_APP_URL || "https://app.vibeshare.app",
    publicApiUrl: process.env.PUBLIC_API_URL || "https://api.vibeshare.app",
    requireDeviceTrust: process.env.REQUIRE_DEVICE_TRUST === "true" || appMode === "production",
    authDevLoginEnabled: process.env.AUTH_DEV_LOGIN_ENABLED !== "false",
    authTokenTtlSeconds: parsePositiveInt(process.env.AUTH_TOKEN_TTL_SECONDS, 7 * 24 * 60 * 60),
    databaseUrl: process.env.DATABASE_URL || "",
    redisUrl: process.env.REDIS_URL || "",
    adminToken: process.env.ADMIN_TOKEN || "",
    auth: {
      jwtIssuer: process.env.AUTH_JWT_ISSUER || "",
      jwtAudience: process.env.AUTH_JWT_AUDIENCE || "",
      jwtSecret: process.env.AUTH_JWT_SECRET || "",
      deviceTrustSecret: process.env.DEVICE_TRUST_SECRET || process.env.AUTH_JWT_SECRET || "dev-device-trust-secret"
    },
    s3: {
      endpoint: process.env.S3_ENDPOINT || "",
      region: process.env.S3_REGION || "us-east-1",
      bucket: process.env.S3_BUCKET || "",
      accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false"
    }
  };

  return {
    ...config,
    validation: validateRuntimeConfig(config)
  };
}

function parseList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function validateRuntimeConfig(config) {
  const errors = [];
  const warnings = [];

  if (config.appMode === "production") {
    if (config.databaseDriver !== "postgres") {
      errors.push("DATABASE_DRIVER=postgres is required for production mode.");
    }
    if (config.cacheDriver !== "redis") {
      errors.push("CACHE_DRIVER=redis is required for production mode.");
    }
    if (config.realtimeAdapter !== "redis") {
      errors.push("SOCKET_IO_ADAPTER=redis is required for multi-instance production mode.");
    }
    if (config.storageDriver !== "s3") {
      errors.push("STORAGE_DRIVER=s3 is required for production mode.");
    }
    if (!config.adminToken) {
      warnings.push("ADMIN_TOKEN is not set. Admin endpoints should be protected before launch.");
    }
    if (config.auth.deviceTrustSecret === "dev-device-trust-secret") {
      errors.push("DEVICE_TRUST_SECRET or AUTH_JWT_SECRET must be set for production mode.");
    }
  }

  if (config.databaseDriver === "postgres" && !config.databaseUrl) {
    errors.push("DATABASE_URL is required when DATABASE_DRIVER=postgres.");
  }

  if (config.cacheDriver === "redis" && !config.redisUrl) {
    errors.push("REDIS_URL is required when CACHE_DRIVER=redis.");
  }

  if (config.realtimeAdapter === "redis" && !config.redisUrl) {
    errors.push("REDIS_URL is required when SOCKET_IO_ADAPTER=redis.");
  }

  if (config.storageDriver === "s3") {
    if (!config.s3.bucket) {
      errors.push("S3_BUCKET is required when STORAGE_DRIVER=s3.");
    }
    if (!config.s3.accessKeyId || !config.s3.secretAccessKey) {
      warnings.push("S3 access keys are not set. The AWS SDK will try its default credential chain.");
    }
  }

  if (config.maxFileSizeBytes > 100 * GB) {
    warnings.push("MAX_FILE_SIZE_GB is above 100 GB. Verify object storage lifecycle, costs, and client limits.");
  }

  return { errors, warnings };
}
