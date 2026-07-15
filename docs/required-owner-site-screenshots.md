# Required Owner Site Screenshots

No real product screenshots suitable for the public site were found in the repository during the AdSense content update. Placeholder store images and app icons are not evidence of the actual transfer flow, so they were not used.

Before adding screenshots to `getvibeshare.com`, the owner should capture only real, current product screens and remove or blur sensitive values.

## Needed Screenshots

- PC web app session screen showing the QR code and 6-digit code at `https://app.getvibeshare.com`
- Mobile web join screen opened from a real QR route such as `/j/123456`, with the actual code blurred
- Connected state showing both PC and mobile as paired
- PC -> phone transfer request showing file name, size, progress, and accept/reject action
- phone -> PC transfer request showing file name, size, progress, and accept/reject action
- Successful download or save action on the receiving side
- A non-sensitive failure state, such as expired session or rejected transfer

## Redaction Rules

- Blur QR code, 6-digit session code, IP address, email, account ID, tokens, and request IDs.
- Do not include API keys, Cloudflare account IDs, Railway tokens, R2 keys, Redis URLs, database URLs, or private logs.
- Do not create fake UI, fake user photos, fake reviews, fake numbers, or endorsement badges.
- Add descriptive alt text, width, height, lazy loading, and a short caption if screenshots are later added to the public site.
