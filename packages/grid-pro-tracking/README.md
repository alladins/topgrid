# @topgrid/grid-pro-tracking

Pro: ChangeTracking, Mapping, Validator

Provides change tracking (dirty state) for TOMIS Grid — track edited cells and rows, build a changeset for server submission, and validate changes before commit.

## Installation

```bash
pnpm add @topgrid/grid-pro-tracking
# or
npm install @topgrid/grid-pro-tracking
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

```tsx
import { setLicenseKey } from '@topgrid/grid-license';
import { useChangeTracking, buildChangeSet, ChangeTrackingGrid } from '@topgrid/grid-pro-tracking';

setLicenseKey('YOUR-LICENSE-KEY');

export function EditableTable({ initialData, onSave }) {
  const { data, editCell, resetChanges, hasChanges } = useChangeTracking({
    initialData,
  });

  const handleSave = () => {
    const changeset = buildChangeSet({ original: initialData, current: data });
    onSave(changeset);
    resetChanges();
  };

  return (
    <div>
      <ChangeTrackingGrid columns={columns} data={data} onCellEdit={editCell} />
      <button onClick={handleSave} disabled={!hasChanges}>
        Save Changes
      </button>
    </div>
  );
}
```

## Main API

| Export | Description |
|--------|-------------|
| `useChangeTracking` | Hook to track dirty rows and cells |
| `buildChangeSet` | Build a changeset diff from original vs current data |
| `ChangeTrackingGrid` | Grid component with built-in change tracking |
| `getRowStatusClassName` | Get CSS class for row status (added/modified/deleted) |
| `defaultRowStatusClassNames` | Default CSS class names for row states |
| `BuildChangeSetOptions` | Options type for `buildChangeSet` |
| `ChangeTrackingGridProps` | Props type for `<ChangeTrackingGrid>` |

## License

SEE LICENSE IN [EULA.md](./EULA.md)

License terms subject to change. Contact [sales@topvel.com](mailto:sales@topvel.com) for current EULA.

---

[Documentation](https://grid.tomis.dev) | [Pricing](https://topvel.com/grid/pricing)
