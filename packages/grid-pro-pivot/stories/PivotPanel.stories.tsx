// MOD-GRID-64 / G-2 — PivotPanel DnD tool panel, wired to a live PivotGrid via shared
// useState<PivotConfig>. The chromium test (sheet of this story) drags `region` into the
// Rows zone and asserts the GRID re-pivots (East/West row headers appear) — proving the
// panel configures the pivot, not merely that a chip moved between zones.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PivotGrid, PivotPanel, type PivotConfig } from '@topgrid/grid-pro-pivot';

interface SalesRow {
  region: string;
  city: string;
  year: string;
  quarter: string;
  sales: number;
  units: number;
}

const salesData: SalesRow[] = [
  { region: 'East', city: 'NY', year: '2024', quarter: 'Q1', sales: 100, units: 10 },
  { region: 'East', city: 'NY', year: '2024', quarter: 'Q2', sales: 200, units: 18 },
  { region: 'East', city: 'Boston', year: '2024', quarter: 'Q1', sales: 30, units: 4 },
  { region: 'West', city: 'LA', year: '2024', quarter: 'Q1', sales: 70, units: 9 },
  { region: 'West', city: 'LA', year: '2025', quarter: 'Q2', sales: 90, units: 11 },
];

const FIELDS = ['region', 'city', 'year', 'quarter', 'sales', 'units'];

const meta: Meta = { title: 'grid-pro-pivot/PivotPanel' };
export default meta;

type Story = StoryObj;

export const WiredToGrid: Story = {
  name: 'PivotPanel → PivotGrid (drag a field, grid re-pivots)',
  render: () => {
    // Start with NO row dimension: the grid shows only a grand total — no East/West rows.
    // `region` therefore sits in the Available zone, ready to be dragged into Rows.
    const [config, setConfig] = useState<PivotConfig>({
      rows: [],
      columns: ['quarter'],
      values: [{ field: 'sales', aggregationFn: 'sum', label: 'Sales' }],
    });
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <PivotPanel fields={FIELDS} config={config} onConfigChange={setConfig} />
        <PivotGrid<SalesRow> data={salesData} config={config} />
      </div>
    );
  },
};
