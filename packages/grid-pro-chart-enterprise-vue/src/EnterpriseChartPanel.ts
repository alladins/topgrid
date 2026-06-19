/**
 * Vue 3 enterprise chart panel — toolbar (type switch) + export + cross-filter, over the
 * framework-neutral `@topgrid/grid-chart-core` engine. Vue counterpart of the React
 * EnterpriseChartPanel; the engine (`matrixToEChartsOption`) is shared verbatim (ADR-004).
 *
 * ★License gate: auto-gates via `@topgrid/grid-license-core` (the framework-NEUTRAL license source —
 * NOT the React `@topgrid/grid-license`, so no React peer leaks into the Vue tree). When the app has
 * registered a valid key (`setLicenseKey` from grid-license-core), no watermark shows; otherwise it
 * composites one — reactively (subscribes to license-state changes). The `watermark` prop overrides:
 * omit → auto; pass `true`/`false` → force.
 */
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, type PropType } from 'vue';
import {
  matrixToEChartsOption,
  type ChartMatrix,
  type EnterpriseChartType,
} from '@topgrid/grid-chart-core';
import { checkLicense, subscribeLicense } from '@topgrid/grid-license-core';
import { EChartsChart, type ChartSelection } from './EChartsChart.js';

/** Default toolbar types — a subset; pass `toolbarTypes` to surface more of the 17-type catalog. */
const DEFAULT_TOOLBAR_TYPES: EnterpriseChartType[] = ['bar', 'line', 'area', 'stacked-bar', 'pie', 'scatter'];

export const EnterpriseChartPanel = defineComponent({
  name: 'TopGridEnterpriseChartPanel',
  props: {
    /** Bridge output — `seriesFromMatrix(...)` / `seriesFromPivot(...)` (structurally a ChartMatrix). */
    data: { type: Object as PropType<ChartMatrix>, required: true },
    initialType: { type: String as PropType<EnterpriseChartType>, default: 'bar' },
    enableToolbar: { type: Boolean, default: true },
    /** Which types the toolbar offers. Defaults to a 6-type subset; pass any of the 17 catalog types. */
    toolbarTypes: { type: Array as PropType<EnterpriseChartType[]>, default: () => DEFAULT_TOOLBAR_TYPES },
    enableExport: { type: Boolean, default: true },
    onCrossFilter: { type: Function as PropType<(sel: ChartSelection) => void>, default: undefined },
    /** License watermark override: omit → auto-gate via license state; `true`/`false` → force. */
    watermark: { type: Boolean, default: undefined },
    title: { type: String, default: undefined },
  },
  setup(props) {
    const type = ref<EnterpriseChartType>(props.initialType);
    const rootEl = ref<HTMLDivElement | null>(null);
    const chartRef = ref<{ exportImage: (f?: 'svg' | 'png') => string } | null>(null);
    const option = computed(() => matrixToEChartsOption(props.data, { type: type.value }));

    // Auto license gate (reactive): unless the `watermark` prop forces a value.
    const autoWatermark = ref(checkLicense().watermarkRequired);
    let unsub: (() => void) | undefined;
    onMounted(() => {
      unsub = subscribeLicense(() => {
        autoWatermark.value = checkLicense().watermarkRequired;
      });
    });
    onBeforeUnmount(() => unsub?.());
    const showWatermark = computed(() =>
      props.watermark === undefined ? autoWatermark.value : props.watermark,
    );

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
              ...props.toolbarTypes.map((t) =>
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
        showWatermark.value
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
