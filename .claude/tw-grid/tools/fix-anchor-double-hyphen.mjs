#!/usr/bin/env node
//
// fix-anchor-double-hyphen — markdown link target 의 anchor 안에서 `--` (double hyphen) 를
//                            `-` 로 normalize 하는 1회성 fix 도구.
//
// ─── 원인 ────────────────────────────────────────────────────────────
// GitHub-flavored markdown slug 규칙: heading 의 `+` / `—` (em-dash) / `/` 같은
// 구분자가 제거된 자리에 인접한 공백 2개는 **단일** hyphen 으로 collapse 됨.
// 작성자가 `--` (double hyphen) 로 추정하면 anchor 매칭 실패 → 링크 클릭 시
// 파일 최상단으로 이동 (탐색 시간 손실, 정합성 신호 오류).
//
// ─── 적용 범위 (link target 한정) ────────────────────────────────────
// `](path.md#...--...)` 패턴 안의 `--` 만 치환. anchor 외부의 정상 `--` 표기
// (예: 본문의 `--dry-run` CLI 옵션, 강조 ` -- `) 는 보존.
//
// ─── 사용 (이 프로젝트) ──────────────────────────────────────────────
//   node .claude/tw-grid/tools/fix-anchor-double-hyphen.mjs --dry       # 영향 미리보기
//   node .claude/tw-grid/tools/fix-anchor-double-hyphen.mjs             # 적용
//   node .claude/tw-grid/tools/fix-anchor-double-hyphen.mjs --scope tw-mail
//                                                                       # 다른 harness 만
//
// ─── 다른 세션 / harness 활용 안내 ───────────────────────────────────
// 본 도구는 tw-grid 가 처음 작성했으나 **cross-harness reusable** —
// 모든 harness (tw-grid / tw-mail / tw-harness) 의 SSoT 문서에 동일 typo
// 패턴이 발생할 수 있음. 활용 시나리오:
//
// 1. tw-mail/tw-harness 세션에서 자기 harness 안의 anchor 정합성 점검:
//      node .claude/tw-grid/tools/fix-anchor-double-hyphen.mjs --scope tw-mail --dry
//
// 2. SSoT 리팩토링 직후 정합성 일괄 정리 (마지막 줄 NG 0건 확인):
//      node .claude/tw-grid/tools/fix-anchor-double-hyphen.mjs --scope all --dry
//
// 3. 같은 폴더의 verify-{v1.1-refs,ssot-internal}.mjs 와 묶어 CI 회귀 차단:
//      verify → 누락 detect → fix-anchor → verify 재실행 → 0 보장
//
// ─── 안전성 ──────────────────────────────────────────────────────────
// - 정규식이 `]( ... .md# ... --  ... )` 패턴 안에만 매칭 → 본문 텍스트 안전
// - 다중 `--` 케이스는 fixed-point loop 로 모두 정리 (safety=10 cap)
// - dry-run 모드로 영향 라인 수 사전 확인 가능
// - cross-session 격리 의무 (tw-mail/tw-harness 세션이 다른 harness 영역 write 금지)
//   → `--scope` 로 자기 harness 만 정리. all 은 신중히.
//

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const dry = argv.includes('--dry');
const scopeArg = argv.includes('--scope') ? argv[argv.indexOf('--scope') + 1] : 'tw-grid';

// scope → 스캔할 디렉토리/파일 매핑
const SCOPES = {
  'tw-grid': [
    '.claude/commands/tw-grid.md',
    '.claude/tw-grid/agents',
    '.claude/tw-grid/policies',
    '.claude/tw-grid/constraints',
    '.claude/tw-grid/rubric',
  ],
  'tw-mail': [
    '.claude/commands/tw-mail.md',
    '.claude/tw-mail/agents',
    '.claude/tw-mail/policies',
    '.claude/tw-mail/constraints',
  ],
  'tw-harness': [
    '.claude/commands/tw-harness.md',
    '.claude/tw-harness/agents',
    '.claude/tw-harness/policies',
    '.claude/tw-harness/constraints',
  ],
  '_shared': ['.claude/policies/_shared'],
  'all': [
    '.claude/commands',
    '.claude/tw-grid',
    '.claude/tw-mail',
    '.claude/tw-harness',
    '.claude/policies/_shared',
  ],
};

if (!SCOPES[scopeArg]) {
  console.error(`Unknown scope: ${scopeArg}`);
  console.error(`Available: ${Object.keys(SCOPES).join(', ')}`);
  process.exit(2);
}

// scope 가 tw-grid 가 아니면 _shared 도 항상 포함 (cross-harness 참조 정합 위해)
const roots = scopeArg === 'all' || scopeArg === '_shared'
  ? SCOPES[scopeArg]
  : [...SCOPES[scopeArg], '.claude/policies/_shared'];

function walkMd(p, out = []) {
  if (!existsSync(p)) return out;
  const s = statSync(p);
  if (s.isFile() && p.endsWith('.md')) out.push(p);
  else if (s.isDirectory()) {
    for (const entry of readdirSync(p)) walkMd(join(p, entry), out);
  }
  return out;
}

const files = roots.flatMap(r => walkMd(r));

let totalFiles = 0;
let totalReplacements = 0;
const report = [];

for (const file of files) {
  const original = readFileSync(file, 'utf8');
  let updated = original;
  // link target `](...md#...--...)` 안에서만 `--` → `-`. 반복 적용으로 `--...--` 케이스 처리.
  let safety = 10;
  while (safety-- > 0) {
    const before = updated;
    updated = updated.replace(/(\]\([^)]*\.md#[^)]*?)--([^)]*\))/g, '$1-$2');
    if (updated === before) break;
  }
  if (updated !== original) {
    // 라인 단위 diff 로 정확한 치환 건수 계산
    const origLines = original.split('\n');
    const updLines = updated.split('\n');
    let lineChanges = 0;
    for (let i = 0; i < origLines.length; i++) {
      if (origLines[i] !== updLines[i]) lineChanges++;
    }
    report.push({ file, lineChanges });
    totalFiles++;
    totalReplacements += lineChanges;
    if (!dry) writeFileSync(file, updated, 'utf8');
  }
}

console.log('=== anchor double-hyphen normalize ===\n');
console.log(`scope: ${scopeArg}`);
console.log(`mode:  ${dry ? 'DRY RUN' : 'APPLIED'}`);
console.log(`scanned files: ${files.length}`);
console.log(`changed files: ${totalFiles}`);
console.log(`changed lines: ${totalReplacements}\n`);
if (report.length) {
  console.log('--- 변경 파일 ---');
  for (const r of report) {
    console.log(`  ${r.file}  (lines: ${r.lineChanges})`);
  }
} else {
  console.log('✓ no double-hyphen anchor found.');
}
