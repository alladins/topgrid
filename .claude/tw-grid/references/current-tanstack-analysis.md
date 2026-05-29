# L0: tw-framework-front 현 TanStack Table 사용 현황 분석

**조사 일자**: 2026-05-13
**조사 도구**: Glob/Grep/Read (모든 사실은 직접 확인)
**TanStack 버전**: `@tanstack/react-table@^8.21.3` (package.json L22)
**가상화**: `@tanstack/react-virtual@^3.13.24` (package.json L23)

---

## 1. Grid Variant 인벤토리 (8 + DataTable 모듈)

`tw-framework-front/src/components/tomis/Grid/` 경로에서 발견된 8개 variant + renderer 8개.

| variant 파일 | 핵심 기능 | useReactTable 옵션 | 행 수 |
|--------------|----------|---------------------|-------|
| `BaseGrid.tsx` | sort/filter/pagination/single·multi 선택/loading skeleton | `getCoreRowModel`, `getSortedRowModel`, `getFilteredRowModel`, `getPaginationRowModel` (조건부) | 292 |
| `VirtualGrid.tsx` | TanStack Virtual 통합 — 대용량(>1000) 행 | `useVirtualizer` + sort/filter (페이지네이션 없음) | 221 |
| `EditableGrid.tsx` | 인라인 셀 편집 (text/number/date/select) | `meta.editable`/`editType`/`selectOptions` 기반 | 232 |
| `GroupedHeaderGrid.tsx` | Multi-row column header (TanStack 그룹 column 자동) | column array에 `{header, columns:[...]}` 구조 | (확인됨, ~150) |
| `TreeGrid.tsx` | `getSubRows` + `getExpandedRowModel` 트리 펼침 | `state.expanded`, `setExpanded` | (확인됨, ~150) |
| `ColumnPinGrid.tsx` | `state.columnPinning` 좌/우 고정 | `ColumnPinningState` props로 컬럼 id 배열 | (확인됨, ~120) |
| `ChangeTrackingGrid.tsx` | row status (added/edited/deleted/unchanged) + `useImperativeHandle` API | `getChanges/resetChanges/addRow/deleteRow` Handle | 239 |
| `RangeSelectGrid.tsx` | 셀 범위 선택 + 컨텍스트 메뉴 (drag) | row/col 좌표 추적, normalizeRange | (확인됨, ~200+) |

### renderers (8 sub-component)

| 파일 | 용도 |
|------|------|
| `ButtonCell.tsx` / `BadgeCell.tsx` / `CheckCell.tsx` | 셀 내 버튼·뱃지·체크 표시 |
| `LinkCell.tsx` / `NumberCell.tsx` / `DateCell.tsx` / `IconCell.tsx` | 링크/숫자/날짜/아이콘 셀 |
| `index.ts` | re-export barrel |

---

## 2. DataTable 컴포넌트 (legacy 스타일 별도 추상화)

`tw-framework-front/src/components/DataTable/` 경로 8 파일 — `migration-master/publish` 마이그레이션 산출물로 추정. **`tomis/Grid/` 와 별도의 독립 추상화**.

| 파일 | 역할 |
|------|------|
| `data-table.tsx` (762 줄) | 최상위 컴포넌트 — `useReactTable` + 검색/다운로드/추가/삭제 버튼 묶음 |
| `data-table-checkbox.tsx` | 체크박스 셀 |
| `data-table-column-header.tsx` | 정렬 지원 헤더 |
| `data-table-pagination.tsx` | 서버 사이드 페이지네이션 (manualPagination=true) |
| `data-table-view-options.tsx` | 컬럼 visibility 토글 |
| `data-table-row-actions.tsx` | 행별 액션 메뉴 (수정/삭제/하위추가) |
| `data-table-types.ts` | `ColumnInfo` (id/type/align/name/width/visibility/etc) + `ButtonInfo` + `RowActionInfo` + `AdditionalRowActionInfo` |
| `index.ts` | barrel |

특징:
- **타입 기반 셀 자동 분기**: `type: 'checkbox'|'number'|'boolean'|'dateTime'|'text'` → `cell` 함수 자동 생성
- **컬럼 리사이즈**: `columnResizeMode='onChange'` + `columnSizing` state
- `ResizeObserver` 컨테이너 추적 + viewport 기반 동적 `tableHeight` 계산
- 권한 기반 버튼 활성 (`permissions.readYn/saveYn/deleteYn/downloadYn`)
- 의존성: `useAuthStore`, `formatNumberString`, `formatDateTimeFromDateTimeString`
- 인라인 `<style>{...}` (C-5 위반 — Tailwind only 정책)

---

## 3. 사용처 (Page-level usage) — Grep 결과 40 파일

`useReactTable|createColumnHelper|getCoreRowModel` 매칭: **13 파일** (페이지 4 + variant 8 + DataTable 1)
Grid 직접 import (`BaseGrid|VirtualGrid|...`) 매칭: **40 파일** (페이지 27 + variant 8 + DataTable 5)

### 페이지 사용처 (27건 — 마이그레이션 영향 대상)

| 영역 | 파일 (절대경로 prefix: `D:\project\topvel_project\TOMIS\tw-framework-front\src\pages\`) |
|------|----------------------------------------------------------------------------------------|
| **account** (회계 — 18) | `tomis\account\AdminSlipEditPage.tsx`, `DailyMonthlyReportPage.tsx`, `ExpenseResearchCardPage.tsx`, `CashAdvanceSettlePage.tsx`, `CashAdvanceRequestPage.tsx`, `InterestIncomePage.tsx`, `AdjustmentPage.tsx`, `FinancialCarryoverPage.tsx`, `SettlementSummaryPage.tsx`, `MonthlySettlementPage.tsx`, `ExpenseGeneralPage.tsx`, `ExpenseCardPage.tsx`, `SlipDailyStatusPage.tsx`, `EtaxReceivePage.tsx`, `VatSchedulePage.tsx`, `VatManagePage.tsx`, `SlipClosePage.tsx`, `SlipApprovePage.tsx`, `SlipListPage.tsx` |
| **hr** (인사 — 4) | `tomis\hr\InsEduc11HistoryPage.tsx`, `DailyAttendancePage.tsx`, `InsEmpl22ContractListPage.tsx`, `AnnualLeaveStatusPage.tsx` |
| **payroll** (급여 — 3) | `tomis\payroll\PayMmcd02Page.tsx`, `PayMmcd01Page.tsx`, `PayrollEditablePage.tsx` |
| **admin** (관리 — 2) | `tomis\admin\MenuManagePage.tsx`, `OrgMasterPage.tsx` |
| **finance** (자금 — 1) | `tomis\finance\FundStatusPage.tsx` |
| **notification** (1) | `MyNotification\MyNotificationPage.tsx` |

### 두 가지 사용 패턴

**패턴 A — variant import (BaseGrid 등)** : 페이지에서 `BaseGrid` import + `ColumnDef<TData>[]` 전달
- 예: `SlipListPage.tsx` L21 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';`

**패턴 B — useReactTable 직접 사용**: variant를 거치지 않고 페이지 안에서 `useReactTable({...})` 호출
- 예: `DailyAttendancePage.tsx` L13-17 `import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';`
- 영향: 4 페이지 (hr 도메인 모두) — 추상화 필요성 강한 증거

---

## 4. types 인벤토리 (`types/tomis/grid.ts` 추정)

variant 파일들이 공통으로 import:
- `BaseGridProps<TData>` — data/columns/pagination/rowSelection/onRowClick/onRowDoubleClick/loading/emptyText/className
- `GridPaginationOptions` — `pageSize`/`pageSizeOptions`
- `GridRowSelectionOptions` — `mode: 'single'|'multi'|'none'`/`onSelectionChange`
- `ColumnDef<TData>` (re-export로 추정)
- `EditableColumnMeta` — `editable`/`editType`/`selectOptions`
- `RowChangeStatus`, `TrackedRow<TData>` (ChangeTracking)

**확인 필요**: `tw-framework-front/src/types/tomis/grid.ts` 실제 파일 존재 여부 (현재 Glob 미실시 — Phase 2 에서 확인 권장).

---

## 5. 공통 패턴 추출 (DRY 후보)

| 중복 패턴 | 사용 variant | 추상화 후보 모듈 |
|----------|------------|--------------|
| `useState<SortingState>` + `getSortedRowModel` | 7/8 (TreeGrid 제외) | MOD-GRID-02 useGridState |
| `useState<ColumnFiltersState>` + `getFilteredRowModel` | 5/8 (BaseGrid, Virtual, ColumnPin, GroupedHeader, ChangeTracking 제외) | MOD-GRID-02 / MOD-GRID-09 |
| `useState<RowSelectionState>` + 체크박스 셀 합성 | 2/8 (Base, Virtual) — 중복 70+ 줄 동일 | MOD-GRID-01 wrapper |
| `getPaginationRowModel` + pageIndex/pageSize state | 4/8 | MOD-GRID-03 페이지네이션 통합 |
| `flexRender(cell.column.columnDef.cell, cell.getContext())` 표 본문 | 8/8 | MOD-GRID-01 wrapper |
| `pagination?.pageSizeOptions ?? [10,20,50,100]` 페이지당 행 수 select | 1/8 (BaseGrid만) | MOD-GRID-03 |
| 로딩 skeleton + 빈 결과 안내 | 8/8 동일 패턴 | MOD-GRID-01 |
| `state.expanded` 트리/그룹 | 1/8 (TreeGrid) | MOD-GRID-16 master-detail |

---

## 6. 시나리오 매핑 (사용처 → 어떤 variant 필요한가)

(샘플 4건, Phase 2 Goal 도출의 기초)

| 페이지 | 시나리오 | 현재 사용 | 미사용 기능 |
|--------|----------|---------|--------|
| `SlipListPage.tsx` | 전표 목록 (서버 페이지네이션 + 검색) | `BaseGrid` | manualPagination, 다중 정렬 |
| `DailyAttendancePage.tsx` | 일별 출퇴근 (셀 시간 편집 22 필드) | `useReactTable` 직접 | 인라인 편집 패턴, 시수 합산 (aggregation) |
| `PayrollEditablePage.tsx` | 급여 편집형 grid | `EditableGrid` | ChangeTracking 패턴 가능성 |
| `OrgMasterPage.tsx` | 조직 관리 (트리?) | `BaseGrid` (예상 — TreeGrid 미사용 가능) | TreeGrid + Master-Detail |

⚠️ **확인 필요**: 각 페이지의 정확한 variant 사용은 미확인. 대표 페이지 5건은 Phase 2 에서 Read로 확정.

---

## 7. 위반/리스크 발견

| 위반 | 위치 | constraints.md |
|------|------|---------------|
| 인라인 `<style>{...}` 700~ 줄 (custom-scrollbar) | `DataTable/data-table.tsx` L717-755 | **C-5 위반** (Tailwind only) |
| `as any` 다수 (`meta as any`, `columnInfo.etc as any`) | `DataTable/data-table.tsx` L666, L267 등 | **C-4 위반** (No any) |
| `// eslint-disable-next-line @typescript-eslint/no-unused-vars` | `DataTable/data-table.tsx` L104 | 약식 회피 — refactor 후보 |
| inline 체크박스 셀 동일 70 줄 (BaseGrid·VirtualGrid) | `BaseGrid.tsx` L37-67 / `VirtualGrid.tsx` L40-69 | DRY 위반 (MOD-GRID-01 수렴) |
| `setColumnSizing(updater)` 직접 캐스팅 부재 | `DataTable/data-table.tsx` L356 | TanStack v8 API 사용 OK (C-2 통과) |

---

## 8. 갭 (현재 미지원 — Critical-gap/Wijmo-class 후보)

| 기능 | 현재 상태 | 출처 |
|------|---------|------|
| Excel/PDF Export | xlsx dep 존재 (^0.18.5) but DataTable에서 `downloadAction` 이벤트만 — 실제 export 코드 없음 | C-21 grid-export 패키지 후보 |
| 컬럼 드래그·재정렬 | 없음 (`columnOrdering` state 미사용) | TanStack 기본 지원 → wrapper만 필요 |
| 다중 정렬 (sort 우선순위) | 단일 정렬만 (`sorting[0]` UI) | TanStack `enableMultiSort` 노출 안 됨 |
| Filter UI (Excel-style/text/range) | filter state 있지만 UI 없음 | 직접 구현 필요 |
| Drag-fill (Excel 같은 핸들로 셀 복사) | 없음 | Wijmo 비교 후 구현 |
| DataMap (셀 단위 lookup map) | 없음 (EditableGrid `selectOptions`는 컬럼 단위) | Wijmo 비교 |
| Cell merging (값 같은 셀 자동 병합) | 없음 | Wijmo 비교 |
| Aggregation 행 (group footer) | 없음 (TanStack `getGroupedRowModel` 미사용) | MOD-GRID-15 |
| Master-Detail (row expand → child grid) | TreeGrid는 같은 grid 트리만, 자식 grid 없음 | MOD-GRID-16 |
| Context Menu | RangeSelectGrid 자체 구현만 | 일반화 필요 |
| Column resize | DataTable 만 가능, tomis/Grid는 없음 | wrapper 통합 |
| Virtualization | VirtualGrid만 — 다른 variant 비호환 | MOD-GRID-01 통합 |

---

## 9. 결론 — 추상화 방향 (Phase 2 Goal 도출 입력)

1. **MOD-GRID-01 통합 wrapper**: 8 variant + DataTable을 하나의 `<Grid>` API 로 통합. `variant` prop 대신 옵션 조합 (`enableInlineEdit`, `enableVirtualization`, `enableChangeTracking`, ...).
2. **MOD-GRID-02 useGridState**: sort/filter/pagination/selection/pinning state 통합 훅.
3. **MOD-GRID-03 페이지네이션 통합**: client (`getPaginationRowModel`) vs server (`manualPagination`) 단일 props 화.
4. **MOD-GRID-04 컬럼 팩토리**: DataTable의 `type:'checkbox'|'number'|...` 자동 분기 패턴을 일반화.
5. **MOD-GRID-05 셀 렌더러**: 기존 8 renderer + 신규 (Tag, Avatar, Progress, ...) 표준화.
6. 위반 정리 (C-4, C-5) — DataTable 인라인 style + any → tailwind + 정확한 타입.

**예상 영향**: 페이지 사용처 약 27건. C-19 점진 마이그레이션 (Goal 당 ≤ 5) → 마이그레이션 모듈 1개로 5+ Goal 분할 예정.
