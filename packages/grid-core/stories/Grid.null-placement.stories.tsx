// MOD-GRID-37 G-2: direction-independent null placement via blankToUndefined + sortUndefined.
// ★non-vacuous: blanks park at the bottom for BOTH asc and desc (they do NOT flip with direction);
// only the non-null rows reverse around them. C-3 예외: mock 데이터.
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid, blankToUndefined } from '@topgrid/grid-core';

interface Row {
  name: string;
  score: number | null;
}
const data: Row[] = [
  { name: 'A', score: 30 },
  { name: 'B', score: null },
  { name: 'C', score: 10 },
  { name: 'D', score: 20 },
];
const columns: ColumnDef<Row>[] = [
  { id: 'name', accessorKey: 'name', header: '이름', size: 100, enableSorting: false },
  {
    id: 'score',
    header: '점수',
    size: 120,
    // blank → undefined so sortUndefined parks it; nulls stay at the bottom in both directions.
    accessorFn: blankToUndefined((r: Row) => r.score),
    sortUndefined: 'last',
  },
];

const meta: Meta = { title: 'grid-core/Grid (Null Placement)' };
export default meta;

export const Default: StoryObj = {
  name: 'null 하단 고정 (방향 무관)',
  render: () => <Grid<Row> columns={columns} data={data} enableSort />,
};
