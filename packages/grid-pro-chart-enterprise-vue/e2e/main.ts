// Real-browser e2e harness — mounts EnterpriseChartPanel in an actual page (bundled by esbuild,
// served, driven by Playwright/chromium). This closes the gap the happy-dom node test cannot cover:
// real layout (clientWidth/ResizeObserver), real ECharts SVG painting, real click events.
import { createApp, h, ref } from 'vue';
import { setLicenseState } from '@topgrid/grid-license-core';
import { EnterpriseChartPanel } from '@topgrid/grid-pro-chart-enterprise-vue';

// Force a valid license so no watermark covers the chart (this is the rendering test).
setLicenseState({ status: { valid: true }, rawKey: 'e2e', setAt: 0 });

const data = {
  categories: ['Q1', 'Q2', 'Q3', 'Q4'],
  series: [
    { name: '제품 A', values: [40, 70, 55, 90] },
    { name: '제품 B', values: [25, 45, 60, 35] },
  ],
};

createApp({
  setup() {
    const lastFilter = ref('');
    return () =>
      h('div', { style: { width: '640px' } }, [
        h(EnterpriseChartPanel, {
          data,
          initialType: 'bar',
          toolbarTypes: ['bar', 'radar', 'heatmap'],
          onCrossFilter: (sel: { name: string }) => {
            lastFilter.value = sel.name;
          },
        }),
        h('div', { 'data-last-filter': lastFilter.value }, lastFilter.value),
      ]);
  },
}).mount('#app');
