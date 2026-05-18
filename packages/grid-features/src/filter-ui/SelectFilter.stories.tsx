/**
 * @topgrid/grid-features — SelectFilter Storybook Stories.
 *
 * MOD-GRID-09 G-004 AC-007 + Section 15.2:
 * - SelectFilter/Default: 5개 옵션 체크박스 필터 기본 기능 확인
 * - SelectFilter/ManyOptions: 50개+ 옵션 → 내부 검색 자동 노출 확인
 *
 * C-3: 더미 데이터는 Storybook/test 전용 (프로덕션 제외).
 * D3: consumer가 getFacetedRowModel/getFacetedUniqueValues 직접 등록.
 *
 * @remarks
 * Story args는 제공하지 않고 render 함수 내에서 table 인스턴스 직접 구성.
 * (TanStack Table hook은 컴포넌트 내부에서만 호출 가능 — Rules of Hooks)
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  createColumnHelper,
  type ColumnFiltersState,
  flexRender,
} from '@tanstack/react-table';
import { SelectFilter } from './SelectFilter';
import { FilterResetButton } from './FilterResetButton';

// ---------------------------------------------------------------------------
// Story 공통 데이터 타입
// ---------------------------------------------------------------------------

interface SampleRow {
  id: number;
  name: string;
  category: string;
}

// ---------------------------------------------------------------------------
// Default story: 5개 옵션
// ---------------------------------------------------------------------------

const defaultData: SampleRow[] = [
  { id: 1, name: 'Apple', category: 'Fruit' },
  { id: 2, name: 'Banana', category: 'Fruit' },
  { id: 3, name: 'Carrot', category: 'Vegetable' },
  { id: 4, name: 'Daikon', category: 'Vegetable' },
  { id: 5, name: 'Elderberry', category: 'Fruit' },
];

const columnHelper = createColumnHelper<SampleRow>();

function DefaultStoryComponent(): JSX.Element {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', { header: 'ID' }),
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('category', {
        header: ({ column }) => (
          <SelectFilter column={column} />
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: defaultData,
    columns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // G-004 필수 (D3): SelectFilter를 위한 faceted row model 등록
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <FilterResetButton table={table} />
      </div>
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
      <p className="text-xs text-gray-400">
        {table.getFilteredRowModel().rows.length} / {defaultData.length} rows
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ManyOptions story: 50개+ 옵션 → 내부 검색 자동 노출 (AC-003, C-10)
// ---------------------------------------------------------------------------

function generateManyRows(): SampleRow[] {
  const countries = Array.from({ length: 60 }, (_, i) => `Country${String(i + 1).padStart(2, '0')}`);
  return countries.map((country, i) => ({ id: i + 1, name: `Item ${i + 1}`, category: country }));
}

const manyData = generateManyRows();

function ManyOptionsStoryComponent(): JSX.Element {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', { header: 'ID' }),
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('category', {
        header: ({ column }) => (
          // searchThreshold 기본 50 → 60개 옵션이라 내부 검색 자동 노출 (AC-003)
          <SelectFilter column={column} searchThreshold={50} popoverAlign="right" />
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: manyData,
    columns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="p-4 space-y-3">
      <p className="text-xs text-gray-500">
        60개 옵션 → searchThreshold=50이므로 내부 검색 input 자동 노출됨
      </p>
      <div className="flex items-center gap-2 mb-2">
        <FilterResetButton table={table} />
      </div>
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
          {table.getRowModel().rows.slice(0, 10).map((row) => (
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
      <p className="text-xs text-gray-400">
        첫 10행 표시. 필터 후: {table.getFilteredRowModel().rows.length} / {manyData.length} rows
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Storybook Meta
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: 'filter-ui/SelectFilter',
};

export default meta;

export const Default: StoryObj = {
  render: () => <DefaultStoryComponent />,
  name: 'Default',
};

export const ManyOptions: StoryObj = {
  render: () => <ManyOptionsStoryComponent />,
  name: 'ManyOptions',
};
