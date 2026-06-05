// MOD-GRID-35 G-3: indeterminate (partial) select-all checkbox — chromium gate. Selecting SOME (not
// all) rows puts the header checkbox in the third state: indeterminate=true (distinct from checked
// AND unchecked). C-3 예외: mock 데이터.
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid } from '@topgrid/grid-core';

interface Row {
  name: string;
  city: string;
}
const data: Row[] = [
  { name: '김철수', city: 'Seoul' },
  { name: '이영희', city: 'Busan' },
  { name: '박민준', city: 'Daegu' },
];
const columns: ColumnDef<Row>[] = [
  { accessorKey: 'name', header: '이름', size: 160 },
  { accessorKey: 'city', header: '도시', size: 140 },
];

const meta: Meta = { title: 'grid-core/Grid (Select-All Indeterminate)' };
export default meta;

export const Default: StoryObj = {
  name: '부분 선택 → indeterminate 헤더',
  render: () => <Grid<Row> columns={columns} data={data} rowSelection="multi" />,
};
