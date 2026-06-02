import * as XLSX from 'xlsx';
import type { Table } from '@tanstack/react-table';
import type { ExcelExportOptions } from './types';
import { getRowsByScope } from './internal/getRowsByScope';
import { buildHeaderRows } from './internal/buildHeaderRows';
import { buildGridWorksheet } from './internal/buildGridWorksheet';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * TanStack Table 인스턴스를 기반으로 Excel(.xlsx) 파일을 생성·다운로드한다.
 *
 * @param table - TanStack v8 Table<TData> 인스턴스 (useReactTable 반환값)
 * @param options - Excel export 옵션 (fileName, sheetName, scope, emptyBehavior, columnFormats, columnWidths)
 * @returns void (동기 실행 — xlsx.writeFile 동기 API, D3)
 *
 * @remarks
 * **대용량 데이터 경고**: scope='all' 또는 대용량 필터 결과(>10,000행) 시
 * xlsx.writeFile 이 동기 실행되어 브라우저 메인 스레드를 블로킹할 수 있습니다.
 * 대용량 사용 시 Web Worker 래핑 권장 (EC-05).
 *
 * **셀 서식(MOD-GRID-25)**: `columnFormats` 는 네이티브 Excel number-format(`.z`)을 적용해
 * 셀이 Excel 안에서 numeric·정렬가능하게 유지됩니다. 폰트/배경색은 community
 * `xlsx@0.18.5` 가 write 시 미지원(round-trip 시 스트립)이라 제공하지 않습니다.
 *
 * @example
 * // 기본 사용 (filtered 행)
 * exportToExcel(table, { fileName: '데이터.xlsx' });
 *
 * @example
 * // 선택 행 + 다중행 헤더
 * exportToExcel(table, {
 *   fileName: '선택데이터.xlsx',
 *   sheetName: '선택목록',
 *   scope: 'selected',
 *   emptyBehavior: 'empty',
 * });
 *
 * @example
 * // 네이티브 숫자서식 + 컬럼 폭
 * exportToExcel(table, {
 *   columnFormats: { price: '#,##0.00', orderedAt: 'yyyy-mm-dd' },
 *   columnWidths: { name: 30 },
 * });
 */
export function exportToExcel<TData>(
  table: Table<TData>,
  options?: ExcelExportOptions,
): void {
  const {
    fileName = 'export.xlsx',
    sheetName = 'Sheet1',
    scope = 'filtered',
    emptyBehavior = 'skip',
    columnFormats,
    columnWidths,
  } = options ?? {};

  // 1) 행 결정 (C-2: TanStack 표준 API만)
  const rows = getRowsByScope(table, scope);

  // 2) 빈 데이터 처리 (EC-01, EC-03)
  if (rows.length === 0 && emptyBehavior === 'skip') {
    console.warn('[grid-export] exportToExcel: 내보낼 데이터가 없습니다.');
    return;
  }

  // 3) 헤더 추출 (GroupColumnDef 감지 → 다중행 + merge cells, AC-003)
  const { headerRows, merges } = buildHeaderRows(table);

  // 4) 데이터 행 추출 (AC-004: 한국어 UTF-8 — xlsx aoa_to_sheet 기본 UTF-8)
  const dataRows: unknown[][] = rows.map((row) =>
    row.getVisibleCells().map((cell) => {
      const value = cell.getValue();
      return value !== undefined && value !== null ? value : '';
    }),
  );

  // 5) 워크시트 빌드 (AOA + merge + 네이티브 숫자서식/폭, MOD-GRID-25 G-1)
  const leafColumnIds = table.getVisibleLeafColumns().map((c) => c.id);
  const ws = buildGridWorksheet({
    headerRows,
    merges,
    dataRows,
    leafColumnIds,
    columnFormats,
    columnWidths,
  });

  // 6) workbook + 파일 다운로드 (EC-04: fileName 확장자 자동 추가)
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const finalFileName = fileName.endsWith('.xlsx')
    ? fileName
    : `${fileName}.xlsx`;
  XLSX.writeFile(wb, finalFileName);
}
