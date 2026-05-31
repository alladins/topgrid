# 페이지네이션 모듈 (`@topgrid/grid-core` — pagination)

TanStack Table v8 위에 client/server 통합 페이지네이션을 단일 `pagination` 옵션
객체로 제공하는 기능 set. 동작 모드 전환(`mode`), 페이지 크기 선택, 전체 건수 표시,
숫자 페이지 버튼(슬라이딩 윈도우), 키보드 페이지 이동을 포함한다.

- 패키지: `@topgrid/grid-core` (pagination UI 컴포넌트 + 옵션 타입)
- 라이선스: **MIT**
- 의존: `react` / `react-dom` / `@tanstack/react-table` 는 모두 peer dependency.
  외부 아이콘/UI 라이브러리(shadcn/ui, react-icons 등) 의존 0.
- 스타일: 모든 UI 는 Tailwind className 으로만 스타일링하고, 페이지 이동 화살표는
  HTML entity(`«` `‹` `›` `»`)와 말줄임(`…`) 텍스트만 사용한다.

페이지네이션은 두 층위로 노출된다.

1. **선언적 옵션** — `<Grid pagination={{ ... }}>` 에 `GridPaginationOptions` 객체를
   넘기면 그리드가 TanStack 옵션으로 변환하고 UI 를 렌더한다(대부분의 사용처).
2. **컴포넌트** — `GridPagination` / `PageSizeSelect` / `TotalCount` 를 직접 import 하여
   커스텀 레이아웃에 배치할 수 있다(고급 사용처).

---

## 1. 개요 — 페이지네이션 구성요소

| 구성요소 | 종류 | 역할 |
|----------|------|------|
| `GridPaginationOptions` | 옵션 타입 | `<Grid>` 의 `pagination` prop. 모드/크기/건수/페이지수/키보드 토글 |
| `PaginationMode` | 타입 | `'client' | 'server' | 'none'` 동작 모드 |
| `GridPagination` | 컴포넌트 | 페이지네이션 UI 컨테이너(크기 선택 + 건수 + 네비게이션 + 숫자 버튼) |
| `PageSizeSelect` | 컴포넌트 | 페이지당 행 수 선택 네이티브 `<select>` |
| `TotalCount` | 컴포넌트 | "전체 N건" 표시 |
| `PageNumbers` | 내부 컴포넌트 | 슬라이딩 윈도우 숫자 페이지 버튼(외부 미노출) |
| `DataTablePagination` | 컴포넌트(deprecated) | `GridPagination` 의 deprecated 별칭(`@topgrid/grid-core/legacy`) |

`PageNumbers` 는 `GridPagination` 내부 구현 상세로, public export 하지 않는다.
나머지 컴포넌트와 타입은 `@topgrid/grid-core` 의 public API 이고,
`DataTablePagination` 은 `@topgrid/grid-core/legacy` 서브엔트리에서 노출된다.

---

## 2. prop / API 계약

표기: `?` 는 optional, 괄호 안은 기본값.

### 2.1 `PaginationMode`

```ts
type PaginationMode = 'client' | 'server' | 'none';
```

- `'client'` — 전체 데이터를 로드한 뒤 클라이언트에서 슬라이싱. `manualPagination: false`.
- `'server'` — 서버가 페이지 단위로 데이터를 내려줌. `manualPagination: true`.
  전체 건수를 알리려면 `totalCount` 또는 `pageCount` 를 함께 준다.
- `'none'` — 페이지네이션 비활성화(기본 동작).

### 2.2 `GridPaginationOptions` (`<Grid pagination={...}>`)

```ts
interface GridPaginationOptions {
  pageSize?: number;                              // (20) 초기 pageSize
  pageSizeOptions?: number[];                     // ([10, 20, 50, 100]) 크기 셀렉트 옵션
  manual?: boolean;                               // server 모드 저수준 flag
  totalCount?: number;                            // server 전체 row 수
  pageIndex?: number;                             // controlled pageIndex
  onPaginationChange?: OnChangeFn<PaginationState>; // pagination state 변경 콜백
  mode?: PaginationMode;                          // 동작 모드(권장 진입점)
  pageCount?: number;                             // server 전체 페이지 수(직접 지정)
  showTotalCount?: boolean;                       // (true) "전체 N건" 표시 여부
  enableKeyboardNav?: boolean;                    // (false) Alt+←/→ 키보드 이동
}
```

- `mode` 가 권장 진입점이다. `'client' | 'server'` 지정 시 `enablePagination` prop 이
  없어도 페이지네이션이 자동 활성화된다(설계 결정 §3.1).
- `manual` 은 `mode` 도입 이전의 저수준 flag 로, 하위호환을 위해 유지된다.
  `mode` 와 `manual` 이 동시에 설정되면 `mode` 가 우선한다(§3.1).
- server 모드의 전체 페이지 수는 `pageCount` 를 직접 주거나, `totalCount` 와 `pageSize`
  로부터 `Math.ceil(totalCount / pageSize)` 로 자동 계산된다. `pageCount` 직접 지정이
  우선한다(§3.2).
- `onPaginationChange` 는 pagination state(`{ pageIndex, pageSize }`)가 바뀔 때 호출되는
  콜백으로, controlled 페이지네이션에 쓴다. 그리드 내부 페이지네이션 핸들러가
  이 콜백을 호출하도록 배선되어 있다.

### 2.3 `GridPaginationProps` (`<GridPagination>` 컴포넌트)

```ts
interface GridPaginationProps<TData extends RowData> {
  table: Table<TData>;          // required — TanStack Table 인스턴스
  mode?: PaginationMode;
  totalCount?: number;          // server 전체 row 수
  pageCount?: number;           // (선언만 — 컴포넌트는 table.getPageCount() 사용)
  pageSizeOptions?: number[];   // ([10, 20, 50, 100])
  showTotalCount?: boolean;     // (true)
  onPaginationChange?: OnChangeFn<PaginationState>;  // (선언만)
  enableKeyboardNav?: boolean;  // (false) Alt+←/→
}
```

- `table` 만 필수다. 컴포넌트는 `table.getState().pagination`, `table.getPageCount()`,
  `table.getCanPreviousPage()/getCanNextPage()`, `table.setPageIndex()` 등 TanStack
  API 로 동작한다.
- 전체 건수는 server 모드 + `totalCount` 가 주어지면 `totalCount`, 아니면
  `table.getFilteredRowModel().rows.length` 로 계산한다.
- `enableKeyboardNav` 는 **컴포넌트를 직접 렌더할 때** 유효하다. `<Grid>` 를 통한
  선언적 사용에서는 그리드가 이 prop 을 `GridPagination` 으로 전달하지 않으므로,
  키보드 이동이 필요하면 `GridPagination` 을 직접 렌더해야 한다.
- `pageCount` prop 과 `onPaginationChange` prop 은 인터페이스에 선언만 되어 있고
  컴포넌트 본문은 사용하지 않는다(전체 페이지 수는 `table` 에서 직접 읽는다).

### 2.4 `PageSizeSelect`

```ts
interface PageSizeSelectProps {
  pageSize: number;
  pageSizeOptions: number[];
  onPageSizeChange: (size: number) => void;
}
```

- `페이지당 행 수:` 라벨 + 네이티브 `<select>`. 옵션은 `{size}` 숫자만 표시한다.
- 값 변경 시 `onPageSizeChange(size)` 만 호출하고, pageIndex 리셋은 호출부가 담당한다
  (`GridPagination` 내부에서 `setPageSize` 후 `setPageIndex(0)`).

### 2.5 `TotalCount`

```ts
interface TotalCountProps {
  total: number;
}
```

- "전체 **N**건" 한 줄 렌더(`<strong>` 강조). `showTotalCount !== false` 일 때만 표시된다.

### 2.6 `DataTablePagination` (deprecated 별칭)

```ts
interface DataTablePaginationProps<TData extends RowData> {
  table: Table<TData>;
  totalCount?: number;
}
```

- `@topgrid/grid-core/legacy` 에서 export 되는 `GridPagination` 래퍼 별칭이다.
  내부적으로 `<GridPagination table={table} totalCount={...}>` 를 렌더하고,
  마운트 시 deprecation 경고를 1회 발생시킨다.
- `totalCount` 미전달 시 `table.getFilteredRowModel().rows.length` 가 쓰인다.
- 신규 코드는 `GridPagination`(또는 `<Grid pagination={...}>`)을 직접 쓰는 것을 권장한다.

---

## 3. 핵심 설계 결정과 근거

### 3.1 `mode` 는 `manual` 의 편의 shorthand — `mode` 우선, 자동 활성화
페이지네이션 진입점을 `mode: 'client' | 'server' | 'none'` 한 축으로 통합했다.
저수준 `manual: boolean` flag(server 모드 스위치)는 그대로 유지하되, `mode` 가 그
상위 표현으로 동작한다. 두 값이 동시에 주어지면 `mode` 가 우선하여 `manualPagination`
값을 결정한다. 또한 `mode` 가 `'client'` 또는 `'server'` 이면 별도의 `enablePagination`
토글 없이도 페이지네이션이 자동으로 활성화된다 — 모드를 선언했다는 것 자체가 활성화
의도이므로, 사용자가 두 군데를 켜야 하는 번거로움을 없앤다. 기존 `manual` 사용 코드는
`mode` 미설정 경로를 그대로 타므로 동작이 바뀌지 않는다.

### 3.2 server 모드 `pageCount` 직접 지정
server 페이지네이션에서 전체 페이지 수는 보통 `totalCount / pageSize` 로 계산하지만,
서버 응답이 이미 페이지 수를 계산해 내려주는 경우가 흔하다. 이를 위해 `pageCount` 를
직접 지정할 수 있게 했고, 직접 지정이 계산값보다 우선한다. 덕분에 `totalCount` 없이
`pageCount` 만으로도 server 모드가 동작한다(전체 row 수는 모르지만 페이지 수는 아는 상황).

### 3.3 컴포넌트 구성 — 컨테이너 + 작은 leaf 컴포넌트
`GridPagination` 은 컨테이너로서 `PageSizeSelect`(크기 선택) + `TotalCount`(건수) +
네비게이션 버튼(처음/이전/다음/끝) + `PageNumbers`(숫자 버튼)를 조합한다. `PageSizeSelect`
와 `TotalCount` 는 단독으로도 쓸 수 있도록 public export 하지만, `PageNumbers` 는
`GridPagination` 내부에서만 의미가 있어 export 하지 않는다. 작은 leaf 컴포넌트들은
`React.memo` 로 감싸 불필요한 리렌더를 줄인다.

### 3.4 네이티브 `<select>` · 외부 UI/아이콘 라이브러리 비의존
페이지 크기 선택은 네이티브 `<select>` 로, 네비게이션 화살표는 HTML entity 텍스트로
구현한다. shadcn/ui · @radix-ui · react-icons 같은 패키지를 peer dependency 로 추가하지
않기 위함이다. 이는 렌더러 패키지가 아이콘을 주입형으로 받는 것과 같은 철학으로,
소비자의 UI 스택 선택을 강제하지 않고 번들을 가볍게 유지한다.

### 3.5 숫자 페이지 버튼 — 슬라이딩 윈도우 최대 5 + 말줄임
`PageNumbers` 는 현재 페이지를 중앙에 두는 슬라이딩 윈도우로 최대 5개의 페이지 번호를
보여준다. 윈도우가 끝에 닿으면 시작점을 보정해 항상 가능한 한 5개를 채운다. 윈도우
좌측에 가려진 페이지가 있으면 앞에 `…`, 우측에 가려진 페이지가 있으면 뒤에 `…` 를
붙인다. 현재 페이지 버튼은 `disabled` + active 스타일(파란 배경)로 표시하고,
`aria-current="page"` 와 `aria-label="페이지 N으로 이동"` 으로 접근성을 보강한다.
말줄임 `…` 은 장식이므로 `aria-hidden`. 모바일 반응형(좁은 화면에서 버튼 수 축소)은
별도 범위로, 항상 최대 5개를 표시한다.

### 3.6 키보드 네비게이션 — container ref scope (전역 리스너 금지)
`enableKeyboardNav` 활성 시 Alt+← → 이전 페이지, Alt+→ → 다음 페이지로 이동한다.
이벤트 리스너는 `document` 전역이 아니라 `GridPagination` 컨테이너 `ref` 에 등록한다.
같은 페이지에 여러 그리드가 있을 때 전역 리스너는 모든 인스턴스가 동시에 반응하지만,
컨테이너 scope 는 포커스가 있는 인스턴스만 처리하므로 multi-grid 환경에서 안전하다.
`useEffect` cleanup 에서 `removeEventListener` 로 리스너를 제거해 누수를 막고,
이동 전 `getCanPreviousPage()/getCanNextPage()` 가드로 경계에서의 불필요한 호출을 막는다.

### 3.7 `showTotalCount` 기본값 = true
"전체 N건" 표시는 기본 활성이다. 페이지네이션을 켜면 건수 표시가 함께 나오는 것이
일반적 기대이며, 기본값을 `false` 로 두면 건수가 조용히 사라지는 회귀가 생기기 때문이다.
숨기려면 명시적으로 `showTotalCount: false` 를 준다.

### 3.8 `exactOptionalPropertyTypes` 안전 전달 패턴
optional prop 을 그리드에서 `GridPagination` 으로 넘길 때 `undefined` 를 명시 할당하지
않고 조건부 spread(`...(x !== undefined ? { x } : {})`)로 전달한다. `DataTablePagination`
이 `totalCount` 를 넘길 때도 같은 패턴을 쓴다. TypeScript 의 `exactOptionalPropertyTypes`
환경에서 `undefined` 리터럴 할당을 피하기 위한 표준 패턴이다.

### 3.9 `DataTablePagination` — 제품 중립 deprecated 별칭
`DataTablePagination` 은 `GridPagination` 으로 위임하는 deprecation 별칭으로,
TanStack 기반 `{ table, totalCount? }` 시그니처를 쓴다. 마운트 시 deprecation 경고를
발생시켜 사용처가 `GridPagination`(또는 `pagination` 옵션)으로 전환하도록 유도한다.
별칭은 한 마이너 버전 동안 유지되고 차기 메이저에서 제거 예정이다.

---

## 4. 엣지 케이스 동작 요약

| 상황 | 동작 |
|------|------|
| `mode` 미설정 / `'none'` | 페이지네이션 비활성. 기존 `manual` 경로 유지 |
| `mode` + `manual` 동시 지정 | `mode` 가 우선 |
| server 모드, `pageCount` + `totalCount` 동시 | `pageCount` 직접 지정이 우선 |
| server 모드, `totalCount` 만 | `Math.ceil(totalCount / pageSize)` 로 페이지 수 계산 |
| `pageCount` ≤ 0 | `PageNumbers` 가 `null` 렌더(버튼 0개) |
| 전체 페이지 수 1 | 숫자 버튼 1개, disabled. 처음/이전/다음/끝 모두 disabled |
| 전체 페이지 수 ≤ 5 | 말줄임 없이 전체 번호 표시 |
| 페이지 수 > 5, 현재 첫 페이지 | 좌측 말줄임 없음, 우측 `…` 있음 |
| 페이지 수 > 5, 현재 마지막 페이지 | 좌측 `…` 있음, 우측 말줄임 없음 |
| `showTotalCount: false` | "전체 N건" 미렌더 |
| `enableKeyboardNav` 활성, 경계 페이지에서 Alt 이동 | `getCan...Page()` 가드로 이동 skip |
| `enableKeyboardNav` 활성 컴포넌트 unmount | cleanup 에서 리스너 제거(누수 없음) |
| `<Grid>` 옵션으로 `enableKeyboardNav: true` | 그리드가 prop 미전달 — 키보드 이동 비활성(컴포넌트 직접 렌더 필요) |

---

## 5. 사용

### 5.1 선언적 사용 — `<Grid pagination={...}>`

```tsx
// client 모드 — 전체 데이터 로드 후 클라이언트 슬라이싱
<Grid
  data={rows}
  columns={columns}
  pagination={{ mode: 'client', pageSize: 20, pageSizeOptions: [10, 20, 50, 100] }}
/>

// server 모드 — 페이지 단위 로드 + 외부 전체 건수
<Grid
  data={pageRows}
  columns={columns}
  pagination={{ mode: 'server', totalCount: 1000, pageSize: 20 }}
/>

// server 모드 — totalCount 없이 pageCount 직접 지정
<Grid
  data={pageRows}
  columns={columns}
  pagination={{ mode: 'server', pageCount: 50, pageSize: 20 }}
/>
```

`mode: 'client' | 'server'` 를 주면 `enablePagination` 토글 없이도 페이지네이션 UI 가
자동으로 렌더된다.

### 5.2 컴포넌트 직접 사용

```tsx
import { GridPagination } from '@topgrid/grid-core';

// 커스텀 레이아웃에서 직접 배치 + 키보드 네비게이션 활성
<GridPagination
  table={table}
  mode="server"
  totalCount={1000}
  pageSizeOptions={[10, 20, 50, 100]}
  enableKeyboardNav
/>
```

`PageSizeSelect` 와 `TotalCount` 도 개별 import 하여 원하는 위치에 따로 배치할 수 있다.

---

MOD-GRID-03 → mod-grid-03.md (242줄), 삭제후보: `artifacts/MOD-GRID-03/pagination/` 하위 `G-00{1,2,3}-{specify,implement,verify}-score.json`(rubric 점수 부기), `G-00{1,2,3}-spec.md`(지식은 본 문서로 합성됨).
핵심지식: `mode`(client/server/none)로 통합된 페이지네이션 — `mode`가 저수준 `manual`보다 우선하며 client/server 선언만으로 UI 자동 활성, server 모드는 `pageCount` 직접 지정 또는 `totalCount/pageSize` 계산. `GridPagination`(컨테이너) + `PageSizeSelect`/`TotalCount`/내부 `PageNumbers`(슬라이딩 윈도우 5 + 말줄임) 조합, container-ref scope 키보드 이동(multi-grid 안전), 네이티브 select·아이콘 라이브러리 비의존, `DataTablePagination` deprecated 별칭.
