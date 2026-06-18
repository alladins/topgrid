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

export const Unlicensed: Story = {
  // PAT-003: without a valid Pro license the panel is watermarked.
  beforeEach: () => {
    setLicenseState({ status: { valid: false, reason: 'invalid' }, rawKey: '', setAt: 0 });
  },
  args: { data, initialType: 'bar' },
};
