// MOD-GRID-76: chart cross-filtering via the grid's ACTUAL filter model — chromium gate.
// Real setFilter wiring (not data-prop pre-filter): a raw useReactTable holds ALL rows + a controlled
// globalFilter; the chart's onSelectCategory calls table.setGlobalFilter(selectionsToFilter(...)) and
// the grid filters INTERNALLY via getFilteredRowModel (advancedGlobalFilterFn evaluates the expr).
// Same raw-table globalFilter structure as the ✅ global-search feature. + linked highlight.
// C-3 예외: mock 데이터는 Storybook/test 에서만 허용.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';
import { setLicenseState } from '@topgrid/grid-license';
import { RangeChart } from '@topgrid/grid-pro-chart';
import { selectionsToFilter, advancedGlobalFilterFn } from '@topgrid/grid-pro-filter';

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

const ch = createColumnHelper<Person>();
const columns = [ch.accessor('name', { header: '이름' }), ch.accessor('region', { header: '지역' })];

function CrossFilterDemo(): JSX.Element {
  const [selected, setSelected] = useState<number | null>(null);

  // The TABLE owns the filter state (globalFilter); it filters internally via getFilteredRowModel.
  const table = useReactTable({
    data,
    columns,
    globalFilterFn: advancedGlobalFilterFn,
    getColumnCanGlobalFilter: () => true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // chart selection → grid's actual filter model (setGlobalFilter), toggling off on re-click.
  const onSelectCategory = (i: number): void => {
    const next = selected === i ? null : i;
    setSelected(next);
    table.setGlobalFilter(
      next == null
        ? undefined
        : selectionsToFilter([{ field: 'region', type: 'text', value: categories[i]! }]),
    );
  };

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      <RangeChart
        series={[{ name: '건수', values: counts }]}
        categories={categories}
        type="bar"
        onSelectCategory={onSelectCategory}
        selectedCategory={selected}
        ariaLabel="region counts"
      />
      <div data-testid="linked-grid">
        <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} style={{ border: '1px solid #ddd', padding: '2px 8px', textAlign: 'left' }}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {/* rows come from getFilteredRowModel via getRowModel — the grid filtered them, not the parent. */}
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} data-row="">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} style={{ border: '1px solid #eee', padding: '2px 8px' }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: 11, color: '#888' }} data-testid="filtered-count">
          {table.getFilteredRowModel().rows.length} / {data.length} rows
        </p>
      </div>
    </div>
  );
}

const meta: Meta = { title: 'Pro/CrossFilter' };
export default meta;

export const Default: StoryObj = {
  name: '차트 cross-filter (bar 클릭 → grid 내부 setFilter + linked highlight)',
  beforeEach: () => {
    setLicenseState({ status: { valid: true as const }, rawKey: 'test', setAt: 0 });
  },
  render: () => <CrossFilterDemo />,
};
