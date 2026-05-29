# tw-grid Agents — 인덱스

> tw-grid.md (오케스트레이터) 가 호출하는 agent prompt + 공통 boilerplate.

## 카탈로그

| 파일 | 역할 | 모델 |
|------|------|------|
| [_preamble.md](_preamble.md) | 사전 읽기 + Windows + 위반 우선순위 + Worktree | — |
| [_return-contract.md](_return-contract.md) | 반환 형식 + JSON 공통 필드 + Implementer/Verifier 분리 + 산식 자가검증 | — |
| [spec-writer.md](spec-writer.md) | SPECIFY: Spec + Plan 작성 + Truth Table Discipline | high opus / medium-low sonnet |
| [implementer.md](implementer.md) | IMPLEMENT: 파일 수정/생성 + Functional Wiring Audit + Pure helpers | high opus / medium-low sonnet |
| [verifier.md](verifier.md) | VERIFY: 5축 채점 + 시각 회귀 + 번들 크기 + 라이선스 | opus |
| [coverage-verifier.md](coverage-verifier.md) | Specify/Implement 단계 채점 (독립 Agent) + 산식 자가검증 | haiku |

## Self-Review (Reviewer Agent)

별도 파일 없음. tw-grid.md Self-Review 본문 참조 (opus).

## SSoT 참조 룰

agent prompt 본문은 [`policies/`](../policies/INDEX.md) + [`_shared/`](../../policies/_shared/INDEX.md) + [`constraints/`](../constraints/INDEX.md) 의 룰을 *링크로 인용*. 본문 복사 금지.
