// MOD-GRID-22 G-3: lazy-group SSRM — chromium AC③ gate (expand → child block fetch).
// The group cell renderer lives HERE (in the story, per design) — grid-core has no grouping logic.
// C-3 예외: mock 데이터는 Storybook stories 및 unit tests에서만 허용 (D7 결정, ADR-006).
import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid } from '@topgrid/grid-core';
import { useServerSideTree, isRowPlaceholder } from '@topgrid/grid-pro-serverside';
import type { ServerSideDatasource, SsrmRowMeta } from '@topgrid/grid-pro-serverside';

interface Row {
  country?: string;
  city?: string;
  name?: string;
  __ssrm?: SsrmRowMeta;
}

const COLS = ['country', 'city']; // 2 group levels → leaves at level 2

// Mock datasource. groupKeys.length = level; returns group rows (level < COLS.length) or leaves.
// Records every request on globalThis.__ssrmTreeCalls so the chromium test can assert once-each.
function makeDatasource(): ServerSideDatasource<Row> {
  const calls: Array<{ groupKeys: string[] }> = [];
  (globalThis as unknown as { __ssrmTreeCalls: typeof calls }).__ssrmTreeCalls = calls;
  const countries = ['USA', 'UK', 'KR'];
  const cities: Record<string, string[]> = { USA: ['NYC', 'LA'], UK: ['London'], KR: ['Seoul', 'Busan'] };
  return {
    getRows({ groupKeys = [] }) {
      calls.push({ groupKeys });
      return new Promise((resolve) => {
        setTimeout(() => {
          if (groupKeys.length === 0) {
            resolve({ rows: countries.map((country) => ({ country })), lastRow: countries.length });
          } else if (groupKeys.length === 1) {
            const cs = cities[groupKeys[0]] ?? [];
            resolve({ rows: cs.map((city) => ({ country: groupKeys[0], city })), lastRow: cs.length });
          } else {
            const leaves = Array.from({ length: 3 }, (_, i) => ({
              country: groupKeys[0], city: groupKeys[1], name: `${groupKeys[1]}-person-${i}`,
            }));
            resolve({ rows: leaves, lastRow: leaves.length });
          }
        }, 20);
      });
    },
  };
}

function ServerSideTreeDemo() {
  const datasource = useMemo(makeDatasource, []);
  const { gridProps, toggleGroup } = useServerSideTree<Row>(datasource, {
    blockSize: 50,
    rowGroupCols: COLS,
  });

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: 'group',
        header: 'Group / Name',
        cell: ({ row }) => {
          const r = row.original;
          const m = r.__ssrm;
          const indent = (m?.level ?? 0) * 18;
          if (isRowPlaceholder(r)) {
            return <span style={{ paddingLeft: indent, color: '#999' }}>Loading…</span>;
          }
          if (m?.group) {
            const label = m.groupKeys[m.groupKeys.length - 1];
            return (
              <button
                type="button"
                onClick={() => toggleGroup(m.groupKeys)}
                style={{ paddingLeft: indent, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {m.expanded ? '▼' : '▶'} {label}
              </button>
            );
          }
          return <span style={{ paddingLeft: indent }}>{r.name}</span>;
        },
      },
    ],
    [toggleGroup],
  );

  return (
    <div style={{ width: 600 }}>
      <Grid columns={columns} {...gridProps} virtualScrollHeight={360} />
    </div>
  );
}

const meta: Meta<typeof ServerSideTreeDemo> = {
  title: 'grid-pro-serverside/SSRM Tree',
  component: ServerSideTreeDemo,
};
export default meta;
type Story = StoryObj<typeof ServerSideTreeDemo>;

export const LazyGroups: Story = {
  name: 'lazy 그룹 (펼침 시 자식 fetch)',
};
