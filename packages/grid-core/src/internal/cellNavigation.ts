/**
 * Pure grid cell keyboard-navigation core (MOD-GRID-28 G-2) — node-verified.
 *
 * Fresh MIT implementation: grid-pro-range's `useKeyboardNav` is Pro-coupled (range-selection
 * anchor/extend) and lacks Home/End/PageUp/PageDown — extracting it would force changes to a
 * shipped Pro package, so we build a minimal MIT core here and accept the small duplication
 * (LESS-005). The Pro range package keeps its range-extension nav on top.
 *
 * ★ Spine: coordinates are **absolute** (full-grid `rowCount`/`colCount`), never DOM-windowed —
 * so navigating past the visible window's edge yields the next *absolute* cell (which the hook
 * scrolls into view), and the active cell survives virtualization. This pairs with the
 * `aria-activedescendant` focus model (not roving tabindex): real focus stays on the stable grid
 * container, so the active cell unmounting on scroll cannot collapse focus to `<body>`.
 */

export interface NavBounds {
  /** Total data rows (full grid, not the window). */
  rowCount: number;
  /** Total visual columns (full grid). */
  colCount: number;
  /** Rows to jump for PageUp/PageDown (≈ visible row count). */
  pageSize: number;
}

export interface NavMods {
  ctrl: boolean;
  shift: boolean;
}

export interface CellPos {
  row: number;
  col: number;
}

const clamp = (v: number, max: number): number => Math.max(0, Math.min(v, max));

/**
 * Compute the next active cell for a navigation key, or `null` if `key` isn't a nav key.
 * All results are absolute and clamped to grid bounds (not to the rendered window).
 */
export function nextCell(
  current: CellPos,
  key: string,
  mods: NavMods,
  bounds: NavBounds,
): CellPos | null {
  const lastRow = bounds.rowCount - 1;
  const lastCol = bounds.colCount - 1;
  if (lastRow < 0 || lastCol < 0) return null;
  const r = clamp(current.row, lastRow);
  const c = clamp(current.col, lastCol);

  switch (key) {
    case 'ArrowUp':
      return mods.ctrl ? { row: 0, col: c } : { row: clamp(r - 1, lastRow), col: c };
    case 'ArrowDown':
      return mods.ctrl ? { row: lastRow, col: c } : { row: clamp(r + 1, lastRow), col: c };
    case 'ArrowLeft':
      return mods.ctrl ? { row: r, col: 0 } : { row: r, col: clamp(c - 1, lastCol) };
    case 'ArrowRight':
      return mods.ctrl ? { row: r, col: lastCol } : { row: r, col: clamp(c + 1, lastCol) };
    case 'Home':
      return mods.ctrl ? { row: 0, col: 0 } : { row: r, col: 0 };
    case 'End':
      return mods.ctrl ? { row: lastRow, col: lastCol } : { row: r, col: lastCol };
    case 'PageUp':
      return { row: clamp(r - bounds.pageSize, lastRow), col: c };
    case 'PageDown':
      return { row: clamp(r + bounds.pageSize, lastRow), col: c };
    case 'Enter':
      return { row: clamp(r + 1, lastRow), col: c };
    case 'Tab': {
      if (mods.shift) {
        if (c > 0) return { row: r, col: c - 1 };
        if (r > 0) return { row: r - 1, col: lastCol }; // wrap to prev row end
        return { row: r, col: c }; // at first cell — stay
      }
      if (c < lastCol) return { row: r, col: c + 1 };
      if (r < lastRow) return { row: r + 1, col: 0 }; // wrap to next row start
      return { row: r, col: c }; // at last cell — stay
    }
    default:
      return null;
  }
}

/** True if `key` is one of the navigation keys handled by {@link nextCell}. */
export function isNavKey(key: string): boolean {
  return (
    key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight' ||
    key === 'Home' || key === 'End' || key === 'PageUp' || key === 'PageDown' ||
    key === 'Enter' || key === 'Tab'
  );
}
