---
title: "@topgrid/grid-pro-merging"
sidebar_label: "grid-pro-merging"
sidebar_position: 21
---

# @topgrid/grid-pro-merging

> Pro: Cell Merging (rowSpan) — column.mergeRows API + automatic rowSpan calculation · **상용 (EULA)**

:::info 자동 생성
이 페이지는 소스 코드의 TSDoc 주석에서 자동 생성됩니다(내부 표식 정제). 큐레이트된 시작용 요약은 [API 레퍼런스](../api-reference) 참고.
:::

총 **9개** public export — 함수 2 · 훅 0 · 컴포넌트 1 · 타입 6 · 상수 0.

## 컴포넌트

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

## 함수

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

## 타입 · 인터페이스

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

