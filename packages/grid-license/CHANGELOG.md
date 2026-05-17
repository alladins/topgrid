# @tomis/grid-license

## 0.1.0 — 2026-05-17

### Added
- `useLicenseStatus()` — React hook returning the current `LicenseCheckResult`. Backed by `useSyncExternalStore`; re-renders subscribers when license state changes (e.g. async `setLicenseKey` resolution). Internally memoises the snapshot to satisfy React's stability requirement (Strict Mode safe). (ADR-MOD-GRID-REFACTOR-2026-05-17-001)
- `useWatermarkEnforcement()` — void registration hook that mounts a singleton `<Watermark>` portal at `document.body` via `createRoot`. Ref-counted across mounts so per-cell renderers (e.g. `DataMapCell`) trigger exactly one portal regardless of cell count. (ADR-MOD-GRID-REFACTOR-2026-05-17-001 / sub-spec D-D)
- `subscribeLicense(listener)` — imperative subscription API for license state changes. Backing primitive for both hooks above.

---

## 0.0.0

Initial scaffold.
