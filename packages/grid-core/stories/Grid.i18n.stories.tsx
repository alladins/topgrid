// MOD-GRID-29 G-1: i18n localeText + icons — chromium gate for the partial-override
// invariant: an OVERRIDDEN key shows the new string, a NON-overridden key still falls
// back to the Korean default (resolver merge, not replace).
// C-3 예외: mock 데이터는 Storybook stories 에서만 허용.
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid } from '@topgrid/grid-core';

interface Row {
  name: string;
  score: number;
}

const data: Row[] = Array.from({ length: 7 }, (_, i) => ({
  name: `학생${i + 1}`,
  score: 60 + i * 5,
}));

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'name', header: '이름', size: 160 },
  { accessorKey: 'score', header: '점수', size: 120 },
];

const meta: Meta<typeof Grid> = { title: 'grid-core/Grid (i18n)', component: Grid };
export default meta;
type Story = StoryObj<typeof Grid>;

// Partial override: rowsPerPage → English, icons.sortAscending → 'UP'.
// totalCount / emptyText left untouched ⇒ must still render Korean defaults.
export const PartialOverride: Story = {
  name: '부분 override (EN 라벨 + KO fallback)',
  args: {
    columns,
    data,
    enableSort: true,
    enablePagination: true,
    pagination: { pageSize: 3 },
    localeText: {
      rowsPerPage: 'Rows per page:',
      nextPage: 'Next page',
    },
    icons: {
      sortAscending: 'UP',
    },
  },
};

// Full override of totalCount formatter — replaces the bold "전체 N건" with plain EN.
export const TotalCountFormatter: Story = {
  name: 'totalCount 포매터 override',
  args: {
    columns,
    data,
    enablePagination: true,
    pagination: { pageSize: 3 },
    localeText: {
      totalCount: (count: number) => `Total: ${count}`,
    },
  },
};

// Empty-text override — emptyText overridden, everything else falls back.
export const EmptyTextOverride: Story = {
  name: 'emptyText override',
  args: {
    columns,
    data: [],
    localeText: {
      emptyText: 'No records found.',
    },
  },
};
