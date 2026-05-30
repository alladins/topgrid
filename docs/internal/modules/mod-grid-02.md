# 그리드 상태 모듈 (`@topgrid/grid-core` — state hooks)

그리드의 표시·상호작용 상태(정렬·필터·선택·페이지네이션·컬럼 핀/순서/크기/가시성)를
한 곳에서 관리하기 위한 hook set. TanStack Table v8 의 8개 표준 state 를 단일 훅으로
통합하고, 그 위에 URL 동기화·브라우저 스토리지 영속화를 옵션 helper 로 제공한다.

- 패키지: `@topgrid/grid-core`
- 라이선스: **MIT**
- 의존: `react` / `react-dom` / `@tanstack/react-table` 는 모두 peer dependency.
  외부 런타임 의존 없음(debounce·controllable·직렬화·스토리지 접근은 모두 자체 구현).
- 라우터 비의존: URL 동기화는 `window.history.replaceState` 를 직접 쓰며 특정 라우터
  라이브러리에 묶이지 않는다.

공개 surface 는 hook 3종 + 타입 6종이다.

| 공개 export | 종류 | 역할 |
|-------------|------|------|
| `useGridState` | hook | 8개 state + 8개 setter + reset 헬퍼를 한 번에 제공 |
| `useUrlSync` | hook | state ↔ URL search params 동기화(옵션) |
| `useStoragePersist` | hook | state ↔ localStorage/sessionStorage 영속화(옵션) |
| `GridState` | 타입 | `useGridState` 반환 타입(8 state + 8 setter + reset) |
| `GridStateValues` | 타입 | 8개 state 값만 담은 타입(setter 제외) |
| `GridStateKey` | 타입 | 8개 state 키의 union |
| `UseGridStateOptions` | 타입 | `useGridState` 옵션 |
| `UseUrlSyncOptions` | 타입 | `useUrlSync` 옵션 |
| `UseStoragePersistOptions` | 타입 | `useStoragePersist` 옵션 |

---

## 1. 개요 — 관리 대상 8개 state

모듈이 다루는 state 는 TanStack Table v8 의 표준 state 타입 8종이며, 키 이름과 타입을
그대로 따른다(별도 래핑 타입 없음).

| 키 | 타입 | 기본값 |
|----|------|--------|
| `sorting` | `SortingState` | `[]` |
| `columnFilters` | `ColumnFiltersState` | `[]` |
| `rowSelection` | `RowSelectionState` | `{}` |
| `pagination` | `PaginationState` | `{ pageIndex: 0, pageSize: 10 }` |
| `columnPinning` | `ColumnPinningState` | `{}` |
| `columnOrder` | `ColumnOrderState` | `[]` |
| `columnSizing` | `ColumnSizingState` | `{}` |
| `columnVisibility` | `VisibilityState` | `{}` |

이 8개 키의 집합은 `GridStateValues`(값만), `GridStateKey`(키 union)로 노출되며,
URL 동기화·스토리지 영속화 helper 도 동일한 8개 키를 단위로 동작한다.

```ts
type GridStateKey =
  | 'sorting' | 'columnFilters' | 'rowSelection' | 'pagination'
  | 'columnPinning' | 'columnOrder' | 'columnSizing' | 'columnVisibility';

interface GridStateValues<TData = unknown> {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  rowSelection: RowSelectionState;
  pagination: PaginationState;
  columnPinning: ColumnPinningState;
  columnOrder: ColumnOrderState;
  columnSizing: ColumnSizingState;
  columnVisibility: VisibilityState;
}
```

> `expanded`(트리/행 확장 상태)는 이 훅이 관리하지 않는다 — 확장 상태는 그리드
> 컴포넌트 내부가 소유하므로 혼선 방지를 위해 의도적으로 제외한다.

---

## 2. `useGridState` — state 통합 훅

```ts
function useGridState<TData = unknown>(
  options?: UseGridStateOptions<TData>,
): GridState<TData>
```

기존에는 그리드를 쓰는 컴포넌트마다 5~7개의 `useState<StateType>` 를 각자 선언하는
반복 패턴이 생겼다. `useGridState()` 는 이를 한 줄로 대체하고, 반환 객체를 TanStack
`useReactTable` 의 `state` 객체와 `onXxxChange` 핸들러에 그대로 연결할 수 있다.

옵션을 주지 않으면 8개 state 모두 uncontrolled(내부 관리, 위 §1 기본값)로 동작한다.

### 2.1 반환 타입 — `GridState`

```ts
interface GridState<TData = unknown> {
  // ─── 8 state 값 ───
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  rowSelection: RowSelectionState;
  pagination: PaginationState;
  columnPinning: ColumnPinningState;
  columnOrder: ColumnOrderState;
  columnSizing: ColumnSizingState;
  columnVisibility: VisibilityState;

  // ─── 8 setter (모두 TanStack OnChangeFn<T>) ───
  setSorting: OnChangeFn<SortingState>;
  setColumnFilters: OnChangeFn<ColumnFiltersState>;
  setRowSelection: OnChangeFn<RowSelectionState>;
  setPagination: OnChangeFn<PaginationState>;
  setColumnPinning: OnChangeFn<ColumnPinningState>;
  setColumnOrder: OnChangeFn<ColumnOrderState>;
  setColumnSizing: OnChangeFn<ColumnSizingState>;
  setColumnVisibility: OnChangeFn<VisibilityState>;

  // ─── reset 헬퍼 ───
  resetState: () => void;
  resetSection: (key: GridStateKey | GridStateKey[]) => void;
}
```

- 8개 setter 는 TanStack 표준 `OnChangeFn<T>` 시그니처(`T | ((prev: T) => T)`)라
  `useReactTable` 의 `onSortingChange` 등에 직접 전달 가능하며, functional update 도 지원한다.
- `resetState()` — 8개 state 를 모두 초기값(`initialState` 제공 시 그 값, 아니면 §1 기본값)으로 복원.
- `resetSection(key)` — 특정 키(들)만 선택적으로 초기값 복원. 단일 키 또는 키 배열을
  받으며, 배열에 중복 키가 있어도 한 번만 처리(멱등)한다.

### 2.2 옵션 — `UseGridStateOptions`

```ts
interface UseGridStateOptions<TData = unknown> {
  initialState?: Partial<GridStateValues<TData>>;
  state?: Partial<GridStateValues<TData>>;
  onStateChange?: (next: GridStateValues<TData>, changedKey: GridStateKey) => void;
  debounceMs?: number;
  clearSelectionKey?: string | number;
}
```

| 옵션 | 의미 |
|------|------|
| `initialState` | uncontrolled 모드 초기값. 키 단위 부분 지정 가능. 제공한 키만 기본값을 대체한다. |
| `state` | controlled 모드 외부 state. 키 단위 controlled 허용 — `state.sorting` 만 주면 `sorting` 은 controlled, 나머지는 uncontrolled(혼합 모드). |
| `onStateChange` | state 변경 통보 콜백. 변경 후 전체 snapshot 과 변경된 키를 받는다. controlled/uncontrolled 양쪽에서 호출된다. |
| `debounceMs` | `onStateChange` 의 debounce 대기 시간(ms). 미설정·0·음수면 동기 호출. `> 0` 이면 마지막 변경 후 해당 시간 경과 시 1회만 발화. |
| `clearSelectionKey` | 외부 트리거(string·number) — 값이 바뀔 때마다 `rowSelection` 을 `{}` 로 자동 reset. 마운트 시에는 트리거하지 않는다(아래 §5.4). |

#### controlled / uncontrolled / mixed

각 키는 독립적으로 controlled 여부가 결정된다. `state` 에 그 키가 존재하면 controlled
(외부 값이 진실, 내부 setter 는 값을 바꾸지 않고 `onStateChange` 만 발화), 없으면
uncontrolled(내부 state). 따라서 일부 키만 외부 store(Redux/Zustand 등)에 연결하고
나머지는 그리드가 알아서 관리하는 혼합 사용이 가능하다.

`initialState` 와 `state` 를 같은 키에 동시 지정하면 controlled(`state`)가 우선하고
해당 키의 `initialState` 는 무시된다.

---

## 3. `useUrlSync` — URL 동기화 helper(옵션)

```ts
function useUrlSync<TData = unknown>(
  state: GridStateValues<TData>,
  options?: UseUrlSyncOptions<TData>,
): void
```

`GridStateValues` 의 임의 subset 을 URL 쿼리스트링에 양방향 동기화한다. 페이지
새로고침이나 URL 공유 시 동일한 그리드 상태를 복원할 수 있다. `useGridState` 와
독립적인 옵션 helper 이며, 반환값은 `void` 다(아래 §5.1 hydration 패턴 참고).

```ts
interface UseUrlSyncOptions<TData = unknown> {
  keys?: GridStateKey[];   // 동기화 대상 키 (미지정 시 8개 전체)
  debounceMs?: number;     // URL 쓰기 debounce (기본 0 = 즉시)
  onHydrate?: (partial: Partial<GridStateValues<TData>>) => void;  // mount 시 URL→state
  prefix?: string;         // URL param 네임스페이스 (기본 '' = 없음)
}
```

동작:

- **state → URL**: 지정한 키의 값이 바뀌면 `JSON.stringify` 직렬화 후
  `window.history.replaceState` 로 URL 갱신. `prefix` 지정 시 `${prefix}_${key}` 형태로
  param 을 만들어 여러 그리드가 한 페이지에 공존해도 충돌하지 않는다.
- **기본값 정리**: 어떤 키가 기본값(빈 배열/빈 객체/`{ pageIndex: 0, pageSize: 10 }`)이면
  해당 param 을 URL 에서 삭제해 쿼리스트링을 깔끔하게 유지한다.
- **타 param 보존**: URL 에 이미 있던 다른 쿼리 param 은 건드리지 않는다(지정 키만 수정).
- **URL → state(hydration)**: mount 시 현재 URL 을 파싱해 파싱 성공한 키만 모아
  `onHydrate(partial)` 로 넘긴다. 깨진 값(`JSON.parse` 실패)은 조용히 건너뛴다.

---

## 4. `useStoragePersist` — 브라우저 스토리지 영속화 helper(옵션)

```ts
function useStoragePersist<TData = unknown>(
  state: GridStateValues<TData>,
  options: UseStoragePersistOptions<TData>,
): void
```

8개 state 전체를 `localStorage` 또는 `sessionStorage` 에 영속화한다. 페이지를 떠났다가
돌아와도 정렬/필터/페이지 등 그리드 상태가 유지된다. `useUrlSync` 와 같은 패턴(void
반환 + `onHydrate`)을 따르는 독립 옵션 helper 다.

```ts
interface UseStoragePersistOptions<TData = unknown> {
  storageKey: string;              // 필수 — 저장 키 (앱 내 고유)
  version?: number;                // 저장 포맷 버전 (기본 1)
  storage?: 'local' | 'session';   // 기본 'local'
  debounceMs?: number;             // 저장 debounce (기본 300)
  onHydrate?: (partial: Partial<GridStateValues<TData>>) => void;  // mount 시 storage→state
}
```

동작:

- **state → storage**: state 변경 시 기본 300ms debounce 후 저장. 저장 포맷은
  `{ v: version, p: <직렬화된 쿼리스트링> }` envelope 를 `JSON.stringify` 한 문자열로,
  URL 동기화와 같은 직렬화 로직을 재사용한다(§5.3).
- **storage → state(hydration)**: mount 시 1회 읽어 envelope 의 `v` 가 옵션 `version` 과
  일치하면 파싱한 값을 `onHydrate(partial)` 로 넘긴다.
- **version 불일치 / 손상 데이터**: `version` 이 다르거나 `JSON.parse` 가 실패하면 해당
  키를 storage 에서 제거(`removeItem`)하고 `onHydrate` 를 호출하지 않는다. 스키마가
  바뀌었을 때 `version` 을 올리면 옛 데이터가 자동 폐기된다.
- **저장 공간 초과**: `QuotaExceededError` 발생 시 저장을 건너뛰고 `console.warn` 만
  남긴다(앱을 깨뜨리지 않음).
- **SSR / 스토리지 비가용**: `window` 가 없거나(SSR) 사파리 프라이빗 모드 등으로 storage
  접근이 막힌 환경에서도 에러 없이 no-op 으로 동작한다.

---

## 5. 핵심 설계 결정과 근거

### 5.1 helper 는 void 반환 + `onHydrate` 콜백

`useUrlSync` / `useStoragePersist` 는 둘 다 `void` 를 반환한다. URL·스토리지에서 읽어온
초기값을 그리드 state 로 되돌리는(hydration) 방향은 hook 이 직접 state 를 쓰지 않고
`onHydrate(partial)` 콜백으로 호출부에 위임한다. 호출부는 `useGridState` 의 setter
(또는 자신이 가진 외부 state 갱신 로직)로 값을 반영한다.

이 분리에는 분명한 이점이 있다. helper 가 state 소유권을 갖지 않으므로 controlled/
uncontrolled 어느 모드의 그리드와도 결합되고, 외부 store 와도 자연스럽게 연동된다.
helper 는 "state 를 외부에 쓰고/읽어온다"는 부수효과만 담당하고, 진실의 출처는 항상
호출부가 유지한다.

### 5.2 외부 state 주입은 키 단위 controllable

controlled/uncontrolled 판단을 그리드 전체가 아니라 8개 키 각각에 대해 내린다. 어떤
키에 외부 값을 주면 그 키만 controlled 가 되고 나머지는 그리드가 관리한다. 서버 사이드
검색처럼 일부 state(예: 정렬)만 외부 폼·store 와 연동하고 싶은 흔한 요구를 추가 동기화
코드 없이 충족한다. 내부적으로는 단일 controllable-state 추상화가 각 키마다
"외부 값이 있으면 그 값을 진실로, 없으면 내부 `useState` 로" 분기한다.

> 마운트 후 같은 키가 controlled↔uncontrolled 로 바뀌면 개발 모드에서 1회 경고를
> 출력한다(React controlled-component 표준과 동일 — 권장하지 않는 사용).

### 5.3 직렬화 로직 단일화 (URL ↔ storage 공유)

URL 동기화와 스토리지 영속화는 같은 직렬화/역직렬화 유틸을 공유한다. 스토리지는
문자열만 저장하므로, state 를 `URLSearchParams` 쿼리스트링으로 직렬화한 뒤 그 문자열을
`{ v, p }` envelope 로 감싸 저장한다. 덕분에 "어떤 키가 기본값이라 생략 대상인지",
"JSON 파싱 실패를 어떻게 건너뛰는지" 같은 규칙이 두 helper 에서 일관된다.

### 5.4 `clearSelectionKey` — 외부 트리거로 선택 해제

새 검색을 실행할 때 이전 행 선택을 비우는 패턴은 그리드에서 매우 흔하다. 이를 위해
값 자체가 아니라 "값의 변경"이 신호인 트리거 prop 을 둔다. 호출부가 카운터를 증가시키거나
타임스탬프를 바꾸면 그리드가 `rowSelection` 을 `{}` 로 초기화한다. 마운트 시점에는
트리거하지 않아(초기 렌더에서 불필요한 reset 방지) 사용자가 기대하지 않는 선택 해제가
일어나지 않는다. 타입은 `string | number` 로 제한해 안전성을 확보한다.

### 5.5 debounce 는 자체 구현, 외부 라이브러리 비의존

`onStateChange`(useGridState) 와 storage 저장(useStoragePersist), URL 쓰기(useUrlSync)는
모두 옵션 debounce 를 지원하되 `lodash` 같은 외부 패키지에 의존하지 않고 `useRef` +
`setTimeout` 으로 자체 구현한다. 핵심 동작 규칙:

- `ms <= 0` 이면 debounce 없이 즉시(동기) 호출 — 옵션 미설정 시 기존 동기 동작 보존.
- `ms > 0` 이면 마지막 호출 후 해당 시간 경과 시 1회 발화(직전 호출은 취소).
- 언마운트 시 대기 중인 타이머를 정리해 누수·마운트 해제 후 콜백 발화를 막는다.

### 5.6 reset 의 초기값은 마운트 시 고정

`resetState()`/`resetSection()` 이 복원할 초기값은 마운트 시점의 `initialState` 를 한 번
캡처해 고정한다. 렌더 도중 `initialState` 가 바뀌어도 reset 대상은 흔들리지 않는다 —
"무엇으로 되돌릴지"가 사용자 조작 타이밍마다 달라지는 혼란을 막기 위함이다.

### 5.7 controlled 키의 reset 은 통보만

controlled 키에서 `resetState()`/`resetSection()` 를 호출하면 내부 값을 직접 바꾸지 않고
`onStateChange` 만 발화한다. controlled 키의 진실은 외부에 있으므로, reset 헬퍼는
"초기화 의도를 전달"하고 실제 갱신은 외부 핸들러가 책임진다. controlled 아키텍처의
일관성을 유지하기 위한 선택이다.

---

## 6. 엣지 케이스 동작 요약

| 상황 | 동작 |
|------|------|
| 옵션 없이 `useGridState()` | 8개 state 모두 uncontrolled, §1 기본값 |
| `useGridState` 를 한 컴포넌트에서 2회 호출 | 독립 state 인스턴스 2개(공유 없음) |
| `setPagination` 에 updater 함수 전달 | `OnChangeFn` — `T` 와 `(prev) => T` 모두 허용 |
| `state.sorting` 만 controlled (mixed) | sorting 은 외부 값 우선, 나머지는 내부 관리 |
| `initialState` 와 `state` 동시 지정(같은 키) | controlled(`state`) 우선, `initialState` 무시 |
| `debounceMs` 미설정/0/음수 | 동기 호출 |
| `resetSection(['pagination', 'pagination'])` | 중복 dedup → 1회만 reset(멱등) |
| `clearSelectionKey` 초기값 존재(마운트) | 트리거 안 함 — 이후 값 변경부터 reset |
| `clearSelectionKey` 빠른 연속 변경 | 최종 변경에 대한 reset 보장(React batching) |
| URL/스토리지 값 파싱 실패 | 해당 키 건너뜀, `onHydrate` 에 미포함 |
| 스토리지 `version` 불일치 | 키 제거 + `onHydrate` 미호출 |
| `QuotaExceededError` | 저장 건너뜀 + `console.warn` |
| SSR / 스토리지 비가용 | 에러 없이 no-op |

---

## 7. 사용 예시

### 7.1 기본 — `useReactTable` 와이어링

```tsx
import { useGridState } from '@topgrid/grid-core';
import { useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table';

function UserGrid() {
  const s = useGridState<User>();

  const table = useReactTable<User>({
    data: users,
    columns,
    state: {
      sorting: s.sorting,
      columnFilters: s.columnFilters,
      rowSelection: s.rowSelection,
      pagination: s.pagination,
    },
    onSortingChange: s.setSorting,
    onColumnFiltersChange: s.setColumnFilters,
    onRowSelectionChange: s.setRowSelection,
    onPaginationChange: s.setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // table 렌더링...
}
```

### 7.2 초기값 + 검색 시 reset + 선택 해제

```tsx
const [searchKey, setSearchKey] = useState(0);

const s = useGridState<Slip>({
  initialState: {
    sorting: [{ id: 'date', desc: true }],
    pagination: { pageIndex: 0, pageSize: 20 },
  },
  clearSelectionKey: searchKey, // 변경 시 rowSelection 자동 초기화
});

const handleSearch = () => {
  s.resetState();             // 초기값으로 복원 (정렬·페이지 등)
  setSearchKey((k) => k + 1); // rowSelection 비우기 트리거
  fetchData(formValues);
};

const handleClearFilter = () => {
  s.resetSection('columnFilters'); // 필터만 초기화, 정렬/페이지 유지
};
```

### 7.3 URL 동기화 + 스토리지 영속화

```tsx
const s = useGridState<Report>();

// 정렬·필터를 URL 에 반영 (공유 가능한 링크)
useUrlSync(s, {
  keys: ['sorting', 'columnFilters'],
  debounceMs: 300,
  onHydrate: (partial) => {
    if (partial.sorting) s.setSorting(partial.sorting);
    if (partial.columnFilters) s.setColumnFilters(partial.columnFilters);
  },
});

// 전체 state 를 localStorage 에 영속화 (재방문 시 복원)
useStoragePersist(s, {
  storageKey: 'report-grid-v1',
  version: 1,
  onHydrate: (partial) => {
    if (partial.sorting) s.setSorting(partial.sorting);
    if (partial.pagination) s.setPagination(partial.pagination);
    // ... 필요한 키만 선택적으로 반영
  },
});
```
