# @topgrid/grid-pro-chart-enterprise

Pro: Enterprise charting for TopGrid, powered by [Apache ECharts](https://echarts.apache.org/)
(Apache-2.0) — wrapped over the existing `@topgrid/grid-pro-chart` range/pivot bridge.

This package **integrates** ECharts rather than reimplementing a chart engine. The lightweight,
zero-dependency SVG sparklines and `RangeChart` in `@topgrid/grid-pro-chart` are unchanged and
coexist — use those for in-cell visuals, and reach for this package when you need the full
enterprise chart catalog (stacked / scatter / pie / and more as the catalog grows).

`echarts` is a **peer dependency** (echarts `5.x` or `6.x`): your app installs it, so the whole
app shares a single ECharts instance (one `echarts.use()` registry) rather than bundling a copy.

## Status (scaffold)

The pure, node-tested catalog engine is available:

```ts
import { matrixToEChartsOption } from '@topgrid/grid-pro-chart-enterprise';
import { seriesFromMatrix } from '@topgrid/grid-pro-chart';

const data = seriesFromMatrix({ categories, columns, matrix });   // range or pivot bridge
const option = matrixToEChartsOption(data, { type: 'stacked-bar' });
// feed `option` to an ECharts instance (echarts.init(el).setOption(option))
```

Implemented chart types: `line`, `bar`, `area`, `stacked-bar`, `stacked-area`,
`100-stacked-bar`, `scatter`, `pie`, `doughnut`.

The thin `EChartsChart` React wrapper, the `RangeChartPanel`-compatible
`createEChartsRenderer` factory, and `EnterpriseChartPanel` (toolbar / PNG-SVG export /
cross-filter) land in the next increment.

## Installation

```bash
pnpm add @topgrid/grid-pro-chart-enterprise echarts
```

## License

Commercial — see [EULA](./EULA.md).
