---
title: "@topgrid/grid-pro-tracking"
sidebar_label: "grid-pro-tracking"
sidebar_position: 31
---

# @topgrid/grid-pro-tracking

> Pro: ChangeTracking, Mapping, Validator · **상용 (EULA)**

:::info 자동 생성
이 페이지는 소스 코드의 TSDoc 주석에서 자동 생성됩니다(내부 표식 정제). 큐레이트된 시작용 요약은 [API 레퍼런스](../api-reference) 참고.
:::

총 **17개** public export — 함수 2 · 훅 1 · 컴포넌트 1 · 타입 12 · 상수 1.

## 컴포넌트

### `ChangeTrackingGrid`

```ts
ChangeTrackingGrid(props: ChangeTrackingGridProps<TData> & { … }): ReactElement
```

## 훅 (Hooks)

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

## 함수

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

## 타입 · 인터페이스

### `BuildChangeSetOptions`

| 속성 | 타입 | 설명 |
|---|---|---|
| `mapping?` | `Mapping<TData>` | Screen-to-BE field mapping. When omitted, rows pass through as a shallow clone. |
| `validator?` | `Validator<TData>` | Row-level validator. When omitted, every row passes. |

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

### `CommitOptions`

Options for `commitChanges`.

| 속성 | 타입 | 설명 |
|---|---|---|
| `autoReset?` | `boolean` | Auto `resetChanges` on success. Default `true`. |
| `fetcher?` | `(…) => …` | Custom fetcher (axios-compatible). Default `globalThis.fetch`. |
| `method?` | `string` | HTTP method. Default `'POST'`. |
| `optimistic?` | `boolean` | Override `config.optimistic` for this single call. When `true`, a failure during commit dispatches RESET (rollback of all tracked changes) before re-throwing. Default = `config.optimistic`. |

### `MappedRow`

Mapped row shape produced by `buildChangeSet` / `getChangeSet`.
Keys correspond to BE field names after `Mapping<TData>` is applied.
When no mapping is provided the keys mirror the original `TData` fields.

### `RowStatusClassNames`

Tailwind className strings for each row status.
Pass a partial override to `getRowStatusClassName` to customise colours.

| 속성 | 타입 | 설명 |
|---|---|---|
| `added` | `string` |  |
| `deleted` | `string` |  |
| `edited` | `string` |  |

### `Mapping`

Screen-to-BE field mapping. Value is either a target BE field name or a
derived function `(row) => value`. Applied during `getChangeSet` / `commitChanges`.

```ts
type Mapping = Record<string, string | (…) => …>
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

### `RowStatus`

Row change status. `unchanged` rows omit `__rowStatus`.

```ts
type RowStatus = "added" | "edited" | "deleted"
```

### `Validator`

Row-level validator returning `{ valid, errors? }`. When `valid` is `false`,
the row is excluded from `added`/`updated` and an entry is pushed into `errors`.

```ts
type Validator = (…) => …
```

## 상수

### `defaultRowStatusClassNames`

Default Tailwind classNames for each row status.

```ts
const defaultRowStatusClassNames: Readonly<RowStatusClassNames>
```

