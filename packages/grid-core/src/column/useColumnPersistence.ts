/**
 * @topgrid/grid-core — useColumnPersistence hook.
 *
 * MOD-GRID-04 G-003: 컬럼 가시성 + 순서 localStorage 영속화.
 *
 * Internal SSR-guard + try/catch + JSON I/O boilerplate is now delegated to
 * `internal/storage/storageAdapter` (ADR-007 Wave 3). External API + envelope
 * format (`{v, data}` JSON) unchanged.
 *
 * ## 결정 원칙
 * - D1: self-contained localStorage embed (G-006 StorageAdapter pending) → ADR-007 으로 충족.
 * - D4: `useColumnPersistence<TData>(table, options): void` 시그니처.
 * - D5: storage format `{ v: number; data: { visibility?: VisibilityState; order?: ColumnOrderState } }`.
 *       version mismatch → removeItem + fallback (no restore).
 * - EC-002: storageKey 빈 문자열 → no-op.
 * - EC-003: SSR/incognito → try/catch + silent skip (adapter 가 처리).
 * - NFR-006: storageKey '' 시 localStorage 접근 없음.
 *
 * @see G-003-spec.md Section 2 + Section 8 + D1/D4/D5
 * @see ColumnPersistenceOptions
 * @see MOD-GRID-REFACTOR-2026-05-17-decisions.md ADR-007
 */

import { useEffect } from 'react';
import type { ColumnOrderState, Table, VisibilityState } from '@tanstack/react-table';
import type { ColumnPersistenceOptions, PersistTarget } from '../types';
import { getStorage, readJson, writeJson, removeKey } from '../internal/storage';

/** localStorage 에 저장되는 형식 (D5). */
interface StorageEntry {
  v: number;
  data: {
    visibility?: VisibilityState;
    order?: ColumnOrderState;
  };
}

/** localStorage read + version 검증. mismatch 시 key 삭제 후 null 반환 (D5). */
function readStorage(key: string, version: number): StorageEntry['data'] | null {
  const storage = getStorage('localStorage');
  const parsed = readJson<unknown>(storage, key);
  if (parsed === null) return null;
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('v' in parsed) ||
    !('data' in parsed) ||
    (parsed as { v: unknown }).v !== version
  ) {
    // version mismatch → 오염된 항목 삭제 (D5)
    removeKey(storage, key);
    return null;
  }
  return (parsed as StorageEntry).data;
}

/** localStorage write. 실패 시 silent skip (EC-003 — adapter 가 처리). */
function writeStorage(key: string, version: number, data: StorageEntry['data']): void {
  const storage = getStorage('localStorage');
  const entry: StorageEntry = { v: version, data };
  writeJson(storage, key, entry);
}

/**
 * 컬럼 가시성 + 순서를 localStorage 에 영속화하는 훅.
 *
 * @deprecated No production users outside grid-core. Superseded by ADR-007
 * `grid-core/internal/storage` adapter (Wave 3). Will be removed from public API
 * in next major. (ADR-013)
 *
 * - `storageKey` 빈 문자열 → no-op (EC-002, NFR-006).
 * - SSR / incognito → adapter 가 try/catch 로 silent skip (EC-003).
 * - mount 시 저장된 state 복원; table state 변경 시 자동 저장.
 * - version mismatch 시 저장된 항목 삭제 + 복원 skip (D5).
 *
 * @typeParam TData - 행 데이터 타입.
 * @param table  - `useReactTable()` 반환 Table 인스턴스.
 * @param options - 영속화 옵션 (`ColumnPersistenceOptions`).
 *
 * @example
 * ```ts
 * // Grid.tsx 내부 — Rules of Hooks 준수: 항상 호출 (조건부 호출 금지)
 * useColumnPersistence(table, props.columnPersistence ?? { storageKey: '' });
 * ```
 *
 * @see ColumnPersistenceOptions
 * @see G-003-spec.md Section 2 + D4 + D5 + EC-002 + EC-003 + Section 8.4
 */
export function useColumnPersistence<TData>(
  table: Table<TData>,
  options: ColumnPersistenceOptions,
): void {
  const { storageKey, version = 1, persist = ['visibility', 'order'] } = options;

  // EC-002: storageKey 빈 문자열 → 전체 no-op (NFR-006).
  // SSR: adapter 의 getStorage 가 null 반환 → readStorage/writeStorage no-op.
  // 단, storageKey '' 시 adapter 호출 자체를 skip (NFR-006 보존).
  const isEnabled = storageKey !== '';

  // ─── Restore (mount 1회) ───
  // spec Section 8.2 주의사항: `persist` array 를 deps 에 직접 쓰면 reference instability
  // → 매 render 마다 새 배열 → 무한 루프. `persist.join(',')` 문자열화로 안정화.
  const persistKey = persist.join(',');

  useEffect(() => {
    if (!isEnabled) return;

    const saved = readStorage(storageKey, version);
    if (saved === null) return;

    const targets = persist as PersistTarget[];

    if (targets.includes('visibility') && saved.visibility !== undefined) {
      table.setColumnVisibility(saved.visibility);
    }
    if (targets.includes('order') && saved.order !== undefined) {
      table.setColumnOrder(saved.order);
    }
    // mount 1회 only: deps 의도적 최소화 (storageKey + version + persistKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled, storageKey, version, persistKey]);

  // ─── Persist (state 변경 시마다) ───
  useEffect(() => {
    if (!isEnabled) return;

    const state = table.getState();
    const targets = persist as PersistTarget[];

    const data: StorageEntry['data'] = {};
    if (targets.includes('visibility')) {
      data.visibility = state.columnVisibility;
    }
    if (targets.includes('order')) {
      data.order = state.columnOrder;
    }

    writeStorage(storageKey, version, data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isEnabled,
    storageKey,
    version,
    persistKey,
    // state 스냅샷을 직렬화하여 실제 변경 시만 저장
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(table.getState().columnVisibility),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(table.getState().columnOrder),
  ]);
}
