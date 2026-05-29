#!/usr/bin/env node
/**
 * tw-grid score-schema-migrate — score JSON schema 통일 도구
 *
 * 목적: artifacts/**\/-score.json 파일을 grid-state-sync.mjs REQUIRED_SCORE_KEYS
 *       (18 keys) 와 VALID_STAGES (specify/implement/verify) 에 적합하게 보충.
 *
 * 의무 (절대 준수):
 *   - score 산식 결과 변경 금지 (yesCount/noCount/naCount/denominator/score/passed/checks 무변동)
 *   - 변경 전후 score-invariant 필드 deep-equal 검증, drift 발견 시 abort
 *   - 기존 auditMetadata 보존, idempotent (재실행 안전)
 *
 * 호출:
 *   node .claude/tw-grid/tools/score-schema-migrate.mjs --dry-run
 *   node .claude/tw-grid/tools/score-schema-migrate.mjs --apply
 *
 * 산식 결정 (2026-05-27):
 *   - implementer-self-report schema (checks 부재 7건): skip — 별도 KNOWN_ALT_SCHEMA 으로 분리
 *   - stage 비정규 'implement-verifier'/'implement-verify' (5건): → 'verify' 정규화
 *     이유: Coverage Verifier 단계는 Implementer self-report 의 사후 검증 — VALID_STAGES 3가지
 *           lifecycle 에서 verify 의미. 원본 값은 schemaMigration.originalStage 에 보존.
 *   - stage 'IMPLEMENT' (1건): → 'implement' (대문자 typo)
 *   - stage 부재 (2건): 파일명에서 추출
 *   - short goalId 'G-NNN': 'MOD-XX/area/G-NNN' full key 로 변환 (validator 가 authority)
 *   - moduleId 누락 (178건): 기존 `module` (string) 또는 path 에서 추출
 *   - tier 누락 (176건): 기존 `migrationImpact` 또는 goals.json Read fallback
 *   - runAt 누락 (248건): verifiedAt/evaluatedAt/lastRun/specDate/date → fallback "2026-05-27"
 *   - verifierModel 누락 (205건): model/implementerModel/specifierModel → stage 기본값
 */

import { readFile, writeFile, readdir } from 'fs/promises';
import { join, dirname, basename, sep } from 'path';

const ARTIFACTS_DIR = '.claude/tw-grid/artifacts';
const GOALS_DIR = '.claude/tw-grid/goals';

const REQUIRED_SCORE_KEYS = [
  'goalId', 'moduleId', 'area', 'stage', 'tier', 'threshold',
  'rubricVersion', 'checks', 'yesCount', 'noCount', 'naCount',
  'denominator', 'score', 'passed', 'failedChecks', 'feedback',
  'runAt', 'verifierModel',
];

const VALID_STAGES = new Set(['specify', 'implement', 'verify']);

// Stage 비정규값 → canonical 매핑.
// implement-verifier / implement-verify 는 Coverage Verifier 출력(metaGates 보유) — verify lifecycle 의미.
const STAGE_NORMALIZE_MAP = {
  IMPLEMENT: 'implement',
  SPECIFY: 'specify',
  VERIFY: 'verify',
  'implement-verifier': 'verify',
  'implement-verify': 'verify',
};

const TIER_THRESHOLDS = { high: 95, medium: 90, low: 85 };

const STAGE_DEFAULT_RUBRIC = {
  specify: '1.0.10',
  implement: '1.0.14',
  verify: '1.0.7',
};

const STAGE_DEFAULT_VERIFIER = {
  specify: 'haiku',
  implement: 'haiku',
  verify: 'opus',
};

const DEFAULT_RUN_AT = '2026-05-27';

const RUN_AT_CANDIDATES = ['verifiedAt', 'evaluatedAt', 'auditedAt', 'lastRun', 'verificationDate', 'implementedAt', 'specDate', 'date', 'runDate'];
const VERIFIER_CANDIDATES = ['model', 'implementerModel', 'specifierModel'];

// score-invariant 필드 (변경 절대 금지). post-write deep-equal 검증.
const SCORE_INVARIANT_FIELDS = ['yesCount', 'noCount', 'naCount', 'denominator', 'score', 'passed', 'checks', 'auditMetadata'];

/** ── 유틸 ──────────────────────────────────────────────────────────── */

async function walkScoreFiles(dir, list = []) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch { return list; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walkScoreFiles(p, list);
    else if (/-score\.json$/.test(e.name)) list.push(p);
  }
  return list;
}

function detectEol(raw) { return raw.includes('\r\n') ? '\r\n' : '\n'; }

function writeJsonPreservingEol(file, obj, originalRaw) {
  const eol = detectEol(originalRaw);
  const trailingNl = originalRaw.endsWith('\n') || originalRaw.endsWith('\r\n');
  let out = JSON.stringify(obj, null, 2);
  if (eol === '\r\n') out = out.replace(/\n/g, '\r\n');
  if (trailingNl) out += eol;
  return out;
}

/**
 * path 에서 (moduleId, area, fileStem) 추출.
 *   .claude/tw-grid/artifacts/MOD-GRID-04/column/G-002-implement-score.json
 *   → moduleId="MOD-GRID-04", area="column", fileStem="G-002-implement-score"
 */
function parsePath(p) {
  const norm = p.replace(/\\/g, '/');
  const m = norm.match(/artifacts\/([^/]+)\/([^/]+)\/([^/]+)\.json$/);
  if (!m) return null;
  return { moduleId: m[1], area: m[2], fileStem: m[3] };
}

/** 파일명에서 stage 추출 (-specify-, -implement-, -verify-). */
function inferStageFromFilename(fileStem) {
  if (/-specify-/.test(fileStem)) return 'specify';
  if (/-implement-verifier-|-implement-verify-/.test(fileStem)) return 'verify'; // sub-variant → verify
  if (/-implement-/.test(fileStem)) return 'implement';
  if (/-verify-/.test(fileStem)) return 'verify';
  return null;
}

/** goals.json 캐시. moduleId → area → goalId → goal entry. */
const goalsCache = new Map();
async function loadGoalsForModule(moduleId) {
  if (goalsCache.has(moduleId)) return goalsCache.get(moduleId);
  const map = new Map(); // area → goalId → goal
  const modDir = join(GOALS_DIR, moduleId);
  let entries;
  try { entries = await readdir(modDir, { withFileTypes: true }); }
  catch { goalsCache.set(moduleId, map); return map; }
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith('-goals.json')) continue;
    try {
      const data = JSON.parse(await readFile(join(modDir, e.name), 'utf-8'));
      const area = data.area || e.name.replace(/-goals\.json$/, '');
      const byGoal = new Map();
      for (const g of (data.goals || [])) byGoal.set(g.goalId, g);
      map.set(area, byGoal);
    } catch { /* swallow */ }
  }
  goalsCache.set(moduleId, map);
  return map;
}

async function lookupTier(moduleId, area, goalId) {
  const m = await loadGoalsForModule(moduleId);
  const goal = m.get(area)?.get(goalId);
  if (goal?.migrationImpact && TIER_THRESHOLDS[goal.migrationImpact] !== undefined) {
    return goal.migrationImpact;
  }
  return null;
}

/** 기존 데이터에서 ISO 형식 timestamp 추출. 실패 시 DEFAULT_RUN_AT. */
function pickRunAt(data) {
  for (const k of RUN_AT_CANDIDATES) {
    const v = data[k];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return DEFAULT_RUN_AT;
}

function pickVerifierModel(data, stage) {
  for (const k of VERIFIER_CANDIDATES) {
    const v = data[k];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return STAGE_DEFAULT_VERIFIER[stage] || 'haiku';
}

/** score-invariant deep-equal (변경 금지 필드). */
function scoreInvariantSnapshot(d) {
  const snap = {};
  for (const k of SCORE_INVARIANT_FIELDS) {
    if (k in d) snap[k] = JSON.parse(JSON.stringify(d[k]));
    else snap[k] = '__ABSENT__';
  }
  return snap;
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!(k in b)) return false;
    if (!deepEqual(a[k], b[k])) return false;
  }
  return true;
}

/** ── 메인 ──────────────────────────────────────────────────────────── */

async function migrateOne(file) {
  const raw = await readFile(file, 'utf-8');
  let data;
  try { data = JSON.parse(raw); }
  catch (e) { return { file, action: 'error', reason: 'parse: ' + e.message.slice(0, 80) }; }

  const path = parsePath(file);
  if (!path) return { file, action: 'error', reason: 'path-unrecognized' };

  // 이미 schema-migrate 적용된 파일은 idempotent skip.
  if (data.schemaMigration && data.schemaMigration.migratedAt) {
    return { file, action: 'skip-already-migrated' };
  }

  // checks 부재 (alternate schema) 는 skip — 별도 whitelist 권장.
  if (!('checks' in data)) {
    return { file, action: 'skip-alt-schema', reason: 'no-checks-field' };
  }

  const before = scoreInvariantSnapshot(data);
  const changes = [];

  // 1. stage 정규화
  let stage = data.stage;
  let originalStage = null;
  if (!stage || typeof stage !== 'string') {
    const inferred = inferStageFromFilename(path.fileStem);
    if (inferred) {
      originalStage = stage ?? '__ABSENT__';
      data.stage = inferred;
      stage = inferred;
      changes.push(`stage=${inferred} (inferred from filename)`);
    } else {
      return { file, action: 'error', reason: 'stage-undetectable' };
    }
  } else if (!VALID_STAGES.has(stage)) {
    const canonical = STAGE_NORMALIZE_MAP[stage];
    if (canonical) {
      originalStage = stage;
      data.stage = canonical;
      stage = canonical;
      changes.push(`stage:${originalStage}→${canonical}`);
    } else {
      return { file, action: 'error', reason: `stage-unknown:${stage}` };
    }
  }

  // 2. moduleId 보충 (path 기준 — 기존 `module` 보존)
  if (!data.moduleId) {
    data.moduleId = path.moduleId;
    changes.push('moduleId+');
  }

  // 3. area 보충
  if (!data.area) {
    data.area = path.area;
    changes.push('area+');
  }

  // 4. goalId 정규화 (short → full key)
  if (typeof data.goalId === 'string' && /^G-\d+$/.test(data.goalId)) {
    const fullKey = `${data.moduleId}/${data.area}/${data.goalId}`;
    changes.push(`goalId:${data.goalId}→full`);
    data.goalId = fullKey;
  } else if (!data.goalId) {
    // 파일명에서 추출 (예: G-001-implement-score → G-001)
    const m = path.fileStem.match(/^(G-\d+)/);
    if (m) {
      data.goalId = `${data.moduleId}/${data.area}/${m[1]}`;
      changes.push('goalId+ (from filename)');
    }
  }

  // 5. tier 보충 (goals.json 우선, migrationImpact fallback)
  if (!data.tier) {
    let tier = null;
    const shortId = data.goalId?.split('/').pop();
    if (shortId) tier = await lookupTier(data.moduleId, data.area, shortId);
    if (!tier && data.migrationImpact && TIER_THRESHOLDS[data.migrationImpact] !== undefined) {
      tier = data.migrationImpact;
    }
    if (!tier) tier = 'medium'; // 마지막 fallback
    data.tier = tier;
    changes.push(`tier=${tier}`);
  }

  // 6. threshold 보충 (tier 기준)
  if (typeof data.threshold !== 'number') {
    data.threshold = TIER_THRESHOLDS[data.tier] ?? 90;
    changes.push(`threshold=${data.threshold}`);
  }

  // 7. rubricVersion 보충
  if (!data.rubricVersion) {
    data.rubricVersion = STAGE_DEFAULT_RUBRIC[stage] || '1.0.0';
    changes.push(`rubricVersion=${data.rubricVersion}`);
  }

  // 8. categoryScores 모델 처리: yesCount/noCount/naCount 가 top-level 부재이면
  //    categoryScores 안에서 합산 — 단, score-invariant 위반 방지 위해 score 계산은 절대 금지.
  //    categoryScores 모델은 yesCount sub-field 가 없을 수도 있어 0 으로 채움.
  if (!('yesCount' in data) || !('noCount' in data) || !('naCount' in data)) {
    let y = 0, n = 0, na = 0;
    const cs = data.categoryScores;
    if (cs && typeof cs === 'object') {
      for (const v of Object.values(cs)) {
        if (v && typeof v === 'object') {
          if (typeof v.yesCount === 'number') y += v.yesCount;
          if (typeof v.noCount === 'number') n += v.noCount;
          if (typeof v.naCount === 'number') na += v.naCount;
        }
      }
    }
    // checks 에서 직접 카운트 (categoryScores 가 비어있을 때)
    if (y === 0 && n === 0 && na === 0 && data.checks && typeof data.checks === 'object') {
      for (const v of Object.values(data.checks)) {
        const r = v?.result;
        if (r === 'YES') y++;
        else if (r === 'NO') n++;
        else if (r === 'N/A') na++;
      }
    }
    if (!('yesCount' in data)) { data.yesCount = y; changes.push(`yesCount=${y}`); }
    if (!('noCount' in data)) { data.noCount = n; changes.push(`noCount=${n}`); }
    if (!('naCount' in data)) { data.naCount = na; changes.push(`naCount=${na}`); }
  }

  // 9. denominator 보충 (yesCount + noCount)
  if (!('denominator' in data)) {
    data.denominator = (data.yesCount || 0) + (data.noCount || 0);
    changes.push(`denominator=${data.denominator}`);
  }

  // 10. score 보충 (weightedScore 우선) — categoryScores 모델의 weightedScore 가 실 score.
  if (!('score' in data)) {
    if (typeof data.weightedScore === 'number') {
      data.score = data.weightedScore;
      changes.push(`score=weightedScore`);
    } else {
      // 산식 적용 금지 원칙 — fallback 0 (alt-schema 우려 시 skip 권장이나 이 분기 도달은 매우 드묾)
      data.score = 0;
      changes.push(`score=0 (fallback)`);
    }
  }

  // 11. passed 보충
  if (!('passed' in data)) {
    data.passed = data.score >= data.threshold;
    changes.push(`passed=${data.passed}`);
  }

  // 12. failedChecks 보충
  if (!('failedChecks' in data) || !Array.isArray(data.failedChecks)) {
    data.failedChecks = [];
    changes.push('failedChecks=[]');
  }

  // 13. feedback 보충 (구조는 보존: 객체이든 배열이든)
  if (!('feedback' in data)) {
    data.feedback = [];
    changes.push('feedback=[]');
  }

  // 14. runAt 보충
  if (!data.runAt) {
    data.runAt = pickRunAt(data);
    changes.push(`runAt=${data.runAt}`);
  }

  // 15. verifierModel 보충
  if (!data.verifierModel) {
    data.verifierModel = pickVerifierModel(data, stage);
    changes.push(`verifierModel=${data.verifierModel}`);
  }

  // 16. schemaMigration 메타 (idempotent 마커 + 원본 stage 보존)
  data.schemaMigration = {
    migratedAt: DEFAULT_RUN_AT,
    migratedBy: 'score-schema-migrate.mjs',
    reason: 'REQUIRED_SCORE_KEYS 통일 + VALID_STAGES 정규화 (score 산식 무영향)',
    changes,
  };
  if (originalStage !== null) data.schemaMigration.originalStage = originalStage;

  // ── score-invariant 검증 (mandatory) ───────────────────────────────
  // 의무: 기존에 존재한 값은 절대 변하지 않아야 함. 부재 → 신규 보충은 허용.
  //       (REQUIRED_SCORE_KEYS 보충이 본 도구의 목적이므로 ABSENT → value 는 의도적 행위)
  const after = scoreInvariantSnapshot(data);
  for (const k of SCORE_INVARIANT_FIELDS) {
    if (before[k] === '__ABSENT__') continue; // 신규 보충은 허용
    if (!deepEqual(before[k], after[k])) {
      return {
        file,
        action: 'error',
        reason: `SCORE-INVARIANT-DRIFT: ${k} changed (pre-existing value mutated)`,
        beforeVal: JSON.stringify(before[k]).slice(0, 120),
        afterVal: JSON.stringify(after[k]).slice(0, 120),
      };
    }
  }

  return { file, action: 'migrate', changes, data, raw };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const apply = args.includes('--apply');
  if (!dryRun && !apply) {
    console.error('Usage: node score-schema-migrate.mjs [--dry-run | --apply]');
    process.exit(1);
  }

  const files = await walkScoreFiles(ARTIFACTS_DIR);
  console.log(`[score-schema-migrate] Found ${files.length} score files (mode=${dryRun ? 'DRY-RUN' : 'APPLY'})`);

  const results = { migrate: [], skipAltSchema: [], skipAlreadyMigrated: [], error: [] };
  for (const f of files) {
    const r = await migrateOne(f);
    if (r.action === 'migrate') results.migrate.push(r);
    else if (r.action === 'skip-alt-schema') results.skipAltSchema.push(r);
    else if (r.action === 'skip-already-migrated') results.skipAlreadyMigrated.push(r);
    else results.error.push(r);
  }

  // 요약
  console.log(`\n=== Summary ===`);
  console.log(`To migrate:           ${results.migrate.length}`);
  console.log(`Skip (alt schema):    ${results.skipAltSchema.length}`);
  console.log(`Skip (already done):  ${results.skipAlreadyMigrated.length}`);
  console.log(`Errors:               ${results.error.length}`);

  // 변경 카테고리 집계
  const changeCategories = {};
  for (const r of results.migrate) {
    for (const c of r.changes) {
      const cat = c.split(/[=:+( ]/)[0];
      changeCategories[cat] = (changeCategories[cat] || 0) + 1;
    }
  }
  console.log(`\n=== Change categories (file counts) ===`);
  Object.entries(changeCategories).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k.padEnd(20)} ${v}`);
  });

  if (results.error.length) {
    console.log(`\n=== Errors ===`);
    for (const e of results.error) {
      console.log(`  ${e.file.replace(/\\/g, '/').split('/artifacts/')[1] || e.file}`);
      console.log(`     ${e.reason}`);
      if (e.beforeVal) console.log(`     before: ${e.beforeVal}`);
      if (e.afterVal) console.log(`     after:  ${e.afterVal}`);
    }
  }

  if (results.skipAltSchema.length) {
    console.log(`\n=== Skipped (alt schema — checks 부재) ===`);
    for (const s of results.skipAltSchema) {
      const rel = s.file.replace(/\\/g, '/').split('/artifacts/')[1];
      console.log(`  ${rel}`);
    }
  }

  if (apply) {
    // score-invariant 위반 없을 때만 write 진행
    if (results.error.some(e => e.reason?.startsWith('SCORE-INVARIANT-DRIFT'))) {
      console.error(`\n❌ SCORE-INVARIANT-DRIFT detected. Abort write. Fix the tool logic before --apply.`);
      process.exit(2);
    }
    let written = 0;
    for (const r of results.migrate) {
      const out = writeJsonPreservingEol(r.file, r.data, r.raw);
      await writeFile(r.file, out, 'utf-8');
      written++;
    }
    console.log(`\n✅ Wrote ${written} files. Run grid-state-sync.mjs to verify.`);
  } else {
    console.log(`\n[dry-run] No files written. Re-run with --apply to commit.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
