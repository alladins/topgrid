#!/usr/bin/env node
// SSoT 구조 내부 cross-ref 일관성 검증
// .claude/tw-grid/{agents,policies,constraints,rubric}/*.md + .claude/policies/_shared/*.md

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';

const ROOTS = [
  '.claude/tw-grid/agents',
  '.claude/tw-grid/policies',
  '.claude/tw-grid/constraints',
  '.claude/tw-grid/rubric',
  '.claude/policies/_shared',
];

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

function walkMd(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) walkMd(p, out);
    else if (entry.endsWith('.md')) out.push(p);
  }
  return out;
}

const allFiles = ROOTS.flatMap(r => existsSync(r) ? walkMd(r) : []);
const results = { ok: 0, missingFile: [], missingAnchor: [] };
const linkRegex = /\[(?:[^\]]+)\]\(([^)]+)\)/g;

for (const file of allFiles) {
  const fileDir = dirname(file);
  const body = readFileSync(file, 'utf8');
  let match;
  while ((match = linkRegex.exec(body)) !== null) {
    const url = match[1];
    if (!url.endsWith('.md') && !url.includes('.md#')) continue;
    if (url.startsWith('http')) continue;
    if (!url.startsWith('.') && !url.startsWith('/')) continue;

    const [path, anchor] = url.split('#');
    const resolved = resolve(fileDir, path);

    if (!existsSync(resolved)) {
      results.missingFile.push({ from: file, url, resolved });
      continue;
    }

    if (anchor) {
      const slugs = extractHeadings(resolved);
      if (!slugs.has(anchor)) {
        results.missingAnchor.push({ from: file, url, anchor });
      } else {
        results.ok++;
      }
    } else {
      results.ok++;
    }
  }
}

console.log('=== SSoT 내부 cross-ref 검증 ===\n');
console.log(`스캔: ${allFiles.length} files`);
console.log(`✅ OK:              ${results.ok}`);
console.log(`❌ Missing file:    ${results.missingFile.length}`);
console.log(`⚠️  Missing anchor: ${results.missingAnchor.length}\n`);

if (results.missingFile.length) {
  console.log('--- 파일 누락 ---');
  for (const r of results.missingFile.slice(0, 30)) {
    console.log(`  [${r.from}]`);
    console.log(`    → ${r.url}`);
  }
  if (results.missingFile.length > 30) console.log(`  ... +${results.missingFile.length - 30}`);
  console.log();
}

if (results.missingAnchor.length) {
  console.log('--- anchor 누락 ---');
  for (const r of results.missingAnchor.slice(0, 50)) {
    console.log(`  [${r.from}]`);
    console.log(`    → ${r.url}`);
  }
  if (results.missingAnchor.length > 50) console.log(`  ... +${results.missingAnchor.length - 50}`);
}

process.exit(results.missingFile.length + results.missingAnchor.length > 0 ? 1 : 0);
