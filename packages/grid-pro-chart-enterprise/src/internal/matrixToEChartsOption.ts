/**
 * MatrixChartData → ECharts option — pure, node-testable, zero runtime echarts (ADR-003 D1/D2).
 *
 * ★ This is the catalog engine: it maps the EXISTING grid-pro-chart range/pivot bridge output
 * (`MatrixChartData = { categories, series: ChartSeries[] }`) onto an ECharts `EChartsOption`.
 * No chart is rendered here — only a plain option object is built — so the whole engine is proven
 * in node (zero deps) and the live ECharts mount stays a thin wrapper concern (next increment).
 *
 * `echarts` is a TYPE-ONLY import: `node --experimental-strip-types` erases it, so the node test
 * runs without echarts installed; `tsc` still type-checks the option shape.
 *
 * Catalog coverage (scaffold) = the 3 distinct mapping SHAPES:
 *   - cartesian/stacked: line · bar · area · stacked-bar · stacked-area · 100-stacked-bar
 *   - scatter:           scatter
 *   - pie:               pie · doughnut
 * Remaining target types (radar/heatmap/candlestick/boxplot/funnel/treemap/sankey/bubble) reshape
 * the data differently and are deferred to the next increment — the union below only lists what is
 * actually implemented, so the public type never lies (anti-over-claim).
 */
import type { EChartsOption } from 'echarts';
import type { MatrixChartData } from '@topgrid/grid-pro-chart';

/** Chart types implemented by the scaffold engine. Expands as the catalog grows. */
export type EnterpriseChartType =
  | 'line'
  | 'bar'
  | 'area'
  | 'stacked-bar'
  | 'stacked-area'
  | '100-stacked-bar'
  | 'scatter'
  | 'pie'
  | 'doughnut';

export interface ChartOptionSpec {
  type: EnterpriseChartType;
  /** Series names that should plot against a secondary (right) Y axis. Cartesian types only. */
  secondaryAxisSeries?: string[];
  /** Show per-point value labels. */
  dataLabels?: boolean;
}

const CARTESIAN = new Set<EnterpriseChartType>([
  'line',
  'bar',
  'area',
  'stacked-bar',
  'stacked-area',
  '100-stacked-bar',
]);

/** Per-category percentage normalisation for 100%-stacked charts (sum across series → 100 at each x). */
function normalizeTo100(series: MatrixChartData['series']): MatrixChartData['series'] {
  const catCount = series.reduce((m, s) => Math.max(m, s.values.length), 0);
  const totals = Array.from({ length: catCount }, (_, c) =>
    series.reduce((sum, s) => sum + (Number.isFinite(s.values[c]) ? s.values[c] : 0), 0),
  );
  return series.map((s) => ({
    ...s,
    values: s.values.map((v, c) => {
      const t = totals[c];
      return t === 0 || !Number.isFinite(v) ? 0 : (v / t) * 100;
    }),
  }));
}

/**
 * Map a labelled matrix (range or pivot bridge output) to an ECharts option for the given type.
 * Pure: same inputs → same plain object. Throws on a type outside the implemented catalog.
 */
export function matrixToEChartsOption(
  data: MatrixChartData,
  spec: ChartOptionSpec,
): EChartsOption {
  const { type } = spec;
  const showLabel = spec.dataLabels ?? false;

  if (type === 'pie' || type === 'doughnut') {
    // Pie family: no axes; the FIRST series provides the slice values, categories name the slices.
    const first = data.series[0];
    const pieData = (first?.values ?? []).map((value, i) => ({
      name: data.categories[i] ?? String(i),
      value,
    }));
    return {
      tooltip: { trigger: 'item' },
      legend: {},
      series: [
        {
          name: first?.name,
          type: 'pie',
          radius: type === 'doughnut' ? ['40%', '70%'] : '70%',
          data: pieData,
          label: { show: showLabel },
        },
      ],
    };
  }

  if (type === 'scatter') {
    // Scatter: each series becomes [categoryIndex, value] points against a value/category axis.
    return {
      tooltip: { trigger: 'item' },
      legend: {},
      xAxis: { type: 'category', data: data.categories },
      yAxis: { type: 'value' },
      series: data.series.map((s) => ({
        name: s.name,
        type: 'scatter',
        data: s.values.map((v, i) => [i, v] as [number, number]),
        label: { show: showLabel },
      })),
    };
  }

  if (CARTESIAN.has(type)) {
    const stacked = type === 'stacked-bar' || type === 'stacked-area' || type === '100-stacked-bar';
    const area = type === 'area' || type === 'stacked-area';
    const baseType: 'line' | 'bar' = type === 'bar' || type === 'stacked-bar' || type === '100-stacked-bar' ? 'bar' : 'line';
    const seriesData = type === '100-stacked-bar' ? normalizeTo100(data.series) : data.series;
    const secondary = new Set(spec.secondaryAxisSeries ?? []);
    const hasSecondary = secondary.size > 0;

    return {
      tooltip: { trigger: 'axis' },
      legend: {},
      xAxis: { type: 'category', data: data.categories },
      yAxis: hasSecondary ? [{ type: 'value' }, { type: 'value' }] : { type: 'value' },
      series: seriesData.map((s) => ({
        name: s.name,
        type: baseType,
        data: s.values,
        ...(area ? { areaStyle: {} } : {}),
        ...(stacked ? { stack: 'total' } : {}),
        ...(hasSecondary && secondary.has(s.name) ? { yAxisIndex: 1 } : {}),
        label: { show: showLabel },
      })),
    };
  }

  throw new Error(`matrixToEChartsOption: unsupported chart type "${type as string}"`);
}
