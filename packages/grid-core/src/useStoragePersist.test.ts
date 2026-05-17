/**
 * useStoragePersist — unit tests (MOD-GRID-02 G-006 T1~T6).
 *
 * AC coverage:
 *   T1 → AC-002: state 변경 → debounce 후 localStorage.setItem 호출
 *   T2 → AC-003: mount 시 유효한 envelope → onHydrate 호출
 *   T3 → AC-003: mount 시 version mismatch → removeItem + onHydrate 미호출
 *   T4 → AC-003: mount 시 malformed JSON → removeItem + onHydrate 미호출
 *   T5 → S6:     QuotaExceededError → console.warn + setItem 예외 처리
 *   T6 → AC-001: storage: 'session' → sessionStorage 사용
 *
 * @see G-006-spec.md Section 6.2
 *
 * ⚠️ RUNTIME NOTE: vitest is not installed in this monorepo.
 *   Tests are authored per spec but cannot be executed via `pnpm test`.
 *   To run: install vitest + @testing-library/react + jsdom, then `pnpm vitest`.
 *   Reported as A-07 deviation in implement-score (toolingBacklog TB-2).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStoragePersist } from './useStoragePersist';
import type { GridStateValues } from './types';

// ─── 기본 state fixture ───────────────────────────────────────────────────────

function makeState(overrides: Partial<GridStateValues> = {}): GridStateValues {
  return {
    sorting: [],
    columnFilters: [],
    rowSelection: {},
    pagination: { pageIndex: 0, pageSize: 10 },
    columnPinning: {},
    columnOrder: [],
    columnSizing: {},
    columnVisibility: {},
    ...overrides,
  };
}

// ─── localStorage mock ────────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: () => { store = {}; },
  };
})();

const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: () => { store = {}; },
  };
})();

beforeEach(() => {
  localStorageMock.clear();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();

  sessionStorageMock.clear();
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();

  Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
  Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock, writable: true });

  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ─── T1: AC-002 — state 변경 → debounce 후 localStorage.setItem 호출 ──────────

/**
 * T1: state 변경 시 debounceMs 경과 후 localStorage.setItem 호출.
 * @see G-006-spec.md AC-002, T1
 */
describe('T1: state change — debounced save to localStorage', () => {
  it('calls localStorage.setItem after debounceMs when state changes', () => {
    const sorting = [{ id: 'name', desc: false }];
    const state = makeState({ sorting });

    renderHook(() =>
      useStoragePersist(state, {
        storageKey: 'test-key',
        debounceMs: 300,
      }),
    );

    // debounce 시간 전: setItem 미호출 (초기 mount 제외)
    vi.advanceTimersByTime(100);

    // debounce 시간 경과 후: setItem 호출
    act(() => { vi.advanceTimersByTime(300); });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-key',
      expect.stringContaining('"v":1'),
    );
  });
});

// ─── T2: AC-003 — mount 시 유효한 envelope → onHydrate 호출 ──────────────────

/**
 * T2: mount 시 localStorage에 유효한 envelope (version 일치) → onHydrate 호출.
 * @see G-006-spec.md AC-003, T2
 */
describe('T2: mount hydration — valid envelope calls onHydrate', () => {
  it('calls onHydrate with parsed state on mount when version matches', () => {
    const sorting = [{ id: 'age', desc: true }];
    // serializeGridState와 동일한 envelope 포맷으로 사전 저장
    const p = `sorting=${encodeURIComponent(JSON.stringify(sorting))}`;
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({ v: 1, p }));

    const onHydrate = vi.fn();
    const state = makeState();

    renderHook(() =>
      useStoragePersist(state, {
        storageKey: 'test-key',
        version: 1,
        onHydrate,
      }),
    );

    expect(onHydrate).toHaveBeenCalledOnce();
    const arg = onHydrate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(arg).toHaveProperty('sorting');
    expect(arg.sorting).toEqual(sorting);
  });
});

// ─── T3: AC-003 — version mismatch → removeItem + onHydrate 미호출 ────────────

/**
 * T3: mount 시 저장된 v 값이 options.version과 불일치 → removeItem + onHydrate 미호출.
 * @see G-006-spec.md AC-003, T3
 */
describe('T3: version mismatch — removeItem called, onHydrate not called', () => {
  it('removes storage item and does not call onHydrate on version mismatch', () => {
    // version 1로 저장된 데이터
    const p = `sorting=${encodeURIComponent(JSON.stringify([{ id: 'name', desc: false }]))}`;
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({ v: 1, p }));

    const onHydrate = vi.fn();
    const state = makeState();

    // version 2로 hook 실행 → mismatch
    renderHook(() =>
      useStoragePersist(state, {
        storageKey: 'test-key',
        version: 2,
        onHydrate,
      }),
    );

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
    expect(onHydrate).not.toHaveBeenCalled();
  });
});

// ─── T4: AC-003 — malformed JSON → removeItem + onHydrate 미호출 ─────────────

/**
 * T4: mount 시 localStorage에 malformed JSON → removeItem + onHydrate 미호출.
 * @see G-006-spec.md AC-003, T4
 */
describe('T4: malformed JSON — removeItem called, onHydrate not called', () => {
  it('removes storage item and does not call onHydrate on JSON.parse failure', () => {
    localStorageMock.getItem.mockReturnValueOnce('NOT_VALID_JSON{{{');

    const onHydrate = vi.fn();
    const state = makeState();

    expect(() =>
      renderHook(() =>
        useStoragePersist(state, {
          storageKey: 'test-key',
          onHydrate,
        }),
      ),
    ).not.toThrow();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
    expect(onHydrate).not.toHaveBeenCalled();
  });
});

// ─── T5: S6 — QuotaExceededError → console.warn + 에러 미전파 ────────────────

/**
 * T5: localStorage.setItem에서 QuotaExceededError 발생 → console.warn + 에러 미전파.
 * @see G-006-spec.md S6, T5
 */
describe('T5: QuotaExceededError — silent fallback with console.warn', () => {
  it('logs console.warn and does not rethrow QuotaExceededError', () => {
    const quotaError = new DOMException('QuotaExceeded', 'QuotaExceededError');
    localStorageMock.setItem.mockImplementationOnce(() => { throw quotaError; });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const state = makeState({ sorting: [{ id: 'x', desc: false }] });

    expect(() =>
      renderHook(() =>
        useStoragePersist(state, { storageKey: 'test-key', debounceMs: 0 }),
      ),
    ).not.toThrow();

    act(() => { vi.advanceTimersByTime(0); });

    expect(warnSpy).toHaveBeenCalledWith(
      '[useStoragePersist] QuotaExceededError — save skipped',
      'test-key',
    );

    warnSpy.mockRestore();
  });
});

// ─── T6: AC-001 — storage: 'session' → sessionStorage 사용 ──────────────────

/**
 * T6: `storage: 'session'` 옵션 → sessionStorage 사용 (localStorage 미사용).
 * @see G-006-spec.md AC-001, T6
 */
describe("T6: storage: 'session' — uses sessionStorage", () => {
  it('reads from sessionStorage on mount when storage is session', () => {
    // sessionStorage에 유효한 envelope 사전 저장
    const sorting = [{ id: 'col', desc: false }];
    const p = `sorting=${encodeURIComponent(JSON.stringify(sorting))}`;
    sessionStorageMock.getItem.mockReturnValueOnce(JSON.stringify({ v: 1, p }));

    const onHydrate = vi.fn();
    const state = makeState();

    renderHook(() =>
      useStoragePersist(state, {
        storageKey: 'test-key',
        storage: 'session',
        onHydrate,
      }),
    );

    // sessionStorage에서 읽음
    expect(sessionStorageMock.getItem).toHaveBeenCalledWith('test-key');
    // localStorage는 접근 없음
    expect(localStorageMock.getItem).not.toHaveBeenCalled();
    // onHydrate 호출됨
    expect(onHydrate).toHaveBeenCalledOnce();
  });
});
