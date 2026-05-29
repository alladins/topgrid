# tw-grid Constraints — 인덱스

> 모든 tw-grid 에이전트는 본 INDEX + active 카테고리 파일을 세션 시작 전에 읽고 준수.
> SSoT 통합: [`policies/`](../policies/INDEX.md) (도메인) + [`_shared/`](../../policies/_shared/INDEX.md) (universal).

## 카테고리

| 파일 | 항목 |
|------|------|
| [00-meta.md](00-meta.md) | M-1 |
| [10-core.md](10-core.md) | C-1·C-3·C-4·C-5·C-11·C-12·C-15 → `_shared/` |
| [20-tanstack.md](20-tanstack.md) | C-2·C-7·C-16 → POL-TANSTACK |
| [30-compat.md](30-compat.md) | C-6·C-22·C-23 → POL-COMPAT |
| [40-bundle.md](40-bundle.md) | C-10·C-18·C-21 → POL-BUNDLE |
| [50-migration-stage.md](50-migration-stage.md) | C-8·C-13·C-17·C-19 → POL-MIG-STAGE |
| [60-doc-license.md](60-doc-license.md) | C-9·C-14·C-20·C-24·C-25 → POL-DOC-LIC |
| [70-spec-discipline.md](70-spec-discipline.md) | C-26·C-27·C-28·C-30·C-33·C-35·C-36 → POL-SPEC-DISC |
| [80-code-patterns.md](80-code-patterns.md) | C-29·C-31·C-32 (일회성 패턴 자체 유지) |
| [90-environment.md](90-environment.md) | C-34 (Worktree boundary, 일회성) |
| [HISTORY.md](HISTORY.md) | 출처 인용 사례 |

## Agent별 필독

| Agent | 의무 |
|-------|------|
| 모든 agent | INDEX + 00-meta + 10-core + `_shared/INDEX` |
| Spec Writer / Implementer | 전체 + [policies/INDEX](../policies/INDEX.md) |
| Coverage Verifier | 전체 + rubric + policies |
