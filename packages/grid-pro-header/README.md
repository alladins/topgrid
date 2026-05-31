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
Contact [sales@topvel.com](mailto:sales@topvel.com) to obtain a license key.

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

setLicenseKey('YOUR-LICENSE-KEY');

// Define column groups
const columnGroups = createColumnGroup([
  {
    header: 'Personal Info',
    columns: [
      { accessorKey: 'firstName', header: 'First Name' },
      { accessorKey: 'lastName', header: 'Last Name' },
    ],
  },
  {
    header: 'Contact',
    columns: [
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'phone', header: 'Phone' },
    ],
  },
]);

export function GroupedGrid({ data }) {
  return (
    <MultiRowHeader columns={columnGroups} data={data} />
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

License terms subject to change. Contact [sales@topvel.com](mailto:sales@topvel.com) for current EULA.

---

[Documentation](https://grid.tomis.dev) | [Pricing](https://topvel.com/grid/pricing)
