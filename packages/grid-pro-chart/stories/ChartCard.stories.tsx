// MOD-GRID-34 G-3: type-switcher toolbar + range-selection/pivot charting via seriesFromMatrix.
// ★non-vacuous: clicking a toolbar button genuinely changes the chart SHAPE (data-chart-type), and
// the matrix bridge produces the right SERIES COUNT from a selected range / pivot result. C-3 mock.
import type { Meta, StoryObj } from '@storybook/react';
import { setLicenseState } from '@topgrid/grid-license';
import {
  ChartCard,
  RangeChart,
  seriesFromMatrix,
  seriesFromPivot,
  type PivotLike,
} from '@topgrid/grid-pro-chart';

setLicenseState({ status: { valid: true }, rawKey: 'storybook', setAt: 0 });

const meta: Meta = { title: 'grid-pro-chart/ChartCard' };
export default meta;

// ── Toolbar / type switcher ──────────────────────────────────────────────────
export const TypeSwitcher: StoryObj = {
  name: '툴바 타입 스위처 (막대/선/영역)',
  render: () => (
    <ChartCard
      title="월별 매출"
      initialType="bar"
      series={[{ name: 'revenue', values: [30, 80, 45, 95, 60], color: '#2563eb' }]}
      categories={['1월', '2월', '3월', '4월', '5월']}
      ariaLabel="타입 전환 차트"
    />
  ),
};

// ── Chart from a selected cell range ─────────────────────────────────────────
// A 3-region × 2-quarter range selected in a grid → one series per quarter (orientation 'columns').
const rangeMatrix = {
  categories: ['서울', '부산', '대구'], // selected rows
  columns: ['Q1', 'Q2'], // selected columns
  matrix: [
    [120, 150],
    [90, 110],
    [70, 95],
  ],
};
export const FromCellRange: StoryObj = {
  name: '셀 범위 선택 → 차트',
  render: () => {
    const { categories, series } = seriesFromMatrix({ ...rangeMatrix, orientation: 'columns' });
    return (
      <ChartCard title="선택 범위" initialType="bar" series={series} categories={categories} width={420} />
    );
  },
};

// ── Chart from a pivot result ────────────────────────────────────────────────
// A real PivotModel-shaped result (region × product, summed) reduced by seriesFromPivot — it drops
// the subtotal/grandTotal rows and reads the `<leafKey>__<valueIndex>` value cells, exactly like a
// live PivotModel. (C-3: the fixture is mock data, but the SHAPE + the adapter are real.)
const pivotModel: PivotLike = {
  config: { rows: ['region'], columns: ['product'], values: [{}] },
  columnLeafKeys: ['Widget', 'Gadget'],
  columnTree: [
    { key: 'Widget', value: 'Widget' },
    { key: 'Gadget', value: 'Gadget' },
  ],
  rows: [
    { __kind: 'data', region: 'East', Widget__0: 340, Gadget__0: 210 },
    { __kind: 'data', region: 'West', Widget__0: 180, Gadget__0: 260 },
    { __kind: 'data', region: 'North', Widget__0: 120, Gadget__0: 90 },
    { __kind: 'subtotal', region: 'East', Widget__0: 999, Gadget__0: 999 },
    { __kind: 'grandTotal', Widget__0: 640, Gadget__0: 560 },
  ],
};
export const FromPivotResult: StoryObj = {
  name: '피벗 결과 → 차트',
  render: () => {
    const { categories, series } = seriesFromPivot(pivotModel);
    return <RangeChart type="bar" series={series} categories={categories} width={440} ariaLabel="피벗 차트" />;
  },
};
