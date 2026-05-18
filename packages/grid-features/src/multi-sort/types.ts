/**
 * Multi-sort feature types.
 * @package @topgrid/grid-features
 *
 * Note: `SortClearButtonProps` moved to `@topgrid/grid-core` per ADR-009 (옵션 A).
 * Note: `SortBadgeProps` moved to `@topgrid/grid-core` per ADR-010.
 * Both are re-exported from `@topgrid/grid-core` as deprecation aliases (see grid-features/src/index.ts).
 */

/**
 * `useMultiSort` 훅 옵션 (비-wrapper 소비자용).
 *
 * @remarks
 * `<Grid enableMultiSort />` wrapper 사용자는 이 훅 불필요 — Grid.tsx가 직접 처리. (D6)
 */
export interface UseMultiSortOptions {
  /** 다중 정렬 활성 여부 (default false). */
  enableMultiSort?: boolean;
  /** TanStack maxMultiSortColCount에 직접 전달 (AC-001). 미설정 시 무제한. */
  maxMultiSortColCount?: number;
}

/**
 * `useMultiSort` 반환값.
 * useReactTable 옵션에 spread하여 사용.
 *
 * @example
 * const opts = useMultiSort({ enableMultiSort: true });
 * const table = useReactTable({ ...opts, ... });
 */
export interface UseMultiSortResult {
  /** TanStack TableOptions.enableMultiSort에 전달. */
  enableMultiSort: boolean;
  /**
   * TanStack TableOptions.isMultiSortEvent에 전달.
   * (e) => e.shiftKey — TanStack 내장 기본값과 동일.
   * 명시적으로 설정하여 문서화 목적 달성.
   */
  isMultiSortEvent: (e: unknown) => boolean;
  /** C-29: 미설정 시 undefined — spread 시 TanStack에 전달 안 됨 (무제한). */
  maxMultiSortColCount?: number;
}
