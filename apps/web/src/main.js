import QRCode from "qrcode";
import { io } from "socket.io-client";
import {
  TRANSFER_STATES,
  apiUrlFromWebUrl,
  containsLoopbackUrlValue,
  formatBytes,
  isLoopbackHost,
  isMobileFacingUrlBlocked,
  isPrivateLanHost,
  normalizeBaseUrl as normalizeSharedBaseUrl,
  resolveMobileServerBaseUrl,
  resolveMobileWebBaseUrl,
  sanitizeMobileFacingUrl
} from "@vibe-share/shared";
import "./styles.css";

const WEB_SESSION_STORAGE_KEY = "vibe-share-web-session";
const MOBILE_SESSION_STORAGE_KEY = "vibe-share-mobile-session";
const RECENT_SESSION_STORAGE_KEY = "vibe-share-recent-session";
const STORAGE_SCHEMA_VERSION = 2;
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "0.1.0";
const BUILD_ID = import.meta.env.VITE_BUILD_ID || "dev";
const BUILD_TIME = import.meta.env.VITE_BUILD_TIME || "";
const STORAGE_BUILD_VERSION = `${APP_VERSION}:${BUILD_ID}`;
const AUTO_JOIN_STALE_MS = 15000;
const PAGE_STAY_NOTICE = "전송 중에는 이 페이지를 닫거나 다른 앱으로 나가지 마세요. 페이지를 벗어나면 연결이 끊길 수 있습니다.";
const ACTIVE_TRANSFER_NOTICE = "전송 중입니다. 이 페이지를 닫거나 다른 앱으로 나가지 마세요.";
const RECOVERING_NOTICE = "이전 연결을 복구하고 있습니다.";
const RECOVERED_NOTICE = "이전 연결을 복구했습니다.";
const RECONNECT_NOTICE = "연결이 끊겼습니다. 다시 연결하세요.";
const AUTO_JOINING_NOTICE = "연결 시도 중";
const LOCAL_NETWORK_REQUIREMENT_NOTICE = "휴대폰과 PC는 같은 WiFi 또는 같은 핫스팟에 연결되어 있어야 합니다.";
const PUBLIC_CONNECTION_NOTICE = "휴대폰 카메라로 QR을 스캔하면 같은 전송방에 연결됩니다.";
const LOCAL_NETWORK_FAILURE_FIRST_NOTICE = "같은 WiFi인지 먼저 확인하세요.";
const PUBLIC_CONNECTION_FAILURE_NOTICE = "연결이 실패하면 새 QR을 다시 스캔하세요.";
const PUBLIC_WEB_HOSTS = new Set(["app.getvibeshare.com", "app-staging.getvibeshare.com"]);
let runtimeErrorHandled = false;
let getRuntimeStateForError = () => null;

installRuntimeErrorHandlers();

const AUTO_JOIN_DELAYS_MS = [0, 1000, 2500];
const JOIN_PHASES = {
  ROUTE_OPENED: "route_opened",
  API_JOIN_STARTED: "api_join_started",
  API_JOIN_SUCCEEDED: "api_join_succeeded",
  SOCKET_CONNECTING: "socket_connecting",
  SOCKET_JOIN_ACKNOWLEDGED: "socket_join_acknowledged",
  PAIRED: "paired",
  FAILED: "failed"
};
const ACTIVE_TRANSFER_STATUSES = new Set([
  TRANSFER_STATES.UPLOADING,
  TRANSFER_STATES.DOWNLOADING,
  TRANSFER_STATES.SCANNING
]);
const UNFINISHED_TRANSFER_STATUSES = new Set([
  TRANSFER_STATES.UPLOADING,
  TRANSFER_STATES.DOWNLOADING,
  TRANSFER_STATES.SCANNING,
  TRANSFER_STATES.PENDING_ACCEPT,
  TRANSFER_STATES.ACCEPTED,
  TRANSFER_STATES.UPLOADED,
  TRANSFER_STATES.RELEASED,
  "pending"
]);
const FINAL_TRANSFER_STATUSES = new Set([
  TRANSFER_STATES.COMPLETED,
  TRANSFER_STATES.FAILED,
  TRANSFER_STATES.FAILED_SCAN,
  TRANSFER_STATES.REJECTED,
  TRANSFER_STATES.CANCELLED,
  TRANSFER_STATES.EXPIRED
]);

const query = new URLSearchParams(window.location.search);
const pathJoinCode = (window.location.pathname.match(/^\/(?:j|join)\/(\d{6})\/?$/) || [])[1] || "";
const queryJoinCode = String(query.get("join") || query.get("code") || "").replace(/\D/g, "").slice(0, 6);
const routeJoinCode = pathJoinCode || queryJoinCode;
const isMobileJoinMode = Boolean(routeJoinCode) || query.get("mode") === "mobile";
const routeType = routeJoinCode ? "qr-route" : (isMobileJoinMode ? "mobile-manual" : "pc");
const initialStoredCode = readStoredConnectionCode();
const resetRequested = query.get("reset") === "1" || query.get("fresh") === "1";
if (resetRequested) {
  clearAllVibeShareStorage("query-reset");
}
ensureStorageMatchesCurrentBuild();
if (routeJoinCode) {
  hardResetQrRouteStorage("initial-qr-route");
} else if (isMobileJoinMode) {
  clearStaleMobileConnectionStorage();
}
const recentSession = routeJoinCode ? null : loadRecentSession();
const savedWebSession = isMobileJoinMode ? null : loadSavedWebSession();
const savedMobileSession = isMobileJoinMode && !routeJoinCode ? loadSavedMobileSession() : null;
const savedSession = savedWebSession || savedMobileSession;
const mobileInitialApiBaseUrl = isMobileJoinMode ? (resolveMobileServerBaseUrlFromLocation() || savedMobileSession?.apiBaseUrl || "") : "";

const state = {
  role: isMobileJoinMode ? "mobile" : "pc",
  apiBaseUrl: isMobileJoinMode ? mobileInitialApiBaseUrl : initialPcApiBaseUrl(),
  publicServerUrl: isMobileJoinMode ? mobileInitialApiBaseUrl : initialPcPublicServerUrl(),
  phoneWebUrl: "",
  joinUrl: routeJoinCode ? window.location.href : (savedSession?.joinUrl || recentSession?.joinUrl || ""),
  joinCode: routeJoinCode || savedSession?.session?.code || recentSession?.code || "",
  serverInfo: null,
  session: routeJoinCode ? null : (savedSession?.session || null),
  auth: routeJoinCode ? null : (savedSession?.auth || null),
  socket: null,
  socketConnected: false,
  paired: routeJoinCode ? false : Boolean(savedSession?.session?.paired),
  message: routeJoinCode ? AUTO_JOINING_NOTICE : "연결 준비 중",
  blockedReason: "",
  joinError: "",
  activeUploadFileKey: null,
  connectionLost: false,
  lifecycleNotice: "",
  pageHidden: document.visibilityState === "hidden",
  wasHiddenDuringTransfer: false,
  recoveryPending: false,
  recovering: false,
  lastDirection: recentSession?.direction || savedSession?.direction || "",
  pendingTransferSnapshot: recentSession?.pendingTransfers || [],
  autoJoinInProgress: false,
  autoJoinAttempt: 0,
  autoJoinTimer: null,
  autoJoinFinalFailed: false,
  autoJoinRunId: 0,
  autoJoinStartedAt: 0,
  joinPhase: routeJoinCode ? JOIN_PHASES.ROUTE_OPENED : "",
  routeType,
  lastPageShowPersisted: false,
  lastLifecycleEvent: "boot",
  autoJoinDebug: {
    buildId: BUILD_ID,
    appVersion: APP_VERSION,
    buildTime: BUILD_TIME,
    routeCode: routeJoinCode,
    storedCode: initialStoredCode,
    routeType,
    resolvedApiBase: mobileInitialApiBaseUrl,
    pageshowPersisted: false,
    preflight: "idle",
    apiJoin: "idle",
    socketConnected: false,
    socketJoinAck: false,
    paired: false,
    retryCount: 0,
    lastError: "",
    source: "",
    staleRecoveryUsed: false
  },
  outgoing: new Map(),
  incoming: new Map(),
  dismissedReceiveTransferIds: new Set(),
  uploadManifests: []
};
getRuntimeStateForError = () => state;

const app = document.querySelector("#app");
let els = {};

startApp();

function startApp() {
  try {
    if (!app) {
      throw new Error("APP_ROOT_NOT_FOUND");
    }
    runAsyncTask(disableServiceWorkerCaching(), "service-worker-cleanup");

    if (state.role === "mobile") {
      renderMobileShell();
      bindMobileEvents();
      render();
      runAsyncTask(bootMobile(), "boot-mobile");
    } else {
      renderPcShell();
      bindPcEvents();
      render();
      runAsyncTask(bootPc(), "boot-pc");
      runAsyncTask(refreshUploadManifests(), "refresh-upload-manifests");
    }
    bindPageLifecycleEvents();
  } catch (error) {
    handleRuntimeError(error, { phase: "start-app" });
  }
}

function initialPcApiBaseUrl() {
  if (isPublicWebRuntime()) {
    return defaultApiBaseUrl();
  }
  return normalizeBaseUrl(query.get("serverUrl") || savedWebSession?.apiBaseUrl || defaultApiBaseUrl());
}

function initialPcPublicServerUrl() {
  if (isPublicWebRuntime()) {
    return defaultApiBaseUrl();
  }
  return normalizeBaseUrl(query.get("serverUrl") || savedWebSession?.publicServerUrl || defaultApiBaseUrl());
}

function installRuntimeErrorHandlers() {
  if (window.__vibeShareRuntimeErrorHandlersInstalled) {
    return;
  }
  window.__vibeShareRuntimeErrorHandlersInstalled = true;
  window.addEventListener("error", (event) => {
    handleRuntimeError(event.error || event.message, {
      phase: "window-error",
      filename: event.filename || "",
      line: event.lineno || 0,
      column: event.colno || 0
    });
  });
  window.addEventListener("unhandledrejection", (event) => {
    handleRuntimeError(event.reason || "unhandledrejection", { phase: "unhandledrejection" });
  });
}

function runAsyncTask(task, phase) {
  Promise.resolve(task).catch((error) => {
    handleRuntimeError(error, { phase });
  });
}

function handleRuntimeError(error, context = {}) {
  const details = runtimeErrorSnapshot(error, context);
  safeConsoleError("[vibe-share] runtime error", details);
  renderRuntimeErrorCard(details);
}

function runtimeErrorSnapshot(error, context = {}) {
  const runtimeState = safeRuntimeState();
  return {
    message: safeErrorMessage(error),
    stack: safeErrorStack(error),
    phase: context.phase || "runtime",
    filename: context.filename || "",
    line: context.line || 0,
    column: context.column || 0,
    buildId: BUILD_ID,
    appVersion: APP_VERSION,
    buildTime: BUILD_TIME,
    routeCode: safeRouteJoinCode(),
    routeType: runtimeState?.routeType || (safeRouteJoinCode() ? "qr-route" : "unknown"),
    apiBaseUrl: runtimeState?.apiBaseUrl || safePublicApiBaseUrl(),
    joinPhase: runtimeState?.joinPhase || "",
    paired: Boolean(runtimeState?.socketConnected && runtimeState?.paired),
    href: window.location.href,
    userAgent: navigator.userAgent
  };
}

function renderRuntimeErrorCard(details) {
  const root = document.querySelector("#app");
  if (!root) {
    return;
  }
  runtimeErrorHandled = true;
  const routeCode = details.routeCode || "------";
  root.innerHTML = `
    <main class="runtime-error-layout">
      <section class="runtime-error-card" role="alert" aria-live="assertive">
        <p class="eyebrow">Vibe Share</p>
        <h1>연결 화면을 다시 준비해야 합니다</h1>
        <p class="lead">앱을 여는 중 오류가 발생했습니다. 흰 화면 대신 이 안내가 보이면 새로고침으로 다시 시도할 수 있습니다.</p>
        <div class="runtime-error-actions">
          <button id="runtimeRetryButton" type="button">다시 열기</button>
          <a class="secondary-link" href="/">PC 화면으로 이동</a>
        </div>
        <dl class="runtime-error-meta">
          <div><dt>QR 코드</dt><dd>${escapeRuntimeHtml(routeCode)}</dd></div>
          <div><dt>API</dt><dd>${escapeRuntimeHtml(details.apiBaseUrl || "-")}</dd></div>
          <div><dt>빌드</dt><dd>${escapeRuntimeHtml(details.buildId || "-")}</dd></div>
          <div><dt>단계</dt><dd>${escapeRuntimeHtml(details.phase || "-")} / ${escapeRuntimeHtml(details.joinPhase || "-")}</dd></div>
        </dl>
        <details class="runtime-error-debug">
          <summary>개발자 오류 정보</summary>
          <pre>${escapeRuntimeHtml(JSON.stringify(details, null, 2))}</pre>
        </details>
      </section>
    </main>
  `;
  const retryButton = document.querySelector("#runtimeRetryButton");
  retryButton?.addEventListener("click", () => {
    try {
      clearAllVibeShareStorage("runtime-error-retry");
    } catch {
      // Ignore storage cleanup failures and reload anyway.
    }
    const retryUrl = new URL(window.location.href);
    retryUrl.searchParams.set("fresh", "1");
    retryUrl.searchParams.set("t", String(Date.now()));
    window.location.replace(retryUrl.toString());
  });
}

function safeRuntimeState() {
  try {
    return getRuntimeStateForError();
  } catch {
    return null;
  }
}

function safeRouteJoinCode() {
  try {
    const pathCode = (window.location.pathname.match(/^\/(?:j|join)\/(\d{6})\/?$/) || [])[1] || "";
    const params = new URLSearchParams(window.location.search);
    const searchCode = String(params.get("join") || params.get("code") || "").replace(/\D/g, "").slice(0, 6);
    return pathCode || searchCode || "";
  } catch {
    return "";
  }
}

function safePublicApiBaseUrl() {
  try {
    const hostname = window.location.hostname || "";
    if (window.location.protocol === "https:" && hostname.startsWith("app.")) {
      return `${window.location.protocol}//api.${hostname.slice("app.".length)}`;
    }
    if (window.location.protocol === "https:" && hostname.startsWith("app-staging.")) {
      return `${window.location.protocol}//api-staging.${hostname.slice("app-staging.".length)}`;
    }
  } catch {
    // Ignore URL resolution failures in the error path.
  }
  return "";
}

function safeErrorMessage(error) {
  if (error instanceof Error) {
    return error.message || error.name || "Unknown error";
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function safeErrorStack(error) {
  if (!(error instanceof Error) || !error.stack) {
    return "";
  }
  return String(error.stack).slice(0, 3000);
}

function safeConsoleError(message, details) {
  try {
    console.error(message, details);
  } catch {
    // Avoid throwing from the fallback logger.
  }
}

function escapeRuntimeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderPcShell() {
  document.documentElement.lang = "ko";
  app.innerHTML = `
    <header class="app-header">
      <div>
        <p class="eyebrow">Vibe Share</p>
        <h1>휴대폰과 먼저 연결하세요</h1>
        <p class="lead">휴대폰 카메라로 QR을 스캔하면 PC와 휴대폰이 같은 전송방에 연결됩니다.</p>
      </div>
      <div class="status-pill" id="pcStatus">연결 준비 중</div>
    </header>

    <main class="app-layout pc-layout">
      <section class="notice-card danger" id="localhostBanner" hidden>
        <strong>연결 주소를 확인하세요</strong>
        <p id="localhostWarningText">로컬 개발에서는 같은 Wi-Fi에서 접속 가능한 LAN 주소가 필요합니다.</p>
      </section>

      <section class="session-warning" id="pcLifecycleNotice">
        <p id="pcLifecycleText">${PAGE_STAY_NOTICE}</p>
        <button class="secondary-action compact-action" id="pcReconnectButton" type="button" hidden>다시 연결</button>
      </section>

      <section class="pairing-card" aria-labelledby="pairingTitle">
        <div class="pairing-copy">
          <p class="step-label">1단계</p>
          <h2 id="pairingTitle">휴대폰 연결</h2>
          <p>휴대폰 카메라로 QR을 스캔하세요.</p>
        </div>

        <div class="pairing-grid">
          <div class="qr-box">
            <canvas id="qrCanvas" width="460" height="460" aria-label="Vibe Share 연결 QR"></canvas>
            <p id="qrPlaceholder">QR을 준비하고 있습니다.</p>
          </div>

          <div class="code-box">
            <p>6자리 코드</p>
            <strong id="manualCode">------</strong>
            <span id="expiryText"></span>
            <button class="secondary-action" id="refreshSessionButton" type="button">새 QR 만들기</button>
          </div>
        </div>

        <p class="helper center" id="qrHelp">이 QR은 휴대폰 웹 연결용입니다.</p>
        <p class="network-notice center">${networkRequirementNotice()}</p>
      </section>

      <section class="action-card" id="actionsCard" hidden aria-labelledby="actionsTitle">
        <div>
          <p class="step-label">2단계</p>
          <h2 id="actionsTitle">무엇을 할까요?</h2>
          <p class="helper">연결된 뒤에만 파일을 선택합니다.</p>
        </div>
        <div class="action-grid">
          <button class="big-action" id="sendPcToPhoneButton" type="button">휴대폰으로 파일 보내기</button>
          <button class="big-action secondary" id="phoneToPcHintButton" type="button">휴대폰에서 파일 받기</button>
        </div>
        <input id="pcFileInput" type="file" multiple hidden />
        <p class="helper strong" id="pcSendHint"></p>
      </section>

      <section class="history-card" aria-labelledby="historyTitle">
        <h2 id="historyTitle">최근 전송</h2>
        <div class="columns">
          <div>
            <h3>휴대폰으로 보낸 파일</h3>
            <div class="transfer-list" id="outgoingList"></div>
          </div>
          <div>
            <h3>휴대폰에서 받은 파일</h3>
            <div class="transfer-list" id="incomingList"></div>
          </div>
        </div>
        <div class="transfer-list" id="resumeList"></div>
      </section>

      <details class="advanced-card" id="mobileCodeFallback">
        <summary>고급 정보</summary>
        <p class="helper">일반 전송에는 필요하지 않습니다. 연결이 안 될 때만 확인하세요.</p>
        <div class="field-grid">
          <label>
            <span>PC에서 쓰는 서버 주소</span>
            <input id="apiBaseUrlInput" type="url" spellcheck="false" />
          </label>
          <label>
            <span>휴대폰이 접속할 서버 주소</span>
            <input id="publicServerUrlInput" type="url" spellcheck="false" />
          </label>
        </div>
        <div class="actions">
          <button id="checkServerButton" type="button">주소 다시 확인</button>
        </div>
        <div class="lan-summary">
          <div>
            <span>휴대폰 웹 주소</span>
            <strong id="phoneWebUrlValue">-</strong>
          </div>
          <div>
            <span>QR에 들어가는 연결 주소</span>
            <strong id="publicServerUrlValue">-</strong>
          </div>
        </div>
        <p class="helper">QR URL</p>
        <code class="join-url" id="joinUrlValue">-</code>
        <p class="helper" id="serverHint"></p>
      </details>
    </main>
    <footer class="build-footer" id="pcBuildInfo"></footer>
  `;

  els = {
    pcStatus: document.querySelector("#pcStatus"),
    localhostBanner: document.querySelector("#localhostBanner"),
    localhostWarningText: document.querySelector("#localhostWarningText"),
    pcLifecycleNotice: document.querySelector("#pcLifecycleNotice"),
    pcLifecycleText: document.querySelector("#pcLifecycleText"),
    pcReconnectButton: document.querySelector("#pcReconnectButton"),
    qrCanvas: document.querySelector("#qrCanvas"),
    qrPlaceholder: document.querySelector("#qrPlaceholder"),
    manualCode: document.querySelector("#manualCode"),
    expiryText: document.querySelector("#expiryText"),
    refreshSessionButton: document.querySelector("#refreshSessionButton"),
    qrHelp: document.querySelector("#qrHelp"),
    actionsCard: document.querySelector("#actionsCard"),
    sendPcToPhoneButton: document.querySelector("#sendPcToPhoneButton"),
    phoneToPcHintButton: document.querySelector("#phoneToPcHintButton"),
    pcFileInput: document.querySelector("#pcFileInput"),
    pcSendHint: document.querySelector("#pcSendHint"),
    outgoingList: document.querySelector("#outgoingList"),
    incomingList: document.querySelector("#incomingList"),
    resumeList: document.querySelector("#resumeList"),
    apiBaseUrlInput: document.querySelector("#apiBaseUrlInput"),
    publicServerUrlInput: document.querySelector("#publicServerUrlInput"),
    phoneWebUrlValue: document.querySelector("#phoneWebUrlValue"),
    publicServerUrlValue: document.querySelector("#publicServerUrlValue"),
    joinUrlValue: document.querySelector("#joinUrlValue"),
    checkServerButton: document.querySelector("#checkServerButton"),
    serverHint: document.querySelector("#serverHint"),
    pcBuildInfo: document.querySelector("#pcBuildInfo")
  };

  els.apiBaseUrlInput.value = state.apiBaseUrl;
  els.publicServerUrlInput.value = state.publicServerUrl;
}

function renderMobileShell() {
  document.documentElement.lang = "ko";
  app.innerHTML = `
    <header class="mobile-header">
      <p class="eyebrow">Vibe Share</p>
      <h1>PC와 연결</h1>
      <p class="lead">연결되면 보낼지 받을지 선택하세요.</p>
      <div class="status-pill" id="mobileStatus">연결 대기 중</div>
    </header>

    <main class="mobile-layout">
      <section class="mobile-connect-card">
        <h2 id="mobileTitle">연결 대기 중</h2>
        <p class="helper" id="mobileMessage">QR 정보를 확인하고 있습니다.</p>
        <p class="network-notice">${networkRequirementNotice()}</p>
        <div class="retry-area" id="mobileRetryArea" hidden>
          <p class="helper error" id="mobileErrorText"></p>
          <p class="code-line">6자리 코드 <strong id="mobileCodeBadge">------</strong></p>
          <button id="mobileRetryButton" type="button">다시 연결</button>
        </div>
      </section>

      <section class="session-warning" id="mobileLifecycleNotice">
        <p id="mobileLifecycleText">${PAGE_STAY_NOTICE}</p>
        <button class="secondary-action compact-action" id="mobileReconnectButton" type="button" hidden>다시 연결</button>
      </section>

      <section class="action-card mobile-actions" id="mobileActionsCard" hidden>
        <h2>무엇을 할까요?</h2>
        <button class="big-action" id="mobileSendButton" type="button">PC로 파일 보내기</button>
        <button class="big-action secondary" id="mobileReceiveButton" type="button">PC에서 파일 받기</button>
        <input id="mobileFileInput" type="file" multiple hidden />
        <p class="helper strong" id="mobileSendHint"></p>
      </section>

      <div class="receive-modal-backdrop" id="receiveModal" hidden role="dialog" aria-modal="true" aria-labelledby="receiveModalTitle">
        <div class="receive-modal">
          <h2 id="receiveModalTitle">파일 받기</h2>
          <p class="helper">받을 파일을 선택하세요. 다운로드를 누른 파일만 시작됩니다.</p>
          <div class="receive-file-list" id="receiveModalList"></div>
        </div>
      </div>

      <section class="history-card" id="mobileIncomingSection">
        <h2>받은 파일</h2>
        <div class="transfer-list" id="mobileIncomingList"></div>
      </section>

      <section class="history-card">
        <h2>보낸 파일</h2>
        <div class="transfer-list" id="mobileOutgoingList"></div>
      </section>

      <details class="advanced-card">
        <summary>코드로 직접 연결</summary>
        <p class="helper">QR을 열 수 없을 때만 사용하세요. localhost 주소는 휴대폰에서 사용할 수 없습니다.</p>
        <label class="server-address-field" hidden>
          <span>서버 주소</span>
          <input id="mobileServerUrlInput" type="url" spellcheck="false" />
        </label>
        <label>
          <span>6자리 코드</span>
          <input id="mobileCodeInput" inputmode="numeric" maxlength="6" />
        </label>
        <button id="mobileJoinButton" type="button">연결하기</button>
        <button class="text-action" id="mobileResetButton" type="button">연결 정보 초기화</button>
        <button class="text-action" id="mobileHardRefreshButton" type="button">이 기기의 Vibe Share 상태 새로고침</button>
      </details>

      <details class="advanced-card join-debug" id="mobileJoinDebug" hidden>
        <summary>개발자 연결 정보</summary>
        <pre id="mobileJoinDebugText"></pre>
      </details>
    </main>
    <footer class="build-footer" id="mobileBuildInfo"></footer>
  `;

  els = {
    mobileStatus: document.querySelector("#mobileStatus"),
    mobileTitle: document.querySelector("#mobileTitle"),
    mobileMessage: document.querySelector("#mobileMessage"),
    mobileRetryArea: document.querySelector("#mobileRetryArea"),
    mobileErrorText: document.querySelector("#mobileErrorText"),
    mobileCodeBadge: document.querySelector("#mobileCodeBadge"),
    mobileRetryButton: document.querySelector("#mobileRetryButton"),
    mobileLifecycleNotice: document.querySelector("#mobileLifecycleNotice"),
    mobileLifecycleText: document.querySelector("#mobileLifecycleText"),
    mobileReconnectButton: document.querySelector("#mobileReconnectButton"),
    mobileActionsCard: document.querySelector("#mobileActionsCard"),
    mobileSendButton: document.querySelector("#mobileSendButton"),
    mobileReceiveButton: document.querySelector("#mobileReceiveButton"),
    mobileFileInput: document.querySelector("#mobileFileInput"),
    mobileSendHint: document.querySelector("#mobileSendHint"),
    receiveModal: document.querySelector("#receiveModal"),
    receiveModalList: document.querySelector("#receiveModalList"),
    mobileIncomingList: document.querySelector("#mobileIncomingList"),
    mobileOutgoingList: document.querySelector("#mobileOutgoingList"),
    mobileIncomingSection: document.querySelector("#mobileIncomingSection"),
    mobileCodeFallback: document.querySelector("#mobileCodeFallback"),
    mobileServerUrlInput: document.querySelector("#mobileServerUrlInput"),
    mobileCodeInput: document.querySelector("#mobileCodeInput"),
    mobileJoinButton: document.querySelector("#mobileJoinButton"),
    mobileResetButton: document.querySelector("#mobileResetButton"),
    mobileHardRefreshButton: document.querySelector("#mobileHardRefreshButton"),
    mobileJoinDebug: document.querySelector("#mobileJoinDebug"),
    mobileJoinDebugText: document.querySelector("#mobileJoinDebugText"),
    mobileBuildInfo: document.querySelector("#mobileBuildInfo")
  };

  els.mobileServerUrlInput.value = state.apiBaseUrl;
  els.mobileCodeInput.value = state.joinCode;
}

function bindPcEvents() {
  els.refreshSessionButton.addEventListener("click", () => {
    state.session = null;
    state.auth = null;
    state.paired = false;
    state.connectionLost = false;
    state.lifecycleNotice = "";
    state.outgoing.clear();
    state.incoming.clear();
    state.dismissedReceiveTransferIds.clear();
    saveWebSession();
    void createPcSession();
  });

  els.pcReconnectButton.addEventListener("click", () => {
    void recoverCurrentSession("manual");
  });

  els.checkServerButton.addEventListener("click", async () => {
    state.apiBaseUrl = normalizeBaseUrl(els.apiBaseUrlInput.value);
    state.publicServerUrl = normalizeBaseUrl(els.publicServerUrlInput.value || state.apiBaseUrl);
    await loadServerInfo();
    if (state.session?.id) {
      await renderQrCode();
    } else {
      await createPcSession();
    }
    render();
  });

  els.sendPcToPhoneButton.addEventListener("click", () => {
    if (!(state.socketConnected && state.paired)) {
      setPcSendHint("먼저 휴대폰을 연결하세요.", true);
      return;
    }
    els.pcFileInput.click();
  });

  els.phoneToPcHintButton.addEventListener("click", () => {
    state.lastDirection = "phone-to-pc";
    saveCurrentSession();
    setPcSendHint("휴대폰 화면에서 'PC로 파일 보내기'를 누르세요.");
  });

  els.pcFileInput.addEventListener("change", () => {
    const files = selectedFiles(els.pcFileInput);
    if (!files.length) {
      return;
    }
    void uploadPcFiles(files);
    els.pcFileInput.value = "";
  });

  els.incomingList.addEventListener("click", handleTransferActionClick);
  els.resumeList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-upload-id]");
    if (button) {
      void cancelStoredUpload(button.dataset.uploadId);
    }
  });
}

function bindMobileEvents() {
  els.mobileRetryButton.addEventListener("click", () => {
    state.joinError = "";
    if (currentRouteJoinCode()) {
      scheduleAutoJoin("manual-retry", { resetAttempts: true, immediate: true });
      return;
    }
    void joinMobileSession(preferredMobileApiBaseUrl(), state.joinCode || els.mobileCodeInput.value);
  });

  els.mobileReconnectButton.addEventListener("click", () => {
    void recoverCurrentSession("manual");
  });

  els.mobileJoinButton.addEventListener("click", () => {
    state.apiBaseUrl = resolveMobileServerUrl(els.mobileServerUrlInput.value);
    state.joinCode = String(els.mobileCodeInput.value || "").replace(/\D/g, "").slice(0, 6);
    void joinMobileSession(state.apiBaseUrl, state.joinCode);
  });

  els.mobileResetButton.addEventListener("click", () => {
    resetMobileConnectionInfo();
    void bootMobile();
  });

  els.mobileHardRefreshButton.addEventListener("click", () => {
    resetMobileConnectionInfo({ clearCaches: true });
    if (currentRouteJoinCode()) {
      scheduleAutoJoin("hard-refresh", { resetAttempts: true, immediate: true, hardReset: true });
      return;
    }
    void bootMobile();
  });

  els.mobileSendButton.addEventListener("click", () => {
    if (!(state.socketConnected && state.paired)) {
      setMobileHint("먼저 PC와 연결하세요.", true);
      return;
    }
    state.lastDirection = "mobile-to-pc";
    saveCurrentSession();
    els.mobileFileInput.click();
  });

  els.mobileReceiveButton.addEventListener("click", () => {
    if (!(state.socketConnected && state.paired)) {
      setMobileHint("먼저 PC와 연결하세요.", true);
      return;
    }
    state.lastDirection = "pc-to-mobile";
    saveCurrentSession();
    els.mobileIncomingSection.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileHint("PC에서 보낸 파일은 이 화면에서 바로 받을 수 있습니다.");
  });

  els.receiveModalList.addEventListener("click", handleTransferActionClick);

  els.mobileFileInput.addEventListener("change", () => {
    const files = selectedFiles(els.mobileFileInput);
    if (files.length) {
      uploadMobileFiles(files);
    }
    els.mobileFileInput.value = "";
  });

  els.mobileIncomingList.addEventListener("click", handleTransferActionClick);
}

function bindPageLifecycleEvents() {
  document.addEventListener("visibilitychange", () => {
    state.lastLifecycleEvent = `visibilitychange:${document.visibilityState}`;
    if (document.visibilityState === "hidden") {
      handlePageHidden("visibilitychange");
      return;
    }
    if (state.role === "mobile" && currentRouteJoinCode()) {
      void validateQrRouteAfterRestore("visibilitychange", { hardReset: false });
      return;
    }
    void handlePageVisible();
  });

  window.addEventListener("pagehide", (event) => {
    state.lastLifecycleEvent = `pagehide:${event.persisted ? "persisted" : "normal"}`;
    updateJoinDebug({ pagehidePersisted: Boolean(event.persisted) });
    handlePageHidden("pagehide");
  });

  window.addEventListener("pageshow", (event) => {
    state.lastPageShowPersisted = Boolean(event.persisted);
    state.lastLifecycleEvent = `pageshow:${event.persisted ? "persisted" : "normal"}`;
    updateJoinDebug({ pageshowPersisted: Boolean(event.persisted) });
    if (state.role === "mobile" && currentRouteJoinCode()) {
      void validateQrRouteAfterRestore(event.persisted ? "pageshow-persisted" : "pageshow", {
        hardReset: Boolean(event.persisted)
      });
      return;
    }
    if (event.persisted || state.wasHiddenDuringTransfer || state.connectionLost) {
      void handlePageVisible();
    }
  });
}

function handlePageHidden(reason) {
  state.pageHidden = true;
  state.pendingTransferSnapshot = transferSnapshot();
  if (hasUnfinishedTransfers()) {
    state.wasHiddenDuringTransfer = true;
    state.lifecycleNotice = ACTIVE_TRANSFER_NOTICE;
  }
  saveCurrentSession(reason);
  render();
}

async function handlePageVisible() {
  if (state.role === "mobile" && currentRouteJoinCode()) {
    state.pageHidden = false;
    await validateQrRouteAfterRestore("visible", { hardReset: false });
    return;
  }

  const shouldRecover = state.pageHidden || state.wasHiddenDuringTransfer || state.connectionLost || Boolean(state.session?.id && !state.socketConnected);
  state.pageHidden = false;
  if (!shouldRecover) {
    return;
  }

  state.lifecycleNotice = RECOVERING_NOTICE;
  state.recoveryPending = true;
  state.wasHiddenDuringTransfer = false;
  render();
  await recoverCurrentSession("visible");
}

async function validateQrRouteAfterRestore(source, { hardReset = false } = {}) {
  const routeCode = currentRouteJoinCode();
  if (state.role !== "mobile" || !/^\d{6}$/.test(routeCode)) {
    return;
  }

  state.pageHidden = false;
  ensureStorageMatchesCurrentBuild();
  const routeChanged = state.joinCode !== routeCode || (state.session?.code && state.session.code !== routeCode);
  const needsFreshJoin = hardReset || routeChanged || !(state.socketConnected && state.paired && state.session?.code === routeCode);
  updateJoinDebug({
    source,
    routeCode,
    routeType: "qr-route",
    paired: Boolean(state.socketConnected && state.paired),
    staleRecoveryUsed: false
  });

  if (needsFreshJoin) {
    prepareQrRouteAutoJoin(source);
    scheduleAutoJoin(source, { resetAttempts: true, immediate: true });
    return;
  }

  try {
    state.joinPhase = JOIN_PHASES.SOCKET_JOIN_ACKNOWLEDGED;
    await preflightMobileServer(resolveQrRouteApiBaseUrl());
    updateJoinDebug({ preflight: "success", paired: true, lastError: "" });
  } catch (error) {
    prepareQrRouteAutoJoin(`${source}-preflight-failed`);
    scheduleAutoJoin(`${source}-retry`, { resetAttempts: true, immediate: true });
  } finally {
    render();
  }
}

async function recoverCurrentSession(_source = "manual") {
  if (state.recovering) {
    return;
  }
  if (state.role === "mobile" && currentRouteJoinCode()) {
    scheduleAutoJoin(_source, { resetAttempts: state.autoJoinFinalFailed, immediate: true });
    return;
  }
  state.recovering = true;
  state.lifecycleNotice = RECOVERING_NOTICE;
  state.recoveryPending = true;
  render();

  try {
    if (state.role === "pc") {
      if (!state.serverInfo) {
        await loadServerInfo();
      }
      if (state.session?.id && Number(state.session.expiresAt || 0) > Date.now() && !isQrBlocked()) {
        connectSocket("pc");
        await renderQrCode();
      } else {
        await createPcSession();
      }
      return;
    }

    clearStaleMobileConnectionStorage();
    state.apiBaseUrl = preferredMobileApiBaseUrl();
    state.publicServerUrl = state.apiBaseUrl;
    if (state.session?.id && state.auth && Number(state.session.expiresAt || 0) > Date.now() && !isBlockedMobileServerUrl(state.apiBaseUrl)) {
      state.joinError = "";
      await preflightMobileServer(state.apiBaseUrl);
      connectSocket("mobile");
      return;
    }
    if (/^\d{6}$/.test(state.joinCode)) {
      await joinMobileSession(state.apiBaseUrl, state.joinCode);
      return;
    }
    state.connectionLost = true;
    state.lifecycleNotice = RECONNECT_NOTICE;
  } catch {
    state.connectionLost = true;
    state.lifecycleNotice = RECONNECT_NOTICE;
    if (state.role === "mobile") {
      state.joinError = connectionFailureFirstNotice();
    }
  } finally {
    state.recovering = false;
    saveCurrentSession("recover");
    render();
  }
}

async function bootPc() {
  state.message = "연결 준비 중";
  render();
  await loadServerInfo();

  if (state.session?.id && Number(state.session.expiresAt || 0) > Date.now() && !isQrBlocked()) {
    state.lifecycleNotice = RECOVERING_NOTICE;
    state.recoveryPending = true;
    connectSocket("pc");
    await renderQrCode();
    render();
    return;
  }

  if (state.session?.id) {
    state.session = null;
    state.auth = null;
    saveWebSession();
  }

  await createPcSession();
}

async function bootMobile() {
  clearStaleMobileConnectionStorage();
  if (currentRouteJoinCode()) {
    prepareQrRouteAutoJoin();
    scheduleAutoJoin("boot", { resetAttempts: true, immediate: true });
    return;
  }

  state.apiBaseUrl = preferredMobileApiBaseUrl();
  state.publicServerUrl = state.apiBaseUrl;
  state.socket?.disconnect();
  state.socket = null;
  state.socketConnected = false;
  state.paired = false;

  if (state.session?.id && state.auth && Number(state.session.expiresAt || 0) > Date.now() && !isBlockedMobileServerUrl(state.apiBaseUrl)) {
    state.joinCode = state.session.code || state.joinCode;
    state.message = RECOVERING_NOTICE;
    state.recoveryPending = true;
    render();
    try {
      await preflightMobileServer(state.apiBaseUrl);
      connectSocket("mobile");
      return;
    } catch {
      state.session = null;
      state.auth = null;
      saveCurrentSession();
    }
  }

  if (/^\d{6}$/.test(state.joinCode)) {
    await joinMobileSession(state.apiBaseUrl, state.joinCode);
    return;
  }

  state.message = "QR을 스캔하거나 코드로 연결하세요.";
  render();
}

function currentRouteJoinCode() {
  const pathCode = (window.location.pathname.match(/^\/(?:j|join)\/(\d{6})\/?$/) || [])[1] || "";
  const params = new URLSearchParams(window.location.search);
  const searchCode = String(params.get("join") || params.get("code") || "").replace(/\D/g, "").slice(0, 6);
  return pathCode || searchCode || "";
}

function sessionMatchesCurrentRoute(session) {
  const code = currentRouteJoinCode();
  return !code || session?.code === code;
}

function resolveQrRouteApiBaseUrl() {
  if (isPublicWebRuntime()) {
    return publicApiBaseUrlFromLocation() || defaultApiBaseUrl();
  }

  return resolveMobileServerBaseUrl({
    currentUrl: window.location.href,
    apiPort: 4000
  });
}

function prepareQrRouteAutoJoin(source = "boot") {
  const code = currentRouteJoinCode();
  const apiBase = resolveQrRouteApiBaseUrl();
  hardResetQrRouteStorage(source);
  if (state.socket) {
    state.socket.removeAllListeners();
    state.socket.disconnect();
  }
  if (state.autoJoinTimer) {
    window.clearTimeout(state.autoJoinTimer);
    state.autoJoinTimer = null;
  }
  state.apiBaseUrl = apiBase;
  state.publicServerUrl = apiBase;
  state.joinCode = code;
  state.joinUrl = window.location.href;
  state.session = null;
  state.auth = null;
  state.socket = null;
  state.socketConnected = false;
  state.paired = false;
  state.connectionLost = false;
  state.joinError = "";
  state.lifecycleNotice = "";
  state.message = AUTO_JOINING_NOTICE;
  state.incoming.clear();
  state.outgoing.clear();
  state.dismissedReceiveTransferIds.clear();
  state.autoJoinInProgress = false;
  state.autoJoinFinalFailed = false;
  state.autoJoinStartedAt = 0;
  state.autoJoinRunId += 1;
  state.autoJoinDebug = {
    buildId: BUILD_ID,
    appVersion: APP_VERSION,
    buildTime: BUILD_TIME,
    routeCode: code,
    storedCode: initialStoredCode,
    routeType: "qr-route",
    resolvedApiBase: apiBase,
    pageshowPersisted: state.lastPageShowPersisted,
    preflight: "idle",
    apiJoin: "idle",
    socketConnected: false,
    socketJoinAck: false,
    paired: false,
    retryCount: 0,
    lastError: "",
    source,
    staleRecoveryUsed: false
  };
  state.joinPhase = JOIN_PHASES.ROUTE_OPENED;
  sessionStorage.removeItem(MOBILE_SESSION_STORAGE_KEY);
  render();
}

function scheduleAutoJoin(source, { resetAttempts = false, immediate = false, hardReset = false } = {}) {
  if (state.role !== "mobile") {
    return;
  }
  const code = currentRouteJoinCode() || state.joinCode;
  if (!/^\d{6}$/.test(code)) {
    return;
  }
  if (hardReset && currentRouteJoinCode()) {
    prepareQrRouteAutoJoin(source);
  }
  if (state.socketConnected && state.paired && state.session?.code === code) {
    return;
  }
  if (state.autoJoinInProgress || state.autoJoinTimer) {
    if (isAutoJoinStale()) {
      state.autoJoinInProgress = false;
      state.autoJoinStartedAt = 0;
      if (state.autoJoinTimer) {
        window.clearTimeout(state.autoJoinTimer);
        state.autoJoinTimer = null;
      }
    } else {
      updateJoinDebug({ source });
      return;
    }
  }
  if (resetAttempts) {
    state.autoJoinAttempt = 0;
    state.autoJoinFinalFailed = false;
  }
  if (state.autoJoinAttempt >= AUTO_JOIN_DELAYS_MS.length) {
    showAutoJoinFallback(connectionFailureFirstNotice());
    return;
  }

  const delay = immediate ? 0 : AUTO_JOIN_DELAYS_MS[state.autoJoinAttempt];
  state.joinCode = code;
  state.joinError = "";
  state.connectionLost = false;
  state.message = AUTO_JOINING_NOTICE;
  state.joinPhase = JOIN_PHASES.ROUTE_OPENED;
  updateJoinDebug({ routeCode: code, routeType: "qr-route", source, retryCount: state.autoJoinAttempt, paired: false });
  render();

  state.autoJoinTimer = window.setTimeout(() => {
    state.autoJoinTimer = null;
    void runAutoJoinAttempt(source);
  }, delay);
}

async function runAutoJoinAttempt(source) {
  const code = currentRouteJoinCode() || state.joinCode;
  if (!/^\d{6}$/.test(code)) {
    showAutoJoinFallback("6자리 코드가 필요합니다");
    return;
  }
  if (state.socketConnected && state.paired && state.session?.code === code) {
    return;
  }
  if (state.autoJoinInProgress) {
    return;
  }

  const runId = state.autoJoinRunId + 1;
  const attemptIndex = state.autoJoinAttempt;
  const serverUrl = resolveQrRouteApiBaseUrl();
  state.autoJoinRunId = runId;
  state.autoJoinAttempt += 1;
  state.autoJoinInProgress = true;
  state.autoJoinStartedAt = Date.now();

  try {
    await connectWithCode(code, serverUrl, {
      source: "qr",
      retryCount: attemptIndex,
      requirePaired: true,
      strictServerUrl: true,
      throwOnError: true
    });
  } catch (error) {
    if (runId !== state.autoJoinRunId) {
      return;
    }
    if (state.autoJoinAttempt < AUTO_JOIN_DELAYS_MS.length) {
      state.autoJoinInProgress = false;
      scheduleAutoJoin("retry", { immediate: false });
    } else {
      showAutoJoinFallback(readableConnectionError(error));
    }
  } finally {
    if (runId === state.autoJoinRunId) {
      state.autoJoinInProgress = false;
      state.autoJoinStartedAt = 0;
      render();
    }
  }
}

function showAutoJoinFallback(message) {
  state.autoJoinFinalFailed = true;
  state.connectionLost = true;
  state.joinError = message || "연결 실패";
  state.message = "연결 실패";
  state.lifecycleNotice = "";
  state.joinPhase = JOIN_PHASES.FAILED;
  updateJoinDebug({ lastError: state.joinError, source: "fallback" });
  saveCurrentSession("auto-join-failed");
  render();
}

function updateJoinDebug(patch) {
  state.autoJoinDebug = {
    ...(state.autoJoinDebug || {}),
    ...patch,
    buildId: BUILD_ID,
    appVersion: APP_VERSION,
    buildTime: BUILD_TIME,
    routeCode: patch.routeCode ?? state.joinCode,
    storedCode: patch.storedCode ?? state.autoJoinDebug?.storedCode ?? readStoredConnectionCode(),
    routeType: patch.routeType ?? state.routeType,
    resolvedApiBase: patch.resolvedApiBase ?? state.apiBaseUrl,
    pageshowPersisted: patch.pageshowPersisted ?? state.lastPageShowPersisted,
    autoJoinRetryCount: patch.retryCount ?? state.autoJoinAttempt,
    paired: patch.paired ?? Boolean(state.socketConnected && state.paired),
    updatedAt: new Date().toISOString()
  };
}

async function loadServerInfo() {
  state.blockedReason = "";
  setServerHint("주소를 확인하고 있습니다.");
  try {
    const response = await fetch(`${state.apiBaseUrl}/api/info`);
    const info = await parseJsonResponse(response);
    state.serverInfo = info;
    state.publicServerUrl = choosePublicServerUrl(info);
    state.phoneWebUrl = choosePhoneWebUrl(info);
    els.apiBaseUrlInput.value = state.apiBaseUrl;
    els.publicServerUrlInput.value = state.publicServerUrl;
    setServerHint("연결 준비 완료");
    render();
    return info;
  } catch (error) {
    state.blockedReason = `서버에 연결할 수 없습니다: ${error.message}`;
    setServerHint(state.blockedReason, true);
    render();
    return null;
  }
}

async function createPcSession() {
  if (!state.serverInfo) {
    await loadServerInfo();
  }

  const addressError = addressBlockReason();
  if (addressError) {
    state.blockedReason = addressError;
    state.message = "QR을 만들 수 없습니다.";
    render();
    return;
  }

  try {
    state.message = "연결방을 만들고 있습니다.";
    render();
    const response = await fetch(`${state.apiBaseUrl}/api/sessions`, { method: "POST" });
    const data = await parseJsonResponse(response);
    state.session = data.session;
    state.auth = data.auth || null;
    state.paired = Boolean(data.session?.paired);
    state.socketConnected = false;
    state.connectionLost = false;
    state.lifecycleNotice = "";
    state.outgoing.clear();
    state.incoming.clear();
    state.dismissedReceiveTransferIds.clear();
    saveWebSession();
    await renderQrCode();
    connectSocket("pc");
    state.message = "휴대폰 연결 대기 중";
  } catch (error) {
    state.message = "실패";
    state.blockedReason = `연결방을 만들 수 없습니다: ${error.message}`;
  }
  render();
}

async function connectWithCode(codeValue, serverUrlValue, {
  source = "manual",
  retryCount = 0,
  requirePaired = true,
  strictServerUrl = false,
  throwOnError = false
} = {}) {
  const serverUrl = strictServerUrl ? normalizeBaseUrl(serverUrlValue) : resolveMobileServerUrl(serverUrlValue);
  const code = String(codeValue || "").replace(/\D/g, "").slice(0, 6);

  if (!serverUrl || isBlockedMobileServerUrl(serverUrl)) {
    state.joinError = "휴대폰에서는 localhost로 연결할 수 없습니다.";
    state.message = "연결 실패";
    state.connectionLost = true;
    state.joinPhase = JOIN_PHASES.FAILED;
    updateJoinDebug({ routeCode: code, resolvedApiBase: serverUrl, source, retryCount, lastError: serverUrl ? "LOOPBACK_SERVER_URL" : "NO_ROUTE_SERVER_URL" });
    render();
    if (throwOnError) {
      throw new Error("LOOPBACK_SERVER_URL");
    }
    return;
  }

  if (!/^\d{6}$/.test(code)) {
    state.joinError = "6자리 코드가 필요합니다.";
    state.message = "연결 실패";
    state.connectionLost = true;
    state.joinPhase = JOIN_PHASES.FAILED;
    updateJoinDebug({ routeCode: code, resolvedApiBase: serverUrl, source, retryCount, lastError: "INVALID_CODE" });
    render();
    if (throwOnError) {
      throw new Error("INVALID_CODE");
    }
    return;
  }

  try {
    state.apiBaseUrl = serverUrl;
    state.publicServerUrl = serverUrl;
    state.joinCode = code;
    state.joinUrl = currentRouteJoinCode() ? window.location.href : state.joinUrl;
    state.joinError = "";
    state.connectionLost = false;
    state.autoJoinFinalFailed = false;
    state.message = AUTO_JOINING_NOTICE;
    state.joinPhase = JOIN_PHASES.API_JOIN_STARTED;
    updateJoinDebug({
      routeCode: code,
      resolvedApiBase: serverUrl,
      preflight: "running",
      apiJoin: "idle",
      socketConnected: false,
      socketJoinAck: false,
      paired: false,
      retryCount,
      lastError: "",
      source,
      staleRecoveryUsed: false
    });
    console.info("[Vibe Share connectWithCode]", state.autoJoinDebug);
    render();
    await preflightMobileServer(serverUrl);
    updateJoinDebug({ preflight: "success", apiJoin: "running" });
    const response = await fetch(`${serverUrl}/api/sessions/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, joinSource: source })
    });
    const data = await parseJsonResponse(response);
    if (currentRouteJoinCode() && data.session?.code !== currentRouteJoinCode()) {
      throw new Error("STALE_ROUTE_SESSION_MISMATCH");
    }
    state.session = data.session;
    state.auth = data.auth || null;
    state.paired = false;
    state.connectionLost = false;
    state.lifecycleNotice = "";
    state.incoming.clear();
    state.outgoing.clear();
    state.dismissedReceiveTransferIds.clear();
    state.joinPhase = JOIN_PHASES.API_JOIN_SUCCEEDED;
    updateJoinDebug({ apiJoin: "success", paired: Boolean(data.session?.paired), lastError: "" });
    saveCurrentSession(`connect-${source}`);
    state.joinPhase = JOIN_PHASES.SOCKET_CONNECTING;
    updateJoinDebug({ socketConnected: false, socketJoinAck: false });
    const socketJoined = await connectSocket("mobile", {
      requirePaired,
      timeoutMs: 8000,
      joinSource: source
    });
    if (!socketJoined) {
      throw new Error("SOCKET_JOIN_FAILED");
    }
    state.message = "연결됨";
    state.connectionLost = false;
    state.joinError = "";
    state.autoJoinAttempt = 0;
    state.autoJoinFinalFailed = false;
    state.joinPhase = JOIN_PHASES.PAIRED;
    updateJoinDebug({ socketConnected: true, socketJoinAck: true, paired: true, lastError: "" });
    saveCurrentSession(`connect-${source}-success`);
    render();
    return true;
  } catch (error) {
    state.joinError = readableConnectionError(error);
    state.message = "연결 실패";
    state.connectionLost = true;
    state.lifecycleNotice = RECONNECT_NOTICE;
    state.joinPhase = JOIN_PHASES.FAILED;
    updateJoinDebug({
      preflight: state.autoJoinDebug.preflight === "running" ? "failed" : state.autoJoinDebug.preflight,
      apiJoin: state.autoJoinDebug.apiJoin === "running" ? "failed" : state.autoJoinDebug.apiJoin,
      paired: false,
      lastError: error?.message || "CONNECT_WITH_CODE_FAILED",
      source
    });
    console.info("[Vibe Share connectWithCode]", state.autoJoinDebug);
    saveCurrentSession(`connect-${source}-failed`);
    render();
    if (throwOnError) {
      throw error;
    }
    return false;
  }
}

async function joinMobileSession(serverUrlValue, codeValue) {
  return connectWithCode(codeValue, serverUrlValue, { source: "manual", requirePaired: true });
}

function connectSocket(role, { requirePaired = false, timeoutMs = 8000, joinSource = "manual" } = {}) {
  if (!state.session?.id) {
    return Promise.resolve(false);
  }

  if (state.socket) {
    state.socket.removeAllListeners();
    state.socket.disconnect();
  }
  const socket = io(state.apiBaseUrl, {
    transports: ["websocket", "polling"],
    reconnection: true
  });
  state.socket = socket;

  return new Promise((resolve) => {
    let settled = false;
    const settle = (ok) => {
      if (!settled) {
        settled = true;
        if (pairingTimer) {
          window.clearTimeout(pairingTimer);
        }
        resolve(ok);
      }
    };
    let pairingTimer = null;

    const maybeSettlePaired = (session) => {
      if (!requirePaired) {
        settle(true);
        return;
      }
      if (session?.paired) {
        state.joinPhase = JOIN_PHASES.PAIRED;
        updateJoinDebug({ paired: true, socketJoinAck: true, socketConnected: true });
        settle(true);
      }
    };

    socket.on("connect", () => {
      state.socketConnected = true;
      updateJoinDebug({ socketConnected: true });
      state.message = role === "pc" ? "연결 대기 중" : "연결 대기 중";
      socket.timeout(5000).emit("session:join", { sessionId: state.session.id, role, joinSource, ...deviceAuthPayload() }, (error, reply) => {
        if (error) {
          state.joinError = "연결 응답을 받지 못했습니다.";
          state.message = "연결에 실패했습니다.";
          state.connectionLost = true;
          state.lifecycleNotice = RECONNECT_NOTICE;
          saveCurrentSession();
          render();
          settle(false);
          return;
        }
        if (!reply?.ok) {
          state.joinError = reply?.error || "알 수 없는 오류";
          state.message = "연결에 실패했습니다.";
          state.connectionLost = true;
          state.lifecycleNotice = RECONNECT_NOTICE;
          saveCurrentSession();
          render();
          settle(false);
          return;
        }
        if (!sessionMatchesCurrentRoute(reply.session)) {
          state.joinError = "이전 QR 세션 응답은 무시했습니다.";
          state.message = "연결 실패";
          state.connectionLost = true;
          state.joinPhase = JOIN_PHASES.FAILED;
          updateJoinDebug({ paired: false, lastError: "STALE_ROUTE_SESSION_MISMATCH" });
          saveCurrentSession("stale-route-session");
          render();
          settle(false);
          return;
        }
        state.session = reply.session;
        state.paired = Boolean(reply.session?.paired);
        state.joinError = "";
        state.connectionLost = false;
        state.message = state.paired ? "연결됨" : "연결 대기 중";
        state.joinPhase = JOIN_PHASES.SOCKET_JOIN_ACKNOWLEDGED;
        updateJoinDebug({
          socketConnected: true,
          socketJoinAck: true,
          paired: state.paired,
          lastError: ""
        });
        if (state.recoveryPending) {
          state.lifecycleNotice = state.paired ? RECOVERED_NOTICE : "";
          state.recoveryPending = false;
        }
        saveCurrentSession();
        render();
        if (requirePaired && !state.paired) {
          pairingTimer = window.setTimeout(() => {
            updateJoinDebug({ paired: false, lastError: "PAIRING_TIMEOUT" });
            settle(false);
          }, timeoutMs);
        }
        maybeSettlePaired(reply.session);
      });
      render();
    });

    socket.on("disconnect", () => {
      const wasConnected = state.socketConnected || state.paired;
      state.socketConnected = false;
      state.paired = false;
      state.connectionLost = Boolean(state.session?.id && wasConnected);
      state.message = state.connectionLost ? "연결 끊김" : "연결 대기 중";
      updateJoinDebug({ socketConnected: false, paired: false });
      if (state.connectionLost) {
        state.lifecycleNotice = RECONNECT_NOTICE;
        saveCurrentSession();
      }
      render();
    });

    socket.on("connect_error", (error) => {
      state.socketConnected = false;
      state.joinError = error.message;
      state.connectionLost = true;
      state.message = "연결에 실패했습니다.";
      state.lifecycleNotice = RECONNECT_NOTICE;
      updateJoinDebug({ socketConnected: false, lastError: error.message });
      saveCurrentSession();
      render();
      settle(false);
    });

    socket.on("session:state", ({ session }) => {
      if (!sessionMatchesCurrentRoute(session)) {
        updateJoinDebug({ paired: false, lastError: "STALE_ROUTE_STATE_IGNORED" });
        return;
      }
      state.session = session;
      state.paired = Boolean(session.paired);
      state.joinError = "";
      state.connectionLost = false;
      state.message = state.paired ? "연결됨" : "연결 대기 중";
      if (state.paired) {
        state.joinPhase = JOIN_PHASES.PAIRED;
      }
      updateJoinDebug({ paired: state.paired, socketConnected: true });
      saveCurrentSession();
      render();
      maybeSettlePaired(session);
    });

    socket.on("session:expired", () => {
      state.socketConnected = false;
      state.paired = false;
      state.session = null;
      state.auth = null;
      state.message = "연결 시간이 끝났습니다.";
      state.connectionLost = true;
      state.lifecycleNotice = "연결 시간이 끝났습니다. 다시 연결하세요.";
      state.joinPhase = JOIN_PHASES.FAILED;
      updateJoinDebug({ paired: false, lastError: "SESSION_EXPIRED" });
      saveCurrentSession();
      render();
      settle(false);
    });

    for (const eventName of ["transfer:pending", "transfer:offer", "transfer:accepted", "transfer:rejected", "transfer:download_started", "transfer:completed", "transfer:failed"]) {
      socket.on(eventName, ({ transfer }) => updateTransfer(transfer));
    }
  });
}

function updateTransfer(transfer) {
  const target = transfer.from === state.role ? state.outgoing : state.incoming;
  if (state.role === "mobile" && transfer.from === "pc" && isPendingTransfer(transfer)) {
    state.dismissedReceiveTransferIds.delete(transfer.id);
  }
  upsertTransfer(target, transfer.id, transfer);
  state.pendingTransferSnapshot = transferSnapshot();
  saveCurrentSession();
  render();
}

function selectedFiles(input) {
  return Array.from(input?.files || []).filter(Boolean);
}

async function uploadPcFiles(files) {
  const selected = files.filter(Boolean);
  if (!selected.length) {
    return;
  }
  state.lastDirection = "pc-to-mobile";
  saveCurrentSession();
  setPcSendHint(selected.length === 1 ? `${selected[0].name} 전송을 시작합니다.` : `${selected.length}개 파일 전송을 시작합니다.`);
  await Promise.allSettled(selected.map((file) => uploadFileResumable(file)));
  const failedCount = [...state.outgoing.values()].filter((transfer) =>
    selected.some((file) => transfer.fileName === file.name && transfer.size === file.size) &&
    transfer.status === TRANSFER_STATES.FAILED
  ).length;
  if (failedCount > 0) {
    setPcSendHint(`${failedCount}개 파일 전송에 실패했습니다. 나머지는 계속 진행됩니다.`, true);
  } else {
    setPcSendHint(selected.length === 1 ? "휴대폰에 파일 받기 창이 떴습니다." : "휴대폰에 파일 받기 목록이 떴습니다.");
  }
}

function uploadMobileFiles(files) {
  const selected = files.filter(Boolean);
  if (!selected.length) {
    return;
  }
  state.lastDirection = "mobile-to-pc";
  saveCurrentSession();
  setMobileHint(selected.length === 1 ? `${selected[0].name} 전송을 시작합니다.` : `${selected.length}개 파일 전송을 시작합니다.`);
  for (const file of selected) {
    uploadRelayFile(file);
  }
}

async function renderQrCode() {
  if (state.role !== "pc" || !state.session?.code) {
    return;
  }

  const { url, error } = buildJoinUrl();
  state.joinUrl = url;
  state.blockedReason = error;

  if (!url) {
    els.qrCanvas.hidden = true;
    els.qrPlaceholder.hidden = false;
    els.qrPlaceholder.textContent = error || "QR을 준비할 수 없습니다.";
    render();
    return;
  }

  els.qrPlaceholder.hidden = true;
  els.qrCanvas.hidden = false;
  els.qrCanvas.dataset.joinUrl = url;
  await QRCode.toCanvas(els.qrCanvas, url, {
    width: 460,
    margin: 4,
    errorCorrectionLevel: "M",
    color: { dark: "#111827", light: "#ffffff" }
  });
  saveCurrentSession();
  render();
}

function buildJoinUrl() {
  if (isPublicWebRuntime()) {
    if (!state.session?.code) {
      return { url: "", error: "연결방을 준비하고 있습니다." };
    }
    const url = new URL(window.location.origin);
    url.pathname = `/j/${state.session.code}`;
    url.search = "";
    url.searchParams.set("v", BUILD_ID);
    url.hash = "";
    return { url: url.toString(), error: "" };
  }

  const webBaseUrl = resolveMobileWebBaseUrl({
    currentUrl: window.location.href,
    requestBaseUrl: state.serverInfo?.requestBaseUrl,
    publicUrl: state.serverInfo?.publicUrls?.webApp,
    candidateUrls: [
      state.phoneWebUrl,
      state.serverInfo?.mobileWebUrl,
      state.serverInfo?.primaryLanWebUrl,
      ...(state.serverInfo?.lanWebUrls || [])
    ],
    webPort: Number(window.location.port || 5173)
  });
  const addressError = addressBlockReason();

  if (!state.session?.code) {
    return { url: "", error: "연결방을 준비하고 있습니다." };
  }
  if (addressError) {
    return { url: "", error: addressError };
  }

  const url = new URL(webBaseUrl);
  url.pathname = `/j/${state.session.code}`;
  url.search = "";
  url.searchParams.set("v", BUILD_ID);
  url.hash = "";

  if (isMobileFacingUrlBlocked(url.toString())) {
    return { url: "", error: "localhost 주소는 QR에 넣을 수 없습니다." };
  }

  return { url: url.toString(), error: "" };
}

function isQrBlocked() {
  const error = addressBlockReason();
  state.blockedReason = error;
  return Boolean(error);
}

function addressBlockReason() {
  if (isPublicWebRuntime()) {
    const webBaseUrl = publicWebBaseUrlFromLocation();
    const serverBaseUrl = publicApiBaseUrlFromLocation() || state.publicServerUrl || state.apiBaseUrl;
    if (!webBaseUrl || isProductionBlockedUrl(webBaseUrl)) {
      return "공개 웹앱 주소를 확인할 수 없습니다.";
    }
    if (!serverBaseUrl || isProductionBlockedUrl(serverBaseUrl)) {
      return "공개 API 주소를 확인할 수 없습니다.";
    }
    return "";
  }

  const webBaseUrl = resolveMobileWebBaseUrl({
    currentUrl: window.location.href,
    requestBaseUrl: state.serverInfo?.requestBaseUrl,
    publicUrl: state.serverInfo?.publicUrls?.webApp,
    candidateUrls: [
      state.phoneWebUrl,
      state.serverInfo?.mobileWebUrl,
      state.serverInfo?.primaryLanWebUrl,
      ...(state.serverInfo?.lanWebUrls || [])
    ],
    webPort: Number(window.location.port || 5173)
  });
  const serverBaseUrl = resolveMobileServerBaseUrl({
    currentUrl: window.location.href,
    requestBaseUrl: state.serverInfo?.requestBaseUrl,
    publicUrl: state.serverInfo?.publicUrls?.api,
    candidateUrls: [
      state.publicServerUrl,
      state.serverInfo?.mobileServerUrl,
      state.serverInfo?.downloadBaseUrl,
      state.serverInfo?.primaryLanServerUrl,
      ...(state.serverInfo?.lanBaseUrls || [])
    ],
    apiPort: Number(state.serverInfo?.port || 4000)
  });
  if (!webBaseUrl || isMobileFacingUrlBlocked(webBaseUrl)) {
    return "휴대폰에서 열 수 있는 PC 웹 주소를 찾지 못했습니다.";
  }
  if (!serverBaseUrl || isMobileFacingUrlBlocked(serverBaseUrl)) {
    return "휴대폰에서 열 수 있는 서버 주소를 찾지 못했습니다.";
  }
  return "";
}

function choosePublicServerUrl(info) {
  if (isPublicWebRuntime()) {
    return publicApiBaseUrlFromLocation() || normalizeBaseUrl(info?.publicUrls?.api) || defaultApiBaseUrl();
  }

  return resolveMobileServerBaseUrl({
    currentUrl: window.location.href,
    requestBaseUrl: info?.requestBaseUrl,
    publicUrl: info?.publicUrls?.api,
    candidateUrls: [
      info?.mobileServerUrl,
      info?.downloadBaseUrl,
      info?.primaryLanServerUrl,
      ...(info?.lanBaseUrls || []),
      state.publicServerUrl,
      state.apiBaseUrl
    ],
    apiPort: Number(info?.port || 4000)
  });
}

function choosePhoneWebUrl(info) {
  if (isPublicWebRuntime()) {
    return publicWebBaseUrlFromLocation() || normalizeBaseUrl(info?.publicUrls?.webApp) || "";
  }

  return resolveMobileWebBaseUrl({
    currentUrl: window.location.href,
    requestBaseUrl: info?.requestBaseUrl,
    publicUrl: info?.publicUrls?.webApp,
    candidateUrls: [
      info?.mobileWebUrl,
      info?.primaryLanWebUrl,
      ...(info?.lanWebUrls || []),
      state.phoneWebUrl
    ],
    webPort: Number(window.location.port || 5173)
  });
}

async function uploadFileResumable(file) {
  if (!state.session?.id || !state.paired) {
    setPcSendHint("먼저 휴대폰을 연결하세요.", true);
    return;
  }

  const localId = createLocalTransferId("pc");
  const fileKey = selectedFileKey(file);
  state.activeUploadFileKey = fileKey;
  upsertTransfer(state.outgoing, localId, {
    id: localId,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    from: "pc",
    to: "mobile",
    status: TRANSFER_STATES.UPLOADING,
    progress: 0
  });
  setPcSendHint(`${file.name} 업로드 중`);
  render();

  try {
    let manifest = await findUploadManifestForFile(state.session.id, file);
    let upload;
    let parts = [];
    let uploadedBytes = 0;

    if (manifest && window.confirm(`${file.name}의 중단된 업로드가 있습니다. 이어서 보낼까요?`)) {
      const statusResponse = await fetch(`${manifest.apiBaseUrl || state.apiBaseUrl}/api/uploads/${manifest.uploadId}/status?sessionId=${encodeURIComponent(state.session.id)}`, {
        headers: deviceAuthHeaders()
      });
      const statusPayload = await parseJsonResponse(statusResponse);
      upload = statusPayload.upload;
      parts = upload.uploadedParts || manifest.parts || [];
      uploadedBytes = parts.reduce((sum, part) => sum + (part.size || 0), 0);
      setPcSendHint(`${file.name} 이어서 업로드 중`);
    } else {
      const initResponse = await fetch(`${state.apiBaseUrl}/api/uploads/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...deviceAuthHeaders() },
        body: JSON.stringify({
          sessionId: state.session.id,
          sender: "pc",
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size
        })
      });
      const initPayload = await parseJsonResponse(initResponse);
      upload = initPayload.upload;
      parts = [];
      manifest = createUploadManifest({ upload, file, localId });
    }

    await saveUploadManifest({ ...manifest, uploadId: upload.id, parts });
    await refreshUploadManifests();
    const completedPartNumbers = new Set(parts.map((part) => part.partNumber));

    for (let offset = 0, partNumber = 1; offset < file.size; offset += upload.partSize, partNumber += 1) {
      const chunk = file.slice(offset, Math.min(offset + upload.partSize, file.size));
      if (completedPartNumbers.has(partNumber)) {
        upsertTransfer(state.outgoing, localId, {
          progress: Math.round((uploadedBytes / file.size) * 100)
        });
        render();
        continue;
      }

      const targetResponse = await fetch(`${state.apiBaseUrl}/api/uploads/${upload.id}/parts/${partNumber}/url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...deviceAuthHeaders() },
        body: JSON.stringify({ sessionId: state.session.id })
      });
      const { target } = await parseJsonResponse(targetResponse);
      const checksum = await sha256Hex(chunk);
      const partResponse = await fetch(target.url, {
        method: target.method,
        headers: {
          ...target.headers,
          "Content-Type": "application/octet-stream",
          "x-checksum-sha256": checksum
        },
        body: chunk
      });

      let part;
      if (target.directToStorage) {
        if (!partResponse.ok) {
          throw new Error(`part ${partNumber}: HTTP ${partResponse.status}`);
        }
        const etag = partResponse.headers.get("etag")?.replaceAll('"', "") || "";
        if (!etag) {
          throw new Error("R2_UPLOAD_ETAG_NOT_EXPOSED");
        }
        part = {
          partNumber,
          etag,
          checksum,
          size: chunk.size
        };
        const partCompleteResponse = await fetch(`${state.apiBaseUrl}/api/uploads/${upload.id}/parts/${partNumber}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...deviceAuthHeaders() },
          body: JSON.stringify({ sessionId: state.session.id, ...part })
        });
        await parseJsonResponse(partCompleteResponse);
      } else {
        const partPayload = await parseJsonResponse(partResponse);
        part = partPayload.part;
      }

      parts.push(part);
      completedPartNumbers.add(partNumber);
      uploadedBytes += chunk.size;
      await saveUploadManifest({ ...manifest, uploadId: upload.id, parts });
      await refreshUploadManifests();
      upsertTransfer(state.outgoing, localId, {
        progress: Math.round((uploadedBytes / file.size) * 100)
      });
      render();
    }

    const completeResponse = await fetch(`${state.apiBaseUrl}/api/uploads/${upload.id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...deviceAuthHeaders() },
      body: JSON.stringify({ sessionId: state.session.id, parts })
    });
    const completePayload = await parseJsonResponse(completeResponse);
    await deleteUploadManifest(upload.id);
    await refreshUploadManifests();
    state.outgoing.delete(localId);
    upsertTransfer(state.outgoing, completePayload.transfer.id, {
      ...completePayload.transfer,
      progress: 100
    });
    setPcSendHint("휴대폰에 파일 받기 목록이 떴습니다.");
  } catch (error) {
    upsertTransfer(state.outgoing, localId, {
      status: TRANSFER_STATES.FAILED,
      failureReason: error.message
    });
    setPcSendHint(error.message, true);
  } finally {
    if (state.activeUploadFileKey === fileKey) {
      state.activeUploadFileKey = null;
    }
    render();
  }
}

function uploadRelayFile(file) {
  if (!state.session?.id || !state.paired) {
    setMobileHint("먼저 PC와 연결하세요.", true);
    return;
  }

  const localId = createLocalTransferId("mobile");
  upsertTransfer(state.outgoing, localId, {
    id: localId,
    fileName: file.name || "vibe-share-file",
    mimeType: file.type || "application/octet-stream",
    size: file.size || 0,
    from: "mobile",
    to: "pc",
    status: TRANSFER_STATES.UPLOADING,
    progress: 0
  });
  setMobileHint(`${file.name} 업로드 중`);
  render();

  const form = new FormData();
  form.append("sessionId", state.session.id);
  form.append("sender", "mobile");
  form.append("file", file, file.name || "vibe-share-file");

  const xhr = new XMLHttpRequest();
  xhr.open("POST", `${state.apiBaseUrl}/api/transfers`);
  for (const [name, value] of Object.entries(deviceAuthHeaders())) {
    xhr.setRequestHeader(name, value);
  }
  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      upsertTransfer(state.outgoing, localId, {
        progress: Math.round((event.loaded / event.total) * 100)
      });
      render();
    }
  };
  xhr.onload = () => {
    try {
      const data = JSON.parse(xhr.responseText || "{}");
      if (xhr.status < 200 || xhr.status >= 300) {
        throw new Error(data.error || `HTTP ${xhr.status}`);
      }
      state.outgoing.delete(localId);
      upsertTransfer(state.outgoing, data.transfer.id, { ...data.transfer, progress: 100 });
      setMobileHint("PC의 수락을 기다리고 있습니다.");
    } catch (error) {
      upsertTransfer(state.outgoing, localId, { status: TRANSFER_STATES.FAILED, failureReason: error.message });
      setMobileHint(error.message, true);
    }
    render();
  };
  xhr.onerror = () => {
    upsertTransfer(state.outgoing, localId, { status: TRANSFER_STATES.FAILED, failureReason: "network_error" });
    setMobileHint("업로드 실패");
    render();
  };
  xhr.send(form);
}

function handleTransferActionClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const { transferId, action } = button.dataset;
  if (action === "accept") {
    void respondToTransfer(transferId, "accept");
  }
  if (action === "reject") {
    void respondToTransfer(transferId, "reject");
  }
  if (action === "cancelReceive") {
    void cancelReceiveTransfer(transferId);
  }
  if (action === "download") {
    void acceptAndDownloadTransfer(transferId);
  }
}

async function cancelReceiveTransfer(transferId) {
  const transfer = state.incoming.get(transferId);
  if (!transfer) {
    return;
  }
  state.dismissedReceiveTransferIds.add(transferId);
  if (isPendingTransfer(transfer)) {
    await respondToTransfer(transferId, "reject");
    return;
  }
  render();
}

function respondToTransfer(transferId, decision) {
  return new Promise((resolve) => {
    if (!state.socket) {
      const reply = { ok: false, error: "연결 실패" };
      upsertTransfer(state.incoming, transferId, {
        status: TRANSFER_STATES.FAILED,
        failureReason: reply.error
      });
      render();
      resolve(reply);
      return;
    }

    state.socket.emit("transfer:respond", {
      sessionId: state.session?.id,
      transferId,
      decision
    }, (reply) => {
      if (!reply?.ok) {
        upsertTransfer(state.incoming, transferId, {
          status: TRANSFER_STATES.FAILED,
          failureReason: reply?.error || "request failed"
        });
        render();
        resolve(reply || { ok: false });
        return;
      }
      if (decision === "reject") {
        state.dismissedReceiveTransferIds.add(transferId);
      }
      upsertTransfer(state.incoming, transferId, reply.transfer);
      render();
      resolve(reply);
    });
  });
}

async function acceptAndDownloadTransfer(transferId) {
  const transfer = state.incoming.get(transferId);
  if (!transfer) {
    return;
  }
  if (isPendingTransfer(transfer)) {
    const reply = await respondToTransfer(transferId, "accept");
    if (!reply?.ok) {
      return;
    }
  }
  await downloadTransfer(transferId);
}

async function downloadTransfer(transferId) {
  const transfer = state.incoming.get(transferId);
  if (!transfer || !state.session?.id) {
    return;
  }

  upsertTransfer(state.incoming, transferId, {
    status: TRANSFER_STATES.DOWNLOADING,
    progress: 0,
    failureReason: null,
    downloadRetryable: false
  });
  render();

  try {
    if (state.role === "mobile" && isMobileFacingUrlBlocked(state.apiBaseUrl)) {
      state.apiBaseUrl = preferredMobileApiBaseUrl();
      state.publicServerUrl = state.apiBaseUrl;
    }
    if (state.role === "mobile" && isMobileFacingUrlBlocked(state.apiBaseUrl)) {
      throw new Error("LOOPBACK_DOWNLOAD_URL");
    }

    const targetResponse = await fetch(`${state.apiBaseUrl}/api/transfers/${transferId}/download-url?sessionId=${encodeURIComponent(state.session.id)}`, {
      headers: deviceAuthHeaders()
    });
    const { target } = await parseJsonResponse(targetResponse);
    const downloadUrl = authenticatedDownloadUrl(target.url, target.directFromStorage);
    startSamePageDownload(downloadUrl, transfer.fileName || "vibe-share-file");

    upsertTransfer(state.incoming, transferId, {
      status: TRANSFER_STATES.DOWNLOAD_STARTED,
      progress: 100,
      failureReason: null,
      downloadRetryable: false,
      downloadStartedAt: Date.now()
    });
    if (state.role === "mobile") {
      state.dismissedReceiveTransferIds.add(transferId);
      setMobileHint("다운로드를 시작했습니다. Safari 다운로드 또는 Files 앱 Downloads 폴더를 확인하세요.");
    }
    state.socket?.emit("transfer:download_started", { sessionId: state.session.id, transferId }, (reply) => {
      if (reply?.ok) {
        upsertTransfer(state.incoming, transferId, {
          ...reply.transfer,
          progress: 100,
          downloadRetryable: false
        });
        render();
      }
    });
  } catch (error) {
    upsertTransfer(state.incoming, transferId, {
      status: TRANSFER_STATES.FAILED,
      failureReason: readableDownloadError(error),
      downloadRetryable: true
    });
    if (state.role === "mobile") {
      state.dismissedReceiveTransferIds.delete(transferId);
      setMobileHint("다운로드 실패. 다시 시도할 수 있습니다.", true);
    }
  }
  render();
}

function authenticatedDownloadUrl(rawUrl, directFromStorage) {
  if (state.role === "mobile" && directFromStorage && isMobileFacingUrlBlocked(rawUrl)) {
    throw new Error("LOOPBACK_DOWNLOAD_URL");
  }

  const fallbackBaseUrl = state.role === "mobile" ? preferredMobileApiBaseUrl() : state.apiBaseUrl;
  const safeUrl = state.role === "mobile"
    ? sanitizeMobileFacingUrl(rawUrl, { fallbackBaseUrl, forceBaseUrl: !directFromStorage })
    : new URL(rawUrl, state.apiBaseUrl).toString();

  if (!safeUrl || (state.role === "mobile" && isMobileFacingUrlBlocked(safeUrl))) {
    throw new Error("LOOPBACK_DOWNLOAD_URL");
  }

  const url = new URL(safeUrl, fallbackBaseUrl || state.apiBaseUrl);
  if (!directFromStorage && state.auth?.deviceId && state.auth?.deviceTrustToken) {
    url.searchParams.set("deviceId", state.auth.deviceId);
    url.searchParams.set("deviceToken", state.auth.deviceTrustToken);
  }
  return url.toString();
}

function startSamePageDownload(url, fileName) {
  if (state.role === "mobile" && isMobileFacingUrlBlocked(url)) {
    throw new Error("LOOPBACK_DOWNLOAD_URL");
  }

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

function readableDownloadError(error) {
  if (error?.message === "LOOPBACK_DOWNLOAD_URL") {
    return "다운로드 실패";
  }
  if (/403|Device trust/i.test(error.message || "")) {
    return "저장 권한을 확인하지 못했습니다. 다시 연결해 보세요.";
  }
  if (/404|not found/i.test(error.message || "")) {
    return "파일을 찾을 수 없습니다. 다시 보내 주세요.";
  }
  if (/409|accept/i.test(error.message || "")) {
    return "먼저 수락이 필요합니다.";
  }
  return "저장하지 못했습니다. 다시 시도해 주세요.";
}

function isPendingTransfer(transfer) {
  return transfer?.status === TRANSFER_STATES.PENDING_ACCEPT || transfer?.status === "pending";
}

function activeReceiveModalTransfers() {
  if (state.role !== "mobile" || !(state.socketConnected && state.paired)) {
    return [];
  }
  return [...state.incoming.values()]
    .filter((transfer) => transfer.from === "pc")
    .filter((transfer) => !state.dismissedReceiveTransferIds.has(transfer.id))
    .filter((transfer) =>
      isPendingTransfer(transfer) ||
      transfer.status === TRANSFER_STATES.ACCEPTED ||
      transfer.status === TRANSFER_STATES.DOWNLOADING ||
      (transfer.status === TRANSFER_STATES.FAILED && transfer.downloadRetryable)
    )
    .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0));
}

function renderReceiveModal() {
  if (!els.receiveModal) {
    return;
  }
  const transfers = activeReceiveModalTransfers();
  els.receiveModal.hidden = transfers.length === 0;
  if (!transfers.length) {
    els.receiveModalList.innerHTML = "";
    return;
  }

  els.receiveModalList.innerHTML = transfers.map((transfer) => {
    const isDownloading = transfer.status === TRANSFER_STATES.DOWNLOADING;
    const isRetry = transfer.status === TRANSFER_STATES.FAILED && transfer.downloadRetryable;
    return `
      <article class="receive-file-item">
        <div>
          <strong class="receive-file-name">${escapeHtml(transfer.fileName || "vibe-share-file")}</strong>
          <span class="receive-file-size">${escapeHtml(formatBytes(transfer.size || 0, "ko"))}</span>
          ${isRetry ? `<p class="helper error receive-error">다운로드 실패</p>` : ""}
        </div>
        <div class="receive-actions">
          <button type="button" data-action="download" data-transfer-id="${escapeHtml(transfer.id)}" ${isDownloading ? "disabled" : ""}>${isRetry ? "다시 시도" : "다운로드"}</button>
          <button type="button" class="secondary" data-action="cancelReceive" data-transfer-id="${escapeHtml(transfer.id)}" ${isDownloading ? "disabled" : ""}>취소</button>
        </div>
      </article>
    `;
  }).join("");
}

function render() {
  if (runtimeErrorHandled) {
    return;
  }
  try {
    if (state.role === "mobile") {
      renderMobile();
    } else {
      renderPc();
    }
  } catch (error) {
    handleRuntimeError(error, { phase: "render" });
  }
}

function buildIdentityText() {
  return `Vibe Share ${APP_VERSION} · build ${BUILD_ID}${BUILD_TIME ? ` · ${BUILD_TIME}` : ""}`;
}

function joinDebugSnapshot() {
  return {
    buildId: BUILD_ID,
    appVersion: APP_VERSION,
    buildTime: BUILD_TIME,
    currentQrCode: currentRouteJoinCode(),
    storedCode: readStoredConnectionCode(),
    routeType: state.routeType,
    resolvedApiBase: state.apiBaseUrl,
    pageshowPersisted: state.lastPageShowPersisted,
    autoJoinRetryCount: state.autoJoinAttempt,
    paired: Boolean(state.socketConnected && state.paired),
    joinPhase: state.joinPhase,
    socketConnected: state.socketConnected,
    sessionCode: state.session?.code || "",
    lifecycleEvent: state.lastLifecycleEvent,
    ...(state.autoJoinDebug || {})
  };
}

function renderPc() {
  const connected = state.socketConnected && state.paired;
  els.pcStatus.textContent = pcConnectionLabel();
  els.pcStatus.classList.toggle("ok", connected);
  els.pcStatus.classList.toggle("warn", !state.connectionLost && state.socketConnected && !state.paired);
  els.pcStatus.classList.toggle("danger", state.connectionLost);
  els.manualCode.textContent = state.session?.code || "------";
  els.expiryText.textContent = state.session?.expiresAt ? `유효 시간: ${formatTime(state.session.expiresAt)}` : "";
  els.actionsCard.hidden = !connected;
  els.sendPcToPhoneButton.disabled = !connected;
  els.phoneToPcHintButton.disabled = !connected;
  els.qrHelp.textContent = connected
    ? "연결되었습니다. 이제 보낼 방향을 선택하세요."
    : "휴대폰 카메라로 QR을 스캔하세요.";

  if (!state.session?.id || state.blockedReason) {
    els.qrCanvas.hidden = true;
    els.qrPlaceholder.hidden = false;
    els.qrPlaceholder.textContent = state.blockedReason || "QR을 준비하고 있습니다.";
  }

  const blocked = Boolean(state.blockedReason);
  els.localhostBanner.hidden = !blocked;
  els.localhostWarningText.textContent = state.blockedReason || "";
  els.refreshSessionButton.disabled = blocked && isLocalhostUrl(state.publicServerUrl);
  els.phoneWebUrlValue.textContent = state.phoneWebUrl || "-";
  els.publicServerUrlValue.textContent = state.publicServerUrl || "-";
  els.joinUrlValue.textContent = state.joinUrl || "-";
  if (els.pcBuildInfo) {
    els.pcBuildInfo.textContent = buildIdentityText();
  }
  els.apiBaseUrlInput.classList.toggle("input-warn", isLocalhostUrl(state.apiBaseUrl));
  els.publicServerUrlInput.classList.toggle("input-warn", isLocalhostUrl(state.publicServerUrl));

  renderLifecycleNotice();
  renderTransferList(els.outgoingList, [...state.outgoing.values()], "outgoing");
  renderTransferList(els.incomingList, [...state.incoming.values()], "incoming");
  renderResumeList();
}

function renderMobile() {
  const connected = state.socketConnected && state.paired;
  const autoJoining = isAutoJoinActive();
  const failed = Boolean((state.joinError || state.connectionLost) && !autoJoining);
  els.mobileStatus.textContent = connected ? "연결됨" : (autoJoining ? AUTO_JOINING_NOTICE : mobileConnectionLabel());
  els.mobileStatus.classList.toggle("ok", connected);
  els.mobileStatus.classList.toggle("warn", !connected && !failed);
  els.mobileStatus.classList.toggle("danger", failed);
  els.mobileTitle.textContent = connected ? "연결됨" : (autoJoining ? AUTO_JOINING_NOTICE : (failed ? "연결 실패" : "연결 대기 중"));
  els.mobileMessage.textContent = connected
    ? "PC와 연결되었습니다. 이제 보낼지 받을지 선택하세요."
    : (autoJoining ? "QR로 PC에 연결하고 있습니다." : state.message);
  els.mobileActionsCard.hidden = !connected;
  els.mobileSendButton.disabled = !connected;
  els.mobileReceiveButton.disabled = !connected;
  els.mobileServerUrlInput.value = state.apiBaseUrl;
  els.mobileCodeInput.value = state.joinCode;
  els.mobileRetryArea.hidden = !failed;
  els.mobileErrorText.textContent = failed ? (state.joinError || "연결이 끊겼습니다. 다시 연결하세요.") : "";
  els.mobileCodeBadge.textContent = state.joinCode || "------";
  if (els.mobileCodeFallback) {
    els.mobileCodeFallback.hidden = Boolean(currentRouteJoinCode()) && !state.autoJoinFinalFailed;
  }
  if (els.mobileJoinDebug && els.mobileJoinDebugText) {
    els.mobileJoinDebug.hidden = !(state.autoJoinFinalFailed || query.get("debug") === "1");
    els.mobileJoinDebugText.textContent = JSON.stringify(joinDebugSnapshot(), null, 2);
  }
  if (els.mobileBuildInfo) {
    els.mobileBuildInfo.textContent = buildIdentityText();
  }

  renderLifecycleNotice();
  renderReceiveModal();
  renderTransferList(els.mobileIncomingList, [...state.incoming.values()], "incoming");
  renderTransferList(els.mobileOutgoingList, [...state.outgoing.values()], "outgoing");
}

function renderLifecycleNotice() {
  const activeTransfer = hasActiveTransfer();
  const disconnected = state.connectionLost || Boolean(state.session?.id && !state.socketConnected && state.paired);
  const message = activeTransfer
    ? ACTIVE_TRANSFER_NOTICE
    : (state.lifecycleNotice || PAGE_STAY_NOTICE);
  const isStrong = activeTransfer || state.wasHiddenDuringTransfer || disconnected;
  const showReconnect = disconnected || state.lifecycleNotice === RECONNECT_NOTICE || state.recovering;

  const notice = state.role === "mobile" ? els.mobileLifecycleNotice : els.pcLifecycleNotice;
  const text = state.role === "mobile" ? els.mobileLifecycleText : els.pcLifecycleText;
  const button = state.role === "mobile" ? els.mobileReconnectButton : els.pcReconnectButton;
  if (!notice || !text || !button) {
    return;
  }

  text.textContent = message;
  notice.classList.toggle("strong-warning", isStrong);
  button.hidden = !showReconnect;
  button.disabled = state.recovering;
}

function isAutoJoinActive() {
  return Boolean(
    state.role === "mobile" &&
    currentRouteJoinCode() &&
    !state.autoJoinFinalFailed &&
    !(state.socketConnected && state.paired) &&
    (state.autoJoinInProgress || state.autoJoinTimer || state.autoJoinAttempt < AUTO_JOIN_DELAYS_MS.length)
  );
}

function isAutoJoinStale() {
  return Boolean(state.autoJoinInProgress && state.autoJoinStartedAt && Date.now() - state.autoJoinStartedAt > AUTO_JOIN_STALE_MS);
}

function renderTransferList(container, transfers, type) {
  if (!transfers.length) {
    container.innerHTML = `<p class="empty">${type === "incoming" ? "아직 받은 파일이 없습니다." : "아직 보낸 파일이 없습니다."}</p>`;
    return;
  }

  container.innerHTML = transfers
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
    .map((transfer) => {
      const progress = Number.isFinite(transfer.progress) ? transfer.progress : statusProgress(transfer.status);
      return `
        <article class="transfer-item">
          <div>
            <h3>${escapeHtml(transfer.fileName || "vibe-share-file")}</h3>
            <p>${escapeHtml(formatBytes(transfer.size || 0, "ko"))}</p>
            <strong>${escapeHtml(statusLabel(transfer))}</strong>
            ${transfer.failureReason ? `<p class="failure-text">${escapeHtml(transfer.failureReason)}</p>` : ""}
          </div>
          <progress max="100" value="${Math.max(0, Math.min(100, progress))}"></progress>
          ${renderTransferActions(transfer, type)}
        </article>
      `;
    })
    .join("");
}

function renderTransferActions(transfer, type) {
  if (type !== "incoming") {
    return "";
  }
  if (state.role === "mobile") {
    if (isPendingTransfer(transfer) || transfer.status === TRANSFER_STATES.ACCEPTED) {
      return `<div class="transfer-actions">
        <button type="button" data-action="download" data-transfer-id="${escapeHtml(transfer.id)}">다운로드</button>
        <button type="button" class="secondary" data-action="cancelReceive" data-transfer-id="${escapeHtml(transfer.id)}">취소</button>
      </div>`;
    }
    if (transfer.status === TRANSFER_STATES.FAILED && transfer.downloadRetryable) {
      return `<div class="transfer-actions">
        <button type="button" data-action="download" data-transfer-id="${escapeHtml(transfer.id)}">다시 시도</button>
        <button type="button" class="secondary" data-action="cancelReceive" data-transfer-id="${escapeHtml(transfer.id)}">닫기</button>
      </div>`;
    }
    return "";
  }
  if (transfer.status === TRANSFER_STATES.PENDING_ACCEPT || transfer.status === "pending") {
    return `<div class="transfer-actions">
      <button type="button" data-action="accept" data-transfer-id="${escapeHtml(transfer.id)}">수락</button>
      <button type="button" class="secondary" data-action="reject" data-transfer-id="${escapeHtml(transfer.id)}">거절</button>
    </div>`;
  }
  if (transfer.status === TRANSFER_STATES.ACCEPTED) {
    return `<div class="transfer-actions">
      <button type="button" data-action="download" data-transfer-id="${escapeHtml(transfer.id)}">${state.role === "pc" ? "PC에 다운로드" : "저장/열기"}</button>
    </div>`;
  }
  if (transfer.status === TRANSFER_STATES.FAILED && transfer.downloadRetryable) {
    return `<div class="transfer-actions">
      <button type="button" data-action="download" data-transfer-id="${escapeHtml(transfer.id)}">다시 시도</button>
    </div>`;
  }
  return "";
}

function renderResumeList() {
  if (state.role !== "pc" || !state.uploadManifests.length) {
    if (els.resumeList) {
      els.resumeList.innerHTML = "";
    }
    return;
  }
  els.resumeList.innerHTML = `
    <p class="helper">중단된 PC 업로드가 있습니다. 같은 파일을 다시 선택하면 이어서 보낼 수 있습니다.</p>
    ${state.uploadManifests.map((manifest) => `
      <article class="transfer-item">
        <div>
          <h3>${escapeHtml(manifest.fileName)}</h3>
          <p>${escapeHtml(formatBytes(manifest.size || 0, "ko"))}</p>
          <strong>이어서 보낼 수 있음</strong>
        </div>
        <button type="button" class="secondary" data-upload-id="${escapeHtml(manifest.uploadId)}">기록 지우기</button>
      </article>
    `).join("")}
  `;
}

function pcConnectionLabel() {
  if (!state.session?.id) {
    return state.message || "연결 준비 중";
  }
  if (state.connectionLost) {
    return "연결 끊김";
  }
  if (!state.socketConnected) {
    return "연결 대기 중";
  }
  if (state.paired) {
    return "연결됨";
  }
  return "연결 대기 중";
}

function resolveMobileServerUrl(inputValue) {
  const typed = normalizeBaseUrl(inputValue);
  if (typed) {
    return typed;
  }
  return preferredMobileApiBaseUrl();
}

function preferredMobileApiBaseUrl() {
  if (isPublicWebRuntime()) {
    return publicApiBaseUrlFromLocation() || defaultApiBaseUrl();
  }

  return resolveMobileServerBaseUrl({
    currentUrl: window.location.href,
    requestBaseUrl: state.serverInfo?.requestBaseUrl,
    publicUrl: state.serverInfo?.publicUrls?.api,
    candidateUrls: [
      state.apiBaseUrl,
      state.publicServerUrl,
      state.serverInfo?.mobileServerUrl,
      state.serverInfo?.downloadBaseUrl,
      state.serverInfo?.primaryLanServerUrl,
      ...(state.serverInfo?.lanBaseUrls || [])
    ],
    apiPort: Number(state.serverInfo?.port || 4000)
  });
}

function resolveMobileServerBaseUrlFromLocation() {
  if (isPublicWebRuntime()) {
    return publicApiBaseUrlFromLocation();
  }

  return resolveMobileServerBaseUrl({
    currentUrl: window.location.href,
    apiPort: 4000
  });
}

async function preflightMobileServer(serverUrl) {
  if (!serverUrl) {
    throw new Error("PC_SERVER_UNREACHABLE");
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${serverUrl}/health`, {
      cache: "no-store",
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch {
    throw new Error("PC_SERVER_UNREACHABLE");
  } finally {
    window.clearTimeout(timeout);
  }
}

function readableConnectionError(error) {
  if (error?.message === "PC_SERVER_UNREACHABLE") {
    return isPublicWebRuntime()
      ? `${connectionFailureFirstNotice()} API에 연결할 수 없습니다.`
      : `${connectionFailureFirstNotice()} PC 서버에 연결할 수 없습니다.`;
  }
  if (error?.message === "STALE_ROUTE_SESSION_MISMATCH") {
    return "이전 QR 연결 정보가 감지되어 새 QR로 다시 연결합니다.";
  }
  return error?.message || "연결 실패";
}

function clearAllVibeShareStorage(_reason = "") {
  for (const storage of [window.sessionStorage, window.localStorage]) {
    try {
      for (let index = storage.length - 1; index >= 0; index -= 1) {
        const key = storage.key(index);
        if (key?.toLowerCase().includes("vibe-share")) {
          storage.removeItem(key);
        }
      }
    } catch {
      // Ignore storage failures in private mode.
    }
  }
}

function hardResetQrRouteStorage(_reason = "") {
  for (const storage of [window.sessionStorage, window.localStorage]) {
    try {
      storage.removeItem(MOBILE_SESSION_STORAGE_KEY);
      storage.removeItem(WEB_SESSION_STORAGE_KEY);
      storage.removeItem(RECENT_SESSION_STORAGE_KEY);
      clearStaleStorageItems(storage);
    } catch {
      // Ignore storage failures in private mode.
    }
  }
}

function clearStaleMobileConnectionStorage() {
  for (const storage of [window.sessionStorage, window.localStorage]) {
    clearStaleStorageItems(storage);
  }
}

function ensureStorageMatchesCurrentBuild() {
  for (const [storage, keys] of [
    [window.sessionStorage, [WEB_SESSION_STORAGE_KEY, MOBILE_SESSION_STORAGE_KEY]],
    [window.localStorage, [RECENT_SESSION_STORAGE_KEY]]
  ]) {
    for (const key of keys) {
      try {
        const raw = storage.getItem(key);
        if (!raw) {
          continue;
        }
        const record = JSON.parse(raw);
        if (!isCurrentBuildStorageRecord(record)) {
          storage.removeItem(key);
        }
      } catch {
        storage.removeItem(key);
      }
    }
  }
}

function isCurrentBuildStorageRecord(record) {
  return (
    record?.storageSchemaVersion === STORAGE_SCHEMA_VERSION &&
    record?.storageBuildVersion === STORAGE_BUILD_VERSION &&
    record?.buildId === BUILD_ID
  );
}

function readStoredConnectionCode() {
  for (const [storage, keys] of [
    [window.sessionStorage, [MOBILE_SESSION_STORAGE_KEY, WEB_SESSION_STORAGE_KEY]],
    [window.localStorage, [RECENT_SESSION_STORAGE_KEY]]
  ]) {
    for (const key of keys) {
      try {
        const saved = JSON.parse(storage.getItem(key) || "null");
        const code = saved?.joinCode || saved?.session?.code || saved?.code || "";
        if (/^\d{6}$/.test(code)) {
          return code;
        }
      } catch {
        // Ignore unreadable storage records.
      }
    }
  }
  return "";
}

function clearStaleStorageItems(storage) {
  try {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (!key || !key.toLowerCase().includes("vibe-share")) {
        continue;
      }
      const value = storage.getItem(key) || "";
      if (key === "vibe-share-web-session" || hasBlockedStoredServerValue(value)) {
        storage.removeItem(key);
      }
    }
  } catch {
    // Ignore private browsing storage failures and continue with URL-derived settings.
  }
}

function hasBlockedStoredServerValue(value) {
  try {
    return containsBlockedUrlFields(JSON.parse(value));
  } catch {
    return containsBlockedUrlFields(value);
  }
}

function containsBlockedUrlFields(value, keyName = "") {
  if (value == null) {
    return false;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return false;
    }
    const keyLooksLikeUrl = /url|base|server|api|host/i.test(keyName);
    const valueLooksLikeUrl = /localhost|127\.|0\.0\.0\.0|::1|\[::1\]/i.test(trimmed) || /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed);
    if (!(keyLooksLikeUrl || valueLooksLikeUrl)) {
      return false;
    }
    if (containsLoopbackUrlValue(trimmed)) {
      return true;
    }
    return isPublicWebRuntime() && isProductionBlockedUrl(trimmed);
  }
  if (Array.isArray(value)) {
    return value.some((item) => containsBlockedUrlFields(item, keyName));
  }
  if (typeof value === "object") {
    return Object.entries(value).some(([key, item]) => containsBlockedUrlFields(item, key));
  }
  return false;
}

function resetMobileConnectionInfo({ clearCaches = false } = {}) {
  hardResetQrRouteStorage("manual-reset");
  if (clearCaches) {
    void clearBrowserCaches();
    void disableServiceWorkerCaching();
  }
  sessionStorage.removeItem(MOBILE_SESSION_STORAGE_KEY);
  localStorage.removeItem(RECENT_SESSION_STORAGE_KEY);
  state.socket?.disconnect();
  state.socket = null;
  state.socketConnected = false;
  state.paired = false;
  state.session = null;
  state.auth = null;
  state.joinError = "";
  state.connectionLost = false;
  state.lifecycleNotice = "";
  state.recoveryPending = false;
  state.recovering = false;
  state.autoJoinInProgress = false;
  state.autoJoinStartedAt = 0;
  state.autoJoinFinalFailed = false;
  state.autoJoinAttempt = 0;
  if (state.autoJoinTimer) {
    window.clearTimeout(state.autoJoinTimer);
    state.autoJoinTimer = null;
  }
  state.message = "연결 대기 중";
  state.apiBaseUrl = preferredMobileApiBaseUrl();
  state.publicServerUrl = state.apiBaseUrl;
  state.incoming.clear();
  state.outgoing.clear();
  state.dismissedReceiveTransferIds.clear();
  if (els.mobileServerUrlInput) {
    els.mobileServerUrlInput.value = state.apiBaseUrl;
  }
  updateJoinDebug({ source: "manual-reset", paired: false, lastError: "" });
  render();
}

function mobileConnectionLabel() {
  if (state.joinError) {
    return "연결 실패";
  }
  if (state.connectionLost) {
    return "연결 끊김";
  }
  if (state.session?.id && state.paired) {
    return "연결됨";
  }
  return "연결 대기 중";
}

async function disableServiceWorkerCaching() {
  if (!("serviceWorker" in navigator)) {
    return;
  }
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  } catch {
    // Service workers are not required for this MVP.
  }
}

async function clearBrowserCaches() {
  if (!("caches" in window)) {
    return;
  }
  try {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.toLowerCase().includes("vibe-share")).map((name) => caches.delete(name)));
  } catch {
    // Cache API may be unavailable in restricted browser modes.
  }
}

function statusLabel(transfer) {
  const status = transfer.status === "pending" ? TRANSFER_STATES.PENDING_ACCEPT : transfer.status;
  if ([TRANSFER_STATES.UPLOADING, TRANSFER_STATES.DOWNLOADING, TRANSFER_STATES.SCANNING].includes(status)) {
    return status === TRANSFER_STATES.DOWNLOADING ? "다운로드 준비 중" : "전송 중";
  }
  if ([TRANSFER_STATES.PENDING_ACCEPT, TRANSFER_STATES.UPLOADED, TRANSFER_STATES.RELEASED].includes(status)) {
    return "파일 받기 대기";
  }
  if (status === TRANSFER_STATES.ACCEPTED) {
    return "다운로드 준비됨";
  }
  if (status === TRANSFER_STATES.DOWNLOAD_STARTED) {
    return "다운로드 시작됨";
  }
  if (status === TRANSFER_STATES.COMPLETED) {
    return "저장 완료";
  }
  if (status === TRANSFER_STATES.REJECTED) {
    return "실패";
  }
  if (status === TRANSFER_STATES.FAILED && transfer.downloadRetryable) {
    return "다운로드 실패";
  }
  if ([TRANSFER_STATES.FAILED, TRANSFER_STATES.FAILED_SCAN, TRANSFER_STATES.EXPIRED, TRANSFER_STATES.CANCELLED].includes(status)) {
    return "실패";
  }
  return "연결 대기 중";
}

function statusProgress(status) {
  if ([TRANSFER_STATES.UPLOADING, TRANSFER_STATES.DOWNLOADING, TRANSFER_STATES.SCANNING].includes(status)) {
    return 5;
  }
  if ([TRANSFER_STATES.UPLOADED, TRANSFER_STATES.RELEASED, TRANSFER_STATES.PENDING_ACCEPT, TRANSFER_STATES.ACCEPTED, TRANSFER_STATES.DOWNLOAD_STARTED, TRANSFER_STATES.COMPLETED, "pending"].includes(status)) {
    return 100;
  }
  return 0;
}

function allTransfers() {
  return [...state.incoming.values(), ...state.outgoing.values()];
}

function hasActiveTransfer() {
  return allTransfers().some((transfer) => ACTIVE_TRANSFER_STATUSES.has(transfer.status));
}

function hasUnfinishedTransfers() {
  return allTransfers().some((transfer) =>
    UNFINISHED_TRANSFER_STATUSES.has(transfer.status) &&
    !FINAL_TRANSFER_STATUSES.has(transfer.status)
  );
}

function transferSnapshot() {
  return allTransfers()
    .filter((transfer) => !FINAL_TRANSFER_STATUSES.has(transfer.status))
    .slice(0, 30)
    .map((transfer) => ({
      id: transfer.id,
      fileName: transfer.fileName || "vibe-share-file",
      size: transfer.size || 0,
      status: transfer.status,
      from: transfer.from,
      to: transfer.to,
      progress: Number.isFinite(transfer.progress) ? transfer.progress : statusProgress(transfer.status),
      updatedAt: Date.now()
    }));
}

function upsertTransfer(map, id, patch) {
  map.set(id, { ...(map.get(id) || {}), ...patch, id });
}

function setPcSendHint(message, isError = false) {
  els.pcSendHint.textContent = message;
  els.pcSendHint.classList.toggle("error", isError);
}

function setMobileHint(message, isError = false) {
  els.mobileSendHint.textContent = message;
  els.mobileSendHint.classList.toggle("error", isError);
}

function setServerHint(message, isError = false) {
  if (!els.serverHint) {
    return;
  }
  els.serverHint.textContent = message;
  els.serverHint.classList.toggle("error", isError);
}

function defaultApiBaseUrl() {
  const publicApiUrl = publicApiBaseUrlFromLocation();
  if (isPublicWebRuntime() && publicApiUrl) {
    return publicApiUrl;
  }

  const envUrl = import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_API_URL;
  if (envUrl) {
    const normalizedEnvUrl = normalizeBaseUrl(envUrl);
    if (!isPublicWebRuntime() || !isProductionBlockedUrl(normalizedEnvUrl)) {
      return normalizedEnvUrl;
    }
  }

  const { protocol, hostname } = window.location;
  const host = hostname || "localhost";
  const localProtocol = protocol === "https:" ? "https:" : "http:";

  if (isLocalHostname(host) || isIpv4Address(host)) {
    return `${localProtocol}//${host}:4000`;
  }

  if (host.startsWith("app-staging.")) {
    return `${protocol}//api-staging.${host.slice("app-staging.".length)}`;
  }
  if (host.startsWith("app.")) {
    return `${protocol}//api.${host.slice("app.".length)}`;
  }
  if (host === "staging.vibeshare.app") {
    return "https://api-staging.vibeshare.app";
  }

  return `${protocol}//${host}`;
}

function isPublicWebRuntime() {
  const hostname = String(window.location.hostname || "").toLowerCase();
  return (
    window.location.protocol === "https:" &&
    (
      PUBLIC_WEB_HOSTS.has(hostname) ||
      (hostname.startsWith("app.") && !isPrivateLanHost(hostname)) ||
      (hostname.startsWith("app-staging.") && !isPrivateLanHost(hostname))
    )
  );
}

function publicWebBaseUrlFromLocation() {
  if (!isPublicWebRuntime()) {
    return "";
  }
  return `${window.location.protocol}//${window.location.host}`;
}

function publicApiBaseUrlFromLocation() {
  if (!isPublicWebRuntime()) {
    return "";
  }
  return normalizeBaseUrl(apiUrlFromWebUrl(window.location.href, 4000));
}

function networkRequirementNotice() {
  return isPublicWebRuntime() ? PUBLIC_CONNECTION_NOTICE : LOCAL_NETWORK_REQUIREMENT_NOTICE;
}

function connectionFailureFirstNotice() {
  return isPublicWebRuntime() ? PUBLIC_CONNECTION_FAILURE_NOTICE : LOCAL_NETWORK_FAILURE_FIRST_NOTICE;
}

function normalizeBaseUrl(value) {
  return normalizeSharedBaseUrl(value);
}

function isLocalhostUrl(value) {
  return isMobileFacingUrlBlocked(value);
}

function isLocalHostname(hostname) {
  return isLoopbackHost(hostname);
}

function isBlockedHost(hostname) {
  return isLoopbackHost(hostname);
}

function isBlockedMobileServerUrl(value) {
  return isPublicWebRuntime() ? isProductionBlockedUrl(value) : isMobileFacingUrlBlocked(value);
}

function isProductionBlockedUrl(value) {
  return isMobileFacingUrlBlocked(value, { blockPrivate: true });
}

function isIpv4Address(hostname) {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(String(hostname || ""));
}

function toPortUrl(value, port) {
  try {
    const url = new URL(value);
    if (isLocalHostname(url.hostname)) {
      return "";
    }
    url.port = String(port);
    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function formatTime(value) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("ko", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  return data;
}

function selectedFileKey(file) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function createLocalTransferId(prefix) {
  return `local-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function sha256Hex(blob) {
  const buffer = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function createUploadManifest({ upload, file, localId }) {
  return {
    id: upload.id,
    uploadId: upload.id,
    localId,
    sessionId: state.session.id,
    apiBaseUrl: state.apiBaseUrl,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    lastModified: file.lastModified,
    partSize: upload.partSize,
    totalParts: upload.totalParts,
    parts: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

async function refreshUploadManifests() {
  if (state.role !== "pc") {
    return;
  }
  state.uploadManifests = await listUploadManifests();
  render();
}

async function findUploadManifestForFile(sessionId, file) {
  const manifests = await listUploadManifests();
  return manifests.find((manifest) =>
    manifest.sessionId === sessionId &&
    manifest.fileName === file.name &&
    manifest.size === file.size &&
    manifest.lastModified === file.lastModified
  ) || null;
}

async function cancelStoredUpload(uploadId) {
  const manifest = state.uploadManifests.find((item) => item.uploadId === uploadId);
  if (manifest?.sessionId) {
    await fetch(`${manifest.apiBaseUrl || state.apiBaseUrl}/api/uploads/${uploadId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...deviceAuthHeaders() },
      body: JSON.stringify({ sessionId: manifest.sessionId })
    }).catch(() => {});
  }
  await deleteUploadManifest(uploadId);
  await refreshUploadManifests();
}

function openUploadDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("vibe-share-web", 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("uploadManifests")) {
        request.result.createObjectStore("uploadManifests", { keyPath: "uploadId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withUploadStore(mode, fn) {
  const db = await openUploadDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("uploadManifests", mode);
      const store = tx.objectStore("uploadManifests");
      const result = fn(store);
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

async function saveUploadManifest(manifest) {
  const record = { ...manifest, updatedAt: Date.now() };
  return withUploadStore("readwrite", (store) => store.put(record));
}

async function deleteUploadManifest(uploadId) {
  return withUploadStore("readwrite", (store) => store.delete(uploadId));
}

async function listUploadManifests() {
  return withUploadStore("readonly", (store) => new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  })).catch(() => []);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function deviceAuthPayload() {
  if (!state.auth?.deviceId || !state.auth?.deviceTrustToken) {
    return {};
  }
  return {
    deviceId: state.auth.deviceId,
    deviceTrustToken: state.auth.deviceTrustToken
  };
}

function deviceAuthHeaders() {
  if (!state.auth?.deviceId || !state.auth?.deviceTrustToken) {
    return {};
  }
  return {
    "x-vibe-device-id": state.auth.deviceId,
    "x-vibe-device-token": state.auth.deviceTrustToken
  };
}

function saveWebSession() {
  saveCurrentSession("pc");
}

function saveCurrentSession(reason = "") {
  const storageKey = state.role === "mobile" ? MOBILE_SESSION_STORAGE_KEY : WEB_SESSION_STORAGE_KEY;
  if (currentRouteJoinCode() && !sessionMatchesCurrentRoute(state.session)) {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Ignore storage failures; QR routes must keep running.
    }
    return;
  }
  if (!state.session?.id) {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Ignore storage failures; this is only recovery state.
    }
    saveRecentSession(reason);
    return;
  }

  const payload = {
    appVersion: APP_VERSION,
    buildId: BUILD_ID,
    buildTime: BUILD_TIME,
    storageBuildVersion: STORAGE_BUILD_VERSION,
    storageSchemaVersion: STORAGE_SCHEMA_VERSION,
    role: state.role,
    apiBaseUrl: state.apiBaseUrl,
    publicServerUrl: state.publicServerUrl,
    phoneWebUrl: state.phoneWebUrl,
    joinUrl: state.joinUrl,
    joinCode: state.joinCode || state.session.code || "",
    direction: state.lastDirection,
    pendingTransfers: transferSnapshot(),
    session: state.session,
    auth: state.auth,
    savedAt: Date.now(),
    reason
  };
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(payload));
  } catch (error) {
    safeConsoleError("[vibe-share] session storage save skipped", {
      reason,
      message: safeErrorMessage(error),
      storageKey,
      buildId: BUILD_ID
    });
  }
  saveRecentSession(reason, payload);
}

function saveRecentSession(reason = "", currentPayload = null) {
  const session = currentPayload?.session || state.session;
  const code = currentPayload?.joinCode || state.joinCode || session?.code || "";
  const expiresAt = Number(session?.expiresAt || 0);
  if (!code && !session?.id) {
    try {
      localStorage.removeItem(RECENT_SESSION_STORAGE_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
    return;
  }
  if (expiresAt && expiresAt <= Date.now()) {
    try {
      localStorage.removeItem(RECENT_SESSION_STORAGE_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
    return;
  }

  const joinUrl = mobileSafeUrl(currentPayload?.joinUrl || state.joinUrl);
  const mobileServerUrl = mobileSafeUrl(currentPayload?.publicServerUrl || state.publicServerUrl);
  const phoneWebUrl = mobileSafeUrl(currentPayload?.phoneWebUrl || state.phoneWebUrl);
  const recent = {
    appVersion: APP_VERSION,
    buildId: BUILD_ID,
    buildTime: BUILD_TIME,
    storageBuildVersion: STORAGE_BUILD_VERSION,
    storageSchemaVersion: STORAGE_SCHEMA_VERSION,
    role: currentPayload?.role || state.role,
    code,
    pendingTransfers: currentPayload?.pendingTransfers || state.pendingTransferSnapshot || [],
    savedAt: Date.now()
  };
  const direction = currentPayload?.direction || state.lastDirection || "";
  if (direction) {
    recent.direction = direction;
  }
  if (joinUrl) {
    recent.joinUrl = joinUrl;
  }
  if (mobileServerUrl) {
    recent.mobileServerUrl = mobileServerUrl;
  }
  if (phoneWebUrl) {
    recent.phoneWebUrl = phoneWebUrl;
  }
  if (expiresAt) {
    recent.expiresAt = expiresAt;
  }
  if (reason) {
    recent.reason = reason;
  }

  if (containsBlockedUrlFields(recent)) {
    try {
      localStorage.removeItem(RECENT_SESSION_STORAGE_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
    return;
  }
  try {
    localStorage.setItem(RECENT_SESSION_STORAGE_KEY, JSON.stringify(recent));
  } catch (error) {
    safeConsoleError("[vibe-share] recent session save skipped", {
      reason,
      message: safeErrorMessage(error),
      buildId: BUILD_ID
    });
  }
}

function loadSavedWebSession() {
  try {
    const raw = sessionStorage.getItem(WEB_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const saved = JSON.parse(raw);
    if (!isCurrentBuildStorageRecord(saved) || !saved?.session?.id || Number(saved.session.expiresAt || 0) <= Date.now()) {
      sessionStorage.removeItem(WEB_SESSION_STORAGE_KEY);
      return null;
    }
    if (isPublicWebRuntime() && normalizeBaseUrl(saved.apiBaseUrl) !== defaultApiBaseUrl()) {
      sessionStorage.removeItem(WEB_SESSION_STORAGE_KEY);
      return null;
    }
    return saved;
  } catch {
    return null;
  }
}

function loadSavedMobileSession(expectedCode = "") {
  try {
    const raw = sessionStorage.getItem(MOBILE_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const saved = JSON.parse(raw);
    if (
      !isCurrentBuildStorageRecord(saved) ||
      !saved?.session?.id ||
      Number(saved.session.expiresAt || 0) <= Date.now() ||
      isMobileFacingUrlBlocked(saved.apiBaseUrl) ||
      (expectedCode && saved.session.code !== expectedCode)
    ) {
      sessionStorage.removeItem(MOBILE_SESSION_STORAGE_KEY);
      return null;
    }
    return saved;
  } catch {
    return null;
  }
}

function loadRecentSession() {
  try {
    const raw = localStorage.getItem(RECENT_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const saved = JSON.parse(raw);
    if (
      !isCurrentBuildStorageRecord(saved) ||
      containsBlockedUrlFields(saved) ||
      (Number(saved.expiresAt || 0) && Number(saved.expiresAt || 0) <= Date.now())
    ) {
      localStorage.removeItem(RECENT_SESSION_STORAGE_KEY);
      return null;
    }
    return saved;
  } catch {
    localStorage.removeItem(RECENT_SESSION_STORAGE_KEY);
    return null;
  }
}

function mobileSafeUrl(value) {
  const normalized = normalizeBaseUrl(value);
  if (!normalized || (isPublicWebRuntime() ? isProductionBlockedUrl(normalized) : isMobileFacingUrlBlocked(normalized))) {
    return "";
  }
  return normalized;
}
