---
title: "@topgrid/grid-pro-chart-enterprise-vue"
sidebar_label: "grid-pro-chart-enterprise-vue"
sidebar_position: 15
---

# @topgrid/grid-pro-chart-enterprise-vue

> Pro: Enterprise charting for Vue 3 (Apache ECharts) — reuses the framework-neutral @topgrid/grid-chart-core engine · **상용 (EULA)**

:::info 자동 생성
이 페이지는 소스 코드의 TSDoc 주석에서 자동 생성됩니다(내부 표식 정제). 큐레이트된 시작용 요약은 [API 레퍼런스](../api-reference) 참고.
:::

총 **13개** public export — 함수 4 · 훅 0 · 컴포넌트 0 · 타입 7 · 상수 2.

## 함수

### `checkLicense`

현재 라이선스 상태를 동기 검사하여 `LicenseCheckResult`를 반환한다.

- valid=false 이면 `watermarkRequired=true`.
- 유효하고 `expiresAt`까지 60일 미만이면 `expiryWarning='soon-expiring'` + `console.warn` (1회).
- 유효하고 만료 여유가 충분하면 `{ valid: true, watermarkRequired: false }`.

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

Pro 패키지 전역 라이선스 등록 API.
앱 entry(main.tsx / App.tsx)에서 1회 호출.

```ts
setLicenseKey(key: string): LicenseStatus
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `key` | `string` | Base64url(pubKey).Base64url(sig).Base64url(payload) 형식 라이선스 키 |

**반환** — LicenseStatus — 즉시 반환 (동기 wrapper, 내부 비동기 검증 완료 후 상태 갱신) 주의: 반환값은 Promise 없이 즉시 사용 가능하도록 동기 API로 설계. 내부적으로 verifySignature (async) 결과를 저장. 비동기 완료 전 getLicenseState 호출 시 기본값 &#123;valid:false, reason:'invalid'} 반환.

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

### `ChartSelection`

| 속성 | 타입 | 설명 |
|---|---|---|
| `name` | `string` |  |
| `value` | `unknown` |  |

### `ChartSeriesInput`

One named numeric series of a ChartMatrix (pure data; no framework types).

| 속성 | 타입 | 설명 |
|---|---|---|
| `color?` | `string` |  |
| `name` | `string` |  |
| `values` | `number[]` |  |

### `SsrChartSize`

| 속성 | 타입 | 설명 |
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

## 상수

### `EChartsChart`

```ts
const EChartsChart: DefineComponent<ExtractPropTypes<{ … }>, (…) => …, object, object, object, ComponentOptionsMixin, ComponentOptionsMixin, object, string, PublicProps, ToResolvedProps<ExtractPropTypes<{ … }>, object>, { … }, object, object, object, string, ComponentProvideOptions, true, object, any>
```

### `EnterpriseChartPanel`

```ts
const EnterpriseChartPanel: DefineComponent<ExtractPropTypes<{ … }>, (…) => …, object, object, object, ComponentOptionsMixin, ComponentOptionsMixin, object, string, PublicProps, ToResolvedProps<ExtractPropTypes<{ … }>, object>, { … }, object, object, object, string, ComponentProvideOptions, true, object, any>
```

