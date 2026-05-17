# @tomis/grid-pro-header

## Unreleased (ADR-016 + ADR-008 — Wave 3 — 2026-05-17)

### Changed

- **`GroupedHeaderGridProps.onRowClick`** signature updated to
  `(row: TData, event: MouseEvent<HTMLTableRowElement>) => void` (ADR-016).
  JSX `onClick` handler now passes the native event as the second argument.
- Inline `GridPaginationOptions` and `GridRowSelectionOptions` aliases removed
  from `legacy/GroupedHeaderGrid.tsx`; types are now imported from
  `@tomis/grid-core` (ADR-008). `rowSelection` prop is now correctly typed as
  `GridRowSelectionOptions<TData>`.
- `@tomis/grid-core` added as a workspace dependency (required by the import
  above).

## 0.1.0 — 2026-05-17

### Added
- License enforcement — `MultiRowHeader` now reads `useLicenseStatus()` and prepends a watermark `<tr><th colSpan=N><Watermark required /></th></tr>` row inside `<thead>` when the license is invalid or `watermarkRequired === true`. When `enableStickyHeader === true`, the watermark row is rendered with `sticky top-0 z-20` so it stays visible on scroll (sub-spec §9.3=a). Pattern: H-D (HTML-valid, no portal). (ADR-MOD-GRID-REFACTOR-2026-05-17-001 / sub-spec)

### Changed
- **`<thead>` content**: when invalid, the header gains one extra `<tr>` at the top. External CSS selectors using `thead > tr:first-child` may now select the watermark row. (sub-spec §7.1 risk)

---

## 0.0.0

Initial scaffold.
