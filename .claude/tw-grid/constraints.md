# tw-grid Constraints — Redirect

> **이 파일은 stub 입니다.** 2026-05-16 SSoT 리팩토링으로 내용이 카테고리별로 분리됨.

## 신규 위치

| 카테고리 | 파일 |
|---------|------|
| **전체 색인** | [`constraints/INDEX.md`](constraints/INDEX.md) |
| 메타원칙 (M-1) | [`constraints/00-meta.md`](constraints/00-meta.md) |
| 핵심 (C-1·C-3·C-4·C-5·C-11·C-12·C-15 → _shared) | [`constraints/10-core.md`](constraints/10-core.md) |
| TanStack + 경쟁 라이브러리 (C-2·C-7·C-16) | [`constraints/20-tanstack.md`](constraints/20-tanstack.md) |
| Backward compat + peerDeps + semver (C-6·C-22·C-23) | [`constraints/30-compat.md`](constraints/30-compat.md) |
| 가상화 + 번들 (C-10·C-18·C-21) | [`constraints/40-bundle.md`](constraints/40-bundle.md) |
| 사용처 점진 + 시각 회귀 (C-8·C-13·C-17·C-19) | [`constraints/50-migration-stage.md`](constraints/50-migration-stage.md) |
| 라이선스 + 문서 + ADR (C-9·C-14·C-20·C-24·C-25) | [`constraints/60-doc-license.md`](constraints/60-doc-license.md) |
| Spec 권위 + Score 자가검증 (C-26·C-27·C-28·C-30·C-33·C-35·C-36) | [`constraints/70-spec-discipline.md`](constraints/70-spec-discipline.md) |
| 코드 패턴 (C-29·C-31·C-32, 일회성) | [`constraints/80-code-patterns.md`](constraints/80-code-patterns.md) |
| 환경 (C-34 Worktree) | [`constraints/90-environment.md`](constraints/90-environment.md) |
| 출처 인용 | [`constraints/HISTORY.md`](constraints/HISTORY.md) |

## SSoT 추가

5계층에 중복 인용되던 룰 추출:
- **Cross-harness universal**: [`.claude/policies/_shared/`](../policies/_shared/INDEX.md) (tw-mail/tw-harness/tw-grid 공유)
- **tw-grid 도메인**: [`policies/`](policies/INDEX.md)
  - POL-TANSTACK, POL-COMPAT, POL-BUNDLE, POL-MIG-STAGE, POL-DOC-LIC, POL-SPEC-DISC

## Agent 사전 읽기 위치

| Agent | 사전 읽기 |
|-------|-----------|
| 모든 agent | [`agents/_preamble.md`](agents/_preamble.md) + [`constraints/INDEX.md`](constraints/INDEX.md) + [`policies/INDEX.md`](policies/INDEX.md) + [`_shared/INDEX.md`](../policies/_shared/INDEX.md) |

## 본 stub 유지 이유

옛 경로 (`constraints.md`) 참조 깨지지 않게 함. 안정 운영 후 삭제 가능.
