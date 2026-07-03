---
title: "@topgrid/grid-pro-panel"
sidebar_label: "grid-pro-panel"
sidebar_position: 22
---

# @topgrid/grid-pro-panel

> Pro: declarative grid chrome — StatusBar, ToolPanel (column visibility/order), and a reused drag-grouping RowGroupPanel · **Commercial (EULA)**

:::info Auto-generated
This page is auto-generated from the source code's TSDoc comments (internal markers scrubbed). For the curated getting-started summary, see the [API Reference](../api-reference).
:::

**16** public exports — 1 functions · 0 hooks · 5 components · 10 types · 0 constants.

## Components

### `FiltersToolPanel`

FiltersToolPanel — unified column-filter editing surface with an active-filter count.
Callback-only (no grid state). Pro watermark composited when unlicensed (root is `relative`).

```ts
FiltersToolPanel(__namedParameters: FiltersToolPanelProps): Element
```

### `RowGroupPanel`

RowGroupPanel — the drag-and-drop grouping bar.

REUSE: all grouping behaviour (HTML5 drag, chips, remove) is delegated to the
agg `GroupPanel`; this wrapper only composites the Pro watermark. The root is
`relative` so the absolutely positioned `<Watermark>` anchors to it.

```ts
RowGroupPanel(props: RowGroupPanelProps<TData>): Element
```

### `SideBar`

SideBar — accordion container for tool panels. One section open at a time; clicking an open
section's header collapses it. Pro watermark composited when unlicensed (root is `relative`).

```ts
SideBar(__namedParameters: SideBarProps): Element
```

### `StatusBar`

StatusBar — a horizontal bar of `label: value` segments.

Pure prop-driven UI: the consumer passes whatever `items` it wants to surface
(selection counts, aggregate summaries, etc.). It composites no grid. Without
a valid Pro license a watermark is composited over the bar (the root is
`relative` so the absolutely positioned `<Watermark>` anchors to it).

```ts
StatusBar(__namedParameters: StatusBarProps): Element
```

### `ToolPanel`

ToolPanel — a declarative column visibility / order control surface.

A checkbox per column toggles visibility (`onVisibilityChange`); optional
up/down buttons request a reorder (`onReorder`). The panel holds no column
state machine of its own — it emits callbacks the consumer applies to its
grid-core `columnVisibility` / `columnOrder` state. It composites no grid.

Without a valid Pro license a watermark is composited over the panel (the
root is `relative` so the absolutely positioned `<Watermark>` anchors to it).

```ts
ToolPanel(__namedParameters: ToolPanelProps): Element
```

## Functions

### `statusBarCounts`

Reads total/filtered/selected counts from the table and produces `StatusBarItem[]`.

```ts
statusBarCounts(table: Table<TData>, labels: StatusBarCountLabels): StatusBarItem[]
```

| Parameter | Type | Description |
|---|---|---|
| `table` | `Table<TData>` | TanStack `Table` instance. |
| `labels` | `StatusBarCountLabels` | Segment label overrides (partial). |

## Types & Interfaces

### `FiltersToolPanelColumn`

One column's filter row in FiltersToolPanel.

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Column id. |
| `label` | `string` | Human-readable label. |
| `value` | `string` | Current filter value (empty string = inactive). |

### `FiltersToolPanelProps`

Props for FiltersToolPanel.

| Property | Type | Description |
|---|---|---|
| `className?` | `string` | Additional className appended to the root container. |
| `columns` | `FiltersToolPanelColumn[]` | Columns with their current filter values, in display order. |
| `emptyText?` | `string` | Text shown when there are no columns. |
| `onClearAll?` | `(…) => …` | Optional — when provided, a "Clear all" button clears every filter. |
| `onFilterChange` | `(…) => …` | Fired when a column's filter input changes. |

### `SideBarPanelDef`

One panel section in a SideBar.

| Property | Type | Description |
|---|---|---|
| `content` | `ReactNode` | Panel body (e.g. a ToolPanel). |
| `id` | `string` | Stable panel id. |
| `title` | `string` | Header label. |

### `SideBarProps`

Props for SideBar.

| Property | Type | Description |
|---|---|---|
| `className?` | `string` | Additional className appended to the root container. |
| `defaultOpenId?` | `string` | Initially open panel id (default: the first panel). |
| `panels` | `SideBarPanelDef[]` | Panels rendered as accordion sections, in order. |

### `StatusBarCountLabels`

Count segment label overrides (Korean defaults when unspecified).

| Property | Type | Description |
|---|---|---|
| `filtered?` | `string` |  |
| `selected?` | `string` |  |
| `total?` | `string` |  |

### `StatusBarItem`

A single segment rendered by StatusBar.

The consumer injects these (e.g. selection counts or aggregate summaries);
the bar is purely presentational and is not coupled to any grid state.

| Property | Type | Description |
|---|---|---|
| `key` | `string` | Stable React key / identifier for the segment. |
| `label?` | `string` | Optional label rendered before the value (e.g. `Selected`). |
| `value` | `ReactNode` | Value rendered for the segment (e.g. a count or formatted summary). |

### `StatusBarProps`

Props for StatusBar.

| Property | Type | Description |
|---|---|---|
| `className?` | `string` | Additional className appended to the root container. |
| `items` | `StatusBarItem[]` | Segments to render, left-to-right, as `label: value` pairs. |

### `ToolPanelColumn`

Describes one column row in a ToolPanel.

This is a plain, self-contained shape — the panel imports no grid-core state.
The consumer maps its grid-core `columnVisibility` / `columnOrder` state into
these rows and applies the emitted callbacks back onto that state.

| Property | Type | Description |
|---|---|---|
| `canHide?` | `boolean` | When `false`, the visibility checkbox is disabled (column cannot be hidden). |
| `id` | `string` | Column id (matches the grid's column id). |
| `label` | `string` | Human-readable label rendered next to the checkbox. |
| `visible` | `boolean` | Whether the column is currently visible. |

### `ToolPanelProps`

Props for ToolPanel.

| Property | Type | Description |
|---|---|---|
| `className?` | `string` | Additional className appended to the root container. |
| `columns` | `ToolPanelColumn[]` | Columns to list, in display order. |
| `onColumnDrop?` | `(…) => …` | Optional. When provided, rows become drag-to-reorder: dropping `sourceId` onto `targetId` fires this (insert-before semantics — pair with grid-core `reorderColumnOrder`). The panel holds NO drag state of its own; the consumer feeds the reordered `columns` back. Coexists with the `onReorder` buttons. |
| `onReorder?` | `(…) => …` | Optional. When provided, up/down buttons render per row and fire this with the requested move direction. The consumer reorders its `columnOrder`. |
| `onVisibilityChange` | `(…) => …` | Fired when a column's visibility checkbox is toggled. |

### `RowGroupPanelProps`

Props for RowGroupPanel — identical to the reused agg `GroupPanel`.

```ts
type RowGroupPanelProps = GroupPanelProps<TData>
```
