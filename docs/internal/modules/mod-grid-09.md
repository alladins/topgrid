# 필터 UI 모듈 (`@topgrid/grid-features` — filter-ui)

컬럼 단위 필터 + 전역 검색 + 필터 초기화를 제공하는 헤더 UI 컴포넌트 set.
TanStack Table의 표준 columnFilters / globalFilter API 위에 얹는 얇은 레이어로,
필터 값을 `column.setFilterValue` / `table.setGlobalFilter` 로 흘려보내고,
실제 행 필터링은 각 컬럼에 등록하는 `filterFn` 이 담당한다.

- 패키지: `@topgrid/grid-features`
- 라이선스: **MIT**
- 의존: `react` / `react-dom` / `@tanstack/react-table` 는 peer dependency.
  `date-fns ^4.1.0` 와 `react-datepicker ^8.3.0` 도 peer dependency(DateFilter 전용),
  `@tanstack/react-virtual ^3.0.0` 는 optional peer. (peerDep 채택 근거는 §4)
- 스타일: 모든 컴포넌트는 Tailwind className 으로만 스타일링한다. 인라인 `style` 없음.
- 팝오버: 외부 라이브러리(Radix 등) 없이 네이티브 `div position:absolute` 로 구현한다(§4.1).

---

## 1. 개요 — 컴포넌트 카탈로그

| 컴포넌트 | 종류 | 역할 | 핵심 TanStack API |
|----------|------|------|-------------------|
| `TextFilter` | 컬럼 필터 | 텍스트 4연산자(포함/같음/시작/끝) 팝오버 | `column.setFilterValue` / `getFilterValue` |
| `NumberFilter` | 컬럼 필터 | 숫자 7연산자(`=` `!=` `>` `<` `>=` `<=` `between`) 팝오버 | `column.setFilterValue` |
| `DateFilter` | 컬럼 필터 | 날짜 범위(from/to) range picker 팝오버 | `column.setFilterValue` |
| `SelectFilter` | 컬럼 필터 | 다중선택 체크박스(Excel-style) 팝오버 | `column.getFacetedUniqueValues` / `setFilterValue` |
| `GlobalSearchInput` | 전역 검색 | 전체 행 검색 입력(debounce 300ms) | `table.setGlobalFilter` |
| `FilterResetButton` | 전역 초기화 | 모든 컬럼 필터 + 전역 필터 일괄 해제 | `table.resetColumnFilters` / `setGlobalFilter` |
| `FilterPopover` | 공유 | 네이티브 div 팝오버 컨테이너(외부클릭/Escape/포커스) | — |
| `FilterIndicator` | 공유 | 활성 필터 파란 dot 인디케이터 | `column.getIsFiltered` (호출 측) |

필터 함수(`filterFn`) export:

- `textFilterFn` — TextFilter 용 커스텀 `FilterFn`
- `numberFilterFn` — NumberFilter 용 커스텀 `FilterFn`
- `dateRangeFilterFn` — DateFilter 용 커스텀 `FilterFn`
- `selectFilterFn` — TanStack 내장 `filterFns.arrIncludes` re-export

이 컴포넌트들은 모두 `ColumnDef.header` 함수 안에서 렌더되거나(컬럼 필터),
테이블 상단 툴바에 배치된다(전역 검색/초기화). 필터 값을 TanStack 표준 state에
저장하므로 별도의 store나 imperative API가 없다.

---

## 2. 각 컴포넌트의 prop 계약

표기: `?` 는 optional, 괄호 안은 기본값. 모든 제네릭 컴포넌트는
`Column<TData, unknown>` / `Table<TData>` 를 받아 `any` 를 쓰지 않는다.

### TextFilter

```ts
type TextFilterOperator = 'contains' | 'equals' | 'startsWith' | 'endsWith';

interface TextFilterValue {
  operator: TextFilterOperator;
  value: string;
}

interface TextFilterProps<TData> {
  column: Column<TData, unknown>;
  defaultOperator?: TextFilterOperator;   // ('contains')
  popoverAlign?: 'left' | 'right';        // ('left')
}
```

- 헤더에 `FilterIndicator` + 깔때기 아이콘 버튼을 렌더. 아이콘 버튼은
  `aria-label="필터"`, `aria-pressed={column.getIsFiltered()}`.
- 팝오버 내용: 연산자 `<select>`(포함/같음/시작/끝) + 값 `<input>` + 초기화 버튼.
- 입력값과 연산자는 컴포넌트 로컬 state로 관리하고 **300ms debounce** 후
  `column.setFilterValue` 를 호출한다.
- 입력값이 trim 후 빈 문자열이면 `setFilterValue(undefined)` 로 필터를 해제한다.
- 초기화 버튼: 입력값/연산자를 기본값으로 되돌리고 `setFilterValue(undefined)`.

### NumberFilter

```ts
type NumberFilterOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'between';

interface NumberFilterValue {
  operator: NumberFilterOperator;
  value?: number;   // 단항 연산자용. between 시 미사용
  min?: number;     // between 하한 (min <= cell)
  max?: number;     // between 상한 (cell <= max)
}

interface NumberFilterProps<TData> {
  column: Column<TData, unknown>;
  defaultOperator?: NumberFilterOperator;  // ('=')
  popoverAlign?: 'left' | 'right';         // ('left')
}
```

- 연산자 `<select>` 7종. `between` 선택 시 min/max `<input type="number">` 두 개를
  조건부 렌더하고, 나머지 연산자는 단일 value input을 렌더한다.
- 단항 입력값과 min/max는 각각 **300ms debounce** 후 `setFilterValue` 한다.
  - 단항: 빈 값/NaN → `setFilterValue(undefined)`, 아니면 `{ operator, value }`.
  - between: min/max 둘 다 비어 있으면 해제, 한쪽만 있으면 그 bound만 담아 전송
    (단방향 범위 필터).
- 연산자를 바꾸면 기존 입력 state(value/min/max)를 모두 비우고 즉시
  `setFilterValue(undefined)` 로 필터를 해제한다 — 연산자 전환 시 clean state 보장.
- `FilterPopover` / `FilterIndicator` 는 TextFilter와 동일한 컴포넌트를 재사용한다.

### DateFilter

```ts
interface DateFilterValue {
  from?: Date;   // 범위 시작 (inclusive, startOfDay 정규화)
  to?: Date;     // 범위 종료 (inclusive, endOfDay 정규화)
}

interface DateFilterProps<TData> {
  column: Column<TData, unknown>;
  popoverAlign?: 'left' | 'right';   // ('left')
}
```

- `react-datepicker` 기반 from/to 두 개의 `<DatePicker>` (한국어 locale).
  모듈 로드 시 `registerLocale('ko', ko)` 를 1회 등록하고 `locale="ko"` 로 사용한다.
- 역전 입력 방지: from picker에 `maxDate={to}`, to picker에 `minDate={from}` 를
  값이 있을 때만 전달한다.
- **debounce 없음** — 날짜 선택은 이산(discrete) 이벤트이므로 변경 즉시
  `setFilterValue` 를 호출한다(텍스트/숫자 필터의 300ms 패턴과 다른 점).
- from/to 둘 다 비면 `setFilterValue(undefined)`. 한쪽만 있으면 단방향 bound로 유지.
- 트리거 버튼에는 선택된 범위를 `yyyy-MM-dd ~ yyyy-MM-dd` 형태로 요약 표시한다.
- **CSS**: 컴포넌트 내부에서 `react-datepicker` CSS를 import 하지 않는다.
  소비자가 앱 엔트리에서 `react-datepicker/dist/react-datepicker.css` 를 직접
  import 해야 한다(§4.3).

### SelectFilter

```ts
interface SelectFilterProps<TData> {
  column: Column<TData, unknown>;
  searchThreshold?: number;          // (50)
  popoverAlign?: 'left' | 'right';   // ('left')
}
```

- `column.getFacetedUniqueValues()` 가 돌려주는 `Map<value, count>` 를 읽어
  체크박스 옵션 목록을 렌더한다. 옵션마다 라벨 + 건수 `(count)` 를 표시한다.
- 선택 시 `column.setFilterValue(string[])`, 모두 해제되면 `undefined`(해제).
- "전체 선택/해제" 체크박스를 제공한다. 전체 선택 상태에서 다시 누르면
  `setFilterValue(undefined)` 로 해제한다.
- 옵션 수가 `searchThreshold`(기본 50) 이상이면 팝오버 안에 검색 `<input>` 이
  자동 노출되어, `String.includes` 대소문자 무시로 옵션을 좁힌다(외부 검색 lib 없음).
- 빈 문자열 옵션은 `(blank)` 라벨로 치환해 표시한다. 옵션이 없으면 `No options` 텍스트.
- **소비자 와이어링 필수**: `getFacetedUniqueValues()` 가 동작하려면 테이블 옵션에
  `getFacetedRowModel()` + `getFacetedUniqueValues()` 를 등록해야 한다(§6 E-1).

### GlobalSearchInput

```ts
interface GlobalSearchInputProps<TData> {
  table: Table<TData>;
  debounceMs?: number;     // (300)
  placeholder?: string;    // ('Search all columns…')
}
```

- 입력값을 로컬 state로 받아 `debounceMs` 후 `table.setGlobalFilter` 를 호출한다.
- 입력값을 trim 한 결과가 빈 문자열이면 `setGlobalFilter(undefined)` 로 해제한다
  (공백만 입력해도 해제).
- 컬럼이 아닌 **테이블 인스턴스**를 받는다. 소비자는 테이블 옵션에 `globalFilter`
  state 와 `onGlobalFilterChange` 를 등록해야 한다.

### FilterResetButton

```ts
interface FilterResetButtonProps<TData> {
  table: Table<TData>;
  children?: React.ReactNode;   // 버튼 라벨 ('Reset Filters')
}
```

- 클릭 시 `table.resetColumnFilters()` + `table.setGlobalFilter(undefined)` 를
  모두 호출해 컬럼 필터와 전역 필터를 일괄 해제한다.
- `columnFilters.length === 0 && !globalFilter` 일 때(해제할 게 없을 때) `disabled`.
  disabled 시 `opacity-50 cursor-not-allowed` 시각 피드백.

### FilterPopover (공유)

```ts
interface FilterPopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';   // ('left')
}
```

- 네이티브 `div position:absolute` 팝오버. open/close 상태를 내부에서 관리한다.
- 동작: 외부 `mousedown` → 닫기, `Escape` → 닫기 + 트리거 버튼 포커스 복귀,
  열릴 때 첫 번째 `input`/`select` 에 포커스.
- `align='right'` 면 `right-0`, 기본 `left-0` 정렬. z-index `z-[50]` 로
  sticky 헤더 위에 표시되도록 한다.
- 팝오버 dialog에는 `role="dialog"` + `aria-label="텍스트 필터"` 가 **하드코딩**되어
  있다. Number/Date/Select 필터가 이 팝오버를 재사용하므로 라벨을 오버라이드할 수
  없다 — 알려진 접근성 한계(§6 참고).

### FilterIndicator (공유)

```ts
interface FilterIndicatorProps {
  isFiltered: boolean;
}
```

- `isFiltered === true` 면 파란 dot(`w-2 h-2 rounded-full bg-blue-500`), 아니면
  `null`(렌더 없음)을 반환한다. 호출 측에서 `column.getIsFiltered()` 결과를 넘긴다.

---

## 3. 필터 함수(`filterFn`) 계약

각 컬럼 필터는 `columnDef.filterFn` 에 아래 함수를 **직접 참조**로 등록한다.
모든 함수는 `FilterFn<unknown>` 타입이며, TanStack의 `autoRemove` 규약을 구현해
값이 비면 해당 컬럼 필터가 자동으로 제거되도록 한다.

### textFilterFn

- cell 값을 `String(...).toLowerCase()`, 필터 값을 `trim().toLowerCase()` 로
  정규화 — **대소문자 무시 + 공백 trim**.
- 연산자별: `contains` → `includes`, `equals` → `===`, `startsWith`/`endsWith` → 동명 메서드.
- null/undefined cell → `false` (null-safe).
- `autoRemove`: 값이 없거나 trim 후 빈 문자열이면 `true`(필터 해제).

### numberFilterFn

- cell을 `Number(...)` 변환. null/undefined → `false`, 변환 결과 NaN → `false`.
- 단항 연산자: 값이 undefined/NaN이면 통과(`true`), 아니면 해당 비교.
- `between`: `min <= cell <= max` (양끝 inclusive). min/max 각각 없으면 그 방향 제약을
  생략 → 단방향 범위 필터.
- `autoRemove`: 단항은 value가 undefined/NaN일 때, between은 min·max 둘 다
  undefined/NaN일 때 `true`. 단방향 bound는 유지.

### dateRangeFilterFn

- cell 값은 `Date` 인스턴스 / ISO 문자열 / epoch ms(number) 를 `new Date(cell)` 로
  변환해 받는다. null/undefined → `false`, Invalid Date → `false`.
- `startOfDay(from)` / `endOfDay(to)` 로 자정 정규화하여 **당일 전체를 포함**한다.
  (`date-fns`, 로컬 타임존 기준 — UTC 변환 없음)
- from-only → `cell >= startOfDay(from)`, to-only → `cell <= endOfDay(to)`,
  양쪽 → `isWithinInterval`(inclusive).
- `from > to` 역전으로 `isWithinInterval` 이 `RangeError` 를 던지면 try-catch로 `false`.
- `autoRemove`: from·to 둘 다 undefined이면 `true`. 단방향 bound는 유지.

### selectFilterFn

- TanStack 내장 `filterFns.arrIncludes` 를 그대로 re-export — 커스텀 로직 0줄.
  cell 값이 선택 배열의 한 요소와 일치하면 `true`. 빈 배열이면 내장 autoRemove로 해제.

---

## 4. 핵심 설계 결정과 근거

### 4.1 팝오버 — 외부 라이브러리 없이 네이티브 div

Radix 같은 팝오버 라이브러리를 새 의존성으로 추가하지 않고, `position:absolute`
네이티브 `div` 로 `FilterPopover` 를 구현한다. 추가 peer dependency / 번들 부담이
없고, 필요한 동작(외부클릭 닫기, Escape 닫기 + 포커스 복귀, 열릴 때 첫 입력 포커스)을
컴포넌트가 직접 커버한다. 모든 컬럼 필터는 이 단일 팝오버를 재사용한다.

### 4.2 filterFn은 컬럼당 단일 함수 — 연산자 분기는 함수 내부에서

TanStack의 `columnDef.filterFn` 은 컬럼당 하나의 함수만 가질 수 있고 런타임 교체가
어렵다. 따라서 `numberFilterFn` 은 7개 연산자를, `textFilterFn` 은 4개 연산자를
**함수 내부 switch 분기**로 모두 처리한다. 내장 `filterFns.inNumberRange` 는 between
전용이라 단항 연산자를 못 다루므로 채택하지 않고, 그 inclusive between semantics만
참조해 자체 구현했다. 반대로 다중선택은 내장 `arrIncludes` 가 의미상 정확히 맞아
그대로 re-export 한다(불필요한 중복 구현 회피).

### 4.3 DateFilter의 peerDependency 채택 (`date-fns`, `react-datepicker`)

날짜 선택 UI(`react-datepicker`)와 날짜 연산(`date-fns` 의 `isWithinInterval` /
`startOfDay` / `endOfDay`, 한국어 locale `ko`)을 `dependencies` 가 아닌
**`peerDependencies`** 로 선언한다(둘 다 MIT). peerDep으로 두면 소비자 측 단일 copy로
해석되어 번들 중복이 없고, named import로 tree-shaking 이 적용된다. 자체 구현 대비
접근성/locale/달력 UX/엣지케이스(`RangeError`, 자정 정규화)를 검증된 라이브러리에
위임할 수 있다. 단점은 소비자가 두 패키지를 설치해야 한다는 점이다.
`@tanstack/react-virtual` 은 DateFilter와 무관하므로 optional peer로 둔다.

### 4.4 react-datepicker CSS는 소비자가 직접 import

`react-datepicker` 의 CSS(`react-datepicker/dist/react-datepicker.css`)를
패키지 내부에서 import 하면 "Tailwind 전용 + side-effect 없는 import" 정책과 충돌한다.
그래서 `DateFilter` 는 CSS를 import 하지 않고, 소비자가 앱 엔트리에서 1회 직접
import 하도록 한다. CSS 커스터마이징 자유도를 주는 대신, 미설치 시 달력이 스타일
없이 렌더되므로 소비자 가이드에 import 위치를 명시해야 한다.

### 4.5 react-datepicker 타입 정의 비호환 → 패키지 한정 skipLibCheck

`react-datepicker` 의 타입 정의(`.d.ts`) 파일이 현재 React 타입과 upstream에서
호환되지 않아 `tsc` 가 라이브러리 `.d.ts` 에서 타입 에러를 낸다(패키지 소스 코드의
버그가 아님). 이 패키지의 `tsconfig.json` 에만 `skipLibCheck: true` 를 적용하고,
모노레포 base tsconfig에는 전파하지 않는다. `skipLibCheck` 는 `.d.ts` 만 건너뛰므로
패키지 소스(`.ts`/`.tsx`)의 타입 검사는 그대로 유지되며, 영향 범위를 이 패키지로
한정한다. upstream이 타입을 고치면 이 설정은 불필요해진다.

### 4.6 `exactOptionalPropertyTypes` 대응 — conditional spread

optional prop을 하위 컴포넌트로 전달할 때 `undefined` 가 명시적으로 흘러가지 않도록,
값이 있을 때만 prop을 spread 한다. 예: `<FilterPopover {...(popoverAlign !== undefined ? { align: popoverAlign } : {})} />`,
DateFilter의 `maxDate`/`minDate` 도 값이 있을 때만 전달. between의 min/max 역시
값이 있는 쪽만 `setFilterValue` payload에 담는다.

---

## 5. 동작 진리표 (요약)

### textFilterFn (대소문자 무시 + trim)

| 연산자 | 필터값 | cell | 결과 |
|--------|--------|------|------|
| contains | `abc` | `XABCX` | true |
| equals | `hello` | `HELLO` | true |
| equals | `hello` | `hello world` | false |
| startsWith | ` he` | `hello` | true (trim 후 `he`) |
| endsWith | `ld` | `World Hello` | false |
| any | `abc` | `null` | false |
| any | `` (빈값) | any | autoRemove(해제) |

### numberFilterFn

| 연산자 | 값 | cell | 결과 |
|--------|----|------|------|
| `>` | 50 | 50 | false (경계 미포함) |
| `>=` | 50 | 50 | true (경계 포함) |
| `between` | min=10, max=20 | 10 / 20 | true (양끝 포함) |
| `between` | min=10, max=20 | 9 / 21 | false |
| `between` | min=10, max=∅ | 15 | true (단방향) |
| any | — | null / `"abc"` | false (null/NaN-safe) |

### dateRangeFilterFn

| from | to | cell | 결과 |
|------|----|------|------|
| ∅ | ∅ | any | autoRemove(해제) |
| 5/1 | ∅ | 5/14 | true (from-only) |
| ∅ | 5/31 | 6/1 | false (to-only) |
| 5/1 | 5/31 | 4/30 | false (범위 이전) |
| 5/1 | 5/1 | 5/1 | true (당일 전체 inclusive) |
| any | any | null / invalid / `""` | false |

### FilterResetButton disabled

| columnFilters | globalFilter | disabled |
|---------------|--------------|----------|
| `[]` | 없음 | true |
| `[]` | `"search"` | false |
| 1개 이상 | 무관 | false |

### GlobalSearchInput

| 입력 | debounce 후 |
|------|-------------|
| `""` | `setGlobalFilter(undefined)` |
| `"   "` | trim 후 빈값 → `undefined` |
| `"abc"` | `setGlobalFilter("abc")` |

---

## 6. 엣지 케이스 / 주의사항

| 항목 | 동작 |
|------|------|
| 빈/공백 필터 입력 | 각 filterFn의 `autoRemove` 가 해당 컬럼 필터를 자동 해제 |
| null/undefined cell | 모든 커스텀 filterFn에서 `false` (null-safe) |
| 숫자 컬럼에 문자열 혼입 | `Number(...)` → NaN → `false` (NaN-safe) |
| 날짜 cell이 ISO date-only(`2026-05-14`) | UTC 자정으로 파싱됨. `startOfDay`/`endOfDay` 는 로컬 타임존 기준이라 UTC가 아닌 환경에서 경계일 포함/제외 차이 가능 — 의도된 동작(로컬 타임존 기준) |
| 날짜 `from > to` 역전 | DatePicker `maxDate`/`minDate` 로 예방 + filterFn에서 `RangeError` try-catch → `false` |
| NumberFilter 연산자 변경 | 기존 입력값을 비우고 `setFilterValue(undefined)` 로 즉시 해제(clean state) |
| SelectFilter — faceted model 미등록 | `getFacetedUniqueValues()` 호출이 실패. 소비자가 `getFacetedRowModel()` + `getFacetedUniqueValues()` 등록 필수(컴포넌트는 try-catch 하지 않음 — 소비자 책임) |
| SelectFilter 빈 문자열 옵션 | `(blank)` 라벨로 치환 |
| 팝오버 `aria-label` 하드코딩 | `FilterPopover` dialog가 항상 `aria-label="텍스트 필터"` — Number/Date/Select 재사용 시 오버라이드 불가(알려진 한계, 추후 API 확장 대상) |

---

## 7. 사용 / 와이어링

컬럼 필터는 `columnDef.filterFn` 에 filterFn을 등록하고, `header` 에서 해당 필터
컴포넌트를 렌더한다. 테이블에는 `getFilteredRowModel()` 이 등록돼 있어야 한다.

```tsx
import {
  TextFilter, NumberFilter, DateFilter, SelectFilter,
  GlobalSearchInput, FilterResetButton,
  textFilterFn, numberFilterFn, dateRangeFilterFn, selectFilterFn,
} from '@topgrid/grid-features';
import {
  useReactTable, createColumnHelper,
  getCoreRowModel, getFilteredRowModel,
  getFacetedRowModel, getFacetedUniqueValues,
  type ColumnFiltersState,
} from '@tanstack/react-table';
// DateFilter 사용 시 앱 엔트리에서 1회:
// import 'react-datepicker/dist/react-datepicker.css';

const ch = createColumnHelper<Row>();

const columns = [
  ch.accessor('name', {
    filterFn: textFilterFn,
    header: ({ column }) => (
      <span>이름 <TextFilter column={column} defaultOperator="contains" /></span>
    ),
  }),
  ch.accessor('price', {
    filterFn: numberFilterFn,
    header: ({ column }) => (
      <span>가격 <NumberFilter column={column} defaultOperator="between" /></span>
    ),
  }),
  ch.accessor('orderDate', {
    filterFn: dateRangeFilterFn,
    header: ({ column }) => (
      <span>주문일 <DateFilter column={column} /></span>
    ),
  }),
  ch.accessor('category', {
    filterFn: selectFilterFn,
    header: ({ column }) => <SelectFilter column={column} />,
  }),
];

function Grid({ data }: { data: Row[] }) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: { columnFilters, globalFilter },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // SelectFilter 사용 시 필수:
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div>
      <div className="flex items-center gap-2">
        <GlobalSearchInput table={table} placeholder="전체 검색" />
        <FilterResetButton table={table}>필터 초기화</FilterResetButton>
      </div>
      {/* ...table 렌더... */}
    </div>
  );
}
```

프로그램적 설정도 동일한 값 타입으로 가능하다:

```ts
table.getColumn('orderDate')?.setFilterValue({
  from: new Date('2026-05-01'),
  to: new Date('2026-05-31'),
} satisfies DateFilterValue);
```
