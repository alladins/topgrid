/**
 * Vue 3 enterprise chart panel — toolbar (type switch) + export + cross-filter, over the
 * framework-neutral `@topgrid/grid-chart-core` engine. Vue counterpart of the React
 * EnterpriseChartPanel; the engine (`matrixToEChartsOption`) is shared verbatim (ADR-004).
 *
 * ★License gate: unlike the React package, this package does NOT import `@topgrid/grid-license`
 * (which declares React peers — pulling it in would re-leak React into the Vue tree, defeating
 * ADR-004). Instead the watermark is an injected `watermark` prop the host supplies (e.g. from its
 * own `checkLicense().watermarkRequired`). A neutral license-core extraction would let this auto-gate
 * like React — tracked as a follow-up, not done here (scope).
 */
import { computed, defineComponent, h, ref, type PropType } from 'vue';
import {
  matrixToEChartsOption,
  type ChartMatrix,
  type EnterpriseChartType,
} from '@topgrid/grid-chart-core';
import { EChartsChart, type ChartSelection } from './EChartsChart.js';

/** Types offered in the toolbar (subset of the implemented catalog). */
const TOOLBAR_TYPES: EnterpriseChartType[] = ['bar', 'line', 'area', 'stacked-bar', 'pie', 'scatter'];

export const EnterpriseChartPanel = defineComponent({
  name: 'TopGridEnterpriseChartPanel',
  props: {
    /** Bridge output — `seriesFromMatrix(...)` / `seriesFromPivot(...)` (structurally a ChartMatrix). */
    data: { type: Object as PropType<ChartMatrix>, required: true },
    initialType: { type: String as PropType<EnterpriseChartType>, default: 'bar' },
    enableToolbar: { type: Boolean, default: true },
    enableExport: { type: Boolean, default: true },
    onCrossFilter: { type: Function as PropType<(sel: ChartSelection) => void>, default: undefined },
    /** Host-supplied license gate (this package imports no React-coupled grid-license). */
    watermark: { type: Boolean, default: false },
    title: { type: String, default: undefined },
  },
  setup(props) {
    const type = ref<EnterpriseChartType>(props.initialType);
    const rootEl = ref<HTMLDivElement | null>(null);
    const chartRef = ref<{ exportImage: (f?: 'svg' | 'png') => string } | null>(null);
    const option = computed(() => matrixToEChartsOption(props.data, { type: type.value }));

    const handleExport = (): void => {
      const url = chartRef.value?.exportImage('svg') ?? '';
      rootEl.value?.setAttribute('data-export-result-len', String(url.length));
    };

    return () =>
      h('div', { ref: rootEl, style: { position: 'relative' }, 'data-chart-type': type.value }, [
        props.title !== undefined
          ? h('div', { style: { fontWeight: 600, marginBottom: '4px' } }, props.title)
          : null,
        props.enableToolbar
          ? h('div', { 'data-chart-toolbar': '', style: { display: 'flex', gap: '4px', marginBottom: '4px' } }, [
              ...TOOLBAR_TYPES.map((t) =>
                h(
                  'button',
                  {
                    key: t,
                    type: 'button',
                    'data-chart-type-btn': t,
                    'aria-pressed': t === type.value ? 'true' : 'false',
                    onClick: () => {
                      type.value = t;
                    },
                  },
                  t,
                ),
              ),
              props.enableExport
                ? h('button', { type: 'button', 'data-chart-export': '', onClick: handleExport }, 'Export')
                : null,
            ])
          : null,
        h(EChartsChart, {
          ref: chartRef,
          option: option.value,
          ...(props.onCrossFilter ? { onSelect: props.onCrossFilter } : {}),
        }),
        props.watermark
          ? h(
              'div',
              {
                'data-watermark': '',
                style: { position: 'absolute', top: 0, right: 0, opacity: 0.4, fontSize: '12px', color: '#6b7280' },
              },
              'Unlicensed @topgrid/grid',
            )
          : null,
      ]);
  },
});
