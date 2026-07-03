---
title: "@topgrid/grid-pro-datamap"
sidebar_label: "grid-pro-datamap"
sidebar_position: 16
---

# @topgrid/grid-pro-datamap

> Pro: DataMap (foreign key display) · **Commercial (EULA)**

:::info Auto-generated
This page is auto-generated from the source code's TSDoc comments (internal markers scrubbed). For the curated getting-started summary, see the [API Reference](../api-reference).
:::

**14** public exports — 2 functions · 0 hooks · 2 components · 10 types · 0 constants.

## Components

### `DataMapCell`

DataMapCell&lt;TData>: receives a TanStack CellContext → column.dataMap.getDisplay(value) → renders the label.

- static dataMap: column.columnDef.dataMap is a DataMap instance
- functional dataMap: column.columnDef.dataMap(row.original) → DataMap instance
- no getDisplay result (undefined) → String(value ?? '') fallback (.3)
- dataMap not set → String(value ?? '') fallback (.1)

: uses the standard TanStack CellContext API
: no any (DataMapColumnDef&lt;TData> type cast — for accessing DataMap-only extension fields)
: virtualization-compatible — resolveDataMap + getDisplay are both O(1)

```ts
DataMapCell(info: CellContext<TData, unknown>): Element
```

| Parameter | Type | Description |
|---|---|---|
| `info` | `CellContext<TData, unknown>` | TanStack CellContext&lt;TData, unknown> (createColumns.ts L128-130 pattern) |

**Returns** — a span element — the label text or the fallback

### `DataMapEditor`

DataMapEditor&lt;TItem>: filter-typing dropdown component for the edit cell.

- auto-focuses the input on mount
- typing → filters items (case-insensitive, suppresses filtering during IME composition)
- dropdown: absolute z-50 bg-white border border-gray-200 rounded shadow-md max-h-48 overflow-y-auto
- keyboard: ArrowDown/Up to move, Enter to select, Escape to cancel
- ARIA: role="combobox" + aria-expanded + role="listbox" + role="option"
- highlightedIndex: resets to -1 when filtered.length changes (spec Section 11.2 risk #4)
- isComposing: uses useRef&lt;boolean> — no setState needed (spec Section 11.2 risk #3)

: DataMapEditorProps&lt;TItem> standard API (spec Section 3.1)
: no any — TItem generic upper bound
: Tailwind CSS only
: getItems + Array.filter — O(n), virtualization-compatible

```ts
DataMapEditor(props: DataMapEditorProps<TItem>): Element
```

| Parameter | Type | Description |
|---|---|---|
| `props` | `DataMapEditorProps<TItem>` | DataMapEditorProps&lt;TItem> |

**Returns** — input field + conditional dropdown container

## Functions

### `createAsyncDataMap`

createAsyncDataMap&lt;TItem>: AsyncDataMap factory.

- full DataMap&lt;TItem> implementation: getDisplay, getItems, getValue
- 4-state state machine: idle → loading → loaded/error (Section 12)
- staleTime-based caching + invalidate
- pendingPromise de-dupe: shares the same Promise across concurrent load calls
- onStateChange?: registers a subscription callback → returns an unsubscribe function (Section 3.1)

```ts
createAsyncDataMap(options: CreateAsyncDataMapOptions<TItem>): AsyncDataMap<TItem>
```

| Parameter | Type | Description |
|---|---|---|
| `options` | `CreateAsyncDataMapOptions<TItem>` | CreateAsyncDataMapOptions&lt;TItem> |

**Returns** — AsyncDataMap&lt;TItem>

### `createDataMap`

createDataMap&lt;TItem>: DataMap factory function.
Creates a DataMap instance from an items array and valuePath/displayPath configuration.

```ts
createDataMap(options: CreateDataMapOptions<TItem>): DataMap<TItem>
```

**Example**

```ts
const map = createDataMap({
  items: [{ code: 'A', name: '항목A' }],
  valuePath: 'code',
  displayPath: 'name',
});
map.getDisplay('A'); // '항목A'
map.getValue('항목A'); // 'A'
```

## Types & Interfaces

### `AsyncDataMap`

AsyncDataMap&lt;TItem>: async DataMap interface.
Extends DataMap&lt;TItem> — usable with DataMapEditor/DataMapCell exactly like a synchronous DataMap.

Additional members:
- state: current loading state (readonly)
- load: async load trigger — Promise&lt;void> (shares the same Promise if already loading)
- invalidate: invalidates the cache → resets state to 'idle' → reloads on the next getItems
- onStateChange?: registers a state-change callback (for DataMapEditor spinner integration)
 return value = unsubscribe function (called by DataMapEditor useEffect cleanup)

: no any — keeps the TItem upper bound
: onStateChange? optional — undefined check required when not provided

| Property | Type | Description |
|---|---|---|
| `state` | `AsyncDataMapState` |  |
| `getDisplay` | `unknown` |  |
| `getItems` | `unknown` |  |
| `getValue` | `unknown` |  |
| `invalidate` | `unknown` |  |
| `load` | `unknown` |  |
| `onStateChange?` | `unknown` |  |

### `CreateAsyncDataMapOptions`

CreateAsyncDataMapOptions&lt;TItem>: factory options for createAsyncDataMap.

: no any
: staleTime? optional — uses the internal DEFAULT_STALE_TIME(300_000 ms) when not provided.
 internal consumption: `options.staleTime !== undefined ? options.staleTime : DEFAULT_STALE_TIME`

| Property | Type | Description |
|---|---|---|
| `displayPath` | `PathOrAccessor<TItem, string>` | display label path or accessor |
| `loader` | `(…) => …` | async loader for option items — returns Promise&lt;TItem[]> |
| `staleTime?` | `number` | cache validity period (ms). When not provided, 5 minutes (300_000 ms). : optional — used internally after a staleTime !== undefined check |
| `valuePath` | `PathOrAccessor<TItem, unknown>` | code value path or accessor |

### `CreateDataMapOptions`

| Property | Type | Description |
|---|---|---|
| `displayPath` | `PathOrAccessor<TItem, string>` |  |
| `items` | `TItem[]` |  |
| `valuePath` | `PathOrAccessor<TItem, unknown>` |  |

### `DataMap`

DataMap&lt;TItem>: bidirectional code value ↔ label lookup interface.
The single type returned by the createDataMap factory function.

| Property | Type | Description |
|---|---|---|
| `getDisplay` | `unknown` |  |
| `getItems` | `unknown` |  |
| `getValue` | `unknown` |  |

### `DataMapEditorProps`

DataMapEditorProps&lt;TItem>: parameter type for the edit-cell dropdown editor component.
: filter-typing dropdown (DataMapEditor).

: no any — : exactOptionalPropertyTypes=true compatible

| Property | Type | Description |
|---|---|---|
| `dataMap` | `DataMap<TItem>` | selection list provider — returns all items via getItems |
| `getLabelFromItem?` | `(…) => …` | Optional: TItem → display label conversion function. Since the DataMap's internal Map is keyed by the valuePath(item) code key, getDisplay(item) cannot be called directly (F-06 spec code defect fix). Falls back to String(item) when not provided (spec Section 11.3 explicit alternative). : optional — undefined when not provided (no spread-skip needed, for internal consumption) |
| `onCancel` | `(…) => …` | edit-cancel callback |
| `onCommit` | `(…) => …` | selection-commit callback — newValue is the DataMap's code value |
| `value` | `unknown` | current cell's code value (per DataMap.getValue) |

### `AsyncDataMapState`

AsyncDataMapState: internal loading state machine of AsyncDataMap.
'idle': initial state (load not called)
'loading': loader Promise in progress
'loaded': items loaded + cache valid
'error': loader rejected — returns a fallback empty list

: no any — string literal union

```ts
type AsyncDataMapState = "idle" | "loading" | "loaded" | "error"
```

### `DataMapCellProps`

DataMapCellProps&lt;TData>: parameter type alias for the DataMapCell component.
: TanStack CellContext&lt;TData, unknown> = DataMapCell's single input type.
Can be shorthand-referenced at the usage site as `DataMapCellProps<MyRow>`.

```ts
type DataMapCellProps = CellContext<TData, unknown>
```

### `DataMapColumnDef`

DataMapColumnDef&lt;TData>: TanStack ColumnDef + dataMap/selectOptions extension. Primary export.
: defines only the dataMap + selectOptions type fields.
/: wires up the actual renderer/editor.

: no any (uses DataMap&lt;unknown> as the upper-bound type)
: exactOptionalPropertyTypes=true — optional fields need explicit undefined

Note: adopts the intersection pattern (spec Section 3.3, spec ).
 The prose's Omit&lt;...>+'meta?: TopgridColumnMeta' proposal is unrealizable due to the missing TopgridColumnMeta definition —
: the spec code template + is authoritative. See spec feedback L1.

Renamed from TopgridColumnDef (ADR-MOD-GRID-REFACTOR-2026-05-17-006, POL-COMPAT §3).
See TopgridColumnDef deprecation alias below.

```ts
type DataMapColumnDef = ColumnDef<TData, unknown> & { … }
```

### `PathOrAccessor`

valuePath / displayPath: keyof TItem or accessor function

```ts
type PathOrAccessor = keyof TItem | (…) => …
```

### `TopgridColumnDef`

```ts
type TopgridColumnDef = DataMapColumnDef<TData>
```
