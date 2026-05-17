/**
 * @tomis/grid-features — TextFilter 메인 컴포넌트.
 *
 * MOD-GRID-09 G-001:
 * 컬럼 헤더 Popover + contains/equals/startsWith/endsWith 연산자 + 필터 인디케이터.
 *
 * AC-001: TextFilterValue 타입 + column.setFilterValue / getFilterValue 사용
 * AC-002: filterFn 등록 패턴 문서화 (Section 12 예시)
 * AC-003: FilterPopover 사용 (네이티브 div, D2)
 * AC-004: FilterIndicator (파란 dot, column.getIsFiltered())
 * AC-005: clear 버튼 → column.setFilterValue(undefined)
 * AC-006: tsc 0 error (C-29 spread-skip 패턴 적용)
 *
 * @remarks
 * `verbatimModuleSyntax: true` — import type 분리.
 * `exactOptionalPropertyTypes: true` — popoverAlign → FilterPopover align 전달 시
 * C-29 spread-skip 패턴 (Section 4.6).
 * `noUnusedLocals/noUnusedParameters: true` — 모든 변수 사용.
 * Tailwind className 전용 (C-5).
 */

import { useState, useEffect } from 'react';
import type { TextFilterProps, TextFilterOperator, TextFilterValue } from './types';
import { FilterPopover } from './FilterPopover';
import { FilterIndicator } from './FilterIndicator';

// ---------------------------------------------------------------------------
// FunnelIcon — 인라인 SVG (신규 dep 없음, D2)
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
// TextFilter 컴포넌트
// ---------------------------------------------------------------------------

/**
 * 텍스트 필터 UI — 연산자 select + 값 input + clear 버튼.
 *
 * `FilterPopover` + `FilterIndicator`를 조합한 메인 컴포넌트.
 * `column.setFilterValue`로 TanStack columnFilters에 연결.
 * 디바운스 300ms (D6, Section 4.5).
 *
 * @template TData - TanStack Row data 타입.
 *
 * @example
 * ```tsx
 * // columnDef header에 렌더:
 * header: ({ column }) => (
 *   <div className="flex items-center gap-1">
 *     <span>이름</span>
 *     <TextFilter column={column} defaultOperator="contains" />
 *   </div>
 * ),
 * filterFn: textFilterFn,
 * ```
 */
export function TextFilter<TData>({
  column,
  defaultOperator,
  popoverAlign,
}: TextFilterProps<TData>): JSX.Element {
  // 현재 TanStack 필터 값 읽기 (unknown → TextFilterValue | undefined 캐스트, C-4)
  const currentValue = column.getFilterValue() as TextFilterValue | undefined;

  // 연산자 로컬 상태
  const [operator, setOperator] = useState<TextFilterOperator>(
    currentValue?.operator ?? defaultOperator ?? 'contains',
  );

  // 입력값 로컬 상태 (디바운스 300ms, D6)
  const [inputValue, setInputValue] = useState<string>(currentValue?.value ?? '');

  // 디바운스 effect: inputValue 또는 operator 변경 시 300ms 후 setFilterValue (Section 4.5)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue.trim() === '') {
        column.setFilterValue(undefined);
      } else {
        column.setFilterValue({ operator, value: inputValue } satisfies TextFilterValue);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue, operator, column]);

  // clear 버튼 핸들러 (AC-005)
  const handleClear = (): void => {
    setInputValue('');
    setOperator(defaultOperator ?? 'contains');
    column.setFilterValue(undefined);
  };

  // 연산자 변경 핸들러
  const handleOperatorChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setOperator(e.target.value as TextFilterOperator);
  };

  // 입력값 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInputValue(e.target.value);
  };

  // C-29 spread-skip: popoverAlign → FilterPopover align 전달
  const alignProp = popoverAlign !== undefined ? { align: popoverAlign } : {};

  const isFiltered = column.getIsFiltered();

  return (
    <span className="inline-flex items-center gap-0.5">
      {/* FilterIndicator: 활성 필터 파란 dot (AC-004) */}
      <FilterIndicator isFiltered={isFiltered} />

      {/* FilterPopover: 아이콘 버튼 트리거 + 내용 (AC-003) */}
      <FilterPopover
        trigger={
          <button
            type="button"
            aria-label="필터"
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
          {/* 연산자 선택 */}
          <select
            aria-label="연산자"
            value={operator}
            onChange={handleOperatorChange}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
          >
            <option value="contains">포함</option>
            <option value="equals">같음</option>
            <option value="startsWith">시작</option>
            <option value="endsWith">끝</option>
          </select>

          {/* 값 입력 */}
          <input
            type="text"
            aria-label="필터 값"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="값 입력..."
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
          />

          {/* 초기화 버튼 (AC-005) */}
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
