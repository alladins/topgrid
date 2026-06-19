// BYO seam proof (ADR-003 R4): RangeChartPanel imports NO chart library — the consumer injects a
// `renderChart` callback. This story injects a NON-ECharts renderer (a tiny custom SVG standing in
// for Highcharts/AG Charts/any lib) to prove arbitrary renderers render through the seam, plus the
// graceful no-renderer placeholder. A valid license is injected so no Pro watermark covers it.
import type { JSX } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { setLicenseState } from '@topgrid/grid-license';
import { RangeChartPanel, type RangeSeries } from '@topgrid/grid-pro-chart';

setLicenseState({ status: { valid: true }, rawKey: 'storybook', setAt: 0 });

const series: RangeSeries[] = [{ name: 'revenue', data: [30, 80, 45, 95] }];

// Stands in for a BYO library (Highcharts/AG/…). The panel never imports this — the consumer owns it.
function byoRenderer(s: RangeSeries[]): JSX.Element {
  const data = s[0]?.data ?? [];
  const max = Math.max(1, ...data);
  return (
    <svg data-byo-chart width={200} height={60} role="img" aria-label="BYO chart">
      {data.map((v, i) => (
        <rect
          key={i}
          data-byo-bar={v}
          x={i * 50}
          y={60 - (v / max) * 60}
          width={40}
          height={(v / max) * 60}
          fill="#7c3aed"
        />
      ))}
    </svg>
  );
}

const meta: Meta<typeof RangeChartPanel> = {
  title: 'grid-pro-chart/RangeChartPanel',
  component: RangeChartPanel,
};
export default meta;
type Story = StoryObj<typeof RangeChartPanel>;

export const ByoRenderer: Story = {
  args: { series, renderChart: byoRenderer, title: 'BYO renderer (non-ECharts)' },
};

export const NoRenderer: Story = {
  args: { series, title: 'No renderer' },
};
