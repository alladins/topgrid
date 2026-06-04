// MOD-GRID-33 G-3: row drag reorder — chromium gate. drag a row onto another → onRowReorder → moveRow
// → the displayed order changes. C-3 예외: mock 데이터.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid, moveRow } from '@topgrid/grid-core';

interface Row {
  name: string;
  score: number;
}
const initial: Row[] = [
  { name: '김철수', score: 90 },
  { name: '이영희', score: 78 },
  { name: '박민준', score: 88 },
];
const columns: ColumnDef<Row>[] = [
  { accessorKey: 'name', header: '이름', size: 160 },
  { accessorKey: 'score', header: '점수', size: 120 },
];

function RowReorderDemo(): JSX.Element {
  const [rows, setRows] = useState<Row[]>(initial);
  return (
    <Grid<Row>
      columns={columns}
      data={rows}
      enableRowReorder
      onRowReorder={(from, to) => setRows((r) => moveRow(r, from, to))}
    />
  );
}

const meta: Meta = { title: 'grid-core/Grid (Row Reorder)' };
export default meta;

export const Default: StoryObj = {
  name: '행 드래그 재정렬',
  render: () => <RowReorderDemo />,
};

// ★ pagination: onRowReorder must use the DATA index (row.index), not the page-relative position —
// else reordering on page 2 silently moves the wrong rows.
const paged: Row[] = [
  { name: '김철수', score: 90 },
  { name: '이영희', score: 78 },
  { name: '박민준', score: 88 },
  { name: '최지우', score: 95 },
];
function PaginatedReorderDemo(): JSX.Element {
  const [rows, setRows] = useState<Row[]>(paged);
  return (
    <Grid<Row>
      columns={columns}
      data={rows}
      enablePagination
      pagination={{ pageSize: 2 }}
      enableRowReorder
      onRowReorder={(from, to) => setRows((r) => moveRow(r, from, to))}
    />
  );
}

export const Paginated: StoryObj = {
  name: '페이지네이션 + 재정렬 (data 인덱스)',
  render: () => <PaginatedReorderDemo />,
};
