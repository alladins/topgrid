/**
 * @topgrid/grid-features — DateFilter 컴포넌트.
 *
 * MOD-GRID-09 G-003:
 * react-datepicker 기반 날짜 범위(from/to) 선택 필터.
 * FilterPopover + FilterIndicator 재사용 (G-001).
 *
 * 핵심 동작:
 * - from/to DatePicker (한국어 locale, locale="ko")
 * - maxDate/minDate 역전 방지 (E1)
 * - 초기화 버튼: column.setFilterValue(undefined)
 * - C-29: popoverAlign → FilterPopover align spread-skip 패턴
 * - D4: CSS import 없음 — 소비자가 react-datepicker/dist/react-datepicker.css import
 *
 * @remarks
 * `verbatimModuleSyntax: true` — import type 필수.
 * `exactOptionalPropertyTypes: true` — optional prop 전달 시 C-29 spread-skip 패턴.
 * Tailwind className 전용 (C-5). 내부 CSS import 없음 (D4).
 */

import DatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import type { DateFilterProps, DateFilterValue } from './types';
import { FilterPopover } from './FilterPopover';
import { FilterIndicator } from './FilterIndicator';

// 한국어 로케일 1회 등록 (D10, Section 4.5)
registerLocale('ko', ko);

/**
 * 날짜 범위 필터 컴포넌트.
 *
 * FilterPopover + FilterIndicator를 재사용하여 from/to DatePicker를 렌더.
 * `column.setFilterValue` 로 TanStack Table 필터링을 트리거.
 *
 * @template TData - TanStack Row data 타입.
 *
 * @example
 * ```tsx
 * columnHelper.accessor('orderDate', {
 *   filterFn: dateRangeFilterFn,
 *   header: ({ column }) => (
 *     <div>
 *       주문일
 *       <DateFilter column={column} />
 *     </div>
 *   ),
 * });
 * ```
 */
export function DateFilter<TData>({ column, popoverAlign }: DateFilterProps<TData>): JSX.Element {
  const filterValue = column.getFilterValue() as DateFilterValue | undefined;
  const fromDate = filterValue?.from ?? null;
  const toDate = filterValue?.to ?? null;

  const handleFromChange = (date: Date | null): void => {
    const from = date ?? undefined;
    const to = filterValue?.to;
    if (from === undefined && to === undefined) {
      column.setFilterValue(undefined);
    } else {
      // C-29: exactOptionalPropertyTypes — spread-skip 패턴으로 optional props 전달
      const val: DateFilterValue = {
        ...(from !== undefined ? { from } : {}),
        ...(to !== undefined ? { to } : {}),
      };
      column.setFilterValue(val);
    }
  };

  const handleToChange = (date: Date | null): void => {
    const from = filterValue?.from;
    const to = date ?? undefined;
    if (from === undefined && to === undefined) {
      column.setFilterValue(undefined);
    } else {
      // C-29: exactOptionalPropertyTypes — spread-skip 패턴으로 optional props 전달
      const val: DateFilterValue = {
        ...(from !== undefined ? { from } : {}),
        ...(to !== undefined ? { to } : {}),
      };
      column.setFilterValue(val);
    }
  };

  const handleClear = (): void => {
    column.setFilterValue(undefined);
  };

  // 날짜 범위 요약 텍스트
  const summaryText = (): string => {
    if (fromDate && toDate) {
      const fmt = (d: Date): string =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return `${fmt(fromDate)} ~ ${fmt(toDate)}`;
    }
    if (fromDate) {
      const d = fromDate;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ~`;
    }
    if (toDate) {
      const d = toDate;
      return `~ ${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    return '날짜 필터';
  };

  const isFiltered = column.getIsFiltered();

  const trigger = (
    <button
      type="button"
      aria-label="날짜 필터"
      aria-pressed={isFiltered}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      <FilterIndicator isFiltered={isFiltered} />
      <span className="truncate max-w-[120px]">{summaryText()}</span>
    </button>
  );

  // C-29: popoverAlign undefined일 때 prop 전달 안 함 (spread-skip)
  return (
    <FilterPopover
      trigger={trigger}
      {...(popoverAlign !== undefined ? { align: popoverAlign } : {})}
    >
      <div className="p-3 space-y-2 min-w-[220px]">
        {/* 시작일 */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">시작일</label>
          <DatePicker
            selected={fromDate}
            onChange={handleFromChange}
            locale="ko"
            placeholderText="시작일"
            dateFormat="yyyy-MM-dd"
            // C-29: maxDate? → spread-skip (toDate is Date | null; pass Date only when non-null)
            {...(toDate !== null ? { maxDate: toDate } : {})}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        {/* 종료일 */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">종료일</label>
          <DatePicker
            selected={toDate}
            onChange={handleToChange}
            locale="ko"
            placeholderText="종료일"
            dateFormat="yyyy-MM-dd"
            // C-29: minDate? → spread-skip (fromDate is Date | null; pass Date only when non-null)
            {...(fromDate !== null ? { minDate: fromDate } : {})}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        {/* 초기화 */}
        <button
          type="button"
          onClick={handleClear}
          className="w-full px-2 py-1 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          초기화
        </button>
      </div>
    </FilterPopover>
  );
}
