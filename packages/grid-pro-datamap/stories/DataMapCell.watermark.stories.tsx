/**
 * MOD-GRID-99-B residual-4 — ADR-001 watermark visual regression (Wave 2)
 *
 * DataMapCell D-D: invalid license → `useWatermarkEnforcement()` singleton portal
 * 이 `document.body` 에 정확히 1회 mount (ref-counted createRoot). N cell 활성화
 * 시에도 portal 단일 인스턴스.
 *
 * @see findings/wave-residual-4-storybook-99b-spec.md §3.1 (ADR-001 D-D)
 * @see findings/wave2-adr-001-result.md (DataMapCell singleton portal)
 * @see ADR-MOD-GRID-REFACTOR-2026-05-17-001 (Visual Regression Note)
 */
import type { Meta, StoryObj } from '@storybook/react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { CellContext, ColumnDef } from '@tanstack/react-table';
import { DataMapCell, createDataMap } from '@topgrid/grid-pro-datamap';
import { setLicenseState } from '@topgrid/grid-license';

const invalidLicense = {
  status: { valid: false, reason: 'invalid' as const },
  rawKey: '',
  setAt: 0,
};

interface StatusRow {
  id: number;
  statusCode: string;
}

const mockData: StatusRow[] = [
  { id: 1, statusCode: 'ACTIVE' },
  { id: 2, statusCode: 'INACTIVE' },
  { id: 3, statusCode: 'PENDING' },
];

const statusMap = createDataMap({
  items: [
    { code: 'ACTIVE', label: 'Active' },
    { code: 'INACTIVE', label: 'Inactive' },
    { code: 'PENDING', label: 'Pending' },
  ],
  valuePath: 'code',
  displayPath: 'label',
});

// DataMapColumnDef = ColumnDef & { dataMap?: DataMap | row=>DataMap }
// 캐스팅으로 dataMap 필드 부여 (TanStack ColumnDef 에 없음)
const columns: ColumnDef<StatusRow>[] = [
  { accessorKey: 'id', header: 'ID' },
  {
    accessorKey: 'statusCode',
    header: 'Status',
    cell: (info: CellContext<StatusRow, unknown>) => DataMapCell(info),
    dataMap: statusMap,
  } as ColumnDef<StatusRow>,
];

function DataMapCellWithWatermarkDemo() {
  const table = useReactTable({
    data: mockData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return (
    <div className="border rounded overflow-auto">
      <table className="w-full border-collapse">
        <thead className="bg-gray-100">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} className="px-2 py-1 text-left text-sm">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-t">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-2 py-1 text-sm">
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

const meta: Meta<typeof DataMapCellWithWatermarkDemo> = {
  title: 'Pro/DataMapCell/Watermark',
  component: DataMapCellWithWatermarkDemo,
};
export default meta;
type Story = StoryObj<typeof DataMapCellWithWatermarkDemo>;

/**
 * D-D 시각 검증: invalid license + DataMapCell 활성 → singleton portal
 * (`document.body` overlay) 가 1회 mount. cell 수 무관 (3 cell × 1 portal).
 */
export const WithInvalidLicense: Story = {
  beforeEach: () => {
    setLicenseState(invalidLicense);
  },
  render: () => <DataMapCellWithWatermarkDemo />,
};
