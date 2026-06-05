// MOD-GRID-39: row pinning (enableRowPinning + RowPinButton). ★behavior-gated: pinning a row moves
// it OUT of the center body INTO a sticky pinned region (data-pinned-row); unpin returns it. C-3 mock.
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid, RowPinButton } from '@topgrid/grid-core';

interface Row {
  id: string;
  name: string;
}
const data: Row[] = [
  { id: '1', name: '가' },
  { id: '2', name: '나' },
  { id: '3', name: '다' },
  { id: '4', name: '라' },
];
const columns: ColumnDef<Row>[] = [
  { id: 'pin', header: '', size: 90, cell: ({ row }) => <RowPinButton row={row} /> },
  { accessorKey: 'name', header: '이름', size: 160 },
];

const meta: Meta = { title: 'grid-core/Grid (Row Pinning)' };
export default meta;

export const Default: StoryObj = {
  name: '행 고정 (상/하단 sticky)',
  render: () => <Grid<Row> columns={columns} data={data} enableRowPinning getRowId={(r) => r.id} />,
};
