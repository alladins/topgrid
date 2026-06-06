/**
 * @topgrid/grid-pro-pivot — pivot total customization (MOD-GRID-44 G-1) — 순수.
 *
 * computePivot 은 subtotal/grandTotal 을 항상 고정 순서·위치로 방출한다. 본 변환은 그 결과(model.rows)에서
 * **row-total 연산**만 조정한다: subtotal 행 억제·grandTotal 행 억제·grandTotal 위치(top/bottom). data 행 불변.
 *
 * ★ scope(advisor): **column grand-total**(`GRAND_TOTAL_COLUMN_KEY` 컬럼) 토글은 rows 변환이 아니라
 * buildPivotColumns/render 관심사 → 본 변환 밖(후속). 여기서 컬럼을 건드리려 하면 silent no-op.
 *
 * 타입만 import(런타임 0) → node strip-types 직접 실행. computePivot/grid-core 무수정(MOD-18/31 보존).
 */

import type { PivotRow } from './types';

/** total customization 옵션(전부 optional — 미지정 = 기존 동작). */
export interface PivotTotalsOpts {
  /** subtotal 행 표시 여부(기본 true). false → 모든 subtotal 행 제거. */
  subtotals?: boolean;
  /** grandTotal 행 표시 여부(기본 true). false → grandTotal 행 제거. */
  grandTotal?: boolean;
  /** grandTotal 행 위치(기본 'bottom'). 'top' → 맨 위로 이동. */
  grandTotalPosition?: 'top' | 'bottom';
}

/**
 * model.rows 에 row-total 커스터마이즈 적용(순수, 새 배열). data 행·상대 순서 보존(grandTotal 이동 제외).
 *
 * @param rows - pivot 행(원본 `model.rows` 또는 MOD-31 변환 결과 — 합성 체인 가능).
 * @param opts - {@link PivotTotalsOpts}.
 */
export function customizePivotTotals(
  rows: readonly PivotRow[],
  opts: PivotTotalsOpts = {},
): PivotRow[] {
  const showSubtotals = opts.subtotals !== false;
  const showGrandTotal = opts.grandTotal !== false;
  const position = opts.grandTotalPosition ?? 'bottom';

  let out = rows.filter((r) => {
    if (r.__kind === 'subtotal') return showSubtotals;
    if (r.__kind === 'grandTotal') return showGrandTotal;
    return true; // data 행은 항상 보존
  });

  if (showGrandTotal && position === 'top') {
    const grand = out.filter((r) => r.__kind === 'grandTotal');
    const rest = out.filter((r) => r.__kind !== 'grandTotal');
    out = [...grand, ...rest];
  }

  return out;
}
