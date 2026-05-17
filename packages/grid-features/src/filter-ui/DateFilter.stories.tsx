/**
 * @tomis/grid-features — DateFilter Storybook stories.
 *
 * MOD-GRID-09 G-003 D5 / Section 13.
 * C-31 wiring: 모든 story에서 `columnDef.filterFn: dateRangeFilterFn` 명시.
 * C-3: 더미 데이터는 Storybook story 전용 (프로덕션 코드 아님 — 예외 허용).
 * D4: react-datepicker CSS는 preview.ts/에서 import (story 파일 아님).
 */

import type { Meta, StoryObj } from '@storybook/react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';
import { DateFilter } from './DateFilter';
import { dateRangeFilterFn } from './filterFns';
import type { DateFilterValue } from './types';

// ---------------------------------------------------------------------------
// Story 데이터 (C-3 Storybook 전용 허용)
// ---------------------------------------------------------------------------

interface Order {
  id: number;
  orderDate: string; // ISO 8601 string (API 응답 형식)
  amount: number;
  product: string;
}

const sampleOrders: Order[] = [
  { id: 1, orderDate: '2026-04-15', amount: 12000, product: '노트북' },
  { id: 2, orderDate: '2026-05-01', amount: 35000, product: '마우스' },
  { id: 3, orderDate: '2026-05-10', amount: 8500, product: '키보드' },
  { id: 4, orderDate: '2026-05-14', amount: 22000, product: '모니터' },
  { id: 5, orderDate: '2026-05-31', amount: 5500, product: '케이블' },
  { id: 6, orderDate: '2026-06-05', amount: 18000, product: '헤드셋' },
];

const columnHelper = createColumnHelper<Order>();

// ---------------------------------------------------------------------------
// 공통 테이블 컴포넌트
// ---------------------------------------------------------------------------

interface DateFilterDemoProps {
  initialFilter?: DateFilterValue;
  popoverAlign?: 'left' | 'right';
}

function DateFilterDemo({ initialFilter, popoverAlign }: DateFilterDemoProps): JSX.Element {
  const columns = [
    columnHelper.accessor('orderDate', {
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <span>주문일</span>
          {/* C-31 wiring: dateRangeFilterFn → DateFilter column에서 사용 */}
          <DateFilter
            column={column}
            {...(popoverAlign !== undefined ? { popoverAlign } : {})}
          />
        </div>
      ),
      filterFn: dateRangeFilterFn, // C-31: dateRangeFilterFn wiring
    }),
    columnHelper.accessor('product', { header: '상품' }),
    columnHelper.accessor('amount', {
      header: '금액',
      cell: (info) => `₩${info.getValue().toLocaleString()}`,
    }),
  ];

  const table = useReactTable({
    data: sampleOrders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      columnFilters: initialFilter
        ? [{ id: 'orderDate', value: initialFilter }]
        : [],
    },
  });

  return (
    <div className="p-4 font-sans">
      <table className="w-full border-collapse text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-gray-100">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="even:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border border-gray-200 px-3 py-2 text-gray-800">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {table.getRowModel().rows.length === 0 && (
            <tr>
              <td
                colSpan={3}
                className="border border-gray-200 px-3 py-4 text-center text-gray-400"
              >
                필터 결과 없음
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-gray-400">
        표시 행: {table.getRowModel().rows.length} / {sampleOrders.length}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof DateFilterDemo> = {
  title: 'filter-ui/DateFilter',
  component: DateFilterDemo,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'react-datepicker 기반 날짜 범위 필터. from/to 단일 bound 지원. FilterPopover + FilterIndicator 재사용.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DateFilterDemo>;

// ---------------------------------------------------------------------------
// Story 1: BasicRange (from + to — 2026-05-01 ~ 2026-05-31)
// ---------------------------------------------------------------------------

/**
 * story 1: BasicRange — 양쪽 bound 모두 설정 (T9 케이스 시각화).
 * 5월 주문만 표시 (4월, 6월 제외).
 */
export const BasicRange: Story = {
  name: 'BasicRange (from + to)',
  args: {
    initialFilter: {
      from: new Date('2026-05-01'),
      to: new Date('2026-05-31'),
    } satisfies DateFilterValue,
  },
  parameters: {
    docs: {
      description: {
        story: '2026-05-01 ~ 2026-05-31 범위 필터. 5월 주문 3건만 표시.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Story 2: FromOnly (from만, to=undefined)
// ---------------------------------------------------------------------------

/**
 * story 2: FromOnly — from-only 단일 bound (T5 케이스 시각화).
 * 2026-05-14 이후 주문만 표시.
 */
export const FromOnly: Story = {
  name: 'FromOnly (from만)',
  args: {
    initialFilter: {
      from: new Date('2026-05-14'),
    } satisfies DateFilterValue,
  },
  parameters: {
    docs: {
      description: {
        story: 'from-only: 2026-05-14 이후 주문만 표시.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Story 3: ToOnly (to만, from=undefined)
// ---------------------------------------------------------------------------

/**
 * story 3: ToOnly — to-only 단일 bound (T7 케이스 시각화).
 * 2026-05-14 이전 주문만 표시.
 */
export const ToOnly: Story = {
  name: 'ToOnly (to만)',
  args: {
    initialFilter: {
      to: new Date('2026-05-14'),
    } satisfies DateFilterValue,
  },
  parameters: {
    docs: {
      description: {
        story: 'to-only: 2026-05-14 이전 주문만 표시.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Story 4: SameDay (from === to — 하루만)
// ---------------------------------------------------------------------------

/**
 * story 4: SameDay — 같은 날짜 양끝 (T12 케이스 시각화).
 * startOfDay ~ endOfDay 정규화로 당일 전체 포함.
 */
export const SameDay: Story = {
  name: 'SameDay (당일 하루만)',
  args: {
    initialFilter: {
      from: new Date('2026-05-14'),
      to: new Date('2026-05-14'),
    } satisfies DateFilterValue,
  },
  parameters: {
    docs: {
      description: {
        story: '2026-05-14 하루만. startOfDay~endOfDay 정규화로 당일 전체 포함 (T12).',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Story 5: PopoverAlign right
// ---------------------------------------------------------------------------

/**
 * story 5: PopoverAlign="right" — C-29 spread-skip 패턴 시각화.
 * 팝오버가 오른쪽 정렬로 열림.
 */
export const PopoverAlignRight: Story = {
  name: 'PopoverAlign right',
  args: {
    popoverAlign: 'right',
  },
  parameters: {
    docs: {
      description: {
        story: 'popoverAlign="right" 적용. C-29: spread-skip 패턴으로 FilterPopover align에 전달.',
      },
    },
  },
};
