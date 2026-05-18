// spec G-002 Section 7 #13 / Step 8
// AC-004: MultiRowHeader story (AC-004)
// EC-03: GroupedHeaderGrid legacy alias는 grid-core에서 커버 — 중복 story 불필요
// C-3 예외: mock rows 데이터는 Storybook stories에서만 허용 (D7 결정, ADR-006)
// C-1 준수: MultiRowHeaderProps = { table: Table<TData>, enableStickyHeader?, frozenColumns?, enableGroupToggle? }
//   createColumnGroup: { header, columns } → GroupColumnDef<TData>
import type { Meta, StoryObj } from '@storybook/react';
import {
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { MultiRowHeader, createColumnGroup } from '@topgrid/grid-pro-header';

// C-3 예외: mock rows — Storybook stories 허용 범위
interface EmployeeRow {
  id: number;
  firstName: string;
  lastName: string;
  dept: string;
  team: string;
  salary: number;
  bonus: number;
}

const mockData: EmployeeRow[] = [
  { id: 1, firstName: '길동', lastName: '홍', dept: '개발팀', team: '1팀', salary: 5000000, bonus: 500000 },
  { id: 2, firstName: '영희', lastName: '김', dept: '기획팀', team: '1팀', salary: 4200000, bonus: 400000 },
  { id: 3, firstName: '철수', lastName: '이', dept: '개발팀', team: '2팀', salary: 4800000, bonus: 480000 },
];

// createColumnGroup: { header: string, columns: ColumnDef<TData>[] } → GroupColumnDef<TData>
const groupedColumns = [
  createColumnGroup<EmployeeRow>({
    header: '직원 정보',
    columns: [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'lastName', header: '성' },
      { accessorKey: 'firstName', header: '이름' },
    ],
  }),
  createColumnGroup<EmployeeRow>({
    header: '소속',
    columns: [
      { accessorKey: 'dept', header: '부서' },
      { accessorKey: 'team', header: '팀' },
    ],
  }),
  createColumnGroup<EmployeeRow>({
    header: '급여',
    columns: [
      { accessorKey: 'salary', header: '기본급' },
      { accessorKey: 'bonus', header: '성과급' },
    ],
  }),
];

// MultiRowHeader requires TanStack Table instance — wrapper component for Storybook
function MultiRowHeaderDemo({
  enableStickyHeader,
  enableGroupToggle,
}: {
  enableStickyHeader?: boolean;
  enableGroupToggle?: boolean;
}) {
  const table = useReactTable({
    data: mockData,
    columns: groupedColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-auto border rounded">
      <table className="w-full border-collapse">
        <MultiRowHeader
          table={table}
          {...(enableStickyHeader !== undefined ? { enableStickyHeader } : {})}
          {...(enableGroupToggle !== undefined ? { enableGroupToggle } : {})}
        />
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border border-gray-200 px-2 py-1 text-sm">
                  {String(cell.getValue() ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const meta: Meta<typeof MultiRowHeaderDemo> = {
  title: 'grid-pro-header/MultiRowHeader',
  component: MultiRowHeaderDemo,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof MultiRowHeaderDemo>;

export const Default: Story = {
  name: 'MultiRowHeader 기본 (2단 헤더)',
  args: {},
};

export const StickyHeader: Story = {
  name: 'MultiRowHeader 고정 헤더',
  args: {
    enableStickyHeader: true,
  },
};

export const GroupToggle: Story = {
  name: 'MultiRowHeader 그룹 접기/펼치기',
  args: {
    enableGroupToggle: true,
  },
};
