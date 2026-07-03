/**
 * @topgrid/grid-pro-pivot — pivot 행 그룹 expand/collapse (MOD-GRID-31 G-2) — 순수.
 *
 * 모델은 subtotal 을 각 그룹 **하단**에 방출한다(자식이 subtotal 위에 렌더 — 상단 group-header 없음).
 * 그래서 collapse 어포던스 = **subtotal 행 자체**(자기 위의 후손 행을 숨김). AG 의 상단 chevron 과 상하
 * 반전이지만 모델을 따른다(computePivot emit 미수정 = MOD-18 보존).
 *
 * 후손 판별(임의 중첩): subtotal 이 depth d 에서 그룹을 닫으면, 그 **바로 앞**의 연속 행 중 depth > d 인
 * 것들이 후손이다(첫 depth ≤ d 행에서 멈춤 = 이전 그룹 경계). 정렬 후에도 data 행은 세그먼트 내에 연속
 * 유지되므로(sortPivotRows 가 subtotal 앵커) `collapse(sort(rows))` 합성이 안전하다.
 *
 * 타입만 import(런타임 0) → node strip-types 직접 실행.
 */

import type { PivotRow } from './types';

/**
 * collapse 된 subtotal(`__id` ∈ collapsedIds)의 후손 행을 제거한 가시 행 배열. subtotal 자신은 그룹
 * 대표로 잔존, grandTotal 불변.
 *
 * @param rows - pivot 행(원본 `model.rows` 또는 `sortPivotRows` 결과 — 합성 체인 가능).
 * @param collapsedIds - collapse 된 subtotal 의 `__id` 집합.
 */
export function collapsePivotRows(
  rows: readonly PivotRow[],
  collapsedIds: ReadonlySet<string>,
): PivotRow[] {
  if (collapsedIds.size === 0) return rows as PivotRow[];

  const hidden = new Set<number>();
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r.__kind === 'subtotal' && collapsedIds.has(r.__id)) {
      // 바로 앞의 연속 후손(depth > 이 subtotal 의 depth)을 숨김.
      for (let j = i - 1; j >= 0; j--) {
        if (rows[j].__depth > r.__depth) hidden.add(j);
        else break; // depth ≤ d → 이전 그룹 경계, 정지
      }
    }
  }

  return rows.filter((_, i) => !hidden.has(i));
}
