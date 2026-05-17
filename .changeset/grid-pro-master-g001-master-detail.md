---
"@tomis/grid-pro-master": minor
"@tomis/grid-core": minor
"@tomis/grid-license": patch
---

feat(grid-pro-master): add MasterDetailGrid with expand/collapse row detail (MOD-GRID-16/G-001)

- `<MasterDetailGrid<TData>>` — Pro-tier Master-Detail row expansion component
- `renderDetailRow?: RenderDetailRow<TData>` — detail row render function prop
- `masterDetail?: MasterDetailOptions<TData>` — controlled/uncontrolled expanded state
  - Controlled: `expandedRowKeys` + `onExpandChange` callback
  - Uncontrolled: internal `useState<ExpandedState>`
- Imperative handle via `ref`: `expandAll()`, `collapseAll()` + full `GridHandle<TData>` API
- `ExpandToggleCell` — internal expand/collapse toggle button with depth-based indent (INDENT_PX=16)
- `DetailRow` — full-width `<tr data-detail-row>` for expanded master row content
- `verifyLicense('@tomis/grid-pro-master')` called at module level (Pro EULA guard)
- `@tomis/grid-core` and `@tomis/grid-license` added to peerDependencies

`@tomis/grid-core`: `GridHandle<TData>` extended with optional `expandAll?(): void` and `collapseAll?(): void` (after `scrollTo`) — backward-compatible (optional methods, base `<Grid>` unaffected)

`@tomis/grid-license`: add no-op `verifyLicense(_packageName: string): void` export stub (MOD-GRID-99-A deferred)
