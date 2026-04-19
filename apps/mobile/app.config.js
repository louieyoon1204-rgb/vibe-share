const fs = require("fs");
const path = require("path");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.resolve(__dirname, "../..", ".env"));
loadEnvFile(path.resolve(__dirname, ".env"));

module.exports = ({ config }) => {
  const easProjectId = process.env.EXPO_EAS_PROJECT_ID || "";
  const extra = {
    ...(config.extra || {}),
    defaultServerUrl: process.env.EXPO_PUBLIC_SERVER_URL || ""
  };

  if (easProjectId) {
    extra.eas = { ...(extra.eas || {}), projectId: easProjectId };
  }

  return {
    ...config,
    name: "Vibe Share",
    slug: "vibe-share",
    scheme: "vibeshare",
    version: process.env.EXPO_PUBLIC_APP_VERSION || config.version || "0.1.0",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#f4f7f6"
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    ios: {
      ...(config.ios || {}),
      bundleIdentifier: process.env.EXPO_IOS_BUNDLE_IDENTIFIER || "app.vibeshare.mobile",
      buildNumber: process.env.EXPO_IOS_BUILD_NUMBER || "1",
      supportsTablet: true,
      infoPlist: {
        ...(config.ios?.infoPlist || {}),
        NSCameraUsageDescription: "PC 화면의 QR 코드를 스캔하려면 카메라 권한이 필요합니다.",
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      ...(config.android || {}),
      package: process.env.EXPO_ANDROID_PACKAGE || "app.vibeshare.mobile",
      versionCode: Number(process.env.EXPO_ANDROID_VERSION_CODE || 1),
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0f766e"
      },
      permissions: ["CAMERA", "INTERNET"],
      blockedPermissions: ["android.permission.RECORD_AUDIO"]
    },
    plugins: [
      [
        "expo-camera",
        {
          cameraPermission: "PC 화면의 QR 코드를 스캔하려면 카메라 권한이 필요합니다."
        }
      ],
      "expo-sharing"
    ],
    extra
  };
};
