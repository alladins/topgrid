# @topgrid/grid-chart-core

Framework-neutral chart engine for TopGrid: maps a labelled 2-D matrix (range or pivot data) to an
[Apache ECharts](https://echarts.apache.org/) option object. **Pure** — no React, no Vue, no grid
coupling, and `echarts` is a type-only optional peer (the engine builds plain option objects).

This is the shared core behind the per-framework enterprise chart packages
(`@topgrid/grid-pro-chart-enterprise` for React; a Vue counterpart). Use it directly if you drive
ECharts yourself.

```ts
import { matrixToEChartsOption, type ChartMatrix } from '@topgrid/grid-chart-core';

const data: ChartMatrix = {
  categories: ['Q1', 'Q2', 'Q3', 'Q4'],
  series: [{ name: 'Revenue', values: [40, 70, 55, 90] }],
};
const option = matrixToEChartsOption(data, { type: 'stacked-bar' });
// echarts.init(el).setOption(option)
```

Implemented chart types: `line`, `bar`, `area`, `stacked-bar`, `stacked-area`, `100-stacked-bar`,
`scatter`, `bubble`, `pie`, `doughnut`, `funnel`, `treemap`, `radar`, `heatmap`, `candlestick`,
`boxplot`, `sankey`.

## License

Commercial — see [EULA](./EULA.md).
