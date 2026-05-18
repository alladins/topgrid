/**
 * @topgrid/grid-pro-master — Public type definitions for Master-Detail and Context Menu grids.
 *
 * G-001 (MOD-GRID-16): `<MasterDetailGrid>` wrapper enabling Master-Detail row
 * expansion with `renderDetailRow` prop and controlled/uncontrolled expanded state.
 *
 * G-002 (MOD-GRID-16): `<ContextMenuGrid>` wrapper enabling right-click context menu
 * with `contextMenuItems` prop and keyboard shortcut support.
 *
 * @see G-001-spec.md Section 4.1
 * @see G-002-spec.md Section 4
 */

import type { Cell, Row } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import type { GridProps } from '@topgrid/grid-core';

/**
 * Master-Detail expansion options.
 *
 * @typeParam TData - Row data type.
 *
 * @example Controlled mode
 * ```tsx
 * <MasterDetailGrid
 *   data={rows}
 *   columns={columns}
 *   renderDetailRow={(row) => <DetailPanel data={row.original} />}
 *   masterDetail={{
 *     expandedRowKeys: expandedKeys,
 *     onExpandChange: setExpandedKeys,
 *   }}
 * />
 * ```
 */
export interface MasterDetailOptions<_TData> {
  /**
   * Controlled expanded row key array.
   * When provided, the component is in controlled mode — expanded state is
   * driven externally. Keys correspond to TanStack `row.id` values.
   *
   * When absent, internal `useState<ExpandedState>` manages state (uncontrolled).
   */
  expandedRowKeys?: string[];

  /**
   * Callback fired when expanded rows change.
   * In controlled mode, the parent must update `expandedRowKeys` from this callback.
   *
   * @param expandedKeys - Array of currently expanded `row.id` strings.
   */
  onExpandChange?: (expandedKeys: string[]) => void;
}

/**
 * Render function type for the Master-Detail detail row content.
 *
 * @typeParam TData - Row data type.
 *
 * @param row - The TanStack `Row<TData>` object for the expanded master row.
 * @returns ReactNode to render inside the detail row cell.
 *
 * @example
 * ```tsx
 * const renderDetailRow: RenderDetailRow<User> = (row) => (
 *   <UserDetailPanel userId={row.original.id} />
 * );
 * ```
 */
export type RenderDetailRow<TData> = (row: Row<TData>) => ReactNode;

/**
 * Props for `<MasterDetailGrid>`.
 *
 * Extends `GridProps<TData>` with Master-Detail specific props.
 *
 * @typeParam TData - Row data type.
 *
 * @see MasterDetailOptions
 * @see RenderDetailRow
 * @see G-001-spec.md Section 4.2
 */
export interface MasterDetailGridProps<TData> extends GridProps<TData> {
  /**
   * Detail row render function.
   *
   * When provided, each row gains an expand toggle in the first column.
   * Clicking the toggle reveals a full-width detail row rendered by this function.
   *
   * When absent, the grid renders as a standard flat grid without expand toggles.
   */
  renderDetailRow?: RenderDetailRow<TData>;

  /**
   * Master-Detail expansion options (controlled/uncontrolled state).
   *
   * @see MasterDetailOptions
   */
  masterDetail?: MasterDetailOptions<TData>;
}

// ─── G-002: Context Menu ────────────────────────────────────────────────────

/**
 * A single context menu item definition.
 *
 * @typeParam TData - Row data type.
 *
 * @example
 * ```tsx
 * const items: ContextMenuItem<User>[] = [
 *   {
 *     label: '수정',
 *     shortcut: 'E',
 *     onClick: (row, cell, event) => openEditDialog(row),
 *   },
 *   { separator: true, label: '', onClick: () => {} },
 *   {
 *     label: '삭제',
 *     shortcut: 'Delete',
 *     disabled: (row) => row.locked,
 *     onClick: (row, cell, event) => deleteRow(row),
 *   },
 * ];
 * ```
 *
 * @see G-002-spec.md Section 4.1
 */
export interface ContextMenuItem<TData> {
  /**
   * Display label for the menu item.
   * For separator items, the label is ignored — pass an empty string.
   */
  label: string;

  /**
   * Optional keyboard shortcut hint displayed on the right side of the label.
   * When the wrapper div has focus and this key is pressed while the menu is open,
   * the item's `onClick` is triggered (if not disabled).
   *
   * Value is a single key string matched against `event.key` (case-insensitive).
   *
   * @example `'E'` for the 'e' key, `'Delete'` for the Delete key
   */
  shortcut?: string;

  /**
   * Whether this item is disabled.
   *
   * - `boolean`: static disabled state.
   * - `(row: TData) => boolean`: evaluated at render time against the target row.
   *
   * Disabled items are rendered but not clickable (pointer-events: none equivalent).
   */
  disabled?: boolean | ((row: TData) => boolean);

  /**
   * When `true`, renders a horizontal separator line.
   * All other properties except `label` are ignored for separator items.
   */
  separator?: boolean;

  /**
   * Click handler for this menu item.
   *
   * @param row   - The `original` data of the right-clicked row.
   * @param cell  - The TanStack `Cell<TData, unknown>` that was right-clicked.
   * @param event - The original `MouseEvent`.
   */
  onClick: (row: TData, cell: Cell<TData, unknown>, event: MouseEvent) => void;
}

/**
 * Props for `<ContextMenuGrid>`.
 *
 * Extends `GridProps<TData>` with context menu specific props.
 *
 * @typeParam TData - Row data type.
 *
 * @see ContextMenuItem
 * @see G-002-spec.md Section 4.2
 */
export interface ContextMenuGridProps<TData> extends GridProps<TData> {
  /**
   * Array of context menu items displayed on right-click.
   *
   * When absent (or empty), right-click falls through to the browser default.
   * When provided, `preventDefault()` is called and the custom menu is shown.
   *
   * @see ContextMenuItem
   */
  contextMenuItems?: ContextMenuItem<TData>[];
}

// ─── G-003: Row Pinning base types (F-16-06 P1 — types only, D20) ─────────────

/**
 * Row Pinning base type definition (F-16-06).
 *
 * Defines `pinTop` / `pinBottom` row id arrays for future TanStack row pinning UI.
 * **Types-only in this Goal** (D20 / AC-006) — full UI implementation is a separate
 * follow-up Goal. Pass these values to a future `RowPinningGrid` component.
 *
 * @example
 * ```tsx
 * const pinning: RowPinningOptions = {
 *   pinTop: ['row-0', 'row-1'],
 *   pinBottom: ['row-99'],
 * };
 * ```
 *
 * @see G-003-spec.md Section 2.3 + D6
 * @see MOD-GRID-16-decisions.md D20
 */
export interface RowPinningOptions {
  /**
   * Row ids to pin at the top of the grid.
   * Keys correspond to TanStack `row.id` values.
   *
   * @see AC-006 — UI implementation deferred to a separate Goal.
   */
  pinTop?: string[];
  /**
   * Row ids to pin at the bottom of the grid.
   * Keys correspond to TanStack `row.id` values.
   *
   * @see AC-006 — UI implementation deferred to a separate Goal.
   */
  pinBottom?: string[];
}
