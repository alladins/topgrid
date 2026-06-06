/**
 * @topgrid/grid-pro-pivot — pivot 결과 필터 (MOD-GRID-44 G-2) — 순수.
 *
 * computePivot 결과(model.rows)의 **data 행**을 predicate 로 필터한다(집계 값 셀 기준 등). subtotal/grandTotal
 * 은 **건드리지 않는다**.
 *
 * ★ subtotal coherence(advisor CATCH) — 선택한 의미 = **(a) totals-over-all**: subtotal/grandTotal 은 *원 그룹
 * 전체*의 true-group 집계로 **유지**한다. 따라서 필터로 자식 data 행이 줄어도 그 subtotal 값은 **불변**이다(표시
 * 자식과 불일치할 수 있음 = 문서화된 한계, LESS-004). **가시 셀 재집계 금지**(avg-of-avgs — SUM 만 맞고 AVG/COUNT
 * 틀림). 진짜 부분합을 원하면 소비자가 source 를 필터해 computePivot 을 재실행한다.
 *
 * 타입만 import(런타임 0) → node strip-types 직접 실행. computePivot/grid-core 무수정.
 */

import type { PivotRow } from './types';

/**
 * data 행만 predicate 로 필터(순수, 새 배열). subtotal/grandTotal/order 보존(true-group).
 *
 * @param rows - pivot 행(원본 `model.rows` 또는 MOD-31/44 변환 결과 — 합성 체인 가능).
 * @param predicate - data 행 유지 조건(집계 셀 `row['<colKey>__<i>']` 등 접근).
 */
export function filterPivotRows(
  rows: readonly PivotRow[],
  predicate: (row: PivotRow) => boolean,
): PivotRow[] {
  return rows.filter((r) => (r.__kind === 'data' ? predicate(r) : true));
}
