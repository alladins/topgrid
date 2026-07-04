// PreToolUse(Bash) 훅 — 파괴 명령·보호 파일 유출 차단 (exit 2 = 실행 차단, 사유가 Claude 에 피드백).
// 최소주의: 과차단은 하네스 신뢰를 깎는다 — 실제 사고 벡터만 막는다.
import { readFileSync } from 'node:fs';

let cmd = '';
try {
  cmd = JSON.parse(readFileSync(0, 'utf8'))?.tool_input?.command || '';
} catch {
  process.exit(0);
}
if (!cmd) process.exit(0);

const RULES = [
  {
    re: /git\s+push\b[^|&;]*(--force\b|-f\b)/,
    msg: 'force push 금지 — 이력 파괴. 필요하면 사용자에게 직접 요청할 것.',
  },
  {
    re: /git\s+add\b[^|&;]*(\.private\.key|ledger\.csv|\.private\.md)/,
    msg: '보호 파일(git add 대상에 개인키/발급대장/private 분석) — 절대 커밋 금지(CLAUDE.md).',
  },
  {
    re: /git\s+add\b[^|&;]*(\s-f\b|--force\b)/,
    msg: 'git add --force 금지 — gitignore 우회는 보호 파일(개인키·대장) 유출 벡터.',
  },
  {
    re: /rm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)[a-zA-Z]*\s+("?\/"?\s*$|~\/?\s*$|[A-Za-z]:[\\/]?\s*$)/,
    msg: '루트/홈 재귀 삭제 차단.',
  },
  {
    re: /curl\b[^|]*\|\s*(ba|z)?sh\b/,
    msg: '원격 스크립트 파이프 실행(curl|sh) 금지 — 내려받아 검토 후 실행할 것.',
  },
];

for (const r of RULES) {
  if (r.re.test(cmd)) {
    console.error(`[guard] 차단: ${r.msg}\n명령: ${cmd.slice(0, 200)}`);
    process.exit(2);
  }
}
process.exit(0);
