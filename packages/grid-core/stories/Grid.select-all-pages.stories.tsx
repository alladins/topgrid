// MOD-GRID-55 — select-all across ALL pages. ★behavior-gated, non-vacuous: "a header checkbox
// exists" is vacuous. The real divergence: with pagination, selectAllPages header selects EVERY
// page's rows (count = total), while the default page-scoped header selects only the current page
// (count = page size). onSelectionChange reports all selected rows (by key, across pages) → the
// count is the divergence indicator. C-3 예외: mock 데이터.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid } from '@topgrid/grid-core';

interface Row {
  id: number;
  name: string;
}
const data: Row[] = Array.from({ length: 12 }, (_, i) => ({ id: i, name: `Row ${i}` }));
const columns: ColumnDef<Row>[] = [{ accessorKey: 'name', header: 'Name' }];

function Demo({ selectAllPages }: { selectAllPages: boolean }): JSX.Element {
  const [count, setCount] = useState(0);
  return (
    <div>
      <div data-testid="sel-count">{count}</div>
      <Grid<Row>
        data={data}
        columns={columns}
        enablePagination
        pagination={{ pageSize: 5 }}
        rowSelection={{ mode: 'multi', selectAllPages, onSelectionChange: (r) => setCount(r.length) }}
      />
    </div>
  );
}

const meta: Meta = { title: 'grid-core/Grid (Select All Pages)' };
export default meta;

/** selectAllPages: header checkbox selects every page's rows (count = 12 total). */
export const AllPages: StoryObj = {
  name: '전 페이지 전체선택',
  render: () => <Demo selectAllPages />,
};

/** Default (page-scoped): header checkbox selects only the current page (count = 5). */
export const PageOnly: StoryObj = {
  name: '현재 페이지만 (기본)',
  render: () => <Demo selectAllPages={false} />,
};
