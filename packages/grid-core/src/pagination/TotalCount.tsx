/**
 * `TotalCount` — 전체 건수 표시 컴포넌트.
 *
 * @since G-002 (MOD-GRID-03)
 */

import { memo, type ReactNode } from 'react';

/**
 * `TotalCount` props.
 */
export interface TotalCountProps {
  /** 전체 row 수. */
  total: number;
  /**
   * 전체 건수 텍스트 포매터 (i18n — MOD-GRID-29). 미지정 시 한국어 기본("전체 N건", N 강조).
   */
  format?: (total: number) => ReactNode;
}

/**
 * "전체 N건" 표시 UI.
 */
export const TotalCount = memo(function TotalCount({ total, format }: TotalCountProps) {
  return (
    <span>
      {format ? format(total) : <>전체 <strong>{total}</strong>건</>}
    </span>
  );
});
