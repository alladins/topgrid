// MOD-GRID-75: chart cross-filtering — chromium gate. Composition story wiring the SHIPPED pieces:
//   RangeChart.onSelectCategory (grid-pro-chart) → selectionsToFilter (grid-pro-filter) →
//   makeAdvancedFilterFn → grid-core <Grid> data filter, + linked highlight (selectedCategory).
// Clicking a region bar filters the grid to that region AND dims the other bars.
// C-3 예외: mock 데이터는 Storybook/test 에서만 허용.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid } from '@topgrid/grid-core';
import { setLicenseState } from '@topgrid/grid-license';
import { RangeChart } from '@topgrid/grid-pro-chart';
import { selectionsToFilter, makeAdvancedFilterFn } from '@topgrid/grid-pro-filter';

interface Person {
  name: string;
  region: string;
}

// North×3, South×2, East×1.
const data: Person[] = [
  { name: '김철수', region: 'North' },
  { name: '이영희', region: 'North' },
  { name: '박민준', region: 'North' },
  { name: '최지우', region: 'South' },
  { name: '정해인', region: 'South' },
  { name: '강수진', region: 'East' },
];

const categories = ['North', 'South', 'East'];
const counts = categories.map((c) => data.filter((p) => p.region === c).length);

const columns: ColumnDef<Person>[] = [
  { accessorKey: 'name', header: '이름', size: 160 },
  { accessorKey: 'region', header: '지역', size: 120 },
];

function CrossFilterDemo(): JSX.Element {
  const [selected, setSelected] = useState<number | null>(null);

  // chart selection → filter expr → predicate → filtered grid data (the SHIPPED wiring path).
  const shown =
    selected == null
      ? data
      : data.filter(
          makeAdvancedFilterFn(
            selectionsToFilter([{ field: 'region', type: 'text', value: categories[selected]! }]),
          ) as (p: Person) => boolean,
        );

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      <RangeChart
        series={[{ name: '건수', values: counts }]}
        categories={categories}
        type="bar"
        onSelectCategory={(i) => setSelected((prev) => (prev === i ? null : i))}
        selectedCategory={selected}
        ariaLabel="region counts"
      />
      <div data-testid="linked-grid">
        <Grid<Person> columns={columns} data={shown} />
      </div>
    </div>
  );
}

const meta: Meta = { title: 'Pro/CrossFilter' };
export default meta;

export const Default: StoryObj = {
  name: '차트 cross-filter (bar 클릭 → grid 필터 + linked highlight)',
  beforeEach: () => {
    setLicenseState({ status: { valid: true as const }, rawKey: 'test', setAt: 0 });
  },
  render: () => <CrossFilterDemo />,
};
