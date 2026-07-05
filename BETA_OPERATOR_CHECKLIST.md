# Beta Operator Checklist

홍보나 테스터 초대 직전에 운영자가 그대로 따라 하는 체크리스트입니다.

## 1. 공개 서비스 열림

- [ ] PC에서 `https://app.getvibeshare.com`이 열린다.
- [ ] `https://api.getvibeshare.com/health`가 정상 응답한다.
- [ ] `https://api.getvibeshare.com/api/info`가 정상 응답한다.
- [ ] 일반 사용자 안내에는 `https://app.getvibeshare.com`만 적혀 있다.

## 2. 연결

- [ ] PC 화면에 QR이 보인다.
- [ ] PC 화면에 6자리 코드가 보인다.
- [ ] 휴대폰 카메라로 QR을 스캔하면 연결된다.
- [ ] 6자리 코드를 직접 입력해도 연결된다.
- [ ] 연결 상태가 PC와 휴대폰 양쪽에서 명확하게 보인다.

## 3. PC -> phone

- [ ] PC에서 `휴대폰으로 파일 보내기`를 누른다.
- [ ] 작은 파일 1개를 보낸다.
- [ ] 여러 파일을 보낸다.
- [ ] 휴대폰에서 파일 메타데이터를 확인한다.
- [ ] 휴대폰에서 수락 후 다운로드한다.
- [ ] 휴대폰에서 거절했을 때 PC에 실패/거절 상태가 보인다.

## 4. phone -> PC

- [ ] 휴대폰에서 `PC로 파일 보내기`를 누른다.
- [ ] 작은 파일 1개를 보낸다.
- [ ] 여러 파일을 보낸다.
- [ ] PC에서 파일 메타데이터를 확인한다.
- [ ] PC에서 수락 후 다운로드한다.
- [ ] PC에서 거절했을 때 휴대폰에 실패/거절 상태가 보인다.

## 5. 세션과 복구

- [ ] 세션 만료 후 새 QR을 만들 수 있다.
- [ ] 연결이 끊겼을 때 새 QR로 다시 연결할 수 있다.
- [ ] 전송 중 페이지를 닫으면 실패할 수 있다는 안내가 보인다.
- [ ] 실패 메시지가 한국어로 이해 가능하다.

## 6. 운영 확인

- [ ] Railway API 로그에서 최근 요청이 보인다.
- [ ] Railway Postgres/Redis가 정상 상태다.
- [ ] Cloudflare Pages 최근 배포가 성공 상태다.
- [ ] Cloudflare DNS에서 `app.getvibeshare.com`과 `api.getvibeshare.com`이 유지되어 있다.
- [ ] R2 bucket이 존재한다.
- [ ] R2 CORS와 업로드 권한이 현재 운영 값과 맞다.
- [ ] 오래된 테스트 파일/임시 파일이 필요 이상으로 쌓이지 않았다.

## 7. 홍보 시작 전 마지막 체크

- [ ] `docs/launch/landing-page-copy.md`가 현재 주소를 사용한다.
- [ ] `docs/launch/support-faq.md`가 현재 web-first 흐름을 설명한다.
- [ ] `docs/launch/beta-invite-email.md`에 사용자 주소가 들어 있다.
- [ ] `docs/launch/tester-feedback-template.md`가 최신 질문을 담고 있다.
- [ ] `deliverables/final-release-ready/PROMO_READY_STATUS.md`가 "홍보만 남음"으로 정리되어 있다.

## 8. 실행 명령

```powershell
cd C:\Users\ycl12\Desktop\vibe-share
npm.cmd install
npm.cmd test
npm.cmd run smoke:integration
npm.cmd run build -w apps/web
npm.cmd run ops:public-check
curl.exe https://api.getvibeshare.com/health
curl.exe https://api.getvibeshare.com/api/info
curl.exe https://app.getvibeshare.com
```
