/**
 * createColumnGroup — thin wrapper to create a TanStack `GroupColumnDef<TData>`.
 *
 * Provides TypeScript generic type-safety for the standard TanStack column grouping pattern:
 * `{ header: string; columns: ColumnDef<TData>[] }`.
 *
 * @example
 * ```typescript
 * const infoGroup = createColumnGroup({
 *   header: '기본 정보',
 *   columns: [nameCol, deptCol],
 * });
 * ```
 *
 * @see AC-001 in G-001-spec.md — createColumnGroup signature
 * @see Section 5.1 in G-001-spec.md — API design
 */

import type { ColumnDef, GroupColumnDef } from '@tanstack/react-table';

/**
 * Config object for `createColumnGroup`.
 *
 * @typeParam TData - The row data type of the table.
 */
export interface ColumnGroupConfig<TData> {
  /** The display label for the column group header. */
  header: string;
  /** Leaf (or nested group) column definitions belonging to this group. */
  columns: ColumnDef<TData>[];
}

/**
 * Creates a TanStack `GroupColumnDef<TData>` from a typed config object.
 *
 * This is a thin wrapper — no logic beyond type narrowing. The returned
 * object is identical to writing `{ header, columns }` inline, but provides
 * generic type-checking at the call site.
 *
 * @typeParam TData - The row data type of the table.
 * @param config - `ColumnGroupConfig<TData>` with `header` and `columns`.
 * @returns A `GroupColumnDef<TData>` suitable for passing to `useReactTable`.
 */
export function createColumnGroup<TData>(
  config: ColumnGroupConfig<TData>,
): GroupColumnDef<TData> {
  return {
    header: config.header,
    columns: config.columns,
  };
}
