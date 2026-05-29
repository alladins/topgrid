# MOD-GRID-09 / filter-ui / G-002 — NumberFilter Specification

**version**: 1.0.0  
**specDate**: 2026-05-14  
**rubricVersion**: v1.0.5  
**goalRef**: `.claude/tw-grid/goals/MOD-GRID-09/filter-ui-goals.json` §G-002  
**threshold**: 90 (migrationImpact: medium)

---

## D# Decision Log (Pre-writing Decisions)

| ID | 결정 | 근거 |
|----|------|------|
| D1 | C-28 Path Correction: goals.json `implementFiles` prefix `TOMIS/packages/grid-features/` → `topvel-grid-monorepo/packages/grid-features/` | C-28 적용. 실제 monorepo 위치: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/` (G-001 D1과 동일 패턴) |
| D2 | `filterFns.inNumberRange` **미채택** → 자체 `numberFilterFn` 구현 (7 operator 전부 커버) | `inNumberRange`는 between(범위) 전용. = / != / > / < / >= / <= 처리 불가. columnDef.filterFn은 컬럼당 단일 함수 — 런타임 swap 불가. `inNumberRange`는 semantics 참조(양끝 inclusive between) 전용; 실제 함수는 자체 구현으로 7 operator 분기 처리. 신규 dep 없음 (C-20) |
| D3 | operator 수 **7개** 확정: `=` / `!=` / `>` / `<` / `>=` / `<=` / `between` | AC-001이 권위적 출처 (goals.json §G-002 AC-001 열거 7개). Goal 제목 "=, !=, >, <, between"는 축약. |
| D4 | E-01 v1.0.6 바인딩: AC-007 Storybook → Section 7 `NumberFilter.stories.tsx` NEW 포함 | specify-rubric.md E-01: AC-007 바인딩 deliverable 파일 Section 7 필수 포함 |
| D5 | implementFiles **5개** 확정: NEW 2 + MODIFY 3 = 5 파일. NEW: NumberFilter.tsx + NumberFilter.stories.tsx. MODIFY: filterFns.ts + types.ts + index.ts | goals.json 3파일 미완; AC-007(Storybook) + Section 9(index.ts export) + C-28 경로 보정으로 5개 도출. G-01 v1.0.4 breakdown 의무: D# 합계 + 분류 + 파일명 모두 Section 7과 1:1 일치 필수 |
| D6 | `numberFilterFn.autoRemove` 정의: operator가 `between`일 때 `min === undefined && max === undefined` 또는 `(min == null \|\| isNaN(min)) && (max == null \|\| isNaN(max))`이면 true. 단항 operator는 `value === undefined \|\| isNaN(value as number)`이면 true | 빈 입력 시 필터 자동 해제 (D5 G-001 패턴 동일 적용). null-safe + NaN-safe |
| D7 | G-001 FilterPopover + FilterIndicator **그대로 재사용** — 별도 Popover 구현 없음 (AC-004 DRY) | FilterPopover.tsx 구현 확인 (align prop, trigger/children 인터페이스). FilterIndicator.tsx 확인 (isFiltered: boolean). 두 컴포넌트 모두 이미 index.ts에 export됨 |
| D8 | `dependsOn` 보완: MOD-GRID-09/G-001 추가 | FilterPopover/FilterIndicator/filterFns.ts 재사용 패턴이 G-001 구현에 의존함 |
| D9 | `between` 조건부 렌더: `operator === 'between'` 일 때 min/max 두 `<input type="number">` 렌더. 기타 연산자는 단일 `value` input. Tailwind 전용 (C-5) | AC-003 요건. TanStack between semantics: min <= cell <= max (inNumberRange 동일) |
| D10 | 입력 디바운스: 300ms — G-001 TextFilter와 동일 패턴 | NumberFilter 내부 로컬 state: `inputValue` (단항), `minValue`/`maxValue` (between). useEffect + setTimeout(300ms). 외부 dep 없음 |
| D11 | cell value null-safe: `rawCell == null` → `false`. NaN-safe: `Number(rawCell)`이 NaN이면 `false` (단, `numberFilterFn`에서 처리) | 숫자 컬럼에 string/null/undefined가 섞일 수 있음 (방어적 처리) |

---

## Section 1 — Goal Summary

| 항목 | 내용 |
|------|------|
| goalId | G-002 |
| title | NumberFilter — 연산자(=, !=, >, <, >=, <=, between) + range 입력 |
| moduleId | MOD-GRID-09 |
| area | filter-ui |
| priority | P0 |
| migrationImpact | medium |
| licenseTier | MIT |
| packageTarget | packages/grid-features (D1 보정: topvel-grid-monorepo/packages/grid-features) |
| dependsOn | MOD-GRID-01/G-001, MOD-GRID-02/G-001, **MOD-GRID-09/G-001** (D8 — FilterPopover/FilterIndicator 재사용) |
| breaking | false |
| affectedUsageFiles | [] (신규 기능, 기존 사용처 없음) |
| bundleImpact | +2 KB gzip 이하 (NumberFilter 컴포넌트 + numberFilterFn 추가분만. FilterPopover/FilterIndicator는 G-001에서 이미 포함) |

**User Story**: 사용자가 숫자 컬럼 헤더의 필터 아이콘을 클릭하면 Popover(G-001 FilterPopover 재사용)가 열리고, '같음(=)/다름(!=)/초과(>)/미만(<)/이상(>=)/이하(<=)/사이(between)' 연산자를 선택한다. 단항 연산자 선택 시 숫자 값 1개를 입력하고, 'between' 선택 시 min/max 두 입력 필드가 표시된다. 값 입력 시 그리드가 즉시 필터링되고 헤더에 활성 인디케이터(G-001 FilterIndicator 재사용)가 표시된다.

**TanStack `filterFns.inNumberRange` 결정 (D2)**: TanStack 내장 `filterFns.inNumberRange`는 between(범위) 전용 함수이며 = / != / > / < 등 단항 연산자 처리 불가. 하나의 `columnDef.filterFn`으로 7 operator 전부를 분기 처리하기 위해 자체 `numberFilterFn`을 구현한다. `inNumberRange`의 both-inclusive semantics(`min <= cell <= max`)는 between 구현 시 참조한다.

---

## Section 2 — Acceptance Criteria

| AC ID | 기준 | Source | 충족 방법 |
|-------|------|--------|----------|
| AC-001 | `NumberFilterValue` 타입 `{ operator: '=' \| '!=' \| '>' \| '<' \| '>=' \| '<=' \| 'between', value?: number, min?: number, max?: number }` — `column.setFilterValue` / `column.getFilterValue` 사용 (TanStack columnFilters 표준 — C-2, no any — C-4) | C-4 | `types.ts`에 타입 정의; `NumberFilter.tsx`에서 `Column<TData, unknown>` 제네릭 사용, `any` 금지 |
| AC-002 | 커스텀 `numberFilterFn` 등록 — 7 operator 분기 처리, `between`은 `min <= cell <= max` (양끝 inclusive, inNumberRange semantics 참조 — D2), null-safe + NaN-safe (D6, D11) | C-2 | `filterFns.ts`에 `numberFilterFn` 추가 (MODIFY); `columnDef.filterFn: numberFilterFn` 직접 참조 방식 |
| AC-003 | `between` 연산자 선택 시 min/max 두 `<input type="number">` 조건부 렌더. 기타 연산자는 단일 value input. Tailwind 전용 (C-5). | C-5 | `NumberFilter.tsx`에서 `operator === 'between'` 분기 렌더 (D9) |
| AC-004 | G-001 `FilterPopover` 재사용 — 별도 Popover 구현 없음 (DRY, D7) | L1 | `import { FilterPopover } from './FilterPopover'`; `FilterPopoverProps` 그대로 사용 |
| AC-005 | 활성 필터 인디케이터 — G-001 `FilterIndicator` 재사용 (`column.getIsFiltered()` 기반 파란 dot) | C-5 | `import { FilterIndicator } from './FilterIndicator'`; `isFiltered={column.getIsFiltered()}` |
| AC-006 | C-12: `tsc --noEmit` 0 error. C-29 `exactOptionalPropertyTypes` 대응 spread-skip 패턴 적용 | C-12 | `NumberFilterProps` optional prop 전달 시 C-29 패턴 적용 |
| AC-007 | C-25: Storybook story 1개 (`NumberFilter.stories.tsx`) — `between` 시나리오 포함 (D4) | C-25 | `filter-ui/NumberFilter.stories.tsx` (NEW, E-01 v1.0.6 바인딩) |

---

## Section 3 — Non-Functional Requirements

| 항목 | 요건 |
|------|------|
| 번들 크기 | +2 KB gzip 이하 (NumberFilter.tsx + numberFilterFn 추가분). FilterPopover/FilterIndicator는 G-001 +4KB에 포함됨. grid-core 패키지 무영향 (C-21) |
| TypeScript | `strict: true`, `exactOptionalPropertyTypes: true`, `noImplicitAny: true` — tsconfig.base.json 상속 (C-4, C-12) |
| 스타일 | Tailwind CSS 클래스 전용 (C-5). `style={{ }}` 인라인 스타일 금지 |
| 접근성 | 필터 아이콘 버튼: `aria-label="숫자 필터"`, `aria-pressed={column.getIsFiltered()}`. 연산자 select: `aria-label="연산자"`. value input: `aria-label="필터 값"` (between 시 min: `aria-label="최솟값"`, max: `aria-label="최댓값"`) |
| 신규 의존성 | 없음 (C-20 ADR 불필요). 기존 peerDependencies만 사용: `@tanstack/react-table ^8.0.0`, `react ^18\|\|^19` |
| 성능 | 입력 디바운스 300ms (D10). `column.setFilterValue` 호출은 디바운스 후에만 발생 |
| 호환성 | G-001 `FilterPopover`/`FilterIndicator` 인터페이스 변경 없음. `@tanstack/react-table@^8.0.0` peerDep 동일 |

---

## Section 4 — Design Decisions

### 4.1 FilterPopover 재사용 전략 (D7, AC-004)

G-001에서 구현한 `FilterPopover` (네이티브 div position:absolute, 외부클릭/Escape/포커스 관리, `z-[50]`) 그대로 재사용.

```
NumberFilter
├── <FilterIndicator isFiltered={column.getIsFiltered()} />   ← G-001 재사용
└── <FilterPopover
        trigger={<button aria-label="숫자 필터" aria-pressed={column.getIsFiltered()}>
                   <FunnelIcon />
                 </button>}
        {...(popoverAlign !== undefined ? { align: popoverAlign } : {})}   ← C-29 spread-skip
      >
      ┌─ Popover content
      │  ├── <select aria-label="연산자"> (7 options)
      │  ├── [단항 연산자] <input type="number" aria-label="필터 값" />
      │  ├── [between] <input type="number" aria-label="최솟값" />
      │  ├── [between] <input type="number" aria-label="최댓값" />
      │  └── <button onClick={() => column.setFilterValue(undefined)}>초기화</button>
      └─
```

`FilterPopover`의 `aria-label="텍스트 필터"`는 G-001 구현 확인 결과 팝오버 div에 `role="dialog" aria-label="텍스트 필터"` 적용됨. NumberFilter에서는 `aria-label`을 prop으로 오버라이드할 수 없으므로 `FilterPopover`를 그대로 사용하되, 내용 컨텍스트로 충분함.

### 4.2 NumberFilterValue 타입 설계 (AC-001, D3)

```typescript
// types.ts — MODIFY
export type NumberFilterOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'between';

export interface NumberFilterValue {
  operator: NumberFilterOperator;
  /** 단항 연산자(=, !=, >, <, >=, <=)용 값. between 시 undefined. */
  value?: number;
  /** between: 하한값 (min <= cell). */
  min?: number;
  /** between: 상한값 (cell <= max). */
  max?: number;
}
```

`column.setFilterValue(v: NumberFilterValue | undefined)` — `undefined`는 필터 해제.

### 4.3 numberFilterFn 구현 전략 (AC-002, D2, D6, D11)

TanStack 내장 `filterFns.inNumberRange`는 between 전용 — 단항 operator 처리 불가 (D2 결정).  
자체 `numberFilterFn` 구현:

```typescript
// filterFns.ts — MODIFY (numberFilterFn 추가)
export const numberFilterFn: FilterFn<unknown> = <TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: NumberFilterValue,
): boolean => {
  const rawCell: unknown = row.getValue(columnId);
  if (rawCell == null) return false;
  const cell = Number(rawCell);
  if (isNaN(cell)) return false;

  const { operator, value, min, max } = filterValue;

  switch (operator) {
    case '=':  return value !== undefined && !isNaN(value) ? cell === value : true;
    case '!=': return value !== undefined && !isNaN(value) ? cell !== value : true;
    case '>':  return value !== undefined && !isNaN(value) ? cell > value : true;
    case '<':  return value !== undefined && !isNaN(value) ? cell < value : true;
    case '>=': return value !== undefined && !isNaN(value) ? cell >= value : true;
    case '<=': return value !== undefined && !isNaN(value) ? cell <= value : true;
    case 'between': {
      const minOk = min !== undefined && !isNaN(min) ? cell >= min : true;
      const maxOk = max !== undefined && !isNaN(max) ? cell <= max : true;
      return minOk && maxOk;
    }
    default: {
      const _exhaustive: never = operator;
      return _exhaustive;
    }
  }
};
```

`autoRemove` (D6):
```typescript
numberFilterFn.autoRemove = (val: NumberFilterValue | undefined): boolean => {
  if (!val) return true;
  if (val.operator === 'between') {
    return (val.min === undefined || isNaN(val.min as number)) &&
           (val.max === undefined || isNaN(val.max as number));
  }
  return val.value === undefined || isNaN(val.value as number);
};
```

### 4.4 동작 정의 Truth Table 입력 (C-30 — Section 5 참조)

| operator | 필요 필드 | between semantics | null-safe | NaN-safe |
|----------|----------|-------------------|-----------|----------|
| `=` | `value` | — | cell==null → false | NaN → false |
| `!=` | `value` | — | cell==null → false | NaN → false |
| `>` | `value` | — | cell==null → false | NaN → false |
| `<` | `value` | — | cell==null → false | NaN → false |
| `>=` | `value` | — | cell==null → false | NaN → false |
| `<=` | `value` | — | cell==null → false | NaN → false |
| `between` | `min`, `max` | min<=cell<=max (양끝 inclusive — inNumberRange 참조, D2) | cell==null → false | NaN → false |

### 4.5 조건부 렌더 전략 (AC-003, D9)

`operator === 'between'`이면 min/max 두 input 렌더; 나머지는 단일 value input.

```tsx
{operator === 'between' ? (
  <>
    <input type="number" aria-label="최솟값" value={minValue ?? ''} onChange={...} className="..." />
    <span className="text-xs text-gray-400">~</span>
    <input type="number" aria-label="최댓값" value={maxValue ?? ''} onChange={...} className="..." />
  </>
) : (
  <input type="number" aria-label="필터 값" value={inputValue ?? ''} onChange={...} className="..." />
)}
```

### 4.6 디바운스 (D10)

```typescript
// 단항 연산자
const [inputValue, setInputValue] = useState<string>('');
useEffect(() => {
  const timer = setTimeout(() => {
    const num = parseFloat(inputValue);
    if (inputValue === '' || isNaN(num)) {
      column.setFilterValue(undefined);
    } else {
      column.setFilterValue({ operator, value: num });
    }
  }, 300);
  return () => clearTimeout(timer);
}, [inputValue, operator]);

// between
const [minValue, setMinValue] = useState<string>('');
const [maxValue, setMaxValue] = useState<string>('');
useEffect(() => {
  if (operator !== 'between') return;
  const timer = setTimeout(() => {
    const min = parseFloat(minValue);
    const max = parseFloat(maxValue);
    const hasMin = minValue !== '' && !isNaN(min);
    const hasMax = maxValue !== '' && !isNaN(max);
    if (!hasMin && !hasMax) {
      column.setFilterValue(undefined);
    } else {
      column.setFilterValue({
        operator: 'between',
        ...(hasMin ? { min } : {}),
        ...(hasMax ? { max } : {}),
      });
    }
  }, 300);
  return () => clearTimeout(timer);
}, [minValue, maxValue, operator]);
```

### 4.7 C-29 exactOptionalPropertyTypes 패턴

`NumberFilter`의 optional prop `popoverAlign?: 'left' | 'right'`를 `FilterPopover`의 `align` prop으로 전달 시:

```typescript
// 올바른 방법 (C-29 spread-skip 패턴)
<FilterPopover
  trigger={triggerEl}
  {...(popoverAlign !== undefined ? { align: popoverAlign } : {})}
>
  {content}
</FilterPopover>
```

---

## Section 5 — Truth Table (C-30)

### 5.1 numberFilterFn 동작 (7 연산자 × 주요 케이스)

| operator | value/min/max | cell | expected | 비고 |
|----------|---------------|------|----------|------|
| `=` | value=100 | 100 | true | 정확 일치 |
| `=` | value=100 | 99 | false | |
| `=` | value=undefined | 50 | true | 값 미입력 → 통과 (autoRemove에 의존) |
| `!=` | value=100 | 99 | true | |
| `!=` | value=100 | 100 | false | |
| `>` | value=50 | 51 | true | |
| `>` | value=50 | 50 | false | 경계값 미포함 |
| `>` | value=50 | 49 | false | |
| `<` | value=50 | 49 | true | |
| `<` | value=50 | 50 | false | 경계값 미포함 |
| `>=` | value=50 | 50 | true | 경계값 포함 |
| `>=` | value=50 | 49 | false | |
| `<=` | value=50 | 50 | true | 경계값 포함 |
| `<=` | value=50 | 51 | false | |
| `between` | min=10, max=20 | 10 | true | 하한 포함 (inclusive) |
| `between` | min=10, max=20 | 20 | true | 상한 포함 (inclusive) |
| `between` | min=10, max=20 | 15 | true | 범위 내 |
| `between` | min=10, max=20 | 9 | false | 하한 미만 |
| `between` | min=10, max=20 | 21 | false | 상한 초과 |
| `between` | min=10, max=undefined | 15 | true | max 미입력 → min 이상만 검사 |
| `between` | min=undefined, max=20 | 15 | true | min 미입력 → max 이하만 검사 |
| `between` | min=undefined, max=undefined | — | — (autoRemove) | 둘 다 미입력 → 필터 해제 |
| any | — | null | false | null-safe |
| any | — | undefined | false | null-safe |
| any | — | "abc" | false | NaN-safe (Number("abc")=NaN) |

### 5.2 FilterIndicator 렌더 조건 (G-001 재사용 — 변경 없음)

| column.getIsFiltered() | 인디케이터 dot 렌더 |
|------------------------|---------------------|
| true | 렌더 (Tailwind: `w-2 h-2 rounded-full bg-blue-500`) |
| false | 렌더 없음 (`null` 반환) |

### 5.3 조건부 input 렌더 조건

| operator | 렌더되는 input 필드 |
|----------|---------------------|
| `=` / `!=` / `>` / `<` / `>=` / `<=` | 단일 `value` input |
| `between` | `min` input + `max` input 두 개 |

### 5.4 autoRemove 조건

| operator | autoRemove=true 조건 |
|----------|----------------------|
| `=` / `!=` / `>` / `<` / `>=` / `<=` | `value === undefined` 또는 `isNaN(value)` |
| `between` | `(min === undefined \|\| isNaN(min)) && (max === undefined \|\| isNaN(max))` |
| 전체 | `filterValue === undefined` |

---

## Section 6 — Edge Cases (≥3)

### EC-01: `between` min > max 역전 입력

사용자가 `min=100, max=50`을 입력한 경우.  
**처리**: `numberFilterFn`에서 `min <= cell && cell <= max`가 되어 결과적으로 어떤 행도 통과하지 못함(예: cell=75 → 100<=75=false). 이는 논리적으로 올바름 — UI에서 역전 경고는 이 Goal 범위 밖.  
**결과**: 필터 적용됨, 0행 표시.

### EC-02: NaN 입력 (예: 문자열 혼입 cell 값)

숫자 컬럼에 `"N/A"`, `""`, `null`, `undefined` 같은 비숫자 값이 포함된 경우.  
**처리**: `Number(rawCell)` → `NaN` → `isNaN(cell)` → `return false` (D11 적용).  
**결과**: 해당 행은 항상 필터에서 제외됨. 사용자에게 보이지 않는 행.

### EC-03: operator 변경 시 기존 value 상태 초기화

사용자가 `=` 연산자로 `value=100` 입력 후 `between`으로 전환한 경우.  
**처리**: `NumberFilter.tsx` 내 `operator` state 변경 시 `setInputValue('')`, `setMinValue('')`, `setMaxValue('')` 초기화 + `column.setFilterValue(undefined)` 즉시 호출 (필터 해제).  
**결과**: operator 전환 시 clean state 보장.

### EC-04: `between` 단일 bound만 입력

`min=10`, `max` 미입력 또는 `max=undefined` 케이스.  
**처리**: D6 `autoRemove` 조건에서 `hasMin || hasMax`가 true이면 `setFilterValue({ operator: 'between', min: 10 })` 호출. `numberFilterFn`에서 max가 없으면 `cell >= min`만 검사 (Section 4.3 코드 참조).  
**결과**: 단방향 범위 필터로 동작.

### EC-05: `type="number"` input에서 e/E/+/- 입력

브라우저 기본 `<input type="number">`는 e, E, +, - 문자를 허용.  
**처리**: `parseFloat` 결과가 유효한 숫자이면 사용, 아니면 `undefined`로 처리 (D10 디바운스 로직). 예: `parseFloat("1e2")` = 100 → 허용.  
**결과**: 지수 표기는 그대로 파싱. 불필요하면 `onKeyDown` 이벤트로 차단 가능 (이 Goal 범위 외 — 향후 개선).

---

## Section 7 — Implementation Files

| # | 파일 경로 | 상태 | 역할 |
|---|-----------|------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/src/filter-ui/NumberFilter.tsx` | NEW | 메인 컴포넌트 (연산자 select + 조건부 input + clear + debounce 300ms) |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/src/filter-ui/filterFns.ts` | MODIFY | `numberFilterFn` 추가 (7 operator 분기 + autoRemove) |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/src/filter-ui/types.ts` | MODIFY | `NumberFilterOperator`, `NumberFilterValue`, `NumberFilterProps` 타입 추가 |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/src/index.ts` | MODIFY | `NumberFilter`, `numberFilterFn`, 타입 4종 추가 export |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/src/filter-ui/NumberFilter.stories.tsx` | NEW | Storybook story (between 시나리오 포함) — AC-007, E-01 v1.0.6 |

**Path correction (D1, D5)**: goals.json `TOMIS/packages/grid-features/` → `topvel-grid-monorepo/packages/grid-features/` 보정 완료.  
**D5 확정**: NEW 2 + MODIFY 3 = 5 파일. NEW: NumberFilter.tsx + NumberFilter.stories.tsx. MODIFY: filterFns.ts + types.ts + index.ts.

---

## Section 8 — TypeScript Interface Contract

```typescript
// filter-ui/types.ts — MODIFY: 아래 타입 추가 (기존 TextFilter* 타입 유지)

/** 숫자 필터 연산자. 7종. */
export type NumberFilterOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'between';

/**
 * TanStack columnFilters에 저장되는 NumberFilter 값.
 * `column.setFilterValue(v: NumberFilterValue | undefined)` 로 설정.
 * - 단항 연산자: `value` 사용, `min`/`max` undefined.
 * - `between`: `min`/`max` 사용, `value` undefined.
 * - undefined = 필터 해제.
 */
export interface NumberFilterValue {
  operator: NumberFilterOperator;
  /** 단항 연산자용 값 (=, !=, >, <, >=, <=). between 시 미사용. */
  value?: number;
  /** between 하한값 (min <= cell). */
  min?: number;
  /** between 상한값 (cell <= max). */
  max?: number;
}

/**
 * NumberFilter 컴포넌트 Props.
 *
 * @template TData - TanStack Row data 타입.
 * C-4: Column<TData, unknown> — cell value 타입 unknown (any 방지).
 * C-29: optional prop spread-skip 패턴 적용 (defaultOperator, popoverAlign).
 */
export interface NumberFilterProps<TData> {
  /** TanStack Column 인스턴스. Column<TData, unknown>. */
  column: Column<TData, unknown>;
  /**
   * 기본 연산자 — 기본 '='.
   * C-29: optional prop.
   */
  defaultOperator?: NumberFilterOperator;
  /**
   * 팝오버 정렬 — 기본 'left'.
   * C-29: optional prop — FilterPopover align으로 spread-skip 전달.
   */
  popoverAlign?: 'left' | 'right';
}
```

```typescript
// filter-ui/filterFns.ts — MODIFY: numberFilterFn 추가 (textFilterFn 유지)

import type { FilterFn, Row } from '@tanstack/react-table';
import type { NumberFilterValue } from './types';

export const numberFilterFn: FilterFn<unknown> = <TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: NumberFilterValue,
): boolean => {
  // (Section 4.3 전체 구현 참조)
};

numberFilterFn.autoRemove = (val: NumberFilterValue | undefined): boolean => {
  // (Section 4.3 autoRemove 구현 참조)
};
```

```typescript
// index.ts — MODIFY: 아래 라인 추가 (기존 TextFilter exports 유지)
export { NumberFilter } from './filter-ui/NumberFilter';
export { numberFilterFn } from './filter-ui/filterFns';  // textFilterFn 기존 export 유지 + 추가
export type {
  NumberFilterOperator,
  NumberFilterValue,
  NumberFilterProps,
} from './filter-ui/types';
```

---

## Section 9 — index.ts Export Plan

`packages/grid-features/src/index.ts` MODIFY — 기존 G-001(TextFilter*) + MOD-GRID-07 + MOD-GRID-08 exports 유지, G-002 항목 추가:

```typescript
// 기존 exports (G-001 textFilterFn 라인 포함 — 유지)
// ...

// MOD-GRID-09: filter-ui — NumberFilter (G-002 추가)
export { NumberFilter } from './filter-ui/NumberFilter';
// numberFilterFn: 기존 filterFns.ts re-export에 포함됨
// (filterFns.ts에서 textFilterFn과 numberFilterFn 모두 export)
export type {
  NumberFilterOperator,
  NumberFilterValue,
  NumberFilterProps,
} from './filter-ui/types';
```

현재 `index.ts` L32 `export { textFilterFn } from './filter-ui/filterFns'` 라인은 유지됨 — `filterFns.ts` MODIFY 후 `textFilterFn` + `numberFilterFn` 둘 다 named export. index.ts에서는 `numberFilterFn`도 별도 export 추가:

```typescript
export { numberFilterFn } from './filter-ui/filterFns';
```

---

## Section 10 — Component Render Tree

```
<th> (header cell, app layer)
├── <span> column header label </span>
└── <NumberFilter column={column}>
    ├── <FilterIndicator isFiltered={column.getIsFiltered()} />   ← G-001 재사용
    └── <FilterPopover
            trigger={<button aria-label="숫자 필터" aria-pressed={column.getIsFiltered()}>
                       <FunnelIcon />
                     </button>}
            {...(popoverAlign !== undefined ? { align: popoverAlign } : {})}
          >
          ┌─ Popover content (div[role="dialog"])
          │  ├── <select aria-label="연산자">
          │  │   ├── <option value="=">같음 (=)</option>
          │  │   ├── <option value="!=">다름 (≠)</option>
          │  │   ├── <option value=">">초과 (>)</option>
          │  │   ├── <option value="<">미만 (<)</option>
          │  │   ├── <option value=">=">이상 (≥)</option>
          │  │   ├── <option value="<=">이하 (≤)</option>
          │  │   └── <option value="between">사이 (between)</option>
          │  │
          │  ├── [단항 연산자] <input type="number" aria-label="필터 값" />
          │  │
          │  ├── [between] <input type="number" aria-label="최솟값" />
          │  ├── [between] <span className="...">~</span>
          │  ├── [between] <input type="number" aria-label="최댓값" />
          │  │
          │  └── <button onClick={() => column.setFilterValue(undefined)}>초기화</button>
          └─
```

**FunnelIcon**: `@heroicons/react` 또는 SVG inline — G-001 TextFilter와 동일 아이콘 패턴 사용.

---

## Section 11 — Constraints Checklist

| 제약 | 항목 | 적용 여부 | 비고 |
|------|------|----------|------|
| C-1 | Read before write | ✅ | 모든 참조 파일 사전 읽기: types.ts, filterFns.ts, FilterPopover.tsx, FilterIndicator.tsx, index.ts |
| C-2 | TanStack 표준 API만 | ✅ | column.setFilterValue, getIsFiltered, FilterFn 타입. inNumberRange 참조만 (D2) |
| C-4 | no any | ✅ | Column<TData, unknown>, FilterFn<unknown>, `any` 금지 |
| C-5 | Tailwind CSS only | ✅ | 인라인 스타일 없음. `type="number"` input + select + button 모두 Tailwind |
| C-7 | AG Grid 신규 도입 금지 | ✅ N/A | AG Grid 코드 없음 |
| C-12 | tsc --noEmit 0 error | ✅ | C-29 spread-skip 패턴 적용 (Section 4.7) |
| C-16 | Wijmo 비도입 | ✅ N/A | Wijmo 코드 없음 |
| C-20 | 신규 dep ADR 의무 | ✅ | 신규 dep 없음 (D2 결정) |
| C-21 | 번들 한도 | ✅ | +2 KB 목표, grid-core 무영향 |
| C-22 | peerDeps 변경 없음 | ✅ | 기존 peerDeps 유지 |
| C-25 | Storybook story | ✅ | NumberFilter.stories.tsx (D4, AC-007) |
| C-28 | Path prefix 보정 | ✅ | D1: topvel-grid-monorepo 경로 사용 |
| C-29 | exactOptionalPropertyTypes | ✅ | Section 4.7 spread-skip 패턴 명시 |
| C-30 | Truth table | ✅ | Section 5.1 (7 연산자 × 주요 케이스) |
| C-31 | Functional Wiring Audit | ✅ | `numberFilterFn`은 `filterFns.ts`에서 export; `index.ts`에서 re-export (Section 9). 사용처 wiring은 columnDef.filterFn 지정 (Section 12 사용 예시) |

**N/A 항목**: A-03 (현 구현 없음 — 신규 기능), A-04 (migration path N/A — 신규 기능), C-05 (no Pro license — MIT tier), D-02 (no deprecation — new feature), D-04 (no migration path), F-02 (no Pro/Enterprise license verification)

---

## Section 12 — Usage Example (Consumer Code)

### 예시 1: 기본 사용 — 숫자 컬럼에 `=` 연산자 기본값으로 NumberFilter 적용

```typescript
// app layer: BaseGrid column 정의 예시 — 기본 단항 필터
import {
  NumberFilter,
  numberFilterFn,
} from '@tomis/grid-features';
import type { NumberFilterValue } from '@tomis/grid-features';
import { createColumnHelper } from '@tanstack/react-table';

interface Product {
  id: number;
  name: string;
  price: number;   // 숫자 컬럼
  stock: number;
}

const columnHelper = createColumnHelper<Product>();

const columns = [
  columnHelper.accessor('price', {
    header: ({ column }) => (
      <div className="flex items-center gap-1">
        <span>가격</span>
        {/* defaultOperator 기본값 '=' — 가격은 정확 일치 필터가 적합 */}
        <NumberFilter column={column} defaultOperator="=" />
      </div>
    ),
    filterFn: numberFilterFn,
    // BaseGrid.tsx의 columnFilters state + getFilteredRowModel()이 이미 존재
    // (G-001 Section 6.1 확인 — 추가 wiring 불필요)
  }),
  columnHelper.accessor('stock', {
    header: ({ column }) => (
      <div className="flex items-center gap-1">
        <span>재고</span>
        {/* 재고는 이상(>=) 필터가 자주 사용됨 */}
        <NumberFilter column={column} defaultOperator=">=" />
      </div>
    ),
    filterFn: numberFilterFn,
  }),
];
```

### 예시 2: 고급 사용 — `between` 연산자로 가격 범위 필터 + 인디케이터 별도 표시

```typescript
// advanced: between + FilterIndicator 분리 사용 + popoverAlign 지정
import {
  NumberFilter,
  numberFilterFn,
  FilterIndicator,
} from '@tomis/grid-features';
import type { NumberFilterValue } from '@tomis/grid-features';
import { createColumnHelper } from '@tanstack/react-table';

interface OrderItem {
  orderId: number;
  amount: number;      // 금액 컬럼
  quantity: number;    // 수량 컬럼
}

const columnHelper = createColumnHelper<OrderItem>();

const columns = [
  columnHelper.accessor('amount', {
    header: ({ column }) => (
      <div className="flex items-center gap-1">
        <span>금액</span>
        {/* FilterIndicator: column.getIsFiltered() 기반 파란 dot */}
        <FilterIndicator isFiltered={column.getIsFiltered()} />
        {/* between 기본 연산자, 우측 정렬 팝오버 */}
        <NumberFilter
          column={column}
          defaultOperator="between"
          popoverAlign="right"
        />
      </div>
    ),
    filterFn: numberFilterFn,
  }),
];

// UX 시나리오 (between):
// 1. "금액" 헤더 필터 아이콘 클릭 → Popover 열림 (G-001 FilterPopover 재사용)
// 2. 연산자 "사이(between)" 기본 선택 상태
// 3. 최솟값 input에 10000 입력 → 300ms 디바운스 후 min=10000 적용
// 4. 최댓값 input에 50000 입력 → 300ms 디바운스 후 max=50000 적용
//    → setFilterValue({ operator: 'between', min: 10000, max: 50000 })
// 5. FilterIndicator 파란 dot 활성화 (column.getIsFiltered() === true)
// 6. "초기화" 버튼 → column.setFilterValue(undefined) → dot 사라짐
// 7. Escape → Popover 닫힘 + 필터 아이콘에 포커스 복귀

// C-29: optional prop 전달 시 spread-skip 패턴
// const alignProp = userAlign !== undefined ? { popoverAlign: userAlign } : {};
// <NumberFilter column={column} {...alignProp} />
```

---

## Section 13 — Commercial Impact

| 항목 | 내용 |
|------|------|
| 패키지 대상 | `packages/grid-features` (MIT tier — grid-features, `topvel-grid-monorepo/packages/grid-features`) |
| 라이선스 | MIT. Pro license verification 불필요 (F-02 N/A) |
| AG Grid 동등 | AG Grid Community `NumberFilterModule` — 동등 7 operator 제공 (ag-grid-feature-matrix.md §1 §3) |
| Wijmo 동등 | Wijmo Filtering (text/highlight) — 숫자 필터링 동등 기능 (wijmo-feature-matrix.md §1 Data Discovery) |
| peerDependencies | 변경 없음. `react ^18\|\|^19` + `@tanstack/react-table ^8.0.0` (기존 유지 — C-22) |
| 번들 영향 | +2 KB gzip 이하 (NumberFilter.tsx + numberFilterFn 증가분만). G-001 FilterPopover/FilterIndicator(~4KB) 포함 기준 누계 ~6KB. C-21 한도(grid-features per-패키지) 준수 |
| Docusaurus 문서 | 신규 페이지 `filter-ui/number-filter` 필요 (C-25 Storybook 연동) |
| Storybook story | `NumberFilter.stories.tsx` (between 시나리오 포함) |

---

## Section 14 — Implementation Plan (구현 순서)

### Phase A: 타입 확장 + numberFilterFn 추가 (filterFns.ts + types.ts MODIFY)

**산출 파일**:
- `filter-ui/types.ts` (MODIFY) — `NumberFilterOperator`, `NumberFilterValue`, `NumberFilterProps` 타입 추가 (기존 TextFilter* 타입 보존)
- `filter-ui/filterFns.ts` (MODIFY) — `numberFilterFn` 구현 + `autoRemove` 등록 (기존 `textFilterFn` 보존)

**구현 시 보존 의무 (C-1 확장)**:
- `types.ts`: `TextFilterOperator`, `TextFilterValue`, `FilterPopoverProps`, `FilterIndicatorProps`, `TextFilterProps` 모두 유지
- `filterFns.ts`: `textFilterFn` + `textFilterFn.autoRemove` 완전 보존

**Before (filterFns.ts 추가 전)**:
```typescript
export const textFilterFn: FilterFn<unknown> = ...;
textFilterFn.autoRemove = ...;
```

**After (filterFns.ts numberFilterFn 추가)**:
```typescript
export const textFilterFn: FilterFn<unknown> = ...;   // 기존 보존
textFilterFn.autoRemove = ...;                          // 기존 보존

export const numberFilterFn: FilterFn<unknown> = <TData>(...): boolean => {
  // 7 operator 분기 (Section 4.3)
};
numberFilterFn.autoRemove = (val: NumberFilterValue | undefined): boolean => {
  // Section 4.3 autoRemove 구현
};
```

**검증 포인트**:
- `tsc --noEmit` 0 error (C-12)
- `textFilterFn` 기존 동작 불변 (C-1 보존 의무)
- Section 5.1 truth table 대표 케이스 수동 확인: between inclusive, null-safe, NaN-safe

### Phase B: NumberFilter.tsx UI 컴포넌트 구현

**산출 파일**:
- `filter-ui/NumberFilter.tsx` (NEW) — 연산자 select + 조건부 input (단항/between) + clear + debounce 300ms

**구현 시 주의**:
- `FilterPopover` import from `'./FilterPopover'` (G-001 재사용 — AC-004)
- `FilterIndicator` import from `'./FilterIndicator'` (G-001 재사용 — AC-005)
- `popoverAlign` → `FilterPopover` `align` prop으로 C-29 spread-skip 패턴 (Section 4.7)
- operator 변경 시 EC-03 처리: 기존 value state 초기화 + `column.setFilterValue(undefined)`
- `type="number"` input 사용 (AC-003)

**검증 포인트**:
- `tsc --noEmit` 0 error (C-12)
- Tailwind 클래스만 사용 확인 (C-5) — `style={{ }}` 없음
- `operator === 'between'` 전환 시 두 input 렌더 확인 (Section 5.3)
- C-29 spread-skip 적용 확인

### Phase C: index.ts export 추가 + Storybook story 통합

**산출 파일**:
- `packages/grid-features/src/index.ts` (MODIFY) — `NumberFilter`, `numberFilterFn`, 타입 3종 추가 export (기존 G-001 exports 유지)
- `filter-ui/NumberFilter.stories.tsx` (NEW) — between 시나리오 포함 (AC-007)

**index.ts Before/After**:

```typescript
// Before: G-001 TextFilter exports 마지막 라인
export type {
  TextFilterOperator,
  TextFilterValue,
  TextFilterProps,
  FilterPopoverProps,
  FilterIndicatorProps,
} from './filter-ui/types';
```

```typescript
// After: G-002 NumberFilter exports 추가
// ... (기존 유지) ...
export type {
  TextFilterOperator,
  TextFilterValue,
  TextFilterProps,
  FilterPopoverProps,
  FilterIndicatorProps,
} from './filter-ui/types';

// MOD-GRID-09: filter-ui — NumberFilter (G-002)
export { NumberFilter } from './filter-ui/NumberFilter';
export { numberFilterFn } from './filter-ui/filterFns';
export type {
  NumberFilterOperator,
  NumberFilterValue,
  NumberFilterProps,
} from './filter-ui/types';
```

**검증 포인트**:
- `tsup build` 성공 + 번들 +2 KB 이내 (C-21)
- Storybook story 로컬 렌더 확인 (C-25)
- Section 12 예시 코드 그대로 컴파일 0 error
- 기존 G-001 exports (`TextFilter`, `textFilterFn` 등) 정상 유지 확인

---

## Section 15 — Verification Plan

### 15.1 단위 테스트 시나리오 (numberFilterFn — Section 5.1 truth table 커버)

`filter-ui/numberFilterFns.test.ts` (선택적 deliverable):

| 테스트 케이스 | operator | filterValue | cellValue | expected |
|-------------|---------|-------------|-----------|---------|
| UT-01 | `=` | value=100 | 100 | true |
| UT-02 | `=` | value=100 | 99 | false |
| UT-03 | `!=` | value=100 | 99 | true |
| UT-04 | `!=` | value=100 | 100 | false |
| UT-05 | `>` | value=50 | 51 | true |
| UT-06 | `>` | value=50 | 50 | false (경계값 미포함) |
| UT-07 | `<` | value=50 | 49 | true |
| UT-08 | `<` | value=50 | 50 | false (경계값 미포함) |
| UT-09 | `>=` | value=50 | 50 | true (경계값 포함) |
| UT-10 | `<=` | value=50 | 50 | true (경계값 포함) |
| UT-11 | `between` | min=10, max=20 | 15 | true |
| UT-12 | `between` | min=10, max=20 | 10 | true (하한 포함) |
| UT-13 | `between` | min=10, max=20 | 20 | true (상한 포함) |
| UT-14 | `between` | min=10, max=20 | 9 | false |
| UT-15 | `between` | min=10, max=20 | 21 | false |
| UT-16 | `between` | min=10, max=undefined | 15 | true (min만 적용) |
| UT-17 | any | — | null | false (null-safe) |
| UT-18 | any | — | "abc" | false (NaN-safe) |
| UT-19 | `autoRemove` | `=`, value=undefined | — | true |
| UT-20 | `autoRemove` | `between`, min=undefined, max=undefined | — | true |
| UT-21 | `autoRemove` | `between`, min=10, max=undefined | — | false (min 있음) |

구현 방법: `vitest` (monorepo 기존 테스트 러너 — G-001 패턴 준수).

### 15.2 Storybook 시각 회귀 시나리오

`NumberFilter.stories.tsx` (AC-007, C-25):

| Story | 시나리오 | 검증 포인트 |
|-------|---------|-----------|
| `Default` | `=` 연산자 기본 상태 | 단일 value input 렌더, FilterIndicator dot 비활성 |
| `BetweenOperator` | `between` 연산자 선택 상태 | min/max 두 input 렌더, `~` 구분자 표시 |
| `ActiveFilter` | value=100 입력 후 필터 활성 상태 | FilterIndicator 파란 dot 활성, `column.getIsFiltered()` true |
| `BetweenActiveFilter` | min=10, max=50 입력 후 활성 상태 | 두 input 모두 렌더, FilterIndicator 파란 dot 활성 |
| `ClearFilter` | 활성 필터 → 초기화 버튼 클릭 | dot 사라짐, `setFilterValue(undefined)` 호출 |
| `PopoverAlignRight` | `popoverAlign="right"` prop | Popover가 우측 정렬로 열림 |

### 15.3 빌드 검증

| 검증 항목 | 명령어 | 통과 기준 |
|---------|-------|---------|
| TypeScript 컴파일 | `tsc --noEmit` | 0 error (C-12) |
| 번들 빌드 | `tsup --entry src/index.ts` | build 성공, 오류 없음 |
| 번들 크기 | `size-limit` 또는 빌드 출력 확인 | numberFilterFn 증가분 < +2 KB gzip (C-21) |
| Storybook 빌드 | `storybook build` (또는 `storybook dev`) | story 렌더 오류 없음 (C-25) |
| 기존 exports 무결 | `tsc --noEmit` + import textFilterFn 확인 | G-001 TextFilter exports 정상 유지 |

---

## Section 13(b) — Self-Review Checklist

### A. Goal Fidelity
- [x] A-01: User Story의 모든 단계(1~6) → AC 매핑 확인 (Section 2)
- [x] A-02: 7개 AC 전부 Section 2에 포함
- [x] A-03 N/A: 현 구현 없음 (신규 기능 — filter UI critical gap)
- [x] A-04 N/A: migration path 없음 (신규 기능)
- [x] A-05: priority P0, migrationImpact medium → threshold 90 확인

### B. Constraint Coverage
- [x] B-01: C-2 TanStack API — column.setFilterValue, getIsFiltered, FilterFn 타입 사용
- [x] B-02: 사용 예시 2개 — Section 12 예시1(기본 단항 필터), 예시2(between range + FilterIndicator 분리)
- [x] B-03: C-5 Tailwind only — Section 4.5 조건부 렌더 Tailwind 명시
- [x] B-04: C-12 tsc 0 error — C-29 패턴 Section 4.7 명시
- [x] B-05 N/A: 비교 대상 기존 variant 없음

### C. Technical Accuracy
- [x] C-01: NumberFilterValue 타입 정의 Section 8 명시 (7 operator, value/min/max optional)
- [x] C-02: numberFilterFn.autoRemove 동작 Section 4.3, 5.4 명시
- [x] C-03: FilterPopover 재사용 (D7, AC-004) — G-001 구현 그대로
- [x] C-04: z-index 위임 — FilterPopover가 이미 z-[50] 적용
- [x] C-05 N/A: Pro license 불필요 (MIT)

### D. Implementation Guidance
- [x] D-01: 5개 파일 전부 Section 7 목록 포함 (D1, D5 경로+분류 보정)
- [x] D-02 N/A: deprecation 없음
- [x] D-03: Section 10 Render Tree 상세 기술 (7 operator + between 조건부 렌더)
- [x] D-04 N/A: migration path 없음
- [x] D-05: Section 12 Usage Example 2개 (columnDef.filterFn + NumberFilter 렌더)
- [x] D-06: debounce 300ms Section 4.6 명시

### E. Rubric Compliance
- [x] E-01 (v1.0.6): AC-007 Storybook 바인딩 → Section 7에 `NumberFilter.stories.tsx` NEW 항목 포함 (D4)
- [x] E-02: Section 5 Truth Table (7 연산자 × 주요 케이스 + null/NaN-safe + autoRemove)
- [x] E-03: 구현 순서 3단계 — Section 14 (Phase A: types+filterFns → Phase B: NumberFilter UI → Phase C: index.ts+Storybook)
- [x] E-04: D# Decision Log 11개 항목 (스펙 상단)
- [x] E-05: 검증 계획 — Section 15 (단위 테스트 21 시나리오 + Storybook 6 story + 빌드 검증 tsc/tsup/size-limit/storybook build)
- [x] E-06: Section 7 최종 표 vs 본문 D# 재결정 일관성 — 재결정 표현 없음. D5 확정 5파일 = Section 7 5행 일치

### F. Export & Packaging
- [x] F-01: Section 9 index.ts export 계획 (NumberFilter + numberFilterFn + 타입 3종)
- [x] F-02 N/A: MIT tier, Pro license 불필요
- [x] F-03: peerDependencies 변경 없음 (Section 3, C-22)
- [x] F-04: bundle limit +2 KB, grid-core 무영향 (C-21)

### G. Meta
- [x] G-01: 13 섹션 + Section 14/15 전부 작성 완료. D# 결정 로그 11개 포함. Truth table 포함. Storybook 파일 Section 7 포함.

---

## Reference Citations

| 참조 | 위치 | 확인 내용 |
|------|------|----------|
| `filter-ui/types.ts` L1-94 | Section 4.2, Section 8 | 기존 TextFilter* 타입 구조 확인. Column import `@tanstack/react-table` |
| `filter-ui/filterFns.ts` L1-79 | Section 4.3, Section 8 | textFilterFn 구현 + autoRemove 패턴 확인 |
| `filter-ui/FilterPopover.tsx` L1-120 | Section 4.1, D7 | FilterPopoverProps(trigger, children, align), align 기본값 'left', z-[50] 확인 |
| `filter-ui/FilterIndicator.tsx` L1-40 | AC-005, D7 | FilterIndicatorProps(isFiltered: boolean), 파란 dot 구현 확인 |
| `packages/grid-features/src/index.ts` L1-39 | Section 9 | 기존 G-001 exports: TextFilter/FilterPopover/FilterIndicator/textFilterFn + 타입 5종 |
| `tanstack-api-inventory.md` §2.4 | D2, AC-002 | `filterFns.inNumberRange` 존재 확인 (between 전용). 자체 numberFilterFn 구현 결정 |
| `tanstack-api-inventory.md` §2.2 | AC-001, AC-002 | ColumnFiltering feature: `column.setFilterValue`, `filterFn` |
| `ag-grid-feature-matrix.md` §1 §3 | Section 13(상용 영향) R-A | AG Grid Community `NumberFilterModule` — 동등 operator 제공 확인 |
| `wijmo-feature-matrix.md` §1 | Section 13 R-W | Wijmo Filtering: 숫자 필터링 동등 기능 |
| `G-001-spec.md` §D#, §Section 7 | D1, D5, D7, D8 | G-001 패턴 학습: C-28 경로 보정, E-01 v1.0.6 Storybook 바인딩, FilterPopover/FilterIndicator 구현 확인 |
| `filter-ui-goals.json` §G-002 | Section 1, Section 2 | AC-001~007 출처. operator 7개 확인. affectedUsageFiles: [] |
| `canonical-modules.json` MOD-GRID-09 §G-002 | Section 1 | priority P0, dependsOn 확인 |
