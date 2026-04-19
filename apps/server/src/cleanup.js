import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import { TRANSFER_STATES } from "@vibe-share/shared";

import { loadConfig } from "./config.js";
import { logger } from "./logger.js";
import { createMetadataStore } from "./metadata-store.js";
import { createStorageAdapter } from "./storage/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(serverRoot, "..", "..");

dotenv.config({ path: path.join(repoRoot, ".env"), quiet: true });
dotenv.config({ path: path.join(serverRoot, ".env"), override: true, quiet: true });

const config = loadConfig(repoRoot);
const metadataStore = await createMetadataStore(config, logger);
const storage = await createStorageAdapter(config);
const now = Date.now();
const summary = {
  expiredSessions: 0,
  expiredTransfers: 0,
  cancelledUploads: 0,
  localArtifactsRemoved: 0
};

try {
  for (const session of await safeList("sessions")) {
    if (session.expiresAt && Number(session.expiresAt) <= now) {
      await metadataStore.upsert("sessions", { ...session, expired: true, updatedAt: now });
      await metadataStore.addAudit({ type: "cleanup.session_expired", sessionId: session.id, actor: "cleanup" });
      summary.expiredSessions += 1;
    }
  }

  for (const transfer of await safeList("transfers")) {
    if (transfer.expiresAt && Number(transfer.expiresAt) <= now && ![TRANSFER_STATES.COMPLETED, TRANSFER_STATES.EXPIRED].includes(transfer.status)) {
      await metadataStore.upsert("transfers", { ...transfer, status: TRANSFER_STATES.EXPIRED, failureReason: "cleanup_expired", updatedAt: now });
      await metadataStore.addAudit({ type: "cleanup.transfer_expired", sessionId: transfer.sessionId, transferId: transfer.id, actor: "cleanup" });
      summary.expiredTransfers += 1;
    }
  }

  for (const upload of await safeList("uploadSessions")) {
    const transferExpired = upload.expiresAt && Number(upload.expiresAt) <= now;
    const oldIncomplete = upload.updatedAt && Number(upload.updatedAt) < now - config.transferTtlMs;
    if ([TRANSFER_STATES.UPLOADING, TRANSFER_STATES.UPLOADED, TRANSFER_STATES.SCANNING].includes(upload.status) && (transferExpired || oldIncomplete)) {
      await storage.abortMultipartUpload({
        uploadId: upload.id,
        providerUploadId: upload.providerUploadId,
        storageKey: upload.storageKey
      }).catch((error) => logger.warn("cleanup abort multipart failed", { uploadId: upload.id, error }));
      await metadataStore.upsert("uploadSessions", { ...upload, status: TRANSFER_STATES.CANCELLED, updatedAt: now });
      await metadataStore.addAudit({ type: "cleanup.upload_aborted", sessionId: upload.sessionId, transferId: upload.transferId, uploadId: upload.id, actor: "cleanup" });
      summary.cancelledUploads += 1;
    }
  }

  if (storage.kind === "local") {
    summary.localArtifactsRemoved += await cleanupOldLocalArtifacts(config.uploadDir, now - config.transferTtlMs);
  }

  console.log(JSON.stringify({ ok: true, summary }, null, 2));
} finally {
  await metadataStore.close?.();
}

async function cleanupOldLocalArtifacts(root, olderThan) {
  let removed = 0;
  const entries = await fs.readdir(root, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    const stats = await fs.stat(fullPath).catch(() => null);
    if (!stats || stats.mtimeMs > olderThan) {
      continue;
    }
    if (entry.isDirectory() && entry.name === "resumable") {
      continue;
    }
    await fs.rm(fullPath, { recursive: true, force: true });
    removed += 1;
  }
  return removed;
}

async function safeList(collection) {
  try {
    return await Promise.resolve(metadataStore.list?.(collection) || []);
  } catch (error) {
    logger.warn("cleanup list failed", { collection, error });
    return [];
  }
}
