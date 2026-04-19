# Vibe Share

## Beta stable / staging readiness

2026-04-19 기준으로 iPhone QR 인식, 모바일 웹 자동 연결, PC -> 휴대폰 전송, 휴대폰 -> PC 전송이 로컬 베타 기준에서 확인되었습니다.

staging 배포를 시작하기 전에는 아래 명령을 통과시킵니다.

```powershell
cd C:\Users\ycl12\Desktop\vibe-share
npm.cmd run staging:readiness
```

현재 베타 기준은 `BETA_STABLE_STATUS.md`, staging 배포 절차는 `docs/launch/staging-deploy-checklist.md`를 기준으로 봅니다.

GitHub 업로드 직전에는 `GITHUB_UPLOAD_CHECKLIST.md`를 확인하고 `npm.cmd run github:readiness`를 실행합니다. Railway API 서비스는 repo root를 소스로 두되 `railway.toml`로 `apps/server`만 실행합니다.

## Web-first 베타 사용 안내

1. 기본 흐름은 QR 스캔 -> 연결 -> 전송입니다.
2. 전송 중 페이지를 벗어나면 연결이 끊길 수 있습니다.
3. 다시 돌아오면 자동 복구를 시도합니다.
4. 장시간 background 전송은 future native app track입니다.

휴대폰과 PC는 같은 WiFi 또는 같은 핫스팟에 연결되어 있어야 합니다.
연결이 실패하면 같은 WiFi인지 먼저 확인하세요.
아이폰에서 `http://현재_LAN_IP:4000/health`가 열려야 QR 연결도 가능합니다. 안 열리면 네트워크/방화벽 문제를 먼저 해결해야 합니다.

전송 중에는 이 페이지를 닫거나 다른 앱으로 나가지 마세요. 페이지를 벗어나면 연결이 끊길 수 있습니다.

Vibe Share는 PC 웹과 휴대폰을 QR로 먼저 연결한 뒤, 같은 연결 안에서 파일을 양방향으로 주고받는 MVP입니다. PC에는 카메라가 필요 없습니다. 휴대폰이 PC 화면의 QR을 한 번 스캔하면 연결됩니다.

## Safari 일반 모드 연결 팁

- QR 스캔으로 열린 `/j/6자리코드` 주소가 항상 현재 QR 세션보다 우선합니다.
- iPhone Safari 일반 모드에서 `연결 시도 중`에 머물면 고급 영역의 `연결 정보 초기화`를 누른 뒤 PC의 새 QR을 다시 스캔하세요.
- 화면 아래의 작은 build/version 값이 바뀌면 예전 연결 상태가 자동으로 초기화될 수 있습니다.
- 이상하면 예전 Safari 탭을 닫고 PC에서 새 QR을 만든 뒤 다시 스캔하세요.

## 빠른 사용 순서

1. PC 웹 열기
2. 휴대폰 카메라로 QR 스캔
3. 연결 후 보낼지 받을지 선택
4. 파일 전송

## 현재 UX

PC 웹을 열면 파일 선택보다 먼저 큰 QR, 6자리 코드, 연결 상태가 보입니다. 휴대폰이 연결되기 전에는 전송 방향을 고르지 않습니다.

연결 후:

- PC: `휴대폰으로 파일 보내기`, `휴대폰에서 파일 받기`
- 모바일 웹: `PC로 파일 보내기`, `PC에서 파일 받기`

QR은 `/j/6자리코드` 형태의 짧은 모바일 웹 주소입니다. 기본 흐름에서는 Expo Go QR이나 앱 내부 스캐너를 쓰지 않습니다.

## 설치

```powershell
cd C:\Users\ycl12\Desktop\vibe-share
npm.cmd install
```

## 가장 안정적인 로컬 실행

Docker Desktop을 켠 뒤 실행합니다.

```powershell
cd C:\Users\ycl12\Desktop\vibe-share
powershell -ExecutionPolicy Bypass -File scripts\start-production-like.ps1 -ResetInfra
```

PC 브라우저에서 엽니다.

```text
http://localhost:5173
```

상태 확인:

```powershell
curl.exe http://localhost:4000/health
curl.exe http://localhost:4000/admin/status
curl.exe http://localhost:4000/api/info
curl.exe http://localhost:5173
```

아이폰 연결 전 네트워크 진단:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\check-local-network.ps1
```

## 개발 모드로 따로 실행

PowerShell 창 2개를 엽니다.

창 1:

```powershell
cd C:\Users\ycl12\Desktop\vibe-share
npm.cmd run dev:server
```

창 2:

```powershell
cd C:\Users\ycl12\Desktop\vibe-share
npm.cmd run dev:web
```

## iPhone / Android 테스트

1. PC에서 `http://localhost:5173`을 엽니다.
2. 휴대폰 기본 카메라로 PC 화면의 QR을 스캔합니다.
3. 휴대폰 브라우저가 `http://PC_LAN_IP:5173/j/123456` 형태로 열리는지 확인합니다.
4. 연결됨 상태가 보이면 보낼지 받을지 선택합니다.

휴대폰에서 `localhost`를 직접 열면 안 됩니다. 휴대폰의 `localhost`는 PC가 아니라 휴대폰 자기 자신입니다. Vibe Share는 모바일-facing URL에서 `localhost`, `127.0.0.1`, `0.0.0.0`, `::1`을 자동으로 막습니다.

## PC -> 휴대폰

1. PC와 휴대폰을 QR로 연결합니다.
2. PC에서 `휴대폰으로 파일 보내기`를 누릅니다.
3. 파일을 선택합니다.
4. 휴대폰의 같은 페이지에서 파일 받기 모달이 뜨면 `다운로드`를 누릅니다.
5. Safari/브라우저 다운로드 또는 Files 앱 Downloads 폴더에서 확인합니다.

## 휴대폰 -> PC

1. PC와 휴대폰을 QR로 연결합니다.
2. 휴대폰에서 `PC로 파일 보내기`를 누릅니다.
3. 파일을 선택합니다.
4. PC에서 받기 요청을 수락하고 다운로드합니다.

## 전체 검증

```powershell
cd C:\Users\ycl12\Desktop\vibe-share
powershell -ExecutionPolicy Bypass -File scripts\run-full-check.ps1
```

이 스크립트는 다음을 실행합니다.

- `npm install`
- `npm test`
- integration smoke
- MinIO smoke
- cleanup
- web build
- Expo iOS export
- Docker infra
- DB migration
- API curl checks
- configured driver smoke

## 주요 환경 변수

로컬 기본 실행은 `.env` 없이도 동작합니다. production-like 또는 staging에서는 `.env.production-like.example`, `.env.staging.example`, `.env.example`을 기준으로 값을 넣습니다.

- `PORT`: API server port, default `4000`
- `WEB_DEV_PORT`: web dev port, default `5173`
- `VITE_SERVER_URL`: web app API URL
- `PUBLIC_WEB_APP_URL`: public web app URL
- `PUBLIC_API_URL`: public API URL
- `DATABASE_URL`: PostgreSQL URL
- `REDIS_URL`: Redis URL
- `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`: S3-compatible storage. Cloudflare R2 uses `S3_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com`, `S3_REGION=auto`, `S3_FORCE_PATH_STYLE=false`.
- `DEVICE_TRUST_SECRET`, `ADMIN_TOKEN`, `AUTH_JWT_SECRET`: staging/production secrets

## 폴더 구조

```text
apps/server      Express + Socket.IO API/relay server
apps/web         PC web and mobile web join UI
apps/mobile      Expo app for EAS/TestFlight/Play internal testing
packages/shared  shared transfer states and URL utilities
docs/            deployment, launch, and handoff docs
scripts/         restart, verification, and deliverable scripts
```

## 배포 준비 문서

```text
START_HERE_FIRST.md
LAUNCH_STATUS.md
OWNER_ONLY_FINAL_STEPS.md
docs/deployment.md
docs/launch/staging-handoff.md
docs/launch/staging-deploy-checklist.md
docs/launch/railway-api-service.md
docs/launch/mobile-build-handoff.md
docs/launch/store-submission-checklist.md
BETA_STABLE_STATUS.md
GITHUB_UPLOAD_CHECKLIST.md
```

## 현재 한계

- 공개 계정/로그인은 아직 없습니다.
- 결제는 아직 없습니다.
- 실제 malware scanner는 외부 서비스 연결 전입니다.
- 대용량 native background upload는 store beta 이후 과제입니다.
- Privacy/Terms는 외부 법무 검토가 필요합니다.
