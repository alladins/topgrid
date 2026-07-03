---
title: "@topgrid/grid-core-headless"
sidebar_label: "grid-core-headless"
sidebar_position: 3
---

# @topgrid/grid-core-headless

> Framework-agnostic grid core (table-core based). Shared consumption by React/Vue adapters. W1 Phase 0. · **Free (MIT)**

:::info Auto-generated
This page is auto-generated from TSDoc comments in the source code (internal markers scrubbed). For a curated getting-started summary, see the [API Reference](../api-reference).
:::

**36** public exports — 14 functions · 0 hooks · 0 components · 20 types · 2 constants.

## Functions

### `buildPaginationOptions`

```ts
buildPaginationOptions(pagination: undefined | HeadlessPaginationOptions): BuildPaginationResult<TData>
```

### `buildTableOptions`

`enable*` inputs → `TableOptions` mapping.

```ts
buildTableOptions(props: TableOptionsInput<TData>, state: GridStateBag, createSelectionColumn: CreateSelectionColumn<TData>): BuildOptionsResult<TData>
```

| Parameter | Type | Description |
|---|---|---|
| `props` | `TableOptionsInput<TData>` | The structural subset of GridProps (`TableOptionsInput`). |
| `state` | `GridStateBag` | internal state + setters (framework-agnostic bag). |
| `createSelectionColumn` | `CreateSelectionColumn<TData>` | Per-framework checkbox column factory (injected). |

### `cellValueToClipboardText`

Cell value → clipboard text (pure, W1 Phase 0, ported from grid-pro-master).

A value→text mapping decoupled from the browser `navigator.clipboard` wiring. framework-agnostic —
shared by the React copy (makeCopyCellItem) and Vue copy adapters.

Mapping: null/undefined→'' (empty string, not "null"/"undefined") · object (including arrays)→JSON.stringify ·
 otherwise (string/number/boolean)→String.

```ts
cellValueToClipboardText(cell: { … }): string
```

### `dateRangeFilterFn`

```ts
dateRangeFilterFn(row: Row<unknown>, columnId: string, filterValue: any, addMeta: (…) => …): boolean
```

### `detectSeriesStep`

```ts
detectSeriesStep(values: number[]): null | number
```

### `fillRange`

```ts
fillRange(sourceRange: CellRange, direction: FillDirection, fillCount: number, getCellValue: (…) => …): CellUpdate<TCell>[]
```

### `isInRange`

```ts
isInRange(row: number, col: number, range: null | CellRange): boolean
```

### `normalizeRange`

```ts
normalizeRange(range: CellRange): CellRange
```

### `numberFilterFn`

```ts
numberFilterFn(row: Row<unknown>, columnId: string, filterValue: any, addMeta: (…) => …): boolean
```

### `parseTsv`

```ts
parseTsv(tsv: string): string[][]
```

### `resolveResetValues`

Computes the restore values for the reset target keys (pure).

- Value = `initialState[key] ?? DEFAULT_GRID_STATE_VALUES[key]` (the initial captured at mount takes precedence).
- Deduplicates keys with a `Set` (idempotent).
- Unknown keys are ignored (no-op).

Shared by both resetState (full) / resetSection (partial). Setter dispatch is per-framework (React/Vue).

```ts
resolveResetValues(keys: readonly GridStateKey[], initialState: Partial<GridStateValues<TData>>): Partial<GridStateValues<TData>>
```

| Parameter | Type | Description |
|---|---|---|
| `keys` | `readonly GridStateKey[]` | The list of keys to restore. |
| `initialState` | `Partial<GridStateValues<TData>>` | The initialState captured at mount (falls back to DEFAULT if absent). |

**Returns** — A (partial) map of the restore values for the requested valid keys.

### `selectFilterFn`

```ts
selectFilterFn(row: Row<any>, columnId: string, filterValue: any, addMeta: (…) => …): boolean
```

### `stringifyTsv`

```ts
stringifyTsv(matrix: readonly readonly unknown[][]): string
```

### `textFilterFn`

```ts
textFilterFn(row: Row<unknown>, columnId: string, filterValue: any, addMeta: (…) => …): boolean
```

## Types & Interfaces

### `BuildOptionsResult`

The result of `buildTableOptions` — spreadable into `useReactTable`/`useVueTable`.

| Property | Type | Description |
|---|---|---|
| `effectiveColumns` | `ColumnDef<TData, unknown>[]` |  |
| `options` | `Omit<TableOptions<TData>, "columns" \| "data">` |  |
| `selectionMode` | `RowSelectionMode` |  |
| `selectionOptions` | `HeadlessRowSelectionOptions<TData>` |  |

### `BuildPaginationResult`

| Property | Type | Description |
|---|---|---|
| `impliedEnablePagination` | `boolean` |  |
| `tanstackOptions` | `Partial<TableOptions<TData>>` |  |

### `CellCoord`

Pure cell range utilities — normalization · containment check · drag-fill · TSV (W1 Phase 0, ported from grid-pro-range).

All are framework-agnostic pure functions + pure data types (coordinate/rectangle/direction/update).
The React (grid-pro-range) and Vue range adapters share the same math/serialization. Render/event-agnostic.

| Property | Type | Description |
|---|---|---|
| `col` | `number` |  |
| `row` | `number` |  |

### `CellRange`

| Property | Type | Description |
|---|---|---|
| `end` | `CellCoord` |  |
| `start` | `CellCoord` |  |

### `CellUpdate`

| Property | Type | Description |
|---|---|---|
| `col` | `number` |  |
| `row` | `number` |  |
| `value` | `TCell` |  |

### `DateFilterValue`

| Property | Type | Description |
|---|---|---|
| `from?` | `Date` |  |
| `to?` | `Date` |  |

### `GridStateBag`

The internal state values + setters held by the Grid (or adapter).

| Property | Type | Description |
|---|---|---|
| `columnFilters` | `ColumnFiltersState` |  |
| `columnOrder` | `ColumnOrderState` |  |
| `columnPinning` | `ColumnPinningState` |  |
| `columnSizing` | `ColumnSizingState` |  |
| `columnVisibility` | `VisibilityState` |  |
| `expanded` | `ExpandedState` |  |
| `pagination` | `PaginationState` |  |
| `rowSelection` | `RowSelectionState` |  |
| `setColumnFilters` | `(…) => …` |  |
| `setColumnOrder` | `(…) => …` |  |
| `setColumnPinning` | `(…) => …` |  |
| `setColumnSizing` | `(…) => …` |  |
| `setColumnVisibility` | `(…) => …` |  |
| `setExpanded` | `(…) => …` |  |
| `setPagination` | `(…) => …` |  |
| `setRowSelection` | `(…) => …` |  |
| `setSorting` | `(…) => …` |  |
| `sorting` | `SortingState` |  |

### `GridStateValues`

The 8 standard grid state values.

| Property | Type | Description |
|---|---|---|
| `columnFilters` | `ColumnFiltersState` |  |
| `columnOrder` | `ColumnOrderState` |  |
| `columnPinning` | `ColumnPinningState` |  |
| `columnSizing` | `ColumnSizingState` |  |
| `columnVisibility` | `VisibilityState` |  |
| `pagination` | `PaginationState` |  |
| `rowSelection` | `RowSelectionState` |  |
| `sorting` | `SortingState` |  |

### `HeadlessPaginationOptions`

Pagination options — the subset read by buildPaginationOptions.

| Property | Type | Description |
|---|---|---|
| `manual?` | `boolean` |  |
| `mode?` | `PaginationMode` |  |
| `onPaginationChange?` | `OnChangeFn<PaginationState>` |  |
| `pageCount?` | `number` |  |
| `pageSize?` | `number` |  |
| `totalCount?` | `number` |  |

### `HeadlessRowSelectionOptions`

Row selection options — the framework-agnostic part (render callbacks excluded).

| Property | Type | Description |
|---|---|---|
| `mode?` | `RowSelectionMode` |  |
| `onSelectionChange?` | `(…) => …` |  |
| `onStateChange?` | `OnChangeFn<RowSelectionState>` |  |
| `selectAllPages?` | `boolean` |  |
| `state?` | `RowSelectionState` |  |

### `NumberFilterValue`

| Property | Type | Description |
|---|---|---|
| `max?` | `number` |  |
| `min?` | `number` |  |
| `operator` | `NumberFilterOperator` |  |
| `value?` | `number` |  |

### `TableOptionsInput`

The **structural subset** of GridProps read by `buildTableOptions`.
grid-core's React `GridProps<TData>` structurally satisfies (is assignable to) this interface.

| Property | Type | Description |
|---|---|---|
| `alwaysMultiSort?` | `boolean` |  |
| `columnResizeMode?` | `ColumnResizeMode` |  |
| `columns` | `ColumnDef<TData, unknown>[]` |  |
| `data` | `TData[]` |  |
| `debug?` | `boolean` |  |
| `enableColumnPinning?` | `boolean` |  |
| `enableColumnResizing?` | `boolean` |  |
| `enableExpanding?` | `boolean` |  |
| `enableFilter?` | `boolean` |  |
| `enableMultiSort?` | `boolean` |  |
| `enablePagination?` | `boolean` |  |
| `enableRowPinning?` | `boolean` |  |
| `enableSort?` | `boolean` |  |
| `getRowId?` | `(…) => …` |  |
| `getSubRows?` | `(…) => …` |  |
| `manualFiltering?` | `boolean` |  |
| `manualSorting?` | `boolean` |  |
| `maxMultiSortColCount?` | `number` |  |
| `onColumnFiltersChange?` | `OnChangeFn<ColumnFiltersState>` |  |
| `onColumnPinningChange?` | `OnChangeFn<ColumnPinningState>` |  |
| `onColumnSizingChange?` | `OnChangeFn<ColumnSizingState>` |  |
| `onSortingChange?` | `OnChangeFn<SortingState>` |  |
| `pagination?` | `HeadlessPaginationOptions` |  |
| `rowSelection?` | `RowSelectionMode \| HeadlessRowSelectionOptions<TData>` |  |
| `sortDescFirst?` | `boolean` |  |

### `TextFilterValue`

| Property | Type | Description |
|---|---|---|
| `operator` | `TextFilterOperator` |  |
| `value` | `string` |  |

### `CreateSelectionColumn`

Per-framework selection (checkbox) column factory — **injected**.
grid-core passes the React `createCheckboxColumn`; the Vue adapter passes the Vue version.
headless purely handles only selection normalization + the 'prepend when mode≠none' policy.

```ts
type CreateSelectionColumn = (…) => …
```

### `FillDirection`

```ts
type FillDirection = "up" | "down" | "left" | "right"
```

### `GridStateKey`

Union of the 8 state keys.

```ts
type GridStateKey = "sorting" | "columnFilters" | "rowSelection" | "pagination" | "columnPinning" | "columnOrder" | "columnSizing" | "columnVisibility"
```

### `NumberFilterOperator`

```ts
type NumberFilterOperator = "=" | "!=" | ">" | "<" | ">=" | "<=" | "between"
```

### `PaginationMode`

Pagination behavior mode (convenience shorthand).

```ts
type PaginationMode = "client" | "server" | "none"
```

### `RowSelectionMode`

Row selection mode.

```ts
type RowSelectionMode = "single" | "multi" | "none"
```

### `TextFilterOperator`

```ts
type TextFilterOperator = "contains" | "equals" | "startsWith" | "endsWith"
```

## Constants

### `DEFAULT_GRID_STATE_VALUES`

The default value of each state key — the **single source of truth**.
Both the initial values (when initialState is not provided) and reset use this constant (deduplication).

```ts
const DEFAULT_GRID_STATE_VALUES: GridStateValues<unknown>
```

### `GRID_STATE_KEYS`

All state keys (stable order).

```ts
const GRID_STATE_KEYS: readonly GridStateKey[]
```
