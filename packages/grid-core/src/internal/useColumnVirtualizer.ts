/**
 * `useColumnVirtualizer` — `<Grid enableColumnVirtualization />` 시 가로 `useVirtualizer` wiring
 * (MOD-GRID-27 G-1). `useGridVirtualizer`(세로)의 가로 mirror — center 컬럼(핀 제외)에 대해
 * 동작한다. 핀 컬럼은 가상화 대상이 아니다([[computeColumnWindow]] 불변식).
 *
 * @see useGridVirtualizer
 */

import { useVirtualizer, type Virtualizer } from '@tanstack/react-virtual';
import type { RefObject } from 'react';

const DEFAULT_OVERSCAN = 3; // 가로는 컬럼 단위 — 세로(10)보다 작게.

export interface UseColumnVirtualizerOptions {
  /** viewport 좌/우 버퍼 컬럼 수 (default `3`). */
  overscan?: number;
}

/**
 * @param centerColumnSizes - center 컬럼(핀 제외) 너비 px 배열(표시 순서).
 * @param scrollContainerRef - 가로 scroll 컨테이너 ref.
 * @param enabled - `props.enableColumnVirtualization` (`true` 시만 active).
 * @returns `enabled` 시 horizontal `Virtualizer`, 아니면 `null`.
 *
 * @remarks
 * - rules-of-hooks: `enabled=false` 여도 호출하되 `count=0`.
 * - `getVirtualItems()[0].index` / `[last].index` 가 `computeColumnWindow` 의
 *   `centerStartIndex`/`centerEndIndex` 입력이 된다(G-2 wiring).
 */
export function useColumnVirtualizer(
  centerColumnSizes: number[],
  scrollContainerRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  options?: UseColumnVirtualizerOptions,
): Virtualizer<HTMLDivElement, HTMLTableCellElement> | null {
  const overscan = options?.overscan ?? DEFAULT_OVERSCAN;

  const virtualizer = useVirtualizer<HTMLDivElement, HTMLTableCellElement>({
    horizontal: true,
    count: enabled ? centerColumnSizes.length : 0,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) => centerColumnSizes[index] ?? 0,
    overscan,
  });

  return enabled ? virtualizer : null;
}
