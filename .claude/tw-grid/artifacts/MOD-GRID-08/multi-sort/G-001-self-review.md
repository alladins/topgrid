# Self-Review — MOD-GRID-08 / multi-sort / G-001

**Goal**: Shift+Click 다중 정렬 활성 + 정렬 우선순위 배지 (1/2/3) + Ctrl+Click 정렬 제거  
**결과**: 완료 (specify 1루프 / implement 2루프 / verify 2루프)  
**최종 점수**: specify 100/90 PASS · implement 100/90 PASS · verify 100/90 PASS  
**날짜**: 2026-05-14  
**작성자**: Self-Review Agent (tw-grid)

---

## 1. 루프 요약

| Stage | 루프 수 | 최종 점수 | 실패 항목 (1차) |
|-------|---------|----------|----------------|
| specify | 1 | 100 | — |
| implement | 2 | 100 | 없음 (B-01 보류, stories는 verify 피드백 후 추가) |
| verify | 2 | 100 | B-01 NO (Storybook story 파일 부재) |

---

## 2. 반복 실패 패턴 분석 (verify loop 2 발생 원인)

### 2-1. 무엇이 실패했는가

verify loop 1 점수: 75.0 / 90 FAIL  
실패 항목: B-01 "정렬 동작 — Storybook 또는 영향 사용처" → NO  
원인: `MultiSortGrid.stories.tsx` 파일이 implement 단계에서 생성되지 않았음.  
AC-007 (`C-25: Storybook story 1개`) 가 spec에 명시되어 있었음에도 implement agent가 stories 파일을 산출물 범위에서 누락.

### 2-2. 왜 implement loop 1에서 AC-007이 누락되었는가

implement-score.json A-05 증거를 보면: `"AC-007: source C-25... Storybook → 생성 확인 필요 (별도 Goal 없음)"` — implement agent가 AC-007 충족을 "별도 Goal"로 미뤄 두었다.

실제 spec goals.json AC-007 원문: `"C-25: Storybook story 1개 (다중 컬럼 정렬 + 배지 + Ctrl 제거 시나리오)"` — 별도 Goal이 아니라 이 G-001 자체의 인수 기준이다.

즉, implement agent가 AC-007을 "필수 산출물"이 아닌 "권장 / 후속 처리"로 잘못 분류하여 stories 파일 생성을 건너뛴 것이 근본 원인이다.

### 2-3. implement rubric이 이를 잡지 못한 이유

implement-rubric A-05 ("모든 AC 매핑") 에서 AC-007 항목을 YES로 처리했으나 증거가 `"생성 확인 필요"` — 즉 파일 실재를 실측하지 않고 "확인 예정"으로 처리한 soft YES였다.  
**결론**: implement rubric A-05가 파일 실재 증거(Glob/Read 결과)를 요구하지 않고 AC 나열만 확인했기 때문에 누락이 통과된 것이다.

### 2-4. verify 1차 피드백의 명확성 평가

verify loop 1 결과가 B-01 NO → 75/90 FAIL 으로 명확히 산출되었고, B-01 evidence에 파일 부재 사실이 명시되었다. 따라서 verify 1차 피드백 자체는 충분히 구체적이었다.  
문제는 피드백 발생 시점이 verify 단계였다는 것 — implement 단계에서 같은 체크를 했다면 루프가 1회 절감되었을 것이다.

---

## 3. 거버넌스 이슈: SPECIFY Agent의 범위 초과 (Overrun)

### 3-1. 현상

specify agent가 spec.md를 작성하면서 `implementFiles` 경로를 직접 정의하고 `decisions/` 섹션에 구현 결정(D1~D6)을 상세하게 기록했다. 이는 specify 고유 책임 내에 있다.

그러나 specify agent가 `spec.md Section 11.2` 에 구체적인 코드 템플릿(`useEffect`, `handleHeaderClick` 구현 예시)을 포함했다. 이로 인해 implement agent가 spec 코드 템플릿을 그대로 채택하는 경향이 발생했고, spec writer가 구현 방향을 사전 결정(pre-determine)한 셈이 되었다.

### 3-2. 거버넌스 위반 평가

C-15는 "메인 오케스트레이터는 직접 spec/code/score 작성 금지"를 규정하나, **specify agent가 implement 영역(구체 코드 템플릿)을 침범하는 경우**를 명시적으로 금지하지는 않는다. 이는 C-15의 공백(gap)이다.

실질적 결과: specify agent의 코드 템플릿이 implement agent의 판단 독립성을 잠식했고, "별도 Goal이 아님"이어야 할 AC-007 의미를 모호하게 할 여지를 만들었을 수 있다. 코드 템플릿이 AC-007에 대한 stories 코드 예시를 포함했다면 implement agent가 누락할 가능성이 낮았을 것이다.

---

## 4. AG Grid / Wijmo 카탈로그 추가 필요 여부

### 4-1. AG Grid 참조 필요성 (feature-gap-matrix.md §2 현황)

`referenceEvidence.R-A: "AG Grid Community Multi Column Sort — Shift+Click 동일 UX 패턴"`. AG Grid의 다중 정렬 UX는 이미 feature-gap-matrix.md §2에 수록되어 있으며, 본 G-001 spec 작성 시 참조 증거로 사용되었다.

카탈로그 추가 필요 여부: **보통 수준의 필요성**. 현재 feature-gap-matrix.md에서 AG Grid Multi Sort가 "Shift+Click" 동일 UX로만 기술되어 있다. 다음 항목이 추가되면 G-002(maxMultiSortColCount) 및 후속 Goal 작성 시 효율이 높아진다:

- AG Grid `multiSortKey` 설정 (default: `ctrl`) vs TanStack `isMultiSortEvent` 비교
- AG Grid 정렬 개수 제한 방식 (버전별 구현 차이)
- AG Grid `suppressMultiSort` 옵션 → TanStack `enableMultiSort: false` 대응

### 4-2. Wijmo 참조 필요성

`referenceEvidence.R-W: "Wijmo Multi-column sorting on-demand"`. Wijmo의 정렬 관련 UX는 이미 feature-gap-matrix.md §3에 수록되어 있다.

카탈로그 추가 필요 여부: **낮음**. 본 G-001/G-002 범위에서 Wijmo 정렬 제한 API(`maxGroupLevelCount` 유사 개념)는 이미 참조됐다. 추가적인 카탈로그 항목은 G-002 시작 전 필요 시 추가하는 것이 효율적.

---

## 5. 개선 권고

### 권고 (a) — implement-rubric A-05 강화: AC-007 류 "파일 산출물 AC"의 실재 검증 의무화

**현황**: A-05 "모든 AC 매핑"이 AC 항목의 논리적 나열만 확인하고, Storybook story 파일 같은 파일 산출물 AC는 파일 실재 증거를 요구하지 않는다.

**권고**: implement-rubric에 다음 요건 추가:
> A-05 "모든 AC 매핑" 검증 시, AC 항목이 파일 산출물을 요구하는 경우 (`C-25 Storybook story`, `README.md`, `CHANGELOG.md` 등) Glob 또는 Read 도구로 파일 실재를 확인한 결과를 evidence에 인용해야 한다. 파일 미존재 → 해당 AC NO → A-05 NO 처리.

**적용 대상 파일**: `.claude/tw-grid/rubrics/implement-rubric.md` (A-05 항목)

---

### 권고 (b) — verify-rubric B-01: "stories 파일 부재 → 즉시 NO" 강화 (현행 재확인)

**현황**: verify-rubric B-01이 이미 Storybook story 파일 실재를 요구하며, loop 1에서 올바르게 NO를 판정했다. 시스템은 정상 작동했다.

**권고**: verify-rubric B-01에 다음 주석을 추가하여 명확성 강화:
> B-01 평가 순서: (1) spec의 AC-00N `C-25` 항목에서 stories 파일명 확인 → (2) Glob으로 파일 실재 확인 → (3) 미존재 시 **즉시 NO, 다른 증거로 대체 불가**. 사용처 변경이 없더라도 stories 파일 자체가 산출물이므로 실재 검증은 필수.

현행 B-01 판정 로직은 올바르므로 이는 가독성/명확성 강화 권고이며 로직 변경이 아니다.

**적용 대상 파일**: `.claude/tw-grid/rubrics/verify-rubric.md` (B-01 항목 주석)

---

### 권고 (c) — constraints.md C-15 보강: Specify Agent의 구현 코드 템플릿 작성 금지 명문화

**현황**: C-15는 "메인 오케스트레이터는 직접 spec/code/score 작성 금지"를 규정하나, specify agent 내부에서 "구현 코드 템플릿(예시 useEffect, handleHeaderClick 함수 본문)"을 spec에 포함하는 행위는 별도로 제한되지 않는다.

**권고**: C-15에 다음 항목 추가:
> **Specify Agent 범위 제한**: specify agent가 생성하는 spec.md에는 다음을 포함할 수 있다:
> - API 시그니처 (interface, props, return type)
> - 사용 예시 (짧은 JSX 스니펫, `<Grid enableMultiSort />` 수준)
> - 구현 전략 결정 (decisions 섹션: 선택한 API, 파일 구조)
>
> **금지**: spec.md에 함수 본문 구현 코드 (10줄 이상의 로직 코드 블록). 구현 상세는 Implementer Agent 전권. Specify agent가 구현 코드를 선점하면 Implementer의 판단 독립성이 훼손되고 산출물 범위(AC) 누락을 가릴 수 있다.

**적용 대상 파일**: `.claude/tw-grid/constraints.md` (C-15 항목에 sub-section 추가)

---

## 6. 요약 및 직접 수정 범위

### 본 Self-Review가 권고하는 수정 대상 파일 목록

| 파일 | 권고 내용 | 우선순위 |
|------|----------|---------|
| `.claude/tw-grid/rubrics/implement-rubric.md` | A-05에 "파일 산출물 AC 실재 검증" 명시 | P0 — 동일 패턴 재발 방지 |
| `.claude/tw-grid/constraints.md` | C-15에 specify agent 코드 템플릿 금지 추가 | P1 — 거버넌스 공백 보완 |
| `.claude/tw-grid/rubrics/verify-rubric.md` | B-01 주석으로 "파일 부재 즉시 NO" 명확화 | P2 — 현행 로직 정상, 가독성만 |

### 직접 수정 불가 (본 임무 범위 밖)

위 파일들의 실제 편집은 본 Self-Review 보고서 범위 밖이다. 다음 세션 또는 `/tw-grid learn` 커맨드를 통해 적용 권장.

### G-002로의 교훈 이전

G-002 시작 전 다음을 확인할 것:
1. spec.md AC 중 파일 산출물 요구 항목 (`C-25 story`, `README` 등)을 implement agent prompt에 명시적으로 "필수 파일 생성 목록"으로 전달
2. implement Coverage Verifier에게 A-05 평가 시 파일 산출물 AC는 Glob 증거 필수임을 prompt에 명기
3. specify agent에게 "구현 코드 블록은 10줄 미만 API 예시에 한정" 제약 전달

---

**Self-Review 작성 완료: 2026-05-14**
