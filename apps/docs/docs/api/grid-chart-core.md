---
title: "@topgrid/grid-chart-core"
sidebar_label: "grid-chart-core"
sidebar_position: 9
---

# @topgrid/grid-chart-core

> Framework-neutral chart engine: labelled matrix → Apache ECharts option (no React/Vue; echarts type-only) · **상용 (EULA)**

:::info 자동 생성
이 페이지는 소스 코드의 TSDoc 주석에서 자동 생성됩니다(내부 표식 정제). 큐레이트된 시작용 요약은 [API 레퍼런스](../api-reference) 참고.
:::

총 **5개** public export — 함수 1 · 훅 0 · 컴포넌트 0 · 타입 4 · 상수 0.

## 함수

### `matrixToEChartsOption`

Map a labelled matrix (range or pivot bridge output) to an ECharts option for the given type.
Pure: same inputs → same plain object. Throws on a type outside the implemented catalog.

```ts
matrixToEChartsOption(data: ChartMatrix, spec: ChartOptionSpec): EChartsOption
```

## 타입 · 인터페이스

### `ChartMatrix`

Framework-neutral chart input — a labelled 2-D matrix. grid-pro-chart's `MatrixChartData`
(`seriesFromMatrix` / `seriesFromPivot` output) structurally satisfies this.

| 속성 | 타입 | 설명 |
|---|---|---|
| `categories` | `string[]` |  |
| `series` | `ChartSeriesInput[]` |  |

### `ChartOptionSpec`

| 속성 | 타입 | 설명 |
|---|---|---|
| `dataLabels?` | `boolean` | Show per-point value labels. |
| `secondaryAxisSeries?` | `string[]` | Series names that should plot against a secondary (right) Y axis. Cartesian types only. |
| `type` | `EnterpriseChartType` |  |

### `ChartSeriesInput`

One named numeric series of a ChartMatrix (pure data; no framework types).

| 속성 | 타입 | 설명 |
|---|---|---|
| `color?` | `string` |  |
| `name` | `string` |  |
| `values` | `number[]` |  |

### `EnterpriseChartType`

Chart types implemented by the catalog engine.

```ts
type EnterpriseChartType = "line" | "bar" | "area" | "stacked-bar" | "stacked-area" | "100-stacked-bar" | "scatter" | "bubble" | "pie" | "doughnut" | "funnel" | "treemap" | "radar" | "heatmap" | "candlestick" | "boxplot" | "sankey"
```

