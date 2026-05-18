/**
 * @topgrid/grid-features — SortClearButton Storybook Stories
 *
 * MOD-GRID-08 G-002 AC-006 / C-25:
 * 시나리오 D: maxMultiSortColCount=2 + SortClearButton.
 *
 * @remarks
 * 패턴: MultiSortGrid.stories.tsx 와 동일 — useReactTable 직접 사용 (Grid wrapper 미사용).
 * grid-features → grid-core 방향 cross-package import 순환 위험 회피.
 *
 * @see G-002-spec.md (MOD-GRID-08) Section 12
 */

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { SortBadge, SortClearButton, useMultiSort } from '../index';

// ---------------------------------------------------------------------------
// 스토리 데이터 타입
// ---------------------------------------------------------------------------

interface Employee {
  id: number;
  name: string;
  department: string;
  joinYear: number;
  salary: number;
}

const EMPLOYEES: Employee[] = [
  { id: 1, name: '김민준', department: '개발팀', joinYear: 2019, salary: 5200 },
  { id: 2, name: '이서연', department: '기획팀', joinYear: 2021, salary: 4800 },
  { id: 3, name: '박지호', department: '개발팀', joinYear: 2020, salary: 5500 },
  { id: 4, name: '최예진', department: '인사팀', joinYear: 2018, salary: 4600 },
  { id: 5, name: '정민서', department: '기획팀', joinYear: 2022, salary: 4300 },
  { id: 6, name: '한도윤', department: '개발팀', joinYear: 2019, salary: 5100 },
];

const COLUMNS: ColumnDef<Employee>[] = [
  { id: 'id', accessorKey: 'id', header: 'ID', size: 60 },
  { id: 'name', accessorKey: 'name', header: '이름', size: 110 },
  { id: 'department', accessorKey: 'department', header: '부서', size: 110 },
  { id: 'joinYear', accessorKey: 'joinYear', header: '입사연도', size: 100 },
  { id: 'salary', accessorKey: 'salary', header: '급여(만)', size: 100 },
];

// ---------------------------------------------------------------------------
// Demo 컴포넌트 — useMultiSort + SortBadge + SortClearButton 직접 사용
// ---------------------------------------------------------------------------

interface SortClearDemoProps {
  /** 동시에 정렬 가능한 최대 컬럼 수 (AC-001). undefined = 무제한. */
  maxMultiSortColCount?: number;
}

function SortClearDemo({ maxMultiSortColCount }: SortClearDemoProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const opts = useMultiSort({ enableMultiSort: true, maxMultiSortColCount });

  const table = useReactTable<Employee>({
    data: EMPLOYEES,
    columns: COLUMNS,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableMultiSort: opts.enableMultiSort,
    isMultiSortEvent: opts.isMultiSortEvent,
    ...(opts.maxMultiSortColCount !== undefined
      ? { maxMultiSortColCount: opts.maxMultiSortColCount }
      : {}),
  });

  return (
    <div className="space-y-4 p-4">
      <div className="text-sm text-gray-600 bg-gray-50 rounded border p-2 flex items-center justify-between">
        <div>
          <span className="font-semibold">maxMultiSortColCount: </span>
          <span className="text-blue-600 font-bold">
            {maxMultiSortColCount ?? '무제한'}
          </span>
          <span className="ml-3 text-gray-500">
            ← Shift+클릭으로 컬럼 추가. 최대 {maxMultiSortColCount ?? '∞'}개 초과 시 오래된 정렬 자동 제거 (FIFO).
          </span>
        </div>
        {/* AC-003 / AC-004: 정렬 초기화 버튼 */}
        <SortClearButton onClear={() => { table.setSorting([]); }} />
      </div>

      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="min-w-full text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const sortIndex = header.column.getSortIndex();
                  const sortGlyph =
                    sorted === 'asc' ? '▲' : sorted === 'desc' ? '▼' : '⇅';

                  const handleClick = canSort
                    ? (e: React.MouseEvent) => {
                        if (e.shiftKey) {
                          header.column.toggleSorting(undefined, true);
                        } else {
                          header.column.getToggleSortingHandler()?.(e);
                        }
                      }
                    : undefined;

                  return (
                    <th
                      key={header.id}
                      className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase select-none whitespace-nowrap ${
                        canSort ? 'cursor-pointer hover:bg-gray-100' : ''
                      }`}
                      style={{ width: header.getSize() }}
                      onClick={handleClick}
                    >
                      <div className="flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="text-gray-400 text-[10px]">{sortGlyph}</span>
                        )}
                        {canSort && <SortBadge sortIndex={sortIndex} />}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-3 py-2 whitespace-nowrap text-gray-700"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 현재 정렬 상태 패널 */}
      <div className="text-xs text-gray-600 border rounded p-2 bg-gray-50">
        <p className="font-semibold mb-1">현재 SortingState:</p>
        {sorting.length === 0 ? (
          <span className="text-gray-400 italic">정렬 없음</span>
        ) : (
          <ol className="list-decimal pl-5 space-y-0.5 font-mono">
            {sorting.map((s, i) => (
              <li key={s.id}>
                <span className="font-bold text-blue-600">#{i + 1}</span> {s.id} (
                {s.desc ? 'desc ▼' : 'asc ▲'})
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof SortClearDemo> = {
  title: 'grid-features/multi-sort/SortClearButton',
  component: SortClearDemo,
  parameters: {
    docs: {
      description: {
        component:
          '`SortClearButton` + `maxMultiSortColCount` — 정렬 초기화 버튼 + 최대 정렬 컬럼 수 제한. ' +
          'MOD-GRID-08 G-002 AC-001/AC-003/AC-004/AC-006. 시나리오 D.',
      },
    },
  },
  argTypes: {
    maxMultiSortColCount: {
      control: { type: 'number', min: 1, step: 1 },
      description: '동시에 정렬 가능한 최대 컬럼 수. 미설정 = 무제한.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SortClearDemo>;

// ---------------------------------------------------------------------------
// 시나리오 D: maxMultiSortColCount=2 + SortClearButton (AC-006)
// ---------------------------------------------------------------------------

/**
 * 시나리오 D — maxMultiSortColCount=2 + 정렬 초기화 버튼.
 *
 * `maxMultiSortColCount=2`: 3번째 컬럼 Shift+Click 시 가장 오래된 컬럼 정렬이
 * 자동 제거 (TanStack FIFO — UMD L2690).
 * 우측 상단 `정렬 초기화` 버튼 클릭으로 전체 정렬 해제. AC-006.
 */
export const ScenarioD_MaxCountAndClearButton: Story = {
  name: '시나리오 D — maxMultiSortColCount=2 + 정렬 초기화 버튼',
  args: { maxMultiSortColCount: 2 },
  parameters: {
    docs: {
      description: {
        story:
          '`maxMultiSortColCount=2`. 3개 컬럼 Shift+Click 시 첫 번째 컬럼 정렬이 자동 제거 (FIFO). ' +
          '우측 상단 "정렬 초기화" 버튼 클릭 → 전체 정렬 해제 (`setSorting([])`). ' +
          'AC-001 + AC-003 + AC-004 + AC-006.',
      },
    },
  },
};
