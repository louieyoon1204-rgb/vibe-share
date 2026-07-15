export const BASE_URL = "https://getvibeshare.com";
export const APP_URL = "https://app.getvibeshare.com";
export const API_URL = "https://api.getvibeshare.com";
export const CONTACT_EMAIL = "support@getvibeshare.com";
const CONTACT_EMAIL_DISPLAY = CONTACT_EMAIL.replace("@", " [at] ");
export const ADSENSE_CLIENT_ID = "ca-pub-2582922243814482";
export const ADS_TXT_CONTENT = "google.com, pub-2582922243814482, DIRECT, f08c47fec0942fa0";

const SITE_UPDATED = "2026-07-15";
const DEFAULT_AUTHOR = "Vibe Share 운영팀";

const guideArticles = [
  {
    path: "/guides/pc-to-phone-file-transfer",
    category: "사용 절차",
    navTitle: "PC에서 휴대폰으로 파일 보내기",
    title: "PC에서 휴대폰으로 파일 보내는 방법 | Vibe Share 가이드",
    description: "PC 화면의 QR과 6자리 코드로 휴대폰을 연결한 뒤 PC 파일을 휴대폰으로 보내고 저장 위치를 확인하는 실제 절차를 설명합니다.",
    summary: "PC 파일을 휴대폰으로 보낼 때 QR 연결, 수락, 다운로드 위치 확인까지 한 번에 따라갈 수 있는 절차입니다.",
    target: "PC에 있는 사진, PDF, 압축 파일을 휴대폰에서 바로 열어야 하는 사용자",
    problem: "케이블, 메일, 메신저 로그인 없이 짧은 시간 안에 파일을 옮기고 싶을 때",
    published: "2026-07-06",
    modified: SITE_UPDATED,
    intro: "PC에서 휴대폰으로 파일을 보내는 작업은 단순해 보여도 실제로는 케이블, 로그인, 첨부 제한, 다운로드 위치 때문에 자주 막힙니다. Vibe Share의 공개 웹앱은 PC 화면에 QR 코드와 6자리 코드를 표시하고, 휴대폰이 그 정보를 읽어 같은 세션에 들어오는 방식입니다. PC가 QR을 스캔하지 않으므로 데스크톱 PC처럼 카메라가 없는 환경에서도 시작할 수 있습니다.",
    sections: [
      {
        heading: "기본 순서",
        paragraphs: [
          "PC 브라우저에서 Vibe Share 웹앱을 열면 새 세션이 만들어지고 QR 코드와 6자리 코드가 표시됩니다. 휴대폰 카메라로 QR을 스캔하면 <code>app.getvibeshare.com/j/123456</code> 형태의 연결 화면이 열립니다. QR이 잘 인식되지 않으면 같은 화면에서 6자리 코드를 직접 입력할 수 있습니다.",
          "두 기기가 연결되면 PC 화면의 <code>휴대폰으로 파일 보내기</code>를 눌러 파일을 선택합니다. 여러 파일을 선택하면 파일별로 전송 요청이 만들어지고, 휴대폰은 각 파일 이름과 크기를 보고 수락하거나 거절할 수 있습니다. 잘못 고른 파일은 휴대폰에서 거절하면 됩니다."
        ]
      },
      {
        heading: "휴대폰에서 받을 때 확인할 것",
        paragraphs: [
          "휴대폰은 파일을 자동으로 조용히 저장하지 않습니다. 받는 쪽에서 파일 이름과 크기를 확인하고 수락한 뒤 다운로드 또는 저장 동작을 진행합니다. iPhone Safari에서는 다운로드 알림이나 파일 앱의 Downloads 폴더를 확인해야 할 수 있고, Android 브라우저에서는 다운로드 앱이나 브라우저 다운로드 목록에서 확인하는 경우가 많습니다.",
          "전송 중에는 PC와 휴대폰 모두 페이지를 닫지 않는 것이 좋습니다. 휴대폰이 잠기거나 브라우저가 백그라운드로 밀리면 연결이 끊길 수 있습니다. 끊겼을 때 같은 화면을 오래 붙잡기보다 PC에서 새 QR을 만든 뒤 다시 연결하는 편이 빠릅니다."
        ]
      },
      {
        heading: "Vibe Share를 쓰지 않는 편이 나은 경우",
        paragraphs: [
          "수십 GB 백업, 폴더 전체 복사, 장기간 보관이 필요한 파일은 USB 케이블, 외장 저장장치, 클라우드 드라이브가 더 맞을 수 있습니다. Vibe Share는 옆에 있는 PC와 휴대폰 사이에서 임시로 파일을 옮기는 상황에 맞춰 설계되었습니다.",
          "민감한 계약서, 신분증, 금융 자료를 보낼 때는 수신 기기가 본인 통제 아래 있는지 먼저 확인하세요. Vibe Share는 HTTPS와 수락 절차를 사용하지만 어떤 도구도 사용자의 전송 판단을 대신할 수 없습니다."
        ]
      }
    ],
    related: ["/guides/qr-file-transfer", "/guides/troubleshooting-qr-file-transfer", "/guides/data-lifecycle-and-privacy"]
  },
  {
    path: "/guides/qr-file-transfer",
    category: "연결 원리",
    navTitle: "QR 파일 전송 원리",
    title: "QR 코드 파일 전송은 어떻게 작동하나요? | Vibe Share 가이드",
    description: "QR이 파일 자체를 담는 것이 아니라 휴대폰을 같은 전송 세션으로 안내한다는 점과 PC 카메라가 필요 없는 이유를 설명합니다.",
    summary: "QR은 파일이 아니라 같은 세션에 들어가기 위한 주소와 코드를 전달합니다. PC는 보여 주고 휴대폰은 스캔합니다.",
    target: "QR 파일 전송이 처음이라 보안과 동작 방식을 먼저 알고 싶은 사용자",
    problem: "PC 카메라가 필요한지, QR에 파일이 들어가는지, 6자리 코드는 왜 있는지 헷갈릴 때",
    published: "2026-07-06",
    modified: SITE_UPDATED,
    intro: "Vibe Share의 QR 코드는 파일 자체를 담지 않습니다. QR에는 휴대폰이 들어갈 웹앱 경로와 6자리 코드가 포함됩니다. 휴대폰이 이 경로를 열고 서버에 코드를 보내면, 서버는 해당 코드에 맞는 세션을 찾아 휴대폰을 연결합니다. 이후 실제 파일 업로드와 다운로드는 API와 스토리지를 통해 처리됩니다.",
    sections: [
      {
        heading: "PC가 QR을 스캔하지 않는 구조",
        paragraphs: [
          "PC는 QR을 보여 주는 역할만 합니다. 스캔은 카메라가 있는 휴대폰에서 한 번만 진행합니다. 그래서 PC에 웹캠이 없거나 회사 PC에서 카메라 권한이 막혀 있어도 세션을 만들 수 있습니다.",
          "QR이 불편한 경우를 위해 6자리 수동 코드도 표시합니다. QR 스캔이 화면 반사, 브라우저 내장 스캐너 문제, 카메라 권한 문제로 실패하면 휴대폰 화면에서 코드를 직접 입력해 같은 세션에 들어갈 수 있습니다."
        ]
      },
      {
        heading: "공개 서비스와 로컬 개발의 차이",
        paragraphs: [
          "공개 서비스에서는 PC와 휴대폰이 반드시 같은 Wi-Fi에 있을 필요는 없습니다. 두 기기가 인터넷에 연결되어 있고 <code>app.getvibeshare.com</code>과 <code>api.getvibeshare.com</code>에 접근할 수 있으면 연결을 시도할 수 있습니다.",
          "반대로 로컬 개발 환경에서 <code>localhost</code>로 실행할 때는 휴대폰의 localhost가 PC가 아니라 휴대폰 자기 자신을 가리킵니다. 이때는 같은 Wi-Fi 또는 같은 핫스팟에서 PC LAN IP를 써야 합니다. 공식 사이트의 일반 사용자 안내와 로컬 개발 안내를 섞어 읽지 않는 것이 중요합니다."
        ]
      },
      {
        heading: "연결 복구의 실제 범위",
        paragraphs: [
          "웹앱은 브라우저 세션 저장소와 최근 연결 정보를 일부 사용해 새로고침이나 짧은 페이지 복귀 상황을 다루려고 합니다. 하지만 서버 재시작, 세션 만료, 오래된 QR, 다른 기기의 같은 역할 재접속이 생기면 이전 연결을 그대로 보장하지 않습니다.",
          "전송 중 페이지를 닫지 말라는 안내는 이 한계 때문입니다. 파일이 이미 업로드되었더라도 받는 쪽이 수락하기 전이면 상태가 바뀔 수 있고, 만료 시간이 지나면 다시 보내야 할 수 있습니다."
        ]
      }
    ],
    related: ["/how-it-works", "/guides/data-lifecycle-and-privacy", "/guides/troubleshooting-qr-file-transfer"]
  },
  {
    path: "/guides/kakao-email-cable-alternative",
    category: "대안 비교",
    navTitle: "카톡·메일·케이블 대안",
    title: "카톡, 메일, USB 케이블 대신 파일 보내는 방법 | Vibe Share 가이드",
    description: "메신저, 이메일, USB 케이블이 번거로운 순간과 Vibe Share가 대안이 될 수 있는 상황, 그렇지 않은 상황을 구분합니다.",
    summary: "카톡, 이메일, USB가 항상 나쁜 것은 아닙니다. 짧은 임시 전송에 QR 연결이 맞는 경우를 정직하게 구분합니다.",
    target: "회사 PC나 공용 PC에서 개인 메신저 로그인을 피하고 싶은 사용자",
    problem: "파일 하나 때문에 케이블, 메일 첨부, 개인 채팅방 업로드를 반복해야 할 때",
    published: "2026-07-06",
    modified: SITE_UPDATED,
    intro: "파일을 옮기는 방법은 이미 많습니다. Vibe Share가 모든 상황에서 더 낫다고 말할 수는 없습니다. 메일은 기록을 남기기 좋고, USB는 큰 파일에 강하며, 클라우드는 장기간 공유에 유리합니다. Vibe Share가 노리는 지점은 조금 다릅니다. 지금 옆에 있는 PC와 휴대폰 사이에서 파일 몇 개를 빨리 옮기고, 별도 로그인 흔적을 줄이고 싶은 상황입니다.",
    sections: [
      {
        heading: "메신저와 이메일이 맞지 않는 순간",
        paragraphs: [
          "회사 PC에서 개인 카카오톡이나 메신저에 로그인하는 것이 부담스러운 경우가 있습니다. 반대로 회사 파일을 개인 대화방에 올리는 것도 남기고 싶지 않은 흔적이 될 수 있습니다. 이메일은 기록 관리에는 좋지만 자기 자신에게 보내기, 첨부 대기, 다운로드 다시 받기 단계가 반복됩니다.",
          "사진이나 동영상은 메신저 설정에 따라 압축되거나 원본 옵션을 따로 찾아야 할 수 있습니다. Vibe Share는 파일을 고르고, 받는 쪽이 확인한 뒤, 브라우저 다운로드로 받는 흐름을 단순하게 유지합니다."
        ]
      },
      {
        heading: "USB 케이블이 더 좋은 경우",
        paragraphs: [
          "폴더 전체 백업, 매우 큰 동영상 묶음, 인터넷이 불안정한 환경에서는 USB 케이블이 더 적합할 수 있습니다. 안드로이드 MTP나 iPhone 신뢰 설정이 이미 문제 없이 잡혀 있다면 케이블이 빠르고 예측 가능합니다.",
          "Vibe Share는 케이블을 완전히 대체하는 도구가 아닙니다. 케이블이 없거나, 충전 전용 케이블인지 헷갈리거나, 공용 PC 정책 때문에 장치 연결이 막힐 때 웹 기반 대안으로 쓰는 것이 현실적입니다."
        ]
      },
      {
        heading: "Vibe Share가 맞는 상황",
        paragraphs: [
          "브라우저만 열 수 있고 인터넷 연결이 되는 환경에서 문서 몇 개, 캡처 이미지, 사진 묶음, 압축 파일을 빠르게 옮길 때 적합합니다. 같은 세션에서 PC에서 휴대폰으로도 보내고, 휴대폰에서 PC로도 보낼 수 있어 전송 방향을 다시 정하느라 새 도구를 열 필요가 없습니다.",
          "파일을 받는 쪽이 수락 또는 거절할 수 있다는 점도 실제 사용에서 중요했습니다. 잘못 선택한 파일이 바로 저장되는 대신 한 번 확인할 수 있기 때문입니다."
        ]
      }
    ],
    related: ["/guides/file-transfer-method-comparison", "/guides/pc-to-phone-file-transfer", "/guides/android-to-pc-file-transfer"]
  },
  {
    path: "/guides/iphone-to-pc-photo-transfer",
    category: "기기별 도움말",
    navTitle: "아이폰 사진 PC로 옮기기",
    title: "아이폰 사진을 Windows PC로 옮기는 쉬운 방법 | Vibe Share 가이드",
    description: "Windows PC에서 AirDrop을 쓸 수 없을 때 아이폰 사진을 브라우저 기반 QR 연결로 보내는 흐름과 Safari 저장 위치를 안내합니다.",
    summary: "아이폰 사진을 Windows PC로 보낼 때 QR 연결, 사진 선택, HEIC 주의, Safari 다운로드 확인을 정리합니다.",
    target: "Windows PC로 아이폰 사진이나 캡처 이미지를 옮겨야 하는 사용자",
    problem: "AirDrop이 없고 케이블 연결이나 iCloud 동기화가 번거로울 때",
    published: "2026-07-06",
    modified: SITE_UPDATED,
    intro: "아이폰과 Mac 조합에서는 AirDrop이 자연스럽지만 Windows PC에서는 같은 경험을 기대하기 어렵습니다. 케이블을 연결하면 장치 신뢰, 사진 앱 가져오기, DCIM 폴더, iCloud 동기화 상태를 확인해야 할 수 있습니다. Vibe Share는 PC 웹앱이 QR을 보여 주고 아이폰이 그 QR을 열어 같은 세션에 들어가는 방식으로 이 과정을 줄입니다.",
    sections: [
      {
        heading: "아이폰에서 PC로 보내는 흐름",
        paragraphs: [
          "PC에서 <code>app.getvibeshare.com</code>을 열고 새 QR을 표시합니다. 아이폰 카메라로 QR을 스캔하면 모바일 웹 연결 화면이 열립니다. 연결된 뒤 아이폰 화면에서 파일 보내기를 선택하고 사진 보관함 또는 파일 앱에서 이미지를 고릅니다.",
          "PC 화면에는 수신 요청이 표시됩니다. 파일 이름과 크기를 확인하고 수락하면 PC 브라우저의 다운로드가 시작됩니다. PC는 QR을 보여 주는 역할만 하므로 PC 카메라가 필요 없습니다."
        ]
      },
      {
        heading: "Safari와 파일 앱에서 확인할 위치",
        paragraphs: [
          "PC에서 아이폰으로 받은 파일은 iPhone Safari 다운로드 목록이나 파일 앱의 Downloads 폴더에서 확인하는 경우가 많습니다. 반대로 아이폰에서 PC로 보낸 파일은 PC 브라우저의 기본 다운로드 폴더나 다운로드 목록을 확인하면 됩니다.",
          "HEIC 사진은 전송 자체와 별개로 PC에서 열기 어려울 수 있습니다. Vibe Share는 파일을 변환하지 않고 옮기는 데 집중합니다. 받은 뒤 열리지 않는다면 Windows의 HEIC 코덱이나 사진 포맷 변환이 별도 문제입니다."
        ]
      },
      {
        heading: "아직 보장하지 않는 것",
        paragraphs: [
          "모든 iOS 버전, 모든 브라우저, 모든 사진 형식을 동일하게 보장한다고 쓰지 않습니다. 이 저장소의 자동 테스트는 API와 웹 전송 흐름을 검증하지만 실제 아이폰 모델별 카메라, Safari 정책, 파일 앱 동작은 소유자가 기기별로 확인해야 합니다.",
          "대용량 동영상은 모바일 브라우저가 백그라운드로 내려가거나 화면이 잠길 때 실패할 수 있습니다. 긴 전송은 화면을 켜 두고 작은 파일로 먼저 확인하는 편이 좋습니다."
        ]
      }
    ],
    related: ["/guides/real-world-transfer-test-notes", "/guides/troubleshooting-qr-file-transfer", "/guides/file-transfer-security-checklist"]
  },
  {
    path: "/guides/android-to-pc-file-transfer",
    category: "기기별 도움말",
    navTitle: "안드로이드 파일 PC로 보내기",
    title: "안드로이드에서 PC로 파일 보내는 방법 | Vibe Share 가이드",
    description: "안드로이드 휴대폰에서 PC로 사진, 문서, 압축 파일을 보낼 때 QR 연결, 파일 선택 위치, 다운로드 확인, 로컬 주소 주의사항을 안내합니다.",
    summary: "USB/MTP가 막힐 때 안드로이드 파일을 PC 브라우저로 보내는 절차와 다운로드 확인 방법입니다.",
    target: "안드로이드 휴대폰 파일을 Windows PC나 노트북으로 옮겨야 하는 사용자",
    problem: "USB 연결 모드, 드라이버, 내 파일 위치 때문에 전송이 지연될 때",
    published: "2026-07-06",
    modified: SITE_UPDATED,
    intro: "안드로이드 휴대폰은 USB로 PC에 연결하면 파일을 복사할 수 있지만, 실제 사용에서는 충전 모드, 파일 전송 권한, 드라이버, 케이블 상태 때문에 막히는 경우가 있습니다. Vibe Share는 휴대폰 브라우저에서 파일 선택기를 열고 PC 브라우저가 받는 흐름을 제공합니다.",
    sections: [
      {
        heading: "PC로 파일 보내기",
        paragraphs: [
          "PC에서 웹앱을 열어 QR을 표시하고, 안드로이드 휴대폰 카메라 또는 QR 스캐너로 연결 화면에 들어갑니다. 연결 후 휴대폰에서 파일 보내기를 누르면 사진, 동영상, 다운로드, 내 파일 같은 위치를 선택할 수 있습니다.",
          "파일을 고르면 PC 화면에 수신 요청이 표시됩니다. PC 사용자는 파일 이름과 크기를 확인한 뒤 수락하거나 거절할 수 있습니다. 수락하면 PC 브라우저 다운로드가 시작됩니다."
        ]
      },
      {
        heading: "파일이 안 보일 때",
        paragraphs: [
          "일부 브라우저 파일 선택기는 최근 파일만 먼저 보여 줍니다. 원하는 파일이 보이지 않으면 왼쪽 메뉴나 상단 위치 선택에서 이미지, 동영상, 다운로드, 내 파일, 클라우드 앱 위치를 바꿔 보세요. 클라우드 앱 안에만 있는 파일은 먼저 기기에 내려받아야 선택될 수 있습니다.",
          "여러 파일을 선택할 수 있지만 전송 요청은 파일별로 처리됩니다. 받는 PC에서 한 파일은 수락하고 다른 파일은 거절할 수 있으므로, 많은 파일을 보내기 전에는 한두 개로 흐름을 확인하는 편이 안전합니다."
        ]
      },
      {
        heading: "공개 서비스와 로컬 주소",
        paragraphs: [
          "공개 서비스에서는 두 기기가 같은 네트워크 이름에 붙어 있을 필요는 없습니다. 인터넷을 통해 <code>app.getvibeshare.com</code>과 <code>api.getvibeshare.com</code>에 접근합니다. 로컬 개발에서는 PC LAN IP가 필요할 수 있는데, 이 경우 휴대폰과 PC가 같은 Wi-Fi 또는 핫스팟에 있어야 합니다.",
          "문제 해결 시 공개 서비스 문제인지 로컬 개발 주소 문제인지 먼저 구분하세요. 공식 사이트의 일반 사용자 흐름은 공개 HTTPS 주소 기준입니다.",
          "안드로이드에서 파일 선택 후 바로 화면을 전환하면 업로드 진행 이벤트가 끊길 수 있습니다. 업로드 중에는 브라우저를 전면에 두고, PC 화면에 수락 요청이 뜰 때까지 기다리는 것이 좋습니다."
        ]
      }
    ],
    related: ["/guides/qr-file-transfer", "/guides/file-transfer-method-comparison", "/guides/troubleshooting-qr-file-transfer"]
  },
  {
    path: "/guides/file-transfer-security-checklist",
    category: "보안",
    navTitle: "파일 전송 보안 체크리스트",
    title: "파일 전송 전 확인할 보안 체크리스트 | Vibe Share 가이드",
    description: "QR 파일 전송을 사용할 때 주소, 수신자, 파일 내용, 저장 위치, 공용 PC 정리를 확인하는 실용 체크리스트입니다.",
    summary: "빠르게 보내더라도 주소, 수신자, 파일 내용, 저장 위치 네 가지는 확인해야 합니다.",
    target: "민감한 사진, 문서, 업무 파일을 보내기 전 위험을 줄이고 싶은 사용자",
    problem: "전송 도구보다 사용자의 확인 실수가 더 큰 문제가 될 수 있을 때",
    published: "2026-07-06",
    modified: SITE_UPDATED,
    intro: "파일 전송에서 중요한 것은 속도만이 아닙니다. Vibe Share는 HTTPS, 세션 연결, 수락/거절 절차를 제공하지만 이것만으로 모든 위험이 사라지는 것은 아닙니다. 사용자가 보내는 파일의 성격과 받는 기기를 확인해야 합니다.",
    sections: [
      {
        heading: "전송 전 체크",
        bullets: [
          "주소창이 <code>https://app.getvibeshare.com</code> 또는 공식 사이트의 앱 링크인지 확인합니다.",
          "휴대폰이 PC 화면의 QR을 직접 스캔했는지, 모르는 사람이 보낸 링크가 아닌지 확인합니다.",
          "신분증, 계약서, 금융 자료, 고객 정보가 들어간 파일은 보내기 전에 한 번 더 열어 내용과 수신 기기를 확인합니다.",
          "공용 PC나 회의실 PC에서는 다운로드 폴더가 다른 사람에게 보일 수 있음을 고려합니다."
        ]
      },
      {
        heading: "수신 요청에서 볼 것",
        paragraphs: [
          "받는 쪽은 파일 이름과 크기를 보고 수락하거나 거절할 수 있습니다. 예상한 파일과 다르거나, 크기가 지나치게 다르거나, 보낸 사람이 명확하지 않다면 거절하는 편이 안전합니다.",
          "Vibe Share는 파일을 자동으로 열거나 실행하라고 요구하지 않습니다. 받은 파일은 필요한 앱에서 직접 확인하고, 실행 파일이나 알 수 없는 압축 파일은 특히 조심해야 합니다."
        ]
      },
      {
        heading: "전송 후 정리",
        bullets: [
          "PC와 휴대폰에서 더 이상 필요 없는 세션 탭을 닫습니다.",
          "공용 PC에서는 다운로드 목록, 다운로드 폴더, 최근 파일 목록을 확인합니다.",
          "장기 보관이 필요한 파일은 Vibe Share가 아니라 신뢰하는 별도 저장소에 옮겨 둡니다.",
          "연결이 끊겼거나 수신자가 확실하지 않으면 새 QR로 다시 시작합니다."
        ],
        paragraphs: [
          "보안 체크리스트는 Vibe Share에만 적용되는 특수 규칙이 아니라 파일 전송 전반에 필요한 습관입니다. 차이는 Vibe Share가 세션 코드와 수락/거절 절차를 화면에 드러내므로 사용자가 확인할 지점이 비교적 분명하다는 점입니다."
          + " 공용 PC에서 업무 파일을 받았다면 파일을 열어 확인한 뒤 필요한 위치로 옮기고, 임시 다운로드 위치에 남은 복사본이 없는지도 살펴보세요."
        ]
      }
    ],
    related: ["/security", "/privacy", "/guides/data-lifecycle-and-privacy"]
  },
  {
    path: "/guides/troubleshooting-qr-file-transfer",
    category: "문제 해결",
    navTitle: "QR 전송 문제 해결",
    title: "QR 파일 전송이 안 될 때 확인할 것 | Vibe Share 가이드",
    description: "QR 스캔 실패, 6자리 코드 입력, 연결 끊김, Safari 다운로드 위치, 세션 만료를 순서대로 확인합니다.",
    summary: "같은 화면에서 계속 반복하기보다 QR, 코드, 연결 상태, 다운로드 위치를 차례로 확인하세요.",
    target: "QR 스캔 또는 파일 다운로드 단계에서 막힌 사용자",
    problem: "연결이 안 되는 원인이 QR, 브라우저, 네트워크, 세션 중 무엇인지 좁히고 싶을 때",
    published: "2026-07-06",
    modified: SITE_UPDATED,
    intro: "QR 파일 전송이 실패할 때 원인은 하나로 고정되지 않습니다. 오래된 QR, 브라우저 저장 상태, 세션 만료, 파일 크기, 다운로드 위치, 네트워크 상태가 모두 영향을 줄 수 있습니다. 아래 순서로 확인하면 같은 실수를 반복하는 시간을 줄일 수 있습니다.",
    sections: [
      {
        heading: "1. QR과 6자리 코드",
        paragraphs: [
          "휴대폰 카메라가 QR을 읽지 못하면 PC 화면 밝기를 올리고, QR이 잘리지 않도록 브라우저 확대 배율을 조정합니다. 그래도 어렵다면 PC 화면에 표시된 6자리 코드를 직접 입력합니다.",
          "QR을 열었는데 오래 걸리거나 흰 화면이 보이면 PC에서 새 QR을 만들고 다시 스캔하세요. <code>app.getvibeshare.com/j/123456</code> 같은 경로의 숫자가 현재 PC 화면의 코드와 같은지도 확인합니다."
        ]
      },
      {
        heading: "2. 연결 상태",
        paragraphs: [
          "PC와 휴대폰 모두 연결됨 상태가 되어야 파일을 보낼 수 있습니다. 한쪽만 연결되어 있으면 전송 버튼을 눌러도 실패할 수 있습니다. 전송 중에는 페이지를 닫거나 다른 앱으로 오래 나가지 않는 것이 좋습니다.",
          "공개 서비스에서는 두 기기가 같은 공유기에 연결되어 있을 필요는 없지만 인터넷 연결은 필요합니다. 로컬 개발 주소를 쓰는 경우에는 같은 Wi-Fi 또는 핫스팟과 PC LAN IP가 필요합니다."
        ]
      },
      {
        heading: "3. 다운로드와 저장 위치",
        paragraphs: [
          "PC에서 다운로드가 안 보이면 브라우저 다운로드 목록과 기본 다운로드 폴더를 확인합니다. iPhone에서 파일을 받았다면 Safari 다운로드 목록 또는 파일 앱의 Downloads 폴더를 확인하세요.",
          "같은 파일이 반복해서 실패하면 작은 텍스트 파일이나 이미지 한 장으로 먼저 흐름을 확인합니다. 계속 실패하면 새 QR로 다시 연결하고, 그래도 같으면 문의 시 전송 방향, 파일 종류, 대략적인 크기, 오류 문구를 함께 보내 주세요.",
          "수락 버튼을 눌렀는데 다운로드가 시작되지 않는 경우에는 브라우저가 팝업 또는 다운로드 권한을 기다리는 중일 수 있습니다. PC에서는 주소창 근처의 다운로드 아이콘을, 모바일에서는 브라우저 하단 또는 공유/다운로드 메뉴를 확인하세요."
        ]
      }
    ],
    related: ["/faq", "/contact", "/guides/real-world-transfer-test-notes"]
  },
  {
    path: "/guides/how-vibe-share-was-built",
    category: "제작 기록",
    navTitle: "Vibe Share를 만든 과정",
    title: "Vibe Share는 어떻게 만들어졌나요? | 제작 기록",
    description: "PC와 휴대폰 사이 파일 전송 불편에서 출발해 ChatGPT와 Codex를 도구로 활용하며 QR 라우팅, Safari, R2, CORS 문제를 해결한 기록입니다.",
    summary: "제품 소개가 아니라 실제 만들면서 부딪힌 QR 라우팅, Safari 다운로드, R2/CORS, DB 저장 순서 문제를 정리한 제작 기록입니다.",
    target: "Vibe Share가 실제 운영 경험을 바탕으로 만들어졌는지 확인하고 싶은 사용자",
    problem: "단순 SEO 문구가 아니라 이 서비스만의 배경과 시행착오가 궁금할 때",
    published: SITE_UPDATED,
    modified: SITE_UPDATED,
    intro: "Vibe Share는 처음부터 큰 플랫폼을 목표로 한 서비스가 아니었습니다. 출발점은 PC와 휴대폰 사이에서 파일 하나를 옮기려 할 때 매번 케이블, 메신저, 이메일, 클라우드를 돌아가야 하는 불편이었습니다. 특히 PC에는 카메라가 없을 수 있다는 조건이 중요했습니다. 그래서 QR은 휴대폰이 PC 화면을 한 번 스캔하는 용도로만 쓰고, 이후 같은 세션에서 양방향 전송이 가능해야 했습니다.",
    sections: [
      {
        heading: "ChatGPT와 Codex를 도구로 쓴 방식",
        paragraphs: [
          "제작 과정에서는 ChatGPT와 Codex를 설계 검토, 코드 작성 보조, 오류 원인 정리 도구로 사용했습니다. 그렇지만 Vibe Share는 OpenAI의 공식 서비스, 후원 서비스, 제휴 서비스가 아닙니다. OpenAI나 ChatGPT가 이 서비스를 승인했다는 의미도 아닙니다.",
          "도구가 만든 초안을 그대로 믿기보다 실제 실행, 빌드, 스모크 테스트, 공개 URL 확인으로 고쳤습니다. 예를 들어 QR에 어떤 주소가 들어가야 하는지, 휴대폰에서 localhost가 왜 실패하는지, R2 업로드 후 ETag를 어떻게 확인해야 하는지는 코드와 운영 확인을 반복하며 정리했습니다."
        ]
      },
      {
        heading: "실제로 막혔던 문제",
        bullets: [
          "QR 라우팅: 모바일 웹이 <code>/j/123456</code> 경로로 들어왔을 때 오래된 세션 저장값을 무시하고 현재 코드로 연결해야 했습니다.",
          "Safari 다운로드: iPhone에서 다운로드가 조용히 끝나는 것처럼 보일 수 있어 Safari 다운로드 또는 파일 앱 Downloads 위치 안내를 앱 문구와 가이드에 넣었습니다.",
          "R2와 CORS: 공개 운영은 Cloudflare R2를 S3 호환 스토리지로 쓰며, 서명 URL과 ETag 노출, 버킷 엔드포인트 형식이 맞아야 업로드가 이어집니다.",
          "DB 저장 순서: 세션, 페어링, 디바이스 trust, 전송 상태가 따로 기록되므로 수락/거절과 다운로드 완료 시점의 상태 업데이트 순서가 중요했습니다.",
          "배포 분리: 공식 사이트는 <code>getvibeshare.com</code>, 실제 웹앱은 <code>app.getvibeshare.com</code>, API는 <code>api.getvibeshare.com</code>으로 나누어 사용자가 API 주소를 직접 입력하지 않게 했습니다."
        ]
      },
      {
        heading: "배운 점",
        paragraphs: [
          "가장 중요한 결정은 PC에 카메라를 요구하지 않는 것이었습니다. QR은 PC가 스캔하는 것이 아니라 휴대폰이 스캔하는 정보이므로, 데스크톱 PC에서도 첫 연결을 만들 수 있습니다.",
          "두 번째는 과장하지 않는 것입니다. Vibe Share는 HTTPS, 세션, 수락/거절, 임시 저장 정리를 제공하지만 모든 브라우저, 모든 네트워크, 모든 파일 형식에서 완벽하다고 말하지 않습니다. 전송 중 페이지를 닫으면 끊길 수 있고, 모바일 백그라운드 전송은 제한을 받을 수 있습니다."
        ]
      }
    ],
    related: ["/guides/real-world-transfer-test-notes", "/guides/data-lifecycle-and-privacy", "/about"]
  },
  {
    path: "/guides/real-world-transfer-test-notes",
    category: "검증 기록",
    navTitle: "실제 전송 테스트 노트",
    title: "Vibe Share 실제 전송 테스트 노트 | 확인한 범위와 한계",
    description: "저장소의 자동 통합 테스트와 공개 운영 점검에서 확인한 PC to phone, phone to PC, 여러 파일, 수락/거절, health 확인 범위를 투명하게 정리합니다.",
    summary: "확인한 것과 확인하지 않은 것을 분리했습니다. 기기명이나 속도 수치는 실제 근거가 없으면 쓰지 않습니다.",
    target: "서비스가 실제로 어떤 범위까지 검증되었는지 알고 싶은 사용자",
    problem: "지원 기기와 성공률을 과장하지 않고 확인된 범위만 보고 싶을 때",
    published: SITE_UPDATED,
    modified: SITE_UPDATED,
    intro: "이 문서는 마케팅용 성공담이 아닙니다. 저장소에 남아 있는 자동 통합 테스트, 운영 체크 문서, 공개 URL health 확인을 기준으로 Vibe Share가 검증한 범위와 아직 확인하지 않은 범위를 나눕니다. 실제 기기명, 브라우저 버전, 전송 속도 수치는 이 저장소만으로 확정할 수 없으면 쓰지 않습니다.",
    sections: [
      {
        heading: "자동 통합 테스트에서 확인한 흐름",
        paragraphs: [
          "현재 통합 스모크 테스트는 임시 서버를 띄운 뒤 6자리 세션 생성, 코드로 참여, PC 역할 소켓 연결, 모바일 역할 소켓 연결, device trust 검증, PC에서 모바일 방향 전송, 모바일에서 PC 방향 전송을 확인합니다.",
          "또한 여러 파일을 보냈을 때 한 파일은 수락하고 다른 파일은 거절하는 흐름, 그리고 resumable upload 경로로 PC to mobile 및 mobile to PC 텍스트 파일을 보내고 다시 다운로드하는 흐름을 확인합니다. 이 테스트는 실제 휴대폰 카메라 테스트가 아니라 API와 Socket.IO 흐름을 검증하는 프로그램 테스트입니다."
        ]
      },
      {
        heading: "공개 운영에서 확인하는 것",
        bullets: [
          "<code>https://api.getvibeshare.com/health</code>가 응답하는지 확인합니다.",
          "<code>https://api.getvibeshare.com/api/info</code>에서 공개 web/API 주소, 스토리지, DB, 캐시, 실시간 어댑터 상태를 확인합니다.",
          "<code>https://app.getvibeshare.com</code>과 QR join 경로가 열리는지 확인합니다.",
          "Railway API 로그, Cloudflare Pages 배포 상태, R2 CORS/업로드 상태를 장애 조사 순서로 확인합니다."
        ]
      },
      {
        heading: "아직 쓰지 않는 주장",
        paragraphs: [
          "특정 iPhone 모델, 특정 Android 모델, 특정 Safari/Chrome 버전에서 항상 된다고 쓰지 않습니다. 실제 기기별 결과는 소유자가 스크린샷과 함께 확인해야 합니다. 전송 속도, 성공률, 사용자 수, 전송 수 같은 수치도 근거가 없으면 만들지 않습니다.",
          "이 페이지의 결론은 <code>검증이 끝났다</code>가 아니라 <code>검증 범위를 공개한다</code>입니다. 실제 사용자가 실패할 수 있는 지점은 문제 해결 가이드와 문의 페이지로 연결해 계속 줄여야 합니다."
        ]
      }
    ],
    related: ["/guides/troubleshooting-qr-file-transfer", "/guides/how-vibe-share-was-built", "/contact"]
  },
  {
    path: "/guides/file-transfer-method-comparison",
    category: "대안 비교",
    navTitle: "파일 전송 방법 비교",
    title: "파일 전송 방법 비교: USB, 메신저, 이메일, 클라우드, AirDrop, Vibe Share",
    description: "USB 케이블, 메신저, 이메일, 클라우드 드라이브, AirDrop, Vibe Share를 설치, 로그인, OS 제약, 양방향 전송, 적합한 상황 기준으로 비교합니다.",
    summary: "Vibe Share가 항상 우월하다고 말하지 않습니다. 상황별로 어떤 방법이 맞는지 표로 비교합니다.",
    target: "파일 전송 방법을 상황에 맞게 고르고 싶은 사용자",
    problem: "검색 결과마다 특정 도구만 추천해 실제 장단점을 비교하기 어려울 때",
    published: SITE_UPDATED,
    modified: SITE_UPDATED,
    intro: "파일 전송에는 정답 하나가 없습니다. 큰 파일을 안정적으로 옮기는 상황과 공용 PC에서 개인 로그인을 피해야 하는 상황은 다른 문제입니다. 아래 비교는 Vibe Share를 포함한 여러 방법을 실제 사용 단계와 제약 중심으로 정리한 것입니다.",
    sections: [
      {
        heading: "방법별 비교",
        table: {
          headers: ["방법", "설치/로그인", "OS 제약", "양방향", "적합한 상황", "부적합한 상황"],
          rows: [
            ["USB 케이블", "케이블과 장치 권한 필요", "케이블, 드라이버, MTP/iPhone 신뢰 설정 영향", "가능", "큰 파일, 폴더 복사, 인터넷 불안정", "케이블이 없거나 공용 PC 정책이 막을 때"],
            ["메신저", "계정 로그인 필요", "앱 또는 웹 로그인 정책 영향", "가능", "이미 로그인된 개인 기기에서 빠른 공유", "업무 PC 로그인, 원본 품질, 흔적 관리가 부담일 때"],
            ["이메일", "계정 로그인 필요", "첨부 용량과 보안 검사 영향", "가능", "기록이 필요한 문서 전달", "큰 파일, 반복 첨부, 즉시 확인이 필요한 상황"],
            ["클라우드 드라이브", "계정과 업로드 공간 필요", "조직 정책과 공유 권한 영향", "가능", "장기 보관, 여러 사람 공유", "임시 파일 하나를 빠르게 옮길 때"],
            ["AirDrop", "Apple 기기 생태계 필요", "Apple 기기 중심", "가능", "iPhone과 Mac 사이의 근거리 전송", "Windows PC, Android, 회사 정책이 다른 환경"],
            ["Vibe Share", "공개 웹앱 접속, 계정 로그인 없음", "브라우저와 인터넷 연결 영향", "가능", "옆에 있는 PC와 휴대폰 사이 임시 전송", "장기 보관, 대량 백업, 백그라운드 대용량 전송"]
          ]
        }
      },
      {
        heading: "Vibe Share를 고를 만한 순간",
        paragraphs: [
          "PC에 카메라가 없고, 휴대폰은 카메라로 PC 화면을 볼 수 있으며, 두 기기가 인터넷에 연결되어 있을 때 Vibe Share가 간단합니다. 공개 서비스에서는 같은 네트워크 이름보다 공개 HTTPS 주소 접근 가능 여부가 중요하고, 로컬 개발에서만 LAN IP와 같은 네트워크 조건이 중요합니다.",
          "파일을 받는 쪽에서 수락/거절을 선택할 수 있고, 같은 세션에서 PC to phone과 phone to PC를 모두 처리한다는 점도 장점입니다."
        ]
      },
      {
        heading: "다른 방법을 고르는 편이 나은 순간",
        paragraphs: [
          "장기 보관, 여러 명과의 공유, 자동 동기화는 클라우드 드라이브가 맞습니다. 매우 큰 파일 묶음이나 폴더 복사는 USB 또는 외장 저장장치가 더 예측 가능합니다. Apple 기기끼리라면 AirDrop이 더 자연스러울 수 있습니다.",
          "Vibe Share는 모든 전송 문제를 해결하는 만능 도구가 아니라, 지금 바로 옆의 PC와 휴대폰 사이를 가볍게 잇는 도구로 보는 것이 정확합니다."
        ]
      }
    ],
    related: ["/guides/kakao-email-cable-alternative", "/guides/pc-to-phone-file-transfer", "/guides/data-lifecycle-and-privacy"]
  },
  {
    path: "/guides/data-lifecycle-and-privacy",
    category: "보안",
    navTitle: "데이터 흐름과 개인정보",
    title: "Vibe Share 데이터 흐름과 개인정보: 세션, 임시 저장, 만료",
    description: "브라우저에서 API와 R2로 이어지는 전송 흐름, 세션과 전송 데이터 역할, 임시 저장, 수락 절차, 로그와 민감 파일 주의사항을 설명합니다.",
    summary: "QR, 세션, API, R2, 수락 절차, 로그, 임시 저장과 만료를 사용자가 이해할 수 있는 수준으로 정리했습니다.",
    target: "파일이 어디를 거쳐 가는지 알고 싶은 사용자",
    problem: "QR 연결이 곧 직접 기기간 전송인지, 서버에 무엇이 남는지 궁금할 때",
    published: SITE_UPDATED,
    modified: SITE_UPDATED,
    intro: "Vibe Share v1은 WebRTC 직접 연결이 아니라 서버 릴레이와 객체 스토리지 기반 전송을 사용합니다. 그래서 QR만 스캔한다고 파일이 휴대폰과 PC 사이로 직접 순간 이동하는 것은 아닙니다. 파일은 전송 처리를 위해 API와 임시 저장소를 거칠 수 있습니다.",
    sections: [
      {
        heading: "전송 흐름",
        bullets: [
          "PC가 세션을 만들면 서버는 세션 ID와 6자리 코드를 만들고 QR에는 모바일 웹 경로가 들어갑니다.",
          "휴대폰이 QR 또는 6자리 코드로 참여하면 같은 세션에 PC 역할과 모바일 역할이 연결됩니다.",
          "보내는 쪽은 파일 이름, 크기, MIME 타입 같은 메타데이터와 파일 데이터를 업로드합니다.",
          "받는 쪽은 파일 정보를 보고 수락하거나 거절합니다.",
          "수락하면 다운로드 URL을 받아 브라우저 다운로드 또는 모바일 저장/공유 동작을 진행합니다."
        ]
      },
      {
        heading: "세션과 파일 데이터의 역할",
        paragraphs: [
          "세션은 두 기기가 같은 전송방에 있는지 확인하는 짧은 연결 단위입니다. 코드, 연결 상태, 만료 시간, 역할 정보가 여기에 속합니다. 파일 전송 데이터는 세션 안에서 별도로 만들어지고, 상태는 업로드 중, 수락 대기, 수락됨, 다운로드 시작, 완료, 실패, 거절 같은 값으로 바뀝니다.",
          "운영 구성에서는 PostgreSQL, Redis, Cloudflare R2 같은 서비스를 사용할 수 있습니다. Redis는 짧은 연결 상태와 캐시, PostgreSQL은 세션과 전송 메타데이터, R2는 파일 임시 저장 경로로 쓰일 수 있습니다."
        ]
      },
      {
        heading: "저장, 만료, 로그",
        paragraphs: [
          "기본 설정은 세션 만료 30분, 전송 만료 1시간, 정리 작업 60초 간격입니다. 운영 환경에서는 비용, 브라우저 제한, 스토리지 정책에 따라 실제 권장 크기와 보관 시간이 더 보수적으로 운영될 수 있습니다.",
          "오류 진단과 오남용 방지를 위해 요청 시간, 상태, 오류, IP 같은 운영 로그가 남을 수 있습니다. 파일 이름, 크기, MIME 타입 같은 메타데이터도 전송 처리를 위해 다뤄질 수 있습니다. 자세한 정책 문서는 개인정보처리방침과 보안 안내를 함께 확인하세요."
        ]
      },
      {
        heading: "보장하지 않는 것",
        paragraphs: [
          "Vibe Share는 영구 백업 서비스가 아니며 장기 보관을 보장하지 않습니다. 민감 파일을 보내기 전에는 수신자, 저장 위치, 전송 목적을 직접 확인해야 합니다. 보안과 보관 범위를 과장하는 문구는 사용하지 않습니다.",
          "백그라운드 대용량 전송도 모바일 브라우저 정책의 영향을 받습니다. 긴 전송은 화면을 유지하고, 실패 시 새 QR과 작은 파일로 흐름을 다시 확인하세요."
        ]
      }
    ],
    related: ["/privacy", "/security", "/guides/file-transfer-security-checklist"]
  }
];

export const requiredPagePaths = [
  "/",
  "/about",
  "/how-it-works",
  "/faq",
  "/security",
  "/privacy",
  "/terms",
  "/contact",
  "/guides",
  ...guideArticles.map((article) => article.path)
];

const navItems = [
  { label: "소개", path: "/about" },
  { label: "사용 방법", path: "/how-it-works" },
  { label: "가이드", path: "/guides" },
  { label: "FAQ", path: "/faq" },
  { label: "보안", path: "/security" },
  { label: "개인정보", path: "/privacy" },
  { label: "문의", path: "/contact" }
];

const guideByPath = new Map(guideArticles.map((article) => [article.path, article]));

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Vibe Share",
  url: BASE_URL,
  email: CONTACT_EMAIL
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Vibe Share",
  applicationCategory: "FileTransferApplication",
  operatingSystem: "Web",
  url: APP_URL,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD"
  },
  description: "PC와 휴대폰을 QR 또는 6자리 코드로 연결해 파일을 양방향으로 주고받는 웹 기반 파일 전송 서비스입니다."
};

const webAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Vibe Share",
  url: APP_URL,
  browserRequirements: "Modern desktop and mobile browser",
  applicationCategory: "FileTransferApplication",
  inLanguage: "ko",
  description: "PC 화면의 QR을 휴대폰으로 스캔해 같은 세션에서 PC와 휴대폰 파일을 주고받는 웹앱입니다."
};

const faqItems = [
  {
    question: "PC에 카메라가 필요합니까?",
    answer: "아닙니다. PC는 QR과 6자리 코드를 보여 주고, 스캔은 휴대폰에서 진행합니다."
  },
  {
    question: "같은 Wi-Fi가 반드시 필요합니까?",
    answer: "공개 서비스에서는 두 기기가 같은 네트워크 이름에 붙어 있을 필요가 없습니다. 두 기기가 인터넷에 연결되어 있고 공개 웹앱과 API에 접근할 수 있으면 됩니다. 로컬 개발에서는 PC LAN IP와 같은 네트워크가 필요할 수 있습니다."
  },
  {
    question: "한 번 연결하면 양방향 전송이 되나요?",
    answer: "네. 같은 연결 세션에서 PC에서 휴대폰으로, 휴대폰에서 PC로 모두 보낼 수 있습니다."
  },
  {
    question: "받는 쪽이 파일을 거절할 수 있나요?",
    answer: "네. 받는 쪽은 파일 이름과 크기를 확인한 뒤 수락하거나 거절할 수 있습니다."
  },
  {
    question: "여러 파일을 보낼 수 있나요?",
    answer: "웹앱은 여러 파일 선택을 지원하며 파일별로 전송 요청과 수락/거절 상태가 처리됩니다. 매우 큰 묶음은 먼저 작은 파일로 흐름을 확인하는 것이 좋습니다."
  },
  {
    question: "파일은 계속 보관되나요?",
    answer: "아닙니다. Vibe Share는 전송 처리를 위한 임시 저장을 전제로 합니다. 세션과 전송 데이터는 만료 및 정리 정책의 대상입니다."
  },
  {
    question: "민감한 파일도 보내도 되나요?",
    answer: "민감한 파일은 전송 전 수신 기기와 저장 위치를 다시 확인하세요. HTTPS와 수락 절차를 사용하지만 모든 위험이 사라진다고 표현하지 않습니다."
  },
  {
    question: "QR이 안 열리면 어떻게 하나요?",
    answer: "화면 밝기와 브라우저를 확인하고, 필요하면 6자리 코드를 직접 입력하세요. 계속 실패하면 PC에서 새 QR을 만든 뒤 다시 연결하는 것이 좋습니다."
  }
];

const basePages = [
  {
    path: "/",
    title: "Vibe Share | QR로 PC와 휴대폰 파일 전송",
    description: "Vibe Share는 PC 화면의 QR을 휴대폰으로 스캔해 같은 세션에서 PC와 휴대폰 파일을 양방향으로 전송하는 웹앱입니다.",
    hero: true,
    structuredData: [organizationJsonLd, softwareJsonLd, webAppJsonLd],
    body: `
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">QR 기반 파일 전송</p>
          <h1>PC 카메라 없이, 휴대폰과 파일을 주고받습니다.</h1>
          <p class="lead">Vibe Share는 PC 화면의 QR 또는 6자리 코드를 휴대폰이 읽어 같은 세션을 만들고, 그 안에서 PC -> phone과 phone -> PC 전송을 모두 처리하는 web-first 파일 전송 서비스입니다.</p>
          <div class="actions">
            <a class="button" href="${APP_URL}">웹앱 열기</a>
            <a class="button secondary" href="/how-it-works">사용 방법 보기</a>
          </div>
        </div>
        <div class="hero-visual" aria-label="Vibe Share 연결 화면 예시">
          <div class="browser-frame">
            <div class="browser-bar"><span></span><span></span><span></span></div>
            <div class="screen-grid">
              <div class="qr-card">
                <div class="qr-pattern" aria-hidden="true"></div>
                <strong>123456</strong>
              </div>
              <div class="transfer-panel">
                <span class="status-chip">연결 대기 중</span>
                <h2>휴대폰 연결</h2>
                <p>PC는 QR을 보여 주고, 휴대폰이 스캔합니다. 연결 뒤 두 방향 전송이 모두 가능합니다.</p>
                <div class="mini-actions">
                  <span>PC -> phone</span>
                  <span>phone -> PC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <p class="eyebrow">What it solves</p>
          <h2>케이블, 메신저 로그인, 자기 자신에게 메일 보내기를 줄입니다.</h2>
          <p>Vibe Share는 파일 몇 개를 지금 옆의 PC와 휴대폰 사이에서 옮기는 상황에 맞춰 만들었습니다. 장기 보관이나 대량 백업이 아니라 임시 전송을 빠르게 끝내는 데 초점을 둡니다.</p>
        </div>
        <div class="grid">
          <article class="card"><h3>PC 카메라 불필요</h3><p>PC는 QR과 6자리 코드를 표시합니다. 휴대폰이 한 번 스캔하거나 코드를 입력하면 됩니다.</p></article>
          <article class="card"><h3>한 세션 양방향</h3><p>연결을 다시 만들지 않고 PC에서 휴대폰으로, 휴대폰에서 PC로 파일을 보낼 수 있습니다.</p></article>
          <article class="card"><h3>수락과 거절</h3><p>받는 쪽은 파일 이름과 크기를 확인하고 수락하거나 거절합니다.</p></article>
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <p class="eyebrow">Best fit</p>
          <h2>이런 경우에 적합합니다.</h2>
        </div>
        <ul class="check-list">
          <li>PC에 있는 PDF, 이미지, 압축 파일을 휴대폰에서 바로 확인해야 할 때</li>
          <li>휴대폰 사진이나 캡처 이미지를 Windows PC로 빠르게 옮겨야 할 때</li>
          <li>공용 PC나 회사 PC에서 개인 메신저 로그인을 피하고 싶을 때</li>
          <li>같은 자리에서 두 기기를 모두 보고 있고, 받는 쪽이 파일을 확인한 뒤 받고 싶을 때</li>
        </ul>
      </section>

      <section class="section split">
        <div>
          <p class="eyebrow">How it works</p>
          <h2>실제 사용 순서</h2>
          <ol class="number-list">
            <li>PC에서 <a href="${APP_URL}">${APP_URL}</a>을 엽니다.</li>
            <li>휴대폰 카메라로 PC 화면의 QR을 스캔하거나 6자리 코드를 입력합니다.</li>
            <li>연결됨 상태를 확인합니다.</li>
            <li>보내는 쪽이 파일을 선택합니다.</li>
            <li>받는 쪽이 파일 이름과 크기를 보고 수락 또는 거절합니다.</li>
            <li>수락한 파일은 브라우저 다운로드 또는 저장/공유 동작으로 받습니다.</li>
          </ol>
        </div>
        <div class="note">
          <strong>핵심 제한사항</strong>
          <p>인터넷 연결이 필요합니다. 전송 중 페이지를 닫거나 모바일 브라우저가 백그라운드로 내려가면 연결이 끊길 수 있습니다. Vibe Share는 영구 보관 서비스가 아닙니다.</p>
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <p class="eyebrow">Recent guides</p>
          <h2>운영 경험을 담은 가이드</h2>
          <p>기능 소개를 반복하기보다 실제 만들고 운영하면서 확인한 데이터 흐름, 테스트 범위, 실패 대처법을 정리했습니다.</p>
        </div>
        ${guideCards(4)}
        <p class="more-link"><a href="/guides">전체 가이드 보기</a></p>
      </section>

      <section class="section split">
        <div>
          <p class="eyebrow">Official links</p>
          <h2>전송은 웹앱에서, 정책은 공식 사이트에서 확인하세요.</h2>
          <p>일반 사용자는 API 주소를 직접 입력할 필요가 없습니다. 전송은 웹앱에서 시작하고, 보안·개인정보·약관은 이 공식 사이트의 문서를 확인하면 됩니다.</p>
        </div>
        <div class="policy-links">
          <a href="${APP_URL}">실제 웹앱 열기</a>
          <a href="/security">보안 안내</a>
          <a href="/privacy">개인정보처리방침</a>
          <a href="/terms">이용약관</a>
        </div>
      </section>
    `
  },
  {
    path: "/about",
    title: "Vibe Share 소개 | 만든 이유와 운영 원칙",
    description: "Vibe Share를 누가 왜 만들었는지, 현재 web-first 서비스 범위, 베타 운영 상태, 할 수 있는 것과 없는 것, 문의 방법을 설명합니다.",
    structuredData: [organizationJsonLd, softwareJsonLd],
    body: `
      ${pageHeader("서비스 소개", "PC와 휴대폰 사이의 짧은 파일 이동을 단순하게 만듭니다.", "Vibe Share는 PC 카메라 없이 휴대폰이 PC 화면의 QR을 한 번 스캔해 같은 세션에서 파일을 주고받도록 만든 web-first 서비스입니다.")}
      <section class="section">
        <h2>누가, 왜 만들었나요?</h2>
        <p>Vibe Share는 PC와 휴대폰 사이에서 파일 하나를 옮길 때 케이블, 메신저, 이메일, 클라우드를 매번 돌아가야 하는 불편에서 출발했습니다. 개발자가 아닌 사용자도 PC에서 앱을 열고 휴대폰으로 QR을 스캔하는 정도의 절차만 이해하면 사용할 수 있게 하는 것이 목표입니다.</p>
        <p>작성자 표기는 실제 개인 이름을 공개적으로 확정할 수 없어 <code>Vibe Share 운영팀</code>으로 유지합니다. 허구의 창업자 이름, 가짜 회사 주소, 가짜 사용자 수는 만들지 않습니다.</p>
      </section>
      <section class="section split">
        <div>
          <h2>현재 서비스 범위</h2>
          <p>현재 공개 기본 흐름은 web-first입니다. 공식 사이트는 <code>getvibeshare.com</code>, 실제 전송 웹앱은 <code>app.getvibeshare.com</code>, API는 <code>api.getvibeshare.com</code>으로 분리되어 있습니다. 일반 사용자는 전송을 위해 웹앱 주소만 열면 됩니다.</p>
          <p>초기 운영 상태이므로 모든 브라우저, 모든 기기, 모든 파일 형식에서 같은 결과를 보장하지 않습니다. 문제가 생기면 새 QR로 다시 연결하고, 작은 파일로 흐름을 확인한 뒤 다시 시도하는 것이 좋습니다.</p>
        </div>
        <div class="note">
          <strong>OpenAI 공식 서비스가 아닙니다</strong>
          <p>제작 과정에서 ChatGPT와 Codex를 도구로 활용했지만, Vibe Share는 OpenAI의 공식, 후원, 제휴, 승인 서비스가 아닙니다.</p>
        </div>
      </section>
      <section class="section">
        <h2>할 수 있는 것과 할 수 없는 것</h2>
        <div class="grid">
          <article class="card"><h3>할 수 있는 것</h3><p>QR 또는 6자리 코드로 연결하고, 같은 세션에서 PC -> phone과 phone -> PC 파일 전송을 처리합니다. 받는 쪽은 수락하거나 거절할 수 있습니다.</p></article>
          <article class="card"><h3>제한되는 것</h3><p>장기 보관, 폴더 전체 동기화, 백그라운드 대용량 전송, 모든 기기 조합의 완전한 호환성은 보장하지 않습니다.</p></article>
          <article class="card"><h3>운영 확인</h3><p>운영자는 health, api/info, 로그, R2/CORS 상태, Cloudflare Pages 배포 상태를 확인해 장애 원인을 좁힙니다.</p></article>
        </div>
      </section>
      <section class="section">
        <h2>최근 업데이트</h2>
        <p>최근 업데이트: ${SITE_UPDATED}. AdSense 재검토 전에 얇은 제품 소개 문구를 줄이고, 실제 제작 과정, 검증 범위, 데이터 흐름, 제한사항을 설명하는 자료를 보강했습니다.</p>
        <p>문의는 <span class="contact-email">${CONTACT_EMAIL_DISPLAY}</span> 으로 안내합니다. 실제 수신 가능 여부는 소유자 확인 항목으로 별도 문서에 남겨 두었습니다.</p>
      </section>
      <section class="section related-links">
        <h2>관련 자료</h2>
        <ul>
          <li><a href="/guides/how-vibe-share-was-built">Vibe Share를 만든 과정</a></li>
          <li><a href="/guides/real-world-transfer-test-notes">실제 전송 테스트 노트</a></li>
          <li><a href="/security">보안 안내</a></li>
          <li><a href="/contact">문의</a></li>
        </ul>
      </section>
    `
  },
  {
    path: "/how-it-works",
    title: "Vibe Share 사용 방법 | QR 연결과 양방향 전송",
    description: "PC에서 QR과 6자리 코드를 만들고 휴대폰으로 연결한 뒤 PC to phone, phone to PC 전송을 수락/거절하는 방법을 단계별로 안내합니다.",
    structuredData: [softwareJsonLd],
    body: `
      ${pageHeader("사용 방법", "PC에서 열고, 휴대폰으로 스캔하고, 원하는 방향으로 보냅니다.", "PC가 QR을 스캔하지 않습니다. 휴대폰이 PC 화면을 한 번 스캔하면 같은 세션에서 양방향 전송을 사용할 수 있습니다.")}
      <section class="section steps">
        <article><span>1</span><h2>PC에서 웹앱 열기</h2><p>PC 브라우저에서 <a href="${APP_URL}">${APP_URL}</a>을 엽니다. 새 세션이 만들어지면 QR 코드와 6자리 코드가 보입니다.</p></article>
        <article><span>2</span><h2>휴대폰으로 연결</h2><p>휴대폰 카메라로 QR을 스캔합니다. QR이 어렵다면 6자리 코드를 직접 입력합니다. 공개 서비스에서는 두 기기가 같은 네트워크 이름에 붙어 있을 필요가 없습니다.</p></article>
        <article><span>3</span><h2>연결 상태 확인</h2><p>PC와 휴대폰이 모두 연결됨 상태가 되면 전송 버튼을 사용할 수 있습니다. 한쪽만 연결된 상태에서는 보내지 않는 것이 좋습니다.</p></article>
        <article><span>4</span><h2>파일 선택</h2><p>PC에서 휴대폰으로 보내거나, 휴대폰에서 PC로 보낼 수 있습니다. 여러 파일은 파일별로 전송 요청이 만들어집니다.</p></article>
        <article><span>5</span><h2>받는 쪽에서 수락 또는 거절</h2><p>파일 이름과 크기를 확인합니다. 예상한 파일이면 수락하고, 잘못 선택했거나 모르는 파일이면 거절합니다.</p></article>
        <article><span>6</span><h2>다운로드 또는 저장</h2><p>수락 후 PC는 브라우저 다운로드 폴더를, iPhone은 Safari 다운로드 또는 파일 앱 Downloads 위치를 확인합니다.</p></article>
      </section>
      <section class="section split">
        <div>
          <h2>세션 복구와 한계</h2>
          <p>웹앱은 짧은 새로고침이나 최근 연결 정보를 일부 복구하려고 하지만, 세션 만료나 서버 재시작, 오래된 QR, 브라우저 백그라운드 정리까지 모두 보장하지 않습니다. 전송 중에는 두 기기의 페이지를 유지하세요.</p>
          <p>문제가 생기면 같은 화면에서 계속 반복하기보다 새 QR을 만들고 다시 연결하는 것이 가장 빠른 해결책인 경우가 많습니다.</p>
        </div>
        <div class="note">
          <strong>로컬 개발 안내</strong>
          <p>공개 서비스와 달리 로컬 개발에서는 휴대폰이 PC의 <code>localhost</code>에 접근할 수 없습니다. 이때는 PC LAN IP와 같은 Wi-Fi 또는 핫스팟이 필요합니다.</p>
        </div>
      </section>
      <section class="section">
        <h2>두 방향 전송의 차이</h2>
        <p>PC에서 휴대폰으로 보낼 때는 PC 브라우저가 파일을 업로드하고 휴대폰이 수락 후 저장합니다. 휴대폰에서 PC로 보낼 때는 모바일 브라우저가 파일을 업로드하고 PC 브라우저가 수락 후 다운로드합니다. 방향은 다르지만 같은 세션, 같은 수락/거절 절차, 같은 전송 상태를 사용합니다.</p>
        <p>PC 쪽 업로드는 대용량을 고려한 resumable upload 경로가 있고, 모바일 웹과 Expo 호환 흐름은 쉬운 첫 실행을 위해 relay 경로를 함께 유지합니다. 사용자는 내부 경로를 고를 필요 없이 화면의 버튼을 따르면 됩니다.</p>
      </section>
      <section class="section related-links">
        <h2>다음에 볼 글</h2>
        <ul>
          <li><a href="/guides/pc-to-phone-file-transfer">PC에서 휴대폰으로 파일 보내기</a></li>
          <li><a href="/guides/android-to-pc-file-transfer">안드로이드 파일 PC로 보내기</a></li>
          <li><a href="/guides/troubleshooting-qr-file-transfer">QR 전송 문제 해결</a></li>
        </ul>
      </section>
    `
  },
  {
    path: "/faq",
    title: "Vibe Share FAQ | 자주 묻는 질문",
    description: "Vibe Share의 QR 연결, 같은 Wi-Fi 필요 여부, 양방향 전송, 수락/거절, 여러 파일, 임시 저장, 문제 해결을 답변합니다.",
    structuredData: [
      softwareJsonLd,
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer
          }
        }))
      }
    ],
    body: `
      ${pageHeader("FAQ", "Vibe Share를 사용하기 전에 자주 확인하는 질문입니다.", "연결 방식, 전송 방향, 저장 방식, 보안 안내와 문제 해결 자료를 짧고 구체적으로 정리했습니다.")}
      <section class="section faq-list">
        ${faqItems.map((item) => `<article><h2>${item.question}</h2><p>${item.answer}</p></article>`).join("")}
      </section>
      <section class="section">
        <h2>상황별 도움말</h2>
        <p>처음 연결이 어렵다면 QR 원리와 문제 해결 가이드부터 확인하세요. 데이터 흐름과 임시 저장이 궁금하면 개인정보·보안 관련 글을 함께 읽는 것이 좋습니다.</p>
        ${guideCards(4)}
      </section>
    `
  },
  {
    path: "/security",
    title: "Vibe Share 보안 안내 | QR 연결과 임시 전송",
    description: "Vibe Share의 HTTPS, 세션 기반 QR 연결, 수락/거절, 임시 저장, 로그, 민감 파일 전송 시 사용자 확인사항을 안내합니다.",
    structuredData: [softwareJsonLd],
    body: `
      ${pageHeader("보안 안내", "전송 전에 수신자를 확인하고, 받는 쪽이 수락한 파일만 받습니다.", "Vibe Share는 빠른 전송을 돕지만 사용자가 파일의 성격과 저장 위치를 확인하는 과정이 반드시 필요합니다.")}
      <section class="section">
        <div class="grid">
          <article class="card"><h2>HTTPS와 공식 도메인</h2><p>공개 공식 사이트와 웹앱은 HTTPS 주소를 사용합니다. 파일 전송은 <code>app.getvibeshare.com</code>에서 시작하고, 비슷한 이름의 다른 도메인을 주의하세요.</p></article>
          <article class="card"><h2>세션 기반 연결</h2><p>QR 또는 6자리 코드는 휴대폰을 같은 세션으로 안내합니다. PC는 QR을 보여 주고 휴대폰이 스캔합니다.</p></article>
          <article class="card"><h2>수락/거절</h2><p>받는 쪽은 파일 이름과 크기를 확인한 뒤 수락하거나 거절할 수 있습니다. 예상과 다르면 거절하세요.</p></article>
        </div>
      </section>
      <section class="section">
        <h2>임시 저장과 운영 로그</h2>
        <p>Vibe Share v1은 서버 릴레이와 객체 스토리지 기반 전송을 사용합니다. 파일은 전송 처리를 위해 서버 또는 Cloudflare R2 같은 S3 호환 객체 스토리지에 임시 저장될 수 있습니다. 세션과 전송 데이터는 만료 및 정리 정책의 대상입니다.</p>
        <p>운영자는 오류 진단, 오남용 방지, 안정성 확인을 위해 요청 시간, 상태, 오류, IP 같은 기본 운영 정보를 확인할 수 있습니다. 자세한 설명은 <a href="/guides/data-lifecycle-and-privacy">데이터 흐름과 개인정보</a> 및 <a href="/privacy">개인정보처리방침</a>을 참고하세요.</p>
      </section>
      <section class="section">
        <h2>운영자가 확인하는 항목</h2>
        <p>공개 API는 <code>/health</code>와 <code>/api/info</code>에서 스토리지, 데이터베이스, 캐시, 실시간 어댑터 상태를 노출합니다. 운영 점검에서는 Railway API 로그, Postgres, Redis, Cloudflare R2, Cloudflare Pages 배포 상태를 함께 확인합니다.</p>
        <p>이 정보는 사용자 파일 내용을 읽겠다는 의미가 아닙니다. 장애가 발생했을 때 세션 생성, 업로드, 수락, 다운로드 중 어느 단계에서 실패했는지 좁히기 위한 운영 신호입니다.</p>
        <p>사용자에게는 이 운영 정보를 직접 조작할 권한을 제공하지 않습니다. 공개 페이지에서는 어떤 값이 정상인지 설명하고, 실제 운영 secret이나 내부 계정 정보는 노출하지 않습니다.</p>
      </section>
      <section class="section note">
        <strong>민감 파일 전송 전 주의</strong>
        <p>계약서, 신분증, 금융 자료처럼 민감한 파일은 받는 기기와 저장 위치를 다시 확인하세요. Vibe Share는 보안 위험이 모두 사라진다고 약속하지 않습니다.</p>
        <p>공용 PC에서 받은 파일은 필요한 작업을 마친 뒤 다운로드 폴더와 최근 파일 목록을 확인하세요. 휴대폰에서 받은 파일도 Safari 다운로드 또는 파일 앱 위치에 남을 수 있으므로 공유 전에 저장 위치를 확인하는 것이 좋습니다.</p>
      </section>
    `
  },
  {
    path: "/privacy",
    title: "개인정보처리방침 | Vibe Share",
    description: "Vibe Share가 처리할 수 있는 세션, 파일 메타데이터, 임시 파일, 로그, 쿠키와 광고 관련 정보를 설명합니다.",
    structuredData: [organizationJsonLd, softwareJsonLd],
    body: `
      ${pageHeader("개인정보처리방침", "Vibe Share가 처리할 수 있는 정보와 목적을 설명합니다.", "이 문서는 서비스 운영을 위한 안내 문서이며, 법률 검토나 운영 정책 변경에 따라 갱신될 수 있습니다.")}
      <section class="section">
        <h2>서비스 목적</h2>
        <p>Vibe Share는 PC와 휴대폰을 QR 또는 6자리 코드로 연결해 파일을 전송하는 웹 기반 서비스입니다. 서비스 제공을 위해 세션, 기기 역할, 파일 메타데이터, 전송 상태를 처리할 수 있습니다.</p>
      </section>
      <section class="section">
        <h2>처리할 수 있는 정보</h2>
        <ul class="check-list">
          <li>세션 ID, 페어링 코드 관련 메타데이터</li>
          <li>PC 또는 모바일 역할, 연결 상태, 전송 상태</li>
          <li>파일 이름, 파일 크기, MIME 타입</li>
          <li>전송 처리를 위한 임시 파일 데이터</li>
          <li>요청 IP, 시간, 오류 로그 같은 기본 운영 정보</li>
        </ul>
      </section>
      <section class="section">
        <h2>파일 전송 처리 방식</h2>
        <p>사용자가 파일을 선택하면 전송 요청이 생성되고, 받는 쪽은 파일 정보를 확인한 뒤 수락하거나 거절할 수 있습니다. 수락한 경우 다운로드 또는 저장 동작이 진행됩니다.</p>
        <p>파일은 전송 처리를 위해 서버 또는 S3 호환 객체 스토리지에 임시 저장될 수 있습니다. Vibe Share는 장기 보관 서비스를 목표로 하지 않으며 전송을 위한 임시 처리를 기본 방향으로 합니다.</p>
      </section>
      <section class="section">
        <h2>만료와 삭제</h2>
        <p>기본 설정은 세션 만료 30분, 전송 만료 1시간, 정리 작업 60초 간격입니다. 운영 환경에서는 비용, 보안, 장애 대응 상황에 따라 정책이 조정될 수 있습니다.</p>
        <p>전송이 완료되었거나 실패했거나 만료된 임시 파일은 정리 대상입니다. 사용자가 장기 보관을 기대해야 하는 서비스가 아니므로, 받은 파일은 필요한 위치에 직접 저장하고 백업이 필요하면 별도 저장소를 사용해야 합니다.</p>
      </section>
      <section class="section">
        <h2>쿠키, 분석, 광고</h2>
        <p>공식 사이트와 웹앱은 서비스 안정성 확인, 보안 점검, 사용성 개선을 위해 쿠키 또는 유사 기술을 사용할 수 있습니다. Google AdSense 같은 광고 서비스가 적용되면 광고 제공과 부정 사용 방지를 위해 관련 쿠키 또는 식별자가 사용될 수 있습니다.</p>
      </section>
      <section class="section">
        <h2>사용자의 선택과 문의</h2>
        <p>파일 전송 전에는 파일 내용과 수신 기기를 직접 확인할 수 있습니다. 받는 쪽은 수락 또는 거절을 선택할 수 있고, 문제가 생기면 전송 방향, 파일 종류, 오류 문구를 포함해 문의할 수 있습니다.</p>
        <p>개인정보 또는 전송 기록 관련 요청은 문의 주소로 접수합니다. 실제 수신 가능 여부는 소유자가 확인해야 하며, 가짜 문의 폼이나 확인되지 않은 연락처는 만들지 않습니다.</p>
      </section>
      <section class="section">
        <h2>제3자 서비스</h2>
        <p>운영자는 Cloudflare, Railway, S3 호환 객체 스토리지, Redis, PostgreSQL, Google AdSense 같은 제3자 서비스를 사용할 수 있습니다. 각 서비스는 호스팅, 보안, 저장, 캐시, 광고 심사와 운영 목적에 따라 제한적으로 사용됩니다.</p>
      </section>
      <section class="section">
        <h2>문의</h2>
        <p>개인정보 관련 문의는 <span class="contact-email">${CONTACT_EMAIL_DISPLAY}</span> 으로 보낼 수 있습니다. 메일을 보낼 때 [at]을 @로 바꿔 주세요.</p>
      </section>
    `
  },
  {
    path: "/terms",
    title: "이용약관 | Vibe Share",
    description: "Vibe Share 이용 조건, 사용자 책임, 금지 행위, 파일 전송과 저장 제한, 초기 서비스 중단 가능성을 설명합니다.",
    structuredData: [organizationJsonLd, softwareJsonLd],
    body: `
      ${pageHeader("이용약관", "Vibe Share 이용 조건과 사용자 책임을 안내합니다.", "서비스를 사용하기 전에 전송할 파일의 권리, 수신자, 목적을 확인해 주세요.")}
      <section class="section">
        <h2>서비스 이용 조건</h2>
        <p>Vibe Share는 PC와 휴대폰 사이에서 파일을 전송할 수 있도록 돕는 웹 서비스입니다. 사용자는 전송할 권리가 있는 파일만 보내야 하며, 수신자가 파일을 받을 수 있는 상황인지 확인해야 합니다.</p>
      </section>
      <section class="section">
        <h2>금지 행위</h2>
        <ul class="check-list">
          <li>불법 파일, 악성 파일, 타인의 권리를 침해하는 파일 전송</li>
          <li>서비스 안정성을 해치는 자동화, 과도한 요청, 우회 시도</li>
          <li>다른 사람의 기기나 세션을 허가 없이 사용하는 행위</li>
          <li>광고 또는 보안 시스템을 속이거나 오용하는 행위</li>
        </ul>
      </section>
      <section class="section">
        <h2>파일 전송 책임</h2>
        <p>사용자는 자신이 전송하는 파일의 내용과 전송 목적에 대한 책임을 집니다. 받는 쪽은 파일 이름과 크기를 확인하고 수락 또는 거절을 선택할 수 있습니다. Vibe Share는 파일 내용의 적법성이나 수신 후 사용을 대신 판단하지 않습니다.</p>
      </section>
      <section class="section">
        <h2>전송 제한과 실패</h2>
        <p>서비스에는 세션 만료, 전송 만료, 파일 크기, 업로드 청크, 스토리지 정책 같은 운영 제한이 있습니다. 큰 파일이나 불안정한 네트워크에서는 실패할 수 있으며, 실패한 전송은 새 QR로 다시 시작해야 할 수 있습니다.</p>
        <p>사용자는 알 수 없는 파일을 수락하지 않아야 하며, 받은 파일을 실행하거나 공유하기 전 내용과 출처를 확인해야 합니다. Vibe Share는 사용자의 파일 선택과 수신 후 사용을 대신 통제하지 않습니다.</p>
        <p>현재 공개 설명은 확인된 web-first 흐름을 기준으로 합니다. 네이티브 모바일 백그라운드 업로드, 기업용 관리 기능, 장기 보관 정책, 결제 기능은 이 약관에서 제공 중인 기능으로 설명하지 않습니다.</p>
      </section>
      <section class="section">
        <h2>서비스 중단 가능성</h2>
        <p>점검, 장애, 인프라 문제, 보안 대응, 비용 제한 등으로 서비스가 일시적으로 중단될 수 있습니다. 초기 서비스 단계에서는 기능과 정책이 운영 상황에 따라 조정될 수 있습니다.</p>
      </section>
      <section class="section">
        <h2>제한 안내</h2>
        <p>Vibe Share는 계속 개선 중인 서비스입니다. 모든 브라우저, 모든 파일 형식, 모든 네트워크 상황에서 동일한 결과를 보장하지 않습니다. 장기 보관이나 백업이 필요한 파일은 별도 저장소에 보관해야 합니다.</p>
        <p>사용자는 서비스가 파일을 대신 검토하거나 안전성을 판정한다고 기대해서는 안 됩니다. 수신자는 파일을 열기 전 이름, 크기, 출처를 확인하고, 필요하지 않은 파일은 수락하지 않는 방식으로 위험을 줄여야 합니다.</p>
        <p>정책 문서는 공개 서비스의 현재 설명을 기준으로 하며, 운영자가 실제로 제공하지 않는 기능을 약관상 권리처럼 표현하지 않습니다.</p>
      </section>
    `
  },
  {
    path: "/contact",
    title: "문의 | Vibe Share",
    description: "Vibe Share 사용 중 문제가 생겼을 때 보낼 정보, 문의 이메일, 전송 오류를 설명할 때 필요한 항목을 안내합니다.",
    structuredData: [organizationJsonLd],
    body: `
      ${pageHeader("문의", "문제가 생기면 사용 환경과 오류 문구를 함께 보내 주세요.", "전송 방향, 파일 종류, 브라우저 환경을 알려 주면 원인 파악에 도움이 됩니다.")}
      <section class="section split">
        <div>
          <h2>문의 이메일</h2>
          <p><span class="contact-email">${CONTACT_EMAIL_DISPLAY}</span></p>
          <p>메일을 보낼 때 [at]을 @로 바꿔 주세요. 실제 수신 가능 여부는 소유자가 확인해야 하므로 저장소의 owner 확인 문서에도 남겨 두었습니다.</p>
          <p>운영 문의, 오류 제보, 개인정보 관련 문의를 위 주소로 보낼 수 있습니다. 이 페이지에는 가짜 문의 폼을 만들지 않았습니다.</p>
        </div>
        <div class="note">
          <strong>함께 보내면 좋은 정보</strong>
          <ul>
            <li>PC 브라우저와 휴대폰 브라우저 또는 앱 환경</li>
            <li>전송 방향: PC -> phone 또는 phone -> PC</li>
            <li>파일 종류와 대략적인 크기</li>
            <li>QR 또는 6자리 코드 사용 여부</li>
            <li>화면에 보이는 오류 문구</li>
          </ul>
        </div>
      </section>
      <section class="section">
        <h2>먼저 확인할 곳</h2>
        <p>파일 전송 기능은 <a href="${APP_URL}">${APP_URL}</a>에서 사용할 수 있습니다. 연결 문제는 <a href="/guides/troubleshooting-qr-file-transfer">QR 전송 문제 해결</a>, 데이터 처리 방식은 <a href="/guides/data-lifecycle-and-privacy">데이터 흐름과 개인정보</a>, 보안 주의사항은 <a href="/security">보안 안내</a>를 먼저 확인해 주세요.</p>
      </section>
      <section class="section">
        <h2>문의 전 확인하면 좋은 것</h2>
        <p>Vibe Share 문의에서는 세션 코드 전체나 민감한 파일을 보내지 않아도 됩니다. 대신 PC에서 휴대폰으로 보냈는지, 휴대폰에서 PC로 보냈는지, QR 스캔과 6자리 코드 중 어느 방식을 썼는지 알려 주세요.</p>
        <p>파일이 보이지 않는 문제라면 수락/거절 단계까지 갔는지, PC 브라우저 다운로드 목록이나 iPhone Safari 다운로드 위치를 확인했는지도 함께 적어 주세요. API 주소를 직접 입력한 경우에는 공개 웹앱을 사용했는지 로컬 개발 주소를 사용했는지 구분해 주면 원인 파악이 빨라집니다.</p>
        <p>문의 메일에는 API 키, 계정 비밀번호, 주민등록번호, 원본 신분증 이미지 같은 민감정보를 넣지 마세요. 오류 화면을 공유해야 한다면 세션 코드, IP, 이메일, 토큰처럼 개인 또는 운영 정보를 식별할 수 있는 값은 가린 뒤 보내는 것이 좋습니다.</p>
        <p>광고 심사, 정책 문서, 개인정보 요청처럼 파일 전송 오류가 아닌 문의도 같은 주소로 안내합니다. 다만 실제 수신 여부는 소유자 확인이 필요하므로, 이 저장소에는 별도의 확인 문서를 함께 남겨 둡니다.</p>
        <p>문의에 대한 답변 시간이나 해결 보장은 공개 사이트에서 약속하지 않습니다. 초기 운영 서비스이므로 가능한 범위에서 원인을 좁히는 정보를 먼저 모으는 것이 중요합니다.</p>
        <p>반복되는 문제는 FAQ와 문제 해결 가이드에 반영해 같은 질문을 줄이는 방식으로 운영합니다.</p>
      </section>
    `
  }
];

const guideHubPage = {
  path: "/guides",
  title: "파일 전송 가이드 | Vibe Share 실제 사용 자료",
  description: "Vibe Share의 QR 연결, PC to phone, phone to PC, 보안, 데이터 흐름, 제작 기록, 실제 테스트 범위를 상황별 가이드로 정리했습니다.",
  structuredData: [
    organizationJsonLd,
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "파일 전송 가이드",
      url: `${BASE_URL}/guides`,
      inLanguage: "ko",
      hasPart: guideArticles.map((article) => ({
        "@type": "Article",
        headline: article.navTitle,
        url: `${BASE_URL}${article.path}`
      }))
    }
  ],
  body: `
    ${pageHeader("Guides", "파일 전송을 실제로 쓰기 위한 자료 모음", "검색 키워드만 바꾼 글이 아니라 Vibe Share의 연결 구조, 운영 경험, 제한사항, 대안 비교를 상황별로 정리했습니다.")}
    <section class="section">
      <h2>가이드 카테고리</h2>
      <div class="grid">
        <article class="card"><h3>사용 절차</h3><p>PC에서 휴대폰으로, 휴대폰에서 PC로 보내는 실제 클릭 순서와 저장 위치를 다룹니다.</p></article>
        <article class="card"><h3>문제 해결</h3><p>QR 스캔 실패, 연결 끊김, 다운로드 위치, 세션 만료를 순서대로 확인합니다.</p></article>
        <article class="card"><h3>운영 경험</h3><p>제작 과정, 테스트 범위, 데이터 흐름, R2/CORS와 같은 실제 시행착오를 기록합니다.</p></article>
      </div>
    </section>
    <section class="section">
      <div class="section-heading">
        <h2>상황별 가이드</h2>
        <p>각 글은 대상 사용자와 해결하려는 문제를 따로 표시했습니다. 바로 전송하려면 사용 절차를, 신뢰성을 확인하려면 제작 기록과 테스트 노트를 먼저 읽으세요.</p>
      </div>
      ${guideCards(guideArticles.length)}
    </section>
    <section class="section split">
      <div>
        <h2>빠르게 시작하려면</h2>
        <p>파일을 바로 보내야 한다면 PC에서 <a href="${APP_URL}">${APP_URL}</a>을 열고 휴대폰으로 QR을 스캔하세요. 전송 중에는 두 기기의 페이지를 닫지 않는 것이 좋습니다.</p>
      </div>
      <div class="note">
        <strong>먼저 읽으면 좋은 글</strong>
        <p><a href="/guides/real-world-transfer-test-notes">실제 전송 테스트 노트</a>와 <a href="/guides/data-lifecycle-and-privacy">데이터 흐름과 개인정보</a>는 Vibe Share가 무엇을 확인했고 무엇을 보장하지 않는지 분리해 설명합니다.</p>
      </div>
    </section>
  `
};

const guidePages = guideArticles.map((article) => ({
  path: article.path,
  title: article.title,
  description: article.description,
  ogType: "article",
  structuredData: [softwareJsonLd, articleJsonLd(article)],
  body: buildGuideArticleBody(article)
}));

export const pages = [
  ...basePages,
  guideHubPage,
  ...guidePages
];

export function buildPageHtml(page) {
  const canonical = canonicalUrl(page.path);
  const structuredData = [
    ...(page.structuredData || [organizationJsonLd, softwareJsonLd]),
    webPageJsonLd(page),
    ...(page.path === "/" ? [] : [breadcrumbJsonLd(page.path)])
  ];
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:type" content="${page.ogType || "website"}" />
    <meta property="og:site_name" content="Vibe Share" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}"
     crossorigin="anonymous"></script>
    <link rel="stylesheet" href="/styles.css" />
    ${structuredData.map((item) => `<script type="application/ld+json">${safeJsonLd(item)}</script>`).join("\n    ")}
  </head>
  <body>
    <header class="site-header">
      <nav class="nav" aria-label="기본 메뉴">
        <a class="brand" href="/">Vibe Share</a>
        <div class="nav-links">
          ${navItems.map((item) => `<a${item.path === page.path ? " aria-current=\"page\"" : ""} href="${item.path}">${item.label}</a>`).join("")}
          <a class="button small" href="${APP_URL}">웹앱 열기</a>
        </div>
      </nav>
    </header>
    <main class="site-main${page.hero ? " home-main" : ""}">
      ${page.body}
    </main>
    <footer class="site-footer">
      <div>
        <strong>Vibe Share</strong>
        <p>QR 또는 6자리 코드로 PC와 휴대폰을 연결해 파일을 양방향으로 전송하는 web-first 서비스입니다.</p>
      </div>
      <nav aria-label="하단 메뉴">
        <a href="/about">About</a>
        <a href="/guides">Guides</a>
        <a href="/faq">FAQ</a>
        <a href="/security">Security</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/contact">Contact</a>
        <a href="${APP_URL}">App</a>
      </nav>
    </footer>
  </body>
</html>
`;
}

function pageHeader(label, title, description) {
  return `
    <section class="page-hero">
      <p class="eyebrow">${label}</p>
      <h1>${title}</h1>
      <p class="lead">${description}</p>
    </section>
  `;
}

function guideCards(limit) {
  return `
    <div class="guide-grid">
      ${guideArticles.slice(0, limit).map((article) => `
        <article class="card guide-card">
          <p class="eyebrow">${article.category}</p>
          <h3><a href="${article.path}">${article.navTitle}</a></h3>
          <p>${article.summary}</p>
          <dl class="guide-meta">
            <div><dt>대상</dt><dd>${article.target}</dd></div>
            <div><dt>해결 문제</dt><dd>${article.problem}</dd></div>
          </dl>
        </article>
      `).join("")}
    </div>
  `;
}

function buildGuideArticleBody(article) {
  return `
    ${pageHeader(article.category, article.navTitle, article.summary)}
    <article class="section article-content">
      <dl class="article-meta-grid">
        <div><dt>작성자</dt><dd>${DEFAULT_AUTHOR}</dd></div>
        <div><dt>최초 게시일</dt><dd>${article.published}</dd></div>
        <div><dt>최근 수정일</dt><dd>${article.modified}</dd></div>
      </dl>
      <p>${article.intro}</p>
      ${article.sections.map(renderArticleSection).join("")}
    </article>
    <section class="section related-links">
      <h2>관련 가이드</h2>
      <ul>
        <li><a href="/guides">파일 전송 가이드 전체 보기</a></li>
        ${article.related.map((path) => `<li><a href="${path}">${guideLabel(path)}</a></li>`).join("")}
      </ul>
    </section>
    <section class="section related-links">
      <h2>관련 공식 페이지</h2>
      <ul>
        <li><a href="${APP_URL}">Vibe Share 웹앱 열기</a></li>
        <li><a href="/security">보안 안내</a></li>
        <li><a href="/privacy">개인정보처리방침</a></li>
        <li><a href="/faq">FAQ</a></li>
      </ul>
    </section>
  `;
}

function renderArticleSection(section) {
  return `
    <h2>${section.heading}</h2>
    ${(section.paragraphs || []).map((paragraph) => `<p>${paragraph}</p>`).join("")}
    ${section.bullets ? `<ul class="check-list">${section.bullets.map((item) => `<li>${item}</li>`).join("")}</ul>` : ""}
    ${section.table ? renderTable(section.table) : ""}
  `;
}

function renderTable(table) {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${table.headers.map((item) => `<th>${item}</th>`).join("")}</tr></thead>
        <tbody>
          ${table.rows.map((row) => `<tr>${row.map((item) => `<td>${item}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function guideLabel(path) {
  return guideByPath.get(path)?.navTitle || {
    "/about": "서비스 소개",
    "/how-it-works": "사용 방법",
    "/security": "보안 안내",
    "/privacy": "개인정보처리방침",
    "/contact": "문의",
    "/faq": "FAQ"
  }[path] || path;
}

function articleJsonLd(article) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.navTitle,
    description: article.description,
    url: `${BASE_URL}${article.path}`,
    mainEntityOfPage: `${BASE_URL}${article.path}`,
    datePublished: article.published,
    dateModified: article.modified,
    inLanguage: "ko",
    author: {
      "@type": "Organization",
      name: DEFAULT_AUTHOR
    },
    publisher: {
      "@type": "Organization",
      name: "Vibe Share"
    }
  };
}

function webPageJsonLd(page) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.description,
    url: canonicalUrl(page.path),
    inLanguage: "ko",
    author: {
      "@type": "Organization",
      name: DEFAULT_AUTHOR
    },
    dateModified: SITE_UPDATED
  };
}

function breadcrumbJsonLd(pagePath) {
  const parts = pagePath.split("/").filter(Boolean);
  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: `${BASE_URL}/`
    }
  ];

  let current = "";
  parts.forEach((part, index) => {
    current += `/${part}`;
    items.push({
      "@type": "ListItem",
      position: index + 2,
      name: guideLabel(current) || part,
      item: `${BASE_URL}${current}`
    });
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items
  };
}

function canonicalUrl(pagePath) {
  return pagePath === "/" ? `${BASE_URL}/` : `${BASE_URL}${pagePath}`;
}

function safeJsonLd(value) {
  return JSON.stringify(value).replace(/<\/script/gi, "<\\/script");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
