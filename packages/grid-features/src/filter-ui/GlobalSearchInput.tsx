/**
 * @tomis/grid-features — GlobalSearchInput 컴포넌트.
 *
 * MOD-GRID-09 G-004 AC-004:
 * 입력값 변경 후 300ms debounce → table.setGlobalFilter(value) 호출.
 *
 * Truth Table 5.3:
 * - "" (빈 문자열) → setGlobalFilter(undefined) (autoRemove)
 * - "   " (공백만) → trim 후 빈 문자열 → setGlobalFilter(undefined)
 * - "abc" → setGlobalFilter("abc")
 *
 * D5: useEffect + setTimeout 기반 debounce — 신규 dep 없음.
 * C-4: no any — Table<TData>.
 * C-5: Tailwind className만.
 *
 * @remarks
 * consumer useReactTable options에 globalFilter state 등록 필요:
 *   state: { ..., globalFilter },
 *   onGlobalFilterChange: setGlobalFilter,
 */

import { useState, useEffect } from 'react';
import type { GlobalSearchInputProps } from './types';

/**
 * 전체 행 검색 입력 컴포넌트 (debounce 300ms).
 *
 * @template TData - TanStack Row data 타입.
 * @param props.table - TanStack Table 인스턴스.
 * @param props.debounceMs - 디바운스 ms (기본 300).
 * @param props.placeholder - 입력 placeholder (기본 'Search all columns…').
 */
export function GlobalSearchInput<TData>({
  table,
  debounceMs = 300,
  placeholder = 'Search all columns…',
}: GlobalSearchInputProps<TData>): JSX.Element {
  const [inputValue, setInputValue] = useState('');

  // debounce: 300ms 후 table.setGlobalFilter 호출 (AC-004, D5)
  useEffect(() => {
    const trimmed = inputValue.trim();
    const timer = setTimeout(
      () => table.setGlobalFilter(trimmed === '' ? undefined : trimmed),
      debounceMs,
    );
    return () => clearTimeout(timer);
  }, [inputValue, debounceMs, table]);

  return (
    <div className="relative flex items-center">
      <svg
        className="absolute left-2 w-4 h-4 text-gray-400 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1 0 4.5 4.5a7.5 7.5 0 0 0 12.15 12.15z"
        />
      </svg>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className="pl-8 pr-3 py-1.5 rounded border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-56"
        aria-label="전체 검색"
      />
    </div>
  );
}
