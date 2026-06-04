// MOD-GRID-33 G-2: loading 오버레이 — chromium gate. ★non-vacuous: 오버레이 활성 시 *기존 data 행이 DOM
// 에 그대로* 있는 것이 skeleton 과의 유일한 차이다("오버레이 보임"만으론 vacuous). + aria-busy + pointer-events.
// 역방향: 평범한 loading=skeleton(데이터 치환)=무회귀. C-3 예외: mock 데이터.
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid } from '@topgrid/grid-core';

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

const meta: Meta<typeof Grid> = { title: 'grid-core/Grid (Loading)', component: Grid };
export default meta;
type Story = StoryObj<typeof Grid>;

// 오버레이: 기존 data 위에 덮음(데이터 행 유지).
export const Overlay: Story = {
  name: 'loadingOverlay (기존 data 위)',
  args: { columns, data, loadingOverlay: true },
};

// 비교: 평범한 loading → skeleton(데이터 치환). additive 무회귀 확인용.
export const Skeleton: Story = {
  name: 'loading (skeleton 치환)',
  args: { columns, data, loading: true },
};
