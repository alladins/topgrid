/**
 * @topgrid/grid-pro-range — RFC 4180 호환 TSV 유틸리티 (G-004, AC-003).
 *
 * stringifyTsv: 2D 값 배열 → TSV 문자열 (탭/줄바꿈 포함 셀은 " 래핑)
 * parseTsv: TSV 문자열 → 2D string 배열
 *
 * grid-export/copyToClipboard.ts의 공백 치환 escapeTsvValue와 다른 전략:
 * - grid-export: 행 단위 복사, 특수문자 → 공백 (D6 역할 분리)
 * - tsvUtils: 셀 범위 단위 복사, RFC 4180 완전 보존
 *
 * 두 함수 모두 부수효과 없음 — 순수 함수 (pure functions).
 */

/**
 * 단일 셀 값을 RFC 4180 TSV 포맷으로 이스케이프.
 * - 탭(\t), 줄바꿈(\n, \r), 쌍따옴표(") 포함 시 " 래핑
 * - 셀 내부 " → "" (RFC 4180 §2.7)
 */
function escapeTsvCell(value: string): string {
  const needsQuoting =
    value.includes('\t') || value.includes('\n') || value.includes('\r') || value.includes('"');
  if (!needsQuoting) return value;
  return '"' + value.replace(/"/g, '""') + '"';
}

/**
 * 2D 값 배열을 RFC 4180 호환 TSV 문자열로 직렬화.
 * 행 구분: \n, 셀 구분: \t.
 *
 * @param matrix row-major 2D 배열. 빈 배열이면 빈 문자열 반환.
 */
export function stringifyTsv(matrix: readonly (readonly unknown[])[]): string {
  if (matrix.length === 0) return '';
  return matrix
    .map((row) =>
      row
        .map((cell) =>
          escapeTsvCell(cell === null || cell === undefined ? '' : String(cell)),
        )
        .join('\t'),
    )
    .join('\n');
}

/**
 * RFC 4180 호환 TSV 문자열을 2D string 배열로 파싱.
 * - " 래핑 셀: 언래핑 + "" → " 복원
 * - 빈 문자열 또는 공백만: [['']] 반환
 *
 * @param tsv TSV 문자열 (Excel 복사 형식 포함).
 * @returns row-major 2D string 배열. 행 수 = rows, 최대 열 수 = cols.
 */
export function parseTsv(tsv: string): string[][] {
  if (tsv.trim() === '') return [['']];

  // 줄바꿈 정규화: \r\n → \n, 단독 \r → \n
  const normalized = tsv.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // 말미 \n 제거 (Excel이 마지막 행 후 \n 추가하는 경우)
  const trimmed = normalized.endsWith('\n') ? normalized.slice(0, -1) : normalized;

  const rows: string[][] = [];
  const lines = trimmed.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const row: string[] = [];
    let line = lines[i];
    let col = 0;

    while (line.length > 0 || col === 0) {
      if (line.startsWith('"')) {
        // RFC 4180 쌍따옴표 래핑 셀: 다음 언이스케이프된 " 까지
        let j = 1;
        let cell = '';
        while (j < line.length) {
          if (line[j] === '"') {
            if (j + 1 < line.length && line[j + 1] === '"') {
              // "" → "
              cell += '"';
              j += 2;
            } else {
              // 닫는 "
              j++;
              break;
            }
          } else {
            cell += line[j];
            j++;
          }
        }
        row.push(cell);
        line = line.slice(j);
        // 다음 탭 또는 EOL
        if (line.startsWith('\t')) {
          line = line.slice(1);
        } else {
          break;
        }
      } else {
        // 일반 셀: 다음 탭까지
        const tabIdx = line.indexOf('\t');
        if (tabIdx === -1) {
          row.push(line);
          line = '';
          break;
        } else {
          row.push(line.slice(0, tabIdx));
          line = line.slice(tabIdx + 1);
        }
      }
      col++;
    }
    rows.push(row);
  }

  return rows;
}
