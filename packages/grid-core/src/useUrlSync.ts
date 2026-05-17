/**
 * @file useUrlSync — GridStateValues ↔ URL search params 동기화 hook (G-005, MOD-GRID-02).
 *
 * optional helper — `useGridState`와 독립 사용 가능.
 * router 라이브러리 의존 없음 (`window.history.replaceState` 직접 사용).
 *
 * @see G-005-spec.md Section 5.2
 */

import { useEffect, useRef } from 'react';
import type { GridStateValues, GridStateKey, UseUrlSyncOptions } from './types';
import { serializeGridState, deserializeGridState } from './internal/serializeState';
import { useDebouncedCallback } from './internal/useDebouncedCallback';

/** 전체 8개 GridStateKey (AC-002: keys 미지정 시 기본값) */
const ALL_KEYS: GridStateKey[] = [
  'sorting',
  'columnFilters',
  'rowSelection',
  'pagination',
  'columnPinning',
  'columnOrder',
  'columnSizing',
  'columnVisibility',
];

/**
 * `GridStateValues`의 임의 subset을 URL search params에 동기화하는 옵션 helper.
 *
 * - state 변경 시 `window.history.replaceState`로 URL 갱신 (AC-001, AC-002, AC-003)
 * - mount 시 URL → state 역방향 hydration (`onHydrate` 콜백 — AC-004)
 * - debounce 지원 (`debounceMs` 옵션 — G-003 `useDebouncedCallback` 재사용)
 * - router 라이브러리 의존 없음
 * - SSR safe (D3: `typeof window` 체크는 useEffect body 내부)
 *
 * @param state   - `useGridState()` 또는 기타 소스의 `GridStateValues`
 * @param options - `UseUrlSyncOptions` (전부 optional)
 *
 * @example
 * ```tsx
 * const state = useGridState();
 * useUrlSync(state, {
 *   keys: ['sorting', 'columnFilters'],
 *   onHydrate: (partial) => {
 *     if (partial.sorting) state.setSorting(partial.sorting);
 *     if (partial.columnFilters) state.setColumnFilters(partial.columnFilters);
 *   },
 * });
 * ```
 *
 * @see G-005-spec.md Section 2.2, Section 5.2
 */
export function useUrlSync<TData = unknown>(
  state: GridStateValues<TData>,
  options?: UseUrlSyncOptions<TData>,
): void {
  const keys = options?.keys ?? ALL_KEYS;
  const debounceMs = options?.debounceMs ?? 0;
  const prefix = options?.prefix ?? '';

  // C-32 option 2 (D5): onHydrate 콜백은 매 렌더 재생성 가능 (non-stable)
  // useRef로 최신 값 보존 → useEffect deps에서 제외 (eslint-disable 미사용)
  const hydrateRef = useRef(options?.onHydrate);
  useEffect(() => {
    hydrateRef.current = options?.onHydrate;
  }); // intentionally no deps — 매 렌더 최신 ref 동기화

  // AC-004: mount 시 URL search params → state hydration (1회)
  useEffect(() => {
    if (typeof window === 'undefined') return; // D3: SSR guard (useEffect body 내부)
    const params = new URLSearchParams(window.location.search);
    const partial = deserializeGridState(params, keys, prefix);
    if (Object.keys(partial).length > 0) {
      hydrateRef.current?.(partial as Partial<GridStateValues<TData>>);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only — keys/prefix는 mount 이후 변경 시나리오 미지원 (spec D2)

  // AC-001, AC-002, AC-003: state → URL sync (debounce 지원)
  const syncToUrl = useDebouncedCallback(() => {
    if (typeof window === 'undefined') return; // D3: SSR guard
    const next = serializeGridState(
      state as Partial<GridStateValues>,
      keys,
      prefix,
      new URLSearchParams(window.location.search),
    );
    window.history.replaceState({}, '', `?${next.toString()}`);
  }, debounceMs);

  // D4: 8개 state 개별 primitive를 deps에 나열 (state 객체 참조 의존 금지)
  // syncToUrl: useDebouncedCallback은 ms<=0 시 raw fn 반환 (not stable) → deps 제외 필요
  useEffect(() => {
    syncToUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.sorting,
    state.columnFilters,
    state.rowSelection,
    state.pagination,
    state.columnPinning,
    state.columnOrder,
    state.columnSizing,
    state.columnVisibility,
    // syncToUrl: ms<=0 → raw fn (unstable) → deps 제외. ms>0 → useCallback(,[ms]) stable 이나
    // 조건부 포함은 hooks 규칙 위반 → 일관성 위해 항상 제외 (spec Section 11 OQ-1 확인)
  ]);
}
