/**
 * Internal — 데이터 로드 후 첫 행 자동 선택 훅 (AggridTable L78-85 패턴 차용).
 *
 * G-003 D9: TanStack `RowSelectionState` 를 직접 사용 (별도 selectedRowId state 도입 안 함).
 * useEffect deps = `[dataLength, enabled, selectionMode]` — 배열 ref 변경에 둔감, length 변경에만 반응.
 *
 * @see G-003-spec.md Section 2.4 + D9 + Section 6 EC-05/EC-06
 */

import { useEffect } from 'react';
import type { Table } from '@tanstack/react-table';

import type { RowSelectionMode } from '../types';

/**
 * 데이터 로드 후 첫 행 자동 선택 훅.
 *
 * 동작:
 * - `selectionMode === 'none'` 시 no-op (선택 비활성 상태 — D9)
 * - `enabled === false` 시 no-op (사용자 selection 보존)
 * - `enabled === true && dataLength === 0` 시 `table.setRowSelection({})` (선택 해제)
 * - `enabled === true && dataLength > 0` 시 `table.setRowSelection({ [firstRowId]: true })`
 * - `selectionMode === 'multi'` 일 때도 첫 1행만 선택 (single behavior — AG `autoSelectFirstRow` 패턴)
 *
 * @typeParam TData - 행 데이터 타입.
 * @param table - TanStack Table 인스턴스 (`useReactTable` 반환값).
 * @param enabled - `props.autoSelectFirstRow` 그대로 전달.
 * @param dataLength - `props.data.length`. 배열 ref 변경에 둔감하도록 length 만 추적.
 * @param selectionMode - 정규화된 selection mode (`'single' | 'multi' | 'none'`).
 *
 * @see G-003-spec.md Section 2.4 + D9
 */
export function useAutoSelectFirstRow<TData>(
  table: Table<TData>,
  enabled: boolean,
  dataLength: number,
  selectionMode: RowSelectionMode,
): void {
  useEffect(() => {
    // D9: selection 비활성 모드 — silent no-op (사용자 책임, warning 미발행)
    if (selectionMode === 'none') return;
    // 사용자 selection 보존 — AggridTable 와 다름 (AggridTable 은 selectedRowId(null) 강제)
    if (!enabled) return;
    if (dataLength === 0) {
      // 데이터 없음 → 선택 해제 (AggridTable L83 패턴)
      table.setRowSelection({});
      return;
    }
    const firstRow = table.getRowModel().rows[0];
    if (!firstRow) return;
    // single behavior — multi 시에도 첫 1행만 (D9, AG 패턴)
    table.setRowSelection({ [firstRow.id]: true });
    // table 자체는 매 렌더 새 인스턴스이므로 deps 에서 의도적 제외 (length/enabled/mode 트리거)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLength, enabled, selectionMode]);
}
