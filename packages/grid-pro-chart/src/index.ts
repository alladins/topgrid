// @topgrid/grid-pro-chart — public API
// MOD-GRID-19 / G-1: SparklineCell (zero-dep SVG line/bar/area/win-loss).
// MOD-GRID-19 / G-2: RangeChartPanel (injectable renderChart adapter).
// MOD-GRID-19 / G-3: Pro license gate.
//
// MOD-GRID-34 / G-1: RangeChart (built-in cartesian engine, zero-dep pure SVG).
//
// C-001 / AP-001: this package imports NO chart library. Sparklines AND the built-in RangeChart are
// pure SVG; richer charts can still be injected via RangeChartPanel's `renderChart` callback.
import { checkLicense } from '@topgrid/grid-license';

// PAT-003 — module-load license gate (side effect; same as grid-pro-tracking).
checkLicense();

export { SparklineCell, type SparklineCellProps, type SparklineType } from './SparklineCell.js';
export {
  RangeChartPanel,
  type RangeChartPanelProps,
  type RangeSeries,
} from './RangeChartPanel.js';

// MOD-GRID-34 G-1: built-in cartesian chart engine (zero-dep pure SVG — still no chart library).
export { RangeChart, type RangeChartProps, type RangeChartType } from './RangeChart.js';
export {
  computeChartGeometry,
  linearScale,
  niceTicks,
  bandScale,
  type ChartSeries,
  type ChartGeometry,
  type ChartPoint,
} from './internal/chartScale.js';

// MOD-GRID-34 G-3: type-switcher toolbar + matrix→series bridge (range-selection & pivot charting).
export { ChartCard, type ChartCardProps } from './ChartCard.js';
export {
  seriesFromMatrix,
  seriesFromPivot,
  type MatrixInput,
  type MatrixChartData,
  type PivotLike,
} from './internal/seriesFromMatrix.js';
