/**
 * MOD-GRID-99-B residual-4 — ADR-001 watermark visual regression (Wave 2)
 *
 * RangeSelectGrid + invalid license → `<Watermark required />` overlay 노출.
 *
 * @see findings/wave-residual-4-storybook-99b-spec.md §3.1 (ADR-001 gap)
 * @see findings/wave2-adr-001-result.md
 * @see ADR-MOD-GRID-REFACTOR-2026-05-17-001 (Visual Regression Note)
 */
import type { Meta, StoryObj } from '@storybook/react';
import { RangeSelectGrid } from '@tomis/grid-pro-range';
import { createColumns } from '@tomis/grid-core';
import { setLicenseState } from '@tomis/grid-license';

const invalidLicense = {
  status: { valid: false, reason: 'invalid' as const },
  rawKey: '',
  setAt: 0,
};

interface SpreadsheetRow {
  id: number;
  a: number;
  b: number;
  c: number;
}

const mockData: SpreadsheetRow[] = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  a: (i + 1) * 10,
  b: (i + 2) * 5,
  c: (i + 3) * 3,
}));

const columns = createColumns<SpreadsheetRow>([
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'a', header: 'A' },
  { accessorKey: 'b', header: 'B' },
  { accessorKey: 'c', header: 'C' },
]);

const meta: Meta<typeof RangeSelectGrid> = {
  title: 'Pro/RangeSelectGrid/Watermark',
  component: RangeSelectGrid,
};
export default meta;
type Story = StoryObj<typeof RangeSelectGrid>;

export const WithInvalidLicense: Story = {
  beforeEach: () => {
    setLicenseState(invalidLicense);
  },
  args: {
    data: mockData,
    columns,
  },
};
