/**
 * exportRowsToExcel — 행 배열 기반 Excel export (ADR-005, E-1 + F-1)
 *
 * TanStack Table 인스턴스 없이 raw row array + ExcelColumn[] 로 .xlsx 생성.
 * 거동 패리티 (spec §3 B1/B2/B3):
 *   B1 — 컬럼 width: ws['!cols'] 적용 (ExcelColumn.width ?? 15)
 *   B2 — 헤더 styling: bold + 회색 fill (F3F4F6) — note: xlsx community edition has limited style support
 *   B3 — formatValue: date/datetime/number/currency 포맷 (ko-KR locale)
 *
 * @see ExcelColumn
 * @see ExportRowsOptions
 */
import * as XLSX from 'xlsx';
import type { ExcelColumn, ExportRowsOptions } from './types';

// ── B3: 셀 값 포맷터 ──────────────────────────────────────────────────────

function formatValue(value: unknown, format?: ExcelColumn['format']): unknown {
  if (value == null) return '';
  if (format === 'date' || format === 'datetime') {
    const d = new Date(value as string);
    if (isNaN(d.getTime())) return String(value);
    return format === 'datetime'
      ? d.toLocaleString('ko-KR')
      : d.toLocaleDateString('ko-KR');
  }
  if (format === 'number' || format === 'currency') {
    const n = Number(value);
    return isNaN(n) ? value : n;
  }
  return value;
}

// ── 공개 API ──────────────────────────────────────────────────────────────

/**
 * 행 배열을 Excel 파일(.xlsx)로 다운로드한다.
 *
 * TanStack `Table<TData>` 인스턴스 없이 사용 가능.
 * `@tomis/grid-export` 의 `exportToExcel(table, options)` 와 평행 지원 (ADR-005 옵션 A).
 *
 * @example
 * exportRowsToExcel(rows, columns, { fileName: '보고서_2026.xlsx' });
 *
 * @param rows     내보낼 데이터 행 배열
 * @param columns  컬럼 정의 배열 (key / header / width? / format?)
 * @param options  파일명·시트명·emptyBehavior 옵션
 */
export function exportRowsToExcel<TData extends Record<string, unknown>>(
  rows: TData[],
  columns: ExcelColumn[],
  options?: ExportRowsOptions,
): void {
  const {
    fileName = 'export.xlsx',
    sheetName = 'Sheet1',
    emptyBehavior = 'skip',
  } = options ?? {};

  if (rows.length === 0 && emptyBehavior === 'skip') {
    console.warn('[exportRowsToExcel] rows is empty — skipping file creation (emptyBehavior: "skip")');
    return;
  }

  // ── 헤더 + 데이터 AOA 구성 ─────────────────────────────────────────────
  const header = columns.map((c) => c.header);
  const dataRows = rows.map((row) =>
    columns.map((col) => formatValue(row[col.key], col.format))
  );
  const aoa = rows.length === 0 ? [header] : [header, ...dataRows];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // ── B1: 컬럼 width ─────────────────────────────────────────────────────
  ws['!cols'] = columns.map((c) => ({ wch: c.width ?? 15 }));

  // ── B2: 헤더 행 styling (굵게 + 회색 fill) ────────────────────────────
  // note: xlsx community edition has limited style support
  const headerRange = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
  for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c });
    if (!ws[cellAddr]) continue;
    ws[cellAddr].s = { font: { bold: true }, fill: { fgColor: { rgb: 'F3F4F6' } } };
  }

  // ── 워크북 생성 + 다운로드 ─────────────────────────────────────────────
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const ext = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(wb, ext);
}
