---
title: "@topgrid/grid-pro-chart-enterprise"
sidebar_label: "grid-pro-chart-enterprise"
sidebar_position: 14
---

# @topgrid/grid-pro-chart-enterprise

> Pro: Enterprise charting (Apache ECharts adapter) over the grid-pro-chart range/pivot bridge · **Commercial (EULA)**

:::info Auto-generated
This page is auto-generated from the TSDoc comments in the source code (internal markers stripped). For a curated getting-started summary, see the [API Reference](../api-reference).
:::

**12** public exports — 2 functions · 0 hooks · 2 components · 8 types · 0 constants.

## Components

### `EChartsChart`

```ts
EChartsChart(__namedParameters: EChartsChartProps): Element
```

### `EnterpriseChartPanel`

```ts
EnterpriseChartPanel(__namedParameters: EnterpriseChartPanelProps): Element
```

## Functions

### `createEChartsRenderer`

Seam-compatible factory — produces a `renderChart` callback that satisfies the EXISTING
`RangeChartPanel.renderChart?: (series: RangeSeries[]) => ReactNode` injection seam, backed by
ECharts. This lets a consumer who only has the minimal grid-pro-chart panel drop in an enterprise
chart engine without changing that package ( / — integrate via the seam, don't mutate it).

`RangeSeries` is lossy (numeric data, no x labels), so index positions become the categories.

```ts
createEChartsRenderer(spec: ChartOptionSpec): (…) => …
```

### `matrixToEChartsOption`

Map a labelled matrix (range or pivot bridge output) to an ECharts option for the given type.
Pure: same inputs → same plain object. Throws on a type outside the implemented catalog.

```ts
matrixToEChartsOption(data: ChartMatrix, spec: ChartOptionSpec): EChartsOption
```

## Types & Interfaces

### `ChartMatrix`

Framework-neutral chart input — a labelled 2-D matrix. grid-pro-chart's `MatrixChartData`
(`seriesFromMatrix` / `seriesFromPivot` output) structurally satisfies this.

| Property | Type | Description |
|---|---|---|
| `categories` | `string[]` |  |
| `series` | `ChartSeriesInput[]` |  |

### `ChartOptionSpec`

| Property | Type | Description |
|---|---|---|
| `dataLabels?` | `boolean` | Show per-point value labels. |
| `secondaryAxisSeries?` | `string[]` | Series names that should plot against a secondary (right) Y axis. Cartesian types only. |
| `type` | `EnterpriseChartType` |  |

### `ChartSelection`

Payload handed to EChartsChartProps.onSelect when a datum is clicked (cross-filter source).

| Property | Type | Description |
|---|---|---|
| `name` | `string` |  |
| `value` | `unknown` |  |

### `ChartSeriesInput`

One named numeric series of a ChartMatrix (pure data; no framework types).

| Property | Type | Description |
|---|---|---|
| `color?` | `string` |  |
| `name` | `string` |  |
| `values` | `number[]` |  |

### `EChartsChartProps`

| Property | Type | Description |
|---|---|---|
| `className?` | `string` |  |
| `height?` | `string \| number` |  |
| `onInit?` | `(…) => …` | Receives the live instance once mounted (e.g. for `getDataURL` export). |
| `onSelect?` | `(…) => …` | Fires on datum click — wire to a grid filter for cross-filtering. |
| `option` | `EChartsOption` | Usually the result of `matrixToEChartsOption(...)`. |
| `width?` | `string \| number` |  |

### `EnterpriseChartPanelProps`

| Property | Type | Description |
|---|---|---|
| `className?` | `string` |  |
| `data` | `MatrixChartData` | Bridge output — `seriesFromMatrix(...)` / `seriesFromPivot(...)`. |
| `enableExport?` | `boolean` |  |
| `enableToolbar?` | `boolean` |  |
| `initialType?` | `EnterpriseChartType` |  |
| `onCrossFilter?` | `(…) => …` | Fires on chart datum click — map to a grid filter for cross-filtering. |
| `title?` | `string` |  |
| `toolbarTypes?` | `EnterpriseChartType[]` | Which types the toolbar offers. Defaults to a 6-type subset; pass any of the 17 catalog types. |

### `EChartsInstance`

Live ECharts instance type (avoids importing a named type that may shift across versions).

```ts
type EChartsInstance = ReturnType<query>
```

### `EnterpriseChartType`

Chart types implemented by the catalog engine.

```ts
type EnterpriseChartType = "line" | "bar" | "area" | "stacked-bar" | "stacked-area" | "100-stacked-bar" | "scatter" | "bubble" | "pie" | "doughnut" | "funnel" | "treemap" | "radar" | "heatmap" | "candlestick" | "boxplot" | "sankey"
```
