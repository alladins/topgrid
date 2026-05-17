/**
 * @tomis/grid-core — multi-sort types (subset moved per ADR-009 + ADR-010).
 *
 * ADR-009: `SortClearButtonProps` moved here from `@tomis/grid-features/multi-sort/types.ts`.
 * ADR-010: `SortBadgeProps` moved here (grid-core canonical source).
 * `UseMultiSortOptions`, `UseMultiSortResult` remain in grid-features.
 */

/**
 * `SortBadge` 컴포넌트 props (ADR-010 canonical — single source in grid-core).
 *
 * @see SortBadge
 */
export interface SortBadgeProps {
  /**
   * TanStack `column.getSortIndex()` 반환값.
   * -1 = 미정렬 → 배지 미표시.
   * 0-based integer → 표시 번호 = sortIndex + 1.
   */
  sortIndex: number;
  /** Tailwind className override (C-5). */
  className?: string;
}

/**
 * `SortClearButton` 컴포넌트 props (AC-003, AC-004).
 *
 * @see SortClearButton
 */
export interface SortClearButtonProps {
  /** 클릭 시 호출 — table.setSorting([]) 연결 (AC-004). */
  onClear: () => void;
  /** 버튼 레이블 (기본: '정렬 초기화'). */
  label?: string;
  /** Tailwind className override (C-5). */
  className?: string;
}
