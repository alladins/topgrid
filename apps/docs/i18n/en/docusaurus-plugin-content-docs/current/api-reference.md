# topgrid API Reference

This reference summarizes the public exports and key signatures of the **core grid packages** (the 13 listed in the §0 table below).
For the full **31-package** layout, see [Introduction](/intro) and [Architecture](./architecture); for charts (4 packages), see [Charting](./charting);
for the Vue adapter, see `@topgrid/grid-vue`. For the getting-started guide, see [Get Started](./getting-started); for cell renderer details, see §2 below.

Unless noted otherwise, types (`ColumnDef`, `Table`, `Row`, `Cell`, `Header`, etc.) are used directly from
TanStack Table v8 (https://tanstack.com/table/v8).

---

## 0. Core Packages (scope of this reference)

| Package | License | Tier | Purpose |
|---|---|---|---|
| `@topgrid/grid-core` | MIT | Free | Core Grid + state hooks + pagination + column factory |
| `@topgrid/grid-renderers` | MIT | Free | 11 cell renderers + EditableCell + registry |
| `@topgrid/grid-features` | MIT | Free | Multi-sort + filter UI + global search |
| `@topgrid/grid-export` | MIT | Free | Excel / CSV / PDF / Clipboard / Print |
| `@topgrid/grid-license` | EULA | Pro | License validation + Watermark |
| `@topgrid/grid-pro-header` | EULA | Pro | Multi-row headers (`createColumnGroup`) |
| `@topgrid/grid-pro-tracking` | EULA | Pro | Change tracking (`ChangeTrackingGrid`) |
| `@topgrid/grid-pro-range` | EULA | Pro | Range selection + keyboard nav + clipboard + drag-fill |
| `@topgrid/grid-pro-master` | EULA | Pro | Master-Detail + Context Menu |
| `@topgrid/grid-pro-datamap` | EULA | Pro | DataMap (foreign-key display) |
| `@topgrid/grid-pro-merging` | EULA | Pro | Cell merging (rowSpan) |
| `@topgrid/grid-pro-agg` | EULA | Pro | Aggregation (group footer) |
| `@topgrid/grid` | EULA | Pro (meta) | Aggregate facade for all packages |

### Dependencies

```
@topgrid/grid-core           (base)
  ├── @topgrid/grid-renderers   (uses grid-core)
  ├── @topgrid/grid-features    (uses grid-core)
  ├── @topgrid/grid-export      (uses grid-core)
  ├── @topgrid/grid-license     (uses grid-core)
  └── @topgrid/grid-pro-*       (uses grid-core + grid-license)

Peer Dependencies (전 패키지):
  react        ^18.0.0 || ^19.0.0
  react-dom    ^18.0.0 || ^19.0.0
  @tanstack/react-table    ^8.0.0
  @tanstack/react-virtual  ^3.0.0   (가상화 사용 시)
```

When no license key is set, Pro packages display the `"Unlicensed @topgrid/grid"` watermark.

---

## 1. `@topgrid/grid-core` (MIT)

### 1.1 Main Exports

| Export | Kind | Description |
|---|---|---|
| `Grid` | Component | Base grid (TanStack Table wrapper) |
| `useGridState` | Hook | Unified state for sorting / filtering / pagination / visibility |
| `useUrlSync` | Hook | Two-way sync between URL query params and grid state |
| `useStoragePersist` | Hook | Persists state to localStorage |
| `GridPagination` | Component | Pagination |
| `PageSizeSelect` | Component | Page size selector |
| `TotalCount` | Component | Total count display |
| `createColumns` | Function | Converts `TopgridColumnDef[]` to TanStack `ColumnDef[]` |
| `defaultRendererRegistry` / `registerRenderer` | Registry | Type-based renderer dispatch |
| `useColumnDrag` / `DropIndicator` / `useColumnOrderPersist` | Hook/Component | Column drag reordering + order persistence |
| `SortBadge` | Component | Multi-sort priority badge |
| `SortClearButton` | Component | Sort reset button |

Types: `GridProps`, `GridHandle`, `GridScrollToOptions`, `BaseGridProps`,
`CellClassNameCallback`, `RowClassNameCallback`, `GridState`, `UseGridStateOptions`,
`PaginationMode`, `TopgridColumnDef`, `TopgridColumnType`, `RendererFn`,
`ColumnPersistenceOptions`, and more.

> **deprecated (to be removed in the next major)**: `createTopgridColumnHelper`,
> `createGroupedColumns` / `TopgridColumnGroup`, `useColumnPersistence`,
> `ColumnVisibilityMenu`, and the legacy grid aliases (`BaseGrid` / `VirtualGrid` /
> `ColumnPinGrid` / `GroupedHeaderGrid` / `TreeGrid`). New code should use `Grid` +
> `createColumns`.

### 1.2 The `Grid` Component

```tsx
import { Grid, type GridProps, type GridHandle } from '@topgrid/grid-core';
import { useRef } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

function MyGrid() {
  const gridRef = useRef<GridHandle<MyRow>>(null);

  return (
    <Grid<MyRow>
      ref={gridRef}
      data={data}
      columns={columns}
      enableSorting
      enableColumnPinning
      defaultColumnPinning={{ left: ['name'], right: [] }}
      cellClassName={(ctx) => (ctx.columnId === 'age' ? 'text-right' : '')}
      onCellKeyDown={(ctx, event) => { /* keyboard */ }}
      onStartEditing={(rowId, colId) => { /* edit hook */ }}
    />
  );
}
```

Key `GridProps` fields:

```ts
interface GridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];

  // 정렬 / 필터 / 페이징
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  paginationMode?: PaginationMode;

  // 컬럼 고정
  enableColumnPinning?: boolean;
  defaultColumnPinning?: ColumnPinningState;  // { left?: string[]; right?: string[] }

  // 가상화 (둘 다 필요)
  enableVirtualization?: boolean;
  estimatedRowHeight?: number;
  virtualOverscan?: number;

  // 셀 / 행 스타일
  cellClassName?: CellClassNameCallback<TData>;  // (ctx: GridCellContext) => string
  rowClassName?: RowClassNameCallback<TData>;     // (row) => string

  // 편집 / 이벤트 hook
  onCellKeyDown?: (ctx: GridCellContext, event) => void;
  onStartEditing?: (rowId: string | number, colId: string) => void;
  onRowClick?: (row: TData, event: MouseEvent<HTMLTableRowElement>) => void;

  // 기타
  loading?: boolean;
  emptyText?: string;
  className?: string;
}
```

`GridHandle` (ref) exposes imperative methods such as `scrollToIndex`, plus `startEditing`
(which delegates to the `onStartEditing` callback).

### 1.3 `useGridState`

```tsx
const grid = useGridState<MyRow>({
  initialSort: [{ id: 'name', desc: false }],
  initialFilters: [],
  initialPagination: { pageIndex: 0, pageSize: 20 },
  initialColumnVisibility: {},
});
// grid.table / grid.pagination / grid.setPagination / grid.sorting ...
```

### 1.4 `useUrlSync` / `useStoragePersist`

```tsx
useUrlSync(grid, { paramPrefix: 'list_' });        // → list_sort, list_page
useStoragePersist(grid, { storageKey: 'my-grid' });
```

### 1.5 Pagination

```tsx
import { GridPagination, PageSizeSelect, TotalCount } from '@topgrid/grid-core';

<GridPagination
  table={table}
  mode="client"  // | "server"
  totalCount={1000}
  pageSizeOptions={[10, 20, 50, 100]}
  showTotalCount
/>
```

### 1.6 `createColumns` (Column Factory)

Takes `TopgridColumnDef[]` and converts it to TanStack `ColumnDef[]`. The `type` key
automatically maps each column to a cell renderer (see §2.5 for renderer wiring).

```tsx
import { createColumns } from '@topgrid/grid-core';

const columns = createColumns<MyRow>([
  { id: 'name', accessorKey: 'name', header: '이름', type: 'text' },
  { id: 'amount', accessorKey: 'amount', header: '금액', type: 'number' },
  { id: 'created', accessorKey: 'created', header: '생성일', type: 'date' },
]);
```

---

## 2. `@topgrid/grid-renderers` (MIT)

11 display cells + 1 inline-editing cell + formatting helpers + a renderer registry. See the
catalog and examples below for the full prop contracts and edge cases.

### 2.1 Cell Catalog

| Component | Use |
|---|---|
| `TextCell` | Plain text (empty value renders a dash; `0` is preserved) |
| `NumberCell` | Numbers (thousands separators, decimals, unit, negative-value color) |
| `DateCell` | Date / datetime / time formatting |
| `StatusBadgeCell` | Status value → colored chip (default 7-state map) |
| `LinkCell` | href / onClick / text (three branches) |
| `ButtonCell` | Action button (variant, disabled, size) |
| `CheckCell` | Native checkbox |
| `IconCell` | Icon injection (+ optional label and click) |
| `TagCell` | String array → list of tag chips |
| `AvatarCell` | Avatar image with initials fallback |
| `ProgressCell` | Progress bar + percent label |
| `EditableCell` | Inline view ↔ edit |

Formatting helpers: `formatNumberString`, `formatDateTimeFromDateTimeString`
(+ `FormatNumberOptions` / `FormatDateTimeOptions`).

### 2.2 `EditableCell`

```ts
type EditType = 'text' | 'number' | 'date' | 'select' | 'textarea';

interface EditableCellProps {
  value: unknown;
  editType: EditType;
  selectOptions?: ReadonlyArray<{ label: string; value: string }>;
  isEditing: boolean;                    // 편집 모드 — 컨테이너가 소유
  onStartEdit: () => void;               // 뷰 모드 클릭 시
  onCommit: (newValue: string) => void;  // Enter(textarea 제외)/Blur/Tab
  onCancel: () => void;                  // Esc
  cellClassName?: string;                // Grid-level 조건부 스타일 주입
  maxLength?: number;                    // input/textarea (select 제외)
  align?: 'left' | 'center' | 'right';   // ('left') Tailwind text-align
  stopPropagationOnKeyDown?: boolean;    // (false) 부모 keydown 차단
  initialDraft?: string;                 // ★ 키 입력 편집 시작 시 첫 글자 유실 방지
  rowIndex?: number;                     // 로깅용
  columnId?: string;                     // 로깅용
}
```

The editing state (which cell is currently being edited) is owned by the grid container,
while the cell itself only owns its `draft`. The committed value is passed directly as a callback
argument, so it is not tied to React state update timing.

> **IME note**: The first character of a composition input (such as Korean) is handled via
> composition events, which is a separate concern from `initialDraft` preserving the first character
> on keystroke-initiated edits.

### 2.3 Renderer Examples

```tsx
<NumberCell value={1234567} decimals={2} unit="원" colorNegative />
<DateCell value="2026-05-20" format="datetime" />
<StatusBadgeCell value="active" colorMap={{ active: 'green', inactive: 'gray' }} />
<LinkCell value="상세 보기" onClick={() => navigate(`/detail/${id}`)} />
<ButtonCell value="삭제" onClick={handleDelete} variant="destructive" size="sm" />
<ProgressCell value={75} showLabel />
```

### 2.4 Formatting Helpers

```ts
formatNumberString(1234567);                  // "1,234,567"
formatNumberString(1234.5, { decimals: 2 });  // "1,234.50"
formatDateTimeFromDateTimeString('2026-05-20T10:30:00', { format: 'datetime' });
```

These are pure functions, and they return an empty string for `null`/`undefined`/non-finite numbers/invalid dates
(the cell renders an empty string as a dash placeholder).

### 2.5 Renderer Registry + Type Dispatch

```ts
const defaultRendererRegistry: Record<string, CellComponent>;
function registerRenderer(type: string, component: CellComponent): void;
function getRenderer(type: string): CellComponent | undefined;
```

- Importing `@topgrid/grid-renderers` automatically registers the display-cell adapters into
  `@topgrid/grid-core`'s registry as a side effect, so that `createColumns({ type: 'number' | ... })`
  dispatches to the actual cell component.
- Use `registerRenderer` to register or override a custom type.
- `registerRenderer` / `defaultRendererRegistry` are exported from both `grid-core` and `grid-renderers`,
  but they point to the same registry.

---

## 3. `@topgrid/grid-features` (MIT)

### 3.1 Multi-Sort

```tsx
import { useMultiSort } from '@topgrid/grid-features';
// 배지/초기화 버튼은 grid-core:
import { SortBadge, SortClearButton } from '@topgrid/grid-core';

const { sorting, ... } = useMultiSort({
  maxSortCount: 3,
  initialSorting: [{ id: 'name', desc: false }],
});
```

> `useMultiSort` is exported from `@topgrid/grid-features`. The canonical export location for `SortBadge` /
> `SortClearButton` is `@topgrid/grid-core`, though deprecation aliases also remain in
> grid-features (to be removed in the next major).

### 3.2 Filter UI

```tsx
import {
  TextFilter, NumberFilter, DateFilter, SelectFilter,
  FilterPopover, FilterIndicator, FilterResetButton, GlobalSearchInput,
} from '@topgrid/grid-features';

<FilterPopover trigger={<FilterIndicator isFiltered={column.getIsFiltered()} />}>
  <TextFilter column={column} defaultOperator="contains" />
</FilterPopover>

<GlobalSearchInput table={table} debounceMs={300} placeholder="검색..." />
<FilterResetButton table={table}>전체 필터 해제</FilterResetButton>
```

### 3.3 Filter Functions

```tsx
import { textFilterFn, numberFilterFn, dateRangeFilterFn, selectFilterFn } from '@topgrid/grid-features';

{ id: 'name', accessorKey: 'name', filterFn: textFilterFn }
{ id: 'age', accessorKey: 'age', filterFn: numberFilterFn }
{ id: 'created', accessorKey: 'created', filterFn: dateRangeFilterFn }
{ id: 'status', accessorKey: 'status', filterFn: selectFilterFn }
```

---

## 4. `@topgrid/grid-export` (MIT)

```tsx
import {
  exportToExcel, exportToCSV, exportToPdf,
  copyToClipboard, printGrid, exportRowsToExcel,
  type ExcelColumn,
} from '@topgrid/grid-export';

// table 인스턴스 기반
exportToExcel(table, { fileName: '데이터.xlsx', sheetName: 'Sheet1', scope: 'all' });
exportToCSV(table, { fileName: 'data.csv', delimiter: ',' });
await exportToPdf(table, { fileName: 'report.pdf', orientation: 'landscape' });
await copyToClipboard(table, { delimiter: '\t', includeHeaders: true });
printGrid(table, { title: '보고서', orientation: 'portrait' });

// table 없이 행 배열 + 컬럼 정의로
const cols: ExcelColumn[] = [
  { key: 'name', header: '이름', width: 12 },
  { key: 'age', header: '나이', width: 8 },
];
exportRowsToExcel(rows, cols, { fileName: '보고서.xlsx' });
```

> **jspdf optional deps**: `exportToPdf` dynamically imports `fflate` / `html2canvas` / `dompurify`
> / `canvg`. If you only use Excel/CSV, stub these out as `false` via the bundler's `resolve.fallback`
> so the build passes (getting-started §3.4).

---

## 5. `@topgrid/grid-license` (EULA)

```tsx
import { setLicenseKey, useLicenseStatus, checkLicense, Watermark } from '@topgrid/grid-license';

useEffect(() => { setLicenseKey(process.env.NEXT_PUBLIC_TOPGRID_LICENSE_KEY ?? ''); }, []);

const status = useLicenseStatus();
// status: 'valid' | 'expired' | 'invalid' | 'absent'
```

`Watermark` is enforced automatically inside Pro components, so no separate placement is needed.
Production app code uses `setLicenseKey()` (the formal signature-verification path).

---

## 6. Pro Package APIs

### 6.1 `@topgrid/grid-pro-header` — Multi-Row Headers

```tsx
import { createColumnGroup, MultiRowHeader } from '@topgrid/grid-pro-header';

const columns: ColumnDef<MyRow>[] = [
  createColumnGroup<MyRow>({
    header: '기본 정보',
    columns: [
      { id: 'name', accessorKey: 'name', header: '이름' },
      { id: 'age', accessorKey: 'age', header: '나이' },
    ],
  }),
];
```

(`GroupedHeaderGrid` is also exported, but it is a legacy alias to be removed in the next major.)

### 6.2 `@topgrid/grid-pro-tracking` — Change Tracking

```tsx
import { ChangeTrackingGrid, useChangeTracking, type ChangeTrackingAPI } from '@topgrid/grid-pro-tracking';
```

```ts
interface ChangeTrackingAPI<TData> {
  addRow(seed: Partial<TData>): string;          // 새 row key 반환
  updateRow(key: string, patch: Partial<TData>): void;
  deleteRow(key: string): void;
  undoRow(key: string): void;                    // 단일 row 변경 취소

  hasChanges(): boolean;
  getChangeSet(): ChangeSet;

  resetChanges(): void;                          // 모든 변경 → baseline 복원
  commitChanges(endpoint: string, options?: CommitOptions): Promise<unknown>;
}

interface ChangeSet {
  added: MappedRow[];
  updated: MappedRow[];
  removed: MappedRow[];
  errors: Array<{ index: number; message: string; type: 'added' | 'updated' }>;
}
```

Row status visualization helpers: `getRowStatusClassName`, `defaultRowStatusClassNames`
(added=green / updated=yellow / removed=red). The low-level hook is `useChangeTracking`.

### 6.3 `@topgrid/grid-pro-range` — Range Selection + Keyboard

| Export | Kind | Description |
|---|---|---|
| `RangeSelectGrid` | Component | All-in-one (clipboard, keyboard, drag-fill) |
| `useCellRange` | Hook | Mouse-drag range selection |
| `useKeyboardNav` | Hook | Arrow-key + Tab cell navigation |
| `useClipboard` | Hook | Ctrl+C/V |
| `useKeyboardEdit` | Hook | Delete / F2·Enter / batch input via printable keys |
| `DragFillHandle` | Component | Excel-style fill handle |
| `isInRange` / `normalizeRange` | Function | Range test / normalization |
| `fillRange` / `detectSeriesStep` | Function | Fill series |
| `stringifyTsv` / `parseTsv` | Function | TSV (RFC 4180 compatible) |

Types: `CellCoord`, `CellRange`, `CellUpdate`, `FillDirection`, and more.

```tsx
import { useCellRange, isInRange, type CellRange } from '@topgrid/grid-pro-range';

const { range, dragging, handleMouseDown, handleMouseEnter, handleMouseUp } = useCellRange();

<div
  onMouseDown={(e) => handleMouseDown(rowIdx, colIdx, e.shiftKey)}
  onMouseEnter={() => { if (dragging) handleMouseEnter(rowIdx, colIdx); }}
  className={isInRange(rowIdx, colIdx, range) ? 'bg-indigo-200' : ''}
/>
<div onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
  <Grid ... />
</div>
```

### 6.4 `@topgrid/grid-pro-master` — Master-Detail + Context Menu

```tsx
import { MasterDetailGrid, ContextMenuGrid, type ContextMenuItem } from '@topgrid/grid-pro-master';

<MasterDetailGrid<Order>
  data={orders}
  columns={orderColumns}
  renderDetailRow={(row) => <OrderDetail order={row} />}
  enableExpansion
  enableMultiExpand
/>

<ContextMenuGrid<MyRow>
  data={data}
  columns={columns}
  contextMenuItems={(row) => [
    { label: '편집', onClick: () => editRow(row) },
    { label: '삭제', onClick: () => deleteRow(row), variant: 'danger' },
    { separator: true },
    { label: '복사', onClick: () => copyRow(row) },
  ]}
/>
```

### 6.5 `@topgrid/grid-pro-datamap` — DataMap

```tsx
import { createDataMap, createAsyncDataMap, DataMapCell } from '@topgrid/grid-pro-datamap';

const statusMap = createDataMap({
  items: [{ value: 'A', label: '활성' }, { value: 'I', label: '비활성' }],
  valueKey: 'value', labelKey: 'label',
});

const deptMap = createAsyncDataMap({
  loadFn: async () => (await fetch('/api/depts')).json(),
  valueKey: 'deptCd', labelKey: 'deptName', cache: true,
});

{ id: 'status', accessorKey: 'status', cell: (info) => <DataMapCell info={info} dataMap={statusMap} /> }
```

### 6.6 `@topgrid/grid-pro-merging` — Cell Merging

```tsx
import { MergingGrid, computeMergeSpans } from '@topgrid/grid-pro-merging';

<MergingGrid<MyRow>
  data={data}
  columns={columns}
  mergeRows={{ columns: ['category'], direction: 'vertical' }}
/>
```

### 6.7 `@topgrid/grid-pro-agg` — Aggregation

```tsx
import { AggregationGrid, GroupPanel, registerAggregationFn } from '@topgrid/grid-pro-agg';

<AggregationGrid<Sale>
  data={sales}
  columns={[
    { id: 'region', accessorKey: 'region', header: '지역' },
    { id: 'amount', accessorKey: 'amount', header: '금액',
      aggregationFn: 'sum',  // sum / avg / count / min / max / median / uniqueCount
      aggregatedCell: (info) => <strong>{formatNumberString(info.getValue() as number)}</strong> },
  ]}
  enableAggregation
  grouping={['region']}
  showFooter
  showGroupPanel
/>
```

---

## 7. `@topgrid/grid` (meta facade)

Re-exports all packages (about 20) from a single place.

```tsx
import {
  Grid, useGridState, EditableCell,
  ChangeTrackingGrid, useCellRange,
  createColumnGroup, AggregationGrid, exportRowsToExcel,
} from '@topgrid/grid';
```

> To reduce bundle size, prefer importing from individual packages instead of the meta facade (tree-shaking).

---

## 8. References

- TanStack Table v8: https://tanstack.com/table/v8
- Getting-started guide: [Get Started](./getting-started)
- Charts: [Charting](./charting) · Next.js/SSR: [Next.js / SSR](./nextjs-ssr)
