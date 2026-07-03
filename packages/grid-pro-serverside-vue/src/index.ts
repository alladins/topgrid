// @topgrid/grid-pro-serverside-vue — public API (Vue 3)
// 서버사이드 로우 모델(SSRM) + 뷰포트(push) 로우 모델을 Vue 3 에서. 프레임워크 무관
// @topgrid/grid-pro-serverside-core 컨트롤러 재사용(React 와 동일 epoch 불변식·블록 캐시).
// Zero React: 라이선스는 grid-license-core(프레임워크 무관) → React peer 미유입.

export { useVueServerSideData } from './useVueServerSideData.js';
export type {
  UseVueServerSideDataOptions,
  UseVueServerSideDataResult,
} from './useVueServerSideData.js';
export { useVueViewportRowModel } from './useVueViewportRowModel.js';
export type {
  UseVueViewportRowModelOptions,
  UseVueViewportRowModelResult,
} from './useVueViewportRowModel.js';

// 코어 유틸·타입 재export (Vue 소비자 편의).
export {
  isRowPlaceholder,
  buildServerPivotColumns,
} from '@topgrid/grid-pro-serverside-core';
export type {
  ServerSideDatasource,
  ViewportDatasource,
  ViewportDatasourceParams,
  GetRowsRequest,
  GetRowsResult,
  ServerPivotColumn,
  RowPlaceholder,
} from '@topgrid/grid-pro-serverside-core';

// License(프레임워크 무관 코어). 앱 entry 에서 키 1회 등록 시 워터마크 해제.
export { setLicenseKey, checkLicense } from '@topgrid/grid-license-core';
