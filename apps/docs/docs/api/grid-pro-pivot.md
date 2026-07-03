---
title: "@topgrid/grid-pro-pivot"
sidebar_label: "grid-pro-pivot"
sidebar_position: 23
---

# @topgrid/grid-pro-pivot

> Pro: declarative 2-D pivot table (row × column dimensions × value aggregation) over &lt;Grid> · **상용 (EULA)**

:::info 자동 생성
이 페이지는 소스 코드의 TSDoc 주석에서 자동 생성됩니다(내부 표식 정제). 큐레이트된 시작용 요약은 [API 레퍼런스](../api-reference) 참고.
:::

총 **31개** public export — 함수 10 · 훅 1 · 컴포넌트 2 · 타입 16 · 상수 2.

## 컴포넌트

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

## 훅 (Hooks)

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

## 함수

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

### `customizePivotTotals`

model.rows 에 row-total 커스터마이즈 적용(순수, 새 배열). data 행·상대 순서 보존(grandTotal 이동 제외).

```ts
customizePivotTotals(rows: readonly PivotRow[], opts: PivotTotalsOpts): PivotRow[]
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `rows` | `readonly PivotRow[]` | pivot 행(원본 `model.rows` 또는 변환 결과 — 합성 체인 가능). |
| `opts` | `PivotTotalsOpts` | PivotTotalsOpts. |

### `filterPivotRows`

data 행만 predicate 로 필터(순수, 새 배열). subtotal/grandTotal/order 보존(true-group).

```ts
filterPivotRows(rows: readonly PivotRow[], predicate: (…) => …): PivotRow[]
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `rows` | `readonly PivotRow[]` | pivot 행(원본 `model.rows` 또는 /44 변환 결과 — 합성 체인 가능). |
| `predicate` | `(…) => …` | data 행 유지 조건(집계 셀 `row['<colKey>__<i>']` 등 접근). |

### `isBuiltInAggregationKey`

Runtime guard: is `key` one of the built-in aggregation keys?

Derives membership from `BUILT_IN_AGGREGATION_KEYS` (the shared vocabulary) —
never hardcodes the set or its size.

```ts
isBuiltInAggregationKey(key: string): key
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

### `transposePivotConfig`

rows ↔ columns 를 swap 한 새 config(values 보존). 두 번 적용 = 원본(involution).

```ts
transposePivotConfig(config: PivotConfig): PivotConfig
```

## 타입 · 인터페이스

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

### `PivotModel`

The complete headless pivot result returned by the pure transform / `usePivot`.

| 속성 | 타입 | 설명 |
|---|---|---|
| `columnLeafKeys` | `string[]` | Leaf column-combination keys in left-to-right order. |
| `columnTree` | `PivotColumnNode[]` | Column-combination tree (nested by `config.columns` order). |
| `config` | `PivotConfig` | The config the model was built from (echoed for the renderer). |
| `rows` | `PivotRow[]` | Flattened rows (data + subtotals + grand-total), in render order. |

### `PivotPanelProps`

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

### `PivotRowKind`

Discriminator marking the semantic kind of a flattened pivot row.

- `'data'` — a leaf row-group (the deepest row-dimension combination).
- `'subtotal'` — a per-row-group subtotal (a row dimension closing).
- `'grandTotal'` — the bottom grand-total row (all rows aggregated).

```ts
type PivotRowKind = "data" | "subtotal" | "grandTotal"
```

### `PivotSortDirection`

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

## 상수

### `BUILT_IN_REDUCERS`

The built-in pure reducers, keyed by `AggregationFnKey`.

Every reducer first filters non-finite values; an empty finite set returns
`null` (callers map this straight to a `null` cell value).

```ts
const BUILT_IN_REDUCERS: Readonly<Record<AggregationFnKey, (…) => …>>
```

### `GRAND_TOTAL_COLUMN_KEY`

Reserved key prefix for the row-grand-total column combination.

```ts
const GRAND_TOTAL_COLUMN_KEY: "__grandTotalCol__"
```

