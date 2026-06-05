/**
 * Row-click selection math — pure, node-testable (MOD-GRID-35 G-1).
 *
 * ★ Computes the NEXT RowSelectionState from a click, given the modifier keys. Keeping this pure
 * (state in → state out, no table/DOM) lets the non-vacuous claims be proven in node: a plain click
 * REPLACES the selection with exactly the clicked row; ctrl/cmd+click TOGGLES it while keeping the
 * rest; shift+click selects the contiguous RANGE from the anchor to the clicked row; single-select
 * mode never holds more than one.
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
  /** shift held — range select from the anchor (G-2). */
  shift?: boolean;
  /** Range anchor (last plain/ctrl click). Range select is a no-op without it. */
  anchorId?: string | null;
  /** Row ids in current display order — defines the range span for shift. */
  orderedIds?: string[];
}

export interface RowClickResult {
  /** The next selection state. */
  selection: RowSelectionState;
  /** The new range anchor. shift PRESERVES the anchor (so a range can be re-extended); others set it to the clicked row. */
  anchorId: string;
}

/**
 * Resolve a row click into the next selection.
 *
 * - `single` mode → always just the clicked row.
 * - `multi` + shift (with an anchor) → select the contiguous range anchor…clicked, anchor preserved.
 * - `multi` + ctrl/cmd → toggle the clicked row, keep the others (additive).
 * - `multi`, no modifier → replace the selection with the clicked row only.
 */
export function computeRowClickSelection(input: RowClickInput): RowClickResult {
  const { current, clickedId, ctrl, mode, shift = false, anchorId = null, orderedIds = [] } = input;

  if (mode === 'single') {
    return { selection: { [clickedId]: true }, anchorId: clickedId };
  }

  if (shift && anchorId) {
    const a = orderedIds.indexOf(anchorId);
    const b = orderedIds.indexOf(clickedId);
    if (a !== -1 && b !== -1) {
      const [lo, hi] = a <= b ? [a, b] : [b, a];
      const selection: RowSelectionState = {};
      for (let i = lo; i <= hi; i++) selection[orderedIds[i]] = true;
      return { selection, anchorId }; // anchor stays — range can be re-extended by another shift-click
    }
  }

  if (ctrl) {
    const selection: RowSelectionState = { ...current };
    if (selection[clickedId]) delete selection[clickedId];
    else selection[clickedId] = true;
    return { selection, anchorId: clickedId };
  }

  return { selection: { [clickedId]: true }, anchorId: clickedId };
}
