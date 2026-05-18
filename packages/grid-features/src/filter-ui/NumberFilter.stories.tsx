/**
 * @topgrid/grid-features — NumberFilter Storybook Stories
 *
 * MOD-GRID-09 G-002 AC-007 / C-25:
 * 7 operator + between 시나리오 + 인디케이터 + clear 시나리오.
 *
 * Section 15.2 시나리오:
 * - Default: '=' 연산자 기본 상태 + FilterIndicator dot 비활성
 * - BetweenOperator: 'between' 연산자 선택 상태 (min/max 두 input 렌더)
 * - ActiveFilter: value=100 입력 후 필터 활성 상태
 * - BetweenActiveFilter: min=10, max=50 입력 후 활성 상태
 * - ClearFilter: 활성 필터 → 초기화 버튼 클릭
 * - PopoverAlignRight: popoverAlign="right" prop
 *
 * @remarks
 * stories 파일은 tsconfig exclude 대상 — tsc --noEmit 게이트 외.
 * grid-features → grid-core 방향 cross-package import 순환 위험 회피 위해
 * useReactTable 직접 사용 (TextFilter.stories.tsx 동일 패턴).
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
import { NumberFilter, FilterIndicator, numberFilterFn } from '../index';
import type { NumberFilterOperator } from '../index';

// ---------------------------------------------------------------------------
// 스토리 데이터 타입
// ---------------------------------------------------------------------------

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  rating: number;
}

const PRODUCTS: Product[] = [
  { id: 1, name: '노트북 A', price: 1200000, stock: 15, rating: 4.5 },
  { id: 2, name: '마우스 B', price: 35000, stock: 200, rating: 4.2 },
  { id: 3, name: '키보드 C', price: 85000, stock: 80, rating: 4.8 },
  { id: 4, name: '모니터 D', price: 450000, stock: 30, rating: 4.6 },
  { id: 5, name: '스피커 E', price: 120000, stock: 50, rating: 3.9 },
  { id: 6, name: '웹캠 F', price: 65000, stock: 120, rating: 4.1 },
  { id: 7, name: '헤드셋 G', price: 180000, stock: 40, rating: 4.7 },
];

// ---------------------------------------------------------------------------
// Demo 컴포넌트 — NumberFilter + FilterIndicator 직접 사용
// ---------------------------------------------------------------------------

interface NumberFilterDemoProps {
  /** 기본 연산자 */
  defaultOperator?: NumberFilterOperator;
  /** 팝오버 정렬 */
  popoverAlign?: 'left' | 'right';
}

function NumberFilterDemo({ defaultOperator, popoverAlign }: NumberFilterDemoProps) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns: ColumnDef<Product>[] = [
    {
      id: 'name',
      accessorKey: 'name',
      header: () => <span className="font-medium text-gray-700">상품명</span>,
    },
    {
      id: 'price',
      accessorKey: 'price',
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <span className="font-medium text-gray-700">가격</span>
          <FilterIndicator isFiltered={column.getIsFiltered()} />
          <NumberFilter
            column={column}
            {...(defaultOperator !== undefined ? { defaultOperator } : {})}
            {...(popoverAlign !== undefined ? { popoverAlign } : {})}
          />
        </div>
      ),
      filterFn: numberFilterFn,
      cell: ({ getValue }) => {
        const value = getValue() as number;
        return <span>{value.toLocaleString()}원</span>;
      },
    },
    {
      id: 'stock',
      accessorKey: 'stock',
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <span className="font-medium text-gray-700">재고</span>
          <NumberFilter column={column} defaultOperator=">=" />
        </div>
      ),
      filterFn: numberFilterFn,
    },
    {
      id: 'rating',
      accessorKey: 'rating',
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <span className="font-medium text-gray-700">평점</span>
          <NumberFilter column={column} defaultOperator="between" />
        </div>
      ),
      filterFn: numberFilterFn,
    },
  ];

  const table = useReactTable<Product>({
    data: PRODUCTS,
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
        행 수: {table.getRowModel().rows.length} / {PRODUCTS.length}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof NumberFilterDemo> = {
  title: 'grid-features/filter-ui/NumberFilter',
  component: NumberFilterDemo,
  parameters: {
    docs: {
      description: {
        component:
          '`NumberFilter` + `FilterIndicator` — 컬럼 헤더 숫자 필터 UI. ' +
          '7가지 연산자(=, !=, >, <, >=, <=, between) + 300ms 디바운스 + clear 버튼. ' +
          'between 선택 시 min/max 두 input 조건부 렌더. ' +
          'MOD-GRID-09 G-002 AC-007 / C-25.',
      },
    },
  },
  argTypes: {
    defaultOperator: {
      control: { type: 'select' },
      options: ['=', '!=', '>', '<', '>=', '<=', 'between'],
      description: '가격 컬럼 기본 연산자.',
    },
    popoverAlign: {
      control: { type: 'select' },
      options: ['left', 'right'],
      description: '팝오버 정렬 방향.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof NumberFilterDemo>;

// ---------------------------------------------------------------------------
// 시나리오 (Section 15.2)
// ---------------------------------------------------------------------------

/**
 * Default — '=' 연산자 기본 상태.
 * FilterIndicator dot 비활성. 아이콘 클릭 → Popover 열림.
 */
export const Default: Story = {
  name: 'Default — "=" 기본 상태',
  args: { defaultOperator: '=' },
  parameters: {
    docs: {
      description: {
        story:
          '기본 상태. 가격 컬럼 필터 아이콘 클릭 → Popover 열림. ' +
          'FilterIndicator dot 비활성. 값 입력 → 300ms 디바운스 후 필터 적용.',
      },
    },
  },
};

/**
 * BetweenOperator — 'between' 연산자 선택 상태.
 * min/max 두 input 렌더, '~' 구분자 표시.
 */
export const BetweenOperator: Story = {
  name: 'BetweenOperator — between 조건부 렌더 (AC-003)',
  args: { defaultOperator: 'between' },
  parameters: {
    docs: {
      description: {
        story:
          'defaultOperator="between". 가격 컬럼 아이콘 클릭 → Popover에 min/max 두 input 렌더. ' +
          '"~" 구분자 표시. min=100000 입력 후 → 100,000원 이상 행만 표시.',
      },
    },
  },
};

/**
 * ActiveFilter — value=100 입력 후 필터 활성 상태.
 * FilterIndicator 파란 dot 활성.
 */
export const ActiveFilter: Story = {
  name: 'ActiveFilter — 필터 활성 + 파란 dot',
  args: { defaultOperator: '=' },
  parameters: {
    docs: {
      description: {
        story:
          '가격 컬럼 입력창에 숫자 값 입력 → 300ms 후 필터 적용. ' +
          'FilterIndicator 파란 dot 활성화 (`column.getIsFiltered()=true`). ' +
          '"초기화" 버튼 클릭 → `setFilterValue(undefined)` → dot 사라짐.',
      },
    },
  },
};

/**
 * BetweenActiveFilter — min=10, max=50 입력 후 활성 상태.
 * 두 input 모두 렌더, FilterIndicator 파란 dot 활성.
 */
export const BetweenActiveFilter: Story = {
  name: 'BetweenActiveFilter — between 범위 필터 활성',
  args: { defaultOperator: 'between' },
  parameters: {
    docs: {
      description: {
        story:
          'between 연산자 선택. min/max 입력 → { operator: "between", min, max } 적용. ' +
          'min만 입력: min 이상 단방향 필터. max만 입력: max 이하 단방향 필터 (EC-04).',
      },
    },
  },
};

/**
 * ClearFilter — 활성 필터 → 초기화 버튼 클릭 시나리오.
 * dot 사라짐 + setFilterValue(undefined) 확인.
 */
export const ClearFilter: Story = {
  name: 'ClearFilter — 초기화 버튼',
  args: { defaultOperator: '>=' },
  parameters: {
    docs: {
      description: {
        story:
          '1. 재고 컬럼에 "50" 입력 → 재고 50 이상 행만 표시. ' +
          '2. "초기화" 버튼 클릭 → `column.setFilterValue(undefined)`. ' +
          '3. FilterIndicator dot 사라짐. 전체 행 복원.',
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
  args: { defaultOperator: '=', popoverAlign: 'right' },
  parameters: {
    docs: {
      description: {
        story:
          'popoverAlign="right". 가격 컬럼 아이콘 클릭 시 Popover가 오른쪽으로 정렬. ' +
          '뷰포트 우측 경계에서 잘림 방지. (Section 4.1 D7)',
      },
    },
  },
};
