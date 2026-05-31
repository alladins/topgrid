# 컬럼 드래그 재정렬 모듈 (MOD-GRID-07)

사용자가 컬럼 헤더를 드래그하거나 키보드로 이동시켜 컬럼 순서를 바꾸고, 그 순서를
localStorage 에 영속화하는 기능. HTML5 Drag and Drop API + Web Storage API 만 사용하며
외부 드래그 라이브러리에 의존하지 않는다.

- 패키지: `@topgrid/grid-core` (정식 export 위치). `@topgrid/grid-features` 에도 동일
  심볼이 deprecated 별칭으로 재export 되며, 차기 메이저에서 제거 예정 — 신규 코드는
  `@topgrid/grid-core` 에서 import 한다.
- 라이선스: **MIT**
- 의존: `react` / `@tanstack/react-table` 는 peer dependency. 드래그·영속화·키보드
  로직은 모두 네이티브 브라우저 API(`DragEvent` / `KeyboardEvent` / `localStorage`)만
  사용 — 추가 런타임 의존 0.
- 스타일: drop 인디케이터는 Tailwind className 으로만 스타일링(인라인 `style` 없음).

---

## 1. 개요 — 기능과 공개 심볼

`<Grid>` 컴포넌트의 prop 만으로 활성화하는 것이 1차 사용법이고, 커스텀 `<table>` 을 직접
구성하는 경우를 위해 내부 hook/컴포넌트도 공개한다.

| 심볼 | 종류 | 역할 |
|------|------|------|
| `useColumnDrag` | hook | 드래그·키보드 이동·영속화를 통합한 핵심 hook. `<th>` 에 spread 할 드래그 props, drop 인디케이터 상태, 키보드 핸들러를 반환 |
| `useColumnOrderPersist` | hook | 컬럼 순서를 localStorage 에 저장/복원하는 영속화 전담 hook (`useColumnDrag` 내부에서 사용) |
| `DropIndicator` | 컴포넌트 | 드래그 중 drop 위치를 표시하는 파란 수직선 인디케이터 |
| `UseColumnDragProps` / `UseColumnDragReturn` / `DragThProps` | 타입 | `useColumnDrag` 입출력 타입 |
| `UseColumnOrderPersistProps` | 타입 | `useColumnOrderPersist` 입력 타입 |

기능 묶음:

- **드래그 재정렬** — 헤더 `<th>` 를 끌어 다른 헤더 위에 놓으면 두 컬럼 순서가 바뀐다.
  드래그 중 대상 위치에 시각 인디케이터를 표시한다.
- **키보드 이동** — 헤더에 포커스(`Tab`)한 뒤 `Alt+←` / `Alt+→` 로 컬럼을 좌/우 한 칸
  이동한다.
- **영속화** — 변경된 순서를 localStorage 에 저장하고, 다음 마운트 시 자동 복원한다.
- **pinned 가드** — 고정(pinned) 컬럼은 드래그·키보드 이동의 출발점/도착점에서 모두
  제외되어 위치가 보존된다.

순서 변경은 항상 TanStack Table v8 의 `table.setColumnOrder(newOrder)` 표준 API 를 통해
적용된다. 별도의 평행(parallel) 순서 state 를 두지 않으므로 그리드의 `columnOrder`
controlled state 가 단일 진실원(single source of truth)이다.

---

## 2. `<Grid>` prop 계약

이 모듈이 `GridProps<TData>` 에 추가하는 prop. 모두 optional opt-in 이며, 미지정 시 기존
렌더링·동작에 영향이 없다.

```ts
interface GridProps<TData> {
  // ── 드래그 재정렬 ──
  /** 컬럼 드래그 재정렬 + 키보드 이동 활성 (default false). */
  enableColumnReorder?: boolean;
  /** 컬럼 순서 변경 완료 후 호출되는 콜백. 부모 외부 state 동기화용. */
  onColumnOrderChange?: (order: string[]) => void;

  // ── 영속화 ──
  /** 컬럼 순서 localStorage 영속화 활성 (default false). */
  persistColumnOrder?: boolean;
  /** persistColumnOrder=true 시 사용할 localStorage 키. */
  columnOrderStorageKey?: string;
}
```

- `enableColumnReorder` 단일 플래그가 **드래그와 키보드 이동 양쪽**을 함께 켠다. 별도의
  `enableKeyboardMove` 같은 prop 은 없다(§4.2).
- `onColumnOrderChange(order)` 는 드래그 drop 또는 키보드 이동이 완료되어
  `table.setColumnOrder` 가 호출된 **직후** 새 순서 배열로 호출된다.
- `persistColumnOrder=true` 인데 `columnOrderStorageKey` 가 미지정(또는 빈 문자열)이면
  저장/복원을 모두 건너뛴다 — localStorage 에 전혀 접근하지 않는다.

기본 사용:

```tsx
import { Grid } from '@topgrid/grid-core';

<Grid
  data={rows}
  columns={columns}
  enableColumnReorder
  persistColumnOrder
  columnOrderStorageKey="my-grid-column-order-v1"
  onColumnOrderChange={(order) => console.log('order changed:', order)}
/>;
```

---

## 3. hook API 계약

`<Grid>` 가 아닌 커스텀 `<table>` 을 직접 구성할 때 사용한다.

### useColumnDrag

```ts
function useColumnDrag<TData>(props: UseColumnDragProps<TData>): UseColumnDragReturn;

interface UseColumnDragProps<TData> {
  table: Table<TData>;                              // TanStack v8 인스턴스
  enabled: boolean;                                 // enableColumnReorder 로부터 전달
  onColumnOrderChange?: (order: string[]) => void;
  persistColumnOrder?: boolean;
  columnOrderStorageKey?: string;
}

interface UseColumnDragReturn {
  /** <th> 에 spread 할 드래그 props 반환. */
  getDragProps: (columnId: string, isPinned: boolean) => DragThProps;
  /** 현재 drop 인디케이터를 표시할 컬럼 ID (null = 표시 안 함). */
  dragOverId: string | null;
  /** <th> onKeyDown 에 연결할 핸들러 반환 함수. */
  getKeyDownHandler: (columnId: string, isPinned: boolean) => (e: KeyboardEvent) => void;
}

interface DragThProps {
  draggable: boolean;                       // pinned=true 또는 비활성 → false
  onDragStart: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onDragEnd: (e: DragEvent) => void;
}
```

- `getDragProps`/`getKeyDownHandler` 는 호출자가 `columnId` 와 `isPinned`
  (`column.getIsPinned() !== false`)를 넘기는 **per-header 팩토리** 함수다.
- `DragThProps` 와 키보드 핸들러는 **DOM** `DragEvent` / `KeyboardEvent` 를 받는다. React
  합성 이벤트를 쓰는 곳에서는 `e.nativeEvent` 를 추출해 전달한다
  (`onDragStart={(e) => dragProps.onDragStart(e.nativeEvent)}`).
- 드래그 시 소스 컬럼 ID 는 `dataTransfer.setData('columnId', id)` 로 전달하며, 동시에
  내부 ref 에도 보관해 `dataTransfer` 가 비어 있는 경우의 fallback 으로 쓴다.

### useColumnOrderPersist

```ts
function useColumnOrderPersist<TData>(
  props: UseColumnOrderPersistProps<TData>,
): { saveOrder: (order: string[]) => void };

interface UseColumnOrderPersistProps<TData> {
  table: Table<TData>;
  enabled: boolean;     // persistColumnOrder
  storageKey: string;   // columnOrderStorageKey (빈 문자열이면 no-op)
}
```

- 마운트 시 1회 localStorage 에서 저장된 순서를 읽어 `table.setColumnOrder` 로 복원한다.
- 반환된 `saveOrder(order)` 를 순서 변경 완료 시점에 호출하면 localStorage 에 저장된다.
  `useColumnDrag` 가 내부에서 외부 `onColumnOrderChange` 콜백과 `saveOrder` 를 하나의
  진입점으로 합성해 호출한다.
- 모든 localStorage 접근(읽기/쓰기/삭제)은 SSR 가드와 try/catch 로 감싼 내부 storage
  어댑터에 위임된다 — private 브라우징·SSR·`QuotaExceededError` 환경에서 throw 하지 않고
  조용히 건너뛴다.

### DropIndicator

```tsx
function DropIndicator(props: { dragOverId: string | null; columnId: string }): JSX.Element | null;
```

- `dragOverId === columnId` 일 때만 렌더한다. 부모 `<th className="relative">` 안에서
  절대 위치(`absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500`)로 파란 수직선을 그린다.
- `aria-hidden` + `pointer-events-none` — 순수 시각 표시이며 드래그 히트테스트를 방해하지
  않는다.

---

## 4. 핵심 설계 결정과 근거

### 4.1 외부 라이브러리 비의존 — 네이티브 API 직접 구현
드래그는 HTML5 `DragEvent` + `dataTransfer`, 키보드는 `KeyboardEvent.altKey`/`.key`,
영속화는 Web Storage `localStorage` 만 쓴다. `react-dnd` / `dnd-kit` 같은 외부 패키지를
peer dependency 로 들이지 않는다. 번들 비용과 의존성 트리를 작게 유지하고, 소비자가 다른
DnD 라이브러리를 쓰더라도 충돌하지 않는다.

### 4.2 단일 활성 플래그 — `enableColumnReorder` 가 드래그+키보드 모두 제어
드래그만 켜고 키보드는 끄는(또는 그 반대) 유스케이스가 실질적으로 없고, 두 경로가 pinned
가드·순서 재계산 알고리즘을 그대로 공유한다. 따라서 API 표면을 최소화하기 위해 별도의
키보드 전용 플래그를 두지 않았다.

### 4.3 순서 변경은 TanStack `setColumnOrder` 단일 경로
드래그 drop, 키보드 이동, localStorage 복원 — 세 경로 모두 최종적으로
`table.setColumnOrder(newOrder)` 를 호출한다. 그리드의 `columnOrder` controlled state 가
유일한 순서 원본이며, 평행 state 를 따로 두지 않아 동기화 버그 여지를 없앤다. 키보드/드래그
모두 현재 `columnOrder` 가 비어 있으면 `table.getAllLeafColumns()` 의 ID 순서를 baseline
으로 사용한다(초기 상태 대응).

### 4.4 영속화 콜백 합성 — `onColumnOrderChange` + `saveOrder` 일원화
`useColumnDrag` 는 외부 `onColumnOrderChange` 와 영속화의 `saveOrder` 를 하나의 내부
핸들러로 합성한다. 그 결과 드래그든 키보드든 순서가 바뀌면 부모 콜백 통지와 localStorage
저장이 같은 시점에 함께 일어난다. 저장 디바운스는 두지 않는다 — 드래그·키보드 모두 사용자
조작이 끝난 뒤 1회만 fire 되기 때문이다.

### 4.5 focus-scoped 키보드 핸들러 — document 리스너 미사용
`Alt+←` / `Alt+→` 는 헤더 `<th>` 의 `onKeyDown`(포커스 스코프)에만 연결한다.
`document.addEventListener` 같은 전역 리스너를 쓰지 않으므로, 같은 키 조합을 쓰는 다른
컴포넌트(예: 페이지네이션의 키보드 네비게이션)와 동시에 발화하지 않는다. 핸들러는 자신이
처리한 경우에만 `e.preventDefault()` 한다.

### 4.6 접근성 — `aria-roledescription`, `aria-grabbed` 미사용
헤더에 `tabIndex={0}` 을 부여해 키보드 포커스를 가능하게 하고,
`enableColumnReorder=true` 일 때 `aria-roledescription="draggable column"` 을 단다.
WAI-ARIA 1.1 에서 deprecated 된 `aria-grabbed` 대신, `draggable` 속성 자체의 시맨틱과
`aria-roledescription` 으로 역할을 설명한다. `tabIndex=0` 은 시각적 변화가 없다.

### 4.7 pinned 가드 — 출발·도착 양쪽에서 보호
고정 컬럼(`column.getIsPinned() !== false`)은 (1) `draggable={false}` 로 드래그 자체가
시작되지 않고, (2) drop 대상이 pinned 면 drop 핸들러가 early return 하며, (3) 키보드 이동
시에는 출발 컬럼이 pinned 면 no-op, 도착 위치 계산 시 pinned 컬럼을 건너뛴다. 세 경로
모두에서 고정 컬럼 위치가 보존된다.

### 4.8 영속화 데이터 검증 — 손상 데이터 자동 정리
복원 시 localStorage 값이 문자열 배열이 아니면(JSON 파싱 실패 또는 타입 불일치) 해당 키를
제거하고 복원을 건너뛴다. 잘못된 저장값이 영구히 남아 매 마운트마다 실패하는 상황을 막는다.

---

## 5. 엣지 케이스 동작 요약

| 시나리오 | 동작 |
|---------|------|
| `enableColumnReorder` 미지정/false | 모든 `<th>` `draggable=false`, 드래그·키보드 핸들러 no-op |
| pinned 컬럼 드래그 시도 | `draggable=false` — 브라우저 DnD 자체 비활성 |
| pinned 컬럼 위에 drop | drop 핸들러 early return — 순서 변경 없음 |
| source === target (같은 컬럼에 drop) | 순서 변경 없이 인디케이터 상태만 리셋 |
| `columnOrder` 빈 배열(초기 상태) | `getAllLeafColumns()` ID 순서를 baseline 으로 사용 |
| `Alt+←` 최좌측 / `Alt+→` 최우측 | 범위 초과 → 이동 없음 |
| 인접 컬럼이 모두 pinned | pinned skip 후 범위 초과 → 이동 없음 |
| `persistColumnOrder=true` + 키 미지정/빈 문자열 | localStorage 접근 없음(저장·복원 모두 skip) |
| SSR / private 브라우징 / `QuotaExceededError` | storage 어댑터가 try/catch + SSR 가드로 silent skip |
| localStorage 저장값이 비-문자열-배열 JSON | 해당 키 제거 후 복원 skip |
| `dataTransfer` 비어 있음 | 내부 ref 에 보관한 소스 ID 로 fallback |
| `onColumnOrderChange` 미전달 | optional chaining 으로 무시 |

영속화 + `columnPersistence`(별도 모듈의 컬럼 상태 영속화) 동시 사용 시: 두 기능은 서로
다른 storageKey 에 독립 저장하므로 키 충돌은 없으나, 마운트 시 둘 다 `setColumnOrder` 를
호출해 나중에 실행된 쪽이 최종 적용된다(non-deterministic). 컬럼 순서 영속화는 둘 중 한
경로만 쓰는 것을 권장한다.

---

## 6. 가상화·정렬과의 호환

- **가상화**: 드래그·키보드 이동은 헤더 `<th>` 레벨에서 동작하고, 행 가상화는 그와 독립적인
  body 레벨이라 서로 영향이 없다.
- **정렬**: 헤더 클릭 정렬 핸들러와 드래그/키보드 핸들러는 같은 `<th>` 에 공존한다. 드래그는
  별도의 포인터 제스처이고 키보드 핸들러는 `Alt+화살표` 조합만 처리한 뒤
  `e.preventDefault()` 하므로, 일반 클릭 정렬 및 다른 키 입력과 충돌하지 않는다.

---

## 7. 사용 — 커스텀 테이블 직접 구성

```tsx
import { useColumnDrag, DropIndicator } from '@topgrid/grid-core';
import { flexRender } from '@tanstack/react-table';

function CustomHeader<TData>({ table }: { table: Table<TData> }) {
  const { getDragProps, dragOverId, getKeyDownHandler } = useColumnDrag({
    table,
    enabled: true,
    persistColumnOrder: true,
    columnOrderStorageKey: 'custom-table-order',
    onColumnOrderChange: (order) => externalSync(order),
  });

  return (
    <thead>
      {table.getHeaderGroups().map((hg) => (
        <tr key={hg.id}>
          {hg.headers.map((header) => {
            const isPinned = header.column.getIsPinned() !== false;
            const dragProps = getDragProps(header.column.id, isPinned);
            const onKeyDown = getKeyDownHandler(header.column.id, isPinned);
            return (
              <th
                key={header.id}
                className="relative"
                tabIndex={0}
                draggable={dragProps.draggable}
                onDragStart={(e) => dragProps.onDragStart(e.nativeEvent)}
                onDragOver={(e) => dragProps.onDragOver(e.nativeEvent)}
                onDragLeave={(e) => dragProps.onDragLeave(e.nativeEvent)}
                onDrop={(e) => dragProps.onDrop(e.nativeEvent)}
                onDragEnd={(e) => dragProps.onDragEnd(e.nativeEvent)}
                onKeyDown={(e) => onKeyDown(e.nativeEvent)}
                aria-roledescription="draggable column"
              >
                <DropIndicator dragOverId={dragOverId} columnId={header.column.id} />
                {flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
}
```
