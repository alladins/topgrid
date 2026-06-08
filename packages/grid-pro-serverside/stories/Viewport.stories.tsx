// MOD-GRID-68: viewport row model — chromium gate. Push-based: the datasource captures the push
// callbacks at init, pushes rows for the requested viewport range, and can push a LIVE in-place update
// to a visible row. ★end-to-end (LESS-006): viewport rows render, and a simulated server push mutates a
// visible cell in place (real-time = the differentiator from pull-based SSRM). C-3 예외: mock 데이터.
import { useMemo, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid } from '@topgrid/grid-core';
import { useViewportRowModel, isRowPlaceholder } from '@topgrid/grid-pro-serverside';
import type {
  ViewportDatasource,
  ViewportDatasourceParams,
} from '@topgrid/grid-pro-serverside';

interface Row {
  id: number;
  value: string;
}

const TOTAL = 100;

const columns: ColumnDef<Row>[] = [
  { id: 'id', accessorKey: 'id', header: 'ID', size: 100 },
  {
    id: 'value',
    header: 'Value',
    size: 240,
    // placeholder-aware: not-yet-pushed rows render a dash.
    cell: ({ row }) => (isRowPlaceholder(row.original) ? '…' : (row.original as Row).value),
  },
];

function ViewportDemo() {
  const paramsRef = useRef<ViewportDatasourceParams<Row> | null>(null);
  const datasource = useMemo<ViewportDatasource<Row>>(
    () => ({
      init(p) {
        paramsRef.current = p;
        p.setRowCount(TOTAL);
      },
      setViewportRange(firstRow, lastRow) {
        const update: Record<number, Row> = {};
        for (let i = firstRow; i <= lastRow && i < TOTAL; i++) {
          update[i] = { id: i, value: `row-${i}` };
        }
        paramsRef.current?.setRowData(update);
      },
    }),
    [],
  );
  const { gridProps } = useViewportRowModel<Row>(datasource, { rowCount: TOTAL });

  // Simulate a real-time server push: update row 0's value in place.
  const pushUpdate = (): void => {
    paramsRef.current?.setRowData({ 0: { id: 0, value: 'UPDATED' } });
  };

  return (
    <div style={{ width: 600 }}>
      <button type="button" data-testid="push" onClick={pushUpdate} style={{ marginBottom: 8 }}>
        서버 push 시뮬
      </button>
      <Grid columns={columns} {...gridProps} virtualScrollHeight={320} />
    </div>
  );
}

const meta: Meta<typeof ViewportDemo> = {
  title: 'grid-pro-serverside/Viewport',
  component: ViewportDemo,
};
export default meta;
type Story = StoryObj<typeof ViewportDemo>;

export const RealTimePush: Story = {
  name: '뷰포트 행 모델 (실시간 push + in-place 갱신)',
};
