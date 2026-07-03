---
title: "@topgrid/grid-pro-merging"
sidebar_label: "grid-pro-merging"
sidebar_position: 21
---

# @topgrid/grid-pro-merging

> Pro: Cell Merging (rowSpan) — column.mergeRows API + automatic rowSpan calculation · **Commercial (EULA)**

:::info Auto-generated
This page is auto-generated from the source code's TSDoc comments (internal markers scrubbed). For the curated getting-started summary, see the [API Reference](../api-reference).
:::

**9** public exports — 2 functions · 0 hooks · 1 components · 6 types · 0 constants.

## Components

### `MergingGrid`

Pro grid component providing cell merging (rowSpan).

With `enableMerging=false` (default), behaves identically to a regular grid.
With `enableMerging=true`, merges consecutive rows in columns where `meta.mergeRows` is set.
With `enableVirtualization=true`, renders large datasets via @tanstack/react-virtual useVirtualizer.

```ts
MergingGrid(props: MergingGridProps<TData>): Element
```

**Example**

```ts
// 기본 사용 (G-001)
<MergingGrid data={rows} columns={columns} enableMerging />
```

## Functions

### `computeColSpans`

Takes a data array and per-column colSpan callbacks, and computes a horizontal-merge (colSpan) Map for body cells.

**The horizontal twin of computeMergeSpans(rowSpan) **:
For each row, iterates columns left→right. When a cell declares colSpan=n(>1), that cell becomes the start cell and
the n-1 cells to its right are "covered" and marked as skip(0). A covered cell's own colSpan callback is
not evaluated (**skip-of-skip** — an already-covered cell cannot start a span).

**clamp**: if colSpan exceeds the row's remaining column count, it is truncated to the remaining count (prevents spans past the row boundary).
Non-finite / less-than-1 values are normalized to 1 (no span).

★colSpan operates **within a single row only** — it structurally lacks the cross-row ancestorBoundary
propagation of rowSpan(computeMergeSpans) and the L-01 orphan (start cell scrolls outside the virtual window) problem.

```ts
computeColSpans(rows: TData[], columns: { … }[]): ColSpanMap
```

| Parameter | Type | Description |
|---|---|---|
| `rows` | `TData[]` | TData array in render order (getSortedRowModel / getFilteredRowModel result) |
| `columns` | `{ … }[]` | Column info array (id + optional colSpan callback). Array order = left→right = getVisibleCells order. |

**Returns** — - Map of key `${rowIdx}_${colId}` → colSpan number.  >1 = span start cell, 0 = covered and skipped (MergingGrid returns null), 1/absent = normal cell.  Empty Map if rows is an empty array.

**Example**

```ts
// row 0 의 'b' 셀이 3컬럼(b,c,d) 스팬 → c,d 는 skip
const map = computeColSpans(
  [{ a: 1, b: 2, c: 3, d: 4, e: 5 }],
  [
    { id: 'a' },
    { id: 'b', colSpan: () => 3 },
    { id: 'c' }, { id: 'd' }, { id: 'e' },
  ]
);
// map.get('0_b') === 3 ; map.get('0_c') === 0 ; map.get('0_d') === 0
// 'a','e' 미존재(=일반 셀)
```

### `computeMergeSpans`

Takes a data array and a list of merge-target columns, and computes a MergeSpanMap.

**Hierarchical ancestorBoundary algorithm (ADR-)**:
Single pass O(N×C) — iterates rows(i) while evaluating columns(j) left to right.
When a boundary occurs in a left column, it propagates a forced boundary to the right columns as well.
(`ancestorBoundary` flag — reset at each row transition)

**Regression Invariant (ADR-)**:
When `columns.length === 1`, there is no left column, so `ancestorBoundary` is always `false`.
As a result, only its own `compareFn` is evaluated, producing a Map bit-identical to the output.

```ts
computeMergeSpans(rows: TData[], columns: { … }[]): MergeSpanMap
```

| Parameter | Type | Description |
|---|---|---|
| `rows` | `TData[]` | TData array in render order (getSortedRowModel / getFilteredRowModel result) |
| `columns` | `{ … }[]` | Merge-column info array (id + mergeRows config). Array order = left→right = high→low priority (ADR-) |

**Returns** — - Map of key `${rowIdx}_${colId}` → rowSpan number  skip cells exist as 0 (triggers null return in MergingGrid)  returns an empty Map if rows is an empty array

**Example**

```ts
// 단일 컬럼 — G-001과 동일 출력 (Regression Invariant)
const spanMap = computeMergeSpans(
  [{ dept: 'A' }, { dept: 'A' }, { dept: 'B' }],
  [{ id: 'dept', mergeRows: true }]
);
// spanMap.get('0_dept') === 2
// spanMap.get('1_dept') === 0
// spanMap.get('2_dept') === 1
```

## Types & Interfaces

### `MergingGridProps`

Props for the MergingGrid component.

| Property | Type | Description |
|---|---|---|
| `className?` | `string` | CSS className applied to the table element |
| `columns` | `MergingColumnDef<TData>[]` | Column definitions (including MergingColumnDef extension) |
| `data` | `TData[]` | Data array to render |
| `enableColSpan?` | `boolean` | Enable horizontal body-cell merging (colSpan). When `false` (default), colSpan is disabled — no colSpan attribute / no 0-covered cells (byte-identical). When `true`, horizontal merging is auto-computed for columns where the `meta.colSpan` callback is set. Independent of mergeRows(rowSpan) — applying both to the same cell is out of scope (vN). |
| `enableMerging?` | `boolean` | Enable the merging feature. When `false` (default), preserves regular Grid behavior ( / ). When `true`, rowSpan is auto-computed for columns where `meta.mergeRows` is set. |
| `enableVirtualization?` | `boolean` | Enable virtualization ( compatible). When `true`, uses @tanstack/react-virtual useVirtualizer. When `false` (default), keeps the / full DOM rendering path. |
| `estimatedRowHeight?` | `number` | Estimated row height for virtualization (px). Default: 40. Used only when `enableVirtualization=true`. ⚠️ assumes fixed row height — scrollOffset error may occur in variable-row-height environments. |
| `virtualOverscan?` | `number` | react-virtual overscan row count. Default: 5. Number of extra rows to render on each side of the visible window. Used only when `enableVirtualization=true`. |

### `ColSpanFn`

Horizontal body-cell merge (colSpan) callback.

XX Grid `colSpan:(params)=>number` equivalent — returns the number of columns this cell spans horizontally.
`1` (default) = no span, `n>1` = horizontally merges n columns including itself (the n-1 cells to the right are auto-skipped).
Unlike mergeRows (value-comparison-based rowSpan), this is a **per-cell callback form**.

```ts
type ColSpanFn = (…) => …
```

### `ColSpanMap`

The Map result of computeColSpans.

Key format: `${rowIdx}_${colId}`
- value > 1: this cell is the start cell that merges as many columns horizontally as the value (`colSpan` attribute)
- value === 0: this cell is covered by a left span and should be skipped (returns null)
- value === 1 or absent: normal cell with no merge

```ts
type ColSpanMap = Map<string, number>
```

### `MergeRowsConfig`

Cell merge comparison config.
- `true`: auto-merge by equal-value (`===`) comparison
- `(prev, curr) => boolean`: custom comparison function (supports composite conditions)

```ts
type MergeRowsConfig = boolean | (…) => …
```

### `MergeSpanMap`

The Map result of computeMergeSpans.

Key format: `${rowIdx}_${colId}`
- value > 1: this cell is the start cell that merges as many rows as the value
- value === 1: normal cell with no merge
- value === 0: this cell should be skipped due to merging (returns null)

```ts
type MergeSpanMap = Map<string, number>
```

### `MergingColumnDef`

Extended column definition supporting mergeRows / colSpan.
Adds merge configuration through the TanStack ColumnDef meta field.

```ts
type MergingColumnDef = ColumnDef<TData> & { … }
```
