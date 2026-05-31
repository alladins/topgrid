---
"@topgrid/grid-core": minor
"@topgrid/grid-pro-datamap": minor
"@topgrid/grid": minor
---

Rename public API identifiers `Tomis*` → `Topgrid*` (canonical), removing the old `Tomis*` names entirely with **no compatibility alias** (clean-break breaking rename).

Canonical renames:

- `TomisColumnDef` → `TopgridColumnDef`
- `TomisColumnType` → `TopgridColumnType`
- `TomisColumnGroup` → `TopgridColumnGroup`
- `createTomisColumnHelper` → `createTopgridColumnHelper`

All previous `Tomis*` names have been **removed** — they are no longer exported as aliases. This is a breaking rename: code importing any `Tomis*` identifier must migrate to the `Topgrid*` name. Bumped as `minor` per 0.x semver convention, but it is a breaking change for consumers of these identifiers.

Notes:

- In `@topgrid/grid-pro-datamap`, the canonical type remains `DataMapColumnDef`; only `TopgridColumnDef` is retained as a `@deprecated` alias of it. The old `TomisColumnDef` alias has been removed. (The meta `@topgrid/grid` facade continues to skip `TopgridColumnDef`; canonical source = `@topgrid/grid-core`.)
- Source file `createTomisColumnHelper.ts` was previously renamed to `createTopgridColumnHelper.ts`.
