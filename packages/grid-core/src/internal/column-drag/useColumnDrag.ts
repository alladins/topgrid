/**
 * @topgrid/grid-core — useColumnDrag hook.
 *
 * Moved from `@topgrid/grid-features/column-drag/useColumnDrag.ts` per ADR-009 (옵션 A).
 * Aliased re-export remains in `@topgrid/grid-features` for one minor cycle.
 *
 * G-001 (MOD-GRID-07): HTML5 Drag and Drop API 기반 컬럼 헤더 드래그 재정렬.
 * G-002 (MOD-GRID-07): localStorage 영속화 + 키보드 단축키 (Alt+← / Alt+→).
 *
 * AC-001: enableColumnReorder prop → enabled 파라미터로 전달.
 * AC-002: table.setColumnOrder(newOrder) 호출 (TanStack v8 표준 API, C-2).
 * AC-003: dragOverId state → DropIndicator 에 전달 (시각 인디케이터).
 * AC-004: isPinned=true 컬럼 draggable={false} + drop early return.
 * AC-005: onColumnOrderChange 콜백 호출.
 * AC-006: HTML5 DnD only, 외부 라이브러리 미사용 (C-20).
 * G-002 AC-001/AC-002: useColumnOrderPersist 통합 (localStorage 영속화).
 * G-002 AC-003/AC-004: getKeyDownHandler (Alt+← / Alt+→, focus-scoped, D8).
 */

import { useCallback, useRef, useState } from 'react';
import type { UseColumnDragProps, UseColumnDragReturn, DragThProps } from './types';
import { useColumnOrderPersist } from './useColumnOrderPersist';

/**
 * HTML5 Drag and Drop API 기반 컬럼 재정렬 hook.
 *
 * @typeParam TData - 행 데이터 타입.
 * @param props - {@link UseColumnDragProps}
 * @returns {@link UseColumnDragReturn}
 */
export function useColumnDrag<TData>(
  props: UseColumnDragProps<TData>,
): UseColumnDragReturn {
  const { table, enabled, onColumnOrderChange, persistColumnOrder, columnOrderStorageKey } = props;

  /** 현재 drop 인디케이터를 표시할 컬럼 ID. */
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  /** 드래그 중인 소스 컬럼 ID (ref: 렌더 트리거 불필요). */
  const dragSourceId = useRef<string | null>(null);

  // G-002 AC-001/AC-002: localStorage 영속화 hook — { saveOrder } 반환 (D10)
  const { saveOrder } = useColumnOrderPersist({
    table,
    enabled: persistColumnOrder === true,
    storageKey: columnOrderStorageKey ?? '',
  });

  // G-002 내부 onColumnOrderChange — 외부 콜백 + persist save 합성 (D10)
  const handleColumnOrderChange = useCallback(
    (order: string[]) => {
      onColumnOrderChange?.(order);
      saveOrder(order); // AC-001: drag/keyboard 완료 후 저장
    },
    [onColumnOrderChange, saveOrder],
  );

  // G-002 AC-003: Alt+← / Alt+→ 키보드 이동 핸들러 (focus-scoped, D8)
  const getKeyDownHandler = useCallback(
    (columnId: string, isPinned: boolean) =>
      (e: KeyboardEvent): void => {
        // AC-004: pinned 컬럼 → no-op
        if (!enabled || isPinned) return;
        if (!e.altKey) return;
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;

        e.preventDefault(); // 브라우저 기본 동작 방지 (D8 focus-scope 의도 명시)

        // 현재 컬럼 순서 획득 (G-001 onDrop 동일 패턴)
        const currentOrder = table.getState().columnOrder;
        const allColumns = table.getAllLeafColumns().map((c) => c.id);
        const baseOrder: string[] = currentOrder.length > 0 ? currentOrder : allColumns;

        const currentIndex = baseOrder.indexOf(columnId);
        if (currentIndex === -1) return;

        const direction = e.key === 'ArrowLeft' ? -1 : 1;
        let targetIndex = currentIndex + direction;

        // AC-004: pinned 컬럼 건너뜀 — 비-pinned 컬럼만 이동 대상
        while (
          targetIndex >= 0 &&
          targetIndex < baseOrder.length
        ) {
          const targetColId = baseOrder[targetIndex];
          if (targetColId === undefined) break;
          const targetCol = table.getColumn(targetColId);
          if (targetCol?.getIsPinned() === false) break; // 비-pinned 대상 발견
          targetIndex += direction; // pinned → 계속 건너뜀
        }

        if (targetIndex < 0 || targetIndex >= baseOrder.length) return; // 범위 초과

        // 이동 계산: source 제거 후 target 위치 삽입 (G-001 onDrop 동일 알고리즘)
        const newOrder = [...baseOrder];
        newOrder.splice(currentIndex, 1);
        const insertIndex = newOrder.indexOf(baseOrder[targetIndex]!);
        if (insertIndex === -1) return;
        const finalIndex = direction === 1 ? insertIndex + 1 : insertIndex;
        newOrder.splice(finalIndex, 0, columnId);

        table.setColumnOrder(newOrder); // AC-003: TanStack v8 표준 API (C-2)
        handleColumnOrderChange(newOrder); // AC-001: persist 저장 포함
      },
    [enabled, table, handleColumnOrderChange],
  );

  const getDragProps = useCallback(
    (columnId: string, isPinned: boolean): DragThProps => {
      // AC-004: pinned 컬럼 → draggable=false, 핸들러 모두 no-op.
      if (!enabled || isPinned) {
        return {
          draggable: false,
          onDragStart: () => undefined,
          onDragOver: () => undefined,
          onDragLeave: () => undefined,
          onDrop: () => undefined,
          onDragEnd: () => undefined,
        };
      }

      return {
        draggable: true,

        onDragStart: (e: DragEvent) => {
          dragSourceId.current = columnId;
          // HTML5 DragEvent API: dataTransfer.setData (C-2, C-20).
          e.dataTransfer?.setData('columnId', columnId);
        },

        onDragOver: (e: DragEvent) => {
          e.preventDefault(); // drop 허용
          // AC-004: 드롭 대상이 pinned 이면 early return (drop 거부).
          if (isPinned) return;
          setDragOverId(columnId);
        },

        onDragLeave: (_e: DragEvent) => {
          setDragOverId(null);
        },

        onDrop: (e: DragEvent) => {
          e.preventDefault();
          // AC-004: pinned 컬럼 위에 drop → early return.
          if (isPinned) {
            setDragOverId(null);
            return;
          }

          const sourceId = e.dataTransfer?.getData('columnId') ?? dragSourceId.current;
          if (!sourceId || sourceId === columnId) {
            setDragOverId(null);
            return;
          }

          // AC-002: TanStack v8 setColumnOrder (C-2).
          // 현재 컬럼 순서 획득 — columnOrder state 가 빈 배열이면 leaf column ID 배열 사용.
          const currentOrder = table.getState().columnOrder;
          const allColumns = table.getAllLeafColumns().map((c) => c.id);
          const baseOrder: string[] = currentOrder.length > 0 ? currentOrder : allColumns;

          // source 컬럼을 baseOrder 에서 제거 후 target 위치에 삽입.
          const newOrder = baseOrder.filter((id) => id !== sourceId);
          const targetIndex = newOrder.indexOf(columnId);
          if (targetIndex === -1) {
            setDragOverId(null);
            return;
          }
          newOrder.splice(targetIndex, 0, sourceId);

          table.setColumnOrder(newOrder);

          // G-002: persist 저장 포함 (AC-005 + AC-001).
          handleColumnOrderChange(newOrder);

          dragSourceId.current = null;
          setDragOverId(null);
        },

        onDragEnd: (_e: DragEvent) => {
          // 드래그 취소 또는 외부 drop 시 상태 초기화.
          dragSourceId.current = null;
          setDragOverId(null);
        },
      };
    },
    [enabled, table, handleColumnOrderChange],
  );

  return { getDragProps, dragOverId, getKeyDownHandler };
}
