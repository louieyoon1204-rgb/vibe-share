export const BASE_URL = "https://getvibeshare.com";
export const APP_URL = "https://app.getvibeshare.com";
export const CONTACT_EMAIL = "support@getvibeshare.com";
const CONTACT_EMAIL_DISPLAY = CONTACT_EMAIL.replace("@", " [at] ");
export const ADSENSE_CLIENT_ID = "ca-pub-2582922243814482";
export const ADS_TXT_CONTENT = "google.com, pub-2582922243814482, DIRECT, f08c47fec0942fa0";

const GUIDE_DATE = "2026-07-06";

const guideArticles = [
  {
    path: "/guides/pc-to-phone-file-transfer",
    navTitle: "PC에서 휴대폰으로 파일 보내기",
    title: "PC에서 휴대폰으로 파일 보내는 방법 | Vibe Share 가이드",
    description: "PC의 사진, 문서, 압축 파일을 휴대폰으로 옮길 때 케이블, 메일, 메신저 대신 QR 기반 전송을 쓰는 흐름과 주의사항을 정리했습니다.",
    summary: "PC에 있는 파일을 휴대폰으로 빠르게 보내야 할 때 선택할 수 있는 방법과 QR 전송 순서를 비교합니다.",
    intro: "PC에 저장된 사진, PDF, 압축 파일을 휴대폰으로 옮기는 일은 생각보다 자주 생깁니다. 메일에 첨부하면 용량 제한을 만나거나 스스로에게 보내는 과정을 반복해야 하고, 메신저는 파일이 압축되거나 대화방에 흔적이 남습니다. USB 케이블은 안정적이지만 케이블 종류, 드라이버, 권한 허용 창 때문에 간단한 파일 하나에도 시간이 걸릴 수 있습니다. Vibe Share는 PC 화면에 QR과 6자리 코드를 띄우고 휴대폰이 그 연결에 들어오는 방식이라 PC에 카메라가 없어도 사용할 수 있습니다.",
    sections: [
      {
        heading: "가장 단순한 흐름",
        paragraphs: [
          "먼저 PC 브라우저에서 Vibe Share 앱을 엽니다. 화면에 QR 코드와 6자리 코드가 보이면 휴대폰 카메라로 QR을 스캔하거나, QR이 잘 인식되지 않을 때는 코드를 직접 입력합니다. 연결이 완료되면 PC에서 보낼 파일을 선택하고 휴대폰 화면의 수신 요청을 확인합니다. 파일 이름과 크기를 보고 맞는 파일이면 수락하고, 모르는 파일이거나 잘못 고른 파일이면 거절하면 됩니다.",
          "이 방식은 임시 전송에 초점을 둡니다. 파일을 보내기 위해 별도 계정에 로그인하거나 클라우드 폴더를 만들 필요가 없고, 파일을 받은 뒤에는 휴대폰의 다운로드 위치나 공유 메뉴에서 다음 작업을 이어갈 수 있습니다."
        ]
      },
      {
        heading: "케이블, 메일, 메신저와 비교할 점",
        paragraphs: [
          "케이블 전송은 큰 파일에는 여전히 좋은 선택입니다. 다만 잠깐 파일을 보내는 용도라면 케이블을 찾고 연결 모드를 고르는 시간이 더 길 수 있습니다. 메일은 받는 기기에서 바로 열기 쉽지만 용량 제한과 업로드 대기 시간이 생깁니다. 메신저는 익숙하지만 원본 품질을 유지해야 하는 사진이나 업무 파일에는 적합하지 않을 때가 있습니다.",
          "QR 기반 전송은 같은 자리에서 PC와 휴대폰을 함께 보고 있을 때 편합니다. PC 화면을 닫지 않고 연결 상태를 유지한 채 파일을 선택하면 되고, 휴대폰에서 수락 여부를 한 번 더 확인하므로 잘못된 파일을 받는 상황을 줄일 수 있습니다."
        ]
      },
      {
        heading: "보내기 전에 확인할 것",
        paragraphs: [
          "민감한 계약서, 신분증, 계정 정보가 들어간 파일은 보내기 전에 수신 기기가 본인 것인지 확인하세요. 공용 PC에서는 전송이 끝난 뒤 브라우저 탭을 닫고 다운로드 기록이나 미리보기 흔적이 남지 않았는지 살펴보는 것이 좋습니다. 전송 도중에는 PC와 휴대폰의 페이지를 닫지 않아야 하며, 연결이 끊기면 새 QR을 만들어 다시 연결하는 편이 가장 빠릅니다."
        ]
      }
    ],
    related: ["/guides/qr-file-transfer", "/guides/file-transfer-security-checklist", "/guides/troubleshooting-qr-file-transfer"]
  },
  {
    path: "/guides/qr-file-transfer",
    navTitle: "QR 파일 전송 원리",
    title: "QR 코드 파일 전송은 어떻게 작동하나요? | Vibe Share 가이드",
    description: "QR 코드로 PC와 휴대폰을 연결하는 원리, PC 카메라가 필요 없는 이유, 6자리 코드 대체 입력과 연결 끊김 대처법을 설명합니다.",
    summary: "QR은 파일 자체가 아니라 두 기기가 같은 전송 세션에 들어가기 위한 연결 정보를 전달합니다.",
    intro: "QR 코드 파일 전송에서 QR은 파일을 담는 상자가 아닙니다. QR에는 휴대폰이 어떤 전송 방에 들어가야 하는지 알려 주는 짧은 연결 정보가 들어 있습니다. PC는 화면에 QR과 6자리 코드를 보여 주고, 휴대폰은 그 정보를 읽어 같은 세션에 참여합니다. 연결 뒤에는 PC와 휴대폰이 각각 보내는 쪽과 받는 쪽이 될 수 있으므로 한 번 연결한 세션 안에서 양방향 전송을 처리할 수 있습니다.",
    sections: [
      {
        heading: "PC 카메라가 없어도 되는 이유",
        paragraphs: [
          "일반적인 QR 사용 장면을 떠올리면 두 기기 모두 카메라가 필요해 보일 수 있습니다. 하지만 Vibe Share에서는 PC가 QR을 스캔하지 않습니다. PC는 QR을 보여 주는 역할만 하고, 스캔은 휴대폰이 담당합니다. 그래서 데스크톱 PC처럼 카메라가 없는 환경에서도 PC 화면과 휴대폰 카메라만 있으면 연결을 시작할 수 있습니다.",
          "휴대폰 카메라가 QR을 잘 읽지 못하는 환경도 있습니다. 화면 밝기가 낮거나, 모니터 반사가 심하거나, 회사 보안 앱이 카메라 인식을 막을 수 있습니다. 이때는 QR 아래에 표시되는 6자리 코드를 휴대폰에 직접 입력하면 같은 목적을 달성할 수 있습니다."
        ]
      },
      {
        heading: "연결이 끊겼을 때",
        paragraphs: [
          "QR 연결은 브라우저 탭, 네트워크 상태, 세션 만료 시간의 영향을 받습니다. PC 화면을 새로고침하거나 휴대폰 브라우저가 백그라운드에서 정리되면 연결이 끊길 수 있습니다. 이 경우 같은 QR을 오래 붙잡기보다 PC에서 새 세션을 만들고 휴대폰으로 다시 들어가는 편이 안전합니다.",
          "파일 전송 중에는 보내는 쪽과 받는 쪽 모두 페이지를 유지해야 합니다. 수신 확인 화면에서 오래 멈춰 있다면 파일 크기와 네트워크 상태를 확인하고, 실패 메시지가 보이면 같은 파일을 다시 고르기 전에 새 연결을 만드는 것이 좋습니다."
        ]
      },
      {
        heading: "QR을 쓸 때의 장점과 한계",
        paragraphs: [
          "QR 방식의 장점은 입력을 줄인다는 점입니다. 긴 주소를 휴대폰 키보드로 옮겨 적지 않아도 되고, 계정 로그인 없이 같은 자리의 두 기기를 빠르게 연결할 수 있습니다. 반대로 원격지에 있는 사람에게 장기간 파일을 배포하는 용도라면 클라우드 링크나 협업 도구가 더 적합할 수 있습니다. Vibe Share는 지금 옆에 있는 PC와 휴대폰 사이의 빠른 임시 전송에 맞춰 사용하는 것이 좋습니다."
        ]
      }
    ],
    related: ["/guides/pc-to-phone-file-transfer", "/guides/troubleshooting-qr-file-transfer", "/guides/file-transfer-security-checklist"]
  },
  {
    path: "/guides/kakao-email-cable-alternative",
    navTitle: "카톡·메일·케이블 대안",
    title: "카톡, 메일, USB 케이블 대신 파일 보내는 방법 | Vibe Share 가이드",
    description: "카카오톡, 이메일, USB 케이블로 파일을 옮길 때 생기는 용량, 로그인, 압축, 케이블 문제와 웹 기반 QR 전송 대안을 정리했습니다.",
    summary: "익숙한 전송 방법의 불편한 지점을 짚고, 짧은 임시 전송에는 QR 연결이 왜 편한지 설명합니다.",
    intro: "파일을 옮기는 방법은 많지만 상황에 따라 불편함이 달라집니다. 카카오톡은 가장 익숙하지만 회사 PC나 공용 PC에서 로그인하기 부담스러울 수 있고, 사진이나 동영상은 설정에 따라 원본이 아닌 형태로 전달될 수 있습니다. 이메일은 기록이 남고 검색하기 쉽지만 첨부 용량 제한, 업로드 시간, 스팸 검사 대기 같은 변수가 있습니다. USB 케이블은 안정적이지만 케이블 상태와 연결 모드가 맞아야 합니다.",
    sections: [
      {
        heading: "메신저와 메일이 번거로운 순간",
        paragraphs: [
          "개인 메신저를 업무 PC에 로그인하기 싫거나, 반대로 회사 파일을 개인 대화방에 올리는 것이 불편한 경우가 있습니다. 파일 하나를 보내려고 메일 제목을 쓰고, 자기 주소를 입력하고, 첨부 완료를 기다리는 과정도 반복되면 번거롭습니다. 큰 파일은 첨부가 막히거나 링크 변환이 필요해지고, 받은 뒤 다시 다운로드해야 하는 단계가 생깁니다.",
          "사진은 특히 품질 문제가 생기기 쉽습니다. 메신저가 미리보기용으로 압축하거나, 여러 장을 한꺼번에 보낼 때 순서가 바뀌거나, 원본 전송 옵션을 따로 찾아야 할 수 있습니다. 단순히 PC와 휴대폰 사이에서 파일을 잠깐 옮기려는 목적이라면 이런 부가 과정이 과하게 느껴집니다."
        ]
      },
      {
        heading: "케이블 방식이 막히는 이유",
        paragraphs: [
          "USB 케이블은 한 번 연결되면 빠르지만, 충전 전용 케이블인지 데이터 전송이 되는 케이블인지 겉으로 구분하기 어렵습니다. 안드로이드에서는 MTP 권한을 허용해야 하고, 아이폰은 Windows에서 사진 가져오기나 장치 신뢰 설정을 거쳐야 할 수 있습니다. 회사 PC에서는 드라이버 설치가 막히기도 합니다.",
          "Vibe Share 같은 웹 기반 QR 전송은 이런 준비를 줄이는 데 목적이 있습니다. PC에서는 앱 페이지를 열고, 휴대폰은 QR을 읽어 같은 세션에 들어갑니다. 브라우저만 사용할 수 있다면 케이블 종류나 계정 로그인 여부와 무관하게 전송을 시작할 수 있습니다."
        ]
      },
      {
        heading: "어떤 경우에 대안으로 쓰면 좋은가",
        paragraphs: [
          "짧은 시간 안에 몇 개의 문서나 이미지를 옮기는 경우, 로그인 흔적을 남기기 싫은 경우, 케이블이 없거나 인식되지 않는 경우에 QR 전송이 특히 편합니다. 다만 수십 GB 백업, 장기간 공유, 여러 사람에게 동시에 배포하는 목적은 전용 클라우드나 외장 저장장치가 더 적절할 수 있습니다. 목적에 맞게 방법을 고르는 것이 가장 중요합니다."
        ]
      }
    ],
    related: ["/guides/pc-to-phone-file-transfer", "/guides/iphone-to-pc-photo-transfer", "/guides/android-to-pc-file-transfer"]
  },
  {
    path: "/guides/iphone-to-pc-photo-transfer",
    navTitle: "아이폰 사진 PC로 옮기기",
    title: "아이폰 사진을 Windows PC로 옮기는 쉬운 방법 | Vibe Share 가이드",
    description: "AirDrop이 되지 않는 Windows PC에서 아이폰 사진을 옮길 때 겪는 문제와 QR 연결로 케이블 없이 전송하는 흐름을 설명합니다.",
    summary: "Windows 환경에서 아이폰 사진을 PC로 옮길 때 막히는 지점과 브라우저 기반 전송 팁을 정리합니다.",
    intro: "아이폰과 Mac을 함께 쓰면 AirDrop이 편하지만 Windows PC에서는 같은 경험을 기대하기 어렵습니다. 케이블로 연결하면 사진 앱, 장치 신뢰, DCIM 폴더, iCloud 동기화 상태를 확인해야 하고, 회사나 학교 PC에서는 장치 연결 정책 때문에 막힐 수 있습니다. 사진 몇 장을 바로 PC로 옮기고 싶은 상황에서는 이런 절차가 과하게 느껴집니다.",
    sections: [
      {
        heading: "케이블 없이 보내는 기본 흐름",
        paragraphs: [
          "PC에서 Vibe Share 앱을 열고 아이폰으로 QR을 스캔합니다. 연결이 완료되면 아이폰에서 파일 선택을 누르고 사진 보관함 또는 파일 앱에서 보낼 이미지를 고릅니다. PC 화면에는 수신 요청이 표시되고, 파일 이름과 크기를 확인한 뒤 수락하면 다운로드가 진행됩니다. PC는 QR을 보여 주는 역할만 하므로 카메라가 없어도 됩니다.",
          "아이폰은 브라우저와 iOS 버전에 따라 사진 선택 화면의 이름이 조금 다르게 보일 수 있습니다. 최근 사진을 보내려면 사진 보관함을, 편집해 둔 이미지나 문서 앱에 저장한 파일을 보내려면 파일 앱을 선택하는 흐름이 더 자연스럽습니다."
        ]
      },
      {
        heading: "사진 파일을 보낼 때의 팁",
        paragraphs: [
          "여러 장을 한꺼번에 보내기 전에는 먼저 한 장으로 흐름을 확인해 보세요. 대용량 원본 사진이나 동영상은 업로드 시간이 길어질 수 있으므로 화면이 멈춘 것처럼 보이더라도 네트워크가 안정적인지 확인하는 것이 좋습니다. PC 다운로드 폴더에 같은 이름의 파일이 있으면 브라우저가 이름 뒤에 번호를 붙일 수 있습니다.",
          "HEIC 사진을 PC에서 열기 어려운 경우가 있습니다. 이때는 아이폰에서 공유 전에 JPEG로 저장하거나, PC에 HEIC 코덱을 설치해야 할 수 있습니다. Vibe Share는 파일을 옮기는 역할을 하며, 받은 뒤 열 수 있는지는 PC의 앱과 코덱 상태에 영향을 받습니다."
        ]
      },
      {
        heading: "공용 PC에서 주의할 점",
        paragraphs: [
          "공용 PC로 사진을 옮겼다면 전송 후 다운로드 폴더와 브라우저 하단 다운로드 목록을 확인하세요. 필요 없는 파일은 직접 삭제하고, QR 세션이 열린 탭도 닫는 것이 좋습니다. 가족 사진, 신분증, 업무 자료처럼 민감한 이미지는 보내기 전에 수신 PC가 본인 통제 아래 있는지 다시 확인해야 합니다."
        ]
      }
    ],
    related: ["/guides/android-to-pc-file-transfer", "/guides/file-transfer-security-checklist", "/guides/troubleshooting-qr-file-transfer"]
  },
  {
    path: "/guides/android-to-pc-file-transfer",
    navTitle: "안드로이드 파일 PC로 보내기",
    title: "안드로이드에서 PC로 파일 보내는 방법 | Vibe Share 가이드",
    description: "안드로이드 휴대폰에서 PC로 사진, 문서, 압축 파일을 보낼 때 USB/MTP 문제를 피하고 QR 연결을 사용하는 방법을 안내합니다.",
    summary: "USB 연결 모드와 드라이버 문제 없이 안드로이드 파일을 PC 브라우저로 보내는 절차를 설명합니다.",
    intro: "안드로이드 휴대폰은 USB로 PC에 연결하면 파일을 복사할 수 있지만, 매번 매끄럽게 동작하지는 않습니다. 충전 모드로만 연결되거나, 알림창에서 파일 전송 모드를 찾아야 하거나, PC가 장치를 인식하지 못하는 경우가 있습니다. 사진은 갤러리에 있고 문서는 다운로드 폴더에 있으며, 메신저에서 받은 파일은 앱별 폴더에 있어 찾는 데 시간이 걸리기도 합니다.",
    sections: [
      {
        heading: "QR 연결로 보내는 순서",
        paragraphs: [
          "PC에서 Vibe Share 앱을 열어 QR을 표시합니다. 안드로이드 휴대폰의 카메라 또는 QR 스캐너로 코드를 읽고 연결 화면에 들어갑니다. 연결 후 휴대폰에서 파일 보내기를 선택하면 사진, 문서, 다운로드 폴더 등에서 파일을 고를 수 있습니다. PC 화면에서 수신 요청을 확인하고 수락하면 브라우저 다운로드가 시작됩니다.",
          "일부 안드로이드 브라우저는 파일 선택 화면에서 최근 파일만 먼저 보여 줍니다. 원하는 파일이 보이지 않으면 왼쪽 메뉴나 상단 위치 선택에서 이미지, 동영상, 다운로드, 내 파일 같은 항목을 바꿔 보세요. 클라우드 앱 안에만 있는 파일은 먼저 기기에 내려받아야 선택할 수 있습니다."
        ]
      },
      {
        heading: "다운로드 저장 위치",
        paragraphs: [
          "PC에서 수락한 파일은 보통 브라우저의 기본 다운로드 폴더에 저장됩니다. Chrome, Edge, Firefox는 설정에 따라 매번 저장 위치를 묻거나 자동으로 저장할 수 있습니다. 다운로드가 끝났는데 파일이 보이지 않는다면 브라우저의 다운로드 목록을 열어 실제 저장 경로를 확인하세요.",
          "파일 이름이 같은 경우 브라우저가 자동으로 번호를 붙일 수 있습니다. 업무 파일을 받을 때는 저장 후 파일을 열어 내용이 맞는지 확인하고, 필요한 폴더로 옮겨 두는 것이 좋습니다."
        ]
      },
      {
        heading: "USB/MTP와 함께 생각하기",
        paragraphs: [
          "대량 백업이나 폴더 전체 복사는 USB/MTP 방식이 더 적합할 수 있습니다. 반대로 사진 몇 장, PDF 하나, 압축 파일 하나처럼 즉시 옮기고 확인해야 하는 파일은 QR 연결이 더 가볍습니다. 두 방식은 경쟁 관계라기보다 목적이 다릅니다. 케이블 연결이 막히는 순간에 웹 기반 전송을 보조 수단으로 준비해 두면 시간을 줄일 수 있습니다."
        ]
      }
    ],
    related: ["/guides/iphone-to-pc-photo-transfer", "/guides/kakao-email-cable-alternative", "/guides/troubleshooting-qr-file-transfer"]
  },
  {
    path: "/guides/file-transfer-security-checklist",
    navTitle: "파일 전송 보안 체크리스트",
    title: "파일 전송 전 확인할 보안 체크리스트 | Vibe Share 가이드",
    description: "QR 파일 전송을 사용할 때 HTTPS, 수신자 확인, 민감 파일, 공용 PC, 세션 종료 등 사용자가 점검해야 할 항목을 정리했습니다.",
    summary: "파일을 보내기 전후로 사용자가 직접 확인해야 하는 실용적인 보안 습관을 정리합니다.",
    intro: "파일 전송 도구를 고를 때 속도만큼 중요한 것이 확인 절차입니다. Vibe Share는 HTTPS 주소와 수신 확인 흐름을 사용하지만, 어떤 도구도 사용자의 실수를 모두 대신 막아 주지는 못합니다. 보내는 파일의 성격, 받는 기기, 주변 환경을 함께 확인해야 안전한 전송에 가까워집니다. 아래 항목은 QR 전송뿐 아니라 메일, 메신저, 클라우드 링크를 쓸 때도 적용할 수 있는 기본 점검표입니다.",
    sections: [
      {
        heading: "전송 전 확인",
        paragraphs: [
          "주소창이 `https://getvibeshare.com` 또는 `https://app.getvibeshare.com`인지 확인하세요. 비슷하게 생긴 다른 도메인이나 임시 미리보기 주소를 통해 파일을 보내지 않는 것이 좋습니다. QR을 스캔한 휴대폰이 본인의 기기인지, PC 화면을 주변 사람이 함께 보고 있지는 않은지도 확인해야 합니다.",
          "민감 파일은 한 번 더 멈춰서 생각하세요. 신분증, 계약서, 금융 자료, 계정 정보, 고객 정보가 들어간 파일은 받는 기기와 저장 위치를 명확히 알고 있을 때만 전송하는 것이 좋습니다. 파일 이름만 보고 판단하기 어렵다면 열어서 내용이 맞는지 확인한 뒤 보내세요."
        ]
      },
      {
        heading: "수신 요청에서 볼 것",
        paragraphs: [
          "받는 쪽 화면에는 파일 이름과 크기 같은 기본 정보가 표시됩니다. 예상한 파일과 다르거나, 크기가 지나치게 크거나 작거나, 보낸 사람이 명확하지 않다면 거절하는 편이 안전합니다. 수락 버튼은 파일을 실제로 받을 준비가 되었을 때 누르는 절차로 생각하면 됩니다.",
          "공용 PC나 회의실 PC에서는 다운로드 폴더가 다른 사람에게 노출될 수 있습니다. 전송 후 필요한 위치로 파일을 옮기고, 남기지 않아야 하는 파일은 직접 삭제하세요. 브라우저의 다운로드 목록, 최근 파일 목록, 미리보기 앱 기록도 상황에 따라 확인할 수 있습니다."
        ]
      },
      {
        heading: "전송 후 정리",
        paragraphs: [
          "전송이 끝나면 PC와 휴대폰에서 더 이상 필요 없는 세션 탭을 닫습니다. 같은 QR을 오래 열어 두지 말고, 다음 전송이 필요하면 새 세션을 만드는 습관이 좋습니다. 연결이 끊겼거나 누가 연결했는지 확신이 없으면 기존 화면에서 계속 진행하지 말고 새 QR로 다시 시작하세요.",
          "보안은 한 번의 설정으로 끝나는 것이 아니라 반복되는 확인 과정입니다. 빠르게 보내야 하는 상황일수록 주소, 수신자, 파일 내용, 저장 위치 네 가지를 짧게 확인하는 것이 실수를 줄입니다."
        ]
      }
    ],
    related: ["/guides/qr-file-transfer", "/guides/pc-to-phone-file-transfer", "/security"]
  },
  {
    path: "/guides/troubleshooting-qr-file-transfer",
    navTitle: "QR 전송 문제 해결",
    title: "QR 파일 전송이 안 될 때 확인할 것 | Vibe Share 가이드",
    description: "QR이 열리지 않거나 연결이 끊기거나 파일이 받아지지 않을 때 확인할 브라우저, 세션, 네트워크, 새 QR 생성 방법을 안내합니다.",
    summary: "QR 스캔 실패, 흰 화면, 연결 끊김, 다운로드 실패 상황에서 순서대로 확인할 항목을 제공합니다.",
    intro: "QR 파일 전송이 실패할 때는 원인이 하나로 고정되어 있지 않습니다. QR이 오래되어 만료되었을 수도 있고, 브라우저가 백그라운드 탭을 정리했을 수도 있으며, 파일이 너무 크거나 네트워크가 불안정할 수도 있습니다. 문제를 빠르게 줄이려면 같은 화면에서 계속 반복하기보다 연결, 브라우저, 파일, 저장 위치를 차례로 확인하는 편이 좋습니다.",
    sections: [
      {
        heading: "QR이 열리지 않을 때",
        paragraphs: [
          "휴대폰 카메라가 QR을 읽지 못하면 PC 화면 밝기를 올리고, 모니터 반사를 줄인 뒤 다시 시도해 보세요. QR이 화면 가장자리에서 잘렸거나 너무 작게 보이면 브라우저 확대 배율을 기본값에 가깝게 조정합니다. 그래도 어렵다면 6자리 코드를 직접 입력하는 방법을 사용하세요.",
          "QR을 스캔했는데 페이지가 열리지 않으면 휴대폰의 기본 브라우저를 확인합니다. 일부 앱 내부 브라우저는 파일 선택이나 다운로드 동작이 제한될 수 있습니다. 가능하면 Safari, Chrome, Samsung Internet, Edge 같은 일반 브라우저에서 여는 것이 좋습니다."
        ]
      },
      {
        heading: "흰 화면처럼 보이거나 연결이 끊길 때",
        paragraphs: [
          "모바일 브라우저에서 흰 화면처럼 보일 때는 새로고침을 한 번 시도하고, 여전히 같으면 브라우저 탭을 닫은 뒤 PC에서 새 QR을 만들어 다시 연결합니다. 오래된 QR을 계속 재사용하면 만료된 세션에 들어가려는 상황이 반복될 수 있습니다.",
          "연결된 뒤에는 PC와 휴대폰의 페이지를 닫지 않는 것이 중요합니다. 전송 중에 PC가 절전 모드로 들어가거나 휴대폰 화면이 잠기면 연결이 끊길 수 있습니다. 큰 파일을 보낼 때는 두 기기의 화면이 켜져 있는지, 브라우저가 전면에 있는지 확인하세요."
        ]
      },
      {
        heading: "파일이 받아지지 않을 때",
        paragraphs: [
          "받는 쪽에서 수락했는데 다운로드가 보이지 않는다면 브라우저 다운로드 목록을 먼저 확인합니다. PC에서는 기본 다운로드 폴더, 휴대폰에서는 다운로드 앱이나 파일 앱의 최근 항목에 저장될 수 있습니다. 저장 위치를 매번 묻도록 설정한 브라우저라면 작은 팝업이 뒤에 가려져 있을 수 있습니다.",
          "같은 파일이 반복해서 실패하면 파일 크기를 줄이거나 다른 파일 하나로 먼저 테스트하세요. 실패가 계속되면 새 QR을 만들고 다시 연결한 뒤 진행합니다. 파일 선택 직후 페이지를 닫거나 뒤로 가기를 누르면 요청이 끊길 수 있으므로, 성공 또는 실패 메시지가 보일 때까지 화면을 유지하는 것이 좋습니다."
        ]
      }
    ],
    related: ["/guides/qr-file-transfer", "/guides/file-transfer-security-checklist", "/contact"]
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
  { label: "서비스 소개", path: "/about" },
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
  description: "PC와 휴대폰을 QR로 연결해 파일을 양방향으로 주고받는 웹 기반 파일 전송 서비스입니다."
};

const webAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Vibe Share",
  url: APP_URL,
  browserRequirements: "Modern desktop and mobile browser",
  applicationCategory: "FileTransferApplication",
  inLanguage: "ko",
  description: "PC와 휴대폰을 QR로 연결해 사진, 영상, 문서를 간단히 주고받을 수 있는 웹 기반 파일 전송 서비스입니다."
};

const faqItems = [
  {
    question: "PC에 카메라가 필요합니까?",
    answer: "아닙니다. PC는 QR과 6자리 코드를 보여 주고, 스캔은 휴대폰에서 진행합니다."
  },
  {
    question: "어떤 주소를 열어야 하나요?",
    answer: `일반 사용자는 ${APP_URL} 만 열면 됩니다. 공식 사이트는 서비스 설명과 가이드를 제공하고, API 주소는 일반 사용자가 직접 입력할 필요가 없습니다.`
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
    question: "파일은 계속 보관되나요?",
    answer: "Vibe Share는 전송 처리를 위한 임시 저장을 전제로 합니다. 세션과 전송 데이터는 만료 및 정리 정책에 따라 삭제 대상이 됩니다."
  },
  {
    question: "민감한 파일도 보내도 되나요?",
    answer: "민감한 파일은 전송 전 수신자와 목적을 다시 확인하는 것이 좋습니다. Vibe Share는 HTTPS와 수락 절차를 사용하지만 모든 위험이 사라진다고 표현하지 않습니다."
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
    description: "Vibe Share는 PC와 휴대폰을 QR로 연결해 사진, 영상, 문서를 간단히 주고받을 수 있는 웹 기반 파일 전송 서비스입니다.",
    hero: true,
    structuredData: [organizationJsonLd, softwareJsonLd, webAppJsonLd],
    body: `
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">QR 기반 파일 전송</p>
          <h1>PC와 휴대폰 파일을 간단하게 주고받으세요.</h1>
          <p class="lead">Vibe Share는 PC 화면의 QR을 휴대폰으로 스캔해 같은 연결방을 만들고, 연결 뒤 PC와 휴대폰이 파일을 양방향으로 전송할 수 있게 돕는 웹 서비스입니다.</p>
          <div class="actions">
            <a class="button" href="${APP_URL}">웹앱 열기</a>
            <a class="button secondary" href="/guides">파일 전송 가이드</a>
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
                <p>휴대폰 카메라로 QR을 스캔하면 같은 전송방에 연결됩니다.</p>
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
          <p class="eyebrow">What it does</p>
          <h2>한 번 연결하고, 필요한 방향으로 전송합니다.</h2>
          <p>PC가 카메라를 갖고 있지 않아도 됩니다. QR은 PC 화면에 표시하고 스캔은 휴대폰에서 진행합니다.</p>
        </div>
        <div class="grid">
          <article class="card"><h3>PC 카메라 불필요</h3><p>PC는 QR과 6자리 코드를 보여 주기만 합니다. 스캔은 휴대폰에서 한 번 진행합니다.</p></article>
          <article class="card"><h3>양방향 전송</h3><p>같은 세션에서 PC에서 휴대폰으로, 휴대폰에서 PC로 모두 보낼 수 있습니다.</p></article>
          <article class="card"><h3>수락과 거절</h3><p>받는 쪽은 파일 이름과 크기를 확인한 뒤 수락하거나 거절할 수 있습니다.</p></article>
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <p class="eyebrow">Guides</p>
          <h2>파일 전송 가이드</h2>
          <p>케이블, 메일, 메신저가 불편할 때 어떤 방식이 맞는지, QR 연결을 어떻게 쓰면 좋은지 실제 상황별로 정리했습니다.</p>
        </div>
        ${guideCards(3)}
        <p class="more-link"><a href="/guides">전체 가이드 보기</a></p>
      </section>

      <section class="section split">
        <div>
          <p class="eyebrow">Start</p>
          <h2>일반 사용자는 웹앱 주소만 열면 됩니다.</h2>
          <p>Vibe Share의 실제 파일 전송 화면은 <a href="${APP_URL}">${APP_URL}</a> 입니다. 공식 사이트는 서비스 설명, 사용 가이드, 보안 안내, 정책 문서를 제공하는 공간입니다.</p>
        </div>
        <div class="note">
          <strong>공개 서비스 안내</strong>
          <p>공개 서비스는 인터넷 연결을 통해 사용하도록 구성되어 있습니다. 로컬 개발 환경에서만 별도의 LAN 주소 설정이 필요할 수 있습니다.</p>
        </div>
      </section>
    `
  },
  {
    path: "/about",
    title: "Vibe Share 소개 | PC와 휴대폰 파일 전송 서비스",
    description: "Vibe Share가 해결하려는 파일 전송 문제, QR 연결 방식, 양방향 전송 흐름, 대상 사용자와 운영 원칙을 설명합니다.",
    structuredData: [organizationJsonLd, softwareJsonLd],
    body: `
      ${pageHeader("서비스 소개", "PC와 휴대폰 사이의 파일 이동을 QR 연결로 단순하게 만듭니다.", "Vibe Share는 별도 케이블이나 메신저 전송 없이 PC 브라우저와 휴대폰 브라우저를 같은 세션으로 연결해 파일을 주고받도록 설계한 서비스입니다.")}
      <section class="section">
        <h2>만든 이유</h2>
        <p>파일을 옮기는 일은 간단해 보여도 실제로는 자주 막힙니다. PC에는 카메라가 없고, 휴대폰에는 케이블이 없고, 회사 PC에는 메신저 로그인이 부담스럽고, 메일 첨부는 용량 제한을 만납니다. Vibe Share는 이런 작은 마찰을 줄이기 위해 만들어졌습니다.</p>
        <p>핵심은 PC가 QR을 스캔하지 않는다는 점입니다. PC는 QR과 6자리 코드를 보여 주고, 휴대폰이 그 정보를 읽어 같은 전송방에 들어갑니다. 연결 후에는 PC에서 휴대폰으로 보내는 흐름과 휴대폰에서 PC로 보내는 흐름을 같은 세션에서 처리합니다.</p>
      </section>
      <section class="section">
        <h2>어떤 사용자에게 맞나요?</h2>
        <div class="grid">
          <article class="card"><h3>사진을 옮기는 사람</h3><p>휴대폰 사진이나 캡처 이미지를 PC로 빠르게 옮겨 문서, 블로그, 업무 자료에 넣고 싶은 경우에 적합합니다.</p></article>
          <article class="card"><h3>문서를 바로 확인하는 사람</h3><p>PC에 있는 PDF, 압축 파일, 이미지 자료를 휴대폰에서 열어 확인하거나 전달해야 할 때 사용할 수 있습니다.</p></article>
          <article class="card"><h3>로그인을 줄이고 싶은 사람</h3><p>메신저나 개인 클라우드 로그인을 남기기 애매한 PC에서 짧은 임시 전송을 하고 싶을 때 도움이 됩니다.</p></article>
        </div>
      </section>
      <section class="section">
        <h2>운영 원칙</h2>
        <p>Vibe Share는 파일을 영구 보관하는 클라우드 드라이브가 아닙니다. 전송 처리를 위한 임시 저장과 세션 관리를 기본 전제로 하며, 받는 쪽의 수락 절차를 통해 파일을 확인하고 받을 수 있게 합니다. 사용자가 전송 목적과 수신 기기를 확인하는 과정도 중요하게 안내합니다.</p>
        <p>서비스 설명에서는 실제 구현 범위를 넘어서는 보장 표현을 사용하지 않습니다. HTTPS, QR 연결, 임시 저장, 수락 절차를 제공하지만 어떤 환경에서도 문제가 없거나 모든 위험이 사라진다고 말하지 않습니다.</p>
      </section>
      <section class="section note">
        <strong>더 자세히 보기</strong>
        <p>실제 사용 흐름은 <a href="/how-it-works">사용 방법</a>에서, 상황별 파일 이동 팁은 <a href="/guides">파일 전송 가이드</a>에서 확인할 수 있습니다.</p>
      </section>
    `
  },
  {
    path: "/how-it-works",
    title: "Vibe Share 사용 방법 | QR 연결과 양방향 전송",
    description: "PC에서 웹앱을 열고 휴대폰으로 QR을 스캔한 뒤 파일을 양방향으로 전송하는 방법을 단계별로 안내합니다.",
    structuredData: [softwareJsonLd],
    body: `
      ${pageHeader("사용 방법", "PC에서 열고, 휴대폰으로 스캔하고, 원하는 방향으로 보냅니다.", "실제 전송 앱은 app.getvibeshare.com에서 실행됩니다. 아래 순서는 처음 사용하는 사람도 따라할 수 있도록 구성했습니다.")}
      <section class="section steps">
        <article><span>1</span><h2>PC에서 웹앱 열기</h2><p>PC 브라우저에서 <a href="${APP_URL}">${APP_URL}</a> 을 엽니다. 화면에 QR 코드와 6자리 코드가 표시됩니다.</p></article>
        <article><span>2</span><h2>휴대폰으로 QR 스캔</h2><p>휴대폰 카메라로 PC 화면의 QR을 스캔합니다. QR이 잘 열리지 않으면 6자리 코드를 수동으로 입력할 수 있습니다.</p></article>
        <article><span>3</span><h2>연결 상태 확인</h2><p>두 기기가 같은 연결방에 들어오면 연결 상태가 표시됩니다. 이때부터 전송 방향을 선택할 수 있습니다.</p></article>
        <article><span>4</span><h2>파일 보내기</h2><p>PC에서 휴대폰으로 보내거나, 휴대폰에서 PC로 보낼 수 있습니다. 파일을 선택하면 받는 쪽에 수락 요청이 표시됩니다.</p></article>
        <article><span>5</span><h2>수락 후 저장</h2><p>받는 쪽이 파일 이름과 크기를 확인하고 수락하면 다운로드 또는 저장 동작이 진행됩니다.</p></article>
      </section>
      <section class="section split">
        <div><h2>문제가 생길 때</h2><p>QR이 만료되었거나 연결이 끊겼다면 PC 화면에서 새 QR을 만들고 다시 스캔하세요. 파일 전송 중에는 페이지를 닫지 않는 것이 좋습니다. 자세한 점검 순서는 <a href="/guides/troubleshooting-qr-file-transfer">QR 전송 문제 해결 가이드</a>를 참고하세요.</p></div>
        <div class="note"><strong>주소 안내</strong><p>일반 사용자는 API 주소를 직접 입력할 필요가 없습니다. 파일 전송은 웹앱 화면에서 시작하세요.</p></div>
      </section>
    `
  },
  {
    path: "/faq",
    title: "Vibe Share FAQ | 자주 묻는 질문",
    description: "Vibe Share의 QR 연결, 파일 전송, 임시 저장, 보안 안내와 문제 해결 가이드에 대한 자주 묻는 질문을 정리했습니다.",
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
      ${pageHeader("FAQ", "Vibe Share를 사용하기 전에 자주 확인하는 질문입니다.", "연결 방식, 전송 방향, 저장 방식, 보안 안내와 문제 해결 자료를 짧게 정리했습니다.")}
      <section class="section faq-list">
        ${faqItems.map((item) => `<article><h2>${item.question}</h2><p>${item.answer}</p></article>`).join("")}
      </section>
      <section class="section">
        <h2>상황별 도움말</h2>
        <p>사용 중인 기기나 전송 목적에 따라 아래 가이드를 함께 확인하면 문제를 더 빠르게 줄일 수 있습니다.</p>
        ${guideCards(6)}
      </section>
    `
  },
  {
    path: "/security",
    title: "Vibe Share 보안 안내 | QR 연결과 임시 전송",
    description: "Vibe Share의 HTTPS 사용, QR 연결 방식, 임시 저장 가능성, 수신 확인 절차, 민감 파일 전송 시 주의사항을 안내합니다.",
    structuredData: [softwareJsonLd],
    body: `
      ${pageHeader("보안 안내", "전송 전에 수신자를 확인하고, 수락 절차를 통해 파일을 받습니다.", "Vibe Share는 웹 기반 전송을 쉽게 만들기 위해 설계되었지만 사용자가 파일의 성격과 수신자를 확인하는 과정도 중요합니다.")}
      <section class="section">
        <div class="grid">
          <article class="card"><h2>HTTPS 사용</h2><p>공개 웹앱과 공식 사이트는 HTTPS 주소로 제공합니다. 사용자는 브라우저 주소창의 도메인을 확인해야 합니다.</p></article>
          <article class="card"><h2>QR 연결</h2><p>PC 화면의 QR 또는 6자리 코드를 통해 같은 전송 세션에 들어갑니다. 코드는 연결을 위한 짧은 정보로 사용합니다.</p></article>
          <article class="card"><h2>수락 절차</h2><p>받는 쪽은 파일 이름과 크기를 확인한 뒤 수락하거나 거절할 수 있습니다. 수락한 파일만 다운로드가 진행됩니다.</p></article>
        </div>
      </section>
      <section class="section">
        <h2>임시 전송과 저장</h2>
        <p>파일은 전송 처리를 위해 서버 또는 객체 스토리지에 임시 저장될 수 있습니다. 세션과 전송 데이터는 만료 및 정리 정책에 따라 삭제 대상이 됩니다. Vibe Share는 영구 백업 서비스가 아니므로 장기 보관이 필요한 파일은 별도의 저장소에 보관해야 합니다.</p>
        <p>운영 과정에서 오류 진단, 오남용 방지, 안정성 확인을 위해 전송 상태와 기본 요청 정보가 기록될 수 있습니다. 자세한 내용은 <a href="/privacy">개인정보처리방침</a>을 확인하세요.</p>
      </section>
      <section class="section note">
        <strong>민감 파일 전송 전 주의</strong>
        <p>계약서, 신분증, 금융 자료처럼 민감한 파일은 보내기 전에 수신자와 전송 목적을 다시 확인하세요. 실용적인 점검표는 <a href="/guides/file-transfer-security-checklist">파일 전송 보안 체크리스트</a>에 정리했습니다.</p>
      </section>
    `
  },
  {
    path: "/privacy",
    title: "개인정보처리방침 | Vibe Share",
    description: "Vibe Share의 서비스 목적, 파일 전송 처리 방식, 임시 저장, 만료 및 삭제 정책, 쿠키와 광고, 제3자 서비스 이용 가능성을 설명합니다.",
    structuredData: [organizationJsonLd, softwareJsonLd],
    body: `
      ${pageHeader("개인정보처리방침", "Vibe Share가 처리할 수 있는 정보와 목적을 설명합니다.", "이 문서는 서비스 운영을 위한 안내 문서이며, 법률 검토에 따라 갱신될 수 있습니다.")}
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
        <p>세션과 전송 데이터는 설정된 만료 시간과 운영 정리 작업의 대상입니다. 만료된 세션, 완료된 전송, 실패한 전송의 임시 파일은 정리될 수 있습니다.</p>
      </section>
      <section class="section">
        <h2>쿠키, 분석, 광고</h2>
        <p>공식 사이트와 웹앱은 서비스 안정성 확인, 보안 점검, 사용성 개선을 위해 쿠키 또는 유사 기술을 사용할 수 있습니다. 향후 Google AdSense 같은 광고 서비스가 적용되면 광고 제공과 부정 사용 방지를 위해 관련 쿠키 또는 식별자가 사용될 수 있습니다.</p>
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
    description: "Vibe Share의 서비스 이용 조건, 금지 행위, 파일 전송 책임, 서비스 중단 가능성, 초기 서비스 안내를 제공합니다.",
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
        <p>사용자는 자신이 전송하는 파일의 내용과 전송 목적에 대한 책임을 집니다. 받는 쪽은 파일 이름과 크기를 확인하고 수락 또는 거절을 선택할 수 있습니다.</p>
      </section>
      <section class="section">
        <h2>서비스 중단 가능성</h2>
        <p>점검, 장애, 인프라 문제, 보안 대응, 비용 제한 등으로 서비스가 일시적으로 중단될 수 있습니다. 초기 서비스 단계에서는 기능과 정책이 운영 상황에 따라 조정될 수 있습니다.</p>
      </section>
      <section class="section">
        <h2>초기 서비스 안내</h2>
        <p>Vibe Share는 계속 개선 중인 서비스입니다. 모든 브라우저, 모든 파일 형식, 모든 네트워크 상황에서 동일한 결과를 보장하지 않습니다.</p>
      </section>
    `
  },
  {
    path: "/contact",
    title: "문의 | Vibe Share",
    description: "Vibe Share 사용 중 문제가 생겼을 때 보낼 정보와 공식 문의 이메일을 안내합니다.",
    structuredData: [organizationJsonLd],
    body: `
      ${pageHeader("문의", "문제가 생기면 사용 환경과 오류 문구를 함께 보내 주세요.", "전송 방향, 파일 종류, 브라우저 환경을 알려 주면 원인 파악에 도움이 됩니다.")}
      <section class="section split">
        <div>
          <h2>문의 이메일</h2>
          <p><span class="contact-email">${CONTACT_EMAIL_DISPLAY}</span></p>
          <p>메일을 보낼 때 [at]을 @로 바꿔 주세요.</p>
          <p>운영 문의, 오류 제보, 개인정보 관련 문의를 위 주소로 보낼 수 있습니다.</p>
        </div>
        <div class="note">
          <strong>함께 보내면 좋은 정보</strong>
          <ul>
            <li>PC 브라우저와 휴대폰 모델</li>
            <li>전송 방향: PC에서 휴대폰, 또는 휴대폰에서 PC</li>
            <li>파일 종류와 대략적인 크기</li>
            <li>QR 또는 6자리 코드 사용 여부</li>
            <li>화면에 보이는 오류 문구</li>
          </ul>
        </div>
      </section>
      <section class="section">
        <h2>빠른 확인</h2>
        <p>파일 전송 기능은 <a href="${APP_URL}">${APP_URL}</a> 에서 사용할 수 있습니다. 자주 겪는 문제는 <a href="/guides/troubleshooting-qr-file-transfer">QR 전송 문제 해결 가이드</a>와 <a href="/faq">FAQ</a>를 먼저 확인해 주세요.</p>
      </section>
    `
  }
];

const guideHubPage = {
  path: "/guides",
  title: "파일 전송 문제 해결 가이드 | Vibe Share",
  description: "PC와 휴대폰 사이에서 파일을 보낼 때 겪는 케이블, 메일, QR 연결, 보안, 다운로드 문제를 상황별 가이드로 정리했습니다.",
  structuredData: [
    organizationJsonLd,
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "파일 전송 문제 해결 가이드",
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
    ${pageHeader("Guides", "파일 전송 문제 해결 가이드", "PC와 휴대폰 사이에서 파일을 옮길 때 자주 부딪히는 문제를 실제 사용 흐름 중심으로 정리했습니다.")}
    <section class="section">
      <h2>이 가이드의 목적</h2>
      <p>파일 전송은 도구보다 상황이 더 중요합니다. 큰 백업 파일을 옮기는지, 휴대폰 사진 몇 장을 PC로 보내는지, 회사 PC에서 개인 계정 로그인을 피하고 싶은지에 따라 좋은 선택이 달라집니다. 이 페이지는 케이블, 메일, 메신저, QR 연결 방식의 차이를 비교하고, Vibe Share를 쓸 때 막히기 쉬운 지점을 순서대로 확인할 수 있도록 만든 허브입니다.</p>
      <p>모든 글은 실제 사용자가 검색할 만한 질문에서 출발합니다. PC에 카메라가 없어도 되는 이유, 아이폰 사진을 Windows PC로 옮길 때의 한계, 안드로이드 USB/MTP 문제, 공용 PC에서의 보안 주의사항처럼 전송 전에 알면 시간을 줄일 수 있는 내용을 다룹니다.</p>
    </section>
    <section class="section">
      <div class="section-heading">
        <h2>상황별 가이드</h2>
        <p>먼저 본인 상황에 가까운 글을 고르세요. QR 연결 자체가 처음이라면 원리와 문제 해결 글을 함께 보는 것이 좋습니다.</p>
      </div>
      ${guideCards(guideArticles.length)}
    </section>
    <section class="section split">
      <div>
        <h2>빠르게 시작하려면</h2>
        <p>파일을 바로 보내야 한다면 PC에서 <a href="${APP_URL}">${APP_URL}</a> 을 열고 휴대폰으로 QR을 스캔하세요. 전송 전에는 받는 기기와 파일 이름을 확인하고, 전송 중에는 두 기기의 페이지를 닫지 않는 것이 좋습니다.</p>
      </div>
      <div class="note">
        <strong>문제 해결 순서</strong>
        <p>QR 인식, 연결 상태, 파일 크기, 브라우저 다운로드 위치를 차례로 확인하면 대부분의 실패 원인을 좁힐 수 있습니다.</p>
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
  const structuredData = page.structuredData || [organizationJsonLd, softwareJsonLd];
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
        <p>QR로 PC와 휴대폰을 연결해 파일을 양방향으로 전송하는 웹 서비스입니다.</p>
      </div>
      <nav aria-label="하단 메뉴">
        <a href="/about">소개</a>
        <a href="/how-it-works">사용 방법</a>
        <a href="/guides">가이드</a>
        <a href="/faq">FAQ</a>
        <a href="/security">보안</a>
        <a href="/privacy">개인정보처리방침</a>
        <a href="/terms">이용약관</a>
        <a href="/contact">문의</a>
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
          <p class="eyebrow">Guide</p>
          <h3><a href="${article.path}">${article.navTitle}</a></h3>
          <p>${article.summary}</p>
        </article>
      `).join("")}
    </div>
  `;
}

function buildGuideArticleBody(article) {
  return `
    ${pageHeader("Guide", article.navTitle, article.summary)}
    <article class="section article-content">
      <p class="article-meta">최종 업데이트: ${GUIDE_DATE}</p>
      <p>${article.intro}</p>
      ${article.sections.map((section) => `
        <h2>${section.heading}</h2>
        ${section.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}
      `).join("")}
    </article>
    <section class="section related-links">
      <h2>함께 보면 좋은 글</h2>
      <ul>
        <li><a href="/guides">파일 전송 가이드 전체 보기</a></li>
        ${article.related.map((path) => `<li><a href="${path}">${guideLabel(path)}</a></li>`).join("")}
      </ul>
    </section>
  `;
}

function guideLabel(path) {
  return guideByPath.get(path)?.navTitle || {
    "/security": "보안 안내",
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
    datePublished: GUIDE_DATE,
    dateModified: GUIDE_DATE,
    inLanguage: "ko",
    author: {
      "@type": "Organization",
      name: "Vibe Share"
    },
    publisher: {
      "@type": "Organization",
      name: "Vibe Share"
    }
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
