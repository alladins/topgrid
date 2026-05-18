/**
 * SortClearButton — 다중 정렬 전체 초기화 버튼 컴포넌트.
 *
 * Moved from `@topgrid/grid-features/multi-sort/SortClearButton.tsx` per ADR-009 (옵션 A).
 * Aliased re-export remains in `@topgrid/grid-features` for one minor cycle.
 *
 * @package @topgrid/grid-core
 */

import React from 'react';
import type { SortClearButtonProps } from './types';

/**
 * 현재 정렬 상태를 전부 지우는 버튼.
 * `onClear` 콜백에 `table.setSorting([])` 를 연결하여 사용.
 *
 * @example
 * <SortClearButton onClear={() => table.setSorting([])} />
 *
 * @see SortClearButtonProps
 */
export function SortClearButton({
  onClear,
  label = '정렬 초기화',
  className,
}: SortClearButtonProps): React.JSX.Element {
  const base =
    'px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-100 text-gray-600';
  return (
    <button
      type="button"
      onClick={onClear}
      className={className ?? base}
    >
      {label}
    </button>
  );
}
