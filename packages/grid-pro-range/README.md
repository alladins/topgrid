# @topgrid/grid-pro-range

Pro: Cell Range Selection, Drag-fill, Clipboard

Provides Excel-like cell range selection, drag-fill (auto-fill series), and clipboard copy/paste for topgrid.

## Installation

```bash
pnpm add @topgrid/grid-pro-range
# or
npm install @topgrid/grid-pro-range
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
import { RangeSelectGrid, useCellRange } from '@topgrid/grid-pro-range';

setLicenseKey('YOUR-LICENSE-KEY');

export function EditableGrid({ columns, data, onDataChange }) {
  return (
    <RangeSelectGrid
      columns={columns}
      data={data}
      onRangeChange={(range) => {
        // range: { start: { row, col }, end: { row, col } }
      }}
      onFill={(updates) => onDataChange(updates)}
    />
  );
}
```

### Using the hook directly

```tsx
import { useCellRange } from '@topgrid/grid-pro-range';

export function CustomGrid({ table }) {
  const { selectedRange, handleMouseDown, handleMouseEnter } = useCellRange({ table });

  return (
    <table>
      {/* attach handlers to td elements for range selection */}
    </table>
  );
}
```

## Main API

| Export | Description |
|--------|-------------|
| `RangeSelectGrid` | Grid component with full range selection + drag-fill |
| `useCellRange` | Hook for range selection state management |
| `useKeyboardNav` | Keyboard navigation hook for cell traversal |
| `normalizeRange` | Normalize start/end coords to top-left/bottom-right |
| `isInRange` | Test if a cell coord is within a range |
| `fillRange` | Compute drag-fill values for a series |
| `detectSeriesStep` | Detect numeric/date series step from selection |
| `CellRange` | Type for cell range coordinates |
| `CellCoord` | Type for a single cell coordinate |

## License

SEE LICENSE IN [EULA.md](./EULA.md)

License terms subject to change. Contact [sales@platree.com](mailto:sales@platree.com) for current EULA.

---

[Documentation](https://topgrid.platree.com) | [Pricing](https://topgrid.platree.com/pricing)
