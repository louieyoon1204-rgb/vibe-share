export * from "./mobile-url.js";

export const TRANSFER_STATES = Object.freeze({
  CREATED: "created",
  UPLOADING: "uploading",
  UPLOADED: "uploaded",
  SCANNING: "scanning",
  QUARANTINED: "quarantined",
  RELEASED: "released",
  FAILED_SCAN: "failed_scan",
  PENDING_ACCEPT: "pending_accept",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  DOWNLOADING: "downloading",
  DOWNLOAD_STARTED: "download_started",
  COMPLETED: "completed",
  FAILED: "failed",
  EXPIRED: "expired",
  CANCELLED: "cancelled"
});

export const SUPPORTED_LOCALES = [
  "ko",
  "en",
  "ja",
  "zh-Hans",
  "zh-Hant",
  "es",
  "fr",
  "de",
  "pt-BR",
  "ar"
];

export const FALLBACK_LOCALE = "ko";
export const RTL_LOCALES = ["ar"];

const LOCALE_ALIASES = {
  zh: "zh-Hans",
  "zh-CN": "zh-Hans",
  "zh-SG": "zh-Hans",
  "zh-TW": "zh-Hant",
  "zh-HK": "zh-Hant",
  "zh-MO": "zh-Hant",
  pt: "pt-BR"
};

const common = {
  appName: "Vibe Share",
  pcRole: "PC",
  mobileRole: "Mobile",
  fileSizeLimit: "100 GB",
  transferState: {
    created: "Created",
    uploading: "Uploading",
    uploaded: "Uploaded",
    scanning: "Scanning",
    quarantined: "Quarantined",
    released: "Released",
    failed_scan: "Failed scan",
    pending_accept: "Waiting for acceptance",
    accepted: "Accepted",
    rejected: "Rejected",
    downloading: "Downloading",
    download_started: "Download started",
    completed: "Completed",
    failed: "Failed",
    expired: "Expired",
    cancelled: "Cancelled"
  }
};

export const translations = {
  ko: {
    ...common,
    languageName: "한국어",
    appTagline: "QR로 연결하고 같은 세션에서 PC와 휴대폰 파일을 주고받습니다.",
    productOneLine: "PC 카메라 없이 QR 한 번으로 휴대폰과 PC를 연결하는 파일 전송 서비스입니다.",
    connectionNone: "연결 전",
    connectionServer: "서버 연결됨",
    connectionPc: "PC 연결됨",
    connectionMobile: "휴대폰 연결됨",
    connectionWaitingPc: "PC 연결 대기 중",
    connectionWaitingMobile: "휴대폰 대기 중",
    connectionLost: "서버 연결 끊김",
    connectionFailed: "연결 실패: {message}",
    rootTitle: "Vibe Share 서버",
    rootDescription: "이 주소는 API 서버입니다. PC 웹 앱에서 QR을 만들고 휴대폰 앱에서 스캔하세요.",
    openWebApp: "PC 웹 앱 열기",
    healthOk: "서버 정상",
    mode: "모드",
    storage: "스토리지",
    maxFileSize: "최대 파일 크기",
    language: "언어",
    webSurfaceLabel: "공식 웹앱 / PC 화면",
    webTitle: "PC와 휴대폰을 바로 연결하세요",
    webLead: "Vibe Share는 PC 화면의 세션 QR 또는 6자리 코드로 휴대폰을 연결해 양방향 파일 전송을 시작합니다.",
    webTrustMessage: "세션 권한, 수락/거절, 전송 상태, 운영 상태 확인을 갖춘 private beta용 전송 흐름입니다.",
    webProductIntroTitle: "Private beta에서 바로 확인할 수 있는 것",
    webFeaturePairingTitle: "PC 카메라 없는 QR 연결",
    webFeaturePairingText: "PC는 QR을 보여 주고, 휴대폰 앱이 PC 화면을 스캔합니다.",
    webFeatureBothWaysTitle: "양방향 전송",
    webFeatureBothWaysText: "한 세션 안에서 PC -> 휴대폰, 휴대폰 -> PC 전송을 모두 처리합니다.",
    webFeatureControlTitle: "수락/거절과 진행 상태",
    webFeatureControlText: "받는 쪽은 전송을 수락하거나 거절하고, 진행률과 상태를 확인합니다.",
    webFeatureOpsTitle: "운영 확인",
    webFeatureOpsText: "health/status, cleanup, audit hook, fallback visibility가 준비되어 있습니다.",
    webBetaNoticeTitle: "Private beta 안내",
    webBetaNoticeText: "현재는 trusted tester용입니다. 공개 계정, 결제, 실제 스토어 배포, 완전한 malware scanner, native 모바일 대용량 background upload는 paid public launch 전 남은 작업입니다.",
    webSecurityNoticeTitle: "보안/신뢰 범위",
    webSecurityNoticeText: "세션/권한 기반 전송, device trust foundation, object storage 기반 대용량 경로, audit/cleanup/health/status 구조를 제공합니다. 절대 안전이나 해킹 불가를 약속하지 않습니다.",
    webLocalhostBannerTitle: "아이폰에서는 PC 주소로 접속하세요",
    webLocalhostBannerText: "Safari에서 localhost를 열면 PC가 아니라 아이폰 자기 자신을 찾습니다. 아이폰에서는 192.168.x.x 형태의 PC LAN 주소를 사용하거나 Expo Go 앱 안에서 진행하세요.",
    webLocalhostBannerOkTitle: "PC에서는 localhost, 휴대폰에서는 LAN 주소",
    webLocalhostBannerOkText: "PC 브라우저는 localhost로 열어도 됩니다. 휴대폰 Safari와 Vibe Share 앱에는 반드시 PC LAN IP 주소가 들어가야 합니다.",
    serverSectionTitle: "연결 준비",
    serverSectionText: "Expo Go QR, Vibe Share 세션 QR, LAN 주소의 역할을 먼저 구분합니다.",
    pcServerUrl: "PC에서 쓰는 서버 주소",
    phoneServerUrl: "휴대폰용 서버 주소",
    qrConceptTitle: "QR과 주소를 이렇게 구분하세요",
    expoQrTitle: "Expo Go QR",
    expoQrConcept: "터미널에 나오는 QR입니다. 아이폰에서 Expo Go 앱을 열 때만 사용합니다.",
    sessionQrTitle: "Vibe Share 세션 QR",
    sessionQrConcept: "PC 웹 화면에 나오는 QR입니다. Expo Go 앱 안의 QR 스캔 버튼으로만 스캔합니다.",
    lanAddressTitle: "LAN IP 주소",
    lanAddressConcept: "휴대폰 Safari나 앱 수동 입력에는 localhost가 아니라 192.168.x.x 형태의 PC 주소를 씁니다.",
    lanServerDetected: "앱 내부 페어링 서버 주소",
    phoneWebDetected: "휴대폰 Safari에서 직접 열 웹 주소",
    lanServerMissing: "LAN 서버 주소를 아직 찾지 못했습니다. 서버 확인을 눌러 주세요.",
    phoneWebMissing: "LAN 웹 주소를 아직 찾지 못했습니다. PC와 휴대폰이 같은 Wi-Fi인지 확인하세요.",
    directPhoneAddressHelp: "휴대폰 Safari로 웹을 직접 열어야 한다면 이 주소만 사용하세요. localhost는 금지입니다.",
    appPairingAddressHelp: "이 주소가 Vibe Share 세션 QR에 들어갑니다. 앱 안에서 QR을 스캔하면 자동으로 입력됩니다.",
    localhostInputWarning: "휴대폰용 주소가 localhost입니다. 이 QR로는 아이폰이 PC에 연결할 수 없습니다.",
    publicServerLocalhostError: "휴대폰용 서버 주소가 localhost라 세션을 만들 수 없습니다. 서버 확인을 눌러 감지된 PC LAN IP를 사용하거나 직접 http://PC_LAN_IP:4000 형식으로 입력하세요.",
    checkServer: "서버 확인",
    createSession: "새 세션 만들기",
    serverHintStart: "서버를 먼저 실행하세요: npm.cmd run dev:server",
    pairingTitle: "휴대폰 페어링",
    pairingText: "QR을 스캔하거나 6자리 코드를 입력합니다. PC 카메라는 필요 없습니다.",
    sessionQrInstructionTitle: "이 QR은 Expo Go QR이 아닙니다",
    sessionQrInstructionText: "먼저 터미널의 Expo QR로 앱을 연 다음, Vibe Share 앱 안의 QR 스캔 버튼으로 이 QR을 스캔하세요.",
    pairingServerPayload: "이 QR에 들어갈 서버 주소: {url}",
    qrPlaceholder: "새 세션을 만들면 QR 코드가 표시됩니다.",
    manualCode: "수동 코드",
    noSession: "세션 없음",
    expiresAt: "만료: {time}",
    sendPcToPhone: "PC에서 휴대폰으로 보내기",
    sendPcToPhoneText: "브라우저는 resumable upload 경로를 사용하고, Expo Go 앱은 쉬운 첫 실행을 위해 호환 전송 경로를 유지합니다.",
    chooseFile: "파일을 선택하세요.",
    sendFile: "파일 보내기",
    waitingPairing: "휴대폰 페어링을 기다리는 중입니다.",
    uploadResumeConfirm: "{fileName} 파일의 중단된 업로드가 있습니다. 이어서 업로드할까요?",
    uploadResumeStatus: "{fileName} 업로드를 {parts}/{totalParts} 파트부터 이어서 진행합니다.",
    resumeListHelp: "이 브라우저에 중단된 업로드 기록이 있습니다. 같은 파일을 다시 선택하면 이어서 업로드할 수 있고, 기록만 취소할 수도 있습니다.",
    uploadedParts: "업로드된 파트 {parts}개",
    resumeReady: "이 브라우저에서 이어올리기 준비됨",
    cancelManifest: "업로드 기록 취소",
    outgoingTitle: "PC -> 휴대폰",
    incomingTitle: "휴대폰 -> PC",
    outgoingEmpty: "아직 보낸 파일이 없습니다.",
    incomingEmpty: "아직 받은 요청이 없습니다.",
    accept: "수락",
    reject: "거절",
    downloadToPc: "PC에 다운로드",
    saveOrShare: "저장 또는 공유",
    scanQr: "QR 스캔",
    joinByCode: "코드로 연결",
    serverUrl: "서버 주소",
    sixDigitCode: "6자리 코드",
    mobileTitle: "Vibe Share 모바일",
    mobileLead: "PC 화면의 Vibe Share 세션 QR을 이 앱 안에서 스캔하면 파일을 주고받을 수 있습니다.",
    mobileBetaNote: "Private beta: QR/manual pairing, 양방향 전송, 수락/거절, 진행 상태를 검증합니다.",
    mobileTrustNote: "전송은 세션 권한과 device trust foundation을 사용합니다. 알 수 없는 파일은 열기 전에 발신자와 내용을 확인하세요.",
    mobileStepsTitle: "아이폰 연결 순서",
    mobileStepExpo: "1단계: Expo Go로 Vibe Share 앱을 엽니다. Safari에서 localhost를 열지 않습니다.",
    mobileStepSession: "2단계: PC 웹에서 새 세션을 만들고 Vibe Share 세션 QR을 표시합니다.",
    mobileStepPair: "3단계: 이 앱 안에서 QR을 스캔하거나 6자리 코드를 입력합니다.",
    mobileServerHelp: "QR 스캔 시 서버 주소와 코드가 자동 입력됩니다. 수동 입력은 PC 웹의 앱 내부 페어링 서버 주소를 그대로 넣으세요.",
    detectedServerButton: "감지된 PC LAN 주소 사용",
    clearServerButton: "서버 주소 지우기",
    localhostBlockedTitle: "localhost로는 연결할 수 없습니다",
    localhostBlockedMessage: "휴대폰의 localhost는 PC가 아니라 휴대폰 자신입니다. PC LAN IP 주소 예: http://192.168.0.23:4000 를 사용하세요.",
    qrLocalhostBlockedMessage: "이 QR에는 localhost 서버 주소가 들어 있습니다. PC 웹에서 서버 확인을 눌러 LAN IP가 들어간 QR을 다시 만드세요.",
    localhostFieldWarning: "현재 서버 주소가 localhost입니다. 아이폰에서는 반드시 PC LAN IP를 사용해야 합니다.",
    scanInstruction: "PC 화면의 QR 코드를 비춰 주세요.",
    scanHelp: "인식되면 자동으로 세션에 연결합니다.",
    close: "닫기",
    sendMobileToPc: "휴대폰에서 PC로 보내기",
    pickAndSend: "파일 선택해서 보내기",
    receivedFromPc: "PC에서 온 파일",
    sentToPc: "PC로 보낸 파일",
    localhostWarning: "휴대폰에서 localhost는 PC가 아니라 휴대폰 자신입니다. PC LAN IP를 사용하세요.",
    pairingQrInvalid: "Vibe Share QR이 아닙니다. 수동 코드를 사용하세요.",
    serverRequired: "서버 주소를 입력하세요. 예: http://192.168.0.23:4000",
    codeRequired: "6자리 숫자 코드를 입력하세요.",
    transferState: {
      created: "생성됨",
      uploading: "업로드 중",
      uploaded: "업로드 완료",
      scanning: "검사 중",
      quarantined: "격리됨",
      released: "검사 통과",
      failed_scan: "검사 실패",
      pending_accept: "수락 대기",
      accepted: "수락됨",
      rejected: "거절됨",
      downloading: "다운로드 중",
      download_started: "다운로드 시작됨",
      completed: "완료",
      failed: "실패",
      expired: "만료됨",
      cancelled: "취소됨"
    }
  },
  en: {
    ...common,
    languageName: "English",
    appTagline: "Pair by QR and move files between your PC and phone in one session.",
    productOneLine: "A file transfer service that connects a phone to a PC with one QR scan and no PC camera.",
    connectionNone: "Not connected",
    connectionServer: "Server connected",
    connectionPc: "PC connected",
    connectionMobile: "Phone connected",
    connectionWaitingPc: "Waiting for PC",
    connectionWaitingMobile: "Waiting for phone",
    connectionLost: "Server disconnected",
    connectionFailed: "Connection failed: {message}",
    rootTitle: "Vibe Share server",
    rootDescription: "This is the API server. Create the QR in the PC web app, then scan it in the mobile app.",
    openWebApp: "Open PC web app",
    healthOk: "Server healthy",
    mode: "Mode",
    storage: "Storage",
    maxFileSize: "Max file size",
    language: "Language",
    webSurfaceLabel: "Official web app / PC screen",
    webTitle: "Connect your PC and phone",
    webLead: "Vibe Share starts bidirectional file transfer with a PC session QR or 6-digit code.",
    webTrustMessage: "Private-beta transfer flow with session permissions, accept/reject, transfer state, and operator status checks.",
    webProductIntroTitle: "What you can test in private beta",
    webFeaturePairingTitle: "QR pairing without a PC camera",
    webFeaturePairingText: "The PC shows the QR, and the phone app scans the PC screen.",
    webFeatureBothWaysTitle: "Transfer both ways",
    webFeatureBothWaysText: "Use one session for PC -> phone and phone -> PC transfer.",
    webFeatureControlTitle: "Accept/reject and progress",
    webFeatureControlText: "The receiver accepts or rejects transfers and sees progress/state.",
    webFeatureOpsTitle: "Operator visibility",
    webFeatureOpsText: "health/status, cleanup, audit hooks, and fallback visibility are in place.",
    webBetaNoticeTitle: "Private beta note",
    webBetaNoticeText: "This is for trusted testers. Public accounts, billing, real store distribution, full malware scanning, and native mobile large-file background upload are paid-launch gaps.",
    webSecurityNoticeTitle: "Security/trust boundary",
    webSecurityNoticeText: "Vibe Share provides session-permission transfer, device trust foundation, object-storage large-file path, audit/cleanup/health/status structure. It does not promise absolute safety or unhackable transfer.",
    webLocalhostBannerTitle: "Use the PC address on iPhone",
    webLocalhostBannerText: "Opening localhost in Safari makes the iPhone look for itself, not your PC. Use the PC LAN address that looks like 192.168.x.x, or continue inside Expo Go.",
    webLocalhostBannerOkTitle: "localhost on PC, LAN address on phone",
    webLocalhostBannerOkText: "The PC browser can use localhost. Phone Safari and the Vibe Share app must use the PC LAN IP address.",
    serverSectionTitle: "Connection setup",
    serverSectionText: "Keep the Expo Go QR, Vibe Share session QR, and LAN address roles separate.",
    pcServerUrl: "Server URL for this PC",
    phoneServerUrl: "Server URL for the phone",
    qrConceptTitle: "Keep these QR codes and addresses separate",
    expoQrTitle: "Expo Go QR",
    expoQrConcept: "This QR appears in the terminal. Use it only to open the mobile app in Expo Go.",
    sessionQrTitle: "Vibe Share session QR",
    sessionQrConcept: "This QR appears on the PC web page. Scan it only from inside the Vibe Share mobile app.",
    lanAddressTitle: "LAN IP address",
    lanAddressConcept: "Use the PC address that looks like 192.168.x.x for phone Safari or manual app entry. Never use localhost on the phone.",
    lanServerDetected: "In-app pairing server address",
    phoneWebDetected: "Phone Safari web address",
    lanServerMissing: "No LAN server address detected yet. Press Check server.",
    phoneWebMissing: "No LAN web address detected yet. Confirm the PC and phone are on the same Wi-Fi.",
    directPhoneAddressHelp: "Use only this address if you open the web UI from phone Safari. Do not use localhost.",
    appPairingAddressHelp: "This address goes into the Vibe Share session QR. The app fills it automatically after scanning.",
    localhostInputWarning: "The phone URL is localhost. An iPhone cannot reach the PC with this QR.",
    publicServerLocalhostError: "The phone server URL is localhost, so a session cannot be created. Press Check server to use the detected PC LAN IP, or enter http://PC_LAN_IP:4000 manually.",
    checkServer: "Check server",
    createSession: "Create new session",
    serverHintStart: "Start the server first: npm.cmd run dev:server",
    pairingTitle: "Phone pairing",
    pairingText: "Scan QR or enter the 6-digit code. The PC does not need a camera.",
    sessionQrInstructionTitle: "This is not the Expo Go QR",
    sessionQrInstructionText: "First open the app with the Expo QR in the terminal. Then scan this QR from the QR Scan button inside the Vibe Share app.",
    pairingServerPayload: "Server address inside this QR: {url}",
    qrPlaceholder: "Create a session to show a QR code.",
    manualCode: "Manual code",
    noSession: "No session",
    expiresAt: "Expires: {time}",
    sendPcToPhone: "Send from PC to phone",
    sendPcToPhoneText: "The browser uses the resumable upload path; Expo Go keeps the compatibility transfer path for easy first run.",
    chooseFile: "Choose a file first.",
    sendFile: "Send file",
    waitingPairing: "Waiting for phone pairing.",
    uploadResumeConfirm: "Unfinished upload found for {fileName}. Resume it?",
    uploadResumeStatus: "Resuming {fileName} from {parts}/{totalParts} parts.",
    resumeListHelp: "Unfinished browser upload manifests are stored locally. Re-select the same file to resume, or cancel the manifest.",
    uploadedParts: "{parts} uploaded parts",
    resumeReady: "Resume-ready in this browser",
    cancelManifest: "Cancel manifest",
    outgoingTitle: "PC -> phone",
    incomingTitle: "Phone -> PC",
    outgoingEmpty: "No sent files yet.",
    incomingEmpty: "No incoming requests yet.",
    accept: "Accept",
    reject: "Reject",
    downloadToPc: "Download to PC",
    saveOrShare: "Save or share",
    scanQr: "Scan QR",
    joinByCode: "Join by code",
    serverUrl: "Server URL",
    sixDigitCode: "6-digit code",
    mobileTitle: "Vibe Share mobile",
    mobileLead: "Scan the Vibe Share session QR inside this app to send files both ways.",
    mobileBetaNote: "Private beta: validate QR/manual pairing, bidirectional transfer, accept/reject, and progress.",
    mobileTrustNote: "Transfers use session permissions and device trust foundation. Verify unknown files before opening them.",
    mobileStepsTitle: "iPhone connection order",
    mobileStepExpo: "Step 1: Open the Vibe Share app in Expo Go. Do not open localhost in Safari.",
    mobileStepSession: "Step 2: Create a new session on the PC web page and show the Vibe Share session QR.",
    mobileStepPair: "Step 3: Scan the QR inside this app or enter the 6-digit code.",
    mobileServerHelp: "QR scanning fills the server URL and code automatically. For manual entry, copy the in-app pairing server address from the PC web page.",
    detectedServerButton: "Use detected PC LAN address",
    clearServerButton: "Clear server address",
    localhostBlockedTitle: "localhost cannot connect",
    localhostBlockedMessage: "On a phone, localhost means the phone itself, not the PC. Use the PC LAN IP, for example http://192.168.0.23:4000.",
    qrLocalhostBlockedMessage: "This QR contains a localhost server URL. Press Check server on the PC web page and create a new QR with the LAN IP.",
    localhostFieldWarning: "The current server URL is localhost. On iPhone, use the PC LAN IP address.",
    scanInstruction: "Point the camera at the PC QR.",
    scanHelp: "The app joins automatically after scanning.",
    close: "Close",
    sendMobileToPc: "Send from phone to PC",
    pickAndSend: "Pick file and send",
    receivedFromPc: "Files from PC",
    sentToPc: "Files sent to PC",
    localhostWarning: "On a phone, localhost means the phone itself. Use the PC LAN IP.",
    pairingQrInvalid: "This is not a Vibe Share QR. Use the manual code.",
    serverRequired: "Enter a server URL, for example http://192.168.0.23:4000",
    codeRequired: "Enter the 6-digit code."
  }
};

const localizedNames = {
  ja: "日本語",
  "zh-Hans": "简体中文",
  "zh-Hant": "繁體中文",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  "pt-BR": "Português (Brasil)",
  ar: "العربية"
};

for (const locale of ["ja", "zh-Hans", "zh-Hant", "es", "fr", "de", "pt-BR", "ar"]) {
  translations[locale] = {
    ...translations.en,
    languageName: localizedNames[locale]
  };
}

translations.ja.webTitle = "PCとスマートフォンのファイル転送";
translations["zh-Hans"].webTitle = "电脑与手机文件传输";
translations["zh-Hant"].webTitle = "電腦與手機檔案傳輸";
translations.es.webTitle = "Transferencia de archivos entre PC y móvil";
translations.fr.webTitle = "Transfert de fichiers entre PC et mobile";
translations.de.webTitle = "Dateitransfer zwischen PC und Telefon";
translations["pt-BR"].webTitle = "Transferência de arquivos entre PC e celular";
translations.ar.webTitle = "نقل الملفات بين الكمبيوتر والهاتف";

export function normalizeLocale(locale) {
  if (!locale) {
    return FALLBACK_LOCALE;
  }
  const raw = String(locale).replace("_", "-");
  if (SUPPORTED_LOCALES.includes(raw)) {
    return raw;
  }
  if (LOCALE_ALIASES[raw]) {
    return LOCALE_ALIASES[raw];
  }
  const language = raw.split("-")[0];
  return SUPPORTED_LOCALES.includes(language) ? language : FALLBACK_LOCALE;
}

export function detectLocale(candidates = []) {
  for (const candidate of candidates) {
    const normalized = normalizeLocale(candidate);
    if (normalized !== FALLBACK_LOCALE || String(candidate || "").startsWith(FALLBACK_LOCALE)) {
      return normalized;
    }
  }
  return FALLBACK_LOCALE;
}

export function isRtlLocale(locale) {
  return RTL_LOCALES.includes(normalizeLocale(locale));
}

export function t(locale, key, vars = {}) {
  const normalized = normalizeLocale(locale);
  const value = getByPath(translations[normalized], key) ?? getByPath(translations[FALLBACK_LOCALE], key) ?? key;
  return interpolate(String(value), vars);
}

export function transferStateLabel(locale, status) {
  return t(locale, `transferState.${status || TRANSFER_STATES.CREATED}`);
}

export function formatBytes(bytes, locale = FALLBACK_LOCALE) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const formatted = new Intl.NumberFormat(normalizeLocale(locale), {
    maximumFractionDigits: value >= 10 || unitIndex === 0 ? 0 : 1
  }).format(value);
  return `${formatted} ${units[unitIndex]}`;
}

export function formatDateTime(value, locale = FALLBACK_LOCALE) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat(normalizeLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function getByPath(source, key) {
  return String(key).split(".").reduce((current, part) => current?.[part], source);
}

function interpolate(value, vars) {
  return value.replace(/\{(\w+)\}/g, (_match, name) => vars[name] ?? "");
}
