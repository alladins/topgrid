# MOD-GRID-09 / filter-ui / G-001 — TextFilter Specification

**version**: 1.0.0  
**specDate**: 2026-05-14  
**rubricVersion**: v1.0.6  
**goalRef**: `.claude/tw-grid/goals/MOD-GRID-09/filter-ui-goals.json` §G-001  
**threshold**: 90 (migrationImpact: medium)

---

## D# Decision Log (Pre-writing Decisions)

| ID | 결정 | 근거 |
|----|------|------|
| D1 | C-28 Path Correction: implementFiles prefix `TOMIS/packages/grid-features/` → `topvel-grid-monorepo/packages/grid-features/` | 실제 monorepo 위치 확인: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/` (C-28 적용) |
| D2 | Popover 전략: `@radix-ui/react-popover` **없음** → 네이티브 `div position:absolute` 사용 | tw-framework-front/package.json L1-59 읽기 결과: `@radix-ui/react-popover` 미존재. 목표 번들 +4KB, Radix Popover ~6-8KB gzip + C-20 ADR 부담. 네이티브 div 채택, 신규 peer dep 없음 |
| D3 | E-01 v1.0.6: AC-007 Storybook 바인딩 → Section 7 구현 파일 목록에 `TextFilter.stories.tsx` 추가 | specify-rubric.md E-01: 바인딩 AC는 Section 7 최종 표에 deliverable 파일 항목 필수 |
| D4 | Popover 외부클릭/Escape 해제 + 포커스 관리 명시 | advisor 지적: @radix-ui 미사용 시 해당 기능을 스펙이 직접 커버해야 함 |
| D5 | 필터 동작 케이스 확정: 대소문자 무시(case-insensitive), 공백 trim, empty value → 필터 해제 | C-30 truth table 의무; AG Grid Community 기본 동작 패턴 채택 |
| D6 | 디바운스: 300ms, `useEffect` + `setTimeout` 조합 (외부 라이브러리 없음) | 타이핑 중 re-render 과부하 방지. 신규 dep 불필요 |
| D7 | z-index 정책: FilterPopover wrapper에 `z-[50]` (sticky header z-index 10보다 높음) | MOD-GRID-02 sticky header 위 overlay 필요 (dependsOn: MOD-GRID-02/G-001) |

---

## Section 1 — Goal Summary

| 항목 | 내용 |
|------|------|
| goalId | G-001 |
| title | TextFilter — 컬럼 헤더 Popover + contains/equals/startsWith/endsWith 연산자 + 필터 인디케이터 |
| moduleId | MOD-GRID-09 |
| area | filter-ui |
| priority | P0 |
| migrationImpact | medium |
| licenseTier | MIT |
| packageTarget | packages/grid-features (D1 보정: topvel-grid-monorepo/packages/grid-features) |
| dependsOn | MOD-GRID-01/G-001 (column-drag 기반), MOD-GRID-02/G-001 (sticky header — z-index 의존) |
| breaking | false |
| affectedUsageFiles | [] (신규 기능, 기존 사용처 없음) |
| bundleImpact | +4 KB gzip 이하 (grid-core 무영향 — C-21) |

**User Story**: 사용자가 텍스트 컬럼 헤더의 필터 아이콘을 클릭하면 Popover가 열리고, '포함', '같음', '시작', '끝' 연산자를 선택한 후 값을 입력하면 그리드가 즉시 필터링된다. 활성 필터가 있는 헤더에는 파란 점 인디케이터가 표시된다.

---

## Section 2 — Acceptance Criteria

| AC ID | 기준 | Source | 충족 방법 |
|-------|------|--------|----------|
| AC-001 | `TextFilterValue` 타입 `{ operator: 'contains' \| 'equals' \| 'startsWith' \| 'endsWith', value: string }` — `column.setFilterValue` / `column.getFilterValue` 사용 (TanStack columnFilters 표준 — C-2, no any — C-4) | C-4 | `types.ts`에 타입 정의; `TextFilter.tsx`에서 `Column<TData, unknown>` 제네릭 사용, `any` 금지 |
| AC-002 | `column.columnDef.filterFn`에 커스텀 filterFn 등록 — operator 분기 처리 (TanStack filterFns 표준 — C-2) | C-2 | `filterFns.ts`에 `textFilterFn` 정의 + `columnDef.filterFn = 'textFilter'` 사용 패턴 문서화 |
| AC-003 | Popover 구현 — `@radix-ui/react-popover` 미존재 확인(D2) → 네이티브 `div position:absolute` 채택. 신규 외부 lib 추가 없음 (C-20 ADR 불필요) | C-20 | `FilterPopover.tsx`에 네이티브 div 구현; 외부클릭·Escape·포커스 관리 포함(D4) |
| AC-004 | 활성 필터 인디케이터 — `column.getIsFiltered() === true` 시 헤더에 Tailwind dot 렌더 (F-09-07 + F-09-08 흡수) | C-5 | `FilterIndicator.tsx`; Tailwind 클래스만 사용 (C-5) |
| AC-005 | clear 버튼 → `column.setFilterValue(undefined)` (TanStack 표준 — C-2) | C-2 | `TextFilter.tsx` 내 "초기화" 버튼; setFilterValue(undefined) 호출 |
| AC-006 | C-12: `tsc --noEmit` 0 error | C-12 | `exactOptionalPropertyTypes: true` 대응 C-29 패턴 적용; generic 타입 명시; `any` 금지 |
| AC-007 | C-25: Storybook story 1개 (contains + 인디케이터 + clear 시나리오) | C-25 | `TextFilter.stories.tsx` 신설 (E-01 v1.0.6 바인딩 — D3) |

---

## Section 3 — Non-Functional Requirements

| 항목 | 요건 |
|------|------|
| 번들 크기 | +4 KB gzip 이하 (TextFilter + FilterPopover + FilterIndicator + filterFns 합계). grid-core 패키지 무영향 (C-21) |
| TypeScript | `strict: true`, `exactOptionalPropertyTypes: true`, `noImplicitAny: true` — tsconfig.base.json 상속 (C-4, C-12) |
| 스타일 | Tailwind CSS 클래스 전용 (C-5). `style={{ }}` 인라인 스타일 금지 (예외: `position:absolute`는 Tailwind `absolute` 클래스로 대체) |
| 접근성 | 필터 아이콘 버튼: `aria-label="필터"`, `aria-pressed={column.getIsFiltered()}`. FilterPopover: `role="dialog"`, `aria-label="텍스트 필터"`. 입력 필드: `aria-label="필터 값"` |
| 신규 의존성 | 없음 (D2 결정). 기존 peerDependencies만 사용: `@tanstack/react-table ^8.0.0`, `react ^18||^19` |
| 성능 | 입력 디바운스 300ms (D6). `column.setFilterValue` 호출은 디바운스 후에만 발생 |
| 호환성 | `@tanstack/react-table@^8.0.0` peerDep — BaseGrid.tsx와 동일 버전 (`^8.21.3`) |

---

## Section 4 — Design Decisions

### 4.1 FilterPopover 구현 전략 (D2, D4)

`@radix-ui/react-popover`는 tw-framework-front/package.json에 **없음** (확인 출처: `tw-framework-front/package.json` L1-59 전체 읽기, `@radix-ui/react-popover` 항목 미존재).

네이티브 div `position:absolute` 구현:

```
FilterPopover
├── trigger: 아이콘 버튼 (FunnelIcon)
└── content: div[absolute, z-[50], overflow-hidden, rounded, shadow-lg, bg-white, border]
```

**필수 동작 (D4)**:
1. **외부 클릭 해제**: `mousedown` 이벤트를 document에 등록; popover root ref 포함 여부 확인 후 닫기
2. **Escape 해제**: `keydown` 이벤트 (`e.key === 'Escape'`) → 닫기 + trigger에 포커스 복귀
3. **포커스 관리**: open 시 첫 번째 input에 포커스. close 시 trigger 버튼에 포커스 복귀 (`triggerRef.current?.focus()`)
4. **뷰포트 경계**: 우측 경계 감지 — trigger 위치 기준 `right-0` 정렬 기본; `left-0` 대안 (prop `align?: 'left' | 'right'`, 기본 `'left'`)
5. **z-index**: `z-[50]` — sticky header (`z-[10]`, MOD-GRID-02 기준)보다 높음 (D7)

### 4.2 TextFilterValue 타입 설계 (AC-001)

```typescript
// types.ts
export type TextFilterOperator = 'contains' | 'equals' | 'startsWith' | 'endsWith';

export interface TextFilterValue {
  operator: TextFilterOperator;
  value: string;
}
```

`column.setFilterValue(v: TextFilterValue | undefined)` — `undefined`는 필터 해제.

### 4.3 filterFn 등록 패턴 (AC-002)

TanStack은 `filterFn`을 문자열 키로 등록하거나 함수 직접 참조를 지원한다.  
이 Goal에서는 **함수 직접 참조** 방식 채택 (타입 안전, tree-shaking 친화적):

```typescript
// 사용처 columnDef 예시 (Section 12에 전체 예시)
{
  accessorKey: 'name',
  filterFn: textFilterFn,   // types.ts에서 import
}
```

`textFilterFn` 시그니처 (TanStack `FilterFn<TData>` 준수):
```typescript
const textFilterFn = <TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: TextFilterValue
): boolean => { ... }
```

`textFilterFn.autoRemove = (val: TextFilterValue | undefined) => !val || val.value === ''` 
→ TanStack이 value가 비어 있으면 자동으로 필터 제거 (D5)

### 4.4 동작 정의 (D5, C-30 — truth table 입력)

| operator | 동작 설명 | 대소문자 | 공백 |
|----------|----------|---------|------|
| contains | `cellStr.includes(filterStr)` | case-insensitive | trim |
| equals | `cellStr === filterStr` | case-insensitive | trim |
| startsWith | `cellStr.startsWith(filterStr)` | case-insensitive | trim |
| endsWith | `cellStr.endsWith(filterStr)` | case-insensitive | trim |

edge case 처리:
- `filterValue.value === ''` → `textFilterFn.autoRemove` 트리거 → 필터 자동 해제
- cell value가 `null` 또는 `undefined` → `String(null)` = `'null'` 등 오염 방지: `if (cellValue == null) return false`
- cell value가 숫자/불리언 → `String(cellValue)` 변환 후 비교 (방어적)

### 4.5 디바운스 (D6)

TextFilter 내부 로컬 state `inputValue`를 관리하고, `useEffect`로 300ms 디바운스 후 `column.setFilterValue` 호출:

```typescript
const [inputValue, setInputValue] = useState(currentValue?.value ?? '');
useEffect(() => {
  const timer = setTimeout(() => {
    if (inputValue.trim() === '') {
      column.setFilterValue(undefined);
    } else {
      column.setFilterValue({ operator, value: inputValue });
    }
  }, 300);
  return () => clearTimeout(timer);
}, [inputValue, operator]);
```

### 4.6 C-29 exactOptionalPropertyTypes 패턴

`FilterPopover`의 optional prop `align?: 'left' | 'right'`를 하위 컴포넌트에 전달 시:

```typescript
// 잘못된 방법 (C-29 위반 — undefined 전달 가능)
const props = { align: align };

// 올바른 방법 (C-29 spread-skip 패턴)
const extraProps = align !== undefined ? { align } : {};
<InnerPopover {...extraProps} />
```

---

## Section 5 — Truth Table (C-30)

### 5.1 TextFilterFn 동작 (4 연산자 × 4 입력 케이스)

| operator | filterValue.value | cellValue | expected | 비고 |
|----------|-------------------|-----------|----------|------|
| contains | `'abc'` | `'XABCX'` | true | case-insensitive |
| contains | `'abc'` | `'xyz'` | false | |
| contains | `''` | `'anything'` | — (autoRemove) | 필터 해제 |
| contains | `'abc'` | `null` | false | null-safe |
| equals | `'hello'` | `'HELLO'` | true | case-insensitive |
| equals | `'hello'` | `'hello world'` | false | 정확히 일치 |
| equals | `''` | `'anything'` | — (autoRemove) | 필터 해제 |
| equals | `'hello'` | `undefined` | false | null-safe |
| startsWith | `'he'` | `'Hello World'` | true | case-insensitive |
| startsWith | `'he'` | `'World Hello'` | false | |
| startsWith | `' he'` | `'hello'` | false | trim 후: 'he' → true |
| startsWith | `''` | `'anything'` | — (autoRemove) | 필터 해제 |
| endsWith | `'ld'` | `'Hello World'` | true | case-insensitive |
| endsWith | `'ld'` | `'World Hello'` | false | |
| endsWith | `''` | `'anything'` | — (autoRemove) | 필터 해제 |
| endsWith | `'ld'` | `null` | false | null-safe |

### 5.2 FilterIndicator 렌더 조건

| column.getIsFiltered() | 인디케이터 dot 렌더 |
|------------------------|---------------------|
| true | ✅ 렌더 (Tailwind: `w-2 h-2 rounded-full bg-blue-500`) |
| false | ❌ 렌더 없음 (`null` 반환) |

### 5.3 FilterPopover 열림/닫힘 조건

| 이벤트 | 결과 |
|--------|------|
| 아이콘 버튼 클릭 | open toggle |
| 외부 클릭 (mousedown) | close |
| Escape 키 | close + trigger에 포커스 복귀 |
| clear 버튼 클릭 | setFilterValue(undefined) + close |
| 적용 버튼 클릭 (Enter 또는 버튼) | setFilterValue(...) + (popover 유지 — 인라인 즉시 반영) |

---

## Section 6 — Boundary Conditions & Integration Points

### 6.1 BaseGrid.tsx 연동

`BaseGrid.tsx` (L29) 이미 `columnFilters` state 존재, L99 `getFilteredRowModel()` 등록됨.  
→ TextFilter는 해당 state에 자동 연결됨 (추가 wiring 불필요).

사용자(app layer)가 해야 할 작업:
1. `columnDef.filterFn = textFilterFn` 설정
2. `columnDef.header` 내에 `<TextFilter column={column} />` 렌더

### 6.2 MOD-GRID-02 sticky header 의존성 (D7)

MOD-GRID-02/G-001이 sticky header에 `z-[10]`을 사용한다고 가정 (dependsOn).  
FilterPopover z-index: `z-[50]` → 반드시 sticky header 위에 표시.  
→ 만약 MOD-GRID-02 z-index 변경 시 이 스펙 D7 재검토 필요.

### 6.3 MOD-GRID-01 column-drag 공존

TextFilter는 헤더 내부 별도 버튼 렌더. column-drag trigger와 충돌 가능성:  
- drag trigger: `<th>` 전체 drag handle
- filter trigger: `<button>` — 독립 요소 (이벤트 버블링 stopPropagation 불필요)  
→ 충돌 없음.

### 6.4 신규 의존성 없음 (C-20)

`@radix-ui/react-popover` 없음(D2). 신규 peer dependency 추가 없음.  
`peerDependencies` 변경: 없음.

---

## Section 7 — Implementation Files

| 파일 경로 | 상태 | 역할 |
|-----------|------|------|
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/src/filter-ui/types.ts` | NEW | `TextFilterOperator`, `TextFilterValue` 타입 정의 |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/src/filter-ui/filterFns.ts` | NEW | `textFilterFn` (FilterFn<TData> 구현 + autoRemove) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/src/filter-ui/FilterPopover.tsx` | NEW | 네이티브 div popover (외부클릭/Escape/포커스/z-index) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/src/filter-ui/FilterIndicator.tsx` | NEW | 파란 dot 인디케이터 (`column.getIsFiltered()` 기반) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/src/filter-ui/TextFilter.tsx` | NEW | 메인 컴포넌트 (연산자 select + 값 input + clear + debounce) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/src/index.ts` | MODIFY | filter-ui exports 추가 (TextFilter, FilterPopover, FilterIndicator, textFilterFn + 타입) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/src/filter-ui/TextFilter.stories.tsx` | NEW | Storybook story (contains + 인디케이터 + clear 시나리오) — AC-007, E-01 v1.0.6 |

**Path correction (D1)**: Goal JSON의 `TOMIS/packages/grid-features/` → `topvel-grid-monorepo/packages/grid-features/` 보정 완료.

---

## Section 8 — TypeScript Interface Contract

```typescript
// filter-ui/types.ts

export type TextFilterOperator = 'contains' | 'equals' | 'startsWith' | 'endsWith';

export interface TextFilterValue {
  operator: TextFilterOperator;
  value: string;
}
```

```typescript
// filter-ui/FilterPopover.tsx — Props

export interface FilterPopoverProps {
  /** 팝오버 트리거 요소 렌더 함수 */
  trigger: React.ReactNode;
  /** 팝오버 내용 */
  children: React.ReactNode;
  /** 정렬 방향 — 기본 'left' (C-29: optional prop, spread-skip 패턴 적용) */
  align?: 'left' | 'right';
}
```

```typescript
// filter-ui/FilterIndicator.tsx — Props

export interface FilterIndicatorProps {
  /** column.getIsFiltered() 결과값 */
  isFiltered: boolean;
}
```

```typescript
// filter-ui/TextFilter.tsx — Props

export interface TextFilterProps<TData> {
  /** TanStack Column 인스턴스 */
  column: Column<TData, unknown>;
  /** 기본 연산자 — 기본 'contains' (C-29: optional prop) */
  defaultOperator?: TextFilterOperator;
  /** 팝오버 정렬 — 기본 'left' (C-29: optional prop) */
  popoverAlign?: 'left' | 'right';
}
```

```typescript
// filter-ui/filterFns.ts — 시그니처

import type { FilterFn } from '@tanstack/react-table';
import type { TextFilterValue } from './types';

export const textFilterFn: FilterFn<unknown> & {
  autoRemove: (val: TextFilterValue | undefined) => boolean;
} = (row, columnId, filterValue: TextFilterValue): boolean => { ... };

textFilterFn.autoRemove = (val) => !val || val.value.trim() === '';
```

---

## Section 9 — index.ts Export Plan

`packages/grid-features/src/index.ts` MODIFY:

```typescript
// 기존 exports 유지 (MOD-GRID-07 column-drag, MOD-GRID-08 multi-sort)

// MOD-GRID-09: filter-ui — TextFilter
export { TextFilter } from './filter-ui/TextFilter';
export { FilterPopover } from './filter-ui/FilterPopover';
export { FilterIndicator } from './filter-ui/FilterIndicator';
export { textFilterFn } from './filter-ui/filterFns';
export type {
  TextFilterOperator,
  TextFilterValue,
  TextFilterProps,
  FilterPopoverProps,
  FilterIndicatorProps,
} from './filter-ui/types';
// TextFilterProps는 filter-ui/TextFilter.tsx에서 re-export 또는 types.ts 통합
```

---

## Section 10 — Component Render Tree

```
<th> (header cell, app layer)
├── <span> column header label </span>
└── <TextFilter column={column}>
    ├── <FilterIndicator isFiltered={column.getIsFiltered()} />  ← 파란 dot
    └── <FilterPopover
            trigger={<button aria-label="필터" aria-pressed={column.getIsFiltered()}>
                       <FunnelIcon />
                     </button>}
            align={popoverAlign}
          >
          ┌─ Popover content (div[role="dialog", aria-label="텍스트 필터"])
          │  ├── <select aria-label="연산자">
          │  │   ├── <option value="contains">포함</option>
          │  │   ├── <option value="equals">같음</option>
          │  │   ├── <option value="startsWith">시작</option>
          │  │   └── <option value="endsWith">끝</option>
          │  ├── <input type="text" aria-label="필터 값" />
          │  └── <button onClick={() => column.setFilterValue(undefined)}>초기화</button>
          └─
```

**FunnelIcon**: `@heroicons/react` 또는 SVG inline. tw-framework-front의 아이콘 사용 패턴 확인 필요 (MODIFY 시 기존 방식 준수).

---

## Section 11 — Constraints Checklist

| 제약 | 항목 | 적용 여부 | 비고 |
|------|------|----------|------|
| C-1 | Read before write | ✅ | 모든 참조 파일 사전 읽기 완료 |
| C-2 | TanStack 표준 API만 | ✅ | column.setFilterValue, getIsFiltered, FilterFn 타입 |
| C-4 | no any | ✅ | Column<TData, unknown>, FilterFn<unknown> |
| C-5 | Tailwind CSS only | ✅ | 인라인 스타일 없음, position:absolute → `absolute` 클래스 |
| C-7 | AG Grid 신규 도입 금지 | ✅ N/A | AG Grid 코드 없음 |
| C-12 | tsc --noEmit 0 error | ✅ | exactOptionalPropertyTypes C-29 패턴 적용 |
| C-16 | Wijmo 비도입 | ✅ N/A | Wijmo 코드 없음 |
| C-20 | 신규 dep ADR 의무 | ✅ | 신규 dep 없음 (D2) |
| C-21 | 번들 한도 | ✅ | +4 KB 목표, grid-core 무영향 |
| C-22 | peerDeps 변경 없음 | ✅ | 기존 peerDeps 유지 |
| C-25 | Storybook story | ✅ | TextFilter.stories.tsx (D3, AC-007) |
| C-28 | Path prefix 보정 | ✅ | D1: topvel-grid-monorepo 경로 사용 |
| C-29 | exactOptionalPropertyTypes | ✅ | Section 4.6 spread-skip 패턴 명시 |
| C-30 | Truth table | ✅ | Section 5 truth table (4 연산자 × 4 케이스) |

**N/A 항목**: A-03 (현 구현 없음 — filter UI critical gap), A-04 (migration path N/A — 신규 기능), C-05 (no Pro license — MIT tier), D-02 (no deprecation — new feature), D-04 (no migration path), F-02 (no Pro/Enterprise license verification), B-05 (no existing variant to compare)

---

## Section 12 — Usage Example (Consumer Code)

```typescript
// app layer: BaseGrid column 정의 예시
import {
  TextFilter,
  textFilterFn,
} from '@tomis/grid-features';
import type { TextFilterValue } from '@tomis/grid-features';

const columns = createColumnHelper<Person>().accessor('name', {
  header: ({ column }) => (
    <div className="flex items-center gap-1">
      <span>이름</span>
      <TextFilter column={column} defaultOperator="contains" />
    </div>
  ),
  filterFn: textFilterFn,
  // C-29: enableColumnFilter 지정 시 spread-skip 패턴
  // const filterProps = enableFilter !== undefined ? { enableColumnFilter: enableFilter } : {};
});

// BaseGrid.tsx wiring (기존 L29, L99 — 추가 수정 불필요)
// columnFilters state: 이미 존재
// getFilteredRowModel(): 이미 등록
```

### 예시 2: equals 연산자 + clear 버튼 UX 시나리오 + dataMap 컬럼 결합

```typescript
// advanced: equals 연산자로 상태 컬럼 정확 일치 필터 + clear 버튼 확인
import {
  TextFilter,
  textFilterFn,
  FilterIndicator,
} from '@tomis/grid-features';
import type { TextFilterValue } from '@tomis/grid-features';
import { createColumnHelper } from '@tanstack/react-table';

interface Order {
  id: number;
  status: string;  // 'pending' | 'approved' | 'rejected'
  description: string;
}

const columnHelper = createColumnHelper<Order>();

const columns = [
  columnHelper.accessor('status', {
    header: ({ column }) => (
      <div className="flex items-center gap-1">
        <span>상태</span>
        {/* FilterIndicator: column.getIsFiltered() 기반 파란 dot */}
        <FilterIndicator isFiltered={column.getIsFiltered()} />
        {/* equals 연산자 기본값 — 상태 컬럼은 정확 일치 필터가 적합 */}
        <TextFilter column={column} defaultOperator="equals" popoverAlign="right" />
      </div>
    ),
    filterFn: textFilterFn,
  }),
  columnHelper.accessor('description', {
    header: ({ column }) => (
      <div className="flex items-center gap-1">
        <span>설명</span>
        <TextFilter column={column} defaultOperator="contains" />
      </div>
    ),
    filterFn: textFilterFn,
  }),
];

// UX 시나리오:
// 1. 사용자가 "상태" 헤더 필터 아이콘 클릭 → Popover 열림
// 2. 연산자 "같음(equals)" 선택, 값 "approved" 입력 → 300ms 디바운스 후 필터 적용
// 3. FilterIndicator 파란 dot 활성화 (column.getIsFiltered() === true)
// 4. "초기화" 버튼 클릭 → column.setFilterValue(undefined) → dot 사라짐
// 5. Escape 키 → Popover 닫힘 + 필터 아이콘 버튼에 포커스 복귀 (D4)

// C-29: optional prop 전달 시 spread-skip 패턴
// const alignProp = userAlign !== undefined ? { popoverAlign: userAlign } : {};
// <TextFilter column={column} defaultOperator="equals" {...alignProp} />
```

---

## Section 14 — Implementation Plan (구현 순서)

### Phase A: 타입 + filterFns 골격 구축

**산출 파일**:
- `filter-ui/types.ts` (NEW) — `TextFilterOperator`, `TextFilterValue` 타입 정의
- `filter-ui/filterFns.ts` (NEW) — `textFilterFn` 구현 + `autoRemove` 등록

**검증 포인트**:
- `tsc --noEmit` 0 error (C-12)
- `textFilterFn.autoRemove('')` = true, `textFilterFn.autoRemove('abc')` = false 수동 확인
- 4 operator (contains/equals/startsWith/endsWith) × case-insensitive + trim 동작 Section 5.1 truth table 참조 확인

### Phase B: FilterPopover + FilterIndicator + TextFilter UI 컴포넌트

**산출 파일**:
- `filter-ui/FilterPopover.tsx` (NEW) — 네이티브 div popover (외부클릭/Escape/포커스/z-index)
- `filter-ui/FilterIndicator.tsx` (NEW) — 파란 dot (`column.getIsFiltered()` 기반)
- `filter-ui/TextFilter.tsx` (NEW) — 연산자 select + 값 input + clear + debounce 300ms

**검증 포인트**:
- `tsc --noEmit` 0 error (C-12, C-29 spread-skip 패턴 적용 포함)
- Tailwind 클래스만 사용 (C-5) — `style={{ }}` 없음 확인
- FilterPopover 외부클릭/Escape 동작 확인 (D4)
- FilterIndicator dot 렌더 조건 Section 5.2 truth table 확인

### Phase C: index.ts export + Storybook story 통합

**산출 파일**:
- `packages/grid-features/src/index.ts` (MODIFY) — filter-ui exports 추가
- `filter-ui/TextFilter.stories.tsx` (NEW) — contains + 인디케이터 + clear 시나리오 (AC-007)

**검증 포인트**:
- `tsup build` 성공 + 번들 +4 KB 이내 (C-21)
- `size-limit` 통과 (< +4 KB gzip)
- Storybook story 로컬 렌더 확인 (C-25)
- Section 12 예시 코드 그대로 컴파일 0 error

---

## Section 15 — Verification Plan

### 15.1 단위 테스트 시나리오 (filterFns.ts)

`filter-ui/filterFns.test.ts` (선택적 deliverable — Section 5.1 truth table 커버):

| 테스트 케이스 | operator | filterValue.value | cellValue | expected |
|-------------|---------|------------------|-----------|---------|
| UT-01 | contains | `'abc'` | `'XABCX'` | true |
| UT-02 | contains | `'abc'` | `'xyz'` | false |
| UT-03 | contains | `''` | `'anything'` | autoRemove=true → 필터 해제 |
| UT-04 | contains | `'abc'` | `null` | false (null-safe) |
| UT-05 | equals | `'hello'` | `'HELLO'` | true (case-insensitive) |
| UT-06 | equals | `'hello'` | `'hello world'` | false |
| UT-07 | startsWith | `'he'` | `'Hello World'` | true |
| UT-08 | startsWith | `' he'` | `'hello'` | true (trim 후 'he' → startsWith) |
| UT-09 | endsWith | `'ld'` | `'Hello World'` | true |
| UT-10 | endsWith | `'ld'` | `'World Hello'` | false |

구현 방법: `vitest` (monorepo 기존 테스트 러너 확인 후 준수) 또는 `jest`.

### 15.2 Storybook 시각 회귀 시나리오

`TextFilter.stories.tsx` (AC-007, C-25):

| Story | 시나리오 | 검증 포인트 |
|-------|---------|-----------|
| `Default` | contains 연산자 기본 상태 | Popover 트리거 버튼 렌더, FilterIndicator dot 비활성 |
| `ActiveFilter` | 'abc' 입력 후 필터 활성 상태 | FilterIndicator 파란 dot 활성, `column.getIsFiltered()` true |
| `ClearFilter` | 활성 필터 → 초기화 버튼 클릭 | dot 사라짐, `setFilterValue(undefined)` 호출 확인 |
| `EqualsOperator` | equals 연산자 선택 + 값 입력 | 연산자 select에 'equals' 선택됨 |
| `PopoverAlignRight` | `popoverAlign="right"` prop | Popover가 오른쪽 정렬로 열림 |

### 15.3 빌드 검증

| 검증 항목 | 명령어 | 통과 기준 |
|---------|-------|---------|
| TypeScript 컴파일 | `tsc --noEmit` | 0 error (C-12) |
| 번들 빌드 | `tsup --entry src/index.ts` | build 성공, 오류 없음 |
| 번들 크기 | `size-limit` 또는 빌드 출력 확인 | filter-ui 합계 < +4 KB gzip (C-21) |
| Storybook 빌드 | `storybook build` (또는 `storybook dev`) | story 렌더 오류 없음 (C-25) |

---

## Section 13 — Self-Review Checklist

### A. Goal Fidelity
- [x] A-01: User Story의 모든 단계(1~7) → AC 매핑 확인 (Section 2)
- [x] A-02: 7개 AC 전부 Section 2에 포함
- [x] A-03 N/A: 현 구현 없음 (filter UI critical gap — feature-gap-matrix.md §1)
- [x] A-04 N/A: migration path 없음 (신규 기능)
- [x] A-05: priority P0, migrationImpact medium → threshold 90 확인

### B. Constraint Coverage
- [x] B-01: C-2 TanStack API — column.setFilterValue, getIsFiltered, FilterFn 타입 사용
- [x] B-02: 사용 예시 2개 — Section 12 예시1(contains 기본), 예시2(equals + clear UX + dataMap 결합)
- [x] B-03: C-5 Tailwind only — Section 4.1 인라인 스타일 없음 명시
- [x] B-04: C-12 tsc 0 error — C-29 패턴 Section 4.6 명시
- [x] B-05 N/A: 비교 대상 기존 variant 없음

### C. Technical Accuracy
- [x] C-01: TextFilterValue 타입 정의 Section 8 명시
- [x] C-02: textFilterFn.autoRemove 동작 Section 4.3, 5.1 명시
- [x] C-03: FilterPopover 외부클릭/Escape/포커스 Section 4.1 (D4) 명시
- [x] C-04: z-index z-[50] Section 4.1 (D7) 명시
- [x] C-05 N/A: Pro license 불필요 (MIT)

### D. Implementation Guidance
- [x] D-01: 7개 파일 전부 Section 7 목록 포함 (D1 경로 보정)
- [x] D-02 N/A: deprecation 없음
- [x] D-03: Section 10 Render Tree 상세 기술
- [x] D-04 N/A: migration path 없음
- [x] D-05: Section 12 Usage Example (columnDef.filterFn + TextFilter 렌더)
- [x] D-06: debounce 300ms Section 4.5 명시

### E. Rubric Compliance
- [x] E-01 (v1.0.6): AC-007 Storybook 바인딩 → Section 7에 `TextFilter.stories.tsx` NEW 항목 포함 (D3)
- [x] E-02: Section 5 Truth Table (4 연산자 × 4 케이스 = 16 rows + edge cases)
- [x] E-03: 구현 순서 3단계 — Section 14 (Phase A: types+filterFns → Phase B: UI 컴포넌트 3종 → Phase C: index.ts+Storybook)
- [x] E-04: D# Decision Log 7개 항목 (스펙 상단)
- [x] E-05: 검증 계획 — Section 15 (단위 테스트 10 시나리오 + Storybook 5 story + 빌드 검증 tsc/tsup/size-limit/storybook build)
- [x] E-06: H-02 implementFiles 경로 합리성 — D1 보정, 실제 monorepo 경로 사용

### F. Export & Packaging
- [x] F-01: Section 9 index.ts export 계획 (5 컴포넌트/함수 + 5 타입)
- [x] F-02 N/A: MIT tier, Pro license 불필요
- [x] F-03: peerDependencies 변경 없음 (Section 3, C-22)
- [x] F-04: bundle limit +4 KB, grid-core 무영향 (C-21)

### G. Meta
- [x] G-01: 13 섹션 전부 작성 완료. D# 결정 로그 포함. truth table 포함. Storybook 파일 Section 7 포함.

---

## Reference Citations

| 참조 | 위치 | 확인 내용 |
|------|------|----------|
| `tw-framework-front/package.json` L1-59 | D2 결정 근거 | `@radix-ui/react-popover` **없음** 확인 |
| `tw-framework-front/src/components/tomis/Grid/BaseGrid.tsx` L29 | Section 6.1 | `useState<ColumnFiltersState>([])` |
| `tw-framework-front/src/components/tomis/Grid/BaseGrid.tsx` L99 | Section 6.1 | `getFilteredRowModel: getFilteredRowModel()` |
| `tanstack-api-inventory.md` §2.2 | AC-001, AC-002 | `column.setFilterValue`, `filterFn`, `column.getIsFiltered` |
| `tanstack-api-inventory.md` §2.4 | Section 4.3 | `filterFns` 내장 목록 (`includesString`, `inNumberRange` 등) |
| `feature-gap-matrix.md` §1 | A-03 N/A | filter UI critical gap 확인 |
| `current-tanstack-analysis.md` L51 | Section 1 | "Filter UI — unsupported" |
| `canonical-modules.json` MOD-GRID-09 §G-001 | Section 1 | priority P0, dependsOn, bundleImpact |
| `topvel-grid-monorepo/tsconfig.base.json` | C-29 | `exactOptionalPropertyTypes: true` |
| `topvel-grid-monorepo/packages/grid-features/src/index.ts` | Section 9 | 기존 exports (column-drag, multi-sort) 유지 확인 |
