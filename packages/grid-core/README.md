# @topgrid/grid-core

TanStack Table abstraction wrapper + useGridState core hook

## Installation

```bash
pnpm add @topgrid/grid-core
# or
npm install @topgrid/grid-core
# or
yarn add @topgrid/grid-core
```

## Peer Dependencies

| Package | Version |
|---------|---------|
| `@tanstack/react-table` | `^8.0.0` |
| `@tanstack/react-virtual` | `^3.0.0` |
| `react` | `^18.0.0 \|\| ^19.0.0` |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` |

## Usage

```tsx
import { Grid, useGridState } from '@topgrid/grid-core';

const columns = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
];

const data = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
];

export function MyGrid() {
  const gridState = useGridState({ columns, data });
  return <Grid state={gridState} />;
}
```

## Main API

| Export | Description |
|--------|-------------|
| `Grid` | Core grid component |
| `useGridState` | Core state management hook |
| `useUrlSync` | Sync grid state to URL params |
| `useStoragePersist` | Persist grid state to localStorage/sessionStorage |
| `GridProps` | Props type for `<Grid>` |
| `GridHandle` | Ref handle type for imperative actions |
| `GridState` | Grid state type |

## License

MIT

---

[Documentation](https://topgrid.platree.com) | [API Reference](https://topgrid.platree.com/api)
