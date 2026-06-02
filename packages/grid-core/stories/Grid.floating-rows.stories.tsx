// MOD-GRID-24 G-2: floating(고정) 합계/요약 행 — chromium mount 검증용.
// C-3 예외: mock 데이터는 Storybook stories 및 unit tests에서만 허용 (D7 결정, ADR-006)
import type { Meta, StoryObj } from '@storybook/react';
import { Grid, createColumns } from '@topgrid/grid-core';

interface SalesRow {
  region: string;
  q1: number;
  q2: number;
}

const data: SalesRow[] = [
  { region: '서울', q1: 120, q2: 150 },
  { region: '부산', q1: 80, q2: 95 },
  { region: '대구', q1: 60, q2: 70 },
];

// 소비자 공급 합계 행 (집계 자동계산 아님 — total 객체를 직접 제공)
const totalRow: SalesRow = { region: '합계', q1: 260, q2: 315 };

const columns = createColumns<SalesRow>([
  { accessorKey: 'region', header: '지역' },
  { accessorKey: 'q1', header: '1분기' },
  { accessorKey: 'q2', header: '2분기' },
]);

const meta: Meta<typeof Grid> = {
  title: 'grid-core/Grid (Floating Rows)',
  component: Grid,
};
export default meta;
type Story = StoryObj<typeof Grid>;

export const FloatingTopAndBottom: Story = {
  name: '상/하단 고정 합계 행',
  args: {
    columns,
    data,
    floatingTopRows: [totalRow],
    floatingBottomRows: [totalRow],
  },
};

export const FloatingBottomOnly: Story = {
  name: '하단 고정 합계 행만',
  args: {
    columns,
    data,
    floatingBottomRows: [totalRow],
  },
};

// 회귀: floating prop 미제공 → 기존 동작과 동일(고정 행 0)
export const NoFloatingRows: Story = {
  name: '회귀 — floating 없음',
  args: {
    columns,
    data,
  },
};
