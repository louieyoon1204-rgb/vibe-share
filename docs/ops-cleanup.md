# Ops Cleanup

운영에 필요한 것과 정리할 것을 구분한 문서입니다.

## 지금 삭제/정리할 것

현재 운영 도메인에 연결되어 있지 않은 항목만 정리합니다.

- 옛 테스트용 Railway 프로젝트
- 실패한 Railway 서비스
- 실패한 Cloudflare Workers 시도
- 실패한 Cloudflare Pages 시도
- 예전 `getvibeshare.com` 계열 도메인 연결
- staging/preview 전용으로 만들었지만 더 이상 쓰지 않는 도메인
- 임시 tunnel/ngrok 주소
- 로컬 테스트 스크린샷
- 로컬 테스트 다운로드 파일
- `.tmp` 아래 오래된 업로드/metadata 파일
- 더 이상 쓰지 않는 `.env` 값
- 더 이상 쓰지 않는 R2 access key
- 더 이상 쓰지 않는 Postgres/Redis 인스턴스
- 더 이상 쓰지 않는 Cloudflare DNS 레코드

## 삭제하면 안 되는 것

- `https://app.getvibeshare.com`
- `https://api.getvibeshare.com`
- 현재 Railway API 서비스
- 현재 Railway Postgres
- 현재 Railway Redis
- 현재 Cloudflare Pages 프로젝트
- 현재 Cloudflare DNS zone
- 현재 Cloudflare DNS 레코드
- 현재 Cloudflare R2 bucket
- 현재 R2 CORS 설정
- 현재 운영 환경 변수
- Git 저장소
- `package-lock.json`
- `.env.example`
- `.env.staging.example`
- `.env.production-like.example`

## 정리 전 확인 방법

1. 해당 프로젝트나 레코드가 `app.getvibeshare.com`에 연결되어 있는지 확인합니다.
2. 해당 프로젝트나 레코드가 `api.getvibeshare.com`에 연결되어 있는지 확인합니다.
3. Railway API 환경 변수에서 참조하고 있는지 확인합니다.
4. Cloudflare Pages 환경 변수에서 참조하고 있는지 확인합니다.
5. R2 bucket/key가 현재 API 서비스에서 사용 중인지 확인합니다.

하나라도 현재 운영 경로에 연결되어 있으면 삭제하지 않습니다.

## 운영에 남겨둘 핵심 인프라

- Domain: `getvibeshare.com`
- Web: `app.getvibeshare.com`
- API: `api.getvibeshare.com`
- API hosting: Railway
- Database: Railway Postgres
- Cache/realtime: Railway Redis
- Object storage: Cloudflare R2
- Web hosting: Cloudflare Pages
- DNS/TLS: Cloudflare

## 로컬 파일 정리

로컬에서 정리 가능한 후보:

- `.tmp/uploads`
- `.tmp/metadata.json`
- 오래된 smoke test 산출물
- 개인 스크린샷
- 다운로드한 테스트 파일

단, 테스트를 다시 돌릴 예정이면 `.tmp`는 자동으로 다시 생성될 수 있습니다.
