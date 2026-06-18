/**
 * Labelled matrix → ECharts option — pure, node-testable, framework-neutral (ADR-004).
 *
 * ★ The catalog engine: maps a labelled 2-D matrix (`ChartMatrix = { categories, series }`) onto an
 * ECharts `EChartsOption`. No chart is rendered here — only a plain option object is built — so the
 * whole engine is proven in node (zero deps) and the live ECharts mount stays a thin, per-framework
 * wrapper concern (React: grid-pro-chart-enterprise; Vue: grid-pro-chart-enterprise-vue).
 *
 * This package has NO React/Vue and NO grid coupling. `echarts` is a TYPE-ONLY import (erased by
 * `node --experimental-strip-types`; an optional peer for TS consumers). The input `ChartMatrix` is
 * defined HERE (not imported from the React grid-pro-chart) so neither this package nor a Vue
 * consumer inherits React peers — grid-pro-chart's `MatrixChartData` structurally satisfies it
 * (structural-typing bridge, same pattern as W1 headless GridProps ↔ TableOptionsInput).
 *
 * Catalog families (how the generic matrix is reshaped):
 *   - cartesian/stacked:  line · bar · area · stacked-bar · stacked-area · 100-stacked-bar
 *   - scatter / bubble:   point pairs [categoryIndex, value]  (bubble adds value→symbolSize)
 *   - single-series share: pie · doughnut · funnel · treemap   (first series → {name, value})
 *   - radar:              categories → indicator axes, each series → one polygon
 *   - heatmap:            (x=category, y=series, value) triples + visualMap
 *   - per-category stats: candlestick (4: O,C,L,H) · boxplot (5: min,Q1,med,Q3,max) — series 0..n
 *   - sankey:             nodes = categories ∪ series names; links = (category → series, value)
 */
import type { EChartsOption } from 'echarts';

/** One named numeric series of a {@link ChartMatrix} (pure data; no framework types). */
export interface ChartSeriesInput {
  name: string;
  values: number[];
  color?: string;
}

/**
 * Framework-neutral chart input — a labelled 2-D matrix. grid-pro-chart's `MatrixChartData`
 * (`seriesFromMatrix` / `seriesFromPivot` output) structurally satisfies this.
 */
export interface ChartMatrix {
  categories: string[];
  series: ChartSeriesInput[];
}

/** Chart types implemented by the catalog engine. */
export type EnterpriseChartType =
  | 'line'
  | 'bar'
  | 'area'
  | 'stacked-bar'
  | 'stacked-area'
  | '100-stacked-bar'
  | 'scatter'
  | 'bubble'
  | 'pie'
  | 'doughnut'
  | 'funnel'
  | 'treemap'
  | 'radar'
  | 'heatmap'
  | 'candlestick'
  | 'boxplot'
  | 'sankey';

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
function normalizeTo100(series: ChartMatrix['series']): ChartMatrix['series'] {
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

/** First series → `{name, value}` items (pie / doughnut / funnel / treemap share this shape). */
function namedValues(data: ChartMatrix): Array<{ name: string; value: number }> {
  const first = data.series[0];
  return (first?.values ?? []).map((value, i) => ({ name: data.categories[i] ?? String(i), value }));
}

/** Per-category stat tuples: row i = [series[0..arity-1].values[i]]. Drives candlestick / boxplot. */
function statRows(data: ChartMatrix, arity: number): number[][] {
  const catCount = data.series.reduce((m, s) => Math.max(m, s.values.length), 0);
  return Array.from({ length: catCount }, (_, i) =>
    Array.from({ length: arity }, (_, k) => data.series[k]?.values[i] ?? 0),
  );
}

const finiteValues = (data: ChartMatrix): number[] =>
  data.series.flatMap((s) => s.values.filter((v) => Number.isFinite(v)));

/**
 * Map a labelled matrix (range or pivot bridge output) to an ECharts option for the given type.
 * Pure: same inputs → same plain object. Throws on a type outside the implemented catalog.
 */
export function matrixToEChartsOption(data: ChartMatrix, spec: ChartOptionSpec): EChartsOption {
  const { type } = spec;
  const showLabel = spec.dataLabels ?? false;

  if (type === 'pie' || type === 'doughnut') {
    return {
      tooltip: { trigger: 'item' },
      legend: {},
      series: [
        {
          name: data.series[0]?.name,
          type: 'pie',
          radius: type === 'doughnut' ? ['40%', '70%'] : '70%',
          data: namedValues(data),
          label: { show: showLabel },
        },
      ],
    };
  }

  if (type === 'funnel') {
    return {
      tooltip: { trigger: 'item' },
      legend: {},
      series: [{ type: 'funnel', data: namedValues(data), label: { show: showLabel } }],
    };
  }

  if (type === 'treemap') {
    return {
      tooltip: { trigger: 'item' },
      series: [{ type: 'treemap', data: namedValues(data) }],
    };
  }

  if (type === 'scatter') {
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

  if (type === 'bubble') {
    // scatter under the hood; the value drives the bubble size (3rd dimension the matrix lacks).
    return {
      tooltip: { trigger: 'item' },
      legend: {},
      xAxis: { type: 'category', data: data.categories },
      yAxis: { type: 'value' },
      series: data.series.map((s) => ({
        name: s.name,
        type: 'scatter',
        data: s.values.map((v, i) => [i, v] as [number, number]),
        symbolSize: (val: number[]) => Math.max(6, Math.sqrt(Math.abs(val[1] ?? 0)) * 3),
      })),
    };
  }

  if (type === 'radar') {
    const max = Math.max(0, ...finiteValues(data));
    return {
      tooltip: {},
      legend: {},
      radar: { indicator: data.categories.map((name) => ({ name, max })) },
      series: [
        {
          type: 'radar',
          data: data.series.map((s) => ({ name: s.name, value: s.values })),
        },
      ],
    };
  }

  if (type === 'heatmap') {
    const flat = finiteValues(data);
    const points: Array<[number, number, number]> = [];
    data.series.forEach((s, y) => s.values.forEach((v, x) => points.push([x, y, v])));
    return {
      tooltip: { position: 'top' },
      xAxis: { type: 'category', data: data.categories },
      yAxis: { type: 'category', data: data.series.map((s) => s.name) },
      visualMap: {
        min: Math.min(0, ...flat),
        max: Math.max(0, ...flat),
        calculable: true,
        orient: 'horizontal',
        left: 'center',
      },
      series: [{ type: 'heatmap', data: points, label: { show: showLabel } }],
    };
  }

  if (type === 'candlestick') {
    return {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: data.categories },
      yAxis: { type: 'value' },
      series: [{ type: 'candlestick', data: statRows(data, 4) }], // O, C, L, H per category
    };
  }

  if (type === 'boxplot') {
    return {
      tooltip: { trigger: 'item' },
      xAxis: { type: 'category', data: data.categories },
      yAxis: { type: 'value' },
      series: [{ type: 'boxplot', data: statRows(data, 5) }], // min, Q1, median, Q3, max
    };
  }

  if (type === 'sankey') {
    const nodeNames = new Set<string>();
    data.categories.forEach((c) => nodeNames.add(c));
    data.series.forEach((s) => nodeNames.add(s.name));
    const links = data.series.flatMap((s) =>
      s.values
        .map((v, i) => ({ source: data.categories[i] ?? String(i), target: s.name, value: v }))
        .filter((l) => Number.isFinite(l.value) && l.value > 0),
    );
    return {
      tooltip: { trigger: 'item' },
      series: [{ type: 'sankey', data: [...nodeNames].map((name) => ({ name })), links }],
    };
  }

  if (CARTESIAN.has(type)) {
    const stacked = type === 'stacked-bar' || type === 'stacked-area' || type === '100-stacked-bar';
    const area = type === 'area' || type === 'stacked-area';
    const baseType: 'line' | 'bar' =
      type === 'bar' || type === 'stacked-bar' || type === '100-stacked-bar' ? 'bar' : 'line';
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
