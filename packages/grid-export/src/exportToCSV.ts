import type { Table } from '@tanstack/react-table';
import type { CSVExportOptions } from './types';
import { getRowsByScope } from './internal/getRowsByScope';

// ---------------------------------------------------------------------------
// Internal helper — RFC 4180 이스케이프
// ---------------------------------------------------------------------------

/**
 * RFC 4180 §2: 구분자/큰따옴표/개행 포함 시 큰따옴표 래핑 + 내부 따옴표 이중화
 * (외부 라이브러리 0 — 순수 string 조작, AC-001, AC-003)
 */
function escapeCsvValue(value: string, delimiter: string): string {
  const needsQuoting =
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r');
  if (!needsQuoting) return value;
  return '"' + value.split('"').join('""') + '"';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * TanStack Table 인스턴스를 기반으로 CSV 파일을 생성·다운로드한다.
 * UTF-8 BOM(﻿) 포함 — 한국어 Excel 정상 표시 (AC-004).
 *
 * @param table  TanStack v8 Table<TData> 인스턴스 (useReactTable 반환값)
 * @param options CSV export 옵션 (fileName, scope, delimiter, emptyBehavior)
 * @returns void (순수 string 조작 + createObjectURL — 외부 라이브러리 0, D5)
 *
 * @remarks
 * **브라우저 전용**: URL.createObjectURL / document.createElement — SSR 환경 불가.
 *
 * @example
 * // 기본 사용 (filtered 행, 쉼표 구분자)
 * exportToCSV(table, { fileName: '데이터.csv' });
 *
 * @example
 * // TSV + 선택 행
 * exportToCSV(table, { fileName: '선택.tsv', delimiter: '\t', scope: 'selected' });
 */
export function exportToCSV<TData>(
  table: Table<TData>,
  options?: CSVExportOptions,
): void {
  const {
    fileName = 'export.csv',
    scope = 'filtered',
    delimiter = ',',
    emptyBehavior = 'skip',
  } = options ?? {};

  // 1) 행 결정 (C-2: TanStack 표준 API — getRowsByScope 공유 헬퍼, D1)
  const rows = getRowsByScope(table, scope);

  // 2) 빈 데이터 처리 (EC-02)
  if (rows.length === 0 && emptyBehavior === 'skip') {
    console.warn('[grid-export] exportToCSV: 내보낼 데이터가 없습니다.');
    return;
  }

  // 3) 헤더 추출 — 리프 헤더만 (단일행 CSV, CSV는 다중행 헤더 미지원)
  const leafHeaders = table.getLeafHeaders();
  const headerRow = leafHeaders
    .map((h) => {
      const headerDef = h.column.columnDef.header;
      const text = typeof headerDef === 'string' ? headerDef : h.column.id;
      return escapeCsvValue(text, delimiter);
    })
    .join(delimiter);

  // 4) 데이터 행 추출 (EC-04: null/undefined → 빈 문자열)
  const dataRows = rows.map((row) =>
    row
      .getVisibleCells()
      .map((cell) => {
        const value = cell.getValue();
        const str =
          value !== null && value !== undefined ? String(value) : '';
        return escapeCsvValue(str, delimiter);
      })
      .join(delimiter),
  );

  // 5) CSV 문자열 조립 (AC-003 RFC 4180: CRLF 행 구분)
  const lines = [headerRow, ...dataRows];
  const csvString = lines.join('\r\n');

  // 6) BOM + Blob 생성 → 다운로드 (AC-004: ﻿ UTF-8 BOM → 한국어 Excel 정상)
  const bom = '﻿';
  const blob = new Blob([bom + csvString], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  // 7) fileName 확장자 자동 추가 (EC-05: .csv 또는 .tsv 없으면 .csv 추가)
  const finalFileName =
    fileName.endsWith('.csv') || fileName.endsWith('.tsv')
      ? fileName
      : `${fileName}.csv`;
  link.download = finalFileName;
  link.click();
  URL.revokeObjectURL(url);
}
