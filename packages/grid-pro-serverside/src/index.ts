// @topgrid/grid-pro-serverside — public API
// MOD-GRID-22 / G-1: server-side row model (SSRM) pure block-cache core + Pro scaffold.
//
// REUSE ([[LESS-003]] live-overlap): grid-core already owns row virtualization
// (useGridVirtualizer), server pagination (manualPagination/totalCount), and tree/expanding
// (getSubRows). SSRM adds only what is absent — block-based lazy loading with stale-response
// (epoch) rejection — as a PURE core (node-verified), feeding the existing
// <Grid enableVirtualization> via a materialized placeholder array (LESS-005 shape). The G-2
// hook + grid-core manualSorting/Filtering passthrough wire it; this G-1 ships the core only.
//
// AP-001 vacuous: no external/optional peer is imported (grid-license is a required Pro runtime
// dep; react/react-table/grid-core are type-only peers). The block cache imports nothing.
import { checkLicense } from '@topgrid/grid-license';

// PAT-003 — module-load license gate (side effect; first Pro module since MOD-GRID-23).
checkLicense();

// G-1 pure block-cache core (the SSRM epoch invariant + block math).
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

// G-2 data-flow controller (node-verifiable, React-free) + thin wiring hook.
export {
  createServerSideController,
} from './internal/serverSideController.js';
export type {
  ServerSideController,
  ServerSideControllerOptions,
} from './internal/serverSideController.js';
export { useServerSideData } from './useServerSideData.js';
export type {
  UseServerSideDataOptions,
  UseServerSideDataResult,
  ServerSideGridProps,
} from './useServerSideData.js';

// MOD-GRID-67: server-side pivot — pure pivot-result column derivation (server returns field keys).
export { buildServerPivotColumns } from './internal/buildServerPivotColumns.js';
export type { ServerPivotColumn } from './internal/buildServerPivotColumns.js';

// G-3 lazy grouping (hierarchical cache): pure tree core + React-free controller + thin hook.
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
export { useServerSideTree } from './useServerSideTree.js';
export type {
  UseServerSideTreeOptions,
  UseServerSideTreeResult,
  ServerSideTreeGridProps,
} from './useServerSideTree.js';

// Datasource contract + cache value types.
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
