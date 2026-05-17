/**
 * `useContextMenu` — Pure state hook for context menu open/close/position.
 *
 * G-002 (MOD-GRID-16): Manages right-click context menu state for
 * `<ContextMenuGrid>`. No DOM side-effects; all event wiring lives
 * in the consumer (C-32: pure helper + React shell separation).
 *
 * @see G-002-spec.md Section 5.3 / Section 8 Phase 1
 */

import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import type { Cell } from '@tanstack/react-table';

/**
 * Return type of `useContextMenu`.
 *
 * @typeParam TData - Row data type.
 */
export interface UseContextMenuReturn<TData> {
  /** Whether the context menu is currently open. */
  isOpen: boolean;
  /** Viewport-absolute pixel position of the menu top-left corner. */
  position: { x: number; y: number };
  /** The data row that was right-clicked (`row.original`). `null` when closed. */
  targetRow: TData | null;
  /** The TanStack cell that was right-clicked. `null` when closed. */
  targetCell: Cell<TData, unknown> | null;
  /**
   * Open the menu at the given coordinates with the given row/cell context.
   * Replaces any previously open menu (only one menu at a time).
   */
  openAt: (x: number, y: number, row: TData, cell: Cell<TData, unknown>) => void;
  /** Close the menu and reset all transient state. */
  close: () => void;
  /**
   * Index of the keyboard-focused menu item (-1 = none focused).
   * Used by `ContextMenuPortal` to highlight the focused item.
   */
  focusedIndex: number;
  /** Setter for `focusedIndex` — forwarded to portal for arrow-key navigation (G-004+). */
  setFocusedIndex: Dispatch<SetStateAction<number>>;
}

/**
 * State hook for context menu lifecycle.
 *
 * Manages `isOpen`, `position`, `targetRow`, `targetCell`, and `focusedIndex`.
 * Provides stable `openAt` and `close` callbacks (useCallback, deps=[]).
 *
 * @typeParam TData - Row data type.
 * @returns `UseContextMenuReturn<TData>`
 *
 * @example
 * ```ts
 * const { isOpen, position, targetRow, targetCell, openAt, close, focusedIndex, setFocusedIndex } =
 *   useContextMenu<User>();
 * ```
 */
export function useContextMenu<TData>(): UseContextMenuReturn<TData> {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [targetRow, setTargetRow] = useState<TData | null>(null);
  const [targetCell, setTargetCell] = useState<Cell<TData, unknown> | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const openAt = useCallback(
    (x: number, y: number, row: TData, cell: Cell<TData, unknown>) => {
      setPosition({ x, y });
      setTargetRow(row);
      setTargetCell(cell);
      setFocusedIndex(-1);
      setIsOpen(true);
    },
    [],
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setTargetRow(null);
    setTargetCell(null);
    setFocusedIndex(-1);
  }, []);

  return {
    isOpen,
    position,
    targetRow,
    targetCell,
    openAt,
    close,
    focusedIndex,
    setFocusedIndex,
  };
}
