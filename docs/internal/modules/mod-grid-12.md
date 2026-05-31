# DataMap 모듈 (`@topgrid/grid-pro-datamap`)

코드 값 ↔ 표시 레이블 매핑(foreign-key 표시)을 위한 Pro 패키지. 그리드 셀에서
원시 코드 값(예: `'ACTIVE'`)을 사람이 읽는 레이블(예: `'활성'`)로 변환해 표시하고,
편집 시 필터-타이핑 드롭다운으로 선택하게 한다. 정적 옵션과 비동기 로드 옵션을
모두 지원한다.

- 패키지: `@topgrid/grid-pro-datamap` (라이선스 티어: **Pro**)
- 의존: `react` / `react-dom` / `@tanstack/react-table` 는 모두 peer dependency.
  런타임 의존은 라이선스 검증용 `@topgrid/grid-license` 1건뿐.
- 스타일: 모든 UI는 Tailwind className 으로만 스타일링(인라인 `style` 미사용).
- 외부 캐싱/UI/드롭다운 라이브러리(SWR, react-query, Radix, Downshift 등)에
  의존하지 않는다 — 캐시·드롭다운·키보드 네비게이션 모두 자체 구현.

---

## 1. 개요 — 구성 요소

| 요소 | 종류 | 역할 |
|------|------|------|
| `createDataMap` | 팩토리 | items 배열 → 양방향 조회 `DataMap` 인스턴스 생성 |
| `createAsyncDataMap` | 팩토리 | 비동기 loader + 캐시 기반 `AsyncDataMap` 생성 |
| `DataMap<TItem>` | 인터페이스 | `getDisplay` / `getItems` / `getValue` 양방향 조회 계약 |
| `AsyncDataMap<TItem>` | 인터페이스 | `DataMap` 확장 + 로딩 상태머신·캐시 무효화 |
| `DataMapCell` | 표시 렌더러 | 셀의 코드 값을 레이블로 변환해 표시 |
| `DataMapEditor` | 편집 컴포넌트 | 필터-타이핑 + 키보드 네비게이션 선택 드롭다운 |
| `DataMapColumnDef<TData>` | 타입 | TanStack `ColumnDef` + `dataMap` 확장 |

핵심 흐름: 사용자가 `createDataMap(...)`(또는 `createAsyncDataMap(...)`)으로 매핑을
만들고, 컬럼 정의의 `dataMap` 프로퍼티에 지정한 뒤 `cell: DataMapCell`(표시) 또는
`DataMapEditor`(편집)를 수동으로 배선한다. 모든 컴포넌트는 TanStack 표준
`CellContext` API 위에서 동작하며, 별도의 imperative/ref API 는 없다.

### 공개 export

```ts
// 팩토리
createDataMap, createAsyncDataMap
// 컴포넌트
DataMapCell, DataMapEditor
// 타입
DataMap, AsyncDataMap, AsyncDataMapState,
CreateDataMapOptions, CreateAsyncDataMapOptions,
PathOrAccessor, DataMapColumnDef, DataMapCellProps, DataMapEditorProps,
TopgridColumnDef  // @deprecated — DataMapColumnDef 별칭 (§6.5)
```

---

## 2. 핵심 타입과 API 계약

### DataMap — 양방향 조회 인터페이스

```ts
interface DataMap<TItem = unknown> {
  getDisplay(value: unknown): string | undefined;  // 코드 → 레이블 (없으면 undefined)
  getItems(): TItem[];                              // 전체 항목 (편집 드롭다운 목록용)
  getValue(display: string): unknown;               // 레이블 → 코드 (없으면 undefined)
}
```

- `getDisplay` 매핑이 없으면 `undefined` — fallback 처리는 **호출자 책임**(설계 결정 §6.1).
- `getItems()` 는 내부 배열의 복사본(`slice()`)을 반환 — 외부에서 변형해도 원본 불변.

### createDataMap — 정적 팩토리

```ts
type PathOrAccessor<TItem, TReturn> =
  | keyof TItem
  | ((item: TItem) => TReturn);

interface CreateDataMapOptions<TItem> {
  items: TItem[];
  valuePath: PathOrAccessor<TItem, unknown>;   // 코드 값 키 또는 accessor
  displayPath: PathOrAccessor<TItem, string>;  // 표시 레이블 키 또는 accessor
}

function createDataMap<TItem>(options: CreateDataMapOptions<TItem>): DataMap<TItem>;
```

- `valuePath` / `displayPath` 는 객체 키(`'code'`) 또는 함수(`item => item.nested.id`)
  둘 다 받는다. 함수형 경로로 중첩 객체·계산 키를 처리한다.
- 내부적으로 `valueToDisplay` / `displayToValue` 두 개의 `Map` 을 구축한다.
  따라서 `getDisplay` / `getValue` 는 **O(1)** 조회이며, 셀마다 매 렌더에서 호출해도
  성능 영향이 없다(가상화 스크롤 호환 — §6.3).

```ts
const statusMap = createDataMap({
  items: [{ code: 'ACTIVE', label: '활성' }, { code: 'INACTIVE', label: '비활성' }],
  valuePath: 'code',
  displayPath: 'label',
});
statusMap.getDisplay('ACTIVE'); // '활성'
statusMap.getValue('활성');     // 'ACTIVE'
```

### DataMapColumnDef — 컬럼 정의 확장

```ts
type DataMapColumnDef<TData> = ColumnDef<TData, unknown> & {
  dataMap?: DataMap<unknown> | ((row: TData) => DataMap<unknown>);
  selectOptions?: string[];  // @deprecated (§6.4)
};
```

- TanStack `ColumnDef` 를 intersection(`&`)으로 확장 — `cell` / `header` /
  `accessorKey` 등 기존 필드를 모두 유지한 채 `dataMap` 만 추가한다(설계 결정 §6.2).
- `dataMap` 은 **정적 인스턴스** 또는 **행 함수**(`row => DataMap`)를 받는다.
  행 함수는 같은 컬럼이라도 행마다 다른 옵션셋을 표시하게 한다(§3.2).

---

## 3. 표시 렌더러 — DataMapCell

```ts
function DataMapCell<TData>(info: CellContext<TData, unknown>): JSX.Element;
type DataMapCellProps<TData> = CellContext<TData, unknown>;
```

TanStack `CellContext` 를 직접 받아, 컬럼의 `dataMap` 으로 셀 코드 값을 레이블로
변환해 `<span>` 으로 렌더한다. (`TextCell` 등과 달리 행 함수형 `dataMap` 을 위해
`row.original` 접근이 필요하므로 `CellContext` 를 직접 수신한다.)

동작:

1. `info.getValue()` 로 셀의 코드 값을 읽는다.
2. 컬럼의 `dataMap` 을 해석(`resolveDataMap`)한다 — 함수형이면 `row.original` 을
   주입해 호출, 정적이면 그대로 사용.
3. `dataMap.getDisplay(value)` 결과가 있으면 그 레이블을, 없으면 `String(value ?? '')`
   원본 값을 표시한다.

### 3.1 정적 dataMap (컬럼 단위)

```tsx
const columns: DataMapColumnDef<Order>[] = [
  { id: 'id', accessorKey: 'id', header: '번호' },
  {
    id: 'statusCode', accessorKey: 'statusCode', header: '상태',
    dataMap: statusMap,
    cell: DataMapCell,   // 'ACTIVE' → '활성'
  },
];
```

### 3.2 행 단위 동적 dataMap

같은 컬럼이라도 행 데이터에 따라 다른 매핑을 적용한다. 예: 부서별로 직급 목록이
다른 경우.

```tsx
const columns: DataMapColumnDef<Employee>[] = [
  {
    id: 'levelCode', accessorKey: 'levelCode', header: '직급',
    dataMap: (row) => (row.dept === 'dev' ? devLevelMap : bizLevelMap),
    cell: DataMapCell,
  },
];
```

> 행 함수는 매 렌더마다 호출된다. 함수 내부에서 `createDataMap` 을 새로 만들지 말고
> 안정적인 인스턴스를 반환하라(필요 시 호출 측에서 메모이즈).

### 엣지 케이스

| 상황 | 동작 |
|------|------|
| `dataMap` 미설정 컬럼에 `DataMapCell` 배선 | `String(value ?? '')` fallback |
| 코드가 매핑에 없음(예: DB `'X'` 가 items 에 없음) | 원본 코드 그대로 표시(누락 가시화) |
| 빈 문자열 레이블(`getDisplay` → `''`) | `''` 보존(`label !== undefined` 비교로 빈 레이블 유지) |

---

## 4. 편집 컴포넌트 — DataMapEditor

```ts
interface DataMapEditorProps<TItem> {
  value: unknown;                          // 현재 코드 값
  dataMap: DataMap<TItem>;                 // 선택 목록 제공자
  onCommit: (newValue: unknown) => void;   // 선택 확정 — newValue 는 코드 값
  onCancel: () => void;                    // 취소(Escape/외부 클릭)
  getLabelFromItem?: (item: TItem) => string;  // 항목 → 레이블 (§6.6)
}

function DataMapEditor<TItem>(props: DataMapEditorProps<TItem>): JSX.Element;
```

코드↔레이블 매핑을 이용한 필터-타이핑 선택 드롭다운. 외부 UI 라이브러리 없이
`useState` / `useRef` / `useEffect` 로만 구현했다.

기능:

- **자동 포커스**: 마운트 시 입력에 focus + 전체 선택.
- **필터-타이핑**: 입력값으로 항목을 대소문자 무관 부분 일치 필터링. 초기 query 는
  현재 값의 레이블(`getDisplay(value)`)로 채운다.
- **키보드 네비게이션**: `ArrowDown`/`ArrowUp` 로 하이라이트 이동(경계에서 정지),
  `Enter` 로 확정, `Escape` 로 취소.
- **확정**: 선택 항목의 레이블 → `dataMap.getValue(label)` 로 코드 값을 역조회해
  `onCommit(code)` 호출.
- **IME 조합 처리**: `compositionstart`/`end` 로 조합 상태를 추적하고, 조합 중
  `Enter`/방향키를 무시해 한국어 등 조합 입력 중 의도치 않은 확정을 막는다.
- **마우스 선택**: 항목 `mousedown` 에서 `preventDefault` 후 확정 — 입력 blur 보다
  먼저 처리되어 클릭 선택이 취소로 빠지지 않는다.
- **접근성**: `role="combobox"` 입력 + `role="listbox"`/`role="option"` 목록,
  `aria-expanded`/`aria-activedescendant` 연동.
- **드롭다운 스타일(고정)**: `absolute z-50 bg-white border border-gray-200 rounded
  shadow-md max-h-48 overflow-y-auto`.

### 엣지 케이스

| 상황 | 동작 |
|------|------|
| 필터 결과 0건 | 드롭다운 미표시, 하이라이트 `-1`, `Enter` 무동작 |
| 필터 길이 변동 | 하이라이트 인덱스를 `-1` 로 리셋 |
| 초기 값이 매핑에 없음 | 입력 초기값 빈 문자열(재입력 유도) |
| 외부 클릭 | 입력 blur → `onCancel`(편집 컨테이너가 후속 처리) |

---

## 5. 비동기 옵션 — createAsyncDataMap

```ts
type AsyncDataMapState = 'idle' | 'loading' | 'loaded' | 'error';

interface AsyncDataMap<TItem = unknown> extends DataMap<TItem> {
  readonly state: AsyncDataMapState;
  load(): Promise<void>;
  invalidate(): void;
  onStateChange?(cb: (state: AsyncDataMapState) => void): () => void; // 반환=구독 해제
}

interface CreateAsyncDataMapOptions<TItem> {
  loader: () => Promise<TItem[]>;
  valuePath: PathOrAccessor<TItem, unknown>;
  displayPath: PathOrAccessor<TItem, string>;
  staleTime?: number;  // 캐시 유효 기간(ms), 미지정 시 5분(300_000)
}

function createAsyncDataMap<TItem>(
  options: CreateAsyncDataMapOptions<TItem>,
): AsyncDataMap<TItem>;
```

`AsyncDataMap` 은 `DataMap` 을 그대로 확장하므로, `DataMapCell` / `DataMapEditor` 가
동기 `DataMap` 과 **동일하게** 받아 쓴다. 옵션을 런타임 API 로 동적 로드해야 할 때
사용한다.

동작 모델:

- **상태머신 4-state**: `idle` → (로드 트리거) → `loading` → 성공 시 `loaded`,
  실패 시 `error`.
- **지연 로드**: `getItems()` 가 호출될 때 캐시가 없거나 만료됐고 로딩 중이 아니면
  자동으로 `load()` 를 트리거한다(fire-and-forget). 이미 로드된 항목은 즉시 반환한다.
- **캐싱(`staleTime`)**: `staleTime` 이내 재접근은 loader 를 다시 호출하지 않고 캐시를
  쓴다. `invalidate()` 로 캐시를 비우면 상태가 `idle` 로 돌아가고 다음 접근에 재로드.
- **중복 요청 제거**: 같은 인스턴스에 동시 `load()` 가 들어오면 진행 중인 동일
  Promise 를 공유해 중복 HTTP 요청을 막는다.
- **에러 fallback**: loader 가 reject 되면 상태가 `error` 가 되고 `getItems()` 는 빈
  배열, `getDisplay()` 는 `undefined` 를 반환한다. 이후 `load()` 재호출이 곧 재시도다.
- **stale 연속성**: `staleTime` 경과 후 재로드되는 동안에도 이전 항목을 계속 반환해
  UX 깜빡임을 줄인다.
- **로딩 스피너 연동**: `DataMapEditor` 는 `dataMap` 이 `AsyncDataMap` 인지(`'state'`·
  `'load'` 멤버 존재 여부) 런타임 판별하고, `onStateChange` 를 구독해 `loading` 동안
  `animate-spin` 스피너를 보여준다. 구독 해제 함수는 언마운트 시 호출된다.

```tsx
const statusMap = createAsyncDataMap({
  loader: async () => (await fetch('/api/codes/status')).json() as Promise<StatusItem[]>,
  valuePath: 'code',
  displayPath: 'label',
  // staleTime 미지정 → 5분
});

const column: DataMapColumnDef<Row> = {
  id: 'status', header: '상태', dataMap: statusMap, cell: DataMapCell,
};
```

캐시는 인스턴스당 단일 슬롯이다. `loadedAt` 타임스탬프와 `staleTime` 으로 만료를
판단하는 순수 클로저 구현이며 React 의존이 없다.

---

## 6. 핵심 설계 결정과 근거

### 6.1 인터페이스 + 팩토리 (클래스 미사용)
`DataMap` 을 **인터페이스**로 정의하고 `createDataMap` **팩토리**가 인스턴스를
반환한다. 소비자는 인터페이스 계약(`getDisplay`/`getItems`/`getValue`)에만 의존하고
내부 구조(`Map`)는 노출되지 않는다. 클래스 export 를 피하면 `instanceof` 의존이나
상속을 통한 확장 오남용을 막을 수 있고, `AsyncDataMap` 같은 변형을 같은 인터페이스로
자연스럽게 구현할 수 있다. 거부 대안: 클래스(상속 오남용·캐스팅 부담), 단순
`Record`/`Map` 객체(역방향 조회·`getItems` 불가, 함수형 경로 미지원).

### 6.2 컬럼 확장은 intersection
`DataMapColumnDef = ColumnDef<TData, unknown> & { dataMap?; selectOptions? }`.
TanStack 의 `meta` 필드(`unknown` 타입)에 끼워 넣는 대신 top-level intersection 으로
`dataMap` 을 노출한다. `meta` 경로는 접근 시마다 캐스팅이 필요해 개발 경험이 나쁘고,
전역 module augmentation 은 strict 환경에서 전역 오염 위험이 있어 배제했다.

### 6.3 양방향 Map 으로 O(1) 조회, 외부 메모이즈 불필요
팩토리가 `valueToDisplay`·`displayToValue` 두 `Map` 을 미리 구축하므로 모든 조회가
O(1) 이다. 따라서 `DataMapCell` 이 셀마다 매 렌더에서 `getDisplay` 를 호출해도
가상화 스크롤(수천 행) 환경에서 비용이 없으며, 셀 단위 `useMemo` 를 두지 않는다.

### 6.4 `selectOptions` 는 선언된 deprecated 필드(미동작)
`DataMapColumnDef.selectOptions?: string[]` 는 기존 그리드의 선택 옵션 패턴을
컬럼 단위로 이관하기 위한 **타입 자리만 잡은** `@deprecated` 필드다. 현재 패키지
소스에는 이 필드를 소비해 `DataMap` 으로 자동 변환하는 로직이 **없다** — 실제 매핑은
`dataMap` 으로 한다. 차기 메이저에서 제거 예정이므로 신규 코드는 `dataMap` 을 쓴다.

### 6.5 `DataMapColumnDef` 명명과 `TopgridColumnDef` 별칭
주 export 타입 이름은 `DataMapColumnDef` 다. 이는 (1) 타입의 기능(dataMap 확장)을
이름에 드러내고, (2) `@topgrid/grid-core` 의 동명 타입(서로 다른 shape)과의 이름
충돌을 피하기 위함이다. scope rename 별칭 `TopgridColumnDef` 는 `@deprecated` 별칭으로
유지되며 다음 메이저에서 제거된다. (옛 `TomisColumnDef` 별칭은 clean-break 로 이미 제거됨.)
두 이름은 동일 타입을 가리키므로 기존 코드는 즉시 깨지지 않는다.

### 6.6 `getLabelFromItem` — 필터 레이블 도출 보정
`DataMapEditor` 의 필터는 각 항목의 표시 레이블이 필요하다. 그러나 내부 Map 은
`valuePath(item)`(코드 값)으로 키가 잡혀 있어 `getDisplay(item)` 에 항목 객체를 직접
넘겨 레이블을 얻을 수 없다. 이를 메우기 위해 `getLabelFromItem?: (item) => string`
prop 을 둔다. 제공되면 항목→레이블 변환에 쓰고, 미제공 시 `String(item)` 으로
fallback 한다. (이는 단순화된 초기 필터 설계의 결함을 바로잡은 것이다.)

### 6.7 의존성 최소화 — 캐시·드롭다운 자체 구현
비동기 캐싱에 SWR/react-query 를, 드롭다운/키보드에 Radix/Downshift 를 도입하지
않는다. `staleTime` 기반 단일 슬롯 `Map` 캐시와 React 직접 구현으로 요구사항을 모두
충족하며, 번들과 의존성 표면을 작게 유지한다. 트레이드오프: 라이브러리가 주는
고급 기능(다중 키 캐시, 가상 목록 등)은 범위 밖이며 필요 시 별도로 확장한다.

### 6.8 Pro 라이선스 검증
패키지 진입점에서 `@topgrid/grid-license` 의 `checkLicense()` 를 1회 호출한다.
추가로 `DataMapCell` 은 `useWatermarkEnforcement()` 훅을 호출해, 라이선스가 유효하지
않으면 워터마크가 렌더되도록 한다. 이 훅은 셀이 수백 개 마운트돼도 `document.body`
에 단일 portal 을 ref-count 로 정확히 1회만 mount 한다(셀 수만큼 portal 이 쌓이는
문제 회피). 진입점이 아닌 내부 컴포넌트(`DataMapEditor`, `createAsyncDataMap` 등)는
별도 검증 호출을 하지 않는다.

---

## 7. 렌더러 레지스트리 연동(현황)

`DataMapCell` / `DataMapEditor` 는 **수동 배선**으로 사용한다(`cell: DataMapCell`,
또는 편집 셀에서 `<DataMapEditor .../>` 직접 렌더). 컬럼 `type: 'datamap'` 으로
`createColumns` 가 자동으로 `DataMapCell` 을 디스패치하는 레지스트리 통합은 이
패키지 범위가 아니며 `@topgrid/grid-core`/렌더러 레지스트리 쪽 작업으로 분리돼 있다.
즉, 현재 이 패키지는 컴포넌트와 팩토리를 독립 export 하고 배선은 소비자가 한다.

---

## 8. 사용 예시(종합)

```tsx
import {
  createDataMap, createAsyncDataMap, DataMapCell,
} from '@topgrid/grid-pro-datamap';
import type { DataMapColumnDef } from '@topgrid/grid-pro-datamap';

const statusMap = createDataMap({
  items: [{ code: 'A', label: '활성' }, { code: 'B', label: '비활성' }],
  valuePath: 'code', displayPath: 'label',
});

const countryMap = createAsyncDataMap({
  loader: async () => (await fetch('/api/countries')).json(),
  valuePath: 'code', displayPath: 'label',
  staleTime: 60_000,
});

const columns: DataMapColumnDef<Row>[] = [
  { id: 'status',  accessorKey: 'status',  header: '상태', dataMap: statusMap,  cell: DataMapCell },
  { id: 'country', accessorKey: 'country', header: '국가', dataMap: countryMap, cell: DataMapCell },
];
// status: 정적 → 즉시 레이블. country: 비동기 → 최초 로딩 후 staleTime 동안 캐시.
```
