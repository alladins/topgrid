# 다중 정렬 모듈 (Multi-Column Sorting)

여러 컬럼을 우선순위와 함께 동시에 정렬하는 기능. Shift+Click 으로 정렬 컬럼을
추가하고, 우선순위를 헤더 배지(①②③)로 표시하며, Ctrl/Cmd+Click 으로 개별 컬럼의
정렬을 해제한다. 정렬 컬럼 수를 제한하거나(`maxMultiSortColCount`) 전체 정렬을 한 번에
초기화하는 버튼(`SortClearButton`)도 제공한다.

- 패키지: 핵심 컴포넌트는 **`@topgrid/grid-core`**, 비-wrapper 소비자용 훅은
  **`@topgrid/grid-features`**.
- 라이선스: **MIT**.
- 의존: `react` / `@tanstack/react-table` 는 peer dependency. 새 외부 라이브러리 없음.
- 스타일: 모든 UI 는 Tailwind className 으로만 스타일링(C-5).
- 기반: 정렬 자체는 TanStack v8 `RowSorting` 기능에 위임한다. 다중 정렬 활성화 키는
  TanStack 표준인 Shift+Click 을 그대로 채택한다.

---

## 1. 사용 표면 — 가장 흔한 경로는 `<Grid>` prop

대부분의 소비자는 `@topgrid/grid-core` 의 `<Grid>` 에 prop 3개만 추가하면 된다.
표준 컴포넌트와 `useMultiSort` 훅은 `useReactTable` 을 직접 조립하는 비-wrapper
소비자를 위한 보조 경로다.

### 1.1 `<Grid>` prop (1차 표면)

| prop | 타입 | 기본값 | 의미 |
|------|------|--------|------|
| `enableMultiSort` | `boolean` | `false` | 다중 정렬 활성. TanStack `enableMultiSort` 에 위임 |
| `maxMultiSortColCount` | `number` | (무제한) | 동시 정렬 가능한 최대 컬럼 수. TanStack `maxMultiSortColCount` 에 직접 전달 |
| `showSortClearButton` | `boolean` | `false` | 툴바에 '정렬 초기화' 버튼 렌더. `enableMultiSort=true` 일 때만 표시 |

```tsx
import { Grid } from '@topgrid/grid-core';

// 기존 단일 정렬 그리드
<Grid data={rows} columns={columns} enableSort />

// 다중 정렬 활성 (opt-in prop 추가만, 무파괴)
<Grid
  data={rows}
  columns={columns}
  enableSort
  enableMultiSort
  maxMultiSortColCount={3}
  showSortClearButton
/>
// → Shift+Click 으로 컬럼 추가 정렬
// → 헤더에 ①②③ 우선순위 배지 자동 렌더
// → Ctrl/Cmd+Click 으로 해당 컬럼 정렬 제거
// → 최대 3개 컬럼까지만 유지(초과 시 가장 오래된 항목 제거)
// → 툴바에 '정렬 초기화' 버튼 표시
```

`enableMultiSort` 미지정 시 기존 단일 정렬 동작이 100% 보존된다. 세 prop 모두
opt-in 이며, 미설정 사용처의 DOM 구조에 변화를 주지 않는다.

### 1.2 헤더 상호작용 동작

`enableMultiSort=true` 인 그리드의 헤더 클릭은 다음 분기로 동작한다.

| 입력 | 동작 | 위임 호출 |
|------|------|-----------|
| Plain Click | 기존 단일 정렬(asc → desc → 해제 순환) | `column.getToggleSortingHandler()` |
| Shift+Click | 기존 정렬 유지하며 해당 컬럼을 추가 정렬 기준으로 | `column.toggleSorting(undefined, true)` |
| Ctrl/Cmd+Click | 해당 컬럼만 정렬에서 제거 | `table.setSorting(prev => prev.filter(s => s.id !== id))` |

- Ctrl(Windows)과 Cmd(Mac)를 모두 인식하기 위해 `e.ctrlKey || e.metaKey` 조건을 쓴다.
- Ctrl 분기를 Shift 분기보다 먼저 평가하므로, Shift+Ctrl+Click 동시 입력 시에는 제거가 우선한다.
- `enableMultiSort=false`(기본)일 때 헤더 클릭은 항상 단일 정렬 경로로만 흐른다.

---

## 2. 컴포넌트 / 훅 prop 계약

### 2.1 `SortBadge` — 우선순위 배지

```ts
interface SortBadgeProps {
  sortIndex: number;      // TanStack column.getSortIndex() 반환값
  className?: string;     // Tailwind className override
}

function SortBadge(props: SortBadgeProps): JSX.Element | null;
```

- 표시 번호 = `sortIndex + 1`(0-based index → 1-based 배지). 예: 첫 번째 정렬 기준 → ①.
- `sortIndex < 0`(= 미정렬) 이면 `null` 을 반환해 배지를 렌더하지 않는다.
- 마크업: `rounded-full` 원형 chip(`inline-flex ... w-4 h-4 text-[10px] font-bold bg-blue-500 text-white`).
- `<Grid>` 헤더 내부 렌더와 외부 공개 API 가 같은 단일 컴포넌트를 공유한다.

### 2.2 `SortClearButton` — 전체 정렬 초기화 버튼

```ts
interface SortClearButtonProps {
  onClear: () => void;    // required — 보통 () => table.setSorting([]) 연결
  label?: string;         // 버튼 레이블 (기본: '정렬 초기화')
  className?: string;     // Tailwind className override (지정 시 기본 클래스 대체)
}

function SortClearButton(props: SortClearButtonProps): JSX.Element;
```

- `<button type="button">` 로 렌더(폼 auto-submit 차단). 클릭 시 `onClear()` 호출.
- 정렬 해제 상태 자체는 컴포넌트가 소유하지 않는다. 호출자가 `onClear` 에
  `table.setSorting([])` 를 연결한다(상태는 그리드/테이블이 소유).
- 기본 스타일: `px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-100 text-gray-600`.
  `className` 을 주면 기본 클래스를 **대체**한다.
- `<Grid showSortClearButton enableMultiSort />` 사용 시 그리드 툴바(우측)에 자동 렌더된다.

### 2.3 `useMultiSort` — 비-wrapper 소비자용 옵션 헬퍼

```ts
interface UseMultiSortOptions {
  enableMultiSort?: boolean;       // default false
  maxMultiSortColCount?: number;   // 미설정 시 무제한
}

interface UseMultiSortResult {
  enableMultiSort: boolean;
  isMultiSortEvent: (e: unknown) => boolean;   // (e) => e.shiftKey 와 동등
  maxMultiSortColCount?: number;               // 설정값이 있을 때만 포함
}

function useMultiSort(opts?: UseMultiSortOptions): UseMultiSortResult;
```

- `useReactTable` 을 직접 사용하는 소비자가 다중 정렬 옵션을 구성할 때 쓴다.
  `<Grid enableMultiSort />` wrapper 사용자에게는 불필요하다(`<Grid>` 가 직접 처리).
- 반환값을 `useReactTable` 옵션에 spread 하면 `enableMultiSort` / `isMultiSortEvent` /
  (설정 시)`maxMultiSortColCount` 가 한 번에 전달된다.
- `isMultiSortEvent` 는 TanStack 내장 기본값과 동일한 `e.shiftKey` 판정을 명시적으로
  반환한다(문서화 목적). 이벤트가 객체이고 `shiftKey === true` 일 때만 `true`.
- `maxMultiSortColCount` 는 호출자가 값을 줄 때만 결과에 포함된다. 미설정 시 키 자체가
  빠지므로, spread 시 TanStack 에 `undefined` 가 전달되어 무제한 의미가 깨지는 일이 없다.

```tsx
import { useMultiSort, SortBadge } from '@topgrid/grid-core';
// (useMultiSort 는 @topgrid/grid-features 에서 import — 아래 §3 참고)
import { useMultiSort as useMS } from '@topgrid/grid-features';

const opts = useMS({ enableMultiSort: true, maxMultiSortColCount: 3 });
const table = useReactTable({
  data, columns, state: { sorting }, onSortingChange: setSorting,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  ...opts,    // enableMultiSort, isMultiSortEvent, maxMultiSortColCount
});
// 헤더 렌더 시: <SortBadge sortIndex={header.column.getSortIndex()} />
```

---

## 3. 패키지 토폴로지 — canonical vs 재export

핵심 정렬 기능이 형제 패키지에 의존하지 않도록, 컴포넌트의 정식(canonical) 정의는
`@topgrid/grid-core` 에 둔다. `@topgrid/grid-features` 는 비-wrapper 훅을 소유하고,
컴포넌트는 하위호환을 위해 deprecated 별칭으로 재export 한다(의존 방향은 항상
grid-features → grid-core 단방향).

| 심볼 | canonical 패키지 | grid-features 노출 |
|------|------------------|--------------------|
| `SortBadge` / `SortBadgeProps` | `@topgrid/grid-core` | deprecated 재export |
| `SortClearButton` / `SortClearButtonProps` | `@topgrid/grid-core` | deprecated 재export |
| `useMultiSort` / `UseMultiSortOptions` / `UseMultiSortResult` | `@topgrid/grid-features` | — (이 패키지가 소유) |

소비자 권장 import 경로:

- 컴포넌트·타입 4종(`SortBadge`, `SortBadgeProps`, `SortClearButton`,
  `SortClearButtonProps`) → `@topgrid/grid-core`.
- `useMultiSort` 와 그 옵션/결과 타입 → `@topgrid/grid-features`.
- `@topgrid/grid-features` 의 `SortBadge` / `SortClearButton`(및 두 Props 타입)은
  **deprecated 별칭**이며 차기 메이저에서 제거 예정이다.

`SortBadge` 의 구현 파일은 grid-core 내부 폴더에 있지만 패키지 index 에서 정식으로
export 되는 **공개 API** 다(폴더 위치로 인해 internal 로 오해하지 말 것).

---

## 4. 핵심 설계 결정과 근거

### 4.1 다중 정렬 활성 키 — TanStack 표준 Shift+Click 채택
다중 정렬 추가 키로 Shift+Click 을 쓴다. 이는 TanStack v8 `isMultiSortEvent` 의 내장
기본값(`e.shiftKey`)과 일치하므로 별도 override prop 없이 표준 동작을 그대로 노출할 수
있다. (다른 상용 그리드 중 일부는 Ctrl 을 기본 키로 쓰지만, 본 제품은 TanStack 표준을
따른다.)

### 4.2 TanStack 네이티브 옵션 직접 전달 — custom wrapper 회피
`enableMultiSort`, `isMultiSortEvent`, `maxMultiSortColCount` 처럼 TanStack 에 네이티브
옵션이 존재하고 값 변환 로직이 없는 경우, 별도 전처리 wrapper 없이 옵션을 그대로
전달한다. 특히 `maxMultiSortColCount` 의 정렬 개수 제한은 TanStack 런타임이 직접
처리하므로 자체 FIFO 전처리 코드가 불필요하다. 표준 옵션을 그대로 위임하면 동작 일관성과
번들 최소화에 유리하다.

### 4.3 컴포넌트 canonical 위치를 grid-core 로
정렬은 핵심 그리드 기능이므로, `<Grid>` 가 렌더하는 `SortBadge` / `SortClearButton` 의
정식 정의를 grid-core 에 둔다. 이렇게 하면 핵심 패키지가 기능 패키지(grid-features)에
역의존하지 않고 자기완결적으로 다중 정렬을 제공할 수 있다. grid-features 는 비-wrapper
훅(`useMultiSort`)을 소유하고 컴포넌트는 하위호환용 별칭으로만 노출한다.

### 4.4 `maxMultiSortColCount` 조건부 전달
옵션 객체에 `undefined` 를 직접 할당하지 않고 `props.maxMultiSortColCount !== undefined`
일 때만 할당한다(`exactOptionalPropertyTypes` 호환). 미설정 시 키 자체가 빠져 TanStack
기본값(무제한)이 그대로 적용된다. `options` 타입(`Omit<TableOptions, 'data'|'columns'>`)이
`SortingOptions` 를 경유해 `maxMultiSortColCount` 를 이미 포함하므로 타입 충돌이 없다.

### 4.5 `showSortClearButton` 의 `enableMultiSort` 가드
정렬 초기화 버튼은 `showSortClearButton === true && enableMultiSort === true` 조건에서만
렌더한다. 다중 정렬이 비활성이면 초기화 버튼이 의미가 없기 때문이다. 또한 버튼 블록을
컬럼 가시성 툴바와 분리된 별도 `<div>` 로 두어, 버튼 미사용 사용처의 기존 툴바 DOM 구조에
변화를 주지 않는다.

### 4.6 잘못된 조합에 대한 dev 경고
`enableMultiSort=true` 이지만 `enableSort` 가 설정되지 않은 경우, 정렬 자체가
연결되지 않아 다중 정렬이 무효가 된다. 이때 개발 모드(`NODE_ENV !== 'production'`)에서
마운트 시 1회 콘솔 경고를 내보내 설정 누락을 알린다(프로덕션에서는 침묵). no-op 동작
자체는 안전하므로 경고만 제공한다.

---

## 5. 엣지 케이스 동작 요약

| 입력 / 상태 | 동작 |
|-------------|------|
| `enableMultiSort` 미설정 + Shift+Click | 기존 단일 정렬로 덮어씀(다중 추가 안 됨). 기존 동작 보존 |
| 이미 정렬된 컬럼 Plain Click 반복 | asc → desc → 해제 순환(TanStack 기본) |
| Ctrl(Win) / Cmd(Mac) + Click | 양쪽 모두 해당 컬럼 정렬 제거(`ctrlKey || metaKey`) |
| Shift + Ctrl + Click 동시 | Ctrl(제거) 우선 — Shift 분기 미도달 |
| `getSortIndex()` 가 -1 인 헤더 | `SortBadge` 가 `null` 반환 → 배지 미렌더 |
| `maxMultiSortColCount` 초과 추가 | 가장 오래된 정렬 기준부터 제거(FIFO), 한도 유지 |
| `maxMultiSortColCount=1` | 사실상 단일 정렬(새 컬럼 Shift+Click 시 직전 컬럼 제거) |
| `maxMultiSortColCount` 미설정 | 무제한(TanStack 기본) |
| `showSortClearButton=true` + `enableMultiSort=false` | 버튼 미렌더(가드) |
| 정렬 0개 상태에서 '정렬 초기화' 클릭 | `setSorting([])` 호출(상태 변화 없는 no-op) |
| 가상화(`enableVirtualization=true`)와 병용 | 배지는 sticky thead 에 위치 → 행 가상화와 독립, 영향 없음 |
| 키보드(Space/Enter, Shift+Enter) | `getToggleSortingHandler` 가 키보드 이벤트도 처리. `shiftKey` 는 KeyboardEvent 에도 존재 |

---

## 6. 호환성

- **Breaking 없음**: `enableMultiSort` / `maxMultiSortColCount` / `showSortClearButton`
  모두 opt-in prop. 미지정 사용처의 동작·DOM 구조 변화 없음.
- **Deprecation**: `@topgrid/grid-features` 의 `SortBadge` / `SortClearButton`(및 두
  Props 타입) 별칭은 차기 메이저에서 제거 예정 — `@topgrid/grid-core` import 로 전환 권장.
- **새 외부 라이브러리 없음**: peer dependency(`react`, `@tanstack/react-table`) 외 추가 없음.
