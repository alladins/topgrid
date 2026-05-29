#!/usr/bin/env node
// v1.1 SSoT 참조 정합성 검증기 — .claude/commands/tw-grid.md
// 사용: node .claude/tw-grid/tools/verify-v1.1-refs.mjs

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';

const SRC = '.claude/commands/tw-grid.md';
const SRC_DIR = dirname(SRC);
const body = readFileSync(SRC, 'utf8');

// GitHub-flavored markdown slug
function slugify(heading) {
  return heading
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[^\w\s가-힣\-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function extractHeadings(filePath) {
  if (!existsSync(filePath)) return null;
  const text = readFileSync(filePath, 'utf8');
  const slugs = new Set();
  const headingLines = text.match(/^#{1,6}\s+.*$/gm) || [];
  for (const line of headingLines) {
    const text = line.replace(/^#+\s+/, '');
    slugs.add(slugify(text));
  }
  return slugs;
}

const linkRegex = /\[(?:[^\]]+)\]\(([^)]+)\)/g;
const results = { ok: [], missingFile: [], missingAnchor: [] };
let match;

while ((match = linkRegex.exec(body)) !== null) {
  const url = match[1];
  if (!url.endsWith('.md') && !url.includes('.md#')) continue;
  if (!url.startsWith('.') && !url.startsWith('/')) continue;

  const [path, anchor] = url.split('#');
  const resolved = resolve(SRC_DIR, path);

  if (!existsSync(resolved)) {
    results.missingFile.push({ url, resolved });
    continue;
  }

  if (anchor) {
    const slugs = extractHeadings(resolved);
    if (!slugs.has(anchor)) {
      results.missingAnchor.push({ url, resolved, anchor, headings: [...slugs].slice(0, 20) });
    } else {
      results.ok.push(url);
    }
  } else {
    results.ok.push(url);
  }
}

console.log('=== v1.1 SSoT 참조 정합성 검증 ===\n');
console.log(`✅ OK:              ${results.ok.length}`);
console.log(`❌ Missing file:    ${results.missingFile.length}`);
console.log(`⚠️  Missing anchor: ${results.missingAnchor.length}\n`);

if (results.missingFile.length) {
  console.log('--- 파일 누락 ---');
  for (const r of results.missingFile) {
    console.log(`  ${r.url}`);
    console.log(`    → ${r.resolved}`);
  }
  console.log();
}

if (results.missingAnchor.length) {
  console.log('--- anchor 누락 ---');
  for (const r of results.missingAnchor) {
    console.log(`  ${r.url}`);
    console.log(`    expected anchor: ${r.anchor}`);
    console.log(`    available: ${r.headings.join(', ')}`);
    console.log();
  }
}

process.exit(results.missingFile.length + results.missingAnchor.length > 0 ? 1 : 0);
