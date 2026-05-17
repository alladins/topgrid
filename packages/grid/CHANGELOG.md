# @tomis/grid

## 0.1.0 — 2026-05-17

### Added

- Real meta facade — re-exports the public API of all 12 underlying packages
  (4 MIT + 7 Pro + 1 infrastructure). Replaces the prior `export {};` placeholder
  per ADR-MOD-GRID-REFACTOR-2026-05-17-003 (Wave 4).
- `sideEffects` field includes the meta's own dist entries so consumer bundlers
  preserve `@tomis/grid-renderers`' `wireDefaultRenderers()` auto-wiring (ADR-002).
- 12 workspace `dependencies` added (`workspace:*`): grid-core, grid-renderers,
  grid-features, grid-export, grid-license, grid-pro-tracking, grid-pro-range,
  grid-pro-datamap, grid-pro-merging, grid-pro-header, grid-pro-agg, grid-pro-master.
- README rewritten with: 13-package inventory + license breakdown, MIT-only
  consumption guidance, tree-shaking + side-effect notes, collision-handling table.

### Notes

- **License retained as `SEE LICENSE IN EULA`** — the meta facade aggregates Pro
  packages. For MIT-only consumption, import the underlying MIT packages directly
  (`@tomis/grid-core`, `@tomis/grid-renderers`, `@tomis/grid-features`, `@tomis/grid-export`).
- **Name collisions resolved (probe: 5 TS2308 errors → 0)**:
  - `defaultRendererRegistry`, `registerRenderer` — canonical source = `@tomis/grid-renderers`
    (grid-core's are placeholder fallback per ADR-002 D-3A).
  - `TomisColumnDef` (type) — canonical = `@tomis/grid-core` (grid-pro-datamap's alias
    is `@deprecated` per ADR-006).
  - `GroupedHeaderGrid`, `GroupedHeaderGridProps` — canonical = `@tomis/grid-pro-header`
    (grid-core's `legacy/` versions are C-6 alias).
- **6 `@deprecated` grid-core APIs excluded** per ADR-013 explicit prohibition:
  `createTomisColumnHelper`, `createGroupedColumns`, `TomisColumnGroup`,
  `useColumnPersistence`, `ColumnVisibilityMenu`, `ColumnVisibilityMenuProps`.
- Build artifact is a thin re-export shim (~1.5 KB ESM dist + ~5.7 KB CJS) — consumer
  bundlers follow the chain. `pnpm size-limit` measures meta dist at **80.2 kB / 150 kB**
  limit (Pro package surface + transitive dependencies, brotli compressed).
- Implementer: refactor-analysis-2026-05-17.md §6.4 + §1.1.

## 0.0.0

Initial scaffold.
