---
title: "@topgrid/grid-chart-core"
sidebar_label: "grid-chart-core"
sidebar_position: 9
---

# @topgrid/grid-chart-core

> Framework-neutral chart engine: labelled matrix → Apache ECharts option (no React/Vue; echarts type-only) · **Commercial (EULA)**

:::info Auto-generated
This page is auto-generated from the TSDoc comments in the source code (internal markers stripped). For a curated getting-started summary, see the [API Reference](../api-reference).
:::

**5** public exports — 1 function · 0 hooks · 0 components · 4 types · 0 constants.

## Functions

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

### `ChartSeriesInput`

One named numeric series of a ChartMatrix (pure data; no framework types).

| Property | Type | Description |
|---|---|---|
| `color?` | `string` |  |
| `name` | `string` |  |
| `values` | `number[]` |  |

### `EnterpriseChartType`

Chart types implemented by the catalog engine.

```ts
type EnterpriseChartType = "line" | "bar" | "area" | "stacked-bar" | "stacked-area" | "100-stacked-bar" | "scatter" | "bubble" | "pie" | "doughnut" | "funnel" | "treemap" | "radar" | "heatmap" | "candlestick" | "boxplot" | "sankey"
```
