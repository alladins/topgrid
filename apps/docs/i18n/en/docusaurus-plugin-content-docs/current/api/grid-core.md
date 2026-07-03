---
title: "@topgrid/grid-core"
sidebar_label: "grid-core"
sidebar_position: 2
---

# @topgrid/grid-core

> TanStack Table abstraction wrapper + useGridState core hook · **Free (MIT)**

:::info Auto-generated
This page is auto-generated from the source code's TSDoc comments (internal markers scrubbed). For a curated getting-started summary, see the [API Reference](../api-reference).
:::

**109** public exports — 24 functions · 8 hooks · 15 components · 58 types · 4 constants.

## Components

### `BaseGrid`

```ts
BaseGrid(props: BaseGridProps<TData>): Element
```

### `ColumnMenu`

Per-column header menu. Returns null if the column exposes no applicable actions.

```ts
ColumnMenu(__namedParameters: ColumnMenuProps<TData>): null | Element
```

### `ColumnPinGrid`

```ts
ColumnPinGrid(props: ColumnPinGridProps<TData>): Element
```

### `ColumnVisibilityMenu`

Column visibility toggle dropdown menu.

```ts
ColumnVisibilityMenu(props: ColumnVisibilityMenuProps<TData>): Element
```

| Parameter | Type | Description |
|---|---|---|
| `props` | `ColumnVisibilityMenuProps<TData>` | `{ table }`. |

**Returns** — a `<details>`-based column visibility toggle UI.

**Example**

```tsx
// Inside Grid.tsx — rendered only when columnPersistence is provided
{props.columnPersistence !== undefined && (
  <ColumnVisibilityMenu table={table} />
)}
```

**See** — `- ColumnPersistenceOptions`

### `DropIndicator`

The blue vertical-line indicator rendered at the drag drop position.

```ts
DropIndicator(__namedParameters: { … }): null | Element
```

### `Grid`

```ts
Grid(props: GridProps<TData> & { … }): ReactElement
```

### `GridPagination`

Pagination UI container component.

```ts
GridPagination(__namedParameters: GridPaginationProps<TData>): Element
```

### `GroupedHeaderGrid`

```ts
GroupedHeaderGrid(props: GroupedHeaderGridProps<TData>): Element
```

### `PageSizeSelect`

```ts
PageSizeSelect(props: PageSizeSelectProps): ReactNode
```

### `RowPinButton`

```ts
RowPinButton(__namedParameters: RowPinButtonProps<TData>): Element
```

### `SortBadge`

Multi-sort priority badge — grid-core canonical source.

```ts
SortBadge(__namedParameters: SortBadgeProps): null | Element
```

### `SortClearButton`

A button that clears the entire current sort state.
Wire `table.setSorting([])` to the `onClear` callback.

```ts
SortClearButton(__namedParameters: SortClearButtonProps): Element
```

**Example**

```ts
<SortClearButton onClear={() => table.setSorting([])} />
```

**See** — `SortClearButtonProps`

### `TotalCount`

```ts
TotalCount(props: TotalCountProps): ReactNode
```

### `TreeGrid`

```ts
TreeGrid(props: TreeGridProps<TData>): Element
```

### `VirtualGrid`

```ts
VirtualGrid(props: VirtualGridProps<TData>): Element
```

## Hooks

### `useColumnDrag`

Column reorder hook built on the HTML5 Drag and Drop API.

```ts
useColumnDrag(props: UseColumnDragProps<TData>): UseColumnDragReturn
```

| Parameter | Type | Description |
|---|---|---|
| `props` | `UseColumnDragProps<TData>` | UseColumnDragProps |

**Returns** — UseColumnDragReturn

### `useColumnOrderPersist`

Hook that saves/restores column order to localStorage.

- Returns: `{ saveOrder }` — called from handleColumnOrderChange inside useColumnDrag
- On mount: localStorage.getItem → JSON.parse → table.setColumnOrder (restore)
- How to save: call `saveOrder(order)` → localStorage.setItem
- All localStorage access: the adapter wraps it in try/catch
- SSR guard: handled by the adapter
- QuotaExceededError: adapter console.warn + silent skip

```ts
useColumnOrderPersist(__namedParameters: UseColumnOrderPersistProps<TData>): { … }
```

### `useColumnPersistence`

Hook that persists column visibility + order to localStorage.

```ts
useColumnPersistence(table: Table<TData>, options: ColumnPersistenceOptions): void
```

| Parameter | Type | Description |
|---|---|---|
| `table` | `Table<TData>` | The Table instance returned by `useReactTable`. |
| `options` | `ColumnPersistenceOptions` | Persistence options (`ColumnPersistenceOptions`). |

**Example**

```ts
// Inside Grid.tsx — Rules of Hooks compliant: always called (no conditional call)
useColumnPersistence(table, props.columnPersistence ?? { storageKey: '' });
```

**See** — `- ColumnPersistenceOptions`

### `useFullRowEdit`

```ts
useFullRowEdit(__namedParameters: UseFullRowEditOptions<T>): FullRowEditApi<T>
```

### `useGridState`

A unified hook that returns all 8 standard TanStack states + setters at once.

Replaces the 5–7 `useState<StateType>` calls that each variant
(BaseGrid/VirtualGrid/...) used to declare separately with a single line.

** Extensions (controlled/uncontrolled/initialState)**:
- When `options` is omitted, behavior is identical (all state uncontrolled, defaults).
- `initialState`: sets the initial value of a specific key in uncontrolled mode.
- `state`: per-key controlled mode (if `state.sorting` is present, sorting is controlled, the rest uncontrolled).
- `onStateChange(next, key)`: notified on state change — called in both controlled and uncontrolled modes.

** (controlled + initialState both provided)**: when `state` is provided, the `initialState` for that key is ignored (controlled takes precedence).

```ts
useGridState(options: UseGridStateOptions<TData>): GridState<TData>
```

**Returns** — `GridState<TData>` — an object of 8 state values + 8 `OnChangeFn<StateType>` setters.

**Example**

```ts
// G-001 compatible (no parameters)
const s = useGridState<User>();

// uncontrolled + initialState (G-002)
const s = useGridState<Slip>({
  initialState: { sorting: [{ id: 'date', desc: true }], pagination: { pageIndex: 0, pageSize: 20 } },
});

// controlled mode — Redux integration (G-002)
const s = useGridState<Attendance>({
  state: { sorting: externalSorting },
  onStateChange: (next, key) => {
    if (key === 'sorting') dispatch(setGridSorting(next.sorting));
  },
});

// Consumed directly by TanStack useReactTable
const table = useReactTable<User>({
  data,
  columns,
  state: {
    sorting: s.sorting,
    columnFilters: s.columnFilters,
    rowSelection: s.rowSelection,
    pagination: s.pagination,
  },
  onSortingChange: s.setSorting,
  onColumnFiltersChange: s.setColumnFilters,
  onRowSelectionChange: s.setRowSelection,
  onPaginationChange: s.setPagination,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
});
```

**G-004 extensions (resetState / resetSection / clearSelectionKey)**:
- `resetState()`: restores all 8 states to `initialState` (or defaultValues).
- `resetSection(key)`: selectively restores only the state(s) of a single or array key (Set dedup, idempotent).
- `options.clearSelectionKey`: auto-resets `rowSelection` when an external trigger (string | number) changes.
  Absorbs the XxgridTable `clearSelectionKey` pattern (R-A). No reset on mount (isFirstClearRender flag).

**See** — `- GridState`, `- UseGridStateOptions`

### `useStoragePersist`

Options helper that syncs `GridStateValues` ↔ `localStorage` / `sessionStorage`.

- On state change, saves to storage after `debounceMs` (default 300ms)
- On mount, reverse hydration from storage → state (`onHydrate` callback — )
- version mismatch / parse failure → `removeItem` + `onHydrate` not called
- SSR safe (`typeof window` guard inside useEffect body — )
- Fully compliant: option 3 (eslint-disable) 0 lines (Option A saveRef pattern — )

```ts
useStoragePersist(state: GridStateValues<TData>, options: UseStoragePersistOptions<TData>): void
```

| Parameter | Type | Description |
|---|---|---|
| `state` | `GridStateValues<TData>` | `GridStateValues` from `useGridState` or any other source |
| `options` | `UseStoragePersistOptions<TData>` | `UseStoragePersistOptions` (`storageKey` required) |

**Example**

```tsx
const state = useGridState();
useStoragePersist(state, {
  storageKey: 'my-grid-v1',
  version: 1,
  onHydrate: (partial) => {
    if (partial.sorting) state.setSorting(partial.sorting);
    if (partial.columnFilters) state.setColumnFilters(partial.columnFilters);
  },
});
```

### `useUrlSync`

Options helper that syncs an arbitrary subset of `GridStateValues` to URL search params.

- On state change, updates the URL via `window.history.replaceState`
- On mount, reverse hydration from URL → state (`onHydrate` callback — )
- debounce support (`debounceMs` option — reuses `useDebouncedCallback`)
- No router-library dependency
- SSR safe (: the `typeof window` check is inside the useEffect body)

```ts
useUrlSync(state: GridStateValues<TData>, options: UseUrlSyncOptions<TData>): void
```

| Parameter | Type | Description |
|---|---|---|
| `state` | `GridStateValues<TData>` | `GridStateValues` from `useGridState` or any other source |
| `options` | `UseUrlSyncOptions<TData>` | `UseUrlSyncOptions` (all optional) |

**Example**

```tsx
const state = useGridState();
useUrlSync(state, {
  keys: ['sorting', 'columnFilters'],
  onHydrate: (partial) => {
    if (partial.sorting) state.setSorting(partial.sorting);
    if (partial.columnFilters) state.setColumnFilters(partial.columnFilters);
  },
});
```

### `useViewStatePersistence`

Persist a single serializable view-state value to Web Storage (versioned envelope).

```ts
useViewStatePersistence(options: UseViewStatePersistenceOptions<T>): [T, ViewStateSetter<T>]
```

**Returns** — `[value, setValue]` — `setValue` writes through to storage.

## Functions

### `applyRowDraft`

`applyRowDraft` — merges a row-edit draft (a set of changed cells) into the original row.

Pure function (node-verified). The commit unit of full-row editing = the core all-or-nothing transform for the whole row.
It overrides only the fields present in the draft and returns a new object (input immutable, isomorphic to applyRowTransaction/moveRow).

```ts
applyRowDraft(row: T, draft: Record<string, unknown>): T
```

| Parameter | Type | Description |
|---|---|---|
| `row` | `T` | The original row object. |
| `draft` | `Record<string, unknown>` | Changed cells `{ [field]: value }`. An empty object yields an equal copy of the original. |

**Returns** — the merged new row (`{...row,...draft }`). The original is unchanged.

### `applyRowTransaction`

Apply a RowTransaction to `data`, returning a NEW array (input never mutated).
Order = **remove → update → add** (XX Grid semantics). Updates/removes for ids not present are
ignored (no throw). `update` rows are matched by `getRowId` and replace the existing row in place.

```ts
applyRowTransaction(data: readonly TData[], txn: RowTransaction<TData>, getRowId: GetRowId<TData>): TData[]
```

### `blankToUndefined`

Wrap an accessor so blank values (null/undefined/empty-or-whitespace string) become `undefined`,
letting `sortUndefined` place them. Real falsy values (`0`, `false`) pass through unchanged — the
classic bug is treating those as blank.

```ts
blankToUndefined(accessor: (…) => …): (…) => …
```

### `buildTreeFromPaths`

Converts each row of `data` into a hierarchical tree by its `getDataPath` path (pure). Rows with an empty path are skipped.

```ts
buildTreeFromPaths(data: readonly TData[], getDataPath: (…) => …): TreeNode<TData>[]
```

### `compareLocale`

Locale-aware comparison of two cell values. Nullish coerces to '' (placement of nulls is a
separate concern — ). `numeric: true` gives natural number ordering within strings (a2 &lt; a10);
`sensitivity: 'variant'` keeps accents significant.

```ts
compareLocale(a: unknown, b: unknown, locale: string | string[]): number
```

### `createAutoGroupColumn`

Build a ready-made auto group column: indent-by-depth + expand/collapse chevron (only on
expandable rows) + the node value. Sorting/filtering disabled.

```ts
createAutoGroupColumn(options: AutoGroupColumnOptions<TData>): ColumnDef<TData, unknown>
```

### `createColumns`

Takes `TopgridColumnDef<TData>[] | ColumnInfo[]` and returns `ColumnDef<TData>[]`.

- Automatic renderer branching based on the `type` field (rendererRegistry lookup)
- `'checkbox'` type → DisplayColumnDef (no accessorKey, enableSorting forced false)
- Type not registered in the registry → plain text fallback + console.warn
- On `ColumnInfo[]` input, internally narrows to `TopgridColumnDef`
- Standard mapping of `width`, `enableSorting`, `enableResizing`, `meta`

```ts
createColumns(defs: TopgridColumnDef<TData>[] | ColumnInfo[]): ColumnDef<TData>[]
```

| Parameter | Type | Description |
|---|---|---|
| `defs` | `TopgridColumnDef<TData>[] \| ColumnInfo[]` | Column definition array. `TopgridColumnDef<TData>[]` or `ColumnInfo[]`. |

**Returns** — TanStack `ColumnDef<TData>[]` — can be injected directly into `useReactTable({ columns })`.

**Example**

```typescript
// Using TopgridColumnDef directly (recommended)
const defs: TopgridColumnDef<User>[] = [
  { id: 'name', name: '이름', type: 'text', align: 'left', width: '150' },
  { id: 'salary', name: '급여', type: 'number', align: 'right', width: '120' },
  { id: 'sel', name: '', type: 'checkbox', align: 'center', width: '50' },
];
const columns = createColumns<User>(defs);

// Legacy ColumnInfo[] compatibility (AC-005)
const legacyDefs: ColumnInfo[] = [...];
const columns = createColumns(legacyDefs);
```

**See** — `- TopgridColumnDef`, `- ColumnInfo`, `- defaultRendererRegistry`

### `createGroupedColumns`

Takes `TopgridColumnGroup<TData>[]` rest args and returns `ColumnDef<TData>[]`.

```ts
createGroupedColumns(groups: TopgridColumnGroup<TData>[]): ColumnDef<TData>[]
```

| Parameter | Type | Description |
|---|---|---|
| `groups` | `TopgridColumnGroup<TData>[]` | Group column definition rest args. Each item is of the form `{ header, columns }`. |

**Returns** — TanStack `ColumnDef<TData>[]` — can be injected directly into `useReactTable({ columns })`.

**Example**

```typescript
// 2-level multi-tier header (payment-items group)
const columns = createGroupedColumns<Payroll>(
  {
    header: '지급항목',
    columns: createColumns<Payroll>([
      { id: 'basePay',  name: '기본급', type: 'number', align: 'right', width: '120' },
      { id: 'bonus',    name: '상여',   type: 'number', align: 'right', width: '100' },
      { id: 'totalPay', name: '합계',   type: 'number', align: 'right', width: '120' },
    ]),
  },
);

// Multiple groups (basic info + payroll details)
const columns = createGroupedColumns<Employee>(
  {
    header: '기본 정보',
    columns: createColumns<Employee>([
      { id: 'empNo', name: '사번', type: 'text', align: 'center' },
      { id: 'name',  name: '성명', type: 'text', align: 'left'   },
    ]),
  },
  {
    header: '급여 내역',
    columns: createColumns<Employee>([
      { id: 'basePay',  name: '기본급', type: 'number', align: 'right' },
      { id: 'bonus',    name: '상여',   type: 'number', align: 'right' },
      { id: 'totalPay', name: '합계',   type: 'number', align: 'right' },
    ]),
  },
);
```

**See** — `- TopgridColumnGroup`, `- createColumns`, `- GroupedHeaderGrid`

### `createTopgridColumnHelper`

```ts
createTopgridColumnHelper(): ColumnHelper<TData>
```

### `createTransactionBatcher`

: an `applyTransactionAsync` analogue. `enqueue` accumulates transactions and arms a
single `schedule(flush)`; `flush` applies them all to the current data **in order** and commits
via `setData` exactly once (batched). Re-arming happens on the next enqueue after a flush.

```ts
createTransactionBatcher(deps: TransactionBatcherDeps<TData>): TransactionBatcher<TData>
```

### `deserializeViewState`

Parse a versioned envelope back to its value. Returns `null` when:
- `raw` is null,
- JSON parse fails,
- the shape is not `{v,p}`,
- the version does not match (stale schema).

```ts
deserializeViewState(raw: null | string, version: number): null | T
```

### `isBlank`

True for null, undefined, or a string that is empty or all whitespace. NOT for 0 / false.

```ts
isBlank(value: unknown): boolean
```

### `localeSortingFn`

```ts
localeSortingFn(rowA: Row<unknown>, rowB: Row<unknown>, columnId: string): number
```

### `makeLocaleSortingFn`

Build a TanStack `sortingFn` that collates with `localeCompare`. Use per column:
`{ accessorKey: 'name', sortingFn: makeLocaleSortingFn('ko') }`.

```ts
makeLocaleSortingFn(locale: string | string[]): (…) => …
```

### `moveRow`

@topgrid/grid-core — pure row-reorder transform.

Moves the element at `from` so it ends up at index `to` in the result array. splice remove→insert
naturally handles the index adjustment for down/up moves (when from&lt;to, removing pulls the trailing
indices forward, so `to` becomes the final position). No-op / boundary cases return an immutable copy
of the original. The consumer applies it to its own data in the `onRowReorder(from,to)` callback.

```ts
moveRow(rows: readonly T[], from: number, to: number): T[]
```

### `registerRenderer`

Function to register an external renderer.

L2: references the XX Grid `components` injection pattern (R-A).
Uses `Map.set` — no `any`.

The `@topgrid/grid-renderers/wireRegistry.ts` of  wires 8 slots
(text/number/date/dateTime/badge/link/tag/progress) via this function. User custom
renderers can override through the same API (the last call wins).

```ts
registerRenderer(type: TopgridColumnType, fn: RendererFn<TData>, registry: RendererRegistry<TData>): void
```

| Parameter | Type | Description |
|---|---|---|
| `type` | `TopgridColumnType` | The `TopgridColumnType` to register |
| `fn` | `RendererFn<TData>` | Cell renderer function |
| `registry` | `RendererRegistry<TData>` | Target registry (default: `defaultRendererRegistry`) |

**Example**

```typescript
// User custom renderer
registerRenderer('number', (info) => {
  const value = info.getValue();
  return typeof value === 'number' ? value.toLocaleString() : String(value ?? '');
});
```

**See** — `- defaultRendererRegistry`, `- ADR-MOD-GRID-REFACTOR-2026-05-17-002`

### `reorderColumnOrder`

@topgrid/grid-core — reorderColumnOrder ( / ).

Canonical column-order reorder math, extracted from `useColumnDrag.onDrop`
(which now calls this) so header-drag and any other reorder affordance
(e.g. the tool-panel drag) converge on ONE semantics.

Semantics = **insert-before**: `sourceId` is removed, then re-inserted at the
index `targetId` currently occupies in the source-removed array — i.e. source
lands immediately before the target. This matches the prior inline onDrop math
(byte-identical) and the list-reorder convention.

No-op cases return the SAME `baseOrder` reference (callers detect via `===`):
- `sourceId === targetId` (dropped onto itself),
- `targetId` absent from `baseOrder`.

```ts
reorderColumnOrder(baseOrder: string[], sourceId: string, targetId: string): string[]
```

### `resolveIcons`

Merge a partial override over the complete default icon set (missing keys fall back).

```ts
resolveIcons(overrides: Partial<GridIcons>): GridIcons
```

### `resolveLocale`

Merge a partial override over the complete default locale (missing keys fall back).

```ts
resolveLocale(overrides: Partial<GridLocale>): GridLocale
```

### `serializeViewState`

Wrap a value in a versioned envelope string.

```ts
serializeViewState(value: T, version: number): string
```

### `themeToVars`

Map a partial theme to the CSS-custom-property object applied (inline) on the grid root.
Emits ONLY provided keys — absent keys carry no var, so surfaces fall back to their literal
default. Returns `{}` for no theme (root stays var-free → default-on byte-identical).

```ts
themeToVars(theme: Partial<GridTheme>): Record<string, string>
```

### `toGridCell`

TanStack `Cell` → GridCellContext. Use inside onCellClick / onCellKeyDown / getCellTooltip
to read cell data without TanStack knowledge — e.g. `const c = toGridCell(cell)` then read
`c.value` / `c.rowId` / `c.row`.

```ts
toGridCell(cell: CellLike<TData>): GridCellContext<TData>
```

### `toGridFilterColumn`

TanStack filter `Column` → GridFilterColumn (value + setValue, no method spelunking).

```ts
toGridFilterColumn(column: FilterColumnLike): GridFilterColumn
```

### `transferRow`

@topgrid/grid-core — transferRow ( / ).

Move one row (by id) from a source array to the end of a target array — the
pure spine of drag-between-grids. The dragged row's identity is owned by the
consumer (lifted above both grids); this helper just applies the move (no
dataTransfer, no React) so it is node-testable and the DnD wiring stays thin.

No-op (rowId not found in `source`) returns the SAME `source`/`target`
references (callers may detect via `===`); originals are never mutated.

```ts
transferRow(source: readonly T[], target: readonly T[], rowId: string, getId: (…) => …): { … }
```

## Types & Interfaces

### `AutoGroupColumnOptions`

Options for createAutoGroupColumn.

| Property | Type | Description |
|---|---|---|
| `getValue?` | `(…) => …` | Render the node's display value (default: nothing). |
| `header?` | `ReactNode` | Header content (default `'Group'`). |
| `indentUnit?` | `number` | Pixels of indent per depth level (default `16`). |
| `size?` | `number` | Column width (default `240`). |

### `BaseGridProps`

`BaseGridProps<TData>` — the shared props signature of the 5 legacy aliases.

Identical in signature to the AS-IS legacy grid types — newly
defined for alias compatibility within the package (0 external dependencies). This interface is used by `legacy/BaseGrid.tsx` +
`legacy/VirtualGrid.tsx` (extends).

| Property | Type | Description |
|---|---|---|
| `className?` | `string` |  |
| `columns` | `ColumnDef<TData, unknown>[]` |  |
| `data` | `TData[]` |  |
| `emptyText?` | `string` |  |
| `loading?` | `boolean` |  |
| `onRowClick?` | `(…) => …` |  |
| `onRowDoubleClick?` | `(…) => …` |  |
| `pagination?` | `GridPaginationOptions` |  |
| `rowSelection?` | `GridRowSelectionOptions<TData>` |  |

### `CellLike`

Minimal structural view of a TanStack `Cell` (it satisfies this — we read only these).

| Property | Type | Description |
|---|---|---|
| `column` | `{ … }` |  |
| `getValue` | `(…) => …` |  |
| `row` | `{ … }` |  |

### `ColumnInfo`

DataTable-compatible ColumnInfo interface.

Same shape as the legacy DataTable `data-table-types.ts`.
New code should prefer `TopgridColumnDef<TData>`.

`createColumns` narrows `ColumnInfo[]` input to `TopgridColumnDef` internally:
- If the `type` field is one of the 9 `TopgridColumnType` union members, it is used as-is
- Any other string falls back to `'text'`

| Property | Type | Description |
|---|---|---|
| `align` | `string` | Alignment direction (string — 'left'\|'center'\|'right' recommended) |
| `etc?` | `string` | ColumnInfo compatibility: sets meta.primary based on whether 'primary' is included. See reference. |
| `id` | `string` | column accessor key |
| `name` | `string` | Display header name |
| `type` | `string` | Column type (string — not a union). Narrowed to the `TopgridColumnType` union inside `createColumns`. Values outside the 9 fall back to 'text'. |
| `visibility?` | `boolean` | If false, the column is hidden. Default true. |
| `width` | `string` | Width string in pixels ('100', '200', etc.) |

### `ColumnMenuProps`

| Property | Type | Description |
|---|---|---|
| `column` | `Column<TData, unknown>` | The TanStack `Column` this menu acts on. |
| `label?` | `string` | Trigger glyph/label. |

### `ColumnPersistenceOptions`

Column visibility + order localStorage persistence options.

Passed to the `<Grid columnPersistence={...} />` prop.

| Property | Type | Description |
|---|---|---|
| `persist?` | `PersistTarget[]` | State targets to persist (default `['visibility', 'order']`). - `'visibility'`: column show/hide (`VisibilityState`). - `'order'`: column order (`ColumnOrderState`). |
| `storageKey` | `string` | localStorage key. When an empty string (`''`), no localStorage access (no-op, NFR-006). A value unique within the app is recommended (e.g. `'hr-grid-v1'`). |
| `version?` | `number` | Storage format version (default `1`). Raise the value when the column structure changes to invalidate previously stored entries. On mismatch, the existing entry is removed + state restoration is skipped. |

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

### `ColumnVisibilityMenuProps`

`<ColumnVisibilityMenu>` props.

| Property | Type | Description |
|---|---|---|
| `className?` | `string` | Additional className for the root &lt;details>. |
| `menuLabel?` | `string` | Menu top label. |
| `table` | `Table<TData>` | The Table instance returned by `useReactTable`. Uses `getAllLeafColumns` + `column.getCanHide` + `column.toggleVisibility`. |
| `triggerLabel?` | `string` | Trigger button text. |

### `DragThProps`

Drag props to pass to a header `<th>` DOM element.

HTML5 DragEvent handlers (: no external library used).
Grid.tsx receives a React.DragEvent&lt;HTMLTableCellElement>,
extracts the DOM DragEvent via `.nativeEvent`, and passes it to these handlers.

| Property | Type | Description |
|---|---|---|
| `draggable` | `boolean` | pinned=true → false, enabled=true → true (/). |
| `onDragEnd` | `(…) => …` |  |
| `onDragLeave` | `(…) => …` |  |
| `onDragOver` | `(…) => …` |  |
| `onDragStart` | `(…) => …` |  |
| `onDrop` | `(…) => …` |  |

### `FilterColumnLike`

Minimal structural view of a TanStack `Column` (filter side).

| Property | Type | Description |
|---|---|---|
| `getFilterValue` | `(…) => …` |  |
| `id` | `string` |  |
| `setFilterValue` | `(…) => …` |  |

### `FullRowEditApi`

| Property | Type | Description |
|---|---|---|
| `cancelRow` | `(…) => …` | Cancel row — discard draft, 0 emits. |
| `commitRow` | `(…) => …` | Commit row — a single onRowEdit followed by exit, if validateRow passes. |
| `editingRowId` | `null \| string` | The id of the row currently being edited (null if none). |
| `getDraftValue` | `(…) => …` | Current value for rendering (draft first, else the original rowValue). |
| `isRowEditing` | `(…) => …` | Whether this row is being edited. |
| `setDraftCell` | `(…) => …` | Update a draft cell (field = row key). |
| `startRowEdit` | `(…) => …` | Start editing this row (initialize draft). |

### `GridCellContext`

Clean cell context — what a consumer actually needs in onCellClick/onCellKeyDown/getCellTooltip.

| Property | Type | Description |
|---|---|---|
| `columnId` | `string` | Column id. |
| `row` | `TData` | The original row object. |
| `rowId` | `string` | Stable row id (from getRowId, or the array index fallback). |
| `value` | `unknown` | The cell's value. |

### `GridFilterColumn`

Clean filter column — normalises TanStack `getFilterValue`/`setFilterValue` to value/setValue.

| Property | Type | Description |
|---|---|---|
| `id` | `string` |  |
| `setValue` | `(…) => …` |  |
| `value` | `unknown` |  |

### `GridHandle`

The imperative handle exposed via the `<Grid>` ref.

| Property | Type | Description |
|---|---|---|
| `addRow` | `(…) => …` | Add row — delegates to the `props.onAddRow(seed?)` callback. When no callback is provided, a one-time dev-mode `console.warn` + no-op. |
| `clearSelection` | `(…) => …` | Clear all selection — delegates to `table.setRowSelection({})`. Equivalent to AG `api.deselectAll`. |
| `deleteRow` | `(…) => …` | Delete row — delegates to the `props.onDeleteRow(rowId)` callback. `rowId` = TanStack `row.id` (default = row index string). |
| `getSelection` | `(…) => …` | Returns the currently selected row data array — delegates to `table.getSelectedRowModel.rows.map(r => r.original)`. Empty array = no selection. |
| `refresh` | `(…) => …` | Recompute internal state — delegates to `table.resetRowSelection`. |
| `scrollTo` | `(…) => …` | Scroll to the row at index. - When `enableVirtualization=true`, delegates to `virtualizer.scrollToIndex(index, options)` (`@tanstack/react-virtual` API). - When `enableVirtualization=false`, native DOM `tbody tr[data-index="N"].scrollIntoView({...})` fallback. - Negative / index exceeding `data.length` → clamped to `[0, data.length-1]` + dev `console.warn`. |
| `updateRow` | `(…) => …` | Partial row update — delegates to the `props.onUpdateRow(rowId, patch)` callback. |
| `collapseAll?` | `unknown` |  |
| `expandAll?` | `unknown` |  |
| `startEditing?` | `unknown` |  |

### `GridIcons`

Grid chrome icon glyphs (sort indicators).

| Property | Type | Description |
|---|---|---|
| `sortAscending` | `string` |  |
| `sortDescending` | `string` |  |
| `sortNone` | `string` |  |

### `GridLocale`

Localizable grid chrome strings. Parametrized entries are functions.

| Property | Type | Description |
|---|---|---|
| `emptyText` | `string` | Empty-state default text. |
| `firstPage` | `string` | Pagination nav button `aria-label`s — screen-reader heard ( audience). |
| `lastPage` | `string` |  |
| `nextPage` | `string` |  |
| `prevPage` | `string` |  |
| `rowsPerPage` | `string` | Pagination "rows per page" label. |
| `selectionMessage` | `(…) => …` | Screen-reader selection-change announcement. |
| `sortMessage` | `(…) => …` | Screen-reader sort-change announcement. |
| `totalCount` | `(…) => …` | Pagination total-count text (e.g. `전체 N건`). |

### `GridPaginationOptions`

Pagination options.

Takes effect only when `enablePagination=true`. When `manual=true`, server-side pagination (the consumer is responsible for controlling the external totalCount + pageIndex).

| Property | Type | Description |
|---|---|---|
| `autoPageSize?` | `boolean` | Auto-computes pageSize to fit the viewport (grid body) height. Default `false`. When active, the `pageSize`/`pageSizeOptions` select is ignored and hidden (to avoid conflict). |
| `enableGoToPage?` | `boolean` | Shows a numeric input UI to jump to a specific page. Default `false`. Jumps directly to a distant page that the sliding buttons cannot reach. |
| `enableKeyboardNav?` | `boolean` | Enables Alt+← / Alt+→ keyboard page navigation. Wired to the `enableKeyboardNav` prop of the `GridPagination` component. Default `false`. |
| `manual?` | `boolean` | Server-side pagination mode. When `true`, TanStack `manualPagination: true` + external `totalCount` required. |
| `mode?` | `PaginationMode` | Pagination behavior mode (convenience shorthand). - `'client'` → `manual: false` + `enablePagination` auto-enabled - `'server'` → `manual: true` + `enablePagination` auto-enabled - `'none'` → pagination disabled (enablePagination ignored) When `mode` and `manual` are both specified, `mode` takes precedence. |
| `onPaginationChange?` | `OnChangeFn<PaginationState>` | Controlled pageIndex change handler. |
| `pageCount?` | `number` | Total page count in server mode (`mode: 'server'` or `manual: true`). Computed automatically from `totalCount` and `pageSize`, but overridden if specified directly. |
| `pageIndex?` | `number` | Controlled pageIndex (controlled mode). |
| `pageNumberFormat?` | `(…) => …` | Formatter for page-number button labels (e.g. thousands separators `n => n.toLocaleString`). Raw integer when unspecified. The `aria-label` (accessibility) keeps the original integer. For total-count formatting, see `localeText.totalCount`. |
| `pageSize?` | `number` | Default pageSize (default `20`). |
| `pageSizeOptions?` | `number[]` | Rows-per-page select options (default `[10, 20, 50, 100]`). |
| `showTotalCount?` | `boolean` | Whether to show the total count. Default `true`. When set to `false`, the "total N items" UI is hidden. |
| `totalCount?` | `number` | Total row count in server mode (required when manual=true). |

### `GridPaginationProps`

`GridPagination<TData>` props.

| Property | Type | Description |
|---|---|---|
| `enableGoToPage?` | `boolean` | Shows a numeric input UI to jump to a specific page. Default `false`. |
| `enableKeyboardNav?` | `boolean` | Enables Alt+← / Alt+→ keyboard page navigation. Registers event listeners in the container ref scope. Default `false`. |
| `mode?` | `PaginationMode` | Pagination behavior mode (`'client' \| 'server' \| 'none'`). |
| `navLabels?` | `{ … }` | Navigation button aria-labels (i18n — ). Korean default when unspecified. |
| `onPaginationChange?` | `OnChangeFn<PaginationState>` | Page change callback. |
| `pageCount?` | `number` | Total page count in server mode. |
| `pageNumberFormat?` | `(…) => …` | Page-number label formatter. Passed through to PageNumbers. |
| `pageSizeOptions?` | `number[]` | List of rows-per-page options (default `[10, 20, 50, 100]`). |
| `rowsPerPageLabel?` | `string` | "Rows per page:" label (i18n — ). |
| `showTotalCount?` | `boolean` | Whether to show the total count. Default `true`. When set to `false`, the "total N items" UI is hidden. |
| `table` | `Table<TData>` | TanStack `Table` instance — access to pagination state + API. |
| `totalCount?` | `number` | Total row count in server mode. |
| `totalCountFormat?` | `(…) => …` | Total-count text formatter (i18n — ). |

### `GridProps`

`<Grid>` component props.

| Property | Type | Description |
|---|---|---|
| `alwaysMultiSort?` | `boolean` | Accumulate multi-sort even on a plain click. Use together with `enableMultiSort`. By default Shift+click is the multi-sort key, but when `true` you accumulate by clicking columns in sequence **without Shift**. (TanStack `isMultiSortEvent: => true` passthrough.) |
| `autoSelectFirstRow?` | `boolean` | Auto-select the first row after data load (default `false`). |
| `cellClassName?` | `CellClassNameCallback<TData>` | Per-cell className generation callback. Called on every cell render. The returned string is appended to the default className of `<td>`. **canonical**: this callback type is owned by grid-core. grid-renderers is a type-only re-export. **Usage example** (equivalent to publish/organizeSchedule): ```tsx cellClassName={(cell) => {  if (!cell.column.id.startsWith('d')) return '';  const isSelected = cell.row.getIsSelected;  const hasValue = cell.getValue != null && cell.getValue !== '';  return [  isSelected && 'bg-indigo-100',  !isSelected && hasValue && 'bg-yellow-50',  ].filter(Boolean).join(' '); }} ``` **Performance note**: called on every cell render — beware the callback's internal computation cost with large datasets (useMemo or a stable callback recommended). |
| `className?` | `string` | Outer wrapper className (Tailwind). |
| `columnOrderStorageKey?` | `string` | localStorage key to use when `persistColumnOrder=true`. When an empty string (`''`) is passed, no localStorage access. When unspecified, save is skipped even if `persistColumnOrder=true`. |
| `columnPersistence?` | `ColumnPersistenceOptions` | Column visibility + order localStorage persistence options. - When provided, the `<ColumnVisibilityMenu>` UI is auto-rendered + `useColumnPersistence` activated. - When omitted (`undefined`), persistence is disabled + the menu is not shown ( backward compat). - When `storageKey: ''`, no localStorage access (NFR-006). |
| `columnResizeMode?` | `GridColumnResizeMode` | Column resize mode (default `'onChange'`). Takes effect only when `enableColumnResizing=true`. |
| `columns` | `ColumnDef<TData, unknown>[]` | Column definitions (TanStack `ColumnDef`). |
| `data` | `TData[]` | Row data array. |
| `debug?` | `boolean` | Exposes the TanStack `debugTable` option (default `false`). |
| `defaultColumnPinning?` | `ColumnPinningState` | Uncontrolled initial value for column pinning (`{ left: string[]; right: string[] }`). The entry point for mapping the ColumnPinGrid `pinLeft` / `pinRight` aliases. |
| `defaultColumnSizing?` | `ColumnSizingState` | Uncontrolled initial value for column width (column id → px). Used as the initial value of the internal `columnSizing` state on mount (uncontrolled pattern). |
| `defaultExpanded?` | `false \| ExpandedState` | Initial value of expanded state when `enableExpanding=true` (uncontrolled). - `true` = fully expanded - `Record<string, boolean>` = expand only specific row ids - unspecified = `{}` (fully collapsed)  — the entry point compatible with the TreeGrid alias `expandAll={true}`. Preserves the AS-IS TreeGrid.tsx:35 `useState<ExpandedState>(initialExpandAll ? true : {})` initial-seed pattern. |
| `emptyState?` | `ReactNode` | Empty-result state ReactNode slot. When provided, rendered in preference to `emptyText` ( — slot → text → defaultText order). |
| `emptyText?` | `string` | Empty-result guidance text (default `'데이터가 없습니다.'`). |
| `enableCellChangeFlash?` | `boolean` | Briefly highlights a cell on value change (change-flash). When `data` changes, applies a ~0.9s background highlight to **cells whose value actually changed** (diffed by row identity — reordering is not highlighted). For stable highlighting, specifying `getRowId` together is recommended (when unspecified, the diff is index-based → reordering is also highlighted). |
| `enableColumnPinning?` | `boolean` | Activates column pinning state (default `false`). This activates only the `state.columnPinning` state. The sticky CSS appearance is out of scope. |
| `enableColumnReorder?` | `boolean` | Activates column drag reorder (default `false`). Built on the HTML5 Drag and Drop API — no external dnd library.  :. |
| `enableColumnResizing?` | `boolean` | Activates column resizing state (default `false`). The resize handle UI is out of scope. |
| `enableColumnVirtualization?` | `boolean` | Activates column (horizontal) virtualization. When `true`, off-screen **center** columns are not rendered and left/right padding cells preserve only the horizontal scroll width — cutting the render cost of 100+ columns. **Pinned columns are not virtualized and are always rendered regardless of horizontal scroll.** unspecified/`false` → all columns rendered (byte-identical to prior behavior). **v1 constraint**: **flat (single-row) headers only** — with grouped/multi-tier headers (`getHeaderGroups.length > 1`) it auto-disables (all columns rendered) due to colSpan accounting complexity. Grouped-header virtualization is v2. **Layout**: when `true`, the `<table>` is fixed to `table-layout: fixed` + the total column width (Σ`getSize`), so columns keep their explicit widths exactly (aligned with the pad px). As a side effect, **cell content that exceeds the column width is clipped** — normal behavior for a virtualized grid. The horizontal scroll container is provided by the existing `overflow-x-auto` (or the row-virtualization `overflow:auto`), so consumers not using Tailwind must set `overflow-x` on the container directly. **⚠️ Experimental**: body+header virtualization wiring + chromium alignment matrix complete (Commit C). off = byte-identical to prior; on SSR/unmeasured, all columns rendered (safe fallback). |
| `enableExpanding?` | `boolean` | Activates row expanding state (default `false`) — TreeGrid absorbed. Use together with `getSubRows`. |
| `enableFilter?` | `boolean` | Activates column filtering (default `false`) — `getFilteredRowModel` wiring. |
| `enableMultiSort?` | `boolean` | Activates multi-sort (default `false`) — delegates to TanStack `enableMultiSort`. |
| `enablePagination?` | `boolean` | Activates pagination (default `false`) — `getPaginationRowModel` wiring. |
| `enableRowClickSelection?` | `boolean` | Select by clicking the row body. Works only when `rowSelection` is `'single'`/`'multi'`. - plain click → selects only that row (others deselected). ctrl/cmd+click → toggle (accumulate multiple). (shift range = ) - **coexists independently** with the existing `onRowClick` callback — `onRowClick` is still called while selecting. - Clicks on the checkbox cell (`__select__`) do not take this path due to `stopPropagation` (existing behavior preserved). |
| `enableRowPinning?` | `boolean` | Row pinning. The user pins data rows to the top/bottom (`row.pin('top'\|'bottom')`). Pinned rows stay fixed via sticky during scroll and are excluded from the center rows. **Non-virtualized only** (virtualization+pinning=vN). Place the `RowPinButton` component in a cell for the UI control. |
| `enableRowReorder?` | `boolean` | Activates row drag reorder (default `false`). Makes data rows draggable and calls `onRowReorder(from, to)` on drop (the consumer applies it to its own data via `moveRow(data, from, to)`). **Auto-disabled when sort/filter is active** (display order ≠ data order makes reordering ambiguous) + **non-virtualized only** (virtualization synthesis = vN). HTML5 drag. |
| `enableSort?` | `boolean` | Activates sorting (default `false`) — `getSortedRowModel` wiring. |
| `enableVirtualization?` | `boolean` | Activates virtualization (default `false`) — opt-in only. When `true`, `useGridVirtualizer` wiring + the tbody padding-row pattern are applied. When `false`, ~ markup as-is ( sticky/pinning preserved). |
| `floatingBottomRows?` | `TData[]` | Consumer-supplied row data to pin at the **bottom** of the grid. Same convention as `floatingTopRows` (bottom sticky). |
| `floatingTopRows?` | `TData[]` | Consumer-supplied row data to pin at the **top** of the grid. Isomorphic to XX Grid's `pinnedTopRowData` — extra rows *outside* the data model (totals/summaries, etc.). They pass through the column cell renderers (`columnDef.cell`) and are shown identically to body rows, staying fixed via `position: sticky` even as the body scrolls. **No aggregation computed**: the consumer supplies the total object directly (automatic aggregation is `@topgrid/grid-pro-agg`/Pro). **Not an interactive pin**: separate from the feature where a user pins existing rows (`@topgrid/grid-pro-master`/Pro). unspecified/empty array → no render (existing behavior unchanged). |
| `getCellTooltip?` | `(…) => …` | Cell tooltip. Called per cell and its returned string is applied as `<td title>` (native hover tooltip) — showing clipped content, extra descriptions, etc. When `undefined`/`null`/`''` is returned, no title is applied to that cell. grid-core 1.0 : `(cell, row)` → `(ctx)` (clean GridCellContext). |
| `getRowId?` | `(…) => …` | Stable row identifier. When unspecified, the row key = array index. When provided, all row-key states such as `rowSelection`·`expanded` are keyed by **this id rather than the index**, so the **same logical row is tracked** across data reorder/replacement (selection follows identity, not position). It is the foundation by which cell change flash identifies "the same row". |
| `getSubRows?` | `(…) => …` | TanStack `getSubRows` — used when `enableExpanding=true`. |
| `icons?` | `Partial<GridIcons>` | Sort-indicator icon glyph override (partial). Unspecified falls back to the default (`▲▼⇅`). |
| `loading?` | `boolean` | Loading state. When `true`, only the `<tbody>` area is replaced with skeleton rows (thead preserved — ). |
| `loadingOverlay?` | `boolean` | Loading overlay (default `false`). Unlike `loading` (skeleton replacement), it **leaves the existing data rows in place** and covers them with a translucent overlay (indicating a refresh in progress while keeping existing data). `aria-busy` + pointer-events blocked (blocks interaction underneath). Independent and additive to `loading` (skeleton) — both leave existing behavior unchanged. |
| `loadingRowCount?` | `number` | Number of skeleton rows to show while loading. When unspecified, falls back to `pagination.pageSize ?? 5` ( — compatible with the BaseGrid L123 hardcoded `5`). |
| `localeText?` | `Partial<GridLocale>` | Localizes grid chrome strings — partial override. Unspecified keys fall back to the Korean default (never emits raw key/undefined). English example: `{ emptyText: 'No data', rowsPerPage: 'Rows per page:', totalCount: (n) => `$&#123;n} rows` }`. You can also import `defaultGridLocale` and spread over it. |
| `manualFiltering?` | `boolean` | Server filtering: when `true`, disables client filtering (`getFilteredRowModel` skip + `manualFiltering`). Default `false`. |
| `manualSorting?` | `boolean` | Server sorting: when `true`, disables client sorting (`getSortedRowModel` skip + `manualSorting`). The sort *UI/state* is retained (header click → `onSortingChange`) but the actual sorting is delegated to the server. Default `false`. |
| `maxMultiSortColCount?` | `number` | Maximum number of columns that can be sorted simultaneously. Passed directly to TanStack `maxMultiSortColCount`. Unlimited when unset. Ignored when `enableMultiSort=false`. |
| `onAddRow?` | `(…) => …` | Add-row callback — invoked when `ref.current.addRow(seed?)` is called. Controlled-data policy: the parent is responsible for appending the new row to the `props.data` array. |
| `onCellClick?` | `(…) => …` | Cell click handler — exposes the intent to branch at the column level. grid-core 1.0 : `(cell, row, event)` → `(ctx, event)`. `ctx` is a clean GridCellContext — `ctx.columnId`·`ctx.value`·`ctx.rowId`·`ctx.row`(= old `row.original`). |
| `onCellKeyDown?` | `(…) => …` | Cell keyboard event handler — wired via `<td onKeyDown>`. grid-core 1.0 : `(cell, row, event)` → `(ctx, event)` (clean GridCellContext). |
| `onColumnFiltersChange?` | `OnChangeFn<ColumnFiltersState>` | ColumnFilters state change callback (for deriving server filter parameters; also updates internal state). |
| `onColumnOrderChange?` | `(…) => …` | Callback invoked after column order change completes. The parent can sync external state.  : F-07-06 absorbed. |
| `onColumnPinningChange?` | `OnChangeFn<ColumnPinningState>` | ColumnPinning state change callback (for external persistence or a controlled mirror). |
| `onColumnSizingChange?` | `OnChangeFn<ColumnSizingState>` | ColumnSizing state change callback (for external persistence or a controlled mirror). |
| `onDeleteRow?` | `(…) => …` | Delete-row callback — invoked when `ref.current.deleteRow(rowId)` is called. `rowId` = TanStack `row.id` (default = row index string). |
| `onRowClick?` | `(…) => …` | Row click handler. |
| `onRowDoubleClick?` | `(…) => …` | Row double-click handler — same signature policy as `onRowClick`. |
| `onRowDragStart?` | `(…) => …` | Drag-between-grids — drag source (default none = disabled). When provided, data rows become draggable and `onRowDragStart(rowId)` is called on dragstart (`rowId` = TanStack `row.id`). The consumer **lifts the dragged row id into state above both grids** and holds it (consumer-owns-payload, no dataTransfer). Paired with the target grid's `onRowDrop`. A **separate opt-in** from enableRowReorder (mixing within the same grid is forbidden = vN). When OFF, byte-identical. |
| `onRowDrop?` | `(…) => …` | Drag-between-grids — drop target (default none = disabled). When provided, the grid body area becomes a drop target and `onRowDrop` is called (on drop). The consumer reads its own `dragged` id and applies source→target data via the pure `transferRow`. When OFF, byte-identical. |
| `onRowReorder?` | `(…) => …` | Row-reorder drop callback — display index `from`→`to`. The consumer applies the data via `moveRow`. |
| `onSortingChange?` | `OnChangeFn<SortingState>` | Sorting state change callback (for deriving server sort parameters; also updates internal state). |
| `onStartEditing?` | `(…) => …` | Programmatic edit-start callback — invoked when `ref.current.startEditing(rowId, colId)` is called. Same policy as the callback-delegating pattern of : the Grid does not own the editing state, and the application is responsible for updating the EditableCell `isEditing`. |
| `onUpdateRow?` | `(…) => …` | Partial row update callback — invoked when `ref.current.updateRow(rowId, patch)` is called. |
| `pagination?` | `GridPaginationOptions` | Pagination detail options (effective when `enablePagination=true`). |
| `persistColumnOrder?` | `boolean` | Activates column-order localStorage persistence. When `true` + `columnOrderStorageKey` is specified, saves to localStorage after drag/keyboard completes. Restores the saved order on mount (`table.setColumnOrder`). |
| `renderFloatingFilter?` | `(…) => …` | Floating filter row render callback. When specified, draws an always-visible filter input row below the leaf header row (prop present = active, mirroring the `cellClassName` convention). Called once per column — usually returns a floating input component from grid-features (`column.setValue` shares the same state as the popover). grid-core provides only the structural row + column window (virtualization) · pin sticky · ARIA consistency (no grid-features dependency = MIT). null return = empty cell. grid-core 1.0 : `Column<TData,unknown>` → clean GridFilterColumn (`id`·`value`·`setValue` — no TanStack types). |
| `rowClassName?` | `RowClassNameCallback<TData>` | Per-row className generation callback. Called on every row render. The returned string is appended to the default className of `<tr>`. **virtualization note**: when `enableVirtualization=true`, `<tr ref={measureElement}>` measures the row height — if `rowClassName` causes a dynamic height change, measureElement reflows repeatedly (performance degradation). A static className is recommended. |
| `rowSelection?` | `RowSelectionMode \| GridRowSelectionOptions<TData>` | Row selection options. Supports both the shorthand notation (`'multi'`) and the object notation. With 'single'/'multi', a checkbox column (`__select__`) is auto-prepended as the leftmost column. |
| `showSortClearButton?` | `boolean` | Whether to show the sort-reset button. When `true` and `enableMultiSort=true`, renders `<SortClearButton>` in the toolbar. When unset (default), no DOM structure change. |
| `sortDescFirst?` | `boolean` | Make the first-click sort direction descending. (TanStack `sortDescFirst` passthrough — when unspecified, per-type default: number = desc-first, string = asc-first.) |
| `theme?` | `Partial<GridTheme>` | Grid chrome color theme (partial override). Only the provided colors are applied to the root as inline `--topgrid-*` vars, and each surface reads them via `var(--topgrid-x, <default hex>)`. Unspecified keys fall back to the default color. For presets such as dark, `import { darkTheme }` then spread. ⚠ CSS vars are inert under forced-colors (high contrast) (an HC-safe selection indicator is a separate mechanism). |
| `virtualizerOptions?` | `{ … }` | `useVirtualizer` option override. - `estimateSize`: estimated row height px (default `36`, based on BaseGrid `<td className="px-4 py-3">`). - `overscan`: buffer rows above/below the viewport (default `10`, same as VirtualGrid.tsx:102). - `onChange`: virtualizer change callback (observes the visible range — the block-fetch trigger of SSRM).  Passed through as-is to `useVirtualizer`. Generic passthrough (0 SSRM-specific logic). |
| `virtualScrollHeight?` | `number` | Scroll container height when virtualizing (px, default `400`). Takes effect only when `enableVirtualization=true`. |

### `GridRowSelectionOptions`

Row selection options (object form).

Supports both the `<Grid rowSelection="multi" />` shorthand and the `<Grid rowSelection={{ mode, onSelectionChange }} />` object notation.

| Property | Type | Description |
|---|---|---|
| `mode?` | `RowSelectionMode` | Selection mode (default `'none'`). |
| `onSelectionChange?` | `(…) => …` | Selection change callback. Argument: the `row.original` array of currently selected rows (based on page/filter). |
| `onStateChange?` | `OnChangeFn<RowSelectionState>` | Controlled state change handler (required in controlled mode). |
| `selectAllPages?` | `boolean` | : the `'multi'` header select-all checkbox selects/deselects rows across **all pages** (default `false` = current page only). When `true`, the header checkbox uses TanStack `getToggleAllRowsSelectedHandler` (all pages) + `getIsAllRowsSelected`/`getIsSomeRowsSelected`. Corresponds to XX Grid's "select all across all pages". |
| `state?` | `RowSelectionState` | Controlled — used to control RowSelectionState directly from outside. Uses internal state when unspecified (uncontrolled). |

### `GridState`

The return type of `useGridState<TData>` — 8 TanStack states + 8 setters.

A unified return type that absorbs the `useState<StateType>` pattern that was
declared redundantly across the 8 grid variants (BaseGrid/VirtualGrid/...) into one.

`TData` is currently unused ( to be leveraged when controlled mode is extended).

| Property | Type | Description |
|---|---|---|
| `columnFilters` | `ColumnFiltersState` | Column filter state (TanStack `ColumnFiltersState`). Default `[]`. |
| `columnOrder` | `ColumnOrderState` | Column order state (TanStack `ColumnOrderState`). Default `[]`. |
| `columnPinning` | `ColumnPinningState` | Column pinning state (TanStack `ColumnPinningState`). Default `{}`. |
| `columnSizing` | `ColumnSizingState` | Column width state (TanStack `ColumnSizingState`). Default `{}`. |
| `columnVisibility` | `VisibilityState` | Column visibility state (TanStack `VisibilityState`). Default `{}`. |
| `pagination` | `PaginationState` | Pagination state (TanStack `PaginationState`). Default `{ pageIndex: 0, pageSize: 10 }`. |
| `resetSection` | `(…) => …` | Restore a specific state key(s) to `initialState`. |
| `resetState` | `(…) => …` | Restore all states to `initialState`. - uncontrolled mode: to the provided key value when `initialState` is provided, otherwise to each key's default  (`sorting: []`, `columnFilters: []`, `rowSelection: {}`,  `pagination: { pageIndex: 0, pageSize: 10 }`,  `columnPinning: {}`, `columnOrder: []`, `columnSizing: {}`, `columnVisibility: {}`) - controlled-mode keys: the setter only calls `onChange` → the external handler is responsible for updating the controlled state  (`useControllableState` — the `isControlled` branch does not call the internal setInternalValue) `initialState` is captured once on mount (`useRef`) — later prop changes are ignored. |
| `rowSelection` | `RowSelectionState` | Row selection state (TanStack `RowSelectionState`). Default `{}`. |
| `setColumnFilters` | `OnChangeFn<ColumnFiltersState>` | Column filter setter. |
| `setColumnOrder` | `OnChangeFn<ColumnOrderState>` | Column order setter. |
| `setColumnPinning` | `OnChangeFn<ColumnPinningState>` | Column pinning setter. |
| `setColumnSizing` | `OnChangeFn<ColumnSizingState>` | Column width setter. |
| `setColumnVisibility` | `OnChangeFn<VisibilityState>` | Column visibility setter. |
| `setPagination` | `OnChangeFn<PaginationState>` | Pagination setter. |
| `setRowSelection` | `OnChangeFn<RowSelectionState>` | Row selection setter. |
| `setSorting` | `OnChangeFn<SortingState>` | Sort setter — TanStack `OnChangeFn<SortingState>` (T or an updater function). |
| `sorting` | `SortingState` | Sort state (TanStack `SortingState`). Default `[]`. |

### `GridStateValues`

The 8 standard grid state values.

| Property | Type | Description |
|---|---|---|
| `columnFilters` | `ColumnFiltersState` |  |
| `columnOrder` | `ColumnOrderState` |  |
| `columnPinning` | `ColumnPinningState` |  |
| `columnSizing` | `ColumnSizingState` |  |
| `columnVisibility` | `VisibilityState` |  |
| `pagination` | `PaginationState` |  |
| `rowSelection` | `RowSelectionState` |  |
| `sorting` | `SortingState` |  |

### `GridTheme`

Themeable grid chrome colors. All optional via `Partial<GridTheme>` on the `theme` prop.

Only STATIC surfaces are themeable this way — a surface whose color lives in a `:hover` or
`:focus-visible` pseudo-state (selection bg, focus outline) can't be set by an inline style and
is intentionally absent (it would need shipped CSS). Those are handled by the selection sub-step.

| Property | Type | Description |
|---|---|---|
| `bodyBg` | `string` | Body background. Default `#ffffff` (white). |
| `border` | `string` | Container border. Default `#e5e7eb` (gray-200). |
| `cellText` | `string` | Body cell text. Default `#374151` (gray-700). |
| `headerBg` | `string` | Header (thead / group-header) background. Default `#f9fafb` (gray-50). |
| `headerText` | `string` | Header label text. Default `#6b7280` (gray-500). |

### `GroupedHeaderGridProps`

`GroupedHeaderGridProps<TData>` — AS-IS shape preserved (GroupedHeaderGrid.tsx L13-24).

`columns` are passed through as the TanStack standard group structure (`{ header, columns: [...leaf] }`) as-is —
buildTableOptions passes group ColumnDefs through unmodified (TanStack internal placeholder mechanism).

| Property | Type | Description |
|---|---|---|
| `className?` | `string` |  |
| `columns` | `ColumnDef<TData>[]` |  |
| `data` | `TData[]` |  |
| `emptyText?` | `string` |  |
| `loading?` | `boolean` |  |
| `onRowClick?` | `(…) => …` |  |
| `pagination?` | `GridPaginationOptions` |  |
| `rowSelection?` | `GridRowSelectionOptions<TData>` |  |

### `PageSizeSelectProps`

`PageSizeSelect` props.

| Property | Type | Description |
|---|---|---|
| `label?` | `string` | "Rows per page:" label (i18n — ). Korean default when unspecified. |
| `onPageSizeChange` | `(…) => …` | pageSize change callback. |
| `pageSize` | `number` | Current pageSize. |
| `pageSizeOptions` | `number[]` | List of selectable pageSize options. |

### `RowPinButtonProps`

@topgrid/grid-core — RowPinButton (per-row pin control) —.

Place in a column cell (`cell: ({ row }) => <RowPinButton row={row} />`) to let users pin a data
row to the top/bottom (sticky) or unpin it. Requires `<Grid enableRowPinning />`. Inline styles
(Tailwind is inert in the headless storybook — P27-1). ★ Every click `stopPropagation`s so pinning
does not also trigger row-click selection / onRowClick.

| Property | Type | Description |
|---|---|---|
| `row` | `Row<TData>` |  |

### `RowTransaction`

A delta over a row array: remove by id, update by id (matched rows replaced), add (appended).

| Property | Type | Description |
|---|---|---|
| `add?` | `readonly TData[]` |  |
| `remove?` | `readonly RowId[]` |  |
| `update?` | `readonly TData[]` |  |

### `SortBadgeProps`

`SortBadge` component props ( canonical — single source in grid-core).

| Property | Type | Description |
|---|---|---|
| `className?` | `string` | Tailwind className override. |
| `sortIndex` | `number` | The value returned by TanStack `column.getSortIndex`. -1 = unsorted → badge not shown. 0-based integer → displayed number = sortIndex + 1. |

### `SortClearButtonProps`

`SortClearButton` component props.

| Property | Type | Description |
|---|---|---|
| `className?` | `string` | Tailwind className override. |
| `label?` | `string` | Button label (default: '정렬 초기화'). |
| `onClear` | `(…) => …` | Called on click — wire table.setSorting([]). |

### `TopgridColumnGroup`

Group-header column definition.

| Property | Type | Description |
|---|---|---|
| `columns` | `ColumnDef<TData>[]` | Array of leaf columns or nested group columns within the group |
| `header` | `string` | Group header label |

### `TotalCountProps`

`TotalCount` props.

| Property | Type | Description |
|---|---|---|
| `format?` | `(…) => …` | Total-count text formatter (i18n — ). Korean default when unspecified ("total N items", with N emphasized). |
| `total` | `number` | Total row count. |

### `TransactionBatcher`

A batcher that coalesces many transactions into a single deferred apply.

| Property | Type | Description |
|---|---|---|
| `enqueue` | `(…) => …` | Queue a transaction; the first queued since the last flush arms one `schedule(flush)`. |
| `flush` | `(…) => …` | Apply all queued transactions to the current data in order, committing once. |
| `pending` | `(…) => …` | Queued (not-yet-flushed) transaction count — for tests/introspection. |

### `TransactionBatcherDeps`

Dependencies a createTransactionBatcher needs (all injected → node-deterministic).

| Property | Type | Description |
|---|---|---|
| `getData` | `(…) => …` | Read the current row array (consumer-owned state). |
| `getRowId` | `GetRowId<TData>` |  |
| `schedule` | `(…) => …` | Schedule `flush` to run later ( host-capability injection). Production passes `queueMicrotask`/`requestAnimationFrame`; node tests pass a manual collector for determinism. |
| `setData` | `(…) => …` | Commit the new row array (consumer-owned setState). Called ONCE per flush. |

### `TreeGridProps`

`TreeGridProps<TData>` — AS-IS shape preserved (TreeGrid.tsx L12-22).

| Property | Type | Description |
|---|---|---|
| `className?` | `string` |  |
| `columns` | `ColumnDef<TData>[]` |  |
| `data` | `TData[]` |  |
| `emptyText?` | `string` |  |
| `expandAll?` | `boolean` | When `true`, expand the entire tree on mount ( maps to `defaultExpanded={true}`). |
| `getSubRows?` | `(…) => …` | Child-row extraction function (signature-compatible with TanStack `getSubRows`). |
| `loading?` | `boolean` |  |
| `onRowClick?` | `(…) => …` |  |

### `TreeNode`

Tree node. `data=null` = a synthetic group that exists only as a path prefix.

| Property | Type | Description |
|---|---|---|
| `children` | `TreeNode<TData>[]` | Child nodes (in first-seen order). |
| `data` | `null \| TData` | Explicit row data, or `null` if a synthetic parent. |
| `key` | `string` | Stable key (NUL-join, collision-safe). |
| `path` | `string[]` | The path segments up to this node. |

### `UseColumnDragProps`

`useColumnDrag` hook props.

| Property | Type | Description |
|---|---|---|
| `columnOrderStorageKey?` | `string` | localStorage key. Required when persistColumnOrder=true (empty string → save skipped). |
| `enabled` | `boolean` | Whether drag reorder is active (passed from the `enableColumnReorder` prop). |
| `onColumnOrderChange?` | `(…) => …` | Callback invoked after column order change completes. |
| `persistColumnOrder?` | `boolean` | Whether localStorage persistence is active. |
| `table` | `Table<TData>` | TanStack Table v8 instance (the return value of `useReactTable`). |

### `UseColumnDragReturn`

The return value of the `useColumnDrag` hook.

| Property | Type | Description |
|---|---|---|
| `dragOverId` | `null \| string` | The column ID to currently show the drop indicator on. `null` = drag disabled or not currently dragging. |
| `getDragProps` | `(…) => …` | Returns the drag event props to spread onto the header `<th>`. |
| `getKeyDownHandler` | `(…) => …` | Returns the handler function to wire to the header `<th>` onKeyDown. Alt+← / Alt+→ key events move the column left/right. |

### `UseColumnOrderPersistProps`

| Property | Type | Description |
|---|---|---|
| `enabled` | `boolean` | Whether localStorage persistence is active (persistColumnOrder prop) |
| `storageKey` | `string` | localStorage key (columnOrderStorageKey prop) |
| `table` | `Table<TData>` | TanStack Table v8 instance |

### `UseFullRowEditOptions`

| Property | Type | Description |
|---|---|---|
| `getRowId` | `(…) => …` | Stable row identifier. |
| `onRowEdit` | `(…) => …` | Row commit callback — a single delta (the merged new row). The consumer applies it to the data. |
| `validateRow?` | `(…) => …` | Optional: validation before commit. Returning false blocks the commit (editing retained). E.g. derived from the edit-plus buildValidator. |

### `UseGridStateOptions`

The parameter type of `useGridState<TData>(options?)`.

| Property | Type | Description |
|---|---|---|
| `clearSelectionKey?` | `string \| number` | Option to auto-reset `rowSelection` via an external trigger. Absorbs the XxgridTable `clearSelectionKey` pattern (R-A: XxgridTable.tsx L88-92). Auto-resets to `rowSelection: {}` whenever this value changes. An `undefined` initial value does not trigger on mount ( isFirstClearRender ref flag). |
| `debounceMs?` | `number` | `onStateChange` debounce wait time (ms). - unset or `0`: synchronous call (identical behavior, no breaking). - `> 0`: fires once after `debounceMs` ms have elapsed since the last change.  N consecutive changes within 300ms → only the last snapshot delivered. - negative: treated the same as `0` (synchronous). |
| `initialState?` | `Partial<GridStateValues<TData>>` | Uncontrolled-mode initial value. When provided, used as the useState initial value of that key. When used together with controlled mode (`state` provided), initialState is ignored (controlled takes precedence). |
| `onStateChange?` | `(…) => …` | State-change notification callback. Called in both controlled and uncontrolled modes. Debounced call when `debounceMs > 0` (only the last change fires). Synchronous call when `debounceMs` is unset or 0 ( behavior preserved). |
| `state?` | `Partial<GridStateValues<TData>>` | Controlled-mode external state. Partial&lt;GridStateValues> allows per-key control. If `state.sorting` is present, sorting is controlled, the rest uncontrolled. |

### `UseStoragePersistOptions`

`useStoragePersist` hook options.

GridStateValues ↔ localStorage / sessionStorage sync options.
- `storageKey` required, the rest all optional.
- The `onHydrate` callback may be non-stable ( option 2 — preserved via useRef).

| Property | Type | Description |
|---|---|---|
| `debounceMs?` | `number` | Save debounce delay ms (default: `300`). `0` or less = immediate save (no debounce). |
| `onHydrate?` | `(…) => …` | Callback for storage → state hydration on mount. Called only on parse success + version match. May be non-stable (the latest value is preserved internally via `useRef` — option 2). |
| `storage?` | `"local" \| "session"` | The Storage type to use (default: `'local'`). - `'local'` → `localStorage` - `'session'` → `sessionStorage` |
| `storageKey` | `string` | Required: the localStorage / sessionStorage save key. A value unique within the app is recommended (e.g. `'my-grid-v1'`). |
| `version?` | `number` | Storage format version (default: `1`). On mismatch, existing stored data is ignored + removeItem. Raise the value when the storage schema changes (e.g. column structure change). |

### `UseUrlSyncOptions`

`useUrlSync<TData>` options.

All properties optional — each default applies when unspecified.

| Property | Type | Description |
|---|---|---|
| `debounceMs?` | `number` | URL update debounce ms (default 0 = immediate). When greater than 0, wrapped with `useDebouncedCallback` ( reuse). |
| `keys?` | `GridStateKey[]` | List of GridStateKeys to sync (all 8 when unspecified). |
| `onHydrate?` | `(…) => …` | Callback for reverse hydration from URL search params → state on mount. The hook returns void — the caller is responsible for updating state via setters. Non-stable callback safe: the latest value is preserved internally via `useRef` ( option 2). |
| `prefix?` | `string` | URL param namespace prefix (default `''` = no prefix). Prevents collisions when multiple grids coexist. When a prefix is specified, params are generated in the form `${prefix}_${key}`. |

### `UseViewStatePersistenceOptions`

Options for useViewStatePersistence.

| Property | Type | Description |
|---|---|---|
| `initial` | `T` | Initial value used when no (valid) stored value is found. |
| `storageKey` | `string` | Web Storage key (unique per persisted view). |
| `storageType?` | `StorageType` | Web Storage type. |
| `version?` | `number` | Schema version — a mismatch discards stored state. |

### `VirtualGridProps`

`VirtualGridProps<TData>` — AS-IS shape preserved (VirtualGrid.tsx L17-20).

| Property | Type | Description |
|---|---|---|
| `className?` | `string` |  |
| `columns` | `ColumnDef<TData, unknown>[]` |  |
| `containerHeight?` | `number` | scroll container height px (default `500` — differs from Grid `virtualScrollHeight=400`, AS-IS preserved). |
| `data` | `TData[]` |  |
| `emptyText?` | `string` |  |
| `loading?` | `boolean` |  |
| `onRowClick?` | `(…) => …` |  |
| `onRowDoubleClick?` | `(…) => …` |  |
| `pagination?` | `GridPaginationOptions` |  |
| `rowHeight?` | `number` | Estimated row height px (default `40` — differs from Grid `estimateSize=36`, AS-IS preserved). |
| `rowSelection?` | `GridRowSelectionOptions<TData>` |  |

### `CellClassNameCallback`

Grid-level cell className callback.

Receives a clean GridCellContext (rowId/columnId/value/row — no TanStack types) and
returns a Tailwind className string (or undefined for no addition) appended to the `<td>`.
grid-core 1.0 : `Cell<TData,unknown>` → `GridCellContext<TData>`.

Canonical home: `@topgrid/grid-core` (since / 2026-05-18 — ADR-).
`@topgrid/grid-renderers` re-exports as type-only (ADR-MOD-GRID-REFACTOR-2026-05-17-009
conforming to the reverse-dependency removal policy).

```ts
type CellClassNameCallback = (…) => …
```

### `GetRowId`

Extract a stable id from a row ( getRowId concept).

```ts
type GetRowId = (…) => …
```

### `GridColumnResizeMode`

Column resize mode.

- `'onChange'`: real-time width update during drag (default — best UX).
- `'onEnd'`: single update at drag end (best performance, recommended for large-row environments).

```ts
type GridColumnResizeMode = "onChange" | "onEnd"
```

### `GridScrollToOptions`

The options type for `<Grid>` `ref.current.scrollTo(index, options)`.

Same signature as `@tanstack/react-virtual` `ScrollToOptions`.
The same semantics apply to the fallback DOM scroll when `enableVirtualization=false`
(`align` → `block`, `behavior` as-is).

```ts
type GridScrollToOptions = VirtualScrollToOptions
```

### `GridStateKey`

The union of the 8 state keys.

```ts
type GridStateKey = "sorting" | "columnFilters" | "rowSelection" | "pagination" | "columnPinning" | "columnOrder" | "columnSizing" | "columnVisibility"
```

### `PaginationMode`

Pagination behavior mode.

- `'client'`: client slicing after loading all data. `manualPagination: false`.
- `'server'`: page-by-page load from the server. `manualPagination: true`. `totalCount` or `pageCount` required.
- `'none'`: pagination disabled (default — `enablePagination: false`).

```ts
type PaginationMode = "client" | "server" | "none"
```

### `PersistTarget`

The state target that `useColumnPersistence` will persist.

- `'visibility'`: `VisibilityState` (column show/hide).
- `'order'`: `ColumnOrderState` (column order).

```ts
type PersistTarget = "visibility" | "order"
```

### `RendererFn`

Cell renderer function type.

Takes a TanStack `CellContext<TData, unknown>` and returns a `ReactNode`.
No `any` — uses TValue=unknown.

```ts
type RendererFn = (…) => …
```

### `RendererRegistry`

The type → RendererFn mapping type.

Based on `Map<TopgridColumnType, RendererFn<TData>>`.
No `any`. References the XX Grid `components` registry pattern (L2: R-A).

```ts
type RendererRegistry = Map<TopgridColumnType, RendererFn<TData>>
```

### `RowClassNameCallback`

Grid-level row className callback.

Receives a TanStack `Row<TData>` and returns a Tailwind className string
(or undefined for no addition) to be appended to the rendered `<tr>`.

```ts
type RowClassNameCallback = (…) => …
```

### `RowId`

A row id (TanStack `row.id` shape).

```ts
type RowId = string | number
```

### `RowSelectionMode`

Row selection mode.

- `'single'`: single row selection — the header checkbox is not rendered.
- `'multi'`: multiple selection — header checkbox (select all) + per-row checkboxes.
- `'none'`: selection disabled — no checkbox column synthesized.

Compatible with the BaseGrid `GridRowSelectionOptions.mode` (legacy alias support).

```ts
type RowSelectionMode = "single" | "multi" | "none"
```

### `TopgridColumnDef`

Standard column definition. The input type for producing a TanStack `ColumnDef<TData>`.

Automatic renderer branching via the `type` field. Consumed by `createColumns<TData>(defs)`.

```ts
type TopgridColumnDef = BaseColumnDef & { … } | BaseColumnDef & { … }
```

### `TopgridColumnType`

The union of 11 automatic renderer-branching types.

`createColumns` looks up the rendererRegistry by this type to
select the appropriate cell renderer.

- `'checkbox'`: DisplayColumnDef-specific handling (no accessorKey, enableSorting forced false)
- `'number'`: number formatter applied ( to be injected, placeholder)
- `'boolean'`: Y/N display
- `'dateTime'`: date+time formatter ( to be injected, placeholder)
- `'date'`: date formatter ( pending → placeholder)
- `'text'`: plain text (default)
- `'badge'`: Badge component ( pending → placeholder)
- `'link'`: Link component ( pending → placeholder)
- `'icon'`: Icon component ( pending → placeholder)
- `'tag'`: TagCell (+018 wired — readonly string[]).
- `'progress'`: ProgressCell (+018 wired — number|null|undefined).

```ts
type TopgridColumnType = "checkbox" | "number" | "boolean" | "dateTime" | "date" | "text" | "badge" | "link" | "icon" | "tag" | "progress"
```

## Constants

### `darkTheme`

Dark preset — spread into the `theme` prop (`theme={darkTheme}` or `{...darkTheme, headerBg }`).
Covers only the static surfaces; selection/focus/hover stay at their (blue) defaults, which read
acceptably on dark. Row dividers (`divide-gray-100`) are not themed (Tailwind divide utility).

```ts
const darkTheme: GridTheme
```

### `defaultGridIcons`

```ts
const defaultGridIcons: GridIcons
```

### `defaultGridLocale`

```ts
const defaultGridLocale: GridLocale
```

### `defaultRendererRegistry`

The default rendererRegistry (Map).

- After +018 is applied: at the moment `import '@topgrid/grid-renderers'` runs, the 8 placeholders `text`/`number`/
 `date`/`dateTime`/`badge`/`link`/`tag`/`progress` are replaced with real component adapters.
 `boolean` (Y/N) / `icon` (placeholder) / `checkbox` (registry-bypassed) are unchanged.
- When grid-renderers is not imported: the 11 placeholders act as fallbacks (graceful degradation).
- `checkbox` branches to DisplayColumnDef — low registry priority.
- : when a type is not registered, `createColumns` applies the fallback.

```ts
const defaultRendererRegistry: RendererRegistry
```
