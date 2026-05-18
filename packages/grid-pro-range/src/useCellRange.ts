/**
 * @topgrid/grid-pro-range — useCellRange 훅 (AC-003, AC-004, AC-006).
 *
 * 마우스 드래그/Shift+Click 셀 범위 선택 핸들러를 제공하는 headless React 훅.
 *
 * 라이선스 검증: index.ts module-load checkLicense() 호출로 처리 (ADR-MOD-GRID-00-012 Sunset 완료).
 */
import { useCallback, useRef, useState } from 'react';

import type { CellCoord, CellRange } from './types';
import { normalizeRange } from './internal/normalize';

/** useCellRange 훅 반환 타입 (AC-003, AC-004, AC-006). */
export interface UseCellRangeReturn {
  /** 현재 선택된 셀 범위. 선택 없으면 null. */
  range: CellRange | null;
  /** 드래그 중 여부. */
  dragging: boolean;
  /**
   * 셀 mousedown 핸들러.
   * @param row 0-based 행 인덱스
   * @param col 0-based 열 인덱스
   * @param shiftKey Shift 키 눌림 여부
   */
  handleMouseDown: (row: number, col: number, shiftKey: boolean) => void;
  /**
   * 셀 mouseenter 핸들러 (드래그 범위 확장).
   * @param row 0-based 행 인덱스
   * @param col 0-based 열 인덱스
   */
  handleMouseEnter: (row: number, col: number) => void;
  /** mouseup 핸들러 (드래그 종료). */
  handleMouseUp: () => void;
}

/**
 * 마우스 드래그/Shift+Click 셀 범위 선택 훅.
 *
 * @param onRangeChange 범위 변경 시 호출되는 콜백 (AC-006).
 * @returns 범위 state + 이벤트 핸들러 3종.
 *
 * @example
 * ```tsx
 * const { range, handleMouseDown, handleMouseEnter, handleMouseUp } =
 *   useCellRange((r) => console.log('range changed:', r));
 * ```
 */
export function useCellRange(
  onRangeChange?: (range: CellRange | null) => void,
): UseCellRangeReturn {
  const [range, setRange] = useState<CellRange | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<CellCoord | null>(null);

  const handleMouseDown = useCallback(
    (row: number, col: number, shiftKey: boolean) => {
      if (shiftKey && range) {
        // Shift+Click: 기존 start 유지, 새 end로 범위 확장 (AC-004).
        const newRange = normalizeRange({ start: range.start, end: { row, col } });
        setRange(newRange);
        onRangeChange?.(newRange);
      } else {
        // 새 drag start (AC-003).
        dragStart.current = { row, col };
        setDragging(true);
        const newRange: CellRange = { start: { row, col }, end: { row, col } };
        setRange(newRange);
        onRangeChange?.(newRange);
      }
    },
    [range, onRangeChange],
  );

  const handleMouseEnter = useCallback(
    (row: number, col: number) => {
      if (!dragging || !dragStart.current) return;
      // 드래그 중 범위 확장 (AC-003).
      const newRange = normalizeRange({
        start: dragStart.current,
        end: { row, col },
      });
      setRange(newRange);
      onRangeChange?.(newRange);
    },
    [dragging, onRangeChange],
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  return { range, dragging, handleMouseDown, handleMouseEnter, handleMouseUp };
}
