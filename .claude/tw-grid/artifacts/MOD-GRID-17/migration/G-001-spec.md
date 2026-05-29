# G-001 Spec: account/Slip* 5 페이지 마이그레이션

**Goal**: MOD-GRID-17 / migration / G-001
**Priority**: P0 | **Migration Impact**: high | **Threshold**: 95
**Package Target**: `tw-framework-front` (사용처 마이그레이션 — `@tomis/grid-core` 코어 변경 없음)
**License Tier**: N/A (MIT 영역만 사용)

---

## ★ 사전 결정 표 (D# — Spec Writer 권위)

| D# | 결정 | 사유 | goals.json 영향 |
|----|------|------|----------------|
| D1 | 5 파일 모두 `import { Grid, createColumns } from '@tomis/grid-core'` 로 통일 (`/legacy` sub-entry 사용 금지). | 본 Goal 목표 = variant alias 제거 후 신규 `<Grid>` API 채택 (AC-004). SlipListPage 가 현재 `@tomis/grid-core/legacy` 의 `BaseGrid` 사용 중인 것도 제거 대상. | `affectedUsageFiles[5]` 그대로 유지. |
| D2 | `<Grid>` props 매핑 = `enableSort` + `enableFilter` + `enablePagination`(SlipApprovePage 만 추가) + `rowSelection`(SlipApprovePage 만) + `loading` + `emptyText` + `className` + `onRowClick`(SlipListPage 만). 5 파일 각각의 현 호출 시그니처를 surgical 매핑. | `legacy/BaseGrid.tsx` L17-36 의 매핑 표 그대로 따름 — `<BaseGrid>` = `<Grid enableSort enableFilter enablePagination={pagination !== undefined} ...>`. | `bundleImpact.expected = "0 KB"` 유지. |
| D3 | 컬럼 정의는 **현 inline `ColumnDef<TData>[]` 유지** (createColumns 변환은 본 Goal 범위 외). 사용처는 `ColumnDef` import 경로만 `'../../../types/tomis/grid'` → `@tanstack/react-table` 로 변경 (TanStack 표준). | 본 Goal scope = "variant import → `<Grid>` 교체" (goals.json L26 userStory). `createColumns` 변환은 별도 후속 Goal (또는 MOD-GRID-04 적용 시) 가 자연스럽다. C-19 점진. | `implementFiles[5]` 그대로. |
| D4 | `affectedUsageFiles` = `implementFiles` = 5 페이지 (C-19 ≤5 준수). 동일 경로 5개. | 본 Goal 은 사용처 마이그레이션 전용 — 새 NEW 파일 0건, MODIFY 5건. | goals.json L62-74 일치. |
| D5 | Section 9 의존성 = "변경 없음". `@tomis/grid-core` workspace alias 는 `vite.config.ts` L18 에서 이미 wiring 완료 (검증됨 — 실제 Read). | 신규 dep 추가 0건. C-22 peerDeps 영향 0. | `bundleImpact.package = "tw-framework-front"` 일치. |
| D6 | Section 2 의 `<Grid>` props interface 인용 = `grid-core/src/types.ts` L267-606 (`GridProps<TData>`) 의 실제 정의 그대로. 사용처는 그 중 `data` / `columns` / `enableSort` / `enableFilter` / `enablePagination` / `rowSelection` / `pagination` / `onRowClick` / `loading` / `emptyText` / `className` 11 개 props 만 사용 (다른 props 는 default 활용). | C-1 Read-then-Write 준수 + spec authoritative. | N/A |
| D7 | 페이지별 마이그레이션 액션 = `direct 교체` (5 페이지 모두 동일 액션). 페이지별 PR 분리는 AC-005 (D-02) 별도 처리. | 호환성 정책 D-02 (페이지 단위 PR). 그러나 본 spec 의 implement Stage 는 단일 commit 으로 일괄 5 파일 변경 + verifier 가 외관/tsc 통합 검증. | N/A |

**Verifier 자가-검산 (G-01 + E-06 cross-check)**: 합계 7 D# 결정. NEW 0 + MODIFY 5 = 총 5 파일. Section 7 표 5 행 + Section 11.1 표 5 행. breakdown(NEW 0 / MODIFY 5 / 파일 이름) 본문/AC/Section 7 모두 1:1 매칭.

---

## Section 1. 참조 추적 (Reference Tracking)

### L0 — tw-framework-front 현 구현 (실측 Read 결과)

영향 사용처 5개 페이지 각각의 grid 사용 패턴 (모두 실측 Read 완료):

**L0-1: `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/SlipListPage.tsx`** (1620 줄)
- L21: `import { BaseGrid } from '@tomis/grid-core/legacy';` — **이미 monorepo legacy alias 사용 중**
- L1024-1031: 첫 번째 `<BaseGrid<SlipListItem>>` (전표 헤더 목록)
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
- L1236-1243: 두 번째 `<BaseGrid<Slip02ListItem>>` (분개 그리드)
  ```tsx
  <BaseGrid<Slip02ListItem>
    data={slip02List}
    columns={slip02Columns}
    loading={isLoading}
    emptyText="등록된 분개가 없습니다."
    onRowClick={handleSlip02RowClick}
    className="w-full"
  />
  ```
- props 사용: `data`, `columns`, `loading`, `emptyText`, `onRowClick`, `className` (6 종 — pagination/rowSelection 미사용)
- L22: `import type { ColumnDef } from '../../../types/tomis/grid';` (local re-export, 추후 D3 결정에 따라 `@tanstack/react-table` 로 전환 가능)

**L0-2: `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/SlipClosePage.tsx`** (311 줄)
- L15: `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` — **local legacy import (마이그레이션 대상)**
- L298-304:
  ```tsx
  <BaseGrid<EndSlipItem>
    data={rows}
    columns={columns}
    loading={isLoading}
    emptyText="연도·월을 선택하고 조회 버튼을 클릭하세요."
    className="w-full"
  />
  ```
- props 사용: `data`, `columns`, `loading`, `emptyText`, `className` (5 종)

**L0-3: `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/SlipApprovePage.tsx`** (472 줄)
- L14: `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` — **local legacy import**
- L15: `import type { ColumnDef } from '../../../types/tomis/grid';`
- L415-425:
  ```tsx
  <BaseGrid<ApproveSlipListItem>
    data={rows}
    columns={columns}
    loading={isLoading}
    emptyText="조회 조건을 설정하고 조회 버튼을 클릭하세요."
    rowSelection={{
      mode: 'multi',
      onSelectionChange: setCheckedRows,
    }}
    className="w-full"
  />
  ```
- props 사용: `data`, `columns`, `loading`, `emptyText`, `rowSelection`(객체 — multi mode), `className` (6 종)
- 페이지 자체에 별도 수동 페이지네이션 (L429-465) 있음 — `<BaseGrid>` 안의 pagination prop 은 미사용 (외부 페이지네이션 사용 중).

**L0-4: `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/SlipDailyStatusPage.tsx`** (176 줄)
- L12: `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` — **local legacy import**
- L164-169:
  ```tsx
  <BaseGrid<EndSlipItem>
    columns={columns}
    data={rows}
    loading={isLoading}
    emptyText="조회된 데이터가 없습니다."
  />
  ```
- props 사용: `data`, `columns`, `loading`, `emptyText` (4 종 — `className` 미사용)

**L0-5: `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/DailyMonthlyReportPage.tsx`** (216 줄)
- L14: `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';` — **local legacy import**
- L204-209:
  ```tsx
  <BaseGrid<DailyMonthlyReportItem>
    columns={columns}
    data={rows}
    loading={isLoading}
    emptyText="조회된 데이터가 없습니다."
  />
  ```
- props 사용: `data`, `columns`, `loading`, `emptyText` (4 종)
- 컬럼은 13 개 (다단 헤더 없음 — single header). xlsx export 는 페이지 컴포넌트가 직접 호출(L138-141) — grid 와 무관.

### L1 — TanStack v8 API
- **N/A** (본 Goal 은 TanStack API 변경 없음 — grid-core wrapper 만 교체). 단 D6 D3 결정에 따라 사용처는 `import type { ColumnDef } from '@tanstack/react-table'` 로 전환 가능 (선택).

### L2 — 공통 컴포넌트 (`@tomis/grid-core`)

L2-1: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` L2 export:
```ts
export { Grid } from './Grid';
```
+ L23-34:
```ts
// G-005 D8: legacy alias 5종 — main entry 호환 (`/legacy` sub-entry 권장).
export {
  BaseGrid,
  VirtualGrid, type VirtualGridProps,
  ColumnPinGrid, type ColumnPinGridProps,
  GroupedHeaderGrid, type GroupedHeaderGridProps,
  TreeGrid, type TreeGridProps,
} from './legacy';
```

L2-2: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/Grid.tsx` L490-492:
```tsx
export const Grid = forwardRef(GridInner) as <TData>(
  props: GridProps<TData> & { ref?: Ref<GridHandle<TData>> },
) => ReactElement;
```

L2-3: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` L267-273 (필수 props):
```ts
export interface GridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  enableSort?: boolean;
  enableFilter?: boolean;
  enablePagination?: boolean;
  // ... (이하 38개 optional props)
}
```

L2-4: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/legacy/BaseGrid.tsx` L17-36 의 매핑 패턴(권위적 매핑 표):
```tsx
export function BaseGrid<TData extends object>(props: BaseGridProps<TData>): JSX.Element {
  useDeprecationWarn('BaseGrid');
  return (
    <Grid<TData>
      data={props.data}
      columns={props.columns}
      enableSort
      enableFilter
      enablePagination={props.pagination !== undefined}
      {...(props.pagination !== undefined ? { pagination: props.pagination } : {})}
      {...(props.rowSelection !== undefined ? { rowSelection: props.rowSelection } : {})}
      {...(props.onRowClick !== undefined ? { onRowClick: props.onRowClick } : {})}
      {...(props.onRowDoubleClick !== undefined ? { onRowDoubleClick: props.onRowDoubleClick } : {})}
      {...(props.loading !== undefined ? { loading: props.loading } : {})}
      {...(props.emptyText !== undefined ? { emptyText: props.emptyText } : {})}
      {...(props.className !== undefined ? { className: props.className } : {})}
    />
  );
}
```
이 BaseGrid alias 내부 매핑이 본 Goal 의 surgical 변환 청사진. 사용처에서는 `<BaseGrid ...>` 를 `<Grid enableSort enableFilter ...>` 로 그대로 풀어쓴다.

### L3 — 영향 사용처 카운트 = **5 파일** (5/5, C-19 준수)

`canonical-modules.json` MOD-GRID-17 affectedUsageFiles 중 account/Slip* 도메인 5건. 정확한 경로 5개 (Section 8.1 동일).

### R-A / R-W — N/A
- 본 Goal 은 신규 API 설계가 아닌 **사용처 마이그레이션** — AG Grid / Wijmo 동등 기능 참조 불필요.

---

## Section 2. API 계약 (TypeScript Interface)

본 Goal 은 신규 API 정의가 없음 — `@tomis/grid-core` 의 기존 `GridProps<TData>` 를 사용처에서 호출만 한다.

### 2.1 호출할 인터페이스 (`grid-core/src/types.ts` L267-606 실측 인용)

본 Goal 의 5 페이지에서 사용할 `GridProps<TData>` 의 11개 props 부분:

```ts
export interface GridProps<TData> {
  // ─── 필수 ───
  data: TData[];                                        // required
  columns: ColumnDef<TData, unknown>[];                 // required

  // ─── enable* 토글 ───
  enableSort?: boolean;                                 // default false → 본 Goal: true
  enableFilter?: boolean;                               // default false → 본 Goal: true
  enablePagination?: boolean;                           // default false → 본 Goal: false (4 페이지) / true (SlipApprovePage 만 — 단, 외부 페이지네이션 유지로 false 도 가능)

  // ─── 행 선택 ───
  rowSelection?: RowSelectionMode | GridRowSelectionOptions<TData>;  // 객체 표기 ← SlipApprovePage 만

  // ─── 페이지네이션 옵션 (enablePagination=true 일 때만 효과) ───
  pagination?: GridPaginationOptions;                   // 본 Goal: 미사용 (외부 페이지네이션 보존)

  // ─── 이벤트 ───
  onRowClick?: (row: TData, event: MouseEvent<HTMLTableRowElement>) => void;  // SlipListPage 만

  // ─── 표시 ───
  className?: string;
  emptyText?: string;
  loading?: boolean;
}
```

### 2.2 export 경로 (D6 + L2-1)

```ts
// 사용처 마이그레이션 최종 import 라인:
import { Grid } from '@tomis/grid-core';
import type { ColumnDef } from '@tanstack/react-table';
// (또는 호환 유지를 위해 기존 '../../../types/tomis/grid' 의 ColumnDef re-export 유지 가능 — D3)
```

### 2.3 사용 예시 코드 (최소 2개 — 본 Goal 의 실측 시나리오)

**예시 1 (단순 — SlipClosePage / SlipDailyStatusPage / DailyMonthlyReportPage 공통 패턴):**
```tsx
import { Grid } from '@tomis/grid-core';
import type { ColumnDef } from '@tanstack/react-table';

<Grid<EndSlipItem>
  data={rows}
  columns={columns}
  enableSort
  enableFilter
  loading={isLoading}
  emptyText="조회된 데이터가 없습니다."
  className="w-full"
/>
```

**예시 2 (rowSelection multi — SlipApprovePage 패턴):**
```tsx
<Grid<ApproveSlipListItem>
  data={rows}
  columns={columns}
  enableSort
  enableFilter
  loading={isLoading}
  emptyText="조회 조건을 설정하고 조회 버튼을 클릭하세요."
  rowSelection={{
    mode: 'multi',
    onSelectionChange: setCheckedRows,
  }}
  className="w-full"
/>
```

### 2.4 기본값 / optional 명시
- `data`, `columns` = **required** (위 두 props 만 필수, 모두 명시됨)
- 그 외 11개 props 는 모두 **optional** — 미사용 = TanStack 기본 동작 (`enableSort=false`, `loading=false`, `emptyText='데이터가 없습니다.'` 등)
- `pagination?.pageSize` default 20 (L82 Grid.tsx)
- `emptyText` default `'데이터가 없습니다.'` (L55 Grid.tsx `DEFAULT_EMPTY_TEXT`)

### 2.5 ref API — N/A (B-05)
본 Goal 의 5 페이지 어느 곳도 `gridRef` 사용 없음 (Read 결과 confirmed). `GridHandle<TData>` 미사용. B-05 = N/A.

---

## Section 3. 기존 사용처 대응표 ⭐ (tw-grid 특화)

| 페이지 | 기존 import / 사용 패턴 (라인) | 신규 API 대응 | 마이그레이션 액션 |
|--------|------------------------------|-------------|------------------|
| **SlipListPage.tsx** | L21 `import { BaseGrid } from '@tomis/grid-core/legacy';`<br>L1024-1031 `<BaseGrid<SlipListItem> data columns loading emptyText onRowClick className />`<br>L1236-1243 `<BaseGrid<Slip02ListItem>` (분개 그리드) | `import { Grid } from '@tomis/grid-core';`<br>`<Grid<SlipListItem> enableSort enableFilter data columns loading emptyText onRowClick className />` (×2 — 두 위치 모두) | **direct 교체** (`<BaseGrid` → `<Grid enableSort enableFilter`) — 2 군데 동시 변환. legacy alias 제거. |
| **SlipClosePage.tsx** | L15 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';`<br>L298-304 `<BaseGrid<EndSlipItem> data columns loading emptyText className />` | `import { Grid } from '@tomis/grid-core';`<br>`<Grid<EndSlipItem> enableSort enableFilter data columns loading emptyText className />` | **direct 교체** + 로컬 BaseGrid import 제거 |
| **SlipApprovePage.tsx** | L14 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';`<br>L415-425 `<BaseGrid<ApproveSlipListItem> data columns loading emptyText rowSelection={{mode:'multi', onSelectionChange}} className />` | `import { Grid } from '@tomis/grid-core';`<br>`<Grid<ApproveSlipListItem> enableSort enableFilter data columns loading emptyText rowSelection={{mode:'multi', onSelectionChange}} className />` | **direct 교체** — rowSelection 객체 props 그대로 통과(타입 호환 — `GridRowSelectionOptions<TData>` 동일 구조) |
| **SlipDailyStatusPage.tsx** | L12 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';`<br>L164-169 `<BaseGrid<EndSlipItem> columns data loading emptyText />` (className 없음) | `import { Grid } from '@tomis/grid-core';`<br>`<Grid<EndSlipItem> enableSort enableFilter columns data loading emptyText />` | **direct 교체** |
| **DailyMonthlyReportPage.tsx** | L14 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid';`<br>L204-209 `<BaseGrid<DailyMonthlyReportItem> columns data loading emptyText />` | `import { Grid } from '@tomis/grid-core';`<br>`<Grid<DailyMonthlyReportItem> enableSort enableFilter columns data loading emptyText />` | **direct 교체** (단일 header — multi-row header 미사용 → createColumnGroup 불필요) |

**5/5 행 모두 작성. C-19 ≤5 준수**. `BaseGrid` legacy alias 가 내부적으로 `<Grid enableSort enableFilter enablePagination={pagination !== undefined} ...>` 로 매핑되므로 (`legacy/BaseGrid.tsx` L17-36), 본 Goal 의 매핑은 그대로 인라인 풀어쓴 결과. 외관 100% 보존.

---

## Section 4. 호환성 정책

### 4.1 Breaking change
- **`breaking: false`** (goals.json L50 일치)
- `<BaseGrid>` legacy alias 자체는 monorepo `@tomis/grid-core/legacy` 에 계속 export 됨 (`legacy/index.ts` L9). 본 Goal 은 alias 자체를 제거하는 게 아니라 — **5 페이지에서 alias 사용을 제거**한다.

### 4.2 Deprecation 전략 (goals.json L51 + C-6 + C-23)
- `BaseGrid` alias 는 **1 minor 버전 유지** (`@tomis/grid-core@0.x` 동안). 정확한 deprecation 정책은 MOD-GRID-01 G-005 ADR (legacy alias 5종 신설 시 결정) 에 명시됨 — 본 Goal 은 그 정책을 따른다.
- 본 Goal 후속 효과: deprecated alias 제거가 5 페이지에서 완료되면 alias 호출처 감소 → 다음 마이그레이션 모듈(G-002~G-006) 완료 후 alias 자체 제거 검토 가능.

### 4.3 영향 사용처 마이그레이션 경로 (3 단계 — Section 11.3 와 동기)
1. **단계 1**: import 라인 교체 — 5 파일 각각 `BaseGrid` 제거, `Grid` 추가.
2. **단계 2**: JSX 호출 사이트 교체 — `<BaseGrid` → `<Grid enableSort enableFilter`. SlipListPage 는 2 군데 (L1024, L1236) 동시. 나머지는 각 1 군데.
3. **단계 3**: `npx tsc --noEmit` 0 errors 확인 → 외관 회귀 검증 (C-17).

### 4.4 console warning 정책 (AC-003 + C-23)
- `BaseGrid` alias 는 mount 시 `useDeprecationWarn('BaseGrid')` (dev mode only, prod silent) — 본 Goal 완료 후 5 페이지에서 이 경고 0 건.
- `Grid` 자체는 deprecation warning 미발생.

### 4.5 peerDependencies 정책 (C-22)
- `@tomis/grid-core` 가 `react`, `react-dom`, `@tanstack/react-table` 을 peer 로 선언 — 사용처 `tw-framework-front` 는 이미 이 셋을 deps 로 보유 (package.json L20, L22, L32, L34 확인 완료). 추가 작업 없음.

---

## Section 5. 인수 기준 (Acceptance Criteria with Source Tags)

5개 AC 모두 출처 태그 + binary 검증 가능. migrationImpact: **high** 표시.

| AC ID | 기준 | 출처 | binary 검증 방법 | migrationImpact |
|-------|------|------|------------------|-----------------|
| AC-001 | 5 페이지 tsc 0 errors | **L0 + C-12** | `cd tw-framework-front && npx tsc --noEmit` 명령 실행 → exit 0 + stderr 빈 결과 | high |
| AC-002 | 외관 보존 — 동일 데이터 입력 시 마이그레이션 전후 시각 동일 | **L0 + L2 + C-17** | (a) BaseGrid alias 자체가 내부에서 `<Grid enableSort enableFilter ...>` 호출이므로 markup 동일 — `legacy/BaseGrid.tsx` L17-36 확인 / (b) 5 페이지 각각 동일 데이터 fixture 로 마이그레이션 전후 스크린샷 캡처 후 픽셀 비교 또는 수동 외관 검토 (cell padding / row height / sort icon / pagination 푸터 / rowSelection 체크박스) | high |
| AC-003 | console warning 0 건 | **C-23** | 5 페이지 dev mode 렌더 → `console.warn` 인터셉트 시 `useDeprecationWarn` 호출 발생 X (BaseGrid alias 제거됨) | high |
| AC-004 | variant direct import 0 건 (`BaseGrid` / `VirtualGrid` / `ChangeTrackingGrid` 등) | **L0 + L2 + C-6** | `grep -nE "from ['\"](\\.\\./)+components/tomis/Grid/BaseGrid['\"]\|from ['\"]@tomis/grid-core/legacy['\"]" tw-framework-front/src/pages/tomis/account/Slip*Page.tsx tw-framework-front/src/pages/tomis/account/DailyMonthlyReportPage.tsx` → 0 hits | high |
| AC-005 | 페이지 단위 PR 분리 (D-02) — 5 페이지 1 PR 또는 페이지별 commit ≥ 5 | **C-19** | git log --oneline 또는 PR description 에 5 페이지 enumerate. 단일 commit 으로 5 파일 변경도 허용. | high |

**AC source 태그 검증 (H-03 만족)**:
- L0 → Section 1 L0-1~L0-5 에서 실제 인용됨
- L2 → Section 1 L2-1~L2-4 에서 실제 인용됨
- C-12 → constraints.md C-12 (`npx tsc --noEmit` 0 errors 의무)
- C-17 → constraints.md C-17 (시각 회귀 검증 의무 — high impact)
- C-23 → constraints.md C-23 (semver — deprecated API 1 minor 유지)
- C-6 → constraints.md C-6 (호환성 절대)
- C-19 → constraints.md C-19 (점진 ≤5/Goal)

---

## Section 6. 엣지 케이스 (3개 이상)

본 Goal 의 실측 페이지 분석 기반 엣지 케이스 (추측 금지 — 실제 Read 결과로 식별):

**EC-01: SlipListPage 동일 페이지 내 2개 `<BaseGrid>` 위치 — 양쪽 모두 동기 교체 필요**
- 출처: L0-1 (L1024 + L1236 — 헤더 그리드 + 분개 그리드).
- 위험: implementer 가 한 위치만 교체 → AC-004 NO (variant import 잔존).
- 처리: Section 11.1 표에 "L1024 + L1236 2 위치 모두" 명시. tsc/grep 검증 시 모든 hit 0건 확인.

**EC-02: SlipApprovePage 의 외부 페이지네이션 (L429-465) 과 신규 `<Grid>` 의 내장 pagination 중복 위험**
- 출처: L0-3 (`<BaseGrid>` 호출에는 `pagination` prop 부재 + 페이지 컴포넌트가 직접 페이지네이션 컴포넌트 렌더링 L429-465).
- 위험: implementer 가 `<Grid enablePagination={true} pagination={...}>` 로 변환 시 내장 페이지네이션이 추가 표시 → UI 중복 + 외관 회귀(AC-002 NO).
- 처리: Section 3 표의 SlipApprovePage 행에서 명시적으로 `enablePagination` 미사용 (즉, `<Grid>` 내장 페이지네이션 비활성). 기존 외부 페이지네이션 100% 보존.

**EC-03: ColumnDef import 경로 — 사용처 5개 중 일부는 `../../../types/tomis/grid` 의 re-export, 일부는 다른 곳**
- 출처: L0-1 (L22 `import type { ColumnDef } from '../../../types/tomis/grid';`), L0-3 (L15 동일), L0-2/4/5 도 동일.
- 위험: D3 결정으로 사용처에서 `ColumnDef` import 를 `@tanstack/react-table` 로 바꾸려 할 때 — 5 파일 모두 일관 적용 또는 어느 하나만 — drift 발생 가능.
- 처리: D3 결정 = "본 Goal 범위 외 — 현 import 경로 유지". `<BaseGrid>` → `<Grid>` 만 surgical 교체. `ColumnDef` import 는 변경하지 않는다. (단, types/tomis/grid.ts L17 의 `BaseGridProps<TData>` 도 본 Goal 에서는 건드리지 않음 — 다른 페이지가 사용 가능성)

**EC-04: DailyMonthlyReportPage 13 컬럼 single-header — `<Grid>` 의 default size 150 vs 기존 size=80~160 mix**
- 출처: L0-5 (COLUMNS L36-60 — size: 90~160 명시).
- 위험: `<Grid>` 기본 width 처리 (Grid.tsx L277-279 `applyWidth = useResizing || usePinning || size !== 150`) — `enableColumnResizing` / `enableColumnPinning` 둘 다 false 면, size 가 150 이 아닌 컬럼만 width 적용. **현 컬럼 모두 size ≠ 150 이므로 영향 없음**.
- 처리: tsc/외관 모두 통과 예상. AC-002 시각 회귀에서 확인.

**EC-05: SlipApprovePage 의 `rowSelection.onSelectionChange` 콜백 — 타입 generic 호환**
- 출처: L0-3 (L420-423 `rowSelection={{mode:'multi', onSelectionChange: setCheckedRows}}` + `setCheckedRows: Dispatch<SetStateAction<ApproveSlipListItem[]>>`).
- 위험: `GridRowSelectionOptions<TData>.onSelectionChange?: (rows: TData[]) => void` (types.ts L172-173) — `setCheckedRows` 의 signature `(value: SetStateAction<ApproveSlipListItem[]>) => void` 가 `(rows: ApproveSlipListItem[]) => void` 으로 함수 contravariance 통해 호환 가능.
- 처리: tsc 통과 예상. 실패 시 wrapper `(rows) => setCheckedRows(rows)` 로 명시 매핑.

---

## Section 7. 구현 대상 파일 (NEW / MODIFY) — 최종 implementFiles 표

**NEW: 없음.**
**MODIFY: 5 파일 (모두 사용처 페이지).**

| # | 파일 (절대 경로) | 액션 | 변경 라인 (추정 — 실측 기반) | 변경 내용 |
|---|-----------------|------|----------------------------|----------|
| 1 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/SlipListPage.tsx` | MODIFY | L21 (import) + L1024 + L1236 (JSX) | `BaseGrid` import 제거 + `Grid` import 추가; 2 위치 `<BaseGrid` → `<Grid enableSort enableFilter` |
| 2 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/SlipClosePage.tsx` | MODIFY | L15 (import) + L298 (JSX) | local BaseGrid import 제거 + `Grid` import 추가; `<BaseGrid` → `<Grid enableSort enableFilter` |
| 3 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/SlipApprovePage.tsx` | MODIFY | L14 (import) + L415 (JSX) | local BaseGrid import 제거 + `Grid` import 추가; `<BaseGrid` → `<Grid enableSort enableFilter` (rowSelection 객체 props 그대로) |
| 4 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/SlipDailyStatusPage.tsx` | MODIFY | L12 (import) + L164 (JSX) | local BaseGrid import 제거 + `Grid` import 추가; `<BaseGrid` → `<Grid enableSort enableFilter` |
| 5 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/DailyMonthlyReportPage.tsx` | MODIFY | L14 (import) + L204 (JSX) | local BaseGrid import 제거 + `Grid` import 추가; `<BaseGrid` → `<Grid enableSort enableFilter` |

**합계: NEW 0 + MODIFY 5 = 5 파일** (D4 breakdown + goals.json L62-66 implementFiles 일치).
**합계: 변경 hunk 약 6 라인 (import 5 + JSX 호출 6 = 11 변경 라인)**

**H-02 경로 합리성 검증**: 모든 5 파일 부모 디렉토리(`.../tw-framework-front/src/pages/tomis/account/`) 실재 — 실제 Read 도구로 5 파일 모두 로드 성공함. 프로젝트 컨벤션(`tw-framework-front/src/pages/tomis/{도메인}/{모듈}Page.tsx`) 일치 (CLAUDE.md "프론트엔드 디렉토리 원칙").

---

## Section 8. 마이그레이션 영향도 Preflight ⭐

### 8.1 영향 사용처 카운트: **5/5** (1 Goal ≤ 5 — C-19 준수)

5 파일 전체 경로 (goals.json L68-74 일치 + Section 7 #1~#5 일치):
1. `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/SlipListPage.tsx`
2. `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/SlipClosePage.tsx`
3. `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/SlipApprovePage.tsx`
4. `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/SlipDailyStatusPage.tsx`
5. `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/DailyMonthlyReportPage.tsx`

### 8.2 무파괴 검증 방법
- **빌드 검증 (자동)**: `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx tsc --noEmit` → exit 0
- **추가 검증 (자동)**: `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx vite build` → 빌드 성공
- **외관 보존 (수동 — Chromatic 미도입 환경)**: 5 페이지 각각 dev server (`npm run dev`) 에서 동일 데이터 fixture 로 마이그레이션 전/후 스크린샷 캡처 후 픽셀 비교. 확인 대상: cell padding(`px-4 py-3`), row height, sort glyph(▲/▼/⇅), pagination footer(SlipApprovePage 의 외부 컴포넌트), rowSelection 체크박스(SlipApprovePage), thead bg-gray-50, hover bg-gray-50.
- **외관 동등성 근거 (이론적)**: `BaseGrid` alias 자체가 내부적으로 `<Grid enableSort enableFilter enablePagination={pagination !== undefined} {...spread}>` 호출(`legacy/BaseGrid.tsx` L17-36) → 본 Goal 의 변환은 alias 호출 → 인라인 호출로 변환만 — DOM 출력 100% 동일.

### 8.3 점진 마이그레이션 vs 일괄 전환
- 본 Goal = **일괄 5 페이지 전환** (C-19 ≤5 충족). 다른 알람 사용처(account/Expense*, account/Cash* 등 22 페이지)는 G-002~G-006 별도 Goal 에서 처리.

### 8.4 롤백 전략
- `BaseGrid` deprecated alias 가 1 minor 버전 유지 (`@tomis/grid-core@0.x` 동안 — D2 결정 + C-23). 사용처에서 즉시 되돌릴 수 있음.
- **롤백 방법 1**: `git revert <commit-sha>` — 단일 commit 변경이므로 surgical 롤백 가능.
- **롤백 방법 2 (alias 재도입)**: SlipListPage 라면 L21 을 `import { BaseGrid } from '@tomis/grid-core/legacy';` 로 복원 + JSX `<Grid enableSort enableFilter ...>` → `<BaseGrid ...>` 로 surgical 되돌리기. 4 페이지는 local BaseGrid(아직 미삭제) 로 복원.

### 8.5 번들 크기 영향
- **0 KB** (C-21 충족). 사용처 마이그레이션 — 새 의존성 추가 0. `@tomis/grid-core` 자체는 alias 사용 시점에 이미 import 되어 있어 트리쉐이킹 영향 없음.
- goals.json L75-79 `bundleImpact.expected = "0 KB"` 일치.

---

## Section 9. 의존성 (peerDeps / deps / devDeps)

- **신규 추가 의존성: 없음.**
- `@tomis/grid-core` workspace alias 는 `D:/project/topvel_project/TOMIS/tw-framework-front/vite.config.ts` L18 에서 이미 wiring 완료:
  ```ts
  '@tomis/grid-core': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-core/src'),
  ```
- `react`, `react-dom`, `@tanstack/react-table` peer dependencies 는 tw-framework-front package.json L20 / L22 / L32 / L34 에서 이미 보유.
- `@tomis/grid-core` 의 package.json `main`/`exports` 는 monorepo MOD-GRID-00 G-001 에서 wiring 완료 (`packages/grid-core/src/index.ts` export L2 `Grid` 검증됨).

---

## Section 10. 사용자 여정 매핑

### 10.1 개발자 관점 (5 단계 — goals.json L27-33 일치)
1. **식별**: 5 페이지의 grid 사용 라인 확인 (실제 Section 1 L0-1~L0-5 에 라인 명시 완료).
2. **import 라인 교체**: 5 파일 각각 `BaseGrid` import 제거, `import { Grid } from '@tomis/grid-core';` 추가.
3. **JSX 호출 교체**: `<BaseGrid<T>` → `<Grid<T> enableSort enableFilter` (SlipListPage 는 2 위치).
4. **tsc 통과 확인**: `cd tw-framework-front && npx tsc --noEmit` → 0 errors.
5. **외관 보존 확인**: dev server 렌더 + 5 페이지 스크린샷 비교 (또는 향후 Storybook story 추가).

### 10.2 최종 사용자 관점 (외관 동등)
- **rows/columns 표시**: 100% 동일 (DOM 출력 동일).
- **인터랙션**: 클릭(onRowClick — SlipListPage)/체크박스(rowSelection — SlipApprovePage)/소트 헤더(enableSort 활성 — 5 페이지 모두) 동작 동일.
- **빈 상태**: `emptyText` 그대로 (5 페이지 모두 자체 메시지 명시).
- **로딩 skeleton**: `loading={true}` 시 skeleton row 표시 (BaseGrid alias 와 동일 — Grid.tsx L351-357).
- **응답 시간**: 동일 컴포넌트 내부 호출이므로 ±0% (alias 호출 1단계 제거 → 극미세 개선 0.1ms 미만).

---

## Section 11. 구현 계획

### 11.1 파일별 변경 명세 (Section 7 표를 11 단계 sampling 한 결과 — E-01 cross-check)

| 파일 | 액션 | Step 1 (import) | Step 2 (JSX) | 영향 받는 컬럼/props |
|------|------|-----------------|--------------|----------------------|
| SlipListPage.tsx | MODIFY | L21 변경 | L1024, L1236 (2 위치) | data, columns, loading, emptyText, onRowClick, className |
| SlipClosePage.tsx | MODIFY | L15 변경 | L298 | data, columns, loading, emptyText, className |
| SlipApprovePage.tsx | MODIFY | L14 변경 | L415 | data, columns, loading, emptyText, rowSelection(multi), className |
| SlipDailyStatusPage.tsx | MODIFY | L12 변경 | L164 | data, columns, loading, emptyText |
| DailyMonthlyReportPage.tsx | MODIFY | L14 변경 | L204 | data, columns, loading, emptyText |

**E-01 Section 7 ↔ Section 11 일관성**: 5/5 행 1:1 매칭. NEW/MODIFY 분류 5 MODIFY 일치. 파일 이름 일치.

### 11.2 Before/After 코드 스니펫 (E-02 — 최소 1개)

**대표 페이지 SlipClosePage.tsx (가장 단순한 패턴):**

**Before** (L15, L298-304):
```tsx
// L15
import BaseGrid from '../../../components/tomis/Grid/BaseGrid';

// L298
<BaseGrid<EndSlipItem>
  data={rows}
  columns={columns}
  loading={isLoading}
  emptyText="연도·월을 선택하고 조회 버튼을 클릭하세요."
  className="w-full"
/>
```

**After**:
```tsx
// L15 (변경 후)
import { Grid } from '@tomis/grid-core';

// L298 (변경 후)
<Grid<EndSlipItem>
  data={rows}
  columns={columns}
  enableSort
  enableFilter
  loading={isLoading}
  emptyText="연도·월을 선택하고 조회 버튼을 클릭하세요."
  className="w-full"
/>
```

**SlipApprovePage.tsx (rowSelection 패턴):**

**Before** (L14, L415-425):
```tsx
import BaseGrid from '../../../components/tomis/Grid/BaseGrid';

<BaseGrid<ApproveSlipListItem>
  data={rows}
  columns={columns}
  loading={isLoading}
  emptyText="조회 조건을 설정하고 조회 버튼을 클릭하세요."
  rowSelection={{
    mode: 'multi',
    onSelectionChange: setCheckedRows,
  }}
  className="w-full"
/>
```

**After**:
```tsx
import { Grid } from '@tomis/grid-core';

<Grid<ApproveSlipListItem>
  data={rows}
  columns={columns}
  enableSort
  enableFilter
  loading={isLoading}
  emptyText="조회 조건을 설정하고 조회 버튼을 클릭하세요."
  rowSelection={{
    mode: 'multi',
    onSelectionChange: setCheckedRows,
  }}
  className="w-full"
/>
```

**SlipListPage.tsx (2개 동시 변환 패턴):**

**Before** (L21, L1024 + L1236):
```tsx
import { BaseGrid } from '@tomis/grid-core/legacy';
// ...
<BaseGrid<SlipListItem> data={list} columns={columns} loading={isLoading} emptyText="..." onRowClick={handleRowClick} className="w-full" />
// ... 200 줄 후
<BaseGrid<Slip02ListItem> data={slip02List} columns={slip02Columns} loading={isLoading} emptyText="..." onRowClick={handleSlip02RowClick} className="w-full" />
```

**After**:
```tsx
import { Grid } from '@tomis/grid-core';
// ...
<Grid<SlipListItem> data={list} columns={columns} enableSort enableFilter loading={isLoading} emptyText="..." onRowClick={handleRowClick} className="w-full" />
// ...
<Grid<Slip02ListItem> data={slip02List} columns={slip02Columns} enableSort enableFilter loading={isLoading} emptyText="..." onRowClick={handleSlip02RowClick} className="w-full" />
```

### 11.3 구현 순서 (최소 2 단계 — E-03)

1. **Step 1 — 단일 페이지 검증 (SlipClosePage 만)**:
   - 가장 단순한 props (data/columns/loading/emptyText/className 5개) 페이지부터 시작.
   - L15 import 1줄 + L298 JSX 1군데 변경.
   - `npx tsc --noEmit` → 0 errors 확인.
   - dev server 띄워 SlipClosePage 외관 확인.
   - tsc 또는 외관 실패 시 다음 단계 진행 금지 — 원인 분석 후 spec 재검토.

2. **Step 2 — 나머지 4 페이지 일괄 변환**:
   - SlipListPage (2 위치 + monorepo legacy 제거) + SlipApprovePage (rowSelection) + SlipDailyStatusPage + DailyMonthlyReportPage 변환.
   - 전체 5 페이지 `npx tsc --noEmit` → 0 errors.
   - 5 페이지 외관 모두 dev server 확인.

3. **Step 3 — 검증 및 commit**:
   - AC-004 grep 검증 (`from '../../../components/tomis/Grid/BaseGrid'` 또는 `from '@tomis/grid-core/legacy'` → 5 파일에서 0 hits).
   - AC-001 tsc 0 errors.
   - AC-003 dev server console.warn 0 건 (deprecation 경고 없음).
   - 단일 commit (또는 페이지별 5 commit — D-02 AC-005) 으로 PR.

### 11.4 위험 요소

| 위험 | 영향 페이지 | 완화책 |
|------|------------|--------|
| SlipApprovePage 의 외부 페이지네이션과 `<Grid>` 내장 페이지네이션 중복 | SlipApprovePage | EC-02 — `enablePagination` 활성 금지. 사용처 코드 변경 X (현재도 BaseGrid 가 enablePagination=false 호출). |
| SlipListPage L21 monorepo legacy 호출 → 신규 import 위치 충돌 (이미 `@tomis/grid-core` 경로 사용 중) | SlipListPage | EC-01 — L21 한 줄 교체. 두 import 라인 동시 존재 금지. |
| `ColumnDef` 타입 호환 (사용처가 `../../../types/tomis/grid` 의 re-export 사용 중) | 5 페이지 | EC-03 — D3 결정으로 `ColumnDef` import 는 변경하지 않음. `@tanstack/react-table` 의 `ColumnDef<TData>` 와 local re-export 가 동일하므로 (`types/tomis/grid.ts` L1 + L4 export type) tsc 통과 예상. 실패 시 사용처 `ColumnDef` import 도 `@tanstack/react-table` 로 변경 (별도 commit). |
| `rowSelection.onSelectionChange` 콜백 타입 contravariance | SlipApprovePage | EC-05 — `setCheckedRows: Dispatch<SetStateAction<ApproveSlipListItem[]>>` 가 `(rows: ApproveSlipListItem[]) => void` 으로 함수 contravariance 통해 호환. tsc 통과 예상. 실패 시 명시 wrapper `(rows) => setCheckedRows(rows)`. |
| 외관 회귀 (cell padding / row height / sort glyph) | 5 페이지 | AC-002 시각 회귀 검증 — 5 페이지 dev server 렌더 후 픽셀 비교. `BaseGrid` alias 내부가 `<Grid enableSort enableFilter ...>` 호출 (L2-4) 이므로 이론적으로 0% 회귀. |

---

## Section 12. 검증 계획

### 12.1 단위 테스트 (E-05)
- **본 Goal 자체 단위 테스트 없음** — 사용처 마이그레이션이므로 grid-core 의 단위 테스트가 이미 MOD-GRID-01 G-001~G-005 에서 커버됨 (`Grid.tsx` + `legacy/BaseGrid.tsx` 매핑 검증 완료).
- 사용처에 추가 단위 테스트 필요시 후속 Goal 에서 추가 (본 Goal 범위 외).

### 12.2 시각 회귀 검증 (C-13 + C-17 의무 — migrationImpact: high)
- **방법 1 (자동)**: tw-framework-front 의 Storybook 미설정 환경 — Storybook story 신규 작성은 본 Goal 범위 외 (5 페이지가 복잡한 데이터 fetching 페이지여서 isolation 가능한 story 작성 부담 큼).
- **방법 2 (수동)**: 5 페이지 각각 dev server (`npm run dev`) 에서 마이그레이션 전후 동일 데이터로 스크린샷 캡처 후 외관 비교. 확인 대상:
  - cell padding (Tailwind `px-4 py-3` — Grid.tsx L318 + L409 동일)
  - row height
  - sort glyph (▲▼⇅) 위치 + 색상
  - hover bg-gray-50
  - selected row bg-blue-50 (SlipApprovePage rowSelection)
  - thead bg-gray-50 sticky top-0
  - empty state 메시지 텍스트

### 12.3 빌드 검증 (C-12 의무)
- `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx tsc --noEmit` → exit 0, 0 errors.
- `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx vite build` → 빌드 성공 (lazy + 트리쉐이킹 동작 확인).

### 12.4 마이그레이션 자동 보완 (codemod)
- MOD-GRID-99-B docs Goal 에서 codemod 작성 예정. 본 Goal 은 수동 교체 (5 파일 × 변경 ~6 라인 = 트리비얼).
- 후속 Goal 들(G-002~G-006)이 동일 패턴으로 22 페이지 추가 변환할 때 codemod 우선순위 상승 — 본 Goal 의 변환 패턴이 codemod template 의 입력.

---

## Section 13. 상용 제품화 영향

### 13.1 패키지 대상 (F-01)
- **본 Goal 의 변경 대상 = `tw-framework-front` 사용처만**. `@tomis/grid-core` / `@tomis/grid-pro-*` / `@tomis/grid-renderers` 패키지 변경 없음 (코어 변경 0).
- goals.json L7 `packageTarget: "tw-framework-front"` 일치.

### 13.2 라이선스 검증 호출 (F-02)
- **N/A** — 본 Goal 의 5 페이지는 MIT 영역(`@tomis/grid-core`) 만 사용. `@tomis/grid-pro-*` (Pro 영역) 호출 없음 (실측 Read 결과 — 5 페이지 모두 `BaseGrid` 만 사용, ChangeTrackingGrid/RangeSelectGrid 등 Pro alias 미사용).
- 따라서 `setLicenseKey()` / `configureGridLicense()` 호출 위치 불필요 (`grid-license` 런타임 검증 적용 대상 외).

### 13.3 문서 작성 계획 (F-03)
- **본 Goal 자체는 public API 변경 0** — Docusaurus API reference 항목 추가 불필요 (C-25 의무는 grid-core 신규 API 추가 시에만 발동).
- **권장 (선택)**: MOD-GRID-99-B docs Goal 의 "마이그레이션 가이드" 챕터에 Slip* 변환 예시 1개(SlipApprovePage rowSelection 패턴 — 가장 복잡) 추가 권장. 본 Goal 의 implement Stage 에서 docs 추가 의무 X.
- Storybook story 신규 작성: **본 Goal 범위 외** (12.2 방법 1 참조 — 부담 대비 효과 낮음).

### 13.4 peerDependencies 정책 (F-04)
- `@tomis/grid-core` 가 `react` / `react-dom` / `@tanstack/react-table` 을 peer 로 선언 (MOD-GRID-00 G-001 + MOD-GRID-01 G-005 확정 — `decisions/MOD-GRID-00-decisions.md` ADR-MOD-GRID-00-001 참조).
- tw-framework-front 의 package.json L20 / L22 / L32 / L34 가 이미 이 셋을 deps 로 보유 — peer 충족.
- 본 Goal 은 dependency 변경 0 → C-22 위반 없음 + peer mismatch 0.

### 13.5 semver 영향 (C-23)
- 본 Goal 은 `@tomis/grid-core` 의 public API 변경 0 → semver 영향 없음 (patch 도 아님).
- `BaseGrid` deprecated alias 는 1 minor 유지 정책에 의해 그대로 유지됨 — 본 Goal 후 deprecation 진행도 사용처 감소 ↑.
