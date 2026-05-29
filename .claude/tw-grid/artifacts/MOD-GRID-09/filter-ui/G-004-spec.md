# G-004 Spec — SelectFilter + GlobalSearchInput + FilterResetButton

**Module**: MOD-GRID-09 / filter-ui  
**Goal ID**: G-004  
**Title**: SelectFilter (다중선택 체크박스) + GlobalSearch 박스 + 필터 전체 초기화  
**Priority**: P1 | **Migration Impact**: medium | **Threshold**: 90  
**Depends On**: G-001, G-002, G-003  
**Spec Version**: 1.0.0  
**Date**: 2026-05-14  
**Status**: DRAFT

---

## D# Decision Log (Pre-Writing)

| ID | 결정 | 근거 |
|----|------|------|
| D1 | C-28 경로: `topvel-grid-monorepo/packages/grid-features/` 사용 (TOMIS 아님) | C-28 monorepo 경로 강제 |
| D2 | `filterFns.arrIncludes` re-export as `selectFilterFn` — custom logic 0줄 | C-2 최소구현, tree-shaking 유지 |
| D3 | `getFacetedRowModel()` / `getFacetedUniqueValues()` NOT in BaseGrid → consumer 등록 의무 | BaseGrid.tsx Grep 확인 |
| D4 | 50+ 옵션 → internal search 자동 노출 (`useState` + `String.includes`, 신규 dep 없음) | AC-003 spec |
| D5 | GlobalSearchInput debounce 300ms: `useEffect + setTimeout` (신규 dep 0) | AC-004 spec |
| D6 | FilterResetButton: `columnFilters.length === 0 && !globalFilter` → disabled | AC-005 disabled 조건 |
| D7 | stories: SelectFilter.stories.tsx + GlobalSearchInput.stories.tsx (FilterResetButton 동작은 SelectFilter story에 통합) | AC-007, 파일 수 8 유지 |
| D8 | 신규 peerDep 없음 → decisions/MOD-GRID-09-decisions.md 미수정 | react-select/fuse.js/cmdk 미도입 |
| D9 | implementFiles = NEW 5 + MODIFY 3 = 8개 총계 | G-01 v1.0.4 D# breakdown 1:1 |

---

## Section 1 — Goal Summary

### 1.1 목표

G-004는 MOD-GRID-09 filter-ui 서브패키지의 네 번째 Goal로, 세 가지 신규 컴포넌트를 추가한다.

| 컴포넌트 | 역할 | TanStack API |
|----------|------|--------------|
| `SelectFilter` | 칼럼별 다중선택 체크박스 필터 | `column.getFacetedUniqueValues()`, `column.setFilterValue(string[])` |
| `GlobalSearchInput` | 전체 행 검색 (debounce 300ms) | `table.setGlobalFilter(value)` |
| `FilterResetButton` | 모든 칼럼 필터 + 전역 필터 초기화 | `table.resetColumnFilters()`, `table.setGlobalFilter(undefined)` |

### 1.2 A-01 현황 분석

**A-01 N/A** — 신규 컴포넌트. `@tomis/grid-features`에 SelectFilter, GlobalSearchInput, FilterResetButton 구현이 현재 전혀 없음. AS-IS 코드 분석 불필요.

### 1.3 Bundle Impact

`+4 KB` (SelectFilter + GlobalSearchInput + FilterResetButton + selectFilterFn re-export)

**migrationImpact**: medium — SelectFilter/GlobalSearchInput/FilterResetButton 신규 추가. 사용처 0개. peerDep 영향 medium.

---

## Section 2 — Acceptance Criteria (AC)

| AC ID | 기준 | 검증 방법 |
|-------|------|-----------|
| AC-001 | `SelectFilter`: `column.getFacetedUniqueValues()` Map 읽어 체크박스 옵션 렌더. 선택 시 `column.setFilterValue(string[] \| undefined)` | Storybook + tsc |
| AC-002 | `selectFilterFn`: TanStack `filterFns.arrIncludes` re-export. columnDef에 `filterFn: selectFilterFn` 참조 등록 가능 | unit test |
| AC-003 | 옵션 수 ≥ 50 시 SelectFilter 내부 검색 입력 자동 노출 (String.includes, 신규 dep 없음) | Storybook 50-item story |
| AC-004 | `GlobalSearchInput`: 입력값 변경 후 300ms debounce → `table.setGlobalFilter(value)` | unit test (fake timers) |
| AC-005 | `FilterResetButton`: `table.resetColumnFilters()` + `table.setGlobalFilter(undefined)` 호출. `columnFilters.length === 0 && !globalFilter` 시 disabled | unit test |
| AC-006 | `tsc --noEmit` 0 에러 (C-4: no any, C-29: exactOptional spread-skip 준수) | CI build |
| AC-007 | Storybook 스토리 2개 이상: SelectFilter.stories.tsx (기본 + 50-item), GlobalSearchInput.stories.tsx | Storybook build |

---

## Section 3 — Non-Functional Requirements

| NFR | 내용 |
|-----|------|
| NFR-1 Bundle | g-004 추가분 ≤ +4 KB gzip (SelectFilter ~2 KB, GlobalSearchInput ~1 KB, FilterResetButton ~0.5 KB, filterFn re-export ~0 B) |
| NFR-2 TypeCheck | `tsc --noEmit` strict 0 에러 |
| NFR-3 Peer Deps | 신규 peerDependency 없음 (D8); `date-fns` / `react-datepicker` 추가 import 없음 |
| NFR-4 Style | Tailwind CSS 유틸리티 클래스만 (C-5); 별도 CSS 파일 생성 금지 |
| NFR-5 Accessibility | 체크박스 `<input type="checkbox">` 네이티브 사용, label 연결 필수 |
| NFR-6 No External Search | 내부 검색: 순수 `String.includes` — fuse.js / cmdk / react-select 도입 금지 (C-7, C-16 준용) |

---

## Section 4 — Design Decisions

### 4.1 filterFn 전략 — D2

TanStack 내장 `filterFns.arrIncludes`를 `selectFilterFn`으로 re-export한다.

```typescript
// filterFns.ts 추가
import { filterFns } from '@tanstack/react-table';
export const selectFilterFn = filterFns.arrIncludes;
```

**근거**: custom filterFn 코드 0줄, tree-shaking 유지, `autoRemove` 자동 처리 (`filterValue?.length === 0`).  
**기각**: 완전 custom 구현 — TanStack 기존 로직 중복 + 불필요한 유지보수 부담.

### 4.2 getFacetedRowModel 등록 위치 — D3

`getFacetedRowModel()` / `getFacetedUniqueValues()`는 **BaseGrid.tsx에 미등록**. SelectFilter를 사용하는 consumer가 직접 `useReactTable` options에 추가해야 한다.

```typescript
// consumer 측 useReactTable options (Section 12 예제 참조)
getFacetedRowModel: getFacetedRowModel(),
getFacetedUniqueValues: getFacetedUniqueValues(),
```

Section 6 (Edge Cases)와 Section 12 (Usage Examples) 양쪽에 consumer wiring 요구사항을 명시한다.

### 4.3 내부 검색 임계값 — D4

`searchThreshold` prop (기본 50): 옵션 Map의 size가 임계값 이상이면 내부 검색 `<input>` 자동 노출.

```typescript
const showSearch = uniqueValues.size >= searchThreshold;
```

`String.prototype.includes()` 필터 — 신규 dependency 없음, 대소문자 무시 (`toLowerCase()`).

### 4.4 GlobalSearchInput debounce — D5

```typescript
useEffect(() => {
  const timer = setTimeout(() => table.setGlobalFilter(inputValue || undefined), debounceMs);
  return () => clearTimeout(timer);
}, [inputValue, debounceMs, table]);
```

외부 debounce 라이브러리 없음. `debounceMs` prop (기본 300).

### 4.5 FilterResetButton disabled 조건 — D6

```typescript
const isDisabled =
  table.getState().columnFilters.length === 0 &&
  !table.getState().globalFilter;
```

disabled 시 버튼 시각 피드백: `opacity-50 cursor-not-allowed`.

### 4.6 C-29 exactOptionalPropertyTypes — spread-skip 패턴

optional prop을 하위 컴포넌트에 전달할 때:

```typescript
// 잘못된 방법 (C-29 위반)
<FilterPopover align={popoverAlign} ... />

// 올바른 방법 (C-29 spread-skip)
<FilterPopover
  {...(popoverAlign !== undefined ? { align: popoverAlign } : {})}
  trigger={...}
>
```

### 4.7 A-03 — 8개 그리드 변형 Overlap 분석

| Grid 변형 | SelectFilter 호환 | GlobalSearchInput 호환 | FilterResetButton 호환 | 비고 |
|-----------|:-----------------:|:---------------------:|:---------------------:|------|
| BaseGrid | ✅ (consumer 직접 getFacetedRowModel 등록 필요) | ✅ (globalFilter state 직접 추가 필요) | ✅ | D3 참조 |
| VirtualGrid | ✅ (행 가상화와 무관 — column-level API) | ✅ | ✅ | |
| ColumnPinGrid | ✅ (pinning과 별개 컬럼 API) | ✅ | ✅ | |
| GroupedHeaderGrid | ✅ (리프 column만 SelectFilter 권장) | ✅ | ✅ | 그룹 헤더에는 필터 미표시 |
| TreeGrid | ⚠️ (getFacetedUniqueValues가 확장 행 포함 → consumer 검증 필요) | ✅ | ✅ | 부분 테스트 필요 |
| EditableGrid | ✅ | ✅ | ✅ | 편집 중 필터 초기화 주의 |
| ChangeTrackingGrid | ✅ | ✅ | ✅ | |
| RangeSelectGrid | ✅ | ✅ | ✅ | |

**결론**: 8개 변형 모두 API 수준 호환. TreeGrid만 consumer 검증 권고.

---

## Section 5 — Truth Table (C-30)

### 5.1 SelectFilter 상태 조합

| 선택 항목 | `filterValue` | 필터 활성 | autoRemove |
|-----------|--------------|-----------|------------|
| 없음 (모두 미선택) | `undefined` | ❌ | ✅ |
| 1개 선택 | `["A"]` | ✅ | ❌ |
| 2개 이상 선택 | `["A", "B"]` | ✅ | ❌ |
| 전체 선택 (= 필터 해제) | `undefined` (전체 토글 → clear) | ❌ | ✅ |

### 5.2 FilterResetButton 상태 조합

| columnFilters | globalFilter | isDisabled | 클릭 결과 |
|--------------|-------------|:---------:|-----------|
| `[]` | `undefined` | ✅ | — (클릭 불가) |
| `[]` | `"search"` | ❌ | globalFilter → undefined |
| `[{id,val}]` | `undefined` | ❌ | columnFilters → [] |
| `[{id,val}]` | `"search"` | ❌ | 양쪽 모두 초기화 |

### 5.3 GlobalSearchInput 상태 조합

| 입력값 | debounce 후 setGlobalFilter | 필터 활성 |
|--------|---------------------------|-----------|
| `""` (빈 문자열) | `undefined` (autoRemove) | ❌ |
| `"   "` (공백만) | `undefined` (trim 후 빈 문자열) | ❌ |
| `"abc"` | `"abc"` | ✅ |

---

## Section 6 — Edge Cases

| EC ID | 케이스 | 처리 |
|-------|--------|------|
| E-1 | `getFacetedRowModel` 미등록 시 `getFacetedUniqueValues()` 호출 → 런타임 에러 | Section 12 consumer wiring 예제에 필수 등록 명시; 컴포넌트 내 `try-catch` 미적용 (consumer 책임, D3) |
| E-2 | `column.getFacetedUniqueValues()` 반환값이 빈 Map | 옵션 렌더 0건 + "No options" 텍스트 표시 |
| E-3 | 옵션 값에 빈 문자열 `""` 포함 | 체크박스 표시 시 "(blank)" 레이블로 치환 |
| E-4 | SelectFilter가 열린 상태에서 외부 클릭 | FilterPopover mousedown 외부클릭 핸들러가 처리 (G-001 재사용) |
| E-5 | GlobalSearchInput: 300ms 내 연속 입력 | 이전 timer clearTimeout 후 새 timer 생성 — 정확한 debounce 보장 |
| E-6 | FilterResetButton 클릭 후 SelectFilter가 열려 있는 경우 | SelectFilter는 FilterPopover 상태 독립 — 팝오버 open 상태 유지됨. 필터값만 초기화 |
| E-7 | TreeGrid에서 getFacetedUniqueValues 호환성 | 부모 행이 집계 값으로 포함될 수 있음 → consumer 검증 권고 (Section 4.7 참조) |

---

## Section 7 — Implementation Files

**C-28**: 경로 prefix = `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/`

| # | 파일 | 상태 | 변경 요약 |
|---|------|------|-----------|
| 1 | `src/filter-ui/SelectFilter.tsx` | NEW | 다중선택 체크박스 필터 컴포넌트 |
| 2 | `src/filter-ui/GlobalSearchInput.tsx` | NEW | debounce 300ms 전역 검색 입력 |
| 3 | `src/filter-ui/FilterResetButton.tsx` | NEW | 필터 전체 초기화 버튼 |
| 4 | `src/filter-ui/filterFns.ts` | MODIFY | `selectFilterFn` (arrIncludes re-export) 추가 |
| 5 | `src/filter-ui/types.ts` | MODIFY | SelectFilterProps, GlobalSearchInputProps, FilterResetButtonProps 추가 |
| 6 | `src/index.ts` | MODIFY | G-004 신규 export 추가 |
| 7 | `src/filter-ui/SelectFilter.stories.tsx` | NEW | 기본 story + 50-item search story |
| 8 | `src/filter-ui/GlobalSearchInput.stories.tsx` | NEW | GlobalSearchInput + FilterResetButton 통합 story |

**총계**: NEW 5 + MODIFY 3 = 8개

---

## Section 8 — TypeScript Interface Contract

### 8.1 types.ts 추가 인터페이스

```typescript
// ---------------------------------------------------------------------------
// SelectFilter Props (MOD-GRID-09 G-004)
// ---------------------------------------------------------------------------

/**
 * SelectFilter 컴포넌트 Props.
 *
 * @template TData - TanStack Row data 타입.
 * C-4: Column<TData, unknown> — cell value 타입 unknown (any 방지).
 * C-29: optional prop (searchThreshold, popoverAlign) — spread-skip 패턴 적용.
 *
 * 주의: consumer useReactTable options에
 * `getFacetedRowModel: getFacetedRowModel()` 와
 * `getFacetedUniqueValues: getFacetedUniqueValues()` 등록 필수 (D3).
 */
export interface SelectFilterProps<TData> {
  /** TanStack Column 인스턴스. Column<TData, unknown>. */
  column: Column<TData, unknown>;
  /**
   * 내부 검색 표시 임계값 — 기본 50.
   * 옵션 수 >= searchThreshold 시 검색 input 자동 노출.
   * C-29: optional prop.
   */
  searchThreshold?: number;
  /**
   * 팝오버 정렬 — 기본 'left'.
   * C-29: optional prop — FilterPopover align으로 spread-skip 전달.
   */
  popoverAlign?: 'left' | 'right';
}

// ---------------------------------------------------------------------------
// GlobalSearchInput Props (MOD-GRID-09 G-004)
// ---------------------------------------------------------------------------

/**
 * GlobalSearchInput 컴포넌트 Props.
 *
 * @template TData - TanStack Row data 타입.
 * C-4: Table<TData> — table 인스턴스 직접 수신.
 * C-29: optional prop (debounceMs, placeholder) — spread-skip 패턴 적용.
 *
 * 주의: consumer useReactTable options에 globalFilter state 등록 필요.
 */
export interface GlobalSearchInputProps<TData> {
  /** TanStack Table 인스턴스. */
  table: Table<TData>;
  /**
   * 디바운스 ms — 기본 300.
   * C-29: optional prop.
   */
  debounceMs?: number;
  /**
   * 입력 placeholder — 기본 'Search all columns…'.
   * C-29: optional prop.
   */
  placeholder?: string;
}

// ---------------------------------------------------------------------------
// FilterResetButton Props (MOD-GRID-09 G-004)
// ---------------------------------------------------------------------------

/**
 * FilterResetButton 컴포넌트 Props.
 *
 * @template TData - TanStack Row data 타입.
 * C-4: Table<TData>.
 * C-29: children optional.
 */
export interface FilterResetButtonProps<TData> {
  /** TanStack Table 인스턴스. */
  table: Table<TData>;
  /**
   * 버튼 레이블 — 기본 'Reset Filters'.
   * C-29: optional prop.
   */
  children?: React.ReactNode;
}
```

### 8.2 filterFns.ts 추가 export

```typescript
// selectFilterFn — TanStack built-in arrIncludes re-export (D2)
import { filterFns } from '@tanstack/react-table';

/**
 * TanStack 커스텀 filterFn — 다중선택 배열 포함 필터.
 *
 * `filterFns.arrIncludes` re-export: cell value가 filterValue 배열의
 * 임의 요소와 일치하면 true.
 *
 * `autoRemove`: filterValue?.length === 0 시 TanStack이 자동 필터 해제.
 *
 * columnDef에 `filterFn: selectFilterFn` 으로 직접 참조 방식 등록.
 *
 * 주의: consumer useReactTable options에
 * `getFacetedRowModel: getFacetedRowModel()` 과
 * `getFacetedUniqueValues: getFacetedUniqueValues()` 등록 필수 (D3).
 *
 * @example
 * ```typescript
 * columnHelper.accessor('category', {
 *   filterFn: selectFilterFn,
 *   header: ({ column }) => <SelectFilter column={column} />,
 * });
 * ```
 */
export const selectFilterFn = filterFns.arrIncludes;
```

### 8.3 types.ts import 추가

```typescript
// types.ts 상단에 Table 타입 import 추가 필요
import type { Column, Table } from '@tanstack/react-table';
```

---

## Section 9 — index.ts Export Plan

```typescript
// MOD-GRID-09: filter-ui — SelectFilter / GlobalSearchInput / FilterResetButton (G-004)
export { SelectFilter } from './filter-ui/SelectFilter';
export { GlobalSearchInput } from './filter-ui/GlobalSearchInput';
export { FilterResetButton } from './filter-ui/FilterResetButton';
export { selectFilterFn } from './filter-ui/filterFns';
export type {
  SelectFilterProps,
  GlobalSearchInputProps,
  FilterResetButtonProps,
} from './filter-ui/types';
```

---

## Section 10 — Component Render Tree

### 10.1 SelectFilter

```
SelectFilter<TData>
└── FilterPopover (G-001 재사용)
    ├── trigger: FilterIndicator (G-001 재사용) + 칼럼명 레이블
    └── content:
        ├── [searchThreshold 충족 시] <input type="text" /> (내부 검색)
        ├── "전체 선택/해제" 체크박스 + 레이블
        └── <ul>
            └── <li> × N
                └── <label>
                    ├── <input type="checkbox" />
                    └── {optionText} ({count})
```

### 10.2 GlobalSearchInput

```
GlobalSearchInput<TData>
└── <div> (wrapper)
    └── <input type="text" />
        (onChange → local state → useEffect debounce → table.setGlobalFilter)
```

### 10.3 FilterResetButton

```
FilterResetButton<TData>
└── <button>
    (disabled={isDisabled})
    (onClick → table.resetColumnFilters() + table.setGlobalFilter(undefined))
    └── {children ?? 'Reset Filters'}
```

---

## Section 11 — Constraints Checklist

| 제약 | 항목 | 준수 여부 |
|------|------|:---------:|
| C-2 | 최소 구현 (selectFilterFn = re-export 0줄 커스텀) | ✅ |
| C-4 | no any — Column<TData, unknown>, Table<TData> | ✅ |
| C-5 | Tailwind CSS만 (CSS 파일 없음) | ✅ |
| C-7 | AG Grid 신규 도입 금지 | ✅ (미도입) |
| C-16 | Wijmo 미도입 | ✅ (미도입) |
| C-27 | 이 Spec이 구현 권위 문서 | ✅ |
| C-28 | monorepo 경로 prefix `topvel-grid-monorepo/packages/grid-features/` | ✅ |
| C-29 | exactOptionalPropertyTypes: spread-skip 패턴 | ✅ (Section 4.6) |
| C-30 | Truth table 작성 (Section 5) | ✅ |
| C-31 | Functional Wiring Audit: getFacetedRowModel consumer 등록 명시 (Section 4.2, 6, 12) | ✅ |
| E-06 | Section 7 final table 1:1 D# breakdown 매칭 | ✅ (D9 = Section 7 표) |

---

## Section 12 — Usage Examples

### 12.1 기본 사용 예제 (E-02 Before/After)

**Before (G-003까지만 적용된 기존 설정)**

```typescript
// ❌ getFacetedRowModel 없음 → SelectFilter 사용 시 런타임 에러
const table = useReactTable({
  data,
  columns,
  state: { columnFilters, sorting },
  onColumnFiltersChange: setColumnFilters,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getSortedRowModel: getSortedRowModel(),
});
```

**After (G-004 SelectFilter + GlobalSearchInput + FilterResetButton 추가)**

```typescript
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import {
  SelectFilter,
  GlobalSearchInput,
  FilterResetButton,
  selectFilterFn,
} from '@tomis/grid-features';

function CategoryGrid() {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>('');

  const columns = useMemo(
    () =>
      columnHelper.accessor('category', {
        filterFn: selectFilterFn, // ← selectFilterFn 등록
        header: ({ column }) => <SelectFilter column={column} />,
      }),
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: { columnFilters, globalFilter },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // ✅ G-004 필수: SelectFilter를 위한 faceted row model 등록 (D3)
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div>
      {/* 전역 검색 + 초기화 버튼 */}
      <div className="flex items-center gap-2 mb-4">
        <GlobalSearchInput table={table} placeholder="Search all columns…" />
        <FilterResetButton table={table}>Reset All Filters</FilterResetButton>
      </div>

      {/* 테이블 렌더 */}
      <table>
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</th>
              ))}
            </tr>
          ))}
        </thead>
        {/* tbody 생략 */}
      </table>
    </div>
  );
}
```

### 12.2 고급 예제 — 50+ 옵션 + popoverAlign + searchThreshold 커스텀

```typescript
// 50개 이상 옵션 컬럼: searchThreshold 기본값(50)으로 내부 검색 자동 노출
<SelectFilter
  column={table.getColumn('country')!}
  searchThreshold={30}        // 30개 이상 시 검색 노출로 임계값 낮춤
  popoverAlign="right"        // 우측 정렬 팝오버
/>

// GlobalSearchInput: debounce 500ms (기본 300ms 오버라이드)
<GlobalSearchInput
  table={table}
  debounceMs={500}
  placeholder="Quick search…"
/>

// FilterResetButton: 커스텀 레이블
<FilterResetButton table={table}>
  <span className="flex items-center gap-1">
    <XCircleIcon className="w-4 h-4" />
    Clear
  </span>
</FilterResetButton>
```

---

## Section 13 — Commercial Impact & Documentation Paths

### 13.1 경쟁 그리드 대비 포지셔닝

| 기능 | TOMIS Grid (G-004 후) | AG Grid Community | AG Grid Enterprise | Wijmo |
|------|:---------------------:|:-----------------:|:------------------:|:-----:|
| 텍스트 필터 | ✅ (G-001) | ✅ | ✅ | ✅ |
| 숫자 필터 | ✅ (G-002) | ✅ | ✅ | ✅ |
| 날짜 범위 필터 | ✅ (G-003) | ✅ | ✅ | ✅ |
| **Excel-style 다중선택 필터** | ✅ **(G-004)** | ❌ (Community) | ✅ (Enterprise 전용) | ✅ (Data Discovery) |
| **전역 검색 (debounce)** | ✅ **(G-004)** | ✅ Quick filter | ✅ | ✅ |
| **필터 전체 초기화** | ✅ **(G-004)** | 별도 구현 필요 | ✅ | ✅ |
| 라이선스 | MIT | MIT | 상용 유료 | 상용 유료 |

**G-004 포지셔닝**: AG Grid Enterprise의 "Set Filter" 기능을 MIT 라이선스로 제공.

### 13.2 F-03 Docusaurus 문서 경로

**한국어 문서**:
- `docs/ko/grid-features/filter-ui/select-filter` — SelectFilter 사용 가이드
- `docs/ko/grid-features/filter-ui/global-search` — GlobalSearchInput + FilterResetButton 가이드

**영문 문서**:
- `docs/en/grid-features/filter-ui/select-filter` — SelectFilter usage guide
- `docs/en/grid-features/filter-ui/global-search` — GlobalSearchInput + FilterResetButton guide

---

## Section 14 — Implementation Plan

### Phase 1: Types + filterFn (MODIFY 2)

**목표**: 타입 정의 및 filterFn 추가 — 빌드 가능한 상태 유지.

| 작업 | 파일 | 검증 |
|------|------|------|
| `SelectFilterProps`, `GlobalSearchInputProps`, `FilterResetButtonProps` 추가 | `types.ts` | `tsc --noEmit` 0 에러 |
| `Table` import 추가 (`types.ts`) | `types.ts` | compile pass |
| `selectFilterFn` (arrIncludes re-export) 추가 | `filterFns.ts` | `tsc --noEmit` 0 에러 |

**완료 조건**: `tsc --noEmit` 통과, 기존 G-001/G-002/G-003 export 무변화.

### Phase 2: Component 구현 (NEW 3)

**목표**: SelectFilter, GlobalSearchInput, FilterResetButton 구현.

| 작업 | 파일 | 검증 |
|------|------|------|
| SelectFilter 구현 (getFacetedUniqueValues, checkboxes, internal search) | `SelectFilter.tsx` | Storybook render |
| GlobalSearchInput 구현 (useEffect debounce 300ms) | `GlobalSearchInput.tsx` | unit test (fake timers) |
| FilterResetButton 구현 (disabled 조건, 초기화 로직) | `FilterResetButton.tsx` | unit test |

**완료 조건**: 3개 컴포넌트 정상 렌더, AC-001~AC-005 충족.

### Phase 3: Export + Stories (MODIFY 1 + NEW 2)

**목표**: public API 노출 + Storybook 문서화.

| 작업 | 파일 | 검증 |
|------|------|------|
| G-004 export 블록 추가 | `index.ts` | `tsc --noEmit` 0 에러 |
| 기본 story + 50-item story | `SelectFilter.stories.tsx` | Storybook build pass |
| GlobalSearchInput + FilterResetButton story | `GlobalSearchInput.stories.tsx` | Storybook build pass |

**완료 조건**: AC-006, AC-007 충족, `tsup build` 성공.

---

## Section 15 — Verification Plan

### 15.1 Unit Tests

| 테스트 ID | 대상 | 시나리오 | 기대 결과 |
|-----------|------|----------|-----------|
| UT-001 | `selectFilterFn` | cell `"A"`, filterValue `["A", "B"]` | `true` |
| UT-002 | `selectFilterFn` | cell `"C"`, filterValue `["A", "B"]` | `false` |
| UT-003 | `selectFilterFn` | filterValue `[]` → autoRemove | `autoRemove([]) === true` |
| UT-004 | `selectFilterFn` | cell `null` | `false` |
| UT-005 | `GlobalSearchInput` | 입력 후 300ms 이전 | `setGlobalFilter` 미호출 |
| UT-006 | `GlobalSearchInput` | 입력 후 300ms 경과 | `setGlobalFilter("abc")` 호출 1회 |
| UT-007 | `GlobalSearchInput` | 빈 문자열 입력 후 300ms | `setGlobalFilter(undefined)` 호출 |
| UT-008 | `FilterResetButton` | columnFilters `[]`, globalFilter `undefined` | `disabled=true` |
| UT-009 | `FilterResetButton` | columnFilters `[{id,val}]` | `disabled=false` |
| UT-010 | `FilterResetButton` | 클릭 | `resetColumnFilters` + `setGlobalFilter(undefined)` 각 1회 호출 |
| UT-011 | `SelectFilter` | options 50개 미만, searchThreshold 50 | 검색 input 미노출 |
| UT-012 | `SelectFilter` | options 50개 이상, searchThreshold 50 | 검색 input 노출 |
| UT-013 | `SelectFilter` | 검색 input에 `"kr"` 입력 | "kr" 포함 옵션만 노출 (대소문자 무시) |
| UT-014 | `SelectFilter` | 체크박스 선택 2개 | `column.setFilterValue(["A","B"])` 호출 |
| UT-015 | `SelectFilter` | 모든 체크박스 해제 | `column.setFilterValue(undefined)` 호출 |

### 15.2 Storybook 검증

| Story | 파일 | 내용 |
|-------|------|------|
| `SelectFilter/Default` | `SelectFilter.stories.tsx` | 5개 옵션 체크박스 필터, 기본 기능 확인 |
| `SelectFilter/ManyOptions` | `SelectFilter.stories.tsx` | 50개+ 옵션 → 내부 검색 자동 노출 확인 |
| `GlobalSearch/Default` | `GlobalSearchInput.stories.tsx` | GlobalSearchInput + FilterResetButton 통합 (debounce 시각 확인) |

### 15.3 빌드 검증

```powershell
# 타입 검사
pnpm --filter @tomis/grid-features typecheck

# 빌드
pnpm --filter @tomis/grid-features build

# Storybook 빌드
pnpm --filter @tomis/grid-features build-storybook
```

**합격 기준**: 0 타입 에러, 빌드 성공, Storybook 2개 파일 3개 스토리 정상 렌더.

---

## Self-Review Checklist (specify-rubric v1.0.5 대응)

| 루브릭 항목 | 체크 | 비고 |
|------------|:----:|------|
| **A — Goal 정합성** | | |
| A-01: 현황 분석 N/A 명시 | ✅ | Section 1.2에 "A-01 N/A — 신규 컴포넌트" |
| A-02: AC 전체 나열 (7개) | ✅ | Section 2 표 7행 |
| A-03: 8개 변형 overlap 분석 | ✅ | Section 4.7 표 |
| A-04: dependsOn 명시 | ✅ | 헤더 + D# 설명 |
| A-05: bundleImpact 명시 | ✅ | Section 1.3 "+4 KB" |
| **B — 설계 결정** | | |
| B-01: D# log 선행 작성 | ✅ | D1~D9 표 |
| B-02: 기각 옵션 포함 | ✅ | D2 Section 4.1 "기각" |
| B-03: 외부 dep 미추가 이유 | ✅ | D8 + Section 3 NFR-3 |
| B-04: C-29 spread-skip 패턴 | ✅ | Section 4.6 코드 |
| B-05: C-31 wiring audit | ✅ | Section 4.2, 6 E-1, 12 After |
| **C — 타입 계약** | | |
| C-01: Interface 정의 (3개) | ✅ | Section 8.1 |
| C-02: filterFn export 시그니처 | ✅ | Section 8.2 |
| C-03: types.ts import 추가 명시 | ✅ | Section 8.3 |
| C-04: no any | ✅ | Column<TData,unknown>, Table<TData> |
| C-05: optional prop 명시 | ✅ | searchThreshold, debounceMs, placeholder, children |
| **D — 구현 파일** | | |
| D-01: 파일 수 8 (NEW5+MOD3) | ✅ | Section 7 표 |
| D-02: 파일명 열거 (D9 1:1) | ✅ | Section 7 = D9 breakdown |
| D-03: index.ts export 블록 | ✅ | Section 9 |
| D-04: render tree (3개) | ✅ | Section 10 |
| D-05: C-28 경로 prefix | ✅ | Section 7 주석 |
| D-06: E-06 재결정 미발생 | ✅ | Section 7 = D# 일치 |
| **E — 예제 / 엣지케이스** | | |
| E-01: usage 예제 ≥2 | ✅ | Section 12.1 + 12.2 |
| E-02: Before/After 코드 ≥1 | ✅ | Section 12.1 |
| E-03: edge case ≥3 | ✅ | Section 6 E-1~E-7 |
| E-04: truth table (3.1~3.3) | ✅ | Section 5 |
| E-05: consumer wiring 명시 | ✅ | Section 4.2, 6 E-1, 12 After |
| E-06: Section 7 ↔ D# 일치 | ✅ | D9 = Section 7 표 |
| **F — 문서화** | | |
| F-01: constraints checklist | ✅ | Section 11 |
| F-02: 상용 포지셔닝 표 | ✅ | Section 13.1 |
| F-03: Docusaurus 경로 ≥2 | ✅ | Section 13.2 (4개 경로) |
| F-04: Section 14 ≥2 Phase | ✅ | Phase 1/2/3 |
| **G — 검증 계획** | | |
| G-01: unit test 목록 | ✅ | Section 15.1 (UT-001~015) |
| G-02: Storybook story 목록 | ✅ | Section 15.2 (3개 story) |
| G-03: 빌드 검증 커맨드 | ✅ | Section 15.3 |

**예상 Specify 점수**: 32/32 항목 YES = 100점 (threshold 90 충족)
