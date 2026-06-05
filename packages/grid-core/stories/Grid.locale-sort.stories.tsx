// MOD-GRID-37 G-1: locale/collation-aware sort. ★non-vacuous: with localeSortingFn, 'é' sorts
// BETWEEN 'e' and 'f' (locale), not AFTER 'z' (code-point — the default text sort). C-3 예외: mock.
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid, localeSortingFn } from '@topgrid/grid-core';

interface Row {
  w: string;
}
// data order is scrambled; sorting reveals the collation order.
const data: Row[] = [{ w: 'z' }, { w: 'é' }, { w: 'e' }, { w: 'f' }];
const columns: ColumnDef<Row>[] = [
  { accessorKey: 'w', header: '단어', sortingFn: localeSortingFn, size: 120 },
];

const meta: Meta = { title: 'grid-core/Grid (Locale Sort)' };
export default meta;

export const Default: StoryObj = {
  name: 'locale 정렬 (é는 e와 f 사이)',
  render: () => <Grid<Row> columns={columns} data={data} enableSort />,
};
