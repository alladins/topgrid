---
'@tomis/grid-pro-datamap': minor
---

Rename `TomisColumnDef<TData>` to `DataMapColumnDef<TData>` for name disambiguation
with `grid-core` (ADR-MOD-GRID-REFACTOR-2026-05-17-006). The old `TomisColumnDef` name
is retained as a deprecation alias for one minor cycle and will be removed in the next
major version (POL-COMPAT §3).
