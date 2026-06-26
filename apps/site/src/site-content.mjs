export const BASE_URL = "https://getvibeshare.com";
export const APP_URL = "https://app.getvibeshare.com";
export const CONTACT_EMAIL = "support@getvibeshare.com";
export const ADSENSE_CLIENT_ID = "ca-pub-2582922243814482";
export const ADS_TXT_CONTENT = "google.com, pub-2582922243814482, DIRECT, f08c47fec0942fa0";

export const requiredPagePaths = [
  "/",
  "/about",
  "/how-it-works",
  "/faq",
  "/security",
  "/privacy",
  "/terms",
  "/contact"
];

const navItems = [
  { label: "서비스 소개", path: "/about" },
  { label: "사용 방법", path: "/how-it-works" },
  { label: "FAQ", path: "/faq" },
  { label: "보안", path: "/security" },
  { label: "개인정보", path: "/privacy" },
  { label: "문의", path: "/contact" }
];

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
    question: "PC에 카메라가 필요한가요?",
    answer: "아니요. PC는 QR과 6자리 코드를 보여주고, 휴대폰이 PC 화면을 스캔합니다."
  },
  {
    question: "어떤 주소를 열어야 하나요?",
    answer: `일반 사용자는 ${APP_URL} 만 열면 됩니다. API 주소는 운영용 주소라 일반 사용자가 직접 입력할 필요가 없습니다.`
  },
  {
    question: "한 번 연결한 뒤 양방향 전송이 되나요?",
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
    question: "민감한 파일을 보내도 되나요?",
    answer: "민감한 파일은 전송 전 수신자와 목적을 다시 확인하는 것이 좋습니다. Vibe Share는 HTTPS와 수락 절차를 사용하지만 모든 위험이 사라진다고 표현하지 않습니다."
  }
];

export const pages = [
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
          <h1>PC와 휴대폰 파일을 더 간단하게 주고받으세요.</h1>
          <p class="lead">Vibe Share는 PC 화면의 QR을 휴대폰으로 스캔해 같은 연결방을 만들고, 연결 후 PC와 휴대폰이 파일을 양방향으로 전송할 수 있게 돕는 웹 서비스입니다.</p>
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
                <p>휴대폰 카메라로 QR을 스캔하면 같은 전송방에 연결됩니다.</p>
                <div class="mini-actions">
                  <span>PC → phone</span>
                  <span>phone → PC</span>
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
          <p>PC가 카메라를 갖고 있지 않아도 됩니다. QR은 PC 화면에 표시되고 스캔은 휴대폰에서 진행합니다.</p>
        </div>
        <div class="grid">
          <article class="card"><h3>PC 카메라 불필요</h3><p>PC는 QR과 6자리 코드를 보여주기만 합니다. 스캔은 휴대폰에서 한 번 진행합니다.</p></article>
          <article class="card"><h3>양방향 전송</h3><p>같은 세션에서 PC에서 휴대폰으로, 휴대폰에서 PC로 모두 보낼 수 있습니다.</p></article>
          <article class="card"><h3>수락과 거절</h3><p>받는 쪽은 파일 이름과 크기를 확인한 뒤 수락하거나 거절할 수 있습니다.</p></article>
        </div>
      </section>

      <section class="section split">
        <div>
          <p class="eyebrow">Start</p>
          <h2>일반 사용자는 웹앱 주소만 열면 됩니다.</h2>
          <p>Vibe Share의 실제 파일 전송 앱은 <a href="${APP_URL}">${APP_URL}</a> 입니다. 공식 사이트는 서비스 설명, 보안 안내, 정책 문서를 제공하기 위한 공간입니다.</p>
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
    description: "Vibe Share가 어떤 문제를 해결하는지, QR 연결 방식과 양방향 파일 전송 흐름을 설명합니다.",
    structuredData: [organizationJsonLd, softwareJsonLd],
    body: `
      ${pageHeader("서비스 소개", "PC와 휴대폰 사이의 파일 이동을 QR 연결로 단순하게 만듭니다.", "Vibe Share는 별도 케이블이나 메신저 전송 없이, PC 웹앱과 휴대폰 브라우저를 같은 세션으로 연결해 파일을 주고받도록 설계된 서비스입니다.")}
      <section class="section">
        <h2>Vibe Share가 하는 일</h2>
        <p>PC에서 웹앱을 열면 QR과 6자리 코드가 표시됩니다. 휴대폰으로 QR을 스캔하거나 코드를 입력하면 두 기기가 같은 연결방에 들어갑니다. 연결 후에는 PC에서 휴대폰으로 보내거나, 휴대폰에서 PC로 보낼 수 있습니다.</p>
        <p>PC에 카메라가 없어도 사용 흐름이 막히지 않도록, 스캔은 휴대폰이 담당합니다. 받는 쪽은 파일을 바로 저장하기 전에 파일 이름, 크기, 상태를 확인하고 수락 또는 거절을 선택할 수 있습니다.</p>
      </section>
      <section class="section">
        <h2>사용하기 좋은 상황</h2>
        <div class="grid">
          <article class="card"><h3>사진 옮기기</h3><p>휴대폰에서 촬영한 이미지를 PC로 빠르게 보내야 할 때 사용할 수 있습니다.</p></article>
          <article class="card"><h3>문서 전달</h3><p>PC에 있는 문서나 압축 파일을 휴대폰에서 받아 확인해야 할 때 도움이 됩니다.</p></article>
          <article class="card"><h3>케이블 없는 전송</h3><p>USB 케이블이나 별도 계정 로그인을 준비하기 어려운 상황에서 사용할 수 있습니다.</p></article>
        </div>
      </section>
      <section class="section note">
        <strong>정확한 표현을 지향합니다</strong>
        <p>Vibe Share는 현재 구현된 범위 안에서 전송을 돕는 서비스입니다. 모든 환경에서의 백그라운드 업로드, 모든 파일의 자동 보안 검사 완료, 영구 보관을 보장하지 않습니다.</p>
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
        <article><span>5</span><h2>수락 후 저장</h2><p>받는 쪽이 파일 이름과 크기를 확인하고 수락하면 다운로드 또는 저장 동작을 진행합니다.</p></article>
      </section>
      <section class="section split">
        <div><h2>문제가 생길 때</h2><p>QR이 만료되었거나 연결이 끊겼다면 PC 화면에서 새 QR을 만들고 다시 스캔하세요. 파일 전송 중에는 페이지를 닫지 않는 것이 좋습니다.</p></div>
        <div class="note"><strong>주소 안내</strong><p>일반 사용자는 API 주소를 직접 입력할 필요가 없습니다. 파일 전송은 웹앱 화면에서 시작하세요.</p></div>
      </section>
    `
  },
  {
    path: "/faq",
    title: "Vibe Share FAQ | 자주 묻는 질문",
    description: "Vibe Share의 QR 연결, 파일 전송, 임시 저장, 보안 안내에 대한 자주 묻는 질문을 정리했습니다.",
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
      ${pageHeader("FAQ", "Vibe Share를 사용하기 전에 자주 확인하는 질문입니다.", "연결 방식, 전송 방향, 저장 방식, 보안 안내를 짧게 정리했습니다.")}
      <section class="section faq-list">
        ${faqItems.map((item) => `<article><h2>${item.question}</h2><p>${item.answer}</p></article>`).join("")}
      </section>
    `
  },
  {
    path: "/security",
    title: "Vibe Share 보안 안내 | QR 연결과 임시 전송",
    description: "Vibe Share의 HTTPS 사용, QR 연결 방식, 임시 저장 가능성, 민감 파일 전송 시 주의사항을 안내합니다.",
    structuredData: [softwareJsonLd],
    body: `
      ${pageHeader("보안 안내", "전송 전에 수신자를 확인하고, 수락 절차를 통해 파일을 받습니다.", "Vibe Share는 웹 기반 전송을 쉽게 만들기 위해 설계되었지만, 사용자가 파일의 성격과 수신자를 확인하는 과정도 중요합니다.")}
      <section class="section">
        <div class="grid">
          <article class="card"><h2>HTTPS 사용</h2><p>공개 웹앱과 공식 사이트는 HTTPS 주소로 제공됩니다. 사용자는 브라우저 주소창의 도메인을 확인해야 합니다.</p></article>
          <article class="card"><h2>QR 연결</h2><p>PC 화면의 QR 또는 6자리 코드를 통해 같은 전송 세션에 들어갑니다. 코드는 연결을 위한 식별 정보로 사용됩니다.</p></article>
          <article class="card"><h2>수락 절차</h2><p>받는 쪽은 파일 이름과 크기를 확인한 뒤 수락하거나 거절할 수 있습니다. 수락한 파일만 다운로드가 진행됩니다.</p></article>
        </div>
      </section>
      <section class="section">
        <h2>임시 전송과 저장</h2>
        <p>파일은 전송 처리를 위해 서버 또는 객체 스토리지에 임시 저장될 수 있습니다. 세션과 전송 데이터는 만료 및 정리 정책에 따라 삭제 대상이 됩니다.</p>
        <p>서비스 운영 과정에서 오류 진단, 오남용 방지, 안정성 확인을 위해 전송 상태와 기본 요청 정보가 기록될 수 있습니다.</p>
      </section>
      <section class="section note">
        <strong>민감 파일 전송 시 주의</strong>
        <p>계약서, 신분증, 금융 자료처럼 민감한 파일을 보낼 때는 수신자와 전송 목적을 다시 확인하세요. Vibe Share는 보안에 주의해 설계되지만 모든 위험이 사라진다고 표현하지 않습니다.</p>
      </section>
    `
  },
  {
    path: "/privacy",
    title: "개인정보처리방침 | Vibe Share",
    description: "Vibe Share의 서비스 목적, 파일 전송 처리 방식, 임시 저장, 만료 및 삭제 정책, 쿠키와 제3자 서비스 이용 가능성을 설명합니다.",
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
        <p>파일은 전송 처리를 위해 서버 또는 S3 호환 객체 스토리지에 임시 저장될 수 있습니다. Vibe Share는 영구 보관 서비스가 아니라 전송을 위한 임시 처리를 기본 방향으로 합니다.</p>
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
        <p>운영에는 Railway, Cloudflare, S3 호환 객체 스토리지, Redis, PostgreSQL, Google AdSense 같은 제3자 서비스가 사용될 수 있습니다. 각 서비스는 호스팅, 보안, 저장, 캐시, 광고 심사와 운영 목적에 따라 제한적으로 사용됩니다.</p>
      </section>
      <section class="section">
        <h2>문의</h2>
        <p>개인정보 관련 문의는 <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> 으로 보낼 수 있습니다.</p>
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
        <p>점검, 장애, 외부 인프라 문제, 보안 대응, 비용 제한 등으로 서비스가 일시적으로 중단될 수 있습니다. 초기 서비스 단계에서는 기능과 정책이 운영 상황에 따라 조정될 수 있습니다.</p>
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
          <p><a class="contact-email" href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>
          <p>운영 문의, 오류 제보, 개인정보 관련 문의를 이 주소로 보낼 수 있습니다.</p>
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
        <p>파일 전송 앱은 <a href="${APP_URL}">${APP_URL}</a> 에서 사용할 수 있습니다. 공식 사이트는 서비스 설명과 정책 안내를 제공합니다.</p>
      </section>
    `
  }
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
    <meta property="og:type" content="website" />
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
