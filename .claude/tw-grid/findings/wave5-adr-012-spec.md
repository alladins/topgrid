# ADR-012 계획 spec — DataTable/ 폴더 마이그레이션

> **본 문서는 계획 ADR 의 spec 보고서**. 구현 단계 없음. 사용자 D-1~D-3 결정 게이트 후 별도 cycle 에서 implementer 위임.
> **연관 ADR**: `MOD-GRID-REFACTOR-2026-05-17-decisions.md` ADR-MOD-GRID-REFACTOR-2026-05-17-012 (Wave 5, accepted)
> **연관 finding**: `refactor-analysis-2026-05-17.md` §7.2 (P0), §1.5 (P2), §13 #1
> **작성**: 2026-05-17, opus47 (1M context)

---

## Executive Summary — N=1 가 모든 것을 뒤집는다

보고서 §13 #1 가 미수행으로 남겨둔 **DataTable 페이지 import 인벤토리** 를 수행한 결과:

```
Grep "DataTable|ColumnInfo|RowActionInfo|ButtonInfo|AdditionalRowAction|
      DataTableCheckbox|DataTableColumnHeader|DataTablePagination|
      DataTableViewOptions|DataTableRowActions"
   path: tw-framework-front/src/pages
   → 1 file: pages/MyNotification/MyNotificationPage.tsx
```

**N = 1 페이지**. ADR-012 본문 §주석 (line 939, 941, 949) 의 "수 페이지 grep" / "PR 작아짐" / "사용자 (페이지) 측 변경 분산" 가정이 사실과 다름. **N=1 은 마이그레이션 path 의 비용-편익 곡선 자체를 재정의**한다 — 본 spec 은 이 사실을 중심으로 ADR-012 의 4-Phase 점진 안을 재평가한다.

추가 발견:
- `grid-core/legacy/ColumnInfo.ts` shape 가 DataTable 의 `ColumnInfo` 와 동일 (legacy compat 의도).
- 그러나 `ButtonInfo` / `RowActionInfo` / `AdditionalRowActionInfo` 의 monorepo alias **부재** — 단순 import 교체로 마이그레이션 불가.
- `grid-core/legacy/DataTablePagination` 은 signature mismatch (`{table, totalCount}` vs `{paging, listAction}`) — drop-in 불가.

---

## 1. DataTable/ 7 파일 인벤토리

| 파일 | LOC | 역할 | 외부 의존 | monorepo 동등 |
|------|-----|------|-----------|--------------|
| `data-table.tsx` | 761 | 주 컴포넌트 — `useReactTable` 직접 호출, 자체 column 빌더(switch on type), 헤더+바디+ResizeObserver+pagination wrapper | `@tanstack/react-table`, `./data-table-*`, `react-icons/fa`, `cn`, `formatNumberString`, `formatDateTimeFromDateTimeString`, `useAuthStore`, `Permissions` | `grid-core/Grid.tsx` (다른 API — `<Grid columns data enable*>`) |
| `data-table-types.ts` | 58 | `ColumnInfo` / `ButtonInfo` / `RowActionInfo` / `AdditionalRowActionInfo` + 2 Initialize 상수 | none | `grid-core/legacy/ColumnInfo.ts` (ColumnInfo 만 동일 shape), Button/RowAction 대응 부재 |
| `data-table-checkbox.tsx` | 30 | shadcn Checkbox 위에 `border-gray-400 h-3 w-3 ${className}` 강제 + FaCheck child | `../Ui/Checkbox`, `react-icons/fa` | `grid-core/internal/CheckboxColumn.tsx` 존재 (확인 필요 — 사용 패턴 다름: row level vs cell-renderer column) |
| `data-table-column-header.tsx` | 153 | 컬럼 헤더 정렬 dropdown — `listAction("changeOrderItem", "snake_case:asc")` 호출 패턴 (server-side sort) | `Button`, `DropdownMenu`, `toCamelCaseString`, `toSnackCaseString`, TanStack `Column` | `grid-core/internal/multi-sort/` 자체 SortBadge 보유 (다른 모델 — client-side sortingState driven) |
| `data-table-pagination.tsx` | 131 | `paging: PagingInfo` + `listAction("changePageSize"/"changePageNo")` 패턴 (server-side pagination, manual) | `Button`, `Select`, `PagingInfo` from `types/common` | `grid-core/legacy/DataTablePagination.tsx` 존재 (그러나 **signature mismatch** — TanStack `table` 받음) |
| `data-table-row-actions.tsx` | 167 | `rowActionInfo` 4 토글 + `additionalRowActions[]` + `permissions` 체크 — DropdownMenu 기반 | `Button`, `DropdownMenu`, `react-icons/fa`, `RowActionInfo`, `Permissions` | monorepo 대응 **부재** — DataTable 만의 도메인 패턴 (편집/삭제/신규/하위신규 + 추가 액션) |
| `data-table-view-options.tsx` | 83 | column visibility toggle dropdown (select+actions 제외) | `Button`, `DropdownMenu`, TanStack `Table` | `grid-core/src/column/ColumnVisibilityMenu.tsx` 존재 (직접 비교 미수행 — 분리 cycle 권고) |
| `index.ts` | 9 | barrel — `DataTable` default + 5 sub + 4 type + 2 init export | (자기 src) | n/a |

**합계**: 1,392 LOC, 8 파일 (index 포함). 모두 `@tomis/grid*` import 0건 — 보고서 §7.2 의 "독립 추상화" 확인.

### 1.1 monorepo 와의 핵심 API 차이

`<Grid>` 와 `DataTable` 의 contract 가 **다른 추상화 수준**:

| 차원 | `<Grid>` (monorepo) | `<DataTable>` (tw-framework-front) |
|------|---------------------|-----------------------------------|
| Column model | `ColumnDef<TData>[]` (TanStack 직속) 또는 `createColumns(TomisColumnDef[])` | `columnInfos: ColumnInfo[]` (`{id, type, align, name, width, visibility, etc}`) — 자체 switch 빌더 |
| Action wiring | sort/filter/pagination 은 `enable*` 토글 + server 모드는 prop | 단일 `listAction(act: string, value: string)` 콜백 (act=`changeOrderItem`/`changePageNo`/`changePageSize`/`downloadListData` 등) |
| Toolbar | 외부에서 user 가 직접 JSX 작성 | `buttonInfo: ButtonInfo` (4 토글 + 4 title + 4 action key) 내장 |
| Row action menu | 부재 (외부 wrapper) | `rowActionInfo` (4 토글) + `additionalRowActions[]` + `permissions` 내장 |
| Pagination model | TanStack `pagination` state + `GridPagination<TData>{ table }` | `pageingInfo: PagingInfo` (서버 응답 직역) + `listAction("changePageNo", N)` |
| Permission | 부재 | `permissions: Permissions` (`readYn/saveYn/deleteYn/downloadYn`) prop 의무 |
| Loading | `loading?: boolean` | `isLoading?: boolean` + 내장 spinner + ResizeObserver 기반 height 계산 |
| Cell type | renderer registry (text/number/date/dateTime/badge/link/...) | switch (checkbox/number/boolean/dateTime/text fallback) — 4 type 만 |

→ DataTable 은 **single-page CRUD 화면을 위한 high-level 도메인 wrapper** 이고, Grid 는 **TanStack 의 low-level abstraction**. drop-in 호환 불가 — re-wiring 필요.

---

## 2. 페이지 사용처 (보고서 §13 #1 이행)

### 2.1 grep 결과 — N=1

```bash
# 명령 1: from '...components/DataTable' import 경로
$ grep -r "from\s+['\"][^'\"]*components/DataTable" tw-framework-front/src
→ tw-framework-front/src/pages/MyNotification/MyNotificationPage.tsx (1 hit)

# 명령 2: DataTable + 관련 export 식별자 (인지 누락 보강)
$ grep -r "DataTable|ColumnInfo|RowActionInfo|ButtonInfo|AdditionalRowAction|
          DataTableCheckbox|DataTableColumnHeader|DataTablePagination|
          DataTableViewOptions|DataTableRowActions" tw-framework-front/src/pages
→ tw-framework-front/src/pages/MyNotification/MyNotificationPage.tsx (1 hit)

# src 전체 (DataTable/ 폴더 자체 + 페이지 외)
→ DataTable/ 폴더 자기 8 파일 + 페이지 1 = 9 hits. 외부 사용처는 1 페이지.
```

### 2.2 MyNotificationPage 의 사용 패턴

`tw-framework-front/src/pages/MyNotification/MyNotificationPage.tsx:16` 의 import:
```tsx
import { DataTable, ButtonInfo, RowActionInfo, AdditionalRowActionInfo,
         ButtonInfoInitialize, RowActionInfoInitialize } from '../../components/DataTable';
```

사용 패턴 (line 455-469):
```tsx
<DataTable
  data={dataList}
  pageingInfo={pagingInfo}
  columnInfos={columnInfos}              // ← ColumnInfo[] 모델
  buttonInfo={listButtonInfo}            // ← ButtonInfo 토글
  buttonChildren={<ListAdditionalButtons />}
  rowActionInfo={listRowActionInfo}      // ← RowActionInfo 토글
  additionalRowActions={additionalListRowActionInfo}  // ← AdditionalRowActionInfo[]
  listCondition={searchState.listCondition}
  onRowSelectionChange={handleRowSelectionChange}
  listAction={handleListAction}          // ← 단일 string-act dispatch
  hasChildAction={false}
  permissions={currentPage?.permissions}
  isLoading={isLoading}
/>
```

- 9 props (data + 8 컨트롤) 모두 `<Grid>` 와 직접 대응 없음.
- `handleListAction(act, value)` 는 페이지 측에 string switch 가 있을 것 — 마이그레이션 시 dispatch 패턴 자체를 풀어야 함.

→ **N=1 의 임계 결과**: 호출처는 1 파일에 집중. 마이그레이션 비용은 본 1 파일의 페이지 재작성에 수렴.

---

## 3. tomis/Grid/ vs DataTable/ 의 분리 사유 분석

### 3.1 디렉토리 비교

| 폴더 | 파일 수 | 역할 |
|------|--------|------|
| `tw-framework-front/src/components/tomis/Grid/` | 8 (BaseGrid, ChangeTrackingGrid, ColumnPinGrid, EditableGrid, GroupedHeaderGrid, RangeSelectGrid, TreeGrid, VirtualGrid) + renderers/ | 보고서 §7.1 의 "5+3 variant" — TanStack 기반 grid 의 다양한 시나리오. **Low-level + 패턴별** wrapper. monorepo 의 동등 컴포넌트 (`grid-core/legacy/*`) 와 1:1 대응. |
| `tw-framework-front/src/components/DataTable/` | 7 (data-table + 5 sub + types) | **High-level CRUD 화면 추상화**. button toolbar + row action menu + server pagination + permissions 일체. 자체 ColumnInfo model. monorepo 대응 부재. |

### 3.2 분리는 의도된 design — 단 마이그레이션 흔적은 존재

- `apps/docs/docs/migration/dataTable-migration.md` 가이드 존재 (보고서 §7.2 인용) — 정리 계획은 문서화.
- `grid-core/legacy/ColumnInfo.ts` 가 동일 shape alias (보고서 §1.5) — alias 의도 명시.
- 그러나 DataTable 측은 alias 를 import 0건. **문서는 있으나 코드 미진행** — "정리 잔재" 진단 (보고서 §7.2 = P0).

### 3.3 두 폴더는 같은 트랙이 아닐 가능성

`tomis/Grid/` 의 8 variant 는 monorepo 마이그레이션의 일관 reference. `DataTable/` 은 그와 **별개 트랙** — DataTable 의 9 props 가 `<Grid>` 의 prop 집합에 자연 mapping 되지 않으므로, `<Grid>` 직접 교체보다는:
- 페이지 측에서 `<Grid>` + 별도 toolbar/row-action JSX 를 결합 (toolbar 분리)
- 또는 신규 `<TomisCrudGrid>` 도메인 wrapper 도입 (별도 ADR)

→ 분리 사유의 본질은 **추상화 수준의 차이**. monorepo 가 high-level CRUD wrapper 를 제공하지 않는 한, DataTable 의 도메인 패턴은 단순 deprecate 불가.

---

## 4. 마이그레이션 path 옵션 재평가 (N=1 반영)

### 4.1 옵션 P-1: 즉시 deprecate + 사용처 1 페이지 교체

**N=1 영향**: ADR-012 본문이 "각하"한 P-1 의 사유 ("PR 거대화", "시각 회귀 부담 ↑↑") 가 **N=1 에서는 약화**. 단:
- MyNotificationPage 의 `<DataTable>` 호출 1건 ≠ MyNotificationPage 의 변경 1건. `handleListAction` switch, `columnInfos`/`buttonInfo`/`rowActionInfo` 빌드 코드 모두 재작업 필요.
- 시각 회귀: 1 페이지 manual screenshot — 1h 부담.
- API gap 가 큼 (§1.1) — `<Grid>` 직접 교체 시 toolbar + row-action 을 페이지 JSX 로 풀어야 함 → MyNotificationPage 의 50~100 LOC 신규 작성 추정.

**공수**: 6~10h (페이지 재작성 + screenshot + smoke 테스트).
**장점**: 1 cycle 종결. DataTable/ 7 파일 (1,392 LOC) 제거.
**단점**: MyNotificationPage 의 toolbar/row-action 패턴이 page-local 로 복제 → 다른 페이지 도입 시 재사용 불가.

### 4.2 옵션 P-2: 단계적 deprecation (현행 ADR-012 안)

**Phase 1** (인벤토리): **본 spec 으로 완료** (N=1 확정).
**Phase 2** (deprecation marker): DataTable export 에 console.warn + 가이드 — N=1 의 dev 가 이미 본 spec 결과를 인지하므로 marker 효용 ↓.
**Phase 3** (점진 교체): 1 페이지 — 점진의 의미 없음. 1 PR 로 끝남.
**Phase 4** (제거): 사용처 0 확인 후 폴더 제거.

**공수**: 4h (계획) + 2h (marker) + 8h (교체) + 1h (제거) = 15h.
**장점**: POL-MIG-STAGE 의 "점진" 명문화.
**단점**: N=1 에서 Phase 2 의 marker phase 가 over-engineered — single user (MyNotificationPage maintainer) 가 marker 없이도 변경 가능.

### 4.3 옵션 P-3: 영구 평행 (status quo)

**advisor + ADR-012 본문 일치 — 권고 배제**. 분기 진화 위험 영구. POL-MIG-STAGE 미달성.

### 4.4 옵션 P-4: 신규 `<TomisCrudGrid>` 도메인 wrapper 도입 후 마이그레이션

monorepo (또는 tw-framework-front) 에 DataTable 의 9 props (columnInfos + buttonInfo + rowActionInfo + additionalRowActions + listAction + permissions + ...) 를 흡수하는 신 wrapper 신설. MyNotificationPage 는 이 wrapper 로 교체.

**공수**: 12h (신 wrapper spec + 구현) + 4h (마이그레이션) + 4h (DataTable 제거) = 20h. **별도 ADR 필요** (C-9 외부 패턴 변경).
**장점**: 다른 페이지가 동일 CRUD 패턴 필요 시 재사용 가능. high-level 추상화 보존.
**단점**: 신규 추상화 도입 — 본 ADR 범위 초과. monorepo 측 결정 (어느 패키지에) 도 별건.

→ **N=1 에서는 P-4 의 wrapper 신설 비용을 1 페이지만으로 회수하기 어려움**. 다른 페이지가 향후 추가될 가능성이 명확하지 않은 한, P-4 는 비효율.

### 4.5 권고 — P-1 (with sub-decision)

**N=1 + API gap 큼 + 신 wrapper 도입 비용 회수 불명확** 의 3 사실 종합:
- **P-1 권고**: 즉시 deprecate + MyNotificationPage 재작성 + DataTable/ 폴더 제거.
- **sub-decision D-1a**: deprecation marker phase (P-2 의 Phase 2) 를 둘 것인가, 바로 P-1 인가?
  - **권고**: marker phase 생략. 사용자 (MyNotificationPage maintainer) 가 본 spec 결과를 인지하면 marker 의 효용 ≈ 0.
  - **사용자 결정 필요** (D-1a) — POL-MIG-STAGE 의 점진 의도와 1 PR 종결의 trade-off.

**대안 권고 — P-1 ↔ P-4 ↔ P-2 결정 보류 시**: P-2 의 ADR-012 본문 그대로 유지. 단 Phase 2 의 marker 추가는 본 spec 인지 후 효용 ≈ 0 임을 명시.

---

## 5. Phase 계획 — P-1 채택 시

| Phase | 작업 | 공수 | dependency | 위험 |
|-------|------|------|-----------|------|
| Phase 1 | **본 spec 으로 완료** — 사용처 인벤토리 (N=1 확정), API gap 분석, 옵션 평가 | 4h (수행됨) | none | none |
| Phase 2 | MyNotificationPage 재작성 — `<Grid>` + toolbar JSX + row-action menu 분리. `columnInfos→ColumnDef[]` 변환. `listAction switch→prop callback` 풀기. | 6h | Phase 1 + 사용자 D-1 (P-1 확정) | medium (시각 회귀, 1 페이지 screenshot baseline) |
| Phase 3 | `apps/docs/docs/migration/dataTable-migration.md` 가이드 archive (1 페이지 사용 사례를 기록). DataTable/ 폴더 + index export 제거. | 1h | Phase 2 PR merge | low |
| Phase 4 | `grid-core/legacy/ColumnInfo.ts` 의 deprecation 검토 — 사용처 0 이면 `@deprecated` 강화 (별도 ADR-013 영향) | 0.5h | Phase 3 | low |

**P-1 합산 공수**: 7.5h (Phase 1 완료 후 6+1+0.5 = 7.5h).

**P-2 채택 시** (ADR-012 본문 안): Phase 2~4 (marker + 점진 + 제거) = 15h. (현행 ADR-012 의 4h 계획 + 11h 후속 PR 들.)

---

## 6. 사용자 결정 지점

### D-1 (필수): 마이그레이션 path 옵션
- (a) P-1 — 즉시 deprecate + 1 페이지 재작성 + 폴더 제거 (**본 spec 권고**, ~7.5h)
- (b) P-2 — ADR-012 본문 점진 안 (~15h)
- (c) P-4 — 신 wrapper 신설 + 별도 ADR (~20h)
- (d) 보류 — N=1 에서 status quo (P-3 — 권고 배제)

### D-1a (D-1=P-1 시 sub): deprecation marker phase
- (a) marker 생략 — 사용자가 본 spec 인지 (**권고**)
- (b) marker 1 minor 유지 — POL-MIG-STAGE 점진 의도 보존

### D-2 (P-1/P-2/P-4 공통): MyNotificationPage 재작성의 시각 회귀 baseline
- (a) manual screenshot (사용자 본인) — N=1 에서 1h
- (b) Playwright/Chromatic 자동화 — 별도 ADR (부록 C #2 와 동일 결정)
- (c) skip — N=1 + 페이지 비즈니스 중요도 낮음 시

### D-3 (P-1/P-4 시): DataTable 의 `RowActionInfo` / `AdditionalRowActionInfo` / `ButtonInfo` 패턴의 처리
- (a) MyNotificationPage 측에 inline JSX 로 풀기 (P-1 권고) — 재사용 0
- (b) 신 `<TomisCrudToolbar>` / `<TomisRowActionMenu>` 컴포넌트 분리 — P-4 의 일부
- (c) monorepo 의 `grid-features` 에 추가 — 별도 ADR

---

## 7. 위험 + 한계

### 7.1 본 spec 의 한계

- **MyNotificationPage 외 사용 식별자가 다른 곳에서 indirect 사용 가능성** — 본 grep 은 `DataTable | ColumnInfo | RowActionInfo | ButtonInfo | AdditionalRowAction | DataTable*` 10개 식별자만 검색. 만약 `import * as` 또는 동적 import 사용 시 미검출 — 그러나 tw-framework-front 의 ESLint 규칙 (확인 미수행) 이 동적 import 차단 추정. 추가 조사 cost ≈ 1h.
- **`tomis/Grid/` 의 8 variant 중 ChangeTrackingGrid / EditableGrid / RangeSelectGrid 등 DataTable 과 패턴 유사한 것 비교 미수행** — 본 spec 은 monorepo `grid-core/legacy/*` 와 monorepo `<Grid>` 만 비교. ChangeTrackingGrid 가 DataTable 의 일부 (예: row-action) 와 유사하면 P-4 의 wrapper 가 ChangeTrackingGrid 와 통합 가능. 별도 분석 권고.
- **`apps/docs/docs/migration/dataTable-migration.md` 의 실 내용 미검토** — 보고서 §7.2 인용만. 가이드의 권고가 본 spec 의 P-1 과 다를 시 정렬 필요.
- **N=1 의 영속성**: 본 spec 의 grep 시점 (2026-05-17) 의 N=1. 본 ADR 의 implementer 단계 진행 사이에 다른 페이지가 추가될 수 있음 — implementer 시점에 재grep 의무.

### 7.2 P-1 (권고) 의 위험

- MyNotificationPage 의 `handleListAction` switch 가 다른 비즈니스 로직과 결합되어 있을 수 있음. 풀기 시 비즈니스 회귀 위험. screenshot + smoke 테스트로 보완.
- `<Grid>` 의 server-side pagination 모델이 `pageingInfo` 모델과 완전 등가인지 확인 필요. `grid-core/legacy/DataTablePagination` 의 signature mismatch 가 시사 — 단순 `enablePagination` 토글이 아닐 가능성.
- `permissions` 토글 (readYn/saveYn/deleteYn/downloadYn) 의 monorepo 측 대응 부재. 페이지 측 conditional JSX 로 풀어야 함.

### 7.3 P-2 (현행 ADR-012) 의 위험

- N=1 에서 marker phase 의 효용 ≈ 0 — over-engineering. POL-MIG-STAGE 의 "점진" 의도가 N=1 에서 의미 약함.
- Phase 2~4 의 PR 분리는 1 페이지 변경에 비해 PR overhead 큼.

### 7.4 P-4 의 위험

- 신 wrapper 추상화의 spec 작성 + 구현 비용을 1 페이지 회수로 정당화 어려움.
- monorepo 측 결정 (grid-features? grid-pro-*? tw-framework-front 내부?) 별도 ADR 필요.

---

## 8. 권고 + 다음 단계

### 8.1 권고 — 사용자 D-1 = P-1 (or P-2)

- **P-1 권고**: N=1 + API gap 큼 + 신 wrapper 회수 불명확 → 1 cycle 종결 안.
- **D-1a sub**: marker phase 생략 (advisor 권고 동의).
- **P-2 fallback**: 사용자가 POL-MIG-STAGE 점진 의도 보존 우선 시 → ADR-012 본문 그대로. 단 Phase 2 marker 의 효용 ≈ 0 명시.

### 8.2 본 spec 의 ADR-012 본문 갱신

ADR-012 의 line 904 "**승인일**: 2026-05-17 (Wave 5 — ADR-004와 1 wave 묶음, 부록 C #6 옵션 A)" 와 line 906 "**상태**: accepted (Wave 5 — 계획 ADR 작성 단계)" 는 유지. 추가:
- **Implementation Plan — 2026-05-17 (계획 ADR 작성 완료)** 섹션 (본 ADR 끝, line 962 뒤).
- 본 spec 의 N=1 finding + 권고 P-1 + D-1~D-3 결정 포인트 명시.
- 다음 cycle implementer 위임 기준: 사용자 D-1 결정 후 별도 ADR `MOD-GRID-REFACTOR-NN-datatable-execute`.

### 8.3 다음 cycle implementer 위임 기준 (명세)

implementer cycle 진입 조건 (모두 충족):
1. 사용자 D-1 결정 완료 (P-1 / P-2 / P-4 / 보류 중 택1, 본 spec 의 ADR-012 Implementation Plan 갱신).
2. D-1 = P-1 시: D-1a (marker 생략 / 유지), D-2 (screenshot 방식), D-3 (RowAction/ButtonInfo 처리) 의 3 sub 결정 완료.
3. D-1 = P-4 시: 신 wrapper 의 owning package 결정 (별도 ADR).
4. implementer 시점에 페이지 사용처 재grep 의무 — N=1 의 영속성 확인.
5. screenshot baseline (D-2 = a/b 시) 캡처 완료.

implementer 산출:
- (P-1) MyNotificationPage 재작성 PR + DataTable/ 폴더 제거 PR (1 PR 묶음 권고).
- (P-2) 4 Phase 분리 PR (현행 ADR-012 안).
- (P-4) 신 wrapper PR + 마이그레이션 PR + 폴더 제거 PR.

검증 의무:
- typecheck PASS (`pnpm typecheck` 또는 tw-framework-front 의 `tsc --noEmit`).
- build PASS (`pnpm build`).
- screenshot diff 검토 (D-2 결정 시).
- grep 후 DataTable export 사용처 0 확인 (P-1/P-4 폴더 제거 시).

---

## 9. 인용 출처

| 주장 | 근거 |
|------|------|
| N=1 페이지 사용 | `tw-framework-front/src/pages` 전체 grep — 1 hit (MyNotificationPage.tsx) |
| DataTable 7 파일 LOC | `wc -l` 결과 — 30 / 153 / 131 / 167 / 58 / 83 / 761 / 9 = 1,392 LOC |
| `ColumnInfo` shape 동일 | `grid-core/src/legacy/ColumnInfo.ts:40-59` ≡ `DataTable/data-table-types.ts:1-9` |
| `DataTablePagination` signature mismatch | monorepo `legacy/DataTablePagination.tsx:16-24` (`{table, totalCount}`) vs DataTable `data-table-pagination.tsx:8-11` (`{paging, listAction}`) |
| `RowActionInfo` / `ButtonInfo` / `AdditionalRowActionInfo` alias 부재 | monorepo `grid-core/src/legacy/index.ts` 17 lines — 5 alias + 1 hook + 1 type, RowAction/ButtonInfo 부재 |
| `apps/docs/docs/migration/dataTable-migration.md` 가이드 존재 | 보고서 §7.2 인용 (line 515-516) |
| 보고서 §7.2 = P0 | `refactor-analysis-2026-05-17.md:509-526` |
| 보고서 §1.5 = P2 | `refactor-analysis-2026-05-17.md:149-161` |
| 보고서 §13 #1 미수행 | `refactor-analysis-2026-05-17.md:721` "DataTable 의 페이지 import 인벤토리 — 시간 한계로 미수행" |
| MyNotificationPage import line | `pages/MyNotification/MyNotificationPage.tsx:16` |
| MyNotificationPage 사용 line | `pages/MyNotification/MyNotificationPage.tsx:455-469` |

---

**spec 종료**. 사용자 D-1 결정 후 별도 cycle 에서 implementer 위임.
