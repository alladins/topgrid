// @topgrid/grid-pro-serverside — public API (React)
// MOD-GRID-22 / G-1: server-side row model (SSRM) pure block-cache core + Pro scaffold.
//
// ★순수 서버사이드 코어(block cache·controllers·tree cache·viewport·server pivot·types)는
// @topgrid/grid-pro-serverside-core 로 추출되어 React/Vue 가 공유한다. 여기서는 그대로
// re-export 하여 public 표면을 불변 유지(비파괴). React 결합(useServerSideData·
// useServerSideTree·useViewportRowModel 훅)만 이 패키지가 소유.
//
// AP-001 vacuous: react/react-table/react-virtual/grid-core 는 type-only peer.
import { checkLicense } from '@topgrid/grid-license';

// PAT-003 — module-load license gate (side effect).
checkLicense();

// ── 순수 SSRM 코어 re-export (@topgrid/grid-pro-serverside-core) — 표면 불변 ──
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
  createServerSideController,
  buildServerPivotColumns,
  createViewportRowModel,
  materializeViewport,
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
  createServerSideTreeController,
} from '@topgrid/grid-pro-serverside-core';
export type {
  ServerSideController,
  ServerSideControllerOptions,
  ServerPivotColumn,
  ViewportDatasource,
  ViewportDatasourceParams,
  ViewportRowModel,
  ViewportRowModelOptions,
  TreeBlockRequest,
  ServerSideTreeController,
  ServerSideTreeControllerOptions,
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
} from '@topgrid/grid-pro-serverside-core';

// ── React 결합 훅 (이 패키지 소유) ──
export { useServerSideData } from './useServerSideData.js';
export type {
  UseServerSideDataOptions,
  UseServerSideDataResult,
  ServerSideGridProps,
} from './useServerSideData.js';
export { useViewportRowModel } from './useViewportRowModel.js';
export type {
  UseViewportRowModelOptions,
  UseViewportRowModelResult,
  ViewportGridProps,
} from './useViewportRowModel.js';
export { useServerSideTree } from './useServerSideTree.js';
export type {
  UseServerSideTreeOptions,
  UseServerSideTreeResult,
  ServerSideTreeGridProps,
} from './useServerSideTree.js';
