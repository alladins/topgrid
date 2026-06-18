import { useEffect, useRef, type JSX } from 'react';
import * as echarts from 'echarts/core';
import {
  BarChart,
  LineChart,
  ScatterChart,
  PieChart,
  FunnelChart,
  TreemapChart,
  RadarChart,
  HeatmapChart,
  CandlestickChart,
  BoxplotChart,
  SankeyChart,
} from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  RadarComponent,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';

/**
 * Thin ECharts wrapper (ADR-003 D2) — self-authored, no `echarts-for-react` dependency.
 *
 * Selective module registration (ADR-003 D3): only the chart/component/renderer modules the
 * scaffold catalog needs are `use()`d, so an opt-in consumer tree-shakes the rest. The **SVG**
 * renderer is chosen so the chart is inline `<svg>` (DOM-inspectable, SSR-friendly) rather than an
 * opaque `<canvas>` — this is what makes the chromium gate non-vacuous.
 *
 * Lifecycle is the only thing this package owns (the trade-off of D2): init on mount, replace the
 * option when it changes, `resize()` via ResizeObserver, and `dispose()` on unmount.
 */
echarts.use([
  BarChart,
  LineChart,
  ScatterChart,
  PieChart,
  FunnelChart,
  TreemapChart,
  RadarChart,
  HeatmapChart,
  CandlestickChart,
  BoxplotChart,
  SankeyChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  RadarComponent,
  SVGRenderer,
]);

/** Live ECharts instance type (avoids importing a named type that may shift across versions). */
export type EChartsInstance = ReturnType<typeof echarts.init>;

/** Payload handed to {@link EChartsChartProps.onSelect} when a datum is clicked (cross-filter source). */
export interface ChartSelection {
  name: string;
  value: unknown;
}

export interface EChartsChartProps {
  /** Usually the result of `matrixToEChartsOption(...)`. */
  option: EChartsOption;
  width?: number | string;
  height?: number | string;
  /** Fires on datum click — wire to a grid filter for cross-filtering. */
  onSelect?: (sel: ChartSelection) => void;
  /** Receives the live instance once mounted (e.g. for `getDataURL` export). */
  onInit?: (chart: EChartsInstance) => void;
  className?: string;
}

export function EChartsChart({
  option,
  width = '100%',
  height = 300,
  onSelect,
  onInit,
  className,
}: EChartsChartProps): JSX.Element {
  const elRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<EChartsInstance | null>(null);

  // init / dispose — once.
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const chart = echarts.init(el, undefined, { renderer: 'svg' });
    chartRef.current = chart;
    onInit?.(chart);
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once; onInit is a stable callback by contract.
  }, []);

  // (re)bind cross-filter click handler when onSelect changes.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !onSelect) return;
    const handler = (params: { name?: string; seriesName?: string; value?: unknown }): void => {
      onSelect({ name: String(params.name ?? params.seriesName ?? ''), value: params.value });
    };
    chart.on('click', handler);
    return () => {
      chart.off('click', handler);
    };
  }, [onSelect]);

  // push option on change. Reflect the type ECharts ACTUALLY rendered — a non-vacuous signal that
  // the option reached and was accepted by ECharts (not just our React state).
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.setOption(option, true);
    const rendered = (chart.getOption() as { series?: Array<{ type?: string }> }).series?.[0]?.type;
    if (elRef.current && rendered) {
      elRef.current.setAttribute('data-rendered-type', rendered);
    }
  }, [option]);

  return (
    <div
      ref={elRef}
      className={className}
      style={{ width, height }}
      data-echarts-root
    />
  );
}
