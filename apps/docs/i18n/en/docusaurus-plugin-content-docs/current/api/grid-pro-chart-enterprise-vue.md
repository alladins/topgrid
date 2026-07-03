---
title: "@topgrid/grid-pro-chart-enterprise-vue"
sidebar_label: "grid-pro-chart-enterprise-vue"
sidebar_position: 15
---

# @topgrid/grid-pro-chart-enterprise-vue

> Pro: Enterprise charting for Vue 3 (Apache ECharts) — reuses the framework-neutral @topgrid/grid-chart-core engine · **Commercial (EULA)**

:::info Auto-generated
This page is auto-generated from TSDoc comments in the source code (internal markers scrubbed). For a curated getting-started summary, see the [API Reference](../api-reference).
:::

**13** public exports — 4 functions · 0 hooks · 0 components · 7 types · 2 constants.

## Functions

### `checkLicense`

Synchronously checks the current license state and returns a `LicenseCheckResult`.

- If valid=false, then `watermarkRequired=true`.
- If valid and less than 60 days remain until `expiresAt`, then `expiryWarning='soon-expiring'` + `console.warn` (once).
- If valid and there is ample margin before expiry, `{ valid: true, watermarkRequired: false }`.

```ts
checkLicense(): LicenseCheckResult
```

### `matrixToEChartsOption`

Map a labelled matrix (range or pivot bridge output) to an ECharts option for the given type.
Pure: same inputs → same plain object. Throws on a type outside the implemented catalog.

```ts
matrixToEChartsOption(data: ChartMatrix, spec: ChartOptionSpec): EChartsOption
```

### `renderChartToSvgString`

Render a chart option to an SVG string server-side (no browser). Pair with `matrixToEChartsOption`:

```ts
​import { matrixToEChartsOption } from '@topgrid/grid-chart-core';
​import { renderChartToSvgString } from '@topgrid/grid-pro-chart-enterprise-vue';
const svg = renderChartToSvgString(matrixToEChartsOption(data, { type: 'bar' }), { width: 640 });
// → inject `svg` into your SSR'd HTML
```

```ts
renderChartToSvgString(option: EChartsOption, size: SsrChartSize): string
```

### `setLicenseKey`

The global license registration API for Pro packages.
Call once from the app entry (main.tsx / App.tsx).

```ts
setLicenseKey(key: string): LicenseStatus
```

| Parameter | Type | Description |
|---|---|---|
| `key` | `string` | A license key in the format Base64url(pubKey).Base64url(sig).Base64url(payload) |

**Returns** — LicenseStatus — returned immediately (a synchronous wrapper; the state is updated after internal async verification completes). Note: the return value is designed as a synchronous API so it can be used immediately without a Promise. Internally it stores the result of verifySignature (async). Calling getLicenseState before the async completion returns the default &#123;valid:false, reason:'invalid'}.

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

### `SsrChartSize`

| Property | Type | Description |
|---|---|---|
| `height?` | `number` |  |
| `width?` | `number` | SSR needs explicit pixels (no DOM to measure). Default 600×300. |

### `EChartsInstance`

```ts
type EChartsInstance = ReturnType<query>
```

### `EnterpriseChartType`

Chart types implemented by the catalog engine.

```ts
type EnterpriseChartType = "line" | "bar" | "area" | "stacked-bar" | "stacked-area" | "100-stacked-bar" | "scatter" | "bubble" | "pie" | "doughnut" | "funnel" | "treemap" | "radar" | "heatmap" | "candlestick" | "boxplot" | "sankey"
```

## Constants

### `EChartsChart`

```ts
const EChartsChart: DefineComponent<ExtractPropTypes<{ … }>, (…) => …, object, object, object, ComponentOptionsMixin, ComponentOptionsMixin, object, string, PublicProps, ToResolvedProps<ExtractPropTypes<{ … }>, object>, { … }, object, object, object, string, ComponentProvideOptions, true, object, any>
```

### `EnterpriseChartPanel`

```ts
const EnterpriseChartPanel: DefineComponent<ExtractPropTypes<{ … }>, (…) => …, object, object, object, ComponentOptionsMixin, ComponentOptionsMixin, object, string, PublicProps, ToResolvedProps<ExtractPropTypes<{ … }>, object>, { … }, object, object, object, string, ComponentProvideOptions, true, object, any>
```

