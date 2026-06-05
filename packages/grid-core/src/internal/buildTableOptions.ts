/**
 * Internal — `enable*` props → TanStack `TableOptions<TData>` 매핑.
 *
 * 조건부 row model wiring:
 * - `enableSort=true`  → `getSortedRowModel`
 * - `enableFilter=true` → `getFilteredRowModel`
 * - `enablePagination=true` → `getPaginationRowModel`
 * - `enableExpanding=true` → `getExpandedRowModel`
 *
 * `rowSelection` prop을 정규화 (string vs object) 하여 `effectiveColumns` 와 `selectionMode` 산출.
 *
 * @see G-001-spec.md Section 11.2 Step 3
 */

import {
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnOrderState,
  type ColumnPinningState,
  type ColumnSizingState,
  type ExpandedState,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type Updater,
  type VisibilityState,
} from '@tanstack/react-table';

import type { GridProps, GridRowSelectionOptions, RowSelectionMode } from '../types';
import { buildPaginationOptions } from './buildPaginationOptions';
import { createCheckboxColumn } from './CheckboxColumn';

/**
 * Grid 컴포넌트가 보유한 internal state setters + values.
 */
export interface GridStateBag {
  sorting: SortingState;
  setSorting: (updater: Updater<SortingState>) => void;
  columnFilters: ColumnFiltersState;
  setColumnFilters: (updater: Updater<ColumnFiltersState>) => void;
  rowSelection: RowSelectionState;
  setRowSelection: (updater: Updater<RowSelectionState>) => void;
  pagination: PaginationState;
  setPagination: (updater: Updater<PaginationState>) => void;
  columnPinning: ColumnPinningState;
  setColumnPinning: (updater: Updater<ColumnPinningState>) => void;
  columnSizing: ColumnSizingState;
  setColumnSizing: (updater: Updater<ColumnSizingState>) => void;
  expanded: ExpandedState;
  setExpanded: (updater: Updater<ExpandedState>) => void;
  columnVisibility: VisibilityState;
  setColumnVisibility: (updater: Updater<VisibilityState>) => void;
  columnOrder: ColumnOrderState;
  setColumnOrder: (updater: Updater<ColumnOrderState>) => void;
}

/**
 * `buildTableOptions` 결과 — `useReactTable` 에 spread 가능한 옵션 + 정규화 산출물.
 */
export interface BuildOptionsResult<TData> {
  /** `data` / `columns` 제외한 TableOptions (Grid.tsx 에서 spread 후 data/columns 추가). */
  options: Omit<TableOptions<TData>, 'data' | 'columns'>;
  /** 체크박스 컬럼 합성된 최종 columns 배열. */
  effectiveColumns: ColumnDef<TData, unknown>[];
  /** 정규화된 selection mode. */
  selectionMode: RowSelectionMode;
  /** 정규화된 selection options 객체 (string 단축 표기를 객체로 변환한 결과 — 외부 콜백 호출용). */
  selectionOptions: GridRowSelectionOptions<TData>;
}

/**
 * `props.rowSelection` 정규화 — string 단축 표기를 객체 표기로 변환.
 */
function normalizeSelection<TData>(
  raw: RowSelectionMode | GridRowSelectionOptions<TData> | undefined,
): { mode: RowSelectionMode; options: GridRowSelectionOptions<TData> } {
  if (raw === undefined) {
    return { mode: 'none', options: { mode: 'none' } };
  }
  if (typeof raw === 'string') {
    return { mode: raw, options: { mode: raw } };
  }
  return { mode: raw.mode ?? 'none', options: raw };
}

/**
 * `enable*` props → `TableOptions` 매핑.
 *
 * @param props - GridProps (사용자 입력).
 * @param state - Grid 컴포넌트 internal state + setters.
 * @returns options / effectiveColumns / selectionMode / selectionOptions.
 */
export function buildTableOptions<TData>(
  props: GridProps<TData>,
  state: GridStateBag,
): BuildOptionsResult<TData> {
  // G-001 (MOD-GRID-03): pagination.mode → TanStack 옵션 통합.
  // mode 없거나 'none' 이면 buildPaginationOptions 는 { tanstackOptions: {}, impliedEnablePagination: false } 반환
  // → ?? 연산자로 기존 manual/enablePagination 경로가 그대로 사용됨 (C-6 backward compat).
  const paginationFromMode = buildPaginationOptions<TData>(props.pagination);
  // mode='client'|'server' 시 enablePagination prop 없어도 pagination 자동 활성 (spec D5 결정).
  const paginationActive = props.enablePagination === true || paginationFromMode.impliedEnablePagination;

  const { mode: selectionMode, options: selectionOptions } = normalizeSelection(props.rowSelection);

  const effectiveColumns: ColumnDef<TData, unknown>[] =
    selectionMode === 'none'
      ? props.columns
      : [createCheckboxColumn<TData>(selectionMode), ...props.columns];

  // exactOptionalPropertyTypes: true — undefined 명시 할당 금지 → 조건부 객체 조립.
  const tableState: NonNullable<TableOptions<TData>['state']> = {
    sorting: state.sorting,
    columnFilters: state.columnFilters,
    rowSelection: state.rowSelection,
    pagination: state.pagination,
    columnPinning: state.columnPinning,
    columnSizing: state.columnSizing,
    expanded: state.expanded,
    columnVisibility: state.columnVisibility,
    columnOrder: state.columnOrder,
  };

  // rowSelection state change handler — 외부 onSelectionChange 콜백 호출 통합 (BaseGrid L82-91 패턴).
  const onRowSelectionChange: OnChangeFn<RowSelectionState> = (updater) => {
    const next = typeof updater === 'function' ? updater(state.rowSelection) : updater;
    state.setRowSelection(next);
    // controlled state callback (있다면)
    if (selectionOptions.onStateChange) {
      selectionOptions.onStateChange(updater);
    }
    // selected rows callback
    if (selectionOptions.onSelectionChange) {
      const selected: TData[] = Object.keys(next)
        .filter((k) => next[k])
        .map((k) => props.data[Number(k)])
        .filter((row): row is TData => row !== undefined);
      selectionOptions.onSelectionChange(selected);
    }
  };

  // pagination change handler — controlled 모드 외부 콜백 호출 통합.
  const onPaginationChange: OnChangeFn<PaginationState> = (updater) => {
    state.setPagination(updater);
    if (props.pagination?.onPaginationChange) {
      props.pagination.onPaginationChange(updater);
    }
  };

  // G-002: ColumnPinning 변경 시 internal state + 외부 콜백 호출 통합.
  const onColumnPinningChange: OnChangeFn<ColumnPinningState> = (updater) => {
    state.setColumnPinning(updater);
    if (props.onColumnPinningChange) {
      props.onColumnPinningChange(updater);
    }
  };

  // G-002: ColumnSizing 변경 시 internal state + 외부 콜백 호출 통합.
  const onColumnSizingChange: OnChangeFn<ColumnSizingState> = (updater) => {
    state.setColumnSizing(updater);
    if (props.onColumnSizingChange) {
      props.onColumnSizingChange(updater);
    }
  };

  // MOD-GRID-22 (SSRM): Sorting/ColumnFilters 변경 시 internal state + 외부 콜백 통합
  // (onColumnPinningChange/onColumnSizingChange 와 동형). SSRM 훅이 server 정렬/필터
  // 파라미터를 도출하고 캐시를 무효화하는 신호로 사용. 미제공 시 기존 동작 불변.
  const onSortingChange: OnChangeFn<SortingState> = (updater) => {
    state.setSorting(updater);
    if (props.onSortingChange) {
      props.onSortingChange(updater);
    }
  };
  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
    state.setColumnFilters(updater);
    if (props.onColumnFiltersChange) {
      props.onColumnFiltersChange(updater);
    }
  };

  const options: Omit<TableOptions<TData>, 'data' | 'columns'> = {
    state: tableState,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange,
    onColumnFiltersChange,
    onRowSelectionChange,
    onPaginationChange,
    onColumnPinningChange,
    onColumnSizingChange,
    onExpandedChange: state.setExpanded,
    onColumnVisibilityChange: state.setColumnVisibility,
    onColumnOrderChange: state.setColumnOrder,
    enableSorting: props.enableSort === true,
    enableMultiSort: props.enableMultiSort === true,
    enableRowSelection: selectionMode !== 'none',
    enableMultiRowSelection: selectionMode === 'multi',
    enableColumnPinning: props.enableColumnPinning === true,
    enableColumnResizing: props.enableColumnResizing === true,
    columnResizeMode: props.columnResizeMode ?? 'onChange',
    enableExpanding: props.enableExpanding === true,
    // mode 유래 값 우선, 없으면 기존 manual prop 경로 (C-6 backward compat).
    manualPagination: paginationFromMode.tanstackOptions.manualPagination ?? (props.pagination?.manual === true),
    // MOD-GRID-22 (SSRM): server 정렬/필터 시 클라이언트 row-model 억제(placeholder 배열 무손상).
    manualSorting: props.manualSorting === true,
    manualFiltering: props.manualFiltering === true,
    debugTable: props.debug === true,
  };

  // MOD-GRID-36 G-1: 안정적 행 식별 — getRowId 제공 시 인덱스 대신 콜백 id 사용. RowSelectionState·
  // expanded 등 모든 행-키 상태가 데이터 재정렬/교체를 가로질러 동일 행을 추적(reconciliation).
  if (props.getRowId) {
    options.getRowId = props.getRowId;
  }

  // MOD-GRID-39 G-1: 행 고정(사용자가 데이터 행을 상/하단 고정). 비-가상화 전용(가상화+핀=vN).
  if (props.enableRowPinning === true) {
    options.enableRowPinning = true;
    options.keepPinnedRows = true; // 필터/페이지 밖이어도 고정 행 유지(AG 기본 동작).
  }

  // MOD-GRID-37 G-3: 정렬 동작 knobs (TanStack passthrough).
  // alwaysMultiSort → 평범 클릭도 다중 정렬 누적(shift 키 불요). sortDescFirst → 첫 클릭 내림차순.
  if (props.alwaysMultiSort === true) {
    options.isMultiSortEvent = () => true;
  }
  if (props.sortDescFirst !== undefined) {
    options.sortDescFirst = props.sortDescFirst;
  }

  // MOD-GRID-22: manual 시 클라이언트 정렬/필터 row-model 미장착(서버가 이미 적용).
  if (props.enableSort === true && props.manualSorting !== true) {
    options.getSortedRowModel = getSortedRowModel();
  }
  if (props.enableFilter === true && props.manualFiltering !== true) {
    options.getFilteredRowModel = getFilteredRowModel();
    // MOD-GRID-30 G-2: faceted row models — SelectFilter 의 column.getFacetedUniqueValues() 를 OOTB
    // 동작시킨다(이전엔 소비자가 직접 등록 안 하면 빈 리스트 silent-fail). enableFilter 게이트에 묶어
    // facet ⊆ filter 보장(SelectFilter 가 동작 가능한 곳=enableFilter 인 곳이므로 "out of the box"). 모델은
    // **lazy**(컬럼 facet 접근 시에만 계산) → SelectFilter 없는 필터 그리드엔 계산 경로 자체가 없어 무비용.
    // manualFiltering(SSRM) 제외: 클라 facet 은 서버-paged placeholder 위에선 부정확(server-provided 필요=범위 밖).
    options.getFacetedRowModel = getFacetedRowModel();
    options.getFacetedUniqueValues = getFacetedUniqueValues();
  }
  // paginationActive = enablePagination===true OR mode='client'|'server' (D5 결정).
  // getPaginationRowModel: mode 유래 인스턴스 재사용 (있으면), 없으면 신규 생성.
  if (paginationActive) {
    options.getPaginationRowModel =
      paginationFromMode.tanstackOptions.getPaginationRowModel ?? getPaginationRowModel();
  }
  if (props.enableExpanding === true) {
    options.getExpandedRowModel = getExpandedRowModel();
  }
  // rowCount: mode 유래 값 우선 (server totalCount 계산 포함); fallback — 기존 manual+totalCount 경로.
  if (typeof paginationFromMode.tanstackOptions.rowCount === 'number') {
    options.rowCount = paginationFromMode.tanstackOptions.rowCount;
  } else if (paginationActive && props.pagination?.manual === true && typeof props.pagination.totalCount === 'number') {
    options.rowCount = props.pagination.totalCount;
  }
  // pageCount: mode='server' 시 계산된 값 (기존 코드에는 이 경로가 없었음).
  // C-29: undefined literal 직접 할당 금지 → 조건부 할당 패턴.
  if (typeof paginationFromMode.tanstackOptions.pageCount === 'number') {
    options.pageCount = paginationFromMode.tanstackOptions.pageCount;
  }
  // C-29: exactOptionalPropertyTypes — undefined 직접 할당 금지. 값이 있을 때만 할당.
  if (props.maxMultiSortColCount !== undefined) {
    options.maxMultiSortColCount = props.maxMultiSortColCount;
  }
  if (props.getSubRows) {
    options.getSubRows = props.getSubRows;
  }

  return {
    options,
    effectiveColumns,
    selectionMode,
    selectionOptions,
  };
}
