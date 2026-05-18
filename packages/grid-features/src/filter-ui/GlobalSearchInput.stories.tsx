/**
 * @topgrid/grid-features — GlobalSearchInput + FilterResetButton Storybook Stories.
 *
 * MOD-GRID-09 G-004 AC-007 + Section 15.2 + Section 7 #8:
 * - GlobalSearch/Default: GlobalSearchInput + FilterResetButton 통합 story
 *   (debounce 시각 확인 — C-30: Section 7 #8 권위 채택, D7 "SelectFilter story에 통합" 모순 → Section 7 적용)
 *
 * C-3: 더미 데이터는 Storybook/test 전용 (프로덕션 제외).
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { GlobalSearchInput } from './GlobalSearchInput';
import { FilterResetButton } from './FilterResetButton';

// ---------------------------------------------------------------------------
// Story 데이터
// ---------------------------------------------------------------------------

interface PersonRow {
  id: number;
  name: string;
  role: string;
  department: string;
}

const personData: PersonRow[] = [
  { id: 1, name: 'Alice Kim', role: 'Engineer', department: 'Frontend' },
  { id: 2, name: 'Bob Lee', role: 'Designer', department: 'UX' },
  { id: 3, name: 'Charlie Park', role: 'Engineer', department: 'Backend' },
  { id: 4, name: 'Diana Choi', role: 'Manager', department: 'Product' },
  { id: 5, name: 'Eve Jung', role: 'Engineer', department: 'Frontend' },
  { id: 6, name: 'Frank Oh', role: 'Designer', department: 'UX' },
  { id: 7, name: 'Grace Yoon', role: 'Engineer', department: 'Backend' },
  { id: 8, name: 'Henry Shin', role: 'Manager', department: 'Engineering' },
];

const personColumnHelper = createColumnHelper<PersonRow>();

// ---------------------------------------------------------------------------
// GlobalSearch/Default story: GlobalSearchInput + FilterResetButton 통합
// ---------------------------------------------------------------------------

function GlobalSearchDefaultComponent(): JSX.Element {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>('');

  const columns = useMemo(
    () => [
      personColumnHelper.accessor('id', { header: 'ID' }),
      personColumnHelper.accessor('name', { header: 'Name' }),
      personColumnHelper.accessor('role', { header: 'Role' }),
      personColumnHelper.accessor('department', { header: 'Department' }),
    ],
    [],
  );

  const table = useReactTable({
    data: personData,
    columns,
    state: { columnFilters, globalFilter },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <GlobalSearchInput
          table={table}
          placeholder="Search all columns…"
          debounceMs={300}
        />
        <FilterResetButton table={table}>Reset All Filters</FilterResetButton>
      </div>
      <p className="text-xs text-gray-400">
        입력 후 300ms debounce → globalFilter 적용. 빈 문자열 / 공백 → 필터 해제.
      </p>
      <table className="w-full border-collapse text-sm">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-gray-200">
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  className="text-left px-2 py-1 text-gray-600 font-medium"
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-gray-100">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-2 py-1 text-gray-700">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-xs text-gray-400 space-y-0.5">
        <p>
          현재 globalFilter: <code className="bg-gray-100 px-1">{globalFilter || '(없음)'}</code>
        </p>
        <p>
          결과: {table.getFilteredRowModel().rows.length} / {personData.length} rows
        </p>
        <p>
          FilterResetButton 상태:{' '}
          {table.getState().columnFilters.length === 0 && !table.getState().globalFilter
            ? 'disabled (활성 필터 없음)'
            : 'enabled (클릭 시 초기화)'}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Storybook Meta
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: 'filter-ui/GlobalSearchInput',
};

export default meta;

export const Default: StoryObj = {
  render: () => <GlobalSearchDefaultComponent />,
  name: 'Default',
};
