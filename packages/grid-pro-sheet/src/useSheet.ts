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
  /** MOD-GRID-32 G-3: 직전 셀 편집 취소(재계산 + re-render). */
  undo: () => void;
  /** MOD-GRID-32 G-3: 취소한 편집 재적용. */
  redo: () => void;
  /** 취소 가능 여부(현재 렌더 시점). */
  canUndo: boolean;
  /** 재적용 가능 여부. */
  canRedo: boolean;
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
  // undo/redo 는 값 변화가 없어도 cursor(canUndo/canRedo) 가 바뀌므로 명시적 bump 로 re-render 보장.
  const undo = useCallback(() => { sheet.undo(); bump((v) => v + 1); }, [sheet]);
  const redo = useCallback(() => { sheet.redo(); bump((v) => v + 1); }, [sheet]);

  return { setCell, getDisplay, getRaw, undo, redo, canUndo: sheet.canUndo(), canRedo: sheet.canRedo() };
}
