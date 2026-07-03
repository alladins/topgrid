---
title: "@topgrid/grid-pro-datamap"
sidebar_label: "grid-pro-datamap"
sidebar_position: 16
---

# @topgrid/grid-pro-datamap

> Pro: DataMap (foreign key display) · **상용 (EULA)**

:::info 자동 생성
이 페이지는 소스 코드의 TSDoc 주석에서 자동 생성됩니다(내부 표식 정제). 큐레이트된 시작용 요약은 [API 레퍼런스](../api-reference) 참고.
:::

총 **14개** public export — 함수 2 · 훅 0 · 컴포넌트 2 · 타입 10 · 상수 0.

## 컴포넌트

### `DataMapCell`

DataMapCell&lt;TData>: TanStack CellContext 수신 → column.dataMap.getDisplay(value) → 레이블 렌더.

- 정적 dataMap: column.columnDef.dataMap가 DataMap 인스턴스
- 함수형 dataMap: column.columnDef.dataMap(row.original) → DataMap 인스턴스
- getDisplay 결과 없음(undefined) → String(value ?? '') fallback (.3)
- dataMap 미설정 시 → String(value ?? '') fallback (.1)

: TanStack CellContext 표준 API 사용
: no any (DataMapColumnDef&lt;TData> 타입 캐스팅 — DataMap 전용 확장 필드 접근용)
: 가상화 호환 — resolveDataMap + getDisplay 모두 O(1)

```ts
DataMapCell(info: CellContext<TData, unknown>): Element
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `info` | `CellContext<TData, unknown>` | TanStack CellContext&lt;TData, unknown> (createColumns.ts L128-130 패턴) |

**반환** — span 엘리먼트 — 레이블 텍스트 또는 fallback

### `DataMapEditor`

DataMapEditor&lt;TItem>: 편집 셀 필터-타이핑 드롭다운 컴포넌트.

- 마운트 시 input에 자동 포커스
- 타이핑 → items 필터링 (대소문자 무관, IME 조합 중 필터 억제)
- 드롭다운: absolute z-50 bg-white border border-gray-200 rounded shadow-md max-h-48 overflow-y-auto
- 키보드: ArrowDown/Up 이동, Enter 선택, Escape 취소
- ARIA: role="combobox" + aria-expanded + role="listbox" + role="option"
- highlightedIndex: filtered.length 변경 시 -1 리셋 (spec Section 11.2 risk #4)
- isComposing: useRef&lt;boolean> 사용 — setState 불필요 (spec Section 11.2 risk #3)

: DataMapEditorProps&lt;TItem> 표준 API (spec Section 3.1)
: no any — TItem 제네릭 상한
: Tailwind CSS only
: getItems + Array.filter — O(n), 가상화 호환

```ts
DataMapEditor(props: DataMapEditorProps<TItem>): Element
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `props` | `DataMapEditorProps<TItem>` | DataMapEditorProps&lt;TItem> |

**반환** — 입력 필드 + 조건부 드롭다운 컨테이너

## 함수

### `createAsyncDataMap`

createAsyncDataMap&lt;TItem>: AsyncDataMap 팩토리.

- DataMap&lt;TItem> 완전 구현: getDisplay, getItems, getValue
- 4-state 상태머신: idle → loading → loaded/error (Section 12)
- staleTime 기반 캐싱 + invalidate
- pendingPromise de-dupe: 동시 load 호출 시 동일 Promise 공유
- onStateChange?: 구독 콜백 등록 → 구독 해제 함수 반환 (Section 3.1)

```ts
createAsyncDataMap(options: CreateAsyncDataMapOptions<TItem>): AsyncDataMap<TItem>
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `options` | `CreateAsyncDataMapOptions<TItem>` | CreateAsyncDataMapOptions&lt;TItem> |

**반환** — AsyncDataMap&lt;TItem>

### `createDataMap`

createDataMap&lt;TItem>: DataMap 팩토리 함수.
items 배열과 valuePath/displayPath 설정으로 DataMap 인스턴스 생성.

```ts
createDataMap(options: CreateDataMapOptions<TItem>): DataMap<TItem>
```

**예시**

```ts
const map = createDataMap({
  items: [{ code: 'A', name: '항목A' }],
  valuePath: 'code',
  displayPath: 'name',
});
map.getDisplay('A'); // '항목A'
map.getValue('항목A'); // 'A'
```

## 타입 · 인터페이스

### `AsyncDataMap`

AsyncDataMap&lt;TItem>: 비동기 DataMap 인터페이스.
DataMap&lt;TItem>을 확장 — DataMapEditor/DataMapCell에 동기 DataMap과 동일하게 사용 가능.

추가 멤버:
- state: 현재 로딩 상태 (readonly)
- load: 비동기 로드 트리거 — Promise&lt;void> (이미 loading 중이면 동일 Promise 공유)
- invalidate: 캐시 무효화 → state 'idle' 리셋 → 다음 getItems 시 재로드
- onStateChange?: state 변경 콜백 등록 (DataMapEditor spinner 연동용)
 반환값 = unsubscribe 함수 (DataMapEditor useEffect cleanup 호출)

: no any — TItem 상한 유지
: onStateChange? optional — 미제공 시 undefined 체크 필수

| 속성 | 타입 | 설명 |
|---|---|---|
| `state` | `AsyncDataMapState` |  |
| `getDisplay` | `unknown` |  |
| `getItems` | `unknown` |  |
| `getValue` | `unknown` |  |
| `invalidate` | `unknown` |  |
| `load` | `unknown` |  |
| `onStateChange?` | `unknown` |  |

### `CreateAsyncDataMapOptions`

CreateAsyncDataMapOptions&lt;TItem>: createAsyncDataMap 팩토리 옵션.

: no any
: staleTime? optional — 미제공 시 내부 DEFAULT_STALE_TIME(300_000 ms) 사용.
 내부 소비: `options.staleTime !== undefined ? options.staleTime : DEFAULT_STALE_TIME`

| 속성 | 타입 | 설명 |
|---|---|---|
| `displayPath` | `PathOrAccessor<TItem, string>` | 표시 레이블 경로 또는 accessor |
| `loader` | `(…) => …` | 옵션 항목 비동기 로더 — Promise&lt;TItem[]> 반환 |
| `staleTime?` | `number` | 캐시 유효 기간 (ms). 미제공 시 5분(300_000 ms). : optional — staleTime !== undefined 체크 후 내부 사용 |
| `valuePath` | `PathOrAccessor<TItem, unknown>` | 코드 값 경로 또는 accessor |

### `CreateDataMapOptions`

| 속성 | 타입 | 설명 |
|---|---|---|
| `displayPath` | `PathOrAccessor<TItem, string>` |  |
| `items` | `TItem[]` |  |
| `valuePath` | `PathOrAccessor<TItem, unknown>` |  |

### `DataMap`

DataMap&lt;TItem>: 코드 값 ↔ 레이블 양방향 조회 인터페이스.
createDataMap 팩토리 함수가 반환하는 단일 타입.

| 속성 | 타입 | 설명 |
|---|---|---|
| `getDisplay` | `unknown` |  |
| `getItems` | `unknown` |  |
| `getValue` | `unknown` |  |

### `DataMapEditorProps`

DataMapEditorProps&lt;TItem>: 편집 셀 드롭다운 에디터 컴포넌트 파라미터 타입.
: 필터-타이핑 드롭다운 (DataMapEditor).

: no any — : exactOptionalPropertyTypes=true 호환

| 속성 | 타입 | 설명 |
|---|---|---|
| `dataMap` | `DataMap<TItem>` | 선택 목록 제공자 — getItems로 전체 항목 반환 |
| `getLabelFromItem?` | `(…) => …` | Optional: TItem → 표시 레이블 변환 함수. DataMap 내부 Map이 valuePath(item) 코드 키로 저장되므로 getDisplay(item) 직접 호출 불가 (F-06 spec code defect 수정). 미제공 시 String(item) fallback (spec Section 11.3 explicit alternative). : optional — 미제공 시 undefined (spread-skip 불필요, 내부 소비용) |
| `onCancel` | `(…) => …` | 편집 취소 콜백 |
| `onCommit` | `(…) => …` | 선택 확정 콜백 — newValue는 DataMap의 코드 값 |
| `value` | `unknown` | 현재 셀의 코드 값 (DataMap.getValue 기준) |

### `AsyncDataMapState`

AsyncDataMapState: AsyncDataMap 내부 로딩 상태 머신.
'idle': 초기 상태 (load 미호출)
'loading': loader Promise 실행 중
'loaded': items 로드 완료 + 캐시 유효
'error': loader reject — fallback 빈 목록 반환

: no any — string literal union

```ts
type AsyncDataMapState = "idle" | "loading" | "loaded" | "error"
```

### `DataMapCellProps`

DataMapCellProps&lt;TData>: DataMapCell 컴포넌트의 파라미터 타입 alias.
: TanStack CellContext&lt;TData, unknown> = DataMapCell의 단일 입력 타입.
사용처에서 `DataMapCellProps<MyRow>` 로 단축 참조 가능.

```ts
type DataMapCellProps = CellContext<TData, unknown>
```

### `DataMapColumnDef`

DataMapColumnDef&lt;TData>: TanStack ColumnDef + dataMap/selectOptions 확장. Primary export.
: dataMap + selectOptions 타입 필드만 정의.
/: 실제 렌더러·에디터 연결.

: no any (DataMap&lt;unknown>으로 상한 타입 사용)
: exactOptionalPropertyTypes=true — optional 필드는 undefined 명시 필요

Note: intersection 패턴 채택 (spec Section 3.3, spec ).
 prose의 Omit&lt;...>+'meta?: TopgridColumnMeta' 안은 TopgridColumnMeta 정의 누락으로 실현 불가 —
: spec code template + 가 권위. spec feedback L1 참조.

Renamed from TopgridColumnDef (ADR-MOD-GRID-REFACTOR-2026-05-17-006, POL-COMPAT §3).
See TopgridColumnDef deprecation alias below.

```ts
type DataMapColumnDef = ColumnDef<TData, unknown> & { … }
```

### `PathOrAccessor`

valuePath / displayPath: keyof TItem 또는 accessor 함수

```ts
type PathOrAccessor = keyof TItem | (…) => …
```

### `TopgridColumnDef`

```ts
type TopgridColumnDef = DataMapColumnDef<TData>
```

