/**
 * @tomis/grid-core — useColumnOrderPersist hook.
 *
 * Moved from `@tomis/grid-features/column-drag/useColumnOrderPersist.ts` per ADR-009 (옵션 A).
 * Aliased re-export remains in `@tomis/grid-features` for one minor cycle.
 *
 * G-002 (MOD-GRID-07): 컬럼 순서 localStorage 영속화.
 *
 * Internal SSR-guard + try/catch + JSON I/O boilerplate is now delegated to
 * `internal/storage/storageAdapter` (ADR-007 Wave 3). External API + raw-array
 * envelope unchanged.
 *
 * AC-001: persistColumnOrder + columnOrderStorageKey prop 기반 저장/복원.
 * AC-002: localStorage 접근 try/catch + SSR guard + QuotaExceededError 처리 (adapter 위임).
 *
 * 구조: grid-core/useStoragePersist.ts 미러 (D6 결정).
 *
 * @see MOD-GRID-REFACTOR-2026-05-17-decisions.md ADR-007
 */

import { useEffect } from 'react';
import type { Table } from '@tanstack/react-table';
import { getStorage, readJson, writeJson, removeKey } from '../storage';

export interface UseColumnOrderPersistProps<TData> {
  /** TanStack Table v8 인스턴스 */
  table: Table<TData>;
  /** localStorage 영속화 활성 여부 (persistColumnOrder prop) */
  enabled: boolean;
  /** localStorage 키 (columnOrderStorageKey prop) */
  storageKey: string;
}

/**
 * 컬럼 순서를 localStorage에 저장/복원하는 hook (D10).
 *
 * - 반환: `{ saveOrder }` — useColumnDrag 내부 handleColumnOrderChange에서 호출
 * - mount 시: localStorage.getItem → JSON.parse → table.setColumnOrder (AC-001 복원)
 * - save 방법: `saveOrder(order)` 호출 → localStorage.setItem (D10)
 * - 모든 localStorage 접근: adapter 가 try/catch (AC-002)
 * - SSR guard: adapter 가 처리 (AC-002, D6)
 * - QuotaExceededError: adapter 가 console.warn + silent skip (AC-002)
 *
 * @typeParam TData - 행 데이터 타입
 */
export function useColumnOrderPersist<TData>({
  table,
  enabled,
  storageKey,
}: UseColumnOrderPersistProps<TData>): { saveOrder: (order: string[]) => void } {
  // saveOrder 콜백 — 외부 onColumnOrderChange 에서 호출
  const saveOrder = (order: string[]): void => {
    if (!enabled || !storageKey) return;
    const storage = getStorage('localStorage');
    writeJson(storage, storageKey, order, 'useColumnOrderPersist');
  };

  // mount 시 1회 localStorage → table.setColumnOrder 복원 (AC-001, AC-002)
  useEffect(() => {
    if (!enabled || !storageKey) return;
    const storage = getStorage('localStorage');
    const parsed = readJson<unknown>(storage, storageKey);
    if (parsed === null) return;
    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'string')) {
      removeKey(storage, storageKey); // 손상된 데이터 → 제거
      return;
    }
    const order = parsed as string[];
    if (order.length > 0) {
      table.setColumnOrder(order); // AC-001: TanStack v8 표준 API (C-2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only

  return { saveOrder };
}
