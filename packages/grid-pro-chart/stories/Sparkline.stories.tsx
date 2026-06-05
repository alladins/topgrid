// MOD-GRID-34 G-2: SparklineCell min/max markers — chromium gate + visibility (sparklines also had
// zero stories). ★non-vacuous: the max marker must sit at the ACTUAL max point, not the endpoint —
// data that starts low would wrongly mark index 0 as min if "min == first point". C-3: mock 전용.
import type { Meta, StoryObj } from '@storybook/react';
import { setLicenseState } from '@topgrid/grid-license';
import { SparklineCell } from '@topgrid/grid-pro-chart';

setLicenseState({ status: { valid: true }, rawKey: 'storybook', setAt: 0 });

const meta: Meta<typeof SparklineCell> = {
  title: 'grid-pro-chart/Sparkline',
  component: SparklineCell,
};
export default meta;
type Story = StoryObj<typeof SparklineCell>;

// values: peak (90) is in the MIDDLE, trough (5) near the end → markers must NOT land on endpoints.
const wave = [40, 60, 90, 70, 30, 5, 25];

export const MinMaxMarkers: Story = {
  args: { values: wave, type: 'line', width: 160, height: 40, showMinMax: true, color: '#374151' },
};

export const AreaWithMarkers: Story = {
  args: { values: wave, type: 'area', width: 160, height: 40, showMinMax: true, color: '#2563eb' },
};
