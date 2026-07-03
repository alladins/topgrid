---
title: "@topgrid/grid-pro-agg"
sidebar_label: "grid-pro-agg"
sidebar_position: 12
---

# @topgrid/grid-pro-agg

> Pro: Aggregation (group footer) · **Commercial (EULA)**

:::info Auto-generated
This page is auto-generated from the source code's TSDoc comments (internal markers scrubbed). For the curated getting-started summary, see the [API Reference](../api-reference).
:::

**16** public exports — 4 functions · 0 hooks · 2 components · 9 types · 1 constants.

## Components

### `AggregationGrid`

`AggregationGrid` — Pro component for row grouping + aggregation.

```ts
AggregationGrid(__namedParameters: AggregationGridProps<TData>): Element
```

**Example**

```tsx
<AggregationGrid
  data={rows}
  columns={columns}
  enableAggregation
  grouping={['region']}
  showFooter
/>
```

### `GroupPanel`

`GroupPanel` — drag-and-drop grouping bar.

Renders above the grid table. Column `<th>` elements in `AggregationGrid`
are marked `draggable={true}` when `showGroupPanel=true`, allowing users to
drag a column header here to add it to the grouping.

Chip X click removes the column from grouping ( uncontrolled support).

```ts
GroupPanel(__namedParameters: GroupPanelProps<TData>): ReactElement
```

## Functions

### `computeAggregateRow`

: a set of source rows → one row of per-column aggregate values (shared by grand-total footer / auto-agg floating).

```ts
computeAggregateRow(data: readonly Record<string, unknown>[], spec: AggregateSpec): Record<string, null | number>
```

| Parameter | Type | Description |
|---|---|---|
| `data` | `readonly Record<string, unknown>[]` | Source rows to aggregate (grand-total=all, subsets also allowed). |
| `spec` | `AggregateSpec` | Per-column aggregation function key. |

**Returns** — `{ [columnId]: number | null }` (empty set avg/min/max=null).

### `getAggregationFn`

Looks up a user-defined aggregation function from the registry by name.
The 5 built-ins require no separate registry lookup, so this function is for user-defined fns only.

```ts
getAggregationFn(name: string): undefined | AggregationFn<TData>
```

**Returns** — the registered AggregationFn&lt;TData> or undefined (not registered).

### `registerAggregationFn`

Registers a user-defined aggregation function in the module-level registry.

- Uses the standard TanStack AggregationFn&lt;TData> signature as-is.
- strict TypeScript, no any.
- Already-registered name: overwrite + console.warn ( — no throw).
- One-license verifyOrWarn-once-per-package principle — this function makes no separate call.

```ts
registerAggregationFn(name: string, fn: AggregationFn<TData>): void
```

**Example**

```ts
registerAggregationFn('weightedAvg', (columnId, leafRows) => {
  const totalWeight = leafRows.reduce((s, r) => s + (r.getValue('weight') as number), 0);
  const totalVal = leafRows.reduce(
    (s, r) => s + (r.getValue(columnId) as number) * (r.getValue('weight') as number), 0
  );
  return totalWeight === 0 ? 0 : totalVal / totalWeight;
});
```

### `resolveAggregationFn`

Maps a user-facing `AggregationFnKey` to the TanStack-internal string key.

Spec : 'avg' → 'mean' (TanStack built-in name).
All other keys pass through unchanged.

Returning the string key (not a function reference) allows TanStack to
perform its own registry lookup via `aggregationFns[key]`, which is safer
than importing the registry object directly.

```ts
resolveAggregationFn(key: AggregationFnKey): TanStackAggKey
```

| Parameter | Type | Description |
|---|---|---|
| `key` | `AggregationFnKey` | User-facing aggregation key. |

**Returns** — TanStack-internal aggregation key string.

## Types & Interfaces

### `AggregationColumnMeta`

Extend TanStack column meta to carry aggregation configuration.
Follows the open meta pattern (`[key: string]: unknown`) to stay compatible
with arbitrary user meta.

| Property | Type | Description |
|---|---|---|
| `aggregationFn?` | `AggregationFnKey \| string & object` | Aggregation function identifier. - 5 built-ins: 'sum' \| 'avg' \| 'min' \| 'max' \| 'count' (autocomplete supported) - user-defined: any string registered via registerAggregationFn (string & &#123;}) pattern: keeps built-in key autocomplete + allows arbitrary strings. |

### `AggregationGridProps`

Props for the `AggregationGrid` standalone Pro component.

| Property | Type | Description |
|---|---|---|
| `columns` | `AggregationColumnDef<TData>[]` | Column definitions (with optional `meta.aggregationFn`). |
| `data` | `TData[]` | Row data array. |
| `emptyGroupPanelText?` | `string` | Placeholder text shown in GroupPanel when no columns are grouped. |
| `enableAggregation?` | `boolean` | When `true`, enables `getGroupedRowModel` and `getExpandedRowModel`. |
| `enableGroupSort?` | `boolean` | When `true`, enables `getSortedRowModel` and makes group header `<th>` cells clickable for column-level sorting. |
| `enableRowSelection?` | `boolean` | : enable group/hierarchy row selection — a leading checkbox column. Group rows show a tri-state checkbox (toggling selects the whole subtree via TanStack `enableSubRowSelection`; indeterminate when some-but-not-all children are selected). |
| `enableStickyGroupRows?` | `boolean` | : sticky group headers (non-virtualized path). When true, the grid body becomes a bounded scroll container (`stickyGroupMaxHeight`) and each group header sticks to the top while its children scroll under it (AG `groupRowsSticky`). Virtualization drops off-window headers, so this is the non-virtualized model; leave `enableVirtualization` off. |
| `enableVirtualization?` | `boolean` | Enable row virtualization via `@tanstack/react-virtual`. Requires `@tanstack/react-virtual` to be installed as a peer dependency. |
| `estimatedRowHeight?` | `number` | Estimated row height in pixels (used by virtualizer). |
| `expanded?` | `false \| ExpandedState` | Initial expanded state passed to TanStack Table. `false` is normalised to `{}` (TanStack's `ExpandedState` does not include `false`). Pass `true` to expand all groups. |
| `footerRowClassName?` | `string` | Additional Tailwind className for footer rows. |
| `groupChipClassName?` | `string` | Additional Tailwind className for each group chip in GroupPanel. |
| `grouping?` | `string[]` | Column ids to group by (order matters). Only applied when `enableAggregation` is `true`. |
| `groupPanelClassName?` | `string` | Additional Tailwind className for the GroupPanel container. |
| `groupRowClassName?` | `string` | Additional Tailwind className for group header rows. |
| `onExpandedChange?` | `(…) => …` | Callback fired when expanded state changes. Enables externally controlled expand/collapse. |
| `onGroupingChange?` | `(…) => …` | Callback fired when grouping state changes. Enables externally controlled grouping. |
| `onSelectionChange?` | `(…) => …` | : callback with the selected leaf rows' originals when selection changes. |
| `onSortingChange?` | `OnChangeFn<SortingState>` | Callback fired when sorting state changes. Required when `sorting` is provided (controlled mode). |
| `renderFooterRow?` | `(…) => …` | Custom footer row renderer. |
| `renderGroupRow?` | `(…) => …` | Custom group header row renderer. |
| `showFooter?` | `boolean` | Whether to show a synthetic footer row after each group's leaf rows. Footer row is only rendered when the group is expanded. |
| `showGroupAggregates?` | `boolean` | : render per-column aggregate values inline on each group HEADER row (source- aggregated via computeAggregateRow, avg-of-avgs safe; visible even when the group is collapsed). Aggregation per column comes from `meta.aggregationFn`. Independent of `showFooter`. |
| `showGroupPanel?` | `boolean` | Whether to show the GroupPanel drag-and-drop grouping bar above the grid. |
| `sorting?` | `SortingState` | Controlled sorting state (TanStack SortingState). When provided, `onSortingChange` must also be provided. |
| `stickyGroupMaxHeight?` | `number` | : max height (px) of the bounded scroll container when `enableStickyGroupRows` is on. |
| `virtualOverscan?` | `number` | Number of overscan rows for virtualization. |

### `FooterRowProps`

Props for the internal `FooterRow` component.
Renders a synthetic footer row after each group's leaf rows.

| Property | Type | Description |
|---|---|---|
| `cells` | `Cell<TData, unknown>[]` | Visible cells list (pass row.getVisibleCells). |
| `className?` | `string` | Additional Tailwind className for the footer row tr. |
| `renderFooterRow?` | `(…) => …` | Custom footer cell renderer. |
| `row` | `Row<TData>` | Group row Row object (aggregated cells accessed via cells prop). |

### `GroupPanelProps`

Props for the `GroupPanel` component.
Renders a drag-and-drop grouping bar above the grid.

| Property | Type | Description |
|---|---|---|
| `chipClassName?` | `string` | Additional Tailwind className for each chip. |
| `className?` | `string` | Additional Tailwind className for the panel container. |
| `columns` | `Column<TData, unknown>[]` | All visible columns (used to resolve column labels). |
| `emptyText?` | `string` | Placeholder text shown when no columns are grouped. |
| `grouping` | `string[]` | Current grouping column id list (order matters). |
| `onGroupingChange` | `(…) => …` | Callback fired when the grouping list changes. |

### `GroupRowProps`

Props for the internal `GroupRow` component.
Renders a grouped header row with expand/collapse toggle.

| Property | Type | Description |
|---|---|---|
| `aggSpec?` | `AggregateSpec` | : inline group-header aggregates. When both `aggSpec` and `leafColumns` are provided, GroupRow renders per-column cells (grouping column = toggle+key+count; columns in `aggSpec` = source-aggregated value via computeAggregateRow over `row.getLeafRows` — avg-of-avgs safe for nested groups; others = blank) instead of the single colSpan label cell. Visible even when the group is collapsed (the header row always renders). |
| `className?` | `string` | Additional Tailwind className for the group row tr. |
| `columnCount` | `number` | Column count for colspan calculation. |
| `indentUnit?` | `number` | Indent unit (default: 4) — Tailwind pl-&#123;depth * indentUnit}. |
| `leafColumns?` | `readonly { … }[]` | : visible leaf columns (id + data field) for per-column inline aggregate rendering. |
| `renderGroupRow?` | `(…) => …` | Custom renderer — if provided, replaces default render (group key + count + toggle icon). |
| `row` | `Row<TData>` | Group row Row object (row.getIsGrouped === true guaranteed). |
| `showSelect?` | `boolean` | : render a group selection checkbox (checked = all sub-rows selected, indeterminate = some selected; toggling selects/deselects the whole subtree via TanStack enableSubRowSelection). In the colSpan path it prepends a checkbox cell; in the inline-aggregate path it fills the `__select__` column position. |
| `sticky?` | `boolean` | : sticky group header. When true, the group row's cells get inline `position: sticky; top: 0` (inline — Tailwind classes are inert in the bounded scroll harness, P27-1) so the header stays pinned while its children scroll under it. Applied to the `<td>`s (not the `<tr>`) because `position: sticky` on a `<tr>` does not engage under `border-collapse`. |

### `AggregateSpec`

Column → aggregation function key.

```ts
type AggregateSpec = Record<string, AggregationFnKey>
```

### `AggregationColumnDef`

Column definition used with `AggregationGrid`.
Identical to `ColumnDef<TData>` but with typed `meta`.

```ts
type AggregationColumnDef = ColumnDef<TData> & { … }
```

### `AggregationFnKey`

User-facing aggregation function identifier.

```ts
type AggregationFnKey = "sum" | "avg" | "min" | "max" | "count"
```

### `TanStackAggKey`

Aggregation function keys that TanStack Table v8 accepts natively.
'mean' is TanStack's internal name; our public API exposes 'avg'.

```ts
type TanStackAggKey = "sum" | "mean" | "min" | "max" | "count"
```

## Constants

### `BUILT_IN_AGGREGATION_KEYS`

The 5 built-in aggregation function keys supported by AggregationGrid.
Use this for runtime guards and autocomplete hints.

```ts
const BUILT_IN_AGGREGATION_KEYS: ReadonlyArray<AggregationFnKey>
```
