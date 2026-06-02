// @topgrid/grid-sizing — G-3: browser canvas text measurer (host capability).
//
// The ONLY DOM touch in this package, and it is a non-mutating READ
// (`canvas.measureText`). SSR-guarded: when `document` or a 2D context is
// absent (node/SSR), a pure character-count estimator is returned instead — it
// never throws. The canvas is created lazily inside the factory (when the host
// calls it), never at module load.

import type { MeasureText } from './autoSize';

/**
 * Approximate average glyph width (px) used by the SSR/node fallback estimator
 * when canvas measurement is unavailable. Chosen as 8 to match the spec's
 * verification mock `(t) => t.length * 8`, giving deterministic, test-aligned
 * widths in non-browser environments.
 */
export const approxCharPx = 8;

/** Fallback estimator: pure, no DOM. Width ≈ character count × {@link approxCharPx}. */
function estimateTextWidth(text: string): number {
  return text.length * approxCharPx;
}

/**
 * Create a {@link MeasureText} backed by the browser canvas 2D API.
 *
 * In a browser, returns a measurer using
 * `document.createElement('canvas').getContext('2d').measureText(text).width`,
 * applying the optional CSS `font` shorthand per call. In node/SSR (no
 * `document`, or no 2D context), returns the {@link estimateTextWidth} fallback.
 * Never throws.
 */
export function createCanvasMeasureText(): MeasureText {
  if (typeof document === 'undefined') {
    return (text: string) => estimateTextWidth(text);
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx === null) {
    return (text: string) => estimateTextWidth(text);
  }

  return (text: string, font?: string) => {
    if (font !== undefined) ctx.font = font;
    return ctx.measureText(text).width;
  };
}
