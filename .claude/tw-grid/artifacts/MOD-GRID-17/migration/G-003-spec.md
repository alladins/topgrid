# G-003 Spec: account/Cash*+기타 5 페이지 마이그레이션

**Goal**: MOD-GRID-17 / migration / G-003
**Priority**: P0 | **Migration Impact**: high | **Threshold**: 95
**Package Target**: `tw-framework-front` (사용처 마이그레이션 — `@tomis/grid-core` 코어 변경 없음)
**License Tier**: N/A (MIT 영역만 사용)

---

## ★ 사전 결정 표 (D# — Spec Writer 권위)

| D# | 결정 | 사유 | goals.json 영향 |
|----|------|------|----------------|
| D1 | 5 파일 모두 `import { Grid } from '@tomis/grid-core'` 로 통일. 5 파일 모두 로컬 `BaseGrid` (`'../../../components/tomis/Grid/BaseGrid'`) 만 사용 중이므로 `@tomis/grid-core/legacy` sub-entry 사용 없음 (G-002 동일 패턴). | 본 Goal 목표 = variant alias 제거 후 신규 `<Grid>` API 채택 (AC-004). | `affectedUsageFiles[5]` 그대로 유지. |
| D2 | `<Grid>` props 매핑 = `enableSort` + `enableFilter` + `loading` + `emptyText` + `onRowClick`(필요 사이트만) + `className`(필요 사이트만). 11 BaseGrid 호출 사이트 각각의 현 시그니처를 surgical 매핑. **`enablePagination` 미사용 + `rowSelection` 미사용** (5 파일 11 사이트 어느 곳도 사용 안 함 — 실측 Grep). | G-001/G-002 의 매핑 표준 그대로 따름. CashAdvanceSettle/Request 2 사이트는 className 사용, 나머지 9 사이트는 className 미사용. EtaxReceive L394 + Cash* 2 사이트만 onRowClick 사용, 나머지 8 사이트는 onRowClick 미사용. EtaxReceive L421 (모달) 만 `onRowClick={handleMapping}` 사용. | `bundleImpact.expected = "0 KB"` 유지. |
| D3 | 컬럼 정의는 **현 inline `ColumnDef<TData>[]` 유지** (createColumns 변환은 본 Goal 범위 외). `ColumnDef` import 는 5 파일 모두 `'../../../types/tomis/grid'` re-export 유지 (변경 X). | 본 Goal scope = "variant import → `<Grid>` 교체". `createColumns` 변환은 별도 후속 Goal. C-19 점진. G-001/G-002 동일 결정. | `implementFiles[5]` 그대로. |
| D4 | `affectedUsageFiles` = `implementFiles` = 5 페이지 (C-19 ≤5 준수). 11 BaseGrid 호출 사이트 = 5 파일 내부 (한 파일 내 다중 호출 — 1 파일 1 import 라인). NEW 0 + MODIFY 5 = 5 파일. 사이트 분포: CashAdvanceSettle 1 + CashAdvanceRequest 1 + InterestIncome 1 + Adjustment 6 + EtaxReceive 2 = 11. | 본 Goal 은 사용처 마이그레이션 전용 — 새 NEW 파일 0건, MODIFY 5건. | `affectedUsageFiles[5]` 일치. |
| D5 | Section 9 의존성 = "변경 없음". `@tomis/grid-core` workspace alias 는 `vite.config.ts` L18 + `tsconfig.app.json` L23 에서 이미 wiring 완료 (검증됨 — Grep 결과 실측 인용). | 신규 dep 추가 0건. C-22 peerDeps 영향 0. ADR-MOD-GRID-17-002 의무 (B-04 sub-rule) 충족. | `bundleImpact.package = "tw-framework-front"` 일치. |
| D6 | Section 2 의 `<Grid>` props interface 인용 = `grid-core/src/types.ts` `GridProps<TData>` 의 실제 정의. 사용처는 그 중 `data` / `columns` / `enableSort` / `enableFilter` / `onRowClick` / `loading` / `emptyText` / `className` 8 개 props 부분집합 사용 (사이트별 실제 사용 props 는 4~6 종). | C-1 Read-then-Write 준수 + spec authoritative. G-001 spec Section 2.1 의 11개 props 부분집합. | N/A |
| D7 | 페이지별 마이그레이션 액션 = `direct 교체` (5 페이지 모두 동일 액션, 한 파일 내 다중 호출 일괄 변환). 페이지별 PR 분리는 AC-005 (D-02) 별도 처리. 본 spec 의 implement Stage 는 단일 commit 으로 일괄 5 파일 변경 + verifier 가 외관/tsc 통합 검증. | 호환성 정책 D-02 (페이지 단위 PR). | N/A |
| D8 | 워크트리 경계 우회 — Implementer Agent 는 C-34 + ADR-MOD-GRID-17-001 의 PowerShell-via-Bash 우회 표준 절차 따른다. 출력 파일 (`.tsx`) UTF-8 BOM **미포함** 의무 (한글 메뉴/empty text 깨짐 방지). | 5 파일 모두 base repo (`tw-framework-front/`) 에 위치 → 워크트리 Edit/Write 도구가 boundary 차단. ADR-MOD-GRID-17-001 + C-34 cascading 적용. | N/A |
| D9 | 한국어 리터럴 매칭 시 `.ps1` 스크립트 파일 자체에 BOM (`0xEF 0xBB 0xBF`) **prepend 의무** (C-35 + ADR-MOD-GRID-17-004 cascade). 11 사이트 중 한국어 emptyText 다수 ("등록된 자료가 없습니다.", "조회된 자료가 없습니다.", "조회된 데이터가 없습니다.", "매핑 가능한 전표가 없습니다.") → 스크립트 BOM 누락 시 G-002 1차 `MISS` 패턴 재발. | C-35 + ADR-MOD-GRID-17-004 (G-002 self-review 작성). 출력 파일 BOM 금지(D8)와 정반대 방향 — 양방향 매트릭스 명시. | N/A |

**Verifier 자가-검산 (G-01 + E-06 cross-check)**: 합계 9 D# 결정. NEW 0 + MODIFY 5 = 총 5 파일. Section 7 표 5 행 + Section 11.1 표 5 행. breakdown(NEW 0 / MODIFY 5 / 파일 이름) 본문/AC/Section 7 모두 1:1 매칭. 11 BaseGrid 호출 사이트 분포: CashAdvanceSettle 1 + CashAdvanceRequest 1 + InterestIncome 1 + Adjustment 6 + EtaxReceive 2 = 11. Section 3 표 + Section 11.1 표에 11 사이트 모두 enumerate.

---

## Section 1. 참조 추적 (Reference Tracking)

### L0 — tw-framework-front 현 구현 (실측 Read + Grep 결과)

영향 사용처 5개 페이지의 grid 사용 패턴 (모두 실측 Read + Grep 완료). 11개 `<BaseGrid>` 호출 사이트 enumerate.

**L0-1: `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/CashAdvanceSettlePage.tsx`** (728 줄)
- L16: `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` — **local legacy import (마이그레이션 대상)**
- L17: `import type { ColumnDef } from '../../../types/tomis/grid';`
- L543-550 (전도금정산 목록 — 1 사이트):
  ```tsx
  <BaseGrid<SlipListItem>
    data={list}
    columns={columns}
    loading={isLoading}
    emptyText="등록된 자료가 없습니다."
    onRowClick={handleRowClick}
    className="w-full"
  />
  ```
- props 사용 (6 종): `data`, `columns`, `loading`, `emptyText`, `onRowClick`, `className`

**L0-2: `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/CashAdvanceRequestPage.tsx`** (728 줄)
- L16: `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` — **local legacy import**
- L17: `import type { ColumnDef } from '../../../types/tomis/grid';`
- L543-550 (전도금신청 목록 — 1 사이트):
  ```tsx
  <BaseGrid<SlipListItem>
    data={list}
    columns={columns}
    loading={isLoading}
    emptyText="등록된 자료가 없습니다."
    onRowClick={handleRowClick}
    className="w-full"
  />
  ```
- props 사용 (6 종): `data`, `columns`, `loading`, `emptyText`, `onRowClick`, `className`
- **L0-1 과 동일 구조 (BIZ_TYPE 만 C21 vs C20 차이)**

**L0-3: `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/InterestIncomePage.tsx`** (200 줄)
- L7: `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` — **local legacy import**
- L8: `import type { ColumnDef } from '../../../types/tomis/grid';`
- L177-182 (이자소득 세무신고 목록 — 1 사이트):
  ```tsx
  <BaseGrid<InterestIncomeItem>
    columns={columns}
    data={rows}
    loading={isLoading}
    emptyText="조회된 자료가 없습니다."
  />
  ```
- props 사용 (4 종 — `onRowClick` / `className` **미사용**): `columns`, `data`, `loading`, `emptyText`

**L0-4: `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/AdjustmentPage.tsx`** (865 줄)
- L14: `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` — **local legacy import**
- L15: `import type { ColumnDef } from '../../../types/tomis/grid';`
- L684-689 (매출액 조정 — 사이트 #1):
  ```tsx
  <BaseGrid<SalesRow>
    columns={SALES_COLUMNS}
    data={salesRows}
    loading={salesLoading}
    emptyText="등록된 자료가 없습니다."
  />
  ```
- L704-709 (자산대체 — 사이트 #2):
  ```tsx
  <BaseGrid<AssetRow>
    columns={ASSET_REPLACEMENT_COLUMNS}
    data={assetRows}
    loading={assetLoading}
    emptyText="등록된 자료가 없습니다."
  />
  ```
- L808-813 (감가상각비 계산 list — 사이트 #3, 조건부 렌더 `deprSubTab === 'list'`):
  ```tsx
  <BaseGrid<DeprRow>
    columns={DEPR_COLUMNS}
    data={deprRows}
    loading={deprLoading}
    emptyText="등록된 자료가 없습니다."
  />
  ```
- L815-820 (상각내역 총괄표 — 사이트 #4, 조건부 렌더 `deprSubTab === 'summary'`):
  ```tsx
  <BaseGrid<DeprSummaryRow>
    columns={DEPR_SUMMARY_COLUMNS}
    data={deprSummaryRows}
    loading={deprLoading}
    emptyText="등록된 자료가 없습니다."
  />
  ```
- L842-847 (기간비용 07 — 사이트 #5, 조건부 렌더 `bizFlag === '07'`):
  ```tsx
  <BaseGrid<PeriodRow07>
    columns={PERIOD_07_COLUMNS}
    data={periodRows07}
    loading={periodLoading}
    emptyText="등록된 자료가 없습니다."
  />
  ```
- L849-854 (기간비용 06 — 사이트 #6, 조건부 렌더 `bizFlag === '06'`):
  ```tsx
  <BaseGrid<PeriodRow06>
    columns={PERIOD_06_COLUMNS}
    data={periodRows06}
    loading={periodLoading}
    emptyText="등록된 자료가 없습니다."
  />
  ```
- props 사용 (4 종 — **6 사이트 모두 동일**): `columns`, `data`, `loading`, `emptyText` (`onRowClick` / `className` 미사용)
- **★ 본 페이지 6 사이트 = 본 Goal 11 사이트 중 최다 (탭별/조건부 렌더)**

**L0-5: `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/EtaxReceivePage.tsx`** (442 줄)
- L15: `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` — **local legacy import**
- L16: `import type { ColumnDef } from '../../../types/tomis/grid';`
- L394-400 (전자세금계산서 수신 내역 — 사이트 #1, 메인 그리드):
  ```tsx
  <BaseGrid<Vatx11ListItem>
    columns={columns}
    data={vatx11List}
    loading={isLoading}
    emptyText="조회된 데이터가 없습니다."
    onRowClick={handleRowSelect}
  />
  ```
- L421-427 (전표 매핑 모달 — 사이트 #2, 모달 내부 그리드):
  ```tsx
  <BaseGrid<SlipSearchItem>
    columns={slipColumns}
    data={slipSearchList}
    loading={isSlipSearchLoading}
    emptyText="매핑 가능한 전표가 없습니다."
    onRowClick={handleMapping}
  />
  ```
- props 사용: 2 사이트 모두 **5 종**: `columns`, `data`, `loading`, `emptyText`, `onRowClick` (`className` 미사용)
- **★ L421 사이트는 모달 내부 — 모달이 열리지 않으면 렌더 안 됨 (조건부 렌더 `showMappingModal`)**

**호출 사이트 합계: 11 (CashAdvanceSettle 1 + CashAdvanceRequest 1 + InterestIncome 1 + Adjustment 6 + EtaxReceive 2)**

### L1 — TanStack v8 API
- **N/A** (본 Goal 은 TanStack API 변경 없음 — grid-core wrapper 만 교체). 사용처는 `import type { ColumnDef } from '../../../types/tomis/grid'` 유지 (D3).

### L2 — 공통 컴포넌트 (`@tomis/grid-core`)

L2-1: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` L2 export:
```ts
export { Grid } from './Grid';
```
+ L23-34 legacy alias 5종 export 확인 (본 Goal 은 main `Grid` 만 사용 — `BaseGrid`/`VirtualGrid`/`ColumnPinGrid`/`GroupedHeaderGrid`/`TreeGrid` 5종 alias 미사용).

L2-2: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/Grid.tsx` (G-001 spec L2-2 동일):
```tsx
export const Grid = forwardRef(GridInner) as <TData>(
  props: GridProps<TData> & { ref?: Ref<GridHandle<TData>> },
) => ReactElement;
```

L2-3: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` `GridProps<TData>` (G-001/G-002 spec L2-3 동일 — 11개 props 부분 인용):
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

L2-4: 로컬 `BaseGrid` 컴포넌트 (`D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/BaseGrid.tsx`) — G-002 L2-4 검증 결과 재인용: 이 로컬 BaseGrid 가 내부에서 `useReactTable` + `getCoreRowModel` + `getSortedRowModel` + `getFilteredRowModel` + `getPaginationRowModel` 직접 호출. 즉, 본 Goal 의 5 페이지가 사용 중인 BaseGrid 는 **로컬 사본** (monorepo legacy alias 아님). 본 마이그레이션은 그 로컬 사본 호출을 monorepo `<Grid enableSort enableFilter>` 로 교체.

**G-001 spec L2-4 의 매핑 표(monorepo legacy alias `BaseGrid` 의 내부 매핑)는 본 Goal 의 surgical 변환 청사진 동일 적용** (G-002 와 동일). 로컬 BaseGrid 도 같은 매핑 의도(sort/filter/pagination 활성화)로 작성된 동치 wrapper.

### L3 — 영향 사용처 카운트 = **5 파일** (5/5, C-19 준수)

`canonical-modules.json` MOD-GRID-17 affectedUsageFiles 중 account/Cash\* + InterestIncome + Adjustment + EtaxReceive 5건. 정확한 경로 5개 (Section 8.1 동일).

### R-A / R-W — N/A
- 본 Goal 은 신규 API 설계가 아닌 **사용처 마이그레이션** — AG Grid / Wijmo 동등 기능 참조 불필요.

---

## Section 2. API 계약 (TypeScript Interface)

본 Goal 은 신규 API 정의가 없음 — `@tomis/grid-core` 의 기존 `GridProps<TData>` 를 사용처에서 호출만 한다.

### 2.1 호출할 인터페이스 (`grid-core/src/types.ts` 실측 인용 — G-001/G-002 spec L2-3 동일)

본 Goal 의 5 페이지에서 사용할 `GridProps<TData>` 의 8개 props 부분집합 (D6):

```ts
export interface GridProps<TData> {
  // ─── 필수 ───
  data: TData[];                                        // required
  columns: ColumnDef<TData, unknown>[];                 // required

  // ─── enable* 토글 (본 Goal: 11 사이트 모두 활성) ───
  enableSort?: boolean;                                 // default false → 본 Goal: true (전 사이트)
  enableFilter?: boolean;                               // default false → 본 Goal: true (전 사이트)

  // ─── 이벤트 (본 Goal: 4 사이트 사용) ───
  onRowClick?: (row: TData, event: MouseEvent<HTMLTableRowElement>) => void;
  // CashAdvanceSettle L543, CashAdvanceRequest L543, EtaxReceive L394, EtaxReceive L421

  // ─── 표시 ───
  emptyText?: string;                                   // 11 사이트 모두 명시
  loading?: boolean;                                    // 11 사이트 모두 명시
  className?: string;                                   // 2 사이트만 (CashAdvanceSettle L543, CashAdvanceRequest L543)
}
```

**미사용 props (본 Goal 의 5 파일):**
- `enablePagination`: 미사용 (11 사이트 어느 곳도 pagination prop 사용 안 함 — 실측 Grep)
- `rowSelection`: 미사용 (11 사이트 어느 곳도 rowSelection prop 사용 안 함 — 실측 Grep)
- `pagination`: 미사용
- 기타 30+ optional props: default 유지

**사이트별 props 사용 매트릭스 (11 사이트 × 8 props):**

| 사이트 | data | columns | loading | emptyText | onRowClick | className | enableSort | enableFilter |
|--------|------|---------|---------|-----------|------------|-----------|------------|--------------|
| CashAdvanceSettle L543 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | → 추가 | → 추가 |
| CashAdvanceRequest L543 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | → 추가 | → 추가 |
| InterestIncome L177 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | → 추가 | → 추가 |
| Adjustment L684 (sales) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | → 추가 | → 추가 |
| Adjustment L704 (asset) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | → 추가 | → 추가 |
| Adjustment L808 (depr-list) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | → 추가 | → 추가 |
| Adjustment L815 (depr-summary) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | → 추가 | → 추가 |
| Adjustment L842 (period-07) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | → 추가 | → 추가 |
| Adjustment L849 (period-06) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | → 추가 | → 추가 |
| EtaxReceive L394 (main) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | → 추가 | → 추가 |
| EtaxReceive L421 (modal) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | → 추가 | → 추가 |

### 2.2 export 경로 (D6 + L2-1)

```ts
// 사용처 마이그레이션 최종 import 라인 (5 파일 모두 동일):
import { Grid } from '@tomis/grid-core';
import type { ColumnDef } from '../../../types/tomis/grid';
// (D3: ColumnDef import 경로는 변경하지 않음 — local re-export 유지)
```

### 2.3 사용 예시 코드 (최소 2개 — 본 Goal 의 실측 시나리오)

**예시 1 (onRowClick + className 사용 — CashAdvanceSettle/Request 패턴, 2 사이트 공통):**
```tsx
import { Grid } from '@tomis/grid-core';
import type { ColumnDef } from '../../../types/tomis/grid';

<Grid<SlipListItem>
  data={list}
  columns={columns}
  enableSort
  enableFilter
  loading={isLoading}
  emptyText="등록된 자료가 없습니다."
  onRowClick={handleRowClick}
  className="w-full"
/>
```

**예시 2 (props 최소 패턴 — Adjustment 6 사이트 + InterestIncome 1 사이트 공통):**
```tsx
import { Grid } from '@tomis/grid-core';
import type { ColumnDef } from '../../../types/tomis/grid';

<Grid<SalesRow>
  columns={SALES_COLUMNS}
  data={salesRows}
  enableSort
  enableFilter
  loading={salesLoading}
  emptyText="등록된 자료가 없습니다."
/>
```

**예시 3 (onRowClick 사용, className 미사용 — EtaxReceive 2 사이트 공통):**
```tsx
import { Grid } from '@tomis/grid-core';
import type { ColumnDef } from '../../../types/tomis/grid';

<Grid<Vatx11ListItem>
  columns={columns}
  data={vatx11List}
  enableSort
  enableFilter
  loading={isLoading}
  emptyText="조회된 데이터가 없습니다."
  onRowClick={handleRowSelect}
/>
```

### 2.4 기본값 / optional 명시
- `data`, `columns` = **required** (위 두 props 만 필수, 11 사이트 모두 명시됨)
- 그 외 6 종 props (`enableSort`, `enableFilter`, `loading`, `emptyText`, `onRowClick`, `className`) 는 모두 **optional** — 미사용 = TanStack 기본 동작
- `emptyText` default `'데이터가 없습니다.'` (Grid.tsx `DEFAULT_EMPTY_TEXT`)
- `enableSort` default false → 본 Goal 은 모든 11 사이트에서 `enableSort` boolean attribute 형태로 활성화 (이전 로컬 BaseGrid 가 내부적으로 항상 sort 활성)

### 2.5 ref API — N/A (B-05)
본 Goal 의 5 페이지 어느 곳도 `gridRef` 사용 없음 (Read 결과 confirmed — 5 파일 전체 라인 `gridRef`/`useRef` 사용처는 InitialLoaded ref (CashAdvanceSettle L164, CashAdvanceRequest L164) 만 존재하며 BaseGrid 와 무관). `GridHandle<TData>` 미사용. B-05 = N/A.

---

## Section 3. 기존 사용처 대응표 ⭐ (tw-grid 특화)

| 페이지 | 기존 import / 사용 패턴 (라인) | 신규 API 대응 | 마이그레이션 액션 |
|--------|------------------------------|-------------|------------------|
| **CashAdvanceSettlePage.tsx** | L16 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';`<br>L543-550 `<BaseGrid<SlipListItem> data columns loading emptyText onRowClick className />` | `import { Grid } from '@tomis/grid-core';`<br>L543 → `<Grid<SlipListItem> data columns enableSort enableFilter loading emptyText onRowClick className />` | **direct 교체** (import 1 라인 + 1 JSX 사이트) |
| **CashAdvanceRequestPage.tsx** | L16 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';`<br>L543-550 `<BaseGrid<SlipListItem> data columns loading emptyText onRowClick className />` | `import { Grid } from '@tomis/grid-core';`<br>L543 → `<Grid<SlipListItem> data columns enableSort enableFilter loading emptyText onRowClick className />` | **direct 교체** (import 1 라인 + 1 JSX 사이트) |
| **InterestIncomePage.tsx** | L7 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';`<br>L177-182 `<BaseGrid<InterestIncomeItem> columns data loading emptyText />` (onRowClick/className 미사용) | `import { Grid } from '@tomis/grid-core';`<br>L177 → `<Grid<InterestIncomeItem> columns data enableSort enableFilter loading emptyText />` | **direct 교체** (import 1 라인 + 1 JSX 사이트) |
| **AdjustmentPage.tsx** | L14 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';`<br>L684 `<BaseGrid<SalesRow>` (sales 탭)<br>L704 `<BaseGrid<AssetRow>` (replacement 탭)<br>L808 `<BaseGrid<DeprRow>` (depreciation list 서브탭)<br>L815 `<BaseGrid<DeprSummaryRow>` (depreciation summary 서브탭)<br>L842 `<BaseGrid<PeriodRow07>` (period bizFlag=07)<br>L849 `<BaseGrid<PeriodRow06>` (period bizFlag=06)<br>**모두 columns/data/loading/emptyText 4 종 props** (onRowClick/className 미사용) | `import { Grid } from '@tomis/grid-core';`<br>6 사이트 모두 `<Grid<T> columns data enableSort enableFilter loading emptyText />` (×6) | **direct 교체** (import 1 라인 + 6 JSX 사이트 동기) |
| **EtaxReceivePage.tsx** | L15 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';`<br>L394-400 `<BaseGrid<Vatx11ListItem> columns data loading emptyText onRowClick />` (메인)<br>L421-427 `<BaseGrid<SlipSearchItem> columns data loading emptyText onRowClick />` (모달 — `showMappingModal` 조건부 렌더) | `import { Grid } from '@tomis/grid-core';`<br>L394 → `<Grid<Vatx11ListItem> columns data enableSort enableFilter loading emptyText onRowClick />`<br>L421 → `<Grid<SlipSearchItem> columns data enableSort enableFilter loading emptyText onRowClick />` | **direct 교체** (import 1 라인 + 2 JSX 사이트 동기) |

**5/5 행 모두 작성. C-19 ≤5 준수**. 11 BaseGrid 호출 사이트 모두 enumerate (5 파일 합계). 외관 100% 보존 — 로컬 BaseGrid 의 내부 `useReactTable` + `getSortedRowModel` + `getFilteredRowModel` 가 새 `<Grid enableSort enableFilter>` 의 내부 호출과 동치 (G-002 L2-4 검증 재인용).

---

## Section 4. 호환성 정책

### 4.1 Breaking change
- **`breaking: false`** (goals.json 동일 패턴 G-001/G-002 따름)
- 로컬 `BaseGrid` 컴포넌트 (`src/components/tomis/Grid/BaseGrid.tsx`) 자체는 **본 Goal 에서 제거하지 않음**. 다른 페이지가 아직 사용 중일 가능성 — 5 페이지에서만 import 제거.
- `@tomis/grid-core` 의 `Grid` export 는 안정 (MOD-GRID-01 G-001 ~ G-005 완료).

### 4.2 Deprecation 전략 (C-6 + C-23)
- 로컬 `BaseGrid` 는 **1 minor 버전 유지** (다른 페이지들이 점진 마이그레이션 후 제거 검토).
- 본 Goal 후속 효과: 5 페이지에서 import 제거 완료 → 로컬 BaseGrid 호출처 감소 (G-001 5 + G-002 5 + G-003 5 = 누적 15 페이지 마이그레이션 완료) → 다음 마이그레이션 모듈(G-004~G-006)이 완료되면 로컬 BaseGrid 자체 제거 검토 가능.

### 4.3 영향 사용처 마이그레이션 경로 (3 단계 — Section 11.3 와 동기)
1. **단계 1**: import 라인 교체 — 5 파일 각각 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` 제거, `import { Grid } from '@tomis/grid-core';` 추가.
2. **단계 2**: JSX 호출 사이트 교체 — 5 파일 내 11 사이트 모두 `<BaseGrid<T>` → `<Grid<T> enableSort enableFilter`. (한 파일 내 다중 사이트 동시 변환 필수 — Adjustment 6 사이트 + EtaxReceive 2 사이트)
3. **단계 3**: `npx tsc --noEmit` 0 errors 확인 → 외관 회귀 검증 (C-17).

### 4.4 console warning 정책 (AC-003 + C-23)
- 로컬 `BaseGrid` 는 `useDeprecationWarn` 호출 없음 (G-002 L2-4 검증). 본 Goal 완료 후에도 console warning 영향 없음.
- `Grid` 자체는 deprecation warning 미발생.

### 4.5 peerDependencies 정책 (C-22)
- `@tomis/grid-core` 가 `react`, `react-dom`, `@tanstack/react-table` 을 peer 로 선언 — 사용처 `tw-framework-front` 는 이미 이 셋을 deps 로 보유 (G-001 spec Section 4.5 검증 완료). 추가 작업 없음.

---

## Section 5. 인수 기준 (Acceptance Criteria with Source Tags)

5개 AC 모두 출처 태그 + binary 검증 가능. migrationImpact: **high** 표시.

| AC ID | 기준 | 출처 | binary 검증 방법 | migrationImpact |
|-------|------|------|------------------|-----------------|
| AC-001 | 5 페이지 tsc 0 errors | **L0 + C-12** | `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx tsc --noEmit` 명령 실행 → exit 0 + stderr 빈 결과 | high |
| AC-002 | 외관 보존 — 동일 데이터 입력 시 마이그레이션 전후 시각 동일 (11 사이트 모두) | **L0 + L2 + C-17** | (a) 로컬 BaseGrid 가 내부에서 `useReactTable + getSortedRowModel + getFilteredRowModel + getPaginationRowModel + flexRender` 호출하며 같은 thead/tbody markup 생성 (L2-4 BaseGrid.tsx 확인) — monorepo `<Grid enableSort enableFilter>` 와 markup 동일 / (b) 5 페이지 각각 동일 데이터 fixture 로 마이그레이션 전후 스크린샷 캡처 후 픽셀 비교 (cell padding / row height / sort icon / hover bg / thead bg / 탭 전환 시 grid 외관 / 모달 내부 grid 외관) | high |
| AC-003 | console warning 0 건 | **C-23** | 5 페이지 dev mode 렌더 → `console.warn` 인터셉트 시 deprecated 경고 0건 (로컬 BaseGrid 는 useDeprecationWarn 호출 안 함이 G-002 에서 확인됨) | high |
| AC-004 | variant direct import 0 건 (로컬 `BaseGrid` 경로) | **L0 + L2 + C-6** | `grep -nE "from ['\"](\\.\\./)+components/tomis/Grid/BaseGrid['\"]" tw-framework-front/src/pages/tomis/account/CashAdvanceSettlePage.tsx CashAdvanceRequestPage.tsx InterestIncomePage.tsx AdjustmentPage.tsx EtaxReceivePage.tsx` → 0 hits. 또한 `grep -n "<BaseGrid"` → 0 hits (5 파일). | high |
| AC-005 | 페이지 단위 PR 분리 (D-02) — 5 페이지 1 PR 또는 페이지별 commit ≥ 5 | **C-19** | git log --oneline 또는 PR description 에 5 페이지 enumerate. 단일 commit 으로 5 파일 변경도 허용. | high |

**AC source 태그 검증 (H-03 만족)**:
- L0 → Section 1 L0-1~L0-5 에서 실제 인용됨 (11 사이트 라인 인용)
- L2 → Section 1 L2-1~L2-4 에서 실제 인용됨
- C-12 → constraints.md C-12 (`npx tsc --noEmit` 0 errors 의무)
- C-17 → constraints.md C-17 (시각 회귀 검증 의무 — high impact)
- C-23 → constraints.md C-23 (semver — deprecated API 1 minor 유지)
- C-6 → constraints.md C-6 (호환성 절대)
- C-19 → constraints.md C-19 (점진 ≤5/Goal)

---

## Section 6. 엣지 케이스 (3개 이상)

본 Goal 의 실측 페이지 분석 기반 엣지 케이스 (추측 금지 — 실제 Read 결과로 식별):

**EC-01: 한 파일 내 다중 `<BaseGrid>` 사이트 — 동기 교체 필요 (Adjustment 6 + EtaxReceive 2)**
- 출처: L0-4 (Adjustment 6 사이트 L684 + L704 + L808 + L815 + L842 + L849), L0-5 (EtaxReceive 2 사이트 L394 + L421).
- 위험: implementer 가 한 사이트만 교체 → tsc 통과하나 AC-004 NO (variant import 잔존 — import 라인은 1 개여도 `<BaseGrid>` JSX 가 남으면 미정의 reference). 또는 한 사이트만 교체하면서 import 도 제거하면 tsc fail (`<BaseGrid>` 미정의).
- 처리: Section 11.1 표에 11 사이트 모두 라인 enumerate. PowerShell 우회 시 `[IO.File]::ReadAllText` 후 `Replace` 또는 정규식으로 모든 `<BaseGrid<` 일괄 교체. AC-004 grep 으로 0 hits 검증.

**EC-02: `onRowClick` / `className` props 사이트별 혼재 — props 매핑 surgical 보존 (G-002 EC-02 cascade)**
- 출처: 11 사이트 props 사용 매트릭스 (Section 2.1 표) — CashAdvanceSettle/Request 2 사이트는 `onRowClick + className` 모두, EtaxReceive 2 사이트는 `onRowClick` 만, Adjustment 6 사이트 + InterestIncome 1 사이트는 둘 다 미사용.
- 위험: implementer 가 일괄 `onRowClick={handle...}` 또는 `className="w-full"` 추가 → 미정의 식별자 사용으로 tsc 실패 또는 외관 회귀 (className 추가 시 width 변동).
- 처리: Section 3 표 + Section 11.1 표에서 `onRowClick` / `className` 유무를 사이트별로 명시. PowerShell 우회 시 each-site 다른 replace string 사용 또는 line-by-line surgical 변환. **CashAdvanceSettle/Request 의 className 보존**, **Adjustment 6 사이트는 props 추가 금지** (현 4 종 props 만 유지 + `enableSort enableFilter` 만 추가).

**EC-03: ColumnDef import 경로 — 5 파일 모두 `../../../types/tomis/grid` re-export 사용 (G-001/G-002 EC-03 cascade)**
- 출처: L0-1 L17, L0-2 L17, L0-3 L8, L0-4 L15, L0-5 L16 모두 동일.
- 위험: D3 결정으로 사용처에서 `ColumnDef` import 를 `@tanstack/react-table` 로 바꾸려 할 때 — 5 파일 모두 일관 적용 또는 어느 하나만 — drift 발생 가능.
- 처리: D3 결정 = "본 Goal 범위 외 — 현 import 경로 유지". `<BaseGrid>` → `<Grid>` 만 surgical 교체. `ColumnDef` import 는 변경하지 않는다. types/tomis/grid.ts 의 `ColumnDef` re-export 가 `@tanstack/react-table` 의 `ColumnDef<TData>` 와 동일 type alias 이므로 tsc 통과 예상 (G-001/G-002 spec EC-03 검증 결과 재인용).

**EC-04: 워크트리 경계 — 5 파일 모두 base repo 위치 → PowerShell-via-Bash 우회 필수 (C-34 + ADR-MOD-GRID-17-001)**
- 출처: 5 파일 모두 `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/` (base repo) — 워크트리 외부.
- 위험: 1차 Implementer (G-001 사례) 가 Edit/Write 도구 boundary 차단 발견 후 즉시 "진행 불가" escalate → 1 round-trip 낭비.
- 처리: D8 결정 + C-34 + ADR-MOD-GRID-17-001 의 PowerShell-via-Bash 우회 표준 절차 따른다. `[IO.File]::ReadAllText` + `Replace` + `[IO.File]::WriteAllBytes` + `UTF8Encoding($false)` (BOM 미포함). 한글 메뉴 텍스트 / `emptyText` ("등록된 자료가 없습니다.", "조회된 자료가 없습니다.", "조회된 데이터가 없습니다.", "매핑 가능한 전표가 없습니다.") 깨짐 검증 의무.

**EC-05: 빈 데이터 / 로딩 상태 — `loading` + `emptyText` 시각 회귀**
- 출처: 11 사이트 모두 `loading` + `emptyText` props 사용.
- 위험: 로컬 BaseGrid 의 loading skeleton 스타일과 monorepo Grid 의 loading skeleton 스타일이 외관 회귀 가능 (cell padding, skeleton row 색상).
- 처리: AC-002 시각 회귀 검증 — 각 페이지 빈 데이터 상태(`isLoading=true` + `data=[]`)에서 스크린샷 비교. 차이 발견 시 spec re-spec 또는 별도 Goal 분리.

**EC-06: Adjustment 페이지 — 탭 전환 + 서브탭 + bizFlag 조건부 렌더 시 6 grid 동시 변환 검증**
- 출처: L0-4 — 매출액(L684) / 자산대체(L704) / 감가상각 list(L808, deprSubTab='list') / 감가상각 summary(L815, deprSubTab='summary') / 기간비용 07(L842, bizFlag='07') / 기간비용 06(L849, bizFlag='06') — **조건부 렌더로 4 가지 활성 grid 상태 존재** (sales / replacement / depreciation-list / depreciation-summary / period-07 / period-06).
- 위험: implementer 가 한 탭 grid 만 교체 후 다른 탭 grid 누락 → AC-004 NO (`<BaseGrid>` JSX 잔존) 또는 tsc 통과해도 다른 탭 진입 시 런타임 오류.
- 처리: Section 11.1 표에 6 사이트 모두 라인 enumerate. PowerShell 우회 시 정규식 `<BaseGrid<` → `<Grid<` + props 라인 정규식 추가 `\bemptyText="등록된 자료가 없습니다\."\s*/>` 같이 6 사이트 패턴 일괄 매칭. AC-002 시각 회귀 시 4 탭 모두 진입 검증 의무.

**EC-07: EtaxReceive 모달 그리드 (L421) — `showMappingModal` 조건부 렌더 + 외관 검증 시 모달 트리거 필요**
- 출처: L0-5 — L394 메인 그리드 + L421 모달 내부 그리드 (`showMappingModal={true}` 상태에서만 렌더). 모달 트리거: 메인 그리드 행 선택 → "전표매핑" 버튼 클릭 → `handleOpenMappingModal` → `setShowMappingModal(true)`.
- 위험: implementer 가 메인 그리드만 외관 검증 후 모달 그리드 누락 → 시각 회귀 발견 지연. 또한 모달 컨텍스트(`bg-white rounded-lg shadow-xl` + `max-h-3/4 flex flex-col`)에서 sticky thead 동작 가능성 문제.
- 처리: AC-002 시각 회귀 검증 시 EtaxReceive 페이지에서 행 선택 → 전표매핑 모달 진입 → 모달 grid 외관 확인 의무. 로컬 BaseGrid 도 동일 마크업이므로 회귀 확률 낮음.

**EC-08: 한국어 emptyText 매칭 — `.ps1` 스크립트 BOM 의무 (C-35 + ADR-MOD-GRID-17-004 cascade)**
- 출처: 11 사이트의 emptyText 한국어 리터럴 4 종 (L0-1~L0-5 인용):
  - "등록된 자료가 없습니다." — CashAdvanceSettle L547, CashAdvanceRequest L547, Adjustment L688/L708/L812/L819/L846/L853 (8 사이트)
  - "조회된 자료가 없습니다." — InterestIncome L181 (1 사이트)
  - "조회된 데이터가 없습니다." — EtaxReceive L398 (1 사이트)
  - "매핑 가능한 전표가 없습니다." — EtaxReceive L425 (1 사이트)
- 위험: G-002 1차 시도 `MISS` 패턴 — `.ps1` 스크립트가 BOM 없이 CP949 디코드 → UTF-8 인코딩된 `.tsx` 와 바이트 불일치 → 매칭 실패.
- 처리: D9 결정 + C-35 + ADR-MOD-GRID-17-004 — `.ps1` 스크립트 파일 BOM (`0xEF 0xBB 0xBF`) prepend 의무. **출력 파일 (`.tsx`) BOM 금지** (C-34 + D8). 두 방향 양립 명시 (스크립트 = BOM 필요, 출력 = BOM 금지).

---

## Section 7. 구현 대상 파일 (NEW / MODIFY) — 최종 implementFiles 표

**NEW: 없음.**
**MODIFY: 5 파일 (모두 사용처 페이지 — base repo).**

| # | 파일 (절대 경로) | 액션 | 변경 라인 (실측 기반) | 변경 내용 |
|---|-----------------|------|----------------------|----------|
| 1 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/CashAdvanceSettlePage.tsx` | MODIFY | L16 (import) + L543 (JSX 1 사이트) | local `BaseGrid` import 제거 + `Grid` import 추가; `<BaseGrid<SlipListItem>` → `<Grid<SlipListItem> enableSort enableFilter` (data/columns/loading/emptyText/onRowClick/className 모두 유지) |
| 2 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/CashAdvanceRequestPage.tsx` | MODIFY | L16 (import) + L543 (JSX 1 사이트) | local `BaseGrid` import 제거 + `Grid` import 추가; `<BaseGrid<SlipListItem>` → `<Grid<SlipListItem> enableSort enableFilter` (L0-1 동일 패턴) |
| 3 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/InterestIncomePage.tsx` | MODIFY | L7 (import) + L177 (JSX 1 사이트) | local `BaseGrid` import 제거 + `Grid` import 추가; `<BaseGrid<InterestIncomeItem>` → `<Grid<InterestIncomeItem> enableSort enableFilter` (columns/data/loading/emptyText 4 종, onRowClick/className 미사용 유지) |
| 4 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/AdjustmentPage.tsx` | MODIFY | L14 (import) + L684 + L704 + L808 + L815 + L842 + L849 (JSX 6 사이트) | local `BaseGrid` import 제거 + `Grid` import 추가; 6 사이트 모두 `<BaseGrid<T>` → `<Grid<T> enableSort enableFilter` (4 종 props 모두 유지, onRowClick/className 추가 금지) |
| 5 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/EtaxReceivePage.tsx` | MODIFY | L15 (import) + L394 + L421 (JSX 2 사이트) | local `BaseGrid` import 제거 + `Grid` import 추가; 2 사이트 모두 `<BaseGrid<T>` → `<Grid<T> enableSort enableFilter` (5 종 props 유지 — onRowClick 보존, className 미사용) |

**합계: NEW 0 + MODIFY 5 = 5 파일** (D4 breakdown 일치).
**JSX 호출 사이트 합계: 11 (CashAdvanceSettle 1 + CashAdvanceRequest 1 + InterestIncome 1 + Adjustment 6 + EtaxReceive 2)**.
**변경 hunk 합계: import 5 + JSX 11 = 16 변경 라인 (대략 — JSX 라인은 multi-line 호출이므로 hunk 단위는 약 22~28 라인).**

**H-02 경로 합리성 검증**: 모든 5 파일 부모 디렉토리(`.../tw-framework-front/src/pages/tomis/account/`) 실재 — 실제 Read 도구로 5 파일 모두 라인 카운트 + 발췌 성공함 (CashAdvanceSettle 728줄, CashAdvanceRequest 728줄, InterestIncome 200줄, Adjustment 865줄, EtaxReceive 442줄). 프로젝트 컨벤션(`tw-framework-front/src/pages/tomis/{도메인}/{모듈}Page.tsx`) 일치 (CLAUDE.md "프론트엔드 디렉토리 원칙").

---

## Section 8. 마이그레이션 영향도 Preflight ⭐

### 8.1 영향 사용처 카운트: **5/5** (1 Goal ≤ 5 — C-19 준수)

5 파일 전체 경로:
1. `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/CashAdvanceSettlePage.tsx`
2. `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/CashAdvanceRequestPage.tsx`
3. `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/InterestIncomePage.tsx`
4. `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/AdjustmentPage.tsx`
5. `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/EtaxReceivePage.tsx`

### 8.2 무파괴 검증 방법
- **빌드 검증 (자동)**: `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx tsc --noEmit` → exit 0
- **추가 검증 (자동)**: `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx vite build` → 빌드 성공
- **외관 보존 (수동 — Chromatic 미도입 환경)**: 5 페이지 각각 dev server (`npm run dev`) 에서 동일 데이터 fixture 로 마이그레이션 전/후 스크린샷 캡처 후 픽셀 비교. 확인 대상: cell padding(`px-4 py-3`), row height, sort glyph(▲/▼/⇅), thead bg-gray-50, hover bg-gray-50, sticky thead 동작, loading skeleton, emptyText 메시지, **Adjustment 4 탭 + 서브탭 + bizFlag 조건부 렌더 모두 확인**, **EtaxReceive 모달 grid 외관 확인**.
- **외관 동등성 근거 (이론적)**: 로컬 BaseGrid 가 내부에서 `useReactTable + getCoreRowModel + getSortedRowModel + getFilteredRowModel + getPaginationRowModel + flexRender` 호출 → monorepo `<Grid enableSort enableFilter>` 와 같은 TanStack 표준 API 출력 동치 (G-002 L2-4 검증 재인용).

### 8.3 점진 마이그레이션 vs 일괄 전환
- 본 Goal = **일괄 5 페이지 전환** (C-19 ≤5 충족). 다른 사용처 (account/AdminSlip*, hr/*, payroll/* 등 잔여 페이지)는 G-004~G-006 별도 Goal 에서 처리.

### 8.4 롤백 전략
- 로컬 `BaseGrid` 컴포넌트 자체가 보존됨 (`src/components/tomis/Grid/BaseGrid.tsx` 삭제 X) — 사용처에서 즉시 되돌릴 수 있음.
- **롤백 방법 1**: `git revert <commit-sha>` — 단일 commit 변경이므로 surgical 롤백 가능.
- **롤백 방법 2 (BaseGrid 재도입)**: 각 페이지에서 import 라인 복원 + JSX `<Grid enableSort enableFilter ...>` → `<BaseGrid ...>` 로 surgical 되돌리기.

### 8.5 번들 크기 영향
- **0 KB** (C-21 충족). 사용처 마이그레이션 — 새 의존성 추가 0. `@tomis/grid-core` 는 이미 (G-001/G-002 으로) tw-framework-front 의 10 페이지에서 import 됨 → 본 Goal 추가 5 페이지는 트리쉐이킹 영향 없음.
- 로컬 `BaseGrid.tsx` 자체는 본 Goal 에서 삭제하지 않음 (다른 페이지 사용 가능성) → 번들 변동 0.

### 8.6 alias 해결 경로 (B-04 의무 — 사용처 마이그레이션 Goal)

`@tomis/grid-core` import 의 해결 경로 (실측 Grep 결과 — Bash + Grep 도구 사용):

1. **vite.config.ts alias** (`D:/project/topvel_project/TOMIS/tw-framework-front/vite.config.ts` L18):
   ```ts
   '@tomis/grid-core': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-core/src'),
   ```
2. **tsconfig.app.json paths** (`D:/project/topvel_project/TOMIS/tw-framework-front/tsconfig.app.json` L23-24):
   ```json
   "@tomis/grid-core": ["../../topvel-grid-monorepo/packages/grid-core/src"],
   "@tomis/grid-core/legacy": ["../../topvel-grid-monorepo/packages/grid-core/src/legacy"],
   ```
   (L24 legacy sub-entry는 본 Goal 미사용 — D1)
3. **alias source target**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` L2 의 `export { Grid } from './Grid';`

**검증 방법**: `npx tsc --noEmit` 통과 시 tsconfig paths 정상 resolution 입증. `vite build` 통과 시 vite alias 정상 resolution 입증. ADR-MOD-GRID-17-002 의무 충족 (B-04 sub-rule).

### 8.7 base repo 여부 (A-04 의무) + 워크트리 경계 우회 + 스크립트 BOM 매트릭스

- **5 파일 모두 `tw-framework-front/` (base repo, gitignored)** — 워크트리(`D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/`) 외부.
- 워크트리 Edit/Write 도구가 base repo 변경에 대해 boundary 차단 가능 (`"This background session hasn't isolated its changes yet"`).
- **C-34 + ADR-MOD-GRID-17-001 PowerShell-via-Bash 우회 적용 의무** — D8 결정 + EC-04 처리 참조.
- **C-35 + ADR-MOD-GRID-17-004 `.ps1` 스크립트 BOM 적용 의무** — D9 결정 + EC-08 처리 참조.
- artifacts metadata (워크트리 내부 `.claude/tw-grid/artifacts/MOD-GRID-17/migration/G-003-*`) 은 정상 Edit/Write 도구 사용.

**BOM 방향 매트릭스 (양방향 명시 — C-35 cascade)**:

| 파일 종류 | BOM 방향 | 근거 |
|----------|---------|------|
| `.ps1` 스크립트 자체 | **BOM 필요** (`0xEF 0xBB 0xBF` prepend) | PowerShell 5.x 파서 인코딩 인식 (C-35) |
| 출력 `.tsx` 파일 | **BOM 금지** (`UTF8Encoding($false)`) | C-34 + MEMORY.md #32 한글 깨짐 차단 + 빌드 도구 호환 |

스크립트 BOM 누락 시 → G-002 1차 `MISS` 패턴 재발 (CP949 디코드 vs UTF-8 바이트 불일치). 출력 BOM 포함 시 → 빌드 도구 syntax error 또는 한글 깨짐.

---

## Section 9. 의존성 (peerDeps / deps / devDeps)

- **신규 추가 의존성: 없음.**
- `@tomis/grid-core` workspace alias 는 다음 위치에 이미 wiring 완료 (8.6 인용):
  - `vite.config.ts` L18
  - `tsconfig.app.json` L23
- `react`, `react-dom`, `@tanstack/react-table` peer dependencies 는 `tw-framework-front` 의 package.json 에서 이미 보유 (G-001 spec Section 9 검증 완료).
- `@tomis/grid-core` 의 package.json `main`/`exports` 는 monorepo MOD-GRID-00 G-001 에서 wiring 완료 (`packages/grid-core/src/index.ts` export L2 `Grid` 검증됨).

---

## Section 10. 사용자 여정 매핑

### 10.1 개발자 관점 (5 단계)
1. **식별**: 5 페이지의 grid 사용 라인 확인 (실제 Section 1 L0-1~L0-5 + 11 사이트 라인 명시 완료).
2. **import 라인 교체**: 5 파일 각각 local `BaseGrid` import 제거, `import { Grid } from '@tomis/grid-core';` 추가.
3. **JSX 호출 교체**: 11 사이트 모두 `<BaseGrid<T>` → `<Grid<T> enableSort enableFilter` (한 파일 내 다중 사이트 동시 변환 — Adjustment 6 + EtaxReceive 2). PowerShell 우회로 일괄 처리 + `.ps1` 스크립트 BOM prepend.
4. **tsc 통과 확인**: `cd tw-framework-front && npx tsc --noEmit` → 0 errors.
5. **외관 보존 확인**: dev server 렌더 + 5 페이지 스크린샷 비교. **Adjustment 4 탭 + EtaxReceive 모달 모두 확인 의무**.

### 10.2 최종 사용자 관점 (외관 동등)
- **rows/columns 표시**: 100% 동일 (로컬 BaseGrid 와 monorepo Grid 모두 TanStack v8 표준 API 사용 — DOM 출력 동치).
- **인터랙션**: 클릭(onRowClick — 4 사이트: CashAdvanceSettle/Request + EtaxReceive 2개) 동작 동일. 소트(enableSort — 11 사이트 모두 활성) 동일. 필터(enableFilter — 11 사이트 모두 활성) 동일.
- **빈 상태**: `emptyText` 그대로 (11 사이트 모두 자체 한국어 메시지 명시 — BOM 매트릭스로 깨짐 차단).
- **로딩 skeleton**: `loading={true}` 시 skeleton row 표시 (BaseGrid 와 동일).
- **응답 시간**: 동일 컴포넌트 호출이므로 ±0%.
- **탭 전환 / 모달 진입**: Adjustment 4 탭(매출액/자산대체/감가상각[list+summary]/기간비용[07+06]) + EtaxReceive 모달 → 모든 조건부 렌더 grid 외관 동일.

---

## Section 11. 구현 계획

### 11.1 파일별 변경 명세 (Section 7 표을 11 단계 sampling 한 결과 — E-01 cross-check)

| 파일 | 액션 | Step 1 (import) | Step 2 (JSX 사이트) | 영향 받는 컬럼/props |
|------|------|-----------------|----------------------|----------------------|
| CashAdvanceSettlePage.tsx | MODIFY | L16 변경 | L543 (1 사이트) | data, columns, loading, emptyText, onRowClick, className |
| CashAdvanceRequestPage.tsx | MODIFY | L16 변경 | L543 (1 사이트) | data, columns, loading, emptyText, onRowClick, className |
| InterestIncomePage.tsx | MODIFY | L7 변경 | L177 (1 사이트) | columns, data, loading, emptyText (onRowClick/className 미사용) |
| AdjustmentPage.tsx | MODIFY | L14 변경 | L684, L704, L808, L815, L842, L849 (6 사이트 — 4 탭 + 서브탭/bizFlag 조건부 렌더) | 6 사이트 모두 columns, data, loading, emptyText (onRowClick/className 미사용, 추가 금지) |
| EtaxReceivePage.tsx | MODIFY | L15 변경 | L394 (메인), L421 (모달 조건부 렌더 `showMappingModal`) | 2 사이트 모두 columns, data, loading, emptyText, onRowClick (className 미사용) |

**E-01 Section 7 ↔ Section 11 일관성**: 5/5 행 1:1 매칭. NEW/MODIFY 분류 5 MODIFY 일치. 11 JSX 사이트 모두 enumerate. 파일 이름 일치.

### 11.2 Before/After 코드 스니펫 (E-02 — 최소 1개)

**대표 페이지 InterestIncomePage.tsx (가장 단순 1 사이트, 4 종 props):**

**Before** (L7, L177-182):
```tsx
// L7
import BaseGrid from '../../../components/tomis/Grid/BaseGrid';

// L177
<BaseGrid<InterestIncomeItem>
  columns={columns}
  data={rows}
  loading={isLoading}
  emptyText="조회된 자료가 없습니다."
/>
```

**After**:
```tsx
// L7 (변경 후)
import { Grid } from '@tomis/grid-core';

// L177 (변경 후)
<Grid<InterestIncomeItem>
  columns={columns}
  data={rows}
  enableSort
  enableFilter
  loading={isLoading}
  emptyText="조회된 자료가 없습니다."
/>
```

**CashAdvanceSettlePage.tsx (className 보존 패턴 — 2 사이트 공통, CashAdvanceRequest 동일):**

**Before** (L16, L543-550):
```tsx
import BaseGrid from '../../../components/tomis/Grid/BaseGrid';

<BaseGrid<SlipListItem>
  data={list}
  columns={columns}
  loading={isLoading}
  emptyText="등록된 자료가 없습니다."
  onRowClick={handleRowClick}
  className="w-full"
/>
```

**After**:
```tsx
import { Grid } from '@tomis/grid-core';

<Grid<SlipListItem>
  data={list}
  columns={columns}
  enableSort
  enableFilter
  loading={isLoading}
  emptyText="등록된 자료가 없습니다."
  onRowClick={handleRowClick}
  className="w-full"
/>
```

**AdjustmentPage.tsx (6 사이트 — 4 종 props 일관 패턴, 가장 복잡):**

**Before** (L14, L684-689 + L704-709 + L808-813 + L815-820 + L842-847 + L849-854):
```tsx
import BaseGrid from '../../../components/tomis/Grid/BaseGrid';

// L684 (sales 탭)
<BaseGrid<SalesRow>
  columns={SALES_COLUMNS}
  data={salesRows}
  loading={salesLoading}
  emptyText="등록된 자료가 없습니다."
/>

// L704 (replacement 탭)
<BaseGrid<AssetRow>
  columns={ASSET_REPLACEMENT_COLUMNS}
  data={assetRows}
  loading={assetLoading}
  emptyText="등록된 자료가 없습니다."
/>

// L808 (depreciation list 서브탭)
<BaseGrid<DeprRow>
  columns={DEPR_COLUMNS}
  data={deprRows}
  loading={deprLoading}
  emptyText="등록된 자료가 없습니다."
/>

// L815 (depreciation summary 서브탭)
<BaseGrid<DeprSummaryRow>
  columns={DEPR_SUMMARY_COLUMNS}
  data={deprSummaryRows}
  loading={deprLoading}
  emptyText="등록된 자료가 없습니다."
/>

// L842 (period bizFlag='07')
<BaseGrid<PeriodRow07>
  columns={PERIOD_07_COLUMNS}
  data={periodRows07}
  loading={periodLoading}
  emptyText="등록된 자료가 없습니다."
/>

// L849 (period bizFlag='06')
<BaseGrid<PeriodRow06>
  columns={PERIOD_06_COLUMNS}
  data={periodRows06}
  loading={periodLoading}
  emptyText="등록된 자료가 없습니다."
/>
```

**After** (6 사이트 동일 패턴 적용):
```tsx
import { Grid } from '@tomis/grid-core';

// L684
<Grid<SalesRow>
  columns={SALES_COLUMNS}
  data={salesRows}
  enableSort
  enableFilter
  loading={salesLoading}
  emptyText="등록된 자료가 없습니다."
/>

// L704
<Grid<AssetRow>
  columns={ASSET_REPLACEMENT_COLUMNS}
  data={assetRows}
  enableSort
  enableFilter
  loading={assetLoading}
  emptyText="등록된 자료가 없습니다."
/>

// L808
<Grid<DeprRow>
  columns={DEPR_COLUMNS}
  data={deprRows}
  enableSort
  enableFilter
  loading={deprLoading}
  emptyText="등록된 자료가 없습니다."
/>

// L815
<Grid<DeprSummaryRow>
  columns={DEPR_SUMMARY_COLUMNS}
  data={deprSummaryRows}
  enableSort
  enableFilter
  loading={deprLoading}
  emptyText="등록된 자료가 없습니다."
/>

// L842
<Grid<PeriodRow07>
  columns={PERIOD_07_COLUMNS}
  data={periodRows07}
  enableSort
  enableFilter
  loading={periodLoading}
  emptyText="등록된 자료가 없습니다."
/>

// L849
<Grid<PeriodRow06>
  columns={PERIOD_06_COLUMNS}
  data={periodRows06}
  enableSort
  enableFilter
  loading={periodLoading}
  emptyText="등록된 자료가 없습니다."
/>
```

**EtaxReceivePage.tsx (2 사이트 — onRowClick 보존, 모달 패턴):**

**Before** (L15, L394-400 + L421-427):
```tsx
import BaseGrid from '../../../components/tomis/Grid/BaseGrid';

// L394 (메인 그리드)
<BaseGrid<Vatx11ListItem>
  columns={columns}
  data={vatx11List}
  loading={isLoading}
  emptyText="조회된 데이터가 없습니다."
  onRowClick={handleRowSelect}
/>

// L421 (모달 그리드 — showMappingModal 조건부 렌더)
<BaseGrid<SlipSearchItem>
  columns={slipColumns}
  data={slipSearchList}
  loading={isSlipSearchLoading}
  emptyText="매핑 가능한 전표가 없습니다."
  onRowClick={handleMapping}
/>
```

**After**:
```tsx
import { Grid } from '@tomis/grid-core';

// L394 (메인)
<Grid<Vatx11ListItem>
  columns={columns}
  data={vatx11List}
  enableSort
  enableFilter
  loading={isLoading}
  emptyText="조회된 데이터가 없습니다."
  onRowClick={handleRowSelect}
/>

// L421 (모달)
<Grid<SlipSearchItem>
  columns={slipColumns}
  data={slipSearchList}
  enableSort
  enableFilter
  loading={isSlipSearchLoading}
  emptyText="매핑 가능한 전표가 없습니다."
  onRowClick={handleMapping}
/>
```

### 11.3 구현 순서 (최소 2 단계 — E-03)

1. **Step 1 — 단일 페이지 검증 (InterestIncomePage 만)**:
   - 가장 단순한 1 BaseGrid 사이트 + 4 종 props 페이지부터 시작.
   - L7 import 1줄 + L177 JSX 1군데 변경 (PowerShell-via-Bash 우회 — D8 + C-34 + D9 스크립트 BOM).
   - `npx tsc --noEmit` (cwd = `tw-framework-front`) → 0 errors 확인.
   - dev server 띄워 InterestIncomePage 외관 확인 (sort/filter/loading/empty).
   - tsc 또는 외관 실패 시 다음 단계 진행 금지 — 원인 분석 후 spec 재검토.

2. **Step 2 — 단순 페이지 일괄 변환 (Cash* 2 페이지)**:
   - CashAdvanceSettlePage (1 사이트 + className) + CashAdvanceRequestPage (1 사이트 + className) 변환. 두 페이지 패턴 동일 (BIZ_TYPE 만 C21/C20 차이).
   - 각 파일 PowerShell `[IO.File]::ReadAllText` → `Replace` (import + JSX 사이트) → `[IO.File]::WriteAllBytes` (UTF-8 BOM 미포함).
   - 한글 텍스트 "등록된 자료가 없습니다." 깨짐 검증 — `grep -c "등록된 자료가 없습니다"` 변경 전후 동일 확인.

3. **Step 3 — 복합 페이지 일괄 변환 (Adjustment + EtaxReceive)**:
   - AdjustmentPage 6 사이트 + EtaxReceivePage 2 사이트 변환.
   - **EC-01 차단**: 한 파일 내 다중 사이트 동시 변환 — 한 사이트만 교체 시 tsc fail 위험.
   - PowerShell 정규식 또는 sequential `Replace` 호출로 모든 `<BaseGrid<` 동시 변환.
   - 한국어 emptyText 매칭 — `.ps1` 스크립트 BOM (D9 + C-35) 의무.

4. **Step 4 — 전체 검증 및 commit**:
   - AC-004 grep 검증 (`from '../../../components/tomis/Grid/BaseGrid'` 또는 `<BaseGrid` → 5 파일에서 0 hits).
   - AC-001 tsc 0 errors (`npx tsc --noEmit`).
   - AC-002 dev server console.warn 0 건.
   - **AC-002 시각 회귀 — 11 사이트 모두 확인 의무**:
     - CashAdvanceSettle L543 (검색 폼 + 그리드 + 폼 패널)
     - CashAdvanceRequest L543 (CashAdvanceSettle 와 동일 패턴 — sample 가능)
     - InterestIncome L177 (검색 폼 + 그리드 + 합계 footer)
     - Adjustment L684 (sales 탭) + L704 (replacement 탭) + L808 (depreciation-list) + L815 (depreciation-summary) + L842 (period-07) + L849 (period-06) — **4 탭 + 서브탭 + bizFlag 모두 진입 후 확인**
     - EtaxReceive L394 (메인) + L421 (모달 진입 — 행 선택 → 전표매핑 버튼 → 모달 grid 확인)
   - 단일 commit (또는 페이지별 5 commit — D-02 AC-005) 으로 PR.

### 11.4 위험 요소

| 위험 | 영향 페이지 | 완화책 |
|------|------------|--------|
| 한 파일 내 다중 BaseGrid 사이트 — 일부만 교체 시 tsc 실패 또는 AC-004 NO | Adjustment(6), EtaxReceive(2) | EC-01 — PowerShell 정규식 또는 일괄 Replace 로 모든 `<BaseGrid<` 동시 변환. AC-004 grep 으로 0 hits 검증. |
| `onRowClick` / `className` 사이트별 혼재 — 일괄 추가 시 미정의 식별자 또는 외관 회귀 | 11 사이트 (Section 2.1 매트릭스 참조) | EC-02 — Section 3 표 + Section 11.1 표에서 사이트별 props 유무 명시. CashAdvanceSettle/Request 의 className 보존, Adjustment 6 사이트는 4 종 props 만 유지(추가 금지), EtaxReceive 2 사이트는 onRowClick 보존. 사이트별 다른 replace string 사용. |
| 워크트리 Edit/Write 도구 boundary 차단 → 즉시 escalate 시 1 round-trip 낭비 | 5 파일 모두 (base repo) | EC-04 + D8 + C-34 + ADR-MOD-GRID-17-001 — PowerShell-via-Bash 우회 표준 절차. `[IO.File]::WriteAllBytes` + `UTF8Encoding($false)` (BOM 미포함). |
| UTF-8 BOM 누락 (출력 파일) → 한글 메뉴/emptyText 깨짐 | 5 파일 모두 | MEMORY.md #32 + ADR-MOD-GRID-17-001 — `(New-Object System.Text.UTF8Encoding $false).GetBytes($content)`. 변경 후 한글 string grep hit 카운트 변경 전후 동일 확인. |
| **`.ps1` 스크립트 BOM 누락 → 한국어 패턴 매칭 `MISS`** (G-002 1차 사례) | 4 종 한국어 emptyText 총 11 사이트 | EC-08 + D9 + C-35 + ADR-MOD-GRID-17-004 — `.ps1` 파일 자체에 BOM (`0xEF 0xBB 0xBF`) prepend 의무. 또는 inline `powershell -Command` 우회. |
| `ColumnDef` 타입 호환 — 사용처가 `../../../types/tomis/grid` re-export 사용 | 5 페이지 모두 | EC-03 + D3 — `ColumnDef` import 는 변경하지 않음. `../../../types/tomis/grid` 의 re-export 가 `@tanstack/react-table` 의 `ColumnDef<TData>` 와 동일 type alias 이므로 tsc 통과 예상 (G-001/G-002 검증 재인용). |
| Adjustment 탭 전환 + 서브탭 + bizFlag 조건부 렌더 — 한 grid 만 교체 시 다른 탭 진입 시 런타임 오류 | AdjustmentPage 6 사이트 | EC-06 — Section 11.1 표에 6 사이트 라인 enumerate. AC-002 시각 회귀 시 4 탭 모두 + 서브탭(depreciation list/summary) + bizFlag(period 07/06) 모두 진입 확인 의무. |
| EtaxReceive 모달 grid 외관 — 행 선택 → 전표매핑 모달 트리거 안 하면 미검증 | EtaxReceivePage L421 | EC-07 — AC-002 시각 회귀 시 EtaxReceive 페이지에서 행 선택 → 전표매핑 버튼 클릭 → 모달 진입 → 모달 grid 외관 확인 의무. |
| 외관 회귀 (cell padding / row height / sort glyph / hover bg / sticky thead) | 5 페이지 | AC-002 시각 회귀 검증 — 11 사이트 모두 dev server 렌더 후 픽셀 비교. 로컬 BaseGrid + monorepo Grid 가 동일 TanStack API 사용 → 이론적으로 0% 회귀. |

---

## Section 12. 검증 계획

### 12.1 단위 테스트 (E-05)
- **본 Goal 자체 단위 테스트 없음** — 사용처 마이그레이션이므로 grid-core 의 단위 테스트가 이미 MOD-GRID-01 G-001~G-005 에서 커버됨.
- 사용처에 추가 단위 테스트 필요시 후속 Goal 에서 추가 (본 Goal 범위 외).

### 12.2 시각 회귀 검증 (C-13 + C-17 의무 — migrationImpact: high)
- **방법 1 (자동)**: tw-framework-front 의 Storybook 미설정 환경 — Storybook story 신규 작성은 본 Goal 범위 외 (5 페이지가 복잡한 데이터 fetching 페이지여서 isolation 가능한 story 작성 부담 큼).
- **방법 2 (수동)**: 5 페이지 각각 dev server (`npm run dev`) 에서 마이그레이션 전후 동일 데이터로 스크린샷 캡처 후 외관 비교. 확인 대상:
  - cell padding (`px-4 py-3`)
  - row height
  - sort glyph (▲▼⇅) 위치 + 색상
  - hover bg-gray-50
  - thead bg-gray-50 sticky top-0
  - empty state 메시지 텍스트 (한글 깨짐 검증 의무 — 4 종 한국어 emptyText)
  - loading skeleton row 색상
  - **Adjustment 4 탭 + 서브탭(depreciation list/summary) + bizFlag(period 07/06) 모두 진입 확인 (EC-06)**
  - **EtaxReceive 모달 grid 외관 — 행 선택 → 전표매핑 버튼 → 모달 진입 확인 (EC-07)**

### 12.3 빌드 검증 (C-12 의무)
- `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx tsc --noEmit` → exit 0, 0 errors.
- `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx vite build` → 빌드 성공 (lazy + 트리쉐이킹 동작 확인).

### 12.4 마이그레이션 자동 보완 (codemod)
- MOD-GRID-99-B docs Goal 에서 codemod 작성 예정. 본 Goal 은 수동/PowerShell 교체 (5 파일 × 11 사이트 = 트리비얼 + Adjustment 6 사이트만 sequential).
- 후속 Goal 들(G-004~G-006)이 동일 패턴으로 잔여 페이지 추가 변환할 때 codemod 우선순위 상승 — 본 Goal 의 변환 패턴이 codemod template 의 입력.

### 12.5 한글 깨짐 검증 (C-34 + C-35 + ADR-MOD-GRID-17-001/004 의무)
- PowerShell-via-Bash 우회 사용 시 **출력 파일 UTF-8 BOM 미포함** 인코딩 강제 (D8 + C-34).
- **`.ps1` 스크립트 자체 UTF-8 BOM prepend** 의무 (D9 + C-35) — 한국어 매칭 시도 시 `MISS` 차단.
- 변경 전후 핵심 한글 string hit 카운트 동일 확인:
  - `"등록된 자료가 없습니다."` (8 사이트 — CashAdvanceSettle L547, CashAdvanceRequest L547, Adjustment L688, L708, L812, L819, L846, L853)
  - `"조회된 자료가 없습니다."` (1 사이트 — InterestIncome L181)
  - `"조회된 데이터가 없습니다."` (1 사이트 — EtaxReceive L398)
  - `"매핑 가능한 전표가 없습니다."` (1 사이트 — EtaxReceive L425)
  - 핵심 한글 string 합계: 11 사이트 의 emptyText 텍스트 (4 종 distinct 문자열)
- 변경 후 Read 도구로 변경 부위 확인 — 한글 출력 정상 여부 시각 검증.
- 스크립트 실행 결과 `MISS` 0건 (모든 11 사이트 패턴 `HIT` 확인).

---

## Section 13. 상용 제품화 영향

### 13.1 패키지 대상 (F-01)
- **본 Goal 의 변경 대상 = `tw-framework-front` 사용처만**. `@tomis/grid-core` / `@tomis/grid-pro-*` / `@tomis/grid-renderers` 패키지 변경 없음 (코어 변경 0).
- `packageTarget: "tw-framework-front"` (G-001/G-002 동일).

### 13.2 라이선스 검증 호출 (F-02)
- **N/A** — 본 Goal 의 5 페이지는 MIT 영역(`@tomis/grid-core`) 만 사용. `@tomis/grid-pro-*` (Pro 영역) 호출 없음 (실측 Read 결과 — 5 페이지 모두 local `BaseGrid` 만 사용, ChangeTrackingGrid/RangeSelectGrid 등 Pro alias 미사용).
- 따라서 `setLicenseKey()` / `configureGridLicense()` 호출 위치 불필요 (`grid-license` 런타임 검증 적용 대상 외).

### 13.3 문서 작성 계획 (F-03)
- **본 Goal 자체는 public API 변경 0** — Docusaurus API reference 항목 추가 불필요 (C-25 의무는 grid-core 신규 API 추가 시에만 발동).
- **권장 (선택)**: MOD-GRID-99-B docs Goal 의 "마이그레이션 가이드" 챕터에 Adjustment 6 사이트 패턴(탭 + 서브탭 + bizFlag 조건부 렌더 다중 grid) 예시 추가 권장 — 11 사이트 중 가장 복잡. 본 Goal 의 implement Stage 에서 docs 추가 의무 X.
- Storybook story 신규 작성: **본 Goal 범위 외** (12.2 방법 1 참조 — 부담 대비 효과 낮음).

### 13.4 peerDependencies 정책 (F-04)
- `@tomis/grid-core` 가 `react` / `react-dom` / `@tanstack/react-table` 을 peer 로 선언 (MOD-GRID-00 G-001 + MOD-GRID-01 G-005 확정).
- tw-framework-front 의 package.json 이 이미 이 셋을 deps 로 보유 (G-001 spec Section 4.5 검증 완료) — peer 충족.
- 본 Goal 은 dependency 변경 0 → C-22 위반 없음 + peer mismatch 0.

### 13.5 semver 영향 (C-23)
- 본 Goal 은 `@tomis/grid-core` 의 public API 변경 0 → semver 영향 없음 (patch 도 아님).
- 로컬 `BaseGrid` deprecated 처리는 본 Goal 범위 외 — G-004 ~ G-006 까지 완료 후 다른 페이지 사용처 0건 확인 시 별도 cleanup Goal. 누적 마이그레이션 완료 페이지: G-001 5 + G-002 5 + G-003 5 = 15 페이지.
