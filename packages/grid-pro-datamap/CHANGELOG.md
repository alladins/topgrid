# @topgrid/grid-pro-datamap

## 0.2.0

### Minor Changes

- f5ea968: Wire `<Watermark>` rendering in all 7 Pro Grid components when license is invalid
  or `watermarkRequired === true`. Adds `useLicenseStatus()` hook and
  `useWatermarkEnforcement()` void hook to `grid-license`. `MultiRowHeader` uses
  the thead-row watermark pattern (H-D, HTML-valid, no portal), `DataMapCell`
  uses a module-level singleton portal via the void registration hook (D-D,
  ref-counted createRoot 1회 mount). Other five Pro components render
  `<Watermark>` inline inside a wrapper `<div className="relative">`.

  ADR-MOD-GRID-REFACTOR-2026-05-17-001 — option A + (b) granularity + H-D + D-D.

- f5ea968: Rename `TomisColumnDef<TData>` to `DataMapColumnDef<TData>` for name disambiguation
  with `grid-core` (ADR-MOD-GRID-REFACTOR-2026-05-17-006). The old `TomisColumnDef` name
  is retained as a deprecation alias for one minor cycle and will be removed in the next
  major version (POL-COMPAT §3).

### Patch Changes

- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
  - @topgrid/grid-license@0.1.0

## 0.3.0 — 2026-05-17

### Added

- License enforcement — `DataMapCell` now calls `useWatermarkEnforcement()` (void hook). When the license is invalid or `watermarkRequired === true`, a singleton `<Watermark>` portal is mounted once at `document.body` via `createRoot`, regardless of cell count (ref-counted). Pattern: D-D (sub-spec). (ADR-MOD-GRID-REFACTOR-2026-05-17-001 / sub-spec)

### Notes

- Per-cell renderers cannot host a `<Watermark>` overlay (architectural constraint — `<span>` rendered inside `<td>`). The singleton portal at `document.body` provides package-level enforcement (sub-spec §6 granularity = (b) 패키지 단위).
- Stories that render `<DataMapCell {...mockCtx} />` as JSX remain valid. Calling `DataMapCell(mockCtx)` as a function (rather than as JSX) is now invalid — hook rules violation. (sub-spec §7.1 risk)

---

## 0.2.0 — 2026-05-17

### Added

- `DataMapColumnDef<TData>` — primary type name for the TanStack `ColumnDef` + `dataMap/selectOptions` extension (ADR-MOD-GRID-REFACTOR-2026-05-17-006).

### Deprecated

- `TomisColumnDef<TData>` — retained as deprecation alias for `DataMapColumnDef`. Will be removed in the next MAJOR version (POL-COMPAT §3, ADR-MOD-GRID-REFACTOR-2026-05-17-006).

### BREAKING (next major)

- `TomisColumnDef<TData>` will be removed. Migrate: `import { DataMapColumnDef } from '@topgrid/grid-pro-datamap'`.

---

## 0.0.0

Initial scaffold.
