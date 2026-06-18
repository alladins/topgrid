// @topgrid/grid-pro-chart-enterprise — public API
// W2 단계③: enterprise charting (Apache ECharts adapter) over the grid-pro-chart bridge (ADR-003).
//
// integrate, not build: this package wraps Apache ECharts (Apache-2.0) over the EXISTING
// grid-pro-chart range/pivot bridge (`MatrixChartData`) and injection seam. The lightweight
// SVG sparklines / RangeChart in @topgrid/grid-pro-chart stay zero-dep and coexist (C-001, R3).
import { checkLicense } from '@topgrid/grid-license';

// PAT-003 — module-load license gate (side effect; same as grid-pro-chart).
checkLicense();

// 증분1: pure catalog engine (node-tested, zero-dep).
export {
  matrixToEChartsOption,
  type EnterpriseChartType,
  type ChartOptionSpec,
} from './internal/matrixToEChartsOption.js';

// 증분2: live React surface (chromium-gated).
export {
  EChartsChart,
  type EChartsChartProps,
  type ChartSelection,
  type EChartsInstance,
} from './EChartsChart.js';
export { EnterpriseChartPanel, type EnterpriseChartPanelProps } from './EnterpriseChartPanel.js';
export { createEChartsRenderer } from './createEChartsRenderer.js';
