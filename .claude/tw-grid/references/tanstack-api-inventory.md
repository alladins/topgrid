# L1: TanStack Table v8 API 인벤토리

**버전**: `@tanstack/react-table@^8.21.3` (확인: `tw-framework-front/node_modules/@tanstack/react-table/package.json` L3)
**license**: MIT
**런타임**: `@tanstack/table-core@8.21.3` (re-export 통해 export)
**조사 일자**: 2026-05-13

---

## 1. 최상위 export (`@tanstack/react-table/build/lib/index.d.ts`)

전체 표면 — 2개 함수 + table-core 전체 re-export:

| export | 시그니처 |
|--------|----------|
| `useReactTable<TData>(options: TableOptions<TData>): Table<TData>` | 메인 hook |
| `flexRender<TProps>(Comp: Renderable<TProps>, props: TProps): React.ReactNode \| JSX.Element` | 헤더/셀/푸터 렌더 헬퍼 |
| `export * from '@tanstack/table-core'` | 아래 표 |

---

## 2. table-core export 표면 (`@tanstack/table-core/build/lib/index.d.ts`)

총 36개 모듈 re-export, 분류:

### 2.1 core (5 파일)
- `core/cell.d.ts` — Cell 타입
- `core/column.d.ts` — Column 타입 + `getCanSort`/`getCanFilter`/`getCanPin` 메서드
- `core/headers.d.ts` — Header / HeaderGroup
- `core/row.d.ts` — Row + `getIsSelected`/`getIsExpanded`/`getValue`/`subRows` 등
- `core/table.d.ts` — Table 인스턴스 메서드 전체

### 2.2 features (12개)
| feature | state 키 | 핵심 API |
|---------|---------|---------|
| `ColumnFaceting` | (no state) | `column.getFacetedRowModel`, `getFacetedUniqueValues` |
| `ColumnFiltering` | `columnFilters` | `column.setFilterValue`, `filterFn` |
| `ColumnGrouping` | `grouping` | `column.getCanGroup`, `toggleGrouping` |
| `ColumnOrdering` | `columnOrder` | `setColumnOrder` |
| `ColumnPinning` | `columnPinning: {left,right}` | `column.pin('left'\|'right'\|false)` |
| `ColumnSizing` | `columnSizing`, `columnSizingInfo` | `header.getResizeHandler`, `columnResizeMode: 'onChange'\|'onEnd'` |
| `ColumnVisibility` | `columnVisibility` | `column.toggleVisibility` |
| `GlobalFaceting` | (no state) | `getGlobalFacetedRowModel` |
| `GlobalFiltering` | `globalFilter` | `setGlobalFilter`, `globalFilterFn` |
| `RowExpanding` | `expanded` | `row.getCanExpand`, `getToggleExpandedHandler`, `getSubRows` |
| `RowPagination` | `pagination: {pageIndex,pageSize}` | `setPageIndex`, `nextPage`, `previousPage`, `setPageSize` |
| `RowPinning` | `rowPinning: {top,bottom}` | `row.pin('top'\|'bottom'\|false)` |
| `RowSelection` | `rowSelection` | `getIsAllPageRowsSelected`, `toggleSelected`, `enableMultiRowSelection` |
| `RowSorting` | `sorting` | `column.getToggleSortingHandler`, `enableMultiSort` |

### 2.3 utils — Row Model 함수 (9개) — 모두 lazy import 가능 (번들 분할 효과)
- `getCoreRowModel()` — 항상 필수
- `getSortedRowModel()`
- `getFilteredRowModel()`
- `getGroupedRowModel()`
- `getExpandedRowModel()`
- `getPaginationRowModel()`
- `getFacetedRowModel()`
- `getFacetedUniqueValues()`
- `getFacetedMinMaxValues()`

### 2.4 함수 카탈로그 (3개)
- `aggregationFns` — `sum`/`min`/`max`/`extent`/`mean`/`median`/`unique`/`uniqueCount`/`count`
- `filterFns` — `includesString`/`includesStringSensitive`/`equals`/`weakEquals`/`arrIncludes`/`arrIncludesAll`/`arrIncludesSome`/`equalsString`/`inNumberRange`
- `sortingFns` — `alphanumeric`/`alphanumericCaseSensitive`/`text`/`textCaseSensitive`/`datetime`/`basic`

### 2.5 utility
- `columnHelper.accessor()`/`.display()`/`.group()` (`createColumnHelper<TData>()`)
- `flexRender` (react-table 측에서)

---

## 3. TableOptions 핵심 props (확인 source: `core/table.d.ts`)

```ts
interface TableOptions<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  state?: Partial<TableState>;
  getCoreRowModel: () => RowModel<TData>;  // 필수
  getSortedRowModel?: () => RowModel<TData>;
  getFilteredRowModel?: () => RowModel<TData>;
  getPaginationRowModel?: () => RowModel<TData>;
  getExpandedRowModel?: () => RowModel<TData>;
  getGroupedRowModel?: () => RowModel<TData>;
  // ... state 변경 핸들러
  onSortingChange?: OnChangeFn<SortingState>;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  onPaginationChange?: OnChangeFn<PaginationState>;
  onColumnPinningChange?: OnChangeFn<ColumnPinningState>;
  onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
  onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  onExpandedChange?: OnChangeFn<ExpandedState>;
  onGlobalFilterChange?: OnChangeFn<any>;
  // server-side toggles
  manualPagination?: boolean;
  manualSorting?: boolean;
  manualFiltering?: boolean;
  manualGrouping?: boolean;
  pageCount?: number;
  rowCount?: number;
  // enables
  enableRowSelection?: boolean | ((row) => boolean);
  enableMultiRowSelection?: boolean | ((row) => boolean);
  enableSorting?: boolean;
  enableMultiSort?: boolean;
  enableColumnResizing?: boolean;
  columnResizeMode?: 'onChange' | 'onEnd';
  // sub-rows (tree)
  getSubRows?: (row, index) => TData[] | undefined;
  // 기타 다수
}
```

---

## 4. ColumnDef 변형 (3가지)

| 변형 | 생성 헬퍼 | 용도 |
|------|----------|------|
| `AccessorKeyColumnDef` | `columnHelper.accessor('keyName', {...})` | 단순 키 기반 |
| `AccessorFnColumnDef` | `columnHelper.accessor((row) => row.x + row.y, {...})` | 계산 컬럼 |
| `DisplayColumnDef` | `columnHelper.display({...})` | id-only (체크박스/액션) |
| `GroupColumnDef` | `columnHelper.group({header, columns:[...]})` | multi-row header 그룹 |

---

## 5. 가상화 호환 (C-18 검증)

- `@tanstack/react-virtual@^3.13.24` 별도 패키지 (peer dep 후보)
- `useVirtualizer({ count, getScrollElement, estimateSize, overscan })` → `getVirtualItems()` 반환
- TanStack Table은 가상화 모르고, **사용자가 `rows[virtualRow.index]` 매핑** (`VirtualGrid.tsx` L165 검증됨)
- 동적 행 높이: `virtualizer.measureElement` ref 패턴

---

## 6. 빠진 기능 (TanStack v8 가 제공 안 함 → 직접 구현 필요)

| 기능 | TanStack 지원? | 영향 모듈 |
|------|--------------|----------|
| 셀 인라인 편집 | ❌ (사용자가 cell renderer로 직접) | MOD-GRID-05 / MOD-GRID-10 |
| 셀 범위 선택 (Excel-style) | ❌ (row 선택은 있음, cell 범위 없음) | MOD-GRID-11 |
| Drag-fill (셀 핸들로 복사) | ❌ | MOD-GRID-11 |
| Cell merging (값 같은 셀 자동 병합) | ❌ (column grouping는 있음) | MOD-GRID-13 |
| 변경 추적 (added/edited/deleted snapshot) | ❌ | MOD-GRID-10 |
| Excel/PDF export | ❌ (xlsx 별도) | MOD-GRID-06 |
| Filter UI (UI 컴포넌트) | ❌ (state만 제공, UI는 직접) | MOD-GRID-09 |
| Master-Detail (row expand → 자식 grid) | △ (expanded state만 — 자식 grid render는 직접) | MOD-GRID-16 |
| Context menu | ❌ | MOD-GRID-16 |
| DataMap (셀 단위 lookup) | ❌ (column 단위 meta 가능) | MOD-GRID-12 |
| 컬럼 드래그 (head drag로 재정렬) | △ (columnOrder state는 있음, drag UI 없음) | MOD-GRID-07 |
| 시각 회귀 도구 (Chromatic 등) | N/A | infra |

---

## 7. 결론

- **TanStack v8 표면은 충분**: 12 features × 9 row model utility × 3 함수 카탈로그 = 모든 핵심 데이터 처리 커버
- **빈 곳은 UI 레이어**: filter UI, drag UI, cell range, export — 모두 TanStack 표준 API 위에 wrapper 가능
- **C-2 통과 검증**: 모든 신규 구현은 위 export 만 사용 (private API 접근 금지)
- **C-22 peer 검증**: `@tanstack/react-table`, `@tanstack/react-virtual`, `xlsx`, `jspdf` 는 peerDependency
