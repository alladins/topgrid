import * as XLSX from 'xlsx';
import type { Table } from '@tanstack/react-table';
import type { ExcelExportOptions } from './types';
import { getRowsByScope } from './internal/getRowsByScope';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * 헤더 텍스트 추출 헬퍼 — 헤더 값이 string 이면 그대로, 아니면 빈 문자열
 */
function resolveHeaderText(headerValue: unknown): string {
  if (typeof headerValue === 'string') {
    return headerValue;
  }
  return '';
}

/**
 * TanStack Table 의 헤더 그룹을 순회하여
 * - AOA(Array of Arrays) 형태의 헤더 행 배열
 * - xlsx merge cells 배열 (다중행 헤더 GroupColumnDef 용)
 * 을 반환한다.
 *
 * AC-003: header.isPlaceholder + header.colSpan 이용 → ws['!merges'] 계산
 */
function buildHeaderRows<TData>(table: Table<TData>): {
  headerRows: unknown[][];
  merges: XLSX.Range[];
} {
  const headerGroups = table.getHeaderGroups();
  const merges: XLSX.Range[] = [];
  const headerRows: unknown[][] = [];

  for (let rowIdx = 0; rowIdx < headerGroups.length; rowIdx++) {
    const group = headerGroups[rowIdx];
    const row: unknown[] = [];

    let colIdx = 0;
    for (const header of group.headers) {
      if (header.isPlaceholder) {
        // 상위 그룹 헤더의 placeholder 자식 — 빈 셀
        row.push('');
      } else {
        const text = resolveHeaderText(
          typeof header.column.columnDef.header === 'string'
            ? header.column.columnDef.header
            : header.column.id,
        );
        row.push(text);

        // colSpan > 1 이면 수평 merge 범위 추가 (GroupColumnDef)
        if (header.colSpan > 1) {
          merges.push({
            s: { r: rowIdx, c: colIdx },
            e: { r: rowIdx, c: colIdx + header.colSpan - 1 },
          });
        }
      }
      colIdx++;
    }

    headerRows.push(row);
  }

  // 헤더 그룹이 2행 이상이면 하위 행 리프 헤더를 상위 행에서 수직 merge
  // (상위 행의 비-placeholder 단일 리프 헤더는 rowspan으로 처리)
  if (headerGroups.length > 1) {
    for (let rowIdx = 0; rowIdx < headerGroups.length - 1; rowIdx++) {
      const group = headerGroups[rowIdx];
      let colIdx = 0;
      for (const header of group.headers) {
        // isPlaceholder false 이고 colSpan == 1 이면 이 컬럼은 리프 → 수직 merge
        if (!header.isPlaceholder && header.colSpan === 1) {
          if (rowIdx + 1 <= headerGroups.length - 1) {
            merges.push({
              s: { r: rowIdx, c: colIdx },
              e: { r: headerGroups.length - 1, c: colIdx },
            });
          }
        }
        colIdx++;
      }
    }
  }

  return { headerRows, merges };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * TanStack Table 인스턴스를 기반으로 Excel(.xlsx) 파일을 생성·다운로드한다.
 *
 * @param table - TanStack v8 Table<TData> 인스턴스 (useReactTable 반환값)
 * @param options - Excel export 옵션 (fileName, sheetName, scope, emptyBehavior)
 * @returns void (동기 실행 — xlsx.writeFile 동기 API, D3)
 *
 * @remarks
 * **대용량 데이터 경고**: scope='all' 또는 대용량 필터 결과(>10,000행) 시
 * xlsx.writeFile 이 동기 실행되어 브라우저 메인 스레드를 블로킹할 수 있습니다.
 * 대용량 사용 시 Web Worker 래핑 권장 (EC-05).
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

  // 5) AOA sheet 생성 (헤더 + 데이터)
  const aoa: unknown[][] = [...headerRows, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // 6) merge cells 적용 (다중행 헤더 있을 때, AC-003)
  if (merges.length > 0) {
    ws['!merges'] = merges;
  }

  // 7) workbook + 파일 다운로드 (EC-04: fileName 확장자 자동 추가)
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const finalFileName = fileName.endsWith('.xlsx')
    ? fileName
    : `${fileName}.xlsx`;
  XLSX.writeFile(wb, finalFileName);
}
