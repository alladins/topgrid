// MOD-GRID-35 G-1: row-click selection — chromium gate. Click a row body to select it; ctrl/cmd+click
// toggles (multi). ★non-vacuous: plain click REPLACES (others deselect), ctrl ADDS, and onRowClick
// still fires alongside. C-3 예외: mock 데이터.
import { useState } from 'react';
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

const meta: Meta = { title: 'grid-core/Grid (Row Click Select)' };
export default meta;

// multi mode + a click counter to prove onRowClick coexists with selection.
function MultiDemo(): JSX.Element {
  const [clicks, setClicks] = useState(0);
  return (
    <div>
      <div data-testid="click-count">clicks: {clicks}</div>
      <Grid<Row>
        columns={columns}
        data={data}
        rowSelection="multi"
        enableRowClickSelection
        onRowClick={() => setClicks((c) => c + 1)}
      />
    </div>
  );
}

export const Multi: StoryObj = {
  name: '다중: 행클릭 선택 + ctrl 토글 (+onRowClick 공존)',
  render: () => <MultiDemo />,
};

export const Single: StoryObj = {
  name: '단일: 행클릭 시 항상 한 행만',
  render: () => <Grid<Row> columns={columns} data={data} rowSelection="single" enableRowClickSelection />,
};
