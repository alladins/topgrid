---
title: "@topgrid/grid-features"
sidebar_label: "grid-features"
sidebar_position: 5
---

# @topgrid/grid-features

> Column reorder, multi-sort, filter UI features · **Free (MIT)**

:::info Auto-generated
This page is auto-generated from TSDoc comments in the source code (internal markers scrubbed). For a curated getting-started summary, see the [API Reference](../api-reference).
:::

**45** public exports — 6 functions · 3 hooks · 13 components · 23 types · 0 constants.

## Components

### `DateFilter`

Date range filter component.

Reuses FilterPopover + FilterIndicator to render from/to DatePickers.
Triggers TanStack Table filtering via `column.setFilterValue`.

```ts
DateFilter(__namedParameters: DateFilterProps<TData>): Element
```

**Example**

```tsx
columnHelper.accessor('orderDate', {
  filterFn: dateRangeFilterFn,
  header: ({ column }) => (
    <div>
      주문일
      <DateFilter column={column} />
    </div>
  ),
});
```

### `DropIndicator`

A blue vertical line indicator rendered at the drag drop position.

```ts
DropIndicator(__namedParameters: { … }): null | Element
```

### `FilterIndicator`

Active filter indicator — a blue dot.

Passes the `column.getIsFiltered` result as the isFiltered prop.
Returns null when the filter is inactive (no DOM element).

```ts
FilterIndicator(__namedParameters: FilterIndicatorProps): null | Element
```

**Example**

```tsx
<FilterIndicator isFiltered={column.getIsFiltered()} />
```

### `FilterPopover`

Popover container for text filters.

Takes the trigger element via the trigger prop and renders the popover content as children.
Manages open/close state internally (no external control needed).

```ts
FilterPopover(__namedParameters: FilterPopoverProps): Element
```

### `FilterResetButton`

Component that resets all filters.

```ts
FilterResetButton(__namedParameters: FilterResetButtonProps<TData>): Element
```

### `GlobalSearchInput`

All-row search input component (debounce 300ms).

```ts
GlobalSearchInput(__namedParameters: GlobalSearchInputProps<TData>): Element
```

### `NumberFilter`

Number filter UI — a select of 7 operators + conditional input + clear button.

The main component composing `FilterPopover` + `FilterIndicator` ( reuse).
Connects to TanStack columnFilters via `column.setFilterValue`.
Debounce 300ms (Section 4.6).
between operator: conditionally renders two inputs, min/max (, Section 5.3).

```ts
NumberFilter(__namedParameters: NumberFilterProps<TData>): Element
```

**Example**

```tsx
// Rendered in the columnDef header:
header: ({ column }) => (
  <div className="flex items-center gap-1">
    <span>가격</span>
    <NumberFilter column={column} defaultOperator="=" />
  </div>
),
filterFn: numberFilterFn,
```

### `NumberFloatingFilter`

Number floating filter — one always-visible input. Operator fixed to `=` (exact match), and after a 300ms debounce
sets `NumberFilterValue` (empty value = cleared). Use on columns with `filterFn: numberFilterFn`.

```ts
NumberFloatingFilter(__namedParameters: { … }): Element
```

### `SelectFilter`

Excel-style multi-select checkbox filter component.

```ts
SelectFilter(__namedParameters: SelectFilterProps<TData>): Element
```

### `SortBadge`

Multi-sort priority badge — grid-core canonical source.

```ts
SortBadge(__namedParameters: SortBadgeProps): null | Element
```

### `SortClearButton`

Button that clears the entire current sort state.
Used by wiring `table.setSorting([])` to the `onClear` callback.

```ts
SortClearButton(__namedParameters: SortClearButtonProps): Element
```

**Example**

```ts
<SortClearButton onClear={() => table.setSorting([])} />
```

**See** — `SortClearButtonProps`

### `TextFilter`

Text filter UI — operator select + value input + clear button.

The main component composing `FilterPopover` + `FilterIndicator`.
Connects to TanStack columnFilters via `column.setFilterValue`.
Debounce 300ms (Section 4.5).

```ts
TextFilter(__namedParameters: TextFilterProps<TData>): Element
```

**Example**

```tsx
// Rendered in the columnDef header:
header: ({ column }) => (
  <div className="flex items-center gap-1">
    <span>이름</span>
    <TextFilter column={column} defaultOperator="contains" />
  </div>
),
filterFn: textFilterFn,
```

### `TextFloatingFilter`

Text floating filter — one always-visible input. Operator fixed to `contains` (the operator of an existing value is preserved),
and after a 300ms debounce sets `TextFilterValue` (empty value = cleared). Use on columns with `filterFn: textFilterFn`.

```ts
TextFloatingFilter(__namedParameters: { … }): Element
```

## Hooks

### `useColumnDrag`

Column reorder hook based on the HTML5 Drag and Drop API.

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
- On mount: localStorage.getItem → JSON.parse → table.setColumnOrder ( restore)
- Save method: call `saveOrder(order)` → localStorage.setItem
- All localStorage access: the adapter does try/catch
- SSR guard: handled by the adapter
- QuotaExceededError: the adapter does console.warn + silent skip

```ts
useColumnOrderPersist(__namedParameters: UseColumnOrderPersistProps<TData>): { … }
```

### `useMultiSort`

Helper for configuring multi-sort options when a consumer uses useReactTable directly.

```ts
useMultiSort(opts: UseMultiSortOptions): UseMultiSortResult
```

**Example**

```ts
const { enableMultiSort, isMultiSortEvent } = useMultiSort({ enableMultiSort: true });
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  enableMultiSort,
  isMultiSortEvent,
});
```

## Functions

### `buildCellClassName`

Compiles a declarative cell-rule array → grid-core `CellClassNameCallback`.

The predicate receives `ctx.value` (the value) and `ctx.row` (the row data) (grid-core 1.0 : clean ctx).
The join/undefined rules are the same as `buildRowClassName`. Pure function.

```ts
buildCellClassName(rules: CellFormatRule<TData, TValue>[]): CellClassNameCallback<TData>
```

**Example**

```ts
<Grid cellClassName={buildCellClassName<Order, number>([
  { when: (v) => v < 0, className: 'text-red-600' },
])} />
```

### `buildRowClassName`

Compiles a declarative row-rule array → grid-core `RowClassNameCallback`.

Joins the className of every matching rule with a space, in rule order (multiple applications allowed).
0 matches → `undefined` (callback contract: no addition). Pure function — no side effects.

```ts
buildRowClassName(rules: RowFormatRule<TData>[]): RowClassNameCallback<TData>
```

**Example**

```ts
<Grid rowClassName={buildRowClassName([
  { when: (_, i) => i % 2 === 1, className: 'bg-gray-50' },     // alternating (stripes)
  { when: (d) => d.status === 'error', className: 'text-red-600' },
])} />
```

### `dateRangeFilterFn`

```ts
dateRangeFilterFn(row: Row<unknown>, columnId: string, filterValue: any, addMeta: (…) => …): boolean
```

### `numberFilterFn`

```ts
numberFilterFn(row: Row<unknown>, columnId: string, filterValue: any, addMeta: (…) => …): boolean
```

### `selectFilterFn`

```ts
selectFilterFn(row: Row<any>, columnId: string, filterValue: any, addMeta: (…) => …): boolean
```

### `textFilterFn`

```ts
textFilterFn(row: Row<unknown>, columnId: string, filterValue: any, addMeta: (…) => …): boolean
```

## Types & Interfaces

### `CellFormatRule`

Per-cell conditional formatting rule.

| Property | Type | Description |
|---|---|---|
| `className` | `string` | className to append to the cell when the predicate is true |
| `when` | `(…) => …` | Predicate evaluated with the cell value (`cell.getValue`) and the row data (`cell.row.original`) |

### `DateFilterProps`

DateFilter component Props.

| Property | Type | Description |
|---|---|---|
| `column` | `Column<TData, unknown>` | TanStack Column instance. Column&lt;TData, unknown>. |
| `popoverAlign?` | `"left" \| "right"` | Popover alignment — default 'left'. : optional prop — passed to FilterPopover align via spread-skip. |

### `DateFilterValue`

| Property | Type | Description |
|---|---|---|
| `from?` | `Date` |  |
| `to?` | `Date` |  |

### `DragThProps`

drag props to pass to the header `<th>` DOM element.

HTML5 DragEvent handlers (: no external library used).
Grid.tsx receives a React.DragEvent&lt;HTMLTableCellElement>,
extracts the DOM DragEvent via `.nativeEvent`, then passes it to these handlers.

| Property | Type | Description |
|---|---|---|
| `draggable` | `boolean` | pinned=true → false, enabled=true → true (/). |
| `onDragEnd` | `(…) => …` |  |
| `onDragLeave` | `(…) => …` |  |
| `onDragOver` | `(…) => …` |  |
| `onDragStart` | `(…) => …` |  |
| `onDrop` | `(…) => …` |  |

### `FilterIndicatorProps`

FilterIndicator component Props.
Passes the `column.getIsFiltered` result through as-is.

| Property | Type | Description |
|---|---|---|
| `isFiltered` | `boolean` | column.getIsFiltered result |

### `FilterPopoverProps`

FilterPopover component Props.

Native div position:absolute-based popover (: no @radix-ui).
Includes outside-click (mousedown) / Escape dismiss / focus management.

| Property | Type | Description |
|---|---|---|
| `align?` | `"left" \| "right"` | Alignment direction — default 'left'. : optional prop — uses the spread-skip pattern when passing down (Section 4.6). |
| `children` | `ReactNode` | Popover content |
| `trigger` | `ReactNode` | Render function for the popover trigger element |

### `FilterResetButtonProps`

FilterResetButton component Props.

| Property | Type | Description |
|---|---|---|
| `children?` | `ReactNode` | Button label — default 'Reset Filters'. : optional prop. |
| `table` | `Table<TData>` | TanStack Table instance. |

### `GlobalSearchInputProps`

GlobalSearchInput component Props.

| Property | Type | Description |
|---|---|---|
| `debounceMs?` | `number` | Debounce ms — default 300. : optional prop. |
| `placeholder?` | `string` | Input placeholder — default 'Search all columns…'. : optional prop. |
| `table` | `Table<TData>` | TanStack Table instance. |

### `NumberFilterProps`

NumberFilter component Props.

| Property | Type | Description |
|---|---|---|
| `column` | `Column<TData, unknown>` | TanStack Column instance. Column&lt;TData, unknown>. |
| `defaultOperator?` | `NumberFilterOperator` | Default operator — default '='. : optional prop. |
| `popoverAlign?` | `"left" \| "right"` | Popover alignment — default 'left'. : optional prop — passed to FilterPopover align via spread-skip. |

### `NumberFilterValue`

| Property | Type | Description |
|---|---|---|
| `max?` | `number` |  |
| `min?` | `number` |  |
| `operator` | `NumberFilterOperator` |  |
| `value?` | `number` |  |

### `RowFormatRule`

Per-row conditional formatting rule.

| Property | Type | Description |
|---|---|---|
| `className` | `string` | className to append to the `<tr>` when the predicate is true |
| `when` | `(…) => …` | Predicate evaluated with the row data (`row.original`) and the 0-based row index (`row.index`) |

### `SelectFilterProps`

SelectFilter component Props.

| Property | Type | Description |
|---|---|---|
| `column` | `Column<TData, unknown>` | TanStack Column instance. Column&lt;TData, unknown>. |
| `popoverAlign?` | `"left" \| "right"` | Popover alignment — default 'left'. : optional prop — passed to FilterPopover align via spread-skip. |
| `searchThreshold?` | `number` | Threshold for showing the internal search — default 50. When option count >= searchThreshold, the search input is exposed automatically. : optional prop. |

### `SortBadgeProps`

`SortBadge` component props ( canonical — single source in grid-core).

| Property | Type | Description |
|---|---|---|
| `className?` | `string` | Tailwind className override. |
| `sortIndex` | `number` | TanStack `column.getSortIndex` return value. -1 = unsorted → badge not shown. 0-based integer → displayed number = sortIndex + 1. |

### `SortClearButtonProps`

`SortClearButton` component props.

| Property | Type | Description |
|---|---|---|
| `className?` | `string` | Tailwind className override. |
| `label?` | `string` | Button label (default: '정렬 초기화'). |
| `onClear` | `(…) => …` | Called on click — wire to table.setSorting([]). |

### `TextFilterProps`

TextFilter component Props.

| Property | Type | Description |
|---|---|---|
| `column` | `Column<TData, unknown>` | TanStack Column instance. Column&lt;TData, unknown> — cell value type unknown. |
| `defaultOperator?` | `TextFilterOperator` | Default operator — default 'contains'. : optional prop. |
| `popoverAlign?` | `"left" \| "right"` | Popover alignment — default 'left'. : optional prop — passed to FilterPopover align via spread-skip. |

### `TextFilterValue`

| Property | Type | Description |
|---|---|---|
| `operator` | `TextFilterOperator` |  |
| `value` | `string` |  |

### `UseColumnDragProps`

`useColumnDrag` hook props.

| Property | Type | Description |
|---|---|---|
| `columnOrderStorageKey?` | `string` | localStorage key. Required when persistColumnOrder=true (empty string → save skipped). |
| `enabled` | `boolean` | Whether drag reorder is enabled (passed from the `enableColumnReorder` prop). |
| `onColumnOrderChange?` | `(…) => …` | Callback invoked after a column-order change completes. |
| `persistColumnOrder?` | `boolean` | Whether localStorage persistence is enabled. |
| `table` | `Table<TData>` | TanStack Table v8 instance (`useReactTable` return value). |

### `UseColumnDragReturn`

`useColumnDrag` hook return value.

| Property | Type | Description |
|---|---|---|
| `dragOverId` | `null \| string` | Column ID at which to currently show the drop indicator. `null` = drag disabled or not currently dragging. |
| `getDragProps` | `(…) => …` | Returns the drag event props to spread onto the header `<th>`. |
| `getKeyDownHandler` | `(…) => …` | Returns a handler to attach to the header `<th>` onKeyDown. Alt+← / Alt+→ key events move the column left/right. |

### `UseColumnOrderPersistProps`

@topgrid/grid-core — useColumnOrderPersist hook.

Moved from `@topgrid/grid-features/column-drag/useColumnOrderPersist.ts` per (option A).
Aliased re-export remains in `@topgrid/grid-features` for one minor cycle.

 : column order localStorage persistence.

Internal SSR-guard + try/catch + JSON I/O boilerplate is now delegated to
`internal/storage/storageAdapter` ( Wave 3). External API + raw-array
envelope unchanged.

: save/restore based on the persistColumnOrder + columnOrderStorageKey props.
: localStorage-access try/catch + SSR guard + QuotaExceededError handling (delegated to the adapter).

Structure: mirrors grid-core/useStoragePersist.ts ( decision).

| Property | Type | Description |
|---|---|---|
| `enabled` | `boolean` | Whether localStorage persistence is enabled (persistColumnOrder prop) |
| `storageKey` | `string` | localStorage key (columnOrderStorageKey prop) |
| `table` | `Table<TData>` | TanStack Table v8 instance |

### `UseMultiSortOptions`

`useMultiSort` hook options (for non-wrapper consumers).

| Property | Type | Description |
|---|---|---|
| `enableMultiSort?` | `boolean` | Whether multi-sort is enabled (default false). |
| `maxMultiSortColCount?` | `number` | Passed directly to TanStack maxMultiSortColCount. Unlimited when unset. |

### `UseMultiSortResult`

`useMultiSort` return value.
Used by spreading into the useReactTable options.

| Property | Type | Description |
|---|---|---|
| `enableMultiSort` | `boolean` | Passed to TanStack TableOptions.enableMultiSort. |
| `isMultiSortEvent` | `(…) => …` | Passed to TanStack TableOptions.isMultiSortEvent. (e) => e.shiftKey — same as TanStack's built-in default. Set explicitly to serve a documentation purpose. |
| `maxMultiSortColCount?` | `number` | : undefined when unset — not passed to TanStack when spread (unlimited). |

### `NumberFilterOperator`

```ts
type NumberFilterOperator = "=" | "!=" | ">" | "<" | ">=" | "<=" | "between"
```

### `TextFilterOperator`

```ts
type TextFilterOperator = "contains" | "equals" | "startsWith" | "endsWith"
```
