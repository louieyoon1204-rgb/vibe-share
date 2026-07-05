# Vibe Share

Vibe Share는 QR로 PC 웹과 휴대폰 웹을 연결해 파일을 양방향으로 주고받는 web-first 파일 전송 서비스입니다.

현재 공개 사용 주소는 `https://app.getvibeshare.com`입니다. 일반 사용자는 이 주소만 알면 됩니다. `https://api.getvibeshare.com`은 서버/API 주소이므로 운영 확인용이며, 일반 사용자에게 안내할 필요가 없습니다.

## 현재 운영 상태

2026-04-19 기준으로 공개 web-first 버전에서 아래 항목이 확인되었습니다.

- `https://app.getvibeshare.com` 접속 가능
- `https://api.getvibeshare.com/health` 응답 가능
- `https://api.getvibeshare.com/api/info` 응답 가능
- QR 연결 가능
- 6자리 코드 수동 연결 가능
- PC -> phone 파일 전송 가능
- phone -> PC 파일 전송 가능
- 같은 세션에서 양방향 전송 가능
- 받는 쪽 수락/거절 가능
- Railway + Postgres + Redis + Cloudflare R2 + Cloudflare Pages/Domain 구성 완료

공개 API의 `health`/`api/info` 확인값은 Postgres, Redis, R2가 active이고 fallback warning이 없습니다. 현재 응답의 `mode`는 `development`로 표시됩니다. 운영 hardening을 더 강하게 적용하려면 Railway에서 `APP_MODE=production` 전환을 별도 점검 항목으로 처리합니다.

## 사용 방법

1. PC에서 `https://app.getvibeshare.com`을 엽니다.
2. PC 화면에 보이는 QR을 휴대폰 카메라로 스캔합니다.
3. 휴대폰 브라우저에서 연결되면 보낼지 받을지 선택합니다.
4. 파일을 선택하고 받는 쪽에서 수락한 뒤 다운로드합니다.

PC에는 카메라가 필요 없습니다. 휴대폰이 PC 화면의 QR을 한 번 스캔하면 같은 전송 세션에서 PC -> phone, phone -> PC가 모두 가능합니다.

## 6자리 코드 fallback

QR 스캔이 어려우면 PC 화면의 6자리 코드를 휴대폰 화면에 입력합니다. 공개 버전은 공개 HTTPS 주소를 기준으로 연결됩니다.

## 운영자가 자주 보는 주소

```text
사용자 웹앱: https://app.getvibeshare.com
API health:  https://api.getvibeshare.com/health
API info:    https://api.getvibeshare.com/api/info
```

일반 사용자 안내에는 `https://app.getvibeshare.com`만 사용합니다.

## 설치

로컬에서 코드를 확인하거나 개발할 때만 필요합니다.

```powershell
cd C:\Users\ycl12\Desktop\vibe-share
npm.cmd install
```

## 로컬 개발 실행

서버:

```powershell
npm.cmd run dev:server
```

웹:

```powershell
npm.cmd run dev:web
```

모바일 Expo 앱:

```powershell
npm.cmd run dev:mobile
```

현재 공개 배포의 기본 사용 흐름은 web-first입니다. Expo 앱은 개발/향후 네이티브 앱 검증용으로 남겨둡니다.

## 검증 명령

```powershell
npm.cmd install
npm.cmd test
npm.cmd run smoke:integration
npm.cmd run build -w apps/web
npm.cmd run ops:public-check
curl.exe https://api.getvibeshare.com/health
curl.exe https://api.getvibeshare.com/api/info
curl.exe https://app.getvibeshare.com
```

## 운영 체크리스트

- `https://app.getvibeshare.com`이 열린다.
- `https://api.getvibeshare.com/health`가 정상 응답한다.
- `https://api.getvibeshare.com/api/info`에서 공개 web/API 주소가 맞다.
- PC 화면에 QR과 6자리 코드가 보인다.
- 휴대폰 카메라로 QR을 스캔하면 자동 연결된다.
- 6자리 코드로도 연결된다.
- PC -> phone 전송이 된다.
- phone -> PC 전송이 된다.
- 작은 파일과 여러 파일 전송이 된다.
- 받는 쪽에서 수락/거절이 된다.
- 다운로드 버튼이 명확하게 보인다.
- 세션 만료 후 새 QR로 다시 연결된다.
- 연결 실패 시 새 QR로 복구할 수 있다.
- Railway API 로그, Cloudflare Pages 배포 상태, R2 CORS/업로드 상태를 확인할 수 있다.

## 장애 시 먼저 볼 순서

1. `https://api.getvibeshare.com/health`
2. `https://api.getvibeshare.com/api/info`
3. `https://app.getvibeshare.com`
4. Railway API 로그
5. PC 브라우저 `F12` Network/Console
6. Cloudflare Pages 최근 배포 상태
7. Cloudflare R2 bucket, CORS, access key
8. Cloudflare DNS 레코드

상세 절차는 `docs/ops-runbook.md`에 정리되어 있습니다.

## 주요 환경 변수

운영 값은 배포 플랫폼의 secret/environment 설정에 보관합니다. 실제 secret은 저장소에 넣지 않습니다. 아래는 권장 운영 hardening 값입니다.

- `APP_MODE=production` 권장. 현재 공개 API 응답은 `mode=development`로 확인됨.
- `PORT` 또는 `SERVER_PORT`
- `CORS_ORIGIN=https://app.getvibeshare.com`
- `PUBLIC_WEB_APP_URL=https://app.getvibeshare.com`
- `PUBLIC_API_URL=https://api.getvibeshare.com`
- `DATABASE_DRIVER=postgres`
- `DATABASE_URL`
- `CACHE_DRIVER=redis`
- `REDIS_URL`
- `SOCKET_IO_ADAPTER=redis`
- `STORAGE_DRIVER=s3`
- `S3_ENDPOINT`
- `S3_REGION=auto`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_FORCE_PATH_STYLE=false`
- `DEVICE_TRUST_SECRET`
- `ADMIN_TOKEN`
- `AUTH_JWT_SECRET`

## 기본 제한

- 세션 만료 기본값: 30분
- 전송 만료 기본값: 1시간
- cleanup 주기 기본값: 60초
- 일반 최대 파일 크기 기본값: `MAX_FILE_SIZE_GB=100`
- legacy relay 최대 파일 크기 기본값: `LEGACY_RELAY_MAX_FILE_SIZE_MB=100`
- 업로드 청크 기본값: 16MB
- 단일 청크 최대 기본값: 64MB
- signed URL TTL 기본값: 900초
- 허용 MIME 타입은 기본적으로 제한하지 않음

운영 비용, 브라우저 제한, R2 정책에 따라 실제 권장 파일 크기는 더 작게 운영할 수 있습니다.

## 삭제/정리 대상

운영에 연결되지 않은 이전 테스트 프로젝트, 실패한 Workers/Pages 시도, 예전 도메인 연결, 로컬 테스트 스크린샷, `.tmp` 임시 파일, 오래된 환경 변수는 정리 대상입니다.

삭제하면 안 되는 항목:

- `app.getvibeshare.com`
- `api.getvibeshare.com`
- 현재 Railway API 프로젝트
- 현재 Railway Postgres/Redis
- 현재 Cloudflare Pages 프로젝트
- 현재 Cloudflare R2 bucket
- 현재 Cloudflare DNS 레코드

자세한 구분은 `docs/ops-cleanup.md`와 `OWNER_ONLY_FINAL_STEPS.md`를 봅니다.

## 폴더 구조

```text
apps/server      Express + Socket.IO relay/API server
apps/web         공개 web-first PC/mobile UI
apps/mobile      Expo managed app, 개발/향후 네이티브 트랙
packages/shared  shared transfer states and URL utilities
docs             운영, 런치, 지원 문서
scripts          smoke, build, readiness helper scripts
deliverables     final-release-ready handoff package
```

## 홍보만 남음 판정

아래 조건이 모두 충족되면 "홍보만 남음"으로 판단합니다.

- 공개 주소 접속 가능
- QR 연결 가능
- 양방향 파일 전송 가능
- 운영 로그/헬스체크 확인 가능
- 사용자 안내 문서 있음
- FAQ 있음
- 베타 초대 문구 있음
- 지원 템플릿 있음
- 운영 체크리스트 있음
- 홍보 자료 있음

현재 이 저장소는 공개 web-first 배포와 운영/지원/홍보 직전 문서 정리를 마친 상태를 목표로 합니다. 남은 외부 활동은 홍보, 유입, 사용자 반응 수집입니다.
