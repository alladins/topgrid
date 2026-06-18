# @topgrid/grid-pro-chart-enterprise-vue

Pro: Enterprise charting for **Vue 3**, powered by [Apache ECharts](https://echarts.apache.org/).

The chart **engine** (`matrixToEChartsOption`, the full 17-type catalog) is the framework-neutral
[`@topgrid/grid-chart-core`](../grid-chart-core) — the *same* option-builder that drives the React
package. This package is only the Vue render shell (`defineComponent` + `h`, ECharts lifecycle via
`onMounted` / `onBeforeUnmount`). Zero React.

`echarts` and `vue` are peer dependencies (echarts `5.x` or `6.x`) — your app supplies them, so the
whole app shares a single ECharts instance.

```ts
import { EnterpriseChartPanel } from '@topgrid/grid-pro-chart-enterprise-vue';

// in a Vue template:
// <EnterpriseChartPanel :data="matrix" initial-type="stacked-bar" @cross-filter="onSelect" />
```

`data` is a `ChartMatrix` (`{ categories, series }`) — grid-pro-chart's `seriesFromMatrix` /
`seriesFromPivot` output satisfies it structurally.

## License gate

This package imports no `@topgrid/grid-license` (which carries React peers). Pass the
`watermark` prop from your own `checkLicense().watermarkRequired` to gate Pro usage.

## Installation

```bash
pnpm add @topgrid/grid-pro-chart-enterprise-vue echarts vue
```

## License

Commercial — see [EULA](./EULA.md).
