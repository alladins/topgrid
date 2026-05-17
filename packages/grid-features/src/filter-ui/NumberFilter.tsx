/**
 * @tomis/grid-features — NumberFilter 메인 컴포넌트.
 *
 * MOD-GRID-09 G-002:
 * 컬럼 헤더 Popover + 7가지 숫자 연산자(=, !=, >, <, >=, <=, between) + 필터 인디케이터.
 *
 * AC-001: NumberFilterValue 타입 + column.setFilterValue / getFilterValue 사용
 * AC-002: numberFilterFn 등록 패턴 문서화 (Section 12 예시)
 * AC-003: 단항 연산자 → 단일 value input; between → min/max 두 input (조건부 렌더)
 * AC-004: G-001 FilterPopover 재사용 (DRY, D7)
 * AC-005: G-001 FilterIndicator 재사용 (column.getIsFiltered() 기반, D7)
 * AC-006: tsc 0 error (C-29 spread-skip 패턴 적용)
 *
 * @remarks
 * `verbatimModuleSyntax: true` — import type 분리.
 * `exactOptionalPropertyTypes: true` — popoverAlign → FilterPopover align 전달 시
 * C-29 spread-skip 패턴 (Section 4.7).
 * `noUnusedLocals/noUnusedParameters: true` — 모든 변수 사용.
 * Tailwind className 전용 (C-5). style={{}} 없음.
 */

import { useState, useEffect } from 'react';
import type { NumberFilterProps, NumberFilterOperator, NumberFilterValue } from './types';
import { FilterPopover } from './FilterPopover';
import { FilterIndicator } from './FilterIndicator';

// ---------------------------------------------------------------------------
// FunnelIcon — 인라인 SVG (신규 dep 없음 — D2, TextFilter 동일 패턴)
// ---------------------------------------------------------------------------

function FunnelIcon(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className="w-4 h-4"
    >
      <path
        fillRule="evenodd"
        d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 9 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L3.659 6.22A2.25 2.25 0 0 1 3 4.629V2.34a.75.75 0 0 1 .628-.74z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// NumberFilter 컴포넌트
// ---------------------------------------------------------------------------

/**
 * 숫자 필터 UI — 7가지 연산자 select + 조건부 input + clear 버튼.
 *
 * `FilterPopover` + `FilterIndicator`를 조합한 메인 컴포넌트 (G-001 재사용).
 * `column.setFilterValue`로 TanStack columnFilters에 연결.
 * 디바운스 300ms (D10, Section 4.6).
 * between 연산자: min/max 두 input 조건부 렌더 (AC-003, D9, Section 5.3).
 *
 * @template TData - TanStack Row data 타입.
 *
 * @example
 * ```tsx
 * // columnDef header에 렌더:
 * header: ({ column }) => (
 *   <div className="flex items-center gap-1">
 *     <span>가격</span>
 *     <NumberFilter column={column} defaultOperator="=" />
 *   </div>
 * ),
 * filterFn: numberFilterFn,
 * ```
 */
export function NumberFilter<TData>({
  column,
  defaultOperator,
  popoverAlign,
}: NumberFilterProps<TData>): JSX.Element {
  // 현재 TanStack 필터 값 읽기 (unknown → NumberFilterValue | undefined 캐스트, C-4)
  const currentValue = column.getFilterValue() as NumberFilterValue | undefined;

  // 연산자 로컬 상태
  const [operator, setOperator] = useState<NumberFilterOperator>(
    currentValue?.operator ?? defaultOperator ?? '=',
  );

  // 단항 연산자 입력값 로컬 상태 (디바운스 300ms, D10)
  const [inputValue, setInputValue] = useState<string>(
    currentValue?.value !== undefined ? String(currentValue.value) : '',
  );

  // between min/max 로컬 상태 (D10, Section 4.6)
  const [minValue, setMinValue] = useState<string>(
    currentValue?.min !== undefined ? String(currentValue.min) : '',
  );
  const [maxValue, setMaxValue] = useState<string>(
    currentValue?.max !== undefined ? String(currentValue.max) : '',
  );

  // 단항 연산자 디바운스 effect (Section 4.6)
  useEffect(() => {
    const timer = setTimeout(() => {
      const num = parseFloat(inputValue);
      if (inputValue === '' || isNaN(num)) {
        column.setFilterValue(undefined);
      } else {
        column.setFilterValue({ operator, value: num } satisfies NumberFilterValue);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue, operator, column]);

  // between 디바운스 effect (Section 4.6)
  useEffect(() => {
    if (operator !== 'between') return;
    const timer = setTimeout(() => {
      const min = parseFloat(minValue);
      const max = parseFloat(maxValue);
      const hasMin = minValue !== '' && !isNaN(min);
      const hasMax = maxValue !== '' && !isNaN(max);
      if (!hasMin && !hasMax) {
        column.setFilterValue(undefined);
      } else {
        column.setFilterValue({
          operator: 'between',
          ...(hasMin ? { min } : {}),
          ...(hasMax ? { max } : {}),
        } satisfies NumberFilterValue);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [minValue, maxValue, operator, column]);

  // clear 버튼 핸들러
  const handleClear = (): void => {
    setInputValue('');
    setMinValue('');
    setMaxValue('');
    setOperator(defaultOperator ?? '=');
    column.setFilterValue(undefined);
  };

  // 연산자 변경 핸들러 — EC-03: operator 변경 시 기존 value 상태 초기화
  const handleOperatorChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setOperator(e.target.value as NumberFilterOperator);
    // EC-03: 연산자 전환 시 clean state 보장
    setInputValue('');
    setMinValue('');
    setMaxValue('');
    column.setFilterValue(undefined);
  };

  // 단항 값 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInputValue(e.target.value);
  };

  // between min 변경 핸들러
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setMinValue(e.target.value);
  };

  // between max 변경 핸들러
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setMaxValue(e.target.value);
  };

  // C-29 spread-skip: popoverAlign → FilterPopover align 전달
  const alignProp = popoverAlign !== undefined ? { align: popoverAlign } : {};

  const isFiltered = column.getIsFiltered();

  return (
    <span className="inline-flex items-center gap-0.5">
      {/* FilterIndicator: 활성 필터 파란 dot (AC-005, G-001 재사용) */}
      <FilterIndicator isFiltered={isFiltered} />

      {/* FilterPopover: 아이콘 버튼 트리거 + 내용 (AC-004, G-001 재사용) */}
      <FilterPopover
        trigger={
          <button
            type="button"
            aria-label="숫자 필터"
            aria-pressed={isFiltered}
            className="inline-flex items-center justify-center w-5 h-5 rounded text-gray-400 hover:text-blue-500 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
          >
            <FunnelIcon />
          </button>
        }
        {...alignProp}
      >
        {/* 팝오버 내용 */}
        <div className="p-3 space-y-2">
          {/* 연산자 선택 (Section 10 — 7 options) */}
          <select
            aria-label="연산자"
            value={operator}
            onChange={handleOperatorChange}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
          >
            <option value="=">같음 (=)</option>
            <option value="!=">다름 (≠)</option>
            <option value=">">초과 (&gt;)</option>
            <option value="<">미만 (&lt;)</option>
            <option value=">=">이상 (≥)</option>
            <option value="<=">이하 (≤)</option>
            <option value="between">사이 (between)</option>
          </select>

          {/* 조건부 input 렌더 (AC-003, D9, Section 5.3) */}
          {operator === 'between' ? (
            <>
              {/* between: min input */}
              <input
                type="number"
                aria-label="최솟값"
                value={minValue}
                onChange={handleMinChange}
                placeholder="최솟값..."
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              {/* between: 구분자 */}
              <span className="block text-center text-xs text-gray-400">~</span>
              {/* between: max input */}
              <input
                type="number"
                aria-label="최댓값"
                value={maxValue}
                onChange={handleMaxChange}
                placeholder="최댓값..."
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </>
          ) : (
            /* 단항 연산자: 단일 value input */
            <input
              type="number"
              aria-label="필터 값"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="값 입력..."
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          )}

          {/* 초기화 버튼 */}
          <button
            type="button"
            onClick={handleClear}
            className="w-full px-2 py-1 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            초기화
          </button>
        </div>
      </FilterPopover>
    </span>
  );
}
