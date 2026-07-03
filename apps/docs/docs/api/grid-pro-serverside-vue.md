---
title: "@topgrid/grid-pro-serverside-vue"
sidebar_label: "grid-pro-serverside-vue"
sidebar_position: 29
---

# @topgrid/grid-pro-serverside-vue

> Pro: server-side row model (SSRM) + viewport (push) row model for Vue 3 — reuses the framework-neutral @topgrid/grid-pro-serverside-core controllers. · **상용 (EULA)**

:::info 자동 생성
이 페이지는 소스 코드의 TSDoc 주석에서 자동 생성됩니다(내부 표식 정제). 큐레이트된 시작용 요약은 [API 레퍼런스](../api-reference) 참고.
:::

총 **20개** public export — 함수 4 · 훅 3 · 컴포넌트 0 · 타입 13 · 상수 0.

## 훅 (Hooks)

### `useVueServerSideData`

```ts
useVueServerSideData(datasource: ServerSideDatasource<TData>, options: UseVueServerSideDataOptions): UseVueServerSideDataResult<TData>
```

### `useVueServerSideTree`

```ts
useVueServerSideTree(datasource: ServerSideDatasource<TData>, options: UseVueServerSideTreeOptions): UseVueServerSideTreeResult<TData>
```

### `useVueViewportRowModel`

```ts
useVueViewportRowModel(datasource: ViewportDatasource<TData>, options: UseVueViewportRowModelOptions): UseVueViewportRowModelResult<TData>
```

## 함수

### `buildServerPivotColumns`

Build a nested pivot-result column tree from the server's flat field keys.

```ts
buildServerPivotColumns(fields: string[], separator: string): ServerPivotColumn[]
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `fields` | `string[]` | server-generated pivot-result field keys (order = desired column order). |
| `separator` | `string` | segment delimiter within a field key (default `'\|'`). |

### `checkLicense`

현재 라이선스 상태를 동기 검사하여 `LicenseCheckResult`를 반환한다.

- valid=false 이면 `watermarkRequired=true`.
- 유효하고 `expiresAt`까지 60일 미만이면 `expiryWarning='soon-expiring'` + `console.warn` (1회).
- 유효하고 만료 여유가 충분하면 `{ valid: true, watermarkRequired: false }`.

```ts
checkLicense(): LicenseCheckResult
```

### `isRowPlaceholder`

Type guard for placeholder rows from materialize.

```ts
isRowPlaceholder(row: unknown): row
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

## 타입 · 인터페이스

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

### `RowPlaceholder`

Placeholder row emitted by materialize for not-yet-loaded indices.

| 속성 | 타입 | 설명 |
|---|---|---|
| `__ssrmPlaceholder` | `true` | Discriminant — consumers test this to render a loading skeleton cell. |
| `rowIndex` | `number` | Absolute row index this placeholder stands in for. |

### `ServerPivotColumn`

A derived pivot-result column: a leaf (accessorKey) or a group (columns).

| 속성 | 타입 | 설명 |
|---|---|---|
| `accessorKey?` | `string` | Leaf only: the row field this column reads (the full server field key). |
| `columns?` | `ServerPivotColumn[]` | Group only: nested child columns. |
| `header` | `string` | Header label (the dimension value, or the measure name for a leaf). |
| `id` | `string` | Stable id (group: the path prefix; leaf: the full field key). |

### `ServerSideDatasource`

Consumer-supplied datasource. The single seam between the grid and the server.

| 속성 | 타입 | 설명 |
|---|---|---|
| `getRows` | `unknown` |  |

### `UseVueServerSideDataOptions`

| 속성 | 타입 | 설명 |
|---|---|---|
| `blockSize` | `number` | 블록당 행 수(요청 단위). |
| `pivot?` | `{ … }` | 서버사이드 피벗(옵션). 설정 시 요청에 pivotMode/pivotCols/valueCols 를 실어 보낸다. |
| `rowCount` | `number` | 초기 전체 행 수(응답의 lastRow 로 정제됨). |

### `UseVueServerSideDataResult`

| 속성 | 타입 | 설명 |
|---|---|---|
| `data` | `Ref<TData \| RowPlaceholder[]>` | 반응형 행 데이터 — 미로드 인덱스는 RowPlaceholder(isRowPlaceholder 로 감지). |
| `ensureRange` | `(…) => …` | 가시 범위 확보(가상화 visible range → 여기로 배선). |
| `pivotColumns` | `Ref<ServerPivotColumn[]>` | 서버 피벗 결과 파생 컬럼(피벗 응답 도착 전/비피벗 시 빈 배열). |
| `refresh` | `(…) => …` | 캐시 무효화(epoch++) + 가시 범위 재요청(in-flight 응답 폐기). |
| `setColumnFilters` | `(…) => …` | 필터 변경(서버 파라미터 파생). |
| `setSorting` | `(…) => …` | 정렬 변경(서버 파라미터 파생). |
| `totalCount` | `Ref<number>` | 반응형 전체 행 수(lastRow 학습에 따라 증가). |

### `UseVueServerSideTreeOptions`

| 속성 | 타입 | 설명 |
|---|---|---|
| `blockSize` | `number` | 블록당 행 수(노드별 요청 단위). |
| `rowGroupCols` | `string[]` | 그룹핑 컬럼, 바깥쪽 먼저(예: ['country', 'city']). |

### `UseVueServerSideTreeResult`

| 속성 | 타입 | 설명 |
|---|---|---|
| `data` | `Ref<TreeDisplayRow<TData>[]>` | 반응형 표시 행(그룹/리프, __ssrm 메타 포함). |
| `ensureRange` | `(…) => …` | 가시 범위 확보(가상화 visible range → 여기로 배선). |
| `refresh` | `(…) => …` | 트리 전체 무효화 + 가시 범위 재요청. |
| `setColumnFilters` | `(…) => …` | 필터 변경. |
| `setSorting` | `(…) => …` | 정렬 변경. |
| `toggleGroup` | `(…) => …` | 그룹 확장/축소 — 그룹 셀 렌더러에서 row.__ssrm.groupKeys 로 호출. |

### `UseVueViewportRowModelOptions`

| 속성 | 타입 | 설명 |
|---|---|---|
| `rowCount` | `number` | 초기 전체 행 수(datasource 의 setRowCount 로 정제됨). |

### `UseVueViewportRowModelResult`

| 속성 | 타입 | 설명 |
|---|---|---|
| `data` | `Ref<RowPlaceholder \| TData[]>` | 반응형 행 데이터 — RowPlaceholder 를 포함할 수 있다(isRowPlaceholder 로 감지). |
| `setRange` | `(…) => …` | 가시 범위 변경 통지(가상화 라이브러리의 visible range → 여기로 배선). |
| `totalCount` | `Ref<number>` | 반응형 전체 행 수(datasource 가 push 하며 증가). |

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

