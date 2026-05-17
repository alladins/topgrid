/**
 * `GroupedHeaderGrid` — DEPRECATED alias (G-005 D11). MOD-GRID-14 enhancement 후속 (D6).
 *
 * AS-IS `tw-framework-front/src/components/tomis/Grid/GroupedHeaderGrid.tsx` 의
 * TanStack 표준 그룹 ColumnDef hierarchy + sort only wiring 보존.
 *
 * @remarks
 * D6: 본 alias 는 basic compatibility shim. enhanced grouping API
 * (`createColumnGroup` helper, sticky group header, 자식 visibility 토글) 는
 * MOD-GRID-14 후속 — 동일 alias 이름에서 semver minor 로 backward-compatible 확장.
 *
 * @deprecated 1 minor 버전 후 다음 major 에서 제거 (C-23) — MOD-GRID-14 enhanced API 권장.
 *
 * @see G-005-spec.md Section 2.4 + D6/D11
 */

import type { MouseEvent } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import type { GridPaginationOptions, GridRowSelectionOptions } from '../types';
import { Grid } from '../Grid';
import { useDeprecationWarn } from './useDeprecationWarn';

/**
 * `GroupedHeaderGridProps<TData>` — AS-IS shape 보존 (GroupedHeaderGrid.tsx L13-24).
 *
 * `columns` 는 TanStack 표준 그룹 구조 (`{ header, columns: [...leaf] }`) 그대로 전달 —
 * G-001 buildTableOptions 가 그룹 ColumnDef 를 무수정 통과 (TanStack 내부 placeholder 메커니즘).
 *
 * @typeParam TData - 행 데이터 타입.
 */
export interface GroupedHeaderGridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  pagination?: GridPaginationOptions;
  rowSelection?: GridRowSelectionOptions<TData>;
  onRowClick?: (row: TData, event: MouseEvent<HTMLTableRowElement>) => void;
  loading?: boolean;
  emptyText?: string;
  className?: string;
}

export function GroupedHeaderGrid<TData extends object>(
  props: GroupedHeaderGridProps<TData>,
): JSX.Element {
  useDeprecationWarn('GroupedHeaderGrid');
  // exactOptionalPropertyTypes — 선택 prop 은 spread 로 conditional 전달.
  return (
    <Grid<TData>
      data={props.data}
      columns={props.columns}
      enableSort
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
