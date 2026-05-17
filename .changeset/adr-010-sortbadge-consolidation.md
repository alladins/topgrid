---
'@tomis/grid-core': minor
'@tomis/grid-features': minor
---

ADR-MOD-GRID-REFACTOR-2026-05-17-010 — `SortBadge` 중복 제거 (grid-core/internal 단일화).

Consolidates the ~95%-identical `SortBadge` implementations in `grid-core/internal/`
and `grid-features/multi-sort/` into a single canonical source in grid-core.

- `grid-core`: `SortBadge` and `SortBadgeProps` graduated to public API (minor add).
  The implementation is the superset of the previous internal version: accepts an
  optional `className` prop (Tailwind override, C-5). Existing Grid.tsx call sites
  (`<SortBadge sortIndex={sortIndex} />`) are unaffected — prop is optional.
  `SortBadgeProps` moved from `@tomis/grid-features/multi-sort/types.ts`.
- `grid-features`: `SortBadge` and `SortBadgeProps` are now deprecation aliases
  re-exporting from `@tomis/grid-core`. Public surface unchanged. Aliases will be
  removed in the next major.
