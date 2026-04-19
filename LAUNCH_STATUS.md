# Launch Status

## Web-first Beta Runtime Expectation

1. 기본 흐름은 QR 스캔 -> 연결 -> 전송입니다.
2. 전송 중 페이지를 벗어나면 연결이 끊길 수 있습니다.
3. 다시 돌아오면 자동 복구를 시도합니다.
4. 장시간 background 전송은 future native app track입니다.

전송 중에는 이 페이지를 닫거나 다른 앱으로 나가지 마세요. 페이지를 벗어나면 연결이 끊길 수 있습니다.

## Current Status

Vibe Share is beta-stable locally and ready to move into staging deployment preparation. External accounts, DNS, hosting, signing, secrets, and legal approval are still required before public testing.

Manual beta confirmation on 2026-04-19:

- iPhone QR scan opens the mobile web route.
- QR auto-join reaches connected state.
- PC -> phone transfer works.
- phone -> PC transfer works.
- Both directions work in the same paired session.
- PC does not need a camera.

The product UX is web-first and connection-first:

1. PC 웹 열기
2. 휴대폰 카메라로 QR 스캔
3. 연결 후 보낼지 받을지 선택
4. 파일 전송

## Safari State Hardening

- QR join route `/j/6자리코드` always prefers the current QR code over saved recovery state.
- If Safari normal mode appears stuck on connection, use `연결 정보 초기화`, close old tabs, and scan a fresh QR.
- The web footer shows build/version; saved session state can be cleared automatically when the build changes.

## Completed Internally

- PC web pairing screen with large QR, 6-digit code, and clear connection state.
- Short QR join route: `/j/6자리코드`.
- Mobile web auto-join from QR using the current host.
- Manual 6-digit code fallback.
- Loopback blocking for mobile-facing URLs: `localhost`, `127.*`, `0.0.0.0`, `::1`.
- PC -> phone transfer.
- phone -> PC transfer.
- Receiver accept/reject.
- Same-page mobile download flow with direct download fallback through the API relay.
- Production-like local mode with PostgreSQL, Redis, and MinIO.
- Full verification script.
- EAS build profiles for development, preview, and production.
- Store beta copy, review notes, and staging handoff docs.
- Final release-ready deliverable pack script.

## Latest Verification

Last internal verification baseline was refreshed on 2026-04-19.

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-production-like.ps1 -ResetInfra
powershell -ExecutionPolicy Bypass -File scripts\run-full-check.ps1
npm.cmd run staging:readiness
```

Result: passed.

Validated:

- `npm install`
- `npm test`
- integration smoke
- MinIO smoke
- cleanup
- web build
- Expo iOS export
- Docker PostgreSQL/Redis/MinIO
- DB migration
- `/`, `/health`, `/admin/health`, `/admin/status`, `/api/info`
- configured driver integration smoke
- local network diagnostics

## Staging Target

```text
https://staging.vibeshare.app
https://app-staging.vibeshare.app
https://api-staging.vibeshare.app
```

Status: staging-ready, not deployed. DNS, hosting accounts, hosted PostgreSQL/Redis/S3, TLS, and real secrets are external blockers.

Use `BETA_STABLE_STATUS.md` for the frozen beta baseline and `docs/launch/staging-deploy-checklist.md` for the deployment sequence.

Railway API service config is prepared in `railway.toml`. The Railway service should use the GitHub repository root as source and run only `apps/server`; do not set Root Directory to `/apps/server` while `packages/shared` is a workspace dependency.

## Store Beta Target

Ready for TestFlight / Google Play internal testing after:

- staging API/web are live over HTTPS
- Apple Developer and Google Play Console accounts exist
- Expo/EAS project is connected
- signing credentials are ready
- privacy/support URLs are live
- final screenshots/assets are uploaded

## Remaining External Blockers

Only the owner can finish these:

- Domain/DNS
- Hosting account and services
- Apple Developer account
- Google Play Console account
- Expo/EAS project connection
- Signing credentials
- Real staging/production secrets
- Legal/privacy review
- Final screenshots and brand assets
