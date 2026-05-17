---
'@tomis/grid-renderers': minor
'@tomis/grid-core': patch
---

ADR-MOD-GRID-REFACTOR-2026-05-17-002 — cross-package renderer wiring.

`@tomis/grid-renderers` now auto-registers 6 cell adapters into
`@tomis/grid-core`'s `defaultRendererRegistry` via a side-effect on import:
`text` / `number` / `date` / `dateTime` (with `format: 'datetime'`) / `badge` /
`link`. After `import '@tomis/grid-renderers'`, `createColumns({ type: 'number' })`
renders the real `NumberCell` instead of the previous `String(value)` placeholder.

- New peerDependency on `grid-renderers`: `@tomis/grid-core` (workspace:*).
- New `sideEffects` array on `grid-renderers/package.json` so bundlers preserve the wiring import.
- grid-core placeholders remain as graceful fallback when grid-renderers is not imported.
- `boolean` keeps Y/N. `icon` / `checkbox` remain placeholder (structural + bypass).
- 5 extras (button/tag/avatar/progress + statusBadge/check aliases) deferred to ADR-018.

R-A + D-1A + D-2A + D-3A + D-4A combination.
