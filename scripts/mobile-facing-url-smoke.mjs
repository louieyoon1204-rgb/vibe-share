import assert from "node:assert/strict";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  apiUrlFromWebUrl,
  containsLoopbackUrlValue,
  isMobileFacingUrlBlocked,
  isPrivateLanHost,
  resolveMobileServerBaseUrl,
  resolveMobileWebBaseUrl,
  sanitizeMobileFacingUrl
} from "@vibe-share/shared";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const lanWeb = "http://192.168.219.43:5173";
const lanApi = "http://192.168.219.43:4000";

const qrBase = resolveMobileWebBaseUrl({
  requestBaseUrl: "http://localhost:4000",
  candidateUrls: [lanWeb],
  webPort: 5173
});
assert.equal(qrBase, lanWeb);
assert.equal(isMobileFacingUrlBlocked(`${qrBase}/j/123456`), false);

const joinApi = resolveMobileServerBaseUrl({
  currentUrl: "http://192.168.219.43:5173/j/123456",
  apiPort: 4000
});
assert.equal(joinApi, lanApi);

const manualFallbackApi = resolveMobileServerBaseUrl({
  currentUrl: "http://192.168.219.43:5173",
  apiPort: 4000
});
assert.equal(manualFallbackApi, lanApi);
assert.equal(apiUrlFromWebUrl("https://app-staging.getvibeshare.com/j/123456"), "https://api-staging.getvibeshare.com");
assert.equal(apiUrlFromWebUrl("https://app.getvibeshare.com/j/123456"), "https://api.getvibeshare.com");
assert.equal(resolveMobileServerBaseUrl({
  currentUrl: "https://app-staging.getvibeshare.com/j/123456",
  apiPort: 4000
}), "https://api-staging.getvibeshare.com");

const rewrittenDownloadUrl = sanitizeMobileFacingUrl(
  "http://127.0.0.1:4000/api/transfers/t1/download?sessionId=s1",
  { fallbackBaseUrl: lanApi, forceBaseUrl: true }
);
assert.equal(rewrittenDownloadUrl, `${lanApi}/api/transfers/t1/download?sessionId=s1`);
assert.equal(isMobileFacingUrlBlocked(rewrittenDownloadUrl), false);

assert.equal(isMobileFacingUrlBlocked("http://localhost:4000/api/info"), true);
assert.equal(isMobileFacingUrlBlocked("http://127.0.0.1:9000/vibe-share-transfers/file"), true);
assert.equal(isMobileFacingUrlBlocked("http://10.197.219.150:4000/api/info"), false);
assert.equal(isMobileFacingUrlBlocked("http://10.197.219.150:4000/api/info", { blockPrivate: true }), true);
assert.equal(isMobileFacingUrlBlocked("http://192.168.219.43:4000/api/info", { blockPrivate: true }), true);
assert.equal(isPrivateLanHost("10.197.219.150"), true);
assert.equal(containsLoopbackUrlValue(JSON.stringify({ apiBaseUrl: "http://localhost:4000" })), true);
assert.equal(containsLoopbackUrlValue(JSON.stringify({ downloadBaseUrl: lanApi })), false);

const webMain = await fsp.readFile(path.join(repoRoot, "apps/web/src/main.js"), "utf8");
const webRedirects = await fsp.readFile(path.join(repoRoot, "apps/web/public/_redirects"), "utf8");
const webHeaders = await fsp.readFile(path.join(repoRoot, "apps/web/public/_headers"), "utf8");
const webStyles = await fsp.readFile(path.join(repoRoot, "apps/web/src/styles.css"), "utf8");
assert.match(webMain, /resolveMobileServerBaseUrl/);
assert.match(webMain, /resolveMobileWebBaseUrl/);
assert.match(webMain, /sanitizeMobileFacingUrl/);
assert.match(webMain, /isMobileFacingUrlBlocked\(url\)/);
assert.match(webMain, /id="pcFileInput" type="file" multiple/);
assert.match(webMain, /id="mobileFileInput" type="file" multiple/);
assert.match(webMain, /uploadPcFiles\(files\)/);
assert.match(webMain, /uploadMobileFiles\(files\)/);
assert.match(webMain, /전송 중에는 이 페이지를 닫거나 다른 앱으로 나가지 마세요/);
assert.match(webMain, /document\.addEventListener\("visibilitychange"/);
assert.match(webMain, /window\.addEventListener\("pagehide"/);
assert.match(webMain, /window\.addEventListener\("pageshow"/);
assert.match(webMain, /recoverCurrentSession/);
assert.match(webMain, /AUTO_JOIN_DELAYS_MS\s*=\s*\[0,\s*1000,\s*2500\]/);
assert.match(webMain, /PUBLIC_CONNECTION_NOTICE/);
assert.match(webMain, /LOCAL_NETWORK_REQUIREMENT_NOTICE/);
assert.match(webMain, /connectionFailureFirstNotice/);
assert.match(webMain, /isPublicWebRuntime/);
assert.match(webMain, /publicApiBaseUrlFromLocation/);
assert.match(webMain, /isProductionBlockedUrl/);
assert.match(webMain, /installRuntimeErrorHandlers/);
assert.match(webMain, /handleRuntimeError/);
assert.match(webMain, /runtime-error-card/);
assert.match(webMain, /runAsyncTask\(bootMobile\(\), "boot-mobile"\)/);
assert.match(webMain, /R2_UPLOAD_ETAG_NOT_EXPOSED/);
assert.match(webMain, /휴대폰과 PC는 같은 WiFi 또는 같은 핫스팟에 연결되어 있어야 합니다\./);
assert.match(webMain, /같은 WiFi인지 먼저 확인하세요\./);
assert.match(webMain, /function scheduleAutoJoin/);
assert.match(webMain, /async function runAutoJoinAttempt/);
assert.match(webMain, /async function connectWithCode/);
assert.match(webMain, /connectWithCode\(code, serverUrl/);
assert.match(webMain, /strictServerUrl:\s*true/);
assert.match(webMain, /const serverUrl = strictServerUrl \? normalizeBaseUrl\(serverUrlValue\) : resolveMobileServerUrl\(serverUrlValue\)/);
assert.match(webMain, /connectWithCode\(codeValue, serverUrlValue, \{ source: "manual"/);
assert.match(webMain, /JSON\.stringify\(\{ code, joinSource: source \}\)/);
assert.match(webMain, /function prepareQrRouteAutoJoin/);
assert.match(webMain, /hardResetQrRouteStorage\("initial-qr-route"\)/);
assert.match(webMain, /const recentSession = routeJoinCode \? null : loadRecentSession\(\)/);
assert.match(webMain, /url\.searchParams\.set\("v", BUILD_ID\)/);
assert.match(webMain, /new URL\(window\.location\.origin\)/);
assert.match(webRedirects, /^\/\*\s+\/index\.html\s+200/m);
assert.match(webHeaders, /\/index\.html/);
assert.match(webHeaders, /Cache-Control:\s*no-store/);
assert.match(webStyles, /\.runtime-error-card/);
assert.match(webMain, /function currentRouteJoinCode/);
assert.match(webMain, /JOIN_PHASES/);
assert.match(webMain, /requirePaired:\s*true/);
assert.match(webMain, /SOCKET_JOIN_FAILED/);
assert.match(webMain, /PAIRING_TIMEOUT/);
assert.match(webMain, /socket\.timeout\(5000\)\.emit\("session:join"/);
assert.match(webMain, /routeJoinCode \? null :/);
assert.match(webMain, /els\.actionsCard\.hidden = !connected/);
assert.match(webMain, /els\.mobileActionsCard\.hidden = !connected/);
assert.match(webMain, /const socketJoined = await connectSocket\("mobile", \{/);
assert.match(webMain, /requirePaired,\s*[\r\n]+\s*timeoutMs: 8000,\s*[\r\n]+\s*joinSource: source/);
assert.match(webMain, /id="mobileCodeFallback"/);
assert.match(webMain, /id="mobileJoinDebug"/);
assert.match(webMain, /id="mobileHardRefreshButton"/);
assert.match(webMain, /buildIdentityText/);
assert.match(webMain, /joinDebugSnapshot/);
assert.match(webMain, /pageshow-persisted/);
assert.match(webMain, /validateQrRouteAfterRestore/);
assert.match(webMain, /event\.persisted/);
assert.match(webMain, /isCurrentBuildStorageRecord/);
assert.match(webMain, /storageBuildVersion/);
assert.match(webMain, /disableServiceWorkerCaching/);
assert.match(webMain, /vibe-share-mobile-session/);
assert.match(webMain, /vibe-share-recent-session/);
assert.doesNotMatch(webMain, /files\?\.\[0\]/);
assert.doesNotMatch(webMain, /window\.open/);
assert.doesNotMatch(webMain, /target\s*=\s*["_']_blank["_']/);
assert.doesNotMatch(webMain, /beforeunload/);

const serverIndex = await fsp.readFile(path.join(repoRoot, "apps/server/src/index.js"), "utf8");
assert.match(serverIndex, /mobileServerBaseUrl/);
assert.match(serverIndex, /isPublicDeployment/);
assert.match(serverIndex, /publicDeployment \? null/);
assert.match(serverIndex, /app\.set\("trust proxy", true\)/);
assert.match(serverIndex, /joinSource/);
assert.match(serverIndex, /api session join succeeded/);
assert.match(serverIndex, /socket session joined/);
assert.match(serverIndex, /downloadBaseUrl/);
assert.match(serverIndex, /isMobileFacingUrlBlocked\(target\.url\)/);
assert.match(serverIndex, /directFromStorage:\s*false/);
assert.match(serverIndex, /directToStorage:\s*false/);
assert.match(serverIndex, /upload\.sender === "mobile"/);

const viteConfig = await fsp.readFile(path.join(repoRoot, "apps/web/vite.config.js"), "utf8");
assert.match(viteConfig, /VITE_BUILD_ID/);
assert.match(viteConfig, /Cache-Control/);
assert.match(viteConfig, /no-store/);

console.log("mobile-facing url smoke ok: QR, join, manual fallback, multi-file upload, download, stale storage, build mismatch reset, bfcache lifecycle recovery, and source guards");
