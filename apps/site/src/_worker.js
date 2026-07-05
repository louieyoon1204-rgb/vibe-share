const CANONICAL_HOST = "getvibeshare.com";
const WWW_HOST = "www.getvibeshare.com";
const CANONICAL_PAGE_PATHS = new Set([
  "/about",
  "/how-it-works",
  "/faq",
  "/security",
  "/privacy",
  "/terms",
  "/contact"
]);

export default {
  fetch(request, env) {
    const url = new URL(request.url);
    const canonicalUrl = new URL(request.url);
    let shouldRedirect = false;

    if (url.hostname === WWW_HOST) {
      canonicalUrl.hostname = CANONICAL_HOST;
      shouldRedirect = true;
    }

    if (
      canonicalUrl.hostname === CANONICAL_HOST &&
      canonicalUrl.pathname.endsWith("/") &&
      CANONICAL_PAGE_PATHS.has(canonicalUrl.pathname.slice(0, -1))
    ) {
      canonicalUrl.pathname = canonicalUrl.pathname.slice(0, -1);
      shouldRedirect = true;
    }

    if (shouldRedirect) {
      return Response.redirect(canonicalUrl.toString(), 301);
    }

    return env.ASSETS.fetch(request);
  }
};
