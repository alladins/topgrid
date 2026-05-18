/**
 * @topgrid/grid-pro-range — useCellRange Storybook Story (AC-011).
 *
 * Default story: 마우스 드래그 + Shift+Click 범위 선택 시뮬레이션 가능.
 * E-01 (v1.0.6) 바인딩 AC — Section 7 필수 포함.
 *
 * C-3 예외: Storybook story이므로 fixture 데이터 허용.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { createColumnHelper } from '@tanstack/react-table';
import { RangeSelectGrid } from './RangeSelectGrid';

interface SampleRow {
  id: number;
  name: string;
  score: number;
  grade: string;
}

const columnHelper = createColumnHelper<SampleRow>();

const columns = [
  columnHelper.accessor('id', {
    header: 'ID',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('name', {
    header: '이름',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('score', {
    header: '점수',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('grade', {
    header: '등급',
    cell: (info) => info.getValue(),
  }),
];

const sampleData: SampleRow[] = [
  { id: 1, name: '홍길동', score: 95, grade: 'A' },
  { id: 2, name: '김철수', score: 82, grade: 'B' },
  { id: 3, name: '이영희', score: 78, grade: 'C' },
  { id: 4, name: '박민준', score: 91, grade: 'A' },
  { id: 5, name: '최수아', score: 67, grade: 'D' },
];

const meta: Meta<typeof RangeSelectGrid<SampleRow>> = {
  title: 'grid-pro-range/RangeSelectGrid',
  component: RangeSelectGrid,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '마우스 드래그 또는 Shift+Click으로 셀 범위를 선택합니다. ' +
          '선택된 셀은 `bg-blue-100 ring-1 ring-blue-400` 스타일로 하이라이트됩니다.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RangeSelectGrid<SampleRow>>;

/**
 * 기본 스토리: 마우스 드래그로 셀 범위 선택.
 *
 * 사용 방법:
 * 1. 셀을 클릭하고 드래그하여 범위 선택
 * 2. Shift+Click으로 기존 범위 확장
 * 3. Actions 탭에서 onRangeChange 콜백 확인
 */
export const Default: Story = {
  args: {
    data: sampleData,
    columns,
    onRangeChange: (range) => {
      console.log('Range changed:', range);
    },
  },
};

/** 로딩 상태 */
export const Loading: Story = {
  args: {
    data: [],
    columns,
    loading: true,
  },
};

/** 빈 데이터 */
export const Empty: Story = {
  args: {
    data: [],
    columns,
    emptyText: '표시할 데이터가 없습니다.',
  },
};

/** 대용량 데이터 (1000행 — C-10/C-18 가상화 호환성 검증용) */
const largeData: SampleRow[] = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  name: `사용자 ${i + 1}`,
  score: Math.floor(Math.random() * 100),
  grade: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)] ?? 'A',
}));

export const LargeDataset: Story = {
  args: {
    data: largeData,
    columns,
    className: 'h-96 overflow-y-auto',
    onRangeChange: (range) => {
      console.log('Large dataset range:', range);
    },
  },
};
