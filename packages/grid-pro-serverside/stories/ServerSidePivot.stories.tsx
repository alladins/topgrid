// MOD-GRID-67: server-side pivoting — chromium gate. The mock datasource returns server-PIVOTED rows
// (keyed by generated field keys) + pivotResultFields; useServerSideData surfaces them as a nested
// pivotColumns tree (buildServerPivotColumns). ★end-to-end: on load the grid renders dynamic pivot
// column headers (Q1/Q2) with the server values — not present until the pivot response arrives (LESS-006).
// C-3 예외: mock 데이터 (Storybook stories).
import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid } from '@topgrid/grid-core';
import { useServerSideData } from '@topgrid/grid-pro-serverside';
import type { ServerSideDatasource } from '@topgrid/grid-pro-serverside';

interface PivotRow {
  region: string;
  [field: string]: string | number;
}

// Server-pivoted data: each region row carries one cell per (quarter|measure) combination.
const PIVOTED: PivotRow[] = [
  { region: 'East', 'Q1|sales': 100, 'Q2|sales': 200 },
  { region: 'West', 'Q1|sales': 70, 'Q2|sales': 90 },
];
const FIELDS = ['Q1|sales', 'Q2|sales'];

function makeDatasource(): ServerSideDatasource<PivotRow> {
  return {
    getRows({ startRow, endRow }) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            rows: PIVOTED.slice(startRow, endRow),
            lastRow: PIVOTED.length,
            pivotResultFields: FIELDS,
          });
        }, 20);
      });
    },
  };
}

const regionCol: ColumnDef<PivotRow> = { id: 'region', accessorKey: 'region', header: 'Region', size: 120 };

function ServerSidePivotDemo() {
  const datasource = useMemo(makeDatasource, []);
  const { gridProps, pivotColumns } = useServerSideData<PivotRow>(datasource, {
    blockSize: 50,
    rowCount: PIVOTED.length,
    pivot: { pivotCols: ['quarter'], valueCols: ['sales'] },
  });
  // fixed row-dimension column + the server-derived pivot-result columns.
  const columns = useMemo<ColumnDef<PivotRow>[]>(
    () => [regionCol, ...(pivotColumns as unknown as ColumnDef<PivotRow>[])],
    [pivotColumns],
  );
  return (
    <div style={{ width: 600 }}>
      <Grid columns={columns} {...gridProps} virtualScrollHeight={320} />
    </div>
  );
}

const meta: Meta<typeof ServerSidePivotDemo> = {
  title: 'grid-pro-serverside/SSRM Pivot',
  component: ServerSidePivotDemo,
};
export default meta;
type Story = StoryObj<typeof ServerSidePivotDemo>;

export const ServerPivot: Story = {
  name: '서버사이드 피벗 (동적 pivot-result 컬럼)',
};
