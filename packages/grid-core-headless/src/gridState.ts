/**
 * Grid state 형상 계약 + reset 값 계산 (W1 Phase 0, useGridState 디커플).
 *
 * ★범위(정직): 여기엔 **반응성(reactivity)이 없다**. useState/ref 같은 반응형 상태는
 * 프레임워크별(React useControllableState / Vue ref)로 남는다(by design). headless 는
 * (1) 8개 state 형상 타입, (2) 기본값 단일 진실원천, (3) reset 값 계산(순수)만 제공한다.
 * React(grid-core)·Vue 어댑터가 이 셋을 공유 소비한다.
 */
import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/table-core';

/** 8개 표준 grid state 값. */
export interface GridStateValues<_TData = unknown> {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  rowSelection: RowSelectionState;
  pagination: PaginationState;
  columnPinning: ColumnPinningState;
  columnOrder: ColumnOrderState;
  columnSizing: ColumnSizingState;
  columnVisibility: VisibilityState;
}

/** 8개 state key union. */
export type GridStateKey =
  | 'sorting'
  | 'columnFilters'
  | 'rowSelection'
  | 'pagination'
  | 'columnPinning'
  | 'columnOrder'
  | 'columnSizing'
  | 'columnVisibility';

/** 전체 state key (안정 순서). */
export const GRID_STATE_KEYS: readonly GridStateKey[] = [
  'sorting',
  'columnFilters',
  'rowSelection',
  'pagination',
  'columnPinning',
  'columnOrder',
  'columnSizing',
  'columnVisibility',
];

/**
 * 각 state key 의 기본값 — **단일 진실원천**.
 * 초기값(initialState 미제공)·reset 양쪽이 이 상수를 사용한다(중복 제거).
 */
export const DEFAULT_GRID_STATE_VALUES: GridStateValues<unknown> = {
  sorting: [],
  columnFilters: [],
  rowSelection: {},
  pagination: { pageIndex: 0, pageSize: 10 },
  columnPinning: {},
  columnOrder: [],
  columnSizing: {},
  columnVisibility: {},
};

/**
 * reset 대상 key 들의 복원 값 계산 (순수).
 *
 * - 값 = `initialState[key] ?? DEFAULT_GRID_STATE_VALUES[key]` (mount 시 캡처된 initial 우선).
 * - `Set` 으로 key dedup (멱등).
 * - 알 수 없는 key 는 무시(no-op).
 *
 * resetState(전체) / resetSection(부분) 양쪽이 공유. setter 디스패치는 프레임워크별(React/Vue).
 *
 * @param keys - 복원할 key 목록.
 * @param initialState - mount 시 캡처된 initialState (없으면 DEFAULT 사용).
 * @returns 요청된 valid key 들의 복원 값 맵(부분).
 */
export function resolveResetValues<TData = unknown>(
  keys: readonly GridStateKey[],
  initialState: Partial<GridStateValues<TData>>,
): Partial<GridStateValues<TData>> {
  const out: Partial<GridStateValues<TData>> = {};
  const validKeys = new Set<GridStateKey>(GRID_STATE_KEYS);
  for (const k of new Set(keys)) {
    if (!validKeys.has(k)) continue; // unknown key 무시
    // 각 key 의 값 타입이 달라 per-key 할당(타입 안전).
    switch (k) {
      case 'sorting':
        out.sorting = initialState.sorting ?? DEFAULT_GRID_STATE_VALUES.sorting;
        break;
      case 'columnFilters':
        out.columnFilters = initialState.columnFilters ?? DEFAULT_GRID_STATE_VALUES.columnFilters;
        break;
      case 'rowSelection':
        out.rowSelection = initialState.rowSelection ?? DEFAULT_GRID_STATE_VALUES.rowSelection;
        break;
      case 'pagination':
        out.pagination = initialState.pagination ?? DEFAULT_GRID_STATE_VALUES.pagination;
        break;
      case 'columnPinning':
        out.columnPinning = initialState.columnPinning ?? DEFAULT_GRID_STATE_VALUES.columnPinning;
        break;
      case 'columnOrder':
        out.columnOrder = initialState.columnOrder ?? DEFAULT_GRID_STATE_VALUES.columnOrder;
        break;
      case 'columnSizing':
        out.columnSizing = initialState.columnSizing ?? DEFAULT_GRID_STATE_VALUES.columnSizing;
        break;
      case 'columnVisibility':
        out.columnVisibility =
          initialState.columnVisibility ?? DEFAULT_GRID_STATE_VALUES.columnVisibility;
        break;
    }
  }
  return out;
}
