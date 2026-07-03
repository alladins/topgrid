---
title: "@topgrid/grid-sizing"
sidebar_label: "grid-sizing"
sidebar_position: 6
---

# @topgrid/grid-sizing

> Declarative column sizing: auto-size, star/flex ratio widths, sizeToFit (pure + injectable measurement) · **Free (MIT)**

:::info Auto-generated
This page is auto-generated from the TSDoc comments in the source code (internal markers stripped). For a curated getting-started summary, see the [API Reference](../api-reference).
:::

**17** public exports — 6 functions · 0 hooks · 0 components · 9 types · 2 constants.

## Functions

### `autoSizeColumn`

Compute the content-fit width (px) for one column:
`max(measure(header),...measure(cellValues)) + padding`, clamped to
`[min, max]` when provided.

```ts
autoSizeColumn(options: AutoSizeColumnOptions): number
```

### `autoSizeColumns`

Auto-size multiple columns at once, returning a `Record<columnId, px>` width
map (consistent with TanStack's `ColumnSizingState`).

```ts
autoSizeColumns(options: AutoSizeColumnsOptions): Record<string, number>
```

### `createCanvasMeasureText`

Create a MeasureText backed by the browser canvas 2D API.

In a browser, returns a measurer using
`document.createElement('canvas').getContext('2d').measureText(text).width`,
applying the optional CSS `font` shorthand per call. In node/SSR (no
`document`, or no 2D context), returns the estimateTextWidth fallback.
Never throws.

```ts
createCanvasMeasureText(): MeasureText
```

### `distributeStarWidths`

Distribute `totalWidth` across columns. Fixed columns take their px first;
the remaining width is split among star columns proportional to their factor.

Min-clamp re-distribution is ITERATIVE: when a star column's proportional
share falls below its `min`, that column is clamped to `min`, removed from the
star pool, its px subtracted from the remaining width, and the remaining star
columns are re-distributed. The loop repeats until no remaining star column
violates its `min` (clamping one column shrinks the pool and can push another
below its min — a single pass is insufficient).

Returns float px (no rounding) so ratios are exact (e.g. 133.33 / 266.67).

```ts
distributeStarWidths(options: DistributeStarWidthsOptions): Record<string, number>
```

### `parseColumnWidth`

Parse a column width spec.

- `'*'` → `{ kind: 'star', factor: 1 }`
- `'2*'` / `'3*'` → `{ kind: 'star', factor: 2|3 }`
- `120` / `'120px'` / `'120'` → `{ kind: 'fixed', px: 120 }`

```ts
parseColumnWidth(spec: string | number): ColumnWidthSpec
```

### `sizeToFit`

Scale `columns` so the resulting integer px widths sum to `containerWidth`.

Each column is scaled by `containerWidth / currentSum`, then rounded to an
integer. Rounding can leave a small leftover (the rounded sum may differ from
`containerWidth` by a few px); that leftover is assigned to the single widest
column so the final sum equals `containerWidth` exactly.

Edge cases: empty `columns` → `{}`. A current sum of 0 (all widths 0) cannot
be scaled proportionally, so the `containerWidth` is split evenly instead,
with the leftover going to the last column.

```ts
sizeToFit(options: SizeToFitOptions): Record<string, number>
```

## Types & Interfaces

### `AutoSizeColumnInput`

A single column's input to autoSizeColumns.

| Property | Type | Description |
|---|---|---|
| `cellValues` | `string[]` |  |
| `columnId` | `string` |  |
| `header` | `string` |  |
| `max?` | `number` |  |
| `min?` | `number` |  |

### `AutoSizeColumnOptions`

Options for autoSizeColumn.

| Property | Type | Description |
|---|---|---|
| `cellValues` | `string[]` | Cell text values to measure. |
| `columnId` | `string` |  |
| `font?` | `string` | CSS `font` shorthand passed to `measureText` (optional). |
| `header` | `string` | Header text to measure. |
| `max?` | `number` | Upper bound (px) for the result. |
| `measureText` | `MeasureText` | Injected text-width measurer. |
| `min?` | `number` | Lower bound (px) for the result. |
| `padding?` | `number` | Padding (px) added to the widest measured text. Defaults to DEFAULT_AUTOSIZE_PADDING. |

### `AutoSizeColumnsOptions`

Options for autoSizeColumns.

| Property | Type | Description |
|---|---|---|
| `columns` | `AutoSizeColumnInput[]` |  |
| `font?` | `string` | CSS `font` shorthand passed to `measureText` (optional). |
| `measureText` | `MeasureText` | Injected text-width measurer (shared across all columns). |
| `padding?` | `number` | Padding (px) applied to every column. Defaults to DEFAULT_AUTOSIZE_PADDING. |

### `DistributeStarWidthsOptions`

Options for distributeStarWidths.

| Property | Type | Description |
|---|---|---|
| `columns` | `StarColumnInput[]` |  |
| `totalWidth` | `number` | Total available width (px) to distribute across all columns. |

### `SizeToFitColumnInput`

A single column's input to sizeToFit.

| Property | Type | Description |
|---|---|---|
| `id` | `string` |  |
| `width` | `number` | Current width (px). |

### `SizeToFitOptions`

Options for sizeToFit.

| Property | Type | Description |
|---|---|---|
| `columns` | `SizeToFitColumnInput[]` |  |
| `containerWidth` | `number` | Target total width (px) the result must sum to. |

### `StarColumnInput`

A single column's input to distributeStarWidths.

| Property | Type | Description |
|---|---|---|
| `id` | `string` |  |
| `min?` | `number` | Optional lower bound (px) for a star column's resolved width. |
| `spec` | `string \| number` | Width spec: `'*'`, `'2*'`, `120`, or `'120px'`. |

### `ColumnWidthSpec`

Parsed result of a column width spec: a proportional star or a fixed px.

```ts
type ColumnWidthSpec = { … } | { … }
```

### `MeasureText`

Measures the rendered pixel width of `text`, optionally in a CSS `font`
shorthand (e.g. `'14px Arial'`). Host-injected so the sizing math stays pure
and testable (mirrors grid-pro-chart's injected `renderChart`).

```ts
type MeasureText = (…) => …
```

## Constants

### `approxCharPx`

Approximate average glyph width (px) used by the SSR/node fallback estimator
when canvas measurement is unavailable. Chosen as 8 to match the spec's
verification mock `(t) => t.length * 8`, giving deterministic, test-aligned
widths in non-browser environments.

```ts
const approxCharPx: 8
```

### `DEFAULT_AUTOSIZE_PADDING`

Default horizontal padding (px) added to the measured content width.

```ts
const DEFAULT_AUTOSIZE_PADDING: 16
```
