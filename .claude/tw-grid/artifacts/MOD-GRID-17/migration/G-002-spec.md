# G-002 Spec: account/Expense*+Vat* 5 페이지 마이그레이션

**Goal**: MOD-GRID-17 / migration / G-002
**Priority**: P0 | **Migration Impact**: high | **Threshold**: 95
**Package Target**: `tw-framework-front` (사용처 마이그레이션 — `@tomis/grid-core` 코어 변경 없음)
**License Tier**: N/A (MIT 영역만 사용)

---

## ★ 사전 결정 표 (D# — Spec Writer 권위)

| D# | 결정 | 사유 | goals.json 영향 |
|----|------|------|----------------|
| D1 | 5 파일 모두 `import { Grid } from '@tomis/grid-core'` 로 통일. 기존 5 파일 모두 **로컬** `BaseGrid` (`'../../../components/tomis/Grid/BaseGrid'`) 만 사용 중이므로 `@tomis/grid-core/legacy` sub-entry 사용 없음. | 본 Goal 목표 = variant alias 제거 후 신규 `<Grid>` API 채택 (AC-004). | `affectedUsageFiles[5]` 그대로 유지. |
| D2 | `<Grid>` props 매핑 = `enableSort` + `enableFilter` + `loading` + `emptyText` + `onRowClick`(필요 페이지만) + (필요 시 `className`). 9 개 BaseGrid 호출 사이트 각각의 현 시그니처를 surgical 매핑. **`enablePagination` 미사용 + `rowSelection` 미사용** (5 파일 어느 페이지도 사용 안 함 — 실측 Read). | G-001 의 `legacy/BaseGrid.tsx` L17-36 의 매핑 표 그대로 따름. 단 monorepo legacy `BaseGrid` 의 `enablePagination={pagination !== undefined}` 매핑은 본 5 페이지 모두 pagination prop 미사용으로 `false` 동치. | `bundleImpact.expected = "0 KB"` 유지. |
| D3 | 컬럼 정의는 **현 inline `ColumnDef<TData>[]` 유지** (createColumns 변환은 본 Goal 범위 외). `ColumnDef` import 는 5 파일 모두 `'../../../types/tomis/grid'` re-export 유지 (변경 X). | 본 Goal scope = "variant import → `<Grid>` 교체" (goals.json L104 userStory). `createColumns` 변환은 별도 후속 Goal 가 자연스럽다. C-19 점진. | `implementFiles[5]` 그대로. |
| D4 | `affectedUsageFiles` = `implementFiles` = 5 페이지 (C-19 ≤5 준수). 9 BaseGrid 호출 사이트 = 5 파일 내부 (한 파일 내 다중 호출 — 1 파일 1 import 라인). NEW 0 + MODIFY 5 = 5 파일. | 본 Goal 은 사용처 마이그레이션 전용 — 새 NEW 파일 0건, MODIFY 5건. | goals.json L132-145 일치. |
| D5 | Section 9 의존성 = "변경 없음". `@tomis/grid-core` workspace alias 는 `vite.config.ts` L18 + `tsconfig.app.json` L23 에서 이미 wiring 완료 (검증됨 — Grep 결과 인용). | 신규 dep 추가 0건. C-22 peerDeps 영향 0. ADR-MOD-GRID-17-002 의무 (B-04 sub-rule) 충족. | `bundleImpact.package = "tw-framework-front"` 일치. |
| D6 | Section 2 의 `<Grid>` props interface 인용 = `grid-core/src/types.ts` `GridProps<TData>` 의 실제 정의. 사용처는 그 중 `data` / `columns` / `enableSort` / `enableFilter` / `onRowClick` / `loading` / `emptyText` 7 개 props 만 사용. | C-1 Read-then-Write 준수 + spec authoritative. G-001 spec Section 2.1 의 11개 props 부분집합. | N/A |
| D7 | 페이지별 마이그레이션 액션 = `direct 교체` (5 페이지 모두 동일 액션, 한 파일 내 다중 호출 일괄 변환). 페이지별 PR 분리는 AC-005 (D-02) 별도 처리. 본 spec 의 implement Stage 는 단일 commit 으로 일괄 5 파일 변경 + verifier 가 외관/tsc 통합 검증. | 호환성 정책 D-02 (페이지 단위 PR). | N/A |
| D8 | 워크트리 경계 우회 — Implementer Agent 는 C-34 + ADR-MOD-GRID-17-001 의 PowerShell-via-Bash 우회 표준 절차 따른다. UTF-8 BOM 미포함 (한글 메뉴/empty text 깨짐 방지). | 5 파일 모두 base repo (`tw-framework-front/`) 에 위치 → 워크트리 Edit/Write 도구가 boundary 차단. ADR-MOD-GRID-17-001 + C-34 cascading 적용. | N/A |

**Verifier 자가-검산 (G-01 + E-06 cross-check)**: 합계 8 D# 결정. NEW 0 + MODIFY 5 = 총 5 파일. Section 7 표 5 행 + Section 11.1 표 5 행. breakdown(NEW 0 / MODIFY 5 / 파일 이름) 본문/AC/Section 7 모두 1:1 매칭. 9 BaseGrid 호출 사이트 분포: ExpenseGeneral 2 + ExpenseCard 3 + ExpenseResearchCard 2 + VatManage 1 + VatSchedule 1 = 9. Section 3 표 + Section 11.1 표에 9 사이트 모두 enumerate.

---

## Section 1. 참조 추적 (Reference Tracking)

### L0 — tw-framework-front 현 구현 (실측 Read + Grep 결과)

영향 사용처 5개 페이지의 grid 사용 패턴 (모두 실측 Read + Grep 완료). 9개 `<BaseGrid>` 호출 사이트 enumerate.

**L0-1: `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/ExpenseGeneralPage.tsx`** (882 줄)
- L18: `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` — **local legacy import (마이그레이션 대상)**
- L19: `import type { ColumnDef } from '../../../types/tomis/grid';`
- L721-727 (지출결의서 일반 목록):
  ```tsx
  <BaseGrid<SlipListItem>
    columns={slipColumns}
    data={slipList}
    loading={isLoading}
    emptyText="조회된 데이터가 없습니다."
    onRowClick={handleSlipSelect}
  />
  ```
- L750-756 (분개 목록):
  ```tsx
  <BaseGrid<Slip02ListItem>
    columns={slip02Columns}
    data={chaList}
    loading={isDetailLoading}
    emptyText="지출내용을 등록하세요."
    onRowClick={handleSlip02Select}
  />
  ```
- props 사용 (2 사이트 모두 동일 5 종): `columns`, `data`, `loading`, `emptyText`, `onRowClick` (`className` 미사용, pagination/rowSelection 미사용)

**L0-2: `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/ExpenseCardPage.tsx`** (699 줄)
- L15: `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` — **local legacy import**
- L16: `import type { ColumnDef } from '../../../types/tomis/grid';`
- L525-531 (지출결의서 법인카드 목록):
  ```tsx
  <BaseGrid<CardSlipListItem>
    columns={slipColumns}
    data={slipList}
    loading={isLoading}
    emptyText="조회된 데이터가 없습니다."
    onRowClick={handleSlipSelect}
  />
  ```
- L650-656 (분개 목록):
  ```tsx
  <BaseGrid<Slip02CardItem>
    columns={slip02Columns}
    data={chaList}
    loading={isDetailLoading}
    emptyText="법인카드 결의내역이 없습니다."
    onRowClick={handleChaSelect}
  />
  ```
- L740-745 (카드 사용내역 목록 — **`onRowClick` 미사용**):
  ```tsx
  <BaseGrid<CardUsageItem>
    columns={cardUsageColumns}
    data={cardUsageList}
    loading={isCardLoading}
    emptyText="법인카드 사용내역이 없습니다. 조회 버튼을 눌러 조회하세요."
  />
  ```
- props 사용: 2 사이트는 5 종(`columns/data/loading/emptyText/onRowClick`), 1 사이트는 4 종(`onRowClick` 제외)

**L0-3: `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/ExpenseResearchCardPage.tsx`** (720 줄)
- L16: `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` — **local legacy import**
- L17: `import type { ColumnDef } from '../../../types/tomis/grid';`
- L560-566 (지출결의서 연구비카드 목록):
  ```tsx
  <BaseGrid<ResearchSlipListItem>
    columns={slipColumns}
    data={slipList}
    loading={isLoading}
    emptyText="조회된 데이터가 없습니다."
    onRowClick={handleSlipSelect}
  />
  ```
- L637-642 (분개행 그리드 — **`onRowClick` 미사용**):
  ```tsx
  <BaseGrid<Slip02ResearchItem>
    columns={slip02Columns}
    data={slip02List}
    loading={isDetailLoading}
    emptyText="분개 내역이 없습니다."
  />
  ```
- props 사용: 1 사이트 5 종, 1 사이트 4 종(`onRowClick` 제외)

**L0-4: `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/VatManagePage.tsx`** (500 줄)
- L15: `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` — **local legacy import**
- L16: `import type { ColumnDef } from '../../../types/tomis/grid';`
- L459-465 (Vat 목록):
  ```tsx
  <BaseGrid<Vatx01ListItem>
    columns={vatColumns}
    data={vatList}
    loading={isLoading}
    emptyText="조회된 데이터가 없습니다."
    onRowClick={handleRowSelect}
  />
  ```
- props 사용 (5 종): `columns/data/loading/emptyText/onRowClick`

**L0-5: `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/VatSchedulePage.tsx`** (274 줄)
- L14: `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` — **local legacy import**
- L15: `import type { ColumnDef } from '../../../types/tomis/grid';`
- L239-245 (Vat schedule 목록):
  ```tsx
  <BaseGrid<Vatx02ListItem>
    columns={columns}
    data={schedList}
    loading={isLoading}
    emptyText="조회된 데이터가 없습니다."
    onRowClick={handleRowSelect}
  />
  ```
- props 사용 (5 종): `columns/data/loading/emptyText/onRowClick`

**호출 사이트 합계: 9 (ExpenseGeneral 2 + ExpenseCard 3 + ExpenseResearchCard 2 + VatManage 1 + VatSchedule 1)**

### L1 — TanStack v8 API
- **N/A** (본 Goal 은 TanStack API 변경 없음 — grid-core wrapper 만 교체). 사용처는 `import type { ColumnDef } from '../../../types/tomis/grid'` 유지 (D3).

### L2 — 공통 컴포넌트 (`@tomis/grid-core`)

L2-1: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` L2 export:
```ts
export { Grid } from './Grid';
```
+ L23-34 legacy alias 5종 export 확인 (본 Goal 은 main `Grid` 만 사용).

L2-2: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/Grid.tsx` (G-001 spec L2-2 동일):
```tsx
export const Grid = forwardRef(GridInner) as <TData>(
  props: GridProps<TData> & { ref?: Ref<GridHandle<TData>> },
) => ReactElement;
```

L2-3: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` `GridProps<TData>` (G-001 spec L2-3 동일 — 11개 props 부분 인용):
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

L2-4: 로컬 `BaseGrid` 컴포넌트 (`D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/BaseGrid.tsx`) L1-50 확인 결과 — 이 로컬 BaseGrid 가 내부에서 `useReactTable` + `getCoreRowModel` + `getSortedRowModel` + `getFilteredRowModel` + `getPaginationRowModel` 직접 호출. 즉, 본 Goal 의 5 페이지가 사용 중인 BaseGrid 는 **로컬 사본** (monorepo legacy alias 아님). 따라서 본 마이그레이션은 그 로컬 사본 호출을 monorepo `<Grid enableSort enableFilter>` 로 교체.

**G-001 spec L2-4 의 매핑 표(monorepo legacy alias `BaseGrid` 의 내부 매핑)는 본 Goal 의 surgical 변환 청사진 동일 적용**. 로컬 BaseGrid 도 같은 매핑 의도(sort/filter/pagination 활성화)로 작성된 동치 wrapper.

### L3 — 영향 사용처 카운트 = **5 파일** (5/5, C-19 준수)

`canonical-modules.json` MOD-GRID-17 affectedUsageFiles 중 account/Expense* + account/Vat* 도메인 5건. 정확한 경로 5개 (Section 8.1 동일).

### R-A / R-W — N/A
- 본 Goal 은 신규 API 설계가 아닌 **사용처 마이그레이션** — AG Grid / Wijmo 동등 기능 참조 불필요.

---

## Section 2. API 계약 (TypeScript Interface)

본 Goal 은 신규 API 정의가 없음 — `@tomis/grid-core` 의 기존 `GridProps<TData>` 를 사용처에서 호출만 한다.

### 2.1 호출할 인터페이스 (`grid-core/src/types.ts` 실측 인용 — G-001 spec L2-3 동일)

본 Goal 의 5 페이지에서 사용할 `GridProps<TData>` 의 7개 props 부분 (D6):

```ts
export interface GridProps<TData> {
  // ─── 필수 ───
  data: TData[];                                        // required
  columns: ColumnDef<TData, unknown>[];                 // required

  // ─── enable* 토글 ───
  enableSort?: boolean;                                 // default false → 본 Goal: true
  enableFilter?: boolean;                               // default false → 본 Goal: true

  // ─── 이벤트 ───
  onRowClick?: (row: TData, event: MouseEvent<HTMLTableRowElement>) => void;
  // 9 호출 사이트 중 7 사이트 사용 (ExpenseGeneral 2, ExpenseCard 2/3, ExpenseResearchCard 1/2, VatManage 1, VatSchedule 1)

  // ─── 표시 ───
  emptyText?: string;
  loading?: boolean;
}
```

**미사용 props (본 Goal 의 5 파일):**
- `enablePagination`: 미사용 (5 파일 어느 곳도 pagination prop 사용 안 함 — 실측 Read)
- `rowSelection`: 미사용 (5 파일 어느 곳도 rowSelection prop 사용 안 함 — 실측 Read)
- `className`: 미사용 (9 사이트 어느 곳도 className prop 사용 안 함 — 실측 Read)
- `pagination`: 미사용
- 기타 30+ optional props: default 유지

### 2.2 export 경로 (D6 + L2-1)

```ts
// 사용처 마이그레이션 최종 import 라인 (5 파일 모두 동일):
import { Grid } from '@tomis/grid-core';
import type { ColumnDef } from '../../../types/tomis/grid';
// (D3: ColumnDef import 경로는 변경하지 않음 — local re-export 유지)
```

### 2.3 사용 예시 코드 (최소 2개 — 본 Goal 의 실측 시나리오)

**예시 1 (onRowClick 사용 — 7 사이트 공통 패턴, 가장 빈번):**
```tsx
import { Grid } from '@tomis/grid-core';
import type { ColumnDef } from '../../../types/tomis/grid';

<Grid<SlipListItem>
  columns={slipColumns}
  data={slipList}
  enableSort
  enableFilter
  loading={isLoading}
  emptyText="조회된 데이터가 없습니다."
  onRowClick={handleSlipSelect}
/>
```

**예시 2 (onRowClick 미사용 — ExpenseCard L740 / ExpenseResearchCard L637 패턴, 2 사이트):**
```tsx
import { Grid } from '@tomis/grid-core';
import type { ColumnDef } from '../../../types/tomis/grid';

<Grid<CardUsageItem>
  columns={cardUsageColumns}
  data={cardUsageList}
  enableSort
  enableFilter
  loading={isCardLoading}
  emptyText="법인카드 사용내역이 없습니다. 조회 버튼을 눌러 조회하세요."
/>
```

### 2.4 기본값 / optional 명시
- `data`, `columns` = **required** (위 두 props 만 필수, 9 사이트 모두 명시됨)
- 그 외 5 종 props (`enableSort`, `enableFilter`, `loading`, `emptyText`, `onRowClick`) 는 모두 **optional** — 미사용 = TanStack 기본 동작
- `emptyText` default `'데이터가 없습니다.'` (Grid.tsx `DEFAULT_EMPTY_TEXT`)
- `enableSort` default false → 본 Goal 은 모든 9 사이트에서 `enableSort` boolean attribute 형태로 활성화 (이전 로컬 BaseGrid 가 내부적으로 항상 sort 활성)

### 2.5 ref API — N/A (B-05)
본 Goal 의 5 페이지 어느 곳도 `gridRef` 사용 없음 (Read 결과 confirmed). `GridHandle<TData>` 미사용. B-05 = N/A.

---

## Section 3. 기존 사용처 대응표 ⭐ (tw-grid 특화)

| 페이지 | 기존 import / 사용 패턴 (라인) | 신규 API 대응 | 마이그레이션 액션 |
|--------|------------------------------|-------------|------------------|
| **ExpenseGeneralPage.tsx** | L18 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';`<br>L721-727 `<BaseGrid<SlipListItem> columns data loading emptyText onRowClick />`<br>L750-756 `<BaseGrid<Slip02ListItem> columns data loading emptyText onRowClick />` | `import { Grid } from '@tomis/grid-core';`<br>L721, L750 각각 `<Grid<T> columns data enableSort enableFilter loading emptyText onRowClick />` (×2) | **direct 교체** (import 1 라인 + 2 JSX 사이트 동기) |
| **ExpenseCardPage.tsx** | L15 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';`<br>L525-531 `<BaseGrid<CardSlipListItem> ... onRowClick />` (with onRowClick)<br>L650-656 `<BaseGrid<Slip02CardItem> ... onRowClick />` (with onRowClick)<br>L740-745 `<BaseGrid<CardUsageItem> ... />` (no onRowClick) | `import { Grid } from '@tomis/grid-core';`<br>L525, L650 → `<Grid<T> enableSort enableFilter ... onRowClick />`<br>L740 → `<Grid<CardUsageItem> enableSort enableFilter ... />` (onRowClick 없음 유지) | **direct 교체** (import 1 라인 + 3 JSX 사이트 동기) |
| **ExpenseResearchCardPage.tsx** | L16 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';`<br>L560-566 `<BaseGrid<ResearchSlipListItem> ... onRowClick />` (with onRowClick)<br>L637-642 `<BaseGrid<Slip02ResearchItem> ... />` (no onRowClick) | `import { Grid } from '@tomis/grid-core';`<br>L560 → `<Grid<T> enableSort enableFilter ... onRowClick />`<br>L637 → `<Grid<Slip02ResearchItem> enableSort enableFilter ... />` (onRowClick 없음 유지) | **direct 교체** (import 1 라인 + 2 JSX 사이트 동기) |
| **VatManagePage.tsx** | L15 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';`<br>L459-465 `<BaseGrid<Vatx01ListItem> columns data loading emptyText onRowClick />` | `import { Grid } from '@tomis/grid-core';`<br>L459 → `<Grid<Vatx01ListItem> enableSort enableFilter ... onRowClick />` | **direct 교체** (import 1 라인 + 1 JSX 사이트) |
| **VatSchedulePage.tsx** | L14 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';`<br>L239-245 `<BaseGrid<Vatx02ListItem> columns data loading emptyText onRowClick />` | `import { Grid } from '@tomis/grid-core';`<br>L239 → `<Grid<Vatx02ListItem> enableSort enableFilter ... onRowClick />` | **direct 교체** (import 1 라인 + 1 JSX 사이트) |

**5/5 행 모두 작성. C-19 ≤5 준수**. 9 BaseGrid 호출 사이트 모두 enumerate (5 파일 합계). 외관 100% 보존 — 로컬 BaseGrid 의 내부 `useReactTable` + `getSortedRowModel` + `getFilteredRowModel` 가 새 `<Grid enableSort enableFilter>` 의 내부 호출과 동치.

---

## Section 4. 호환성 정책

### 4.1 Breaking change
- **`breaking: false`** (goals.json L128 일치)
- 로컬 `BaseGrid` 컴포넌트 (`src/components/tomis/Grid/BaseGrid.tsx`) 자체는 **본 Goal 에서 제거하지 않음**. 다른 페이지가 아직 사용 중일 가능성 — 5 페이지에서만 import 제거.
- `@tomis/grid-core` 의 `Grid` export 는 안정 (MOD-GRID-01 G-001 ~ G-005 완료).

### 4.2 Deprecation 전략 (goals.json L129 + C-6 + C-23)
- 로컬 `BaseGrid` 는 **1 minor 버전 유지** (다른 페이지들이 점진 마이그레이션 후 제거 검토).
- 본 Goal 후속 효과: 5 페이지에서 import 제거 완료 → 로컬 BaseGrid 호출처 감소 → 다음 마이그레이션 모듈(G-003~G-006)이 완료되면 로컬 BaseGrid 자체 제거 검토 가능.

### 4.3 영향 사용처 마이그레이션 경로 (3 단계 — Section 11.3 와 동기)
1. **단계 1**: import 라인 교체 — 5 파일 각각 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` 제거, `import { Grid } from '@tomis/grid-core';` 추가.
2. **단계 2**: JSX 호출 사이트 교체 — 5 파일 내 9 사이트 모두 `<BaseGrid<T>` → `<Grid<T> enableSort enableFilter`. (한 파일 내 다중 사이트 동시 변환 필수)
3. **단계 3**: `npx tsc --noEmit` 0 errors 확인 → 외관 회귀 검증 (C-17).

### 4.4 console warning 정책 (AC-003 + C-23)
- 로컬 `BaseGrid` 는 `useDeprecationWarn` 호출 없음 (확인 — L1-50 Read 결과 `useDeprecationWarn` import 0건). 본 Goal 완료 후에도 console warning 영향 없음.
- `Grid` 자체는 deprecation warning 미발생.

### 4.5 peerDependencies 정책 (C-22)
- `@tomis/grid-core` 가 `react`, `react-dom`, `@tanstack/react-table` 을 peer 로 선언 — 사용처 `tw-framework-front` 는 이미 이 셋을 deps 로 보유 (G-001 spec Section 4.5 검증 완료). 추가 작업 없음.

---

## Section 5. 인수 기준 (Acceptance Criteria with Source Tags)

5개 AC 모두 출처 태그 + binary 검증 가능. migrationImpact: **high** 표시.

| AC ID | 기준 | 출처 | binary 검증 방법 | migrationImpact |
|-------|------|------|------------------|-----------------|
| AC-001 | 5 페이지 tsc 0 errors | **L0 + C-12** | `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx tsc --noEmit` 명령 실행 → exit 0 + stderr 빈 결과 | high |
| AC-002 | 외관 보존 — 동일 데이터 입력 시 마이그레이션 전후 시각 동일 (9 사이트 모두) | **L0 + L2 + C-17** | (a) 로컬 BaseGrid 가 내부에서 `useReactTable + getSortedRowModel + getFilteredRowModel + getPaginationRowModel + flexRender` 호출하며 같은 thead/tbody markup 생성 (L2-4 BaseGrid.tsx L1-50 확인) — monorepo `<Grid enableSort enableFilter>` 와 markup 동일 / (b) 5 페이지 각각 동일 데이터 fixture 로 마이그레이션 전후 스크린샷 캡처 후 픽셀 비교 (cell padding / row height / sort icon / hover bg / thead bg) | high |
| AC-003 | console warning 0 건 | **C-23** | 5 페이지 dev mode 렌더 → `console.warn` 인터셉트 시 deprecated 경고 0건 (로컬 BaseGrid 는 useDeprecationWarn 호출 안 함이 확인됨 — L2-4) | high |
| AC-004 | variant direct import 0 건 (로컬 `BaseGrid` 경로) | **L0 + L2 + C-6** | `grep -nE "from ['\"](\\.\\./)+components/tomis/Grid/BaseGrid['\"]" tw-framework-front/src/pages/tomis/account/ExpenseGeneralPage.tsx ExpenseCardPage.tsx ExpenseResearchCardPage.tsx VatManagePage.tsx VatSchedulePage.tsx` → 0 hits. 또한 `grep -n "<BaseGrid"` → 0 hits (5 파일). | high |
| AC-005 | 페이지 단위 PR 분리 (D-02) — 5 페이지 1 PR 또는 페이지별 commit ≥ 5 | **C-19** | git log --oneline 또는 PR description 에 5 페이지 enumerate. 단일 commit 으로 5 파일 변경도 허용. | high |

**AC source 태그 검증 (H-03 만족)**:
- L0 → Section 1 L0-1~L0-5 에서 실제 인용됨 (9 사이트 라인 인용)
- L2 → Section 1 L2-1~L2-4 에서 실제 인용됨
- C-12 → constraints.md C-12 (`npx tsc --noEmit` 0 errors 의무)
- C-17 → constraints.md C-17 (시각 회귀 검증 의무 — high impact)
- C-23 → constraints.md C-23 (semver — deprecated API 1 minor 유지)
- C-6 → constraints.md C-6 (호환성 절대)
- C-19 → constraints.md C-19 (점진 ≤5/Goal)

---

## Section 6. 엣지 케이스 (3개 이상)

본 Goal 의 실측 페이지 분석 기반 엣지 케이스 (추측 금지 — 실제 Read 결과로 식별):

**EC-01: 한 파일 내 다중 `<BaseGrid>` 사이트 — 동기 교체 필요**
- 출처: L0-1 (ExpenseGeneral 2 사이트 L721 + L750), L0-2 (ExpenseCard 3 사이트 L525 + L650 + L740), L0-3 (ExpenseResearchCard 2 사이트 L560 + L637).
- 위험: implementer 가 한 사이트만 교체 → tsc 통과하나 AC-004 NO (variant import 잔존 — import 라인은 1 개여도 `<BaseGrid>` JSX 가 남으면 미정의 reference). 또는 한 사이트만 교체하면서 import 도 제거하면 tsc fail (`<BaseGrid>` 미정의).
- 처리: Section 11.1 표에 9 사이트 모두 라인 enumerate. PowerShell 우회 시 `[IO.File]::ReadAllText` 후 `Replace` 또는 정규식으로 모든 `<BaseGrid<` 일괄 교체. AC-004 grep 으로 0 hits 검증.

**EC-02: `onRowClick` 미사용 사이트 vs 사용 사이트 혼재 — props 매핑 surgical 보존**
- 출처: L0-2 L740 (`<BaseGrid<CardUsageItem>` onRowClick 미사용), L0-3 L637 (`<BaseGrid<Slip02ResearchItem>` onRowClick 미사용). 다른 7 사이트는 `onRowClick` 사용.
- 위험: implementer 가 일괄 `onRowClick={handle...}` 추가 → `handleSlip02Select` 같은 미정의 식별자 사용 → tsc 실패.
- 처리: Section 3 표 + Section 11.1 표에서 `onRowClick` 유무를 사이트별로 명시. PowerShell 우회 시 each-site 다른 replace string 사용 또는 line-by-line surgical 변환.

**EC-03: ColumnDef import 경로 — 5 파일 모두 `../../../types/tomis/grid` re-export 사용**
- 출처: L0-1 L19, L0-2 L16, L0-3 L17, L0-4 L16, L0-5 L15 모두 동일.
- 위험: D3 결정으로 사용처에서 `ColumnDef` import 를 `@tanstack/react-table` 로 바꾸려 할 때 — 5 파일 모두 일관 적용 또는 어느 하나만 — drift 발생 가능.
- 처리: D3 결정 = "본 Goal 범위 외 — 현 import 경로 유지". `<BaseGrid>` → `<Grid>` 만 surgical 교체. `ColumnDef` import 는 변경하지 않는다. types/tomis/grid.ts 의 `ColumnDef` re-export 가 `@tanstack/react-table` 의 `ColumnDef<TData>` 와 동일 type alias 이므로 tsc 통과 예상 (G-001 spec EC-03 검증 결과 재인용).

**EC-04: 워크트리 경계 — 5 파일 모두 base repo 위치 → PowerShell-via-Bash 우회 필수 (C-34 + ADR-MOD-GRID-17-001)**
- 출처: 5 파일 모두 `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/` (base repo) — 워크트리 외부.
- 위험: 1차 Implementer (G-001 사례) 가 Edit/Write 도구 boundary 차단 발견 후 즉시 "진행 불가" escalate → 1 round-trip 낭비.
- 처리: D8 결정 + C-34 + ADR-MOD-GRID-17-001 의 PowerShell-via-Bash 우회 표준 절차 따른다. `[IO.File]::ReadAllText` + `Replace` + `[IO.File]::WriteAllBytes` + `UTF8Encoding($false)` (BOM 미포함). 한글 메뉴 텍스트 / `emptyText` ("조회된 데이터가 없습니다.", "법인카드 사용내역이 없습니다.") 깨짐 검증 의무.

**EC-05: 빈 데이터 / 로딩 상태 — `loading` + `emptyText` 시각 회귀**
- 출처: 9 사이트 모두 `loading` + `emptyText` props 사용.
- 위험: 로컬 BaseGrid 의 loading skeleton 스타일과 monorepo Grid 의 loading skeleton 스타일이 외관 회귀 가능 (cell padding, skeleton row 색상).
- 처리: AC-002 시각 회귀 검증 — 각 페이지 빈 데이터 상태(`isLoading=true` + `data=[]`)에서 스크린샷 비교. 차이 발견 시 spec re-spec 또는 별도 Goal 분리.

**EC-06: ExpenseGeneralPage 첫 grid `style={{ height: '180px', overflowY: 'auto' }}` wrapper — 외부 스크롤 컨테이너와 충돌**
- 출처: L0-1 L720 (`<div style={{ height: '180px', overflowY: 'auto' }}>` 안에 BaseGrid). 다른 사이트들도 유사 wrapper div 사용 (L749, L524, L649, L739, L559, L636).
- 위험: monorepo `<Grid>` 가 sticky thead (`thead bg-gray-50 sticky top-0` — G-001 spec 12.2 확인) 사용 시 외부 wrapper 의 `overflowY: auto` 와 stacking context 충돌 가능 — sticky 무효화 또는 thead 가려짐.
- 처리: AC-002 시각 회귀 검증 시 sticky thead 동작 확인. 만약 외관 회귀 발견 시 — wrapper div 의 style 변경은 본 Goal 범위 외 (별도 Goal 또는 documented-deviation 처리). 로컬 BaseGrid 도 동일 thead 마크업이므로 회귀 확률 낮음.

---

## Section 7. 구현 대상 파일 (NEW / MODIFY) — 최종 implementFiles 표

**NEW: 없음.**
**MODIFY: 5 파일 (모두 사용처 페이지 — base repo).**

| # | 파일 (절대 경로) | 액션 | 변경 라인 (실측 기반) | 변경 내용 |
|---|-----------------|------|----------------------|----------|
| 1 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/ExpenseGeneralPage.tsx` | MODIFY | L18 (import) + L721 + L750 (JSX 2 사이트) | local `BaseGrid` import 제거 + `Grid` import 추가; 2 사이트 모두 `<BaseGrid<T>` → `<Grid<T> enableSort enableFilter` |
| 2 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/ExpenseCardPage.tsx` | MODIFY | L15 (import) + L525 + L650 + L740 (JSX 3 사이트) | local `BaseGrid` import 제거 + `Grid` import 추가; 3 사이트 모두 `<BaseGrid<T>` → `<Grid<T> enableSort enableFilter` (L740 은 onRowClick 미사용 유지) |
| 3 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/ExpenseResearchCardPage.tsx` | MODIFY | L16 (import) + L560 + L637 (JSX 2 사이트) | local `BaseGrid` import 제거 + `Grid` import 추가; 2 사이트 모두 `<BaseGrid<T>` → `<Grid<T> enableSort enableFilter` (L637 은 onRowClick 미사용 유지) |
| 4 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/VatManagePage.tsx` | MODIFY | L15 (import) + L459 (JSX 1 사이트) | local `BaseGrid` import 제거 + `Grid` import 추가; `<BaseGrid<Vatx01ListItem>` → `<Grid<Vatx01ListItem> enableSort enableFilter` |
| 5 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/VatSchedulePage.tsx` | MODIFY | L14 (import) + L239 (JSX 1 사이트) | local `BaseGrid` import 제거 + `Grid` import 추가; `<BaseGrid<Vatx02ListItem>` → `<Grid<Vatx02ListItem> enableSort enableFilter` |

**합계: NEW 0 + MODIFY 5 = 5 파일** (D4 breakdown + goals.json L132-137 implementFiles 일치).
**JSX 호출 사이트 합계: 9 (ExpenseGeneral 2 + ExpenseCard 3 + ExpenseResearchCard 2 + VatManage 1 + VatSchedule 1)**.
**변경 hunk 합계: import 5 + JSX 9 = 14 변경 라인 (대략 — JSX 라인은 multi-line 호출이므로 hunk 단위는 약 18~22 라인).**

**H-02 경로 합리성 검증**: 모든 5 파일 부모 디렉토리(`.../tw-framework-front/src/pages/tomis/account/`) 실재 — 실제 Read 도구로 5 파일 모두 라인 카운트 + 발췌 성공함. 프로젝트 컨벤션(`tw-framework-front/src/pages/tomis/{도메인}/{모듈}Page.tsx`) 일치 (CLAUDE.md "프론트엔드 디렉토리 원칙").

---

## Section 8. 마이그레이션 영향도 Preflight ⭐

### 8.1 영향 사용처 카운트: **5/5** (1 Goal ≤ 5 — C-19 준수)

5 파일 전체 경로 (goals.json L139-145 일치 + Section 7 #1~#5 일치):
1. `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/ExpenseGeneralPage.tsx`
2. `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/ExpenseCardPage.tsx`
3. `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/ExpenseResearchCardPage.tsx`
4. `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/VatManagePage.tsx`
5. `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/VatSchedulePage.tsx`

### 8.2 무파괴 검증 방법
- **빌드 검증 (자동)**: `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx tsc --noEmit` → exit 0
- **추가 검증 (자동)**: `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx vite build` → 빌드 성공
- **외관 보존 (수동 — Chromatic 미도입 환경)**: 5 페이지 각각 dev server (`npm run dev`) 에서 동일 데이터 fixture 로 마이그레이션 전/후 스크린샷 캡처 후 픽셀 비교. 확인 대상: cell padding(`px-4 py-3`), row height, sort glyph(▲/▼/⇅), thead bg-gray-50, hover bg-gray-50, sticky thead 동작, loading skeleton, emptyText 메시지.
- **외관 동등성 근거 (이론적)**: 로컬 BaseGrid (`src/components/tomis/Grid/BaseGrid.tsx` L1-50) 가 내부에서 `useReactTable + getCoreRowModel + getSortedRowModel + getFilteredRowModel + getPaginationRowModel + flexRender` 호출 → monorepo `<Grid enableSort enableFilter>` 와 같은 TanStack 표준 API 출력 동치.

### 8.3 점진 마이그레이션 vs 일괄 전환
- 본 Goal = **일괄 5 페이지 전환** (C-19 ≤5 충족). 다른 사용처(account/Cash*, account/AdminSlip* 등 22 페이지)는 G-003~G-006 별도 Goal 에서 처리.

### 8.4 롤백 전략
- 로컬 `BaseGrid` 컴포넌트 자체가 보존됨 (`src/components/tomis/Grid/BaseGrid.tsx` 삭제 X) — 사용처에서 즉시 되돌릴 수 있음.
- **롤백 방법 1**: `git revert <commit-sha>` — 단일 commit 변경이므로 surgical 롤백 가능.
- **롤백 방법 2 (BaseGrid 재도입)**: 각 페이지에서 import 라인 복원 + JSX `<Grid enableSort enableFilter ...>` → `<BaseGrid ...>` 로 surgical 되돌리기.

### 8.5 번들 크기 영향
- **0 KB** (C-21 충족). 사용처 마이그레이션 — 새 의존성 추가 0. `@tomis/grid-core` 는 이미 (G-001 으로) tw-framework-front 의 다른 5 페이지에서 import 됨 → 본 Goal 추가 5 페이지는 트리쉐이킹 영향 없음.
- 로컬 `BaseGrid.tsx` 자체는 본 Goal 에서 삭제하지 않음 (다른 페이지 사용 가능성) → 번들 변동 0.
- goals.json L146-150 `bundleImpact.expected = "0 KB"` 일치.

### 8.6 alias 해결 경로 (B-04 의무 — 사용처 마이그레이션 Goal)

`@tomis/grid-core` import 의 해결 경로 (실측 Grep 결과):

1. **vite.config.ts alias** (`D:/project/topvel_project/TOMIS/tw-framework-front/vite.config.ts` L18):
   ```ts
   '@tomis/grid-core': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-core/src'),
   ```
2. **tsconfig.app.json paths** (`D:/project/topvel_project/TOMIS/tw-framework-front/tsconfig.app.json` L23):
   ```json
   "@tomis/grid-core": ["../../topvel-grid-monorepo/packages/grid-core/src"],
   ```
   + L24: `"@tomis/grid-core/legacy": ["../../topvel-grid-monorepo/packages/grid-core/src/legacy"]` (본 Goal 미사용 — D1)
3. **alias source target**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` L2 의 `export { Grid } from './Grid';`

**검증 방법**: `npx tsc --noEmit` 통과 시 tsconfig paths 정상 resolution 입증. `vite build` 통과 시 vite alias 정상 resolution 입증. ADR-MOD-GRID-17-002 의무 충족 (B-04 sub-rule).

### 8.7 base repo 여부 (A-04 의무) + 워크트리 경계 우회

- **5 파일 모두 `tw-framework-front/` (base repo, gitignored)** — 워크트리(`D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/`) 외부.
- 워크트리 Edit/Write 도구가 base repo 변경에 대해 boundary 차단 가능 (`"This background session hasn't isolated its changes yet"`).
- **C-34 + ADR-MOD-GRID-17-001 PowerShell-via-Bash 우회 적용 의무** — D8 결정 + EC-04 처리 참조.
- artifacts metadata (워크트리 내부 `.claude/tw-grid/artifacts/MOD-GRID-17/migration/G-002-*`) 은 정상 Edit/Write 도구 사용.

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

### 10.1 개발자 관점 (5 단계 — goals.json L105-111 일치)
1. **식별**: 5 페이지의 grid 사용 라인 확인 (실제 Section 1 L0-1~L0-5 + 9 사이트 라인 명시 완료).
2. **import 라인 교체**: 5 파일 각각 local `BaseGrid` import 제거, `import { Grid } from '@tomis/grid-core';` 추가.
3. **JSX 호출 교체**: 9 사이트 모두 `<BaseGrid<T>` → `<Grid<T> enableSort enableFilter` (한 파일 내 다중 사이트 동시 변환). PowerShell 우회로 일괄 처리.
4. **tsc 통과 확인**: `cd tw-framework-front && npx tsc --noEmit` → 0 errors.
5. **외관 보존 확인**: dev server 렌더 + 5 페이지 스크린샷 비교 (또는 향후 Storybook story 추가).

### 10.2 최종 사용자 관점 (외관 동등)
- **rows/columns 표시**: 100% 동일 (로컬 BaseGrid 와 monorepo Grid 모두 TanStack v8 표준 API 사용 — DOM 출력 동치).
- **인터랙션**: 클릭(onRowClick — 7 사이트) 동작 동일. 소트(enableSort — 9 사이트 모두 활성) 동일. 필터(enableFilter — 9 사이트 모두 활성) 동일.
- **빈 상태**: `emptyText` 그대로 (9 사이트 모두 자체 메시지 명시).
- **로딩 skeleton**: `loading={true}` 시 skeleton row 표시 (BaseGrid 와 동일).
- **응답 시간**: 동일 컴포넌트 호출이므로 ±0%.

---

## Section 11. 구현 계획

### 11.1 파일별 변경 명세 (Section 7 표을 11 단계 sampling 한 결과 — E-01 cross-check)

| 파일 | 액션 | Step 1 (import) | Step 2 (JSX 사이트) | 영향 받는 컬럼/props |
|------|------|-----------------|----------------------|----------------------|
| ExpenseGeneralPage.tsx | MODIFY | L18 변경 | L721, L750 (2 사이트) | columns, data, loading, emptyText, onRowClick |
| ExpenseCardPage.tsx | MODIFY | L15 변경 | L525, L650, L740 (3 사이트, L740 은 onRowClick 미사용) | columns, data, loading, emptyText, (onRowClick — L525/L650 만) |
| ExpenseResearchCardPage.tsx | MODIFY | L16 변경 | L560, L637 (2 사이트, L637 은 onRowClick 미사용) | columns, data, loading, emptyText, (onRowClick — L560 만) |
| VatManagePage.tsx | MODIFY | L15 변경 | L459 (1 사이트) | columns, data, loading, emptyText, onRowClick |
| VatSchedulePage.tsx | MODIFY | L14 변경 | L239 (1 사이트) | columns, data, loading, emptyText, onRowClick |

**E-01 Section 7 ↔ Section 11 일관성**: 5/5 행 1:1 매칭. NEW/MODIFY 분류 5 MODIFY 일치. 9 JSX 사이트 모두 enumerate. 파일 이름 일치.

### 11.2 Before/After 코드 스니펫 (E-02 — 최소 1개)

**대표 페이지 VatSchedulePage.tsx (가장 단순 1 사이트):**

**Before** (L14, L239-245):
```tsx
// L14
import BaseGrid from '../../../components/tomis/Grid/BaseGrid';

// L239
<BaseGrid<Vatx02ListItem>
  columns={columns}
  data={schedList}
  loading={isLoading}
  emptyText="조회된 데이터가 없습니다."
  onRowClick={handleRowSelect}
/>
```

**After**:
```tsx
// L14 (변경 후)
import { Grid } from '@tomis/grid-core';

// L239 (변경 후)
<Grid<Vatx02ListItem>
  columns={columns}
  data={schedList}
  enableSort
  enableFilter
  loading={isLoading}
  emptyText="조회된 데이터가 없습니다."
  onRowClick={handleRowSelect}
/>
```

**ExpenseCardPage.tsx (3 사이트 — onRowClick 유무 혼재 패턴):**

**Before** (L15, L525-531, L650-656, L740-745):
```tsx
import BaseGrid from '../../../components/tomis/Grid/BaseGrid';

// L525 (with onRowClick)
<BaseGrid<CardSlipListItem>
  columns={slipColumns}
  data={slipList}
  loading={isLoading}
  emptyText="조회된 데이터가 없습니다."
  onRowClick={handleSlipSelect}
/>

// L650 (with onRowClick)
<BaseGrid<Slip02CardItem>
  columns={slip02Columns}
  data={chaList}
  loading={isDetailLoading}
  emptyText="법인카드 결의내역이 없습니다."
  onRowClick={handleChaSelect}
/>

// L740 (NO onRowClick)
<BaseGrid<CardUsageItem>
  columns={cardUsageColumns}
  data={cardUsageList}
  loading={isCardLoading}
  emptyText="법인카드 사용내역이 없습니다. 조회 버튼을 눌러 조회하세요."
/>
```

**After**:
```tsx
import { Grid } from '@tomis/grid-core';

// L525
<Grid<CardSlipListItem>
  columns={slipColumns}
  data={slipList}
  enableSort
  enableFilter
  loading={isLoading}
  emptyText="조회된 데이터가 없습니다."
  onRowClick={handleSlipSelect}
/>

// L650
<Grid<Slip02CardItem>
  columns={slip02Columns}
  data={chaList}
  enableSort
  enableFilter
  loading={isDetailLoading}
  emptyText="법인카드 결의내역이 없습니다."
  onRowClick={handleChaSelect}
/>

// L740 (NO onRowClick — 유지)
<Grid<CardUsageItem>
  columns={cardUsageColumns}
  data={cardUsageList}
  enableSort
  enableFilter
  loading={isCardLoading}
  emptyText="법인카드 사용내역이 없습니다. 조회 버튼을 눌러 조회하세요."
/>
```

### 11.3 구현 순서 (최소 2 단계 — E-03)

1. **Step 1 — 단일 페이지 검증 (VatSchedulePage 만)**:
   - 가장 단순한 1 BaseGrid 사이트 + 5 props 페이지부터 시작.
   - L14 import 1줄 + L239 JSX 1군데 변경 (PowerShell-via-Bash 우회 — D8 + C-34).
   - `npx tsc --noEmit` (cwd = `tw-framework-front`) → 0 errors 확인.
   - dev server 띄워 VatSchedulePage 외관 확인 (sort/filter/onRowClick).
   - tsc 또는 외관 실패 시 다음 단계 진행 금지 — 원인 분석 후 spec 재검토.

2. **Step 2 — 나머지 4 페이지 일괄 변환**:
   - VatManagePage (1 사이트) + ExpenseResearchCardPage (2 사이트) + ExpenseGeneralPage (2 사이트) + ExpenseCardPage (3 사이트, onRowClick 혼재) 변환.
   - 각 파일 PowerShell `[IO.File]::ReadAllText` → `Replace` (import + 각 JSX 사이트) → `[IO.File]::WriteAllBytes` (UTF-8 BOM 미포함).
   - 한 파일 내 다중 사이트 동시 변환 — EC-01 차단.
   - 전체 5 페이지 `npx tsc --noEmit` → 0 errors.
   - 한글 텍스트 깨짐 검증 — `grep -c "조회된 데이터가 없습니다"` 등 핵심 한글 string hit 카운트 변경 전후 동일 확인.

3. **Step 3 — 검증 및 commit**:
   - AC-004 grep 검증 (`from '../../../components/tomis/Grid/BaseGrid'` 또는 `<BaseGrid` → 5 파일에서 0 hits).
   - AC-001 tsc 0 errors.
   - AC-003 dev server console.warn 0 건.
   - 단일 commit (또는 페이지별 5 commit — D-02 AC-005) 으로 PR.

### 11.4 위험 요소

| 위험 | 영향 페이지 | 완화책 |
|------|------------|--------|
| 한 파일 내 다중 BaseGrid 사이트 — 일부만 교체 시 tsc 실패 또는 AC-004 NO | ExpenseGeneral(2), ExpenseCard(3), ExpenseResearchCard(2) | EC-01 — PowerShell 정규식 또는 일괄 Replace 로 모든 `<BaseGrid<` 동시 변환. AC-004 grep 으로 0 hits 검증. |
| `onRowClick` 미사용 사이트(ExpenseCard L740, ExpenseResearchCard L637)에 일괄 추가 → 미정의 식별자 사용으로 tsc 실패 | ExpenseCard, ExpenseResearchCard | EC-02 — Section 3 표 + Section 11.1 표에서 사이트별 `onRowClick` 유무 명시. 사이트별 다른 replace string 사용 (or surgical 변환). |
| 워크트리 Edit/Write 도구 boundary 차단 → 즉시 escalate 시 1 round-trip 낭비 | 5 파일 모두 (base repo) | EC-04 + D8 + C-34 + ADR-MOD-GRID-17-001 — PowerShell-via-Bash 우회 표준 절차. `[IO.File]::WriteAllBytes` + `UTF8Encoding($false)` (BOM 미포함). |
| UTF-8 BOM 누락 또는 잘못된 인코딩 → 한글 메뉴/emptyText 깨짐 | 5 파일 모두 | MEMORY.md #32 + ADR-MOD-GRID-17-001 — `(New-Object System.Text.UTF8Encoding $false).GetBytes($content)`. 변경 후 한글 string grep hit 카운트 변경 전후 동일 확인. |
| `ColumnDef` 타입 호환 — 사용처가 `../../../types/tomis/grid` re-export 사용 | 5 페이지 모두 | EC-03 + D3 — `ColumnDef` import 는 변경하지 않음. `../../../types/tomis/grid` 의 re-export 가 `@tanstack/react-table` 의 `ColumnDef<TData>` 와 동일 type alias 이므로 tsc 통과 예상. |
| Sticky thead vs 외부 wrapper `overflowY: auto` stacking context 충돌 | 모든 9 사이트 (각각 wrapper div 사용) | EC-06 — AC-002 시각 회귀에서 sticky thead 동작 확인. 로컬 BaseGrid 도 동일 마크업이므로 회귀 확률 낮음. |
| 외관 회귀 (cell padding / row height / sort glyph / hover bg) | 5 페이지 | AC-002 시각 회귀 검증 — 9 사이트 모두 dev server 렌더 후 픽셀 비교. 로컬 BaseGrid + monorepo Grid 가 동일 TanStack API 사용 → 이론적으로 0% 회귀. |

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
  - empty state 메시지 텍스트 (한글 깨짐 검증 의무)
  - loading skeleton row 색상
  - 외부 wrapper div `style={{ height: 'Npx', overflowY: 'auto' }}` 와 sticky thead 상호작용 (EC-06)

### 12.3 빌드 검증 (C-12 의무)
- `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx tsc --noEmit` → exit 0, 0 errors.
- `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx vite build` → 빌드 성공 (lazy + 트리쉐이킹 동작 확인).

### 12.4 마이그레이션 자동 보완 (codemod)
- MOD-GRID-99-B docs Goal 에서 codemod 작성 예정. 본 Goal 은 수동/PowerShell 교체 (5 파일 × 9 사이트 = 트리비얼).
- 후속 Goal 들(G-003~G-006)이 동일 패턴으로 20 페이지 추가 변환할 때 codemod 우선순위 상승 — 본 Goal 의 변환 패턴이 codemod template 의 입력.

### 12.5 한글 깨짐 검증 (C-34 + ADR-MOD-GRID-17-001 의무)
- PowerShell-via-Bash 우회 사용 시 UTF-8 BOM 미포함 인코딩 강제.
- 변경 전후 핵심 한글 string hit 카운트 동일 확인:
  - `"조회된 데이터가 없습니다."` (3 사이트 — ExpenseGeneral L725, VatManage L463, VatSchedule L243)
  - `"지출내용을 등록하세요."` (1 사이트 — ExpenseGeneral L754)
  - `"법인카드 결의내역이 없습니다."` (1 사이트 — ExpenseCard L654)
  - `"법인카드 사용내역이 없습니다. 조회 버튼을 눌러 조회하세요."` (1 사이트 — ExpenseCard L744)
  - `"분개 내역이 없습니다."` (1 사이트 — ExpenseResearchCard L641)
  - 핵심 한글 string 합계: 9 사이트 의 emptyText 텍스트
- 변경 후 Read 도구로 변경 부위 확인 — 한글 출력 정상 여부 시각 검증.

---

## Section 13. 상용 제품화 영향

### 13.1 패키지 대상 (F-01)
- **본 Goal 의 변경 대상 = `tw-framework-front` 사용처만**. `@tomis/grid-core` / `@tomis/grid-pro-*` / `@tomis/grid-renderers` 패키지 변경 없음 (코어 변경 0).
- goals.json L7 `packageTarget: "tw-framework-front"` 일치.

### 13.2 라이선스 검증 호출 (F-02)
- **N/A** — 본 Goal 의 5 페이지는 MIT 영역(`@tomis/grid-core`) 만 사용. `@tomis/grid-pro-*` (Pro 영역) 호출 없음 (실측 Read 결과 — 5 페이지 모두 local `BaseGrid` 만 사용, ChangeTrackingGrid/RangeSelectGrid 등 Pro alias 미사용).
- 따라서 `setLicenseKey()` / `configureGridLicense()` 호출 위치 불필요 (`grid-license` 런타임 검증 적용 대상 외).

### 13.3 문서 작성 계획 (F-03)
- **본 Goal 자체는 public API 변경 0** — Docusaurus API reference 항목 추가 불필요 (C-25 의무는 grid-core 신규 API 추가 시에만 발동).
- **권장 (선택)**: MOD-GRID-99-B docs Goal 의 "마이그레이션 가이드" 챕터에 Expense* + Vat* 변환 예시 1개(ExpenseCard L740 onRowClick 미사용 패턴 — 9 사이트 중 가장 단순) 추가 권장. 본 Goal 의 implement Stage 에서 docs 추가 의무 X.
- Storybook story 신규 작성: **본 Goal 범위 외** (12.2 방법 1 참조 — 부담 대비 효과 낮음).

### 13.4 peerDependencies 정책 (F-04)
- `@tomis/grid-core` 가 `react` / `react-dom` / `@tanstack/react-table` 을 peer 로 선언 (MOD-GRID-00 G-001 + MOD-GRID-01 G-005 확정).
- tw-framework-front 의 package.json 이 이미 이 셋을 deps 로 보유 (G-001 spec Section 4.5 검증 완료) — peer 충족.
- 본 Goal 은 dependency 변경 0 → C-22 위반 없음 + peer mismatch 0.

### 13.5 semver 영향 (C-23)
- 본 Goal 은 `@tomis/grid-core` 의 public API 변경 0 → semver 영향 없음 (patch 도 아님).
- 로컬 `BaseGrid` deprecated 처리는 본 Goal 범위 외 — G-003 ~ G-006 까지 완료 후 다른 페이지 사용처 0건 확인 시 별도 cleanup Goal.
