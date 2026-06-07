/**
 * `useAutoPageSize` — 뷰포트 높이에 맞춰 pageSize 를 자동 산정·갱신 (MOD-GRID-49 G-3).
 *
 * `autoPageSize` 활성 시 스크롤 컨테이너의 가용 높이(헤더 제외)를 측정해
 * 순수 `computeAutoPageSize` 로 행 수를 구하고 `table.setPageSize` 한다. ResizeObserver 로 리사이즈 추종.
 *
 * ★전제(AG `paginationAutoPageSize` 동형): 컨테이너 높이가 **바운드**여야 한다(소비자가 고정 height 지정).
 * 비바운드면 컨테이너 높이=콘텐츠 높이라 의미 없음(측정 피드백 루프).
 *
 * @since MOD-GRID-49 (Track 1)
 */

import { useEffect, type RefObject } from 'react';
import type { RowData, Table } from '@tanstack/react-table';

import { computeAutoPageSize } from './computeAutoPageSize';

export function useAutoPageSize<TData extends RowData>(
  table: Table<TData>,
  scrollContainerRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  rowHeight: number,
): void {
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!enabled || !el) return;

    const apply = (): void => {
      // 헤더(sticky thead)는 행 영역이 아니므로 제외.
      const headerHeight = el.querySelector('thead')?.clientHeight ?? 0;
      const availableHeight = el.clientHeight - headerHeight;
      const size = computeAutoPageSize({ availableHeight, rowHeight });
      if (table.getState().pagination.pageSize !== size) {
        table.setPageSize(size);
      }
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [enabled, rowHeight, table, scrollContainerRef]);
}
