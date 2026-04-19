# GitHub Upload Checklist

Use this when the local beta-stable baseline is ready to upload.

## 1. Local Readiness

```powershell
cd C:\Users\ycl12\Desktop\vibe-share
npm.cmd install
npm.cmd run staging:readiness
npm.cmd run github:readiness
```

## 2. Files That Must Not Be Uploaded

These are ignored by `.gitignore`:

- `.env`
- `.env.local`
- `.tmp/`
- `.codex/`
- `node_modules/`
- `apps/*/node_modules/`
- `deliverables/`
- private keys and signing files

The example files should be uploaded:

- `.env.example`
- `.env.production-like.example`
- `.env.staging.example`

## 3. Railway API Service

Railway should deploy only the API service, but use the repository root as the Railway source.

Reason: `apps/server` depends on `packages/shared` through npm workspaces.

Use:

- Config file: `/railway.toml`
- Start command: `node apps/server/src/index.js`
- Pre-deploy command: `npm run db:migrate`
- Healthcheck path: `/health`

Do not set Railway Root Directory to `/apps/server` for this repo shape.

## 4. First Commit

```powershell
git status --short
git add .
git commit -m "beta stable staging-ready baseline"
git branch -M main
```

## 5. Push To GitHub

Create an empty GitHub repository first, then run:

```powershell
git remote add origin https://github.com/YOUR_ACCOUNT/vibe-share.git
git push -u origin main
```

After the push, create one Railway service from this GitHub repo and keep only the API service active.
