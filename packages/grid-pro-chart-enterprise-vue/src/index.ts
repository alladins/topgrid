// @topgrid/grid-pro-chart-enterprise-vue — public API
// Vue 3 enterprise charting (Apache ECharts) reusing the framework-neutral @topgrid/grid-chart-core
// engine (ADR-004 증분②). Zero React: the same option-builder drives both React and Vue.
export { EChartsChart, type ChartSelection, type EChartsInstance } from './EChartsChart.js';
export { EnterpriseChartPanel } from './EnterpriseChartPanel.js';

// Re-export the engine + types for Vue consumers' convenience (range/pivot → option).
export {
  matrixToEChartsOption,
  type EnterpriseChartType,
  type ChartOptionSpec,
  type ChartMatrix,
  type ChartSeriesInput,
} from '@topgrid/grid-chart-core';

// License (framework-neutral core — no React). Register a key once at app entry to clear the watermark.
export { setLicenseKey, checkLicense } from '@topgrid/grid-license-core';
