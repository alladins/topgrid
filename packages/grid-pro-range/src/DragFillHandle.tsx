/**
 * @tomis/grid-pro-range — DragFillHandle component (G-003).
 *
 * D4: isDraggingRef + dragStartRef + fillTargetRef 3개 ref로 drag 상태 추적.
 * ADR-MOD-GRID-11-006: mousedown/move/up 시퀀스 + drag state ref 패턴.
 */
import { useCallback, useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import type { CellRange, DragFillHandleProps, FillDirection } from './types';
import { normalizeRange } from './internal/normalize';
import { fillRange } from './internal/fillRange';

export function DragFillHandle<TCell = unknown>({
  range,
  getCellValue,
  onFillComplete,
  onFillTargetChange,
  rowCount,
  colCount,
  containerRef,
  getCellRect,
}: DragFillHandleProps<TCell>): ReactElement | null {
  // D4: Drag state refs (ADR-MOD-GRID-11-006 mousedown/move/up 패턴)
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const fillTargetRef = useRef<CellRange | null>(null);

  const clampRow = useCallback(
    (r: number) => Math.max(0, Math.min(r, rowCount - 1)),
    [rowCount],
  );
  const clampCol = useCallback(
    (c: number) => Math.max(0, Math.min(c, colCount - 1)),
    [colCount],
  );

  /** 마우스 좌표 → CellCoord 변환 (AC-004 가상화 호환) */
  const coordFromMouseEvent = useCallback(
    (clientX: number, clientY: number): { row: number; col: number } | null => {
      const container = containerRef.current;
      if (container === null) return null;
      const containerRect = container.getBoundingClientRect();
      const relX = clientX - containerRect.left;
      const relY = clientY - containerRect.top;

      // AC-004: 가상화 환경에서도 row/col index 정확하게 getCellRect 기반 hit-test
      for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < colCount; c++) {
          const rect = getCellRect(r, c);
          if (
            relX >= rect.x &&
            relX < rect.x + rect.width &&
            relY >= rect.y &&
            relY < rect.y + rect.height
          ) {
            return { row: clampRow(r), col: clampCol(c) };
          }
        }
      }
      return null;
    },
    [containerRef, rowCount, colCount, getCellRect, clampRow, clampCol],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      fillTargetRef.current = null;
    },
    [],
  );

  // window-level mousemove/mouseup: 컨테이너 밖으로 나가도 drag 유지 (D4)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || range === null) return;

      const targetCoord = coordFromMouseEvent(e.clientX, e.clientY);
      if (targetCoord === null) return;

      // 드래그 방향 감지 (D5)
      const { start, end } = range;
      let newTarget: CellRange | null = null;

      if (targetCoord.row > end.row) {
        // down
        newTarget = normalizeRange({
          start: { row: end.row + 1, col: start.col },
          end: { row: targetCoord.row, col: end.col },
        });
      } else if (targetCoord.row < start.row) {
        // up
        newTarget = normalizeRange({
          start: { row: targetCoord.row, col: start.col },
          end: { row: start.row - 1, col: end.col },
        });
      } else if (targetCoord.col > end.col) {
        // right
        newTarget = normalizeRange({
          start: { row: start.row, col: end.col + 1 },
          end: { row: end.row, col: targetCoord.col },
        });
      } else if (targetCoord.col < start.col) {
        // left
        newTarget = normalizeRange({
          start: { row: start.row, col: targetCoord.col },
          end: { row: end.row, col: start.col - 1 },
        });
      }

      fillTargetRef.current = newTarget;
      if (onFillTargetChange !== undefined) {
        onFillTargetChange(newTarget);
      }
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current || range === null) {
        isDraggingRef.current = false;
        return;
      }
      isDraggingRef.current = false;

      const target = fillTargetRef.current;
      if (target === null) return;

      // 방향 파생
      const { start, end } = range;
      let direction: FillDirection = 'down';
      let fillCount = 0;

      if (target.start.row > end.row) {
        direction = 'down';
        fillCount = target.end.row - end.row;
      } else if (target.end.row < start.row) {
        direction = 'up';
        fillCount = start.row - target.start.row;
      } else if (target.start.col > end.col) {
        direction = 'right';
        fillCount = target.end.col - end.col;
      } else {
        direction = 'left';
        fillCount = start.col - target.start.col;
      }

      if (fillCount > 0 && onFillComplete !== undefined) {
        const updates = fillRange<TCell>(range, direction, fillCount, getCellValue);
        onFillComplete(updates);
      }

      fillTargetRef.current = null;
      if (onFillTargetChange !== undefined) {
        onFillTargetChange(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [range, getCellValue, onFillComplete, onFillTargetChange, coordFromMouseEvent]);

  // range 없으면 핸들 미렌더링
  if (range === null) return null;

  // 핸들 위치: 소스 range 우하단 셀 rect 기준
  const endRect = getCellRect(range.end.row, range.end.col);
  const handleStyle: React.CSSProperties = {
    position: 'absolute',
    left: endRect.x + endRect.width - 4,
    top: endRect.y + endRect.height - 4,
  };

  return (
    // Tailwind: absolute 2×2 파란 핸들 (C-5 — CSS 파일 미사용)
    <div
      role="presentation"
      style={handleStyle}
      className="absolute w-2 h-2 bg-blue-500 cursor-crosshair border border-white z-10"
      onMouseDown={handleMouseDown}
    />
  );
}
