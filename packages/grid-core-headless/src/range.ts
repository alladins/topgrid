/**
 * 셀 범위(range) 순수 유틸 — 정규화·포함판정·drag-fill·TSV (W1 Phase 0, grid-pro-range 에서 이관).
 *
 * 전부 framework-agnostic 순수 함수 + 순수 데이터 타입(좌표/사각형/방향/업데이트).
 * React(grid-pro-range)·Vue 범위 어댑터가 동일 math/serialization 을 공유한다. 렌더/이벤트 무관.
 */

// ─── 순수 타입 (grid-pro-range types.ts 에서 이관) ───
export interface CellCoord {
  row: number;
  col: number;
}
export interface CellRange {
  start: CellCoord;
  end: CellCoord;
}
export type FillDirection = 'up' | 'down' | 'left' | 'right';
export interface CellUpdate<TCell = unknown> {
  row: number;
  col: number;
  value: TCell;
}

// ─── 정규화 / 포함 판정 ───
export function normalizeRange(range: CellRange): CellRange {
  return {
    start: {
      row: Math.min(range.start.row, range.end.row),
      col: Math.min(range.start.col, range.end.col),
    },
    end: {
      row: Math.max(range.start.row, range.end.row),
      col: Math.max(range.start.col, range.end.col),
    },
  };
}

export function isInRange(row: number, col: number, range: CellRange | null): boolean {
  if (!range) return false;
  const n = normalizeRange(range);
  return row >= n.start.row && row <= n.end.row && col >= n.start.col && col <= n.end.col;
}

// ─── drag-fill ───
export function detectSeriesStep(values: number[]): number | null {
  if (values.length < 2) return 0;
  const step = values[1] - values[0];
  for (let i = 2; i < values.length; i++) {
    if (values[i] - values[i - 1] !== step) return null;
  }
  return step;
}

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
  return sourceValues[stepIndex % sourceValues.length] as TCell;
}

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
        updates.push({ row: targetRow, col: sourceCols[ci], value: generateFillValue(colValues, fi + 1) });
      }
    }
  } else if (direction === 'up') {
    const colLength = sourceCols.length;
    for (let fi = 0; fi < fillCount; fi++) {
      const targetRow = start.row - fillCount + fi;
      for (let ci = 0; ci < colLength; ci++) {
        const colValues = sourceRows.map((_, ri) => sourceValues[ri][ci]).reverse();
        updates.push({ row: targetRow, col: sourceCols[ci], value: generateFillValue(colValues, fillCount - fi) });
      }
    }
  } else if (direction === 'right') {
    const rowLength = sourceRows.length;
    for (let fi = 0; fi < fillCount; fi++) {
      const targetCol = end.col + 1 + fi;
      for (let ri = 0; ri < rowLength; ri++) {
        const rowValues = sourceCols.map((_, ci) => sourceValues[ri][ci]);
        updates.push({ row: sourceRows[ri], col: targetCol, value: generateFillValue(rowValues, fi + 1) });
      }
    }
  } else {
    const rowLength = sourceRows.length;
    for (let fi = 0; fi < fillCount; fi++) {
      const targetCol = start.col - fillCount + fi;
      for (let ri = 0; ri < rowLength; ri++) {
        const rowValues = sourceCols.map((_, ci) => sourceValues[ri][ci]).reverse();
        updates.push({ row: sourceRows[ri], col: targetCol, value: generateFillValue(rowValues, fillCount - fi) });
      }
    }
  }

  return updates;
}

// ─── TSV (RFC 4180) ───
function escapeTsvCell(value: string): string {
  const needsQuoting =
    value.includes('\t') || value.includes('\n') || value.includes('\r') || value.includes('"');
  if (!needsQuoting) return value;
  return '"' + value.replace(/"/g, '""') + '"';
}

export function stringifyTsv(matrix: readonly (readonly unknown[])[]): string {
  if (matrix.length === 0) return '';
  return matrix
    .map((row) =>
      row.map((cell) => escapeTsvCell(cell === null || cell === undefined ? '' : String(cell))).join('\t'),
    )
    .join('\n');
}

export function parseTsv(tsv: string): string[][] {
  if (tsv.trim() === '') return [['']];
  const normalized = tsv.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const trimmed = normalized.endsWith('\n') ? normalized.slice(0, -1) : normalized;
  const rows: string[][] = [];
  const lines = trimmed.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const row: string[] = [];
    let line = lines[i];
    let col = 0;
    while (line.length > 0 || col === 0) {
      if (line.startsWith('"')) {
        let j = 1;
        let cell = '';
        while (j < line.length) {
          if (line[j] === '"') {
            if (j + 1 < line.length && line[j + 1] === '"') {
              cell += '"';
              j += 2;
            } else {
              j++;
              break;
            }
          } else {
            cell += line[j];
            j++;
          }
        }
        row.push(cell);
        line = line.slice(j);
        if (line.startsWith('\t')) {
          line = line.slice(1);
        } else {
          break;
        }
      } else {
        const tabIdx = line.indexOf('\t');
        if (tabIdx === -1) {
          row.push(line);
          line = '';
          break;
        } else {
          row.push(line.slice(0, tabIdx));
          line = line.slice(tabIdx + 1);
        }
      }
      col++;
    }
    rows.push(row);
  }
  return rows;
}
