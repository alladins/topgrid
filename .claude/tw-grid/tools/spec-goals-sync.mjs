#!/usr/bin/env node
// spec-goals-sync.mjs — tw-grid spec ↔ goals.json implementFiles drift detector
//
// Purpose:
//   Pattern A (goals.json implementFiles ↔ spec Section 7 표 drift) 재발 차단.
//   19 모듈 sweep audit 결과 36 Goal 위반 발견 → 옵션 B 정정 후 본 도구로 사전 차단.
//
// Read-only audit. goals.json / spec.md 수정 없음.
//
// Usage:
//   # 전체 audit
//   node .claude/tw-grid/tools/spec-goals-sync.mjs
//
//   # 특정 모듈
//   node .claude/tw-grid/tools/spec-goals-sync.mjs --module MOD-GRID-09
//
//   # 특정 Goal
//   node .claude/tw-grid/tools/spec-goals-sync.mjs --goal MOD-GRID-09/filter-ui/G-001
//
//   # CI 통합 (drift 시 exit 1)
//   node .claude/tw-grid/tools/spec-goals-sync.mjs --json > sync-report.json
//
//   # 상세 drift 표시
//   node .claude/tw-grid/tools/spec-goals-sync.mjs --verbose
//
// Exit codes:
//   0 — all clean
//   1 — drift 발견
//   2 — parse error 발견 (drift 와 별개)
//
// Drift kinds:
//   A. TOMIS_PREFIX_STALE — goals.json entry 가 D:/project/topvel_project/TOMIS/packages/ 로 시작 (정정 누락)
//                           예외: D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/ 는 정상 (ADR 파일)
//   B. COUNT_MISMATCH    — goals.json array length ≠ spec Section 7 entry count
//   C. CONTENT_DRIFT     — set 차집합 비어있지 않음 (goals \ spec ≠ ∅ 또는 spec \ goals ≠ ∅)

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─────────────────────────────────────────────────────────────────────────────
// Paths
// ─────────────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const TOOL_DIR   = resolve(__filename, '..');
const TW_GRID    = resolve(TOOL_DIR, '..');               // .claude/tw-grid
const GOALS_ROOT = join(TW_GRID, 'goals');
const ARTIF_ROOT = join(TW_GRID, 'artifacts');

const STALE_PREFIX = 'D:/project/topvel_project/TOMIS/packages/';
const STALE_EXEMPT = [
  'D:/project/topvel_project/TOMIS/.claude/',  // ADR / decisions / tw-grid files
];

// ─────────────────────────────────────────────────────────────────────────────
// CLI args
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const opts = { module: null, goal: null, json: false, verbose: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--module')       opts.module  = argv[++i] ?? null;
    else if (a === '--goal')    opts.goal    = argv[++i] ?? null;
    else if (a === '--json')    opts.json    = true;
    else if (a === '--verbose') opts.verbose = true;
    else if (a === '--help' || a === '-h') {
      printHelp();
      process.exit(0);
    } else {
      console.error(`unknown arg: ${a}`);
      process.exit(2);
    }
  }
  return opts;
}

function printHelp() {
  console.log([
    'Usage: node spec-goals-sync.mjs [options]',
    '',
    '  --module <MOD-GRID-XX>           특정 모듈만',
    '  --goal   <MOD-GRID-XX/AREA/G-NNN> 특정 Goal만',
    '  --json                            JSON 출력 (CI 통합용)',
    '  --verbose                         drift 상세 표시',
    '  -h, --help                        이 도움말',
  ].join('\n'));
}

// ─────────────────────────────────────────────────────────────────────────────
// Path normalization
// ─────────────────────────────────────────────────────────────────────────────

function normalizePath(p) {
  if (p == null) return '';
  let s = String(p).trim();
  s = s.replace(/\\/g, '/');
  s = s.replace(/\/+$/, '');
  s = s.replace(/\s+/g, ' ');
  return s;
}

function isStalePrefix(p) {
  if (!p.startsWith(STALE_PREFIX)) return false;
  for (const exempt of STALE_EXEMPT) {
    if (p.startsWith(exempt)) return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// goals.json loader
// ─────────────────────────────────────────────────────────────────────────────

function listGoalsJsonFiles() {
  if (!existsSync(GOALS_ROOT)) return [];
  const out = [];
  for (const moduleDir of readdirSync(GOALS_ROOT)) {
    const full = join(GOALS_ROOT, moduleDir);
    if (!statSync(full).isDirectory()) continue;
    if (!/^MOD-GRID-/.test(moduleDir)) continue;
    for (const f of readdirSync(full)) {
      if (f.endsWith('-goals.json')) {
        out.push({ moduleId: moduleDir, path: join(full, f) });
      }
    }
  }
  return out;
}

function loadGoalsJson(filePath) {
  const text = readFileSync(filePath, 'utf8');
  const data = JSON.parse(text);
  const moduleId = data.moduleId ?? null;
  const area     = data.area ?? null;
  const goals    = Array.isArray(data.goals) ? data.goals : [];
  return { moduleId, area, goals, raw: data };
}

// ─────────────────────────────────────────────────────────────────────────────
// spec.md Section 7 parser
// ─────────────────────────────────────────────────────────────────────────────

const SECTION7_HEADING_RE = /^##\s+(Section\s*7|7\.|Implementation Files|구현 대상 파일|Section\s*7\s*[:\-—]|7\s*[\-—:]|Section\s*7\s*[:\-—].*)/i;

/**
 * Locate Section 7 body lines.
 *   - heading match: "## Section 7", "## Section 7 — ...", "## 7. ...", "## 7 - ...",
 *                    "## Implementation Files", "## 구현 대상 파일"
 *   - body: until next "## " heading
 */
function extractSection7Lines(text) {
  const lines = text.split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('## ')) continue;
    const headingText = line.slice(3).trim();
    if (matchesSection7Heading(headingText)) {
      start = i + 1;
      break;
    }
  }
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) { end = i; break; }
  }
  return lines.slice(start, end);
}

function matchesSection7Heading(t) {
  // Accept: "Section 7", "Section 7: foo", "Section 7 — foo", "Section 7 - foo"
  //         "7. foo", "7: foo", "7 - foo"
  //         "Implementation Files", "구현 대상 파일 (N개)"
  const lc = t.toLowerCase();
  if (/^section\s*7(\b|[:\-—\s])/i.test(t)) return true;
  if (/^7[\.\:\-—\s]/.test(t)) return true;
  if (lc.startsWith('implementation files')) return true;
  if (t.startsWith('구현 대상 파일')) return true;
  return false;
}

/**
 * From Section 7 body, extract file paths.
 *   1. Detect optional prefix declaration: `**파일 경로 prefix**: \`PREFIX\``
 *   2. For each markdown table row, find ALL `...` (backtick-quoted) tokens.
 *   3. Pick the first token whose normalized form looks like a file path
 *      (contains '/' and doesn't look like a column header or type).
 *   4. If a prefix is set and the path doesn't already start with it, prepend.
 *   5. Skip table header/separator rows.
 */
function parseSection7Files(bodyLines) {
  let prefix = null;
  const files = [];
  let inTable = false;
  let headerCols = null;

  // detect prefix declaration anywhere in body
  // Supported forms (case-insensitive):
  //   **파일 경로 prefix**: `PREFIX`
  //   **prefix**: `PREFIX`
  //   **C-28**: 경로 prefix = `PREFIX`
  //   경로 prefix: `PREFIX`
  //   monorepo 경로: `PREFIX`
  for (const raw of bodyLines) {
    // Pattern 1: explicit prefix label
    let m = raw.match(/\*\*[^*`\n]*?\*\*\s*[:：]?\s*(?:.*?(?:경로\s*)?prefix\s*[:：=]?\s*)?`([^`]+)`/i);
    if (m && /prefix/i.test(raw)) { prefix = normalizePath(m[1]); break; }
    // Pattern 2: bare "경로 prefix: `...`" or "prefix: `...`" without bold
    m = raw.match(/(?:^|\s)(?:경로\s*)?prefix\s*[:：=]\s*`([^`]+)`/i);
    if (m) { prefix = normalizePath(m[1]); break; }
  }

  // Heuristic: if no explicit prefix, but header says "(monorepo 기준)"
  // → spec paths are relative to monorepo root. Use a special prefix marker so
  //   downstream matching with absolute goals.json paths still works.
  let monorepoRelative = false;
  for (const raw of bodyLines) {
    if (/monorepo\s*기준/.test(raw) || /relative\s*to\s*monorepo/i.test(raw)) {
      monorepoRelative = true;
      break;
    }
  }
  if (!prefix && monorepoRelative) {
    prefix = 'D:/project/topvel_project/topvel-grid-monorepo';
  }

  for (let i = 0; i < bodyLines.length; i++) {
    const raw  = bodyLines[i];
    const line = raw.trim();
    if (!line.startsWith('|')) {
      inTable = false;
      headerCols = null;
      continue;
    }
    // Detect separator row: |---|---|
    if (/^\|\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(line)) {
      inTable = true;
      continue;
    }
    // Split columns
    const cols = splitTableRow(line);
    if (cols.length === 0) continue;

    if (!inTable && headerCols === null) {
      headerCols = cols.map(c => c.toLowerCase());
      continue;  // header row
    }

    // Data row: scan all cells for backtick file paths
    const filePath = pickFilePathFromRow(cols);
    if (filePath == null) continue;

    let p = normalizePath(filePath);
    if (prefix && !p.startsWith(prefix) && !/^[A-Za-z]:\//.test(p) && !p.startsWith('/')) {
      // path is relative AND no drive letter → prepend prefix
      // Special exception: paths starting with `.claude/` are TOMIS-relative,
      // not monorepo-relative (TOMIS git tracks .claude/, not the monorepo)
      if (p.startsWith('.claude/')) {
        p = `D:/project/topvel_project/TOMIS/${p}`;
      } else {
        const pfx = prefix.replace(/\/+$/, '');
        p = `${pfx}/${p}`;
      }
      p = normalizePath(p);
    }
    files.push(p);
  }
  return { prefix, files };
}

function splitTableRow(line) {
  // strip leading/trailing |
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|'))   s = s.slice(0, -1);
  // split — naïve; backticks may contain | but rare in path tables
  return s.split('|').map(c => c.trim());
}

function pickFilePathFromRow(cols) {
  // collect all backtick tokens across all cells
  for (const cell of cols) {
    const tokens = extractBacktickTokens(cell);
    for (const tok of tokens) {
      if (looksLikePath(tok)) return tok;
    }
  }
  return null;
}

function extractBacktickTokens(text) {
  const out = [];
  const re = /`([^`]+)`/g;
  let m;
  while ((m = re.exec(text)) !== null) out.push(m[1].trim());
  return out;
}

function looksLikePath(s) {
  if (!s) return false;
  // Path-ish: contains "/" and at least one "." for extension OR ends with a known token,
  //          OR starts with drive letter / .claude / packages / src / apps / docs etc.
  if (!s.includes('/') && !s.includes('\\')) return false;
  // Reject obvious non-paths
  if (/^[A-Z][A-Z0-9_\-]+$/.test(s)) return false;   // ALL-CAPS const
  if (/^(NEW|MODIFY|DELETE|RENAME|UPDATE|ADD|REMOVE)$/i.test(s)) return false;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolve spec.md for a Goal
// ─────────────────────────────────────────────────────────────────────────────

function specPathFor(moduleId, area, goalId) {
  // Standard: .claude/tw-grid/artifacts/<moduleId>/<area>/<goalId>-spec.md
  if (area) {
    const candidate = join(ARTIF_ROOT, moduleId, area, `${goalId}-spec.md`);
    if (existsSync(candidate)) return candidate;
  }
  // Fallback: scan all subdirs of artifacts/<moduleId>
  const modDir = join(ARTIF_ROOT, moduleId);
  if (!existsSync(modDir)) return null;
  try {
    for (const sub of readdirSync(modDir)) {
      const subDir = join(modDir, sub);
      if (!statSync(subDir).isDirectory()) continue;
      const c = join(subDir, `${goalId}-spec.md`);
      if (existsSync(c)) return c;
    }
  } catch { /* swallow */ }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Compare
// ─────────────────────────────────────────────────────────────────────────────

// Normalize a path to a canonical comparison form by stripping known
// machine-specific or relative-anchor prefixes. This lets us compare:
//   "D:/project/topvel_project/topvel-grid-monorepo/packages/x.ts"
//   "topvel-grid-monorepo/packages/x.ts"
//   "packages/x.ts"           (when prefix declared as monorepo root)
// as equivalent.
function canonicalize(p) {
  let s = normalizePath(p);
  // Strip absolute drive root anchor for TOMIS and monorepo siblings
  s = s.replace(/^D:\/project\/topvel_project\//i, '');
  // Now s might be: "topvel-grid-monorepo/packages/..."  OR
  //                 "TOMIS/.claude/..."                  OR
  //                 already-stripped "packages/..."      OR
  //                 ".claude/..."                        OR
  //                 "TOMIS/tw-framework-front/..."
  // Strip "topvel-grid-monorepo/" so monorepo-relative vs absolute match
  s = s.replace(/^topvel-grid-monorepo\//, '');
  return s;
}

function compareEntries(goalsArr, specArr) {
  const gMap = new Map();
  for (const raw of goalsArr) {
    const n = normalizePath(raw);
    gMap.set(canonicalize(n), n);
  }
  const sMap = new Map();
  for (const raw of specArr) {
    const n = normalizePath(raw);
    sMap.set(canonicalize(n), n);
  }
  const goalsOnly = [];
  const specOnly  = [];
  for (const [k, v] of gMap) if (!sMap.has(k)) goalsOnly.push(v);
  for (const [k, v] of sMap) if (!gMap.has(k)) specOnly.push(v);
  const stale = [...gMap.values()].filter(isStalePrefix);
  return { goalsOnly, specOnly, stale, goalsCount: gMap.size, specCount: sMap.size };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main audit
// ─────────────────────────────────────────────────────────────────────────────

function auditAll(opts) {
  const goalFiles = listGoalsJsonFiles();
  const results = [];
  const stats = {
    totalGoals: 0,
    clean: 0,
    drift: 0,
    parseError: 0,
    specMissing: 0,
  };

  for (const gf of goalFiles) {
    if (opts.module && gf.moduleId !== opts.module) continue;
    let loaded;
    try {
      loaded = loadGoalsJson(gf.path);
    } catch (e) {
      stats.parseError++;
      results.push({
        kind: 'parse-error',
        scope: 'goals.json',
        moduleId: gf.moduleId,
        file: gf.path,
        error: String(e.message || e),
      });
      continue;
    }
    const { moduleId, area, goals } = loaded;
    for (const goal of goals) {
      const goalId = goal.goalId;
      if (!goalId) continue;
      const goalKey = `${moduleId}/${area ?? '-'}/${goalId}`;
      if (opts.goal && opts.goal !== goalKey) continue;

      stats.totalGoals++;

      const goalsFiles = Array.isArray(goal.implementFiles) ? goal.implementFiles : [];
      const specPath   = specPathFor(moduleId, area, goalId);

      if (!specPath) {
        stats.specMissing++;
        results.push({
          kind: 'spec-missing',
          moduleId, area, goalId, goalKey,
          goalsFiles,
        });
        continue;
      }

      let bodyLines, parsed;
      try {
        const text = readFileSync(specPath, 'utf8');
        bodyLines  = extractSection7Lines(text);
        if (bodyLines == null) {
          stats.parseError++;
          results.push({
            kind: 'parse-error',
            scope: 'spec.md',
            moduleId, area, goalId, goalKey,
            specPath,
            error: 'Section 7 heading not found',
          });
          continue;
        }
        parsed = parseSection7Files(bodyLines);
      } catch (e) {
        stats.parseError++;
        results.push({
          kind: 'parse-error',
          scope: 'spec.md',
          moduleId, area, goalId, goalKey,
          specPath,
          error: String(e.message || e),
        });
        continue;
      }

      const cmp = compareEntries(goalsFiles, parsed.files);
      const hasDrift = cmp.goalsOnly.length > 0 || cmp.specOnly.length > 0 || cmp.stale.length > 0;

      if (!hasDrift) {
        stats.clean++;
        results.push({
          kind: 'clean',
          moduleId, area, goalId, goalKey,
          specPath,
          goalsCount: cmp.goalsCount,
          specCount:  cmp.specCount,
        });
      } else {
        stats.drift++;
        results.push({
          kind: 'drift',
          moduleId, area, goalId, goalKey,
          specPath,
          goalsCount: cmp.goalsCount,
          specCount:  cmp.specCount,
          drifts: {
            stale:     cmp.stale,        // kind A
            countDiff: cmp.goalsCount !== cmp.specCount,  // kind B
            goalsOnly: cmp.goalsOnly,    // kind C — in goals but missing spec
            specOnly:  cmp.specOnly,     // kind C — in spec but missing goals
          },
        });
      }
    }
  }

  return { results, stats };
}

// ─────────────────────────────────────────────────────────────────────────────
// Reporters
// ─────────────────────────────────────────────────────────────────────────────

function formatTextReport({ results, stats }, opts) {
  const out = [];
  out.push(`[spec-goals-sync] Scanning ${stats.totalGoals} goals...`);
  out.push('');

  for (const r of results) {
    if (r.kind === 'clean') {
      if (opts.verbose) {
        out.push(`OK  ${r.goalKey}`);
        out.push(`    goals.json: ${r.goalsCount} entries`);
        out.push(`    spec Section 7: ${r.specCount} entries`);
        out.push(`    sync: OK`);
        out.push('');
      }
      continue;
    }
    if (r.kind === 'spec-missing') {
      out.push(`MISS ${r.goalKey}`);
      out.push(`    spec.md not found under artifacts/${r.moduleId}/${r.area}/`);
      out.push(`    goals.json: ${(r.goalsFiles || []).length} entries`);
      out.push('');
      continue;
    }
    if (r.kind === 'parse-error') {
      const key = r.goalKey ?? `${r.moduleId}/${r.scope}`;
      out.push(`ERR  ${key}  [${r.scope}]`);
      out.push(`    ${r.error}`);
      if (r.specPath) out.push(`    spec: ${shortRel(r.specPath)}`);
      out.push('');
      continue;
    }
    if (r.kind === 'drift') {
      const tags = [];
      if (r.drifts.stale.length > 0) tags.push(`A:stale(${r.drifts.stale.length})`);
      if (r.drifts.countDiff)        tags.push(`B:count`);
      if (r.drifts.goalsOnly.length > 0 || r.drifts.specOnly.length > 0) tags.push(`C:content`);
      out.push(`DRIFT ${r.goalKey}  [${tags.join(',')}]`);
      out.push(`    goals.json: ${r.goalsCount} entries (${r.drifts.stale.length} TOMIS prefix stale)`);
      out.push(`    spec Section 7: ${r.specCount} entries`);
      if (r.drifts.stale.length > 0) {
        out.push(`    - TOMIS prefix stale entries (kind A):`);
        for (const p of r.drifts.stale) out.push(`        • ${p}`);
      }
      if (r.drifts.goalsOnly.length > 0) {
        out.push(`    - in goals.json but missing in spec (kind C):`);
        for (const p of r.drifts.goalsOnly) out.push(`        • ${p}`);
      }
      if (r.drifts.specOnly.length > 0) {
        out.push(`    - in spec but missing in goals.json (kind C):`);
        for (const p of r.drifts.specOnly) out.push(`        • ${p}`);
      }
      out.push(`    spec: ${shortRel(r.specPath)}`);
      out.push('');
    }
  }

  out.push('Summary:');
  out.push(`  Total Goals:    ${stats.totalGoals}`);
  out.push(`  Clean:          ${stats.clean}`);
  out.push(`  Drift:          ${stats.drift}`);
  out.push(`  Spec missing:   ${stats.specMissing}`);
  out.push(`  Parse error:    ${stats.parseError}`);
  return out.join('\n');
}

function shortRel(p) {
  try { return relative(process.cwd(), p).replace(/\\/g, '/'); }
  catch { return p; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry
// ─────────────────────────────────────────────────────────────────────────────

function main() {
  const opts = parseArgs(process.argv);
  const { results, stats } = auditAll(opts);

  if (opts.json) {
    process.stdout.write(JSON.stringify({ stats, results }, null, 2) + '\n');
  } else {
    process.stdout.write(formatTextReport({ results, stats }, opts) + '\n');
  }

  // Exit code precedence: parse error (2) > drift (1) > clean (0)
  if (stats.parseError > 0 || stats.specMissing > 0) process.exit(2);
  if (stats.drift > 0) process.exit(1);
  process.exit(0);
}

main();
