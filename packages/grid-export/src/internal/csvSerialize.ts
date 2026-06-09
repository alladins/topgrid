/**
 * csvSerialize — 순수 CSV 직렬화 (외부 라이브러리 0, 브라우저 비의존 → node-testable).
 *
 * `escapeCsvValue` 는 기존 `exportToCSV` 의 RFC 4180 이스케이프 로직을 공유 추출한 것이고
 * (중복·드리프트 방지, LESS-003), `buildRowsCsv` 는 행 배열 기반 export 의 순수 빌더다(ADR-005 평행).
 */
import type { ExcelColumn } from '../types';

/**
 * RFC 4180 §2: 구분자/큰따옴표/개행 포함 시 큰따옴표 래핑 + 내부 따옴표 이중화.
 * 순수 string 조작 — 외부 라이브러리 0.
 */
export function escapeCsvValue(value: string, delimiter: string): string {
  const needsQuoting =
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r');
  if (!needsQuoting) return value;
  return '"' + value.split('"').join('""') + '"';
}

/**
 * 행 배열 + `ExcelColumn[]` 을 RFC 4180 CSV 문자열로 직렬화한다(헤더 1행 + 데이터 N행, CRLF 구분).
 *
 * 순수 함수 — Blob/DOM 비의존이라 node 단위 테스트로 실제 출력 문자열을 단언할 수 있다.
 * null/undefined 셀은 빈 문자열로 직렬화(EC: exportToCSV 동작과 일치).
 *
 * @param rows      직렬화할 데이터 행
 * @param columns   컬럼 정의(key=행 키, header=헤더 텍스트)
 * @param delimiter 구분자 — ',' (기본) 또는 '\t'
 */
export function buildRowsCsv<TData extends Record<string, unknown>>(
  rows: TData[],
  columns: ExcelColumn[],
  delimiter: string = ',',
): string {
  const headerRow = columns
    .map((c) => escapeCsvValue(c.header, delimiter))
    .join(delimiter);
  const dataRows = rows.map((row) =>
    columns
      .map((col) => {
        const v = row[col.key];
        const str = v !== null && v !== undefined ? String(v) : '';
        return escapeCsvValue(str, delimiter);
      })
      .join(delimiter),
  );
  return [headerRow, ...dataRows].join('\r\n');
}
