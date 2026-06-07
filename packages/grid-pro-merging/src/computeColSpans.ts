import type { ColSpanFn, ColSpanMap } from './types';

/**
 * 데이터 배열과 컬럼별 colSpan 콜백을 받아 본문 셀의 가로 병합(colSpan) Map을 계산한다.
 *
 * **computeMergeSpans(rowSpan)의 수평 쌍둥이 (MOD-GRID-52, G-1)**:
 * 행마다 컬럼을 왼쪽→오른쪽으로 순회. 어떤 셀이 colSpan=n(>1)을 선언하면 그 셀이 시작 셀이 되고
 * 우측 n-1개 셀은 "피복(covered)"되어 skip(0)으로 표시된다. 피복된 셀 자신의 colSpan 콜백은
 * 평가하지 않는다(**skip-of-skip** — 이미 가려진 셀은 스팬을 시작할 수 없음).
 *
 * **clamp**: colSpan 이 행의 남은 컬럼 수를 초과하면 남은 수로 절단한다(행 경계 밖 스팬 방지).
 * 비유한/1 미만 값은 1(스팬 없음)로 정규화한다.
 *
 * ★colSpan 은 **한 행 안에서만** 작동한다 — rowSpan(computeMergeSpans)의 행간 ancestorBoundary
 * 전파나 L-01 orphan(시작 셀이 가상 윈도 밖으로 스크롤) 문제가 **구조적으로 없다**.
 *
 * @param rows    - 렌더링 순서의 TData 배열 (getSortedRowModel / getFilteredRowModel 결과)
 * @param columns - 컬럼 정보 배열 (id + 선택적 colSpan 콜백). 배열 순서 = 좌→우 = getVisibleCells 순서.
 * @returns       - 키 `${rowIdx}_${colId}` → colSpan 숫자의 Map.
 *                  >1 = 스팬 시작 셀, 0 = 피복되어 skip(MergingGrid 에서 null 반환), 1/미존재 = 일반 셀.
 *                  rows 가 빈 배열이면 빈 Map.
 *
 * @example
 * // row 0 의 'b' 셀이 3컬럼(b,c,d) 스팬 → c,d 는 skip
 * const map = computeColSpans(
 *   [{ a: 1, b: 2, c: 3, d: 4, e: 5 }],
 *   [
 *     { id: 'a' },
 *     { id: 'b', colSpan: () => 3 },
 *     { id: 'c' }, { id: 'd' }, { id: 'e' },
 *   ]
 * );
 * // map.get('0_b') === 3 ; map.get('0_c') === 0 ; map.get('0_d') === 0
 * // 'a','e' 미존재(=일반 셀)
 */
export function computeColSpans<TData>(
  rows: TData[],
  columns: Array<{ id: string; colSpan?: ColSpanFn<TData> }>
): ColSpanMap {
  const map: ColSpanMap = new Map();
  const colCount = columns.length;

  for (let i = 0; i < rows.length; i++) {
    let covered = 0; // 우측으로 남은 skip 셀 수

    for (let j = 0; j < colCount; j++) {
      const colId = columns[j].id;

      // 피복된 셀: skip(0)으로 표시하고 자신의 colSpan 은 평가하지 않음 (skip-of-skip)
      if (covered > 0) {
        map.set(`${i}_${colId}`, 0);
        covered--;
        continue;
      }

      const fn = columns[j].colSpan;
      let span = fn ? fn({ row: rows[i], rowIndex: i }) : 1;
      // 정규화: 비유한/1 미만 → 1(스팬 없음)
      if (!Number.isFinite(span) || span < 1) span = 1;
      span = Math.floor(span);
      // clamp: 행의 남은 컬럼 수(자신 포함) 초과 금지
      const remaining = colCount - j;
      if (span > remaining) span = remaining;

      if (span > 1) {
        map.set(`${i}_${colId}`, span);
        covered = span - 1;
      }
      // span === 1 → 일반 셀: 미설정(렌더러가 undefined 를 1로 취급)
    }
  }

  return map;
}
