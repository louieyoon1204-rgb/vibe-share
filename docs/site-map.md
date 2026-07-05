# Vibe Share Site Map

현재 공개 web-first 배포 기준 사이트 맵입니다.

## Public Surfaces

- `https://app.getvibeshare.com`: 사용자가 여는 Vibe Share 웹앱
- `https://api.getvibeshare.com`: API/relay/health/info 서버

일반 사용자에게는 `https://app.getvibeshare.com`만 안내합니다.

## Current User Flow

1. PC에서 `https://app.getvibeshare.com`을 엽니다.
2. PC 화면에 QR과 6자리 코드가 표시됩니다.
3. 휴대폰 카메라로 QR을 스캔합니다.
4. 휴대폰 브라우저가 연결 화면을 엽니다.
5. 연결 후 보낼지 받을지 선택합니다.
6. 파일을 보내고 받는 쪽에서 수락 또는 거절합니다.
7. 수락하면 다운로드합니다.

## Web App Screens

- `/`: PC 세션 생성, QR, 6자리 코드, 연결 상태
- `/j/6자리코드`: 휴대폰 QR join 화면
- mobile manual mode: 6자리 코드 fallback

## API Surfaces

- `/health`: 운영 health check
- `/api/info`: 공개 web/API URL과 클라이언트 연결 정보 확인
- session API: 세션 생성/참여
- upload/download API: 파일 전송 경로
- Socket.IO: 연결 상태와 전송 이벤트

## Operator Pages

현재 별도 공개 마케팅 사이트는 운영 기본 흐름이 아닙니다. 홍보 CTA는 `https://app.getvibeshare.com`으로 보냅니다.

운영자가 보는 문서:

- `README.md`
- `START_HERE_FIRST.md`
- `LAUNCH_STATUS.md`
- `BETA_OPERATOR_CHECKLIST.md`
- `docs/ops-runbook.md`
- `docs/launch/support-faq.md`
- `deliverables/final-release-ready/OWNER_HANDOFF.md`

## Future Optional Surfaces

- `https://getvibeshare.com`: 별도 마케팅/FAQ/가격 사이트
- `/privacy`: 개인정보 처리방침
- `/terms`: 이용약관
- `/support`: 지원 접수
- `/status`: 공개 상태 페이지

위 항목은 홍보 후 필요하면 별도 사이트로 확장합니다. 현재 필수 사용자 주소는 `https://app.getvibeshare.com`입니다.
