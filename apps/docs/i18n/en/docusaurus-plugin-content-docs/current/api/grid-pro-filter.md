---
title: "@topgrid/grid-pro-filter"
sidebar_label: "grid-pro-filter"
sidebar_position: 18
---

# @topgrid/grid-pro-filter

> Pro: Multi-condition (AND/OR) column filtering — compound FilterFn + 2-condition builder UI · **Commercial (EULA)**

:::info Auto-generated
This page is auto-generated from TSDoc comments in the source code (internal markers scrubbed). For a curated getting-started summary, see the [API Reference](../api-reference).
:::

**16** public exports — 8 functions · 0 hooks · 1 component · 7 types · 0 constants.

## Components

### `MultiFilter`

Per-column compound (AND/OR) filter builder — 2 condition rows.

```ts
MultiFilter(variant: { … }): Element
```

| Parameter | Type | Description |
|---|---|---|
| `variant` | `{ … }` | 'text' (contains, etc.) \| 'number' (=,>,… ). column.filterFn must be registered as `multiTextFilterFn` / `multiNumberFilterFn` respectively. |

## Functions

### `advancedGlobalFilterFn`

: TanStack `globalFilterFn` adapter — treats the global filter value as an AdvancedFilterExpr and
evaluates it **per row** (columnId ignored = row-level). `null`/`undefined` expr → unconstrained (true).

This is the **actual setFilter wiring** for chart cross-filter: `setGlobalFilter(selectionsToFilter(selections))`
flows chart selections into the grid's `getFilteredRowModel`, so **the grid filters internally** (filter state lives in
the table, not in the data prop — the same raw-table wiring as global search ✅).

```ts
advancedGlobalFilterFn(row: { … }, _columnId: string, filterValue: undefined | null | AdvancedFilterExpr): boolean
```

**Example**

```ts
const table = useReactTable({ data, columns, state: { globalFilter },
  onGlobalFilterChange: setGlobalFilter, globalFilterFn: advancedGlobalFilterFn,
  getColumnCanGlobalFilter: () => true, getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel() });
// chart: onSelectCategory={(i) => table.setGlobalFilter(selectionsToFilter([{ field, type, value: cats[i] }]))}
```

### `evaluateAdvancedFilter`

: Evaluates an advanced filter expression against a row (pure, recursive). Removes group=inert children, then reduces (empty/all-inert→true=unconstrained).

```ts
evaluateAdvancedFilter(expr: AdvancedFilterExpr, row: Record<string, unknown>): boolean
```

| Parameter | Type | Description |
|---|---|---|
| `expr` | `AdvancedFilterExpr` | Expression tree. |
| `row` | `Record<string, unknown>` | Row to evaluate (field record). |

### `makeAdvancedFilterFn`

Expression → row predicate (used by the consumer as a global/table filter).

```ts
makeAdvancedFilterFn(expr: AdvancedFilterExpr): (…) => …
```

### `makeMultiFilterFn`

Promotes a base FilterFn into a compound (AND/OR) FilterFn. Inactive conditions are removed via base.autoRemove, then reduced.

```ts
makeMultiFilterFn(base: FilterFn<unknown>): FilterFn<unknown>
```

| Parameter | Type | Description |
|---|---|---|
| `base` | `FilterFn<unknown>` | Per-condition matching FilterFn (e.g. `textFilterFn`). If `autoRemove` is present, it is used to identify inactive conditions. |

### `matchCondition`

Matches a single condition against a row value (pure, type-explicit). null/blank cell → text match false. unknown op → false.

```ts
matchCondition(rowValue: unknown, type: FilterValueType, operator: FilterOperator, value: unknown): boolean
```

### `multiNumberFilterFn`

```ts
multiNumberFilterFn(row: Row<unknown>, columnId: string, filterValue: any, addMeta: (…) => …): boolean
```

### `multiTextFilterFn`

```ts
multiTextFilterFn(row: Row<unknown>, columnId: string, filterValue: any, addMeta: (…) => …): boolean
```

### `selectionsToFilter`

: Selection list → advanced filter expression. **Same field OR · different fields AND**. Empty selection → unconstrained empty group (true).

```ts
selectionsToFilter(selections: readonly FilterSelection[]): AdvancedFilterExpr
```

| Parameter | Type | Description |
|---|---|---|
| `selections` | `readonly FilterSelection[]` | List of selection descriptors (created e.g. by a chart click, with type filled in from column metadata). |

## Types & Interfaces

### `FilterCondition`

A single cross-column condition. `value` is not required for blank/notBlank (inert if absent).

| Property | Type | Description |
|---|---|---|
| `field` | `string` |  |
| `kind` | `"condition"` |  |
| `operator` | `FilterOperator` |  |
| `type` | `FilterValueType` |  |
| `value?` | `unknown` |  |

### `FilterGroup`

AND/OR group (nestable).

| Property | Type | Description |
|---|---|---|
| `children` | `AdvancedFilterExpr[]` |  |
| `kind` | `"group"` |  |
| `logic` | `"and" \| "or"` |  |

### `FilterSelection`

A single selection item (chart-agnostic generic): field + type (column meta) + selected value.

| Property | Type | Description |
|---|---|---|
| `field` | `string` |  |
| `type` | `FilterValueType` |  |
| `value` | `unknown` |  |

### `MultiFilterValue`

Compound filter value — exclusive per column (not compatible with a single filter's value shape; multi*FilterFn only).

| Property | Type | Description |
|---|---|---|
| `conditions` | `C[]` | Condition list (each condition = the base FilterFn's value shape). Typically N (the UI ships 2). |
| `logic` | `"and" \| "or"` | Logic for combining conditions. |

### `AdvancedFilterExpr`

Advanced filter expression (group tree or a single condition).

```ts
type AdvancedFilterExpr = FilterGroup | FilterCondition
```

### `FilterOperator`

Comparison operator.

```ts
type FilterOperator = "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "contains" | "startsWith" | "endsWith" | "blank" | "notBlank"
```

### `FilterValueType`

Comparison type (determines operator semantics).

```ts
type FilterValueType = "number" | "text" | "boolean" | "date"
```

