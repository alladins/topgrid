# 다단 헤더 / 컬럼 그룹 모듈 (`@topgrid/grid-pro-header`)

여러 leaf 컬럼을 공통 그룹 헤더 아래로 묶어 다단(multi-row) `<thead>` 를 렌더링하는
Pro 패키지. TanStack Table v8 의 네이티브 컬럼 그룹(`GroupColumnDef`) 트리를 그대로
사용하며, 그 위에 sticky 헤더, 컬럼 고정(frozen), 그룹 일괄 접기/펼치기 기능을 더한다.

- 패키지: `@topgrid/grid-pro-header`
- 라이선스: **Pro** (`SEE LICENSE IN EULA`, 동봉 `EULA.md`). 미라이선스 시 헤더에
  워터마크 행이 표시된다(§5 참고).
- 의존:
  - peer dependency: `@tanstack/react-table` (`^8`), `react` / `react-dom`
    (`^18 || ^19`) — 런타임 peer.
  - 런타임 의존: `@topgrid/grid-core`(타입·옵션), `@topgrid/grid-license`(라이선스
    검증·워터마크).
- 스타일: Tailwind className 만 사용. 인라인 `style` 은 런타임 동적 값 2건(sticky
  헤더의 행 높이 기반 `top`, frozen 셀의 px 단위 `left`)에만 한정한다.

핵심 접근: 헤더 행 구조를 명령형으로 직접 조작하지 않고, **선언적 컬럼 트리
(`GroupColumnDef`)** 를 정의하면 TanStack `getHeaderGroups()` 가 헤더 행 구조(placeholder
셀·colSpan 포함)를 자동 생성한다. 다단 헤더 렌더링은 이 자동 생성 결과를 순회할 뿐이며
수동 rowSpan 계산을 하지 않는다(§4.1).

---

## 1. 공개 API 개요

| Export | 종류 | 역할 |
|--------|------|------|
| `createColumnGroup` | 함수 | 타입 안전하게 `GroupColumnDef<TData>` 를 생성하는 thin wrapper |
| `MultiRowHeader` | 컴포넌트 | TanStack 테이블에서 다단 `<thead>` 를 렌더(핵심 컴포넌트) |
| `GroupedHeaderGrid` | 컴포넌트 | 자체 완결형 그리드 형태의 레거시 별칭(deprecated, §6) |
| `ColumnGroupConfig` | 타입 | `createColumnGroup` 설정 객체 타입 |
| `MultiRowHeaderProps` | 타입 | `<MultiRowHeader>` props 타입 |
| `GroupedHeaderGridProps` | 타입 | `<GroupedHeaderGrid>` props 타입 |

`index.ts` 는 import 시 side-effect 로 `checkLicense()` 를 1회 호출한다(§5). 이 부수효과는
`package.json` 의 `"sideEffects": ["./src/index.ts"]` 설정으로 번들러 tree-shaking 에서
제거되지 않도록 보존된다.

---

## 2. `createColumnGroup` — 그룹 정의 헬퍼

```ts
interface ColumnGroupConfig<TData> {
  header: string;                 // 그룹 헤더 표시 라벨
  columns: ColumnDef<TData>[];    // 그룹에 속한 leaf(또는 중첩 그룹) 컬럼
}

function createColumnGroup<TData>(
  config: ColumnGroupConfig<TData>,
): GroupColumnDef<TData>;
```

- 단일 설정 객체를 받아 `{ header, columns }` 를 그대로 반환하는 thin wrapper.
  로직은 없고, TanStack 표준 리터럴(`{ header, columns }`)에 제네릭 타입 안전성만 더한다.
- 반환값은 TanStack 네이티브 `GroupColumnDef<TData>` 그 자체이므로, `useReactTable` 의
  `columns` 배열에 일반 컬럼과 섞어 넣을 수 있다.
- 중첩 호출로 3단 이상 헤더도 표현 가능(`createColumnGroup({ header, columns: [createColumnGroup(...)] })`).

```ts
const columns = [
  createColumnGroup({
    header: '기본 정보',
    columns: [
      { accessorKey: 'empNo', header: '사번' },
      { accessorKey: 'name', header: '성명' },
    ],
  }),
  { accessorKey: 'salary', header: '급여' }, // 그룹 없는 flat 컬럼 혼합 가능
];
```

---

## 3. `MultiRowHeader` — 다단 헤더 렌더러

```ts
interface MultiRowHeaderProps<TData = unknown> {
  table: Table<TData>;             // TanStack 테이블 인스턴스 (필수)
  enableStickyHeader?: boolean;    // (false) 헤더 각 행 sticky 고정
  frozenColumns?: number;          // (미설정) 컬럼 고정 기능 on/off 스위치
  enableGroupToggle?: boolean;     // (false) 그룹 헤더 클릭 → 자식 컬럼 일괄 토글
}
```

`<MultiRowHeader>` 는 `table.getHeaderGroups()` 를 순회하여 헤더 행마다 `<tr>` 을, 각
헤더마다 `<th>` 를 렌더하는 `<thead>` 요소를 반환한다. 소비자가 직접 prop 으로 데이터나
컬럼을 넘기지 않으며, 입력은 이미 구성된 TanStack 테이블 인스턴스 하나다.

### 3.1 기본 렌더링 규칙

- **colSpan**: 그룹 헤더 셀의 가로 병합 폭은 `header.colSpan`(TanStack 자동 계산)을
  그대로 적용한다. 별도 계산 없음.
- **placeholder 셀**: 다단 헤더에서 leaf 컬럼 자리에 생기는 빈 셀(`header.isPlaceholder`)은
  내용 없는 `<th>` 로 렌더한다. flat 컬럼이 그룹 행에 나타날 때도 이 메커니즘으로
  자동 처리되므로 수동 rowSpan 계산이 없다.
- **정렬**: leaf 컬럼(`header.subHeaders.length === 0`)에만 정렬 토글 핸들러를 연결하고,
  정렬 가능 컬럼에는 `▲ / ▼ / ⇅` 표시와 `cursor-pointer hover:bg-gray-100` 을 적용한다.
  그룹 헤더 셀에는 정렬을 걸지 않는다.
- 셀 콘텐츠는 `flexRender(header.column.columnDef.header, header.getContext())` 로 렌더한다.

### 3.2 sticky 헤더 (`enableStickyHeader`)

`true` 일 때 다단 헤더 각 행을 세로 스크롤 시 뷰포트 상단에 고정한다.

- 행 0(최상단): `sticky top-0 z-10` (Tailwind).
- 행 N(N ≥ 1): `sticky z-10` + 인라인 `style.top = calc(var(--grid-header-row-height, 40px) * N)`.
  행 높이는 런타임/소비자 커스텀 값이므로 인라인 style 예외를 적용한다.
- CSS 변수 `--grid-header-row-height` 미정의 시 `40px` 로 fallback. 3단 이상이면 N 은
  rowIndex 값으로 자동 누적된다.
- prop 미설정 시 sticky 클래스가 전혀 붙지 않아 기본 동작이 그대로 보존된다(하위호환).

### 3.3 컬럼 고정 (`frozenColumns`)

가로 스크롤 시 왼쪽 고정 컬럼의 헤더 셀을 `sticky left` 로 붙인다.

> **중요 — `frozenColumns` 는 기능 on/off 스위치다.** 이 숫자 자체가 "앞 N개"를
> 선택하지 않는다. 활성 조건은 `(frozenColumns ?? 0) > 0` 이며, **실제로 어떤 컬럼이
> 고정되는지는 TanStack `columnPinning.left` 상태**(`column.getIsPinned() === 'left'`)에서
> 판정한다. 따라서 frozen 을 쓰려면 테이블 state 에 `columnPinning.left` 를 함께 설정해야 한다.

- left 오프셋(px): `column.getStart('left')` 를 인라인 `style.left` 로 적용(동적 px 값).
- **그룹 헤더 셀 fallback**: 그룹 셀은 여러 leaf 를 span 하므로 `getStart('left')` 가
  `undefined` 일 수 있다. 이 경우 첫 번째 leaf 자식의 `getStart('left')`(없으면 `0`)로
  fallback 한다.
- z-index: frozen + sticky 교차 셀 `z-30`, frozen 전용(sticky off) 셀 `z-20`.

### 3.4 그룹 일괄 토글 (`enableGroupToggle`)

`true` 일 때 그룹 헤더(non-leaf) 셀이 클릭 가능한 토글이 되어, 그 그룹의 모든 leaf 자식
컬럼 visibility 를 한 번에 켜고 끈다.

- 토글 로직: `header.column.getLeafColumns()` 로 자식 leaf 를 열거하고,
  모두 숨겨져 있으면(`every(c => !c.getIsVisible())`) 전부 보이게, 하나라도 보이면
  전부 숨긴다. 즉 **부분 표시 상태는 "접힘"으로 수렴**한다.
- 접힌 상태에서 그룹 헤더 셀 colSpan 은 1로 축소되고(`effectiveColSpan`),
  접힘/펼침 아이콘(`▶ / ▼`)을 표시한다. 그룹 헤더 자체는 항상 보인다.
- leaf 컬럼은 영향받지 않고 기존 정렬 핸들러를 유지한다. placeholder 셀에는 토글이
  붙지 않는다.
- prop 미설정 시 그룹 헤더 onClick 없음 + colSpan 은 TanStack 계산값 + 아이콘 없음으로
  기본 동작이 보존된다.

세 prop(`enableStickyHeader` / `frozenColumns` / `enableGroupToggle`)은 서로 독립적으로
적용되어 동시 사용 가능하다.

---

## 4. 핵심 설계 결정과 근거

### 4.1 TanStack placeholder 신뢰 — 수동 rowSpan 계산 없음
다단 헤더는 컬럼 트리(`GroupColumnDef`)를 정의하면 `getHeaderGroups()` 가 행 구조와
placeholder 셀, colSpan 을 자동 산출한다. flat 컬럼과 그룹 컬럼을 섞어도, 3단 이상으로
중첩해도 이 자동 처리로 동작한다. 따라서 렌더러는 `header.isPlaceholder` / `header.colSpan`
분기만 처리하고 직접 rowSpan 을 계산하지 않는다. 수동 계산은 hidden 컬럼·flat-only 같은
조합에서 불필요한 복잡도를 만든다.

### 4.2 명령형 헤더 조작 대신 선언적 컬럼 트리
헤더 행을 코드로 직접 push/merge 하는 명령형 방식과 달리, 본 모듈은 컬럼 정의 트리만
선언하고 행 구조 생성을 테이블 엔진에 위임한다. 이로써 정렬·컬럼 가시성·핀 고정 등 다른
테이블 상태와 헤더가 자연스럽게 통합된다(별도 동기화 코드 불필요).

### 4.3 컬럼 고정은 TanStack 네이티브 API로 자급
frozen 오프셋을 다른 패키지의 내부 유틸을 교차 import 해서 계산하지 않고,
`column.getStart('left')` 와 `column.getIsPinned()` 같은 TanStack 표준 API 만으로 패키지
내부에서 해결한다. 패키지 경계를 넘는 internal 의존을 피해 번들 분리와 결합도를 유지한다.
그룹 셀에서 `getStart` 가 undefined 인 경계는 첫 leaf 자식 오프셋 fallback 으로 메운다.

### 4.4 헤더 행 높이 CSS 변수 — 인라인 style 예외
sticky 헤더의 2번째 행 이후 `top` 오프셋은 런타임/소비자 커스텀 값이라 Tailwind 정적
클래스로 표현할 수 없다. 이를 위해 CSS 변수 `--grid-header-row-height`(기본 `40px`)를
도입하고 `calc(var(...) * N)` 인라인 style 로 적용한다. 소비자는 이 변수만 바꿔 헤더 행
높이를 조정할 수 있다.

### 4.5 그룹 토글 — `getLeafColumns()` + `toggleVisibility()`
그룹 접기/펼치기는 그룹별 별도 상태를 두지 않고, TanStack 표준 visibility 상태에 위임한다.
그룹의 leaf 자식을 열거해 일괄 `toggleVisibility()` 하며, "모두 숨김 여부"를 그룹 접힘
상태의 단일 진실로 삼는다. 부분 상태를 접힘으로 수렴시켜 토글 UX 를 단순·예측 가능하게
한다.

---

## 5. 라이선스 검증과 워터마크

본 패키지는 Pro 패키지로, `@topgrid/grid-license` 와 통합된다.

- **진입점 검증**: `index.ts` 가 import 평가 시점에 `checkLicense()` 를 호출한다(side-effect).
  `package.json` `sideEffects` 에 `index.ts` 를 명시해 이 호출이 보존된다.
- **헤더 워터마크**: `MultiRowHeader` 는 `useLicenseStatus()` 로 라이선스 상태를 조회한다.
  워터마크가 필요하고(`watermarkRequired`) 표시 중인 leaf 컬럼이 1개 이상이면, `<thead>`
  최상단에 `<tr><th colSpan={표시 leaf 수}><Watermark required /></th></tr>` 워터마크 행을
  prepend 한다. `enableStickyHeader` 가 켜져 있으면 이 행은 `sticky top-0 z-20` 로 고정된다.
- 라이선스 키 설정은 `@topgrid/grid-license` 의 `setLicenseKey('...')` 를 앱 진입점에서
  1회 호출한다. 유효 키가 없으면 위 워터마크가 표시된다.

> 라이선스 키 검증 방식(서명/만료 등) 자체는 `@topgrid/grid-license` 책임이며 본 모듈은
> 그 결과(워터마크 필요 여부)만 소비한다.

---

## 6. `GroupedHeaderGrid` — 레거시 별칭 (deprecated)

`MultiRowHeader` + `useReactTable` + tbody + pagination 을 하나로 묶은 자체 완결형 그리드
컴포넌트. `<table>` 한 개만으로 그룹 헤더 그리드를 쓸 수 있게 하는 하위호환 별칭이며,
신규 코드는 `useReactTable` + `MultiRowHeader` 조합을 직접 쓰는 것을 권장한다(`@deprecated`).
개발 환경에서는 deprecation 경고를 출력한다.

```ts
interface GroupedHeaderGridProps<TData = unknown> {
  data: TData[];
  columns: ColumnDef<TData>[];
  pagination?: GridPaginationOptions;        // 제공 시에만 페이지네이션 활성
  rowSelection?: GridRowSelectionOptions<TData>;  // 타입 노출만 — 현재 미연결
  onRowClick?: (row: TData, event: MouseEvent<HTMLTableRowElement>) => void;
  loading?: boolean;     // (false)
  emptyText?: string;    // ('데이터가 없습니다.')
  className?: string;    // ('')
  enableGroupToggle?: boolean;  // MultiRowHeader 의 그룹 토글로 전달
}
```

- `GridPaginationOptions` / `GridRowSelectionOptions` 타입은 `@topgrid/grid-core` 에서
  import 한다(역방향 의존을 만들지 않기 위해 외부 제품 패키지 타입을 재사용).
- 헤더는 `MultiRowHeader` 에 위임하고, tbody·pagination·loading 스피너·빈 상태는 컴포넌트가
  직접 렌더한다.
- **`rowSelection` 는 props 타입에만 존재하고 컴포넌트 본문에서 사용되지 않는다**(현재
  미연결 타입 표면). 행 선택 동작을 기대하면 안 된다.
- `pagination` 제공 시에만 `getPaginationRowModel` 을 조건부로 연결하고 페이지 컨트롤
  (`« ‹ › »`)을 렌더한다. 미제공 시 페이지네이션 비활성.
- `enableGroupToggle === true` 일 때만 그 prop 을 `MultiRowHeader` 로 조건부 전달한다
  (`exactOptionalPropertyTypes` 호환을 위한 conditional spread).

---

## 7. 엣지 케이스 동작 요약

| 시나리오 | 동작 |
|----------|------|
| 빈 그룹 (`columns: []`) | TanStack 표준 처리 — colSpan 0 그룹 셀은 렌더 스킵 |
| 3단 이상 중첩 그룹 | `getHeaderGroups()` 가 행 수만큼 반환, 자동 렌더 |
| 그룹 자식 전부 hidden | TanStack 이 colSpan 자동 collapse |
| flat 컬럼만 사용 | 단일 헤더 행 렌더, placeholder/rowSpan 계산 불필요 |
| `enableStickyHeader` 미설정 | sticky 클래스 없음, 기본 동작 보존 |
| `frozenColumns > 0` 이나 핀 상태 없음 | left 오프셋 적용 대상 없음(핀된 컬럼만 고정) |
| 그룹 셀이 frozen 경계 걸침 | 첫 leaf 자식 `getStart('left')` fallback 으로 left 결정 |
| `--grid-header-row-height` 미정의 | `40px` fallback |
| 그룹 토글 — 부분 표시 상태 | "접힘"(전체 숨김)으로 수렴 |
| 중첩 그룹 토글 | `getLeafColumns()` 가 최종 leaf 만 반환 → 최종 leaf 만 토글 |
| `enableGroupToggle` 미설정 | onClick 없음, colSpan TanStack 계산값, 아이콘 없음 |

---

## 8. 사용 예시

```tsx
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { setLicenseKey } from '@topgrid/grid-license';
import { MultiRowHeader, createColumnGroup } from '@topgrid/grid-pro-header';

setLicenseKey('YOUR-LICENSE-KEY'); // 앱 진입점에서 1회

const columns = [
  createColumnGroup({
    header: '인사정보',
    columns: [
      { accessorKey: 'name', header: '이름' },
      { accessorKey: 'dept', header: '부서' },
    ],
  }),
  { accessorKey: 'salary', header: '급여' },
];

function Grid({ data }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { columnPinning: { left: ['name'] } }, // frozen 사용 시 핀 상태 필요
  });

  return (
    <table>
      <MultiRowHeader table={table} enableStickyHeader frozenColumns={1} enableGroupToggle />
      {/* tbody 는 소비자가 직접 렌더 (또는 레거시 GroupedHeaderGrid 사용) */}
    </table>
  );
}
```

`MultiRowHeader` 는 `<thead>` 만 렌더한다 — tbody·pagination 까지 한 번에 필요하면
레거시 `GroupedHeaderGrid`(§6)를 쓰거나, `useReactTable` 결과로 직접 구성한다.
