/**
 * MergingGrid — column spanning (body cell colSpan) stories (MOD-GRID-52, Track 2 제품결정 3번째).
 *
 * ★behavior-gated, non-vacuous (advisor): "a td appeared" is vacuous. width=sum would flake
 * (table-layout:auto). Real claims:
 *  1) a spanning row has columnCount−(N−1) <td>s — covered cells ABSENT from the DOM.
 *  2) the spanning <td>'s colSpan attribute = N (native colSpan; plain table → no aria-colspan).
 *  3) right-edge alignment: spanning cell's right edge == Nth column's right edge in a reference row.
 *  4) row-virt coherence: under row virtualization, a scrolled-in spanning row stays coherent
 *     (within-row → no rowSpan-style L-01 orphan).
 *
 * colSpan-only by design (no mergeRows) — combined row+col span on one cell is out of scope (vN).
 * C-3 예외: mock rows = Storybook stories 허용.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { MergingGrid } from '@topgrid/grid-pro-merging';
import type { MergingColumnDef } from '@topgrid/grid-pro-merging';

interface Row {
  a: string;
  b: string;
  c: string;
  d: string;
  e: string;
}

const FIELDS: Array<keyof Row> = ['a', 'b', 'c', 'd', 'e'];

function makeRows(n: number): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < n; i++) {
    rows.push({ a: `a${i}`, b: `b${i}`, c: `c${i}`, d: `d${i}`, e: `e${i}` });
  }
  return rows;
}

// 'b' spans 3 columns (b,c,d) on the chosen rows; everything else is a normal cell.
const columnsSpanningOn = (spanRows: ReadonlySet<number>): MergingColumnDef<Row>[] =>
  FIELDS.map((f) => ({
    id: f,
    header: f.toUpperCase(),
    accessorKey: f,
    ...(f === 'b'
      ? {
          meta: {
            colSpan: ({ rowIndex }: { row: Row; rowIndex: number }) =>
              spanRows.has(rowIndex) ? 3 : 1,
          },
        }
      : {}),
  }));

const meta: Meta<typeof MergingGrid> = {
  title: 'grid-pro-merging/MergingGrid (Column Span)',
  component: MergingGrid,
};
export default meta;
type Story = StoryObj<typeof MergingGrid>;

/** Non-virtualized: row 0 'b' cell spans 3 columns (b,c,d); row 1 is the non-spanned reference. */
export const Default: Story = {
  name: '컬럼 스팬',
  render: () => (
    <div style={{ width: 600 }}>
      <MergingGrid<Row>
        data={makeRows(3)}
        columns={columnsSpanningOn(new Set([0]))}
        enableColSpan
        className="border-collapse"
      />
    </div>
  ),
};

/** enableColSpan=false → byte-identical to a plain grid: no colSpan attribute, all 5 cells present. */
export const Off: Story = {
  name: 'colSpan 비활성 (byte-identical)',
  render: () => (
    <div style={{ width: 600 }}>
      <MergingGrid<Row>
        data={makeRows(3)}
        columns={columnsSpanningOn(new Set([0]))}
        className="border-collapse"
      />
    </div>
  ),
};

/**
 * Row-virtualized: 60 rows, 'b' spans 3 columns on row 40 (deep in the list). The CSS rule bounds
 * the MergingGrid internal scroll <div> (its direct child) so scrolling actually windows rows —
 * no component change needed. The test scrolls row 40 into the window and asserts the span stays
 * coherent (within-row → no L-01 orphan).
 */
export const Virtualized: Story = {
  name: '컬럼 스팬 + 행 가상화',
  render: () => (
    <div className="cs-virt-wrap" style={{ width: 600 }}>
      <style>{`.cs-virt-wrap > div { height: 300px; }`}</style>
      <MergingGrid<Row>
        data={makeRows(60)}
        columns={columnsSpanningOn(new Set([40]))}
        enableColSpan
        enableVirtualization
        estimatedRowHeight={36}
        virtualOverscan={4}
        className="border-collapse"
      />
    </div>
  ),
};
