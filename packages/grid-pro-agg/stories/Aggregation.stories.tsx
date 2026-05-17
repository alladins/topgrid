// spec G-002 Section 7 #14 / Step 8
// AC-004: AggregationGrid + GroupPanel story (AC-004)
// C-3 예외: mock rows 데이터는 Storybook stories에서만 허용 (D7 결정, ADR-006)
// C-1 준수: AggregationGridProps + GroupPanelProps 소스 확인
//   - AggregationGrid: { data, columns (AggregationColumnDef[]), enableAggregation?, grouping?, expanded? }
//   - GroupPanel: { grouping, columns (Column<T,unknown>[]), onGroupingChange, emptyText? }
import type { Meta, StoryObj } from '@storybook/react';
import {
  getCoreRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  AggregationGrid,
  GroupPanel,
} from '@tomis/grid-pro-agg';
import type { AggregationColumnDef } from '@tomis/grid-pro-agg';

// C-3 예외: mock rows — Storybook stories 허용 범위
interface SalesRow {
  id: number;
  dept: string;
  team: string;
  employee: string;
  revenue: number;
  cost: number;
}

const mockSalesData: SalesRow[] = [
  { id: 1, dept: '영업팀', team: '1팀', employee: '홍길동', revenue: 8000000, cost: 3000000 },
  { id: 2, dept: '영업팀', team: '1팀', employee: '김영희', revenue: 6500000, cost: 2500000 },
  { id: 3, dept: '영업팀', team: '2팀', employee: '이철수', revenue: 9200000, cost: 3500000 },
  { id: 4, dept: '영업팀', team: '2팀', employee: '박민지', revenue: 7800000, cost: 2800000 },
  { id: 5, dept: '개발팀', team: '1팀', employee: '최준호', revenue: 5000000, cost: 1500000 },
  { id: 6, dept: '개발팀', team: '1팀', employee: '정수빈', revenue: 4800000, cost: 1400000 },
  { id: 7, dept: '개발팀', team: '2팀', employee: '윤재원', revenue: 5200000, cost: 1600000 },
];

// AggregationColumnDef = ColumnDef + { meta?: { aggregationFn?: AggregationFnKey } }
const aggColumns: AggregationColumnDef<SalesRow>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'dept', header: '부서' },
  { accessorKey: 'team', header: '팀' },
  { accessorKey: 'employee', header: '직원' },
  {
    accessorKey: 'revenue',
    header: '매출',
    meta: { aggregationFn: 'sum' },  // 그룹별 합산
  },
  {
    accessorKey: 'cost',
    header: '비용',
    meta: { aggregationFn: 'sum' },
  },
];

// ─── AggregationGrid ─────────────────────────────────────────────────────
const meta: Meta<typeof AggregationGrid> = {
  title: 'grid-pro-agg/AggregationGrid',
  component: AggregationGrid,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof AggregationGrid>;

export const Default: Story = {
  name: '기본 Grid (집계 비활성)',
  args: {
    data: mockSalesData,
    columns: aggColumns,
  },
};

export const WithAggregation: Story = {
  name: '부서별 집계',
  args: {
    data: mockSalesData,
    columns: aggColumns,
    enableAggregation: true,
    grouping: ['dept'],
    expanded: true,
  },
};

export const WithMultiLevelAggregation: Story = {
  name: '부서 + 팀 2단계 집계',
  args: {
    data: mockSalesData,
    columns: aggColumns,
    enableAggregation: true,
    grouping: ['dept', 'team'],
    expanded: true,
  },
};

export const WithFooter: Story = {
  name: '집계 + 푸터',
  args: {
    data: mockSalesData,
    columns: aggColumns,
    enableAggregation: true,
    grouping: ['dept'],
    showFooter: true,
    expanded: true,
  },
};

// ─── GroupPanel ─────────────────────────────────────────────────────────
// GroupPanel requires TanStack Column instances — wrapper component for Storybook
function GroupPanelDemo() {
  const table = useReactTable({
    data: mockSalesData,
    columns: aggColumns,
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const visibleColumns = table.getAllLeafColumns();

  return (
    <div className="p-4">
      <p className="text-sm text-gray-600 mb-2">컬럼 칩을 드래그하여 그룹핑 설정</p>
      <GroupPanel<SalesRow>
        grouping={['dept']}
        columns={visibleColumns}
        onGroupingChange={(g) => console.log('그룹핑 변경:', g)}
        emptyText="여기에 컬럼을 끌어다 놓으세요"
      />
    </div>
  );
}

export const GroupPanelStory: StoryObj<typeof GroupPanelDemo> = {
  name: 'GroupPanel 드래그 그룹핑',
  render: () => <GroupPanelDemo />,
};
