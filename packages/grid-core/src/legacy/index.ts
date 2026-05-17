/**
 * `@tomis/grid-core/legacy` sub-entry — G-005 5 alias re-export (D8 — tree-shake + import 경로 명확).
 *
 * @deprecated 1 minor 버전 후 다음 major 에서 제거 (C-23).
 *
 * @see G-005-spec.md Section 2.7 + D8
 */

export { BaseGrid } from './BaseGrid';
export { VirtualGrid, type VirtualGridProps } from './VirtualGrid';
export { ColumnPinGrid, type ColumnPinGridProps } from './ColumnPinGrid';
export { GroupedHeaderGrid, type GroupedHeaderGridProps } from './GroupedHeaderGrid';
export { TreeGrid, type TreeGridProps } from './TreeGrid';
export { useDeprecationWarn } from './useDeprecationWarn';
export type { BaseGridProps } from '../types';
// G-003 (MOD-GRID-03): DataTablePagination deprecation alias
export { DataTablePagination } from './DataTablePagination';
export type { DataTablePaginationProps } from './DataTablePagination';
