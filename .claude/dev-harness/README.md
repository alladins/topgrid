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

### ★ 진입 게이트 복원 (2026-06-06, WORKFLOW-INTEGRITY-AUDIT 시정 B/C)
MOD-28(§6 로드맵)·MOD-34(specs)부터 앞단이 인라인으로 폐기됐던 이력 → 차기 모듈은 **implement 진입 전 필수**:
- **(B) specify 산출물**: `specs/MOD-GRID-XX.md` **파일 존재** + MASTER **§6.1 행 + §6.2 스케치 등재**. 인라인 진행 금지
  (설계 근거가 대화에만 남으면 추적성 0). Lite 도 간이 spec 파일은 작성.
- **(C) rubric 채점 영속화**: Full 모듈은 `rubrics/specify.md` 8항목을 **점수로 spec 또는 done_gate 에 기록**
  (과거: 게이트 정의됐으나 어느 모듈도 점수 미영속화 = defined-but-never-evidenced). Lite=체크만.

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
