// @topgrid/grid-chart-core — public API
// Framework-neutral chart engine (ADR-004): labelled matrix → Apache ECharts option.
// No React/Vue, no grid coupling; echarts is type-only (optional peer). Consumed by the per-framework
// enterprise chart packages (React: grid-pro-chart-enterprise; Vue: grid-pro-chart-enterprise-vue).
export {
  matrixToEChartsOption,
  type EnterpriseChartType,
  type ChartOptionSpec,
  type ChartMatrix,
  type ChartSeriesInput,
} from './internal/matrixToEChartsOption.js';
