/**
 * @topgrid/grid-features — FilterIndicator 컴포넌트.
 *
 * MOD-GRID-09 G-001 AC-004:
 * 활성 필터 상태를 헤더에 표시하는 파란 dot 인디케이터.
 * `column.getIsFiltered() === true` 일 때만 렌더.
 *
 * Section 5.2 truth table:
 * - isFiltered=true  → 파란 dot (w-2 h-2 rounded-full bg-blue-500)
 * - isFiltered=false → null (렌더 없음)
 *
 * @remarks
 * Tailwind className 전용 (C-5). style={{}} 없음.
 * `jsx: "react-jsx"` 환경 — `import React` 불필요.
 */

import type { FilterIndicatorProps } from './types';

/**
 * 활성 필터 인디케이터 — 파란 dot.
 *
 * `column.getIsFiltered()` 결과값을 isFiltered prop으로 전달.
 * 필터 비활성 시 null 반환 (DOM 요소 없음).
 *
 * @example
 * ```tsx
 * <FilterIndicator isFiltered={column.getIsFiltered()} />
 * ```
 */
export function FilterIndicator({ isFiltered }: FilterIndicatorProps): JSX.Element | null {
  if (!isFiltered) return null;

  return (
    <span
      aria-label="필터 활성"
      aria-hidden="false"
      className="inline-block w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"
    />
  );
}
