/**
 * computeSheetMerges — 스프레드시트 셀 병합(merged cells) 순수 모델 (MOD-GRID-74).
 *
 * **reuse-gate([[LESS-003]])**: grid-pro-merging 의 `computeColSpans`(1-행 가로 콜백) /
 * `computeMergeSpans`(value-run 세로 rowSpan)와 의미가 다르다 — 시트 병합은 **명시적 사각 범위**
 * (`A1:C2` = 3열×2행 블록을 동시 span)다. 따라서 별도 모델(검증 후 분리, advisor).
 *
 * 입력은 A1 범위 문자열 배열(`['A1:C2', 'B5:B7']`). 각 범위에서:
 *  - 좌상단(top-left) = **anchor** 셀 → `<td rowSpan colSpan>` 로 렌더.
 *  - 나머지 사각형 셀 = **covered** → `<td>` 자체를 렌더하지 않음(HTML table 병합 규약).
 *
 * 경계 규칙: 그리드(rows×cols) 밖으로 나가는 to 는 clamp, anchor 가 밖이면 범위 무시.
 * 1×1(=병합 아님)은 무시. **겹침은 first-wins**(이미 anchor/covered 인 셀을 건드리는 범위는 무시).
 */
import { parseA1, toA1 } from './cellAddress.js';

export interface MergeSpan {
  rowSpan: number;
  colSpan: number;
}

export interface SheetMergeResult {
  /** anchor 셀 ref → span. `<td>` 에 rowSpan/colSpan 적용. */
  anchors: Map<string, MergeSpan>;
  /** 피복 셀 ref 집합. 렌더 시 `<td>` 생략. */
  covered: Set<string>;
}

/**
 * @param merges A1 범위 문자열 배열(예 `'A1:C2'`). `:` 없는 단일 셀은 무시(1×1).
 * @param rows   그리드 행 수(0-based 범위 [0, rows-1]).
 * @param cols   그리드 열 수.
 */
export function computeSheetMerges(
  merges: readonly string[],
  rows: number,
  cols: number,
): SheetMergeResult {
  const anchors = new Map<string, MergeSpan>();
  const covered = new Set<string>();

  for (const spec of merges) {
    const colon = spec.indexOf(':');
    if (colon === -1) continue; // single cell → no merge
    let a: { col: number; row: number };
    let b: { col: number; row: number };
    try {
      a = parseA1(spec.slice(0, colon).trim());
      b = parseA1(spec.slice(colon + 1).trim());
    } catch {
      continue; // malformed → skip
    }

    let c0 = Math.min(a.col, b.col);
    let r0 = Math.min(a.row, b.row);
    let c1 = Math.max(a.col, b.col);
    let r1 = Math.max(a.row, b.row);

    // anchor out of grid → ignore entire range
    if (c0 >= cols || r0 >= rows || c0 < 0 || r0 < 0) continue;
    // clamp far edge into the grid
    c1 = Math.min(c1, cols - 1);
    r1 = Math.min(r1, rows - 1);

    if (r1 === r0 && c1 === c0) continue; // 1×1 after clamp → no merge

    // collect this range's cells; detect conflict with already-merged cells
    const anchorRef = toA1(c0, r0);
    const cells: string[] = [];
    let conflict = false;
    for (let c = c0; c <= c1 && !conflict; c++) {
      for (let r = r0; r <= r1; r++) {
        const ref = toA1(c, r);
        if (anchors.has(ref) || covered.has(ref)) {
          conflict = true;
          break;
        }
        cells.push(ref);
      }
    }
    if (conflict) continue; // first-wins

    anchors.set(anchorRef, { rowSpan: r1 - r0 + 1, colSpan: c1 - c0 + 1 });
    for (const ref of cells) {
      if (ref !== anchorRef) covered.add(ref);
    }
  }

  return { anchors, covered };
}
