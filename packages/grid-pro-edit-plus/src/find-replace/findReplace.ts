import type { CellMatch, FindOptions, Replacement } from './types';

/**
 * find & replace 순수 코어 — MOD-GRID-23 G-3. React·tracking·range 무의존(순수) → node 전수 검증.
 *
 * **비-문자열 셀 의미([[LESS-004]] 류 회피 — 명시)**: 매칭은 항상 `String(value)` 로 한다(숫자·불리언
 * 등도 문자열화 비교). 치환 결과 `next` 는 **항상 문자열** — 부분치환을 숫자 셀에 적용하면 문자열이
 * 된다. 타입 보존이 필요하면 소비자가 `columnIds` 를 텍스트 컬럼으로 한정하거나 적용 시 coerce 한다.
 * `null`/`undefined` 셀은 건너뛴다('null' 로 문자열화하지 않음).
 */

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isMatch(
  haystack: string,
  query: string,
  mode: 'substring' | 'whole',
  caseSensitive: boolean,
): boolean {
  const h = caseSensitive ? haystack : haystack.toLowerCase();
  const q = caseSensitive ? query : query.toLowerCase();
  return mode === 'whole' ? h === q : h.includes(q);
}

/**
 * `columnIds` 컬럼에서 `query` 와 일치하는 셀을 찾는다(범위 한정 = columnIds 스코핑, AC ②).
 * 빈 query → `[]`. `null`/`undefined` 셀 skip.
 *
 * @param rows       검색 대상 행(예: `tracking.rows`)
 * @param getRowKey  행→rowKey 추출(tracking 의 rowKey 와 동일)
 * @param columnIds  검색할 컬럼 id 목록(범위 한정)
 */
export function findMatches<TData>(
  rows: readonly TData[],
  getRowKey: (row: TData) => string,
  columnIds: readonly string[],
  query: string,
  options?: FindOptions,
): CellMatch[] {
  if (query === '') return [];
  const caseSensitive = options?.caseSensitive ?? false;
  const mode = options?.matchMode ?? 'substring';
  const result: CellMatch[] = [];
  for (const row of rows) {
    const rec = row as Record<string, unknown>;
    for (const columnId of columnIds) {
      const value = rec[columnId];
      if (value === undefined || value === null) continue;
      if (isMatch(String(value), query, mode, caseSensitive)) {
        result.push({ rowKey: getRowKey(row), columnId, value });
      }
    }
  }
  return result;
}

/**
 * 검색 결과를 치환 패치로 변환(AC ②). **G-2 조합**: 반환의 `{rowKey, columnId, prior, next}` 는
 * `tracking.updateRow(rowKey, {[columnId]: next})` + `makeUpdateCommand(...)` 로 바로 undo 가능하게 적용된다.
 *
 * `'whole'` → `next = replacement`. `'substring'` → `String(value)` 의 모든 일치를 `replacement` 로
 * 치환(대소문자 구분 시 단순 split/join, 비구분 시 `gi` 정규식). `next` 는 항상 문자열.
 */
export function computeReplacements(
  matches: readonly CellMatch[],
  query: string,
  replacement: string,
  options?: FindOptions,
): Replacement[] {
  const caseSensitive = options?.caseSensitive ?? false;
  const mode = options?.matchMode ?? 'substring';
  return matches.map((m) => {
    const haystack = String(m.value);
    let next: string;
    if (mode === 'whole') {
      next = replacement;
    } else if (caseSensitive) {
      next = haystack.split(query).join(replacement);
    } else {
      next = haystack.replace(
        new RegExp(escapeRegExp(query), 'gi'),
        replacement,
      );
    }
    return { rowKey: m.rowKey, columnId: m.columnId, prior: m.value, next };
  });
}
