export function normalizeBaseUrl(value) {
  const raw = String(value || "").trim().replace(/\/+$/, "");
  if (!raw) {
    return "";
  }
  return hasProtocol(raw) ? raw : `http://${raw}`;
}

export function hasProtocol(value) {
  return /^[a-z][a-z\d+.-]*:\/\//i.test(String(value || ""));
}

export function isLoopbackHost(hostname) {
  const normalized = String(hostname || "")
    .trim()
    .toLowerCase()
    .replace(/^\[(.*)\]$/, "$1");

  return (
    normalized === "" ||
    normalized === "localhost" ||
    normalized === "0.0.0.0" ||
    normalized === "::1" ||
    normalized === "0000:0000:0000:0000:0000:0000:0000:0001" ||
    /^127(?:\.|$)/.test(normalized)
  );
}

export function isPrivateLanHost(hostname) {
  const normalized = String(hostname || "")
    .trim()
    .toLowerCase()
    .replace(/^\[(.*)\]$/, "$1");

  return (
    /^10(?:\.|$)/.test(normalized) ||
    /^192\.168(?:\.|$)/.test(normalized) ||
    /^172\.(1[6-9]|2\d|3[0-1])(?:\.|$)/.test(normalized) ||
    /^169\.254(?:\.|$)/.test(normalized)
  );
}

export function isMobileFacingUrlBlocked(value, { blockPrivate = false } = {}) {
  try {
    const raw = String(value || "").trim();
    if (!raw) {
      return true;
    }
    const url = new URL(hasProtocol(raw) ? raw : `http://${raw}`);
    return isLoopbackHost(url.hostname) || (blockPrivate && isPrivateLanHost(url.hostname));
  } catch {
    return true;
  }
}

export function containsLoopbackUrlValue(value) {
  if (value == null) {
    return true;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return true;
    }
    if (/localhost|127\.|0\.0\.0\.0|::1|\[::1\]/i.test(trimmed)) {
      return true;
    }
    if (/^[{[]/.test(trimmed)) {
      try {
        return containsLoopbackUrlValue(JSON.parse(trimmed));
      } catch {
        return false;
      }
    }
    if (!hasProtocol(trimmed) && !/^[\w.-]+(?::\d+)?(?:\/|$)/.test(trimmed)) {
      return false;
    }
    try {
      return isMobileFacingUrlBlocked(trimmed);
    } catch {
      return false;
    }
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsLoopbackUrlValue(item));
  }

  if (typeof value === "object") {
    return Object.values(value).some((item) => containsLoopbackUrlValue(item));
  }

  return false;
}

export function toUrlWithPort(value, port) {
  const normalized = normalizeBaseUrl(value);
  if (!normalized) {
    return "";
  }

  try {
    const url = new URL(normalized);
    if (port) {
      url.port = String(port);
    }
    url.username = "";
    url.password = "";
    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

export function apiUrlFromWebUrl(value, apiPort = 4000) {
  const normalized = normalizeBaseUrl(value);
  if (!normalized) {
    return "";
  }

  try {
    const url = new URL(normalized);
    const host = url.hostname;
    if (isLoopbackHost(host)) {
      return "";
    }

    const apiUrl = new URL(url.toString());
    if (url.port) {
      apiUrl.port = String(apiPort);
    } else if (host.startsWith("app-staging.")) {
      apiUrl.hostname = `api-staging.${host.slice("app-staging.".length)}`;
      apiUrl.port = "";
    } else if (host.startsWith("app.")) {
      apiUrl.hostname = `api.${host.slice("app.".length)}`;
      apiUrl.port = "";
    } else if (host.startsWith("staging.")) {
      apiUrl.hostname = `api-staging.${host.slice("staging.".length)}`;
      apiUrl.port = "";
    }
    apiUrl.username = "";
    apiUrl.password = "";
    apiUrl.pathname = "";
    apiUrl.search = "";
    apiUrl.hash = "";
    return apiUrl.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

export function firstMobileSafeUrl(candidates) {
  for (const candidate of candidates.flat().filter(Boolean)) {
    const normalized = normalizeBaseUrl(candidate);
    if (normalized && !isMobileFacingUrlBlocked(normalized)) {
      return normalized;
    }
  }
  return "";
}

export function resolveMobileServerBaseUrl({
  currentUrl = "",
  requestBaseUrl = "",
  publicUrl = "",
  candidateUrls = [],
  apiPort = 4000
} = {}) {
  return firstMobileSafeUrl([
    candidateUrls,
    currentUrl ? apiUrlFromWebUrl(currentUrl, apiPort) : "",
    currentUrl ? toUrlWithPort(currentUrl, apiPort) : "",
    requestBaseUrl ? toUrlWithPort(requestBaseUrl, apiPort) : "",
    publicUrl
  ]);
}

export function resolveMobileWebBaseUrl({
  currentUrl = "",
  requestBaseUrl = "",
  publicUrl = "",
  candidateUrls = [],
  webPort = 5173
} = {}) {
  return firstMobileSafeUrl([
    candidateUrls,
    currentUrl ? toUrlWithPort(currentUrl, webPort) : "",
    requestBaseUrl ? toUrlWithPort(requestBaseUrl, webPort) : "",
    publicUrl
  ]);
}

export function rewriteUrlBase(rawUrl, baseUrl) {
  const safeBase = normalizeBaseUrl(baseUrl);
  if (!safeBase || isMobileFacingUrlBlocked(safeBase)) {
    return "";
  }

  try {
    const base = new URL(safeBase);
    const source = new URL(rawUrl, safeBase);
    source.protocol = base.protocol;
    source.hostname = base.hostname;
    source.port = base.port;
    source.username = "";
    source.password = "";
    return source.toString();
  } catch {
    return "";
  }
}

export function sanitizeMobileFacingUrl(rawUrl, { fallbackBaseUrl = "", forceBaseUrl = false } = {}) {
  const normalizedFallback = normalizeBaseUrl(fallbackBaseUrl);

  if (forceBaseUrl) {
    return rewriteUrlBase(rawUrl, normalizedFallback);
  }

  try {
    const parsed = new URL(rawUrl, normalizedFallback || undefined);
    if (!isLoopbackHost(parsed.hostname)) {
      return parsed.toString();
    }
  } catch {
    // Fall through to fallback rewrite.
  }

  return rewriteUrlBase(rawUrl, normalizedFallback);
}
