import type { Table } from '@tanstack/react-table';
import * as XLSX from 'xlsx';

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
 *
 * MOD-GRID-25 G-1: `exportToExcel` 의 private helper 에서 `internal/` 로 이동(동작 동일) —
 * `exportSheetsToExcel`(다중 시트) 와 공유하기 위함. 로직 변경 없음.
 */
export function buildHeaderRows<TData>(table: Table<TData>): {
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
