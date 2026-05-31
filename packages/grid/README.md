# @topgrid/grid

> **Meta package facade** — re-exports the public API of all 13 underlying packages
> (`@topgrid/grid-*`). Activates a single entry point per ADR-MOD-GRID-REFACTOR-2026-05-17-003.

## What's Included

### MIT packages (4)

| Package | Description |
|---------|-------------|
| `@topgrid/grid-core` | TanStack Table abstraction + `<Grid>` + `useGridState` + legacy aliases (BaseGrid, VirtualGrid, ColumnPinGrid, TreeGrid) + pagination + `createColumns` + column-drag + multi-sort base |
| `@topgrid/grid-renderers` | Cell renderers (Text, Number, Date, StatusBadge, Link, Button, Check, Icon, Tag, Avatar, Progress) + `EditableCell` + `defaultRendererRegistry` (canonical) |
| `@topgrid/grid-features` | Filter UI (Text/Number/Date/Select) + `useMultiSort` + filter primitives |
| `@topgrid/grid-export` | Excel / CSV / PDF export + clipboard + print |

### Pro packages (7)

| Package | Description |
|---------|-------------|
| `@topgrid/grid-pro-tracking` | Change tracking + `ChangeTrackingGrid` |
| `@topgrid/grid-pro-range` | Cell range selection + keyboard nav + clipboard + drag-fill |
| `@topgrid/grid-pro-datamap` | DataMap / AsyncDataMap (lookup tables, async loading) |
| `@topgrid/grid-pro-merging` | Cell merging (rowSpan) |
| `@topgrid/grid-pro-header` | Multi-row grouped headers + `GroupedHeaderGrid` (canonical) |
| `@topgrid/grid-pro-agg` | Aggregation + grouping + `GroupPanel` |
| `@topgrid/grid-pro-master` | Master-detail row expansion + context menu + row pinning + expanded persistence |

### Infrastructure (1)

| Package | Description |
|---------|-------------|
| `@topgrid/grid-license` | License gate utilities (`setLicenseKey`, `checkLicense`, `Watermark`) |

## Usage

```ts
// Single entry — convenient for app-side consumers using both MIT and Pro features.
import { Grid, createColumns, NumberCell, StatusBadgeCell, setLicenseKey } from '@topgrid/grid';
import type { GridProps, TopgridColumnDef } from '@topgrid/grid';
```

```ts
// Pro features remain license-gated at module load (each sub-package runs `checkLicense()`).
import { setLicenseKey } from '@topgrid/grid';
import { MasterDetailGrid, RangeSelectGrid } from '@topgrid/grid';

setLicenseKey('your-license-key');
```

## MIT-only consumption

Importing from `@topgrid/grid` brings in the full Pro surface (license-gated at runtime).
For **MIT-only** applications (no license key, no Pro packages installed), import the
underlying MIT packages directly:

```bash
pnpm add @topgrid/grid-core @topgrid/grid-renderers @topgrid/grid-features @topgrid/grid-export
```

```ts
import { Grid, createColumns } from '@topgrid/grid-core';
import { NumberCell } from '@topgrid/grid-renderers';
```

## Tree-shaking

The meta facade is built with `tsup` + `treeshake: true` and emits a thin re-export
shim (~1.5 KB dist). Consumer bundlers (Vite, esbuild, webpack) follow the re-export
chain and bundle only what your app actually imports.

Side-effect imports (notably `@topgrid/grid-renderers`' `wireDefaultRenderers()` — see
ADR-MOD-GRID-REFACTOR-2026-05-17-002) are preserved via the `sideEffects` field.

## Collision handling

The facade resolves the 5 cross-package name collisions (probed via TypeScript) by
canonicalizing exports:

| Identifier | Canonical source | Reason |
|------------|------------------|--------|
| `defaultRendererRegistry`, `registerRenderer` | `@topgrid/grid-renderers` | grid-core's are placeholder fallback (ADR-002 D-3A) |
| `TopgridColumnDef` (type) | `@topgrid/grid-core` | grid-pro-datamap's alias is `@deprecated` (ADR-006) |
| `GroupedHeaderGrid`, `GroupedHeaderGridProps` | `@topgrid/grid-pro-header` | grid-core's `legacy/` are C-6 alias |

The 6 `@deprecated` APIs from `@topgrid/grid-core` (per ADR-013) are **not** re-exported
through the facade:

- `createTopgridColumnHelper`
- `createGroupedColumns`, `TopgridColumnGroup`
- `useColumnPersistence`
- `ColumnVisibilityMenu`, `ColumnVisibilityMenuProps`

To use them during deprecation, import directly from `@topgrid/grid-core`.

## Peer Dependencies

| Package | Version |
|---------|---------|
| `@tanstack/react-table` | `^8.0.0` |
| `@tanstack/react-virtual` | `^3.0.0` (optional) |
| `react` | `^18.0.0 \|\| ^19.0.0` |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` |
| `xlsx` | `^0.18.0` (optional) |
| `jspdf` | `^2.5.0` (optional) |
| `jspdf-autotable` | `^3.5.0` (optional) |

## License

`SEE LICENSE IN EULA` (meta includes Pro packages). For MIT-only consumption, install
the four MIT packages individually — see [MIT-only consumption](#mit-only-consumption).

---

[Documentation](https://grid.tomis.dev) | [API Reference](https://grid.tomis.dev/api)
