# Release Checklist

## Code Complete for Store Beta

- [x] PC web connection-first QR pairing flow
- [x] Mobile web QR join and code fallback
- [x] PC -> phone transfer
- [x] phone -> PC transfer
- [x] accept / reject
- [x] progress / download-started / success / failure states
- [x] mobile-facing loopback URL blocking
- [x] EAS build profiles
- [x] development build path
- [x] preview build path
- [x] production build path
- [x] staging environment template
- [x] store copy drafts
- [x] review notes
- [x] asset placeholders
- [x] final release-ready pack script

## Must Be Done Outside the Repo

- [ ] Domain/DNS
- [ ] Hosting accounts
- [ ] Apple Developer account
- [ ] Google Play Console account
- [ ] Expo account/EAS project
- [ ] Signing credentials
- [ ] Staging/production secrets
- [ ] Legal/privacy review
- [ ] Final screenshots and brand assets

## Pre-submit Verification

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-production-like.ps1 -ResetInfra
powershell -ExecutionPolicy Bypass -File scripts\run-full-check.ps1
```

## Store Beta Sequence

1. Bring up staging API/web with HTTPS.
2. Verify staging health/status/api info.
3. Log in to Expo/EAS.
4. Run EAS preview builds for iOS and Android.
5. Install preview builds on owner devices.
6. Test QR join and code fallback.
7. Test PC -> phone transfer.
8. Test phone -> PC transfer.
9. Build production profile.
10. Submit to TestFlight and Google Play internal testing.
