import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadConfig } from "../apps/server/src/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const previousEnv = { ...process.env };

try {
  process.env.STORAGE_DRIVER = "s3";
  process.env.S3_ENDPOINT = "https://vibe-share-transfers.abc123.r2.cloudflarestorage.com/should-not-be-here";
  process.env.S3_BUCKET = "vibe-share-transfers";
  process.env.S3_REGION = "us-east-1";
  process.env.S3_ACCESS_KEY_ID = "test-access-key";
  process.env.S3_SECRET_ACCESS_KEY = "test-secret-key";
  process.env.S3_FORCE_PATH_STYLE = "true";

  const r2Config = loadConfig(repoRoot);
  assert.equal(r2Config.s3.provider, "cloudflare-r2");
  assert.equal(r2Config.s3.endpoint, "https://abc123.r2.cloudflarestorage.com");
  assert.equal(r2Config.s3.region, "auto");
  assert.equal(r2Config.s3.forcePathStyle, false);
  assert.ok(r2Config.validation.warnings.some((warning) => warning.includes("S3_REGION=auto")));
  assert.ok(r2Config.validation.warnings.some((warning) => warning.includes("S3_FORCE_PATH_STYLE")));

  process.env.S3_ENDPOINT = "http://127.0.0.1:9000";
  process.env.S3_REGION = "us-east-1";
  process.env.S3_FORCE_PATH_STYLE = "true";

  const minioConfig = loadConfig(repoRoot);
  assert.equal(minioConfig.s3.provider, "generic-s3");
  assert.equal(minioConfig.s3.endpoint, "http://127.0.0.1:9000");
  assert.equal(minioConfig.s3.region, "us-east-1");
  assert.equal(minioConfig.s3.forcePathStyle, true);

  console.log("r2 config smoke ok: R2 endpoint, region=auto, and path-style normalization");
} finally {
  for (const key of Object.keys(process.env)) {
    if (!(key in previousEnv)) {
      delete process.env[key];
    }
  }
  Object.assign(process.env, previousEnv);
}
