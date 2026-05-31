# @topgrid/grid-pro-master

Pro: Master-Detail, TreeGrid, Context Menu

Provides master-detail row expansion, tree grid, and right-click context menu for topgrid — expand rows to reveal nested detail content, display hierarchical tree data, and add context actions to rows.

## Installation

```bash
pnpm add @topgrid/grid-pro-master
# or
npm install @topgrid/grid-pro-master
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
| `@topgrid/grid-core` | `workspace:*` |
| `react` | `^18.0.0 \|\| ^19.0.0` |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` |

## Usage

### Master-Detail

```tsx
import { setLicenseKey } from '@topgrid/grid-license';
import { MasterDetailGrid } from '@topgrid/grid-pro-master';

setLicenseKey('YOUR-LICENSE-KEY');

export function OrdersGrid({ orders }) {
  return (
    <MasterDetailGrid
      columns={columns}
      data={orders}
      renderDetailRow={({ row }) => (
        <div>
          <h4>Order Items</h4>
          <ul>
            {row.original.items.map((item) => (
              <li key={item.id}>{item.name} × {item.qty}</li>
            ))}
          </ul>
        </div>
      )}
    />
  );
}
```

### Context Menu

```tsx
import { ContextMenuGrid } from '@topgrid/grid-pro-master';

export function GridWithMenu({ data }) {
  return (
    <ContextMenuGrid
      columns={columns}
      data={data}
      contextMenuItems={[
        { label: 'Edit', onClick: (row) => openEdit(row) },
        { label: 'Delete', onClick: (row) => deleteRow(row) },
      ]}
    />
  );
}
```

## Main API

| Export | Description |
|--------|-------------|
| `MasterDetailGrid` | Grid with expandable detail rows |
| `ContextMenuGrid` | Grid with right-click context menu |
| `useExpandedPersistence` | Hook to persist row expansion state |
| `TreeGrid` | Re-export of tree grid from `@topgrid/grid-core` |
| `ColumnPinGrid` | Re-export of column pin grid from `@topgrid/grid-core` |
| `MasterDetailGridProps` | Props type |
| `ContextMenuGridProps` | Props type |
| `ContextMenuItem` | Context menu item type |

## License

SEE LICENSE IN [EULA.md](./EULA.md)

License terms subject to change. Contact [sales@topvel.com](mailto:sales@topvel.com) for current EULA.

---

[Documentation](https://grid.tomis.dev) | [Pricing](https://topvel.com/grid/pricing)
