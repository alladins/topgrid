/**
 * @topgrid/grid-pro-agg — pure aggregation helpers (no React imports)
 * MOD-GRID-15 / G-001
 * MOD-GRID-15 / G-003 — aggregationFns registry + registerAggregationFn / getAggregationFn
 *
 * C-32: Pure Helpers are kept in a separate module so tree-shakers can
 * eliminate them independently of the React component shell.
 */

import type { AggregationFn } from '@tanstack/react-table';
import type { AggregationFnKey } from './types';

// ---------------------------------------------------------------------------
// Internal TanStack aggregation key type
// ---------------------------------------------------------------------------

/**
 * Aggregation function keys that TanStack Table v8 accepts natively.
 * 'mean' is TanStack's internal name; our public API exposes 'avg'.
 */
export type TanStackAggKey = 'sum' | 'mean' | 'min' | 'max' | 'count';

// ---------------------------------------------------------------------------
// G-003: module-level registry (AC-002)
// ---------------------------------------------------------------------------

const aggregationFnsRegistry = new Map<string, AggregationFn<unknown>>();

// ---------------------------------------------------------------------------
// G-003: Built-in keys constant (AC-003)
// ---------------------------------------------------------------------------

/**
 * The 5 built-in aggregation function keys supported by AggregationGrid.
 * Use this for runtime guards and autocomplete hints.
 */
export const BUILT_IN_AGGREGATION_KEYS: ReadonlyArray<AggregationFnKey> =
  ['sum', 'avg', 'min', 'max', 'count'] as const;

// ---------------------------------------------------------------------------
// G-003: Register API (AC-001, D6: overwrite + console.warn on duplicate)
// ---------------------------------------------------------------------------

/**
 * 사용자 정의 집계 함수를 module-level registry에 등록한다.
 *
 * - TanStack AggregationFn<TData> 표준 시그니처 그대로 사용 (C-2).
 * - strict TypeScript, no any (C-4).
 * - 이미 등록된 이름: overwrite + console.warn (D6 — no throw).
 * - 한 패키지 라이선스 verifyOrWarn 1회 원칙 — 이 함수는 별도 호출 없음 (D5).
 *
 * @example
 * registerAggregationFn('weightedAvg', (columnId, leafRows) => {
 *   const totalWeight = leafRows.reduce((s, r) => s + (r.getValue('weight') as number), 0);
 *   const totalVal = leafRows.reduce(
 *     (s, r) => s + (r.getValue(columnId) as number) * (r.getValue('weight') as number), 0
 *   );
 *   return totalWeight === 0 ? 0 : totalVal / totalWeight;
 * });
 */
export function registerAggregationFn<TData extends object>(
  name: string,
  fn: AggregationFn<TData>,
): void {
  if (aggregationFnsRegistry.has(name)) {
    console.warn(
      `[grid-pro-agg] registerAggregationFn: overwriting existing fn for key "${name}"`,
    );
  }
  aggregationFnsRegistry.set(name, fn as AggregationFn<unknown>);
}

// ---------------------------------------------------------------------------
// G-003: Lookup API (AC-002, D3)
// ---------------------------------------------------------------------------

/**
 * 이름으로 registry에서 사용자 정의 집계 함수를 조회한다.
 * 내장 5종은 별도 registry 조회가 필요 없으므로 이 함수는 사용자 정의 fn 전용.
 *
 * @returns 등록된 AggregationFn<TData> 또는 undefined (미등록).
 */
export function getAggregationFn<TData extends object>(
  name: string,
): AggregationFn<TData> | undefined {
  return aggregationFnsRegistry.get(name) as AggregationFn<TData> | undefined;
}

// ---------------------------------------------------------------------------
// Resolver (G-001 — preserved, D3: ADR-MOD-GRID-15-003 보존)
// ---------------------------------------------------------------------------

/**
 * Maps a user-facing `AggregationFnKey` to the TanStack-internal string key.
 *
 * Spec D5: 'avg' → 'mean' (TanStack built-in name).
 * All other keys pass through unchanged.
 *
 * Returning the string key (not a function reference) allows TanStack to
 * perform its own registry lookup via `aggregationFns[key]`, which is safer
 * than importing the registry object directly.
 *
 * @param key - User-facing aggregation key.
 * @returns TanStack-internal aggregation key string.
 */
export function resolveAggregationFn(key: AggregationFnKey): TanStackAggKey {
  return key === 'avg' ? 'mean' : key;
}
