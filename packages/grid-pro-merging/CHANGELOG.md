# @tomis/grid-pro-merging

## 0.1.0 — 2026-05-17

### Added
- License enforcement — `MergingGrid` now reads `useLicenseStatus()` and renders `<Watermark required />` when the license is invalid or `watermarkRequired === true`. The non-virtualized render path was previously returning `<table>` directly; it now wraps with `<div className="relative">` (user-supplied `className` remains on `<table>`). The virtualized path uses the existing `position: relative` outer `<div>`. (ADR-MOD-GRID-REFACTOR-2026-05-17-001)

### Changed
- **non-virtualized path DOM**: the top-level node is now `<div className="relative">` wrapping `<table>` instead of `<table>` directly. External CSS selectors that targeted the `<table>` as the root may need adjustment. (sub-spec §9.2=a)

---

## 0.0.0

Initial scaffold.
