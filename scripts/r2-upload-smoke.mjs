import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadConfig } from "../apps/server/src/config.js";
import { createStorageAdapter } from "../apps/server/src/storage/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

if (process.env.RUN_R2_SMOKE !== "1") {
  console.log("r2 upload smoke skipped: set RUN_R2_SMOKE=1 with S3_ENDPOINT/S3_BUCKET/S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY to run it.");
  process.exit(0);
}

process.env.STORAGE_DRIVER = "s3";

const config = loadConfig(repoRoot);
const required = [
  ["S3_ENDPOINT", config.s3.endpoint],
  ["S3_BUCKET", config.s3.bucket],
  ["S3_ACCESS_KEY_ID", config.s3.accessKeyId],
  ["S3_SECRET_ACCESS_KEY", config.s3.secretAccessKey]
];

for (const [name, value] of required) {
  assert.ok(value, `${name} is required for r2 upload smoke`);
}
assert.equal(config.s3.provider, "cloudflare-r2", "RUN_R2_SMOKE expects a Cloudflare R2 endpoint");
assert.equal(config.s3.region, "auto", "Cloudflare R2 must use region auto");
assert.equal(config.s3.forcePathStyle, false, "Cloudflare R2 smoke expects virtual-hosted presigned URLs");

const storage = await createStorageAdapter({ config });
const key = `smoke/r2-${Date.now()}-${Math.random().toString(36).slice(2)}.bin`;
let providerUploadId = "";
let completed = false;

try {
  await storage.health();
  const payload = Buffer.alloc(6 * 1024 * 1024, 0x61);
  const provider = await storage.createMultipartUpload({
    storageKey: key,
    fileName: "r2-smoke.bin",
    mimeType: "application/octet-stream"
  });
  providerUploadId = provider.providerUploadId;

  const target = await storage.getUploadPartTarget({
    providerUploadId,
    storageKey: key,
    partNumber: 1
  });
  assert.equal(target.directToStorage, true);
  assert.equal(target.method, "PUT");

  const putResponse = await fetch(target.url, {
    method: target.method,
    headers: target.headers,
    body: payload
  });
  assert.equal(putResponse.status, 200, await putResponse.text());
  const etag = putResponse.headers.get("etag");
  assert.ok(etag, "R2 UploadPart response must include ETag");

  await storage.completeMultipartUpload({
    providerUploadId,
    storageKey: key,
    parts: [{ partNumber: 1, etag }]
  });
  completed = true;

  const downloadTarget = await storage.getDownloadTarget({
    transfer: {
      storageKey: key,
      fileName: "r2-smoke.bin"
    }
  });
  const downloadResponse = await fetch(downloadTarget.url);
  assert.equal(downloadResponse.status, 200);
  assert.equal((await downloadResponse.arrayBuffer()).byteLength, payload.byteLength);

  console.log("r2 upload smoke ok: create multipart, presigned UploadPart PUT, complete, signed download");
} finally {
  if (providerUploadId && !completed) {
    await storage.abortMultipartUpload({ providerUploadId, storageKey: key }).catch(() => {});
  }
  if (completed) {
    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: config.s3.region,
      endpoint: config.s3.endpoint,
      forcePathStyle: config.s3.forcePathStyle,
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
      credentials: {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey
      }
    });
    await client.send(new DeleteObjectCommand({ Bucket: config.s3.bucket, Key: key })).catch(() => {});
  }
}
