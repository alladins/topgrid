/**
 * @file useGridState — 8 TanStack state hook 통합 wrapper (G-001 + G-002, MOD-GRID-02).
 *
 * L0 BaseGrid.tsx L29-33 등 8 variant의 중복 `useState<StateType>` 패턴을 흡수.
 * 반환 타입 `GridState<TData>`는 TanStack `useReactTable` `state` 객체 및
 * `onXxxChange` 핸들러에 직접 연결 가능.
 *
 * G-002: `options?: UseGridStateOptions<TData>` 파라미터 추가.
 * - `initialState`: uncontrolled 초기값 설정.
 * - `state`: 키 단위 controlled 모드 (키 단위 혼합 가능).
 * - `onStateChange`: 전체 state 변경 통보 콜백.
 * 기존 `useGridState()` (파라미터 없음) 호출 완전 보존 (C-6 backward compatibility).
 *
 * @see G-001-spec.md Section 2.1 — API 계약 (G-001)
 * @see G-002-spec.md Section 2.2 — hook 시그니처 확장
 * @see G-002-spec.md Section 11.2 — Before/After 코드 스니펫
 * @see G-003-spec.md Section 2.3 — debounceMs wiring
 * @see G-004-spec.md Section 2.1 + 2.2 — resetState/resetSection/clearSelectionKey
 */

import { useCallback, useEffect, useRef } from 'react';
import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  OnChangeFn,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import type { GridState, GridStateKey, GridStateValues, UseGridStateOptions } from './types';
import { useControllableState } from './internal/useControllableState';
import { useDebouncedCallback } from './internal/useDebouncedCallback';
// W1 Phase 0: 기본값(단일 진실원천)·reset 값 계산을 framework-agnostic headless 에서 가져온다.
// 반응성(useControllableState/useEffect/useRef)만 React 로 남는다(by design).
import {
  DEFAULT_GRID_STATE_VALUES,
  GRID_STATE_KEYS,
  resolveResetValues,
} from '@topgrid/grid-core-headless';

/**
 * 8개 TanStack 표준 state + setter를 한 번에 반환하는 통합 훅.
 *
 * 기존 variant(BaseGrid/VirtualGrid/...) 에서 각각 선언하던 5~7개의
 * `useState<StateType>` 호출을 1줄로 대체한다.
 *
 * **G-002 확장 (controlled/uncontrolled/initialState)**:
 * - `options` 미제공 시 G-001과 동일 동작 (모든 state uncontrolled, 기본값).
 * - `initialState`: uncontrolled 모드에서 특정 키의 초기값 지정.
 * - `state`: 키 단위 controlled 모드 (`state.sorting`이 있으면 sorting controlled, 나머지 uncontrolled).
 * - `onStateChange(next, key)`: state 변경 시 통보 — controlled/uncontrolled 양쪽 호출.
 *
 * **EC-09 (controlled + initialState 동시 제공)**: `state` 제공 시 해당 키의 `initialState`는 무시됨 (controlled 우선).
 *
 * @typeParam TData - 행 데이터 타입 (default `unknown`). G-002 options 타입 파라미터에 사용.
 *
 * @returns `GridState<TData>` — 8 state 값 + 8 `OnChangeFn<StateType>` setter 객체.
 *
 * @example
 * ```ts
 * // G-001 호환 (파라미터 없음)
 * const s = useGridState<User>();
 *
 * // uncontrolled + initialState (G-002)
 * const s = useGridState<Slip>({
 *   initialState: { sorting: [{ id: 'date', desc: true }], pagination: { pageIndex: 0, pageSize: 20 } },
 * });
 *
 * // controlled mode — Redux 연동 (G-002)
 * const s = useGridState<Attendance>({
 *   state: { sorting: externalSorting },
 *   onStateChange: (next, key) => {
 *     if (key === 'sorting') dispatch(setGridSorting(next.sorting));
 *   },
 * });
 *
 * // TanStack useReactTable 직접 소비
 * const table = useReactTable<User>({
 *   data,
 *   columns,
 *   state: {
 *     sorting: s.sorting,
 *     columnFilters: s.columnFilters,
 *     rowSelection: s.rowSelection,
 *     pagination: s.pagination,
 *   },
 *   onSortingChange: s.setSorting,
 *   onColumnFiltersChange: s.setColumnFilters,
 *   onRowSelectionChange: s.setRowSelection,
 *   onPaginationChange: s.setPagination,
 *   getCoreRowModel: getCoreRowModel(),
 *   getSortedRowModel: getSortedRowModel(),
 * });
 * ```
 *
 * **G-004 확장 (resetState / resetSection / clearSelectionKey)**:
 * - `resetState()`: 8개 state 모두 `initialState` (or defaultValues) 로 복원.
 * - `resetSection(key)`: 단일 또는 배열 key 의 state 만 선택적 복원 (Set dedup 멱등).
 * - `options.clearSelectionKey`: 외부 트리거 (string | number) 변경 시 `rowSelection` 자동 reset.
 *   XxgridTable `clearSelectionKey` 패턴 흡수 (R-A). mount 시 reset 미발생 (isFirstClearRender flag).
 *
 * @see GridState
 * @see UseGridStateOptions
 * @see G-002-spec.md Section 2.2 + Section 2.5 + Section 2.6
 * @see G-004-spec.md Section 2.1 + Section 2.2 + Section 11.1
 */
export function useGridState<TData = unknown>(
  options?: UseGridStateOptions<TData>,
): GridState<TData> {
  /**
   * stale-closure 방지 ref (Section 11.3 위험 완화).
   * onStateChange에서 `{ ...snapshotRef.current, [key]: next }` 형태로
   * 최신 snapshot을 참조하여 stale 값 전달 위험 제거.
   *
   * `null!` 초기화: onChange는 mount 후 user 인터랙션 시에만 호출되므로
   * 첫 render 시 ref 갱신이 항상 먼저 완료됨 (안전).
   */
  const snapshotRef = useRef<GridStateValues<TData>>(null!);

  // ─── G-004: initialState ref (mount 시 1회 capture, D6) ───
  // useRef 초기화: options?.initialState 를 mount 시 고정.
  // 이후 options.initialState 변경은 무시 — resetState 가 렌더 중 변경된 prop 을 따라
  // reset 대상이 바뀌는 것을 방지 (React 표준 패턴).
  const initialStateRef = useRef<Partial<GridStateValues<TData>>>(
    options?.initialState ?? {},
  );

  // ─── G-003: debounce wiring (D6, AC-003) ───
  // debounceMs <= 0 또는 미설정 시 동기 호출 (G-002 동작 완전 보존).
  // useDebouncedCallback 내부에서 ms <= 0 시 fn 그대로 반환 (EC-01, EC-02).
  const debounceMs = options?.debounceMs ?? 0;
  const debouncedOnStateChange = useDebouncedCallback(
    (next: GridStateValues<TData>, changedKey: GridStateKey) => {
      options?.onStateChange?.(next, changedKey);
    },
    debounceMs,
  );

  // ─── sorting ───
  const [sorting, setSorting] = useControllableState<SortingState>({
    value: options?.state?.sorting,
    defaultValue: options?.initialState?.sorting ?? DEFAULT_GRID_STATE_VALUES.sorting,
    onChange: (next) =>
      debouncedOnStateChange({ ...snapshotRef.current, sorting: next }, 'sorting'),
  });

  // ─── columnFilters ───
  const [columnFilters, setColumnFilters] = useControllableState<ColumnFiltersState>({
    value: options?.state?.columnFilters,
    defaultValue: options?.initialState?.columnFilters ?? DEFAULT_GRID_STATE_VALUES.columnFilters,
    onChange: (next) =>
      debouncedOnStateChange(
        { ...snapshotRef.current, columnFilters: next },
        'columnFilters',
      ),
  });

  // ─── rowSelection ───
  const [rowSelection, setRowSelection] = useControllableState<RowSelectionState>({
    value: options?.state?.rowSelection,
    defaultValue: options?.initialState?.rowSelection ?? DEFAULT_GRID_STATE_VALUES.rowSelection,
    onChange: (next) =>
      debouncedOnStateChange(
        { ...snapshotRef.current, rowSelection: next },
        'rowSelection',
      ),
  });

  // ─── pagination ───
  const [pagination, setPagination] = useControllableState<PaginationState>({
    value: options?.state?.pagination,
    defaultValue: options?.initialState?.pagination ?? DEFAULT_GRID_STATE_VALUES.pagination,
    onChange: (next) =>
      debouncedOnStateChange(
        { ...snapshotRef.current, pagination: next },
        'pagination',
      ),
  });

  // ─── columnPinning ───
  const [columnPinning, setColumnPinning] = useControllableState<ColumnPinningState>({
    value: options?.state?.columnPinning,
    defaultValue: options?.initialState?.columnPinning ?? DEFAULT_GRID_STATE_VALUES.columnPinning,
    onChange: (next) =>
      debouncedOnStateChange(
        { ...snapshotRef.current, columnPinning: next },
        'columnPinning',
      ),
  });

  // ─── columnOrder ───
  const [columnOrder, setColumnOrder] = useControllableState<ColumnOrderState>({
    value: options?.state?.columnOrder,
    defaultValue: options?.initialState?.columnOrder ?? DEFAULT_GRID_STATE_VALUES.columnOrder,
    onChange: (next) =>
      debouncedOnStateChange(
        { ...snapshotRef.current, columnOrder: next },
        'columnOrder',
      ),
  });

  // ─── columnSizing ───
  const [columnSizing, setColumnSizing] = useControllableState<ColumnSizingState>({
    value: options?.state?.columnSizing,
    defaultValue: options?.initialState?.columnSizing ?? DEFAULT_GRID_STATE_VALUES.columnSizing,
    onChange: (next) =>
      debouncedOnStateChange(
        { ...snapshotRef.current, columnSizing: next },
        'columnSizing',
      ),
  });

  // ─── columnVisibility ───
  const [columnVisibility, setColumnVisibility] = useControllableState<VisibilityState>({
    value: options?.state?.columnVisibility,
    defaultValue: options?.initialState?.columnVisibility ?? DEFAULT_GRID_STATE_VALUES.columnVisibility,
    onChange: (next) =>
      debouncedOnStateChange(
        { ...snapshotRef.current, columnVisibility: next },
        'columnVisibility',
      ),
  });

  // 매 render마다 최신 snapshot을 ref에 갱신 — onChange stale closure 방지 (Section 11.3)
  snapshotRef.current = {
    sorting,
    columnFilters,
    rowSelection,
    pagination,
    columnPinning,
    columnOrder,
    columnSizing,
    columnVisibility,
  };

  // ─── G-004: clearSelectionKey useEffect (D4, EC-04) ───
  // XxgridTable L88-92 패턴 흡수. 외부에서 clearSelectionKey 가 변경되면 rowSelection 자동 reset.
  // isFirstClearRender ref flag 로 mount 시 reset 방지 — 초기값이 undefined 가 아닐 때도 안전.
  //
  // setRowSelection 을 deps 에 포함하지 않는 이유 (spec D4):
  // useControllableState 가 매 render 새 setValue 함수 인스턴스를 반환하므로 deps 에 포함하면
  // 모든 render 마다 effect 가 재실행되어 무한 reset 루프 발생. setRowSelection 은 함수 호출
  // 시점의 최신 closure 를 사용 (semantic stability) — clearSelectionKey 변경만 트리거.
  // setRowSelectionRef 패턴은 과도한 wrapping — eslint-disable 주석으로 의도 명시.
  const clearSelectionKey = options?.clearSelectionKey;
  const isFirstClearRender = useRef(true);
  useEffect(() => {
    if (isFirstClearRender.current) {
      isFirstClearRender.current = false;
      return;
    }
    if (clearSelectionKey !== undefined) {
      setRowSelection({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearSelectionKey]);

  // ─── G-004: reset 디스패치 (W1 Phase 0) ───
  // 복원 '값 계산'은 framework-agnostic headless `resolveResetValues`(순수, node 특성화됨)에 위임.
  // 여기선 계산된 값 맵을 React setter 로 디스패치만 한다(반응성=프레임워크별, by design).
  // controlled 키: setter 가 isControlled 분기로 onChange 만 호출 (D5).
  const applyReset = useCallback(
    (vals: Partial<GridStateValues<TData>>) => {
      if (vals.sorting !== undefined) setSorting(vals.sorting);
      if (vals.columnFilters !== undefined) setColumnFilters(vals.columnFilters);
      if (vals.rowSelection !== undefined) setRowSelection(vals.rowSelection);
      if (vals.pagination !== undefined) setPagination(vals.pagination);
      if (vals.columnPinning !== undefined) setColumnPinning(vals.columnPinning);
      if (vals.columnOrder !== undefined) setColumnOrder(vals.columnOrder);
      if (vals.columnSizing !== undefined) setColumnSizing(vals.columnSizing);
      if (vals.columnVisibility !== undefined) setColumnVisibility(vals.columnVisibility);
    },
    [
      setSorting,
      setColumnFilters,
      setRowSelection,
      setPagination,
      setColumnPinning,
      setColumnOrder,
      setColumnSizing,
      setColumnVisibility,
    ],
  );

  // resetState (AC-001): 전체 8 key 를 initial(없으면 DEFAULT)로 복원.
  const resetState = useCallback(() => {
    applyReset(resolveResetValues<TData>(GRID_STATE_KEYS, initialStateRef.current));
  }, [applyReset]);

  // resetSection (AC-002): 단일/배열 key 부분 복원. Set dedup·unknown-key no-op 은 resolveResetValues 내부.
  const resetSection = useCallback(
    (key: GridStateKey | GridStateKey[]) => {
      applyReset(
        resolveResetValues<TData>(
          Array.isArray(key) ? key : [key],
          initialStateRef.current,
        ),
      );
    },
    [applyReset],
  );

  return {
    sorting,
    columnFilters,
    rowSelection,
    pagination,
    columnPinning,
    columnOrder,
    columnSizing,
    columnVisibility,
    setSorting: setSorting as OnChangeFn<SortingState>,
    setColumnFilters: setColumnFilters as OnChangeFn<ColumnFiltersState>,
    setRowSelection: setRowSelection as OnChangeFn<RowSelectionState>,
    setPagination: setPagination as OnChangeFn<PaginationState>,
    setColumnPinning: setColumnPinning as OnChangeFn<ColumnPinningState>,
    setColumnOrder: setColumnOrder as OnChangeFn<ColumnOrderState>,
    setColumnSizing: setColumnSizing as OnChangeFn<ColumnSizingState>,
    setColumnVisibility: setColumnVisibility as OnChangeFn<VisibilityState>,
    // ─── G-004: reset helpers ───
    resetState,
    resetSection,
  };
}
