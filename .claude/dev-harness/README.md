# topgrid dev-harness

`@topgrid` **신규 기능 개발용** 노우하우-축적 하네스. 설계 근거·전체 규약은
[`docs/internal/DEV-HARNESS-DESIGN.md`](../../docs/internal/DEV-HARNESS-DESIGN.md) (SSoT).

## 루프 (모듈 1개당)
```
0. context-load   — *-INDEX + MASTER §3/§6 + state.json 로드 (매 run 시작, 필수)
1. reuse-gate      — PATTERNS-INDEX·MASTER §3 에서 유사 기능 조회 (80%+ → 재사용)
2. specify         — §6 Goal/AC + patterns/constraints + competitive-analysis → specs/MOD-GRID-XX.md
3. implement       — Goal 1개씩, 매 Goal 후 tsc+build+constraints
4. verify          — drift 0 + ANTIPATTERNS-INDEX 전수 대조(시그니처 grep) + verify rubric + build → §5.2 gap
5. CAPTURE (필수)  — lesson(signature) → promotion(N=2 자동) → 패턴/AP/C 갱신 + 인덱스
                     + MASTER §6→§3 이관(6컬럼, PAT-/AP- cross-link) + state.json metrics
6. release (선택)  — minor bump + npm + meta facade
```

## 완료 게이트 (§5.1)
`state.json.<mod>.done_gate` 의 `lesson` · `matrix_row` · `index_updated` 가 **모두 truthy** 여야
모듈 `done` + §6→§3 이관 허용. 하나라도 false → 모듈은 §6 에 `구현중`(시각적 미완료).

## weight-class
- **Lite**(MIT 편의, 예 grid-sizing): 간이 spec, rubric 점수 생략 — **단 capture·매트릭스 갱신은 유지**.
- **Full**(Pro 복합, 예 grid-pro-pivot/sheet): 4-페이즈 전부 + rubric 점수 + ADR.

## 스토어
| 디렉토리 | 내용 | 인덱스 |
|---|---|---|
| `patterns/` | 검증된 재사용 패턴 (PAT-NNN) | `PATTERNS-INDEX.md` |
| `anti-patterns/` | 실수 카탈로그 (AP-NNN, 탐지 grep) | `ANTIPATTERNS-INDEX.md` |
| `constraints/` | 규칙 (C-NNN, POL-*) | `CONSTRAINTS-INDEX.md` |
| `decisions/` | ADR + ID-LEDGER | — |
| `rubrics/` | specify/implement/verify 게이트 | — |
| `lessons/` | 교훈 원자료(signature, promotion 후보) | — |
| `specs/` | 진행 중 정식 spec (loop 가 생성, 미리 만들지 않음) | — |

운영자 = 이 어시스턴트(self-policing, 파일이 곧 규칙). slash-command 복원 시 동일 게이트 자동화.
