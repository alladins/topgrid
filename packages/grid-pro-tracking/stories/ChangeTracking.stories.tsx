// spec G-002 Section 7 #9 / Step 8
// AC-004: ChangeTrackingGrid + useChangeTracking 훅 데모 (AC-004)
// C-3 예외: mock rows 데이터는 Storybook stories에서만 허용 (D7 결정, ADR-006)
// C-1 준수: ChangeTrackingGridProps 소스에서 확인
//   - data: TData[]
//   - rowKey: keyof TData | ((row) => string)
//   - columns: ColumnDef<TData>[]
//   + 나머지 GridProps (enableSort 등)
import type { Meta, StoryObj } from '@storybook/react';
import { ChangeTrackingGrid } from '@topgrid/grid-pro-tracking';
import { createColumns } from '@topgrid/grid-core';

// C-3 예외: mock rows 데이터 — Storybook stories 허용 범위
interface EmployeeRow {
  id: number;
  name: string;
  dept: string;
  salary: number;
  status: string;
}

const mockEmployees: EmployeeRow[] = [
  { id: 1, name: '홍길동', dept: '개발팀', salary: 5000000, status: '재직' },
  { id: 2, name: '김영희', dept: '기획팀', salary: 4200000, status: '재직' },
  { id: 3, name: '이철수', dept: '영업팀', salary: 6100000, status: '재직' },
  { id: 4, name: '박민지', dept: '개발팀', salary: 4800000, status: '휴직' },
  { id: 5, name: '최준호', dept: '기획팀', salary: 3900000, status: '재직' },
];

const columns = createColumns<EmployeeRow>([
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: '이름' },
  { accessorKey: 'dept', header: '부서' },
  { accessorKey: 'salary', header: '급여' },
  { accessorKey: 'status', header: '상태' },
]);

const meta: Meta<typeof ChangeTrackingGrid> = {
  title: 'grid-pro-tracking/ChangeTrackingGrid',
  component: ChangeTrackingGrid,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ChangeTrackingGrid>;

export const Default: Story = {
  name: '기본 변경 추적 Grid',
  args: {
    data: mockEmployees,
    columns,
    rowKey: 'id',
  },
};

export const WithSort: Story = {
  name: '변경 추적 + 정렬',
  args: {
    data: mockEmployees,
    columns,
    rowKey: 'id',
    enableSort: true,
  },
};

export const WithRowSelection: Story = {
  name: '변경 추적 + 행 선택',
  args: {
    data: mockEmployees,
    columns,
    rowKey: 'id',
    rowSelection: 'multi',
  },
};

export const WithEditedCells: Story = {
  name: '변경 추적 + 셀 레벨 추적',
  args: {
    data: mockEmployees,
    columns,
    rowKey: 'id',
    editedCells: true,
  },
};
