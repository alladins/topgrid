// MOD-GRID-30 G-2: set/faceted filter wiring — chromium gate. ★LESS-006: the story MUST route
// through grid-core <Grid> and supply NO faceted models (there's no prop to). The existing
// SelectFilter.stories hand-wires getFacetedRowModel/getFacetedUniqueValues into a raw useReactTable
// → it would pass even if grid-core's wiring were absent (vacuous). Here, the ONLY path to facets is
// buildTableOptions' wiring, so a populated list with counts can only come from it.
// C-3 예외: mock 데이터는 Storybook/test 에서만 허용.
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid } from '@topgrid/grid-core';
import { SelectFilter, selectFilterFn } from '@topgrid/grid-features';

interface Person {
  name: string;
  city: string;
  score: number;
}

// city facets: 서울×3 (김철수·박민준·강수진), 부산×2 (이영희·정해인), 대구×1 (최지우).
const data: Person[] = [
  { name: '김철수', city: '서울', score: 90 },
  { name: '이영희', city: '부산', score: 78 },
  { name: '박민준', city: '서울', score: 88 },
  { name: '최지우', city: '대구', score: 95 },
  { name: '정해인', city: '부산', score: 62 },
  { name: '강수진', city: '서울', score: 81 },
];

const columns: ColumnDef<Person>[] = [
  { accessorKey: 'name', header: '이름', size: 160 },
  {
    accessorKey: 'city',
    header: ({ column }) => <SelectFilter column={column} />,
    size: 180,
    filterFn: selectFilterFn,
  },
  { accessorKey: 'score', header: '점수', size: 120 },
];

const meta: Meta = { title: 'filter-ui/SetFilterOOTB' };
export default meta;

// <Grid enableFilter> only — NO faceted models supplied. SelectFilter's distinct-value list +
// counts must populate purely from grid-core's buildTableOptions faceted wiring.
export const Default: StoryObj = {
  name: 'SelectFilter OOTB (faceted 자동 wiring)',
  render: () => <Grid<Person> columns={columns} data={data} enableFilter />,
};
