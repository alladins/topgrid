# @tomis/grid-pro-agg

## 0.1.0 — 2026-05-17

### Added
- License enforcement — `AggregationGrid` now reads `useLicenseStatus()` and renders `<Watermark required />` in its wrapper `<div className="overflow-x-auto relative">` when the license is invalid or `watermarkRequired === true`. Applies to both virtualized and non-virtualized render paths. (ADR-MOD-GRID-REFACTOR-2026-05-17-001)

---

## 0.0.0

Initial scaffold.
