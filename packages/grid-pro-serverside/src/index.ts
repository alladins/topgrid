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
  invalidate,
  materialize,
  isRowPlaceholder,
} from './internal/blockCache.js';

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
} from './types.js';
