# @topgrid/grid-pro-tracking

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
  - @topgrid/grid-license@0.1.0
  - @topgrid/grid-core@0.1.0

## 0.1.0 — 2026-05-17

### Added

- License enforcement — `ChangeTrackingGrid` (legacy alias) now reads `useLicenseStatus()` and renders `<Watermark required />` when the license is invalid or `watermarkRequired === true`. (ADR-MOD-GRID-REFACTOR-2026-05-17-001)

### Changed

- **DOM**: `ChangeTrackingGrid` previously returned `<Grid>` directly; it now wraps with `<div className="relative">` to provide a positioning context for the `<Watermark>` overlay. External CSS selectors that targeted `<Grid>`'s root element as the alias root may need adjustment. (sub-spec §9.2=a)

---

## 0.0.0

Initial scaffold.
