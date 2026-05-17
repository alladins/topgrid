# @tomis/grid-pro-agg

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
  - @tomis/grid-license@0.1.0

## 0.1.0 — 2026-05-17

### Added

- License enforcement — `AggregationGrid` now reads `useLicenseStatus()` and renders `<Watermark required />` in its wrapper `<div className="overflow-x-auto relative">` when the license is invalid or `watermarkRequired === true`. Applies to both virtualized and non-virtualized render paths. (ADR-MOD-GRID-REFACTOR-2026-05-17-001)

---

## 0.0.0

Initial scaffold.
