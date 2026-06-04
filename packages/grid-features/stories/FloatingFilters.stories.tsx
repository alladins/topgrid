// MOD-GRID-30 G-1: floating filters — chromium gate. Composition story: grid-core <Grid>
// renderFloatingFilter slot + grid-features floating inputs. Verifies (a) input → rows filter,
// (b) ARIA: floating row counts as a header row (aria-rowcount/rowindex shift) + axe clean,
// (c) shared-state with the popover filter (same column.setFilterValue), (d) column-virt alignment.
// C-3 예외: mock 데이터는 Storybook/test 에서만 허용.
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid, createColumns } from '@topgrid/grid-core';
import {
  TextFilter,
  textFilterFn,
  numberFilterFn,
  TextFloatingFilter,
  NumberFloatingFilter,
} from '@topgrid/grid-features';

interface Person {
  name: string;
  city: string;
  score: number;
}

const data: Person[] = [
  { name: '김철수', city: '서울', score: 90 },
  { name: '이영희', city: '부산', score: 78 },
  { name: '박민준', city: '서울', score: 88 },
  { name: '최지우', city: '대구', score: 95 },
  { name: '정해인', city: '부산', score: 62 },
  { name: '강수진', city: '서울', score: 81 },
];

const columns: ColumnDef<Person>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        이름 <TextFilter column={column} />
      </span>
    ),
    size: 200,
    filterFn: textFilterFn,
  },
  { accessorKey: 'city', header: '도시', size: 160, filterFn: textFilterFn },
  { accessorKey: 'score', header: '점수', size: 140, filterFn: numberFilterFn },
];

const meta: Meta = { title: 'filter-ui/FloatingFilters' };
export default meta;

// always-visible filter row: text on name/city, number(=) on score. 'name' also has a popover
// TextFilter in its header → shared-state target.
export const Default: StoryObj = {
  name: 'floating 필터 (텍스트+숫자, popover 공유)',
  render: () => (
    <Grid<Person>
      columns={columns}
      data={data}
      enableFilter
      renderFloatingFilter={(column) => {
        const labels: Record<string, string> = { name: '이름', city: '도시', score: '점수' };
        return column.id === 'score' ? (
          <NumberFloatingFilter column={column} label={labels[column.id]} />
        ) : (
          <TextFloatingFilter column={column} label={labels[column.id]} />
        );
      }}
    />
  ),
};

// ── column virtualization composition ──────────────────────────────────────
interface WideRow {
  [colId: string]: string;
}
const COL_COUNT = 22;
const wideDefs = Array.from({ length: COL_COUNT }, (_, i) => {
  const id = `c${String(i).padStart(2, '0')}`;
  return { id, name: id.toUpperCase(), type: 'text', width: '140' };
});
const wideColumns = createColumns<WideRow>(wideDefs);
const wideRows: WideRow[] = Array.from({ length: 10 }, (_, r) => {
  const row: WideRow = {};
  for (let i = 0; i < COL_COUNT; i++) row[`c${String(i).padStart(2, '0')}`] = `r${r}-c${i}`;
  return row;
});

// floating row must go through the SAME column window as the header — filter cells align with their
// header columns under virtualization (else they drift the moment the flag is on).
export const ColumnVirtualized: StoryObj = {
  name: 'floating + 컬럼 가상화 (정렬)',
  decorators: [
    (Story) => (
      <div style={{ width: 600 }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <Grid<WideRow>
      columns={wideColumns}
      data={wideRows}
      enableColumnPinning
      defaultColumnPinning={{ left: ['c00'], right: ['c21'] }}
      enableColumnVirtualization
      renderFloatingFilter={(column) => <TextFloatingFilter column={column} />}
    />
  ),
};
