---
title: tw-grid 라이브러리 API 레퍼런스
date: 2026-05-20
audience: tw-grid 사용 개발자 (API 직접 사용 + 컴포넌트 import)
purpose: 13 패키지 (4 MIT + 8 EULA + 1 meta) 의 정확한 export + 시그니처 + 사용 예시
relatedDocs:
  - quick-start-guide.md (시작 가이드 — 신 프로젝트 도입)
  - practical-adoption-guide.md (검증 사례 — Wijmo Pro → tw-grid)
---

# tw-grid 라이브러리 API 레퍼런스

## 0. 패키지 개요

### 0.1 라이선스 + 분류

| 패키지 | 라이선스 | 분류 | 버전 | 목적 |
|---|---|---|---|---|
| **`@topgrid/grid-core`** | MIT | Free | 0.1.0 | 핵심 Grid + 컬럼 + 상태 |
| **`@topgrid/grid-renderers`** | MIT | Free | 0.1.0 | 11종 cell renderer (Text/Number/Date/Link/Button 등) |
| **`@topgrid/grid-features`** | MIT | Free | 0.3.0 | Multi-sort + Filter UI 8종 + Global search |
| **`@topgrid/grid-export`** | MIT | Free | 0.2.0 | Excel/CSV/PDF/Clipboard/Print export |
| `@topgrid/grid-license` | EULA | Pro | 0.1.0 | 라이선스 검증 + Watermark (private) |
| `@topgrid/grid-pro-header` | EULA | Pro | 0.1.0 | Multi-row header (createColumnGroup) |
| `@topgrid/grid-pro-range` | EULA | Pro | 0.1.0 | drag-range + keyboard nav + clipboard |
| `@topgrid/grid-pro-tracking` | EULA | Pro | 0.1.0 | ChangeTrackingGrid + 변경 추적 |
| `@topgrid/grid-pro-master` | EULA | Pro | 0.1.0 | MasterDetailGrid + ContextMenuGrid |
| `@topgrid/grid-pro-datamap` | EULA | Pro | 0.2.0 | DataMapCell + dropdown lookup |
| `@topgrid/grid-pro-merging` | EULA | Pro | 0.1.0 | MergingGrid (셀 병합) |
| `@topgrid/grid-pro-agg` | EULA | Pro | 0.1.0 | AggregationGrid + GroupPanel |
| `@topgrid/grid` | EULA | Pro (meta) | 0.1.0 | 12 패키지 재export facade |

### 0.2 의존성 트리

```
@topgrid/grid-core           (base)
  ├── @topgrid/grid-renderers   (uses grid-core)
  ├── @topgrid/grid-features    (uses grid-core)
  ├── @topgrid/grid-export      (uses grid-core)
  ├── @topgrid/grid-license     (uses grid-core)
  └── @topgrid/grid-pro-*       (uses grid-core + grid-license)

Peer Dependencies (all packages):
  react        ^18.0.0 || ^19.0.0
  react-dom    ^18.0.0 || ^19.0.0
  @tanstack/react-table   ^8.0.0
  @tanstack/react-virtual ^3.0.0 (가상화 사용 시)
```

### 0.3 최소 설치 (4 MIT, public)

```bash
npm install @topgrid/grid-core @topgrid/grid-renderers \
            @tanstack/react-table @tanstack/react-virtual

# 또는 features + export 추가
npm install @topgrid/grid-features @topgrid/grid-export
```

### 0.4 Pro 패키지 (EULA, npm 비공개)

Pro 8 패키지는 file: dep (monorepo) 또는 별도 private registry 로 제공. 자세한 절차는 영업/지원팀 문의.

```json
{
  "dependencies": {
    "@topgrid/grid-pro-header": "file:../topvel-grid-monorepo/packages/grid-pro-header"
  }
}
```

라이선스 키 미설정 시 "Unlicensed @topgrid/grid" watermark 표시.

---

## 1. `@topgrid/grid-core` (MIT) — 핵심 Grid

### 1.1 주요 Export

| 컴포넌트/함수 | 타입 | 설명 |
|---|---|---|
| `Grid` | Component | 기본 그리드 (TanStack Table wrapper) |
| `useGridState` | Hook | 그리드 상태 통합 hook (sort/filter/pagination/visibility) |
| `useUrlSync` | Hook | URL query param ↔ grid state 양방향 sync |
| `useStoragePersist` | Hook | localStorage 에 state 영속화 |
| `GridPagination` | Component | 페이지네이션 컴포넌트 |
| `PageSizeSelect` | Component | 페이지 크기 선택 드롭다운 |
| `TotalCount` | Component | 총 개수 표시 |
| `createColumns` | Function | `TomisColumnDef[]` → TanStack `ColumnDef[]` 변환 |
| `createGroupedColumns` | Function | grouped columns 정의 |
| `registerRenderer` | Function | 커스텀 cell renderer 등록 |
| `useColumnPersistence` | Hook | 컬럼 visibility/order 영속화 |
| `useColumnDrag` | Hook | 컬럼 드래그 reorder |
| `useColumnOrderPersist` | Hook | 컬럼 순서 영속화 |
| `ColumnVisibilityMenu` | Component | 컬럼 표시/숨김 메뉴 |
| `SortBadge` | Component | 다중 정렬 우선순위 표시 |
| `SortClearButton` | Component | 정렬 초기화 버튼 |

### 1.2 `Grid` 컴포넌트

```typescript
import { Grid, type GridProps, type GridHandle } from '@topgrid/grid-core';
import { useRef } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

interface MyRow {
  id: number;
  name: string;
  age: number;
}

const columns: ColumnDef<MyRow>[] = [
  { id: 'name', accessorKey: 'name', header: '이름' },
  { id: 'age', accessorKey: 'age', header: '나이' },
];

const data: MyRow[] = [
  { id: 1, name: '김철수', age: 30 },
  { id: 2, name: '이영희', age: 28 },
];

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
      cellClassName={(cell) => cell.column.id === 'age' ? 'text-right' : ''}
      onCellKeyDown={(cell, row, event) => { /* keyboard */ }}
      onStartEditing={(rowId, colId) => { /* edit hook */ }}
    />
  );
}
```

#### GridProps 주요 fields

```typescript
interface GridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];

  // 정렬/필터/페이징
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  paginationMode?: PaginationMode;

  // 컬럼 고정
  enableColumnPinning?: boolean;
  defaultColumnPinning?: { left?: string[]; right?: string[] };

  // 가상화
  enableVirtualization?: boolean;
  estimatedRowHeight?: number;
  virtualOverscan?: number;

  // 셀 스타일
  cellClassName?: (cell: Cell<TData, unknown>) => string;
  rowClassName?: (row: Row<TData>) => string;

  // 편집 hook
  onCellKeyDown?: (cell, row, event) => void;
  onStartEditing?: (rowId: string | number, colId: string) => void;

  // 기타
  loading?: boolean;
  emptyText?: string;
  onRowClick?: (row: TData) => void;
  className?: string;
}
```

### 1.3 `useGridState` Hook

```typescript
import { useGridState } from '@topgrid/grid-core';

function App() {
  const grid = useGridState<MyRow>({
    initialSort: [{ id: 'name', desc: false }],
    initialFilters: [],
    initialPagination: { pageIndex: 0, pageSize: 20 },
    initialColumnVisibility: {},
  });

  return (
    <Grid<MyRow>
      data={data}
      columns={columns}
      // grid.sorting, grid.filters, grid.pagination 등 spread
    />
  );
}
```

### 1.4 URL Sync

```typescript
import { useUrlSync } from '@topgrid/grid-core';

useUrlSync(gridState, {
  paramPrefix: 'list_',  // → list_sort, list_page
  serialize: { /* custom */ },
});
```

### 1.5 페이지네이션

```typescript
import { GridPagination, PageSizeSelect, TotalCount } from '@topgrid/grid-core';

<GridPagination
  table={table}
  mode="client"  // | "server"
  totalCount={1000}
  pageSizeOptions={[10, 20, 50, 100]}
  showTotalCount
  enableKeyboardNav
/>
```

---

## 2. `@topgrid/grid-renderers` (MIT) — 11종 Cell Renderer

### 2.1 사용 가능한 Cell 컴포넌트

| Component | 용도 | 주요 Props |
|---|---|---|
| `TextCell` | 일반 텍스트 | `value, className` |
| `NumberCell` | 숫자 (천단위 + 소수점) | `value, decimals, unit, locale, colorNegative` |
| `DateCell` | 날짜 포맷 | `value, format, locale` |
| `StatusBadgeCell` | 상태 배지 | `value, colorMap, defaultColor` |
| `LinkCell` | 링크 (a + onClick) | `value, label, onClick, href` |
| `ButtonCell` | 액션 버튼 | `value, label, onClick, variant, disabled, size` |
| `CheckCell` | 체크박스 | `checked, onChange, readOnly` |
| `IconCell` | 아이콘 + 라벨 | `icon, label, onClick, color` |
| `TagCell` | 태그 (다중) | `value, colorMap, gapClassName` |
| `AvatarCell` | 사용자 아바타 | `name, src, sizeClassName` |
| `ProgressCell` | 진행률 바 | `value, showLabel, barColorClassName` |
| **`EditableCell`** | **인라인 편집** | **value, editType, isEditing, onStartEdit, onCommit, onCancel** |

### 2.2 EditableCell 상세

```typescript
import { EditableCell, type EditableCellProps } from '@topgrid/grid-renderers';

interface EditableCellProps {
  value: string;
  editType: 'text' | 'number' | 'date' | 'select' | 'textarea';
  selectOptions?: Array<{ value: string; label: string }>;
  isEditing: boolean;
  onStartEdit: () => void;
  onCommit: (value: string) => void;
  onCancel: () => void;
  cellClassName?: string;
  maxLength?: number;
  align?: 'left' | 'center' | 'right';
  stopPropagationOnKeyDown?: boolean;  // 부모 keydown 차단
  initialDraft?: string;               // ★ G-7 키보드 트리거 (첫 글자)
  rowIndex?: number;
  columnId?: string;
}
```

**사용 예시** (셀 단위 편집):

```typescript
const [editingCell, setEditingCell] = useState<{
  rowId: string;
  colId: string;
  initialDraft?: string;
} | null>(null);

// 컬럼 정의의 cell renderer
cell: (info) => {
  const isEditing = editingCell?.rowId === info.row.id && editingCell?.colId === info.column.id;
  return isEditing ? (
    <EditableCell
      value={String(info.getValue() ?? '')}
      editType="text"
      isEditing={isEditing}
      onStartEdit={() => setEditingCell({ rowId: info.row.id, colId: info.column.id })}
      onCommit={(newValue) => {
        // 데이터 업데이트 + edit 종료
        setEditingCell(null);
      }}
      onCancel={() => setEditingCell(null)}
      maxLength={50}
      align="left"
      initialDraft={editingCell?.initialDraft}  // ★ G-7
    />
  ) : (
    <div onClick={() => setEditingCell({ rowId: info.row.id, colId: info.column.id })}>
      {String(info.getValue() ?? '')}
    </div>
  );
}
```

### 2.3 기타 Renderer 예시

```typescript
// 숫자
<NumberCell value={1234567} decimals={2} unit="원" colorNegative />

// 날짜
<DateCell value="2026-05-20" format="YYYY-MM-DD" />

// 상태 배지
<StatusBadgeCell
  value="ACTIVE"
  colorMap={{ ACTIVE: 'green', INACTIVE: 'gray', PENDING: 'yellow' }}
/>

// 링크
<LinkCell label="상세 보기" onClick={() => navigate(`/detail/${id}`)} />

// 버튼
<ButtonCell label="삭제" onClick={handleDelete} variant="danger" size="sm" />

// 진행률
<ProgressCell value={75} showLabel />
```

### 2.4 커스텀 Renderer 등록

```typescript
import { registerRenderer } from '@topgrid/grid-renderers';

function MyCustomCell({ value }: { value: unknown }) {
  return <span style={{ color: 'blue' }}>{String(value)}</span>;
}

registerRenderer('my-custom', MyCustomCell);

// 컬럼 정의에서
{ id: 'custom', accessorKey: 'custom', meta: { renderer: 'my-custom' } }
```

### 2.5 Format Helpers

```typescript
import { formatNumberString, formatDateTimeFromDateTimeString } from '@topgrid/grid-renderers';

formatNumberString(1234567);                        // "1,234,567"
formatNumberString(1234.5, { decimals: 2 });        // "1,234.50"
formatDateTimeFromDateTimeString('2026-05-20T10:30:00', { format: 'YYYY-MM-DD HH:mm' });
```

---

## 3. `@topgrid/grid-features` (MIT) — Sort + Filter UI

### 3.1 Multi-sort

```typescript
import { useMultiSort, SortBadge, SortClearButton } from '@topgrid/grid-core';
// 또는 grid-features 의 SortClearButton 도 동일 API

const { sorting, onSortingChange } = useMultiSort({
  maxSortCount: 3,
  initialSorting: [{ id: 'name', desc: false }],
});
```

### 3.2 Filter UI 컴포넌트

```typescript
import {
  TextFilter,
  NumberFilter,
  DateFilter,
  SelectFilter,
  FilterPopover,
  FilterIndicator,
  FilterResetButton,
  GlobalSearchInput,
} from '@topgrid/grid-features';

// 컬럼 header 에서 인라인 필터
<th>
  이름
  <FilterPopover trigger={<FilterIndicator isFiltered={column.getIsFiltered()} />}>
    <TextFilter column={column} defaultOperator="contains" />
  </FilterPopover>
</th>

// 글로벌 검색
<GlobalSearchInput table={table} debounceMs={300} placeholder="검색..." />

// 필터 초기화
<FilterResetButton table={table}>전체 필터 해제</FilterResetButton>
```

### 3.3 Filter Functions

```typescript
import { textFilterFn, numberFilterFn, dateRangeFilterFn, selectFilterFn } from '@topgrid/grid-features';

// 컬럼 정의에서
{ id: 'name', accessorKey: 'name', filterFn: textFilterFn }
{ id: 'age', accessorKey: 'age', filterFn: numberFilterFn }
{ id: 'created', accessorKey: 'created', filterFn: dateRangeFilterFn }
{ id: 'status', accessorKey: 'status', filterFn: selectFilterFn }
```

---

## 4. `@topgrid/grid-export` (MIT) — Export

### 4.1 Export 함수

```typescript
import {
  exportToExcel,
  exportToCSV,
  exportToPdf,
  copyToClipboard,
  printGrid,
  exportRowsToExcel,
  type ExcelColumn,
} from '@topgrid/grid-export';

// Excel — TanStack table 인스턴스 기반
exportToExcel(table, {
  fileName: '데이터.xlsx',
  sheetName: 'Sheet1',
  emptyBehavior: 'skip',  // | 'header-only'
  scope: 'all',           // | 'filtered' | 'page'
});

// Excel — 행 배열 + 컬럼 정의 (table 인스턴스 없이)
const cols: ExcelColumn[] = [
  { key: 'name', header: '이름', width: 12 },
  { key: 'age', header: '나이', width: 8, format: 'number' },
];
exportRowsToExcel(rows, cols, { fileName: '보고서.xlsx' });

// CSV
exportToCSV(table, { fileName: 'data.csv', delimiter: ',' });

// PDF (jspdf)
await exportToPdf(table, { fileName: 'report.pdf', orientation: 'landscape' });

// 클립보드 복사
await copyToClipboard(table, { delimiter: '\t', includeHeaders: true });

// 인쇄
printGrid(table, { title: '재고 보고서', orientation: 'portrait' });
```

### 4.2 ⚠️ jspdf optional deps

`exportToPdf` 가 jspdf 의 동적 import 4종 (fflate, html2canvas, dompurify, canvg) 사용. Excel 만 쓰면 webpack `resolve.fallback` 으로 stub:

```typescript
// next.config.ts
webpack: (config) => {
  config.resolve.fallback = {
    fflate: false,
    html2canvas: false,
    dompurify: false,
    canvg: false,
  };
  return config;
}
```

---

## 5. `@topgrid/grid-license` (EULA) — Pro 라이선스

### 5.1 라이선스 키 설정

```typescript
import { setLicenseKey, Watermark } from '@topgrid/grid-license';

// 앱 진입점 (예: layout.tsx 또는 _app.tsx)
useEffect(() => {
  setLicenseKey(process.env.NEXT_PUBLIC_TOPGRID_LICENSE_KEY ?? '');
}, []);

// Watermark — Pro 컴포넌트 사용 시 자동 표시 (라이선스 없으면)
// 별도 import 불필요. Pro 컴포넌트가 내부적으로 useWatermarkEnforcement 호출.
```

### 5.2 라이선스 상태 확인

```typescript
import { useLicenseStatus, checkLicense } from '@topgrid/grid-license';

function LicenseInfo() {
  const status = useLicenseStatus();
  // status.status: 'valid' | 'expired' | 'invalid' | 'absent'
  // status.reason: ...
  return <div>License: {status.status}</div>;
}
```

---

## 6. `@topgrid/grid-pro-header` (EULA) — Multi-row Header

### 6.1 `createColumnGroup` — 다단 헤더

```typescript
import { createColumnGroup } from '@topgrid/grid-pro-header';
import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<MyRow>[] = [
  // 상위 그룹: "기본 정보" — 2 컬럼
  createColumnGroup<MyRow>({
    header: '기본 정보',
    columns: [
      { id: 'name', accessorKey: 'name', header: '이름' },
      { id: 'age', accessorKey: 'age', header: '나이' },
    ],
  }),
  // 상위 그룹: "주소" — 2 컬럼
  createColumnGroup<MyRow>({
    header: '주소',
    columns: [
      { id: 'city', accessorKey: 'city', header: '시' },
      { id: 'zip', accessorKey: 'zip', header: '우편번호' },
    ],
  }),
];
```

### 6.2 `MultiRowHeader` 컴포넌트

```typescript
import { MultiRowHeader } from '@topgrid/grid-pro-header';

<MultiRowHeader
  table={table}
  enableStickyHeader
  frozenColumns={2}
  enableGroupToggle  // 그룹 접기/펴기
/>
```

### 6.3 `GroupedHeaderGrid` — All-in-one

```typescript
import { GroupedHeaderGrid } from '@topgrid/grid-pro-header';

<GroupedHeaderGrid<MyRow>
  data={data}
  columns={columns}  // createColumnGroup 으로 정의
  pagination={{ pageIndex: 0, pageSize: 20 }}
  onRowClick={(row) => console.log(row)}
  loading={false}
  emptyText="데이터 없음"
  enableGroupToggle
/>
```

---

## 7. `@topgrid/grid-pro-tracking` (EULA) — Change Tracking

### 7.1 `ChangeTrackingGrid` (권장)

```typescript
import { ChangeTrackingGrid, type ChangeTrackingAPI } from '@topgrid/grid-pro-tracking';
import { useRef } from 'react';

function MyEditableGrid() {
  const trackingRef = useRef<ChangeTrackingAPI<MyRow>>(null);

  const handleSave = async () => {
    const cs = trackingRef.current?.getChangeSet();
    if (!cs) return;
    await api.batchSave({
      added: cs.added,
      updated: cs.updated,
      removed: cs.removed,
    });
    trackingRef.current?.resetChanges();
  };

  return (
    <>
      <ChangeTrackingGrid<MyRow>
        ref={trackingRef}
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        // 변경된 row 시각 표시: green=added, yellow=updated, red=removed
      />
      <button onClick={handleSave}>저장</button>
      <button onClick={() => trackingRef.current?.resetChanges()}>취소</button>
    </>
  );
}
```

### 7.2 `ChangeTrackingAPI`

```typescript
interface ChangeTrackingAPI<TData> {
  // 변경 작업
  addRow(seed: Partial<TData>): string;     // returns new row key
  updateRow(key: string, patch: Partial<TData>): void;
  deleteRow(key: string): void;
  undoRow(key: string): void;                // 단일 row 변경 취소

  // 상태 조회
  hasChanges(): boolean;
  getChangeSet(): ChangeSet;

  // 일괄 작업
  resetChanges(): void;                      // 모든 변경 → baseline 복원
  commitChanges(endpoint: string, options?: CommitOptions): Promise<unknown>;
}

interface ChangeSet {
  added: MappedRow[];
  updated: MappedRow[];
  removed: MappedRow[];
  errors: Array<{ index: number; message: string; type: 'added' | 'updated' }>;
}
```

### 7.3 `useChangeTracking` Hook (저수준)

```typescript
import { useChangeTracking } from '@topgrid/grid-pro-tracking';

const tracking = useChangeTracking<MyRow>({
  initialData: data,
  getRowId: (row) => row.id,
  validators: [
    { field: 'age', fn: (val) => typeof val === 'number' && val > 0, message: '나이는 양수' },
  ],
});

// tracking 자체가 ChangeTrackingAPI 구현체
```

### 7.4 Row Status 시각화

```typescript
import { defaultRowStatusClassNames, getRowStatusClassName } from '@topgrid/grid-pro-tracking';

// 기본 색상 (Tailwind):
// added:    'bg-green-50 border-l-4 border-green-500'
// updated:  'bg-yellow-50 border-l-4 border-yellow-500'
// removed:  'bg-red-50 border-l-4 border-red-500 line-through'

// 커스텀
const customStatus = {
  added: 'bg-blue-100',
  updated: 'bg-purple-100',
  removed: 'bg-pink-100',
};
```

---

## 8. `@topgrid/grid-pro-range` (EULA) — Drag-range + Keyboard Nav

### 8.1 `useCellRange` Hook (drag-range)

```typescript
import { useCellRange, isInRange, type CellRange } from '@topgrid/grid-pro-range';

const { range, dragging, handleMouseDown, handleMouseEnter, handleMouseUp } = useCellRange();

// 각 cell <div> 에 마우스 핸들러 부착
<div
  onMouseDown={(e) => handleMouseDown(rowIdx, colIdx, e.shiftKey)}
  onMouseEnter={() => { if (dragging) handleMouseEnter(rowIdx, colIdx); }}
  className={isInRange(rowIdx, colIdx, range) ? 'bg-indigo-200' : ''}
/>

// Grid 컨테이너에 mouseup
<div onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
  <Grid ... />
</div>
```

### 8.2 `RangeSelectGrid` — All-in-one

```typescript
import { RangeSelectGrid } from '@topgrid/grid-pro-range';

<RangeSelectGrid<MyRow>
  data={data}
  columns={columns}
  enableClipboard          // Ctrl+C/V 자동
  enableKeyboardNav        // 방향키 + Tab + Enter
  enableDragFill           // Excel-style fill handle
  onCellChange={(row, col, newValue) => { /* update data */ }}
/>
```

### 8.3 `useKeyboardNav` Hook (방향키 + Tab)

```typescript
import { useKeyboardNav, type CellCoord } from '@topgrid/grid-pro-range';

const [activeCell, setActiveCell] = useState<CellCoord | null>(null);
const { handleKeyDown } = useKeyboardNav<MyRow>({
  table,
  activeCell,
  onActiveCellChange: setActiveCell,
  range,
  onRangeChange: setRange,  // useCellRange 의 onRangeChange 와 연동
});

<div onKeyDown={handleKeyDown} tabIndex={0}>
  <Grid ... />
</div>
```

### 8.4 `useClipboard` Hook (Ctrl+C/V)

```typescript
import { useClipboard, type CellUpdate } from '@topgrid/grid-pro-range';

const clipboard = useClipboard<MyRow>({
  selection: range,
  activeCell,
  rowCount: data.length,
  colCount: columns.length,
  getCellValue: (row, col) => data[row][columns[col].id],
  onPaste: (cells: CellUpdate[]) => {
    // 받은 cells 배열을 data 에 반영
  },
});

<div onKeyDown={clipboard.handleKeyDown}>...</div>
```

### 8.5 `useKeyboardEdit` Hook (Delete + 일괄 입력)

```typescript
import { useKeyboardEdit } from '@topgrid/grid-pro-range';

const keyEdit = useKeyboardEdit<MyRow>({
  selection: range,
  activeCell,
  onDeleteRange: (cells) => { /* 선택 셀 일괄 삭제 */ },
  onBulkEdit: (cells, value) => { /* printable key 일괄 입력 */ },
  onStartEdit: (rowIdx, colIdx) => { /* F2/Enter — 단일 셀 편집 */ },
});
```

### 8.6 `DragFillHandle` (Excel-style 채우기)

```typescript
import { DragFillHandle, fillRange, detectSeriesStep } from '@topgrid/grid-pro-range';

<DragFillHandle
  range={range}
  getCellValue={(row, col) => data[row][col]}
  onFillComplete={(updates) => { /* 채워진 데이터 반영 */ }}
  rowCount={data.length}
  colCount={columns.length}
  containerRef={gridContainerRef}
  getCellRect={(row, col) => ({ x, y, width, height })}
/>
```

### 8.7 TSV 유틸 (RFC 4180 호환)

```typescript
import { stringifyTsv, parseTsv } from '@topgrid/grid-pro-range';

const tsv = stringifyTsv([['a', 'b'], ['c\td', 'e\n']]);
// 'a\tb\n"c\td"\t"e\n"'

const matrix = parseTsv(tsv);
// [['a', 'b'], ['c\td', 'e\n']]
```

---

## 9. `@topgrid/grid-pro-master` (EULA) — Master-Detail + ContextMenu

### 9.1 `MasterDetailGrid`

```typescript
import { MasterDetailGrid } from '@topgrid/grid-pro-master';

<MasterDetailGrid<Order>
  data={orders}
  columns={orderColumns}
  renderDetailRow={(row) => (
    <div>
      <h3>{row.orderNo} 상세</h3>
      <ul>
        {row.items.map(item => <li key={item.id}>{item.name}</li>)}
      </ul>
    </div>
  )}
  enableExpansion
  initialExpanded={{ 0: true }}  // 0번 row 펼쳐진 상태로 시작
  enableMultiExpand
/>
```

### 9.2 `ContextMenuGrid` (우클릭 메뉴)

```typescript
import { ContextMenuGrid, type ContextMenuItem } from '@topgrid/grid-pro-master';

const menuItems = (row: MyRow): ContextMenuItem[] => [
  { label: '편집', onClick: () => editRow(row) },
  { label: '삭제', onClick: () => deleteRow(row), variant: 'danger' },
  { separator: true },
  { label: '복사', onClick: () => copyRow(row) },
];

<ContextMenuGrid<MyRow>
  data={data}
  columns={columns}
  contextMenuItems={menuItems}
/>
```

---

## 10. `@topgrid/grid-pro-datamap` (EULA) — DataMap (Lookup)

### 10.1 Static DataMap

```typescript
import { createDataMap, DataMapCell, DataMapEditor } from '@topgrid/grid-pro-datamap';

const statusMap = createDataMap({
  items: [
    { value: 'A', label: '활성' },
    { value: 'I', label: '비활성' },
    { value: 'P', label: '대기' },
  ],
  valueKey: 'value',
  labelKey: 'label',
});

// 컬럼 정의에서
{
  id: 'status',
  accessorKey: 'status',
  cell: (info) => <DataMapCell info={info} dataMap={statusMap} />,
}
```

### 10.2 Async DataMap (API 조회)

```typescript
import { createAsyncDataMap } from '@topgrid/grid-pro-datamap';

const deptMap = createAsyncDataMap({
  loadFn: async () => {
    const res = await fetch('/api/depts');
    return res.json();
  },
  valueKey: 'deptCd',
  labelKey: 'deptName',
  cache: true,
});
```

---

## 11. `@topgrid/grid-pro-merging` (EULA) — Cell Merging

```typescript
import { MergingGrid, computeMergeSpans } from '@topgrid/grid-pro-merging';

<MergingGrid<MyRow>
  data={data}
  columns={columns}
  mergeRows={{
    columns: ['category'],  // 동일 category 인접 row 병합
    direction: 'vertical',
  }}
/>
```

---

## 12. `@topgrid/grid-pro-agg` (EULA) — Aggregation + GroupPanel

```typescript
import { AggregationGrid, GroupPanel, registerAggregationFn } from '@topgrid/grid-pro-agg';

<AggregationGrid<Sale>
  data={sales}
  columns={[
    { id: 'region', accessorKey: 'region', header: '지역' },
    { id: 'product', accessorKey: 'product', header: '제품' },
    { id: 'amount', accessorKey: 'amount', header: '금액',
      aggregationFn: 'sum',  // 기본 제공: sum/avg/count/min/max/median/uniqueCount
      cell: (info) => info.getValue(),
      aggregatedCell: (info) => <strong>{formatNumberString(info.getValue() as number)}</strong>,
    },
  ]}
  enableAggregation
  grouping={['region']}
  showFooter
  showGroupPanel
/>

// 커스텀 aggregation
registerAggregationFn('mode', (values) => {
  // most frequent value
});
```

---

## 13. `@topgrid/grid` (EULA, meta facade) — All-in-one

```typescript
// 13 패키지 중 grid (meta) 한 곳에서 모두 import 가능
import {
  Grid, useGridState, EditableCell,
  ChangeTrackingGrid, useCellRange,
  createColumnGroup, AggregationGrid,
  exportRowsToExcel,
} from '@topgrid/grid';
```

번들 크기 우려 시 개별 패키지 import 권장 (tree-shaking 최적화).

---

## 14. 참조

### 14.1 TanStack Table v8 (기반)
- 공식 문서: https://tanstack.com/table/v8
- `ColumnDef`, `Table`, `Row`, `Cell`, `Header` 등 타입은 TanStack 의 것을 그대로 사용

### 14.2 패키지 별 README
각 패키지 디렉토리의 `README.md` (예: `packages/grid-core/README.md`) — 자체 사용 가이드.

### 14.3 Storybook 예시
```bash
cd D:/project/topvel_project/topvel-grid-monorepo
pnpm storybook
```
각 패키지의 `stories/*.stories.tsx` — 실 동작하는 컴포넌트 데모.

### 14.4 monorepo apps/docs
Docusaurus 기반 정식 docs (build 이슈 있음 — 별도 cycle):
- `apps/docs/docs/architecture.mdx`
- `apps/docs/docs/getting-started.mdx`
- `apps/docs/docs/migration/*`

### 14.5 라이선스 + 지원
- MIT 4 패키지: 자유 사용 (LICENSE 파일 참조)
- EULA 9 패키지: Pro 라이선스 필요. 영업/지원팀 문의.
- Issue 트래커: https://github.com/alladins/topgrid/issues
