#!/usr/bin/env node
// Option D Pattern C Audit Scanner
// Walks all score JSON files in 19 MOD-GRID modules and produces a manifest

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
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkScoreFiles(full, acc);
    else if (e.isFile() && /-score\.json$/.test(e.name)) acc.push(full);
  }
  return acc;
}

function detectStage(filename) {
  if (/-specify-score\.json$/.test(filename)) return 'specify';
  if (/-implement-score\.json$/.test(filename)) return 'implement';
  if (/-verify-score\.json$/.test(filename)) return 'verify';
  return 'unknown';
}

function isLeafCheck(v) {
  return v && typeof v === 'object' && (
    v.result === 'YES' || v.result === 'NO' || v.result === 'N/A'
  );
}

function countResults(checks) {
  let y = 0, n = 0, na = 0, total = 0;
  function walk(node) {
    if (Array.isArray(node)) {
      for (const c of node) walk(c);
      return;
    }
    if (node && typeof node === 'object') {
      if (isLeafCheck(node)) {
        total++;
        if (node.result === 'YES') y++;
        else if (node.result === 'NO') n++;
        else if (node.result === 'N/A') na++;
        return;
      }
      // Nested category: descend
      for (const v of Object.values(node)) walk(v);
    }
  }
  walk(checks);
  return { y, n, na, total };
}

function getFailedCheckIds(checks) {
  const ids = [];
  function walk(node, parentKey) {
    if (Array.isArray(node)) {
      node.forEach((c, i) => walk(c, parentKey || `idx-${i}`));
      return;
    }
    if (node && typeof node === 'object') {
      if (isLeafCheck(node)) {
        if (node.result === 'NO') ids.push(node.id || node.checkId || parentKey);
        return;
      }
      for (const [k, v] of Object.entries(node)) walk(v, k);
    }
  }
  walk(checks, null);
  return ids;
}

const manifest = {
  needsFix: [],
  skipAlreadyAudited: [],
  skipMetaGateAligned: [],
  skipChecksAbsent: [],
  skipCategoryOnly: [],
  headlineNoMismatch: [],
  unchanged: [],
  errors: [],
  perModule: {},
};

for (const mod of MODULES) {
  const modPath = path.join(ROOT, mod);
  const files = walkScoreFiles(modPath);
  manifest.perModule[mod] = { total: files.length, fix: 0, skipAudit: 0, skipMetaAligned: 0, skipChecksAbsent: 0, skipCategory: 0, headline: 0, unchanged: 0 };
  for (const f of files) {
    const stage = detectStage(f);
    let data;
    try {
      data = JSON.parse(fs.readFileSync(f, 'utf8'));
    } catch (err) {
      manifest.errors.push({ file: f, error: 'JSON parse: ' + err.message });
      continue;
    }

    // verify stage: category-only model
    if (stage === 'verify' || data.categoryScores) {
      manifest.skipCategoryOnly.push(f);
      manifest.perModule[mod].skipCategory++;
      continue;
    }

    // checks absent
    if (!data.checks) {
      manifest.skipChecksAbsent.push(f);
      manifest.perModule[mod].skipChecksAbsent++;
      continue;
    }

    const counted = countResults(data.checks);

    // Meta gate detection
    const evaluableItems = data.rubricMetadata?.evaluableItems;
    const rubricItemsTotal = data.rubricMetadata?.rubricItemsTotal;
    let metaGateCount = 0;
    if (evaluableItems != null && rubricItemsTotal != null) {
      metaGateCount = rubricItemsTotal - evaluableItems;
    }

    // Reported values
    const reportedYes = data.yesCount;
    const reportedNo = data.noCount;
    const reportedNa = data.naCount;
    const reportedDenom = data.denominator;
    const reportedScore = data.score;
    const reportedPassed = data.passed;
    const threshold = data.threshold;

    // Already audited?
    const alreadyAudited = !!data.auditMetadata;

    // Plain mechanical compare
    const yesMatch = counted.y === reportedYes;
    const noMatch = counted.n === reportedNo;
    const naMatch = counted.na === reportedNa;
    const denomMatch = counted.y + counted.n === reportedDenom;

    const fullyAligned = yesMatch && noMatch && naMatch && denomMatch;

    // If meta gates exist, also check meta-gate-aligned model
    let metaAligned = false;
    if (metaGateCount > 0) {
      // We need to know which checks are meta. Heuristic: count - subtract from y/na/n distribution.
      // Most reliable: if reported matches (counted - metaGateCount applied somehow), trust it.
      // Actually: if rubricMetadata.evaluableItems exists & reported total matches it, we have to subtract meta count somewhere.
      // Best signal: y_count + n_count + na_count (reported) == evaluableItems
      const reportedTotal = (reportedYes || 0) + (reportedNo || 0) + (reportedNa || 0);
      if (reportedTotal === evaluableItems && counted.total === rubricItemsTotal) {
        metaAligned = true;
      }
    }

    if (alreadyAudited) {
      manifest.skipAlreadyAudited.push({ file: f, auditedBy: data.auditMetadata.auditedBy });
      manifest.perModule[mod].skipAudit++;
      continue;
    }

    if (fullyAligned) {
      manifest.unchanged.push(f);
      manifest.perModule[mod].unchanged++;
      continue;
    }

    if (metaAligned) {
      manifest.skipMetaGateAligned.push({ file: f, metaGateCount });
      manifest.perModule[mod].skipMetaAligned++;
      continue;
    }

    // Needs fix
    const failedCheckIds = getFailedCheckIds(data.checks);
    const newDenom = counted.y + counted.n;
    const newScore = newDenom > 0 ? Math.round((counted.y / newDenom) * 10000) / 100 : 0;
    const newPassed = threshold != null ? newScore >= threshold : null;

    const isHeadlineNoMismatch = counted.n > (reportedNo || 0);

    const fixEntry = {
      file: f,
      stage,
      module: mod,
      reported: { yes: reportedYes, no: reportedNo, na: reportedNa, denom: reportedDenom, score: reportedScore, passed: reportedPassed },
      actual: { yes: counted.y, no: counted.n, na: counted.na, denom: newDenom, score: newScore, passed: newPassed },
      failedCheckIds,
      threshold,
      metaGateCount,
      isHeadlineNoMismatch,
      passedFlipped: reportedPassed !== newPassed && newPassed !== null,
    };
    manifest.needsFix.push(fixEntry);
    manifest.perModule[mod].fix++;
    if (isHeadlineNoMismatch) {
      manifest.headlineNoMismatch.push(fixEntry);
      manifest.perModule[mod].headline++;
    }
  }
}

// Output
const outPath = 'D:/project/topvel_project/TOMIS/.claude/tw-grid/tools/option-d-manifest.json';
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2), 'utf8');

// Summary
console.log('=== Manifest summary ===');
console.log('Total needsFix:', manifest.needsFix.length);
console.log('Total skipAlreadyAudited:', manifest.skipAlreadyAudited.length);
console.log('Total skipMetaGateAligned:', manifest.skipMetaGateAligned.length);
console.log('Total skipChecksAbsent:', manifest.skipChecksAbsent.length);
console.log('Total skipCategoryOnly:', manifest.skipCategoryOnly.length);
console.log('Total unchanged:', manifest.unchanged.length);
console.log('Total headlineNoMismatch:', manifest.headlineNoMismatch.length);
console.log('Total errors:', manifest.errors.length);
console.log('');
console.log('Per module:');
for (const [mod, stats] of Object.entries(manifest.perModule)) {
  console.log(`  ${mod}: total=${stats.total} fix=${stats.fix} skipAudit=${stats.skipAudit} metaAlign=${stats.skipMetaAligned} chksAbs=${stats.skipChecksAbsent} catOnly=${stats.skipCategory} unchanged=${stats.unchanged} HEADLINE=${stats.headline}`);
}
console.log('');
console.log('Manifest written:', outPath);
