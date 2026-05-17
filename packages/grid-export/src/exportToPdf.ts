import type { Table } from '@tanstack/react-table';
import type { PDFExportOptions } from './types';
import { getRowsByScope } from './internal/getRowsByScope';

/**
 * TanStack Table 인스턴스를 기반으로 PDF 파일을 생성·다운로드한다.
 * jspdf + jspdf-autotable을 optional peer로 dynamic import하여 사용.
 *
 * @param table   - TanStack v8 Table<TData> 인스턴스 (useReactTable 반환값)
 * @param options - PDF export 옵션 (fileName, title, scope, orientation, fontFamily, emptyBehavior)
 * @returns Promise<void> — jspdf dynamic import 후 완료
 * @throws Error jspdf 또는 jspdf-autotable이 설치되지 않은 경우
 *
 * @remarks
 * **peer 설치 필요**: jspdf + jspdf-autotable은 optional peerDependency.
 * 사용 전 `npm install jspdf jspdf-autotable` 실행 필요.
 *
 * **한국어 폰트**: `fontFamily: 'korean'` 옵션은 W1 리스크 (loadKoreanFont.ts stub 상태).
 * 실 폰트 base64 데이터 확보 + 라이선스 확인 후 loadKoreanFont.ts 구현 완료 필요.
 *
 * @example
 * // 기본 사용 (portrait, filtered, Helvetica)
 * await exportToPdf(table, { fileName: '보고서.pdf' });
 *
 * @example
 * // 가로 방향 + 전체 행 + 제목
 * await exportToPdf(table, {
 *   fileName: '전체데이터.pdf',
 *   title: '2026년 데이터 목록',
 *   scope: 'all',
 *   orientation: 'l',
 *   emptyBehavior: 'empty',
 * });
 */
export async function exportToPdf<TData>(
  table: Table<TData>,
  options?: PDFExportOptions,
): Promise<void> {
  const {
    fileName = 'export.pdf',
    title,
    scope = 'filtered',
    emptyBehavior = 'skip',
    orientation = 'p',
    fontFamily = 'default',
  } = options ?? {};

  // 1. jspdf dynamic import (optional peer — 미설치 시 명확한 Error)
  let jsPDF: Awaited<typeof import('jspdf')>['default'];
  try {
    const mod = await import('jspdf');
    jsPDF = mod.default;
  } catch {
    throw new Error(
      '[exportToPdf] jspdf is not installed. Run: npm install jspdf jspdf-autotable',
    );
  }

  // 2. jspdf-autotable dynamic import (optional peer — 미설치 시 명확한 Error)
  try {
    await import('jspdf-autotable');
  } catch {
    throw new Error(
      '[exportToPdf] jspdf-autotable is not installed. Run: npm install jspdf jspdf-autotable',
    );
  }

  // 3. 행 수집 (getRowsByScope 재사용 — G-002 추출 헬퍼, D1)
  const rows = getRowsByScope(table, scope);
  if (rows.length === 0 && emptyBehavior === 'skip') {
    console.warn('[grid-export] exportToPdf: 내보낼 데이터가 없습니다.');
    return;
  }

  // 4. 다중행 헤더 구성 (AC-005: isPlaceholder + colSpan 처리)
  const headerGroups = table.getHeaderGroups();
  const head: string[][] = headerGroups.map((hg) =>
    hg.headers.map((h) => {
      if (h.isPlaceholder) return '';
      return typeof h.column.columnDef.header === 'string'
        ? h.column.columnDef.header
        : h.column.id;
    }),
  );

  // 5. 데이터 행 구성 (리프 헤더 순서 기준 — D7)
  const leafHeaders = table.getLeafHeaders();
  const body: string[][] = rows.map((row) => {
    const cells = row.getVisibleCells();
    return leafHeaders.map((lh) => {
      const cell = cells.find((c) => c.column.id === lh.column.id);
      return cell ? String(cell.getValue() ?? '') : '';
    });
  });

  // 6. jsPDF 인스턴스 생성
  const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4' });

  // 7. 한국어 폰트 로드 (fontFamily === 'korean' 시 dynamic import)
  if (fontFamily === 'korean') {
    const { loadKoreanFont } = await import('./internal/loadKoreanFont');
    await loadKoreanFont(doc);
  }

  // 8. title 행 (있으면)
  if (title) {
    doc.text(title, 14, 20);
  }

  // 9. autoTable 렌더링
  // @ts-expect-error jspdf-autotable extends jsPDF prototype at runtime (W2 — see spec Section 11)
  doc.autoTable({ head, body, startY: title ? 30 : 14 });

  // 10. 파일명 정규화 + 다운로드
  const normalized = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  doc.save(normalized);
}
