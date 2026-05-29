# G-004 Spec — 마이그레이션 가이드 + Live demo (CodeSandbox/StackBlitz)

**Goal ID**: MOD-GRID-99-B / G-004  
**Spec version**: 1.0.0  
**Rubric**: specify-rubric v1.0.8 (threshold 85 — low tier)  
**Status**: DRAFT  
**Author**: tw-grid Spec Writer (automated)  
**Date**: 2026-05-15

---

## Section 1 — Goal 요약

G-004는 TOMIS 프로젝트에서 사용하던 8개 Grid 변형 컴포넌트(`BaseGrid`, `VirtualGrid`, `TreeGrid`, `ColumnPinGrid`, `EditableGrid`, `GroupedHeaderGrid`, `ChangeTrackingGrid`, `RangeSelectGrid`)와 별도 아키텍처인 `DataTable`을 `@tomis/grid-core`의 `<Grid>` 컴포넌트로 이전하는 **마이그레이션 가이드 문서 5개**를 Docusaurus 사이트에 추가하는 Goal이다.

문서 배포 대상: `topvel-grid-monorepo/apps/docs/docs/migration/`  
Live demo: StackBlitz embed ≥3개 (basic / virtualized / change-tracking)

본 Goal은 코드 이전을 *수행*하지 않는다. MOD-GRID-17 이하의 각 Goal이 실제 파일 단위 이전을 담당하며, G-004는 그 과정을 안내하는 **참조 문서**를 작성한다.

---

## Section 2 — 선행 결정 (D-series)

### D1 — C-28 경로 prefix 수정 (필수)

`docs-goals.json` G-004 `implementFiles`는 TOMIS 워크트리 내 경로를 사용한다:

```
D:/project/topvel_project/TOMIS/apps/docs/docs/migration/*.md   ← 잘못됨
```

C-28에 따라 모노레포 산출물은 반드시 모노레포 prefix를 사용해야 한다. 본 spec의 Section 7은 아래 prefix로 교정한다:

```
D:/project/topvel_project/topvel-grid-monorepo/apps/docs/docs/migration/   ← 올바름
```

**근거**: C-28 — monorepo path prefix rule.  
**영향**: 구현자는 goals.json의 경로를 따르지 말고 이 spec Section 7을 따른다.

---

### D2 — 8개 변형의 현재 이전 상태 구분 (필수)

8개 변형은 현재 이전 완료도가 서로 다르다. 가이드 문서의 "Before / After" 코드 예시는 실제 파일 상태를 반영해야 한다 (C-1: Read before write).

| 변형 | 현재 상태 | 가이드 관점 |
|------|----------|------------|
| GroupedHeaderGrid | 완전 이전 (re-export from `@tomis/grid-pro-header`) | 이미 완료 — 사용처 추가 작업 없음 |
| ChangeTrackingGrid | 완전 이전 (compat shim, `@tomis/grid-pro-tracking`) | 이미 완료 — shim API 유지 |
| RangeSelectGrid | 완전 이전 (wrapper, `@tomis/grid-pro-range`) | 이미 완료 — wrapper API 유지 |
| EditableGrid | 부분 이전 (`@tomis/grid-renderers` + `@tomis/grid-pro-tracking` import, 컴포넌트 쉘은 로컬 유지) | 진행 중 — MOD-GRID 해당 Goal에서 완성 |
| BaseGrid | 미이전 (raw TanStack) | 이전 대상 |
| VirtualGrid | 미이전 (raw TanStack + `@tanstack/react-virtual`) | 이전 대상 |
| TreeGrid | 미이전 (raw TanStack, `getExpandedRowModel`) | 이전 대상 |
| ColumnPinGrid | 미이전 (raw TanStack, `ColumnPinningState`) | 이전 대상 |

**근거**: C-1 — 각 파일 직접 확인.  
**영향**: 8-variant-table.md는 "현재 상태" 컬럼을 포함해야 한다.

---

### D3 — legacy alias 실제 목록 (5개, 8개 아님)

`grid-core/src/index.ts`가 export하는 legacy alias는 5개다:

```ts
// ./legacy에서 re-export
BaseGrid
VirtualGrid / VirtualGridProps
ColumnPinGrid / ColumnPinGridProps
GroupedHeaderGrid / GroupedHeaderGridProps
TreeGrid / TreeGridProps
```

`EditableGrid`, `ChangeTrackingGrid`, `RangeSelectGrid`에 대한 legacy alias는 grid-core에 존재하지 **않는다**.

- `EditableGrid`: `@tomis/grid-renderers` + `@tomis/grid-pro-tracking` 조합으로 직접 구성
- `ChangeTrackingGrid`: `@tomis/grid-pro-tracking`의 compat shim 파일에서 직접 import
- `RangeSelectGrid`: `@tomis/grid-pro-range`에서 직접 import

**근거**: C-1 — `grid-core/src/index.ts` 직접 확인.  
**영향**: deprecated-aliases.md는 5개 alias만 문서화한다.

---

### D4 — sidebars.ts 처리 (명시적 범위 배제)

5개 `.md` 파일 추가 시 Docusaurus `sidebars.ts`에 항목 등록이 필요하다. 그러나:

- `sidebars.ts`는 G-001 (Docusaurus 사이트 설정) Goal의 소유 파일이다.
- G-004 implementFiles에 포함하면 G-001과 충돌한다.

**결정**: `sidebars.ts` 수정은 이 Goal 범위에서 제외한다. G-001 구현 보고서 또는 후속 Docusaurus 설정 PR에서 처리하도록 NOTE로 남긴다.

---

### D5 — "27 사용처" 수치의 출처

AC-003은 "27 pages grouping guide"를 언급한다. 이 수치는 MOD-GRID-17 Goal 목록(전체 Grid 이전 범위)에서 산출된 것으로, G-004 spec에서 직접 검증하지 않는다. 

**결정**: 가이드 문서에서는 "MOD-GRID-17 이하 Goals가 다루는 전체 사용처 파일 (≥27개 예상)"로 표현하고, 정확한 수치는 MOD-GRID-17 Goals를 권위적 출처로 인용한다.

---

## Section 3 — 변환 테이블 (9 entries)

### 3-1. 8개 Grid 변형 → `<Grid>` 변환 요약

아래 표는 `8-variant-table.md` 문서의 핵심 내용이다.

| # | 변형 | Props 특징 (Before) | `<Grid>` 매핑 (After) | 필요 패키지 | 현재 상태 |
|---|------|--------------------|-----------------------|------------|----------|
| 1 | **BaseGrid** | `data, columns, pagination?, rowSelection?, onRowClick?, loading, emptyText, className` | `<Grid mode="client" data columns pagination rowSelection onRowClick loading emptyText className />` | `@tomis/grid-core` | 미이전 |
| 2 | **VirtualGrid** | extends BaseGridProps + `rowHeight=40, containerHeight=500`, no pagination | `<Grid enableVirtualization rowHeight={N} containerHeight={N} />` | `@tomis/grid-core` | 미이전 |
| 3 | **TreeGrid** | `data, columns: ColumnDef[], getSubRows?, expandAll=false, onRowClick?, loading, emptyText, className` | `<TreeGrid ...>` alias (grid-core legacy) | `@tomis/grid-core` | 미이전 |
| 4 | **ColumnPinGrid** | `data, columns: ColumnDef[], pinLeft=[], pinRight=[], pagination?, rowSelection?, onRowClick?, loading` | `<ColumnPinGrid pinLeft pinRight ...>` alias (grid-core legacy) | `@tomis/grid-core` | 미이전 |
| 5 | **EditableGrid** | `data, columns: ColumnDef<TData,unknown>[], onDataChange?, pagination?, loading, enableChangeTracking=false, rowKey?` | `<Grid enableEditing keyboardEdit>` + `useChangeTracking` hook | `@tomis/grid-renderers` + `@tomis/grid-pro-tracking` | 부분 이전 |
| 6 | **GroupedHeaderGrid** | 기존 props (grid-pro-header에 위임) | `<GroupedHeaderGrid ...>` from `@tomis/grid-pro-header` (이미 re-export) | `@tomis/grid-pro-header` | 완전 이전 |
| 7 | **ChangeTrackingGrid** | `data, columns, ref: ChangeTrackingHandle (getChanges, resetChanges, addRow, deleteRow), onDataChange?, rowKey?` | compat shim 유지 — 기존 코드 변경 불필요. `useChangeTracking` hook으로 직접 사용 시 `@tomis/grid-pro-tracking` | `@tomis/grid-pro-tracking` | 완전 이전 |
| 8 | **RangeSelectGrid** | `data, columns: ColumnDef[], onRangeChange?, loading?, emptyText?, className?` | wrapper 유지 — 기존 코드 변경 불필요. `useCellRange` hook 직접 사용 시 `@tomis/grid-pro-range` | `@tomis/grid-pro-range` | 완전 이전 |

### 3-2. DataTable → `<Grid>` 변환 요약

`DataTable`은 8개 변형과 아키텍처가 다르다 (서버 페이지네이션 중심, `ColumnInfo`/`ButtonInfo` props 구조).

| 항목 | DataTable (Before) | `<Grid>` (After) |
|------|--------------------|------------------|
| 컴포넌트 | `<DataTable data pageingInfo columnInfos buttonInfo rowActionInfo listAction ... />` | `<Grid mode="server" manualPagination data columns pagination onPageChange />` |
| 페이지 정보 | `pageingInfo: { hasNextPage, hasPreviousPage, pageCount, pageNo, pageSize, totalCount }` | `pagination: { pageIndex, pageSize, pageCount }` + `onPageChange` callback |
| 컬럼 정의 | `columnInfos: ColumnInfo[]` (`{ id, type, align, name, width, visibility?, etc? }`) | `columns: ColumnDef<TData>[]` via `createColumns(columnInfos)` 헬퍼 또는 직접 정의 |
| 버튼 영역 | `buttonInfo: ButtonInfo` (`{ downloadEnable, downloadTitle, downloadAction, deleteListDataEnable, ... }`) | `toolbar` slot 또는 별도 `<GridToolbar>` 컴포넌트 |
| 행 액션 | `rowActionInfo: RowActionInfo` (`{ editEnable, editAction, deleteDataEnable, ... }`) | `columns`에 action cell renderer 추가 |
| 권한 | `permissions` prop | 상위 컴포넌트에서 조건부 렌더링 또는 toolbar slot에 위임 |

---

## Section 4 — 기능적 요구사항

### FR-001: 8개 변형 전환 테이블 문서 (AC-001)
**출처**: AC-001 (source: L0)

`8-variant-table.md`에 8개 변형 각각에 대해 아래를 포함한다:
- Before: 원본 Props 인터페이스 (핵심 속성)
- After: `<Grid>` 또는 해당 모노레포 패키지 API 매핑
- 현재 이전 상태 (D2 참조)
- 코드 예시 (before/after 스니펫)

### FR-002: DataTable 전환 테이블 문서 (AC-002)
**출처**: AC-002 (source: L0)

`dataTable-migration.md`에 DataTable → `<Grid mode="server">` 변환 전체 과정을 포함한다:
- `ColumnInfo` → `ColumnDef` 변환 (타입별: text, number, date, custom)
- `ButtonInfo` → toolbar slot 매핑
- `RowActionInfo` → action cell renderer 매핑
- `pageingInfo` → `pagination` + `onPageChange` 매핑
- `listAction(act, value)` → 개별 핸들러 분리 패턴

### FR-003: 증분 이전 전략 가이드 (AC-003)
**출처**: AC-003 (source: C-19)

`incremental-strategy.md`에:
- C-19 규칙 설명: Goal 당 ≤5 사용처 파일
- MOD-GRID-17 이하 Goals에서 다루는 전체 사용처 파일 (≥27개 예상, MOD-GRID-17 Goals 참조)
- Goal별 그룹핑 기준: 도메인 유형 + 변형 종류
- 이전 순서 권장: 완전 이전 변형 사용처 → 부분 이전 변형 → 미이전 변형
- 롤백 전략: 파일별 독립적 이전으로 부분 롤백 가능

### FR-004: StackBlitz Live demo 3개 이상 (AC-004)
**출처**: AC-004 (source: C-25)

`live-demos.md`에 StackBlitz embed ≥3개:
- **basic**: `<Grid mode="client">` 기본 사용 (BaseGrid 이전 결과)
- **virtualized**: `<Grid enableVirtualization rowHeight={40}>` (VirtualGrid 이전 결과)
- **change-tracking**: `<Grid>` + `useChangeTracking` hook (ChangeTrackingGrid compat → hook 패턴)

각 embed는 `<iframe>` 또는 `@stackblitz/sdk` 방식으로 삽입. CSP 차단 환경을 위한 정적 코드 블록 fallback 필수 (EC-04).

### FR-005: Deprecated alias 문서 (AC-005)
**출처**: AC-005 (source: C-23)

`deprecated-aliases.md`에:
- grid-core legacy alias 5개 목록 (D3 참조): BaseGrid, VirtualGrid, ColumnPinGrid, GroupedHeaderGrid, TreeGrid
- C-23 규칙: alias는 최소 1 minor version 동안 유지
- 각 alias의 권장 대체 API
- `EditableGrid`, `ChangeTrackingGrid`, `RangeSelectGrid`는 grid-core alias 없음 — 각 패키지에서 직접 import

---

## Section 5 — AC 매핑

| AC ID | 요구사항 | 검증 방법 | 출처 |
|-------|----------|----------|------|
| AC-001 | 8개 변형 from→to 테이블 (현재 상태 포함) | `8-variant-table.md` 존재 + 8 변형 행 확인 | L0 |
| AC-002 | DataTable from→to 테이블 (ColumnInfo, ButtonInfo, pageingInfo 포함) | `dataTable-migration.md` 존재 + 5개 변환 항목 확인 | L0 |
| AC-003 | C-19 증분 전략 + ≥27 pages 그룹핑 가이드 | `incremental-strategy.md` 존재 + C-19 언급 + MOD-GRID-17 인용 | C-19 |
| AC-004 | StackBlitz embed ≥3 (basic/virtualized/change-tracking) | `live-demos.md` iframe/embed 코드 3개 이상 + fallback 코드 블록 | C-25 |
| AC-005 | deprecated alias 테이블 1 minor version 규칙 | `deprecated-aliases.md` 존재 + 5개 alias + C-23 규칙 명시 | C-23 |

---

## Section 6 — 엣지 케이스

| ID | 상황 | 대응 |
|----|------|------|
| EC-01 | 사용처 코드가 `grid-core`에 없는 alias (EditableGrid, ChangeTrackingGrid, RangeSelectGrid) import 시도 | `deprecated-aliases.md`에 alias 부재 명시 + 올바른 패키지 import 경로 안내 |
| EC-02 | DataTable의 `type: 'custom'` ColumnInfo — `customFormatter` 함수 사용 | `dataTable-migration.md`에 `ColumnDef.cell` renderer 매핑 예시 포함 |
| EC-03 | 이전 대상 파일이 Goal당 5개 초과하는 경우 | `incremental-strategy.md`에 그룹 분할 기준 설명 + C-19 규칙 재인용 |
| EC-04 | StackBlitz iframe이 CSP 정책으로 차단됨 | `live-demos.md` 각 embed 직후 `<details>` 또는 static 코드 블록으로 전체 소스 제공 |
| EC-05 | `ChangeTrackingHandle` ref API 사용 코드 — compat shim 이미 제공 | `8-variant-table.md`에 "compat shim 사용 시 기존 ref 코드 그대로 유지 가능" 명시 |
| EC-06 | `VirtualGrid`에서 `pagination` prop 사용하는 코드 (BaseGridProps 상속으로 prop 존재하나 동작 없음) | 이전 가이드에 "VirtualGrid → `<Grid enableVirtualization>` 시 pagination prop 제거 권장" 명시 |

---

## Section 7 — 구현 파일 목록

**총 5개 파일 (모두 NEW)**

C-28에 따라 모든 경로는 모노레포 prefix를 사용한다 (D1 결정 참조).

| # | 경로 | 액션 | 설명 |
|---|------|------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/docs/migration/8-variant-table.md` | NEW | 8개 변형 → `<Grid>` 전환 테이블 (FR-001) |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/docs/migration/dataTable-migration.md` | NEW | DataTable → `<Grid mode="server">` 전환 가이드 (FR-002) |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/docs/migration/incremental-strategy.md` | NEW | C-19 증분 이전 전략 (FR-003) |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/docs/migration/live-demos.md` | NEW | StackBlitz Live demo ≥3개 (FR-004) |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/docs/migration/deprecated-aliases.md` | NEW | Deprecated alias 5개 + C-23 규칙 (FR-005) |

> **NOTE (D4)**: `apps/docs/sidebars.ts`에 위 5개 파일 항목 추가가 필요하다. 이 파일은 G-001 소유이므로 G-004 범위에서 제외한다. G-001 구현 완료 후 또는 별도 Docusaurus 설정 PR에서 처리한다.

---

## Section 8 — 영향 범위

| 항목 | 값 |
|------|----|
| 변경 파일 수 | 5 (모두 NEW `.md`) |
| 사용처 파일 수 (affectedUsageFiles) | 0 — 문서만 추가, 소스 파일 미변경 |
| 번들 영향 | +0 KB (`.md` 파일은 런타임 번들에 미포함) |
| 브레이킹 체인지 | 없음 |
| 테스트 영향 | 없음 (Docusaurus 빌드 성공 여부는 G-001 CI에서 확인) |
| C-19 사용처 카운트 | 0 / 5 (문서 파일은 C-19 카운트 대상 아님) |

---

## Section 9 — 의존성

| ID | 의존 대상 | 이유 | 상태 |
|----|----------|------|------|
| DEP-01 | G-001 (Docusaurus 사이트 설정) | `apps/docs/` 사이트 존재 필요 | 선행 완료 가정 |
| DEP-02 | grid-core `./legacy` 파일 | alias 5개 확인 (D3) | 확인 완료 |
| DEP-03 | 8개 변형 파일 (tw-framework-front) | 실제 Props 인터페이스 확인 (D2) | 확인 완료 |
| DEP-04 | DataTable 파일 (tw-framework-front) | ColumnInfo/ButtonInfo/RowActionInfo 인터페이스 확인 | 확인 완료 |
| DEP-05 | MOD-GRID-17 Goals | "≥27 사용처" 수치의 권위적 출처 | 인용만 (직접 검증 불필요) |

---

## Section 10 — 비기능 요구사항

| 항목 | 요구사항 |
|------|----------|
| 문서 형식 | Docusaurus MDX 호환 Markdown (`.md` 또는 `.mdx`) |
| 코드 예시 언어 | TypeScript (`tsx`) — 일관성 |
| StackBlitz embed | `<iframe>` 방식 또는 `@stackblitz/sdk` + CSP fallback static 코드 블록 필수 |
| 한국어/영어 | 제목·설명은 한국어, 코드 식별자(prop명, 패키지명)는 영어 유지 |
| 링크 | 상호 문서 간 상대 경로 링크 (`./8-variant-table.md`, `./deprecated-aliases.md` 등) |

---

## Section 11 — 파일 구조 (최종)

```
topvel-grid-monorepo/
└── apps/
    └── docs/
        └── docs/
            ├── architecture.mdx          (기존 — 미변경)
            ├── getting-started.mdx       (기존 — 미변경)
            └── migration/                (NEW 디렉토리)
                ├── 8-variant-table.md    (NEW — AC-001)
                ├── dataTable-migration.md (NEW — AC-002)
                ├── incremental-strategy.md (NEW — AC-003)
                ├── live-demos.md         (NEW — AC-004)
                └── deprecated-aliases.md (NEW — AC-005)
```

> 모든 Section 7 파일이 Section 11에 포함되어 있음 (E-01 준수).

---

## Section 12 — 구현 가이드라인

### 12-1. 8-variant-table.md 작성 지침

문서 구조:
1. 서론: 이 문서의 목적 (8개 변형 이전 참조 테이블)
2. 전체 요약 테이블 (Section 3-1 기반)
3. 각 변형별 상세 섹션 (8개):
   - Before: Props 인터페이스 (tsx 코드 블록)
   - After: `<Grid>` 또는 대상 패키지 API (tsx 코드 블록)
   - 현재 이전 상태 (미이전 / 부분 이전 / 완전 이전)
   - 특이사항 (있는 경우)

**완전 이전 변형 (GroupedHeaderGrid, ChangeTrackingGrid, RangeSelectGrid)** 작성 주의:
- "이미 이전 완료"를 명확히 표시
- 기존 import 경로가 자동으로 새 구현을 가리킴을 설명
- 추가 작업 불필요함을 명시

**부분 이전 변형 (EditableGrid)** 작성 주의:
- import는 새 패키지를 사용하나 컴포넌트 쉘은 로컬에 남아있음을 설명
- 완성 이전을 위해 남은 작업 설명

### 12-2. dataTable-migration.md 작성 지침

5개 변환 항목 각각에 대해:
- 실제 타입 정의 (ColumnInfo, ButtonInfo, RowActionInfo, pageingInfo)
- 대응되는 `<Grid>` API
- 변환 코드 예시 (before → after)
- `createColumns()` 헬퍼 함수 사용법 (grid-core export)

### 12-3. live-demos.md 작성 지침

StackBlitz 프로젝트 URL 패턴:
```
https://stackblitz.com/edit/tomis-grid-{demo-name}?embed=1&file=src/App.tsx
```

각 embed 구조 (예시, MDX 내):

    ## Basic Grid
    
    <iframe
      src="https://stackblitz.com/edit/tomis-grid-basic?embed=1&file=src/App.tsx"
      style={{ width: '100%', height: 500, border: 0 }}
      title="tomis-grid-basic"
    />
    
    <details>
    <summary>소스 코드 전체 보기 (CSP 차단 환경)</summary>
    
    ```tsx
    // 전체 소스 코드 (정적 코드 블록)
    ```
    
    </details>

### 12-4. deprecated-aliases.md 작성 지침

각 alias 항목 구조:
- alias 이름
- 현재 동작 (어디서 re-export)
- 권장 대체 API
- 제거 예정 버전 (C-23: 현재 minor + 1 이상)
- 마이그레이션 예시 코드

`EditableGrid`, `ChangeTrackingGrid`, `RangeSelectGrid`는 별도 섹션으로:
- grid-core alias 없음 명시
- 올바른 import 경로 (`@tomis/grid-renderers`, `@tomis/grid-pro-tracking`, `@tomis/grid-pro-range`)

---

## Section 13 — Rubric 자가 점검 (specify-rubric v1.0.8)

### H Meta-Gate (모두 pass 필요)

| ID | 항목 | 결과 | 근거 |
|----|------|------|------|
| H-01 | Section 1~13 모두 존재 | PASS | 이 문서 전체 구조 |
| H-02 | Section 7 implementFiles ↔ Section 11 파일 구조 일치 | PASS | 5개 파일 모두 양쪽에 포함 |
| H-03 | C-1 위반 없음 (추측 없이 파일 직접 확인) | PASS | 8개 변형, DataTable, grid-core index.ts 모두 직접 Read |

### A — Clarity (명확성)

| ID | 항목 | 결과 | 근거 |
|----|------|------|------|
| A-01 | Goal 한 문장 요약 가능 | PASS | Section 1 첫 단락 |
| A-02 | 비전문가도 읽을 수 있는 수준 | PASS | 한국어 설명 + 코드 예시 |
| A-03 | 모호한 용어 없음 | PASS | "이전 완료/부분/미이전" 명확히 정의 (D2) |
| A-04 | 각 AC가 검증 방법 포함 | PASS | Section 5 검증 방법 컬럼 |
| A-05 | 의존성 명시 | PASS | Section 9 DEP-01~05 |

### B — Completeness (완전성)

| ID | 항목 | 결과 | 근거 |
|----|------|------|------|
| B-01 | 모든 AC가 FR에 매핑 | PASS | Section 5 AC→FR 매핑 + Section 4 FR-001~005 |
| B-02 | 엣지 케이스 ≥3 | PASS | EC-01~EC-06 (6개) |
| B-03 | 비기능 요구사항 포함 | PASS | Section 10 |
| B-04 | 구현 가이드라인 포함 | PASS | Section 12 |
| B-05 | 영향 범위 명시 | PASS | Section 8 |

### C — Consistency (일관성)

| ID | 항목 | 결과 | 근거 |
|----|------|------|------|
| C-01 | Section 7 ↔ Section 11 파일 수 일치 | PASS | 5개 파일 양쪽 동일 |
| C-02 | AC 출처와 FR 내용 일치 | PASS | Section 4 출처 명시 + Section 5 매핑 |
| C-03 | 경로 prefix 일관성 (C-28) | PASS | D1 결정 + Section 7 모노레포 prefix 사용 |
| C-04 | 변형 상태 설명 일관성 | PASS | D2 테이블 ↔ Section 3 ↔ Section 12 일치 |
| C-05 | alias 개수 일관성 (5개) | PASS | D3 결정 ↔ Section 4 FR-005 ↔ Section 12-4 일치 |

### D — Decisions (결정 문서화)

| ID | 항목 | 결과 | 근거 |
|----|------|------|------|
| D-01 | 선행 결정 D-series 명시 | PASS | Section 2: D1~D5 |
| D-02 | 대안 거부 이유 포함 | PASS | D4 (sidebars.ts 제외 이유) |
| D-03 | 제약사항 인용 | PASS | D1(C-28), D2(C-1), D3(C-1), D4(G-001), D5(AC-003→MOD-GRID-17) |
| D-04 | 불확실한 수치 출처 명시 | PASS | D5 "27 사용처" → MOD-GRID-17 인용 |
| D-05 | C-28 경로 수정 명시 | PASS | D1 전용 결정 |
| D-06 | 현재 이전 상태 구분 명시 | PASS | D2 전용 결정 |

### E — Evidence (증거)

| ID | 항목 | 결과 | 근거 |
|----|------|------|------|
| E-01 | Section 7 ↔ Section 11 일치 (cross-check) | PASS | NOTE 명시 "모든 Section 7 파일이 Section 11에 포함" |
| E-02 | Props 인터페이스 실제 파일 기반 | PASS | C-1 직접 Read (8개 변형 파일) |
| E-03 | alias 목록 실제 파일 기반 | PASS | grid-core/src/index.ts 직접 Read |
| E-04 | DataTable 타입 실제 파일 기반 | PASS | data-table-types.ts 직접 Read |
| E-05 | "27 사용처" 수치 출처 명시 | PASS | D5 결정 |
| E-06 | prose ↔ structured form 시맨틱 일관성 | PASS | Section 3 표 ↔ Section 4 FR 텍스트 내용 동일 |

### F — Feasibility (실현 가능성)

| ID | 항목 | 결과 | 근거 |
|----|------|------|------|
| F-01 | C-19 준수 (≤5 사용처/Goal) | PASS | 0 사용처 파일 (문서만 추가) |
| F-02 | C-23 준수 (alias 1 minor 유지) | PASS | Section 4 FR-005 + Section 12-4 |
| F-03 | C-25 준수 (≥3 StackBlitz) | PASS | Section 4 FR-004: 3개 명시 |
| F-04 | 번들 영향 없음 확인 | PASS | Section 8: +0KB |

### G — Guard (보호)

| ID | 항목 | 결과 | 근거 |
|----|------|------|------|
| G-01 | EC-04 CSP fallback 포함 | PASS | Section 6 EC-04 + Section 12-3 구현 지침 |

---

**추정 rubric 점수**: 32/32 항목 PASS → 100/100 (threshold 85 충족)

---

*spec 작성 완료. 구현자는 Section 7의 5개 파일을 작성하고, 완료 후 G-004-implement-report.md를 제출한다.*
