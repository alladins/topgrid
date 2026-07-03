---
title: "@topgrid/grid-core-headless"
sidebar_label: "grid-core-headless"
sidebar_position: 3
---

# @topgrid/grid-core-headless

> Framework-agnostic grid core (table-core 기반). React/Vue 어댑터가 공유 소비. W1 Phase 0. · **무료 (MIT)**

:::info 자동 생성
이 페이지는 소스 코드의 TSDoc 주석에서 자동 생성됩니다(내부 표식 정제). 큐레이트된 시작용 요약은 [API 레퍼런스](../api-reference) 참고.
:::

총 **36개** public export — 함수 14 · 훅 0 · 컴포넌트 0 · 타입 20 · 상수 2.

## 함수

### `buildPaginationOptions`

```ts
buildPaginationOptions(pagination: undefined | HeadlessPaginationOptions): BuildPaginationResult<TData>
```

### `buildTableOptions`

`enable*` 입력 → `TableOptions` 매핑.

```ts
buildTableOptions(props: TableOptionsInput<TData>, state: GridStateBag, createSelectionColumn: CreateSelectionColumn<TData>): BuildOptionsResult<TData>
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `props` | `TableOptionsInput<TData>` | GridProps 의 구조적 부분집합(`TableOptionsInput`). |
| `state` | `GridStateBag` | internal state + setters (프레임워크 무관 bag). |
| `createSelectionColumn` | `CreateSelectionColumn<TData>` | 프레임워크별 체크박스 컬럼 팩토리(주입). |

### `cellValueToClipboardText`

셀 값 → 클립보드 텍스트 (순수, W1 Phase 0, grid-pro-master 에서 이관).

브라우저 `navigator.clipboard` 배선과 분리된 값→텍스트 매핑. framework-agnostic —
React copy(makeCopyCellItem)·Vue copy 어댑터가 공유한다.

매핑: null/undefined→''(빈문자, "null"/"undefined" 아님) · object(배열 포함)→JSON.stringify ·
 그 외(string/number/boolean)→String.

```ts
cellValueToClipboardText(cell: { … }): string
```

### `dateRangeFilterFn`

```ts
dateRangeFilterFn(row: Row<unknown>, columnId: string, filterValue: any, addMeta: (…) => …): boolean
```

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

### `numberFilterFn`

```ts
numberFilterFn(row: Row<unknown>, columnId: string, filterValue: any, addMeta: (…) => …): boolean
```

### `parseTsv`

```ts
parseTsv(tsv: string): string[][]
```

### `resolveResetValues`

reset 대상 key 들의 복원 값 계산 (순수).

- 값 = `initialState[key] ?? DEFAULT_GRID_STATE_VALUES[key]` (mount 시 캡처된 initial 우선).
- `Set` 으로 key dedup (멱등).
- 알 수 없는 key 는 무시(no-op).

resetState(전체) / resetSection(부분) 양쪽이 공유. setter 디스패치는 프레임워크별(React/Vue).

```ts
resolveResetValues(keys: readonly GridStateKey[], initialState: Partial<GridStateValues<TData>>): Partial<GridStateValues<TData>>
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `keys` | `readonly GridStateKey[]` | 복원할 key 목록. |
| `initialState` | `Partial<GridStateValues<TData>>` | mount 시 캡처된 initialState (없으면 DEFAULT 사용). |

**반환** — 요청된 valid key 들의 복원 값 맵(부분).

### `selectFilterFn`

```ts
selectFilterFn(row: Row<any>, columnId: string, filterValue: any, addMeta: (…) => …): boolean
```

### `stringifyTsv`

```ts
stringifyTsv(matrix: readonly readonly unknown[][]): string
```

### `textFilterFn`

```ts
textFilterFn(row: Row<unknown>, columnId: string, filterValue: any, addMeta: (…) => …): boolean
```

## 타입 · 인터페이스

### `BuildOptionsResult`

`buildTableOptions` 결과 — `useReactTable`/`useVueTable` 에 spread 가능.

| 속성 | 타입 | 설명 |
|---|---|---|
| `effectiveColumns` | `ColumnDef<TData, unknown>[]` |  |
| `options` | `Omit<TableOptions<TData>, "columns" \| "data">` |  |
| `selectionMode` | `RowSelectionMode` |  |
| `selectionOptions` | `HeadlessRowSelectionOptions<TData>` |  |

### `BuildPaginationResult`

| 속성 | 타입 | 설명 |
|---|---|---|
| `impliedEnablePagination` | `boolean` |  |
| `tanstackOptions` | `Partial<TableOptions<TData>>` |  |

### `CellCoord`

셀 범위(range) 순수 유틸 — 정규화·포함판정·drag-fill·TSV (W1 Phase 0, grid-pro-range 에서 이관).

전부 framework-agnostic 순수 함수 + 순수 데이터 타입(좌표/사각형/방향/업데이트).
React(grid-pro-range)·Vue 범위 어댑터가 동일 math/serialization 을 공유한다. 렌더/이벤트 무관.

| 속성 | 타입 | 설명 |
|---|---|---|
| `col` | `number` |  |
| `row` | `number` |  |

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

### `DateFilterValue`

| 속성 | 타입 | 설명 |
|---|---|---|
| `from?` | `Date` |  |
| `to?` | `Date` |  |

### `GridStateBag`

Grid(또는 어댑터)가 보유한 internal state 값 + setter.

| 속성 | 타입 | 설명 |
|---|---|---|
| `columnFilters` | `ColumnFiltersState` |  |
| `columnOrder` | `ColumnOrderState` |  |
| `columnPinning` | `ColumnPinningState` |  |
| `columnSizing` | `ColumnSizingState` |  |
| `columnVisibility` | `VisibilityState` |  |
| `expanded` | `ExpandedState` |  |
| `pagination` | `PaginationState` |  |
| `rowSelection` | `RowSelectionState` |  |
| `setColumnFilters` | `(…) => …` |  |
| `setColumnOrder` | `(…) => …` |  |
| `setColumnPinning` | `(…) => …` |  |
| `setColumnSizing` | `(…) => …` |  |
| `setColumnVisibility` | `(…) => …` |  |
| `setExpanded` | `(…) => …` |  |
| `setPagination` | `(…) => …` |  |
| `setRowSelection` | `(…) => …` |  |
| `setSorting` | `(…) => …` |  |
| `sorting` | `SortingState` |  |

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

### `HeadlessPaginationOptions`

pagination 옵션 — buildPaginationOptions 가 읽는 부분집합.

| 속성 | 타입 | 설명 |
|---|---|---|
| `manual?` | `boolean` |  |
| `mode?` | `PaginationMode` |  |
| `onPaginationChange?` | `OnChangeFn<PaginationState>` |  |
| `pageCount?` | `number` |  |
| `pageSize?` | `number` |  |
| `totalCount?` | `number` |  |

### `HeadlessRowSelectionOptions`

행 선택 옵션 — 프레임워크 무관 부분(렌더 콜백 제외).

| 속성 | 타입 | 설명 |
|---|---|---|
| `mode?` | `RowSelectionMode` |  |
| `onSelectionChange?` | `(…) => …` |  |
| `onStateChange?` | `OnChangeFn<RowSelectionState>` |  |
| `selectAllPages?` | `boolean` |  |
| `state?` | `RowSelectionState` |  |

### `NumberFilterValue`

| 속성 | 타입 | 설명 |
|---|---|---|
| `max?` | `number` |  |
| `min?` | `number` |  |
| `operator` | `NumberFilterOperator` |  |
| `value?` | `number` |  |

### `TableOptionsInput`

`buildTableOptions` 가 읽는 GridProps 의 **구조적 부분집합**.
grid-core 의 React `GridProps<TData>` 가 이 인터페이스를 구조적으로 만족(assignable)한다.

| 속성 | 타입 | 설명 |
|---|---|---|
| `alwaysMultiSort?` | `boolean` |  |
| `columnResizeMode?` | `ColumnResizeMode` |  |
| `columns` | `ColumnDef<TData, unknown>[]` |  |
| `data` | `TData[]` |  |
| `debug?` | `boolean` |  |
| `enableColumnPinning?` | `boolean` |  |
| `enableColumnResizing?` | `boolean` |  |
| `enableExpanding?` | `boolean` |  |
| `enableFilter?` | `boolean` |  |
| `enableMultiSort?` | `boolean` |  |
| `enablePagination?` | `boolean` |  |
| `enableRowPinning?` | `boolean` |  |
| `enableSort?` | `boolean` |  |
| `getRowId?` | `(…) => …` |  |
| `getSubRows?` | `(…) => …` |  |
| `manualFiltering?` | `boolean` |  |
| `manualSorting?` | `boolean` |  |
| `maxMultiSortColCount?` | `number` |  |
| `onColumnFiltersChange?` | `OnChangeFn<ColumnFiltersState>` |  |
| `onColumnPinningChange?` | `OnChangeFn<ColumnPinningState>` |  |
| `onColumnSizingChange?` | `OnChangeFn<ColumnSizingState>` |  |
| `onSortingChange?` | `OnChangeFn<SortingState>` |  |
| `pagination?` | `HeadlessPaginationOptions` |  |
| `rowSelection?` | `RowSelectionMode \| HeadlessRowSelectionOptions<TData>` |  |
| `sortDescFirst?` | `boolean` |  |

### `TextFilterValue`

| 속성 | 타입 | 설명 |
|---|---|---|
| `operator` | `TextFilterOperator` |  |
| `value` | `string` |  |

### `CreateSelectionColumn`

프레임워크별 selection(체크박스) 컬럼 팩토리 — **주입**.
grid-core 는 React `createCheckboxColumn`, Vue 어댑터는 Vue 버전을 전달한다.
headless 는 selection 정규화 + 'mode≠none 시 prepend' 정책만 순수하게 담당.

```ts
type CreateSelectionColumn = (…) => …
```

### `FillDirection`

```ts
type FillDirection = "up" | "down" | "left" | "right"
```

### `GridStateKey`

8개 state key union.

```ts
type GridStateKey = "sorting" | "columnFilters" | "rowSelection" | "pagination" | "columnPinning" | "columnOrder" | "columnSizing" | "columnVisibility"
```

### `NumberFilterOperator`

```ts
type NumberFilterOperator = "=" | "!=" | ">" | "<" | ">=" | "<=" | "between"
```

### `PaginationMode`

pagination 동작 모드 (convenience shorthand).

```ts
type PaginationMode = "client" | "server" | "none"
```

### `RowSelectionMode`

행 선택 모드.

```ts
type RowSelectionMode = "single" | "multi" | "none"
```

### `TextFilterOperator`

```ts
type TextFilterOperator = "contains" | "equals" | "startsWith" | "endsWith"
```

## 상수

### `DEFAULT_GRID_STATE_VALUES`

각 state key 의 기본값 — **단일 진실원천**.
초기값(initialState 미제공)·reset 양쪽이 이 상수를 사용한다(중복 제거).

```ts
const DEFAULT_GRID_STATE_VALUES: GridStateValues<unknown>
```

### `GRID_STATE_KEYS`

전체 state key (안정 순서).

```ts
const GRID_STATE_KEYS: readonly GridStateKey[]
```

