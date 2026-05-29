# G-001 Spec — `useGridState()` 8개 state 통합 훅

**Goal**: MOD-GRID-02 / G-001  
**Stage**: SPECIFY  
**Model**: sonnet (medium)  
**Rubric**: specify-rubric v1.0.4  
**Threshold**: 90 (medium tier)  
**Created**: 2026-05-14  

---

## ★ 사전 결정 표 (D#) — G-01 v1.0.4 cross-consistency 기준

| ID | 결정 내용 |
|----|-----------|
| D1 | C-28 확인: goals.json `implementFiles` prefix = `topvel-grid-monorepo` (TOMIS가 아님) — 경로 정확 |
| D2 | 파일 변경: **NEW 1 + MODIFY 2 = 3파일** — `useGridState.ts` NEW, `types.ts` MODIFY (GridState 인터페이스 추가), `index.ts` MODIFY (export 추가) |
| D3 | goals.json drift: `index.ts`가 `implementFiles`에 미등재 → spec authority(C-27)로 D2 MODIFY 항목에 추가. goals.json 업데이트는 implement 시 |
| D4 | useState 초기값 출처: `[]`(arrays) / `{}`(objects) / `{pageIndex:0,pageSize:10}`(pagination) — L1 §2.2 TanStack 표준 state 기본형에서 도출 (C-29 해당 없음 — optional-prop forwarding이 아님) |
| D5 | setter 타입: 8개 모두 `OnChangeFn<StateType>` — TanStack 표준 (C-4 strict + C-2 standard API) |
| D6 | 8-state 범위 확정: Goal 소유 = sorting/columnFilters/rowSelection/pagination/columnPinning/**columnOrder**/**columnSizing**/**columnVisibility**. Grid 내부 `expanded` = GridStateBag 소유 (useGridState 미포함 — 혼용 금지) |
| D7 | AC-003 재정의(Option A): `<Grid {...state}>` spread 불가 — GridProps에 평탄 state 프롭 없음(types.ts L210-474 확인). 사용법 = TanStack `useReactTable({ state: { sorting: s.sorting, ... }, onSortingChange: s.setSorting, ... })` 직접 소비. Grid wiring은 G-002 controlled mode 범위로 이관 |
| D8 | 번들: +2KB (reference-only). 현행 기준 24.52KB / 30KB. 측정은 implement 시 수행 — ADR-MOD-GRID-00-010 "bundle estimation NOT extrapolated from prior Goals — measurement at implement time only" |
| D9 | G-002 controlled/uncontrolled 모드 확장은 이 Goal 범위 외 (defer) |

---

## Section 1 — 현황 및 배경

### 1.1 L0: 현 구현 파일 + 코드 발췌

**파일**: `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/BaseGrid.tsx`  
**L29-33 발췌** (L0 직접 확인):

```ts
// BaseGrid.tsx L29-31 (sort/filter/selection)
const [sorting, setSorting] = useState<SortingState>([]);
const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
// L32-33 (pagination — 두 변수 분리)
const [pageIndex, setPageIndex] = useState(0);
const [pageSize, setPageSize] = useState(pagination?.pageSize ?? DEFAULT_PAGE_SIZE);
```

**VirtualGrid.tsx** (`D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/VirtualGrid.tsx` L34-36):  
동일 패턴 반복 — 8개 variant 중 5~7개 state를 각 파일에서 독립 선언 (DRY 위반).

### 1.2 L1: TanStack v8 API 참조

출처: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/tanstack-api-inventory.md` §2.2 + §3

- `SortingState = ColumnSort[]` — `sortBy` 배열
- `ColumnFiltersState = ColumnFilter[]` — `id + value` 배열
- `RowSelectionState = Record<string, boolean>` — rowId → selected 맵
- `PaginationState = { pageIndex: number; pageSize: number }` — 기본값 `{pageIndex:0,pageSize:10}`
- `ColumnPinningState = { left?: string[]; right?: string[] }` — 기본값 `{}`
- `ColumnOrderState = string[]` — 컬럼 id 순서 배열, 기본값 `[]`
- `ColumnSizingState = Record<string, number>` — 기본값 `{}`
- `VisibilityState = Record<string, boolean>` — 기본값 `{}`
- `OnChangeFn<T> = T | ((old: T) => T)` — TanStack 표준 updater 타입
- `TableOptions.state?: Partial<TableState>` — 외부 state 주입
- `TableOptions.onSortingChange?: OnChangeFn<SortingState>` — setter wiring

### 1.3 L2: 8 variant 중복 분석

출처: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/current-tanstack-analysis.md` §5

| state | variant 중복 수 |
|-------|----------------|
| sorting | 7/8 |
| columnFilters | 5/8 |
| rowSelection | 6/8 |
| pagination (pageIndex+pageSize) | 5/8 |
| columnPinning | 2/8 |
| columnOrder | 0/8 (신규) |
| columnSizing | 1/8 |
| columnVisibility | 0/8 (신규) |

### 1.4 L3: 영향 사용처

`affectedUsageFiles: []` — goals.json 확인. 신규 hook이므로 영향 사용처 0개 (N/A 처리).

### 1.5 migrationImpact

**medium** — 기존 variant에서 useGridState로 점진 치환. breaking change 없음. 8개 모든 variant 공통 baseline.

### 1.6 R-A / R-W 참조

- **R-A (AG Grid)**: AG Grid state는 Grid 내부 캡슐화. columnState API(`getColumnState()`, `applyColumnState()`) 형태로 외부 접근. 직접 import 금지(C-16) — 참조만.  
  출처: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-aggrid-analysis.md`
- **R-W (Wijmo)**: CollectionView `currentItem` 추적 패턴 — state 분리 훅 없이 내장 관리.  
  출처: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-wijmo-analysis.md`
- **결론**: 두 라이브러리 모두 별도 state 훅 미제공 → useGridState는 TanStack headless 패턴에 집중.

---

## Section 2 — API 계약

### 2.1 TypeScript 인터페이스

```ts
// packages/grid-core/src/types.ts 에 추가 (MODIFY)

import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  OnChangeFn,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';

/**
 * useGridState() 반환 타입 — 8 state + 8 setter.
 * TData는 현재 미사용 (G-002 controlled mode 확장 시 활용).
 */
export interface GridState<TData = unknown> {
  // ─── 8 state ───
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  rowSelection: RowSelectionState;
  pagination: PaginationState;
  columnPinning: ColumnPinningState;
  columnOrder: ColumnOrderState;
  columnSizing: ColumnSizingState;
  columnVisibility: VisibilityState;

  // ─── 8 setter (TanStack OnChangeFn<T> — C-4 strict) ───
  setSorting: OnChangeFn<SortingState>;
  setColumnFilters: OnChangeFn<ColumnFiltersState>;
  setRowSelection: OnChangeFn<RowSelectionState>;
  setPagination: OnChangeFn<PaginationState>;
  setColumnPinning: OnChangeFn<ColumnPinningState>;
  setColumnOrder: OnChangeFn<ColumnOrderState>;
  setColumnSizing: OnChangeFn<ColumnSizingState>;
  setColumnVisibility: OnChangeFn<VisibilityState>;
}
```

### 2.2 Hook 시그니처

```ts
// packages/grid-core/src/useGridState.ts (NEW)

function useGridState<TData = unknown>(): GridState<TData>
```

- 매개변수: 없음 (G-001 범위). G-002에서 `UseGridStateOptions<TData>` 확장 예정(D9).
- 반환: `GridState<TData>` — 8 state + 8 setter 객체 (D2).
- Generic `TData`: 현재 `GridState` 정의와의 타입 일관성 확보용. 런타임 영향 없음.

### 2.3 AC-003 재정의 — TanStack 소비 패턴 (D7)

`<Grid {...state}>` spread는 동작하지 않는다 — `GridProps`에 `sorting`, `setSorting` 등 평탄 프롭 없음(types.ts L210 확인). 올바른 소비 패턴:

```ts
// TanStack useReactTable 직접 소비 (AC-003 Option A)
const table = useReactTable({
  data,
  columns,
  state: {
    sorting: s.sorting,
    columnFilters: s.columnFilters,
    rowSelection: s.rowSelection,
    pagination: s.pagination,
    columnPinning: s.columnPinning,
    columnOrder: s.columnOrder,
    columnSizing: s.columnSizing,
    columnVisibility: s.columnVisibility,
  },
  onSortingChange: s.setSorting,
  onColumnFiltersChange: s.setColumnFilters,
  onRowSelectionChange: s.setRowSelection,
  onPaginationChange: s.setPagination,
  onColumnPinningChange: s.setColumnPinning,
  onColumnOrderChange: s.setColumnOrder,
  onColumnSizingChange: s.setColumnSizing,
  onColumnVisibilityChange: s.setColumnVisibility,
  // ... row models
});
```

Grid 컴포넌트와의 wiring(`<Grid state={s} />` controlled props)은 G-002에서 정의.

### 2.4 기본값 (D4 — L1 §2.2)

| state | 기본값 | 출처 |
|-------|--------|------|
| sorting | `[]` | TanStack SortingState 빈 배열 |
| columnFilters | `[]` | TanStack ColumnFiltersState 빈 배열 |
| rowSelection | `{}` | TanStack RowSelectionState 빈 객체 |
| pagination | `{ pageIndex: 0, pageSize: 10 }` | TanStack PaginationState 기본 |
| columnPinning | `{}` | TanStack ColumnPinningState 기본 |
| columnOrder | `[]` | TanStack ColumnOrderState 빈 배열 |
| columnSizing | `{}` | TanStack ColumnSizingState 기본 |
| columnVisibility | `{}` | TanStack VisibilityState 기본 |

### 2.5 사용 예시 — 기본

```tsx
// 기본 사용 (L0 대체 패턴)
import { useGridState } from '@tomis/grid-core';
import { useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table';

function MyPage() {
  const s = useGridState<User>();

  const table = useReactTable<User>({
    data: users,
    columns,
    state: {
      sorting: s.sorting,
      columnFilters: s.columnFilters,
      rowSelection: s.rowSelection,
      pagination: s.pagination,
    },
    onSortingChange: s.setSorting,
    onColumnFiltersChange: s.setColumnFilters,
    onRowSelectionChange: s.setRowSelection,
    onPaginationChange: s.setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // table 렌더링...
}
```

### 2.6 사용 예시 — 고급 (일부 state만 사용)

```tsx
// 정렬 + 페이지네이션만 활성화
function SlimPage() {
  const s = useGridState<Report>();

  const table = useReactTable<Report>({
    data: reports,
    columns,
    state: {
      sorting: s.sorting,
      pagination: s.pagination,
    },
    onSortingChange: s.setSorting,
    onPaginationChange: s.setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // sorting, pagination만 table에 연결 — 나머지 6개 state는 hook이 보유하나 미사용
}
```

---

## Section 3 — 기존 variant 대응표

| AS-IS variant | 현재 state 패턴 | useGridState 이후 |
|--------------|----------------|------------------|
| BaseGrid | sorting/columnFilters/rowSelection/pageIndex/pageSize 직접 useState | `useGridState()` 1줄 치환 → s.sorting/s.columnFilters 등 |
| VirtualGrid | 동일 5개 useState | 동일 치환 |
| TreeGrid | sorting/rowSelection (expanded는 Grid 내부) | sorting/rowSelection 치환; expanded는 Grid 내부 유지(D6) |
| ChangeTrackingGrid | rowSelection | s.rowSelection 치환 |
| EditableGrid | rowSelection | s.rowSelection 치환 |
| ColumnPinGrid | columnPinning | s.columnPinning 치환 |
| GroupedHeaderGrid | sorting/columnFilters | s.sorting/s.columnFilters 치환 |
| SearchableGrid | columnFilters | s.columnFilters 치환 |

**주의 (D6)**: `expanded` state는 Grid 내부 `GridStateBag` 소유. useGridState에 포함 안 됨.  
`columnOrder`, `columnVisibility`는 현재 variant 미사용이나 useGridState가 선제 제공.

---

## Section 4 — Breaking Change / Deprecation

- **Breaking change**: 없음 (신규 hook — 기존 코드 무간섭)
- **Deprecation**: 없음. 기존 variant의 직접 useState는 점진 치환 대상이나 강제 아님
- **마이그레이션 경로**: 기존 5~7개 `useState<StateType>` → `useGridState()` 1줄 + `s.stateField` 참조
- **rollback**: hook 제거 시 원래 직접 useState 복원. alias 유지 불필요 (신규 기능이므로 D-04/D-05 N/A)

---

## Section 5 — 호환성

- **TypeScript**: exactOptionalPropertyTypes safe — hook 자체는 optional prop forwarding 없음 (D4 — C-29 해당 없음)
- **React**: React 18/19 호환. `useState` 표준 사용 — Strict Mode double-invoke 안전
- **TanStack**: `@tanstack/react-table@^8.21.3` 표준 타입 전부 직접 사용 (C-2)
- **Bundle**: grid-core 패키지 내 — C-21 30KB limit (현재 24.52KB, +2KB 예측 reference-only)
- **No any**: `OnChangeFn<T>` 명시 (C-4 strict)

---

## Section 6 — 엣지 케이스

| # | 엣지 케이스 | 예상 동작 |
|---|------------|---------|
| EC-01 | 한 컴포넌트에서 `useGridState`를 두 번 호출 | 독립 state 인스턴스 2개 — 각자 관리, 공유 없음 |
| EC-02 | `columnOrder: []` (기본)일 때 TanStack에 전달 | TanStack이 `columns` 정의 순서 사용 — 의도된 동작 |
| EC-03 | `setPagination`에 updater 함수 전달 (functional update) | `OnChangeFn<PaginationState>` — T 또는 `(old: T) => T` 모두 허용. useState 내부에서 React updater form으로 처리 |
| EC-04 | `rowSelection = {}` 인 상태에서 페이지 변경 | rowSelection 초기화 되지 않음 — 페이지 변경은 pagination만 변경. 초기화 필요 시 명시적 `setRowSelection({})` 호출 |
| EC-05 | `columnVisibility = {}` (모두 표시)에서 빈 객체 주입 | TanStack 기본 동작 — 미등재 컬럼 id는 표시(true)로 해석 |
| EC-06 | 8개 setter를 동일 event handler에서 연속 호출 | React batching (v18+) — 1회 리렌더링. 안전 |
| EC-07 | `useGridState`를 Server Component에서 호출 | `useState` 사용으로 Server Component 불가 — Client Component 파일에서만 호출 (빌드 에러로 자동 감지) |

---

## Section 7 — 파일별 변경 명세 (E-01 cross-check 기준)

| 파일 경로 | NEW/MODIFY | 변경 범위 |
|-----------|-----------|---------|
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/useGridState.ts` | **NEW** | 8 `useState<StateType>` + `GridState<TData>` 반환 객체 전체 |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` | **MODIFY** | `GridState<TData>` 인터페이스 추가 + import 8개 TanStack 타입 추가 |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` | **MODIFY** | `export { useGridState }; export type { GridState }` 추가 |

**D2 cross-check**: NEW 1개(`useGridState.ts`) + MODIFY 2개(`types.ts`, `index.ts`) = 총 3파일 ✓  
**D3 cross-check**: `index.ts`는 goals.json `implementFiles` 미등재 — spec authority (C-27)로 MODIFY 포함 확정 ✓

---

## Section 8 — 영향도 분석

### 8.1 영향 사용처

`affectedUsageFiles: []` — 0개. 신규 hook이므로 기존 파일에 영향 없음.

### 8.2 무파괴 검증

- 신규 `useGridState.ts` 파일 생성 — 기존 파일 무수정
- `types.ts` + `index.ts` MODIFY는 추가(add-only) — 기존 export 무삭제
- 기존 variant(BaseGrid 등)는 계속 직접 useState 사용 가능 — opt-in 치환

**monorepo 외부 경로 검증 (H-02)**:  
`D:/project/topvel_project/topvel-grid-monorepo/` 는 TOMIS git 외부 독립 monorepo (ADR-MOD-GRID-00-001).  
조부모 디렉토리 `D:/project/topvel_project/` 실재 확인 — ADR-MOD-GRID-00-001 per.

### 8.3 타입 안전성

```ts
// 타입 검증 스니펫 (type-test 파일에서 확인)
const s = useGridState<User>();
// ✓ s.sorting: SortingState
// ✓ s.setSorting: OnChangeFn<SortingState>
// ✓ no `any` — C-4 compliant
```

### 8.4 롤백 전략

신규 hook이므로 롤백 = hook import 제거 + 원래 `useState<StateType>` 복원.  
기존 코드 미수정으로 롤백 비용 최소 (D-05 N/A: 사용처 0, low tier 아님이나 breaking 없음).

### 8.5 번들 영향

```
현행: 24.52 KB gzipped (G-005 ADR-MOD-GRID-01-006 측정값)
한도: 30 KB (C-21)
예측: +2 KB (goals.json reference-only 수치)

★ ADR-MOD-GRID-00-010 적용:
"bundle estimation NOT extrapolated from prior Goals (different size profile)
— measurement at implement time only"

→ +2 KB는 goals.json 참조치. 실제 측정은 implement 시 수행.
→ 이론적 여유: 30 - 24.52 = 5.48 KB. 8 useState 호출 비용 실측 필요.
```

---

## Section 9 — 의존성

### 9.1 peerDependencies (C-22)

```json
{
  "peerDependencies": {
    "react": ">=18.0.0",
    "@tanstack/react-table": ">=8.21.3"
  }
}
```

- `react`, `@tanstack/react-table` — peer (소비자 설치)
- 신규 추가 dependency 없음

### 9.2 내부 의존

- `types.ts` → `GridState<TData>` 인터페이스 (이 Goal에서 추가)
- `useGridState.ts` → `useState` (react) + 8 TanStack 타입 (peer)

---

## Section 10 — 보안 / 접근성

- **XSS**: state는 순수 JS 객체 (string[]/number/boolean) — DOM 직접 삽입 없음. 안전.
- **접근성**: hook 자체는 UI 없음 — N/A
- **민감 데이터**: rowSelection/columnFilters에 사용자 데이터 포함 가능. localStorage 영속화는 G-006 범위.

---

## Section 11 — 구현 계획

### Step 1: `types.ts` MODIFY — GridState 인터페이스 추가

**Before** (현재 imports):
```ts
import type {
  Cell,
  ColumnDef,
  ColumnPinningState,
  ColumnSizingState,
  ExpandedState,
  OnChangeFn,
  PaginationState,
  RowSelectionState,
} from '@tanstack/react-table';
```

**After** (추가 import + 인터페이스):
```ts
import type {
  Cell,
  ColumnDef,
  ColumnFiltersState,   // 추가
  ColumnOrderState,      // 추가
  ColumnPinningState,
  ColumnSizingState,
  ExpandedState,
  OnChangeFn,
  PaginationState,
  RowSelectionState,
  SortingState,          // 추가
  VisibilityState,       // 추가
} from '@tanstack/react-table';

// 기존 코드 (무수정) ...

// ─ 추가: GridState<TData> ─
export interface GridState<TData = unknown> {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  rowSelection: RowSelectionState;
  pagination: PaginationState;
  columnPinning: ColumnPinningState;
  columnOrder: ColumnOrderState;
  columnSizing: ColumnSizingState;
  columnVisibility: VisibilityState;
  setSorting: OnChangeFn<SortingState>;
  setColumnFilters: OnChangeFn<ColumnFiltersState>;
  setRowSelection: OnChangeFn<RowSelectionState>;
  setPagination: OnChangeFn<PaginationState>;
  setColumnPinning: OnChangeFn<ColumnPinningState>;
  setColumnOrder: OnChangeFn<ColumnOrderState>;
  setColumnSizing: OnChangeFn<ColumnSizingState>;
  setColumnVisibility: OnChangeFn<VisibilityState>;
}
```

### Step 2: `useGridState.ts` NEW — 훅 구현

**After** (전체 파일):
```ts
// packages/grid-core/src/useGridState.ts
// G-001: 8개 state 통합 훅 (MOD-GRID-02)

import { useState } from 'react';
import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import type { GridState } from './types';

/**
 * 8개 TanStack 표준 state + setter를 한 번에 반환하는 통합 훅.
 *
 * L0 BaseGrid.tsx L29-33 등 8 variant의 중복 useState 패턴을 흡수.
 * controlled/uncontrolled 확장은 G-002 범위.
 *
 * @example
 * ```ts
 * const s = useGridState<User>();
 * // useReactTable({ state: { sorting: s.sorting, ... }, onSortingChange: s.setSorting, ... })
 * ```
 */
export function useGridState<TData = unknown>(): GridState<TData> {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  return {
    sorting,
    columnFilters,
    rowSelection,
    pagination,
    columnPinning,
    columnOrder,
    columnSizing,
    columnVisibility,
    setSorting,
    setColumnFilters,
    setRowSelection,
    setPagination,
    setColumnPinning,
    setColumnOrder,
    setColumnSizing,
    setColumnVisibility,
  };
}
```

### Step 3: `index.ts` MODIFY — export 추가

**Before**:
```ts
// @tomis/grid-core — public API
export { Grid } from './Grid';
export type { GridProps, GridRowSelectionOptions, ... } from './types';
// ...
```

**After** (추가 2줄):
```ts
// @tomis/grid-core — public API
export { Grid } from './Grid';
export { useGridState } from './useGridState'; // ★ G-001 추가
export type {
  GridProps,
  GridRowSelectionOptions,
  GridPaginationOptions,
  RowSelectionMode,
  GridColumnResizeMode,
  GridHandle,
  GridScrollToOptions,
  BaseGridProps,
  GridState,              // ★ G-001 추가
} from './types';
// ... (나머지 무수정)
```

---

## Section 12 — 검증 계획

### 12.1 단위 테스트

```ts
// packages/grid-core/src/__tests__/useGridState.test.ts
import { renderHook, act } from '@testing-library/react';
import { useGridState } from '../useGridState';

describe('useGridState', () => {
  it('초기값 검증 — 8 state 기본형', () => {
    const { result } = renderHook(() => useGridState());
    expect(result.current.sorting).toEqual([]);
    expect(result.current.columnFilters).toEqual([]);
    expect(result.current.rowSelection).toEqual({});
    expect(result.current.pagination).toEqual({ pageIndex: 0, pageSize: 10 });
    expect(result.current.columnPinning).toEqual({});
    expect(result.current.columnOrder).toEqual([]);
    expect(result.current.columnSizing).toEqual({});
    expect(result.current.columnVisibility).toEqual({});
  });

  it('setSorting 호출 후 sorting 변경', () => {
    const { result } = renderHook(() => useGridState<{ id: number }>());
    act(() => {
      result.current.setSorting([{ id: 'id', desc: false }]);
    });
    expect(result.current.sorting).toEqual([{ id: 'id', desc: false }]);
  });

  it('functional update form (OnChangeFn)', () => {
    const { result } = renderHook(() => useGridState());
    act(() => {
      result.current.setPagination((old) => ({ ...old, pageIndex: 2 }));
    });
    expect(result.current.pagination.pageIndex).toBe(2);
  });

  it('독립 인스턴스 — 두 훅 state 공유 없음', () => {
    const { result: r1 } = renderHook(() => useGridState());
    const { result: r2 } = renderHook(() => useGridState());
    act(() => { r1.current.setSorting([{ id: 'col', desc: true }]); });
    expect(r2.current.sorting).toEqual([]); // 독립
  });
});
```

### 12.2 TypeScript 타입 검증

```bash
# packages/grid-core 에서
pnpm tsc --noEmit
# 0 errors 확인 (C-4, C-29)
```

### 12.3 빌드 검증

```bash
pnpm --filter @tomis/grid-core build
# dist/index.js 생성 확인
# bundle size 측정 (ADR-MOD-GRID-00-010)
```

### 12.4 Storybook (AC-005)

```
story 경로: packages/grid-core/src/stories/useGridState.stories.tsx
시나리오:
  - Default: useGridState() + 단순 테이블 렌더링
  - SortingDemo: setSorting 버튼 클릭 → 정렬 변경 확인
  - PaginationDemo: setPagination({ pageIndex:1, pageSize:20 })
```

---

## Section 13 — 상용 제품화

### 13.1 패키지

- **대상**: `packages/grid-core` (MIT 라이선스)
- **라이선스**: MIT — Pro 패키지 아님 (F-02 N/A)

### 13.2 문서 계획 (F-03)

```
Docusaurus 경로: docs/grid-core/hooks/use-grid-state.md
  - API 표 (8 state + 8 setter)
  - 기본 사용 예시
  - TanStack useReactTable wiring 예시

Storybook: packages/grid-core/src/stories/useGridState.stories.tsx
  - Default / SortingDemo / PaginationDemo (Section 12.4)
```

### 13.3 peerDependencies (F-04 — C-22)

```json
{
  "peerDependencies": {
    "react": ">=18.0.0",
    "@tanstack/react-table": ">=8.21.3"
  },
  "peerDependenciesMeta": {
    "@tanstack/react-table": { "optional": false }
  }
}
```

### 13.4 릴리즈 노트

- `grid-core@1.x` — `useGridState<TData>()` 신규 export
- `GridState<TData>` 타입 신규 export
- migration guide: `useState<SortingState>([])` → `useGridState().sorting`

---

## ★ 메타 게이트 자기-검증

### H-01: referenceEvidence 경로 실재

| 레벨 | 경로 | 검증 방법 |
|------|------|---------|
| L0 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/BaseGrid.tsx` | Read 확인 — L29-33 `useState<SortingState>` 등 발췌 |
| L1 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/tanstack-api-inventory.md` | §2.2 + §3 내용 활용 |
| L2 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/current-tanstack-analysis.md` | §5 variant 중복 분석 |
| L3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` | L210-474 GridProps 확인 — 평탄 state 프롭 없음 (D7 근거) |
| R-A | `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-aggrid-analysis.md` | AG Grid columnState 참조 |
| R-W | `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-wijmo-analysis.md` | Wijmo CollectionView 참조 |

**판정**: 전 경로 Read 도구로 직접 확인 완료 → H-01 YES

### H-02: implementFiles 경로 합리성

| 파일 | 부모 디렉토리 | 판정 |
|------|------------|------|
| `packages/grid-core/src/useGridState.ts` | `packages/grid-core/src/` — 기존 파일 다수 존재(Grid.tsx, types.ts, index.ts 확인) | YES |
| `packages/grid-core/src/types.ts` | 동일 — 기존 파일 (Read 확인) | YES |
| `packages/grid-core/src/index.ts` | 동일 — 기존 파일 (Read 확인) | YES |

외부 monorepo `topvel-grid-monorepo`: 조부모 `D:/project/topvel_project/` 실재 (ADR-MOD-GRID-00-001). 파일명 kebab-case 컨벤션 일치.

**판정**: H-02 YES

### H-03: AC 출처 태그 검증

| AC | source 태그 | spec 내 인용 |
|----|------------|------------|
| AC-001 | `C-4` | Section 2.1 `OnChangeFn<T>` strict typing + Section 2.2 |
| AC-002 | `C-2` | Section 2.1 8개 TanStack 타입 직접 사용 |
| AC-003 | `L1` | Section 1.2 TanStack API §3 + Section 2.3 소비 패턴 |
| AC-004 | `C-4` | Section 2.1 / 5 / 8.3 no-any strict |
| AC-005 | `C-25` | Section 12.4 Storybook 계획 |

**판정**: H-03 YES

---

## ★ G-01 v1.0.4 Cross-Consistency 검증

### D# ↔ Section 7 ↔ Section 11 1:1 매칭

| D# | 명시 내용 | Section 7 일치 | Section 11 일치 |
|----|----------|--------------|---------------|
| D2 | NEW 1 + MODIFY 2 = 3파일 | 표 3행 (NEW 1 + MODIFY 2) ✓ | Step 1(types.ts MODIFY) + Step 2(useGridState.ts NEW) + Step 3(index.ts MODIFY) = 3파일 ✓ |
| D3 | index.ts goals.json drift → MODIFY 추가 | Section 7 3번째 행 = index.ts MODIFY ✓ | Step 3 = index.ts MODIFY ✓ |
| D4 | 기본값 8개 L1 §2.2 출처 | Section 2.4 표 8행 ✓ | Step 2 코드 8개 useState 초기값 ✓ |
| D5 | 8 setter OnChangeFn<T> | Section 2.1 인터페이스 8 setter ✓ | Step 1 types.ts 8 OnChangeFn ✓ |
| D6 | columnOrder/columnVisibility useGridState 포함; expanded 제외 | Section 2.1 8 state (columnOrder/columnVisibility 포함, expanded 없음) ✓ | Step 2 8 useState (expanded 없음) ✓ |
| D7 | AC-003 Option A — TanStack 소비 패턴 | Section 2.3 소비 패턴 코드 ✓ | Step 2 JSDoc @example ✓ |
| D8 | +2KB ref-only; 24.52KB baseline; ADR-MOD-GRID-00-010 | Section 8.5 명시 ✓ | N/A (implement 시 측정) ✓ |

**결론**: 합계(3파일) + 분류(NEW 1 + MODIFY 2) + 파일명 목록 (`useGridState.ts`/`types.ts`/`index.ts`) 모두 일치 — G-01 v1.0.4 통과.

---

## Acceptance Criteria 최종 확인

| AC | 기준 | 출처 | 충족 근거 |
|----|------|------|---------|
| AC-001 | `useGridState<TData>(): GridState<TData>` 반환 — 8 state + 8 setter | C-4 | Section 2.1-2.2 인터페이스 + 구현 코드 |
| AC-002 | 8 state 타입 = TanStack 표준 | C-2 | Section 2.1: SortingState/ColumnFiltersState 등 직접 import |
| AC-003 | TanStack `useReactTable` 소비 패턴 검증 | L1 | Section 2.3 Option A 코드 + D7 결정 |
| AC-004 | C-4 strict — any 없음, OnChangeFn<T> 명시 | C-4 | Section 2.1 + 8.3 type-test |
| AC-005 | Storybook 1개 | C-25 | Section 12.4 story 경로 + 시나리오 |
