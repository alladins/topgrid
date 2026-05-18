# @topgrid/grid-renderers

## 0.1.0

### Minor Changes

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

- f5ea968: Add `value` prop to LinkCell and ButtonCell (replaces `label`). `label` retained
  as deprecated alias for one cycle. Internal: `as unknown as CellComponent` cast
  14→1 via `asCell<P>()` helper. ADR-014 amendment (D-partial + additive shim).
- f5ea968: ADR-018: registry slot 정책 — tag / progress 슬롯 wiring + TomisColumnType union 확장.

  - grid-core: TomisColumnType union 에 'tag', 'progress' 추가 (additive — backward-compat).
    defaultRendererRegistry 에 2 placeholder entries 추가 (graceful fallback).
  - grid-renderers: wireRegistry 에 TagCell / ProgressCell 어댑터 2건 추가 (6 → 8 wired slots).
    size-limit 10 KB → 12 KB (ADR-018 S-A).
  - button / avatar / icon 은 registry 외 처리 정책 (구조적 차단 — required non-value prop).
    README "Action / Avatar Column Pattern" 섹션 추가 (ADR-018 D-3 X-B).
  - aliases statusBadge / check 은 grid-renderers Record 에서 status quo (ADR-018 D-4 A-A).

### Patch Changes

- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
- Updated dependencies [f5ea968]
  - @topgrid/grid-core@0.1.0

## 0.3.0 — 2026-05-17 (ADR-018)

### Added

- `wireRegistry.ts` gains `tag` and `progress` slots (6 → 8 wired slots).
  `import '@topgrid/grid-renderers'` now auto-wires `TagCell` / `ProgressCell`
  adapters into `@topgrid/grid-core`'s `defaultRendererRegistry` alongside the
  existing 6 adapters.
  (ADR-MOD-GRID-REFACTOR-2026-05-17-018 D-2 X-A1)
- `type: 'tag'` column definition now renders `TagCell` chips (value must be
  `readonly string[]`; non-array values coerced to `[]` with `'-'` placeholder).
- `type: 'progress'` column definition now renders `ProgressCell` progress bar
  (value `number | null | undefined`; clamped to `[0,100]`; `NaN/null/undefined → 0`).

### Notes

- `button` / `avatar` / `icon` remain registry-external (ADR-018 D-3 X-B / D-1 I-A).
  Use `column.cell` direct wiring — see README "Action / Avatar Column Pattern".
- Aliases `statusBadge` / `check` accessible via grid-renderers' own `Record<string, …>`
  (`getRenderer` / `registerRenderer` with string key). Not added to grid-core
  `TomisColumnType` union (ADR-018 D-4 A-A — zero added value).
- `size-limit` raised from 10 KB → 12 KB to accommodate 2 new adapters
  and provide headroom for future slots (ADR-018 S-A).

## 0.2.0 — 2026-05-17

### Added

- ADR-MOD-GRID-REFACTOR-2026-05-17-002 — cross-package wiring with `@topgrid/grid-core`.
  - `import '@topgrid/grid-renderers'` now auto-wires 6 cell adapters into
    `@topgrid/grid-core`'s `defaultRendererRegistry` via a side-effect
    `wireDefaultRenderers()` call: `text` / `number` / `date` / `dateTime` (with
    `format: 'datetime'`) / `badge` / `link`.
  - New peerDependency: `@topgrid/grid-core` (`workspace:*`).
  - `package.json` `sideEffects` declared (`./src/index.ts`, `./dist/index.mjs`,
    `./dist/index.cjs`) so bundlers preserve the wiring import.

### Notes

- `boolean` keeps grid-core's Y/N default — no `BooleanCell` in grid-renderers.
- `icon` remains a placeholder — `IconCellProps.icon: ReactNode` cannot be
  derived from `info.getValue()` alone (deferred to ADR-018).
- `checkbox` is routed through `createColumns`' `DisplayColumnDef` branch
  (`createColumns.ts:96-108`); the registry entry is unused.
- 5 extras (`button`, `tag`, `avatar`, `progress` + aliases `statusBadge` /
  `check`) remain accessible via direct cell imports only — wiring to grid-core's
  `Map<TomisColumnType, …>` would require a union widening (deferred to ADR-018).

## 0.1.0 — 2026-05-17

### Added

- `LinkCell`: `value` prop (preferred display text — replaces `label`)
- `ButtonCell`: `value` prop (preferred display text/ReactNode — replaces `label`)
- Internal: `asCell<P>()` helper for registry slot widening (ADR-014 amendment — cast 14→1)

### Deprecated

- `LinkCell.label` — use `value` instead. Removed in next major version (POL-COMPAT §3).
- `ButtonCell.label` — use `value` instead. Removed in next major version (POL-COMPAT §3).

### Internal

- `as unknown as CellComponent` cast instances reduced from 14 to 1 via `asCell<P>()` helper
  in `rendererRegistry.ts`. ADR-014 amendment (D-partial + additive shim).

## 0.0.0

Initial scaffold.
