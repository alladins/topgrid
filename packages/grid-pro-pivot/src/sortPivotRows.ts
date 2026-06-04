/**
 * @topgrid/grid-pro-pivot — pivot 결과 정렬 (MOD-GRID-31 G-1) — 순수.
 *
 * ★ grid-core `enableSort` 를 `<Grid>` 에 넘기면 평탄 배열 전체(subtotal/grandTotal 포함)를 섞어 정렬한다
 * (갭분석 명시). pivot-aware 정렬은 **그룹 내에서만** data 행을 재정렬하고 합성 행을 앵커한다:
 * - rows 를 **세그먼트**(연속한 `data` 행 run, `subtotal`/`grandTotal` 이 종료)로 나눈다.
 * - 각 세그먼트 *내부*의 data 행만 값 셀(`row[leafKey]`)로 재정렬한다.
 * - subtotal/grandTotal 은 위치 불변(앵커) — 종료자는 자기 자리에 그대로 push.
 * - **null 셀은 항상 하단**(asc/desc 무관) — 빈 교차셀이 정렬 상단을 차지하지 않게.
 *
 * 스코프(G-1): 그룹 *자체*를 subtotal 값으로 정렬하는 계층 정렬은 vN. 본 함수는 sibling(그룹 내) 정렬만.
 * 타입만 import(런타임 0) → node strip-types 직접 실행.
 */

import type { PivotModel, PivotRow } from './types';

export type PivotSortDirection = 'asc' | 'desc';

/** 현재 활성 정렬 상태(값 컬럼 leafKey + 방향). */
export interface PivotSortState {
  leafKey: string;
  dir: PivotSortDirection;
}

/** 값 셀 비교 — null 은 항상 하단; 그 외 dir 방향 수치 비교. */
function compareCell(a: unknown, b: unknown, dir: PivotSortDirection): number {
  const an = a === null || a === undefined;
  const bn = b === null || b === undefined;
  if (an && bn) return 0;
  if (an) return 1; // a(null) → 뒤
  if (bn) return -1; // b(null) → 뒤
  const diff = (a as number) - (b as number);
  return dir === 'asc' ? diff : -diff;
}

/**
 * 그룹(세그먼트) 내에서 data 행을 `leafKey` 값으로 정렬한 새 행 배열. subtotal/grandTotal 앵커 유지.
 *
 * @param model - pivot 모델.
 * @param leafKey - 정렬 기준 값 컬럼 키(`<comboKey>__<valueIndex>` 또는 grand-total 컬럼 키).
 * @param dir - 'asc' | 'desc'.
 */
export function sortPivotRows(
  model: PivotModel,
  leafKey: string,
  dir: PivotSortDirection,
): PivotRow[] {
  const out: PivotRow[] = [];
  let segment: PivotRow[] = [];

  const flush = (): void => {
    if (segment.length > 0) {
      segment.sort((a, b) => compareCell(a[leafKey], b[leafKey], dir));
      out.push(...segment);
      segment = [];
    }
  };

  for (const row of model.rows) {
    if (row.__kind === 'data') {
      segment.push(row);
    } else {
      flush(); // 그룹 종료 → 세그먼트 정렬 방출
      out.push(row); // subtotal/grandTotal 앵커(원위치)
    }
  }
  flush(); // 후행 data(grandTotal 이 마지막이라 보통 없음 — 방어)

  return out;
}
