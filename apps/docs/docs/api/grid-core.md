---
title: "@topgrid/grid-core"
sidebar_label: "grid-core"
sidebar_position: 2
---

# @topgrid/grid-core

> TanStack Table abstraction wrapper + useGridState core hook · **무료 (MIT)**

:::info 자동 생성
이 페이지는 소스 코드의 TSDoc 주석에서 자동 생성됩니다(내부 표식 정제). 큐레이트된 시작용 요약은 [API 레퍼런스](../api-reference) 참고.
:::

총 **109개** public export — 함수 24 · 훅 8 · 컴포넌트 15 · 타입 58 · 상수 4.

## 컴포넌트

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

컬럼 가시성 토글 드롭다운 메뉴.

```ts
ColumnVisibilityMenu(props: ColumnVisibilityMenuProps<TData>): Element
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `props` | `ColumnVisibilityMenuProps<TData>` | `{ table }`. |

**반환** — `<details>` 기반 컬럼 가시성 토글 UI.

**예시**

```tsx
// Grid.tsx 내부 — columnPersistence 제공 시만 렌더
{props.columnPersistence !== undefined && (
  <ColumnVisibilityMenu table={table} />
)}
```

**참고** — `- ColumnPersistenceOptions`

### `DropIndicator`

드래그 drop 위치에 렌더되는 파란 수직선 인디케이터.

```ts
DropIndicator(__namedParameters: { … }): null | Element
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

## 훅 (Hooks)

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

### `useColumnPersistence`

컬럼 가시성 + 순서를 localStorage 에 영속화하는 훅.

```ts
useColumnPersistence(table: Table<TData>, options: ColumnPersistenceOptions): void
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `table` | `Table<TData>` | `useReactTable` 반환 Table 인스턴스. |
| `options` | `ColumnPersistenceOptions` | 영속화 옵션 (`ColumnPersistenceOptions`). |

**예시**

```ts
// Grid.tsx 내부 — Rules of Hooks 준수: 항상 호출 (조건부 호출 금지)
useColumnPersistence(table, props.columnPersistence ?? { storageKey: '' });
```

**참고** — `- ColumnPersistenceOptions`

### `useFullRowEdit`

```ts
useFullRowEdit(__namedParameters: UseFullRowEditOptions<T>): FullRowEditApi<T>
```

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

### `useViewStatePersistence`

Persist a single serializable view-state value to Web Storage (versioned envelope).

```ts
useViewStatePersistence(options: UseViewStatePersistenceOptions<T>): [T, ViewStateSetter<T>]
```

**반환** — `[value, setValue]` — `setValue` writes through to storage.

## 함수

### `applyRowDraft`

`applyRowDraft` — 행 편집 draft(변경 셀 모음)를 원본 행에 머지.

순수 함수 (node 검증). full-row editing 의 커밋 단위 = 행 전체 all-or-nothing 의 핵심 변환.
draft 에 담긴 필드만 override 하고 새 객체를 반환한다(입력 불변, applyRowTransaction/moveRow 동형).

```ts
applyRowDraft(row: T, draft: Record<string, unknown>): T
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `row` | `T` | 원본 행 객체. |
| `draft` | `Record<string, unknown>` | 변경 셀 `{ [field]: value }`. 빈 객체면 원본의 동등 복사. |

**반환** — 머지된 새 행(`{...row,...draft }`). 원본 무변.

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

`data` 의 각 행을 `getDataPath` 경로로 계층 트리로 변환(순수). 빈 경로 행은 스킵.

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

### `createGroupedColumns`

`TopgridColumnGroup<TData>[]` rest args를 받아 `ColumnDef<TData>[]` 반환.

```ts
createGroupedColumns(groups: TopgridColumnGroup<TData>[]): ColumnDef<TData>[]
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `groups` | `TopgridColumnGroup<TData>[]` | 그룹 컬럼 정의 rest args. 각 항목은 `{ header, columns }` 형태. |

**반환** — TanStack `ColumnDef<TData>[]` — `useReactTable({ columns })` 에 직접 주입 가능.

**예시**

```typescript
// 2-level 다단 헤더 (지급항목 그룹)
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

// 복수 그룹 (기본정보 + 급여내역)
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

**참고** — `- TopgridColumnGroup`, `- createColumns`, `- GroupedHeaderGrid`

### `createTopgridColumnHelper`

```ts
createTopgridColumnHelper(): ColumnHelper<TData>
```

### `createTransactionBatcher`

: `applyTransactionAsync` analogue. `enqueue` accumulates transactions and arms a
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

@topgrid/grid-core — row reorder 순수 변환.

`from` 의 원소를 결과 배열에서 인덱스 `to` 에 오도록 이동한다. splice 제거→삽입이 아래/위 이동의 인덱스
보정을 자연히 처리한다(from&lt;to 면 제거 후 뒤 인덱스가 당겨지므로 to 가 곧 최종 위치). no-op·경계는 원본
복사 반환(불변). 소비자가 `onRowReorder(from,to)` 콜백에서 자기 data 에 적용한다.

```ts
moveRow(rows: readonly T[], from: number, to: number): T[]
```

### `registerRenderer`

외부 renderer 등록 함수.

L2: XX Grid `components` 주입 패턴 참조 (R-A).
`Map.set` 사용 — `any` 없음.

 의 `@topgrid/grid-renderers/wireRegistry.ts` 가 이 함수로 8 슬롯
(text/number/date/dateTime/badge/link/tag/progress) 을 wire 한다. 사용자 커스텀
renderer 도 동일 API 로 덮어쓰기 가능 (마지막 호출이 우선).

```ts
registerRenderer(type: TopgridColumnType, fn: RendererFn<TData>, registry: RendererRegistry<TData>): void
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `type` | `TopgridColumnType` | 등록할 `TopgridColumnType` |
| `fn` | `RendererFn<TData>` | cell renderer 함수 |
| `registry` | `RendererRegistry<TData>` | 대상 registry (기본값: `defaultRendererRegistry`) |

**예시**

```typescript
// 사용자 커스텀 renderer
registerRenderer('number', (info) => {
  const value = info.getValue();
  return typeof value === 'number' ? value.toLocaleString() : String(value ?? '');
});
```

**참고** — `- defaultRendererRegistry`, `- ADR-MOD-GRID-REFACTOR-2026-05-17-002`

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

## 타입 · 인터페이스

### `AutoGroupColumnOptions`

Options for createAutoGroupColumn.

| 속성 | 타입 | 설명 |
|---|---|---|
| `getValue?` | `(…) => …` | Render the node's display value (default: nothing). |
| `header?` | `ReactNode` | Header content (default `'Group'`). |
| `indentUnit?` | `number` | Pixels of indent per depth level (default `16`). |
| `size?` | `number` | Column width (default `240`). |

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

### `CellLike`

Minimal structural view of a TanStack `Cell` (it satisfies this — we read only these).

| 속성 | 타입 | 설명 |
|---|---|---|
| `column` | `{ … }` |  |
| `getValue` | `(…) => …` |  |
| `row` | `{ … }` |  |

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

### `ColumnMenuProps`

| 속성 | 타입 | 설명 |
|---|---|---|
| `column` | `Column<TData, unknown>` | The TanStack `Column` this menu acts on. |
| `label?` | `string` | Trigger glyph/label. |

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

### `ColumnVisibilityMenuProps`

`<ColumnVisibilityMenu>` props.

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` | 루트 &lt;details> 추가 className. |
| `menuLabel?` | `string` | 메뉴 상단 라벨. |
| `table` | `Table<TData>` | `useReactTable` 반환 Table 인스턴스. `getAllLeafColumns` + `column.getCanHide` + `column.toggleVisibility` 사용. |
| `triggerLabel?` | `string` | 트리거 버튼 텍스트. |

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

### `FilterColumnLike`

Minimal structural view of a TanStack `Column` (filter side).

| 속성 | 타입 | 설명 |
|---|---|---|
| `getFilterValue` | `(…) => …` |  |
| `id` | `string` |  |
| `setFilterValue` | `(…) => …` |  |

### `FullRowEditApi`

| 속성 | 타입 | 설명 |
|---|---|---|
| `cancelRow` | `(…) => …` | 행 취소 — draft 폐기, emit 0. |
| `commitRow` | `(…) => …` | 행 커밋 — validateRow 통과 시 단일 onRowEdit 후 종료. |
| `editingRowId` | `null \| string` | 현재 편집 중인 행 id (없으면 null). |
| `getDraftValue` | `(…) => …` | 렌더용 현재 값(draft 우선, 없으면 원본 rowValue). |
| `isRowEditing` | `(…) => …` | 이 행이 편집 중인가. |
| `setDraftCell` | `(…) => …` | draft 셀 갱신(field=행 키). |
| `startRowEdit` | `(…) => …` | 이 행 편집 시작(draft 초기화). |

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

### `GridIcons`

Grid chrome icon glyphs (sort indicators).

| 속성 | 타입 | 설명 |
|---|---|---|
| `sortAscending` | `string` |  |
| `sortDescending` | `string` |  |
| `sortNone` | `string` |  |

### `GridLocale`

Localizable grid chrome strings. Parametrized entries are functions.

| 속성 | 타입 | 설명 |
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

### `GridTheme`

Themeable grid chrome colors. All optional via `Partial<GridTheme>` on the `theme` prop.

Only STATIC surfaces are themeable this way — a surface whose color lives in a `:hover` or
`:focus-visible` pseudo-state (selection bg, focus outline) can't be set by an inline style and
is intentionally absent (it would need shipped CSS). Those are handled by the selection sub-step.

| 속성 | 타입 | 설명 |
|---|---|---|
| `bodyBg` | `string` | Body background. Default `#ffffff` (white). |
| `border` | `string` | Container border. Default `#e5e7eb` (gray-200). |
| `cellText` | `string` | Body cell text. Default `#374151` (gray-700). |
| `headerBg` | `string` | Header (thead / group-header) background. Default `#f9fafb` (gray-50). |
| `headerText` | `string` | Header label text. Default `#6b7280` (gray-500). |

### `GroupedHeaderGridProps`

`GroupedHeaderGridProps<TData>` — AS-IS shape 보존 (GroupedHeaderGrid.tsx L13-24).

`columns` 는 TanStack 표준 그룹 구조 (`{ header, columns: [...leaf] }`) 그대로 전달 —
 buildTableOptions 가 그룹 ColumnDef 를 무수정 통과 (TanStack 내부 placeholder 메커니즘).

| 속성 | 타입 | 설명 |
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

| 속성 | 타입 | 설명 |
|---|---|---|
| `label?` | `string` | "페이지당 행 수:" 라벨 (i18n — ). 미지정 시 한국어 기본. |
| `onPageSizeChange` | `(…) => …` | pageSize 변경 콜백. |
| `pageSize` | `number` | 현재 pageSize. |
| `pageSizeOptions` | `number[]` | 선택 가능한 pageSize 옵션 목록. |

### `RowPinButtonProps`

@topgrid/grid-core — RowPinButton (per-row pin control) —.

Place in a column cell (`cell: ({ row }) => <RowPinButton row={row} />`) to let users pin a data
row to the top/bottom (sticky) or unpin it. Requires `<Grid enableRowPinning />`. Inline styles
(Tailwind is inert in the headless storybook — P27-1). ★ Every click `stopPropagation`s so pinning
does not also trigger row-click selection / onRowClick.

| 속성 | 타입 | 설명 |
|---|---|---|
| `row` | `Row<TData>` |  |

### `RowTransaction`

A delta over a row array: remove by id, update by id (matched rows replaced), add (appended).

| 속성 | 타입 | 설명 |
|---|---|---|
| `add?` | `readonly TData[]` |  |
| `remove?` | `readonly RowId[]` |  |
| `update?` | `readonly TData[]` |  |

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

### `TopgridColumnGroup`

그룹 헤더 컬럼 정의.

| 속성 | 타입 | 설명 |
|---|---|---|
| `columns` | `ColumnDef<TData>[]` | 그룹 내 리프(leaf) 컬럼 또는 중첩 그룹 컬럼 배열 |
| `header` | `string` | 그룹 헤더 레이블 |

### `TotalCountProps`

`TotalCount` props.

| 속성 | 타입 | 설명 |
|---|---|---|
| `format?` | `(…) => …` | 전체 건수 텍스트 포매터 (i18n — ). 미지정 시 한국어 기본("전체 N건", N 강조). |
| `total` | `number` | 전체 row 수. |

### `TransactionBatcher`

A batcher that coalesces many transactions into a single deferred apply.

| 속성 | 타입 | 설명 |
|---|---|---|
| `enqueue` | `(…) => …` | Queue a transaction; the first queued since the last flush arms one `schedule(flush)`. |
| `flush` | `(…) => …` | Apply all queued transactions to the current data in order, committing once. |
| `pending` | `(…) => …` | Queued (not-yet-flushed) transaction count — for tests/introspection. |

### `TransactionBatcherDeps`

Dependencies a createTransactionBatcher needs (all injected → node-deterministic).

| 속성 | 타입 | 설명 |
|---|---|---|
| `getData` | `(…) => …` | Read the current row array (consumer-owned state). |
| `getRowId` | `GetRowId<TData>` |  |
| `schedule` | `(…) => …` | Schedule `flush` to run later ( host-capability injection). Production passes `queueMicrotask`/`requestAnimationFrame`; node tests pass a manual collector for determinism. |
| `setData` | `(…) => …` | Commit the new row array (consumer-owned setState). Called ONCE per flush. |

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

### `TreeNode`

트리 노드. `data=null` = path prefix 로만 존재하는 synthetic group.

| 속성 | 타입 | 설명 |
|---|---|---|
| `children` | `TreeNode<TData>[]` | 자식 노드(first-seen 순). |
| `data` | `null \| TData` | explicit 행 데이터, 또는 synthetic 부모면 `null`. |
| `key` | `string` | 안정 키(NUL-join, 충돌-안전). |
| `path` | `string[]` | 이 노드까지의 경로 세그먼트. |

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

| 속성 | 타입 | 설명 |
|---|---|---|
| `enabled` | `boolean` | localStorage 영속화 활성 여부 (persistColumnOrder prop) |
| `storageKey` | `string` | localStorage 키 (columnOrderStorageKey prop) |
| `table` | `Table<TData>` | TanStack Table v8 인스턴스 |

### `UseFullRowEditOptions`

| 속성 | 타입 | 설명 |
|---|---|---|
| `getRowId` | `(…) => …` | 행 안정 식별자. |
| `onRowEdit` | `(…) => …` | 행 커밋 콜백 — 단일 delta(머지된 새 행). 소비자가 data 에 적용. |
| `validateRow?` | `(…) => …` | 선택: 커밋 전 검증. false 반환 시 커밋 차단(편집 유지). 예: edit-plus buildValidator 파생. |

### `UseGridStateOptions`

`useGridState<TData>(options?)` 의 파라미터 타입.

| 속성 | 타입 | 설명 |
|---|---|---|
| `clearSelectionKey?` | `string \| number` | 외부 트리거로 `rowSelection`을 자동 reset하는 옵션. XxgridTable `clearSelectionKey` 패턴 흡수 (R-A: XxgridTable.tsx L88-92). 이 값이 변경될 때마다 `rowSelection: {}` 으로 자동 reset. `undefined` 초기값은 mount 시 트리거 안 함 ( isFirstClearRender ref flag). |
| `debounceMs?` | `number` | `onStateChange` debounce 대기 시간 (ms). - 미설정 또는 `0`: 동기 호출 (와 동일 동작, breaking 없음). - `> 0`: 마지막 변경 후 `debounceMs` ms 경과 시 1회 발화.  300ms 내 N번 연속 변경 → 마지막 snapshot만 전달. - 음수: `0`과 동일 처리 (동기). |
| `initialState?` | `Partial<GridStateValues<TData>>` | uncontrolled 모드 초기값. 제공 시 해당 키의 useState 초기값으로 사용. controlled 모드(`state` 제공)와 함께 사용 시 initialState는 무시됨 (controlled 우선). |
| `onStateChange?` | `(…) => …` | state 변경 통보 콜백. controlled/uncontrolled 양쪽에서 호출됨. `debounceMs > 0` 시 debounced 호출 (마지막 변경만 발화). `debounceMs` 미설정 또는 0 시 동기 호출 ( 동작 보존). |
| `state?` | `Partial<GridStateValues<TData>>` | controlled 모드 외부 state. Partial&lt;GridStateValues>로 키 단위 controlled 허용. `state.sorting`이 있으면 sorting은 controlled, 나머지는 uncontrolled. |

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

### `UseViewStatePersistenceOptions`

Options for useViewStatePersistence.

| 속성 | 타입 | 설명 |
|---|---|---|
| `initial` | `T` | Initial value used when no (valid) stored value is found. |
| `storageKey` | `string` | Web Storage key (unique per persisted view). |
| `storageType?` | `StorageType` | Web Storage type. |
| `version?` | `number` | Schema version — a mismatch discards stored state. |

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

### `GetRowId`

Extract a stable id from a row ( getRowId concept).

```ts
type GetRowId = (…) => …
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
type GridScrollToOptions = VirtualScrollToOptions
```

### `GridStateKey`

8개 state key union.

```ts
type GridStateKey = "sorting" | "columnFilters" | "rowSelection" | "pagination" | "columnPinning" | "columnOrder" | "columnSizing" | "columnVisibility"
```

### `PaginationMode`

Pagination 동작 모드.

- `'client'`: 전체 데이터 로드 후 클라이언트 슬라이싱. `manualPagination: false`.
- `'server'`: 서버에서 페이지 단위 로드. `manualPagination: true`. `totalCount` 또는 `pageCount` 필수.
- `'none'`: pagination 비활성화 (기본값 — `enablePagination: false`).

```ts
type PaginationMode = "client" | "server" | "none"
```

### `PersistTarget`

`useColumnPersistence` 가 영속화할 state 대상.

- `'visibility'`: `VisibilityState` (컬럼 표시/숨김).
- `'order'`: `ColumnOrderState` (컬럼 순서).

```ts
type PersistTarget = "visibility" | "order"
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

행 선택 모드.

- `'single'`: 단일 행 선택 — 헤더 체크박스는 렌더되지 않음.
- `'multi'`: 다중 선택 — 헤더 체크박스(전체 선택) + 행별 체크박스.
- `'none'`: 선택 비활성 — 체크박스 컬럼 합성 없음.

BaseGrid `GridRowSelectionOptions.mode` 와 호환 (legacy alias 대응).

```ts
type RowSelectionMode = "single" | "multi" | "none"
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

## 상수

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

기본 rendererRegistry (Map).

- +018 적용 후: `import '@topgrid/grid-renderers'` 시점에 `text`/`number`/
 `date`/`dateTime`/`badge`/`link`/`tag`/`progress` 8개 placeholder 가 실 컴포넌트 어댑터로 교체됨.
 `boolean` (Y/N) / `icon` (placeholder) / `checkbox` (registry 우회) 는 변경 없음.
- grid-renderers 미import 시: 11 placeholder 가 fallback 으로 동작 (graceful degradation).
- `checkbox` 는 DisplayColumnDef 로 분기 — registry 우선순위 낮음.
- : type 미등록 시 `createColumns` 가 fallback 적용.

```ts
const defaultRendererRegistry: RendererRegistry
```

