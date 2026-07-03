# Charts

topgrid provides **three layers** for visualizing grid data — from inline cell sparklines
to a catalog of 17 enterprise chart types. **Both React and Vue 3** are supported by the same engine.

## Which package do you need

| Use case | Package | License |
|---|---|---|
| In-cell sparklines (line/bar/area/win-loss) | `@topgrid/grid-pro-chart` | Pro |
| Lightweight range charts (zero-dep SVG, 3 types) | `@topgrid/grid-pro-chart` | Pro |
| **Enterprise catalog, 17 types (React)** | `@topgrid/grid-pro-chart-enterprise` + `echarts` | Pro + Apache-2.0 |
| **Enterprise catalog, 17 types (Vue 3)** | `@topgrid/grid-pro-chart-enterprise-vue` + `echarts` + `vue` | Pro + Apache-2.0 |
| Framework-agnostic option engine only | `@topgrid/grid-chart-core` | Pro |
| Inject Highcharts / AG Charts directly (BYO) | Injection shim (zero extra deps) | Your own license |

- **`grid-pro-chart`** has **zero** chart-library dependencies (pure SVG) — for cell and lightweight visualizations.
- **Enterprise** uses [Apache ECharts](https://echarts.apache.org/) (Apache-2.0) as a **peer** dependency —
  the consumer installs `echarts` (5.x or 6.x), and the whole app shares a single ECharts instance.
- 17 types: line·bar·area·stacked-bar·stacked-area·100-stacked-bar·scatter·bubble·pie·doughnut·
  funnel·treemap·radar·heatmap·candlestick·boxplot·sankey.

## Data → chart (shared by range / pivot)

Chart input reduces to a single **labelled matrix** — whether it comes from a cell-range selection or a pivot result, it is the same.

```ts
import { seriesFromMatrix } from '@topgrid/grid-pro-chart';      // 또는 seriesFromPivot
import { matrixToEChartsOption } from '@topgrid/grid-chart-core';

const data = seriesFromMatrix({ categories, columns, matrix });   // { categories, series }
const option = matrixToEChartsOption(data, { type: 'stacked-bar', dataLabels: true });
```

`matrixToEChartsOption` is **framework-neutral** (React/Vue agnostic) — the React and Vue packages call the *same*
function, so the chart output is identical.

## React quick start

```tsx
import { EnterpriseChartPanel } from '@topgrid/grid-pro-chart-enterprise';
import { setLicenseKey } from '@topgrid/grid-license';

setLicenseKey(MY_KEY);  // 앱 entry 1회 (미설정 시 watermark)

<EnterpriseChartPanel
  data={data}
  initialType="bar"
  toolbarTypes={['bar', 'line', 'radar', 'heatmap']}   // 17 중 선택 노출
  enableExport
  onCrossFilter={(sel) => applyGridFilter(sel.name)}    // 차트 클릭 → 그리드 필터
/>
```

## Vue 3 quick start

```ts
import { EnterpriseChartPanel, setLicenseKey } from '@topgrid/grid-pro-chart-enterprise-vue';
setLicenseKey(MY_KEY);
// <EnterpriseChartPanel :data="data" initial-type="bar"
//   :toolbar-types="['bar','radar','heatmap']" @cross-filter="onSelect" />
```

- License watermark is **gated automatically** (on par with React) — with **zero React dependency**.
- Server-side static SVG: `renderChartToSvgString(option, { width, height })` (SSR, no DOM required).
- **Live demo**: [Vue 3 enterprise chart](pathname:///vue-chart-demo/) (switch types via the toolbar) — also embedded on the [Examples page](./migration/live-demos).

:::tip Vue Pro data → chart
To feed **pivot / server-side results into a chart** in a Vue 3 app, pair the new Vue Pro packages:
- **Pivot → chart**: pass the `useVuePivot` model from [`@topgrid/grid-pro-pivot-vue`](./api/grid-pro-pivot-vue) through `seriesFromPivot` → `matrixToEChartsOption`.
- **Server data → chart**: convert data from `useVueServerSideData` in [`@topgrid/grid-pro-serverside-vue`](./api/grid-pro-serverside-vue) via `seriesFromMatrix`.

See [Getting Started §4.5](./getting-started#45-vue-3--pivot--server-side-pro) for usage.
:::

## Cell / lightweight charts (zero-dep)

```tsx
import { SparklineCell, RangeChart } from '@topgrid/grid-pro-chart';
<SparklineCell type="line" values={[3, 8, 4, 9, 6]} />       // 셀 안 스파크라인
<RangeChart type="bar" series={series} categories={months} /> // 경량 SVG 차트
```

## Bring-your-own (Highcharts / AG Charts)

Instead of using ECharts, you can inject a library you have licensed yourself — the
`renderChart` shim on `RangeChartPanel` is library-agnostic.

```tsx
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { RangeChartPanel } from '@topgrid/grid-pro-chart';

<RangeChartPanel
  series={selectedSeries}
  renderChart={(s) => (
    <HighchartsReact highcharts={Highcharts}
      options={{ series: s.map((x) => ({ type: 'column', name: x.name, data: x.data })) }} />
  )}
/>
```

ECharts is Apache-2.0, so bundling and redistribution carry no obligations. Highcharts and AG Charts Enterprise
are BYO under the **consumer's own license** (we do not bundle them).
