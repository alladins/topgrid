---
'@tomis/grid-core': minor
'@tomis/grid-pro-master': minor
---

ADR-MOD-GRID-REFACTOR-2026-05-17-007 (Wave 3) — extract storage adapter
primitives to single source.

The SSR-guard + try/catch + JSON parse/stringify + QuotaExceededError boilerplate
duplicated across 4 persistence hooks (`useStoragePersist`,
`useColumnPersistence`, `useColumnOrderPersist`, `useExpandedPersistence`) is
consolidated into a single `internal/storage` adapter under `@tomis/grid-core`.

- `grid-core`: adds a new `./internal/storage` subpath export
  (`@tomis/grid-core/internal/storage`) exposing `getStorage`, `readJson`,
  `readRaw`, `writeJson`, `writeRaw`, `removeKey`, type `StorageType`. Marked
  `@internal` — sister packages in this monorepo consume it to share the
  Web-Storage I/O layer. **Not part of the semver-stable public API**;
  application code must not import from this subpath.
- `grid-pro-master`: `useExpandedPersistence` internal implementation now
  routes Web Storage I/O through the new subpath.
- 4 hook public APIs (signatures, return shapes, option fields, envelope
  formats, debounce timing, fallback semantics) unchanged. Pattern duplication
  reduced from 4 sites to 1 (drift prevention).

Semver: minor (internal refactor + new internal-only subpath export). No
breaking changes.
