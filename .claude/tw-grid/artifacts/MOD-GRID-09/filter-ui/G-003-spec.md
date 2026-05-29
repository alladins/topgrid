# G-003 Spec — DateFilter (range picker + date-fns 연산)

**Module**: MOD-GRID-09 / filter-ui  
**Goal ID**: G-003  
**Title**: DateFilter — range picker + date-fns 연산  
**Spec Version**: 1.0.0  
**Date**: 2026-05-14  
**Status**: DRAFT  
**Monorepo Path**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/`  
**dependsOn**: G-001 (FilterPopover, FilterIndicator), G-002 (filterFns.ts pattern)

---

## Decision Log

| ID  | 결정 요약 | 근거 |
|-----|----------|------|
| D1  | 경로 접두사 `topvel-grid-monorepo/packages/grid-features/` 사용 | C-28: TOMIS/packages → topvel-grid-monorepo/packages 수정 |
| D2  | `react-datepicker` peerDependency 추가 (`^8.3.0`) | C-9/C-20/C-22: tw-framework-front 이미 `^8.3.0` 보유; peerDep으로 중복 번들 방지; MIT 라이선스 확인; ADR D8 참조 |
| D3  | `date-fns` peerDependency 추가 (`^4.1.0`) | C-9/C-20/C-22: tw-framework-front 이미 `^4.1.0` 보유; peerDep으로 번들 최적화; MIT 라이선스 확인; ADR D8 참조 |
| D4  | CSS 전략: consumer가 `react-datepicker/dist/react-datepicker.css` 직접 import | C-5 (Tailwind only): grid-features 내부에서 CSS import 금지; DateFilter.tsx에서 CSS import 하지 않음; 사용자 가이드에 명시 |
| D5  | E-01 v1.0.6 Storybook 바인딩 → `DateFilter.stories.tsx` Section 7 포함 | E-01: Storybook story 파일이 Section 7 implementFiles에 필수 등재 |
| D6  | `startOfDay(from)` / `endOfDay(to)` 자정 정규화; 로컬 타임존 (UTC 변환 없음) | AC-004: 당일 포함 여부 명확화; `isWithinInterval`은 양끝 inclusive — from=startOfDay, to=endOfDay 정규화로 당일 전체 포함 보장 |
| D7  | 단일 bound 필터링: from-only → `cell ≥ startOfDay(from)`, to-only → `cell ≤ endOfDay(to)`, 양쪽 모두 undefined → autoRemove | AC-003: 단방향 bound는 필터 유지(활성); 양쪽 모두 undefined만 autoRemove |
| D8  | ADR 파일 `.claude/tw-grid/decisions/MOD-GRID-09-decisions.md` (NEW) | C-9/C-20: 신규 peerDep 추가 시 ADR 필수; 기존 decisions/ 디렉토리 MOD-GRID-00~05 패턴 준수 |
| D9  | G-001 FilterPopover/FilterIndicator 재사용 (MODIFY 없음) | DRY; G-002가 동일 패턴으로 재사용 완료; popover 외부클릭/Escape 동작 그대로 상속 |
| D10 | 한국어 로케일: `import { ko } from 'date-fns/locale'` + `registerLocale('ko', ko)` in DateFilter.tsx | date-fns v4 named export 방식; path import 아님; UX 한국어 달력 표시 |
| D11 | implementFiles 7행: NEW 3 + MODIFY 4 | DateFilter.tsx(NEW), DateFilter.stories.tsx(NEW), decisions/MOD-GRID-09-decisions.md(NEW), filterFns.ts(MODIFY), types.ts(MODIFY), index.ts(MODIFY), package.json(MODIFY) |
| D12 | cell value 타입: ISO string / Date instance / number(epoch ms) 지원; `new Date(cell)` 변환 후 `isNaN` guard | API 응답은 주로 ISO string; Date instance + epoch ms(숫자) 도 `new Date(n)` 변환 허용; 변환 실패(NaN) → false |

---

## Section 1 — Goal Summary

DateFilter 컴포넌트를 구현한다. 사용자가 날짜 범위(from/to)를 선택하면 `column.setFilterValue`를 통해 TanStack Table 행 필터링이 수행된다.

**핵심 요구사항:**
- `react-datepicker` 기반 날짜 선택 UI (range picker: from/to 2개 DatePicker)
- `date-fns` `isWithinInterval` / `startOfDay` / `endOfDay` 기반 `dateRangeFilterFn`
- 단일 bound(from-only 또는 to-only) 필터링 지원
- `FilterPopover` + `FilterIndicator` 재사용 (G-001에서 구현된 컴포넌트)
- `package.json` peerDependencies에 `react-datepicker`, `date-fns` 추가

**참조 추적성 (A-01 N/A 명시):**
- L0 (tw-framework-front 현 구현): N/A — DateFilter는 `packages/grid-features` 신규 컴포넌트. tw-framework-front의 8 grid variants(BaseGrid/VirtualGrid/ColumnPinGrid/GroupedHeaderGrid/TreeGrid/EditableGrid/ChangeTrackingGrid/RangeSelectGrid) 어디에도 DateFilter 직접 구현 없음. 현 Grid 코드에서 날짜 필터 기능은 구현 공백(critical-gap)에 해당.
- L1 (TanStack v8): `FilterFn<unknown>`, `column.setFilterValue`, `column.getFilterValue`, `getFilteredRowModel` 표준 API 사용. `filterFn.autoRemove` 패턴은 TanStack 공식 `autoRemoveFn` 규약 준수.
- L2 (공통 컴포넌트 구조): N/A — DateFilter는 grid-features 패키지 신규 컴포넌트. tw-framework-front 8 grid variant에 직접 통합되지 않음. G-001 FilterPopover/FilterIndicator는 재사용(import)하지만 수정 없음. 8 variant 호환성 분석은 Section 4.7 참조.
- L3 (영향 사용처): N/A — 신규 컴포넌트로 현재 사용처 0개. 소비자가 column `filterFn: dateRangeFilterFn` 및 `<DateFilter column={col} />`를 헤더에 추가하는 opt-in 방식.
- R-A (AG Grid): AG Grid Community DateFilter 패턴 참조 — `feature-gap-matrix.md §2`. range picker UX (from/to 2 DatePicker + 양끝 inclusive) 동등성을 보장하기 위해 채택.
- R-W (Wijmo): Wijmo DateFilter range 패턴 참조 — `feature-gap-matrix.md §3`. 단일 bound(from-only / to-only) 허용 + 당일 inclusive 정책을 Wijmo 동작에 정렬.

**migrationImpact**: medium — DateFilter는 `packages/grid-features` 신규 컴포넌트이며 영향 사용처 0개(affectedUsageFiles: []). 단 `react-datepicker` + `date-fns` peerDep 추가로 인한 소비자 의존성 영향 + 4개 인프라 파일(tsconfig/tsup/size-limit/root pkg) drift 가능성으로 medium 분류 (자세히는 G-003 goals.json `migrationImpact` 필드 + harnessReview lessonsLearned 참조).

---

## Section 2 — Acceptance Criteria

| ID     | 내용 |
|--------|------|
| AC-001 | `DateFilterValue` 타입: `{ from?: Date; to?: Date }` — 양쪽 모두 선택적 |
| AC-002 | `dateRangeFilterFn`: `FilterFn<unknown>` 구현; `isWithinInterval` (inclusive), `startOfDay`/`endOfDay` 자정 정규화; null-safe/NaN-safe; autoRemove: from과 to 모두 undefined |
| AC-003 | 단일 bound 지원: from-only → `cell ≥ startOfDay(from)`, to-only → `cell ≤ endOfDay(to)` |
| AC-004 | 당일 전체 포함: from 당일 00:00:00 ~ to 당일 23:59:59.999 (startOfDay/endOfDay) |
| AC-005 | `FilterPopover` + `FilterIndicator` 재사용 (새로 구현하지 않음) |
| AC-006 | `package.json`에 `react-datepicker ^8.3.0`, `date-fns ^4.1.0` peerDependencies 추가 |
| AC-007 | `index.ts`에 `DateFilter`, `dateRangeFilterFn`, `DateFilterValue`, `DateFilterProps` export |

---

## Section 3 — Non-Functional Requirements

| 항목 | 요구사항 |
|------|----------|
| 타입 안전 | C-4: `any` 금지 — `Column<TData, unknown>`, `FilterFn<unknown>` 사용 |
| 번들 | C-22: react-datepicker/date-fns peerDependency (소비자 이미 보유, 중복 번들 없음) |
| 스타일 | C-5: grid-features 내부 CSS import 금지; 소비자가 `react-datepicker/dist/react-datepicker.css` import |
| TreeShaking | C-22: named export만 사용; side-effect 없는 filterFn |
| Optional Props | C-29: `exactOptionalPropertyTypes: true` — optional prop 하위 전달 시 spread-skip 패턴 |
| ADR | C-9/C-20: 신규 peerDep 추가 → decisions/MOD-GRID-09-decisions.md 작성 |
| 타임존 | D6: 로컬 타임존 기준 자정 정규화 (UTC 변환 없음) |

---

## Section 4 — Design Decisions

### 4.1 DateFilterValue 타입 설계

```typescript
export interface DateFilterValue {
  from?: Date;
  to?: Date;
}
```

`from` / `to` 모두 선택적. 양쪽 모두 undefined → autoRemove (필터 해제). 단방향 bound는 필터 유지.

### 4.2 dateRangeFilterFn 설계

- cell value: `unknown` — `Date` instance, ISO string, 또는 number(epoch ms)를 `new Date(cell)` 변환 후 `isNaN` guard
- 자정 정규화: `startOfDay(from)` / `endOfDay(to)` — 당일 전체 포함
- 단일 bound: from-only → `cellDate >= startOfDay(from)`, to-only → `cellDate <= endOfDay(to)`
- 양쪽 bound: `isWithinInterval(cellDate, { start: startOfDay(from), end: endOfDay(to) })`
- autoRemove: `!val || (val.from === undefined && val.to === undefined)`

### 4.3 CSS 전략 (C-5 준수)

grid-features 내부에서 `react-datepicker/dist/react-datepicker.css` import **금지**.
소비자(tw-framework-front)가 앱 엔트리(main.tsx 등)에서 직접 import:

```typescript
// 소비자 앱 main.tsx (grid-features 외부)
import 'react-datepicker/dist/react-datepicker.css';
```

### 4.4 FilterPopover 재사용 전략

G-001에서 구현된 `FilterPopover`를 그대로 사용. `aria-label="텍스트 필터"` hardcoded지만 DateFilter에서 오버라이드 불가 (기존 API 변경 금지 — C-6). 기능 동작(외부클릭/Escape) 동일.

### 4.5 한국어 로케일

```typescript
import { ko } from 'date-fns/locale'; // date-fns v4 named export (path import 아님)
import DatePicker, { registerLocale } from 'react-datepicker';

registerLocale('ko', ko); // 모듈 레벨 1회 등록
```

### 4.6 C-29 spread-skip 패턴 (optional prop 전달)

```typescript
// popoverAlign이 undefined인 경우 prop 자체를 전달하지 않음
const popoverProps = {
  trigger: <button>...</button>,
  children: <div>...</div>,
  ...(props.popoverAlign !== undefined ? { align: props.popoverAlign } : {}),
};
```

### 4.7 8 Variant Overlap 분석 (A-03)

DateFilter는 `packages/grid-features` 신규 컴포넌트로 8 variant에 직접 수정 없이 opt-in 방식으로 추가된다. 각 variant의 호환성 분석:

| Variant | 파일 | DateFilter 호환 | 주의사항 |
|---------|------|----------------|---------|
| **BaseGrid** | `Grid/BaseGrid.tsx` | 호환 — `filterFn: dateRangeFilterFn` + `<DateFilter column={col} />` 헤더에 추가 | `getFilteredRowModel()` 이미 등록되어 있어야 함 |
| **VirtualGrid** | `Grid/VirtualGrid.tsx` | 호환 — C-18 가상화와 충돌 없음; DateFilter는 헤더 UI만 관여, 행 렌더는 가상화 로직 독립 | 대용량 필터링 재계산은 TanStack 내부 메모이제이션으로 처리 |
| **ColumnPinGrid** | `Grid/ColumnPinGrid.tsx` | 호환 — sticky 핀 컬럼 헤더에 DateFilter 배치 가능 | FilterPopover z-index가 pinned 컬럼 경계 위에 렌더되어야 함 (`z-50` 이상 확인) |
| **GroupedHeaderGrid** | `Grid/GroupedHeaderGrid.tsx` | 조건부 호환 — 리프 컬럼 헤더에만 DateFilter 배치 | 그룹 헤더 행(상위)에는 FilterIndicator 미표시; 리프 헤더 셀에만 `<DateFilter>` 권장 |
| **TreeGrid** | `Grid/TreeGrid.tsx` | 부분 호환 — 부모-자식 행 모두 filterFn 적용 | 자식 행 필터 정책은 소비자가 `filterFromLeafRows: true` TanStack 옵션으로 제어; DateFilter 자체 수정 불필요 |
| **EditableGrid** | `Grid/EditableGrid.tsx` | 호환 — 인라인 편집과 날짜 필터 독립 작동 | 편집 중 필터로 행 숨김 UX는 EditableGrid 소비자 책임 |
| **ChangeTrackingGrid** | `Grid/ChangeTrackingGrid.tsx` | 호환 — changeSet과 필터링 독립 작동 | 필터로 숨겨진 행의 변경 사항은 changeSet에 계속 포함 |
| **RangeSelectGrid** | `Grid/RangeSelectGrid.tsx` | 호환 — 셀 범위 선택과 날짜 필터 독립 작동 | 필터 후 row index 재매핑은 RangeSelectGrid 소비자 책임 |

**결론**: DateFilter는 8 variant에 **수정 없이** opt-in 방식으로 적용 가능. GroupedHeaderGrid와 TreeGrid에서 UX 정책 주의사항 있으나, DateFilter 컴포넌트 자체는 변경 불필요.

---

## Section 5 — Truth Table (dateRangeFilterFn)

C-30: 모든 입력 조합에 대한 결과를 명시.

| # | cell value | from | to | 결과 | 비고 |
|---|-----------|------|----|------|------|
| T1 | `null` | any | any | `false` | null-safe |
| T2 | `undefined` | any | any | `false` | null-safe |
| T3 | `"invalid"` | any | any | `false` | NaN-safe (new Date("invalid").getTime() isNaN) |
| T4 | ISO `"2026-05-14"` | `undefined` | `undefined` | autoRemove | 필터 자동 해제 |
| T5 | ISO `"2026-05-14"` | `new Date("2026-05-01")` | `undefined` | `true` | from-only: cell ≥ startOfDay(from); 5월 14일 ≥ 5월 1일 |
| T6 | ISO `"2026-04-30"` | `new Date("2026-05-01")` | `undefined` | `false` | from-only: cell < startOfDay(from) |
| T7 | ISO `"2026-05-14"` | `undefined` | `new Date("2026-05-31")` | `true` | to-only: cell ≤ endOfDay(to) |
| T8 | ISO `"2026-06-01"` | `undefined` | `new Date("2026-05-31")` | `false` | to-only: cell > endOfDay(to) |
| T9 | ISO `"2026-05-14"` | `new Date("2026-05-01")` | `new Date("2026-05-31")` | `true` | 양쪽 bound; isWithinInterval 통과 |
| T10 | ISO `"2026-04-30"` | `new Date("2026-05-01")` | `new Date("2026-05-31")` | `false` | 양쪽 bound; range 이전 |
| T11 | ISO `"2026-06-01"` | `new Date("2026-05-01")` | `new Date("2026-05-31")` | `false` | 양쪽 bound; range 이후 |
| T12 | ISO `"2026-05-01"` | `new Date("2026-05-01")` | `new Date("2026-05-01")` | `true` | 양쪽 동일일; startOfDay~endOfDay → 당일 전체 포함 (inclusive) |
| T13 | `new Date("2026-05-14")` | `new Date("2026-05-01")` | `new Date("2026-05-31")` | `true` | cell이 Date instance — new Date(cell) 그대로 사용 |
| T14 | `1715644800000` (epoch ms) | `new Date("2024-05-01")` | `new Date("2024-05-31")` | `true` | cell이 숫자 — new Date(number) 변환; 2024-05-14 UTC에 해당 (epoch 1715644800000 = 2024-05-14) |

---

## Section 6 — Edge Cases

| # | 케이스 | 처리 |
|---|--------|------|
| E1 | `from > to` (역전 범위) | `isWithinInterval`이 `RangeError` throw — DateFilter UI에서 from > to 선택 방지 (`maxDate` 제약으로 예방); filterFn에서는 try-catch로 catch → `false` 반환 |
| E2 | cell이 ISO string이지만 날짜 부분만 (`"2026-05-14"`) | `new Date("2026-05-14")`는 UTC 자정으로 파싱됨; `startOfDay`/`endOfDay`는 로컬 타임존 기준이므로 로컬 타임존이 UTC+0 이외면 경계에서 포함/제외 차이 발생 가능 — 주의사항으로 spec에 기재, 수정하지 않음 (D6: 로컬 타임존 기준) |
| E3 | `from`과 `to`가 같은 날짜인 경우 | `startOfDay(from)` ~ `endOfDay(to)` → 당일 00:00:00 ~ 23:59:59.999 — 당일 전체 rows 포함 (T12) |
| E4 | cell이 빈 문자열 `""` | `new Date("")` → Invalid Date → `isNaN` → `false` |
| E5 | react-datepicker에서 날짜 초기화(x 버튼) | `column.setFilterValue(undefined)` 호출 → autoRemove 발동 → 전체 rows 표시 |

---

## Section 7 — Implementation Files

| 파일 경로 (monorepo 기준) | 상태 | 근거 |
|--------------------------|------|------|
| `packages/grid-features/src/filter-ui/DateFilter.tsx` | NEW | AC-001~005; DateFilter 컴포넌트 본체 — D1 |
| `packages/grid-features/src/filter-ui/DateFilter.stories.tsx` | NEW | E-01 v1.0.6 Storybook 바인딩 — D5 |
| `.claude/tw-grid/decisions/MOD-GRID-09-decisions.md` | NEW | C-9/C-20 ADR; react-datepicker + date-fns peerDep — D8 |
| `packages/grid-features/src/filter-ui/filterFns.ts` | MODIFY | AC-002: `dateRangeFilterFn` 추가 — D9 |
| `packages/grid-features/src/filter-ui/types.ts` | MODIFY | AC-001: `DateFilterValue`, `DateFilterProps` 추가 — D9 |
| `packages/grid-features/src/index.ts` | MODIFY | AC-007: `DateFilter`, `dateRangeFilterFn`, types export — D11 |
| `packages/grid-features/package.json` | MODIFY | AC-006: `react-datepicker`, `date-fns` peerDep 추가 — D2/D3 |

---

## Section 8 — TypeScript Interface Contract

### 8.1 DateFilterValue (types.ts MODIFY)

```typescript
/**
 * TanStack columnFilters에 저장되는 DateFilter 값.
 * `column.setFilterValue(v: DateFilterValue | undefined)` 로 설정.
 * - from?: 범위 시작일 (inclusive, startOfDay 정규화)
 * - to?: 범위 종료일 (inclusive, endOfDay 정규화)
 * - 양쪽 모두 undefined = 필터 해제 (autoRemove)
 */
export interface DateFilterValue {
  from?: Date;
  to?: Date;
}
```

### 8.2 DateFilterProps (types.ts MODIFY)

```typescript
/**
 * DateFilter 컴포넌트 Props.
 *
 * @template TData - TanStack Row data 타입.
 * C-4: Column<TData, unknown> — cell value 타입 unknown (any 방지).
 * C-29: optional prop spread-skip 패턴 적용 (popoverAlign).
 */
export interface DateFilterProps<TData> {
  /** TanStack Column 인스턴스. Column<TData, unknown>. */
  column: Column<TData, unknown>;
  /**
   * 팝오버 정렬 — 기본 'left'.
   * C-29: optional prop — FilterPopover align으로 spread-skip 전달.
   */
  popoverAlign?: 'left' | 'right';
}
```

### 8.3 dateRangeFilterFn 시그니처 (filterFns.ts MODIFY)

```typescript
export const dateRangeFilterFn: FilterFn<unknown>;
dateRangeFilterFn.autoRemove: (val: DateFilterValue | undefined) => boolean;
```

### 8.4 package.json peerDependencies 추가

```json
{
  "peerDependencies": {
    "@tanstack/react-table": "^8.0.0",
    "@tanstack/react-virtual": "^3.0.0",
    "date-fns": "^4.1.0",
    "react": "^18.0.0 || ^19.0.0",
    "react-datepicker": "^8.3.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "peerDependenciesMeta": {
    "@tanstack/react-virtual": {
      "optional": true
    }
  }
}
```

---

## Section 9 — index.ts Export Plan

`packages/grid-features/src/index.ts` MODIFY — 기존 51줄 이후 추가:

```typescript
// MOD-GRID-09: filter-ui — DateFilter (G-003)
export { DateFilter } from './filter-ui/DateFilter';
export { dateRangeFilterFn } from './filter-ui/filterFns';
export type {
  DateFilterValue,
  DateFilterProps,
} from './filter-ui/types';
```

---

## Section 10 — Component Render Tree

```
DateFilter<TData>
├── FilterIndicator (재사용, G-001)   ← 파란 dot; isFiltered={column.getIsFiltered()}
└── FilterPopover (재사용, G-001)
    ├── trigger: <button aria-label="날짜 필터" aria-pressed={column.getIsFiltered()}>
    │              날짜 범위 요약 텍스트 or "날짜 필터"
    │           </button>
    └── children: <div className="p-3 space-y-2">
        ├── <label>시작일</label>
        ├── <DatePicker> (from, locale="ko", selectsStart)
        │   ├── selected: filterValue?.from ?? null
        │   ├── onChange: (date) => setFrom(date)
        │   ├── maxDate: filterValue?.to (from > to 방지)
        │   └── placeholderText: "시작일"
        ├── <label>종료일</label>
        ├── <DatePicker> (to, locale="ko", selectsEnd)
        │   ├── selected: filterValue?.to ?? null
        │   ├── onChange: (date) => setTo(date)
        │   ├── minDate: filterValue?.from (역전 방지)
        │   └── placeholderText: "종료일"
        └── <button onClick: clearFilter> 초기화
```

**상태 관리:**
- `filterValue = column.getFilterValue() as DateFilterValue | undefined`
- from/to 변경 시 즉시 `column.setFilterValue({ from, to })` — debounce 없음 (날짜 선택은 discrete event)
- 양쪽 모두 clear → `column.setFilterValue(undefined)`

---

## Section 11 — Constraints Checklist

| Constraint | 적용 내용 | 참조 |
|------------|----------|------|
| C-4 no any | `Column<TData, unknown>`, `FilterFn<unknown>`, `Row<TData>` — any 없음 | Sec 8 |
| C-5 Tailwind only | grid-features 내부 CSS import 금지; 소비자가 react-datepicker CSS import | D4 |
| C-6 no breaking change | FilterPopover/FilterIndicator API 변경 없음; 기존 exports 유지 | Sec 9 |
| C-9 ADR for new deps | decisions/MOD-GRID-09-decisions.md 신규 작성 | D8 |
| C-20 peerDep ADR | react-datepicker + date-fns 추가 근거 ADR 포함 | D2/D3/D8 |
| C-22 peerDependencies | react-datepicker, date-fns를 peerDep으로 (dependencies 아님) | Sec 8.4 |
| C-28 path correction | `topvel-grid-monorepo/packages/grid-features/` | D1 |
| C-29 exactOptional | `popoverAlign` spread-skip 패턴 | D10, Sec 4.6 |
| C-30 truth table | Section 5 T1~T14 완전 커버 | Sec 5 |
| C-31 wiring audit | `dateRangeFilterFn` → Sec 12 Usage Example + Storybook `columnDef.filterFn: dateRangeFilterFn` | Sec 12 |

---

## Section 12 — Usage Examples

### 예시 1: 기본 날짜 범위 필터 (both bounds)

```typescript
import { useReactTable, createColumnHelper, getCoreRowModel, getFilteredRowModel } from '@tanstack/react-table';
import { DateFilter, dateRangeFilterFn } from '@tomis/grid-features';
import type { DateFilterValue } from '@tomis/grid-features';
// 소비자 앱 엔트리에서 CSS import (grid-features 아님)
// import 'react-datepicker/dist/react-datepicker.css';

interface Order {
  id: number;
  orderDate: string; // ISO 8601 string from API
  amount: number;
}

const columnHelper = createColumnHelper<Order>();

const columns = [
  columnHelper.accessor('orderDate', {
    filterFn: dateRangeFilterFn, // C-31 wiring
    header: ({ column }) => (
      <div>
        주문일
        <DateFilter column={column} />
      </div>
    ),
  }),
  columnHelper.accessor('id', { header: 'ID' }),
  columnHelper.accessor('amount', { header: '금액' }),
];

function OrderTable({ data }: { data: Order[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // 2026-05-01 ~ 2026-05-31 사이 주문만 표시
  // → DateFilter UI에서 사용자가 날짜 선택 시 자동 처리
  // 또는 programmatic 설정:
  // table.getColumn('orderDate')?.setFilterValue({ from: new Date('2026-05-01'), to: new Date('2026-05-31') } satisfies DateFilterValue);

  return <table>...</table>;
}
```

### 예시 2: 단일 bound (from-only, to-only) + popoverAlign

```typescript
import { DateFilter, dateRangeFilterFn } from '@tomis/grid-features';
import type { DateFilterValue } from '@tomis/grid-features';

// from-only: 특정 날짜 이후 행만 표시
function setFromOnly(column: Column<Order, unknown>, date: Date) {
  column.setFilterValue({ from: date } satisfies DateFilterValue);
  // to: undefined → to-only bound 없음 → from 이후 모든 rows 포함
}

// to-only: 특정 날짜 이전 행만 표시
function setToOnly(column: Column<Order, unknown>, date: Date) {
  column.setFilterValue({ to: date } satisfies DateFilterValue);
  // from: undefined → from bound 없음 → to 이전 모든 rows 포함
}

// 오른쪽 정렬 팝오버
const columns = [
  columnHelper.accessor('orderDate', {
    filterFn: dateRangeFilterFn, // C-31 wiring
    header: ({ column }) => (
      <DateFilter
        column={column}
        popoverAlign="right" // C-29: spread-skip 패턴으로 FilterPopover align에 전달
      />
    ),
  }),
];
```

### 예시 3: 당일 하루만 필터 (from === to)

```typescript
// 특정 날짜 하루 전체 포함 (T12 케이스)
const today = new Date();
column.setFilterValue({
  from: today, // startOfDay(today) 정규화 → 00:00:00
  to: today,   // endOfDay(today) 정규화 → 23:59:59.999
} satisfies DateFilterValue);
// → 당일 전체 rows 포함 (inclusive both ends)
```

### Before/After 비교 (E-02)

**Before** — DateFilter 없이 소비자가 날짜 필터 UI를 직접 구현하는 경우:

```typescript
// Before: 소비자 코드에서 날짜 필터 UI 직접 구현 (G-003 이전 패턴)
import { useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';

registerLocale('ko', ko);

function OrderTableHeader({ column }: { column: Column<Order, unknown> }) {
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);

  const handleFromChange = (date: Date | null) => {
    setFrom(date);
    if (!date && !to) {
      column.setFilterValue(undefined);
    } else {
      column.setFilterValue({ from: date ?? undefined, to: to ?? undefined });
    }
  };

  const handleToChange = (date: Date | null) => {
    setTo(date);
    if (!from && !date) {
      column.setFilterValue(undefined);
    } else {
      column.setFilterValue({ from: from ?? undefined, to: date ?? undefined });
    }
  };

  // filterFn도 직접 작성 필요 (null-safe, NaN-safe, RangeError catch, autoRemove...)
  // 각 컬럼마다 반복 작성 → 코드 중복 + 일관성 결여
  return (
    <div>
      <DatePicker selected={from} onChange={handleFromChange} locale="ko" placeholderText="시작일" />
      <DatePicker selected={to} onChange={handleToChange} locale="ko" placeholderText="종료일" />
      <button onClick={() => { setFrom(null); setTo(null); column.setFilterValue(undefined); }}>초기화</button>
    </div>
  );
}

// columnDef에도 filterFn 직접 작성
const columns = [
  columnHelper.accessor('orderDate', {
    filterFn: (row, columnId, filterValue) => {
      // null-safe, NaN-safe, RangeError catch 등 모두 직접 구현
      const { from, to } = filterValue ?? {};
      const cell = row.getValue(columnId);
      const cellDate = new Date(cell as string);
      if (isNaN(cellDate.getTime())) return false;
      try {
        if (from && to) return isWithinInterval(cellDate, { start: startOfDay(from), end: endOfDay(to) });
        if (from) return cellDate >= startOfDay(from);
        if (to) return cellDate <= endOfDay(to);
      } catch { return false; }
      return true;
    },
    header: ({ column }) => <OrderTableHeader column={column} />,
  }),
];
```

**After** — G-003 `<DateFilter>` + `dateRangeFilterFn` 사용:

```typescript
// After: G-003 DateFilter 사용 (소비자 코드 최소화)
import { DateFilter, dateRangeFilterFn } from '@tomis/grid-features';
// import 'react-datepicker/dist/react-datepicker.css'; // 앱 엔트리에서 1회

const columns = [
  columnHelper.accessor('orderDate', {
    filterFn: dateRangeFilterFn, // null-safe/NaN-safe/RangeError/autoRemove 모두 내장
    header: ({ column }) => (
      <div>
        주문일
        <DateFilter column={column} /> {/* 한국어 locale, from/to DatePicker, 초기화 버튼 내장 */}
      </div>
    ),
  }),
];
// 모든 날짜 컬럼에 동일하게 재사용 — 구현 중복 0
```

---

## Section 13 — Commercial Impact

| 항목 | 내용 |
|------|------|
| 신규 exports | `DateFilter`, `dateRangeFilterFn`, `DateFilterValue`, `DateFilterProps` |
| Breaking change | 없음 — 기존 exports 변경 없음 (G-001/G-002 호환 유지) |
| 번들 영향 | react-datepicker + date-fns peerDep → 소비자 번들 중복 없음; grid-features 자체 번들 증가 없음 |
| CSS 부담 | 소비자가 `react-datepicker/dist/react-datepicker.css` (~20KB) 직접 추가 — 명시적 opt-in |
| 라이선스 | react-datepicker MIT, date-fns MIT — 상업적 사용 가능 |
| 타임존 | 로컬 타임존 기준; UTC+0 아닌 환경에서 ISO date-only string 경계 주의 (E2) |
| 접근성 제한 | `FilterPopover`의 `aria-label="텍스트 필터"` hardcoded — DateFilter에서 오버라이드 불가 (C-6: breaking change 금지). 스크린 리더에서 "텍스트 필터"로 읽힘. 향후 API 확장 시 수정 예정 (deferred) |

### 문서 계획 (F-03 / C-25)

C-25 의무: Docusaurus 페이지 + Storybook story 최소 1개.

**Docusaurus 페이지 경로** (`apps/docs` — MOD-GRID-99-B 패키지 대상):

| 언어 | 경로 |
|------|------|
| 한국어 (기본) | `apps/docs/docs/filter-ui/date-filter.mdx` |
| 영어 | `apps/docs/i18n/en/docusaurus-plugin-content-docs/current/filter-ui/date-filter.mdx` |

페이지 내용 계획 (C-25 준수):
- API reference: `DateFilterProps`, `DateFilterValue`, `dateRangeFilterFn` 시그니처 (TypeDoc 자동 생성 후 보완)
- 사용 예시: 기본 범위 필터, 단일 bound, 당일 필터 (Section 12 예시 재활용)
- CSS 설정 안내: 소비자 `react-datepicker/dist/react-datepicker.css` import 방법
- 타임존 주의사항 (E2)
- peerDependency 설치 안내: `npm install react-datepicker date-fns`

**Storybook story 파일**: `packages/grid-features/src/filter-ui/DateFilter.stories.tsx` (Section 7 포함 — D5)
- story 1: BasicRange (from + to)
- story 2: FromOnly, ToOnly
- story 3: SameDay
- story 4: PopoverAlign right

---

## Section 14 — Implementation Plan

### Phase A: 타입 + filterFn

1. `types.ts` MODIFY — `DateFilterValue`, `DateFilterProps` 추가 (Section 8.1/8.2)
   - **verify**: `tsc --noEmit` 통과; 기존 TextFilterValue/NumberFilterValue 타입 영향 없음
2. `filterFns.ts` MODIFY — `dateRangeFilterFn` 추가 (Section 4.2, Section 5 truth table 기반)
   - `import type { DateFilterValue } from './types'` 추가
   - `isWithinInterval`, `startOfDay`, `endOfDay` from `date-fns`
   - from-only / to-only / both / null-safe / NaN-safe / try-catch(RangeError)
   - `dateRangeFilterFn.autoRemove` 등록
   - **verify**: T1~T14 수동 테스트 (node --input-type=module 또는 vitest)

### Phase B: DateFilter 컴포넌트 UI

3. `DateFilter.tsx` NEW — DateFilter 컴포넌트 본체 (Section 10 render tree)
   - `import DatePicker, { registerLocale } from 'react-datepicker'`
   - `import { ko } from 'date-fns/locale'` + `registerLocale('ko', ko)` 모듈 레벨
   - `FilterPopover` + `FilterIndicator` import (재사용)
   - from/to DatePicker, maxDate/minDate 역전 방지
   - 초기화 버튼: `column.setFilterValue(undefined)`
   - C-29 spread-skip: popoverAlign 전달
   - **verify**: 렌더링 확인 (tsx 빌드 통과); FilterPopover 외부클릭/Escape 동작 수동 확인

### Phase C: index.ts + package.json + Storybook + ADR

4. `index.ts` MODIFY — Section 9 exports 추가
   - **verify**: `tsc --noEmit` 통과; 기존 exports import 없이 추가만 되었는지 확인
5. `package.json` MODIFY — peerDependencies에 `react-datepicker ^8.3.0`, `date-fns ^4.1.0` 추가 (Section 8.4)
   - **verify**: `npm install`(또는 pnpm) 실행 후 peer 경고 없음
6. `DateFilter.stories.tsx` NEW — Storybook stories
   - story 1: BasicRange (from + to 선택)
   - story 2: FromOnly (to=undefined)
   - story 3: ToOnly (from=undefined)
   - story 4: SameDay (from===to)
   - `columnDef.filterFn: dateRangeFilterFn` 명시 (C-31 wiring)
   - **verify**: Storybook 빌드 통과
7. `decisions/MOD-GRID-09-decisions.md` NEW — ADR (C-9/C-20)
   - react-datepicker ADR: 대안(vanilla DatePicker 직접 구현 / @headlessui/react), 거부 이유, 라이선스, 번들 영향
   - date-fns ADR: 대안(dayjs / luxon), 거부 이유(tw-framework-front 이미 사용 중), 라이선스
   - CSS 전략 ADR: D4 내용 공식 기록
   - **verify**: 파일 생성 + decisions/ 디렉토리 패턴 준수 확인

---

## Section 15 — Verification Plan

### 15.1 Unit Tests (filterFns.ts)

Section 5 Truth Table T1~T14 각 케이스를 단위 테스트로 커버:

| 테스트 그룹 | 케이스 |
|------------|--------|
| null/undefined cell | T1, T2 |
| invalid string cell | T3 |
| autoRemove | T4 |
| from-only | T5, T6 |
| to-only | T7, T8 |
| both bounds | T9, T10, T11 |
| same-day (inclusive) | T12 |
| Date instance cell | T13 |
| numeric epoch cell | T14 |
| RangeError (from > to) | E1 — catch → false |
| empty string cell | E4 |
| autoRemove fn check | `dateRangeFilterFn.autoRemove(undefined) === true`, `autoRemove({ from: d }) === false` |

### 15.2 Storybook Manual Check

- BasicRange: DatePicker로 from/to 선택 → 범위 내 rows만 표시 확인
- FromOnly: to 없이 from만 선택 → from 이후 rows 확인
- ToOnly: from 없이 to만 선택 → to 이전 rows 확인
- SameDay: from === to → 당일 rows 포함 확인
- Clear: 초기화 버튼 → 전체 rows 복원 확인
- PopoverAlign: `popoverAlign="right"` 적용 확인
- Korean locale: DatePicker 달력이 한국어로 표시되는지 확인

### 15.3 Build Verification

```powershell
# packages/grid-features 디렉토리에서 (Windows)
npm run typecheck   # tsc --noEmit — 타입 오류 없음
npm run build       # tsup — dist 생성 성공
# Storybook 빌드
npx storybook build  # 빌드 성공 (stories 인식)
```

### 15.4 Export Verification

```typescript
// 소비자 앱에서 named import 가능 확인
import {
  DateFilter,
  dateRangeFilterFn,
} from '@tomis/grid-features';
import type {
  DateFilterValue,
  DateFilterProps,
} from '@tomis/grid-features';
```

---

## Self-Review Checklist

| # | 체크 항목 | 결과 |
|---|----------|------|
| R1 | Section 12 usage examples ≥2 | ✓ 3개 (basic range, single bound + popoverAlign, same-day) |
| R2 | Section 14 Implementation Plan ≥2 phases | ✓ Phase A/B/C (3단계) |
| R3 | Section 15 Verification Plan 포함 | ✓ unit tests + Storybook + build |
| R4 | Section 5 Truth Table C-30 compliant | ✓ T1~T14 (14케이스) |
| R5 | Section 7 implementFiles 7행 | ✓ NEW 3 + MODIFY 4 |
| R6 | C-31 wiring: dateRangeFilterFn 호출처 명시 | ✓ Sec 12 Examples + Storybook columnDef |
| R7 | D# log ↔ Section 7 1:1 cross-reference | ✓ 모든 파일에 D# 근거 있음 |
| R8 | Section 11 Constraints Checklist: C-5/C-9/C-20/C-22/C-28/C-29/C-30/C-31 포함 | ✓ |
| R9 | ADR 경로: `.claude/tw-grid/decisions/MOD-GRID-09-decisions.md` | ✓ 기존 패턴 준수 |
| R10 | cell value 타입 (ISO string + Date instance): truth table + filterFn 설계 명시 | ✓ D12, Sec 4.2, T13/T14 |
| R11 | single-bound autoRemove semantics 명시 | ✓ D7, Sec 4.1, Sec 5 T5~T8 |
| R12 | Section 6 Edge Cases ≥3 | ✓ E1~E5 (5케이스) |
| R13 | date-fns v4 import 방식 명시 | ✓ D10, Sec 4.5 |
| R14 | C-29 spread-skip 패턴 예시 포함 | ✓ Sec 4.6, Sec 12 예시 2 |
| R15 | Section 8.4 package.json 전체 peerDependencies 구조 명시 | ✓ |
