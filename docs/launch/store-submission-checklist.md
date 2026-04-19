# Store Submission Checklist

Current state: the repo is ready up to TestFlight / Google Play internal testing handoff. Actual submission still requires Apple/Google accounts, Expo/EAS credentials, live staging, privacy/support URLs, and final screenshots/assets.

## App Identity

```text
App name: Vibe Share
iOS bundle id: app.vibeshare.mobile
Android package: app.vibeshare.mobile
URL scheme: vibeshare
Primary staging API: https://api-staging.vibeshare.app
Production API: https://api.vibeshare.app
```

## EAS Build Profiles

```text
development: development client, internal distribution
preview: internal beta build, staging API
production: store build, production API
```

Commands:

```powershell
npx eas-cli login
npx eas-cli init
npx eas-cli build --platform ios --profile preview
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform ios --profile production
npx eas-cli build --platform android --profile production
```

## iOS / TestFlight

- [ ] Apple Developer Program membership is active.
- [ ] Bundle ID `app.vibeshare.mobile` is reserved.
- [ ] App Store Connect app is created.
- [ ] EAS iOS credentials are configured.
- [ ] Privacy Policy URL is live.
- [ ] Support URL is live.
- [ ] Camera permission copy is reviewed.
- [ ] Screenshots are prepared.
- [ ] Review note explains QR-first PC web pairing.
- [ ] Staging API and web app are reachable by reviewers.
- [ ] TestFlight beta information is filled in.

## Google Play Internal Testing

- [ ] Google Play Console account is active.
- [ ] App package `app.vibeshare.mobile` is created.
- [ ] Play App Signing is enabled.
- [ ] Internal testing track is created.
- [ ] Android App Bundle from EAS production profile is uploaded.
- [ ] Data Safety answers are reviewed.
- [ ] Privacy Policy URL is live.
- [ ] Screenshots and feature graphic are prepared.
- [ ] Review note explains QR-first PC web pairing.
- [ ] Staging API and web app are reachable by reviewers.

## Store Assets

Placeholders are ready:

```text
apps/mobile/assets/icon.png
apps/mobile/assets/adaptive-icon.png
apps/mobile/assets/splash.png
docs/store-assets/store-icon-placeholder.png
docs/store-assets/feature-graphic-placeholder.png
```

Before public launch, replace placeholders with final brand assets and screenshots.

## Reviewer Note

Use this note for both stores:

```text
Vibe Share pairs a PC web page and a phone. Open the PC web app to show a Vibe Share QR and 6-digit code. Scan the QR with the phone camera, or enter the 6-digit code. The PC does not need a camera. After pairing, the same session supports PC-to-phone and phone-to-PC transfer. Please use the staging API/web environment provided in the review instructions.
```

## Known Beta Limits

- No public account system yet.
- No billing yet.
- Malware scan hook is prepared, but the real scanner must be attached in hosting.
- Large native background uploads are not guaranteed in this beta.
- Legal privacy/terms review must be completed before public launch.
