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
// MOD-GRID-64 G-2: 피벗 도구 패널 DnD(Available/Rows/Columns/Values 존) + 순수 movePivotField.
export { PivotPanel, type PivotPanelProps } from './PivotPanel.js';
export { movePivotField, type PivotZone } from './movePivotField.js';
export {
  buildPivotColumns,
  type PivotSortOpts,
  type PivotCollapseOpts,
  type PivotColumnCollapseOpts,
} from './buildPivotColumns.js';
// MOD-GRID-31 G-1: pivot 결과 정렬(그룹 내, subtotal/grandTotal 앵커) 순수 변환.
export { sortPivotRows } from './sortPivotRows.js';
export type { PivotSortDirection, PivotSortState } from './sortPivotRows.js';
// MOD-GRID-31 G-2: 행 그룹 expand/collapse(후손 data 숨김, subtotal 대표 잔존) 순수 변환.
export { collapsePivotRows } from './collapsePivotRows.js';
// MOD-GRID-31 G-3: pivot 축 전치(rows↔columns swap) 순수 변환.
export { transposePivotConfig } from './transposePivotConfig.js';
// MOD-GRID-44 G-1: total customization(suppress subtotals/grandTotal·position) 순수 변환.
export { customizePivotTotals } from './customizePivotTotals.js';
export type { PivotTotalsOpts } from './customizePivotTotals.js';
// MOD-GRID-44 G-2: pivot 결과 필터(data 행만, subtotal/grandTotal=true-group 유지) 순수 변환.
export { filterPivotRows } from './filterPivotRows.js';
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
