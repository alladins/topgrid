/**
 * Screen-reader live-region message composition (MOD-GRID-28 G-3) — pure.
 *
 * The hard part of G-3 is the live-region LIFECYCLE in the shell (present-and-empty at mount,
 * outside role="grid", skip-first-render), not these strings — see Grid.tsx. Messages are
 * hardcoded Korean (matching the grid's existing `데이터가 없습니다`); localization arrives with
 * the i18n module (MOD-29). Cell navigation is intentionally NOT announced here — aria-activedescendant
 * already drives the screen reader (G-2), so a live announcement on move would double-speak.
 */

import type { SortingState } from '@tanstack/react-table';

/** Sort change → message. `labelOf(columnId)` resolves a human column label. */
export function announceSortMessage(
  sorting: SortingState,
  labelOf: (columnId: string) => string,
): string {
  if (sorting.length === 0) return '정렬이 해제되었습니다';
  const first = sorting[0]!;
  const dir = first.desc ? '내림차순' : '오름차순';
  const more = sorting.length > 1 ? ` 외 ${sorting.length - 1}개 컬럼` : '';
  return `${labelOf(first.id)} 기준 ${dir} 정렬${more}`;
}

/** Selection change → message. `count` = number of selected rows. */
export function announceSelectionMessage(count: number): string {
  return count === 0 ? '선택이 해제되었습니다' : `${count}개 행 선택됨`;
}

/** Filter change → message. `visibleCount` = rows after filtering. (Wired; filter UI lives in grid-features.) */
export function announceFilterMessage(visibleCount: number): string {
  return `필터 적용: ${visibleCount}건`;
}
