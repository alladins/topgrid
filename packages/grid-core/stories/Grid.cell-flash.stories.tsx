// MOD-GRID-36 G-2: cell change-flash — chromium gate. Editing a cell briefly highlights ONLY that
// cell; a pure reorder highlights nothing (identity diff). C-3 예외: mock 데이터.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid } from '@topgrid/grid-core';

interface Row {
  sku: string;
  price: number;
  name: string;
}
const initial: Row[] = [
  { sku: 'A', price: 10, name: '사과' },
  { sku: 'B', price: 20, name: '바나나' },
  { sku: 'C', price: 30, name: '체리' },
];
const columns: ColumnDef<Row>[] = [
  { accessorKey: 'sku', header: 'SKU', size: 90 },
  { accessorKey: 'price', header: '가격', size: 110 },
  { accessorKey: 'name', header: '이름', size: 150 },
];

function FlashDemo(): JSX.Element {
  const [data, setData] = useState<Row[]>(initial);
  return (
    <div>
      <button
        type="button"
        data-testid="edit-b"
        onClick={() => setData((d) => d.map((r) => (r.sku === 'B' ? { ...r, price: r.price + 5 } : r)))}
      >
        B 가격 +5
      </button>
      <button
        type="button"
        data-testid="reorder"
        onClick={() => setData((d) => [d[d.length - 1], ...d.slice(0, -1)])}
      >
        재정렬(맨끝→맨앞)
      </button>
      <Grid<Row> columns={columns} data={data} getRowId={(r) => r.sku} enableCellChangeFlash />
    </div>
  );
}

const meta: Meta = { title: 'grid-core/Grid (Cell Flash)' };
export default meta;

export const Default: StoryObj = {
  name: '셀 변경 flash (값 변경만, 재정렬 제외)',
  render: () => <FlashDemo />,
};
