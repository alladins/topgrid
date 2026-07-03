// @topgrid/grid-pro-serverside-core — framework-neutral SSRM core (public API)
//
// 순수 서버사이드 로우 모델: 블록 캐시(epoch 불변식), 데이터 흐름 컨트롤러, 지연 그룹
// 트리 캐시, 뷰포트 로우 모델(push), 서버 피벗 컬럼 파생. React/Vue 의존 0
// (@tanstack/table-core 는 타입 전용). @topgrid/grid-pro-serverside(React)·
// grid-pro-serverside-vue(Vue) 가 공유 소비. 라이선스 게이트는 코어에 두지 않는다.

// 블록 캐시 코어 (SSRM epoch 불변식 + 블록 수학).
export {
  createBlockCache,
  blockIndexOf,
  blockBounds,
  planBlocks,
  markLoading,
  acceptBlock,
  clearBlock,
  invalidate,
  materialize,
  isRowPlaceholder,
} from './internal/blockCache.js';

// 데이터 흐름 컨트롤러 (node-verifiable, React-free).
export { createServerSideController } from './internal/serverSideController.js';
export type {
  ServerSideController,
  ServerSideControllerOptions,
} from './internal/serverSideController.js';

// 서버사이드 피벗 — 순수 피벗 결과 컬럼 파생(서버가 field 키 반환).
export { buildServerPivotColumns } from './internal/buildServerPivotColumns.js';
export type { ServerPivotColumn } from './internal/buildServerPivotColumns.js';

// 뷰포트 로우 모델 — push 기반 실시간 모델(SSRM pull 과 분리).
export {
  createViewportRowModel,
  materializeViewport,
} from './internal/viewportRowModel.js';
export type {
  ViewportDatasource,
  ViewportDatasourceParams,
  ViewportRowModel,
  ViewportRowModelOptions,
} from './internal/viewportRowModel.js';

// 지연 그룹핑(계층 캐시): 순수 트리 코어 + React-free 컨트롤러.
export {
  createTreeCache,
  pathKeyOf,
  toggleGroup,
  isExpanded,
  invalidateTree,
  ensureNode,
  ensureVisibleNodes,
  markTreeLoading,
  acceptTreeBlock,
  clearTreeBlock,
  planTreeBlocks,
  flattenTree,
} from './internal/treeCache.js';
export type { TreeBlockRequest } from './internal/treeCache.js';
export { createServerSideTreeController } from './internal/serverSideTreeController.js';
export type {
  ServerSideTreeController,
  ServerSideTreeControllerOptions,
} from './internal/serverSideTreeController.js';

// 데이터소스 계약 + 캐시 값 타입.
export type {
  ServerSideDatasource,
  GetRowsRequest,
  GetRowsResult,
  SortModelItem,
  FilterModel,
  RowPlaceholder,
  BlockStatus,
  BlockState,
  BlockCacheState,
  SsrmRowMeta,
  TreeDisplayRow,
  TreeCacheState,
} from './types.js';
