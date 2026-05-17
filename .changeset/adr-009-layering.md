---
'@tomis/grid-core': minor
'@tomis/grid-features': minor
---

ADR-MOD-GRID-REFACTOR-2026-05-17-009 (옵션 A) — grid-core ↔ grid-features layering 정리.

Move `useColumnDrag`, `useColumnOrderPersist`, `DropIndicator`, `SortClearButton`
(and supporting types `UseColumnDragProps`, `UseColumnDragReturn`, `DragThProps`,
`UseColumnOrderPersistProps`, `SortClearButtonProps`) from `@tomis/grid-features`
to `@tomis/grid-core/internal/`, exposed via grid-core public API.

- `grid-core`: new public exports (minor add). `@tomis/grid-features` removed
  from `dependencies` — architectural inversion해소.
- `grid-features`: retains deprecation aliases for one minor cycle. Adds
  `@tomis/grid-core` as a workspace dependency to back the aliases. Public
  surface unchanged; consumers should migrate imports to `@tomis/grid-core`.
  Aliases will be removed in the next major.
