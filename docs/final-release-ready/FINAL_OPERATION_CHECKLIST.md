# Final Operation Checklist

홍보 당일 아침에 이 문서만 따라 해도 됩니다.

## 서비스 열림

- [ ] `https://app.getvibeshare.com` 접속
- [ ] `https://api.getvibeshare.com/health` 확인
- [ ] `https://api.getvibeshare.com/api/info` 확인

## 연결

- [ ] PC 화면에 QR 표시
- [ ] PC 화면에 6자리 코드 표시
- [ ] 휴대폰 QR 스캔
- [ ] 자동 연결
- [ ] 6자리 코드 fallback

## 전송

- [ ] PC -> phone 작은 파일
- [ ] phone -> PC 작은 파일
- [ ] 여러 파일
- [ ] 수락
- [ ] 거절
- [ ] 다운로드

## 세션

- [ ] 세션 만료 후 새 QR 생성
- [ ] 연결 실패 후 새 QR로 복구
- [ ] 전송 중 페이지 이탈 안내 확인

## 인프라

- [ ] Railway API 로그 확인
- [ ] Railway Postgres 정상
- [ ] Railway Redis 정상
- [ ] Cloudflare Pages 최근 배포 성공
- [ ] Cloudflare DNS 레코드 유지
- [ ] R2 bucket 확인
- [ ] R2 CORS 확인
- [ ] R2 업로드 확인

## 문서

- [ ] `README.md`
- [ ] `START_HERE_FIRST.md`
- [ ] `LAUNCH_STATUS.md`
- [ ] `BETA_OPERATOR_CHECKLIST.md`
- [ ] `docs/ops-runbook.md`
- [ ] `docs/launch/support-faq.md`
- [ ] `docs/launch/beta-invite-email.md`
- [ ] `docs/launch/tester-feedback-template.md`

## 완료 판정

위 항목이 모두 통과하면 홍보를 시작합니다.
