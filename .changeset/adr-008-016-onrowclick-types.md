---
"@tomis/grid-core": minor
"@tomis/grid-pro-header": minor
---

ADR-016: Unify `onRowClick` signature — `BaseGridProps` and all legacy alias components now use `(row: TData, event: MouseEvent<HTMLTableRowElement>) => void` (2-arg). TypeScript contravariance keeps existing 1-arg callbacks assignable without changes.

ADR-008: `grid-pro-header` legacy `GroupedHeaderGrid` inline type aliases removed; `GridPaginationOptions` and `GridRowSelectionOptions` are now imported from `@tomis/grid-core` directly.
