# TWGRID (topgrid) — 프로젝트 지침

## 인간 게이트 (예외 없음)
- **npm publish · git push origin = 사용자 승인 후에만.** 문서사이트 배포(`bash apps/docs/deploy.sh`)는 자율.

## ★경쟁사 마스킹 (발행물·문서·코드·커밋메시지 전부)
- "AG Grid" → "XX Grid", "Wijmo" → "xxxx". **FlexGrid/FlexSheet 는 유지.** 재노출 금지.
- 예외: `docs/internal/*.private.md` (gitignore 된 내부 분석 전용 — 실명 허용).

## 절대 커밋 금지 (gitignored — `git add -f` 금지)
- `scripts/license/.private.key`(서명 개인키) · `scripts/license/ledger.csv`(고객 대장) · `docs/internal/*.private.md`

## 빌드·테스트 (Windows)
- 전체 빌드: `pnpm -r --filter "@topgrid/*" --workspace-concurrency=1 build`
- 전체 테스트: `pnpm -r --filter "@topgrid/*" test` · 타입: `pnpm --filter <pkg> exec tsc --noEmit`
- 문서사이트: `pnpm --dir apps/docs run build:site` → `bash apps/docs/deploy.sh` · 방문 통계: `bash apps/docs/stats.sh`
- Windows 함정: `/tmp` 사용 금지(레포 내 경로로) · 포트 6006 불가(9009–9017 사용) · `pnpm publish` 는 positional 형(`--dir` 금지)

## 발행 (게이트 통과 후)
- `pnpm publish packages/<pkg> --no-git-checks --access public`. **grid-core 변경 = 13패키지 lockstep**(exact-pin 캐스케이드).
- 라이선스 키 발급: `node scripts/license/license.mjs sign …` (대장 자동 기록, `scripts/license/README.md`).

## 하네스 (세션 시작 시 context-load)
- `docs/internal/SESSION-HANDOFF.md` §0(최신 세션) + `.claude/dev-harness/state.json` counters + `*-INDEX.md` 를 로드.
- 모듈 개발 = `.claude/dev-harness/` 4-페이즈 루프(`docs/internal/DEV-HARNESS-DESIGN.md`). **capture 는 등급 무관 필수.**
- **P7 역방향 압력**: 규칙 추가 전 — 훅/도구로 강제 가능하면 산문으로 쓰지 않는다. 기존 규칙 1개 삭제/통합을 먼저 검토.
- verify rubric 채점은 **작업한 에이전트가 하지 않는다**(fresh-context 서브에이전트, 스코프=정확성·명시 요구사항 gap만).

## 컴팩션 시 보존 (요약에 반드시 유지)
- 인간 게이트 2종 · 마스킹 규칙 · 미푸시 커밋 수 · 진행 중 작업 목록.
