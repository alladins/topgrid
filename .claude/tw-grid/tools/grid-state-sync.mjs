#!/usr/bin/env node
/**
 * tw-grid state-sync — goals.json fresh read → state.json 재계산
 *
 * v1.1 변경 (2026-05-14 /tw-grid diagnose SUGGEST-1/-5 적용):
 *   - canonical-modules.json 의 module.category 로 byPhase 집계
 *     (file-level phase 필드 무시 — workflowPhase 와 category 혼재 방지)
 *   - state.phase 자동 전환: init / goals_pending / in_loop / done
 *   - artifacts/**\/-score.json schema 화이트리스트 검증 (warning only)
 *     17 필수 top-level 키 — rubric v1.0.10 / 1.0.7 / 1.0.3 와 동기
 *
 * 호출: node .claude/tw-grid/tools/grid-state-sync.mjs
 */

import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { join } from 'path';

const ROOT = '.claude/tw-grid';
const STATE_FILE = join(ROOT, 'state.json');
const GOALS_DIR = join(ROOT, 'goals');
const CANONICAL_FILE = join(ROOT, 'canonical-modules.json');
const ARTIFACTS_DIR = join(ROOT, 'artifacts');

const REQUIRED_SCORE_KEYS = [
  'goalId', 'moduleId', 'area', 'stage', 'tier', 'threshold',
  'rubricVersion', 'checks', 'yesCount', 'noCount', 'naCount',
  'denominator', 'score', 'passed', 'failedChecks', 'feedback',
  'runAt', 'verifierModel',
];
const VALID_STAGES = ['specify', 'implement', 'verify'];
const VALID_PHASES_KEYS = [
  'abstraction', 'critical-gap', 'wijmo-class',
  'enhancement', 'migration', 'infra',
];

// v1.1.2 (2026-05-15 SUGGEST-1 B 옵션): 기존 corrupt score 파일 whitelist.
// 신규 corrupt 발견 시 sync 도구 exit 2 — 무결성 회귀 즉시 가시화.
// rubric JSON.parse 자기-검증 (2026-05-15 추가) 가 발동하면 신규 발생 0 예상.
// v1.1.3 (2026-05-27): 기존 3건 모두 옵션 A + 본 cycle 에서 정정 완료. whitelist 빈 Set.
const KNOWN_CORRUPT_WHITELIST = new Set([]);

// v1.1.4 (2026-05-27 schema migration): 7 alt-schema 파일 — implementer self-report 형식
// (checks 객체 부재, wiringAuditPass/buildResults 등 자유 필드).
// REQUIRED_SCORE_KEYS 와 다른 schema 이므로 missing keys / invalid stage / short goalId
// warning 에서 의도적 제외. score-schema-migrate.mjs 도구가 skip 처리.
const KNOWN_ALT_SCHEMA_WHITELIST = new Set([
  'MOD-GRID-02/state/G-004-implement-score.json',
  'MOD-GRID-04/column/G-002-implement-score.json',
  'MOD-GRID-04/column/G-003-verify-score.json',
  'MOD-GRID-06/export/G-005-implement-score.json',
  'MOD-GRID-11/range/G-001-implement-score.json',
  'MOD-GRID-11/range/G-002-implement-score.json',
  'MOD-GRID-16/enhancement/G-001-implement-score.json',
]);

async function walkScoreFiles(dir, list = []) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch { return list; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walkScoreFiles(p, list);
    else if (/-score\.json$/.test(e.name) || /-verifier-score\.json$/.test(e.name)) list.push(p);
  }
  return list;
}

function relPath(p) {
  return p.split(/[\\\/]artifacts[\\\/]/)[1]?.replace(/\\/g, '/') || p;
}

async function validateScoreSchemas() {
  const files = await walkScoreFiles(ARTIFACTS_DIR);
  const corrupted = [];
  const missingKeys = [];
  const invalidStage = [];
  const shortGoalId = [];
  const altSchema = [];
  for (const p of files) {
    let d;
    try { d = JSON.parse(await readFile(p, 'utf-8')); }
    catch (e) { corrupted.push({ path: p, err: e.message.slice(0, 80) }); continue; }
    // alt-schema whitelist: missing-keys/invalid-stage/short-goalId 검증에서 의도적 제외.
    if (KNOWN_ALT_SCHEMA_WHITELIST.has(relPath(p))) { altSchema.push(p); continue; }
    const missing = REQUIRED_SCORE_KEYS.filter(k => !(k in d));
    if (missing.length) missingKeys.push({ path: p, missing });
    if (d.stage && !VALID_STAGES.includes(d.stage)) invalidStage.push({ path: p, stage: d.stage });
    if (typeof d.goalId === 'string' && /^G-\d+$/.test(d.goalId)) shortGoalId.push(p);
  }
  return { total: files.length, corrupted, missingKeys, invalidStage, shortGoalId, altSchema };
}

function decidePhase(summary) {
  if (summary.totalGoals === 0) return 'init';
  if (summary.completed === summary.totalGoals) return 'done';
  if (summary.completed > 0 || summary.inProgress > 0) return 'in_loop';
  return 'goals_pending';
}

async function main() {
  const state = JSON.parse(await readFile(STATE_FILE, 'utf-8'));

  let moduleCategoryMap = new Map();
  let modulePackageTargetMap = new Map();
  try {
    const canonical = JSON.parse(await readFile(CANONICAL_FILE, 'utf-8'));
    moduleCategoryMap = new Map(canonical.modules.map(m => [m.moduleId, m.category]));
    modulePackageTargetMap = new Map(canonical.modules.map(m => [m.moduleId, m.packageTarget || '']));
  } catch {
    // canonical-modules.json 부재 시 byPhase 집계는 abstraction 으로 fallback,
    // byPackage 집계는 goal.packageTarget 만 의존
  }

  const modules = await readdir(GOALS_DIR).catch(() => []);
  const goalsIndex = [];
  const summary = {
    totalGoals: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    blocked: 0,
    byTier: { high: 0, medium: 0, low: 0 },
    byPackage: { open: 0, pro: 0 },
    byPhase: Object.fromEntries(VALID_PHASES_KEYS.map(k => [k, 0])),
  };

  for (const mod of modules) {
    if (mod.startsWith('.')) continue;
    const modDir = join(GOALS_DIR, mod);
    const goalFiles = await readdir(modDir).catch(() => []);
    for (const f of goalFiles) {
      if (!f.endsWith('-goals.json')) continue;
      const data = JSON.parse(await readFile(join(modDir, f), 'utf-8'));
      for (const goal of data.goals || []) {
        summary.totalGoals++;
        const statusKey =
          goal.overallStatus === 'completed' ? 'completed'
          : goal.overallStatus === 'in_progress' ? 'inProgress'
          : goal.overallStatus === 'blocked' ? 'blocked'
          : 'pending';
        summary[statusKey]++;

        const tier = goal.migrationImpact || 'medium';
        if (summary.byTier[tier] !== undefined) summary.byTier[tier]++;

        // v1.1.1: goal.packageTarget 우선, 없으면 canonical-modules module.packageTarget fallback
        const packageTarget = goal.packageTarget || modulePackageTargetMap.get(mod) || '';
        const pkg = packageTarget.includes('pro') ? 'pro' : 'open';
        summary.byPackage[pkg]++;

        // ★ v1.1: canonical-modules.json category 사용 (file-level phase 무시)
        const category = moduleCategoryMap.get(mod) || 'abstraction';
        if (summary.byPhase[category] !== undefined) summary.byPhase[category]++;

        goalsIndex.push({
          key: `${mod}/${data.area || ''}/${goal.goalId}`,
          moduleId: mod,
          area: data.area,
          goalId: goal.goalId,
          title: goal.title,
          priority: goal.priority,
          migrationImpact: tier,
          overallStatus: goal.overallStatus,
          stages: {
            specify: goal.stages?.specify?.status,
            implement: goal.stages?.implement?.status,
            verify: goal.stages?.verify?.status,
          },
        });
      }
    }
  }

  // ★ v1.1: phase 자동 전환
  const newPhase = decidePhase(summary);
  const phaseChanged = state.phase !== newPhase;

  state.goalsIndex = goalsIndex;
  state.summary = summary;
  state.phase = newPhase;
  state.lastUpdated = new Date().toISOString().slice(0, 10);

  await writeFile(STATE_FILE, JSON.stringify(state, null, 2));

  // ★ v1.1: score schema validation
  // v1.1.2 (2026-05-15): corrupt JSON 은 known-whitelist 외 발견 시 exit 2.
  // missing keys / short goalId 는 여전히 warning (점진 정착 중).
  const v = await validateScoreSchemas();
  console.log(
    `[grid-state-sync] ${summary.totalGoals} goals / ${summary.completed} completed / phase=${newPhase}${phaseChanged ? ' (transition)' : ''}`,
  );

  // corrupt 분류: known (whitelist) vs new
  const corruptKnown = [];
  const corruptNew = [];
  for (const c of v.corrupted) {
    const rel = c.path.split(/[\\\/]artifacts[\\\/]/)[1]?.replace(/\\/g, '/') || c.path;
    if (KNOWN_CORRUPT_WHITELIST.has(rel)) corruptKnown.push({ ...c, rel });
    else corruptNew.push({ ...c, rel });
  }

  if (v.corrupted.length || v.missingKeys.length || v.invalidStage.length || v.shortGoalId.length || v.altSchema.length) {
    console.log(`[grid-state-sync] score schema check (${v.total} files):`);
    if (v.altSchema.length) {
      console.log(`  ℹ️  alt-schema (whitelisted, no-checks): ${v.altSchema.length} files — implementer self-report 형식 (정상)`);
    }
    if (corruptKnown.length) {
      console.log(`  ⚠️ corrupted JSON (known, whitelisted): ${corruptKnown.length} — ${corruptKnown.map(c=>c.rel).join(', ')}`);
    }
    if (corruptNew.length) {
      console.error(`  ❌ NEW CORRUPT SCORE FILES: ${corruptNew.length}`);
      for (const c of corruptNew) console.error(`     - ${c.rel} :: ${c.err}`);
      console.error(`     → Verifier 가 JSON.parse self-check 실패. rubric '★ JSON 출력 무결성 자기-검증' 위반.`);
      console.error(`     → 처리: (a) 해당 Goal 재채점 (/tw-grid rescore <goalKey>) 또는`);
      console.error(`             (b) 일시 허용 시 KNOWN_CORRUPT_WHITELIST 에 추가 (근거 ADR 동반).`);
    }
    if (v.missingKeys.length) {
      console.log(`  ⚠️ missing required keys: ${v.missingKeys.length} files (top: ${[...new Set(v.missingKeys.flatMap(m=>m.missing))].slice(0,5).join(', ')})`);
    }
    if (v.invalidStage.length) {
      console.log(`  ⚠️ invalid stage value: ${v.invalidStage.length} (e.g. ${v.invalidStage[0].stage})`);
    }
    if (v.shortGoalId.length) {
      console.log(`  ⚠️ short goalId (G-NNN only, missing full key): ${v.shortGoalId.length}/${v.total}`);
    }
  }

  // state.json 은 이미 위에서 작성됨 — 진행 상태 보존.
  // 신규 corrupt 발견 시 exit 2 로 호출자(monitor/diagnose/loop) 에게 가시화.
  if (corruptNew.length) process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
