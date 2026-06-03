/**
 * `useSheet` — thin React wrapper over the node-verified {@link createSheet} engine (MOD-GRID-26
 * G-3). Owns the sheet instance + a version counter that re-renders on any recompute. All logic
 * lives in the engine; this hook only bridges it to React.
 */

import { useRef, useState, useCallback } from 'react';
import { createSheet, type Sheet } from './internal/sheetEngine.js';

export interface UseSheetResult {
  /** Set a cell's raw input (`=A1+A2` or a literal) — triggers recalc + re-render. */
  setCell: (ref: string, raw: string) => void;
  /** Display string for a cell (computed value; errors → code). */
  getDisplay: (ref: string) => string;
  /** Raw input of a cell (the formula text, for editing). */
  getRaw: (ref: string) => string;
}

export function useSheet(): UseSheetResult {
  const sheetRef = useRef<Sheet | null>(null);
  const [, bump] = useState(0);
  if (sheetRef.current === null) {
    sheetRef.current = createSheet(() => bump((v) => v + 1));
  }
  const sheet = sheetRef.current;

  const setCell = useCallback((ref: string, raw: string) => sheet.setCell(ref, raw), [sheet]);
  const getDisplay = useCallback((ref: string) => sheet.getDisplay(ref), [sheet]);
  const getRaw = useCallback((ref: string) => sheet.getRaw(ref), [sheet]);

  return { setCell, getDisplay, getRaw };
}
