// MOD-GRID-49 — pagination completeness (Track 1 browser 클러스터 1번째).
// ★behavior-gated, non-vacuous:
//  G-1 pageNumberFormat → 버튼 라벨이 포맷됨("P1") 하되 aria-label 은 원본 정수 유지.
//  G-2 enableGoToPage   → "7" 입력 시 슬라이딩 버튼으로 못 닿는 먼 페이지로 실제 점프.
//  G-3 autoPageSize     → 뷰포트 높이가 커지면 표시 행 수가 실제로 늘어남(높이→행수 발산).
// C-3 예외: mock 데이터.
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid } from '@topgrid/grid-core';

interface Row {
  id: number;
  label: string;
}

// 100 rows — 어떤 autoPageSize 결과보다 많아 항상 pagination-bounded.
const data: Row[] = Array.from({ length: 100 }, (_, i) => ({ id: i, label: `Row ${i}` }));

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'id', header: 'ID', size: 80 },
  { accessorKey: 'label', header: '라벨', size: 200 },
];

const meta: Meta = { title: 'grid-core/Grid (Pagination Complete)' };
export default meta;

// G-1: page-number formatter. 10 pages (pageSize 10), 포맷 = "P{n}".
export const PageNumberFormat: StoryObj = {
  name: 'G-1 페이지 번호 포매터',
  render: () => (
    <Grid<Row>
      columns={columns}
      data={data}
      enablePagination
      pagination={{ pageSize: 10, pageNumberFormat: (n) => `P${n}` }}
    />
  ),
};

// G-2: go-to-page 입력. 10 pages — 먼 페이지(7)로 점프.
export const GoToPage: StoryObj = {
  name: 'G-2 go-to-page 입력',
  render: () => (
    <Grid<Row>
      columns={columns}
      data={data}
      enablePagination
      pagination={{ pageSize: 10, enableGoToPage: true }}
    />
  ),
};

// G-3: auto-page-size. 부모 wrapper(280px) 가 뷰포트 정의 → 컨테이너 height:100% 측정.
// 테스트가 wrapper 높이를 키우면 ResizeObserver → pageSize 증가 → 행 수 증가.
export const AutoPageSize: StoryObj = {
  name: 'G-3 auto-page-size',
  render: () => (
    <div id="ap-viewport" style={{ height: 280 }}>
      <Grid<Row>
        columns={columns}
        data={data}
        enablePagination
        pagination={{ autoPageSize: true }}
      />
    </div>
  ),
};
