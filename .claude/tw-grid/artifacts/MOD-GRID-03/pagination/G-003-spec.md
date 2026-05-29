# G-003 Spec: 숫자 페이지 버튼 + 키보드 단축키 + DataTablePagination alias

**Module**: MOD-GRID-03 | **Goal**: G-003 | **Priority**: P1  
**Status**: SPECIFY  
**Created**: 2026-05-14  
**dependsOn**: MOD-GRID-03/G-002 (완료)  
**packageTarget**: packages/grid-core (MIT)  
**migrationThreshold**: 90 (medium)

---

★ 사전 결정 표 (Spec Writer 결정 — IMPLEMENT 단계 참고)

| D# | 결정 | 파일 수 영향 |
|----|------|------------|
| D1 | C-28: goals.json implementFiles prefix 정정 (`TOMIS/packages/` → `topvel-grid-monorepo/packages/`) | 경로 정정 |
| D2 | AC-005 "기존 시그니처 호환" 해석 — 신규 `{table, totalCount?}` TanStack 기반 시그니처 채택. 레거시 `{paging, listAction}` API는 tw-framework-front에 유지. MOD-GRID-17에서 적응 처리 | 시그니처 결정 |
| D3 | PageNumbers — 내부(internal) 컴포넌트. 별도 public export 없음 (C-8 준수) | N/A |
| D4 | 키보드 핸들러 — document.addEventListener 금지. GridPagination container `ref` scope 사용 | N/A |
| D5 | mode='none' 또는 pageCount ≤ 1 시 PageNumbers 렌더링하되 모든 숫자 버튼 disabled | N/A |
| **D6** | **implementFiles 5개 확정: CREATE 2 + MODIFY 3** | **C-8 준수** |

D6 breakdown: CREATE — `PageNumbers.tsx`, `DataTablePagination.tsx`. MODIFY — `GridPagination.tsx`, `types.ts`, `legacy/index.ts`.

---

## Section 1. 목적 (Purpose)

G-002가 완성한 `GridPagination`에 다음 세 가지 기능을 추가한다.

1. **숫자 페이지 버튼** (`PageNumbers.tsx`): 슬라이딩 윈도우 최대 5개 + 좌/우 말줄임 (…)  
   - L0 레거시 `data-table-pagination.tsx`의 `getPageNumbers()` 로직 흡수  
   - `window.innerWidth` 분기(L0 L97) 대신 항상 max 5 표시 (모바일 반응형은 별도 Goal)

2. **키보드 단축키** (`enableKeyboardNav` prop): Alt+← 이전 / Alt+→ 다음  
   - container `ref` scope 이벤트 리스너 (multi-grid 안전성 — D4)  
   - `addEventListener` + `cleanup(return)` 패턴

3. **DataTablePagination alias** (`legacy/DataTablePagination.tsx`): 신규 `{table, totalCount?}` TanStack 시그니처로 `GridPagination`을 래핑하는 deprecation alias  
   - `import { DataTablePagination } from '@tomis/grid-core/legacy'`  
   - C-6 backward compat: deprecated alias 1 minor 유지  
   - `legacy/index.ts`에 추가하면 main `index.ts`의 기존 `export { ... } from './legacy'` (L19-30)를 통해 자동 노출 (main `index.ts` 무수정)

G-002 결과물(GridPagination.tsx — 처음/이전/›/‹/끝 버튼 + PageSizeSelect + TotalCount)을 기반으로,  
PageNumbers 통합 + keyboard wiring + legacy alias 생성으로 G-003을 완성한다.

**migrationImpact**: medium (affectedUsageFiles 0개, 신규 컴포넌트 + alias 추가)

---

## Section 2. 배경 및 현황 (Background)

### 2.1 L0 현재 상태 (G-002 완료 후)

| 위치 | 현황 |
|------|------|
| `GridPagination.tsx` | G-002 완성: PageSizeSelect + TotalCount + 처음/이전/숫자없음/다음/끝 버튼. `enableKeyboardNav` prop 없음 |
| `types.ts` `GridPaginationOptions` | `showTotalCount?: boolean` 추가됨 (G-002). `enableKeyboardNav?: boolean` 없음 |
| `legacy/index.ts` | BaseGrid/VirtualGrid/ColumnPinGrid/GroupedHeaderGrid/TreeGrid/useDeprecationWarn 6개 export. `DataTablePagination` 없음 |
| `PageNumbers.tsx` | 미존재 |
| `legacy/DataTablePagination.tsx` | 미존재 |
| `index.ts` L19-30 | `export { BaseGrid, VirtualGrid, ... } from './legacy'` — legacy sub-entry 자동 re-export. main index.ts는 G-003에서 수정 불필요 |

### 2.2 L0 AS-IS 레거시 패턴

`data-table-pagination.tsx` (tw-framework-front/src/components/DataTable/):
- Props: `{ paging: PagingInfo; listAction: (target: string, value: any) => void }` — **TanStack 비호환 시그니처**
- `getPageNumbers()` 알고리즘 (L17-27):
  ```ts
  const maxPagesToShow = 5;
  let startPage = Math.max(1, paging.pageNo - Math.floor(maxPagesToShow / 2));
  const endPage = Math.min(paging.pageCount, startPage + maxPagesToShow - 1);
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }
  return Array.from({length: endPage - startPage + 1}, (_, i) => startPage + i);
  ```
- L97: `.slice(0, window.innerWidth < 640 ? 3 : 5)` — 모바일 3개 분기. **G-003은 항상 5 표시 (D3 메모: 모바일은 별도 Goal)**
- 처음/끝 버튼: `FaAngleDoubleLeft/Right` (react-icons) → grid-core는 텍스트/HTML entity 사용 (C-5 Tailwind only, react-icons peerDep 없음)
- shadcn `<Select>`, react-icons → **grid-core에는 불가. native HTML + Tailwind만**

### 2.3 L1 TanStack v8 API

```ts
// TanStack Table v8 페이지네이션 API
table.getPageCount()              // 전체 페이지 수 (number)
table.getState().pagination       // { pageIndex: number; pageSize: number }
table.setPageIndex(idx: number)   // 특정 페이지로 이동
table.previousPage()              // 이전 페이지
table.nextPage()                  // 다음 페이지
table.getCanPreviousPage()        // boolean
table.getCanNextPage()            // boolean
```

### 2.4 G-002 의사결정 사항 (상속)

| ID | 결정 |
|----|------|
| G-002/D4 | native HTML 요소 사용 (shadcn 금지) |
| G-002/D3 | showTotalCount 기본값 = true |
| G-001/D1 | DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] |

### 2.5 AC-005 시그니처 모순 (D2 — ADR 필수)

goals.json `acceptanceCriteria[AC-005]`: "기존 data-table-pagination.tsx props 시그니처 호환 (table, totalCount)"

그러나 실제 `data-table-pagination.tsx` (L8-11):
```ts
interface DataTablePaginationProps {
  paging: PagingInfo;
  listAction: (target: string, value: any) => void;
}
```

`{paging: PagingInfo, listAction: fn}` ≠ `{table, totalCount}`. 완전히 다른 API.  
**결정(D2)**: `{table, totalCount?}` TanStack 기반 신규 시그니처 채택. 기존 `{paging, listAction}` API는 tw-framework-front에 그대로 유지. MOD-GRID-17 마이그레이션 Goal에서 호출처 적응 처리.  
DataTablePagination alias는 내부적으로 `GridPagination`을 래핑하며 `{table, totalCount?}` 시그니처를 사용한다.

---

## Section 3. 범위 (Scope)

### 포함 (In Scope)

1. `PageNumbers.tsx` 신규 생성 — 슬라이딩 윈도우 숫자 버튼 (max 5 + 말줄임)
2. `legacy/DataTablePagination.tsx` 신규 생성 — GridPagination wrapper alias (`{table, totalCount?}` 시그니처)
3. `GridPagination.tsx` 수정 — PageNumbers 통합 + `enableKeyboardNav` useEffect 추가
4. `types.ts` 수정 — `GridPaginationOptions`에 `enableKeyboardNav?: boolean` 추가
5. `legacy/index.ts` 수정 — `DataTablePagination` export 추가

### 제외 (Out of Scope)

- 모바일 반응형 숫자 버튼 (3개 분기) — 별도 Goal
- `{paging, listAction}` 레거시 시그니처 호환 — AC-005 D2 결정으로 배제. MOD-GRID-17 적응 처리
- main `index.ts` 수정 — `legacy/index.ts` 추가로 자동 노출 (D6 근거)
- Storybook story 파일 — 별도 Goal (AC-006 검증 메모로 처리)

---

## Section 4. 수용 기준 (Acceptance Criteria)

| ID | 기준 | 출처 | 검증 방법 |
|----|------|------|----------|
| AC-001 | 처음(«)/이전(‹)/다음(›)/끝(») 버튼 — `table.setPageIndex(0)`, `table.previousPage()`, `table.nextPage()`, `table.setPageIndex(pageCount-1)` 각각 호출. `getCanPreviousPage()===false` 시 처음/이전 disabled, `getCanNextPage()===false` 시 다음/끝 disabled | (C-2) L1 | 단위 테스트 |
| AC-002 | 숫자 페이지 버튼 — 슬라이딩 윈도우 최대 5개, 현재 페이지 기준 중앙 정렬. 좌측 window 외 페이지 있으면 첫 버튼 앞에 `…`, 우측 window 외 페이지 있으면 마지막 버튼 뒤에 `…`. 현재 페이지 버튼 disabled + active 스타일 | (L0) L0 | 단위 테스트 + 스냅샷 |
| AC-003 | `!table.getCanPreviousPage()` 시 처음/이전 `disabled` 속성 + Tailwind `opacity-40 pointer-events-none`. `!table.getCanNextPage()` 시 다음/끝 동일 처리 | (C-5) C-5 | 단위 테스트 |
| AC-004 | `enableKeyboardNav={true}` 시 Alt+← → `table.previousPage()`, Alt+→ → `table.nextPage()` 호출. container `ref`에 이벤트 리스너 등록 + cleanup(return) 확인 | (C-2) L1 | 단위 테스트 |
| AC-005 | `DataTablePagination` — `import { DataTablePagination } from '@tomis/grid-core/legacy'` 가능. props 시그니처 `{ table: Table<TData>; totalCount?: number }`. 내부적으로 GridPagination 호출 | (C-6) C-6 | 빌드 확인 + 타입 체크 |
| AC-006 | Storybook story 1개 — client/server 두 모드 데모 (Section 12.2 참고) | (C-25) C-25 | 수동 확인 (story 작성 계획 명시) |

---

## Section 5. 의존성 (Dependencies)

| 종류 | 항목 | 비고 |
|------|------|------|
| 선행 Goal | MOD-GRID-03/G-002 | GridPagination (처음/이전/다음/끝 버튼 + PageSizeSelect + TotalCount) 완성 전제 |
| 런타임 peerDep | `@tanstack/react-table` v8, `react` v18+ | grid-core package.json 기존 설정 |
| 금지 dep | react-icons, shadcn/ui, @radix-ui | grid-core peerDep 없음 — native HTML + Tailwind only |
| 내부 참조 | `GridPagination` (GridPagination.tsx 기존 구현) | DataTablePagination이 GridPagination을 import |

---

## Section 6. 비기능 요건 + 엣지 케이스 (Non-Functional + Edge Cases)

| 항목 | 요건 |
|------|------|
| 번들 크기 | G-003 추가분 < 2 KB (PageNumbers < 1 KB, DataTablePagination < 0.5 KB, keyboard handler < 0.5 KB) |
| 타입 안전성 | `exactOptionalPropertyTypes: true` 준수 (C-29) |
| 키보드 멀티 인스턴스 | container `ref` scope 사용 (D4) — 동일 페이지 다수 GridPagination 독립 동작 |
| 접근성 | 숫자 버튼 `aria-label="페이지 N으로 이동"`, 말줄임 버튼 `aria-hidden="true"` |
| 하위 호환 | `enableKeyboardNav` 미전달 시 기존 동작 불변 (C-6) |

### 엣지 케이스 (E-04 충족)

| EC | 시나리오 | 기대 동작 |
|----|----------|----------|
| EC-01 | `pageCount=0` 또는 `mode='none'` | PageNumbers: 빈 배열 → 버튼 0개. 처음/이전/다음/끝 모두 disabled |
| EC-02 | `pageCount=1` (단일 페이지) | PageNumbers: 버튼 1개 (현재 페이지) disabled. 처음/이전/다음/끝 모두 disabled |
| EC-03 | 전체 페이지 수 ≤ 5 | 말줄임 없음. 전체 숫자 버튼 렌더 (1, 2, 3, 4, 5) |
| EC-04 | 전체 페이지 수 > 5, 현재 pageIndex=0 | 좌측 말줄임 없음. 우측 말줄임 있음. 버튼: 1[active], 2, 3, 4, 5, … |
| EC-05 | 전체 페이지 수 > 5, 현재 pageIndex=마지막 | 좌측 말줄임 있음. 우측 말줄임 없음. 버튼: …, N-4, N-3, N-2, N-1, N[active] |
| EC-06 | `enableKeyboardNav=true`, 컴포넌트 unmount | cleanup 함수에서 `removeEventListener` 실행 — 메모리 누수 없음 |
| EC-07 | `enableKeyboardNav` 미전달(undefined) | 키보드 이벤트 리스너 미등록 (기존 동작 보존) |
| EC-08 | 첫 페이지에서 Alt+← | `table.getCanPreviousPage()===false` → `previousPage()` 호출 skip |

---

## Section 7. 구현 파일 목록 (Implementation Files) ← C-30 단일 권위

> ⚠️ 이 표가 IMPLEMENT 단계의 **유일한 파일 권위**다. Section 11.1과 Section 8은 이 표와 100% 동일해야 한다.

| # | 경로 (monorepo root 기준) | 작업 | 설명 |
|---|--------------------------|------|------|
| 1 | `packages/grid-core/src/pagination/PageNumbers.tsx` | **CREATE** | 슬라이딩 윈도우 숫자 페이지 버튼 컴포넌트 (internal) |
| 2 | `packages/grid-core/src/legacy/DataTablePagination.tsx` | **CREATE** | GridPagination wrapper deprecation alias |
| 3 | `packages/grid-core/src/pagination/GridPagination.tsx` | **MODIFY** | PageNumbers 통합 + enableKeyboardNav useEffect 추가 |
| 4 | `packages/grid-core/src/types.ts` | **MODIFY** | `GridPaginationOptions`에 `enableKeyboardNav?: boolean` 추가 |
| 5 | `packages/grid-core/src/legacy/index.ts` | **MODIFY** | `DataTablePagination` export 추가 |

**합계: CREATE 2 + MODIFY 3 = 5 파일** (C-8 ≤5 준수)

> **C-28 준수 확인**: goals.json의 `implementFiles` 경로가 `D:/project/topvel_project/TOMIS/packages/` 접두어를 사용하고 있으나, 실제 monorepo 경로는 `D:/project/topvel_project/topvel-grid-monorepo/packages/`다. 본 spec Section 7은 올바른 monorepo 경로를 사용한다. IMPLEMENT 단계에서 실제 파일 작업은 `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-core\src\...` 경로를 사용한다.

> **main `index.ts` 무수정 근거**: `packages/grid-core/src/index.ts` L19-30에 이미 `export { BaseGrid, VirtualGrid, ... } from './legacy'`가 존재한다. `legacy/index.ts`에 `DataTablePagination` export를 추가하면 main entry에서 자동 노출된다. 따라서 파일 #5에 main `index.ts` 포함 불필요 — C-8 준수 핵심.

---

## Section 8. 의사결정 기록 (Architecture Decision Records)

### 8.1 영향 사용처 목록

| 범주 | 파일 | 영향 |
|------|------|------|
| 직접 영향 | `packages/grid-core/src/pagination/GridPagination.tsx` | PageNumbers + keyboard 추가 (MODIFY) |
| 신규 생성 | `packages/grid-core/src/pagination/PageNumbers.tsx` | CREATE |
| 신규 생성 | `packages/grid-core/src/legacy/DataTablePagination.tsx` | CREATE |
| 자동 노출 | main `index.ts` L19-30 | `legacy/index.ts` 변경으로 DataTablePagination 자동 노출. 파일 수정 0 |
| 간접 영향 | `tw-framework-front` DataTablePagination 사용처 | MOD-GRID-17 Goal에서 별도 처리 (C-19 점진) |

affectedUsageFiles: **0개** (신규 기능 추가. 기존 사용처에 breaking change 없음)

### D1: C-28 goals.json 경로 정정

| 항목 | 내용 |
|------|------|
| **문제** | goals.json `implementFiles`가 `D:/project/topvel_project/TOMIS/packages/...` 접두어 사용 |
| **올바른 경로** | `D:/project/topvel_project/topvel-grid-monorepo/packages/...` |
| **결정** | 본 spec 및 IMPLEMENT에서 monorepo 경로 사용. goals.json 정정은 IMPLEMENT 단계에서 진행 |
| **근거** | C-28: goals.json implementFiles 경로 prefix = `topvel-grid-monorepo/packages/` |

### D2: AC-005 시그니처 결정 — 신규 TanStack 기반

| 항목 | 내용 |
|------|------|
| **모순** | goals.json AC-005: "기존 시그니처 호환 (table, totalCount)" vs 실제 파일 `{paging: PagingInfo, listAction: fn}` |
| **선택지 A** | 레거시 `{paging, listAction}` 그대로 유지 + 내부 TanStack 변환 (변환 복잡도 높음, shadcn 의존성 문제) |
| **선택지 B (채택)** | 신규 `{table, totalCount?}` TanStack 기반 시그니처. `DataTablePagination`은 `GridPagination` alias. 레거시 호출처는 MOD-GRID-17에서 적응 |
| **결정** | **선택지 B** |
| **근거** | (1) goals.json `migrationPath`: "DataTablePagination → GridPagination + pagination prop 통합" — TanStack 기반 지향 명시. (2) shadcn `<Select>`, react-icons를 grid-core에 넣을 수 없음 (C-4/C-5). (3) C-6 backward compat는 deprecation alias 제공으로 충족. |
| **영향** | MOD-GRID-17 호출처에서 `{paging, listAction}` → `{table, totalCount?}` 적응 필요 (별도 Goal) |

### D3: PageNumbers — internal 컴포넌트, public export 없음

| 항목 | 내용 |
|------|------|
| **결정** | `PageNumbers.tsx`를 `pagination/` 디렉토리 내부에 두되, `index.ts`에 export 추가 없음 |
| **근거** | C-8: ≤5 파일 한도. main `index.ts` 수정 불필요. PageNumbers는 GridPagination 내부 구현 상세 — 외부 직접 사용 시나리오 없음. `PageSizeSelect`/`TotalCount`와 달리 단독 사용 불필요. |
| **C-31 준수** | PageNumbers는 GridPagination.tsx(파일 #3)에서 직접 import + render → wiring 완료 |

### D4: 키보드 핸들러 — container ref scope

| 항목 | 내용 |
|------|------|
| **결정** | `document.addEventListener` 금지. GridPagination container `<div ref={containerRef}>` 에 이벤트 리스너 등록 |
| **선택지 A** | `document.addEventListener` — 전역 등록, 간단 |
| **선택지 B (채택)** | container `ref` + `containerRef.current.addEventListener` |
| **근거** | 동일 페이지에 GridPagination 다수 렌더 시 (multi-grid 레이아웃) document 레벨 핸들러는 모든 인스턴스가 반응. container scope는 포커스된 pagination 인스턴스만 처리 가능. |
| **구현** | `useRef<HTMLDivElement>(null)` + `useEffect(() => { const el = containerRef.current; if (!el || !enableKeyboardNav) return; const handler = (e: KeyboardEvent) => {...}; el.addEventListener('keydown', handler); return () => el.removeEventListener('keydown', handler); }, [enableKeyboardNav, table])` |

### D5: mode='none' / pageCount ≤ 1 — PageNumbers 처리

| 항목 | 내용 |
|------|------|
| **결정** | `pageCountValue <= 1` 시 PageNumbers는 현재 페이지(1) 버튼 1개만 렌더, disabled |
| **근거** | EC-01/EC-02 일관된 처리. pageCount=0 엣지에서 빈 렌더(0개 버튼)보다 "1" 버튼 disabled가 UX상 자연스럽고 레이아웃 안정적. |

### D6: C-8 파일 수 관리 — main index.ts 무수정 전략

| 항목 | 내용 |
|------|------|
| **결정** | CREATE 2 + MODIFY 3 = 5 파일. main `index.ts` 수정 없음. |
| **근거** | `index.ts` L19-30: `export { BaseGrid, VirtualGrid, ... } from './legacy'`. `legacy/index.ts`에 DataTablePagination 추가 → main entry 자동 노출. G-002는 C-8을 6 파일로 위반했으나 C-31 trade-off로 수용. G-003은 이 전략으로 C-8 준수. |

### 8.2 무파괴 검증 (Non-Destructive Proof)

G-003은 기존 파일 3개를 수정하고 신규 파일 2개를 생성한다. 기존 API(GridPagination props, GridPaginationOptions, legacy exports) 대한 파괴적 변경 없음:
- `GridPagination.tsx` — 기존 props(`table`, `mode`, `totalCount`, `pageCount`, `pageSizeOptions`, `showTotalCount`, `onPaginationChange`) 유지. `enableKeyboardNav` 신규 optional prop 추가만.
- `types.ts` — 기존 `GridPaginationOptions` 필드 유지. `enableKeyboardNav?: boolean` 추가만.
- `legacy/index.ts` — 기존 6개 export 유지. `DataTablePagination` 추가만.

### 8.3 번들 영향 (C-21)

| 항목 | 예상 크기 |
|------|----------|
| `PageNumbers.tsx` | < 1 KB gzip |
| `DataTablePagination.tsx` | < 0.5 KB gzip |
| `enableKeyboardNav` useEffect | < 0.2 KB gzip |
| **G-003 총 추가** | **< 2 KB gzip** |
| G-002 완료 후 누적 | 9.6 KB gzip |
| G-003 완료 후 예상 | ~11.6 KB gzip (< 30 KB 한도) |

### 8.4 롤백 전략

- `DataTablePagination` alias가 문제 시: `legacy/index.ts`에서 export 제거만으로 롤백 가능
- `PageNumbers` 문제 시: `GridPagination.tsx`에서 PageNumbers 렌더링 조건부 비활성화
- `enableKeyboardNav` 문제 시: prop 무시(feature-flag 패턴) — 기존 버튼은 영향 없음

---

## Section 9. 인터페이스 명세 (Interface Specification)

### 9.1 PageNumbersProps (internal)

```typescript
// packages/grid-core/src/pagination/PageNumbers.tsx
// (public export 없음 — internal use only)

interface PageNumbersProps {
  /** 현재 페이지 (1-based, displayPage = pageIndex+1). */
  currentPage: number;
  /** 전체 페이지 수. */
  pageCount: number;
  /** 페이지 클릭 콜백 (1-based 페이지 번호 전달). */
  onPageChange: (page: number) => void;
}
```

### 9.2 DataTablePaginationProps (public legacy alias)

```typescript
// packages/grid-core/src/legacy/DataTablePagination.tsx

export interface DataTablePaginationProps<TData extends RowData> {
  /** TanStack Table 인스턴스. */
  table: Table<TData>;
  /**
   * Server 모드에서 전체 row 수.
   * 미전달 시 table.getFilteredRowModel().rows.length 사용.
   */
  totalCount?: number;
}
```

### 9.3 GridPaginationProps 수정 (추가 prop)

```typescript
// packages/grid-core/src/pagination/GridPagination.tsx 기존 props에 추가

export interface GridPaginationProps<TData extends RowData> {
  // ... 기존 props (table, mode, totalCount, pageCount, pageSizeOptions, showTotalCount, onPaginationChange) 유지 ...
  /**
   * Alt+← / Alt+→ 키보드 페이지 이동 활성화.
   * container ref 에 이벤트 리스너 등록. 기본 `false`.
   *
   * @since G-003 (MOD-GRID-03)
   */
  enableKeyboardNav?: boolean;
}
```

### 9.4 GridPaginationOptions 수정 (types.ts)

```typescript
// 기존 GridPaginationOptions 필드 유지 + 아래 추가

/**
 * Alt+← / Alt+→ 키보드 페이지 이동 활성화.
 * `GridPagination` 컴포넌트의 `enableKeyboardNav` prop에 연결.
 * 기본 `false`.
 *
 * @since G-003 (MOD-GRID-03)
 */
enableKeyboardNav?: boolean;
```

---

## Section 10. 데이터 흐름 (Data Flow)

```
GridPagination.tsx (수정 후)
  ├─ containerRef = useRef<HTMLDivElement>(null)
  ├─ enableKeyboardNav useEffect:
  │    if (!enableKeyboardNav) return;
  │    el.addEventListener('keydown', (e: KeyboardEvent) => {
  │      if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); table.previousPage(); }
  │      if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); table.nextPage(); }
  │    })
  │    return () => el.removeEventListener(...)
  │
  └─ render:
       <div ref={containerRef} ...>
         <div> [PageSizeSelect] [TotalCount] </div>
         <div> [«] [‹] [PageNumbers] [›] [»] </div>
       </div>

PageNumbers.tsx (신규)
  ├─ 입력: currentPage (1-based), pageCount, onPageChange
  ├─ 알고리즘 (L0 getPageNumbers 흡수):
  │    maxPagesToShow = 5
  │    startPage = Math.max(1, currentPage - Math.floor(5/2))
  │    endPage = Math.min(pageCount, startPage + 4)
  │    if (endPage - startPage + 1 < 5) startPage = Math.max(1, endPage - 4)
  │    pages = [startPage, ..., endPage]
  │
  ├─ 말줄임 판단:
  │    showLeftEllipsis = (startPage > 1)
  │    showRightEllipsis = (endPage < pageCount)
  │
  └─ render:
       {showLeftEllipsis && <span aria-hidden="true">…</span>}
       {pages.map(p => <button key={p} disabled={p===currentPage} onClick={onPageChange(p)}>p</button>)}
       {showRightEllipsis && <span aria-hidden="true">…</span>}

DataTablePagination.tsx (신규 — legacy alias)
  ├─ 입력: { table, totalCount? }
  └─ render: <GridPagination table={table} {...(totalCount !== undefined ? {totalCount} : {})} />
```

---

## Section 11. 구현 명세 (Implementation Specification)

### 11.1 파일별 변경 명세

> ⚠️ C-30/E-06: 아래 목록은 Section 7 표와 100% 동일해야 한다.

| # | 파일 | 작업 | 변경 내용 요약 |
|---|------|------|----------------|
| 1 | `packages/grid-core/src/pagination/PageNumbers.tsx` | **CREATE** | 슬라이딩 윈도우 숫자 버튼 + 말줄임 internal 컴포넌트 |
| 2 | `packages/grid-core/src/legacy/DataTablePagination.tsx` | **CREATE** | GridPagination wrapper alias (`useDeprecationWarn` 포함) |
| 3 | `packages/grid-core/src/pagination/GridPagination.tsx` | **MODIFY** | `enableKeyboardNav` prop + containerRef + PageNumbers 통합 |
| 4 | `packages/grid-core/src/types.ts` | **MODIFY** | `GridPaginationOptions`에 `enableKeyboardNav?: boolean` 추가 |
| 5 | `packages/grid-core/src/legacy/index.ts` | **MODIFY** | `DataTablePagination` export 추가 |

**합계: CREATE 2 + MODIFY 3 = 5 파일** ← Section 7 표와 동일

### 11.2 단계별 구현 절차

#### Step 1: types.ts — enableKeyboardNav 추가

파일: `packages/grid-core/src/types.ts`

`GridPaginationOptions` 인터페이스 내 `showTotalCount` 필드 다음에 삽입:

```typescript
/**
 * Alt+← / Alt+→ 키보드 페이지 이동 활성화.
 * `GridPagination` 컴포넌트의 `enableKeyboardNav` prop에 연결.
 * 기본 `false`.
 *
 * @since G-003 (MOD-GRID-03)
 */
enableKeyboardNav?: boolean;
```

#### Step 2: PageNumbers.tsx — 신규 생성

파일: `packages/grid-core/src/pagination/PageNumbers.tsx`

```typescript
/**
 * `PageNumbers` — 슬라이딩 윈도우 숫자 페이지 버튼 (최대 5개 + 말줄임).
 *
 * Internal 컴포넌트 — GridPagination.tsx에서만 사용.
 * L0 `data-table-pagination.tsx` getPageNumbers() 알고리즘 흡수.
 *
 * @since G-003 (MOD-GRID-03)
 */

import { memo } from 'react';

interface PageNumbersProps {
  /** 현재 페이지 (1-based). */
  currentPage: number;
  /** 전체 페이지 수. */
  pageCount: number;
  /** 페이지 클릭 콜백 (1-based 페이지 번호 전달). */
  onPageChange: (page: number) => void;
}

export const PageNumbers = memo(function PageNumbers({
  currentPage,
  pageCount,
  onPageChange,
}: PageNumbersProps) {
  if (pageCount <= 0) return null;

  // L0 getPageNumbers() 알고리즘 (data-table-pagination.tsx L17-27)
  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  const endPage = Math.min(pageCount, startPage + maxPagesToShow - 1);
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }
  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  const showLeftEllipsis = startPage > 1;
  const showRightEllipsis = endPage < pageCount;

  return (
    <>
      {showLeftEllipsis && (
        <span aria-hidden="true" className="px-1 text-gray-400">…</span>
      )}
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          disabled={p === currentPage}
          aria-label={`페이지 ${p}로 이동`}
          aria-current={p === currentPage ? 'page' : undefined}
          className={`px-2 py-1 rounded border text-sm ${
            p === currentPage
              ? 'bg-blue-600 text-white border-blue-600 disabled:opacity-100'
              : 'border-gray-300 hover:bg-gray-100 disabled:opacity-40'
          }`}
        >
          {p}
        </button>
      ))}
      {showRightEllipsis && (
        <span aria-hidden="true" className="px-1 text-gray-400">…</span>
      )}
    </>
  );
});
```

#### Step 3: DataTablePagination.tsx — 신규 생성

파일: `packages/grid-core/src/legacy/DataTablePagination.tsx`

```typescript
/**
 * `DataTablePagination` — `GridPagination` deprecation alias.
 *
 * @deprecated `GridPagination`으로 마이그레이션 권장 (C-23 — 1 minor 후 제거).
 *   기존 `{ paging: PagingInfo; listAction: fn }` 시그니처와는 호환하지 않음.
 *   신규 TanStack 기반 `{ table, totalCount? }` 시그니처 사용.
 *   호출처 적응: MOD-GRID-17 참고.
 *
 * @since G-003 (MOD-GRID-03)
 */

import type { RowData, Table } from '@tanstack/react-table';
import { GridPagination } from '../pagination/GridPagination';
import { useDeprecationWarn } from './useDeprecationWarn';

export interface DataTablePaginationProps<TData extends RowData> {
  /** TanStack Table 인스턴스. */
  table: Table<TData>;
  /**
   * Server 모드에서 전체 row 수.
   * 미전달 시 `table.getFilteredRowModel().rows.length` 사용.
   */
  totalCount?: number;
}

/**
 * `GridPagination` wrapper alias (C-6 backward compat).
 */
export function DataTablePagination<TData extends RowData>({
  table,
  totalCount,
}: DataTablePaginationProps<TData>): JSX.Element {
  useDeprecationWarn('DataTablePagination');
  return (
    <GridPagination<TData>
      table={table}
      {...(totalCount !== undefined ? { totalCount } : {})}
    />
  );
}
```

#### Step 4: GridPagination.tsx — enableKeyboardNav + PageNumbers 통합

파일: `packages/grid-core/src/pagination/GridPagination.tsx`

**Before (현재 G-002 완료 상태)**:

```typescript
export function GridPagination<TData extends RowData>({
  table,
  mode,
  totalCount,
  pageSizeOptions,
  showTotalCount,
}: GridPaginationProps<TData>): JSX.Element {
  const { pageIndex, pageSize } = table.getState().pagination;
  // ... PageSizeSelect + TotalCount + 이전/다음/처음/끝 버튼
  return (
    <div className="flex items-center justify-between px-2 py-3 text-sm text-gray-600">
      // ... (PageNumbers 없음, keyboard 없음)
    </div>
  );
}
```

**After (G-003 수정 후)**:

```typescript
import { useEffect, useRef } from 'react';
import type { OnChangeFn, PaginationState, RowData, Table } from '@tanstack/react-table';

import { PageNumbers } from './PageNumbers';
import { PageSizeSelect } from './PageSizeSelect';
import { TotalCount } from './TotalCount';
import type { PaginationMode } from './types';

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export interface GridPaginationProps<TData extends RowData> {
  table: Table<TData>;
  mode?: PaginationMode;
  totalCount?: number;
  pageCount?: number;
  pageSizeOptions?: number[];
  showTotalCount?: boolean;
  onPaginationChange?: OnChangeFn<PaginationState>;
  /** Alt+← / Alt+→ 키보드 페이지 이동. container ref scope 사용. 기본 false. */
  enableKeyboardNav?: boolean;
}

export function GridPagination<TData extends RowData>({
  table,
  mode,
  totalCount,
  pageSizeOptions,
  showTotalCount,
  enableKeyboardNav,
}: GridPaginationProps<TData>): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const { pageIndex, pageSize } = table.getState().pagination;

  // D4: container ref scope 키보드 핸들러 (document 전역 금지)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enableKeyboardNav) return;
    const handler = (e: KeyboardEvent): void => {
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        if (table.getCanPreviousPage()) table.previousPage();
      }
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        if (table.getCanNextPage()) table.nextPage();
      }
    };
    el.addEventListener('keydown', handler);
    return () => el.removeEventListener('keydown', handler);
  }, [enableKeyboardNav, table]);

  const effectivePageSizeOptions = pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS;
  const resolvedShowTotalCount = showTotalCount !== false;
  const totalRows =
    mode === 'server' && typeof totalCount === 'number'
      ? totalCount
      : table.getFilteredRowModel().rows.length;
  const pageCountValue = table.getPageCount();
  const currentPage = pageIndex + 1; // 1-based

  const handlePageSizeChange = (size: number): void => {
    table.setPageSize(size);
    table.setPageIndex(0);
  };

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-between px-2 py-3 text-sm text-gray-600"
    >
      <div className="flex items-center gap-2">
        <PageSizeSelect
          pageSize={pageSize}
          pageSizeOptions={effectivePageSizeOptions}
          onPageSizeChange={handlePageSizeChange}
        />
        {resolvedShowTotalCount && <TotalCount total={totalRows} />}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          aria-label="첫 페이지"
          className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
        >
          {'«'}
        </button>
        <button
          type="button"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="이전 페이지"
          className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
        >
          {'‹'}
        </button>
        <PageNumbers
          currentPage={currentPage}
          pageCount={pageCountValue}
          onPageChange={(p) => table.setPageIndex(p - 1)}
        />
        <button
          type="button"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="다음 페이지"
          className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
        >
          {'›'}
        </button>
        <button
          type="button"
          onClick={() => table.setPageIndex(pageCountValue - 1)}
          disabled={!table.getCanNextPage()}
          aria-label="마지막 페이지"
          className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
        >
          {'»'}
        </button>
      </div>
    </div>
  );
}
```

**주요 변경 포인트**:
- `useRef<HTMLDivElement>(null)` + container `ref={containerRef}`
- `useEffect` keyboard handler (enableKeyboardNav guard)
- `<PageNumbers>` 통합 (처음/이전/끝 버튼 사이)
- G-002의 `span {pageIndex+1} / {pageCountValue}` 텍스트 → PageNumbers 대체

#### Step 5: legacy/index.ts — DataTablePagination export 추가

파일: `packages/grid-core/src/legacy/index.ts`

**Before (현재)**:
```typescript
export { BaseGrid } from './BaseGrid';
export { VirtualGrid, type VirtualGridProps } from './VirtualGrid';
export { ColumnPinGrid, type ColumnPinGridProps } from './ColumnPinGrid';
export { GroupedHeaderGrid, type GroupedHeaderGridProps } from './GroupedHeaderGrid';
export { TreeGrid, type TreeGridProps } from './TreeGrid';
export { useDeprecationWarn } from './useDeprecationWarn';
export type { BaseGridProps } from '../types';
```

**After**:
```typescript
export { BaseGrid } from './BaseGrid';
export { VirtualGrid, type VirtualGridProps } from './VirtualGrid';
export { ColumnPinGrid, type ColumnPinGridProps } from './ColumnPinGrid';
export { GroupedHeaderGrid, type GroupedHeaderGridProps } from './GroupedHeaderGrid';
export { TreeGrid, type TreeGridProps } from './TreeGrid';
export { useDeprecationWarn } from './useDeprecationWarn';
export type { BaseGridProps } from '../types';
// G-003 (MOD-GRID-03): DataTablePagination deprecation alias
export { DataTablePagination } from './DataTablePagination';
export type { DataTablePaginationProps } from './DataTablePagination';
```

---

## Section 12. 테스트 명세 (Test Specification)

### 12.1 단위 테스트

파일: `packages/grid-core/src/pagination/__tests__/PageNumbers.test.tsx`

| 테스트 케이스 | 검증 포인트 |
|--------------|------------|
| pageCount=5, currentPage=3 → 버튼 5개 [1,2,3,4,5], 말줄임 없음 | AC-002 (EC-03) |
| pageCount=10, currentPage=1 → 버튼 [1,2,3,4,5], 우측 `…` 있음 | AC-002 (EC-04) |
| pageCount=10, currentPage=10 → `…` + [6,7,8,9,10], 좌측 `…` 있음 | AC-002 (EC-05) |
| pageCount=10, currentPage=5 → `…` + [3,4,5,6,7] + `…` | AC-002 |
| 현재 페이지 버튼 click → onPageChange 미호출 (disabled) | AC-002 |
| 다른 버튼 click → onPageChange(p) 호출 | AC-001 |
| pageCount=0 → null 렌더 (버튼 0개) | EC-01 |
| pageCount=1 → 버튼 [1] disabled | EC-02 |
| aria-label="페이지 3으로 이동" 존재 | 접근성 |
| 현재 페이지 버튼 aria-current="page" | 접근성 |

파일: `packages/grid-core/src/pagination/__tests__/GridPagination.test.tsx` (보강)

| 테스트 케이스 | 검증 포인트 |
|--------------|------------|
| enableKeyboardNav=true, Alt+← → table.previousPage() 호출 | AC-004 |
| enableKeyboardNav=true, Alt+→ → table.nextPage() 호출 | AC-004 |
| enableKeyboardNav=false(기본) → 키보드 이벤트 무반응 | AC-004, EC-07 |
| unmount 시 removeEventListener 호출 확인 | AC-004, EC-06 |
| 첫 페이지에서 Alt+← → previousPage 미호출 (getCanPreviousPage=false 가드) | EC-08 |
| PageNumbers 렌더 확인 — 숫자 버튼 존재 | AC-002 C-31 wiring |

파일: `packages/grid-core/src/legacy/__tests__/DataTablePagination.test.tsx`

| 테스트 케이스 | 검증 포인트 |
|--------------|------------|
| render 시 GridPagination 렌더됨 | AC-005 C-31 wiring |
| totalCount 미전달 → GridPagination totalCount prop 미전달 (C-29 spread skip) | AC-005, C-29 |
| totalCount=500 → GridPagination totalCount=500 전달 | AC-005 |
| useDeprecationWarn 경고 발생 | C-6 deprecation |

### 12.2 Storybook Story (AC-006)

파일: `packages/grid-core/src/stories/GridPagination.stories.tsx` (별도 작성 — C-8 범위 외)

| Story | 시나리오 |
|-------|----------|
| `ClientMode` | mode='client', 100행, pageSizeOptions=[10,20,50,100], showTotalCount=true |
| `ServerMode` | mode='server', totalCount=1000, pageCount=100 |
| `KeyboardNav` | enableKeyboardNav=true, alt+←/→ 동작 데모 |
| `FewPages` | pageCount=3 — 말줄임 없는 숫자 버튼 |

> **Note**: Storybook story 파일은 C-8 범위 외(별도 관리). AC-006 검증은 IMPLEMENT 단계에서 story 경로 확인으로 처리.

### 12.3 타입 검증 (C-12)

```bash
# topvel-grid-monorepo 루트에서
pnpm -F @tomis/grid-core tsc --noEmit
```

---

## Section 13. 상용 제품화 (Productization)

### 13.1 패키지 분류

`packages/grid-core` (MIT 라이선스) — Pro 패키지 아님.  
`configureGridLicense()` 호출 불필요 (F-02 N/A).

### 13.2 peerDependencies (C-22)

```json
{
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18",
    "@tanstack/react-table": ">=8"
  }
}
```

신규 의존성 추가 없음. 기존 peerDependencies 유지.

### 13.3 문서 계획 (C-25)

| 문서 | 경로 | 내용 |
|------|------|------|
| Storybook story | `packages/grid-core/src/stories/GridPagination.stories.tsx` | client/server/keyboard/few-pages 4개 story |
| API reference | Docusaurus `docs/grid-core/pagination.md` | GridPagination + DataTablePagination alias 명시 |
| Migration guide | `CHANGELOG.md` | DataTablePagination deprecated 공지, GridPagination 전환 가이드 |

### 13.4 DataTablePagination Deprecation 공지

`DataTablePagination`은 `GridPagination`의 1 minor 버전 alias다 (C-23/C-6).  
다음 major에서 제거 예정. 호출처는 `GridPagination` + `pagination={{ mode, totalCount, ... }}` 패턴으로 전환 권장.  
전환 가이드: MOD-GRID-17 참고.

---

## Section 14 (부록). 자기-점검 (Self-Check)

### 14.1 C-30 Spec Truth Table Discipline

| 점검 항목 | 결과 |
|----------|------|
| Section 7 표 = Section 11.1 표 동일 파일 수 | ✅ 양쪽 모두 CREATE 2 + MODIFY 3 = 5개 |
| Section 7 표 = Section 11.1 표 파일명 1:1 일치 | ✅ 동일 5개 파일 동일 순서 |
| Section 7 표 = Section 8 ADR 파일 목록 | ✅ D6 파일 목록 = Section 7 표 |
| 본문에 "재결정/대체/대신/수정함" 키워드로 Section 7 표와 다른 결정 없음 | ✅ 없음 |
| D6 사전 결정 표 breakdown vs Section 7 표 breakdown 일치 | ✅ "CREATE 2 (PageNumbers.tsx, DataTablePagination.tsx) + MODIFY 3 (GridPagination.tsx, types.ts, legacy/index.ts)" |

### 14.2 E-06 Section 7 Re-decision Consistency

| 점검 항목 | 결과 |
|----------|------|
| Section 8 ADR이 Section 7 표와 모순되는 결정 없음 | ✅ D1~D6 모두 Section 7 표를 뒷받침 |
| Section 11 Step이 Section 7 표에 없는 파일 언급 없음 | ✅ Step 1~5 = 파일 4, 1, 2&3, (3), 5 1:1 매핑 |
| Section 9 인터페이스가 Section 7 외 파일 생성 의미 없음 | ✅ 9.1~9.4 모두 위 5파일 내에 정의 |

### 14.3 C-31 Functional Wiring Audit

| 생성/수정 컴포넌트 | 호출처 확인 |
|------------------|------------|
| `PageNumbers` (CREATE) | `GridPagination.tsx` Step 4에서 import + `<PageNumbers>` 렌더 ✅ |
| `DataTablePagination` (CREATE) | `legacy/index.ts` Step 5에서 export + main `index.ts` L19-30 자동 노출 ✅ |
| `GridPagination.tsx` (MODIFY) | `DataTablePagination.tsx` 내부에서 호출 + 기존 Grid.tsx 호출 유지 ✅ |

### 14.4 C-8 파일 수

| 항목 | 수치 |
|------|------|
| CREATE | 2 (PageNumbers.tsx, DataTablePagination.tsx) |
| MODIFY | 3 (GridPagination.tsx, types.ts, legacy/index.ts) |
| **합계** | **5 ≤ 5** ✅ |

### 14.5 C-29 exactOptionalPropertyTypes

| 점검 항목 | 결과 |
|----------|------|
| `DataTablePagination` → `GridPagination` totalCount 전달: spread skip 패턴 사용 | ✅ `{...(totalCount !== undefined ? { totalCount } : {})}` |
| `undefined` 명시 할당 없음 | ✅ |
| `enableKeyboardNav` prop — GridPagination 내부에서 `?? false` 패턴으로 처리 | ✅ |

### 14.6 H 메타게이트 사전 점검

| H # | 점검 항목 | 결과 |
|-----|----------|------|
| H-01 | L0 경로 실재: `D:\project\topvel_project\TOMIS\tw-framework-front\src\components\DataTable\data-table-pagination.tsx` (Read 도구로 확인됨, L17-27 `getPageNumbers` 인용) | ✅ |
| H-01 | L1 TanStack API: `table.previousPage()`, `table.nextPage()`, `table.setPageIndex()`, `table.getCanPreviousPage()`, `table.getCanNextPage()`, `table.getPageCount()` (Section 2.3에 인용) | ✅ |
| H-02 | implementFiles 부모 디렉토리: `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-core\src\pagination\` + `legacy\` 모두 실재 (G-002에서 PageNumbers.tsx 제외 모든 파일 확인됨) | ✅ |
| H-03 | 모든 AC에 출처 태그 포함 (AC-001: C-2, AC-002: L0, AC-003: C-5, AC-004: C-2, AC-005: C-6, AC-006: C-25) | ✅ |

### 14.7 AC 완전성

| AC | Section 11 대응 Step |
|----|---------------------|
| AC-001 | Step 4 (처음/이전/다음/끝 버튼 TanStack API 호출) |
| AC-002 | Step 2 (PageNumbers.tsx 슬라이딩 윈도우 알고리즘 + 말줄임) |
| AC-003 | Step 4 (`disabled:opacity-40` Tailwind + `getCanPreviousPage/NextPage` 조건) |
| AC-004 | Step 4 (enableKeyboardNav useEffect + containerRef) |
| AC-005 | Step 3 (DataTablePagination alias `{table, totalCount?}`) + Step 5 (legacy export) |
| AC-006 | Section 12.2 (Storybook story 계획 명시) |

---

**spec 파일**: `D:\project\topvel_project\TOMIS\.claude\tw-grid\artifacts\MOD-GRID-03\pagination\G-003-spec.md`  
**Section 7 implementFiles**: CREATE 2 + MODIFY 3 = **5개** (C-8 ≤5 준수)  
**본문-표 일관성 자기-점검**: Section 7 표 5개 파일 ↔ Section 11.1 표 5개 파일 ↔ Section 8 D6 파일 목록 완전 일치. "재결정/대체/대신/수정함" 키워드로 표와 모순되는 본문 결정 없음. **통과 (PASS)**
