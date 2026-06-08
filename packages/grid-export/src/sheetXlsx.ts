/**
 * @topgrid/grid-export — sheet ↔ .xlsx bridge (MOD-GRID-69).
 *
 * Import/export a spreadsheet **with formulas** to/from `.xlsx`. The pinned community `xlsx@0.18.5`
 * round-trips cell formulas (`.f`) losslessly (probe-verified) — only cell *styles* (`.s`) are
 * stripped on write (that is the separate "Excel cell styles" gap, out of scope; see MOD-25 LESS-004).
 *
 * The bridge is lib-agnostic of grid-pro-sheet: it operates on a plain `Record<cellRef, rawString>`
 * where a raw string is either a formula (`"=A1+A2"`) or a literal (`"10"`, `"hi"`) — exactly the
 * `createSheet` `setCell(ref, raw)` / `getRaw(ref)` contract. The consumer wires it to the engine.
 */

import * as XLSX from 'xlsx';

/** A worksheet cell as understood by the xlsx lib (the subset this bridge reads/writes). */
export interface XlsxCell {
  /** Cell type: `'n'` number, `'s'` string, `'b'` boolean. */
  t: 'n' | 's' | 'b';
  /** Literal value (absent/ignored when `f` is the source of truth for display). */
  v?: number | string | boolean;
  /** Formula text WITHOUT the leading `=` (xlsx convention). */
  f?: string;
}

/**
 * Pure: a sheet raw input (`"=A1+A2"` | `"10"` | `"hi"`) → an xlsx cell object.
 *
 * A formula cell **must carry a cached value** (`v`) or the lib drops it on write (probe-verified),
 * so `computed` (the engine's displayed value, from `getDisplay`) is written as the cache. Without
 * it, a fallback `v: 0` keeps the formula (Excel recalculates on open). Value cells ignore `computed`.
 */
export function sheetRawToXlsxCell(raw: string, computed?: string | number): XlsxCell {
  if (raw.startsWith('=')) {
    const f = raw.slice(1);
    if (computed === undefined) return { t: 'n', f, v: 0 };
    const num = Number(computed);
    return computed !== '' && !Number.isNaN(num)
      ? { t: 'n', f, v: num }
      : { t: 's', f, v: String(computed) };
  }
  if (raw !== '' && !Number.isNaN(Number(raw))) {
    return { t: 'n', v: Number(raw) };
  }
  return { t: 's', v: raw };
}

/** Pure: an xlsx cell → a sheet raw input. Formula cells become `"=…"`; value cells stringify. */
export function xlsxCellToSheetRaw(cell: XlsxCell): string {
  if (cell.f !== undefined && cell.f !== '') return `=${cell.f}`;
  if (cell.v === undefined || cell.v === null) return '';
  return String(cell.v);
}

/**
 * Build an `.xlsx` workbook from a sheet cell map and (in a browser/node) trigger a download / write.
 * Formula cells are written as `.f` (preserved by the lib). Returns nothing — side-effecting write.
 */
export function exportSheetCellsToXlsx(
  cells: Record<string, string>,
  computed?: Record<string, string | number>,
  fileName = 'sheet.xlsx',
  sheetName = 'Sheet1',
): void {
  const ws = buildWorksheet(cells, computed);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
}

/** Build an `.xlsx` workbook as a Uint8Array buffer (node-testable; no file I/O). */
export function exportSheetCellsToXlsxBuffer(
  cells: Record<string, string>,
  computed?: Record<string, string | number>,
  sheetName = 'Sheet1',
): Uint8Array {
  const ws = buildWorksheet(cells, computed);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer);
}

/**
 * Parse an `.xlsx` (the first worksheet) into a sheet cell map. Formula cells become `"=…"` raws so
 * the sheet engine re-evaluates them; value cells stringify. Feeds `createSheet` via `setCell`.
 */
export function importXlsxToSheetCells(
  data: ArrayBuffer | Uint8Array,
): Record<string, string> {
  const wb = XLSX.read(data, { type: 'array' });
  const firstSheet = wb.SheetNames[0];
  const out: Record<string, string> = {};
  if (firstSheet === undefined) return out;
  const ws = wb.Sheets[firstSheet];
  if (ws === undefined) return out;
  for (const ref of Object.keys(ws)) {
    if (ref.startsWith('!')) continue; // metadata keys (!ref, !cols, …)
    out[ref] = xlsxCellToSheetRaw(ws[ref] as XlsxCell);
  }
  return out;
}

/** Build a worksheet (with `!ref` bounding box) from the sheet cell map (+ optional computed values). */
function buildWorksheet(
  cells: Record<string, string>,
  computed?: Record<string, string | number>,
): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  let maxRow = 0;
  let maxCol = 0;
  for (const ref of Object.keys(cells)) {
    const decoded = XLSX.utils.decode_cell(ref);
    if (decoded.r > maxRow) maxRow = decoded.r;
    if (decoded.c > maxCol) maxCol = decoded.c;
    ws[ref] = sheetRawToXlsxCell(cells[ref]!, computed?.[ref]);
  }
  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxRow, c: maxCol } });
  return ws;
}
