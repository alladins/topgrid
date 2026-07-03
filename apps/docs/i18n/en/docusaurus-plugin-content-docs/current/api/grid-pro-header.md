---
title: "@topgrid/grid-pro-header"
sidebar_label: "grid-pro-header"
sidebar_position: 19
---

# @topgrid/grid-pro-header

> Pro: Multi-row Header (Column Groups) · **Commercial (EULA)**

:::info Auto-generated
This page is auto-generated from the TSDoc comments in the source code (internal markers stripped). For a curated getting-started summary, see the [API Reference](../api-reference).
:::

**6** public exports — 1 function · 0 hooks · 2 components · 3 types · 0 constants.

## Components

### `GroupedHeaderGrid`

Legacy self-contained grid component with grouped multi-row headers.

Delegates header rendering to `MultiRowHeader` from `@topgrid/grid-pro-header`.
tbody and pagination are ported verbatim from AS-IS L0.

```ts
GroupedHeaderGrid(__namedParameters: GroupedHeaderGridProps<TData>): Element
```

### `MultiRowHeader`

Renders a multi-row `<thead>` element from a TanStack table instance.

Iterates `table.getHeaderGroups` to produce one `<tr>` per header row.
Group header cells use `header.colSpan` (computed by TanStack automatically).
Placeholder cells (`header.isPlaceholder`) are rendered as empty `<th>` elements.
Sorting is enabled only on leaf columns (`!header.subHeaders.length`).

```ts
MultiRowHeader(props: MultiRowHeaderProps<TData>): Element
```

| Parameter | Type | Description |
|---|---|---|
| `props` | `MultiRowHeaderProps<TData>` | `MultiRowHeaderProps<TData>`. |

**Returns** — A `<thead>` JSX element with all header rows.

## Functions

### `createColumnGroup`

Creates a TanStack `GroupColumnDef<TData>` from a typed config object.

This is a thin wrapper — no logic beyond type narrowing. The returned
object is identical to writing `{ header, columns }` inline, but provides
generic type-checking at the call site.

```ts
createColumnGroup(config: ColumnGroupConfig<TData>): GroupColumnDef<TData>
```

| Parameter | Type | Description |
|---|---|---|
| `config` | `ColumnGroupConfig<TData>` | `ColumnGroupConfig<TData>` with `header` and `columns`. |

**Returns** — A `GroupColumnDef<TData>` suitable for passing to `useReactTable`.

## Types & Interfaces

### `ColumnGroupConfig`

Config object for `createColumnGroup`.

| Property | Type | Description |
|---|---|---|
| `columns` | `ColumnDef<TData>[]` | Leaf (or nested group) column definitions belonging to this group. |
| `header` | `string` | The display label for the column group header. |

### `GroupedHeaderGridProps`

Props for the legacy `GroupedHeaderGrid` wrapper component.

| Property | Type | Description |
|---|---|---|
| `className?` | `string` |  |
| `columns` | `ColumnDef<TData>[]` | Pass grouped column definitions using TanStack Table's native column grouping. Use `{ header: 'Group', columns: [...leafColumns] }` structure for grouping. |
| `data` | `TData[]` |  |
| `emptyText?` | `string` |  |
| `enableGroupToggle?` | `boolean` | : enable group header click to toggle child column visibility. |
| `loading?` | `boolean` |  |
| `onRowClick?` | `(…) => …` |  |
| `pagination?` | `GridPaginationOptions` |  |
| `rowSelection?` | `GridRowSelectionOptions<TData>` |  |

### `MultiRowHeaderProps`

Props for `MultiRowHeader`.

| Property | Type | Description |
|---|---|---|
| `enableGroupToggle?` | `boolean` | When true, group header cells (non-leaf) become clickable toggles that show/hide all child (leaf) columns at once. Clicking a group header that has all leaves hidden will show them all; clicking one with any visible leaf will hide them all. Leaf columns retain their sort click handler regardless. Default: false (/ behaviour preserved — breaking: false). |
| `enableStickyHeader?` | `boolean` | When true, applies sticky positioning to each header row so the multi-row header remains fixed at the viewport top during vertical scroll. Default: false ( behaviour preserved — breaking: false). |
| `frozenColumns?` | `number` | Number of columns pinned on the left that should receive `sticky left` positioning. Acts as an on/off switch; the actual frozen column identities are determined from TanStack's `columnPinning.left` state via `column.getIsPinned === 'left'` (decision). 0 or omitted: frozen positioning inactive. |
| `table` | `Table<TData>` | The TanStack table instance. Provides `getHeaderGroups` used for multi-row header rendering. |
