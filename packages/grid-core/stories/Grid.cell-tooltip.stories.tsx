// MOD-GRID-36 G-3: cell tooltip — chromium gate. getCellTooltip → native <td title>. ★non-vacuous:
// the title reflects the cell's VALUE (differs per row) and is absent where the callback returns
// undefined. C-3 예외: mock 데이터.
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid } from '@topgrid/grid-core';

interface Row {
  sku: string;
  name: string;
}
const data: Row[] = [
  { sku: 'A', name: '사과' },
  { sku: 'B', name: '바나나' },
];
const columns: ColumnDef<Row>[] = [
  { accessorKey: 'sku', header: 'SKU', size: 100 },
  { accessorKey: 'name', header: '이름', size: 160 },
];

const meta: Meta = { title: 'grid-core/Grid (Cell Tooltip)' };
export default meta;

export const Default: StoryObj = {
  name: '셀 툴팁 (name 컬럼만 title)',
  render: () => (
    <Grid<Row>
      columns={columns}
      data={data}
      // tooltip only for the name column; sku cells get no title.
      getCellTooltip={(cell) =>
        cell.column.id === 'name' ? `상세: ${String(cell.getValue())}` : undefined
      }
    />
  ),
};
