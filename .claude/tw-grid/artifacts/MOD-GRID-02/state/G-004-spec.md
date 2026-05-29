# G-004 Spec — `useGridState` resetState() / resetSection(key) helper + clearSelectionKey 외부 트리거

**Goal**: MOD-GRID-02 / G-004
**Stage**: SPECIFY
**Model**: sonnet (medium)
**Rubric**: specify-rubric v1.0.5
**Threshold**: 90 (medium tier)
**Created**: 2026-05-14
**DependsOn**: MOD-GRID-02/G-001 (완료), G-002 (완료), G-003 (완료)

---

## ★ 사전 결정 표 (D#) — G-01 v1.0.4 cross-consistency 기준

| ID | 결정 내용 |
|----|-----------|
| D1 | **C-28 경로 확인**: goals.json G-004 `implementFiles[0]` = `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/useGridState.ts` (올바른 monorepo prefix) → **C-28 정정 불필요**. types.ts 는 goals.json 에 미포함이나 C-27 spec authority 기준으로 MODIFY 확정 (D2) |
| D2 | **파일 변경: NEW 0 + MODIFY 2 = 2파일** — MODIFY: `useGridState.ts` (resetState/resetSection useCallback 추가 + clearSelectionKey useEffect wiring), `types.ts` (GridState 인터페이스에 `resetState`/`resetSection` 추가 + UseGridStateOptions에 `clearSelectionKey?: string \| number` 추가). 신규 helper 파일 분리 불필요 (함수 2개, useGridState 내부 정의로 충분) |
| D3 | **resetSection 시그니처**: `(key: GridStateKey \| GridStateKey[]) => void` — single key 또는 배열 Union. 중복 key 배열은 멱등 (Set으로 dedup). TypeScript에서 존재하지 않는 key는 컴파일 타임 차단 |
| D4 | **clearSelectionKey 트리거 구현**: `useEffect(() => { if (clearSelectionKey !== undefined) setRowSelection({}); }, [clearSelectionKey])` — AggridTable L88-92 패턴 흡수. `undefined` 초기값은 트리거 안 함 (mount 시 불필요한 reset 방지) |
| D5 | **controlled mode에서의 reset**: controlled 모드에서 `resetState()` / `resetSection()` 호출 시 → 각 해당 키의 `onChange`를 통해 `onStateChange` 호출 (외부 핸들러가 controlled state 갱신 책임). useControllableState setter 호출 → onChange 발화 경로 동일 |
| D6 | **initialState ref 안정성**: `useRef`로 mount 시 초기값 capture (이후 변경 무시). React 표준 패턴 — `resetState()`가 렌더 중 변경된 prop을 따라 reset 대상이 바뀌는 것 방지 |
| D7 | **번들 extrapolation 차단**: goals.json 참조치 "+1 KB" 기준. 실측은 implement 직후 size-limit 게이트 의무 (G-001 0.12 KB, G-002 0.23 KB, G-003 실측 기반 보간 금지) |
| D8 | **A-04 강화 적용**: `affectedUsageFiles` = **0개** literal 명시 (goals.json 확인: `"affectedUsageFiles": []`). Section 8.1 및 Section 1에 "0개" literal 명시 의무 |

---

## Section 1 — 현황 및 배경

### 1.1 L0: 현 구현 파일 + 코드 발췌

**파일**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/useGridState.ts`
**(G-001~G-003 구현체, Read 직접 확인 — 234줄)**

```ts
// useGridState.ts L216-234 (현재 return — resetState/resetSection 없음)
return {
  sorting,
  columnFilters,
  rowSelection,
  pagination,
  columnPinning,
  columnOrder,
  columnSizing,
  columnVisibility,
  setSorting: setSorting as OnChangeFn<SortingState>,
  setColumnFilters: setColumnFilters as OnChangeFn<ColumnFiltersState>,
  setRowSelection: setRowSelection as OnChangeFn<RowSelectionState>,
  // ... (8 setter)
};
// ^^^ resetState / resetSection 미구현 (G-004 구현 대상)
```

**현황**: `useGridState` 반환 객체에 reset 헬퍼 없음. 사용처에서 검색 버튼 클릭 시 8개 setter를 각각 호출해야 하는 수작업 패턴 발생.

**L0 출처**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/useGridState.ts` L216-234 (직접 Read 확인)

**types.ts GridState 인터페이스**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` L670-706 (직접 Read 확인)

```ts
// types.ts L670-706 (현재 GridState — reset 멤버 없음)
export interface GridState<_TData = unknown> {
  sorting: SortingState;
  // ... 8 state
  setSorting: OnChangeFn<SortingState>;
  // ... 8 setter
  // resetState / resetSection 없음 (G-004 추가 대상)
}
```

**UseGridStateOptions 현재**: `types.ts` L608-655 — `initialState?`, `state?`, `onStateChange?`, `debounceMs?` 존재. `clearSelectionKey?` 없음 (G-004 추가 대상).

### 1.2 L1: TanStack v8 API 참조

TanStack v8은 `useReactTable`에서 state를 직접 reset하는 유틸을 제공하지 않음. `table.resetSorting()`, `table.resetColumnFilters()` 등 table 레벨 reset 메서드 존재하나 `useReactTable` hook의 반환값 기반 — `useGridState`는 독립 hook이므로 setter를 직접 호출하는 방식으로 reset 구현.

**L1 출처**: G-001-spec.md Section 1.2 + G-002-spec.md Section 1.2 tanstack-api-inventory.md §2.2 (8개 state 키)

### 1.3 L2: 기존 구현 — GridStateValues, GridStateKey, UseGridStateOptions

**파일**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` (직접 Read)

```ts
// types.ts L579-587 (GridStateKey — resetSection 파라미터 타입)
export type GridStateKey =
  | 'sorting'
  | 'columnFilters'
  | 'rowSelection'
  | 'pagination'
  | 'columnPinning'
  | 'columnOrder'
  | 'columnSizing'
  | 'columnVisibility';
```

```ts
// types.ts L553-570 (GridStateValues — resetState가 복원할 대상 타입)
export interface GridStateValues<_TData = unknown> {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  rowSelection: RowSelectionState;
  pagination: PaginationState;
  columnPinning: ColumnPinningState;
  columnOrder: ColumnOrderState;
  columnSizing: ColumnSizingState;
  columnVisibility: VisibilityState;
}
```

**L2 출처**: `types.ts` L553-587 (직접 Read 확인)

### 1.4 L3: 영향 사용처

**affectedUsageFiles = 0개** (A-04 강화 의무 literal 명시)

`goals.json` G-004 `"affectedUsageFiles": []` 직접 확인. resetState/resetSection은 GridState 반환 객체의 추가 멤버 — 기존 spread 패턴을 파괴하지 않음 (C-6 호환성). 사용처 마이그레이션 불필요.

### 1.5 R-A: AG Grid clearSelectionKey 패턴

**출처**: `D:/project/topvel_project/TOMIS/publish/src/components/common/aggrid/AggridTable.tsx` L88-92 (직접 Read 확인)

```ts
// AggridTable.tsx L87-92 (clearSelectionKey 외부 트리거 패턴)
// 외부에서 clearSelectionKey가 바뀌면 선택 해제
useEffect(() => {
  if (clearSelectionKey !== undefined) {
    setSelectedRowId(null);
  }
}, [clearSelectionKey]);
```

**패턴 해석**: `clearSelectionKey`는 `any` 타입 prop. 값 자체가 아닌 "변경 감지"가 목적 — 새 검색 실행 시 부모가 `clearSelectionKey` prop을 변경하면 그리드가 자동으로 선택 해제. 우리 `useGridState({ clearSelectionKey })` 옵션으로 흡수 — `rowSelection: {}` 리셋 트리거로 변환.

**R-A 출처**: `publish-aggrid-analysis.md` §3 (L62-63), §9 (Table 행 4) + AggridTable.tsx L88-92 직접 Read 확인

### 1.6 R-W: Wijmo CollectionView.refresh()

`CollectionView.refresh()`는 뷰를 강제 재산정하는 메서드. 우리 `resetState()`와 개념적으로 유사하나 구현 방식 다름 (C-16 — 코드 차용 금지, 패턴 참조만).

**migrationImpact**: `medium` (goals.json G-004 확인)

---

## Section 2 — API 계약

### 2.1 GridState 추가 멤버

```ts
// types.ts GridState<TData> 추가 멤버 (G-004)
export interface GridState<_TData = unknown> {
  // ... (G-001~G-003 기존 멤버 16개 보존) ...

  /**
   * 모든 state를 initialState로 복원 (G-004 AC-001).
   *
   * - uncontrolled 모드: `initialState` 제공 시 해당 키 값으로, 미제공 시 각 키의 기본값으로 복원
   *   (`sorting: []`, `columnFilters: []`, `rowSelection: {}`, `pagination: { pageIndex: 0, pageSize: 10 }`,
   *    `columnPinning: {}`, `columnOrder: []`, `columnSizing: {}`, `columnVisibility: {}`)
   * - controlled 모드 키: `onStateChange` 호출 → 외부 핸들러가 controlled state 갱신 책임
   *
   * @see G-004-spec.md Section 6 — EC-05 controlled mode 처리
   */
  resetState: () => void;

  /**
   * 특정 state 키(들)를 initialState로 복원 (G-004 AC-002).
   *
   * @param key - 단일 키 또는 키 배열 (중복 무시 — 멱등)
   *
   * @example
   * ```ts
   * resetSection('columnFilters');                       // 단일
   * resetSection(['columnFilters', 'sorting']);          // 다중
   * resetSection(['pagination', 'pagination']);          // 중복 → 1회 reset (멱등)
   * ```
   *
   * @see G-004-spec.md Section 6 — EC-02, EC-03
   */
  resetSection: (key: GridStateKey | GridStateKey[]) => void;
}
```

### 2.2 UseGridStateOptions 추가 멤버

```ts
// types.ts UseGridStateOptions<TData> 추가 (G-004)
export interface UseGridStateOptions<TData = unknown> {
  // ... (G-001~G-003 기존 필드 보존) ...

  /**
   * 외부 트리거로 `rowSelection`을 자동 reset하는 옵션 (G-004 AC-003).
   *
   * AggridTable `clearSelectionKey` 패턴 흡수 (R-A: AggridTable.tsx L88-92).
   * 이 값이 변경될 때마다 `rowSelection: {}` 으로 자동 reset.
   * `undefined` 초기값은 mount 시 트리거 안 함.
   *
   * @example
   * ```ts
   * // 검색 폼 submit 시 선택 초기화
   * const [searchKey, setSearchKey] = useState(0);
   * const state = useGridState({ clearSelectionKey: searchKey });
   * const handleSearch = () => {
   *   setSearchKey((k) => k + 1); // clearSelectionKey 변경 → rowSelection 자동 reset
   *   fetchData(formValues);
   * };
   * ```
   *
   * @remarks
   * - `string | number`로 타입 제한 (AggridTable의 `any` 개선 — C-4 strict)
   * - 값 내용보다 "변경" 자체가 목적 — number 카운터 또는 string 타임스탬프 권장
   */
  clearSelectionKey?: string | number;
}
```

### 2.3 사용 예시 (≥2개)

**예시 1: 검색 버튼 → resetState()**
```tsx
const state = useGridState<Slip>({
  initialState: {
    sorting: [{ id: 'date', desc: true }],
    pagination: { pageIndex: 0, pageSize: 20 },
  },
});

// 검색 폼 onSubmit
const handleSearch = () => {
  state.resetState();  // initialState로 복원 — pageIndex=0, sorting=[{id:'date',desc:true}]
  fetchData(formValues);
};
```

**예시 2: 필터 클리어 버튼 → resetSection()**
```tsx
const state = useGridState<User>();

// 필터만 클리어, 정렬/페이지는 유지
const handleClearFilter = () => {
  state.resetSection('columnFilters');
};

// 필터 + 정렬 동시 클리어
const handleClearAll = () => {
  state.resetSection(['columnFilters', 'sorting']);
};
```

**예시 3: clearSelectionKey 트리거**
```tsx
const [searchKey, setSearchKey] = useState(0);
const state = useGridState<Item>({ clearSelectionKey: searchKey });

const handleSearch = () => {
  setSearchKey((k) => k + 1); // 변경 → rowSelection: {} 자동 reset
  fetchData(form.getValues());
};
```

---

## Section 3 — 기존 사용처 대응표

| 기존 패턴 | 신규 API | 비고 |
|-----------|---------|------|
| `setSorting([]); setColumnFilters([]); setPagination({ pageIndex:0, pageSize:10 }); setRowSelection({});` 등 8개 setter 수동 호출 | `resetState()` 1줄 | 사용처 마이그레이션 선택적 (0개 기존 의존, 신규 기능) |
| AG Grid `<AggridTable clearSelectionKey={searchKey} />` 패턴 | `useGridState({ clearSelectionKey: searchKey })` | R-A 패턴 흡수. `string \| number` 타입 안전 |
| 없음 (미구현) | `resetSection('pagination')` — 페이지만 0으로 복원 | 신규 |

---

## Section 4 — 호환성 정책

- **breaking**: `false` — `resetState`/`resetSection`은 `GridState` 인터페이스 추가 멤버. 기존 spread 패턴 (`<Grid {...state} data columns />`) 완전 보존 (TanStack은 미지정 prop 무시).
- **clearSelectionKey**: `UseGridStateOptions` 선택적 옵션 — 기존 `useGridState()` / `useGridState({initialState, state, onStateChange, debounceMs})` 호출 모두 무파괴.
- **deprecation**: 없음 (신규 기능 추가 — C-6, C-23 준수)
- **semver**: 0.x 단계 — minor bump (C-23)

---

## Section 5 — AC 출처 태그

| AC ID | 내용 | 출처 |
|-------|------|------|
| AC-001 | `resetState(): void` — initialState로 모든 state 복원 | `C-4` (TypeScript strict), L0 (현 구현 분석) |
| AC-002 | `resetSection(key: GridStateKey \| GridStateKey[]): void` — 키별 reset | `C-4`, L2 (GridStateKey 타입) |
| AC-003 | AggridTable clearSelectionKey 패턴 흡수 — `useGridState({ clearSelectionKey })` | `R-A` (AggridTable.tsx L88-92) |
| AC-004 | Storybook 1개 — 검색 버튼 → resetState 예 | `C-25` (Public API 문서화 의무) |
| AC-005 | vitest 단위 테스트 ≥ 3 시나리오 통과 — (a) uncontrolled `resetState()` 시 모든 state가 `initialState`(또는 defaultValues)로 복원, (b) controlled mode (`state.sorting` 제공) 에서 `resetState()` 호출 시 sorting setter 가 onChange 만 호출하고 내부 state 변경 없음 (G-002 useControllableState 동작 확인), (c) `clearSelectionKey` 변경 시 mount 시점이 아닌 후속 변경부터 `rowSelection: {}` 자동 reset 발화 | `C-12` (build 검증), L2 (GridStateValues 기본값) |

---

## Section 6 — 엣지 케이스

### EC-01: initialState 미제공 시 resetState()
**상황**: `useGridState()` (옵션 없음) 상태에서 `resetState()` 호출.
**동작**: 각 키의 기본값으로 복원 — `sorting: []`, `columnFilters: []`, `rowSelection: {}`, `pagination: { pageIndex: 0, pageSize: 10 }`, `columnPinning: {}`, `columnOrder: []`, `columnSizing: {}`, `columnVisibility: {}`.
**구현**: `initialStateRef.current`가 `undefined`면 `defaultValues` 객체 사용.

### EC-02: 존재하지 않는 GridStateKey 전달
**상황**: TypeScript 컴파일 단계에서 차단 — `GridStateKey` union에 없는 문자열은 type error.
**런타임 동작**: 런타임에서도 switch/map에 해당 키 없으면 no-op (JS에서 타입 우회 시 방어).
**구현**: 주석으로 "알 수 없는 key는 무시" 명시.

### EC-03: 중복 key 배열 전달 — resetSection(['pagination', 'pagination'])
**동작**: `Set<GridStateKey>`으로 dedup 후 각 1회만 reset. 멱등 처리.
**구현**: `const keys = [...new Set(Array.isArray(key) ? key : [key])]` 패턴.

### EC-04: clearSelectionKey mount 시 초기화 방지
**상황**: `useGridState({ clearSelectionKey: 0 })`로 초기값 제공.
**동작**: mount 시 `useEffect`가 최초 실행되나 reset 안 함 — `undefined` 비교 방식 대신 초기값 비교 회피가 어려우므로 `useEffect`의 "첫 render에서는 skip" 패턴(ref flag) 사용.
**구현**:
```ts
const isFirstRender = useRef(true);
useEffect(() => {
  if (isFirstRender.current) { isFirstRender.current = false; return; }
  if (clearSelectionKey !== undefined) setRowSelection({});
}, [clearSelectionKey]);
```
→ 불필요한 mount reset 방지, 이후 변경 시만 트리거.

### EC-05: controlled mode에서 resetState() 호출
**상황**: `useGridState({ state: { sorting: externalSorting } })` — sorting이 controlled.
**동작**: controlled 키(sorting)는 `onChange` 경유 → `onStateChange` 호출 → 외부 핸들러가 controlled state 갱신 책임. uncontrolled 키는 내부 setState 직접 호출.
**의도**: controlled 아키텍처 존중 (G-002 D2 규칙 연장). `resetState()`는 "초기화 의도를 전달"하는 역할, 실제 변경은 외부 책임.

### EC-06: clearSelectionKey가 빠르게 연속 변경 (ms 단위)
**상황**: 빠른 연속 검색 클릭 (clearSelectionKey: 1 → 2 → 3 빠른 변경).
**동작**: React의 `useEffect` batching에 따라 중간 값은 스킵될 수 있음. 최종 변경값에 대한 reset만 보장. 이는 React batching 표준 동작 — 각 변경에 대한 reset이 필요하면 counter 방식으로 충분 (최종 reset만 필요하기 때문).

---

## Section 7 — 구현 대상 파일 (NEW/MODIFY)

G-01 v1.0.4: D# 표 D2 (NEW 0 + MODIFY 2) ↔ 본문 일치 검증.

### 최종 implementFiles 표

| # | 경로 | NEW/MODIFY | 변경 내용 |
|---|------|-----------|---------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/useGridState.ts` | MODIFY | `resetState` / `resetSection` useCallback 추가 + `clearSelectionKey` useEffect wiring + `initialStateRef` useRef 추가 |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` | MODIFY | `GridState<TData>` 인터페이스에 `resetState` / `resetSection` 추가 + `UseGridStateOptions<TData>`에 `clearSelectionKey?` 추가 |

**집계**: NEW 0 + MODIFY 2 = **2파일**

> **E-06 cross-check**: 본문에 "재결정", "변경 대상", "대체", "수정함" 키워드 없음. 최종 표와 Section 11 모순 없음.

---

## Section 8 — Preflight

### 8.1 영향 사용처
**0개** (literal 명시 — A-04 강화 의무, D8)

`goals.json` G-004 `"affectedUsageFiles": []` 직접 확인. `resetState`/`resetSection`은 `GridState` 추가 멤버 — 기존 spread 호환, 마이그레이션 의무 사용처 없음.

C-8 (6개 이상 동시 변경 금지), C-17 (시각 회귀 medium 의무) — 사용처 0개이므로 N/A.
C-19 (점진 ≤5/Goal) — 영향 사용처 0개이므로 N/A.

### 8.2 무파괴 검증
- `GridState<TData>` 인터페이스 추가 멤버 — 기존 `{ sorting, columnFilters, ..., setSorting, ... }` spread는 그대로 동작 (추가 key는 TanStack `useReactTable` options에서 무시됨)
- `UseGridStateOptions<TData>` 선택적 필드 추가 (`clearSelectionKey?`) — 기존 options 객체 무파괴
- TypeScript strict: `GridState` 추가 멤버는 기존 구조 분해 할당 코드에 영향 없음

### 8.3 점진
G-004=0 (사용처 0개). C-19 적용 불필요.

### 8.4 롤백 전략
`useGridState.ts`와 `types.ts` revert (git revert 1 commit) → G-001~G-003 상태로 복원.
추가 멤버이므로 삭제 시 사용처가 0개 — breaking 발생 없음.

### 8.5 번들 영향 (D7 — extrapolation 차단)
- goals.json 참조치: `+1 KB` (gzipped, `packages/grid-core`, limit 30 KB)
- **실측 의무**: implement 직후 `size-limit` 측정 게이트 (ADR-MOD-GRID-00-010 §"extrapolation 금지" — G-003 self-review D7)
- 현재 누적: G-001~G-003 실측 합산 (implement 단계에서 확인). limit 30 KB 내 여유 예상.
- `resetState`/`resetSection`: `useCallback` 2개 + `useRef` 1개 + `useEffect` 1개 — 매우 소규모.

---

## Section 9 — 의존성

G-004는 신규 외부 dependency 없음.
- `useControllableState` (G-002 구현, 내부) — 각 setter 호출에 사용
- `useDebouncedCallback` (G-003 구현, 내부) — G-004는 사용 안 함 (reset은 즉시 동기)
- C-9/C-20 ADR 의무: 신규 외부 library 없음 → 불필요

---

## Section 10 — 사용자 여정

### 10.1 개발자 (5단계)
1. `const { resetState, resetSection } = useGridState({ initialState })`로 훅 호출
2. 검색 폼 `onSubmit` → `resetState()` → 모든 state가 `initialState`로 복원됨
3. 필터 클리어 버튼 → `resetSection('columnFilters')` → columnFilters만 `[]`로 복원
4. 페이지 변경 후 `resetSection('pagination')` → `pageIndex: 0` 복원
5. 다중 reset — `resetSection(['columnFilters', 'sorting'])` → 두 키 동시 복원

### 10.2 최종 사용자
N/A — 내부 hook API. UI 효과는 그리드 state 초기화로 나타나나 직접 인터랙션 없음.

---

## Section 11 — 구현 계획

### 11.0 imports 확장 (Implementer 주의)

`useGridState.ts` 현재 import: `import { useRef } from 'react';` (L20 직접 Read 확인).
G-004 추가 hook (`useEffect`, `useCallback`) 사용 → import 를 다음으로 확장:

```ts
import { useCallback, useEffect, useRef } from 'react';
```

`types.ts` 는 `GridStateKey` 가 같은 파일 내 이미 정의 (L601-609 직접 Read 확인) — `GridState` / `UseGridStateOptions` 추가 멤버에 `GridStateKey` 참조 시 별도 import 불필요.

### 11.1 파일별 변경 Before/After

**`types.ts` — GridState<TData> 추가 멤버**

Before (L670-706 발췌):
```ts
export interface GridState<_TData = unknown> {
  // ... 8 state + 8 setter
  setColumnVisibility: OnChangeFn<VisibilityState>;
  // ← 여기까지 (reset 멤버 없음)
}
```

After:
```ts
export interface GridState<_TData = unknown> {
  // ... 8 state + 8 setter (보존)
  setColumnVisibility: OnChangeFn<VisibilityState>;

  // ─── G-004: reset helpers ───
  /**
   * 모든 state를 initialState로 복원 (G-004 AC-001).
   * controlled 키는 onStateChange 경유 → 외부 핸들러 갱신 책임 (EC-05).
   */
  resetState: () => void;

  /**
   * 특정 state 키(들)를 initialState로 복원 (G-004 AC-002).
   * 배열 전달 시 중복 key는 무시 (멱등, EC-03).
   */
  resetSection: (key: GridStateKey | GridStateKey[]) => void;
}
```

**`types.ts` — UseGridStateOptions<TData> 추가 필드**

After (기존 `debounceMs?` 아래 추가):
```ts
export interface UseGridStateOptions<TData = unknown> {
  // ... initialState, state, onStateChange, debounceMs (보존) ...

  // ─── G-004: clearSelectionKey (R-A: AggridTable.tsx L88-92) ───
  /**
   * 외부 트리거로 rowSelection을 자동 reset (G-004 AC-003).
   * 값 변경 시마다 rowSelection: {} 로 reset. undefined = 비활성.
   * string | number 타입 강제 (AggridTable any 개선 — C-4).
   */
  clearSelectionKey?: string | number;
}
```

**`useGridState.ts` — 내부 추가**

Before (L95-234 발췌 핵심):
```ts
export function useGridState<TData = unknown>(
  options?: UseGridStateOptions<TData>,
): GridState<TData> {
  const snapshotRef = useRef<GridStateValues<TData>>(null!);
  // ... debounce, 8 useControllableState
  snapshotRef.current = { sorting, columnFilters, ... };
  return { sorting, ..., setSorting, ... };
  // ← reset helpers 없음
}
```

After (추가 코드):
```ts
export function useGridState<TData = unknown>(
  options?: UseGridStateOptions<TData>,
): GridState<TData> {
  // ─── G-004: initialState ref (mount 시 1회 capture, D6) ───
  // useRef 초기화: options?.initialState를 mount 시 고정.
  // 이후 options.initialState 변경은 무시 (resetState의 "복원 대상"이 렌더마다 바뀌면 혼란).
  const initialStateRef = useRef<Partial<GridStateValues<TData>>>(
    options?.initialState ?? {}
  );

  // ... (기존 snapshotRef, debounce, 8 useControllableState — 보존) ...

  // ─── G-004: clearSelectionKey useEffect (D4, EC-04) ───
  const clearSelectionKey = options?.clearSelectionKey;
  const isFirstClearRender = useRef(true);
  useEffect(() => {
    if (isFirstClearRender.current) {
      isFirstClearRender.current = false;
      return;
    }
    if (clearSelectionKey !== undefined) {
      setRowSelection({});
    }
  }, [clearSelectionKey]); // setRowSelection은 useControllableState 반환 — stable ref

  // ─── G-004: defaultValues (initialState 미제공 시 각 키 기본값) ───
  const defaultValues: GridStateValues<TData> = {
    sorting: [],
    columnFilters: [],
    rowSelection: {},
    pagination: { pageIndex: 0, pageSize: 10 },
    columnPinning: {},
    columnOrder: [],
    columnSizing: {},
    columnVisibility: {},
  };

  // ─── G-004: resetState (AC-001, D5) ───
  const resetState = useCallback(() => {
    const init = initialStateRef.current;
    setSorting(init.sorting ?? defaultValues.sorting);
    setColumnFilters(init.columnFilters ?? defaultValues.columnFilters);
    setRowSelection(init.rowSelection ?? defaultValues.rowSelection);
    setPagination(init.pagination ?? defaultValues.pagination);
    setColumnPinning(init.columnPinning ?? defaultValues.columnPinning);
    setColumnOrder(init.columnOrder ?? defaultValues.columnOrder);
    setColumnSizing(init.columnSizing ?? defaultValues.columnSizing);
    setColumnVisibility(init.columnVisibility ?? defaultValues.columnVisibility);
  }, [setSorting, setColumnFilters, setRowSelection, setPagination,
      setColumnPinning, setColumnOrder, setColumnSizing, setColumnVisibility]);

  // ─── G-004: resetSection (AC-002, D3, EC-02, EC-03) ───
  const resetSection = useCallback(
    (key: GridStateKey | GridStateKey[]) => {
      const keys = [...new Set(Array.isArray(key) ? key : [key])];
      const init = initialStateRef.current;
      for (const k of keys) {
        switch (k) {
          case 'sorting':       setSorting(init.sorting ?? defaultValues.sorting); break;
          case 'columnFilters': setColumnFilters(init.columnFilters ?? defaultValues.columnFilters); break;
          case 'rowSelection':  setRowSelection(init.rowSelection ?? defaultValues.rowSelection); break;
          case 'pagination':    setPagination(init.pagination ?? defaultValues.pagination); break;
          case 'columnPinning': setColumnPinning(init.columnPinning ?? defaultValues.columnPinning); break;
          case 'columnOrder':   setColumnOrder(init.columnOrder ?? defaultValues.columnOrder); break;
          case 'columnSizing':  setColumnSizing(init.columnSizing ?? defaultValues.columnSizing); break;
          case 'columnVisibility': setColumnVisibility(init.columnVisibility ?? defaultValues.columnVisibility); break;
          // 알 수 없는 key는 무시 (EC-02 런타임 방어 — TypeScript가 compile time 차단)
        }
      }
    },
    [setSorting, setColumnFilters, setRowSelection, setPagination,
     setColumnPinning, setColumnOrder, setColumnSizing, setColumnVisibility],
  );

  // ... (기존 snapshotRef 갱신 — 보존) ...

  return {
    // ... (기존 8 state + 8 setter — 보존) ...
    resetState,    // G-004
    resetSection,  // G-004
  };
}
```

### 11.2 구현 순서

1. **`types.ts` MODIFY** → `GridState<TData>`에 `resetState`/`resetSection` 추가 + `UseGridStateOptions<TData>`에 `clearSelectionKey?` 추가
   - 검증: `npx tsc --noEmit` 0 errors (타입 인터페이스만 추가 — 구현 없이 컴파일 통과)

2. **`useGridState.ts` MODIFY** → `initialStateRef` useRef 추가 + `clearSelectionKey` useEffect + `defaultValues` 상수 + `resetState` useCallback + `resetSection` useCallback + return 객체에 추가
   - 검증: `npx tsc --noEmit` 0 errors + vitest 단위 테스트 통과 + size-limit 측정 게이트 (D7)

3. **Storybook story** → `packages/grid-core/src/useGridState.stories.tsx` (또는 기존 story 파일) — 검색 버튼 → resetState 시나리오 1개 (AC-004)
   - 검증: Storybook build 통과

### 11.3 위험 요소

| 위험 | 등급 | 완화 |
|------|------|------|
| `initialStateRef` mount 후 options 변경 시 stale | medium | useRef 의도적 고정 (D6) — JSDoc에 "이후 변경 무시" 명시 |
| `resetState` useCallback deps: setter 8개 | low | useControllableState setter는 내부 stable ref — deps 변경 없음 |
| `clearSelectionKey` useEffect: mount 시 불필요한 reset | medium | `isFirstClearRender` ref flag로 방지 (EC-04) |
| controlled mode에서 resetState 동작 혼란 | low | JSDoc + spec EC-05에 명확히 문서화 |
| `defaultValues` 객체가 매 render 재생성 | low | `useCallback` deps에 미포함 — `initialStateRef.current` 경유로 안정 |

---

## Section 12 — 검증 계획

### 12.1 단위 테스트 (vitest) — AC-005 게이트

다음 3개는 AC-005 필수 시나리오 (Section 5 AC-005 a/b/c 와 1:1 매핑):
- **(a) uncontrolled resetState**: `useGridState({ initialState: { sorting: [...], pagination: {pageIndex:0,pageSize:20} } })` → 임의 setSorting/setPagination 호출로 state 변경 → `resetState()` → 결과가 `initialState` 와 일치 (defaultValues fallback 도 별도 케이스로 검증)
- **(b) controlled mode resetState — onChange only**: `useGridState({ state: { sorting: externalSorting }, onStateChange: spy })` → `resetState()` 호출 → `spy` 가 `sorting` key 로 호출됨 + 내부 sorting 값이 externalSorting 그대로 (외부 갱신 책임 확인 — G-002 useControllableState `isControlled` 분기 동작)
- **(c) clearSelectionKey trigger**: 초기 `clearSelectionKey: 0` 으로 mount → 사전에 `setRowSelection({ '0': true })` 호출 → 초기 mount 에서는 reset 미발생 확인 → `clearSelectionKey: 1` rerender → rowSelection `{}` 로 reset 확인 (EC-04 isFirstClearRender 동작 검증)

추가 시나리오 (AC-002 + EC 보강 — AC-005 필수 아니나 권장):
- `resetSection('columnFilters')`: columnFilters만 reset, 나머지 불변
- `resetSection(['columnFilters', 'sorting'])`: 두 키만 reset, 다른 6 키 불변
- `resetSection(['pagination', 'pagination'])`: pagination 1회만 reset (Set dedup, EC-03)
- `clearSelectionKey` 빠른 연속 변경 (0→1→2 react batch): **최종 reset 만 보장** 확인 (EC-06 — 중간 값은 React batching 표준에 따라 skip 가능)

### 12.2 시각 회귀 (C-13, C-17)
`migrationImpact: medium` → 시각 회귀 의무. 그러나 사용처 0개이므로 기존 Storybook story (다른 Grid story) 외관 영향 없음. Storybook AC-004 story 신규 추가 후 Chromatic 확인.

### 12.3 빌드 검증 (C-12)
- `npx tsc --noEmit` 0 errors (D7 게이트)
- `tsup build` 또는 monorepo build 통과
- `size-limit` 실측 — 30 KB 이내 확인 (D7 의무)

---

## Section 13 — 상용 제품화

- **패키지**: `packages/grid-core` (MIT 라이선스 — F-02 N/A)
- **라이선스**: MIT 보존 (C-24 준수 — 신규 파일 없음, 기존 파일 MODIFY)
- **문서 계획 (C-25)**:
  - Storybook story 1개 (`AC-004` — 검색 버튼 → resetState 시나리오)
  - JSDoc: `resetState`, `resetSection`, `clearSelectionKey` 각 JSDoc 작성 (Section 2.1/2.2 코드 블록 포함)
  - Docusaurus 페이지: 기존 `useGridState` API reference에 `resetState`/`resetSection`/`clearSelectionKey` 항목 추가 (G-004 범위 또는 별도 PR)
- **peerDependencies (C-22)**: 변경 없음 — `react`, `@tanstack/react-table` 기존 peer 유지
- **semver**: 0.x 단계 minor bump (C-23 — breaking 없음, 신규 API 추가)

---

## 메타게이트 자가 검증 (H-01/H-02/H-03)

### H-01: referenceEvidence 경로 실재
| 경로 | 타입 | 상태 |
|------|------|------|
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/useGridState.ts` | L0 | 직접 Read 확인 — 234줄 |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` | L2 | 직접 Read 확인 — 707줄 |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/useControllableState.ts` | L2(내부) | 직접 Read 확인 — 127줄 |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/useDebouncedCallback.ts` | L2(내부) | 직접 Read 확인 — 91줄 |
| `D:/project/topvel_project/TOMIS/publish/src/components/common/aggrid/AggridTable.tsx` | R-A | 직접 Read 확인 — L88-92 clearSelectionKey |
| `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-aggrid-analysis.md` | R-A | 직접 Read 확인 — §3, §9 |
| `D:/project/topvel_project/TOMIS/.claude/tw-grid/goals/MOD-GRID-02/state-goals.json` | L3 | 직접 Read 확인 — G-004 affectedUsageFiles: [] |

### H-02: implementFiles 경로 합리성
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/useGridState.ts` — monorepo 내 기존 실재 파일 (G-001~G-003 MODIFY 이력) — YES
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` — monorepo 내 기존 실재 파일 — YES
- C-28 prefix 검증: 올바른 `topvel-grid-monorepo` prefix 확인 — YES

### H-03: AC 출처 태그 검증
| AC | 출처 태그 | Section 내 인용 |
|----|---------|----------------|
| AC-001 | `C-4`, L0 | Section 1.1 + Section 2.1 |
| AC-002 | `C-4`, L2 | Section 1.3 + Section 2.1 |
| AC-003 | `R-A` | Section 1.5 (AggridTable.tsx L88-92 인용) |
| AC-004 | `C-25` | Section 13 |

모든 H → YES. 일반 채점 진행.

---

## G-01 Cross-Consistency 자가 검증 (v1.0.4)

**D# 표 ↔ 본문 일치**:

| D# | 표 내용 | 본문 해당 섹션 | 일치 |
|----|---------|-------------|------|
| D1 | C-28 정정 불필요 | Section 7 표 경로 | ✓ |
| D2 | NEW 0 + MODIFY 2 = 2파일 | Section 7 최종 표: 2행 | ✓ |
| D3 | resetSection 시그니처 Union | Section 2.1 resetSection 시그니처 | ✓ |
| D4 | clearSelectionKey useEffect + isFirstClearRender ref | Section 11.1 After 코드 | ✓ |
| D5 | controlled mode → onChange 경유 | Section 2.1 resetState JSDoc + EC-05 | ✓ |
| D6 | initialStateRef useRef mount capture | Section 11.1 After 코드 + Section 11.3 위험 표 | ✓ |
| D7 | 번들 extrapolation 차단 + 실측 의무 | Section 8.5 + Section 12.3 | ✓ |
| D8 | affectedUsageFiles 0개 literal 명시 | Section 1.4 + Section 8.1 | ✓ |

**E-06 검증**: Section 7 본문에 재결정 키워드 없음. 최종 표 = 2파일 MODIFY. 모순 없음.

**Breakdown 일치 강화 (v1.0.4)**:
- D2: "NEW 0 + MODIFY 2 = 2파일" → Section 7 표: NEW 0행 + MODIFY 2행 = 2행 — 합계 ✓, NEW/MODIFY 분류 ✓, 파일명 (`useGridState.ts`, `types.ts`) 본문 Section 11 일치 ✓
