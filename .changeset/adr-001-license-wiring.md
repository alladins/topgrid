---
'@tomis/grid-license': minor
'@tomis/grid-pro-agg': minor
'@tomis/grid-pro-datamap': minor
'@tomis/grid-pro-header': minor
'@tomis/grid-pro-master': minor
'@tomis/grid-pro-merging': minor
'@tomis/grid-pro-range': minor
'@tomis/grid-pro-tracking': minor
---

Wire `<Watermark>` rendering in all 7 Pro Grid components when license is invalid
or `watermarkRequired === true`. Adds `useLicenseStatus()` hook and
`useWatermarkEnforcement()` void hook to `grid-license`. `MultiRowHeader` uses
the thead-row watermark pattern (H-D, HTML-valid, no portal), `DataMapCell`
uses a module-level singleton portal via the void registration hook (D-D,
ref-counted createRoot 1회 mount). Other five Pro components render
`<Watermark>` inline inside a wrapper `<div className="relative">`.

ADR-MOD-GRID-REFACTOR-2026-05-17-001 — option A + (b) granularity + H-D + D-D.
