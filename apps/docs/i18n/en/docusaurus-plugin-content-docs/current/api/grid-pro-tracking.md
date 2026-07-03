---
title: "@topgrid/grid-pro-tracking"
sidebar_label: "grid-pro-tracking"
sidebar_position: 27
---

# @topgrid/grid-pro-tracking

> Pro: ChangeTracking, Mapping, Validator · **Commercial (EULA)**

:::info Auto-generated
This page is auto-generated from TSDoc comments in the source code (internal markers scrubbed). For a curated getting-started summary, see the [API Reference](../api-reference).
:::

**17** public exports — 2 functions · 1 hook · 1 component · 12 types · 1 constant.

## Components

### `ChangeTrackingGrid`

```ts
ChangeTrackingGrid(props: ChangeTrackingGridProps<TData> & { … }): ReactElement
```

## Hooks

### `useChangeTracking`

React hook for tracking row-level added/edited/deleted changes
(/ —..).

- `rows` / `added` / `edited` / `deleted` are stable across renders that
 leave the underlying state unchanged (memoized via `useMemo`).
- `addRow` returns the assigned row key synchronously so callers can
 immediately reference it (e.g. focus the new row, schedule a follow-up
 `updateRow`).
- `undoRow` and `commitChanges` remain stubs — implemented in
 / and respectively.

```ts
useChangeTracking(config: ChangeTrackingConfig<TData>): ChangeTrackingAPI<TData>
```

## Functions

### `buildChangeSet`

Build a server payload from a `ChangeMapState<TData>`.

Algorithm (spec Section 1 L1 + Section 2.4):
1. `removed` — every `state.statusMap[key] === 'deleted'` row → applyMapping
 (no validator call — deletes need only the PK).
2. `added` — every `'added'` row → runValidator (type:'added'). Failing rows
 are excluded from `added[]` and recorded in `errors[]`.
3. `updated` — every `'edited'` row → runValidator (type:'updated'). Same
 exclusion/error policy as `added`.
4. Return `{ added, updated, removed, errors }`.

Mapping function throws ( + ):
- `applyMapping` propagates throws (0 try/catch internally).
- `buildChangeSet` wraps added/updated mapping in per-row try/catch.
 On throw: push `{ index, message: '(mapping threw: <error>)', type }` to errors[].
- Deleted mapping throw: fallback raw row (spec silent on deleted throw → conservative).

Index numbering in `errors[]` is per-group 0-based (pre-exclusion sequence).

Pure — no React import, no `console.warn`, no IO.

```ts
buildChangeSet(state: ChangeMapState<TData>, options: BuildChangeSetOptions<TData>): ChangeSet
```

### `getRowStatusClassName`

Returns the Tailwind className string for a given row status.
If `classNames` is provided, it is merged over `defaultRowStatusClassNames`
(consumer override). Returns `''` for an unknown status (defensive).

```ts
getRowStatusClassName(status: RowStatus, classNames: RowStatusClassNames): string
```

| Parameter | Type | Description |
|---|---|---|
| `status` | `RowStatus` | RowStatus value from `row.__rowStatus`. |
| `classNames` | `RowStatusClassNames` | Optional override map (full `RowStatusClassNames` shape). |

**Returns** — Tailwind className string, or `''` if status is not recognised.

## Types & Interfaces

### `BuildChangeSetOptions`

| Property | Type | Description |
|---|---|---|
| `mapping?` | `Mapping<TData>` | Screen-to-BE field mapping. When omitted, rows pass through as a shallow clone. |
| `validator?` | `Validator<TData>` | Row-level validator. When omitted, every row passes. |

### `ChangeSet`

Server payload shape produced by `getChangeSet` / `commitChanges`.
`errors` carries per-row mapping/validator failures with the originating row index.

| Property | Type | Description |
|---|---|---|
| `added` | `MappedRow[]` |  |
| `errors` | `{ … }[]` |  |
| `removed` | `MappedRow[]` |  |
| `updated` | `MappedRow[]` |  |

### `ChangeTrackingAPI`

| Property | Type | Description |
|---|---|---|
| `added` | `readonly TData[]` | Added rows. |
| `deleted` | `readonly TData[]` | Rows marked for deletion. |
| `edited` | `readonly OriginalSnapshot<TData>[]` | Edited rows with `__original` preserved (see OriginalSnapshot). |
| `editedCellsMap` | `ReadonlyMap<string, boolean>` | Map of edited cell locations. key = `rowKey + '_' + columnId`. Always empty if the editedCells config is false. ( wires) |
| `rows` | `readonly TData & { … }[]` | Display rows (added/edited/deleted merged, `__rowStatus` attached). |
| `addRow` | `unknown` |  |
| `commitChanges` | `unknown` |  |
| `deleteRow` | `unknown` |  |
| `getChangeSet` | `unknown` |  |
| `hasChanges` | `unknown` |  |
| `resetChanges` | `unknown` |  |
| `undoRow` | `unknown` |  |
| `updateRow` | `unknown` |  |

### `ChangeTrackingConfig`

| Property | Type | Description |
|---|---|---|
| `data` | `TData[]` | Initial dataset. Snapshot is captured at mount. ( implements snapshot.) |
| `editedCells?` | `boolean` | Enable cell-level edit tracking. When set to `true`, edited cell locations are recorded in editedCellsMap. Default false. ( wires reducer) |
| `mapping?` | `Mapping<TData>` | Screen-to-BE field mapping. ( implements the runtime application.) |
| `onSnapshotInit?` | `(…) => …` | Callback fired after the initial snapshot is built. |
| `optimistic?` | `boolean` | Optimistic update — auto-rollback on commit failure. Default `false`. |
| `rowKey` | `keyof TData \| (…) => …` | PK extractor — either a field name or a function returning a string key. |
| `validator?` | `Validator<TData>` | Row-level validator. ( implements the runtime application.) |

### `ChangeTrackingGridProps`

Props for the ChangeTrackingGrid alias.

Inherits all `<Grid>` props except `data` (the alias overrides `data` so
`<Grid>` receives `tracking.rows` rather than the caller's source array —
this is what binds added/edited/deleted overlays to the rendered grid).

| Property | Type | Description |
|---|---|---|
| `alwaysMultiSort?` | `boolean` | Accumulate multi-sort even on a plain click. Use together with `enableMultiSort`. By default Shift+click is the multi-sort key, but when `true` you accumulate by clicking columns sequentially **without Shift**. (TanStack `isMultiSortEvent: => true` passthrough.) |
| `autoSelectFirstRow?` | `boolean` | Automatically select the first row after data loads (default `false`). |
| `cellClassName?` | `CellClassNameCallback<TData>` | Per-cell className generation callback. Called on every cell render. The returned string is appended to the `<td>`'s base className. **canonical**: this callback type is owned by grid-core. grid-renderers is a type-only re-export. **Usage example** (equivalent to publish/organizeSchedule): ```tsx cellClassName={(cell) => {  if (!cell.column.id.startsWith('d')) return '';  const isSelected = cell.row.getIsSelected;  const hasValue = cell.getValue != null && cell.getValue !== '';  return [  isSelected && 'bg-indigo-100',  !isSelected && hasValue && 'bg-yellow-50',  ].filter(Boolean).join(' '); }} ``` **Performance note**: called on every cell render — with large datasets, watch the cost of computation inside the callback (useMemo or a stable callback recommended). |
| `className?` | `string` | Outer wrapper className (Tailwind). |
| `columnOrderStorageKey?` | `string` | localStorage key used when `persistColumnOrder=true`. When an empty string (`''`) is passed, there is no localStorage access. When omitted, saving is skipped even if `persistColumnOrder=true`. |
| `columnPersistence?` | `ColumnPersistenceOptions` | Options for persisting column visibility + order to localStorage. - When provided, the `<ColumnVisibilityMenu>` UI is rendered automatically + `useColumnPersistence` is enabled. - When not provided (`undefined`), persistence is disabled + the menu is hidden (backward compat). - When `storageKey: ''`, there is no localStorage access (NFR-006). |
| `columnResizeMode?` | `GridColumnResizeMode` | Column resize mode (default `'onChange'`). Takes effect only when `enableColumnResizing=true`. |
| `columns` | `ColumnDef<TData, unknown>[]` | Column definitions (TanStack `ColumnDef`). |
| `data` | `TData[]` | Initial dataset (forwarded to `useChangeTracking`). |
| `debug?` | `boolean` | Exposes the TanStack `debugTable` option (default `false`). |
| `defaultColumnPinning?` | `ColumnPinningState` | Uncontrolled initial value for column pinning (`{ left: string[]; right: string[] }`). Entry point for the ColumnPinGrid `pinLeft` / `pinRight` alias mapping. |
| `defaultColumnSizing?` | `ColumnSizingState` | Uncontrolled initial value for column widths (column id → px). Used at mount as the initial value of the internal `columnSizing` state (uncontrolled pattern). |
| `defaultExpanded?` | `false \| ExpandedState` | Initial value of the expanded state when `enableExpanding=true` (uncontrolled). - `true` = expand all - `Record<string, boolean>` = expand specific row ids - omitted = `{}` (collapse all)  — compatibility entry point for the TreeGrid alias `expandAll={true}`. Preserves the AS-IS TreeGrid.tsx:35 `useState<ExpandedState>(initialExpandAll ? true : {})` initial-seed pattern. |
| `editedCells?` | `boolean` | Toggle cell-level edit tracking. |
| `emptyState?` | `ReactNode` | ReactNode slot for the empty-result state. When provided, it is rendered in preference to `emptyText` ( — slot → text → defaultText order). |
| `emptyText?` | `string` | Empty-result guidance text (default `'데이터가 없습니다.'`). |
| `enableCellChangeFlash?` | `boolean` | Briefly highlight cells when their value changes (change-flash). When `data` changes, cells **whose value actually changed** (diffed by row identity — re-sorts are not highlighted) get a ~0.9s background highlight. Specifying `getRowId` is recommended for stable highlighting (without it, the diff is index-based → re-sorts are also highlighted). |
| `enableColumnPinning?` | `boolean` | Enable column pinning state (default `false`). This only enables the `state.columnPinning` state. The sticky CSS appearance is out of scope. |
| `enableColumnReorder?` | `boolean` | Enable column drag-reordering (default `false`). Based on the HTML5 Drag and Drop API — no external dnd library.  :. |
| `enableColumnResizing?` | `boolean` | Enable column resize state (default `false`). The resize-handle UI is out of scope. |
| `enableColumnVirtualization?` | `boolean` | Enable column (horizontal) virtualization. When `true`, off-screen **center** columns are not rendered and only the horizontal scroll width is maintained via left/right padding cells — reducing the render cost of 100+ columns. **Pinned columns are not virtualized and are always rendered, independent of horizontal scroll.** Omitted/`false` → all columns rendered (byte-identical to prior behavior). **v1 constraint**: **flat (single-row) headers only** — with group/multi-level headers (`getHeaderGroups.length > 1`) it auto-disables due to colSpan accounting complexity (all columns rendered). Group-header virtualization is v2. **Layout**: when `true`, the `<table>` is fixed with `table-layout: fixed` + total column width (Σ`getSize`) so columns keep their explicit widths exactly (aligned with the pad px). As a side effect, **cell content that exceeds the column width is clipped** — normal behavior for a virtualized grid. The horizontal scroll container is provided by the existing `overflow-x-auto` (or row virtualization's `overflow:auto`), so consumers not using Tailwind must set `overflow-x` on the container themselves. **⚠️ Experimental**: body+header virtualization wiring + chromium alignment matrix complete (Commit C). off=byte-identical to before, all columns rendered on SSR/unmeasured (safe fallback). |
| `enableExpanding?` | `boolean` | Enable row expanding state (default `false`) — absorbs TreeGrid. Use together with `getSubRows`. |
| `enableFilter?` | `boolean` | Enable column filtering (default `false`) — `getFilteredRowModel` wiring. |
| `enableMultiSort?` | `boolean` | Enable multi-sort (default `false`) — delegates to TanStack `enableMultiSort`. |
| `enablePagination?` | `boolean` | Enable pagination (default `false`) — `getPaginationRowModel` wiring. |
| `enableRowClickSelection?` | `boolean` | Select by clicking the row body. Works only when `rowSelection` is `'single'`/`'multi'`. - plain click → selects only that row (deselects the rest). ctrl/cmd+click → toggle (multi-accumulate). (shift range = ) - **Coexists independently** with the existing `onRowClick` callback — selecting also still calls `onRowClick`. - Clicks on the checkbox cell (`__select__`) do not take this path due to `stopPropagation` (existing behavior preserved). |
| `enableRowPinning?` | `boolean` | Row pinning. Lets the user pin data rows to the top/bottom (`row.pin('top'\|'bottom')`). Pinned rows are sticky and stay fixed during scroll and are excluded from the center rows. **Non-virtualized only** (virtualization+pin=vN). Place the `RowPinButton` component in a cell for the UI control. |
| `enableRowReorder?` | `boolean` | Enable row drag-reordering (default `false`). Makes data rows draggable and calls `onRowReorder(from, to)` on drop (the consumer applies it to its own data via `moveRow(data, from, to)`). **Auto-disabled when sort/filter is active** (display order ≠ data order makes reordering ambiguous) + **non-virtualized only** (virtualization composition = vN). HTML5 drag. |
| `enableSort?` | `boolean` | Enable sorting (default `false`) — `getSortedRowModel` wiring. |
| `enableVirtualization?` | `boolean` | Enable virtualization (default `false`) — opt-in only. When `true`, `useGridVirtualizer` wiring + the tbody padding-row pattern is applied. When `false`, ~ markup as-is (sticky/pinning preserved). |
| `floatingBottomRows?` | `TData[]` | Consumer-supplied row data to pin at the **bottom** of the grid. Same contract as `floatingTopRows` (bottom sticky). |
| `floatingTopRows?` | `TData[]` | Consumer-supplied row data to pin at the **top** of the grid. Isomorphic to XX Grid's `pinnedTopRowData` — extra rows *outside* the data model (totals/summaries, etc.). They pass through the column cell renderers (`columnDef.cell`) and display like body rows, and stay fixed with `position: sticky` as the body scrolls. **No aggregate computation**: the consumer supplies the total object directly (automatic aggregation is `@topgrid/grid-pro-agg`/Pro). **Not interactive pinning**: separate from the feature where a user pins existing rows (`@topgrid/grid-pro-master`/Pro). Omitted/empty array → nothing rendered (existing behavior unchanged). |
| `getCellTooltip?` | `(…) => …` | Cell tooltip. Called per cell to apply the returned string as `<td title>` (native hover tooltip) — for showing truncated content, extra description, etc. When `undefined`/`null`/`''` is returned, no title is applied to that cell. grid-core 1.0: `(cell, row)` → `(ctx)` (clean GridCellContext). |
| `getRowId?` | `(…) => …` | Stable row identifier. When not specified, the row key = array index. When provided, all row-key states such as `rowSelection`·`expanded` are keyed by **this id rather than the index**, so the **same logical row is tracked** across data re-sorts/replacements (selection follows identity, not position). The foundation on which cell-change flash identifies "the same row". |
| `getSubRows?` | `(…) => …` | TanStack `getSubRows` — used when `enableExpanding=true`. |
| `icons?` | `Partial<GridIcons>` | Sort-indicator icon glyph override (partial). Unspecified ones fall back to the defaults (`▲▼⇅`). |
| `loading?` | `boolean` | Loading state. When `true`, only the `<tbody>` area is replaced with skeleton rows (thead preserved — ). |
| `loadingOverlay?` | `boolean` | Loading overlay (default `false`). Unlike `loading` (skeleton replacement), it **keeps the existing data rows in place** and covers them with a translucent overlay (indicating an update while retaining the existing data). `aria-busy` + blocks pointer-events (prevents interaction underneath). Independent and additive from `loading` (skeleton) — both leave existing behavior unchanged. |
| `loadingRowCount?` | `number` | Number of skeleton rows to show while loading. When not specified, falls back to `pagination.pageSize ?? 5` ( — compatible with the BaseGrid L123 hardcoded `5`). |
| `localeText?` | `Partial<GridLocale>` | Localization of grid chrome strings — partial override. Unspecified keys fall back to the Korean defaults (never emits a raw key/undefined). Example for English: `{ emptyText: 'No data', rowsPerPage: 'Rows per page:', totalCount: (n) => `$&#123;n} rows` }`. You may also import `defaultGridLocale` and spread it above. |
| `manualFiltering?` | `boolean` | Server filtering: when `true`, disables client filtering (`getFilteredRowModel` skip + `manualFiltering`). default `false`. |
| `manualSorting?` | `boolean` | Server sorting: when `true`, disables client sorting (`getSortedRowModel` skip + `manualSorting`). The sort *UI/state* is kept (header click → `onSortingChange`) but actual sorting is delegated to the server. default `false`. |
| `mapping?` | `Mapping<TData>` | Screen-to-BE mapping (optional). |
| `maxMultiSortColCount?` | `number` | Maximum number of columns that can be sorted simultaneously. Passed directly to TanStack `maxMultiSortColCount`. Unlimited when unset. Ignored when `enableMultiSort=false`. |
| `onAddRow?` | `(…) => …` | Row-add callback — invoked when `ref.current.addRow(seed?)` is called. Controlled-data policy: the parent is responsible for appending the new row to the `props.data` array. |
| `onCellClick?` | `(…) => …` | Cell click handler — exposes column-level branching intent. grid-core 1.0: `(cell, row, event)` → `(ctx, event)`. `ctx` is a clean GridCellContext — `ctx.columnId`·`ctx.value`·`ctx.rowId`·`ctx.row` (= old `row.original`). |
| `onCellKeyDown?` | `(…) => …` | Cell keyboard event handler — wired via `<td onKeyDown>`. grid-core 1.0: `(cell, row, event)` → `(ctx, event)` (clean GridCellContext). |
| `onColumnFiltersChange?` | `OnChangeFn<ColumnFiltersState>` | ColumnFilters state change callback (for deriving server-filter parameters; also updates internal state). |
| `onColumnOrderChange?` | `(…) => …` | Callback invoked after column reordering completes. The parent can sync external state.  : absorbs F-07-06. |
| `onColumnPinningChange?` | `OnChangeFn<ColumnPinningState>` | ColumnPinning state change callback (for external persistence or a controlled mirror). |
| `onColumnSizingChange?` | `OnChangeFn<ColumnSizingState>` | ColumnSizing state change callback (for external persistence or a controlled mirror). |
| `onDeleteRow?` | `(…) => …` | Row-delete callback — invoked when `ref.current.deleteRow(rowId)` is called. `rowId` = TanStack `row.id` (default = row index string). |
| `onRowClick?` | `(…) => …` | Row click handler. |
| `onRowDoubleClick?` | `(…) => …` | Row double-click handler — same signature policy as `onRowClick`. |
| `onRowDragStart?` | `(…) => …` | Cross-grid row drag — drag source (default none=disabled). When provided, data rows become draggable and `onRowDragStart(rowId)` is called on dragstart (`rowId` = TanStack `row.id`). The consumer **lifts the dragged row id into state above both grids** to hold it (consumer-owns-payload, dataTransfer not used). Pairs with the target grid's `onRowDrop`. **Separately opt-in** from enableRowReorder (mixing in the same grid is forbidden=vN). byte-identical when OFF. |
| `onRowDrop?` | `(…) => …` | Cross-grid row drag — drop target (default none=disabled). When provided, the grid body area becomes a drop target and `onRowDrop` is called (on drop). The consumer reads its own `dragged` id and applies source→target data via the pure `transferRow`. byte-identical when OFF. |
| `onRowReorder?` | `(…) => …` | Row reorder drop callback — display index `from`→`to`. The consumer applies data via `moveRow`. |
| `onSave?` | `(…) => …` | Convenience callback — invoked with the latest ChangeSet on user demand by the consumer (the alias does NOT auto-call `commitChanges`; that is the caller's responsibility to keep the alias's network policy explicit). Forwarded out via the imperative ref handle's `getChangeSet`. |
| `onSortingChange?` | `OnChangeFn<SortingState>` | Sorting state change callback (for deriving server-sort parameters; also updates internal state). |
| `onStartEditing?` | `(…) => …` | Programmatic edit-start callback — invoked when `ref.current.startEditing(rowId, colId)` is called.  Same policy as the callback-delegating pattern: the Grid does not own the editing state and the application is responsible for updating EditableCell `isEditing`. |
| `onUpdateRow?` | `(…) => …` | Row partial-update callback — invoked when `ref.current.updateRow(rowId, patch)` is called. |
| `optimistic?` | `boolean` | Optimistic update — auto-rollback on commit failure. |
| `pagination?` | `GridPaginationOptions` | Pagination detail options (takes effect when `enablePagination=true`). |
| `persistColumnOrder?` | `boolean` | Enable persisting column order to localStorage. When `true` + `columnOrderStorageKey` is specified, saves to localStorage after drag/keyboard completes. At mount, restores the saved order (`table.setColumnOrder`). |
| `renderFloatingFilter?` | `(…) => …` | Floating filter row render callback. When specified, draws an always-visible filter input row below the leaf header row (prop presence=enabled, mirrors the `cellClassName` convention). Called once per column — usually returns grid-features' floating input component (sharing the same state as the popover via `column.setValue`). grid-core provides only the structural row + column window (virtualization)·pin sticky·ARIA consistency (no grid-features dependency=MIT). Returning null=empty cell. grid-core 1.0: `Column<TData,unknown>` → clean GridFilterColumn (`id`·`value`·`setValue` — no TanStack types). |
| `rowClassName?` | `RowClassNameCallback<TData>` | Per-row className generation callback. Called on every row render. The returned string is appended to the `<tr>`'s base className. **Virtualization note**: when `enableVirtualization=true`, `<tr ref={measureElement}>` measures row height — if `rowClassName` causes dynamic height changes, measureElement reflow occurs repeatedly (performance degradation). A static className is recommended. |
| `rowKey` | `keyof TData \| (…) => …` | PK extractor for change tracking. |
| `rowSelection?` | `RowSelectionMode \| GridRowSelectionOptions<TData>` | Row selection options. Both the shorthand form (`'multi'`) and the object form are supported. With 'single'/'multi', a checkbox column (`__select__`) is auto-prepended as the first left column. |
| `showSortClearButton?` | `boolean` | Whether to show the sort-clear button. When `true` and `enableMultiSort=true`, renders `<SortClearButton>` in the toolbar. When unset (default), no DOM structure change. |
| `sortDescFirst?` | `boolean` | Make the first-click sort direction descending. (TanStack `sortDescFirst` passthrough — when unspecified, per-type default: number=desc-first, text=asc-first.) |
| `theme?` | `Partial<GridTheme>` | Grid chrome color theme (partial override). Only the provided colors are applied to the root as inline `--topgrid-*` vars, and each surface reads them via `var(--topgrid-x, <default hex>)`. Unspecified keys fall back to the default color. For presets like dark, `import { darkTheme }` then spread. ⚠ CSS vars are ineffective under forced-colors (high contrast) (HC-safe selection indication uses a separate mechanism). |
| `validator?` | `Validator<TData>` | Row validator (optional). |
| `virtualizerOptions?` | `{ … }` | `useVirtualizer` option override. - `estimateSize`: estimated row height in px (default `36`, based on BaseGrid `<td className="px-4 py-3">`). - `overscan`: number of buffer rows above/below the viewport (default `10`, same as VirtualGrid.tsx:102). - `onChange`: virtualizer change callback (observes the visible range — SSRM's block-fetch trigger).  Passed through as-is to `useVirtualizer`. Generic passthrough (0 SSRM-specific logic). |
| `virtualScrollHeight?` | `number` | Scroll container height when virtualizing (px, default `400`). Takes effect only when `enableVirtualization=true`. |

### `CommitOptions`

Options for `commitChanges`.

| Property | Type | Description |
|---|---|---|
| `autoReset?` | `boolean` | Auto `resetChanges` on success. Default `true`. |
| `fetcher?` | `(…) => …` | Custom fetcher (axios-compatible). Default `globalThis.fetch`. |
| `method?` | `string` | HTTP method. Default `'POST'`. |
| `optimistic?` | `boolean` | Override `config.optimistic` for this single call. When `true`, a failure during commit dispatches RESET (rollback of all tracked changes) before re-throwing. Default = `config.optimistic`. |

### `MappedRow`

Mapped row shape produced by `buildChangeSet` / `getChangeSet`.
Keys correspond to BE field names after `Mapping<TData>` is applied.
When no mapping is provided the keys mirror the original `TData` fields.

### `RowStatusClassNames`

Tailwind className strings for each row status.
Pass a partial override to `getRowStatusClassName` to customise colours.

| Property | Type | Description |
|---|---|---|
| `added` | `string` |  |
| `deleted` | `string` |  |
| `edited` | `string` |  |

### `Mapping`

Screen-to-BE field mapping. Value is either a target BE field name or a
derived function `(row) => value`. Applied during `getChangeSet` / `commitChanges`.

```ts
type Mapping = Record<string, string | (…) => …>
```

### `OriginalSnapshot`

Edited row shape — `TData` merged with the structuredClone snapshot captured
at the moment of the first `updateRow` call.

Named alias of the previously-inline `TData & { __original: TData }` so that
downstream code (renderers, mapping helpers, docs) can reference the shape
by name. Runtime-equivalent to the inline form (TypeScript structural typing).

```ts
type OriginalSnapshot = TData & { … }
```

### `RowStatus`

Row change status. `unchanged` rows omit `__rowStatus`.

```ts
type RowStatus = "added" | "edited" | "deleted"
```

### `Validator`

Row-level validator returning `{ valid, errors? }`. When `valid` is `false`,
the row is excluded from `added`/`updated` and an entry is pushed into `errors`.

```ts
type Validator = (…) => …
```

## Constants

### `defaultRowStatusClassNames`

Default Tailwind classNames for each row status.

```ts
const defaultRowStatusClassNames: Readonly<RowStatusClassNames>
```

