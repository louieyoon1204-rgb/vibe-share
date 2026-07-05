# Railway API Service

This repo is an npm workspace monorepo. The Railway API service should run only `apps/server`, but the service source should stay at the repository root because `apps/server` imports `packages/shared`.

Do not set Railway Root Directory to `/apps/server` unless `@vibe-share/shared` is later published or copied into the server package.

## Service Shape

- Railway service: API only
- Source directory: repository root
- Config as code: `/railway.toml`
- Start command: `node apps/server/src/index.js`
- Pre-deploy command: `npm run db:migrate`
- Healthcheck path: `/health`
- Watch paths: `apps/server`, `packages/shared`, root package files, `railway.toml`

Railway injects `PORT`; the server reads `SERVER_PORT || PORT`, so no hardcoded port is needed.

## Required Railway Variables

Set these in the current production Railway API service:

```text
APP_MODE=production
CORS_ORIGIN=https://app.getvibeshare.com
DATABASE_DRIVER=postgres
CACHE_DRIVER=redis
SOCKET_IO_ADAPTER=redis
STORAGE_DRIVER=s3
PUBLIC_SITE_URL=https://getvibeshare.com
PUBLIC_WEB_APP_URL=https://app.getvibeshare.com
PUBLIC_API_URL=https://api.getvibeshare.com
DATABASE_URL=<railway-or-hosted-postgres-url>
REDIS_URL=<railway-or-hosted-redis-url>
S3_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=<bucket>
S3_ACCESS_KEY_ID=<secret>
S3_SECRET_ACCESS_KEY=<secret>
S3_FORCE_PATH_STYLE=false
DEVICE_TRUST_SECRET=<long-random-secret>
ADMIN_TOKEN=<long-random-token>
AUTH_JWT_SECRET=<long-random-secret>
AUTH_DEV_LOGIN_ENABLED=false
REQUIRE_DEVICE_TRUST=true
MALWARE_SCAN_WEBHOOK_URL=<scanner-url-or-empty>
```

Use `.env.example` as the source checklist for production, but do not upload `.env` to GitHub or Railway.

For Cloudflare R2, `S3_ENDPOINT` must be the account S3 API endpoint. Do not use a bucket URL, `r2.dev` URL, or custom domain for signed uploads.

## After Deploy

Check:

```powershell
curl.exe https://api-staging.getvibeshare.com/health
curl.exe https://api-staging.getvibeshare.com/api/info
curl.exe https://api-staging.getvibeshare.com/admin/status -H "Authorization: Bearer <ADMIN_TOKEN>"
```

For the current public production API:

```powershell
curl.exe https://api.getvibeshare.com/health
curl.exe https://api.getvibeshare.com/api/info
curl.exe https://api.getvibeshare.com/admin/status -H "Authorization: Bearer <ADMIN_TOKEN>"
```

Expected:

- `database.active` is `postgres`
- `cache.active` is `redis`
- `realtime.active` is `redis`
- `storage.active` is `s3`
- `fallbackWarnings` is empty
- `mobileServerUrl` is the matching public API URL
- `mobileWebUrl` is the matching public web URL

Then deploy the web app separately with:

```text
VITE_SERVER_URL=https://api.getvibeshare.com
```
