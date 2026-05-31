# @topgrid/grid-pro-agg

Pro: Aggregation (group footer)

Provides group-by aggregation for topgrid — compute sum, average, count, and custom aggregates per group, displayed in group footer rows.

## Installation

```bash
pnpm add @topgrid/grid-pro-agg
# or
npm install @topgrid/grid-pro-agg
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

| Package | Version | Required |
|---------|---------|---------|
| `@tanstack/react-table` | `^8.0.0` | Yes |
| `@tanstack/react-virtual` | `^3.0.0` | Optional |
| `react` | `^18.0.0 \|\| ^19.0.0` | Yes |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` | Yes |

## Usage

```tsx
import { setLicenseKey } from '@topgrid/grid-license';
import { AggregationGrid, GroupPanel } from '@topgrid/grid-pro-agg';

setLicenseKey('YOUR-LICENSE-KEY');

const columns = [
  {
    accessorKey: 'department',
    header: 'Department',
    // aggregation footer shows group label
  },
  {
    accessorKey: 'salary',
    header: 'Salary',
    meta: {
      aggregation: 'sum',     // Built-in: 'sum' | 'avg' | 'count' | 'min' | 'max'
    },
  },
];

export function SalaryGrid({ data }) {
  return (
    <div>
      <GroupPanel />
      <AggregationGrid columns={columns} data={data} />
    </div>
  );
}
```

## Main API

| Export | Description |
|--------|-------------|
| `AggregationGrid` | Grid component with group aggregation |
| `GroupPanel` | Drag-and-drop group-by panel UI |
| `resolveAggregationFn` | Resolve built-in or custom aggregation function |
| `registerAggregationFn` | Register a custom aggregation function |
| `getAggregationFn` | Retrieve a registered aggregation function |
| `BUILT_IN_AGGREGATION_KEYS` | Array of built-in aggregation key names |
| `AggregationGridProps` | Props type for `<AggregationGrid>` |
| `AggregationColumnDef` | Column definition type with aggregation meta |

## License

SEE LICENSE IN [EULA.md](./EULA.md)

License terms subject to change. Contact [sales@platree.com](mailto:sales@platree.com) for current EULA.

---

[Documentation](https://topgrid.platree.com) | [Pricing](https://topgrid.platree.com/pricing)
