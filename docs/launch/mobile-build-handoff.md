# Mobile Build Handoff

## Current State

The primary beta flow is web-first: phone camera scans the PC web QR and opens mobile web. The native Expo app remains prepared for TestFlight / Google Play internal testing.

The repo includes:

- `expo-dev-client`
- `eas.json`
- development build profile
- preview build profile
- production build profile
- app icon placeholder
- adaptive icon placeholder
- splash placeholder
- store asset placeholders

## Build Profiles

```text
development
  Development client build for local debugging.
  Uses https://api-staging.vibeshare.app as default external API.

preview
  Internal beta build for owner/testers.
  Uses https://api-staging.vibeshare.app.

production
  Store build for TestFlight / Play internal testing.
  Uses https://api.vibeshare.app.
```

## Commands

Run after Expo login and EAS project connection:

```powershell
npx eas-cli login
npx eas-cli init
npx eas-cli build --platform ios --profile preview
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform ios --profile production
npx eas-cli build --platform android --profile production
```

Submit after Apple/Google accounts and signing credentials are ready:

```powershell
npx eas-cli submit --platform ios --profile production
npx eas-cli submit --platform android --profile production
```

## App Identity

```text
App name: Vibe Share
Slug: vibe-share
Scheme: vibeshare
iOS bundle id: app.vibeshare.mobile
Android package: app.vibeshare.mobile
```

## Permission Copy

Camera permission:

```text
PC 화면의 QR 코드를 스캔하려면 카메라 권한이 필요합니다.
```

The PC does not need a camera.

## Before Actual EAS Cloud Build

The owner must complete these external steps:

1. Create or log into Expo account.
2. Create Apple Developer account.
3. Create Google Play Console account.
4. Let EAS create/manage signing credentials, or upload existing credentials.
5. Make staging API/web reachable over HTTPS.
6. Add real `EXPO_EAS_PROJECT_ID` if EAS asks for it.

## Asset Placeholders

```text
apps/mobile/assets/icon.png
apps/mobile/assets/adaptive-icon.png
apps/mobile/assets/splash.png
docs/store-assets/store-icon-placeholder.png
docs/store-assets/feature-graphic-placeholder.png
```

These are acceptable for build testing. Replace them before public brand launch.
