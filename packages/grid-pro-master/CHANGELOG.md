# @tomis/grid-pro-master

## Unreleased (ADR-007 — Wave 3 — 2026-05-17)

### Internal (no behavioural change)

- `useExpandedPersistence` — SSR guard + `localStorage` / `sessionStorage`
  try/catch + JSON.parse / stringify + QuotaExceededError boilerplate now
  delegated to `@tomis/grid-core/internal/storage` adapter (consumed via the
  new `./internal/storage` subpath). Public API (`UseExpandedPersistenceOptions`,
  returned `[expanded, setExpanded]` tuple), in-memory fallback semantics,
  one-time `warnedUnavailable` dev warning, and QuotaExceededError dev warning
  unchanged. (ADR-MOD-GRID-REFACTOR-2026-05-17-007)

---

## 0.1.0 — 2026-05-17

### Added
- License enforcement — `MasterDetailGrid` now reads `useLicenseStatus()` and renders `<Watermark required />` when the license is invalid or `watermarkRequired === true`. The outer wrapper `<div>` className is merged with `relative` (user-supplied `className` preserved). (ADR-MOD-GRID-REFACTOR-2026-05-17-001)

### Changed
- **DOM**: the outer `<div>` now always carries the `relative` class (merged with `props.className ?? ''`). Previously, callers omitting `className` produced a bare `<div>`; now they receive `<div class="relative">`. Visual impact is normally zero, but stylesheets that target the root by class absence may need adjustment.

---

## 0.0.0

Initial scaffold.
