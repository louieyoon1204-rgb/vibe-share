import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ADS_TXT_CONTENT,
  ADSENSE_CLIENT_ID,
  BASE_URL,
  pages,
  requiredPagePaths
} from "../src/site-content.mjs";
import worker from "../src/_worker.js";

const __filename = fileURLToPath(import.meta.url);
const siteRoot = path.resolve(path.dirname(__filename), "..");
const distDir = path.join(siteRoot, "dist");
const WWW_URL = BASE_URL.replace("https://", "https://www.");
const requiredFiles = [
  "index.html",
  "sitemap.xml",
  "robots.txt",
  "ads.txt",
  "_headers",
  "_redirects",
  "_worker.js",
  ...requiredPagePaths.filter((item) => item !== "/").map((item) => `${item.slice(1)}.html`)
];

for (const file of requiredFiles) {
  await fs.access(path.join(distDir, file));
}

const banned = /TODO|placeholder|lorem|절대 안전|해킹 불가|무제한 무료|같은 Wi-?Fi가 필수/i;
const htmlFiles = await collectHtml(distDir);
for (const file of htmlFiles) {
  const html = await fs.readFile(file, "utf8");
  assert.match(html, /<html lang="ko">/);
  assert.match(html, /<meta name="description"/);
  assert.match(html, /<link rel="canonical"/);
  assert.match(html, /property="og:title"/);
  assert.match(html, /name="twitter:card"/);
  assert.equal(countOccurrences(html, ADSENSE_CLIENT_ID), 1, `${file} must contain one AdSense client script`);
  assert.match(html, /application\/ld\+json/);
  assert.doesNotMatch(html, banned, `${file} contains banned placeholder or exaggerated copy`);
}

const sitemap = await fs.readFile(path.join(distDir, "sitemap.xml"), "utf8");
const sitemapUrls = extractSitemapUrls(sitemap);
const indexedPages = pages.filter((item) => item.index !== false);
const expectedSitemapUrls = indexedPages.map((page) => canonicalUrl(page.path));
assert.deepEqual(sitemapUrls.sort(), expectedSitemapUrls.sort(), "sitemap must contain only canonical URLs");
for (const loc of sitemapUrls) {
  assert.ok(loc.startsWith(`${BASE_URL}/`) || loc === `${BASE_URL}/`, `sitemap URL must be non-www: ${loc}`);
  assert.doesNotMatch(loc, /pages\.dev/i, `sitemap URL must not use pages.dev: ${loc}`);
  const pathname = new URL(loc).pathname;
  assert.ok(pathname === "/" || !pathname.endsWith("/"), `sitemap URL must not redirect through trailing slash: ${loc}`);
}
await assertHtmlCanonicalsMatchSitemap(indexedPages, new Set(sitemapUrls));

const robots = await fs.readFile(path.join(distDir, "robots.txt"), "utf8");
assert.equal(robots, `User-agent: *\nAllow: /\n\nSitemap: ${BASE_URL}/sitemap.xml\n`);

const adsTxt = await fs.readFile(path.join(distDir, "ads.txt"), "utf8");
assert.equal(adsTxt, `${ADS_TXT_CONTENT}\n`);

await assertInternalLinksExist(htmlFiles);
await assertRedirectsFilePolicy();
await assertWorkerRedirectPolicy();

console.log("official site smoke ok");

async function collectHtml(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectHtml(fullPath));
    } else if (entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }
  return files;
}

async function assertInternalLinksExist(files) {
  const existingPaths = new Set(["/", "/styles.css", "/sitemap.xml", "/robots.txt", "/ads.txt"]);
  for (const pagePath of requiredPagePaths) {
    existingPaths.add(pagePath);
  }

  for (const file of files) {
    const html = await fs.readFile(file, "utf8");
    for (const match of html.matchAll(/\shref="([^"]+)"/g)) {
      const href = match[1];
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("https://app.getvibeshare.com")) {
        continue;
      }
      if (href.startsWith("http")) {
        assert.ok(href.startsWith(BASE_URL), `unexpected external link ${href} in ${file}`);
        const linkedUrl = new URL(href);
        assert.ok(existingPaths.has(linkedUrl.pathname), `non-canonical internal link ${href} in ${file}`);
        continue;
      }
      const clean = href.split("#")[0].split("?")[0] || "/";
      assert.ok(existingPaths.has(clean), `broken internal link ${href} in ${file}`);
    }
  }
}

async function assertHtmlCanonicalsMatchSitemap(indexedPages, sitemapUrlSet) {
  for (const page of indexedPages) {
    const htmlPath = page.path === "/"
      ? path.join(distDir, "index.html")
      : path.join(distDir, `${page.path.slice(1)}.html`);
    const html = await fs.readFile(htmlPath, "utf8");
    const canonical = extractCanonical(html);
    const expected = canonicalUrl(page.path);
    assert.equal(canonical, expected, `${htmlPath} canonical must match page path`);
    assert.ok(sitemapUrlSet.has(canonical), `${htmlPath} canonical must be present in sitemap`);
  }
}

async function assertRedirectsFilePolicy() {
  const redirects = await fs.readFile(path.join(distDir, "_redirects"), "utf8");
  const redirectSet = new Set(redirects.split(/\r?\n/).map((line) => line.trim()).filter(Boolean));

  assert.ok(redirectSet.has(`${WWW_URL} ${BASE_URL}/ 301!`));
  assert.ok(redirectSet.has(`${WWW_URL}/ ${BASE_URL}/ 301!`));

  for (const pagePath of requiredPagePaths.filter((item) => item !== "/")) {
    assert.ok(
      redirectSet.has(`${WWW_URL}${pagePath} ${BASE_URL}${pagePath} 301!`),
      `_redirects must send www${pagePath} to non-www canonical`
    );
    assert.ok(
      redirectSet.has(`${WWW_URL}${pagePath}/ ${BASE_URL}${pagePath} 301!`),
      `_redirects must send www${pagePath}/ to non-www canonical in one hop`
    );
    assert.ok(
      redirectSet.has(`${pagePath}/ ${pagePath} 301!`),
      `_redirects must send ${pagePath}/ to slashless canonical`
    );
  }
}

async function assertWorkerRedirectPolicy() {
  const env = {
    ASSETS: {
      fetch() {
        return new Response("asset ok", { status: 200 });
      }
    }
  };

  await assertWorkerPasses(`${BASE_URL}/`, env);
  await assertWorkerRedirects(`${WWW_URL}/`, `${BASE_URL}/`, env);
  await assertWorkerPasses(`${BASE_URL}/sitemap.xml`, env);
  await assertWorkerRedirects(`${WWW_URL}/sitemap.xml`, `${BASE_URL}/sitemap.xml`, env);
  await assertWorkerPasses(`${BASE_URL}/robots.txt`, env);
  await assertWorkerPasses(`${BASE_URL}/ads.txt`, env);

  for (const pagePath of requiredPagePaths.filter((item) => item !== "/")) {
    const canonical = `${BASE_URL}${pagePath}`;
    await assertWorkerPasses(canonical, env);
    await assertWorkerRedirects(`${canonical}/`, canonical, env);
    await assertWorkerRedirects(`${WWW_URL}${pagePath}`, canonical, env);
    await assertWorkerRedirects(`${WWW_URL}${pagePath}/`, canonical, env);
  }
}

async function assertWorkerPasses(url, env) {
  const response = await worker.fetch(new Request(url), env);
  assert.equal(response.status, 200, `${url} must pass through without redirect`);
}

async function assertWorkerRedirects(fromUrl, toUrl, env) {
  const response = await worker.fetch(new Request(fromUrl), env);
  assert.equal(response.status, 301, `${fromUrl} must redirect`);
  assert.equal(response.headers.get("location"), toUrl, `${fromUrl} redirect target`);

  const next = await worker.fetch(new Request(toUrl), env);
  assert.equal(next.status, 200, `${fromUrl} must resolve in one redirect hop`);
}

function extractSitemapUrls(sitemap) {
  return [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

function extractCanonical(html) {
  const match = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/);
  assert.ok(match, "HTML page must include canonical link");
  return match[1];
}

function canonicalUrl(pagePath) {
  return pagePath === "/" ? `${BASE_URL}/` : `${BASE_URL}${pagePath}`;
}

function countOccurrences(value, needle) {
  return value.split(needle).length - 1;
}
