---
title: "@topgrid/grid-pro-serverside-vue"
sidebar_label: "grid-pro-serverside-vue"
sidebar_position: 29
---

# @topgrid/grid-pro-serverside-vue

> Pro: server-side row model (SSRM) + viewport (push) row model for Vue 3 — reuses the framework-neutral @topgrid/grid-pro-serverside-core controllers. · **Commercial (EULA)**

:::info Auto-generated
This page is auto-generated from the TSDoc comments in the source code (internal markers stripped). For a curated getting-started summary, see the [API Reference](../api-reference).
:::

**20** public exports — 4 functions · 3 hooks · 0 components · 13 types · 0 constants.

## Hooks

### `useVueServerSideData`

```ts
useVueServerSideData(datasource: ServerSideDatasource<TData>, options: UseVueServerSideDataOptions): UseVueServerSideDataResult<TData>
```

### `useVueServerSideTree`

```ts
useVueServerSideTree(datasource: ServerSideDatasource<TData>, options: UseVueServerSideTreeOptions): UseVueServerSideTreeResult<TData>
```

### `useVueViewportRowModel`

```ts
useVueViewportRowModel(datasource: ViewportDatasource<TData>, options: UseVueViewportRowModelOptions): UseVueViewportRowModelResult<TData>
```

## Functions

### `buildServerPivotColumns`

Build a nested pivot-result column tree from the server's flat field keys.

```ts
buildServerPivotColumns(fields: string[], separator: string): ServerPivotColumn[]
```

| Parameter | Type | Description |
|---|---|---|
| `fields` | `string[]` | server-generated pivot-result field keys (order = desired column order). |
| `separator` | `string` | segment delimiter within a field key (default `'\|'`). |

### `checkLicense`

Synchronously checks the current license state and returns a `LicenseCheckResult`.

- If valid=false, then `watermarkRequired=true`.
- If valid and less than 60 days remain until `expiresAt`, then `expiryWarning='soon-expiring'` + `console.warn` (once).
- If valid with sufficient time before expiry, then `{ valid: true, watermarkRequired: false }`.

```ts
checkLicense(): LicenseCheckResult
```

### `isRowPlaceholder`

Type guard for placeholder rows from materialize.

```ts
isRowPlaceholder(row: unknown): row
```

### `setLicenseKey`

Global license registration API for Pro packages.
Call once from the app entry (main.tsx / App.tsx).

```ts
setLicenseKey(key: string): LicenseStatus
```

| Parameter | Type | Description |
|---|---|---|
| `key` | `string` | License key in the format Base64url(pubKey).Base64url(sig).Base64url(payload) |

**Returns** — LicenseStatus — returned immediately (synchronous wrapper; state is updated after the internal asynchronous verification completes). Note: the return value is designed as a synchronous API so it can be used immediately without a Promise. Internally it stores the result of verifySignature (async). If getLicenseState is called before the asynchronous completion, it returns the default &#123;valid:false, reason:'invalid'} value.

## Types & Interfaces

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

### `ServerSideDatasource`

Consumer-supplied datasource. The single seam between the grid and the server.

| Property | Type | Description |
|---|---|---|
| `getRows` | `unknown` |  |

### `UseVueServerSideDataOptions`

| Property | Type | Description |
|---|---|---|
| `blockSize` | `number` | Rows per block (request unit). |
| `pivot?` | `{ … }` | Server-side pivot (optional). When set, requests carry pivotMode/pivotCols/valueCols. |
| `rowCount` | `number` | Initial total row count (refined by the response's lastRow). |

### `UseVueServerSideDataResult`

| Property | Type | Description |
|---|---|---|
| `data` | `Ref<TData \| RowPlaceholder[]>` | Reactive row data — not-yet-loaded indices are RowPlaceholder (detect with isRowPlaceholder). |
| `ensureRange` | `(…) => …` | Ensure the visible range (wire the virtualization visible range here). |
| `pivotColumns` | `Ref<ServerPivotColumn[]>` | Columns derived from the server pivot result (empty array before a pivot response arrives / when not pivoting). |
| `refresh` | `(…) => …` | Invalidate the cache (epoch++) + re-request the visible range (discard in-flight responses). |
| `setColumnFilters` | `(…) => …` | Change filters (derives server parameters). |
| `setSorting` | `(…) => …` | Change sorting (derives server parameters). |
| `totalCount` | `Ref<number>` | Reactive total row count (grows as lastRow is learned). |

### `UseVueServerSideTreeOptions`

| Property | Type | Description |
|---|---|---|
| `blockSize` | `number` | Rows per block (per-node request unit). |
| `rowGroupCols` | `string[]` | Grouping columns, outermost first (e.g. ['country', 'city']). |

### `UseVueServerSideTreeResult`

| Property | Type | Description |
|---|---|---|
| `data` | `Ref<TreeDisplayRow<TData>[]>` | Reactive display rows (group/leaf, including __ssrm meta). |
| `ensureRange` | `(…) => …` | Ensure the visible range (wire the virtualization visible range here). |
| `refresh` | `(…) => …` | Invalidate the whole tree + re-request the visible range. |
| `setColumnFilters` | `(…) => …` | Change filters. |
| `setSorting` | `(…) => …` | Change sorting. |
| `toggleGroup` | `(…) => …` | Expand/collapse a group — call from the group cell renderer with row.__ssrm.groupKeys. |

### `UseVueViewportRowModelOptions`

| Property | Type | Description |
|---|---|---|
| `rowCount` | `number` | Initial total row count (refined by the datasource's setRowCount). |

### `UseVueViewportRowModelResult`

| Property | Type | Description |
|---|---|---|
| `data` | `Ref<RowPlaceholder \| TData[]>` | Reactive row data — may include RowPlaceholder (detect with isRowPlaceholder). |
| `setRange` | `(…) => …` | Notify of a visible range change (wire the virtualization library's visible range here). |
| `totalCount` | `Ref<number>` | Reactive total row count (grows as the datasource pushes). |

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
