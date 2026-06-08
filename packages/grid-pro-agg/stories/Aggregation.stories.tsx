// spec G-002 Section 7 #14 / Step 8
// AC-004: AggregationGrid + GroupPanel story (AC-004)
// C-3 예외: mock rows 데이터는 Storybook stories에서만 허용 (D7 결정, ADR-006)
// C-1 준수: AggregationGridProps + GroupPanelProps 소스 확인
//   - AggregationGrid: { data, columns (AggregationColumnDef[]), enableAggregation?, grouping?, expanded? }
//   - GroupPanel: { grouping, columns (Column<T,unknown>[]), onGroupingChange, emptyText? }
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  getCoreRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  useReactTable,
  type ExpandedState,
} from '@tanstack/react-table';
import {
  AggregationGrid,
  GroupPanel,
} from '@topgrid/grid-pro-agg';
import type { AggregationColumnDef } from '@topgrid/grid-pro-agg';
import { setLicenseState } from '@topgrid/grid-license';
import { useViewStatePersistence } from '@topgrid/grid-core';

// C-3 예외: mock rows — Storybook stories 허용 범위
interface SalesRow {
  id: number;
  dept: string;
  team: string;
  employee: string;
  revenue: number;
  cost: number;
}

const mockSalesData: SalesRow[] = [
  { id: 1, dept: '영업팀', team: '1팀', employee: '홍길동', revenue: 8000000, cost: 3000000 },
  { id: 2, dept: '영업팀', team: '1팀', employee: '김영희', revenue: 6500000, cost: 2500000 },
  { id: 3, dept: '영업팀', team: '2팀', employee: '이철수', revenue: 9200000, cost: 3500000 },
  { id: 4, dept: '영업팀', team: '2팀', employee: '박민지', revenue: 7800000, cost: 2800000 },
  { id: 5, dept: '개발팀', team: '1팀', employee: '최준호', revenue: 5000000, cost: 1500000 },
  { id: 6, dept: '개발팀', team: '1팀', employee: '정수빈', revenue: 4800000, cost: 1400000 },
  { id: 7, dept: '개발팀', team: '2팀', employee: '윤재원', revenue: 5200000, cost: 1600000 },
];

// AggregationColumnDef = ColumnDef + { meta?: { aggregationFn?: AggregationFnKey } }
const aggColumns: AggregationColumnDef<SalesRow>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'dept', header: '부서' },
  { accessorKey: 'team', header: '팀' },
  { accessorKey: 'employee', header: '직원' },
  {
    accessorKey: 'revenue',
    header: '매출',
    meta: { aggregationFn: 'sum' },  // 그룹별 합산
  },
  {
    accessorKey: 'cost',
    header: '비용',
    meta: { aggregationFn: 'sum' },
  },
];

// ─── AggregationGrid ─────────────────────────────────────────────────────
const meta: Meta<typeof AggregationGrid> = {
  title: 'grid-pro-agg/AggregationGrid',
  component: AggregationGrid,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof AggregationGrid>;

export const Default: Story = {
  name: '기본 Grid (집계 비활성)',
  args: {
    data: mockSalesData,
    columns: aggColumns,
  },
};

export const WithAggregation: Story = {
  name: '부서별 집계',
  args: {
    data: mockSalesData,
    columns: aggColumns,
    enableAggregation: true,
    grouping: ['dept'],
    expanded: true,
  },
};

export const WithMultiLevelAggregation: Story = {
  name: '부서 + 팀 2단계 집계',
  args: {
    data: mockSalesData,
    columns: aggColumns,
    enableAggregation: true,
    grouping: ['dept', 'team'],
    expanded: true,
  },
};

export const WithFooter: Story = {
  name: '집계 + 푸터',
  args: {
    data: mockSalesData,
    columns: aggColumns,
    enableAggregation: true,
    grouping: ['dept'],
    showFooter: true,
    expanded: true,
  },
};

// ─── MOD-GRID-54: group-header inline aggregates (incl. when collapsed) ──────
// ★nested grouping (dept→team) + avg with UNEQUAL team row counts so the dept group's avg
// (=30, true source mean of 10,20,60) ≠ avg-of-team-avgs (=avg(15,60)=37.5). The header value
// is computed from source leaf rows via computeAggregateRow → avg-of-avgs safe; proven in chromium.
interface ScoreRow {
  dept: string;
  team: string;
  score: number;
}
const inlineAggData: ScoreRow[] = [
  { dept: '영업팀', team: '1팀', score: 10 },
  { dept: '영업팀', team: '1팀', score: 20 },
  { dept: '영업팀', team: '2팀', score: 60 },
];
const inlineAggColumns: AggregationColumnDef<ScoreRow>[] = [
  { accessorKey: 'dept', header: '부서' },
  { accessorKey: 'team', header: '팀' },
  { accessorKey: 'score', header: '점수', meta: { aggregationFn: 'avg' } },
];
const validLicense = { status: { valid: true as const }, rawKey: 'test', setAt: 0 };

// Stateful wrapper: AggregationGrid expansion is controlled (state.expanded), so uncontrolled
// collapse needs onExpandedChange→useState. Starts expanded so the chromium test can collapse 영업팀
// and assert the inline aggregate stays on the (still-rendered) group header.
function InlineAggDemo() {
  const [expanded, setExpanded] = useState<ExpandedState>(true);
  return (
    <AggregationGrid<ScoreRow>
      data={inlineAggData}
      columns={inlineAggColumns}
      enableAggregation
      grouping={['dept', 'team']}
      showGroupAggregates
      showFooter={false}
      expanded={expanded}
      onExpandedChange={setExpanded}
    />
  );
}

export const GroupHeaderAggregates: StoryObj<typeof InlineAggDemo> = {
  name: '그룹 헤더 인라인 집계 (collapsed 시에도)',
  beforeEach: () => {
    setLicenseState(validLicense);
  },
  render: () => <InlineAggDemo />,
};

// OFF: showGroupAggregates 미지정 → 그룹 헤더 = 단일 colSpan 라벨(인라인 집계 셀 0, byte-identical).
export const GroupHeaderAggregatesOff: StoryObj<typeof AggregationGrid<ScoreRow>> = {
  name: '그룹 헤더 인라인 집계 OFF (byte-identical)',
  beforeEach: () => {
    setLicenseState(validLicense);
  },
  args: {
    data: inlineAggData,
    columns: inlineAggColumns,
    enableAggregation: true,
    grouping: ['dept', 'team'],
    showFooter: false,
    expanded: true,
  },
};

// ─── MOD-GRID-56: group / hierarchy selection ───────────────────────────────
// Group checkbox selects the whole subtree (TanStack enableSubRowSelection); leaf selection rolls
// up to the group (checked when all, indeterminate when some). 영업팀=3 leaves, 개발팀=2 leaves.
interface SelRow {
  dept: string;
  name: string;
}
const selData: SelRow[] = [
  { dept: '영업팀', name: 'Alice' },
  { dept: '영업팀', name: 'Bob' },
  { dept: '영업팀', name: 'Carol' },
  { dept: '개발팀', name: 'Dan' },
  { dept: '개발팀', name: 'Eve' },
];
const selColumns: AggregationColumnDef<SelRow>[] = [
  { accessorKey: 'dept', header: '부서' },
  { accessorKey: 'name', header: '이름' },
];

function GroupSelectionDemo() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <div data-testid="sel-count">{count}</div>
      <AggregationGrid<SelRow>
        data={selData}
        columns={selColumns}
        enableAggregation
        grouping={['dept']}
        enableRowSelection
        onSelectionChange={(r) => setCount(r.length)}
        showFooter={false}
        expanded
      />
    </div>
  );
}

export const GroupSelection: StoryObj<typeof GroupSelectionDemo> = {
  name: '그룹/계층 선택',
  beforeEach: () => {
    setLicenseState(validLicense);
  },
  render: () => <GroupSelectionDemo />,
};

export const GroupSelectionOff: StoryObj<typeof AggregationGrid<SelRow>> = {
  name: '그룹 선택 OFF (byte-identical)',
  beforeEach: () => {
    setLicenseState(validLicense);
  },
  args: {
    data: selData,
    columns: selColumns,
    enableAggregation: true,
    grouping: ['dept'],
    showFooter: false,
    expanded: true,
  },
};

// ─── MOD-GRID-60: row-group state save/restore (useViewStatePersistence) ─────
// ★non-vacuous: grouping is persisted to storage; after a REMOUNT (key bump = fresh component that
// re-reads storage in its useState initializer) the grouping is restored — without persistence the
// remount would reset to []. Buttons drive the persisted setter directly (no flaky drag).
function PersistedAggGrid(): JSX.Element {
  const [grouping, setGrouping] = useViewStatePersistence<string[]>({
    storageKey: 'mod60-agg-grouping',
    initial: [],
  });
  return (
    <div>
      <button type="button" data-testid="group-dept" onClick={() => setGrouping(['dept'])}>
        group by dept
      </button>
      <div data-testid="grouping-state">{grouping.join(',')}</div>
      <AggregationGrid<SalesRow>
        data={mockSalesData}
        columns={aggColumns}
        enableAggregation
        grouping={grouping}
        onGroupingChange={setGrouping}
        expanded
      />
    </div>
  );
}

function GroupingPersistDemo(): JSX.Element {
  const [k, setK] = useState(0);
  return (
    <div>
      <button type="button" data-testid="remount" onClick={() => setK((n) => n + 1)}>
        remount
      </button>
      <PersistedAggGrid key={k} />
    </div>
  );
}

export const GroupingPersist: StoryObj = {
  name: '행 그룹 상태 저장/복원',
  beforeEach: () => {
    setLicenseState(validLicense);
  },
  render: () => <GroupingPersistDemo />,
};

// ─── GroupPanel ─────────────────────────────────────────────────────────
// GroupPanel requires TanStack Column instances — wrapper component for Storybook
function GroupPanelDemo() {
  const table = useReactTable({
    data: mockSalesData,
    columns: aggColumns,
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const visibleColumns = table.getAllLeafColumns();

  return (
    <div className="p-4">
      <p className="text-sm text-gray-600 mb-2">컬럼 칩을 드래그하여 그룹핑 설정</p>
      <GroupPanel<SalesRow>
        grouping={['dept']}
        columns={visibleColumns}
        onGroupingChange={(g) => console.log('그룹핑 변경:', g)}
        emptyText="여기에 컬럼을 끌어다 놓으세요"
      />
    </div>
  );
}

export const GroupPanelStory: StoryObj<typeof GroupPanelDemo> = {
  name: 'GroupPanel 드래그 그룹핑',
  render: () => <GroupPanelDemo />,
};

// ---------------------------------------------------------------------------
// MOD-GRID-70: sticky group headers — the group header sticks to the top of a bounded scroll
// container while its children scroll under it. Many rows per group + a short maxHeight so the
// chromium test can scroll within a group and assert the header stays pinned (computed position).
// ---------------------------------------------------------------------------
interface DeptRow {
  id: number;
  dept: string;
  employee: string;
  revenue: number;
}
const stickyData: DeptRow[] = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  dept: i < 12 ? '영업팀' : '개발팀',
  employee: `직원${i + 1}`,
  revenue: 1000000 + i * 10000,
}));
const stickyColumns: AggregationColumnDef<DeptRow>[] = [
  { accessorKey: 'dept', header: '부서' },
  { accessorKey: 'employee', header: '직원' },
  { accessorKey: 'revenue', header: '매출', meta: { aggregationFn: 'sum' } },
];

export const StickyGroupRows: StoryObj<typeof AggregationGrid<DeptRow>> = {
  name: '고정 그룹 헤더 (sticky group rows)',
  args: {
    data: stickyData,
    columns: stickyColumns,
    enableAggregation: true,
    grouping: ['dept'],
    expanded: true,
    enableStickyGroupRows: true,
    stickyGroupMaxHeight: 160,
  },
};
