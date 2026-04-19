# Staging Handoff

## Beta Stable Gate

Local beta is considered stable as of 2026-04-19 after QR scan, auto-join, PC -> phone transfer, and phone -> PC transfer were manually confirmed.

Before deploying staging, run:

```powershell
npm.cmd run staging:readiness
```

Use `BETA_STABLE_STATUS.md` for the frozen local baseline and `docs/launch/staging-deploy-checklist.md` for the staging deployment sequence.

Railway API service details are in `docs/launch/railway-api-service.md`. Use the repository root as the Railway source and let `railway.toml` start only `apps/server`.

## Staging URLs

```text
https://staging.vibeshare.app
https://app-staging.vibeshare.app
https://api-staging.vibeshare.app
```

## Required Services

- Static hosting for official site
- Static hosting for web app
- Node.js hosting for API
- PostgreSQL
- Redis
- S3-compatible object storage
- TLS certificates for all public URLs

## Required DNS

```text
staging.vibeshare.app      CNAME/ALIAS  <site-host-target>
app-staging.vibeshare.app  CNAME/ALIAS  <web-host-target>
api-staging.vibeshare.app  CNAME/ALIAS  <api-host-target>
```

## Required Secrets

Use `.env.staging.example` as the checklist.

```text
DATABASE_URL
REDIS_URL
S3_ENDPOINT
S3_BUCKET
S3_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY
DEVICE_TRUST_SECRET
ADMIN_TOKEN
AUTH_JWT_SECRET
MALWARE_SCAN_WEBHOOK_URL
```

## Deploy Order

1. Create DB/cache/storage.
2. Deploy API with staging secrets.
3. Run DB migration.
4. Deploy web app with `VITE_SERVER_URL=https://api-staging.vibeshare.app`.
5. Confirm HTTPS, CORS, and `/api/info`.
6. Run QR join and code join tests.
7. Run PC -> phone and phone -> PC transfer tests.
8. Build EAS preview builds.

## Verify Staging

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
- `mobileServerUrl` is `https://api-staging.vibeshare.app`
- `mobileWebUrl` is `https://app-staging.vibeshare.app`
- no mobile-facing URL contains `localhost`, `127.*`, `0.0.0.0`, or `::1`

## Tester Flow

1. Open `https://app-staging.vibeshare.app` on PC.
2. Scan QR with phone camera.
3. Confirm connected state.
4. Choose send or receive.
5. Transfer a file in both directions.
