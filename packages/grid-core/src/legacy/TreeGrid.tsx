/**
 * `TreeGrid` — DEPRECATED alias of `<Grid enableExpanding>` (G-005 D11) + `defaultExpanded` (D5).
 *
 * AS-IS `tw-framework-front/src/components/tomis/Grid/TreeGrid.tsx` 의
 * `getSubRows + expandAll initial seed` 시그니처 보존.
 *
 * @remarks
 * D5: `expandAll={true}` → `defaultExpanded={true}` (TanStack ExpandedState `true` = 전체 펼침).
 * `expandAll` 미지정/false → `defaultExpanded={{}}`.
 *
 * @deprecated 1 minor 버전 후 다음 major 에서 제거 (C-23). `<Grid enableExpanding>` 직접 사용 권장.
 * Migration: `<Grid enableExpanding getSubRows defaultExpanded={true} ...>`
 *
 * @see G-005-spec.md Section 2.5 + D5/D11
 */

import type { MouseEvent } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { Grid } from '../Grid';
import { useDeprecationWarn } from './useDeprecationWarn';

/**
 * `TreeGridProps<TData>` — AS-IS shape 보존 (TreeGrid.tsx L12-22).
 *
 * @typeParam TData - 행 데이터 타입.
 */
export interface TreeGridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  /** 자식 행 추출 함수 (TanStack `getSubRows` 와 시그니처 호환). */
  getSubRows?: (row: TData) => TData[] | undefined;
  /** `true` 시 마운트 시 전체 트리 펼침 (D5 `defaultExpanded={true}` 매핑). */
  expandAll?: boolean;
  onRowClick?: (row: TData, event: MouseEvent<HTMLTableRowElement>) => void;
  loading?: boolean;
  emptyText?: string;
  className?: string;
}

export function TreeGrid<TData extends object>(props: TreeGridProps<TData>): JSX.Element {
  useDeprecationWarn('TreeGrid');
  // exactOptionalPropertyTypes — 선택 prop 은 spread 로 conditional 전달
  // (buildTableOptions.ts L194 동일 패턴 + Grid `onRowClick` 시그니처 contravariance 호환).
  return (
    <Grid<TData>
      data={props.data}
      columns={props.columns}
      enableExpanding
      defaultExpanded={props.expandAll ? true : {}}
      {...(props.getSubRows ? { getSubRows: props.getSubRows } : {})}
      {...(props.onRowClick !== undefined ? { onRowClick: props.onRowClick } : {})}
      {...(props.loading !== undefined ? { loading: props.loading } : {})}
      {...(props.emptyText !== undefined ? { emptyText: props.emptyText } : {})}
      {...(props.className !== undefined ? { className: props.className } : {})}
    />
  );
}
