# @tomis/grid

> **Meta package facade** — re-exports the public API of all 13 underlying packages
> (`@tomis/grid-*`). Activates a single entry point per ADR-MOD-GRID-REFACTOR-2026-05-17-003.

## What's Included

### MIT packages (4)

| Package | Description |
|---------|-------------|
| `@tomis/grid-core` | TanStack Table abstraction + `<Grid>` + `useGridState` + legacy aliases (BaseGrid, VirtualGrid, ColumnPinGrid, TreeGrid) + pagination + `createColumns` + column-drag + multi-sort base |
| `@tomis/grid-renderers` | Cell renderers (Text, Number, Date, StatusBadge, Link, Button, Check, Icon, Tag, Avatar, Progress) + `EditableCell` + `defaultRendererRegistry` (canonical) |
| `@tomis/grid-features` | Filter UI (Text/Number/Date/Select) + `useMultiSort` + filter primitives |
| `@tomis/grid-export` | Excel / CSV / PDF export + clipboard + print |

### Pro packages (7)

| Package | Description |
|---------|-------------|
| `@tomis/grid-pro-tracking` | Change tracking + `ChangeTrackingGrid` |
| `@tomis/grid-pro-range` | Cell range selection + keyboard nav + clipboard + drag-fill |
| `@tomis/grid-pro-datamap` | DataMap / AsyncDataMap (lookup tables, async loading) |
| `@tomis/grid-pro-merging` | Cell merging (rowSpan) |
| `@tomis/grid-pro-header` | Multi-row grouped headers + `GroupedHeaderGrid` (canonical) |
| `@tomis/grid-pro-agg` | Aggregation + grouping + `GroupPanel` |
| `@tomis/grid-pro-master` | Master-detail row expansion + context menu + row pinning + expanded persistence |

### Infrastructure (1)

| Package | Description |
|---------|-------------|
| `@tomis/grid-license` | License gate utilities (`setLicenseKey`, `checkLicense`, `Watermark`) |

## Usage

```ts
// Single entry — convenient for app-side consumers using both MIT and Pro features.
import { Grid, createColumns, NumberCell, StatusBadgeCell, setLicenseKey } from '@tomis/grid';
import type { GridProps, TomisColumnDef } from '@tomis/grid';
```

```ts
// Pro features remain license-gated at module load (each sub-package runs `checkLicense()`).
import { setLicenseKey } from '@tomis/grid';
import { MasterDetailGrid, RangeSelectGrid } from '@tomis/grid';

setLicenseKey('your-license-key');
```

## MIT-only consumption

Importing from `@tomis/grid` brings in the full Pro surface (license-gated at runtime).
For **MIT-only** applications (no license key, no Pro packages installed), import the
underlying MIT packages directly:

```bash
pnpm add @tomis/grid-core @tomis/grid-renderers @tomis/grid-features @tomis/grid-export
```

```ts
import { Grid, createColumns } from '@tomis/grid-core';
import { NumberCell } from '@tomis/grid-renderers';
```

## Tree-shaking

The meta facade is built with `tsup` + `treeshake: true` and emits a thin re-export
shim (~1.5 KB dist). Consumer bundlers (Vite, esbuild, webpack) follow the re-export
chain and bundle only what your app actually imports.

Side-effect imports (notably `@tomis/grid-renderers`' `wireDefaultRenderers()` — see
ADR-MOD-GRID-REFACTOR-2026-05-17-002) are preserved via the `sideEffects` field.

## Collision handling

The facade resolves the 5 cross-package name collisions (probed via TypeScript) by
canonicalizing exports:

| Identifier | Canonical source | Reason |
|------------|------------------|--------|
| `defaultRendererRegistry`, `registerRenderer` | `@tomis/grid-renderers` | grid-core's are placeholder fallback (ADR-002 D-3A) |
| `TomisColumnDef` (type) | `@tomis/grid-core` | grid-pro-datamap's alias is `@deprecated` (ADR-006) |
| `GroupedHeaderGrid`, `GroupedHeaderGridProps` | `@tomis/grid-pro-header` | grid-core's `legacy/` are C-6 alias |

The 6 `@deprecated` APIs from `@tomis/grid-core` (per ADR-013) are **not** re-exported
through the facade:

- `createTomisColumnHelper`
- `createGroupedColumns`, `TomisColumnGroup`
- `useColumnPersistence`
- `ColumnVisibilityMenu`, `ColumnVisibilityMenuProps`

To use them during deprecation, import directly from `@tomis/grid-core`.

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
