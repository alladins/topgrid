/**
 * @topgrid/grid-vue — Vue 3 어댑터 (스켈레톤, W1 Phase 0).
 * @topgrid/grid-core-headless 공유 코어를 @tanstack/vue-table 로 소비. React 의존 0.
 */
export { Grid } from './Grid';
export { createVueCheckboxColumn } from './CheckboxColumn';

// Vue 소비자 편의 — headless 공유 코어(filter predicate·range math)를 grid-vue 에서 직접 재export.
// (옵션1 추출분을 Vue 가 그대로 소비함을 보장 — 1→2 시너지.)
export {
  textFilterFn,
  numberFilterFn,
  dateRangeFilterFn,
  selectFilterFn,
  normalizeRange,
  isInRange,
  fillRange,
  stringifyTsv,
  parseTsv,
  cellValueToClipboardText,
  type TextFilterValue,
  type NumberFilterValue,
  type DateFilterValue,
  type CellRange,
  type CellCoord,
} from '@topgrid/grid-core-headless';
