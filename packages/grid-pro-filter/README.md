# @topgrid/grid-pro-filter (Pro)

Multi-condition (AND/OR) column filtering — the compound-filter analog of XX Grid's
`agMultiColumnFilter`. Each column can stack multiple conditions combined with AND or OR.

> **Pro** — requires a valid `@topgrid/grid-license`. Without one, the filter builder renders a
> watermark (PAT-003).

## Usage

```tsx
import { multiTextFilterFn, multiNumberFilterFn, MultiFilter } from '@topgrid/grid-pro-filter';

const columns = [
  {
    accessorKey: 'name',
    filterFn: multiTextFilterFn,
    header: ({ column }) => <MultiFilter column={column} variant="text" />,
  },
  {
    accessorKey: 'score',
    filterFn: multiNumberFilterFn,
    header: ({ column }) => <MultiFilter column={column} variant="number" />,
  },
];
```

A column uses **either** the single-condition filter (`textFilterFn` + `TextFilter`) **or** the
compound filter (`multiTextFilterFn` + `MultiFilter`) — the value shapes are exclusive.

## How it composes (reuse)

`makeMultiFilterFn(base)` wraps any single-condition `FilterFn` (e.g. grid-features' `textFilterFn`)
into an AND/OR compound: it calls the base once per condition and reduces the results, **dropping
inactive conditions** via the base's own `autoRemove` first — so an empty condition never collapses
an `OR` to "all rows". The matching logic itself is never reimplemented.
