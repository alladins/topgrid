import type { Table } from '@tanstack/react-table';
import type { PrintOptions } from './types';
import { getRowsByScope } from './internal/getRowsByScope';

/**
 * TanStack Table 데이터를 새 팝업 창에 HTML 테이블로 렌더링하여 인쇄 대화상자를 연다.
 * 순수 Web API 전용 (window.open + document.write + window.print).
 *
 * 팝업 차단 환경: console.warn 후 즉시 반환 (D7 — throw 하지 않음).
 * printGrid 자체는 동기 반환 (void). 실제 print 발화는 popup.onload 내에서 비동기 실행 (D4).
 *
 * @param table  TanStack v8 Table<TData> 인스턴스 (useReactTable 반환값)
 * @param options 인쇄 옵션 (title, scope, orientation, emptyBehavior)
 * @returns void
 *
 * @example
 * printGrid(table);
 *
 * @example
 * printGrid(table, { title: '계약 목록', scope: 'filtered', orientation: 'l' });
 */
export function printGrid<TData>(
  table: Table<TData>,
  options?: PrintOptions,
): void {
  const {
    title,
    scope = 'filtered',
    orientation = 'p',
    emptyBehavior = 'skip',
  } = options ?? {};

  // 1) 행 결정 (C-2: TanStack 표준 API — getRowsByScope 공유 헬퍼, D1)
  const rows = getRowsByScope(table, scope);

  // 2) 빈 데이터 처리 (EC-03)
  if (rows.length === 0 && emptyBehavior === 'skip') {
    console.warn('[grid-export] printGrid: 내보낼 데이터가 없습니다.');
    return;
  }

  // 3) 헤더 HTML 구성
  const leafHeaders = table.getLeafHeaders();
  const headerHtml = leafHeaders
    .map((h) => {
      const headerDef = h.column.columnDef.header;
      const text = typeof headerDef === 'string' ? headerDef : h.column.id;
      return `<th>${text}</th>`;
    })
    .join('');

  // 4) 데이터 행 HTML 구성 (EC-07: null/undefined → 빈 문자열)
  const bodyHtml = rows
    .map((row) => {
      const cells = row
        .getVisibleCells()
        .map((cell) => {
          const value = cell.getValue();
          const str = value !== null && value !== undefined ? String(value) : '';
          return `<td>${str}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  // 5) HTML 문서 구성
  const orientationCss = orientation === 'l' ? 'landscape' : 'portrait';
  const titleHtml = title ? `<h2>${title}</h2>` : '';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title ?? ''}</title>
<style>
  @page { size: ${orientationCss}; }
  body { font-family: sans-serif; font-size: 12px; margin: 16px; }
  h2 { font-size: 16px; margin-bottom: 12px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; page-break-inside: avoid; }
  th { background: #f0f0f0; }
  @media print {
    body { margin: 0; }
  }
</style>
</head>
<body>
${titleHtml}
<table>
  <thead><tr>${headerHtml}</tr></thead>
  <tbody>${bodyHtml}</tbody>
</table>
</body>
</html>`;

  // 6) 팝업 창 열기 (EC-05: null 반환 = 팝업 차단 → D7 warn + return)
  const popup = window.open('', '_blank');
  if (!popup) {
    console.warn(
      '[grid-export] printGrid: 팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용 후 재시도하세요.',
    );
    return;
  }

  // 7) EC-06: onload 등록을 document.write **이전**에 해야 함 (Firefox/Safari 호환)
  //    about:blank의 load 이벤트는 document.write 시점에 이미 발화될 수 있으므로
  //    write 이후 등록 시 핸들러가 실행되지 않을 위험이 있음.
  popup.onload = () => {
    popup.print();
    popup.close();
  };

  popup.document.write(html);
  popup.document.close();
}
