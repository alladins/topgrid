/**
 * @topgrid/grid-pro-range — RangeSelectGrid Storybook 스토리 (G-006, AC-008).
 *
 * Story (a): FullFeature — 5 hook 모두 활성화 (20행).
 * Story (b): VirtualizationLargeDataset — 1000행+ 가상화 + Drag-fill.
 *
 * C-3 예외: Storybook story이므로 fixture 데이터 허용.
 * C-5: Tailwind 클래스 사용 (story 허용 범위).
 * C-18: 1000행 가상화 검증 (AC-002).
 */
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { createColumnHelper } from '@tanstack/react-table';

import { RangeSelectGrid } from './RangeSelectGrid';
import type { RangeSelectGridAllProps, CellUpdate, CellCoord } from './types';

// ─── 샘플 데이터 타입 ──────────────────────────────────────────────────────────

interface SampleRow {
  id: string;
  name: string;
  department: string;
  value: number;
  status: string;
}

// ─── 컬럼 정의 ────────────────────────────────────────────────────────────────

const columnHelper = createColumnHelper<SampleRow>();

const sampleColumns = [
  columnHelper.accessor('id',         { header: 'ID' }),
  columnHelper.accessor('name',       { header: '이름' }),
  columnHelper.accessor('department', { header: '부서' }),
  columnHelper.accessor('value',      { header: '값' }),
  columnHelper.accessor('status',     { header: '상태' }),
];

const colKeys: (keyof SampleRow)[] = ['id', 'name', 'department', 'value', 'status'];

// ─── 20행 샘플 데이터 ─────────────────────────────────────────────────────────

const DEPARTMENTS = ['개발팀', '영업팀', '기획팀', '디자인팀', '인사팀'];

const sampleData20Rows: SampleRow[] = Array.from({ length: 20 }, (_, i) => ({
  id:         String(i + 1),
  name:       `홍길동 ${i + 1}`,
  department: DEPARTMENTS[i % DEPARTMENTS.length],
  value:      (i + 1) * 100,
  status:     i % 3 === 0 ? 'inactive' : 'active',
}));

// ─── 1000행 생성 helper ────────────────────────────────────────────────────────

function generate1000Rows(): SampleRow[] {
  return Array.from({ length: 1000 }, (_, i) => ({
    id:         String(i + 1),
    name:       `사용자 ${i + 1}`,
    department: DEPARTMENTS[i % DEPARTMENTS.length],
    value:      Math.round(Math.random() * 10000),
    status:     i % 4 === 0 ? 'inactive' : 'active',
  }));
}

// 1000행 데이터는 한 번만 생성 (story 렌더마다 재생성 방지)
const largeDataset = generate1000Rows();

// ─── getCellValue helpers ─────────────────────────────────────────────────────

function getCellValueForData(
  data: SampleRow[],
): (row: number, col: number) => string | number {
  return (row: number, col: number) => {
    const key = colKeys[col];
    return key !== undefined ? (data[row]?.[key] ?? '') : '';
  };
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<RangeSelectGridAllProps<SampleRow, string | number>> = {
  title: 'grid-pro-range/RangeSelectGrid',
  component: RangeSelectGrid,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'G-006 Capstone: 5-hook 완전 통합 그리드 (useCellRange + useKeyboardNav + DragFillHandle + useClipboard + useKeyboardEdit). enable* prop으로 기능 온/오프.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<RangeSelectGridAllProps<SampleRow, string | number>>;

// ─── Story (a): FullFeature — 전체 기능 통합 ──────────────────────────────────

/**
 * 5개 hook 모두 활성화. 20행 샘플.
 *
 * 검증 시나리오:
 * 1. 마우스 드래그 → 범위 선택 (파란색 하이라이트)
 * 2. Ctrl+Arrow → 데이터 경계 이동
 * 3. Drag-fill 핸들 드래그 → onFillComplete 콘솔 로그
 * 4. Ctrl+C → 클립보드 복사
 * 5. Delete → onDeleteRange 콘솔 로그
 * 6. 문자 타이핑 → onBulkEdit 콘솔 로그
 */
export const FullFeature: Story = {
  name: 'FullFeature — 5 Hook 통합',
  args: {
    data:                sampleData20Rows,
    columns:             sampleColumns,
    enableRangeSelection: true,
    enableKeyboardNav:   true,
    enableDragFill:      true,
    enableClipboard:     true,
    enableKeyboardEdit:  true,
    enableVirtualization: false,
    getCellValue:        getCellValueForData(sampleData20Rows),
    onFillComplete:      (cells: CellUpdate<string | number>[]) =>
      console.log('fill:', cells),
    onPaste:             (cells: CellUpdate<string | number>[]) =>
      console.log('paste:', cells),
    onDeleteRange:       (cells: CellCoord[]) =>
      console.log('delete:', cells),
    onBulkEdit:          (cells: CellCoord[], value: string | number) =>
      console.log('bulkEdit:', cells, value),
    onEditStart:         (cell: CellCoord, init?: string | number) =>
      console.log('editStart:', cell, init),
    onRangeChange:       (range) => console.log('rangeChange:', range),
  },
};

// ─── Story (b): VirtualizationLargeDataset — 1000행+ 가상화 ──────────────────

/**
 * 1000행 가상화 + Drag-fill. containerRef scroll element에 고정 높이 필요.
 *
 * 검증 시나리오:
 * 1. 스크롤 → 가상화된 row만 DOM 존재 (DevTools 확인)
 * 2. 마우스 드래그 범위 선택 → 스크롤 후에도 range 유지
 * 3. Drag-fill 핸들 → onFillComplete 호출 (EC-007 getCellRect miss 시 graceful)
 * 4. 1000행 렌더 성능: First Contentful Paint ≤ 500ms (목표 지표)
 */
export const VirtualizationLargeDataset: Story = {
  name: 'VirtualizationLargeDataset — 1000행 가상화',
  args: {
    data:                largeDataset,
    columns:             sampleColumns,
    enableRangeSelection: true,
    enableKeyboardNav:   true,
    enableDragFill:      true,
    enableVirtualization: true,
    getCellValue:        getCellValueForData(largeDataset),
    onFillComplete:      (cells: CellUpdate<string | number>[]) =>
      console.log('fill:', cells.length, 'cells'),
    onRangeChange:       (range) => console.log('rangeChange:', range),
  },
  decorators: [
    (Story) => (
      // enableVirtualization 시 containerRef scroll element에 고정 높이 필요
      <div style={{ height: '600px', overflow: 'auto' }}>
        <Story />
      </div>
    ),
  ],
};
