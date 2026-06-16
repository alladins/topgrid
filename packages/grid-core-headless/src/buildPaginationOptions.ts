/**
 * `pagination.mode` → table-core `TableOptions` 조각 변환 (W1 Phase 0: react-table → table-core).
 * 로직은 grid-core 원본과 동일(behavior 보존). import 만 framework-agnostic table-core 로 전환.
 */
import { getPaginationRowModel, type RowData, type TableOptions } from '@tanstack/table-core';

import type { HeadlessPaginationOptions } from './types';

export interface BuildPaginationResult<TData extends RowData> {
  tanstackOptions: Partial<TableOptions<TData>>;
  impliedEnablePagination: boolean;
}

export function buildPaginationOptions<TData extends RowData>(
  pagination: HeadlessPaginationOptions | undefined,
): BuildPaginationResult<TData> {
  if (!pagination) {
    return { tanstackOptions: {}, impliedEnablePagination: false };
  }

  const mode = pagination.mode;

  if (mode === undefined || mode === 'none') {
    return { tanstackOptions: {}, impliedEnablePagination: false };
  }

  const isServer = mode === 'server';

  const tanstackOptions: Partial<TableOptions<TData>> = {
    manualPagination: isServer,
    getPaginationRowModel: getPaginationRowModel(),
  };

  if (isServer) {
    const computedPageCount =
      typeof pagination.totalCount === 'number' &&
      typeof pagination.pageSize === 'number' &&
      pagination.pageSize > 0
        ? Math.ceil(pagination.totalCount / pagination.pageSize)
        : undefined;

    const resolvedPageCount = pagination.pageCount ?? computedPageCount;

    if (typeof resolvedPageCount === 'number') {
      tanstackOptions.pageCount = resolvedPageCount;
    }
    if (typeof pagination.totalCount === 'number') {
      tanstackOptions.rowCount = pagination.totalCount;
    }
  }

  return { tanstackOptions, impliedEnablePagination: true };
}
