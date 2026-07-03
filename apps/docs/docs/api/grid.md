---
title: "@topgrid/grid"
sidebar_label: "grid"
sidebar_position: 1
---

# @topgrid/grid

> Meta package — aggregates all @topgrid/grid-* packages (MIT + Pro facade) · **상용 (EULA)**

:::info 자동 생성
이 페이지는 소스 코드의 TSDoc 주석에서 자동 생성됩니다(내부 표식 정제). 큐레이트된 시작용 요약은 [API 레퍼런스](../api-reference) 참고.
:::

총 **491개** public export — 함수 138 · 훅 21 · 컴포넌트 59 · 타입 264 · 상수 9.

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

### `AvatarCell`

Avatar cell — image with initials fallback ( handles broken src by
swapping to the initials chip via onError state).

```ts
AvatarCell(__namedParameters: AvatarCellProps): Element
```

### `BaseGrid`

`BaseGrid` — DEPRECATED alias of `<Grid>` ( props mapping).

AS-IS legacy `BaseGrid` 의
sort+filter ALWAYS wiring + pagination conditional 패턴을 유지.

```ts
BaseGrid(props: BaseGridProps<TData>): Element
```

### `ButtonCell`

Button cell — small action button suitable for grid action columns.

Click handler stops propagation so it never triggers a row click (L0
pattern preserved). Variant Tailwind classes equal the L0 mapping with
renamed keys ( — no visual change).

When both `value` and `label` are undefined, renders an empty `<button>`
(new behaviour — previously impossible since `label` was required; spec §5.1 fallback).

```ts
ButtonCell(__namedParameters: ButtonCellProps): Element
```

### `ChangeTrackingGrid`

```ts
ChangeTrackingGrid(props: ChangeTrackingGridProps<TData> & { … }): ReactElement
```

### `ChartCard`

RangeChart wrapped with an interactive type-switcher toolbar.

The toolbar buttons use inline styles (not Tailwind) so they are testable in the Tailwind-less
storybook harness (P27-1) and visibly reflect the active type via `aria-pressed`. Clicking a
button re-renders the chart with the new `type` — the chart shape genuinely changes
(`data-chart-type`), which is the non-vacuous claim the gate checks.

```ts
ChartCard(__namedParameters: ChartCardProps): Element
```

### `CheckCell`

Checkbox cell — wraps a native `<input type="checkbox">` centred inside
a flex container (L0 markup preserved). Both onClick and onChange call
stopPropagation so they never bubble to the grid row click handler.

```ts
CheckCell(__namedParameters: CheckCellProps): Element
```

### `ColumnPinGrid`

```ts
ColumnPinGrid(props: ColumnPinGridProps<TData>): Element
```

### `ContextMenuGrid`

```ts
ContextMenuGrid(props: ContextMenuGridProps<TData> & { … }): ReactElement
```

### `DataMapCell`

DataMapCell&lt;TData>: TanStack CellContext 수신 → column.dataMap.getDisplay(value) → 레이블 렌더.

- 정적 dataMap: column.columnDef.dataMap가 DataMap 인스턴스
- 함수형 dataMap: column.columnDef.dataMap(row.original) → DataMap 인스턴스
- getDisplay 결과 없음(undefined) → String(value ?? '') fallback (.3)
- dataMap 미설정 시 → String(value ?? '') fallback (.1)

: TanStack CellContext 표준 API 사용
: no any (DataMapColumnDef&lt;TData> 타입 캐스팅 — DataMap 전용 확장 필드 접근용)
: 가상화 호환 — resolveDataMap + getDisplay 모두 O(1)

```ts
DataMapCell(info: CellContext<TData, unknown>): Element
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `info` | `CellContext<TData, unknown>` | TanStack CellContext&lt;TData, unknown> (createColumns.ts L128-130 패턴) |

**반환** — span 엘리먼트 — 레이블 텍스트 또는 fallback

### `DataMapEditor`

DataMapEditor&lt;TItem>: 편집 셀 필터-타이핑 드롭다운 컴포넌트.

- 마운트 시 input에 자동 포커스
- 타이핑 → items 필터링 (대소문자 무관, IME 조합 중 필터 억제)
- 드롭다운: absolute z-50 bg-white border border-gray-200 rounded shadow-md max-h-48 overflow-y-auto
- 키보드: ArrowDown/Up 이동, Enter 선택, Escape 취소
- ARIA: role="combobox" + aria-expanded + role="listbox" + role="option"
- highlightedIndex: filtered.length 변경 시 -1 리셋 (spec Section 11.2 risk #4)
- isComposing: useRef&lt;boolean> 사용 — setState 불필요 (spec Section 11.2 risk #3)

: DataMapEditorProps&lt;TItem> 표준 API (spec Section 3.1)
: no any — TItem 제네릭 상한
: Tailwind CSS only
: getItems + Array.filter — O(n), 가상화 호환

```ts
DataMapEditor(props: DataMapEditorProps<TItem>): Element
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `props` | `DataMapEditorProps<TItem>` | DataMapEditorProps&lt;TItem> |

**반환** — 입력 필드 + 조건부 드롭다운 컨테이너

### `DateCell`

Date/time cell renderer with locale-aware formatting.

Uses formatDateTimeFromDateTimeString (extracted from L0 inline
toLocaleDateString + FORMAT_OPTIONS pattern). Returns dash for empty/invalid.

```ts
DateCell(__namedParameters: DateCellProps): Element
```

### `DateFilter`

날짜 범위 필터 컴포넌트.

FilterPopover + FilterIndicator를 재사용하여 from/to DatePicker를 렌더.
`column.setFilterValue` 로 TanStack Table 필터링을 트리거.

```ts
DateFilter(__namedParameters: DateFilterProps<TData>): Element
```

**예시**

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

### `DragFillHandle`

```ts
DragFillHandle(__namedParameters: DragFillHandleProps<TCell>): null | ReactElement<any, string | JSXElementConstructor<any>>
```

### `DropIndicator`

드래그 drop 위치에 렌더되는 파란 수직선 인디케이터.

```ts
DropIndicator(__namedParameters: { … }): null | Element
```

### `EditableCell`

Inline editable cell with view ↔ edit mode transitions.

Markup contract (spec — absorbs L0 EditableGrid L82-126):
- View mode: `<div onClick={onStartEdit}>` showing `String(value ?? '')`.
- Edit mode (`isEditing === true`):
 - `'select'` → `<select>` with options (or `(옵션 없음)` placeholder).
 - `'textarea'` → `<textarea>` (Enter inserts newline; Tab/Blur commits).
 - default → `<input type={'text'|'number'|'date'}>`.

Keyboard handling (L0 L65-72 preserved):
- Enter → `onCommit(draft)` (except `textarea` — newline preserved).
- Escape → `onCancel`.
- Tab → `e.preventDefault` + `onCommit(draft)`.

Local `draft` state is reset to `String(value ?? '')` whenever the cell
enters edit mode (via `useEffect`), which also schedules `inputRef.focus`.
When `initialDraft` is provided, the draft is initialised to it on the first
render (lazy `useState`) and the `useEffect` reset is skipped — the typed
character is already in the input when the `<input>` mounts.

```ts
EditableCell(__namedParameters: EditableCellProps): Element
```

### `FilterIndicator`

활성 필터 인디케이터 — 파란 dot.

`column.getIsFiltered` 결과값을 isFiltered prop으로 전달.
필터 비활성 시 null 반환 (DOM 요소 없음).

```ts
FilterIndicator(__namedParameters: FilterIndicatorProps): null | Element
```

**예시**

```tsx
<FilterIndicator isFiltered={column.getIsFiltered()} />
```

### `FilterPopover`

텍스트 필터용 Popover 컨테이너.

trigger prop으로 트리거 요소를 받고, children으로 팝오버 내용을 렌더.
open/close 상태를 내부적으로 관리 (외부 제어 불필요).

```ts
FilterPopover(__namedParameters: FilterPopoverProps): Element
```

### `FilterResetButton`

필터 전체 초기화 버튼 컴포넌트.

```ts
FilterResetButton(__namedParameters: FilterResetButtonProps<TData>): Element
```

### `FiltersToolPanel`

FiltersToolPanel — unified column-filter editing surface with an active-filter count.
Callback-only (no grid state). Pro watermark composited when unlicensed (root is `relative`).

```ts
FiltersToolPanel(__namedParameters: FiltersToolPanelProps): Element
```

### `GlobalSearchInput`

전체 행 검색 입력 컴포넌트 (debounce 300ms).

```ts
GlobalSearchInput(__namedParameters: GlobalSearchInputProps<TData>): Element
```

### `Grid`

```ts
Grid(props: GridProps<TData> & { … }): ReactElement
```

### `GridPagination`

Pagination UI 컨테이너 컴포넌트.

```ts
GridPagination(__namedParameters: GridPaginationProps<TData>): Element
```

### `GroupedHeaderGrid`

Legacy self-contained grid component with grouped multi-row headers.

Delegates header rendering to `MultiRowHeader` from `@topgrid/grid-pro-header`.
tbody and pagination are ported verbatim from AS-IS L0.

```ts
GroupedHeaderGrid(__namedParameters: GroupedHeaderGridProps<TData>): Element
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

### `IconCell`

Icon cell — display an icon (with optional supporting label and click
handler). The component is library-agnostic: it accepts any ReactNode
for the icon prop ( — no external icon package dependency).

```ts
IconCell(__namedParameters: IconCellProps): Element
```

### `LinkCell`

Link cell — renders one of three forms based on :
 - `href` provided → `<a href>` (with onClick passthrough if any)
 - only `onClick` → `<button>` (L0 behaviour preserved)
 - neither → `<span>` (plain text or empty)

When both `value` and `label` are undefined, renders an empty `<span>` (new
behaviour — previously impossible since `label` was required; spec §5.1 fallback).

Click handlers call `e.stopPropagation` to prevent grid row click bubbling
(L0 ButtonCell/LinkCell pattern preserved).

```ts
LinkCell(__namedParameters: LinkCellProps): Element
```

### `MasterDetailGrid`

```ts
MasterDetailGrid(props: MasterDetailGridProps<TData> & { … }): ReactElement
```

### `MergingGrid`

셀 병합(rowSpan) 기능을 제공하는 Pro 그리드 컴포넌트.

`enableMerging=false`(기본값) 시 일반 그리드와 동일하게 동작.
`enableMerging=true` 시 `meta.mergeRows`가 설정된 컬럼에서 연속 행 병합.
`enableVirtualization=true` 시 @tanstack/react-virtual useVirtualizer로 대규모 데이터 렌더링.

```ts
MergingGrid(props: MergingGridProps<TData>): Element
```

**예시**

```ts
// 기본 사용 (G-001)
<MergingGrid data={rows} columns={columns} enableMerging />
```

### `MultiFilter`

컬럼당 복합(AND/OR) 필터 빌더 — 2 조건 행.

```ts
MultiFilter(variant: { … }): Element
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `variant` | `{ … }` | 'text'(contains 등) \| 'number'(=,>,… ). column.filterFn 은 각각  `multiTextFilterFn` / `multiNumberFilterFn` 으로 등록되어야 한다. |

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

### `NumberCell`

Numeric cell renderer with locale-aware formatting + optional unit + optional negative color.

Uses formatNumberString (extracted from L0 inline toLocaleString pattern).

```ts
NumberCell(__namedParameters: NumberCellProps): Element
```

### `NumberFilter`

숫자 필터 UI — 7가지 연산자 select + 조건부 input + clear 버튼.

`FilterPopover` + `FilterIndicator`를 조합한 메인 컴포넌트 ( 재사용).
`column.setFilterValue`로 TanStack columnFilters에 연결.
디바운스 300ms (Section 4.6).
between 연산자: min/max 두 input 조건부 렌더 (, Section 5.3).

```ts
NumberFilter(__namedParameters: NumberFilterProps<TData>): Element
```

**예시**

```tsx
// columnDef header에 렌더:
header: ({ column }) => (
  <div className="flex items-center gap-1">
    <span>가격</span>
    <NumberFilter column={column} defaultOperator="=" />
  </div>
),
filterFn: numberFilterFn,
```

### `NumberFloatingFilter`

숫자 floating 필터 — always-visible 입력 1개. 연산자 `=`(정확히 일치) 고정, 300ms 디바운스 후
`NumberFilterValue` set(빈 값=해제). `filterFn: numberFilterFn` 컬럼에 사용.

```ts
NumberFloatingFilter(__namedParameters: { … }): Element
```

### `PageSizeSelect`

```ts
PageSizeSelect(props: PageSizeSelectProps): ReactNode
```

### `PivotGrid`

`PivotGrid` — declarative 2-D pivot table over grid-core `<Grid>`.

```ts
PivotGrid(__namedParameters: PivotGridProps<TData>): Element
```

**예시**

```tsx
<PivotGrid
  data={sales}
  config={{
    rows: ['region'],
    columns: ['quarter'],
    values: [{ field: 'sales', aggregationFn: 'sum' }],
  }}
/>
```

### `PivotPanel`

`PivotPanel` — drag fields between Available / Rows / Columns / Values to
configure a pivot. Pair it with a `<PivotGrid>` driven by the same `config`
state so dropping a field re-pivots the grid.

```ts
PivotPanel(__namedParameters: PivotPanelProps): ReactElement
```

### `ProgressCell`

Progress cell — Tailwind track + bar (h-2 rounded) with optional percent
label. Bar width uses a dynamic `style={{ width }}` value (spec
deviation: Tailwind JIT arbitrary widths cannot be runtime-driven).

```ts
ProgressCell(__namedParameters: ProgressCellProps): Element
```

### `RangeChart`

Built-in cartesian range chart — pure SVG, zero chart-library dependency (/AP-001).

Layout/scaling is delegated to computeChartGeometry (the node-tested core); this
component turns the computed pixel coordinates into `<rect>`/`<polyline>`/`<polygon>`/axis
elements, plus an in-SVG legend and hover tooltip (kept INSIDE the `<svg>` — no HTML overlay —
to stay consistent with the pure-SVG decision and avoid a wrapper-positioning refactor).

```ts
RangeChart(__namedParameters: RangeChartProps): Element
```

### `RangeChartPanel`

Range chart panel — renders an injected chart for one or more numeric series.

This package bundles no charting library; the caller supplies `renderChart`
(adapter injection, / AP-001). Without a valid Pro license a watermark
is composited over the panel (the root is `relative` so the absolutely
positioned `<Watermark>` anchors to it).

```ts
RangeChartPanel(__namedParameters: RangeChartPanelProps): Element
```

### `RangeSelectGrid`

RangeSelectGrid — 5-hook 완전 통합.

 Rules of Hooks: 5개 hook 전부 무조건 호출.
 enable* = behavior gate (not hook invocation gate).
 onKeyDown 합성: editKeyDown → navKeyDown → clipKeyDown.

```ts
RangeSelectGrid(props: RangeSelectGridAllProps<TData, TCell>): ReactElement
```

**예시**

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

### `RowGroupPanel`

RowGroupPanel — the drag-and-drop grouping bar.

REUSE: all grouping behaviour (HTML5 drag, chips, remove) is delegated to the
agg `GroupPanel`; this wrapper only composites the Pro watermark. The root is
`relative` so the absolutely positioned `<Watermark>` anchors to it.

```ts
RowGroupPanel(props: RowGroupPanelProps<TData>): Element
```

### `SelectFilter`

Excel-style 다중선택 체크박스 필터 컴포넌트.

```ts
SelectFilter(__namedParameters: SelectFilterProps<TData>): Element
```

### `SheetGrid`

```ts
SheetGrid(__namedParameters: SheetGridProps): Element
```

### `SideBar`

SideBar — accordion container for tool panels. One section open at a time; clicking an open
section's header collapses it. Pro watermark composited when unlicensed (root is `relative`).

```ts
SideBar(__namedParameters: SideBarProps): Element
```

### `SortBadge`

다중 정렬 우선순위 배지 — grid-core canonical source.

```ts
SortBadge(__namedParameters: SortBadgeProps): null | Element
```

### `SortClearButton`

현재 정렬 상태를 전부 지우는 버튼.
`onClear` 콜백에 `table.setSorting([])` 를 연결하여 사용.

```ts
SortClearButton(__namedParameters: SortClearButtonProps): Element
```

**예시**

```ts
<SortClearButton onClear={() => table.setSorting([])} />
```

**참고** — `SortClearButtonProps`

### `SparklineCell`

Sparkline cell — compact inline SVG chart for a numeric series.

Library-agnostic and zero-dependency: the chart is drawn with native SVG
`<polyline>`/`<polygon>`/`<rect>` elements, so no charting peer is required
( / AP-001 — the package imports no chart library).

```ts
SparklineCell(__namedParameters: SparklineCellProps): Element
```

### `StatusBadgeCell`

Status badge cell — renders value as a Tailwind rounded-full chip
coloured by colorMap (or a 7-state default).

Equivalent to the legacy `BadgeCell`;
the shim there re-exports this component under the legacy name ( alias).

```ts
StatusBadgeCell(__namedParameters: StatusBadgeCellProps): Element
```

### `StatusBar`

StatusBar — a horizontal bar of `label: value` segments.

Pure prop-driven UI: the consumer passes whatever `items` it wants to surface
(selection counts, aggregate summaries, etc.). It composites no grid. Without
a valid Pro license a watermark is composited over the bar (the root is
`relative` so the absolutely positioned `<Watermark>` anchors to it).

```ts
StatusBar(__namedParameters: StatusBarProps): Element
```

### `TagCell`

Tag cell — renders a flex-wrap row of tag chips. Used for multi-valued
label columns (e.g. priority tags, category tags). Each chip's colour
comes from colorMap or defaults to neutral gray.

```ts
TagCell(__namedParameters: TagCellProps): Element
```

### `TextCell`

Plain text cell renderer with null/empty dash placeholder.

Distinguishes empty (null/undefined/'') from falsy zero — `0` renders as "0".

```ts
TextCell(__namedParameters: TextCellProps): Element
```

### `TextFilter`

텍스트 필터 UI — 연산자 select + 값 input + clear 버튼.

`FilterPopover` + `FilterIndicator`를 조합한 메인 컴포넌트.
`column.setFilterValue`로 TanStack columnFilters에 연결.
디바운스 300ms (Section 4.5).

```ts
TextFilter(__namedParameters: TextFilterProps<TData>): Element
```

**예시**

```tsx
// columnDef header에 렌더:
header: ({ column }) => (
  <div className="flex items-center gap-1">
    <span>이름</span>
    <TextFilter column={column} defaultOperator="contains" />
  </div>
),
filterFn: textFilterFn,
```

### `TextFloatingFilter`

텍스트 floating 필터 — always-visible 입력 1개. 연산자 `contains` 고정(기존 값의 연산자는 보존),
300ms 디바운스 후 `TextFilterValue` set(빈 값=해제). `filterFn: textFilterFn` 컬럼에 사용.

```ts
TextFloatingFilter(__namedParameters: { … }): Element
```

### `ToolPanel`

ToolPanel — a declarative column visibility / order control surface.

A checkbox per column toggles visibility (`onVisibilityChange`); optional
up/down buttons request a reorder (`onReorder`). The panel holds no column
state machine of its own — it emits callbacks the consumer applies to its
grid-core `columnVisibility` / `columnOrder` state. It composites no grid.

Without a valid Pro license a watermark is composited over the panel (the
root is `relative` so the absolutely positioned `<Watermark>` anchors to it).

```ts
ToolPanel(__namedParameters: ToolPanelProps): Element
```

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

### `Watermark`

Pro 라이선스가 없을 때 그리드 위에 표시되는 워터마크 컴포넌트.

`required=false` 이면 `null` 반환 (렌더링 없음).

```ts
Watermark(__namedParameters: WatermarkProps): null | ReactElement<any, string | JSXElementConstructor<any>>
```

## 훅 (Hooks)

### `useCellComments`

셀 코멘트 + storage 영속 훅 — (AC ③).

마운트 시 storage 에서 hydrate, 변경 시 persist(버전 봉투). SSR/storage 비가용 시 in-memory
no-op(throw 없음). 순수 직렬화/키 로직은 `./commentStore`([[commentStore]], node 검증).

```ts
useCellComments(options: UseCellCommentsOptions): CellCommentsAPI
```

### `useCellRange`

마우스 드래그/Shift+Click 셀 범위 선택 훅.

```ts
useCellRange(onRangeChange: (…) => …): UseCellRangeReturn
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `onRangeChange` | `(…) => …` | 범위 변경 시 호출되는 콜백. |

**반환** — 범위 state + 이벤트 핸들러 3종.

**예시**

```tsx
const { range, handleMouseDown, handleMouseEnter, handleMouseUp } =
  useCellRange((r) => console.log('range changed:', r));
```

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

### `useClipboard`

```ts
useClipboard(props: UseClipboardProps<TData, TCell>): UseClipboardReturn
```

### `useColumnDrag`

HTML5 Drag and Drop API 기반 컬럼 재정렬 hook.

```ts
useColumnDrag(props: UseColumnDragProps<TData>): UseColumnDragReturn
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `props` | `UseColumnDragProps<TData>` | UseColumnDragProps |

**반환** — UseColumnDragReturn

### `useColumnOrderPersist`

컬럼 순서를 localStorage에 저장/복원하는 hook.

- 반환: `{ saveOrder }` — useColumnDrag 내부 handleColumnOrderChange에서 호출
- mount 시: localStorage.getItem → JSON.parse → table.setColumnOrder ( 복원)
- save 방법: `saveOrder(order)` 호출 → localStorage.setItem
- 모든 localStorage 접근: adapter 가 try/catch
- SSR guard: adapter 가 처리
- QuotaExceededError: adapter 가 console.warn + silent skip

```ts
useColumnOrderPersist(__namedParameters: UseColumnOrderPersistProps<TData>): { … }
```

### `useExpandedPersistence`

Pro-tier hook — persists TanStack `ExpandedState` to Web Storage.

```ts
useExpandedPersistence(options: UseExpandedPersistenceOptions): [ExpandedState, ExpandedStateSetter]
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `options` | `UseExpandedPersistenceOptions` | Persistence options (storageKey, storageType, initialExpanded). |

**반환** — `[expanded, setExpanded]` tuple compatible with TanStack `ExpandedState`.

### `useGridState`

8개 TanStack 표준 state + setter를 한 번에 반환하는 통합 훅.

기존 variant(BaseGrid/VirtualGrid/...) 에서 각각 선언하던 5~7개의
`useState<StateType>` 호출을 1줄로 대체한다.

** 확장 (controlled/uncontrolled/initialState)**:
- `options` 미제공 시 과 동일 동작 (모든 state uncontrolled, 기본값).
- `initialState`: uncontrolled 모드에서 특정 키의 초기값 지정.
- `state`: 키 단위 controlled 모드 (`state.sorting`이 있으면 sorting controlled, 나머지 uncontrolled).
- `onStateChange(next, key)`: state 변경 시 통보 — controlled/uncontrolled 양쪽 호출.

** (controlled + initialState 동시 제공)**: `state` 제공 시 해당 키의 `initialState`는 무시됨 (controlled 우선).

```ts
useGridState(options: UseGridStateOptions<TData>): GridState<TData>
```

**반환** — `GridState<TData>` — 8 state 값 + 8 `OnChangeFn<StateType>` setter 객체.

**예시**

```ts
// G-001 호환 (파라미터 없음)
const s = useGridState<User>();

// uncontrolled + initialState (G-002)
const s = useGridState<Slip>({
  initialState: { sorting: [{ id: 'date', desc: true }], pagination: { pageIndex: 0, pageSize: 20 } },
});

// controlled mode — Redux 연동 (G-002)
const s = useGridState<Attendance>({
  state: { sorting: externalSorting },
  onStateChange: (next, key) => {
    if (key === 'sorting') dispatch(setGridSorting(next.sorting));
  },
});

// TanStack useReactTable 직접 소비
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

**G-004 확장 (resetState / resetSection / clearSelectionKey)**:
- `resetState()`: 8개 state 모두 `initialState` (or defaultValues) 로 복원.
- `resetSection(key)`: 단일 또는 배열 key 의 state 만 선택적 복원 (Set dedup 멱등).
- `options.clearSelectionKey`: 외부 트리거 (string | number) 변경 시 `rowSelection` 자동 reset.
  XxgridTable `clearSelectionKey` 패턴 흡수 (R-A). mount 시 reset 미발생 (isFirstClearRender flag).

**참고** — `- GridState`, `- UseGridStateOptions`

### `useKeyboardEdit`

useKeyboardEdit — Delete/F2/Enter/printable key 분기 hook.

```ts
useKeyboardEdit(props: UseKeyboardEditProps<TData, TCell>): UseKeyboardEditReturn
```

**반환** — `{ onKeyDown }` — Grid container에 부착할 keydown 핸들러.

**예시**

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

### `useLicenseStatus`

React hook returning the current license check result. Re-renders when the
license state changes (e.g. async `setLicenseKey` resolution).

Backed by `useSyncExternalStore` — no tearing under React 18 concurrent mode.

```ts
useLicenseStatus(): LicenseCheckResult
```

**예시**

```tsx
function MyGrid() {
  const lic = useLicenseStatus();
  return (
    <div className="relative">
      <table>{ ... }</table>
      {lic.watermarkRequired && <Watermark required />}
    </div>
  );
}
```

### `useMultiSort`

useReactTable 직접 사용자가 다중 정렬 옵션을 구성할 때 사용하는 헬퍼.

```ts
useMultiSort(opts: UseMultiSortOptions): UseMultiSortResult
```

**예시**

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

### `usePivot`

Compute a memoised PivotModel from flat data + a pivot config.

```ts
usePivot(data: TData[], config: PivotConfig): PivotModel
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `data` | `TData[]` | Flat source rows. |
| `config` | `PivotConfig` | Row/column dimensions + value (measure) definitions. |

**반환** — A memoised pivot model (recomputed when `data` or `config` change).

**예시**

```ts
const model = usePivot(rows, {
  rows: ['region'],
  columns: ['quarter'],
  values: [{ field: 'sales', aggregationFn: 'sum' }],
});
```

### `useServerSideData`

```ts
useServerSideData(datasource: ServerSideDatasource<TData>, options: UseServerSideDataOptions): UseServerSideDataResult<TData>
```

### `useServerSideTree`

```ts
useServerSideTree(datasource: ServerSideDatasource<TData>, options: UseServerSideTreeOptions): UseServerSideTreeResult<TData>
```

### `useSheet`

```ts
useSheet(): UseSheetResult
```

### `useStoragePersist`

`GridStateValues` ↔ `localStorage` / `sessionStorage` 동기화 옵션 helper.

- state 변경 시 `debounceMs`(기본 300ms) 후 storage에 저장
- mount 시 storage → state 역방향 hydration (`onHydrate` 콜백 — )
- version mismatch / parse 실패 → `removeItem` + `onHydrate` 미호출
- SSR safe (`typeof window` guard inside useEffect body — )
- 완전 준수: option 3 (eslint-disable) 0줄 (Option A saveRef 패턴 — )

```ts
useStoragePersist(state: GridStateValues<TData>, options: UseStoragePersistOptions<TData>): void
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `state` | `GridStateValues<TData>` | `useGridState` 또는 기타 소스의 `GridStateValues` |
| `options` | `UseStoragePersistOptions<TData>` | `UseStoragePersistOptions` (`storageKey` 필수) |

**예시**

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

### `useUndoRedo`

제네릭 undo/redo 명령 스택 훅 —.

동작을 수행한 뒤 그 동작의 `{undo, redo}` 명령을 `push` 한다. tracking 연산 명령은
`makeUpdateCommand`/`makeAddCommand` 로 만든다([[bindings]]). tracking 은 연산 히스토리를
노출하지 않으므로 본 스택이 외부 히스토리 역할을 한다(Option B, advisor).

명령의 부작용은 **state updater 밖**(이벤트 핸들러)에서 실행한다 — ref 가 진실, `bump` 는
재렌더만 유발(StrictMode 이중 실행 회피).

```ts
useUndoRedo(): UndoRedoAPI
```

### `useUrlSync`

`GridStateValues`의 임의 subset을 URL search params에 동기화하는 옵션 helper.

- state 변경 시 `window.history.replaceState`로 URL 갱신
- mount 시 URL → state 역방향 hydration (`onHydrate` 콜백 — )
- debounce 지원 (`debounceMs` 옵션 — `useDebouncedCallback` 재사용)
- router 라이브러리 의존 없음
- SSR safe (: `typeof window` 체크는 useEffect body 내부)

```ts
useUrlSync(state: GridStateValues<TData>, options: UseUrlSyncOptions<TData>): void
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `state` | `GridStateValues<TData>` | `useGridState` 또는 기타 소스의 `GridStateValues` |
| `options` | `UseUrlSyncOptions<TData>` | `UseUrlSyncOptions` (전부 optional) |

**예시**

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

### `useViewportRowModel`

```ts
useViewportRowModel(datasource: ViewportDatasource<TData>, options: UseViewportRowModelOptions): UseViewportRowModelResult<TData>
```

### `useWatermarkEnforcement`

Void registration hook for license watermark enforcement via a singleton
portal mounted at `document.body`.

- Each mount increments a module-level ref-count.
- First mount creates the singleton portal + React root.
- License state changes (`setLicenseKey`) re-render the portal via
 `subscribeLicense`.
- Last unmount (ref-count → 0) tears down the portal.

Use case: per-cell renderers (e.g. `DataMapCell`) where the component
itself has no host DOM suitable for wrapper-based watermarking.

SSR-safe: portal setup is skipped when `document` is undefined.

```ts
useWatermarkEnforcement(): void
```

**예시**

```tsx
export function DataMapCell(info) {
  useWatermarkEnforcement(); // void — no return value
  return <span>{...}</span>;
}
```

## 함수

### `acceptBlock`

Accept a block response. **Rejected (state unchanged) if `responseEpoch !== cache.epoch`** —
the request was issued for a query that has since been invalidated. On accept, the block is
stored as `loaded`; `lastRow` (when provided) sets the known total row count.

```ts
acceptBlock(cache: BlockCacheState<TData>, blockIndex: number, rows: TData[], responseEpoch: number, lastRow: number): BlockCacheState<TData>
```

### `acceptTreeBlock`

Accept a child block — **discarded unless (a) `epoch === tree.epoch` AND (b) the node still
exists** (the invariant). On accept, stores into that node's cache.

```ts
acceptTreeBlock(tree: TreeCacheState<TData>, pathKey: string, blockIndex: number, rows: TData[], epoch: number, lastRow: number): TreeCacheState<TData>
```

### `advancedGlobalFilterFn`

: TanStack `globalFilterFn` 어댑터 — global filter 값을 AdvancedFilterExpr 로 보고
**행 단위로** 평가한다(columnId 무시 = 행-레벨). `null`/`undefined` 식 → 무제약(true).

이것이 차트 cross-filter 의 **실 setFilter 배선**이다: `setGlobalFilter(selectionsToFilter(selections))`
로 차트 선택을 그리드의 `getFilteredRowModel` 에 흘려보내면 **그리드가 내부적으로 필터**한다(필터 상태가
data prop 가 아니라 테이블에 산다 — global search ✅ 와 동일 구조의 raw-table 배선).

```ts
advancedGlobalFilterFn(row: { … }, _columnId: string, filterValue: undefined | null | AdvancedFilterExpr): boolean
```

**예시**

```ts
const table = useReactTable({ data, columns, state: { globalFilter },
  onGlobalFilterChange: setGlobalFilter, globalFilterFn: advancedGlobalFilterFn,
  getColumnCanGlobalFilter: () => true, getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel() });
// chart: onSelectCategory={(i) => table.setGlobalFilter(selectionsToFilter([{ field, type, value: cats[i] }]))}
```

### `applyReducer`

Apply a pivot value reducer (built-in key OR custom `(number[]) => number`)
to a set of values.

```ts
applyReducer(reducer: AggregationFnKey | PivotValueReducer, values: number[]): null | number
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `reducer` | `AggregationFnKey \| PivotValueReducer` | An `AggregationFnKey` or a custom `PivotValueReducer`. |
| `values` | `number[]` | Raw numeric values (may contain non-finite entries). |

**반환** — The aggregated number, or `null` for an empty finite set.

### `autoSizeColumn`

Compute the content-fit width (px) for one column:
`max(measure(header),...measure(cellValues)) + padding`, clamped to
`[min, max]` when provided.

```ts
autoSizeColumn(options: AutoSizeColumnOptions): number
```

### `autoSizeColumns`

Auto-size multiple columns at once, returning a `Record<columnId, px>` width
map (consistent with TanStack's `ColumnSizingState`).

```ts
autoSizeColumns(options: AutoSizeColumnsOptions): Record<string, number>
```

### `bandScale`

Band scale over `[r0,r1]` for `count` categories. `paddingRatio` (0..1) is the fraction of each
slot left empty as gap. Bars/vertices sit at band centres, evenly spaced and symmetric within
the range.

```ts
bandScale(count: number, range: [number, number], paddingRatio: number): BandScale
```

### `blockBounds`

Half-open absolute row range `[startRow, endRow)` of a block.

```ts
blockBounds(blockIndex: number, blockSize: number): { … }
```

### `blockIndexOf`

Block index containing an absolute row index.

```ts
blockIndexOf(rowIndex: number, blockSize: number): number
```

### `buildCellClassName`

선언적 셀 룰 배열 → grid-core `CellClassNameCallback` 컴파일.

술어는 `ctx.value`(값)와 `ctx.row`(행 데이터)을 받는다(grid-core 1.0 : clean ctx).
join/undefined 규칙은 `buildRowClassName` 과 동일. 순수 함수.

```ts
buildCellClassName(rules: CellFormatRule<TData, TValue>[]): CellClassNameCallback<TData>
```

**예시**

```ts
<Grid cellClassName={buildCellClassName<Order, number>([
  { when: (v) => v < 0, className: 'text-red-600' },
])} />
```

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

### `buildPivotColumns`

Build the full `<Grid>` column set from a pivot model.

```ts
buildPivotColumns(model: PivotModel, sort: PivotSortOpts, collapse: PivotCollapseOpts, colCollapse: PivotColumnCollapseOpts): ColumnDef<PivotRow>[]
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `model` | `PivotModel` | The headless pivot model. |
| `sort` | `PivotSortOpts` |  |
| `collapse` | `PivotCollapseOpts` |  |
| `colCollapse` | `PivotColumnCollapseOpts` |  |

**반환** — Declarative `ColumnDef<PivotRow>[]` (leading row-dimension columns +  nested value column groups + grand-total group).

### `buildRowClassName`

선언적 행 룰 배열 → grid-core `RowClassNameCallback` 컴파일.

매칭되는 모든 룰의 className 을 룰 순서대로 공백 join 한다(다중 적용 허용).
매칭 0 → `undefined`(콜백 계약: 추가 없음). 순수 함수 — 부작용 없음.

```ts
buildRowClassName(rules: RowFormatRule<TData>[]): RowClassNameCallback<TData>
```

**예시**

```ts
<Grid rowClassName={buildRowClassName([
  { when: (_, i) => i % 2 === 1, className: 'bg-gray-50' },     // 줄무늬(alternating)
  { when: (d) => d.status === 'error', className: 'text-red-600' },
])} />
```

### `buildRowsCsv`

행 배열 + `ExcelColumn[]` 을 RFC 4180 CSV 문자열로 직렬화한다(헤더 1행 + 데이터 N행, CRLF 구분).

순수 함수 — Blob/DOM 비의존이라 node 단위 테스트로 실제 출력 문자열을 단언할 수 있다.
null/undefined 셀은 빈 문자열로 직렬화(EC: exportToCSV 동작과 일치).

```ts
buildRowsCsv(rows: TData[], columns: ExcelColumn[], delimiter: string): string
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `rows` | `TData[]` | 직렬화할 데이터 행 |
| `columns` | `ExcelColumn[]` | 컬럼 정의(key=행 키, header=헤더 텍스트) |
| `delimiter` | `string` | 구분자 — ',' (기본) 또는 '\t' |

### `buildRowsPdfTable`

```ts
buildRowsPdfTable(rows: TData[], columns: ExcelColumn[]): PdfTableData
```

### `buildServerPivotColumns`

Build a nested pivot-result column tree from the server's flat field keys.

```ts
buildServerPivotColumns(fields: string[], separator: string): ServerPivotColumn[]
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `fields` | `string[]` | server-generated pivot-result field keys (order = desired column order). |
| `separator` | `string` | segment delimiter within a field key (default `'\|'`). |

### `buildValidationCellClass`

선언적 검증 룰 배열 → grid-core `CellClassNameCallback<TData>` 컴파일.

`field` 가 지정된 룰만 셀 표시에 참여한다 — 해당 컬럼(`ctx.columnId === rule.field`) 셀이
위반(`!validate(row)`)이면 룰의 `className`(기본 `topgrid-cell-invalid`)을 부여한다.
 `buildCellClassName` 과 **동일 계약·동형 패턴**(선언적 룰 → 기존 콜백). 순수 함수.
grid-core 1.0 : clean ctx — `cell.column.id`→`ctx.columnId`·`cell.row.original`→`ctx.row`.

```ts
buildValidationCellClass(rules: ValidationRule<TData>[]): CellClassNameCallback<TData>
```

**예시**

```ts
<Grid cellClassName={buildValidationCellClass<Row>([
  { field: 'age', validate: (r) => r.age >= 0, message: '', className: 'border-red-500' },
])} />
```

### `buildValidator`

선언적 검증 룰 배열 → `@topgrid/grid-pro-tracking` 의 `Validator<TData>` 컴파일.

반환 validator 를 tracking `ChangeTrackingConfig.validator` 로 주입하면 tracking 이 **기존 동작**
으로 invalid 행을 `added`/`updated` 에서 제외하고 `getChangeSet.errors` 에 수집한다 — 즉
**커밋 차단은 재구현 없이 tracking 계약 재사용**([[]]). 순수 함수.

```ts
buildValidator(rules: ValidationRule<TData>[]): Validator<TData>
```

**예시**

```ts
const tracking = useChangeTracking({
  data, rowKey: 'id',
  validator: buildValidator<Row>([
    { field: 'age', validate: (r) => r.age >= 0, message: '나이는 0 이상' },
  ]),
});
```

### `cellError`

Construct an error value.

```ts
cellError(code: ErrorCode): CellError
```

### `cellValueToClipboardText`

셀 값 → 클립보드 텍스트 (순수, W1 Phase 0, grid-pro-master 에서 이관).

브라우저 `navigator.clipboard` 배선과 분리된 값→텍스트 매핑. framework-agnostic —
React copy(makeCopyCellItem)·Vue copy 어댑터가 공유한다.

매핑: null/undefined→''(빈문자, "null"/"undefined" 아님) · object(배열 포함)→JSON.stringify ·
 그 외(string/number/boolean)→String.

```ts
cellValueToClipboardText(cell: { … }): string
```

### `checkLicense`

현재 라이선스 상태를 동기 검사하여 `LicenseCheckResult`를 반환한다.

- valid=false 이면 `watermarkRequired=true`.
- 유효하고 `expiresAt`까지 60일 미만이면 `expiryWarning='soon-expiring'` + `console.warn` (1회).
- 유효하고 만료 여유가 충분하면 `{ valid: true, watermarkRequired: false }`.

```ts
checkLicense(): LicenseCheckResult
```

### `clearBlock`

Drop an in-flight block so it can be re-requested — call on a **failed** `getRows` (the
datasource contract says a rejected fetch leaves the block unloaded, re-requestable). No-op if
the epoch has since changed (invalidate already cleared it) or the block is no longer loading,
so a late failure can't disturb a fresh query.

```ts
clearBlock(cache: BlockCacheState<TData>, blockIndex: number, epoch: number): BlockCacheState<TData>
```

### `clearTreeBlock`

Drop a failed in-flight child block so it can be re-requested (epoch + node-existence guarded).

```ts
clearTreeBlock(tree: TreeCacheState<TData>, pathKey: string, blockIndex: number, epoch: number): TreeCacheState<TData>
```

### `coerceLiteral`

Coerce raw literal text → a CellValue (number / boolean / string; `""` for empty).

```ts
coerceLiteral(raw: string): CellValue
```

### `collapsePivotRows`

collapse 된 subtotal(`__id` ∈ collapsedIds)의 후손 행을 제거한 가시 행 배열. subtotal 자신은 그룹
대표로 잔존, grandTotal 불변.

```ts
collapsePivotRows(rows: readonly PivotRow[], collapsedIds: ReadonlySet<string>): PivotRow[]
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `rows` | `readonly PivotRow[]` | pivot 행(원본 `model.rows` 또는 `sortPivotRows` 결과 — 합성 체인 가능). |
| `collapsedIds` | `ReadonlySet<string>` | collapse 된 subtotal 의 `__id` 집합. |

### `commentKey`

충돌 없는 셀 코멘트 키.

```ts
commentKey(rowKey: string, columnId: string): string
```

### `compileCell`

Compile a cell's raw input: a `=`-prefixed formula (parsed + qualified + refs), else a literal.

```ts
compileCell(raw: string, ctx: CompileContext): CompiledCell
```

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

### `computeChartGeometry`

Compute the full pixel geometry for a cartesian (line/bar) chart from raw series.

- y domain is the niced range of ALL finite values across ALL series, so axis ticks land on
 round numbers and every series shares one scale (comparable).
- x is a band scale over the longest series' length.
- Non-finite values (NaN/±Infinity) keep their slot index but are omitted from `points` (a gap),
 never silently shifting later points left.

```ts
computeChartGeometry(seriesList: ChartSeries[], opts: { … }): ChartGeometry
```

### `computeColSpans`

데이터 배열과 컬럼별 colSpan 콜백을 받아 본문 셀의 가로 병합(colSpan) Map을 계산한다.

**computeMergeSpans(rowSpan)의 수평 쌍둥이 **:
행마다 컬럼을 왼쪽→오른쪽으로 순회. 어떤 셀이 colSpan=n(>1)을 선언하면 그 셀이 시작 셀이 되고
우측 n-1개 셀은 "피복(covered)"되어 skip(0)으로 표시된다. 피복된 셀 자신의 colSpan 콜백은
평가하지 않는다(**skip-of-skip** — 이미 가려진 셀은 스팬을 시작할 수 없음).

**clamp**: colSpan 이 행의 남은 컬럼 수를 초과하면 남은 수로 절단한다(행 경계 밖 스팬 방지).
비유한/1 미만 값은 1(스팬 없음)로 정규화한다.

★colSpan 은 **한 행 안에서만** 작동한다 — rowSpan(computeMergeSpans)의 행간 ancestorBoundary
전파나 L-01 orphan(시작 셀이 가상 윈도 밖으로 스크롤) 문제가 **구조적으로 없다**.

```ts
computeColSpans(rows: TData[], columns: { … }[]): ColSpanMap
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `rows` | `TData[]` | 렌더링 순서의 TData 배열 (getSortedRowModel / getFilteredRowModel 결과) |
| `columns` | `{ … }[]` | 컬럼 정보 배열 (id + 선택적 colSpan 콜백). 배열 순서 = 좌→우 = getVisibleCells 순서. |

**반환** — - 키 `${rowIdx}_${colId}` → colSpan 숫자의 Map.  >1 = 스팬 시작 셀, 0 = 피복되어 skip(MergingGrid 에서 null 반환), 1/미존재 = 일반 셀.  rows 가 빈 배열이면 빈 Map.

**예시**

```ts
// row 0 의 'b' 셀이 3컬럼(b,c,d) 스팬 → c,d 는 skip
const map = computeColSpans(
  [{ a: 1, b: 2, c: 3, d: 4, e: 5 }],
  [
    { id: 'a' },
    { id: 'b', colSpan: () => 3 },
    { id: 'c' }, { id: 'd' }, { id: 'e' },
  ]
);
// map.get('0_b') === 3 ; map.get('0_c') === 0 ; map.get('0_d') === 0
// 'a','e' 미존재(=일반 셀)
```

### `computeMergeSpans`

데이터 배열과 병합 대상 컬럼 목록을 받아 MergeSpanMap을 계산한다.

**Hierarchical ancestorBoundary 알고리즘 (ADR-)**:
단일 패스 O(N×C) — 행(i)을 순회하면서 컬럼(j)을 왼쪽에서 오른쪽 순서로 평가.
좌측 컬럼에서 경계(boundary)가 발생하면 우측 컬럼에도 강제 경계를 전파한다.
(`ancestorBoundary` 플래그 — 행 전환마다 초기화)

**Regression Invariant (ADR-)**:
`columns.length === 1` 시 좌측 컬럼이 없으므로 `ancestorBoundary`는 항상 `false`.
결과적으로 자신의 `compareFn`만 평가하며, 출력과 비트 동일한 Map을 생성한다.

```ts
computeMergeSpans(rows: TData[], columns: { … }[]): MergeSpanMap
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `rows` | `TData[]` | 렌더링 순서의 TData 배열 (getSortedRowModel / getFilteredRowModel 결과) |
| `columns` | `{ … }[]` | 병합 컬럼 정보 배열 (id + mergeRows 설정). 배열 순서 = 좌→우 = 높→낮 우선순위 (ADR-) |

**반환** — - 키 `${rowIdx}_${colId}` → rowSpan 숫자의 Map  skip 셀은 0으로 존재 (MergingGrid에서 null 반환 트리거)  rows가 빈 배열이면 빈 Map 반환

**예시**

```ts
// 단일 컬럼 — G-001과 동일 출력 (Regression Invariant)
const spanMap = computeMergeSpans(
  [{ dept: 'A' }, { dept: 'A' }, { dept: 'B' }],
  [{ id: 'dept', mergeRows: true }]
);
// spanMap.get('0_dept') === 2
// spanMap.get('1_dept') === 0
// spanMap.get('2_dept') === 1
```

### `computePivot`

The pure pivot transform — flat data → PivotModel.

Emits, in render order:
 - leaf data rows (deepest row-dimension combination),
 - per-row-group subtotal rows (one when each non-leaf row group closes),
 - a final grand-total row (all rows aggregated).

When `config.rows` is empty, a single grand-total row carries the column
aggregation. When `config.columns` is empty, every value collapses into the
grand-total column (still one cell per value-def).

```ts
computePivot(data: TData[], config: PivotConfig): PivotModel
```

### `computeReplacements`

검색 결과를 치환 패치로 변환(AC ②). ** 조합**: 반환의 `{rowKey, columnId, prior, next}` 는
`tracking.updateRow(rowKey, {[columnId]: next})` + `makeUpdateCommand(...)` 로 바로 undo 가능하게 적용된다.

`'whole'` → `next = replacement`. `'substring'` → `String(value)` 의 모든 일치를 `replacement` 로
치환(대소문자 구분 시 단순 split/join, 비구분 시 `gi` 정규식). `next` 는 항상 문자열.

```ts
computeReplacements(matches: readonly CellMatch[], query: string, replacement: string, options: FindOptions): Replacement[]
```

### `copyToClipboard`

TanStack Table 데이터를 TSV 포맷으로 클립보드에 복사한다.
TSV(탭 구분, 줄바꿈 행 구분) — Excel 붙여넣기 호환.

navigator.clipboard 미지원 환경: document.execCommand('copy') fallback 시도.
fallback도 실패 시 Error('[grid-export] copyToClipboard: Clipboard API not supported') throw.

```ts
copyToClipboard(table: Table<TData>, options: ClipboardOptions): Promise<void>
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `table` | `Table<TData>` | TanStack v8 Table&lt;TData> 인스턴스 (useReactTable 반환값) |
| `options` | `ClipboardOptions` | 클립보드 복사 옵션 (scope, emptyBehavior) |

**반환** — Promise&lt;void> — navigator.clipboard.writeText 는 async

**예시**

```ts
await copyToClipboard(table);
```

### `createAsyncDataMap`

createAsyncDataMap&lt;TItem>: AsyncDataMap 팩토리.

- DataMap&lt;TItem> 완전 구현: getDisplay, getItems, getValue
- 4-state 상태머신: idle → loading → loaded/error (Section 12)
- staleTime 기반 캐싱 + invalidate
- pendingPromise de-dupe: 동시 load 호출 시 동일 Promise 공유
- onStateChange?: 구독 콜백 등록 → 구독 해제 함수 반환 (Section 3.1)

```ts
createAsyncDataMap(options: CreateAsyncDataMapOptions<TItem>): AsyncDataMap<TItem>
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `options` | `CreateAsyncDataMapOptions<TItem>` | CreateAsyncDataMapOptions&lt;TItem> |

**반환** — AsyncDataMap&lt;TItem>

### `createBlockCache`

Create an empty cache at epoch 0.

```ts
createBlockCache(blockSize: number): BlockCacheState<TData>
```

### `createCanvasMeasureText`

Create a MeasureText backed by the browser canvas 2D API.

In a browser, returns a measurer using
`document.createElement('canvas').getContext('2d').measureText(text).width`,
applying the optional CSS `font` shorthand per call. In node/SSR (no
`document`, or no 2D context), returns the estimateTextWidth fallback.
Never throws.

```ts
createCanvasMeasureText(): MeasureText
```

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

### `createColumns`

`TopgridColumnDef<TData>[] | ColumnInfo[]` 를 받아 `ColumnDef<TData>[]` 반환.

- `type` 필드 기반 자동 renderer 분기 (rendererRegistry 조회)
- `'checkbox'` type → DisplayColumnDef (accessorKey 없음, enableSorting 강제 false)
- registry 미등록 type → plain text fallback + console.warn
- `ColumnInfo[]` 입력 시 내부에서 `TopgridColumnDef`로 narrowing
- `width`, `enableSorting`, `enableResizing`, `meta` 표준 매핑

```ts
createColumns(defs: TopgridColumnDef<TData>[] | ColumnInfo[]): ColumnDef<TData>[]
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `defs` | `TopgridColumnDef<TData>[] \| ColumnInfo[]` | column 정의 배열. `TopgridColumnDef<TData>[]` 또는 `ColumnInfo[]`. |

**반환** — TanStack `ColumnDef<TData>[]` — `useReactTable({ columns })` 에 직접 주입 가능.

**예시**

```typescript
// TopgridColumnDef 직접 사용 (권장)
const defs: TopgridColumnDef<User>[] = [
  { id: 'name', name: '이름', type: 'text', align: 'left', width: '150' },
  { id: 'salary', name: '급여', type: 'number', align: 'right', width: '120' },
  { id: 'sel', name: '', type: 'checkbox', align: 'center', width: '50' },
];
const columns = createColumns<User>(defs);

// 기존 ColumnInfo[] 호환 (AC-005)
const legacyDefs: ColumnInfo[] = [...];
const columns = createColumns(legacyDefs);
```

**참고** — `- TopgridColumnDef`, `- ColumnInfo`, `- defaultRendererRegistry`

### `createDataMap`

createDataMap&lt;TItem>: DataMap 팩토리 함수.
items 배열과 valuePath/displayPath 설정으로 DataMap 인스턴스 생성.

```ts
createDataMap(options: CreateDataMapOptions<TItem>): DataMap<TItem>
```

**예시**

```ts
const map = createDataMap({
  items: [{ code: 'A', name: '항목A' }],
  valuePath: 'code',
  displayPath: 'name',
});
map.getDisplay('A'); // '항목A'
map.getValue('항목A'); // 'A'
```

### `createServerSideController`

```ts
createServerSideController(datasource: ServerSideDatasource<TData>, options: ServerSideControllerOptions, onChange: (…) => …): ServerSideController<TData>
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `datasource` | `ServerSideDatasource<TData>` |  |
| `options` | `ServerSideControllerOptions` |  |
| `onChange` | `(…) => …` | called whenever the materialized data changes (a block resolved / invalidated).  The hook wires this to `setState`. NOT called synchronously from `ensureRange` for an  unchanged cache — so a scroll→render→onChange loop cannot form (materialize is  range-independent; placeholders exist from construction). |

### `createServerSideTreeController`

```ts
createServerSideTreeController(datasource: ServerSideDatasource<TData>, options: ServerSideTreeControllerOptions, onChange: (…) => …): ServerSideTreeController<TData>
```

### `createSheet`

```ts
createSheet(onChange: (…) => …): Sheet
```

### `createTreeCache`

```ts
createTreeCache(blockSize: number, rowGroupCols: string[]): TreeCacheState<TData>
```

### `createViewportRowModel`

Create a viewport row-model controller. Calls `datasource.init` once with push callbacks, forwards
visible ranges via `setRange`, and re-emits a materialized array whenever the datasource pushes a
count or rows (including live in-place updates).

```ts
createViewportRowModel(datasource: ViewportDatasource<TData>, options: ViewportRowModelOptions, onChange: (…) => …): ViewportRowModel<TData>
```

### `customizePivotTotals`

model.rows 에 row-total 커스터마이즈 적용(순수, 새 배열). data 행·상대 순서 보존(grandTotal 이동 제외).

```ts
customizePivotTotals(rows: readonly PivotRow[], opts: PivotTotalsOpts): PivotRow[]
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `rows` | `readonly PivotRow[]` | pivot 행(원본 `model.rows` 또는 변환 결과 — 합성 체인 가능). |
| `opts` | `PivotTotalsOpts` | PivotTotalsOpts. |

### `dateRangeFilterFn`

```ts
dateRangeFilterFn(row: Row<unknown>, columnId: string, filterValue: any, addMeta: (…) => …): boolean
```

### `deserializeComments`

버전 봉투 JSON → 코멘트 Map. `null`/파싱 실패/버전 불일치/형식 오류 → **빈 Map**(throw 없음).

```ts
deserializeComments(raw: null | string, version: number): Map<string, string>
```

### `detectSeriesStep`

```ts
detectSeriesStep(values: number[]): null | number
```

### `distributeStarWidths`

Distribute `totalWidth` across columns. Fixed columns take their px first;
the remaining width is split among star columns proportional to their factor.

Min-clamp re-distribution is ITERATIVE: when a star column's proportional
share falls below its `min`, that column is clamped to `min`, removed from the
star pool, its px subtracted from the remaining width, and the remaining star
columns are re-distributed. The loop repeats until no remaining star column
violates its `min` (clamping one column shrinks the pool and can push another
below its min — a single pass is insufficient).

Returns float px (no rounding) so ratios are exact (e.g. 133.33 / 266.67).

```ts
distributeStarWidths(options: DistributeStarWidthsOptions): Record<string, number>
```

### `ensureNode`

Create the node for `pathKey` if missing, stamped with the current global epoch.

```ts
ensureNode(tree: TreeCacheState<TData>, pathKey: string): TreeCacheState<TData>
```

### `ensureVisibleNodes`

Ensure every node referenced by the current display range exists (so its blocks can be planned).

```ts
ensureVisibleNodes(tree: TreeCacheState<TData>, displayStart: number, displayEnd: number): TreeCacheState<TData>
```

### `escapeCsvValue`

RFC 4180 §2: 구분자/큰따옴표/개행 포함 시 큰따옴표 래핑 + 내부 따옴표 이중화.
순수 string 조작 — 외부 라이브러리 0.

```ts
escapeCsvValue(value: string, delimiter: string): string
```

### `evaluate`

Evaluate a formula AST to a scalar CellValue. Errors propagate; never throws.

```ts
evaluate(ast: Ast, getCell: CellGetter): CellValue
```

### `evaluateAdvancedFilter`

: 고급 필터 식을 행에 평가(순수, 재귀). group=inert 자식 제거 후 reduce(빈/all-inert→true=무제약).

```ts
evaluateAdvancedFilter(expr: AdvancedFilterExpr, row: Record<string, unknown>): boolean
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `expr` | `AdvancedFilterExpr` | 식 트리. |
| `row` | `Record<string, unknown>` | 평가할 행(필드 record). |

### `expandRange`

Expand `A1:B2` (inclusive, order-normalized) → cell refs `[A1, A2, B1, B2]` (column-major).

```ts
expandRange(from: string, to: string): string[]
```

### `exportRowsToCsv`

exportRowsToCsv — 행 배열 기반 CSV export ( 평행, `exportRowsToExcel` 의 CSV 형)

TanStack Table 인스턴스 없이 raw row array + `ExcelColumn[]` 로 CSV 파일 다운로드.
직렬화 로직(`buildRowsCsv`)은 순수 함수로 분리되어 node 테스트 가능하고, 본 함수는
BOM + Blob + a[download] 의 **브라우저 전용** 다운로드 래퍼다.

```ts
exportRowsToCsv(rows: TData[], columns: ExcelColumn[], options: ExportRowsCsvOptions): void
```

**예시**

```ts
exportRowsToCsv(rows, columns, { fileName: '데이터.csv' });
exportRowsToCsv(rows, columns, { fileName: '데이터.tsv', delimiter: '\t' });
```

### `exportRowsToExcel`

행 배열을 Excel 파일(.xlsx)로 다운로드한다.

TanStack `Table<TData>` 인스턴스 없이 사용 가능.
`@topgrid/grid-export` 의 `exportToExcel(table, options)` 와 평행 지원 ( 옵션 A).

```ts
exportRowsToExcel(rows: TData[], columns: ExcelColumn[], options: ExportRowsOptions): void
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `rows` | `TData[]` | 내보낼 데이터 행 배열 |
| `columns` | `ExcelColumn[]` | 컬럼 정의 배열 (key / header / width? / format?) |
| `options` | `ExportRowsOptions` | 파일명·시트명·emptyBehavior 옵션 |

**예시**

```ts
exportRowsToExcel(rows, columns, { fileName: '보고서_2026.xlsx' });
```

### `exportRowsToPdf`

exportRowsToPdf — 행 배열 기반 PDF export ( 평행, `exportToPdf` 의 row-array 형)

TanStack Table 인스턴스 없이 raw row array + `ExcelColumn[]` 로 PDF 파일 다운로드.
표 데이터 구성(`buildRowsPdfTable`)은 순수 함수로 분리(node-testable)되고, 본 함수는
jspdf + jspdf-autotable 을 optional peer 로 dynamic import 하는 **브라우저 전용** 렌더 래퍼다.

```ts
exportRowsToPdf(rows: TData[], columns: ExcelColumn[], options: ExportRowsPdfOptions): Promise<void>
```

**예시**

```ts
await exportRowsToPdf(rows, columns, { fileName: '보고서.pdf', orientation: 'l' });
```

### `exportSheetCellsToXlsx`

Build an `.xlsx` workbook from a sheet cell map and (in a browser/node) trigger a download / write.
Formula cells are written as `.f` (preserved by the lib). Returns nothing — side-effecting write.

```ts
exportSheetCellsToXlsx(cells: Record<string, string>, computed: Record<string, string | number>, fileName: string, sheetName: string): void
```

### `exportSheetCellsToXlsxBuffer`

Build an `.xlsx` workbook as a Uint8Array buffer (node-testable; no file I/O).

```ts
exportSheetCellsToXlsxBuffer(cells: Record<string, string>, computed: Record<string, string | number>, sheetName: string): Uint8Array
```

### `exportSheetsToExcel`

여러 TanStack Table 을 **하나의 Excel 워크북**(여러 시트)으로 export·다운로드한다.
( — XX Grid/DevExpress 다중 시트 export 격차 해소)

각 시트는 `exportToExcel`(단일 시트)과 동일한 빌더(`buildGridWorksheet`)를 재사용하므로
헤더 merge·scope·네이티브 숫자서식(`.z`)·컬럼 폭 동작이 단일 시트와 일관된다.

```ts
exportSheetsToExcel(sheets: ExcelSheet[], options: MultiSheetOptions): void
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `sheets` | `ExcelSheet[]` | 시트 정의 배열 (`{ name, table, scope?, columnFormats?, columnWidths? }`) |
| `options` | `MultiSheetOptions` | 파일명 옵션 |

**반환** — void (동기 — xlsx.writeFile)

**예시**

```ts
exportSheetsToExcel(
  [
    { name: '주문', table: ordersTable, columnFormats: { total: '#,##0' } },
    { name: '고객', table: customersTable, scope: 'selected' },
  ],
  { fileName: '월간보고.xlsx' },
);
```

### `exportToCSV`

TanStack Table 인스턴스를 기반으로 CSV 파일을 생성·다운로드한다.
UTF-8 BOM 포함 — 한국어 Excel 정상 표시.

```ts
exportToCSV(table: Table<TData>, options: CSVExportOptions): void
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `table` | `Table<TData>` | TanStack v8 Table&lt;TData> 인스턴스 (useReactTable 반환값) |
| `options` | `CSVExportOptions` | CSV export 옵션 (fileName, scope, delimiter, emptyBehavior) |

**반환** — void (순수 string 조작 + createObjectURL — 외부 라이브러리 0)

**예시**

```ts
// 기본 사용 (filtered 행, 쉼표 구분자)
exportToCSV(table, { fileName: '데이터.csv' });
```

### `exportToExcel`

TanStack Table 인스턴스를 기반으로 Excel(.xlsx) 파일을 생성·다운로드한다.

```ts
exportToExcel(table: Table<TData>, options: ExcelExportOptions): void
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `table` | `Table<TData>` | TanStack v8 Table&lt;TData> 인스턴스 (useReactTable 반환값) |
| `options` | `ExcelExportOptions` | Excel export 옵션 (fileName, sheetName, scope, emptyBehavior, columnFormats, columnWidths) |

**반환** — void (동기 실행 — xlsx.writeFile 동기 API)

**예시**

```ts
// 기본 사용 (filtered 행)
exportToExcel(table, { fileName: '데이터.xlsx' });
```

### `exportToPdf`

TanStack Table 인스턴스를 기반으로 PDF 파일을 생성·다운로드한다.
jspdf + jspdf-autotable을 optional peer로 dynamic import하여 사용.

```ts
exportToPdf(table: Table<TData>, options: PDFExportOptions): Promise<void>
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `table` | `Table<TData>` | TanStack v8 Table&lt;TData> 인스턴스 (useReactTable 반환값) |
| `options` | `PDFExportOptions` | PDF export 옵션 (fileName, title, scope, orientation, fontFamily, emptyBehavior) |

**반환** — Promise&lt;void> — jspdf dynamic import 후 완료

**예시**

```ts
// 기본 사용 (portrait, filtered, Helvetica)
await exportToPdf(table, { fileName: '보고서.pdf' });
```

### `extractRefs`

Cells this formula depends on (refs + expanded ranges), de-duplicated.

```ts
extractRefs(ast: Ast): string[]
```

### `fillRange`

```ts
fillRange(sourceRange: CellRange, direction: FillDirection, fillCount: number, getCellValue: (…) => …): CellUpdate<TCell>[]
```

### `filterPivotRows`

data 행만 predicate 로 필터(순수, 새 배열). subtotal/grandTotal/order 보존(true-group).

```ts
filterPivotRows(rows: readonly PivotRow[], predicate: (…) => …): PivotRow[]
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `rows` | `readonly PivotRow[]` | pivot 행(원본 `model.rows` 또는 /44 변환 결과 — 합성 체인 가능). |
| `predicate` | `(…) => …` | data 행 유지 조건(집계 셀 `row['<colKey>__<i>']` 등 접근). |

### `findMatches`

`columnIds` 컬럼에서 `query` 와 일치하는 셀을 찾는다(범위 한정 = columnIds 스코핑, AC ②).
빈 query → `[]`. `null`/`undefined` 셀 skip.

```ts
findMatches(rows: readonly TData[], getRowKey: (…) => …, columnIds: readonly string[], query: string, options: FindOptions): CellMatch[]
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `rows` | `readonly TData[]` | 검색 대상 행(예: `tracking.rows`) |
| `getRowKey` | `(…) => …` | 행→rowKey 추출(tracking 의 rowKey 와 동일) |
| `columnIds` | `readonly string[]` | 검색할 컬럼 id 목록(범위 한정) |
| `query` | `string` |  |
| `options` | `FindOptions` |  |

### `flattenTree`

The full display list (group rows + children/placeholders), in render order. Feed to `<Grid data>`.

```ts
flattenTree(tree: TreeCacheState<TData>): TreeDisplayRow<TData>[]
```

### `formatDateTimeFromDateTimeString`

Format a date/string/number/Date to a locale-aware date/datetime/time string.

Returns '' for null/undefined/empty-string/invalid-Date inputs.

```ts
formatDateTimeFromDateTimeString(value: undefined | null | string | number | Date, options: FormatDateTimeOptions): string
```

**예시**

```ts
formatDateTimeFromDateTimeString('2026-05-14', { format: 'date' }) // "2026. 05. 14."
```

### `formatNumberString`

Format a number using locale-aware thousand separators and fixed decimals.

Returns '' for null/undefined/non-finite inputs ( — explicit guard,
improving L0 inline `toLocaleString` which output the string "NaN").

Negative or non-integer `decimals` are clamped via `Math.max(0, Math.floor(...))`
to avoid Intl RangeError.

```ts
formatNumberString(value: undefined | null | number, options: FormatNumberOptions): string
```

**예시**

```ts
formatNumberString(1234.5, { decimals: 2 }) // "1,234.50"
```

### `formatSheetValue`

Format a displayed cell value by `format`. Returns `display` unchanged when `format` is undefined
or the value is non-numeric (empty / error / text).

```ts
formatSheetValue(display: string, format: SheetCellFormat): string
```

### `formatValue`

Render a CellValue for display (errors → their code, booleans → TRUE/FALSE).

```ts
formatValue(v: CellValue): string
```

### `getAggregationFn`

이름으로 registry에서 사용자 정의 집계 함수를 조회한다.
내장 5종은 별도 registry 조회가 필요 없으므로 이 함수는 사용자 정의 fn 전용.

```ts
getAggregationFn(name: string): undefined | AggregationFn<TData>
```

**반환** — 등록된 AggregationFn&lt;TData> 또는 undefined (미등록).

### `getRenderer`

Look up a registered renderer. Returns `undefined` if no renderer matches
the given type — the consumer ( createColumns) decides the
fallback behaviour (spec ).

```ts
getRenderer(type: string): undefined | CellComponent
```

### `getRowStatusClassName`

Returns the Tailwind className string for a given row status.
If `classNames` is provided, it is merged over `defaultRowStatusClassNames`
(consumer override). Returns `''` for an unknown status (defensive).

```ts
getRowStatusClassName(status: RowStatus, classNames: RowStatusClassNames): string
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `status` | `RowStatus` | RowStatus value from `row.__rowStatus`. |
| `classNames` | `RowStatusClassNames` | Optional override map (full `RowStatusClassNames` shape). |

**반환** — Tailwind className string, or `''` if status is not recognised.

### `importXlsxToSheetCells`

Parse an `.xlsx` (the first worksheet) into a sheet cell map. Formula cells become `"=…"` raws so
the sheet engine re-evaluates them; value cells stringify. Feeds `createSheet` via `setCell`.

```ts
importXlsxToSheetCells(data: ArrayBuffer | Uint8Array<ArrayBufferLike>): Record<string, string>
```

### `invalidate`

Invalidate the whole cache (AC④) — clears all blocks and **bumps the epoch** so any in-flight
response (old epoch) is later rejected by acceptBlock. Called on sort/filter/group
change or explicit `refresh`. `rowCount` is cleared (the new query may have a different total).

```ts
invalidate(cache: BlockCacheState<TData>): BlockCacheState<TData>
```

### `invalidateTree`

Invalidate the whole tree (sort/filter/grouping change) — bump the global epoch and drop every
node's blocks; `expanded` is kept (re-fetched). Any in-flight response (old epoch) is rejected.

```ts
invalidateTree(tree: TreeCacheState<TData>): TreeCacheState<TData>
```

### `isBuiltInAggregationKey`

Runtime guard: is `key` one of the built-in aggregation keys?

Derives membership from `BUILT_IN_AGGREGATION_KEYS` (the shared vocabulary) —
never hardcodes the set or its size.

```ts
isBuiltInAggregationKey(key: string): key
```

### `isCellError`

Type guard for CellError.

```ts
isCellError(v: unknown): v
```

### `isExpanded`

```ts
isExpanded(tree: TreeCacheState<TData>, groupKeys: readonly string[]): boolean
```

### `isInRange`

```ts
isInRange(row: number, col: number, range: null | CellRange): boolean
```

### `isRowPlaceholder`

Type guard for placeholder rows from materialize.

```ts
isRowPlaceholder(row: unknown): row
```

### `linearScale`

Linear scale mapping `domain` → `range`. A flat domain (d0===d1) maps everything to the range
midpoint (so a constant series draws a centred flat line, never a divide-by-zero).

```ts
linearScale(domain: [number, number], range: [number, number]): LinearScale
```

### `makeAddCommand`

`addRow` 의 undo/redo 명령. **포착한 `key` 를 redo 시 seed 의 `rowKeyField` 에 강제 주입**한다
— 그렇지 않으면 tracking 이 redo 때 새 UUID 를 발급해 후속 스택 항목의 키 참조가 깨진다
(advisor 지적). undo = `deleteRow(key)`(added 행은 제거됨).

**제약**: 문자열 `rowKey` 필드 전용. 함수형 `rowKey` 는 커스텀 명령을 `push` 하라.

```ts
makeAddCommand(tracking: Pick<ChangeTrackingAPI<TData>, "addRow" | "deleteRow">, key: string, seed: Partial<TData>, rowKeyField: keyof TData & string): UndoRedoCommand
```

**예시**

```ts
const key = tracking.addRow(seed);
undoRedo.push(makeAddCommand(tracking, key, seed, 'id'));
```

### `makeAdvancedFilterFn`

식 → 행 predicate(소비자가 global/table 필터로 사용).

```ts
makeAdvancedFilterFn(expr: AdvancedFilterExpr): (…) => …
```

### `makeCopyCellItem`

```ts
makeCopyCellItem(opts: MakeCopyCellItemOptions): ContextMenuItem<TData>
```

### `makeDeleteCommand`

`deleteRow` 의 undo/redo 명령. undo 경로는 행이 **세션에서 추가된 행인지(`'added'`)** vs
**기존 행인지(`'existing'`)** 에 따라 다르다:
- `'added'`: undo = 포착한 행+키로 **재추가**(`addRow`), redo = `deleteRow`.
- `'existing'`: undo = `undoRow(key)`(마운트 스냅샷 복원), redo = `deleteRow`.

**한계([[]], §5.2 P23-1)**: `'existing'` 의 undo 는 *마운트 스냅샷* 복원이므로 삭제 전
세션 편집이 있었다면 그 편집은 **손실**된다(편집되지 않은 기존 행에서만 충실). 편집된 기존 행의
충실한 삭제-undo 는 tracking 의 새 seam 이 필요하다.

```ts
makeDeleteCommand(tracking: Pick<ChangeTrackingAPI<TData>, "addRow" | "deleteRow" | "undoRow">, key: string, deletedRow: TData, kind: "added" | "existing", rowKeyField: keyof TData & string): UndoRedoCommand
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `tracking` | `Pick<ChangeTrackingAPI<TData>, "addRow" \| "deleteRow" \| "undoRow">` |  |
| `key` | `string` |  |
| `deletedRow` | `TData` | `'added'` 재추가용 행 값(삭제 시점). `'existing'` 에서는 미사용. |
| `kind` | `"added" \| "existing"` | 삭제 전 행 종류. |
| `rowKeyField` | `keyof TData & string` | `'added'` 재추가 시 키 강제 주입 필드. |

### `makeExportItem`

```ts
makeExportItem(opts: MakeExportItemOptions<TData>): ContextMenuItem<TData>
```

### `makeMultiFilterFn`

base FilterFn 을 compound(AND/OR) FilterFn 으로 승격. 비활성 조건은 base.autoRemove 로 제거 후 reduce.

```ts
makeMultiFilterFn(base: FilterFn<unknown>): FilterFn<unknown>
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `base` | `FilterFn<unknown>` | 조건별 매칭 FilterFn(예: `textFilterFn`). `autoRemove` 가 있으면 비활성 조건 판별에 사용. |

### `makeUpdateCommand`

`updateRow` 의 undo/redo 명령. `priorRow` = **업데이트 직전** 행 값(patch 대상 필드의 이전
값을 포착) → undo 는 그 이전 값으로 `updateRow`.

```ts
makeUpdateCommand(tracking: Pick<ChangeTrackingAPI<TData>, "updateRow">, key: string, priorRow: TData, patch: Partial<TData>): UndoRedoCommand
```

**예시**

```ts
const prior = tracking.rows.find((r) => r.id === key)!; // 업데이트 전 값
tracking.updateRow(key, patch);
undoRedo.push(makeUpdateCommand(tracking, key, prior, patch));
```

### `markLoading`

Mark a block in-flight at the **current** epoch (the request's captured epoch is `cache.epoch`).

```ts
markLoading(cache: BlockCacheState<TData>, blockIndex: number): BlockCacheState<TData>
```

### `markTreeLoading`

Mark a node's block in-flight at the current global epoch (node must exist).

```ts
markTreeLoading(tree: TreeCacheState<TData>, pathKey: string, blockIndex: number): TreeCacheState<TData>
```

### `matchCondition`

단일 조건을 행 값에 매칭(순수, type 명시). null/blank cell → text 매칭 false. unknown op → false.

```ts
matchCondition(rowValue: unknown, type: FilterValueType, operator: FilterOperator, value: unknown): boolean
```

### `materialize`

Materialize a `totalCount`-length array (AC④ memory note): loaded indices carry their real
row, not-yet-loaded indices carry a RowPlaceholder. Pure — feeds the existing
`<Grid enableVirtualization data>` ( shape: minimal primitive on host public surface).

```ts
materialize(cache: BlockCacheState<TData>, totalCount: number): RowPlaceholder | TData[]
```

### `materializeViewport`

Pure: build a placeholder-filled array of length `rowCount` from a sparse `index → row` map.
Not-yet-pushed indices carry a RowPlaceholder (same shape as the SSRM materialize).

```ts
materializeViewport(rows: Map<number, TData>, rowCount: number): RowPlaceholder | TData[]
```

### `movePivotField`

`field` 를 `toZone` 으로 이동한 새 PivotConfig 를 반환한다(원본 불변).

```ts
movePivotField(config: PivotConfig, field: string, toZone: PivotZone): PivotConfig
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `config` | `PivotConfig` | 현재 피벗 구성. |
| `field` | `string` | 이동할 소스 필드명(`config` 의 어느 존에 있든 / 미배정이든 무방). |
| `toZone` | `PivotZone` | 대상 존. |

### `multiNumberFilterFn`

```ts
multiNumberFilterFn(row: Row<unknown>, columnId: string, filterValue: any, addMeta: (…) => …): boolean
```

### `multiTextFilterFn`

```ts
multiTextFilterFn(row: Row<unknown>, columnId: string, filterValue: any, addMeta: (…) => …): boolean
```

### `niceTicks`

"Nice" round tick values covering [min,max] with roughly `count` intervals. The returned array
starts ≤ min and ends ≥ max (the niced domain), with a round step (1/2/5 × 10ⁿ). A flat input
(min===max) returns a single tick; non-finite input returns [].

```ts
niceTicks(min: number, max: number, count: number): number[]
```

### `normalizeRange`

```ts
normalizeRange(range: CellRange): CellRange
```

### `numberFilterFn`

```ts
numberFilterFn(row: Row<unknown>, columnId: string, filterValue: any, addMeta: (…) => …): boolean
```

### `parseA1`

Parse `"A1"` → `{ col, row }` (0-based). Throws on malformed input.

```ts
parseA1(ref: string): { … }
```

### `parseColumnWidth`

Parse a column width spec.

- `'*'` → `{ kind: 'star', factor: 1 }`
- `'2*'` / `'3*'` → `{ kind: 'star', factor: 2|3 }`
- `120` / `'120px'` / `'120'` → `{ kind: 'fixed', px: 120 }`

```ts
parseColumnWidth(spec: string | number): ColumnWidthSpec
```

### `parseFormula`

Formula tokenizer + recursive-descent parser — pure, no React.

Grammar (precedence low→high): addSub → mulDiv → unary → primary.
primary = number | string | bool | "(" expr ")" | ref [":" ref] | NAME "(" args ")".
`parseFormula` takes the text **after** the leading `=`. Throws on malformed input
(the caller — compileCell — turns a parse error into an `#ERROR!` literal).

```ts
parseFormula(src: string): Ast
```

### `parseTsv`

```ts
parseTsv(tsv: string): string[][]
```

### `pathKeyOf`

Stable key for a group path. Root = `pathKeyOf([])` === `"[]"`.

```ts
pathKeyOf(groupKeys: readonly string[]): string
```

### `planBlocks`

Block indices a visible row range needs that are **not already loaded or in-flight**
(AC① — one request per block). `visibleStartRow`/`visibleEndRow` are inclusive row indices.
Returns ascending, de-duplicated, missing-only block indices.

```ts
planBlocks(cache: BlockCacheState<TData>, visibleStartRow: number, visibleEndRow: number): number[]
```

### `planTreeBlocks`

Plan the missing blocks for a visible display range (one request per node-block). Maps the
display range to per-node local ranges, then reuses `planBlocks` per node (dedup of
loaded/in-flight). Nodes must be ensured first (ensureVisibleNodes).

```ts
planTreeBlocks(tree: TreeCacheState<TData>, displayStart: number, displayEnd: number): TreeBlockRequest[]
```

### `printGrid`

TanStack Table 데이터를 새 팝업 창에 HTML 테이블로 렌더링하여 인쇄 대화상자를 연다.
순수 Web API 전용 (window.open + document.write + window.print).

팝업 차단 환경: console.warn 후 즉시 반환 ( — throw 하지 않음).
printGrid 자체는 동기 반환 (void). 실제 print 발화는 popup.onload 내에서 비동기 실행.

```ts
printGrid(table: Table<TData>, options: PrintOptions): void
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `table` | `Table<TData>` | TanStack v8 Table&lt;TData> 인스턴스 (useReactTable 반환값) |
| `options` | `PrintOptions` | 인쇄 옵션 (title, scope, orientation, emptyBehavior) |

**반환** — void

**예시**

```ts
printGrid(table);
```

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

### `registerRenderer`

Register a custom renderer under a type key. Overrides the default if the
key collides (spec — intentional behaviour for external customisation).

```ts
registerRenderer(type: string, component: CellComponent): void
```

**예시**

```ts
registerRenderer('priority', MyPriorityCell);
  createColumns([{ id: 'p', type: 'priority' }]);
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

### `selectFilterFn`

```ts
selectFilterFn(row: Row<any>, columnId: string, filterValue: any, addMeta: (…) => …): boolean
```

### `selectionsToFilter`

: 선택 목록 → 고급 필터 식. **같은 필드 OR · 다른 필드 AND**. 빈 선택 → 무제약 빈 group(true).

```ts
selectionsToFilter(selections: readonly FilterSelection[]): AdvancedFilterExpr
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `selections` | `readonly FilterSelection[]` | 선택 descriptor 목록(차트 클릭 등이 컬럼 메타로 type 을 채워 생성). |

### `serializeAst`

Serialize an Ast back to formula text (no leading `=`). Parenthesizes only where
precedence/associativity require, so `serialize(parse(x))` round-trips to an equivalent formula.
Strings re-quote (the tokenizer has no escapes, so any string it produced round-trips verbatim).

```ts
serializeAst(ast: Ast): string
```

### `serializeComments`

코멘트 Map → 버전 봉투 JSON 문자열.

```ts
serializeComments(comments: ReadonlyMap<string, string>, version: number): string
```

### `seriesFromMatrix`

Turn a labelled 2-D matrix into chart series + x categories.

Orientation decides the pivot of the data: charting a 3-region × 2-quarter matrix `'columns'`
gives one series per quarter across regions; `'rows'` gives one series per region across quarters.
Same numbers, transposed grouping — the bug this guards is silently charting the wrong axis.

```ts
seriesFromMatrix(input: MatrixInput): MatrixChartData
```

### `seriesFromPivot`

Reduce a pivot result into chart series — pure, node-testable.

★ This is the REAL pivot→chart adapter (not a hand-fed matrix): it keeps only `__kind==='data'`
rows (dropping subtotal/grandTotal), labels each by its row-dimension values, and reads each leaf
column's value cell `<leafKey>__<valueIndex>` into the matrix — then defers to
seriesFromMatrix. One measure at a time (`valueIndex`, default 0); multi-measure charting
is a caller choice (call once per index).

```ts
seriesFromPivot(model: PivotLike, opts: { … }): MatrixChartData
```

### `setLicenseKey`

Pro 패키지 전역 라이선스 등록 API.
앱 entry(main.tsx / App.tsx)에서 1회 호출.

```ts
setLicenseKey(key: string): LicenseStatus
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `key` | `string` | Base64url(pubKey).Base64url(sig).Base64url(payload) 형식 라이선스 키 |

**반환** — LicenseStatus — 즉시 반환 (동기 wrapper, 내부 비동기 검증 완료 후 상태 갱신) 주의: 반환값은 Promise 없이 즉시 사용 가능하도록 동기 API로 설계. 내부적으로 verifySignature (async) 결과를 저장. 비동기 완료 전 getLicenseState 호출 시 기본값 &#123;valid:false, reason:'invalid'} 반환.

### `setLicenseState`

```ts
setLicenseState(s: LicenseState): void
```

### `sheetRawToXlsxCell`

Pure: a sheet raw input (`"=A1+A2"` | `"10"` | `"hi"`) → an xlsx cell object.

A formula cell **must carry a cached value** (`v`) or the lib drops it on write (probe-verified),
so `computed` (the engine's displayed value, from `getDisplay`) is written as the cache. Without
it, a fallback `v: 0` keeps the formula (Excel recalculates on open). Value cells ignore `computed`.

```ts
sheetRawToXlsxCell(raw: string, computed: string | number): XlsxCell
```

### `sheetStyleToCss`

Map a SheetCellStyle to inline CSS (only set props emitted).

```ts
sheetStyleToCss(style: SheetCellStyle): CSSProperties
```

### `sizeToFit`

Scale `columns` so the resulting integer px widths sum to `containerWidth`.

Each column is scaled by `containerWidth / currentSum`, then rounded to an
integer. Rounding can leave a small leftover (the rounded sum may differ from
`containerWidth` by a few px); that leftover is assigned to the single widest
column so the final sum equals `containerWidth` exactly.

Edge cases: empty `columns` → `{}`. A current sum of 0 (all widths 0) cannot
be scaled proportionally, so the `containerWidth` is split evenly instead,
with the leftover going to the last column.

```ts
sizeToFit(options: SizeToFitOptions): Record<string, number>
```

### `sortPivotRows`

그룹(세그먼트) 내에서 data 행을 `leafKey` 값으로 정렬한 새 행 배열. subtotal/grandTotal 앵커 유지.

```ts
sortPivotRows(model: PivotModel, leafKey: string, dir: PivotSortDirection): PivotRow[]
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `model` | `PivotModel` | pivot 모델. |
| `leafKey` | `string` | 정렬 기준 값 컬럼 키(`<comboKey>__<valueIndex>` 또는 grand-total 컬럼 키). |
| `dir` | `PivotSortDirection` | 'asc' \| 'desc'. |

### `statusBarCounts`

table 에서 total/filtered/selected 카운트를 읽어 `StatusBarItem[]` 생성.

```ts
statusBarCounts(table: Table<TData>, labels: StatusBarCountLabels): StatusBarItem[]
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `table` | `Table<TData>` | TanStack `Table` 인스턴스. |
| `labels` | `StatusBarCountLabels` | 세그먼트 라벨 override(부분). |

### `stringifyTsv`

```ts
stringifyTsv(matrix: readonly readonly unknown[][]): string
```

### `subscribeLicense`

Subscribe to license state changes. Listener is invoked synchronously
after every `setLicenseState` call. Returns an unsubscribe function.

Used internally by `useLicenseStatus` (via `useSyncExternalStore`) and
by `useWatermarkEnforcement` (singleton portal re-render trigger).

```ts
subscribeLicense(listener: LicenseListener): (…) => …
```

### `textFilterFn`

```ts
textFilterFn(row: Row<unknown>, columnId: string, filterValue: any, addMeta: (…) => …): boolean
```

### `toA1`

Format `{ col, row }` (0-based) → `"A1"`.

```ts
toA1(col: number, row: number): string
```

### `toggleGroup`

Expand or collapse a group. **Expand** adds the path to `expanded` and ensures its node exists.
**Collapse** removes it from `expanded` and **purges** its node + all descendant nodes (so any
in-flight child response for them is later rejected by `acceptTreeBlock`'s node-existence check).

```ts
toggleGroup(tree: TreeCacheState<TData>, groupKeys: readonly string[]): TreeCacheState<TData>
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

### `translateFormula`

: translate a formula for a copy/fill by (dCol,dRow) cells. Relative refs shift,
absolute (`$`) axes stay fixed; a ref shifted out of bounds becomes `#REF!`. Non-formula cells
(no leading `=`) and unparseable formulas are returned verbatim (mirrors compileCell's
catch — downstream compile turns a bad formula into `#ERROR!`).

```ts
translateFormula(raw: string, dCol: number, dRow: number): string
```

### `transposePivotConfig`

rows ↔ columns 를 swap 한 새 config(values 보존). 두 번 적용 = 원본(involution).

```ts
transposePivotConfig(config: PivotConfig): PivotConfig
```

### `xlsxCellToSheetRaw`

Pure: an xlsx cell → a sheet raw input. Formula cells become `"=…"`; value cells stringify.

```ts
xlsxCellToSheetRaw(cell: XlsxCell): string
```

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

### `AsyncDataMap`

AsyncDataMap&lt;TItem>: 비동기 DataMap 인터페이스.
DataMap&lt;TItem>을 확장 — DataMapEditor/DataMapCell에 동기 DataMap과 동일하게 사용 가능.

추가 멤버:
- state: 현재 로딩 상태 (readonly)
- load: 비동기 로드 트리거 — Promise&lt;void> (이미 loading 중이면 동일 Promise 공유)
- invalidate: 캐시 무효화 → state 'idle' 리셋 → 다음 getItems 시 재로드
- onStateChange?: state 변경 콜백 등록 (DataMapEditor spinner 연동용)
 반환값 = unsubscribe 함수 (DataMapEditor useEffect cleanup 호출)

: no any — TItem 상한 유지
: onStateChange? optional — 미제공 시 undefined 체크 필수

| 속성 | 타입 | 설명 |
|---|---|---|
| `state` | `AsyncDataMapState` |  |
| `getDisplay` | `unknown` |  |
| `getItems` | `unknown` |  |
| `getValue` | `unknown` |  |
| `invalidate` | `unknown` |  |
| `load` | `unknown` |  |
| `onStateChange?` | `unknown` |  |

### `AutoSizeColumnInput`

A single column's input to autoSizeColumns.

| 속성 | 타입 | 설명 |
|---|---|---|
| `cellValues` | `string[]` |  |
| `columnId` | `string` |  |
| `header` | `string` |  |
| `max?` | `number` |  |
| `min?` | `number` |  |

### `AutoSizeColumnOptions`

Options for autoSizeColumn.

| 속성 | 타입 | 설명 |
|---|---|---|
| `cellValues` | `string[]` | Cell text values to measure. |
| `columnId` | `string` |  |
| `font?` | `string` | CSS `font` shorthand passed to `measureText` (optional). |
| `header` | `string` | Header text to measure. |
| `max?` | `number` | Upper bound (px) for the result. |
| `measureText` | `MeasureText` | Injected text-width measurer. |
| `min?` | `number` | Lower bound (px) for the result. |
| `padding?` | `number` | Padding (px) added to the widest measured text. Defaults to DEFAULT_AUTOSIZE_PADDING. |

### `AutoSizeColumnsOptions`

Options for autoSizeColumns.

| 속성 | 타입 | 설명 |
|---|---|---|
| `columns` | `AutoSizeColumnInput[]` |  |
| `font?` | `string` | CSS `font` shorthand passed to `measureText` (optional). |
| `measureText` | `MeasureText` | Injected text-width measurer (shared across all columns). |
| `padding?` | `number` | Padding (px) applied to every column. Defaults to DEFAULT_AUTOSIZE_PADDING. |

### `AvatarCellProps`

Props for AvatarCell.

New component (spec ) — displays an avatar image with an initials
fallback. When `src` is missing or fails to load, the component renders
a rounded-full chip showing initials derived from name.

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` | Additional Tailwind className appended to the root span. |
| `name` | `string` | User name. Source of initials when avatar image is unavailable. |
| `sizeClassName?` | `string` | Tailwind size class (default `'w-7 h-7'`). |
| `src?` | `string` | Avatar image URL. When undefined or load fails, initials fallback renders. |

### `BaseGridProps`

`BaseGridProps<TData>` — legacy alias 5종 공통 props 시그니처.

AS-IS legacy grid 타입과 시그니처 동일 — 패키지 내
alias 호환을 위해 신규 정의 (외부 의존 0). 본 interface 는 `legacy/BaseGrid.tsx` +
`legacy/VirtualGrid.tsx` (extends) 에서 사용.

| 속성 | 타입 | 설명 |
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

### `BlockCacheState`

Pure block-cache value. Transitions are pure functions in `./internal/blockCache` that
return a new state (never mutate). `epoch` is the query generation — bumped on
sort/filter/group change so stale in-flight responses are rejected (the SSRM invariant).

| 속성 | 타입 | 설명 |
|---|---|---|
| `blocks` | `Map<number, BlockState<TData>>` | blockIndex → state. |
| `blockSize` | `number` | Rows per block (fixed). |
| `epoch` | `number` | Query generation. Responses tagged with a stale epoch are discarded. |
| `rowCount` | `null \| number` | Known total row count (from `lastRow`), else null. |

### `BlockState`

Internal per-block state (rows present only when `loaded`).

| 속성 | 타입 | 설명 |
|---|---|---|
| `rows?` | `TData[]` |  |
| `status` | `BlockStatus` |  |

### `BuildChangeSetOptions`

| 속성 | 타입 | 설명 |
|---|---|---|
| `mapping?` | `Mapping<TData>` | Screen-to-BE field mapping. When omitted, rows pass through as a shallow clone. |
| `validator?` | `Validator<TData>` | Row-level validator. When omitted, every row passes. |

### `ButtonCellProps`

Props for ButtonCell.

Absorbs legacy ButtonCell with the variant
naming change ( — L0 `'primary' | 'danger' | 'ghost'` → spec
`'default' | 'destructive' | 'ghost'`). Visual output (Tailwind classes)
unchanged: `default`==L0 `primary`, `destructive`==L0 `danger`.

 grep at implement time: 0 hardcoded `variant='primary'|'danger'` sites
across the legacy source — direct rename safe (no codemod needed).

`value` added as preferred prop; `label` retained as deprecated alias ( amendment).

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` | Additional Tailwind className. |
| `disabled?` | `boolean` | Disabled state (L0 preserved). Default `false`. |
| `label?` | `ReactNode` |  |
| `onClick` | `(…) => …` | Click callback (L0 required, preserved). |
| `size?` | `"sm" \| "xs"` | Size token (L0 preserved). Default `'xs'`. |
| `value?` | `ReactNode` | Button label (text or arbitrary ReactNode). Preferred prop ( amendment). |
| `variant?` | `"default" \| "destructive" \| "ghost"` | Visual variant ( renamed from L0 `primary`/`danger`). Default `'ghost'`. |

### `CellCommentsAPI`

`useCellComments` 반환 표면.

| 속성 | 타입 | 설명 |
|---|---|---|
| `clear` | `(…) => …` | 전체 삭제. |
| `comments` | `ReadonlyMap<string, string>` | 현 코멘트 Map(`commentKey` → text). 렌더 간 안정 참조(미변경 시). |
| `deleteComment` | `(…) => …` | 셀 코멘트 삭제. |
| `getComment` | `(…) => …` | 셀 코멘트 조회(없으면 undefined). |
| `setComment` | `(…) => …` | 셀 코멘트 설정(빈 문자열도 저장 — 삭제는 deleteComment). |

### `CellComponentProps`

Display-mode cell component contract.

Compatible with TanStack ColumnDef.cell context (row + column) via optional
props — the registry consumer ( createColumns) supplies row/column
from the cell context when invoking the renderer via React.createElement.

| 속성 | 타입 | 설명 |
|---|---|---|
| `column?` | `Column<unknown, unknown>` | TanStack column context (optional — registry consumers pass when available). |
| `row?` | `Row<unknown>` | TanStack row context (optional — registry consumers pass when available). |
| `value` | `unknown` | Cell value resolved from the row's accessor. |

### `CellCoord`

셀 범위(range) 순수 유틸 — 정규화·포함판정·drag-fill·TSV (W1 Phase 0, grid-pro-range 에서 이관).

전부 framework-agnostic 순수 함수 + 순수 데이터 타입(좌표/사각형/방향/업데이트).
React(grid-pro-range)·Vue 범위 어댑터가 동일 math/serialization 을 공유한다. 렌더/이벤트 무관.

| 속성 | 타입 | 설명 |
|---|---|---|
| `col` | `number` |  |
| `row` | `number` |  |

### `CellError`

An error value — propagated through arithmetic and functions.

| 속성 | 타입 | 설명 |
|---|---|---|
| `error` | `ErrorCode` |  |

### `CellFormatRule`

셀 단위 조건부 서식 룰.

| 속성 | 타입 | 설명 |
|---|---|---|
| `className` | `string` | 술어 true 시 셀에 append 할 className |
| `when` | `(…) => …` | 셀 값(`cell.getValue`)과 행 데이터(`cell.row.original`)로 평가하는 술어 |

### `CellLike`

Minimal structural view of a TanStack `Cell` (it satisfies this — we read only these).

| 속성 | 타입 | 설명 |
|---|---|---|
| `column` | `{ … }` |  |
| `getValue` | `(…) => …` |  |
| `row` | `{ … }` |  |

### `CellMatch`

검색 결과 1건. `value` = 원본 셀 값(타입 보존).

| 속성 | 타입 | 설명 |
|---|---|---|
| `columnId` | `string` |  |
| `rowKey` | `string` |  |
| `value` | `unknown` |  |

### `CellRange`

| 속성 | 타입 | 설명 |
|---|---|---|
| `end` | `CellCoord` |  |
| `start` | `CellCoord` |  |

### `CellUpdate`

| 속성 | 타입 | 설명 |
|---|---|---|
| `col` | `number` |  |
| `row` | `number` |  |
| `value` | `TCell` |  |

### `ChangeSet`

Server payload shape produced by `getChangeSet` / `commitChanges`.
`errors` carries per-row mapping/validator failures with the originating row index.

| 속성 | 타입 | 설명 |
|---|---|---|
| `added` | `MappedRow[]` |  |
| `errors` | `{ … }[]` |  |
| `removed` | `MappedRow[]` |  |
| `updated` | `MappedRow[]` |  |

### `ChangeTrackingAPI`

| 속성 | 타입 | 설명 |
|---|---|---|
| `added` | `readonly TData[]` | Added rows. |
| `deleted` | `readonly TData[]` | Rows marked for deletion. |
| `edited` | `readonly OriginalSnapshot<TData>[]` | Edited rows with `__original` preserved (see OriginalSnapshot). |
| `editedCellsMap` | `ReadonlyMap<string, boolean>` | 편집된 셀 위치 맵. key = `rowKey + '_' + columnId`. editedCells config가 false면 항상 empty. ( wires) |
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

| 속성 | 타입 | 설명 |
|---|---|---|
| `data` | `TData[]` | Initial dataset. Snapshot is captured at mount. ( implements snapshot.) |
| `editedCells?` | `boolean` | 셀 단위 편집 추적 활성화. `true`로 설정 시 editedCellsMap에 편집된 셀 위치 기록. Default false. ( wires reducer) |
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

| 속성 | 타입 | 설명 |
|---|---|---|
| `alwaysMultiSort?` | `boolean` | 평범 클릭으로도 다중 정렬 누적. `enableMultiSort` 와 함께 사용. 기본은 Shift+클릭이 다중 정렬 키지만, `true` 면 **Shift 없이** 컬럼을 순차 클릭해 누적. (TanStack `isMultiSortEvent: => true` passthrough.) |
| `autoSelectFirstRow?` | `boolean` | 데이터 로드 후 첫 행 자동 선택 (default `false`). |
| `cellClassName?` | `CellClassNameCallback<TData>` | 셀별 className 생성 callback. 모든 cell 렌더 시 호출. 반환 string 은 `<td>` 의 기본 className 에 append. **canonical**: 본 callback type 은 grid-core 가 ownership. grid-renderers 는 type-only re-export. **사용 예** (publish/organizeSchedule 등가): ```tsx cellClassName={(cell) => {  if (!cell.column.id.startsWith('d')) return '';  const isSelected = cell.row.getIsSelected;  const hasValue = cell.getValue != null && cell.getValue !== '';  return [  isSelected && 'bg-indigo-100',  !isSelected && hasValue && 'bg-yellow-50',  ].filter(Boolean).join(' '); }} ``` **성능 주의**: 매 cell 렌더마다 호출 — 대용량 데이터 시 callback 내부 계산 비용 주의 (useMemo 또는 stable callback 권장). |
| `className?` | `string` | 외곽 wrapper className (Tailwind). |
| `columnOrderStorageKey?` | `string` | `persistColumnOrder=true` 시 사용할 localStorage 키. 빈 문자열(`''`) 전달 시 localStorage 접근 없음. 미지정 시 `persistColumnOrder=true` 라도 저장 skip. |
| `columnPersistence?` | `ColumnPersistenceOptions` | 컬럼 가시성 + 순서 localStorage 영속화 옵션. - 제공 시 `<ColumnVisibilityMenu>` UI 자동 렌더 + `useColumnPersistence` 활성. - 미제공(`undefined`) 시 영속화 비활성 + 메뉴 미표시 ( backward compat). - `storageKey: ''` 시 localStorage 접근 없음 (NFR-006). |
| `columnResizeMode?` | `GridColumnResizeMode` | 컬럼 리사이즈 모드 (default `'onChange'`). `enableColumnResizing=true` 일 때만 효과 발휘. |
| `columns` | `ColumnDef<TData, unknown>[]` | 컬럼 정의 (TanStack `ColumnDef`). |
| `data` | `TData[]` | Initial dataset (forwarded to `useChangeTracking`). |
| `debug?` | `boolean` | TanStack `debugTable` 옵션 노출 (default `false`). |
| `defaultColumnPinning?` | `ColumnPinningState` | 컬럼 핀 uncontrolled 초기값 (`{ left: string[]; right: string[] }`). ColumnPinGrid `pinLeft` / `pinRight` alias 매핑 진입점. |
| `defaultColumnSizing?` | `ColumnSizingState` | 컬럼 width uncontrolled 초기값 (column id → px). mount 시 internal `columnSizing` state 의 초기값으로 사용 (uncontrolled 패턴). |
| `defaultExpanded?` | `false \| ExpandedState` | `enableExpanding=true` 시 expanded state 초기값 (uncontrolled). - `true` = 전체 펼침 - `Record<string, boolean>` = 특정 row id만 펼침 - 미지정 = `{}` (전체 접힘)  — TreeGrid alias `expandAll={true}` 호환 진입점. AS-IS TreeGrid.tsx:35 `useState<ExpandedState>(initialExpandAll ? true : {})` initial seed 패턴 보존. |
| `editedCells?` | `boolean` | Toggle cell-level edit tracking. |
| `emptyState?` | `ReactNode` | 빈 결과 상태 ReactNode slot. 제공 시 `emptyText` 보다 우선 렌더 ( — slot → text → defaultText 순). |
| `emptyText?` | `string` | 빈 결과 안내 텍스트 (default `'데이터가 없습니다.'`). |
| `enableCellChangeFlash?` | `boolean` | 셀 값 변경 시 잠깐 강조(change-flash). `data` 가 바뀌면 **값이 실제로 변한 셀**(행 정체성으로 diff — 재정렬은 미강조)에 ~0.9s 배경 하이라이트. 안정적 강조를 위해 `getRowId` 를 함께 지정 권장(미지정 시 인덱스 기준 diff → 재정렬도 강조됨). |
| `enableColumnPinning?` | `boolean` | 컬럼 핀 state 활성 (default `false`). 본 은 `state.columnPinning` state 만 활성화. sticky CSS 외관은 범위. |
| `enableColumnReorder?` | `boolean` | 컬럼 드래그 재정렬 활성 (default `false`). HTML5 Drag and Drop API 기반 — 외부 dnd 라이브러리 미사용.  :. |
| `enableColumnResizing?` | `boolean` | 컬럼 리사이즈 state 활성 (default `false`). resize handle UI 는 범위. |
| `enableColumnVirtualization?` | `boolean` | 컬럼(가로) 가상화 활성. `true` 시 화면 밖 **center** 컬럼은 렌더하지 않고 좌/우 padding 셀로 가로 스크롤 폭만 유지한다 — 100+ 컬럼의 렌더 비용 절감. **핀 컬럼은 가상화 대상이 아니며 가로 스크롤과 무관하게 항상 렌더된다.** 미지정/`false` → 전 컬럼 렌더(기존 동작과 byte-identical). **v1 제약**: **flat(단일 행) 헤더 전용** — 그룹/다단 헤더(`getHeaderGroups.length > 1`)에서는 colSpan 회계 복잡도로 자동 비활성(전 컬럼 렌더). 그룹 헤더 가상화는 v2. **레이아웃**: `true` 시 `<table>` 은 `table-layout: fixed` + 전체 컬럼 폭(Σ`getSize`)으로 고정되어 컬럼이 명시 너비를 정확히 유지한다(pad px 와 정렬 일치). 부수효과로 **셀 내용이 컬럼 너비를 넘으면 잘린다(clip)** — 가상화 그리드의 정상 거동. 가로 스크롤 컨테이너는 기존 `overflow-x-auto`(또는 행 가상화의 `overflow:auto`)가 제공하므로 Tailwind 미적용 소비자는 컨테이너에 `overflow-x` 를 직접 지정해야 한다. **⚠️ 실험적**: 본문+헤더 가상화 배선 + chromium 정렬 매트릭스 완료(Commit C). off=기존과 byte-identical, SSR/미측정 시 전 컬럼 렌더(안전 fallback). |
| `enableExpanding?` | `boolean` | 행 펼침(expanding) state 활성 (default `false`) — TreeGrid 흡수. `getSubRows` 와 함께 사용. |
| `enableFilter?` | `boolean` | 컬럼 필터 활성 (default `false`) — `getFilteredRowModel` wiring. |
| `enableMultiSort?` | `boolean` | 다중 정렬 활성 (default `false`) — TanStack `enableMultiSort` 위임. |
| `enablePagination?` | `boolean` | 페이지네이션 활성 (default `false`) — `getPaginationRowModel` wiring. |
| `enableRowClickSelection?` | `boolean` | 행 본문 클릭으로 선택. `rowSelection` 이 `'single'`/`'multi'` 일 때만 동작. - plain 클릭 → 그 행만 선택(나머지 해제). ctrl/cmd+클릭 → 토글(다중 누적). (shift 범위 = ) - 기존 `onRowClick` 콜백과 **독립 공존** — 선택을 하면서 `onRowClick` 도 그대로 호출. - 체크박스 셀(`__select__`) 클릭은 `stopPropagation` 으로 이 경로를 안 탐(기존 동작 보존). |
| `enableRowPinning?` | `boolean` | 행 고정. 사용자가 데이터 행을 상/하단에 고정(`row.pin('top'\|'bottom')`). 고정 행은 sticky 로 스크롤 중 고정되고 center 행에서 제외된다. **비-가상화 전용**(가상화+핀=vN). UI 컨트롤은 `RowPinButton` 컴포넌트를 셀에 배치. |
| `enableRowReorder?` | `boolean` | 행 드래그 재정렬 활성 (default `false`). 데이터 행을 draggable 로 만들어 드롭 시 `onRowReorder(from, to)` 호출(소비자가 `moveRow(data, from, to)` 로 자기 data 적용). **정렬/필터 활성 시 자동 비활성**(표시순≠data순이라 재배열 모호) + **비-가상화 전용**(가상화 합성 = vN). HTML5 drag. |
| `enableSort?` | `boolean` | 정렬 활성 (default `false`) — `getSortedRowModel` wiring. |
| `enableVirtualization?` | `boolean` | 가상화 활성 (default `false`) — opt-in only. `true` 시 `useGridVirtualizer` wiring + tbody padding-row 패턴 적용. `false` 시 ~ markup 그대로 ( sticky/pinning 보존). |
| `floatingBottomRows?` | `TData[]` | 그리드 **하단**에 고정 표시할 소비자 공급 행 데이터. `floatingTopRows` 와 동일 규약(하단 sticky). |
| `floatingTopRows?` | `TData[]` | 그리드 **상단**에 고정 표시할 소비자 공급 행 데이터. XX Grid 의 `pinnedTopRowData` 와 동형 — 데이터 모델 *밖*의 추가 행(합계/요약 등). 컬럼 셀 렌더러(`columnDef.cell`)를 그대로 통과해 본문 행과 동일하게 표시되며, 본문이 스크롤돼도 `position: sticky` 로 고정된다. **집계 계산 안 함**: 소비자가 total 객체를 직접 제공(자동 집계는 `@topgrid/grid-pro-agg`/Pro). **상호작용 핀 아님**: 기존 행을 사용자가 핀하는 기능(`@topgrid/grid-pro-master`/Pro)과 별개. 미제공/빈 배열 → 렌더 없음(기존 동작 불변). |
| `getCellTooltip?` | `(…) => …` | 셀 툴팁. 셀마다 호출해 반환 문자열을 `<td title>` 로 부여(네이티브 hover 툴팁) — 잘린 내용 표시·부가 설명 등. `undefined`/`null`/`''` 반환 시 해당 셀 title 미부여. grid-core 1.0 : `(cell, row)` → `(ctx)` (clean GridCellContext). |
| `getRowId?` | `(…) => …` | 안정적 행 식별자. 미지정 시 행 키 = 배열 인덱스. 제공하면 `rowSelection`·`expanded` 등 모든 행-키 상태가 **인덱스가 아닌 이 id** 로 매겨져, 데이터 재정렬/교체를 가로질러 **동일 논리 행을 추적**(선택이 위치가 아닌 정체성을 따라감). cell 변경 flash 가 "같은 행"을 식별하는 토대. |
| `getSubRows?` | `(…) => …` | TanStack `getSubRows` — `enableExpanding=true` 시 사용. |
| `icons?` | `Partial<GridIcons>` | 정렬 표시 아이콘 glyph override(부분). 미지정은 기본(`▲▼⇅`)으로 fallback. |
| `loading?` | `boolean` | 로딩 상태. `true` 시 `<tbody>` 영역만 skeleton row 로 치환 (thead 보존 — ). |
| `loadingOverlay?` | `boolean` | 로딩 오버레이 (default `false`). `loading`(skeleton 치환)과 달리 **기존 data 행을 그대로 둔 채** 그 위에 반투명 오버레이를 덮는다(기존 데이터를 유지하며 갱신 중임을 표시). `aria-busy` + pointer-events 차단(하부 상호작용 막음). `loading`(skeleton)과 독립·additive — 둘 다 기존 동작 불변. |
| `loadingRowCount?` | `number` | 로딩 시 표시할 skeleton 행 개수. 미지정 시 `pagination.pageSize ?? 5` 로 fallback ( — BaseGrid L123 hardcoded `5` 와 호환). |
| `localeText?` | `Partial<GridLocale>` | grid chrome 문자열 현지화 — 부분 override. 미지정 키는 한국어 기본으로 fallback(raw key/undefined 안 냄). 영문화 예: `{ emptyText: 'No data', rowsPerPage: 'Rows per page:', totalCount: (n) => `$&#123;n} rows` }`. `defaultGridLocale` 를 import 해 위에 spread 도 가능. |
| `manualFiltering?` | `boolean` | Server 필터: `true` 시 클라이언트 필터 비활성(`getFilteredRowModel` skip + `manualFiltering`). default `false`. |
| `manualSorting?` | `boolean` | Server 정렬: `true` 시 클라이언트 정렬 비활성(`getSortedRowModel` skip + `manualSorting`). 정렬 *UI/state* 는 유지(헤더 클릭 → `onSortingChange`)되 실제 정렬은 서버 위임. default `false`. |
| `mapping?` | `Mapping<TData>` | Screen-to-BE mapping (optional). |
| `maxMultiSortColCount?` | `number` | 동시에 정렬 가능한 최대 컬럼 수. TanStack `maxMultiSortColCount` 에 직접 전달. 미설정 시 무제한. `enableMultiSort=false` 시 무시됨. |
| `onAddRow?` | `(…) => …` | 행 추가 콜백 — `ref.current.addRow(seed?)` 호출 시 invoke. controlled data 정책: parent 가 `props.data` 배열에 새 row append 책임. |
| `onCellClick?` | `(…) => …` | 셀 클릭 핸들러 — column-level 분기 의도 노출. grid-core 1.0 : `(cell, row, event)` → `(ctx, event)`. `ctx` 는 clean GridCellContext — `ctx.columnId`·`ctx.value`·`ctx.rowId`·`ctx.row`(=구 `row.original`). |
| `onCellKeyDown?` | `(…) => …` | 셀 키보드 이벤트 핸들러 — `<td onKeyDown>` 으로 wire. grid-core 1.0 : `(cell, row, event)` → `(ctx, event)` (clean GridCellContext). |
| `onColumnFiltersChange?` | `OnChangeFn<ColumnFiltersState>` | ColumnFilters state 변경 콜백 (server 필터 파라미터 도출용; internal state 도 갱신). |
| `onColumnOrderChange?` | `(…) => …` | 컬럼 순서 변경 완료 후 호출되는 콜백. 부모가 외부 state 동기화 가능.  : F-07-06 흡수. |
| `onColumnPinningChange?` | `OnChangeFn<ColumnPinningState>` | ColumnPinning state 변경 콜백 (외부 영속화 또는 controlled mirror 용). |
| `onColumnSizingChange?` | `OnChangeFn<ColumnSizingState>` | ColumnSizing state 변경 콜백 (외부 영속화 또는 controlled mirror 용). |
| `onDeleteRow?` | `(…) => …` | 행 삭제 콜백 — `ref.current.deleteRow(rowId)` 호출 시 invoke. `rowId` = TanStack `row.id` (default = row index string). |
| `onRowClick?` | `(…) => …` | 행 클릭 핸들러. |
| `onRowDoubleClick?` | `(…) => …` | 행 더블 클릭 핸들러 — `onRowClick` 와 동일한 시그니처 정책. |
| `onRowDragStart?` | `(…) => …` | 그리드 간 행 드래그 — 드래그 소스(default 없음=비활성). 제공 시 데이터 행이 draggable 이 되어 dragstart 시 `onRowDragStart(rowId)` 호출(`rowId` = TanStack `row.id`). 소비자가 드래그된 행 id 를 **두 그리드 위 state 로 들어올려** 보관한다(consumer-owns-payload, dataTransfer 미사용). 대상 그리드의 `onRowDrop` 과 짝. enableRowReorder 와 **별 opt-in**(같은 그리드서 혼용 금지=vN). OFF 시 byte-identical. |
| `onRowDrop?` | `(…) => …` | 그리드 간 행 드래그 — 드롭 타깃(default 없음=비활성). 제공 시 그리드 본문 영역이 drop target 이 되어(드롭 시) `onRowDrop` 호출. 소비자가 자기 `dragged` id 를 읽어 순수 `transferRow` 로 소스→타깃 data 를 적용한다. OFF 시 byte-identical. |
| `onRowReorder?` | `(…) => …` | 행 재정렬 드롭 콜백 — 표시 인덱스 `from`→`to`. 소비자가 `moveRow` 로 data 적용. |
| `onSave?` | `(…) => …` | Convenience callback — invoked with the latest ChangeSet on user demand by the consumer (the alias does NOT auto-call `commitChanges`; that is the caller's responsibility to keep the alias's network policy explicit). Forwarded out via the imperative ref handle's `getChangeSet`. |
| `onSortingChange?` | `OnChangeFn<SortingState>` | Sorting state 변경 콜백 (server 정렬 파라미터 도출용; internal state 도 갱신). |
| `onStartEditing?` | `(…) => …` | 프로그래밍적 편집 시작 콜백 — `ref.current.startEditing(rowId, colId)` 호출 시 invoke.  의 callback-delegating 패턴과 동일 정책: Grid 가 editing state 를 소유하지 않으며 application 이 EditableCell `isEditing` 갱신 책임. |
| `onUpdateRow?` | `(…) => …` | 행 부분 업데이트 콜백 — `ref.current.updateRow(rowId, patch)` 호출 시 invoke. |
| `optimistic?` | `boolean` | Optimistic update — auto-rollback on commit failure. |
| `pagination?` | `GridPaginationOptions` | 페이지네이션 세부 옵션 (`enablePagination=true` 일 때 효과). |
| `persistColumnOrder?` | `boolean` | 컬럼 순서 localStorage 영속화 활성. `true` + `columnOrderStorageKey` 지정 시 drag/keyboard 완료 후 localStorage 저장. mount 시 저장된 순서 복원 (`table.setColumnOrder`). |
| `renderFloatingFilter?` | `(…) => …` | Floating 필터 행 렌더 콜백. 지정 시 leaf 헤더행 아래 always-visible 필터 입력 행을 그린다(prop 존재=활성, `cellClassName` 관례 mirror). 컬럼당 1회 호출 — 보통 grid-features 의 floating 입력 컴포넌트(`column.setValue` 로 popover 와 동일 state 공유)를 반환. grid-core 는 구조 행 + 컬럼 윈도(가상화)·핀 sticky·ARIA 정합만 제공(grid-features 무의존=MIT). null 반환=빈 셀. grid-core 1.0 : `Column<TData,unknown>` → clean GridFilterColumn (`id`·`value`·`setValue` — TanStack 타입 없음). |
| `rowClassName?` | `RowClassNameCallback<TData>` | 행별 className 생성 callback. 모든 row 렌더 시 호출. 반환 string 은 `<tr>` 의 기본 className 에 append. **virtualization 주의**: `enableVirtualization=true` 시 `<tr ref={measureElement}>` 가 row height 측정 — `rowClassName` 이 dynamic height 변경을 유발하면 measureElement 의 reflow 가 반복 발생 (성능 저하). static className 권장. |
| `rowKey` | `keyof TData \| (…) => …` | PK extractor for change tracking. |
| `rowSelection?` | `RowSelectionMode \| GridRowSelectionOptions<TData>` | 행 선택 옵션. 단축 표기(`'multi'`) 또는 객체 표기 모두 지원. 'single'/'multi' 시 좌측 첫 컬럼에 체크박스 컬럼(`__select__`) 자동 prepend. |
| `showSortClearButton?` | `boolean` | 정렬 초기화 버튼 표시 여부. `true` 이고 `enableMultiSort=true` 일 때 툴바에 `<SortClearButton>` 렌더. 미설정(기본) 시 DOM 구조 변경 없음. |
| `sortDescFirst?` | `boolean` | 정렬 첫 클릭 방향을 내림차순으로. (TanStack `sortDescFirst` passthrough — 미지정 시 타입별 기본: 숫자=desc-first, 문자=asc-first.) |
| `theme?` | `Partial<GridTheme>` | grid chrome 색 테마(부분 override). 제공한 색만 root 에 inline `--topgrid-*` var 로 적용되고 각 surface 가 `var(--topgrid-x, <기본 hex>)` 로 읽는다. 미지정 키는 기본색 fallback. 다크 등 프리셋은 `import { darkTheme }` 후 spread. ⚠ CSS var 는 forced-colors(고대비)서 무력 (HC-safe 선택 표시는 별도 메커니즘). |
| `validator?` | `Validator<TData>` | Row validator (optional). |
| `virtualizerOptions?` | `{ … }` | `useVirtualizer` 옵션 override. - `estimateSize`: 행 높이 추정 px (default `36`, BaseGrid `<td className="px-4 py-3">` 기준). - `overscan`: viewport 위/아래 버퍼 행 수 (default `10`, VirtualGrid.tsx:102 동일). - `onChange`: virtualizer 변경 콜백(가시 범위 관찰 — SSRM 의 블록 fetch 트리거).  `useVirtualizer` 에 그대로 전달. generic passthrough(SSRM 전용 로직 0). |
| `virtualScrollHeight?` | `number` | 가상화 시 scroll container 높이 (px, default `400`). `enableVirtualization=true` 일 때만 효과 발휘. |

### `ChartCardProps`

| 속성 | 타입 | 설명 |
|---|---|---|
| `ariaLabel?` | `string` | Accessible label for the chart. Default `'chart'`. |
| `categories?` | `string[]` | Optional category labels for the x-axis (one per slot). |
| `className?` | `string` | className appended to the root `<svg>`. |
| `dock?` | `ChartDock` | : where the type/settings toolbar docks relative to the chart (composition). Inline flex (P27-1 — Tailwind inert in the harness). `'top'`/`'bottom'` stack; `'left'`/`'right'` place the toolbar beside the chart. |
| `height?` | `number` | SVG height in px. Default `200`. |
| `initialType?` | `RangeChartType` | Initial chart type. Default `'bar'`. |
| `onSelectCategory?` | `(…) => …` | (cross-filter): fired when a category slot (bar/point) is clicked, with its 0-based index. Consumers map index→category label and feed `selectionsToFilter` (`@topgrid/grid-pro-filter`) to drive a linked grid filter. When set, marks become clickable. |
| `selectedCategory?` | `null \| number` | (linked highlight): the currently-selected category index (or `null`/omitted for none). The selected slot stays full-opacity; unselected slots dim — the visual link to the grid. |
| `series` | `ChartSeries[]` | Series to plot. Each `values[i]` shares category slot `i` across series. |
| `showLegend?` | `boolean` | Show the series legend (swatch + name). Default `true`. |
| `showTooltip?` | `boolean` | Show a value tooltip on hover. Default `true`. |
| `title?` | `string` | Optional title shown at the toolbar's left. |
| `types?` | `RangeChartType[]` | Chart types offered by the toolbar switcher. Default `['bar','line','area']`. |
| `width?` | `number` | SVG width in px. Default `360`. |

### `ChartGeometry`

Computed pixel geometry for the whole chart — everything the renderer needs.

| 속성 | 타입 | 설명 |
|---|---|---|
| `plot` | `PlotArea` |  |
| `series` | `{ … }[]` |  |
| `xBand` | `BandScale` |  |
| `yScale` | `LinearScale` |  |
| `yTicks` | `number[]` |  |

### `ChartPoint`

A single plotted vertex: pixel position + the original value/category index.

| 속성 | 타입 | 설명 |
|---|---|---|
| `index` | `number` |  |
| `value` | `number` |  |
| `x` | `number` |  |
| `y` | `number` |  |

### `ChartSeries`

One input series for the chart.

| 속성 | 타입 | 설명 |
|---|---|---|
| `color?` | `string` |  |
| `name` | `string` |  |
| `values` | `number[]` |  |

### `CheckCellProps`

Props for CheckCell.

Absorbs legacy CheckCell. Markup preserved:
native `<input type="checkbox">` (NOT an icon SVG — spec ).

| 속성 | 타입 | 설명 |
|---|---|---|
| `checked` | `boolean` | Checked state (L0 L2 preserved). |
| `className?` | `string` | Additional Tailwind className appended to the rendered input. |
| `onChange?` | `(…) => …` | Change callback (L0 L3 preserved). Not invoked when `readOnly` is `true`. |
| `readOnly?` | `boolean` | Read-only mode (L0 L4 preserved). Default `false`. |

### `ClipboardOptions`

클립보드 복사 옵션

| 속성 | 타입 | 설명 |
|---|---|---|
| `emptyBehavior?` | `EmptyBehavior` | 데이터 행 0건 시 동작 - 'skip': 복사 안 함 (기본) - 'empty': 헤더만 있는 TSV 클립보드 복사 |
| `includeHeader?` | `boolean` | 헤더 행 포함 여부 - `true`: 첫 줄에 헤더 행 포함 (기본 — 기존 동작) - `false`: 데이터 행만 복사 (다른 영역에 붙여넣어 헤더 중복 방지) |
| `scope?` | `ExportScope` | export 대상 행 범위 - 'all': getCoreRowModel (필터 무시, 전체) - 'filtered': getFilteredRowModel (현재 정렬/필터 반영) ← default - 'selected': table.getSelectedRowModel (선택 행만) |

### `ColumnGroupConfig`

Config object for `createColumnGroup`.

| 속성 | 타입 | 설명 |
|---|---|---|
| `columns` | `ColumnDef<TData>[]` | Leaf (or nested group) column definitions belonging to this group. |
| `header` | `string` | The display label for the column group header. |

### `ColumnInfo`

DataTable 호환 ColumnInfo 인터페이스.

레거시 DataTable `data-table-types.ts`와 동일 shape.
신규 코드에서는 `TopgridColumnDef<TData>` 사용 권장.

`createColumns` 가 `ColumnInfo[]` 입력 시 내부에서 `TopgridColumnDef`로 narrowing:
- `type` 필드가 9종 `TopgridColumnType` union 중 하나이면 그대로 사용
- 그 외 string이면 `'text'` fallback

| 속성 | 타입 | 설명 |
|---|---|---|
| `align` | `string` | 정렬 방향 (string — 'left'\|'center'\|'right' 권장) |
| `etc?` | `string` | ColumnInfo 호환: 'primary' 포함 여부로 meta.primary 설정. 참조. |
| `id` | `string` | column accessor key |
| `name` | `string` | 표시 헤더명 |
| `type` | `string` | column 타입 (string — union 아님). `createColumns` 내부에서 `TopgridColumnType` union으로 narrowing. 9종 외 값은 'text' fallback. |
| `visibility?` | `boolean` | false이면 column 숨김. 기본 true. |
| `width` | `string` | 픽셀 단위 너비 문자열 ('100', '200' 등) |

### `ColumnPersistenceOptions`

컬럼 가시성 + 순서 localStorage 영속화 옵션.

`<Grid columnPersistence={...} />` prop 에 전달.

| 속성 | 타입 | 설명 |
|---|---|---|
| `persist?` | `PersistTarget[]` | 영속화할 state 대상 (default `['visibility', 'order']`). - `'visibility'`: 컬럼 표시/숨김 (`VisibilityState`). - `'order'`: 컬럼 순서 (`ColumnOrderState`). |
| `storageKey` | `string` | localStorage 키. 빈 문자열(`''`) 시 localStorage 접근 없음 (no-op, NFR-006). 앱 내 고유값 권장 (예: `'hr-grid-v1'`). |
| `version?` | `number` | 저장 포맷 버전 (default `1`). 컬럼 구조 변경 시 값을 올려 이전 저장 항목을 무효화. mismatch 시 기존 항목 삭제 + state 복원 skip. |

### `ColumnPinGridProps`

`ColumnPinGridProps<TData>` — AS-IS shape 보존 (ColumnPinGrid.tsx L14-26).

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` |  |
| `columns` | `ColumnDef<TData>[]` |  |
| `data` | `TData[]` |  |
| `emptyText?` | `string` |  |
| `loading?` | `boolean` |  |
| `onRowClick?` | `(…) => …` |  |
| `pagination?` | `GridPaginationOptions` |  |
| `pinLeft?` | `string[]` | 좌측 sticky pinned column id 배열 (default `[]`). |
| `pinRight?` | `string[]` | 우측 sticky pinned column id 배열 (default `[]`). |
| `rowSelection?` | `GridRowSelectionOptions<TData>` |  |

### `CommandStackState`

순수 command 스택 상태(불변).

| 속성 | 타입 | 설명 |
|---|---|---|
| `redoStack` | `readonly UndoRedoCommand[]` |  |
| `undoStack` | `readonly UndoRedoCommand[]` |  |

### `CommitOptions`

Options for `commitChanges`.

| 속성 | 타입 | 설명 |
|---|---|---|
| `autoReset?` | `boolean` | Auto `resetChanges` on success. Default `true`. |
| `fetcher?` | `(…) => …` | Custom fetcher (axios-compatible). Default `globalThis.fetch`. |
| `method?` | `string` | HTTP method. Default `'POST'`. |
| `optimistic?` | `boolean` | Override `config.optimistic` for this single call. When `true`, a failure during commit dispatches RESET (rollback of all tracked changes) before re-throwing. Default = `config.optimistic`. |

### `ContextMenuGridProps`

Props for `<ContextMenuGrid>`.

Extends `GridProps<TData>` with context menu specific props.

| 속성 | 타입 | 설명 |
|---|---|---|
| `alwaysMultiSort?` | `boolean` | 평범 클릭으로도 다중 정렬 누적. `enableMultiSort` 와 함께 사용. 기본은 Shift+클릭이 다중 정렬 키지만, `true` 면 **Shift 없이** 컬럼을 순차 클릭해 누적. (TanStack `isMultiSortEvent: => true` passthrough.) |
| `autoSelectFirstRow?` | `boolean` | 데이터 로드 후 첫 행 자동 선택 (default `false`). |
| `cellClassName?` | `CellClassNameCallback<TData>` | 셀별 className 생성 callback. 모든 cell 렌더 시 호출. 반환 string 은 `<td>` 의 기본 className 에 append. **canonical**: 본 callback type 은 grid-core 가 ownership. grid-renderers 는 type-only re-export. **사용 예** (publish/organizeSchedule 등가): ```tsx cellClassName={(cell) => {  if (!cell.column.id.startsWith('d')) return '';  const isSelected = cell.row.getIsSelected;  const hasValue = cell.getValue != null && cell.getValue !== '';  return [  isSelected && 'bg-indigo-100',  !isSelected && hasValue && 'bg-yellow-50',  ].filter(Boolean).join(' '); }} ``` **성능 주의**: 매 cell 렌더마다 호출 — 대용량 데이터 시 callback 내부 계산 비용 주의 (useMemo 또는 stable callback 권장). |
| `className?` | `string` | 외곽 wrapper className (Tailwind). |
| `columnOrderStorageKey?` | `string` | `persistColumnOrder=true` 시 사용할 localStorage 키. 빈 문자열(`''`) 전달 시 localStorage 접근 없음. 미지정 시 `persistColumnOrder=true` 라도 저장 skip. |
| `columnPersistence?` | `ColumnPersistenceOptions` | 컬럼 가시성 + 순서 localStorage 영속화 옵션. - 제공 시 `<ColumnVisibilityMenu>` UI 자동 렌더 + `useColumnPersistence` 활성. - 미제공(`undefined`) 시 영속화 비활성 + 메뉴 미표시 ( backward compat). - `storageKey: ''` 시 localStorage 접근 없음 (NFR-006). |
| `columnResizeMode?` | `GridColumnResizeMode` | 컬럼 리사이즈 모드 (default `'onChange'`). `enableColumnResizing=true` 일 때만 효과 발휘. |
| `columns` | `ColumnDef<TData, unknown>[]` | 컬럼 정의 (TanStack `ColumnDef`). |
| `contextMenuItems?` | `ContextMenuItem<TData>[]` | Array of context menu items displayed on right-click. When absent (or empty), right-click falls through to the browser default. When provided, `preventDefault` is called and the custom menu is shown. |
| `data` | `TData[]` | 행 데이터 배열. |
| `debug?` | `boolean` | TanStack `debugTable` 옵션 노출 (default `false`). |
| `defaultColumnPinning?` | `ColumnPinningState` | 컬럼 핀 uncontrolled 초기값 (`{ left: string[]; right: string[] }`). ColumnPinGrid `pinLeft` / `pinRight` alias 매핑 진입점. |
| `defaultColumnSizing?` | `ColumnSizingState` | 컬럼 width uncontrolled 초기값 (column id → px). mount 시 internal `columnSizing` state 의 초기값으로 사용 (uncontrolled 패턴). |
| `defaultExpanded?` | `false \| ExpandedState` | `enableExpanding=true` 시 expanded state 초기값 (uncontrolled). - `true` = 전체 펼침 - `Record<string, boolean>` = 특정 row id만 펼침 - 미지정 = `{}` (전체 접힘)  — TreeGrid alias `expandAll={true}` 호환 진입점. AS-IS TreeGrid.tsx:35 `useState<ExpandedState>(initialExpandAll ? true : {})` initial seed 패턴 보존. |
| `emptyState?` | `ReactNode` | 빈 결과 상태 ReactNode slot. 제공 시 `emptyText` 보다 우선 렌더 ( — slot → text → defaultText 순). |
| `emptyText?` | `string` | 빈 결과 안내 텍스트 (default `'데이터가 없습니다.'`). |
| `enableCellChangeFlash?` | `boolean` | 셀 값 변경 시 잠깐 강조(change-flash). `data` 가 바뀌면 **값이 실제로 변한 셀**(행 정체성으로 diff — 재정렬은 미강조)에 ~0.9s 배경 하이라이트. 안정적 강조를 위해 `getRowId` 를 함께 지정 권장(미지정 시 인덱스 기준 diff → 재정렬도 강조됨). |
| `enableColumnPinning?` | `boolean` | 컬럼 핀 state 활성 (default `false`). 본 은 `state.columnPinning` state 만 활성화. sticky CSS 외관은 범위. |
| `enableColumnReorder?` | `boolean` | 컬럼 드래그 재정렬 활성 (default `false`). HTML5 Drag and Drop API 기반 — 외부 dnd 라이브러리 미사용.  :. |
| `enableColumnResizing?` | `boolean` | 컬럼 리사이즈 state 활성 (default `false`). resize handle UI 는 범위. |
| `enableColumnVirtualization?` | `boolean` | 컬럼(가로) 가상화 활성. `true` 시 화면 밖 **center** 컬럼은 렌더하지 않고 좌/우 padding 셀로 가로 스크롤 폭만 유지한다 — 100+ 컬럼의 렌더 비용 절감. **핀 컬럼은 가상화 대상이 아니며 가로 스크롤과 무관하게 항상 렌더된다.** 미지정/`false` → 전 컬럼 렌더(기존 동작과 byte-identical). **v1 제약**: **flat(단일 행) 헤더 전용** — 그룹/다단 헤더(`getHeaderGroups.length > 1`)에서는 colSpan 회계 복잡도로 자동 비활성(전 컬럼 렌더). 그룹 헤더 가상화는 v2. **레이아웃**: `true` 시 `<table>` 은 `table-layout: fixed` + 전체 컬럼 폭(Σ`getSize`)으로 고정되어 컬럼이 명시 너비를 정확히 유지한다(pad px 와 정렬 일치). 부수효과로 **셀 내용이 컬럼 너비를 넘으면 잘린다(clip)** — 가상화 그리드의 정상 거동. 가로 스크롤 컨테이너는 기존 `overflow-x-auto`(또는 행 가상화의 `overflow:auto`)가 제공하므로 Tailwind 미적용 소비자는 컨테이너에 `overflow-x` 를 직접 지정해야 한다. **⚠️ 실험적**: 본문+헤더 가상화 배선 + chromium 정렬 매트릭스 완료(Commit C). off=기존과 byte-identical, SSR/미측정 시 전 컬럼 렌더(안전 fallback). |
| `enableExpanding?` | `boolean` | 행 펼침(expanding) state 활성 (default `false`) — TreeGrid 흡수. `getSubRows` 와 함께 사용. |
| `enableFilter?` | `boolean` | 컬럼 필터 활성 (default `false`) — `getFilteredRowModel` wiring. |
| `enableMultiSort?` | `boolean` | 다중 정렬 활성 (default `false`) — TanStack `enableMultiSort` 위임. |
| `enablePagination?` | `boolean` | 페이지네이션 활성 (default `false`) — `getPaginationRowModel` wiring. |
| `enableRowClickSelection?` | `boolean` | 행 본문 클릭으로 선택. `rowSelection` 이 `'single'`/`'multi'` 일 때만 동작. - plain 클릭 → 그 행만 선택(나머지 해제). ctrl/cmd+클릭 → 토글(다중 누적). (shift 범위 = ) - 기존 `onRowClick` 콜백과 **독립 공존** — 선택을 하면서 `onRowClick` 도 그대로 호출. - 체크박스 셀(`__select__`) 클릭은 `stopPropagation` 으로 이 경로를 안 탐(기존 동작 보존). |
| `enableRowPinning?` | `boolean` | 행 고정. 사용자가 데이터 행을 상/하단에 고정(`row.pin('top'\|'bottom')`). 고정 행은 sticky 로 스크롤 중 고정되고 center 행에서 제외된다. **비-가상화 전용**(가상화+핀=vN). UI 컨트롤은 `RowPinButton` 컴포넌트를 셀에 배치. |
| `enableRowReorder?` | `boolean` | 행 드래그 재정렬 활성 (default `false`). 데이터 행을 draggable 로 만들어 드롭 시 `onRowReorder(from, to)` 호출(소비자가 `moveRow(data, from, to)` 로 자기 data 적용). **정렬/필터 활성 시 자동 비활성**(표시순≠data순이라 재배열 모호) + **비-가상화 전용**(가상화 합성 = vN). HTML5 drag. |
| `enableSort?` | `boolean` | 정렬 활성 (default `false`) — `getSortedRowModel` wiring. |
| `enableVirtualization?` | `boolean` | 가상화 활성 (default `false`) — opt-in only. `true` 시 `useGridVirtualizer` wiring + tbody padding-row 패턴 적용. `false` 시 ~ markup 그대로 ( sticky/pinning 보존). |
| `floatingBottomRows?` | `TData[]` | 그리드 **하단**에 고정 표시할 소비자 공급 행 데이터. `floatingTopRows` 와 동일 규약(하단 sticky). |
| `floatingTopRows?` | `TData[]` | 그리드 **상단**에 고정 표시할 소비자 공급 행 데이터. XX Grid 의 `pinnedTopRowData` 와 동형 — 데이터 모델 *밖*의 추가 행(합계/요약 등). 컬럼 셀 렌더러(`columnDef.cell`)를 그대로 통과해 본문 행과 동일하게 표시되며, 본문이 스크롤돼도 `position: sticky` 로 고정된다. **집계 계산 안 함**: 소비자가 total 객체를 직접 제공(자동 집계는 `@topgrid/grid-pro-agg`/Pro). **상호작용 핀 아님**: 기존 행을 사용자가 핀하는 기능(`@topgrid/grid-pro-master`/Pro)과 별개. 미제공/빈 배열 → 렌더 없음(기존 동작 불변). |
| `getCellTooltip?` | `(…) => …` | 셀 툴팁. 셀마다 호출해 반환 문자열을 `<td title>` 로 부여(네이티브 hover 툴팁) — 잘린 내용 표시·부가 설명 등. `undefined`/`null`/`''` 반환 시 해당 셀 title 미부여. grid-core 1.0 : `(cell, row)` → `(ctx)` (clean GridCellContext). |
| `getRowId?` | `(…) => …` | 안정적 행 식별자. 미지정 시 행 키 = 배열 인덱스. 제공하면 `rowSelection`·`expanded` 등 모든 행-키 상태가 **인덱스가 아닌 이 id** 로 매겨져, 데이터 재정렬/교체를 가로질러 **동일 논리 행을 추적**(선택이 위치가 아닌 정체성을 따라감). cell 변경 flash 가 "같은 행"을 식별하는 토대. |
| `getSubRows?` | `(…) => …` | TanStack `getSubRows` — `enableExpanding=true` 시 사용. |
| `icons?` | `Partial<GridIcons>` | 정렬 표시 아이콘 glyph override(부분). 미지정은 기본(`▲▼⇅`)으로 fallback. |
| `loading?` | `boolean` | 로딩 상태. `true` 시 `<tbody>` 영역만 skeleton row 로 치환 (thead 보존 — ). |
| `loadingOverlay?` | `boolean` | 로딩 오버레이 (default `false`). `loading`(skeleton 치환)과 달리 **기존 data 행을 그대로 둔 채** 그 위에 반투명 오버레이를 덮는다(기존 데이터를 유지하며 갱신 중임을 표시). `aria-busy` + pointer-events 차단(하부 상호작용 막음). `loading`(skeleton)과 독립·additive — 둘 다 기존 동작 불변. |
| `loadingRowCount?` | `number` | 로딩 시 표시할 skeleton 행 개수. 미지정 시 `pagination.pageSize ?? 5` 로 fallback ( — BaseGrid L123 hardcoded `5` 와 호환). |
| `localeText?` | `Partial<GridLocale>` | grid chrome 문자열 현지화 — 부분 override. 미지정 키는 한국어 기본으로 fallback(raw key/undefined 안 냄). 영문화 예: `{ emptyText: 'No data', rowsPerPage: 'Rows per page:', totalCount: (n) => `$&#123;n} rows` }`. `defaultGridLocale` 를 import 해 위에 spread 도 가능. |
| `manualFiltering?` | `boolean` | Server 필터: `true` 시 클라이언트 필터 비활성(`getFilteredRowModel` skip + `manualFiltering`). default `false`. |
| `manualSorting?` | `boolean` | Server 정렬: `true` 시 클라이언트 정렬 비활성(`getSortedRowModel` skip + `manualSorting`). 정렬 *UI/state* 는 유지(헤더 클릭 → `onSortingChange`)되 실제 정렬은 서버 위임. default `false`. |
| `maxMultiSortColCount?` | `number` | 동시에 정렬 가능한 최대 컬럼 수. TanStack `maxMultiSortColCount` 에 직접 전달. 미설정 시 무제한. `enableMultiSort=false` 시 무시됨. |
| `onAddRow?` | `(…) => …` | 행 추가 콜백 — `ref.current.addRow(seed?)` 호출 시 invoke. controlled data 정책: parent 가 `props.data` 배열에 새 row append 책임. |
| `onCellClick?` | `(…) => …` | 셀 클릭 핸들러 — column-level 분기 의도 노출. grid-core 1.0 : `(cell, row, event)` → `(ctx, event)`. `ctx` 는 clean GridCellContext — `ctx.columnId`·`ctx.value`·`ctx.rowId`·`ctx.row`(=구 `row.original`). |
| `onCellKeyDown?` | `(…) => …` | 셀 키보드 이벤트 핸들러 — `<td onKeyDown>` 으로 wire. grid-core 1.0 : `(cell, row, event)` → `(ctx, event)` (clean GridCellContext). |
| `onColumnFiltersChange?` | `OnChangeFn<ColumnFiltersState>` | ColumnFilters state 변경 콜백 (server 필터 파라미터 도출용; internal state 도 갱신). |
| `onColumnOrderChange?` | `(…) => …` | 컬럼 순서 변경 완료 후 호출되는 콜백. 부모가 외부 state 동기화 가능.  : F-07-06 흡수. |
| `onColumnPinningChange?` | `OnChangeFn<ColumnPinningState>` | ColumnPinning state 변경 콜백 (외부 영속화 또는 controlled mirror 용). |
| `onColumnSizingChange?` | `OnChangeFn<ColumnSizingState>` | ColumnSizing state 변경 콜백 (외부 영속화 또는 controlled mirror 용). |
| `onDeleteRow?` | `(…) => …` | 행 삭제 콜백 — `ref.current.deleteRow(rowId)` 호출 시 invoke. `rowId` = TanStack `row.id` (default = row index string). |
| `onRowClick?` | `(…) => …` | 행 클릭 핸들러. |
| `onRowDoubleClick?` | `(…) => …` | 행 더블 클릭 핸들러 — `onRowClick` 와 동일한 시그니처 정책. |
| `onRowDragStart?` | `(…) => …` | 그리드 간 행 드래그 — 드래그 소스(default 없음=비활성). 제공 시 데이터 행이 draggable 이 되어 dragstart 시 `onRowDragStart(rowId)` 호출(`rowId` = TanStack `row.id`). 소비자가 드래그된 행 id 를 **두 그리드 위 state 로 들어올려** 보관한다(consumer-owns-payload, dataTransfer 미사용). 대상 그리드의 `onRowDrop` 과 짝. enableRowReorder 와 **별 opt-in**(같은 그리드서 혼용 금지=vN). OFF 시 byte-identical. |
| `onRowDrop?` | `(…) => …` | 그리드 간 행 드래그 — 드롭 타깃(default 없음=비활성). 제공 시 그리드 본문 영역이 drop target 이 되어(드롭 시) `onRowDrop` 호출. 소비자가 자기 `dragged` id 를 읽어 순수 `transferRow` 로 소스→타깃 data 를 적용한다. OFF 시 byte-identical. |
| `onRowReorder?` | `(…) => …` | 행 재정렬 드롭 콜백 — 표시 인덱스 `from`→`to`. 소비자가 `moveRow` 로 data 적용. |
| `onSortingChange?` | `OnChangeFn<SortingState>` | Sorting state 변경 콜백 (server 정렬 파라미터 도출용; internal state 도 갱신). |
| `onStartEditing?` | `(…) => …` | 프로그래밍적 편집 시작 콜백 — `ref.current.startEditing(rowId, colId)` 호출 시 invoke.  의 callback-delegating 패턴과 동일 정책: Grid 가 editing state 를 소유하지 않으며 application 이 EditableCell `isEditing` 갱신 책임. |
| `onUpdateRow?` | `(…) => …` | 행 부분 업데이트 콜백 — `ref.current.updateRow(rowId, patch)` 호출 시 invoke. |
| `pagination?` | `GridPaginationOptions` | 페이지네이션 세부 옵션 (`enablePagination=true` 일 때 효과). |
| `persistColumnOrder?` | `boolean` | 컬럼 순서 localStorage 영속화 활성. `true` + `columnOrderStorageKey` 지정 시 drag/keyboard 완료 후 localStorage 저장. mount 시 저장된 순서 복원 (`table.setColumnOrder`). |
| `renderFloatingFilter?` | `(…) => …` | Floating 필터 행 렌더 콜백. 지정 시 leaf 헤더행 아래 always-visible 필터 입력 행을 그린다(prop 존재=활성, `cellClassName` 관례 mirror). 컬럼당 1회 호출 — 보통 grid-features 의 floating 입력 컴포넌트(`column.setValue` 로 popover 와 동일 state 공유)를 반환. grid-core 는 구조 행 + 컬럼 윈도(가상화)·핀 sticky·ARIA 정합만 제공(grid-features 무의존=MIT). null 반환=빈 셀. grid-core 1.0 : `Column<TData,unknown>` → clean GridFilterColumn (`id`·`value`·`setValue` — TanStack 타입 없음). |
| `rowClassName?` | `RowClassNameCallback<TData>` | 행별 className 생성 callback. 모든 row 렌더 시 호출. 반환 string 은 `<tr>` 의 기본 className 에 append. **virtualization 주의**: `enableVirtualization=true` 시 `<tr ref={measureElement}>` 가 row height 측정 — `rowClassName` 이 dynamic height 변경을 유발하면 measureElement 의 reflow 가 반복 발생 (성능 저하). static className 권장. |
| `rowSelection?` | `RowSelectionMode \| GridRowSelectionOptions<TData>` | 행 선택 옵션. 단축 표기(`'multi'`) 또는 객체 표기 모두 지원. 'single'/'multi' 시 좌측 첫 컬럼에 체크박스 컬럼(`__select__`) 자동 prepend. |
| `showSortClearButton?` | `boolean` | 정렬 초기화 버튼 표시 여부. `true` 이고 `enableMultiSort=true` 일 때 툴바에 `<SortClearButton>` 렌더. 미설정(기본) 시 DOM 구조 변경 없음. |
| `sortDescFirst?` | `boolean` | 정렬 첫 클릭 방향을 내림차순으로. (TanStack `sortDescFirst` passthrough — 미지정 시 타입별 기본: 숫자=desc-first, 문자=asc-first.) |
| `theme?` | `Partial<GridTheme>` | grid chrome 색 테마(부분 override). 제공한 색만 root 에 inline `--topgrid-*` var 로 적용되고 각 surface 가 `var(--topgrid-x, <기본 hex>)` 로 읽는다. 미지정 키는 기본색 fallback. 다크 등 프리셋은 `import { darkTheme }` 후 spread. ⚠ CSS var 는 forced-colors(고대비)서 무력 (HC-safe 선택 표시는 별도 메커니즘). |
| `virtualizerOptions?` | `{ … }` | `useVirtualizer` 옵션 override. - `estimateSize`: 행 높이 추정 px (default `36`, BaseGrid `<td className="px-4 py-3">` 기준). - `overscan`: viewport 위/아래 버퍼 행 수 (default `10`, VirtualGrid.tsx:102 동일). - `onChange`: virtualizer 변경 콜백(가시 범위 관찰 — SSRM 의 블록 fetch 트리거).  `useVirtualizer` 에 그대로 전달. generic passthrough(SSRM 전용 로직 0). |
| `virtualScrollHeight?` | `number` | 가상화 시 scroll container 높이 (px, default `400`). `enableVirtualization=true` 일 때만 효과 발휘. |

### `ContextMenuItem`

A single context menu item definition.

| 속성 | 타입 | 설명 |
|---|---|---|
| `children?` | `ContextMenuItem<TData>[]` | Optional submenu. When provided, this item opens a nested context menu on hover instead of (or in addition to) firing `onClick`. A `▶` affordance is rendered on the right and `aria-haspopup="menu"` is set. Submenu items are themselves `ContextMenuItem`s, so nesting is recursive. |
| `disabled?` | `boolean \| (…) => …` | Whether this item is disabled. - `boolean`: static disabled state. - `(row: TData) => boolean`: evaluated at render time against the target row. Disabled items are rendered but not clickable (pointer-events: none equivalent). |
| `icon?` | `ReactNode` | Optional leading icon, rendered to the left of the label. Any `ReactNode` (e.g. an SVG element or an emoji string). |
| `label` | `string` | Display label for the menu item. For separator items, the label is ignored — pass an empty string. |
| `onClick?` | `(…) => …` | Click handler for this menu item. Optional — submenu parent items (those with `children`) typically omit it, since clicking only toggles the submenu. Leaf items should provide it. |
| `separator?` | `boolean` | When `true`, renders a horizontal separator line. All other properties except `label` are ignored for separator items. |
| `shortcut?` | `string` | Optional keyboard shortcut hint displayed on the right side of the label. When the wrapper div has focus and this combination is pressed while the menu is open, the item's `onClick` is triggered (if not disabled). Grammar: `"[Modifier+]Key"` where Modifier ∈ &#123;Ctrl, Alt, Shift} (combinable, e.g. `"Ctrl+Shift+E"`). The key is matched case-insensitively against `event.key`; modifier flags (`ctrlKey`/`altKey`/`shiftKey`) must match exactly. Invalid grammar (e.g. `"Ctrl+"`) is ignored (warns in dev). |

### `CreateAsyncDataMapOptions`

CreateAsyncDataMapOptions&lt;TItem>: createAsyncDataMap 팩토리 옵션.

: no any
: staleTime? optional — 미제공 시 내부 DEFAULT_STALE_TIME(300_000 ms) 사용.
 내부 소비: `options.staleTime !== undefined ? options.staleTime : DEFAULT_STALE_TIME`

| 속성 | 타입 | 설명 |
|---|---|---|
| `displayPath` | `PathOrAccessor<TItem, string>` | 표시 레이블 경로 또는 accessor |
| `loader` | `(…) => …` | 옵션 항목 비동기 로더 — Promise&lt;TItem[]> 반환 |
| `staleTime?` | `number` | 캐시 유효 기간 (ms). 미제공 시 5분(300_000 ms). : optional — staleTime !== undefined 체크 후 내부 사용 |
| `valuePath` | `PathOrAccessor<TItem, unknown>` | 코드 값 경로 또는 accessor |

### `CreateDataMapOptions`

| 속성 | 타입 | 설명 |
|---|---|---|
| `displayPath` | `PathOrAccessor<TItem, string>` |  |
| `items` | `TItem[]` |  |
| `valuePath` | `PathOrAccessor<TItem, unknown>` |  |

### `CSVExportOptions`

CSV export 옵션

| 속성 | 타입 | 설명 |
|---|---|---|
| `delimiter?` | `"," \| "\t"` | CSV 구분자 — ',' (기본, RFC 4180) 또는 '\t' (TSV 옵션) |
| `emptyBehavior?` | `EmptyBehavior` | 데이터 행 0건 시 동작 - 'skip': 파일 생성 안 함 (기본) - 'empty': 헤더만 있는 빈 파일 생성 |
| `fileName?` | `string` | 다운로드 파일명 (확장자 포함 권장, 없으면.csv 자동 추가) |
| `scope?` | `ExportScope` | export 대상 행 범위 - 'all': getCoreRowModel (필터 무시, 전체) - 'filtered': getFilteredRowModel (현재 정렬/필터 반영) ← default - 'selected': table.getSelectedRowModel (선택 행만) |

### `CustomEditorContext`

Lifecycle context handed to a consumer-supplied editor via EditableCellProps.renderEditor.

The slot's value proposition is the **edit lifecycle**, not the ability to render an
arbitrary component (a consumer can already render anything via a raw TanStack `cell`
renderer). What a raw `cell` does NOT get for free — and what this context provides —
is: entry autofocus (`focusRef`), Enter→commit / Esc→cancel / Tab→commit (wired by
EditableCell's keydown handler on the slot wrapper, so the consumer writes none of it),
and a controlled draft (`value` / `onChange`).

`value` is the draft **string** — EditableCell preserves the `onCommit(string)` contract,
so the consumer serializes any richer value. (Arbitrary non-string value-type parity is vN.)

| 속성 | 타입 | 설명 |
|---|---|---|
| `cancel` | `(…) => …` | Cancel editing (= `onCancel`). |
| `commit` | `(…) => …` | Commit the current draft (= `onCommit(draft)`). |
| `focusRef` | `(…) => …` | Callback ref — attach to the focusable editor element. EditableCell focuses it automatically when the cell enters edit mode (entry autofocus). A bare element does not self-focus, so this is the autofocus seam. |
| `onChange` | `(…) => …` | Update the draft (= internal `setDraft`). |
| `value` | `string` | Current draft value (string) — owned by EditableCell. |

### `DataMap`

DataMap&lt;TItem>: 코드 값 ↔ 레이블 양방향 조회 인터페이스.
createDataMap 팩토리 함수가 반환하는 단일 타입.

| 속성 | 타입 | 설명 |
|---|---|---|
| `getDisplay` | `unknown` |  |
| `getItems` | `unknown` |  |
| `getValue` | `unknown` |  |

### `DataMapEditorProps`

DataMapEditorProps&lt;TItem>: 편집 셀 드롭다운 에디터 컴포넌트 파라미터 타입.
: 필터-타이핑 드롭다운 (DataMapEditor).

: no any — : exactOptionalPropertyTypes=true 호환

| 속성 | 타입 | 설명 |
|---|---|---|
| `dataMap` | `DataMap<TItem>` | 선택 목록 제공자 — getItems로 전체 항목 반환 |
| `getLabelFromItem?` | `(…) => …` | Optional: TItem → 표시 레이블 변환 함수. DataMap 내부 Map이 valuePath(item) 코드 키로 저장되므로 getDisplay(item) 직접 호출 불가 (F-06 spec code defect 수정). 미제공 시 String(item) fallback (spec Section 11.3 explicit alternative). : optional — 미제공 시 undefined (spread-skip 불필요, 내부 소비용) |
| `onCancel` | `(…) => …` | 편집 취소 콜백 |
| `onCommit` | `(…) => …` | 선택 확정 콜백 — newValue는 DataMap의 코드 값 |
| `value` | `unknown` | 현재 셀의 코드 값 (DataMap.getValue 기준) |

### `DateCellProps`

Props for DateCell.

Preserves L0 DateCell.tsx (L1-5) prop signature in full — no drift.

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` | Additional Tailwind className. |
| `format?` | `"date" \| "datetime" \| "time"` | Display format (default 'date'). L0 DateCell.tsx:3 preserved. |
| `locale?` | `string` | Locale tag (default 'ko-KR'). L0 DateCell.tsx:4. |
| `value` | `undefined \| null \| string \| number \| Date` | Date value. null/undefined/'' → dash placeholder. Invalid Date → dash. |

### `DateFilterProps`

DateFilter 컴포넌트 Props.

| 속성 | 타입 | 설명 |
|---|---|---|
| `column` | `Column<TData, unknown>` | TanStack Column 인스턴스. Column&lt;TData, unknown>. |
| `popoverAlign?` | `"left" \| "right"` | 팝오버 정렬 — 기본 'left'. : optional prop — FilterPopover align으로 spread-skip 전달. |

### `DateFilterValue`

| 속성 | 타입 | 설명 |
|---|---|---|
| `from?` | `Date` |  |
| `to?` | `Date` |  |

### `DistributeStarWidthsOptions`

Options for distributeStarWidths.

| 속성 | 타입 | 설명 |
|---|---|---|
| `columns` | `StarColumnInput[]` |  |
| `totalWidth` | `number` | Total available width (px) to distribute across all columns. |

### `DownloadExcelOptions`

DataTable buttonInfo 호환 alias 옵션 (legacy)

| 속성 | 타입 | 설명 |
|---|---|---|
| `columnFormats?` | `Record<string, string>` | 컬럼별 네이티브 Excel number-format 코드 key = 컬럼 id, value = Excel format 코드(예 `'#,##0.00'`, `'yyyy-mm-dd'`, `'0.0%'`). 해당 컬럼 데이터 셀에 `.z` 로 적용되어 셀이 Excel 안에서 numeric·정렬가능하게 유지된다. |
| `columnWidths?` | `Record<string, number>` | 컬럼별 폭 — key = 컬럼 id, value = xlsx `wch` 단위 폭. 지정된 컬럼만 `!cols` 에 반영(미지정은 기본 폭). |
| `emptyBehavior?` | `EmptyBehavior` | 데이터 행 0건 시 동작 - 'skip': 파일 생성 안 함 (기본) - 'empty': 헤더만 있는 빈 파일 생성 |
| `fileName?` | `string` | 다운로드 파일명 (확장자 포함 권장, 없으면.xlsx 자동 추가) |
| `scope?` | `ExportScope` |  |
| `sheetName?` | `string` | Excel 시트명 |

### `DragFillHandleProps`

DragFillHandle 컴포넌트 Props.

 (exactOptionalPropertyTypes): optional 필드는 '?: T' 선언.
전달 시 spread-skip 패턴 사용 (spec Section 4.4).

| 속성 | 타입 | 설명 |
|---|---|---|
| `colCount` | `number` | 그리드 전체 열 수 (경계 clamp). |
| `containerRef` | `RefObject<HTMLElement>` | 핸들이 렌더링될 컨테이너 ref (좌표 계산). |
| `getCellRect` | `(…) => …` | 셀 크기 getter (px) — 드래그 위치 → cell coord 변환용. |
| `getCellValue` | `(…) => …` | 소스 셀 값 getter — 드래그 시 fill 계산용. |
| `onFillComplete?` | `(…) => …` | 채우기 완료 콜백 ( 분리). |
| `onFillTargetChange?` | `(…) => …` | 드래그 중 fill target 범위 변경 알림 (시각적 점선 outline용). |
| `range` | `null \| CellRange` | 현재 선택된 소스 범위 ( CellRange). null이면 핸들 미표시. |
| `rowCount` | `number` | 그리드 전체 행 수 (경계 clamp). |

### `DragThProps`

헤더 `<th>` DOM 요소에 전달할 drag props.

HTML5 DragEvent 핸들러 (: 외부 라이브러리 미사용).
Grid.tsx 에서 React.DragEvent&lt;HTMLTableCellElement> 를 받아
`.nativeEvent` 로 DOM DragEvent 추출 후 이 핸들러에 전달.

| 속성 | 타입 | 설명 |
|---|---|---|
| `draggable` | `boolean` | pinned=true → false, enabled=true → true (/). |
| `onDragEnd` | `(…) => …` |  |
| `onDragLeave` | `(…) => …` |  |
| `onDragOver` | `(…) => …` |  |
| `onDragStart` | `(…) => …` |  |
| `onDrop` | `(…) => …` |  |

### `EditableCellProps`

Props for EditableCell.

| 속성 | 타입 | 설명 |
|---|---|---|
| `align?` | `"left" \| "center" \| "right"` | Text alignment inside the edit input. Default `'left'`. Rendered as a Tailwind class (`text-center` / `text-right`) — compliant. |
| `cellClassName?` | `string` | Additional Tailwind className — injection point for Grid-level callbacks. |
| `columnId?` | `string` | Column id (optional — logging / debugging only, no effect on behaviour). |
| `editType` | `EditType` | Edit input type (5 variants — ). |
| `initialDraft?` | `string` | Initial draft value applied on mount when the cell enters editing state. Use case: keyboard-triggered editing — the first keystroke is captured by the focusable view-mode `<div>` before `<EditableCell>` mounts, so the character would be lost. Passing it as `initialDraft` restores the xxxx `prepareCellForEdit` + `hostElement.keydown` "type directly to enter" UX. Behaviour: - If `undefined` (default): the input mounts with the current cell value  (existing behaviour, no change). - If a string: the draft state is initialised to `initialDraft` and the  cursor is positioned at the end of the string after focus. Note: this prop is read only on the **first render** (mount). Subsequent changes to `initialDraft` while the component is mounted have no effect — the component controls its own draft state after mount. |
| `isEditing` | `boolean` | Edit-mode flag — owned by the parent container (e.g. EditableGrid). |
| `maxLength?` | `number` | Maximum character length for text/number/textarea inputs. Forwarded directly as the HTML `maxLength` attribute. Not applicable to `editType === 'select'`. |
| `onCancel` | `(…) => …` | Invoked on Esc — edit cancelled. |
| `onCommit` | `(…) => …` | Invoked on Enter (non-textarea) / Blur / Tab. New value is emitted as string. |
| `onStartEdit` | `(…) => …` | Invoked when the view-mode cell is clicked to request edit mode. |
| `renderEditor?` | `(…) => …` | Custom editor slot (render prop). When provided **and** `isEditing` is true, the built-in `editType` editors (input/select/textarea) are bypassed and the consumer's editor is rendered inside a lifecycle wrapper instead. The wrapper supplies the edit lifecycle the consumer would otherwise have to wire by hand on a raw `cell` renderer: - **Entry autofocus** — `ctx.focusRef` is focused when the cell enters edit mode. - **Enter → commit**, **Esc → cancel**, **Tab → commit** — via the wrapper's `onKeyDown`  (keydown bubbles up from the consumer's editor; `stopPropagationOnKeyDown` is honored). - **Controlled draft** — `ctx.value` / `ctx.onChange` (string; see CustomEditorContext). `editType` is ignored while `renderEditor` is active (the consumer owns the markup). |
| `rowIndex?` | `number` | Row index (optional — logging / debugging only, no effect on behaviour). |
| `selectOptions?` | `readonly { … }[]` | Options when `editType === 'select'`. Empty/undefined → placeholder. |
| `stopPropagationOnKeyDown?` | `boolean` | When `true`, calls `e.stopPropagation` at the end of every keydown event on the editor element, preventing the grid host's keyboard handler from intercepting the key (xxxx `prepareCellForEdit` pattern). Default `false`. |
| `value` | `unknown` | Current value — rendered in view mode. `null`/`undefined` → empty text. |

### `ExcelColumn`

행 배열 기반 Excel export 의 컬럼 정의

| 속성 | 타입 | 설명 |
|---|---|---|
| `format?` | `"number" \| "date" \| "datetime" \| "currency"` | 셀 값 포맷 |
| `header` | `string` | 헤더 셀에 표시할 텍스트 |
| `key` | `string` | 행 객체의 키 |
| `width?` | `number` | 컬럼 너비 (wch 단위). 기본값 15 |

### `ExcelExportOptions`

Excel export 옵션

 (emptyBehavior) 와 동일 타입 공유 — types.ts single source-of-truth

| 속성 | 타입 | 설명 |
|---|---|---|
| `columnFormats?` | `Record<string, string>` | 컬럼별 네이티브 Excel number-format 코드 key = 컬럼 id, value = Excel format 코드(예 `'#,##0.00'`, `'yyyy-mm-dd'`, `'0.0%'`). 해당 컬럼 데이터 셀에 `.z` 로 적용되어 셀이 Excel 안에서 numeric·정렬가능하게 유지된다. |
| `columnWidths?` | `Record<string, number>` | 컬럼별 폭 — key = 컬럼 id, value = xlsx `wch` 단위 폭. 지정된 컬럼만 `!cols` 에 반영(미지정은 기본 폭). |
| `emptyBehavior?` | `EmptyBehavior` | 데이터 행 0건 시 동작 - 'skip': 파일 생성 안 함 (기본) - 'empty': 헤더만 있는 빈 파일 생성 |
| `fileName?` | `string` | 다운로드 파일명 (확장자 포함 권장, 없으면.xlsx 자동 추가) |
| `scope?` | `ExportScope` | export 대상 행 범위 - 'all': getCoreRowModel (필터 무시, 전체) - 'filtered': getFilteredRowModel (현재 정렬/필터 반영) ← default - 'selected': table.getSelectedRowModel (선택 행만) |
| `sheetName?` | `string` | Excel 시트명 |

### `ExcelSheet`

다중 시트 Excel export 의 시트 1개 정의

| 속성 | 타입 | 설명 |
|---|---|---|
| `columnFormats?` | `Record<string, string>` | 컬럼별 네이티브 number-format (ExcelExportOptions.columnFormats 와 동일) |
| `columnWidths?` | `Record<string, number>` | 컬럼별 폭 (ExcelExportOptions.columnWidths 와 동일) |
| `name` | `string` | 시트명 (Excel 탭에 표시) |
| `scope?` | `ExportScope` | export 대상 행 범위 |
| `table` | `Table<any>` | TanStack v8 Table 인스턴스 — 시트 내용 소스. 다중 시트는 본질적으로 **서로 다른 행 타입의 테이블을 한 배열에 섞으므로**(`Table<Person>` + `Table<Order>`), 단일 `TData` 로 묶을 수 없다. `Table<TData>` 는 `accessorFn` 의 함수 인자 반공변성 때문에 `Table<unknown>` 에 대입 불가(`Table<Person>` ↛ `Table<unknown>`). 이질 배열을 받으려면 `Table<any>` 가 유일한 실용 해법(TS 는 존재 타입 미지원). export 코드는 `getValue` 결과를 `unknown` 으로만 다뤄 타입 안전을 유지한다. |

### `ExportRowsCsvOptions`

`exportRowsToCsv` 옵션 ( 행 배열 export 의 CSV 평행)

`scope` 는 행 배열 입력에서 무의미하므로 제외.

| 속성 | 타입 | 설명 |
|---|---|---|
| `delimiter?` | `"," \| "\t"` | CSV 구분자 — ',' (기본, RFC 4180) 또는 '\t' (TSV) |
| `emptyBehavior?` | `EmptyBehavior` | 데이터 행 0건 시 동작 |
| `fileName?` | `string` | 다운로드 파일명 (확장자 없으면.csv 자동 추가) |

### `ExportRowsOptions`

`exportRowsToExcel` 옵션

`scope` 는 행 배열 입력에서 무의미하므로 의도적으로 제외.

| 속성 | 타입 | 설명 |
|---|---|---|
| `emptyBehavior?` | `EmptyBehavior` | 데이터 행 0건 시 동작 - 'skip': 파일 생성 안 함 (기본) - 'empty': 헤더만 있는 빈 파일 생성 |
| `fileName?` | `string` | 다운로드 파일명 (확장자 포함 권장, 없으면.xlsx 자동 추가) |
| `sheetName?` | `string` | Excel 시트명 |

### `ExportRowsPdfOptions`

`exportRowsToPdf` 옵션 ( 행 배열 export 의 PDF 평행)

`scope` 는 행 배열 입력에서 무의미하므로 제외.

| 속성 | 타입 | 설명 |
|---|---|---|
| `emptyBehavior?` | `EmptyBehavior` | 데이터 행 0건 시 동작 |
| `fileName?` | `string` | 다운로드 파일명 (확장자 없으면.pdf 자동 추가) |
| `orientation?` | `"p" \| "l"` | 페이지 방향 — 'p' portrait (기본) / 'l' landscape |
| `title?` | `string` | PDF 최상단 제목 행 (없으면 생략) |

### `FilterColumnLike`

Minimal structural view of a TanStack `Column` (filter side).

| 속성 | 타입 | 설명 |
|---|---|---|
| `getFilterValue` | `(…) => …` |  |
| `id` | `string` |  |
| `setFilterValue` | `(…) => …` |  |

### `FilterCondition`

단일 cross-column 조건. `value` 는 blank/notBlank 에 불요(없으면 inert).

| 속성 | 타입 | 설명 |
|---|---|---|
| `field` | `string` |  |
| `kind` | `"condition"` |  |
| `operator` | `FilterOperator` |  |
| `type` | `FilterValueType` |  |
| `value?` | `unknown` |  |

### `FilterGroup`

AND/OR 그룹(중첩 가능).

| 속성 | 타입 | 설명 |
|---|---|---|
| `children` | `AdvancedFilterExpr[]` |  |
| `kind` | `"group"` |  |
| `logic` | `"and" \| "or"` |  |

### `FilterIndicatorProps`

FilterIndicator 컴포넌트 Props.
`column.getIsFiltered` 결과값을 그대로 전달.

| 속성 | 타입 | 설명 |
|---|---|---|
| `isFiltered` | `boolean` | column.getIsFiltered 결과값 |

### `FilterPopoverProps`

FilterPopover 컴포넌트 Props.

네이티브 div position:absolute 기반 팝오버 (: @radix-ui 없음).
외부클릭(mousedown) / Escape 해제 / 포커스 관리 포함.

| 속성 | 타입 | 설명 |
|---|---|---|
| `align?` | `"left" \| "right"` | 정렬 방향 — 기본 'left'. : optional prop — 하위 전달 시 spread-skip 패턴 사용 (Section 4.6). |
| `children` | `ReactNode` | 팝오버 내용 |
| `trigger` | `ReactNode` | 팝오버 트리거 요소 렌더 함수 |

### `FilterResetButtonProps`

FilterResetButton 컴포넌트 Props.

| 속성 | 타입 | 설명 |
|---|---|---|
| `children?` | `ReactNode` | 버튼 레이블 — 기본 'Reset Filters'. : optional prop. |
| `table` | `Table<TData>` | TanStack Table 인스턴스. |

### `FilterSelection`

한 선택 항목(차트-무관 generic): 필드 + 타입(컬럼 메타) + 선택 값.

| 속성 | 타입 | 설명 |
|---|---|---|
| `field` | `string` |  |
| `type` | `FilterValueType` |  |
| `value` | `unknown` |  |

### `FiltersToolPanelColumn`

One column's filter row in FiltersToolPanel.

| 속성 | 타입 | 설명 |
|---|---|---|
| `id` | `string` | Column id. |
| `label` | `string` | Human-readable label. |
| `value` | `string` | Current filter value (empty string = inactive). |

### `FiltersToolPanelProps`

Props for FiltersToolPanel.

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` | Additional className appended to the root container. |
| `columns` | `FiltersToolPanelColumn[]` | Columns with their current filter values, in display order. |
| `emptyText?` | `string` | Text shown when there are no columns. |
| `onClearAll?` | `(…) => …` | Optional — when provided, a "Clear all" button clears every filter. |
| `onFilterChange` | `(…) => …` | Fired when a column's filter input changes. |

### `FindOptions`

검색 옵션.

| 속성 | 타입 | 설명 |
|---|---|---|
| `caseSensitive?` | `boolean` | 대소문자 구분. |
| `matchMode?` | `"substring" \| "whole"` | `'substring'`=부분일치(기본) · `'whole'`=셀 전체 일치. |

### `FooterRowProps`

Props for the internal `FooterRow` component.
Renders a synthetic footer row after each group's leaf rows.

| 속성 | 타입 | 설명 |
|---|---|---|
| `cells` | `Cell<TData, unknown>[]` | Visible cells list (pass row.getVisibleCells). |
| `className?` | `string` | Additional Tailwind className for the footer row tr. |
| `renderFooterRow?` | `(…) => …` | Custom footer cell renderer. |
| `row` | `Row<TData>` | Group row Row object (aggregated cells accessed via cells prop). |

### `FormatDateTimeOptions`

| 속성 | 타입 | 설명 |
|---|---|---|
| `format?` | `"date" \| "datetime" \| "time"` | Display format (default 'date'). |
| `locale?` | `string` | Locale tag (default 'ko-KR'). |

### `FormatNumberOptions`

Pure formatting helpers for cell renderers.

Extracted from L0 patterns:
 - NumberCell.tsx L17-20 (inline value.toLocaleString)
 - DateCell.tsx L13-21 (inline date.toLocaleDateString + FORMAT_OPTIONS)

No external store/state dependency. Typed (no `any`).

| 속성 | 타입 | 설명 |
|---|---|---|
| `decimals?` | `number` | Decimal places (default 0). Clamped to [0, 20]. |
| `locale?` | `string` | Locale tag (default 'ko-KR'). |

### `GetRowsRequest`

A block request: half-open row range `[startRow, endRow)` + current sort/filter.

For lazy grouping the request also carries the group path being expanded. `groupKeys`/
`rowGroupCols` are **optional** — absent/empty = flat mode (/ behavior unchanged), so
existing flat datasources keep working. The level is `groupKeys.length`; the returned block
holds **group rows** when `level < rowGroupCols.length`, otherwise **leaf rows** (AG convention).

| 속성 | 타입 | 설명 |
|---|---|---|
| `endRow` | `number` | One past the last row index (exclusive). |
| `filterModel` | `FilterModel` | Active filter model (server applies). |
| `groupKeys?` | `string[]` | Path of group key values to the node whose children are requested (`[]`/absent = top level). |
| `pivotCols?` | `string[]` | Pivot dimension columns (outermost first) — the values become column groups. |
| `pivotMode?` | `boolean` | Server-side pivot — **optional, absent = no pivot** (flat/group behavior unchanged). When `pivotMode` is true the server pivots `valueCols` across `pivotCols` and returns rows keyed by the generated pivot-result fields, plus the field list in GetRowsResult.pivotResultFields. |
| `rowGroupCols?` | `string[]` | Columns being grouped, outermost first (absent/empty = no grouping). |
| `sortModel` | `SortModelItem[]` | Active sort directives (server applies). |
| `startRow` | `number` | First row index (inclusive) — within the addressed group's children. |
| `valueCols?` | `string[]` | Value/measure columns aggregated within each pivot column combination. |

### `GetRowsResult`

A block response. `lastRow` carries the **total/last-row signal** the virtualizer needs to
size the scroll area: set it to the absolute total row count once the server knows the end
has been reached (e.g. a partial final block), otherwise leave undefined (more rows exist).

| 속성 | 타입 | 설명 |
|---|---|---|
| `lastRow?` | `number` | Absolute total row count when known (end reached), else undefined. |
| `pivotResultFields?` | `string[]` | Server-side pivot — the generated pivot-result field keys (e.g. `"East\|sales"`), in column order. The grid feeds these to `buildServerPivotColumns` to derive the dynamic column tree. Absent for non-pivot responses. (Typically identical across blocks of one query.) |
| `rows` | `TData[]` | The rows for the requested range (length ≤ endRow − startRow). |

### `GlobalSearchInputProps`

GlobalSearchInput 컴포넌트 Props.

| 속성 | 타입 | 설명 |
|---|---|---|
| `debounceMs?` | `number` | 디바운스 ms — 기본 300. : optional prop. |
| `placeholder?` | `string` | 입력 placeholder — 기본 'Search all columns…'. : optional prop. |
| `table` | `Table<TData>` | TanStack Table 인스턴스. |

### `GridCellContext`

Clean cell context — what a consumer actually needs in onCellClick/onCellKeyDown/getCellTooltip.

| 속성 | 타입 | 설명 |
|---|---|---|
| `columnId` | `string` | Column id. |
| `row` | `TData` | The original row object. |
| `rowId` | `string` | Stable row id (from getRowId, or the array index fallback). |
| `value` | `unknown` | The cell's value. |

### `GridFilterColumn`

Clean filter column — normalises TanStack `getFilterValue`/`setFilterValue` to value/setValue.

| 속성 | 타입 | 설명 |
|---|---|---|
| `id` | `string` |  |
| `setValue` | `(…) => …` |  |
| `value` | `unknown` |  |

### `GridHandle`

`<Grid>` ref 노출 imperative handle.

| 속성 | 타입 | 설명 |
|---|---|---|
| `addRow` | `(…) => …` | 행 추가 — `props.onAddRow(seed?)` 콜백 위임. 콜백 미제공 시 dev mode `console.warn` 1회 + no-op. |
| `clearSelection` | `(…) => …` | 모든 선택 해제 — `table.setRowSelection({})` 위임. AG `api.deselectAll` 등가. |
| `deleteRow` | `(…) => …` | 행 삭제 — `props.onDeleteRow(rowId)` 콜백 위임. `rowId` = TanStack `row.id` (default = row index string). |
| `getSelection` | `(…) => …` | 현재 선택된 행 데이터 배열 반환 — `table.getSelectedRowModel.rows.map(r => r.original)` 위임. 빈 배열 = 선택 없음. |
| `refresh` | `(…) => …` | 내부 상태 재산정 — `table.resetRowSelection` 위임. |
| `scrollTo` | `(…) => …` | 인덱스 행으로 스크롤. - `enableVirtualization=true` 시 `virtualizer.scrollToIndex(index, options)` 위임  (`@tanstack/react-virtual` API). - `enableVirtualization=false` 시 native DOM  `tbody tr[data-index="N"].scrollIntoView({...})` fallback. - 음수 / `data.length` 초과 index → `[0, data.length-1]` 로 clamp + dev `console.warn`. |
| `updateRow` | `(…) => …` | 행 부분 업데이트 — `props.onUpdateRow(rowId, patch)` 콜백 위임. |
| `collapseAll?` | `unknown` |  |
| `expandAll?` | `unknown` |  |
| `startEditing?` | `unknown` |  |

### `GridPaginationOptions`

페이지네이션 옵션.

`enablePagination=true` 일 때만 효과 발휘. `manual=true` 시 server-side 페이지네이션 (외부 totalCount + pageIndex 제어 의무).

| 속성 | 타입 | 설명 |
|---|---|---|
| `autoPageSize?` | `boolean` | 뷰포트(그리드 본문) 높이에 맞춰 pageSize 를 자동 산정. 기본 `false`. 활성 시 `pageSize`/`pageSizeOptions` 셀렉트는 무시·숨김(상충 회피). |
| `enableGoToPage?` | `boolean` | 특정 페이지로 점프하는 numeric 입력 UI 표시. 기본 `false`. 슬라이딩 버튼만으로 닿지 않는 먼 페이지로 직접 이동. |
| `enableKeyboardNav?` | `boolean` | Alt+← / Alt+→ 키보드 페이지 이동 활성화. `GridPagination` 컴포넌트의 `enableKeyboardNav` prop에 연결. 기본 `false`. |
| `manual?` | `boolean` | Server-side 페이지네이션 모드. `true` 시 TanStack `manualPagination: true` + 외부 `totalCount` 필수. |
| `mode?` | `PaginationMode` | Pagination 동작 모드 (convenience shorthand). - `'client'` → `manual: false` + `enablePagination` 자동 활성 - `'server'` → `manual: true` + `enablePagination` 자동 활성 - `'none'` → pagination 비활성화 (enablePagination 무시) `mode`와 `manual` 동시 지정 시 `mode`가 우선. |
| `onPaginationChange?` | `OnChangeFn<PaginationState>` | Controlled pageIndex 변경 핸들러. |
| `pageCount?` | `number` | Server 모드(`mode: 'server'` 또는 `manual: true`)에서 전체 페이지 수. `totalCount`와 `pageSize`로부터 자동 계산되나, 직접 지정 시 override. |
| `pageIndex?` | `number` | Controlled pageIndex (controlled 모드). |
| `pageNumberFormat?` | `(…) => …` | 페이지 번호 버튼 라벨 포매터 (예: 천단위 구분 `n => n.toLocaleString`). 미지정 시 raw 정수. `aria-label`(접근성)은 원본 정수를 유지한다. 전체 건수 포맷은 `localeText.totalCount` 참조. |
| `pageSize?` | `number` | 기본 pageSize (default `20`). |
| `pageSizeOptions?` | `number[]` | 페이지당 행 수 셀렉트 옵션 (default `[10, 20, 50, 100]`). |
| `showTotalCount?` | `boolean` | 전체 건수 표시 여부. 기본 `true`. `false` 설정 시 "전체 N건" UI를 숨긴다. |
| `totalCount?` | `number` | Server 모드에서 전체 row count (manual=true 일 때 필수). |

### `GridPaginationProps`

`GridPagination<TData>` props.

| 속성 | 타입 | 설명 |
|---|---|---|
| `enableGoToPage?` | `boolean` | 특정 페이지로 점프하는 numeric 입력 UI 표시. 기본 `false`. |
| `enableKeyboardNav?` | `boolean` | Alt+← / Alt+→ 키보드 페이지 이동 활성화. container ref scope 에 이벤트 리스너 등록. 기본 `false`. |
| `mode?` | `PaginationMode` | Pagination 동작 모드 (`'client' \| 'server' \| 'none'`). |
| `navLabels?` | `{ … }` | 네비게이션 버튼 aria-label (i18n — ). 미지정 시 한국어 기본. |
| `onPaginationChange?` | `OnChangeFn<PaginationState>` | 페이지 변경 콜백. |
| `pageCount?` | `number` | Server 모드에서 전체 페이지 수. |
| `pageNumberFormat?` | `(…) => …` | 페이지 번호 라벨 포매터. PageNumbers 로 전달. |
| `pageSizeOptions?` | `number[]` | 페이지당 행 수 옵션 목록 (기본 `[10, 20, 50, 100]`). |
| `rowsPerPageLabel?` | `string` | "페이지당 행 수:" 라벨 (i18n — ). |
| `showTotalCount?` | `boolean` | 전체 건수 표시 여부. 기본 `true`. `false` 설정 시 "전체 N건" UI를 숨긴다. |
| `table` | `Table<TData>` | TanStack `Table` 인스턴스 — pagination state + API 접근. |
| `totalCount?` | `number` | Server 모드에서 전체 row 수. |
| `totalCountFormat?` | `(…) => …` | 전체 건수 텍스트 포매터 (i18n — ). |

### `GridProps`

`<Grid>` 컴포넌트 props.

| 속성 | 타입 | 설명 |
|---|---|---|
| `alwaysMultiSort?` | `boolean` | 평범 클릭으로도 다중 정렬 누적. `enableMultiSort` 와 함께 사용. 기본은 Shift+클릭이 다중 정렬 키지만, `true` 면 **Shift 없이** 컬럼을 순차 클릭해 누적. (TanStack `isMultiSortEvent: => true` passthrough.) |
| `autoSelectFirstRow?` | `boolean` | 데이터 로드 후 첫 행 자동 선택 (default `false`). |
| `cellClassName?` | `CellClassNameCallback<TData>` | 셀별 className 생성 callback. 모든 cell 렌더 시 호출. 반환 string 은 `<td>` 의 기본 className 에 append. **canonical**: 본 callback type 은 grid-core 가 ownership. grid-renderers 는 type-only re-export. **사용 예** (publish/organizeSchedule 등가): ```tsx cellClassName={(cell) => {  if (!cell.column.id.startsWith('d')) return '';  const isSelected = cell.row.getIsSelected;  const hasValue = cell.getValue != null && cell.getValue !== '';  return [  isSelected && 'bg-indigo-100',  !isSelected && hasValue && 'bg-yellow-50',  ].filter(Boolean).join(' '); }} ``` **성능 주의**: 매 cell 렌더마다 호출 — 대용량 데이터 시 callback 내부 계산 비용 주의 (useMemo 또는 stable callback 권장). |
| `className?` | `string` | 외곽 wrapper className (Tailwind). |
| `columnOrderStorageKey?` | `string` | `persistColumnOrder=true` 시 사용할 localStorage 키. 빈 문자열(`''`) 전달 시 localStorage 접근 없음. 미지정 시 `persistColumnOrder=true` 라도 저장 skip. |
| `columnPersistence?` | `ColumnPersistenceOptions` | 컬럼 가시성 + 순서 localStorage 영속화 옵션. - 제공 시 `<ColumnVisibilityMenu>` UI 자동 렌더 + `useColumnPersistence` 활성. - 미제공(`undefined`) 시 영속화 비활성 + 메뉴 미표시 ( backward compat). - `storageKey: ''` 시 localStorage 접근 없음 (NFR-006). |
| `columnResizeMode?` | `GridColumnResizeMode` | 컬럼 리사이즈 모드 (default `'onChange'`). `enableColumnResizing=true` 일 때만 효과 발휘. |
| `columns` | `ColumnDef<TData, unknown>[]` | 컬럼 정의 (TanStack `ColumnDef`). |
| `data` | `TData[]` | 행 데이터 배열. |
| `debug?` | `boolean` | TanStack `debugTable` 옵션 노출 (default `false`). |
| `defaultColumnPinning?` | `ColumnPinningState` | 컬럼 핀 uncontrolled 초기값 (`{ left: string[]; right: string[] }`). ColumnPinGrid `pinLeft` / `pinRight` alias 매핑 진입점. |
| `defaultColumnSizing?` | `ColumnSizingState` | 컬럼 width uncontrolled 초기값 (column id → px). mount 시 internal `columnSizing` state 의 초기값으로 사용 (uncontrolled 패턴). |
| `defaultExpanded?` | `false \| ExpandedState` | `enableExpanding=true` 시 expanded state 초기값 (uncontrolled). - `true` = 전체 펼침 - `Record<string, boolean>` = 특정 row id만 펼침 - 미지정 = `{}` (전체 접힘)  — TreeGrid alias `expandAll={true}` 호환 진입점. AS-IS TreeGrid.tsx:35 `useState<ExpandedState>(initialExpandAll ? true : {})` initial seed 패턴 보존. |
| `emptyState?` | `ReactNode` | 빈 결과 상태 ReactNode slot. 제공 시 `emptyText` 보다 우선 렌더 ( — slot → text → defaultText 순). |
| `emptyText?` | `string` | 빈 결과 안내 텍스트 (default `'데이터가 없습니다.'`). |
| `enableCellChangeFlash?` | `boolean` | 셀 값 변경 시 잠깐 강조(change-flash). `data` 가 바뀌면 **값이 실제로 변한 셀**(행 정체성으로 diff — 재정렬은 미강조)에 ~0.9s 배경 하이라이트. 안정적 강조를 위해 `getRowId` 를 함께 지정 권장(미지정 시 인덱스 기준 diff → 재정렬도 강조됨). |
| `enableColumnPinning?` | `boolean` | 컬럼 핀 state 활성 (default `false`). 본 은 `state.columnPinning` state 만 활성화. sticky CSS 외관은 범위. |
| `enableColumnReorder?` | `boolean` | 컬럼 드래그 재정렬 활성 (default `false`). HTML5 Drag and Drop API 기반 — 외부 dnd 라이브러리 미사용.  :. |
| `enableColumnResizing?` | `boolean` | 컬럼 리사이즈 state 활성 (default `false`). resize handle UI 는 범위. |
| `enableColumnVirtualization?` | `boolean` | 컬럼(가로) 가상화 활성. `true` 시 화면 밖 **center** 컬럼은 렌더하지 않고 좌/우 padding 셀로 가로 스크롤 폭만 유지한다 — 100+ 컬럼의 렌더 비용 절감. **핀 컬럼은 가상화 대상이 아니며 가로 스크롤과 무관하게 항상 렌더된다.** 미지정/`false` → 전 컬럼 렌더(기존 동작과 byte-identical). **v1 제약**: **flat(단일 행) 헤더 전용** — 그룹/다단 헤더(`getHeaderGroups.length > 1`)에서는 colSpan 회계 복잡도로 자동 비활성(전 컬럼 렌더). 그룹 헤더 가상화는 v2. **레이아웃**: `true` 시 `<table>` 은 `table-layout: fixed` + 전체 컬럼 폭(Σ`getSize`)으로 고정되어 컬럼이 명시 너비를 정확히 유지한다(pad px 와 정렬 일치). 부수효과로 **셀 내용이 컬럼 너비를 넘으면 잘린다(clip)** — 가상화 그리드의 정상 거동. 가로 스크롤 컨테이너는 기존 `overflow-x-auto`(또는 행 가상화의 `overflow:auto`)가 제공하므로 Tailwind 미적용 소비자는 컨테이너에 `overflow-x` 를 직접 지정해야 한다. **⚠️ 실험적**: 본문+헤더 가상화 배선 + chromium 정렬 매트릭스 완료(Commit C). off=기존과 byte-identical, SSR/미측정 시 전 컬럼 렌더(안전 fallback). |
| `enableExpanding?` | `boolean` | 행 펼침(expanding) state 활성 (default `false`) — TreeGrid 흡수. `getSubRows` 와 함께 사용. |
| `enableFilter?` | `boolean` | 컬럼 필터 활성 (default `false`) — `getFilteredRowModel` wiring. |
| `enableMultiSort?` | `boolean` | 다중 정렬 활성 (default `false`) — TanStack `enableMultiSort` 위임. |
| `enablePagination?` | `boolean` | 페이지네이션 활성 (default `false`) — `getPaginationRowModel` wiring. |
| `enableRowClickSelection?` | `boolean` | 행 본문 클릭으로 선택. `rowSelection` 이 `'single'`/`'multi'` 일 때만 동작. - plain 클릭 → 그 행만 선택(나머지 해제). ctrl/cmd+클릭 → 토글(다중 누적). (shift 범위 = ) - 기존 `onRowClick` 콜백과 **독립 공존** — 선택을 하면서 `onRowClick` 도 그대로 호출. - 체크박스 셀(`__select__`) 클릭은 `stopPropagation` 으로 이 경로를 안 탐(기존 동작 보존). |
| `enableRowPinning?` | `boolean` | 행 고정. 사용자가 데이터 행을 상/하단에 고정(`row.pin('top'\|'bottom')`). 고정 행은 sticky 로 스크롤 중 고정되고 center 행에서 제외된다. **비-가상화 전용**(가상화+핀=vN). UI 컨트롤은 `RowPinButton` 컴포넌트를 셀에 배치. |
| `enableRowReorder?` | `boolean` | 행 드래그 재정렬 활성 (default `false`). 데이터 행을 draggable 로 만들어 드롭 시 `onRowReorder(from, to)` 호출(소비자가 `moveRow(data, from, to)` 로 자기 data 적용). **정렬/필터 활성 시 자동 비활성**(표시순≠data순이라 재배열 모호) + **비-가상화 전용**(가상화 합성 = vN). HTML5 drag. |
| `enableSort?` | `boolean` | 정렬 활성 (default `false`) — `getSortedRowModel` wiring. |
| `enableVirtualization?` | `boolean` | 가상화 활성 (default `false`) — opt-in only. `true` 시 `useGridVirtualizer` wiring + tbody padding-row 패턴 적용. `false` 시 ~ markup 그대로 ( sticky/pinning 보존). |
| `floatingBottomRows?` | `TData[]` | 그리드 **하단**에 고정 표시할 소비자 공급 행 데이터. `floatingTopRows` 와 동일 규약(하단 sticky). |
| `floatingTopRows?` | `TData[]` | 그리드 **상단**에 고정 표시할 소비자 공급 행 데이터. XX Grid 의 `pinnedTopRowData` 와 동형 — 데이터 모델 *밖*의 추가 행(합계/요약 등). 컬럼 셀 렌더러(`columnDef.cell`)를 그대로 통과해 본문 행과 동일하게 표시되며, 본문이 스크롤돼도 `position: sticky` 로 고정된다. **집계 계산 안 함**: 소비자가 total 객체를 직접 제공(자동 집계는 `@topgrid/grid-pro-agg`/Pro). **상호작용 핀 아님**: 기존 행을 사용자가 핀하는 기능(`@topgrid/grid-pro-master`/Pro)과 별개. 미제공/빈 배열 → 렌더 없음(기존 동작 불변). |
| `getCellTooltip?` | `(…) => …` | 셀 툴팁. 셀마다 호출해 반환 문자열을 `<td title>` 로 부여(네이티브 hover 툴팁) — 잘린 내용 표시·부가 설명 등. `undefined`/`null`/`''` 반환 시 해당 셀 title 미부여. grid-core 1.0 : `(cell, row)` → `(ctx)` (clean GridCellContext). |
| `getRowId?` | `(…) => …` | 안정적 행 식별자. 미지정 시 행 키 = 배열 인덱스. 제공하면 `rowSelection`·`expanded` 등 모든 행-키 상태가 **인덱스가 아닌 이 id** 로 매겨져, 데이터 재정렬/교체를 가로질러 **동일 논리 행을 추적**(선택이 위치가 아닌 정체성을 따라감). cell 변경 flash 가 "같은 행"을 식별하는 토대. |
| `getSubRows?` | `(…) => …` | TanStack `getSubRows` — `enableExpanding=true` 시 사용. |
| `icons?` | `Partial<GridIcons>` | 정렬 표시 아이콘 glyph override(부분). 미지정은 기본(`▲▼⇅`)으로 fallback. |
| `loading?` | `boolean` | 로딩 상태. `true` 시 `<tbody>` 영역만 skeleton row 로 치환 (thead 보존 — ). |
| `loadingOverlay?` | `boolean` | 로딩 오버레이 (default `false`). `loading`(skeleton 치환)과 달리 **기존 data 행을 그대로 둔 채** 그 위에 반투명 오버레이를 덮는다(기존 데이터를 유지하며 갱신 중임을 표시). `aria-busy` + pointer-events 차단(하부 상호작용 막음). `loading`(skeleton)과 독립·additive — 둘 다 기존 동작 불변. |
| `loadingRowCount?` | `number` | 로딩 시 표시할 skeleton 행 개수. 미지정 시 `pagination.pageSize ?? 5` 로 fallback ( — BaseGrid L123 hardcoded `5` 와 호환). |
| `localeText?` | `Partial<GridLocale>` | grid chrome 문자열 현지화 — 부분 override. 미지정 키는 한국어 기본으로 fallback(raw key/undefined 안 냄). 영문화 예: `{ emptyText: 'No data', rowsPerPage: 'Rows per page:', totalCount: (n) => `$&#123;n} rows` }`. `defaultGridLocale` 를 import 해 위에 spread 도 가능. |
| `manualFiltering?` | `boolean` | Server 필터: `true` 시 클라이언트 필터 비활성(`getFilteredRowModel` skip + `manualFiltering`). default `false`. |
| `manualSorting?` | `boolean` | Server 정렬: `true` 시 클라이언트 정렬 비활성(`getSortedRowModel` skip + `manualSorting`). 정렬 *UI/state* 는 유지(헤더 클릭 → `onSortingChange`)되 실제 정렬은 서버 위임. default `false`. |
| `maxMultiSortColCount?` | `number` | 동시에 정렬 가능한 최대 컬럼 수. TanStack `maxMultiSortColCount` 에 직접 전달. 미설정 시 무제한. `enableMultiSort=false` 시 무시됨. |
| `onAddRow?` | `(…) => …` | 행 추가 콜백 — `ref.current.addRow(seed?)` 호출 시 invoke. controlled data 정책: parent 가 `props.data` 배열에 새 row append 책임. |
| `onCellClick?` | `(…) => …` | 셀 클릭 핸들러 — column-level 분기 의도 노출. grid-core 1.0 : `(cell, row, event)` → `(ctx, event)`. `ctx` 는 clean GridCellContext — `ctx.columnId`·`ctx.value`·`ctx.rowId`·`ctx.row`(=구 `row.original`). |
| `onCellKeyDown?` | `(…) => …` | 셀 키보드 이벤트 핸들러 — `<td onKeyDown>` 으로 wire. grid-core 1.0 : `(cell, row, event)` → `(ctx, event)` (clean GridCellContext). |
| `onColumnFiltersChange?` | `OnChangeFn<ColumnFiltersState>` | ColumnFilters state 변경 콜백 (server 필터 파라미터 도출용; internal state 도 갱신). |
| `onColumnOrderChange?` | `(…) => …` | 컬럼 순서 변경 완료 후 호출되는 콜백. 부모가 외부 state 동기화 가능.  : F-07-06 흡수. |
| `onColumnPinningChange?` | `OnChangeFn<ColumnPinningState>` | ColumnPinning state 변경 콜백 (외부 영속화 또는 controlled mirror 용). |
| `onColumnSizingChange?` | `OnChangeFn<ColumnSizingState>` | ColumnSizing state 변경 콜백 (외부 영속화 또는 controlled mirror 용). |
| `onDeleteRow?` | `(…) => …` | 행 삭제 콜백 — `ref.current.deleteRow(rowId)` 호출 시 invoke. `rowId` = TanStack `row.id` (default = row index string). |
| `onRowClick?` | `(…) => …` | 행 클릭 핸들러. |
| `onRowDoubleClick?` | `(…) => …` | 행 더블 클릭 핸들러 — `onRowClick` 와 동일한 시그니처 정책. |
| `onRowDragStart?` | `(…) => …` | 그리드 간 행 드래그 — 드래그 소스(default 없음=비활성). 제공 시 데이터 행이 draggable 이 되어 dragstart 시 `onRowDragStart(rowId)` 호출(`rowId` = TanStack `row.id`). 소비자가 드래그된 행 id 를 **두 그리드 위 state 로 들어올려** 보관한다(consumer-owns-payload, dataTransfer 미사용). 대상 그리드의 `onRowDrop` 과 짝. enableRowReorder 와 **별 opt-in**(같은 그리드서 혼용 금지=vN). OFF 시 byte-identical. |
| `onRowDrop?` | `(…) => …` | 그리드 간 행 드래그 — 드롭 타깃(default 없음=비활성). 제공 시 그리드 본문 영역이 drop target 이 되어(드롭 시) `onRowDrop` 호출. 소비자가 자기 `dragged` id 를 읽어 순수 `transferRow` 로 소스→타깃 data 를 적용한다. OFF 시 byte-identical. |
| `onRowReorder?` | `(…) => …` | 행 재정렬 드롭 콜백 — 표시 인덱스 `from`→`to`. 소비자가 `moveRow` 로 data 적용. |
| `onSortingChange?` | `OnChangeFn<SortingState>` | Sorting state 변경 콜백 (server 정렬 파라미터 도출용; internal state 도 갱신). |
| `onStartEditing?` | `(…) => …` | 프로그래밍적 편집 시작 콜백 — `ref.current.startEditing(rowId, colId)` 호출 시 invoke.  의 callback-delegating 패턴과 동일 정책: Grid 가 editing state 를 소유하지 않으며 application 이 EditableCell `isEditing` 갱신 책임. |
| `onUpdateRow?` | `(…) => …` | 행 부분 업데이트 콜백 — `ref.current.updateRow(rowId, patch)` 호출 시 invoke. |
| `pagination?` | `GridPaginationOptions` | 페이지네이션 세부 옵션 (`enablePagination=true` 일 때 효과). |
| `persistColumnOrder?` | `boolean` | 컬럼 순서 localStorage 영속화 활성. `true` + `columnOrderStorageKey` 지정 시 drag/keyboard 완료 후 localStorage 저장. mount 시 저장된 순서 복원 (`table.setColumnOrder`). |
| `renderFloatingFilter?` | `(…) => …` | Floating 필터 행 렌더 콜백. 지정 시 leaf 헤더행 아래 always-visible 필터 입력 행을 그린다(prop 존재=활성, `cellClassName` 관례 mirror). 컬럼당 1회 호출 — 보통 grid-features 의 floating 입력 컴포넌트(`column.setValue` 로 popover 와 동일 state 공유)를 반환. grid-core 는 구조 행 + 컬럼 윈도(가상화)·핀 sticky·ARIA 정합만 제공(grid-features 무의존=MIT). null 반환=빈 셀. grid-core 1.0 : `Column<TData,unknown>` → clean GridFilterColumn (`id`·`value`·`setValue` — TanStack 타입 없음). |
| `rowClassName?` | `RowClassNameCallback<TData>` | 행별 className 생성 callback. 모든 row 렌더 시 호출. 반환 string 은 `<tr>` 의 기본 className 에 append. **virtualization 주의**: `enableVirtualization=true` 시 `<tr ref={measureElement}>` 가 row height 측정 — `rowClassName` 이 dynamic height 변경을 유발하면 measureElement 의 reflow 가 반복 발생 (성능 저하). static className 권장. |
| `rowSelection?` | `RowSelectionMode \| GridRowSelectionOptions<TData>` | 행 선택 옵션. 단축 표기(`'multi'`) 또는 객체 표기 모두 지원. 'single'/'multi' 시 좌측 첫 컬럼에 체크박스 컬럼(`__select__`) 자동 prepend. |
| `showSortClearButton?` | `boolean` | 정렬 초기화 버튼 표시 여부. `true` 이고 `enableMultiSort=true` 일 때 툴바에 `<SortClearButton>` 렌더. 미설정(기본) 시 DOM 구조 변경 없음. |
| `sortDescFirst?` | `boolean` | 정렬 첫 클릭 방향을 내림차순으로. (TanStack `sortDescFirst` passthrough — 미지정 시 타입별 기본: 숫자=desc-first, 문자=asc-first.) |
| `theme?` | `Partial<GridTheme>` | grid chrome 색 테마(부분 override). 제공한 색만 root 에 inline `--topgrid-*` var 로 적용되고 각 surface 가 `var(--topgrid-x, <기본 hex>)` 로 읽는다. 미지정 키는 기본색 fallback. 다크 등 프리셋은 `import { darkTheme }` 후 spread. ⚠ CSS var 는 forced-colors(고대비)서 무력 (HC-safe 선택 표시는 별도 메커니즘). |
| `virtualizerOptions?` | `{ … }` | `useVirtualizer` 옵션 override. - `estimateSize`: 행 높이 추정 px (default `36`, BaseGrid `<td className="px-4 py-3">` 기준). - `overscan`: viewport 위/아래 버퍼 행 수 (default `10`, VirtualGrid.tsx:102 동일). - `onChange`: virtualizer 변경 콜백(가시 범위 관찰 — SSRM 의 블록 fetch 트리거).  `useVirtualizer` 에 그대로 전달. generic passthrough(SSRM 전용 로직 0). |
| `virtualScrollHeight?` | `number` | 가상화 시 scroll container 높이 (px, default `400`). `enableVirtualization=true` 일 때만 효과 발휘. |

### `GridRowSelectionOptions`

행 선택 옵션 (객체 형태).

`<Grid rowSelection="multi" />` 단축 표기 또는 `<Grid rowSelection={{ mode, onSelectionChange }} />` 객체 표기 모두 지원.

| 속성 | 타입 | 설명 |
|---|---|---|
| `mode?` | `RowSelectionMode` | 선택 모드 (default `'none'`). |
| `onSelectionChange?` | `(…) => …` | 선택 변경 콜백. 인자: 현재 선택된 행의 `row.original` 배열 (페이지·필터 기준). |
| `onStateChange?` | `OnChangeFn<RowSelectionState>` | Controlled state 변경 핸들러 (controlled 모드에서 필수). |
| `selectAllPages?` | `boolean` | : `'multi'` 헤더 전체선택 체크박스가 **모든 페이지**의 행을 선택/해제한다 (default `false` = 현재 페이지만). `true` 시 헤더 체크박스는 TanStack `getToggleAllRowsSelectedHandler`(전 페이지) + `getIsAllRowsSelected`/`getIsSomeRowsSelected` 를 사용한다. XX Grid 의 "select all across all pages" 대응. |
| `state?` | `RowSelectionState` | Controlled — 외부에서 RowSelectionState 직접 제어할 때 사용. 미지정 시 internal state 사용 (uncontrolled). |

### `GridState`

`useGridState<TData>` 반환 타입 — 8 TanStack state + 8 setter.

8개 grid variant(BaseGrid/VirtualGrid/...) 에서 중복 선언되던 `useState<StateType>`
패턴을 한 번에 흡수하기 위한 통합 반환 타입.

`TData`는 현재 미사용 ( controlled mode 확장 시 활용).

| 속성 | 타입 | 설명 |
|---|---|---|
| `columnFilters` | `ColumnFiltersState` | 컬럼 필터 state (TanStack `ColumnFiltersState`). 기본값 `[]`. |
| `columnOrder` | `ColumnOrderState` | 컬럼 순서 state (TanStack `ColumnOrderState`). 기본값 `[]`. |
| `columnPinning` | `ColumnPinningState` | 컬럼 핀 state (TanStack `ColumnPinningState`). 기본값 `{}`. |
| `columnSizing` | `ColumnSizingState` | 컬럼 너비 state (TanStack `ColumnSizingState`). 기본값 `{}`. |
| `columnVisibility` | `VisibilityState` | 컬럼 표시 state (TanStack `VisibilityState`). 기본값 `{}`. |
| `pagination` | `PaginationState` | 페이지네이션 state (TanStack `PaginationState`). 기본값 `{ pageIndex: 0, pageSize: 10 }`. |
| `resetSection` | `(…) => …` | 특정 state 키(들)를 `initialState`로 복원. |
| `resetState` | `(…) => …` | 모든 state를 `initialState`로 복원. - uncontrolled 모드: `initialState` 제공 시 해당 키 값으로, 미제공 시 각 키의 기본값으로 복원  (`sorting: []`, `columnFilters: []`, `rowSelection: {}`,  `pagination: { pageIndex: 0, pageSize: 10 }`,  `columnPinning: {}`, `columnOrder: []`, `columnSizing: {}`, `columnVisibility: {}`) - controlled 모드 키: setter 가 `onChange` 만 호출 → 외부 핸들러가 controlled state 갱신 책임  (`useControllableState` — `isControlled` 분기에서 내부 setInternalValue 호출 안 함) `initialState` 는 mount 시 1회 캡처 (`useRef`) — 이후 prop 변경 무시. |
| `rowSelection` | `RowSelectionState` | 행 선택 state (TanStack `RowSelectionState`). 기본값 `{}`. |
| `setColumnFilters` | `OnChangeFn<ColumnFiltersState>` | 컬럼 필터 setter. |
| `setColumnOrder` | `OnChangeFn<ColumnOrderState>` | 컬럼 순서 setter. |
| `setColumnPinning` | `OnChangeFn<ColumnPinningState>` | 컬럼 핀 setter. |
| `setColumnSizing` | `OnChangeFn<ColumnSizingState>` | 컬럼 너비 setter. |
| `setColumnVisibility` | `OnChangeFn<VisibilityState>` | 컬럼 표시 setter. |
| `setPagination` | `OnChangeFn<PaginationState>` | 페이지네이션 setter. |
| `setRowSelection` | `OnChangeFn<RowSelectionState>` | 행 선택 setter. |
| `setSorting` | `OnChangeFn<SortingState>` | 정렬 setter — TanStack `OnChangeFn<SortingState>` (T 또는 updater 함수). |
| `sorting` | `SortingState` | 정렬 state (TanStack `SortingState`). 기본값 `[]`. |

### `GridStateValues`

8개 표준 grid state 값.

| 속성 | 타입 | 설명 |
|---|---|---|
| `columnFilters` | `ColumnFiltersState` |  |
| `columnOrder` | `ColumnOrderState` |  |
| `columnPinning` | `ColumnPinningState` |  |
| `columnSizing` | `ColumnSizingState` |  |
| `columnVisibility` | `VisibilityState` |  |
| `pagination` | `PaginationState` |  |
| `rowSelection` | `RowSelectionState` |  |
| `sorting` | `SortingState` |  |

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

### `IconCellProps`

Props for IconCell.

Absorbs legacy IconCell. The icon is a
`ReactNode` prop ( — no lucide-react / react-icons peer added).
Consumers inject their own icon component instance.

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` | Additional Tailwind className appended to the outer element. |
| `color?` | `string` | Tailwind text-colour class for the icon (L0 default `'text-gray-500'`). |
| `icon` | `ReactNode` | Icon ReactNode — caller supplies the icon component instance. |
| `label?` | `string` | Optional supporting text (L0 L5 preserved). |
| `onClick?` | `(…) => …` | Optional click callback — when provided, renders `<button>`, else `<span>` (L0 L6 preserved). |

### `LicenseCheckResult`

`checkLicense` 반환 타입.
watermarkRequired: true → Pro grid 워터마크 표시 필요.
expiryWarning: 'soon-expiring' → 60일 이내 만료 (console.warn 발생).

| 속성 | 타입 | 설명 |
|---|---|---|
| `expiresAt?` | `Date` |  |
| `expiryWarning?` | `"soon-expiring"` |  |
| `reason?` | `LicenseReason` |  |
| `valid` | `boolean` |  |
| `watermarkRequired` | `boolean` |  |

### `LicenseStatus`

| 속성 | 타입 | 설명 |
|---|---|---|
| `domain?` | `string` |  |
| `expiresAt?` | `Date` |  |
| `reason?` | `LicenseReason` |  |
| `valid` | `boolean` |  |

### `LinkCellProps`

Props for LinkCell.

Absorbs legacy LinkCell.
- `onClick` weakened from required to optional (additive — Section 2.2 risk-bound).
- `href` added (additive — href|onClick union).
- `value` added as preferred prop; `label` retained as deprecated alias ( amendment).

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` | Additional Tailwind className appended to the rendered element. |
| `href?` | `string` | Link URL. When provided, renders `<a href>`; otherwise renders `<button>` (or `<span>`). |
| `label?` | `string` |  |
| `onClick?` | `(…) => …` | Click callback. Used when href is undefined (L0 preserved). |
| `value?` | `string` | Display text. Preferred prop ( amendment). |

### `MakeCopyCellItemOptions`

| 속성 | 타입 | 설명 |
|---|---|---|
| `icon?` | `ReactNode` | Override the leading icon. |
| `label?` | `string` | Override the menu label. |

### `MakeExportItemOptions`

| 속성 | 타입 | 설명 |
|---|---|---|
| `columns` | `ExcelColumn[]` | Column spec (key/header/width/format). |
| `exporter?` | `(…) => …` | Injectable exporter — defaults to the grid-export exporter for the chosen format. Tests pass a spy to assert invocation without a real download. |
| `exportOptions?` | `ExportItemOptions` | Passed through to the chosen exporter (fileName/etc; format-specific fields). |
| `format?` | `ExportFormat` | Export format — picks the matching row-array exporter + default label. |
| `icon?` | `ReactNode` | Override the leading icon. |
| `label?` | `string` | Override the menu label. |
| `rows` | `TData[]` | Rows to export (the dataset the consumer passed to the grid). |

### `MappedRow`

Mapped row shape produced by `buildChangeSet` / `getChangeSet`.
Keys correspond to BE field names after `Mapping<TData>` is applied.
When no mapping is provided the keys mirror the original `TData` fields.

### `MasterDetailGridProps`

Props for `<MasterDetailGrid>`.

Extends `GridProps<TData>` with Master-Detail specific props.

| 속성 | 타입 | 설명 |
|---|---|---|
| `alwaysMultiSort?` | `boolean` | 평범 클릭으로도 다중 정렬 누적. `enableMultiSort` 와 함께 사용. 기본은 Shift+클릭이 다중 정렬 키지만, `true` 면 **Shift 없이** 컬럼을 순차 클릭해 누적. (TanStack `isMultiSortEvent: => true` passthrough.) |
| `autoSelectFirstRow?` | `boolean` | 데이터 로드 후 첫 행 자동 선택 (default `false`). |
| `cellClassName?` | `CellClassNameCallback<TData>` | 셀별 className 생성 callback. 모든 cell 렌더 시 호출. 반환 string 은 `<td>` 의 기본 className 에 append. **canonical**: 본 callback type 은 grid-core 가 ownership. grid-renderers 는 type-only re-export. **사용 예** (publish/organizeSchedule 등가): ```tsx cellClassName={(cell) => {  if (!cell.column.id.startsWith('d')) return '';  const isSelected = cell.row.getIsSelected;  const hasValue = cell.getValue != null && cell.getValue !== '';  return [  isSelected && 'bg-indigo-100',  !isSelected && hasValue && 'bg-yellow-50',  ].filter(Boolean).join(' '); }} ``` **성능 주의**: 매 cell 렌더마다 호출 — 대용량 데이터 시 callback 내부 계산 비용 주의 (useMemo 또는 stable callback 권장). |
| `className?` | `string` | 외곽 wrapper className (Tailwind). |
| `columnOrderStorageKey?` | `string` | `persistColumnOrder=true` 시 사용할 localStorage 키. 빈 문자열(`''`) 전달 시 localStorage 접근 없음. 미지정 시 `persistColumnOrder=true` 라도 저장 skip. |
| `columnPersistence?` | `ColumnPersistenceOptions` | 컬럼 가시성 + 순서 localStorage 영속화 옵션. - 제공 시 `<ColumnVisibilityMenu>` UI 자동 렌더 + `useColumnPersistence` 활성. - 미제공(`undefined`) 시 영속화 비활성 + 메뉴 미표시 ( backward compat). - `storageKey: ''` 시 localStorage 접근 없음 (NFR-006). |
| `columnResizeMode?` | `GridColumnResizeMode` | 컬럼 리사이즈 모드 (default `'onChange'`). `enableColumnResizing=true` 일 때만 효과 발휘. |
| `columns` | `ColumnDef<TData, unknown>[]` | 컬럼 정의 (TanStack `ColumnDef`). |
| `data` | `TData[]` | 행 데이터 배열. |
| `debug?` | `boolean` | TanStack `debugTable` 옵션 노출 (default `false`). |
| `defaultColumnPinning?` | `ColumnPinningState` | 컬럼 핀 uncontrolled 초기값 (`{ left: string[]; right: string[] }`). ColumnPinGrid `pinLeft` / `pinRight` alias 매핑 진입점. |
| `defaultColumnSizing?` | `ColumnSizingState` | 컬럼 width uncontrolled 초기값 (column id → px). mount 시 internal `columnSizing` state 의 초기값으로 사용 (uncontrolled 패턴). |
| `defaultExpanded?` | `false \| ExpandedState` | `enableExpanding=true` 시 expanded state 초기값 (uncontrolled). - `true` = 전체 펼침 - `Record<string, boolean>` = 특정 row id만 펼침 - 미지정 = `{}` (전체 접힘)  — TreeGrid alias `expandAll={true}` 호환 진입점. AS-IS TreeGrid.tsx:35 `useState<ExpandedState>(initialExpandAll ? true : {})` initial seed 패턴 보존. |
| `emptyState?` | `ReactNode` | 빈 결과 상태 ReactNode slot. 제공 시 `emptyText` 보다 우선 렌더 ( — slot → text → defaultText 순). |
| `emptyText?` | `string` | 빈 결과 안내 텍스트 (default `'데이터가 없습니다.'`). |
| `enableCellChangeFlash?` | `boolean` | 셀 값 변경 시 잠깐 강조(change-flash). `data` 가 바뀌면 **값이 실제로 변한 셀**(행 정체성으로 diff — 재정렬은 미강조)에 ~0.9s 배경 하이라이트. 안정적 강조를 위해 `getRowId` 를 함께 지정 권장(미지정 시 인덱스 기준 diff → 재정렬도 강조됨). |
| `enableColumnPinning?` | `boolean` | 컬럼 핀 state 활성 (default `false`). 본 은 `state.columnPinning` state 만 활성화. sticky CSS 외관은 범위. |
| `enableColumnReorder?` | `boolean` | 컬럼 드래그 재정렬 활성 (default `false`). HTML5 Drag and Drop API 기반 — 외부 dnd 라이브러리 미사용.  :. |
| `enableColumnResizing?` | `boolean` | 컬럼 리사이즈 state 활성 (default `false`). resize handle UI 는 범위. |
| `enableColumnVirtualization?` | `boolean` | 컬럼(가로) 가상화 활성. `true` 시 화면 밖 **center** 컬럼은 렌더하지 않고 좌/우 padding 셀로 가로 스크롤 폭만 유지한다 — 100+ 컬럼의 렌더 비용 절감. **핀 컬럼은 가상화 대상이 아니며 가로 스크롤과 무관하게 항상 렌더된다.** 미지정/`false` → 전 컬럼 렌더(기존 동작과 byte-identical). **v1 제약**: **flat(단일 행) 헤더 전용** — 그룹/다단 헤더(`getHeaderGroups.length > 1`)에서는 colSpan 회계 복잡도로 자동 비활성(전 컬럼 렌더). 그룹 헤더 가상화는 v2. **레이아웃**: `true` 시 `<table>` 은 `table-layout: fixed` + 전체 컬럼 폭(Σ`getSize`)으로 고정되어 컬럼이 명시 너비를 정확히 유지한다(pad px 와 정렬 일치). 부수효과로 **셀 내용이 컬럼 너비를 넘으면 잘린다(clip)** — 가상화 그리드의 정상 거동. 가로 스크롤 컨테이너는 기존 `overflow-x-auto`(또는 행 가상화의 `overflow:auto`)가 제공하므로 Tailwind 미적용 소비자는 컨테이너에 `overflow-x` 를 직접 지정해야 한다. **⚠️ 실험적**: 본문+헤더 가상화 배선 + chromium 정렬 매트릭스 완료(Commit C). off=기존과 byte-identical, SSR/미측정 시 전 컬럼 렌더(안전 fallback). |
| `enableExpanding?` | `boolean` | 행 펼침(expanding) state 활성 (default `false`) — TreeGrid 흡수. `getSubRows` 와 함께 사용. |
| `enableFilter?` | `boolean` | 컬럼 필터 활성 (default `false`) — `getFilteredRowModel` wiring. |
| `enableMultiSort?` | `boolean` | 다중 정렬 활성 (default `false`) — TanStack `enableMultiSort` 위임. |
| `enablePagination?` | `boolean` | 페이지네이션 활성 (default `false`) — `getPaginationRowModel` wiring. |
| `enableRowClickSelection?` | `boolean` | 행 본문 클릭으로 선택. `rowSelection` 이 `'single'`/`'multi'` 일 때만 동작. - plain 클릭 → 그 행만 선택(나머지 해제). ctrl/cmd+클릭 → 토글(다중 누적). (shift 범위 = ) - 기존 `onRowClick` 콜백과 **독립 공존** — 선택을 하면서 `onRowClick` 도 그대로 호출. - 체크박스 셀(`__select__`) 클릭은 `stopPropagation` 으로 이 경로를 안 탐(기존 동작 보존). |
| `enableRowPinning?` | `boolean` | 행 고정. 사용자가 데이터 행을 상/하단에 고정(`row.pin('top'\|'bottom')`). 고정 행은 sticky 로 스크롤 중 고정되고 center 행에서 제외된다. **비-가상화 전용**(가상화+핀=vN). UI 컨트롤은 `RowPinButton` 컴포넌트를 셀에 배치. |
| `enableRowReorder?` | `boolean` | 행 드래그 재정렬 활성 (default `false`). 데이터 행을 draggable 로 만들어 드롭 시 `onRowReorder(from, to)` 호출(소비자가 `moveRow(data, from, to)` 로 자기 data 적용). **정렬/필터 활성 시 자동 비활성**(표시순≠data순이라 재배열 모호) + **비-가상화 전용**(가상화 합성 = vN). HTML5 drag. |
| `enableSort?` | `boolean` | 정렬 활성 (default `false`) — `getSortedRowModel` wiring. |
| `enableVirtualization?` | `boolean` | 가상화 활성 (default `false`) — opt-in only. `true` 시 `useGridVirtualizer` wiring + tbody padding-row 패턴 적용. `false` 시 ~ markup 그대로 ( sticky/pinning 보존). |
| `estimatedRowHeight?` | `number` | : row virtualization for large master-detail datasets (`@tanstack/react-virtual`). Each master row (+ its expanded detail) is a measured `<tbody>` so the virtualizer **dynamically measures** variable-height detail panels (`measureElement`), not a fixed estimate. `enableVirtualization` is inherited from `GridProps`. OFF = the plain non-virtualized table (byte-identical). |
| `floatingBottomRows?` | `TData[]` | 그리드 **하단**에 고정 표시할 소비자 공급 행 데이터. `floatingTopRows` 와 동일 규약(하단 sticky). |
| `floatingTopRows?` | `TData[]` | 그리드 **상단**에 고정 표시할 소비자 공급 행 데이터. XX Grid 의 `pinnedTopRowData` 와 동형 — 데이터 모델 *밖*의 추가 행(합계/요약 등). 컬럼 셀 렌더러(`columnDef.cell`)를 그대로 통과해 본문 행과 동일하게 표시되며, 본문이 스크롤돼도 `position: sticky` 로 고정된다. **집계 계산 안 함**: 소비자가 total 객체를 직접 제공(자동 집계는 `@topgrid/grid-pro-agg`/Pro). **상호작용 핀 아님**: 기존 행을 사용자가 핀하는 기능(`@topgrid/grid-pro-master`/Pro)과 별개. 미제공/빈 배열 → 렌더 없음(기존 동작 불변). |
| `getCellTooltip?` | `(…) => …` | 셀 툴팁. 셀마다 호출해 반환 문자열을 `<td title>` 로 부여(네이티브 hover 툴팁) — 잘린 내용 표시·부가 설명 등. `undefined`/`null`/`''` 반환 시 해당 셀 title 미부여. grid-core 1.0 : `(cell, row)` → `(ctx)` (clean GridCellContext). |
| `getRowId?` | `(…) => …` | 안정적 행 식별자. 미지정 시 행 키 = 배열 인덱스. 제공하면 `rowSelection`·`expanded` 등 모든 행-키 상태가 **인덱스가 아닌 이 id** 로 매겨져, 데이터 재정렬/교체를 가로질러 **동일 논리 행을 추적**(선택이 위치가 아닌 정체성을 따라감). cell 변경 flash 가 "같은 행"을 식별하는 토대. |
| `getSubRows?` | `(…) => …` | TanStack `getSubRows` — `enableExpanding=true` 시 사용. |
| `icons?` | `Partial<GridIcons>` | 정렬 표시 아이콘 glyph override(부분). 미지정은 기본(`▲▼⇅`)으로 fallback. |
| `loading?` | `boolean` | 로딩 상태. `true` 시 `<tbody>` 영역만 skeleton row 로 치환 (thead 보존 — ). |
| `loadingOverlay?` | `boolean` | 로딩 오버레이 (default `false`). `loading`(skeleton 치환)과 달리 **기존 data 행을 그대로 둔 채** 그 위에 반투명 오버레이를 덮는다(기존 데이터를 유지하며 갱신 중임을 표시). `aria-busy` + pointer-events 차단(하부 상호작용 막음). `loading`(skeleton)과 독립·additive — 둘 다 기존 동작 불변. |
| `loadingRowCount?` | `number` | 로딩 시 표시할 skeleton 행 개수. 미지정 시 `pagination.pageSize ?? 5` 로 fallback ( — BaseGrid L123 hardcoded `5` 와 호환). |
| `localeText?` | `Partial<GridLocale>` | grid chrome 문자열 현지화 — 부분 override. 미지정 키는 한국어 기본으로 fallback(raw key/undefined 안 냄). 영문화 예: `{ emptyText: 'No data', rowsPerPage: 'Rows per page:', totalCount: (n) => `$&#123;n} rows` }`. `defaultGridLocale` 를 import 해 위에 spread 도 가능. |
| `manualFiltering?` | `boolean` | Server 필터: `true` 시 클라이언트 필터 비활성(`getFilteredRowModel` skip + `manualFiltering`). default `false`. |
| `manualSorting?` | `boolean` | Server 정렬: `true` 시 클라이언트 정렬 비활성(`getSortedRowModel` skip + `manualSorting`). 정렬 *UI/state* 는 유지(헤더 클릭 → `onSortingChange`)되 실제 정렬은 서버 위임. default `false`. |
| `masterDetail?` | `MasterDetailOptions<TData>` | Master-Detail expansion options (controlled/uncontrolled state). |
| `maxMultiSortColCount?` | `number` | 동시에 정렬 가능한 최대 컬럼 수. TanStack `maxMultiSortColCount` 에 직접 전달. 미설정 시 무제한. `enableMultiSort=false` 시 무시됨. |
| `onAddRow?` | `(…) => …` | 행 추가 콜백 — `ref.current.addRow(seed?)` 호출 시 invoke. controlled data 정책: parent 가 `props.data` 배열에 새 row append 책임. |
| `onCellClick?` | `(…) => …` | 셀 클릭 핸들러 — column-level 분기 의도 노출. grid-core 1.0 : `(cell, row, event)` → `(ctx, event)`. `ctx` 는 clean GridCellContext — `ctx.columnId`·`ctx.value`·`ctx.rowId`·`ctx.row`(=구 `row.original`). |
| `onCellKeyDown?` | `(…) => …` | 셀 키보드 이벤트 핸들러 — `<td onKeyDown>` 으로 wire. grid-core 1.0 : `(cell, row, event)` → `(ctx, event)` (clean GridCellContext). |
| `onColumnFiltersChange?` | `OnChangeFn<ColumnFiltersState>` | ColumnFilters state 변경 콜백 (server 필터 파라미터 도출용; internal state 도 갱신). |
| `onColumnOrderChange?` | `(…) => …` | 컬럼 순서 변경 완료 후 호출되는 콜백. 부모가 외부 state 동기화 가능.  : F-07-06 흡수. |
| `onColumnPinningChange?` | `OnChangeFn<ColumnPinningState>` | ColumnPinning state 변경 콜백 (외부 영속화 또는 controlled mirror 용). |
| `onColumnSizingChange?` | `OnChangeFn<ColumnSizingState>` | ColumnSizing state 변경 콜백 (외부 영속화 또는 controlled mirror 용). |
| `onDeleteRow?` | `(…) => …` | 행 삭제 콜백 — `ref.current.deleteRow(rowId)` 호출 시 invoke. `rowId` = TanStack `row.id` (default = row index string). |
| `onRowClick?` | `(…) => …` | 행 클릭 핸들러. |
| `onRowDoubleClick?` | `(…) => …` | 행 더블 클릭 핸들러 — `onRowClick` 와 동일한 시그니처 정책. |
| `onRowDragStart?` | `(…) => …` | 그리드 간 행 드래그 — 드래그 소스(default 없음=비활성). 제공 시 데이터 행이 draggable 이 되어 dragstart 시 `onRowDragStart(rowId)` 호출(`rowId` = TanStack `row.id`). 소비자가 드래그된 행 id 를 **두 그리드 위 state 로 들어올려** 보관한다(consumer-owns-payload, dataTransfer 미사용). 대상 그리드의 `onRowDrop` 과 짝. enableRowReorder 와 **별 opt-in**(같은 그리드서 혼용 금지=vN). OFF 시 byte-identical. |
| `onRowDrop?` | `(…) => …` | 그리드 간 행 드래그 — 드롭 타깃(default 없음=비활성). 제공 시 그리드 본문 영역이 drop target 이 되어(드롭 시) `onRowDrop` 호출. 소비자가 자기 `dragged` id 를 읽어 순수 `transferRow` 로 소스→타깃 data 를 적용한다. OFF 시 byte-identical. |
| `onRowReorder?` | `(…) => …` | 행 재정렬 드롭 콜백 — 표시 인덱스 `from`→`to`. 소비자가 `moveRow` 로 data 적용. |
| `onSortingChange?` | `OnChangeFn<SortingState>` | Sorting state 변경 콜백 (server 정렬 파라미터 도출용; internal state 도 갱신). |
| `onStartEditing?` | `(…) => …` | 프로그래밍적 편집 시작 콜백 — `ref.current.startEditing(rowId, colId)` 호출 시 invoke.  의 callback-delegating 패턴과 동일 정책: Grid 가 editing state 를 소유하지 않으며 application 이 EditableCell `isEditing` 갱신 책임. |
| `onUpdateRow?` | `(…) => …` | 행 부분 업데이트 콜백 — `ref.current.updateRow(rowId, patch)` 호출 시 invoke. |
| `pagination?` | `GridPaginationOptions` | 페이지네이션 세부 옵션 (`enablePagination=true` 일 때 효과). |
| `persistColumnOrder?` | `boolean` | 컬럼 순서 localStorage 영속화 활성. `true` + `columnOrderStorageKey` 지정 시 drag/keyboard 완료 후 localStorage 저장. mount 시 저장된 순서 복원 (`table.setColumnOrder`). |
| `renderDetailRow?` | `RenderDetailRow<TData>` | Detail row render function. When provided, each row gains an expand toggle in the first column. Clicking the toggle reveals a full-width detail row rendered by this function. When absent, the grid renders as a standard flat grid without expand toggles. |
| `renderFloatingFilter?` | `(…) => …` | Floating 필터 행 렌더 콜백. 지정 시 leaf 헤더행 아래 always-visible 필터 입력 행을 그린다(prop 존재=활성, `cellClassName` 관례 mirror). 컬럼당 1회 호출 — 보통 grid-features 의 floating 입력 컴포넌트(`column.setValue` 로 popover 와 동일 state 공유)를 반환. grid-core 는 구조 행 + 컬럼 윈도(가상화)·핀 sticky·ARIA 정합만 제공(grid-features 무의존=MIT). null 반환=빈 셀. grid-core 1.0 : `Column<TData,unknown>` → clean GridFilterColumn (`id`·`value`·`setValue` — TanStack 타입 없음). |
| `rowClassName?` | `RowClassNameCallback<TData>` | 행별 className 생성 callback. 모든 row 렌더 시 호출. 반환 string 은 `<tr>` 의 기본 className 에 append. **virtualization 주의**: `enableVirtualization=true` 시 `<tr ref={measureElement}>` 가 row height 측정 — `rowClassName` 이 dynamic height 변경을 유발하면 measureElement 의 reflow 가 반복 발생 (성능 저하). static className 권장. |
| `rowSelection?` | `RowSelectionMode \| GridRowSelectionOptions<TData>` | 행 선택 옵션. 단축 표기(`'multi'`) 또는 객체 표기 모두 지원. 'single'/'multi' 시 좌측 첫 컬럼에 체크박스 컬럼(`__select__`) 자동 prepend. |
| `showSortClearButton?` | `boolean` | 정렬 초기화 버튼 표시 여부. `true` 이고 `enableMultiSort=true` 일 때 툴바에 `<SortClearButton>` 렌더. 미설정(기본) 시 DOM 구조 변경 없음. |
| `sortDescFirst?` | `boolean` | 정렬 첫 클릭 방향을 내림차순으로. (TanStack `sortDescFirst` passthrough — 미지정 시 타입별 기본: 숫자=desc-first, 문자=asc-first.) |
| `theme?` | `Partial<GridTheme>` | grid chrome 색 테마(부분 override). 제공한 색만 root 에 inline `--topgrid-*` var 로 적용되고 각 surface 가 `var(--topgrid-x, <기본 hex>)` 로 읽는다. 미지정 키는 기본색 fallback. 다크 등 프리셋은 `import { darkTheme }` 후 spread. ⚠ CSS var 는 forced-colors(고대비)서 무력 (HC-safe 선택 표시는 별도 메커니즘). |
| `virtualizerOptions?` | `{ … }` | `useVirtualizer` 옵션 override. - `estimateSize`: 행 높이 추정 px (default `36`, BaseGrid `<td className="px-4 py-3">` 기준). - `overscan`: viewport 위/아래 버퍼 행 수 (default `10`, VirtualGrid.tsx:102 동일). - `onChange`: virtualizer 변경 콜백(가시 범위 관찰 — SSRM 의 블록 fetch 트리거).  `useVirtualizer` 에 그대로 전달. generic passthrough(SSRM 전용 로직 0). |
| `virtualMaxHeight?` | `number` | : scroll-container max height (px) when `enableVirtualization` is on. |
| `virtualScrollHeight?` | `number` | 가상화 시 scroll container 높이 (px, default `400`). `enableVirtualization=true` 일 때만 효과 발휘. |

### `MasterDetailOptions`

Master-Detail expansion options.

| 속성 | 타입 | 설명 |
|---|---|---|
| `expandedRowKeys?` | `string[]` | Controlled expanded row key array. When provided, the component is in controlled mode — expanded state is driven externally. Keys correspond to TanStack `row.id` values. When absent, internal `useState<ExpandedState>` manages state (uncontrolled). |
| `onExpandChange?` | `(…) => …` | Callback fired when expanded rows change. In controlled mode, the parent must update `expandedRowKeys` from this callback. |

### `MatrixChartData`

| 속성 | 타입 | 설명 |
|---|---|---|
| `categories` | `string[]` | x-axis category labels for the chosen orientation. |
| `series` | `ChartSeries[]` | Series ready to hand to RangeChart. |

### `MatrixInput`

Matrix → chart series bridge — pure, zero-dependency, node-testable.

★ This is the single transform behind BOTH "chart from a selected cell range" and "chart a pivot
result": each reduces to a 2-D matrix of numbers with row + column labels. Keeping ONE pure
function (no grid/pivot import) means the orientation logic is proven once in node, and the live
wiring (which cells are selected / which pivot rows) stays a thin caller concern.

No chart library, no React, no grid coupling (/AP-001).

| 속성 | 타입 | 설명 |
|---|---|---|
| `categories` | `string[]` | Row labels — the x-axis categories when orientation is `'columns'`. |
| `colors?` | `string[]` | Optional colour per produced series (by series index). |
| `columns` | `string[]` | Column labels — the series names when orientation is `'columns'`. |
| `matrix` | `number[][]` | `matrix[rowIndex][colIndex]` numeric value. Non-finite entries are kept (the chart gaps them). |
| `orientation?` | `"columns" \| "rows"` | Which axis becomes a series: - `'columns'` (default): each COLUMN is a series (values read down the rows); x = row labels. - `'rows'`: each ROW is a series (values read across the columns); x = column labels. |

### `MergingGridProps`

MergingGrid 컴포넌트 Props.

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` | table 엘리먼트에 적용할 CSS className |
| `columns` | `MergingColumnDef<TData>[]` | 컬럼 정의 (MergingColumnDef 확장 포함) |
| `data` | `TData[]` | 렌더링할 데이터 배열 |
| `enableColSpan?` | `boolean` | 본문 셀 가로 병합(colSpan) 활성화. `false`(기본값)이면 colSpan 비활성 — colSpan 속성/피복 셀 0 (byte-identical). `true`이면 `meta.colSpan` 콜백이 설정된 컬럼에서 가로 병합 자동 계산. mergeRows(rowSpan)와 독립 — 동일 셀에 둘 다 적용하는 조합은 범위 밖(vN). |
| `enableMerging?` | `boolean` | 병합 기능 활성화. `false`(기본값)이면 일반 Grid 동작 보존 ( / ). `true`이면 `meta.mergeRows`가 설정된 컬럼에서 rowSpan 자동 계산. |
| `enableVirtualization?` | `boolean` | 가상화 활성화 ( 호환). `true` 시 @tanstack/react-virtual useVirtualizer 사용. `false`(기본값) 시 / full DOM 렌더링 경로 유지. |
| `estimatedRowHeight?` | `number` | 가상화 시 행 높이 추정값 (px). 기본값: 40. `enableVirtualization=true` 시에만 사용. ⚠️ 고정 행 높이 가정 — 가변 행 높이 환경에서는 scrollOffset 오차 발생 가능. |
| `virtualOverscan?` | `number` | react-virtual overscan 행 수. 기본값: 5. visible window 양쪽에 추가로 렌더링할 행 수. `enableVirtualization=true` 시에만 사용. |

### `MultiFilterValue`

compound 필터 값 — 컬럼당 배타적(단일 필터의 값 shape 와 호환 안 됨; multi*FilterFn 전용).

| 속성 | 타입 | 설명 |
|---|---|---|
| `conditions` | `C[]` | 조건 목록(각 조건 = base FilterFn 의 값 shape). 일반적으로 N개(UI 는 2개 출하). |
| `logic` | `"and" \| "or"` | 조건 결합 논리. |

### `MultiRowHeaderProps`

Props for `MultiRowHeader`.

| 속성 | 타입 | 설명 |
|---|---|---|
| `enableGroupToggle?` | `boolean` | When true, group header cells (non-leaf) become clickable toggles that show/hide all child (leaf) columns at once. Clicking a group header that has all leaves hidden will show them all; clicking one with any visible leaf will hide them all. Leaf columns retain their sort click handler regardless. Default: false (/ behaviour preserved — breaking: false). |
| `enableStickyHeader?` | `boolean` | When true, applies sticky positioning to each header row so the multi-row header remains fixed at the viewport top during vertical scroll. Default: false ( behaviour preserved — breaking: false). |
| `frozenColumns?` | `number` | Number of columns pinned on the left that should receive `sticky left` positioning. Acts as an on/off switch; the actual frozen column identities are determined from TanStack's `columnPinning.left` state via `column.getIsPinned === 'left'` (decision). 0 or omitted: frozen positioning inactive. |
| `table` | `Table<TData>` | The TanStack table instance. Provides `getHeaderGroups` used for multi-row header rendering. |

### `MultiSheetOptions`

`exportSheetsToExcel` 옵션

| 속성 | 타입 | 설명 |
|---|---|---|
| `fileName?` | `string` | 다운로드 파일명 (확장자 없으면.xlsx 자동 추가) |

### `NumberCellProps`

Props for NumberCell.

Preserves L0 NumberCell.tsx (L1-7) prop signature in full — no drift.

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` | Additional Tailwind className. |
| `colorNegative?` | `boolean` | Apply red-600 to negative values (default false). L0 NumberCell.tsx:6. |
| `decimals?` | `number` | Decimal places (default 0). L0 NumberCell.tsx:3 preserved. |
| `locale?` | `string` | Locale tag (default 'ko-KR'). L0 NumberCell.tsx:5. |
| `unit?` | `string` | Unit suffix (default ''). L0 NumberCell.tsx:4. |
| `value` | `undefined \| null \| number` | Numeric value. null/undefined/NaN → dash placeholder. |

### `NumberFilterProps`

NumberFilter 컴포넌트 Props.

| 속성 | 타입 | 설명 |
|---|---|---|
| `column` | `Column<TData, unknown>` | TanStack Column 인스턴스. Column&lt;TData, unknown>. |
| `defaultOperator?` | `NumberFilterOperator` | 기본 연산자 — 기본 '='. : optional prop. |
| `popoverAlign?` | `"left" \| "right"` | 팝오버 정렬 — 기본 'left'. : optional prop — FilterPopover align으로 spread-skip 전달. |

### `NumberFilterValue`

| 속성 | 타입 | 설명 |
|---|---|---|
| `max?` | `number` |  |
| `min?` | `number` |  |
| `operator` | `NumberFilterOperator` |  |
| `value?` | `number` |  |

### `PageSizeSelectProps`

`PageSizeSelect` props.

| 속성 | 타입 | 설명 |
|---|---|---|
| `label?` | `string` | "페이지당 행 수:" 라벨 (i18n — ). 미지정 시 한국어 기본. |
| `onPageSizeChange` | `(…) => …` | pageSize 변경 콜백. |
| `pageSize` | `number` | 현재 pageSize. |
| `pageSizeOptions` | `number[]` | 선택 가능한 pageSize 옵션 목록. |

### `PasteResult`

붙여넣기 결과 메타정보 ( 보완 — ).
cells: 파싱된 CellUpdate 배열 (onPaste callback에 전달).
truncated: true이면 grid 경계 초과로 일부 셀 클램프됨.
rows: TSV 파싱 행 수.
cols: TSV 파싱 열 수.

| 속성 | 타입 | 설명 |
|---|---|---|
| `cells` | `CellUpdate<TCell>[]` |  |
| `cols` | `number` |  |
| `rows` | `number` |  |
| `truncated` | `boolean` |  |

### `PDFExportOptions`

PDF export 옵션

| 속성 | 타입 | 설명 |
|---|---|---|
| `emptyBehavior?` | `EmptyBehavior` | 데이터 행 0건 시 동작 - 'skip': 파일 생성 안 함 (기본) - 'empty': 헤더만 있는 빈 파일 생성 |
| `fileName?` | `string` | 다운로드 파일명 (확장자 포함 권장, 없으면.pdf 자동 추가) |
| `fontFamily?` | `"default" \| "korean"` | 폰트 패밀리 - 'default': jspdf 내장 Helvetica (라틴 문자 지원) - 'korean': NotoSansKR dynamic import (loadKoreanFont.ts — W1 참조) |
| `orientation?` | `"p" \| "l"` | PDF 페이지 방향 - 'p': portrait (세로, 기본) - 'l': landscape (가로) |
| `scope?` | `ExportScope` | export 대상 행 범위 - 'all': getCoreRowModel (필터 무시, 전체) - 'filtered': getFilteredRowModel (현재 정렬/필터 반영) ← default - 'selected': table.getSelectedRowModel (선택 행만) |
| `title?` | `string` | PDF 최상단에 표시할 문서 제목 행 (없으면 생략) |

### `PdfTableData`

buildRowsPdfTable — 행 배열 + `ExcelColumn[]` 을 jspdf-autotable 의 &#123; head, body } 구조로
변환하는 순수 함수(브라우저/jspdf 비의존 → node-testable).

실제 PDF 렌더(jspdf)는 `exportRowsToPdf` 가 담당하고, 본 함수는 그 입력 표 데이터만 만든다.

| 속성 | 타입 | 설명 |
|---|---|---|
| `body` | `string[][]` | autotable body: 데이터 행 × 컬럼 문자열 |
| `head` | `string[][]` | autotable head: 단일 헤더 행 (행 배열 export 는 다중행 헤더 미지원) |

### `PivotCollapseOpts`

행 그룹 collapse 어포던스 옵션. 지정 시 subtotal 행 라벨이 클릭→토글 + chevron(▶/▼).
미지정 시 subtotal 라벨은 기존 plain text( 동작 불변).

| 속성 | 타입 | 설명 |
|---|---|---|
| `collapsedIds` | `ReadonlySet<string>` |  |
| `onToggle` | `(…) => …` |  |

### `PivotColumnCollapseOpts`

컬럼 그룹 collapse 어포던스 옵션. 지정 시 컬럼-그룹 헤더가 클릭→토글 + chevron(▶/▼).
collapse 된 그룹(`node.key` ∈ `collapsedKeys`)은 자식 leaf 컬럼 대신 그룹 집계 셀(`<node.key>__<i>`,
computePivot 이 source 에서 사전 계산 = avg-of-avgs 안전)을 읽는 단일/값별 컬럼으로 렌더된다.
미지정 시 컬럼 그룹은 기존 plain 헤더 + 전체 자식 렌더( 동작 불변).

| 속성 | 타입 | 설명 |
|---|---|---|
| `collapsedKeys` | `ReadonlySet<string>` |  |
| `onToggle` | `(…) => …` |  |

### `PivotColumnNode`

A node in the column-combination tree (nested by column-dimension order).

Leaf nodes (no `children`) carry a stable `key` used to index value cells.

| 속성 | 타입 | 설명 |
|---|---|---|
| `children?` | `PivotColumnNode[]` | Child nodes for the next column dimension (absent on leaves). |
| `field` | `string` | Column-dimension field this level represents. |
| `key` | `string` | Stable path key for the column combination up to this node. |
| `value` | `string` | The dimension value at this node (stringified). |

### `PivotConfig`

Declarative pivot configuration.

| 속성 | 타입 | 설명 |
|---|---|---|
| `columns` | `string[]` | Column-dimension field names (order = header nesting order). |
| `rows` | `string[]` | Row-dimension field names (order = nesting order; one leading column each). |
| `values` | `PivotValueDef[]` | Value/measure definitions (each multiplies the column count). |

### `PivotGridProps`

Props for PivotGrid.

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` | Outer wrapper className. |
| `config` | `PivotConfig` | Pivot configuration (row/column dimensions + value defs). |
| `data` | `TData[]` | Flat source rows. |
| `enableCollapse?` | `boolean` | 행 그룹 expand/collapse 활성 (default `false`). `true` 시 subtotal 행 라벨이 클릭(chevron ▶/▼)→그룹 하위 data 행 숨김/복원(subtotal 은 대표로 잔존). 정렬과 합성된다 (collapse(sort(rows))). 미지정= 동작(정적 subtotal 라벨). |
| `enableColumnCollapse?` | `boolean` | 컬럼 그룹 expand/collapse 활성 (default `false`). `true` 시 컬럼-그룹 헤더가 클릭(chevron ▶/▼)→자식 leaf 컬럼 숨김/복원(그룹은 source-집계 셀을 읽는 단일 컬럼으로 잔존, avg-of-avgs 안전). ≥2 컬럼차원에서 의미. 미지정= 동작(정적 그룹 헤더, 전체 자식 렌더). |
| `enableConfigControls?` | `boolean` | 런타임 config 컨트롤 활성 (default `false`). `true` 시 상단 툴바([⇄ 전치], [pivot 토글])가 렌더되고 PivotGrid 가 config/pivotMode 를 **내부 state 로 소유**(props.config·pivotMode 는 초기값). 미지정 시 props.config 를 직접 사용( controlled 동작 불변). config 소비자 제어와 배타적. |
| `enableSort?` | `boolean` | Pivot 값 컬럼 정렬 활성 (default `false`). `true` 시 값 헤더가 클릭→그룹 내 정렬(subtotal/grandTotal 앵커, grid-core enableSort 아님). 미지정= 동작(정적 헤더). |
| `enableVirtualization?` | `boolean` | Enable `<Grid>` virtualization (delegated — , no react-virtual here). |
| `onConfigChange?` | `(…) => …` | config 변경(전치 등) 시 호출 — 소비자 영속/동기화용. |
| `passthroughColumns?` | `ColumnDef<TData, unknown>[]` | Columns used when `pivotMode === false` (normal grid passthrough). Ignored in pivot mode. |
| `pivotMode?` | `boolean` | When `false`, the pivot transform is skipped entirely and `data` is rendered as a normal grid using `passthroughColumns`. Default `true`. |

### `PivotLike`

Minimal structural shape of a pivot result needed to chart it — declared locally so grid-pro-chart
stays DECOUPLED from grid-pro-pivot (no package dependency / no cycle). Any object matching this
shape (e.g. a real `PivotModel`) can be charted.

| 속성 | 타입 | 설명 |
|---|---|---|
| `columnLeafKeys` | `string[]` |  |
| `columnTree?` | `{ … }[]` |  |
| `config` | `{ … }` |  |
| `rows` | `{ … }[]` |  |

### `PivotModel`

The complete headless pivot result returned by the pure transform / `usePivot`.

| 속성 | 타입 | 설명 |
|---|---|---|
| `columnLeafKeys` | `string[]` | Leaf column-combination keys in left-to-right order. |
| `columnTree` | `PivotColumnNode[]` | Column-combination tree (nested by `config.columns` order). |
| `config` | `PivotConfig` | The config the model was built from (echoed for the renderer). |
| `rows` | `PivotRow[]` | Flattened rows (data + subtotals + grand-total), in render order. |

### `PivotPanelProps`

@topgrid/grid-pro-pivot — PivotPanel component
 / — drag-and-drop pivot tool panel UI.

Four drop zones (Available / Rows / Columns / Values). Each source field renders
as a draggable chip; dropping it onto a zone moves it there via the pure
`movePivotField` transform and reports the new config through `onConfigChange`.

HTML5 native drag API ( — matches GroupPanel; dnd-kit rejected for bundle size).
The drag source field is stored in a `useRef` (Safari fallback uses `dataTransfer`)
so synthetic `dispatchEvent` drives the handlers in tests ( row-reorder pattern).

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` | Optional extra class on the panel container. |
| `config` | `PivotConfig` | Current pivot configuration (controlled). |
| `fields` | `string[]` | All source field names available for pivoting. |
| `onConfigChange` | `(…) => …` | Called with the next config after a field is dropped onto a zone. |

### `PivotRow`

One flattened pivot output row, ready to feed `<Grid data>`.

Row-dimension values live under their field names; each value cell lives under
a composite key (`<colComboKey>__<valueDefIndex>`). The grand-total *column*
cells use the reserved `GRAND_TOTAL_COLUMN_KEY` prefix.

| 속성 | 타입 | 설명 |
|---|---|---|
| `__depth` | `number` | Nesting depth (row-dimension index this row belongs to; grandTotal = -1). |
| `__id` | `string` | Stable row id (unique within the model). |
| `__kind` | `PivotRowKind` | Semantic kind (drives styling + label rendering). |

### `PivotSortOpts`

값 헤더 정렬 어포던스 옵션. 지정 시 값 leaf 헤더가 클릭→정렬 + 인디케이터(▲▼).
미지정 시 헤더는 기존 plain string( 동작 불변).

| 속성 | 타입 | 설명 |
|---|---|---|
| `active` | `null \| PivotSortState` |  |
| `onSort` | `(…) => …` |  |

### `PivotSortState`

현재 활성 정렬 상태(값 컬럼 leafKey + 방향).

| 속성 | 타입 | 설명 |
|---|---|---|
| `dir` | `PivotSortDirection` |  |
| `leafKey` | `string` |  |

### `PivotTotalsOpts`

total customization 옵션(전부 optional — 미지정 = 기존 동작).

| 속성 | 타입 | 설명 |
|---|---|---|
| `grandTotal?` | `boolean` | grandTotal 행 표시 여부(기본 true). false → grandTotal 행 제거. |
| `grandTotalPosition?` | `"top" \| "bottom"` | grandTotal 행 위치(기본 'bottom'). 'top' → 맨 위로 이동. |
| `subtotals?` | `boolean` | subtotal 행 표시 여부(기본 true). false → 모든 subtotal 행 제거. |

### `PivotValueDef`

One value (measure) definition in a pivot configuration.

| 속성 | 타입 | 설명 |
|---|---|---|
| `aggregationFn` | `AggregationFnKey \| PivotValueReducer` | Built-in aggregation key (`AggregationFnKey`) OR a custom reducer over `number[]` (pivot's own contract). |
| `field` | `string` | Source field whose numeric values are aggregated into each cell. |
| `label?` | `string` | Optional display label for the measure (defaults to `field`). |

### `PrintOptions`

인쇄 옵션

| 속성 | 타입 | 설명 |
|---|---|---|
| `emptyBehavior?` | `EmptyBehavior` | 데이터 행 0건 시 동작 - 'skip': 인쇄 창 열지 않음 (기본) - 'empty': 헤더만 있는 표 인쇄 |
| `orientation?` | `"p" \| "l"` | 페이지 방향 (CSS |
| `scope?` | `ExportScope` | export 대상 행 범위 - 'all': getCoreRowModel (필터 무시, 전체) - 'filtered': getFilteredRowModel (현재 정렬/필터 반영) ← default - 'selected': table.getSelectedRowModel (선택 행만) |
| `title?` | `string` | 인쇄 페이지 최상단에 표시할 제목 (없으면 생략) |

### `ProgressCellProps`

Props for ProgressCell.

New component (spec ) — horizontal progress bar with optional label.
Handles NaN/null/undefined → 0% and out-of-range values → [0,100]
clamp.

| 속성 | 타입 | 설명 |
|---|---|---|
| `barColorClassName?` | `string` | Tailwind class for the bar fill (default `'bg-blue-600'`). |
| `className?` | `string` | Additional Tailwind className appended to the root container. |
| `showLabel?` | `boolean` | Whether to render the percent label next to the bar. Default `true`. |
| `value` | `undefined \| null \| number` | Progress value (0–100). NaN/null/undefined → 0; out-of-range → clamped. |

### `RangeChartPanelProps`

Props for RangeChartPanel.

The panel is chart-library-agnostic: it does NOT import any chart library
( / AP-001). The consumer injects a `renderChart` callback that maps the
series to a `ReactNode` using whatever charting library they choose — the
same injection pattern as `IconCell`'s `icon: ReactNode` prop.

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` | Additional className appended to the root container. |
| `renderChart?` | `(…) => …` | Injected renderer. When provided, the panel renders `renderChart(series)`. When omitted, a graceful informational placeholder is shown (never throws). |
| `series` | `RangeSeries[]` | Series to visualise (e.g. data captured from a range selection). |
| `title?` | `string` | Optional panel title. |

### `RangeChartProps`

| 속성 | 타입 | 설명 |
|---|---|---|
| `ariaLabel?` | `string` | Accessible label for the chart. Default `'chart'`. |
| `categories?` | `string[]` | Optional category labels for the x-axis (one per slot). |
| `className?` | `string` | className appended to the root `<svg>`. |
| `height?` | `number` | SVG height in px. Default `200`. |
| `onSelectCategory?` | `(…) => …` | (cross-filter): fired when a category slot (bar/point) is clicked, with its 0-based index. Consumers map index→category label and feed `selectionsToFilter` (`@topgrid/grid-pro-filter`) to drive a linked grid filter. When set, marks become clickable. |
| `selectedCategory?` | `null \| number` | (linked highlight): the currently-selected category index (or `null`/omitted for none). The selected slot stays full-opacity; unselected slots dim — the visual link to the grid. |
| `series` | `ChartSeries[]` | Series to plot. Each `values[i]` shares category slot `i` across series. |
| `showLegend?` | `boolean` | Show the series legend (swatch + name). Default `true`. |
| `showTooltip?` | `boolean` | Show a value tooltip on hover. Default `true`. |
| `type?` | `RangeChartType` | Chart shape. Default `'bar'`. |
| `width?` | `number` | SVG width in px. Default `360`. |

### `RangeSelectGridAllProps`

확장 props — 6-prop 유지 + 5개 enable 플래그 + 7개 callback.

enable* 플래그 설계 원칙 :
 - 모든 hook은 무조건 호출 (Rules of Hooks 준수)
 - enable* = false → hook 내부 early return (동작 게이팅)
 - DragFillHandle: 컴포넌트이므로 조건부 렌더 허용

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` |  |
| `columns` | `ColumnDef<TData>[]` |  |
| `data` | `TData[]` |  |
| `emptyText?` | `string` |  |
| `enableClipboard?` | `boolean` | Ctrl+C/V 클립보드 (default: false). |
| `enableDragFill?` | `boolean` | Drag-fill 핸들 렌더링 + 채우기 기능 (default: false). |
| `enableKeyboardEdit?` | `boolean` | Delete/F2/Enter/printable key 편집 트리거 (default: false). |
| `enableKeyboardNav?` | `boolean` | Arrow/Ctrl+Arrow 키보드 내비게이션 (default: true). |
| `enableRangeSelection?` | `boolean` | 마우스 드래그 / Shift+Click 범위 선택 (default: true). |
| `enableVirtualization?` | `boolean` | @tanstack/react-virtual 가상화 (default: false). |
| `getCellValue?` | `(…) => …` | 셀 값 getter — drag-fill 계산 + clipboard 복사용. |
| `isEditableColumn?` | `(…) => …` | 컬럼 편집 가능 여부 판별. 미제공 시 전체 편집 가능. |
| `loading?` | `boolean` |  |
| `onBulkEdit?` | `(…) => …` | 범위 일괄 입력 콜백 ( 분리). |
| `onClipboardError?` | `(…) => …` | 클립보드 API 에러 핸들러 (권한 거부 등). |
| `onDeleteRange?` | `(…) => …` | Delete 키 범위 삭제 콜백 ( 분리). |
| `onEditStart?` | `(…) => …` | F2/Enter 단일 셀 편집 시작 콜백 ( 분리). |
| `onFillComplete?` | `(…) => …` | Drag-fill 완료 콜백 ( 분리). |
| `onFillTargetChange?` | `(…) => …` | Drag-fill target 범위 변경 알림 (점선 outline). |
| `onPaste?` | `(…) => …` | 붙여넣기 결과 콜백 ( 분리). |
| `onRangeChange?` | `(…) => …` |  |

### `RangeSelectGridProps`

RangeSelectGrid props (L0 backward-compat 포함 — ).

 (exactOptionalPropertyTypes): optional 필드는 '?: T' 선언.
전달 시 spread-skip 패턴 사용 (Section 6.6).

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` |  |
| `columns` | `ColumnDef<TData>[]` |  |
| `data` | `TData[]` |  |
| `emptyText?` | `string` |  |
| `loading?` | `boolean` |  |
| `onRangeChange?` | `(…) => …` |  |

### `RangeSeries`

A single named numeric series passed to a RangeChartPanel renderer.

| 속성 | 타입 | 설명 |
|---|---|---|
| `data` | `number[]` | Numeric data points (e.g. the values inside a selected range). |
| `name?` | `string` | Optional display name for the series. |

### `Replacement`

치환 1건. ** 와 조합용**: `{rowKey, columnId}` + `prior`(undo 용 원본 값) + `next`(치환 결과).
`next` 는 **항상 문자열**(아래 의미 참조).

| 속성 | 타입 | 설명 |
|---|---|---|
| `columnId` | `string` |  |
| `next` | `string` | 치환 후 값(문자열). |
| `prior` | `unknown` | 치환 전 원본 값(타입 보존) — undo 명령 구성에 사용. |
| `rowKey` | `string` |  |

### `RowFormatRule`

행 단위 조건부 서식 룰.

| 속성 | 타입 | 설명 |
|---|---|---|
| `className` | `string` | 술어 true 시 `<tr>` 에 append 할 className |
| `when` | `(…) => …` | 행 데이터(`row.original`)와 0-based 행 인덱스(`row.index`)로 평가하는 술어 |

### `RowPinningOptions`

Row Pinning base type definition (F-16-06).

Defines `pinTop` / `pinBottom` row id arrays for future TanStack row pinning UI.
**Types-only in this Goal** ( / ) — full UI implementation is a separate
follow-up Goal. Pass these values to a future `RowPinningGrid` component.

| 속성 | 타입 | 설명 |
|---|---|---|
| `pinBottom?` | `string[]` | Row ids to pin at the bottom of the grid. Keys correspond to TanStack `row.id` values. |
| `pinTop?` | `string[]` | Row ids to pin at the top of the grid. Keys correspond to TanStack `row.id` values. |

### `RowPlaceholder`

Placeholder row emitted by materialize for not-yet-loaded indices.

| 속성 | 타입 | 설명 |
|---|---|---|
| `__ssrmPlaceholder` | `true` | Discriminant — consumers test this to render a loading skeleton cell. |
| `rowIndex` | `number` | Absolute row index this placeholder stands in for. |

### `RowStatusClassNames`

Tailwind className strings for each row status.
Pass a partial override to `getRowStatusClassName` to customise colours.

| 속성 | 타입 | 설명 |
|---|---|---|
| `added` | `string` |  |
| `deleted` | `string` |  |
| `edited` | `string` |  |

### `SelectFilterProps`

SelectFilter 컴포넌트 Props.

| 속성 | 타입 | 설명 |
|---|---|---|
| `column` | `Column<TData, unknown>` | TanStack Column 인스턴스. Column&lt;TData, unknown>. |
| `popoverAlign?` | `"left" \| "right"` | 팝오버 정렬 — 기본 'left'. : optional prop — FilterPopover align으로 spread-skip 전달. |
| `searchThreshold?` | `number` | 내부 검색 표시 임계값 — 기본 50. 옵션 수 >= searchThreshold 시 검색 input 자동 노출. : optional prop. |

### `ServerPivotColumn`

A derived pivot-result column: a leaf (accessorKey) or a group (columns).

| 속성 | 타입 | 설명 |
|---|---|---|
| `accessorKey?` | `string` | Leaf only: the row field this column reads (the full server field key). |
| `columns?` | `ServerPivotColumn[]` | Group only: nested child columns. |
| `header` | `string` | Header label (the dimension value, or the measure name for a leaf). |
| `id` | `string` | Stable id (group: the path prefix; leaf: the full field key). |

### `ServerSideController`

| 속성 | 타입 | 설명 |
|---|---|---|
| `ensureRange` | `unknown` |  |
| `getData` | `unknown` |  |
| `getTotalCount` | `unknown` |  |
| `refresh` | `unknown` |  |
| `setColumnFilters` | `unknown` |  |
| `setSorting` | `unknown` |  |

### `ServerSideControllerOptions`

`ServerSideController` — the SSRM data-flow logic , extracted from React so
it is **node-verifiable without a DOM**. Holds the block cache + active sort/filter, plans and
fetches blocks for a visible range, and emits a re-materialized array via `onChange`.

The `useServerSideData` hook is a thin wrapper: it owns the React state and feeds this
controller the virtualizer's visible range + sort/filter changes.

Epoch invariant lives in the pure cache (./blockCache): each request captures the
epoch at send time; a response for a since-invalidated query is discarded by `acceptBlock`.

| 속성 | 타입 | 설명 |
|---|---|---|
| `blockSize` | `number` |  |
| `pivot?` | `{ … }` | Server-side pivot — optional. Absent = flat/group request unchanged. |
| `rowCount` | `number` |  |

### `ServerSideDatasource`

Consumer-supplied datasource. The single seam between the grid and the server.

| 속성 | 타입 | 설명 |
|---|---|---|
| `getRows` | `unknown` |  |

### `ServerSideGridProps`

Props to spread onto `<Grid>`. The `data` may contain RowPlaceholder rows for
not-yet-loaded indices — detect them with `isRowPlaceholder` in a cell renderer to show a
skeleton (otherwise accessors read `undefined` → blank cells while loading).

| 속성 | 타입 | 설명 |
|---|---|---|
| `data` | `TData[]` |  |
| `enableVirtualization` | `true` |  |
| `manualFiltering` | `true` |  |
| `manualSorting` | `true` |  |
| `onColumnFiltersChange` | `OnChangeFn<ColumnFiltersState>` |  |
| `onSortingChange` | `OnChangeFn<SortingState>` |  |
| `virtualizerOptions` | `{ … }` |  |

### `ServerSideTreeController`

| 속성 | 타입 | 설명 |
|---|---|---|
| `ensureRange` | `unknown` |  |
| `getData` | `unknown` |  |
| `refresh` | `unknown` |  |
| `setColumnFilters` | `unknown` |  |
| `setSorting` | `unknown` |  |
| `toggleGroup` | `unknown` |  |

### `ServerSideTreeControllerOptions`

`ServerSideTreeController` — lazy-group SSRM data-flow logic , extracted from
React so it is node-verifiable without a DOM. Wraps the pure./treeCache: plans/fetches
child blocks for the visible display range, handles expand/collapse, and emits the flattened
display list via `onChange`.

Loop discipline (as in ): `emit` fires only on (a) a block resolving or (b) an expand/collapse
toggle — never synchronously inside the virtualizer `onChange` path (`ensureRange` only
plans+fetches). `ensureVisibleNodes` cannot change the flatten output (a missing node and an
empty node both flatten to one loading placeholder), so it is safe to skip emit there.

| 속성 | 타입 | 설명 |
|---|---|---|
| `blockSize` | `number` |  |
| `rowGroupCols` | `string[]` | Grouping columns, outermost first. |

### `ServerSideTreeGridProps`

Props to spread onto `<Grid>` for a lazy-group SSRM grid.

| 속성 | 타입 | 설명 |
|---|---|---|
| `data` | `TData[]` |  |
| `enableVirtualization` | `true` |  |
| `manualFiltering` | `true` |  |
| `manualSorting` | `true` |  |
| `onColumnFiltersChange` | `OnChangeFn<ColumnFiltersState>` |  |
| `onSortingChange` | `OnChangeFn<SortingState>` |  |
| `virtualizerOptions` | `{ … }` |  |

### `Sheet`

| 속성 | 타입 | 설명 |
|---|---|---|
| `canRedo` | `unknown` |  |
| `canUndo` | `unknown` |  |
| `defineName` | `unknown` |  |
| `getDisplay` | `unknown` |  |
| `getRaw` | `unknown` |  |
| `getValue` | `unknown` |  |
| `redo` | `unknown` |  |
| `setCell` | `unknown` |  |
| `undo` | `unknown` |  |

### `SheetCellStyle`

Per-cell visual style spec.

| 속성 | 타입 | 설명 |
|---|---|---|
| `align?` | `"left" \| "center" \| "right"` | Horizontal text alignment. |
| `background?` | `string` | Fill / background color (CSS color). |
| `bold?` | `boolean` |  |
| `border?` | `boolean` | When true, draws a 1px solid border (overriding the base). |
| `color?` | `string` | Text color (CSS color). |
| `italic?` | `boolean` |  |

### `SheetChange`

A recomputed cell (in recompute order).

| 속성 | 타입 | 설명 |
|---|---|---|
| `ref` | `string` |  |
| `value` | `CellValue` |  |

### `SheetGridProps`

`SheetGrid` — thin spreadsheet grid (PoC). Demonstrates the load-bearing
spreadsheet property: a cell **stores a formula but displays a value** (stored ≠ rendered).
Double-click a cell to edit its raw `=A1+A2`; commit re-parses + recalculates.

REUSE ([[]]) of `@topgrid/grid-pro-range`:
- `useCellRange` — mouse range selection (highlight).
- `useClipboard` — Ctrl+C/V; `getCellValue` = the **displayed value** (copy = value, PoC choice),
 `onPaste` writes pasted text straight to `setCell`.

PoC: absolute refs, value-copy (no relative-ref adjustment), inline edit via double-click/Enter.

| 속성 | 타입 | 설명 |
|---|---|---|
| `cellStyles?` | `Record<string, SheetCellStyle>` | : per-cell visual style, keyed by A1 ref (e.g. `{ A1: { bold: true } }`). Merged onto the cell; the range-selection highlight still wins. |
| `cols?` | `number` | Number of columns (default 6). |
| `formats?` | `Record<string, SheetCellFormat>` | : per-cell number format, keyed by A1 ref (e.g. `{ B2: { type: 'currency' } }`). Applied to the displayed value; unformatted cells render unchanged. Non-numeric values (errors/text) pass through. |
| `merges?` | `string[]` | : 셀 병합 — A1 범위 문자열 배열(e.g. `['A1:', 'B5:B7']`). 좌상단 anchor 셀이 `<td rowSpan colSpan>` 로 렌더되고 피복 셀은 렌더 생략(HTML table 병합). 겹침/경계 규칙은 computeSheetMerges 참조(first-wins·clamp·1×1 무시). |
| `rows?` | `number` | Number of rows (default 12). |

### `SideBarPanelDef`

One panel section in a SideBar.

| 속성 | 타입 | 설명 |
|---|---|---|
| `content` | `ReactNode` | Panel body (e.g. a ToolPanel). |
| `id` | `string` | Stable panel id. |
| `title` | `string` | Header label. |

### `SideBarProps`

Props for SideBar.

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` | Additional className appended to the root container. |
| `defaultOpenId?` | `string` | Initially open panel id (default: the first panel). |
| `panels` | `SideBarPanelDef[]` | Panels rendered as accordion sections, in order. |

### `SizeToFitColumnInput`

A single column's input to sizeToFit.

| 속성 | 타입 | 설명 |
|---|---|---|
| `id` | `string` |  |
| `width` | `number` | Current width (px). |

### `SizeToFitOptions`

Options for sizeToFit.

| 속성 | 타입 | 설명 |
|---|---|---|
| `columns` | `SizeToFitColumnInput[]` |  |
| `containerWidth` | `number` | Target total width (px) the result must sum to. |

### `SortBadgeProps`

`SortBadge` 컴포넌트 props ( canonical — single source in grid-core).

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` | Tailwind className override. |
| `sortIndex` | `number` | TanStack `column.getSortIndex` 반환값. -1 = 미정렬 → 배지 미표시. 0-based integer → 표시 번호 = sortIndex + 1. |

### `SortClearButtonProps`

`SortClearButton` 컴포넌트 props.

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` | Tailwind className override. |
| `label?` | `string` | 버튼 레이블 (기본: '정렬 초기화'). |
| `onClear` | `(…) => …` | 클릭 시 호출 — table.setSorting([]) 연결. |

### `SortModelItem`

One server sort directive (column + direction). Mirrors TanStack `SortingState` item.

| 속성 | 타입 | 설명 |
|---|---|---|
| `colId` | `string` | Column id. |
| `sort` | `"asc" \| "desc"` | Sort direction. |

### `SparklineCellProps`

Props for SparklineCell.

Zero-dependency inline mini-chart rendered as pure SVG (no chart library
​import — / AP-001). Safe with empty input (dash placeholder) and
non-finite values (NaN/Infinity are skipped before scaling).

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` | Additional className appended to the root `<svg>`. |
| `color?` | `string` | Stroke/fill colour (any CSS colour). Default `'currentColor'`. |
| `height?` | `number` | SVG height in px. Default `20`. |
| `showMinMax?` | `boolean` | Mark the min and max points with dots (line/area only). Default `false`. |
| `type?` | `SparklineType` | Sparkline shape. Default `'line'`. |
| `values` | `number[]` | Data points. Empty array → dash placeholder. NaN/Infinity entries are skipped. |
| `width?` | `number` | SVG width in px. Default `80`. |

### `SsrmRowMeta`

Per-display-row metadata attached as `__ssrm` by the tree flatten. Consumers read it in a
cell renderer to draw the group toggle + indent, and pass `groupKeys` to `toggleGroup`.

| 속성 | 타입 | 설명 |
|---|---|---|
| `expanded?` | `boolean` | Group rows only: whether currently expanded. |
| `group` | `boolean` | True for a group row, false for a leaf row. |
| `groupKeys` | `string[]` | Group rows: path **including this group's own key** (the `toggleGroup` target). Leaf rows: parent path. |
| `level` | `number` | Depth (0 = outermost group level). |

### `StarColumnInput`

A single column's input to distributeStarWidths.

| 속성 | 타입 | 설명 |
|---|---|---|
| `id` | `string` |  |
| `min?` | `number` | Optional lower bound (px) for a star column's resolved width. |
| `spec` | `string \| number` | Width spec: `'*'`, `'2*'`, `120`, or `'120px'`. |

### `StatusBadgeCellProps`

Props for StatusBadgeCell.

Absorbs legacy BadgeCell with rename
(BadgeCell → StatusBadgeCell — spec ). Prop signature fully preserved.

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` | Additional Tailwind className appended to the rendered span. |
| `colorMap?` | `Record<string, string>` | Status → Tailwind class map. When undefined, default 7-state map applies (L0 L8-15 preserved). |
| `defaultColor?` | `string` | Fallback Tailwind class when value not found in colorMap. Default `'bg-gray-100 text-gray-600'`. |
| `value` | `string` | Status value — used as colorMap lookup key. |

### `StatusBarCountLabels`

카운트 세그먼트 라벨 override(미지정 시 한국어 기본).

| 속성 | 타입 | 설명 |
|---|---|---|
| `filtered?` | `string` |  |
| `selected?` | `string` |  |
| `total?` | `string` |  |

### `StatusBarItem`

A single segment rendered by StatusBar.

The consumer injects these (e.g. selection counts or aggregate summaries);
the bar is purely presentational and is not coupled to any grid state.

| 속성 | 타입 | 설명 |
|---|---|---|
| `key` | `string` | Stable React key / identifier for the segment. |
| `label?` | `string` | Optional label rendered before the value (e.g. `Selected`). |
| `value` | `ReactNode` | Value rendered for the segment (e.g. a count or formatted summary). |

### `StatusBarProps`

Props for StatusBar.

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` | Additional className appended to the root container. |
| `items` | `StatusBarItem[]` | Segments to render, left-to-right, as `label: value` pairs. |

### `TagCellProps`

Props for TagCell.

New component (spec ) — renders an array of tag strings as rounded
Tailwind chips. Empty array → dash placeholder (mirrors the
 TextCell empty-value pattern).

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` | Additional Tailwind className appended to the root span. |
| `colorMap?` | `Record<string, string>` | Per-tag Tailwind colour map. Falls back to a neutral gray chip when undefined. |
| `gapClassName?` | `string` | Tailwind gap class applied to the flex container (default `'gap-1'`). |
| `value` | `readonly string[]` | Tag strings. Empty array → dash placeholder. |

### `TextCellProps`

Props for TextCell.

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` | Additional Tailwind className. |
| `value` | `undefined \| null \| string \| number` | Text to render. null/undefined/'' → dash placeholder. Falsy 0 is preserved. |

### `TextFilterProps`

TextFilter 컴포넌트 Props.

| 속성 | 타입 | 설명 |
|---|---|---|
| `column` | `Column<TData, unknown>` | TanStack Column 인스턴스. Column&lt;TData, unknown> — cell value 타입 unknown. |
| `defaultOperator?` | `TextFilterOperator` | 기본 연산자 — 기본 'contains'. : optional prop. |
| `popoverAlign?` | `"left" \| "right"` | 팝오버 정렬 — 기본 'left'. : optional prop — FilterPopover align으로 spread-skip 전달. |

### `TextFilterValue`

| 속성 | 타입 | 설명 |
|---|---|---|
| `operator` | `TextFilterOperator` |  |
| `value` | `string` |  |

### `ToolPanelColumn`

Describes one column row in a ToolPanel.

This is a plain, self-contained shape — the panel imports no grid-core state.
The consumer maps its grid-core `columnVisibility` / `columnOrder` state into
these rows and applies the emitted callbacks back onto that state.

| 속성 | 타입 | 설명 |
|---|---|---|
| `canHide?` | `boolean` | When `false`, the visibility checkbox is disabled (column cannot be hidden). |
| `id` | `string` | Column id (matches the grid's column id). |
| `label` | `string` | Human-readable label rendered next to the checkbox. |
| `visible` | `boolean` | Whether the column is currently visible. |

### `ToolPanelProps`

Props for ToolPanel.

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` | Additional className appended to the root container. |
| `columns` | `ToolPanelColumn[]` | Columns to list, in display order. |
| `onColumnDrop?` | `(…) => …` | Optional. When provided, rows become drag-to-reorder: dropping `sourceId` onto `targetId` fires this (insert-before semantics — pair with grid-core `reorderColumnOrder`). The panel holds NO drag state of its own; the consumer feeds the reordered `columns` back. Coexists with the `onReorder` buttons. |
| `onReorder?` | `(…) => …` | Optional. When provided, up/down buttons render per row and fire this with the requested move direction. The consumer reorders its `columnOrder`. |
| `onVisibilityChange` | `(…) => …` | Fired when a column's visibility checkbox is toggled. |

### `TotalCountProps`

`TotalCount` props.

| 속성 | 타입 | 설명 |
|---|---|---|
| `format?` | `(…) => …` | 전체 건수 텍스트 포매터 (i18n — ). 미지정 시 한국어 기본("전체 N건", N 강조). |
| `total` | `number` | 전체 row 수. |

### `TreeBlockRequest`

A block to fetch: which node (`groupKeys`/`pathKey`) and which block index within it.

| 속성 | 타입 | 설명 |
|---|---|---|
| `blockIndex` | `number` |  |
| `groupKeys` | `string[]` |  |
| `pathKey` | `string` |  |

### `TreeCacheState`

Hierarchical cache : a **flat** `Map<pathKey, BlockCacheState>` keyed by
`JSON.stringify(groupKeys)` — each node owns a block cache for *its children*. `epoch` is
**global** across the whole tree (sort/filter/grouping change bumps it → every node's responses
invalidate). `expanded` is the set of expanded path keys; collapsing **purges** the node.

| 속성 | 타입 | 설명 |
|---|---|---|
| `blockSize` | `number` |  |
| `epoch` | `number` | Global query generation — responses tagged with a stale epoch are discarded. |
| `expanded` | `Set<string>` | Expanded path keys (root `"[]"` is always conceptually expanded). |
| `nodes` | `Map<string, BlockCacheState<TData>>` | pathKey (`JSON.stringify(groupKeys)`) → that node's children block cache. |
| `rowGroupCols` | `string[]` | Grouping columns, outermost first. Level depth = `rowGroupCols.length`. |

### `TreeGridProps`

`TreeGridProps<TData>` — AS-IS shape 보존 (TreeGrid.tsx L12-22).

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` |  |
| `columns` | `ColumnDef<TData>[]` |  |
| `data` | `TData[]` |  |
| `emptyText?` | `string` |  |
| `expandAll?` | `boolean` | `true` 시 마운트 시 전체 트리 펼침 ( `defaultExpanded={true}` 매핑). |
| `getSubRows?` | `(…) => …` | 자식 행 추출 함수 (TanStack `getSubRows` 와 시그니처 호환). |
| `loading?` | `boolean` |  |
| `onRowClick?` | `(…) => …` |  |

### `UndoRedoAPI`

`useUndoRedo` 반환 표면.

| 속성 | 타입 | 설명 |
|---|---|---|
| `canRedo` | `boolean` | redo 가능 여부(redo 스택 비어있지 않음). |
| `canUndo` | `boolean` | undo 가능 여부(undo 스택 비어있지 않음). |
| `clear` | `(…) => …` | 양 스택을 비운다(예: commit 후). |
| `push` | `(…) => …` | 이미 수행된 동작의 명령을 기록한다. redo 스택을 비운다(새 분기). |
| `redo` | `(…) => …` | 되돌린 명령을 다시 적용한다(`redo` 실행 후 undo 스택으로 이동). no-op if 비어있음. |
| `undo` | `(…) => …` | 최근 명령을 되돌린다(`undo` 실행 후 redo 스택으로 이동). no-op if 비어있음. |

### `UndoRedoCommand`

undo/redo 단위 명령. `undo`/`redo` 는 부작용(보통 tracking mutator 호출).

| 속성 | 타입 | 설명 |
|---|---|---|
| `label?` | `string` | 디버깅/UI 라벨(선택). |
| `redo` | `(…) => …` | 이 명령을 다시 적용한다. |
| `undo` | `(…) => …` | 이 명령을 되돌린다. |

### `UseCellCommentsOptions`

`useCellComments` 옵션.

| 속성 | 타입 | 설명 |
|---|---|---|
| `storage?` | `"local" \| "session"` | `'local'`(기본) \| `'session'`. |
| `storageKey` | `string` | storage 키(필수). |
| `version?` | `number` | 봉투 버전 — 불일치 시 기존 데이터 무시. |

### `UseCellRangeReturn`

useCellRange 훅 반환 타입.

| 속성 | 타입 | 설명 |
|---|---|---|
| `dragging` | `boolean` | 드래그 중 여부. |
| `handleMouseDown` | `(…) => …` | 셀 mousedown 핸들러. |
| `handleMouseEnter` | `(…) => …` | 셀 mouseenter 핸들러 (드래그 범위 확장). |
| `handleMouseUp` | `(…) => …` | mouseup 핸들러 (드래그 종료). |
| `range` | `null \| CellRange` | 현재 선택된 셀 범위. 선택 없으면 null. |

### `UseClipboardProps`

useClipboard hook props.

 (exactOptionalPropertyTypes): optional 필드는 '?: T' 선언.
전달 시 spread-skip 패턴 사용 (spec Section 3.4 예시 참조).

| 속성 | 타입 | 설명 |
|---|---|---|
| `activeCell` | `null \| CellCoord` | 현재 활성 셀 좌표 (useKeyboardNav의 activeCell). null이면 Ctrl+V no-op. |
| `colCount` | `number` | 그리드 전체 열 수 (경계 clamp). |
| `getCellValue` | `(…) => …` | 셀 값 getter — 복사 시 매트릭스 추출용. |
| `onError?` | `(…) => …` | 클립보드 API 에러 핸들러 (권한 거부 등). |
| `onPaste?` | `(…) => …` | 붙여넣기 결과 콜백 ( 분리). 미제공 시 붙여넣기 파싱만 수행. |
| `rowCount` | `number` | 그리드 전체 행 수 (경계 clamp). |
| `selection` | `null \| CellRange` | 현재 선택 범위 (useCellRange의 range). null이면 Ctrl+C no-op. |
| `table?` | `Table<TData>` | TanStack Table 인스턴스 — 사용 안 함, 향후 확장용 optional. |

### `UseClipboardReturn`

useClipboard hook 반환 타입.

| 속성 | 타입 | 설명 |
|---|---|---|
| `copyToClipboard` | `(…) => …` | Ctrl+C 프로그래매틱 복사. navigator.clipboard 비동기. |
| `onKeyDown` | `(…) => …` | Grid container에 부착할 keydown 핸들러. Ctrl+C → copyToClipboard, Ctrl+V → pasteFromClipboard 호출.  useKeyboardNav.handleKeyDown과 합성하여 사용. |
| `pasteFromClipboard` | `(…) => …` | Ctrl+V 프로그래매틱 붙여넣기. 명시적 tsvString 주입 가능 (Storybook/테스트용). |

### `UseColumnDragProps`

`useColumnDrag` hook props.

| 속성 | 타입 | 설명 |
|---|---|---|
| `columnOrderStorageKey?` | `string` | localStorage 키. persistColumnOrder=true 시 필수 (빈 문자열 → 저장 skip). |
| `enabled` | `boolean` | 드래그 재정렬 활성 여부 (`enableColumnReorder` prop 으로부터 전달). |
| `onColumnOrderChange?` | `(…) => …` | 컬럼 순서 변경 완료 후 호출되는 콜백. |
| `persistColumnOrder?` | `boolean` | localStorage 영속화 활성 여부. |
| `table` | `Table<TData>` | TanStack Table v8 인스턴스 (`useReactTable` 반환값). |

### `UseColumnDragReturn`

`useColumnDrag` hook 반환값.

| 속성 | 타입 | 설명 |
|---|---|---|
| `dragOverId` | `null \| string` | 현재 drop 인디케이터를 표시할 컬럼 ID. `null` = 드래그 비활성 또는 드래그 중이 아님. |
| `getDragProps` | `(…) => …` | 헤더 `<th>` 에 spread할 drag 이벤트 props 반환. |
| `getKeyDownHandler` | `(…) => …` | 헤더 `<th>` onKeyDown에 연결할 핸들러 반환 함수. Alt+← / Alt+→ 키 이벤트로 컬럼 좌/우 이동. |

### `UseColumnOrderPersistProps`

@topgrid/grid-core — useColumnOrderPersist hook.

Moved from `@topgrid/grid-features/column-drag/useColumnOrderPersist.ts` per (옵션 A).
Aliased re-export remains in `@topgrid/grid-features` for one minor cycle.

 : 컬럼 순서 localStorage 영속화.

Internal SSR-guard + try/catch + JSON I/O boilerplate is now delegated to
`internal/storage/storageAdapter` ( Wave 3). External API + raw-array
envelope unchanged.

: persistColumnOrder + columnOrderStorageKey prop 기반 저장/복원.
: localStorage 접근 try/catch + SSR guard + QuotaExceededError 처리 (adapter 위임).

구조: grid-core/useStoragePersist.ts 미러 ( 결정).

| 속성 | 타입 | 설명 |
|---|---|---|
| `enabled` | `boolean` | localStorage 영속화 활성 여부 (persistColumnOrder prop) |
| `storageKey` | `string` | localStorage 키 (columnOrderStorageKey prop) |
| `table` | `Table<TData>` | TanStack Table v8 인스턴스 |

### `UseExpandedPersistenceOptions`

Options for `useExpandedPersistence`.

| 속성 | 타입 | 설명 |
|---|---|---|
| `initialExpanded?` | `ExpandedState` | Initial `ExpandedState` used when no stored value is found or storage is unavailable. |
| `storageKey` | `string` | Web Storage key. Use a unique key per grid instance to avoid collisions when multiple grids are mounted on the same page. |
| `storageType?` | `StorageType` | Which Web Storage to use. - `'localStorage'` (default): persists across browser sessions. - `'sessionStorage'`: cleared when the tab is closed. |

### `UseGridStateOptions`

`useGridState<TData>(options?)` 의 파라미터 타입.

| 속성 | 타입 | 설명 |
|---|---|---|
| `clearSelectionKey?` | `string \| number` | 외부 트리거로 `rowSelection`을 자동 reset하는 옵션. XxgridTable `clearSelectionKey` 패턴 흡수 (R-A: XxgridTable.tsx L88-92). 이 값이 변경될 때마다 `rowSelection: {}` 으로 자동 reset. `undefined` 초기값은 mount 시 트리거 안 함 ( isFirstClearRender ref flag). |
| `debounceMs?` | `number` | `onStateChange` debounce 대기 시간 (ms). - 미설정 또는 `0`: 동기 호출 (와 동일 동작, breaking 없음). - `> 0`: 마지막 변경 후 `debounceMs` ms 경과 시 1회 발화.  300ms 내 N번 연속 변경 → 마지막 snapshot만 전달. - 음수: `0`과 동일 처리 (동기). |
| `initialState?` | `Partial<GridStateValues<TData>>` | uncontrolled 모드 초기값. 제공 시 해당 키의 useState 초기값으로 사용. controlled 모드(`state` 제공)와 함께 사용 시 initialState는 무시됨 (controlled 우선). |
| `onStateChange?` | `(…) => …` | state 변경 통보 콜백. controlled/uncontrolled 양쪽에서 호출됨. `debounceMs > 0` 시 debounced 호출 (마지막 변경만 발화). `debounceMs` 미설정 또는 0 시 동기 호출 ( 동작 보존). |
| `state?` | `Partial<GridStateValues<TData>>` | controlled 모드 외부 state. Partial&lt;GridStateValues>로 키 단위 controlled 허용. `state.sorting`이 있으면 sorting은 controlled, 나머지는 uncontrolled. |

### `UseKeyboardEditProps`

useKeyboardEdit hook props.

 (exactOptionalPropertyTypes): optional 필드는 '?: T' 선언.
전달 시 spread-skip 패턴 사용 (spec Section 10.1 예시 참조).

| 속성 | 타입 | 설명 |
|---|---|---|
| `activeCell` | `null \| CellCoord` | 현재 활성 셀 좌표 (useKeyboardNav의 activeCell). null이면 F2/Enter no-op. |
| `isEditableColumn?` | `(…) => …` | 컬럼 편집 가능 여부 판별 함수. 미제공 시 모든 컬럼 편집 가능으로 취급. |
| `onBulkEdit?` | `(…) => …` | 범위 일괄 입력 callback ( 분리). |
| `onDeleteRange?` | `(…) => …` | Delete 키 범위 삭제 callback ( 분리). |
| `onEditStart?` | `(…) => …` | F2/Enter 단일 셀 편집 시작 callback ( 분리). |
| `selection` | `null \| CellRange` | 현재 선택 범위 (useCellRange의 range). null이면 Delete/printable no-op. |
| `table?` | `Table<TData>` | TanStack Table 인스턴스 — 향후 확장용 optional. |

### `UseKeyboardEditReturn`

useKeyboardEdit hook 반환 타입.

| 속성 | 타입 | 설명 |
|---|---|---|
| `onKeyDown` | `(…) => …` | Grid container에 부착할 keydown 핸들러.  handleKeyDown / onKeyDown과 컴포저블 결합. Caller는 onKeyDown을 체인 앞에 배치 ( Enter 우선순위). |

### `UseKeyboardNavOptions`

| 속성 | 타입 | 설명 |
|---|---|---|
| `activeCell` | `null \| CellCoord` | 현재 활성 셀 좌표 (controlled). |
| `getCellValue?` | `(…) => …` | Ctrl+Arrow data-edge 탐색 함수 (선택적). |
| `onActiveCellChange` | `(…) => …` | 활성 셀 변경 콜백. |
| `onRangeChange` | `(…) => …` | 범위 변경 콜백 (useCellRange의 onRangeChange와 동일 시그니처 — ). |
| `range` | `null \| CellRange` | 현재 선택 범위 (useCellRange에서 수신 — controlled). |
| `table` | `Table<TData>` | TanStack table 인스턴스 (경계 계산용 — ). |

### `UseKeyboardNavReturn`

| 속성 | 타입 | 설명 |
|---|---|---|
| `handleKeyDown` | `(…) => …` | Grid container에 부착할 keydown 핸들러. |

### `UseMultiSortOptions`

`useMultiSort` 훅 옵션 (비-wrapper 소비자용).

| 속성 | 타입 | 설명 |
|---|---|---|
| `enableMultiSort?` | `boolean` | 다중 정렬 활성 여부 (default false). |
| `maxMultiSortColCount?` | `number` | TanStack maxMultiSortColCount에 직접 전달. 미설정 시 무제한. |

### `UseMultiSortResult`

`useMultiSort` 반환값.
useReactTable 옵션에 spread하여 사용.

| 속성 | 타입 | 설명 |
|---|---|---|
| `enableMultiSort` | `boolean` | TanStack TableOptions.enableMultiSort에 전달. |
| `isMultiSortEvent` | `(…) => …` | TanStack TableOptions.isMultiSortEvent에 전달. (e) => e.shiftKey — TanStack 내장 기본값과 동일. 명시적으로 설정하여 문서화 목적 달성. |
| `maxMultiSortColCount?` | `number` | : 미설정 시 undefined — spread 시 TanStack에 전달 안 됨 (무제한). |

### `UseServerSideDataOptions`

useServerSideData options.

| 속성 | 타입 | 설명 |
|---|---|---|
| `blockSize` | `number` | Rows per block (request granularity). |
| `pivot?` | `{ … }` | Server-side pivot — optional. When set, requests carry `pivotMode`/`pivotCols`/ `valueCols`; the response's `pivotResultFields` are surfaced as UseServerSideDataResult.pivotColumns. Absent = flat/group mode (byte-identical to before). Captured once like `datasource`. |
| `rowCount` | `number` | Initial total row count (v1: required — sizes the virtualizer up front). Refined by a `getRows` response's `lastRow` once the end is reached. (v1 memory note: a `rowCount`-length placeholder array is allocated; no LRU eviction.) |

### `UseServerSideDataResult`

useServerSideData result.

| 속성 | 타입 | 설명 |
|---|---|---|
| `gridProps` | `ServerSideGridProps<TData>` | Spread onto `<Grid columns={...} {...gridProps} virtualScrollHeight={...} />`. |
| `pivotColumns` | `ServerPivotColumn[]` | Server-side pivot — the derived nested pivot-result column tree from the server's `pivotResultFields` (empty until a pivot response arrives / when not pivoting). Spread into `<Grid columns={[...fixedCols,...pivotColumns]} />`. |
| `refresh` | `(…) => …` | Invalidate the cache (epoch++) and re-fetch the visible range — drops in-flight responses. |
| `totalCount` | `number` | Current known total row count (grows as `lastRow` is learned). |

### `UseServerSideTreeOptions`

useServerSideTree options.

| 속성 | 타입 | 설명 |
|---|---|---|
| `blockSize` | `number` | Rows per block (request granularity, per node). |
| `rowGroupCols` | `string[]` | Grouping columns, outermost first (e.g. `['country', 'city']`). |

### `UseServerSideTreeResult`

useServerSideTree result.

| 속성 | 타입 | 설명 |
|---|---|---|
| `gridProps` | `ServerSideTreeGridProps<TData>` | Spread onto `<Grid columns={...} {...gridProps} virtualScrollHeight={...} />`. |
| `refresh` | `(…) => …` | Invalidate the whole tree and re-fetch the visible range. |
| `toggleGroup` | `(…) => …` | Expand/collapse a group — call from a group cell renderer with `row.__ssrm.groupKeys`. |

### `UseSheetResult`

`useSheet` — thin React wrapper over the node-verified createSheet engine. Owns the sheet instance + a version counter that re-renders on any recompute. All logic
lives in the engine; this hook only bridges it to React.

| 속성 | 타입 | 설명 |
|---|---|---|
| `canRedo` | `boolean` | 재적용 가능 여부. |
| `canUndo` | `boolean` | 취소 가능 여부(현재 렌더 시점). |
| `getDisplay` | `(…) => …` | Display string for a cell (computed value; errors → code). |
| `getRaw` | `(…) => …` | Raw input of a cell (the formula text, for editing). |
| `redo` | `(…) => …` | : 취소한 편집 재적용. |
| `setCell` | `(…) => …` | Set a cell's raw input (`=A1+A2` or a literal) — triggers recalc + re-render. |
| `undo` | `(…) => …` | : 직전 셀 편집 취소(재계산 + re-render). |

### `UseStoragePersistOptions`

`useStoragePersist` hook 옵션.

GridStateValues ↔ localStorage / sessionStorage 동기화 옵션.
- `storageKey` 필수, 나머지는 모두 optional.
- `onHydrate` 콜백은 non-stable 허용 ( option 2 — useRef 보존).

| 속성 | 타입 | 설명 |
|---|---|---|
| `debounceMs?` | `number` | save debounce 지연 ms (default: `300`). `0` 이하 = 즉시 저장 (debounce 없음). |
| `onHydrate?` | `(…) => …` | mount 시 storage → state hydration 콜백. parse 성공 + version 일치 시에만 호출. non-stable 허용 (내부에서 `useRef`로 최신 값 보존 — option 2). |
| `storage?` | `"local" \| "session"` | 사용할 Storage 타입 (default: `'local'`). - `'local'` → `localStorage` - `'session'` → `sessionStorage` |
| `storageKey` | `string` | 필수: localStorage / sessionStorage 저장 키. 앱 내 고유값 권장 (예: `'my-grid-v1'`). |
| `version?` | `number` | 저장 포맷 버전 (default: `1`). 불일치 시 기존 저장 데이터 무시 + removeItem. 컬럼 구조 변경 등으로 저장 스키마 변경 시 값을 올림. |

### `UseUrlSyncOptions`

`useUrlSync<TData>` 옵션.

모든 프로퍼티 optional — 미지정 시 각 기본값 적용.

| 속성 | 타입 | 설명 |
|---|---|---|
| `debounceMs?` | `number` | URL 업데이트 debounce ms (기본 0 = 즉시). 0보다 크면 `useDebouncedCallback`으로 래핑 ( 재사용). |
| `keys?` | `GridStateKey[]` | 동기화할 GridStateKey 목록 (미지정 시 전체 8개). |
| `onHydrate?` | `(…) => …` | mount 시 URL search params → state 역방향 hydration 콜백. hook은 void 반환 — 호출부가 setter를 통해 state 갱신 책임. non-stable 콜백 안전: 내부에서 `useRef`로 최신 값 보존 ( option 2). |
| `prefix?` | `string` | URL param 네임스페이스 prefix (기본 `''` = no prefix). 다중 그리드 공존 시 충돌 방지용. prefix 지정 시 `${prefix}_${key}` 형태로 param 생성. |

### `UseViewportRowModelOptions`

`useViewportRowModel` — thin viewport-row-model wiring.

Connects a push-based ViewportDatasource to `<Grid enableVirtualization>` through the
React-free createViewportRowModel controller. The hook owns React state and feeds the
controller the row virtualizer's visible range (via `virtualizerOptions.onChange`); the
controller forwards it to `datasource.setViewportRange`, and the datasource pushes rows back
(including live in-place updates) which re-emit through `onChange` → setState.

| 속성 | 타입 | 설명 |
|---|---|---|
| `rowCount` | `number` | Initial total row count (refined by the datasource's `setRowCount`). |

### `UseViewportRowModelResult`

| 속성 | 타입 | 설명 |
|---|---|---|
| `gridProps` | `ViewportGridProps<TData>` | Spread onto `<Grid columns={...} {...gridProps} virtualScrollHeight={...} />`. |
| `totalCount` | `number` | Current known total row count (grows as the datasource pushes `setRowCount`). |

### `ValidationRule`

행/필드 단위 검증 룰.

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` | 위반 셀에 부여할 className (`field` 지정 룰에서만 사용). |
| `field?` | `keyof TData & string` | 위반 셀 시각 표시용 컬럼 id. 지정 시 `buildValidationCellClass` 가 이 컬럼 셀에만 className 을 부여한다. 미지정이면 행-수준 룰(셀 표시 없음, 메시지/커밋차단만). |
| `message` | `string` | 위반 시 `errors` 에 수집할 메시지 |
| `validate` | `(…) => …` | 순수 술어 — `true` = 통과, `false` = 위반 |

### `ViewportDatasource`

Consumer-supplied viewport datasource (AG IViewportDatasource shape).

| 속성 | 타입 | 설명 |
|---|---|---|
| `destroy?` | `unknown` |  |
| `init` | `unknown` |  |
| `setViewportRange` | `unknown` |  |

### `ViewportDatasourceParams`

Callbacks the controller hands the datasource so it can push counts/rows.

| 속성 | 타입 | 설명 |
|---|---|---|
| `setRowCount` | `(…) => …` | Set the total row count (sizes the virtualizer). |
| `setRowData` | `(…) => …` | Push rows by absolute index (in-place — re-pushing an index updates that row live). |

### `ViewportGridProps`

Props to spread onto `<Grid>`. `data` may contain RowPlaceholder rows (detect via `isRowPlaceholder`).

| 속성 | 타입 | 설명 |
|---|---|---|
| `data` | `TData[]` |  |
| `enableVirtualization` | `true` |  |
| `virtualizerOptions` | `{ … }` |  |

### `ViewportRowModel`

| 속성 | 타입 | 설명 |
|---|---|---|
| `destroy` | `unknown` |  |
| `getData` | `unknown` |  |
| `getRowCount` | `unknown` |  |
| `setRange` | `unknown` |  |

### `ViewportRowModelOptions`

| 속성 | 타입 | 설명 |
|---|---|---|
| `rowCount` | `number` | Initial total row count (refined by the datasource's `setRowCount`). |

### `VirtualGridProps`

`VirtualGridProps<TData>` — AS-IS shape 보존 (VirtualGrid.tsx L17-20).

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` |  |
| `columns` | `ColumnDef<TData, unknown>[]` |  |
| `containerHeight?` | `number` | scroll container 높이 px (default `500` — Grid `virtualScrollHeight=400` 과 다름, AS-IS 보존). |
| `data` | `TData[]` |  |
| `emptyText?` | `string` |  |
| `loading?` | `boolean` |  |
| `onRowClick?` | `(…) => …` |  |
| `onRowDoubleClick?` | `(…) => …` |  |
| `pagination?` | `GridPaginationOptions` |  |
| `rowHeight?` | `number` | 행 높이 추정 px (default `40` — Grid `estimateSize=36` 과 다름, AS-IS 보존). |
| `rowSelection?` | `GridRowSelectionOptions<TData>` |  |

### `XlsxCell`

A worksheet cell as understood by the xlsx lib (the subset this bridge reads/writes).

| 속성 | 타입 | 설명 |
|---|---|---|
| `f?` | `string` | Formula text WITHOUT the leading `=` (xlsx convention). |
| `t` | `"n" \| "s" \| "b"` | Cell type: `'n'` number, `'s'` string, `'b'` boolean. |
| `v?` | `string \| number \| boolean` | Literal value (absent/ignored when `f` is the source of truth for display). |

### `AdvancedFilterExpr`

고급 필터 식(그룹 트리 또는 단일 조건).

```ts
type AdvancedFilterExpr = FilterGroup | FilterCondition
```

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

### `Ast`

Formula AST node.

```ts
type Ast = { … } | { … } | { … } | { … } | { … } | { … } | { … } | { … } | { … } | { … }
```

### `AsyncDataMapState`

AsyncDataMapState: AsyncDataMap 내부 로딩 상태 머신.
'idle': 초기 상태 (load 미호출)
'loading': loader Promise 실행 중
'loaded': items 로드 완료 + 캐시 유효
'error': loader reject — fallback 빈 목록 반환

: no any — string literal union

```ts
type AsyncDataMapState = "idle" | "loading" | "loaded" | "error"
```

### `BlockStatus`

Internal per-block status.

```ts
type BlockStatus = "loading" | "loaded"
```

### `CellClassNameCallback`

Grid-level cell className callback.

Receives a clean GridCellContext (rowId/columnId/value/row — no TanStack types) and
returns a Tailwind className string (or undefined for no addition) appended to the `<td>`.
grid-core 1.0 : `Cell<TData,unknown>` → `GridCellContext<TData>`.

Canonical home: `@topgrid/grid-core` (since / 2026-05-18 — ADR-).
`@topgrid/grid-renderers` re-exports as type-only (ADR-MOD-GRID-REFACTOR-2026-05-17-009
역의존 제거 정책 부합).

```ts
type CellClassNameCallback = (…) => …
```

### `CellComponent`

A cell component compatible with the display-mode registry.

```ts
type CellComponent = ComponentType<CellComponentProps>
```

### `CellGetter`

Resolves an A1 cell reference to its current value ( host-capability injection).

```ts
type CellGetter = (…) => …
```

### `CellValue`

A resolved cell value.

```ts
type CellValue = number | string | boolean | CellError
```

### `ChartDock`

Where the settings/type toolbar docks relative to the chart ( composition).

```ts
type ChartDock = "top" | "bottom" | "left" | "right"
```

### `ColSpanFn`

본문 셀 가로 병합(colSpan) 콜백.

XX Grid `colSpan:(params)=>number` 대응 — 이 셀이 가로로 차지할 컬럼 수를 반환한다.
`1`(기본) = 스팬 없음, `n>1` = 자신 포함 n개 컬럼을 가로 병합(우측 n-1개 셀은 자동 skip).
mergeRows(값 비교 기반 rowSpan)와 달리 **per-cell 콜백 형식**이다.

```ts
type ColSpanFn = (…) => …
```

### `ColSpanMap`

computeColSpans 결과 Map.

키 형식: `${rowIdx}_${colId}`
- 값 > 1: 해당 셀이 가로로 값 개수만큼의 컬럼을 병합하는 시작 셀 (`colSpan` 속성)
- 값 === 0: 좌측 스팬에 피복되어 skip 되어야 하는 셀 (null 반환)
- 값 === 1 또는 미존재: 병합 없는 일반 셀

```ts
type ColSpanMap = Map<string, number>
```

### `ColumnWidthSpec`

Parsed result of a column width spec: a proportional star or a fixed px.

```ts
type ColumnWidthSpec = { … } | { … }
```

### `CompiledCell`

Result of compiling a cell's raw input.

```ts
type CompiledCell = { … } | { … }
```

### `DataMapCellProps`

DataMapCellProps&lt;TData>: DataMapCell 컴포넌트의 파라미터 타입 alias.
: TanStack CellContext&lt;TData, unknown> = DataMapCell의 단일 입력 타입.
사용처에서 `DataMapCellProps<MyRow>` 로 단축 참조 가능.

```ts
type DataMapCellProps = CellContext<TData, unknown>
```

### `DataMapColumnDef`

DataMapColumnDef&lt;TData>: TanStack ColumnDef + dataMap/selectOptions 확장. Primary export.
: dataMap + selectOptions 타입 필드만 정의.
/: 실제 렌더러·에디터 연결.

: no any (DataMap&lt;unknown>으로 상한 타입 사용)
: exactOptionalPropertyTypes=true — optional 필드는 undefined 명시 필요

Note: intersection 패턴 채택 (spec Section 3.3, spec ).
 prose의 Omit&lt;...>+'meta?: TopgridColumnMeta' 안은 TopgridColumnMeta 정의 누락으로 실현 불가 —
: spec code template + 가 권위. spec feedback L1 참조.

Renamed from TopgridColumnDef (ADR-MOD-GRID-REFACTOR-2026-05-17-006, POL-COMPAT §3).
See TopgridColumnDef deprecation alias below.

```ts
type DataMapColumnDef = ColumnDef<TData, unknown> & { … }
```

### `EditType`

Edit-mode input type — controls which native element is rendered.

Widened (additive) from the legacy `EditType`
(`'text' | 'select' | 'date' | 'number'`) by adding `'textarea'` for
multi-line input. The L0 four members are preserved (subset).

```ts
type EditType = "text" | "number" | "date" | "select" | "textarea"
```

### `EmptyBehavior`

​export 시 데이터 행 0건 동작 — 5개 Options 공유 single source-of-truth

```ts
type EmptyBehavior = "skip" | "empty"
```

### `ErrorCode`

Spreadsheet error codes (PoC set). `#NAME?` = unresolved named range; `#N/A` =
VLOOKUP no-match — both eval-time only (never serialized into formula text, so not in the tokenizer).

```ts
type ErrorCode = "#DIV/0!" | "#CYCLE!" | "#REF!" | "#ERROR!" | "#NAME?" | "#N/A"
```

### `ExportScope`

Excel export 범위 지정

```ts
type ExportScope = "all" | "filtered" | "selected"
```

### `FillDirection`

```ts
type FillDirection = "up" | "down" | "left" | "right"
```

### `FilterModel`

Opaque per-column filter map. The datasource interprets it; the grid never inspects it
(keeps filtering server-defined). Shape is consumer/server contract.

```ts
type FilterModel = Record<string, unknown>
```

### `FilterOperator`

비교 연산자.

```ts
type FilterOperator = "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "contains" | "startsWith" | "endsWith" | "blank" | "notBlank"
```

### `FilterValueType`

비교 타입(연산자 의미 결정).

```ts
type FilterValueType = "number" | "text" | "boolean" | "date"
```

### `GridColumnResizeMode`

컬럼 리사이즈 모드.

- `'onChange'`: drag 중 실시간 width 업데이트 (default — UX 우수).
- `'onEnd'`: drag 종료 시 1회 업데이트 (성능 우수, 대용량 행 환경 권장).

```ts
type GridColumnResizeMode = "onChange" | "onEnd"
```

### `GridScrollToOptions`

`<Grid>` `ref.current.scrollTo(index, options)` 의 옵션 타입.

`@tanstack/react-virtual` `ScrollToOptions` 와 시그니처 동일.
`enableVirtualization=false` 일 때 fallback DOM scroll 에서도 동일 의미 적용
(`align` → `block`, `behavior` 그대로).

```ts
type GridScrollToOptions = ScrollToOptions
```

### `GridStateKey`

8개 state key union.

```ts
type GridStateKey = "sorting" | "columnFilters" | "rowSelection" | "pagination" | "columnPinning" | "columnOrder" | "columnSizing" | "columnVisibility"
```

### `LicenseReason`

```ts
type LicenseReason = "invalid" | "expired" | "domain-mismatch"
```

### `Mapping`

Screen-to-BE field mapping. Value is either a target BE field name or a
derived function `(row) => value`. Applied during `getChangeSet` / `commitChanges`.

```ts
type Mapping = Record<string, string | (…) => …>
```

### `MeasureText`

Measures the rendered pixel width of `text`, optionally in a CSS `font`
shorthand (e.g. `'14px Arial'`). Host-injected so the sizing math stays pure
and testable (mirrors grid-pro-chart's injected `renderChart`).

```ts
type MeasureText = (…) => …
```

### `MergeRowsConfig`

셀 병합 비교 설정.
- `true`: 동일 값(`===`) 비교로 자동 병합
- `(prev, curr) => boolean`: 커스텀 비교 함수 (복합 조건 지원)

```ts
type MergeRowsConfig = boolean | (…) => …
```

### `MergeSpanMap`

computeMergeSpans 결과 Map.

키 형식: `${rowIdx}_${colId}`
- 값 > 1: 해당 셀이 값 개수만큼의 행을 병합하는 시작 셀
- 값 === 1: 병합 없는 일반 셀
- 값 === 0: 병합으로 인해 skip되어야 하는 셀 (null 반환)

```ts
type MergeSpanMap = Map<string, number>
```

### `MergingColumnDef`

mergeRows / colSpan 을 지원하는 확장 컬럼 정의.
TanStack ColumnDef meta 필드를 통해 병합 설정을 추가한다.

```ts
type MergingColumnDef = ColumnDef<TData> & { … }
```

### `NumberFilterOperator`

```ts
type NumberFilterOperator = "=" | "!=" | ">" | "<" | ">=" | "<=" | "between"
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

### `PaginationMode`

Pagination 동작 모드.

- `'client'`: 전체 데이터 로드 후 클라이언트 슬라이싱. `manualPagination: false`.
- `'server'`: 서버에서 페이지 단위 로드. `manualPagination: true`. `totalCount` 또는 `pageCount` 필수.
- `'none'`: pagination 비활성화 (기본값 — `enablePagination: false`).

```ts
type PaginationMode = "client" | "server" | "none"
```

### `PathOrAccessor`

valuePath / displayPath: keyof TItem 또는 accessor 함수

```ts
type PathOrAccessor = keyof TItem | (…) => …
```

### `PersistTarget`

`useColumnPersistence` 가 영속화할 state 대상.

- `'visibility'`: `VisibilityState` (컬럼 표시/숨김).
- `'order'`: `ColumnOrderState` (컬럼 순서).

```ts
type PersistTarget = "visibility" | "order"
```

### `PivotRowKind`

Discriminator marking the semantic kind of a flattened pivot row.

- `'data'` — a leaf row-group (the deepest row-dimension combination).
- `'subtotal'` — a per-row-group subtotal (a row dimension closing).
- `'grandTotal'` — the bottom grand-total row (all rows aggregated).

```ts
type PivotRowKind = "data" | "subtotal" | "grandTotal"
```

### `PivotSortDirection`

@topgrid/grid-pro-pivot — pivot 결과 정렬 — 순수.

★ grid-core `enableSort` 를 `<Grid>` 에 넘기면 평탄 배열 전체(subtotal/grandTotal 포함)를 섞어 정렬한다
(갭분석 명시). pivot-aware 정렬은 **그룹 내에서만** data 행을 재정렬하고 합성 행을 앵커한다:
- rows 를 **세그먼트**(연속한 `data` 행 run, `subtotal`/`grandTotal` 이 종료)로 나눈다.
- 각 세그먼트 *내부*의 data 행만 값 셀(`row[leafKey]`)로 재정렬한다.
- subtotal/grandTotal 은 위치 불변(앵커) — 종료자는 자기 자리에 그대로 push.
- **null 셀은 항상 하단**(asc/desc 무관) — 빈 교차셀이 정렬 상단을 차지하지 않게.

스코프: 그룹 *자체*를 subtotal 값으로 정렬하는 계층 정렬은 vN. 본 함수는 sibling(그룹 내) 정렬만.
타입만 import(런타임 0) → node strip-types 직접 실행.

```ts
type PivotSortDirection = "asc" | "desc"
```

### `PivotValueReducer`

A custom pivot value reducer.

Pivot-specific contract: receives the matching leaf rows' numeric values for a
single field and returns one number. (Distinct from grid-pro-agg's multi-column
Row-based `AggregationFn` — see.)

```ts
type PivotValueReducer = (…) => …
```

### `PivotZone`

피벗 패널의 드롭 대상 존. `available` = 어느 차원에도 배정되지 않음.

```ts
type PivotZone = "rows" | "columns" | "values" | "available"
```

### `RangeChartType`

Cartesian chart type. line/bar/area all share the same scale + axis machinery.

```ts
type RangeChartType = "line" | "bar" | "area"
```

### `RenderDetailRow`

Render function type for the Master-Detail detail row content.

```ts
type RenderDetailRow = (…) => …
```

### `RendererFn`

cell renderer 함수 타입.

TanStack `CellContext<TData, unknown>`을 받아 `ReactNode` 반환.
`any` 없음 — TValue=unknown 사용.

```ts
type RendererFn = (…) => …
```

### `RendererRegistry`

type → RendererFn 매핑 타입.

`Map<TopgridColumnType, RendererFn<TData>>` 기반.
`any` 없음. XX Grid `components` registry 패턴 참조 (L2: R-A).

```ts
type RendererRegistry = Map<TopgridColumnType, RendererFn<TData>>
```

### `RowGroupPanelProps`

Props for RowGroupPanel — identical to the reused agg `GroupPanel`.

```ts
type RowGroupPanelProps = GroupPanelProps<TData>
```

### `RowSelectionMode`

행 선택 모드.

- `'single'`: 단일 행 선택 — 헤더 체크박스는 렌더되지 않음.
- `'multi'`: 다중 선택 — 헤더 체크박스(전체 선택) + 행별 체크박스.
- `'none'`: 선택 비활성 — 체크박스 컬럼 합성 없음.

BaseGrid `GridRowSelectionOptions.mode` 와 호환 (legacy alias 대응).

```ts
type RowSelectionMode = "single" | "multi" | "none"
```

### `RowStatus`

Row change status. `unchanged` rows omit `__rowStatus`.

```ts
type RowStatus = "added" | "edited" | "deleted"
```

### `SheetCellFormat`

Per-cell number format spec.

```ts
type SheetCellFormat = { … } | { … } | { … } | { … }
```

### `SparklineType`

Sparkline render type.
- `line` polyline through the points.
- `bar` one column per value, scaled to the series range.
- `area` filled polygon under the line.
- `win-loss` 0-baseline bars: above for >0, below for &lt;0, nothing for 0.

```ts
type SparklineType = "line" | "bar" | "area" | "win-loss"
```

### `TanStackAggKey`

Aggregation function keys that TanStack Table v8 accepts natively.
'mean' is TanStack's internal name; our public API exposes 'avg'.

```ts
type TanStackAggKey = "sum" | "mean" | "min" | "max" | "count"
```

### `TextFilterOperator`

```ts
type TextFilterOperator = "contains" | "equals" | "startsWith" | "endsWith"
```

### `TopgridColumnDef`

표준 column 정의. TanStack `ColumnDef<TData>` 생성을 위한 입력 타입.

`type` 필드로 자동 renderer 분기. `createColumns<TData>(defs)` 소비용.

```ts
type TopgridColumnDef = BaseColumnDef & { … } | BaseColumnDef & { … }
```

### `TopgridColumnType`

11종 자동 renderer 분기 type union.

`createColumns` 가 이 type으로 rendererRegistry를 조회하여
적절한 cell 렌더러를 선택한다.

- `'checkbox'`: DisplayColumnDef 전용 처리 (accessorKey 없음, enableSorting 강제 false)
- `'number'`: 숫자 포맷터 적용 ( 주입 예정, placeholder)
- `'boolean'`: Y/N 표시
- `'dateTime'`: 날짜+시간 포맷터 ( 주입 예정, placeholder)
- `'date'`: 날짜 포맷터 ( pending → placeholder)
- `'text'`: plain text (기본)
- `'badge'`: Badge 컴포넌트 ( pending → placeholder)
- `'link'`: Link 컴포넌트 ( pending → placeholder)
- `'icon'`: Icon 컴포넌트 ( pending → placeholder)
- `'tag'`: TagCell (+018 wired — readonly string[]).
- `'progress'`: ProgressCell (+018 wired — number|null|undefined).

```ts
type TopgridColumnType = "checkbox" | "number" | "boolean" | "dateTime" | "date" | "text" | "badge" | "link" | "icon" | "tag" | "progress"
```

### `TreeDisplayRow`

A display-list row: the data (or placeholder) plus `__ssrm` meta. Fed to `<Grid data>`.

```ts
type TreeDisplayRow = TData | RowPlaceholder & { … }
```

### `Validator`

Row-level validator returning `{ valid, errors? }`. When `valid` is `false`,
the row is excluded from `added`/`updated` and an entry is pushed into `errors`.

```ts
type Validator = (…) => …
```

## 상수

### `approxCharPx`

Approximate average glyph width (px) used by the SSR/node fallback estimator
when canvas measurement is unavailable. Chosen as 8 to match the spec's
verification mock `(t) => t.length * 8`, giving deterministic, test-aligned
widths in non-browser environments.

```ts
const approxCharPx: 8
```

### `BUILT_IN_AGGREGATION_KEYS`

The 5 built-in aggregation function keys supported by AggregationGrid.
Use this for runtime guards and autocomplete hints.

```ts
const BUILT_IN_AGGREGATION_KEYS: ReadonlyArray<AggregationFnKey>
```

### `BUILT_IN_REDUCERS`

The built-in pure reducers, keyed by `AggregationFnKey`.

Every reducer first filters non-finite values; an empty finite set returns
`null` (callers map this straight to a `null` cell value).

```ts
const BUILT_IN_REDUCERS: Readonly<Record<AggregationFnKey, (…) => …>>
```

### `DEFAULT_AUTOSIZE_PADDING`

Default horizontal padding (px) added to the measured content width.

```ts
const DEFAULT_AUTOSIZE_PADDING: 16
```

### `defaultRendererRegistry`

Default registry — pre-registered display-mode renderers
( + — 11 components, plus 3 alias keys for createColumns
convenience: `dateTime`, `statusBadge`, `check`).

Each entry is registered via asCell which confines the widening cast
to a single location ( amendment — cast 14→1). The registry consumer
( createColumns) is responsible for narrowing at the call site
when invoking the component via `React.createElement`.

```ts
const defaultRendererRegistry: Record<string, CellComponent>
```

### `defaultRowStatusClassNames`

Default Tailwind classNames for each row status.

```ts
const defaultRowStatusClassNames: Readonly<RowStatusClassNames>
```

### `FUNCTIONS`

Built-in spreadsheet functions — **error-aware**, local implementation.

 ( N=2 re-read): the pivot's `BUILT_IN_REDUCERS` take clean `number[]` and return
null-on-empty (a pivot display choice). Sheet functions take **error-aware** `CellValue[]`,
propagate errors, and have sheet semantics (SUM([])=0, AVERAGE([])=#DIV/0!). Different input
contract → not the same function; reuse would be the forced "억지 재사용" rejects.

PoC semantics: any error argument propagates (returns the first error). Numbers aggregate;
non-numeric values (strings/booleans/empty cells) are ignored, as in Excel range aggregation.

```ts
const FUNCTIONS: Readonly<Record<string, (…) => …>>
```

### `GRAND_TOTAL_COLUMN_KEY`

Reserved key prefix for the row-grand-total column combination.

```ts
const GRAND_TOTAL_COLUMN_KEY: "__grandTotalCol__"
```

### `POSITIONAL_FUNCTIONS`

고정/위치 인자 함수(per-arg 스칼라). text=number→string 강제 지원(LEN(123)=3).

```ts
const POSITIONAL_FUNCTIONS: Readonly<Record<string, (…) => …>>
```

