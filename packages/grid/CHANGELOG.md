# @topgrid/grid

## 1.0.0

### Major Changes

- **grid-core 1.0 lockstep 릴리스**. 13-패키지(grid-core·grid·grid-features·grid-renderers·grid-sizing·
  grid-pro-{header,master,pivot,sheet,tracking,edit-plus,filter,serverside})가 1.0.0 으로 함께 발행.
  BREAKING 2종 — (1) 컬럼 빌더 키 안전(ADR-007 D1: 데이터바운드 `id`=`keyof TData` 강제), (2) 셀/필터
  콜백 clean 타입(ADR-006 D3: TanStack `Cell`/`Column` 제거 → `GridCellContext`/`GridFilterColumn`).
  마이그레이션 상세 = `@topgrid/grid-core` CHANGELOG 1.0.0. 런타임 동작 불변(타입 표면 + adapter 배선만).

## 0.1.0

### Minor Changes

- f5ea968: Activate meta package facade — re-export public API of 12 underlying packages
  (4 MIT + 7 Pro + 1 infrastructure). Previously placeholder `export {};`.

  Name collisions resolved by prior ADRs and canonical-source selection:

  - `defaultRendererRegistry` / `registerRenderer` → `@topgrid/grid-renderers` (ADR-002 D-3A).
  - `TomisColumnDef` → `@topgrid/grid-core` (ADR-006 rename).
  - `GroupedHeaderGrid` / `GroupedHeaderGridProps` → `@topgrid/grid-pro-header`.

  6 `@deprecated` grid-core APIs excluded from the facade per ADR-013 explicit prohibition.

  License retained as `SEE LICENSE IN EULA` (Pro inclusion). MIT-only consumers should
  import the underlying MIT packages directly.

  ADR-MOD-GRID-REFACTOR-2026-05-17-003.

### Patch Changes

- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
  - @topgrid/grid-license@0.1.0
  - @topgrid/grid-pro-agg@0.1.0
  - @topgrid/grid-pro-datamap@0.2.0
  - @topgrid/grid-pro-header@0.1.0
  - @topgrid/grid-pro-master@1.0.0
  - @topgrid/grid-pro-merging@1.0.0
  - @topgrid/grid-pro-range@0.1.0
  - @topgrid/grid-pro-tracking@1.0.0
  - @topgrid/grid-renderers@1.0.0
  - @topgrid/grid-core@0.1.0
  - @topgrid/grid-export@0.2.0
  - @topgrid/grid-features@0.3.0

## 0.1.0 — 2026-05-17

### Added

- Real meta facade — re-exports the public API of all 12 underlying packages
  (4 MIT + 7 Pro + 1 infrastructure). Replaces the prior `export {};` placeholder
  per ADR-MOD-GRID-REFACTOR-2026-05-17-003 (Wave 4).
- `sideEffects` field includes the meta's own dist entries so consumer bundlers
  preserve `@topgrid/grid-renderers`' `wireDefaultRenderers()` auto-wiring (ADR-002).
- 12 workspace `dependencies` added (`workspace:*`): grid-core, grid-renderers,
  grid-features, grid-export, grid-license, grid-pro-tracking, grid-pro-range,
  grid-pro-datamap, grid-pro-merging, grid-pro-header, grid-pro-agg, grid-pro-master.
- README rewritten with: 13-package inventory + license breakdown, MIT-only
  consumption guidance, tree-shaking + side-effect notes, collision-handling table.

### Notes

- **License retained as `SEE LICENSE IN EULA`** — the meta facade aggregates Pro
  packages. For MIT-only consumption, import the underlying MIT packages directly
  (`@topgrid/grid-core`, `@topgrid/grid-renderers`, `@topgrid/grid-features`, `@topgrid/grid-export`).
- **Name collisions resolved (probe: 5 TS2308 errors → 0)**:
  - `defaultRendererRegistry`, `registerRenderer` — canonical source = `@topgrid/grid-renderers`
    (grid-core's are placeholder fallback per ADR-002 D-3A).
  - `TomisColumnDef` (type) — canonical = `@topgrid/grid-core` (grid-pro-datamap's alias
    is `@deprecated` per ADR-006).
  - `GroupedHeaderGrid`, `GroupedHeaderGridProps` — canonical = `@topgrid/grid-pro-header`
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
