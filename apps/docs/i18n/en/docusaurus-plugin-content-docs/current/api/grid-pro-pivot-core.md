---
title: "@topgrid/grid-pro-pivot-core"
sidebar_label: "grid-pro-pivot-core"
sidebar_position: 24
---

# @topgrid/grid-pro-pivot-core

> Framework-neutral pivot engine: declarative 2-D pivot transform + pure value reducers (no React/Vue). Consumed by @topgrid/grid-pro-pivot (React) and grid-pro-pivot-vue. · **Commercial (EULA)**

:::info Auto-generated
This page is auto-generated from the source code's TSDoc comments (internal markers scrubbed). For a curated getting-started summary, see the [API Reference](../api-reference).
:::

**22** public exports — 9 functions · 0 hooks · 0 components · 11 types · 2 constants.

## Functions

### `applyReducer`

Apply a pivot value reducer (built-in key OR custom `(number[]) => number`)
to a set of values.

```ts
applyReducer(reducer: AggregationFnKey | PivotValueReducer, values: number[]): null | number
```

| Parameter | Type | Description |
|---|---|---|
| `reducer` | `AggregationFnKey \| PivotValueReducer` | An `AggregationFnKey` or a custom `PivotValueReducer`. |
| `values` | `number[]` | Raw numeric values (may contain non-finite entries). |

**Returns** — The aggregated number, or `null` for an empty finite set.

### `collapsePivotRows`

The visible row array with descendant rows of collapsed subtotals (`__id` ∈ collapsedIds) removed. The subtotal itself remains as the group
representative; grandTotal is unchanged.

```ts
collapsePivotRows(rows: readonly PivotRow[], collapsedIds: ReadonlySet<string>): PivotRow[]
```

| Parameter | Type | Description |
|---|---|---|
| `rows` | `readonly PivotRow[]` | Pivot rows (the original `model.rows` or the result of `sortPivotRows` — composable in a chain). |
| `collapsedIds` | `ReadonlySet<string>` | The set of `__id`s of collapsed subtotals. |

### `computePivot`

The pure pivot transform — flat data → PivotModel.

Emits, in render order:
 - leaf data rows (deepest row-dimension combination),
 - per-row-group subtotal rows (one when each non-leaf row group closes),
 - a final grand-total row (all rows aggregated).

When `config.rows` is empty, a single grand-total row carries the column
aggregation. When `config.columns` is empty, every value collapses into the
grand-total column (still one cell per value-def).

```ts
computePivot(data: TData[], config: PivotConfig): PivotModel
```

### `customizePivotTotals`

Applies row-total customization to model.rows (pure, new array). Preserves data rows and their relative order (except grandTotal repositioning).

```ts
customizePivotTotals(rows: readonly PivotRow[], opts: PivotTotalsOpts): PivotRow[]
```

| Parameter | Type | Description |
|---|---|---|
| `rows` | `readonly PivotRow[]` | Pivot rows (the original `model.rows` or a transform result — composable in a chain). |
| `opts` | `PivotTotalsOpts` | PivotTotalsOpts. |

### `filterPivotRows`

Filters only data rows by a predicate (pure, new array). Preserves subtotal/grandTotal/order (true-group).

```ts
filterPivotRows(rows: readonly PivotRow[], predicate: (…) => …): PivotRow[]
```

| Parameter | Type | Description |
|---|---|---|
| `rows` | `readonly PivotRow[]` | Pivot rows (the original `model.rows` or a /44 transform result — composable in a chain). |
| `predicate` | `(…) => …` | Condition for keeping a data row (accesses aggregate cells such as `row['<colKey>__<i>']`). |

### `isBuiltInAggregationKey`

Runtime guard: is `key` one of the built-in aggregation keys?

Derives membership from `BUILT_IN_AGGREGATION_KEYS` (the shared vocabulary) —
never hardcodes the set or its size.

```ts
isBuiltInAggregationKey(key: string): key
```

### `movePivotField`

Returns a new PivotConfig with `field` moved to `toZone` (original unchanged).

```ts
movePivotField(config: PivotConfig, field: string, toZone: PivotZone): PivotConfig
```

| Parameter | Type | Description |
|---|---|---|
| `config` | `PivotConfig` | The current pivot configuration. |
| `field` | `string` | The source field name to move (may be in any zone of `config`, or unassigned). |
| `toZone` | `PivotZone` | The target zone. |

### `sortPivotRows`

A new row array with data rows sorted by their `leafKey` value within a group (segment). Preserves subtotal/grandTotal anchors.

```ts
sortPivotRows(model: PivotModel, leafKey: string, dir: PivotSortDirection): PivotRow[]
```

| Parameter | Type | Description |
|---|---|---|
| `model` | `PivotModel` | The pivot model. |
| `leafKey` | `string` | The value column key to sort by (`<comboKey>__<valueIndex>` or the grand-total column key). |
| `dir` | `PivotSortDirection` | 'asc' \| 'desc'. |

### `transposePivotConfig`

A new config with rows ↔ columns swapped (values preserved). Applying twice = the original (involution).

```ts
transposePivotConfig(config: PivotConfig): PivotConfig
```

## Types & Interfaces

### `PivotColumnNode`

A node in the column-combination tree (nested by column-dimension order).

Leaf nodes (no `children`) carry a stable `key` used to index value cells.

| Property | Type | Description |
|---|---|---|
| `children?` | `PivotColumnNode[]` | Child nodes for the next column dimension (absent on leaves). |
| `field` | `string` | Column-dimension field this level represents. |
| `key` | `string` | Stable path key for the column combination up to this node. |
| `value` | `string` | The dimension value at this node (stringified). |

### `PivotConfig`

Declarative pivot configuration.

| Property | Type | Description |
|---|---|---|
| `columns` | `string[]` | Column-dimension field names (order = header nesting order). |
| `rows` | `string[]` | Row-dimension field names (order = nesting order; one leading column each). |
| `values` | `PivotValueDef[]` | Value/measure definitions (each multiplies the column count). |

### `PivotModel`

The complete headless pivot result returned by the pure transform / `usePivot`.

| Property | Type | Description |
|---|---|---|
| `columnLeafKeys` | `string[]` | Leaf column-combination keys in left-to-right order. |
| `columnTree` | `PivotColumnNode[]` | Column-combination tree (nested by `config.columns` order). |
| `config` | `PivotConfig` | The config the model was built from (echoed for the renderer). |
| `rows` | `PivotRow[]` | Flattened rows (data + subtotals + grand-total), in render order. |

### `PivotRow`

One flattened pivot output row, ready to feed `<Grid data>`.

Row-dimension values live under their field names; each value cell lives under
a composite key (`<colComboKey>__<valueDefIndex>`). The grand-total *column*
cells use the reserved `GRAND_TOTAL_COLUMN_KEY` prefix.

| Property | Type | Description |
|---|---|---|
| `__depth` | `number` | Nesting depth (row-dimension index this row belongs to; grandTotal = -1). |
| `__id` | `string` | Stable row id (unique within the model). |
| `__kind` | `PivotRowKind` | Semantic kind (drives styling + label rendering). |

### `PivotSortState`

The currently active sort state (value column leafKey + direction).

| Property | Type | Description |
|---|---|---|
| `dir` | `PivotSortDirection` |  |
| `leafKey` | `string` |  |

### `PivotTotalsOpts`

Total customization options (all optional — unspecified = existing behavior).

| Property | Type | Description |
|---|---|---|
| `grandTotal?` | `boolean` | Whether to show the grandTotal row (default true). false → removes the grandTotal row. |
| `grandTotalPosition?` | `"top" \| "bottom"` | The grandTotal row position (default 'bottom'). 'top' → moves it to the very top. |
| `subtotals?` | `boolean` | Whether to show subtotal rows (default true). false → removes all subtotal rows. |

### `PivotValueDef`

One value (measure) definition in a pivot configuration.

| Property | Type | Description |
|---|---|---|
| `aggregationFn` | `AggregationFnKey \| PivotValueReducer` | Built-in aggregation key (`AggregationFnKey`) OR a custom reducer over `number[]` (pivot's own contract). |
| `field` | `string` | Source field whose numeric values are aggregated into each cell. |
| `label?` | `string` | Optional display label for the measure (defaults to `field`). |

### `PivotRowKind`

Discriminator marking the semantic kind of a flattened pivot row.

- `'data'` — a leaf row-group (the deepest row-dimension combination).
- `'subtotal'` — a per-row-group subtotal (a row dimension closing).
- `'grandTotal'` — the bottom grand-total row (all rows aggregated).

```ts
type PivotRowKind = "data" | "subtotal" | "grandTotal"
```

### `PivotSortDirection`

```ts
type PivotSortDirection = "asc" | "desc"
```

### `PivotValueReducer`

A custom pivot value reducer.

Pivot-specific contract: receives the matching leaf rows' numeric values for a
single field and returns one number. (Distinct from grid-pro-agg's multi-column
Row-based `AggregationFn` — see.)

```ts
type PivotValueReducer = (…) => …
```

### `PivotZone`

A drop-target zone in the pivot panel. `available` = not assigned to any dimension.

```ts
type PivotZone = "rows" | "columns" | "values" | "available"
```

## Constants

### `BUILT_IN_REDUCERS`

The built-in pure reducers, keyed by `AggregationFnKey`.

Every reducer first filters non-finite values; an empty finite set returns
`null` (callers map this straight to a `null` cell value).

```ts
const BUILT_IN_REDUCERS: Readonly<Record<AggregationFnKey, (…) => …>>
```

### `GRAND_TOTAL_COLUMN_KEY`

Reserved key prefix for the row-grand-total column combination.

```ts
const GRAND_TOTAL_COLUMN_KEY: "__grandTotalCol__"
```
