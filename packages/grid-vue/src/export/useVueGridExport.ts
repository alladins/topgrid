import type { Table } from '@tanstack/table-core';
import {
  exportToExcel,
  exportToCSV,
  exportToPdf,
  copyToClipboard,
  printGrid,
  type ExcelExportOptions,
  type CSVExportOptions,
  type PDFExportOptions,
  type ClipboardOptions,
  type PrintOptions,
  type ExportScope,
} from '@topgrid/grid-export';

// grid-export 함수는 @tanstack/react-table 의 Table 을 받지만, 그 Table 은 @tanstack/table-core 의
// Table 을 그대로 재export 한 것이라 vue-table 의 Table 과 런타임·구조가 동일하다. 타입만 브리지한다.
type ExportableTable = Parameters<typeof exportToExcel>[0];
const asExportable = <T>(t: Table<T>): ExportableTable => t as unknown as ExportableTable;

function rowCountFor<T>(table: Table<T>, scope: ExportScope): number {
  if (scope === 'all') return table.getCoreRowModel().rows.length;
  if (scope === 'selected') return table.getSelectedRowModel().rows.length;
  return table.getFilteredRowModel().rows.length;
}

/** useVueGridExport 옵션 */
export interface UseVueGridExportOptions {
  /** 파일명 기본값(확장자 제외) — 각 포맷이 확장자를 붙인다. 개별 호출 fileName 이 우선. */
  fileNameBase?: string;
}

/** useVueGridExport 반환 — vue Table 에 바인딩된 내보내기 콜백 묶음 */
export interface VueGridExportApi {
  toExcel(options?: ExcelExportOptions): void;
  toCsv(options?: CSVExportOptions): void;
  toPdf(options?: PDFExportOptions): void;
  copy(options?: ClipboardOptions): void;
  print(options?: PrintOptions): void;
  rowCount(scope?: ExportScope): number;
  isEmpty(scope?: ExportScope): boolean;
}

/**
 * `@tanstack/vue-table` 의 Table 을 grid-export 엔진에 바인딩한다. React 훅 `useGridExport` 의 Vue 평행.
 * React 런타임 의존 없음(grid-export 함수는 table-core + xlsx 만 사용).
 *
 * @example
 * const ex = useVueGridExport(table, { fileNameBase: '주문목록' });
 * // ex.toExcel() · ex.toCsv() · ex.isEmpty('filtered')
 */
export function useVueGridExport<T>(
  table: Table<T>,
  options?: UseVueGridExportOptions,
): VueGridExportApi {
  const base = options?.fileNameBase;
  const t = () => asExportable(table);
  return {
    toExcel: (o) =>
      exportToExcel(t(), { ...(base ? { fileName: `${base}.xlsx` } : {}), ...o }),
    toCsv: (o) => exportToCSV(t(), { ...(base ? { fileName: `${base}.csv` } : {}), ...o }),
    toPdf: (o) => exportToPdf(t(), { ...(base ? { fileName: `${base}.pdf` } : {}), ...o }),
    copy: (o) => copyToClipboard(t(), o),
    print: (o) => printGrid(t(), o),
    rowCount: (scope = 'filtered') => rowCountFor(table, scope),
    isEmpty: (scope = 'filtered') => rowCountFor(table, scope) === 0,
  };
}
