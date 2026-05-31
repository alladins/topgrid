/**
 * @topgrid/grid — Meta package facade.
 *
 * Re-exports the public API of 13 underlying packages (4 MIT + 8 Pro + license).
 * Activates per ADR-MOD-GRID-REFACTOR-2026-05-17-003 (Wave 4).
 *
 * Side-effect import of `@topgrid/grid-renderers` preserves cross-package wiring
 * established by ADR-002 (R-A) — `createColumns({ type: 'number' | ... })` dispatches
 * to real cell components only after grid-renderers' `wireDefaultRenderers()` runs.
 *
 * Explicit (named) re-exports are used for:
 *   - `@topgrid/grid-core`        — skip 6 `@deprecated` APIs (ADR-013) and 2
 *                                 collision identifiers (`defaultRendererRegistry`,
 *                                 `registerRenderer`) whose canonical source is
 *                                 `@topgrid/grid-renderers` (ADR-002 / refactor-analysis §1.1).
 *                                 Also skip `GroupedHeaderGrid`/`GroupedHeaderGridProps`
 *                                 — canonical source is `@topgrid/grid-pro-header` (legacy
 *                                 alias in grid-core is C-6 thin wrapper).
 *   - `@topgrid/grid-pro-datamap` — skip `TopgridColumnDef` deprecation alias
 *                                 (ADR-006); canonical type lives in `@topgrid/grid-core`.
 *
 * `export *` is used for the remaining 10 packages (no collisions detected by probe).
 *
 * License: SEE LICENSE IN EULA (meta includes Pro packages). For MIT-only consumption,
 * import the underlying MIT packages directly: `@topgrid/grid-core`, `@topgrid/grid-renderers`,
 * `@topgrid/grid-features`, `@topgrid/grid-export`.
 */

// ─────────────────────────────────────────────────────────────────────────────
// @topgrid/grid-core (MIT) — explicit re-export
//   Skip:
//     - 6 @deprecated APIs (ADR-013): createTopgridColumnHelper, createGroupedColumns,
//       TopgridColumnGroup, useColumnPersistence, ColumnVisibilityMenu, ColumnVisibilityMenuProps
//     - defaultRendererRegistry / registerRenderer (canonical = grid-renderers, ADR-002)
//     - GroupedHeaderGrid / GroupedHeaderGridProps (canonical = grid-pro-header)
// ─────────────────────────────────────────────────────────────────────────────
export {
  Grid,
  useGridState,
  useUrlSync,
  useStoragePersist,
  // Legacy alias 4종 (GroupedHeaderGrid 제외 — grid-pro-header 가 canonical)
  BaseGrid,
  VirtualGrid,
  ColumnPinGrid,
  TreeGrid,
  // Pagination
  GridPagination,
  PageSizeSelect,
  TotalCount,
  // Column factory (deprecated들은 제외)
  createColumns,
  // ADR-009: column-drag + multi-sort 일부 (core 가 canonical)
  useColumnDrag,
  DropIndicator,
  useColumnOrderPersist,
  SortBadge,
  SortClearButton,
} from '@topgrid/grid-core';
export type {
  GridProps,
  GridRowSelectionOptions,
  GridPaginationOptions,
  RowSelectionMode,
  GridColumnResizeMode,
  GridHandle,
  GridScrollToOptions,
  BaseGridProps,
  GridState,
  UseGridStateOptions,
  GridStateValues,
  GridStateKey,
  UseUrlSyncOptions,
  UseStoragePersistOptions,
  VirtualGridProps,
  ColumnPinGridProps,
  TreeGridProps,
  PaginationMode,
  GridPaginationProps,
  PageSizeSelectProps,
  TotalCountProps,
  TopgridColumnDef,
  TopgridColumnType,
  RendererFn,
  RendererRegistry,
  ColumnInfo,
  ColumnPersistenceOptions,
  PersistTarget,
  UseColumnDragProps,
  UseColumnDragReturn,
  DragThProps,
  UseColumnOrderPersistProps,
  SortBadgeProps,
  SortClearButtonProps,
} from '@topgrid/grid-core';

// ─────────────────────────────────────────────────────────────────────────────
// @topgrid/grid-renderers (MIT) — canonical source of defaultRendererRegistry +
// registerRenderer. Side-effect import preserves ADR-002 cross-package wiring.
// ─────────────────────────────────────────────────────────────────────────────
export * from '@topgrid/grid-renderers';

// ─────────────────────────────────────────────────────────────────────────────
// @topgrid/grid-features (MIT)
//   Note: grid-features re-exports several symbols from grid-core (ADR-009/010
//   deprecation aliases). TypeScript treats them as the same identity, so no
//   collision with grid-core's export above. `export *` is safe here.
// ─────────────────────────────────────────────────────────────────────────────
export * from '@topgrid/grid-features';

// ─────────────────────────────────────────────────────────────────────────────
// @topgrid/grid-export (MIT)
// ─────────────────────────────────────────────────────────────────────────────
export * from '@topgrid/grid-export';

// ─────────────────────────────────────────────────────────────────────────────
// @topgrid/grid-license (Pro infrastructure)
// ─────────────────────────────────────────────────────────────────────────────
export * from '@topgrid/grid-license';

// ─────────────────────────────────────────────────────────────────────────────
// @topgrid/grid-pro-tracking (Pro)
// ─────────────────────────────────────────────────────────────────────────────
export * from '@topgrid/grid-pro-tracking';

// ─────────────────────────────────────────────────────────────────────────────
// @topgrid/grid-pro-range (Pro)
// ─────────────────────────────────────────────────────────────────────────────
export * from '@topgrid/grid-pro-range';

// ─────────────────────────────────────────────────────────────────────────────
// @topgrid/grid-pro-datamap (Pro) — explicit re-export
//   Skip: TopgridColumnDef (deprecation alias per ADR-006; canonical = grid-core)
// ─────────────────────────────────────────────────────────────────────────────
export type {
  CreateDataMapOptions,
  DataMap,
  DataMapCellProps,
  DataMapEditorProps,
  PathOrAccessor,
  DataMapColumnDef,
  AsyncDataMap,
  AsyncDataMapState,
  CreateAsyncDataMapOptions,
} from '@topgrid/grid-pro-datamap';
export {
  createDataMap,
  DataMapCell,
  DataMapEditor,
  createAsyncDataMap,
} from '@topgrid/grid-pro-datamap';

// ─────────────────────────────────────────────────────────────────────────────
// @topgrid/grid-pro-merging (Pro)
// ─────────────────────────────────────────────────────────────────────────────
export * from '@topgrid/grid-pro-merging';

// ─────────────────────────────────────────────────────────────────────────────
// @topgrid/grid-pro-header (Pro) — canonical source of GroupedHeaderGrid
// ─────────────────────────────────────────────────────────────────────────────
export * from '@topgrid/grid-pro-header';

// ─────────────────────────────────────────────────────────────────────────────
// @topgrid/grid-pro-agg (Pro)
// ─────────────────────────────────────────────────────────────────────────────
export * from '@topgrid/grid-pro-agg';

// ─────────────────────────────────────────────────────────────────────────────
// @topgrid/grid-pro-master (Pro)
//   Note: grid-pro-master re-exports TreeGrid/ColumnPinGrid from grid-core
//   (`export { TreeGrid } from '@topgrid/grid-core'` in its src/index.ts).
//   TypeScript treats these as the same identity as grid-core's direct exports
//   above, so no collision.
// ─────────────────────────────────────────────────────────────────────────────
export * from '@topgrid/grid-pro-master';
