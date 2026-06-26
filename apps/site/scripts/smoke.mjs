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

const __filename = fileURLToPath(import.meta.url);
const siteRoot = path.resolve(path.dirname(__filename), "..");
const distDir = path.join(siteRoot, "dist");
const requiredFiles = [
  "index.html",
  "sitemap.xml",
  "robots.txt",
  "ads.txt",
  "_headers",
  "_redirects",
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
for (const page of pages.filter((item) => item.index !== false)) {
  const loc = page.path === "/" ? `${BASE_URL}/` : `${BASE_URL}${page.path}`;
  assert.match(sitemap, new RegExp(escapeRegExp(`<loc>${loc}</loc>`)));
}

const robots = await fs.readFile(path.join(distDir, "robots.txt"), "utf8");
assert.equal(robots, `User-agent: *\nAllow: /\n\nSitemap: ${BASE_URL}/sitemap.xml\n`);

const adsTxt = await fs.readFile(path.join(distDir, "ads.txt"), "utf8");
assert.equal(adsTxt, `${ADS_TXT_CONTENT}\n`);

await assertInternalLinksExist(htmlFiles);

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
  const existingPaths = new Set(["/", "/styles.css", "/sitemap.xml", "/robots.txt"]);
  for (const pagePath of requiredPagePaths) {
    existingPaths.add(pagePath);
    if (pagePath !== "/") {
      existingPaths.add(`${pagePath}/`);
    }
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
        continue;
      }
      const clean = href.split("#")[0].split("?")[0] || "/";
      assert.ok(existingPaths.has(clean), `broken internal link ${href} in ${file}`);
    }
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countOccurrences(value, needle) {
  return value.split(needle).length - 1;
}
