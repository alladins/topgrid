import type { ReactNode } from 'react';
import type { RangeSeries } from '@topgrid/grid-pro-chart';
import { matrixToEChartsOption, type ChartOptionSpec } from './internal/matrixToEChartsOption.js';
import { EChartsChart } from './EChartsChart.js';

/**
 * Seam-compatible factory — produces a `renderChart` callback that satisfies the EXISTING
 * `RangeChartPanel.renderChart?: (series: RangeSeries[]) => ReactNode` injection seam, backed by
 * ECharts. This lets a consumer who only has the minimal grid-pro-chart panel drop in an enterprise
 * chart engine without changing that package (ADR-003 D1/R1 — integrate via the seam, don't mutate it).
 *
 * `RangeSeries` is lossy (numeric data, no x labels), so index positions become the categories.
 */
export function createEChartsRenderer(
  spec: ChartOptionSpec,
): (series: RangeSeries[]) => ReactNode {
  return (series: RangeSeries[]): ReactNode => {
    const maxLen = series.reduce((m, s) => Math.max(m, s.data.length), 0);
    const data = {
      categories: Array.from({ length: maxLen }, (_, i) => String(i + 1)),
      series: series.map((s, i) => ({ name: s.name ?? `series ${i + 1}`, values: s.data })),
    };
    return <EChartsChart option={matrixToEChartsOption(data, spec)} />;
  };
}
