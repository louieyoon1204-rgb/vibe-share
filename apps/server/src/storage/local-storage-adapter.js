import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";

export function createLocalStorageAdapter({ uploadDir }) {
  const root = path.join(uploadDir, "resumable");
  fs.mkdirSync(root, { recursive: true });

  function uploadDirFor(uploadId) {
    return path.join(root, uploadId);
  }

  function partPath(uploadId, partNumber) {
    return path.join(uploadDirFor(uploadId), `${String(partNumber).padStart(6, "0")}.part`);
  }

  return {
    kind: "local",

    async createMultipartUpload({ uploadId }) {
      await fsp.mkdir(uploadDirFor(uploadId), { recursive: true });
      return { providerUploadId: uploadId };
    },

    async getUploadPartTarget({ uploadId, partNumber, baseUrl, sessionId }) {
      return {
        directToStorage: false,
        method: "PUT",
        url: `${baseUrl}/api/uploads/${uploadId}/parts/${partNumber}?sessionId=${encodeURIComponent(sessionId)}`,
        headers: {}
      };
    },

    async savePart({ uploadId, partNumber, stream, expectedChecksum }) {
      await fsp.mkdir(uploadDirFor(uploadId), { recursive: true });
      const hash = crypto.createHash("sha256");
      const destination = fs.createWriteStream(partPath(uploadId, partNumber));

      stream.on("data", (chunk) => {
        hash.update(chunk);
      });

      await pipeline(stream, destination);
      const checksum = hash.digest("hex");

      if (expectedChecksum && expectedChecksum !== checksum) {
        await fsp.unlink(partPath(uploadId, partNumber)).catch(() => {});
        throw new Error("Chunk checksum mismatch.");
      }

      const stats = await fsp.stat(partPath(uploadId, partNumber));
      return {
        partNumber,
        etag: checksum,
        checksum,
        size: stats.size
      };
    },

    async completeMultipartUpload({ uploadId, parts, storageKey }) {
      const finalPath = path.join(root, `${storageKey}.bin`);
      await fsp.mkdir(path.dirname(finalPath), { recursive: true });
      const output = fs.createWriteStream(finalPath);

      for (const part of [...parts].sort((a, b) => a.partNumber - b.partNumber)) {
        const input = fs.createReadStream(partPath(uploadId, part.partNumber));
        await pipeline(input, output, { end: false });
      }

      await new Promise((resolve, reject) => {
        output.end((error) => (error ? reject(error) : resolve()));
      });

      await fsp.rm(uploadDirFor(uploadId), { recursive: true, force: true });
      return {
        storageKey,
        filePath: finalPath
      };
    },

    async abortMultipartUpload({ uploadId }) {
      await fsp.rm(uploadDirFor(uploadId), { recursive: true, force: true });
    },

    async createReadStream({ filePath }) {
      return fs.createReadStream(filePath);
    },

    async getDownloadTarget({ baseUrl, transfer }) {
      return {
        directFromStorage: false,
        url: `${baseUrl}/api/transfers/${transfer.id}/download?sessionId=${encodeURIComponent(transfer.sessionId)}`,
        expiresInSeconds: null
      };
    },

    async health() {
      await fsp.mkdir(root, { recursive: true });
      return {
        driver: "local",
        available: true,
        root
      };
    }
  };
}
