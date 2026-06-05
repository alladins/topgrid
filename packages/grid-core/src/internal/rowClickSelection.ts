/**
 * Row-click selection math — pure, node-testable (MOD-GRID-35 G-1).
 *
 * ★ Computes the NEXT RowSelectionState from a click, given the modifier keys. Keeping this pure
 * (state in → state out, no table/DOM) lets the non-vacuous claims be proven in node: a plain click
 * REPLACES the selection with exactly the clicked row; ctrl/cmd+click TOGGLES it while keeping the
 * rest; single-select mode never holds more than one. Shift-range is added in G-2.
 *
 * Drives the existing TanStack `RowSelectionState` (`{ [rowId]: true }`) — NOT a parallel selection
 * store — so checkbox selection, the status-bar counts, and click selection stay one source.
 */

import type { RowSelectionState } from '@tanstack/react-table';

export interface RowClickInput {
  /** Current selection (`{ rowId: true }`). */
  current: RowSelectionState;
  /** Row id that was clicked. */
  clickedId: string;
  /** ctrl (or cmd/meta) held — additive toggle. */
  ctrl: boolean;
  /** Selection mode. `'single'` never keeps more than the clicked row. */
  mode: 'single' | 'multi';
}

export interface RowClickResult {
  /** The next selection state. */
  selection: RowSelectionState;
  /** The new range anchor (the clicked row) — consumed by shift-range in G-2. */
  anchorId: string;
}

/**
 * Resolve a row click into the next selection.
 *
 * - `single` mode → always just the clicked row.
 * - `multi` + ctrl/cmd → toggle the clicked row, keep the others (additive).
 * - `multi`, no modifier → replace the selection with the clicked row only.
 */
export function computeRowClickSelection(input: RowClickInput): RowClickResult {
  const { current, clickedId, ctrl, mode } = input;

  if (mode === 'single') {
    return { selection: { [clickedId]: true }, anchorId: clickedId };
  }

  if (ctrl) {
    const selection: RowSelectionState = { ...current };
    if (selection[clickedId]) delete selection[clickedId];
    else selection[clickedId] = true;
    return { selection, anchorId: clickedId };
  }

  return { selection: { [clickedId]: true }, anchorId: clickedId };
}
