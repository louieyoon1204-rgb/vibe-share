import crypto from "node:crypto";

export function createAnonymousPrincipal() {
  return {
    id: crypto.randomUUID(),
    type: "anonymous",
    anonymous: true
  };
}

export function createAuthToken(config, user) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + config.authTokenTtlSeconds;
  const payload = {
    iss: config.auth.jwtIssuer || "vibe-share-local",
    aud: config.auth.jwtAudience || "vibe-share",
    sub: user.id,
    email: user.email || null,
    name: user.displayName || null,
    anonymous: Boolean(user.anonymous),
    iat: issuedAt,
    exp: expiresAt
  };

  return signJwt(config, payload);
}

export function verifyAuthToken(config, token) {
  if (!token) {
    return null;
  }

  const parts = String(token).split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const expected = hmacBase64Url(config, `${encodedHeader}.${encodedPayload}`);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  if (payload.exp && payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }
  if (payload.aud && config.auth.jwtAudience && payload.aud !== config.auth.jwtAudience) {
    return null;
  }
  if (payload.iss && config.auth.jwtIssuer && payload.iss !== config.auth.jwtIssuer) {
    return null;
  }
  return payload;
}

export function createDeviceTrust({ config, sessionId, role }) {
  const token = crypto.randomBytes(32).toString("base64url");
  const deviceId = crypto.randomUUID();
  const trustedUntil = Date.now() + config.sessionTtlMs;
  return {
    device: {
      id: deviceId,
      sessionId,
      role,
      trustTokenHash: hashDeviceTrustToken(config, token),
      trustedUntil,
      createdAt: Date.now()
    },
    token
  };
}

export function hashDeviceTrustToken(config, token) {
  return crypto
    .createHmac("sha256", config.auth.deviceTrustSecret)
    .update(String(token || ""))
    .digest("hex");
}

export function hashPairingCode(config, code) {
  return crypto
    .createHmac("sha256", config.auth.deviceTrustSecret)
    .update(String(code || ""))
    .digest("hex");
}

export function readAuthContext(req) {
  const authorization = String(req.headers.authorization || "");
  if (authorization.startsWith("Bearer ")) {
    return {
      type: "bearer",
      token: authorization.slice("Bearer ".length)
    };
  }

  const deviceTrustToken = String(req.headers["x-vibe-device-token"] || "");
  if (deviceTrustToken) {
    return {
      type: "device_trust",
      token: deviceTrustToken
    };
  }

  return {
    type: "anonymous"
  };
}

export function readBearerToken(req) {
  const authorization = String(req.headers.authorization || "");
  return authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
}

export function assertTransferRoleAllowed({ session, sender }) {
  if (!session || !sender) {
    return false;
  }
  return sender === "pc" || sender === "mobile";
}

function signJwt(config, payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = hmacBase64Url(config, `${encodedHeader}.${encodedPayload}`);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function hmacBase64Url(config, value) {
  return crypto
    .createHmac("sha256", config.auth.jwtSecret || config.auth.deviceTrustSecret)
    .update(value)
    .digest("base64url");
}
