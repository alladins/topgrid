# @topgrid/grid-license

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

- f5ea968: feat(grid-pro-master): add MasterDetailGrid with expand/collapse row detail (MOD-GRID-16/G-001)

  - `<MasterDetailGrid<TData>>` — Pro-tier Master-Detail row expansion component
  - `renderDetailRow?: RenderDetailRow<TData>` — detail row render function prop
  - `masterDetail?: MasterDetailOptions<TData>` — controlled/uncontrolled expanded state
    - Controlled: `expandedRowKeys` + `onExpandChange` callback
    - Uncontrolled: internal `useState<ExpandedState>`
  - Imperative handle via `ref`: `expandAll()`, `collapseAll()` + full `GridHandle<TData>` API
  - `ExpandToggleCell` — internal expand/collapse toggle button with depth-based indent (INDENT_PX=16)
  - `DetailRow` — full-width `<tr data-detail-row>` for expanded master row content
  - `verifyLicense('@topgrid/grid-pro-master')` called at module level (Pro EULA guard)
  - `@topgrid/grid-core` and `@topgrid/grid-license` added to peerDependencies

  `@topgrid/grid-core`: `GridHandle<TData>` extended with optional `expandAll?(): void` and `collapseAll?(): void` (after `scrollTo`) — backward-compatible (optional methods, base `<Grid>` unaffected)

  `@topgrid/grid-license`: add no-op `verifyLicense(_packageName: string): void` export stub (MOD-GRID-99-A deferred)

## 0.1.0 — 2026-05-17

### Added

- `useLicenseStatus()` — React hook returning the current `LicenseCheckResult`. Backed by `useSyncExternalStore`; re-renders subscribers when license state changes (e.g. async `setLicenseKey` resolution). Internally memoises the snapshot to satisfy React's stability requirement (Strict Mode safe). (ADR-MOD-GRID-REFACTOR-2026-05-17-001)
- `useWatermarkEnforcement()` — void registration hook that mounts a singleton `<Watermark>` portal at `document.body` via `createRoot`. Ref-counted across mounts so per-cell renderers (e.g. `DataMapCell`) trigger exactly one portal regardless of cell count. (ADR-MOD-GRID-REFACTOR-2026-05-17-001 / sub-spec D-D)
- `subscribeLicense(listener)` — imperative subscription API for license state changes. Backing primitive for both hooks above.

---

## 0.0.0

Initial scaffold.
