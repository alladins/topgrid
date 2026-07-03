---
title: "@topgrid/grid-pro-header"
sidebar_label: "grid-pro-header"
sidebar_position: 19
---

# @topgrid/grid-pro-header

> Pro: Multi-row Header (Column Groups) · **상용 (EULA)**

:::info 자동 생성
이 페이지는 소스 코드의 TSDoc 주석에서 자동 생성됩니다(내부 표식 정제). 큐레이트된 시작용 요약은 [API 레퍼런스](../api-reference) 참고.
:::

총 **6개** public export — 함수 1 · 훅 0 · 컴포넌트 2 · 타입 3 · 상수 0.

## 컴포넌트

### `GroupedHeaderGrid`

Legacy self-contained grid component with grouped multi-row headers.

Delegates header rendering to `MultiRowHeader` from `@topgrid/grid-pro-header`.
tbody and pagination are ported verbatim from AS-IS L0.

```ts
GroupedHeaderGrid(__namedParameters: GroupedHeaderGridProps<TData>): Element
```

### `MultiRowHeader`

Renders a multi-row `<thead>` element from a TanStack table instance.

Iterates `table.getHeaderGroups` to produce one `<tr>` per header row.
Group header cells use `header.colSpan` (computed by TanStack automatically).
Placeholder cells (`header.isPlaceholder`) are rendered as empty `<th>` elements.
Sorting is enabled only on leaf columns (`!header.subHeaders.length`).

```ts
MultiRowHeader(props: MultiRowHeaderProps<TData>): Element
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `props` | `MultiRowHeaderProps<TData>` | `MultiRowHeaderProps<TData>`. |

**반환** — A `<thead>` JSX element with all header rows.

## 함수

### `createColumnGroup`

Creates a TanStack `GroupColumnDef<TData>` from a typed config object.

This is a thin wrapper — no logic beyond type narrowing. The returned
object is identical to writing `{ header, columns }` inline, but provides
generic type-checking at the call site.

```ts
createColumnGroup(config: ColumnGroupConfig<TData>): GroupColumnDef<TData>
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `config` | `ColumnGroupConfig<TData>` | `ColumnGroupConfig<TData>` with `header` and `columns`. |

**반환** — A `GroupColumnDef<TData>` suitable for passing to `useReactTable`.

## 타입 · 인터페이스

### `ColumnGroupConfig`

Config object for `createColumnGroup`.

| 속성 | 타입 | 설명 |
|---|---|---|
| `columns` | `ColumnDef<TData>[]` | Leaf (or nested group) column definitions belonging to this group. |
| `header` | `string` | The display label for the column group header. |

### `GroupedHeaderGridProps`

Props for the legacy `GroupedHeaderGrid` wrapper component.

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` |  |
| `columns` | `ColumnDef<TData>[]` | Pass grouped column definitions using TanStack Table's native column grouping. Use `{ header: 'Group', columns: [...leafColumns] }` structure for grouping. |
| `data` | `TData[]` |  |
| `emptyText?` | `string` |  |
| `enableGroupToggle?` | `boolean` | : enable group header click to toggle child column visibility. |
| `loading?` | `boolean` |  |
| `onRowClick?` | `(…) => …` |  |
| `pagination?` | `GridPaginationOptions` |  |
| `rowSelection?` | `GridRowSelectionOptions<TData>` |  |

### `MultiRowHeaderProps`

Props for `MultiRowHeader`.

| 속성 | 타입 | 설명 |
|---|---|---|
| `enableGroupToggle?` | `boolean` | When true, group header cells (non-leaf) become clickable toggles that show/hide all child (leaf) columns at once. Clicking a group header that has all leaves hidden will show them all; clicking one with any visible leaf will hide them all. Leaf columns retain their sort click handler regardless. Default: false (/ behaviour preserved — breaking: false). |
| `enableStickyHeader?` | `boolean` | When true, applies sticky positioning to each header row so the multi-row header remains fixed at the viewport top during vertical scroll. Default: false ( behaviour preserved — breaking: false). |
| `frozenColumns?` | `number` | Number of columns pinned on the left that should receive `sticky left` positioning. Acts as an on/off switch; the actual frozen column identities are determined from TanStack's `columnPinning.left` state via `column.getIsPinned === 'left'` (decision). 0 or omitted: frozen positioning inactive. |
| `table` | `Table<TData>` | The TanStack table instance. Provides `getHeaderGroups` used for multi-row header rendering. |

