# @tomis/grid-pro-master

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

- f5ea968: ADR-MOD-GRID-REFACTOR-2026-05-17-007 (Wave 3) — extract storage adapter
  primitives to single source.

  The SSR-guard + try/catch + JSON parse/stringify + QuotaExceededError boilerplate
  duplicated across 4 persistence hooks (`useStoragePersist`,
  `useColumnPersistence`, `useColumnOrderPersist`, `useExpandedPersistence`) is
  consolidated into a single `internal/storage` adapter under `@tomis/grid-core`.

  - `grid-core`: adds a new `./internal/storage` subpath export
    (`@tomis/grid-core/internal/storage`) exposing `getStorage`, `readJson`,
    `readRaw`, `writeJson`, `writeRaw`, `removeKey`, type `StorageType`. Marked
    `@internal` — sister packages in this monorepo consume it to share the
    Web-Storage I/O layer. **Not part of the semver-stable public API**;
    application code must not import from this subpath.
  - `grid-pro-master`: `useExpandedPersistence` internal implementation now
    routes Web Storage I/O through the new subpath.
  - 4 hook public APIs (signatures, return shapes, option fields, envelope
    formats, debounce timing, fallback semantics) unchanged. Pattern duplication
    reduced from 4 sites to 1 (drift prevention).

  Semver: minor (internal refactor + new internal-only subpath export). No
  breaking changes.

- f5ea968: feat(grid-pro-master): add MasterDetailGrid with expand/collapse row detail (MOD-GRID-16/G-001)

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

- f5ea968: feat(grid-pro-master): add ContextMenuGrid with right-click context menu (MOD-GRID-16/G-002)

  - `<ContextMenuGrid<TData>>` — Pro-tier Context Menu grid component
  - `contextMenuItems?: ContextMenuItem<TData>[]` — declarative right-click menu items prop
  - `ContextMenuItem<TData>` — menu item interface:
    - `label: string` — display label
    - `shortcut?: string` — keyboard shortcut hint + functional trigger (`"[Modifier+]Key"` grammar)
    - `disabled?: boolean | ((row: TData) => boolean)` — static or row-based disable condition
    - `separator?: boolean` — renders `<hr>` separator
    - `onClick: (row: TData, cell: Cell<TData, unknown>, event: MouseEvent) => void` — click handler
  - `createPortal` into `document.body` — escapes parent overflow/stacking contexts (AC-003)
  - Keyboard shortcut dispatch via wrapper div `onKeyDown` (tabIndex=0) — no global window listener (D12)
  - `disabled` evaluation at render time with `opacity-50 cursor-not-allowed` styling (AC-007)
  - Viewport-edge position clamping in `ContextMenuPortal` (Section 9)
  - Esc key + outside-click close (AC-012)
  - `verifyLicense('@tomis/grid-pro-master')` called at module level (Pro EULA guard, D6)
  - `internal/useContextMenu.ts` — pure state hook (isOpen, position, targetRow, targetCell, focusedIndex)
  - `internal/ContextMenuPortal.tsx` — createPortal-based menu renderer

  No peerDependency changes needed (all deps declared in G-001).

- f5ea968: feat(grid-pro-master): add useExpandedPersistence, useRowKeyboardNav, and TreeGrid/ColumnPinGrid re-exports (MOD-GRID-16/G-003)

  - `useExpandedPersistence` hook — persists TanStack `ExpandedState` to localStorage/sessionStorage:
    - `UseExpandedPersistenceOptions` interface (`storageKey`, `storageType`, `initialExpanded`)
    - Returns `[expanded, setExpanded]` tuple for external composition with `<MasterDetailGrid>`
    - EC-01/EC-03 error handling: storage-unavailable + QuotaExceeded fallback to in-memory with dev-mode `console.warn`
    - `storageType` change handled via `useRef` — no remount required
  - WCAG 2.1 AA keyboard accessibility wired into `<MasterDetailGrid>`:
    - `<tr tabIndex=0>` + `onKeyDown` (Enter/Space toggles row expansion)
    - `focus-visible:outline-2 focus-visible:outline-blue-500` focus ring
    - `useRowKeyboardNav` hook in `internal/useRowKeyboardNav.ts` (not public API)
    - `shouldToggleExpand(key)` pure helper (C-32)
  - `TreeGrid` / `ColumnPinGrid` alias re-exports from `@tomis/grid-core`:
    - `export { TreeGrid, type TreeGridProps } from '@tomis/grid-core'`
    - `export { ColumnPinGrid, type ColumnPinGridProps } from '@tomis/grid-core'`
    - Deprecation warning automatic via `useDeprecationWarn` inside G-005 (MOD-GRID-01) implementations
    - C-6 backward compatibility maintained
  - `RowPinningOptions` type export (F-16-06 P1 — types only; UI in separate Goal):
    - `pinTop?: string[]` — top-pinned row ids
    - `pinBottom?: string[]` — bottom-pinned row ids

  No new peerDependency additions. `@tomis/grid-core: workspace:*` already declared in G-001.

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
  - @tomis/grid-license@0.1.0
  - @tomis/grid-core@0.1.0

## Unreleased (ADR-007 — Wave 3 — 2026-05-17)

### Internal (no behavioural change)

- `useExpandedPersistence` — SSR guard + `localStorage` / `sessionStorage`
  try/catch + JSON.parse / stringify + QuotaExceededError boilerplate now
  delegated to `@tomis/grid-core/internal/storage` adapter (consumed via the
  new `./internal/storage` subpath). Public API (`UseExpandedPersistenceOptions`,
  returned `[expanded, setExpanded]` tuple), in-memory fallback semantics,
  one-time `warnedUnavailable` dev warning, and QuotaExceededError dev warning
  unchanged. (ADR-MOD-GRID-REFACTOR-2026-05-17-007)

---

## 0.1.0 — 2026-05-17

### Added

- License enforcement — `MasterDetailGrid` now reads `useLicenseStatus()` and renders `<Watermark required />` when the license is invalid or `watermarkRequired === true`. The outer wrapper `<div>` className is merged with `relative` (user-supplied `className` preserved). (ADR-MOD-GRID-REFACTOR-2026-05-17-001)

### Changed

- **DOM**: the outer `<div>` now always carries the `relative` class (merged with `props.className ?? ''`). Previously, callers omitting `className` produced a bare `<div>`; now they receive `<div class="relative">`. Visual impact is normally zero, but stylesheets that target the root by class absence may need adjustment.

---

## 0.0.0

Initial scaffold.
