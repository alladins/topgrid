// SessionStart 훅 — stdout 이 세션 컨텍스트로 주입된다.
// source=startup|clear: 세션 시작 프로토콜(A3) — git 상태·HANDOFF §0·하네스 카운터 요약(동적 상태).
// source=compact: 컴팩션 후 핵심 규칙 재주입(유실 방지 — CLAUDE.md 정적 로드와 별개로 동적 상태 복원).
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

let source = 'startup';
try {
  source = JSON.parse(readFileSync(0, 'utf8'))?.source || 'startup';
} catch { /* 기본값 유지 */ }

const sh = (c) => {
  try { return execSync(c, { encoding: 'utf8', timeout: 8000 }).trim(); } catch { return '(확인 실패)'; }
};

const CORE = [
  '★게이트: npm publish·git push origin = 사용자 승인 필수(문서사이트 배포는 자율).',
  '★마스킹: "AG Grid"→"XX Grid", "Wijmo"→"xxxx" (FlexGrid/FlexSheet 유지). *.private.md 만 예외.',
  '★보호 파일: .private.key·ledger.csv·*.private.md 커밋 금지.',
];

if (source === 'compact') {
  // 컴팩션 직후 — 짧게, 유실되기 쉬운 동적 상태만.
  const ahead = sh('git rev-list --count origin/main..HEAD 2>nul || git rev-list --count origin/main..HEAD');
  console.log('[세션 컨텍스트 재주입 — 컴팩션 후]');
  CORE.forEach((l) => console.log(l));
  console.log(`미푸시 커밋: ${ahead}건. 진행 작업은 SESSION-HANDOFF.md §0 확인.`);
  process.exit(0);
}

// startup | clear — 세션 시작 프로토콜(A3)
console.log('[TWGRID 세션 시작 요약]');
console.log('--- git (최근 3 + 미푸시) ---');
console.log(sh('git log --oneline -3'));
console.log('미푸시: ' + sh('git rev-list --count origin/main..HEAD') + '건 | 작업트리: ' + (sh('git status --porcelain') ? '변경 있음' : 'clean'));

const handoff = 'docs/internal/SESSION-HANDOFF.md';
if (existsSync(handoff)) {
  const head = readFileSync(handoff, 'utf8').split('\n');
  const s0 = head.findIndex((l) => /^## 0\./.test(l));
  if (s0 >= 0) {
    console.log('--- SESSION-HANDOFF §0 (최신 세션) ---');
    console.log(head.slice(s0, s0 + 6).join('\n'));
  }
}

const state = '.claude/dev-harness/state.json';
if (existsSync(state)) {
  try {
    const j = JSON.parse(readFileSync(state, 'utf8'));
    const mods = Object.keys(j.modules || {});
    console.log(`--- 하네스 ---\n모듈 ${mods.length}개 추적 | 자산 카운터: ${JSON.stringify(j.counters || {})}`);
  } catch { /* skip */ }
}
console.log('--- 핵심 규칙 ---');
CORE.forEach((l) => console.log(l));
process.exit(0);
