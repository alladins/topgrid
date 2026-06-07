// MOD-GRID-65 G-1: header column drag reorder — chromium guard for the reorderColumnOrder refactor
// (no prior chromium coverage existed). enableColumnReorder makes header <th> draggable via
// useColumnDrag; dragging one header onto another reorders columns (insert-before). C-3 예외: mock.
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid } from '@topgrid/grid-core';

interface Row {
  first: string;
  second: string;
  third: string;
}
const data: Row[] = [
  { first: 'a1', second: 'b1', third: 'c1' },
  { first: 'a2', second: 'b2', third: 'c2' },
];
const columns: ColumnDef<Row>[] = [
  { id: 'first', accessorKey: 'first', header: 'First', size: 140 },
  { id: 'second', accessorKey: 'second', header: 'Second', size: 140 },
  { id: 'third', accessorKey: 'third', header: 'Third', size: 140 },
];

const meta: Meta = { title: 'grid-core/Grid (Column Reorder)' };
export default meta;

export const Default: StoryObj = {
  name: '헤더 드래그 컬럼 재정렬',
  render: () => <Grid<Row> columns={columns} data={data} enableColumnReorder />,
};
