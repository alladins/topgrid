// MOD-GRID-31 G-1: pivot 결과 정렬 — chromium gate. ★2-row-dimension config 필수: subtotal 은 행차원
// ≥2 에서만 존재하고, "정렬 후 subtotal 이 자기 그룹에 앵커"가 핵심 주장(단일 행차원=vacuous).
// C-3 예외: mock 데이터는 Storybook/test 에서만 허용.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PivotGrid } from '@topgrid/grid-pro-pivot';
import type { PivotConfig } from '@topgrid/grid-pro-pivot';
import { setLicenseState } from '@topgrid/grid-license';
import { useViewStatePersistence } from '@topgrid/grid-core';

interface SalesRow {
  region: string;
  city?: string;
  year?: string;
  quarter?: string;
  sales: number;
}

// region(East/West) × city — East: NY(300=100+200), Boston(90=30+60); West: LA(160).
const data: SalesRow[] = [
  { region: 'East', city: 'NY', sales: 100 },
  { region: 'East', city: 'NY', sales: 200 },
  { region: 'East', city: 'Boston', sales: 30 },
  { region: 'East', city: 'Boston', sales: 60 },
  { region: 'West', city: 'LA', sales: 70 },
  { region: 'West', city: 'LA', sales: 90 },
];

// region×city (2 row dims) × quarter (column dim) → NESTED value headers (Q1__0, Q2__0).
// East/NY: Q1=100; East/Boston: Q1=30 → sorting the Q1 nested header reorders within East.
const colDimData: SalesRow[] = [
  { region: 'East', city: 'NY', quarter: 'Q1', sales: 100 },
  { region: 'East', city: 'NY', quarter: 'Q2', sales: 50 },
  { region: 'East', city: 'Boston', quarter: 'Q1', sales: 30 },
  { region: 'East', city: 'Boston', quarter: 'Q2', sales: 200 },
  { region: 'West', city: 'LA', quarter: 'Q1', sales: 70 },
  { region: 'West', city: 'LA', quarter: 'Q2', sales: 90 },
];

const meta: Meta = { title: 'grid-pro-pivot/Interaction' };
export default meta;

const validLicense = { status: { valid: true as const }, rawKey: 'test', setAt: 0 };

// 2 row dims + sortable value header. KEY '__0' (no column dims → '' combo).
export const Sort: StoryObj = {
  name: 'pivot 값 정렬 (그룹 내, subtotal 앵커)',
  beforeEach: () => {
    setLicenseState(validLicense);
  },
  render: () => (
    <PivotGrid<SalesRow>
      data={data}
      config={{ rows: ['region', 'city'], columns: [], values: [{ field: 'sales', aggregationFn: 'sum' }] }}
      enableSort
    />
  ),
};

// G-2 + composition: collapse (subtotal toggle) AND sort, both active, so the chromium test can
// assert collapse(sort(rows)) — that collapse hides a group's data while sort still applies to the
// survivors (re-expand shows them still sorted).
export const SortCollapse: StoryObj = {
  name: 'collapse + sort 합성',
  beforeEach: () => {
    setLicenseState(validLicense);
  },
  render: () => (
    <PivotGrid<SalesRow>
      data={data}
      config={{ rows: ['region', 'city'], columns: [], values: [{ field: 'sales', aggregationFn: 'sum' }] }}
      enableSort
      enableCollapse
    />
  ),
};

// G-3: runtime config controls (transpose + pivotMode toggle). ★ transpose re-runs computePivot →
// __id reassigned → collapse/sort state must reset (else stale ids hide the wrong group).
// onConfigChange 페이로드를 DOM 에 노출(export 검증) — notify-only 콜백이 전치된 config 로 실제 발화하는지.
function ConfigControlsDemo(): JSX.Element {
  const [notifiedRows, setNotifiedRows] = useState<string>('none');
  return (
    <>
      <div data-testid="cfg-notify">{notifiedRows}</div>
      <PivotGrid<SalesRow>
        data={data}
        config={{ rows: ['region', 'city'], columns: [], values: [{ field: 'sales', aggregationFn: 'sum' }] }}
        enableSort
        enableCollapse
        enableConfigControls
        onConfigChange={(c: PivotConfig) => setNotifiedRows(JSON.stringify(c.rows))}
        passthroughColumns={[
          { accessorKey: 'region', header: 'region' },
          { accessorKey: 'city', header: 'city' },
          { accessorKey: 'sales', header: 'sales' },
        ]}
      />
    </>
  );
}

export const ConfigControls: StoryObj = {
  name: 'runtime config (전치 + 토글)',
  beforeEach: () => {
    setLicenseState(validLicense);
  },
  render: () => <ConfigControlsDemo />,
};

// MOD-GRID-53 G-2: collapsible pivot COLUMN groups. ★≥2 column dims (year × quarter) so there is a
// collapsible group; unequal child row counts (2024 Q1=1 row, Q2=3 rows) so the collapsed group AVG
// (=17.5) ≠ avg-of-child-avgs (=15) — the number is proven in node, here we gate render divergence.
const colCollapseData: SalesRow[] = [
  { region: 'East', year: '2024', quarter: 'Q1', sales: 10 },
  { region: 'East', year: '2024', quarter: 'Q2', sales: 20 },
  { region: 'East', year: '2024', quarter: 'Q2', sales: 20 },
  { region: 'East', year: '2024', quarter: 'Q2', sales: 20 },
  { region: 'East', year: '2023', quarter: 'Q4', sales: 100 },
];
const colCollapseConfig: PivotConfig = {
  rows: ['region'],
  columns: ['year', 'quarter'],
  values: [{ field: 'sales', aggregationFn: 'avg' }],
};

export const ColumnCollapse: StoryObj = {
  name: '컬럼 그룹 collapse (자식 숨김 + 그룹 집계)',
  beforeEach: () => {
    setLicenseState(validLicense);
  },
  render: () => (
    <PivotGrid<SalesRow> data={colCollapseData} config={colCollapseConfig} enableColumnCollapse />
  ),
};

// OFF: enableColumnCollapse 미지정 → chevron 0, 전체 자식 leaf 렌더(byte-identical 경로).
export const ColumnCollapseOff: StoryObj = {
  name: '컬럼 그룹 collapse OFF (byte-identical)',
  beforeEach: () => {
    setLicenseState(validLicense);
  },
  render: () => <PivotGrid<SalesRow> data={colCollapseData} config={colCollapseConfig} />,
};

// MOD-GRID-60: pivot state save/restore (useViewStatePersistence). ★non-vacuous: transpose mutates
// config (rows↔columns) → persisted; after a REMOUNT the transposed config is restored (without
// persistence the remount resets to the initial rows). pivot-rows reflects the PERSISTED config.
function PersistedPivot(): JSX.Element {
  const [config, setConfig] = useViewStatePersistence<PivotConfig>({
    storageKey: 'mod60-pivot-config',
    initial: { rows: ['region'], columns: ['quarter'], values: [{ field: 'sales', aggregationFn: 'sum' }] },
  });
  return (
    <div>
      <div data-testid="pivot-rows">{config.rows.join(',')}</div>
      <PivotGrid<SalesRow>
        data={colDimData}
        config={config}
        enableConfigControls
        onConfigChange={setConfig}
        passthroughColumns={[
          { accessorKey: 'region', header: 'region' },
          { accessorKey: 'quarter', header: 'quarter' },
          { accessorKey: 'sales', header: 'sales' },
        ]}
      />
    </div>
  );
}

function PivotConfigPersistDemo(): JSX.Element {
  const [k, setK] = useState(0);
  return (
    <div>
      <button type="button" data-testid="remount" onClick={() => setK((n) => n + 1)}>
        remount
      </button>
      <PersistedPivot key={k} />
    </div>
  );
}

export const PivotConfigPersist: StoryObj = {
  name: 'pivot 상태 저장/복원',
  beforeEach: () => {
    setLicenseState(validLicense);
  },
  render: () => <PivotConfigPersistDemo />,
};

// nested-column path: column dim → value headers built via mapColumnNode recursion (the path the
// no-column story never exercises). Sorting the Q1 nested header sorts within-group by the Q1 cell.
export const SortNestedColumns: StoryObj = {
  name: 'pivot nested-column 값 정렬',
  beforeEach: () => {
    setLicenseState(validLicense);
  },
  render: () => (
    <PivotGrid<SalesRow>
      data={colDimData}
      config={{ rows: ['region', 'city'], columns: ['quarter'], values: [{ field: 'sales', aggregationFn: 'sum' }] }}
      enableSort
    />
  ),
};
