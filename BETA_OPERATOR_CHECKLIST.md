# Beta Operator Checklist

테스터에게 보내기 전에 아래 순서로 확인합니다.

## 1. 전체 검증

```powershell
cd C:\Users\ycl12\Desktop\vibe-share
powershell -ExecutionPolicy Bypass -File scripts\run-full-check.ps1
npm.cmd run staging:readiness
```

통과 기준:

- `npm install` 통과
- `npm test` 통과
- integration smoke 통과
- MinIO smoke 통과
- cleanup 통과
- web build 통과
- mobile iOS export 통과
- Docker PostgreSQL/Redis/MinIO healthy
- `/health`, `/admin/health`, `/admin/status`, `/api/info` 응답
- staging readiness gate 통과

## Beta stable 기준

2026-04-19 기준 QR 스캔, 자동 연결, PC -> 휴대폰 전송, 휴대폰 -> PC 전송이 확인된 상태를 beta-stable 기준으로 둡니다.

상태 기준 문서:

- `BETA_STABLE_STATUS.md`
- `docs/launch/staging-deploy-checklist.md`

## 2. Production-like local mode 시작

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-production-like.ps1 -ResetInfra
```

PC 웹:

```text
http://localhost:5173
```

## 3. 테스터에게 안내할 기본 흐름

1. PC 웹 열기
2. 휴대폰 카메라로 QR 스캔
3. 연결 후 보낼지 받을지 선택
4. 파일 전송

## 4. 꼭 말할 것

- PC와 휴대폰은 같은 Wi-Fi에 있어야 합니다.
- 휴대폰에서 `localhost`를 열면 안 됩니다.
- 파일 선택은 연결 후에 합니다.
- PC -> 휴대폰, 휴대폰 -> PC 모두 테스트합니다.
- 받는 쪽은 수락 또는 거절을 선택합니다.
- PC -> 휴대폰 다운로드는 휴대폰의 같은 페이지에서 `다운로드`를 눌러 시작합니다.

## 5. 테스터에게 보낼 파일

- `IPHONE_TEST_STEPS.md`
- `docs/launch/beta-invite-email.md`
- `docs/launch/tester-feedback-template.md`
- `BETA_STABLE_STATUS.md`

## 6. 이슈 수집 항목

- PC OS와 브라우저
- 휴대폰 모델과 OS
- 같은 Wi-Fi 여부
- 휴대폰에서 열린 주소
- 파일 크기와 확장자
- 전송 방향
- 오류 문구 또는 스크린샷
- 재현 순서

## 7. Known limitations

- 공개 계정/로그인 없음
- 결제 없음
- 실제 malware scanner는 외부 연결 전
- native 대용량 background upload는 future work
- 법무 검토된 privacy/terms는 외부 검토 필요
