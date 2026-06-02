// @topgrid/grid-pro-pivot — public API
// MOD-GRID-18 / G-1: usePivot (headless) + pure computePivot transform.
// MOD-GRID-18 / G-2: pure value reducers (sum/avg/min/max/count over number[]).
//
// C-001 / AP-001: this package imports NO virtualization or chart library.
// Virtualization is delegated to grid-core's <Grid enableVirtualization>.
import { checkLicense } from '@topgrid/grid-license';

// PAT-003 — module-load license gate (side effect; same as grid-pro-chart/agg).
checkLicense();

export { usePivot } from './usePivot.js';
export { computePivot, GRAND_TOTAL_COLUMN_KEY } from './computePivot.js';
export { PivotGrid, type PivotGridProps } from './PivotGrid.js';
export { buildPivotColumns } from './buildPivotColumns.js';
export {
  applyReducer,
  isBuiltInAggregationKey,
  BUILT_IN_REDUCERS,
} from './reducers.js';
export type {
  PivotConfig,
  PivotValueDef,
  PivotValueReducer,
  PivotModel,
  PivotColumnNode,
  PivotRow,
  PivotRowKind,
} from './types.js';
