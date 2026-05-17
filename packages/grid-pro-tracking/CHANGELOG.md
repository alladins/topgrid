# @tomis/grid-pro-tracking

## 0.1.0 — 2026-05-17

### Added
- License enforcement — `ChangeTrackingGrid` (legacy alias) now reads `useLicenseStatus()` and renders `<Watermark required />` when the license is invalid or `watermarkRequired === true`. (ADR-MOD-GRID-REFACTOR-2026-05-17-001)

### Changed
- **DOM**: `ChangeTrackingGrid` previously returned `<Grid>` directly; it now wraps with `<div className="relative">` to provide a positioning context for the `<Watermark>` overlay. External CSS selectors that targeted `<Grid>`'s root element as the alias root may need adjustment. (sub-spec §9.2=a)

---

## 0.0.0

Initial scaffold.
