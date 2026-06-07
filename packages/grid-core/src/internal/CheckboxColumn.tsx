/**
 * Internal — `__select__` 체크박스 컬럼 합성 헬퍼.
 *
 * BaseGrid.tsx L37-67 의 inline 패턴을 추출 (DRY — VirtualGrid 와 동일 70줄 중복 해소).
 * `<Grid rowSelection="multi" />` 또는 `<Grid rowSelection="single" />` 시 columns 배열 좌측에 자동 prepend.
 *
 * @see G-001-spec.md Section 11.2 Step 2
 */

import type { ColumnDef, Row, Table } from '@tanstack/react-table';

/**
 * Row selection 모드 ('none' 제외 — none 일 때는 호출되지 않음).
 */
type CheckboxColumnMode = 'single' | 'multi';

/**
 * 체크박스 컬럼 ColumnDef 생성.
 *
 * - `'multi'`: 헤더 = 전체 선택 체크박스, 셀 = 개별 체크박스.
 * - `'single'`: 헤더 = 빈 노드, 셀 = 개별 체크박스.
 *
 * @typeParam TData - 행 데이터 타입.
 * @param mode - 'single' 또는 'multi'.
 * @returns TanStack `ColumnDef` (id=`__select__`, sortable/filterable 비활성, size=40px).
 */
export function createCheckboxColumn<TData>(
  mode: CheckboxColumnMode,
  selectAllPages = false,
): ColumnDef<TData, unknown> {
  return {
    id: '__select__',
    header:
      mode === 'multi'
        ? ({ table }: { table: Table<TData> }) => {
            // MOD-GRID-35 G-3: indeterminate (partial) select-all state. `indeterminate` is a DOM
            // property (not a React attribute) → set via ref. It is a THIRD visual state, distinct
            // from checked (all) and unchecked (none): some-but-not-all → mixed. aria-checked
            // mirrors it ('mixed') so screen readers announce the partial state.
            // MOD-GRID-55: selectAllPages → header toggles ALL rows (every page), not just the
            // current page. Default stays page-scoped (getIsAllPageRowsSelected) = byte-identical.
            const all = selectAllPages
              ? table.getIsAllRowsSelected()
              : table.getIsAllPageRowsSelected();
            const some = selectAllPages
              ? table.getIsSomeRowsSelected()
              : table.getIsSomePageRowsSelected();
            return (
              <input
                type="checkbox"
                checked={all}
                ref={(el) => {
                  if (el) el.indeterminate = some;
                }}
                aria-checked={some ? 'mixed' : all ? 'true' : 'false'}
                onChange={
                  selectAllPages
                    ? table.getToggleAllRowsSelectedHandler()
                    : table.getToggleAllPageRowsSelectedHandler()
                }
                className="w-4 h-4 cursor-pointer"
                aria-label={selectAllPages ? 'select all rows across all pages' : 'select all rows'}
              />
            );
          }
        : () => null,
    cell: ({ row }: { row: Row<TData> }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        onClick={(e) => e.stopPropagation()}
        className="w-4 h-4 cursor-pointer"
        aria-label="select row"
      />
    ),
    size: 40,
    enableSorting: false,
    enableColumnFilter: false,
  };
}
