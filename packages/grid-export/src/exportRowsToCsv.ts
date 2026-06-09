/**
 * exportRowsToCsv — 행 배열 기반 CSV export (ADR-005 평행, `exportRowsToExcel` 의 CSV 형)
 *
 * TanStack Table 인스턴스 없이 raw row array + `ExcelColumn[]` 로 CSV 파일 다운로드.
 * 직렬화 로직(`buildRowsCsv`)은 순수 함수로 분리되어 node 테스트 가능하고, 본 함수는
 * BOM + Blob + a[download] 의 **브라우저 전용** 다운로드 래퍼다.
 *
 * @remarks **브라우저 전용**: URL.createObjectURL / document.createElement — SSR 불가.
 *
 * @example
 * exportRowsToCsv(rows, columns, { fileName: '데이터.csv' });
 * exportRowsToCsv(rows, columns, { fileName: '데이터.tsv', delimiter: '\t' });
 */
import type { ExcelColumn, ExportRowsCsvOptions } from './types';
import { buildRowsCsv } from './internal/csvSerialize';

export function exportRowsToCsv<TData extends Record<string, unknown>>(
  rows: TData[],
  columns: ExcelColumn[],
  options?: ExportRowsCsvOptions,
): void {
  const {
    fileName = 'export.csv',
    delimiter = ',',
    emptyBehavior = 'skip',
  } = options ?? {};

  if (rows.length === 0 && emptyBehavior === 'skip') {
    console.warn('[exportRowsToCsv] rows is empty — skipping file creation (emptyBehavior: "skip")');
    return;
  }

  const csvString = buildRowsCsv(rows, columns, delimiter);

  // UTF-8 BOM(﻿) — 한국어 Excel 정상 표시
  const blob = new Blob(['﻿' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download =
    fileName.endsWith('.csv') || fileName.endsWith('.tsv') ? fileName : `${fileName}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
