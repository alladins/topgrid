// EXPORT-UX P2 — GridExportButton 라이브 데모(실제 useReactTable + 버튼).
// Storybook 에서 실제 다운로드가 동작한다(xlsx/csv/pdf peer 설치 시).
import type { Meta, StoryObj } from '@storybook/react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { GridExportButton, type ExportFormat } from '@topgrid/grid-export/react';

interface Person {
  id: number;
  name: string;
  dept: string;
  amount: number;
}

const data: Person[] = [
  { id: 1, name: '홍길동', dept: '개발팀', amount: 5000000 },
  { id: 2, name: '김영희', dept: '기획팀', amount: 4200000 },
  { id: 3, name: '이철수', dept: '영업팀', amount: 6100000 },
  { id: 4, name: '박민수', dept: '개발팀', amount: 5300000 },
];

const col = createColumnHelper<Person>();
const columns = [
  col.accessor('id', { header: 'ID' }),
  col.accessor('name', { header: '이름' }),
  col.accessor('dept', { header: '부서' }),
  col.accessor('amount', { header: '금액' }),
];

function DemoGrid({ formats }: { formats: ExportFormat[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  return (
    <div style={{ padding: 16, font: '14px system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <GridExportButton table={table} formats={formats} fileName="직원목록" columnFormats={{ amount: '#,##0' }} />
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} style={{ border: '1px solid #ddd', padding: '6px 10px', textAlign: 'left' }}>
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} style={{ border: '1px solid #eee', padding: '6px 10px' }}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const meta: Meta<typeof DemoGrid> = {
  title: 'grid-export/GridExportButton',
  component: DemoGrid,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof DemoGrid>;

export const SingleFormat: Story = {
  name: '단일 포맷 (Excel 버튼)',
  args: { formats: ['xlsx'] },
};

export const MultiFormatMenu: Story = {
  name: '다중 포맷 (드롭다운)',
  args: { formats: ['xlsx', 'csv', 'pdf', 'clipboard', 'print'] },
};
