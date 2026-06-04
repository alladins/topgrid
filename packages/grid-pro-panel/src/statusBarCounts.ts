/**
 * @topgrid/grid-pro-panel — status-bar 내장 카운트 (MOD-GRID-33 G-1).
 *
 * StatusBar 는 prop-driven 컨테이너(`items`)라 fork 하지 않고 **items 로 합성**한다. 이 헬퍼는 TanStack
 * Table 에서 세 카운트를 읽어 `StatusBarItem[]` 로 만든다:
 *   `<StatusBar items={statusBarCounts(table)} />`
 *
 * ★ row model 정확성(silent-divergence 함정): 잘못 고르면 카운트가 조용히 틀린다.
 *   - total    = `getCoreRowModel`     (필터 *전* 전체 행)
 *   - filtered = `getFilteredRowModel` (필터 후·페이지네이션 *전*)
 *   - selected = `getSelectedRowModel` (현재 선택)
 * 렌더 시점에 호출되므로(소비자가 table 로 렌더), 선택/필터 변경 → 재렌더 → 카운트 갱신.
 */

import type { Table } from '@tanstack/react-table';
import type { StatusBarItem } from './StatusBar.js';

/** 카운트 세그먼트 라벨 override(미지정 시 한국어 기본). */
export interface StatusBarCountLabels {
  total?: string;
  filtered?: string;
  selected?: string;
}

/**
 * table 에서 total/filtered/selected 카운트를 읽어 `StatusBarItem[]` 생성.
 *
 * @param table - TanStack `Table` 인스턴스.
 * @param labels - 세그먼트 라벨 override(부분).
 */
export function statusBarCounts<TData>(
  table: Table<TData>,
  labels?: StatusBarCountLabels,
): StatusBarItem[] {
  return [
    { key: 'total', label: labels?.total ?? '전체', value: table.getCoreRowModel().rows.length },
    { key: 'filtered', label: labels?.filtered ?? '필터됨', value: table.getFilteredRowModel().rows.length },
    { key: 'selected', label: labels?.selected ?? '선택', value: table.getSelectedRowModel().rows.length },
  ];
}
