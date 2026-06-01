// @topgrid/grid-pro-chart — public API
// MOD-GRID-19 / G-1: SparklineCell (zero-dep SVG line/bar/area/win-loss).
// MOD-GRID-19 / G-2: RangeChartPanel (injectable renderChart adapter).
// MOD-GRID-19 / G-3: Pro license gate.
//
// C-001 / AP-001: this package imports NO chart library. Sparklines are pure
// SVG; range charts are rendered by a consumer-injected `renderChart` callback.
import { checkLicense } from '@topgrid/grid-license';

// PAT-003 — module-load license gate (side effect; same as grid-pro-tracking).
checkLicense();

export { SparklineCell, type SparklineCellProps, type SparklineType } from './SparklineCell.js';
export {
  RangeChartPanel,
  type RangeChartPanelProps,
  type RangeSeries,
} from './RangeChartPanel.js';
