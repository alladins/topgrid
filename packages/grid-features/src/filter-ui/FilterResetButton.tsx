/**
 * @tomis/grid-features — FilterResetButton 컴포넌트.
 *
 * MOD-GRID-09 G-004 AC-005:
 * table.resetColumnFilters() + table.setGlobalFilter(undefined) 호출.
 * columnFilters.length === 0 && !globalFilter 시 disabled.
 *
 * D6: disabled 조건 — Truth Table 5.2:
 * - columnFilters=[], globalFilter=undefined → disabled=true
 * - 그 외 → disabled=false
 *
 * C-4: no any — Table<TData>.
 * C-5: Tailwind className만.
 *
 * @remarks
 * children prop은 버튼 레이블 오버라이드 용도.
 * 기본 레이블: 'Reset Filters'.
 */

import type { FilterResetButtonProps } from './types';

/**
 * 필터 전체 초기화 버튼 컴포넌트.
 *
 * @template TData - TanStack Row data 타입.
 * @param props.table - TanStack Table 인스턴스.
 * @param props.children - 버튼 레이블 (기본 'Reset Filters').
 */
export function FilterResetButton<TData>({
  table,
  children,
}: FilterResetButtonProps<TData>): JSX.Element {
  const { columnFilters, globalFilter } = table.getState();

  // disabled 조건 (AC-005, D6, Truth Table 5.2)
  const isDisabled = columnFilters.length === 0 && !globalFilter;

  const handleClick = (): void => {
    table.resetColumnFilters();
    table.setGlobalFilter(undefined);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={[
        'inline-flex items-center gap-1 rounded border px-3 py-1.5 text-sm font-medium transition-colors',
        isDisabled
          ? 'border-gray-200 bg-gray-50 text-gray-400 opacity-50 cursor-not-allowed'
          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900',
      ].join(' ')}
      aria-label="필터 초기화"
    >
      {children ?? 'Reset Filters'}
    </button>
  );
}
