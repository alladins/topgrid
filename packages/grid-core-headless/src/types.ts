/**
 * Framework-agnostic 계약 타입 (W1 Phase 0).
 *
 * grid-core 의 React `GridProps` 가 구조적으로 만족하는 입력 부분집합(`TableOptionsInput`)과,
 * 프레임워크 무관 selection/pagination 설정 타입을 정의한다. grid-core/Vue 어댑터가 공유 소비.
 * 모든 타입은 `@tanstack/table-core` 위에서만 정의 — React 의존 없음.
 */
import type {
  ColumnDef,
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ExpandedState,
  OnChangeFn,
  PaginationState,
  RowSelectionState,
  SortingState,
  TableOptions,
  Updater,
  VisibilityState,
} from '@tanstack/table-core';

/** 행 선택 모드. */
export type RowSelectionMode = 'single' | 'multi' | 'none';

/** pagination 동작 모드 (convenience shorthand). */
export type PaginationMode = 'client' | 'server' | 'none';

/** 행 선택 옵션 — 프레임워크 무관 부분(렌더 콜백 제외). */
export interface HeadlessRowSelectionOptions<TData> {
  mode?: RowSelectionMode;
  onSelectionChange?: (rows: TData[]) => void;
  state?: RowSelectionState;
  onStateChange?: OnChangeFn<RowSelectionState>;
  selectAllPages?: boolean;
}

/** pagination 옵션 — buildPaginationOptions 가 읽는 부분집합. */
export interface HeadlessPaginationOptions {
  pageSize?: number;
  manual?: boolean;
  totalCount?: number;
  pageCount?: number;
  mode?: PaginationMode;
  onPaginationChange?: OnChangeFn<PaginationState>;
}

/**
 * `buildTableOptions` 가 읽는 GridProps 의 **구조적 부분집합**.
 * grid-core 의 React `GridProps<TData>` 가 이 인터페이스를 구조적으로 만족(assignable)한다.
 */
export interface TableOptionsInput<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  enableSort?: boolean;
  enableFilter?: boolean;
  enableMultiSort?: boolean;
  maxMultiSortColCount?: number;
  alwaysMultiSort?: boolean;
  sortDescFirst?: boolean;
  rowSelection?: RowSelectionMode | HeadlessRowSelectionOptions<TData>;
  pagination?: HeadlessPaginationOptions;
  enablePagination?: boolean;
  enableColumnPinning?: boolean;
  enableColumnResizing?: boolean;
  columnResizeMode?: TableOptions<TData>['columnResizeMode'];
  enableExpanding?: boolean;
  enableRowPinning?: boolean;
  manualSorting?: boolean;
  manualFiltering?: boolean;
  debug?: boolean;
  getRowId?: TableOptions<TData>['getRowId'];
  getSubRows?: TableOptions<TData>['getSubRows'];
  onSortingChange?: OnChangeFn<SortingState>;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  onColumnPinningChange?: OnChangeFn<ColumnPinningState>;
  onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

/** Grid(또는 어댑터)가 보유한 internal state 값 + setter. */
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

/** `buildTableOptions` 결과 — `useReactTable`/`useVueTable` 에 spread 가능. */
export interface BuildOptionsResult<TData> {
  options: Omit<TableOptions<TData>, 'data' | 'columns'>;
  effectiveColumns: ColumnDef<TData, unknown>[];
  selectionMode: RowSelectionMode;
  selectionOptions: HeadlessRowSelectionOptions<TData>;
}

/**
 * 프레임워크별 selection(체크박스) 컬럼 팩토리 — **주입**.
 * grid-core 는 React `createCheckboxColumn`, Vue 어댑터는 Vue 버전을 전달한다.
 * headless 는 selection 정규화 + 'mode≠none 시 prepend' 정책만 순수하게 담당.
 */
export type CreateSelectionColumn<TData> = (
  mode: 'single' | 'multi',
  selectAllPages: boolean,
) => ColumnDef<TData, unknown>;
