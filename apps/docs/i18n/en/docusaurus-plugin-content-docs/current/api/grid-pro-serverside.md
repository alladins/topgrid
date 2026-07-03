---
title: "@topgrid/grid-pro-serverside"
sidebar_label: "grid-pro-serverside"
sidebar_position: 25
---

# @topgrid/grid-pro-serverside

> Pro: server-side row model (SSRM) — block-based lazy loading, infinite scroll, server sort/filter/group with stale-response (epoch) rejection · **Commercial (EULA)**

:::info Auto-generated
This page is auto-generated from the TSDoc comments in the source code (internal markers stripped). For a curated getting-started summary, see the [API Reference](../api-reference).
:::

**61** public exports — 27 functions · 3 hooks · 0 components · 31 types · 0 constants.

## Hooks

### `useServerSideData`

```ts
useServerSideData(datasource: ServerSideDatasource<TData>, options: UseServerSideDataOptions): UseServerSideDataResult<TData>
```

### `useServerSideTree`

```ts
useServerSideTree(datasource: ServerSideDatasource<TData>, options: UseServerSideTreeOptions): UseServerSideTreeResult<TData>
```

### `useViewportRowModel`

```ts
useViewportRowModel(datasource: ViewportDatasource<TData>, options: UseViewportRowModelOptions): UseViewportRowModelResult<TData>
```

## Functions

### `acceptBlock`

Accept a block response. **Rejected (state unchanged) if `responseEpoch !== cache.epoch`** —
the request was issued for a query that has since been invalidated. On accept, the block is
stored as `loaded`; `lastRow` (when provided) sets the known total row count.

```ts
acceptBlock(cache: BlockCacheState<TData>, blockIndex: number, rows: TData[], responseEpoch: number, lastRow: number): BlockCacheState<TData>
```

### `acceptTreeBlock`

Accept a child block — **discarded unless (a) `epoch === tree.epoch` AND (b) the node still
exists** (the invariant). On accept, stores into that node's cache.

```ts
acceptTreeBlock(tree: TreeCacheState<TData>, pathKey: string, blockIndex: number, rows: TData[], epoch: number, lastRow: number): TreeCacheState<TData>
```

### `blockBounds`

Half-open absolute row range `[startRow, endRow)` of a block.

```ts
blockBounds(blockIndex: number, blockSize: number): { … }
```

### `blockIndexOf`

Block index containing an absolute row index.

```ts
blockIndexOf(rowIndex: number, blockSize: number): number
```

### `buildServerPivotColumns`

Build a nested pivot-result column tree from the server's flat field keys.

```ts
buildServerPivotColumns(fields: string[], separator: string): ServerPivotColumn[]
```

| Parameter | Type | Description |
|---|---|---|
| `fields` | `string[]` | server-generated pivot-result field keys (order = desired column order). |
| `separator` | `string` | segment delimiter within a field key (default `'\|'`). |

### `clearBlock`

Drop an in-flight block so it can be re-requested — call on a **failed** `getRows` (the
datasource contract says a rejected fetch leaves the block unloaded, re-requestable). No-op if
the epoch has since changed (invalidate already cleared it) or the block is no longer loading,
so a late failure can't disturb a fresh query.

```ts
clearBlock(cache: BlockCacheState<TData>, blockIndex: number, epoch: number): BlockCacheState<TData>
```

### `clearTreeBlock`

Drop a failed in-flight child block so it can be re-requested (epoch + node-existence guarded).

```ts
clearTreeBlock(tree: TreeCacheState<TData>, pathKey: string, blockIndex: number, epoch: number): TreeCacheState<TData>
```

### `createBlockCache`

Create an empty cache at epoch 0.

```ts
createBlockCache(blockSize: number): BlockCacheState<TData>
```

### `createServerSideController`

```ts
createServerSideController(datasource: ServerSideDatasource<TData>, options: ServerSideControllerOptions, onChange: (…) => …): ServerSideController<TData>
```

| Parameter | Type | Description |
|---|---|---|
| `datasource` | `ServerSideDatasource<TData>` |  |
| `options` | `ServerSideControllerOptions` |  |
| `onChange` | `(…) => …` | called whenever the materialized data changes (a block resolved / invalidated).  The hook wires this to `setState`. NOT called synchronously from `ensureRange` for an  unchanged cache — so a scroll→render→onChange loop cannot form (materialize is  range-independent; placeholders exist from construction). |

### `createServerSideTreeController`

```ts
createServerSideTreeController(datasource: ServerSideDatasource<TData>, options: ServerSideTreeControllerOptions, onChange: (…) => …): ServerSideTreeController<TData>
```

### `createTreeCache`

```ts
createTreeCache(blockSize: number, rowGroupCols: string[]): TreeCacheState<TData>
```

### `createViewportRowModel`

Create a viewport row-model controller. Calls `datasource.init` once with push callbacks, forwards
visible ranges via `setRange`, and re-emits a materialized array whenever the datasource pushes a
count or rows (including live in-place updates).

```ts
createViewportRowModel(datasource: ViewportDatasource<TData>, options: ViewportRowModelOptions, onChange: (…) => …): ViewportRowModel<TData>
```

### `ensureNode`

Create the node for `pathKey` if missing, stamped with the current global epoch.

```ts
ensureNode(tree: TreeCacheState<TData>, pathKey: string): TreeCacheState<TData>
```

### `ensureVisibleNodes`

Ensure every node referenced by the current display range exists (so its blocks can be planned).

```ts
ensureVisibleNodes(tree: TreeCacheState<TData>, displayStart: number, displayEnd: number): TreeCacheState<TData>
```

### `flattenTree`

The full display list (group rows + children/placeholders), in render order. Feed to `<Grid data>`.

```ts
flattenTree(tree: TreeCacheState<TData>): TreeDisplayRow<TData>[]
```

### `invalidate`

Invalidate the whole cache (AC④) — clears all blocks and **bumps the epoch** so any in-flight
response (old epoch) is later rejected by acceptBlock. Called on sort/filter/group
change or explicit `refresh`. `rowCount` is cleared (the new query may have a different total).

```ts
invalidate(cache: BlockCacheState<TData>): BlockCacheState<TData>
```

### `invalidateTree`

Invalidate the whole tree (sort/filter/grouping change) — bump the global epoch and drop every
node's blocks; `expanded` is kept (re-fetched). Any in-flight response (old epoch) is rejected.

```ts
invalidateTree(tree: TreeCacheState<TData>): TreeCacheState<TData>
```

### `isExpanded`

```ts
isExpanded(tree: TreeCacheState<TData>, groupKeys: readonly string[]): boolean
```

### `isRowPlaceholder`

Type guard for placeholder rows from materialize.

```ts
isRowPlaceholder(row: unknown): row
```

### `markLoading`

Mark a block in-flight at the **current** epoch (the request's captured epoch is `cache.epoch`).

```ts
markLoading(cache: BlockCacheState<TData>, blockIndex: number): BlockCacheState<TData>
```

### `markTreeLoading`

Mark a node's block in-flight at the current global epoch (node must exist).

```ts
markTreeLoading(tree: TreeCacheState<TData>, pathKey: string, blockIndex: number): TreeCacheState<TData>
```

### `materialize`

Materialize a `totalCount`-length array (AC④ memory note): loaded indices carry their real
row, not-yet-loaded indices carry a RowPlaceholder. Pure — feeds the existing
`<Grid enableVirtualization data>` ( shape: minimal primitive on host public surface).

```ts
materialize(cache: BlockCacheState<TData>, totalCount: number): TData | RowPlaceholder[]
```

### `materializeViewport`

Pure: build a placeholder-filled array of length `rowCount` from a sparse `index → row` map.
Not-yet-pushed indices carry a RowPlaceholder (same shape as the SSRM materialize).

```ts
materializeViewport(rows: Map<number, TData>, rowCount: number): RowPlaceholder | TData[]
```

### `pathKeyOf`

Stable key for a group path. Root = `pathKeyOf([])` === `"[]"`.

```ts
pathKeyOf(groupKeys: readonly string[]): string
```

### `planBlocks`

Block indices a visible row range needs that are **not already loaded or in-flight**
(AC① — one request per block). `visibleStartRow`/`visibleEndRow` are inclusive row indices.
Returns ascending, de-duplicated, missing-only block indices.

```ts
planBlocks(cache: BlockCacheState<TData>, visibleStartRow: number, visibleEndRow: number): number[]
```

### `planTreeBlocks`

Plan the missing blocks for a visible display range (one request per node-block). Maps the
display range to per-node local ranges, then reuses `planBlocks` per node (dedup of
loaded/in-flight). Nodes must be ensured first (ensureVisibleNodes).

```ts
planTreeBlocks(tree: TreeCacheState<TData>, displayStart: number, displayEnd: number): TreeBlockRequest[]
```

### `toggleGroup`

Expand or collapse a group. **Expand** adds the path to `expanded` and ensures its node exists.
**Collapse** removes it from `expanded` and **purges** its node + all descendant nodes (so any
in-flight child response for them is later rejected by `acceptTreeBlock`'s node-existence check).

```ts
toggleGroup(tree: TreeCacheState<TData>, groupKeys: readonly string[]): TreeCacheState<TData>
```

## Types & Interfaces

### `BlockCacheState`

Pure block-cache value. Transitions are pure functions in `./internal/blockCache` that
return a new state (never mutate). `epoch` is the query generation — bumped on
sort/filter/group change so stale in-flight responses are rejected (the SSRM invariant).

| Property | Type | Description |
|---|---|---|
| `blocks` | `Map<number, BlockState<TData>>` | blockIndex → state. |
| `blockSize` | `number` | Rows per block (fixed). |
| `epoch` | `number` | Query generation. Responses tagged with a stale epoch are discarded. |
| `rowCount` | `null \| number` | Known total row count (from `lastRow`), else null. |

### `BlockState`

Internal per-block state (rows present only when `loaded`).

| Property | Type | Description |
|---|---|---|
| `rows?` | `TData[]` |  |
| `status` | `BlockStatus` |  |

### `GetRowsRequest`

A block request: half-open row range `[startRow, endRow)` + current sort/filter.

For lazy grouping the request also carries the group path being expanded. `groupKeys`/
`rowGroupCols` are **optional** — absent/empty = flat mode (/ behavior unchanged), so
existing flat datasources keep working. The level is `groupKeys.length`; the returned block
holds **group rows** when `level < rowGroupCols.length`, otherwise **leaf rows** (AG convention).

| Property | Type | Description |
|---|---|---|
| `endRow` | `number` | One past the last row index (exclusive). |
| `filterModel` | `FilterModel` | Active filter model (server applies). |
| `groupKeys?` | `string[]` | Path of group key values to the node whose children are requested (`[]`/absent = top level). |
| `pivotCols?` | `string[]` | Pivot dimension columns (outermost first) — the values become column groups. |
| `pivotMode?` | `boolean` | Server-side pivot — **optional, absent = no pivot** (flat/group behavior unchanged). When `pivotMode` is true the server pivots `valueCols` across `pivotCols` and returns rows keyed by the generated pivot-result fields, plus the field list in GetRowsResult.pivotResultFields. |
| `rowGroupCols?` | `string[]` | Columns being grouped, outermost first (absent/empty = no grouping). |
| `sortModel` | `SortModelItem[]` | Active sort directives (server applies). |
| `startRow` | `number` | First row index (inclusive) — within the addressed group's children. |
| `valueCols?` | `string[]` | Value/measure columns aggregated within each pivot column combination. |

### `GetRowsResult`

A block response. `lastRow` carries the **total/last-row signal** the virtualizer needs to
size the scroll area: set it to the absolute total row count once the server knows the end
has been reached (e.g. a partial final block), otherwise leave undefined (more rows exist).

| Property | Type | Description |
|---|---|---|
| `lastRow?` | `number` | Absolute total row count when known (end reached), else undefined. |
| `pivotResultFields?` | `string[]` | Server-side pivot — the generated pivot-result field keys (e.g. `"East\|sales"`), in column order. The grid feeds these to `buildServerPivotColumns` to derive the dynamic column tree. Absent for non-pivot responses. (Typically identical across blocks of one query.) |
| `rows` | `TData[]` | The rows for the requested range (length ≤ endRow − startRow). |

### `RowPlaceholder`

Placeholder row emitted by materialize for not-yet-loaded indices.

| Property | Type | Description |
|---|---|---|
| `__ssrmPlaceholder` | `true` | Discriminant — consumers test this to render a loading skeleton cell. |
| `rowIndex` | `number` | Absolute row index this placeholder stands in for. |

### `ServerPivotColumn`

A derived pivot-result column: a leaf (accessorKey) or a group (columns).

| Property | Type | Description |
|---|---|---|
| `accessorKey?` | `string` | Leaf only: the row field this column reads (the full server field key). |
| `columns?` | `ServerPivotColumn[]` | Group only: nested child columns. |
| `header` | `string` | Header label (the dimension value, or the measure name for a leaf). |
| `id` | `string` | Stable id (group: the path prefix; leaf: the full field key). |

### `ServerSideController`

| Property | Type | Description |
|---|---|---|
| `ensureRange` | `unknown` |  |
| `getData` | `unknown` |  |
| `getTotalCount` | `unknown` |  |
| `refresh` | `unknown` |  |
| `setColumnFilters` | `unknown` |  |
| `setSorting` | `unknown` |  |

### `ServerSideControllerOptions`

| Property | Type | Description |
|---|---|---|
| `blockSize` | `number` |  |
| `pivot?` | `{ … }` | Server-side pivot — optional. Absent = flat/group request unchanged. |
| `rowCount` | `number` |  |

### `ServerSideDatasource`

Consumer-supplied datasource. The single seam between the grid and the server.

| Property | Type | Description |
|---|---|---|
| `getRows` | `unknown` |  |

### `ServerSideGridProps`

Props to spread onto `<Grid>`. The `data` may contain RowPlaceholder rows for
not-yet-loaded indices — detect them with `isRowPlaceholder` in a cell renderer to show a
skeleton (otherwise accessors read `undefined` → blank cells while loading).

| Property | Type | Description |
|---|---|---|
| `data` | `TData[]` |  |
| `enableVirtualization` | `true` |  |
| `manualFiltering` | `true` |  |
| `manualSorting` | `true` |  |
| `onColumnFiltersChange` | `OnChangeFn<ColumnFiltersState>` |  |
| `onSortingChange` | `OnChangeFn<SortingState>` |  |
| `virtualizerOptions` | `{ … }` |  |

### `ServerSideTreeController`

| Property | Type | Description |
|---|---|---|
| `ensureRange` | `unknown` |  |
| `getData` | `unknown` |  |
| `refresh` | `unknown` |  |
| `setColumnFilters` | `unknown` |  |
| `setSorting` | `unknown` |  |
| `toggleGroup` | `unknown` |  |

### `ServerSideTreeControllerOptions`

| Property | Type | Description |
|---|---|---|
| `blockSize` | `number` |  |
| `rowGroupCols` | `string[]` | Grouping columns, outermost first. |

### `ServerSideTreeGridProps`

Props to spread onto `<Grid>` for a lazy-group SSRM grid.

| Property | Type | Description |
|---|---|---|
| `data` | `TData[]` |  |
| `enableVirtualization` | `true` |  |
| `manualFiltering` | `true` |  |
| `manualSorting` | `true` |  |
| `onColumnFiltersChange` | `OnChangeFn<ColumnFiltersState>` |  |
| `onSortingChange` | `OnChangeFn<SortingState>` |  |
| `virtualizerOptions` | `{ … }` |  |

### `SortModelItem`

One server sort directive (column + direction). Mirrors TanStack `SortingState` item.

| Property | Type | Description |
|---|---|---|
| `colId` | `string` | Column id. |
| `sort` | `"asc" \| "desc"` | Sort direction. |

### `SsrmRowMeta`

Per-display-row metadata attached as `__ssrm` by the tree flatten. Consumers read it in a
cell renderer to draw the group toggle + indent, and pass `groupKeys` to `toggleGroup`.

| Property | Type | Description |
|---|---|---|
| `expanded?` | `boolean` | Group rows only: whether currently expanded. |
| `group` | `boolean` | True for a group row, false for a leaf row. |
| `groupKeys` | `string[]` | Group rows: path **including this group's own key** (the `toggleGroup` target). Leaf rows: parent path. |
| `level` | `number` | Depth (0 = outermost group level). |

### `TreeBlockRequest`

A block to fetch: which node (`groupKeys`/`pathKey`) and which block index within it.

| Property | Type | Description |
|---|---|---|
| `blockIndex` | `number` |  |
| `groupKeys` | `string[]` |  |
| `pathKey` | `string` |  |

### `TreeCacheState`

Hierarchical cache : a **flat** `Map<pathKey, BlockCacheState>` keyed by
`JSON.stringify(groupKeys)` — each node owns a block cache for *its children*. `epoch` is
**global** across the whole tree (sort/filter/grouping change bumps it → every node's responses
invalidate). `expanded` is the set of expanded path keys; collapsing **purges** the node.

| Property | Type | Description |
|---|---|---|
| `blockSize` | `number` |  |
| `epoch` | `number` | Global query generation — responses tagged with a stale epoch are discarded. |
| `expanded` | `Set<string>` | Expanded path keys (root `"[]"` is always conceptually expanded). |
| `nodes` | `Map<string, BlockCacheState<TData>>` | pathKey (`JSON.stringify(groupKeys)`) → that node's children block cache. |
| `rowGroupCols` | `string[]` | Grouping columns, outermost first. Level depth = `rowGroupCols.length`. |

### `UseServerSideDataOptions`

useServerSideData options.

| Property | Type | Description |
|---|---|---|
| `blockSize` | `number` | Rows per block (request granularity). |
| `pivot?` | `{ … }` | Server-side pivot — optional. When set, requests carry `pivotMode`/`pivotCols`/ `valueCols`; the response's `pivotResultFields` are surfaced as UseServerSideDataResult.pivotColumns. Absent = flat/group mode (byte-identical to before). Captured once like `datasource`. |
| `rowCount` | `number` | Initial total row count (v1: required — sizes the virtualizer up front). Refined by a `getRows` response's `lastRow` once the end is reached. (v1 memory note: a `rowCount`-length placeholder array is allocated; no LRU eviction.) |

### `UseServerSideDataResult`

useServerSideData result.

| Property | Type | Description |
|---|---|---|
| `gridProps` | `ServerSideGridProps<TData>` | Spread onto `<Grid columns={...} {...gridProps} virtualScrollHeight={...} />`. |
| `pivotColumns` | `ServerPivotColumn[]` | Server-side pivot — the derived nested pivot-result column tree from the server's `pivotResultFields` (empty until a pivot response arrives / when not pivoting). Spread into `<Grid columns={[...fixedCols,...pivotColumns]} />`. |
| `refresh` | `(…) => …` | Invalidate the cache (epoch++) and re-fetch the visible range — drops in-flight responses. |
| `totalCount` | `number` | Current known total row count (grows as `lastRow` is learned). |

### `UseServerSideTreeOptions`

useServerSideTree options.

| Property | Type | Description |
|---|---|---|
| `blockSize` | `number` | Rows per block (request granularity, per node). |
| `rowGroupCols` | `string[]` | Grouping columns, outermost first (e.g. `['country', 'city']`). |

### `UseServerSideTreeResult`

useServerSideTree result.

| Property | Type | Description |
|---|---|---|
| `gridProps` | `ServerSideTreeGridProps<TData>` | Spread onto `<Grid columns={...} {...gridProps} virtualScrollHeight={...} />`. |
| `refresh` | `(…) => …` | Invalidate the whole tree and re-fetch the visible range. |
| `toggleGroup` | `(…) => …` | Expand/collapse a group — call from a group cell renderer with `row.__ssrm.groupKeys`. |

### `UseViewportRowModelOptions`

| Property | Type | Description |
|---|---|---|
| `rowCount` | `number` | Initial total row count (refined by the datasource's `setRowCount`). |

### `UseViewportRowModelResult`

| Property | Type | Description |
|---|---|---|
| `gridProps` | `ViewportGridProps<TData>` | Spread onto `<Grid columns={...} {...gridProps} virtualScrollHeight={...} />`. |
| `totalCount` | `number` | Current known total row count (grows as the datasource pushes `setRowCount`). |

### `ViewportDatasource`

Consumer-supplied viewport datasource (AG IViewportDatasource shape).

| Property | Type | Description |
|---|---|---|
| `destroy?` | `unknown` |  |
| `init` | `unknown` |  |
| `setViewportRange` | `unknown` |  |

### `ViewportDatasourceParams`

Callbacks the controller hands the datasource so it can push counts/rows.

| Property | Type | Description |
|---|---|---|
| `setRowCount` | `(…) => …` | Set the total row count (sizes the virtualizer). |
| `setRowData` | `(…) => …` | Push rows by absolute index (in-place — re-pushing an index updates that row live). |

### `ViewportGridProps`

Props to spread onto `<Grid>`. `data` may contain RowPlaceholder rows (detect via `isRowPlaceholder`).

| Property | Type | Description |
|---|---|---|
| `data` | `TData[]` |  |
| `enableVirtualization` | `true` |  |
| `virtualizerOptions` | `{ … }` |  |

### `ViewportRowModel`

| Property | Type | Description |
|---|---|---|
| `destroy` | `unknown` |  |
| `getData` | `unknown` |  |
| `getRowCount` | `unknown` |  |
| `setRange` | `unknown` |  |

### `ViewportRowModelOptions`

| Property | Type | Description |
|---|---|---|
| `rowCount` | `number` | Initial total row count (refined by the datasource's `setRowCount`). |

### `BlockStatus`

Internal per-block status.

```ts
type BlockStatus = "loading" | "loaded"
```

### `FilterModel`

Opaque per-column filter map. The datasource interprets it; the grid never inspects it
(keeps filtering server-defined). Shape is consumer/server contract.

```ts
type FilterModel = Record<string, unknown>
```

### `TreeDisplayRow`

A display-list row: the data (or placeholder) plus `__ssrm` meta. Fed to `<Grid data>`.

```ts
type TreeDisplayRow = TData | RowPlaceholder & { … }
```
