// @topgrid/grid-pro-pivot-core — framework-neutral pivot engine (public API)
//
// 순수 피벗 변환 + 값 리듀서. React/Vue 의존 0.
// @topgrid/grid-pro-pivot(React)·grid-pro-pivot-vue(Vue) 가 공유 소비한다.
// C-001 / AP-001: 가상화·차트 라이브러리 import 없음(가상화는 소비 그리드에 위임).

export { computePivot, GRAND_TOTAL_COLUMN_KEY } from './computePivot.js';
export { movePivotField, type PivotZone } from './movePivotField.js';
export { sortPivotRows } from './sortPivotRows.js';
export type { PivotSortDirection, PivotSortState } from './sortPivotRows.js';
export { collapsePivotRows } from './collapsePivotRows.js';
export { transposePivotConfig } from './transposePivotConfig.js';
export { customizePivotTotals } from './customizePivotTotals.js';
export type { PivotTotalsOpts } from './customizePivotTotals.js';
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
