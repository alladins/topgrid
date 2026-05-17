/**
 * @tomis/grid-pro-agg — type definitions
 * MOD-GRID-15 / G-001 aggregation scaffold
 * MOD-GRID-15 / G-002 group footer + expand/collapse
 * MOD-GRID-15 / G-003 custom aggregation registry
 * MOD-GRID-15 / G-004 GroupPanel + group-level sorting
 */

import type { Cell, Column, ColumnDef, ExpandedState, OnChangeFn, Row, SortingState } from '@tanstack/react-table';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Public aggregation function key union (user-facing)
// 'avg' is mapped to TanStack's internal 'mean' via resolveAggregationFn().
// ---------------------------------------------------------------------------

/** User-facing aggregation function identifier. */
export type AggregationFnKey = 'sum' | 'avg' | 'min' | 'max' | 'count';

// ---------------------------------------------------------------------------
// Column-level meta extension
// ---------------------------------------------------------------------------

/**
 * Extend TanStack column meta to carry aggregation configuration.
 * Follows the open meta pattern (`[key: string]: unknown`) to stay compatible
 * with arbitrary user meta.
 */
export interface AggregationColumnMeta {
  /**
   * 집계 함수 식별자.
   * - 내장 5종: 'sum' | 'avg' | 'min' | 'max' | 'count' (자동완성 지원)
   * - 사용자 정의: registerAggregationFn으로 등록한 임의 문자열
   *
   * (string & {}) 패턴: 내장 키 자동완성 유지 + 임의 문자열 허용 (C-4).
   */
  aggregationFn?: AggregationFnKey | (string & {});
  [key: string]: unknown;
}

/**
 * Column definition used with `AggregationGrid`.
 * Identical to `ColumnDef<TData>` but with typed `meta`.
 */
export type AggregationColumnDef<TData extends object> = ColumnDef<TData> & {
  meta?: AggregationColumnMeta;
};

// ---------------------------------------------------------------------------
// G-002: GroupRow component props (Section 2.1)
// ---------------------------------------------------------------------------

/**
 * Props for the internal `GroupRow` component.
 * Renders a grouped header row with expand/collapse toggle.
 *
 * @typeParam TData - Shape of each row data object.
 */
export interface GroupRowProps<TData extends object> {
  /** Group row Row object (row.getIsGrouped() === true guaranteed). */
  row: Row<TData>;
  /** Column count for colspan calculation. */
  columnCount: number;
  /** Indent unit (default: 4) — Tailwind pl-{depth * indentUnit}. */
  indentUnit?: number;
  /** Additional Tailwind className for the group row tr. */
  className?: string;
  /** Custom renderer — if provided, replaces default render (group key + count + toggle icon). */
  renderGroupRow?: (row: Row<TData>) => ReactNode;
}

// ---------------------------------------------------------------------------
// G-002: FooterRow component props (Section 2.2)
// ---------------------------------------------------------------------------

/**
 * Props for the internal `FooterRow` component.
 * Renders a synthetic footer row after each group's leaf rows.
 *
 * @typeParam TData - Shape of each row data object.
 */
export interface FooterRowProps<TData extends object> {
  /** Group row Row object (aggregated cells accessed via cells prop). */
  row: Row<TData>;
  /** Visible cells list (pass row.getVisibleCells()). */
  cells: Cell<TData, unknown>[];
  /** Additional Tailwind className for the footer row tr. */
  className?: string;
  /** Custom footer cell renderer. */
  renderFooterRow?: (row: Row<TData>, cells: Cell<TData, unknown>[]) => ReactNode;
}

// ---------------------------------------------------------------------------
// Component props
// ---------------------------------------------------------------------------

/**
 * Props for the `AggregationGrid` standalone Pro component.
 *
 * @typeParam TData - Shape of each row data object.
 */
export interface AggregationGridProps<TData extends object> {
  // --- G-001 existing props (preserved) ---

  /** Row data array. */
  data: TData[];

  /** Column definitions (with optional `meta.aggregationFn`). */
  columns: AggregationColumnDef<TData>[];

  /**
   * When `true`, enables `getGroupedRowModel()` and `getExpandedRowModel()`.
   * @default false
   */
  enableAggregation?: boolean;

  /**
   * Column ids to group by (order matters).
   * Only applied when `enableAggregation` is `true`.
   * @default []
   */
  grouping?: string[];

  /**
   * Initial expanded state passed to TanStack Table.
   * `false` is normalised to `{}` (TanStack's `ExpandedState` does not include `false`).
   * Pass `true` to expand all groups.
   * @default {}
   */
  expanded?: ExpandedState | false;

  // --- G-002 new props (Section 2.3) ---

  /**
   * Whether to show a synthetic footer row after each group's leaf rows.
   * Footer row is only rendered when the group is expanded.
   * @default true
   */
  showFooter?: boolean;

  /** Additional Tailwind className for group header rows. */
  groupRowClassName?: string;

  /** Additional Tailwind className for footer rows. */
  footerRowClassName?: string;

  /** Custom group header row renderer. */
  renderGroupRow?: (row: Row<TData>) => ReactNode;

  /** Custom footer row renderer. */
  renderFooterRow?: (row: Row<TData>, cells: Cell<TData, unknown>[]) => ReactNode;

  /**
   * Enable row virtualization via `@tanstack/react-virtual`.
   * Requires `@tanstack/react-virtual` to be installed as a peer dependency.
   * @default false
   */
  enableVirtualization?: boolean;

  /**
   * Estimated row height in pixels (used by virtualizer).
   * @default 40
   */
  estimatedRowHeight?: number;

  /**
   * Number of overscan rows for virtualization.
   * @default 5
   */
  virtualOverscan?: number;

  /**
   * Callback fired when grouping state changes.
   * Enables externally controlled grouping.
   */
  onGroupingChange?: (grouping: string[]) => void;

  /**
   * Callback fired when expanded state changes.
   * Enables externally controlled expand/collapse.
   */
  onExpandedChange?: (expanded: ExpandedState) => void;

  // --- G-004 new props (Section 2.2) ---

  /**
   * Whether to show the GroupPanel drag-and-drop grouping bar above the grid.
   * @default false
   */
  showGroupPanel?: boolean;

  /** Additional Tailwind className for the GroupPanel container. */
  groupPanelClassName?: string;

  /** Additional Tailwind className for each group chip in GroupPanel. */
  groupChipClassName?: string;

  /** Placeholder text shown in GroupPanel when no columns are grouped. */
  emptyGroupPanelText?: string;

  /**
   * When `true`, enables `getSortedRowModel()` and makes group header `<th>` cells
   * clickable for column-level sorting.
   * @default false
   */
  enableGroupSort?: boolean;

  /**
   * Controlled sorting state (TanStack SortingState).
   * When provided, `onSortingChange` must also be provided (EC-007).
   */
  sorting?: SortingState;

  /**
   * Callback fired when sorting state changes.
   * Required when `sorting` is provided (controlled mode).
   */
  onSortingChange?: OnChangeFn<SortingState>;
}

// ---------------------------------------------------------------------------
// G-004: GroupPanel component props (Section 2.1)
// ---------------------------------------------------------------------------

/**
 * Props for the `GroupPanel` component.
 * Renders a drag-and-drop grouping bar above the grid.
 *
 * @typeParam TData - Shape of each row data object.
 */
export interface GroupPanelProps<TData> {
  /** Current grouping column id list (order matters). */
  grouping: string[];
  /** All visible columns (used to resolve column labels). */
  columns: Column<TData, unknown>[];
  /** Callback fired when the grouping list changes. */
  onGroupingChange: (grouping: string[]) => void;
  /** Additional Tailwind className for the panel container. */
  className?: string;
  /** Additional Tailwind className for each chip. */
  chipClassName?: string;
  /** Placeholder text shown when no columns are grouped. */
  emptyText?: string;
}
