---
title: "@topgrid/grid-pro-pivot-vue"
sidebar_label: "grid-pro-pivot-vue"
sidebar_position: 25
---

# @topgrid/grid-pro-pivot-vue

> Pro: declarative 2-D pivot for Vue 3 — reuses the framework-neutral @topgrid/grid-pro-pivot-core engine (headless composable + tool panel). · **상용 (EULA)**

:::info 자동 생성
이 페이지는 소스 코드의 TSDoc 주석에서 자동 생성됩니다(내부 표식 정제). 큐레이트된 시작용 요약은 [API 레퍼런스](../api-reference) 참고.
:::

총 **21개** public export — 함수 10 · 훅 1 · 컴포넌트 0 · 타입 7 · 상수 3.

## 훅 (Hooks)

### `useVuePivot`

flat 데이터 + 피벗 구성에서 반응형 PivotModel 을 계산한다.
`data`·`config` 가 ref/게터면 변경 시 자동 재계산된다.

```ts
useVuePivot(data: MaybeRefOrGetter<TData[]>, config: MaybeRefOrGetter<PivotConfig>): ComputedRef<PivotModel>
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `data` | `MaybeRefOrGetter<TData[]>` | flat 소스 행(Ref·게터·배열). |
| `config` | `MaybeRefOrGetter<PivotConfig>` | 행/열 차원 + 값(측정) 정의(Ref·게터·객체). |

**반환** — 반응형 피벗 모델(`ComputedRef`).

**예시**

```ts
const rows = ref(sales);
const config = ref({ rows: ['region'], columns: ['quarter'], values: [{ field: 'amt', aggregationFn: 'sum' }] });
const model = useVuePivot(rows, config);
// template: v-for="row in model.rows"
```

## 함수

### `buildVuePivotColumns`

pivot 모델에서 vue-table 컬럼 집합을 만든다.

```ts
buildVuePivotColumns(model: PivotModel): ColumnDef<PivotRow>[]
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `model` | `PivotModel` | 헤드리스 피벗 모델. |

**반환** — 선언적 `ColumnDef<PivotRow>[]`(선행 행차원 + 중첩 값 그룹 + grand-total 그룹).

### `checkLicense`

현재 라이선스 상태를 동기 검사하여 `LicenseCheckResult`를 반환한다.

- valid=false 이면 `watermarkRequired=true`.
- 유효하고 `expiresAt`까지 60일 미만이면 `expiryWarning='soon-expiring'` + `console.warn` (1회).
- 유효하고 만료 여유가 충분하면 `{ valid: true, watermarkRequired: false }`.

```ts
checkLicense(): LicenseCheckResult
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

### `PivotModel`

The complete headless pivot result returned by the pure transform / `usePivot`.

| 속성 | 타입 | 설명 |
|---|---|---|
| `columnLeafKeys` | `string[]` | Leaf column-combination keys in left-to-right order. |
| `columnTree` | `PivotColumnNode[]` | Column-combination tree (nested by `config.columns` order). |
| `config` | `PivotConfig` | The config the model was built from (echoed for the renderer). |
| `rows` | `PivotRow[]` | Flattened rows (data + subtotals + grand-total), in render order. |

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

### `PivotZone`

피벗 패널의 드롭 대상 존. `available` = 어느 차원에도 배정되지 않음.

```ts
type PivotZone = "rows" | "columns" | "values" | "available"
```

## 상수

### `GRAND_TOTAL_COLUMN_KEY`

Reserved key prefix for the row-grand-total column combination.

```ts
const GRAND_TOTAL_COLUMN_KEY: "__grandTotalCol__"
```

### `VuePivotGrid`

```ts
const VuePivotGrid: DefineComponent<ExtractPropTypes<{ … }>, (…) => …, object, object, object, ComponentOptionsMixin, ComponentOptionsMixin, object, string, PublicProps, ToResolvedProps<ExtractPropTypes<{ … }>, object>, { … }, object, object, object, string, ComponentProvideOptions, true, object, any>
```

### `VuePivotPanel`

```ts
const VuePivotPanel: DefineComponent<ExtractPropTypes<{ … }>, (…) => …, object, object, object, ComponentOptionsMixin, ComponentOptionsMixin, { … }, string, PublicProps, ToResolvedProps<ExtractPropTypes<{ … }>, { … }>, { … }, object, object, object, string, ComponentProvideOptions, true, object, any>
```

