/**
 * @file useStoragePersist — GridStateValues ↔ localStorage/sessionStorage 동기화 hook (G-006, MOD-GRID-02).
 *
 * optional helper — `useGridState`와 독립 사용 가능.
 * Web Storage API 전용 (IndexedDB / Cookie 미지원 — spec O1).
 *
 * Internal SSR-guard + try/catch + JSON I/O boilerplate is now delegated to
 * `internal/storage/storageAdapter` (ADR-007 Wave 3). External API + envelope
 * format (`{v, p}` URLSearchParams) unchanged.
 *
 * @see G-006-spec.md Section 8
 * @see MOD-GRID-REFACTOR-2026-05-17-decisions.md ADR-007
 */

import { useEffect, useRef } from 'react';
import type { GridStateValues, GridStateKey, UseStoragePersistOptions } from './types';
import { serializeGridState, deserializeGridState } from './internal/serializeState';
import { useDebouncedCallback } from './internal/useDebouncedCallback';
import { getStorage, readRaw, writeRaw, removeKey } from './internal/storage';

/** 전체 8개 GridStateKey (AC-001: 전체 8개 저장) */
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
 * `GridStateValues` ↔ `localStorage` / `sessionStorage` 동기화 옵션 helper.
 *
 * - state 변경 시 `debounceMs`(기본 300ms) 후 storage에 저장 (AC-001, AC-002)
 * - mount 시 storage → state 역방향 hydration (`onHydrate` 콜백 — AC-003)
 * - version mismatch / parse 실패 → `removeItem` + `onHydrate` 미호출 (AC-003)
 * - SSR safe (`typeof window` guard inside useEffect body — AC-004)
 * - C-32 완전 준수: option 3 (eslint-disable) 0줄 (Option A saveRef 패턴 — D2)
 *
 * @param state   - `useGridState()` 또는 기타 소스의 `GridStateValues`
 * @param options - `UseStoragePersistOptions` (`storageKey` 필수)
 *
 * @example
 * ```tsx
 * const state = useGridState();
 * useStoragePersist(state, {
 *   storageKey: 'my-grid-v1',
 *   version: 1,
 *   onHydrate: (partial) => {
 *     if (partial.sorting) state.setSorting(partial.sorting);
 *     if (partial.columnFilters) state.setColumnFilters(partial.columnFilters);
 *   },
 * });
 * ```
 *
 * @see G-006-spec.md Section 8
 * @see G-006-spec.md Section 4.3 — Option A saveRef 패턴
 */
export function useStoragePersist<TData = unknown>(
  state: GridStateValues<TData>,
  options: UseStoragePersistOptions<TData>,
): void {
  const { storageKey, debounceMs = 300 } = options;
  const version = options.version ?? 1;

  // C-32 option 2 (D5): onHydrate 콜백은 non-stable (매 렌더 재생성 가능)
  // useRef로 최신 값 보존 → useEffect deps에서 제외 (eslint-disable 미사용)
  const hydrateRef = useRef(options.onHydrate);
  useEffect(() => {
    hydrateRef.current = options.onHydrate;
  }); // intentionally no deps — 매 렌더 최신 ref 동기화

  // AC-003, AC-004: mount 시 storage → state hydration (1회)
  // ADR-007: SSR guard + try/catch + I/O delegated to storageAdapter.
  useEffect(() => {
    const storage = getStorage(options.storage === 'session' ? 'sessionStorage' : 'localStorage');
    const raw = readRaw(storage, storageKey);
    if (raw === null) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      removeKey(storage, storageKey); // AC-003: JSON.parse 실패
      return;
    }
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('v' in parsed) ||
      !('p' in parsed)
    ) {
      removeKey(storage, storageKey);
      return;
    }
    const { v, p } = parsed as { v: unknown; p: unknown };
    if (v !== version || typeof p !== 'string') {
      removeKey(storage, storageKey); // AC-003: version mismatch
      return;
    }
    const params = new URLSearchParams(p);
    const partial = deserializeGridState(params, ALL_KEYS, '');
    if (Object.keys(partial).length > 0) {
      hydrateRef.current?.(partial as Partial<GridStateValues<TData>>);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only — storageKey/version/storage는 mount 이후 변경 시나리오 미지원 (spec Section 11 OQ-1 참조)

  // AC-001, AC-002: state → storage save (debounce 지원)
  // ADR-007: SSR guard + try/catch + QuotaExceededError handling delegated to storageAdapter.
  const debouncedSave = useDebouncedCallback(() => {
    const storage = getStorage(options.storage === 'session' ? 'sessionStorage' : 'localStorage');
    const params = serializeGridState(
      state as Partial<GridStateValues>,
      ALL_KEYS,
      '',
      new URLSearchParams(),
    );
    const envelope = JSON.stringify({ v: version, p: params.toString() });
    writeRaw(storage, storageKey, envelope, 'useStoragePersist');
  }, debounceMs);

  // D2 Option A: saveRef — debouncedSave (ms<=0 시 non-stable raw fn) 를
  // eslint-disable 없이 deps 제외. 매 렌더 최신 callable 동기화.
  const saveRef = useRef(debouncedSave);
  useEffect(() => {
    saveRef.current = debouncedSave;
  }); // intentionally no deps — 매 렌더 최신 callable 동기화

  // D4: 8개 state primitive를 deps에 나열 (state 객체 참조 의존 금지).
  // saveRef.current은 ref — react-hooks/exhaustive-deps가 deps 제외를 자동 허용 (eslint-disable 불필요).
  // C-32 option 3 (non-stable fn용 eslint-disable) = 0건 — D2 Option A 완전 준수.
  useEffect(() => {
    saveRef.current();
  }, [
    state.sorting,
    state.columnFilters,
    state.rowSelection,
    state.pagination,
    state.columnPinning,
    state.columnOrder,
    state.columnSizing,
    state.columnVisibility,
  ]);
}
