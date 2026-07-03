---
title: "@topgrid/grid-vue"
sidebar_label: "grid-vue"
sidebar_position: 8
---

# @topgrid/grid-vue

> Vue 3 어댑터 (스켈레톤) — @topgrid/grid-core-headless 공유 코어를 @tanstack/vue-table 로 소비. W1 Phase 0. React 의존 0. · **무료 (MIT)**

:::info 자동 생성
이 페이지는 소스 코드의 TSDoc 주석에서 자동 생성됩니다(내부 표식 정제). 큐레이트된 시작용 요약은 [API 레퍼런스](../api-reference) 참고.
:::

총 **17개** public export — 함수 11 · 훅 0 · 컴포넌트 0 · 타입 5 · 상수 1.

## 함수

### `cellValueToClipboardText`

셀 값 → 클립보드 텍스트 (순수, W1 Phase 0, grid-pro-master 에서 이관).

브라우저 `navigator.clipboard` 배선과 분리된 값→텍스트 매핑. framework-agnostic —
React copy(makeCopyCellItem)·Vue copy 어댑터가 공유한다.

매핑: null/undefined→''(빈문자, "null"/"undefined" 아님) · object(배열 포함)→JSON.stringify ·
 그 외(string/number/boolean)→String.

```ts
cellValueToClipboardText(cell: { … }): string
```

### `createVueCheckboxColumn`

```ts
createVueCheckboxColumn(): CreateSelectionColumn<TData>
```

### `dateRangeFilterFn`

```ts
dateRangeFilterFn(row: Row<unknown>, columnId: string, filterValue: any, addMeta: (…) => …): boolean
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

### `DateFilterValue`

| 속성 | 타입 | 설명 |
|---|---|---|
| `from?` | `Date` |  |
| `to?` | `Date` |  |

### `NumberFilterValue`

| 속성 | 타입 | 설명 |
|---|---|---|
| `max?` | `number` |  |
| `min?` | `number` |  |
| `operator` | `NumberFilterOperator` |  |
| `value?` | `number` |  |

### `TextFilterValue`

| 속성 | 타입 | 설명 |
|---|---|---|
| `operator` | `TextFilterOperator` |  |
| `value` | `string` |  |

## 상수

### `Grid`

```ts
const Grid: DefineComponent<ExtractPropTypes<{ … }>, (…) => …, object, object, object, ComponentOptionsMixin, ComponentOptionsMixin, object, string, PublicProps, ToResolvedProps<ExtractPropTypes<{ … }>, object>, { … }, object, object, object, string, ComponentProvideOptions, true, object, any>
```

