# 집계 그리드 모듈 (`@topgrid/grid-pro-agg`)

행 그룹화(row grouping)와 그룹별 집계(aggregation)를 제공하는 Pro 컴포넌트.
TanStack Table v8의 grouped / expanded / sorted row model을 감싸, 그룹 헤더 행·
집계 footer 행·펼치기/접기·사용자 정의 집계 함수·드래그로 그룹화하는 Group Panel을
한 컴포넌트(`AggregationGrid`)로 묶어 제공한다.

- 패키지: `@topgrid/grid-pro-agg`
- 라이선스: **상용 (SEE LICENSE IN EULA)** — 무료 라이선스 사용 시 워터마크 표시
- 의존:
  - `@tanstack/react-table` (^8) / `react` / `react-dom` 는 peer dependency
  - `@tanstack/react-virtual` (^3) 는 **required** peer dependency
    (소스가 `useVirtualizer` 를 정적 import + 무조건 호출하므로 — merging 과 동일, §G-vimport)
  - `@topgrid/grid-license` 는 런타임 dependency (라이선스 검증·워터마크)
- 스타일: Tailwind className 만 사용. 인라인 `style` 은 (1) 그룹 행 깊이별 들여쓰기
  width, (2) 가상화 spacer 행 height 등 동적 수치값에만 한정한다.

`AggregationGrid` 는 `<Grid>` 코어 컴포넌트의 확장이 아니라 자체 `useReactTable` 을
소유하는 **standalone 컴포넌트**다(설계 결정 §6.1).

---

## 1. 개요 — 공개 API

| export | 종류 | 역할 |
|--------|------|------|
| `AggregationGrid` | 컴포넌트 | 그룹화 + 집계 + footer + 정렬 + Group Panel 통합 그리드 |
| `GroupPanel` | 컴포넌트 | 드래그 드롭으로 그룹화하는 바(standalone 사용 가능) |
| `registerAggregationFn` | 함수 | 사용자 정의 집계 함수 등록 |
| `getAggregationFn` | 함수 | 등록된 집계 함수 조회 |
| `resolveAggregationFn` | 함수 | 내장 키(`'avg'`→`'mean'`) → TanStack 키 변환 |
| `BUILT_IN_AGGREGATION_KEYS` | 상수 | 내장 5종 키 목록(`readonly`) |

타입 export: `AggregationGridProps`, `AggregationColumnDef`, `AggregationColumnMeta`,
`AggregationFnKey`, `TanStackAggKey`, `GroupPanelProps`, `GroupRowProps`, `FooterRowProps`.

내부 컴포넌트 `GroupRow` / `FooterRow` 는 export 하지 않는다(캡슐화). 단 prop 타입
(`GroupRowProps` / `FooterRowProps`)은 커스텀 렌더러 작성을 위해 공개한다.

내장 집계 함수 5종(사용자 facing 키):

| 키 | 동작 | TanStack 내부 키 |
|----|------|-----------------|
| `sum` | 수치 합산 | `sum` |
| `avg` | 평균 | `mean` (별칭 매핑, §6.2) |
| `min` | 최솟값 | `min` |
| `max` | 최댓값 | `max` |
| `count` | 행 수(비수치 포함) | `count` |

---

## 2. `AggregationGrid` prop 계약

표기: `?` 는 optional, 괄호 안은 기본값. `TData extends object`.

```ts
interface AggregationGridProps<TData extends object> {
  // --- 데이터/컬럼 ---
  data: TData[];
  columns: AggregationColumnDef<TData>[];

  // --- 그룹화/집계 ---
  enableAggregation?: boolean;                 // (false)
  grouping?: string[];                         // ([]) 그룹 컬럼 id 순서
  expanded?: ExpandedState | false;            // ({}) false→{} 정규화

  // --- 그룹 헤더/footer ---
  showFooter?: boolean;                        // (true)
  groupRowClassName?: string;
  footerRowClassName?: string;
  renderGroupRow?: (row: Row<TData>) => ReactNode;
  renderFooterRow?: (row: Row<TData>, cells: Cell<TData, unknown>[]) => ReactNode;

  // --- 가상화 ---
  enableVirtualization?: boolean;              // (false)
  estimatedRowHeight?: number;                 // (40) px
  virtualOverscan?: number;                    // (5)

  // --- 외부 제어 콜백 ---
  onGroupingChange?: (grouping: string[]) => void;
  onExpandedChange?: (expanded: ExpandedState) => void;

  // --- Group Panel ---
  showGroupPanel?: boolean;                    // (false)
  groupPanelClassName?: string;
  groupChipClassName?: string;
  emptyGroupPanelText?: string;

  // --- 그룹 단위 정렬 ---
  enableGroupSort?: boolean;                   // (false)
  sorting?: SortingState;                      // controlled 모드
  onSortingChange?: OnChangeFn<SortingState>;  // controlled 모드 시 필수
}
```

### 컬럼 정의 — `AggregationColumnDef`

TanStack `ColumnDef<TData>` 에 타입드 `meta` 를 더한 것이다. 어느 컬럼을 어떤 함수로
집계할지는 `meta.aggregationFn` 으로 지정한다.

```ts
interface AggregationColumnMeta {
  aggregationFn?: AggregationFnKey | (string & {});  // 내장 5종 또는 등록된 커스텀 이름
  [key: string]: unknown;                            // 임의 user meta 허용
}
type AggregationColumnDef<TData extends object> =
  ColumnDef<TData> & { meta?: AggregationColumnMeta };
```

- `(string & {})` 패턴으로 내장 5종 키 자동완성을 유지하면서 등록된 커스텀 함수 이름
  같은 임의 문자열도 허용한다(`any` 미사용).

### 동작 핵심

- `enableAggregation=true` 일 때만 `getGroupedRowModel()` + `getExpandedRowModel()` 이
  활성화된다. `false` 면 일반 평면 테이블로 렌더된다.
- `grouping` 은 그룹화 기준 컬럼 id 의 **순서 있는** 배열이다. 빈 배열이면 그룹 해제.
- `expanded` 는 `true`(전체 펼침) / `false`(전체 접힘) / `Record<string, boolean>`(개별)
  3가지를 받는다. `false` 는 내부에서 `{}` 로 정규화한다(§6.4).
- `grouping` 상태는 내부 `useState` 로 보관한다. Group Panel 칩 X 클릭 등 uncontrolled
  조작이 re-render 를 유발하게 하기 위해서다(EC: §7).

---

## 3. 그룹 헤더 행과 집계 footer 행

`enableAggregation=true` 일 때 tbody 는 다음 순서로 행을 방출한다:

```
[그룹 헤더 행]  ← GroupRow:  ▶/▼ 토글 + 그룹 키 + (하위 행 수)
  [데이터 행 …]   ← 일반 leaf 행
[footer 행]    ← FooterRow: 집계 cell 에 집계값 표시
```

### GroupRow (내부)

- `row.getIsGrouped() === true` 인 행을 렌더. `colSpan` 으로 전체 폭을 차지.
- `row.getToggleExpandedHandler()` 를 클릭 핸들러로 연결(펼치기/접기 토글 — TanStack
  표준 API).
- `row.getIsExpanded()` 결과로 `▼`(펼침) / `▶`(접힘) 아이콘 표시.
- 그룹 키는 `row.groupingValue`, 하위 행 수는 `row.subRows.length` 로 표시.
- 들여쓰기는 `row.depth × indentUnit × 4px`(기본 `indentUnit=4`)로 다중 레벨 그룹의
  깊이를 시각화한다.
- `GroupRowProps`: `row`, `columnCount`, `indentUnit?(4)`, `className?`, `renderGroupRow?`.
  `renderGroupRow` 가 주어지면 기본 렌더를 완전히 대체한다.

### FooterRow (내부) — 합성 footer

TanStack `getExpandedRowModel()` 은 footer 행을 자동 방출하지 않는다. 따라서
`AggregationGrid` 가 각 그룹의 leaf 행 직후에 `FooterRow` 를 **직접 인터리빙**한다(§6.3).

- 집계값 판정은 **셀 레벨** `cell.getIsAggregated()` 를 쓴다(Row API 에는 이 메서드가
  없음 — §6.5). `true` 인 셀에 `columnDef.aggregatedCell ?? columnDef.cell` 을
  `flexRender` 로 그린다. 그 외 셀은 빈 칸.
- 기본 배경 `bg-gray-50`. `footerRowClassName` 으로 커스터마이즈.
- `showFooter=false` 면 footer 인터리빙 자체를 건너뛴다.
- 하위 행이 없는 그룹(`subRows.length === 0`)은 footer 를 그리지 않는다(EC: §7).
- `FooterRowProps`: `row`, `cells`, `className?`, `renderFooterRow?`.

---

## 4. 사용자 정의 집계 함수 (registry)

내장 5종 외의 집계(가중평균, 비율 등)는 module-level registry 에 등록해 쓴다.

```ts
function registerAggregationFn<TData extends object>(
  name: string,
  fn: AggregationFn<TData>,   // TanStack 표준 시그니처
): void;

function getAggregationFn<TData extends object>(
  name: string,
): AggregationFn<TData> | undefined;

const BUILT_IN_AGGREGATION_KEYS: ReadonlyArray<AggregationFnKey>;
// ['sum', 'avg', 'min', 'max', 'count']
```

`AggregationFn<TData>` 는 TanStack 표준 시그니처
`(columnId, leafRows, childRows) => unknown` 를 그대로 사용한다.

### 등록 → 사용 흐름

```ts
import { registerAggregationFn, AggregationGrid } from '@topgrid/grid-pro-agg';
import type { AggregationFn } from '@tanstack/react-table';

interface SalesRow { region: string; sales: number; weight: number }

// 앱 부트스트랩에서 1회 등록
const weightedAvg: AggregationFn<SalesRow> = (columnId, leafRows) => {
  const totalW = leafRows.reduce((s, r) => s + (r.getValue('weight') as number), 0);
  if (totalW === 0) return 0;
  const totalV = leafRows.reduce(
    (s, r) => s + (r.getValue(columnId) as number) * (r.getValue('weight') as number), 0);
  return totalV / totalW;
};
registerAggregationFn('weightedAvg', weightedAvg);

// 컬럼에서 등록한 이름으로 참조
const columns: AggregationColumnDef<SalesRow>[] = [
  { id: 'region', header: '지역', accessorKey: 'region' },
  { id: 'sales',  header: '가중평균', accessorKey: 'sales',
    meta: { aggregationFn: 'weightedAvg' } },
];
```

### 집계 함수 결정 로직 (3분기)

`AggregationGrid` 는 컬럼의 `meta.aggregationFn` 키를 다음 우선순위로 해석한다:

1. **registry hit** — `getAggregationFn(key)` 가 함수를 반환하면 그 함수 참조를
   `column.aggregationFn` 에 직접 전달.
2. **내장 키** — `BUILT_IN_AGGREGATION_KEYS` 에 포함되면 `resolveAggregationFn(key)`
   로 TanStack 문자열 키(`'avg'`→`'mean'` 포함)를 전달.
3. **미등록** — `console.error('[grid-pro-agg] Unknown aggregationFn "…". Falling back
   to "count".')` 출력 후 `'count'` 로 fallback (예외 미발생).

registry 가 내장 키보다 우선이므로, `'sum'` 같은 내장 이름으로 커스텀 함수를 등록하면
의도적으로 내장 동작을 오버라이드할 수 있다.

---

## 5. Group Panel + 그룹 단위 정렬

### `GroupPanel` — 드래그로 그룹화하는 바

`showGroupPanel=true` 면 그리드 위에 그룹화 바가 렌더된다. 현재 그룹 컬럼이 [레이블 + ×]
형태의 칩으로 나열되고, 컬럼 헤더를 끌어다 패널에 드롭하면 그룹에 추가된다.

```ts
interface GroupPanelProps<TData> {
  grouping: string[];                          // 현재 그룹 컬럼 id (순서 유지)
  columns: Column<TData, unknown>[];           // 칩 레이블 해석용
  onGroupingChange: (grouping: string[]) => void;
  className?: string;
  chipClassName?: string;
  emptyText?: string;  // ('Drag a column header here to group')
}
```

- 드래그 드롭은 **HTML5 native drag API** 로 구현한다(외부 DnD 라이브러리 비의존 — §6.7).
  - 헤더 `<th>` 가 `draggable` 이 되고 `onDragStart` 에서
    `dataTransfer.setData('columnId', column.id)` 로 컬럼 id 를 싣는다.
  - 패널 div 의 `onDrop` 에서 id 를 꺼내 그룹 배열에 추가한다.
  - Safari 호환: `dataTransfer.getData` 가 드롭 핸들러 밖에서 빈 값을 줄 수 있어
    `dragSourceId` ref fallback 을 둔다.
- 칩 레이블: `columnDef.header` 가 문자열이면 그대로, 아니면 컬럼 id fallback.
- 칩 × 클릭 → 해당 컬럼을 그룹에서 제거. 드롭 시 이미 그룹화된 컬럼은 중복 추가하지 않음.
- `GroupPanel` 은 export 되어 standalone 으로도 쓸 수 있다.

### 그룹 단위 정렬

`enableGroupSort=true` 일 때만 `getSortedRowModel()` 이 활성화된다. 정렬 모델은 grouped
row model 이후에 적용되므로 **그룹 간 순서가 집계값 기준으로 재정렬**된다.

- sortable 헤더(`column.getCanSort()`) 클릭 → `column.getToggleSortingHandler()` 호출.
- `column.getIsSorted()` 결과로 `▲`(asc) / `▼`(desc) / (무) 아이콘 표시.
- **uncontrolled**(기본): 내부 `useState<SortingState>([])` 로 정렬 상태 관리.
- **controlled**: `sorting` + `onSortingChange` 를 함께 전달. `sorting` 만 주고
  `onSortingChange` 가 없으면 `console.error` 후 내부 state 로 fallback(예외 미발생).
- `enableGroupSort` 와 `showGroupPanel` 은 완전히 독립적인 플래그다.

---

## 6. 핵심 설계 결정과 근거

### 6.1 standalone 컴포넌트 (코어 Grid 확장 아님)
`AggregationGrid` 는 자체적으로 `useReactTable` 을 호출하는 self-contained 컴포넌트다.
코어 `<Grid>` 를 import/확장하지 않아 의존 경계가 깔끔하고(코어 API 표면에 결합되지 않음),
그룹/펼침 상태 같은 집계 전용 row model 설정을 컴포넌트가 직접 소유해 단순하다. 트레이드
오프로, 코어 레이아웃 기능(컬럼 리사이즈·sticky 헤더 등)은 이 컴포넌트 자체 테이블 마크업
범위 밖이다.

### 6.2 `'avg'` → `'mean'` 별칭 매핑
TanStack 내장 평균 키는 `'mean'` 이지만, 사용자에게는 더 익숙한 `'avg'` 를 노출한다.
`resolveAggregationFn` 이 `'avg'` → `'mean'` 으로 변환하고 나머지 키는 그대로 통과시킨다.
이 함수는 **함수 참조가 아니라 문자열 키를 반환**해 TanStack 이 자체 registry 조회를 하게
한다. TanStack 내부 `aggregationFns` 객체를 직접 import 하지 않아 결합도를 낮춘다(순수
함수이므로 React import 도 없음).

### 6.3 합성 footer 행 인터리빙
`getExpandedRowModel()` 은 `[그룹헤더, leaf…]` 만 방출하고 footer 는 자동 생성하지 않는다.
그룹 헤더 셀에 집계값을 얹는 대안(Reading A)으로는 "데이터 행 먼저, footer 마지막" 순서를
충족할 수 없어, 평면 row 배열을 `RowDescriptor[]`(`'group'`/`'leaf'`/`'footer'`)로 미리
펼쳐 leaf 직후에 footer descriptor 를 끼워 넣는다. 같은 descriptor 배열을 가상화/비가상화
양쪽 렌더 경로가 공유해 DOM 분기가 없다.

### 6.4 `expanded` 의 `false` 정규화
prop 의 편의를 위해 `expanded` 가 `ExpandedState | false` 를 받지만, TanStack 의
`ExpandedState`(`true | Record<string, boolean>`)에는 `false` 가 없다. 컴포넌트 경계에서
`false → {}`(아무 것도 펼치지 않음)로 정규화한다. 결과적으로 `expanded={false}` 와
`expanded={{}}` 는 동작이 동일하다(의도된 동작).

### 6.5 TanStack Row vs Cell API 구분
집계 상태 판정은 **`cell.getIsAggregated()`**(셀 레벨)만 존재한다. Row 레벨에는 동등 메서드가
없고, `row.getParentRow()` 도 v8 에 존재하지 않는다. 그래서 부모 그룹 추적은
`getParentRow()` 대신 깊이 기반 `groupStack` 으로 구현한다. (Row 전용: `getIsExpanded`,
`getCanExpand`, `getToggleExpandedHandler`, `subRows`, `depth`, `groupingValue`. Cell 전용:
`getIsAggregated`, `getIsPlaceholder`, `getValue()`.)

### 6.6 사용자 정의 함수 — 단일 registry 진입점 + 중복 overwrite
커스텀 집계는 module-level `Map` registry 하나만을 진입점으로 쓴다. TanStack 의
`table.options.aggregationFns` 는 노출하지 않아 충돌 시나리오가 없다. `registerAggregationFn`
한 번의 전역 호출만으로 모든 `AggregationGrid` 인스턴스가 함수를 인식하므로 prop 전달이
필요 없다. 같은 이름 재등록 시 **덮어쓰기 + `console.warn`**(예외 미발생). HMR/fast-refresh
에서 module-level 등록이 매번 실행돼도 throw 하지 않아 개발 워크플로가 깨지지 않는다.
삭제 API 는 제공하지 않으며 overwrite 가 유일한 변경 경로다.

### 6.7 Group Panel — HTML5 native DnD (라이브러리 비의존)
드롭존이 패널 div 하나뿐이라 dnd-kit/react-dnd 같은 추상화는 과하고 번들(8~12 KB)을 키운다.
HTML5 native drag API 로 직접 구현해 번들 추가 0, 신규 의존 0 으로 둔다. 트레이드오프로
키보드 기반 드래그(접근성)는 미지원이며, Safari `dataTransfer` 호환을 위해 ref fallback 이
필요하다.

### 6.8 `getSortedRowModel` opt-in (`enableGroupSort`)
정렬은 `enableGroupSort=true` 일 때만 켜진다. 항상 켜면 기존 사용처가 의도치 않게 정렬 UI/
동작을 얻어 하위호환이 깨진다. opt-in 으로 두면 미사용 시 `getSortedRowModel()` 이 옵션에
포함되지 않아 tree-shaking 여지도 남는다. 정렬은 그룹화와 독립이므로 `enableAggregation` 에
묶지 않고 별도 플래그로 둔다.

### 6.9 라이선스 게이트 + 워터마크
상용 패키지이므로 패키지 진입(`index.ts`)에서 `@topgrid/grid-license` 의 `checkLicense()` 를
module-load 시 1회 호출한다. `AggregationGrid` 는 `useLicenseStatus()` 로 상태를 구독하고,
워터마크가 필요한 라이선스면 렌더 트리에 `<Watermark required />` 를 표시한다. 라이선스
검증·워터마크 로직은 전적으로 `@topgrid/grid-license` 에 위임한다.

---

## 7. 엣지 케이스 동작 요약

| 영역 | 입력/상황 | 동작 |
|------|----------|------|
| 그룹화 | `grouping=[]` (빈 배열) | 그룹 해제, 평면 데이터 행 렌더 |
| 집계 | `aggregationFn` 셀 값이 문자열인데 `'sum'` | TanStack 위임(NaN/undefined). 예외 미발생 |
| 집계 | 컬럼에 `aggregationFn` 없음 | 그룹/footer 해당 셀 빈 칸 |
| 집계 | 미등록 커스텀 이름 | `console.error` + `'count'` fallback |
| registry | 같은 이름 중복 등록 | overwrite + `console.warn` |
| registry | 내장 키 이름으로 커스텀 등록 | overwrite — registry 우선이라 커스텀 사용 |
| footer | 하위 행 없는 그룹 | footer 행 미렌더 |
| footer | `showFooter=false` | footer 인터리빙 전체 생략 |
| 펼침 | `expanded=false` | 모든 그룹 접힘(`{}` 로 정규화). leaf/footer 미표시 |
| Group Panel | `grouping=[]` 에서 패널 표시 | `emptyText` placeholder + dashed drop zone |
| Group Panel | 이미 그룹화된 컬럼 재드롭 | 중복 추가 무시 |
| 정렬 | `enableGroupSort=false` + `showGroupPanel=true` | 패널만, 정렬 핸들러/아이콘 없음(독립) |
| 정렬 | `sorting` 만 주고 `onSortingChange` 없음 | `console.error` + 내부 state fallback |
| 가상화 | `enableVirtualization=true` + 그룹/footer | 그룹·leaf·footer 모두 가상 window 포함. 단 window 밖 그룹 헤더/footer 는 스크롤 시 DOM 제거(대용량 성능 트레이드오프) |

---

## 8. 가상화

`enableVirtualization=true` 면 `@tanstack/react-virtual` 의 `useVirtualizer` 로 행을
가상화한다.

- `useVirtualizer` 는 **항상 호출**한다(Hook 순서 보장). 비활성 시 `count=0` 으로 둔다.
- `count` 는 footer descriptor 를 포함한 `interleavedRows.length` 를 쓴다 — 그래야 footer
  행이 가상 window 에서 누락되지 않는다.
- 가상화 경로는 `position: absolute` 대신 상·하단 **spacer 행**(`height` 동적 style)으로
  오프셋을 흘려보내는 flow-layout 패턴을 쓴다.
- 알려진 한계: 가상 window 밖으로 스크롤된 그룹 헤더/footer 는 DOM 에서 언마운트된다.
  대용량 데이터 성능을 위한 의도된 트레이드오프다.

---

## 9. 사용 예시

```tsx
import { AggregationGrid, type AggregationColumnDef } from '@topgrid/grid-pro-agg';

interface SalesRow { region: string; product: string; revenue: number }

const columns: AggregationColumnDef<SalesRow>[] = [
  { id: 'region',  header: '지역', accessorKey: 'region' },
  { id: 'product', header: '상품', accessorKey: 'product' },
  { id: 'revenue', header: '매출', accessorKey: 'revenue',
    meta: { aggregationFn: 'sum' } },
];

// 기본: 지역별 그룹 + 매출 합계 footer + 전체 펼침
<AggregationGrid
  data={salesData}
  columns={columns}
  enableAggregation
  grouping={['region']}
  expanded={true}
/>

// Group Panel + 그룹 단위 정렬 + 대용량 가상화
<AggregationGrid
  data={largeData}            // 1000행+
  columns={columns}
  enableAggregation
  grouping={['region', 'product']}
  expanded={true}
  showGroupPanel
  enableGroupSort
  enableVirtualization
  estimatedRowHeight={36}
  footerRowClassName="bg-blue-50 font-semibold"
/>
```
