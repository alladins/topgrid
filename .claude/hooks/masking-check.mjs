// PostToolUse(Edit|Write) 훅 — 경쟁사 브랜드 마스킹 재노출 자동 검출.
// 정책: "AG Grid"→"XX Grid", "Wijmo"→"xxxx" (FlexGrid/FlexSheet 는 허용).
// 예외 경로: docs/internal/*.private.md(실명 허용 내부 분석), .claude/hooks/(자기 자신), gitignored 대장.
// exit 2 = stderr 가 Claude 에게 피드백됨(편집은 이미 적용됨 → 즉시 수정 유도).
import { readFileSync, existsSync } from 'node:fs';

let input = '';
try {
  input = readFileSync(0, 'utf8');
} catch {
  process.exit(0);
}
let fp = '';
try {
  fp = JSON.parse(input)?.tool_input?.file_path || '';
} catch {
  process.exit(0);
}
if (!fp) process.exit(0);

const p = fp.replace(/\\/g, '/');
// 예외: 내부 실명 분석(.private.md), 훅 자신, 정책 서술 파일(CLAUDE.md 는 마스킹 규칙 원문을 정의),
//       대장/키, 저장소 밖(메모리 등)
if (
  /\.private\.md$/.test(p) ||
  /\/\.claude\/hooks\//.test(p) ||
  /TWGRID\/CLAUDE\.md$/.test(p) ||
  /ledger\.csv$|\.private\.key$/.test(p) ||
  !/TWGRID/i.test(p)
) process.exit(0);
if (!existsSync(fp)) process.exit(0);

let text = '';
try {
  text = readFileSync(fp, 'utf8');
} catch {
  process.exit(0);
}

// FlexGrid/FlexSheet 는 정책상 허용 — 패턴이 애초에 안 잡힘.
const re = /\b(AG[\s-]?Grid|ag-grid|Wijmo)\b/gi;
const hits = [...new Set((text.match(re) || []).map((s) => s.trim()))];
if (hits.length === 0) process.exit(0);

console.error(
  `[masking-check] ★경쟁사 브랜드 재노출 검출: ${hits.join(', ')} in ${fp}\n` +
  `정책: "AG Grid"→"XX Grid", "Wijmo"→"xxxx" (CLAUDE.md). 지금 즉시 마스킹으로 수정할 것.\n` +
  `(실명이 필요한 내부 분석이면 docs/internal/*.private.md 로 옮기고 gitignore 확인)`
);
process.exit(2);
