# @topgrid/grid-pro-merging

Pro: Cell Merging (rowSpan) — column.mergeRows API + automatic rowSpan calculation

Provides automatic cell merging for topgrid — detect consecutive cells with identical values and apply `rowSpan` so they visually merge into a single cell.

## Installation

```bash
pnpm add @topgrid/grid-pro-merging
# or
npm install @topgrid/grid-pro-merging
```

## License Activation

> **This is a Pro package requiring a valid license key.**

```tsx
import { setLicenseKey } from '@topgrid/grid-license';

// Call once at your app entry point (e.g., main.tsx)
setLicenseKey('YOUR-LICENSE-KEY');
```

Without a valid license, the component will render a watermark.
Contact [sales@topvel.com](mailto:sales@topvel.com) to obtain a license key.

## Peer Dependencies

| Package | Version | Required |
|---------|---------|---------|
| `@tanstack/react-table` | `^8.0.0` | Yes |
| `@tanstack/react-virtual` | `^3.0.0` | Optional |
| `@topgrid/grid-core` | `workspace:*` | Yes |
| `react` | `^18.0.0 \|\| ^19.0.0` | Yes |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` | Yes |

## Usage

```tsx
import { setLicenseKey } from '@topgrid/grid-license';
import { MergingGrid } from '@topgrid/grid-pro-merging';
import type { MergingColumnDef } from '@topgrid/grid-pro-merging';

setLicenseKey('YOUR-LICENSE-KEY');

const columns: MergingColumnDef<MyRow>[] = [
  {
    accessorKey: 'department',
    header: 'Department',
    meta: {
      mergeRows: true,  // enable automatic rowSpan merging for this column
    },
  },
  { accessorKey: 'employee', header: 'Employee' },
  { accessorKey: 'role', header: 'Role' },
];

export function MergedGrid({ data }) {
  return <MergingGrid columns={columns} data={data} />;
}
```

## Main API

| Export | Description |
|--------|-------------|
| `MergingGrid` | Grid component with automatic cell merging |
| `computeMergeSpans` | Pure function to compute rowSpan map from data |
| `MergingColumnDef` | Extended column definition type with `mergeRows` meta |
| `MergingGridProps` | Props type for `<MergingGrid>` |
| `MergeSpanMap` | Type for the computed span map |

## License

SEE LICENSE IN [EULA.md](./EULA.md)

License terms subject to change. Contact [sales@topvel.com](mailto:sales@topvel.com) for current EULA.

---

[Documentation](https://grid.tomis.dev) | [Pricing](https://topvel.com/grid/pricing)
