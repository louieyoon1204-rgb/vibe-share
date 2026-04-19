export function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function createPairingCode(existingCodes = new Set()) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    if (!existingCodes.has(code)) {
      return code;
    }
  }

  throw new Error("사용 가능한 페어링 코드를 만들 수 없습니다.");
}

export function isValidRole(role) {
  return role === "pc" || role === "mobile";
}

export function otherRole(role) {
  if (role === "pc") {
    return "mobile";
  }
  if (role === "mobile") {
    return "pc";
  }
  return null;
}

export function publicSession(session) {
  return {
    id: session.id,
    code: session.code,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    paired: Boolean(session.pcSocketId && session.mobileSocketId),
    pcConnected: Boolean(session.pcSocketId),
    mobileConnected: Boolean(session.mobileSocketId)
  };
}

export function publicTransfer(transfer) {
  return {
    id: transfer.id,
    sessionId: transfer.sessionId,
    from: transfer.from,
    to: transfer.to,
    fileName: transfer.fileName,
    mimeType: transfer.mimeType,
    size: transfer.size,
    storageKey: transfer.storageKey || null,
    storageDriver: transfer.storageDriver || "local-relay",
    status: transfer.status,
    createdAt: transfer.createdAt,
    uploadedAt: transfer.uploadedAt || null,
    acceptedAt: transfer.acceptedAt || null,
    downloadStartedAt: transfer.downloadStartedAt || null,
    completedAt: transfer.completedAt || null,
    expiresAt: transfer.expiresAt,
    scanStatus: transfer.scanStatus || null,
    failureReason: transfer.failureReason || null
  };
}

export function contentDispositionAttachment(fileName) {
  const fallback = String(fileName || "vibe-share-file")
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/["\\]/g, "_")
    .slice(0, 120) || "vibe-share-file";

  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(fileName || "vibe-share-file")}`;
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
