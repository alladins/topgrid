/**
 * 커스텀 filter 함수 + 순수 filter 값/연산자 타입 (W1 Phase 0, grid-features 에서 이관).
 *
 * 프레임워크 무관: TanStack `FilterFn` 은 row 데이터에만 의존(렌더 무관). React(grid-features)·
 * Vue 어댑터가 동일 predicate 를 공유한다. import 를 react-table→table-core 로 전환(동일 인스턴스).
 * 값/연산자 타입은 순수 데이터(연산자 문자열 + value/min/max/from/to) — 렌더 prop 타입은 grid-features 잔류.
 */
import { filterFns } from '@tanstack/table-core';
import type { FilterFn, Row } from '@tanstack/table-core';
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';

// ─── 순수 값/연산자 타입 (grid-features filter-ui/types.ts 에서 이관) ───
export type TextFilterOperator = 'contains' | 'equals' | 'startsWith' | 'endsWith';
export interface TextFilterValue {
  operator: TextFilterOperator;
  value: string;
}

export type NumberFilterOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'between';
export interface NumberFilterValue {
  operator: NumberFilterOperator;
  value?: number;
  min?: number;
  max?: number;
}

export interface DateFilterValue {
  from?: Date;
  to?: Date;
}

// ─── textFilterFn ───
export const textFilterFn: FilterFn<unknown> = <TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: TextFilterValue,
): boolean => {
  const rawCell: unknown = row.getValue(columnId);
  if (rawCell == null) return false;
  const cellStr = String(rawCell).toLowerCase();
  const filterStr = filterValue.value.trim().toLowerCase();
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
      const _exhaustive: never = filterValue.operator;
      return _exhaustive;
    }
  }
};
textFilterFn.autoRemove = (val: TextFilterValue | undefined): boolean =>
  !val || val.value.trim() === '';

// ─── numberFilterFn ───
export const numberFilterFn: FilterFn<unknown> = <TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: NumberFilterValue,
): boolean => {
  const rawCell: unknown = row.getValue(columnId);
  if (rawCell == null) return false;
  const cell = Number(rawCell);
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
      const _exhaustive: never = operator;
      return _exhaustive;
    }
  }
};
numberFilterFn.autoRemove = (val: NumberFilterValue | undefined): boolean => {
  if (!val) return true;
  if (val.operator === 'between') {
    return (
      (val.min === undefined || isNaN(val.min)) && (val.max === undefined || isNaN(val.max))
    );
  }
  return val.value === undefined || isNaN(val.value);
};

// ─── dateRangeFilterFn ───
export const dateRangeFilterFn: FilterFn<unknown> = <TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: DateFilterValue,
): boolean => {
  const rawCell: unknown = row.getValue(columnId);
  if (rawCell == null) return false;
  const cellDate = new Date(rawCell as string | number | Date);
  if (isNaN(cellDate.getTime())) return false;
  const { from, to } = filterValue;
  if (from === undefined && to === undefined) return true;
  if (from !== undefined && to === undefined) {
    return cellDate >= startOfDay(from);
  }
  if (from === undefined && to !== undefined) {
    return cellDate <= endOfDay(to);
  }
  try {
    return isWithinInterval(cellDate, {
      start: startOfDay(from as Date),
      end: endOfDay(to as Date),
    });
  } catch {
    return false;
  }
};
dateRangeFilterFn.autoRemove = (val: DateFilterValue | undefined): boolean =>
  !val || (val.from === undefined && val.to === undefined);

// ─── selectFilterFn — table-core 내장 arrIncludes re-export ───
export const selectFilterFn = filterFns.arrIncludes;
