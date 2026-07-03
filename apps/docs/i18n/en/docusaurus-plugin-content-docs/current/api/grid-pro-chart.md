---
title: "@topgrid/grid-pro-chart"
sidebar_label: "grid-pro-chart"
sidebar_position: 13
---

# @topgrid/grid-pro-chart

> Pro: Sparkline cells (zero-dep SVG) + injectable Range Chart panel · **Commercial (EULA)**

:::info Auto-generated
This page is auto-generated from the TSDoc comments in the source code (internal markers stripped). For a curated getting-started summary, see the [API Reference](../api-reference).
:::

**24** public exports — 6 functions · 0 hooks · 4 components · 14 types · 0 constants.

## Components

### `ChartCard`

RangeChart wrapped with an interactive type-switcher toolbar.

The toolbar buttons use inline styles (not Tailwind) so they are testable in the Tailwind-less
storybook harness (P27-1) and visibly reflect the active type via `aria-pressed`. Clicking a
button re-renders the chart with the new `type` — the chart shape genuinely changes
(`data-chart-type`), which is the non-vacuous claim the gate checks.

```ts
ChartCard(__namedParameters: ChartCardProps): Element
```

### `RangeChart`

Built-in cartesian range chart — pure SVG, zero chart-library dependency (/AP-001).

Layout/scaling is delegated to computeChartGeometry (the node-tested core); this
component turns the computed pixel coordinates into `<rect>`/`<polyline>`/`<polygon>`/axis
elements, plus an in-SVG legend and hover tooltip (kept INSIDE the `<svg>` — no HTML overlay —
to stay consistent with the pure-SVG decision and avoid a wrapper-positioning refactor).

```ts
RangeChart(__namedParameters: RangeChartProps): Element
```

### `RangeChartPanel`

Range chart panel — renders an injected chart for one or more numeric series.

This package bundles no charting library; the caller supplies `renderChart`
(adapter injection, / AP-001). Without a valid Pro license a watermark
is composited over the panel (the root is `relative` so the absolutely
positioned `<Watermark>` anchors to it).

```ts
RangeChartPanel(__namedParameters: RangeChartPanelProps): Element
```

### `SparklineCell`

Sparkline cell — compact inline SVG chart for a numeric series.

Library-agnostic and zero-dependency: the chart is drawn with native SVG
`<polyline>`/`<polygon>`/`<rect>` elements, so no charting peer is required
( / AP-001 — the package imports no chart library).

```ts
SparklineCell(__namedParameters: SparklineCellProps): Element
```

## Functions

### `bandScale`

Band scale over `[r0,r1]` for `count` categories. `paddingRatio` (0..1) is the fraction of each
slot left empty as gap. Bars/vertices sit at band centres, evenly spaced and symmetric within
the range.

```ts
bandScale(count: number, range: [number, number], paddingRatio: number): BandScale
```

### `computeChartGeometry`

Compute the full pixel geometry for a cartesian (line/bar) chart from raw series.

- y domain is the niced range of ALL finite values across ALL series, so axis ticks land on
 round numbers and every series shares one scale (comparable).
- x is a band scale over the longest series' length.
- Non-finite values (NaN/±Infinity) keep their slot index but are omitted from `points` (a gap),
 never silently shifting later points left.

```ts
computeChartGeometry(seriesList: ChartSeries[], opts: { … }): ChartGeometry
```

### `linearScale`

Linear scale mapping `domain` → `range`. A flat domain (d0===d1) maps everything to the range
midpoint (so a constant series draws a centred flat line, never a divide-by-zero).

```ts
linearScale(domain: [number, number], range: [number, number]): LinearScale
```

### `niceTicks`

"Nice" round tick values covering [min,max] with roughly `count` intervals. The returned array
starts ≤ min and ends ≥ max (the niced domain), with a round step (1/2/5 × 10ⁿ). A flat input
(min===max) returns a single tick; non-finite input returns [].

```ts
niceTicks(min: number, max: number, count: number): number[]
```

### `seriesFromMatrix`

Turn a labelled 2-D matrix into chart series + x categories.

Orientation decides the pivot of the data: charting a 3-region × 2-quarter matrix `'columns'`
gives one series per quarter across regions; `'rows'` gives one series per region across quarters.
Same numbers, transposed grouping — the bug this guards is silently charting the wrong axis.

```ts
seriesFromMatrix(input: MatrixInput): MatrixChartData
```

### `seriesFromPivot`

Reduce a pivot result into chart series — pure, node-testable.

★ This is the REAL pivot→chart adapter (not a hand-fed matrix): it keeps only `__kind==='data'`
rows (dropping subtotal/grandTotal), labels each by its row-dimension values, and reads each leaf
column's value cell `<leafKey>__<valueIndex>` into the matrix — then defers to
seriesFromMatrix. One measure at a time (`valueIndex`, default 0); multi-measure charting
is a caller choice (call once per index).

```ts
seriesFromPivot(model: PivotLike, opts: { … }): MatrixChartData
```

## Types & Interfaces

### `ChartCardProps`

| Property | Type | Description |
|---|---|---|
| `ariaLabel?` | `string` | Accessible label for the chart. Default `'chart'`. |
| `categories?` | `string[]` | Optional category labels for the x-axis (one per slot). |
| `className?` | `string` | className appended to the root `<svg>`. |
| `dock?` | `ChartDock` | : where the type/settings toolbar docks relative to the chart (composition). Inline flex (P27-1 — Tailwind inert in the harness). `'top'`/`'bottom'` stack; `'left'`/`'right'` place the toolbar beside the chart. |
| `height?` | `number` | SVG height in px. Default `200`. |
| `initialType?` | `RangeChartType` | Initial chart type. Default `'bar'`. |
| `onSelectCategory?` | `(…) => …` | (cross-filter): fired when a category slot (bar/point) is clicked, with its 0-based index. Consumers map index→category label and feed `selectionsToFilter` (`@topgrid/grid-pro-filter`) to drive a linked grid filter. When set, marks become clickable. |
| `selectedCategory?` | `null \| number` | (linked highlight): the currently-selected category index (or `null`/omitted for none). The selected slot stays full-opacity; unselected slots dim — the visual link to the grid. |
| `series` | `ChartSeries[]` | Series to plot. Each `values[i]` shares category slot `i` across series. |
| `showLegend?` | `boolean` | Show the series legend (swatch + name). Default `true`. |
| `showTooltip?` | `boolean` | Show a value tooltip on hover. Default `true`. |
| `title?` | `string` | Optional title shown at the toolbar's left. |
| `types?` | `RangeChartType[]` | Chart types offered by the toolbar switcher. Default `['bar','line','area']`. |
| `width?` | `number` | SVG width in px. Default `360`. |

### `ChartGeometry`

Computed pixel geometry for the whole chart — everything the renderer needs.

| Property | Type | Description |
|---|---|---|
| `plot` | `PlotArea` |  |
| `series` | `{ … }[]` |  |
| `xBand` | `BandScale` |  |
| `yScale` | `LinearScale` |  |
| `yTicks` | `number[]` |  |

### `ChartPoint`

A single plotted vertex: pixel position + the original value/category index.

| Property | Type | Description |
|---|---|---|
| `index` | `number` |  |
| `value` | `number` |  |
| `x` | `number` |  |
| `y` | `number` |  |

### `ChartSeries`

One input series for the chart.

| Property | Type | Description |
|---|---|---|
| `color?` | `string` |  |
| `name` | `string` |  |
| `values` | `number[]` |  |

### `MatrixChartData`

| Property | Type | Description |
|---|---|---|
| `categories` | `string[]` | x-axis category labels for the chosen orientation. |
| `series` | `ChartSeries[]` | Series ready to hand to RangeChart. |

### `MatrixInput`

| Property | Type | Description |
|---|---|---|
| `categories` | `string[]` | Row labels — the x-axis categories when orientation is `'columns'`. |
| `colors?` | `string[]` | Optional colour per produced series (by series index). |
| `columns` | `string[]` | Column labels — the series names when orientation is `'columns'`. |
| `matrix` | `number[][]` | `matrix[rowIndex][colIndex]` numeric value. Non-finite entries are kept (the chart gaps them). |
| `orientation?` | `"columns" \| "rows"` | Which axis becomes a series: - `'columns'` (default): each COLUMN is a series (values read down the rows); x = row labels. - `'rows'`: each ROW is a series (values read across the columns); x = column labels. |

### `PivotLike`

Minimal structural shape of a pivot result needed to chart it — declared locally so grid-pro-chart
stays DECOUPLED from grid-pro-pivot (no package dependency / no cycle). Any object matching this
shape (e.g. a real `PivotModel`) can be charted.

| Property | Type | Description |
|---|---|---|
| `columnLeafKeys` | `string[]` |  |
| `columnTree?` | `{ … }[]` |  |
| `config` | `{ … }` |  |
| `rows` | `{ … }[]` |  |

### `RangeChartPanelProps`

Props for RangeChartPanel.

The panel is chart-library-agnostic: it does NOT import any chart library
( / AP-001). The consumer injects a `renderChart` callback that maps the
series to a `ReactNode` using whatever charting library they choose — the
same injection pattern as `IconCell`'s `icon: ReactNode` prop.

| Property | Type | Description |
|---|---|---|
| `className?` | `string` | Additional className appended to the root container. |
| `renderChart?` | `(…) => …` | Injected renderer. When provided, the panel renders `renderChart(series)`. When omitted, a graceful informational placeholder is shown (never throws). |
| `series` | `RangeSeries[]` | Series to visualise (e.g. data captured from a range selection). |
| `title?` | `string` | Optional panel title. |

### `RangeChartProps`

| Property | Type | Description |
|---|---|---|
| `ariaLabel?` | `string` | Accessible label for the chart. Default `'chart'`. |
| `categories?` | `string[]` | Optional category labels for the x-axis (one per slot). |
| `className?` | `string` | className appended to the root `<svg>`. |
| `height?` | `number` | SVG height in px. Default `200`. |
| `onSelectCategory?` | `(…) => …` | (cross-filter): fired when a category slot (bar/point) is clicked, with its 0-based index. Consumers map index→category label and feed `selectionsToFilter` (`@topgrid/grid-pro-filter`) to drive a linked grid filter. When set, marks become clickable. |
| `selectedCategory?` | `null \| number` | (linked highlight): the currently-selected category index (or `null`/omitted for none). The selected slot stays full-opacity; unselected slots dim — the visual link to the grid. |
| `series` | `ChartSeries[]` | Series to plot. Each `values[i]` shares category slot `i` across series. |
| `showLegend?` | `boolean` | Show the series legend (swatch + name). Default `true`. |
| `showTooltip?` | `boolean` | Show a value tooltip on hover. Default `true`. |
| `type?` | `RangeChartType` | Chart shape. Default `'bar'`. |
| `width?` | `number` | SVG width in px. Default `360`. |

### `RangeSeries`

A single named numeric series passed to a RangeChartPanel renderer.

| Property | Type | Description |
|---|---|---|
| `data` | `number[]` | Numeric data points (e.g. the values inside a selected range). |
| `name?` | `string` | Optional display name for the series. |

### `SparklineCellProps`

Props for SparklineCell.

Zero-dependency inline mini-chart rendered as pure SVG (no chart library
​import — / AP-001). Safe with empty input (dash placeholder) and
non-finite values (NaN/Infinity are skipped before scaling).

| Property | Type | Description |
|---|---|---|
| `className?` | `string` | Additional className appended to the root `<svg>`. |
| `color?` | `string` | Stroke/fill colour (any CSS colour). Default `'currentColor'`. |
| `height?` | `number` | SVG height in px. Default `20`. |
| `showMinMax?` | `boolean` | Mark the min and max points with dots (line/area only). Default `false`. |
| `type?` | `SparklineType` | Sparkline shape. Default `'line'`. |
| `values` | `number[]` | Data points. Empty array → dash placeholder. NaN/Infinity entries are skipped. |
| `width?` | `number` | SVG width in px. Default `80`. |

### `ChartDock`

Where the settings/type toolbar docks relative to the chart ( composition).

```ts
type ChartDock = "top" | "bottom" | "left" | "right"
```

### `RangeChartType`

Cartesian chart type. line/bar/area all share the same scale + axis machinery.

```ts
type RangeChartType = "line" | "bar" | "area"
```

### `SparklineType`

Sparkline render type.
- `line` polyline through the points.
- `bar` one column per value, scaled to the series range.
- `area` filled polygon under the line.
- `win-loss` 0-baseline bars: above for >0, below for &lt;0, nothing for 0.

```ts
type SparklineType = "line" | "bar" | "area" | "win-loss"
```
