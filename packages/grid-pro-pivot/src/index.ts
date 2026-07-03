// @topgrid/grid-pro-pivot — public API (React)
// MOD-GRID-18 / G-1: usePivot (headless) + pure computePivot transform.
// MOD-GRID-18 / G-2: pure value reducers (sum/avg/min/max/count over number[]).
//
// C-001 / AP-001: this package imports NO virtualization or chart library.
// Virtualization is delegated to grid-core's <Grid enableVirtualization>.
//
// ★순수 피벗 엔진(computePivot·reducers·sort/collapse/transpose/filter/move·types)은
// @topgrid/grid-pro-pivot-core 로 추출되어 React/Vue 가 공유한다. 여기서는 그대로 re-export
// 하여 public 표면을 불변 유지(비파괴). React 결합(usePivot·PivotGrid·PivotPanel·
// buildPivotColumns)만 이 패키지가 소유.
import { checkLicense } from '@topgrid/grid-license';

// PAT-003 — module-load license gate (side effect; same as grid-pro-chart/agg).
checkLicense();

// ── React 결합 표면 (이 패키지 소유) ──
export { usePivot } from './usePivot.js';
export { PivotGrid, type PivotGridProps } from './PivotGrid.js';
// MOD-GRID-64 G-2: 피벗 도구 패널 DnD(Available/Rows/Columns/Values 존).
export { PivotPanel, type PivotPanelProps } from './PivotPanel.js';
export {
  buildPivotColumns,
  type PivotSortOpts,
  type PivotCollapseOpts,
  type PivotColumnCollapseOpts,
} from './buildPivotColumns.js';

// ── 순수 엔진 re-export (@topgrid/grid-pro-pivot-core) — 표면 불변 ──
export {
  computePivot,
  GRAND_TOTAL_COLUMN_KEY,
  movePivotField,
  sortPivotRows,
  collapsePivotRows,
  transposePivotConfig,
  customizePivotTotals,
  filterPivotRows,
  applyReducer,
  isBuiltInAggregationKey,
  BUILT_IN_REDUCERS,
} from '@topgrid/grid-pro-pivot-core';
export type {
  PivotZone,
  PivotSortDirection,
  PivotSortState,
  PivotTotalsOpts,
  PivotConfig,
  PivotValueDef,
  PivotValueReducer,
  PivotModel,
  PivotColumnNode,
  PivotRow,
  PivotRowKind,
} from '@topgrid/grid-pro-pivot-core';
