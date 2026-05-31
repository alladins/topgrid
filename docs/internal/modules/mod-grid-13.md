# 셀 병합 모듈 (`@topgrid/grid-pro-merging`)

연속한 행을 세로로 병합(rowSpan)해 단일 셀로 표시하는 Pro 그리드 패키지. 컬럼
단위 `mergeRows` 설정으로 자동 rowSpan 계산을 수행하며, 복수 컬럼 계층 병합과
대용량 데이터 가상화를 지원한다.

- 패키지: `@topgrid/grid-pro-merging`
- 분류: **Pro** (상용). 라이선스: `SEE LICENSE IN EULA`.
- 의존: `@tanstack/react-table` / `react` / `react-dom` / `@topgrid/grid-core` 는
  peer dependency. `@tanstack/react-virtual` 은 **optional peer**(가상화 미사용 시
  미설치 환경에서도 동작). `@topgrid/grid-license` 는 런타임 라이선스 연동용 dependency.
- TanStack v8 자체는 rowSpan 자동 계산을 제공하지 않으므로, 전체 데이터를 한 번에
  스캔하는 `computeMergeSpans` 엔진을 두어 rowSpan 을 계산한다.

---

## 1. 개요 — 공개 표면

| export | 종류 | 역할 |
|--------|------|------|
| `MergingGrid` | 컴포넌트 | 병합·가상화를 지원하는 테이블 렌더러 |
| `computeMergeSpans` | 순수 함수 | 데이터+컬럼 → rowSpan Map 계산 엔진 |
| `MergeRowsConfig` | 타입 | 컬럼별 병합 비교 설정 (`boolean | compareFn`) |
| `MergingColumnDef` | 타입 | `meta.mergeRows` 를 갖는 확장 컬럼 정의 |
| `MergeSpanMap` | 타입 | `Map<string, number>` (rowSpan 조회 결과) |
| `MergingGridProps` | 타입 | `MergingGrid` Props |

병합 활성화는 두 축으로 제어된다: 컴포넌트 레벨 `enableMerging`(전체 on/off)과
컬럼 레벨 `meta.mergeRows`(어느 컬럼을 병합할지). 둘 다 충족된 컬럼만 병합된다.

---

## 2. Prop / API 계약

### 2.1 타입 정의

```ts
// 컬럼별 병합 비교 설정
type MergeRowsConfig<TData> =
  | boolean                                        // true: 동일 값(===) 자동 병합
  | ((prev: TData, curr: TData) => boolean);       // 커스텀 비교 함수 (복합 조건)

// mergeRows 를 meta 로 갖는 확장 컬럼 정의
type MergingColumnDef<TData> = ColumnDef<TData> & {
  meta?: {
    mergeRows?: MergeRowsConfig<TData>;
    [key: string]: unknown;
  };
};

// computeMergeSpans 반환형. 키 `${rowIdx}_${colId}`
// 값 > 1: 병합 시작 셀(rowSpan), === 1: 일반 셀, === 0: skip 셀(렌더 시 제거)
type MergeSpanMap = Map<string, number>;
```

### 2.2 MergingGridProps

```ts
interface MergingGridProps<TData> {
  data: TData[];                          // required
  columns: MergingColumnDef<TData>[];     // required
  enableMerging?: boolean;                // (false)
  className?: string;                     // table 엘리먼트 className
  enableVirtualization?: boolean;         // (false)
  estimatedRowHeight?: number;            // (40) px — 가상화 행 높이 추정
  virtualOverscan?: number;               // (5) visible window 밖 추가 렌더 행 수
}
```

| Prop | 기본값 | 비고 |
|------|--------|------|
| `enableMerging` | `false` | false 시 병합 없는 일반 테이블 (동작 보존) |
| `enableVirtualization` | `false` | false 시 full DOM 렌더링 경로 |
| `estimatedRowHeight` | `40` | `enableVirtualization=true` 에서만 사용 |
| `virtualOverscan` | `5` | `enableVirtualization=true` 에서만 사용 |
| `className` | `undefined` | 미지정 시 conditional spread 로 미전달 |
| `meta.mergeRows` | `undefined` | 컬럼 단위. 미지정/`false` → 해당 컬럼 병합 안 함 |

`MergingGrid` 는 선언적 컴포넌트로, 외부 ref/imperative API 가 없다. 정렬·필터
state 는 TanStack 내장 모델(`getSortedRowModel`/`getFilteredRowModel`)로 처리되며,
병합 재계산은 자동으로 따라온다(§4.5).

### 2.3 computeMergeSpans 시그니처

```ts
function computeMergeSpans<TData>(
  rows: TData[],
  columns: Array<{ id: string; mergeRows: MergeRowsConfig<TData> }>,
): MergeSpanMap;
```

순수 함수 — 외부 state 의존 0. `rows` 는 렌더링 순서(정렬·필터 적용 후)의 데이터
배열, `columns` 는 병합 대상 컬럼의 `id` + `mergeRows` 목록이다. `MergingGrid` 가
내부에서 호출하므로 직접 호출은 선택적이나, 커스텀 렌더러 구축 시 단독 사용도 가능하다.

---

## 3. 핵심 병합 알고리즘

### 3.1 계층 병합 (ancestorBoundary 전파)

`computeMergeSpans` 는 단일 패스 O(N×C)(N=행 수, C=병합 컬럼 수) 알고리즘이다.
행 전환 `i-1 → i` 을 순회하면서, 각 컬럼을 **배열 순서(좌→우)** 로 평가한다.

규칙:

- **자체 경계**: 컬럼 `j` 의 `compareFn(rows[i-1], rows[i])` 가 false 면 그 컬럼에서
  병합 그룹이 끊긴다(경계 발생).
- **좌측 경계 전파**: 컬럼 `j` 에서 경계가 발생하면, 같은 행 전환에서 우측의 모든
  컬럼(`k > j`)도 강제로 경계를 갖는다. 이를 위해 행 전환마다 초기화되는
  `ancestorBoundary` 플래그를 누적한다.
- **암시적 우선순위**: `columns` 배열 순서가 곧 병합 우선순위다. 좌측 = 높은
  우선순위. 별도 우선순위 설정 타입은 없다(§5.3).
- 경계가 발생하면 이전 그룹의 시작 셀에 누적 span 을 기록하고 새 그룹을 시작한다.
  경계가 없으면 현재 셀을 skip 셀(`0`)로 기록한다.

키 형식은 `${rowIdx}_${colId}`. 값이 `0` 이면 skip(병합으로 흡수된 셀),
`1` 이상이면 그 셀이 시작하는 rowSpan 수다.

### 3.2 단일 컬럼 회귀 불변성

명시적인 `if (columns.length === 1)` 분기는 없다. 컬럼이 하나뿐이면 좌측 컬럼이
없어 `ancestorBoundary` 가 항상 `false` 로 유지되고, 결과적으로 자기 `compareFn` 만
평가한다. 즉 계층 알고리즘이 단일 컬럼 케이스로 수학적으로 퇴화하여, 단일 컬럼
병합과 비트 동일한 출력을 보장한다(별도 코드 경로 불필요).

### 3.3 worked example — dept/team 계층 병합

```ts
const rows = [
  { dept: '개발팀',   team: '프론트엔드' },
  { dept: '개발팀',   team: '프론트엔드' },
  { dept: '개발팀',   team: '백엔드' },
  { dept: '디자인팀', team: 'UX' },
  { dept: '디자인팀', team: 'UX' },
];
const columns = [
  { id: 'dept', mergeRows: true },
  { id: 'team', mergeRows: true },
];

const spanMap = computeMergeSpans(rows, columns);
// dept: '개발팀' 3행, '디자인팀' 2행
spanMap.get('0_dept'); // 3
spanMap.get('1_dept'); // 0 (skip)
spanMap.get('2_dept'); // 0 (skip)
spanMap.get('3_dept'); // 2
spanMap.get('4_dept'); // 0 (skip)
// team: '프론트엔드' 2행, '백엔드' 1행, 'UX' 2행
spanMap.get('0_team'); // 2
spanMap.get('1_team'); // 0 (skip)
spanMap.get('2_team'); // 1  ('백엔드' 단독)
spanMap.get('3_team'); // 2
spanMap.get('4_team'); // 0 (skip)
```

행 2→3 에서 dept 가 '개발팀'→'디자인팀' 으로 바뀌면(좌측 경계), team 도 경계가
전파되어 그 지점에서 병합 그룹이 강제로 끊긴다.

---

## 4. 렌더링 동작

### 4.1 rowSpan 적용 / skip 셀 제거

`MergingGrid` 는 행·셀을 순회하며 `spanMap.get(`${rowIdx}_${columnId}`)` 으로 span 을
조회한다.

- `span === 0` → `null` 반환으로 해당 `<td>` 를 DOM 에서 제거(병합에 흡수됨).
- `span > 1` → `<td rowSpan={span}>` 으로 병합 시작 셀 렌더.
- 그 외(`1`/`undefined`) → 일반 `<td>`(`rowSpan=1`).

`enableMerging=false` 면 span 조회 자체를 건너뛰고 모든 셀을 일반 `<td>` 로 렌더해
병합 없는 테이블과 완전히 동일하게 동작한다.

### 4.2 가상화 경로

`enableVirtualization=true` 면 `@tanstack/react-virtual` 의 `useVirtualizer` 로
visible + overscan 행만 `<tr>` 렌더링한다.

- **flow 레이아웃 spacer**: 스크롤 영역은 상단/하단 spacer `<tr style={{height}}>`
  로 확보한다. 셀에 `position: absolute` 를 쓰지 않는다(C-18 호환 — table 모델
  유지).
- `computeMergeSpans` 는 항상 **전체** 정렬·필터 완료 행을 대상으로 계산한다
  (visible 슬라이스가 아님). 스크롤로 visible window 가 바뀌어도 cross-window
  rowSpan 정보가 보존된다.
- 훅 순서 보장을 위해 `useVirtualizer` 는 항상 호출하되, 비가상화 시 `count: 0` 으로
  no-op 처리한다.

가상화 활성 시 스크롤 컨테이너에 고정 높이 + `overflow-y: auto` 가 필요하며,
`estimatedRowHeight` 로 행 높이를 힌트한다.

### 4.3 Pro 라이선스 연동

- 패키지 import 시 side-effect 로 `checkLicense()`(from `@topgrid/grid-license`)가
  1회 실행된다(`index.ts`).
- `MergingGrid` 는 `useLicenseStatus()` 로 라이선스 상태를 구독한다. 미라이선스
  상태(`watermarkRequired`)면 컴포넌트에 `<Watermark required />` 를 오버레이로
  렌더한다.
- 이 워터마크를 위치시키려고 비가상화 경로는 `<table>` 을 `<div className="relative">`
  로 감싼다(워터마크는 absolute 포지셔닝). 가상화 경로의 스크롤 div 도 동일 역할을
  겸한다.

라이선스 검증 로직 자체는 `@topgrid/grid-license` 모듈의 책임이며, 여기서는 소비
계약(import 시 검증 + 미라이선스 시 워터마크)만 다룬다.

---

## 5. 핵심 설계 결정과 근거

### 5.1 mergeRows 합집합 타입 — `boolean | compareFn`
단순 케이스(같은 값 자동 병합)는 `true` 한 단어로, 복합 케이스(멀티 필드·객체
비교 등)는 비교 함수로 표현한다. 두 패턴을 단일 합집합 타입으로 묶어 학습 비용을
낮췄다. `mergeRows: true` 의 기본 비교는 `===` 이므로, 객체/배열 값을 가진 컬럼은
참조 비교로 오판될 수 있다 — 이 경우 사용자가 커스텀 비교 함수를 제공한다.

### 5.2 반환형 `Map<string, number>` + 0=skip
렌더링 루프에서 셀별로 rowSpan 을 O(1) 조회하기 위해 Map 을 쓴다. skip 셀을
`0` 이라는 명시적 값으로 표현해 `null`/`undefined` 분기 없이 "span=0 → 셀 제거"
규칙을 단일화했다. (직렬화는 불가하나, 렌더링 전용 계산 결과라 불필요.)

### 5.3 암시적 병합 우선순위 — 배열 순서
계층 병합의 우선순위를 별도 설정 타입(`MergePriorityConfig` 등)으로 노출하지 않고,
`columns` 배열 순서에 인코딩한다(좌=높음). 배열 순서는 이미 컬럼 렌더 순서를
결정하므로 추가 API 없이 직관적이며, `ancestorBoundary` 전파가 이 순서를 자연스럽게
우선순위로 사용한다. 향후 명시적 제어가 필요하면 하위호환으로 `meta` 확장 여지가 있다.

### 5.4 통합 알고리즘 — 단일 컬럼 분기 없음
단일 컬럼을 위한 특수 분기를 두지 않고, 계층 알고리즘의 수학적 퇴화(§3.2)에 의존한다.
별도 코드 경로가 없어 유지보수 비용이 낮고, 단일 컬럼 출력의 회귀 안정성이 구조적으로
보장된다.

### 5.5 정렬·필터 재계산 — TanStack 위임
병합 재계산은 `useMemo(..., [rows, mergeColumns, enableMerging])` 에 묶여 있다.
`rows = table.getRowModel().rows` 는 TanStack 이 `getSortedRowModel` +
`getFilteredRowModel` 적용 후 반환하는 최종 행 배열이므로, 정렬·필터·데이터 변경
시 `rows` 참조가 바뀌어 useMemo 가 자동 재실행된다. `sorting`/`columnFilters` state 를
별도 의존성으로 추가하는 것은 TanStack 내부 계산을 중복 추적하는 anti-pattern 이라
배제했다.

### 5.6 가상화 의존성 — optional peer
`@tanstack/react-virtual` 은 `enableVirtualization=true` 일 때만 필요하므로 optional
peerDependency 로 둔다(기본값 false → 미설치 환경에서도 패키지 동작). dependency 로
넣으면 이중 번들이 발생하므로 peer 정책을 유지한다.

### 5.7 가상화 rowSpan 경계 한계 (문서화된 제약)
flow 레이아웃 가상화에서 스크롤 아웃된 `<tr>` 은 DOM 에서 제거된다. rowSpan 시작
행이 visible window(+overscan) 밖으로 스크롤되면 그 병합 셀 자체가 사라지고, window
안의 skip 셀들은 orphan 이 되어 `rowSpan=1` 로 truncate 렌더된다. 즉 매우 큰
rowSpan(>overscan+visible) 그룹은 스크롤 시 병합이 분리되어 보일 수 있다. 완화책은
`virtualOverscan` 을 키우는 것이고, 근본 해결(sticky first-cell 등)은 현재 범위 밖이다.
visible-only 재계산 방식은 스크롤 시 span 점프를 유발하므로 채택하지 않았다.

---

## 6. 엣지 케이스 동작 요약

| 입력 / 상황 | 동작 |
|-------------|------|
| `rows` 빈 배열 | 빈 Map 반환 → 빈 tbody, 에러 없음 |
| 모든 셀이 다른 값 | 모든 셀 `span=1`, skip 셀 없음 (일반 테이블과 동일) |
| 한 컬럼 전체가 동일 값 | 첫 행 `span = rows.length`, 나머지 skip |
| `mergeRows: true` + `null`/`undefined` 값 | `===` 비교로 동일 값끼리 병합됨 (null/undefined 가드는 사용자 책임) |
| 병합 컬럼 사이에 미설정 컬럼 | 미설정 컬럼은 전파 체인에서 건너뛰되, 좌측 경계는 우측 병합 컬럼에 그대로 전파 |
| 필터 결과 0행 | `computeMergeSpans([], …)` → 빈 Map → 0행 렌더 |
| 가상화 + rowSpan 시작 행이 window 밖 | orphan 셀은 `rowSpan=1` 로 truncate (§5.7) |
| `enableMerging=false` | 병합 계산 생략, 일반 테이블 동작 |
| `enableVirtualization=false` | full DOM 렌더링 경로 (가상화 코드 미실행) |

> 비결정론적 비교 함수(`Date.now()`/`Math.random()` 의존 등)는 렌더마다 다른 spanMap 을
> 만들어 불안정해질 수 있다. 비교 함수 내부 예외는 잡지 않으므로(try-catch 없음) 사용자
> 책임이다.

---

## 7. 사용

### 7.1 선언적 boolean 병합

```tsx
import { MergingGrid, type MergingColumnDef } from '@topgrid/grid-pro-merging';

interface EmployeeRow { dept: string; team: string; name: string }

const columns: MergingColumnDef<EmployeeRow>[] = [
  { id: 'dept', header: '부서', accessorKey: 'dept', meta: { mergeRows: true } },
  { id: 'team', header: '팀',   accessorKey: 'team' },   // 병합 없음
  { id: 'name', header: '이름', accessorKey: 'name' },
];

<MergingGrid data={employeeData} columns={columns} enableMerging />;
```

### 7.2 커스텀 비교 함수 (복합 조건)

```tsx
const columns: MergingColumnDef<EmployeeRow>[] = [
  {
    id: 'dept', header: '부서', accessorKey: 'dept',
    // dept + year 가 모두 같을 때만 병합
    meta: { mergeRows: (prev, curr) => prev.dept === curr.dept && prev.year === curr.year },
  },
];
```

### 7.3 계층 병합 + 가상화 (대용량)

```tsx
const hierarchicalColumns: MergingColumnDef<EmployeeRow>[] = [
  { id: 'dept', header: '부서', accessorKey: 'dept', meta: { mergeRows: true } }, // 좌=우선
  { id: 'team', header: '팀',   accessorKey: 'team', meta: { mergeRows: true } }, // dept 경계에 종속
  { id: 'name', header: '이름', accessorKey: 'name' },
];

<MergingGrid
  data={largeData}              // 1000행+
  columns={hierarchicalColumns}
  enableMerging
  enableVirtualization          // optional peer @tanstack/react-virtual 필요
  estimatedRowHeight={40}
  virtualOverscan={10}          // rowSpan 경계 완충 (§5.7)
/>;
```
