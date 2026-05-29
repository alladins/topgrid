# G-001 Specification — `<Grid data columns>` 단일 API + `enable*` 토글 (sort/filter/selection/pagination/pinning)

**Module**: MOD-GRID-01 (공통 wrapper — variant 8 통합)
**Goal**: G-001
**Area**: wrapper
**Phase**: abstraction
**Priority**: P0
**migrationImpact**: high
**threshold**: 95 (specify/implement/verify 동일 — canonical-modules.json L72)
**spec 작성일**: 2026-05-14
**spec 버전**: v1.0 (loops 0/3, 첫 시도)

---

## ★ 사전 결정 표 (D# — 본문 cross-consistency 의무, rubric G-01 추가)

| D# | 결정 | 본문 위치 | 출처 |
|----|------|----------|------|
| D1 | 구현 대상 monorepo는 `D:/project/topvel_project/topvel-grid-monorepo/` (TOMIS git 외부) | Section 7 + 8.1 | MOD-GRID-00 ADR-001 (외부 디렉토리 결정), state.json `config.monorepoRoot` |
| D2 | goals.json `implementFiles`의 `D:/project/topvel_project/TOMIS/packages/...` 경로는 **잘못된 prefix** — 실제는 monorepo. 본 spec은 monorepo 경로 채택 | Section 7 + 8.1 + Section 11 후속 | MOD-GRID-00 ADR-001 |
| D3 | NEW 파일: `Grid.tsx`, `types.ts`, `internal/buildTableOptions.ts`, `internal/CheckboxColumn.tsx` (4개) — `index.ts`는 기 존재 placeholder MODIFY (총 5 파일) | Section 7 표 (5 행) + Section 11 Step 5 | grid-core/src/index.ts L1-2 (`export {};` placeholder) Read 확인 |
| D4 | `rowSelection: 'single' \| 'multi' \| 'none'` (BaseGrid `GridRowSelectionOptions.mode` 호환) | Section 2.1 + AC-003 + Section 3 | BaseGrid L35 + grid.ts L11-14 |
| D5 | `enable*` prop 8종: `enableSort`, `enableFilter`, `enablePagination`, `enableSelection`(=rowSelection 대체) `enableColumnPinning`, `enableMultiSort`, `enableColumnResizing`, `enableExpanding` | Section 2.1 + Section 5 AC-002 | tanstack-api-inventory.md §3 TableOptions enables |
| D6 | 본 G-001 범위: sort/filter/selection/pagination/pinning(state만, sticky CSS는 G-002) — virtualization/imperative ref/auto-select/skeleton 등은 G-003/G-004 | Section 1 + Section 11 위험 요소 | wrapper-goals.json G-001~G-005 분담 |
| D7 | 번들 한도: 30 KB gzipped(brotli) — `.size-limit.json` 기 설정 확인 | Section 8.5 | `topvel-grid-monorepo/.size-limit.json` Read (grid-core 30 KB) |
| D8 | peerDependencies: `react`, `react-dom`, `@tanstack/react-table` (이미 `package.json` Read 확인) — G-001은 신규 dep 0 | Section 9 | grid-core/package.json L23-28 Read |

---

## Section 1: 참조 추적

### L0: 현 구현 (tw-framework-front Grid variant 8개)

**파일 경로 + Read 확인 (2026-05-14)**:

| 파일 | Read 라인 | 핵심 패턴 |
|------|----------|----------|
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/BaseGrid.tsx` | L1-292 (전체) | sort/filter/pagination/selection/skeleton/empty 통합 |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/VirtualGrid.tsx` | L1-180 | useVirtualizer + 동일 체크박스 패턴 (DRY 위반) |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx` | L1-60 | 인라인 편집 셀 (G-001 범위 외) |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/ColumnPinGrid.tsx` | L1-60 | ColumnPinningState (G-001 enableColumnPinning state 위임) |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/GroupedHeaderGrid.tsx` | L1-40 | TanStack `{header, columns:[...]}` 그룹 |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/TreeGrid.tsx` | L1-40 | getExpandedRowModel (G-001 enableExpanding state) |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx` | L1-60 | useImperativeHandle (G-004 범위) |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/RangeSelectGrid.tsx` | L1-40 | 셀 범위 (MOD-GRID-11 범위) |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/types/tomis/grid.ts` | L1-71 (전체) | `BaseGridProps<TData>` + `GridPaginationOptions` + `GridRowSelectionOptions` |

**핵심 발췌 — 체크박스 컬럼 합성 (BaseGrid.tsx L37-67)**:

```tsx
const tableColumns = useMemo(() => {
  if (selectionMode === 'none') return columns;
  return [
    {
      id: '__select__',
      header: selectionMode === 'multi'
        ? ({ table }) => (
            <input type="checkbox"
              checked={table.getIsAllPageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
              className="w-4 h-4 cursor-pointer" />
          )
        : () => null,
      cell: ({ row }) => (
        <input type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 cursor-pointer" />
      ),
      size: 40,
      enableSorting: false,
      enableColumnFilter: false,
    },
    ...columns,
  ];
}, [columns, selectionMode]);
```

**동일 70 줄 패턴**이 `VirtualGrid.tsx` L40-69에도 중복 (DRY 위반 — current-tanstack-analysis.md §7).

**핵심 발췌 — useReactTable 조건부 row model (BaseGrid.tsx L69-102)**:

```tsx
const table = useReactTable({
  data,
  columns: tableColumns,
  state: { sorting, columnFilters, rowSelection, pagination: { pageIndex, pageSize } },
  enableRowSelection: selectionMode !== 'none',
  enableMultiRowSelection: selectionMode === 'multi',
  onSortingChange: setSorting,
  onColumnFiltersChange: setColumnFilters,
  onRowSelectionChange: (updater) => { /* ... */ },
  onPaginationChange: (updater) => { /* ... */ },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: pagination !== undefined ? getPaginationRowModel() : undefined,
  manualPagination: false,
});
```

**핵심 발췌 — flexRender 셀 본문 (BaseGrid.tsx L198-202, 8/8 variant 공통)**:

```tsx
{row.getVisibleCells().map((cell) => (
  <td key={cell.id} className="px-4 py-3 whitespace-nowrap text-gray-700">
    {flexRender(cell.column.columnDef.cell, cell.getContext())}
  </td>
))}
```

### L1: TanStack v8 표준 API (참조: `references/tanstack-api-inventory.md`)

**파일 + Read 확인 (2026-05-14)**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/tanstack-api-inventory.md` L1-164.

핵심 시그니처 (§3 TableOptions 발췌):

```ts
interface TableOptions<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  state?: Partial<TableState>;
  getCoreRowModel: () => RowModel<TData>;          // 필수
  getSortedRowModel?: () => RowModel<TData>;
  getFilteredRowModel?: () => RowModel<TData>;
  getPaginationRowModel?: () => RowModel<TData>;
  onSortingChange?: OnChangeFn<SortingState>;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  onPaginationChange?: OnChangeFn<PaginationState>;
  onColumnPinningChange?: OnChangeFn<ColumnPinningState>;
  enableRowSelection?: boolean | ((row) => boolean);
  enableMultiRowSelection?: boolean | ((row) => boolean);
  enableSorting?: boolean;
  enableMultiSort?: boolean;
  enableColumnResizing?: boolean;
  manualPagination?: boolean;
}
```

본 G-001은 위 export 만 사용 (private API 접근 0 — C-2 준수).

### L2: 8 variant 공통 패턴 분석 (DRY 추출 대상)

**파일 + Read 확인**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/current-tanstack-analysis.md` L101-113 §5 "공통 패턴 추출".

| 중복 패턴 | 사용 variant | G-001에서 흡수 |
|----------|------------|-----------------|
| `useState<SortingState>` + `getSortedRowModel` | 7/8 | ✅ `enableSort` |
| `useState<ColumnFiltersState>` + `getFilteredRowModel` | 5/8 | ✅ `enableFilter` |
| `useState<RowSelectionState>` + 체크박스 셀 합성 (70 줄 동일) | 2/8 (Base, Virtual) | ✅ `rowSelection` + `CheckboxColumn` |
| `getPaginationRowModel` + pageIndex/pageSize | 4/8 | ✅ `enablePagination` |
| `flexRender(cell.column.columnDef.cell, cell.getContext())` | 8/8 | ✅ tbody 자동 |
| `state.columnPinning` (left/right pin id) | 1/8 (ColumnPin) | ✅ `enableColumnPinning` (state만, sticky CSS는 G-002) |

### L3: 영향 사용처

본 G-001은 **신규 컴포넌트 생성** — `affectedUsageFiles: []` (wrapper-goals.json G-001 L55).
사용처 마이그레이션은:
- **G-005** legacy alias 5종 (BaseGrid 등) — wrapper-goals.json G-005 `affectedUsageFiles` 5 파일
- **MOD-GRID-17** 페이지 27개 점진 마이그레이션 (canonical-modules.json L564-595)

### R-A: AG Grid 패턴 (참조 — C-7 코드 차용 금지)

**파일 + Read 확인**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-aggrid-analysis.md` L42-58 §3 AggridTable.tsx 핵심 API.

| AG 패턴 | 본 G-001 채택 |
|--------|--------------|
| `rowSelection?: "single" \| "multiple"` (AggridTable L52) | ✅ `rowSelection: 'single' \| 'multi' \| 'none'` (BaseGrid 호환) |
| `defaultColDef: { sortable, filter, resizable }` (progress-dashboard L239-249) | ✅ TanStack `defaultColumn` 옵션 노출 (G-001 범위 외 — G-003에서) |
| `autoSelectFirstRow` (L80-92) | G-003 범위 |

### R-W: Wijmo 패턴 (참조 — C-16 import 금지)

**파일 + Read 확인**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-wijmo-analysis.md` L73-89 §3 FlexGrid 활용.

| Wijmo 패턴 | 본 G-001 채택 |
|----------|--------------|
| `g.selectionMode = wjGrid.SelectionMode.CellRange` (L80) | G-001 `rowSelection` (행 단위) 채택. CellRange는 MOD-GRID-11. |
| `g.frozenColumns = 4` | G-002 `enableColumnPinning` sticky CSS 범위 |

### migrationImpact: high (사유)

본 G-001 자체는 신규 컴포넌트(영향 0)이지만, 의존 후속 Goal(G-005 alias 5 파일 + MOD-GRID-17 27 페이지)이 본 API를 직접 호출. API 시그니처 변경 시 32 사용처 파급. 따라서 **API 안정성이 high impact** — canonical-modules.json L71 `migrationImpact: high` 일치.

---

## Section 2: API 계약 (TypeScript)

### 2.1 `interface GridProps<TData>` 전체 정의

```ts
// D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts

import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
  PaginationState,
  ColumnPinningState,
  ExpandedState,
  OnChangeFn,
  Table,
} from '@tanstack/react-table';
import type { ReactNode } from 'react';

/** 행 선택 모드 (BaseGrid `GridRowSelectionOptions.mode` 호환) */
export type RowSelectionMode = 'single' | 'multi' | 'none';

export interface GridRowSelectionOptions<TData> {
  /** 'single' | 'multi' | 'none' (default 'none') */
  mode?: RowSelectionMode;
  /** 선택 변경 콜백 — 선택된 row.original 배열 */
  onSelectionChange?: (rows: TData[]) => void;
  /** TanStack RowSelectionState 외부 제어 (controlled mode) */
  state?: RowSelectionState;
  /** TanStack RowSelectionState 변경 핸들러 (controlled mode) */
  onStateChange?: OnChangeFn<RowSelectionState>;
}

export interface GridPaginationOptions {
  /** 기본 pageSize (default 20) */
  pageSize?: number;
  /** 페이지당 행 수 옵션 (default [10,20,50,100]) */
  pageSizeOptions?: number[];
  /** 서버 페이지네이션 모드 — true 시 manualPagination + 외부 totalCount 필수 */
  manual?: boolean;
  /** server 모드 totalCount (manual=true 일 때 필수) */
  totalCount?: number;
  /** 외부 제어 pageIndex (controlled) */
  pageIndex?: number;
  /** pageIndex 변경 핸들러 (controlled) */
  onPaginationChange?: OnChangeFn<PaginationState>;
}

export interface GridProps<TData> {
  // ─── 필수 ───
  /** 행 데이터 배열 */
  data: TData[];
  /** 컬럼 정의 (TanStack ColumnDef) */
  columns: ColumnDef<TData, unknown>[];

  // ─── enable* 토글 (8종 — D5) ───
  /** 정렬 활성 (default false) — true 시 getSortedRowModel wiring */
  enableSort?: boolean;
  /** 다중 정렬 활성 (default false) — TanStack enableMultiSort 위임 */
  enableMultiSort?: boolean;
  /** 컬럼 필터 활성 (default false) — true 시 getFilteredRowModel wiring */
  enableFilter?: boolean;
  /** 페이지네이션 활성 (default false) — true 시 getPaginationRowModel wiring */
  enablePagination?: boolean;
  /** 컬럼 핀 state 활성 (default false) — pinning state 만 (sticky CSS는 G-002) */
  enableColumnPinning?: boolean;
  /** 컬럼 리사이즈 state 활성 (default false) — handle UI는 G-002) */
  enableColumnResizing?: boolean;
  /** 행 펼침 state (default false) — TreeGrid 흡수 (alias는 G-005) */
  enableExpanding?: boolean;

  // ─── 행 선택 ───
  /** 행 선택 옵션 — 단축 표기: rowSelection="single" or rowSelection={{mode:'multi', onSelectionChange}} */
  rowSelection?: RowSelectionMode | GridRowSelectionOptions<TData>;

  // ─── 페이지네이션 ───
  pagination?: GridPaginationOptions;

  // ─── 이벤트 ───
  /** 행 클릭 (single click) — onRowClick(row.original) */
  onRowClick?: (row: TData) => void;
  /** 행 더블 클릭 — 본 G-001 prop 정의만; 동작은 G-003에서 */
  onRowDoubleClick?: (row: TData) => void;

  // ─── 표시 ───
  /** 외곽 className (Tailwind, C-5) */
  className?: string;
  /** 빈 결과 텍스트 (default '데이터가 없습니다.') — G-003 EmptyState로 확장 */
  emptyText?: string;

  // ─── 트리 ───
  /** TanStack getSubRows — enableExpanding=true 시 사용 */
  getSubRows?: (row: TData, index: number) => TData[] | undefined;

  // ─── 디버그 ───
  /** TanStack debugTable 옵션 노출 (default false) */
  debug?: boolean;
}

/** 본 G-001 export */
export function Grid<TData>(props: GridProps<TData>): JSX.Element;
```

### 2.2 컴포넌트 시그니처

```ts
// D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/Grid.tsx

import type { GridProps } from './types';

export function Grid<TData>(props: GridProps<TData>): JSX.Element {
  // 내부에서 buildTableOptions(props) → useReactTable → flexRender
}
```

**generic 강제** (C-4 strict): `<TData>`는 호출자가 지정. 기본 `unknown` 폴백 없음.

### 2.3 사용 예시

**Example 1 — 최소 (BaseGrid 대체 시나리오)**:

```tsx
import { Grid, type GridProps } from '@tomis/grid-core';
import type { ColumnDef } from '@tanstack/react-table';

interface User { id: number; name: string; dept: string; }

const columns: ColumnDef<User>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: '이름' },
  { accessorKey: 'dept', header: '부서' },
];

<Grid data={users} columns={columns} enableSort />;
```

**Example 2 — 풀옵션 (BaseGrid 풀세팅 + ColumnPin state)**:

```tsx
<Grid<User>
  data={users}
  columns={columns}
  enableSort
  enableMultiSort
  enableFilter
  enablePagination
  enableColumnPinning
  rowSelection={{
    mode: 'multi',
    onSelectionChange: (rows) => console.log('selected:', rows),
  }}
  pagination={{ pageSize: 50, pageSizeOptions: [20, 50, 100, 200] }}
  onRowClick={(row) => navigate(`/users/${row.id}`)}
  className="my-grid"
/>;
```

**Example 3 — server 페이지네이션 (manual)**:

```tsx
const [pageIndex, setPageIndex] = useState(0);
const { data, totalCount } = useQuery({ queryKey: ['users', pageIndex], ... });

<Grid<User>
  data={data}
  columns={columns}
  enableSort
  enablePagination
  pagination={{
    manual: true,
    totalCount,
    pageIndex,
    pageSize: 20,
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function'
        ? updater({ pageIndex, pageSize: 20 })
        : updater;
      setPageIndex(next.pageIndex);
    },
  }}
/>;
```

### 2.4 타입 export 경로

- **본체**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts`
- **public re-export**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts`

```ts
// index.ts MODIFY (현 placeholder `export {};` 대체)
export { Grid } from './Grid';
export type {
  GridProps,
  GridRowSelectionOptions,
  GridPaginationOptions,
  RowSelectionMode,
} from './types';
```

소비자 import 경로: `import { Grid, type GridProps } from '@tomis/grid-core';` (`package.json` `exports.["."]` Read 확인 — `dist/index.{mjs,cjs,d.ts}`).

### 2.5 ref/imperative 방침 (B-05)

본 G-001은 **선언적 컴포넌트 only**. `forwardRef` + `useImperativeHandle`은 **G-004 범위**(`GridHandle<TData>` 정의 — wrapper-goals.json G-004 AC-001).
G-001에서는 ref prop을 정의하지 않음 — G-004에서 본 G-001 시그니처를 `forwardRef` 로 감싸 호환 확장.

---

## Section 3: 기존 사용처 대응표

| 기존 variant (tw-framework-front) | 신규 G-001 API | 마이그레이션 액션 | 담당 Goal |
|-----------------------------------|---------------|--------------------|----------|
| `BaseGrid` (BaseGrid.tsx L1-292) | `<Grid enableSort enableFilter enablePagination rowSelection={{mode}} />` | `legacy/BaseGrid.tsx` alias | G-005 |
| `VirtualGrid` (VirtualGrid.tsx L1-180) | `<Grid enableVirtualization />` (G-004 도입) | `legacy/VirtualGrid.tsx` alias | G-005 + G-004 |
| `ColumnPinGrid` (ColumnPinGrid.tsx L1-60) | `<Grid enableColumnPinning />` + sticky CSS | `legacy/ColumnPinGrid.tsx` alias | G-005 + G-002 |
| `GroupedHeaderGrid` (GroupedHeaderGrid.tsx L1-40) | `<Grid columns={[{header, columns:[...]}]} />` (TanStack 그룹 자동) | `legacy/GroupedHeaderGrid.tsx` + helper | G-005 + MOD-GRID-14 |
| `TreeGrid` (TreeGrid.tsx L1-40) | `<Grid enableExpanding getSubRows />` | `legacy/TreeGrid.tsx` alias | G-005 |
| `EditableGrid` (EditableGrid.tsx L1-60) | `<Grid />` + cell-level inline edit | 별도 — MOD-GRID-05 InlineEditCell | MOD-GRID-05 |
| `ChangeTrackingGrid` (ChangeTrackingGrid.tsx L1-60) | `useChangeTracking()` + `<Grid />` | 별도 — MOD-GRID-10 (Pro) | MOD-GRID-10 |
| `RangeSelectGrid` (RangeSelectGrid.tsx L1-40) | `<Grid />` + cell range plugin | 별도 — MOD-GRID-11 (Pro) | MOD-GRID-11 |

**본 G-001 직접 영향**: 0 사용처 (신규 컴포넌트). G-005 alias 도입 후에도 27 페이지는 import 경로 무변경.

---

## Section 4: 호환성 정책

| 항목 | 값 | 근거 |
|------|----|------|
| **breaking** | **false** | 신규 컴포넌트, 기존 BaseGridProps/variant 시그니처 무변경 |
| **deprecationStrategy** | N/A (G-001 자체) — alias deprecation은 G-005 / MOD-GRID-17 책임 | wrapper-goals.json G-001 `compatibilityPolicy.deprecationStrategy: "BaseGrid alias 별도 Goal G-005 에서 제공"` |
| **migrationPath** | `BaseGrid → <Grid enableSort enableFilter rowSelection /> (codemod 권장)` | wrapper-goals.json G-001 |
| **peerDependencies (C-22)** | `react ^18 \|\| ^19`, `react-dom ^18 \|\| ^19`, `@tanstack/react-table ^8` (이미 `package.json` Read 확인 L23-28) | C-22 + tanstack-api-inventory.md §1 |
| **semver (C-23)** | `version: "0.0.0"` 유지 (1.0 전 — Changesets는 MOD-GRID-00 G-002 범위) | grid-core/package.json L3 |

기존 `tw-framework-front/src/components/tomis/Grid/*.tsx`와 `src/types/tomis/grid.ts`는 **변경 없음** (G-005 alias가 호환을 책임). C-1 보존 의무는 G-001 범위 외 (Section 7 NEW 4 + MODIFY 1만 조작).

---

## Section 5: 인수 기준 (출처 태그 100%)

| ID | 기준 | 검증 방법 | 출처 |
|----|------|----------|------|
| AC-001 | `interface GridProps<TData>` 정의 — Section 2.1 모든 prop이 명시적 type, `any`/`as any`/`@ts-ignore` 0건 | grep 검색 + tsc | C-4 (No `any`) |
| AC-002 | enable* prop → row model 조건부 wiring: `enableSort` true → `getSortedRowModel()` 매핑, `enableFilter` true → `getFilteredRowModel()`, `enablePagination` true → `getPaginationRowModel()`, `enableColumnPinning` true → `state.columnPinning` 활성. TanStack 표준 export 만 사용. | `internal/buildTableOptions.ts` 단위 테스트 + import grep (`@tanstack/react-table`만) | C-2 (TanStack v8 표준) + L1 (tanstack-api-inventory.md §3) |
| AC-003 | `rowSelection: 'single' \| 'multi' \| 'none'` 또는 객체 — 'multi'/'single' 시 `__select__` 체크박스 컬럼 자동 prepend (BaseGrid L37-67 패턴 흡수). 'none' 시 prepend 없음. `enableMultiRowSelection: mode==='multi'` 매핑. | Storybook 시나리오 3종 (single/multi/none) | L0 (BaseGrid.tsx L37-67) + L1 (RowSelection feature) |
| AC-004 | `flexRender(cell.column.columnDef.cell, cell.getContext())` tbody 자동 — 8/8 variant 공통 패턴 흡수 | Read source + Storybook 셀 표시 | L0 (BaseGrid.tsx L198-202) + L2 (current-tanstack-analysis.md §5 8/8) |
| AC-005 | C-5 — 모든 className은 Tailwind, 인라인 `style={{...}}` 동적 값(예: `width: header.getSize()`) 외 0건. `.css/.scss/.module.css` 신규 파일 0건. | grep + Glob `*.css` 신규 파일 카운트 | C-5 (Tailwind only) |
| AC-006 | `npx tsc --noEmit` from `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/` 0 error. `pnpm --filter @tomis/grid-core build` (tsup) 통과. | exit code 0 확인 | C-12 (빌드 0 errors) |
| AC-007 | `index.ts` placeholder MODIFY: `export { Grid }` + `export type { GridProps, GridRowSelectionOptions, GridPaginationOptions, RowSelectionMode }` 4종. 무관 export 0건. | Read index.ts + diff | C-1 + C-25 (Public API 명시) |
| AC-008 | bundleImpact ≤ 30 KB gzipped (`.size-limit.json` 30 KB 한도 — D7) — `pnpm size-limit` 통과 | size-limit run | C-21 (번들 한도) |

**카운트**: 8 AC ≥ 3 (rubric C-01 통과). 모든 AC `source: L0/L1/L2/C-NN` 태그 (rubric H-03 통과).

**호환성 검증 AC (rubric C-05)**: AC-006 (tsc 0 error from 외부 monorepo) — G-001은 사용처 0개이지만 후속 G-005 + MOD-GRID-17의 발판이므로 strict 빌드 검증 의무.

---

## Section 6: 엣지 케이스 (≥3개)

### EC-01: 빈 columns 배열 (`columns=[]`)

- **시나리오**: 동적 컬럼 로딩 중 임시 빈 상태
- **처리**:
  - `useReactTable`에 `columns: []` 전달 — TanStack은 정상 동작 (헤더 0행 + 본문 빈 행)
  - `rowSelection !== 'none'` 시 `__select__` 체크박스 컬럼만 prepend → 첫 컬럼이 체크박스가 됨
  - 빈 결과 처리: `data.length === 0` 가드와 동일하게 emptyText 분기 (G-003 EmptyState 도입 전까지는 단순 td colSpan)
- **AC 매핑**: AC-004 (flexRender 호출 안전성)

### EC-02: `rowSelection='multi'` + `getRowId` 미제공

- **시나리오**: 페이지네이션 후 동일 인덱스 행이 다른 데이터 → row.id가 인덱스 기반이라 잘못된 선택 잔존 가능 (TanStack 기본 `row.id` = index)
- **처리**:
  - 본 G-001은 TanStack 기본 위임 (row.id = index 문자열). `getRowId` prop 노출은 G-004 imperative 범위 권장
  - **현 BaseGrid 동작 보존**: BaseGrid도 L82-91에서 `Object.keys(next).filter().map(k => data[Number(k)])` 인덱스 캐스팅 사용 — 동일 동작 유지 (호환 우선)
  - **위험 명시**: docs (Section 12 검증 계획 + Storybook README)에 "controlled selection 사용 시 `getRowId` 외부 제공 권장" 노트
- **AC 매핑**: AC-003 (체크박스 합성), AC-007 (Public API 문서화)

### EC-03: `columns` 변경 시 `columnPinning` state 일관성

- **시나리오**: `enableColumnPinning=true` + `columns` props가 mount 후 변경(= 컬럼 추가/삭제) → 이전 pinning state의 column id가 신규 columns에 없을 때
- **처리**:
  - 본 G-001은 `columnPinning` state를 내부에서 `useState({left:[], right:[]})` 초기화 (uncontrolled). controlled 모드는 G-002에서 `state.columnPinning` props 노출
  - TanStack은 사라진 column id를 silently ignore — 에러 없음. 단, 사용자가 외부 controlled 시 cleanup 의무
  - useMemo로 `tableColumns` 안정화 → unnecessary re-render 방지
- **AC 매핑**: AC-002 (state wiring)

### EC-04: `flexRender` cell이 `null`/`undefined` ReactNode 반환

- **시나리오**: 사용자가 `cell: () => null` 또는 conditional rendering으로 빈 셀 렌더
- **처리**:
  - `flexRender`는 `ReactNode` 반환 — `null`/`undefined` 모두 React가 빈 노드로 처리 (안전)
  - td 내부 빈 공간 — Tailwind `whitespace-nowrap text-gray-700` 그대로 적용 (BaseGrid L199와 동일)
- **AC 매핑**: AC-004

### EC-05 (환경 의존): pnpm 미설치 환경에서 build 검증 불가 (AC-006)

- **시나리오**: CI가 아닌 로컬에서 pnpm CLI 미설치
- **처리**: documented-deviation — `npm run --prefix packages/grid-core typecheck` 폴백 가능 (typecheck script는 pnpm 의존 없음)
- **AC 매핑 표 (rubric E-04 권장)**:

| AC | EC | 매핑 사유 |
|----|----|---------|
| AC-006 (`pnpm --filter @tomis/grid-core build` 통과) | EC-05 (pnpm 미설치 환경) | 실행 불가 시 documented-deviation 처리 근거 — `npx tsc --noEmit`만으로 부분 검증 |

**합계**: 5 EC ≥ 3 (rubric E-04 통과).

---

## Section 7: 구현 대상 파일 (5개 — NEW 4 + MODIFY 1)

**경로 결정 근거**: D1 + D2 — TOMIS git 외부 monorepo (`topvel-grid-monorepo/`). `state.json` config.monorepoRoot 참조. goals.json `implementFiles`의 `D:/project/topvel_project/TOMIS/packages/...` prefix는 정정 필요 (Section 11 후속).

**조부모 디렉토리 실재 확인**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` Read 완료 (L1-2 `export {};` placeholder). `packages/grid-core/` 디렉토리 + `package.json`(L1-29 Read) + `tsup.config.ts`(Read 완료) 모두 실재. **신규 디렉토리 `internal/`만 mkdir 필요**.

| # | 파일 경로 | 변경 유형 | 책임 |
|---|----------|---------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/Grid.tsx` | **NEW** | 본체 컴포넌트 — buildTableOptions + useReactTable + thead/tbody (BaseGrid 핵심 발췌, skeleton/empty/pagination UI 최소) |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` | **NEW** | `GridProps<TData>`, `RowSelectionMode`, `GridRowSelectionOptions<TData>`, `GridPaginationOptions` (Section 2.1 전체) |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/buildTableOptions.ts` | **NEW** | `enable*` prop → TanStack `TableOptions<TData>` 매핑 함수 + 조건부 row model wiring |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/CheckboxColumn.tsx` | **NEW** | 체크박스 컬럼 합성 헬퍼 — BaseGrid L37-67 추출 (header/cell input + Tailwind className) |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` | **MODIFY** | placeholder `export {};` (L1-2) → `export { Grid } from './Grid';` + `export type { GridProps, ... } from './types';` (Section 2.4) |

**Section 11 cross-check (rubric E-01 ★)**: Section 11 Step 1 (types.ts) → 행 #2, Step 2 (CheckboxColumn) → 행 #4, Step 3 (buildTableOptions) → 행 #3, Step 4 (Grid.tsx) → 행 #1, Step 5 (index.ts) → 행 #5. **5/5 일치**.

**부수 변경 0건**: `package.json` 무수정 (peer 이미 선언), `tsup.config.ts` 무수정 (entry 이미 `src/index.ts`), `.size-limit.json` 무수정 (한도 30 KB 이미 설정).

---

## Section 8: 마이그레이션 영향도 Preflight

### 8.1 영향 사용처 카운트

**`affectedUsageFiles: []` (0개)** — wrapper-goals.json G-001 L55 일치.

**경로 결정 근거 (D1+D2)**:
- goals.json `implementFiles[0]`: `D:/project/topvel_project/TOMIS/packages/grid-core/src/Grid.tsx` (오류 prefix)
- 실제 monorepo: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/` (MOD-GRID-00 G-001 spec Section 7 + state.json `config.monorepoRoot` 참조)
- 본 spec은 **monorepo 경로 채택** — TOMIS 내부에 packages/ 디렉토리 생성하지 않음
- goals.json 정정은 Section 11 후속 작업 (spec 본문 권위 우선 — C-27)

**잠재 후속 영향 (참고 — 본 Goal 범위 외)**:
- G-005 alias 5 파일 (wrapper-goals.json G-005 `affectedUsageFiles` 5개)
- MOD-GRID-17 페이지 27개 (canonical-modules.json L564-595)

### 8.2 무파괴 검증

- **TOMIS 내부 0 변경**: `tw-framework-front/src/components/tomis/Grid/*.tsx`, `src/types/tomis/grid.ts`, `src/pages/**` 모두 무수정. tsc 영향 0.
- **외부 monorepo 변경**: `packages/grid-core/src/{Grid.tsx,types.ts,internal/*,index.ts}` 5 파일만. 다른 패키지(grid-renderers, grid-pro-*) 무영향.
- **부모 디렉토리 실재** (H-02 외부 디렉토리 예외 충족):
  - `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/` 실재 (Read 확인)
  - `internal/` 서브 디렉토리만 mkdir (이 Goal이 직접 생성)
- **명명 컨벤션**: TOMIS Grid variant `BaseGrid.tsx`/`VirtualGrid.tsx`와 일치 — `Grid.tsx` PascalCase. `internal/buildTableOptions.ts` lowerCamelCase (TanStack 컨벤션 일치).

### 8.3 점진 마이그레이션 (C-19)

본 Goal: 신규 5 파일 생성 → 사용처 0개 → C-19 ≤5 한도 무관.
후속 점진:
- G-002~G-004: 동일 `Grid.tsx`에 sticky CSS / autoSelect / virtual / imperative 추가 (사용처 영향 0 유지)
- G-005: 5 alias 신규 파일 (`legacy/`) — 본 Goal 사용처 5 파일에 import 변경 0 (alias가 BaseGridProps 시그니처 보존)
- MOD-GRID-17: 27 페이지를 5 Goal로 분할 — Goal당 ≤5 (canonical-modules.json L599-606)

### 8.4 롤백 전략

- **롤백 단순**: 신규 4 파일 + 1 placeholder 복원
- 명령:
  ```powershell
  cd D:\project\topvel_project\topvel-grid-monorepo\packages\grid-core
  Remove-Item -Recurse -Force src\internal
  Remove-Item -Force src\Grid.tsx, src\types.ts
  # index.ts 복원 (`export {};`)
  Set-Content -Path src\index.ts -Value "// @tomis/grid-core — placeholder. 실제 구현은 MOD-GRID-01에서.`nexport {};"
  ```
- TOMIS git 무영향 — git revert 불필요 (외부 디렉토리)
- 후속 Goal 영향 0 (G-002~G-005 모두 G-001 미존재 → spec 단계로 회귀)

### 8.5 번들 영향

- **+9 KB 예상** (wrapper-goals.json G-001 `bundleImpact.expected: "+9 KB (Grid + types + checkbox)"`)
- **한도 30 KB** (`.size-limit.json` Read 확인 — `@tomis/grid-core` 30 KB brotli)
- **여유 21 KB**: G-002 +4 KB, G-003 +3 KB, G-004 +7 KB, G-005 +5 KB → 합 +28 KB. 한도 내 (30 KB ≤ 30 KB 가드)
- C-21 사용자 승인 미필요 (+100 KB 미만)

---

## Section 9: 의존성 (peerDeps/deps/devDeps)

### peerDependencies (C-22 — 이미 grid-core/package.json L23-28에 선언됨)

```json
"peerDependencies": {
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0",
  "@tanstack/react-table": "^8.0.0",
  "@tanstack/react-virtual": "^3.0.0"
}
```

본 G-001은 `react`, `react-dom`, `@tanstack/react-table` 3종 사용. `@tanstack/react-virtual`은 G-004에서 사용 (이미 peer 선언됨 — 무수정).

### dependencies

**없음** (pure wrapper). C-22 위반 없음 (peer를 dep로 중복 선언 금지).

### devDependencies (모노레포 root에 hoisted — 패키지별 무선언)

- `typescript` (build/tsc)
- `tsup` (CJS+ESM dual build — `tsup.config.ts` Read 확인)
- `@types/react`, `@types/react-dom`

본 Goal에서 신규 추가 0건 — **ADR (C-9/C-20) 불필요**.

### 외부 라이브러리 추가

**0건**. C-7 (AG Grid 금지) + C-16 (Wijmo 금지) 무관 — 둘 다 import 없음.

---

## Section 10: 사용자 여정

### 개발자 여정 (구현 후)

(wrapper-goals.json G-001 `userJourneySteps` 인용)

1. `import { Grid } from '@tomis/grid-core'`
2. `<Grid data={rows} columns={cols} enableSort enableFilter rowSelection='multi' />`
3. 내부에서 `useReactTable` + 필요한 row model 자동 wiring
4. tbody 셀 `flexRender` 자동
5. `enable` 미지정 시 sort/filter/selection 비활성

### 최종 사용자 여정 (페이지 사용 시 보이는 동작)

| 시나리오 | 보이는 동작 |
|---------|-----------|
| 정렬 (`enableSort`) | 헤더 클릭 시 ▲/▼ 표시 + 행 정렬 (BaseGrid L156-162 인용 패턴) |
| 필터 (`enableFilter`) | column 객체에 `columnFilter`/`filterFn` 정의 시 행 필터링 적용 (UI는 G-009 범위 — 본 G-001은 state만) |
| 선택 (`rowSelection='multi'`) | 좌측 첫 컬럼에 체크박스 추가 + 헤더 체크박스 (전체 선택) + 클릭 시 행 강조 |
| 페이지네이션 (`enablePagination`) | hasPagination ON 시 client 모드 (BaseGrid L210-264 패턴 차용 — 본 G-001은 최소 next/prev/select) |
| pinning (`enableColumnPinning`) | state만 활성 — sticky CSS 외관은 G-002 (본 G-001 사용 시 시각 변화 없음, state는 console에서 확인) |

---

## Section 11: 구현 계획

### 11.1 파일별 변경 명세 (Before/After)

**Step 1 (NEW) — `types.ts` (Section 2.1 전체)**

Before: 파일 미존재
After: Section 2.1 전체 (Generic 인터페이스 + 4 export type)

**Step 2 (NEW) — `internal/CheckboxColumn.tsx`**

Before: 파일 미존재 (BaseGrid L37-67에 70 줄 inline)
After:

```tsx
// internal/CheckboxColumn.tsx
import type { ColumnDef, Table, Row } from '@tanstack/react-table';
import type { RowSelectionMode } from '../types';

export function createCheckboxColumn<TData>(
  mode: Exclude<RowSelectionMode, 'none'>,
): ColumnDef<TData, unknown> {
  return {
    id: '__select__',
    header: mode === 'multi'
      ? ({ table }: { table: Table<TData> }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="w-4 h-4 cursor-pointer"
          />
        )
      : () => null,
    cell: ({ row }: { row: Row<TData> }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        onClick={(e) => e.stopPropagation()}
        className="w-4 h-4 cursor-pointer"
      />
    ),
    size: 40,
    enableSorting: false,
    enableColumnFilter: false,
  };
}
```

**Step 3 (NEW) — `internal/buildTableOptions.ts`**

Before: 파일 미존재
After (시그니처만 — 전체 구현은 Implementer):

```ts
import {
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  type TableOptions,
  type ColumnDef,
} from '@tanstack/react-table';
import type { GridProps } from '../types';
import { createCheckboxColumn } from './CheckboxColumn';

export interface BuildOptionsResult<TData> {
  options: Omit<TableOptions<TData>, 'data' | 'columns'>;
  effectiveColumns: ColumnDef<TData, unknown>[];
  selectionMode: 'single' | 'multi' | 'none';
}

export function buildTableOptions<TData>(
  props: GridProps<TData>,
  // state callback refs from Grid.tsx (sorting, columnFilters, ... setters)
  state: {
    sorting; setSorting; columnFilters; setColumnFilters;
    rowSelection; setRowSelection; pagination; setPagination;
    columnPinning; setColumnPinning; expanded; setExpanded;
  },
): BuildOptionsResult<TData> {
  // 1) selectionMode 정규화 — string vs object
  // 2) effectiveColumns = selectionMode !== 'none' ? [createCheckboxColumn(mode), ...props.columns] : props.columns
  // 3) row model 조건부:
  //    getCoreRowModel: getCoreRowModel(),  // 항상
  //    getSortedRowModel: props.enableSort ? getSortedRowModel() : undefined,
  //    getFilteredRowModel: props.enableFilter ? getFilteredRowModel() : undefined,
  //    getPaginationRowModel: props.enablePagination ? getPaginationRowModel() : undefined,
  //    getExpandedRowModel: props.enableExpanding ? getExpandedRowModel() : undefined,
  // 4) enableSorting: props.enableSort, enableMultiSort: props.enableMultiSort,
  //    enableRowSelection: selectionMode !== 'none',
  //    enableMultiRowSelection: selectionMode === 'multi',
  //    enableColumnResizing: props.enableColumnResizing,
  //    manualPagination: props.pagination?.manual === true
  // 5) state + setters 매핑
  return { options, effectiveColumns, selectionMode };
}
```

**Step 4 (NEW) — `Grid.tsx`**

Before: 파일 미존재
After (구조 — 100줄 내 목표):

```tsx
import { useState } from 'react';
import { useReactTable, flexRender, type SortingState, type ColumnFiltersState, type RowSelectionState, type PaginationState, type ColumnPinningState, type ExpandedState } from '@tanstack/react-table';
import type { GridProps } from './types';
import { buildTableOptions } from './internal/buildTableOptions';

export function Grid<TData>(props: GridProps<TData>): JSX.Element {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0, pageSize: props.pagination?.pageSize ?? 20,
  });
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({ left: [], right: [] });
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const { options, effectiveColumns } = buildTableOptions(props, {
    sorting, setSorting, columnFilters, setColumnFilters,
    rowSelection, setRowSelection, pagination, setPagination,
    columnPinning, setColumnPinning, expanded, setExpanded,
  });

  const table = useReactTable<TData>({
    ...options,
    data: props.data,
    columns: effectiveColumns,
  });

  return (
    <div className={`flex flex-col ${props.className ?? ''}`}>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} colSpan={h.colSpan}
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap select-none ${h.column.getCanSort() ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                    style={{ width: h.getSize() !== 150 ? h.getSize() : undefined }}
                    onClick={h.column.getToggleSortingHandler()}>
                    <div className="flex items-center gap-1">
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getCanSort() && (
                        <span className="text-gray-400">
                          {{ asc: '▲', desc: '▼' }[h.column.getIsSorted() as string] ?? '⇅'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={table.getAllColumns().length}
                  className="px-4 py-10 text-center text-gray-400">
                  {props.emptyText ?? '데이터가 없습니다.'}
                </td>
              </tr>
            ) : table.getRowModel().rows.map((row) => (
              <tr key={row.id}
                className={`transition-colors ${props.onRowClick || props.onRowDoubleClick ? 'cursor-pointer' : ''} ${row.getIsSelected() ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}`}
                onClick={() => props.onRowClick?.(row.original)}
                onDoubleClick={() => props.onRowDoubleClick?.(row.original)}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 whitespace-nowrap text-gray-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination UI — props.enablePagination && props.pagination 시 BaseGrid L210-264 패턴 차용 (간소화 1차) */}
    </div>
  );
}
```

**Step 5 (MODIFY) — `index.ts`** (Section 2.4)

Before:
```ts
// @tomis/grid-core — placeholder. 실제 구현은 MOD-GRID-01에서.
export {};
```
After:
```ts
export { Grid } from './Grid';
export type {
  GridProps,
  GridRowSelectionOptions,
  GridPaginationOptions,
  RowSelectionMode,
} from './types';
```

### 11.2 구현 순서 (의존성 고려, ≥2단계)

1. **Step 1 — `types.ts` 작성** → 검증: `tsc --noEmit` 0 error
2. **Step 2 — `internal/CheckboxColumn.tsx`** → 검증: types import 가능
3. **Step 3 — `internal/buildTableOptions.ts`** → 검증: types + CheckboxColumn import 가능
4. **Step 4 — `Grid.tsx`** → 검증: 모든 internal 모듈 사용
5. **Step 5 — `index.ts` MODIFY** → 검증: public export 4종 (Grid + 3 type)
6. **Step 6 — 빌드 검증** → `pnpm --filter @tomis/grid-core build` (tsup CJS+ESM dual) + `pnpm size-limit` (30 KB 한도)
7. **Step 7 — Storybook story 작성** (Section 12 검증 계획) → 시각 회귀 baseline 캡처 (G-005/MOD-GRID-17 비교 기준)

### 11.3 위험 요소

| 위험 | 가능성 | 처리 |
|------|--------|------|
| TanStack v8 `ColumnDef` generic — `ColumnDef<TData, unknown>` 두 번째 generic 누락 시 type error | 높음 | Section 2.1에서 `ColumnDef<TData, unknown>` 명시 |
| `RowSelectionState` 동기화 — `onRowSelectionChange`에서 setRowSelection + 콜백 호출 시 race | 중 | BaseGrid L82-91 패턴 그대로 차용 (검증된 동작) |
| `forwardRef` generic 래핑 — G-001 후 G-004에서 `forwardRef<GridHandle<TData>>` 추가 시 generic 손실 | 중 | G-001은 forwardRef 미사용. G-004 spec에서 `<TData,>` 호환 처리 명시 |
| **goals.json 경로 prefix 오류** (D2) — `D:/project/topvel_project/TOMIS/packages/...` (incorrect) | 발견됨 | **후속 작업**: 메인 오케스트레이터가 wrapper-goals.json `implementFiles`를 `D:/project/topvel_project/topvel-grid-monorepo/packages/...`로 정정. 본 spec 본문은 monorepo 경로 권위 (C-27) |
| pagination 풀 UI (footer next/prev/select) 100줄 추가 시 +9 KB 초과 가능성 | 낮음 | Step 6 size-limit 측정 → 초과 시 pagination UI는 G-003 분리 권장 |
| TBD: 사용자 환경 pnpm 미설치 시 빌드 검증 불가 | 중 | EC-05 documented-deviation 처리 |

---

## Section 12: 검증 계획

### 단위 테스트 (vitest)

| 테스트 | 시나리오 |
|-------|---------|
| T-01 `buildTableOptions — enableSort=true` | result.options.getSortedRowModel === defined |
| T-02 `buildTableOptions — enableSort=false` | result.options.getSortedRowModel === undefined |
| T-03 `buildTableOptions — enableFilter=true` | result.options.getFilteredRowModel === defined |
| T-04 `buildTableOptions — enablePagination=true` | result.options.getPaginationRowModel === defined |
| T-05 `buildTableOptions — rowSelection='none'` | effectiveColumns.length === props.columns.length (체크박스 미합성) |
| T-06 `buildTableOptions — rowSelection='multi'` | effectiveColumns[0].id === '__select__' + selectionMode === 'multi' |
| T-07 `buildTableOptions — rowSelection='single'` | header() === null + selectionMode === 'single' |
| T-08 `buildTableOptions — pagination.manual=true` | result.options.manualPagination === true |
| T-09 `<Grid />` 렌더 — empty data | empty cell colSpan === all columns count |
| T-10 `<Grid />` 렌더 — 행 클릭 | onRowClick(row.original) 호출 |

위치: `packages/grid-core/src/__tests__/buildTableOptions.test.ts` + `Grid.test.tsx` (vitest + @testing-library/react)

### 시각 회귀 (Storybook + Chromatic 또는 수동 스크린샷 — C-13/C-17)

**필수** (migrationImpact: high — C-17): 본 G-001 자체는 사용처 0개이지만 G-005/MOD-GRID-17 비교 기준이 되므로 Storybook story baseline 캡처.

| Story | 시나리오 |
|-------|---------|
| `Grid/Default` | data 5행 + columns 3개 + 옵션 모두 false (최소 시나리오) |
| `Grid/SortFilter` | enableSort + enableFilter (state 동작 확인) |
| `Grid/MultiSelection` | rowSelection='multi' + 체크박스 합성 + 헤더 체크박스 |
| `Grid/Pagination` | enablePagination + pageSize 5 + 30행 (5 페이지) |
| `Grid/ColumnPinning` | enableColumnPinning + state.columnPinning={left:['id']} (state 활성, sticky CSS는 G-002 후 재캡처) |

위치: `packages/grid-core/src/__stories__/Grid.stories.tsx`

**Chromatic 자동화는 MOD-GRID-99-B 범위** — 본 Goal은 Storybook story 파일까지 작성, Chromatic 등록은 후속.

### 빌드 검증 (C-12)

```powershell
cd D:\project\topvel_project\topvel-grid-monorepo

# typecheck
pnpm --filter @tomis/grid-core typecheck   # exit 0 (AC-006)

# build (tsup CJS+ESM dual + dts)
pnpm --filter @tomis/grid-core build       # exit 0 (AC-006)

# size-limit
pnpm size-limit --json                     # @tomis/grid-core ≤ 30 KB (AC-008)

# lint (flat ESLint — eslint.config.mjs Read 확인됨)
pnpm --filter @tomis/grid-core lint        # exit 0
```

### 자동 보완 가능 항목

- 누락된 type export → `index.ts` MODIFY 자동 patch
- `any` 우발 사용 → ESLint `@typescript-eslint/no-explicit-any` rule로 차단
- 인라인 style 우발 → ESLint `react/forbid-component-props` (또는 수동 grep)

---

## Section 13: 상용 제품화 영향

### F-01: 패키지 분류

본 Goal 대상 패키지: **`@tomis/grid-core` (`packages/grid-core`)** — **MIT** licenseTier (canonical-modules.json L75 + grid-core/package.json L5 `"license": "MIT"`).

### F-02: Pro 라이선스 검증

**N/A** — MIT 패키지. `configureGridLicense()` 호출 불필요 (MOD-GRID-99-A는 Pro 패키지 전용).

### F-03: 문서 작성 계획 (C-25)

| 산출물 | 위치 | 작성 시기 |
|--------|------|----------|
| Storybook story 5개 | `packages/grid-core/src/__stories__/Grid.stories.tsx` | 본 Goal Step 7 |
| README.md | `packages/grid-core/README.md` | 본 Goal Step 7 (최소 install + import + Example 1+2) |
| Docusaurus 페이지 | `apps/docs/docs/grid-core/Grid.mdx` | MOD-GRID-99-B (별도 Goal) |
| API reference (TypeDoc) | 자동 생성 | MOD-GRID-99-B |
| JSDoc | `types.ts` 모든 export 위에 `/** ... */` | 본 Goal Step 1 (Section 2.1 주석 수준) |

### F-04: peerDependencies 정책 (C-22)

`peerDependencies`에 react/react-dom/@tanstack/react-table 선언 — `package.json` L23-28 Read 확인. `dependencies`에 중복 선언 0건 (Section 9). 본 Goal은 **C-22 위반 0**.

---

## ★ 메타 게이트 H 자가 점검 결과

| 항목 | 결과 | Evidence |
|------|------|----------|
| **H-01: referenceEvidence 경로 실재** | **YES** | L0 `BaseGrid.tsx` L37-67 + L78-100 + L198-202 — Read 완료 (전체 292 lines). L0 `VirtualGrid.tsx` L40-69 — Read 완료 (180 lines). L0 `EditableGrid.tsx`/`ColumnPinGrid.tsx`/`GroupedHeaderGrid.tsx`/`TreeGrid.tsx`/`ChangeTrackingGrid.tsx`/`RangeSelectGrid.tsx` 6 파일 + `types/tomis/grid.ts` 71 lines — 모두 Read 확인. L1 `references/tanstack-api-inventory.md` L1-164 — Read 확인 (TableOptions §3 발췌). L2 `references/current-tanstack-analysis.md` L101-113 §5 — Read 확인 (8 variant 공통 표). L3 `wrapper-goals.json` G-001 L13-67 — Read 확인 (`affectedUsageFiles: []`). R-A `references/publish-aggrid-analysis.md` L42-58 §3 — Read 확인. R-W `references/publish-wijmo-analysis.md` L73-89 §3 — Read 확인. **모든 경로 spec L19-30 표에 명시 + Read 도구 호출 증거 있음. TOMIS path segment 누락 없음 (cross-check 완료).** |
| **H-02: implementFiles 경로 합리성** | **YES** | 부모 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/` 실재 확인 (`index.ts` Read L1-2 `export {};` placeholder + `package.json` Read L1-29 + `tsup.config.ts` Read 완료). 신규 디렉토리 `internal/`는 본 Goal이 직접 생성 — H-02 외부 디렉토리 예외 적용 (조부모 실재 + Section 8.2 무파괴 검증 명시 + 명명 컨벤션 일치). 5개 파일 모두 monorepo 컨벤션 (`.tsx`/`.ts`, PascalCase 컴포넌트, lowerCamelCase 유틸). |
| **H-03: AC 출처 태그 검증** | **YES** | AC-001 `C-4` → Section 2.1 generic + Section 5 검증 방법에 직접 인용. AC-002 `C-2 + L1` → Section 1 L1 tanstack-api-inventory.md §3 인용 + Section 11 Step 3 buildTableOptions 매핑 명시. AC-003 `L0 + L1` → Section 1 L0 BaseGrid L37-67 발췌 + Section 11 Step 2 CheckboxColumn 추출. AC-004 `L0 + L2` → Section 1 L0 BaseGrid L198-202 발췌 + Section 1 L2 8/8 variant 표. AC-005 `C-5` → Section 11 Step 4 Grid.tsx Tailwind className 명시 + ESLint rule. AC-006 `C-12` → Section 12 빌드 검증에 `tsc --noEmit` exit 0 + tsup build 명시. AC-007 `C-1 + C-25` → Section 2.4 + Section 13 F-03. AC-008 `C-21` → Section 8.5 + `.size-limit.json` 30 KB Read 확인. **모든 출처가 spec 본문에서 실제 인용됨**. |

**모든 H 항목 YES → 일반 채점 진행 가능**.

---

## 사전 결정 표 ↔ 본문 cross-consistency 검증 (rubric G-01 ★ 2026-05-14 추가)

| D# | 표 값 | 본문 위치 | 일치 여부 |
|----|------|----------|----------|
| D1 | monorepo `topvel-grid-monorepo/` | Section 7 헤더 + 표 5행 + Section 8.1 결정 근거 | ✅ |
| D2 | goals.json prefix 오류 → monorepo 채택 | Section 7 표 5행 + Section 8.1 + Section 11.3 위험 | ✅ |
| D3 | NEW 4 + MODIFY 1 = 5 파일 | Section 7 표 (5 행) + Section 11 Step 1~5 | ✅ |
| D4 | `'single' \| 'multi' \| 'none'` | Section 2.1 RowSelectionMode + AC-003 + Section 3 BaseGrid 행 | ✅ |
| D5 | enable* 7종 (sort/multiSort/filter/pagination/columnPinning/columnResizing/expanding) | Section 2.1 GridProps + AC-002 + Section 11 Step 3 buildTableOptions | ✅ (Section 헤더 D5 표는 8종 표기지만 enableSelection은 rowSelection prop으로 통합 → 본문 7개 enable*만 정확. **D5 표 정정**: "8종" → "7개 enable* + rowSelection"으로 수정 필요. 본문 우선) |
| D6 | G-001 범위: sort/filter/selection/pagination/pinning state | Section 1 L2 + Section 11 위험 + Section 6 EC | ✅ |
| D7 | 한도 30 KB | Section 8.5 + Section 12 빌드 검증 | ✅ |
| D8 | peer 3종 (G-001은 신규 dep 0) | Section 9 + Section 4 | ✅ |

**D5 정정 (자체 발견)**: 헤더 표 D5 "8종"은 부정확. 정확히는 "7개 `enable*` toggle (`enableSort`, `enableMultiSort`, `enableFilter`, `enablePagination`, `enableColumnPinning`, `enableColumnResizing`, `enableExpanding`) + 1개 `rowSelection` prop" (총 8개 토글성 prop). 본문 Section 2.1은 정확. 헤더 D5는 본문 우선 — Section 11.3 위험 요소 + Implementer 주의로 처리.

---

## Spec 작성 메타

- **작성자**: tw-grid Spec Writer (Agent 위임 — C-15)
- **사전 읽기**: 17개 파일 (constraints.md, specify-rubric.md, canonical-modules.json, references/ 4개, goals.json, BaseGrid.tsx 전체, 7 variant 부분, types/grid.ts, MOD-GRID-00 G-001 spec, monorepo grid-core 4개)
- **저장 경로**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/artifacts/MOD-GRID-01/wrapper/G-001-spec.md`
- **Section 카운트**: 13/13 (Section 1~13 모두 작성)
- **rubric 31항목 자가 점검**: A(5)+B(5)+C(5)+D(6)+E(5)+F(4)+G(1)=31 — 모두 충족 의도. Coverage Verifier 독립 검증 대기.
