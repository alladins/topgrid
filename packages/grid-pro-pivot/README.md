# @topgrid/grid-pro-pivot

Pro: declarative 2-D pivot table — row dimensions × column dimensions × value
aggregation — rendered over `@topgrid/grid-core`'s `<Grid>`.

Transform flat data into a pivot with `usePivot` (headless) or render it directly
with `PivotGrid`. Column dimensions become nested TanStack column groups
(multi-level headers); row dimensions become leading columns; grand-totals and
per-row-group subtotals are computed for you. Flip `pivotMode={false}` to fall
back to a normal grid with no pivot transform.

## Installation

```bash
pnpm add @topgrid/grid-pro-pivot
# or
npm install @topgrid/grid-pro-pivot
```

## License Activation

> **This is a Pro package requiring a valid license key.**

```tsx
import { setLicenseKey } from '@topgrid/grid-license';

// Call once at your app entry point (e.g., main.tsx)
setLicenseKey('YOUR-LICENSE-KEY');
```

Without a valid license, `PivotGrid` renders a watermark.
Contact [sales@platree.com](mailto:sales@platree.com) to obtain a license key.

## Peer Dependencies

| Package | Version |
|---------|---------|
| `@tanstack/react-table` | `^8.0.0` |
| `react` | `^18.0.0 \|\| ^19.0.0` |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` |

> Virtualization is delegated to `<Grid enableVirtualization>` — this package
> imports no virtualization library and no charting library.

## Usage

### Render a pivot

```tsx
import { PivotGrid } from '@topgrid/grid-pro-pivot';

<PivotGrid
  data={sales}
  config={{
    rows: ['region'],
    columns: ['quarter'],
    values: [{ field: 'sales', aggregationFn: 'sum' }],
  }}
/>
```

Multiple row/column dimensions and multiple value measures are supported:

```tsx
<PivotGrid
  data={sales}
  config={{
    rows: ['region', 'city'],
    columns: ['year', 'quarter'],
    values: [
      { field: 'sales', aggregationFn: 'sum', label: 'Sales' },
      { field: 'units', aggregationFn: 'avg', label: 'Avg Units' },
    ],
  }}
/>
```

### Custom value reducer

Each value def accepts a built-in aggregation key or a custom reducer over
`number[]` (pivot's own contract):

```tsx
config={{
  rows: ['region'],
  columns: ['quarter'],
  values: [
    {
      field: 'sales',
      aggregationFn: (v) => v.reduce((a, b) => a + b, 0) / v.length,
      label: 'Mean',
    },
  ],
}}
```

### Headless transform

```tsx
import { usePivot } from '@topgrid/grid-pro-pivot';

const model = usePivot(rows, {
  rows: ['region'],
  columns: ['quarter'],
  values: [{ field: 'sales', aggregationFn: 'count' }],
});
// model.columnTree, model.columnLeafKeys, model.rows
```

### Non-pivot passthrough

```tsx
<PivotGrid
  data={rows}
  config={config}
  pivotMode={false}
  passthroughColumns={normalColumns}
/>
```

## Aggregation

Built-in reducers operate over `number[]`: `sum`, `avg`, `min`, `max`, `count`.
Non-finite values (`NaN` / `Infinity`) are filtered first; an empty set yields a
`null` cell (never throws). The built-in key vocabulary is shared with
`@topgrid/grid-pro-agg` (`AggregationFnKey` / `BUILT_IN_AGGREGATION_KEYS`); the
pure pivot reducers are implemented locally per ADR-001.

## Main API

| Export | Description |
|--------|-------------|
| `PivotGrid` | Pivot table component over `<Grid>` (with `pivotMode` toggle) |
| `usePivot` | Headless hook → memoised `PivotModel` |
| `computePivot` | Pure transform (flat data → `PivotModel`) |
| `applyReducer` | Apply a built-in key or custom reducer to `number[]` |
| `isBuiltInAggregationKey` | Runtime guard for built-in keys |
| `buildPivotColumns` | Map a `PivotModel` to `<Grid>` column defs |
| `PivotConfig` / `PivotValueDef` / `PivotModel` | Public types |

## License

SEE LICENSE IN [EULA.md](./EULA.md)

License terms subject to change. Contact [sales@platree.com](mailto:sales@platree.com) for current EULA.

© Platree Co., Ltd. All rights reserved.

---

[Documentation](https://topgrid.platree.com) | [Pricing](https://topgrid.platree.com/pricing)
