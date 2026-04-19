# Product Roadmap

## Done

- PC web creates a session and shows QR/manual code.
- Mobile joins by scanning or manual code.
- PC -> mobile and mobile -> PC both work in the same session.
- PC does not need a camera.
- Server root status page replaces `Cannot GET /`.
- Local relay remains for beginner/Expo Go compatibility.
- Resumable upload API and storage adapter boundary exist.
- S3-compatible multipart adapter exists.
- PostgreSQL schema and migration runner exist.
- JSON metadata store remains as dev/test fallback.
- Redis cache/rate-limit/queue foundation exists with memory fallback.
- Socket.IO Redis adapter exists for production-like multi-instance event fanout.
- Dev-login JWT skeleton, anonymous session separation, device trust token registration/list/revoke APIs exist.
- Audit log foundation exists.
- Admin health/status endpoints exist.
- Admin endpoints expose configured vs active drivers and fallback warnings.
- PC web IndexedDB upload manifest exists for resume-after-refresh when the user reselects the same file.
- Cleanup command exists for expired sessions/transfers, stale uploads, and local artifacts.
- iPhone localhost/Safari confusion is handled in web, mobile, server status page, README, and runbook.
- Production-like local mode is verified against Docker compose PostgreSQL/Redis/MinIO when Docker Engine is running.
- Integration smoke covers pairing, device trust enforcement, relay transfer, and resumable transfer in both directions.
- i18n structure exists and is partially translated.
- Product surface is defined: `vibeshare.app` official site, `app.vibeshare.app` web app, `api.vibeshare.app` API, mobile app name `Vibe Share`.
- Web title/meta, mobile app config, server root copy, README, and launch docs now use product-facing Vibe Share language.
- Launch asset drafts exist under `docs/launch` for positioning, landing page, stores, pricing, beta plan, security messaging, support FAQ, and release checklist.
- Beta invite email, tester feedback template, support intake template, incident report template, store submission checklist, privacy/policy outline, site map, and static landing prototype are prepared.
- Codex-first operating structure exists with `.codex/actions.json`, `.codex/setup.ps1`, root owner docs, and one-command PowerShell scripts.

## Private beta usable

For trusted testers, the current repo is suitable for private beta of the core local flow:

- PC web plus Expo Go mobile app.
- Same Wi-Fi/LAN testing.
- QR/manual pairing.
- Bidirectional transfer with receiver accept/reject.
- PC web resumable upload and same-file resume after refresh.
- Production-like local infrastructure validation.
- Trusted tester copy, support intake fields, and private beta checklist.

Use the beta with clear caveats: no public account system, no production abuse desk, no real scanner, and no native mobile background large-file upload.

## Next: mobile commercial upload

Expo Go is intentionally kept working in this phase. 100GB commercial mobile uploads are not complete because reliable background transfer, app restart recovery, OS file permissions, and long-running network retries require native app work.

Next steps:

- Native app build for Android and iOS.
- Background upload service.
- Resume interrupted upload after app restart.
- OS-specific file access and transfer strategy.
- Indexed local upload manifest per device.
- Retry/backoff and signed part URL refresh.
- Large-file progress persistence.
- Battery/network policy handling.

## Next: account and trust

- Real signup/login.
- Official site hosting and DNS for `vibeshare.app`.
- Production hosting and TLS for `app.vibeshare.app` and `api.vibeshare.app`.
- App Store/TestFlight and Play Store release builds.
- Verified identity, passwordless/email/SSO, and token refresh/revocation.
- Fine-grained authorization tests for every transfer/upload/download path.
- Device trust UX for users, not only private-beta APIs.
- Trusted device list.
- Abuse blocklist by user/device/IP/object.
- Account deletion and data export.

## Next: 100GB production hardening

- Native mobile upload for true large mobile files.
- Server-side recovery from durable upload state.
- Distributed cleanup scheduler/worker for expired transfers and orphaned multipart uploads.
- Storage lifecycle policies.
- Cost controls and quota enforcement.
- End-to-end tests against real S3/MinIO with large synthetic objects.

## Next: i18n

The current state is multilingual-ready / partially translated. Before global launch:

- Complete human translations for all supported locales.
- Pseudo-localization testing.
- RTL visual QA.
- Locale-specific legal/privacy copy.
- Locale-specific date/number/file-size review.

## Next: operations

- Centralized logs.
- Metrics and alerts.
- Audit search.
- Admin dashboard.
- Malware scanning and quarantine.
- Incident response playbook.
- Privacy/retention policy review.
