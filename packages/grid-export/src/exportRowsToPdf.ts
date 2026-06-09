/**
 * exportRowsToPdf — 행 배열 기반 PDF export (ADR-005 평행, `exportToPdf` 의 row-array 형)
 *
 * TanStack Table 인스턴스 없이 raw row array + `ExcelColumn[]` 로 PDF 파일 다운로드.
 * 표 데이터 구성(`buildRowsPdfTable`)은 순수 함수로 분리(node-testable)되고, 본 함수는
 * jspdf + jspdf-autotable 을 optional peer 로 dynamic import 하는 **브라우저 전용** 렌더 래퍼다.
 *
 * @remarks
 * **peer 설치 필요**: jspdf + jspdf-autotable 은 optional peerDependency.
 * 라틴 폰트(Helvetica)만 내장 — 한국어 글리프는 별도 폰트 로드 필요(`exportToPdf` 의 W1 참조).
 *
 * @throws Error jspdf 또는 jspdf-autotable 미설치 시.
 *
 * @example
 * await exportRowsToPdf(rows, columns, { fileName: '보고서.pdf', orientation: 'l' });
 */
import type { ExcelColumn, ExportRowsPdfOptions } from './types';
import { buildRowsPdfTable } from './internal/buildRowsPdfTable';

export async function exportRowsToPdf<TData extends Record<string, unknown>>(
  rows: TData[],
  columns: ExcelColumn[],
  options?: ExportRowsPdfOptions,
): Promise<void> {
  const {
    fileName = 'export.pdf',
    title,
    orientation = 'p',
    emptyBehavior = 'skip',
  } = options ?? {};

  if (rows.length === 0 && emptyBehavior === 'skip') {
    console.warn('[exportRowsToPdf] rows is empty — skipping file creation (emptyBehavior: "skip")');
    return;
  }

  let jsPDF: Awaited<typeof import('jspdf')>['default'];
  try {
    const mod = await import('jspdf');
    jsPDF = mod.default;
  } catch {
    throw new Error(
      '[exportRowsToPdf] jspdf is not installed. Run: npm install jspdf jspdf-autotable',
    );
  }
  try {
    await import('jspdf-autotable');
  } catch {
    throw new Error(
      '[exportRowsToPdf] jspdf-autotable is not installed. Run: npm install jspdf jspdf-autotable',
    );
  }

  const { head, body } = buildRowsPdfTable(rows, columns);

  const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4' });
  if (title) doc.text(title, 14, 20);
  // @ts-expect-error jspdf-autotable extends jsPDF prototype at runtime
  doc.autoTable({ head, body, startY: title ? 30 : 14 });

  const normalized = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  doc.save(normalized);
}
