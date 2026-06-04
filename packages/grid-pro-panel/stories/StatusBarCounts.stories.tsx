// MOD-GRID-33 G-1: status-bar 내장 카운트 — chromium gate. ★non-vacuous: 필터+선택 동시에 건 상태에서
// total/filtered/selected 가 셋 다 *발산*함을 단언(filtered→total 오배선 같은 그럴듯한 버그 검출).
// C-3 예외: mock 데이터는 Storybook/test 에서만 허용.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
  type RowSelectionState,
} from '@tanstack/react-table';
import { StatusBar, statusBarCounts } from '@topgrid/grid-pro-panel';
import { setLicenseState } from '@topgrid/grid-license';

interface Row {
  name: string;
  city: string;
}
// 5 rows: 3 Seoul, 2 Busan → global filter "Seoul" leaves 3.
const data: Row[] = [
  { name: '김철수', city: 'Seoul' },
  { name: '이영희', city: 'Busan' },
  { name: '박민준', city: 'Seoul' },
  { name: '최지우', city: 'Busan' },
  { name: '강수진', city: 'Seoul' },
];
const ch = createColumnHelper<Row>();
const columns = [ch.accessor('name', { header: '이름' }), ch.accessor('city', { header: '도시' })];

function StatusBarCountsDemo(): JSX.Element {
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, rowSelection },
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div style={{ padding: 8 }}>
      <input
        data-testid="filter"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="필터"
        style={{ marginBottom: 6, padding: '2px 6px', border: '1px solid #d1d5db' }}
      />
      <table style={{ borderCollapse: 'collapse' }}>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              <td style={{ border: '1px solid #eee', padding: '2px 6px' }}>
                <input
                  type="checkbox"
                  aria-label={`select ${row.original.name}`}
                  checked={row.getIsSelected()}
                  onChange={row.getToggleSelectedHandler()}
                />
              </td>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} style={{ border: '1px solid #eee', padding: '2px 6px' }}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div data-testid="statusbar">
        <StatusBar items={statusBarCounts(table)} />
      </div>
    </div>
  );
}

const meta: Meta = { title: 'grid-pro-panel/StatusBarCounts' };
export default meta;

export const Default: StoryObj = {
  name: '내장 카운트 (total/filtered/selected 발산)',
  beforeEach: () => {
    setLicenseState({ status: { valid: true as const }, rawKey: 'test', setAt: 0 });
  },
  render: () => <StatusBarCountsDemo />,
};
