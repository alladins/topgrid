---
title: "@topgrid/grid-pro-filter"
sidebar_label: "grid-pro-filter"
sidebar_position: 18
---

# @topgrid/grid-pro-filter

> Pro: Multi-condition (AND/OR) column filtering — compound FilterFn + 2-condition builder UI · **상용 (EULA)**

:::info 자동 생성
이 페이지는 소스 코드의 TSDoc 주석에서 자동 생성됩니다(내부 표식 정제). 큐레이트된 시작용 요약은 [API 레퍼런스](../api-reference) 참고.
:::

총 **16개** public export — 함수 8 · 훅 0 · 컴포넌트 1 · 타입 7 · 상수 0.

## 컴포넌트

### `MultiFilter`

컬럼당 복합(AND/OR) 필터 빌더 — 2 조건 행.

```ts
MultiFilter(variant: { … }): Element
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `variant` | `{ … }` | 'text'(contains 등) \| 'number'(=,>,… ). column.filterFn 은 각각  `multiTextFilterFn` / `multiNumberFilterFn` 으로 등록되어야 한다. |

## 함수

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

### `evaluateAdvancedFilter`

: 고급 필터 식을 행에 평가(순수, 재귀). group=inert 자식 제거 후 reduce(빈/all-inert→true=무제약).

```ts
evaluateAdvancedFilter(expr: AdvancedFilterExpr, row: Record<string, unknown>): boolean
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `expr` | `AdvancedFilterExpr` | 식 트리. |
| `row` | `Record<string, unknown>` | 평가할 행(필드 record). |

### `makeAdvancedFilterFn`

식 → 행 predicate(소비자가 global/table 필터로 사용).

```ts
makeAdvancedFilterFn(expr: AdvancedFilterExpr): (…) => …
```

### `makeMultiFilterFn`

base FilterFn 을 compound(AND/OR) FilterFn 으로 승격. 비활성 조건은 base.autoRemove 로 제거 후 reduce.

```ts
makeMultiFilterFn(base: FilterFn<unknown>): FilterFn<unknown>
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `base` | `FilterFn<unknown>` | 조건별 매칭 FilterFn(예: `textFilterFn`). `autoRemove` 가 있으면 비활성 조건 판별에 사용. |

### `matchCondition`

단일 조건을 행 값에 매칭(순수, type 명시). null/blank cell → text 매칭 false. unknown op → false.

```ts
matchCondition(rowValue: unknown, type: FilterValueType, operator: FilterOperator, value: unknown): boolean
```

### `multiNumberFilterFn`

```ts
multiNumberFilterFn(row: Row<unknown>, columnId: string, filterValue: any, addMeta: (…) => …): boolean
```

### `multiTextFilterFn`

```ts
multiTextFilterFn(row: Row<unknown>, columnId: string, filterValue: any, addMeta: (…) => …): boolean
```

### `selectionsToFilter`

: 선택 목록 → 고급 필터 식. **같은 필드 OR · 다른 필드 AND**. 빈 선택 → 무제약 빈 group(true).

```ts
selectionsToFilter(selections: readonly FilterSelection[]): AdvancedFilterExpr
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `selections` | `readonly FilterSelection[]` | 선택 descriptor 목록(차트 클릭 등이 컬럼 메타로 type 을 채워 생성). |

## 타입 · 인터페이스

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

### `FilterSelection`

한 선택 항목(차트-무관 generic): 필드 + 타입(컬럼 메타) + 선택 값.

| 속성 | 타입 | 설명 |
|---|---|---|
| `field` | `string` |  |
| `type` | `FilterValueType` |  |
| `value` | `unknown` |  |

### `MultiFilterValue`

compound 필터 값 — 컬럼당 배타적(단일 필터의 값 shape 와 호환 안 됨; multi*FilterFn 전용).

| 속성 | 타입 | 설명 |
|---|---|---|
| `conditions` | `C[]` | 조건 목록(각 조건 = base FilterFn 의 값 shape). 일반적으로 N개(UI 는 2개 출하). |
| `logic` | `"and" \| "or"` | 조건 결합 논리. |

### `AdvancedFilterExpr`

고급 필터 식(그룹 트리 또는 단일 조건).

```ts
type AdvancedFilterExpr = FilterGroup | FilterCondition
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

