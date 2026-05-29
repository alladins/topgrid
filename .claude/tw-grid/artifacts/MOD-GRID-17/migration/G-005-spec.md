# G-005 Spec: hr/finance 사용처 마이그레이션 (FundStatus 1 파일 — Pattern B 4 페이지 deferred)

**Goal**: MOD-GRID-17 / migration / G-005
**Priority**: P0 | **Migration Impact**: high | **Threshold**: 95
**Package Target**: `tw-framework-front` (사용처 마이그레이션 — `@tomis/grid-core` 코어 변경 없음)
**License Tier**: N/A (MIT 영역만 사용)

---

## ★ 사전 결정 표 (D# — Spec Writer 권위)

| D# | 결정 | 사유 | goals.json 영향 |
|----|------|------|----------------|
| **D1** | **★ Scope reduction 5 → 1 파일 (Pattern B 4 페이지 deferred)**. goals.json G-005 `affectedUsageFiles[5]` 의 실측 결과:<br>• **InsEduc11HistoryPage** (L7-14): `useReactTable + getCoreRowModel + getSortedRowModel + flexRender + SortingState` 직접 import → **Pattern B**<br>• **DailyAttendancePage** (L12-17): `useReactTable + getCoreRowModel + flexRender` 직접 import → **Pattern B** (인라인 편집 모달 + 행 클릭)<br>• **InsEmpl22ContractListPage** (L8-13): `useReactTable + getCoreRowModel + flexRender` 직접 import → **Pattern B** (페이지네이션 + 행 선택)<br>• **AnnualLeaveStatusPage** (L13-20): `useReactTable + getCoreRowModel + getSortedRowModel + flexRender + SortingState` 직접 import → **Pattern B** (인라인 편집 셀 closure)<br>• **FundStatusPage** (L11): `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` → **Pattern A**<br>**Grep `<BaseGrid` 결과**: 5 페이지 중 **FundStatus 만 1 hit (L218)**, 나머지 4 페이지 0 hits.<br>본 Goal 의 최종 implementFiles = **1 파일 (FundStatusPage 한정 — Pattern A)**. Pattern B 4 페이지는 **별도 후속 Goal (예: G-005b 또는 MOD-GRID-18) 책임** — 마이그레이션 path 가 BaseGrid wrapper 와 본질적으로 다름 (manual `<table>` 제거 + 페이지별 Tailwind class 변형 + cell render closure 보존 필요). | ADR-005 (Investigative Scope-Reduction Authority) + A-04 v1.0.9 sub-bullet. **G-004 (DataTable 제외) 와 의미 구분**: MyNotification 은 **다른 컴포넌트** (`DataTable`) 사용, 본 4 페이지는 **같은 TanStack 라이브러리** 의 더 낮은 추상화 레벨 직접 사용 — 카테고리 다름. **Grid.tsx 실측 (D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/Grid.tsx L254-464)**: thead `px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider`, tbody row `bg-blue-50 hover:bg-blue-100 / hover:bg-gray-50`, cell `px-4 py-3 whitespace-nowrap text-gray-700`. Pattern B 4 페이지 각각 page-specific 클래스 (예: InsEduc `px-3 py-2 / px-3 py-1.5 hover:bg-blue-50/40` zebra, DailyAttendance `px-3 py-2 cursor-pointer hover:bg-blue-50`, InsEmpl22 `bg-gray-100 text-gray-700 / bg-blue-100` 선택, AnnualLeaveStatus `px-3 py-2 / px-3 py-1.5 hover:bg-blue-50/40` zebra) 와 픽셀 비호환 → AC-002 (high impact 외관 보존) 미충족 위험. | `affectedUsageFiles` 5 → **1** 운영 권위 (operative shrinkage marker). 배열 보존 (audit trail). |
| D2 | FundStatusPage 마이그레이션 패턴 = **그룹 A (local default import)**: L11 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` → `import { Grid } from '@tomis/grid-core';`. **G-001~G-003 cascading 패턴 (15 페이지 검증 완료)**. G-004 그룹 B (`@tomis/grid-core/legacy` named) 패턴 **본 Goal 없음** — Grep 결과 5 페이지 모두 `@tomis/grid-core/legacy` 0 hits. | 단일 PowerShell `Replace` 패턴 적용 가능 — 그룹 분기 불필요. 1 사이트만 변환 (FundStatus L218). | N/A |
| D3 | `<Grid>` props 매핑 = `enableSort` + `enableFilter` + `loading` + `emptyText` (FundStatus L218-223 의 4 종 props 보존). **`onRowClick` 미사용 + `className` 미사용 + `rowSelection` 미사용 + `enablePagination` 미사용** (실측 Grep — FundStatus L218-223 4 종 props 만 사용). | G-001/G-002/G-003 의 매핑 표준 그대로 따름. 단일 사이트 + 단순 4 종 props 패턴. G-004 그룹 A 3 페이지 (`FinancialCarryover / SettlementSummary / MonthlySettlement`) 와 동일 구조. | `bundleImpact.expected = "0 KB"` 유지. |
| D4 | 컬럼 정의는 **현 module-level `const COLUMNS: ColumnDef<...>[]` 유지** (createColumns 변환은 본 Goal 범위 외). `ColumnDef` import 는 `'../../../types/tomis/grid'` re-export 유지 (변경 X). | 본 Goal scope = "variant import → `<Grid>` 교체". `createColumns` 변환 + Pattern B 추상화는 별도 후속 Goal. C-19 점진. G-001~G-004 동일 결정. | `implementFiles[1]` 그대로. |
| D5 | `affectedUsageFiles` 배열 = 5 entries 보존 (audit trail). `implementFiles[]` = **1 파일 (FundStatusPage)** (C-19 ≤5 준수). 사이트 분포: FundStatus 1 사이트 = 1 (D1 reduction 후). NEW 0 + MODIFY 1 = 1 파일. | 본 Goal 은 사용처 마이그레이션 전용 — 새 NEW 파일 0건, MODIFY 1건. D1 (Pattern B 4 deferred) 반영. | `affectedUsageFiles[5]` 배열 보존 + `scopeNote` 필드 갱신 의무 (audit trail). |
| D6 | Section 9 의존성 = "변경 없음". `@tomis/grid-core` workspace alias 는 `vite.config.ts` L18 + `tsconfig.app.json` L23 에서 이미 wiring 완료 (G-001~G-004 동일). | 신규 dep 추가 0건. C-22 peerDeps 영향 0. ADR-MOD-GRID-17-002 의무 (B-04 sub-rule) 충족. | `bundleImpact.package = "tw-framework-front"` 일치. |
| D7 | Section 2 의 `<Grid>` props interface 인용 = `grid-core/src/types.ts` `GridProps<TData>` (G-001~G-004 spec L2-3 동일). 본 Goal 사용처는 `data` / `columns` / `enableSort` / `enableFilter` / `loading` / `emptyText` 6 개 props 부분집합 사용 (FundStatus L218 의 4 종 props + 신규 추가 2 종 `enableSort` + `enableFilter`). | C-1 Read-then-Write 준수 + spec authoritative. G-004 그룹 A 패턴 cascading. | N/A |
| D8 | 페이지별 마이그레이션 액션 = `direct 교체` (FundStatus 1 파일 1 사이트). 페이지 단위 PR 분리는 AC-005 (D-02) — 단일 commit 으로 충분. 본 spec 의 implement Stage 는 1 파일 변경 + verifier 가 외관/tsc 통합 검증. | 호환성 정책 D-02 (페이지 단위 PR). | N/A |
| D9 | 워크트리 경계 우회 — Implementer Agent 는 C-34 + ADR-MOD-GRID-17-001 의 PowerShell-via-Bash 우회 표준 절차 따른다. 출력 파일 (`.tsx`) UTF-8 BOM **미포함** 의무 (한글 emptyText `"등록된 자료가 없습니다."` 깨짐 방지). | FundStatus 파일은 base repo (`tw-framework-front/`) 위치 → 워크트리 Edit/Write 도구가 boundary 차단. ADR-MOD-GRID-17-001 + C-34 cascading 적용. | N/A |
| D10 | 한국어 리터럴 매칭 시 `.ps1` 스크립트 파일 BOM (`0xEF 0xBB 0xBF`) **prepend 의무** (C-35 + ADR-MOD-GRID-17-004 cascade). 1 사이트 한국어 emptyText 1 종 ("등록된 자료가 없습니다.") — 단순 케이스. 단순 inline `powershell -Command` 우회 사용 시 BOM 무관 (D10 대안 (a) — Bash UTF-8 stdin 직접 전달). 다파일 변환 아닌 1 파일 1 사이트이므로 inline 명령 충분 권장. | C-35 + ADR-MOD-GRID-17-004 (G-002 self-review 작성). 출력 파일 BOM 금지(D9)와 정반대 방향 — 양방향 매트릭스 명시. | N/A |
| D11 | **★ Pattern B 4 페이지 deferral path 명시** (D1 cascading): 본 Goal 의 1 파일 변환 완료 후, **별도 후속 Goal (G-005b 권장 — 또는 MOD-GRID-18 신규 모듈)** 에서 다음 Pattern B 4 페이지를 변환한다. 변환 path: `useReactTable + manual <table>` → `<Grid>`. 위험 영역: (1) 페이지별 Tailwind class 변형 외관 픽셀 회귀 (Grid.tsx L268/L350/L389/L451 vs 페이지 변형), (2) 인라인 편집 cell render closure (AnnualLeaveStatus L259/L285/L315/L371 — `editedRows`/`handleCellChange`/`handleSave`/`savingEmplNo` capture — `<Grid>` 의 `flexRender + cell.getContext()` 가 closure 보존하므로 기능적으로 가능, 외관 회귀만 별도 검증), (3) DailyAttendance 행 클릭 → 편집 모달 (`onRowClick` 매핑 가능), (4) InsEmpl22 행 선택 (`selectedKey` state — `<Grid rowSelection>` 통합 또는 외부 state 유지 선택 결정 필요), (5) 페이지네이션 (InsEmpl22 외부 컨트롤 — `<Grid enablePagination>` 으로 통합 또는 외부 유지). | ADR-005 § Cascading 효과 예측 cross-reference. discover 자동화 정확도 한계 — Pattern B 페이지가 BaseGrid wrapper Goal 에 잘못 포함된 케이스의 첫 발견. cascading 효과로 G-006 (payroll/admin) 도 동일 reality-check 필요. | `affectedUsageFiles[]` 5 entries 보존 (4 deferred entry audit trail). |

**Verifier 자가-검산 (G-01 + E-06 cross-check)**: 합계 11 D# 결정. NEW 0 + MODIFY 1 = 총 1 파일. Section 7 표 1 행 + Section 11.1 표 1 행. breakdown(NEW 0 / MODIFY 1 / 파일 이름 = FundStatusPage.tsx) 본문/AC/Section 7 모두 1:1 매칭. 1 BaseGrid 호출 사이트: FundStatus L218 = 1. Section 3 표 + Section 11.1 표에 1 사이트 enumerate. **D1 (Pattern B 4 deferred)** spec 본문 모든 섹션에 1:1 반영 — Section 1 L0 1 파일 발췌 (Pattern A — FundStatus) + L0-deferred 4 파일 발췌 (Pattern B), Section 3 표 1 행 (FundStatus), Section 7 표 1 행 (FundStatus), Section 11 1 파일.

---

## Section 1. 참조 추적 (Reference Tracking)

### L0 — tw-framework-front 현 구현 (실측 Read + Grep 결과)

영향 사용처 5개 페이지의 grid 사용 패턴 (모두 실측 Read + Grep 완료 — A-04 v1.0.9 reality-check 의무).

**L0-1 (in-scope — Pattern A — 본 Goal 변환 대상): `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/finance/FundStatusPage.tsx`** (230 줄)
- L11: `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` — **local default import (G-001~G-003 패턴, G-004 그룹 A 패턴)**
- L12: `import type { ColumnDef } from '../../../types/tomis/grid';`
- L218-223 (자금현황 그리드 — 1 사이트):
  ```tsx
  <BaseGrid<FinAcno01FundStatusItem>
    columns={columns}
    data={rows}
    loading={isLoading}
    emptyText="등록된 자료가 없습니다."
  />
  ```
- props 사용 (4 종): `columns`, `data`, `loading`, `emptyText` (`onRowClick` / `className` / `rowSelection` / `enablePagination` 모두 미사용)
- **Grep `<BaseGrid` 결과**: 1 hit (L218)
- **Grep `useReactTable` 결과**: 0 hits
- ★ 본 페이지 1 사이트 — G-004 그룹 A 3 페이지 (FinancialCarryover/SettlementSummary/MonthlySettlement) 와 구조 동일.

**L0-2 (deferred — D1 — Pattern B): `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/hr/InsEduc11HistoryPage.tsx`** (327 줄)
- L7-14: `import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, type ColumnDef, type SortingState } from '@tanstack/react-table';` — **직접 import (Pattern B)**
- L133-140: `const table = useReactTable({ data, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() });`
- L279-319: 인라인 `<table className="min-w-full text-sm">` + `<thead className="bg-gray-50 sticky top-0 z-10">` + `<th className="px-3 py-2 text-left text-xs font-medium text-gray-600 ... cursor-pointer">` + zebra row `${i % 2 === 0 ? '' : 'bg-gray-50/30'}` + `hover:bg-blue-50/40` + sort glyph `▲/▼` (no `⇅` neutral)
- **Grep `<BaseGrid` 결과**: 0 hits → BaseGrid 미사용
- **Grep `useReactTable` 결과**: 1 hit (L133 호출) + 1 hit (L8 import) = 2 hits
- **본 Goal 제외 (D1)**: Pattern B — `<Grid>` 와 markup/Tailwind 불일치 (`px-3 py-2 / px-3 py-1.5 / zebra bg-gray-50/30 / hover:bg-blue-50/40` vs `<Grid>` `px-4 py-3 / hover:bg-gray-50 / bg-blue-50 selection`).

**L0-3 (deferred — D1 — Pattern B): `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/hr/DailyAttendancePage.tsx`** (606 줄)
- L12-17: `import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';` — **직접 import (Pattern B)**
- L461-465: `const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });` (sort 미사용)
- L542-577: 인라인 `<table className="w-full text-sm border-collapse">` + `<thead className="bg-gray-50 border-b border-gray-200">` + `<tr className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer" onClick={() => handleRowClick(row.original)}>` + cell `px-3 py-2 text-xs text-gray-700 whitespace-nowrap border-r border-gray-100`
- L589-600: 행 클릭 → 편집 모달 (`<EditModal>` 컴포넌트) — 22 시수 필드 인라인 편집
- **Grep `<BaseGrid` 결과**: 0 hits → BaseGrid 미사용
- **Grep `useReactTable` 결과**: 1 hit (L461 호출) + 1 hit (L13 import) = 2 hits
- **본 Goal 제외 (D1)**: Pattern B — `<Grid>` 변환 시 행 클릭(`onRowClick` 매핑) + 외관 회귀 (border-collapse vs `<Grid>` divide-y) + 행 selection 미통합 — 별도 path 필요.

**L0-4 (deferred — D1 — Pattern B): `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/hr/InsEmpl22ContractListPage.tsx`** (433 줄)
- L8-13: `import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';` — **직접 import (Pattern B)**
- L148-152: `const table = useReactTable({ data: items, columns, getCoreRowModel: getCoreRowModel() });` (sort 미사용)
- L327-364: 인라인 `<table className="w-full text-sm border-collapse">` + `<thead className="bg-gray-100 text-gray-700 sticky top-0">` + `<tr onClick={() => setSelectedKey(rowKey)} className="... ${isSelected ? 'bg-blue-100' : ''}">` (선택 행 시각 표시 = `bg-blue-100`, `<Grid>` 기본 selection 색상 `bg-blue-50` 과 다름)
- L369-427: 외부 페이지네이션 UI (5 페이지 버튼 + 처음/이전/다음/끝)
- **Grep `<BaseGrid` 결과**: 0 hits → BaseGrid 미사용
- **Grep `useReactTable` 결과**: 1 hit (L148 호출) + 1 hit (L9 import) = 2 hits
- **본 Goal 제외 (D1)**: Pattern B — 행 selection 상태(`selectedKey: string | null`) + 외부 페이지네이션 UI — `<Grid rowSelection>` 통합 또는 외부 state 유지 결정 필요. 별도 path.

**L0-5 (deferred — D1 — Pattern B): `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/hr/AnnualLeaveStatusPage.tsx`** (621 줄)
- L13-20: `import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, type ColumnDef, type SortingState } from '@tanstack/react-table';` — **직접 import (Pattern B)**
- L386-393: `const table = useReactTable({ data: rows, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() });`
- L495-535: 인라인 `<table className="min-w-full text-sm">` + `<thead className="bg-gray-50 sticky top-0 z-10">` + `<th className="px-3 py-2 ... cursor-pointer">` + zebra `${i % 2 === 0 ? '' : 'bg-gray-50/30'}` + `hover:bg-blue-50/40` + sort glyph
- L195-384: 컬럼 정의 `useMemo` 내부 — `editedRows` / `handleCellChange` / `handleSave` / `savingEmplNo` capture closure (L259/L285/L315/L371 inline `<input>` 셀 인라인 편집)
- **Grep `<BaseGrid` 결과**: 0 hits → BaseGrid 미사용
- **Grep `useReactTable` 결과**: 1 hit (L386 호출) + 1 hit (L14 import) = 2 hits
- **본 Goal 제외 (D1)**: Pattern B — `<Grid>` 의 `flexRender + cell.getContext()` 가 closure 보존하므로 인라인 편집 **기능적으로 가능** (Grid.tsx L455 검증), 그러나 외관 회귀 (zebra `bg-gray-50/30` 미지원) + closure 변환 surgical 검증 필요. 별도 path.

**호출 사이트 합계 (in-scope)**: 1 (FundStatus L218)
**제외 (D1) 합계**: 4 페이지 (Pattern B — 별도 후속 Goal 책임)

### L1 — TanStack v8 API
- **N/A** (본 Goal 은 TanStack API 변경 없음 — grid-core wrapper 만 교체). FundStatus 사용처는 `import type { ColumnDef } from '../../../types/tomis/grid'` 유지 (D4).

### L2 — 공통 컴포넌트 (`@tomis/grid-core`)

L2-1: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` L2 export:
```ts
export { Grid } from './Grid';
```
+ legacy alias 5종 export 확인 (G-001~G-004 L2-1 동일).

L2-2: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/Grid.tsx` (G-001~G-004 spec L2-2 동일):
```tsx
export const Grid = forwardRef(GridInner) as <TData>(
  props: GridProps<TData> & { ref?: Ref<GridHandle<TData>> },
) => ReactElement;
```

**★ Grid.tsx markup 실측 (L254-464) — D1 의사결정 근거 (외관 회귀 위험)**:
- thead: `className="bg-gray-50 sticky top-0 z-10"` (L268)
- th: `className="relative px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap select-none ..."` (L318)
- tbody: `className="bg-white divide-y divide-gray-100"` (L228, no pinning)
- tr (default): `className="transition-colors ${isClickable ? 'cursor-pointer' : ''} ${row.getIsSelected() ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'} ..."` (L433-435)
- td: `className="px-4 py-3 whitespace-nowrap text-gray-700 ..."` (L451)
- sort glyph: `▲ / ▼ / ⇅` (L274) — Pattern B 페이지 4 곳 모두 `⇅` neutral glyph 미사용 (none of them) — **외관 회귀 1점** (Pattern B → `<Grid>` 시 정렬 안 된 컬럼에 `⇅` 표시됨)
- cell rendering: `flexRender(cell.column.columnDef.cell, cell.getContext())` (L455) — closure 보존 OK

L2-3: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` `GridProps<TData>` (G-001~G-004 spec L2-3 동일 — 11개 props 부분 인용):
```ts
export interface GridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  enableSort?: boolean;
  enableFilter?: boolean;
  enablePagination?: boolean;
  rowSelection?: RowSelectionMode | GridRowSelectionOptions<TData>;
  pagination?: GridPaginationOptions;
  onRowClick?: (row: TData, event: MouseEvent<HTMLTableRowElement>) => void;
  className?: string;
  emptyText?: string;
  loading?: boolean;
  // ... (이하 optional props)
}
```

L2-4: 로컬 `BaseGrid` 컴포넌트 (`D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/BaseGrid.tsx`) — G-002/G-003/G-004 L2-4 검증 결과 재인용: 로컬 BaseGrid 가 내부에서 `useReactTable` + `getCoreRowModel` + `getSortedRowModel` + `getFilteredRowModel` + `getPaginationRowModel` 직접 호출. FundStatus 가 이 로컬 사본 사용 중. monorepo `<Grid>` 와 markup 동치 가설 (G-001~G-004 검증 19 페이지 평균).

### L3 — 영향 사용처 카운트 = **1 파일 (in-scope) + 4 파일 (deferred, audit trail)**

`canonical-modules.json` MOD-GRID-17 affectedUsageFiles 중 finance/FundStatus 1건 (in-scope) + hr/InsEduc11History + DailyAttendance + InsEmpl22ContractList + AnnualLeaveStatus 4건 (deferred — D1). 정확한 경로 5개 (Section 8.1 동일).

### R-A / R-W — N/A
- 본 Goal 은 신규 API 설계가 아닌 **사용처 마이그레이션** — AG Grid / Wijmo 동등 기능 참조 불필요.

---

## Section 2. API 계약 (TypeScript Interface)

본 Goal 은 신규 API 정의가 없음 — `@tomis/grid-core` 의 기존 `GridProps<TData>` 를 FundStatus 사용처에서 호출만 한다.

### 2.1 호출할 인터페이스 (`grid-core/src/types.ts` 실측 인용 — G-001~G-004 spec L2-3 동일)

본 Goal 의 FundStatus 1 파일에서 사용할 `GridProps<TData>` 의 6개 props 부분집합 (D7):

```ts
export interface GridProps<TData> {
  // ─── 필수 ───
  data: TData[];                                        // required
  columns: ColumnDef<TData, unknown>[];                 // required

  // ─── enable* 토글 (본 Goal: 1 사이트 활성) ───
  enableSort?: boolean;                                 // default false → 본 Goal: true
  enableFilter?: boolean;                               // default false → 본 Goal: true

  // ─── 표시 ───
  emptyText?: string;                                   // 1 사이트 명시 ("등록된 자료가 없습니다.")
  loading?: boolean;                                    // 1 사이트 명시 (isLoading)
  // (className/onRowClick/rowSelection/enablePagination: 본 Goal 미사용)
}
```

**미사용 props (본 Goal 의 1 파일):**
- `enablePagination`: 미사용 (FundStatus L218-223 pagination prop 사용 안 함 — 실측 Grep)
- `rowSelection`: 미사용 (실측 Grep)
- `onRowClick`: 미사용 (실측 Grep)
- `className`: 미사용 (실측 Grep — G-004 그룹 A 동일 패턴)
- `pagination`: 미사용
- 기타 30+ optional props: default 유지

**사이트별 props 사용 매트릭스 (1 사이트 × 6 props):**

| 사이트 | data | columns | loading | emptyText | onRowClick | className | enableSort | enableFilter |
|--------|------|---------|---------|-----------|------------|-----------|------------|--------------|
| FundStatus L218 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | → 추가 | → 추가 |

### 2.2 export 경로 (D7 + L2-1)

```ts
// 사용처 마이그레이션 최종 import 라인 (FundStatus 1 파일):
import { Grid } from '@tomis/grid-core';
import type { ColumnDef } from '../../../types/tomis/grid';
// (D4: ColumnDef import 경로는 변경하지 않음 — local re-export 유지)
```

### 2.3 사용 예시 코드 (최소 2개 — 본 Goal 의 실측 시나리오)

**예시 1 (FundStatus 변환 — 단순 4 props 패턴, 그룹 A — G-004 SettlementSummary 와 동일 구조):**
```tsx
import { Grid } from '@tomis/grid-core';
import type { ColumnDef } from '../../../types/tomis/grid';

<Grid<FinAcno01FundStatusItem>
  columns={columns}
  data={rows}
  enableSort
  enableFilter
  loading={isLoading}
  emptyText="등록된 자료가 없습니다."
/>
```

**예시 2 (G-001~G-004 cascading 일반 패턴 — props 부분집합 default 모드 — Section 13 cross-reference):**
```tsx
import { Grid } from '@tomis/grid-core';

<Grid<RowType>
  columns={columnsConst}
  data={rowsState}
  enableSort
  enableFilter
  loading={isLoadingState}
  emptyText="검색된 자료가 없습니다."
/>
```

### 2.4 기본값 / optional 명시
- `data`, `columns` = **required** (위 두 props 만 필수, 1 사이트 모두 명시됨)
- 그 외 4 종 props (`enableSort`, `enableFilter`, `loading`, `emptyText`) 는 모두 **optional** — 미사용 = TanStack 기본 동작
- `emptyText` default `'데이터가 없습니다.'` (Grid.tsx L55 `DEFAULT_EMPTY_TEXT`)
- `enableSort` default false → 본 Goal 1 사이트 `enableSort` boolean attribute 형태로 활성화 (이전 BaseGrid 가 내부적으로 항상 sort 활성)

### 2.5 ref API — N/A (B-05)
본 Goal 의 FundStatus 페이지 `gridRef` 또는 `useRef<GridHandle<T>>` 사용 없음 (Read 결과 confirmed — Grep `useRef` 0 hits). `GridHandle<TData>` 미사용. B-05 = N/A.

---

## Section 3. 기존 사용처 대응표 ⭐ (tw-grid 특화)

| 페이지 | 기존 import / 사용 패턴 (라인) | 신규 API 대응 | 마이그레이션 액션 | 패턴 |
|--------|------------------------------|-------------|------------------|------|
| **FundStatusPage.tsx** | L11 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` (default — local)<br>L218-223 `<BaseGrid<FinAcno01FundStatusItem> columns data loading emptyText />` | `import { Grid } from '@tomis/grid-core';`<br>L218 → `<Grid<FinAcno01FundStatusItem> columns data enableSort enableFilter loading emptyText />` | **direct 교체** (import 1 라인 + 1 JSX 사이트). **그룹 A (G-001~G-004 cascading 패턴)** | A |

**1/1 행 작성. C-19 ≤5 준수**. 1 BaseGrid 호출 사이트 enumerate (1 파일 합계). 외관 100% 보존 — 로컬 BaseGrid 내부 `useReactTable` + `getSortedRowModel` + `getFilteredRowModel` 동치 (G-002/G-003/G-004 L2-4 검증 재인용).

**★ Pattern B 4 페이지 행 미포함** (D1) — 4 페이지 모두 `useReactTable` 직접 사용 (Section 1 L0-2~L0-5 인용). 대응표에서 명시적으로 제외 + Section 7 표 1 행 + Section 11 1 파일. C-30 + E-06 prose ↔ structured form 일치 — D1 본문 결정과 Section 3 표 행수(1) 일치.

---

## Section 4. 호환성 정책

### 4.1 Breaking change
- **`breaking: false`** (goals.json 동일 패턴 G-001/G-002/G-003/G-004 따름)
- 로컬 `BaseGrid` 컴포넌트 (`src/components/tomis/Grid/BaseGrid.tsx`) 자체는 **본 Goal 에서 제거하지 않음**. 다른 페이지가 아직 사용 중일 가능성 — FundStatus 1 페이지에서만 import 제거.
- `@tomis/grid-core` 의 `Grid` export 는 안정 (MOD-GRID-01 G-001~G-005 완료).
- Pattern B 4 페이지는 **본 Goal 에서 변경 없음** (D1 deferred) — 후속 Goal 책임.

### 4.2 Deprecation 전략 (C-6 + C-23)
- 로컬 `BaseGrid` 는 **1 minor 버전 유지** (다른 페이지들이 점진 마이그레이션 후 제거 검토).
- 본 Goal 후속 효과: 1 페이지에서 import 제거 완료 → 누적 마이그레이션 완료 페이지: G-001 5 + G-002 5 + G-003 5 + G-004 4 + G-005 1 = **20 페이지** (BaseGrid wrapper 패턴).
- Pattern B 4 페이지 마이그레이션은 별도 Goal 누적 (G-005 deferred, G-005b/MOD-GRID-18 책임).
- G-006 까지 완료 + 잔여 BaseGrid 사용처 0건 확인 시 별도 cleanup Goal 에서 legacy 제거 검토 가능.

### 4.3 영향 사용처 마이그레이션 경로 (3 단계 — Section 11.3 와 동기)
1. **단계 1**: import 라인 교체 — FundStatus 1 파일:
   - 그룹 A (1 파일): `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` 제거, `import { Grid } from '@tomis/grid-core';` 추가
2. **단계 2**: JSX 호출 사이트 교체 — 1 파일 내 1 사이트 `<BaseGrid<T>` → `<Grid<T> enableSort enableFilter`.
3. **단계 3**: `npx tsc --noEmit` 0 errors 확인 → 외관 회귀 검증 (C-17).

### 4.4 console warning 정책 (AC-003 + C-23)
- 로컬 `BaseGrid` 는 `useDeprecationWarn` 호출 없음 (G-002/G-003/G-004 L2-4 검증). 본 Goal 완료 후에도 console warning 영향 없음.
- `Grid` 자체는 deprecation warning 미발생.

### 4.5 peerDependencies 정책 (C-22)
- `@tomis/grid-core` 가 `react`, `react-dom`, `@tanstack/react-table` 을 peer 로 선언 — 사용처 `tw-framework-front` 는 이미 이 셋을 deps 로 보유 (G-001~G-004 spec Section 4.5 검증 완료). 추가 작업 없음.

---

## Section 5. 인수 기준 (Acceptance Criteria with Source Tags)

5개 AC 모두 출처 태그 + binary 검증 가능. migrationImpact: **high** 표시.

| AC ID | 기준 | 출처 | binary 검증 방법 | migrationImpact |
|-------|------|------|------------------|-----------------|
| AC-001 | FundStatus 1 페이지 tsc 0 errors | **L0 + C-12** | `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx tsc --noEmit` 명령 실행 → exit 0 + stderr 빈 결과 | high |
| AC-002 | 외관 보존 — 동일 데이터 입력 시 마이그레이션 전후 시각 동일 (FundStatus 1 사이트) | **L0 + L2 + C-17** | (a) 로컬 BaseGrid 와 monorepo `<Grid>` 가 내부에서 `useReactTable + getSortedRowModel + getFilteredRowModel + getPaginationRowModel + flexRender` 호출 → markup 동일 / (b) FundStatus 페이지 동일 데이터 fixture 로 마이그레이션 전후 스크린샷 캡처 후 픽셀 비교 (cell padding `px-4 py-3` / row height / sort icon `⇅` 신규 표시 검토 / hover bg-gray-50 / thead bg-gray-50 / 한글 emptyText "등록된 자료가 없습니다.") | high |
| AC-003 | console warning 0 건 | **C-23** | FundStatus 페이지 dev mode 렌더 → `console.warn` 인터셉트 시 deprecated 경고 0건 | high |
| AC-004 | variant import 0 건 (Pattern A default import 검증) | **L0 + L2 + C-6** | `grep -nE "from ['\"](\\.\\./)+components/tomis/Grid/BaseGrid['\"]"  tw-framework-front/src/pages/tomis/finance/FundStatusPage.tsx` → 0 hits. 또한 `grep -n "<BaseGrid"` → 0 hits (FundStatus 1 파일). | high |
| AC-005 | 페이지 단위 PR 분리 (D-02) — FundStatus 1 페이지 1 commit | **C-19** | git log --oneline 또는 PR description 에 1 페이지 enumerate. 단일 commit 으로 1 파일 변경 허용. | high |

**AC source 태그 검증 (H-03 만족)**:
- L0 → Section 1 L0-1 에서 실제 인용됨 (FundStatus L218 라인 인용)
- L2 → Section 1 L2-1~L2-4 에서 실제 인용됨 (Grid.tsx markup 실측 인용)
- C-12 → constraints.md C-12 (`npx tsc --noEmit` 0 errors 의무)
- C-17 → constraints.md C-17 (시각 회귀 검증 의무 — high impact)
- C-23 → constraints.md C-23 (semver — deprecated API 1 minor 유지)
- C-6 → constraints.md C-6 (호환성 절대)
- C-19 → constraints.md C-19 (점진 ≤5/Goal)

---

## Section 6. 엣지 케이스 (3개 이상)

본 Goal 의 실측 페이지 분석 기반 엣지 케이스 (추측 금지 — 실제 Read 결과로 식별):

**EC-01: 한 파일 내 단일 `<BaseGrid>` 사이트 — 1 사이트 변환 (FundStatus 1 사이트)**
- 출처: L0-1 (FundStatus 1 사이트 L218, 단순 패턴).
- 위험: implementer 가 사이트 라인 미정확 매칭 → JSX 일부만 교체.
- 처리: Section 11.1 표에 1 사이트 라인 enumerate. PowerShell 우회 시 `[IO.File]::ReadAllText` 후 `Replace` 또는 정규식으로 `<BaseGrid<` 일괄 교체. AC-004 grep 으로 0 hits 검증.

**EC-02: ★ Pattern B 4 페이지 deferral — 본 Goal scope 외 (D1 cascade)**
- 출처: L0-2~L0-5 (4 페이지 모두 `<BaseGrid` 0 hits + `useReactTable` 직접 사용).
- 위험: implementer 가 goals.json 5 파일 가정 그대로 4 Pattern B 페이지도 변환 시도 → 다음 둘 중 하나 발생:
  - (a) `<BaseGrid<T>` 패턴 매칭 → 4 페이지 모두 0 hits (Replace 무동작, 변환 0 사이트) — 안전한 실패. 그러나 시간 낭비.
  - (b) implementer 가 useReactTable + 인라인 `<table>` 패턴 직접 변환 시도 → 페이지별 Tailwind class + cell render closure 보존 실패 → 외관 회귀 (AC-002 NO) + 인라인 편집 동작 불가 (AnnualLeaveStatus). loop 낭비.
- 처리: D1 결정 + Section 1 L0-2~L0-5 명시적 제외 + Section 3 표 1 행 (5 행 X) + Section 7 표 1 행. Implementer prompt 에 "spec 본문 = 권위 (C-27)" + "Pattern B 4 페이지 변환 시도 금지" 명시 의무. Pattern B 변환은 별도 후속 Goal 책임 (D11 deferred path).

**EC-03: `onRowClick` / `className` / `rowSelection` / `enablePagination` props 모두 미사용 — props 매핑 surgical 보존 (G-004 EC-03 cascade)**
- 출처: 1 사이트 props 사용 매트릭스 (Section 2.1 표) — FundStatus L218 의 4 종 props 만 사용 (`columns`/`data`/`loading`/`emptyText`).
- 위험: implementer 가 일괄 `onRowClick={handle...}` 또는 `className="w-full"` 추가 → 미정의 식별자 사용으로 tsc 실패 또는 외관 회귀 (width 변동).
- 처리: Section 3 표 + Section 11.1 표에서 1 사이트의 props 명시 — 4 종 props 만 보존 + `enableSort enableFilter` 만 추가. PowerShell 우회 시 정확한 replace string 사용.

**EC-04: ColumnDef import 경로 — FundStatus 가 `../../../types/tomis/grid` re-export 사용 (G-001~G-004 EC-04 cascade)**
- 출처: L0-1 L12 `import type { ColumnDef } from '../../../types/tomis/grid';`
- 위험: D4 결정으로 사용처에서 `ColumnDef` import 를 `@tanstack/react-table` 로 바꾸려 할 때 — drift 발생 가능.
- 처리: D4 결정 = "본 Goal 범위 외 — 현 import 경로 유지". `<BaseGrid>` → `<Grid>` 만 surgical 교체. `ColumnDef` import 는 변경하지 않는다.

**EC-05: 워크트리 경계 — FundStatus 1 파일 base repo 위치 → PowerShell-via-Bash 우회 필수 (C-34 + ADR-MOD-GRID-17-001)**
- 출처: FundStatus 1 파일 `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/finance/` (base repo) — 워크트리 외부.
- 위험: 1차 Implementer (G-001 사례) 가 Edit/Write 도구 boundary 차단 발견 후 즉시 "진행 불가" escalate → 1 round-trip 낭비.
- 처리: D9 결정 + C-34 + ADR-MOD-GRID-17-001 의 PowerShell-via-Bash 우회 표준 절차 따른다. `[IO.File]::ReadAllText` + `Replace` + `[IO.File]::WriteAllBytes` + `UTF8Encoding($false)` (BOM 미포함). 한글 emptyText `"등록된 자료가 없습니다."` 깨짐 검증 의무.

**EC-06: 빈 데이터 / 로딩 상태 — `loading` + `emptyText` 시각 회귀**
- 출처: 1 사이트 `loading={isLoading}` + `emptyText="등록된 자료가 없습니다."` props 사용.
- 위험: 로컬 BaseGrid 의 loading skeleton 스타일과 monorepo Grid 의 SkeletonRows (Grid.tsx L354 `<SkeletonRows count={... pageSize ?? 5} table={table} />`) 외관 회귀 가능 (skeleton row 색상, count 차이).
- 처리: AC-002 시각 회귀 검증 — FundStatus 페이지 빈 데이터 상태(`isLoading=true` + `data=[]`)에서 스크린샷 비교. 차이 발견 시 spec re-spec 또는 별도 Goal 분리.

**EC-07: 한국어 emptyText 매칭 — `.ps1` 스크립트 BOM 의무 또는 inline 우회 (C-35 + ADR-MOD-GRID-17-004 cascade)**
- 출처: 1 사이트 emptyText 한국어 리터럴 1 종 ("등록된 자료가 없습니다." — FundStatus L222).
- 단순 케이스 — D10 결정 대안 (a) **inline `powershell -Command` 우회 사용 권장** (Bash 가 UTF-8 stdin 으로 직접 PowerShell 에 전달 → BOM 무관). 다파일 변환 아닌 1 파일 1 사이트.
- 위험: G-002 1차 시도 `MISS` 패턴 — `.ps1` 스크립트가 BOM 없이 CP949 디코드 → UTF-8 인코딩된 `.tsx` 와 바이트 불일치 → 매칭 실패. 그러나 본 Goal 은 1 한국어 패턴 + inline 우회 사용 시 영향 없음.
- 처리: D10 결정 + C-35 + ADR-MOD-GRID-17-004 — `.ps1` 스크립트 파일 사용 시 BOM (`0xEF 0xBB 0xBF`) prepend 의무. **출력 파일 (`.tsx`) BOM 금지** (C-34 + D9). 두 방향 양립 명시 (스크립트 = BOM 필요, 출력 = BOM 금지). 본 Goal 권장 = inline `-Command` 우회 (BOM 무관).

**EC-08: ★ Pattern B 4 페이지 의 markup 비호환 (D1 핵심 근거)**
- 출처: Grid.tsx 실측 (Section 1 L2-2) vs Pattern B 4 페이지 실측 (Section 1 L0-2~L0-5).
- Pattern B 페이지의 cell padding (`px-3 py-2`, `px-3 py-1.5`, `px-2 py-1.5` 변형) vs `<Grid>` `px-4 py-3` — 픽셀 차이.
- Pattern B 의 zebra row (`${i % 2 === 0 ? '' : 'bg-gray-50/30'}` — InsEduc + AnnualLeaveStatus) vs `<Grid>` zebra 미지원 — 외관 회귀.
- Pattern B 의 selected row (`bg-blue-100` — InsEmpl22) vs `<Grid>` `bg-blue-50 hover:bg-blue-100` selection — 색상 차이.
- Pattern B 의 `cursor-pointer hover:bg-blue-50` row (DailyAttendance) vs `<Grid>` `${isClickable ? 'cursor-pointer' : ''} hover:bg-gray-50` — hover bg 다름.
- 위험: Pattern B 4 페이지를 본 Goal 에서 변환 시 → AC-002 (high impact 외관 보존) 미충족.
- 처리: D1 결정으로 Pattern B 4 페이지 deferred. 본 Goal scope = FundStatus (Pattern A) 1 파일.

---

## Section 7. 구현 대상 파일 (NEW / MODIFY) — 최종 implementFiles 표

**NEW: 없음.**
**MODIFY: 1 파일 (사용처 페이지 — base repo).** ★ **5 파일 아님 — D1 으로 Pattern B 4 페이지 deferred**.

| # | 파일 (절대 경로) | 액션 | 변경 라인 (실측 기반) | 변경 내용 | 그룹 |
|---|-----------------|------|----------------------|----------|------|
| 1 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/finance/FundStatusPage.tsx` | MODIFY | L11 (import) + L218 (JSX 1 사이트) | local `BaseGrid` default import 제거 + `Grid` import 추가; `<BaseGrid<FinAcno01FundStatusItem>` → `<Grid<FinAcno01FundStatusItem> enableSort enableFilter` (columns/data/loading/emptyText 4 종 props 모두 유지, onRowClick/className/rowSelection/enablePagination 미사용) | A |

**★ Pattern B 4 페이지 행 미포함** (D1). Goal prompt 5 파일 가정 → 1 파일 정정. 추가 행 없음. Section 11.1 1 행과 1:1 일치.

**합계: NEW 0 + MODIFY 1 = 1 파일** (D5 breakdown 일치).
**JSX 호출 사이트 합계: 1 (FundStatus L218)**.
**변경 hunk 합계: import 1 + JSX 1 = 2 변경 라인 (대략 — JSX 라인은 multi-line 호출이므로 hunk 단위는 약 3~5 라인).**

**H-02 경로 합리성 검증**: FundStatus 파일의 부모 디렉토리 (`.../tw-framework-front/src/pages/tomis/finance/`) 실재 — 실제 Read 도구로 1 파일 라인 카운트 + 발췌 성공함 (FundStatus 230줄). 프로젝트 컨벤션(`tw-framework-front/src/pages/tomis/{도메인}/{모듈}Page.tsx`) 일치 (CLAUDE.md "프론트엔드 디렉토리 원칙").

---

## Section 8. 마이그레이션 영향도 Preflight ⭐

### 8.1 영향 사용처 카운트: **1/1** (in-scope, 1 Goal ≤ 5 — C-19 준수) + 4 deferred (D1 audit trail)

**In-scope 1 파일 전체 경로**:
1. `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/finance/FundStatusPage.tsx` (그룹 A — Pattern A)

**Deferred 4 파일 (D1 — Pattern B — 후속 Goal 책임 — audit trail 보존)**:
- ~~`D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/hr/InsEduc11HistoryPage.tsx`~~ — Pattern B (useReactTable 직접)
- ~~`D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/hr/DailyAttendancePage.tsx`~~ — Pattern B (useReactTable + 인라인 편집 모달)
- ~~`D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/hr/InsEmpl22ContractListPage.tsx`~~ — Pattern B (useReactTable + 페이지네이션 + 행 선택)
- ~~`D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/hr/AnnualLeaveStatusPage.tsx`~~ — Pattern B (useReactTable + 인라인 편집 cell closure)

Goal prompt 5 파일 가정 → 실측 1 파일 (Pattern A) + 4 파일 deferred (Pattern B). discover 단계에서 goals.json `affectedUsageFiles` 배열 보존 + `scopeNote` 필드 추가 (audit trail).

### 8.2 무파괴 검증 방법
- **빌드 검증 (자동)**: `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx tsc --noEmit` → exit 0
- **추가 검증 (자동)**: `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx vite build` → 빌드 성공
- **외관 보존 (수동 — Chromatic 미도입 환경)**: FundStatus 페이지 dev server (`npm run dev`) 에서 동일 데이터 fixture 로 마이그레이션 전/후 스크린샷 캡처 후 픽셀 비교. 확인 대상: cell padding(`px-4 py-3`), row height, sort glyph(▲/▼/⇅) — **⇅ neutral glyph 신규 표시 검토 의무** (BaseGrid 가 `⇅` 미표시 시), thead bg-gray-50, hover bg-gray-50, sticky thead 동작, loading skeleton, emptyText `"등록된 자료가 없습니다."`.
- **외관 동등성 근거 (이론적)**: 로컬 BaseGrid + monorepo Grid 가 모두 내부에서 `useReactTable + getCoreRowModel + getSortedRowModel + getFilteredRowModel + getPaginationRowModel + flexRender` 호출 → TanStack 표준 API 출력 동치 (G-001~G-004 검증 19 페이지 재인용).

### 8.3 점진 마이그레이션 vs 일괄 전환
- 본 Goal = **1 페이지 전환** (C-19 ≤5 충족, 트리비얼). Pattern B 4 페이지 (hr/Ins\*) 는 별도 후속 Goal (G-005b 또는 MOD-GRID-18) 책임. G-006 (`payroll/admin`) 는 별도 Goal — payroll/PayrollEditable 은 EditableGrid Pro variant 변환 path.

### 8.4 롤백 전략
- 로컬 `BaseGrid` 컴포넌트 자체가 보존됨 (`src/components/tomis/Grid/BaseGrid.tsx` 삭제 X) — FundStatus 1 페이지에서 즉시 되돌릴 수 있음.
- **롤백 방법 1**: `git revert <commit-sha>` — 단일 commit 변경이므로 surgical 롤백 가능.
- **롤백 방법 2 (BaseGrid 재도입)**: FundStatus 페이지에서 import 라인 복원 + JSX `<Grid enableSort enableFilter ...>` → `<BaseGrid ...>` 로 surgical 되돌리기 (default import 형태).

### 8.5 번들 크기 영향
- **0 KB** (C-21 충족). 사용처 마이그레이션 — 새 의존성 추가 0. `@tomis/grid-core` 는 이미 (G-001~G-004 로) tw-framework-front 의 19 페이지에서 import 됨 → 본 Goal 추가 1 페이지는 트리쉐이킹 영향 없음.
- 로컬 `BaseGrid.tsx` 자체는 본 Goal 에서 삭제하지 않음 → 번들 변동 0.

### 8.6 alias 해결 경로 (B-04 의무 — 사용처 마이그레이션 Goal)

`@tomis/grid-core` import 의 해결 경로 (실측 Grep 결과 — Read 도구 사용, G-001~G-004 동일):

1. **vite.config.ts alias** (`D:/project/topvel_project/TOMIS/tw-framework-front/vite.config.ts` L18):
   ```ts
   '@tomis/grid-core': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-core/src'),
   ```
2. **tsconfig.app.json paths** (`D:/project/topvel_project/TOMIS/tw-framework-front/tsconfig.app.json` L23):
   ```json
   "@tomis/grid-core": ["../../topvel-grid-monorepo/packages/grid-core/src"],
   ```
3. **alias source target**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` L2 의 `export { Grid } from './Grid';`

**검증 방법**: `npx tsc --noEmit` 통과 시 tsconfig paths 정상 resolution 입증. `vite build` 통과 시 vite alias 정상 resolution 입증. ADR-MOD-GRID-17-002 의무 충족 (B-04 sub-rule).

### 8.7 base repo 여부 (A-04 의무) + 워크트리 경계 우회 + 스크립트 BOM 매트릭스

- **FundStatus 1 파일 `tw-framework-front/` (base repo, gitignored)** — 워크트리(`D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/`) 외부.
- 워크트리 Edit/Write 도구가 base repo 변경에 대해 boundary 차단 가능 (`"This background session hasn't isolated its changes yet"`).
- **C-34 + ADR-MOD-GRID-17-001 PowerShell-via-Bash 우회 적용 의무** — D9 결정 + EC-05 처리 참조.
- **C-35 + ADR-MOD-GRID-17-004 `.ps1` 스크립트 BOM 적용 의무** — D10 결정 + EC-07 처리 참조. 본 Goal 단순 케이스 → inline `-Command` 우회 권장 (BOM 무관).
- artifacts metadata (워크트리 내부 `.claude/tw-grid/artifacts/MOD-GRID-17/migration/G-005-*`) 은 정상 Edit/Write 도구 사용.

**BOM 방향 매트릭스 (양방향 명시 — C-35 cascade)**:

| 파일 종류 | BOM 방향 | 근거 |
|----------|---------|------|
| `.ps1` 스크립트 자체 | **BOM 필요** (`0xEF 0xBB 0xBF` prepend) | PowerShell 5.x 파서 인코딩 인식 (C-35) |
| inline `powershell -Command` | **BOM 무관** (Bash UTF-8 stdin 직접 전달) | D10 대안 (a) — 본 Goal 단순 케이스 권장 |
| 출력 `.tsx` 파일 | **BOM 금지** (`UTF8Encoding($false)`) | C-34 + MEMORY.md #32 한글 깨짐 차단 + 빌드 도구 호환 |

스크립트 BOM 누락 시 → G-002 1차 `MISS` 패턴 재발 (CP949 디코드 vs UTF-8 바이트 불일치). 출력 BOM 포함 시 → 빌드 도구 syntax error 또는 한글 깨짐.

### 8.8 ★ 패턴 분류 (A-04 v1.0.9 reality-check 결과)

`affectedUsageFiles[5]` 의 각 entry 패턴 분류 (Section 1 L0 실측 Grep 결과 기반):

| Entry | 파일 | Grep `<BaseGrid` | Grep `useReactTable` | 패턴 | 본 Goal scope |
|-------|------|-----------------|---------------------|------|--------------|
| 1 | InsEduc11HistoryPage | 0 hits | 2 hits (import + 호출) | **B** (useReactTable 직접 + 인라인 `<table>`) | ★ Deferred (D1) |
| 2 | DailyAttendancePage | 0 hits | 2 hits | **B** (+ 인라인 편집 모달 + 행 클릭) | ★ Deferred (D1) |
| 3 | InsEmpl22ContractListPage | 0 hits | 2 hits | **B** (+ 페이지네이션 + 행 선택) | ★ Deferred (D1) |
| 4 | AnnualLeaveStatusPage | 0 hits | 2 hits | **B** (+ 인라인 편집 cell closure) | ★ Deferred (D1) |
| 5 | **FundStatusPage** | **1 hit (L218)** | 0 hits | **A** (BaseGrid wrapper — G-001~G-004 cascading 패턴) | **In-scope** |

**Reality-check 의무 결과**: 1 in-scope (Pattern A) + 4 deferred (Pattern B). `affectedUsageFiles[]` 배열 5 entries 보존 (audit trail) + `scopeNote` 필드 갱신 의무. ADR-005 § Implementation Notes 5 단계 절차 모두 완수.

---

## Section 9. 의존성 (peerDeps / deps / devDeps)

- **신규 추가 의존성: 없음.**
- `@tomis/grid-core` workspace alias 는 다음 위치에 이미 wiring 완료 (8.6 인용):
  - `vite.config.ts` L18
  - `tsconfig.app.json` L23
- `react`, `react-dom`, `@tanstack/react-table` peer dependencies 는 `tw-framework-front` 의 package.json 에서 이미 보유 (G-001~G-004 spec Section 9 검증 완료).
- `@tomis/grid-core` 의 package.json `main`/`exports` 는 monorepo MOD-GRID-00 G-001 에서 wiring 완료 (`packages/grid-core/src/index.ts` export L2 `Grid` 검증됨).

---

## Section 10. 사용자 여정 매핑

### 10.1 개발자 관점 (5 단계)
1. **식별**: FundStatus 1 페이지의 grid 사용 라인 확인 (실제 Section 1 L0-1 + 1 사이트 라인 명시 완료). **Pattern B 4 페이지 (InsEduc/DailyAttendance/InsEmpl22/AnnualLeaveStatus) 는 변환 대상 아님 확인 후 제외 (L0-2~L0-5)**.
2. **import 라인 교체**: FundStatus 1 파일:
   - 그룹 A (1 파일): local `BaseGrid` default import 제거, `import { Grid } from '@tomis/grid-core';` 추가
3. **JSX 호출 교체**: 1 사이트 `<BaseGrid<T>` → `<Grid<T> enableSort enableFilter`. PowerShell 우회로 처리 (inline `-Command` 권장 — 단순 케이스).
4. **tsc 통과 확인**: `cd tw-framework-front && npx tsc --noEmit` → 0 errors.
5. **외관 보존 확인**: dev server 렌더 + FundStatus 페이지 스크린샷 비교. sort glyph `⇅` neutral 신규 표시 검토. emptyText 한글 깨짐 검증.

### 10.2 최종 사용자 관점 (외관 동등)
- **rows/columns 표시**: 100% 동일 (BaseGrid + monorepo Grid 모두 TanStack v8 표준 API 사용 — DOM 출력 동치).
- **인터랙션**: 소트(enableSort — 1 사이트 활성) 동일. 필터(enableFilter — 1 사이트 활성) 동일. **★ sort glyph `⇅` neutral 신규 표시 (이전 BaseGrid 가 미표시 시)** — 외관 회귀 1점 가능.
- **빈 상태**: `emptyText="등록된 자료가 없습니다."` 그대로 (BOM 매트릭스로 깨짐 차단).
- **로딩 skeleton**: `loading={true}` 시 `<Grid>` SkeletonRows 표시 (count = `pageSize ?? 5`) — 로컬 BaseGrid 와 동일 가설 (G-001~G-004 검증).
- **응답 시간**: 동일 컴포넌트 호출이므로 ±0%.

---

## Section 11. 구현 계획

### 11.1 파일별 변경 명세 (Section 7 표을 11 단계 sampling 한 결과 — E-01 cross-check)

| 파일 | 액션 | Step 1 (import) | Step 2 (JSX 사이트) | 영향 받는 컬럼/props | 그룹 |
|------|------|-----------------|----------------------|----------------------|------|
| FundStatusPage.tsx | MODIFY | L11 변경 (default import → 신규 import) | L218 (1 사이트) | columns, data, loading, emptyText (onRowClick/className/rowSelection/enablePagination 미사용) | A |

**E-01 Section 7 ↔ Section 11 일관성**: 1/1 행 1:1 매칭. NEW/MODIFY 분류 1 MODIFY 일치. 1 JSX 사이트 enumerate. 파일 이름 일치. 그룹 분류(A) 일치.

**E-06 Prose ↔ Structured Form 일관성 (D1 cascade)**: D1 본문 "Pattern B 4 페이지 본 Goal 범위 제외 — 후속 Goal 책임" → Section 1 L0-2~L0-5 명시적 제외 + Section 3 표 1 행 (5 행 X) + Section 7 표 1 행 + 본 Section 11.1 표 1 행 + Section 12 검증 1 파일. **prose↔structured 1:1 일치** — Pattern B 4 페이지 어디에도 변환 대상 행 미포함.

### 11.2 Before/After 코드 스니펫 (E-02 — 최소 1개)

**FundStatusPage.tsx (그룹 A — 본 Goal 유일한 in-scope 파일, G-004 SettlementSummary 와 동일 구조):**

**Before** (L11, L218-223):
```tsx
// L11
import BaseGrid from '../../../components/tomis/Grid/BaseGrid';

// L218
<BaseGrid<FinAcno01FundStatusItem>
  columns={columns}
  data={rows}
  loading={isLoading}
  emptyText="등록된 자료가 없습니다."
/>
```

**After**:
```tsx
// L11 (변경 후)
import { Grid } from '@tomis/grid-core';

// L218 (변경 후)
<Grid<FinAcno01FundStatusItem>
  columns={columns}
  data={rows}
  enableSort
  enableFilter
  loading={isLoading}
  emptyText="등록된 자료가 없습니다."
/>
```

### 11.3 구현 순서 (최소 2 단계 — E-03)

1. **Step 1 — FundStatusPage 단일 페이지 변환**:
   - L11 import 1줄 + L218 JSX 1군데 변경 (PowerShell-via-Bash 우회 — D9 + C-34 — inline `-Command` 권장).
   - `npx tsc --noEmit` (cwd = `tw-framework-front`) → 0 errors 확인.
   - dev server 띄워 FundStatus 페이지 외관 확인 (sort/filter/loading/empty).
   - tsc 또는 외관 실패 시 다음 단계 진행 금지 — 원인 분석 후 spec 재검토.

2. **Step 2 — 전체 검증 및 commit**:
   - AC-004 grep 검증 (Pattern A default import 검증 — `from '../../../components/tomis/Grid/BaseGrid'` 또는 `<BaseGrid` → FundStatus 1 파일에서 0 hits).
   - AC-001 tsc 0 errors (`npx tsc --noEmit`).
   - AC-003 dev server console.warn 0 건.
   - **AC-002 시각 회귀 — 1 사이트 확인 의무**:
     - FundStatus 자금현황 그리드 외관 (데이터 채워진 상태 + 빈 상태 + 로딩 상태)
     - sort glyph `⇅` neutral 신규 표시 검토 — 회귀 발견 시 spec re-spec 또는 별도 Goal 분리.
   - 단일 commit (AC-005) 으로 PR.

### 11.4 위험 요소

| 위험 | 영향 페이지 | 완화책 |
|------|------------|--------|
| 단일 BaseGrid 사이트 매칭 — 일부만 교체 시 tsc 실패 또는 AC-004 NO | FundStatus(1) | EC-01 — PowerShell 정규식으로 `<BaseGrid<` 단일 매칭. AC-004 grep 으로 0 hits 검증. |
| **★ Goal prompt 5 파일 가정 vs 실측 1 파일 (Pattern B 4 deferred) — 잘못된 파일 변환 시도 위험** | InsEduc11History, DailyAttendance, InsEmpl22ContractList, AnnualLeaveStatus | EC-02 + D1 — D1 결정 spec 본문 + Section 1 L0-2~L0-5 명시적 제외 + Section 7 표 1 행 + Section 11.1 표 1 행. Implementer prompt 에 "spec 본문 = 권위 (C-27)" + "Pattern B 4 페이지 변환 시도 금지 (deferred to G-005b/MOD-GRID-18)" 명시 의무. |
| 워크트리 Edit/Write 도구 boundary 차단 → 즉시 escalate 시 1 round-trip 낭비 | FundStatus | EC-05 + D9 + C-34 + ADR-MOD-GRID-17-001 — PowerShell-via-Bash 우회 표준 절차. `[IO.File]::WriteAllBytes` + `UTF8Encoding($false)` (BOM 미포함). |
| UTF-8 BOM 누락 (출력 파일) → 한글 emptyText `"등록된 자료가 없습니다."` 깨짐 | FundStatus | MEMORY.md #32 + ADR-MOD-GRID-17-001 — `(New-Object System.Text.UTF8Encoding $false).GetBytes($content)`. 변경 후 한글 string grep hit 카운트 변경 전후 동일 확인. |
| `.ps1` 스크립트 BOM 누락 → 한국어 패턴 매칭 `MISS` (G-002 1차 사례) — 단, 본 Goal 1 한국어 패턴 + inline `-Command` 우회 권장 시 영향 없음 | FundStatus | EC-07 + D10 + C-35 + ADR-MOD-GRID-17-004 — 본 Goal 권장 = inline `-Command` 우회 (BOM 무관). `.ps1` 파일 사용 시 BOM (`0xEF 0xBB 0xBF`) prepend 의무. |
| `ColumnDef` 타입 호환 — 사용처가 `../../../types/tomis/grid` re-export 사용 | FundStatus | EC-04 + D4 — `ColumnDef` import 는 변경하지 않음. local re-export 가 `@tanstack/react-table` 의 `ColumnDef<TData>` 와 동일 type alias 이므로 tsc 통과 예상. |
| sort glyph `⇅` neutral 신규 표시 — BaseGrid 가 미표시 시 외관 회귀 1점 | FundStatus | AC-002 시각 회귀 검증 의무 — 회귀 발견 시 사용자 결정 (수용 또는 spec 별도 Goal). G-001~G-004 19 페이지 cascading 결과 wider 영향 — 본 Goal 만의 위험 아님. |
| 외관 회귀 (cell padding / row height / hover bg / sticky thead) | FundStatus | AC-002 시각 회귀 검증 — 1 사이트 dev server 렌더 후 픽셀 비교. 로컬 BaseGrid + monorepo Grid 가 동일 TanStack API 사용 → 이론적으로 0% 회귀. |
| **★ Pattern B 4 페이지 외관/기능 회귀 위험 (deferred path 의 근거)** | InsEduc11History, DailyAttendance, InsEmpl22ContractList, AnnualLeaveStatus | EC-08 + D1 + D11 — 페이지별 Tailwind class 변형 (px-3 py-2 / px-3 py-1.5 / bg-gray-50/30 zebra / hover:bg-blue-50/40 / bg-blue-100 selection) 외관 비호환 + 인라인 편집 cell closure 보존 + 행 selection / 페이지네이션 통합 결정 필요 → 본 Goal 범위 외, 후속 Goal 책임. |

---

## Section 12. 검증 계획

### 12.1 단위 테스트 (E-05)
- **본 Goal 자체 단위 테스트 없음** — 사용처 마이그레이션이므로 grid-core 의 단위 테스트가 이미 MOD-GRID-01 G-001~G-005 에서 커버됨.
- 사용처에 추가 단위 테스트 필요시 후속 Goal 에서 추가 (본 Goal 범위 외).

### 12.2 시각 회귀 검증 (C-13 + C-17 의무 — migrationImpact: high)
- **방법 1 (자동)**: tw-framework-front 의 Storybook 미설정 환경 — Storybook story 신규 작성은 본 Goal 범위 외 (FundStatus 가 자금 API fetching 페이지여서 isolation 가능한 story 작성 부담 큼).
- **방법 2 (수동)**: FundStatus 페이지 dev server (`npm run dev`) 에서 마이그레이션 전후 동일 데이터로 스크린샷 캡처 후 외관 비교. 확인 대상:
  - cell padding (`px-4 py-3`)
  - row height
  - sort glyph (▲▼⇅) 위치 + 색상 — **⇅ neutral glyph 신규 표시 회귀 검토 의무**
  - hover bg-gray-50
  - thead bg-gray-50 sticky top-0
  - empty state 메시지 텍스트 (한글 깨짐 검증 — 1 종 emptyText `"등록된 자료가 없습니다."`)
  - loading skeleton row 색상 + count (`pageSize ?? 5` default)
  - 자금현황 데이터 표시 (은행 / 계좌번호 / 계좌명 / 계정과목 / 관리용도 / 전월잔액 / 당월수입 / 당월지출 / 현재잔액 / 만기일 — 천단위 콤마 + font-mono 표시 보존)

### 12.3 빌드 검증 (C-12 의무)
- `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx tsc --noEmit` → exit 0, 0 errors.
- `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx vite build` → 빌드 성공 (lazy + 트리쉐이킹 동작 확인).

### 12.4 마이그레이션 자동 보완 (codemod)
- MOD-GRID-99-B docs Goal 에서 codemod 작성 예정. 본 Goal 은 수동/PowerShell 교체 (1 파일 × 1 사이트 = 트리비얼 + inline `-Command` 우회 권장).
- 후속 Goal 들(G-005b/MOD-GRID-18 — Pattern B / G-006 — payroll/admin)이 동일 패턴으로 잔여 페이지 추가 변환할 때 codemod 우선순위 상승.

### 12.5 한글 깨짐 검증 (C-34 + C-35 + ADR-MOD-GRID-17-001/004 의무)
- PowerShell-via-Bash 우회 사용 시 **출력 파일 UTF-8 BOM 미포함** 인코딩 강제 (D9 + C-34).
- **inline `-Command` 우회 권장** (D10 대안 (a) — Bash UTF-8 stdin 직접 전달, BOM 무관). `.ps1` 스크립트 파일 사용 시 BOM prepend 의무 (D10 + C-35).
- 변경 전후 핵심 한글 string hit 카운트 동일 확인:
  - `"등록된 자료가 없습니다."` (1 사이트 — FundStatus L222)
  - 핵심 한글 string 합계: 1 사이트의 emptyText 텍스트 (1 종 distinct 문자열)
- 변경 후 Read 도구로 변경 부위 확인 — 한글 출력 정상 여부 시각 검증.
- 스크립트 실행 결과 `MISS` 0건 (모든 1 사이트 패턴 `HIT` 확인).

### 12.6 Pattern B 4 페이지 무변경 검증 (D1 cascade)
- **D1 결정 cross-check**: 마이그레이션 전후 4 Pattern B 페이지 (`InsEduc11HistoryPage.tsx`, `DailyAttendancePage.tsx`, `InsEmpl22ContractListPage.tsx`, `AnnualLeaveStatusPage.tsx`) 파일 git diff 0 라인 — 본 Goal 에서 절대 미변경.
- 검증 방법: `git diff --stat tw-framework-front/src/pages/tomis/hr/InsEduc11HistoryPage.tsx ... AnnualLeaveStatusPage.tsx` → 변경 라인 0건 (4 파일 모두).
- 추후 별도 Goal (G-005b 또는 MOD-GRID-18) 에서 `useReactTable` 직접 → `<Grid>` 마이그레이션 검토 권장 — 본 Goal 범위 외 (D11 deferred path).

### 12.7 goals.json `scopeNote` 갱신 검증 (ADR-005 + A-04 v1.0.9 의무)
- spec submit 직후 goals.json G-005 객체에 다음 둘 다 추가 의무:
  - 최상위 `"scopeNote": "Pattern B 4 pages (InsEduc11History/DailyAttendance/InsEmpl22ContractList/AnnualLeaveStatus) deferred (D1) — uses useReactTable directly, different migration path than BaseGrid wrapper. Manual <table> removal + page-specific Tailwind class preservation + cell render closure validation required. AC-002 high-impact visual regression risk exceeds single-Goal scope. Deferred to follow-up Goal (G-005b or MOD-GRID-18). Scope reduced 5→1 file."`
  - `stages.specify.scopeNote` 동일 메시지
- `affectedUsageFiles[]` / `implementFiles[]` 배열 5 entries 그대로 (audit trail 보존).

---

## Section 13. 상용 제품화 영향

### 13.1 패키지 대상 (F-01)
- **본 Goal 의 변경 대상 = `tw-framework-front` 사용처만**. `@tomis/grid-core` / `@tomis/grid-pro-*` / `@tomis/grid-renderers` 패키지 변경 없음 (코어 변경 0).
- `packageTarget: "tw-framework-front"` (G-001~G-004 동일).

### 13.2 라이선스 검증 호출 (F-02)
- **N/A** — 본 Goal 의 FundStatus 1 페이지는 MIT 영역(`@tomis/grid-core`) 만 사용. `@tomis/grid-pro-*` (Pro 영역) 호출 없음 (실측 Read 결과 — BaseGrid 만 사용, ChangeTrackingGrid/RangeSelectGrid 등 Pro alias 미사용).
- 따라서 `setLicenseKey()` / `configureGridLicense()` 호출 위치 불필요 (`grid-license` 런타임 검증 적용 대상 외).

### 13.3 문서 작성 계획 (F-03)
- **본 Goal 자체는 public API 변경 0** — Docusaurus API reference 항목 추가 불필요 (C-25 의무는 grid-core 신규 API 추가 시에만 발동).
- **권장 (선택)**: MOD-GRID-99-B docs Goal 의 "마이그레이션 가이드" 챕터에 **Pattern A (default import) 변환 예시** 추가 권장 (G-001~G-004 + G-005 cascading 20 페이지 누적). 본 Goal 의 implement Stage 에서 docs 추가 의무 X.
- **추가 권장**: MOD-GRID-99-B docs Goal 에 **Pattern A vs Pattern B 분류 가이드** 추가 — discover 자동화가 Pattern B 페이지를 BaseGrid wrapper Goal 에 잘못 포함하는 케이스 (본 G-005 D1 발견) 의 cascading 위험 명시. G-006 (`payroll/admin`) 도 동일 reality-check 필요.
- Storybook story 신규 작성: **본 Goal 범위 외** (12.2 방법 1 참조 — 부담 대비 효과 낮음).

### 13.4 peerDependencies 정책 (F-04)
- `@tomis/grid-core` 가 `react` / `react-dom` / `@tanstack/react-table` 을 peer 로 선언 (MOD-GRID-00 G-001 + MOD-GRID-01 G-005 확정).
- tw-framework-front 의 package.json 이 이미 이 셋을 deps 로 보유 (G-001~G-004 spec Section 4.5 검증 완료) — peer 충족.
- 본 Goal 은 dependency 변경 0 → C-22 위반 없음 + peer mismatch 0.

### 13.5 semver 영향 (C-23)
- 본 Goal 은 `@tomis/grid-core` 의 public API 변경 0 → semver 영향 없음 (patch 도 아님).
- 로컬 `BaseGrid` 의 deprecated 처리는 본 Goal 범위 외 — G-005 (in-scope) + G-005b/MOD-GRID-18 (Pattern B deferred) + G-006 (payroll/admin) 까지 완료 후 다른 페이지 사용처 0건 확인 시 별도 cleanup Goal. 누적 마이그레이션 완료 페이지: G-001 5 + G-002 5 + G-003 5 + G-004 4 + G-005 1 = **20 페이지** (BaseGrid wrapper 패턴).

---

## Appendix A. Reality-Check Evidence (A-04 v1.0.9 sub-bullet 자가 점검)

ADR-MOD-GRID-17-005 § Implementation Notes 5 단계 절차 모두 완수:

1. **`affectedUsageFiles[]` 추출**: goals.json G-005 (D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/.claude/tw-grid/goals/MOD-GRID-17/migration-goals.json L341-347) — 5 entries.
2. **각 entry Read + Grep 실측**:
   - InsEduc11HistoryPage.tsx (327 줄) — Grep `<BaseGrid` 0 hits, `useReactTable` 2 hits (L8 import + L133 호출) → **Pattern B**
   - DailyAttendancePage.tsx (606 줄) — Grep `<BaseGrid` 0 hits, `useReactTable` 2 hits (L13 import + L461 호출) → **Pattern B**
   - InsEmpl22ContractListPage.tsx (433 줄) — Grep `<BaseGrid` 0 hits, `useReactTable` 2 hits (L9 import + L148 호출) → **Pattern B**
   - AnnualLeaveStatusPage.tsx (621 줄) — Grep `<BaseGrid` 0 hits, `useReactTable` 2 hits (L14 import + L386 호출) → **Pattern B**
   - FundStatusPage.tsx (230 줄) — Grep `<BaseGrid` 1 hit (L218), `useReactTable` 0 hits → **Pattern A** (in-scope)
3. **Reduction 결정 형식 (D1)**:
   - **D# 결정 작성**: D1 (헤더 표).
   - **Section 1 L0-N 제외 표시**: L0-2~L0-5 (deferred, Pattern B).
   - **Section 7 표 행 제외**: 1 행 (FundStatus 만).
   - **사전 결정 표 D# `goals.json 영향` 컬럼**: D1 "affectedUsageFiles 5 → 1 운영 권위" + D5 "배열 보존 + scopeNote 필드 갱신 의무".
4. **goals.json `scopeNote` 갱신**: spec submit 직후 의무 (Section 12.7 명시).
5. **배열 보존**: `affectedUsageFiles[]` / `implementFiles[]` 5 entries 그대로 (audit trail).

**G-004 (DataTable 제외) vs G-005 (Pattern B 제외) 의미 구분**:
- G-004 D1 = MyNotificationPage 는 **다른 컴포넌트 (`DataTable`)** 사용 — 카테고리 다름.
- G-005 D1 = Pattern B 4 페이지는 **같은 TanStack 라이브러리의 더 낮은 추상화 레벨** (`useReactTable` 직접) 사용 — markup/Tailwind class 페이지별 변형으로 인한 외관 회귀 위험 (AC-002 high impact).
- 둘 다 ADR-005 Investigative Scope-Reduction Authority 발동 케이스 (다른 의미적 이유).

**G-006 cascading 효과 예측** (D11 cross-reference):
- payroll 3 페이지 (PayMmcd02/PayMmcd01/PayrollEditable) + admin 2 페이지 (MenuManage/OrgMaster) — discover 단계 정보 부족 (`affectedUsageFiles` 가 BaseGrid 사용 여부 unverified).
- PayrollEditablePage 는 goals.json G-006 description 에 "EditableGrid/ChangeTrackingGrid 패턴 전환 필요" 명시 — Pro variant 변환 path.
- G-006 spec writer 도 동일 reality-check 의무 (A-04 v1.0.9) — 5 페이지 Read + Grep `<BaseGrid|EditableGrid|ChangeTrackingGrid|useReactTable` 실측 후 패턴 분류.

---

## Appendix B. 자가 점검 (Spec Writer Self-Check — C-35)

**Same-function signature scan**: 본 Goal 의 spec template 에 동일 함수의 여러 form 인스턴스 없음 (사용처 마이그레이션 — 기존 `<Grid>` API 호출만, 신규 함수 정의 0). N/A.

**Import usage scan**:
- Section 2.2 `import { Grid } from '@tomis/grid-core';` — Section 2.3 예시 1/2 본문에서 `<Grid<FinAcno01FundStatusItem> ... />` 사용 (hit ≥ 1) ✓
- Section 2.2 `import type { ColumnDef } from '../../../types/tomis/grid';` — D4 결정 본문에서 명시 (변경 X — re-export 유지) ✓
- Section 11.2 Before 코드 블록 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` — 본문 `<BaseGrid<FinAcno01FundStatusItem> ... />` 사용 ✓
- Section 11.2 After 코드 블록 `import { Grid } from '@tomis/grid-core';` — 본문 `<Grid<FinAcno01FundStatusItem> ... />` 사용 ✓
- 모든 import line 본문 사용 hit ≥ 1 — unused import 0건 ✓

**E-06 Prose ↔ Structured Form 일관성 (cascade — G-004 self-review 학습)**: D1 본문 "Pattern B 4 페이지 deferred" prose vs Section 1 L0-2~L0-5 + Section 3 표 1 행 + Section 7 표 1 행 + Section 11.1 표 1 행 + Section 12.6 검증 — 모든 structured form 1:1 일치 (Pattern B 4 페이지 어디에도 변환 대상 행 미포함) ✓

**G-01 사전 결정 표(D#) ↔ 본문 cross-consistency**:
- D1 (5→1 reduction + 4 deferred) ↔ Section 1 L0-1 (in-scope) + L0-2~L0-5 (deferred) ✓
- D2 (그룹 A default import) ↔ Section 3 표 그룹 컬럼 "A" ✓
- D3 (4 종 props + enableSort/enableFilter 추가) ↔ Section 2.1 매트릭스 + Section 11.2 After 코드 ✓
- D5 (배열 5 보존 + implementFiles 1) ↔ Section 7 표 1 행 + Section 8.1 in-scope 1 + deferred 4 ✓
- D11 (Pattern B deferred path) ↔ Section 13.3 + Section 12.6 ✓

**최종 D# 카운트**: 11 결정. NEW 0 + MODIFY 1 = 1 파일. Section 7 표 1 행 + Section 11.1 표 1 행 = 1:1 일치.

**Verifier 자가-검산 의무 (C-26)**:
- 카테고리 합계: A=5 + B=5 + C=5 + D=6 + E=6 + F=4 + G=1 = 32 + H=3 ✓
- N/A 분모 제외: A-02 (TanStack v8 API signature — 본 Goal 변경 없음) / A-03 (variant 중복 추출 — 본 Goal scope 외) / A-05 (R-A AG Grid + R-W Wijmo — 사용처 마이그레이션 N/A) / B-05 (ref API — 본 Goal 미사용) / D-04 (deprecation 전략 — breaking false) / D-05 (롤백 전략 — N/A or 명시) / F-02 (라이선스 — MIT N/A) 등 N/A 예상 ✓
- failedChecks 배열: NO 결과만 포함, N/A 절대 미포함 ✓

---

**참조 파일**:
- `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/.claude/tw-grid/constraints.md` (C-1 ~ C-36)
- `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/.claude/tw-grid/rubric/specify-rubric.md` (v1.0.9)
- `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/.claude/tw-grid/decisions/MOD-GRID-17-decisions.md` (5 ADR — ADR-005 권한 행사 근거)
- `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/.claude/tw-grid/artifacts/MOD-GRID-17/migration/G-004-self-review.md` (5절 cascading 효과 인용)
- `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/.claude/tw-grid/references/current-tanstack-analysis.md` (§3 Pattern B 패턴 분석 — DailyAttendancePage L13-17 명시)
- `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/.claude/tw-grid/goals/MOD-GRID-17/migration-goals.json` (G-005 정의 L294-359)
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/Grid.tsx` (L254-464 markup 실측 — D1 외관 회귀 근거)
- `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/finance/FundStatusPage.tsx` (in-scope 1 파일 — L11 + L218-223)
- `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/hr/InsEduc11HistoryPage.tsx` (deferred — Pattern B)
- `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/hr/DailyAttendancePage.tsx` (deferred — Pattern B)
- `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/hr/InsEmpl22ContractListPage.tsx` (deferred — Pattern B)
- `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/hr/AnnualLeaveStatusPage.tsx` (deferred — Pattern B)
