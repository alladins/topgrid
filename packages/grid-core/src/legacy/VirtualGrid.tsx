/**
 * `VirtualGrid` — DEPRECATED alias of `<Grid enableVirtualization>` (G-005 D11).
 *
 * AS-IS legacy `VirtualGrid` 의
 * `BaseGridProps + rowHeight + containerHeight` 시그니처 + defaults `40/500` 보존
 * (★ Grid `estimateSize=36`/`virtualScrollHeight=400` 와 다른 default — C-13 외관 회귀 방지).
 *
 * @deprecated 1 minor 버전 후 다음 major 에서 제거 (C-23). `<Grid enableVirtualization>` 직접 사용 권장.
 *
 * @see G-005-spec.md Section 2.2 + D11
 */

import type { BaseGridProps } from '../types';
import { Grid } from '../Grid';
import { useDeprecationWarn } from './useDeprecationWarn';

/**
 * `VirtualGridProps<TData>` — AS-IS shape 보존 (VirtualGrid.tsx L17-20).
 *
 * @typeParam TData - 행 데이터 타입.
 */
export interface VirtualGridProps<TData> extends BaseGridProps<TData> {
  /** 행 높이 추정 px (default `40` — Grid `estimateSize=36` 과 다름, AS-IS 보존). */
  rowHeight?: number;
  /** scroll container 높이 px (default `500` — Grid `virtualScrollHeight=400` 과 다름, AS-IS 보존). */
  containerHeight?: number;
}

export function VirtualGrid<TData extends object>(props: VirtualGridProps<TData>): JSX.Element {
  useDeprecationWarn('VirtualGrid');
  // exactOptionalPropertyTypes — 선택 prop 은 spread 로 conditional 전달 (undefined 명시 할당 회피).
  return (
    <Grid<TData>
      data={props.data}
      columns={props.columns}
      enableSort
      enableFilter
      enableVirtualization
      virtualScrollHeight={props.containerHeight ?? 500}
      virtualizerOptions={{ estimateSize: props.rowHeight ?? 40 }}
      {...(props.rowSelection !== undefined ? { rowSelection: props.rowSelection } : {})}
      {...(props.onRowClick !== undefined ? { onRowClick: props.onRowClick } : {})}
      {...(props.onRowDoubleClick !== undefined ? { onRowDoubleClick: props.onRowDoubleClick } : {})}
      {...(props.loading !== undefined ? { loading: props.loading } : {})}
      {...(props.emptyText !== undefined ? { emptyText: props.emptyText } : {})}
      {...(props.className !== undefined ? { className: props.className } : {})}
    />
  );
}
