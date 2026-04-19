# Deployment

This document fixes the staging/production deployment shape. Codex can prepare the repo, but actual deployment needs external DNS, hosting accounts, provider secrets, Apple/Google accounts, and legal approval.

## One-stack Target

Use one stack for staging and production:

- Site: static hosting
- Web app: static hosting
- API: Node.js hosting
- Database: PostgreSQL
- Cache/realtime: Redis
- File storage: S3-compatible object storage
- Mobile build: EAS Build

## URLs

```text
staging.vibeshare.app      staging site
app-staging.vibeshare.app  staging PC/mobile web app
api-staging.vibeshare.app  staging API

vibeshare.app              production site
app.vibeshare.app          production PC/mobile web app
api.vibeshare.app          production API
```

## Product Flow

1. PC opens the web app.
2. Phone camera scans the PC QR.
3. Mobile web opens `/j/6-digit-code`.
4. After connection, user chooses send or receive.
5. File transfer uses the API relay/object storage path.

PC does not need a camera.

## Service Map

```text
PC web app
  -> API server

Mobile web/native app
  -> API server

API server
  -> PostgreSQL
  -> Redis
  -> S3-compatible object storage
```

## Railway API Service

For Railway, create one API service from the GitHub repository root and let `/railway.toml` start only `apps/server`.

Do not set Railway Root Directory to `/apps/server` in the current repo shape, because `apps/server` uses the workspace package `packages/shared`.

Railway settings are fixed in `railway.toml`:

```text
preDeployCommand = npm run db:migrate
startCommand = node apps/server/src/index.js
healthcheckPath = /health
```

Detailed Railway steps are in `docs/launch/railway-api-service.md`.

## Environment Matrix

| Environment | Web URL | API URL | Mobile-facing URL rule | Data services |
| --- | --- | --- | --- | --- |
| local demo | `http://localhost:5173` | `http://localhost:4000` | LAN host from `/api/info` | JSON/memory/local disk |
| production-like local | `http://localhost:5173` | `http://localhost:4000` | LAN host from `/api/info` | Docker PostgreSQL/Redis/MinIO |
| staging | `https://app-staging.vibeshare.app` | `https://api-staging.vibeshare.app` | HTTPS public host only | hosted PostgreSQL/Redis/S3 |
| production | `https://app.vibeshare.app` | `https://api.vibeshare.app` | HTTPS public host only | hosted PostgreSQL/Redis/S3 |

Mobile-facing URLs must never contain `localhost`, `127.*`, `0.0.0.0`, `::1`, or an empty host.

## Required Secrets

Put staging and production values in the hosting provider secret manager.

```text
DATABASE_URL
REDIS_URL
S3_ENDPOINT
S3_REGION
S3_BUCKET
S3_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY
S3_FORCE_PATH_STYLE
DEVICE_TRUST_SECRET
ADMIN_TOKEN
AUTH_JWT_SECRET
MALWARE_SCAN_WEBHOOK_URL
```

Use `.env.staging.example` for staging and `.env.example` for production.

Cloudflare R2 values must use the S3 API account endpoint: `S3_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com`, `S3_REGION=auto`, and `S3_FORCE_PATH_STYLE=false`. Signed upload URLs do not work with R2 custom domains.

## API Environment

Staging:

```env
APP_MODE=production
CORS_ORIGIN=https://app-staging.vibeshare.app
DATABASE_DRIVER=postgres
CACHE_DRIVER=redis
SOCKET_IO_ADAPTER=redis
STORAGE_DRIVER=s3
PUBLIC_SITE_URL=https://staging.vibeshare.app
PUBLIC_WEB_APP_URL=https://app-staging.vibeshare.app
PUBLIC_API_URL=https://api-staging.vibeshare.app
```

Production:

```env
APP_MODE=production
CORS_ORIGIN=https://app.vibeshare.app
DATABASE_DRIVER=postgres
CACHE_DRIVER=redis
SOCKET_IO_ADAPTER=redis
STORAGE_DRIVER=s3
PUBLIC_SITE_URL=https://vibeshare.app
PUBLIC_WEB_APP_URL=https://app.vibeshare.app
PUBLIC_API_URL=https://api.vibeshare.app
```

## Web Build Environment

Staging:

```env
VITE_SERVER_URL=https://api-staging.vibeshare.app
```

Production:

```env
VITE_SERVER_URL=https://api.vibeshare.app
```

## Mobile Build

EAS profiles are in `eas.json`.

```powershell
npx eas-cli build --platform ios --profile preview
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform ios --profile production
npx eas-cli build --platform android --profile production
```

Current app identity:

```text
App name: Vibe Share
iOS bundle id: app.vibeshare.mobile
Android package: app.vibeshare.mobile
Scheme: vibeshare
```

## Health Checks

```powershell
curl.exe https://api-staging.vibeshare.app/health
curl.exe https://api-staging.vibeshare.app/api/info
curl.exe https://api-staging.vibeshare.app/admin/status -H "Authorization: Bearer <ADMIN_TOKEN>"
```

Expected:

- database active: `postgres`
- cache active: `redis`
- realtime active: `redis`
- storage active: `s3`
- fallback warnings: empty
- mobile web/API URLs use public HTTPS hosts

## Deployment Order

1. Create hosted PostgreSQL, Redis, and S3-compatible bucket.
2. Deploy API with staging secrets.
3. Point `api-staging.vibeshare.app` to API hosting and enable TLS.
4. Run `npm.cmd run db:migrate` against staging DB.
5. Deploy web app with `VITE_SERVER_URL=https://api-staging.vibeshare.app`.
6. Point `app-staging.vibeshare.app` to web hosting and enable TLS.
7. Verify `/health`, `/admin/status`, and `/api/info`.
8. Test QR join, code join, PC -> phone, and phone -> PC.
9. Build EAS preview profiles for iOS and Android.
10. Repeat the same sequence for production.

## External Boundary

Codex cannot complete these outside-repo actions:

- buy/configure DNS
- create hosting accounts
- create Apple/Google developer accounts
- upload signing credentials
- issue production secrets
- complete legal/privacy review
