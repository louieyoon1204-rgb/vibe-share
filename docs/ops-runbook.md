# Ops Runbook

Vibe Share 공개 web-first 운영 중 장애가 났을 때 보는 순서입니다.

## 서비스 지도

```text
사용자 웹앱: https://app.getvibeshare.com
API 서버:    https://api.getvibeshare.com
```

일반 사용자에게는 사용자 웹앱 주소만 안내합니다. API 주소는 운영자 확인용입니다.

현재 운영 인프라:

- Cloudflare Domain/DNS
- Cloudflare Pages for web app
- Railway API service
- Railway Postgres
- Railway Redis
- Cloudflare R2 object storage

## 장애 대응 순서

1. `https://api.getvibeshare.com/health`를 연다.
2. `https://api.getvibeshare.com/api/info`를 연다.
3. `https://app.getvibeshare.com`을 연다.
4. Railway API 로그를 본다.
5. PC 브라우저에서 `F12`를 열고 Network/Console을 본다.
6. Cloudflare Pages 최근 배포 상태를 본다.
7. R2 CORS, bucket, access key를 본다.
8. Cloudflare DNS 레코드를 본다.

## 1. API health

```powershell
curl.exe https://api.getvibeshare.com/health
```

정상 기대값:

- HTTP 200
- `ok` 또는 정상 상태를 나타내는 응답
- 응답이 너무 오래 걸리지 않음

실패하면 먼저 Railway API 서비스 상태와 로그를 봅니다.

## 2. API info

```powershell
curl.exe https://api.getvibeshare.com/api/info
```

확인할 것:

- public API URL이 `https://api.getvibeshare.com`인지
- public web URL이 `https://app.getvibeshare.com`인지
- 모바일 연결 URL이 localhost나 private LAN 주소가 아닌지

## 3. Web app

```powershell
curl.exe https://app.getvibeshare.com
```

브라우저에서도 직접 확인합니다.

확인할 것:

- 화면이 흰 화면이 아닌지
- QR과 6자리 코드가 보이는지
- 휴대폰 QR 스캔 후 `/j/6자리코드` 화면이 열리는지
- Console에 API 연결 오류가 없는지

## 4. Railway API 로그

먼저 볼 로그:

- 서버 시작 로그
- config validation 경고/오류
- Postgres 연결 오류
- Redis 연결 오류
- R2/S3 업로드 오류
- Socket.IO 연결/해제 로그
- 4xx/5xx 요청 로그

자주 보는 원인:

- 환경 변수 누락
- `CORS_ORIGIN` 불일치
- Redis 연결 실패
- Postgres 연결 실패
- R2 access key 만료 또는 권한 오류
- R2 CORS 오류

## 5. 브라우저 F12

PC에서 `https://app.getvibeshare.com`을 연 뒤 `F12`를 누릅니다.

Network:

- `/api/sessions`
- `/api/info`
- Socket.IO 요청
- upload/download 요청

Console:

- CORS 오류
- WebSocket 오류
- fetch 실패
- 런타임 오류

## 6. Cloudflare Pages

확인할 것:

- 최근 배포가 성공 상태인지
- 커스텀 도메인 `app.getvibeshare.com`이 연결되어 있는지
- 빌드 환경 변수 `VITE_SERVER_URL=https://api.getvibeshare.com`이 맞는지
- 이전 실패 배포가 활성화되지 않았는지

## 7. Cloudflare R2

확인할 것:

- bucket이 존재하는지
- R2 S3 API key가 살아 있는지
- API 서비스 환경 변수와 key가 일치하는지
- CORS가 web app origin을 허용하는지
- 업로드 객체가 생성되는지
- 만료/cleanup 정책이 과도하게 빨리 삭제하지 않는지

운영 기본값:

```text
S3_REGION=auto
S3_FORCE_PATH_STYLE=false
```

## 8. DNS

확인할 것:

- `app.getvibeshare.com`이 Cloudflare Pages로 연결됨
- `api.getvibeshare.com`이 Railway API로 연결됨
- TLS 인증서가 정상
- 예전 테스트 레코드가 현재 운영 레코드를 덮지 않음

## 사용자 문의 1차 답변

### QR이 안 됩니다

PC에서 새 QR을 만든 뒤 휴대폰 기본 카메라로 다시 스캔해 주세요. QR이 계속 안 되면 6자리 코드를 입력해 주세요.

### 연결됐는데 파일이 안 옵니다

받는 쪽에서 수락해야 다운로드가 시작됩니다. 화면에 뜬 파일 이름과 크기를 확인한 뒤 수락해 주세요.

### 다운로드 위치를 모르겠습니다

iPhone은 Safari 다운로드 또는 파일 앱 Downloads 폴더를 확인해 주세요. PC는 브라우저의 기본 다운로드 폴더를 확인해 주세요.

### 서버 주소가 뭔가요

일반 사용자는 서버 주소를 알 필요가 없습니다. `https://app.getvibeshare.com`만 열면 됩니다.

## 운영 점검 주기

매일:

- health 확인
- web app 접속 확인
- Railway 오류 로그 확인
- R2 사용량/오류 확인

홍보 게시 직전:

- QR 연결
- 6자리 코드
- PC -> phone
- phone -> PC
- 수락/거절
- 다운로드

장애 후:

- `docs/launch/incident-report-template.md`로 기록
- 같은 문의가 반복되면 `docs/launch/support-faq.md` 갱신
