import { useMemo } from 'react';
import type { Table } from '@tanstack/react-table';
import { exportToExcel } from '../exportToExcel';
import { exportToCSV } from '../exportToCSV';
import { exportToPdf } from '../exportToPdf';
import { copyToClipboard } from '../copyToClipboard';
import { printGrid } from '../printGrid';
import { getRowsByScope } from '../internal/getRowsByScope';
import type {
  ExcelExportOptions,
  CSVExportOptions,
  PDFExportOptions,
  ClipboardOptions,
  PrintOptions,
  ExportScope,
} from '../types';

/** useGridExport 옵션 */
export interface UseGridExportOptions {
  /**
   * 파일명 기본값 (확장자 제외). 각 포맷이 확장자를 붙인다(.xlsx/.csv/.pdf).
   * 개별 호출에서 `fileName` 을 넘기면 그쪽이 우선.
   */
  fileNameBase?: string;
}

/** useGridExport 반환 — 테이블에 바인딩된 내보내기 콜백 묶음 */
export interface GridExportApi {
  toExcel(options?: ExcelExportOptions): void;
  toCsv(options?: CSVExportOptions): void;
  toPdf(options?: PDFExportOptions): void;
  copy(options?: ClipboardOptions): void;
  print(options?: PrintOptions): void;
  /** 해당 scope 의 행 수 (버튼 disabled·대용량 가드 판단용) */
  rowCount(scope?: ExportScope): number;
  /** 해당 scope 에 내보낼 행이 0건인지 */
  isEmpty(scope?: ExportScope): boolean;
}

/**
 * grid-export 의 함수 API 를 TanStack Table 인스턴스에 바인딩해 콜백 묶음으로 반환한다.
 * 렌더링 없음 — 어떤 UI(버튼·메뉴·단축키)에도 연결할 수 있는 headless 훅.
 *
 * @example
 * const ex = useGridExport(table, { fileNameBase: '주문목록' });
 * <button disabled={ex.isEmpty('filtered')} onClick={() => ex.toExcel()}>Excel</button>
 */
export function useGridExport<TData>(
  table: Table<TData>,
  options?: UseGridExportOptions,
): GridExportApi {
  const base = options?.fileNameBase;
  return useMemo<GridExportApi>(
    () => ({
      toExcel: (o) =>
        exportToExcel(table, { ...(base ? { fileName: `${base}.xlsx` } : {}), ...o }),
      toCsv: (o) =>
        exportToCSV(table, { ...(base ? { fileName: `${base}.csv` } : {}), ...o }),
      toPdf: (o) =>
        exportToPdf(table, { ...(base ? { fileName: `${base}.pdf` } : {}), ...o }),
      copy: (o) => copyToClipboard(table, o),
      print: (o) => printGrid(table, o),
      rowCount: (scope = 'filtered') => getRowsByScope(table, scope).length,
      isEmpty: (scope = 'filtered') => getRowsByScope(table, scope).length === 0,
    }),
    [table, base],
  );
}
