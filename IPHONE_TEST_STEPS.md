# iPhone Test Steps

## Web-first 베타 안내

1. 기본 흐름은 QR 스캔 -> 연결 -> 전송입니다.
2. 전송 중 페이지를 벗어나면 연결이 끊길 수 있습니다.
3. 다시 돌아오면 자동 복구를 시도합니다.
4. 장시간 background 전송은 future native app track입니다.

휴대폰과 PC는 같은 WiFi 또는 같은 핫스팟에 연결되어 있어야 합니다.
연결이 실패하면 같은 WiFi인지 먼저 확인하세요.
아이폰에서 `http://현재_LAN_IP:4000/health`가 열려야 QR 연결도 가능합니다. 안 열리면 네트워크/방화벽 문제를 먼저 해결해야 합니다.

전송 중에는 이 페이지를 닫거나 다른 앱으로 나가지 마세요. 페이지를 벗어나면 연결이 끊길 수 있습니다.

이 문서는 iPhone 테스터에게 그대로 보낼 수 있습니다.

## 가장 중요한 규칙

iPhone에서 `localhost`를 열지 마세요.

이유:

- PC의 `localhost`는 PC 자기 자신입니다.
- iPhone의 `localhost`는 iPhone 자기 자신입니다.
- 그래서 iPhone에서 `http://localhost:5173` 또는 `http://localhost:4000`을 열면 PC에 연결되지 않습니다.

## 실제 사용 순서

1. PC 웹 열기
2. iPhone 기본 카메라로 QR 스캔
3. 연결 후 보낼지 받을지 선택
4. 파일 전송

## Safari 일반 모드에서 이상할 때

- QR로 열린 `/j/6자리코드`가 현재 QR 세션을 우선합니다.
- `연결 시도 중`에서 멈추면 고급 영역의 `연결 정보 초기화`를 누릅니다.
- 그래도 이상하면 예전 Safari 탭을 닫고 PC에서 새 QR을 만든 뒤 다시 스캔합니다.
- 화면 아래 build/version이 이전 테스트와 다르면 저장된 연결 상태가 자동 초기화될 수 있습니다.

## 자세한 테스트 순서

1. PC에서 Vibe Share 웹을 엽니다.
   - PC에서는 `http://localhost:5173`을 사용해도 됩니다.
   - 먼저 PC에서 `powershell -ExecutionPolicy Bypass -File scripts\check-local-network.ps1`을 실행해 아이폰에서 열 주소를 확인합니다.

2. iPhone 기본 카메라로 PC 화면의 QR을 스캔합니다.
   - QR을 누르면 iPhone Safari가 열립니다.
   - 주소는 `http://192.168.x.x:5173/j/123456` 같은 형태여야 합니다.
   - `localhost` 또는 `127.0.0.1`이 보이면 잘못된 주소입니다.

3. iPhone 화면에서 `연결됨`을 확인합니다.
   - 연결 후에만 보낼지 받을지 선택합니다.

4. PC -> iPhone을 테스트합니다.
   - PC에서 `휴대폰으로 파일 보내기`를 누릅니다.
   - PC에서 파일을 선택합니다.
   - iPhone 같은 페이지에 파일 받기 모달이 뜨면 `다운로드`를 누릅니다.
   - Safari 다운로드 또는 Files 앱 Downloads 폴더에서 확인합니다.

5. iPhone -> PC를 테스트합니다.
   - iPhone에서 `PC로 파일 보내기`를 누릅니다.
   - iPhone에서 파일을 선택합니다.
   - PC에서 받기 요청을 수락하고 다운로드합니다.

## QR이 안 될 때

QR 아래의 6자리 코드를 사용합니다.

1. iPhone 화면에서 코드 입력 영역을 엽니다.
2. PC 화면의 6자리 코드를 입력합니다.
3. 서버 주소는 자동으로 PC LAN 주소가 들어가야 합니다.
4. `localhost`를 직접 입력하면 연결이 차단됩니다.

## 보고할 내용

- iPhone 모델과 iOS 버전
- PC 브라우저
- iPhone에서 열린 주소
- 전송 방향
- 파일 크기와 확장자
- 실패했다면 오류 문구와 스크린샷
