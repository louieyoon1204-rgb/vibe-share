# AdSense Review Checklist

This checklist is for preparing `https://getvibeshare.com` before submitting the root site to Google AdSense review.

## Required Site State

- [ ] `https://getvibeshare.com` opens the official Vibe Share site.
- [ ] `https://www.getvibeshare.com` redirects to `https://getvibeshare.com` or serves the same official site.
- [ ] `https://getvibeshare.com/sitemap.xml` returns the generated sitemap.
- [ ] `https://getvibeshare.com/robots.txt` returns:

```text
User-agent: *
Allow: /

Sitemap: https://getvibeshare.com/sitemap.xml
```

## Required Pages

- [ ] `/`
- [ ] `/about`
- [ ] `/how-it-works`
- [ ] `/faq`
- [ ] `/security`
- [ ] `/privacy`
- [ ] `/terms`
- [ ] `/contact`

Each page must contain real Vibe Share content. Do not submit the site if any page is empty, broken, or still showing test copy.

## Content Quality

- [ ] No broken internal links.
- [ ] No placeholder sections.
- [ ] No exaggerated claims such as absolute safety, impossible security guarantees, or unrestricted transfer promises.
- [ ] No misleading statement that the public service requires the same Wi-Fi.
- [ ] The app button clearly links to `https://app.getvibeshare.com`.
- [ ] API URLs are not presented as something normal users need to type.
- [ ] Mobile layout is readable.
- [ ] The site explains what Vibe Share does before asking users to open the app.

## Policy And Trust Signals

- [ ] Privacy page explains service purpose, file transfer processing, temporary storage, deletion/expiration, cookies, analytics, advertising possibility, third-party services, and contact method.
- [ ] Terms page explains usage conditions, prohibited behavior, transfer responsibility, service interruption possibility, and early-service status.
- [ ] Contact page includes a working email address.
- [ ] Security page explains HTTPS, QR pairing, temporary transfer/storage, and user caution for sensitive files.
- [ ] FAQ page answers basic product questions in clear language.

## AdSense-Specific Readiness

- [ ] AdSense에서 `getvibeshare.com` 사이트를 추가한다.
- [ ] No text encouraging ad clicks.
- [ ] No fake ad placement or mock ad unit that could be mistaken for a live ad.
- [ ] App CTA and any future ad area must be visually separated.
- [ ] Site has enough original explanatory content to review without using the web app.
- [ ] Privacy page mentions that Google AdSense or advertising cookies may be used if ads are enabled.
- [ ] A real person has read every page on desktop and mobile before submission.
- [ ] Review Google's current AdSense policies before submitting. Google states that publishers must keep up to date with posted AdSense policies.

## ads.txt

- [ ] Do not publish a fake AdSense publisher ID.
- [ ] If a real AdSense publisher ID has not been issued yet, leave `ads.txt` unpublished.
- [ ] After Google provides the real publisher ID, add `google.com, pub-REAL_ID, DIRECT, f08c47fec0942fa0` as `ads.txt`, replacing `pub-REAL_ID` with the real value only.
- [ ] After publishing `ads.txt`, verify `https://getvibeshare.com/ads.txt`.

## Search And Verification

- [ ] Google Search Console domain property is registered for `getvibeshare.com`.
- [ ] DNS TXT verification has been added in Cloudflare.
- [ ] Sitemap submitted in Search Console: `https://getvibeshare.com/sitemap.xml`.
- [ ] URL inspection checked for `/`, `/privacy`, and `/faq`.
- [ ] Indexing requested after deployment is stable.

## Build And Deploy Commands

Build locally:

```powershell
npm.cmd install
npm.cmd run build:site:public
```

Deploy after confirming the Cloudflare Pages project for the root site:

```powershell
npx wrangler pages deploy apps/site/dist --project-name=getvibeshare-site --commit-dirty=true
```

Do not deploy the root site to `app-getvibeshare-web`. That project is for `https://app.getvibeshare.com`.

## Official References

- Google AdSense Program policies: https://support.google.com/adsense/answer/48182
- Google AdSense policy and terms overview: https://transparency.google/our-policies/product-terms/google-adsense
- Google Search Console sitemap report: https://support.google.com/webmasters/answer/7451001
