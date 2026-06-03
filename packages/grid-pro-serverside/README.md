# @topgrid/grid-pro-serverside

**Pro** — server-side row model (SSRM) for `@topgrid` grids: block-based lazy loading,
infinite scroll, and server sort/filter/group with stale-response rejection.

> Commercial license — see [EULA](./EULA.md).

## Installation

```bash
pnpm add @topgrid/grid-pro-serverside
```

## Peer Dependencies

| Package | Version | Required |
|---------|---------|---------|
| `@topgrid/grid-core` | `workspace:*` | Yes |
| `@tanstack/react-table` | `^8.0.0` | Yes |
| `@tanstack/react-virtual` | `^3.0.0` | Yes (public `virtualizerOptions.onChange` type) |
| `react` / `react-dom` | `^18 \|\| ^19` | Yes |

## Datasource contract

You supply a `ServerSideDatasource` — the single seam between the grid and your server:

```ts
const datasource: ServerSideDatasource<Row> = {
  async getRows({ startRow, endRow, sortModel, filterModel }) {
    const res = await fetch('/api/rows', {
      method: 'POST',
      body: JSON.stringify({ startRow, endRow, sortModel, filterModel }),
    });
    const { rows, lastRow } = await res.json();
    return { rows, lastRow }; // lastRow = absolute total when the end is reached, else undefined
  },
};
```

## Usage (G-2)

`useServerSideData` wires your datasource to `<Grid enableVirtualization>` — it observes the row
virtualizer, lazy-loads blocks for the visible range, and returns props to spread onto the grid:

```tsx
import { Grid } from '@topgrid/grid-core';
import { useServerSideData, isRowPlaceholder } from '@topgrid/grid-pro-serverside';

function MyGrid() {
  const { gridProps, totalCount, refresh } = useServerSideData<Row>(datasource, {
    blockSize: 100,
    rowCount: 100_000, // initial total; refined by getRows' lastRow
  });
  return <Grid columns={columns} {...gridProps} virtualScrollHeight={500} />;
}
```

`gridProps` sets `enableVirtualization`, `manualSorting`/`manualFiltering` (so the grid never
client-sorts the placeholder array), the `onSortingChange`/`onColumnFiltersChange` that re-query
the server, and `virtualizerOptions.onChange` (the scroll → block-fetch trigger). Rows not yet
loaded are `RowPlaceholder`s — detect with `isRowPlaceholder` in a cell renderer for skeletons.

> The data-flow logic is also available React-free as `createServerSideController(datasource,
> opts, onChange)` for custom integrations / testing.

## Block cache core (G-1)

The load-bearing logic is a **pure** block cache (no React, no network) — fully node-verifiable:

- `createBlockCache(blockSize)` — empty cache at epoch 0.
- `planBlocks(cache, visibleStart, visibleEnd)` — missing block indices for a visible range
  (loaded/in-flight blocks excluded → one request per block).
- `markLoading(cache, blockIndex)` / `acceptBlock(cache, blockIndex, rows, epoch, lastRow?)`.
- `invalidate(cache)` — clears blocks and **bumps the epoch**.
- `materialize(cache, totalCount)` — a `totalCount`-length array; not-yet-loaded indices are
  `RowPlaceholder`s (test with `isRowPlaceholder`). Feed it to `<Grid enableVirtualization data>`.

### The epoch invariant

`acceptBlock` **discards** any response whose epoch ≠ the cache's current epoch. So when
sort/filter/group changes (you call `invalidate`, bumping the epoch), a slow in-flight request
for the *old* query can never overwrite the *new* cache — no row-order corruption on a fast
sort-toggle.

> v1 limits: cache invalidation is **explicit only** (no LRU/memory eviction); `materialize`
> allocates a `totalCount`-length array. Lazy group/tree child loading is a separate Goal.
