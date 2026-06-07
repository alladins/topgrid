// MOD-GRID-57 — auto group column. ★behavior-gated, non-vacuous: "a column exists" is vacuous. The
// real divergence: the single auto-group column indents by depth + carries the expand toggle, and
// expanding a node reveals its (deeper-indented) children. C-3 예외: mock tree.
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid, createAutoGroupColumn } from '@topgrid/grid-core';

interface Node {
  id: string;
  name: string;
  pop: number;
  children?: Node[];
}
const tree: Node[] = [
  {
    id: 'asia',
    name: 'Asia',
    pop: 0,
    children: [
      { id: 'kr', name: 'Korea', pop: 51 },
      { id: 'jp', name: 'Japan', pop: 125 },
    ],
  },
  { id: 'eu', name: 'Europe', pop: 0, children: [{ id: 'fr', name: 'France', pop: 68 }] },
];

const columns: ColumnDef<Node>[] = [
  createAutoGroupColumn<Node>({ header: '지역', getValue: (n) => n.name }),
  { accessorKey: 'pop', header: '인구(M)' },
];

const meta: Meta = { title: 'grid-core/Grid (Auto Group Column)' };
export default meta;

export const Default: StoryObj = {
  name: '자동 그룹 컬럼 (트리)',
  render: () => (
    <Grid<Node>
      data={tree}
      columns={columns}
      getSubRows={(n) => n.children}
      getRowId={(n) => n.id}
      enableExpanding
    />
  ),
};
