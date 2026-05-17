import type { Row, Table } from '@tanstack/react-table';
import type { ExportScope } from '../types';

/**
 * TanStack scope 에 따라 Row 배열 반환 (C-2: 표준 API만 사용)
 * G-001 exportToExcel.ts 에서 추출 — Excel + CSV 공유 헬퍼 (D1)
 */
export function getRowsByScope<TData>(
  table: Table<TData>,
  scope: ExportScope,
): Row<TData>[] {
  if (scope === 'all') {
    return table.getCoreRowModel().rows;
  }
  if (scope === 'selected') {
    return table.getSelectedRowModel().rows;
  }
  // 'filtered' (default)
  return table.getFilteredRowModel().rows;
}
