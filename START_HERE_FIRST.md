# START HERE FIRST

Vibe Share 운영자가 가장 먼저 볼 문서입니다.

## 지금 사용 가능한 주소

```text
사용자 주소: https://app.getvibeshare.com
API 주소:    https://api.getvibeshare.com
```

일반 사용자에게는 `https://app.getvibeshare.com`만 안내합니다. `https://api.getvibeshare.com`은 운영 확인용입니다.

## 현재 기본 버전

현재 기본은 web-first 공개 버전입니다.

- PC는 웹앱을 엽니다.
- 휴대폰은 PC 화면의 QR을 스캔합니다.
- 휴대폰 브라우저가 연결 화면을 엽니다.
- 연결 후 PC -> phone, phone -> PC를 같은 세션에서 선택합니다.
- PC에는 카메라가 필요 없습니다.

공개 버전 사용자 안내는 공개 HTTPS 주소 기준으로만 작성합니다.

## 오늘 확인할 것

1. PC에서 `https://app.getvibeshare.com`을 엽니다.
2. QR과 6자리 코드가 보이는지 확인합니다.
3. 휴대폰 카메라로 QR을 스캔합니다.
4. 자동 연결되는지 확인합니다.
5. 6자리 코드 fallback도 확인합니다.
6. PC -> phone 작은 파일 전송을 확인합니다.
7. phone -> PC 작은 파일 전송을 확인합니다.
8. 받는 쪽 수락/거절을 각각 확인합니다.
9. 다운로드 버튼이 보이는지 확인합니다.
10. `https://api.getvibeshare.com/health`와 `/api/info`를 확인합니다.

## 운영자가 읽을 순서

1. `LAUNCH_STATUS.md`
2. `BETA_OPERATOR_CHECKLIST.md`
3. `docs/ops-runbook.md`
4. `docs/ops-cleanup.md`
5. `docs/launch/support-faq.md`
6. `deliverables/final-release-ready/OWNER_HANDOFF.md`

## 가장 많이 쓰는 명령

```powershell
cd C:\Users\ycl12\Desktop\vibe-share
npm.cmd install
npm.cmd test
npm.cmd run smoke:integration
npm.cmd run build -w apps/web
```

공개 배포 확인:

```powershell
curl.exe https://api.getvibeshare.com/health
curl.exe https://api.getvibeshare.com/api/info
curl.exe https://app.getvibeshare.com
```

## 장애 시 바로 볼 순서

1. `https://api.getvibeshare.com/health`
2. `https://api.getvibeshare.com/api/info`
3. `https://app.getvibeshare.com`
4. Railway API 로그
5. 브라우저 F12 Network/Console
6. Cloudflare Pages 최근 배포
7. R2 CORS / bucket / key
8. DNS

## 홍보 직전 결론

아래가 모두 참이면 홍보만 남은 상태입니다.

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

현재 목표는 기능 추가가 아니라 운영 마감, 사용자 안내, 지원 템플릿, 홍보 직전 자산 정리입니다.
