// MOD-GRID-66: drag-between-grids — chromium gate. ★end-to-end (advisor): the dragged row id is lifted
// to consumer state ABOVE both grids (consumer-owns-payload, LESS-009 generalized) — no dataTransfer.
// Grid A row dragstart → onRowDragStart(id) → setDragged; Grid B drop → onRowDrop → transferRow → the
// row leaves A and appears in B. Ref-free handlers → dispatchEvent drives them. C-3 예외: mock.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid, transferRow } from '@topgrid/grid-core';

interface Item {
  id: string;
  name: string;
}
const columns: ColumnDef<Item>[] = [
  { id: 'name', accessorKey: 'name', header: 'Name', size: 160 },
];
const getId = (r: Item) => r.id;

function DragBetweenDemo(): JSX.Element {
  const [left, setLeft] = useState<Item[]>([
    { id: 'a', name: 'Apple' },
    { id: 'b', name: 'Banana' },
    { id: 'c', name: 'Cherry' },
  ]);
  const [right, setRight] = useState<Item[]>([{ id: 'x', name: 'Xigua' }]);
  const [dragged, setDragged] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <div data-grid="left" style={{ flex: 1 }}>
        <Grid<Item>
          columns={columns}
          data={left}
          getRowId={getId}
          onRowDragStart={(id) => setDragged(id)}
        />
      </div>
      <div data-grid="right" style={{ flex: 1 }}>
        <Grid<Item>
          columns={columns}
          data={right}
          getRowId={getId}
          onRowDrop={() => {
            if (dragged === null) return;
            const next = transferRow(left, right, dragged, getId);
            setLeft(next.source);
            setRight(next.target);
            setDragged(null);
          }}
        />
      </div>
    </div>
  );
}

const meta: Meta = { title: 'grid-core/Grid (Drag Between Grids)' };
export default meta;

export const Default: StoryObj = {
  name: '그리드 간 행 드래그 이전',
  render: () => <DragBetweenDemo />,
};
