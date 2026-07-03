---
title: "@topgrid/grid-pro-master"
sidebar_label: "grid-pro-master"
sidebar_position: 20
---

# @topgrid/grid-pro-master

> Pro: Master-Detail, TreeGrid, Context Menu · **Commercial (EULA)**

:::info Auto-generated
This page is auto-generated from the TSDoc comments in the source code (internal markers scrubbed). For a curated getting-started summary, see the [API Reference](../api-reference).
:::

**19** public exports — 3 functions · 1 hooks · 4 components · 11 types · 0 constants.

## Components

### `ColumnPinGrid`

```ts
ColumnPinGrid(props: ColumnPinGridProps<TData>): Element
```

### `ContextMenuGrid`

```ts
ContextMenuGrid(props: ContextMenuGridProps<TData> & { … }): ReactElement
```

### `MasterDetailGrid`

```ts
MasterDetailGrid(props: MasterDetailGridProps<TData> & { … }): ReactElement
```

### `TreeGrid`

```ts
TreeGrid(props: TreeGridProps<TData>): Element
```

## Hooks

### `useExpandedPersistence`

Pro-tier hook — persists TanStack `ExpandedState` to Web Storage.

```ts
useExpandedPersistence(options: UseExpandedPersistenceOptions): [ExpandedState, ExpandedStateSetter]
```

| Parameter | Type | Description |
|---|---|---|
| `options` | `UseExpandedPersistenceOptions` | Persistence options (storageKey, storageType, initialExpanded). |

**Returns** — `[expanded, setExpanded]` tuple compatible with TanStack `ExpandedState`.

## Functions

### `cellValueToClipboardText`

Cell value → clipboard text (pure, W1 Phase 0, ported from grid-pro-master).

A value→text mapping decoupled from the browser `navigator.clipboard` wiring. framework-agnostic —
shared by the React copy(makeCopyCellItem) and Vue copy adapters.

Mapping: null/undefined→''(empty string, not "null"/"undefined") · object(including arrays)→JSON.stringify ·
 otherwise(string/number/boolean)→String.

```ts
cellValueToClipboardText(cell: { … }): string
```

### `makeCopyCellItem`

```ts
makeCopyCellItem(opts: MakeCopyCellItemOptions): ContextMenuItem<TData>
```

### `makeExportItem`

```ts
makeExportItem(opts: MakeExportItemOptions<TData>): ContextMenuItem<TData>
```

## Types & Interfaces

### `ColumnPinGridProps`

`ColumnPinGridProps<TData>` — AS-IS shape preserved (ColumnPinGrid.tsx L14-26).

| Property | Type | Description |
|---|---|---|
| `className?` | `string` |  |
| `columns` | `ColumnDef<TData>[]` |  |
| `data` | `TData[]` |  |
| `emptyText?` | `string` |  |
| `loading?` | `boolean` |  |
| `onRowClick?` | `(…) => …` |  |
| `pagination?` | `GridPaginationOptions` |  |
| `pinLeft?` | `string[]` | Array of left-side sticky pinned column ids (default `[]`). |
| `pinRight?` | `string[]` | Array of right-side sticky pinned column ids (default `[]`). |
| `rowSelection?` | `GridRowSelectionOptions<TData>` |  |

### `ContextMenuGridProps`

Props for `<ContextMenuGrid>`.

Extends `GridProps<TData>` with context menu specific props.

| Property | Type | Description |
|---|---|---|
| `alwaysMultiSort?` | `boolean` | Accumulate multi-sort even on a plain click. Use together with `enableMultiSort`. By default Shift+click is the multi-sort key, but when `true`, clicking columns sequentially **without Shift** accumulates. (TanStack `isMultiSortEvent: => true` passthrough.) |
| `autoSelectFirstRow?` | `boolean` | Auto-select the first row after data load (default `false`). |
| `cellClassName?` | `CellClassNameCallback<TData>` | Per-cell className generation callback. Called on every cell render. The returned string is appended to the default className of the `<td>`. **canonical**: this callback type is owned by grid-core. grid-renderers is a type-only re-export. **Usage example** (publish/organizeSchedule equivalent): ```tsx cellClassName={(cell) => {  if (!cell.column.id.startsWith('d')) return '';  const isSelected = cell.row.getIsSelected;  const hasValue = cell.getValue != null && cell.getValue !== '';  return [  isSelected && 'bg-indigo-100',  !isSelected && hasValue && 'bg-yellow-50',  ].filter(Boolean).join(' '); }} ``` **Performance note**: called on every cell render — beware of the cost of computation inside the callback with large datasets (useMemo or a stable callback recommended). |
| `className?` | `string` | Outer wrapper className (Tailwind). |
| `columnOrderStorageKey?` | `string` | localStorage key used when `persistColumnOrder=true`. Passing an empty string (`''`) means no localStorage access. When unspecified, saving is skipped even if `persistColumnOrder=true`. |
| `columnPersistence?` | `ColumnPersistenceOptions` | Options for localStorage persistence of column visibility + order. - When provided, the `<ColumnVisibilityMenu>` UI is auto-rendered + `useColumnPersistence` is activated. - When not provided (`undefined`), persistence is disabled + the menu is not shown (backward compat). - With `storageKey: ''`, there is no localStorage access (NFR-006). |
| `columnResizeMode?` | `GridColumnResizeMode` | Column resize mode (default `'onChange'`). Only takes effect when `enableColumnResizing=true`. |
| `columns` | `ColumnDef<TData, unknown>[]` | Column definitions (TanStack `ColumnDef`). |
| `contextMenuItems?` | `ContextMenuItem<TData>[]` | Array of context menu items displayed on right-click. When absent (or empty), right-click falls through to the browser default. When provided, `preventDefault` is called and the custom menu is shown. |
| `data` | `TData[]` | Row data array. |
| `debug?` | `boolean` | Exposes the TanStack `debugTable` option (default `false`). |
| `defaultColumnPinning?` | `ColumnPinningState` | Uncontrolled initial value for column pinning (`{ left: string[]; right: string[] }`). The entry point for ColumnPinGrid `pinLeft` / `pinRight` alias mapping. |
| `defaultColumnSizing?` | `ColumnSizingState` | Uncontrolled initial value for column width (column id → px). Used as the initial value of the internal `columnSizing` state at mount (uncontrolled pattern). |
| `defaultExpanded?` | `false \| ExpandedState` | Initial expanded state when `enableExpanding=true` (uncontrolled). - `true` = expand all - `Record<string, boolean>` = expand only specific row ids - unspecified = `{}` (all collapsed)  — TreeGrid alias `expandAll={true}` compatibility entry point. Preserves the AS-IS TreeGrid.tsx:35 `useState<ExpandedState>(initialExpandAll ? true : {})` initial seed pattern. |
| `emptyState?` | `ReactNode` | Empty-result state ReactNode slot. When provided, it renders in preference to `emptyText` (— order: slot → text → defaultText). |
| `emptyText?` | `string` | Empty-result guidance text (default `'데이터가 없습니다.'`). |
| `enableCellChangeFlash?` | `boolean` | Briefly highlights a cell on value change (change-flash). When `data` changes, a ~0.9s background highlight is applied to the **cells whose value actually changed** (diffed by row identity — reorders are not highlighted). For stable highlighting, specifying `getRowId` together is recommended (when unspecified, the diff is index-based → reorders get highlighted too). |
| `enableColumnPinning?` | `boolean` | Activates column pinning state (default `false`). This only activates the `state.columnPinning` state. The sticky CSS appearance is out of scope. |
| `enableColumnReorder?` | `boolean` | Activates column drag reorder (default `false`). Based on the HTML5 Drag and Drop API — no external dnd library used.  :. |
| `enableColumnResizing?` | `boolean` | Activates column resize state (default `false`). The resize handle UI is out of scope. |
| `enableColumnVirtualization?` | `boolean` | Activates column (horizontal) virtualization. When `true`, off-screen **center** columns are not rendered and only the horizontal scroll width is maintained via left/right padding cells — cutting the render cost of 100+ columns. **Pinned columns are not subject to virtualization and are always rendered regardless of horizontal scroll.** unspecified/`false` → all columns rendered (byte-identical to prior behavior). **v1 constraint**: **flat (single-row) headers only** — for grouped/multi-tier headers (`getHeaderGroups.length > 1`), it auto-disables due to colSpan accounting complexity (all columns rendered). Grouped-header virtualization is v2. **Layout**: when `true`, the `<table>` is fixed to `table-layout: fixed` + the total column width (Σ`getSize`) so columns keep their explicit widths precisely (aligned with the pad px). As a side effect, **cell content that exceeds the column width is clipped** — normal behavior for a virtualized grid. The horizontal scroll container is provided by the existing `overflow-x-auto` (or the row-virtualization `overflow:auto`), so consumers not using Tailwind must set `overflow-x` on the container directly. **⚠️ Experimental**: body+header virtualization wiring + chromium alignment matrix complete (Commit C). off=byte-identical to prior, SSR/unmeasured → all columns rendered (safe fallback). |
| `enableExpanding?` | `boolean` | Activates row expanding state (default `false`) — absorbs TreeGrid. Use together with `getSubRows`. |
| `enableFilter?` | `boolean` | Activates column filter (default `false`) — `getFilteredRowModel` wiring. |
| `enableMultiSort?` | `boolean` | Activates multi-sort (default `false`) — delegates to TanStack `enableMultiSort`. |
| `enablePagination?` | `boolean` | Activates pagination (default `false`) — `getPaginationRowModel` wiring. |
| `enableRowClickSelection?` | `boolean` | Select by clicking the row body. Only works when `rowSelection` is `'single'`/`'multi'`. - plain click → selects only that row (deselects the rest). ctrl/cmd+click → toggle (accumulate multi). (shift range = ) - **Coexists independently** with the existing `onRowClick` callback — it makes the selection while still calling `onRowClick`. - A click on the checkbox cell (`__select__`) does not take this path due to `stopPropagation` (preserves existing behavior). |
| `enableRowPinning?` | `boolean` | Row pinning. The user pins data rows to the top/bottom (`row.pin('top'\|'bottom')`). Pinned rows are sticky and stay fixed during scroll, and are excluded from center rows. **Non-virtualized only** (virtualization+pin=vN). Place the `RowPinButton` component in a cell as the UI control. |
| `enableRowReorder?` | `boolean` | Activates row drag reorder (default `false`). Makes data rows draggable and calls `onRowReorder(from, to)` on drop (the consumer applies it to their own data via `moveRow(data, from, to)`). **Auto-disabled when sort/filter is active** (display order≠data order makes reordering ambiguous) + **non-virtualized only** (virtualization compositing = vN). HTML5 drag. |
| `enableSort?` | `boolean` | Activates sort (default `false`) — `getSortedRowModel` wiring. |
| `enableVirtualization?` | `boolean` | Activates virtualization (default `false`) — opt-in only. When `true`, `useGridVirtualizer` wiring + the tbody padding-row pattern is applied. When `false`, the ~ markup stays as-is (preserving sticky/pinning). |
| `floatingBottomRows?` | `TData[]` | Consumer-supplied row data pinned to the **bottom** of the grid. Same contract as `floatingTopRows` (bottom sticky). |
| `floatingTopRows?` | `TData[]` | Consumer-supplied row data pinned to the **top** of the grid. Isomorphic to XX Grid's `pinnedTopRowData` — additional rows *outside* the data model (totals/summaries, etc.). They pass through the column cell renderers (`columnDef.cell`) as-is and display identically to body rows, and stay fixed via `position: sticky` even as the body scrolls. **No aggregation computed**: the consumer supplies the total object directly (auto-aggregation is `@topgrid/grid-pro-agg`/Pro). **Not interactive pinning**: separate from the feature where a user pins existing rows (`@topgrid/grid-pro-master`/Pro). unspecified/empty array → no render (behavior unchanged). |
| `getCellTooltip?` | `(…) => …` | Cell tooltip. Called per cell to assign the returned string as `<td title>` (native hover tooltip) — for showing clipped content, extra notes, etc. When `undefined`/`null`/`''` is returned, no title is assigned to that cell. grid-core 1.0 : `(cell, row)` → `(ctx)` (clean GridCellContext). |
| `getRowId?` | `(…) => …` | Stable row identifier. When unspecified, the row key = array index. When provided, all row-key states such as `rowSelection`·`expanded` are keyed by **this id rather than the index**, so **the same logical row is tracked** across data reorder/replacement (selection follows identity, not position). The foundation on which cell change flash identifies "the same row". |
| `getSubRows?` | `(…) => …` | TanStack `getSubRows` — used when `enableExpanding=true`. |
| `icons?` | `Partial<GridIcons>` | Sort indicator icon glyph override (partial). Unspecified falls back to the defaults (`▲▼⇅`). |
| `loading?` | `boolean` | Loading state. When `true`, only the `<tbody>` area is replaced with skeleton rows (thead preserved — ). |
| `loadingOverlay?` | `boolean` | Loading overlay (default `false`). Unlike `loading` (skeleton replacement), it **leaves the existing data rows in place** and covers them with a semi-transparent overlay (indicating an in-progress refresh while keeping existing data). `aria-busy` + blocks pointer-events (prevents underlying interaction). Independent and additive from `loading` (skeleton) — both leave existing behavior unchanged. |
| `loadingRowCount?` | `number` | Number of skeleton rows to show while loading. When unspecified, falls back to `pagination.pageSize ?? 5` (— compatible with the BaseGrid L123 hardcoded `5`). |
| `localeText?` | `Partial<GridLocale>` | Localization of grid chrome strings — partial override. Unspecified keys fall back to the Korean defaults (never emits raw key/undefined). English example: `{ emptyText: 'No data', rowsPerPage: 'Rows per page:', totalCount: (n) => `$&#123;n} rows` }`. You can also import `defaultGridLocale` and spread on top of it. |
| `manualFiltering?` | `boolean` | Server filtering: when `true`, disables client filtering (`getFilteredRowModel` skip + `manualFiltering`). default `false`. |
| `manualSorting?` | `boolean` | Server sorting: when `true`, disables client sorting (`getSortedRowModel` skip + `manualSorting`). The sort *UI/state* is retained (header click → `onSortingChange`), but the actual sorting is delegated to the server. default `false`. |
| `maxMultiSortColCount?` | `number` | Maximum number of columns that can be sorted simultaneously. Passed directly to TanStack `maxMultiSortColCount`. Unlimited when unset. Ignored when `enableMultiSort=false`. |
| `onAddRow?` | `(…) => …` | Row add callback — invoked when `ref.current.addRow(seed?)` is called. controlled data policy: the parent is responsible for appending the new row to the `props.data` array. |
| `onCellClick?` | `(…) => …` | Cell click handler — exposes column-level branching intent. grid-core 1.0 : `(cell, row, event)` → `(ctx, event)`. `ctx` is a clean GridCellContext — `ctx.columnId`·`ctx.value`·`ctx.rowId`·`ctx.row`(= old `row.original`). |
| `onCellKeyDown?` | `(…) => …` | Cell keyboard event handler — wired via `<td onKeyDown>`. grid-core 1.0 : `(cell, row, event)` → `(ctx, event)` (clean GridCellContext). |
| `onColumnFiltersChange?` | `OnChangeFn<ColumnFiltersState>` | ColumnFilters state change callback (for deriving server filter parameters; also updates internal state). |
| `onColumnOrderChange?` | `(…) => …` | Callback invoked after column order change completes. Lets the parent sync external state.  : absorbs F-07-06. |
| `onColumnPinningChange?` | `OnChangeFn<ColumnPinningState>` | ColumnPinning state change callback (for external persistence or a controlled mirror). |
| `onColumnSizingChange?` | `OnChangeFn<ColumnSizingState>` | ColumnSizing state change callback (for external persistence or a controlled mirror). |
| `onDeleteRow?` | `(…) => …` | Row delete callback — invoked when `ref.current.deleteRow(rowId)` is called. `rowId` = TanStack `row.id` (default = row index string). |
| `onRowClick?` | `(…) => …` | Row click handler. |
| `onRowDoubleClick?` | `(…) => …` | Row double-click handler — same signature policy as `onRowClick`. |
| `onRowDragStart?` | `(…) => …` | Cross-grid row drag — drag source (default none=disabled). When provided, data rows become draggable and `onRowDragStart(rowId)` is called on dragstart (`rowId` = TanStack `row.id`). The consumer **lifts the dragged row id into state above the two grids** for storage (consumer-owns-payload, dataTransfer not used). Paired with the target grid's `onRowDrop`. A **separate opt-in** from enableRowReorder (mixing them in the same grid is forbidden=vN). OFF → byte-identical. |
| `onRowDrop?` | `(…) => …` | Cross-grid row drag — drop target (default none=disabled). When provided, the grid body area becomes a drop target and `onRowDrop` is called (on drop). The consumer reads its own `dragged` id and applies source→target data via the pure `transferRow`. OFF → byte-identical. |
| `onRowReorder?` | `(…) => …` | Row reorder drop callback — display index `from`→`to`. The consumer applies the data via `moveRow`. |
| `onSortingChange?` | `OnChangeFn<SortingState>` | Sorting state change callback (for deriving server sort parameters; also updates internal state). |
| `onStartEditing?` | `(…) => …` | Programmatic edit-start callback — invoked when `ref.current.startEditing(rowId, colId)` is called.  Same policy as the callback-delegating pattern: the Grid does not own editing state and the application is responsible for updating the EditableCell `isEditing`. |
| `onUpdateRow?` | `(…) => …` | Row partial-update callback — invoked when `ref.current.updateRow(rowId, patch)` is called. |
| `pagination?` | `GridPaginationOptions` | Pagination detail options (in effect when `enablePagination=true`). |
| `persistColumnOrder?` | `boolean` | Activates localStorage persistence of column order. When `true` + `columnOrderStorageKey` is specified, saves to localStorage after drag/keyboard completes. Restores the saved order at mount (`table.setColumnOrder`). |
| `renderFloatingFilter?` | `(…) => …` | Floating filter row render callback. When specified, draws an always-visible filter input row below the leaf header row (prop presence=active, mirroring the `cellClassName` convention). Called once per column — usually returns a grid-features floating input component (sharing the same state as the popover via `column.setValue`). grid-core provides only the structural row + column window (virtualization)·pin sticky·ARIA consistency (no grid-features dependency=MIT). null return=empty cell. grid-core 1.0 : `Column<TData,unknown>` → clean GridFilterColumn (`id`·`value`·`setValue` — no TanStack types). |
| `rowClassName?` | `RowClassNameCallback<TData>` | Per-row className generation callback. Called on every row render. The returned string is appended to the default className of the `<tr>`. **virtualization note**: when `enableVirtualization=true`, `<tr ref={measureElement}>` measures row height — if `rowClassName` triggers dynamic height changes, measureElement reflow occurs repeatedly (performance degradation). A static className is recommended. |
| `rowSelection?` | `RowSelectionMode \| GridRowSelectionOptions<TData>` | Row selection options. Both shorthand (`'multi'`) and object notation are supported. With 'single'/'multi', a checkbox column (`__select__`) is auto-prepended as the first column on the left. |
| `showSortClearButton?` | `boolean` | Whether to show the sort clear button. When `true` and `enableMultiSort=true`, a `<SortClearButton>` is rendered in the toolbar. When unset (default), no DOM structure change. |
| `sortDescFirst?` | `boolean` | Make the first click's sort direction descending. (TanStack `sortDescFirst` passthrough — when unspecified, type-based default: number=desc-first, string=asc-first.) |
| `theme?` | `Partial<GridTheme>` | Grid chrome color theme (partial override). Only the colors you provide are applied to the root as inline `--topgrid-*` vars, and each surface reads them via `var(--topgrid-x, <default hex>)`. Unspecified keys fall back to the default color. For presets like dark, `import { darkTheme }` and spread. ⚠ CSS vars are inert under forced-colors (high contrast) (HC-safe selection indication uses a separate mechanism). |
| `virtualizerOptions?` | `{ … }` | `useVirtualizer` option override. - `estimateSize`: estimated row height in px (default `36`, based on BaseGrid `<td className="px-4 py-3">`). - `overscan`: number of buffer rows above/below the viewport (default `10`, same as VirtualGrid.tsx:102). - `onChange`: virtualizer change callback (observe visible range — the block fetch trigger for SSRM).  Passed through to `useVirtualizer` as-is. Generic passthrough (0 SSRM-specific logic). |
| `virtualScrollHeight?` | `number` | Scroll container height when virtualizing (px, default `400`). Only takes effect when `enableVirtualization=true`. |

### `ContextMenuItem`

A single context menu item definition.

| Property | Type | Description |
|---|---|---|
| `children?` | `ContextMenuItem<TData>[]` | Optional submenu. When provided, this item opens a nested context menu on hover instead of (or in addition to) firing `onClick`. A `▶` affordance is rendered on the right and `aria-haspopup="menu"` is set. Submenu items are themselves `ContextMenuItem`s, so nesting is recursive. |
| `disabled?` | `boolean \| (…) => …` | Whether this item is disabled. - `boolean`: static disabled state. - `(row: TData) => boolean`: evaluated at render time against the target row. Disabled items are rendered but not clickable (pointer-events: none equivalent). |
| `icon?` | `ReactNode` | Optional leading icon, rendered to the left of the label. Any `ReactNode` (e.g. an SVG element or an emoji string). |
| `label` | `string` | Display label for the menu item. For separator items, the label is ignored — pass an empty string. |
| `onClick?` | `(…) => …` | Click handler for this menu item. Optional — submenu parent items (those with `children`) typically omit it, since clicking only toggles the submenu. Leaf items should provide it. |
| `separator?` | `boolean` | When `true`, renders a horizontal separator line. All other properties except `label` are ignored for separator items. |
| `shortcut?` | `string` | Optional keyboard shortcut hint displayed on the right side of the label. When the wrapper div has focus and this combination is pressed while the menu is open, the item's `onClick` is triggered (if not disabled). Grammar: `"[Modifier+]Key"` where Modifier ∈ &#123;Ctrl, Alt, Shift} (combinable, e.g. `"Ctrl+Shift+E"`). The key is matched case-insensitively against `event.key`; modifier flags (`ctrlKey`/`altKey`/`shiftKey`) must match exactly. Invalid grammar (e.g. `"Ctrl+"`) is ignored (warns in dev). |

### `MakeCopyCellItemOptions`

| Property | Type | Description |
|---|---|---|
| `icon?` | `ReactNode` | Override the leading icon. |
| `label?` | `string` | Override the menu label. |

### `MakeExportItemOptions`

| Property | Type | Description |
|---|---|---|
| `columns` | `ExcelColumn[]` | Column spec (key/header/width/format). |
| `exporter?` | `(…) => …` | Injectable exporter — defaults to the grid-export exporter for the chosen format. Tests pass a spy to assert invocation without a real download. |
| `exportOptions?` | `ExportItemOptions` | Passed through to the chosen exporter (fileName/etc; format-specific fields). |
| `format?` | `ExportFormat` | Export format — picks the matching row-array exporter + default label. |
| `icon?` | `ReactNode` | Override the leading icon. |
| `label?` | `string` | Override the menu label. |
| `rows` | `TData[]` | Rows to export (the dataset the consumer passed to the grid). |

### `MasterDetailGridProps`

Props for `<MasterDetailGrid>`.

Extends `GridProps<TData>` with Master-Detail specific props.

| Property | Type | Description |
|---|---|---|
| `alwaysMultiSort?` | `boolean` | Accumulate multi-sort even on a plain click. Use together with `enableMultiSort`. By default Shift+click is the multi-sort key, but when `true`, clicking columns sequentially **without Shift** accumulates. (TanStack `isMultiSortEvent: => true` passthrough.) |
| `autoSelectFirstRow?` | `boolean` | Auto-select the first row after data load (default `false`). |
| `cellClassName?` | `CellClassNameCallback<TData>` | Per-cell className generation callback. Called on every cell render. The returned string is appended to the default className of the `<td>`. **canonical**: this callback type is owned by grid-core. grid-renderers is a type-only re-export. **Usage example** (publish/organizeSchedule equivalent): ```tsx cellClassName={(cell) => {  if (!cell.column.id.startsWith('d')) return '';  const isSelected = cell.row.getIsSelected;  const hasValue = cell.getValue != null && cell.getValue !== '';  return [  isSelected && 'bg-indigo-100',  !isSelected && hasValue && 'bg-yellow-50',  ].filter(Boolean).join(' '); }} ``` **Performance note**: called on every cell render — beware of the cost of computation inside the callback with large datasets (useMemo or a stable callback recommended). |
| `className?` | `string` | Outer wrapper className (Tailwind). |
| `columnOrderStorageKey?` | `string` | localStorage key used when `persistColumnOrder=true`. Passing an empty string (`''`) means no localStorage access. When unspecified, saving is skipped even if `persistColumnOrder=true`. |
| `columnPersistence?` | `ColumnPersistenceOptions` | Options for localStorage persistence of column visibility + order. - When provided, the `<ColumnVisibilityMenu>` UI is auto-rendered + `useColumnPersistence` is activated. - When not provided (`undefined`), persistence is disabled + the menu is not shown (backward compat). - With `storageKey: ''`, there is no localStorage access (NFR-006). |
| `columnResizeMode?` | `GridColumnResizeMode` | Column resize mode (default `'onChange'`). Only takes effect when `enableColumnResizing=true`. |
| `columns` | `ColumnDef<TData, unknown>[]` | Column definitions (TanStack `ColumnDef`). |
| `data` | `TData[]` | Row data array. |
| `debug?` | `boolean` | Exposes the TanStack `debugTable` option (default `false`). |
| `defaultColumnPinning?` | `ColumnPinningState` | Uncontrolled initial value for column pinning (`{ left: string[]; right: string[] }`). The entry point for ColumnPinGrid `pinLeft` / `pinRight` alias mapping. |
| `defaultColumnSizing?` | `ColumnSizingState` | Uncontrolled initial value for column width (column id → px). Used as the initial value of the internal `columnSizing` state at mount (uncontrolled pattern). |
| `defaultExpanded?` | `false \| ExpandedState` | Initial expanded state when `enableExpanding=true` (uncontrolled). - `true` = expand all - `Record<string, boolean>` = expand only specific row ids - unspecified = `{}` (all collapsed)  — TreeGrid alias `expandAll={true}` compatibility entry point. Preserves the AS-IS TreeGrid.tsx:35 `useState<ExpandedState>(initialExpandAll ? true : {})` initial seed pattern. |
| `emptyState?` | `ReactNode` | Empty-result state ReactNode slot. When provided, it renders in preference to `emptyText` (— order: slot → text → defaultText). |
| `emptyText?` | `string` | Empty-result guidance text (default `'데이터가 없습니다.'`). |
| `enableCellChangeFlash?` | `boolean` | Briefly highlights a cell on value change (change-flash). When `data` changes, a ~0.9s background highlight is applied to the **cells whose value actually changed** (diffed by row identity — reorders are not highlighted). For stable highlighting, specifying `getRowId` together is recommended (when unspecified, the diff is index-based → reorders get highlighted too). |
| `enableColumnPinning?` | `boolean` | Activates column pinning state (default `false`). This only activates the `state.columnPinning` state. The sticky CSS appearance is out of scope. |
| `enableColumnReorder?` | `boolean` | Activates column drag reorder (default `false`). Based on the HTML5 Drag and Drop API — no external dnd library used.  :. |
| `enableColumnResizing?` | `boolean` | Activates column resize state (default `false`). The resize handle UI is out of scope. |
| `enableColumnVirtualization?` | `boolean` | Activates column (horizontal) virtualization. When `true`, off-screen **center** columns are not rendered and only the horizontal scroll width is maintained via left/right padding cells — cutting the render cost of 100+ columns. **Pinned columns are not subject to virtualization and are always rendered regardless of horizontal scroll.** unspecified/`false` → all columns rendered (byte-identical to prior behavior). **v1 constraint**: **flat (single-row) headers only** — for grouped/multi-tier headers (`getHeaderGroups.length > 1`), it auto-disables due to colSpan accounting complexity (all columns rendered). Grouped-header virtualization is v2. **Layout**: when `true`, the `<table>` is fixed to `table-layout: fixed` + the total column width (Σ`getSize`) so columns keep their explicit widths precisely (aligned with the pad px). As a side effect, **cell content that exceeds the column width is clipped** — normal behavior for a virtualized grid. The horizontal scroll container is provided by the existing `overflow-x-auto` (or the row-virtualization `overflow:auto`), so consumers not using Tailwind must set `overflow-x` on the container directly. **⚠️ Experimental**: body+header virtualization wiring + chromium alignment matrix complete (Commit C). off=byte-identical to prior, SSR/unmeasured → all columns rendered (safe fallback). |
| `enableExpanding?` | `boolean` | Activates row expanding state (default `false`) — absorbs TreeGrid. Use together with `getSubRows`. |
| `enableFilter?` | `boolean` | Activates column filter (default `false`) — `getFilteredRowModel` wiring. |
| `enableMultiSort?` | `boolean` | Activates multi-sort (default `false`) — delegates to TanStack `enableMultiSort`. |
| `enablePagination?` | `boolean` | Activates pagination (default `false`) — `getPaginationRowModel` wiring. |
| `enableRowClickSelection?` | `boolean` | Select by clicking the row body. Only works when `rowSelection` is `'single'`/`'multi'`. - plain click → selects only that row (deselects the rest). ctrl/cmd+click → toggle (accumulate multi). (shift range = ) - **Coexists independently** with the existing `onRowClick` callback — it makes the selection while still calling `onRowClick`. - A click on the checkbox cell (`__select__`) does not take this path due to `stopPropagation` (preserves existing behavior). |
| `enableRowPinning?` | `boolean` | Row pinning. The user pins data rows to the top/bottom (`row.pin('top'\|'bottom')`). Pinned rows are sticky and stay fixed during scroll, and are excluded from center rows. **Non-virtualized only** (virtualization+pin=vN). Place the `RowPinButton` component in a cell as the UI control. |
| `enableRowReorder?` | `boolean` | Activates row drag reorder (default `false`). Makes data rows draggable and calls `onRowReorder(from, to)` on drop (the consumer applies it to their own data via `moveRow(data, from, to)`). **Auto-disabled when sort/filter is active** (display order≠data order makes reordering ambiguous) + **non-virtualized only** (virtualization compositing = vN). HTML5 drag. |
| `enableSort?` | `boolean` | Activates sort (default `false`) — `getSortedRowModel` wiring. |
| `enableVirtualization?` | `boolean` | Activates virtualization (default `false`) — opt-in only. When `true`, `useGridVirtualizer` wiring + the tbody padding-row pattern is applied. When `false`, the ~ markup stays as-is (preserving sticky/pinning). |
| `estimatedRowHeight?` | `number` | : row virtualization for large master-detail datasets (`@tanstack/react-virtual`). Each master row (+ its expanded detail) is a measured `<tbody>` so the virtualizer **dynamically measures** variable-height detail panels (`measureElement`), not a fixed estimate. `enableVirtualization` is inherited from `GridProps`. OFF = the plain non-virtualized table (byte-identical). |
| `floatingBottomRows?` | `TData[]` | Consumer-supplied row data pinned to the **bottom** of the grid. Same contract as `floatingTopRows` (bottom sticky). |
| `floatingTopRows?` | `TData[]` | Consumer-supplied row data pinned to the **top** of the grid. Isomorphic to XX Grid's `pinnedTopRowData` — additional rows *outside* the data model (totals/summaries, etc.). They pass through the column cell renderers (`columnDef.cell`) as-is and display identically to body rows, and stay fixed via `position: sticky` even as the body scrolls. **No aggregation computed**: the consumer supplies the total object directly (auto-aggregation is `@topgrid/grid-pro-agg`/Pro). **Not interactive pinning**: separate from the feature where a user pins existing rows (`@topgrid/grid-pro-master`/Pro). unspecified/empty array → no render (behavior unchanged). |
| `getCellTooltip?` | `(…) => …` | Cell tooltip. Called per cell to assign the returned string as `<td title>` (native hover tooltip) — for showing clipped content, extra notes, etc. When `undefined`/`null`/`''` is returned, no title is assigned to that cell. grid-core 1.0 : `(cell, row)` → `(ctx)` (clean GridCellContext). |
| `getRowId?` | `(…) => …` | Stable row identifier. When unspecified, the row key = array index. When provided, all row-key states such as `rowSelection`·`expanded` are keyed by **this id rather than the index**, so **the same logical row is tracked** across data reorder/replacement (selection follows identity, not position). The foundation on which cell change flash identifies "the same row". |
| `getSubRows?` | `(…) => …` | TanStack `getSubRows` — used when `enableExpanding=true`. |
| `icons?` | `Partial<GridIcons>` | Sort indicator icon glyph override (partial). Unspecified falls back to the defaults (`▲▼⇅`). |
| `loading?` | `boolean` | Loading state. When `true`, only the `<tbody>` area is replaced with skeleton rows (thead preserved — ). |
| `loadingOverlay?` | `boolean` | Loading overlay (default `false`). Unlike `loading` (skeleton replacement), it **leaves the existing data rows in place** and covers them with a semi-transparent overlay (indicating an in-progress refresh while keeping existing data). `aria-busy` + blocks pointer-events (prevents underlying interaction). Independent and additive from `loading` (skeleton) — both leave existing behavior unchanged. |
| `loadingRowCount?` | `number` | Number of skeleton rows to show while loading. When unspecified, falls back to `pagination.pageSize ?? 5` (— compatible with the BaseGrid L123 hardcoded `5`). |
| `localeText?` | `Partial<GridLocale>` | Localization of grid chrome strings — partial override. Unspecified keys fall back to the Korean defaults (never emits raw key/undefined). English example: `{ emptyText: 'No data', rowsPerPage: 'Rows per page:', totalCount: (n) => `$&#123;n} rows` }`. You can also import `defaultGridLocale` and spread on top of it. |
| `manualFiltering?` | `boolean` | Server filtering: when `true`, disables client filtering (`getFilteredRowModel` skip + `manualFiltering`). default `false`. |
| `manualSorting?` | `boolean` | Server sorting: when `true`, disables client sorting (`getSortedRowModel` skip + `manualSorting`). The sort *UI/state* is retained (header click → `onSortingChange`), but the actual sorting is delegated to the server. default `false`. |
| `masterDetail?` | `MasterDetailOptions<TData>` | Master-Detail expansion options (controlled/uncontrolled state). |
| `maxMultiSortColCount?` | `number` | Maximum number of columns that can be sorted simultaneously. Passed directly to TanStack `maxMultiSortColCount`. Unlimited when unset. Ignored when `enableMultiSort=false`. |
| `onAddRow?` | `(…) => …` | Row add callback — invoked when `ref.current.addRow(seed?)` is called. controlled data policy: the parent is responsible for appending the new row to the `props.data` array. |
| `onCellClick?` | `(…) => …` | Cell click handler — exposes column-level branching intent. grid-core 1.0 : `(cell, row, event)` → `(ctx, event)`. `ctx` is a clean GridCellContext — `ctx.columnId`·`ctx.value`·`ctx.rowId`·`ctx.row`(= old `row.original`). |
| `onCellKeyDown?` | `(…) => …` | Cell keyboard event handler — wired via `<td onKeyDown>`. grid-core 1.0 : `(cell, row, event)` → `(ctx, event)` (clean GridCellContext). |
| `onColumnFiltersChange?` | `OnChangeFn<ColumnFiltersState>` | ColumnFilters state change callback (for deriving server filter parameters; also updates internal state). |
| `onColumnOrderChange?` | `(…) => …` | Callback invoked after column order change completes. Lets the parent sync external state.  : absorbs F-07-06. |
| `onColumnPinningChange?` | `OnChangeFn<ColumnPinningState>` | ColumnPinning state change callback (for external persistence or a controlled mirror). |
| `onColumnSizingChange?` | `OnChangeFn<ColumnSizingState>` | ColumnSizing state change callback (for external persistence or a controlled mirror). |
| `onDeleteRow?` | `(…) => …` | Row delete callback — invoked when `ref.current.deleteRow(rowId)` is called. `rowId` = TanStack `row.id` (default = row index string). |
| `onRowClick?` | `(…) => …` | Row click handler. |
| `onRowDoubleClick?` | `(…) => …` | Row double-click handler — same signature policy as `onRowClick`. |
| `onRowDragStart?` | `(…) => …` | Cross-grid row drag — drag source (default none=disabled). When provided, data rows become draggable and `onRowDragStart(rowId)` is called on dragstart (`rowId` = TanStack `row.id`). The consumer **lifts the dragged row id into state above the two grids** for storage (consumer-owns-payload, dataTransfer not used). Paired with the target grid's `onRowDrop`. A **separate opt-in** from enableRowReorder (mixing them in the same grid is forbidden=vN). OFF → byte-identical. |
| `onRowDrop?` | `(…) => …` | Cross-grid row drag — drop target (default none=disabled). When provided, the grid body area becomes a drop target and `onRowDrop` is called (on drop). The consumer reads its own `dragged` id and applies source→target data via the pure `transferRow`. OFF → byte-identical. |
| `onRowReorder?` | `(…) => …` | Row reorder drop callback — display index `from`→`to`. The consumer applies the data via `moveRow`. |
| `onSortingChange?` | `OnChangeFn<SortingState>` | Sorting state change callback (for deriving server sort parameters; also updates internal state). |
| `onStartEditing?` | `(…) => …` | Programmatic edit-start callback — invoked when `ref.current.startEditing(rowId, colId)` is called.  Same policy as the callback-delegating pattern: the Grid does not own editing state and the application is responsible for updating the EditableCell `isEditing`. |
| `onUpdateRow?` | `(…) => …` | Row partial-update callback — invoked when `ref.current.updateRow(rowId, patch)` is called. |
| `pagination?` | `GridPaginationOptions` | Pagination detail options (in effect when `enablePagination=true`). |
| `persistColumnOrder?` | `boolean` | Activates localStorage persistence of column order. When `true` + `columnOrderStorageKey` is specified, saves to localStorage after drag/keyboard completes. Restores the saved order at mount (`table.setColumnOrder`). |
| `renderDetailRow?` | `RenderDetailRow<TData>` | Detail row render function. When provided, each row gains an expand toggle in the first column. Clicking the toggle reveals a full-width detail row rendered by this function. When absent, the grid renders as a standard flat grid without expand toggles. |
| `renderFloatingFilter?` | `(…) => …` | Floating filter row render callback. When specified, draws an always-visible filter input row below the leaf header row (prop presence=active, mirroring the `cellClassName` convention). Called once per column — usually returns a grid-features floating input component (sharing the same state as the popover via `column.setValue`). grid-core provides only the structural row + column window (virtualization)·pin sticky·ARIA consistency (no grid-features dependency=MIT). null return=empty cell. grid-core 1.0 : `Column<TData,unknown>` → clean GridFilterColumn (`id`·`value`·`setValue` — no TanStack types). |
| `rowClassName?` | `RowClassNameCallback<TData>` | Per-row className generation callback. Called on every row render. The returned string is appended to the default className of the `<tr>`. **virtualization note**: when `enableVirtualization=true`, `<tr ref={measureElement}>` measures row height — if `rowClassName` triggers dynamic height changes, measureElement reflow occurs repeatedly (performance degradation). A static className is recommended. |
| `rowSelection?` | `RowSelectionMode \| GridRowSelectionOptions<TData>` | Row selection options. Both shorthand (`'multi'`) and object notation are supported. With 'single'/'multi', a checkbox column (`__select__`) is auto-prepended as the first column on the left. |
| `showSortClearButton?` | `boolean` | Whether to show the sort clear button. When `true` and `enableMultiSort=true`, a `<SortClearButton>` is rendered in the toolbar. When unset (default), no DOM structure change. |
| `sortDescFirst?` | `boolean` | Make the first click's sort direction descending. (TanStack `sortDescFirst` passthrough — when unspecified, type-based default: number=desc-first, string=asc-first.) |
| `theme?` | `Partial<GridTheme>` | Grid chrome color theme (partial override). Only the colors you provide are applied to the root as inline `--topgrid-*` vars, and each surface reads them via `var(--topgrid-x, <default hex>)`. Unspecified keys fall back to the default color. For presets like dark, `import { darkTheme }` and spread. ⚠ CSS vars are inert under forced-colors (high contrast) (HC-safe selection indication uses a separate mechanism). |
| `virtualizerOptions?` | `{ … }` | `useVirtualizer` option override. - `estimateSize`: estimated row height in px (default `36`, based on BaseGrid `<td className="px-4 py-3">`). - `overscan`: number of buffer rows above/below the viewport (default `10`, same as VirtualGrid.tsx:102). - `onChange`: virtualizer change callback (observe visible range — the block fetch trigger for SSRM).  Passed through to `useVirtualizer` as-is. Generic passthrough (0 SSRM-specific logic). |
| `virtualMaxHeight?` | `number` | : scroll-container max height (px) when `enableVirtualization` is on. |
| `virtualScrollHeight?` | `number` | Scroll container height when virtualizing (px, default `400`). Only takes effect when `enableVirtualization=true`. |

### `MasterDetailOptions`

Master-Detail expansion options.

| Property | Type | Description |
|---|---|---|
| `expandedRowKeys?` | `string[]` | Controlled expanded row key array. When provided, the component is in controlled mode — expanded state is driven externally. Keys correspond to TanStack `row.id` values. When absent, internal `useState<ExpandedState>` manages state (uncontrolled). |
| `onExpandChange?` | `(…) => …` | Callback fired when expanded rows change. In controlled mode, the parent must update `expandedRowKeys` from this callback. |

### `RowPinningOptions`

Row Pinning base type definition (F-16-06).

Defines `pinTop` / `pinBottom` row id arrays for future TanStack row pinning UI.
**Types-only in this Goal** ( / ) — full UI implementation is a separate
follow-up Goal. Pass these values to a future `RowPinningGrid` component.

| Property | Type | Description |
|---|---|---|
| `pinBottom?` | `string[]` | Row ids to pin at the bottom of the grid. Keys correspond to TanStack `row.id` values. |
| `pinTop?` | `string[]` | Row ids to pin at the top of the grid. Keys correspond to TanStack `row.id` values. |

### `TreeGridProps`

`TreeGridProps<TData>` — AS-IS shape preserved (TreeGrid.tsx L12-22).

| Property | Type | Description |
|---|---|---|
| `className?` | `string` |  |
| `columns` | `ColumnDef<TData>[]` |  |
| `data` | `TData[]` |  |
| `emptyText?` | `string` |  |
| `expandAll?` | `boolean` | When `true`, expands the entire tree at mount ( maps to `defaultExpanded={true}`). |
| `getSubRows?` | `(…) => …` | Child row extraction function (signature-compatible with TanStack `getSubRows`). |
| `loading?` | `boolean` |  |
| `onRowClick?` | `(…) => …` |  |

### `UseExpandedPersistenceOptions`

Options for `useExpandedPersistence`.

| Property | Type | Description |
|---|---|---|
| `initialExpanded?` | `ExpandedState` | Initial `ExpandedState` used when no stored value is found or storage is unavailable. |
| `storageKey` | `string` | Web Storage key. Use a unique key per grid instance to avoid collisions when multiple grids are mounted on the same page. |
| `storageType?` | `StorageType` | Which Web Storage to use. - `'localStorage'` (default): persists across browser sessions. - `'sessionStorage'`: cleared when the tab is closed. |

### `RenderDetailRow`

Render function type for the Master-Detail detail row content.

```ts
type RenderDetailRow = (…) => …
```
