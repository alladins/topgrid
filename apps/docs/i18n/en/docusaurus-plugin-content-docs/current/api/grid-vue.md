---
title: "@topgrid/grid-vue"
sidebar_label: "grid-vue"
sidebar_position: 8
---

# @topgrid/grid-vue

> Vue 3 adapter (skeleton) — consumes the @topgrid/grid-core-headless shared core via @tanstack/vue-table. W1 Phase 0. Zero React dependency. · **Free (MIT)**

:::info Auto-generated
This page is auto-generated from TSDoc comments in the source code (internal markers scrubbed). For a curated getting-started summary, see the [API Reference](../api-reference).
:::

**17** public exports — 11 functions · 0 hooks · 0 components · 5 types · 1 constants.

## Functions

### `cellValueToClipboardText`

Cell value → clipboard text (pure, W1 Phase 0, ported from grid-pro-master).

A value→text mapping decoupled from the browser `navigator.clipboard` wiring. framework-agnostic —
shared by the React copy (makeCopyCellItem) and Vue copy adapters.

Mapping: null/undefined→'' (empty string, not "null"/"undefined") · object (including arrays)→JSON.stringify ·
 otherwise (string/number/boolean)→String.

```ts
cellValueToClipboardText(cell: { … }): string
```

### `createVueCheckboxColumn`

```ts
createVueCheckboxColumn(): CreateSelectionColumn<TData>
```

### `dateRangeFilterFn`

```ts
dateRangeFilterFn(row: Row<unknown>, columnId: string, filterValue: any, addMeta: (…) => …): boolean
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

### `DateFilterValue`

| Property | Type | Description |
|---|---|---|
| `from?` | `Date` |  |
| `to?` | `Date` |  |

### `NumberFilterValue`

| Property | Type | Description |
|---|---|---|
| `max?` | `number` |  |
| `min?` | `number` |  |
| `operator` | `NumberFilterOperator` |  |
| `value?` | `number` |  |

### `TextFilterValue`

| Property | Type | Description |
|---|---|---|
| `operator` | `TextFilterOperator` |  |
| `value` | `string` |  |

## Constants

### `Grid`

```ts
const Grid: DefineComponent<ExtractPropTypes<{ … }>, (…) => …, object, object, object, ComponentOptionsMixin, ComponentOptionsMixin, object, string, PublicProps, ToResolvedProps<ExtractPropTypes<{ … }>, object>, { … }, object, object, object, string, ComponentProvideOptions, true, object, any>
```
