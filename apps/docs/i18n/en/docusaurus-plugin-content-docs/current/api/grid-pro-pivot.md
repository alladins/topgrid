---
title: "@topgrid/grid-pro-pivot"
sidebar_label: "grid-pro-pivot"
sidebar_position: 23
---

# @topgrid/grid-pro-pivot

> Pro: declarative 2-D pivot table (row × column dimensions × value aggregation) over &lt;Grid> · **Commercial (EULA)**

:::info Auto-generated
This page is auto-generated from the TSDoc comments in the source code (internal markers scrubbed). For a curated getting-started summary, see the [API Reference](../api-reference).
:::

**31** public exports — 10 functions · 1 hooks · 2 components · 16 types · 2 constants.

## Components

### `PivotGrid`

`PivotGrid` — declarative 2-D pivot table over grid-core `<Grid>`.

```ts
PivotGrid(__namedParameters: PivotGridProps<TData>): Element
```

**Example**

```tsx
<PivotGrid
  data={sales}
  config={{
    rows: ['region'],
    columns: ['quarter'],
    values: [{ field: 'sales', aggregationFn: 'sum' }],
  }}
/>
```

### `PivotPanel`

`PivotPanel` — drag fields between Available / Rows / Columns / Values to
configure a pivot. Pair it with a `<PivotGrid>` driven by the same `config`
state so dropping a field re-pivots the grid.

```ts
PivotPanel(__namedParameters: PivotPanelProps): ReactElement
```

## Hooks

### `usePivot`

Compute a memoised PivotModel from flat data + a pivot config.

```ts
usePivot(data: TData[], config: PivotConfig): PivotModel
```

| Parameter | Type | Description |
|---|---|---|
| `data` | `TData[]` | Flat source rows. |
| `config` | `PivotConfig` | Row/column dimensions + value (measure) definitions. |

**Returns** — A memoised pivot model (recomputed when `data` or `config` change).

**Example**

```ts
const model = usePivot(rows, {
  rows: ['region'],
  columns: ['quarter'],
  values: [{ field: 'sales', aggregationFn: 'sum' }],
});
```

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

### `buildPivotColumns`

Build the full `<Grid>` column set from a pivot model.

```ts
buildPivotColumns(model: PivotModel, sort: PivotSortOpts, collapse: PivotCollapseOpts, colCollapse: PivotColumnCollapseOpts): ColumnDef<PivotRow>[]
```

| Parameter | Type | Description |
|---|---|---|
| `model` | `PivotModel` | The headless pivot model. |
| `sort` | `PivotSortOpts` |  |
| `collapse` | `PivotCollapseOpts` |  |
| `colCollapse` | `PivotColumnCollapseOpts` |  |

**Returns** — Declarative `ColumnDef<PivotRow>[]` (leading row-dimension columns +  nested value column groups + grand-total group).

### `collapsePivotRows`

The visible row array with the descendant rows of collapsed subtotals (`__id` ∈ collapsedIds) removed. The subtotal itself remains as the group
representative; grandTotal is unchanged.

```ts
collapsePivotRows(rows: readonly PivotRow[], collapsedIds: ReadonlySet<string>): PivotRow[]
```

| Parameter | Type | Description |
|---|---|---|
| `rows` | `readonly PivotRow[]` | Pivot rows (the original `model.rows` or the result of `sortPivotRows` — composition chaining possible). |
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

Apply row-total customization to `model.rows` (pure, new array). Data rows and relative order are preserved (except grandTotal movement).

```ts
customizePivotTotals(rows: readonly PivotRow[], opts: PivotTotalsOpts): PivotRow[]
```

| Parameter | Type | Description |
|---|---|---|
| `rows` | `readonly PivotRow[]` | Pivot rows (the original `model.rows` or a transform result — composition chaining possible). |
| `opts` | `PivotTotalsOpts` | PivotTotalsOpts. |

### `filterPivotRows`

Filter only data rows by a predicate (pure, new array). subtotal/grandTotal/order are preserved (true-group).

```ts
filterPivotRows(rows: readonly PivotRow[], predicate: (…) => …): PivotRow[]
```

| Parameter | Type | Description |
|---|---|---|
| `rows` | `readonly PivotRow[]` | Pivot rows (the original `model.rows` or a /44 transform result — composition chaining possible). |
| `predicate` | `(…) => …` | The keep condition for data rows (accessing aggregation cells `row['<colKey>__<i>']` etc.). |

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
| `field` | `string` | The source field name to move (may be in any zone of `config` / or unassigned). |
| `toZone` | `PivotZone` | The target zone. |

### `sortPivotRows`

A new row array with data rows sorted by the `leafKey` value within each group (segment). subtotal/grandTotal anchors are maintained.

```ts
sortPivotRows(model: PivotModel, leafKey: string, dir: PivotSortDirection): PivotRow[]
```

| Parameter | Type | Description |
|---|---|---|
| `model` | `PivotModel` | The pivot model. |
| `leafKey` | `string` | The value column key to sort by (`<comboKey>__<valueIndex>` or a grand-total column key). |
| `dir` | `PivotSortDirection` | 'asc' \| 'desc'. |

### `transposePivotConfig`

A new config with rows ↔ columns swapped (values preserved). Applying it twice = the original (involution).

```ts
transposePivotConfig(config: PivotConfig): PivotConfig
```

## Types & Interfaces

### `PivotCollapseOpts`

Row-group collapse affordance options. When specified, the subtotal row label becomes click→toggle + chevron (▶/▼).
When unspecified, the subtotal label is plain text as before (behavior unchanged).

| Property | Type | Description |
|---|---|---|
| `collapsedIds` | `ReadonlySet<string>` |  |
| `onToggle` | `(…) => …` |  |

### `PivotColumnCollapseOpts`

Column-group collapse affordance options. When specified, the column-group header becomes click→toggle + chevron (▶/▼).
A collapsed group (`node.key` ∈ `collapsedKeys`) is rendered as a single/per-value column that reads the group aggregation cell (`<node.key>__<i>`,
pre-computed by computePivot from source = avg-of-avgs safe) instead of the child leaf columns.
When unspecified, column groups are plain headers + full child render as before (behavior unchanged).

| Property | Type | Description |
|---|---|---|
| `collapsedKeys` | `ReadonlySet<string>` |  |
| `onToggle` | `(…) => …` |  |

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

### `PivotGridProps`

Props for PivotGrid.

| Property | Type | Description |
|---|---|---|
| `className?` | `string` | Outer wrapper className. |
| `config` | `PivotConfig` | Pivot configuration (row/column dimensions + value defs). |
| `data` | `TData[]` | Flat source rows. |
| `enableCollapse?` | `boolean` | Activates row-group expand/collapse (default `false`). When `true`, the subtotal row label becomes click (chevron ▶/▼)→hide/restore the group's child data rows (the subtotal remains as the representative). Composes with sort (collapse(sort(rows))). unspecified= behavior (static subtotal label). |
| `enableColumnCollapse?` | `boolean` | Activates column-group expand/collapse (default `false`). When `true`, the column-group header becomes click (chevron ▶/▼)→hide/restore the child leaf columns (the group remains as a single column reading the source-aggregation cell, avg-of-avgs safe). Meaningful with ≥2 column dimensions. unspecified= behavior (static group header, full child render). |
| `enableConfigControls?` | `boolean` | Activates runtime config controls (default `false`). When `true`, a top toolbar ([⇄ transpose], [pivot toggle]) is rendered and PivotGrid **owns config/pivotMode as internal state** (props.config·pivotMode are initial values). When unspecified, uses props.config directly (controlled behavior unchanged). Mutually exclusive with consumer-controlled config. |
| `enableSort?` | `boolean` | Activates pivot value column sorting (default `false`). When `true`, the value header becomes click→sort within the group (subtotal/grandTotal anchors, not grid-core enableSort). unspecified= behavior (static header). |
| `enableVirtualization?` | `boolean` | Enable `<Grid>` virtualization (delegated — , no react-virtual here). |
| `onConfigChange?` | `(…) => …` | Called on config change (transpose, etc.) — for consumer persistence/sync. |
| `passthroughColumns?` | `ColumnDef<TData, unknown>[]` | Columns used when `pivotMode === false` (normal grid passthrough). Ignored in pivot mode. |
| `pivotMode?` | `boolean` | When `false`, the pivot transform is skipped entirely and `data` is rendered as a normal grid using `passthroughColumns`. Default `true`. |

### `PivotModel`

The complete headless pivot result returned by the pure transform / `usePivot`.

| Property | Type | Description |
|---|---|---|
| `columnLeafKeys` | `string[]` | Leaf column-combination keys in left-to-right order. |
| `columnTree` | `PivotColumnNode[]` | Column-combination tree (nested by `config.columns` order). |
| `config` | `PivotConfig` | The config the model was built from (echoed for the renderer). |
| `rows` | `PivotRow[]` | Flattened rows (data + subtotals + grand-total), in render order. |

### `PivotPanelProps`

| Property | Type | Description |
|---|---|---|
| `className?` | `string` | Optional extra class on the panel container. |
| `config` | `PivotConfig` | Current pivot configuration (controlled). |
| `fields` | `string[]` | All source field names available for pivoting. |
| `onConfigChange` | `(…) => …` | Called with the next config after a field is dropped onto a zone. |

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

### `PivotSortOpts`

Value-header sort affordance options. When specified, the value leaf header becomes click→sort + indicator (▲▼).
When unspecified, the header is a plain string as before (behavior unchanged).

| Property | Type | Description |
|---|---|---|
| `active` | `null \| PivotSortState` |  |
| `onSort` | `(…) => …` |  |

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

@topgrid/grid-pro-pivot — pivot result sorting — pure.

★ Passing grid-core `enableSort` to `<Grid>` sorts the entire flat array (including subtotal/grandTotal) intermixed
(gap analysis noted). Pivot-aware sorting reorders data rows **only within a group** and anchors the synthetic rows:
- Split rows into **segments** (a run of consecutive `data` rows, terminated by a `subtotal`/`grandTotal`).
- Reorder only the data rows *inside* each segment by the value cell (`row[leafKey]`).
- subtotal/grandTotal keep their position (anchored) — the terminator is pushed back to its own place as is.
- **null cells always at the bottom** (regardless of asc/desc) — so empty intersection cells don't occupy the top of the sort.

Scope: hierarchical sorting that sorts the *group itself* by its subtotal value is vN. This function only does sibling (within-group) sorting.
Types only import (0 runtime) → run node strip-types directly.

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

A drop target zone in the pivot panel. `available` = not assigned to any dimension.

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
