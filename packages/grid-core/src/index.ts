// @topgrid/grid-core — public API (MOD-GRID-01 / G-001 + G-002 + G-003 + G-004 + G-005 + MOD-GRID-02 / G-001~G-006).
export { Grid } from './Grid';
// MOD-GRID-29 i18n — consumers build localeText/icons overrides on top of the defaults.
export {
  defaultGridLocale,
  defaultGridIcons,
  resolveLocale,
  resolveIcons,
} from './internal/i18n';
export type { GridLocale, GridIcons } from './internal/i18n';
// MOD-GRID-29 G-2 theming — themeToVars(theme) → inline --topgrid-* vars on the grid root.
export { themeToVars, darkTheme } from './internal/theme';
export type { GridTheme } from './internal/theme';
// MOD-GRID-33 G-3 row reorder — pure array move; consumer applies it in onRowReorder.
export { moveRow } from './internal/moveRow';
// MOD-GRID-43: 증분 행 트랜잭션(순수 helper, controlled-data — 소비자가 자기 state 에 적용).
export { applyRowTransaction, createTransactionBatcher } from './internal/transaction';
export type {
  RowId,
  GetRowId,
  RowTransaction,
  TransactionBatcher,
  TransactionBatcherDeps,
} from './internal/transaction';
// MOD-GRID-48: flat-path 트리 빌더(getDataPath 데이터-모델; 소비자가 getSubRows 로 사용).
export { buildTreeFromPaths } from './internal/buildTreeFromPaths';
export type { TreeNode } from './internal/buildTreeFromPaths';
// MOD-GRID-50: full-row editing — 순수 머지 + 행 편집 상태 훅 (AG editType:'fullRow' 대응).
export { applyRowDraft } from './editing/applyRowDraft';
export { useFullRowEdit } from './editing/useFullRowEdit';
export type { UseFullRowEditOptions, FullRowEditApi } from './editing/useFullRowEdit';
// MOD-GRID-37 G-1: locale/collation-aware sortingFn (é between e and f; 한글 자모 순).
export { compareLocale, makeLocaleSortingFn, localeSortingFn } from './internal/localeSort';
// MOD-GRID-37 G-2: blank→undefined accessor for direction-independent null placement (+ sortUndefined).
export { isBlank, blankToUndefined } from './internal/sortNulls';
export { useGridState } from './useGridState'; // ★ MOD-GRID-02 G-001
export { useUrlSync } from './useUrlSync'; // ★ MOD-GRID-02 G-005
export { useStoragePersist } from './useStoragePersist'; // ★ MOD-GRID-02 G-006
// MOD-GRID-60: generic view-state persistence (row grouping / pivot config / …) + pure envelope.
export {
  useViewStatePersistence,
  type UseViewStatePersistenceOptions,
} from './useViewStatePersistence';
export { serializeViewState, deserializeViewState } from './internal/viewStateEnvelope';
export type {
  GridProps,
  GridRowSelectionOptions,
  GridPaginationOptions,
  RowSelectionMode,
  GridColumnResizeMode,
  GridHandle, // ★ G-004 (D2/D4) + G-007 (startEditing)
  GridScrollToOptions, // ★ G-004 (D2/D9)
  BaseGridProps, // ★ G-005 (D11 + AC-005)
  CellClassNameCallback, // ★ G-006 (D1) — canonical ownership moved from grid-renderers
  RowClassNameCallback, // ★ G-006 (D2)
  GridState, // ★ MOD-GRID-02 G-001
  UseGridStateOptions, // ★ MOD-GRID-02 G-002
  GridStateValues, // ★ MOD-GRID-02 G-002
  GridStateKey, // ★ MOD-GRID-02 G-002
  UseUrlSyncOptions, // ★ MOD-GRID-02 G-005
  UseStoragePersistOptions, // ★ MOD-GRID-02 G-006
} from './types';

// G-005 D8: legacy alias 5종 — main entry 호환 (`/legacy` sub-entry 권장).
export {
  BaseGrid,
  VirtualGrid,
  type VirtualGridProps,
  ColumnPinGrid,
  type ColumnPinGridProps,
  GroupedHeaderGrid,
  type GroupedHeaderGridProps,
  TreeGrid,
  type TreeGridProps,
} from './legacy';

// G-001 (MOD-GRID-03): pagination mode API
export type { PaginationMode } from './pagination/types';
export { GridPagination } from './pagination/GridPagination';
export type { GridPaginationProps } from './pagination/GridPagination';
// G-002 (MOD-GRID-03): page size select + total count sub-components
export { PageSizeSelect } from './pagination/PageSizeSelect';
export type { PageSizeSelectProps } from './pagination/PageSizeSelect';
export { TotalCount } from './pagination/TotalCount';
export type { TotalCountProps } from './pagination/TotalCount';

// MOD-GRID-04: Column Factory (G-001)
export { createColumns } from './column/createColumns';
/** @deprecated No production users. Use `createColumns` or `createColumnHelper` from `@tanstack/react-table` directly. Removed in next major. (ADR-013) */
export { createTopgridColumnHelper } from './column/createTopgridColumnHelper';
export { defaultRendererRegistry, registerRenderer } from './column/rendererRegistry';
export type {
  TopgridColumnDef,
  TopgridColumnType,
  RendererFn,
  RendererRegistry,
} from './column/types';
// legacy alias (DataTable 호환 — AC-005)
export type { ColumnInfo } from './legacy/ColumnInfo';
// MOD-GRID-04: Column Factory (G-002 추가)
/** @deprecated No production users. Will be removed in next major. (ADR-013) */
export { createGroupedColumns } from './column/createGroupedColumns';
/** @deprecated No production users. Will be removed in next major together with `createGroupedColumns`. (ADR-013) */
export type { TopgridColumnGroup } from './column/createGroupedColumns';
// MOD-GRID-57: auto group column factory (indent + expand toggle + node value) for tree/grouped data.
export { createAutoGroupColumn } from './column/createAutoGroupColumn';
export type { AutoGroupColumnOptions } from './column/createAutoGroupColumn';
// MOD-GRID-04: Column Factory (G-003 — 컬럼 가시성 + 순서 영속화)
/** @deprecated No production users outside grid-core. Superseded by ADR-007 storage adapter. Removed in next major. (ADR-013) */
export { useColumnPersistence } from './column/useColumnPersistence';
/** @deprecated No production users outside grid-core. Removed in next major. (ADR-013) */
export { ColumnVisibilityMenu } from './column/ColumnVisibilityMenu';
/** @deprecated No production users. Removed in next major together with `ColumnVisibilityMenu`. (ADR-013) */
export type { ColumnVisibilityMenuProps } from './column/ColumnVisibilityMenu';
// MOD-GRID-38: per-header column menu (sort/pin/hide actions).
export { ColumnMenu, type ColumnMenuProps } from './column/ColumnMenu';
// MOD-GRID-39: per-row pin control (pin to top/bottom, unpin).
export { RowPinButton, type RowPinButtonProps } from './RowPinButton';
export type { ColumnPersistenceOptions, PersistTarget } from './types';

// ADR-009 (옵션 A): grid-features → grid-core/internal 이동 후 public 승격.
// grid-features 는 1 minor cycle 동안 deprecation alias 유지.
export { useColumnDrag } from './internal/column-drag/useColumnDrag';
export { DropIndicator } from './internal/column-drag/DropIndicator';
export { useColumnOrderPersist } from './internal/column-drag/useColumnOrderPersist';
export type {
  UseColumnDragProps,
  UseColumnDragReturn,
  DragThProps,
} from './internal/column-drag/types';
export type { UseColumnOrderPersistProps } from './internal/column-drag/useColumnOrderPersist';
export { SortBadge } from './internal/SortBadge';
export type { SortBadgeProps } from './internal/multi-sort/types';
export { SortClearButton } from './internal/multi-sort/SortClearButton';
export type { SortClearButtonProps } from './internal/multi-sort/types';
