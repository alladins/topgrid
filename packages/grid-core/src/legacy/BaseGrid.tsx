/**
 * `BaseGrid` — DEPRECATED alias of `<Grid>` (G-005 D11 props mapping).
 *
 * AS-IS legacy `BaseGrid` 의
 * sort+filter ALWAYS wiring + pagination conditional 패턴을 유지.
 *
 * @deprecated 1 minor 버전 후 다음 major 에서 제거 (C-23). `<Grid>` 직접 사용 권장.
 * Migration: `<Grid enableSort enableFilter enablePagination={pagination !== undefined} pagination={pagination} ...>`
 *
 * @see G-005-spec.md Section 2.1 + D11
 */

import type { BaseGridProps } from '../types';
import { Grid } from '../Grid';
import { useDeprecationWarn } from './useDeprecationWarn';

export function BaseGrid<TData extends object>(props: BaseGridProps<TData>): JSX.Element {
  useDeprecationWarn('BaseGrid');
  // exactOptionalPropertyTypes — 선택 prop 은 spread 로 conditional 전달 (undefined 명시 할당 회피).
  return (
    <Grid<TData>
      data={props.data}
      columns={props.columns}
      enableSort
      enableFilter
      enablePagination={props.pagination !== undefined}
      {...(props.pagination !== undefined ? { pagination: props.pagination } : {})}
      {...(props.rowSelection !== undefined ? { rowSelection: props.rowSelection } : {})}
      {...(props.onRowClick !== undefined ? { onRowClick: props.onRowClick } : {})}
      {...(props.onRowDoubleClick !== undefined ? { onRowDoubleClick: props.onRowDoubleClick } : {})}
      {...(props.loading !== undefined ? { loading: props.loading } : {})}
      {...(props.emptyText !== undefined ? { emptyText: props.emptyText } : {})}
      {...(props.className !== undefined ? { className: props.className } : {})}
    />
  );
}
