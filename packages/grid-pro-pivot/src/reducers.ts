/**
 * @topgrid/grid-pro-pivot — pure value reducers (no React imports)
 * MOD-GRID-18 / G-2
 *
 * ADR-001: pivot implements its own pure numeric reducers over `number[]`.
 * grid-pro-agg does NOT expose pure reducers (it delegates built-ins to TanStack),
 * so this is new code, not duplication. We reuse only the *key vocabulary*
 * (`AggregationFnKey` + `BUILT_IN_AGGREGATION_KEYS`).
 *
 * Tree-shake split: kept in a separate module so a consumer using only
 * `usePivot` / `PivotGrid` does not need the React shell to drop, and vice versa
 * (mirrors grid-pro-agg's `aggregationFns.ts` split).
 *
 * Safety contract (C-003 / AC-2): non-finite inputs (NaN / ±Infinity) are
 * filtered first; an empty finite set yields `null` (never throws, never emits
 * ±Infinity from `Math.min`/`Math.max`).
 */

import {
  BUILT_IN_AGGREGATION_KEYS,
  type AggregationFnKey,
} from '@topgrid/grid-pro-agg';
import type { PivotValueReducer } from './types';

/** Keep only finite numbers (drops NaN / ±Infinity). */
function finite(values: number[]): number[] {
  return values.filter((v) => Number.isFinite(v));
}

/**
 * The built-in pure reducers, keyed by `AggregationFnKey`.
 *
 * Every reducer first filters non-finite values; an empty finite set returns
 * `null` (callers map this straight to a `null` cell value).
 */
export const BUILT_IN_REDUCERS: Readonly<
  Record<AggregationFnKey, (values: number[]) => number | null>
> = {
  sum: (values) => {
    const f = finite(values);
    if (f.length === 0) return null;
    return f.reduce((a, b) => a + b, 0);
  },
  avg: (values) => {
    const f = finite(values);
    if (f.length === 0) return null;
    return f.reduce((a, b) => a + b, 0) / f.length;
  },
  min: (values) => {
    const f = finite(values);
    if (f.length === 0) return null;
    return Math.min(...f);
  },
  max: (values) => {
    const f = finite(values);
    if (f.length === 0) return null;
    return Math.max(...f);
  },
  count: (values) => {
    const f = finite(values);
    if (f.length === 0) return null;
    return f.length;
  },
};

/**
 * Runtime guard: is `key` one of the built-in aggregation keys?
 *
 * Derives membership from `BUILT_IN_AGGREGATION_KEYS` (the shared vocabulary) —
 * never hardcodes the set or its size (C-003).
 */
export function isBuiltInAggregationKey(
  key: string,
): key is AggregationFnKey {
  return (BUILT_IN_AGGREGATION_KEYS as readonly string[]).includes(key);
}

/**
 * Apply a pivot value reducer (built-in key OR custom `(number[]) => number`)
 * to a set of values.
 *
 * @param reducer - An `AggregationFnKey` or a custom `PivotValueReducer`.
 * @param values - Raw numeric values (may contain non-finite entries).
 * @returns The aggregated number, or `null` for an empty finite set.
 *
 * @remarks
 * Custom reducers receive the *finite-filtered* values for consistency with the
 * built-ins; an empty finite set short-circuits to `null` so custom reducers are
 * never invoked with `[]` (avoids `0/0 = NaN` foot-guns like a naive average).
 */
export function applyReducer(
  reducer: AggregationFnKey | PivotValueReducer,
  values: number[],
): number | null {
  if (typeof reducer === 'function') {
    const f = finite(values);
    if (f.length === 0) return null;
    const result = reducer(f);
    return Number.isFinite(result) ? result : null;
  }
  return BUILT_IN_REDUCERS[reducer](values);
}
