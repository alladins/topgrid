/**
 * @tomis/grid-core — Column drag-and-drop types.
 *
 * Moved from `@tomis/grid-features/column-drag/types.ts` per ADR-009 (옵션 A).
 * Aliased re-exports remain in `@tomis/grid-features` for one minor cycle.
 *
 * G-001 (MOD-GRID-07): HTML5 Drag and Drop API 기반 컬럼 헤더 드래그 재정렬.
 * G-002 (MOD-GRID-07): localStorage 영속화 + 키보드 단축키 (Alt+← / Alt+→).
 */

import type { Table } from '@tanstack/react-table';

/**
 * `useColumnDrag` hook props.
 *
 * @typeParam TData - 행 데이터 타입.
 */
export interface UseColumnDragProps<TData> {
  /** TanStack Table v8 인스턴스 (`useReactTable` 반환값). */
  table: Table<TData>;
  /** 드래그 재정렬 활성 여부 (`enableColumnReorder` prop 으로부터 전달). */
  enabled: boolean;
  /** 컬럼 순서 변경 완료 후 호출되는 콜백 (G-001 AC-005). */
  onColumnOrderChange?: (order: string[]) => void;
  /** localStorage 영속화 활성 여부 (G-002 AC-001). */
  persistColumnOrder?: boolean;
  /** localStorage 키 (G-002 AC-001). persistColumnOrder=true 시 필수 (빈 문자열 → 저장 skip). */
  columnOrderStorageKey?: string;
}

/**
 * `useColumnDrag` hook 반환값.
 */
export interface UseColumnDragReturn {
  /**
   * 헤더 `<th>` 에 spread할 drag 이벤트 props 반환.
   *
   * @param columnId - 헤더 컬럼 ID.
   * @param isPinned - `column.getIsPinned() !== false` 여부 (AC-004).
   */
  getDragProps: (columnId: string, isPinned: boolean) => DragThProps;
  /**
   * 현재 drop 인디케이터를 표시할 컬럼 ID.
   * `null` = 드래그 비활성 또는 드래그 중이 아님.
   */
  dragOverId: string | null;
  /**
   * 헤더 `<th>` onKeyDown에 연결할 핸들러 반환 함수 (G-002 AC-003).
   * Alt+← / Alt+→ 키 이벤트로 컬럼 좌/우 이동.
   *
   * @param columnId - 헤더 컬럼 ID.
   * @param isPinned - pinned 컬럼 → no-op (AC-004).
   * @returns DOM KeyboardEvent 핸들러. Grid.tsx 에서 `e.nativeEvent` 전달.
   */
  getKeyDownHandler: (columnId: string, isPinned: boolean) => (e: KeyboardEvent) => void;
}

/**
 * 헤더 `<th>` DOM 요소에 전달할 drag props.
 *
 * HTML5 DragEvent 핸들러 (C-20: 외부 라이브러리 미사용).
 * Grid.tsx 에서 React.DragEvent<HTMLTableCellElement> 를 받아
 * `.nativeEvent` 로 DOM DragEvent 추출 후 이 핸들러에 전달.
 */
export interface DragThProps {
  /** pinned=true → false, enabled=true → true (AC-001/AC-004). */
  draggable: boolean;
  onDragStart: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onDragEnd: (e: DragEvent) => void;
}
