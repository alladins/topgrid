// W2 단계③ 증분2: EnterpriseChartPanel chromium gate.
// ★ Non-vacuous intent: the panel actually drives ECharts — switching the toolbar type re-renders
// the chart (data-rendered-type reflects what ECharts accepted), and Export produces a non-empty SVG
// data URL. A valid license is injected so no Pro watermark covers the chart. C-3: mock data is
// story-only. ECharts uses the SVG renderer → the chart is inline <svg> (DOM-inspectable).
import type { Meta, StoryObj } from '@storybook/react';
import { setLicenseState } from '@topgrid/grid-license';
import { EnterpriseChartPanel } from '@topgrid/grid-pro-chart-enterprise';
import type { MatrixChartData } from '@topgrid/grid-pro-chart';

setLicenseState({ status: { valid: true }, rawKey: 'storybook', setAt: 0 });

const data: MatrixChartData = {
  categories: ['Q1', 'Q2', 'Q3', 'Q4'],
  series: [
    { name: '제품 A', values: [40, 70, 55, 90], color: '#2563eb' },
    { name: '제품 B', values: [25, 45, 60, 35], color: '#16a34a' },
  ],
};

const meta: Meta<typeof EnterpriseChartPanel> = {
  title: 'grid-pro-chart-enterprise/EnterpriseChartPanel',
  component: EnterpriseChartPanel,
};
export default meta;
type Story = StoryObj<typeof EnterpriseChartPanel>;

export const Default: Story = {
  args: { data, initialType: 'bar', enableToolbar: true, enableExport: true },
};

export const Pie: Story = {
  args: { data, initialType: 'pie', enableToolbar: true, enableExport: true },
};

// toolbarTypes: surface catalog types beyond the default 6 (e.g. radar/heatmap) in the toolbar.
export const CustomToolbar: Story = {
  args: {
    data,
    initialType: 'bar',
    toolbarTypes: ['bar', 'radar', 'heatmap'],
    enableToolbar: true,
  },
};

// Catalog-expansion live gates (증분3) — these exercise the trickier ECharts module registrations:
// radar → RadarComponent, heatmap → VisualMapComponent + HeatmapChart, candlestick → CandlestickChart.
export const Radar: Story = {
  args: { data, initialType: 'radar', enableToolbar: false },
};

export const Heatmap: Story = {
  args: { data, initialType: 'heatmap', enableToolbar: false },
};

// OHLC fixture: series 0..3 = open, close, low, high.
const ohlc: MatrixChartData = {
  categories: ['D1', 'D2', 'D3'],
  series: [
    { name: 'open', values: [10, 20, 15] },
    { name: 'close', values: [15, 18, 22] },
    { name: 'low', values: [8, 16, 14] },
    { name: 'high', values: [17, 22, 24] },
  ],
};

export const Candlestick: Story = {
  args: { data: ohlc, initialType: 'candlestick', enableToolbar: false },
};

export const Unlicensed: Story = {
  // PAT-003: without a valid Pro license the panel is watermarked.
  beforeEach: () => {
    setLicenseState({ status: { valid: false, reason: 'invalid' }, rawKey: '', setAt: 0 });
  },
  args: { data, initialType: 'bar' },
};
