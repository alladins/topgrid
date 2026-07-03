---
title: "@topgrid/grid-pro-pivot-vue"
sidebar_label: "grid-pro-pivot-vue"
sidebar_position: 25
---

# @topgrid/grid-pro-pivot-vue

> Pro: declarative 2-D pivot for Vue 3 — reuses the framework-neutral @topgrid/grid-pro-pivot-core engine (headless composable + tool panel). · **Commercial (EULA)**

:::info Auto-generated
This page is auto-generated from the source code's TSDoc comments (internal markers scrubbed). For a curated getting-started summary, see the [API Reference](../api-reference).
:::

**21** public exports — 10 functions · 1 hook · 0 components · 7 types · 3 constants.

## Hooks

### `useVuePivot`

Computes a reactive PivotModel from flat data + a pivot configuration.
When `data`/`config` are refs/getters, it recomputes automatically on change.

```ts
useVuePivot(data: MaybeRefOrGetter<TData[]>, config: MaybeRefOrGetter<PivotConfig>): ComputedRef<PivotModel>
```

| Parameter | Type | Description |
|---|---|---|
| `data` | `MaybeRefOrGetter<TData[]>` | Flat source rows (Ref, getter, or array). |
| `config` | `MaybeRefOrGetter<PivotConfig>` | Row/column dimension + value (measure) definitions (Ref, getter, or object). |

**Returns** — The reactive pivot model (`ComputedRef`).

**Example**

```ts
const rows = ref(sales);
const config = ref({ rows: ['region'], columns: ['quarter'], values: [{ field: 'amt', aggregationFn: 'sum' }] });
const model = useVuePivot(rows, config);
// template: v-for="row in model.rows"
```

## Functions

### `buildVuePivotColumns`

Builds a set of vue-table columns from a pivot model.

```ts
buildVuePivotColumns(model: PivotModel): ColumnDef<PivotRow>[]
```

| Parameter | Type | Description |
|---|---|---|
| `model` | `PivotModel` | The headless pivot model. |

**Returns** — A declarative `ColumnDef<PivotRow>[]` (leading row dimensions + nested value groups + grand-total group).

### `checkLicense`

Synchronously checks the current license state and returns a `LicenseCheckResult`.

- If valid=false, then `watermarkRequired=true`.
- If valid and less than 60 days until `expiresAt`, then `expiryWarning='soon-expiring'` + `console.warn` (once).
- If valid and there is ample time before expiry, `{ valid: true, watermarkRequired: false }`.

```ts
checkLicense(): LicenseCheckResult
```

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

### `setLicenseKey`

Global license registration API for the Pro package.
Call once at the app entry (main.tsx / App.tsx).

```ts
setLicenseKey(key: string): LicenseStatus
```

| Parameter | Type | Description |
|---|---|---|
| `key` | `string` | A license key in the format Base64url(pubKey).Base64url(sig).Base64url(payload) |

**Returns** — LicenseStatus — returned immediately (synchronous wrapper; state is updated after internal async verification completes). Note: the return value is designed as a synchronous API usable immediately without a Promise. Internally it stores the result of verifySignature (async). Calling getLicenseState before the async completion returns the default &#123;valid:false, reason:'invalid'}.

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

### `PivotZone`

A drop-target zone in the pivot panel. `available` = not assigned to any dimension.

```ts
type PivotZone = "rows" | "columns" | "values" | "available"
```

## Constants

### `GRAND_TOTAL_COLUMN_KEY`

Reserved key prefix for the row-grand-total column combination.

```ts
const GRAND_TOTAL_COLUMN_KEY: "__grandTotalCol__"
```

### `VuePivotGrid`

```ts
const VuePivotGrid: DefineComponent<ExtractPropTypes<{ … }>, (…) => …, object, object, object, ComponentOptionsMixin, ComponentOptionsMixin, object, string, PublicProps, ToResolvedProps<ExtractPropTypes<{ … }>, object>, { … }, object, object, object, string, ComponentProvideOptions, true, object, any>
```

### `VuePivotPanel`

```ts
const VuePivotPanel: DefineComponent<ExtractPropTypes<{ … }>, (…) => …, object, object, object, ComponentOptionsMixin, ComponentOptionsMixin, { … }, string, PublicProps, ToResolvedProps<ExtractPropTypes<{ … }>, { … }>, { … }, object, object, object, string, ComponentProvideOptions, true, object, any>
```
