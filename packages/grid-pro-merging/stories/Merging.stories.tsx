// spec G-002 Section 7 #12 / Step 8
// AC-004: MergingGrid story (AC-004)
// C-3 예외: mock rows 데이터는 Storybook stories에서만 허용 (D7 결정, ADR-006)
// C-1 준수: MergingGridProps — data, columns (MergingColumnDef[]), enableMerging?, className?
//   - MergingColumnDef = ColumnDef & { meta?: { mergeRows?: boolean | fn } }
import type { Meta, StoryObj } from '@storybook/react';
import { MergingGrid } from '@topgrid/grid-pro-merging';
import type { MergingColumnDef } from '@topgrid/grid-pro-merging';

// C-3 예외: mock rows — Storybook stories 허용 범위
interface SalesRow {
  dept: string;
  team: string;
  employee: string;
  amount: number;
}

const mockSalesData: SalesRow[] = [
  { dept: '영업팀', team: '1팀', employee: '홍길동', amount: 3200000 },
  { dept: '영업팀', team: '1팀', employee: '김영희', amount: 2800000 },
  { dept: '영업팀', team: '2팀', employee: '이철수', amount: 4100000 },
  { dept: '영업팀', team: '2팀', employee: '박민지', amount: 3700000 },
  { dept: '개발팀', team: '1팀', employee: '최준호', amount: 5200000 },
  { dept: '개발팀', team: '1팀', employee: '정수빈', amount: 4900000 },
  { dept: '개발팀', team: '2팀', employee: '윤재원', amount: 4500000 },
];

// MergingColumnDef: ColumnDef + { meta?: { mergeRows?: boolean | ((prev, curr) => boolean) } }
const mergingColumns: MergingColumnDef<SalesRow>[] = [
  {
    accessorKey: 'dept',
    header: '부서',
    meta: { mergeRows: true },  // 동일 부서명 자동 병합
  },
  {
    accessorKey: 'team',
    header: '팀',
    meta: {
      // 커스텀 비교: 같은 부서 + 팀 이름 동일 시 병합
      mergeRows: (prev: SalesRow, curr: SalesRow) =>
        prev.dept === curr.dept && prev.team === curr.team,
    },
  },
  {
    accessorKey: 'employee',
    header: '직원',
  },
  {
    accessorKey: 'amount',
    header: '실적',
  },
];

const plainColumns: MergingColumnDef<SalesRow>[] = [
  { accessorKey: 'dept', header: '부서' },
  { accessorKey: 'team', header: '팀' },
  { accessorKey: 'employee', header: '직원' },
  { accessorKey: 'amount', header: '실적' },
];

const meta: Meta<typeof MergingGrid> = {
  title: 'grid-pro-merging/MergingGrid',
  component: MergingGrid,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof MergingGrid>;

export const WithMerging: Story = {
  name: '셀 병합 활성',
  args: {
    data: mockSalesData,
    columns: mergingColumns,
    enableMerging: true,
  },
};

export const WithoutMerging: Story = {
  name: '병합 비활성 (일반 Grid)',
  args: {
    data: mockSalesData,
    columns: plainColumns,
    enableMerging: false,
  },
};

export const WithVirtualization: Story = {
  name: '셀 병합 + 가상화',
  args: {
    data: Array.from({ length: 100 }, (_, i) => ({
      dept: i < 50 ? '영업팀' : '개발팀',
      team: i % 10 < 5 ? '1팀' : '2팀',
      employee: `직원${i + 1}`,
      amount: (i + 1) * 100000,
    })),
    columns: mergingColumns,
    enableMerging: true,
    enableVirtualization: true,
    estimatedRowHeight: 40,
  },
};
