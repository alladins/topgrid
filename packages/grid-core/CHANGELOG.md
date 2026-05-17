# @tomis/grid-core

## Unreleased (ADR-007 — Wave 3 — 2026-05-17)

### Added (Internal — not part of semver-stable public API)

- `./internal/storage` subpath export (`@tomis/grid-core/internal/storage`)
  exposing SSR-safe Web Storage primitives: `getStorage`, `readJson`, `readRaw`,
  `writeJson`, `writeRaw`, `removeKey`, type `StorageType`. Marked `@internal`
  — sister packages within this monorepo (`@tomis/grid-pro-master`) consume it
  to share the SSR-guard + try/catch + JSON I/O layer. Application code MUST
  NOT import from this subpath; use the persistence hooks instead.
  (ADR-MOD-GRID-REFACTOR-2026-05-17-007)

### Internal (no behavioural change)

- `useStoragePersist` — SSR guard + `localStorage.getItem` / `setItem` /
  `removeItem` boilerplate now routed through `internal/storage` adapter.
  Public API + `{v, p}` URLSearchParams envelope + debounce timing unchanged.
- `useColumnPersistence` — same delegation. Public API + `{v, data}` JSON
  envelope + `storageKey === ''` short-circuit unchanged. `@deprecated`
  (ADR-013) marker preserved.
- `useColumnOrderPersist` — same delegation. Public API + raw-array envelope
  + mount-only restore semantics unchanged.

### Notes

- Duplication of the SSR + try/catch + JSON I/O pattern reduced from 4 sites
  to 1 (drift prevention; ADR-007's stated primary goal). Per-hook boilerplate
  trimmed by ~10–30 LOC each; consolidated single-source adapter adds ~150 LOC.
  Net LOC is roughly neutral — the value is in single-source bug-fix targeting.
- New subpath `@tomis/grid-core/internal/storage` follows the same convention
  as the existing `@tomis/grid-core/legacy` subpath (precedent established
  in G-005 D13). ADR-007 alternative #3 (public export from main barrel)
  explicitly rejected.

---

## Unreleased (ADR-016 + ADR-008 — Wave 3 — 2026-05-17)

### Changed

- **`BaseGridProps.onRowClick`** signature unified from `(row: TData) => void` to
  `(row: TData, event: MouseEvent<HTMLTableRowElement>) => void` (ADR-016).
  Existing 1-arg callbacks remain assignable via TypeScript contravariance — no
  call-site changes required.
- Legacy alias props in `ColumnPinGridProps`, `TreeGridProps` (grid-core/legacy)
  and `GroupedHeaderGridProps` (grid-core/legacy) updated to 2-arg signature
  (ADR-016).

## Unreleased (ADR-018 — 2026-05-17)

### Added

- `TomisColumnType` union extended: `'tag'` and `'progress'` members added (11 total,
  up from 9). Additive — no breaking change. Existing narrow checks on the union
  continue to work; new members produce `String(value)` placeholder when
  `@tomis/grid-renderers` is not imported (graceful fallback).
  (ADR-MOD-GRID-REFACTOR-2026-05-17-018 D-2 X-A1)
- `defaultRendererRegistry` gains 2 placeholder entries: `'tag'` and `'progress'`
  (fallback `String(info.getValue() ?? '')`). These are replaced by real adapters
  when `@tomis/grid-renderers` is imported (mirrors existing ADR-002 pattern).

## Unreleased (ADR-002 — 2026-05-17)

### Changed

- `defaultRendererRegistry` documentation updated: `@tomis/grid-renderers` now
  wires `text` / `number` / `date` / `dateTime` / `badge` / `link` adapters
  via side-effect on import (ADR-MOD-GRID-REFACTOR-2026-05-17-002). The 9
  placeholders remain in place and act as a graceful fallback when
  `@tomis/grid-renderers` is **not** imported (every `TomisColumnType` still
  produces a renderable `ReactNode`). No public API change — `registerRenderer`
  and `defaultRendererRegistry` signatures unchanged.

## Unreleased (ADR-013 — 2026-05-17)

### Deprecated

- `createTomisColumnHelper` — no production users. Use `createColumns` for high-level
  column definition or import `createColumnHelper` directly from `@tanstack/react-table`.
  Removed in next major. (ADR-013)
- `useColumnPersistence` — no production users outside grid-core. Superseded by
  ADR-007 storage adapter (Wave 3). Removed in next major. (ADR-013)
- `ColumnVisibilityMenu` — no production users outside grid-core. Removed in next
  major. (ADR-013)
- `ColumnVisibilityMenuProps` — no production users. Removed in next major together
  with `ColumnVisibilityMenu`. (ADR-013)
- `createGroupedColumns` — no production users. Removed in next major. (ADR-013)
- `TomisColumnGroup` — no production users. Removed in next major together with
  `createGroupedColumns`. (ADR-013)

---

## Unreleased (ADR-010 — 2026-05-17)

### Added

- `SortBadge` — multi-sort priority badge component, graduated from `internal/` to
  public API (ADR-010). Superset of the previous internal-only version: accepts an
  optional `className` prop (Tailwind override, C-5). Grid.tsx internal usage unchanged
  (prop is optional; `sortIndex`-only calls still work).
- `SortBadgeProps` — type for the above; moved from `@tomis/grid-features`.

### Notes

- `@tomis/grid-features` retains a deprecation alias `SortBadge` re-exporting from
  `@tomis/grid-core` for one minor cycle. `SortBadgeProps` likewise deprecated in
  grid-features (re-exported from grid-core). Will be removed in next major.
- `internal/SortBadge.tsx` is retained as the implementation file (flat layout,
  cosmetic deviation from ADR-009's `internal/multi-sort/` nesting — noted in ADR-010
  result report).

---

## Unreleased (ADR-009 — 2026-05-17)

### Added (moved from `@tomis/grid-features` per ADR-MOD-GRID-REFACTOR-2026-05-17-009 옵션 A)

- `useColumnDrag` — HTML5 drag-and-drop hook for column reordering.
- `useColumnOrderPersist` — localStorage persistence helper for column order.
- `DropIndicator` — visual drop position indicator component.
- `SortClearButton` — multi-sort clear-all button component.
- Types: `UseColumnDragProps`, `UseColumnDragReturn`, `DragThProps`,
  `UseColumnOrderPersistProps`, `SortClearButtonProps`.

### Changed

- **Removed `@tomis/grid-features` from `dependencies`** — architectural inversion
  resolved. grid-core is now self-contained (no workspace `dependencies`; only
  `peerDependencies`). semver: minor (new public exports).
- `Grid.tsx` now imports the 3 wiring helpers from `./internal/column-drag/` and
  `./internal/multi-sort/` directly.

### Notes

- `@tomis/grid-features` retains deprecation aliases for the 4 runtime exports +
  5 type exports for one minor cycle. They will be removed in the next major.
- ADR-010 (SortBadge consolidation) remains in Wave 3 and is unblocked by this
  change.

## 0.0.0

Initial scaffold.
