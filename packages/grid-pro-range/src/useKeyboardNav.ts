/**
 * @topgrid/grid-pro-range — useKeyboardNav 훅 (AC-002~AC-007).
 *
 * 키보드 내비게이션 + Shift+방향키 범위 확장 headless React 훅.
 *
 * D4: controlled 패턴 — useCellRange 미수정, { range, onRangeChange } 수신.
 * D3: handleKeyDown → Grid container <div tabIndex={0}> 부착.
 * ADR-MOD-GRID-11-006: normalize-on-extend + anchor 유지 패턴 재사용.
 */
import { useCallback, useRef } from 'react';
import type { Table } from '@tanstack/react-table';

import type { CellCoord, CellRange } from './types';
import { normalizeRange } from './internal/normalize';

export interface UseKeyboardNavOptions<TData> {
  /** TanStack table 인스턴스 (경계 계산용 — D5). */
  table: Table<TData>;
  /** 현재 활성 셀 좌표 (controlled). */
  activeCell: CellCoord | null;
  /** 활성 셀 변경 콜백. */
  onActiveCellChange: (cell: CellCoord) => void;
  /** 현재 선택 범위 (useCellRange에서 수신 — D4 controlled). */
  range: CellRange | null;
  /** 범위 변경 콜백 (useCellRange의 onRangeChange와 동일 시그니처 — D4). */
  onRangeChange: (range: CellRange | null) => void;
  /** Ctrl+Arrow data-edge 탐색 함수 (선택적). */
  getCellValue?: (row: number, col: number) => unknown;
}

export interface UseKeyboardNavReturn {
  /** Grid container에 부착할 keydown 핸들러 (D3). */
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

export function useKeyboardNav<TData>(
  options: UseKeyboardNavOptions<TData>,
): UseKeyboardNavReturn {
  const { table, activeCell, onActiveCellChange, range, onRangeChange, getCellValue } = options;

  // anchor ref: Shift+Arrow 시 start 고정 (ADR-MOD-GRID-11-006 anchor 유지 패턴)
  const anchorCellRef = useRef<CellCoord | null>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const rowCount = table.getRowModel().rows.length;
      const colCount = table.getAllColumns().filter((c) => c.getIsVisible()).length;

      if (rowCount === 0 || colCount === 0) return;

      const current = activeCell ?? { row: 0, col: 0 };

      const clampRow = (r: number) => Math.max(0, Math.min(r, rowCount - 1));
      const clampCol = (c: number) => Math.max(0, Math.min(c, colCount - 1));

      const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
      const isTab = e.key === 'Tab';
      const isEnter = e.key === 'Enter';

      if (!isArrow && !isTab && !isEnter) return;

      e.preventDefault();

      if (isArrow) {
        const delta: Record<string, CellCoord> = {
          ArrowUp:    { row: -1, col: 0 },
          ArrowDown:  { row: 1,  col: 0 },
          ArrowLeft:  { row: 0,  col: -1 },
          ArrowRight: { row: 0,  col: 1 },
        };
        const d = delta[e.key];
        if (d === undefined) return;

        if (e.shiftKey) {
          // anchor 유지 패턴: 첫 Shift+Arrow 시 anchor 세팅
          if (anchorCellRef.current === null) {
            anchorCellRef.current = range?.start ?? current;
          }
          const anchor = anchorCellRef.current;

          // cursor = range.end (또는 activeCell) 이동
          const cursor = range?.end ?? current;
          let nextCursor: CellCoord;

          if (e.ctrlKey) {
            // Ctrl+Shift+Arrow: data-edge까지 확장
            nextCursor = findDataEdge(cursor, e.key, rowCount, colCount, getCellValue);
          } else {
            nextCursor = {
              row: clampRow(cursor.row + d.row),
              col: clampCol(cursor.col + d.col),
            };
          }

          // normalize-on-extend 패턴 (ADR-MOD-GRID-11-006)
          const newRange = normalizeRange({ start: anchor, end: nextCursor });
          onRangeChange(newRange);
          // activeCell은 cursor 위치 추적
          onActiveCellChange(nextCursor);
        } else {
          // 일반 Arrow: anchor 초기화, 범위 해제
          anchorCellRef.current = null;
          onRangeChange(null);

          if (e.ctrlKey) {
            // Ctrl+Arrow: data-edge 이동
            const next = findDataEdge(current, e.key, rowCount, colCount, getCellValue);
            onActiveCellChange(next);
          } else {
            onActiveCellChange({
              row: clampRow(current.row + d.row),
              col: clampCol(current.col + d.col),
            });
          }
        }
      } else if (isTab) {
        anchorCellRef.current = null;
        onRangeChange(null);

        if (e.shiftKey) {
          // Shift+Tab: 역방향 (AC-005)
          if (current.col > 0) {
            onActiveCellChange({ row: current.row, col: current.col - 1 });
          } else if (current.row > 0) {
            onActiveCellChange({ row: current.row - 1, col: colCount - 1 });
          }
        } else {
          // Tab: wrap (AC-005)
          if (current.col < colCount - 1) {
            onActiveCellChange({ row: current.row, col: current.col + 1 });
          } else if (current.row < rowCount - 1) {
            onActiveCellChange({ row: current.row + 1, col: 0 });
          }
        }
      } else if (isEnter) {
        anchorCellRef.current = null;
        onRangeChange(null);
        // Enter: 아래로 이동 (AC-006)
        if (current.row < rowCount - 1) {
          onActiveCellChange({ row: current.row + 1, col: current.col });
        }
      }
    },
    [table, activeCell, onActiveCellChange, range, onRangeChange, getCellValue],
  );

  return { handleKeyDown };
}

/** Ctrl+Arrow data-edge 탐색 (AC-007). */
function findDataEdge(
  start: CellCoord,
  key: string,
  rowCount: number,
  colCount: number,
  getCellValue?: (row: number, col: number) => unknown,
): CellCoord {
  if (getCellValue === undefined) {
    // getCellValue 미제공: 경계로 이동
    switch (key) {
      case 'ArrowUp':    return { row: 0,            col: start.col };
      case 'ArrowDown':  return { row: rowCount - 1, col: start.col };
      case 'ArrowLeft':  return { row: start.row,    col: 0 };
      case 'ArrowRight': return { row: start.row,    col: colCount - 1 };
      default:           return start;
    }
  }
  let { row, col } = start;
  let dRow = 0;
  let dCol = 0;
  switch (key) {
    case 'ArrowUp':    dRow = -1; break;
    case 'ArrowDown':  dRow =  1; break;
    case 'ArrowLeft':  dCol = -1; break;
    case 'ArrowRight': dCol =  1; break;
    default:           return start;
  }
  while (
    row + dRow >= 0 && row + dRow < rowCount &&
    col + dCol >= 0 && col + dCol < colCount
  ) {
    const nextVal = getCellValue(row + dRow, col + dCol);
    if (nextVal === undefined || nextVal === null || nextVal === '') break;
    row += dRow;
    col += dCol;
  }
  return { row, col };
}
