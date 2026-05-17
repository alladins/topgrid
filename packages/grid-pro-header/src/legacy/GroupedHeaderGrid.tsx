/**
 * GroupedHeaderGrid — legacy alias component (G-003, C-6 deprecation alias).
 *
 * Wraps `useReactTable` + `MultiRowHeader` + tbody + pagination into a single
 * self-contained component, preserving the AS-IS GroupedHeaderGrid API surface
 * from tw-framework-front/src/components/tomis/Grid/GroupedHeaderGrid.tsx (L0).
 *
 * Behaviour and classNames are ported verbatim from L0 (C-17 visual preservation).
 * `verifyOrWarn` is intentionally absent here — it runs via index.ts side-effect.
 *
 * D3 decision: inline type aliases for GridPaginationOptions / GridRowSelectionOptions
 * to avoid reverse dependency on tw-framework-front.
 *
 * @see G-003-spec.md Section 6.2 — legacy/GroupedHeaderGrid structure
 * @see C-6 — 1 minor version deprecation alias (breaking: false)
 * @see C-17 — AS-IS L0 className is authoritative
 */

import { useState } from 'react';
import type { MouseEvent } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table';
import type { GridPaginationOptions, GridRowSelectionOptions } from '@tomis/grid-core';
import { MultiRowHeader } from '../MultiRowHeader';

/**
 * Props for the legacy `GroupedHeaderGrid` wrapper component.
 *
 * @typeParam TData - The row data type.
 * @deprecated Migrate to composing `useReactTable` + `MultiRowHeader` directly.
 */
export interface GroupedHeaderGridProps<TData = unknown> {
  data: TData[];
  /**
   * Pass grouped column definitions using TanStack Table's native column grouping.
   * Use `{ header: 'Group', columns: [...leafColumns] }` structure for grouping.
   */
  columns: ColumnDef<TData>[];
  pagination?: GridPaginationOptions;
  rowSelection?: GridRowSelectionOptions<TData>;
  onRowClick?: (row: TData, event: MouseEvent<HTMLTableRowElement>) => void;
  loading?: boolean;
  emptyText?: string;
  className?: string;
  /** G-003 AC-001: enable group header click to toggle child column visibility. */
  enableGroupToggle?: boolean;
}

/**
 * Legacy self-contained grid component with grouped multi-row headers.
 *
 * Delegates header rendering to `MultiRowHeader` from `@tomis/grid-pro-header`.
 * tbody and pagination are ported verbatim from AS-IS L0 (C-17).
 *
 * @typeParam TData - The row data type (must extend `object`).
 * @deprecated Prefer composing `useReactTable` + `MultiRowHeader` directly.
 */
export function GroupedHeaderGrid<TData extends object>({
  data,
  columns,
  pagination,
  onRowClick,
  loading = false,
  emptyText = '데이터가 없습니다.',
  className = '',
  enableGroupToggle,
}: GroupedHeaderGridProps<TData>): JSX.Element {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(pagination?.pageSize ?? 20);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination: { pageIndex, pageSize },
    },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater;
      setPageIndex(next.pageIndex);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // C-29: exactOptionalPropertyTypes — conditional spread avoids assigning undefined
    // to a non-optional property when pagination is absent.
    ...(pagination !== undefined
      ? { getPaginationRowModel: getPaginationRowModel() }
      : {}),
    manualPagination: false,
  });

  const pageCount = table.getPageCount();

  if (loading) {
    return (
      <div className={`flex flex-col ${className}`}>
        <div className="h-40 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm border-collapse">
          <MultiRowHeader
            table={table}
            {...(enableGroupToggle === true ? { enableGroupToggle: true } : {})}
          />
          <tbody className="bg-white divide-y divide-gray-100">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={table.getAllLeafColumns().length}
                  className="px-4 py-10 text-center text-gray-400"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={(e) => onRowClick?.(row.original, e)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 whitespace-nowrap text-gray-700 border-r border-gray-100 last:border-r-0"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination !== undefined && (
        <div className="flex items-center justify-between px-2 py-3 text-sm text-gray-600">
          <span>
            전체 <strong>{table.getFilteredRowModel().rows.length}</strong>건
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
            >
              {'«'}
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
            >
              {'‹'}
            </button>
            <span className="px-3">
              {pageIndex + 1} / {pageCount || 1}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
            >
              {'›'}
            </button>
            <button
              onClick={() => table.setPageIndex(pageCount - 1)}
              disabled={!table.getCanNextPage()}
              className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
            >
              {'»'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
