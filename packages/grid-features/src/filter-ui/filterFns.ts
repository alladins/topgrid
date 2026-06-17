/**
 * @topgrid/grid-features — filterFn re-export shim (W1 Phase 0).
 *
 * 구현(textFilterFn/numberFilterFn/dateRangeFilterFn/selectFilterFn)은 framework-agnostic
 * @topgrid/grid-core-headless 로 이관됐다(React/Vue 어댑터 공유). 기존 소비처(이 모듈·index·
 * grid-pro-filter, 모두 패키지 루트 경유) 보존을 위해 re-export 만 유지한다.
 */
export {
  textFilterFn,
  numberFilterFn,
  dateRangeFilterFn,
  selectFilterFn,
} from '@topgrid/grid-core-headless';
