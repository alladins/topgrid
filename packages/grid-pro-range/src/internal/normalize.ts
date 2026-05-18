/**
 * @topgrid/grid-pro-range — 순수 범위 유틸 함수 (AC-002).
 *
 * normalizeRange: start ≤ end 방향으로 정규화 (역방향 드래그 지원).
 * isInRange: 좌표가 범위 내 포함 여부 판별.
 *
 * 두 함수 모두 부수효과 없음 — 순수 함수 (pure functions).
 */
import type { CellCoord, CellRange } from '../types';

/**
 * CellRange를 start ≤ end 방향으로 정규화.
 *
 * 드래그 방향과 무관하게 항상 정규화된 범위를 반환.
 * 역방향(end < start) 입력도 올바르게 처리.
 *
 * @example
 * normalizeRange({ start: {row:3, col:2}, end: {row:0, col:0} })
 * // → { start: {row:0, col:0}, end: {row:3, col:2} }
 */
export function normalizeRange(range: CellRange): CellRange {
  return {
    start: {
      row: Math.min(range.start.row, range.end.row),
      col: Math.min(range.start.col, range.end.col),
    },
    end: {
      row: Math.max(range.start.row, range.end.row),
      col: Math.max(range.start.col, range.end.col),
    },
  };
}

/**
 * 주어진 좌표(row, col)가 범위 내에 포함되는지 판별.
 *
 * range가 null이면 항상 false 반환.
 *
 * @example
 * isInRange(1, 1, { start: {row:0,col:0}, end: {row:2,col:2} }) // → true
 * isInRange(3, 3, { start: {row:0,col:0}, end: {row:2,col:2} }) // → false
 * isInRange(0, 0, null) // → false
 */
export function isInRange(
  row: number,
  col: number,
  range: CellRange | null,
): boolean {
  if (!range) return false;
  const n = normalizeRange(range);
  return (
    row >= n.start.row &&
    row <= n.end.row &&
    col >= n.start.col &&
    col <= n.end.col
  );
}

// Re-export CellCoord type for internal consumers
export type { CellCoord };
