/**
 * `useGridVirtualizer` — `<Grid enableVirtualization />` 시 `useVirtualizer` wiring.
 *
 * G-004 D2/D5/D8: VirtualGrid.tsx:98-103 의 `count/getScrollElement/estimateSize/overscan`
 * 4-옵션 wiring 패턴을 base wrapper 로 추출 (1/8 → 일반화).
 *
 * @see G-004-spec.md Section 2.4 + D5/D8
 */

import { useVirtualizer, type Virtualizer } from '@tanstack/react-virtual';
import type { RefObject } from 'react';
import type { Table } from '@tanstack/react-table';

const DEFAULT_ESTIMATE_SIZE = 36; // D8: BaseGrid `<td className="px-4 py-3">` 기준
const DEFAULT_OVERSCAN = 10; // D8: VirtualGrid.tsx:102 동일

/**
 * `useGridVirtualizer` 옵션.
 *
 * 모두 optional — 미지정 시 default (`estimateSize=36`, `overscan=10`) 적용.
 */
export interface UseGridVirtualizerOptions {
  /**
   * 행 높이 추정 px (default `36`).
   *
   * `useVirtualizer` API 는 함수 시그니처 (`(index: number) => number`) 이지만 본 hook
   * 은 사용자 number prop 을 함수로 wrap (균일 행 높이 가정 — 동적 행은 `measureElement`
   * ref 로 실측 보정).
   */
  estimateSize?: number;

  /**
   * viewport 위/아래 버퍼 행 수 (default `10`).
   * VirtualGrid.tsx:102 동일.
   */
  overscan?: number;
}

/**
 * `<Grid enableVirtualization />` 시 `useVirtualizer` wiring (G-004 D5/D8).
 *
 * @typeParam TData - 행 데이터 타입.
 * @param table - TanStack `useReactTable` 결과 인스턴스.
 * @param scrollContainerRef - scroll 컨테이너 ref (`<div ref>`).
 * @param enabled - `props.enableVirtualization` 그대로 전달 (`true` 시만 active).
 * @param options - 사용자 override (`estimateSize` / `overscan`).
 * @returns `enabled=true` 시 `Virtualizer` 인스턴스, `false` 시 `null`.
 *
 * @remarks
 * - `enabled=false` 시 `useVirtualizer` 호출 자체 skip 은 React rules-of-hooks 위반 →
 *   항상 호출하되 `count=0` 으로 사실상 비활성화. 반환값만 enabled 에 따라 분기.
 * - `measureElement` 는 virtualizer 인스턴스 method 노출 — 사용처 (`Grid.tsx` tbody) 에서
 *   `<tr ref={virtualizer.measureElement}>` 직접 사용 (동적 행 높이 대응 —
 *   VirtualGrid.tsx:170 패턴).
 *
 * @see G-004-spec.md Section 2.4 + D5/D8
 */
export function useGridVirtualizer<TData>(
  table: Table<TData>,
  scrollContainerRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  options?: UseGridVirtualizerOptions,
): Virtualizer<HTMLDivElement, HTMLTableRowElement> | null {
  const rows = table.getRowModel().rows;
  const estimate = options?.estimateSize ?? DEFAULT_ESTIMATE_SIZE;
  const overscan = options?.overscan ?? DEFAULT_OVERSCAN;

  // rules-of-hooks: useVirtualizer 항상 호출 (count 로 비활성화).
  const virtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: enabled ? rows.length : 0,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => estimate, // D8: number → 함수 wrap (TanStack API 표준)
    overscan,
  });

  return enabled ? virtualizer : null;
}
