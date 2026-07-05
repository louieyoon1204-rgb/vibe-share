# Owner-only Final Steps

외부 계정 소유자만 할 수 있는 운영 마무리와 정리 항목입니다. 현재 공개 web-first 배포는 완료된 상태로 봅니다.

## 삭제/정리할 것

아래 항목은 현재 운영에 연결되어 있지 않다면 삭제하거나 보관함으로 이동합니다.

- 옛 테스트용 Railway 프로젝트
- 실패한 Cloudflare Workers 시도
- 실패한 Cloudflare Pages 시도
- 예전 staging, preview, 임시 도메인 연결
- 임시 ngrok/tunnel 주소
- 로컬 테스트 스크린샷
- 로컬 테스트 다운로드 파일
- `.tmp` 아래 테스트 업로드 파일
- 더 이상 쓰지 않는 환경 변수
- 더 이상 쓰지 않는 R2 access key
- 더 이상 쓰지 않는 Postgres/Redis 인스턴스

삭제 전에는 현재 활성 도메인과 연결되어 있지 않은지 확인합니다.

## 삭제하면 안 되는 것

- `https://app.getvibeshare.com`
- `https://api.getvibeshare.com`
- 현재 Railway API 서비스
- 현재 Railway Postgres
- 현재 Railway Redis
- 현재 Cloudflare Pages 프로젝트
- 현재 Cloudflare DNS zone과 활성 레코드
- 현재 Cloudflare R2 bucket
- 현재 운영 secret/environment 변수
- Git 저장소와 최신 `main` 브랜치

## 운영자가 유지/검토할 설정

API:

- `APP_MODE=production` 권장. 현재 공개 API 확인값은 `mode=development`입니다.
- `CORS_ORIGIN=https://app.getvibeshare.com`
- `PUBLIC_WEB_APP_URL=https://app.getvibeshare.com`
- `PUBLIC_API_URL=https://api.getvibeshare.com`
- `DATABASE_DRIVER=postgres`
- `CACHE_DRIVER=redis`
- `SOCKET_IO_ADAPTER=redis`
- `STORAGE_DRIVER=s3`

Web:

- `VITE_SERVER_URL=https://api.getvibeshare.com`

Storage:

- Cloudflare R2 bucket
- R2 CORS
- R2 S3 API access key
- `S3_REGION=auto`
- `S3_FORCE_PATH_STYLE=false`

## 홍보 전 마지막 수동 확인

1. PC에서 `https://app.getvibeshare.com`을 엽니다.
2. 휴대폰으로 QR을 스캔합니다.
3. PC -> phone 작은 파일 전송을 합니다.
4. phone -> PC 작은 파일 전송을 합니다.
5. 6자리 코드 fallback을 확인합니다.
6. `https://api.getvibeshare.com/health`를 확인합니다.
7. `https://api.getvibeshare.com/api/info`를 확인합니다.
8. Railway 로그에서 최근 요청을 확인합니다.
9. Cloudflare Pages 최근 배포가 성공인지 확인합니다.
10. R2 업로드가 정상인지 확인합니다.

## 이제 남은 것

- 홍보 게시
- 유입 측정
- 사용자 피드백 수집
- 반복 문의를 FAQ에 반영
- 가격/계정/네이티브 앱 우선순위 결정

기능 개발은 홍보 후 실제 사용자 반응을 보고 결정합니다.
