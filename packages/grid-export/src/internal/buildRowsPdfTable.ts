/**
 * buildRowsPdfTable — 행 배열 + `ExcelColumn[]` 을 jspdf-autotable 의 { head, body } 구조로
 * 변환하는 순수 함수(브라우저/jspdf 비의존 → node-testable).
 *
 * 실제 PDF 렌더(jspdf)는 `exportRowsToPdf` 가 담당하고, 본 함수는 그 입력 표 데이터만 만든다.
 */
import type { ExcelColumn } from '../types';

export interface PdfTableData {
  /** autotable head: 단일 헤더 행 (행 배열 export 는 다중행 헤더 미지원) */
  head: string[][];
  /** autotable body: 데이터 행 × 컬럼 문자열 */
  body: string[][];
}

export function buildRowsPdfTable<TData extends Record<string, unknown>>(
  rows: TData[],
  columns: ExcelColumn[],
): PdfTableData {
  const head = [columns.map((c) => c.header)];
  const body = rows.map((row) =>
    columns.map((col) => {
      const v = row[col.key];
      return v !== null && v !== undefined ? String(v) : '';
    }),
  );
  return { head, body };
}
