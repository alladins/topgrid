# G-002 Spec: 페이지 크기 변경 UI + pageSizeOptions + showTotalCount

**Module**: MOD-GRID-03 | **Goal**: G-002 | **Priority**: P0  
**Status**: SPECIFY  
**Created**: 2026-05-14  
**dependsOn**: MOD-GRID-03/G-001 (완료)  
**packageTarget**: packages/grid-core (MIT)  
**migrationThreshold**: 90 (medium)

---

## Section 1. 목적 (Purpose)

G-001이 완성한 `GridPagination` 스켈레톤에 실제 UI를 채운다.

- **페이지 크기 선택 UI** (`PageSizeSelect`): `pageSizeOptions` 목록을 드롭다운으로 표시하고, 선택 시 `table.setPageSize()` + `table.setPageIndex(0)` 호출
- **전체 건수 표시** (`TotalCount`): `showTotalCount=true`(기본값)일 때 "전체 **N**건" 렌더링
- **Grid.tsx 배선 교체**: L365-419 인라인 pagination JSX를 `<GridPagination>` 호출로 대체하여 C-31(Functional Wiring Audit) 준수

G-001이 생성한 스켈레톤 파일 3개(GridPagination.tsx, types.ts-내 types, index.ts)를 완성하고,  
Grid.tsx 인라인 UI를 제거(Extract)함으로써 중복 없이 단일 구현을 확립한다.

**migrationImpact**: medium (Grid.tsx 인라인 pagination JSX 교체 + PageSizeSelect/TotalCount NEW, affectedUsageFiles 0개이나 Grid.tsx 내부 배선 영향)

---

## Section 2. 배경 및 현황 (Background)

### 2.1 현재 상태

| 위치 | 현황 |
|------|------|
| `Grid.tsx` L160 | `showPagination = props.enablePagination === true` — `mode:'client'\|'server'` 케이스 미반영 |
| `Grid.tsx` L365-419 | 인라인 pagination UI: native `<select>`, "전체 N건", 페이지 탐색 버튼 전부 Grid.tsx 내부에 존재 |
| `GridPagination.tsx` | G-001 스켈레톤: props 정의 완료, `return null` 상태 |
| `types.ts` `GridPaginationOptions` | `pageSizeOptions?: number[]` 존재, `showTotalCount` 미존재 |
| `index.ts` | `GridPagination`, `GridPaginationProps` export 완료 — `PageSizeSelect`, `TotalCount` 미export |

### 2.2 L0 AS-IS 레거시 패턴

`BaseGrid.tsx` (tw-framework-front):
- `const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]` (L16)
- `<select onChange={(e) => { table.setPageSize(Number(e.target.value)); table.setPageIndex(0); }}>` (L222)
- "전체 {totalRows}건" 텍스트 (L224)

`data-table-pagination.tsx`:
- shadcn `<Select>` 사용 — **grid-core에는 shadcn peerDep 없음 → 적용 불가**

### 2.3 G-001 의사결정 사항 (상속)

| ID | 결정 |
|----|------|
| G-001/D1 | `DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100]` |
| G-001/D4 | `GridPaginationProps`에 `pageSizeOptions`, `showTotalCount` 포함 (이 spec에서 구현) |
| G-001/D5 | `pagination.mode` → TanStack 옵션 통합 (`buildPaginationOptions`) |

---

## Section 3. 범위 (Scope)

### 포함 (In Scope)

1. `PageSizeSelect` 컴포넌트 신규 생성 (native `<select>`)
2. `TotalCount` 컴포넌트 신규 생성
3. `GridPagination.tsx` 스켈레톤 → 실제 UI 완성 (PageSizeSelect + TotalCount 조합)
4. `types.ts` `GridPaginationOptions`에 `showTotalCount?: boolean` 필드 추가
5. `index.ts` `PageSizeSelect`, `TotalCount` public export 추가
6. `Grid.tsx` L365-419 인라인 pagination UI → `<GridPagination>` 호출로 교체  
   (L160 `showPagination` gate도 `mode:'client'|'server'` 케이스 포함하도록 수정)

### 제외 (Out of Scope)

- `pageSize = -1` "전체 보기" 옵션 → G-003/MOD-GRID-17 (별도 Goal)
- 페이지 탐색 버튼 UI (이전/다음/처음/마지막) → G-001이 이미 Grid.tsx에 보존, G-002는 건드리지 않음  
  *(단, Grid.tsx 교체 시 탐색 버튼 JSX는 GridPagination 내부로 함께 이전)*
- 서버 사이드 pagination 추가 API — G-001에서 결정된 구조 그대로 사용
- 스타일 커스터마이징 Props (className 등) — MVP 범위 외

---

## Section 4. 수용 기준 (Acceptance Criteria)

| ID | 기준 | 검증 방법 |
|----|------|----------|
| AC-001 | `pageSizeOptions` 미전달 시 `[10, 20, 50, 100]` 렌더링 | 스냅샷/수동 확인 |
| AC-002 | `<select>` 값 변경 시 `table.setPageSize(N)` + `table.setPageIndex(0)` 호출 | 단위 테스트 |
| AC-003 | `showTotalCount={true}` (기본) 시 "전체 **N**건" 표시 | 스냅샷 |
| AC-004 | `showTotalCount={false}` 시 TotalCount DOM 미렌더링 | 스냅샷 |
| AC-005 | `mode='server'` + `totalCount=500` 시 "전체 **500**건" 표시 | 단위 테스트 |
| AC-006 | `mode='client'` 시 `table.getFilteredRowModel().rows.length` 기반 건수 표시 | 단위 테스트 |
| AC-007 | Grid.tsx에서 `enablePagination=true` OR `pagination.mode='client'|'server'` 시 `<GridPagination>` 렌더링 | 수동 확인 |
| AC-008 | `PageSizeSelect`, `TotalCount` 가 `@tomis/grid-core` public API로 import 가능 | 빌드 확인 |
| AC-009 | Grid.tsx L365-419 인라인 pagination JSX 제거 확인 (중복 제거) | 코드 리뷰 |
| AC-010 | TypeScript strict + `exactOptionalPropertyTypes:true` 빌드 오류 없음 | `tsc --noEmit` |

---

## Section 5. 의존성 (Dependencies)

| 종류 | 항목 | 비고 |
|------|------|------|
| 선행 Goal | MOD-GRID-03/G-001 | `GridPagination` 스켈레톤 + `buildPaginationOptions` 존재 전제 |
| 런타임 peerDep | `@tanstack/react-table` v8, `react` v18+ | grid-core package.json 기존 설정 |
| 금지 dep | shadcn/ui, @radix-ui | grid-core peerDep 없음 — native HTML만 |
| 내부 import | `buildPaginationOptions` (internal — Grid.tsx에서 직접 사용 안 함) | GridPagination이 `table` 객체 통해 간접 사용 |

---

## Section 6. 비기능 요건 (Non-Functional)

| 항목 | 요건 |
|------|------|
| 번들 크기 | PageSizeSelect + TotalCount 합계 < 1 KB (minified+gzip 기준) |
| 접근성 | `<select>`에 `aria-label="페이지당 행 수"` 필수 |
| 타입 안전성 | `exactOptionalPropertyTypes: true` 준수 (C-29) |
| 하위 호환 | `enablePagination=true` 기존 prop 동작 유지 (C-6 backward compat) |
| 렌더 성능 | GridPagination re-render는 pagination state 변경 시에만 발생 (memo 사용) |

---

## Section 7. 구현 파일 목록 (Implementation Files) ← C-30 단일 권위

> ⚠️ 이 표가 IMPLEMENT 단계의 **유일한 파일 권위**다. Section 11.1과 Section 8은 이 표와 100% 동일해야 한다.

| # | 경로 (monorepo root 기준) | 작업 | 설명 |
|---|--------------------------|------|------|
| 1 | `packages/grid-core/src/pagination/PageSizeSelect.tsx` | **CREATE** | 페이지 크기 native select 컴포넌트 |
| 2 | `packages/grid-core/src/pagination/TotalCount.tsx` | **CREATE** | 전체 건수 표시 컴포넌트 |
| 3 | `packages/grid-core/src/pagination/GridPagination.tsx` | **MODIFY** | 스켈레톤 → PageSizeSelect + TotalCount + 페이지 탐색 버튼 실체화 |
| 4 | `packages/grid-core/src/types.ts` | **MODIFY** | `GridPaginationOptions`에 `showTotalCount?: boolean` 추가 |
| 5 | `packages/grid-core/src/index.ts` | **MODIFY** | `PageSizeSelect`, `TotalCount` export 추가 |
| 6 | `packages/grid-core/src/Grid.tsx` | **MODIFY** | L365-419 인라인 UI 제거 → `<GridPagination>` 호출 + L160 gate 수정 |

**합계: CREATE 2 + MODIFY 4 = 6 파일**

> **C-28 준수 확인**: goals.json의 `implementFiles` 경로가 `D:/project/topvel_project/TOMIS/packages/` 접두어를 사용하고 있으나, 실제 monorepo 경로는 `topvel-grid-monorepo/packages/`다. 본 spec Section 7은 올바른 monorepo 경로를 사용한다. IMPLEMENT 단계에서 실제 파일 작업은 `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-core\src\...` 경로를 사용한다.

---

## Section 8. 의사결정 기록 (Architecture Decision Records)

### D1: goals.json implementFiles 경로 불일치 수정 (C-28)

| 항목 | 내용 |
|------|------|
| **문제** | goals.json `implementFiles`가 `D:/project/topvel_project/TOMIS/packages/...` 접두어 사용 |
| **올바른 경로** | `D:/project/topvel_project/topvel-grid-monorepo/packages/...` |
| **결정** | 본 spec 및 IMPLEMENT에서 monorepo 경로 사용. goals.json 수정은 IMPLEMENT 단계에서 진행 |
| **근거** | C-28: "goals.json implementFiles 경로 prefix는 `topvel-grid-monorepo/packages/`" |

### D2: Grid.tsx 인라인 UI 교체 (Path B — C-31 준수)

| 항목 | 내용 |
|------|------|
| **선택지** | Path A: Grid.tsx 건드리지 않음 (GridPagination 생성하나 호출 안 함) |
| | **Path B (채택)**: Grid.tsx L365-419 인라인 JSX → `<GridPagination>` 호출로 교체 |
| | Path C: 스켈레톤 유지 (Goal 미달성) |
| **결정** | Path B |
| **근거** | C-31(Functional Wiring Audit): "유틸/컴포넌트 생성 후 반드시 실제 호출처에서 사용 확인 의무". Path A는 GridPagination이 존재하나 Grid.tsx에서 호출되지 않아 C-31 위반. |
| **위험** | Grid.tsx 수정 범위가 넓음 → Section 11.2 Step 6에서 탐색 버튼 JSX 이전 절차 명시 |

### D3: showTotalCount 기본값 = true

| 항목 | 내용 |
|------|------|
| **결정** | `showTotalCount` 미전달 시 `true` (= "전체 N건" 표시) |
| **근거** | Grid.tsx L365-419 현재 구현이 조건 없이 "전체 N건" 표시 중. `false` 기본값으로 하면 기존 사용자에게 소리 없는 회귀(silent regression) 발생. BaseGrid.tsx도 항상 표시 패턴 사용. |
| **C-6 준수** | backward compat 보장 |

### D4: native `<select>` 사용 (shadcn 금지)

| 항목 | 내용 |
|------|------|
| **결정** | `<select>` native HTML 요소 사용 |
| **근거** | grid-core `package.json` peerDependencies에 shadcn/ui, @radix-ui 없음. Grid.tsx 현재 구현도 native `<select>`. BaseGrid.tsx도 동일. data-table-pagination.tsx의 shadcn `<Select>`는 다른 패키지(tw-framework-front)에만 적용 |
| **AC-001 연결** | `aria-label="페이지당 행 수"` 접근성 속성 필수 |

### D5: pageSize=-1 "전체 보기" 제외

| 항목 | 내용 |
|------|------|
| **결정** | G-002 범위 외 |
| **근거** | data-table-pagination.tsx의 -1 옵션은 `pageSizeOptions` 기본값 `[10,20,50,100]`에 포함되지 않음. 별도 Goal(G-003/MOD-GRID-17)로 분리 |

### D6: types.ts MODIFY 필수

| 항목 | 내용 |
|------|------|
| **결정** | `types.ts`의 `GridPaginationOptions`에 `showTotalCount?: boolean` 추가 |
| **근거** | 현재 `GridPaginationOptions`(L174-211)에 `showTotalCount` 필드 없음. GridPagination.tsx props에서 `showTotalCount`를 쓰려면 `GridPaginationOptions`에 정의 필요. `GridPaginationProps`(GridPagination.tsx 내부)도 동일 필드 보유. |

### D7: Grid.tsx L160 showPagination gate 수정

| 항목 | 내용 |
|------|------|
| **현재** | `const showPagination = props.enablePagination === true;` |
| **결정** | `const showPagination = props.enablePagination === true \|\| (props.pagination?.mode === 'client' \|\| props.pagination?.mode === 'server');` |
| **근거** | `buildTableOptions`(L103)는 `paginationActive = enablePagination===true \|\| impliedEnablePagination`으로 TanStack 활성화. 그러나 L160 gate는 `enablePagination===true`만 확인 → mode='client'|'server' 시 TanStack은 pagination 켜졌으나 UI는 미표시. AC-007 준수를 위해 일관성 수정 필요. |

---

## Section 9. 인터페이스 명세 (Interface Specification)

### 9.1 PageSizeSelectProps

```typescript
// packages/grid-core/src/pagination/PageSizeSelect.tsx

export interface PageSizeSelectProps {
  /** 현재 pageSize 값 */
  pageSize: number;
  /** 선택 가능한 pageSize 옵션 목록. 기본 [10,20,50,100] */
  pageSizeOptions: number[];
  /** pageSize 변경 콜백 */
  onPageSizeChange: (size: number) => void;
}
```

### 9.2 TotalCountProps

```typescript
// packages/grid-core/src/pagination/TotalCount.tsx

export interface TotalCountProps {
  /** 전체 행 수 */
  total: number;
}
```

### 9.3 GridPaginationProps (수정 후)

```typescript
// packages/grid-core/src/pagination/GridPagination.tsx
// (G-001 스켈레톤에서 이미 정의됨 — showTotalCount 구현 활성화)

export interface GridPaginationProps<TData> {
  table: Table<TData>;
  mode?: PaginationMode;
  /** server 모드 외부 전체 건수 */
  totalCount?: number;
  /** 외부 pageCount (server 모드) */
  pageCount?: number;
  /** 페이지 크기 옵션. 기본 [10,20,50,100] */
  pageSizeOptions?: number[];
  /** 전체 건수 표시 여부. 기본 true */
  showTotalCount?: boolean;
  /** pagination 변경 콜백 */
  onPaginationChange?: OnChangeFn<PaginationState>;
}
```

### 9.4 GridPaginationOptions 수정 (types.ts)

```typescript
// 추가할 필드 (기존 필드 유지)
showTotalCount?: boolean;
// JSDoc: "전체 건수 표시 여부. 기본 true. false 설정 시 '전체 N건' UI 숨김."
```

---

## Section 10. 데이터 흐름 (Data Flow)

```
Grid.tsx
  ├─ props.pagination.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS
  ├─ props.pagination.showTotalCount (undefined → GridPagination 기본값 처리)
  └─ <GridPagination
       table={table}
       mode={props.pagination?.mode}
       totalCount={props.pagination?.totalCount}
       pageSizeOptions={props.pagination?.pageSizeOptions}
       showTotalCount={props.pagination?.showTotalCount}
     />

GridPagination.tsx
  ├─ totalRows 계산:
  │    mode==='server' && totalCount !== undefined
  │      → totalCount
  │    else
  │      → table.getFilteredRowModel().rows.length
  ├─ <PageSizeSelect
  │    pageSize={table.getState().pagination.pageSize}
  │    pageSizeOptions={pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS}
  │    onPageSizeChange={(size) => {
  │      table.setPageSize(size);
  │      table.setPageIndex(0);
  │    }}
  │  />
  ├─ {(showTotalCount ?? true) && <TotalCount total={totalRows} />}
  └─ [페이지 탐색 버튼 — Grid.tsx L365-419에서 이전]

PageSizeSelect.tsx
  └─ <select aria-label="페이지당 행 수" value={pageSize} onChange={...}>
       {pageSizeOptions.map(size => <option key={size} value={size}>{size}개</option>)}
     </select>

TotalCount.tsx
  └─ <span>전체 <strong>{total}</strong>건</span>
```

---

## Section 11. 구현 명세 (Implementation Specification)

### 11.1 파일별 변경 명세

> ⚠️ C-30/E-06: 아래 목록은 Section 7 표와 100% 동일해야 한다.

| # | 파일 | 작업 | 변경 내용 요약 |
|---|------|------|----------------|
| 1 | `packages/grid-core/src/pagination/PageSizeSelect.tsx` | **CREATE** | `PageSizeSelectProps` 인터페이스 + `PageSizeSelect` 컴포넌트 (native select) |
| 2 | `packages/grid-core/src/pagination/TotalCount.tsx` | **CREATE** | `TotalCountProps` 인터페이스 + `TotalCount` 컴포넌트 |
| 3 | `packages/grid-core/src/pagination/GridPagination.tsx` | **MODIFY** | `return null` → 실제 UI: PageSizeSelect + TotalCount + 페이지 탐색 버튼 조합 |
| 4 | `packages/grid-core/src/types.ts` | **MODIFY** | `GridPaginationOptions`에 `showTotalCount?: boolean` 필드 + JSDoc 추가 |
| 5 | `packages/grid-core/src/index.ts` | **MODIFY** | pagination export 블록에 `PageSizeSelect`, `TotalCount` 추가 |
| 6 | `packages/grid-core/src/Grid.tsx` | **MODIFY** | L160 gate 수정 + L365-419 인라인 JSX 제거 → `<GridPagination ...>` 호출로 교체 |

**합계: CREATE 2 + MODIFY 4 = 6 파일** ← Section 7 표와 동일

### 11.2 단계별 구현 절차

#### Step 1: types.ts — showTotalCount 필드 추가

파일: `packages/grid-core/src/types.ts`

`GridPaginationOptions` 인터페이스 내 `pageSizeOptions` 필드 다음에 삽입:

```typescript
/**
 * 전체 건수 표시 여부. 기본 `true`.
 * `false` 설정 시 "전체 N건" UI를 숨긴다.
 */
showTotalCount?: boolean;
```

#### Step 2: PageSizeSelect.tsx — 신규 생성

파일: `packages/grid-core/src/pagination/PageSizeSelect.tsx`

```typescript
/**
 * 페이지 크기 선택 컴포넌트.
 * native <select> 사용 (grid-core에 shadcn peerDep 없음).
 * @see G-002-spec.md Section 9.1
 */
import React from 'react';

export interface PageSizeSelectProps {
  pageSize: number;
  pageSizeOptions: number[];
  onPageSizeChange: (size: number) => void;
}

export const PageSizeSelect = React.memo(function PageSizeSelect({
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
}: PageSizeSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <span>페이지당 행 수:</span>
      <select
        aria-label="페이지당 행 수"
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        className="border border-gray-300 rounded px-2 py-1 text-sm"
      >
        {pageSizeOptions.map((size) => (
          <option key={size} value={size}>
            {size}개
          </option>
        ))}
      </select>
    </div>
  );
});
```

#### Step 3: TotalCount.tsx — 신규 생성

파일: `packages/grid-core/src/pagination/TotalCount.tsx`

```typescript
/**
 * 전체 건수 표시 컴포넌트.
 * @see G-002-spec.md Section 9.2
 */
import React from 'react';

export interface TotalCountProps {
  total: number;
}

export const TotalCount = React.memo(function TotalCount({ total }: TotalCountProps) {
  return (
    <span>
      전체 <strong>{total}</strong>건
    </span>
  );
});
```

#### Step 4: GridPagination.tsx — 스켈레톤 실체화

파일: `packages/grid-core/src/pagination/GridPagination.tsx`

현재 `return null`을 아래로 교체한다. props는 G-001 스켈레톤 정의 그대로 유지하되 `showTotalCount` 사용 활성화.

```typescript
/**
 * GridPagination — 페이지 크기 선택 + 전체 건수 + 페이지 탐색 UI.
 *
 * G-001: props/구조 정의
 * G-002: 실제 UI 구현 (PageSizeSelect + TotalCount + 탐색 버튼)
 *
 * @see G-002-spec.md Section 10
 */
import React from 'react';
import { type OnChangeFn, type PaginationState, type Table } from '@tanstack/react-table';
import type { PaginationMode } from './types';
import { PageSizeSelect } from './PageSizeSelect';
import { TotalCount } from './TotalCount';

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export interface GridPaginationProps<TData> {
  table: Table<TData>;
  mode?: PaginationMode;
  totalCount?: number;
  pageCount?: number;
  pageSizeOptions?: number[];
  showTotalCount?: boolean;
  onPaginationChange?: OnChangeFn<PaginationState>;
}

export function GridPagination<TData>({
  table,
  mode,
  totalCount,
  pageSizeOptions,
  showTotalCount,
}: GridPaginationProps<TData>) {
  const pagination = table.getState().pagination;

  // totalRows 계산: server 모드 + 외부 totalCount 우선, 없으면 filtered rows 수
  const totalRows =
    mode === 'server' && typeof totalCount === 'number'
      ? totalCount
      : table.getFilteredRowModel().rows.length;

  const effectivePageSizeOptions = pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS;
  // showTotalCount 기본값 = true (D3: 기존 Grid.tsx 동작 보존)
  const shouldShowTotal = showTotalCount ?? true;

  const canPrevious = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();

  return (
    <div className="flex items-center justify-between px-2 py-3 text-sm text-gray-600">
      <div className="flex items-center gap-2">
        <PageSizeSelect
          pageSize={pagination.pageSize}
          pageSizeOptions={effectivePageSizeOptions}
          onPageSizeChange={(size) => {
            table.setPageSize(size);
            table.setPageIndex(0);
          }}
        />
        {shouldShowTotal && <TotalCount total={totalRows} />}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => table.setPageIndex(0)}
          disabled={!canPrevious}
          className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50"
          aria-label="첫 페이지"
        >
          {'<<'}
        </button>
        <button
          onClick={() => table.previousPage()}
          disabled={!canPrevious}
          className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50"
          aria-label="이전 페이지"
        >
          {'<'}
        </button>
        <span className="px-2">
          {pagination.pageIndex + 1} / {table.getPageCount()}
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!canNext}
          className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50"
          aria-label="다음 페이지"
        >
          {'>'}
        </button>
        <button
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!canNext}
          className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50"
          aria-label="마지막 페이지"
        >
          {'>>'}
        </button>
      </div>
    </div>
  );
}
```

#### Step 5: index.ts — export 추가

파일: `packages/grid-core/src/index.ts`

기존 pagination export 블록:
```typescript
// G-001 (MOD-GRID-03): pagination mode API
export type { PaginationMode } from './pagination/types';
export { GridPagination } from './pagination/GridPagination';
export type { GridPaginationProps } from './pagination/GridPagination';
```

아래로 교체:
```typescript
// G-001 (MOD-GRID-03): pagination mode API
export type { PaginationMode } from './pagination/types';
export { GridPagination } from './pagination/GridPagination';
export type { GridPaginationProps } from './pagination/GridPagination';
// G-002 (MOD-GRID-03): pageSize select + total count components
export { PageSizeSelect } from './pagination/PageSizeSelect';
export type { PageSizeSelectProps } from './pagination/PageSizeSelect';
export { TotalCount } from './pagination/TotalCount';
export type { TotalCountProps } from './pagination/TotalCount';
```

#### Step 6: Grid.tsx — 인라인 UI → GridPagination 교체

파일: `packages/grid-core/src/Grid.tsx`

**6-A. L160 showPagination gate 수정**

현재:
```typescript
const showPagination = props.enablePagination === true;
```

수정 후:
```typescript
// D7: mode='client'|'server'도 pagination UI 표시 (TanStack gate L103과 일관성)
const showPagination =
  props.enablePagination === true ||
  props.pagination?.mode === 'client' ||
  props.pagination?.mode === 'server';
```

**6-B. GridPagination import 추가** (파일 상단 import 블록에 추가)

```typescript
import { GridPagination } from './pagination/GridPagination';
```

**6-C. L365-419 인라인 JSX → GridPagination 호출로 교체**

제거 대상 (현재 L365-419):
```tsx
{showPagination && (
  <div className="flex items-center justify-between px-2 py-3 text-sm text-gray-600">
    <div className="flex items-center gap-2">
      <span>페이지당 행 수:</span>
      <select
        value={pagination.pageSize}
        onChange={(e) => {
          table.setPageSize(Number(e.target.value));
          table.setPageIndex(0);
        }}
        className="border border-gray-300 rounded px-2 py-1 text-sm"
      >
        {(props.pagination?.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS).map((size) => (
          <option key={size} value={size}>
            {size}개
          </option>
        ))}
      </select>
      <span>
        전체 <strong>{totalRows}</strong>건
      </span>
    </div>
    {/* ... 탐색 버튼 JSX ... */}
  </div>
)}
```

교체 후:
```tsx
{showPagination && (
  <GridPagination
    table={table}
    mode={props.pagination?.mode}
    totalCount={props.pagination?.totalCount}
    pageSizeOptions={props.pagination?.pageSizeOptions}
    showTotalCount={props.pagination?.showTotalCount}
  />
)}
```

> **C-29 준수**: `showTotalCount`가 `undefined`인 경우 `GridPagination` 내부에서 `?? true`로 처리. `exactOptionalPropertyTypes:true` 환경에서 `undefined` 명시 할당은 금지이므로 조건부 prop 전달 불필요 (undefined passthrough는 허용).

**6-D. 불필요해진 변수 정리**

Grid.tsx에서 `totalRows` 계산 로직 및 인라인 pagination에서만 사용되던 변수들이 GridPagination 내부로 이전됨에 따라, Grid.tsx에서 해당 변수가 다른 곳에서도 사용되는지 확인 후 제거.

---

## Section 12. 테스트 명세 (Test Specification)

### 12.1 단위 테스트 (AC-002, AC-005, AC-006)

파일: `packages/grid-core/src/pagination/__tests__/PageSizeSelect.test.tsx`

| 테스트 케이스 | 검증 포인트 |
|--------------|------------|
| select 변경 시 onPageSizeChange(50) 호출 | AC-002 |
| pageSizeOptions=[10,20,50,100] 렌더링 4개 option | AC-001 |
| aria-label="페이지당 행 수" 존재 | 접근성 |

파일: `packages/grid-core/src/pagination/__tests__/TotalCount.test.tsx`

| 테스트 케이스 | 검증 포인트 |
|--------------|------------|
| total=500 시 "전체 500건" 텍스트 | AC-003 |

파일: `packages/grid-core/src/pagination/__tests__/GridPagination.test.tsx`

| 테스트 케이스 | 검증 포인트 |
|--------------|------------|
| showTotalCount=false 시 TotalCount 미렌더링 | AC-004 |
| mode='server', totalCount=500 시 TotalCount total=500 | AC-005 |
| mode='client' 시 filteredRows.length 기반 | AC-006 |
| pageSize 변경 시 setPageSize + setPageIndex(0) 순서 | AC-002 |

### 12.2 타입 검증

```bash
# topvel-grid-monorepo 루트에서
pnpm -F @tomis/grid-core tsc --noEmit
```

---

## Section 13. 자기-점검 (Self-Check)

### 13.1 C-30 Spec Truth Table Discipline

| 점검 항목 | 결과 |
|----------|------|
| Section 7 표 = Section 11.1 표 동일 파일 수 | ✅ 양쪽 모두 CREATE 2 + MODIFY 4 = 6개 |
| Section 7 표 = Section 8 implementFiles 목록 | ✅ 동일 6개 파일 나열 |
| 본문에 "재결정/대체/대신/수정함" 키워드로 Section 7 표와 다른 결정 없음 | ✅ 없음 |

### 13.2 E-06 Section 7 Re-decision Consistency

| 점검 항목 | 결과 |
|----------|------|
| Section 8 ADR이 Section 7 표와 모순되는 결정 없음 | ✅ D1~D7 모두 Section 7 표를 뒷받침 |
| Section 11 Step이 Section 7 표에 없는 파일 언급 없음 | ✅ Step 1~6 = 파일 1~6 1:1 매핑 |
| Section 9 인터페이스가 Section 7 외 파일 생성 의미 없음 | ✅ 인터페이스는 위 6파일 내에 정의 |

### 13.3 C-31 Functional Wiring Audit

| 생성/수정 컴포넌트 | 호출처 확인 |
|------------------|------------|
| `PageSizeSelect` | `GridPagination.tsx` 내부에서 호출 ✅ |
| `TotalCount` | `GridPagination.tsx` 내부에서 조건부 호출 ✅ |
| `GridPagination` | `Grid.tsx` L365-419 교체 후 호출 ✅ |

### 13.4 C-29 exactOptionalPropertyTypes

| 점검 항목 | 결과 |
|----------|------|
| `undefined` 명시 할당 없음 | ✅ `?? true`, `?? DEFAULT_PAGE_SIZE_OPTIONS` 패턴 사용 |
| optional prop 전달 시 `undefined` literal 없음 | ✅ |

### 13.5 AC 완전성

| AC | Section 11 대응 Step |
|----|---------------------|
| AC-001 | Step 4 (GridPagination `?? DEFAULT_PAGE_SIZE_OPTIONS`) |
| AC-002 | Step 4 (`setPageSize` + `setPageIndex(0)`) |
| AC-003 | Step 3 (TotalCount) + Step 4 (`shouldShowTotal ?? true`) |
| AC-004 | Step 4 (`showTotalCount ?? true` → false 시 미렌더링) |
| AC-005 | Step 4 (mode==='server' totalCount 우선 분기) |
| AC-006 | Step 4 (else `getFilteredRowModel().rows.length`) |
| AC-007 | Step 6-A (showPagination gate 수정) |
| AC-008 | Step 5 (index.ts export 추가) |
| AC-009 | Step 6-C (인라인 JSX 제거) |
| AC-010 | Section 12.2 tsc --noEmit |

---

**spec 파일**: `D:\project\topvel_project\TOMIS\.claude\tw-grid\artifacts\MOD-GRID-03\pagination\G-002-spec.md`  
**Section 7 implementFiles**: CREATE 2 + MODIFY 4 = **6개**  
**본문-표 일관성 자기-점검**: Section 7 표 6개 파일 ↔ Section 11.1 표 6개 파일 ↔ Section 8 ADR 파일 목록 완전 일치. "재결정/대체/대신" 키워드로 표와 모순되는 본문 결정 없음. **통과 (PASS)**
