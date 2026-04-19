# START HERE FIRST

## Beta stable / staging readiness

2026-04-19 기준으로 QR 스캔, 자동 연결, PC -> 휴대폰 전송, 휴대폰 -> PC 전송까지 로컬 베타 기준 확인이 끝났습니다.

staging으로 넘기기 전에는 아래 한 줄을 실행합니다.

```powershell
npm.cmd run staging:readiness
```

상태 기준은 `BETA_STABLE_STATUS.md`, staging 작업 순서는 `docs/launch/staging-deploy-checklist.md`입니다.

GitHub에 올리기 전에는 `GITHUB_UPLOAD_CHECKLIST.md`를 보고 `npm.cmd run github:readiness`를 실행합니다. Railway API 서비스는 repo root에서 만들고 `railway.toml`이 `apps/server`만 시작하게 둡니다.

## Web-first 베타 사용 안내

1. 기본 흐름은 QR 스캔 -> 연결 -> 전송입니다.
2. 전송 중 페이지를 벗어나면 연결이 끊길 수 있습니다.
3. 다시 돌아오면 자동 복구를 시도합니다.
4. 장시간 background 전송은 future native app track입니다.

휴대폰과 PC는 같은 WiFi 또는 같은 핫스팟에 연결되어 있어야 합니다.
연결이 실패하면 같은 WiFi인지 먼저 확인하세요.
아이폰에서 `http://현재_LAN_IP:4000/health`가 열려야 QR 연결도 가능합니다. 안 열리면 네트워크/방화벽 문제를 먼저 해결해야 합니다.

전송 중에는 이 페이지를 닫거나 다른 앱으로 나가지 마세요. 페이지를 벗어나면 연결이 끊길 수 있습니다.

Vibe Share는 PC 웹과 휴대폰을 QR로 먼저 연결한 뒤, 같은 연결 안에서 파일을 양방향으로 주고받는 web-first 전송 앱입니다. PC에는 카메라가 필요 없습니다.

## iPhone Safari 일반 모드 팁

- QR 스캔으로 열린 `/j/6자리코드`는 저장된 예전 연결보다 항상 우선합니다.
- `연결 시도 중`에 오래 머물면 `연결 정보 초기화`를 누르고, 예전 Safari 탭을 닫은 뒤 새 QR을 다시 스캔합니다.
- 화면 아래 build/version이 바뀌면 이전 build에서 저장된 상태가 자동 초기화될 수 있습니다.

## 사용자 흐름

1. PC 웹 열기
2. 휴대폰 카메라로 QR 스캔
3. 연결 후 보낼지 받을지 선택
4. 파일 전송

## 지금 repo 상태

완료된 내부 작업:

- PC 웹은 큰 QR, 6자리 코드, 연결 상태를 먼저 보여줍니다.
- QR은 `/j/6자리코드` 형태의 짧은 모바일 웹 URL입니다.
- 휴대폰은 QR 또는 6자리 코드로 연결됩니다.
- 연결 전에는 파일 선택을 앞에 두지 않습니다.
- 연결 후 PC에는 `휴대폰으로 파일 보내기`, `휴대폰에서 파일 받기`가 보입니다.
- 연결 후 모바일 웹에는 `PC로 파일 보내기`, `PC에서 파일 받기`가 보입니다.
- PC -> 휴대폰, 휴대폰 -> PC 전송이 모두 동작합니다.
- 모바일-facing URL에서 `localhost`, `127.0.0.1`, `0.0.0.0`, `::1`을 차단합니다.
- production-like local mode는 PostgreSQL, Redis, MinIO(S3-compatible)를 사용합니다.
- TestFlight / Google Play internal testing용 EAS profiles와 문서가 준비되어 있습니다.

외부에서만 할 일은 `OWNER_ONLY_FINAL_STEPS.md`에만 남겼습니다.

## 가장 빠른 로컬 실행

```powershell
cd C:\Users\ycl12\Desktop\vibe-share
npm.cmd install
powershell -ExecutionPolicy Bypass -File scripts\start-production-like.ps1 -ResetInfra
```

PC에서 여는 주소:

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

## 웹이 안 열릴 때

아래 한 줄로 오래된 dev 프로세스, 포트, Docker infra를 정리하고 다시 올립니다.

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-production-like.ps1 -ResetInfra
```

## 전체 검증

```powershell
powershell -ExecutionPolicy Bypass -File scripts\run-full-check.ps1
```

통과 범위:

- `npm install`
- `npm test`
- integration smoke
- MinIO smoke
- cleanup
- web build
- Expo iOS export
- Docker infra
- DB migration
- `/`, `/health`, `/admin/health`, `/admin/status`, `/api/info`
- configured driver integration smoke

## 배포 준비 문서

```text
docs/deployment.md
docs/launch/staging-handoff.md
docs/launch/staging-deploy-checklist.md
docs/launch/railway-api-service.md
docs/launch/mobile-build-handoff.md
docs/launch/store-submission-checklist.md
docs/launch/app-store-copy.md
docs/launch/play-store-copy.md
BETA_STABLE_STATUS.md
GITHUB_UPLOAD_CHECKLIST.md
OWNER_ONLY_FINAL_STEPS.md
```
