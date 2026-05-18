# @topgrid/grid-pro-header

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

- f5ea968: ADR-016: Unify `onRowClick` signature — `BaseGridProps` and all legacy alias components now use `(row: TData, event: MouseEvent<HTMLTableRowElement>) => void` (2-arg). TypeScript contravariance keeps existing 1-arg callbacks assignable without changes.

  ADR-008: `grid-pro-header` legacy `GroupedHeaderGrid` inline type aliases removed; `GridPaginationOptions` and `GridRowSelectionOptions` are now imported from `@topgrid/grid-core` directly.

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

## Unreleased (ADR-016 + ADR-008 — Wave 3 — 2026-05-17)

### Changed

- **`GroupedHeaderGridProps.onRowClick`** signature updated to
  `(row: TData, event: MouseEvent<HTMLTableRowElement>) => void` (ADR-016).
  JSX `onClick` handler now passes the native event as the second argument.
- Inline `GridPaginationOptions` and `GridRowSelectionOptions` aliases removed
  from `legacy/GroupedHeaderGrid.tsx`; types are now imported from
  `@topgrid/grid-core` (ADR-008). `rowSelection` prop is now correctly typed as
  `GridRowSelectionOptions<TData>`.
- `@topgrid/grid-core` added as a workspace dependency (required by the import
  above).

## 0.1.0 — 2026-05-17

### Added

- License enforcement — `MultiRowHeader` now reads `useLicenseStatus()` and prepends a watermark `<tr><th colSpan=N><Watermark required /></th></tr>` row inside `<thead>` when the license is invalid or `watermarkRequired === true`. When `enableStickyHeader === true`, the watermark row is rendered with `sticky top-0 z-20` so it stays visible on scroll (sub-spec §9.3=a). Pattern: H-D (HTML-valid, no portal). (ADR-MOD-GRID-REFACTOR-2026-05-17-001 / sub-spec)

### Changed

- **`<thead>` content**: when invalid, the header gains one extra `<tr>` at the top. External CSS selectors using `thead > tr:first-child` may now select the watermark row. (sub-spec §7.1 risk)

---

## 0.0.0

Initial scaffold.
