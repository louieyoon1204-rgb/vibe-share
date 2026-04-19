import React, { useEffect, useRef, useState } from "react";
import { Alert, I18nManager, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import Constants from "expo-constants";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { StatusBar } from "expo-status-bar";
import { io } from "socket.io-client";
import {
  FALLBACK_LOCALE,
  SUPPORTED_LOCALES,
  TRANSFER_STATES,
  detectLocale,
  formatBytes,
  isMobileFacingUrlBlocked,
  isRtlLocale,
  normalizeBaseUrl,
  resolveMobileServerBaseUrl,
  sanitizeMobileFacingUrl,
  t,
  transferStateLabel
} from "@vibe-share/shared";

const CONFIGURED_SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || Constants.expoConfig?.extra?.defaultServerUrl || "";
const DETECTED_LAN_SERVER_URL = inferExpoLanServerUrl();
const DEFAULT_SERVER_URL = normalizeBaseUrl(
  CONFIGURED_SERVER_URL && !isMobileFacingUrlBlocked(CONFIGURED_SERVER_URL)
    ? CONFIGURED_SERVER_URL
    : DETECTED_LAN_SERVER_URL
);

export default function App() {
  const [locale, setLocale] = useState(detectLocale([Intl.DateTimeFormat().resolvedOptions().locale]));
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [code, setCode] = useState("");
  const [session, setSession] = useState(null);
  const [auth, setAuth] = useState(null);
  const [connectionKey, setConnectionKey] = useState("connectionNone");
  const [isPaired, setIsPaired] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [incomingTransfers, setIncomingTransfers] = useState([]);
  const [outgoingTransfers, setOutgoingTransfers] = useState([]);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const socketRef = useRef(null);
  const sessionRef = useRef(null);
  const authRef = useRef(null);
  const serverUrlRef = useRef(serverUrl);

  const tt = (key, vars) => t(locale, key, vars);
  const normalizedServerUrl = normalizeBaseUrl(serverUrl);
  const serverUrlIsLocalhost = isMobileFacingUrlBlocked(normalizedServerUrl);
  const needsServerSetup = !normalizedServerUrl || serverUrlIsLocalhost;
  const serverPlaceholder = DETECTED_LAN_SERVER_URL || "http://192.168.0.23:4000";

  useEffect(() => {
    serverUrlRef.current = serverUrl;
  }, [serverUrl]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    authRef.current = auth;
  }, [auth]);

  useEffect(() => {
    I18nManager.allowRTL(isRtlLocale(locale));
  }, [locale]);

  useEffect(() => {
    return () => socketRef.current?.disconnect();
  }, []);

  const changeLocale = (nextLocale) => {
    setLocale(nextLocale || FALLBACK_LOCALE);
  };

  const startScan = async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert("QR 스캔", "카메라 권한이 필요합니다.");
        return;
      }
    }
    setIsScanning(true);
  };

  const handleBarcodeScanned = ({ data }) => {
    if (!isScanning) {
      return;
    }
    setIsScanning(false);
    const payload = parsePairingPayload(data);
    if (!payload) {
      Alert.alert("QR 스캔", "Vibe Share QR이 아닙니다.");
      return;
    }
    setServerUrl(payload.serverUrl);
    setCode(payload.code);
    if (isMobileFacingUrlBlocked(payload.serverUrl)) {
      Alert.alert("연결할 수 없음", "이 QR은 휴대폰에서 사용할 수 없는 주소입니다.");
      return;
    }
    void joinSession(payload.serverUrl, payload.code);
  };

  const joinSession = async (serverUrlValue = serverUrl, codeValue = code) => {
    const normalizedServerUrl = normalizeBaseUrl(serverUrlValue);
    const normalizedCode = String(codeValue || "").replace(/\D/g, "").slice(0, 6);

    if (!normalizedServerUrl) {
      Alert.alert("코드 입력", "서버 주소가 필요합니다. QR 스캔을 먼저 사용해 보세요.");
      setShowServerSettings(true);
      return;
    }
    if (isMobileFacingUrlBlocked(normalizedServerUrl)) {
      setConnectionKey("connectionLost");
      Alert.alert("연결할 수 없음", "localhost는 휴대폰에서 사용할 수 없습니다.");
      setShowServerSettings(true);
      return;
    }
    if (!/^\d{6}$/.test(normalizedCode)) {
      Alert.alert("코드 입력", "6자리 숫자를 입력하세요.");
      return;
    }

    setConnectionKey("connectionServer");
    try {
      const response = await fetch(`${normalizedServerUrl}/api/sessions/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalizedCode })
      });
      const data = await parseJsonResponse(response);
      setServerUrl(normalizedServerUrl);
      setCode(normalizedCode);
      setSession(data.session);
      setAuth(data.auth || null);
      setIncomingTransfers([]);
      setOutgoingTransfers([]);
      connectSocket(normalizedServerUrl, data.session.id, data.auth || null);
    } catch (error) {
      setConnectionKey("connectionLost");
      Alert.alert("연결 실패", error.message);
    }
  };

  const connectSocket = (baseUrl, sessionId, authPayload = authRef.current) => {
    socketRef.current?.disconnect();
    const socket = io(baseUrl, {
      transports: ["websocket", "polling"],
      reconnection: true
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnectionKey("connectionServer");
      socket.emit("session:join", { sessionId, role: "mobile", ...deviceAuthPayload(authPayload) }, (reply) => {
        if (!reply?.ok) {
          setConnectionKey("connectionLost");
          return;
        }
        setSession(reply.session);
        setIsPaired(Boolean(reply.session?.paired));
      });
    });
    socket.on("disconnect", () => {
      setConnectionKey("connectionLost");
      setIsPaired(false);
    });
    socket.on("connect_error", () => setConnectionKey("connectionLost"));
    socket.on("session:state", ({ session: nextSession }) => {
      setSession(nextSession);
      setIsPaired(Boolean(nextSession.paired));
      setConnectionKey(nextSession.paired ? "connectionPc" : "connectionWaitingPc");
    });
    socket.on("session:expired", () => {
      setConnectionKey("connectionLost");
      setIsPaired(false);
      setAuth(null);
    });

    for (const eventName of ["transfer:offer", "transfer:pending", "transfer:accepted", "transfer:rejected", "transfer:download_started", "transfer:completed", "transfer:failed"]) {
      socket.on(eventName, ({ transfer }) => applyTransferUpdate(transfer));
    }
  };

  const applyTransferUpdate = (transfer) => {
    const setter = transfer.from === "mobile" ? setOutgoingTransfers : setIncomingTransfers;
    upsertTransfer(setter, transfer.id, transfer);
  };

  const pickAndUpload = async () => {
    if (!sessionRef.current?.id || !isPaired) {
      Alert.alert(tt("sendMobileToPc"), tt("waitingPairing"));
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: true
    });
    if (!result.canceled && result.assets?.length) {
      for (const asset of result.assets) {
        uploadRelay(asset);
      }
    }
  };

  const uploadRelay = (asset) => {
    const activeSession = sessionRef.current;
    if (!activeSession?.id) {
      return;
    }

    const localId = `local-mobile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    upsertTransfer(setOutgoingTransfers, localId, {
      id: localId,
      fileName: asset.name || "vibe-share-file",
      mimeType: asset.mimeType || "application/octet-stream",
      size: asset.size || 0,
      status: TRANSFER_STATES.UPLOADING,
      progress: 0,
      from: "mobile",
      to: "pc"
    });

    const form = new FormData();
    form.append("sessionId", activeSession.id);
    form.append("sender", "mobile");
    form.append("file", {
      uri: asset.uri,
      name: asset.name || "vibe-share-file",
      type: asset.mimeType || "application/octet-stream"
    });

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${serverUrlRef.current}/api/transfers`);
    for (const [name, value] of Object.entries(deviceAuthHeaders(authRef.current))) {
      xhr.setRequestHeader(name, value);
    }
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        upsertTransfer(setOutgoingTransfers, localId, {
          progress: Math.round((event.loaded / event.total) * 100)
        });
      }
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || "{}");
        if (xhr.status < 200 || xhr.status >= 300) {
          throw new Error(data.error || `HTTP ${xhr.status}`);
        }
        setOutgoingTransfers((current) => current.filter((item) => item.id !== localId));
        upsertTransfer(setOutgoingTransfers, data.transfer.id, { ...data.transfer, progress: 100 });
      } catch (error) {
        upsertTransfer(setOutgoingTransfers, localId, { status: TRANSFER_STATES.FAILED, failureReason: error.message });
      }
    };
    xhr.onerror = () => {
      upsertTransfer(setOutgoingTransfers, localId, { status: TRANSFER_STATES.FAILED, failureReason: "network_error" });
    };
    xhr.send(form);
  };

  const respondToTransfer = (transferId, decision) => {
    const activeSession = sessionRef.current;
    socketRef.current?.emit("transfer:respond", {
      sessionId: activeSession?.id,
      transferId,
      decision
    }, (reply) => {
      if (!reply?.ok) {
        upsertTransfer(setIncomingTransfers, transferId, { status: TRANSFER_STATES.FAILED, failureReason: reply?.error || "request_failed" });
        return;
      }
      upsertTransfer(setIncomingTransfers, transferId, reply.transfer);
    });
  };

  const downloadTransfer = async (transfer) => {
    const activeSession = sessionRef.current;
    if (!activeSession?.id) {
      return;
    }

    upsertTransfer(setIncomingTransfers, transfer.id, { status: TRANSFER_STATES.DOWNLOADING, progress: 0 });
    try {
      if (isMobileFacingUrlBlocked(serverUrlRef.current)) {
        throw new Error("LOOPBACK_DOWNLOAD_URL");
      }

      const targetResponse = await fetch(`${serverUrlRef.current}/api/transfers/${transfer.id}/download-url?sessionId=${encodeURIComponent(activeSession.id)}`, {
        headers: deviceAuthHeaders(authRef.current)
      });
      const { target } = await parseJsonResponse(targetResponse);
      if (target.directFromStorage && isMobileFacingUrlBlocked(target.url)) {
        throw new Error("LOOPBACK_DOWNLOAD_URL");
      }
      const downloadUrl = target.directFromStorage
        ? target.url
        : sanitizeMobileFacingUrl(target.url, { fallbackBaseUrl: serverUrlRef.current, forceBaseUrl: true });
      if (!downloadUrl || isMobileFacingUrlBlocked(downloadUrl)) {
        throw new Error("LOOPBACK_DOWNLOAD_URL");
      }
      const safeName = sanitizeFileName(transfer.fileName || "vibe-share-file");
      const targetUri = `${FileSystem.cacheDirectory || FileSystem.documentDirectory}${Date.now()}-${safeName}`;
      const downloadHeaders = target.directFromStorage ? {} : deviceAuthHeaders(authRef.current);
      const download = FileSystem.createDownloadResumable(downloadUrl, targetUri, { headers: downloadHeaders }, ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        if (totalBytesExpectedToWrite > 0) {
          upsertTransfer(setIncomingTransfers, transfer.id, {
            progress: Math.round((totalBytesWritten / totalBytesExpectedToWrite) * 100)
          });
        }
      });
      const result = await download.downloadAsync();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, {
          mimeType: transfer.mimeType || "application/octet-stream",
          dialogTitle: tt("saveOrShare")
        });
      } else {
        Alert.alert(tt("saveOrShare"), result.uri);
      }
      socketRef.current?.emit("transfer:complete", { sessionId: activeSession.id, transferId: transfer.id });
      upsertTransfer(setIncomingTransfers, transfer.id, { status: TRANSFER_STATES.COMPLETED, progress: 100 });
    } catch (error) {
      upsertTransfer(setIncomingTransfers, transfer.id, {
        status: TRANSFER_STATES.FAILED,
        failureReason: error?.message === "LOOPBACK_DOWNLOAD_URL" ? "다운로드 실패" : error.message
      });
      socketRef.current?.emit("transfer:failed", { sessionId: activeSession.id, transferId: transfer.id, reason: "download_failed" });
    }
  };

  if (isScanning) {
    return (
      <SafeAreaView style={styles.cameraScreen}>
        <StatusBar style="light" />
        <CameraView style={styles.camera} facing="back" onBarcodeScanned={handleBarcodeScanned} barcodeScannerSettings={{ barcodeTypes: ["qr"] }} />
        <View style={styles.scanOverlay}>
          <Text style={styles.scanTitle}>{tt("scanInstruction")}</Text>
          <Text style={styles.scanText}>{tt("scanHelp")}</Text>
          <Pressable style={styles.lightButton} onPress={() => setIsScanning(false)}>
            <Text style={styles.lightButtonText}>{tt("close")}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Vibe Share</Text>
          <Text style={styles.title}>휴대폰 연결</Text>
          <Text style={styles.subtitle}>PC 화면의 QR을 스캔하거나 6자리 코드를 입력하세요.</Text>
          <Text style={[styles.badge, isPaired ? styles.badgeOk : styles.badgeWarn]}>{mobileConnectionLabel(connectionKey, isPaired)}</Text>
        </View>

        <View style={styles.connectionCard}>
          <Text style={styles.sectionTitle}>연결하기</Text>
          <Pressable style={styles.scanButton} onPress={startScan}>
            <Text style={styles.scanButtonText}>QR 스캔</Text>
          </Pressable>
          <Text style={styles.shortHelp}>PC 웹 화면의 Vibe Share QR을 스캔하세요.</Text>

          <View style={styles.codeBlock}>
            <Text style={styles.label}>6자리 코드</Text>
            <TextInput keyboardType="number-pad" maxLength={6} onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" style={styles.codeInput} value={code} />
            <Pressable style={[styles.secondaryButton, needsServerSetup && styles.disabledButton]} onPress={() => joinSession()} disabled={needsServerSetup}>
              <Text style={styles.secondaryButtonText}>코드로 연결</Text>
            </Pressable>
          </View>

          {needsServerSetup ? <Text style={styles.dangerText}>QR 스캔이 가장 쉽습니다. 직접 연결하려면 PC 주소가 필요합니다.</Text> : null}

          <Pressable style={styles.textButton} onPress={() => setShowServerSettings((value) => !value)}>
            <Text style={styles.textButtonText}>{showServerSettings ? "설정 접기" : "서버 주소 직접 입력"}</Text>
          </Pressable>

          {showServerSettings ? (
            <View style={styles.serverSettings}>
              <Text style={styles.label}>PC 주소</Text>
              <TextInput autoCapitalize="none" autoCorrect={false} inputMode="url" onChangeText={setServerUrl} placeholder={serverPlaceholder} style={[styles.input, serverUrlIsLocalhost && styles.inputDanger]} value={serverUrl} />
              {serverUrlIsLocalhost ? <Text style={styles.dangerText}>localhost는 휴대폰에서 사용할 수 없습니다.</Text> : null}
              <View style={styles.buttonRow}>
                {DETECTED_LAN_SERVER_URL ? (
                  <Pressable style={styles.smallButton} onPress={() => setServerUrl(DETECTED_LAN_SERVER_URL)}>
                    <Text style={styles.smallButtonText}>감지된 PC 주소 사용</Text>
                  </Pressable>
                ) : null}
                <Pressable style={styles.smallButton} onPress={() => setServerUrl("")}>
                  <Text style={styles.smallButtonText}>주소 지우기</Text>
                </Pressable>
              </View>
              <LocaleButtons locale={locale} onChange={changeLocale} />
            </View>
          ) : null}
        </View>

        {isPaired ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>파일 보내기</Text>
              <Pressable style={styles.primaryButton} onPress={pickAndUpload}>
                <Text style={styles.primaryButtonText}>PC로 파일 보내기</Text>
              </Pressable>
            </View>
            <TransferList locale={locale} title="받은 파일" emptyText="아직 받은 파일이 없습니다." transfers={incomingTransfers} incoming onAccept={(transfer) => respondToTransfer(transfer.id, "accept")} onReject={(transfer) => respondToTransfer(transfer.id, "reject")} onDownload={downloadTransfer} />
            <TransferList locale={locale} title="보낸 파일" emptyText="아직 보낸 파일이 없습니다." transfers={outgoingTransfers} />
          </>
        ) : (
          <View style={styles.waitingCard}>
            <Text style={styles.sectionTitle}>대기 중</Text>
            <Text style={styles.helper}>PC에서 파일을 선택한 뒤 이 앱으로 QR을 스캔하세요.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function LocaleButtons({ locale, onChange }) {
  return (
    <View style={styles.localeRow}>
      {SUPPORTED_LOCALES.map((item) => (
        <Pressable key={item} style={[styles.localeButton, locale === item && styles.localeButtonActive]} onPress={() => onChange(item)}>
          <Text style={[styles.localeText, locale === item && styles.localeTextActive]}>{item}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function TransferList({ locale, title, emptyText, transfers, incoming = false, onAccept, onReject, onDownload }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {transfers.length === 0 ? <Text style={styles.helper}>{emptyText}</Text> : transfers.map((transfer) => (
        <View style={styles.transferItem} key={transfer.id}>
          <Text style={styles.transferName}>{transfer.fileName || "vibe-share-file"}</Text>
          <Text style={styles.helper}>{formatBytes(transfer.size || 0, locale)}</Text>
          <Text style={styles.transferStatus}>{statusLabel(locale, transfer)}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, transfer.progress ?? statusProgress(transfer.status)))}%` }]} />
          </View>
          {incoming && (transfer.status === TRANSFER_STATES.PENDING_ACCEPT || transfer.status === "pending") ? (
            <View style={styles.buttonRow}>
              <Pressable style={styles.primaryButton} onPress={() => onAccept?.(transfer)}><Text style={styles.primaryButtonText}>{t(locale, "accept")}</Text></Pressable>
              <Pressable style={styles.secondaryButton} onPress={() => onReject?.(transfer)}><Text style={styles.secondaryButtonText}>{t(locale, "reject")}</Text></Pressable>
            </View>
          ) : null}
          {incoming && transfer.status === TRANSFER_STATES.ACCEPTED ? (
            <Pressable style={styles.primaryButton} onPress={() => onDownload?.(transfer)}><Text style={styles.primaryButtonText}>{t(locale, "saveOrShare")}</Text></Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function parsePairingPayload(raw) {
  try {
    const url = new URL(raw);
    const code = String(url.searchParams.get("join") || url.searchParams.get("code") || "").replace(/\D/g, "").slice(0, 6);
    const pathCode = (url.pathname.match(/^\/(?:j|join)\/(\d{6})\/?$/) || [])[1] || "";
    const serverUrl = normalizeBaseUrl(inferServerUrlFromJoinUrl(url));
    if (serverUrl && (code || pathCode)) {
      return { serverUrl, code: code || pathCode };
    }
  } catch {
    // Keep the older JSON QR format working for previously generated codes.
  }

  try {
    const payload = JSON.parse(raw);
    const serverUrl = normalizeBaseUrl(payload?.serverUrl);
    if (payload?.type === "vibe-share-pair" && serverUrl && !isMobileFacingUrlBlocked(serverUrl) && payload.code) {
      return { serverUrl, code: String(payload.code).replace(/\D/g, "").slice(0, 6) };
    }
  } catch {
    return null;
  }
  return null;
}

function inferServerUrlFromJoinUrl(url) {
  return resolveMobileServerBaseUrl({
    currentUrl: url?.toString() || "",
    apiPort: 4000
  });
}

function mobileConnectionLabel(connectionKey, isPaired) {
  if (isPaired) {
    return "연결됨";
  }
  if (connectionKey === "connectionServer") {
    return "연결 대기 중";
  }
  if (connectionKey === "connectionLost") {
    return "연결 실패";
  }
  return "연결 대기 중";
}

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  return data;
}

function inferExpoLanServerUrl() {
  const candidates = [
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    Constants.manifest?.hostUri,
    Constants.manifest?.debuggerHost,
    Constants.manifest2?.extra?.expoClient?.hostUri,
    Constants.manifest2?.extra?.expoClient?.debuggerHost
  ];

  for (const candidate of candidates) {
    const match = String(candidate || "").match(/(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?/);
    if (match?.[1] && !match[1].startsWith("127.")) {
      return `http://${match[1]}:4000`;
    }
  }

  return "";
}

function upsertTransfer(setter, id, patch) {
  setter((current) => {
    const index = current.findIndex((item) => item.id === id);
    if (index === -1) {
      return [{ id, ...patch }, ...current];
    }
    const next = [...current];
    next[index] = { ...next[index], ...patch, id };
    return next;
  });
}

function sanitizeFileName(value) {
  return String(value || "vibe-share-file").replace(/[^\w.-]/g, "_").slice(0, 120) || "vibe-share-file";
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

function statusProgress(status) {
  if (status === TRANSFER_STATES.UPLOADING || status === TRANSFER_STATES.DOWNLOADING || status === TRANSFER_STATES.SCANNING) {
    return 5;
  }
  if ([TRANSFER_STATES.UPLOADED, TRANSFER_STATES.RELEASED, TRANSFER_STATES.PENDING_ACCEPT, TRANSFER_STATES.ACCEPTED, TRANSFER_STATES.DOWNLOAD_STARTED, TRANSFER_STATES.COMPLETED, "pending"].includes(status)) {
    return 100;
  }
  return 0;
}

function statusLabel(locale, transfer) {
  const status = transfer.status === "pending" ? TRANSFER_STATES.PENDING_ACCEPT : transfer.status;
  return simpleTransferStatus(locale, status);
}

function simpleTransferStatus(locale, status) {
  if ([TRANSFER_STATES.UPLOADING, TRANSFER_STATES.DOWNLOADING, TRANSFER_STATES.SCANNING].includes(status)) {
    return "업로드 중";
  }
  if ([TRANSFER_STATES.PENDING_ACCEPT, TRANSFER_STATES.UPLOADED, TRANSFER_STATES.RELEASED].includes(status)) {
    return "수락 대기";
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
  if ([TRANSFER_STATES.FAILED, TRANSFER_STATES.FAILED_SCAN, TRANSFER_STATES.REJECTED, TRANSFER_STATES.EXPIRED, TRANSFER_STATES.CANCELLED].includes(status)) {
    return "실패";
  }
  return transferStateLabel(locale, status);
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f7f6" },
  container: { gap: 14, padding: 18, paddingBottom: 40 },
  header: { gap: 8, paddingVertical: 8 },
  kicker: { color: "#0f766e", fontSize: 14, fontWeight: "900" },
  title: { color: "#111827", fontSize: 34, fontWeight: "900", lineHeight: 40 },
  subtitle: { color: "#4b5563", fontSize: 16, lineHeight: 23 },
  badge: { alignSelf: "flex-start", borderRadius: 8, fontWeight: "900", marginTop: 4, overflow: "hidden", paddingHorizontal: 12, paddingVertical: 8 },
  badgeOk: { backgroundColor: "#dcfce7", color: "#166534" },
  badgeWarn: { backgroundColor: "#fef3c7", color: "#92400e" },
  connectionCard: { backgroundColor: "#ffffff", borderColor: "#d1d5db", borderRadius: 8, borderTopColor: "#0f766e", borderTopWidth: 5, borderWidth: 1, gap: 14, padding: 16 },
  waitingCard: { backgroundColor: "#ffffff", borderColor: "#d1d5db", borderRadius: 8, borderWidth: 1, gap: 8, padding: 16 },
  section: { backgroundColor: "#ffffff", borderColor: "#d1d5db", borderRadius: 8, borderWidth: 1, gap: 12, padding: 16 },
  sectionTitle: { color: "#111827", fontSize: 20, fontWeight: "900" },
  shortHelp: { color: "#4b5563", fontSize: 14, lineHeight: 21, textAlign: "center" },
  codeBlock: { backgroundColor: "#f8fafc", borderColor: "#d1d5db", borderRadius: 8, borderWidth: 1, gap: 10, padding: 12 },
  label: { color: "#374151", fontSize: 14, fontWeight: "900" },
  input: { borderColor: "#cbd5e1", borderRadius: 8, borderWidth: 1, color: "#111827", minHeight: 48, paddingHorizontal: 12 },
  codeInput: { borderColor: "#cbd5e1", borderRadius: 8, borderWidth: 1, color: "#111827", fontSize: 28, fontWeight: "900", letterSpacing: 0, minHeight: 58, paddingHorizontal: 12, textAlign: "center" },
  inputDanger: { borderColor: "#dc2626", borderWidth: 2 },
  helper: { color: "#4b5563", fontSize: 14, lineHeight: 21 },
  dangerText: { color: "#b91c1c", fontSize: 14, fontWeight: "900", lineHeight: 21 },
  buttonRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  scanButton: { alignItems: "center", backgroundColor: "#0f766e", borderRadius: 8, justifyContent: "center", minHeight: 76, paddingHorizontal: 18, paddingVertical: 14 },
  scanButtonText: { color: "#ffffff", fontSize: 24, fontWeight: "900" },
  primaryButton: { alignItems: "center", backgroundColor: "#0f766e", borderRadius: 8, justifyContent: "center", minHeight: 52, paddingHorizontal: 16, paddingVertical: 12 },
  primaryButtonText: { color: "#ffffff", fontWeight: "900" },
  secondaryButton: { alignItems: "center", backgroundColor: "#e5e7eb", borderRadius: 8, justifyContent: "center", minHeight: 50, paddingHorizontal: 16, paddingVertical: 10 },
  secondaryButtonText: { color: "#111827", fontWeight: "900" },
  textButton: { alignItems: "center", alignSelf: "flex-start", minHeight: 36, justifyContent: "center" },
  textButtonText: { color: "#2563eb", fontWeight: "900" },
  smallButton: { alignItems: "center", backgroundColor: "#eef2ff", borderColor: "#a5b4fc", borderRadius: 8, borderWidth: 1, justifyContent: "center", minHeight: 42, paddingHorizontal: 12, paddingVertical: 8 },
  smallButtonText: { color: "#3730a3", fontWeight: "900" },
  disabledButton: { backgroundColor: "#9ca3af" },
  serverSettings: { borderTopColor: "#e5e7eb", borderTopWidth: 1, gap: 10, paddingTop: 12 },
  localeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingTop: 4 },
  localeButton: { borderColor: "#cbd5e1", borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  localeButtonActive: { backgroundColor: "#0f766e", borderColor: "#0f766e" },
  localeText: { color: "#111827", fontWeight: "800" },
  localeTextActive: { color: "#ffffff" },
  transferItem: { borderColor: "#d1d5db", borderRadius: 8, borderWidth: 1, gap: 8, padding: 12 },
  transferName: { color: "#111827", fontSize: 16, fontWeight: "900" },
  transferStatus: { color: "#0f766e", fontWeight: "900" },
  progressTrack: { backgroundColor: "#e5e7eb", borderRadius: 8, height: 10, overflow: "hidden", width: "100%" },
  progressFill: { backgroundColor: "#14b8a6", height: 10 },
  cameraScreen: { flex: 1, backgroundColor: "#111827" },
  camera: { flex: 1 },
  scanOverlay: { backgroundColor: "rgba(17, 24, 39, 0.86)", gap: 8, padding: 18 },
  scanTitle: { color: "#ffffff", fontSize: 20, fontWeight: "900" },
  scanText: { color: "#e5e7eb", fontSize: 15, lineHeight: 22 },
  lightButton: { alignItems: "center", alignSelf: "flex-start", backgroundColor: "#ffffff", borderRadius: 8, justifyContent: "center", marginTop: 8, minHeight: 44, paddingHorizontal: 16 },
  lightButtonText: { color: "#111827", fontWeight: "900" }
});
