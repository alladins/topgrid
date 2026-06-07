/**
 * MOD-GRID-63 — pure per-cell style → CSSProperties map (no React state, deterministic).
 *
 * Maps a {@link SheetCellStyle} spec to inline CSS that SheetGrid merges onto a cell's `<td>`.
 * Only set properties are emitted (unset → omitted, so the cell's base style shows through).
 */
import type { CSSProperties } from 'react';

/** Per-cell visual style spec. */
export interface SheetCellStyle {
  bold?: boolean;
  italic?: boolean;
  /** Text color (CSS color). */
  color?: string;
  /** Fill / background color (CSS color). */
  background?: string;
  /** Horizontal text alignment. */
  align?: 'left' | 'center' | 'right';
  /** When true, draws a 1px solid border (overriding the base). */
  border?: boolean;
}

/** Map a {@link SheetCellStyle} to inline CSS (only set props emitted). */
export function sheetStyleToCss(style: SheetCellStyle): CSSProperties {
  const css: CSSProperties = {};
  if (style.bold === true) css.fontWeight = 'bold';
  if (style.italic === true) css.fontStyle = 'italic';
  if (style.color !== undefined) css.color = style.color;
  if (style.background !== undefined) css.background = style.background;
  if (style.align !== undefined) css.textAlign = style.align;
  if (style.border === true) css.border = '1px solid #94a3b8';
  return css;
}
