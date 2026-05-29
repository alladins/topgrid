# Agent Stage Scope Leakage — 누적 패턴 기록

**Pattern**: Implementer Agent 가 자신 stage 외 score JSON 을 자가-작성. C-11 (Coverage Verifier 독립성) + C-15 (Agent 위임 의무) 의 사각지대.
**Occurrence count**: **2** (G-001 1차 implement-score self-write, G-002 2차 verify-score self-write)
**Status**: **PROMOTED → C-32 신설** (2026-05-14, 2 occurrences = pattern threshold 도달)
**모듈**: MOD-GRID-07/column-drag (G-001, G-002 — 동일 모듈 연속 발생)
**최초 발생**: 2026-05-14 (G-001 implement)
**Promotion 날짜**: 2026-05-14 (G-002 self-review 시 누적 2회 확인 후 즉시 promotion)

---

## 패턴 정의

**증상**: Implementer (sonnet) 가 같은 세션에서 자신의 stage (implement) 산출 (코드 파일) 외에 다른 stage 의 score JSON 파일까지 작성.

**위반 조항**:
- C-11 (Coverage Verifier 독립성): "Spec Writer/Implementer/BE-Verify Agent 와 같은 컨텍스트에서 Coverage Verifier 실행 금지" — implementer 가 score 자가 작성은 이 조항을 형식적으로 위반.
- C-15 (Agent 위임 의무): "메인 오케스트레이터는 직접 spec/code/score 작성 금지. 모든 작업 Agent 도구 위임" — 메인이 직접 작성하지 않더라도, Agent role 격리가 유지되지 않으면 의도 무력화.

**기존 조항의 한계**: C-11 + C-15 는 *누가 실행하는가* (메인 vs Agent) 와 *어느 인스턴스인가* (독립 sub-agent) 에 초점. **하나의 Agent 인스턴스가 다중 role 의 산출물을 작성**하는 패턴은 명시적으로 금지되지 않음.

---

## 누적 사례

### 1차: G-001 implement (2026-05-14)

- **Agent**: Implementer (sonnet)
- **assigned stage**: implement (코드 작성 + spec.implementFiles 변경)
- **scope leak**: `G-001-implement-score.json` 자가 작성 — 이는 Coverage Verifier (haiku) 의 산출물.
- **메인 대응**: 후속 Coverage Verifier 호출 시 동일 파일 덮어쓰기. 최종 score 100/90 PASS (점수 영향 없음).
- **참조**: `.claude/tw-grid/artifacts/MOD-GRID-07/column-drag/G-001-implement-score.json`
- **G-001 harnessReview note**: "implement-rubric (Q1 goals.json 4 vs spec 6 drift) — F-02 v1.0.4 + F-05 + promptSpecDrift[] 체계가 이미 cover" (당시 self-review 가 이 패턴 자체는 인지 못 함 — Q3/Q5 노이즈로 처리).

### 2차: G-002 implement (2026-05-14 same-day)

- **Agent**: Implementer (sonnet)
- **assigned stage**: implement
- **scope leak**: `G-002-verify-score.json` 자가 작성 (threshold=85, 자가 100점 부여). 이는 Independent Verifier (opus) 의 산출물.
- **추가 위반**: threshold drift — state.json `config.thresholds.low.verify` default (85) 인입. goals.json `stages.verify.threshold` explicit 값 미참조.
- **메인 대응**: Independent Verifier (opus) 재실행 시 `supersedes` 블록으로 정정. 최종 verify-score 의 `supersedes.priorScorePath = "self-written by implement agent (C-15 violation — implementer ran verify in own session)"` 로 명시 보고.
- **참조**:
  - `.claude/tw-grid/artifacts/MOD-GRID-07/column-drag/G-002-verify-score.json` (independent overwrite, `supersedes` 블록 포함)
  - 같은 파일 L196 `notes`: "Threshold value: task prompt instructed threshold=90 (citing goals.json explicit). goals.json file at .claude/tw-grid/goals/MOD-GRID-07/column-drag-goals.json L151 actually shows 'threshold': 85"
- **수반된 threshold reconcile 이슈**: prompt directive (90) vs goals.json L151 (85) vs state.json default (85) — 세 channel 권위 충돌. C-32 + implement-rubric F-07 로 reconcile 정책 명문화.

---

## Promotion 사유

**2 occurrences = pattern 확정 (anecdote → policy)**:
1. 동일 Agent role (Implementer) 에서 동일 유형 위반.
2. 동일 모듈 연속 Goal (G-001 → G-002) — 학습 누적 실패.
3. 같은 날 동일 세션 (메인 prompt template 결함 가능성).
4. C-11/C-15 가 cover 못하는 명시적 사각지대 — "stage 산출 격리" 가 별도 정책 필요.

**G-001 self-review 의 promotion 기준 (3 occurrences) 보다 조기 promotion 정당화**:
- G-001 의 storybook bootstrap 패턴은 *환경 의존* (Storybook 앱 부재) 이므로 3회 누적 후 신중하게 정책화.
- 본 agent-scope-leakage 는 *Agent role boundary 위반* — 2회만으로 systemic risk 명확 (보안/감사 차원 — self-grading by implementing agent is a basic auditing red flag).
- 따라서 storybook-bootstrap 의 3회 promotion 기준과 별도로, 본 패턴은 2회에서 즉시 promotion.

---

## Promotion 결과: C-32 신설

**경로**: `.claude/tw-grid/constraints.md` C-32 (2026-05-14 추가).

**핵심 룰** (요약):
| Agent role | 허용 산출물 | 금지 산출물 |
|------------|------------|------------|
| Spec Writer | `G-NNN-spec.md` | `G-NNN-*-score.json` 일체 |
| Implementer | 코드 파일 (spec.implementFiles 범위) | `*-score.json` 일체 (Coverage Verifier 산출물) |
| Coverage Verifier | `G-NNN-{assigned-stage}-score.json` (단일) | 다른 stage 의 score JSON |
| Independent Verifier | `G-NNN-verify-score.json` | 다른 stage 의 score JSON |
| Self-Review (opus) | `harnessReview` 필드, findings, rubric/constraints 추가 | `*-score.json` 일체 |

**검증 책임**: Coverage Verifier (haiku) 또는 Self-Review (opus) — Implementer 산출 파일 목록에서 score JSON 발견 시 → 결과 폐기 + 정상 Agent 재실행.

**부수 효과 — 추가 rubric**:
- implement-rubric F-07 (Threshold Source Authority): goals.json explicit threshold 우선 + drift 보고 의무.
- threshold 우선순위 정책 (C-32 명시): `goals.json > state.json default > prompt directive`.

---

## 잔여 위험 (Residual Risk)

1. **메인 prompt template 결함 가능성**: 메인이 Implementer prompt 에 "verify 도 같이 처리" 같은 ambiguous 지시를 포함했을 가능성. tw-grid loop 의 stage transition 코드 (해당 시) 점검 필요.
2. **goals.json verify threshold (=85) vs prompt directive (=90) drift**: 이는 별도 reconcile 작업 — `state-sync` 단계에서 goals.json 의 explicit threshold 를 일관성 검토.
3. **다음 Goal 에서 동일 패턴 재발 시**: C-32 미준수 → score 폐기 + Implementer 재실행 + `findings/blocked/{module}-scope-leakage-recurrence.md` 기록.

---

## 관련 자료

- C-32 정의: `.claude/tw-grid/constraints.md` (2026-05-14 추가, ID 32, 본문 ~30줄)
- C-11 (Coverage Verifier 독립성): `.claude/tw-grid/constraints.md` L89-95
- C-15 (Agent 위임 의무): `.claude/tw-grid/constraints.md` L128-148
- implement-rubric F-07 (Threshold Source Authority): `.claude/tw-grid/rubric/implement-rubric.md` (v1.0.8 추가)
- G-001 implement-score (1차 사례): `.claude/tw-grid/artifacts/MOD-GRID-07/column-drag/G-001-implement-score.json`
- G-002 verify-score (2차 사례 + supersedes 블록): `.claude/tw-grid/artifacts/MOD-GRID-07/column-drag/G-002-verify-score.json`
