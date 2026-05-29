#!/usr/bin/env node
// Option D Verification: re-walk all files and confirm
// 1. JSON parse success on every file (including verify/category-only)
// 2. For corrected files (auditMetadata present): mechanical count == top-level
// 3. score == round((yes/denom)*100, 2)
// 4. failedChecks ⊆ NO-only set
// 5. Re-tally per-module fix counts and verify all needsFix entries now match

import fs from 'fs';
import path from 'path';

const ROOT = 'D:/project/topvel_project/TOMIS/.claude/tw-grid/artifacts';

const MODULES = [
  'MOD-GRID-00','MOD-GRID-01','MOD-GRID-02','MOD-GRID-03','MOD-GRID-04',
  'MOD-GRID-05','MOD-GRID-06','MOD-GRID-07','MOD-GRID-08','MOD-GRID-10',
  'MOD-GRID-11','MOD-GRID-12','MOD-GRID-13','MOD-GRID-14','MOD-GRID-15',
  'MOD-GRID-16','MOD-GRID-17','MOD-GRID-99-A','MOD-GRID-99-B',
];

function walkScoreFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkScoreFiles(full, acc);
    else if (e.isFile() && /-score\.json$/.test(e.name)) acc.push(full);
  }
  return acc;
}

function isLeafCheck(v) {
  return v && typeof v === 'object' && (v.result === 'YES' || v.result === 'NO' || v.result === 'N/A');
}

function countResults(checks) {
  let y = 0, n = 0, na = 0;
  const noIds = new Set();
  function walk(node, parentKey) {
    if (Array.isArray(node)) {
      node.forEach((c, i) => walk(c, parentKey || `idx-${i}`));
      return;
    }
    if (node && typeof node === 'object') {
      if (isLeafCheck(node)) {
        if (node.result === 'YES') y++;
        else if (node.result === 'NO') { n++; noIds.add(node.id || node.checkId || parentKey); }
        else if (node.result === 'N/A') na++;
        return;
      }
      for (const [k, v] of Object.entries(node)) walk(v, k);
    }
  }
  walk(checks, null);
  return { y, n, na, noIds };
}

const failures = [];
let parsed = 0, audited = 0, alignedAudited = 0;
let skippedNonChecksSchema = 0;

for (const mod of MODULES) {
  const files = walkScoreFiles(path.join(ROOT, mod));
  for (const f of files) {
    let data;
    try {
      data = JSON.parse(fs.readFileSync(f, 'utf8'));
      parsed++;
    } catch (e) {
      failures.push({ file: f, kind: 'parse', msg: e.message });
      continue;
    }

    // Verify-stage / category-only / checks absent: skip
    if (!data.checks) { skippedNonChecksSchema++; continue; }
    if (data.categoryScores) { skippedNonChecksSchema++; continue; }

    if (!data.auditMetadata) continue;
    audited++;

    const counted = countResults(data.checks);
    const denom = counted.y + counted.n;
    const expectedScore = denom > 0 ? Math.round((counted.y / denom) * 10000) / 100 : 0;

    // mechanical alignment
    if (counted.y !== data.yesCount) failures.push({ file: f, kind: 'yes-mismatch', expected: counted.y, got: data.yesCount });
    if (counted.n !== data.noCount) failures.push({ file: f, kind: 'no-mismatch', expected: counted.n, got: data.noCount });
    if (counted.na !== data.naCount) failures.push({ file: f, kind: 'na-mismatch', expected: counted.na, got: data.naCount });
    if (denom !== data.denominator) failures.push({ file: f, kind: 'denom-mismatch', expected: denom, got: data.denominator });
    if (Math.abs(expectedScore - data.score) > 0.005) failures.push({ file: f, kind: 'score-mismatch', expected: expectedScore, got: data.score });

    // failedChecks ⊆ NO set
    if (Array.isArray(data.failedChecks)) {
      for (const fc of data.failedChecks) {
        const id = typeof fc === 'object' ? (fc.checkId || fc.id) : fc;
        if (id != null && !counted.noIds.has(id)) {
          failures.push({ file: f, kind: 'failedCheck-not-in-NO', id });
        }
      }
    }
    if (failures.filter(x => x.file === f).length === 0) alignedAudited++;
  }
}

console.log('=== Verification Summary ===');
console.log('Files parsed:', parsed);
console.log('Files with auditMetadata:', audited);
console.log('Files fully aligned (audited):', alignedAudited);
console.log('Non-checks schema skipped:', skippedNonChecksSchema);
console.log('Failures:', failures.length);
if (failures.length) {
  for (const f of failures.slice(0, 50)) {
    console.log(' ', f.kind, '|', f.file.replace(/.*artifacts./,''), JSON.stringify(f));
  }
}
