# Google Search Console Setup

Use this after the root site is deployed to `https://getvibeshare.com`.

## 1. Open Search Console

Go to Google Search Console and choose **Add property**.

## 2. Add A Domain Property

Choose **Domain** and enter:

```text
getvibeshare.com
```

Use the domain property instead of only a URL prefix so that Google can verify the root domain and subdomains together.

## 3. Add DNS TXT Verification In Cloudflare

Search Console will show a DNS TXT record.

In Cloudflare:

1. Open the `getvibeshare.com` zone.
2. Go to **DNS**.
3. Click **Add record**.
4. Type: `TXT`.
5. Name: use the name shown by Search Console, usually `@`.
6. Content: paste the exact verification value from Search Console.
7. Save the record.

Do not edit existing `app` or `api` records while doing Search Console verification.

## 4. Verify Ownership

Return to Search Console and click **Verify**. DNS propagation can take time, so retry later if verification does not pass immediately.

## 5. Submit Sitemap

After ownership is verified, open **Sitemaps** and submit:

```text
https://getvibeshare.com/sitemap.xml
```

## 6. Inspect Key URLs

Use **URL inspection** for:

```text
https://getvibeshare.com/
https://getvibeshare.com/privacy
https://getvibeshare.com/faq
```

Check that Google can fetch the page, that the canonical URL is correct, and that the page is not blocked by robots.txt.

## 7. Request Indexing

After the deployed pages return 200 and the sitemap is submitted, request indexing for the home page and the main policy pages.

## 8. Before AdSense Submission

Confirm that:

- The root site is not returning 502.
- `www.getvibeshare.com` redirects to the root site or serves the same site.
- The sitemap and robots file are publicly reachable.
- Privacy, terms, contact, FAQ, and security pages are readable on mobile.

## Official References

- Add a website property to Search Console: https://support.google.com/webmasters/answer/34592
- Verify site ownership: https://support.google.com/webmasters/answer/9008080
- Submit a sitemap: https://support.google.com/webmasters/answer/7451001
