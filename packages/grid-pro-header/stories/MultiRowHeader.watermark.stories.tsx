/**
 * MOD-GRID-99-B residual-4 — ADR-001 watermark visual regression (Wave 2)
 *
 * MultiRowHeader H-D: invalid license → `<thead>` 내 `<tr><th colSpan=N><Watermark required /></th></tr>`
 * watermark row prepend. `enableStickyHeader === true` 시 `sticky top-0 z-20` 강제.
 *
 * @see findings/wave-residual-4-storybook-99b-spec.md §3.1 (ADR-001 H-D)
 * @see findings/wave2-adr-001-result.md (MultiRowHeader H-D inline)
 * @see ADR-MOD-GRID-REFACTOR-2026-05-17-001 (Visual Regression Note)
 */
import type { Meta, StoryObj } from '@storybook/react';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { MultiRowHeader, createColumnGroup } from '@topgrid/grid-pro-header';
import { setLicenseState } from '@topgrid/grid-license';

const invalidLicense = {
  status: { valid: false, reason: 'invalid' as const },
  rawKey: '',
  setAt: 0,
};

interface EmployeeRow {
  id: number;
  name: string;
  dept: string;
  salary: number;
}

const mockData: EmployeeRow[] = [
  { id: 1, name: 'Hong', dept: 'Engineering', salary: 5000 },
  { id: 2, name: 'Kim', dept: 'Marketing', salary: 4200 },
];

const groupedColumns = [
  createColumnGroup<EmployeeRow>({
    header: 'Identity',
    columns: [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'name', header: 'Name' },
    ],
  }),
  createColumnGroup<EmployeeRow>({
    header: 'Employment',
    columns: [
      { accessorKey: 'dept', header: 'Department' },
      { accessorKey: 'salary', header: 'Salary' },
    ],
  }),
];

function MultiRowHeaderWithWatermarkDemo() {
  const table = useReactTable({
    data: mockData,
    columns: groupedColumns,
    getCoreRowModel: getCoreRowModel(),
  });
  return (
    <div className="overflow-auto border rounded">
      <table className="w-full border-collapse">
        <MultiRowHeader table={table} />
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-t">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-2 py-1 text-sm">
                  {String(cell.getValue())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const meta: Meta<typeof MultiRowHeaderWithWatermarkDemo> = {
  title: 'Pro/MultiRowHeader/Watermark',
  component: MultiRowHeaderWithWatermarkDemo,
};
export default meta;
type Story = StoryObj<typeof MultiRowHeaderWithWatermarkDemo>;

/**
 * H-D 시각 검증: `<thead>` 첫 row 가 `<Watermark required />` (colSpan = visibleColumns.length).
 */
export const WithInvalidLicense: Story = {
  beforeEach: () => {
    setLicenseState(invalidLicense);
  },
  render: () => <MultiRowHeaderWithWatermarkDemo />,
};
