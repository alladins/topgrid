/**
 * @topgrid/grid-pro-agg — 전역 집계 행 계산 (MOD-GRID-45) — 순수, no React.
 *
 * grand-total footer 와 auto-aggregation floating rows 의 공유 compute: source 행 집합을 컬럼별 집계값 한 행으로.
 *
 * ★ avg-of-avgs 안전(advisor): 집계는 **source 행에서 직접** 계산한다(그룹 부분합을 결합하지 않음). sum/min/max 는
 * 결합해도 살지만 **avg(평균의 평균)·count(카운트의 카운트)는 깨진다** → 전체를 source 에서 재집계해야 정확.
 *
 * ★ 로컬 `number[]` 리듀서(ADR-001): grid-pro-agg 의 기존 집계는 TanStack `AggregationFn`(Row-based, 행 모델 필요)
 * 이라 node-순수가 아니다. pivot 의 `BUILT_IN_REDUCERS`(별 패키지)도 강제 재사용 안 함(ADR-001) — 로컬 number[]
 * 리듀서를 둔다(입력 계약이 다름: 여긴 raw 행 배열에서 컬럼 값 추출).
 *
 * 타입만 import(런타임 0) → node strip-types 직접 실행.
 */

import type { AggregationFnKey } from './types';

/** 컬럼 → 집계 함수 키. */
export type AggregateSpec = Record<string, AggregationFnKey>;

/** 한 컬럼의 source 값에서 number 만 추출(빈/비수치 무시 — Excel range 집계 동형). */
function collectColumnNumbers(data: readonly Record<string, unknown>[], col: string): number[] {
  const nums: number[] = [];
  for (const row of data) {
    const v = row[col];
    if (typeof v === 'number' && Number.isFinite(v)) nums.push(v);
    else if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v);
      if (Number.isFinite(n)) nums.push(n);
    }
  }
  return nums;
}

/**
 * 로컬 number[] 리듀서. 빈 집합: sum→0·count→0·avg/min/max→null(미정의). `rowCount` = 집계 대상 *행* 수
 * (count 는 TanStack 'count' 처럼 컬럼 값이 아니라 행을 센다).
 */
function reduceAgg(fn: AggregationFnKey, nums: number[], rowCount: number): number | null {
  switch (fn) {
    case 'sum':
      return nums.reduce((a, b) => a + b, 0);
    case 'avg':
      return nums.length === 0 ? null : nums.reduce((a, b) => a + b, 0) / nums.length;
    case 'min':
      return nums.length === 0 ? null : Math.min(...nums);
    case 'max':
      return nums.length === 0 ? null : Math.max(...nums);
    case 'count':
      return rowCount; // 행 수(TanStack count 동형 — 값 존재 무관)
  }
}

/**
 * MOD-GRID-45: source 행 집합 → 컬럼별 집계값 한 행(grand-total footer / auto-agg floating 공유).
 *
 * @param data - 집계할 source 행(grand-total=전체, 부분집합도 가능).
 * @param spec - 컬럼별 집계 함수 키.
 * @returns `{ [columnId]: number | null }` (빈 집합 avg/min/max=null).
 */
export function computeAggregateRow(
  data: readonly Record<string, unknown>[],
  spec: AggregateSpec,
): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const [col, fn] of Object.entries(spec)) {
    out[col] = reduceAgg(fn, collectColumnNumbers(data, col), data.length);
  }
  return out;
}
