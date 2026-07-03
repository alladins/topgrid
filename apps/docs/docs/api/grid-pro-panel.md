---
title: "@topgrid/grid-pro-panel"
sidebar_label: "grid-pro-panel"
sidebar_position: 22
---

# @topgrid/grid-pro-panel

> Pro: declarative grid chrome — StatusBar, ToolPanel (column visibility/order), and a reused drag-grouping RowGroupPanel · **상용 (EULA)**

:::info 자동 생성
이 페이지는 소스 코드의 TSDoc 주석에서 자동 생성됩니다(내부 표식 정제). 큐레이트된 시작용 요약은 [API 레퍼런스](../api-reference) 참고.
:::

총 **16개** public export — 함수 1 · 훅 0 · 컴포넌트 5 · 타입 10 · 상수 0.

## 컴포넌트

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

## 함수

### `statusBarCounts`

table 에서 total/filtered/selected 카운트를 읽어 `StatusBarItem[]` 생성.

```ts
statusBarCounts(table: Table<TData>, labels: StatusBarCountLabels): StatusBarItem[]
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `table` | `Table<TData>` | TanStack `Table` 인스턴스. |
| `labels` | `StatusBarCountLabels` | 세그먼트 라벨 override(부분). |

## 타입 · 인터페이스

### `FiltersToolPanelColumn`

One column's filter row in FiltersToolPanel.

| 속성 | 타입 | 설명 |
|---|---|---|
| `id` | `string` | Column id. |
| `label` | `string` | Human-readable label. |
| `value` | `string` | Current filter value (empty string = inactive). |

### `FiltersToolPanelProps`

Props for FiltersToolPanel.

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` | Additional className appended to the root container. |
| `columns` | `FiltersToolPanelColumn[]` | Columns with their current filter values, in display order. |
| `emptyText?` | `string` | Text shown when there are no columns. |
| `onClearAll?` | `(…) => …` | Optional — when provided, a "Clear all" button clears every filter. |
| `onFilterChange` | `(…) => …` | Fired when a column's filter input changes. |

### `SideBarPanelDef`

One panel section in a SideBar.

| 속성 | 타입 | 설명 |
|---|---|---|
| `content` | `ReactNode` | Panel body (e.g. a ToolPanel). |
| `id` | `string` | Stable panel id. |
| `title` | `string` | Header label. |

### `SideBarProps`

Props for SideBar.

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` | Additional className appended to the root container. |
| `defaultOpenId?` | `string` | Initially open panel id (default: the first panel). |
| `panels` | `SideBarPanelDef[]` | Panels rendered as accordion sections, in order. |

### `StatusBarCountLabels`

카운트 세그먼트 라벨 override(미지정 시 한국어 기본).

| 속성 | 타입 | 설명 |
|---|---|---|
| `filtered?` | `string` |  |
| `selected?` | `string` |  |
| `total?` | `string` |  |

### `StatusBarItem`

A single segment rendered by StatusBar.

The consumer injects these (e.g. selection counts or aggregate summaries);
the bar is purely presentational and is not coupled to any grid state.

| 속성 | 타입 | 설명 |
|---|---|---|
| `key` | `string` | Stable React key / identifier for the segment. |
| `label?` | `string` | Optional label rendered before the value (e.g. `Selected`). |
| `value` | `ReactNode` | Value rendered for the segment (e.g. a count or formatted summary). |

### `StatusBarProps`

Props for StatusBar.

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` | Additional className appended to the root container. |
| `items` | `StatusBarItem[]` | Segments to render, left-to-right, as `label: value` pairs. |

### `ToolPanelColumn`

Describes one column row in a ToolPanel.

This is a plain, self-contained shape — the panel imports no grid-core state.
The consumer maps its grid-core `columnVisibility` / `columnOrder` state into
these rows and applies the emitted callbacks back onto that state.

| 속성 | 타입 | 설명 |
|---|---|---|
| `canHide?` | `boolean` | When `false`, the visibility checkbox is disabled (column cannot be hidden). |
| `id` | `string` | Column id (matches the grid's column id). |
| `label` | `string` | Human-readable label rendered next to the checkbox. |
| `visible` | `boolean` | Whether the column is currently visible. |

### `ToolPanelProps`

Props for ToolPanel.

| 속성 | 타입 | 설명 |
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

