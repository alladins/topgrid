# @tomis/grid-pro-merging

## 0.1.0

### Minor Changes

- f5ea968: Wire `<Watermark>` rendering in all 7 Pro Grid components when license is invalid
  or `watermarkRequired === true`. Adds `useLicenseStatus()` hook and
  `useWatermarkEnforcement()` void hook to `grid-license`. `MultiRowHeader` uses
  the thead-row watermark pattern (H-D, HTML-valid, no portal), `DataMapCell`
  uses a module-level singleton portal via the void registration hook (D-D,
  ref-counted createRoot 1회 mount). Other five Pro components render
  `<Watermark>` inline inside a wrapper `<div className="relative">`.

  ADR-MOD-GRID-REFACTOR-2026-05-17-001 — option A + (b) granularity + H-D + D-D.

### Patch Changes

- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
  - @tomis/grid-license@0.1.0
  - @tomis/grid-core@0.1.0

## 0.1.0 — 2026-05-17

### Added

- License enforcement — `MergingGrid` now reads `useLicenseStatus()` and renders `<Watermark required />` when the license is invalid or `watermarkRequired === true`. The non-virtualized render path was previously returning `<table>` directly; it now wraps with `<div className="relative">` (user-supplied `className` remains on `<table>`). The virtualized path uses the existing `position: relative` outer `<div>`. (ADR-MOD-GRID-REFACTOR-2026-05-17-001)

### Changed

- **non-virtualized path DOM**: the top-level node is now `<div className="relative">` wrapping `<table>` instead of `<table>` directly. External CSS selectors that targeted the `<table>` as the root may need adjustment. (sub-spec §9.2=a)

---

## 0.0.0

Initial scaffold.
