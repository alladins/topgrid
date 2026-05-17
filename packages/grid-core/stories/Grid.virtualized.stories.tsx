// spec G-002 Section 7 #5 / Step 4 (파일 #5)
// C-18 필수: 1000+ 행 가상화 시나리오 (AC-002)
// C-3 예외: 1000행/5000행 mock 데이터는 Storybook stories에서만 허용 (D7 결정, ADR-006)
// enableVirtualization / virtualScrollHeight — packages/grid-core/src/types.ts L585/L593 확인
import type { Meta, StoryObj } from '@storybook/react';
import { Grid, createColumns } from '@tomis/grid-core';

interface LargeRow {
  id: number;
  name: string;
  value: number;
  dept: string;
  email: string;
}

// C-3 예외: 1000행 mock 데이터 — Storybook stories 허용 범위 (D7 결정)
// C-18 필수: 1000+ 행 가상화 시나리오
const LARGE_DATA_1000: LargeRow[] = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  name: `사용자${i + 1}`,
  value: Math.floor((i * 37 + 13) % 10000),
  dept: ['개발팀', '기획팀', '영업팀'][i % 3],
  email: `user${i + 1}@example.com`,
}));

const LARGE_DATA_5000: LargeRow[] = Array.from({ length: 5000 }, (_, i) => ({
  id: i + 1,
  name: `사용자${i + 1}`,
  value: i * 3,
  dept: ['개발팀', '기획팀', '영업팀', '인사팀', '재무팀'][i % 5],
  email: `user${i + 1}@example.com`,
}));

const columns = createColumns<LargeRow>([
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: '이름' },
  { accessorKey: 'value', header: '수치' },
  { accessorKey: 'dept', header: '부서' },
  { accessorKey: 'email', header: '이메일' },
]);

const meta: Meta<typeof Grid> = {
  title: 'grid-core/Grid 대용량 가상화',
  component: Grid,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Grid>;

// AC-002 필수: 1000행 가상화 시나리오
// Grid.tsx: enableVirtualization=true → @tanstack/react-virtual 활성화
// Grid.tsx: virtualScrollHeight=600 → containerStyle.height (default 400)
export const Virtualized1000Rows: Story = {
  name: '1000행 가상화',
  args: {
    columns,
    data: LARGE_DATA_1000,
    enableVirtualization: true,   // types.ts L585: enableVirtualization?: boolean
    virtualScrollHeight: 600,     // types.ts L593: virtualScrollHeight?: number
  },
};

export const Virtualized5000Rows: Story = {
  name: '5000행 가상화 (성능 테스트)',
  args: {
    columns,
    data: LARGE_DATA_5000,
    enableVirtualization: true,
    virtualScrollHeight: 600,
  },
};

export const VirtualizedWithSort: Story = {
  name: '1000행 가상화 + 정렬',
  args: {
    columns,
    data: LARGE_DATA_1000,
    enableVirtualization: true,
    virtualScrollHeight: 500,
    enableSort: true,
  },
};
