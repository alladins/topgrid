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

// MOD-GRID-63: per-cell styling. A1=bold, B1=fill(background), C1=align right; D1=no style.
export const Styled: Story = {
  name: '셀 스타일 (bold / fill / align)',
  args: {
    rows: 4,
    cols: 4,
    cellStyles: {
      A1: { bold: true },
      B1: { background: '#ffeeee' },
      C1: { align: 'right' },
    },
  },
};

// MOD-GRID-62: per-cell number formatting. B2=currency, C2=percent(1dp), D2=number(2dp); A2=no format.
// Type a numeric value into a formatted cell → the displayed value is formatted (stored value
// unchanged). Non-formatted cells render raw (byte-identical).
export const Formatted: Story = {
  name: '셀 숫자 서식 (currency / percent / decimals)',
  args: {
    rows: 4,
    cols: 4,
    formats: {
      B2: { type: 'currency' },
      C2: { type: 'percent', decimals: 1 },
      D2: { type: 'number', decimals: 2 },
    },
  },
};
