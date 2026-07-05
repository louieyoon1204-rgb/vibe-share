# Owner Handoff

## 한 줄 결론

Vibe Share는 공개 web-first 배포가 끝났고, 이제 홍보/유입/반응 수집만 남았습니다.

## 지금 이미 끝난 것

- `https://app.getvibeshare.com` 공개 웹앱 정상
- `https://api.getvibeshare.com` 공개 API 정상
- QR 연결 정상
- 6자리 코드 fallback 정상
- PC -> phone 전송 성공
- phone -> PC 전송 성공
- 같은 세션에서 양방향 전송 성공
- 받는 쪽 수락/거절 가능
- 다운로드/저장 액션 가능
- Railway API 운영 구성
- Railway Postgres/Redis 구성
- Cloudflare Pages/Domain 구성
- Cloudflare R2 구성
- 운영 문서, FAQ, 베타 초대 문구, 지원 템플릿, 장애 보고 템플릿 정리

## 사용자에게 안내할 주소

```text
https://app.getvibeshare.com
```

일반 사용자에게 API 주소를 알려줄 필요는 없습니다.

## 운영자가 볼 주소

```text
https://api.getvibeshare.com/health
https://api.getvibeshare.com/api/info
```

## 기본 사용자 안내

1. PC에서 `https://app.getvibeshare.com`을 엽니다.
2. 휴대폰 카메라로 PC 화면의 QR을 스캔합니다.
3. 연결 후 보낼지 받을지 선택합니다.
4. 파일을 보내고 받는 쪽에서 수락합니다.

PC에는 카메라가 필요 없습니다.

## 운영자가 매일 볼 것

- `https://app.getvibeshare.com` 접속
- `https://api.getvibeshare.com/health`
- Railway API 오류 로그
- Cloudflare Pages 최근 배포 상태
- R2 사용량과 업로드 오류
- 반복 사용자 문의

## 홍보 시작 전 마지막 체크

- PC에서 웹앱 열림
- QR 생성
- QR 스캔 연결
- 6자리 코드 연결
- PC -> phone
- phone -> PC
- 수락/거절
- 다운로드
- API health
- API info
- Railway 로그
- Cloudflare Pages
- R2 CORS/업로드

## 남은 일

- 홍보 게시
- 사용자 유입 만들기
- 피드백 수집
- 반복 문의를 FAQ에 반영
- 가격/계정/네이티브 앱 우선순위 결정
