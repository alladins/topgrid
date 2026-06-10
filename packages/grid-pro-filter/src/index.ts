// @topgrid/grid-pro-filter — public API
// MOD-GRID-30 / G-3: compound(AND/OR) multi-condition column filter (Pro).
//
// REUSE (LESS-005): per-condition matching reuses grid-features' shipped base FilterFns
// (textFilterFn/numberFilterFn) — makeMultiFilterFn calls a base N times and reduces with AND/OR,
// dropping inactive conditions via the base's own autoRemove. No matching logic is reimplemented.
// FilterPopover (generic, grid-features) is reused for the popover chrome; the condition rows are a
// new thin builder (operator enums / value types reused, the TextFilter popover is NOT forked).
import { checkLicense } from '@topgrid/grid-license';

// PAT-003 — module-load license gate (side effect).
checkLicense();

export { makeMultiFilterFn } from './makeMultiFilterFn.js';
export type { MultiFilterValue } from './makeMultiFilterFn.js';
export { multiTextFilterFn, multiNumberFilterFn } from './multiFilterFns.js';
export { MultiFilter } from './MultiFilter.js';
// MOD-GRID-46: cross-column advanced filter 식 모델 + 순수 평가기(쿼리빌더 UI=browser/후속).
export {
  evaluateAdvancedFilter,
  makeAdvancedFilterFn,
  matchCondition,
  advancedGlobalFilterFn,
} from './advancedFilter.js';
export type {
  AdvancedFilterExpr,
  FilterGroup,
  FilterCondition,
  FilterOperator,
  FilterValueType,
} from './advancedFilter.js';
// MOD-GRID-47: cross-filter 매핑(선택→식, 같은필드 OR·다른필드 AND). MOD-76: advancedGlobalFilterFn(advancedFilter)=실 setFilter 배선.
export { selectionsToFilter } from './crossFilter.js';
export type { FilterSelection } from './crossFilter.js';
