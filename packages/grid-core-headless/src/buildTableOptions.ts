/**
 * `enable*` 입력 → table-core `TableOptions<TData>` 매핑 (W1 Phase 0).
 *
 * grid-core 원본(`internal/buildTableOptions.ts`)을 framework-agnostic 으로 추출:
 * - import 를 `@tanstack/react-table` → `@tanstack/table-core` 로 전환(동일 심볼=동일 인스턴스).
 * - 유일한 React 결합이던 `createCheckboxColumn` 을 **주입 파라미터**(`createSelectionColumn`)로 분리.
 * - selection 정규화 + 'mode≠none 시 체크박스 컬럼 prepend' 정책은 순수하게 여기서 유지.
 * 로직/조건분기는 원본과 동일(behavior 보존, 122 chromium suite 가 최종 게이트).
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
  type ColumnPinningState,
  type ColumnSizingState,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
} from '@tanstack/table-core';

import { buildPaginationOptions } from './buildPaginationOptions';
import type {
  BuildOptionsResult,
  CreateSelectionColumn,
  GridStateBag,
  HeadlessRowSelectionOptions,
  RowSelectionMode,
  TableOptionsInput,
} from './types';

function normalizeSelection<TData>(
  raw: RowSelectionMode | HeadlessRowSelectionOptions<TData> | undefined,
): { mode: RowSelectionMode; options: HeadlessRowSelectionOptions<TData> } {
  if (raw === undefined) {
    return { mode: 'none', options: { mode: 'none' } };
  }
  if (typeof raw === 'string') {
    return { mode: raw, options: { mode: raw } };
  }
  return { mode: raw.mode ?? 'none', options: raw };
}

/**
 * `enable*` 입력 → `TableOptions` 매핑.
 *
 * @param props - GridProps 의 구조적 부분집합(`TableOptionsInput`).
 * @param state - internal state + setters (프레임워크 무관 bag).
 * @param createSelectionColumn - 프레임워크별 체크박스 컬럼 팩토리(주입).
 */
export function buildTableOptions<TData>(
  props: TableOptionsInput<TData>,
  state: GridStateBag,
  createSelectionColumn: CreateSelectionColumn<TData>,
): BuildOptionsResult<TData> {
  const paginationFromMode = buildPaginationOptions<TData>(props.pagination);
  const paginationActive =
    props.enablePagination === true || paginationFromMode.impliedEnablePagination;

  const { mode: selectionMode, options: selectionOptions } = normalizeSelection(
    props.rowSelection,
  );

  const effectiveColumns: ColumnDef<TData, unknown>[] =
    selectionMode === 'none'
      ? props.columns
      : [
          createSelectionColumn(selectionMode, selectionOptions.selectAllPages === true),
          ...props.columns,
        ];

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

  const onRowSelectionChange: OnChangeFn<RowSelectionState> = (updater) => {
    const next = typeof updater === 'function' ? updater(state.rowSelection) : updater;
    state.setRowSelection(next);
    if (selectionOptions.onStateChange) {
      selectionOptions.onStateChange(updater);
    }
    if (selectionOptions.onSelectionChange) {
      const selected: TData[] = Object.keys(next)
        .filter((k) => next[k])
        .map((k) => props.data[Number(k)])
        .filter((row): row is TData => row !== undefined);
      selectionOptions.onSelectionChange(selected);
    }
  };

  const onPaginationChange: OnChangeFn<PaginationState> = (updater) => {
    state.setPagination(updater);
    if (props.pagination?.onPaginationChange) {
      props.pagination.onPaginationChange(updater);
    }
  };

  const onColumnPinningChange: OnChangeFn<ColumnPinningState> = (updater) => {
    state.setColumnPinning(updater);
    if (props.onColumnPinningChange) {
      props.onColumnPinningChange(updater);
    }
  };

  const onColumnSizingChange: OnChangeFn<ColumnSizingState> = (updater) => {
    state.setColumnSizing(updater);
    if (props.onColumnSizingChange) {
      props.onColumnSizingChange(updater);
    }
  };

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
    manualPagination:
      paginationFromMode.tanstackOptions.manualPagination ?? props.pagination?.manual === true,
    manualSorting: props.manualSorting === true,
    manualFiltering: props.manualFiltering === true,
    debugTable: props.debug === true,
  };

  if (props.getRowId) {
    options.getRowId = props.getRowId;
  }

  if (props.enableRowPinning === true) {
    options.enableRowPinning = true;
    options.keepPinnedRows = true;
  }

  if (props.alwaysMultiSort === true) {
    options.isMultiSortEvent = () => true;
  }
  if (props.sortDescFirst !== undefined) {
    options.sortDescFirst = props.sortDescFirst;
  }

  if (props.enableSort === true && props.manualSorting !== true) {
    options.getSortedRowModel = getSortedRowModel();
  }
  if (props.enableFilter === true && props.manualFiltering !== true) {
    options.getFilteredRowModel = getFilteredRowModel();
    options.getFacetedRowModel = getFacetedRowModel();
    options.getFacetedUniqueValues = getFacetedUniqueValues();
  }
  if (paginationActive) {
    options.getPaginationRowModel =
      paginationFromMode.tanstackOptions.getPaginationRowModel ?? getPaginationRowModel();
  }
  if (props.enableExpanding === true) {
    options.getExpandedRowModel = getExpandedRowModel();
  }
  if (typeof paginationFromMode.tanstackOptions.rowCount === 'number') {
    options.rowCount = paginationFromMode.tanstackOptions.rowCount;
  } else if (
    paginationActive &&
    props.pagination?.manual === true &&
    typeof props.pagination.totalCount === 'number'
  ) {
    options.rowCount = props.pagination.totalCount;
  }
  if (typeof paginationFromMode.tanstackOptions.pageCount === 'number') {
    options.pageCount = paginationFromMode.tanstackOptions.pageCount;
  }
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
