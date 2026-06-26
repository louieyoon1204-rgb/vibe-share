import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ADS_TXT_CONTENT,
  APP_URL,
  BASE_URL,
  CONTACT_EMAIL,
  buildPageHtml,
  pages,
  requiredPagePaths
} from "../src/site-content.mjs";

const __filename = fileURLToPath(import.meta.url);
const siteRoot = path.resolve(path.dirname(__filename), "..");
const srcDir = path.join(siteRoot, "src");
const distDir = path.join(siteRoot, "dist");

await fs.rm(distDir, { recursive: true, force: true });
await fs.mkdir(distDir, { recursive: true });

for (const page of pages) {
  const filePath = page.path === "/"
    ? path.join(distDir, "index.html")
    : path.join(distDir, `${page.path.slice(1)}.html`);
  await fs.writeFile(filePath, buildPageHtml(page), "utf8");
}

await fs.copyFile(path.join(srcDir, "styles.css"), path.join(distDir, "styles.css"));
await fs.copyFile(path.join(srcDir, "_headers"), path.join(distDir, "_headers"));
await fs.copyFile(path.join(srcDir, "_redirects"), path.join(distDir, "_redirects"));
await fs.writeFile(path.join(distDir, "robots.txt"), buildRobots(), "utf8");
await fs.writeFile(path.join(distDir, "sitemap.xml"), buildSitemap(), "utf8");
await fs.writeFile(path.join(distDir, "ads.txt"), `${ADS_TXT_CONTENT}\n`, "utf8");

console.log("official site build ready: apps/site/dist");
console.log(`pages: ${requiredPagePaths.join(", ")}`);
console.log(`app: ${APP_URL}`);
console.log(`contact: ${CONTACT_EMAIL}`);

function buildRobots() {
  return [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${BASE_URL}/sitemap.xml`,
    ""
  ].join("\n");
}

function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = pages
    .filter((page) => page.index !== false)
    .map((page) => {
      const loc = page.path === "/" ? `${BASE_URL}/` : `${BASE_URL}${page.path}`;
      return [
        "  <url>",
        `    <loc>${loc}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        "    <changefreq>weekly</changefreq>",
        `    <priority>${page.path === "/" ? "1.0" : "0.7"}</priority>`,
        "  </url>"
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    ""
  ].join("\n");
}
