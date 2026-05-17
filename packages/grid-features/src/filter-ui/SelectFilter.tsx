/**
 * @tomis/grid-features — SelectFilter 컴포넌트.
 *
 * MOD-GRID-09 G-004 AC-001:
 * column.getFacetedUniqueValues() Map 읽어 체크박스 옵션 렌더.
 * 선택 시 column.setFilterValue(string[] | undefined) 호출.
 *
 * AC-003: 옵션 수 >= searchThreshold(기본 50) 시 내부 검색 input 자동 노출.
 *         String.includes 대소문자 무시 — 신규 dep 없음 (D4).
 *
 * C-29: popoverAlign optional prop → FilterPopover align에 spread-skip 전달.
 * C-4: no any — Column<TData, unknown>.
 * C-5: Tailwind className만.
 * NFR-5: 체크박스 <input type="checkbox"> 네이티브, label 연결 필수.
 *
 * @remarks
 * consumer useReactTable options에 반드시 등록 필요 (D3):
 *   getFacetedRowModel: getFacetedRowModel(),
 *   getFacetedUniqueValues: getFacetedUniqueValues(),
 */

import { useState, useId } from 'react';
import { FilterPopover } from './FilterPopover';
import { FilterIndicator } from './FilterIndicator';
import type { SelectFilterProps } from './types';

/**
 * Excel-style 다중선택 체크박스 필터 컴포넌트.
 *
 * @template TData - TanStack Row data 타입.
 * @param props.column - TanStack Column 인스턴스.
 * @param props.searchThreshold - 내부 검색 노출 임계값 (기본 50).
 * @param props.popoverAlign - 팝오버 정렬 방향 (기본 'left').
 */
export function SelectFilter<TData>({
  column,
  searchThreshold = 50,
  popoverAlign,
}: SelectFilterProps<TData>): JSX.Element {
  const [searchText, setSearchText] = useState('');
  const searchInputId = useId();

  // getFacetedUniqueValues()는 consumer가 getFacetedRowModel 등록해야 동작 (D3)
  const uniqueValues = column.getFacetedUniqueValues();
  const currentFilter = column.getFilterValue() as string[] | undefined;
  const isFiltered = column.getIsFiltered();

  // Map entries: [value, count][]
  const allOptions = Array.from(uniqueValues.entries()) as [unknown, number][];

  // 내부 검색 필터링 (대소문자 무시, AC-003, D4)
  const showSearch = uniqueValues.size >= searchThreshold;
  const filteredOptions = showSearch
    ? allOptions.filter(([val]) =>
        String(val === '' ? '' : val)
          .toLowerCase()
          .includes(searchText.toLowerCase()),
      )
    : allOptions;

  // 선택된 값 Set (렌더 O(1) 조회용)
  const selectedSet = new Set(currentFilter ?? []);

  // 전체 선택 여부 — 옵션이 있고 모두 선택됐을 때
  const allSelected =
    allOptions.length > 0 &&
    allOptions.every(([val]) => selectedSet.has(String(val)));

  /**
   * 체크박스 토글 핸들러.
   * 선택 해제 후 빈 배열이면 undefined (autoRemove) 전달.
   */
  const handleToggle = (optionValue: string): void => {
    const next = new Set(selectedSet);
    if (next.has(optionValue)) {
      next.delete(optionValue);
    } else {
      next.add(optionValue);
    }
    const arr = Array.from(next);
    column.setFilterValue(arr.length > 0 ? arr : undefined);
  };

  /** 전체 선택 / 해제 토글 */
  const handleToggleAll = (): void => {
    if (allSelected) {
      // 전체 해제 → undefined (autoRemove, Truth Table 5.1 row 4)
      column.setFilterValue(undefined);
    } else {
      column.setFilterValue(allOptions.map(([val]) => String(val)));
    }
  };

  // 트리거: 칼럼명 + 활성 인디케이터
  const trigger = (
    <button
      type="button"
      className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
      aria-label={`${column.id} 필터`}
    >
      <span>{column.id}</span>
      <FilterIndicator isFiltered={isFiltered} />
      <svg
        className="w-3 h-3 text-gray-400"
        fill="none"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 8l4 4 4-4"
        />
      </svg>
    </button>
  );

  return (
    <FilterPopover
      {...(popoverAlign !== undefined ? { align: popoverAlign } : {})}
      trigger={trigger}
    >
      <div className="p-2 w-52">
        {/* 내부 검색 input — searchThreshold 충족 시만 노출 (AC-003, D4) */}
        {showSearch && (
          <div className="mb-2">
            <label htmlFor={searchInputId} className="sr-only">
              옵션 검색
            </label>
            <input
              id={searchInputId}
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search options…"
              className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* 전체 선택/해제 (Truth Table 5.1 row 4) */}
        {allOptions.length > 0 && (
          <div className="mb-1 border-b border-gray-100 pb-1">
            <label className="flex items-center gap-2 cursor-pointer px-1 py-0.5 rounded hover:bg-gray-50 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleToggleAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              전체 선택/해제
            </label>
          </div>
        )}

        {/* 옵션 목록 */}
        {filteredOptions.length === 0 ? (
          <p className="px-1 py-1 text-xs text-gray-400">No options</p>
        ) : (
          <ul className="max-h-48 overflow-y-auto space-y-0.5">
            {filteredOptions.map(([val, count]) => {
              // E-3: 빈 문자열 → "(blank)" 레이블
              const rawStr = String(val);
              const displayLabel = rawStr === '' ? '(blank)' : rawStr;
              const optId = `${searchInputId}-opt-${rawStr}`;
              const isChecked = selectedSet.has(rawStr);

              return (
                <li key={rawStr}>
                  <label
                    htmlFor={optId}
                    className="flex items-center gap-2 cursor-pointer px-1 py-0.5 rounded hover:bg-gray-50"
                  >
                    <input
                      id={optId}
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(rawStr)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="flex-1 truncate text-xs text-gray-700">
                      {displayLabel}
                    </span>
                    <span className="text-xs text-gray-400">({count})</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </FilterPopover>
  );
}
