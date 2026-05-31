# @topgrid/grid-pro-header

Pro: Multi-row Header (Column Groups)

Provides multi-row header (column group) support for topgrid — merge columns under shared group headers, with full TanStack Table column group API integration.

## Installation

```bash
pnpm add @topgrid/grid-pro-header
# or
npm install @topgrid/grid-pro-header
```

## License Activation

> **This is a Pro package requiring a valid license key.**

```tsx
import { setLicenseKey } from '@topgrid/grid-license';

// Call once at your app entry point (e.g., main.tsx)
setLicenseKey('YOUR-LICENSE-KEY');
```

Without a valid license, the component will render a watermark.
Contact [sales@platree.com](mailto:sales@platree.com) to obtain a license key.

## Peer Dependencies

| Package | Version |
|---------|---------|
| `@tanstack/react-table` | `^8.0.0` |
| `react` | `^18.0.0 \|\| ^19.0.0` |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` |

## Usage

```tsx
import { setLicenseKey } from '@topgrid/grid-license';
import { MultiRowHeader, createColumnGroup } from '@topgrid/grid-pro-header';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';

setLicenseKey('YOUR-LICENSE-KEY');

// `createColumnGroup` takes a single config object and returns one
// `GroupColumnDef`. Call it once per group and collect the results.
const columns = [
  createColumnGroup({
    header: 'Personal Info',
    columns: [
      { accessorKey: 'firstName', header: 'First Name' },
      { accessorKey: 'lastName', header: 'Last Name' },
    ],
  }),
  createColumnGroup({
    header: 'Contact',
    columns: [
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'phone', header: 'Phone' },
    ],
  }),
];

export function GroupedGrid({ data }) {
  // `MultiRowHeader` renders a multi-row `<thead>` from a TanStack table
  // instance — pass the instance via the single `table` prop.
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table>
      <MultiRowHeader table={table} />
      {/* render <tbody> from table.getRowModel() as usual */}
    </table>
  );
}
```

## Main API

| Export | Description |
|--------|-------------|
| `MultiRowHeader` | Grid component with multi-row grouped header |
| `createColumnGroup` | Helper to define column group configurations |
| `GroupedHeaderGrid` | Legacy alias for `MultiRowHeader` (deprecated) |
| `ColumnGroupConfig` | Column group configuration type |
| `MultiRowHeaderProps` | Props type for `<MultiRowHeader>` |

## License

SEE LICENSE IN [EULA.md](./EULA.md)

License terms subject to change. Contact [sales@platree.com](mailto:sales@platree.com) for current EULA.

---

[Documentation](https://topgrid.platree.com) | [Pricing](https://topgrid.platree.com/pricing)
