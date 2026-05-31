# @topgrid/grid-pro-datamap

Pro: DataMap (foreign key display)

Provides DataMap support for topgrid — map raw code values to human-readable labels, support hierarchical (cascading) select editors, and async remote data lookup.

## Installation

```bash
pnpm add @topgrid/grid-pro-datamap
# or
npm install @topgrid/grid-pro-datamap
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
import { createDataMap, DataMapCell, DataMapEditor } from '@topgrid/grid-pro-datamap';

setLicenseKey('YOUR-LICENSE-KEY');

// Create a static DataMap from a lookup array
const statusMap = createDataMap({
  source: [
    { value: 'A', label: 'Active' },
    { value: 'I', label: 'Inactive' },
    { value: 'P', label: 'Pending' },
  ],
  valueKey: 'value',
  labelKey: 'label',
});

const columns = [
  { accessorKey: 'id', header: 'ID' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: (info) => <DataMapCell value={info.getValue()} dataMap={statusMap} />,
    meta: { editor: <DataMapEditor dataMap={statusMap} /> },
  },
];
```

### Async DataMap

```tsx
import { createAsyncDataMap } from '@topgrid/grid-pro-datamap';

const asyncMap = createAsyncDataMap({
  fetchFn: async (query) => {
    const res = await fetch(`/api/lookup?q=${query}`);
    return res.json();
  },
  valueKey: 'id',
  labelKey: 'name',
});
```

## Main API

| Export | Description |
|--------|-------------|
| `createDataMap` | Create a static DataMap from an array |
| `createAsyncDataMap` | Create an async (remote) DataMap |
| `DataMapCell` | Cell renderer that displays mapped labels |
| `DataMapEditor` | Dropdown editor for DataMap columns |
| `DataMap` | Type for static data map |
| `AsyncDataMap` | Type for async data map |
| `TomisColumnDef` | Extended column definition type |

## License

SEE LICENSE IN [EULA.md](./EULA.md)

License terms subject to change. Contact [sales@topvel.com](mailto:sales@topvel.com) for current EULA.

---

[Documentation](https://grid.tomis.dev) | [Pricing](https://topvel.com/grid/pricing)
