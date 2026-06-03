// MOD-GRID-26 G-3: spreadsheet PoC — chromium gate (formula round-trip: cell stores a formula,
// displays a value; editing an upstream cell recomputes the formula cell).
import type { Meta, StoryObj } from '@storybook/react';
import { SheetGrid } from '@topgrid/grid-pro-sheet';

const meta: Meta<typeof SheetGrid> = {
  title: 'grid-pro-sheet/SheetGrid',
  component: SheetGrid,
};
export default meta;
type Story = StoryObj<typeof SheetGrid>;

export const Basic: Story = {
  name: '수식 셀 (A1 참조 + SUM)',
  args: { rows: 8, cols: 5 },
};
