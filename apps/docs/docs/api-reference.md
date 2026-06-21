# topgrid API 레퍼런스

topgrid 13 패키지 (MIT 4 + Pro 8 + meta 1) 의 public export 와 주요 시그니처를 정리한다.
시작 가이드는 [시작하기](./getting-started) 참고. 셀 렌더러 상세는 아래 §2 참고.

타입(`ColumnDef`, `Table`, `Row`, `Cell`, `Header` 등)은 별도 표기가 없는 한
TanStack Table v8 의 것을 그대로 사용한다 (https://tanstack.com/table/v8).

---

## 0. 패키지 개요

| 패키지 | 라이선스 | 분류 | 목적 |
|---|---|---|---|
| `@topgrid/grid-core` | MIT | Free | 핵심 Grid + 상태 훅 + 페이지네이션 + 컬럼 팩토리 |
| `@topgrid/grid-renderers` | MIT | Free | 셀 렌더러 11종 + EditableCell + 레지스트리 |
| `@topgrid/grid-features` | MIT | Free | 다중 정렬 + 필터 UI + 글로벌 검색 |
| `@topgrid/grid-export` | MIT | Free | Excel / CSV / PDF / Clipboard / Print |
| `@topgrid/grid-license` | EULA | Pro | 라이선스 검증 + Watermark |
| `@topgrid/grid-pro-header` | EULA | Pro | 다단 헤더 (`createColumnGroup`) |
| `@topgrid/grid-pro-tracking` | EULA | Pro | 변경 추적 (`ChangeTrackingGrid`) |
| `@topgrid/grid-pro-range` | EULA | Pro | 범위 선택 + 키보드 nav + clipboard + drag-fill |
| `@topgrid/grid-pro-master` | EULA | Pro | Master-Detail + Context Menu |
| `@topgrid/grid-pro-datamap` | EULA | Pro | DataMap (foreign key 표시) |
| `@topgrid/grid-pro-merging` | EULA | Pro | 셀 병합 (rowSpan) |
| `@topgrid/grid-pro-agg` | EULA | Pro | 집계 (group footer) |
| `@topgrid/grid` | EULA | Pro (meta) | 전 패키지 aggregate facade |

### 의존성

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

Pro 패키지는 라이선스 키 미설정 시 `"Unlicensed @topgrid/grid"` watermark 를 표시한다.

---

## 1. `@topgrid/grid-core` (MIT)

### 1.1 주요 Export

| Export | 종류 | 설명 |
|---|---|---|
| `Grid` | Component | 기본 그리드 (TanStack Table wrapper) |
| `useGridState` | Hook | 정렬/필터/페이지/가시성 통합 상태 |
| `useUrlSync` | Hook | URL query param ↔ grid state 양방향 sync |
| `useStoragePersist` | Hook | localStorage 에 state 영속화 |
| `GridPagination` | Component | 페이지네이션 |
| `PageSizeSelect` | Component | 페이지 크기 선택 |
| `TotalCount` | Component | 총 개수 표시 |
| `createColumns` | Function | `TopgridColumnDef[]` → TanStack `ColumnDef[]` 변환 |
| `defaultRendererRegistry` / `registerRenderer` | Registry | type 기반 렌더러 디스패치 |
| `useColumnDrag` / `DropIndicator` / `useColumnOrderPersist` | Hook/Component | 컬럼 드래그 reorder + 순서 영속화 |
| `SortBadge` | Component | 다중 정렬 우선순위 배지 |
| `SortClearButton` | Component | 정렬 초기화 버튼 |

타입: `GridProps`, `GridHandle`, `GridScrollToOptions`, `BaseGridProps`,
`CellClassNameCallback`, `RowClassNameCallback`, `GridState`, `UseGridStateOptions`,
`PaginationMode`, `TopgridColumnDef`, `TopgridColumnType`, `RendererFn`,
`ColumnPersistenceOptions` 등.

> **deprecated (다음 메이저에서 제거 예정)**: `createTopgridColumnHelper`,
> `createGroupedColumns` / `TopgridColumnGroup`, `useColumnPersistence`,
> `ColumnVisibilityMenu`, 그리고 legacy 그리드 별칭 (`BaseGrid` / `VirtualGrid` /
> `ColumnPinGrid` / `GroupedHeaderGrid` / `TreeGrid`). 신규 코드는 `Grid` +
> `createColumns` 를 사용한다.

### 1.2 `Grid` 컴포넌트

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

주요 `GridProps` 필드:

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

`GridHandle` (ref) 은 `scrollToIndex` 등 imperative 메서드와 `startEditing`
(→ `onStartEditing` 콜백 위임) 을 노출한다.

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

### 1.5 페이지네이션

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

### 1.6 `createColumns` (컬럼 팩토리)

`TopgridColumnDef[]` 를 받아 TanStack `ColumnDef[]` 로 변환한다. `type` 키로 셀
렌더러를 자동 매핑한다 (렌더러 wiring 은 §2.5 참고).

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

표시 셀 11종 + 인라인 편집 셀 1종 + 포매팅 헬퍼 + 렌더러 레지스트리. 전체 prop 계약과
엣지 케이스는 아래 카탈로그·예시를 참고한다.

### 2.1 셀 카탈로그

| Component | 용도 |
|---|---|
| `TextCell` | 일반 텍스트 (빈 값 dash, `0` 보존) |
| `NumberCell` | 숫자 (천단위·소수점·단위·음수 색상) |
| `DateCell` | 날짜/일시/시각 포맷 |
| `StatusBadgeCell` | 상태값 → 색상 chip (기본 7-state 맵) |
| `LinkCell` | href / onClick / 텍스트 3분기 |
| `ButtonCell` | 액션 버튼 (variant·disabled·size) |
| `CheckCell` | 네이티브 체크박스 |
| `IconCell` | 아이콘 주입형 (+ 선택 라벨·클릭) |
| `TagCell` | 문자열 배열 → 태그 chip 목록 |
| `AvatarCell` | 아바타 이미지 + 이니셜 fallback |
| `ProgressCell` | 진행률 바 + 퍼센트 라벨 |
| `EditableCell` | 뷰↔편집 인라인 편집 |

포매팅 헬퍼: `formatNumberString`, `formatDateTimeFromDateTimeString`
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

편집 상태(어느 셀이 편집 중인지)는 그리드 컨테이너가 소유하고, 셀 내부는 `draft` 만
소유한다. commit 값은 콜백 인자로 직접 전달되어 React state 갱신 타이밍에 묶이지 않는다.

> **IME 주의**: 한국어 등 조합 입력의 첫 글자는 composition 이벤트로 처리되며,
> `initialDraft` 의 키 입력 첫 글자 보존과는 별도 범위다.

### 2.3 렌더러 예시

```tsx
<NumberCell value={1234567} decimals={2} unit="원" colorNegative />
<DateCell value="2026-05-20" format="datetime" />
<StatusBadgeCell value="active" colorMap={{ active: 'green', inactive: 'gray' }} />
<LinkCell value="상세 보기" onClick={() => navigate(`/detail/${id}`)} />
<ButtonCell value="삭제" onClick={handleDelete} variant="destructive" size="sm" />
<ProgressCell value={75} showLabel />
```

### 2.4 포매팅 헬퍼

```ts
formatNumberString(1234567);                  // "1,234,567"
formatNumberString(1234.5, { decimals: 2 });  // "1,234.50"
formatDateTimeFromDateTimeString('2026-05-20T10:30:00', { format: 'datetime' });
```

순수 함수이며, `null`/`undefined`/비유한수/유효하지 않은 날짜는 빈 문자열을 반환한다
(셀은 빈 문자열을 dash placeholder 로 표시).

### 2.5 렌더러 레지스트리 + type 디스패치

```ts
const defaultRendererRegistry: Record<string, CellComponent>;
function registerRenderer(type: string, component: CellComponent): void;
function getRenderer(type: string): CellComponent | undefined;
```

- `@topgrid/grid-renderers` 를 import 하면 side-effect 로 표시 셀 어댑터가
  `@topgrid/grid-core` 의 레지스트리에 자동 등록되어, `createColumns({ type: 'number' | ... })`
  가 실제 셀 컴포넌트로 디스패치된다.
- `registerRenderer` 로 커스텀 type 을 등록/덮어쓸 수 있다.
- `registerRenderer` / `defaultRendererRegistry` 는 `grid-core` 와 `grid-renderers`
  양쪽에서 export 되지만 동일 레지스트리를 가리킨다.

---

## 3. `@topgrid/grid-features` (MIT)

### 3.1 다중 정렬

```tsx
import { useMultiSort } from '@topgrid/grid-features';
// 배지/초기화 버튼은 grid-core:
import { SortBadge, SortClearButton } from '@topgrid/grid-core';

const { sorting, ... } = useMultiSort({
  maxSortCount: 3,
  initialSorting: [{ id: 'name', desc: false }],
});
```

> `useMultiSort` 는 `@topgrid/grid-features` 에서 export 된다. `SortBadge` /
> `SortClearButton` 의 canonical export 위치는 `@topgrid/grid-core` 이며,
> grid-features 에도 deprecation 별칭이 남아 있다 (다음 메이저에서 제거).

### 3.2 필터 UI

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

> **jspdf optional deps**: `exportToPdf` 는 `fflate` / `html2canvas` / `dompurify`
> / `canvg` 를 동적 import 한다. Excel/CSV 만 쓰면 번들러 `resolve.fallback` 으로
> 이들을 `false` stub 처리해 빌드를 통과시킨다 (getting-started §3.4).

---

## 5. `@topgrid/grid-license` (EULA)

```tsx
import { setLicenseKey, useLicenseStatus, checkLicense, Watermark } from '@topgrid/grid-license';

useEffect(() => { setLicenseKey(process.env.NEXT_PUBLIC_TOPGRID_LICENSE_KEY ?? ''); }, []);

const status = useLicenseStatus();
// status: 'valid' | 'expired' | 'invalid' | 'absent'
```

`Watermark` 는 Pro 컴포넌트 내부에서 자동으로 enforcement 되므로 별도 배치는 불필요하다.
production app 코드는 `setLicenseKey()` (정식 서명 검증 경로) 를 사용한다.

---

## 6. Pro 패키지 API

### 6.1 `@topgrid/grid-pro-header` — 다단 헤더

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

(`GroupedHeaderGrid` 도 export 되나 legacy 별칭이며 다음 메이저에서 제거 예정.)

### 6.2 `@topgrid/grid-pro-tracking` — 변경 추적

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

Row 상태 시각화 헬퍼: `getRowStatusClassName`, `defaultRowStatusClassNames`
(added=green / updated=yellow / removed=red). 저수준 훅은 `useChangeTracking`.

### 6.3 `@topgrid/grid-pro-range` — 범위 선택 + 키보드

| Export | 종류 | 설명 |
|---|---|---|
| `RangeSelectGrid` | Component | all-in-one (clipboard·keyboard·drag-fill) |
| `useCellRange` | Hook | 마우스 드래그 범위 선택 |
| `useKeyboardNav` | Hook | 방향키 + Tab 셀 이동 |
| `useClipboard` | Hook | Ctrl+C/V |
| `useKeyboardEdit` | Hook | Delete / F2·Enter / printable key 일괄 입력 |
| `DragFillHandle` | Component | Excel-style 채우기 핸들 |
| `isInRange` / `normalizeRange` | Function | 범위 판정/정규화 |
| `fillRange` / `detectSeriesStep` | Function | 채우기 시리즈 |
| `stringifyTsv` / `parseTsv` | Function | TSV (RFC 4180 호환) |

타입: `CellCoord`, `CellRange`, `CellUpdate`, `FillDirection` 등.

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

### 6.6 `@topgrid/grid-pro-merging` — 셀 병합

```tsx
import { MergingGrid, computeMergeSpans } from '@topgrid/grid-pro-merging';

<MergingGrid<MyRow>
  data={data}
  columns={columns}
  mergeRows={{ columns: ['category'], direction: 'vertical' }}
/>
```

### 6.7 `@topgrid/grid-pro-agg` — 집계

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

13 패키지를 한 곳에서 re-export 한다.

```tsx
import {
  Grid, useGridState, EditableCell,
  ChangeTrackingGrid, useCellRange,
  createColumnGroup, AggregationGrid, exportRowsToExcel,
} from '@topgrid/grid';
```

> 번들 크기를 줄이려면 meta facade 대신 개별 패키지 import 를 권장한다 (tree-shaking).

---

## 8. 참조

- TanStack Table v8: https://tanstack.com/table/v8
- 시작 가이드: [시작하기](./getting-started)
- 차트: [차트](./charting) · Next.js/SSR: [Next.js / SSR](./nextjs-ssr)
