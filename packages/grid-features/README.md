# @tomis/grid-features

Column reorder, multi-sort, filter UI features

## Installation

```bash
pnpm add @tomis/grid-features
# or
npm install @tomis/grid-features
# or
yarn add @tomis/grid-features
```

## Peer Dependencies

| Package | Version |
|---------|---------|
| `@tanstack/react-table` | `^8.0.0` |
| `@tanstack/react-virtual` | `^3.0.0` (optional) |
| `react` | `^18.0.0 \|\| ^19.0.0` |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` |
| `date-fns` | `^4.1.0` |
| `react-datepicker` | `^8.3.0` |

## Usage

### Column Drag-and-Drop Reorder

```tsx
import { useColumnDrag, DropIndicator } from '@tomis/grid-features';

export function ReorderableGrid({ columns, data }) {
  const { dragProps, dropProps } = useColumnDrag({ columns });
  return (
    <table>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.id} {...dragProps(col.id)}>
              {col.header}
              <DropIndicator {...dropProps(col.id)} />
            </th>
          ))}
        </tr>
      </thead>
    </table>
  );
}
```

### Multi-Sort

```tsx
import { useMultiSort, SortBadge, SortClearButton } from '@tomis/grid-features';

export function SortableGrid({ table }) {
  const { sortState } = useMultiSort({ table });
  return (
    <div>
      <SortClearButton table={table} />
      {/* SortBadge renders sort indicator per column */}
    </div>
  );
}
```

## Main API

| Export | Description |
|--------|-------------|
| `useColumnDrag` | Column drag-and-drop reorder hook |
| `DropIndicator` | Drop target indicator component |
| `useColumnOrderPersist` | Persist column order to storage |
| `useMultiSort` | Multi-column sort hook |
| `SortBadge` | Sort order indicator badge |
| `SortClearButton` | Button to clear all sort state |

## License

MIT

---

[Documentation](https://grid.tomis.dev) | [API Reference](https://grid.tomis.dev/api)
