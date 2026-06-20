/**
 * useColumnPersistence — unit tests (MOD-GRID-04 G-003 TC-001~TC-006).
 *
 * @see G-003-spec.md Section 7 TC-001 ~ TC-006
 *
 * ⚠️ RUNTIME NOTE: vitest is not installed in this monorepo.
 *   Tests are authored per spec but cannot be executed via `pnpm test`.
 *   To run: install vitest + @testing-library/react + jsdom, then `pnpm vitest`.
 *   Reported as A-07 deviation in implement-score.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useColumnPersistence } from './useColumnPersistence';
import type { ColumnPersistenceOptions } from '../types';
import type { Table, VisibilityState, ColumnOrderState } from '@tanstack/react-table';

// ─── localStorage mock ───────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// ─── Table mock factory ───────────────────────────────────────────────────────

function makeTable(
  visibility: VisibilityState = {},
  order: ColumnOrderState = [],
): Table<unknown> {
  return {
    getState: () => ({ columnVisibility: visibility, columnOrder: order }) as ReturnType<Table<unknown>['getState']>,
    setColumnVisibility: vi.fn(),
    setColumnOrder: vi.fn(),
    getAllLeafColumns: () => [],
  } as unknown as Table<unknown>;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorageMock.clear();
});

/**
 * TC-001: 기본 저장 — visibility + order state 가 localStorage 에 기록된다.
 * @see G-003-spec.md TC-001
 */
describe('TC-001: basic persist', () => {
  it('saves visibility and order to localStorage on render', () => {
    const visibility: VisibilityState = { name: false };
    const order: ColumnOrderState = ['id', 'name'];
    const table = makeTable(visibility, order);
    const options: ColumnPersistenceOptions = {
      storageKey: 'tc001',
      version: 1,
      persist: ['visibility', 'order'],
    };

    renderHook(() => useColumnPersistence(table, options));

    const saved = localStorageMock.getItem('tc001');
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved!);
    expect(parsed.v).toBe(1);
    expect(parsed.data.visibility).toEqual(visibility);
    expect(parsed.data.order).toEqual(order);
  });
});

/**
 * TC-002: 복원 — localStorage 에 저장된 state 가 mount 시 table setter 로 복원된다.
 * @see G-003-spec.md TC-002
 */
describe('TC-002: restore on mount', () => {
  it('restores visibility and order from localStorage', () => {
    const savedVisibility: VisibilityState = { age: false };
    const savedOrder: ColumnOrderState = ['age', 'id'];
    const stored = JSON.stringify({
      v: 1,
      data: { visibility: savedVisibility, order: savedOrder },
    });
    localStorageMock.setItem('tc002', stored);

    const table = makeTable({}, []);
    const options: ColumnPersistenceOptions = { storageKey: 'tc002', version: 1 };

    renderHook(() => useColumnPersistence(table, options));

    expect(table.setColumnVisibility).toHaveBeenCalledWith(savedVisibility);
    expect(table.setColumnOrder).toHaveBeenCalledWith(savedOrder);
  });
});

/**
 * TC-003: version mismatch — 저장된 버전이 다르면 항목 삭제 + 복원 skip.
 * @see G-003-spec.md TC-003
 */
describe('TC-003: version mismatch', () => {
  it('removes stale entry and does not restore when version mismatches', () => {
    const stale = JSON.stringify({ v: 1, data: { visibility: { name: false } } });
    localStorageMock.setItem('tc003', stale);

    const table = makeTable();
    const options: ColumnPersistenceOptions = { storageKey: 'tc003', version: 2 }; // version 2 vs stored 1

    renderHook(() => useColumnPersistence(table, options));

    // version mismatch → the stale v:1 entry is NOT restored (복원 skip)...
    expect(table.setColumnVisibility).not.toHaveBeenCalled();
    expect(table.setColumnOrder).not.toHaveBeenCalled();
    // ...the stale entry is discarded, then the persist effect re-writes current state as v:2.
    // (The old `toBeNull()` assertion ignored persist-on-mount.) Key invariant: stale v:1 data gone.
    const after = JSON.parse(localStorageMock.getItem('tc003')!) as { v: number; data: { visibility?: unknown } };
    expect(after.v).toBe(2);
    expect(after.data.visibility).toEqual({}); // stale { name: false } is NOT carried over
  });
});

/**
 * TC-004: visibility + order 모두 저장 확인 (default persist).
 * @see G-003-spec.md TC-004
 */
describe('TC-004: persist visibility and order', () => {
  it('persists both visibility and order when persist is default', () => {
    const visibility: VisibilityState = { col1: false };
    const order: ColumnOrderState = ['col2', 'col1'];
    const table = makeTable(visibility, order);
    const options: ColumnPersistenceOptions = { storageKey: 'tc004' };

    renderHook(() => useColumnPersistence(table, options));

    const saved = JSON.parse(localStorageMock.getItem('tc004')!);
    expect(saved.data.visibility).toEqual(visibility);
    expect(saved.data.order).toEqual(order);
  });
});

/**
 * TC-005: visibility-only — `persist: ['visibility']` 시 order 미저장.
 * @see G-003-spec.md TC-005
 */
describe('TC-005: visibility-only persist', () => {
  it('saves only visibility when persist=[visibility]', () => {
    const visibility: VisibilityState = { col1: false };
    const order: ColumnOrderState = ['col1', 'col2'];
    const table = makeTable(visibility, order);
    const options: ColumnPersistenceOptions = {
      storageKey: 'tc005',
      persist: ['visibility'],
    };

    renderHook(() => useColumnPersistence(table, options));

    const saved = JSON.parse(localStorageMock.getItem('tc005')!);
    expect(saved.data.visibility).toEqual(visibility);
    expect(saved.data.order).toBeUndefined();
  });
});

/**
 * TC-006: SSR safe — localStorage 접근 불가 시 silent skip.
 * @see G-003-spec.md TC-006
 */
describe('TC-006: SSR safety', () => {
  it('does not throw when localStorage throws (incognito / SSR fallback)', () => {
    const original = localStorageMock.setItem;
    localStorageMock.setItem = () => { throw new Error('QuotaExceededError'); };

    const table = makeTable({ col: false }, ['col']);
    const options: ColumnPersistenceOptions = { storageKey: 'tc006' };

    expect(() => {
      renderHook(() => useColumnPersistence(table, options));
    }).not.toThrow();

    localStorageMock.setItem = original;
  });
});

/**
 * EC-002: storageKey '' → no-op.
 */
describe('EC-002: empty storageKey → no-op', () => {
  it('does not access localStorage when storageKey is empty string', () => {
    const spy = vi.spyOn(localStorageMock, 'getItem');
    const table = makeTable({ a: false }, ['a']);
    const options: ColumnPersistenceOptions = { storageKey: '' };

    renderHook(() => useColumnPersistence(table, options));

    expect(spy).not.toHaveBeenCalled();
    expect(table.setColumnVisibility).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
