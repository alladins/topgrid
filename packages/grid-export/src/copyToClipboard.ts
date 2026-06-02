import type { Table } from '@tanstack/react-table';
import type { ClipboardOptions } from './types';
import { getRowsByScope } from './internal/getRowsByScope';

// ---------------------------------------------------------------------------
// Internal helper — TSV 이스케이프
// ---------------------------------------------------------------------------

/**
 * TSV 셀 값 이스케이프: 탭/개행/캐리지리턴 → 공백 치환 (D5)
 * TSV는 RFC 표준 quoting 없음 — delimiter(탭) 포함 값은 공백으로 대체가 Excel 호환 최우선 전략.
 */
function escapeTsvValue(value: string): string {
  return value.replace(/[\t\r\n]/g, ' ');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * TanStack Table 데이터를 TSV 포맷으로 클립보드에 복사한다.
 * TSV(탭 구분, 줄바꿈 행 구분) — Excel 붙여넣기 호환.
 *
 * navigator.clipboard 미지원 환경: document.execCommand('copy') fallback 시도.
 * fallback도 실패 시 Error('[grid-export] copyToClipboard: Clipboard API not supported') throw.
 *
 * @param table  TanStack v8 Table<TData> 인스턴스 (useReactTable 반환값)
 * @param options 클립보드 복사 옵션 (scope, emptyBehavior)
 * @returns Promise<void> — navigator.clipboard.writeText 는 async
 *
 * @example
 * await copyToClipboard(table);
 *
 * @example
 * await copyToClipboard(table, { scope: 'selected' });
 */
export async function copyToClipboard<TData>(
  table: Table<TData>,
  options?: ClipboardOptions,
): Promise<void> {
  const {
    scope = 'filtered',
    emptyBehavior = 'skip',
    includeHeader = true,
  } = options ?? {};

  // 1) 행 결정 (C-2: TanStack 표준 API — getRowsByScope 공유 헬퍼, D1)
  const rows = getRowsByScope(table, scope);

  // 2) 빈 데이터 처리 (EC-03)
  if (rows.length === 0 && emptyBehavior === 'skip') {
    console.warn('[grid-export] copyToClipboard: 내보낼 데이터가 없습니다.');
    return;
  }

  // 3) 헤더 행 구성 — 리프 헤더만
  const leafHeaders = table.getLeafHeaders();
  const headerRow = leafHeaders
    .map((h) => {
      const headerDef = h.column.columnDef.header;
      const text = typeof headerDef === 'string' ? headerDef : h.column.id;
      return escapeTsvValue(text);
    })
    .join('\t');

  // 4) 데이터 행 구성 (EC-07: null/undefined → 빈 문자열, EC-01/EC-02: 탭/개행 → 공백)
  const dataRows = rows.map((row) =>
    row
      .getVisibleCells()
      .map((cell) => {
        const value = cell.getValue();
        const str = value !== null && value !== undefined ? String(value) : '';
        return escapeTsvValue(str);
      })
      .join('\t'),
  );

  // 5) TSV 문자열 조립 (includeHeader 시 헤더 + 데이터, 아니면 데이터만 — 줄바꿈 행 구분)
  const tsvString = (includeHeader ? [headerRow, ...dataRows] : dataRows).join(
    '\n',
  );

  // 6) 클립보드 쓰기 (navigator.clipboard 우선, execCommand fallback — D6, EC-04)
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    await navigator.clipboard.writeText(tsvString);
  } else {
    // fallback: document.execCommand('copy') — HTTP 개발 환경 또는 구형 브라우저 (EC-04)
    const textarea = document.createElement('textarea');
    textarea.value = tsvString;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    if (!success) {
      throw new Error('[grid-export] copyToClipboard: Clipboard API not supported');
    }
  }
}
