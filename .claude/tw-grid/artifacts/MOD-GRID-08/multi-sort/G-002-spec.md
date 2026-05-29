# G-002 Specification — maxMultiSortColCount 제한 + 정렬 전체 초기화 버튼

**Module**: MOD-GRID-08 / multi-sort  
**Goal ID**: G-002  
**Phase**: critical-gap  
**Priority**: P1  
**License Tier**: MIT  
**Package Target**: packages/grid-features  
**Threshold**: 90  
**Depends On**: MOD-GRID-08/G-001  
**Spec Version**: 1.0.0  
**Date**: 2026-05-14  
**Rubric**: specify-rubric.md v1.0.6  

---

## 1. Goal 요약 (User Story)

사용자가 5개 이상 컬럼을 Shift+Click으로 정렬하려 할 때 `maxMultiSortColCount=3` 설정 시 3개까지만 정렬이 유지된다. '정렬 초기화' 버튼 클릭 시 모든 정렬이 해제된다.

**migrationImpact**: low (G-001 기반 신규 prop 2개 추가, affectedUsageFiles 0개, grid-features 패키지 내 결합)

---

## 2. Acceptance Criteria

| AC ID | 설명 | 출처 |
|-------|------|------|
| AC-001 | `maxMultiSortColCount?: number` prop (기본 무제한) — `sortingState.length >= max` 시 가장 오래된 항목 제거 후 추가 (FIFO, C-4 타입 명시) | Goal JSON |
| AC-002 | TanStack `maxMultiSortColCount` 옵션이 있으면 우선 사용, 없으면 setSorting 전처리로 구현 (TanStack 표준 우선 — C-2). F-08-05 = AS-IS FeatureID "다중 정렬 컬럼 수 제한" 기능 흡수 | Goal JSON |
| AC-003 | `showSortClearButton` prop → 그리드 툴바 또는 헤더 영역에 '정렬 초기화' 버튼 렌더 (Tailwind 스타일 — C-5) | Goal JSON |
| AC-004 | '정렬 초기화' 클릭 → `table.setSorting([])` (TanStack 표준 — C-2) | Goal JSON |
| AC-005 | C-12: `tsc --noEmit` 0 error | Goal JSON |
| AC-006 | C-25: Storybook story 1개 (`maxMultiSortColCount=3` + 초기화 버튼 시나리오) | Goal JSON |

---

## 3. 선행 조건

- MOD-GRID-08/G-001 완료 (SortBadge, useMultiSort, types.ts, index.ts, Grid.tsx 다중 정렬 기반 구현 완료)
- G-001 구현 파일 현황:
  - `packages/grid-features/src/multi-sort/SortBadge.tsx` — 불변 (G-002 미수정)
  - `packages/grid-features/src/multi-sort/useMultiSort.ts` — G-002에서 MODIFY
  - `packages/grid-features/src/multi-sort/types.ts` — G-002에서 MODIFY
  - `packages/grid-features/src/index.ts` — G-002에서 MODIFY
  - `packages/grid-core/src/Grid.tsx` — G-002에서 MODIFY
  - `packages/grid-core/src/types.ts` — G-002에서 MODIFY
  - `packages/grid-core/src/internal/buildTableOptions.ts` — G-002에서 MODIFY

---

## 4. 아키텍처 컨텍스트

### 4.1 TanStack v8 `maxMultiSortColCount` 타입 노출 현황

**실측 결과 (C-1 직접 확인)**:

파일: `node_modules/.pnpm/@tanstack+table-core@8.21.3/node_modules/@tanstack/table-core/build/lib/features/RowSorting.d.ts` L188

```typescript
interface SortingOptionsBase {
  // ... (생략)
  /**
   * Set a maximum number of columns that can be multi-sorted.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/features/sorting#maxmultisortcolcount)
   */
  maxMultiSortColCount?: number;
  // ...
}
export interface SortingOptions<TData extends RowData> extends SortingOptionsBase, ResolvedSortingFns {}
```

→ **`maxMultiSortColCount`는 TypeScript 타입으로 완전 노출됨.**  
→ AC-002 구현 경로: `buildTableOptions.ts`에서 직접 TanStack 옵션으로 전달 (FIFO 전처리 불필요, C-2 준수).

### 4.2 런타임 동작 (UMD L2690 확인)

```javascript
// node_modules/@tanstack/react-table/build/umd/index.development.js L2690
newSorting.splice(0, newSorting.length - (
  (_table$options$maxMul = table.options.maxMultiSortColCount) != null
    ? _table$options$maxMul
    : Number.MAX_SAFE_INTEGER
));
```

→ 새 컬럼 추가 후 앞에서부터 제거 (oldest entries first = FIFO). 설정 없으면 `Number.MAX_SAFE_INTEGER` (무제한).

### 4.3 Grid.tsx 현재 구조 (G-001 산출물)

- L248~: 최상위 `<div className="flex flex-col ...">` wrapper
- L249~253: `columnPersistence` 조건부 `<ColumnVisibilityMenu>` 툴바 영역 (상단 우측)
- L254: scroll container `<div ref={scrollContainerRef} ...>`
- L282~299: `handleHeaderClick` — multi-sort aware click handler (G-001 구현)
- L324: `{isMulti && canSort && <SortBadge sortIndex={sortIndex} />}` (G-001 구현)
- Import: `SortBadge`는 `'./internal/SortBadge'` (grid-core 내부 복사본, grid-features export 미사용)

### 4.4 SortClearButton 렌더 위치 결정

AC-003: "그리드 툴바 또는 헤더 영역" → **툴바 영역** 선택.  
이유: ColumnVisibilityMenu 패턴과 일관됨. 헤더 내 삽입은 colspan/레이아웃 충돌 위험.  
위치: `<table>` 외부 상단 툴바 div (ColumnVisibilityMenu 와 동일 영역, 좌측 추가).

---

## 5. 기술 결정 (D#)

### D1: Grid.tsx 래퍼 통합 (Option A — 자동 연결)

`maxMultiSortColCount`와 `showSortClearButton`을 GridProps에 추가하고 Grid.tsx가 자동 처리.  
G-001 D1 패턴과 동일. 외부 소비자는 prop 1개만 추가하면 동작.

**Rejected**: Option B (consumer-only, useMultiSort에서만 노출) — Grid wrapper 사용자가 TanStack API를 직접 조립해야 하여 캡슐화 원칙 위반.

### D2: `maxMultiSortColCount` 전달 방식

`buildTableOptions.ts`에서 `props.maxMultiSortColCount`를 조건부로 `options.maxMultiSortColCount`에 할당.  
C-29 준수: `undefined` 직접 할당 금지 → `if (props.maxMultiSortColCount !== undefined)` 조건부 패턴.

### D3: `SortClearButton` 컴포넌트 위치

`packages/grid-features/src/multi-sort/SortClearButton.tsx` (NEW) — `@tomis/grid-features` 패키지 공개 API.

Grid.tsx는 `@tomis/grid-features`에서 `SortClearButton`을 import하여 사용 (grid-core → grid-features 단방향 의존).  
이유: SortBadge(grid-core internal)와 달리 SortClearButton은 외부 소비자(비-wrapper)도 독립 사용 가능해야 함.  
**순환 위험 없음**: `useColumnDrag`, `DropIndicator`(Grid.tsx L39)가 이미 `@tomis/grid-features`에서 import되어 동일 방향 의존이 기존 확립됨. grid-features 패키지는 grid-core를 import하지 않음 (단방향 유지).

**Note**: Grid.tsx의 `SortBadge`는 여전히 `'./internal/SortBadge'` (G-001 D1 결정 보존 — SortBadge는 헤더 셀 내 렌더로 internal 복사본 패턴 유지).

### D4: `useMultiSort` 훅 확장

`UseMultiSortOptions`에 `maxMultiSortColCount?: number` 추가 → `UseMultiSortResult`에 `maxMultiSortColCount?: number` 추가.  
비-wrapper 소비자가 `useReactTable`에 spread 시 `maxMultiSortColCount`도 전달 가능.

### D5: `showSortClearButton` 렌더 조건

`props.showSortClearButton === true && props.enableMultiSort === true` 조건에서만 렌더.  
이유: 다중 정렬이 비활성이면 초기화 버튼이 의미 없음. enableMultiSort guard 추가.

### D6: stories.tsx 위치

기존 `MultiSortGrid.stories.tsx`와 동일 파일에 story를 추가하는 방식 vs 별도 파일 생성.  
**결정**: `SortClearButton.stories.tsx` NEW 파일 생성 (AC-006 "1개 story" + SortClearButton 독립 시연).  
이유: G-001 스토리가 이미 기존 시나리오 A/B/C를 cover. G-002 신규 기능(max제한+초기화)은 별도 파일로 명확히 분리.

---

## 6. Edge Cases (EC)

| EC ID | 시나리오 | 기대 동작 |
|-------|----------|-----------|
| EC-001 | `maxMultiSortColCount` 미설정 | 기존 G-001 동작 100% 보존 (무제한, C-6) |
| EC-002 | `maxMultiSortColCount=1` | 단일 정렬만 허용 (두 번째 컬럼 Shift+Click 시 첫 번째 제거) |
| EC-003 | `maxMultiSortColCount=3`, 3개 정렬 상태에서 Ctrl+Click (제거) 후 새 컬럼 추가 | 정상 추가 (2→3개, 제한 미도달) |
| EC-004 | `showSortClearButton=true`, 정렬 0개 상태에서 클릭 | `table.setSorting([])` 호출 (noop — 상태 변화 없음) |
| EC-005 | `showSortClearButton=true` + `enableMultiSort=false` | SortClearButton 미렌더 (D5 guard) |
| EC-006 | `maxMultiSortColCount=0` | TanStack에 0 그대로 전달 — 모든 multi-sort 시도가 즉시 제거되어 실질적으로 단일 정렬과 동등. AC-001 범위 외 (유효하지 않은 사용). 별도 dev 경고 없음. |
| EC-007 | `showSortClearButton=false`(기본) 또는 미설정 + `columnPersistence` 사용 | 기존 `columnPersistence` 툴바 DOM 구조 변화 없음 (C-6, Step 5 분리 구조) |

---

## 7. 구현 파일 목록 (C-28 경로 기준)

| # | 파일 (C-28: topvel-grid-monorepo 기준) | 작업 | D# |
|---|----------------------------------------|------|-----|
| 1 | `packages/grid-features/src/multi-sort/SortClearButton.tsx` | NEW | D3 |
| 2 | `packages/grid-features/src/multi-sort/SortClearButton.stories.tsx` | NEW | D6, AC-006 |
| 3 | `packages/grid-features/src/multi-sort/types.ts` | MODIFY | D4 |
| 4 | `packages/grid-features/src/multi-sort/useMultiSort.ts` | MODIFY | D4 |
| 5 | `packages/grid-features/src/index.ts` | MODIFY | D3 |
| 6 | `packages/grid-core/src/types.ts` | MODIFY | D1 |
| 7 | `packages/grid-core/src/internal/buildTableOptions.ts` | MODIFY | D2 |
| 8 | `packages/grid-core/src/Grid.tsx` | MODIFY | D1, D3, D5 |

**NEW 2개, MODIFY 6개** — 합계 8개.  
*전체 절대 경로: `D:/project/topvel_project/topvel-grid-monorepo/<위 경로>`*  
**Bundle Impact**: +1 KB (SortClearButton.tsx 순 추가 — Goal JSON 기준).

---

## 8. 타입 설계

### 8.1 `SortClearButtonProps` (NEW, grid-features/types.ts에 추가)

```typescript
export interface SortClearButtonProps {
  /** 클릭 시 호출 — table.setSorting([]) 연결 (AC-004). */
  onClear: () => void;
  /** 버튼 레이블 (기본: '정렬 초기화'). */
  label?: string;
  /** Tailwind className override (C-5). */
  className?: string;
}
```

### 8.2 `UseMultiSortOptions` 확장 (MODIFY)

```typescript
export interface UseMultiSortOptions {
  enableMultiSort?: boolean;
  /** TanStack maxMultiSortColCount에 직접 전달 (AC-001, AC-002). 미설정 시 무제한. */
  maxMultiSortColCount?: number;
}
```

### 8.3 `UseMultiSortResult` 확장 (MODIFY)

```typescript
export interface UseMultiSortResult {
  enableMultiSort: boolean;
  isMultiSortEvent: (e: unknown) => boolean;
  /** useReactTable 옵션에 spread 시 maxMultiSortColCount 포함. 미설정 시 undefined (C-29). */
  maxMultiSortColCount?: number;
}
```

### 8.4 `GridProps<TData>` 확장 (MODIFY, grid-core/types.ts)

```typescript
// enable* 토글 섹션에 추가:
/** 다중 정렬 최대 컬럼 수 제한 (TanStack maxMultiSortColCount — AC-001, AC-002). 미설정 시 무제한. */
maxMultiSortColCount?: number;
/** true 시 툴바에 '정렬 초기화' 버튼 렌더 (AC-003). enableMultiSort=true 일 때만 표시 (D5). */
showSortClearButton?: boolean;
```

---

## 9. 컴포넌트 설계: `SortClearButton`

```typescript
/**
 * 다중 정렬 전체 초기화 버튼 (AC-003, AC-004).
 *
 * @remarks
 * `<Grid showSortClearButton />` 사용 시 자동 렌더. 비-wrapper 소비자는 직접 import 가능.
 * 클릭 시 `props.onClear()` 호출 — 호출자가 `table.setSorting([])` 연결 (AC-004).
 * Tailwind 스타일 (C-5). 클래스 override 가능.
 */
export function SortClearButton({ onClear, label = '정렬 초기화', className }: SortClearButtonProps) {
  // 구현은 IMPLEMENT 단계
}
```

- Tailwind 기본 스타일: `px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-100 text-gray-600`
- 아이콘: 없음 (텍스트만, C-5 Tailwind 한정)

---

## 10. buildTableOptions.ts 연결 설계

`buildTableOptions.ts` 내 `options` 객체 조립 후 조건부 추가 패턴 (C-29):

```typescript
// C-29: undefined 직접 할당 금지 → 조건부 패턴.
if (props.maxMultiSortColCount !== undefined) {
  options.maxMultiSortColCount = props.maxMultiSortColCount;
}
```

`options` 타입은 `Omit<TableOptions<TData>, 'data' | 'columns'>` — `maxMultiSortColCount`는 `SortingOptions` 경유 이미 포함됨 (D2 확인).

---

## 11. 구현 계획 (Section 11 — IMPLEMENT 단계 가이드)

### 11.1 파일별 작업 요약

| 순서 | 파일 | 작업 내용 |
|------|------|-----------|
| 1 | `grid-features/src/multi-sort/types.ts` | `UseMultiSortOptions`에 `maxMultiSortColCount` 추가, `UseMultiSortResult`에 추가, `SortClearButtonProps` 인터페이스 추가 |
| 2 | `grid-features/src/multi-sort/useMultiSort.ts` | `maxMultiSortColCount` 옵션 수신 → result에 포함 |
| 3 | `grid-features/src/multi-sort/SortClearButton.tsx` | NEW: 버튼 컴포넌트 구현 (Tailwind, C-5) |
| 4 | `grid-features/src/index.ts` | `SortClearButton`, `SortClearButtonProps` export 추가 |
| 5 | `grid-core/src/types.ts` | `GridProps`에 `maxMultiSortColCount`, `showSortClearButton` 추가 |
| 6 | `grid-core/src/internal/buildTableOptions.ts` | `maxMultiSortColCount` 조건부 옵션 전달 |
| 7 | `grid-core/src/Grid.tsx` | `SortClearButton` import + 툴바 조건부 렌더 |
| 8 | `grid-features/src/multi-sort/SortClearButton.stories.tsx` | NEW: AC-006 story |

### 11.2 Before/After 스니펫

#### Step 1: types.ts — `UseMultiSortOptions` MODIFY

**Before** (현재):
```typescript
export interface UseMultiSortOptions {
  enableMultiSort?: boolean;
}
```

**After**:
```typescript
export interface UseMultiSortOptions {
  enableMultiSort?: boolean;
  /** TanStack maxMultiSortColCount에 직접 전달 (AC-001). 미설정 시 무제한. */
  maxMultiSortColCount?: number;
}
```

#### Step 2: types.ts — `UseMultiSortResult` MODIFY

**Before**:
```typescript
export interface UseMultiSortResult {
  enableMultiSort: boolean;
  isMultiSortEvent: (e: unknown) => boolean;
}
```

**After**:
```typescript
export interface UseMultiSortResult {
  enableMultiSort: boolean;
  isMultiSortEvent: (e: unknown) => boolean;
  /** C-29: 미설정 시 undefined — spread 시 TanStack에 전달 안 됨 (무제한). */
  maxMultiSortColCount?: number;
}
```

#### Step 3: useMultiSort.ts MODIFY

**Before** (return 부분):
```typescript
return {
  enableMultiSort,
  isMultiSortEvent: (e: unknown): boolean => { ... },
};
```

**After**:
```typescript
const result: UseMultiSortResult = {
  enableMultiSort,
  isMultiSortEvent: (e: unknown): boolean => { ... },
};
if (opts?.maxMultiSortColCount !== undefined) {
  result.maxMultiSortColCount = opts.maxMultiSortColCount;
}
return result;
```

#### Step 4: buildTableOptions.ts MODIFY

**Before** (options 객체 이후):
```typescript
if (props.getSubRows) {
  options.getSubRows = props.getSubRows;
}
```

**After** (추가 — C-29):
```typescript
if (props.maxMultiSortColCount !== undefined) {
  options.maxMultiSortColCount = props.maxMultiSortColCount;
}
if (props.getSubRows) {
  options.getSubRows = props.getSubRows;
}
```

#### Step 5: Grid.tsx — import 추가 + 툴바 렌더 MODIFY

**Before** (import):
```typescript
import { useColumnDrag, DropIndicator } from '@tomis/grid-features';
```

**After**:
```typescript
import { useColumnDrag, DropIndicator, SortClearButton } from '@tomis/grid-features';
```

**Before** (툴바 영역):
```tsx
{props.columnPersistence !== undefined && (
  <div className="flex justify-end mb-1">
    <ColumnVisibilityMenu table={table} />
  </div>
)}
```

**After** (D5: enableMultiSort guard, C-6: 기존 columnPersistence-only 경로 DOM 구조 보존):
```tsx
{props.columnPersistence !== undefined && (
  <div className="flex justify-end mb-1">
    <ColumnVisibilityMenu table={table} />
  </div>
)}
{props.showSortClearButton === true && props.enableMultiSort === true && (
  <div className="flex mb-1">
    <SortClearButton onClear={() => table.setSorting([])} />
  </div>
)}
```

**C-6 근거**: 두 조건을 분리된 `<div>` 블록으로 유지. `showSortClearButton=false`(기존 소비자) 시 해당 `<div>` 미렌더 → DOM 구조 변화 없음. `columnPersistence` 단독 사용자의 `justify-end` 구조 완전 보존.

---

## 12. Storybook 시나리오 (AC-006)

파일: `packages/grid-features/src/multi-sort/SortClearButton.stories.tsx` (NEW)

### 시나리오 D — maxMultiSortColCount=3 + 초기화 버튼

- `maxMultiSortColCount=3` 설정 → 4번째 컬럼 Shift+Click 시 첫 번째 컬럼 정렬 자동 제거 (FIFO)
- `showSortClearButton=true` → 툴바에 '정렬 초기화' 버튼 표시
- 초기화 버튼 클릭 → SortingState가 `[]`로 초기화됨
- 패턴: G-001 `MultiSortGrid.stories.tsx`와 동일 (useReactTable 직접 사용 + useMultiSort hook)

---

## 13. 검증 체크리스트 (VERIFY 단계용)

| 항목 | 기준 |
|------|------|
| AC-001 | `maxMultiSortColCount=3` 설정 → 4번째 정렬 추가 시 sortingState.length === 3 유지 |
| AC-002 | buildTableOptions.ts `options.maxMultiSortColCount` 직접 설정 확인 (FIFO 전처리 코드 없음) |
| AC-003 | `showSortClearButton=true + enableMultiSort=true` → 툴바에 버튼 렌더 |
| AC-003 | `showSortClearButton=true + enableMultiSort=false` → 버튼 미렌더 (D5 guard) |
| AC-004 | 초기화 버튼 클릭 → `table.setSorting([])` 호출 → SortingState === [] |
| AC-005 | `tsc --noEmit` 0 error (C-12) |
| AC-006 | `SortClearButton.stories.tsx` 존재 + story 1개 이상 (C-25) |
| C-6 | `maxMultiSortColCount` 미설정 시 기존 G-001 동작 100% 보존 |
| C-6 | `showSortClearButton` 미설정 시 기존 columnPersistence 툴바 DOM 구조 변화 없음 (EC-007) |
| C-28 | 모든 파일 경로 `topvel-grid-monorepo/packages/...` 기준 |
| C-29 | `props.maxMultiSortColCount !== undefined` 조건부 할당 패턴 확인 |
| C-31 | `SortClearButton` import → Grid.tsx 렌더 call site 존재 확인 |
| index.ts | `SortClearButton`, `SortClearButtonProps` export 확인 |

---

## 14. 제약사항 준수 요약

| 제약 | 적용 내용 |
|------|-----------|
| C-1 | RowSorting.d.ts, Grid.tsx, buildTableOptions.ts, types.ts 직접 실측 후 스펙 작성 |
| C-2 | maxMultiSortColCount TanStack 표준 옵션 직접 사용 (FIFO 전처리 불필요) |
| C-4 | 모든 인터페이스 `number`, `boolean`, `() => void` 명시 — no `any` |
| C-5 | SortClearButton Tailwind 전용, no new .css |
| C-6 | maxMultiSortColCount 미설정 = G-001 동작 100% 보존 |
| C-12 | Section 13 체크리스트에 tsc 0 error 포함 |
| C-25 | AC-006 Storybook story 1개 (Section 12) |
| C-28 | Section 7 파일 경로 topvel-grid-monorepo/packages/ 기준 |
| C-29 | buildTableOptions.ts / useMultiSort.ts 조건부 spread 패턴 |
| C-30 | D5 결정(enableMultiSort guard) → Section 7 implementFiles 반영됨 |
| C-31 | SortClearButton: grid-features export + Grid.tsx import call site 명시 |
| E-01 v1.0.6 | AC-006(Storybook 바인딩 AC) → Section 7에 stories.tsx NEW 파일 포함 |
| G-01 | D# 2개(D1/D3) 핵심 결정 명시, Section 7 NEW 2 / MODIFY 6 합산 |

---

*End of G-002 Specification*
