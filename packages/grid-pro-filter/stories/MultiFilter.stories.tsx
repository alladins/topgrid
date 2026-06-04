// MOD-GRID-30 G-3: multi-condition (AND/OR) filter — chromium gate. Composition story:
// grid-core <Grid> + grid-pro-filter MultiFilter + multi*FilterFn. Default story injects a VALID
// license (builder works); the Unlicensed story forces an invalid license → PAT-003 watermark.
// C-3 예외: mock 데이터는 Storybook/test 에서만 허용.
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid } from '@topgrid/grid-core';
import { setLicenseState } from '@topgrid/grid-license';
import { MultiFilter, multiTextFilterFn, multiNumberFilterFn } from '@topgrid/grid-pro-filter';

interface Person {
  name: string;
  score: number;
}

// scores: 90,78,88,95,62,81. names contain 김/이/박/최/정/강.
const data: Person[] = [
  { name: '김철수', score: 90 },
  { name: '이영희', score: 78 },
  { name: '박민준', score: 88 },
  { name: '최지우', score: 95 },
  { name: '정해인', score: 62 },
  { name: '강수진', score: 81 },
];

const columns: ColumnDef<Person>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
        이름 <MultiFilter column={column} variant="text" />
      </span>
    ),
    filterFn: multiTextFilterFn,
    size: 220,
  },
  {
    accessorKey: 'score',
    header: ({ column }) => (
      <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
        점수 <MultiFilter column={column} variant="number" />
      </span>
    ),
    filterFn: multiNumberFilterFn,
    size: 200,
  },
];

const meta: Meta = { title: 'Pro/MultiFilter' };
export default meta;

const validLicense = { status: { valid: true as const }, rawKey: 'test', setAt: 0 };
const invalidLicense = { status: { valid: false as const, reason: 'invalid' as const }, rawKey: '', setAt: 0 };

export const Default: StoryObj = {
  name: '복합 필터 (AND/OR, 유효 라이선스)',
  beforeEach: () => {
    setLicenseState(validLicense);
  },
  render: () => <Grid<Person> columns={columns} data={data} enableFilter />,
};

export const Unlicensed: StoryObj = {
  name: '무라이선스 → watermark',
  beforeEach: () => {
    setLicenseState(invalidLicense);
  },
  render: () => <Grid<Person> columns={columns} data={data} enableFilter />,
};
