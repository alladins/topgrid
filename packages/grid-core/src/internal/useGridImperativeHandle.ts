/**
 * `useGridImperativeHandle` — `<Grid ref>` 의 `useImperativeHandle` 매핑 헬퍼.
 *
 * G-004 D2/D3/D4/D9/D11/D12: ChangeTrackingGrid.tsx:110-112 의 `useImperativeHandle`
 * 매핑 패턴을 base wrapper 로 추출 (1/8 → 일반화).
 *
 * - `addRow`/`deleteRow`/`updateRow`: callback delegating (D3 — controlled data 정책).
 * - `scrollTo`: virtualizer 우선 + DOM `scrollIntoView` fallback (D9) + clamp `[0, len-1]`.
 * - `getSelection`/`clearSelection`/`refresh`: TanStack `table` 직접 위임 (D11/D12).
 *
 * @see G-004-spec.md Section 2.5
 */

import { useImperativeHandle, type Ref, type RefObject } from 'react';
import type { Table } from '@tanstack/react-table';
import type { Virtualizer } from '@tanstack/react-virtual';

import type { GridHandle } from '../types';

/**
 * `useGridImperativeHandle` 의 callback / clamp 파라미터.
 *
 * `exactOptionalPropertyTypes: true` 환경에서 호출자가 `props.onAddRow` (타입:
 * `... | undefined`) 를 그대로 forward 가능하도록 optional fields 모두 `| undefined`
 * union 명시 (G-001 `buildTableOptions.ts` 동일 패턴 — decisions.md L207).
 */
export interface UseGridImperativeHandleParams<TData> {
  /** `addRow` 위임 콜백. 미제공 시 dev warn + no-op (D3). */
  onAddRow?: ((seed?: Partial<TData>) => void) | undefined;
  /** `deleteRow` 위임 콜백. 미제공 시 dev warn + no-op (D3). */
  onDeleteRow?: ((rowId: string | number) => void) | undefined;
  /** `updateRow` 위임 콜백. 미제공 시 dev warn + no-op (D3). */
  onUpdateRow?:
    | ((rowId: string | number, patch: Partial<TData>) => void)
    | undefined;
  /**
   * `startEditing` 위임 콜백 (G-007 D2). 미제공 시 dev warn + no-op.
   * Grid 는 editing state 를 소유하지 않음 — application 책임.
   */
  onStartEditing?:
    | ((rowId: string | number, colId: string) => void)
    | undefined;
  /** `scrollTo` index clamp 계산용 (`Math.max(0, dataLength - 1)`). */
  dataLength: number;
}

// Node `process` global 의 minimal local declare — `@types/node` 미설치 환경에서
// dev mode 가드 시 사용 (C-4 준수: any/ts-ignore 미사용. inline declare 패턴은
// `Grid.tsx` 와 본 파일 2회 중복 — single occurrence pattern 으로 헬퍼 promotion
// 보류, decisions.md L207 의 "1=anecdote" 룰 적용 — G-005 retro 시 elevate 검토).
declare const process: { env: { NODE_ENV?: string } } | undefined;

/**
 * dev mode 일 때만 `console.warn` (production silent — D3/D7/D9 통일 정책).
 */
function devWarn(msg: string): void {
  if (typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'production') {
    console.warn(`[tomis/grid-core] ${msg}`);
  }
}

/**
 * `<Grid ref>` 의 `useImperativeHandle` 매핑 헬퍼 (G-004 D3/D4/D9/D11/D12).
 *
 * @typeParam TData - 행 데이터 타입.
 * @param ref - `forwardRef` 로 받은 ref (null 가능 — React 표준 매핑 skip).
 * @param table - TanStack `useReactTable` 결과 인스턴스.
 * @param virtualizer - `useGridVirtualizer` 반환값 (null 시 DOM scroll fallback).
 * @param scrollContainerRef - scroll 컨테이너 ref (DOM fallback `querySelector` 시작점).
 * @param params - callback / clamp 파라미터.
 *
 * @see G-004-spec.md Section 2.5
 */
export function useGridImperativeHandle<TData>(
  ref: Ref<GridHandle<TData>>,
  table: Table<TData>,
  virtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement> | null,
  scrollContainerRef: RefObject<HTMLDivElement | null>,
  params: UseGridImperativeHandleParams<TData>,
): void {
  useImperativeHandle(
    ref,
    () => ({
      // D3: addRow/deleteRow/updateRow → callback delegating + dev warn.
      addRow: (seed) => {
        if (!params.onAddRow) {
          devWarn('addRow() called but no onAddRow prop provided. No-op.');
          return;
        }
        params.onAddRow(seed);
      },
      deleteRow: (rowId) => {
        if (!params.onDeleteRow) {
          devWarn('deleteRow() called but no onDeleteRow prop provided. No-op.');
          return;
        }
        params.onDeleteRow(rowId);
      },
      updateRow: (rowId, patch) => {
        if (!params.onUpdateRow) {
          devWarn('updateRow() called but no onUpdateRow prop provided. No-op.');
          return;
        }
        params.onUpdateRow(rowId, patch);
      },

      // D9: scrollTo — virtualizer 우선 + DOM fallback + clamp [0, len-1].
      scrollTo: (index, options) => {
        const max = Math.max(0, params.dataLength - 1);
        const clamped = Math.max(0, Math.min(index, max));
        if (clamped !== index) {
          devWarn(
            `scrollTo(${index}) out of range [0, ${max}]. Clamped to ${clamped}.`,
          );
        }

        if (virtualizer) {
          virtualizer.scrollToIndex(clamped, options);
          return;
        }

        // D9 fallback — native DOM scrollIntoView (data-index attr 으로 행 탐색).
        const tr = scrollContainerRef.current?.querySelector(
          `tr[data-index="${clamped}"]`,
        );
        if (tr instanceof HTMLElement) {
          tr.scrollIntoView({
            behavior:
              options?.behavior === 'smooth'
                ? 'smooth'
                : 'auto',
            block:
              options?.align === 'center'
                ? 'center'
                : options?.align === 'end'
                  ? 'end'
                  : 'start',
          });
        }
      },

      // D12: getSelection / clearSelection — TanStack table 직접 위임.
      getSelection: () => table.getSelectedRowModel().rows.map((r) => r.original),
      clearSelection: () => table.setRowSelection({}),

      // D11: refresh — table.resetRowSelection() (table.reset() X — UX 회귀 방지).
      refresh: () => table.resetRowSelection(),

      // G-007 D2: startEditing — callback-delegating (D3 패턴과 동일).
      startEditing: (rowId, colId) => {
        if (!params.onStartEditing) {
          devWarn(
            `startEditing(${String(rowId)}, ${colId}) called but no onStartEditing prop provided. No-op.`,
          );
          return;
        }
        params.onStartEditing(rowId, colId);
      },
    }),
    // 의도적으로 params 객체가 아닌 individual fields 를 deps 로 명시 — `params` 는 매
    // 렌더마다 새 객체 (호출자가 inline literal 전달) 라 객체 자체를 deps 로 두면 매 렌더
    // re-bind. individual fields 가 정확한 변경 추적.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      table,
      virtualizer,
      scrollContainerRef,
      params.onAddRow,
      params.onDeleteRow,
      params.onUpdateRow,
      params.onStartEditing,
      params.dataLength,
    ],
  );
}
