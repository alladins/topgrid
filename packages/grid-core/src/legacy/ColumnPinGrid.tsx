/**
 * `ColumnPinGrid` — DEPRECATED alias of `<Grid enableColumnPinning>` (G-005 D11).
 *
 * AS-IS legacy `ColumnPinGrid` 의
 * `pinLeft: string[] + pinRight: string[] + sort only` (filter 미wiring) 보존.
 *
 * @deprecated 1 minor 버전 후 다음 major 에서 제거 (C-23). `<Grid enableColumnPinning>` 직접 사용 권장.
 * Migration: `<Grid enableSort enableColumnPinning defaultColumnPinning={{ left, right }} ...>`
 *
 * @see G-005-spec.md Section 2.3 + D11
 */

import type { MouseEvent } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import type { GridPaginationOptions, GridRowSelectionOptions } from '../types';
import { Grid } from '../Grid';
import { useDeprecationWarn } from './useDeprecationWarn';

/**
 * `ColumnPinGridProps<TData>` — AS-IS shape 보존 (ColumnPinGrid.tsx L14-26).
 *
 * @typeParam TData - 행 데이터 타입.
 */
export interface ColumnPinGridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  /** 좌측 sticky pinned column id 배열 (default `[]`). */
  pinLeft?: string[];
  /** 우측 sticky pinned column id 배열 (default `[]`). */
  pinRight?: string[];
  pagination?: GridPaginationOptions;
  rowSelection?: GridRowSelectionOptions<TData>;
  onRowClick?: (row: TData, event: MouseEvent<HTMLTableRowElement>) => void;
  loading?: boolean;
  emptyText?: string;
  className?: string;
}

export function ColumnPinGrid<TData extends object>(
  props: ColumnPinGridProps<TData>,
): JSX.Element {
  useDeprecationWarn('ColumnPinGrid');
  // exactOptionalPropertyTypes — 선택 prop 은 spread 로 conditional 전달.
  return (
    <Grid<TData>
      data={props.data}
      columns={props.columns}
      enableSort
      enableColumnPinning
      defaultColumnPinning={{ left: props.pinLeft ?? [], right: props.pinRight ?? [] }}
      enablePagination={props.pagination !== undefined}
      {...(props.pagination !== undefined ? { pagination: props.pagination } : {})}
      {...(props.rowSelection !== undefined ? { rowSelection: props.rowSelection } : {})}
      {...(props.onRowClick !== undefined ? { onRowClick: props.onRowClick } : {})}
      {...(props.loading !== undefined ? { loading: props.loading } : {})}
      {...(props.emptyText !== undefined ? { emptyText: props.emptyText } : {})}
      {...(props.className !== undefined ? { className: props.className } : {})}
    />
  );
}
