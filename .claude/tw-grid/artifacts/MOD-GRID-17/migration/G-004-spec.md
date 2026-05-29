# G-004 Spec: account 잔여 4 페이지 마이그레이션 (MyNotification 제외)

**Goal**: MOD-GRID-17 / migration / G-004
**Priority**: P0 | **Migration Impact**: high | **Threshold**: 95
**Package Target**: `tw-framework-front` (사용처 마이그레이션 — `@tomis/grid-core` 코어 변경 없음)
**License Tier**: N/A (MIT 영역만 사용)

---

## ★ 사전 결정 표 (D# — Spec Writer 권위)

| D# | 결정 | 사유 | goals.json 영향 |
|----|------|------|----------------|
| D1 | **MyNotificationPage 본 Goal 범위 제외 (Goal 전제 불일치)**. Goal prompt 는 5 파일(account 4 + MyNotification 1) 마이그레이션 가정. 그러나 Read 결과: MyNotificationPage 는 `BaseGrid` 미사용 — `DataTable` (`'../../components/DataTable'` L16) 컴포넌트 사용. Grep `BaseGrid` 0 hits 확인. 본 Goal 의 최종 implementFiles = **4 파일 (account 한정)**. MyNotification 의 `DataTable` → `@tomis/grid-core` 마이그레이션은 별도 모듈/Goal 책임 (discover 단계 goals.json 갱신 권장). | C-1 Read-then-Write + C-27 spec authority — prompt 와 코드 실측 충돌 시 코드 실측 우선. spec 본문 = 권위. | `affectedUsageFiles` 5 → **4** 조정 의무 (G-004 마이그레이션 4 파일). |
| D2 | 4 파일 마이그레이션 패턴 **두 그룹**:<br>**그룹 A (3 파일 — 로컬 default import)**: FinancialCarryover L8 + SettlementSummary L8 + MonthlySettlement L8 모두 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` (default). 신규: `import { Grid } from '@tomis/grid-core';`. **G-001/G-002/G-003 cascading 패턴**.<br>**그룹 B (1 파일 — monorepo legacy named import)**: AdminSlipEdit L15 `import { BaseGrid } from '@tomis/grid-core/legacy';` (named, monorepo legacy sub-entry). 신규: `import { Grid } from '@tomis/grid-core';`. **G-001~G-003 어디에도 없는 새 패턴 — 본 G-004 첫 등장**. | 두 import shape 다름: default vs named, 출처 경로 다름 — 한 PowerShell `Replace` 패턴으로 일괄 매칭 불가. 사이트별 surgical 변환. | N/A |
| D3 | `<Grid>` props 매핑 = `enableSort` + `enableFilter` + `loading` + `emptyText` + `onRowClick`(필요 사이트만). 5 BaseGrid 호출 사이트 각각의 현 시그니처를 surgical 매핑. **`enablePagination` 미사용 + `rowSelection` 미사용 + `className` 미사용** (4 파일 5 사이트 어느 곳도 사용 안 함 — 실측 Grep). | G-001/G-002/G-003 의 매핑 표준 그대로 따름. AdminSlipEdit L593+L605 2 사이트 + Carryover L203 + Summary L254 + MonthlySettlement L253 = 5 사이트. AdminSlipEdit 2 사이트 만 `onRowClick={handleGridRowClick}` 사용, 나머지 3 사이트는 onRowClick 미사용. **5 사이트 모두 className 미사용** (G-003 와 차이). | `bundleImpact.expected = "0 KB"` 유지. |
| D4 | 컬럼 정의는 **현 inline `ColumnDef<TData>[]` 유지** (createColumns 변환은 본 Goal 범위 외). `ColumnDef` import 는 4 파일 모두 `'../../../types/tomis/grid'` re-export 유지 (변경 X). | 본 Goal scope = "variant import → `<Grid>` 교체". `createColumns` 변환은 별도 후속 Goal. C-19 점진. G-001/G-002/G-003 동일 결정. | `implementFiles[4]` 그대로. |
| D5 | `affectedUsageFiles` = `implementFiles` = **4 페이지** (C-19 ≤5 준수). 5 BaseGrid 호출 사이트 = 4 파일 내부 (AdminSlipEdit 1 파일 2 호출 — 1 파일 1 import 라인). NEW 0 + MODIFY 4 = 4 파일. 사이트 분포: AdminSlipEdit 2 + FinancialCarryover 1 + SettlementSummary 1 + MonthlySettlement 1 = 5. | 본 Goal 은 사용처 마이그레이션 전용 — 새 NEW 파일 0건, MODIFY 4건. D1 (MyNotification 제외) 반영. | `affectedUsageFiles[4]` 일치. |
| D6 | Section 9 의존성 = "변경 없음". `@tomis/grid-core` workspace alias 는 `vite.config.ts` L18 + `tsconfig.app.json` L23 에서 이미 wiring 완료. **`@tomis/grid-core/legacy` sub-entry** 는 `tsconfig.app.json` L24 에서 wiring (AdminSlipEdit 현재 사용 중인 import 경로 — 본 Goal 에서 제거함). | 신규 dep 추가 0건. C-22 peerDeps 영향 0. ADR-MOD-GRID-17-002 의무 (B-04 sub-rule) 충족. | `bundleImpact.package = "tw-framework-front"` 일치. |
| D7 | Section 2 의 `<Grid>` props interface 인용 = `grid-core/src/types.ts` `GridProps<TData>` 의 실제 정의 (G-001~G-003 spec L2-3 동일). 사용처는 그 중 `data` / `columns` / `enableSort` / `enableFilter` / `onRowClick` / `loading` / `emptyText` 7 개 props 부분집합 사용 (사이트별 실제 사용 props 는 4~5 종 — 본 Goal `className` 미사용). | C-1 Read-then-Write 준수 + spec authoritative. G-003 spec Section 2.1 의 8개 props 부분집합 (− className). | N/A |
| D8 | 페이지별 마이그레이션 액션 = `direct 교체` (4 페이지 모두 동일 액션, AdminSlipEdit 는 한 파일 내 2 사이트 동시 변환). 페이지별 PR 분리는 AC-005 (D-02) 별도 처리. 본 spec 의 implement Stage 는 단일 commit 으로 일괄 4 파일 변경 + verifier 가 외관/tsc 통합 검증. | 호환성 정책 D-02 (페이지 단위 PR). | N/A |
| D9 | 워크트리 경계 우회 — Implementer Agent 는 C-34 + ADR-MOD-GRID-17-001 의 PowerShell-via-Bash 우회 표준 절차 따른다. 출력 파일 (`.tsx`) UTF-8 BOM **미포함** 의무 (한글 메뉴/empty text 깨짐 방지). | 4 파일 모두 base repo (`tw-framework-front/`) 에 위치 → 워크트리 Edit/Write 도구가 boundary 차단. ADR-MOD-GRID-17-001 + C-34 cascading 적용. | N/A |
| D10 | 한국어 리터럴 매칭 시 `.ps1` 스크립트 파일 자체에 BOM (`0xEF 0xBB 0xBF`) **prepend 의무** (C-35 + ADR-MOD-GRID-17-004 cascade). 5 사이트 중 한국어 emptyText 5 종 ("차변 내역이 없습니다.", "대변 내역이 없습니다.", "검색된 자료가 없습니다.", "조회 버튼을 클릭하세요.", "차대 불일치 전표가 없습니다.") + 동일 텍스트 "검색된 자료가 없습니다." 2 회 → 스크립트 BOM 누락 시 G-002 1차 `MISS` 패턴 재발. | C-35 + ADR-MOD-GRID-17-004 (G-002 self-review 작성). 출력 파일 BOM 금지(D9)와 정반대 방향 — 양방향 매트릭스 명시. | N/A |

**Verifier 자가-검산 (G-01 + E-06 cross-check)**: 합계 10 D# 결정. NEW 0 + MODIFY 4 = 총 4 파일. Section 7 표 4 행 + Section 11.1 표 4 행. breakdown(NEW 0 / MODIFY 4 / 파일 이름) 본문/AC/Section 7 모두 1:1 매칭. 5 BaseGrid 호출 사이트 분포: AdminSlipEdit 2 + FinancialCarryover 1 + SettlementSummary 1 + MonthlySettlement 1 = 5. Section 3 표 + Section 11.1 표에 5 사이트 모두 enumerate. **D1 (MyNotification 제외)** spec 본문 모든 섹션에 1:1 반영 — Section 1 L0 5 파일이 아닌 4 파일 발췌, Section 7 표 4 행, Section 11 4 파일.

---

## Section 1. 참조 추적 (Reference Tracking)

### L0 — tw-framework-front 현 구현 (실측 Read + Grep 결과)

영향 사용처 4개 페이지의 grid 사용 패턴 (모두 실측 Read + Grep 완료). 5개 `<BaseGrid>` 호출 사이트 enumerate. **MyNotificationPage 는 D1 결정으로 제외 — BaseGrid 미사용 (`DataTable` 사용, Grep `BaseGrid` 0 hits 확인)**.

**L0-1: `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/AdminSlipEditPage.tsx`** (863 줄)
- L15: `import { BaseGrid } from '@tomis/grid-core/legacy';` — **monorepo legacy named import (★ 본 모듈 첫 등장 패턴 — G-001~G-003 의 default import 와 다름)**
- L16: `import type { ColumnDef } from '../../../types/tomis/grid';`
- L593-599 (차변 그리드 — 사이트 #1):
  ```tsx
  <BaseGrid<Slip02ListItem>
    columns={slipGridColumns}
    data={chaRows}
    loading={false}
    emptyText="차변 내역이 없습니다."
    onRowClick={handleGridRowClick}
  />
  ```
- L605-611 (대변 그리드 — 사이트 #2):
  ```tsx
  <BaseGrid<Slip02ListItem>
    columns={slipGridColumns}
    data={daeRows}
    loading={false}
    emptyText="대변 내역이 없습니다."
    onRowClick={handleGridRowClick}
  />
  ```
- props 사용 (5 종 — 양 사이트 동일): `columns`, `data`, `loading`, `emptyText`, `onRowClick` (`className` **미사용**)
- **★ 본 페이지 2 사이트 — 한 파일 내 다중 호출 (G-003 EtaxReceive 2 사이트 패턴과 유사)**

**L0-2: `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/FinancialCarryoverPage.tsx`** (215 줄)
- L8: `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` — **local default import (G-001~G-003 패턴)**
- L9: `import type { ColumnDef } from '../../../types/tomis/grid';`
- L203-208 (전기이월 재무제표 — 1 사이트):
  ```tsx
  <BaseGrid<CarryoverItem>
    columns={CARRYOVER_COLUMNS}
    data={list}
    loading={isLoading}
    emptyText={hasSearched ? '검색된 자료가 없습니다.' : '조회 버튼을 클릭하세요.'}
  />
  ```
- props 사용 (4 종): `columns`, `data`, `loading`, `emptyText` (`onRowClick` / `className` 미사용)
- **★ `emptyText` 가 삼항 표현식 — 한국어 리터럴 2 종 ("검색된 자료가 없습니다." + "조회 버튼을 클릭하세요.")**

**L0-3: `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/SettlementSummaryPage.tsx`** (266 줄)
- L8: `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` — **local default import**
- L9: `import type { ColumnDef } from '../../../types/tomis/grid';`
- L254-259 (차대 불일치 전표 — 1 사이트):
  ```tsx
  <BaseGrid<ChadaeBalanceItem>
    columns={CHADAE_COLUMNS}
    data={chadaeList}
    loading={isLoadingChadae}
    emptyText="차대 불일치 전표가 없습니다."
  />
  ```
- props 사용 (4 종): `columns`, `data`, `loading`, `emptyText` (`onRowClick` / `className` 미사용)

**L0-4: `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/MonthlySettlementPage.tsx`** (265 줄)
- L8: `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` — **local default import**
- L9: `import type { ColumnDef } from '../../../types/tomis/grid';`
- L253-258 (월별결산 연이월 — 1 사이트):
  ```tsx
  <BaseGrid<CarryoverItem>
    columns={CARRYOVER_COLUMNS}
    data={carryoverItems}
    loading={isLoadingList}
    emptyText="검색된 자료가 없습니다."
  />
  ```
- props 사용 (4 종): `columns`, `data`, `loading`, `emptyText` (`onRowClick` / `className` 미사용)
- **★ L0-2 FinancialCarryover 와 `CarryoverItem` 타입 + `CARRYOVER_COLUMNS` 식별자 이름 동일 (서로 다른 파일 내부 정의 — 각 파일 별도 declaration). emptyText 도 "검색된 자료가 없습니다." 동일.**

**L0-5 (제외 — D1)**: ~~`D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/MyNotification/MyNotificationPage.tsx`~~ — Read 결과 (485 줄), Grep `BaseGrid` **0 hits**. L16: `import { DataTable, ButtonInfo, RowActionInfo, AdditionalRowActionInfo, ButtonInfoInitialize, RowActionInfoInitialize } from '../../components/DataTable';`. L455: `<DataTable data={dataList} pageingInfo={pagingInfo} columnInfos={columnInfos} ... />`. **본 페이지의 그리드 컴포넌트는 `DataTable` (별도 컴포넌트) — `@tomis/grid-core` 의 `Grid` 와 직접 호환 X. D1 결정으로 본 Goal 제외, 별도 모듈/Goal 책임.**

**호출 사이트 합계: 5 (AdminSlipEdit 2 + FinancialCarryover 1 + SettlementSummary 1 + MonthlySettlement 1)**

### L1 — TanStack v8 API
- **N/A** (본 Goal 은 TanStack API 변경 없음 — grid-core wrapper 만 교체). 사용처는 `import type { ColumnDef } from '../../../types/tomis/grid'` 유지 (D4).

### L2 — 공통 컴포넌트 (`@tomis/grid-core`)

L2-1: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` L2 export:
```ts
export { Grid } from './Grid';
```
+ legacy alias 5종 export 확인 (G-003 L2-1 동일). **AdminSlipEdit 가 사용 중인 `@tomis/grid-core/legacy` 의 `BaseGrid` named export 는 본 Goal 에서 제거 대상** (`Grid` 로 교체).

L2-2: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/Grid.tsx` (G-001~G-003 spec L2-2 동일):
```tsx
export const Grid = forwardRef(GridInner) as <TData>(
  props: GridProps<TData> & { ref?: Ref<GridHandle<TData>> },
) => ReactElement;
```

L2-3: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` `GridProps<TData>` (G-001~G-003 spec L2-3 동일 — 11개 props 부분 인용):
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

L2-4: 로컬 `BaseGrid` 컴포넌트 (`D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/BaseGrid.tsx`) — G-002/G-003 L2-4 검증 결과 재인용: 로컬 BaseGrid 가 내부에서 `useReactTable` + `getCoreRowModel` + `getSortedRowModel` + `getFilteredRowModel` + `getPaginationRowModel` 직접 호출. 그룹 A (3 파일) 가 이 로컬 사본 사용 중.

L2-5 (NEW — 본 G-004 신규 확인): **monorepo legacy `BaseGrid` named export** (`D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/legacy/index.ts` 또는 `legacy/BaseGrid.tsx`) — AdminSlipEdit 가 사용 중 (`@tomis/grid-core/legacy` 의 `BaseGrid` named). 본 export 는 G-001~G-003 의 L2-4 (로컬 사본) 와 별개로 monorepo 내부 legacy alias. 신규 `Grid` 와 props 시그니처 동일 영역(`columns`/`data`/`loading`/`emptyText`/`onRowClick`)이며, 내부 구현은 `Grid` 와 호환되는 동치 wrapper 로 추정 (G-001 spec L2-4 매핑 표 동일 적용). 본 Goal 에서 AdminSlipEdit 의 import 만 제거 — legacy export 자체는 보존 (다른 모듈 잠재 사용).

### L3 — 영향 사용처 카운트 = **4 파일** (4/4, C-19 준수)

`canonical-modules.json` MOD-GRID-17 affectedUsageFiles 중 account/AdminSlipEdit + FinancialCarryover + SettlementSummary + MonthlySettlement 4건 (MyNotification 제외 — D1). 정확한 경로 4개 (Section 8.1 동일).

### R-A / R-W — N/A
- 본 Goal 은 신규 API 설계가 아닌 **사용처 마이그레이션** — AG Grid / Wijmo 동등 기능 참조 불필요.

---

## Section 2. API 계약 (TypeScript Interface)

본 Goal 은 신규 API 정의가 없음 — `@tomis/grid-core` 의 기존 `GridProps<TData>` 를 사용처에서 호출만 한다.

### 2.1 호출할 인터페이스 (`grid-core/src/types.ts` 실측 인용 — G-001~G-003 spec L2-3 동일)

본 Goal 의 4 페이지에서 사용할 `GridProps<TData>` 의 7개 props 부분집합 (D7):

```ts
export interface GridProps<TData> {
  // ─── 필수 ───
  data: TData[];                                        // required
  columns: ColumnDef<TData, unknown>[];                 // required

  // ─── enable* 토글 (본 Goal: 5 사이트 모두 활성) ───
  enableSort?: boolean;                                 // default false → 본 Goal: true (전 사이트)
  enableFilter?: boolean;                               // default false → 본 Goal: true (전 사이트)

  // ─── 이벤트 (본 Goal: 2 사이트 사용 — AdminSlipEdit 차변 + 대변) ───
  onRowClick?: (row: TData, event: MouseEvent<HTMLTableRowElement>) => void;
  // AdminSlipEdit L593, AdminSlipEdit L605

  // ─── 표시 ───
  emptyText?: string;                                   // 5 사이트 모두 명시
  loading?: boolean;                                    // 5 사이트 모두 명시
  // (className: 본 Goal 의 5 사이트 어느 곳도 미사용 — G-003 와 차이)
}
```

**미사용 props (본 Goal 의 4 파일):**
- `enablePagination`: 미사용 (5 사이트 어느 곳도 pagination prop 사용 안 함 — 실측 Grep)
- `rowSelection`: 미사용 (5 사이트 어느 곳도 rowSelection prop 사용 안 함 — 실측 Grep)
- `pagination`: 미사용
- `className`: 미사용 (5 사이트 모두 미사용 — G-003 의 Cash\* 2 사이트만 사용했던 패턴과 차이)
- 기타 30+ optional props: default 유지

**사이트별 props 사용 매트릭스 (5 사이트 × 7 props):**

| 사이트 | data | columns | loading | emptyText | onRowClick | className | enableSort | enableFilter |
|--------|------|---------|---------|-----------|------------|-----------|------------|--------------|
| AdminSlipEdit L593 (차변) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | → 추가 | → 추가 |
| AdminSlipEdit L605 (대변) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | → 추가 | → 추가 |
| FinancialCarryover L203 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | → 추가 | → 추가 |
| SettlementSummary L254 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | → 추가 | → 추가 |
| MonthlySettlement L253 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | → 추가 | → 추가 |

### 2.2 export 경로 (D7 + L2-1)

```ts
// 사용처 마이그레이션 최종 import 라인 (4 파일 모두 동일):
import { Grid } from '@tomis/grid-core';
import type { ColumnDef } from '../../../types/tomis/grid';
// (D4: ColumnDef import 경로는 변경하지 않음 — local re-export 유지)
```

### 2.3 사용 예시 코드 (최소 2개 — 본 Goal 의 실측 시나리오)

**예시 1 (onRowClick 사용, className 미사용 — AdminSlipEdit 2 사이트 공통 패턴):**
```tsx
import { Grid } from '@tomis/grid-core';
import type { ColumnDef } from '../../../types/tomis/grid';

<Grid<Slip02ListItem>
  columns={slipGridColumns}
  data={chaRows}
  enableSort
  enableFilter
  loading={false}
  emptyText="차변 내역이 없습니다."
  onRowClick={handleGridRowClick}
/>
```

**예시 2 (props 최소 패턴 — FinancialCarryover + SettlementSummary + MonthlySettlement 3 사이트 공통):**
```tsx
import { Grid } from '@tomis/grid-core';
import type { ColumnDef } from '../../../types/tomis/grid';

<Grid<CarryoverItem>
  columns={CARRYOVER_COLUMNS}
  data={list}
  enableSort
  enableFilter
  loading={isLoading}
  emptyText={hasSearched ? '검색된 자료가 없습니다.' : '조회 버튼을 클릭하세요.'}
/>
```

**예시 3 (단순 4 props 패턴 — SettlementSummary L254):**
```tsx
import { Grid } from '@tomis/grid-core';
import type { ColumnDef } from '../../../types/tomis/grid';

<Grid<ChadaeBalanceItem>
  columns={CHADAE_COLUMNS}
  data={chadaeList}
  enableSort
  enableFilter
  loading={isLoadingChadae}
  emptyText="차대 불일치 전표가 없습니다."
/>
```

### 2.4 기본값 / optional 명시
- `data`, `columns` = **required** (위 두 props 만 필수, 5 사이트 모두 명시됨)
- 그 외 5 종 props (`enableSort`, `enableFilter`, `loading`, `emptyText`, `onRowClick`) 는 모두 **optional** — 미사용 = TanStack 기본 동작
- `emptyText` default `'데이터가 없습니다.'` (Grid.tsx `DEFAULT_EMPTY_TEXT`)
- `enableSort` default false → 본 Goal 은 모든 5 사이트에서 `enableSort` boolean attribute 형태로 활성화 (이전 BaseGrid 가 내부적으로 항상 sort 활성)

### 2.5 ref API — N/A (B-05)
본 Goal 의 4 페이지 어느 곳도 `gridRef` 또는 `useRef<GridHandle<T>>` 사용 없음 (Read 결과 confirmed — AdminSlipEdit L456 `initRef = useRef(false)` 는 초기화 ref 로 BaseGrid 와 무관). `GridHandle<TData>` 미사용. B-05 = N/A.

---

## Section 3. 기존 사용처 대응표 ⭐ (tw-grid 특화)

| 페이지 | 기존 import / 사용 패턴 (라인) | 신규 API 대응 | 마이그레이션 액션 |
|--------|------------------------------|-------------|------------------|
| **AdminSlipEditPage.tsx** | L15 `import { BaseGrid } from '@tomis/grid-core/legacy';` (★ named import — monorepo legacy)<br>L593-599 `<BaseGrid<Slip02ListItem> columns data loading emptyText onRowClick />` (차변)<br>L605-611 `<BaseGrid<Slip02ListItem> columns data loading emptyText onRowClick />` (대변) | `import { Grid } from '@tomis/grid-core';`<br>L593 → `<Grid<Slip02ListItem> columns data enableSort enableFilter loading emptyText onRowClick />`<br>L605 → `<Grid<Slip02ListItem> columns data enableSort enableFilter loading emptyText onRowClick />` | **direct 교체** (import 1 라인 + 2 JSX 사이트 동기). **★ 그룹 B — named import 패턴 (G-001~G-003 default import 와 다름, 본 모듈 첫 등장)** |
| **FinancialCarryoverPage.tsx** | L8 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` (default — local)<br>L203-208 `<BaseGrid<CarryoverItem> columns data loading emptyText />` (emptyText 가 삼항식) | `import { Grid } from '@tomis/grid-core';`<br>L203 → `<Grid<CarryoverItem> columns data enableSort enableFilter loading emptyText />` (삼항식 보존) | **direct 교체** (import 1 라인 + 1 JSX 사이트). **그룹 A — G-001~G-003 cascading 패턴** |
| **SettlementSummaryPage.tsx** | L8 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` (default — local)<br>L254-259 `<BaseGrid<ChadaeBalanceItem> columns data loading emptyText />` | `import { Grid } from '@tomis/grid-core';`<br>L254 → `<Grid<ChadaeBalanceItem> columns data enableSort enableFilter loading emptyText />` | **direct 교체** (import 1 라인 + 1 JSX 사이트). **그룹 A** |
| **MonthlySettlementPage.tsx** | L8 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` (default — local)<br>L253-258 `<BaseGrid<CarryoverItem> columns data loading emptyText />` | `import { Grid } from '@tomis/grid-core';`<br>L253 → `<Grid<CarryoverItem> columns data enableSort enableFilter loading emptyText />` | **direct 교체** (import 1 라인 + 1 JSX 사이트). **그룹 A** |

**4/4 행 모두 작성. C-19 ≤5 준수**. 5 BaseGrid 호출 사이트 모두 enumerate (4 파일 합계). 외관 100% 보존 — 로컬/monorepo legacy BaseGrid 모두 내부 `useReactTable` + `getSortedRowModel` + `getFilteredRowModel` 동치 (G-002/G-003 L2-4/L2-5 검증 재인용).

**★ MyNotificationPage 행 미포함** (D1) — `DataTable` 컴포넌트 사용 (Section 1 L0-5 인용). 대응표에서 명시적으로 제외. C-30 + E-06 prose ↔ structured form 일치 — D1 본문 결정과 Section 3 표 행수(4) 일치.

---

## Section 4. 호환성 정책

### 4.1 Breaking change
- **`breaking: false`** (goals.json 동일 패턴 G-001/G-002/G-003 따름)
- 로컬 `BaseGrid` 컴포넌트 (`src/components/tomis/Grid/BaseGrid.tsx`) 자체는 **본 Goal 에서 제거하지 않음**. 다른 페이지가 아직 사용 중일 가능성 — 그룹 A 3 페이지에서만 import 제거.
- monorepo `@tomis/grid-core/legacy` 의 `BaseGrid` named export 도 **본 Goal 에서 제거하지 않음** — AdminSlipEdit 1 페이지에서만 import 제거.
- `@tomis/grid-core` 의 `Grid` export 는 안정 (MOD-GRID-01 G-001 ~ G-005 완료).

### 4.2 Deprecation 전략 (C-6 + C-23)
- 로컬 `BaseGrid` 는 **1 minor 버전 유지** (다른 페이지들이 점진 마이그레이션 후 제거 검토).
- monorepo legacy `BaseGrid` named export 도 1 minor 유지.
- 본 Goal 후속 효과: 4 페이지에서 import 제거 완료 → 누적 마이그레이션 완료 페이지: G-001 5 + G-002 5 + G-003 5 + G-004 4 = **19 페이지**.
- G-005/G-006 까지 완료 + 잔여 BaseGrid 사용처 0건 확인 시 별도 cleanup Goal 에서 legacy 제거 검토 가능.

### 4.3 영향 사용처 마이그레이션 경로 (3 단계 — Section 11.3 와 동기)
1. **단계 1**: import 라인 교체 — 4 파일 각각:
   - 그룹 A (3 파일): `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` 제거, `import { Grid } from '@tomis/grid-core';` 추가
   - 그룹 B (1 파일 AdminSlipEdit): `import { BaseGrid } from '@tomis/grid-core/legacy';` 제거, `import { Grid } from '@tomis/grid-core';` 추가
2. **단계 2**: JSX 호출 사이트 교체 — 4 파일 내 5 사이트 모두 `<BaseGrid<T>` → `<Grid<T> enableSort enableFilter`. (AdminSlipEdit 한 파일 2 사이트 동시 변환 필수)
3. **단계 3**: `npx tsc --noEmit` 0 errors 확인 → 외관 회귀 검증 (C-17).

### 4.4 console warning 정책 (AC-003 + C-23)
- 로컬 `BaseGrid` 는 `useDeprecationWarn` 호출 없음 (G-002/G-003 L2-4 검증). 본 Goal 완료 후에도 console warning 영향 없음.
- monorepo legacy `BaseGrid` named export 의 deprecation warning 여부는 별도 확인 — 본 Goal 의 import 제거 후 호출 0 회 → warning 발생 사이트 0.
- `Grid` 자체는 deprecation warning 미발생.

### 4.5 peerDependencies 정책 (C-22)
- `@tomis/grid-core` 가 `react`, `react-dom`, `@tanstack/react-table` 을 peer 로 선언 — 사용처 `tw-framework-front` 는 이미 이 셋을 deps 로 보유 (G-001~G-003 spec Section 4.5 검증 완료). 추가 작업 없음.

---

## Section 5. 인수 기준 (Acceptance Criteria with Source Tags)

5개 AC 모두 출처 태그 + binary 검증 가능. migrationImpact: **high** 표시.

| AC ID | 기준 | 출처 | binary 검증 방법 | migrationImpact |
|-------|------|------|------------------|-----------------|
| AC-001 | 4 페이지 tsc 0 errors | **L0 + C-12** | `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx tsc --noEmit` 명령 실행 → exit 0 + stderr 빈 결과 | high |
| AC-002 | 외관 보존 — 동일 데이터 입력 시 마이그레이션 전후 시각 동일 (5 사이트 모두) | **L0 + L2 + C-17** | (a) BaseGrid 양 형태(로컬 사본 + monorepo legacy named) 가 내부에서 `useReactTable + getSortedRowModel + getFilteredRowModel + getPaginationRowModel + flexRender` 호출 → monorepo `<Grid enableSort enableFilter>` 와 markup 동일 / (b) 4 페이지 각각 동일 데이터 fixture 로 마이그레이션 전후 스크린샷 캡처 후 픽셀 비교 (cell padding / row height / sort icon / hover bg / thead bg / **AdminSlipEdit 차변+대변 그리드 분할 외관 / 그리드 행 클릭 → 우측 분개행 폼 연동 검증**) | high |
| AC-003 | console warning 0 건 | **C-23** | 4 페이지 dev mode 렌더 → `console.warn` 인터셉트 시 deprecated 경고 0건 | high |
| AC-004 | variant import 0 건 (양 import 패턴 모두) | **L0 + L2 + C-6** | `grep -nE "from ['\"]@tomis/grid-core/legacy['\"]\|from ['\"](\\.\\./)+components/tomis/Grid/BaseGrid['\"]" tw-framework-front/src/pages/tomis/account/AdminSlipEditPage.tsx FinancialCarryoverPage.tsx SettlementSummaryPage.tsx MonthlySettlementPage.tsx` → 0 hits. 또한 `grep -n "<BaseGrid"` → 0 hits (4 파일). | high |
| AC-005 | 페이지 단위 PR 분리 (D-02) — 4 페이지 1 PR 또는 페이지별 commit ≥ 4 | **C-19** | git log --oneline 또는 PR description 에 4 페이지 enumerate. 단일 commit 으로 4 파일 변경도 허용. | high |

**AC source 태그 검증 (H-03 만족)**:
- L0 → Section 1 L0-1~L0-4 에서 실제 인용됨 (5 사이트 라인 인용)
- L2 → Section 1 L2-1~L2-5 에서 실제 인용됨
- C-12 → constraints.md C-12 (`npx tsc --noEmit` 0 errors 의무)
- C-17 → constraints.md C-17 (시각 회귀 검증 의무 — high impact)
- C-23 → constraints.md C-23 (semver — deprecated API 1 minor 유지)
- C-6 → constraints.md C-6 (호환성 절대)
- C-19 → constraints.md C-19 (점진 ≤5/Goal)

---

## Section 6. 엣지 케이스 (3개 이상)

본 Goal 의 실측 페이지 분석 기반 엣지 케이스 (추측 금지 — 실제 Read 결과로 식별):

**EC-01: 한 파일 내 다중 `<BaseGrid>` 사이트 — 동기 교체 필요 (AdminSlipEdit 2 사이트)**
- 출처: L0-1 (AdminSlipEdit 2 사이트 L593 + L605, 차변/대변 분리).
- 위험: implementer 가 한 사이트만 교체 → tsc 통과하나 AC-004 NO (variant import 잔존) 또는 한 사이트만 교체하면서 import 도 제거하면 tsc fail (`<BaseGrid>` 미정의).
- 처리: Section 11.1 표에 5 사이트 모두 라인 enumerate. PowerShell 우회 시 `[IO.File]::ReadAllText` 후 `Replace` 또는 정규식으로 모든 `<BaseGrid<` 일괄 교체. AC-004 grep 으로 0 hits 검증.

**EC-02: AdminSlipEdit 의 named import `@tomis/grid-core/legacy` — 그룹 A default import 와 다른 변환 패턴 (★ 본 모듈 첫 등장)**
- 출처: L0-1 L15 `import { BaseGrid } from '@tomis/grid-core/legacy';` (named) vs L0-2 L8 + L0-3 L8 + L0-4 L8 모두 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` (default).
- 위험: implementer 가 G-001~G-003 cascading 패턴 (`Replace` 정규식 `import BaseGrid from '\.\.\/\.\.\/\.\.\/components\/tomis\/Grid\/BaseGrid';`) 만 사용 → AdminSlipEdit L15 미매칭 → 패턴 매칭 `MISS` + 잔존.
- 처리: D2 결정 + Section 11.1 표에 그룹 A vs 그룹 B 분류 명시. PowerShell 우회 시 2 종 별도 `Replace` 패턴 사용:
  - 그룹 A: `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` → `import { Grid } from '@tomis/grid-core';`
  - 그룹 B: `import { BaseGrid } from '@tomis/grid-core/legacy';` → `import { Grid } from '@tomis/grid-core';`
- AC-004 grep 도 양 패턴 모두 검증 (`grep -nE` regex alternation 사용).

**EC-03: `onRowClick` props 사이트별 혼재 — props 매핑 surgical 보존 (G-002/G-003 EC-02 cascade)**
- 출처: 5 사이트 props 사용 매트릭스 (Section 2.1 표) — AdminSlipEdit 2 사이트만 `onRowClick={handleGridRowClick}`, 나머지 3 사이트는 onRowClick 미사용. **5 사이트 모두 className 미사용** (G-003 와 차이).
- 위험: implementer 가 일괄 `onRowClick={handle...}` 추가 → 미정의 식별자 사용으로 tsc 실패. 또는 일괄 `className="w-full"` 추가 → 외관 회귀 (width 변동).
- 처리: Section 3 표 + Section 11.1 표에서 `onRowClick` 유무를 사이트별로 명시. PowerShell 우회 시 each-site 다른 replace string 사용. **AdminSlipEdit 2 사이트의 onRowClick 보존**, **3 페이지의 props 추가 금지** (현 4 종 props 만 유지 + `enableSort enableFilter` 만 추가).

**EC-04: ColumnDef import 경로 — 4 파일 모두 `../../../types/tomis/grid` re-export 사용 (G-001~G-003 EC-03 cascade)**
- 출처: L0-1 L16, L0-2 L9, L0-3 L9, L0-4 L9 모두 동일.
- 위험: D4 결정으로 사용처에서 `ColumnDef` import 를 `@tanstack/react-table` 로 바꾸려 할 때 — 4 파일 모두 일관 적용 또는 어느 하나만 — drift 발생 가능.
- 처리: D4 결정 = "본 Goal 범위 외 — 현 import 경로 유지". `<BaseGrid>` → `<Grid>` 만 surgical 교체. `ColumnDef` import 는 변경하지 않는다.

**EC-05: 워크트리 경계 — 4 파일 모두 base repo 위치 → PowerShell-via-Bash 우회 필수 (C-34 + ADR-MOD-GRID-17-001)**
- 출처: 4 파일 모두 `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/` (base repo) — 워크트리 외부.
- 위험: 1차 Implementer (G-001 사례) 가 Edit/Write 도구 boundary 차단 발견 후 즉시 "진행 불가" escalate → 1 round-trip 낭비.
- 처리: D9 결정 + C-34 + ADR-MOD-GRID-17-001 의 PowerShell-via-Bash 우회 표준 절차 따른다. `[IO.File]::ReadAllText` + `Replace` + `[IO.File]::WriteAllBytes` + `UTF8Encoding($false)` (BOM 미포함). 한글 메뉴 텍스트 / `emptyText` 깨짐 검증 의무.

**EC-06: 빈 데이터 / 로딩 상태 — `loading` + `emptyText` 시각 회귀**
- 출처: 5 사이트 모두 `loading` + `emptyText` props 사용.
- 위험: 로컬/monorepo legacy BaseGrid 의 loading skeleton 스타일과 monorepo Grid 의 loading skeleton 스타일이 외관 회귀 가능 (cell padding, skeleton row 색상).
- 처리: AC-002 시각 회귀 검증 — 각 페이지 빈 데이터 상태(`isLoading=true` + `data=[]`)에서 스크린샷 비교. 차이 발견 시 spec re-spec 또는 별도 Goal 분리.

**EC-07: AdminSlipEdit 차변/대변 그리드 행 클릭 → 우측 분개행 폼 연동**
- 출처: L0-1 L593+L605 `onRowClick={handleGridRowClick}` — 행 클릭 시 우측 패널의 분개행 세부 폼이 데이터로 채워짐 (L236-253 `handleGridRowClick` 함수 — `setIsLoadingDetail(true)` → `accountApi.slip02Select` → `setDetailForm/setOriginalDetail`).
- 위험: implementer 가 `onRowClick` props 누락 → 행 클릭 동작 불가 → 분개행 세부 수정 워크플로 전체 차단.
- 처리: Section 3 표 + Section 11.1 표에 AdminSlipEdit 2 사이트 모두 `onRowClick={handleGridRowClick}` 보존 명시. AC-002 시각 회귀 시 행 클릭 → 우측 폼 데이터 채움 동작 검증.

**EC-08: 한국어 emptyText 매칭 — `.ps1` 스크립트 BOM 의무 (C-35 + ADR-MOD-GRID-17-004 cascade)**
- 출처: 5 사이트의 emptyText 한국어 리터럴 5 종 (L0-1~L0-4 인용):
  - "차변 내역이 없습니다." — AdminSlipEdit L597 (1 사이트)
  - "대변 내역이 없습니다." — AdminSlipEdit L609 (1 사이트)
  - "검색된 자료가 없습니다." — FinancialCarryover L207 (삼항식 truthy) + MonthlySettlement L257 (2 사이트, 동일 텍스트)
  - "조회 버튼을 클릭하세요." — FinancialCarryover L207 (삼항식 falsy, 1 사이트 — single ternary)
  - "차대 불일치 전표가 없습니다." — SettlementSummary L258 (1 사이트)
- **삼항식 emptyText 특수 케이스 (FinancialCarryover L207)**: `emptyText={hasSearched ? '검색된 자료가 없습니다.' : '조회 버튼을 클릭하세요.'}` — JSX expression 으로 두 한국어 리터럴 1 라인 동시 존재. PowerShell `Replace` 시 줄 단위 매칭 가능 (단일 라인 보존).
- 위험: G-002 1차 시도 `MISS` 패턴 — `.ps1` 스크립트가 BOM 없이 CP949 디코드 → UTF-8 인코딩된 `.tsx` 와 바이트 불일치 → 매칭 실패.
- 처리: D10 결정 + C-35 + ADR-MOD-GRID-17-004 — `.ps1` 스크립트 파일 BOM (`0xEF 0xBB 0xBF`) prepend 의무. **출력 파일 (`.tsx`) BOM 금지** (C-34 + D9). 두 방향 양립 명시 (스크립트 = BOM 필요, 출력 = BOM 금지).

**EC-09 (★ 본 G-004 신규): MyNotificationPage 의 `DataTable` — 별도 컴포넌트 (본 Goal 범위 제외)**
- 출처: L0-5 (제외 분석) — Grep `BaseGrid` 0 hits + L16 `DataTable` named import + L455 `<DataTable ...>` JSX.
- 위험: implementer 가 Goal prompt 의 5 파일 가정 (account 4 + MyNotification 1) 을 그대로 따라 MyNotification 도 변환 시도 → tsc 통과하더라도 `DataTable` 컴포넌트의 props 시그니처(data/pageingInfo/columnInfos/buttonInfo/...) 가 `Grid` 의 props (data/columns/enableSort/...) 와 호환되지 않아 실패. 또는 잘못된 패턴 매칭으로 의도치 않은 다른 파일 변경.
- 처리: D1 결정 + Section 1 L0-5 명시적 제외 + Section 3 표 미포함 + Section 7 표 4 행 (5 행 X). C-30 + E-06 (prose ↔ structured form) — D1 본문 결정과 모든 표·enumerate 행 수 일치.

---

## Section 7. 구현 대상 파일 (NEW / MODIFY) — 최종 implementFiles 표

**NEW: 없음.**
**MODIFY: 4 파일 (모두 사용처 페이지 — base repo).** ★ **5 파일 아님 — D1 으로 MyNotificationPage 제외**.

| # | 파일 (절대 경로) | 액션 | 변경 라인 (실측 기반) | 변경 내용 | 그룹 |
|---|-----------------|------|----------------------|----------|------|
| 1 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/AdminSlipEditPage.tsx` | MODIFY | L15 (import) + L593 + L605 (JSX 2 사이트) | monorepo legacy `BaseGrid` named import 제거 + `Grid` import 추가; `<BaseGrid<Slip02ListItem>` (×2) → `<Grid<Slip02ListItem> enableSort enableFilter` (columns/data/loading/emptyText/onRowClick 5 종 props 모두 유지, className 미사용) | **B** (★ named import 패턴, 본 모듈 첫 등장) |
| 2 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/FinancialCarryoverPage.tsx` | MODIFY | L8 (import) + L203 (JSX 1 사이트) | local `BaseGrid` default import 제거 + `Grid` import 추가; `<BaseGrid<CarryoverItem>` → `<Grid<CarryoverItem> enableSort enableFilter` (columns/data/loading/emptyText 4 종, **삼항식 emptyText 보존**) | A |
| 3 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/SettlementSummaryPage.tsx` | MODIFY | L8 (import) + L254 (JSX 1 사이트) | local `BaseGrid` default import 제거 + `Grid` import 추가; `<BaseGrid<ChadaeBalanceItem>` → `<Grid<ChadaeBalanceItem> enableSort enableFilter` (columns/data/loading/emptyText 4 종) | A |
| 4 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/MonthlySettlementPage.tsx` | MODIFY | L8 (import) + L253 (JSX 1 사이트) | local `BaseGrid` default import 제거 + `Grid` import 추가; `<BaseGrid<CarryoverItem>` → `<Grid<CarryoverItem> enableSort enableFilter` (columns/data/loading/emptyText 4 종) | A |

**★ MyNotificationPage 행 미포함** (D1). Goal prompt 5 파일 가정 → 4 파일 정정. 추가 행 없음. Section 11.1 4 행과 1:1 일치.

**합계: NEW 0 + MODIFY 4 = 4 파일** (D5 breakdown 일치).
**JSX 호출 사이트 합계: 5 (AdminSlipEdit 2 + FinancialCarryover 1 + SettlementSummary 1 + MonthlySettlement 1)**.
**변경 hunk 합계: import 4 + JSX 5 = 9 변경 라인 (대략 — JSX 라인은 multi-line 호출이므로 hunk 단위는 약 14~18 라인).**

**H-02 경로 합리성 검증**: 모든 4 파일 부모 디렉토리(`.../tw-framework-front/src/pages/tomis/account/`) 실재 — 실제 Read 도구로 4 파일 모두 라인 카운트 + 발췌 성공함 (AdminSlipEdit 863줄, FinancialCarryover 215줄, SettlementSummary 266줄, MonthlySettlement 265줄). 프로젝트 컨벤션(`tw-framework-front/src/pages/tomis/{도메인}/{모듈}Page.tsx`) 일치 (CLAUDE.md "프론트엔드 디렉토리 원칙").

---

## Section 8. 마이그레이션 영향도 Preflight ⭐

### 8.1 영향 사용처 카운트: **4/4** (1 Goal ≤ 5 — C-19 준수)

4 파일 전체 경로:
1. `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/AdminSlipEditPage.tsx` (그룹 B)
2. `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/FinancialCarryoverPage.tsx` (그룹 A)
3. `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/SettlementSummaryPage.tsx` (그룹 A)
4. `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/MonthlySettlementPage.tsx` (그룹 A)

**제외 (D1)**: ~~`D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/MyNotification/MyNotificationPage.tsx`~~ — BaseGrid 미사용 (DataTable 사용). Goal prompt 5 파일 가정 → 실측 4 파일로 보정. discover 단계에서 goals.json `affectedUsageFiles` 갱신 권장 (5 → 4).

### 8.2 무파괴 검증 방법
- **빌드 검증 (자동)**: `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx tsc --noEmit` → exit 0
- **추가 검증 (자동)**: `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx vite build` → 빌드 성공
- **외관 보존 (수동 — Chromatic 미도입 환경)**: 4 페이지 각각 dev server (`npm run dev`) 에서 동일 데이터 fixture 로 마이그레이션 전/후 스크린샷 캡처 후 픽셀 비교. 확인 대상: cell padding(`px-4 py-3`), row height, sort glyph(▲/▼/⇅), thead bg-gray-50, hover bg-gray-50, sticky thead 동작, loading skeleton, emptyText 메시지, **AdminSlipEdit 차변+대변 분할 그리드 외관 + 행 클릭 → 우측 폼 연동 검증 (EC-07)**.
- **외관 동등성 근거 (이론적)**: 양 BaseGrid 형태(로컬 사본 + monorepo legacy named) 가 모두 내부에서 `useReactTable + getCoreRowModel + getSortedRowModel + getFilteredRowModel + getPaginationRowModel + flexRender` 호출 → monorepo `<Grid enableSort enableFilter>` 와 같은 TanStack 표준 API 출력 동치 (G-002/G-003 L2-4 검증 재인용).

### 8.3 점진 마이그레이션 vs 일괄 전환
- 본 Goal = **일괄 4 페이지 전환** (C-19 ≤5 충족). 다른 사용처 (hr/*, payroll/*, admin/* 등 잔여 페이지)는 G-005~G-006 별도 Goal 에서 처리.

### 8.4 롤백 전략
- 로컬 `BaseGrid` 컴포넌트 자체가 보존됨 (`src/components/tomis/Grid/BaseGrid.tsx` 삭제 X) — 그룹 A 3 페이지에서 즉시 되돌릴 수 있음.
- monorepo `@tomis/grid-core/legacy` 의 `BaseGrid` named export 도 보존 — 그룹 B AdminSlipEdit 1 페이지에서 즉시 되돌릴 수 있음.
- **롤백 방법 1**: `git revert <commit-sha>` — 단일 commit 변경이므로 surgical 롤백 가능.
- **롤백 방법 2 (BaseGrid 재도입)**: 각 페이지에서 import 라인 복원 + JSX `<Grid enableSort enableFilter ...>` → `<BaseGrid ...>` 로 surgical 되돌리기. 그룹 A 는 default import 형태, 그룹 B 는 named import 형태로 복원.

### 8.5 번들 크기 영향
- **0 KB** (C-21 충족). 사용처 마이그레이션 — 새 의존성 추가 0. `@tomis/grid-core` 는 이미 (G-001~G-003 으로) tw-framework-front 의 15 페이지에서 import 됨 → 본 Goal 추가 4 페이지는 트리쉐이킹 영향 없음.
- 로컬 `BaseGrid.tsx` + monorepo legacy `BaseGrid` 자체는 본 Goal 에서 삭제하지 않음 → 번들 변동 0.

### 8.6 alias 해결 경로 (B-04 의무 — 사용처 마이그레이션 Goal)

`@tomis/grid-core` import 의 해결 경로 (실측 Grep 결과 — Read 도구 사용):

1. **vite.config.ts alias** (`D:/project/topvel_project/TOMIS/tw-framework-front/vite.config.ts` L18):
   ```ts
   '@tomis/grid-core': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-core/src'),
   ```
2. **tsconfig.app.json paths** (`D:/project/topvel_project/TOMIS/tw-framework-front/tsconfig.app.json` L23-24):
   ```json
   "@tomis/grid-core": ["../../topvel-grid-monorepo/packages/grid-core/src"],
   "@tomis/grid-core/legacy": ["../../topvel-grid-monorepo/packages/grid-core/src/legacy"],
   ```
   (L24 legacy sub-entry 가 AdminSlipEdit L15 의 `@tomis/grid-core/legacy` 해결 경로 — **본 Goal 에서 제거됨**)
3. **alias source target**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` L2 의 `export { Grid } from './Grid';`

**검증 방법**: `npx tsc --noEmit` 통과 시 tsconfig paths 정상 resolution 입증 (그룹 A 3 파일 + 그룹 B AdminSlipEdit 1 파일 모두). `vite build` 통과 시 vite alias 정상 resolution 입증. ADR-MOD-GRID-17-002 의무 충족 (B-04 sub-rule).

### 8.7 base repo 여부 (A-04 의무) + 워크트리 경계 우회 + 스크립트 BOM 매트릭스

- **4 파일 모두 `tw-framework-front/` (base repo, gitignored)** — 워크트리(`D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/`) 외부.
- 워크트리 Edit/Write 도구가 base repo 변경에 대해 boundary 차단 가능 (`"This background session hasn't isolated its changes yet"`).
- **C-34 + ADR-MOD-GRID-17-001 PowerShell-via-Bash 우회 적용 의무** — D9 결정 + EC-05 처리 참조.
- **C-35 + ADR-MOD-GRID-17-004 `.ps1` 스크립트 BOM 적용 의무** — D10 결정 + EC-08 처리 참조.
- artifacts metadata (워크트리 내부 `.claude/tw-grid/artifacts/MOD-GRID-17/migration/G-004-*`) 은 정상 Edit/Write 도구 사용.

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
- `@tomis/grid-core/legacy` sub-entry alias 는 `tsconfig.app.json` L24 에 wiring 완료 — 본 Goal 에서 AdminSlipEdit 의 import 제거 후 해당 sub-entry 호출 0 (단, alias 라인 자체는 보존 — 다른 페이지 잠재 사용).
- `react`, `react-dom`, `@tanstack/react-table` peer dependencies 는 `tw-framework-front` 의 package.json 에서 이미 보유 (G-001~G-003 spec Section 9 검증 완료).
- `@tomis/grid-core` 의 package.json `main`/`exports` 는 monorepo MOD-GRID-00 G-001 에서 wiring 완료 (`packages/grid-core/src/index.ts` export L2 `Grid` 검증됨).

---

## Section 10. 사용자 여정 매핑

### 10.1 개발자 관점 (5 단계)
1. **식별**: 4 페이지의 grid 사용 라인 확인 (실제 Section 1 L0-1~L0-4 + 5 사이트 라인 명시 완료). **MyNotification 은 BaseGrid 미사용 확인 후 제외 (L0-5)**.
2. **import 라인 교체**: 4 파일 각각:
   - 그룹 A (3 파일): local `BaseGrid` default import 제거, `import { Grid } from '@tomis/grid-core';` 추가
   - 그룹 B (1 파일 AdminSlipEdit): monorepo legacy `BaseGrid` named import 제거, `import { Grid } from '@tomis/grid-core';` 추가
3. **JSX 호출 교체**: 5 사이트 모두 `<BaseGrid<T>` → `<Grid<T> enableSort enableFilter` (AdminSlipEdit 2 사이트 동시 변환). PowerShell 우회로 일괄 처리 + `.ps1` 스크립트 BOM prepend.
4. **tsc 통과 확인**: `cd tw-framework-front && npx tsc --noEmit` → 0 errors.
5. **외관 보존 확인**: dev server 렌더 + 4 페이지 스크린샷 비교. **AdminSlipEdit 차변+대변 + 행 클릭 → 우측 폼 연동 검증 의무 (EC-07)**.

### 10.2 최종 사용자 관점 (외관 동등)
- **rows/columns 표시**: 100% 동일 (양 BaseGrid 형태 + monorepo Grid 모두 TanStack v8 표준 API 사용 — DOM 출력 동치).
- **인터랙션**: 클릭(onRowClick — 2 사이트: AdminSlipEdit 차변+대변) 동작 동일 → 우측 분개행 세부 폼 데이터 채움 정상. 소트(enableSort — 5 사이트 모두 활성) 동일. 필터(enableFilter — 5 사이트 모두 활성) 동일.
- **빈 상태**: `emptyText` 그대로 (5 사이트 모두 자체 한국어 메시지 명시 — BOM 매트릭스로 깨짐 차단). FinancialCarryover 의 삼항식 emptyText (조건부 메시지) 보존.
- **로딩 skeleton**: `loading={true}` 시 skeleton row 표시 (BaseGrid 와 동일).
- **응답 시간**: 동일 컴포넌트 호출이므로 ±0%.
- **분할 그리드 (AdminSlipEdit)**: 차변({chaRows.length}건) + 대변({daeRows.length}건) 분할 외관 유지. 행 클릭 시 우측 분개행 세부 수정 폼이 데이터로 채워지는 워크플로 동일.

---

## Section 11. 구현 계획

### 11.1 파일별 변경 명세 (Section 7 표을 11 단계 sampling 한 결과 — E-01 cross-check)

| 파일 | 액션 | Step 1 (import) | Step 2 (JSX 사이트) | 영향 받는 컬럼/props | 그룹 |
|------|------|-----------------|----------------------|----------------------|------|
| AdminSlipEditPage.tsx | MODIFY | L15 변경 (named import → 신규 import) | L593 (차변, 1 사이트), L605 (대변, 1 사이트) | 양 사이트 모두 columns, data, loading, emptyText, onRowClick (className 미사용) | **B** |
| FinancialCarryoverPage.tsx | MODIFY | L8 변경 (default import → 신규 import) | L203 (1 사이트) | columns, data, loading, emptyText (삼항식 보존, onRowClick/className 미사용) | A |
| SettlementSummaryPage.tsx | MODIFY | L8 변경 (default import → 신규 import) | L254 (1 사이트) | columns, data, loading, emptyText (onRowClick/className 미사용) | A |
| MonthlySettlementPage.tsx | MODIFY | L8 변경 (default import → 신규 import) | L253 (1 사이트) | columns, data, loading, emptyText (onRowClick/className 미사용) | A |

**E-01 Section 7 ↔ Section 11 일관성**: 4/4 행 1:1 매칭. NEW/MODIFY 분류 4 MODIFY 일치. 5 JSX 사이트 모두 enumerate. 파일 이름 일치. 그룹 분류(A/B) 일치.

**E-06 Prose ↔ Structured Form 일관성 (D1 cascade)**: D1 본문 "MyNotificationPage 본 Goal 범위 제외" → Section 1 L0-5 명시적 제외 + Section 3 표 4 행 (5 행 X) + Section 7 표 4 행 + 본 Section 11.1 표 4 행 + Section 12 검증 4 파일. **prose↔structured 1:1 일치** — MyNotification 어디에도 변환 대상 행 미포함.

### 11.2 Before/After 코드 스니펫 (E-02 — 최소 1개)

**대표 페이지 SettlementSummaryPage.tsx (가장 단순 1 사이트, 4 종 props, 그룹 A):**

**Before** (L8, L254-259):
```tsx
// L8
import BaseGrid from '../../../components/tomis/Grid/BaseGrid';

// L254
<BaseGrid<ChadaeBalanceItem>
  columns={CHADAE_COLUMNS}
  data={chadaeList}
  loading={isLoadingChadae}
  emptyText="차대 불일치 전표가 없습니다."
/>
```

**After**:
```tsx
// L8 (변경 후)
import { Grid } from '@tomis/grid-core';

// L254 (변경 후)
<Grid<ChadaeBalanceItem>
  columns={CHADAE_COLUMNS}
  data={chadaeList}
  enableSort
  enableFilter
  loading={isLoadingChadae}
  emptyText="차대 불일치 전표가 없습니다."
/>
```

**FinancialCarryoverPage.tsx (삼항식 emptyText 보존 패턴, 그룹 A):**

**Before** (L8, L203-208):
```tsx
import BaseGrid from '../../../components/tomis/Grid/BaseGrid';

<BaseGrid<CarryoverItem>
  columns={CARRYOVER_COLUMNS}
  data={list}
  loading={isLoading}
  emptyText={hasSearched ? '검색된 자료가 없습니다.' : '조회 버튼을 클릭하세요.'}
/>
```

**After**:
```tsx
import { Grid } from '@tomis/grid-core';

<Grid<CarryoverItem>
  columns={CARRYOVER_COLUMNS}
  data={list}
  enableSort
  enableFilter
  loading={isLoading}
  emptyText={hasSearched ? '검색된 자료가 없습니다.' : '조회 버튼을 클릭하세요.'}
/>
```

**MonthlySettlementPage.tsx (단순 패턴, 그룹 A — 본 모듈 사상 동일):**

**Before** (L8, L253-258):
```tsx
import BaseGrid from '../../../components/tomis/Grid/BaseGrid';

<BaseGrid<CarryoverItem>
  columns={CARRYOVER_COLUMNS}
  data={carryoverItems}
  loading={isLoadingList}
  emptyText="검색된 자료가 없습니다."
/>
```

**After**:
```tsx
import { Grid } from '@tomis/grid-core';

<Grid<CarryoverItem>
  columns={CARRYOVER_COLUMNS}
  data={carryoverItems}
  enableSort
  enableFilter
  loading={isLoadingList}
  emptyText="검색된 자료가 없습니다."
/>
```

**AdminSlipEditPage.tsx (★ 그룹 B — named import 패턴, 본 모듈 첫 등장, 2 사이트 동기 변환):**

**Before** (L15, L593-599 + L605-611):
```tsx
// L15
import { BaseGrid } from '@tomis/grid-core/legacy';

// L593 (차변 그리드)
<BaseGrid<Slip02ListItem>
  columns={slipGridColumns}
  data={chaRows}
  loading={false}
  emptyText="차변 내역이 없습니다."
  onRowClick={handleGridRowClick}
/>

// L605 (대변 그리드)
<BaseGrid<Slip02ListItem>
  columns={slipGridColumns}
  data={daeRows}
  loading={false}
  emptyText="대변 내역이 없습니다."
  onRowClick={handleGridRowClick}
/>
```

**After**:
```tsx
// L15 (변경 후 — named import → 일반 import)
import { Grid } from '@tomis/grid-core';

// L593 (차변)
<Grid<Slip02ListItem>
  columns={slipGridColumns}
  data={chaRows}
  enableSort
  enableFilter
  loading={false}
  emptyText="차변 내역이 없습니다."
  onRowClick={handleGridRowClick}
/>

// L605 (대변)
<Grid<Slip02ListItem>
  columns={slipGridColumns}
  data={daeRows}
  enableSort
  enableFilter
  loading={false}
  emptyText="대변 내역이 없습니다."
  onRowClick={handleGridRowClick}
/>
```

### 11.3 구현 순서 (최소 2 단계 — E-03, 그룹 분리 4 단계)

1. **Step 1 — 단일 페이지 검증 (SettlementSummaryPage 만, 그룹 A)**:
   - 가장 단순한 1 BaseGrid 사이트 + 4 종 props 페이지부터 시작.
   - L8 import 1줄 + L254 JSX 1군데 변경 (PowerShell-via-Bash 우회 — D9 + C-34 + D10 스크립트 BOM).
   - `npx tsc --noEmit` (cwd = `tw-framework-front`) → 0 errors 확인.
   - dev server 띄워 SettlementSummaryPage 외관 확인 (sort/filter/loading/empty).
   - tsc 또는 외관 실패 시 다음 단계 진행 금지 — 원인 분석 후 spec 재검토.

2. **Step 2 — 그룹 A 잔여 일괄 변환 (FinancialCarryover + MonthlySettlement, 2 페이지)**:
   - FinancialCarryoverPage (1 사이트 + 삼항식 emptyText) + MonthlySettlementPage (1 사이트, FinancialCarryover 와 패턴 유사) 변환. 두 페이지 모두 `CarryoverItem` 타입 (각 파일 내부 별도 declaration).
   - 각 파일 PowerShell `[IO.File]::ReadAllText` → `Replace` (import + JSX 사이트) → `[IO.File]::WriteAllBytes` (UTF-8 BOM 미포함).
   - **삼항식 emptyText 보존 의무** (FinancialCarryover L207) — JSX expression 형태 그대로 둠.
   - 한글 텍스트 "검색된 자료가 없습니다." / "조회 버튼을 클릭하세요." 깨짐 검증 — `grep -c` 변경 전후 동일 확인.

3. **Step 3 — 그룹 B 변환 (AdminSlipEdit, 1 파일 2 사이트)**:
   - AdminSlipEditPage 변환 (L15 named import + L593 + L605 JSX 2 사이트).
   - **EC-01 차단**: 한 파일 내 다중 사이트 동시 변환 — 한 사이트만 교체 시 tsc fail 위험.
   - **EC-02 핵심**: 그룹 A 의 default import 패턴 (`import BaseGrid from '.../components/tomis/Grid/BaseGrid';`) 으로는 그룹 B 의 named import (`import { BaseGrid } from '@tomis/grid-core/legacy';`) 미매칭 → 별도 PowerShell `Replace` 패턴 사용 의무.
   - **EC-07 핵심**: `onRowClick={handleGridRowClick}` 양 사이트 보존 — 행 클릭 → 우측 폼 연동 워크플로 정상 동작 검증.
   - 한국어 emptyText 매칭 — `.ps1` 스크립트 BOM (D10 + C-35) 의무.

4. **Step 4 — 전체 검증 및 commit**:
   - AC-004 grep 검증 (양 패턴 모두 — `from '@tomis/grid-core/legacy'` 또는 `from '../../../components/tomis/Grid/BaseGrid'` 또는 `<BaseGrid` → 4 파일에서 0 hits).
   - AC-001 tsc 0 errors (`npx tsc --noEmit`).
   - AC-003 dev server console.warn 0 건.
   - **AC-002 시각 회귀 — 5 사이트 모두 확인 의무**:
     - AdminSlipEdit L593 (차변 그리드, 전표번호 선택 후 진입) + L605 (대변 그리드, 동일 진입) — **행 클릭 → 우측 분개행 세부 수정 폼 데이터 채움 동작 확인 (EC-07)**
     - FinancialCarryover L203 (검색 조건 입력 + 조회 → 빈 결과 시 "검색된 자료가 없습니다." / 조회 전 "조회 버튼을 클릭하세요." 양쪽 확인)
     - SettlementSummary L254 (차대 불일치 전표 목록)
     - MonthlySettlement L253 (월별결산 연이월 목록)
   - 단일 commit (또는 페이지별 4 commit — D-02 AC-005) 으로 PR.

### 11.4 위험 요소

| 위험 | 영향 페이지 | 완화책 |
|------|------------|--------|
| 한 파일 내 다중 BaseGrid 사이트 — 일부만 교체 시 tsc 실패 또는 AC-004 NO | AdminSlipEdit(2) | EC-01 — PowerShell 정규식 또는 일괄 Replace 로 모든 `<BaseGrid<` 동시 변환. AC-004 grep 으로 0 hits 검증. |
| **★ AdminSlipEdit named import (`@tomis/grid-core/legacy`) — 그룹 A default import 패턴으로 미매칭** | AdminSlipEdit | EC-02 + D2 — 2 종 별도 `Replace` 패턴 사용. 그룹 A: `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` / 그룹 B: `import { BaseGrid } from '@tomis/grid-core/legacy';`. AC-004 grep 도 양 패턴 alternation. |
| **★ Goal prompt 5 파일 가정 vs 실측 4 파일 (MyNotification 미해당) — 잘못된 파일 변환 시도 위험** | MyNotificationPage | EC-09 + D1 — D1 결정 spec 본문 + Section 1 L0-5 명시적 제외 + Section 7 표 4 행 + Section 11.1 표 4 행. Implementer prompt 에 "spec 본문 = 권위 (C-27)" + "MyNotification 변환 시도 금지" 명시 의무. |
| `onRowClick` 사이트별 혼재 — 일괄 추가 시 미정의 식별자 또는 외관 회귀 | 5 사이트 (Section 2.1 매트릭스 참조) | EC-03 — Section 3 표 + Section 11.1 표에서 사이트별 props 유무 명시. AdminSlipEdit 2 사이트의 onRowClick 보존, 3 페이지의 props 추가 금지 (현 4 종 props 만 유지 + `enableSort enableFilter` 만 추가). |
| 워크트리 Edit/Write 도구 boundary 차단 → 즉시 escalate 시 1 round-trip 낭비 | 4 파일 모두 (base repo) | EC-05 + D9 + C-34 + ADR-MOD-GRID-17-001 — PowerShell-via-Bash 우회 표준 절차. `[IO.File]::WriteAllBytes` + `UTF8Encoding($false)` (BOM 미포함). |
| UTF-8 BOM 누락 (출력 파일) → 한글 메뉴/emptyText 깨짐 | 4 파일 모두 | MEMORY.md #32 + ADR-MOD-GRID-17-001 — `(New-Object System.Text.UTF8Encoding $false).GetBytes($content)`. 변경 후 한글 string grep hit 카운트 변경 전후 동일 확인. |
| **`.ps1` 스크립트 BOM 누락 → 한국어 패턴 매칭 `MISS`** (G-002 1차 사례) | 5 종 한국어 emptyText 총 5 사이트 + 삼항식 1 라인 (FinancialCarryover) | EC-08 + D10 + C-35 + ADR-MOD-GRID-17-004 — `.ps1` 파일 자체에 BOM (`0xEF 0xBB 0xBF`) prepend 의무. 또는 inline `powershell -Command` 우회. |
| `ColumnDef` 타입 호환 — 사용처가 `../../../types/tomis/grid` re-export 사용 | 4 페이지 모두 | EC-04 + D4 — `ColumnDef` import 는 변경하지 않음. `../../../types/tomis/grid` 의 re-export 가 `@tanstack/react-table` 의 `ColumnDef<TData>` 와 동일 type alias 이므로 tsc 통과 예상. |
| AdminSlipEdit 행 클릭 → 우측 분개행 폼 연동 동작 누락 시 워크플로 전체 차단 | AdminSlipEdit 2 사이트 | EC-07 — Section 11.1 표 + Section 11.3 Step 3 에 `onRowClick={handleGridRowClick}` 보존 명시. AC-002 시각 회귀 시 행 클릭 → 우측 폼 데이터 채움 검증 의무. |
| 삼항식 emptyText (FinancialCarryover L207) — PowerShell `Replace` 시 줄 단위 매칭 보존 | FinancialCarryover | EC-08 — JSX expression 형태 `emptyText={hasSearched ? '검색된 자료가 없습니다.' : '조회 버튼을 클릭하세요.'}` 한 줄 그대로 보존. surgical replace 시 `<BaseGrid` → `<Grid` 부분만 변경. |
| 외관 회귀 (cell padding / row height / sort glyph / hover bg / sticky thead) | 4 페이지 | AC-002 시각 회귀 검증 — 5 사이트 모두 dev server 렌더 후 픽셀 비교. 양 BaseGrid 형태 + monorepo Grid 가 동일 TanStack API 사용 → 이론적으로 0% 회귀. |

---

## Section 12. 검증 계획

### 12.1 단위 테스트 (E-05)
- **본 Goal 자체 단위 테스트 없음** — 사용처 마이그레이션이므로 grid-core 의 단위 테스트가 이미 MOD-GRID-01 G-001~G-005 에서 커버됨.
- 사용처에 추가 단위 테스트 필요시 후속 Goal 에서 추가 (본 Goal 범위 외).

### 12.2 시각 회귀 검증 (C-13 + C-17 의무 — migrationImpact: high)
- **방법 1 (자동)**: tw-framework-front 의 Storybook 미설정 환경 — Storybook story 신규 작성은 본 Goal 범위 외 (4 페이지가 복잡한 데이터 fetching 페이지여서 isolation 가능한 story 작성 부담 큼).
- **방법 2 (수동)**: 4 페이지 각각 dev server (`npm run dev`) 에서 마이그레이션 전후 동일 데이터로 스크린샷 캡처 후 외관 비교. 확인 대상:
  - cell padding (`px-4 py-3`)
  - row height
  - sort glyph (▲▼⇅) 위치 + 색상
  - hover bg-gray-50
  - thead bg-gray-50 sticky top-0
  - empty state 메시지 텍스트 (한글 깨짐 검증 의무 — 5 종 한국어 emptyText + 삼항식 1 종)
  - loading skeleton row 색상
  - **AdminSlipEdit 차변+대변 분할 그리드 외관 + 행 클릭 → 우측 분개행 세부 수정 폼 데이터 채움 동작 (EC-07)**
  - **FinancialCarryover 삼항식 emptyText — 조회 전 ("조회 버튼을 클릭하세요.") + 조회 후 빈 결과 ("검색된 자료가 없습니다.") 양 상태 모두 진입 확인**

### 12.3 빌드 검증 (C-12 의무)
- `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx tsc --noEmit` → exit 0, 0 errors.
- `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx vite build` → 빌드 성공 (lazy + 트리쉐이킹 동작 확인).

### 12.4 마이그레이션 자동 보완 (codemod)
- MOD-GRID-99-B docs Goal 에서 codemod 작성 예정. 본 Goal 은 수동/PowerShell 교체 (4 파일 × 5 사이트 = 트리비얼 + AdminSlipEdit 2 사이트만 sequential).
- 후속 Goal 들(G-005~G-006)이 동일 패턴으로 잔여 페이지 추가 변환할 때 codemod 우선순위 상승 — 본 Goal 의 **2 종 import 패턴 (default + named) 변환 알고리즘** 이 codemod template 의 입력.

### 12.5 한글 깨짐 검증 (C-34 + C-35 + ADR-MOD-GRID-17-001/004 의무)
- PowerShell-via-Bash 우회 사용 시 **출력 파일 UTF-8 BOM 미포함** 인코딩 강제 (D9 + C-34).
- **`.ps1` 스크립트 자체 UTF-8 BOM prepend** 의무 (D10 + C-35) — 한국어 매칭 시도 시 `MISS` 차단.
- 변경 전후 핵심 한글 string hit 카운트 동일 확인:
  - `"차변 내역이 없습니다."` (1 사이트 — AdminSlipEdit L597)
  - `"대변 내역이 없습니다."` (1 사이트 — AdminSlipEdit L609)
  - `"검색된 자료가 없습니다."` (2 사이트 — FinancialCarryover L207 삼항식 truthy + MonthlySettlement L257)
  - `"조회 버튼을 클릭하세요."` (1 사이트 — FinancialCarryover L207 삼항식 falsy)
  - `"차대 불일치 전표가 없습니다."` (1 사이트 — SettlementSummary L258)
  - 핵심 한글 string 합계: 5 사이트 의 emptyText 텍스트 (5 종 distinct 문자열)
- 변경 후 Read 도구로 변경 부위 확인 — 한글 출력 정상 여부 시각 검증.
- 스크립트 실행 결과 `MISS` 0건 (모든 5 사이트 패턴 `HIT` 확인).

### 12.6 MyNotificationPage 무변경 검증 (D1 cascade)
- **D1 결정 cross-check**: 마이그레이션 전후 `MyNotificationPage.tsx` 파일 git diff 0 라인 — 본 Goal 에서 절대 미변경.
- 검증 방법: `git diff --stat tw-framework-front/src/pages/MyNotification/MyNotificationPage.tsx` → 변경 라인 0건.
- 추후 별도 Goal 에서 `DataTable` → `@tomis/grid-core` 마이그레이션 검토 권장 — 본 Goal 범위 외.

---

## Section 13. 상용 제품화 영향

### 13.1 패키지 대상 (F-01)
- **본 Goal 의 변경 대상 = `tw-framework-front` 사용처만**. `@tomis/grid-core` / `@tomis/grid-pro-*` / `@tomis/grid-renderers` 패키지 변경 없음 (코어 변경 0).
- `packageTarget: "tw-framework-front"` (G-001~G-003 동일).

### 13.2 라이선스 검증 호출 (F-02)
- **N/A** — 본 Goal 의 4 페이지는 MIT 영역(`@tomis/grid-core`) 만 사용. `@tomis/grid-pro-*` (Pro 영역) 호출 없음 (실측 Read 결과 — 4 페이지 모두 BaseGrid 만 사용, ChangeTrackingGrid/RangeSelectGrid 등 Pro alias 미사용).
- 따라서 `setLicenseKey()` / `configureGridLicense()` 호출 위치 불필요 (`grid-license` 런타임 검증 적용 대상 외).

### 13.3 문서 작성 계획 (F-03)
- **본 Goal 자체는 public API 변경 0** — Docusaurus API reference 항목 추가 불필요 (C-25 의무는 grid-core 신규 API 추가 시에만 발동).
- **권장 (선택)**: MOD-GRID-99-B docs Goal 의 "마이그레이션 가이드" 챕터에 **2 종 import 패턴 변환 예시** (default `from '../../../components/tomis/Grid/BaseGrid'` + named `from '@tomis/grid-core/legacy'`) 추가 권장 — 본 Goal 의 implement Stage 에서 docs 추가 의무 X.
- Storybook story 신규 작성: **본 Goal 범위 외** (12.2 방법 1 참조 — 부담 대비 효과 낮음).

### 13.4 peerDependencies 정책 (F-04)
- `@tomis/grid-core` 가 `react` / `react-dom` / `@tanstack/react-table` 을 peer 로 선언 (MOD-GRID-00 G-001 + MOD-GRID-01 G-005 확정).
- tw-framework-front 의 package.json 이 이미 이 셋을 deps 로 보유 (G-001~G-003 spec Section 4.5 검증 완료) — peer 충족.
- 본 Goal 은 dependency 변경 0 → C-22 위반 없음 + peer mismatch 0.

### 13.5 semver 영향 (C-23)
- 본 Goal 은 `@tomis/grid-core` 의 public API 변경 0 → semver 영향 없음 (patch 도 아님).
- 로컬 `BaseGrid` 및 monorepo legacy `BaseGrid` named export 의 deprecated 처리는 본 Goal 범위 외 — G-005 ~ G-006 까지 완료 후 다른 페이지 사용처 0건 확인 시 별도 cleanup Goal. 누적 마이그레이션 완료 페이지: G-001 5 + G-002 5 + G-003 5 + G-004 4 = **19 페이지**.
