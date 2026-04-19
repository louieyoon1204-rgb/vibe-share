import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createCache } from "../apps/server/src/cache/index.js";
import { loadConfig } from "../apps/server/src/config.js";
import { createMetadataStore } from "../apps/server/src/metadata-store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const tmpRoot = path.join(repoRoot, ".tmp", "prod-foundation-smoke");
const metadataFile = path.join(tmpRoot, "metadata.json");

await fs.rm(tmpRoot, { recursive: true, force: true });

const previousEnv = { ...process.env };
process.env.DATABASE_DRIVER = "json";
process.env.CACHE_DRIVER = "memory";
process.env.STORAGE_DRIVER = "local";
process.env.METADATA_FILE = ".tmp/prod-foundation-smoke/metadata.json";

try {
  const config = loadConfig(repoRoot);
  const store = await createMetadataStore({ ...config, metadataFile });
  const cache = await createCache(config);

  const requiredTables = [
    "users",
    "anonymous_sessions",
    "devices",
    "pairings",
    "transfers",
    "upload_sessions",
    "upload_parts",
    "locale_preferences",
    "audit_logs"
  ];

  const migration = await fs.readFile(path.join(repoRoot, "apps", "server", "migrations", "001_init.sql"), "utf8");
  for (const table of requiredTables) {
    assert.match(migration, new RegExp(`create table if not exists ${table}`));
  }

  store.upsert("users", { id: "user-1", anonymous: true });
  store.upsert("sessions", { id: "session-1", code: "123456", userId: "user-1", expiresAt: Date.now() + 60000 });
  store.upsert("devices", { id: "device-1", userId: "user-1", sessionId: "session-1", role: "pc" });
  store.upsert("pairings", { id: "pairing-1", sessionId: "session-1", pcDeviceId: "device-1", status: "paired" });
  store.upsert("transfers", { id: "transfer-1", sessionId: "session-1", from: "pc", to: "mobile", status: "uploading", size: 5 });
  store.upsert("uploadSessions", {
    id: "upload-1",
    transferId: "transfer-1",
    sessionId: "session-1",
    status: "uploading",
    totalParts: 1,
    partSize: 5,
    parts: [{ partNumber: 1, etag: "etag", checksum: "abc", size: 5 }]
  });
  store.upsert("localePreferences", { id: "locale-1", userId: "user-1", locale: "ko" });
  store.addAudit({ type: "smoke.audit", sessionId: "session-1", transferId: "transfer-1", actor: "smoke" });
  await store.close?.();

  const persisted = JSON.parse(await fs.readFile(metadataFile, "utf8"));
  assert.equal(Object.keys(persisted.users).length, 1);
  assert.equal(Object.keys(persisted.sessions).length, 1);
  assert.equal(Object.keys(persisted.devices).length, 1);
  assert.equal(Object.keys(persisted.pairings).length, 1);
  assert.equal(Object.keys(persisted.transfers).length, 1);
  assert.equal(Object.keys(persisted.uploadSessions).length, 1);
  assert.equal(Object.keys(persisted.localePreferences).length, 1);
  assert.equal(persisted.auditLog.length, 1);

  await cache.set("pairing:123456", { sessionId: "session-1" }, 60);
  assert.equal((await cache.get("pairing:123456")).sessionId, "session-1");
  const limit = await cache.incrementRateLimit("rate:smoke", 1000);
  assert.equal(limit.count, 1);

  const productionLikeConfig = loadConfig(repoRoot);
  assert.equal(Array.isArray(productionLikeConfig.validation.errors), true);

  console.log("production foundation smoke ok: migrations, JSON fallback store, memory cache, validation");
} finally {
  Object.assign(process.env, previousEnv);
  await fs.rm(tmpRoot, { recursive: true, force: true });
}
