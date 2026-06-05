// MOD-GRID-38 G-1: column header menu — sort actions. ★behavior-gated: clicking "오름차순 정렬"
// ACTUALLY sorts (rows reorder), and merely opening the menu does NOT sort (stopPropagation vs the
// th's own sort handler). C-3 예외: mock 데이터.
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid, ColumnMenu } from '@topgrid/grid-core';

interface Row {
  name: string;
  score: number;
}
const data: Row[] = [
  { name: 'C', score: 30 },
  { name: 'A', score: 10 },
  { name: 'B', score: 20 },
];
const columns: ColumnDef<Row>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
        이름 <ColumnMenu column={column} />
      </span>
    ),
    size: 220,
  },
  {
    accessorKey: 'score',
    header: ({ column }) => (
      <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
        점수 <ColumnMenu column={column} />
      </span>
    ),
    size: 140,
  },
];

const meta: Meta = { title: 'grid-core/Grid (Column Menu)' };
export default meta;

export const Default: StoryObj = {
  name: '컬럼 메뉴 (정렬 액션)',
  render: () => <Grid<Row> columns={columns} data={data} enableSort enableColumnPinning />,
};
