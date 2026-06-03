// MOD-GRID-27 G-2 (Commit C): 컬럼(가로) 가상화 — chromium 매트릭스 검증용.
// 핀(좌/우)은 **엣지 컬럼**(c00→left, c21→right)으로 둬 natural order == 세그먼트 순서 →
// 헤더↔바디 정렬이 모호하지 않다(advisor). 폭 제한 컨테이너(decorator)로 가로 스크롤 유발.
// C-3 예외: mock 데이터는 Storybook stories 및 unit tests에서만 허용 (D7 결정, ADR-006).
import type { Meta, StoryObj } from '@storybook/react';
import { Grid, createColumns } from '@topgrid/grid-core';

interface WideRow {
  [colId: string]: string;
}

const COL_COUNT = 22;
const columnDefs = Array.from({ length: COL_COUNT }, (_, i) => {
  const id = `c${String(i).padStart(2, '0')}`;
  return { id, name: id.toUpperCase(), type: 'text', width: '140' };
});
const columns = createColumns<WideRow>(columnDefs);

const makeRows = (n: number): WideRow[] =>
  Array.from({ length: n }, (_, r) => {
    const row: WideRow = {};
    for (let i = 0; i < COL_COUNT; i++) {
      const id = `c${String(i).padStart(2, '0')}`;
      row[id] = `r${r}-${id}`;
    }
    return row;
  });

const meta: Meta<typeof Grid> = {
  title: 'grid-core/Grid (Column Virtualization)',
  component: Grid,
  // 폭 제한 → 22×140=3080px 테이블이 600px 컨테이너에서 가로 스크롤된다(윈도잉 유발).
  decorators: [
    (Story) => (
      <div style={{ width: 600 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Grid>;

// 가로 가상화만 — 핀 좌/우 엣지 + opt-in. 세로는 비활성(컨테이너 overflow-x-auto).
export const ColumnVirtualized: Story = {
  name: '가로 가상화 (핀 좌/우)',
  args: {
    columns,
    data: makeRows(12),
    enableColumnPinning: true,
    defaultColumnPinning: { left: ['c00'], right: ['c21'] },
    enableColumnVirtualization: true,
  },
};

// 세로+가로 동시 — 행 가상화(height+overflow:auto)와 컬럼 가상화 결합.
export const ColumnAndRowVirtualized: Story = {
  name: '세로+가로 동시 가상화',
  args: {
    columns,
    data: makeRows(100),
    enableColumnPinning: true,
    defaultColumnPinning: { left: ['c00'], right: ['c21'] },
    enableColumnVirtualization: true,
    enableVirtualization: true,
    virtualScrollHeight: 300,
  },
};

// 회귀 baseline — 동일 데이터, 가상화 OFF(전 컬럼 렌더). chromium 에서 ON↔OFF DOM 수 대조용.
export const ColumnVirtualizationOff: Story = {
  name: '회귀 — 가상화 OFF (전 컬럼)',
  args: {
    columns,
    data: makeRows(12),
    enableColumnPinning: true,
    defaultColumnPinning: { left: ['c00'], right: ['c21'] },
  },
};
