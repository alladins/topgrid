---
title: "@topgrid/grid-pro-range"
sidebar_label: "grid-pro-range"
sidebar_position: 24
---

# @topgrid/grid-pro-range

> Pro: Cell Range Selection, Drag-fill, Clipboard · **Commercial (EULA)**

:::info Auto-generated
This page is auto-generated from TSDoc comments in the source code (internal markers scrubbed). For a curated getting-started summary, see the [API Reference](../api-reference).
:::

**27** public exports — 6 functions · 4 hooks · 2 components · 15 types · 0 constants.

## Components

### `DragFillHandle`

```ts
DragFillHandle(__namedParameters: DragFillHandleProps<TCell>): null | ReactElement<any, string | JSXElementConstructor<any>>
```

### `RangeSelectGrid`

RangeSelectGrid — full 5-hook integration.

 Rules of Hooks: all 5 hooks are called unconditionally.
 enable* = behavior gate (not hook invocation gate).
 onKeyDown composition: editKeyDown → navKeyDown → clipKeyDown.

```ts
RangeSelectGrid(props: RangeSelectGridAllProps<TData, TCell>): ReactElement
```

**Example**

```tsx
// v0.1.x 그대로 동작 (C-6 backward compat)
<RangeSelectGrid data={rows} columns={columns} />

// v0.2.0 — Drag-fill + Clipboard 활성화
<RangeSelectGrid<MyData, string>
  data={data}
  columns={columns}
  enableDragFill
  enableClipboard
  getCellValue={(row, col) => getValue(row, col)}
  onFillComplete={(cells) => apply(cells)}
  onPaste={(cells) => apply(cells)}
/>
```

## Hooks

### `useCellRange`

Cell range selection hook via mouse drag / Shift+Click.

```ts
useCellRange(onRangeChange: (…) => …): UseCellRangeReturn
```

| Parameter | Type | Description |
|---|---|---|
| `onRangeChange` | `(…) => …` | Callback invoked when the range changes. |

**Returns** — range state + 3 event handlers.

**Example**

```tsx
const { range, handleMouseDown, handleMouseEnter, handleMouseUp } =
  useCellRange((r) => console.log('range changed:', r));
```

### `useClipboard`

```ts
useClipboard(props: UseClipboardProps<TData, TCell>): UseClipboardReturn
```

### `useKeyboardEdit`

useKeyboardEdit — Delete/F2/Enter/printable key branching hook.

```ts
useKeyboardEdit(props: UseKeyboardEditProps<TData, TCell>): UseKeyboardEditReturn
```

**Returns** — `{ onKeyDown }` — a keydown handler to attach to the Grid container.

**Example**

```tsx
const { onKeyDown: editKeyDown } = useKeyboardEdit({ selection, activeCell, ... });
// D7: G-005 앞에 배치 (D5 Enter 우선순위)
const onKeyDown = useCallback((e: React.KeyboardEvent) => {
  editKeyDown(e);
  if (e.defaultPrevented) return;
  navKeyDown(e);   // G-002
  clipKeyDown(e);  // G-004
}, [editKeyDown, navKeyDown, clipKeyDown]);
```

### `useKeyboardNav`

```ts
useKeyboardNav(options: UseKeyboardNavOptions<TData>): UseKeyboardNavReturn
```

## Functions

### `detectSeriesStep`

```ts
detectSeriesStep(values: number[]): null | number
```

### `fillRange`

```ts
fillRange(sourceRange: CellRange, direction: FillDirection, fillCount: number, getCellValue: (…) => …): CellUpdate<TCell>[]
```

### `isInRange`

```ts
isInRange(row: number, col: number, range: null | CellRange): boolean
```

### `normalizeRange`

```ts
normalizeRange(range: CellRange): CellRange
```

### `parseTsv`

```ts
parseTsv(tsv: string): string[][]
```

### `stringifyTsv`

```ts
stringifyTsv(matrix: readonly readonly unknown[][]): string
```

## Types & Interfaces

### `CellCoord`

Pure cell range utilities — normalization, containment test, drag-fill, TSV (W1 Phase 0, moved out of grid-pro-range).

All framework-agnostic pure functions + pure data types (coordinate/rectangle/direction/update).
The React (grid-pro-range) and Vue range adapters share the same math/serialization. Render/event agnostic.

| Property | Type | Description |
|---|---|---|
| `col` | `number` |  |
| `row` | `number` |  |

### `CellRange`

| Property | Type | Description |
|---|---|---|
| `end` | `CellCoord` |  |
| `start` | `CellCoord` |  |

### `CellUpdate`

| Property | Type | Description |
|---|---|---|
| `col` | `number` |  |
| `row` | `number` |  |
| `value` | `TCell` |  |

### `DragFillHandleProps`

Props for the DragFillHandle component.

 (exactOptionalPropertyTypes): optional fields are declared as '?: T'.
Use the spread-skip pattern when passing (spec Section 4.4).

| Property | Type | Description |
|---|---|---|
| `colCount` | `number` | Total number of grid columns (boundary clamp). |
| `containerRef` | `RefObject<HTMLElement>` | ref of the container where the handle is rendered (coordinate calculation). |
| `getCellRect` | `(…) => …` | Cell size getter (px) — for converting drag position → cell coord. |
| `getCellValue` | `(…) => …` | Source cell value getter — for fill calculation during drag. |
| `onFillComplete?` | `(…) => …` | Fill-complete callback (separation). |
| `onFillTargetChange?` | `(…) => …` | Notification of fill-target range changes during drag (for the visual dashed outline). |
| `range` | `null \| CellRange` | Currently selected source range (CellRange). No handle shown if null. |
| `rowCount` | `number` | Total number of grid rows (boundary clamp). |

### `PasteResult`

Paste result metadata (supplement — ).
cells: parsed CellUpdate array (passed to the onPaste callback).
truncated: if true, some cells were clamped due to exceeding grid boundaries.
rows: number of TSV-parsed rows.
cols: number of TSV-parsed columns.

| Property | Type | Description |
|---|---|---|
| `cells` | `CellUpdate<TCell>[]` |  |
| `cols` | `number` |  |
| `rows` | `number` |  |
| `truncated` | `boolean` |  |

### `RangeSelectGridAllProps`

Extended props — 6 props retained + 5 enable flags + 7 callbacks.

enable* flag design principle :
 - all hooks are called unconditionally (Rules of Hooks compliance)
 - enable* = false → early return inside the hook (behavior gating)
 - DragFillHandle: being a component, conditional rendering is allowed

| Property | Type | Description |
|---|---|---|
| `className?` | `string` |  |
| `columns` | `ColumnDef<TData>[]` |  |
| `data` | `TData[]` |  |
| `emptyText?` | `string` |  |
| `enableClipboard?` | `boolean` | Ctrl+C/V clipboard (default: false). |
| `enableDragFill?` | `boolean` | Drag-fill handle rendering + fill feature (default: false). |
| `enableKeyboardEdit?` | `boolean` | Delete/F2/Enter/printable key edit trigger (default: false). |
| `enableKeyboardNav?` | `boolean` | Arrow/Ctrl+Arrow keyboard navigation (default: true). |
| `enableRangeSelection?` | `boolean` | Mouse drag / Shift+Click range selection (default: true). |
| `enableVirtualization?` | `boolean` | @tanstack/react-virtual virtualization (default: false). |
| `getCellValue?` | `(…) => …` | Cell value getter — for drag-fill calculation + clipboard copy. |
| `isEditableColumn?` | `(…) => …` | Determines whether a column is editable. All editable when not provided. |
| `loading?` | `boolean` |  |
| `onBulkEdit?` | `(…) => …` | Range bulk-input callback (separation). |
| `onClipboardError?` | `(…) => …` | Clipboard API error handler (permission denial, etc.). |
| `onDeleteRange?` | `(…) => …` | Delete-key range deletion callback (separation). |
| `onEditStart?` | `(…) => …` | F2/Enter single-cell edit-start callback (separation). |
| `onFillComplete?` | `(…) => …` | Drag-fill complete callback (separation). |
| `onFillTargetChange?` | `(…) => …` | Drag-fill target range change notification (dashed outline). |
| `onPaste?` | `(…) => …` | Paste result callback (separation). |
| `onRangeChange?` | `(…) => …` |  |

### `RangeSelectGridProps`

RangeSelectGrid props (incl. L0 backward-compat — ).

 (exactOptionalPropertyTypes): optional fields are declared as '?: T'.
Use the spread-skip pattern when passing (Section 6.6).

| Property | Type | Description |
|---|---|---|
| `className?` | `string` |  |
| `columns` | `ColumnDef<TData>[]` |  |
| `data` | `TData[]` |  |
| `emptyText?` | `string` |  |
| `loading?` | `boolean` |  |
| `onRangeChange?` | `(…) => …` |  |

### `UseCellRangeReturn`

Return type of the useCellRange hook.

| Property | Type | Description |
|---|---|---|
| `dragging` | `boolean` | Whether a drag is in progress. |
| `handleMouseDown` | `(…) => …` | Cell mousedown handler. |
| `handleMouseEnter` | `(…) => …` | Cell mouseenter handler (extends the drag range). |
| `handleMouseUp` | `(…) => …` | mouseup handler (ends the drag). |
| `range` | `null \| CellRange` | Currently selected cell range. null if no selection. |

### `UseClipboardProps`

useClipboard hook props.

 (exactOptionalPropertyTypes): optional fields are declared as '?: T'.
Use the spread-skip pattern when passing (see the spec Section 3.4 example).

| Property | Type | Description |
|---|---|---|
| `activeCell` | `null \| CellCoord` | Current active cell coordinate (useKeyboardNav's activeCell). Ctrl+V no-op if null. |
| `colCount` | `number` | Total number of grid columns (boundary clamp). |
| `getCellValue` | `(…) => …` | Cell value getter — for extracting the matrix on copy. |
| `onError?` | `(…) => …` | Clipboard API error handler (permission denial, etc.). |
| `onPaste?` | `(…) => …` | Paste result callback (separation). If not provided, only paste parsing is performed. |
| `rowCount` | `number` | Total number of grid rows (boundary clamp). |
| `selection` | `null \| CellRange` | Current selection range (useCellRange's range). Ctrl+C no-op if null. |
| `table?` | `Table<TData>` | TanStack Table instance — not used, optional for future extension. |

### `UseClipboardReturn`

Return type of the useClipboard hook.

| Property | Type | Description |
|---|---|---|
| `copyToClipboard` | `(…) => …` | Ctrl+C programmatic copy. navigator.clipboard async. |
| `onKeyDown` | `(…) => …` | keydown handler to attach to the Grid container. Ctrl+C → copyToClipboard, Ctrl+V → pasteFromClipboard.  Use composed with useKeyboardNav.handleKeyDown. |
| `pasteFromClipboard` | `(…) => …` | Ctrl+V programmatic paste. An explicit tsvString may be injected (for Storybook/tests). |

### `UseKeyboardEditProps`

useKeyboardEdit hook props.

 (exactOptionalPropertyTypes): optional fields are declared as '?: T'.
Use the spread-skip pattern when passing (see the spec Section 10.1 example).

| Property | Type | Description |
|---|---|---|
| `activeCell` | `null \| CellCoord` | Current active cell coordinate (useKeyboardNav's activeCell). F2/Enter no-op if null. |
| `isEditableColumn?` | `(…) => …` | Function determining whether a column is editable. When not provided, all columns are treated as editable. |
| `onBulkEdit?` | `(…) => …` | Range bulk-input callback (separation). |
| `onDeleteRange?` | `(…) => …` | Delete-key range deletion callback (separation). |
| `onEditStart?` | `(…) => …` | F2/Enter single-cell edit-start callback (separation). |
| `selection` | `null \| CellRange` | Current selection range (useCellRange's range). Delete/printable no-op if null. |
| `table?` | `Table<TData>` | TanStack Table instance — optional for future extension. |

### `UseKeyboardEditReturn`

Return type of the useKeyboardEdit hook.

| Property | Type | Description |
|---|---|---|
| `onKeyDown` | `(…) => …` | keydown handler to attach to the Grid container.  Composable with handleKeyDown / onKeyDown. The caller places onKeyDown at the front of the chain (Enter priority). |

### `UseKeyboardNavOptions`

| Property | Type | Description |
|---|---|---|
| `activeCell` | `null \| CellCoord` | Current active cell coordinate (controlled). |
| `getCellValue?` | `(…) => …` | Ctrl+Arrow data-edge traversal function (optional). |
| `onActiveCellChange` | `(…) => …` | Active cell change callback. |
| `onRangeChange` | `(…) => …` | Range change callback (same signature as useCellRange's onRangeChange — ). |
| `range` | `null \| CellRange` | Current selection range (received from useCellRange — controlled). |
| `table` | `Table<TData>` | TanStack table instance (for boundary calculation — ). |

### `UseKeyboardNavReturn`

| Property | Type | Description |
|---|---|---|
| `handleKeyDown` | `(…) => …` | keydown handler to attach to the Grid container. |

### `FillDirection`

```ts
type FillDirection = "up" | "down" | "left" | "right"
```

