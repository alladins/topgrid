/**
 * Vue 3 thin ECharts wrapper (ADR-004 증분②) — the per-framework render shell.
 *
 * ★ The chart ENGINE (`matrixToEChartsOption`, 17-type catalog) lives in the framework-neutral
 * `@topgrid/grid-chart-core` and is shared verbatim with the React package — this file only owns
 * the Vue lifecycle (onMounted init / watch setOption / onBeforeUnmount dispose), mirroring React's
 * EChartsChart. SVG renderer → inline `<svg>` (DOM-inspectable, SSR-friendly).
 *
 * echarts module registration is duplicated here (not in grid-chart-core, which stays echarts-
 * runtime-free): `echarts.use([...])` is global setup, not logic — the render shell is per-framework
 * anyway (W1 §10).
 */
import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch, type PropType } from 'vue';
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

export type EChartsInstance = ReturnType<typeof echarts.init>;

export interface ChartSelection {
  name: string;
  value: unknown;
}

export const EChartsChart = defineComponent({
  name: 'TopGridEChartsChart',
  props: {
    option: { type: Object as PropType<EChartsOption>, required: true },
    width: { type: [Number, String] as PropType<number | string>, default: '100%' },
    height: { type: [Number, String] as PropType<number | string>, default: 300 },
    onSelect: { type: Function as PropType<(sel: ChartSelection) => void>, default: undefined },
  },
  setup(props, { expose }) {
    const el = ref<HTMLDivElement | null>(null);
    let chart: EChartsInstance | null = null;
    let ro: ResizeObserver | null = null;

    const pushOption = (): void => {
      if (!chart) return;
      chart.setOption(props.option, true);
      const rendered = (chart.getOption() as { series?: Array<{ type?: string }> }).series?.[0]?.type;
      if (el.value && rendered) el.value.setAttribute('data-rendered-type', rendered);
    };

    onMounted(() => {
      if (!el.value) return;
      // Pass explicit dims so the chart renders even where layout is unmeasured (happy-dom: clientW/H=0).
      const w = typeof props.width === 'number' ? props.width : el.value.clientWidth || 600;
      const ht = typeof props.height === 'number' ? props.height : el.value.clientHeight || 300;
      chart = echarts.init(el.value, undefined, { renderer: 'svg', width: w, height: ht });
      if (props.onSelect) {
        const onSelect = props.onSelect;
        chart.on('click', (p: { name?: string; seriesName?: string; value?: unknown }) =>
          onSelect({ name: String(p.name ?? p.seriesName ?? ''), value: p.value }),
        );
      }
      // ResizeObserver may be absent under non-browser DOMs (happy-dom) — guard so mount never throws.
      if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(() => chart?.resize());
        ro.observe(el.value);
      }
      pushOption();
    });

    watch(() => props.option, pushOption);

    onBeforeUnmount(() => {
      ro?.disconnect();
      chart?.dispose();
      chart = null;
    });

    // Imperative handle for the panel's export button.
    expose({
      exportImage: (format: 'svg' | 'png' = 'svg'): string =>
        chart ? chart.getDataURL({ type: format }) : '',
    });

    const sizeStyle = (v: number | string): string => (typeof v === 'number' ? `${v}px` : v);
    return () =>
      h('div', {
        ref: el,
        style: { width: sizeStyle(props.width), height: sizeStyle(props.height) },
        'data-echarts-root': '',
      });
  },
});
