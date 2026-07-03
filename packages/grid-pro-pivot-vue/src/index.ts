// @topgrid/grid-pro-pivot-vue — public API (Vue 3)
// 선언적 2차원 피벗을 Vue 3 에서. 프레임워크 무관 @topgrid/grid-pro-pivot-core 엔진을 재사용
// (React 와 동일 변환). Zero React: 같은 computePivot 이 React·Vue 양쪽을 구동.

export { useVuePivot } from './useVuePivot.js';
export { VuePivotPanel } from './VuePivotPanel.js';

// 엔진 + 타입 재export (Vue 소비자 편의).
export {
  computePivot,
  movePivotField,
  sortPivotRows,
  collapsePivotRows,
  transposePivotConfig,
  customizePivotTotals,
  filterPivotRows,
  GRAND_TOTAL_COLUMN_KEY,
} from '@topgrid/grid-pro-pivot-core';
export type {
  PivotConfig,
  PivotValueDef,
  PivotModel,
  PivotRow,
  PivotColumnNode,
  PivotRowKind,
  PivotZone,
} from '@topgrid/grid-pro-pivot-core';

// License(프레임워크 무관 코어 — React peer 미유입). 앱 entry 에서 키 1회 등록 시 워터마크 해제.
export { setLicenseKey, checkLicense } from '@topgrid/grid-license-core';
