# G-006 Spec: payroll/admin 5 페이지 — 전수 already-in-target-state verification (Goal 79/79 — 1.0 release closer)

**Goal**: MOD-GRID-17 / migration / G-006
**Priority**: P0 | **Migration Impact**: high | **Threshold**: 95
**Package Target**: `tw-framework-front` (사용처 검증 — `@tomis/grid-core` / `@tomis/grid-pro-tracking` 코어 변경 없음)
**License Tier**: N/A (admin: MIT 영역 사용 / payroll: Pro 영역 트랜지티브 사용 — 직접 import 없음 D2)

---

## ★ 사전 결정 표 (D# — Spec Writer 권위)

| D# | 결정 | 사유 | goals.json 영향 |
|----|------|------|----------------|
| **D1** | **★ Scope split 5 → 2 sub-patterns — all 5 already in target end-state**. goals.json G-006 `affectedUsageFiles[5]` 의 실측 결과 (5 페이지 모두 Read + Grep 완료):<br>• **MenuManagePage.tsx** (L7 `import { Grid } from '@tomis/grid-core';` + L157 `<Grid<MenuNode>` 1 사이트) → **Pattern α (Already-Direct)** — `@tomis/grid-core` 직접 사용. 0 변환 필요.<br>• **OrgMasterPage.tsx** (L7 `import { Grid } from '@tomis/grid-core';` + L298 `<Grid<DeptNode>` 1 사이트) → **Pattern α (Already-Direct)** — `@tomis/grid-core` 직접 사용. 0 변환 필요.<br>• **PayMmcd02Page.tsx** (L5 `import ChangeTrackingGrid, { type ChangeTrackingHandle } from '../../../components/tomis/Grid/ChangeTrackingGrid';` + L310 `<ChangeTrackingGrid` 1 사이트) → **Pattern β (Compat-Shim)** — 로컬 compat shim 사용. Shim 내부에서 `@tomis/grid-pro-tracking` 트랜지티브 사용.<br>• **PayMmcd01Page.tsx** (L5 동일 import + L505 `<ChangeTrackingGrid` 1 사이트) → **Pattern β**.<br>• **PayrollEditablePage.tsx** (L5 동일 import + L199 `<ChangeTrackingGrid` 1 사이트) → **Pattern β**.<br>**Grep `<BaseGrid` 결과**: 5 페이지 모두 **0 hits**. **Grep `<EditableGrid` 결과**: 5 페이지 모두 **0 hits** (Goal prompt 의 "EditableGrid → `<Grid enableInlineEdit enableChangeTracking>`" 클레임은 disk 와 불일치 — C-1 spec authority 적용). **Grep `<Grid` 결과**: admin 2 파일에 각 1 hit (`MenuManagePage.tsx` L157, `OrgMasterPage.tsx` L298). **Grep `<ChangeTrackingGrid` 결과**: payroll 3 파일에 각 1 hit (L310, L505, L199).<br>**결론**: 5/5 페이지 모두 spec 의 end-state 에 이미 도달 — net 0 substantive 변경. 본 Goal 은 **steady-state verification** (G-005 implement-score `noOpImplementLoop` 패턴 cascading). | ADR-MOD-GRID-17-005 (Investigative Scope-Reduction Authority) + A-04 v1.0.9 reality-check sub-bullet. **G-004 (DataTable 제외) 및 G-005 (Pattern B 4 deferred) 와 의미 구분**: G-006 은 **5/5 모두 already-in-target** — deferred 없음, 다른 카테고리 분기 없음. G-001~G-005 누적 17 페이지 + 본 Goal 5 페이지 (이미 변환됨) + 4 Pattern B (G-005b deferred) = **MOD-GRID-17 1.0 closer 26 affected files**. | `affectedUsageFiles` 5 entries 보존 (audit trail). `implementFiles[5]` 보존 + `scopeNote` 필드 추가 의무 — "5/5 already in target end-state (admin 2 = Pattern α direct, payroll 3 = Pattern β compat shim)". |
| **D2** | **★ Pattern β Compat-Shim 경로는 공식 마이그레이션 종착점 — 직접 `@tomis/grid-pro-tracking` import 변환 거부**. 거부 사유 3 항목:<br>(1) **tsconfig.app.json paths 누락**: 현 `tsconfig.app.json` L21-25 paths 에 `@tomis/grid-core`, `@tomis/grid-core/legacy`, `@tomis/grid-renderers`, `@tomis/grid-pro-range` 4개만 등록. **`@tomis/grid-pro-tracking` 누락** — 직접 import 시 tsc TS2307 fail (`vite.config.ts` L22 alias 만으로는 tsc 미해결).<br>(2) **AC-002 visual regression by design**: 로컬 compat shim `ChangeTrackingGrid.tsx` L43-47 의 `COMPAT_ROW_STATUS_COLORS` 가 **border-l-2 left-side border** 보존 (`bg-green-50 border-l-2 border-l-green-400` / `bg-yellow-50 border-l-2 border-l-yellow-400` / `bg-red-50 border-l-2 border-l-red-400 opacity-60 line-through`). vs `@tomis/grid-pro-tracking` 의 `defaultRowStatusClassNames` (G-004 export) 는 all-sides `border-green-400` 변환 — **shim 작성자가 명시적으로 외관 보존 위해 OLD strings 유지** (shim 파일 L37-46 주석 인용). 직접 import 변환 시 **외관 회귀 deliberate** — AC-002 high-impact NO.<br>(3) **API breaking**: 로컬 shim API (`initialData`/`getChanges`/`addRow`/`deleteRow(index)`/`commitChanges?`) 는 OLD `ChangeTrackingGrid` 시그니처 보존 ("compat shim — preserve the OLD ROW_STATUS_COLORS class strings byte-for-byte" — shim L37). 직접 `@tomis/grid-pro-tracking` `ChangeTrackingGrid` alias 는 **다른 API** — `data` (initialData 아님) + 필수 `rowKey` prop + `getChangeSet()` (getChanges 아님). 변환 시 3 페이지 모두 `gridRef.current?.getChanges()` (PayMmcd02 L?, PayMmcd01 L?, PayrollEditable L87 `const changes = gridRef.current?.getChanges();`) + `addRow` + `deleteRow(index)` + `commitChanges` 4 메서드 시그니처 변경 + `initialData` rename + 필수 `rowKey` prop 추가 — 비-trivial surgical 변경 + AC-002 외관 회귀 + tsconfig.app.json paths 추가 결정 (ADR 필요). | C-1 (spec authority + disk reality) + C-27 (spec vs prompt drift — prompt 의 "EditableGrid → enableInlineEdit/enableChangeTracking" 클레임은 disk 와 모순, 본 D2 로 명시 거부) + MOD-GRID-10/G-005 ADR (shim 의 의도된 호환 역할 — `tw-framework-front` 소비자에게 외관 보존 보장). 직접 import 변환은 **본 Goal 범위 외** — 별도 후속 Goal 책임 (MOD-GRID-18 또는 G-006b — shim 제거 시점). | `bundleImpact.expected = "0 KB"` 유지. payroll 3 파일은 이미 트랜지티브로 `@tomis/grid-pro-tracking` 사용 (shim 내부 import — shim 파일 L35) → 번들 영향 0. |
| **D3** | **Pattern α (admin 2 파일) verification**: `@tomis/grid-core` 직접 사용 — `import { Grid } from '@tomis/grid-core';` (L7 둘 다) + `<Grid<TData>` JSX 1 사이트씩 (MenuManage L157 + OrgMaster L298). **0 변경 필요** — spec end-state 그대로. 변경 검증 방법: Grep `<BaseGrid` 0 hits + Grep `from '@tomis/grid-core'` 1 hit/파일 + tsc 0 errors. | G-001~G-004 의 17 페이지 + G-005 의 1 파일 (`FundStatusPage`) 와 동일한 **Pattern A → α 종착점** — 이미 도달됨. | N/A |
| **D4** | **Pattern β (payroll 3 파일) verification**: 로컬 compat shim (`'../../../components/tomis/Grid/ChangeTrackingGrid'`) 사용 — shim 자체가 공식 종착점 (MOD-GRID-10/G-005 ADR 결과물). shim 내부 `@tomis/grid-pro-tracking` 트랜지티브 사용 (shim L35) — 코드 토폴로지상 종착점 도달. **0 변경 필요**. 검증 방법: Grep `from '@tomis/grid-pro-tracking'` 직접 사용 0 hits/페이지 (간접 사용 OK) + `<ChangeTrackingGrid` 1 hit/페이지 (L310/L505/L199) + tsc 0 errors. | shim 의 디자인 의도 = TOMIS 소비자에게 외관 + API 호환 보존 (MOD-GRID-10/G-005 D3 + advisor option (a) — shim 파일 L7-21 design comment). C-19 점진 — shim 직접 제거는 별도 Goal 책임 (현 시점 shim 사용처 = 3 페이지 + 로컬 `EditableGrid.tsx` 한 파일이 `useChangeTracking` 사용 — shim 의 존재 가치 유지). | N/A |
| **D5** | `affectedUsageFiles` 배열 = 5 entries 보존 (audit trail). `implementFiles[]` = **5 파일 → 0 변경 (verification only)** (C-19 ≤5 준수 — Pattern α 2 + Pattern β 3 = 5 ≤ 5). NEW 0 + MODIFY 0 + VERIFY 5 = 5 파일. | 본 Goal 은 **0 substantive 변경** + 5 파일 verification (G-005 implement-score `noOpImplementLoop` 패턴 cascading). | `affectedUsageFiles[]` 보존 + `stages.specify.scopeNote` 갱신 의무. |
| **D6** | Section 9 의존성 = "변경 없음". `@tomis/grid-core` workspace alias 는 `vite.config.ts` L18 + `tsconfig.app.json` L23 paths 에서 이미 wiring (G-001~G-005 동일). **`@tomis/grid-pro-tracking` alias 는 `vite.config.ts` L22 만 wiring** (tsconfig.app.json paths 누락) — D2 거부 사유 (1). 본 Goal 은 직접 import 회피 결정으로 이 누락 영향 받지 않음. | 신규 dep 추가 0건. C-22 peerDeps 영향 0. ADR-MOD-GRID-17-002 의무 (B-04 sub-rule) 충족 — admin 2 파일은 grid-core alias 완전 wiring 됨. payroll 3 파일은 trans-deps (shim → pro-tracking) 으로 alias 미직접 사용. | `bundleImpact.package = "tw-framework-front"` 일치. |
| **D7** | Section 2 의 `<Grid>` props interface 인용 = `grid-core/src/types.ts` `GridProps<TData>` (G-001~G-005 spec L2-3 동일). 본 Goal 의 admin 2 사용처는 `data` / `columns` / `enableExpanding` / `getSubRows` / `defaultExpanded` / `loading` / `onRowClick` 7개 props 부분집합 사용 (MOD-GRID-16 Pro `enableExpanding` 트리 모드). payroll 3 사용처는 `<ChangeTrackingGrid>` (shim) 의 OLD API — `initialData` / `columns` / `loading` / `onRowClick?` / `emptyText` / `ref` 사용. | C-1 Read-then-Write 준수 + spec authoritative. admin pages 는 G-005 G-004 cascading 와 다른 Pro 패키지 (`enableExpanding` — MOD-GRID-16/G-001) 의 사용 — 추가 advanced 기능 활용. | N/A |
| **D8** | 페이지별 verification 액션 = **read-only Grep + tsc 검증 (코드 변경 0)**. 페이지 단위 PR 분리 (AC-005 / D-02) — 단일 commit 으로 충분 또는 PR description 에 5 페이지 enumerate. Implementer Agent 의 `noOpImplementLoop` 명시 의무 (G-005 cascading). | 호환성 정책 D-02 (페이지 단위 PR). 본 Goal 은 변경 0이므로 "verification commit" 또는 "0-byte commit" 또는 "spec submit + score-only" 처리 가능. | N/A |
| **D9** | 워크트리 경계 우회 — Implementer Agent 는 본 Goal 에서 코드 변경 0이므로 **PowerShell-via-Bash 우회 의무 발동 없음**. C-34 + ADR-MOD-GRID-17-001 적용 대상 외. 단, `npx tsc --noEmit` 실행 + Grep 검증 등 read-only 명령은 정상 Bash 도구 사용. | 본 Goal 의 변경 0 결과 — boundary 차단 발동 없음. | N/A |
| D10 | 한국어 emptyText 매칭 — 본 Goal 에서 변환 작업 0이므로 `.ps1` 스크립트 BOM 의무 (C-35 + ADR-MOD-GRID-17-004) 발동 없음. 단 payroll 3 파일은 `emptyText="등록된 자료가 없습니다."` (PayMmcd02 L316, PayMmcd01 L511) 한국어 리터럴 보존 — git diff 0 라인 검증 의무 (변경 없음 확인). | 본 Goal 의 변경 0 결과 — `.ps1` 사용 없음. | N/A |
| **D11** | **★ Goal prompt 의 "EditableGrid → enableInlineEdit / enableChangeTracking" 클레임 명시 거부** (C-27 spec authority + spec vs prompt drift). disk 실측 결과:<br>• 5 페이지 모두 **EditableGrid import 0 hits** (Grep 결과).<br>• PayrollEditablePage 는 `ChangeTrackingGrid` (shim) 사용 — EditableGrid 아님.<br>• MenuManage/OrgMaster 는 `Grid` 직접 사용 — variant 사용 0.<br>• 따라서 "EditableGrid → enableInlineEdit/enableChangeTracking" 변환 path 적용 대상 0 페이지.<br>**Implementer prompt 작성 시 메인 세션은 D11 본문 인용 의무 (C-33)** — prompt 의 코드 블록 또는 변환 지시가 spec D11 결정과 충돌하면 spec 우선 (C-1 + C-27). | C-1 + C-27 + C-33 (spec authority over prompt code block + main prompt subordination). prompt 인용 의무 cascading — G-003 implement loop 1 사례 재발 차단. | N/A |
| **D12** | **★ 본 Goal 1.0 release closer 위치 명시** — MOD-GRID-17 의 6번째 (최종) Goal. G-001 5 + G-002 5 + G-003 5 + G-004 4 + G-005 1 (D1 reduction) + G-006 5 (verification only) = **누적 25 affected files MOD-GRID-17 처리** (+ 4 Pattern B deferred to G-005b/MOD-GRID-18 = 29 total). 본 Goal 완료 시 79/79 tw-grid 모듈 Goal 도달 (78/79 → 79/79). | discover 자동화 한계 — discover 단계 affected_files 분류가 이미-변환 페이지를 reduction 후보로 식별하지 못함. 본 spec 의 reality-check 가 G-005 (Pattern B 분류) + G-006 (already-in-target 분류) 두 번 동일 한계 노출. cascading 후속 Goal (MOD-GRID-18+) 도 동일 reality-check 의무. | overallStatus = "completed" 도달 가능 — verification-only Goal 의 implement Stage 는 `noOpImplementLoop` 패턴 + verify Stage 는 Grep + tsc 검증. |

**Verifier 자가-검산 (G-01 + E-06 cross-check)**: 합계 12 D# 결정. NEW 0 + MODIFY 0 + VERIFY 5 = 5 파일. Section 7 표 5 행 + Section 11.1 표 5 행. breakdown(NEW 0 / MODIFY 0 / VERIFY 5 / 파일 이름 = MenuManage + OrgMaster + PayMmcd02 + PayMmcd01 + PayrollEditable) 본문/AC/Section 7 모두 1:1 매칭. JSX 호출 사이트 합계: admin α 2 (L157/L298) + payroll β 3 (L310/L505/L199) = 5 사이트. **D1 (5 already in target end-state)** spec 본문 모든 섹션에 1:1 반영 — Section 1 L0-1~L0-5 5 파일 발췌 (α 2 / β 3), Section 3 표 5 행, Section 7 표 5 행, Section 11 5 파일 verification. D11 (EditableGrid 거부) prompt drift 명시.

---

## Section 1. 참조 추적 (Reference Tracking)

### L0 — tw-framework-front 현 구현 (실측 Read + Grep 결과)

영향 사용처 5개 페이지의 grid 사용 패턴 (모두 실측 Read + Grep 완료 — A-04 v1.0.9 reality-check 의무).

**L0-1 (Pattern α — admin/Grid direct): `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/admin/MenuManagePage.tsx`** (209 줄)
- L1: `import { useState, useCallback, useRef, useMemo } from 'react';`
- L7: `import { Grid } from '@tomis/grid-core';` — **직접 import (Pattern α — Already-Direct, 종착점)**
- L8: `import { type ColumnDef } from '@tanstack/react-table';`
- L157 (트리메뉴 그리드 — 1 사이트):
  ```tsx
  <Grid<MenuNode>
    data={menuTree}
    columns={columns}
    enableExpanding
    getSubRows={(row) => row.children}
    defaultExpanded={true}
    loading={loading}
    onRowClick={(row) => setSelected(row)}
  />
  ```
- props 사용 (7 종): `data`, `columns`, `enableExpanding`, `getSubRows`, `defaultExpanded`, `loading`, `onRowClick`
- **Grep `<BaseGrid` / `<EditableGrid` / `<ChangeTrackingGrid` / `<RangeSelectGrid` / `<TreeGrid` / `<GroupedHeaderGrid` / `<VirtualGrid` / `<ColumnPinGrid` 결과**: **0 hits**
- **Grep `<Grid` 결과**: 1 hit (L157)
- ★ 본 페이지 1 사이트 — **이미 spec end-state 도달**. enableExpanding (MOD-GRID-16/G-001 Pro 트리 모드 — `@tomis/grid-pro-master` 트랜지티브 또는 grid-core 통합 변환).

**L0-2 (Pattern α — admin/Grid direct): `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/admin/OrgMasterPage.tsx`** (492 줄)
- L1: `import { useState, useCallback, useRef, useMemo } from 'react';`
- L7: `import { Grid } from '@tomis/grid-core';` — **직접 import (Pattern α)**
- L8: `import { type ColumnDef } from '@tanstack/react-table';`
- L298 (조직도 트리 그리드 — 1 사이트):
  ```tsx
  <Grid<DeptNode>
    data={deptTree}
    columns={deptColumns}
    enableExpanding
    getSubRows={(row) => row.children}
    defaultExpanded={true}
    loading={deptLoading}
    onRowClick={(row) => setSelectedDept(row)}
  />
  ```
- props 사용 (7 종): MenuManage 와 동일 매트릭스
- **Grep variant import 결과**: **0 hits**
- **Grep `<Grid` 결과**: 1 hit (L298)
- ★ 본 페이지 1 사이트 — **이미 spec end-state 도달**. (Grade/Position 탭은 `<SimpleTable>` 컴포넌트 사용 — variant import 미해당)

**L0-3 (Pattern β — payroll/Compat-Shim): `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/payroll/PayMmcd02Page.tsx`** (477 줄)
- L1: `import React, { useState, useCallback, useRef, useMemo } from 'react';`
- L5: `import ChangeTrackingGrid, { type ChangeTrackingHandle } from '../../../components/tomis/Grid/ChangeTrackingGrid';` — **local default import (Pattern β — Compat-Shim, 종착점)**
- L7: `import type { ColumnDef } from '@tanstack/react-table';`
- L310 (급여항목 그리드 — 1 사이트):
  ```tsx
  <ChangeTrackingGrid
    ref={gridRef}
    initialData={rows}
    columns={columns}
    loading={loading}
    onRowClick={handleRowClick}
    emptyText="등록된 자료가 없습니다."
  />
  ```
- props 사용 (6 종 OLD shim API): `ref`, `initialData`, `columns`, `loading`, `onRowClick`, `emptyText`
- **Grep `<BaseGrid` / `<Grid` 결과**: **0 hits** (직접 사용 0)
- **Grep `<ChangeTrackingGrid` 결과**: 1 hit (L310)
- **Grep `useReactTable` 결과**: 0 hits (직접 사용 0 — shim 내부에서 사용)
- ★ 본 페이지 1 사이트 — **이미 spec end-state 도달**. 로컬 compat shim 이 종착점 (MOD-GRID-10/G-005 ADR 결과 — shim 파일 L7-21 design comment 인용).

**L0-4 (Pattern β — payroll/Compat-Shim): `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/payroll/PayMmcd01Page.tsx`** (686 줄)
- L1: `import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';`
- L5: `import ChangeTrackingGrid, { type ChangeTrackingHandle } from '../../../components/tomis/Grid/ChangeTrackingGrid';` — **Pattern β**
- L8: `import type { ColumnDef } from '@tanstack/react-table';`
- L505 (급여기준 그리드 — 1 사이트):
  ```tsx
  <ChangeTrackingGrid
    ref={gridRef}
    initialData={rows}
    columns={columns}
    loading={loading}
    onRowClick={handleRowClick}
    emptyText="등록된 자료가 없습니다."
  />
  ```
- props 사용 (6 종): PayMmcd02 와 동일
- **Grep `<BaseGrid` / `<Grid` 결과**: **0 hits**
- **Grep `<ChangeTrackingGrid` 결과**: 1 hit (L505)
- **Grep `useReactTable` 결과**: 0 hits
- ★ 본 페이지 1 사이트 — **이미 spec end-state 도달** (Pattern β).

**L0-5 (Pattern β — payroll/Compat-Shim + commitChanges advanced): `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/payroll/PayrollEditablePage.tsx`** (210 줄)
- L1: `import { useState, useCallback, useRef, useMemo } from 'react';`
- L5: `import ChangeTrackingGrid, { type ChangeTrackingHandle } from '../../../components/tomis/Grid/ChangeTrackingGrid';` — **Pattern β**
- L7: `import type { ColumnDef } from '@tanstack/react-table';`
- L8: `import type { EditableColumnMeta } from '../../../types/tomis/grid';`
- L86-130: `handleSave` 함수 — MOD-GRID-10/G-005 추가 `commitChanges` API 사용 (L99 `const commit = gridRef.current?.commitChanges;` + L106 `await commit('/api/payroll/changes', {...})`). typeof check + legacy fallback (L116-122). **★ 이미 G-005 `commitChanges` 패턴 적용 완료** — G-005 implement loop 산출물.
- L199 (편집 가능 그리드 — 1 사이트):
  ```tsx
  <ChangeTrackingGrid
    ref={gridRef}
    initialData={dataList}
    columns={columns}
    loading={loading}
  />
  ```
- props 사용 (4 종): `ref`, `initialData`, `columns`, `loading`
- **Grep `<EditableGrid` 결과**: **0 hits** (Goal prompt 클레임 disk 와 모순 — D11)
- **Grep `<ChangeTrackingGrid` 결과**: 1 hit (L199)
- **Grep `<BaseGrid` / `<Grid` 결과**: 0 hits
- **Grep `useChangeTracking` 결과**: 0 hits (Goal prompt 의 "useChangeTracking() 직접 사용" 클레임 disk 와 모순 — shim 내부에서 사용)
- ★ 본 페이지 1 사이트 — **이미 spec end-state 도달** + G-005 `commitChanges` 추가 적용 완료 (cascading marker).

**호출 사이트 합계**: admin α 2 (L157/L298) + payroll β 3 (L310/L505/L199) = **5 사이트**.
**Already-in-target 합계**: 5/5 페이지 (D1).
**Deferred 합계**: 0 페이지 (G-005 D11 deferred Pattern B 4 페이지는 별도 후속 Goal/모듈 책임 — 본 Goal scope 외).

### L1 — TanStack v8 API
- **N/A** (본 Goal 은 TanStack API 변경 없음 — verification only). admin pages 는 `import { type ColumnDef } from '@tanstack/react-table'` 직접 사용 (이미 wiring). payroll pages 는 `import type { ColumnDef } from '@tanstack/react-table'` 직접 사용.

### L2 — 공통 컴포넌트 (`@tomis/grid-core` + `@tomis/grid-pro-tracking`)

L2-1: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` L2 export:
```ts
export { Grid } from './Grid';
```
+ legacy alias 5종 export 확인 (G-001~G-005 L2-1 동일). admin pages 가 이 `Grid` named export 사용 — 종착점.

L2-2: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/Grid.tsx` (G-001~G-005 spec L2-2 동일):
```tsx
export const Grid = forwardRef(GridInner) as <TData>(
  props: GridProps<TData> & { ref?: Ref<GridHandle<TData>> },
) => ReactElement;
```
admin 2 페이지의 `<Grid<MenuNode>` + `<Grid<DeptNode>` 가 본 export 직접 호출. `enableExpanding` + `getSubRows` 트리 모드 props 사용 (MOD-GRID-16/G-001 Pro 통합 흡수 결과).

L2-3: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/index.ts` L11 export (실측 Read 결과):
```ts
export { default as ChangeTrackingGrid } from './legacy/ChangeTrackingGrid';
export type { ChangeTrackingGridProps } from './legacy/ChangeTrackingGrid';
```
**중요한 차별점**: `@tomis/grid-pro-tracking` 의 `ChangeTrackingGrid` 는 monorepo legacy alias — `data` (initialData 아님) + 필수 `rowKey` prop + `Omit<GridProps<TData>, 'data'>` 베이스. 로컬 compat shim 과는 다른 API.

L2-4: 로컬 compat shim: `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx` (250+ 줄, 실측 Read 결과 L1-80):
- L23-31: `import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, type ColumnDef, type SortingState } from '@tanstack/react-table';`
- L32-35: `import { useChangeTracking, type CommitOptions } from '@tomis/grid-pro-tracking';` — **트랜지티브 사용**
- L37-46: design comment — "compat shim — preserve the OLD ROW_STATUS_COLORS class strings byte-for-byte for visual regression preservation (C-02)". G-004 monorepo default `defaultRowStatusClassNames` (all-sides border) vs OLD `border-l-2 border-l-color` 차이 — **외관 보존 의도된 design**.
- L43-47: `COMPAT_ROW_STATUS_COLORS` — `border-l-2` left-side border 보존.
- L49-57: `ChangeTrackingHandle<TData>` — OLD API 시그니처 (`getChanges` / `resetChanges` / `addRow` / `deleteRow(rowIndex: number)` + G-005 추가 `commitChanges?(endpoint, options): Promise<unknown>`).
- L59-66: `ChangeTrackingGridProps<TData>` — OLD prop 시그니처 (`initialData` / `columns` / `onRowClick?` / `loading?` / `emptyText?` / `className?`).
- L67-179: 본문 — synthetic rowKey WeakMap 전략 (`KEY_FIELD = '__changeTrackingKey'`) + useChangeTracking wrap + useReactTable + flexRender. shim 이 종착점인 이유 = TOMIS 소비자에게 OLD API + 외관 호환 보존 (MOD-GRID-10/G-005 D3 + advisor option (a)).

L2-5: tw-framework-front `vite.config.ts` L18-31 alias 매핑 (Read 결과):
```ts
'@tomis/grid-core': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-core/src'),
'@tomis/grid-pro-tracking': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-pro-tracking/src'),
// ... 8개 추가 alias
```
`@tomis/grid-core` + `@tomis/grid-pro-tracking` 둘 다 vite alias wiring 됨. **그러나 `tsconfig.app.json` L21-25 paths**:
```json
"@tomis/grid-core": ["../../topvel-grid-monorepo/packages/grid-core/src"],
"@tomis/grid-core/legacy": ["../../topvel-grid-monorepo/packages/grid-core/src/legacy"],
"@tomis/grid-renderers": ["../../topvel-grid-monorepo/packages/grid-renderers/src"],
"@tomis/grid-pro-range": ["../../topvel-grid-monorepo/packages/grid-pro-range/src"]
```
**`@tomis/grid-pro-tracking` 누락** — tsc 측면 paths 미해결. payroll 3 페이지가 직접 import 시도 시 TS2307 fail — D2 거부 사유 (1). admin 2 페이지는 `@tomis/grid-core` paths 보유 — 정상 wiring.

### L3 — 영향 사용처 카운트 = **5 파일 (전수 already-in-target)**

`canonical-modules.json` MOD-GRID-17 affectedUsageFiles 중 payroll/PayMmcd02 + PayMmcd01 + PayrollEditable + admin/MenuManage + OrgMaster 5건 — 모두 본 Goal 의 `affectedUsageFiles` 와 1:1 매칭. 정확한 경로 5개 (Section 8.1 동일).

### R-A / R-W — N/A
- 본 Goal 은 신규 API 설계가 아닌 **사용처 verification** — AG Grid / Wijmo 동등 기능 참조 불필요.

---

## Section 2. API 계약 (TypeScript Interface)

본 Goal 은 신규 API 정의가 없음 — `@tomis/grid-core` 의 `<Grid>` (admin 2 페이지) 및 로컬 compat shim `<ChangeTrackingGrid>` (payroll 3 페이지) 의 기존 API 를 verification only.

### 2.1 호출할 인터페이스 (`grid-core/src/types.ts` + 로컬 shim — 실측 인용)

**admin 2 페이지가 사용하는 `GridProps<TData>` 부분집합 (7 종 props — D7)**:
```ts
// from `@tomis/grid-core` (G-001~G-005 spec L2-3 동일)
export interface GridProps<TData> {
  data: TData[];                                        // required
  columns: ColumnDef<TData, unknown>[];                 // required
  enableExpanding?: boolean;                            // MOD-GRID-16/G-001 트리 모드 활성
  getSubRows?: (row: TData) => TData[] | undefined;     // 트리 자식 추출
  defaultExpanded?: boolean | Record<string, boolean>;  // 기본 펼침 상태
  loading?: boolean;
  onRowClick?: (row: TData, event: MouseEvent<HTMLTableRowElement>) => void;
  // (이하 30+ optional props default 유지)
}
```

**payroll 3 페이지가 사용하는 `ChangeTrackingGridProps<TData>` (로컬 shim — L59-66)**:
```ts
// from `../../../components/tomis/Grid/ChangeTrackingGrid' (로컬 compat shim)
interface ChangeTrackingGridProps<TData> {
  initialData: TData[];                                 // required (OLD API — `data` 아님)
  columns: ColumnDef<TData, unknown>[];                 // required
  onRowClick?: (row: TData) => void;                    // OLD 시그니처 (event 인자 없음)
  loading?: boolean;
  emptyText?: string;
  className?: string;
}
```

**payroll 3 페이지가 사용하는 `ChangeTrackingHandle<TData>` (로컬 shim — L49-57)**:
```ts
export interface ChangeTrackingHandle<TData> {
  getChanges: () => { added: TData[]; edited: TData[]; deleted: TData[] };
  resetChanges: () => void;
  addRow: (row: TData) => void;
  deleteRow: (rowIndex: number) => void;
  commitChanges?: (endpoint: string, options?: CommitOptions) => Promise<unknown>;  // G-005 추가
}
```

**사이트별 props 사용 매트릭스 (5 사이트 × props)**:

| 사이트 | data/initialData | columns | enableExpanding | getSubRows | defaultExpanded | loading | onRowClick | emptyText | ref |
|--------|------------------|---------|----------------|------------|-----------------|---------|------------|-----------|-----|
| MenuManage L157 | ✅ data | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| OrgMaster L298 | ✅ data | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| PayMmcd02 L310 | ✅ initialData | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| PayMmcd01 L505 | ✅ initialData | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| PayrollEditable L199 | ✅ initialData | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |

### 2.2 export 경로 (D7 + L2-1 + L2-3 + L2-4)

```ts
// admin 2 페이지 (Pattern α — Already-Direct):
import { Grid } from '@tomis/grid-core';
import { type ColumnDef } from '@tanstack/react-table';

// payroll 3 페이지 (Pattern β — Compat-Shim):
import ChangeTrackingGrid, { type ChangeTrackingHandle } from '../../../components/tomis/Grid/ChangeTrackingGrid';
import type { ColumnDef } from '@tanstack/react-table';
```

본 Goal verification only — **import 경로 변경 0** (5/5 페이지 모두 이미 종착점).

### 2.3 사용 예시 코드 (최소 2개 — 실측 시나리오 두 패턴)

**예시 1 (Pattern α — admin/MenuManage L157 실측 코드 그대로):**
```tsx
import { Grid } from '@tomis/grid-core';
import { type ColumnDef } from '@tanstack/react-table';

<Grid<MenuNode>
  data={menuTree}
  columns={columns}
  enableExpanding
  getSubRows={(row) => row.children}
  defaultExpanded={true}
  loading={loading}
  onRowClick={(row) => setSelected(row)}
/>
```

**예시 2 (Pattern β — payroll/PayMmcd02 L310 실측 코드 그대로):**
```tsx
import ChangeTrackingGrid, { type ChangeTrackingHandle } from '../../../components/tomis/Grid/ChangeTrackingGrid';
import type { ColumnDef } from '@tanstack/react-table';

const gridRef = useRef<ChangeTrackingHandle<PayMmcd02ListRow>>(null);

<ChangeTrackingGrid
  ref={gridRef}
  initialData={rows}
  columns={columns}
  loading={loading}
  onRowClick={handleRowClick}
  emptyText="등록된 자료가 없습니다."
/>
```

### 2.4 기본값 / optional 명시
- admin 2 페이지: `data`, `columns` = **required** + 5 종 optional 명시됨
- payroll 3 페이지: `initialData`, `columns` = **required** + OLD API optional 명시됨
- `emptyText` default `'데이터가 없습니다.'` (shim L78) — payroll 3 페이지 중 PayMmcd02 + PayMmcd01 명시적 override (`"등록된 자료가 없습니다."`), PayrollEditable default 유지

### 2.5 ref API — Pattern β 만 사용 (B-05)
- admin 2 페이지: `useRef<GridHandle<T>>` 사용 0 (Read 결과 confirmed). B-05 N/A.
- payroll 3 페이지: `useRef<ChangeTrackingHandle<TData>>` 사용 3개 (PayMmcd02 L37 + PayMmcd01 L? + PayrollEditable L?). shim 의 OLD imperative API (`getChanges` / `addRow` / `deleteRow` / `commitChanges`) 호출.

---

## Section 3. 기존 사용처 대응표 ⭐ (tw-grid 특화)

| 페이지 | 기존 import / 사용 패턴 (라인) | 신규 API 대응 | 마이그레이션 액션 | 패턴 |
|--------|------------------------------|-------------|------------------|------|
| **MenuManagePage.tsx** | L7 `import { Grid } from '@tomis/grid-core';`<br>L157 `<Grid<MenuNode> data columns enableExpanding getSubRows defaultExpanded loading onRowClick />` | (동일 — 종착점) | **VERIFY only** (0 변경) | α |
| **OrgMasterPage.tsx** | L7 `import { Grid } from '@tomis/grid-core';`<br>L298 `<Grid<DeptNode> data columns enableExpanding getSubRows defaultExpanded loading onRowClick />` | (동일 — 종착점) | **VERIFY only** (0 변경) | α |
| **PayMmcd02Page.tsx** | L5 `import ChangeTrackingGrid, { type ChangeTrackingHandle } from '../../../components/tomis/Grid/ChangeTrackingGrid';`<br>L310 `<ChangeTrackingGrid ref initialData columns loading onRowClick emptyText />` | (동일 — 로컬 shim 이 종착점, shim 내부 `@tomis/grid-pro-tracking` 트랜지티브 사용) | **VERIFY only** (0 변경) | β |
| **PayMmcd01Page.tsx** | L5 동일 import<br>L505 `<ChangeTrackingGrid ref initialData columns loading onRowClick emptyText />` | (동일 — 종착점) | **VERIFY only** (0 변경) | β |
| **PayrollEditablePage.tsx** | L5 동일 import + L86-130 `commitChanges` 사용 (G-005 cascading)<br>L199 `<ChangeTrackingGrid ref initialData columns loading />` | (동일 — 종착점) | **VERIFY only** (0 변경) | β |

**5/5 행 작성. C-19 ≤5 준수**. 5 사이트 enumerate. **변경 0** — 5/5 페이지 모두 spec end-state 도달.

**★ Goal prompt 의 "EditableGrid → enableInlineEdit/enableChangeTracking" 클레임 행 미포함** (D11). Grep 실측 결과 5 페이지 모두 `<EditableGrid` 0 hits — prompt 클레임은 disk 와 모순. C-1 + C-27 spec authority 적용 — 거부 결정 D11 본문 명시.

---

## Section 4. 호환성 정책

### 4.1 Breaking change
- **`breaking: false`** (goals.json 동일 패턴 G-001/G-002/G-003/G-004/G-005 따름)
- 본 Goal 은 **0 substantive 변경** — breaking 정의상 적용 불가.
- `@tomis/grid-core` 의 `Grid` export 는 안정 (MOD-GRID-01 G-001~G-005 완료).
- 로컬 compat shim `ChangeTrackingGrid` 은 **본 Goal 에서 제거하지 않음** — MOD-GRID-10/G-005 ADR 의 종착점 역할 유지.

### 4.2 Deprecation 전략 (C-6 + C-23)
- 로컬 compat shim 은 **무제한 유지** (MOD-GRID-10/G-005 design — OLD API + 외관 호환 보존). 직접 `@tomis/grid-pro-tracking` import 으로 마이그레이션은 별도 후속 Goal 책임 (MOD-GRID-18 또는 G-006b — shim 제거 시점 결정).
- 본 Goal 후속 효과: 누적 마이그레이션 완료 페이지 = G-001 5 + G-002 5 + G-003 5 + G-004 4 + G-005 1 + G-006 5 (verification) = **25 페이지** (Pattern α/β 모두 종착점 도달).

### 4.3 영향 사용처 마이그레이션 경로 (2 단계 — Section 11.3 와 동기)
1. **단계 1**: Grep 검증 — 5 페이지 모두 spec end-state 도달 확인 (variant import 0 hits / `<Grid>` 1 hit (admin) / `<ChangeTrackingGrid>` 1 hit (payroll)).
2. **단계 2**: `npx tsc --noEmit` 0 errors 확인 → 외관 회귀 검증 (C-17).

### 4.4 console warning 정책 (AC-003 + C-23)
- `@tomis/grid-core` `Grid` 는 deprecation warning 미발생 (admin 2 페이지).
- 로컬 compat shim `ChangeTrackingGrid` 는 deprecation warning 미발생 (Read 결과 confirmed — `useDeprecationWarn` 호출 없음, L1-180 검토).
- 본 Goal 완료 후에도 console warning 영향 0.

### 4.5 peerDependencies 정책 (C-22)
- `@tomis/grid-core` 가 `react`, `react-dom`, `@tanstack/react-table` 을 peer 로 선언 — 사용처 `tw-framework-front` 는 이미 이 셋을 deps 로 보유 (G-001~G-005 검증).
- `@tomis/grid-pro-tracking` 동일 peer 정책 — payroll 3 페이지 트랜지티브 dep 으로 peer 충족 (shim 통해).
- 본 Goal 추가 작업 없음.

---

## Section 5. 인수 기준 (Acceptance Criteria with Source Tags)

5개 AC 모두 출처 태그 + binary 검증 가능. migrationImpact: **high** 표시.

| AC ID | 기준 | 출처 | binary 검증 방법 | migrationImpact |
|-------|------|------|------------------|-----------------|
| AC-001 | 5 페이지 tsc 0 errors | **L0 + C-12** | `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx tsc --noEmit` 명령 실행 → exit 0 + stderr 빈 결과. 5/5 페이지 변경 0이므로 tsc 결과는 spec 시점 baseline 그대로. | high |
| AC-002 | 외관 보존 — 변경 0이므로 모든 페이지 외관 100% 보존 (zero-delta) | **L0 + L2 + C-17** | (a) 본 Goal 의 git diff = 0 라인 (5 파일 모두) → 외관 변동 불가 / (b) 추가 보강 — admin 2 페이지 + payroll 3 페이지 dev server 렌더 후 G-001~G-005 검증 시점 baseline 과 외관 동일 확인 (Pattern α 는 `<Grid>` 직접 = G-001~G-005 종착점 동일, Pattern β shim 의 `COMPAT_ROW_STATUS_COLORS` border-l-2 보존 — shim 파일 L43-47 의도된 외관 호환) | high |
| AC-003 | console warning 0 건 | **C-23** | 5 페이지 dev mode 렌더 → `console.warn` 인터셉트 시 deprecated 경고 0건. shim 의 `useDeprecationWarn` 호출 없음 (L1-180 검토) — 본 Goal 변경 0이므로 spec 시점 baseline 그대로. | high |
| AC-004 | variant direct import 0 건 (Pattern α + β 모두 종착점 검증) | **L0 + L2 + C-6** | 5 페이지 각각 다음 Grep:<br>(α admin 2) `grep -nE "<BaseGrid\|<EditableGrid\|<ChangeTrackingGrid\|<RangeSelectGrid\|<TreeGrid\|<GroupedHeaderGrid\|<VirtualGrid\|<ColumnPinGrid"` → **0 hits** (admin 2 페이지)<br>(α admin 2) `grep -n "<Grid<"` → **1 hit/페이지** (L157 + L298)<br>(β payroll 3) `grep -nE "<BaseGrid\|<Grid<\|<EditableGrid"` → **0 hits**<br>(β payroll 3) `grep -n "<ChangeTrackingGrid"` → **1 hit/페이지** (L310 + L505 + L199) | high |
| AC-005 | 페이지 단위 PR 분리 (D-02) — 5 페이지 0 commit 또는 단일 verification commit | **C-19** | 본 Goal 변경 0 결과 → (a) verification commit 1개 (코드 변경 없는 score 파일만 갱신) 또는 (b) git log 에 G-006 entry 0 (verification-only). PR description 에 5 페이지 enumerate + "already in target state" 명시. | high |

**AC source 태그 검증 (H-03 만족)**:
- L0 → Section 1 L0-1~L0-5 에서 실제 인용됨 (5 페이지 라인 인용 + Grep 결과)
- L2 → Section 1 L2-1~L2-5 에서 실제 인용됨 (Grid.tsx + shim 코드 실측 인용)
- C-12 → constraints.md C-12 (`npx tsc --noEmit` 0 errors 의무)
- C-17 → constraints.md C-17 (시각 회귀 검증 의무 — high impact)
- C-23 → constraints.md C-23 (semver — deprecated API 1 minor 유지)
- C-6 → constraints.md C-6 (호환성 절대)
- C-19 → constraints.md C-19 (점진 ≤5/Goal)

---

## Section 6. 엣지 케이스 (3개 이상)

본 Goal 의 실측 페이지 분석 기반 엣지 케이스 (추측 금지 — 실제 Read 결과로 식별):

**EC-01: 5/5 페이지 already-in-target-state — 변경 0 의 검증 보장**
- 출처: L0-1~L0-5 (5 페이지 모두 spec end-state 도달).
- 위험: implementer 가 "5 파일이라 변환 작업 필요" 가정 → 불필요한 import 변경 / `<Grid>` → 다른 형태 시도 → 외관 회귀 + tsc fail.
- 처리: D1 + D5 결정 + Section 7 표 5 행 모두 VERIFY action. Implementer prompt 에 "5/5 already in target state — 0 substantive changes" + G-005 `noOpImplementLoop` 패턴 명시 의무 (C-33). 검증 방법 = Grep + tsc only.

**EC-02: ★ Goal prompt 의 "EditableGrid → enableInlineEdit/enableChangeTracking" 클레임 거부 (D11 cascade)**
- 출처: Grep 실측 결과 5 페이지 모두 `<EditableGrid` 0 hits. PayrollEditablePage 는 `ChangeTrackingGrid` 사용 (EditableGrid 아님).
- 위험: implementer 가 prompt 코드 블록 그대로 신뢰 (C-33 위반) → `<EditableGrid>` 또는 `enableInlineEdit` 변환 시도 → disk 패턴과 모순 → tsc fail 또는 외관 회귀.
- 처리: D11 결정 + Section 1 L0-5 PayrollEditable 명시 — `<ChangeTrackingGrid>` 사용 확인 (EditableGrid 아님). Implementer prompt 에 D11 본문 인용 의무 (C-27 + C-33). spec 본문이 prompt 코드 블록 우선 (spec authority).

**EC-03: Pattern β shim 의 의도된 외관 차이 — `border-l-2` vs `defaultRowStatusClassNames` (D2 거부 사유 (2))**
- 출처: 로컬 shim 파일 L37-47 design comment + L43-47 `COMPAT_ROW_STATUS_COLORS` 정의.
- 위험: 향후 implementer 가 "직접 `@tomis/grid-pro-tracking` import 으로 변환하면 더 깔끔" 권장 시도 → shim 의 `border-l-2` 가 monorepo `defaultRowStatusClassNames` 의 all-sides border 로 자동 변경 → AC-002 외관 회귀 (high impact).
- 처리: D2 거부 사유 (2) + EC-03 명시. shim 의 디자인 의도 = 의식적 외관 호환 보존 (MOD-GRID-10/G-005 design comment 인용). 직접 import 변환은 본 Goal scope 외.

**EC-04: tsconfig.app.json paths 의 `@tomis/grid-pro-tracking` 누락 (D2 거부 사유 (1))**
- 출처: tsconfig.app.json L21-25 paths 4 entries (`grid-core`, `grid-core/legacy`, `grid-renderers`, `grid-pro-range`) — `grid-pro-tracking` 누락 확인.
- 위험: 향후 implementer 가 직접 import 변환 시도 → tsc TS2307 fail (`Cannot find module '@tomis/grid-pro-tracking'`). 추가 ADR + tsconfig.app.json paths 추가 결정 필요.
- 처리: D2 거부 사유 (1) + D6 확인. tsconfig.app.json paths 변경은 본 Goal scope 외 — payroll 3 페이지가 로컬 shim 만 사용하므로 paths 미해결 영향 없음. shim 자체는 monorepo 의 `useChangeTracking` (named export) 만 import — `@tomis/grid-pro-tracking` paths 가 vite alias 만 있어도 dev mode 동작 + tsc 는 shim 파일 위치 (`tw-framework-front/src/components/.../`) 가 tsconfig.app.json `include: ["src"]` 범위 → shim 내부 import 도 tsc 통과 필요 — 단 paths 미해결로 fail 가능성 점검 필요.

추가 검증 의무 (Implementer 단계): `npx tsc --noEmit` 통과 확인 시 shim 파일 자체의 `import { useChangeTracking, type CommitOptions } from '@tomis/grid-pro-tracking';` 라인이 tsc resolve 되는지 확인. fail 시 D2 거부 사유 (1) 가 spec 시점 baseline 에도 문제 있음 — 본 Goal verification 시 발견 후 별도 후속 Goal 책임.

**EC-05: 워크트리 경계 우회 미발동 (D9 — 변경 0 결과)**
- 출처: 5 파일 모두 base repo (`tw-framework-front/`) 위치 — 워크트리 외부.
- 위험: 본 Goal 변경 0이므로 워크트리 Edit/Write 도구 boundary 차단 발동 자체가 없음. 단 implementer 가 잘못 변경 시도 시 boundary 차단 발생 → C-34 우회 후 잘못된 변경 적용 위험.
- 처리: D9 결정 + EC-05 명시. Implementer prompt 에 "0 substantive changes — boundary bypass not needed" 명시 의무. PowerShell-via-Bash 우회는 본 Goal 에 발동 안 함.

**EC-06: 빈 데이터 / 로딩 상태 — Pattern α + Pattern β 모두 검증**
- 출처: admin 2 + payroll 3 페이지 모두 `loading={loading}` prop 사용. payroll 2 페이지 (PayMmcd02 L316 + PayMmcd01 L511) `emptyText="등록된 자료가 없습니다."` 한국어 리터럴 보존.
- 위험: 본 Goal 변경 0이므로 외관 동일 보장 — 단 향후 admin 2 페이지의 `<Grid>` SkeletonRows (Grid.tsx L354) 와 payroll shim 의 loading 표시 차이 가능 (Pattern α vs β 외관 차이).
- 처리: AC-002 시각 회귀 검증 — admin/payroll 페이지 dev server 에서 빈 데이터 상태 (`loading=true` + `data=[]`) 외관 확인. G-001~G-005 검증 시점 baseline 그대로.

**EC-07: payroll 3 페이지의 한국어 emptyText — git diff 0 검증 (D10)**
- 출처: PayMmcd02 L316 `"등록된 자료가 없습니다."` + PayMmcd01 L511 동일 + PayrollEditable shim default `'데이터가 없습니다.'` (override 없음 — L199).
- 위험: 본 Goal 변경 0 보장 → 한국어 리터럴 깨짐 0. 단 implementer 가 잘못 변경 시 PowerShell-via-Bash 우회 시 BOM 미준수 → 한글 깨짐.
- 처리: D10 + EC-07 — 본 Goal 변경 0이므로 한국어 리터럴 보존 보장. git diff 검증 의무 (`git diff tw-framework-front/src/pages/tomis/payroll/*.tsx` → 0 lines). 변환 시도 발생 시 즉시 중단 + 사용자 결정.

**EC-08: ★ admin 2 페이지의 `enableExpanding` 트리 모드 — MOD-GRID-16/G-001 Pro 통합 흡수 확인**
- 출처: MenuManage L161 + OrgMaster L302 `enableExpanding` + `getSubRows` + `defaultExpanded` 트리 props.
- 위험: `enableExpanding` 이 `@tomis/grid-core` Grid 의 native prop 인지 또는 grid-pro-master 의존인지 — admin 2 페이지가 `@tomis/grid-core` 직접 import 만 사용 (Pro 패키지 import 0) → grid-core 통합 흡수 결과 (G-001 master Grid + MOD-GRID-16 G-001 Pro 트리 모드 흡수 ADR cross-reference).
- 처리: 본 Goal 변경 0이므로 grid-core 의 enableExpanding 통합 흡수가 이미 동작 — admin 2 페이지가 dev server 에서 정상 트리 표시 확인 가능 (G-001~G-005 baseline). 추가 검증 의무 = MOD-GRID-16 G-001 verify-score 통과 cross-reference (이미 통과됨, goals.json G-001 verify status="done").

---

## Section 7. 구현 대상 파일 (NEW / MODIFY / VERIFY) — 최종 implementFiles 표

**NEW: 없음.**
**MODIFY: 없음.**
**VERIFY: 5 파일 (사용처 페이지 — base repo, 5/5 already-in-target-state).**

| # | 파일 (절대 경로) | 액션 | 검증 사이트 (실측 기반) | 검증 내용 | 그룹 |
|---|-----------------|------|------------------------|-----------|------|
| 1 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/admin/MenuManagePage.tsx` | **VERIFY** | L7 (import) + L157 (JSX 1 사이트) | (a) Grep `from '@tomis/grid-core'` 1 hit (L7); (b) Grep `<Grid<` 1 hit (L157); (c) Grep `<BaseGrid\|<EditableGrid\|<ChangeTrackingGrid` 0 hits; (d) git diff 0 라인 (변경 없음 확인). | α |
| 2 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/admin/OrgMasterPage.tsx` | **VERIFY** | L7 (import) + L298 (JSX 1 사이트) | MenuManage 와 동일 검증 매트릭스 (L7 import + L298 JSX). | α |
| 3 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/payroll/PayMmcd02Page.tsx` | **VERIFY** | L5 (import) + L310 (JSX 1 사이트) | (a) Grep `from '../../../components/tomis/Grid/ChangeTrackingGrid'` 1 hit (L5); (b) Grep `<ChangeTrackingGrid` 1 hit (L310); (c) Grep `<BaseGrid\|<Grid<\|<EditableGrid` 0 hits; (d) git diff 0 라인. | β |
| 4 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/payroll/PayMmcd01Page.tsx` | **VERIFY** | L5 (import) + L505 (JSX 1 사이트) | PayMmcd02 와 동일 검증 매트릭스. | β |
| 5 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/payroll/PayrollEditablePage.tsx` | **VERIFY** | L5 (import) + L199 (JSX 1 사이트) | (a) Grep `from '../../../components/tomis/Grid/ChangeTrackingGrid'` 1 hit (L5); (b) Grep `<ChangeTrackingGrid` 1 hit (L199); (c) Grep `<EditableGrid` 0 hits (D11 prompt drift 거부 검증); (d) git diff 0 라인. | β |

**★ EditableGrid 변환 행 미포함** (D11). prompt 가정 5 파일 → 실측 5 파일 모두 VERIFY (변환 없음). 추가 행 없음. Section 11.1 5 행과 1:1 일치.

**합계: NEW 0 + MODIFY 0 + VERIFY 5 = 5 파일** (D5 breakdown 일치).
**JSX 호출 사이트 합계: admin α 2 + payroll β 3 = 5 (G-001~G-005 cascading 패턴 + Pattern β 신규 분류).**
**변경 hunk 합계: 0 라인 (모든 파일 변경 없음).**

**H-02 경로 합리성 검증**: 5 파일 모두의 부모 디렉토리 (`.../tw-framework-front/src/pages/tomis/admin/` + `.../tw-framework-front/src/pages/tomis/payroll/`) 실재 — 실제 Read 도구로 5 파일 라인 카운트 + 발췌 성공함 (MenuManage 209줄 / OrgMaster 492줄 / PayMmcd02 477줄 / PayMmcd01 686줄 / PayrollEditable 210줄). 프로젝트 컨벤션(`tw-framework-front/src/pages/tomis/{도메인}/{모듈}Page.tsx`) 일치 (CLAUDE.md "프론트엔드 디렉토리 원칙").

---

## Section 8. 마이그레이션 영향도 Preflight ⭐

### 8.1 영향 사용처 카운트: **5/5** (in-scope, 1 Goal ≤ 5 — C-19 준수)

**In-scope 5 파일 전체 경로**:
1. `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/admin/MenuManagePage.tsx` (Pattern α — Already-Direct)
2. `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/admin/OrgMasterPage.tsx` (Pattern α)
3. `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/payroll/PayMmcd02Page.tsx` (Pattern β — Compat-Shim)
4. `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/payroll/PayMmcd01Page.tsx` (Pattern β)
5. `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/payroll/PayrollEditablePage.tsx` (Pattern β + G-005 commitChanges)

**Deferred: 0 파일** (본 Goal scope 외 deferred 없음 — Pattern B 4 페이지는 G-005 D11 결정으로 이미 G-005b/MOD-GRID-18 로 deferred됨, 본 Goal 영역 외).

Goal prompt 5 파일 가정 → 실측 5/5 already-in-target (Pattern α 2 + Pattern β 3). discover 단계 자동화 한계 — 이미 변환 완료 페이지를 BaseGrid wrapper Goal 에 포함시킨 케이스 (G-005 Pattern B 분류 패턴과 다른 의미적 카테고리).

### 8.2 무파괴 검증 방법

본 Goal 은 외부 저장소 변경 없음 — 5 파일 모두 TOMIS base repo (`tw-framework-front/`) 위치, 변경 0 라인.

- **Grep 검증 (자동)**: 5 페이지 각각 다음 패턴 grep:
  - α admin 2 페이지: `from '@tomis/grid-core'` 1 hit + `<Grid<` 1 hit + variant patterns 0 hits
  - β payroll 3 페이지: `from '../../../components/tomis/Grid/ChangeTrackingGrid'` 1 hit + `<ChangeTrackingGrid` 1 hit + variant patterns (BaseGrid/Grid/EditableGrid 등) 0 hits
- **빌드 검증 (자동)**: `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx tsc --noEmit` → exit 0
- **추가 검증 (자동)**: `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx vite build` → 빌드 성공
- **외관 보존 (수동 — Chromatic 미도입 환경)**: 5 페이지 dev server (`npm run dev`) 에서 G-001~G-005 검증 시점 baseline 과 외관 동일 확인. 본 Goal 변경 0이므로 zero-delta 보장.
- **git diff 검증 (자동)**: `git diff tw-framework-front/src/pages/tomis/admin/MenuManagePage.tsx tw-framework-front/src/pages/tomis/admin/OrgMasterPage.tsx tw-framework-front/src/pages/tomis/payroll/PayMmcd02Page.tsx tw-framework-front/src/pages/tomis/payroll/PayMmcd01Page.tsx tw-framework-front/src/pages/tomis/payroll/PayrollEditablePage.tsx` → 0 라인 (5 파일 모두 변경 없음).

**외관 동등성 근거**: 본 Goal 변경 0이므로 시각 회귀 영향 0 (zero-delta 수학적 보장).

### 8.3 점진 마이그레이션 vs 일괄 전환
- 본 Goal = **0 변환 + 5 verification** (C-19 ≤5 충족, verification-only Goal — G-005 `noOpImplementLoop` 패턴 cascading).
- Pattern B 4 페이지 (hr/Ins\*) 는 G-005 D1 에서 G-005b/MOD-GRID-18 로 deferred — 본 Goal 영역 외.
- 향후 직접 `@tomis/grid-pro-tracking` import 변환 (payroll shim 제거) 은 별도 후속 Goal 책임 (MOD-GRID-18 또는 G-006b — D2 거부 결정 cross-reference).

### 8.4 롤백 전략
- 본 Goal 변경 0이므로 롤백 자체 불필요 (rollback target = no-op).
- 단 implementer 가 잘못 변경 시도 시 → `git restore tw-framework-front/src/pages/tomis/admin/*.tsx tw-framework-front/src/pages/tomis/payroll/*.tsx` 로 즉시 원복 가능 (단일 commit 변경 시 `git revert <sha>`).
- 본 Goal 의 verification commit 만 별도 — score 파일 갱신만 포함 (코드 변경 없음).

### 8.5 번들 크기 영향
- **0 KB** (C-21 충족). 사용처 검증만 — 새 의존성 추가 0. `@tomis/grid-core` 는 G-001~G-005 로 17 페이지에서 import 됨 + 본 Goal 의 admin 2 페이지가 추가됨 (이미 import 중) → 본 Goal 추가 트리쉐이킹 영향 없음.
- 로컬 compat shim `ChangeTrackingGrid.tsx` 자체는 본 Goal 에서 삭제하지 않음 → 번들 변동 0. payroll 3 페이지가 이미 shim 트랜지티브로 `@tomis/grid-pro-tracking` 의 `useChangeTracking` + `CommitOptions` 사용 (shim L34-35) — 번들 영향 0.

### 8.6 alias 해결 경로 (B-04 의무 — 사용처 마이그레이션 Goal)

`@tomis/grid-core` import 의 해결 경로 (G-001~G-005 동일 — 실측 인용):

1. **vite.config.ts alias** (`D:/project/topvel_project/TOMIS/tw-framework-front/vite.config.ts` L18):
   ```ts
   '@tomis/grid-core': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-core/src'),
   ```
2. **tsconfig.app.json paths** (`D:/project/topvel_project/TOMIS/tw-framework-front/tsconfig.app.json` L23):
   ```json
   "@tomis/grid-core": ["../../topvel-grid-monorepo/packages/grid-core/src"],
   ```
3. **alias source target**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` L2 의 `export { Grid } from './Grid';`

`@tomis/grid-pro-tracking` import (로컬 shim 만 사용 — payroll 3 페이지 직접 사용 0):

1. **vite.config.ts alias** (L22):
   ```ts
   '@tomis/grid-pro-tracking': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-pro-tracking/src'),
   ```
2. **tsconfig.app.json paths**: **누락 (★ D2 거부 사유 (1))** — 4 entries (`grid-core`, `grid-core/legacy`, `grid-renderers`, `grid-pro-range`) 만 등록. `grid-pro-tracking` 누락 — 직접 import 시 tsc TS2307 fail 가능성.
3. **alias source target (shim 내부 사용)**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/index.ts` L6 `export { useChangeTracking } from './useChangeTracking';` + L7 `export { buildChangeSet } from './buildChangeSet';` + L11 `export { default as ChangeTrackingGrid } from './legacy/ChangeTrackingGrid';`

**검증 방법**: `npx tsc --noEmit` 통과 시 tsconfig paths 정상 resolution 입증. `vite build` 통과 시 vite alias 정상 resolution 입증. ADR-MOD-GRID-17-002 의무 충족 (B-04 sub-rule). 본 Goal 변경 0이므로 `npx tsc --noEmit` 결과 = G-005 검증 시점 baseline (passed) 그대로.

### 8.7 base repo 여부 (A-04 의무) + 워크트리 경계 우회 + 스크립트 BOM 매트릭스

- **5 파일 모두 `tw-framework-front/` (base repo, gitignored)** — 워크트리(`D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod17-g001/`) 외부.
- 본 Goal 변경 0이므로 워크트리 Edit/Write 도구 boundary 차단 발동 없음 (D9 + EC-05).
- artifacts metadata (워크트리 내부 `.claude/tw-grid/artifacts/MOD-GRID-17/migration/G-006-*`) 만 정상 Edit/Write 도구 사용.

**BOM 방향 매트릭스 (양방향 명시 — C-35 cascade — 본 Goal 발동 안 함)**:

| 파일 종류 | BOM 방향 | 본 Goal 적용 여부 |
|----------|---------|------------------|
| `.ps1` 스크립트 자체 | BOM 필요 (`0xEF 0xBB 0xBF` prepend) | **N/A — 본 Goal 변환 작업 0** |
| inline `powershell -Command` | BOM 무관 | **N/A** |
| 출력 `.tsx` 파일 | BOM 금지 (`UTF8Encoding($false)`) | **N/A — 변경 0** |

본 Goal 변경 0 결과 → C-34 + C-35 + ADR-MOD-GRID-17-001/004 발동 영역 외.

### 8.8 ★ 패턴 분류 (A-04 v1.0.9 reality-check 결과)

`affectedUsageFiles[5]` 의 각 entry 패턴 분류 (Section 1 L0 실측 Grep 결과 기반):

| Entry | 파일 | Grep `<Grid<` | Grep `<ChangeTrackingGrid` | Grep `<EditableGrid` | Grep `useReactTable` | 패턴 | 본 Goal scope |
|-------|------|--------------|---------------------------|----------------------|---------------------|------|--------------|
| 1 | MenuManagePage | **1 hit (L157)** | 0 hits | 0 hits | 0 hits | **α (Already-Direct)** | **VERIFY (변경 0)** |
| 2 | OrgMasterPage | **1 hit (L298)** | 0 hits | 0 hits | 0 hits | **α (Already-Direct)** | **VERIFY (변경 0)** |
| 3 | PayMmcd02Page | 0 hits | **1 hit (L310)** | 0 hits | 0 hits | **β (Compat-Shim)** | **VERIFY (변경 0)** |
| 4 | PayMmcd01Page | 0 hits | **1 hit (L505)** | 0 hits | 0 hits | **β (Compat-Shim)** | **VERIFY (변경 0)** |
| 5 | **PayrollEditablePage** | 0 hits | **1 hit (L199)** | **0 hits (★ prompt 거부 D11)** | 0 hits | **β (Compat-Shim + G-005 commitChanges)** | **VERIFY (변경 0)** |

**Reality-check 의무 결과**: 5/5 already-in-target (α 2 + β 3). `affectedUsageFiles[]` 배열 5 entries 보존 (audit trail) + `scopeNote` 필드 갱신 의무. ADR-MOD-GRID-17-005 § Implementation Notes 5 단계 절차 모두 완수.

**Pattern α vs Pattern β 의미 구분 (cross-cascade — G-004/G-005 와 비교)**:
- **G-004 D1 (DataTable 제외)**: MyNotificationPage 가 `<DataTable>` 사용 (다른 컴포넌트) — 카테고리 다름, deferred.
- **G-005 D1 (Pattern B 4 deferred)**: 4 페이지가 `useReactTable` 직접 사용 — 같은 라이브러리의 더 낮은 추상화, markup 페이지별 변형 외관 회귀 위험으로 deferred.
- **G-006 D1 (5/5 already-in-target)**: admin 2 = `@tomis/grid-core` 직접 종착점 / payroll 3 = 로컬 compat shim 종착점 — 두 카테고리 모두 spec end-state 도달, deferred 없음.

---

## Section 9. 의존성 (peerDeps / deps / devDeps)

- **신규 추가 의존성: 없음.**
- `@tomis/grid-core` workspace alias 는 다음 위치에 이미 wiring 완료 (8.6 인용):
  - `vite.config.ts` L18
  - `tsconfig.app.json` L23
- `@tomis/grid-pro-tracking` workspace alias 는 다음에 wiring (8.6 인용):
  - `vite.config.ts` L22 (있음)
  - `tsconfig.app.json` paths **누락** (D2 거부 사유 (1)) — 본 Goal 영향 없음 (payroll 3 페이지 직접 import 0, 로컬 shim 만 사용)
- `react`, `react-dom`, `@tanstack/react-table` peer dependencies 는 `tw-framework-front` 의 package.json 에서 이미 보유 (G-001~G-005 spec Section 9 검증 완료).
- `@tomis/grid-core` 의 package.json `main`/`exports` 는 monorepo MOD-GRID-00 G-001 에서 wiring 완료.
- `@tomis/grid-pro-tracking` 의 package.json `main`/`exports` 는 monorepo MOD-GRID-10/G-001~G-005 에서 wiring 완료 (`packages/grid-pro-tracking/src/index.ts` L11 ChangeTrackingGrid alias re-export).

---

## Section 10. 사용자 여정 매핑

### 10.1 개발자 관점 (3 단계 — verification only)
1. **식별**: 5 페이지의 grid 사용 라인 확인 (실제 Section 1 L0-1~L0-5 + 5 사이트 라인 명시 완료). **5/5 already-in-target-state — variant import 0 hits + spec end-state 1:1 도달 확인**.
2. **Grep + tsc 검증**: `npx tsc --noEmit` (cwd = `tw-framework-front`) → 0 errors. 5 페이지 각각 Grep으로 spec end-state 도달 확인. **변경 0 — implement Stage 는 `noOpImplementLoop` 패턴 (G-005 cascading)**.
3. **외관 보존 확인**: 5 페이지 dev server 렌더 후 G-001~G-005 검증 시점 baseline 과 외관 동일 확인 (zero-delta 보장).

### 10.2 최종 사용자 관점 (외관 동등)
- **rows/columns 표시**: 100% 동일 (변경 0). admin 2 페이지 `<Grid>` + payroll 3 페이지 shim — 모두 G-001~G-005 검증 baseline 그대로.
- **인터랙션**: admin 2 페이지 트리 펼침/접힘(`enableExpanding`/`getSubRows`) 동작 동일. payroll 3 페이지 행 추가/삭제/편집/`commitChanges` 동작 동일 (G-005 baseline).
- **빈 상태**: payroll 2 페이지 (PayMmcd02 + PayMmcd01) `emptyText="등록된 자료가 없습니다."` 그대로 (변경 0).
- **로딩 skeleton**: admin 2 페이지 `<Grid>` SkeletonRows 표시 (G-005 baseline). payroll 3 페이지 shim 의 loading 표시 그대로.
- **응답 시간**: 변경 0이므로 ±0%.

---

## Section 11. 구현 계획

### 11.1 파일별 변경 명세 (Section 7 표을 11 단계 sampling 한 결과 — E-01 cross-check)

| 파일 | 액션 | Step 1 (import 검증) | Step 2 (JSX 검증) | 검증 결과 (Grep 매트릭스) | 그룹 |
|------|------|----------------------|----------------------|---------------------------|------|
| MenuManagePage.tsx | **VERIFY** | L7 `from '@tomis/grid-core'` 1 hit 확인 | L157 `<Grid<MenuNode>` 1 hit 확인 | variant import 0 hits + Grid import 1 hit | α |
| OrgMasterPage.tsx | **VERIFY** | L7 `from '@tomis/grid-core'` 1 hit 확인 | L298 `<Grid<DeptNode>` 1 hit 확인 | variant import 0 hits + Grid import 1 hit | α |
| PayMmcd02Page.tsx | **VERIFY** | L5 `from '../../../components/tomis/Grid/ChangeTrackingGrid'` 1 hit 확인 | L310 `<ChangeTrackingGrid` 1 hit 확인 | BaseGrid/Grid<x>/EditableGrid 0 hits + ChangeTrackingGrid 1 hit | β |
| PayMmcd01Page.tsx | **VERIFY** | L5 동일 1 hit 확인 | L505 `<ChangeTrackingGrid` 1 hit 확인 | PayMmcd02 와 동일 매트릭스 | β |
| PayrollEditablePage.tsx | **VERIFY** | L5 동일 1 hit 확인 | L199 `<ChangeTrackingGrid` 1 hit 확인 + L86-130 `commitChanges` 사용 확인 | EditableGrid 0 hits (D11 거부 검증) + ChangeTrackingGrid 1 hit | β |

**E-01 Section 7 ↔ Section 11 일관성**: 5/5 행 1:1 매칭. NEW/MODIFY/VERIFY 분류 5 VERIFY 일치. 5 JSX 사이트 enumerate. 파일 이름 일치. 그룹 분류(α 2 + β 3) 일치.

**E-06 Prose ↔ Structured Form 일관성 (D1 + D11 cascade)**: 
- D1 본문 "5/5 already-in-target-state" prose vs Section 1 L0-1~L0-5 (5 모두 in-scope) + Section 3 표 5 행 + Section 7 표 5 행 + 본 Section 11.1 표 5 행 + Section 12 검증 5 파일. **prose↔structured 1:1 일치** — 모든 5 페이지 VERIFY action.
- D11 본문 "EditableGrid prompt 거부" prose vs Section 1 L0-5 PayrollEditable `<EditableGrid` 0 hits 명시 + Section 3 표 PayrollEditable 행 ChangeTrackingGrid 패턴 (EditableGrid 아님) + Section 7 표 PayrollEditable 행 VERIFY (변경 0) + EC-02 처리. **prose↔structured 1:1 일치**.

### 11.2 Before/After 코드 스니펫 (E-02 — 최소 1개)

**본 Goal 변경 0이므로 Before == After (zero-delta).** Before/After 동일 — 5 페이지 모두 spec end-state 도달.

**예시 1 — MenuManagePage L157 (Pattern α — Before == After):**

**Before / After 동일**:
```tsx
// L7 (변경 없음)
import { Grid } from '@tomis/grid-core';

// L157 (변경 없음)
<Grid<MenuNode>
  data={menuTree}
  columns={columns}
  enableExpanding
  getSubRows={(row) => row.children}
  defaultExpanded={true}
  loading={loading}
  onRowClick={(row) => setSelected(row)}
/>
```

**예시 2 — PayMmcd02Page L310 (Pattern β — Before == After):**

**Before / After 동일**:
```tsx
// L5 (변경 없음)
import ChangeTrackingGrid, { type ChangeTrackingHandle } from '../../../components/tomis/Grid/ChangeTrackingGrid';

// L310 (변경 없음)
<ChangeTrackingGrid
  ref={gridRef}
  initialData={rows}
  columns={columns}
  loading={loading}
  onRowClick={handleRowClick}
  emptyText="등록된 자료가 없습니다."
/>
```

### 11.3 구현 순서 (최소 2 단계 — E-03)

1. **Step 1 — 5 페이지 verification (read-only)**:
   - 5 페이지 각각 Grep 매트릭스 검증 (Section 7 표 검증 컬럼 명세).
   - `npx tsc --noEmit` (cwd = `tw-framework-front`) → 0 errors 확인.
   - dev server (`npm run dev`) 띄워 5 페이지 외관 확인 (admin 2 + payroll 3).
   - **변경 0 보장 — implementer 는 변환 작업 시도 금지 (D1 + D11 cross-reference)**.
   - tsc 또는 외관 실패 시 다음 단계 진행 금지 — 원인 분석 후 spec 재검토.

2. **Step 2 — 전체 검증 및 verification commit**:
   - AC-004 grep 검증 (Pattern α + β 모두 종착점 검증 — variant import 0 hits / Grid import (α) / ChangeTrackingGrid import (β)).
   - AC-001 tsc 0 errors (`npx tsc --noEmit`).
   - AC-003 dev server console.warn 0 건.
   - **AC-002 시각 회귀 — 5 페이지 확인 의무**:
     - admin 2 페이지: 트리 펼침/접힘 외관 (MenuManage 메뉴 트리 + OrgMaster 조직 트리)
     - payroll 3 페이지: 행 추가/삭제/편집 외관 + emptyText 한국어 표시 + commitChanges 동작 (PayrollEditable)
     - 모든 외관 G-001~G-005 검증 baseline 그대로 (zero-delta 보장).
   - **AC-005 verification commit (또는 0-byte commit)**: 본 Goal 의 git diff 0 라인 보장 — 단일 verification commit (score 파일만) 또는 commit 0개.
   - **G-005 `noOpImplementLoop` 패턴 cascading**: implement-score JSON 에 `noOpImplementLoop: { reason, verificationMethod, alreadyInTargetEvidence }` 필드 명시 의무.

### 11.4 위험 요소

| 위험 | 영향 페이지 | 완화책 |
|------|------------|--------|
| ★ Goal prompt 의 "EditableGrid → enableInlineEdit/enableChangeTracking" 클레임 → implementer 가 prompt 코드 따라 변환 시도 시 disk 모순 + tsc fail/외관 회귀 | PayrollEditable (5/5 모두) | EC-02 + D11 + C-27 + C-33 — Implementer prompt 에 spec 본문 D11 인용 의무. spec 본문 권위 우선 (C-1 + C-27). prompt 코드 블록 vs spec 충돌 시 spec 채택 + `promptSpecDrift[]` 보고. |
| "5 파일 변환 작업 필요" 가정 → 불필요한 import 변경 / `<Grid>` → 다른 형태 시도 → 외관 회귀 + tsc fail | 5/5 모두 | EC-01 + D1 + D5 + Section 7 표 5 행 모두 VERIFY action. Implementer prompt 에 "5/5 already in target state — 0 substantive changes" + G-005 `noOpImplementLoop` 패턴 인용. |
| 향후 implementer 가 "직접 `@tomis/grid-pro-tracking` import 으로 변환하면 더 깔끔" 권장 시도 → shim 의 `border-l-2` 외관 회귀 | payroll 3 모두 (3) | D2 거부 사유 (2) + EC-03 — shim 의 의식적 외관 호환 보존 (MOD-GRID-10/G-005 design comment 인용). 직접 import 변환은 본 Goal scope 외, 별도 후속 Goal (MOD-GRID-18). |
| tsconfig.app.json 의 `@tomis/grid-pro-tracking` paths 누락 — 향후 직접 import 시도 시 tsc TS2307 fail | payroll 3 모두 | D2 거부 사유 (1) + EC-04 + D6 — 본 Goal 영향 없음 (payroll 3 페이지 shim 만 사용). 직접 import 변환 시 tsconfig.app.json paths 추가 결정 필요 — 본 Goal scope 외. |
| 워크트리 boundary 차단 발견 시 implementer 가 변환 시도 → 1 round-trip 낭비 | 5/5 모두 (변경 0이지만 잘못 시도 시) | D9 + EC-05 + C-34 + ADR-MOD-GRID-17-001 — 본 Goal 변경 0 → boundary 차단 발동 없음. PowerShell 우회 의무 미발동. |
| 한국어 emptyText 깨짐 (payroll 2 페이지) | PayMmcd02 + PayMmcd01 | EC-07 + D10 — 본 Goal 변경 0 → 한국어 리터럴 보존 보장. git diff 검증 의무. 변환 시도 발생 시 즉시 중단. |
| admin 2 페이지의 `enableExpanding` 트리 모드 — grid-core 통합 흡수 결과 검증 | MenuManage + OrgMaster | EC-08 + MOD-GRID-16 G-001 cross-reference — grid-core 통합 흡수가 이미 동작 (G-001~G-005 baseline). 본 Goal 변경 0 → 검증 결과 baseline 그대로. |
| **★ discover 자동화 한계 — already-in-target 페이지를 BaseGrid wrapper Goal 에 포함 (G-005 Pattern B 와 다른 카테고리)** | 5/5 모두 | D12 cross-reference — discover 단계 affected_files 분류가 이미-변환 페이지 식별 못함. cascading 후속 Goal (MOD-GRID-18+) 도 동일 reality-check 의무. |

---

## Section 12. 검증 계획

### 12.1 단위 테스트 (E-05)
- **본 Goal 자체 단위 테스트 없음** — 사용처 verification 이므로 grid-core + grid-pro-tracking 의 단위 테스트가 이미 MOD-GRID-01 G-001~G-005 + MOD-GRID-10 G-001~G-005 + MOD-GRID-16 G-001 에서 커버됨.
- 사용처에 추가 단위 테스트 필요시 후속 Goal 에서 추가 (본 Goal 범위 외).

### 12.2 시각 회귀 검증 (C-13 + C-17 의무 — migrationImpact: high)
- **방법 1 (자동)**: tw-framework-front 의 Storybook 미설정 환경 — Storybook story 신규 작성은 본 Goal 범위 외.
- **방법 2 (수동)**: 5 페이지 dev server (`npm run dev`) 에서 G-001~G-005 검증 시점 baseline 과 외관 동일 확인. 본 Goal 변경 0이므로 zero-delta 보장. 확인 대상:
  - admin α 2 페이지:
    - cell padding (`px-4 py-3`)
    - row height
    - sort glyph (▲▼⇅) 위치
    - hover bg-gray-50
    - thead bg-gray-50 sticky top-0
    - 트리 펼침/접힘 동작 + 들여쓰기 (`enableExpanding` + `getSubRows` 트리 모드)
    - selected row bg-blue-50
  - payroll β 3 페이지:
    - shim 의 `COMPAT_ROW_STATUS_COLORS` (`border-l-2`) 표시 — added (green) / edited (yellow) / deleted (red opacity-60 line-through)
    - emptyText "등록된 자료가 없습니다." 한국어 표시 보존 (PayMmcd02 + PayMmcd01)
    - PayrollEditable: 인라인 편집 셀 동작 + commitChanges 동작 (G-005 baseline)

### 12.3 빌드 검증 (C-12 의무)
- `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx tsc --noEmit` → exit 0, 0 errors.
- `cd D:\project\topvel_project\TOMIS\tw-framework-front && npx vite build` → 빌드 성공.

### 12.4 마이그레이션 자동 보완 (codemod)
- MOD-GRID-99-B docs Goal 에서 codemod 작성 예정. 본 Goal 은 변환 작업 0이므로 codemod 적용 대상 외.
- 후속 Goal (MOD-GRID-18 — shim 제거 시점) 에서 직접 `@tomis/grid-pro-tracking` import 변환 시 codemod 우선순위 상승.

### 12.5 한글 깨짐 검증 (C-34 + C-35 + ADR-MOD-GRID-17-001/004 의무) — 본 Goal 미발동
- 본 Goal 변경 0 → PowerShell 우회 의무 미발동 + `.ps1` BOM 의무 미발동.
- payroll 2 페이지의 emptyText `"등록된 자료가 없습니다."` (PayMmcd02 L316 + PayMmcd01 L511) 는 git diff 0 라인 보장 → 한국어 리터럴 보존 자동 (변경 자체가 없음).
- 변경 후 Read 도구로 변경 부위 확인 (변경 0이므로 baseline 인용 그대로).

### 12.6 G-005 Pattern B deferral 무영향 검증 (G-005 D11 cascade)
- **G-005 D11 결정 무관성 확인**: 본 Goal 의 affected 5 파일에 Pattern B 4 페이지 (InsEduc11History/DailyAttendance/InsEmpl22ContractList/AnnualLeaveStatus) 미포함 — 본 Goal 영향 영역 분리.
- 검증 방법: 본 Goal 의 git diff 가 `tw-framework-front/src/pages/tomis/hr/Ins*.tsx` 또는 `tw-framework-front/src/pages/tomis/hr/*Attendance*.tsx` 또는 `tw-framework-front/src/pages/tomis/hr/Annual*.tsx` 4 파일에 0 영향 — 본 Goal 변경 0 → 자동 충족.
- 추후 별도 Goal (G-005b 또는 MOD-GRID-18) 에서 Pattern B 4 페이지 + payroll shim 제거 시점 동시 변환 검토 권장.

### 12.7 goals.json `scopeNote` 갱신 검증 (ADR-MOD-GRID-17-005 + A-04 v1.0.9 의무)
- spec submit 직후 goals.json G-006 객체에 다음 둘 다 추가 의무:
  - 최상위 `"scopeNote": "5/5 already in target end-state (admin 2 = Pattern α direct @tomis/grid-core, payroll 3 = Pattern β compat shim wrapping @tomis/grid-pro-tracking). 0 substantive changes — verification-only Goal (G-005 noOpImplementLoop pattern cascading). Goal prompt 'EditableGrid → enableInlineEdit/enableChangeTracking' claim rejected (D11) — disk Grep <EditableGrid 0 hits across all 5 pages. Direct @tomis/grid-pro-tracking import migration (shim removal) deferred to MOD-GRID-18 — D2 rejection cited tsconfig.app.json paths missing + COMPAT_ROW_STATUS_COLORS visual regression by design + API breaking change."`
  - `stages.specify.scopeNote` 동일 메시지
- `affectedUsageFiles[]` / `implementFiles[]` 배열 5 entries 그대로 (audit trail 보존).

### 12.8 MOD-GRID-17 1.0 closer 검증 (D12 cross-reference)
- 본 Goal 완료 시 누적 카운트 검증 의무:
  - G-001 (account/Slip*): 5 페이지 변환 완료 ✓
  - G-002 (account/Expense*+Vat*): 5 페이지 변환 완료 ✓
  - G-003 (account/Cash*+기타): 5 페이지 변환 완료 ✓
  - G-004 (account 잔여): 4 페이지 변환 완료 (MyNotification deferred) ✓
  - G-005 (hr/finance): 1 페이지 변환 완료 (Pattern B 4 페이지 deferred) ✓
  - **G-006 (payroll/admin): 5 페이지 verification 완료 (변경 0)**
- 누적 합계: 변환 20 페이지 + verification 5 페이지 = **25 affected files MOD-GRID-17 처리** + 5 deferred (MyNotification 1 + Pattern B 4) = 30 total affected.
- **tw-grid 1.0 release closer 도달**: 78/79 → **79/79** ✓ (본 spec/implement/verify 모두 통과 시).

---

## Section 13. 상용 제품화 영향

### 13.1 패키지 대상 (F-01)
- **본 Goal 의 변경 대상 = `tw-framework-front` 사용처 verification only**. `@tomis/grid-core` / `@tomis/grid-pro-tracking` / `@tomis/grid-pro-master` / `@tomis/grid-renderers` 등 monorepo 패키지 변경 없음 (코어 변경 0).
- `packageTarget: "tw-framework-front"` (G-001~G-005 동일).

### 13.2 라이선스 검증 호출 (F-02)
- **N/A — admin 2 페이지 (MIT 영역 사용)**: `@tomis/grid-core` 의 `Grid` 만 사용. Pro 영역 직접 호출 없음 (Read 결과 confirmed — Grep `@tomis/grid-pro-` 직접 import 0 hits in admin 2 페이지).
- **N/A — payroll 3 페이지 (Pro 영역 트랜지티브 사용 — 직접 호출 없음)**: 로컬 compat shim 만 직접 import. shim 내부에서 `@tomis/grid-pro-tracking` 의 `useChangeTracking` + `CommitOptions` 사용 (shim L34-35) — 트랜지티브.
- 본 Goal 변경 0이므로 `setLicenseKey()` / `configureGridLicense()` 호출 위치 추가 불필요. `grid-license` 런타임 검증은 grid-pro-tracking package import 시 자동 호출 (`src/index.ts` L1-3 `checkLicense()` — shim L32-35 의 import 가 트리거).

### 13.3 문서 작성 계획 (F-03)
- **본 Goal 자체는 public API 변경 0** — Docusaurus API reference 항목 추가 불필요 (C-25 의무는 grid-core 또는 grid-pro-* 신규 API 추가 시에만 발동).
- **권장 (선택)**: MOD-GRID-99-B docs Goal 의 "마이그레이션 가이드" 챕터에 다음 추가 권장:
  - **Pattern α (Already-Direct) 사례**: admin 2 페이지 (MenuManage/OrgMaster) — `@tomis/grid-core` 직접 사용 + `enableExpanding` 트리 모드 (MOD-GRID-16 통합 흡수 결과).
  - **Pattern β (Compat-Shim) 사례**: payroll 3 페이지 — 로컬 compat shim 사용 + 트랜지티브 `@tomis/grid-pro-tracking` + G-005 `commitChanges` API.
  - **discover 자동화 한계 가이드**: already-in-target 페이지를 마이그레이션 Goal 에 잘못 포함하는 케이스 (본 G-006 D1 발견) 의 cascading 위험 명시. cascade 효과로 후속 모듈 (MOD-GRID-18+) 도 동일 reality-check 의무.
- Storybook story 신규 작성: **본 Goal 범위 외** (12.2 방법 1 참조).

### 13.4 peerDependencies 정책 (F-04)
- `@tomis/grid-core` 가 `react` / `react-dom` / `@tanstack/react-table` 을 peer 로 선언 (MOD-GRID-00 G-001 + MOD-GRID-01 G-005 확정).
- `@tomis/grid-pro-tracking` 동일 peer 정책 + `@tomis/grid-core` peer (MOD-GRID-10/G-001~G-005 확정).
- tw-framework-front 의 package.json 이 이미 이 셋을 deps 로 보유 — peer 충족.
- 본 Goal 은 dependency 변경 0 → C-22 위반 없음 + peer mismatch 0.

### 13.5 semver 영향 (C-23)
- 본 Goal 은 `@tomis/grid-core` / `@tomis/grid-pro-tracking` 의 public API 변경 0 → semver 영향 없음 (patch 도 아님).
- 로컬 compat shim `ChangeTrackingGrid.tsx` 의 deprecated 처리 검토는 본 Goal 범위 외 — 별도 후속 Goal (MOD-GRID-18 — shim 제거 시점). 누적 마이그레이션 완료 페이지: G-001 5 + G-002 5 + G-003 5 + G-004 4 + G-005 1 + G-006 5 (verification) = **25 페이지** (Pattern α + β 모두 종착점).
- **★ tw-grid 1.0 release marker**: 본 Goal 완료 시 `@tomis/grid` 메타 패키지 1.0.0 release 후보 — MOD-GRID-99-A 라이선스 검증 + MOD-GRID-99-B Docs 통과 후 최종 release.

---

## Appendix A. Reality-Check Evidence (A-04 v1.0.9 sub-bullet 자가 점검)

ADR-MOD-GRID-17-005 § Implementation Notes 5 단계 절차 모두 완수:

1. **`affectedUsageFiles[]` 추출**: goals.json G-006 (`D:/project/topvel_project/TOMIS/.claude/tw-grid/goals/MOD-GRID-17/migration-goals.json` L408-414) — 5 entries.
2. **각 entry Read + Grep 실측**:
   - MenuManagePage.tsx (209 줄) — Grep `<Grid<` 1 hit (L157), `<BaseGrid` 0 hits, `<ChangeTrackingGrid` 0 hits, `<EditableGrid` 0 hits → **Pattern α (Already-Direct)**
   - OrgMasterPage.tsx (492 줄) — Grep `<Grid<` 1 hit (L298), variant patterns 0 hits → **Pattern α**
   - PayMmcd02Page.tsx (477 줄) — Grep `<ChangeTrackingGrid` 1 hit (L310), `<BaseGrid`/`<Grid<`/`<EditableGrid` 0 hits → **Pattern β (Compat-Shim)**
   - PayMmcd01Page.tsx (686 줄) — Grep `<ChangeTrackingGrid` 1 hit (L505), 다른 variant 0 hits → **Pattern β**
   - PayrollEditablePage.tsx (210 줄) — Grep `<ChangeTrackingGrid` 1 hit (L199), **`<EditableGrid` 0 hits (★ Goal prompt 클레임 거부 — D11)**, `useChangeTracking` 직접 사용 0 hits → **Pattern β + G-005 commitChanges**
3. **Reduction 결정 형식 (D1)** — 본 Goal 의 reduction 은 deferred 아닌 **completion** 분류:
   - **D# 결정 작성**: D1 (헤더 표 — 5/5 already-in-target 명시).
   - **Section 1 L0-N 모두 in-scope 표시**: L0-1~L0-5 (5/5 in-scope, deferred 없음, 변경 0).
   - **Section 7 표 행 모두 VERIFY**: 5 행 (전수).
   - **사전 결정 표 D# `goals.json 영향` 컬럼**: D1 "affectedUsageFiles 5 → 5 verification (변경 0)" + D5 "배열 5 보존 + scopeNote 필드 갱신 의무".
4. **goals.json `scopeNote` 갱신**: spec submit 직후 의무 (Section 12.7 명시).
5. **배열 보존**: `affectedUsageFiles[]` / `implementFiles[]` 5 entries 그대로 (audit trail).

**G-004 (DataTable 제외) vs G-005 (Pattern B 제외) vs G-006 (5/5 already-in-target) 의미 구분**:
- G-004 D1 = MyNotificationPage 는 **다른 컴포넌트 (`DataTable`)** 사용 — 카테고리 다름, 1 deferred.
- G-005 D1 = Pattern B 4 페이지는 **같은 TanStack 라이브러리의 더 낮은 추상화 레벨** (`useReactTable` 직접) 사용 — markup 페이지별 변형 외관 회귀 위험, 4 deferred.
- **G-006 D1 = 5/5 already-in-target — 2 패턴 분기 (α direct / β shim) 모두 spec end-state 도달 — 0 deferred + 0 변경**.
- 세 결정 모두 ADR-MOD-GRID-17-005 Investigative Scope-Reduction Authority 발동 케이스 (서로 다른 의미적 이유).

**MOD-GRID-17 1.0 release closer 효과 (D12 cross-reference)**:
- 본 Goal 완료 시 tw-grid 78/79 → **79/79** 도달.
- 78/79 의 deferred 4 페이지 (G-005 D11 Pattern B) 는 별도 후속 모듈 (MOD-GRID-18) 책임 — 본 1.0 release scope 외.
- discover 자동화 한계 — 본 cascade 패턴 (already-in-target 페이지 잘못 포함) 이 후속 모듈 spec writer 의 reality-check 의무 cascading 효과.

---

## Appendix B. 자가 점검 (Spec Writer Self-Check — C-35)

**Same-function signature scan**: 본 Goal 의 spec template 에 동일 함수의 여러 form 인스턴스 없음 (사용처 verification — 기존 `<Grid>` + `<ChangeTrackingGrid>` API 호출만, 신규 함수 정의 0). N/A.

**Import usage scan**:
- Section 2.2 admin `import { Grid } from '@tomis/grid-core';` — Section 2.3 예시 1 본문에서 `<Grid<MenuNode> ... />` 사용 (hit ≥ 1) ✓
- Section 2.2 admin `import { type ColumnDef } from '@tanstack/react-table';` — L0-1/L0-2 본문에서 `ColumnDef` type 사용 명시 ✓
- Section 2.2 payroll `import ChangeTrackingGrid, { type ChangeTrackingHandle } from '../../../components/tomis/Grid/ChangeTrackingGrid';` — Section 2.3 예시 2 본문에서 `<ChangeTrackingGrid ... />` + `useRef<ChangeTrackingHandle<...>>` 사용 ✓
- Section 2.2 payroll `import type { ColumnDef } from '@tanstack/react-table';` — L0-3~L0-5 본문에서 명시 ✓
- Section 11.2 예시 1 Before/After 동일 코드 블록 `import { Grid } from '@tomis/grid-core';` — 본문 `<Grid<MenuNode> ... />` 사용 ✓
- Section 11.2 예시 2 Before/After 동일 코드 블록 `import ChangeTrackingGrid ...` — 본문 `<ChangeTrackingGrid ... />` 사용 ✓
- 모든 import line 본문 사용 hit ≥ 1 — unused import 0건 ✓

**E-06 Prose ↔ Structured Form 일관성 (cascade — G-004 self-review + G-005 D11 학습)**:
- D1 본문 "5/5 already-in-target-state" prose vs Section 1 L0-1~L0-5 + Section 3 표 5 행 + Section 7 표 5 행 (모두 VERIFY) + Section 11.1 표 5 행 + Section 12 검증 5 파일 — 모든 structured form 1:1 일치 ✓
- D11 본문 "Goal prompt EditableGrid 클레임 거부" prose vs Section 1 L0-5 PayrollEditable `<EditableGrid` 0 hits 명시 + Section 3 표 PayrollEditable 행 ChangeTrackingGrid 패턴 (EditableGrid 아님) + EC-02 처리 + AC-004 grep 검증 — 모든 structured form 1:1 일치 ✓
- D2 본문 "직접 import 변환 거부 3 사유" prose vs EC-03 (외관 회귀 by design) + EC-04 (tsconfig paths 누락) + Section 9 (tsconfig.app.json paths 4 entries 명시) — prose↔structured 1:1 일치 ✓

**Return-Type Signature Cross-Check (E-06 sub-rule)**: 본 Goal 의 spec template 에 함수 시그니처 정의 없음 (verification only). N/A.

**Unused Type Import Cross-Check (E-06 sub-rule)**: 본 Goal 의 spec 코드 블록 모든 import 항목 본문 사용 — Import usage scan 결과 ✓.

**G-01 사전 결정 표(D#) ↔ 본문 cross-consistency**:
- D1 (5/5 already-in-target — α 2 + β 3) ↔ Section 1 L0-1~L0-5 (α 2 + β 3) + Section 3 표 (α 2 + β 3) + Section 7 표 (α 2 + β 3) + Section 8.8 패턴 분류 표 ✓
- D2 (직접 import 변환 거부) ↔ EC-03 + EC-04 + Section 9 (paths 누락 명시) + 13.2 (트랜지티브 사용) ✓
- D3 (Pattern α verification 방법) ↔ Section 7 표 #1+#2 + Section 11.1 표 #1+#2 + AC-004 grep 매트릭스 ✓
- D4 (Pattern β verification 방법) ↔ Section 7 표 #3+#4+#5 + Section 11.1 표 #3+#4+#5 + AC-004 grep 매트릭스 ✓
- D5 (배열 5 보존 + VERIFY 5) ↔ Section 7 표 5 행 + Section 8.1 in-scope 5 + deferred 0 ✓
- D11 (EditableGrid prompt 거부) ↔ Section 1 L0-5 + EC-02 + 13.3 docs 권장 ✓
- D12 (1.0 closer 위치) ↔ Section 12.8 누적 검증 + 13.5 1.0 release marker ✓

**최종 D# 카운트**: 12 결정. NEW 0 + MODIFY 0 + VERIFY 5 = 5 파일. Section 7 표 5 행 + Section 11.1 표 5 행 = 1:1 일치.

**Verifier 자가-검산 의무 (C-26)**:
- 카테고리 합계: A=5 + B=5 + C=5 + D=6 + E=6 + F=4 + G=1 = 32 + H=3 ✓
- N/A 분모 제외 예상:
  - A-02 (TanStack v8 API signature — 본 Goal 변경 없음, verification only)
  - A-03 (variant 중복 추출 — 본 Goal scope 외, verification only)
  - A-05 (R-A AG Grid + R-W Wijmo — 사용처 verification N/A)
  - B-05 (ref API — admin pages 미사용, payroll pages shim API 사용 명시)
  - D-04 (deprecation 전략 — breaking false)
  - D-05 (롤백 전략 — 변경 0이므로 rollback 자동 0)
  - F-02 (라이선스 — admin MIT + payroll 트랜지티브 Pro, 직접 호출 N/A)
- failedChecks 배열: NO 결과만 포함, N/A 절대 미포함 ✓
- **JSON 출력 무결성 자기-검증 의무**: score JSON 디스크 쓰기 직전 `JSON.parse(myOutput)` 자기 호출로 parse 성공 검증 의무 (C-26 + rubric v1.0.7 신설).

---

**참조 파일**:
- `D:/project/topvel_project/TOMIS/.claude/tw-grid/constraints.md` (C-1 ~ C-36)
- `D:/project/topvel_project/TOMIS/.claude/tw-grid/rubric/specify-rubric.md` (v1.0.9)
- `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-17-decisions.md` (5 ADR — ADR-MOD-GRID-17-005 권한 행사 근거)
- `D:/project/topvel_project/TOMIS/.claude/tw-grid/artifacts/MOD-GRID-17/migration/G-005-spec.md` (직전 Goal — Pattern B deferral cascading 참조)
- `D:/project/topvel_project/TOMIS/.claude/tw-grid/artifacts/MOD-GRID-17/migration/G-005-implement-score.json` (noOpImplementLoop 패턴 cascading 참조)
- `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/current-tanstack-analysis.md` (§3 패턴 분석)
- `D:/project/topvel_project/TOMIS/.claude/tw-grid/goals/MOD-GRID-17/migration-goals.json` (G-006 정의 L361-426)
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/Grid.tsx` (admin 2 페이지 종착점 component)
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` (Grid named export L2)
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/index.ts` (payroll shim 트랜지티브 dep — ChangeTrackingGrid alias re-export L11)
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/legacy/ChangeTrackingGrid.tsx` (monorepo legacy alias — payroll shim 의 직접 import 대안 거부 — D2)
- `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx` (로컬 compat shim — payroll 3 페이지 종착점 — L37-46 design comment)
- `D:/project/topvel_project/TOMIS/tw-framework-front/vite.config.ts` (alias L18 + L22)
- `D:/project/topvel_project/TOMIS/tw-framework-front/tsconfig.app.json` (paths L21-25 — `@tomis/grid-pro-tracking` 누락 D2 (1))
- `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/admin/MenuManagePage.tsx` (Pattern α — L7 + L157)
- `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/admin/OrgMasterPage.tsx` (Pattern α — L7 + L298)
- `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/payroll/PayMmcd02Page.tsx` (Pattern β — L5 + L310)
- `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/payroll/PayMmcd01Page.tsx` (Pattern β — L5 + L505)
- `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/payroll/PayrollEditablePage.tsx` (Pattern β + G-005 commitChanges — L5 + L86-130 + L199)
