// @topgrid/grid-pro-chart-enterprise — public API
// W2 단계③ scaffold: pure MatrixChartData → ECharts option engine (ADR-003).
//
// integrate, not build: this package wraps Apache ECharts (Apache-2.0) over the EXISTING
// grid-pro-chart range/pivot bridge (`MatrixChartData`) and injection seam. The lightweight
// SVG sparklines / RangeChart in @topgrid/grid-pro-chart stay zero-dep and coexist (C-001, R3).
//
// Scaffold exposes the pure, node-tested catalog engine. The thin React wrapper (EChartsChart),
// the seam-compatible factory (createEChartsRenderer), and EnterpriseChartPanel (toolbar / export /
// cross-filter) land in the next increment (they require live chromium verification).

export {
  matrixToEChartsOption,
  type EnterpriseChartType,
  type ChartOptionSpec,
} from './internal/matrixToEChartsOption.js';
