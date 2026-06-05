// MOD-GRID-37 G-3: suppress multi-sort key — plain clicks accumulate (no Shift). ★non-vacuous:
// clicking a 2nd header WITHOUT shift keeps the 1st column sorted (multi), instead of replacing it.
// C-3 예외: mock 데이터.
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid } from '@topgrid/grid-core';

interface Row {
  dept: string;
  score: number;
}
const data: Row[] = [
  { dept: '영업', score: 30 },
  { dept: '개발', score: 20 },
  { dept: '영업', score: 10 },
  { dept: '개발', score: 40 },
];
const columns: ColumnDef<Row>[] = [
  { accessorKey: 'dept', header: '부서', size: 120 },
  { accessorKey: 'score', header: '점수', size: 120 },
];

const meta: Meta = { title: 'grid-core/Grid (Always Multi-Sort)' };
export default meta;

export const Default: StoryObj = {
  name: 'Shift 없이 다중 정렬 누적',
  render: () => <Grid<Row> columns={columns} data={data} enableSort enableMultiSort alwaysMultiSort />,
};
