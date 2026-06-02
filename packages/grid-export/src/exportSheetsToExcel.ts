import * as XLSX from 'xlsx';
import type { ExcelSheet, MultiSheetOptions } from './types';
import { getRowsByScope } from './internal/getRowsByScope';
import { buildHeaderRows } from './internal/buildHeaderRows';
import { buildGridWorksheet } from './internal/buildGridWorksheet';

/**
 * 여러 TanStack Table 을 **하나의 Excel 워크북**(여러 시트)으로 export·다운로드한다.
 * (MOD-GRID-25 G-2 — AG Grid/DevExpress 다중 시트 export 격차 해소)
 *
 * 각 시트는 `exportToExcel`(단일 시트)과 동일한 빌더(`buildGridWorksheet`)를 재사용하므로
 * 헤더 merge·scope·네이티브 숫자서식(`.z`)·컬럼 폭 동작이 단일 시트와 일관된다.
 *
 * @param sheets  시트 정의 배열 (`{ name, table, scope?, columnFormats?, columnWidths? }`)
 * @param options 파일명 옵션
 * @returns void (동기 — xlsx.writeFile)
 *
 * @example
 * exportSheetsToExcel(
 *   [
 *     { name: '주문', table: ordersTable, columnFormats: { total: '#,##0' } },
 *     { name: '고객', table: customersTable, scope: 'selected' },
 *   ],
 *   { fileName: '월간보고.xlsx' },
 * );
 */
export function exportSheetsToExcel(
  sheets: ExcelSheet[],
  options?: MultiSheetOptions,
): void {
  const { fileName = 'export.xlsx' } = options ?? {};

  if (sheets.length === 0) {
    console.warn('[grid-export] exportSheetsToExcel: 시트가 없습니다.');
    return;
  }

  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const { name, table, scope = 'filtered', columnFormats, columnWidths } =
      sheet;

    const rows = getRowsByScope(table, scope);
    const { headerRows, merges } = buildHeaderRows(table);
    const dataRows: unknown[][] = rows.map((row) =>
      row.getVisibleCells().map((cell) => {
        const value = cell.getValue();
        return value !== undefined && value !== null ? value : '';
      }),
    );
    const leafColumnIds = table.getVisibleLeafColumns().map((c) => c.id);

    const ws = buildGridWorksheet({
      headerRows,
      merges,
      dataRows,
      leafColumnIds,
      columnFormats,
      columnWidths,
    });

    XLSX.utils.book_append_sheet(wb, ws, name);
  }

  const finalFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(wb, finalFileName);
}
