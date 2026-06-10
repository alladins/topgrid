// spec G-002 Section 7 #4 / Step 4
// C-3 예외: mock 데이터는 Storybook stories 및 unit tests에서만 허용 (D7 결정, ADR-006)
// AC-001: Grid, GridPagination, PageSizeSelect, TotalCount, ColumnVisibilityMenu 커버
import type { Meta, StoryObj } from '@storybook/react';
import {
  Grid,
  PageSizeSelect,
  TotalCount,
  createColumns,
} from '@topgrid/grid-core';
// Note: GridPagination is demonstrated via Grid's enablePagination=true prop (WithPaginationAndSort story)
// ColumnVisibilityMenu is demonstrated via Grid's columnPersistence prop (ColumnVisibilityMenuStory)

// C-3 예외: mock 데이터는 Storybook stories 및 unit tests에서만 허용 (D7 결정)
interface MockRow {
  id: number;
  name: string;
  dept: string;
  role: string;
  status: string;
}

const mockData: MockRow[] = [
  { id: 1, name: '홍길동', dept: '개발팀', role: '팀장', status: '재직' },
  { id: 2, name: '김영희', dept: '기획팀', role: '팀원', status: '재직' },
  { id: 3, name: '이철수', dept: '영업팀', role: '팀장', status: '재직' },
  { id: 4, name: '박민지', dept: '개발팀', role: '팀원', status: '휴직' },
  { id: 5, name: '최준호', dept: '기획팀', role: '팀원', status: '재직' },
];

const columns = createColumns<MockRow>([
  { id: 'id', name: 'ID', type: 'number' },
  { id: 'name', name: '이름', type: 'text' },
  { id: 'dept', name: '부서', type: 'text' },
  { id: 'role', name: '역할', type: 'text' },
  { id: 'status', name: '상태', type: 'text' },
]);

// ─── Grid ───────────────────────────────────────────────────────────────────
const gridMeta: Meta<typeof Grid> = {
  title: 'grid-core/Grid',
  component: Grid,
  tags: ['autodocs'],
};
export default gridMeta;
type GridStory = StoryObj<typeof Grid>;

export const Default: GridStory = {
  name: '기본 Grid',
  args: {
    columns,
    data: mockData,
  },
};

export const WithSort: GridStory = {
  name: '정렬 활성',
  args: {
    columns,
    data: mockData,
    enableSort: true,
  },
};

export const WithPaginationAndSort: GridStory = {
  name: '페이지네이션 + 정렬',
  args: {
    columns,
    data: mockData,
    enableSort: true,
    enablePagination: true,
    pagination: { pageSize: 3 },
  },
};

export const WithRowSelectionMulti: GridStory = {
  name: '다중 행 선택',
  args: {
    columns,
    data: mockData,
    rowSelection: 'multi',
  },
};

// ─── PageSizeSelect ──────────────────────────────────────────────────────────
// PageSizeSelectProps: pageSize, pageSizeOptions, onPageSizeChange
export const PageSizeSelectStory: StoryObj<typeof PageSizeSelect> = {
  name: 'PageSizeSelect (standalone)',
  render: () => (
    <div className="p-4">
      <PageSizeSelect
        pageSize={20}
        pageSizeOptions={[10, 20, 50, 100]}
        onPageSizeChange={(_size: number) => undefined}
      />
    </div>
  ),
};

// ─── TotalCount ──────────────────────────────────────────────────────────────
// TotalCountProps: total (전체 row 수)
export const TotalCountStory: StoryObj<typeof TotalCount> = {
  name: 'TotalCount (standalone)',
  render: () => (
    <div className="p-4 flex gap-4">
      <TotalCount total={142} />
      <TotalCount total={0} />
      <TotalCount total={10000} />
    </div>
  ),
};

// ─── GridPagination (Grid 통합) ───────────────────────────────────────────────
// GridPagination은 enablePagination=true 로 Grid 내부에서 자동 렌더됩니다
// 아래 WithPaginationAndSort 스토리에서 통합 동작을 확인하세요.

// ─── ColumnVisibilityMenu ────────────────────────────────────────────────────
export const ColumnVisibilityMenuStory: StoryObj<typeof Grid> = {
  name: 'ColumnVisibilityMenu (Grid 통합)',
  args: {
    columns,
    data: mockData,
    // columnPersistence: storageKey 제공 시 ColumnVisibilityMenu 자동 렌더 (Grid.tsx L514)
    // storageKey: '' → no-op (localStorage 접근 없음, 테스트 환경 안전)
    columnPersistence: { storageKey: '' },
  },
};
