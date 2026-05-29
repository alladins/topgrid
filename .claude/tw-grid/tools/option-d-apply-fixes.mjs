#!/usr/bin/env node
// Option D Pattern C Apply Fixes
// Applies retroactive top-level count + auditMetadata fixes from manifest

import fs from 'fs';
import path from 'path';

const MANIFEST = 'D:/project/topvel_project/TOMIS/.claude/tw-grid/tools/option-d-manifest.json';
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

const AUDIT_DATE = '2026-05-27';
const AUDITED_BY = '옵션 D Patcher (Pattern C 일괄)';

function detectEol(raw) {
  return raw.includes('\r\n') ? '\r\n' : '\n';
}

function writeJsonPreservingEol(file, obj) {
  const original = fs.readFileSync(file, 'utf8');
  const eol = detectEol(original);
  const trailingNl = original.endsWith('\n') || original.endsWith('\r\n');
  let out = JSON.stringify(obj, null, 2);
  if (eol === '\r\n') {
    out = out.replace(/\n/g, '\r\n');
  }
  if (trailingNl) out += eol;
  fs.writeFileSync(file, out, { encoding: 'utf8' });
}

function classifyScoreImpact(reportedScore, actualScore) {
  if (reportedScore == null || actualScore == null) return 'none';
  const diff = actualScore - reportedScore;
  if (Math.abs(diff) < 0.005) return 'none';
  if (diff > 0) return 'positive';
  return 'negative';
}

let applied = 0;
let skipped = 0;
const errors = [];

for (const entry of manifest.needsFix) {
  const { file, actual, reported, failedCheckIds, threshold } = entry;
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    errors.push({ file, error: 'parse: ' + e.message });
    continue;
  }

  // Idempotency: if already audited, skip
  if (data.auditMetadata) {
    skipped++;
    continue;
  }

  const newYes = actual.yes;
  const newNo = actual.no;
  const newNa = actual.na;
  const newDenom = newYes + newNo;
  const newScore = newDenom > 0 ? Math.round((newYes / newDenom) * 10000) / 100 : 0;
  const newPassed = threshold != null ? newScore >= threshold : data.passed;

  const originalYes = data.yesCount;
  const originalNo = data.noCount;
  const originalNa = data.naCount;
  const originalDenom = data.denominator;
  const originalScore = data.score;
  const originalPassed = data.passed;

  // Apply top-level updates
  data.yesCount = newYes;
  data.noCount = newNo;
  data.naCount = newNa;
  data.denominator = newDenom;
  data.score = newScore;
  data.passed = newPassed;

  // failedChecks: rebuild from NO-only ids. Preserve any prior reason if a structured array existed.
  const priorFailedChecks = Array.isArray(data.failedChecks) ? data.failedChecks : [];
  const priorReasonsById = {};
  for (const fc of priorFailedChecks) {
    if (typeof fc === 'object' && fc != null) {
      const id = fc.checkId || fc.id;
      if (id) priorReasonsById[id] = fc;
    }
  }
  data.failedChecks = failedCheckIds.map(id => {
    if (priorReasonsById[id]) return priorReasonsById[id];
    return { checkId: id };
  });

  data.auditMetadata = {
    auditedAt: AUDIT_DATE,
    auditedBy: AUDITED_BY,
    reason: 'yesCount/naCount/denominator 분류 정정 (score 무영향)',
    originalReportedYesCount: originalYes,
    originalReportedNoCount: originalNo,
    originalReportedNaCount: originalNa,
    originalReportedDenominator: originalDenom,
    originalReportedScore: originalScore,
    originalReportedPassed: originalPassed,
    scoreImpact: classifyScoreImpact(originalScore, newScore),
    passedImpact: originalPassed === newPassed ? 'unchanged' : 'changed',
  };

  try {
    writeJsonPreservingEol(file, data);
    applied++;
  } catch (e) {
    errors.push({ file, error: 'write: ' + e.message });
  }
}

console.log('=== Apply Summary ===');
console.log('Applied:', applied);
console.log('Skipped (already audited):', skipped);
console.log('Errors:', errors.length);
if (errors.length) {
  for (const e of errors) console.log(' ', e.file, '|', e.error);
}
