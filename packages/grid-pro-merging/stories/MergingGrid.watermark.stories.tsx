/**
 * MOD-GRID-99-B residual-4 — ADR-001 watermark visual regression (Wave 2)
 *
 * MergingGrid + invalid license → `<Watermark required />` overlay 노출.
 * ADR-001 Implementation Note: MergingGrid wrapper inline (non-virt path).
 *
 * @see findings/wave-residual-4-storybook-99b-spec.md §3.1 (ADR-001 gap)
 * @see findings/wave2-adr-001-result.md
 * @see ADR-MOD-GRID-REFACTOR-2026-05-17-001 (Visual Regression Note)
 */
import type { Meta, StoryObj } from '@storybook/react';
import { MergingGrid } from '@topgrid/grid-pro-merging';
import type { MergingColumnDef } from '@topgrid/grid-pro-merging';
import { setLicenseState } from '@topgrid/grid-license';

const invalidLicense = {
  status: { valid: false, reason: 'invalid' as const },
  rawKey: '',
  setAt: 0,
};

interface SalesRow {
  dept: string;
  team: string;
  employee: string;
  amount: number;
}

const mockData: SalesRow[] = [
  { dept: 'Sales', team: 'A', employee: 'Hong', amount: 3200 },
  { dept: 'Sales', team: 'A', employee: 'Kim', amount: 2800 },
  { dept: 'Sales', team: 'B', employee: 'Lee', amount: 4100 },
  { dept: 'Dev', team: 'A', employee: 'Park', amount: 5200 },
];

const columns: MergingColumnDef<SalesRow>[] = [
  { accessorKey: 'dept', header: 'Department', meta: { mergeRows: true } },
  { accessorKey: 'team', header: 'Team' },
  { accessorKey: 'employee', header: 'Employee' },
  { accessorKey: 'amount', header: 'Amount' },
];

const meta: Meta<typeof MergingGrid> = {
  title: 'Pro/MergingGrid/Watermark',
  component: MergingGrid,
};
export default meta;
type Story = StoryObj<typeof MergingGrid>;

export const WithInvalidLicense: Story = {
  beforeEach: () => {
    setLicenseState(invalidLicense);
  },
  args: {
    data: mockData,
    columns,
    enableMerging: true,
  },
};
