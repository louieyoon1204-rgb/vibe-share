import crypto from "node:crypto";

export async function createS3StorageAdapter({ config }) {
  const { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, GetObjectCommand, HeadBucketCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

  if (!config.s3.bucket) {
    throw new Error("S3_BUCKET is required when STORAGE_DRIVER=s3.");
  }

  const client = new S3Client({
    region: config.s3.region,
    endpoint: config.s3.endpoint || undefined,
    forcePathStyle: config.s3.forcePathStyle,
    credentials: config.s3.accessKeyId && config.s3.secretAccessKey
      ? {
          accessKeyId: config.s3.accessKeyId,
          secretAccessKey: config.s3.secretAccessKey
        }
      : undefined
  });

  return {
    kind: "s3",

    async createMultipartUpload({ storageKey, fileName, mimeType }) {
      const result = await client.send(new CreateMultipartUploadCommand({
        Bucket: config.s3.bucket,
        Key: storageKey,
        ContentType: mimeType || "application/octet-stream",
        Metadata: {
          originalName: encodeURIComponent(fileName || "vibe-share-file")
        }
      }));
      return { providerUploadId: result.UploadId };
    },

    async getUploadPartTarget({ providerUploadId, storageKey, partNumber }) {
      const command = new UploadPartCommand({
        Bucket: config.s3.bucket,
        Key: storageKey,
        UploadId: providerUploadId,
        PartNumber: partNumber
      });
      const url = await getSignedUrl(client, command, { expiresIn: config.signedUrlTtlSeconds });
      return {
        directToStorage: true,
        method: "PUT",
        url,
        headers: {}
      };
    },

    async savePart({ providerUploadId, storageKey, partNumber, body, expectedChecksum }) {
      const payload = Buffer.isBuffer(body) ? body : Buffer.from(body || "");
      const checksum = crypto.createHash("sha256").update(payload).digest("hex");
      if (expectedChecksum && expectedChecksum !== checksum) {
        throw new Error("Chunk checksum mismatch.");
      }

      const result = await client.send(new UploadPartCommand({
        Bucket: config.s3.bucket,
        Key: storageKey,
        UploadId: providerUploadId,
        PartNumber: partNumber,
        Body: payload
      }));

      return {
        partNumber,
        etag: String(result.ETag || checksum).replaceAll('"', ""),
        checksum,
        size: payload.byteLength
      };
    },

    async completeMultipartUpload({ providerUploadId, storageKey, parts }) {
      await client.send(new CompleteMultipartUploadCommand({
        Bucket: config.s3.bucket,
        Key: storageKey,
        UploadId: providerUploadId,
        MultipartUpload: {
          Parts: parts
            .sort((a, b) => a.partNumber - b.partNumber)
            .map((part) => ({ PartNumber: part.partNumber, ETag: part.etag }))
        }
      }));

      return { storageKey };
    },

    async abortMultipartUpload({ providerUploadId, storageKey }) {
      if (!providerUploadId) {
        return;
      }
      await client.send(new AbortMultipartUploadCommand({
        Bucket: config.s3.bucket,
        Key: storageKey,
        UploadId: providerUploadId
      }));
    },

    async createReadStream({ transfer, storageKey }) {
      const result = await client.send(new GetObjectCommand({
        Bucket: config.s3.bucket,
        Key: storageKey || transfer?.storageKey
      }));
      return result.Body;
    },

    async getDownloadTarget({ transfer }) {
      const command = new GetObjectCommand({
        Bucket: config.s3.bucket,
        Key: transfer.storageKey,
        ResponseContentDisposition: `attachment; filename="${encodeURIComponent(transfer.fileName || "vibe-share-file")}"`
      });
      const url = await getSignedUrl(client, command, { expiresIn: config.signedUrlTtlSeconds });
      return {
        directFromStorage: true,
        url,
        expiresInSeconds: config.signedUrlTtlSeconds
      };
    },

    async health() {
      await client.send(new HeadBucketCommand({ Bucket: config.s3.bucket }));
      return {
        driver: "s3",
        available: true,
        bucket: config.s3.bucket,
        endpoint: config.s3.endpoint || "aws-default"
      };
    }
  };
}
