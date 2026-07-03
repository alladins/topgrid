---
title: "@topgrid/grid-features"
sidebar_label: "grid-features"
sidebar_position: 5
---

# @topgrid/grid-features

> Column reorder, multi-sort, filter UI features · **무료 (MIT)**

:::info 자동 생성
이 페이지는 소스 코드의 TSDoc 주석에서 자동 생성됩니다(내부 표식 정제). 큐레이트된 시작용 요약은 [API 레퍼런스](../api-reference) 참고.
:::

총 **45개** public export — 함수 6 · 훅 3 · 컴포넌트 13 · 타입 23 · 상수 0.

## 컴포넌트

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

### `DropIndicator`

드래그 drop 위치에 렌더되는 파란 수직선 인디케이터.

```ts
DropIndicator(__namedParameters: { … }): null | Element
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

### `GlobalSearchInput`

전체 행 검색 입력 컴포넌트 (debounce 300ms).

```ts
GlobalSearchInput(__namedParameters: GlobalSearchInputProps<TData>): Element
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

### `SelectFilter`

Excel-style 다중선택 체크박스 필터 컴포넌트.

```ts
SelectFilter(__namedParameters: SelectFilterProps<TData>): Element
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

## 함수

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

## 타입 · 인터페이스

### `CellFormatRule`

셀 단위 조건부 서식 룰.

| 속성 | 타입 | 설명 |
|---|---|---|
| `className` | `string` | 술어 true 시 셀에 append 할 className |
| `when` | `(…) => …` | 셀 값(`cell.getValue`)과 행 데이터(`cell.row.original`)로 평가하는 술어 |

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

### `GlobalSearchInputProps`

GlobalSearchInput 컴포넌트 Props.

| 속성 | 타입 | 설명 |
|---|---|---|
| `debounceMs?` | `number` | 디바운스 ms — 기본 300. : optional prop. |
| `placeholder?` | `string` | 입력 placeholder — 기본 'Search all columns…'. : optional prop. |
| `table` | `Table<TData>` | TanStack Table 인스턴스. |

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

### `RowFormatRule`

행 단위 조건부 서식 룰.

| 속성 | 타입 | 설명 |
|---|---|---|
| `className` | `string` | 술어 true 시 `<tr>` 에 append 할 className |
| `when` | `(…) => …` | 행 데이터(`row.original`)와 0-based 행 인덱스(`row.index`)로 평가하는 술어 |

### `SelectFilterProps`

SelectFilter 컴포넌트 Props.

| 속성 | 타입 | 설명 |
|---|---|---|
| `column` | `Column<TData, unknown>` | TanStack Column 인스턴스. Column&lt;TData, unknown>. |
| `popoverAlign?` | `"left" \| "right"` | 팝오버 정렬 — 기본 'left'. : optional prop — FilterPopover align으로 spread-skip 전달. |
| `searchThreshold?` | `number` | 내부 검색 표시 임계값 — 기본 50. 옵션 수 >= searchThreshold 시 검색 input 자동 노출. : optional prop. |

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

### `NumberFilterOperator`

```ts
type NumberFilterOperator = "=" | "!=" | ">" | "<" | ">=" | "<=" | "between"
```

### `TextFilterOperator`

```ts
type TextFilterOperator = "contains" | "equals" | "startsWith" | "endsWith"
```

