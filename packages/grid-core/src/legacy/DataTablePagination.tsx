/**
 * `DataTablePagination` — `GridPagination` deprecation alias.
 *
 * @deprecated `GridPagination`으로 마이그레이션 권장 (C-23 — 1 minor 후 제거).
 *   기존 `{ paging: PagingInfo; listAction: fn }` 시그니처와는 호환하지 않음.
 *   신규 TanStack 기반 `{ table, totalCount? }` 시그니처 사용.
 *   호출처 적응: MOD-GRID-17 참고.
 *
 * @since G-003 (MOD-GRID-03)
 */

import type { RowData, Table } from '@tanstack/react-table';
import { GridPagination } from '../pagination/GridPagination';
import { useDeprecationWarn } from './useDeprecationWarn';

export interface DataTablePaginationProps<TData extends RowData> {
  /** TanStack Table 인스턴스. */
  table: Table<TData>;
  /**
   * Server 모드에서 전체 row 수.
   * 미전달 시 `table.getFilteredRowModel().rows.length` 사용.
   */
  totalCount?: number;
}

/**
 * `GridPagination` wrapper alias (C-6 backward compat).
 */
export function DataTablePagination<TData extends RowData>({
  table,
  totalCount,
}: DataTablePaginationProps<TData>): JSX.Element {
  useDeprecationWarn('DataTablePagination');
  return (
    <GridPagination<TData>
      table={table}
      {...(totalCount !== undefined ? { totalCount } : {})}
    />
  );
}
