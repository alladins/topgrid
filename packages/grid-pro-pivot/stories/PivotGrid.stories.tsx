// MOD-GRID-18 / G-3 mount verification (dev-harness LESS-002).
// PivotGrid composes grid-core <Grid>; node renderToStaticMarkup hits the
// react 18/19 dual-install wall, so the real mount happens here under the
// storybook/vite single-react (18.3.1) harness. This story is the mount that
// clears pivot's publish gate and exercises the column-group + __kind synthetic
// row delegation pattern that MOD-21/24/26 will reuse.
//
// mock rows: Storybook stories 허용 범위 (other packages' stories follow this).
import type { Meta, StoryObj } from '@storybook/react';
import { PivotGrid } from '@topgrid/grid-pro-pivot';

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
  { region: 'East', city: 'Boston', year: '2025', quarter: 'Q1', sales: 60, units: 7 },
  { region: 'West', city: 'LA', year: '2024', quarter: 'Q1', sales: 70, units: 9 },
  { region: 'West', city: 'LA', year: '2025', quarter: 'Q2', sales: 90, units: 11 },
];

const meta: Meta<typeof PivotGrid> = {
  title: 'grid-pro-pivot/PivotGrid',
  component: PivotGrid,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof PivotGrid<SalesRow>>;

export const Basic: Story = {
  name: 'PivotGrid region × quarter (sum)',
  args: {
    data: salesData,
    config: {
      rows: ['region'],
      columns: ['quarter'],
      values: [{ field: 'sales', aggregationFn: 'sum' }],
    },
  },
};

export const MultiDimWithSubtotals: Story = {
  name: 'PivotGrid 2 row dims × 2 col dims + subtotals',
  args: {
    data: salesData,
    config: {
      rows: ['region', 'city'],
      columns: ['year', 'quarter'],
      values: [
        { field: 'sales', aggregationFn: 'sum', label: 'Sales' },
        { field: 'units', aggregationFn: 'avg', label: 'Avg Units' },
      ],
    },
  },
};

export const CustomReducer: Story = {
  name: 'PivotGrid 커스텀 reducer (mean)',
  args: {
    data: salesData,
    config: {
      rows: ['region'],
      columns: ['quarter'],
      values: [
        {
          field: 'sales',
          aggregationFn: (v) => v.reduce((a, b) => a + b, 0) / v.length,
          label: 'Mean',
        },
      ],
    },
  },
};

export const PassthroughMode: Story = {
  name: 'PivotGrid pivotMode=false (passthrough)',
  args: {
    data: salesData,
    pivotMode: false,
    config: { rows: [], columns: [], values: [] },
    passthroughColumns: [
      { accessorKey: 'region', header: 'Region' },
      { accessorKey: 'city', header: 'City' },
      { accessorKey: 'sales', header: 'Sales' },
    ],
  },
};
