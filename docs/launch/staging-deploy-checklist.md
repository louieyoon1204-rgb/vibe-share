# Staging Deploy Checklist

Use this after the local beta stable gate passes.

For the Railway API service, use the repository root as the source and let `/railway.toml` run only `apps/server`. Do not set Railway Root Directory to `/apps/server` while `apps/server` depends on `packages/shared`.

## 1. Required External Resources

- DNS control for `vibeshare.app`
- Static hosting for `staging.vibeshare.app`
- Static hosting for `app-staging.vibeshare.app`
- Node.js hosting for `api-staging.vibeshare.app`
- Hosted PostgreSQL
- Hosted Redis
- S3-compatible object storage bucket
- TLS certificates for all staging URLs
- Secret manager for staging environment variables

## 2. DNS Targets

```text
staging.vibeshare.app      -> staging site host
app-staging.vibeshare.app  -> staging web app host
api-staging.vibeshare.app  -> staging API host
```

## 3. API Staging Environment

Start from `.env.staging.example`.

Required values:

```text
APP_MODE=production
CORS_ORIGIN=https://app-staging.vibeshare.app
DATABASE_DRIVER=postgres
CACHE_DRIVER=redis
SOCKET_IO_ADAPTER=redis
STORAGE_DRIVER=s3
PUBLIC_SITE_URL=https://staging.vibeshare.app
PUBLIC_WEB_APP_URL=https://app-staging.vibeshare.app
PUBLIC_API_URL=https://api-staging.vibeshare.app
DATABASE_URL=<hosted postgres url>
REDIS_URL=<hosted redis url>
S3_ENDPOINT=<object storage endpoint>
S3_BUCKET=<staging bucket>
S3_ACCESS_KEY_ID=<secret>
S3_SECRET_ACCESS_KEY=<secret>
DEVICE_TRUST_SECRET=<long random secret>
ADMIN_TOKEN=<long random admin token>
AUTH_JWT_SECRET=<long random auth secret>
REQUIRE_DEVICE_TRUST=true
```

## 4. Web Staging Environment

```text
VITE_SERVER_URL=https://api-staging.vibeshare.app
```

## 5. Deploy Order

1. Create hosted PostgreSQL, Redis, and S3 bucket.
2. Put staging secrets into the API host.
3. Deploy API.
4. Point `api-staging.vibeshare.app` to the API host and enable TLS.
5. Run database migration against staging PostgreSQL.
6. Build web with `VITE_SERVER_URL=https://api-staging.vibeshare.app`.
7. Deploy web app.
8. Point `app-staging.vibeshare.app` to the web host and enable TLS.
9. Deploy the staging site.
10. Point `staging.vibeshare.app` to the site host and enable TLS.

## 6. Staging Health Checks

```powershell
curl.exe https://api-staging.vibeshare.app/health
curl.exe https://api-staging.vibeshare.app/api/info
curl.exe https://api-staging.vibeshare.app/admin/status -H "Authorization: Bearer <ADMIN_TOKEN>"
```

Expected:

- `database.active` is `postgres`
- `cache.active` is `redis`
- `realtime.active` is `redis`
- `storage.active` is `s3`
- `fallbackWarnings` is empty
- `mobileServerUrl` is `https://api-staging.vibeshare.app`
- `mobileWebUrl` is `https://app-staging.vibeshare.app`
- no mobile-facing URL contains localhost or a private LAN host

## 7. Staging Product Test

1. Open `https://app-staging.vibeshare.app` on PC.
2. Confirm build/version footer is visible.
3. Scan the QR with phone camera.
4. Confirm mobile web opens over HTTPS.
5. Confirm connected state.
6. Send PC -> phone.
7. Send phone -> PC.
8. Confirm accept/reject behavior.
9. Confirm progress and final states.
10. Close old mobile tab, scan a fresh QR, and confirm auto-join still works.

## 8. Rollback Rule

Do not invite testers if any of these fail:

- `/health`
- `/api/info`
- `/admin/status`
- QR auto-join
- PC -> phone transfer
- phone -> PC transfer
- receiver accept/reject

Rollback the web and API to the last build that passed all seven checks.
