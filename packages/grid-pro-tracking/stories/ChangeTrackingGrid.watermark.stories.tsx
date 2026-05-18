/**
 * MOD-GRID-99-B residual-4 — ADR-001 watermark visual regression (Wave 2)
 *
 * ChangeTrackingGrid + invalid license → `<Watermark required />` overlay 노출.
 * ADR-001 Implementation Note: ChangeTrackingGrid wrapper inline (legacy export).
 *
 * @see findings/wave-residual-4-storybook-99b-spec.md §3.1 (ADR-001 gap)
 * @see findings/wave2-adr-001-result.md
 * @see ADR-MOD-GRID-REFACTOR-2026-05-17-001 (Visual Regression Note)
 */
import type { Meta, StoryObj } from '@storybook/react';
import { ChangeTrackingGrid } from '@topgrid/grid-pro-tracking';
import { createColumns } from '@topgrid/grid-core';
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
  { id: 3, name: 'Lee', dept: 'Sales', salary: 6100 },
];

const columns = createColumns<EmployeeRow>([
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'dept', header: 'Department' },
  { accessorKey: 'salary', header: 'Salary' },
]);

const meta: Meta<typeof ChangeTrackingGrid> = {
  title: 'Pro/ChangeTrackingGrid/Watermark',
  component: ChangeTrackingGrid,
};
export default meta;
type Story = StoryObj<typeof ChangeTrackingGrid>;

export const WithInvalidLicense: Story = {
  beforeEach: () => {
    setLicenseState(invalidLicense);
  },
  args: {
    data: mockData,
    columns,
    rowKey: 'id',
  },
};
