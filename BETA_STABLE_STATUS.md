# Vibe Share Beta Stable Status

Date: 2026-04-19

## Status

Vibe Share is ready to move from local beta validation to staging deployment preparation.

Confirmed by manual device testing:

- iPhone can scan the PC QR.
- Mobile web opens from the QR route.
- QR pairing reaches connected state.
- PC -> phone transfer works.
- phone -> PC transfer works.
- The same paired session supports both transfer directions.
- The PC does not need a camera.

## Stable Beta Baseline

The current baseline is web-first:

1. PC opens the web app.
2. PC creates a session and shows QR plus 6-digit code.
3. Phone scans the PC QR with the default camera.
4. Mobile web opens `/j/6-digit-code`.
5. Mobile joins automatically.
6. File actions remain hidden until `paired=true`.
7. Either side can send a file.
8. Receiver accepts or rejects the transfer.

## Network Baseline

For local beta testing, the phone and PC must be on the same Wi-Fi or hotspot.

The phone must be able to open:

```text
http://PC_LAN_IP:4000/health
http://PC_LAN_IP:5173
```

Run this before local beta retests:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\check-local-network.ps1
```

## Hardening Included

- QR route always prefers the current QR code over stale saved state.
- Safari bfcache/pageshow restore revalidates the current QR route.
- Build/version is shown in the web footer.
- Saved state from a different build is cleared.
- Mobile-facing URLs reject loopback hosts.
- `/api/info` no longer exposes WSL/Docker/Hyper-V addresses as mobile candidates.
- Entry HTML and critical dev responses use no-store cache headers.

## Local Verification Gate

Before staging deployment, run:

```powershell
npm.cmd run staging:readiness
```

This runs install, tests, MinIO smoke, web build, and local network diagnostics.

## Staging Entry Gate

Staging can start when these external values exist:

- DNS targets for `staging.vibeshare.app`, `app-staging.vibeshare.app`, `api-staging.vibeshare.app`
- Hosted PostgreSQL
- Hosted Redis
- S3-compatible bucket
- API hosting target
- Static web hosting target
- TLS for all staging hosts
- Real staging secrets in the host secret manager

Staging is not complete until QR join and both transfer directions pass over HTTPS.
