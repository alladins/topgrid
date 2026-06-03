/**
 * Built-in spreadsheet functions (MOD-GRID-26 G-1) — **error-aware**, local implementation.
 *
 * ADR-002 (ADR-001 N=2 re-read): the pivot's `BUILT_IN_REDUCERS` take clean `number[]` and return
 * null-on-empty (a pivot display choice). Sheet functions take **error-aware** `CellValue[]`,
 * propagate errors, and have sheet semantics (SUM([])=0, AVERAGE([])=#DIV/0!). Different input
 * contract → not the same function; reuse would be the forced "억지 재사용" ADR-001 rejects.
 *
 * PoC semantics: any error argument propagates (returns the first error). Numbers aggregate;
 * non-numeric values (strings/booleans/empty cells) are ignored, as in Excel range aggregation.
 */

import { cellError, isCellError, type CellValue, type CellError } from '../types.js';

/** Collect finite numbers from values; returns the first {@link CellError} encountered instead. */
function collectNumbers(values: CellValue[]): CellError | number[] {
  const nums: number[] = [];
  for (const v of values) {
    if (isCellError(v)) return v;
    if (typeof v === 'number' && Number.isFinite(v)) nums.push(v);
    // strings / booleans / empty / non-finite → ignored (Excel range behavior)
  }
  return nums;
}

export const FUNCTIONS: Readonly<Record<string, (values: CellValue[]) => CellValue>> = {
  SUM: (values) => {
    const n = collectNumbers(values);
    if (isCellError(n)) return n;
    return n.reduce((a, b) => a + b, 0);
  },
  AVERAGE: (values) => {
    const n = collectNumbers(values);
    if (isCellError(n)) return n;
    if (n.length === 0) return cellError('#DIV/0!');
    return n.reduce((a, b) => a + b, 0) / n.length;
  },
  MIN: (values) => {
    const n = collectNumbers(values);
    if (isCellError(n)) return n;
    return n.length === 0 ? 0 : Math.min(...n);
  },
  MAX: (values) => {
    const n = collectNumbers(values);
    if (isCellError(n)) return n;
    return n.length === 0 ? 0 : Math.max(...n);
  },
  COUNT: (values) => {
    const n = collectNumbers(values);
    if (isCellError(n)) return n;
    return n.length;
  },
};
