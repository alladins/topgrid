// MOD-GRID-28 G-1: WAI-ARIA — axe-gate targets for the grouped-header, plain (non-virtual),
// and empty-grid paths (the cases the column/row-virtualization story doesn't cover).
// C-3 예외: mock 데이터는 Storybook stories 에서만 허용.
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid } from '@topgrid/grid-core';

interface Score {
  name: string;
  math: number;
  sci: number;
}

const data: Score[] = [
  { name: '김철수', math: 90, sci: 85 },
  { name: '이영희', math: 78, sci: 92 },
  { name: '박민준', math: 88, sci: 80 },
];

// nested ColumnDef.columns → getHeaderGroups().length === 2 (group row + leaf row).
const groupedColumns: ColumnDef<Score>[] = [
  { id: 'name', accessorKey: 'name', header: '이름', size: 140 },
  {
    id: 'scores',
    header: '점수',
    columns: [
      { accessorKey: 'math', header: '수학', size: 100 },
      { accessorKey: 'sci', header: '과학', size: 100 },
    ],
  },
];

const flatColumns: ColumnDef<Score>[] = [
  { accessorKey: 'name', header: '이름', size: 140 },
  { accessorKey: 'math', header: '수학', size: 100 },
  { accessorKey: 'sci', header: '과학', size: 100 },
];

const meta: Meta<typeof Grid> = { title: 'grid-core/Grid (A11y)', component: Grid };
export default meta;
type Story = StoryObj<typeof Grid>;

// grouped/multi-row header — group header cells must OMIT aria-colindex (non-leaf).
export const GroupedHeader: Story = {
  name: '그룹 헤더 (다단)',
  args: { columns: groupedColumns, data, enableSort: true, rowSelection: 'multi' },
};

// plain non-virtual path.
export const Plain: Story = {
  name: '기본 (비-가상화)',
  args: { columns: flatColumns, data, enableSort: true, rowSelection: 'multi' },
};

// empty grid — role=grid with no data rows must still satisfy the grid contract.
export const Empty: Story = {
  name: '빈 그리드',
  args: { columns: flatColumns, data: [] },
};
