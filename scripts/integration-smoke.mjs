import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import fsp from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

import { io } from "socket.io-client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const port = 4100 + Math.floor(Math.random() * 1000);
const baseUrl = `http://127.0.0.1:${port}`;
const uploadDir = path.join(repoRoot, ".tmp", "integration-uploads");
const metadataFile = path.join(repoRoot, ".tmp", "integration-metadata.json");
const useConfiguredDrivers = process.env.INTEGRATION_USE_CONFIG_DRIVERS === "true";

const server = spawn(process.execPath, ["apps/server/src/index.js"], {
  cwd: repoRoot,
  env: {
    ...process.env,
    SERVER_PORT: String(port),
    ...(useConfiguredDrivers ? {} : {
      DATABASE_DRIVER: "json",
      CACHE_DRIVER: "memory",
      SOCKET_IO_ADAPTER: "memory",
      STORAGE_DRIVER: "local",
      METADATA_FILE: ".tmp/integration-metadata.json"
    }),
    SESSION_TTL_MS: "600000",
    TRANSFER_TTL_MS: "600000",
    ...(useConfiguredDrivers ? {} : {
      UPLOAD_CHUNK_SIZE_MB: "1",
      UPLOAD_DIR: ".tmp/integration-uploads"
    }),
    REQUIRE_DEVICE_TRUST: "true",
    DEVICE_TRUST_SECRET: "integration-device-trust-secret"
  },
  stdio: ["ignore", "pipe", "pipe"]
});

let serverOutput = "";
server.stdout.on("data", (chunk) => {
  serverOutput += chunk.toString();
});
server.stderr.on("data", (chunk) => {
  serverOutput += chunk.toString();
});

let pcSocket;
let mobileSocket;

try {
  await waitForHealth();

  const sessionResponse = await fetch(`${baseUrl}/api/sessions`, { method: "POST" });
  const sessionPayload = await sessionResponse.json();
  assert.equal(sessionResponse.status, 201);
  assert.match(sessionPayload.session.code, /^\d{6}$/);

  const joinByCodeResponse = await fetch(`${baseUrl}/api/sessions/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ code: sessionPayload.session.code, joinSource: "manual" })
  });
  const joinByCodePayload = await joinByCodeResponse.json();
  assert.equal(joinByCodeResponse.status, 200);
  assert.equal(joinByCodePayload.session.id, sessionPayload.session.id);

  const pcAuth = sessionPayload.auth;
  const mobileAuth = joinByCodePayload.auth;
  await assertDeviceTrustEnforced(sessionPayload.session.id);
  pcSocket = await joinSocket("pc", sessionPayload.session.id, pcAuth, "manual");
  const pcPairedStatePromise = waitForSessionState(pcSocket, (session) => session?.paired);
  mobileSocket = await joinSocket("mobile", sessionPayload.session.id, mobileAuth, "manual");
  pcSocket.__lastSessionState = await pcPairedStatePromise;
  assert.equal(pcSocket.__joinReply.session.pcConnected, true);
  assert.equal(pcSocket.__joinReply.session.mobileConnected, false);
  assert.equal(mobileSocket.__joinReply.session.pcConnected, true);
  assert.equal(mobileSocket.__joinReply.session.mobileConnected, true);
  assert.equal(mobileSocket.__joinReply.session.paired, true);
  assert.equal(pcSocket.__lastSessionState.paired, true);
  await assertProtectedUploadRequiresTrust(sessionPayload.session.id);

  await sendAndReceive({
    sessionId: sessionPayload.session.id,
    senderSocket: pcSocket,
    receiverSocket: mobileSocket,
    senderRole: "pc",
    senderAuth: pcAuth,
    receiverAuth: mobileAuth,
    text: "hello from pc",
    fileName: "pc-to-mobile.txt"
  });

  await sendAndReceive({
    sessionId: sessionPayload.session.id,
    senderSocket: mobileSocket,
    receiverSocket: pcSocket,
    senderRole: "mobile",
    senderAuth: mobileAuth,
    receiverAuth: pcAuth,
    text: "hello from mobile",
    fileName: "mobile-to-pc.txt"
  });

  await sendMultipleRelayWithIndependentDecisions({
    sessionId: sessionPayload.session.id,
    senderSocket: mobileSocket,
    receiverSocket: pcSocket,
    senderRole: "mobile",
    senderAuth: mobileAuth,
    receiverAuth: pcAuth
  });

  await sendAndReceiveResumable({
    sessionId: sessionPayload.session.id,
    senderSocket: pcSocket,
    receiverSocket: mobileSocket,
    senderRole: "pc",
    senderAuth: pcAuth,
    receiverAuth: mobileAuth,
    text: "resumable pc ".repeat(500000),
    fileName: "pc-to-mobile-resumable.txt"
  });

  await sendAndReceiveResumable({
    sessionId: sessionPayload.session.id,
    senderSocket: mobileSocket,
    receiverSocket: pcSocket,
    senderRole: "mobile",
    senderAuth: mobileAuth,
    receiverAuth: pcAuth,
    text: "resumable mobile ".repeat(500000),
    fileName: "mobile-to-pc-resumable.txt"
  });

  console.log("integration smoke ok: pairing ack, device trust, relay transfer, multi-file relay isolation, resumable pc-to-mobile, resumable mobile-to-pc");
} catch (error) {
  if (serverOutput) {
    console.error("integration server output\n", serverOutput);
  }
  throw error;
} finally {
  pcSocket?.disconnect();
  mobileSocket?.disconnect();
  server.kill();
  await delay(200);
  if (!useConfiguredDrivers) {
    await fsp.rm(uploadDir, { recursive: true, force: true });
    await fsp.rm(metadataFile, { force: true });
    await fsp.rmdir(path.dirname(uploadDir)).catch(() => {});
  }
}

async function waitForHealth() {
  for (let attempt = 0; attempt < 160; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`server exited early\n${serverOutput}`);
    }

    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // Keep waiting while the server starts.
    }

    await delay(250);
  }

  throw new Error(`server did not become healthy\n${serverOutput}`);
}

function joinSocket(role, sessionId, auth, joinSource = "manual") {
  return new Promise((resolve, reject) => {
    const socket = io(baseUrl, {
      transports: ["websocket", "polling"],
      timeout: 5000
    });

    socket.once("connect_error", reject);
    socket.once("connect", () => {
      socket.emit("session:join", { sessionId, role, joinSource, ...deviceAuthPayload(auth) }, (reply) => {
        if (!reply?.ok) {
          reject(new Error(reply?.error || `failed to join as ${role}`));
          return;
        }
        socket.__joinReply = reply;
        resolve(socket);
      });
    });
  });
}

function waitForSessionState(socket, predicate) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off("session:state", onState);
      reject(new Error("timed out waiting for session state"));
    }, 5000);

    function onState({ session }) {
      socket.__lastSessionState = session;
      if (!predicate || predicate(session)) {
        clearTimeout(timer);
        socket.off("session:state", onState);
        resolve(session);
      }
    }

    socket.on("session:state", onState);
  });
}

function assertDeviceTrustEnforced(sessionId) {
  return new Promise((resolve, reject) => {
    const socket = io(baseUrl, {
      transports: ["websocket", "polling"],
      timeout: 5000
    });

    const timer = setTimeout(() => {
      socket.disconnect();
      reject(new Error("timed out waiting for device trust rejection"));
    }, 5000);

    socket.once("connect_error", (error) => {
      clearTimeout(timer);
      socket.disconnect();
      reject(error);
    });

    socket.once("connect", () => {
      socket.emit("session:join", { sessionId, role: "pc" }, (reply) => {
        clearTimeout(timer);
        socket.disconnect();
        try {
          assert.equal(reply?.ok, false);
          assert.equal(reply?.error, "Device trust validation failed.");
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  });
}

async function assertProtectedUploadRequiresTrust(sessionId) {
  const response = await fetch(`${baseUrl}/api/uploads/initiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      sender: "pc",
      fileName: "trust-check.txt",
      mimeType: "text/plain",
      size: 5
    })
  });
  const payload = await response.json();
  assert.equal(response.status, 403);
  assert.equal(payload.error, "Device trust validation failed.");
}

async function sendAndReceive({ sessionId, senderSocket, receiverSocket, senderRole, senderAuth, receiverAuth, text, fileName }) {
  const offerPromise = waitForTransferOffer(receiverSocket, senderRole);
  const form = new FormData();
  form.append("sessionId", sessionId);
  form.append("sender", senderRole);
  form.append("file", new Blob([text], { type: "text/plain" }), fileName);

  const uploadResponse = await fetch(`${baseUrl}/api/transfers`, {
    method: "POST",
    headers: deviceAuthHeaders(senderAuth),
    body: form
  });
  const uploadPayload = await uploadResponse.json();
  assert.equal(uploadResponse.status, 201);

  const offeredTransfer = await offerPromise;
  assert.equal(offeredTransfer.id, uploadPayload.transfer.id);
  assert.equal(offeredTransfer.from, senderRole);
  assert.equal(offeredTransfer.status, "pending_accept");

  const acceptReply = await emitAck(receiverSocket, "transfer:respond", {
    sessionId,
    transferId: offeredTransfer.id,
    decision: "accept"
  });
  assert.equal(acceptReply.transfer.status, "accepted");

  const downloadResponse = await fetch(`${baseUrl}/api/transfers/${offeredTransfer.id}/download?sessionId=${encodeURIComponent(sessionId)}`, {
    headers: deviceAuthHeaders(receiverAuth)
  });
  assert.equal(downloadResponse.status, 200);
  assert.equal(await downloadResponse.text(), text);

  const completeReply = await emitAck(receiverSocket, "transfer:complete", {
    sessionId,
    transferId: offeredTransfer.id
  });
  assert.equal(completeReply.transfer.status, "completed");

  assert.equal(senderSocket.connected, true);
}

async function sendMultipleRelayWithIndependentDecisions({ sessionId, senderSocket, receiverSocket, senderRole, senderAuth, receiverAuth }) {
  const files = [
    { text: "multi first accepted", fileName: "multi-first.txt" },
    { text: "multi second rejected", fileName: "multi-second.txt" }
  ];
  const offersPromise = waitForTransferOffers(receiverSocket, senderRole, files.length);

  for (const file of files) {
    const form = new FormData();
    form.append("sessionId", sessionId);
    form.append("sender", senderRole);
    form.append("file", new Blob([file.text], { type: "text/plain" }), file.fileName);

    const uploadResponse = await fetch(`${baseUrl}/api/transfers`, {
      method: "POST",
      headers: deviceAuthHeaders(senderAuth),
      body: form
    });
    const uploadPayload = await uploadResponse.json();
    assert.equal(uploadResponse.status, 201);
    assert.equal(uploadPayload.transfer.fileName, file.fileName);
    assert.equal(uploadPayload.transfer.status, "pending_accept");
  }

  const offeredTransfers = await offersPromise;
  const acceptedTransfer = offeredTransfers.find((transfer) => transfer.fileName === files[0].fileName);
  const rejectedTransfer = offeredTransfers.find((transfer) => transfer.fileName === files[1].fileName);
  assert.ok(acceptedTransfer, "expected first multi-file offer");
  assert.ok(rejectedTransfer, "expected second multi-file offer");

  const rejectReply = await emitAck(receiverSocket, "transfer:respond", {
    sessionId,
    transferId: rejectedTransfer.id,
    decision: "reject"
  });
  assert.equal(rejectReply.transfer.status, "rejected");

  const acceptReply = await emitAck(receiverSocket, "transfer:respond", {
    sessionId,
    transferId: acceptedTransfer.id,
    decision: "accept"
  });
  assert.equal(acceptReply.transfer.status, "accepted");

  const downloadResponse = await fetch(`${baseUrl}/api/transfers/${acceptedTransfer.id}/download?sessionId=${encodeURIComponent(sessionId)}`, {
    headers: deviceAuthHeaders(receiverAuth)
  });
  assert.equal(downloadResponse.status, 200);
  assert.equal(await downloadResponse.text(), files[0].text);

  const completeReply = await emitAck(receiverSocket, "transfer:complete", {
    sessionId,
    transferId: acceptedTransfer.id
  });
  assert.equal(completeReply.transfer.status, "completed");
  assert.equal(senderSocket.connected, true);
}

async function sendAndReceiveResumable({ sessionId, senderSocket, receiverSocket, senderRole, senderAuth, receiverAuth, text, fileName }) {
  const offerPromise = waitForTransferOffer(receiverSocket, senderRole);
  const bytes = new TextEncoder().encode(text);

  const initiateResponse = await fetch(`${baseUrl}/api/uploads/initiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...deviceAuthHeaders(senderAuth) },
    body: JSON.stringify({
      sessionId,
      sender: senderRole,
      fileName,
      mimeType: "text/plain",
      size: bytes.byteLength
    })
  });
  const initiatePayload = await initiateResponse.json();
  assert.equal(initiateResponse.status, 201);
  assert.equal(initiatePayload.transfer.status, "uploading");

  const upload = initiatePayload.upload;
  const parts = [];
  for (let offset = 0, partNumber = 1; offset < bytes.byteLength; offset += upload.partSize, partNumber += 1) {
    const chunk = bytes.slice(offset, Math.min(offset + upload.partSize, bytes.byteLength));
    const checksum = crypto.createHash("sha256").update(chunk).digest("hex");
    const targetResponse = await fetch(`${baseUrl}/api/uploads/${upload.id}/parts/${partNumber}/url`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...deviceAuthHeaders(senderAuth) },
      body: JSON.stringify({ sessionId })
    });
    const targetPayload = await targetResponse.json();
    assert.equal(targetResponse.status, 200);

    const partResponse = await fetch(targetPayload.target.url, {
      method: targetPayload.target.method,
      headers: {
        ...targetPayload.target.headers,
        ...(targetPayload.target.directToStorage ? {} : deviceAuthHeaders(senderAuth)),
        "Content-Type": "application/octet-stream",
        "x-checksum-sha256": checksum
      },
      body: chunk
    });
    assert.equal(partResponse.status, 200);
    if (targetPayload.target.directToStorage) {
      const etag = partResponse.headers.get("etag")?.replaceAll('"', "") || checksum;
      const part = { partNumber, etag, checksum, size: chunk.byteLength };
      const completePartResponse = await fetch(`${baseUrl}/api/uploads/${upload.id}/parts/${partNumber}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...deviceAuthHeaders(senderAuth) },
        body: JSON.stringify({ sessionId, ...part })
      });
      assert.equal(completePartResponse.status, 200);
      parts.push(part);
    } else {
      const partPayload = await partResponse.json();
      assert.equal(partPayload.part.checksum, checksum);
      parts.push(partPayload.part);
    }
  }

  const completeResponse = await fetch(`${baseUrl}/api/uploads/${upload.id}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...deviceAuthHeaders(senderAuth) },
    body: JSON.stringify({ sessionId, parts })
  });
  const completePayload = await completeResponse.json();
  if (completeResponse.status !== 200) {
    console.error("upload complete failed", completeResponse.status, completePayload);
  }
  assert.equal(completeResponse.status, 200);
  assert.equal(completePayload.transfer.status, "pending_accept");

  const offeredTransfer = await offerPromise;
  assert.equal(offeredTransfer.id, initiatePayload.transfer.id);
  assert.equal(offeredTransfer.status, "pending_accept");

  const acceptReply = await emitAck(receiverSocket, "transfer:respond", {
    sessionId,
    transferId: offeredTransfer.id,
    decision: "accept"
  });
  assert.equal(acceptReply.transfer.status, "accepted");

  const downloadUrlResponse = await fetch(`${baseUrl}/api/transfers/${offeredTransfer.id}/download-url?sessionId=${encodeURIComponent(sessionId)}`, {
    headers: deviceAuthHeaders(receiverAuth)
  });
  const downloadUrlPayload = await downloadUrlResponse.json();
  assert.equal(downloadUrlResponse.status, 200);
  assert.equal(typeof downloadUrlPayload.target.url, "string");

  const downloadResponse = await fetch(downloadUrlPayload.target.url, {
    headers: downloadUrlPayload.target.directFromStorage ? {} : deviceAuthHeaders(receiverAuth)
  });
  assert.equal(downloadResponse.status, 200);
  assert.equal(await downloadResponse.text(), text);

  const completeReply = await emitAck(receiverSocket, "transfer:complete", {
    sessionId,
    transferId: offeredTransfer.id
  });
  assert.equal(completeReply.transfer.status, "completed");
  assert.equal(senderSocket.connected, true);
}

function waitForTransferOffer(socket, expectedSenderRole) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off("transfer:offer", onOffer);
      reject(new Error(`timed out waiting for transfer offer from ${expectedSenderRole}`));
    }, 5000);

    function onOffer({ transfer }) {
      if (transfer?.from !== expectedSenderRole) {
        return;
      }
      clearTimeout(timer);
      socket.off("transfer:offer", onOffer);
      resolve(transfer);
    }

    socket.on("transfer:offer", onOffer);
  });
}

function waitForTransferOffers(socket, expectedSenderRole, expectedCount) {
  return new Promise((resolve, reject) => {
    const transfers = [];
    const seenIds = new Set();
    const timer = setTimeout(() => {
      socket.off("transfer:offer", onOffer);
      reject(new Error(`timed out waiting for ${expectedCount} transfer offers from ${expectedSenderRole}`));
    }, 5000);

    function onOffer({ transfer }) {
      if (transfer?.from !== expectedSenderRole || !transfer.id || seenIds.has(transfer.id)) {
        return;
      }
      seenIds.add(transfer.id);
      transfers.push(transfer);
      if (transfers.length >= expectedCount) {
        clearTimeout(timer);
        socket.off("transfer:offer", onOffer);
        resolve(transfers);
      }
    }

    socket.on("transfer:offer", onOffer);
  });
}

function emitAck(socket, eventName, payload) {
  return new Promise((resolve, reject) => {
    socket.timeout(5000).emit(eventName, payload, (error, reply) => {
      if (error) {
        reject(error);
        return;
      }
      if (!reply?.ok) {
        reject(new Error(reply?.error || `${eventName} failed`));
        return;
      }
      resolve(reply);
    });
  });
}

function deviceAuthPayload(auth) {
  if (!auth?.deviceId || !auth?.deviceTrustToken) {
    return {};
  }
  return {
    deviceId: auth.deviceId,
    deviceTrustToken: auth.deviceTrustToken
  };
}

function deviceAuthHeaders(auth) {
  if (!auth?.deviceId || !auth?.deviceTrustToken) {
    return {};
  }
  return {
    "x-vibe-device-id": auth.deviceId,
    "x-vibe-device-token": auth.deviceTrustToken
  };
}
