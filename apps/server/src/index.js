import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import { Server } from "socket.io";
import {
  TRANSFER_STATES,
  isLoopbackHost,
  isMobileFacingUrlBlocked,
  isPrivateLanHost,
  resolveMobileServerBaseUrl,
  resolveMobileWebBaseUrl
} from "@vibe-share/shared";

import { createAnonymousPrincipal, createAuthToken, createDeviceTrust, hashDeviceTrustToken, hashPairingCode, readAuthContext, readBearerToken, verifyAuthToken } from "./auth/index.js";
import { createCache } from "./cache/index.js";
import { loadConfig } from "./config.js";
import { logger } from "./logger.js";
import { createMetadataStore } from "./metadata-store.js";
import { configureRealtimeAdapter } from "./realtime/redis-adapter.js";
import { createRateLimit } from "./security/rate-limit.js";
import { runMalwareScanHook, validateFileMetadata } from "./security/validation.js";
import { createStorageAdapter } from "./storage/index.js";
import {
  contentDispositionAttachment,
  createPairingCode,
  formatBytes,
  isValidRole,
  otherRole,
  publicSession,
  publicTransfer
} from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(serverRoot, "..", "..");

dotenv.config({ path: path.join(repoRoot, ".env"), quiet: true });
dotenv.config({ path: path.join(serverRoot, ".env"), override: true, quiet: true });

const config = loadConfig(repoRoot);
const WEB_DEV_PORT = Number(process.env.WEB_DEV_PORT || process.env.VITE_PORT || 5173);
if (config.appMode === "production" && config.validation.errors.length > 0) {
  logger.error("invalid production configuration", {
    errors: config.validation.errors,
    warnings: config.validation.warnings
  });
  process.exit(1);
}
for (const warning of config.validation.warnings) {
  logger.warn("configuration warning", { warning });
}

fs.mkdirSync(config.uploadDir, { recursive: true });

const sessions = new Map();
const codeToSessionId = new Map();
const transfers = new Map();
const uploadSessions = new Map();
const metadataStore = await createMetadataStore(config, logger);
const cache = await createCache(config, logger);
const storage = await createStorageAdapter(config);

const app = express();
app.set("trust proxy", true);
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.corsOrigin === "*" ? true : config.corsOrigin.split(",").map((origin) => origin.trim()),
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 1_000_000
});
const realtime = await configureRealtimeAdapter({ io, config, logger });

app.use(cors({
  origin: config.corsOrigin === "*" ? true : config.corsOrigin.split(",").map((origin) => origin.trim())
}));
app.use((req, res, next) => {
  req.id = req.header("x-request-id") || crypto.randomUUID();
  res.setHeader("x-request-id", req.id);
  const startedAt = Date.now();
  res.on("finish", () => {
    logger.info("request completed", {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      ip: req.ip
    });
  });
  next();
});
app.use((req, res, next) => {
  if (req.path === "/health" || req.path === "/api/info" || req.path.startsWith("/admin/")) {
    res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
});
app.use(createRateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  cache,
  logger
}));
app.use(express.json({ limit: "1mb" }));

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, config.uploadDir),
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname || "").slice(0, 20);
      callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
    }
  }),
  limits: {
    files: 1,
    fileSize: config.legacyRelayMaxFileSizeBytes
  }
});

function now() {
  return Date.now();
}

function localNetworkUrls(port = config.port) {
  if (isPublicDeployment()) {
    return [];
  }

  const candidates = [];
  const interfaces = os.networkInterfaces();

  for (const [name, addresses] of Object.entries(interfaces)) {
    for (const address of addresses || []) {
      if (address.family === "IPv4" && !address.internal && isMobileReachableLanCandidate(name, address.address)) {
        candidates.push({
          name,
          address: address.address,
          url: `http://${address.address}:${port}`
        });
      }
    }
  }

  return candidates
    .sort((left, right) => lanCandidateScore(left) - lanCandidateScore(right) || left.address.localeCompare(right.address))
    .map((candidate) => candidate.url)
    .filter((url, index, urls) => urls.indexOf(url) === index);
}

function isMobileReachableLanCandidate(name, address) {
  if (!address || address.startsWith("169.254.")) {
    return false;
  }
  if (/vEthernet|WSL|Docker|Hyper-V|VirtualBox|VMware|Loopback/i.test(name || "")) {
    return false;
  }
  return /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(address);
}

function lanCandidateScore(candidate) {
  const address = candidate.address || "";
  const name = candidate.name || "";
  let score = 0;

  if (/vEthernet|WSL|Docker|Hyper-V|VirtualBox|VMware|Loopback/i.test(name)) {
    score += 100;
  }

  if (address.startsWith("192.168.")) {
    score += 0;
  } else if (address.startsWith("10.")) {
    score += 10;
  } else if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(address)) {
    score += 20;
  } else {
    score += 40;
  }

  if (address.startsWith("169.254.")) {
    score += 200;
  }

  return score;
}

function serializeSession(session) {
  return {
    id: session.id,
    code: session.code,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    anonymousUserId: session.anonymousUserId || null,
    userId: session.userId || session.anonymousUserId || null,
    pcSocketId: session.pcSocketId || null,
    mobileSocketId: session.mobileSocketId || null,
    pcDeviceId: session.pcDeviceId || null,
    mobileDeviceId: session.mobileDeviceId || null,
    transferIds: [...(session.transferIds || [])]
  };
}

function hydrateSession(record) {
  if (!record?.id) {
    return null;
  }
  const session = {
    ...record,
    transferIds: new Set(record.transferIds || [])
  };
  sessions.set(session.id, session);
  if (session.code) {
    codeToSessionId.set(session.code, session.id);
  }
  return session;
}

function getSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) {
    return null;
  }

  if (session.expiresAt <= now()) {
    expireSession(session, "session_expired");
    return null;
  }

  return session;
}

async function resolveSession(sessionId) {
  const localSession = getSession(sessionId);
  if (localSession) {
    return localSession;
  }

  const cached = await cache.get(`session:${sessionId}`).catch(() => null);
  const persisted = cached || (await getMetadata("sessions", sessionId));
  if (!persisted) {
    return null;
  }

  const session = hydrateSession(persisted);
  if (session?.expiresAt <= now()) {
    expireSession(session, "session_expired");
    return null;
  }
  return session;
}

function getSessionByCode(code) {
  const sessionId = codeToSessionId.get(code);
  return sessionId ? getSession(sessionId) : null;
}

async function resolveSessionByCode(code) {
  const local = getSessionByCode(code);
  if (local) {
    return local;
  }

  const cachedPairing = await cache.get(`pairing:${code}`).catch(() => null);
  if (cachedPairing?.sessionId) {
    return resolveSession(cachedPairing.sessionId);
  }

  const sessionsByCode = await listMetadata("sessions", (session) => session.code === code);
  return sessionsByCode?.[0] ? hydrateSession(sessionsByCode[0]) : null;
}

function persist(operation, description = "metadata write") {
  Promise.resolve(operation).catch((error) => {
    logger.error(description, { error });
  });
}

async function listMetadata(collection, predicate = () => true) {
  try {
    return await Promise.resolve(metadataStore.list?.(collection, predicate) || []);
  } catch (error) {
    logger.warn("metadata list failed", { collection, error });
    return [];
  }
}

async function getMetadata(collection, id) {
  try {
    return await Promise.resolve(metadataStore.get?.(collection, id) || null);
  } catch (error) {
    logger.warn("metadata get failed", { collection, id, error });
    return null;
  }
}

async function createSession(req) {
  const code = createPairingCode(codeToSessionId);
  const createdAt = now();
  const authUser = await getAuthUser(req);
  const principal = authUser || createAnonymousPrincipal();
  const session = {
    id: crypto.randomUUID(),
    code,
    createdAt,
    expiresAt: createdAt + config.sessionTtlMs,
    anonymousUserId: authUser ? null : principal.id,
    userId: principal.id,
    pcSocketId: null,
    mobileSocketId: null,
    pcDeviceId: null,
    mobileDeviceId: null,
    transferIds: new Set()
  };
  const pcTrust = createDeviceTrust({ config, sessionId: session.id, role: "pc" });
  session.pcDeviceId = pcTrust.device.id;

  sessions.set(session.id, session);
  codeToSessionId.set(code, session.id);
  await metadataStore.upsert("users", {
    id: principal.id,
    email: principal.email || null,
    displayName: principal.displayName || null,
    anonymous: !authUser,
    createdAt: principal.createdAt || createdAt
  });
  await metadataStore.upsert("sessions", {
    ...serializeSession(session),
    ...publicSession(session),
    mode: config.appMode,
    userId: principal.id,
    anonymous: !authUser,
    authContext: readAuthContext(req)
  });
  await metadataStore.upsert("devices", {
    ...pcTrust.device,
    userId: principal.id
  });
  await Promise.all([
    cache.set(`pairing:${code}`, { sessionId: session.id }, Math.ceil(config.sessionTtlMs / 1000)),
    cache.set(`session:${session.id}`, serializeSession(session), Math.ceil(config.sessionTtlMs / 1000))
  ]);
  persist(metadataStore.upsert("pairings", {
    id: crypto.randomUUID(),
    sessionId: session.id,
    pcDeviceId: pcTrust.device.id,
    codeHash: hashPairingCode(config, code),
    status: "pc_waiting_for_mobile",
    createdAt
  }), "pairing metadata write failed");
  persist(metadataStore.addAudit({
    type: "session.created",
    sessionId: session.id,
    actor: authUser ? principal.id : "anonymous-local",
    requestIp: req?.ip || null
  }), "audit write failed");
  return { session, pcDeviceTrustToken: pcTrust.token };
}

async function deleteTransferFile(transfer) {
  if (!transfer?.filePath || transfer.fileDeleted) {
    return;
  }

  try {
    await fsp.unlink(transfer.filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      logger.warn("transfer file cleanup failed", { filePath: transfer.filePath, error });
    }
  } finally {
    transfer.fileDeleted = true;
  }
}

function emitToTransferPeers(transfer, eventName) {
  const payload = { transfer: publicTransfer(transfer) };
  io.to(transfer.sessionId).emit(eventName, payload);
}

function emitSessionState(session) {
  io.to(session.id).emit("session:state", {
    session: publicSession(session)
  });
}

function removeTransfer(transferId) {
  const transfer = transfers.get(transferId);
  if (!transfer) {
    return;
  }

  const session = sessions.get(transfer.sessionId);
  if (session) {
    session.transferIds.delete(transferId);
  }

  transfers.delete(transferId);
  void deleteTransferFile(transfer);
}

function expireSession(session, reason = "session_expired") {
  if (!session || !sessions.has(session.id)) {
    return;
  }

  io.to(session.id).emit("session:expired", {
    message: "세션 시간이 만료되었습니다. PC에서 새 세션을 만들어 주세요.",
    reason
  });

  for (const transferId of session.transferIds) {
    const transfer = transfers.get(transferId);
    if (transfer) {
      transfer.status = TRANSFER_STATES.FAILED;
      transfer.failureReason = reason;
      emitToTransferPeers(transfer, "transfer:failed");
      removeTransfer(transferId);
    }
  }

  codeToSessionId.delete(session.code);
  sessions.delete(session.id);
}

function cleanupExpired() {
  const current = now();

  for (const session of sessions.values()) {
    if (session.expiresAt <= current) {
      expireSession(session, "session_expired");
    }
  }

  for (const transfer of transfers.values()) {
    if (transfer.expiresAt <= current) {
      transfer.status = TRANSFER_STATES.EXPIRED;
      transfer.failureReason = "transfer_expired";
      emitToTransferPeers(transfer, "transfer:failed");
      removeTransfer(transfer.id);
    }
  }
}

function transferDownloadUrl(req, transfer, { mobileFacing = false } = {}) {
  const baseUrl = mobileFacing ? mobileServerBaseUrl(req) : requestBaseUrl(req);
  return `${baseUrl}/api/transfers/${transfer.id}/download?sessionId=${encodeURIComponent(transfer.sessionId)}`;
}

function isRelayTransfer(transfer) {
  return Boolean(transfer?.filePath) && (!transfer.storageKey || transfer.storageDriver === "local-relay");
}

function isTransferDownloadable(transfer) {
  return [TRANSFER_STATES.ACCEPTED, TRANSFER_STATES.DOWNLOAD_STARTED, "download_started"].includes(transfer?.status);
}

function requestBaseUrl(req) {
  return `${req.protocol}://${req.get("host")}`;
}

function publicUrlOrRequest(publicUrl, req) {
  return publicUrl || requestBaseUrl(req);
}

function setDownloadHeaders(res, transfer) {
  res.setHeader("Content-Type", transfer.mimeType || "application/octet-stream");
  res.setHeader("Content-Length", String(transfer.size));
  res.setHeader("Content-Disposition", contentDispositionAttachment(transfer.fileName));
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, Content-Length, Content-Type");
}

function pipeDownloadStream(stream, res) {
  const readable = typeof stream?.pipe === "function" ? stream : Readable.fromWeb(stream);
  readable.on("error", () => {
    if (!res.headersSent) {
      res.status(500).json({ error: "파일을 읽는 중 오류가 발생했습니다." });
    } else {
      res.destroy();
    }
  });
  readable.pipe(res);
}

function mobileServerBaseUrl(req) {
  if (isPublicDeployment(req)) {
    return publicUrlOrRequest(config.publicApiUrl, req);
  }

  return resolveMobileServerBaseUrl({
    requestBaseUrl: requestBaseUrl(req),
    publicUrl: config.publicApiUrl,
    candidateUrls: localNetworkUrls(config.port),
    apiPort: config.port
  });
}

function mobileWebBaseUrl(req) {
  if (isPublicDeployment(req)) {
    return config.publicWebAppUrl || "";
  }

  return resolveMobileWebBaseUrl({
    requestBaseUrl: requestBaseUrl(req),
    publicUrl: config.publicWebAppUrl,
    candidateUrls: localNetworkUrls(WEB_DEV_PORT),
    webPort: WEB_DEV_PORT
  });
}

function isPublicDeployment(req = null) {
  if (config.appMode === "production") {
    return true;
  }
  return req ? isPublicRequestHost(req) : false;
}

function isPublicRequestHost(req) {
  const hostname = String(req?.hostname || req?.get?.("host") || "")
    .split(":")[0]
    .toLowerCase();
  if (!hostname || isLoopbackHost(hostname) || isPrivateLanHost(hostname)) {
    return false;
  }
  return hostname === "api.getvibeshare.com" || hostname.endsWith(".getvibeshare.com");
}

function runtimeDriverSummary() {
  return {
    database: {
      configured: config.databaseDriver,
      active: metadataStore.driver,
      fallbackFrom: metadataStore.fallbackFrom || null,
      fallbackActive: Boolean(metadataStore.fallbackFrom)
    },
    cache: {
      configured: config.cacheDriver,
      active: cache.driver,
      fallbackFrom: cache.fallbackFrom || null,
      fallbackActive: Boolean(cache.fallbackFrom)
    },
    realtime: {
      configured: config.realtimeAdapter,
      active: realtime.driver,
      fallbackFrom: realtime.fallbackFrom || null,
      fallbackActive: Boolean(realtime.fallbackFrom)
    },
    storage: {
      configured: config.storageDriver,
      active: storage.kind,
      fallbackFrom: null,
      fallbackActive: false
    }
  };
}

function storageDiagnostics() {
  return {
    kind: storage.kind,
    provider: config.s3?.provider || "generic-s3",
    endpointHost: safeUrlHost(config.s3?.endpoint || ""),
    region: config.s3?.region || "",
    bucket: config.s3?.bucket || "",
    forcePathStyle: Boolean(config.s3?.forcePathStyle)
  };
}

function safeUrlHost(value) {
  try {
    return new URL(value).host;
  } catch {
    return "";
  }
}

function fallbackWarnings() {
  return Object.entries(runtimeDriverSummary())
    .filter(([, value]) => value.fallbackActive)
    .map(([name, value]) => `${name} configured as ${value.configured} but running as ${value.active}`);
}

function createStorageKey({ transferId, fileName }) {
  const safeName = String(fileName || "vibe-share-file").replace(/[^\w.-]/g, "_").slice(0, 120) || "vibe-share-file";
  return `transfers/${transferId}/${safeName}`;
}

function publicUpload(upload) {
  return {
    id: upload.id,
    transferId: upload.transferId,
    sessionId: upload.sessionId,
    status: upload.status,
    partSize: upload.partSize,
    totalParts: upload.totalParts,
    uploadedParts: [...upload.parts.values()].map((part) => ({
      partNumber: part.partNumber,
      etag: part.etag,
      checksum: part.checksum,
      size: part.size
    })),
    storageDriver: storage.kind,
    createdAt: upload.createdAt,
    updatedAt: upload.updatedAt
  };
}

function durableUpload(upload) {
  return {
    ...publicUpload(upload),
    sender: upload.sender,
    receiver: upload.receiver,
    providerUploadId: upload.providerUploadId,
    storageKey: upload.storageKey,
    partSize: upload.partSize,
    totalParts: upload.totalParts,
    parts: [...upload.parts.values()]
  };
}

function reviveUpload(record) {
  if (!record?.id) {
    return null;
  }
  const upload = {
    ...record,
    sender: record.sender || record.from || null,
    receiver: record.receiver || record.to || null,
    partSize: record.partSize || record.partSizeBytes || config.chunkSizeBytes,
    totalParts: record.totalParts || 0,
    parts: new Map()
  };
  for (const part of record.parts || record.uploadedParts || []) {
    if (Number.isInteger(part.partNumber)) {
      upload.parts.set(part.partNumber, part);
    }
  }
  uploadSessions.set(upload.id, upload);
  return upload;
}

async function resolveUpload(uploadId) {
  const localUpload = uploadSessions.get(uploadId);
  if (localUpload) {
    return localUpload;
  }
  const record = await getMetadata("uploadSessions", uploadId);
  return reviveUpload(record);
}

async function resolveTransfer(transferId) {
  const localTransfer = transfers.get(transferId);
  if (localTransfer) {
    return localTransfer;
  }
  const record = await getMetadata("transfers", transferId);
  if (!record?.id) {
    return null;
  }
  transfers.set(record.id, record);
  return record;
}

async function roleOnline(session, role) {
  if (session?.[`${role}SocketId`]) {
    return true;
  }
  const sockets = await io.in(session.id).fetchSockets().catch(() => []);
  return sockets.some((socket) => socket.data?.role === role);
}

function sendError(res, status, message, extra = {}) {
  return res.status(status).json({
    error: message,
    ...extra
  });
}

function requireAdmin(req, res, next) {
  if (config.appMode !== "production") {
    next();
    return;
  }

  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (config.adminToken && token === config.adminToken) {
    next();
    return;
  }

  res.status(401).json({ error: "Admin token is required." });
}

async function getAuthUser(req) {
  const token = readBearerToken(req);
  const payload = verifyAuthToken(config, token);
  if (!payload?.sub) {
    return null;
  }
  const user = await getMetadata("users", payload.sub);
  return user || {
    id: payload.sub,
    email: payload.email || null,
    displayName: payload.name || null,
    anonymous: Boolean(payload.anonymous)
  };
}

async function authorizeSessionRole(req, session, role) {
  if (!session || !isValidRole(role)) {
    return false;
  }
  if (!config.requireDeviceTrust) {
    return true;
  }

  const token = String(req.header("x-vibe-device-token") || req.query.deviceToken || "");
  const deviceId = String(req.header("x-vibe-device-id") || req.query.deviceId || session[`${role}DeviceId`] || "");
  if (!token || !deviceId) {
    return false;
  }

  const device = await getMetadata("devices", deviceId);
  if (!device || device.role !== role || device.sessionId !== session.id || device.revokedAt) {
    return false;
  }
  if (device.trustedUntil && Number(device.trustedUntil) <= now()) {
    return false;
  }

  return device.trustTokenHash === hashDeviceTrustToken(config, token);
}

function authResponse(user, token) {
  return {
    user: {
      id: user.id,
      email: user.email || null,
      displayName: user.displayName || null,
      anonymous: Boolean(user.anonymous)
    },
    token
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

app.get("/", (req, res) => {
  const requestUrl = `${req.protocol}://${req.get("host")}`;
  const localServerUrl = `http://localhost:${config.port}`;
  const localWebUrl = `http://localhost:${WEB_DEV_PORT}`;
  const lanServerUrls = localNetworkUrls(config.port);
  const lanWebUrls = localNetworkUrls(WEB_DEV_PORT);
  const primaryLanServerUrl = lanServerUrls[0] || "";
  const primaryLanWebUrl = lanWebUrls[0] || "";
  const drivers = runtimeDriverSummary();
  const warningText = fallbackWarnings();
  res.type("html").send(`<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Vibe Share API Status</title>
    <style>
      body{font-family:Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;margin:0;background:#f7faf9;color:#111827}
      main{max-width:960px;margin:0 auto;padding:36px 18px}
      section{background:#fff;border:1px solid #d1d5db;border-radius:8px;margin-bottom:16px;padding:22px}
      h1{font-size:34px;line-height:1.15;margin:0 0 12px}
      h2{font-size:22px;margin:0 0 10px}
      p{line-height:1.55;margin:0 0 10px}
      code{background:#eef2f7;border-radius:6px;display:inline-block;margin:3px 4px 3px 0;padding:3px 7px}
      a{color:#0f766e;font-weight:700;overflow-wrap:anywhere}
      .danger{background:#fff7ed;border:2px solid #dc2626}
      .danger strong{color:#991b1b}
      .grid{display:grid;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr))}
      .card{background:#f8fafc;border:1px solid #d1d5db;border-radius:8px;padding:14px}
      .card strong{display:block;margin-bottom:6px}
      ol{line-height:1.65;margin:0;padding-left:22px}
      @media(max-width:760px){.grid{grid-template-columns:1fr}}
    </style>
  </head>
  <body>
    <main>
      <section class="danger">
        <h1>Vibe Share API 상태</h1>
        <p><strong>이 주소는 Vibe Share의 API/relay/status 서버입니다. 파일을 보내는 일반 사용자 화면은 PC 웹앱입니다.</strong></p>
        <p>아이폰 Safari에서 <code>localhost</code>를 열면 PC가 아니라 아이폰 자기 자신을 찾습니다. 휴대폰에서는 QR 스캔 또는 PC LAN 주소를 사용하세요.</p>
        <p>실제 전송 흐름은 PC 웹앱에서 QR을 먼저 보여 주고, 휴대폰 카메라가 그 QR을 스캔해 모바일 웹으로 연결한 뒤 보낼지 받을지 선택하는 방식입니다.</p>
      </section>

      <section>
        <h2>서비스 표면</h2>
        <div class="grid">
          <div class="card">
            <strong>공식 사이트</strong>
            <a href="${escapeHtml(config.publicSiteUrl)}">${escapeHtml(config.publicSiteUrl)}</a>
            <p>제품 소개, 베타 모집, FAQ, 지원 안내용 공개 사이트입니다.</p>
          </div>
          <div class="card">
            <strong>웹앱 / PC 화면</strong>
            <a href="${escapeHtml(config.publicWebAppUrl)}">${escapeHtml(config.publicWebAppUrl)}</a>
            <p>PC에서 QR과 6자리 코드를 보여 주고, 연결 후 파일 전송 방향을 선택하는 화면입니다.</p>
          </div>
          <div class="card">
            <strong>API 서버</strong>
            <a href="${escapeHtml(config.publicApiUrl)}">${escapeHtml(config.publicApiUrl)}</a>
            <p>세션, relay, status, auth, metadata를 담당하는 서버입니다.</p>
          </div>
          <div class="card">
            <strong>모바일 화면</strong>
            <p>기본 베타 흐름은 휴대폰 카메라로 QR을 스캔해 열리는 모바일 웹입니다. 네이티브 앱은 store beta용으로 준비합니다.</p>
          </div>
        </div>
      </section>

      <section>
        <h2>현재 서버 상태</h2>
        <p><strong>상태:</strong> 정상</p>
        <p><strong>현재 접속한 서버 주소:</strong> <code>${escapeHtml(requestUrl)}</code></p>
        <p><strong>모드:</strong> ${escapeHtml(config.appMode)}</p>
        <p><strong>스토리지:</strong> ${escapeHtml(storage.kind)}</p>
        <p><strong>최대 파일 크기:</strong> ${escapeHtml(formatBytes(config.maxFileSizeBytes))}</p>
        <p><strong>드라이버:</strong> DB ${escapeHtml(drivers.database.active)} / Cache ${escapeHtml(drivers.cache.active)} / Realtime ${escapeHtml(drivers.realtime.active)} / Storage ${escapeHtml(drivers.storage.active)}</p>
        ${warningText.length ? `<p><strong>Fallback:</strong> ${warningText.map(escapeHtml).join(", ")}</p>` : ""}
      </section>

      <section>
        <h2>Store beta 준비 범위</h2>
        <div class="grid">
          <div class="card">
            <strong>지금 검증 가능한 기능</strong>
            <p>QR/code pairing, PC -> 모바일, 모바일 -> PC, 수락/거절, 진행 상태를 확인할 수 있습니다.</p>
          </div>
          <div class="card">
            <strong>운영자가 확인할 것</strong>
            <p><code>/health</code>, <code>/admin/health</code>, <code>/admin/status</code>에서 active/configured driver와 fallbackWarnings를 확인합니다.</p>
          </div>
          <div class="card">
            <strong>보안/신뢰 표현</strong>
            <p>세션 기반 전송, 임시 보관, cleanup, object storage 기반 대용량 경로까지만 약속합니다.</p>
          </div>
          <div class="card">
            <strong>아직 남은 출시 작업</strong>
            <p>공개 계정, 결제, 실제 malware scanner, legal/privacy, native 모바일 대용량 background upload, 스토어 제출은 남은 작업입니다.</p>
          </div>
        </div>
      </section>

      <section>
        <h2>주소 구분</h2>
        <div class="grid">
          <div class="card">
            <strong>PC 브라우저에서 여는 웹 주소</strong>
            <a href="${escapeHtml(localWebUrl)}">${escapeHtml(localWebUrl)}</a>
          </div>
          <div class="card">
            <strong>휴대폰 Safari에서 직접 열 웹 주소</strong>
            ${primaryLanWebUrl ? `<a href="${escapeHtml(primaryLanWebUrl)}">${escapeHtml(primaryLanWebUrl)}</a>` : "LAN 웹 주소를 찾지 못했습니다. PC에서 ipconfig를 확인하세요."}
          </div>
          <div class="card">
            <strong>PC 내부 API 주소</strong>
            <code>${escapeHtml(localServerUrl)}</code>
          </div>
          <div class="card">
            <strong>앱 내부 페어링 서버 주소</strong>
            ${primaryLanServerUrl ? `<code>${escapeHtml(primaryLanServerUrl)}</code>` : "LAN 서버 주소를 찾지 못했습니다. PC에서 ipconfig를 확인하세요."}
          </div>
        </div>
      </section>

      <section>
        <h2>올바른 사용 순서</h2>
        <ol>
          <li>PC에서 Vibe Share 웹앱을 엽니다: <a href="${escapeHtml(localWebUrl)}">${escapeHtml(localWebUrl)}</a></li>
          <li>휴대폰 카메라로 PC 화면의 QR을 스캔합니다.</li>
          <li>휴대폰 웹이 열리고 연결됨 상태가 보이면 보낼지 받을지 선택합니다.</li>
          <li>PC 또는 휴대폰에서 파일을 선택해 전송합니다.</li>
          <li>Safari로 이 서버 주소를 직접 열었다면 API 연결 확인만 된 것입니다. 실제 전송은 PC 웹앱의 QR에서 시작하세요.</li>
        </ol>
      </section>
    </main>
  </body>
</html>`);
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "vibe-share-server",
    mode: config.appMode,
    publicUrls: {
      site: config.publicSiteUrl,
      webApp: config.publicWebAppUrl,
      api: config.publicApiUrl
    },
    storage: storage.kind,
    database: metadataStore.driver,
    cache: cache.driver,
    realtime: realtime.driver,
    configuredDrivers: {
      storage: config.storageDriver,
      database: config.databaseDriver,
      cache: config.cacheDriver,
      realtime: config.realtimeAdapter
    },
    activeDrivers: runtimeDriverSummary(),
    fallbackWarnings: fallbackWarnings(),
    now: new Date().toISOString()
  });
});

app.get("/api/info", (req, res) => {
  const publicDeployment = isPublicDeployment(req);
  const lanServerUrls = publicDeployment ? [] : localNetworkUrls(config.port);
  const lanWebUrls = publicDeployment ? [] : localNetworkUrls(WEB_DEV_PORT);
  const mobileServerUrl = mobileServerBaseUrl(req);
  const mobileWebUrl = mobileWebBaseUrl(req);

  res.json({
    ok: true,
    mode: config.appMode,
    storageDriver: storage.kind,
    databaseDriver: metadataStore.driver,
    cacheDriver: cache.driver,
    realtimeDriver: realtime.driver,
    configuredDrivers: {
      storage: config.storageDriver,
      database: config.databaseDriver,
      cache: config.cacheDriver,
      realtime: config.realtimeAdapter
    },
    activeDrivers: runtimeDriverSummary(),
    fallbackWarnings: fallbackWarnings(),
    port: config.port,
    publicUrls: {
      site: config.publicSiteUrl,
      webApp: config.publicWebAppUrl,
      api: config.publicApiUrl
    },
    maxFileSizeBytes: config.maxFileSizeBytes,
    maxFileSizeText: formatBytes(config.maxFileSizeBytes),
    legacyRelayMaxFileSizeBytes: config.legacyRelayMaxFileSizeBytes,
    legacyRelayMaxFileSizeText: formatBytes(config.legacyRelayMaxFileSizeBytes),
    uploadChunkSizeBytes: config.chunkSizeBytes,
    uploadChunkSizeText: formatBytes(config.chunkSizeBytes),
    signedUrlTtlSeconds: config.signedUrlTtlSeconds,
    sessionTtlMs: config.sessionTtlMs,
    transferTtlMs: config.transferTtlMs,
    validation: config.validation,
    requestBaseUrl: publicDeployment ? (config.publicApiUrl || requestBaseUrl(req)) : requestBaseUrl(req),
    localServerUrl: publicDeployment ? null : `http://localhost:${config.port}`,
    localWebUrl: publicDeployment ? null : `http://localhost:${WEB_DEV_PORT}`,
    mobileServerUrl,
    mobileWebUrl,
    downloadBaseUrl: mobileServerUrl,
    primaryLanServerUrl: publicDeployment ? null : (lanServerUrls[0] || ""),
    primaryLanWebUrl: publicDeployment ? null : (lanWebUrls[0] || ""),
    lanBaseUrls: lanServerUrls,
    lanWebUrls
  });
});

app.get("/admin/health", requireAdmin, async (_req, res) => {
  const [databaseHealth, cacheHealth, storageHealth] = await Promise.allSettled([
    metadataStore.health?.(),
    cache.health?.(),
    storage.health?.()
  ]);

  res.json({
    ok: databaseHealth.status === "fulfilled" && cacheHealth.status === "fulfilled" && storageHealth.status === "fulfilled",
    service: "vibe-share-server",
    mode: config.appMode,
    publicUrls: {
      site: config.publicSiteUrl,
      webApp: config.publicWebAppUrl,
      api: config.publicApiUrl
    },
    configuredDrivers: {
      storage: config.storageDriver,
      database: config.databaseDriver,
      cache: config.cacheDriver,
      realtime: config.realtimeAdapter
    },
    activeDrivers: runtimeDriverSummary(),
    fallbackWarnings: fallbackWarnings(),
    storage: {
      driver: storage.kind,
      ...(storageHealth.status === "fulfilled" ? storageHealth.value : { available: false, error: storageHealth.reason?.message })
    },
    realtime,
    database: databaseHealth.status === "fulfilled"
      ? databaseHealth.value
      : { driver: metadataStore.driver, available: false, error: databaseHealth.reason?.message },
    cache: cacheHealth.status === "fulfilled"
      ? cacheHealth.value
      : { driver: cache.driver, available: false, error: cacheHealth.reason?.message },
    runtime: {
      sessions: sessions.size,
      transfers: transfers.size,
      uploadSessions: uploadSessions.size,
      pairings: codeToSessionId.size
    },
    validation: config.validation,
    now: new Date().toISOString()
  });
});

app.get("/admin/status", requireAdmin, async (_req, res) => {
  const databaseHealth = await metadataStore.health?.().catch((error) => ({
    driver: metadataStore.driver,
    available: false,
    error: error.message
  }));
  const cacheHealth = await cache.health?.().catch((error) => ({
    driver: cache.driver,
    available: false,
    error: error.message
  }));
  const storageHealth = await storage.health?.().catch((error) => ({
    driver: storage.kind,
    available: false,
    error: error.message
  }));

  res.json({
    appMode: config.appMode,
    publicUrls: {
      site: config.publicSiteUrl,
      webApp: config.publicWebAppUrl,
      api: config.publicApiUrl
    },
    configuredDrivers: {
      storage: config.storageDriver,
      database: config.databaseDriver,
      cache: config.cacheDriver,
      realtime: config.realtimeAdapter
    },
    activeDrivers: runtimeDriverSummary(),
    fallbackWarnings: fallbackWarnings(),
    storageDriver: storage.kind,
    storage: storageHealth,
    database: databaseHealth,
    cache: cacheHealth,
    realtime,
    limits: {
      maxFileSizeBytes: config.maxFileSizeBytes,
      legacyRelayMaxFileSizeBytes: config.legacyRelayMaxFileSizeBytes,
      chunkSizeBytes: config.chunkSizeBytes,
      chunkUploadMaxBytes: config.chunkUploadMaxBytes,
      signedUrlTtlSeconds: config.signedUrlTtlSeconds
    },
    retention: {
      sessionTtlMs: config.sessionTtlMs,
      transferTtlMs: config.transferTtlMs,
      cleanupIntervalMs: config.cleanupIntervalMs
    },
    runtime: {
      sessions: sessions.size,
      transfers: transfers.size,
      uploadSessions: uploadSessions.size,
      pairings: codeToSessionId.size
    },
    validation: config.validation
  });
});

app.post("/api/auth/dev-login", async (req, res) => {
  if (!config.authDevLoginEnabled) {
    return sendError(res, 404, "Dev login is disabled.");
  }

  const email = String(req.body?.email || "").trim().toLowerCase();
  const displayName = String(req.body?.displayName || email.split("@")[0] || "Vibe Share User").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendError(res, 400, "A valid email is required.");
  }

  const existingUsers = await listMetadata("users", (user) => user.email === email);
  const user = existingUsers?.[0] || {
    id: crypto.randomUUID(),
    email,
    displayName,
    anonymous: false,
    createdAt: now()
  };
  user.displayName = displayName || user.displayName;
  user.anonymous = false;

  await metadataStore.upsert("users", user);
  const token = createAuthToken(config, user);
  persist(metadataStore.addAudit({ type: "auth.dev_login", actor: user.id, userId: user.id, requestIp: req.ip || null }), "audit write failed");
  return res.json(authResponse(user, token));
});

app.get("/api/auth/me", async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) {
    return sendError(res, 401, "Authentication is required.");
  }
  return res.json({ user: authResponse(user, "").user });
});

app.get("/api/devices", async (req, res) => {
  const user = await getAuthUser(req);
  const deviceToken = String(req.header("x-vibe-device-token") || "");
  const tokenHash = deviceToken ? hashDeviceTrustToken(config, deviceToken) : "";

  if (!user && !tokenHash) {
    return sendError(res, 401, "Authentication or device trust token is required.");
  }

  const devices = await listMetadata("devices", (device) => {
    if (user && device.userId === user.id) {
      return true;
    }
    return tokenHash && device.trustTokenHash === tokenHash;
  });

  return res.json({
    devices: (devices || []).map((device) => ({
      id: device.id,
      userId: device.userId || null,
      sessionId: device.sessionId || null,
      role: device.role || null,
      trustedUntil: device.trustedUntil || null,
      revokedAt: device.revokedAt || null,
      createdAt: device.createdAt || null
    }))
  });
});

app.post("/api/devices/register", async (req, res) => {
  const user = await getAuthUser(req);
  const session = req.body?.sessionId ? await resolveSession(String(req.body.sessionId)) : null;
  const role = String(req.body?.role || "");
  if (!user && !session) {
    return sendError(res, 401, "Authentication or active session is required.");
  }
  if (role && !isValidRole(role)) {
    return sendError(res, 400, "Invalid device role.");
  }

  const trust = createDeviceTrust({ config, sessionId: session?.id || null, role: role || "pc" });
  const device = {
    ...trust.device,
    userId: user?.id || session?.anonymousUserId || null,
    name: String(req.body?.name || "Vibe Share Device").slice(0, 120)
  };
  await metadataStore.upsert("devices", device);
  persist(metadataStore.addAudit({ type: "device.registered", actor: user?.id || "anonymous", sessionId: session?.id, deviceId: device.id }), "audit write failed");
  return res.status(201).json({
    device: {
      id: device.id,
      role: device.role,
      sessionId: device.sessionId,
      trustedUntil: device.trustedUntil
    },
    deviceTrustToken: trust.token
  });
});

app.post("/api/devices/:deviceId/revoke", async (req, res) => {
  const user = await getAuthUser(req);
  const deviceToken = String(req.header("x-vibe-device-token") || "");
  const device = await getMetadata("devices", req.params.deviceId);
  if (!device) {
    return sendError(res, 404, "Device not found.");
  }

  const ownsDevice = user && device.userId === user.id;
  const tokenMatches = deviceToken && device.trustTokenHash === hashDeviceTrustToken(config, deviceToken);
  if (!ownsDevice && !tokenMatches) {
    return sendError(res, 403, "Device revoke is not allowed.");
  }

  const revoked = { ...device, revokedAt: now(), trustedUntil: now() };
  await metadataStore.upsert("devices", revoked);
  persist(metadataStore.addAudit({ type: "device.revoked", actor: user?.id || "device", sessionId: device.sessionId, deviceId: device.id }), "audit write failed");
  return res.json({ device: { id: revoked.id, revokedAt: revoked.revokedAt } });
});

app.post("/api/sessions", async (req, res) => {
  const { session, pcDeviceTrustToken } = await createSession(req);
  res.status(201).json({
    session: publicSession(session),
    auth: {
      mode: "anonymous",
      role: "pc",
      deviceId: session.pcDeviceId,
      deviceTrustToken: pcDeviceTrustToken
    },
    limits: {
      maxFileSizeBytes: config.maxFileSizeBytes,
      maxFileSizeText: formatBytes(config.maxFileSizeBytes),
      sessionTtlMs: config.sessionTtlMs,
      transferTtlMs: config.transferTtlMs
    }
  });
});

app.post("/api/sessions/join", async (req, res) => {
  const code = String(req.body?.code || "").replace(/\D/g, "").slice(0, 6);
  const joinSource = String(req.body?.joinSource || req.body?.join_source || "manual").slice(0, 24) || "manual";

  if (!/^\d{6}$/.test(code)) {
    logger.warn("api session join failed", { code, joinSource, reason: "invalid_code" });
    return sendError(res, 400, "6자리 숫자 코드를 입력해 주세요.");
  }

  const session = await resolveSessionByCode(code);
  if (!session) {
    logger.warn("api session join failed", { code, joinSource, reason: "session_not_found" });
    return sendError(res, 404, "코드가 없거나 세션이 만료되었습니다.");
  }

  const mobileTrust = createDeviceTrust({ config, sessionId: session.id, role: "mobile" });
  session.mobileDeviceId = mobileTrust.device.id;
  await Promise.all([
    metadataStore.upsert("devices", {
      ...mobileTrust.device,
      userId: session.userId || session.anonymousUserId || null
    }),
    cache.set(`session:${session.id}`, serializeSession(session), Math.ceil(config.sessionTtlMs / 1000))
  ]);
  persist(metadataStore.upsert("pairings", {
    id: crypto.randomUUID(),
    sessionId: session.id,
    pcDeviceId: session.pcDeviceId || null,
    mobileDeviceId: mobileTrust.device.id,
    codeHash: hashPairingCode(config, code),
    status: "paired",
    createdAt: now()
  }), "pairing metadata write failed");
  persist(metadataStore.addAudit({
    type: "session.joined_by_code",
    sessionId: session.id,
    actor: "anonymous-mobile",
    joinSource,
    requestIp: req.ip || null
  }), "audit write failed");

  const publicState = publicSession(session);
  logger.info("api session join succeeded", {
    code,
    joinSource,
    sessionId: session.id,
    paired: publicState.paired,
    pcConnected: publicState.pcConnected,
    mobileConnected: publicState.mobileConnected
  });

  return res.json({
    session: publicState,
    auth: {
      mode: "anonymous",
      role: "mobile",
      deviceId: session.mobileDeviceId,
      deviceTrustToken: mobileTrust.token
    },
    limits: {
      maxFileSizeBytes: config.maxFileSizeBytes,
      maxFileSizeText: formatBytes(config.maxFileSizeBytes),
      sessionTtlMs: config.sessionTtlMs,
      transferTtlMs: config.transferTtlMs
    }
  });
});

app.post("/api/transfers", (req, res) => {
  upload.single("file")(req, res, async (error) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return sendError(res, 413, `File is too large for local relay mode. Maximum relay size is ${formatBytes(config.legacyRelayMaxFileSizeBytes)}. Use resumable upload for larger files.`);
    }

    if (error) {
      return sendError(res, 400, "파일 업로드에 실패했습니다.", { detail: error.message });
    }

    const sessionId = String(req.body?.sessionId || "");
    const sender = String(req.body?.sender || "");
    const session = await resolveSession(sessionId);

    if (!session || !isValidRole(sender)) {
      if (req.file?.path) {
        await fsp.unlink(req.file.path).catch(() => {});
      }
      return sendError(res, 400, "세션 또는 보낸 쪽 정보가 올바르지 않습니다.");
    }

    if (!(await authorizeSessionRole(req, session, sender))) {
      if (req.file?.path) {
        await fsp.unlink(req.file.path).catch(() => {});
      }
      return sendError(res, 403, "Device trust validation failed.");
    }

    if (!req.file) {
      return sendError(res, 400, "보낼 파일을 선택해 주세요.");
    }

    const receiver = otherRole(sender);
    if (!(await roleOnline(session, sender)) || !(await roleOnline(session, receiver))) {
      await fsp.unlink(req.file.path).catch(() => {});
      return sendError(res, 409, "PC와 휴대폰이 모두 연결된 뒤 파일을 보낼 수 있습니다.");
    }

    const createdAt = now();
    const transfer = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      from: sender,
      to: receiver,
      fileName: req.file.originalname || "vibe-share-file",
      mimeType: req.file.mimetype || "application/octet-stream",
      size: req.file.size,
      filePath: req.file.path,
      fileDeleted: false,
      storageDriver: "local-relay",
      status: TRANSFER_STATES.PENDING_ACCEPT,
      failureReason: null,
      createdAt,
      expiresAt: createdAt + config.transferTtlMs
    };

    transfers.set(transfer.id, transfer);
    session.transferIds.add(transfer.id);
    persist(metadataStore.upsert("transfers", publicTransfer(transfer)), "transfer metadata write failed");
    persist(metadataStore.addAudit({
      type: "transfer.legacy_uploaded",
      sessionId: session.id,
      transferId: transfer.id,
      actor: sender
    }), "audit write failed");

    const payload = {
      transfer: {
        ...publicTransfer(transfer),
        downloadUrl: transferDownloadUrl(req, transfer)
      }
    };

    io.to(session.id).emit("transfer:pending", payload);
    io.to(session.id).emit("transfer:offer", payload);

    return res.status(201).json(payload);
  });
});

app.post("/api/uploads/initiate", async (req, res) => {
  const sessionId = String(req.body?.sessionId || "");
  const sender = String(req.body?.sender || "");
  const fileName = String(req.body?.fileName || "");
  const mimeType = String(req.body?.mimeType || "application/octet-stream");
  const size = Number(req.body?.size);
  const session = await resolveSession(sessionId);

  if (!session || !isValidRole(sender)) {
    return sendError(res, 400, "Invalid session or sender.");
  }

  const receiver = otherRole(sender);
  if (!(await authorizeSessionRole(req, session, sender))) {
    return sendError(res, 403, "Device trust validation failed.");
  }

  if (!(await roleOnline(session, sender)) || !(await roleOnline(session, receiver))) {
    return sendError(res, 409, "Both paired devices must be online before starting a transfer.");
  }

  const validationErrors = validateFileMetadata({ fileName, mimeType, size }, config);
  if (validationErrors.length > 0) {
    return sendError(res, 400, "Invalid file metadata.", { details: validationErrors });
  }

  const createdAt = now();
  const transferId = crypto.randomUUID();
  const uploadId = crypto.randomUUID();
  const storageKey = createStorageKey({ transferId, fileName });
  const totalParts = Math.ceil(size / config.chunkSizeBytes);

  let provider;
  try {
    provider = await storage.createMultipartUpload({
      uploadId,
      storageKey,
      fileName,
      mimeType
    });
  } catch (error) {
    logger.error("storage multipart upload initiate failed", {
      requestId: req.id,
      error,
      storage: storageDiagnostics()
    });
    return sendError(res, 502, "Object storage upload could not be started.", {
      code: "STORAGE_MULTIPART_INITIATE_FAILED"
    });
  }

  const transfer = {
    id: transferId,
    sessionId: session.id,
    from: sender,
    to: receiver,
    fileName,
    mimeType,
    size,
    storageKey,
    storageDriver: storage.kind,
    status: TRANSFER_STATES.UPLOADING,
    failureReason: null,
    createdAt,
    expiresAt: createdAt + config.transferTtlMs
  };

  const upload = {
    id: uploadId,
    transferId,
    sessionId: session.id,
    sender,
    receiver,
    storageKey,
    providerUploadId: provider.providerUploadId,
    status: TRANSFER_STATES.UPLOADING,
    partSize: config.chunkSizeBytes,
    totalParts,
    parts: new Map(),
    createdAt,
    updatedAt: createdAt
  };

  transfers.set(transfer.id, transfer);
  uploadSessions.set(upload.id, upload);
  session.transferIds.add(transfer.id);

  persist(metadataStore.upsert("transfers", publicTransfer(transfer)), "transfer metadata write failed");
  persist(metadataStore.upsert("uploadSessions", durableUpload(upload)), "upload session metadata write failed");
  persist(metadataStore.addAudit({
    type: "upload.initiated",
    sessionId: session.id,
    transferId,
    uploadId,
    actor: sender,
    storageDriver: storage.kind
  }), "audit write failed");

  return res.status(201).json({
    transfer: publicTransfer(transfer),
    upload: publicUpload(upload),
    limits: {
      maxFileSizeBytes: config.maxFileSizeBytes,
      chunkSizeBytes: config.chunkSizeBytes,
      directToStorage: storage.kind === "s3"
    }
  });
});

app.get("/api/uploads/:uploadId/status", async (req, res) => {
  const upload = await resolveUpload(req.params.uploadId);
  if (!upload || upload.sessionId !== String(req.query.sessionId || "")) {
    return sendError(res, 404, "Upload session not found.");
  }
  return res.json({ upload: publicUpload(upload) });
});

app.post("/api/uploads/:uploadId/parts/:partNumber/url", async (req, res) => {
  const upload = await resolveUpload(req.params.uploadId);
  const sessionId = String(req.body?.sessionId || req.query.sessionId || "");
  const partNumber = Number(req.params.partNumber);

  if (!upload || upload.sessionId !== sessionId) {
    return sendError(res, 404, "Upload session not found.");
  }

  if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > upload.totalParts) {
    return sendError(res, 400, "Invalid part number.");
  }

  const mobileFacing = upload.sender === "mobile";
  let target = await storage.getUploadPartTarget({
    uploadId: upload.id,
    providerUploadId: upload.providerUploadId,
    storageKey: upload.storageKey,
    partNumber,
    baseUrl: mobileFacing ? mobileServerBaseUrl(req) : requestBaseUrl(req),
    sessionId: upload.sessionId
  });

  if (mobileFacing && target.directToStorage && isMobileFacingUrlBlocked(target.url)) {
    target = {
      directToStorage: false,
      method: "PUT",
      url: `${mobileServerBaseUrl(req)}/api/uploads/${upload.id}/parts/${partNumber}?sessionId=${encodeURIComponent(upload.sessionId)}`,
      headers: {}
    };
  }

  return res.json({ target });
});

app.put(
  "/api/uploads/:uploadId/parts/:partNumber",
  express.raw({ type: "*/*", limit: config.chunkUploadMaxBytes }),
  async (req, res) => {
    const upload = await resolveUpload(req.params.uploadId);
    const sessionId = String(req.query.sessionId || req.header("x-vibe-session-id") || "");
    const partNumber = Number(req.params.partNumber);

    if (!upload || upload.sessionId !== sessionId) {
      return sendError(res, 404, "Upload session not found.");
    }

    if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > upload.totalParts) {
      return sendError(res, 400, "Invalid part number.");
    }

    const session = await resolveSession(upload.sessionId);
    if (!(await authorizeSessionRole(req, session, upload.sender))) {
      return sendError(res, 403, "Device trust validation failed.");
    }

    const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
    const part = await storage.savePart({
      uploadId: upload.id,
      providerUploadId: upload.providerUploadId,
      storageKey: upload.storageKey,
      partNumber,
      body,
      stream: Readable.from(body),
      expectedChecksum: req.header("x-checksum-sha256") || ""
    });

    upload.parts.set(partNumber, part);
    upload.updatedAt = now();

    persist(metadataStore.upsert("uploadParts", durableUpload(upload)), "upload part metadata write failed");
    persist(metadataStore.addAudit({
      type: "upload.part_received",
      sessionId: upload.sessionId,
      transferId: upload.transferId,
      uploadId: upload.id,
      partNumber
    }), "audit write failed");

    return res.json({ part, upload: publicUpload(upload) });
  }
);

app.post("/api/uploads/:uploadId/parts/:partNumber/complete", async (req, res) => {
  const upload = await resolveUpload(req.params.uploadId);
  const sessionId = String(req.body?.sessionId || "");
  const partNumber = Number(req.params.partNumber);

  if (!upload || upload.sessionId !== sessionId) {
    return sendError(res, 404, "Upload session not found.");
  }

  if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > upload.totalParts) {
    return sendError(res, 400, "Invalid part number.");
  }

  const session = await resolveSession(upload.sessionId);
  if (!(await authorizeSessionRole(req, session, upload.sender))) {
    return sendError(res, 403, "Device trust validation failed.");
  }

  const part = {
    partNumber,
    etag: String(req.body?.etag || "").replaceAll('"', ""),
    checksum: String(req.body?.checksum || ""),
    size: Number(req.body?.size || 0),
    status: "uploaded"
  };
  if (!part.etag) {
    return sendError(res, 400, "Part ETag is required.");
  }

  upload.parts.set(partNumber, part);
  upload.updatedAt = now();
  persist(metadataStore.upsert("uploadParts", durableUpload(upload)), "upload part metadata write failed");
  persist(metadataStore.addAudit({
    type: "upload.part_completed",
    sessionId: upload.sessionId,
    transferId: upload.transferId,
    uploadId: upload.id,
    partNumber
  }), "audit write failed");

  return res.json({ part, upload: publicUpload(upload) });
});

app.post("/api/uploads/:uploadId/complete", async (req, res) => {
  const upload = await resolveUpload(req.params.uploadId);
  const sessionId = String(req.body?.sessionId || "");

  if (!upload || upload.sessionId !== sessionId) {
    return sendError(res, 404, "Upload session not found.");
  }

  const session = await resolveSession(upload.sessionId);
  if (!(await authorizeSessionRole(req, session, upload.sender))) {
    return sendError(res, 403, "Device trust validation failed.");
  }

  const transfer = await resolveTransfer(upload.transferId);
  if (!transfer) {
    return sendError(res, 404, "Transfer not found.");
  }

  const clientParts = Array.isArray(req.body?.parts) ? req.body.parts : [];
  for (const clientPart of clientParts) {
    if (Number.isInteger(clientPart.partNumber) && clientPart.etag) {
      upload.parts.set(clientPart.partNumber, {
        partNumber: clientPart.partNumber,
        etag: clientPart.etag,
        checksum: clientPart.checksum || clientPart.etag,
        size: clientPart.size || 0
      });
    }
  }

  if (upload.parts.size !== upload.totalParts) {
    return sendError(res, 409, "Upload is missing one or more parts.", {
      expectedParts: upload.totalParts,
      uploadedParts: upload.parts.size
    });
  }

  const completion = await storage.completeMultipartUpload({
    uploadId: upload.id,
    providerUploadId: upload.providerUploadId,
    storageKey: upload.storageKey,
    parts: [...upload.parts.values()]
  });

  transfer.status = TRANSFER_STATES.UPLOADED;
  transfer.filePath = completion.filePath || transfer.filePath;
  transfer.storageKey = completion.storageKey || transfer.storageKey;
  transfer.uploadedAt = now();
  upload.status = TRANSFER_STATES.UPLOADED;
  upload.updatedAt = now();
  persist(metadataStore.upsert("transfers", publicTransfer(transfer)), "transfer metadata write failed");

  transfer.status = TRANSFER_STATES.SCANNING;
  persist(metadataStore.upsert("transfers", publicTransfer(transfer)), "transfer metadata write failed");

  try {
    const scan = await runMalwareScanHook({ transfer, config });
    transfer.scanStatus = scan.status;
    if (scan.status === TRANSFER_STATES.QUARANTINED || scan.status === "quarantined") {
      transfer.status = TRANSFER_STATES.QUARANTINED;
      transfer.failureReason = scan.reason || "malware_scan_quarantined";
      emitToTransferPeers(transfer, "transfer:failed");
      persist(metadataStore.upsert("transfers", publicTransfer(transfer)), "transfer metadata write failed");
      return sendError(res, 423, "File is quarantined by malware scan.", { detail: transfer.failureReason });
    }
    if (scan.status === TRANSFER_STATES.FAILED_SCAN || scan.status === "failed_scan") {
      transfer.status = TRANSFER_STATES.FAILED_SCAN;
      transfer.failureReason = scan.reason || "malware_scan_failed";
      emitToTransferPeers(transfer, "transfer:failed");
      persist(metadataStore.upsert("transfers", publicTransfer(transfer)), "transfer metadata write failed");
      return sendError(res, 502, "Malware scan failed.", { detail: transfer.failureReason });
    }
    transfer.status = TRANSFER_STATES.PENDING_ACCEPT;
  } catch (error) {
    transfer.status = TRANSFER_STATES.FAILED_SCAN;
    transfer.failureReason = `malware_scan_hook_failed: ${error.message}`;
    emitToTransferPeers(transfer, "transfer:failed");
    return sendError(res, 502, "Malware scan hook failed.", { detail: error.message });
  }

  persist(metadataStore.upsert("transfers", publicTransfer(transfer)), "transfer metadata write failed");
  persist(metadataStore.upsert("uploadParts", durableUpload(upload)), "upload session metadata write failed");
  persist(metadataStore.addAudit({
    type: "upload.completed",
    sessionId: upload.sessionId,
    transferId: upload.transferId,
    uploadId: upload.id,
    storageDriver: storage.kind
  }), "audit write failed");

  const payload = {
    transfer: {
      ...publicTransfer(transfer),
      downloadUrl: transferDownloadUrl(req, transfer)
    }
  };

  io.to(upload.sessionId).emit("transfer:pending", payload);
  io.to(upload.sessionId).emit("transfer:offer", payload);

  return res.json({ transfer: publicTransfer(transfer), upload: publicUpload(upload) });
});

app.post("/api/uploads/:uploadId/cancel", async (req, res) => {
  const upload = await resolveUpload(req.params.uploadId);
  const sessionId = String(req.body?.sessionId || "");

  if (!upload || upload.sessionId !== sessionId) {
    return sendError(res, 404, "Upload session not found.");
  }

  const session = await resolveSession(upload.sessionId);
  if (!(await authorizeSessionRole(req, session, upload.sender))) {
    return sendError(res, 403, "Device trust validation failed.");
  }

  const transfer = await resolveTransfer(upload.transferId);
  await storage.abortMultipartUpload({
    uploadId: upload.id,
    providerUploadId: upload.providerUploadId,
    storageKey: upload.storageKey
  });

  upload.status = TRANSFER_STATES.CANCELLED;
  if (transfer) {
    transfer.status = TRANSFER_STATES.CANCELLED;
    transfer.failureReason = "sender_cancelled";
    emitToTransferPeers(transfer, "transfer:failed");
    persist(metadataStore.upsert("transfers", publicTransfer(transfer)), "transfer metadata write failed");
  }

  persist(metadataStore.addAudit({
    type: "upload.cancelled",
    sessionId: upload.sessionId,
    transferId: upload.transferId,
    uploadId: upload.id
  }), "audit write failed");

  return res.json({ upload: publicUpload(upload), transfer: transfer ? publicTransfer(transfer) : null });
});

app.get("/api/transfers/:transferId/download-url", async (req, res) => {
  const transfer = await resolveTransfer(req.params.transferId);
  const sessionId = String(req.query.sessionId || "");

  if (!transfer || transfer.sessionId !== sessionId) {
    return sendError(res, 404, "Transfer not found.");
  }

  const session = await resolveSession(transfer.sessionId);
  if (!(await authorizeSessionRole(req, session, transfer.to))) {
    return sendError(res, 403, "Device trust validation failed.");
  }

  if (!isTransferDownloadable(transfer)) {
    return sendError(res, 409, "The receiver must accept the transfer before download.");
  }

  const mobileFacing = transfer.to === "mobile";
  let target = isRelayTransfer(transfer)
    ? {
        directFromStorage: false,
        url: transferDownloadUrl(req, transfer, { mobileFacing }),
        expiresInSeconds: null
      }
    : await storage.getDownloadTarget({
        baseUrl: mobileFacing ? mobileServerBaseUrl(req) : requestBaseUrl(req),
        transfer
      });

  if (mobileFacing && target.directFromStorage && isMobileFacingUrlBlocked(target.url)) {
    target = {
      directFromStorage: false,
      url: transferDownloadUrl(req, transfer, { mobileFacing: true }),
      expiresInSeconds: null
    };
  }

  return res.json({ target });
});

app.get("/api/transfers/:transferId/download", async (req, res) => {
  const transfer = await resolveTransfer(req.params.transferId);
  const sessionId = String(req.query.sessionId || "");

  if (!transfer || transfer.sessionId !== sessionId) {
    return sendError(res, 404, "파일을 찾을 수 없습니다.");
  }

  if (!isTransferDownloadable(transfer)) {
    return sendError(res, 409, "받는 쪽에서 파일을 수락한 뒤 다운로드할 수 있습니다.");
  }

  const downloadSession = await resolveSession(transfer.sessionId);
  if (!(await authorizeSessionRole(req, downloadSession, transfer.to))) {
    return sendError(res, 403, "Device trust validation failed.");
  }

  if (storage.kind === "s3" && !isRelayTransfer(transfer)) {
    const target = await storage.getDownloadTarget({
      baseUrl: requestBaseUrl(req),
      transfer
    });
    if (transfer.to !== "mobile" && !isMobileFacingUrlBlocked(target.url)) {
      return res.redirect(302, target.url);
    }

    setDownloadHeaders(res, transfer);
    const stream = await storage.createReadStream({ transfer, storageKey: transfer.storageKey });
    pipeDownloadStream(stream, res);
    return;
  }

  if (transfer.fileDeleted || !fs.existsSync(transfer.filePath)) {
    return sendError(res, 410, "파일 보관 시간이 지났거나 이미 정리되었습니다.");
  }

  setDownloadHeaders(res, transfer);
  pipeDownloadStream(fs.createReadStream(transfer.filePath), res);
});

app.use((err, _req, res, _next) => {
  logger.error("unhandled request error", { error: err });
  res.status(500).json({ error: "서버 오류가 발생했습니다." });
});

io.on("connection", (socket) => {
  socket.on("session:join", async (payload, ack) => {
    const sessionId = String(payload?.sessionId || "");
    const role = String(payload?.role || "");
    const joinSource = String(payload?.joinSource || payload?.join_source || "unknown").slice(0, 24) || "unknown";
    const session = await resolveSession(sessionId);

    if (!session || !isValidRole(role)) {
      logger.warn("socket session join failed", { sessionId, role, joinSource, reason: "invalid_session_or_role", socketId: socket.id });
      ack?.({ ok: false, error: "세션을 찾을 수 없습니다." });
      return;
    }

    if (config.requireDeviceTrust) {
      const deviceToken = String(payload?.deviceTrustToken || "");
      const deviceId = String(payload?.deviceId || session[`${role}DeviceId`] || "");
      const device = await getMetadata("devices", deviceId);
      if (!deviceToken || !device || device.revokedAt || device.trustTokenHash !== hashDeviceTrustToken(config, deviceToken)) {
        logger.warn("socket session join failed", { sessionId: session.id, code: session.code, role, joinSource, reason: "device_trust_failed", socketId: socket.id });
        ack?.({ ok: false, error: "Device trust validation failed." });
        return;
      }
    }

    const socketKey = `${role}SocketId`;
    const previousSocketId = session[socketKey];

    if (previousSocketId && previousSocketId !== socket.id) {
      io.to(previousSocketId).emit("session:replaced", {
        message: "같은 역할의 새 연결이 들어와 이전 연결을 비활성화했습니다."
      });
    }

    socket.join(session.id);
    socket.data.sessionId = session.id;
    socket.data.role = role;
    session[socketKey] = socket.id;
    persist(cache.set(`session:${session.id}`, serializeSession(session), Math.ceil(config.sessionTtlMs / 1000)), "session cache write failed");

    const publicState = publicSession(session);
    logger.info("socket session joined", {
      sessionId: session.id,
      code: session.code,
      role,
      joinSource,
      paired: publicState.paired,
      pcConnected: publicState.pcConnected,
      mobileConnected: publicState.mobileConnected,
      socketId: socket.id
    });
    ack?.({ ok: true, session: publicState });
    emitSessionState(session);
  });

  socket.on("transfer:respond", async (payload, ack) => {
    const transferId = String(payload?.transferId || "");
    const sessionId = String(payload?.sessionId || "");
    const decision = String(payload?.decision || "");
    const transfer = await resolveTransfer(transferId);

    if (!transfer || transfer.sessionId !== sessionId) {
      ack?.({ ok: false, error: "전송 요청을 찾을 수 없습니다." });
      return;
    }

    if (transfer.to !== socket.data.role) {
      ack?.({ ok: false, error: "받는 쪽만 수락 또는 거절할 수 있습니다." });
      return;
    }

    if (![TRANSFER_STATES.PENDING_ACCEPT, "pending"].includes(transfer.status)) {
      ack?.({ ok: false, error: "이미 처리된 전송 요청입니다." });
      return;
    }

    if (decision === "reject") {
      transfer.status = TRANSFER_STATES.REJECTED;
      transfer.failureReason = "receiver_rejected";
      emitToTransferPeers(transfer, "transfer:rejected");
      void deleteTransferFile(transfer);
      persist(metadataStore.upsert("transfers", publicTransfer(transfer)), "transfer metadata write failed");
      persist(metadataStore.addAudit({ type: "transfer.rejected", sessionId, transferId, actor: socket.data.role }), "audit write failed");
      ack?.({ ok: true, transfer: publicTransfer(transfer) });
      return;
    }

    if (decision !== "accept") {
      ack?.({ ok: false, error: "수락 또는 거절만 선택할 수 있습니다." });
      return;
    }

    transfer.status = TRANSFER_STATES.ACCEPTED;
    transfer.acceptedAt = now();
    emitToTransferPeers(transfer, "transfer:accepted");
    persist(metadataStore.upsert("transfers", publicTransfer(transfer)), "transfer metadata write failed");
    persist(metadataStore.addAudit({ type: "transfer.accepted", sessionId, transferId, actor: socket.data.role }), "audit write failed");
    ack?.({ ok: true, transfer: publicTransfer(transfer) });
  });

  socket.on("transfer:download_started", async (payload, ack) => {
    const transferId = String(payload?.transferId || "");
    const sessionId = String(payload?.sessionId || "");
    const transfer = await resolveTransfer(transferId);

    if (!transfer || transfer.sessionId !== sessionId) {
      ack?.({ ok: false, error: "전송 정보를 찾을 수 없습니다." });
      return;
    }

    if (transfer.to !== socket.data.role) {
      ack?.({ ok: false, error: "받는 쪽에서만 다운로드를 시작할 수 있습니다." });
      return;
    }

    if (!isTransferDownloadable(transfer)) {
      ack?.({ ok: false, error: "먼저 수락이 필요합니다." });
      return;
    }

    transfer.status = TRANSFER_STATES.DOWNLOAD_STARTED;
    transfer.downloadStartedAt = now();
    emitToTransferPeers(transfer, "transfer:download_started");
    persist(metadataStore.upsert("transfers", publicTransfer(transfer)), "transfer metadata write failed");
    persist(metadataStore.addAudit({ type: "transfer.download_started", sessionId, transferId, actor: socket.data.role }), "audit write failed");
    ack?.({ ok: true, transfer: publicTransfer(transfer) });
  });

  socket.on("transfer:complete", async (payload, ack) => {
    const transferId = String(payload?.transferId || "");
    const sessionId = String(payload?.sessionId || "");
    const transfer = await resolveTransfer(transferId);

    if (!transfer || transfer.sessionId !== sessionId) {
      ack?.({ ok: false, error: "전송 정보를 찾을 수 없습니다." });
      return;
    }

    if (transfer.to !== socket.data.role) {
      ack?.({ ok: false, error: "받는 쪽에서만 완료 처리할 수 있습니다." });
      return;
    }

    if (!isTransferDownloadable(transfer)) {
      ack?.({ ok: false, error: "먼저 수락이 필요합니다." });
      return;
    }

    transfer.status = TRANSFER_STATES.COMPLETED;
    transfer.completedAt = now();
    emitToTransferPeers(transfer, "transfer:completed");
    void deleteTransferFile(transfer);
    persist(metadataStore.upsert("transfers", publicTransfer(transfer)), "transfer metadata write failed");
    persist(metadataStore.addAudit({ type: "transfer.completed", sessionId, transferId, actor: socket.data.role }), "audit write failed");
    ack?.({ ok: true, transfer: publicTransfer(transfer) });
  });

  socket.on("transfer:failed", async (payload, ack) => {
    const transferId = String(payload?.transferId || "");
    const sessionId = String(payload?.sessionId || "");
    const reason = String(payload?.reason || "client_failed");
    const transfer = await resolveTransfer(transferId);

    if (!transfer || transfer.sessionId !== sessionId) {
      ack?.({ ok: false, error: "전송 정보를 찾을 수 없습니다." });
      return;
    }

    transfer.status = TRANSFER_STATES.FAILED;
    transfer.failureReason = reason;
    emitToTransferPeers(transfer, "transfer:failed");
    void deleteTransferFile(transfer);
    persist(metadataStore.upsert("transfers", publicTransfer(transfer)), "transfer metadata write failed");
    persist(metadataStore.addAudit({ type: "transfer.failed", sessionId, transferId, actor: socket.data.role, reason }), "audit write failed");
    ack?.({ ok: true, transfer: publicTransfer(transfer) });
  });

  socket.on("disconnect", () => {
    const { sessionId, role } = socket.data;
    const session = sessions.get(sessionId);

    if (!session || !isValidRole(role)) {
      return;
    }

    const socketKey = `${role}SocketId`;
    if (session[socketKey] === socket.id) {
      session[socketKey] = null;
      persist(cache.set(`session:${session.id}`, serializeSession(session), Math.ceil(config.sessionTtlMs / 1000)), "session cache write failed");
      emitSessionState(session);
    }
  });
});

const cleanupTimer = setInterval(cleanupExpired, config.cleanupIntervalMs);
cleanupTimer.unref?.();

server.listen(config.port, "0.0.0.0", () => {
  logger.info("server started", {
    url: `http://localhost:${config.port}`,
    mode: config.appMode,
    storageDriver: storage.kind,
    databaseDriver: metadataStore.driver,
    cacheDriver: cache.driver,
    realtimeDriver: realtime.driver,
    maxFileSize: formatBytes(config.maxFileSizeBytes)
  });
  const urls = localNetworkUrls();
  if (urls.length > 0) {
    logger.info("lan urls detected", { urls });
  }
});
