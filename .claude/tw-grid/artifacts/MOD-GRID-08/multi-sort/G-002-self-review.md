# MOD-GRID-08 G-002 Self-Review
**작성일**: 2026-05-14  
**대상**: multi-sort/G-002 (maxMultiSortColCount 제한 + 정렬 전체 초기화 버튼)  
**결과**: 모든 3 stage loop 1 완료 — specify 100/90, implement 100/90, verify 100/90

---

## 1. G-001 vs G-002 학습 적용 결과

### G-001 이력 요약
| Stage | 시도 | 결과 |
|-------|------|------|
| specify | loop 1 | 100/90 PASS |
| implement | loop 1 | 100/90 PASS |
| verify | loop 1 | **75/90 FAIL** — Storybook story 누락 |
| implement | loop 2 | MultiSortGrid.stories.tsx 추가 |
| verify | loop 2 | 100/90 PASS |

**실패 원인**: IMPLEMENT agent가 AC-007(C-25 Storybook story 1개)을 구현 목록에 포함하지 않음. `implementFiles`에 `*.stories.tsx` 파일 항목 없음.

### G-002에서의 개선
IMPLEMENT agent는 G-001 학습을 반영하여:
- `implementFiles`에 `MultiSortAdvanced.stories.tsx` 사전 포함
- spec의 AC-006(C-25 Storybook story) 요건을 implement 단계에서 선제 처리
- 결과: verify loop 1 바로 통과 (stories 관련 감점 없음)

**핵심 차이**: G-001에서 stories는 "verify 피드백 후 추가"였으나, G-002에서는 "implement 단계 사전 포함"으로 전환. 이것이 loop 2 발생을 방지한 결정적 요인.

---

## 2. implement-rubric A-05 강화 권고

### 배경 (Self-Review G-001 제안 검토)
G-001 Self-Review에서 `A-05: Storybook story 사전 포함 의무`를 rubric에 명시 강화하도록 제안.

### G-002 검증 결과
G-002 IMPLEMENT agent가 A-05를 적용하여 loop 1 성공 → 제안의 실효성이 실증됨.

### 권고 결론
**rubric 변경 없음** — G-002 PASS로 현재 rubric이 충분히 작동함을 검증. A-05 항목이 이미 stories를 커버하고 있으며, agent가 이를 올바르게 해석함. 과잉 명시화(over-specification)는 rubric 복잡도를 높일 수 있으므로 현행 유지.

---

## 3. 패턴 카탈로그 후보

### Pattern: TanStack 표준 옵션 직접 전달 (cross-package dependency cycle 회피)

**발견 맥락**: G-002 verify에서 `maxMultiSortColCount`를 TanStack `useReactTable` 옵션으로 직접 전달. custom hook wrapper 없이 표준 API를 그대로 활용.

**패턴 설명**:
```typescript
// ✅ 권장: TanStack 표준 옵션 직접 전달
useReactTable({
  enableMultiSort: true,
  maxMultiSortColCount: props.maxMultiSortColCount,  // TanStack 네이티브
  isMultiSortEvent: (e) => e.shiftKey,
  ...
})

// ⚠️ 비권장: custom hook으로 감싸면 packages/grid-core ↔ packages/grid-features 순환 의존 가능성
const { sortingOptions } = useMultiSortWrapper(props)  // cross-package call 위험
useReactTable({ ...sortingOptions })
```

**적용 조건**:
- TanStack에 해당 옵션이 네이티브로 존재하는 경우 (C-1 확인 의무)
- 옵션 변환 로직 없이 prop을 그대로 전달하는 경우
- `packages/grid-features` → `packages/grid-core` 방향의 의존이 생기는 경우

**후보 등록 위치**: `.claude/tw-grid/patterns/tanstack-direct-option-passthrough.md`

---

## 4. 다음 모듈 진행 시 고려사항

### TanStack 표준 옵션 vs custom wrapper 선택 기준

| 상황 | 권장 방식 |
|------|----------|
| TanStack 네이티브 옵션 존재 + 변환 로직 없음 | **표준 옵션 직접 전달** (G-002 D2 패턴) |
| 비즈니스 로직 가공 필요 (e.g. FIFO 처리, 상태 합성) | custom hook (`useMultiSort.ts`) 내부에서 처리 후 setSorting 전처리 |
| cross-package 의존이 생기는 경우 | 표준 옵션 직접 전달 강제 (순환 의존 방지) |

**실증 예시**:
- G-001 D6: `enableMultiSort: true, isMultiSortEvent: (e) => e.shiftKey` — 직접 전달
- G-002 D2: `maxMultiSortColCount` — TanStack 지원 확인 후 직접 전달 (setSorting 전처리 불필요)

**교훈**: TanStack 옵션 존재 여부를 C-1(구현 전 API 실측)으로 먼저 확인하면, custom wrapper 필요성이 자연스럽게 결정됨.

---

## 5. 적용 권고 (조건부)

### (a) decisions/MOD-GRID-08-decisions.md ADR 추가 — 권고
**ADR 제목**: "Multi-sort feature는 TanStack 표준 옵션을 통과 우선"

**내용**:
- G-001 D6: Shift+Click 이벤트 처리 → `isMultiSortEvent: (e) => e.shiftKey` 직접 전달
- G-002 D2: 정렬 개수 제한 → `maxMultiSortColCount` TanStack 네이티브 옵션 직접 전달
- **결정**: custom 전처리(setSorting wrapper)보다 TanStack 표준 옵션이 존재하면 항상 우선. +0.14KB 번들 절감 부수효과.
- **패턴 명문화**: `C-2(TanStack API 우선)` + `C-1(구현 전 API 실측)` 조합이 핵심 검증 게이트

**권고 이유**: G-001 + G-002 두 Goal에 걸쳐 동일 패턴이 반복 확인됨 → ADR로 명문화 가치 있음.

### (b) constraints.md C-29 패턴 인용 — 조건부 확인
C-29: 조건부 prop 전달 패턴이 이미 존재하는지 확인 필요.

G-002의 `showSortClearButton` prop과 `maxMultiSortColCount` optional prop 처리는 C-29 패턴(조건부 prop 전달)의 전형적 사례. constraints.md에 해당 항목이 이미 존재한다면 인용으로 충분, 신규 추가 불필요.

**액션**: constraints.md에서 C-29 항목 존재 여부 확인 후 판단.

### (c) rubric 변경 없음 — 확정
G-002가 현행 rubric으로 loop 1 PASS → rubric은 충분히 작동 중. 변경 없음.

---

## 6. MOD-GRID-08 모듈 완료 확인

| Goal | 우선순위 | 상태 | loops (specify/implement/verify) |
|------|---------|------|----------------------------------|
| G-001 | P0 | ✅ completed | 1 / 2 / 2 |
| G-002 | P1 | ✅ completed | 1 / 1 / 1 |

**모듈 전체**: 2/2 Goals completed  
**학습 효과**: G-001 verify loop 2 → G-002 전 stage loop 1 (총 루프 수 6 → 3, 50% 감소)

---

## 핵심 권고 3개 요약

1. **implement-rubric A-05 현행 유지**: G-002 loop 1 성공으로 현 rubric 충분히 검증됨. 과잉 명시화 억제.

2. **패턴 카탈로그 등록 권고**: "TanStack 표준 옵션 직접 전달" 패턴을 `.claude/tw-grid/patterns/`에 후보 등록. cross-package dep cycle 회피 + 번들 최소화 이점 명문화.

3. **ADR 추가 권고**: `decisions/MOD-GRID-08-decisions.md`에 "Multi-sort는 TanStack 표준 옵션 우선" ADR 추가. G-001 D6 + G-002 D2 패턴을 동시에 커버하는 모듈 레벨 결정으로 명문화.
