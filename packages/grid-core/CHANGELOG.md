# @topgrid/grid-core

## 1.0.0

### Major Changes

- **BREAKING (ADR-007 D1) — 컬럼 빌더 키 안전성**: `TopgridColumnDef<TData>` 가 `type` 으로 판별하는
  discriminated union 이 되었다. 데이터바운드 컬럼(`number`·`boolean`·`dateTime`·`date`·`text`·`badge`·
  `link`·`icon`·`tag`·`progress`)의 `id` 는 이제 `keyof TData` 를 강제한다 — 오타/존재하지 않는 키는
  **컴파일 타임에 차단**된다. `'checkbox'`(selection) 컬럼만 임의 `id: string` 을 허용한다(AC-006 = id 무시).

  - **마이그레이션**: 진짜 데이터 컬럼의 잘못된 키는 고친다(의도된 이득). selection 컬럼은 `type: 'checkbox'`
    이므로 영향 없음. `TData` 미지정(레거시 `ColumnInfo` 경로)이면 `keyof unknown = never` → `string` 폴백 =
    영향 없음. (가시 소비자 31 호출부 실측 = breaking 0건.)

- **BREAKING (ADR-006 D3) — 콜백 시그니처 clean 화(TanStack 타입 제거)**: 셀/필터 콜백이 TanStack `Cell`/
  `Column` 대신 topgrid clean 타입을 받는다.

  - `onCellClick`·`onCellKeyDown`: `(cell, row, event)` → `(ctx: GridCellContext, event)`.
  - `getCellTooltip`: `(cell, row)` → `(ctx: GridCellContext)`.
  - `cellClassName`(`CellClassNameCallback`): `(cell)` → `(ctx: GridCellContext)`.
  - `renderFloatingFilter`: `(column: Column)` → `(column: GridFilterColumn)`.
  - **마이그레이션**(1:1 치환): `cell.column.id`→`ctx.columnId`, `cell.row.id`→`ctx.rowId`,
    `cell.getValue()`→`ctx.value`, `row`(2번째 인자)→`ctx.row`. floating: `column.getFilterValue()`→
    `column.value`, `column.setFilterValue(x)`→`column.setValue(x)`, `column.id` 동일. 0.x 의 `toGridCell`/
    `toGridFilterColumn` adapter 는 그대로 유지(이제 Grid 내부 배선에서 직접 사용). 런타임 동작 불변.

## 0.1.0

### Minor Changes

- f5ea968: ADR-MOD-GRID-REFACTOR-2026-05-17-007 (Wave 3) — extract storage adapter
  primitives to single source.

  The SSR-guard + try/catch + JSON parse/stringify + QuotaExceededError boilerplate
  duplicated across 4 persistence hooks (`useStoragePersist`,
  `useColumnPersistence`, `useColumnOrderPersist`, `useExpandedPersistence`) is
  consolidated into a single `internal/storage` adapter under `@topgrid/grid-core`.

  - `grid-core`: adds a new `./internal/storage` subpath export
    (`@topgrid/grid-core/internal/storage`) exposing `getStorage`, `readJson`,
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

- f5ea968: ADR-016: Unify `onRowClick` signature — `BaseGridProps` and all legacy alias components now use `(row: TData, event: MouseEvent<HTMLTableRowElement>) => void` (2-arg). TypeScript contravariance keeps existing 1-arg callbacks assignable without changes.

  ADR-008: `grid-pro-header` legacy `GroupedHeaderGrid` inline type aliases removed; `GridPaginationOptions` and `GridRowSelectionOptions` are now imported from `@topgrid/grid-core` directly.

- f5ea968: ADR-MOD-GRID-REFACTOR-2026-05-17-009 (옵션 A) — grid-core ↔ grid-features layering 정리.

  Move `useColumnDrag`, `useColumnOrderPersist`, `DropIndicator`, `SortClearButton`
  (and supporting types `UseColumnDragProps`, `UseColumnDragReturn`, `DragThProps`,
  `UseColumnOrderPersistProps`, `SortClearButtonProps`) from `@topgrid/grid-features`
  to `@topgrid/grid-core/internal/`, exposed via grid-core public API.

  - `grid-core`: new public exports (minor add). `@topgrid/grid-features` removed
    from `dependencies` — architectural inversion해소.
  - `grid-features`: retains deprecation aliases for one minor cycle. Adds
    `@topgrid/grid-core` as a workspace dependency to back the aliases. Public
    surface unchanged; consumers should migrate imports to `@topgrid/grid-core`.
    Aliases will be removed in the next major.

- f5ea968: ADR-MOD-GRID-REFACTOR-2026-05-17-010 — `SortBadge` 중복 제거 (grid-core/internal 단일화).

  Consolidates the ~95%-identical `SortBadge` implementations in `grid-core/internal/`
  and `grid-features/multi-sort/` into a single canonical source in grid-core.

  - `grid-core`: `SortBadge` and `SortBadgeProps` graduated to public API (minor add).
    The implementation is the superset of the previous internal version: accepts an
    optional `className` prop (Tailwind override, C-5). Existing Grid.tsx call sites
    (`<SortBadge sortIndex={sortIndex} />`) are unaffected — prop is optional.
    `SortBadgeProps` moved from `@topgrid/grid-features/multi-sort/types.ts`.
  - `grid-features`: `SortBadge` and `SortBadgeProps` are now deprecation aliases
    re-exporting from `@topgrid/grid-core`. Public surface unchanged. Aliases will be
    removed in the next major.

- f5ea968: Deprecate 5 unused public APIs: `createTomisColumnHelper`, `useColumnPersistence`,
  `ColumnVisibilityMenu`, `createGroupedColumns`, `TomisColumnGroup`. All retained as
  deprecation aliases for one cycle. Removed in next major. ADR-013.
- f5ea968: ADR-018: registry slot 정책 — tag / progress 슬롯 wiring + TomisColumnType union 확장.

  - grid-core: TomisColumnType union 에 'tag', 'progress' 추가 (additive — backward-compat).
    defaultRendererRegistry 에 2 placeholder entries 추가 (graceful fallback).
  - grid-renderers: wireRegistry 에 TagCell / ProgressCell 어댑터 2건 추가 (6 → 8 wired slots).
    size-limit 10 KB → 12 KB (ADR-018 S-A).
  - button / avatar / icon 은 registry 외 처리 정책 (구조적 차단 — required non-value prop).
    README "Action / Avatar Column Pattern" 섹션 추가 (ADR-018 D-3 X-B).
  - aliases statusBadge / check 은 grid-renderers Record 에서 status quo (ADR-018 D-4 A-A).

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

### Patch Changes

- f5ea968: ADR-MOD-GRID-REFACTOR-2026-05-17-002 — cross-package renderer wiring.

  `@topgrid/grid-renderers` now auto-registers 6 cell adapters into
  `@topgrid/grid-core`'s `defaultRendererRegistry` via a side-effect on import:
  `text` / `number` / `date` / `dateTime` (with `format: 'datetime'`) / `badge` /
  `link`. After `import '@topgrid/grid-renderers'`, `createColumns({ type: 'number' })`
  renders the real `NumberCell` instead of the previous `String(value)` placeholder.

  - New peerDependency on `grid-renderers`: `@topgrid/grid-core` (workspace:\*).
  - New `sideEffects` array on `grid-renderers/package.json` so bundlers preserve the wiring import.
  - grid-core placeholders remain as graceful fallback when grid-renderers is not imported.
  - `boolean` keeps Y/N. `icon` / `checkbox` remain placeholder (structural + bypass).
  - 5 extras (button/tag/avatar/progress + statusBadge/check aliases) deferred to ADR-018.

  R-A + D-1A + D-2A + D-3A + D-4A combination.

## Unreleased (ADR-007 — Wave 3 — 2026-05-17)

### Added (Internal — not part of semver-stable public API)

- `./internal/storage` subpath export (`@topgrid/grid-core/internal/storage`)
  exposing SSR-safe Web Storage primitives: `getStorage`, `readJson`, `readRaw`,
  `writeJson`, `writeRaw`, `removeKey`, type `StorageType`. Marked `@internal`
  — sister packages within this monorepo (`@topgrid/grid-pro-master`) consume it
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
  - mount-only restore semantics unchanged.

### Notes

- Duplication of the SSR + try/catch + JSON I/O pattern reduced from 4 sites
  to 1 (drift prevention; ADR-007's stated primary goal). Per-hook boilerplate
  trimmed by ~10–30 LOC each; consolidated single-source adapter adds ~150 LOC.
  Net LOC is roughly neutral — the value is in single-source bug-fix targeting.
- New subpath `@topgrid/grid-core/internal/storage` follows the same convention
  as the existing `@topgrid/grid-core/legacy` subpath (precedent established
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
  `@topgrid/grid-renderers` is not imported (graceful fallback).
  (ADR-MOD-GRID-REFACTOR-2026-05-17-018 D-2 X-A1)
- `defaultRendererRegistry` gains 2 placeholder entries: `'tag'` and `'progress'`
  (fallback `String(info.getValue() ?? '')`). These are replaced by real adapters
  when `@topgrid/grid-renderers` is imported (mirrors existing ADR-002 pattern).

## Unreleased (ADR-002 — 2026-05-17)

### Changed

- `defaultRendererRegistry` documentation updated: `@topgrid/grid-renderers` now
  wires `text` / `number` / `date` / `dateTime` / `badge` / `link` adapters
  via side-effect on import (ADR-MOD-GRID-REFACTOR-2026-05-17-002). The 9
  placeholders remain in place and act as a graceful fallback when
  `@topgrid/grid-renderers` is **not** imported (every `TomisColumnType` still
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
- `SortBadgeProps` — type for the above; moved from `@topgrid/grid-features`.

### Notes

- `@topgrid/grid-features` retains a deprecation alias `SortBadge` re-exporting from
  `@topgrid/grid-core` for one minor cycle. `SortBadgeProps` likewise deprecated in
  grid-features (re-exported from grid-core). Will be removed in next major.
- `internal/SortBadge.tsx` is retained as the implementation file (flat layout,
  cosmetic deviation from ADR-009's `internal/multi-sort/` nesting — noted in ADR-010
  result report).

---

## Unreleased (ADR-009 — 2026-05-17)

### Added (moved from `@topgrid/grid-features` per ADR-MOD-GRID-REFACTOR-2026-05-17-009 옵션 A)

- `useColumnDrag` — HTML5 drag-and-drop hook for column reordering.
- `useColumnOrderPersist` — localStorage persistence helper for column order.
- `DropIndicator` — visual drop position indicator component.
- `SortClearButton` — multi-sort clear-all button component.
- Types: `UseColumnDragProps`, `UseColumnDragReturn`, `DragThProps`,
  `UseColumnOrderPersistProps`, `SortClearButtonProps`.

### Changed

- **Removed `@topgrid/grid-features` from `dependencies`** — architectural inversion
  resolved. grid-core is now self-contained (no workspace `dependencies`; only
  `peerDependencies`). semver: minor (new public exports).
- `Grid.tsx` now imports the 3 wiring helpers from `./internal/column-drag/` and
  `./internal/multi-sort/` directly.

### Notes

- `@topgrid/grid-features` retains deprecation aliases for the 4 runtime exports +
  5 type exports for one minor cycle. They will be removed in the next major.
- ADR-010 (SortBadge consolidation) remains in Wave 3 and is unblocked by this
  change.

## 0.0.0

Initial scaffold.
