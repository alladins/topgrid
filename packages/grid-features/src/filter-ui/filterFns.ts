/**
 * @topgrid/grid-features — TextFilter 커스텀 filterFn.
 *
 * MOD-GRID-09 G-001 AC-002: TanStack FilterFn<unknown> 구현.
 *
 * 동작 정의 (Section 4.4, D5):
 * - 대소문자 무시 (case-insensitive toLowerCase 변환)
 * - 공백 trim (filterValue.value.trim())
 * - empty value → autoRemove 트리거 → 필터 자동 해제
 * - null/undefined cellValue → false (null-safe)
 *
 * @remarks
 * `verbatimModuleSyntax: true` — import type 필수.
 * `noUnusedParameters: true` — row.getValue(columnId) 로 columnId 사용.
 */

import { filterFns } from '@tanstack/react-table';
import type { FilterFn, Row } from '@tanstack/react-table';
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import type { TextFilterValue, NumberFilterValue, DateFilterValue } from './types';

// ---------------------------------------------------------------------------
// textFilterFn 구현 (AC-002, Section 4.3)
// ---------------------------------------------------------------------------

/**
 * TanStack 커스텀 filterFn — 4가지 텍스트 연산자 지원.
 *
 * columnDef에 `filterFn: textFilterFn` 으로 직접 참조 방식 등록.
 * (타입 안전 + tree-shaking 친화적 — Section 4.3)
 *
 * `autoRemove`: filterValue.value.trim() === '' 일 때 TanStack이 필터를 자동 제거.
 *
 * @example
 * ```typescript
 * columnHelper.accessor('name', {
 *   filterFn: textFilterFn,
 *   header: ({ column }) => <TextFilter column={column} />,
 * });
 * ```
 */
export const textFilterFn: FilterFn<unknown> = <TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: TextFilterValue,
): boolean => {
  const rawCell: unknown = row.getValue(columnId);

  // null/undefined cell → false (null-safe, Section 4.4 edge case)
  if (rawCell == null) return false;

  const cellStr = String(rawCell).toLowerCase();
  const filterStr = filterValue.value.trim().toLowerCase();

  // empty filterStr 는 autoRemove 가 처리하지만 방어적 check
  if (filterStr === '') return true;

  switch (filterValue.operator) {
    case 'contains':
      return cellStr.includes(filterStr);
    case 'equals':
      return cellStr === filterStr;
    case 'startsWith':
      return cellStr.startsWith(filterStr);
    case 'endsWith':
      return cellStr.endsWith(filterStr);
    default: {
      // exhaustive check — never 도달
      const _exhaustive: never = filterValue.operator;
      return _exhaustive;
    }
  }
};

/**
 * TanStack autoRemove 등록.
 * filterValue.value.trim() === '' 이면 TanStack이 자동으로 해당 컬럼 필터를 제거.
 * (D5, Section 4.3)
 */
textFilterFn.autoRemove = (val: TextFilterValue | undefined): boolean =>
  !val || val.value.trim() === '';

// ---------------------------------------------------------------------------
// numberFilterFn 구현 (MOD-GRID-09 G-002 AC-002)
// ---------------------------------------------------------------------------

/**
 * TanStack 커스텀 filterFn — 7가지 숫자 연산자 지원.
 *
 * 연산자: = / != / > / < / >= / <= / between
 * - between: min <= cell <= max (양끝 inclusive, inNumberRange semantics — D2)
 * - null-safe: rawCell == null → false
 * - NaN-safe: Number(rawCell) isNaN → false
 *
 * `autoRemove`:
 * - 단항 연산자: value === undefined 또는 isNaN(value)
 * - between: (min === undefined || isNaN(min)) && (max === undefined || isNaN(max))
 *
 * columnDef에 `filterFn: numberFilterFn` 으로 직접 참조 방식 등록.
 *
 * @example
 * ```typescript
 * columnHelper.accessor('price', {
 *   filterFn: numberFilterFn,
 *   header: ({ column }) => <NumberFilter column={column} />,
 * });
 * ```
 */
export const numberFilterFn: FilterFn<unknown> = <TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: NumberFilterValue,
): boolean => {
  const rawCell: unknown = row.getValue(columnId);

  // null/undefined cell → false (null-safe, D11)
  if (rawCell == null) return false;

  const cell = Number(rawCell);

  // NaN cell → false (NaN-safe, D11)
  if (isNaN(cell)) return false;

  const { operator, value, min, max } = filterValue;

  switch (operator) {
    case '=':
      return value !== undefined && !isNaN(value) ? cell === value : true;
    case '!=':
      return value !== undefined && !isNaN(value) ? cell !== value : true;
    case '>':
      return value !== undefined && !isNaN(value) ? cell > value : true;
    case '<':
      return value !== undefined && !isNaN(value) ? cell < value : true;
    case '>=':
      return value !== undefined && !isNaN(value) ? cell >= value : true;
    case '<=':
      return value !== undefined && !isNaN(value) ? cell <= value : true;
    case 'between': {
      const minOk = min !== undefined && !isNaN(min) ? cell >= min : true;
      const maxOk = max !== undefined && !isNaN(max) ? cell <= max : true;
      return minOk && maxOk;
    }
    default: {
      // exhaustive check — never 도달
      const _exhaustive: never = operator;
      return _exhaustive;
    }
  }
};

/**
 * TanStack autoRemove 등록 (D6, Section 4.3).
 * - 단항: value undefined 또는 NaN → 필터 자동 해제.
 * - between: min AND max 모두 undefined/NaN → 자동 해제 (단방향 bound은 유지).
 */
numberFilterFn.autoRemove = (val: NumberFilterValue | undefined): boolean => {
  if (!val) return true;
  if (val.operator === 'between') {
    return (
      (val.min === undefined || isNaN(val.min)) &&
      (val.max === undefined || isNaN(val.max))
    );
  }
  return val.value === undefined || isNaN(val.value);
};

// ---------------------------------------------------------------------------
// dateRangeFilterFn 구현 (MOD-GRID-09 G-003 AC-002)
// ---------------------------------------------------------------------------

/**
 * TanStack 커스텀 filterFn — 날짜 범위(from/to) 필터.
 *
 * - cell value: Date instance | ISO string | number(epoch ms) — `new Date(cell)` 변환
 * - startOfDay(from) / endOfDay(to) 자정 정규화 (D6 로컬 타임존 기준)
 * - 단일 bound 지원: from-only → cell ≥ startOfDay(from), to-only → cell ≤ endOfDay(to)
 * - isWithinInterval RangeError (from > to) → try-catch → false (E1)
 * - null-safe / NaN-safe / empty-string-safe (T1~T4, E4)
 *
 * `autoRemove`: from과 to 모두 undefined 일 때 TanStack이 필터를 자동 제거.
 *
 * @example
 * ```typescript
 * columnHelper.accessor('orderDate', {
 *   filterFn: dateRangeFilterFn,
 *   header: ({ column }) => <DateFilter column={column} />,
 * });
 * ```
 */
export const dateRangeFilterFn: FilterFn<unknown> = <TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: DateFilterValue,
): boolean => {
  const rawCell: unknown = row.getValue(columnId);

  // null/undefined cell → false (null-safe, T1/T2)
  if (rawCell == null) return false;

  // cell 변환: Date | ISO string | number(epoch ms) → Date instance (D12)
  const cellDate = new Date(rawCell as string | number | Date);

  // Invalid Date → false (NaN-safe, T3/E4)
  if (isNaN(cellDate.getTime())) return false;

  const { from, to } = filterValue;

  // 양쪽 모두 undefined → autoRemove (T4) — 방어적 check (autoRemove가 처리하지만 안전)
  if (from === undefined && to === undefined) return true;

  // from-only: cell ≥ startOfDay(from) (T5/T6, D7)
  if (from !== undefined && to === undefined) {
    return cellDate >= startOfDay(from);
  }

  // to-only: cell ≤ endOfDay(to) (T7/T8, D7)
  if (from === undefined && to !== undefined) {
    return cellDate <= endOfDay(to);
  }

  // 양쪽 bound: isWithinInterval (T9~T12, E1)
  try {
    return isWithinInterval(cellDate, {
      start: startOfDay(from as Date),
      end: endOfDay(to as Date),
    });
  } catch {
    // RangeError: from > to (E1) → false
    return false;
  }
};

/**
 * TanStack autoRemove 등록 (D7, Section 4.2).
 * from과 to 모두 undefined 일 때 TanStack이 해당 컬럼 필터를 자동 제거.
 * 단일 bound (from-only 또는 to-only)는 필터 유지.
 */
dateRangeFilterFn.autoRemove = (val: DateFilterValue | undefined): boolean =>
  !val || (val.from === undefined && val.to === undefined);

// ---------------------------------------------------------------------------
// selectFilterFn — TanStack built-in arrIncludes re-export (MOD-GRID-09 G-004 D2)
// ---------------------------------------------------------------------------

/**
 * TanStack 커스텀 filterFn — 다중선택 배열 포함 필터.
 *
 * `filterFns.arrIncludes` re-export: cell value가 filterValue 배열의
 * 임의 요소와 일치하면 true.
 *
 * `autoRemove`: filterValue?.length === 0 시 TanStack이 자동 필터 해제.
 *
 * columnDef에 `filterFn: selectFilterFn` 으로 직접 참조 방식 등록.
 *
 * 주의: consumer useReactTable options에
 * `getFacetedRowModel: getFacetedRowModel()` 과
 * `getFacetedUniqueValues: getFacetedUniqueValues()` 등록 필수 (D3).
 *
 * @example
 * ```typescript
 * columnHelper.accessor('category', {
 *   filterFn: selectFilterFn,
 *   header: ({ column }) => <SelectFilter column={column} />,
 * });
 * ```
 */
export const selectFilterFn = filterFns.arrIncludes;
