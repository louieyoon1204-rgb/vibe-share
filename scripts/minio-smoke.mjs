import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateBucketCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  S3Client,
  UploadPartCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const tmpRoot = path.join(repoRoot, ".tmp", "minio-smoke");
const toolsDir = path.join(tmpRoot, "tools");
const dataDir = path.join(tmpRoot, "data");
const minioExe = path.join(toolsDir, "minio.exe");
const endpoint = process.env.S3_ENDPOINT || "http://127.0.0.1:9000";
const bucket = process.env.S3_BUCKET || "vibe-share-smoke";
const accessKeyId = process.env.S3_ACCESS_KEY_ID || "vibeshare";
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || "vibeshare-secret";

let serverProcess = null;

try {
  await fsp.mkdir(toolsDir, { recursive: true });
  await fsp.mkdir(dataDir, { recursive: true });
  if (!(await isMinioReady())) {
    await ensureMinioBinary();

    serverProcess = spawn(minioExe, ["server", dataDir, "--address", ":9000", "--console-address", ":9001"], {
      env: {
        ...process.env,
        MINIO_ROOT_USER: accessKeyId,
        MINIO_ROOT_PASSWORD: secretAccessKey
      },
      stdio: ["ignore", "pipe", "pipe"]
    });

    let output = "";
    serverProcess.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    serverProcess.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });

    await waitForMinio(output);
  }

  const client = new S3Client({
    region: "us-east-1",
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey }
  });

  await ensureBucket(client);

  const key = `smoke/${Date.now()}-multipart.txt`;
  const payload = Buffer.from("minio multipart smoke\n".repeat(1024));
  const createResult = await client.send(new CreateMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    ContentType: "text/plain"
  }));

  const partCommand = new UploadPartCommand({
    Bucket: bucket,
    Key: key,
    UploadId: createResult.UploadId,
    PartNumber: 1
  });
  const partUrl = await getSignedUrl(client, partCommand, { expiresIn: 120 });
  const partResponse = await fetch(partUrl, { method: "PUT", body: payload });
  assert.equal(partResponse.status, 200);
  const etag = partResponse.headers.get("etag");
  assert.ok(etag);

  await client.send(new CompleteMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    UploadId: createResult.UploadId,
    MultipartUpload: {
      Parts: [{ PartNumber: 1, ETag: etag }]
    }
  }));

  const downloadUrl = await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 120 });
  const downloadResponse = await fetch(downloadUrl);
  assert.equal(downloadResponse.status, 200);
  assert.equal(await downloadResponse.text(), payload.toString("utf8"));

  const abortKey = `smoke/${Date.now()}-abort.txt`;
  const abortUpload = await client.send(new CreateMultipartUploadCommand({ Bucket: bucket, Key: abortKey }));
  await client.send(new AbortMultipartUploadCommand({
    Bucket: bucket,
    Key: abortKey,
    UploadId: abortUpload.UploadId
  }));

  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })).catch(() => {});
  console.log("minio smoke ok: create bucket, presigned multipart upload, complete, signed download, abort");
} finally {
  serverProcess?.kill();
  await delay(500);
}

async function ensureMinioBinary() {
  if (fs.existsSync(minioExe)) {
    return;
  }

  const url = "https://dl.min.io/server/minio/release/windows-amd64/minio.exe";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`failed to download MinIO from ${url}: HTTP ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await fsp.writeFile(minioExe, buffer);
}

async function waitForMinio(output) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (serverProcess?.exitCode !== null) {
      throw new Error(`MinIO exited early\n${output}`);
    }
    try {
      const response = await fetch(`${endpoint}/minio/health/ready`);
      if (response.ok) {
        return;
      }
    } catch {
      // Keep waiting.
    }
    await delay(250);
  }

  throw new Error(`MinIO did not become ready\n${output}`);
}

async function isMinioReady() {
  try {
    const response = await fetch(`${endpoint}/minio/health/ready`);
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureBucket(client) {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    return;
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
  }
}
