// spec G-002 Section 7 #10 / Step 8
// AC-004: RangeSelectGrid + DragFillHandle story
// C-3 예외: mock rows 데이터는 Storybook stories에서만 허용 (D7 결정, ADR-006)
// C-1 준수: RangeSelectGridProps — data, columns, onRangeChange?, loading?, emptyText?
import type { Meta, StoryObj } from '@storybook/react';
import { RangeSelectGrid } from '@topgrid/grid-pro-range';
import { createColumns } from '@topgrid/grid-core';

// C-3 예외: mock rows — Storybook stories 허용 범위
interface SpreadsheetRow {
  id: number;
  a: number;
  b: number;
  c: number;
  d: number;
}

const mockData: SpreadsheetRow[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  a: (i + 1) * 10,
  b: (i + 2) * 5,
  c: (i + 3) * 3,
  d: (i + 4) * 7,
}));

const columns = createColumns<SpreadsheetRow>([
  { id: 'id', name: 'ID', type: 'number' },
  { id: 'a', name: 'A열', type: 'number' },
  { id: 'b', name: 'B열', type: 'number' },
  { id: 'c', name: 'C열', type: 'number' },
  { id: 'd', name: 'D열', type: 'number' },
]);

const meta: Meta<typeof RangeSelectGrid> = {
  title: 'grid-pro-range/RangeSelectGrid',
  component: RangeSelectGrid,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof RangeSelectGrid>;

export const Default: Story = {
  name: '기본 범위 선택 Grid',
  args: {
    data: mockData,
    columns,
  },
};

export const WithRangeChangeCallback: Story = {
  name: '범위 선택 + 콜백',
  args: {
    data: mockData,
    columns,
    onRangeChange: (range) => console.log('범위 변경:', range),
  },
};

export const EmptyGrid: Story = {
  name: '빈 Grid',
  args: {
    data: [],
    columns,
    emptyText: '데이터가 없습니다.',
  },
};

// DragFillHandle은 RangeSelectGrid 내부에서 통합 사용됨
// 별도 standalone story는 복잡한 ref 설정이 필요하므로 통합 시나리오로 커버
export const LargeDataset: Story = {
  name: '대용량 데이터 (50행)',
  args: {
    data: Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      a: (i + 1) * 11,
      b: (i + 2) * 7,
      c: (i + 3) * 3,
      d: (i + 4) * 9,
    })),
    columns,
  },
};
