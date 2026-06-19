# BYO chart library — bring Highcharts / AG Charts (or any renderer)

TopGrid's charting is split so you are never locked into one library:

| Layer | Package | License | Notes |
|-------|---------|---------|-------|
| In-cell sparklines + lightweight range chart | `@topgrid/grid-pro-chart` | Commercial (yours) | **zero chart-lib dependency** — pure SVG |
| Enterprise catalog (17 types), bundled adapter | `@topgrid/grid-pro-chart-enterprise` (React) · `@topgrid/grid-pro-chart-enterprise-vue` (Vue) | Commercial (yours) + **Apache ECharts (Apache-2.0)** | ECharts is a peer dep you install |
| **Bring-your-own** (Highcharts, AG Charts, …) | *none — you inject* | **your** Highcharts/AG license | via the `renderChart` seam below |

We bundle ECharts because it is Apache-2.0 (no license obligation passed to you). **Highcharts** (commercial)
and **AG Charts Enterprise** (commercial) are *not* bundled — but the injection seam is open, so if you
already license one, you can render it inside TopGrid with no extra dependency from us (ADR-003 R4).

## The seam

`RangeChartPanel` imports **no** chart library. It calls a `renderChart` callback you supply:

```ts
// @topgrid/grid-pro-chart
interface RangeChartPanelProps {
  series: RangeSeries[];                          // RangeSeries = { name?: string; data: number[] }
  renderChart?: (series: RangeSeries[]) => ReactNode;   // ← inject ANY library here
  title?: string;
}
```

When `renderChart` is omitted you get a graceful placeholder (it never throws). When provided, the panel
renders exactly what you return — React node, so any React chart component works.

## Highcharts (BYO — you hold a Highcharts license)

```tsx
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { RangeChartPanel, type RangeSeries } from '@topgrid/grid-pro-chart';

const renderHighcharts = (series: RangeSeries[]) => (
  <HighchartsReact
    highcharts={Highcharts}
    options={{
      title: { text: undefined },
      series: series.map((s) => ({ type: 'column', name: s.name, data: s.data })),
    }}
  />
);

<RangeChartPanel series={selectedSeries} renderChart={renderHighcharts} />;
```

## AG Charts (Community = MIT, or Enterprise = your license)

```tsx
import { AgCharts } from 'ag-charts-react';
import { RangeChartPanel, type RangeSeries } from '@topgrid/grid-pro-chart';

const renderAg = (series: RangeSeries[]) => (
  <AgCharts
    options={{
      data: series[0]?.data.map((v, i) => ({ x: i, y: v })) ?? [],
      series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
    }}
  />
);

<RangeChartPanel series={selectedSeries} renderChart={renderAg} />;
```

## Range / pivot data → series

To chart a selected cell range or a pivot result, reuse the existing bridges (no chart lib needed):

```ts
import { seriesFromMatrix, seriesFromPivot } from '@topgrid/grid-pro-chart';
const { series } = seriesFromMatrix({ categories, columns, matrix }); // → ChartSeries[]
// map ChartSeries (name, values) → RangeSeries (name, data) for RangeChartPanel,
// or feed the matrix straight to matrixToEChartsOption from @topgrid/grid-chart-core.
```

## When to use which

- **In-cell / tiny range visuals** → `SparklineCell` / `RangeChart` (zero-dep, always available).
- **Full enterprise catalog, no per-seat chart license** → the ECharts enterprise packages (we bundle ECharts; Apache-2.0).
- **You already standardize on Highcharts / AG Enterprise** → inject via `renderChart` as above; we add no dependency and pass no license obligation.

> The mechanical guarantee (an arbitrary, non-ECharts renderer renders through the seam) is covered by
> `tests/visual/range-chart-panel-byo.spec.ts`.
