---
title: Migration Guide for the 8 Grid Variants
sidebar_position: 1
---

# Migrating the 8 Grid Variants → `<Grid>`

:::warning Current API mismatch — rewrite pending
The `<Grid mode="client">` notation in the tables and examples **does not match the current API**. `<Grid>` currently has no top-level `mode`
prop — client mode is the default with `<Grid columns data />` and no separate flag, while server mode uses the `manualPagination`
flag or the `useServerSideData` pattern. **A rewrite to the current patterns is pending.**
:::

This document is a **reference table** for migrating the 8 Grid variant components used in the legacy codebase
to the unified `<Grid>` component of `@topgrid/grid-core` (and the related Pro packages).
The actual file-by-file migration is carried out in each Goal under MOD-GRID-17.

> **Before you read**: First read the [Incremental Migration Strategy](./incremental-strategy.md)
> to understand the rule of ≤ 5 call sites migrated per Goal (C-19).

---

## Overall Summary Table

| # | Variant | Current Status | Target Package | Key Conversion Points |
|---|------|----------|------------|----------------|
| 1 | **BaseGrid** | Not migrated (raw TanStack) | `@topgrid/grid-core` | `<Grid mode="client">` + identical props |
| 2 | **VirtualGrid** | Not migrated (`@tanstack/react-virtual`) | `@topgrid/grid-core` | `<Grid enableVirtualization rowHeight containerHeight>` |
| 3 | **TreeGrid** | Not migrated (`getExpandedRowModel`) | `@topgrid/grid-core` (legacy alias) | Use the `<TreeGrid>` alias |
| 4 | **ColumnPinGrid** | Not migrated (`ColumnPinningState`) | `@topgrid/grid-core` (legacy alias) | Use the `<ColumnPinGrid pinLeft pinRight>` alias |
| 5 | **EditableGrid** | Partially migrated (imports swapped, shell kept local) | `@topgrid/grid-renderers` + `@topgrid/grid-pro-tracking` | `<Grid enableEditing>` + `useChangeTracking` |
| 6 | **GroupedHeaderGrid** | **Fully migrated** | `@topgrid/grid-pro-header` | Keep existing imports — no further work |
| 7 | **ChangeTrackingGrid** | **Fully migrated** (compat shim) | `@topgrid/grid-pro-tracking` | No changes to existing code — the shim handles the internals |
| 8 | **RangeSelectGrid** | **Fully migrated** (wrapper) | `@topgrid/grid-pro-range` | No changes to existing code — the wrapper delegates to Pro |

---

## 1. BaseGrid

**Current status**: Not migrated — uses `@tanstack/react-table` directly

### Before: Original Props Interface

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

### After: Using the `@topgrid/grid-core` Grid

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

**Migration work**: Change the import path and add the `mode="client"` prop. All other props stay the same.

---

## 2. VirtualGrid

**Current status**: Not migrated — uses `@tanstack/react-virtual` + raw TanStack Table directly

### Before: Original Props Interface

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

### After: Using `@topgrid/grid-core` Grid with enableVirtualization

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

> **EC-06 note**: If the existing code has a `pagination` prop, remove it. VirtualGrid inherited from
> `BaseGridProps`, so the prop existed but was ignored internally.
> When using `<Grid enableVirtualization>`, the pagination prop is not supported.

---

## 3. TreeGrid

**Current status**: Not migrated — uses `getExpandedRowModel` directly

### Before: Original Props Interface

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

### After: Using the `@topgrid/grid-core` legacy alias

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

// After — legacy alias (confirm the re-export in grid-core/src/index.ts)
import { TreeGrid } from '@topgrid/grid-core';
<TreeGrid
  data={treeData}
  columns={columns}
  getSubRows={(row) => row.children}
  expandAll={false}
  onRowClick={handleRowClick}
/>
```

**Migration work**: Change the import path only. The props are 100% identical.

---

## 4. ColumnPinGrid

**Current status**: Not migrated — uses `ColumnPinningState` directly

### Before: Original Props Interface

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

### After: Using the `@topgrid/grid-core` legacy alias

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

**Migration work**: Change the import path only.

---

## 5. EditableGrid

**Current status**: Partially migrated — already uses `@topgrid/grid-renderers` + `@topgrid/grid-pro-tracking` imports,
while the component shell remains in the legacy local code

### Before: Original Props Interface

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

### After: Combining `@topgrid/grid-core` + Pro packages

```tsx
// Before (current local shell)
import { EditableGrid } from '../Grid/EditableGrid';
<EditableGrid
  data={rows}
  columns={columns}
  onDataChange={handleDataChange}
  enableChangeTracking
  rowKey="id"
/>

// After (once fully migrated — when the corresponding MOD-GRID Goal is complete)
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

> **Current status**: The import swap is complete, but the component shell is still kept local.
> Full migration will be handled in the corresponding MOD-GRID Goal.

---

## 6. GroupedHeaderGrid

**Current status**: **Fully migrated** — re-exported from `@topgrid/grid-pro-header`

### Confirmed File (actually verified)

```tsx
// legacy GroupedHeaderGrid.tsx
export { GroupedHeaderGrid } from '@topgrid/grid-pro-header';
export type { GroupedHeaderGridProps } from '@topgrid/grid-pro-header';
```

### Already complete — no further work

Existing call-site code that imports `../Grid/GroupedHeaderGrid` automatically uses
the implementation from `@topgrid/grid-pro-header`. No changes needed.

```tsx
// existing code — no changes
import { GroupedHeaderGrid } from '../Grid/GroupedHeaderGrid';
<GroupedHeaderGrid data={rows} columns={columnGroups} />
// ↑ already working through @topgrid/grid-pro-header
```

---

## 7. ChangeTrackingGrid

**Current status**: **Fully migrated** — compat shim (based on `@topgrid/grid-pro-tracking`)

### The legacy API preserved by the compat shim

```tsx
// ChangeTrackingGrid.tsx compat shim (actually verified)
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

### EC-05 — Code that uses the `ChangeTrackingHandle` ref

```tsx
// existing code — can be kept as-is thanks to the compat shim
const gridRef = useRef<ChangeTrackingHandle<MyData>>(null);
<ChangeTrackingGrid ref={gridRef} initialData={rows} columns={columns} />

// save button
const changes = gridRef.current?.getChanges();
// { added: [...], edited: [...], deleted: [...] }
```

> **No further work**: Since the shim uses `useChangeTracking` internally,
> external code needs no changes. To use the `useChangeTracking` hook directly,
> import it directly from `@topgrid/grid-pro-tracking`.

---

## 8. RangeSelectGrid

**Current status**: **Fully migrated** — `@topgrid/grid-pro-range` wrapper

### Confirmed Props Interface (actually verified)

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

### Already complete — no further work

```tsx
// existing code — no changes
import { RangeSelectGrid } from '../Grid/RangeSelectGrid';
<RangeSelectGrid
  data={rows}
  columns={columns}
  onRangeChange={(range) => console.log(range)}
/>
// ↑ internally delegating to ProRangeSelectGrid from @topgrid/grid-pro-range
```

> **Using the `useCellRange` hook directly**: If you need finer-grained control,
> import it directly from `@topgrid/grid-pro-range`.

---

## Related Documents

- [DataTable Migration Guide](./dataTable-migration.md)
- [List of Deprecated Aliases](./deprecated-aliases.md)
- [Incremental Migration Strategy](./incremental-strategy.md)
- [Live Demos](./live-demos.md)

> **Sidebar registration**: Add this document to `sidebars.ts` in the G-001 (Docusaurus config) PR (D4).
