/**
 * useUrlSync — unit tests (MOD-GRID-02 G-005 S1~S5).
 *
 * AC coverage:
 *   S1 → AC-001: keys 지정 시 해당 키만 URL 반영
 *   S2 → AC-002: keys 미지정 시 8개 전체 URL 반영
 *   S3 → AC-003: 기본값(빈 배열) state → URL에서 키 삭제
 *   S4 → AC-004: mount 시 URL → onHydrate 콜백 호출
 *   S5 → R-1: JSON.parse 실패 → 해당 키 skip, 에러 없음
 *
 * @see G-005-spec.md Section 6.1
 *
 * ⚠️ RUNTIME NOTE: vitest is not installed in this monorepo.
 *   Tests are authored per spec but cannot be executed via `pnpm test`.
 *   To run: install vitest + @testing-library/react + jsdom, then `pnpm vitest`.
 *   Reported as A-07 deviation in implement-score.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUrlSync } from './useUrlSync';
import type { GridStateValues } from './types';

// ─── window.history mock ──────────────────────────────────────────────────────

const replaceStateMock = vi.fn();

beforeEach(() => {
  replaceStateMock.mockClear();
  // window.history.replaceState mock
  Object.defineProperty(window, 'history', {
    value: { replaceState: replaceStateMock },
    writable: true,
  });
  // window.location.search 초기화
  Object.defineProperty(window, 'location', {
    value: { search: '' },
    writable: true,
  });
});

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

// ─── S1: AC-001 — keys 지정 시 해당 키만 URL에 반영 ─────────────────────────

/**
 * S1: `keys: ['sorting']` 지정 → sorting 변경 시 `?sorting=…` URL 반영.
 * @see G-005-spec.md AC-001
 */
describe('S1: keys specified — only those keys sync to URL', () => {
  it('reflects sorting in URL when keys includes sorting', () => {
    const sorting = [{ id: 'name', desc: false }];
    const state = makeState({ sorting });

    renderHook(() =>
      useUrlSync(state, { keys: ['sorting'] }),
    );

    expect(replaceStateMock).toHaveBeenCalled();
    const url: string = replaceStateMock.mock.calls[0]?.[2] as string;
    expect(url).toContain('sorting=');
    expect(url).toContain(encodeURIComponent(JSON.stringify(sorting)));
  });
});

// ─── S2: AC-002 — keys 미지정 시 8개 전체 URL 반영 ──────────────────────────

/**
 * S2: `keys` 미지정 → 기본값이 아닌 state 키가 URL에 반영됨.
 * @see G-005-spec.md AC-002
 */
describe('S2: keys unspecified — all non-default state keys sync', () => {
  it('includes non-default keys in URL when keys is not specified', () => {
    const sorting = [{ id: 'age', desc: true }];
    const columnFilters = [{ id: 'name', value: 'Alice' }];
    const state = makeState({ sorting, columnFilters });

    renderHook(() => useUrlSync(state));

    expect(replaceStateMock).toHaveBeenCalled();
    const url: string = replaceStateMock.mock.calls[0]?.[2] as string;
    expect(url).toContain('sorting=');
    expect(url).toContain('columnFilters=');
  });
});

// ─── S3: AC-003 — 기본값 state → URL에서 키 삭제 ────────────────────────────

/**
 * S3: `sorting: []` (기본값) → URL에서 `sorting` 키 삭제됨.
 * @see G-005-spec.md AC-003
 */
describe('S3: default state value — key removed from URL', () => {
  it('removes sorting key from URL when sorting is empty array', () => {
    // URL에 sorting이 있다고 가정
    Object.defineProperty(window, 'location', {
      value: { search: '?sorting=%5B%5D' },
      writable: true,
    });

    const state = makeState({ sorting: [] });

    renderHook(() =>
      useUrlSync(state, { keys: ['sorting'] }),
    );

    expect(replaceStateMock).toHaveBeenCalled();
    const url: string = replaceStateMock.mock.calls[0]?.[2] as string;
    // 빈 배열(기본값)이므로 sorting 키가 없어야 함
    expect(url).not.toContain('sorting=');
  });
});

// ─── S4: AC-004 — mount 시 URL → onHydrate 콜백 호출 ────────────────────────

/**
 * S4: mount 시 URL `?sorting=[…]` → `onHydrate` 콜백이 해당 partial과 함께 호출됨.
 * @see G-005-spec.md AC-004
 */
describe('S4: mount hydration — onHydrate called with URL state', () => {
  it('calls onHydrate with parsed URL state on mount', () => {
    const sorting = [{ id: 'name', desc: false }];
    Object.defineProperty(window, 'location', {
      value: { search: `?sorting=${encodeURIComponent(JSON.stringify(sorting))}` },
      writable: true,
    });

    const onHydrate = vi.fn();
    const state = makeState();

    renderHook(() =>
      useUrlSync(state, { keys: ['sorting'], onHydrate }),
    );

    expect(onHydrate).toHaveBeenCalledOnce();
    const arg = onHydrate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(arg).toMatchObject({ sorting });
  });
});

// ─── S5: R-1 — JSON.parse 실패 → 해당 키 skip, 에러 없음 ────────────────────

/**
 * S5: URL에 corrupted JSON → 파싱 실패 키는 skip, `onHydrate`는 성공한 키만 포함.
 * @see G-005-spec.md Section 6.1 S5, Section 4.3 R-1
 */
describe('S5: corrupted URL — parse failure skips key gracefully', () => {
  it('skips keys that fail JSON.parse without throwing', () => {
    // sorting은 corrupted, columnFilters는 정상
    const columnFilters = [{ id: 'status', value: 'active' }];
    Object.defineProperty(window, 'location', {
      value: {
        search: `?sorting=INVALID_JSON&columnFilters=${encodeURIComponent(JSON.stringify(columnFilters))}`,
      },
      writable: true,
    });

    const onHydrate = vi.fn();
    const state = makeState();

    expect(() =>
      renderHook(() =>
        useUrlSync(state, { keys: ['sorting', 'columnFilters'], onHydrate }),
      ),
    ).not.toThrow();

    expect(onHydrate).toHaveBeenCalledOnce();
    const arg = onHydrate.mock.calls[0]?.[0] as Record<string, unknown>;
    // sorting 파싱 실패 → 포함 안 됨
    expect(arg).not.toHaveProperty('sorting');
    // columnFilters 파싱 성공 → 포함됨
    expect(arg).toMatchObject({ columnFilters });
  });
});
