/**
 * MOD-GRID-99-B residual-4 — ADR-001 watermark visual regression (Wave 2)
 *
 * MasterDetailGrid + invalid license → `<Watermark required />` overlay 노출.
 *
 * @see findings/wave-residual-4-storybook-99b-spec.md §3.1 (ADR-001 gap)
 * @see findings/wave2-adr-001-result.md
 * @see ADR-MOD-GRID-REFACTOR-2026-05-17-001 (Visual Regression Note)
 */
import type { Meta, StoryObj } from '@storybook/react';
import { MasterDetailGrid } from '@topgrid/grid-pro-master';
import { createColumns } from '@topgrid/grid-core';
import { setLicenseState } from '@topgrid/grid-license';

const invalidLicense = {
  status: { valid: false, reason: 'invalid' as const },
  rawKey: '',
  setAt: 0,
};

interface DeptRow {
  id: number;
  name: string;
  budget: number;
}

const mockData: DeptRow[] = [
  { id: 1, name: 'Engineering', budget: 500000 },
  { id: 2, name: 'Marketing', budget: 200000 },
];

const columns = createColumns<DeptRow>([
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Department' },
  { accessorKey: 'budget', header: 'Budget' },
]);

const meta: Meta<typeof MasterDetailGrid> = {
  title: 'Pro/MasterDetailGrid/Watermark',
  component: MasterDetailGrid,
};
export default meta;
type Story = StoryObj<typeof MasterDetailGrid>;

export const WithInvalidLicense: Story = {
  beforeEach: () => {
    setLicenseState(invalidLicense);
  },
  args: {
    data: mockData,
    columns,
    renderDetailRow: (row) => (
      <div className="p-2 bg-gray-50 text-xs">
        Detail for {(row.original as DeptRow).name}
      </div>
    ),
  },
};
