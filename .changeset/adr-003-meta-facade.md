---
'@tomis/grid': minor
---

Activate meta package facade — re-export public API of 12 underlying packages
(4 MIT + 7 Pro + 1 infrastructure). Previously placeholder `export {};`.

Name collisions resolved by prior ADRs and canonical-source selection:
- `defaultRendererRegistry` / `registerRenderer` → `@tomis/grid-renderers` (ADR-002 D-3A).
- `TomisColumnDef` → `@tomis/grid-core` (ADR-006 rename).
- `GroupedHeaderGrid` / `GroupedHeaderGridProps` → `@tomis/grid-pro-header`.

6 `@deprecated` grid-core APIs excluded from the facade per ADR-013 explicit prohibition.

License retained as `SEE LICENSE IN EULA` (Pro inclusion). MIT-only consumers should
import the underlying MIT packages directly.

ADR-MOD-GRID-REFACTOR-2026-05-17-003.
