// MOD-GRID-36 G-1: stable row identity (getRowId). ★non-vacuous: selection is keyed by the row's
// id, NOT its array index — so prepending a row keeps the SAME logical row selected (index-keyed
// selection would shift to the wrong row). C-3 예외: mock 데이터.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid } from '@topgrid/grid-core';

interface Row {
  sku: string;
  name: string;
}
const initial: Row[] = [
  { sku: 'A', name: '사과' },
  { sku: 'B', name: '바나나' },
  { sku: 'C', name: '체리' },
];
const columns: ColumnDef<Row>[] = [
  { accessorKey: 'sku', header: 'SKU', size: 100 },
  { accessorKey: 'name', header: '이름', size: 160 },
];

function IdentityDemo(): JSX.Element {
  const [data, setData] = useState<Row[]>(initial);
  return (
    <div>
      <button
        type="button"
        data-testid="prepend"
        onClick={() => setData((d) => [{ sku: 'Z', name: '신규' }, ...d])}
      >
        맨 앞에 행 추가
      </button>
      <Grid<Row> columns={columns} data={data} rowSelection="multi" getRowId={(r) => r.sku} />
    </div>
  );
}

const meta: Meta = { title: 'grid-core/Grid (Row Identity)' };
export default meta;

export const Default: StoryObj = {
  name: 'getRowId: 선택이 정체성을 따라감(인덱스 아님)',
  render: () => <IdentityDemo />,
};
