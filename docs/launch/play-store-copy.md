# Play Store Copy

## App Name

Vibe Share

## Short Description

PC 화면 QR로 휴대폰과 연결해 파일을 주고받습니다.

## Full Description

Vibe Share는 PC 웹과 휴대폰을 QR로 먼저 연결한 뒤 파일을 양방향으로 주고받는 전송 앱입니다. PC에는 카메라가 필요 없습니다. PC 화면에 표시된 QR을 휴대폰 카메라로 스캔하면 같은 세션에 연결되고, 연결 후 보낼지 받을지 선택합니다.

주요 기능:

- PC 화면 QR로 휴대폰 연결
- 6자리 코드 수동 연결
- PC에서 휴대폰으로 파일 보내기
- 휴대폰에서 PC로 파일 보내기
- 받는 쪽 수락/거절
- 전송 상태와 진행 표시

현재 beta build는 Google Play internal testing 용도입니다. 공개 출시 전에는 계정, 결제, 법무 검토, 운영용 파일 검사, 최종 스크린샷과 브랜드 자산을 확정해야 합니다.

## Category

Tools or Productivity

## Data Safety Draft

- Processed data: session ID, device role, file name, file size, MIME type, transfer status
- File content: temporarily stored in selected storage provider, then expired/cleaned up
- Camera: used only to scan the PC screen QR
- Account: no public account system in this beta
- Billing: no billing in this beta

## Review Notes

```text
This beta app pairs with a PC web app.

1. Open the PC web app.
2. Scan the Vibe Share QR with the phone camera, or enter the 6-digit code.
3. Confirm the connected state.
4. Choose PC-to-phone or phone-to-PC transfer.

The PC does not need a camera. The same paired session supports both transfer directions. Please use the staging API/web environment provided in the review instructions.
```

## Claims To Avoid

- complete end-to-end encryption
- impossible data leakage
- guaranteed background upload on every mobile device
- complete billing/account system
