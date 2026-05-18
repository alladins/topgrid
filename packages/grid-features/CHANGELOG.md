# @topgrid/grid-features

## 0.3.0

### Minor Changes

- f5ea968: ADR-MOD-GRID-REFACTOR-2026-05-17-009 (옵션 A) — grid-core ↔ grid-features layering 정리.

  Move `useColumnDrag`, `useColumnOrderPersist`, `DropIndicator`, `SortClearButton`
  (and supporting types `UseColumnDragProps`, `UseColumnDragReturn`, `DragThProps`,
  `UseColumnOrderPersistProps`, `SortClearButtonProps`) from `@topgrid/grid-features`
  to `@topgrid/grid-core/internal/`, exposed via grid-core public API.

  - `grid-core`: new public exports (minor add). `@topgrid/grid-features` removed
    from `dependencies` — architectural inversion해소.
  - `grid-features`: retains deprecation aliases for one minor cycle. Adds
    `@topgrid/grid-core` as a workspace dependency to back the aliases. Public
    surface unchanged; consumers should migrate imports to `@topgrid/grid-core`.
    Aliases will be removed in the next major.

- f5ea968: ADR-MOD-GRID-REFACTOR-2026-05-17-010 — `SortBadge` 중복 제거 (grid-core/internal 단일화).

  Consolidates the ~95%-identical `SortBadge` implementations in `grid-core/internal/`
  and `grid-features/multi-sort/` into a single canonical source in grid-core.

  - `grid-core`: `SortBadge` and `SortBadgeProps` graduated to public API (minor add).
    The implementation is the superset of the previous internal version: accepts an
    optional `className` prop (Tailwind override, C-5). Existing Grid.tsx call sites
    (`<SortBadge sortIndex={sortIndex} />`) are unaffected — prop is optional.
    `SortBadgeProps` moved from `@topgrid/grid-features/multi-sort/types.ts`.
  - `grid-features`: `SortBadge` and `SortBadgeProps` are now deprecation aliases
    re-exporting from `@topgrid/grid-core`. Public surface unchanged. Aliases will be
    removed in the next major.

### Patch Changes

- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
  - @topgrid/grid-core@0.1.0

## Unreleased (ADR-010 — 2026-05-17)

### Deprecated

- `SortBadge` — moved to `@topgrid/grid-core` (ADR-010). Use
  `import { SortBadge } from '@topgrid/grid-core'` instead. Removed in next major.
- `SortBadgeProps` — moved to `@topgrid/grid-core` (ADR-010). Use
  `import type { SortBadgeProps } from '@topgrid/grid-core'` instead. Removed in next major.

### Notes

- Public API surface unchanged: `SortBadge` and `SortBadgeProps` remain accessible
  from `@topgrid/grid-features` via deprecation alias. Runtime + type behavior identical.
  semver: minor.

---

## Unreleased (ADR-009 — 2026-05-17)

### Deprecated (moved to `@topgrid/grid-core` per ADR-MOD-GRID-REFACTOR-2026-05-17-009 옵션 A)

The following exports are now deprecation aliases that re-export from
`@topgrid/grid-core`. Update imports — these aliases will be removed in the next
major.

- `useColumnDrag` — use `import { useColumnDrag } from '@topgrid/grid-core'` instead.
- `useColumnOrderPersist` — use `import { useColumnOrderPersist } from '@topgrid/grid-core'` instead.
- `DropIndicator` — use `import { DropIndicator } from '@topgrid/grid-core'` instead.
- `SortClearButton` — use `import { SortClearButton } from '@topgrid/grid-core'` instead.
- Types: `UseColumnDragProps`, `UseColumnDragReturn`, `DragThProps`,
  `UseColumnOrderPersistProps`, `SortClearButtonProps`.

### Added

- `@topgrid/grid-core` added to `dependencies` (workspace:\*) — required by the
  deprecation aliases above. This reverses the previous architectural inversion
  (grid-core → grid-features hard dep is gone; grid-features → grid-core is the
  natural layering).

### Notes

- Public surface of grid-features is unchanged in shape. Runtime + type
  behavior is identical (re-exported from grid-core). semver: minor.

## 0.0.0

Initial scaffold.
