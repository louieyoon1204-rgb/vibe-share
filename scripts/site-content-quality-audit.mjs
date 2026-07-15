import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BASE_URL,
  buildPageHtml,
  pages,
  requiredPagePaths
} from "../apps/site/src/site-content.mjs";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..");

const args = new Set(process.argv.slice(2));
const outArg = process.argv.find((arg) => arg.startsWith("--out="));
const usePublic = args.has("--public");
const useDist = args.has("--dist");
const mode = usePublic ? "public" : useDist ? "dist" : "source";
const outputPath = outArg
  ? path.resolve(repoRoot, outArg.slice("--out=".length))
  : path.join(repoRoot, "docs", "adsense-content-quality-audit.md");

const pagePathSet = new Set(requiredPagePaths);
const localPageByPath = new Map(pages.map((page) => [page.path, page]));
const htmlByPath = new Map();

for (const pagePath of requiredPagePaths) {
  htmlByPath.set(pagePath, await loadHtml(pagePath));
}

const analyses = [...htmlByPath.entries()].map(([pagePath, html]) => analyzePage(pagePath, html));
const sentenceOwners = buildSentenceOwners(analyses);

for (const analysis of analyses) {
  const otherSentenceHits = new Map();
  for (const sentence of analysis.normalizedSentences) {
    const owners = sentenceOwners.get(sentence) || new Set();
    for (const owner of owners) {
      if (owner !== analysis.path) {
        otherSentenceHits.set(owner, (otherSentenceHits.get(owner) || 0) + 1);
      }
    }
  }

  const closest = [...otherSentenceHits.entries()]
    .sort((left, right) => right[1] - left[1])[0];
  analysis.repeatedSentenceCount = [...analysis.normalizedSentences]
    .filter((sentence) => {
      const owners = sentenceOwners.get(sentence) || new Set();
      return [...owners].some((owner) => owner !== analysis.path);
    }).length;
  analysis.closestPage = closest ? closest[0] : "-";
  analysis.uniqueSentenceRatio = analysis.sentenceCount
    ? Math.round(((analysis.sentenceCount - analysis.repeatedSentenceCount) / analysis.sentenceCount) * 100)
    : 0;
  analysis.recommendation = recommend(analysis);
  analysis.firstIssue = firstIssue(analysis);
}

const duplicateMeta = findDuplicateMeta(analyses);
const brokenInternalLinks = findBrokenInternalLinks(analyses);
const markdown = renderMarkdown({
  mode,
  analyses,
  duplicateMeta,
  brokenInternalLinks
});

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, markdown, "utf8");
console.log(`content quality audit written: ${path.relative(repoRoot, outputPath)}`);
console.log(`mode: ${mode}`);
console.log(`pages: ${analyses.length}`);

async function loadHtml(pagePath) {
  if (usePublic) {
    const url = pagePath === "/" ? `${BASE_URL}/` : `${BASE_URL}${pagePath}`;
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "user-agent": "VibeShareContentAudit/1.0"
      }
    });
    if (!response.ok) {
      throw new Error(`${url} returned HTTP ${response.status}`);
    }
    return response.text();
  }

  if (useDist) {
    const filePath = pagePath === "/"
      ? path.join(repoRoot, "apps", "site", "dist", "index.html")
      : path.join(repoRoot, "apps", "site", "dist", `${pagePath.slice(1)}.html`);
    return fs.readFile(filePath, "utf8");
  }

  const page = localPageByPath.get(pagePath);
  if (!page) {
    throw new Error(`No source page for ${pagePath}`);
  }
  return buildPageHtml(page);
}

function analyzePage(pagePath, html) {
  const title = firstMatch(html, /<title>([\s\S]*?)<\/title>/i);
  const description = firstMatch(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
  const canonical = firstMatch(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i);
  const mainHtml = firstMatch(html, /<main[^>]*>([\s\S]*?)<\/main>/i) || html;
  const text = htmlToText(mainHtml);
  const sentences = splitSentences(text);
  const normalizedSentences = sentences.map(normalizeSentence).filter((sentence) => sentence.length >= 12);
  const uniqueNormalizedSentences = new Set(normalizedSentences);
  const headings = [...mainHtml.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi)].map((match) => ({
    level: Number(match[1]),
    text: htmlToText(match[2])
  }));
  const paragraphs = [...mainHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => htmlToText(match[1]).trim())
    .filter(Boolean);
  const internalLinks = [...html.matchAll(/\shref="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((href) => href.startsWith("/"));
  const appCtaCount = countMatches(text, /웹앱 열기|앱 열기|app\.getvibeshare\.com|파일 보내기|시작/i);
  const keywordRepeats = repeatedKeywordWarnings(text);
  const localSourcePage = localPageByPath.get(pagePath);
  const localTitle = localSourcePage?.title || "";
  const localDescription = localSourcePage?.description || "";

  return {
    path: pagePath,
    url: pagePath === "/" ? `${BASE_URL}/` : `${BASE_URL}${pagePath}`,
    title,
    description,
    canonical,
    bodyChars: [...text.replace(/\s/g, "")].length,
    sentenceCount: normalizedSentences.length,
    normalizedSentences,
    uniqueLocalSentenceRatio: normalizedSentences.length
      ? Math.round((uniqueNormalizedSentences.size / normalizedSentences.length) * 100)
      : 0,
    repeatedSentenceCount: 0,
    closestPage: "-",
    uniqueSentenceRatio: 0,
    paragraphCount: paragraphs.length,
    duplicateParagraphs: paragraphs.length - new Set(paragraphs.map(normalizeSentence)).size,
    h1Count: headings.filter((heading) => heading.level === 1).length,
    headingCount: headings.length,
    internalLinks,
    appCtaCount,
    placeholderHits: findHits(text, /TODO|placeholder|lorem|추가 예정|준비 중|샘플|테스트 문구|임시 문구/gi),
    keywordRepeats,
    hasSpecificVibeShareInfo: hasSpecificVibeShareInfo(text),
    hasTestOrOpsEvidence: hasTestOrOpsEvidence(text),
    looksSearchOnlyGeneric: looksSearchOnlyGeneric(text),
    isHelpful: isHelpful(text, headings, internalLinks),
    titleMatchesSource: !usePublic || title === localTitle,
    descriptionMatchesSource: !usePublic || description === localDescription,
    adsenseScriptCount: countMatches(html, /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/gi),
    jsonLdCount: countMatches(html, /application\/ld\+json/gi)
  };
}

function buildSentenceOwners(items) {
  const owners = new Map();
  for (const item of items) {
    for (const sentence of new Set(item.normalizedSentences)) {
      if (!owners.has(sentence)) {
        owners.set(sentence, new Set());
      }
      owners.get(sentence).add(item.path);
    }
  }
  return owners;
}

function findDuplicateMeta(items) {
  const byTitle = groupBy(items, (item) => item.title);
  const byDescription = groupBy(items, (item) => item.description);
  return {
    title: [...byTitle.entries()].filter(([, values]) => values.length > 1),
    description: [...byDescription.entries()].filter(([, values]) => values.length > 1)
  };
}

function findBrokenInternalLinks(items) {
  const allowed = new Set([...pagePathSet, "/styles.css", "/sitemap.xml", "/robots.txt", "/ads.txt"]);
  const broken = [];
  for (const item of items) {
    for (const href of item.internalLinks) {
      const clean = href.split("#")[0].split("?")[0] || "/";
      const withoutTrailingSlash = clean !== "/" && clean.endsWith("/") ? clean.slice(0, -1) : clean;
      if (!allowed.has(clean) && !allowed.has(withoutTrailingSlash)) {
        broken.push(`${item.path} -> ${href}`);
      }
    }
  }
  return broken;
}

function recommend(item) {
  if (item.path === "/guides" && item.bodyChars >= 1200 && item.hasSpecificVibeShareInfo && item.isHelpful) {
    return "유지";
  }
  if (item.bodyChars < 900 || !item.hasSpecificVibeShareInfo) {
    return "보강";
  }
  if (item.uniqueSentenceRatio < 70 || item.duplicateParagraphs > 0) {
    return "통합/보강";
  }
  if (item.looksSearchOnlyGeneric) {
    return "보강";
  }
  return "유지";
}

function firstIssue(item) {
  if (item.bodyChars < 900) {
    return "본문이 짧음";
  }
  if (item.h1Count !== 1) {
    return "H1 개수 확인 필요";
  }
  if (item.adsenseScriptCount !== 1) {
    return "AdSense script 수 확인 필요";
  }
  if (!item.hasSpecificVibeShareInfo) {
    return "Vibe Share 고유 정보 부족";
  }
  if (!item.hasTestOrOpsEvidence && item.path.startsWith("/guides/")) {
    return "실제 테스트/운영 근거 부족";
  }
  if (item.path === "/guides" && item.bodyChars >= 1200 && item.isHelpful) {
    return "허브 요약 반복 허용";
  }
  if (item.uniqueSentenceRatio < 70) {
    return "다른 페이지와 문장 반복";
  }
  if (item.description.length < 60) {
    return "description 짧음";
  }
  if (!item.isHelpful) {
    return "사용자 행동 도움 부족";
  }
  return "큰 문제 없음";
}

function hasSpecificVibeShareInfo(text) {
  const checks = [
    /Vibe Share/i,
    /app\.getvibeshare\.com/i,
    /api\.getvibeshare\.com/i,
    /6자리/,
    /PC 카메라/,
    /수락|거절/,
    /세션/,
    /R2|Postgres|Redis|Railway|Cloudflare/,
    /Safari|Files|파일 앱|다운로드/
  ];
  return checks.filter((pattern) => pattern.test(text)).length >= 3;
}

function hasTestOrOpsEvidence(text) {
  return /(테스트|확인|실패|해결|health|api\/info|로그|R2|CORS|Postgres|Redis|Railway|Cloudflare|2026)/i.test(text);
}

function looksSearchOnlyGeneric(text) {
  const genericHits = countMatches(text, /케이블|메일|메신저|카카오톡|클라우드|AirDrop|USB/gi);
  const specificHits = countMatches(text, /Vibe Share|6자리|수락|거절|세션|app\.getvibeshare\.com|api\.getvibeshare\.com|R2|Safari/gi);
  return genericHits >= 8 && specificHits < 5;
}

function isHelpful(text, headings, internalLinks) {
  const actionHits = countMatches(text, /확인|입력|스캔|수락|거절|다운로드|저장|새 QR|열기|보내기/gi);
  return actionHits >= 5 && headings.length >= 3 && internalLinks.length >= 2;
}

function repeatedKeywordWarnings(text) {
  const normalized = text
    .replace(/[^\p{L}\p{N}\s.:-]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2);
  const counts = new Map();
  for (const word of normalized) {
    counts.set(word, (counts.get(word) || 0) + 1);
  }
  const total = normalized.length || 1;
  return [...counts.entries()]
    .filter(([word, count]) => count >= 18 && count / total > 0.04 && !["Vibe", "Share"].includes(word))
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([word, count]) => `${word}(${count})`);
}

function renderMarkdown({ mode: auditMode, analyses, duplicateMeta, brokenInternalLinks }) {
  const generatedAt = new Date().toISOString();
  const header = [
    "# AdSense Content Quality Audit",
    "",
    `- Generated at: ${generatedAt}`,
    `- Mode: ${auditMode}`,
    `- Base URL: ${BASE_URL}`,
    "- ADSENSE_CURRENT_ISSUE_TEXT: UNKNOWN",
    "- ADSENSE_PREVIOUS_ISSUE_TEXT: Low value content",
    "",
    "현재 AdSense UI 상세 사유는 저장소에서 확인할 수 없으므로 UNKNOWN으로 유지했습니다. 이 감사는 이전 상세 사유인 Low value content를 중심으로 중복, 얇은 본문, 실제 Vibe Share 근거 부족을 점검합니다.",
    ""
  ].join("\n");

  const tableHeader = [
    "| URL | 제목 | 본문 글자 수 | 고유 문장 비율 | 반복 문장 수 | 가장 유사한 페이지 | Vibe Share 고유 정보 | 테스트/운영 근거 | 일반론 여부 | 실질 도움 | 권고 | 첫 번째 품질 문제 |",
    "| --- | --- | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- | --- |"
  ].join("\n");

  const rows = analyses.map((item) => [
    item.path,
    escapeTable(item.title),
    item.bodyChars,
    `${item.uniqueSentenceRatio}%`,
    item.repeatedSentenceCount,
    item.closestPage,
    yesNo(item.hasSpecificVibeShareInfo),
    yesNo(item.hasTestOrOpsEvidence),
    yesNo(item.looksSearchOnlyGeneric),
    yesNo(item.isHelpful),
    item.recommendation,
    escapeTable(item.firstIssue)
  ].join(" | "));

  const issueSummary = [
    "## Script Checks",
    "",
    `- Duplicate title groups: ${duplicateMeta.title.length}`,
    `- Duplicate description groups: ${duplicateMeta.description.length}`,
    `- Broken internal links: ${brokenInternalLinks.length}`,
    `- Pages with placeholder hits: ${analyses.filter((item) => item.placeholderHits.length > 0).length}`,
    `- Pages with excessive CTA repetition: ${analyses.filter((item) => item.appCtaCount > 8).length}`,
    `- Thin pages under 900 body chars: ${analyses.filter((item) => item.bodyChars < 900).length}`,
    "",
    "## Duplicate Metadata",
    "",
    duplicateMeta.title.length || duplicateMeta.description.length
      ? [
          ...duplicateMeta.title.map(([value, values]) => `- title: "${value}" -> ${values.map((item) => item.path).join(", ")}`),
          ...duplicateMeta.description.map(([value, values]) => `- description: "${value}" -> ${values.map((item) => item.path).join(", ")}`)
        ].join("\n")
      : "- 없음",
    "",
    "## Broken Internal Links",
    "",
    brokenInternalLinks.length ? brokenInternalLinks.map((item) => `- ${item}`).join("\n") : "- 없음",
    "",
    "## Page Detail Flags",
    "",
    ...analyses.map((item) => [
      `### ${item.path}`,
      "",
      `- canonical: ${item.canonical || "-"}`,
      `- H1 count: ${item.h1Count}`,
      `- JSON-LD blocks: ${item.jsonLdCount}`,
      `- AdSense script count: ${item.adsenseScriptCount}`,
      `- source title match: ${yesNo(item.titleMatchesSource)}`,
      `- source description match: ${yesNo(item.descriptionMatchesSource)}`,
      `- duplicate paragraphs: ${item.duplicateParagraphs}`,
      `- CTA repetition count: ${item.appCtaCount}`,
      `- placeholder hits: ${item.placeholderHits.length ? item.placeholderHits.join(", ") : "없음"}`,
      `- keyword repeat warnings: ${item.keywordRepeats.length ? item.keywordRepeats.join(", ") : "없음"}`
    ].join("\n\n"))
  ].join("\n");

  return `${header}## Public Page Table\n\n${tableHeader}\n${rows.map((row) => `| ${row} |`).join("\n")}\n\n${issueSummary}\n`;
}

function splitSentences(text) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?。！？]|다\.|요\.|니다\.|세요\.|합니다\.)\s+/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 8);
}

function normalizeSentence(value) {
  return value
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function htmlToText(html) {
  return decodeEntities(String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim());
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'");
}

function firstMatch(value, pattern) {
  return decodeEntities((String(value).match(pattern) || [])[1] || "").trim();
}

function countMatches(value, pattern) {
  const source = String(value || "");
  const regex = pattern.global ? pattern : new RegExp(pattern.source, `${pattern.flags}g`);
  return [...source.matchAll(regex)].length;
}

function findHits(value, pattern) {
  return [...new Set([...String(value || "").matchAll(pattern)].map((match) => match[0]))];
}

function groupBy(items, getKey) {
  const grouped = new Map();
  for (const item of items) {
    const key = getKey(item);
    if (!key) {
      continue;
    }
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(item);
  }
  return grouped;
}

function yesNo(value) {
  return value ? "예" : "아니오";
}

function escapeTable(value) {
  return String(value || "-").replace(/\|/g, "\\|").replace(/\n/g, " ");
}
