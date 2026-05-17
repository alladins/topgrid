import type { MergeRowsConfig, MergeSpanMap } from './types';

/**
 * 데이터 배열과 병합 대상 컬럼 목록을 받아 MergeSpanMap을 계산한다.
 *
 * **Hierarchical ancestorBoundary 알고리즘 (G-002, ADR-MOD-GRID-13-006)**:
 * 단일 패스 O(N×C) — 행(i)을 순회하면서 컬럼(j)을 왼쪽에서 오른쪽 순서로 평가.
 * 좌측 컬럼에서 경계(boundary)가 발생하면 우측 컬럼에도 강제 경계를 전파한다.
 * (`ancestorBoundary` 플래그 — 행 전환마다 초기화)
 *
 * **Regression Invariant (AC-002, ADR-MOD-GRID-13-008)**:
 * `columns.length === 1` 시 좌측 컬럼이 없으므로 `ancestorBoundary`는 항상 `false`.
 * 결과적으로 자신의 `compareFn`만 평가하며, G-001 출력과 비트 동일한 Map을 생성한다.
 *
 * @param rows    - 렌더링 순서의 TData 배열 (getSortedRowModel / getFilteredRowModel 결과)
 * @param columns - 병합 컬럼 정보 배열 (id + mergeRows 설정). 배열 순서 = 좌→우 = 높→낮 우선순위 (ADR-MOD-GRID-13-007)
 * @returns       - 키 `${rowIdx}_${colId}` → rowSpan 숫자의 Map
 *                  skip 셀은 0으로 존재 (MergingGrid에서 null 반환 트리거)
 *                  rows가 빈 배열이면 빈 Map 반환 (EC-001)
 *
 * @example
 * // 단일 컬럼 — G-001과 동일 출력 (Regression Invariant)
 * const spanMap = computeMergeSpans(
 *   [{ dept: 'A' }, { dept: 'A' }, { dept: 'B' }],
 *   [{ id: 'dept', mergeRows: true }]
 * );
 * // spanMap.get('0_dept') === 2
 * // spanMap.get('1_dept') === 0
 * // spanMap.get('2_dept') === 1
 *
 * @example
 * // 복수 컬럼 계층 병합 — dept 경계 시 team도 강제 경계
 * const spanMap = computeMergeSpans(rows, [
 *   { id: 'dept', mergeRows: true },  // 좌측 — 높은 우선순위
 *   { id: 'team', mergeRows: true },  // 우측 — dept 경계에 종속
 * ]);
 */
export function computeMergeSpans<TData>(
  rows: TData[],
  columns: Array<{
    id: string;
    mergeRows: MergeRowsConfig<TData>;
  }>
): MergeSpanMap {
  const spanMap: MergeSpanMap = new Map();

  // EC-001: 빈 배열 → 빈 Map 반환
  if (rows.length === 0) {
    return spanMap;
  }

  // 각 컬럼 compareFn 해석 (mergeRows 미설정이면 null)
  const fns = columns.map((col) => {
    if (!col.mergeRows) return null;
    if (col.mergeRows === true) {
      return (prev: TData, curr: TData): boolean =>
        (prev as Record<string, unknown>)[col.id] ===
        (curr as Record<string, unknown>)[col.id];
    }
    return col.mergeRows as (prev: TData, curr: TData) => boolean;
  });

  // 컬럼별 span 상태 초기화
  const spanStart = columns.map(() => 0);
  const spanCount = columns.map(() => 1);

  // 단일 패스: 행 전환 i-1 → i
  for (let i = 1; i < rows.length; i++) {
    // 이 행 전환에서의 좌측 경계 누적 (행마다 초기화)
    let ancestorBoundary = false;

    for (let j = 0; j < columns.length; j++) {
      const fn = fns[j];
      // mergeRows 미설정 컬럼은 skip — ancestorBoundary는 유지 (EC-002: 중간 미설정 컬럼 무시)
      if (fn === null) continue;

      const ownBoundary = !fn(rows[i - 1], rows[i]);
      const hasBoundary = ownBoundary || ancestorBoundary;

      if (hasBoundary) {
        // 이전 그룹 flush
        spanMap.set(`${spanStart[j]}_${columns[j].id}`, spanCount[j]);
        spanStart[j] = i;
        spanCount[j] = 1;
        // 이 컬럼 경계 → 우측 컬럼에 전파
        ancestorBoundary = true;
      } else {
        // 동일 그룹 — skip 셀로 표시
        spanCount[j]++;
        spanMap.set(`${i}_${columns[j].id}`, 0);
      }
    }
  }

  // 마지막 그룹 flush
  for (let j = 0; j < columns.length; j++) {
    if (fns[j] !== null) {
      spanMap.set(`${spanStart[j]}_${columns[j].id}`, spanCount[j]);
    }
  }

  return spanMap;
}
