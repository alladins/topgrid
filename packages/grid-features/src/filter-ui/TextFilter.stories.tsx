/**
 * @tomis/grid-features — TextFilter Storybook Stories
 *
 * MOD-GRID-09 G-001 AC-007 / C-25:
 * contains + 인디케이터 + clear 시나리오.
 *
 * Section 15.2 시나리오:
 * - Default: contains 연산자 기본 상태 + FilterIndicator dot 비활성
 * - ActiveFilter: 필터 활성 상태 (FilterIndicator 파란 dot)
 * - ClearFilter: 활성 필터 → 초기화 버튼 클릭
 * - EqualsOperator: equals 연산자 선택
 * - PopoverAlignRight: popoverAlign="right" prop
 *
 * @remarks
 * stories 파일은 tsconfig exclude 대상 — tsc --noEmit 게이트 외.
 * grid-features → grid-core 방향 cross-package import 순환 위험 회피 위해
 * useReactTable 직접 사용 (SortClearButton.stories.tsx 동일 패턴).
 */

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef, ColumnFiltersState } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { TextFilter, FilterIndicator, textFilterFn } from '../index';

// ---------------------------------------------------------------------------
// 스토리 데이터 타입
// ---------------------------------------------------------------------------

interface Person {
  id: number;
  name: string;
  department: string;
  status: string;
}

const PEOPLE: Person[] = [
  { id: 1, name: '김민준', department: '개발팀', status: 'approved' },
  { id: 2, name: '이서연', department: '기획팀', status: 'pending' },
  { id: 3, name: '박지호', department: '개발팀', status: 'rejected' },
  { id: 4, name: '최예진', department: '인사팀', status: 'approved' },
  { id: 5, name: '정민서', department: '기획팀', status: 'pending' },
  { id: 6, name: '한도윤', department: '개발팀', status: 'approved' },
];

// ---------------------------------------------------------------------------
// Demo 컴포넌트 — TextFilter + FilterIndicator 직접 사용
// ---------------------------------------------------------------------------

interface TextFilterDemoProps {
  /** 기본 연산자 */
  defaultOperator?: 'contains' | 'equals' | 'startsWith' | 'endsWith';
  /** 팝오버 정렬 */
  popoverAlign?: 'left' | 'right';
}

function TextFilterDemo({ defaultOperator, popoverAlign }: TextFilterDemoProps) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns: ColumnDef<Person>[] = [
    {
      id: 'name',
      accessorKey: 'name',
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <span>이름</span>
          <FilterIndicator isFiltered={column.getIsFiltered()} />
          <TextFilter
            column={column}
            {...(defaultOperator !== undefined ? { defaultOperator } : {})}
            {...(popoverAlign !== undefined ? { popoverAlign } : {})}
          />
        </div>
      ),
      filterFn: textFilterFn,
    },
    {
      id: 'department',
      accessorKey: 'department',
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <span>부서</span>
          <TextFilter column={column} defaultOperator="contains" />
        </div>
      ),
      filterFn: textFilterFn,
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <span>상태</span>
          <TextFilter column={column} defaultOperator="equals" />
        </div>
      ),
      filterFn: textFilterFn,
    },
  ];

  const table = useReactTable<Person>({
    data: PEOPLE,
    columns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="p-4 space-y-4">
      <div className="text-xs text-gray-500 bg-gray-50 rounded border p-2">
        <span className="font-semibold">활성 필터: </span>
        {columnFilters.length === 0 ? (
          <span className="text-gray-400 italic">없음</span>
        ) : (
          <span className="font-mono text-blue-600">{JSON.stringify(columnFilters)}</span>
        )}
      </div>

      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="min-w-full text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2 whitespace-nowrap text-gray-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        행 수: {table.getRowModel().rows.length} / {PEOPLE.length}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof TextFilterDemo> = {
  title: 'grid-features/filter-ui/TextFilter',
  component: TextFilterDemo,
  parameters: {
    docs: {
      description: {
        component:
          '`TextFilter` + `FilterIndicator` — 컬럼 헤더 텍스트 필터 UI. ' +
          'contains/equals/startsWith/endsWith 연산자 + 300ms 디바운스 + clear 버튼. ' +
          'MOD-GRID-09 G-001 AC-007 / C-25.',
      },
    },
  },
  argTypes: {
    defaultOperator: {
      control: { type: 'select' },
      options: ['contains', 'equals', 'startsWith', 'endsWith'],
      description: '이름 컬럼 기본 연산자.',
    },
    popoverAlign: {
      control: { type: 'select' },
      options: ['left', 'right'],
      description: '팝오버 정렬 방향.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TextFilterDemo>;

// ---------------------------------------------------------------------------
// 시나리오 (Section 15.2)
// ---------------------------------------------------------------------------

/**
 * Default — contains 연산자 기본 상태.
 * FilterIndicator dot 비활성. 아이콘 클릭 → Popover 열림.
 */
export const Default: Story = {
  name: 'Default — contains 기본 상태',
  args: { defaultOperator: 'contains' },
  parameters: {
    docs: {
      description: {
        story:
          '기본 상태. 이름 컬럼 필터 아이콘 클릭 → Popover 열림. ' +
          'FilterIndicator dot 비활성. 값 입력 → 300ms 디바운스 후 필터 적용.',
      },
    },
  },
};

/**
 * ActiveFilter — 필터 활성 상태 시뮬레이션.
 * 값 입력 후 FilterIndicator 파란 dot 활성.
 */
export const ActiveFilter: Story = {
  name: 'ActiveFilter — 필터 활성 + 파란 dot',
  args: { defaultOperator: 'contains' },
  parameters: {
    docs: {
      description: {
        story:
          '이름 컬럼 입력창에 값 입력 → 300ms 후 필터 적용. ' +
          'FilterIndicator 파란 dot 활성화 (`column.getIsFiltered()=true`). ' +
          '"초기화" 버튼 클릭 → `setFilterValue(undefined)` → dot 사라짐.',
      },
    },
  },
};

/**
 * ClearFilter — 활성 필터 → 초기화 버튼 클릭 시나리오.
 * dot 사라짐 + setFilterValue(undefined) 확인.
 */
export const ClearFilter: Story = {
  name: 'ClearFilter — 초기화 버튼 (AC-005)',
  args: { defaultOperator: 'contains' },
  parameters: {
    docs: {
      description: {
        story:
          '1. 이름 입력창에 "김" 입력 → 필터 적용. ' +
          '2. "초기화" 버튼 클릭 → `column.setFilterValue(undefined)`. ' +
          '3. FilterIndicator dot 사라짐. 전체 행 복원.',
      },
    },
  },
};

/**
 * EqualsOperator — equals 연산자 선택.
 * 정확히 일치하는 값만 필터.
 */
export const EqualsOperator: Story = {
  name: 'EqualsOperator — equals 연산자',
  args: { defaultOperator: 'equals' },
  parameters: {
    docs: {
      description: {
        story:
          'defaultOperator="equals". "approved" 입력 → 상태가 정확히 "approved"인 행만 표시. ' +
          'case-insensitive: "APPROVED" 입력도 동일 결과.',
      },
    },
  },
};

/**
 * PopoverAlignRight — popoverAlign="right" prop.
 * Popover가 오른쪽 정렬로 열림.
 */
export const PopoverAlignRight: Story = {
  name: 'PopoverAlignRight — 오른쪽 정렬',
  args: { defaultOperator: 'contains', popoverAlign: 'right' },
  parameters: {
    docs: {
      description: {
        story:
          'popoverAlign="right". 이름 컬럼 아이콘 클릭 시 Popover가 오른쪽으로 정렬. ' +
          '뷰포트 우측 경계에서 잘림 방지. (Section 4.1 D4-4)',
      },
    },
  },
};
