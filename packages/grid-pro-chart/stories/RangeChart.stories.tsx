// MOD-GRID-34 G-1: built-in cartesian RangeChart (zero-dep pure SVG) — chromium gate + visibility.
// ★ This story exists for TWO reasons: (1) the gate — assert the SCALE is wired to the DOM (the bar
// for a bigger value is actually TALLER, axis ticks are round), not just "an <svg> rendered"
// (LESS-006); (2) the headline — charts were INVISIBLE because zero chart stories existed. A valid
// license is injected so no Pro watermark covers the chart. C-3 예외: mock 데이터는 story 전용.
import type { Meta, StoryObj } from '@storybook/react';
import { setLicenseState } from '@topgrid/grid-license';
import { RangeChart, type ChartSeries } from '@topgrid/grid-pro-chart';

setLicenseState({ status: { valid: true }, rawKey: 'storybook', setAt: 0 });

const revenue: ChartSeries[] = [{ name: 'revenue', values: [30, 80, 45, 95, 60], color: '#2563eb' }];
const months = ['1월', '2월', '3월', '4월', '5월'];

const meta: Meta<typeof RangeChart> = {
  title: 'grid-pro-chart/RangeChart',
  component: RangeChart,
};
export default meta;
type Story = StoryObj<typeof RangeChart>;

export const Bar: Story = {
  args: { series: revenue, type: 'bar', categories: months, ariaLabel: '월별 매출 막대' },
};

export const Line: Story = {
  args: { series: revenue, type: 'line', categories: months, ariaLabel: '월별 매출 추이' },
};

export const Area: Story = {
  args: { series: revenue, type: 'area', categories: months, ariaLabel: '월별 매출 영역' },
};

export const Unlicensed: Story = {
  // PAT-003: without a valid Pro license the chart is watermarked (matches RangeChartPanel/MultiFilter).
  beforeEach: () => {
    setLicenseState({ status: { valid: false, reason: 'invalid' }, rawKey: '', setAt: 0 });
  },
  args: { series: revenue, type: 'bar', categories: months, ariaLabel: '무라이선스 차트' },
};

export const MultiSeries: Story = {
  args: {
    type: 'bar',
    categories: ['Q1', 'Q2', 'Q3', 'Q4'],
    ariaLabel: '제품별 분기 매출',
    series: [
      { name: '제품 A', values: [40, 70, 55, 90] },
      { name: '제품 B', values: [25, 45, 60, 35] },
    ],
    width: 420,
  },
};
