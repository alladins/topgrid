// MOD-GRID-22 G-2: server-side row model (SSRM) — chromium AC① gate (scroll → block fetch).
// The node controller test (necessary, not sufficient) proves the data flow headless; this story
// + playwright prove the *browser* path: a real scroll moves the row virtualizer, whose onChange
// fires a specific block's getRows EXACTLY once, and the rows appear (LESS-006).
// C-3 예외: mock 데이터는 Storybook stories 및 unit tests에서만 허용 (D7 결정, ADR-006).
import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Grid, createColumns } from '@topgrid/grid-core';
import { useServerSideData } from '@topgrid/grid-pro-serverside';
import type { ServerSideDatasource } from '@topgrid/grid-pro-serverside';

interface Row {
  id: number;
  value: string;
}

const columns = createColumns<Row>([
  { id: 'id', name: 'ID', type: 'number', width: '100' },
  { id: 'value', name: 'Value', type: 'text', width: '240' },
]);

const TOTAL = 1000;
const BLOCK = 50;

// Mock datasource. Records every request on globalThis.__ssrmCalls so the chromium test can
// assert "exactly one request per block". 20ms delay simulates the network round-trip.
function makeDatasource(): ServerSideDatasource<Row> {
  const calls: Array<{ startRow: number; endRow: number }> = [];
  (globalThis as unknown as { __ssrmCalls: typeof calls }).__ssrmCalls = calls;
  return {
    getRows({ startRow, endRow }) {
      calls.push({ startRow, endRow });
      return new Promise((resolve) => {
        setTimeout(() => {
          const rows: Row[] = [];
          for (let i = startRow; i < Math.min(endRow, TOTAL); i++) {
            rows.push({ id: i, value: `row-${i}` });
          }
          resolve({ rows, lastRow: endRow >= TOTAL ? TOTAL : undefined });
        }, 20);
      });
    },
  };
}

function ServerSideDemo() {
  const datasource = useMemo(makeDatasource, []);
  const { gridProps } = useServerSideData<Row>(datasource, {
    blockSize: BLOCK,
    rowCount: TOTAL,
  });
  return (
    <div style={{ width: 600 }}>
      <Grid columns={columns} {...gridProps} virtualScrollHeight={320} />
    </div>
  );
}

const meta: Meta<typeof ServerSideDemo> = {
  title: 'grid-pro-serverside/SSRM',
  component: ServerSideDemo,
};
export default meta;
type Story = StoryObj<typeof ServerSideDemo>;

export const InfiniteScroll: Story = {
  name: '무한 스크롤 (블록 lazy 로드)',
};
