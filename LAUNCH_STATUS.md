# Launch Status

## 결론

Vibe Share는 현재 web-first 공개 버전 기준으로 홍보 직전 상태입니다. 이제 남은 필수 작업은 홍보, 유입, 사용자 반응 수집입니다.

## 공개 주소

```text
사용자 웹앱: https://app.getvibeshare.com
API 서버:    https://api.getvibeshare.com
```

일반 사용자에게는 사용자 웹앱 주소만 안내합니다. API 주소는 운영 확인과 장애 대응에만 사용합니다.

## 지금 실제로 끝난 것

- 공개 웹앱 배포 완료
- 공개 API 배포 완료
- Railway API 운영 구성 완료
- Railway Postgres/Redis 구성 완료
- Cloudflare Pages/Domain 구성 완료
- Cloudflare R2 파일 저장 구성 완료
- QR 연결 확인 완료
- 6자리 코드 fallback 확인 완료
- PC -> phone 전송 확인 완료
- phone -> PC 전송 확인 완료
- 같은 세션에서 양방향 전송 확인 완료
- 수락/거절 흐름 구현 완료
- 진행 상태, pending/success/failure 상태 표시 구현 완료
- 파일 메타데이터 표시 구현 완료
- 다운로드/저장 액션 구현 완료
- 운영 문서, 지원 문서, 홍보 직전 문서 정리 완료

공개 API 확인값:

- `https://api.getvibeshare.com/health` HTTP 200
- `https://api.getvibeshare.com/api/info` HTTP 200
- active drivers: Postgres, Redis, R2
- fallback warnings: 없음
- 현재 `mode` 표시값: `development`

`mode=development`는 실제 확인값으로 기록합니다. 홍보 전 필수 차단 항목은 아니지만, 운영 hardening을 더 강하게 하려면 Railway에서 `APP_MODE=production` 전환을 별도 변경으로 진행합니다.

## 기본 사용자 흐름

1. PC에서 `https://app.getvibeshare.com`을 엽니다.
2. PC 화면의 QR을 휴대폰 카메라로 스캔합니다.
3. 휴대폰 브라우저에서 연결됩니다.
4. 연결 후 보낼지/받을지 선택합니다.
5. 파일을 전송하고 받는 쪽에서 수락 또는 거절합니다.
6. 수락하면 다운로드합니다.

PC는 QR을 보여주기만 하며 카메라가 필요 없습니다.

## 운영 상태 확인

```powershell
curl.exe https://api.getvibeshare.com/health
curl.exe https://api.getvibeshare.com/api/info
curl.exe https://app.getvibeshare.com
```

## 홍보만 남음 판정 기준

아래 조건이 모두 충족되면 "홍보만 남음"으로 표기합니다.

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

현재 상태: 충족으로 판단합니다. 단, 홍보 직전 당일에는 `BETA_OPERATOR_CHECKLIST.md`의 최종 체크를 한 번 더 실행합니다.

## 남은 것은 운영 외부 활동

- 홍보 채널 게시
- 베타 사용자 유입
- 피드백 수집
- 반복 장애/문의 패턴 정리
- 가격/계정/네이티브 앱 우선순위 결정

## 과장하지 말아야 할 것

- 완전 보안 또는 해킹 불가라고 말하지 않습니다.
- 영구 저장 서비스라고 말하지 않습니다.
- 모든 파일에 악성코드 검사가 완료된다고 말하지 않습니다.
- 무제한 대용량 전송을 약속하지 않습니다.
- 네이티브 앱 background upload가 완료됐다고 말하지 않습니다.

## 현재 한계

- 공개 계정/로그인은 아직 기본 흐름이 아닙니다.
- 결제는 아직 없습니다.
- 파일은 전송을 위한 임시 저장 기준입니다.
- 운영 비용과 브라우저 한계 때문에 실제 권장 파일 크기는 운영 중 조정할 수 있습니다.
- Privacy/Terms는 정식 유료 출시 전 외부 검토가 필요합니다.
