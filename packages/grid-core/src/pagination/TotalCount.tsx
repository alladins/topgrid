/**
 * `TotalCount` — 전체 건수 표시 컴포넌트.
 *
 * @since G-002 (MOD-GRID-03)
 */

import { memo } from 'react';

/**
 * `TotalCount` props.
 */
export interface TotalCountProps {
  /** 전체 row 수. */
  total: number;
}

/**
 * "전체 N건" 표시 UI.
 */
export const TotalCount = memo(function TotalCount({ total }: TotalCountProps) {
  return (
    <span>
      전체 <strong>{total}</strong>건
    </span>
  );
});
