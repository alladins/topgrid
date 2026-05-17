import type { Table } from '@tanstack/react-table';
import type { DownloadExcelOptions } from '../types';
import { exportToExcel } from '../exportToExcel';

/**
 * DataTable `buttonInfo.downloadAction` 마이그레이션 호환 alias.
 *
 * 내부적으로 `exportToExcel(table, options)` 에 위임한다.
 * scope 기본값은 'filtered' (현재 필터/정렬 반영 행).
 *
 * @param table - TanStack v8 Table<TData> 인스턴스
 * @param options - export 옵션 (scope 기본값: 'filtered')
 *
 * @deprecated DataTable buttonInfo.downloadAction 마이그레이션 alias.
 * 1 minor 버전 이상 유지 (C-6, C-23).
 * 신규 코드는 `exportToExcel()` 직접 사용 권장.
 *
 * @example
 * import { downloadExcel } from '@tomis/grid-export/legacy';
 * // DataTable 기존 패턴 교체
 * downloadExcel(table);
 */
export function downloadExcel<TData>(
  table: Table<TData>,
  options?: DownloadExcelOptions,
): void {
  // C-29 exactOptionalPropertyTypes 대응:
  // DownloadExcelOptions 의 optional props 를 직접 forwarding 하지 않고
  // options 전체를 spread 하여 exportToExcel 에 위임.
  // scope 기본값 'filtered' 는 exportToExcel 내부에서 처리됨.
  exportToExcel(table, options);
}
