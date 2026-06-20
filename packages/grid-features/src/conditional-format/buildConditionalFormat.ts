import type {
  CellClassNameCallback,
  RowClassNameCallback,
} from '@topgrid/grid-core';
import type { RowFormatRule, CellFormatRule } from './types';

/**
 * 선언적 행 룰 배열 → grid-core `RowClassNameCallback` 컴파일 (MOD-GRID-24 G-1).
 *
 * 매칭되는 모든 룰의 className 을 룰 순서대로 공백 join 한다(다중 적용 허용).
 * 매칭 0 → `undefined`(콜백 계약: 추가 없음). 순수 함수 — 부작용 없음.
 *
 * @example
 * <Grid rowClassName={buildRowClassName([
 *   { when: (_, i) => i % 2 === 1, className: 'bg-gray-50' },     // 줄무늬(alternating)
 *   { when: (d) => d.status === 'error', className: 'text-red-600' },
 * ])} />
 */
export function buildRowClassName<TData>(
  rules: RowFormatRule<TData>[],
): RowClassNameCallback<TData> {
  return (row) => {
    const matched = rules
      .filter((rule) => rule.when(row.original, row.index))
      .map((rule) => rule.className);
    return matched.length > 0 ? matched.join(' ') : undefined;
  };
}

/**
 * 선언적 셀 룰 배열 → grid-core `CellClassNameCallback` 컴파일 (MOD-GRID-24 G-1).
 *
 * 술어는 `ctx.value`(값)와 `ctx.row`(행 데이터)을 받는다(grid-core 1.0 ADR-006 D3: clean ctx).
 * join/undefined 규칙은 `buildRowClassName` 과 동일. 순수 함수.
 *
 * @example
 * <Grid cellClassName={buildCellClassName<Order, number>([
 *   { when: (v) => v < 0, className: 'text-red-600' },
 * ])} />
 */
export function buildCellClassName<TData, TValue = unknown>(
  rules: CellFormatRule<TData, TValue>[],
): CellClassNameCallback<TData> {
  return (ctx) => {
    const value = ctx.value as TValue;
    const data = ctx.row;
    const matched = rules
      .filter((rule) => rule.when(value, data))
      .map((rule) => rule.className);
    return matched.length > 0 ? matched.join(' ') : undefined;
  };
}
