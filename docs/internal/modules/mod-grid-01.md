# 통합 Grid 래퍼 모듈 (`@topgrid/grid-core` — `<Grid>`)

TanStack Table v8 위에 올린 단일 `<Grid data columns>` 컴포넌트. 정렬/필터/선택/
페이지네이션/핀/리사이즈/펼침/가상화/imperative ref 등 그리드의 핵심 동작을 모두 하나의
선언적 props 표면으로 통합한다. 과거 8종으로 나뉘어 있던 그리드 변형(BaseGrid/VirtualGrid/
ColumnPinGrid/GroupedHeaderGrid/TreeGrid/...)에서 중복되던 `useReactTable` + `flexRender`
와이어링을 흡수하고, 각 변형은 이 래퍼에 props만 매핑하는 얇은 호환 alias로 축소된다.

- 패키지: `@topgrid/grid-core`
- 라이선스: **MIT**
- 의존: `react` / `react-dom` / `@tanstack/react-table` / `@tanstack/react-virtual` 는
  모두 peer dependency (런타임 `dependencies` 0). 외부 그리드 라이브러리(XX Grid/xxxx 등)
  의존 없음.
- 스타일: 모든 마크업은 Tailwind className 으로만 스타일링한다. 인라인 `style` 은 핀 셀의
  동적 sticky offset(`left`/`right`)과 가상화 padding row 높이 등 런타임에 변하는 수치 한정.

> `@topgrid/grid-core` 의 `types.ts` / `index.ts` 는 여러 모듈이 공유하는 단일 진실
> 소스(SSoT)다. 본 문서는 **통합 래퍼 컴포넌트 `<Grid>` 자체의 계약**(MOD-GRID-01)만
> 다룬다. 컬럼 reorder, multi-sort 도구, 페이지네이션 UI 컴포넌트, 컬럼 팩토리/영속화,
> URL·storage 동기화 훅 등 `GridProps` 에 함께 선언된 다른 prop/export 는 각 해당 모듈
> 문서를 참조한다.

---

## 1. 개요 — 무엇을 다루는가

`<Grid>` 단일 컴포넌트와 그 imperative handle, 그리고 하위호환 alias 5종을 제공한다.

| 영역 | 내용 |
|------|------|
| 핵심 컴포넌트 | `Grid<TData>` — 단일 API + `enable*` 토글 |
| 행 동작 | 정렬(sort/multiSort), 컬럼 필터, 행 선택(single/multi), 클라이언트/서버 페이지네이션, 행 펼침(tree) |
| 레이아웃 | sticky header, 컬럼 핀(좌/우 고정), 컬럼 리사이즈 |
| 대용량 | 가상화(virtualization) — opt-in |
| 상태 표시 | 로딩 skeleton, 빈 상태 slot |
| 이벤트 | 행/셀 클릭·더블클릭, 셀 키다운, 첫 행 자동 선택 |
| 조건부 스타일 | `cellClassName` / `rowClassName` 콜백 |
| imperative API | `GridHandle<TData>` ref (scroll/selection/refresh/mutation 위임/편집 시작) |
| 호환 alias | `BaseGrid` / `VirtualGrid` / `ColumnPinGrid` / `GroupedHeaderGrid` / `TreeGrid` (deprecated) |

주요 export:

- 컴포넌트: `Grid`
- 타입: `GridProps`, `GridRowSelectionOptions`, `GridPaginationOptions`,
  `RowSelectionMode`, `GridColumnResizeMode`, `GridHandle`, `GridScrollToOptions`,
  `CellClassNameCallback`, `RowClassNameCallback`
- 호환 alias (그리고 `@topgrid/grid-core/legacy` sub-entry): `BaseGrid`,
  `VirtualGrid`, `ColumnPinGrid`, `GroupedHeaderGrid`, `TreeGrid`, `BaseGridProps`,
  `useDeprecationWarn`

`<Grid>` 는 generic 컴포넌트로 `<TData>` 를 호출자가 지정한다(기본 `unknown` 폴백 없음).
TanStack 표준 export 만 사용하며 private API 에 접근하지 않는다.

---

## 2. 컴포넌트 계약 — `GridProps<TData>`

표기: `?` 는 optional, 괄호 안은 기본값.

### 2.1 필수

```ts
data: TData[];
columns: ColumnDef<TData, unknown>[];   // TanStack ColumnDef. 그룹 구조 { header, columns:[...] } 그대로 통과
```

### 2.2 `enable*` 토글

| prop | 기본 | 동작 |
|------|------|------|
| `enableSort?` | false | `getSortedRowModel` wiring + 헤더 정렬 토글 |
| `enableMultiSort?` | false | TanStack `enableMultiSort` 위임 |
| `enableFilter?` | false | `getFilteredRowModel` wiring (필터 UI 는 컬럼 정의 책임) |
| `enablePagination?` | false | `getPaginationRowModel` wiring |
| `enableColumnPinning?` | false | 컬럼 핀 state 활성 + sticky CSS(§4.2) |
| `enableColumnResizing?` | false | 컬럼 리사이즈 handle UI 활성 |
| `enableExpanding?` | false | 행 펼침(tree) — `getSubRows` 와 함께 사용 |
| `enableVirtualization?` | false | 가상화 활성 (opt-in, §4.4) |

토글은 모두 **조건부 wiring** 이다. 켜지 않으면 해당 row model 자체가 와이어되지 않아
번들·런타임 비용이 들지 않는다.

### 2.3 행 선택

```ts
rowSelection?: RowSelectionMode | GridRowSelectionOptions<TData>;
// RowSelectionMode = 'single' | 'multi' | 'none'

interface GridRowSelectionOptions<TData> {
  mode?: RowSelectionMode;                       // (none)
  onSelectionChange?: (rows: TData[]) => void;   // 선택된 row.original 배열
  state?: RowSelectionState;                     // controlled
  onStateChange?: OnChangeFn<RowSelectionState>; // controlled
}
```

- 단축 표기(`rowSelection="multi"`)와 객체 표기 모두 지원.
- `'single'`/`'multi'` 시 좌측 첫 컬럼에 체크박스 컬럼(`__select__`)이 자동 prepend.
  `'multi'` 는 헤더에 전체 선택 체크박스도 렌더, `'single'` 은 헤더 체크박스 없음,
  `'none'` 은 컬럼 합성 없음.
- 체크박스 셀 클릭은 `stopPropagation` 으로 행 클릭 전파를 막는다.

### 2.4 페이지네이션 (래퍼 핵심 필드만)

```ts
interface GridPaginationOptions {
  pageSize?: number;            // (20)
  pageSizeOptions?: number[];   // ([10,20,50,100])
  manual?: boolean;             // server 모드 — true 시 totalCount 필수
  totalCount?: number;          // server 모드 전체 건수
  pageIndex?: number;           // controlled
  onPaginationChange?: OnChangeFn<PaginationState>;  // controlled
}
```

`manual=true` 면 TanStack `manualPagination` 으로 서버 페이지네이션. (페이지네이션 UI
컴포넌트와 `mode`/`pageCount`/`showTotalCount` 등 부가 필드는 별도 모듈 문서를 참조.)

### 2.5 이벤트

```ts
onRowClick?:       (row: TData, event: MouseEvent<HTMLTableRowElement>) => void;
onRowDoubleClick?: (row: TData, event: MouseEvent<HTMLTableRowElement>) => void;
onCellClick?:      (cell: Cell<TData, unknown>, row: TData, event: MouseEvent<HTMLTableCellElement>) => void;
onCellKeyDown?:    (cell: Cell<TData, unknown>, row: TData, event: KeyboardEvent<HTMLTableCellElement>) => void;
```

- 인자는 `row.original`(TData) 을 직접 전달. 셀 핸들러는 `cell.column.id` /
  `cell.getValue()` 로 컬럼 단위 분기가 가능하도록 `Cell` 객체를 함께 넘긴다.
- `onCellClick` 과 `onRowClick` 은 DOM 버블 순서대로 셀 → 행 순으로 둘 다 발화한다.
  행 클릭을 막으려면 셀 핸들러에서 `event.stopPropagation()` 호출.
- 셀/행 이벤트 시그니처는 의도적으로 동일한 `(cell, row, event)` / `(row, event)`
  형태로 통일했다. 셀 핸들러 3-arg 일관성은 멘탈 모델 단일화 목적.

> **focus 주의**: `<td>` 는 기본 tabIndex 가 없어 native focus 를 받지 못한다.
> `onCellKeyDown` 을 쓰려면 cellRenderer 가 focus 가능한 자식(`<input>`, `tabIndex={0}`
> 요소 등)을 렌더해야 키 이벤트가 도달한다.

### 2.6 로딩 / 빈 상태 / 자동 선택

```ts
loading?: boolean;            // true 시 <tbody> 만 skeleton row 로 치환 (thead 보존)
loadingRowCount?: number;     // (pagination.pageSize ?? 5)
emptyState?: ReactNode;       // 빈 결과 slot — emptyText 보다 우선
emptyText?: string;           // ('데이터가 없습니다.')
autoSelectFirstRow?: boolean; // 데이터 로드 후 첫 행 자동 선택 (default false)
```

- 빈 상태 우선순위: `emptyState` slot → `emptyText` → 기본 텍스트.
- `autoSelectFirstRow` 는 `rowSelection='none'` 이면 no-op. `'multi'` 라도 첫 1행만
  선택(single 동작). 자동 선택 effect 의 의존성은 데이터 배열 참조가 아니라 **길이**다
  (§4.5).

### 2.7 트리 / 펼침

```ts
getSubRows?:      (row: TData, index: number) => TData[] | undefined;
defaultExpanded?: ExpandedState | boolean;   // true=전체 펼침, {}=전체 접힘 (default {})
```

`defaultExpanded` 는 mount 시 expanded state 의 uncontrolled 초기값으로 사용된다.
`true` 는 전체 펼침을 의미한다(§4.6).

### 2.8 sticky 핀 / 컬럼 리사이즈 (G-002)

```ts
columnResizeMode?:       'onChange' | 'onEnd';   // ('onChange')
defaultColumnSizing?:    ColumnSizingState;       // 컬럼 width uncontrolled 초기값
onColumnSizingChange?:   OnChangeFn<ColumnSizingState>;
defaultColumnPinning?:   ColumnPinningState;       // { left:[], right:[] } uncontrolled 초기값
onColumnPinningChange?:  OnChangeFn<ColumnPinningState>;
```

- `columnResizeMode` 는 `enableColumnResizing=true` 일 때만 효과. `'onChange'` 는 드래그
  중 실시간 너비 반영(UX 우수), `'onEnd'` 는 종료 시 1회(대용량 행에서 성능 우수).
- `default*` 는 uncontrolled 초기값, `on*Change` 콜백은 외부 영속화/미러용. 내부 state 는
  항상 유지되며 콜백은 추가로 호출된다.

### 2.9 조건부 스타일 (G-006)

```ts
type CellClassNameCallback<TData> = (cell: Cell<TData, unknown>) => string | undefined;
type RowClassNameCallback<TData>  = (row: Row<TData>) => string | undefined;

cellClassName?: CellClassNameCallback<TData>;   // 매 셀 렌더 시 호출 → <td> className 에 append
rowClassName?:  RowClassNameCallback<TData>;     // 매 행 렌더 시 호출 → <tr> className 에 append
```

- 셀 상태(선택 여부, row context, 값 유무 등)에 따라 동적 Tailwind 클래스를 1개의 콜백으로
  표현한다. 반환 `undefined` 는 추가 없음.
- 이 콜백 타입의 정식(canonical) 정의는 `@topgrid/grid-core` 가 소유하고,
  `@topgrid/grid-renderers` 의 `EditableCell` 은 type-only 재export 로 노출한다(역의존 방지).
- 성능 주의: 매 셀/행 렌더마다 호출되므로 콜백 내부 계산 비용에 유의(안정적 콜백 권장).
  특히 가상화 시 `rowClassName` 이 동적 높이를 유발하면 `measureElement` reflow 가 반복되니
  static className 권장.

### 2.10 가상화 (G-004)

```ts
enableVirtualization?: boolean;   // opt-in (default false)
virtualScrollHeight?:  number;    // scroll 컨테이너 높이 px (default 400)
virtualizerOptions?: {
  estimateSize?: number;   // 행 높이 추정 px (default 36)
  overscan?:     number;   // viewport 위/아래 버퍼 행 (default 10)
};
```

자동 임계값(예: `data.length > 1000` 자동 활성)은 채택하지 않았다 — 짧은 목록에서 불필요한
가상화 오버헤드가 발생하므로 사용자가 명시적으로 켜야 한다(§4.4).

### 2.11 데이터 mutation 콜백 (G-004 — callback-delegating)

```ts
onAddRow?:    (seed?: Partial<TData>) => void;
onDeleteRow?: (rowId: string | number) => void;
onUpdateRow?: (rowId: string | number, patch: Partial<TData>) => void;
onStartEditing?: (rowId: string | number, colId: string) => void;
```

`<Grid>` 는 `data` 를 controlled prop 으로 취급한다 — 부모가 배열의 owner 다. 따라서
`GridHandle` 의 mutation 메서드는 직접 데이터를 바꾸지 않고 이 콜백들을 호출하며, 부모가
`setState` 로 반영한다(§3, §4.3).

### 2.12 기타

```ts
className?: string;   // 외곽 wrapper Tailwind className
debug?:     boolean;  // TanStack debugTable
```

---

## 3. imperative API — `GridHandle<TData>`

`forwardRef` 로 `<Grid ref={gridRef}>` 노출. TanStack 의 generic-forwardRef 한계를 cast 로
우회하지만 호출부는 `<Grid<User> ref={...} />` 그대로 동작한다(ref 미전달도 무영향).

```ts
interface GridHandle<TData> {
  addRow:    (seed?: Partial<TData>) => void;                       // props.onAddRow 위임
  deleteRow: (rowId: string | number) => void;                     // props.onDeleteRow 위임
  updateRow: (rowId: string | number, patch: Partial<TData>) => void; // props.onUpdateRow 위임
  scrollTo:  (index: number, options?: GridScrollToOptions) => void;
  getSelection:   () => TData[];   // 현재 선택 행의 original 배열
  clearSelection: () => void;      // table.setRowSelection({})
  refresh:        () => void;      // table.resetRowSelection() (전체 reset 아님)
  startEditing?:  (rowId: string | number, colId: string) => void; // props.onStartEditing 위임 (optional)
  expandAll?:     () => void;      // tree/master-detail 컴포넌트만 구현 (optional)
  collapseAll?:   () => void;      // (optional)
}

type GridScrollToOptions = {
  align?:    'start' | 'center' | 'end' | 'auto';
  behavior?: 'auto'  | 'smooth' | 'instant';
};
```

동작 요약:

- **mutation (`addRow`/`deleteRow`/`updateRow`/`startEditing`)** — 대응 콜백 prop 으로 위임.
  콜백 미제공 시 dev 모드에서 1회 경고 후 no-op(production silent).
- **`scrollTo(index, options?)`** — 가상화 활성 시 virtualizer 의 `scrollToIndex` 위임,
  비활성 시 native DOM `tr[data-index="N"].scrollIntoView` fallback. index 는
  `[0, data.length-1]` 로 clamp 하고 범위 초과 시 dev 경고.
- **`getSelection`/`clearSelection`/`refresh`** — TanStack `table` 에 직접 위임. `refresh`
  는 `table.reset()`(sort/filter/pagination 까지 모두 잃음) 대신 `resetRowSelection()` 만
  호출해, stale 한 selection key 만 재산정한다.
- **`startEditing?`/`expandAll?`/`collapseAll?`** 는 optional 메서드다. 기본 `<Grid>` 는
  `startEditing` 을 구현하고, 펼침 메서드는 tree/master-detail 계열 컴포넌트에서만 구현한다.
  자체 handle 을 노출하는 wrapper 와의 backward-compat 를 위해 optional 로 둔다.

---

## 4. 핵심 설계 결정과 근거

### 4.1 단일 API + 조건부 wiring
8종 변형에서 공통이던 `useState` 상태 + row model 와이어링 + 체크박스 컬럼 합성 +
`flexRender` tbody 를 하나의 컴포넌트로 흡수했다. 각 기능은 `enable*` 토글로 **조건부**로만
와이어된다. 켜지 않은 기능의 row model 은 생성되지 않으므로, 표면이 넓어도 실제 호출 시
지불하는 비용은 사용한 기능 만큼이다. 이 덕분에 변형들은 props 매핑만 하는 얇은 alias 로
축소된다(§5).

### 4.2 핀 × `border-collapse` 비양립 — 핀일 때만 `border-separate`
`position: sticky` 는 `border-collapse: collapse` 와 양립하지 않는다(셀 border 분리,
sticky offset 점프 — 브라우저 알려진 문제). 따라서 `enableColumnPinning=true` 일 때만
`<table>` 을 `border-separate border-spacing-0` 으로 전환하고, 이 경우 행 구분선은
`divide-y` 대신 명시적 `border-b` 로 그린다. 핀을 끈 기본 경로는 기존 `divide-y` 외관을
그대로 보존해 회귀가 0 이다. 핀 셀의 sticky `left`/`right` offset 은 좌/우 leaf 컬럼 너비를
누적해 매 렌더 계산하며(메모이즈 금지 — 컬럼 리사이즈 즉시 반영), 마지막-left / 첫-right
경계에 동적 `boxShadow` edge cue 를 준다(런타임 RGBA 값이라 인라인 style 예외).

z-index 컨벤션은 3 레이어: thead 일반 `z-10`, body 핀 셀 `z-20`, thead 핀 셀 `z-30`
(헤더 sticky × 핀 sticky 교차 영역의 occlusion 처리).

### 4.3 controlled data + callback-delegating mutation
`data` 는 부모 소유 배열이다. 그러므로 `addRow`/`deleteRow`/`updateRow`/`startEditing` 은
그리드가 직접 변경하지 않고 대응 콜백(`onAddRow` 등)을 호출해 부모가 `setState` 로 반영하게
한다. 이는 `onSortingChange`/`onPaginationChange` 등 TanStack 의 controlled 철학과 일관되며,
편집/추적 같은 자체 상태를 가진 상위 컴포넌트가 base 래퍼와 충돌 없이 자체 handle 을 쓸 수
있게 한다. 콜백 미제공 호출은 dev 경고 + no-op 로 안전하게 흡수한다.

### 4.4 가상화 — single-table padding-row + opt-in
두 개의 `<table>` 로 thead/tbody 를 분리하고 절대 위치 `<tr>` 을 쓰는 전통적 가상 그리드
패턴은 single-table 을 전제하는 sticky thead + 핀 컬럼 모델을 깨뜨린다. 대신 **single
`<table>` 내부 padding-row 패턴**을 채택했다: `<tbody>` 첫/마지막 자식 `<tr>` 의 height 를
각각 `virtualItems[0].start` / `totalSize - virtualItems[last].end` 로 두고 가운데에 보이는
행만 렌더한다. sticky/핀/`border-separate` 분기를 모두 보존한다. `useVirtualizer` 의
`measureElement` 로 동적 행 높이를 지원한다.

활성은 opt-in 전용이다 — 자동 임계값을 쓰면 `virtualScrollHeight` 미지정 짧은 목록에서
부적절한 가상화가 걸린다. 사용자가 컨테이너 높이를 명시하고 의도적으로 켜야 한다.
React hooks 규칙상 `useVirtualizer` 자체는 항상 호출하되 비활성 시 사실상 무력화하고
반환만 분기한다.

### 4.5 첫 행 자동 선택 — 길이 의존
`autoSelectFirstRow` effect 의 의존성은 `[data.length, enabled, selectionMode]` 다. 데이터
배열의 **참조** 변경이 아니라 **길이** 변경에만 반응한다. 서버 페이지네이션에서 같은
pageSize 의 다른 페이지로 넘어갈 때(길이 동일) 사용자가 고른 선택이 매번 첫 행으로
reset 되지 않게 보호하려는 의도다. 매 데이터 변경마다 재선택이 필요하면 외부에서 `key` prop
으로 그리드를 remount 하면 된다.

### 4.6 TreeGrid `expandAll` 호환 — `defaultExpanded`
TanStack `ExpandedState` 는 `true`(전체 펼침) 또는 `Record<string, boolean>` 이다.
`defaultExpanded?: ExpandedState | boolean` 1개 prop 으로 uncontrolled 초기값을 받아,
펼침 alias 가 `expandAll={true}` 를 `defaultExpanded={true}` 로 단순 매핑하게 한다.
controlled 다중 prop(표면 과다)이나 `key` 강제 remount(brittle) 대신 채택했다.

### 4.7 dev-only 경고 + `exactOptionalPropertyTypes`
mutation 콜백 부재, scroll index 범위 초과 등은 production 에서 silent 하고 dev 모드에서만
1회 경고한다. 또한 internal 헬퍼의 optional prop 은 `exactOptionalPropertyTypes: true`
환경에서 호출자가 `props.onAddRow`(타입 `… | undefined`)를 그대로 forward 할 수 있도록
`| undefined` union 을 명시한다(코드 스타일 정책으로 enforce).

### 4.8 colSpan/skeleton 컬럼 수 — `getAllLeafColumns().length`
빈 상태 td 의 colSpan 과 skeleton 행의 셀 수는 `table.getAllLeafColumns().length` 로 센다.
그룹 컬럼이 없으면 `getAllColumns()` 와 결과가 같지만, 다중 행 헤더(그룹 컬럼) 도입 시
`getAllColumns()` 는 group + leaf 를 모두 세어 colSpan 이 실제 td 영역을 초과한다. leaf
기준이 항상 정확하다.

---

## 5. 하위호환 alias (G-005)

`@topgrid/grid-core/legacy` sub-entry(메인 entry 경유도 호환)로 5종 alias 를 제공한다. 모두
얇은 함수 컴포넌트로, AS-IS 시그니처·기본값을 보존한 채 `<Grid>` 에 props 를 매핑한다.
**모두 deprecated** — 다음 major 에서 제거 예정이며, mount 시 dev 모드 1회 경고를
발생시킨다(`useDeprecationWarn`). 신규 코드는 `<Grid>` 직접 사용을 권장한다.

| alias | `<Grid>` 매핑 요점 |
|-------|--------------------|
| `BaseGrid` | `enableSort enableFilter` 항상 + `enablePagination={pagination !== undefined}` + `rowSelection`/이벤트/`loading`/`emptyText` 그대로 |
| `VirtualGrid` | `BaseGrid` 매핑 + `enableVirtualization` + `virtualScrollHeight={containerHeight ?? 500}` + `virtualizerOptions={{ estimateSize: rowHeight ?? 40 }}` (AS-IS 기본값 40/500 보존 — Grid 기본 36/400 과 다름) |
| `ColumnPinGrid` | `enableSort enableColumnPinning` + `defaultColumnPinning={{ left: pinLeft ?? [], right: pinRight ?? [] }}` (필터 미와이어 — AS-IS 동등) |
| `GroupedHeaderGrid` | `enableSort` + 그룹 `columns` 그대로 통과(TanStack placeholder 메커니즘). enhanced 그룹 API 는 후속 모듈 |
| `TreeGrid` | `enableExpanding getSubRows` + `defaultExpanded={expandAll ? true : {}}` (§4.6) |

`useDeprecationWarn(name)` 은 `useRef` flag + `useEffect` 1회로 StrictMode 의 이중 effect
호출과 HMR 재마운트 폭주를 막으면서 dev 모드에서만 경고한다.

ref API(`forwardRef`/`useImperativeHandle`)는 alias 에는 적용하지 않는다 — AS-IS 변형 어느
것도 ref API 를 노출하지 않았고, alias 는 호환 shim 이기 때문이다. imperative API 가 필요한
신규 코드는 `<Grid ref>` 의 `GridHandle` 을 직접 쓴다.

---

## 6. 엣지 케이스 동작 요약

| 상황 | 동작 |
|------|------|
| `columns=[]` | TanStack 정상 동작(헤더 0행). 선택 모드면 체크박스 컬럼만 prepend |
| `rowSelection='none'` | 체크박스 컬럼 미합성, `autoSelectFirstRow` no-op |
| `loading=true` + `data` 존재 | loading 우선 — `<tbody>` 만 skeleton, 실제 data 잠시 숨김 |
| `loadingRowCount` 미지정 + pagination 없음 | 기본 5행 |
| `emptyText=''` (slot 미제공) | 빈 문자열 그대로 렌더(기본 텍스트 fallback 안 함). 기본 텍스트는 `emptyText===undefined` 일 때만 |
| `enableColumnPinning=true` + 핀 0개 | 셀 sticky 미적용(no-op), thead sticky 는 별개 축으로 정상 |
| 가상화 미사용 wrapper 부모 `overflow-auto` 부재 | sticky className 은 붙지만 시각 고정 안 됨 — 부모 `overflow` 필요 |
| 컬럼 리사이즈 후 핀 offset | 다음 핀 컬럼의 sticky offset 자동 재계산(매 렌더 계산) |
| `scrollTo` 범위 초과 index | `[0, len-1]` clamp + dev 경고 |
| `getSubRows` + `defaultExpanded={true}` | mount 시 전체 트리 펼침 |
| mutation 콜백 미제공 호출 | dev 경고 1회 + no-op (production silent) |

---

## 7. 사용 예시

기본 사용:

```tsx
import { Grid, type GridProps } from '@topgrid/grid-core';
import type { ColumnDef } from '@tanstack/react-table';

interface User { id: number; name: string; dept: string; }

const columns: ColumnDef<User, unknown>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: '이름' },
  { accessorKey: 'dept', header: '부서' },
];

<Grid<User>
  data={users}
  columns={columns}
  enableSort
  enableFilter
  enablePagination
  rowSelection={{ mode: 'multi', onSelectionChange: (rows) => console.log(rows) }}
  pagination={{ pageSize: 50 }}
  loading={isLoading}
  emptyText="등록된 사용자가 없습니다."
  onRowClick={(row) => navigate(`/users/${row.id}`)}
/>;
```

imperative ref + 가상화:

```tsx
import { useRef, useState } from 'react';
import { Grid, type GridHandle } from '@topgrid/grid-core';

const [users, setUsers] = useState<User[]>(initialUsers);
const gridRef = useRef<GridHandle<User>>(null);

<Grid<User>
  ref={gridRef}
  data={users}
  columns={columns}
  rowSelection="multi"
  enableVirtualization
  virtualScrollHeight={600}
  onAddRow={(seed) => setUsers((prev) => [...prev, { id: Date.now(), name: '', ...seed }])}
  onDeleteRow={(rowId) => setUsers((prev) => prev.filter((_, i) => String(i) !== String(rowId)))}
/>;

gridRef.current?.scrollTo(50, { align: 'center', behavior: 'smooth' });
const selected: User[] = gridRef.current?.getSelection() ?? [];
gridRef.current?.clearSelection();
```

조건부 셀 스타일:

```tsx
<Grid<Schedule>
  data={rows}
  columns={columns}
  cellClassName={(cell) => {
    if (!cell.column.id.startsWith('d')) return undefined;
    const isSelected = cell.row.getIsSelected();
    const hasValue = cell.getValue() != null && cell.getValue() !== '';
    return [isSelected && 'bg-indigo-100', !isSelected && hasValue && 'bg-yellow-50']
      .filter(Boolean)
      .join(' ');
  }}
/>;
```
</invoke>
