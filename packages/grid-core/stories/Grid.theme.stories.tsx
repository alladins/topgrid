// MOD-GRID-29 G-2: CSS-variable theming — chromium computed-style gate. The spike converts ONE
// surface (header bg → var(--topgrid-header-bg, #f9fafb)) and proves the var flows root→surface:
// default (no theme) must compute to the gray-50 it replaced (no regression), and a DISTINCTIVE
// override must compute to exactly that color (the var actually paints). node can't see either.
// C-3 예외: mock 데이터는 Storybook stories 에서만 허용.
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid, darkTheme } from '@topgrid/grid-core';

interface Row {
  name: string;
  score: number;
}

const data: Row[] = [
  { name: '김철수', score: 90 },
  { name: '이영희', score: 78 },
  { name: '박민준', score: 88 },
];

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'name', header: '이름', size: 160 },
  { accessorKey: 'score', header: '점수', size: 120 },
];

const meta: Meta<typeof Grid> = { title: 'grid-core/Grid (Theme)', component: Grid };
export default meta;
type Story = StoryObj<typeof Grid>;

// No theme → header bg falls back to the gray-50 hex (#f9fafb = rgb(249,250,251)).
export const Default: Story = {
  name: '기본 (테마 없음 → gray-50 fallback)',
  args: { columns, data },
};

// Distinctive override → header bg computes to exactly rgb(255,0,0) (var flows root→thead).
export const HeaderBgOverride: Story = {
  name: 'headerBg override (distinctive)',
  args: { columns, data, theme: { headerBg: 'rgb(255, 0, 0)' } },
};

// Dark preset → all 5 static surfaces (headerBg/headerText/bodyBg/cellText/border) flip to dark.
export const Dark: Story = {
  name: '다크 프리셋',
  args: { columns, data, theme: darkTheme },
};

// HC-safe selection: rowSelection enabled → selecting a row adds an inline outline that survives
// forced-colors (the test selects a row, then asserts the outline under normal + forced-colors).
export const SelectionHC: Story = {
  name: 'HC-safe 선택 (outline)',
  args: { columns, data, rowSelection: 'multi' },
};

// Cross-feature guard: a consumer cellClassName color (MOD-24 conditional formatting) must WIN over
// the theme cellText. The theme color must be inherited (weakest cascade), not inline on the td
// (inline would beat the class and silently gray out conditional formatting). The ".tg-red" rule is
// shipped by the story itself because Tailwind classes are inert in the Tailwind-less storybook.
export const CellColorOverride: Story = {
  name: 'cellClassName 색 > 테마 cellText',
  render: (args) => (
    <>
      <style>{`.tg-red { color: rgb(255, 0, 0); }`}</style>
      <Grid
        {...args}
        cellClassName={(ctx) => (ctx.columnId === 'score' ? 'tg-red' : '')}
      />
    </>
  ),
  args: { columns, data },
};
