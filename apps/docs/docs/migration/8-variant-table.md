---
title: 8개 Grid 변형 이전 가이드
sidebar_position: 1
---

# 8개 Grid 변형 → `<Grid>` 이전 가이드

이 문서는 레거시 코드베이스에서 사용하던 8개의 Grid 변형 컴포넌트를
`@topgrid/grid-core`의 통합 `<Grid>` 컴포넌트(및 관련 Pro 패키지)로 이전하는
**참조 테이블**이다. 실제 파일 단위 이전은 MOD-GRID-17 이하 각 Goal에서 수행한다.

> **읽기 전에**: [증분 이전 전략](./incremental-strategy.md)을 먼저 읽어
> Goal당 ≤ 5 사용처 이전 규칙(C-19)을 이해한다.

---

## 전체 요약 테이블

| # | 변형 | 현재 상태 | 대상 패키지 | 주요 변환 포인트 |
|---|------|----------|------------|----------------|
| 1 | **BaseGrid** | 미이전 (raw TanStack) | `@topgrid/grid-core` | `<Grid mode="client">` + 동일 props |
| 2 | **VirtualGrid** | 미이전 (`@tanstack/react-virtual`) | `@topgrid/grid-core` | `<Grid enableVirtualization rowHeight containerHeight>` |
| 3 | **TreeGrid** | 미이전 (`getExpandedRowModel`) | `@topgrid/grid-core` (legacy alias) | `<TreeGrid>` alias 사용 |
| 4 | **ColumnPinGrid** | 미이전 (`ColumnPinningState`) | `@topgrid/grid-core` (legacy alias) | `<ColumnPinGrid pinLeft pinRight>` alias 사용 |
| 5 | **EditableGrid** | 부분 이전 (import 교체, 쉘 로컬 유지) | `@topgrid/grid-renderers` + `@topgrid/grid-pro-tracking` | `<Grid enableEditing>` + `useChangeTracking` |
| 6 | **GroupedHeaderGrid** | **완전 이전** | `@topgrid/grid-pro-header` | 기존 import 유지 — 추가 작업 없음 |
| 7 | **ChangeTrackingGrid** | **완전 이전** (compat shim) | `@topgrid/grid-pro-tracking` | 기존 코드 변경 없음 — shim이 내부를 처리 |
| 8 | **RangeSelectGrid** | **완전 이전** (wrapper) | `@topgrid/grid-pro-range` | 기존 코드 변경 없음 — wrapper가 Pro로 위임 |

---

## 1. BaseGrid

**현재 상태**: 미이전 — `@tanstack/react-table` 직접 사용

### Before: 원본 Props 인터페이스

```tsx
// legacy BaseGrid.tsx
interface BaseGridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  pagination?: GridPaginationOptions;
  rowSelection?: GridRowSelectionOptions;  // { mode: 'none' | 'single' | 'multi' }
  onRowClick?: (row: TData) => void;
  onRowDoubleClick?: (row: TData) => void;
  loading?: boolean;              // default: false
  emptyText?: string;             // default: '데이터가 없습니다.'
  className?: string;
}
```

### After: `@topgrid/grid-core` Grid 사용

```tsx
import { Grid } from '@topgrid/grid-core';

// Before
import { BaseGrid } from '../Grid/BaseGrid';
<BaseGrid
  data={rows}
  columns={columns}
  pagination={{ pageSize: 20 }}
  rowSelection={{ mode: 'multi' }}
  onRowClick={handleRowClick}
  loading={isLoading}
  emptyText="조회 결과가 없습니다."
/>

// After
import { Grid } from '@topgrid/grid-core';
<Grid
  mode="client"
  data={rows}
  columns={columns}
  pagination={{ pageSize: 20 }}
  rowSelection={{ mode: 'multi' }}
  onRowClick={handleRowClick}
  loading={isLoading}
  emptyText="조회 결과가 없습니다."
/>
```

**이전 작업**: import 경로 변경 + `mode="client"` prop 추가. 나머지 props는 동일.

---

## 2. VirtualGrid

**현재 상태**: 미이전 — `@tanstack/react-virtual` + raw TanStack Table 직접 사용

### Before: 원본 Props 인터페이스

```tsx
// legacy VirtualGrid.tsx
interface VirtualGridProps<TData> extends BaseGridProps<TData> {
  rowHeight?: number;       // default: 40
  containerHeight?: number; // default: 500
  // pagination prop은 BaseGridProps에서 상속되나 VirtualGrid는 사용 안 함
  // (가상화 시 전체 데이터를 DOM 밖에서 관리)
}
// 참고: VirtualGrid는 pagination prop을 무시함 — EC-06 참조
```

### After: `@topgrid/grid-core` Grid enableVirtualization 사용

```tsx
import { Grid } from '@topgrid/grid-core';

// Before
import { VirtualGrid } from '../Grid/VirtualGrid';
<VirtualGrid
  data={largeDataset}
  columns={columns}
  rowHeight={40}
  containerHeight={600}
  onRowClick={handleRowClick}
/>

// After
import { Grid } from '@topgrid/grid-core';
<Grid
  mode="client"
  enableVirtualization
  data={largeDataset}
  columns={columns}
  rowHeight={40}
  containerHeight={600}
  onRowClick={handleRowClick}
/>
```

> **EC-06 주의**: 기존 코드에 `pagination` prop이 있으면 제거한다. VirtualGrid는
> `BaseGridProps`를 상속해 prop이 존재했으나 내부에서 무시했다.
> `<Grid enableVirtualization>` 사용 시 pagination prop은 지원하지 않는다.

---

## 3. TreeGrid

**현재 상태**: 미이전 — `getExpandedRowModel` 직접 사용

### Before: 원본 Props 인터페이스

```tsx
// legacy TreeGrid.tsx
interface TreeGridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  getSubRows?: (row: TData) => TData[] | undefined;
  expandAll?: boolean;     // default: false
  onRowClick?: (row: TData) => void;
  loading?: boolean;       // default: false
  emptyText?: string;      // default: '데이터가 없습니다.'
  className?: string;
}
```

### After: `@topgrid/grid-core` legacy alias 사용

```tsx
// Before
import { TreeGrid } from '../Grid/TreeGrid';
<TreeGrid
  data={treeData}
  columns={columns}
  getSubRows={(row) => row.children}
  expandAll={false}
  onRowClick={handleRowClick}
/>

// After — legacy alias (grid-core/src/index.ts에서 re-export 확인)
import { TreeGrid } from '@topgrid/grid-core';
<TreeGrid
  data={treeData}
  columns={columns}
  getSubRows={(row) => row.children}
  expandAll={false}
  onRowClick={handleRowClick}
/>
```

**이전 작업**: import 경로만 변경. props는 100% 동일.

---

## 4. ColumnPinGrid

**현재 상태**: 미이전 — `ColumnPinningState` 직접 사용

### Before: 원본 Props 인터페이스

```tsx
// legacy ColumnPinGrid.tsx
interface ColumnPinGridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  pinLeft?: string[];    // Column IDs to pin left, default: []
  pinRight?: string[];   // Column IDs to pin right, default: []
  pagination?: GridPaginationOptions;
  rowSelection?: GridRowSelectionOptions;
  onRowClick?: (row: TData) => void;
  loading?: boolean;
  emptyText?: string;
  className?: string;
}
```

### After: `@topgrid/grid-core` legacy alias 사용

```tsx
// Before
import { ColumnPinGrid } from '../Grid/ColumnPinGrid';
<ColumnPinGrid
  data={rows}
  columns={columns}
  pinLeft={['id', 'name']}
  pinRight={['actions']}
  pagination={{ pageSize: 20 }}
  onRowClick={handleRowClick}
/>

// After — legacy alias
import { ColumnPinGrid } from '@topgrid/grid-core';
<ColumnPinGrid
  data={rows}
  columns={columns}
  pinLeft={['id', 'name']}
  pinRight={['actions']}
  pagination={{ pageSize: 20 }}
  onRowClick={handleRowClick}
/>
```

**이전 작업**: import 경로만 변경.

---

## 5. EditableGrid

**현재 상태**: 부분 이전 — `@topgrid/grid-renderers` + `@topgrid/grid-pro-tracking` import 사용 중,
컴포넌트 쉘은 레거시 로컬에 유지

### Before: 원본 Props 인터페이스

```tsx
// legacy EditableGrid.tsx
interface EditableGridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  onDataChange?: (rowIndex: number, colId: string, value: unknown) => void;
  pagination?: GridPaginationOptions;
  loading?: boolean;                      // default: false
  emptyText?: string;                     // default: '데이터가 없습니다.'
  className?: string;
  // G-005 additive props (backward-compatible):
  enableChangeTracking?: boolean;         // default: false
  rowKey?: keyof TData | ((row: TData) => string);
}
```

### After: `@topgrid/grid-core` + pro 패키지 조합

```tsx
// Before (현재 로컬 쉘)
import { EditableGrid } from '../Grid/EditableGrid';
<EditableGrid
  data={rows}
  columns={columns}
  onDataChange={handleDataChange}
  enableChangeTracking
  rowKey="id"
/>

// After (완전 이전 완료 후 — 해당 MOD-GRID Goal 완성 시)
import { Grid } from '@topgrid/grid-core';
import { useChangeTracking } from '@topgrid/grid-pro-tracking';

function MyPage() {
  const tracking = useChangeTracking({ data: rows, rowKey: (row) => row.id });

  return (
    <Grid
      mode="client"
      enableEditing
      keyboardEdit
      data={tracking.rows}
      columns={columns}
      onCellCommit={(rowIndex, colId, value) => {
        tracking.updateRow(rowIndex, colId, value);
      }}
    />
  );
}
```

> **현재 상태**: import 교체는 완료됐으나 컴포넌트 쉘은 로컬 유지 중.
> 완전 이전은 해당 MOD-GRID Goal에서 처리한다.

---

## 6. GroupedHeaderGrid

**현재 상태**: **완전 이전 완료** — `@topgrid/grid-pro-header`에서 re-export

### 확인된 파일 (실제 확인)

```tsx
// legacy GroupedHeaderGrid.tsx
export { GroupedHeaderGrid } from '@topgrid/grid-pro-header';
export type { GroupedHeaderGridProps } from '@topgrid/grid-pro-header';
```

### 이미 완료 — 추가 작업 없음

기존 사용처 코드는 `../Grid/GroupedHeaderGrid`를 import하면 자동으로
`@topgrid/grid-pro-header`의 구현을 사용한다. 변경 불필요.

```tsx
// 기존 코드 — 변경 없음
import { GroupedHeaderGrid } from '../Grid/GroupedHeaderGrid';
<GroupedHeaderGrid data={rows} columns={columnGroups} />
// ↑ 이미 @topgrid/grid-pro-header를 통해 동작 중
```

---

## 7. ChangeTrackingGrid

**현재 상태**: **완전 이전 완료** — compat shim (`@topgrid/grid-pro-tracking` 기반)

### compat shim이 보존하는 구 API

```tsx
// ChangeTrackingGrid.tsx compat shim (실제 확인)
export interface ChangeTrackingHandle<TData> {
  getChanges: () => { added: TData[]; edited: TData[]; deleted: TData[] };
  resetChanges: () => void;
  addRow: (row: TData) => void;
  deleteRow: (rowIndex: number) => void;
  // G-005 additive
  commitChanges?: (endpoint: string, options?: CommitOptions) => Promise<unknown>;
}

interface ChangeTrackingGridProps<TData> {
  initialData: TData[];
  // ...columns, onRowClick, loading, emptyText, className
}
```

### EC-05 — `ChangeTrackingHandle` ref 사용 코드

```tsx
// 기존 코드 — compat shim 덕분에 그대로 유지 가능
const gridRef = useRef<ChangeTrackingHandle<MyData>>(null);
<ChangeTrackingGrid ref={gridRef} initialData={rows} columns={columns} />

// 저장 버튼
const changes = gridRef.current?.getChanges();
// { added: [...], edited: [...], deleted: [...] }
```

> **추가 작업 없음**: shim이 내부적으로 `useChangeTracking`을 사용하므로
> 외부 코드는 변경 불필요. `useChangeTracking` hook을 직접 사용하려면
> `@topgrid/grid-pro-tracking`에서 직접 import한다.

---

## 8. RangeSelectGrid

**현재 상태**: **완전 이전 완료** — `@topgrid/grid-pro-range` wrapper

### 확인된 Props 인터페이스 (실제 확인)

```tsx
// legacy RangeSelectGrid.tsx
interface RangeSelectGridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  onRangeChange?: (range: CellRange | null) => void;
  loading?: boolean;
  emptyText?: string;
  className?: string;
}
// L0 backward-compat re-export
export type { CellRange as SelectedRange };
```

### 이미 완료 — 추가 작업 없음

```tsx
// 기존 코드 — 변경 없음
import { RangeSelectGrid } from '../Grid/RangeSelectGrid';
<RangeSelectGrid
  data={rows}
  columns={columns}
  onRangeChange={(range) => console.log(range)}
/>
// ↑ 내부적으로 @topgrid/grid-pro-range의 ProRangeSelectGrid에 위임 중
```

> **`useCellRange` hook 직접 사용**: 더 세밀한 제어가 필요하면
> `@topgrid/grid-pro-range`에서 직접 import한다.

---

## 관련 문서

- [DataTable 이전 가이드](./dataTable-migration.md)
- [Deprecated Alias 목록](./deprecated-aliases.md)
- [증분 이전 전략](./incremental-strategy.md)
- [Live 데모](./live-demos.md)

> **사이드바 등록**: G-001(Docusaurus 설정) PR에서 `sidebars.ts`에 이 문서를 추가한다 (D4).
