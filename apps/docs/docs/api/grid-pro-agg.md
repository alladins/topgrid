---
title: "@topgrid/grid-pro-agg"
sidebar_label: "grid-pro-agg"
sidebar_position: 12
---

# @topgrid/grid-pro-agg

> Pro: Aggregation (group footer) · **상용 (EULA)**

:::info 자동 생성
이 페이지는 소스 코드의 TSDoc 주석에서 자동 생성됩니다(내부 표식 정제). 큐레이트된 시작용 요약은 [API 레퍼런스](../api-reference) 참고.
:::

총 **16개** public export — 함수 4 · 훅 0 · 컴포넌트 2 · 타입 9 · 상수 1.

## 컴포넌트

### `AggregationGrid`

`AggregationGrid` — Pro component for row grouping + aggregation.

```ts
AggregationGrid(__namedParameters: AggregationGridProps<TData>): Element
```

**예시**

```tsx
<AggregationGrid
  data={rows}
  columns={columns}
  enableAggregation
  grouping={['region']}
  showFooter
/>
```

### `GroupPanel`

`GroupPanel` — drag-and-drop grouping bar.

Renders above the grid table. Column `<th>` elements in `AggregationGrid`
are marked `draggable={true}` when `showGroupPanel=true`, allowing users to
drag a column header here to add it to the grouping.

Chip X click removes the column from grouping ( uncontrolled support).

```ts
GroupPanel(__namedParameters: GroupPanelProps<TData>): ReactElement
```

## 함수

### `computeAggregateRow`

: source 행 집합 → 컬럼별 집계값 한 행(grand-total footer / auto-agg floating 공유).

```ts
computeAggregateRow(data: readonly Record<string, unknown>[], spec: AggregateSpec): Record<string, null | number>
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `data` | `readonly Record<string, unknown>[]` | 집계할 source 행(grand-total=전체, 부분집합도 가능). |
| `spec` | `AggregateSpec` | 컬럼별 집계 함수 키. |

**반환** — `{ [columnId]: number | null }` (빈 집합 avg/min/max=null).

### `getAggregationFn`

이름으로 registry에서 사용자 정의 집계 함수를 조회한다.
내장 5종은 별도 registry 조회가 필요 없으므로 이 함수는 사용자 정의 fn 전용.

```ts
getAggregationFn(name: string): undefined | AggregationFn<TData>
```

**반환** — 등록된 AggregationFn&lt;TData> 또는 undefined (미등록).

### `registerAggregationFn`

사용자 정의 집계 함수를 module-level registry에 등록한다.

- TanStack AggregationFn&lt;TData> 표준 시그니처 그대로 사용.
- strict TypeScript, no any.
- 이미 등록된 이름: overwrite + console.warn ( — no throw).
- 한 패키지 라이선스 verifyOrWarn 1회 원칙 — 이 함수는 별도 호출 없음.

```ts
registerAggregationFn(name: string, fn: AggregationFn<TData>): void
```

**예시**

```ts
registerAggregationFn('weightedAvg', (columnId, leafRows) => {
  const totalWeight = leafRows.reduce((s, r) => s + (r.getValue('weight') as number), 0);
  const totalVal = leafRows.reduce(
    (s, r) => s + (r.getValue(columnId) as number) * (r.getValue('weight') as number), 0
  );
  return totalWeight === 0 ? 0 : totalVal / totalWeight;
});
```

### `resolveAggregationFn`

Maps a user-facing `AggregationFnKey` to the TanStack-internal string key.

Spec : 'avg' → 'mean' (TanStack built-in name).
All other keys pass through unchanged.

Returning the string key (not a function reference) allows TanStack to
perform its own registry lookup via `aggregationFns[key]`, which is safer
than importing the registry object directly.

```ts
resolveAggregationFn(key: AggregationFnKey): TanStackAggKey
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `key` | `AggregationFnKey` | User-facing aggregation key. |

**반환** — TanStack-internal aggregation key string.

## 타입 · 인터페이스

### `AggregationColumnMeta`

Extend TanStack column meta to carry aggregation configuration.
Follows the open meta pattern (`[key: string]: unknown`) to stay compatible
with arbitrary user meta.

| 속성 | 타입 | 설명 |
|---|---|---|
| `aggregationFn?` | `AggregationFnKey \| string & object` | 집계 함수 식별자. - 내장 5종: 'sum' \| 'avg' \| 'min' \| 'max' \| 'count' (자동완성 지원) - 사용자 정의: registerAggregationFn으로 등록한 임의 문자열 (string & &#123;}) 패턴: 내장 키 자동완성 유지 + 임의 문자열 허용. |

### `AggregationGridProps`

Props for the `AggregationGrid` standalone Pro component.

| 속성 | 타입 | 설명 |
|---|---|---|
| `columns` | `AggregationColumnDef<TData>[]` | Column definitions (with optional `meta.aggregationFn`). |
| `data` | `TData[]` | Row data array. |
| `emptyGroupPanelText?` | `string` | Placeholder text shown in GroupPanel when no columns are grouped. |
| `enableAggregation?` | `boolean` | When `true`, enables `getGroupedRowModel` and `getExpandedRowModel`. |
| `enableGroupSort?` | `boolean` | When `true`, enables `getSortedRowModel` and makes group header `<th>` cells clickable for column-level sorting. |
| `enableRowSelection?` | `boolean` | : enable group/hierarchy row selection — a leading checkbox column. Group rows show a tri-state checkbox (toggling selects the whole subtree via TanStack `enableSubRowSelection`; indeterminate when some-but-not-all children are selected). |
| `enableStickyGroupRows?` | `boolean` | : sticky group headers (non-virtualized path). When true, the grid body becomes a bounded scroll container (`stickyGroupMaxHeight`) and each group header sticks to the top while its children scroll under it (AG `groupRowsSticky`). Virtualization drops off-window headers, so this is the non-virtualized model; leave `enableVirtualization` off. |
| `enableVirtualization?` | `boolean` | Enable row virtualization via `@tanstack/react-virtual`. Requires `@tanstack/react-virtual` to be installed as a peer dependency. |
| `estimatedRowHeight?` | `number` | Estimated row height in pixels (used by virtualizer). |
| `expanded?` | `false \| ExpandedState` | Initial expanded state passed to TanStack Table. `false` is normalised to `{}` (TanStack's `ExpandedState` does not include `false`). Pass `true` to expand all groups. |
| `footerRowClassName?` | `string` | Additional Tailwind className for footer rows. |
| `groupChipClassName?` | `string` | Additional Tailwind className for each group chip in GroupPanel. |
| `grouping?` | `string[]` | Column ids to group by (order matters). Only applied when `enableAggregation` is `true`. |
| `groupPanelClassName?` | `string` | Additional Tailwind className for the GroupPanel container. |
| `groupRowClassName?` | `string` | Additional Tailwind className for group header rows. |
| `onExpandedChange?` | `(…) => …` | Callback fired when expanded state changes. Enables externally controlled expand/collapse. |
| `onGroupingChange?` | `(…) => …` | Callback fired when grouping state changes. Enables externally controlled grouping. |
| `onSelectionChange?` | `(…) => …` | : callback with the selected leaf rows' originals when selection changes. |
| `onSortingChange?` | `OnChangeFn<SortingState>` | Callback fired when sorting state changes. Required when `sorting` is provided (controlled mode). |
| `renderFooterRow?` | `(…) => …` | Custom footer row renderer. |
| `renderGroupRow?` | `(…) => …` | Custom group header row renderer. |
| `showFooter?` | `boolean` | Whether to show a synthetic footer row after each group's leaf rows. Footer row is only rendered when the group is expanded. |
| `showGroupAggregates?` | `boolean` | : render per-column aggregate values inline on each group HEADER row (source- aggregated via computeAggregateRow, avg-of-avgs safe; visible even when the group is collapsed). Aggregation per column comes from `meta.aggregationFn`. Independent of `showFooter`. |
| `showGroupPanel?` | `boolean` | Whether to show the GroupPanel drag-and-drop grouping bar above the grid. |
| `sorting?` | `SortingState` | Controlled sorting state (TanStack SortingState). When provided, `onSortingChange` must also be provided. |
| `stickyGroupMaxHeight?` | `number` | : max height (px) of the bounded scroll container when `enableStickyGroupRows` is on. |
| `virtualOverscan?` | `number` | Number of overscan rows for virtualization. |

### `FooterRowProps`

Props for the internal `FooterRow` component.
Renders a synthetic footer row after each group's leaf rows.

| 속성 | 타입 | 설명 |
|---|---|---|
| `cells` | `Cell<TData, unknown>[]` | Visible cells list (pass row.getVisibleCells). |
| `className?` | `string` | Additional Tailwind className for the footer row tr. |
| `renderFooterRow?` | `(…) => …` | Custom footer cell renderer. |
| `row` | `Row<TData>` | Group row Row object (aggregated cells accessed via cells prop). |

### `GroupPanelProps`

Props for the `GroupPanel` component.
Renders a drag-and-drop grouping bar above the grid.

| 속성 | 타입 | 설명 |
|---|---|---|
| `chipClassName?` | `string` | Additional Tailwind className for each chip. |
| `className?` | `string` | Additional Tailwind className for the panel container. |
| `columns` | `Column<TData, unknown>[]` | All visible columns (used to resolve column labels). |
| `emptyText?` | `string` | Placeholder text shown when no columns are grouped. |
| `grouping` | `string[]` | Current grouping column id list (order matters). |
| `onGroupingChange` | `(…) => …` | Callback fired when the grouping list changes. |

### `GroupRowProps`

Props for the internal `GroupRow` component.
Renders a grouped header row with expand/collapse toggle.

| 속성 | 타입 | 설명 |
|---|---|---|
| `aggSpec?` | `AggregateSpec` | : inline group-header aggregates. When both `aggSpec` and `leafColumns` are provided, GroupRow renders per-column cells (grouping column = toggle+key+count; columns in `aggSpec` = source-aggregated value via computeAggregateRow over `row.getLeafRows` — avg-of-avgs safe for nested groups; others = blank) instead of the single colSpan label cell. Visible even when the group is collapsed (the header row always renders). |
| `className?` | `string` | Additional Tailwind className for the group row tr. |
| `columnCount` | `number` | Column count for colspan calculation. |
| `indentUnit?` | `number` | Indent unit (default: 4) — Tailwind pl-&#123;depth * indentUnit}. |
| `leafColumns?` | `readonly { … }[]` | : visible leaf columns (id + data field) for per-column inline aggregate rendering. |
| `renderGroupRow?` | `(…) => …` | Custom renderer — if provided, replaces default render (group key + count + toggle icon). |
| `row` | `Row<TData>` | Group row Row object (row.getIsGrouped === true guaranteed). |
| `showSelect?` | `boolean` | : render a group selection checkbox (checked = all sub-rows selected, indeterminate = some selected; toggling selects/deselects the whole subtree via TanStack enableSubRowSelection). In the colSpan path it prepends a checkbox cell; in the inline-aggregate path it fills the `__select__` column position. |
| `sticky?` | `boolean` | : sticky group header. When true, the group row's cells get inline `position: sticky; top: 0` (inline — Tailwind classes are inert in the bounded scroll harness, P27-1) so the header stays pinned while its children scroll under it. Applied to the `<td>`s (not the `<tr>`) because `position: sticky` on a `<tr>` does not engage under `border-collapse`. |

### `AggregateSpec`

컬럼 → 집계 함수 키.

```ts
type AggregateSpec = Record<string, AggregationFnKey>
```

### `AggregationColumnDef`

Column definition used with `AggregationGrid`.
Identical to `ColumnDef<TData>` but with typed `meta`.

```ts
type AggregationColumnDef = ColumnDef<TData> & { … }
```

### `AggregationFnKey`

User-facing aggregation function identifier.

```ts
type AggregationFnKey = "sum" | "avg" | "min" | "max" | "count"
```

### `TanStackAggKey`

Aggregation function keys that TanStack Table v8 accepts natively.
'mean' is TanStack's internal name; our public API exposes 'avg'.

```ts
type TanStackAggKey = "sum" | "mean" | "min" | "max" | "count"
```

## 상수

### `BUILT_IN_AGGREGATION_KEYS`

The 5 built-in aggregation function keys supported by AggregationGrid.
Use this for runtime guards and autocomplete hints.

```ts
const BUILT_IN_AGGREGATION_KEYS: ReadonlyArray<AggregationFnKey>
```

