# Final Support Playbook

## 사용자에게 먼저 안내할 말

```text
PC에서 https://app.getvibeshare.com 을 열고, 휴대폰 카메라로 QR을 스캔해 주세요.
PC에는 카메라가 필요 없습니다.
```

## 자주 겪는 문제

### QR이 안 열립니다

PC 화면에서 새 QR을 만든 뒤 다시 스캔해 주세요. 그래도 안 되면 6자리 코드를 입력해 주세요.

### 연결이 안 됩니다

PC와 휴대폰에서 기존 탭을 닫고, PC에서 새 QR을 만든 뒤 다시 스캔해 주세요.

### 파일이 자동으로 저장되지 않습니다

정상입니다. 받는 쪽에서 수락한 뒤 다운로드 버튼을 눌러야 저장됩니다.

### 다운로드 위치를 모르겠습니다

PC는 브라우저 기본 다운로드 폴더를 확인합니다. iPhone은 Safari 다운로드 또는 파일 앱 Downloads 폴더를 확인합니다.

### 서버 주소가 뭔가요

일반 사용자는 서버 주소를 알 필요가 없습니다. `https://app.getvibeshare.com`만 열면 됩니다.

### 큰 파일이 실패합니다

브라우저, 네트워크, 운영 제한의 영향을 받을 수 있습니다. 작은 파일로 먼저 확인하고, 실패한 파일 크기와 종류를 알려 달라고 요청합니다.

## 문의 접수 때 받을 정보

- 휴대폰 모델
- 휴대폰 OS
- PC 브라우저
- 전송 방향
- 파일 종류와 크기
- QR 또는 6자리 코드 사용 여부
- 오류 문구
- 스크린샷

## 운영자 확인 순서

1. `https://api.getvibeshare.com/health`
2. `https://api.getvibeshare.com/api/info`
3. `https://app.getvibeshare.com`
4. Railway API 로그
5. 브라우저 F12 Network/Console
6. Cloudflare Pages 최근 배포
7. R2 CORS / bucket / key
8. DNS

## 기록할 위치

- 일반 문의: `docs/launch/support-intake-template.md`
- 테스터 피드백: `docs/launch/tester-feedback-template.md`
- 장애: `docs/launch/incident-report-template.md`
