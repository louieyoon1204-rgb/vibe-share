# Owner-only Final Steps

Codex가 내부 코드, 검증, 문서, 패키징까지 마친 뒤에도 외부에서만 할 수 있는 일만 남겼습니다.

1. `vibeshare.app` 도메인을 구매하고 DNS를 연결한다.
   - `vibeshare.app`
   - `app.vibeshare.app`
   - `api.vibeshare.app`
   - `staging.vibeshare.app`
   - `app-staging.vibeshare.app`
   - `api-staging.vibeshare.app`

2. 호스팅 계정을 만들고 staging/production 서비스를 생성한다.
   - static site
   - static web app
   - Node.js API
   - PostgreSQL
   - Redis
   - S3-compatible storage

3. Apple Developer Program과 Google Play Console 계정을 준비한다.

4. Expo/EAS에 로그인하고 프로젝트를 연결한다.

```powershell
npx eas-cli login
npx eas-cli init
```

5. staging/production secrets를 발급해서 호스팅 secret manager에 넣는다.
   - `DATABASE_URL`
   - `REDIS_URL`
   - `S3_ENDPOINT`
   - `S3_BUCKET`
   - `S3_ACCESS_KEY_ID`
   - `S3_SECRET_ACCESS_KEY`
   - `DEVICE_TRUST_SECRET`
   - `ADMIN_TOKEN`
   - `AUTH_JWT_SECRET`
   - `MALWARE_SCAN_WEBHOOK_URL`

6. Privacy Policy, Terms, Support, Security 페이지를 법무/개인정보 기준으로 검토하고 공개한다.

7. placeholder 아이콘, splash, feature graphic, 스크린샷을 최종 브랜드 자산으로 교체한다.

8. staging URL이 실제로 열린 뒤 Codex에 다시 요청한다.

```text
staging URL과 secrets를 넣었으니 full verification과 EAS preview build 준비 상태를 다시 확인해줘.
```
