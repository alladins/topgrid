/**
 * @tomis/grid-pro-range — Drag-fill pure functions (G-003).
 *
 * fillRange: 소스 범위 값을 지정 방향·개수만큼 CellUpdate 배열로 생성.
 * detectSeriesStep: 숫자 배열에서 등차 step 감지.
 *
 * 두 함수 모두 부수효과 없음 — 순수 함수 (pure functions).
 * 제네릭 <TCell> 사용 — any 미사용 (AC-001, AC-002).
 */
import type { CellRange, CellUpdate, FillDirection } from '../types';

/**
 * 숫자 배열에서 등차 step 감지.
 * 요소가 1개이면 step = 0 (단순 복사).
 * 요소가 2개 이상이고 모두 step 동일하면 해당 step 반환.
 * step 불일치 시 null 반환 (단순 복사 모드).
 */
export function detectSeriesStep(values: number[]): number | null {
  if (values.length < 2) return 0;
  const step = values[1] - values[0];
  for (let i = 2; i < values.length; i++) {
    if (values[i] - values[i - 1] !== step) return null;
  }
  return step;
}

/**
 * 소스 범위 값을 채울 방향·개수만큼 CellUpdate 배열 생성.
 * 제네릭 <TCell> — any 미사용 (AC-002).
 *
 * @param sourceRange  소스 CellRange (G-001 normalizeRange 보장된 값)
 * @param direction    채울 방향 (FillDirection)
 * @param fillCount    채울 셀 개수
 * @param getCellValue 소스 셀 값 getter
 */
export function fillRange<TCell>(
  sourceRange: CellRange,
  direction: FillDirection,
  fillCount: number,
  getCellValue: (row: number, col: number) => TCell,
): CellUpdate<TCell>[] {
  if (fillCount <= 0) return [];

  const { start, end } = sourceRange;
  const sourceRows: number[] = [];
  const sourceCols: number[] = [];

  for (let r = start.row; r <= end.row; r++) sourceRows.push(r);
  for (let c = start.col; c <= end.col; c++) sourceCols.push(c);

  // 소스 값 수집
  const sourceValues: TCell[][] = sourceRows.map((r) =>
    sourceCols.map((c) => getCellValue(r, c)),
  );

  const updates: CellUpdate<TCell>[] = [];

  if (direction === 'down') {
    const colLength = sourceCols.length;
    for (let fi = 0; fi < fillCount; fi++) {
      const targetRow = end.row + 1 + fi;
      for (let ci = 0; ci < colLength; ci++) {
        const colValues = sourceRows.map((_, ri) => sourceValues[ri][ci]);
        updates.push({
          row: targetRow,
          col: sourceCols[ci],
          value: generateFillValue(colValues, fi + 1),
        });
      }
    }
  } else if (direction === 'up') {
    const colLength = sourceCols.length;
    for (let fi = 0; fi < fillCount; fi++) {
      const targetRow = start.row - fillCount + fi;
      for (let ci = 0; ci < colLength; ci++) {
        const colValues = sourceRows.map((_, ri) => sourceValues[ri][ci]).reverse();
        updates.push({
          row: targetRow,
          col: sourceCols[ci],
          value: generateFillValue(colValues, fillCount - fi),
        });
      }
    }
  } else if (direction === 'right') {
    const rowLength = sourceRows.length;
    for (let fi = 0; fi < fillCount; fi++) {
      const targetCol = end.col + 1 + fi;
      for (let ri = 0; ri < rowLength; ri++) {
        const rowValues = sourceCols.map((_, ci) => sourceValues[ri][ci]);
        updates.push({
          row: sourceRows[ri],
          col: targetCol,
          value: generateFillValue(rowValues, fi + 1),
        });
      }
    }
  } else {
    // direction === 'left'
    const rowLength = sourceRows.length;
    for (let fi = 0; fi < fillCount; fi++) {
      const targetCol = start.col - fillCount + fi;
      for (let ri = 0; ri < rowLength; ri++) {
        const rowValues = sourceCols.map((_, ci) => sourceValues[ri][ci]).reverse();
        updates.push({
          row: sourceRows[ri],
          col: targetCol,
          value: generateFillValue(rowValues, fillCount - fi),
        });
      }
    }
  }

  return updates;
}

/**
 * 소스 값 배열 + step 인덱스로 단일 fill 값 산출.
 * - 숫자 배열 + 일정 step: 시리즈 연장
 * - 그 외: 순환 복사 (modulo)
 */
function generateFillValue<TCell>(sourceValues: TCell[], stepIndex: number): TCell {
  const allNumbers = sourceValues.every((v) => typeof v === 'number');
  if (allNumbers && sourceValues.length > 0) {
    const nums = sourceValues as number[];
    const step = detectSeriesStep(nums);
    if (step !== null) {
      const lastVal = nums[nums.length - 1];
      return (lastVal + step * stepIndex) as TCell;
    }
  }

  // 순환 복사 (modulo)
  return sourceValues[stepIndex % sourceValues.length] as TCell;
}
