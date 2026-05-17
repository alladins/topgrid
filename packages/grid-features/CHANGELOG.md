# @tomis/grid-features

## Unreleased (ADR-010 — 2026-05-17)

### Deprecated

- `SortBadge` — moved to `@tomis/grid-core` (ADR-010). Use
  `import { SortBadge } from '@tomis/grid-core'` instead. Removed in next major.
- `SortBadgeProps` — moved to `@tomis/grid-core` (ADR-010). Use
  `import type { SortBadgeProps } from '@tomis/grid-core'` instead. Removed in next major.

### Notes

- Public API surface unchanged: `SortBadge` and `SortBadgeProps` remain accessible
  from `@tomis/grid-features` via deprecation alias. Runtime + type behavior identical.
  semver: minor.

---

## Unreleased (ADR-009 — 2026-05-17)

### Deprecated (moved to `@tomis/grid-core` per ADR-MOD-GRID-REFACTOR-2026-05-17-009 옵션 A)

The following exports are now deprecation aliases that re-export from
`@tomis/grid-core`. Update imports — these aliases will be removed in the next
major.

- `useColumnDrag` — use `import { useColumnDrag } from '@tomis/grid-core'` instead.
- `useColumnOrderPersist` — use `import { useColumnOrderPersist } from '@tomis/grid-core'` instead.
- `DropIndicator` — use `import { DropIndicator } from '@tomis/grid-core'` instead.
- `SortClearButton` — use `import { SortClearButton } from '@tomis/grid-core'` instead.
- Types: `UseColumnDragProps`, `UseColumnDragReturn`, `DragThProps`,
  `UseColumnOrderPersistProps`, `SortClearButtonProps`.

### Added

- `@tomis/grid-core` added to `dependencies` (workspace:*) — required by the
  deprecation aliases above. This reverses the previous architectural inversion
  (grid-core → grid-features hard dep is gone; grid-features → grid-core is the
  natural layering).

### Notes

- Public surface of grid-features is unchanged in shape. Runtime + type
  behavior is identical (re-exported from grid-core). semver: minor.

## 0.0.0

Initial scaffold.
