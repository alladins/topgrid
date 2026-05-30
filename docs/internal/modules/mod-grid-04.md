# 컬럼 팩토리 모듈 (`@topgrid/grid-core` — column)

`type` 필드 기반으로 TanStack `ColumnDef` 를 자동 생성하는 컬럼 팩토리. 선언적인
컬럼 정의 배열(`TomisColumnDef[]`)을 받아 `useReactTable({ columns })` 에 그대로 주입
가능한 `ColumnDef[]` 로 변환한다. 각 컬럼의 `type` 으로 렌더러 레지스트리를 조회해 셀
렌더러를 자동 매핑한다.

- 패키지: `@topgrid/grid-core` (`column/` 서브모듈)
- 라이선스: **MIT**
- 의존: `react` / `@tanstack/react-table` 는 peer dependency. 런타임 의존 0.
- 셀 렌더러 자체는 이 모듈이 소유하지 않는다 — 레지스트리는 `type → 렌더 함수` 매핑
  계약만 정의하고, 실 셀 컴포넌트는 `@topgrid/grid-renderers` 가 import 시점에
  side-effect 로 주입한다(아래 §4 참고).

---

## 1. 개요 — 공개 API

| 심볼 | 종류 | 역할 |
|------|------|------|
| `createColumns<TData>(defs)` | 함수 | `TomisColumnDef[] \| ColumnInfo[]` → `ColumnDef[]`. type 자동 분기 |
| `TomisColumnDef<TData>` | 타입 | 컬럼 정의 입력 타입(`id`/`name`/`type`/`align` + 옵션) |
| `TomisColumnType` | 타입 | 11종 컬럼 type union |
| `defaultRendererRegistry` | 값 | `Map<TomisColumnType, RendererFn>` — type → 렌더 함수 매핑 |
| `registerRenderer(type, fn, registry?)` | 함수 | 레지스트리에 커스텀 렌더러 등록/덮어쓰기 |
| `RendererFn<TData>` / `RendererRegistry<TData>` | 타입 | 렌더 함수 / 레지스트리 타입 |
| `ColumnInfo` | 타입 | 레거시 호환 컬럼 정의(`@topgrid/grid-core/legacy`) |

> 심볼 이름의 `Tomis*` 접두사는 제품 공개 API 식별자이며 그대로 유지된다. npm 스코프만
> `@topgrid/*` 다.

차기 메이저에서 제거 예정인 보조 API(현재 프로덕션 사용처 없음)는 §6 에 분리해 둔다.

---

## 2. `createColumns` — 핵심 계약

```ts
function createColumns<TData = unknown>(
  defs: TomisColumnDef<TData>[] | ColumnInfo[],
): ColumnDef<TData>[];
```

`defs` 배열을 1:1 로 `ColumnDef<TData>[]` 로 매핑한다. 호출 1회로 TanStack
`useReactTable({ columns })` 에 직접 주입 가능한 배열을 반환한다.

### 2.1 `TomisColumnDef` 입력 타입

```ts
type TomisColumnType =
  | 'checkbox' | 'number' | 'boolean' | 'dateTime' | 'date' | 'text'
  | 'badge' | 'link' | 'icon' | 'tag' | 'progress';   // 11종

interface TomisColumnDef<TData = unknown> {
  id: string;                  // accessor key (checkbox type은 무시). TData 키로 타입 추론
  name: string;                // 헤더 표시명
  type: TomisColumnType;       // 자동 렌더러 분기 키
  align: 'left' | 'center' | 'right';
  width?: string;              // 픽셀 너비 문자열('100', '200px'). 미제공 시 '100'
  visibility?: boolean;        // false면 숨김 (처리 방식은 §2.4)
  enableSorting?: boolean;     // 기본 true. checkbox는 강제 false
  enableResizing?: boolean;    // 기본 true. checkbox는 강제 false
  meta?: { primary?: boolean; [key: string]: unknown };
  etc?: string;                // 레거시 호환: 'primary' 포함 시 meta.primary = true
}
```

### 2.2 표준 매핑 규칙

`createColumns` 가 각 `def` 를 `ColumnDef` 로 변환할 때 적용하는 규칙:

- **accessorKey / header**: `accessorKey = def.id`, `header = def.name`.
- **cell**: `defaultRendererRegistry.get(def.type)` 으로 렌더 함수를 조회해
  `cell: (info) => renderFn(info)` 로 연결. 조회 실패(미등록 type) 시 `cell` 키를
  생략하여 TanStack 기본 cell(= plain text)로 폴백하고 `console.warn` 을 출력한다.
- **size**: `parseInt(width ?? '100')`. 추가로 `minSize = floor(size * 0.5)`,
  `maxSize = size * 3` 을 함께 설정한다.
- **enableSorting / enableResizing**: 기본 true. 명시적 `false` 만 false 로 반영
  (`def.enableSorting !== false`).
- **meta**: `{ primary, align }` 형태로 합성. `primary` 는 `meta.primary` 또는
  `etc` 문자열에 `'primary'` 포함 여부(`etc?.toLowerCase().includes('primary')`)로 결정.

### 2.3 `checkbox` type — DisplayColumnDef 분기

`type === 'checkbox'` 는 레지스트리를 거치지 않고 별도 `DisplayColumnDef` 경로로
생성한다(`accessorKey` 없음). 선택 컬럼은 데이터 키에 바인딩되지 않기 때문이다.

- `accessorKey` 미생성, `header`/`cell` 은 placeholder(실 체크박스 셀은 셀 패키지 담당).
- `enableSorting` / `enableResizing` 은 **강제 false** (입력값 무시).
- 입력 객체에 `accessorKey` 가 함께 들어오면 무시하고 `console.warn`.

### 2.4 `visibility` 처리 — 호출 측 위임

`ColumnDef` 표준에는 가시성 개념이 없다. 따라서 `createColumns` 는 `visibility: false`
를 컬럼 정의 자체에 반영하지 않고, 반환된 배열을 기준으로 호출 측이 TanStack 표준
방식으로 구성한다:

```ts
useReactTable({
  columns,
  initialState: { columnVisibility: { [colId]: false } },
});
```

### 2.5 `ColumnInfo` 레거시 입력

`@topgrid/grid-core/legacy` 의 `ColumnInfo` 는 `TomisColumnDef` 와 **런타임 구조가
동일**(`id`/`name`/`type`/`align`/`width?` 등)하다. `type` 이 `string` 인 점만 다르다.
이 때문에 `createColumns` 는 두 입력을 **단일 코드 경로**로 처리한다 — 입력 종류를
heuristic 으로 구분하지 않고 그대로 매핑한다. `ColumnInfo.type` 이 11종 union 에
없는 값이면 §2.2 의 미등록 type 규칙(plain text 폴백 + `console.warn`)이 그대로 적용된다.

> 설계 노트: 과거에는 `isColumnInfo()`/`normalizeColumnInfo()` heuristic 으로 두 입력을
> 구분했으나, 구조가 동일한 `TomisColumnDef` 를 `ColumnInfo` 로 오분류해 미등록 type 을
> 조용히 `'text'` 로 강제하던 결함이 있었다. 현재는 단일 경로로 통합되어 미등록 type 은
> 항상 경고와 함께 노출된다.

---

## 3. 렌더러 레지스트리

```ts
type RendererFn<TData = unknown> = (info: CellContext<TData, unknown>) => ReactNode;
type RendererRegistry<TData = unknown> = Map<TomisColumnType, RendererFn<TData>>;

const defaultRendererRegistry: RendererRegistry;
function registerRenderer<TData>(
  type: TomisColumnType,
  fn: RendererFn<TData>,
  registry?: RendererRegistry<TData>,   // 기본값 defaultRendererRegistry
): void;
```

- `defaultRendererRegistry` 는 11종 type 각각에 대한 entry 를 `Map` 으로 보유한다.
- `createColumns` 는 `registry.get(type)` 조회 결과로 `cell` 을 연결한다(AG Grid 의
  `components` 주입 패턴과 동일 발상). hard-coded if/else 분기 없음.
- `registerRenderer` 로 외부에서 커스텀 렌더러를 등록·덮어쓸 수 있다. 마지막 호출이
  우선한다.

### 3.1 기본 placeholder 동작

`@topgrid/grid-renderers` 를 import 하지 않은 상태에서도 11종 type 모두 렌더 가능한
`ReactNode` 를 반환하도록, 레지스트리는 기본 placeholder 를 내장한다:

- 대부분 type: `String(info.getValue() ?? '')` (plain text).
- `boolean`: `info.getValue() ? 'Y' : 'N'`.

즉 셀 렌더러 패키지가 없어도 그리드는 항상 안전하게 렌더된다(graceful degradation).

---

## 4. 셀 렌더러 와이어링 — 크로스 패키지 계약

이 모듈은 `type → 렌더 함수` 매핑 **계약**만 소유한다. 실제 셀 컴포넌트는
`@topgrid/grid-renderers` 가 제공하며, 해당 패키지를 import 하면 **side-effect** 로
`registerRenderer` 를 통해 placeholder 슬롯을 실 컴포넌트 어댑터로 교체한다.

| type | import 시 동작 |
|------|----------------|
| `text` `number` `date` `dateTime` `badge` `link` `tag` `progress` (8종) | 실 셀 컴포넌트 어댑터로 교체 |
| `boolean` | 항상 Y/N (전용 BooleanCell 없음 — 교체되지 않음) |
| `icon` | placeholder 유지 — 구조적 제약(아이콘이 필수 `ReactNode` 라 value-only 어댑터 불가) |
| `checkbox` | 레지스트리 우회(DisplayColumnDef 분기, §2.3) |

**모듈 로드 순서가 중요하다**: 소비자는 `<Grid>` 렌더 전에(보통 앱 진입점에서 1회)
`import '@topgrid/grid-renderers'` 를 실행해야 어댑터가 적용된다. 그렇지 않으면
placeholder(`String(value)`)가 렌더된다. `boolean` Y/N 은 어느 경우든 동일하다.

> 각 셀 컴포넌트의 prop 계약·엣지케이스는 렌더러 모듈 문서(`renderers.md`)를 참고.
> 이 모듈은 셀을 재기술하지 않는다.

---

## 5. 핵심 설계 결정과 근거

### 5.1 레지스트리 자료구조 — `Map` (vs `Record` vs Context)

type → 렌더러 매핑을 `Map<TomisColumnType, RendererFn>` 로 구현한다.

- **Map 채택**: key 가 `TomisColumnType` union 으로 타입 안전하고, `Map.set()` 으로
  런타임 동적 등록(`registerRenderer`)이 자연스럽다. 미등록 key 는 `get()` 이
  `undefined` 를 반환해 호출 측 폴백 처리가 깔끔하다. key 순회도 가능.
- **`Record` 기각**: 초기화는 간결하나 optional key 를 표현할 수 없어 11종을 모두
  정의해야 하고 부분 등록이 불가능하다.
- **React Context 기각**: 컴포넌트 트리 공유에는 유리하나, 순수 함수 `createColumns`
  가 React 의존성을 갖게 되고 테스트·SSR 복잡도가 올라간다.

핵심 trade-off 는 **동적 등록 vs 정적 선언**(크로스 패키지 렌더러 주입을 위해 동적
등록 필수), **순수성 vs 편의성**(Map 기반이 함수 순수성·테스트 용이성 우위)이다.

### 5.2 `createColumns` 단일 경로 원칙

`createColumns` 는 입력을 `TomisColumnDef` 로 보고 단일 경로로 매핑한다. `ColumnInfo`
와 구조가 동일하므로 입력 종류를 추론하는 내부 heuristic 을 두지 않는다(§2.5). 이
원칙은 thin-wrapper 성격을 유지해 "동일 shape 오분류" 류의 결함을 원천 차단한다.

---

## 6. 엣지 케이스 동작 요약

| 입력 | 동작 |
|------|------|
| `defs = []` (빈 배열) | `[]` 반환. 에러 없음 |
| `type` 이 11종 외 임의 문자열 | plain text 폴백(TanStack 기본 cell) + `console.warn` |
| `width` 미지정/빈 문자열 | `parseInt('100')` = 100 기본값 |
| `ColumnInfo[]` 입력 | `TomisColumnDef` 와 동일 경로 처리. type 미일치 시 위 폴백 규칙 |
| `checkbox` + `accessorKey` 제공 | `accessorKey` 무시, DisplayColumnDef 강제 + `console.warn` |
| `checkbox` + `enableSorting: true` | 강제 `false` 로 덮어씀 |
| `meta.primary` 미지정 + `etc: 'primary'` | `meta.primary = true` |
| `grid-renderers` 미import 상태 | 모든 type placeholder 렌더(`String(value)`, boolean→Y/N) |

---

## 7. 사용 예시

```tsx
import { createColumns } from '@topgrid/grid-core';
import type { TomisColumnDef } from '@topgrid/grid-core';
import '@topgrid/grid-renderers'; // 앱 진입점에서 1회 — 실 셀 어댑터 활성화

interface Employee { empNo: string; name: string; salary: number; }

const defs: TomisColumnDef<Employee>[] = [
  { id: 'sel',    name: '',     type: 'checkbox', align: 'center', width: '50'  },
  { id: 'empNo',  name: '사번', type: 'text',     align: 'center', width: '100' },
  { id: 'name',   name: '성명', type: 'text',     align: 'left',   width: '120' },
  { id: 'salary', name: '급여', type: 'number',   align: 'right',  width: '120' },
];

const columns = createColumns<Employee>(defs);
// useReactTable({ columns, data }) 에 직접 주입
```

커스텀 렌더러 주입:

```tsx
import { registerRenderer } from '@topgrid/grid-core';

registerRenderer('number', (info) => {
  const v = info.getValue();
  return typeof v === 'number' ? v.toLocaleString() : String(v ?? '');
});
```

---

## 8. 차기 메이저 제거 예정 API

아래 심볼은 프로덕션 사용처가 없어 다음 메이저에서 제거 예정이다(ADR-013). 보존된
설계 지식만 1줄로 남긴다.

| 심볼 | 용도 | 대체/제거 사유 |
|------|------|----------------|
| `createTomisColumnHelper<TData>()` | TanStack `createColumnHelper` 순수 re-export(저수준 수동 컨트롤) | wrapper 메서드를 두지 않는 **순수 re-export(Option A)** — 학습 비용 0, 타입 호환 완벽. 대신 TanStack breaking change 에 직접 노출. `createColumns` 사용 또는 `@tanstack/react-table` 에서 직접 import 권장 |
| `createGroupedColumns<TData>(...groups)` / `TomisColumnGroup<TData>` | 다단(multi-row) 헤더 그룹 생성 | TanStack `GroupColumnDef` 위의 thin wrapper(`{ header, columns }` 그대로 반환). 중첩 헤더의 colSpan·placeholder 는 TanStack `getHeaderGroups()` 가 자동 계산. `GroupColumnDef` 직접 사용으로 대체 |
| `useColumnPersistence<TData>(table, options)` / `ColumnPersistenceOptions` / `PersistTarget` | 컬럼 가시성·순서 localStorage 영속화 | 저장 포맷 `{ v, data: { visibility?, order? } }`, version 불일치 시 캐시 무효화, SSR/incognito 안전(try/catch). 내부 storage 어댑터(ADR-007)로 대체됨 |
| `ColumnVisibilityMenu<TData>` / `ColumnVisibilityMenuProps` | 컬럼 가시성 토글 메뉴 UI | 네이티브 `<details>/<summary>/<input checkbox>` 기반(추가 peerDep 없이 구현). `getAllLeafColumns()` + `getCanHide()` 필터 → `toggleVisibility()` |
