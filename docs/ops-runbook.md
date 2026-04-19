# Ops Runbook

## Codex-first operations

For a non-developer owner, start with the root files:

- `START_HERE_FIRST.md`
- `BETA_OPERATOR_CHECKLIST.md`
- `IPHONE_TEST_STEPS.md`
- `LAUNCH_STATUS.md`
- `OWNER_ONLY_FINAL_STEPS.md`

Codex actions are defined in `.codex/actions.json`. The same actions can be run directly:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-demo.ps1
powershell -ExecutionPolicy Bypass -File scripts\start-production-like.ps1
powershell -ExecutionPolicy Bypass -File scripts\run-full-check.ps1
powershell -ExecutionPolicy Bypass -File scripts\build-launch-pack.ps1
powershell -ExecutionPolicy Bypass -File scripts\open-ops-summary.ps1
```

## Service map

- Official site `vibeshare.app`: product, beta, FAQ, and support copy. In this repo the launch copy lives under `docs/launch`; DNS/hosting is not configured.
- Web app `app.vibeshare.app`: implemented by `apps/web`. This is the PC user surface for session creation, QR/manual pairing, and PC-side transfer actions.
- API `api.vibeshare.app`: implemented by `apps/server`. This is the API/relay/status/auth foundation/metadata server. The root path is a status/connection guide; `/admin/*` is for operators.
- Mobile app `Vibe Share`: implemented by `apps/mobile`. Current private beta runs in Expo Go; store builds are launch work.

When supporting a tester, first identify which surface they are looking at. Many local setup errors come from opening API or localhost pages in Safari instead of opening Expo Go and scanning the in-app Vibe Share session QR.

Use `docs/launch/support-intake-template.md` for support tickets, `docs/launch/tester-feedback-template.md` for beta feedback, and `docs/launch/incident-report-template.md` for operational or security incidents.

## Local demo health check

```powershell
cd C:\Users\ycl12\Desktop\vibe-share
npm.cmd install
npm.cmd run dev:server
curl.exe http://localhost:4000/health
curl.exe http://localhost:4000/admin/health
curl.exe http://localhost:4000/admin/status
```

Expected:

- `ok: true`
- `activeDrivers.storage.active` matches the intended mode
- demo mode: database `json`, cache `memory`, storage `local`
- production-like local mode: database `postgres`, cache `redis`, realtime `redis`, storage `s3`
- `fallbackWarnings: []` when no fallback is active

## iPhone localhost rule

If an iPhone user opens `http://localhost:5173` or `http://localhost:4000` in Safari, it will not reach the PC. On iPhone, `localhost` means the iPhone itself, not the Windows PC.

Use this exact beginner flow:

1. Start the server on the PC: `npm.cmd run dev:server`
2. Start the PC web UI: `npm.cmd run dev:web`
3. Open the PC web UI on the PC: `http://localhost:5173`
4. Start Expo: `npm.cmd run dev:mobile`
5. On iPhone, open Expo Go and scan the Expo QR from the terminal.
6. In the PC web UI, create a new session.
7. Inside the Vibe Share app, tap QR scan and scan the Vibe Share session QR shown on the PC web page.

Address meanings:

- PC web on the PC: `http://localhost:5173`
- Phone Safari web check: `http://<PC_LAN_IP>:5173`
- PC API on the PC: `http://localhost:4000`
- Mobile app pairing server: `http://<PC_LAN_IP>:4000`

The server root page at `http://<PC_LAN_IP>:4000` is only an API/relay/status guide. If that page opens in Safari, the network path is reachable, but file transfer still happens inside Expo Go.

## Production-like local startup

Preflight:

```powershell
docker desktop status
docker info
docker compose version
```

If Docker is stopped or `docker info` returns a Docker Engine 500 error, run the repair script from an elevated PowerShell:

```powershell
cd C:\Users\ycl12\Desktop\vibe-share
Set-ExecutionPolicy -Scope Process Bypass -Force
.\scripts\repair-wsl-docker.ps1
```

If the script exits with `3010` or says a reboot is pending, reboot Windows and rerun the same elevated command once. This script enables WSL/Virtual Machine Platform, verifies the modern WSL package, starts Docker Desktop Service, and waits for Docker Engine readiness.

Observed minimal recovery path on this machine:

```powershell
docker desktop start
docker desktop status
docker info
```

If `docker desktop status` stays `starting` and `Start-Service com.docker.service` says `Cannot open service`, switch to an elevated PowerShell and run `.\scripts\repair-wsl-docker.ps1`. That is the smallest remaining user action because starting Docker Desktop Service requires UAC/admin rights.

```powershell
cd C:\Users\ycl12\Desktop\vibe-share
Copy-Item .env.production-like.example .env
docker compose -f docker-compose.local-infra.yml up -d
docker compose -f docker-compose.local-infra.yml ps
npm.cmd run db:migrate
npm.cmd run dev:server
```

Expected:

- PostgreSQL on `127.0.0.1:5432`
- Redis on `127.0.0.1:6379`
- MinIO API on `127.0.0.1:9000`
- MinIO console on `127.0.0.1:9001`
- Socket.IO adapter reports `redis`

If `docker desktop status` reports `stopped` after the repair script and reboot, open Docker Desktop once and finish any visible onboarding prompt. If `Start-Service com.docker.service` fails with "Cannot open service", the current PowerShell is not elevated.

Production-like verification:

```powershell
$env:INTEGRATION_USE_CONFIG_DRIVERS='true'
npm.cmd run smoke:integration
Remove-Item Env:\INTEGRATION_USE_CONFIG_DRIVERS
npm.cmd run smoke:minio
curl.exe http://localhost:4000/admin/status
```

Check `configuredDrivers`, `activeDrivers`, and `fallbackWarnings`. If the server was started before Docker/Redis/Postgres were healthy, restart `npm.cmd run dev:server` so it reconnects to the real drivers instead of development fallback.

## Docker/WSL diagnosis checklist

Run:

```powershell
"C:\Program Files\WSL\wsl.exe" --version
"C:\Program Files\WSL\wsl.exe" --status
Get-CimInstance Win32_OptionalFeature | Where-Object { $_.Name -in @("Microsoft-Windows-Subsystem-Linux","VirtualMachinePlatform") } | Select-Object Name,InstallState
Get-Service com.docker.service,LxssManager,vmcompute,hns -ErrorAction SilentlyContinue
```

Typical meanings:

- `WSL_E_WSL_OPTIONAL_COMPONENT_REQUIRED`: WSL app is installed, but Windows optional component activation has not completed. Run the repair script as administrator and reboot if requested.
- `docker desktop status` = `stopped`: Docker Desktop UI may be open, but the backend engine is not running.
- `docker info` Engine 500: Docker CLI exists, but the backend pipe is not serving the Engine API.
- `com.docker.service` stopped + non-elevated PowerShell: service start needs administrator/UAC.

## Admin health

Development:

```powershell
curl.exe http://localhost:4000/admin/status
```

Production:

```powershell
curl.exe -H "Authorization: Bearer <ADMIN_TOKEN>" http://localhost:4000/admin/status
```

Check:

- config validation errors
- configured vs active driver mismatch
- fallback warnings
- database availability
- cache availability
- realtime adapter availability
- storage driver availability
- runtime sessions/transfers/uploadSessions counts
- file/chunk/signed URL limits

## Migration

```powershell
npm.cmd run db:migrate
```

If `DATABASE_DRIVER` is not `postgres`, migration exits successfully with a skip message. That is intentional for local demo mode.

## Redis fallback behavior

In development, if `CACHE_DRIVER=redis` but Redis cannot be reached, the server logs a warning and uses memory cache fallback. In production, Redis connection failure blocks startup.

When `SOCKET_IO_ADAPTER=redis`, Socket.IO room fanout also uses Redis. This removes the requirement that both paired devices are connected to the same Node.js process for transfer events. A WebSocket-aware load balancer or sticky sessions may still be useful for upgrade stability and reconnect behavior.

## PostgreSQL fallback behavior

In development, if `DATABASE_DRIVER=postgres` but PostgreSQL cannot be reached, the server logs a warning and uses JSON metadata fallback. In production, PostgreSQL connection failure blocks startup.

## MinIO multipart smoke

```powershell
npm.cmd run smoke:minio
```

This verifies:

- MinIO startup
- bucket creation
- presigned multipart part upload
- multipart complete
- signed download
- abort incomplete multipart upload

This smoke test can run without Docker because it downloads a local MinIO Windows binary under `.tmp/minio-smoke/tools`.

## Cleanup command

```powershell
npm.cmd run cleanup
```

This marks expired sessions/transfers, aborts stale upload sessions through the configured storage adapter when possible, and removes old local demo artifacts. It is a runnable command, not a distributed scheduler. In real production it should be called by a scheduled worker or job runner with idempotency and alerting.

## Private beta readiness checklist

Run before inviting testers:

```powershell
npm.cmd install
npm.cmd test
npm.cmd run smoke:minio
npm.cmd run cleanup
npm.cmd run build -w apps/web
npm.cmd exec -w apps/mobile -- expo export --platform ios --output-dir ../../.tmp/expo-export-ios
curl.exe http://localhost:4000/
curl.exe http://localhost:4000/health
curl.exe http://localhost:4000/admin/health
curl.exe http://localhost:4000/admin/status
```

Pass criteria:

- Pairing works by QR and manual 6-digit code.
- PC -> mobile and mobile -> PC both pass with accept/reject visible.
- Device trust negative checks pass in `smoke:integration`.
- `fallbackWarnings` is empty for production-like mode.
- iPhone flow copy says Expo Go first, then app-internal Vibe Share QR scan.

## Beta support intake

Collect these fields for every tester issue:

- Device model and OS version
- Browser and browser version
- Expo Go version
- PC and phone Wi-Fi/network details
- File extension and size
- Direction: PC -> phone or phone -> PC
- Pairing method: QR scan or 6-digit code
- Exact screen: official site, web app, API status page, Expo Go, or Vibe Share app
- Exact error message or screenshot
- Reproduction steps

## Cleanup tasks before paid production

- Add object storage lifecycle rule for aborted incomplete multipart uploads.
- Add scheduled worker for expired transfers and orphaned upload sessions.
- Add audit export/retention job.
- Add malware scan result worker and quarantine cleanup.
- Add metrics and alerting for upload failures, S3 errors, Redis errors, and Postgres errors.

## Incident response notes

- Use `audit_logs` to trace session/transfer/device events.
- Use `devices.trust_token_hash` to attach future device block/revocation.
- Use `storage_key` from `transfers` and `upload_sessions` to locate object storage data.
- Preserve audit logs even when file objects expire, subject to legal retention policy.
