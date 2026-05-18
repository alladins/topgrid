/**
 * @topgrid/grid-core — ColumnVisibilityMenu component.
 *
 * MOD-GRID-04 G-003: 컬럼 가시성 토글 UI.
 *
 * ## 결정 원칙
 * - D3: native HTML `<details>/<summary>/<input type="checkbox">` 사용.
 *       Radix UI DropdownMenu 미사용 (peerDep 추가 금지 — C-22).
 * - C-5: Tailwind CSS only (inline style 불가 — 동적 값 없어 불필요).
 * - C-22: 신규 peerDependencies 추가 금지.
 * - C-25: JSDoc 필수.
 * - AS-IS 참조: `data-table-view-options.tsx` filter 조건 동일 적용
 *   (`typeof column.accessorFn !== 'undefined' && column.getCanHide()`).
 *
 * @see G-003-spec.md Section 3 + D3
 * @see data-table-view-options.tsx (AS-IS L0 참조)
 */

import { type JSX } from 'react';
import { type Table } from '@tanstack/react-table';

/**
 * `<ColumnVisibilityMenu>` props.
 *
 * @deprecated No production users. Will be removed in next major together with
 * `ColumnVisibilityMenu`. (ADR-013)
 *
 * @typeParam TData - 행 데이터 타입.
 */
export interface ColumnVisibilityMenuProps<TData> {
  /**
   * `useReactTable()` 반환 Table 인스턴스.
   * `getAllLeafColumns()` + `column.getCanHide()` + `column.toggleVisibility()` 사용.
   */
  table: Table<TData>;
  /** 트리거 버튼 텍스트. @default '리스트 항목 설정' */
  triggerLabel?: string;
  /** 메뉴 상단 라벨. @default '표시할 항목 선택' */
  menuLabel?: string;
  /** 루트 <details> 추가 className. */
  className?: string;
}

/**
 * 컬럼 가시성 토글 드롭다운 메뉴.
 *
 * @deprecated No production users outside grid-core. Will be removed from public API
 * in next major. (ADR-013)
 *
 * - native HTML `<details>/<summary>` 로 열기/닫기 (D3 — Radix UI 미사용).
 * - 체크박스: `<input type="checkbox" />` — `column.getIsVisible()` / `column.toggleVisibility()`.
 * - 필터 기준: `typeof column.accessorFn !== 'undefined' && column.getCanHide()` (AS-IS 동일).
 * - Tailwind CSS 스타일링 (C-5).
 *
 * @typeParam TData - 행 데이터 타입.
 * @param props - `{ table }`.
 * @returns `<details>` 기반 컬럼 가시성 토글 UI.
 *
 * @example
 * ```tsx
 * // Grid.tsx 내부 — columnPersistence 제공 시만 렌더
 * {props.columnPersistence !== undefined && (
 *   <ColumnVisibilityMenu table={table} />
 * )}
 * ```
 *
 * @see G-003-spec.md Section 3 + D3
 * @see ColumnPersistenceOptions
 */
export function ColumnVisibilityMenu<TData>({
  table,
  triggerLabel = '리스트 항목 설정',
  menuLabel = '표시할 항목 선택',
  className,
}: ColumnVisibilityMenuProps<TData>): JSX.Element {
  const hidableColumns = table
    .getAllLeafColumns()
    .filter(
      (col) => typeof col.accessorFn !== 'undefined' && col.getCanHide(),
    );

  return (
    <details className={`relative inline-block text-left${className ? ` ${className}` : ''}`}>
      <summary
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium
                   text-gray-700 bg-white border border-gray-300 rounded-md
                   cursor-pointer select-none
                   hover:bg-gray-50 focus-visible:outline-none
                   focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label="컬럼 표시 설정"
      >
        <span>{triggerLabel}</span>
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </summary>

      <div
        className="absolute right-0 z-20 mt-1 w-48 origin-top-right
                   bg-white border border-gray-200 rounded-md shadow-lg
                   py-1"
        role="menu"
      >
        <p className="px-3 py-2 text-xs font-semibold text-gray-500">{menuLabel}</p>
        {hidableColumns.length === 0 ? (
          <p className="px-4 py-2 text-sm text-gray-400">숨길 컬럼 없음</p>
        ) : (
          hidableColumns.map((column) => {
            const label =
              typeof column.columnDef.header === 'string'
                ? column.columnDef.header
                : column.id;

            return (
              <label
                key={column.id}
                className="flex items-center gap-2 px-4 py-2 text-sm
                           text-gray-700 cursor-pointer hover:bg-gray-50"
                role="menuitem"
              >
                <input
                  type="checkbox"
                  checked={column.getIsVisible()}
                  onChange={(e) => column.toggleVisibility(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600
                             focus:ring-blue-500"
                  aria-label={`${label} 컬럼 표시`}
                />
                <span>{label}</span>
              </label>
            );
          })
        )}
      </div>
    </details>
  );
}
