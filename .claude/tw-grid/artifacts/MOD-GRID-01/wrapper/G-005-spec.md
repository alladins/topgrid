# G-005 Specification — BaseGridProps 호환 alias 5종 (BaseGrid/VirtualGrid/ColumnPinGrid/GroupedHeaderGrid/TreeGrid)

**Module**: MOD-GRID-01 (공통 wrapper — variant 8 통합)
**Goal**: G-005
**Area**: wrapper
**Phase**: abstraction
**Priority**: P0
**migrationImpact**: high
**threshold**: 95 (specify/implement/verify 동일 — canonical-modules.json L72)
**spec 작성일**: 2026-05-14
**spec 버전**: v1.0 (loops 0/3, 첫 시도)
**의존**: MOD-GRID-01/G-001 (overallStatus=completed, score 100/100/100), G-002 (100/100/100), G-003 (100/100/100), G-004 (100/100/100)
**MOD-GRID-01 wrapper 모듈 종결 Goal** (5/5 — 본 Goal 완료 시 wrapper 모듈 100%).

---

## ★ 사전 결정 표 (D# — 본문 cross-consistency 의무, rubric G-01 v1.0.4 강화)

| D# | 결정 | 본문 위치 | 출처 |
|----|------|----------|------|
| D1 | 구현 대상 monorepo `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/legacy/` (NEW 디렉토리). **wrapper-goals.json G-005 `implementFiles` 6개 모두 monorepo prefix 정확** — C-28 정정 불필요 (G-002/G-003/G-004 D1과 동일). | Section 7 + 8.1 + 8.2 | wrapper-goals.json L287-294 Read 확인 |
| D2 | **NEW 7 + grid-core MODIFY 4 + 사용처 MODIFY 3 = 14 파일**. NEW: `legacy/BaseGrid.tsx` + `legacy/VirtualGrid.tsx` + `legacy/ColumnPinGrid.tsx` + `legacy/GroupedHeaderGrid.tsx` + `legacy/TreeGrid.tsx` + `legacy/index.ts` + `legacy/useDeprecationWarn.ts` (D3). **grid-core MODIFY: `src/Grid.tsx` (D5 — L83 useState 1줄) + `src/types.ts` (D5 — `defaultExpanded` prop + D11 — `BaseGridProps` 신규) + `src/index.ts` (D8 — 5 alias re-export) + `package.json` (D8 — `exports."./legacy"` field 추가)**. 사용처 MODIFY: `SlipListPage.tsx` + `AdminSlipEditPage.tsx` + `MenuManagePage.tsx` (D10 — DailyAttendance/AnnualLeaveStatus는 raw TanStack 직접 사용 → 본 Goal no-op). **wrapper-goals.json `implementFiles` 6 파일 표면은 useDeprecationWarn.ts 분리 + Grid.tsx/types.ts MODIFY + package.json MODIFY 미반영** — spec 본문 권위 (C-27). `tsup.config.ts` D13에 따른 추가 변경은 Implementer-decided fallback (Section 11.3 위험 표 — multi-entry 채택 시 Step 11에서 동일 Step 내 변경, 별도 행 없음). | Section 7 표 (14행) + Section 11.1 Step 1-14 + AC-007/AC-009 | wrapper-goals.json L287-294 Read + 모든 5 variant + 5 사용처 Grep 결과 + advisor item#1/#2/#3 |
| D3 | **`useDeprecationWarn(name)` 헬퍼 분리 채택** — 5 alias 공통 호출 (DRY). 인라인 시 5회 중복 boilerplate (StrictMode + HMR + dev mode 가드 로직 동일). 분리 시 단일 hook 유지보수. **구현**: `useRef<boolean>(false)` + `useEffect(()=>{ if(!fired.current && process.env.NODE_ENV !== 'production'){ fired.current = true; console.warn(`[tomis/grid-core] ${name} is deprecated, migrate to <Grid>`); }}, [])` (deps 빈 배열 — mount 1회, ref guard로 StrictMode double invoke + HMR re-mount 폭주 차단). useGridImperativeHandle.ts L41 dev guard 패턴과 일관. | Section 2 (alias 시그니처) + Section 7 행 #7 + AC-003 | useGridImperativeHandle.ts L41 패턴 + 5 alias 공통 — 1 occurrence 5x 정책 (DRY > "1=anecdote") |
| D4 | **dev warn ref guard 패턴 (D3 hook 내부)** — `useRef + useEffect once + StrictMode 호환`. 사유: React 19 StrictMode는 dev에서 effect를 2회 호출. `useRef` mutable flag로 첫 호출만 console.warn 발생. HMR re-mount 시도 새 hook 인스턴스 (ref 초기화) → re-warn 1회 — 의도된 정상 동작 (HMR 시 deprecation 인지 강화). | Section 6 EC-02 + Section 11.1 Step 1 (useDeprecationWarn) | React 19 StrictMode 사양 + advisor 게이트 |
| D5 | **TreeGrid `expandAll={true}` 호환 — `defaultExpanded` prop NEW (Grid.tsx + types.ts MODIFY)** (advisor item#2). AS-IS TreeGrid.tsx:35 `useState<ExpandedState>(initialExpandAll ? true : {})` — uncontrolled 초기값 seed 기능. 현재 G-001~G-004 Grid.tsx:83 `useState<ExpandedState>({})` 하드코딩 → alias가 `expandAll={true}` 전달해도 효과 0 (외관 회귀 — MenuManagePage 전체 트리 펼침 깨짐). 채택안 (a) **`defaultExpanded?: ExpandedState | boolean`** prop 신규 — types.ts MODIFY 1줄 + Grid.tsx:83 `useState<ExpandedState>(props.defaultExpanded ?? {})` 변경 1줄. 대안 (b) controlled API (5 prop 추가 — surface 과다), 대안 (c) `key={expandAll ? 'e' : 'c'}` 강제 remount (brittle). 본 결정으로 TreeGrid alias 매핑은 `<Grid enableExpanding getSubRows defaultExpanded={expandAll ? true : {}}>`. | Section 2.5 (TreeGrid alias) + Section 7 행 #8 (Grid.tsx MODIFY) + Section 7 행 #9 (types.ts MODIFY) + AC-002 + Section 6 EC-03 | advisor item#2 + Grid.tsx:83 + TreeGrid.tsx:35 + MenuManagePage.tsx:161 (`expandAll={true}` 사용) |
| D6 | **GroupedHeaderGrid alias — basic shim 채택, MOD-GRID-14 enhancement는 후속** (advisor item#4 — AC-001 vs AC-004 재해석). canonical-modules.json L484-491 MOD-GRID-14 F-14-05 "GroupedHeaderGrid alias (C-6 호환)" + 본 Goal AC-001 (5 alias 함수 컴포넌트 export 의무) + AC-004 (MOD-GRID-14에서 별도) 모순. 해소: **G-005에서 basic 호환 shim 제공** (현재 사용처 ColumnDef hierarchy 그대로 `<Grid columns={...}>` 전달 — TanStack ColumnDef 그룹 구조는 G-001 buildTableOptions에 무수정 통과). MOD-GRID-14는 `createColumnGroup({header, columns:[...]})` helper + sticky group header CSS + 자식 visibility 토글 등 enhancement를 동일 alias 이름에서 추가 (semver minor — backward-compatible 확장). | Section 2.4 (GroupedHeaderGrid alias) + Section 5 AC-001 매핑 + Section 4 호환성 | canonical-modules.json L484-491 + wrapper-goals.json G-005 AC-001/AC-004 본문 + advisor item#4 |
| D7 | **번들 게이트 — 측정 의무 + extrapolation 금지 (advisor item#5)**. ADR-MOD-GRID-01-005 실측: G-001 17.44 + G-002+G-003 +0.91 + G-004 +5.86 = **24.21 KB / 30 KB (여유 5.79 KB)**. wrapper-goals.json G-005 `bundleImpact.expected: "+5 KB"` 적용 시 누적 29.21 KB / 30 KB (여유 0.79 KB) — pessimistic 한계 근접. G-004 84% 실측 적용 시 +4.2 KB → 28.41 KB (여유 1.59 KB)도 마진 박함. **prompt의 "trajectory 84% 적용" extrapolation 금지** (G-001-3 14% vs G-004 84% — 공식 부재). **정책**: IMPLEMENT Step 11에서 `pnpm size-limit` 실측 의무. 누적 ≤28.5 KB → 단일 entry 유지. > 28.5 KB → `/legacy` sub-entry 강제 분리 (D8 sub-entry 정의가 그 대비책 — 사전 인프라 마련). | Section 8.5 + Section 11.1 Step 11 + Section 11.3 위험 표 + AC-008 | ADR-MOD-GRID-01-005 실측 + wrapper-goals.json bundleImpact + advisor item#5 |
| D8 | **`src/index.ts` MODIFY — `/legacy` sub-entry 별도 export 채택** (D7 분리 트리거 사전 대비 + tree-shake + import 경로 명확). **`package.json exports` field에 `"./legacy"` entry 추가** (D7 위반 시 즉시 분리 가능). 정책: 사용처는 `import { BaseGrid } from '@tomis/grid-core/legacy'` 권장 (deprecation intent 명시) — `from '@tomis/grid-core'` 도 동작 (re-export 통과). MOD-GRID-99-B 마이그레이션 가이드는 `/legacy` 경로 권장 명기. **tsup 빌드 entry 추가 의무** — `tsup.config.ts` MODIFY 가능성 → spec Section 7에서 별도 명시 (실측: tsup multi-entry config 확인 후 결정 — 현재 entry 단일 가정, multi-entry 필요 시 Section 11 위험 표에 명시). | Section 2.7 + Section 7 행 #6 (legacy/index.ts) + Section 7 행 #10 (src/index.ts MODIFY) + Section 7 행 #11 (package.json MODIFY) + Section 11.1 Step 6/10/11 + Section 11.3 | C-23 + advisor item#5 + tsup multi-entry 표준 |
| D9 | **C-13 baseline 캡처 시점 — 본 Goal 사용처 3 페이지에서 즉시 캡처** (advisor item 게이트). MOD-GRID-17 27 페이지 baseline은 별도 Goal 책임. 본 G-005가 alias 기능 첫 실 사용 → migrationImpact: high → C-17 의무. 방법: 수동 스크린샷 (마이그레이션 전 commit hash 1개 + 후 1개) 또는 Storybook story `Legacy/{Variant}` 5개 + Chromatic. wrapper-goals.json G-005 AC-006 "C-13 baseline 캡처 — 별도 Goal 의존 (MOD-GRID-17)" → 본 spec 정정 해석: **5 alias 자체 baseline은 G-005 책임, 27 페이지 일괄 baseline은 MOD-GRID-17**. | Section 12 시각 회귀 + AC-006 본문 정정 | C-13/C-17 + wrapper-goals.json AC-006 |
| D10 | **사용처 정합성 — 5 nominal vs 3 actual** (advisor item#1 ★ 핵심). wrapper-goals.json G-005 `affectedUsageFiles` 5 파일 명시지만 Grep 검증: SlipListPage (BaseGrid 2 site), AdminSlipEditPage (BaseGrid 2 site), MenuManagePage (TreeGrid 1 site) **= 3 actual importer**. DailyAttendancePage / AnnualLeaveStatusPage **= raw TanStack `useReactTable` 직접 사용 — 본 Goal alias 미사용 → no-op**. 두 페이지는 MOD-GRID-17 영역 (raw TanStack → `<Grid>` 마이그레이션 별도 Goal). 본 Goal C-19 ≤5 한도 적용 = **3 사용처 변경** (트리비얼 import 경로 변경 — C-19 "트리비얼 ≤10" 예외 해당). | Section 3 + Section 7 행 #11/12/13 (사용처 3 + 2 no-op) + Section 8.1 + Section 8.3 + AC-007 | Grep `BaseGrid\|VirtualGrid\|...` 5 파일 결과 (Section 1 L0 표 인용) + wrapper-goals.json affectedUsageFiles + advisor item#1 |
| D11 | **각 alias props 매핑 — AS-IS 정확 시그니처 + AS-IS 기본값 100% 보존 (C-13 외관 회귀 0)** (advisor item#3 ★ 핵심). 매핑 표 (각 alias):<br>**(a) BaseGrid** — types/tomis/grid.ts `BaseGridProps<TData>` 그대로 import + `<Grid enableSort enableFilter enablePagination={pagination !== undefined} pagination={pagination} rowSelection={rowSelectionOptions} onRowClick onRowDoubleClick loading emptyText className />` (★ pagination conditional — `pagination !== undefined` 조건 BaseGrid:100 패턴 보존)<br>**(b) VirtualGrid** — `BaseGridProps<TData> + rowHeight=40 + containerHeight=500` 시그니처 (VirtualGrid.tsx:17-20) → `<Grid enableSort enableFilter enableVirtualization virtualScrollHeight={containerHeight ?? 500} virtualizerOptions={{ estimateSize: rowHeight ?? 40 }}>` (★ defaults `40/500` 보존, Grid 기본값 `36/400`과 다름 — C-13)<br>**(c) ColumnPinGrid** — `pinLeft: string[] + pinRight: string[] + sort only` (ColumnPinGrid.tsx:14-26) → `<Grid enableSort enableColumnPinning defaultColumnPinning={{ left: pinLeft ?? [], right: pinRight ?? [] }} pagination={pagination} ...>` (★ filter 미wiring — AS-IS 동등)<br>**(d) GroupedHeaderGrid** — `sort only + columns hierarchy 그대로` (GroupedHeaderGrid.tsx:13-24) → `<Grid enableSort columns={columns} pagination={pagination} ...>` (★ filter 미wiring + ColumnDef 그룹 구조 통과)<br>**(e) TreeGrid** — `getSubRows + expandAll + onRowClick` (TreeGrid.tsx:12-22) → `<Grid enableExpanding getSubRows={getSubRows} defaultExpanded={expandAll ? true : {}} onRowClick ...>` (★ D5 `defaultExpanded` 활용) | Section 2.1~2.5 alias별 props 매핑 + Section 11.1 Step 2-6 | 5 variant Read (각 라인 인용) + advisor item#3 |
| D12 | **B-05 (ref API) — N/A** (advisor item#6). AS-IS 5 variant 어느 것도 `forwardRef`/`useImperativeHandle` 미사용 (5 파일 Read 검증). 본 Goal alias는 base wrapper의 ref API 노출 의무 없음 (C-6 호환 — AS-IS 시그니처 그대로 보존). G-004 GridHandle 활용은 MOD-GRID-17 신규 사용처에서 직접 ref 사용 권장 (alias deprecate path와 별개). | Section 2.8 + AC-001 | 5 variant Read (forwardRef/useImperativeHandle 0 hit) + advisor item#6 |
| D13 | **`tsup.config.ts` 변경 — Step 11 내부 작업 (Section 7 별도 행 없음)**. spec 권위: (b) multi-entry — `entry: ['src/index.ts', 'src/legacy/index.ts']`. Section 7 행 #11 (`package.json` MODIFY) Step에 함께 묶음 — 의미상 D8 sub-entry 인프라의 일부 (`exports.”./legacy”` field와 build entry 한 쌍 동작). 본 변경은 별도 새 파일 생성 아님 + 한 줄 entry 배열 변경 — Section 7 14 행 카운트 외 (Step 11 내부 sequence). **Implementer Read-then-decide fallback** (Section 11.3 위험 표): (a) 단일 entry 유지 + `src/index.ts`에서 `export * from './legacy'` — `package.json exports."./legacy"` 가 동일 dist `index.{cjs,mjs,d.ts}`를 가리킴 (subpath import 동작하나 tree-shake 효과 약함). multi-entry 미지원 또는 빌드 실패 시 (a) fallback. | Section 7 행 #11 본문 + Section 11.1 Step 11 + Section 11.3 | D8 + tsup multi-entry 표준 |

---

## Section 1: 참조 추적

### L0: 현 구현 (tw-framework-front 5 variant + 5 사용처 + monorepo G-001~G-004 산출물)

**파일 경로 + Read 확인 (2026-05-14)**:

| 파일 | Read 라인 | 본 G-005 흡수 / 매핑 핵심 |
|------|----------|--------------------------|
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/BaseGrid.tsx` | L1-291 (전체 — 291L) | L13 `BaseGridProps<TData>` import (D11 보존), L18-28 props 시그니처, L29-33 internal state, L97-101 **sort+filter ALWAYS wiring + pagination conditional** (`pagination !== undefined`), L82-91 onSelectionChange 콜백 (rowSelectionOptions 객체 패턴), L108-137 skeleton, L170-178 emptyText, L180-204 row click |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/VirtualGrid.tsx` | L1-220 (전체 — 220L) | L13 `BaseGridProps<TData>` import + L17-20 `VirtualGridProps<TData>` extends (★ `rowHeight?: number; containerHeight?: number`), L31-32 **defaults `rowHeight=40` + `containerHeight=500`** (★ Grid `estimateSize=36`/`virtualScrollHeight=400`과 다름 — C-13 보존 의무), L98-103 useVirtualizer 호출 (G-004 흡수됨), L89-91 sort+filter ALWAYS wiring, L165 virtualRow.index 매핑 (G-004 흡수됨) |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/ColumnPinGrid.tsx` | L1-220 (전체 — 220L) | L14-26 `ColumnPinGridProps<TData>` 시그니처 (★ `pinLeft?: string[]; pinRight?: string[]`), L40 `useState<ColumnPinningState>({ left: pinLeft, right: pinRight })`, L57-59 **sort only wiring** (filter 미wiring — AS-IS 동등 의무), L65-82 manual pinned offset (G-002 흡수됨) |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/GroupedHeaderGrid.tsx` | L1-185 (전체 — 185L) | L13-24 `GroupedHeaderGridProps<TData>` 시그니처 (★ `columns: ColumnDef<TData>[]` — TanStack 그룹 구조 그대로), L51-53 **sort only wiring** (filter 미wiring), L57 `getHeaderGroups()` (placeholder 메커니즘 — TanStack 표준), L75-117 `headerGroup.headers.map` + `header.subHeaders.length` 그룹 헤더 markup |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/TreeGrid.tsx` | L1-175 (전체 — 175L) | L12-22 `TreeGridProps<TData>` 시그니처 (★ `getSubRows?: (row) => TData[] \| undefined; expandAll?: boolean`), L35 `useState<ExpandedState>(initialExpandAll ? true : {})` (★ initial seed 패턴 — D5), L37-46 **expanding only wiring** (sort/filter 미wiring), L41 onExpandedChange + L42 getSubRows + L43 getCoreRowModel + L44 getExpandedRowModel, L48 expandAll/L49 collapseAll 헬퍼, L108-141 row indent (depth × 16px) |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/types/tomis/grid.ts` | L1-71 (전체) | L16-26 `BaseGridProps<TData>` interface (★ D11 — alias signatures import 대상), L11-14 `GridRowSelectionOptions` (★ `mode: 'single' \| 'multi' \| 'none'`), L6-9 `GridPaginationOptions`, L67-70 기존 `TreeGridProps<TData>` interface (재사용 가능) |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/SlipListPage.tsx` | Grep+Read L21,L1024,L1236 | L21 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid'`, L1024-1031 `<BaseGrid<SlipListItem> data columns loading emptyText onRowClick />`, L1236-1243 `<BaseGrid<Slip02ListItem> data columns loading emptyText onRowClick />` (2 site) — **D10 actual importer #1** |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/AdminSlipEditPage.tsx` | Grep+Read L15,L593,L605 | L15 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid'`, L593-599 `<BaseGrid<Slip02ListItem> columns data loading emptyText onRowClick />`, L605-611 동일 (2 site) — **D10 actual importer #2** |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/admin/MenuManagePage.tsx` | Grep+Read L7,L157-164 | L7 `import TreeGrid from '../../../components/tomis/Grid/TreeGrid'`, L157-164 `<TreeGrid data columns getSubRows expandAll={true} loading onRowClick />` (1 site, ★ `expandAll={true}` — D5 핵심) — **D10 actual importer #3** |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/hr/DailyAttendancePage.tsx` | Grep `BaseGrid\|...` 0 hit + Grep `useReactTable` L13 + L461 | **5 variant 미import** — L13 `useReactTable` from `@tanstack/react-table` 직접 사용 (L461 `useReactTable({...})`). **D10 no-op — 본 Goal 미마이그레이션** (MOD-GRID-17 영역) |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/hr/AnnualLeaveStatusPage.tsx` | Grep `BaseGrid\|...` 0 hit + Grep `useReactTable` L14 + L386 | **5 variant 미import** — L14 `useReactTable` from `@tanstack/react-table` 직접 사용 (L386 `useReactTable({...})`). **D10 no-op — 본 Goal 미마이그레이션** (MOD-GRID-17 영역) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/Grid.tsx` | L1-434 (G-001~G-004 산출물) | **D5 MODIFY 대상** — L83 `useState<ExpandedState>({})` → `useState<ExpandedState>(props.defaultExpanded ?? {})` (1줄 변경). 기타 markup 보존 |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` | L1-459 (G-001~G-004 산출물) | **D5 MODIFY 대상** — `GridProps<TData>`에 `defaultExpanded?: ExpandedState \| boolean` 1 prop 추가 (`enableExpanding` 인접). 기존 30 prop 보존 |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` | L1-11 (G-004 산출물) | **D8 MODIFY 대상** — re-export 통합 시 `export * from './legacy'` (또는 명시 5 alias 한 줄씩). 기존 7 export 보존 |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/package.json` | L1-29 (G-001~G-004 산출물) | **D8 MODIFY 대상** — `exports` field에 `"./legacy"` 항목 추가 (`./dist/legacy.cjs`/`./dist/legacy.mjs`/`./dist/legacy.d.ts`). 기존 peer 4종 무수정 |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/useGridImperativeHandle.ts` | L1-156 (G-004 산출물) | L41 `process.env.NODE_ENV` dev guard 패턴 — D3 `useDeprecationWarn` 동일 패턴 차용 |

**핵심 발췌 1 — BaseGrid sort+filter ALWAYS + pagination conditional (BaseGrid.tsx:97-101)** (D11 핵심):

```tsx
getCoreRowModel: getCoreRowModel(),
getSortedRowModel: getSortedRowModel(),       // ★ ALWAYS — alias 매핑 시 enableSort 의무
getFilteredRowModel: getFilteredRowModel(),   // ★ ALWAYS — alias 매핑 시 enableFilter 의무
getPaginationRowModel: pagination !== undefined ? getPaginationRowModel() : undefined,  // ★ conditional
manualPagination: false,
```

→ **D11 BaseGrid 매핑**: `<Grid enableSort enableFilter enablePagination={pagination !== undefined} pagination={pagination} ...>`

**핵심 발췌 2 — VirtualGrid extends BaseGridProps + 다른 defaults (VirtualGrid.tsx:17-32)** (D11 핵심):

```tsx
interface VirtualGridProps<TData> extends BaseGridProps<TData> {
  rowHeight?: number;          // ★ default 40 — Grid estimateSize default 36과 다름
  containerHeight?: number;    // ★ default 500 — Grid virtualScrollHeight default 400과 다름
}

function VirtualGrid<TData extends object>({
  ...,
  rowHeight = DEFAULT_ROW_HEIGHT,    // 40 (L15)
  containerHeight = 500,
}: VirtualGridProps<TData>) {
```

→ **D11 VirtualGrid 매핑**: `<Grid enableSort enableFilter enableVirtualization virtualScrollHeight={containerHeight ?? 500} virtualizerOptions={{ estimateSize: rowHeight ?? 40 }} ...>` (★ AS-IS defaults 보존 — C-13)

**핵심 발췌 3 — ColumnPinGrid pinLeft/pinRight + sort only (ColumnPinGrid.tsx:14-26, 40, 57-59)** (D11 핵심):

```tsx
interface ColumnPinGridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  pinLeft?: string[];       // ★ string[] 시그니처 (Grid defaultColumnPinning은 ColumnPinningState 객체)
  pinRight?: string[];
  pagination?: GridPaginationOptions;
  rowSelection?: GridRowSelectionOptions;
  onRowClick?: (row: TData) => void;
  ...
}
// L40
const [columnPinning] = useState<ColumnPinningState>({ left: pinLeft, right: pinRight });
// L57-59
getCoreRowModel: getCoreRowModel(),
getSortedRowModel: getSortedRowModel(),    // ★ sort only — filter 미wiring (BaseGrid와 다름)
```

→ **D11 ColumnPinGrid 매핑**: `<Grid enableSort enableColumnPinning defaultColumnPinning={{ left: pinLeft ?? [], right: pinRight ?? [] }} pagination={pagination} ...>` (★ filter 미wiring — AS-IS 동등 의무)

**핵심 발췌 4 — GroupedHeaderGrid columns hierarchy + sort only (GroupedHeaderGrid.tsx:13-24, 51-53)** (D11 핵심 + D6):

```tsx
interface GroupedHeaderGridProps<TData> {
  data: TData[];
  // Pass grouped column definitions using TanStack Table's native column grouping
  // Use { header: 'Group', columns: [...leafColumns] } structure for grouping
  columns: ColumnDef<TData>[];   // ★ TanStack 그룹 구조 그대로 — G-001 buildTableOptions 무수정 통과
  ...
}
// L51-53
getCoreRowModel: getCoreRowModel(),
getSortedRowModel: getSortedRowModel(),    // ★ sort only — filter 미wiring
```

→ **D11 GroupedHeaderGrid 매핑**: `<Grid enableSort columns={columns} pagination={pagination} ...>` (★ ColumnDef hierarchy 그대로 통과 — G-001 흡수됨; D6 — MOD-GRID-14 enhancement 후속)

**핵심 발췌 5 — TreeGrid getSubRows + expandAll initial seed (TreeGrid.tsx:12-22, 35-46)** (D11 + D5 핵심):

```tsx
interface TreeGridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  getSubRows?: (row: TData) => TData[] | undefined;
  expandAll?: boolean;
  onRowClick?: (row: TData) => void;
  ...
}
// L35
const [expanded, setExpanded] = useState<ExpandedState>(initialExpandAll ? true : {});  // ★ initial seed
// L37-46
const table = useReactTable({
  data, columns,
  state: { expanded },
  onExpandedChange: setExpanded,
  getSubRows,
  getCoreRowModel: getCoreRowModel(),
  getExpandedRowModel: getExpandedRowModel(),   // ★ expanding only — sort/filter 미wiring
  autoResetExpanded: false,
});
```

→ **D11 TreeGrid 매핑**: `<Grid enableExpanding getSubRows={getSubRows} defaultExpanded={expandAll ? true : {}} onRowClick ...>` (★ D5 — `defaultExpanded` prop 신규 의무, Grid.tsx:83 + types.ts MODIFY)

**핵심 발췌 6 — MenuManagePage TreeGrid `expandAll={true}` 사용 (MenuManagePage.tsx:157-164)** (D5 핵심):

```tsx
<TreeGrid
  data={menuTree}
  columns={columns}
  getSubRows={(row) => row.children}
  expandAll={true}                  // ★ true 전달 — 외관: 전체 트리 펼침. D5 부재 시 회귀
  loading={loading}
  onRowClick={(row) => setSelected(row)}
/>
```

→ **D5 정합성**: 본 G-005가 `defaultExpanded` 미도입 시 alias 매핑이 무력화 (`expandAll={true}` → useState 초기값 `{}` 강제 → 외관 회귀 — 트리 접힘). C-13 위반.

### L1: TanStack v8 표준 API

**파일 + Read 확인**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/tanstack-api-inventory.md` §3 (TableOptions) + §4 (Expanded state).

핵심 시그니처 (본 G-005 alias 매핑 시 사용):

```ts
// G-001~G-004 GridProps에 이미 노출된 enable* 토글
enableSort?: boolean;
enableFilter?: boolean;
enablePagination?: boolean;
enableColumnPinning?: boolean;
enableExpanding?: boolean;       // G-001 buildTableOptions:174
enableVirtualization?: boolean;  // G-004 D6

// ExpandedState (TanStack)
type ExpandedState = true | Record<string, boolean>;   // ★ true = 전체 펼침, {} = 전체 접힘 — D5
```

본 G-005 alias 매핑은 위 표준 prop만 사용 — private API 접근 0 (C-2 준수).

### L2: 8 variant 공통 패턴 (DRY 추출)

**파일 + Read 확인**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/current-tanstack-analysis.md` §3 + §5.

| 중복 패턴 | 사용 variant | G-005에서 흡수 |
|----------|------------|----------------|
| `useReactTable` + `flexRender` | 8/8 (전체) | ✅ G-001~G-004 base wrapper로 흡수됨 — alias는 props 매핑만 |
| sort+filter ALWAYS wiring | 2/8 (BaseGrid + VirtualGrid) | ✅ alias에서 `enableSort enableFilter` 명시 |
| sort only wiring | 2/8 (ColumnPinGrid + GroupedHeaderGrid) | ✅ alias에서 `enableSort` 단독 명시 |
| expanding only wiring | 1/8 (TreeGrid) | ✅ alias에서 `enableExpanding` + D5 `defaultExpanded` |
| pagination conditional (`pagination !== undefined`) | 4/8 (BaseGrid + ColumnPinGrid + GroupedHeaderGrid + ChangeTrackingGrid via 흡수 안 함) | ✅ alias에서 `enablePagination={pagination !== undefined}` |
| `useState<ExpandedState>(initial ? true : {})` initial seed | 1/8 (TreeGrid only) | ✅ G-005에서 base wrapper에 `defaultExpanded` prop 신규 (D5) |

### L3: 영향 사용처

본 G-005는 **5 alias 컴포넌트 + 사용처 첫 마이그레이션** — `affectedUsageFiles: 5` (wrapper-goals.json L295-300). **D10 actual = 3** (DailyAttendance/AnnualLeaveStatus는 raw TanStack — 본 Goal 무관).

| 페이지 | alias | 본 Goal 액션 |
|-------|-------|------------|
| `tw-framework-front/src/pages/tomis/account/SlipListPage.tsx` | BaseGrid (L21 import + L1024 + L1236 — 2 site) | import 경로만 변경 (`from '@tomis/grid-core/legacy'`) — props 호환 |
| `tw-framework-front/src/pages/tomis/account/AdminSlipEditPage.tsx` | BaseGrid (L15 import + L593 + L605 — 2 site) | import 경로만 변경 — props 호환 |
| `tw-framework-front/src/pages/tomis/admin/MenuManagePage.tsx` | TreeGrid (L7 import + L157 — 1 site) | import 경로만 변경 — props 호환 (★ D5 필수 — `expandAll={true}` 외관 보존) |
| `tw-framework-front/src/pages/tomis/hr/DailyAttendancePage.tsx` | (5 variant 미사용 — raw TanStack) | **no-op** — MOD-GRID-17 영역 (raw → `<Grid>`) |
| `tw-framework-front/src/pages/tomis/hr/AnnualLeaveStatusPage.tsx` | (5 variant 미사용 — raw TanStack) | **no-op** — MOD-GRID-17 영역 (raw → `<Grid>`) |

추가 후속 (참고 — 본 Goal 범위 외):
- MOD-GRID-17 27 페이지 점진 마이그레이션 — 동일 alias 활용 + 또는 직접 `<Grid>` 마이그레이션
- MOD-GRID-10 ChangeTrackingGrid alias — 자체 모듈 (본 G-005 5 alias 외)
- MOD-GRID-11 RangeSelectGrid alias — 자체 모듈 (본 G-005 5 alias 외)
- MOD-GRID-14 GroupedHeaderGrid enhancement — D6 결정 (basic shim 본 Goal + enhancement 후속)

### R-A: AG Grid 패턴 (참조 — C-7 코드 차용 금지)

**N/A** — 본 G-005는 alias compatibility shim. AG Grid 동등 alias 패턴 없음 (AG는 단일 `<AgGridReact>` API). publish는 별도 트랙 (publish 자체 AG Grid 마이그레이션은 publish 책임).

### R-W: Wijmo 패턴 (참조 — C-16 import 금지)

**N/A** — 본 G-005는 alias compatibility shim. Wijmo `<FlexGrid>` 단일 host 패턴 — alias 개념 없음.

### migrationImpact: high (사유)

본 G-005는 **첫 사용처 직접 마이그레이션 Goal** — wrapper 모듈 5/5 종결 + 5 alias 신규 export + 3 사용처 import 경로 변경. C-13 baseline 캡처 의무 + C-17 시각 회귀 검증 의무.

→ canonical-modules.json L72 `migrationImpact: high` 일치.

---

## Section 2: API 계약 (TypeScript)

### 2.1 BaseGrid alias (NEW — `legacy/BaseGrid.tsx`)

**파일 위치**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/legacy/BaseGrid.tsx` (NEW — D2)

```tsx
import type { BaseGridProps } from '@tomis/grid-core/legacy/types';   // re-export 또는 inline
import { Grid } from '../Grid';
import { useDeprecationWarn } from './useDeprecationWarn';

/**
 * BaseGrid — DEPRECATED alias of `<Grid>` (D11 props mapping).
 *
 * @deprecated 1 minor 버전 후 다음 major 에서 제거 (C-23). `<Grid>` 직접 사용 권장.
 * Migration: `<Grid enableSort enableFilter enablePagination={pagination !== undefined} pagination={pagination} ...>`
 *
 * @see G-005-spec.md Section 2.1 + D11
 */
export function BaseGrid<TData extends object>(props: BaseGridProps<TData>): JSX.Element {
  useDeprecationWarn('BaseGrid');   // D3/D4 — dev mode 1회 console.warn
  return (
    <Grid<TData>
      data={props.data}
      columns={props.columns}
      enableSort                                                  // ★ AS-IS L98 ALWAYS
      enableFilter                                                // ★ AS-IS L99 ALWAYS
      enablePagination={props.pagination !== undefined}           // ★ AS-IS L100 conditional
      pagination={props.pagination}
      rowSelection={props.rowSelection}
      onRowClick={props.onRowClick}
      onRowDoubleClick={props.onRowDoubleClick}
      loading={props.loading}
      emptyText={props.emptyText}
      className={props.className}
    />
  );
}
```

### 2.2 VirtualGrid alias (NEW — `legacy/VirtualGrid.tsx`)

**파일 위치**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/legacy/VirtualGrid.tsx` (NEW — D2)

```tsx
import type { BaseGridProps } from '@tomis/grid-core/legacy/types';
import { Grid } from '../Grid';
import { useDeprecationWarn } from './useDeprecationWarn';

/**
 * VirtualGridProps — AS-IS shape 보존 (VirtualGrid.tsx L17-20).
 */
export interface VirtualGridProps<TData> extends BaseGridProps<TData> {
  rowHeight?: number;        // default 40 — AS-IS L31 (Grid estimateSize 36과 다름)
  containerHeight?: number;  // default 500 — AS-IS L32 (Grid virtualScrollHeight 400과 다름)
}

/**
 * VirtualGrid — DEPRECATED alias of `<Grid enableVirtualization>` (D11).
 *
 * @deprecated 1 minor 버전 후 제거 (C-23). `<Grid enableVirtualization virtualScrollHeight virtualizerOptions ...>` 직접 사용.
 *
 * @see G-005-spec.md Section 2.2 + D11
 */
export function VirtualGrid<TData extends object>(props: VirtualGridProps<TData>): JSX.Element {
  useDeprecationWarn('VirtualGrid');
  return (
    <Grid<TData>
      data={props.data}
      columns={props.columns}
      enableSort                                                  // ★ AS-IS L90
      enableFilter                                                // ★ AS-IS L91
      enableVirtualization                                        // ★ G-004 wiring
      virtualScrollHeight={props.containerHeight ?? 500}          // ★ AS-IS default 보존 (D11)
      virtualizerOptions={{ estimateSize: props.rowHeight ?? 40 }}  // ★ AS-IS default 보존 (D11)
      rowSelection={props.rowSelection}
      onRowClick={props.onRowClick}
      onRowDoubleClick={props.onRowDoubleClick}
      loading={props.loading}
      emptyText={props.emptyText}
      className={props.className}
    />
  );
}
```

### 2.3 ColumnPinGrid alias (NEW — `legacy/ColumnPinGrid.tsx`)

**파일 위치**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/legacy/ColumnPinGrid.tsx` (NEW — D2)

```tsx
import type { ColumnDef } from '@tanstack/react-table';
import type { GridPaginationOptions, GridRowSelectionOptions } from '../types';
import { Grid } from '../Grid';
import { useDeprecationWarn } from './useDeprecationWarn';

/**
 * ColumnPinGridProps — AS-IS shape 보존 (ColumnPinGrid.tsx L14-26).
 */
export interface ColumnPinGridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  pinLeft?: string[];
  pinRight?: string[];
  pagination?: GridPaginationOptions;
  rowSelection?: GridRowSelectionOptions<TData>;
  onRowClick?: (row: TData) => void;
  loading?: boolean;
  emptyText?: string;
  className?: string;
}

/**
 * ColumnPinGrid — DEPRECATED alias of `<Grid enableColumnPinning>` (D11).
 *
 * @deprecated 1 minor 버전 후 제거 (C-23).
 * Migration: `<Grid enableSort enableColumnPinning defaultColumnPinning={{ left, right }} ...>`
 *
 * @see G-005-spec.md Section 2.3 + D11
 */
export function ColumnPinGrid<TData extends object>(props: ColumnPinGridProps<TData>): JSX.Element {
  useDeprecationWarn('ColumnPinGrid');
  return (
    <Grid<TData>
      data={props.data}
      columns={props.columns}
      enableSort                                                          // ★ AS-IS L58 sort only
      enableColumnPinning                                                 // ★ G-002 wiring
      defaultColumnPinning={{ left: props.pinLeft ?? [], right: props.pinRight ?? [] }}  // ★ pinLeft/pinRight → ColumnPinningState 변환 (D11)
      enablePagination={props.pagination !== undefined}                   // ★ AS-IS L59 conditional
      pagination={props.pagination}
      rowSelection={props.rowSelection}
      onRowClick={props.onRowClick}
      loading={props.loading}
      emptyText={props.emptyText}
      className={props.className}
    />
  );
}
```

### 2.4 GroupedHeaderGrid alias (NEW — `legacy/GroupedHeaderGrid.tsx`)

**파일 위치**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/legacy/GroupedHeaderGrid.tsx` (NEW — D2)

```tsx
import type { ColumnDef } from '@tanstack/react-table';
import type { GridPaginationOptions, GridRowSelectionOptions } from '../types';
import { Grid } from '../Grid';
import { useDeprecationWarn } from './useDeprecationWarn';

/**
 * GroupedHeaderGridProps — AS-IS shape 보존 (GroupedHeaderGrid.tsx L13-24).
 *
 * `columns` 는 TanStack 표준 그룹 구조 (`{ header, columns: [...leaf] }`) 그대로 전달 —
 * G-001 buildTableOptions 가 그룹 ColumnDef 를 무수정 통과 (TanStack 내부 placeholder 메커니즘).
 *
 * @remarks
 * D6: 본 alias 는 basic compatibility shim. enhanced grouping API
 * (`createColumnGroup` helper, sticky group header, 자식 visibility 토글) 는 MOD-GRID-14 후속.
 */
export interface GroupedHeaderGridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  pagination?: GridPaginationOptions;
  rowSelection?: GridRowSelectionOptions<TData>;
  onRowClick?: (row: TData) => void;
  loading?: boolean;
  emptyText?: string;
  className?: string;
}

/**
 * GroupedHeaderGrid — DEPRECATED alias (D11). MOD-GRID-14 enhancement 후속 (D6).
 *
 * @deprecated 1 minor 버전 후 제거 (C-23) — MOD-GRID-14 enhanced API 권장.
 *
 * @see G-005-spec.md Section 2.4 + D6/D11
 */
export function GroupedHeaderGrid<TData extends object>(props: GroupedHeaderGridProps<TData>): JSX.Element {
  useDeprecationWarn('GroupedHeaderGrid');
  return (
    <Grid<TData>
      data={props.data}
      columns={props.columns}                                  // ★ TanStack 그룹 ColumnDef 그대로 통과
      enableSort                                               // ★ AS-IS L52 sort only
      enablePagination={props.pagination !== undefined}        // ★ AS-IS L53 conditional
      pagination={props.pagination}
      rowSelection={props.rowSelection}
      onRowClick={props.onRowClick}
      loading={props.loading}
      emptyText={props.emptyText}
      className={props.className}
    />
  );
}
```

### 2.5 TreeGrid alias (NEW — `legacy/TreeGrid.tsx`) ★ D5 핵심

**파일 위치**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/legacy/TreeGrid.tsx` (NEW — D2)

```tsx
import type { ColumnDef } from '@tanstack/react-table';
import { Grid } from '../Grid';
import { useDeprecationWarn } from './useDeprecationWarn';

/**
 * TreeGridProps — AS-IS shape 보존 (TreeGrid.tsx L12-22).
 */
export interface TreeGridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  getSubRows?: (row: TData) => TData[] | undefined;
  expandAll?: boolean;
  onRowClick?: (row: TData) => void;
  loading?: boolean;
  emptyText?: string;
  className?: string;
}

/**
 * TreeGrid — DEPRECATED alias of `<Grid enableExpanding>` (D11) + `defaultExpanded` (D5).
 *
 * @deprecated 1 minor 버전 후 제거 (C-23).
 * Migration: `<Grid enableExpanding getSubRows defaultExpanded={true} ...>`.
 *
 * @remarks
 * D5: `expandAll={true}` → `defaultExpanded={true}` (TanStack ExpandedState `true` = 전체 펼침).
 * `expandAll` 미지정/false → `defaultExpanded={{}}`.
 *
 * @see G-005-spec.md Section 2.5 + D5/D11
 */
export function TreeGrid<TData extends object>(props: TreeGridProps<TData>): JSX.Element {
  useDeprecationWarn('TreeGrid');
  return (
    <Grid<TData>
      data={props.data}
      columns={props.columns}
      enableExpanding                                             // ★ G-001 buildTableOptions:174 (이미 enableExpanding wiring)
      {...(props.getSubRows ? { getSubRows: props.getSubRows } : {})}
      defaultExpanded={props.expandAll ? true : {}}               // ★ D5 — 신규 prop. AS-IS TreeGrid:35 initial seed 패턴 보존
      onRowClick={props.onRowClick}
      loading={props.loading}
      emptyText={props.emptyText}
      className={props.className}
    />
  );
}
```

### 2.6 useDeprecationWarn hook (NEW — `legacy/useDeprecationWarn.ts`) ★ D3 핵심

**파일 위치**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/legacy/useDeprecationWarn.ts` (NEW — D2/D3)

```ts
import { useEffect, useRef } from 'react';

// useGridImperativeHandle.ts:41 패턴 — `@types/node` 미설치 환경 대비 minimal declare
declare const process: { env: { NODE_ENV?: string } } | undefined;

/**
 * `useDeprecationWarn(name)` — 5 legacy alias 공통 dev mode 1회 console.warn (D3/D4).
 *
 * @remarks
 * - dev mode 1회 (`useRef` guard) — StrictMode 2회 effect + HMR re-mount 시도 폭주 차단.
 * - production silent (`process.env.NODE_ENV === 'production'` skip).
 * - 메시지 형식: `[tomis/grid-core] {name} is deprecated, migrate to <Grid>. See migration guide.`
 *
 * @see G-005-spec.md Section 2.6 + D3/D4
 */
export function useDeprecationWarn(name: string): void {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    if (typeof process === 'undefined' || process.env.NODE_ENV === 'production') return;
    fired.current = true;
    console.warn(
      `[tomis/grid-core] ${name} is deprecated, migrate to <Grid>. See migration guide at https://docs.tomis.dev/grid-core/migration.`,
    );
  }, []);
  // deps 의도적 비움 — name 고정 + mount 1회 (eslint disable 명시)
  // eslint-disable-next-line react-hooks/exhaustive-deps
}
```

### 2.7 legacy/index.ts re-export (NEW — `legacy/index.ts`)

**파일 위치**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/legacy/index.ts` (NEW — D2/D8)

```ts
/**
 * `@tomis/grid-core/legacy` sub-entry — 5 alias re-export (D8 — tree-shake + import 경로 명확).
 *
 * @deprecated 1 minor 버전 후 다음 major 에서 제거 (C-23).
 *
 * @see G-005-spec.md Section 2.7 + D8
 */
export { BaseGrid } from './BaseGrid';
export type { BaseGridProps } from '../types';   // 또는 ../../types/legacy 위치 결정 (Implementer 선택)
export { VirtualGrid, type VirtualGridProps } from './VirtualGrid';
export { ColumnPinGrid, type ColumnPinGridProps } from './ColumnPinGrid';
export { GroupedHeaderGrid, type GroupedHeaderGridProps } from './GroupedHeaderGrid';
export { TreeGrid, type TreeGridProps } from './TreeGrid';
export { useDeprecationWarn } from './useDeprecationWarn';
```

### 2.8 src/index.ts MODIFY — re-export 통합 (D8)

**파일 위치**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` (MODIFY — D2/D8)

After:

```ts
// @tomis/grid-core — public API (MOD-GRID-01 / G-001 + G-002 + G-003 + G-004 + G-005).
export { Grid } from './Grid';
export type {
  GridProps,
  GridRowSelectionOptions,
  GridPaginationOptions,
  RowSelectionMode,
  GridColumnResizeMode,
  GridHandle,
  GridScrollToOptions,
} from './types';

// G-005 (D8): legacy alias 5종 — main entry 경유 호환 (`/legacy` sub-entry 권장)
export {
  BaseGrid,
  VirtualGrid, type VirtualGridProps,
  ColumnPinGrid, type ColumnPinGridProps,
  GroupedHeaderGrid, type GroupedHeaderGridProps,
  TreeGrid, type TreeGridProps,
} from './legacy';
export type { BaseGridProps } from './types';   // ★ G-001~G-004 미존재 시 신규 추가 위치 결정 (Implementer)
```

### 2.9 BaseGridProps export 위치 결정

**3 옵션** (Implementer 결정 — Section 11.3 위험 표):

(a) 새 `src/types.ts` 에 `BaseGridProps<TData>` 신규 추가 (★ wrapper-goals.json AC-005 — 기존 BaseGridProps 인터페이스 export 보존)
(b) `src/legacy/types.ts` NEW 파일 생성 (Section 7 행 변경)
(c) tw-framework-front `src/types/tomis/grid.ts` 의 `BaseGridProps<TData>` import (★ TOMIS git 의존성 — monorepo 외부 의존 부적합)

**채택**: **(a)** — `src/types.ts` 에 `BaseGridProps<TData>` interface 신규 추가 (AS-IS `tw-framework-front/src/types/tomis/grid.ts:16-26` 시그니처 동일 복사). monorepo 자체 호환 유지.

### 2.10 ref/imperative 방침 (B-05)

**N/A** (D12) — AS-IS 5 variant 어느 것도 forwardRef/useImperativeHandle 미사용. alias 자체는 ref API 노출 의무 없음 (C-6 호환).

신규 사용처(MOD-GRID-17)에서 `<Grid ref>` 직접 사용은 G-004 GridHandle 활용 — alias deprecate path와 별개.

### 2.11 사용 예시 (≥2)

**Example 1 — 기본 (BaseGrid alias 신규 import 경로)**:

```tsx
import { BaseGrid } from '@tomis/grid-core/legacy';   // ★ /legacy sub-entry (D8)
// 또는 import { BaseGrid } from '@tomis/grid-core';  // main entry 도 호환

interface User { id: number; name: string; }

<BaseGrid<User>
  data={users}
  columns={columns}
  pagination={{ pageSize: 20 }}
  rowSelection={{ mode: 'single', onSelectionChange: (rows) => console.log(rows) }}
  onRowClick={(row) => console.log(row)}
/>;
// → 내부 <Grid enableSort enableFilter enablePagination ...>
// → mount 시 dev console.warn 1회: 'BaseGrid is deprecated, migrate to <Grid>'
```

**Example 2 — TreeGrid alias (`expandAll={true}` D5 핵심)**:

```tsx
import { TreeGrid } from '@tomis/grid-core/legacy';

interface Dept { id: number; name: string; children?: Dept[]; }

<TreeGrid
  data={deptTree}
  columns={columns}
  getSubRows={(row) => row.children}
  expandAll={true}                       // ★ D5 — defaultExpanded={true} 매핑
  onRowClick={(row) => setSelected(row)}
/>;
// → 내부 <Grid enableExpanding getSubRows defaultExpanded={true} ...>
// → 마운트 시 전체 트리 펼침 외관 보존 (C-13)
```

**Example 3 — ColumnPinGrid alias (pinLeft/pinRight 매핑)**:

```tsx
import { ColumnPinGrid } from '@tomis/grid-core/legacy';

<ColumnPinGrid
  data={rows}
  columns={columns}
  pinLeft={['empNo', 'name']}      // string[]
  pinRight={['action']}
  pagination={{ pageSize: 20 }}
/>;
// → 내부 <Grid enableSort enableColumnPinning defaultColumnPinning={{ left: ['empNo','name'], right: ['action'] }} ...>
```

---

## Section 3: 기존 사용처 대응표 (Variant → 신규 API + 사용처 정합성 D10)

| 사용처 파일 | 사용 alias | 변경 라인 | 본 Goal 마이그레이션 액션 | D10 |
|------------|----------|----------|------------------------|-----|
| `tw-framework-front/src/pages/tomis/account/SlipListPage.tsx` | BaseGrid (L21 import + L1024,L1236 — 2 site) | L21 import 경로만 변경 | `from '../../../components/tomis/Grid/BaseGrid'` → `from '@tomis/grid-core/legacy'` (named import) — JSX 무수정 | actual #1 |
| `tw-framework-front/src/pages/tomis/account/AdminSlipEditPage.tsx` | BaseGrid (L15 import + L593,L605 — 2 site) | L15 import 경로만 변경 | 동일 패턴 — named import 변경 + JSX 무수정 | actual #2 |
| `tw-framework-front/src/pages/tomis/admin/MenuManagePage.tsx` | TreeGrid (L7 import + L157 — 1 site) | L7 import 경로만 변경 | `from '../../../components/tomis/Grid/TreeGrid'` → `from '@tomis/grid-core/legacy'` (named import) — JSX 무수정 (★ `expandAll={true}` 보존, D5) | actual #3 |
| `tw-framework-front/src/pages/tomis/hr/DailyAttendancePage.tsx` | (5 variant 미사용 — raw TanStack `useReactTable`) | 본 Goal 무변경 | **no-op** — MOD-GRID-17 영역 (raw → `<Grid>` 마이그레이션) | nominal-only |
| `tw-framework-front/src/pages/tomis/hr/AnnualLeaveStatusPage.tsx` | (5 variant 미사용 — raw TanStack `useReactTable`) | 본 Goal 무변경 | **no-op** — MOD-GRID-17 영역 | nominal-only |

| 기존 variant component (5 alias 본체) | 신규 G-005 API | 마이그레이션 액션 | 담당 Goal |
|----------|---------------|-------------------|----------|
| `BaseGrid.tsx` (L18-291, BaseGridProps + sort+filter+pagination wiring) | `legacy/BaseGrid.tsx` alias → `<Grid enableSort enableFilter enablePagination={pagination !== undefined}>` | (a) G-005 alias 제공 + 3 사용처 import 경로 변경 (b) 1 minor 후 alias 제거 + tw-framework-front 본체 파일도 별도 정리 (c) MOD-GRID-17 27 페이지 점진 직접 `<Grid>` 마이그레이션 | G-005 + MOD-GRID-17 |
| `VirtualGrid.tsx` (L17-220, BaseGridProps extend + rowHeight/containerHeight defaults) | `legacy/VirtualGrid.tsx` alias → `<Grid enableVirtualization virtualScrollHeight={containerHeight ?? 500} virtualizerOptions={{estimateSize: rowHeight ?? 40}}>` (★ AS-IS defaults 보존 D11) | 본 Goal alias 제공 (사용처 0 — 27 페이지 중 VirtualGrid 사용처 미식별) — 잠재 후속 사용처는 MOD-GRID-17 | G-005 (alias 정의) |
| `ColumnPinGrid.tsx` (L14-220, pinLeft/pinRight + sort only) | `legacy/ColumnPinGrid.tsx` alias → `<Grid enableSort enableColumnPinning defaultColumnPinning={{left:pinLeft, right:pinRight}}>` (★ filter 미wiring D11) | 본 Goal alias 제공 (사용처 0 — 27 페이지 중 ColumnPinGrid 사용처 미식별) | G-005 (alias 정의) |
| `GroupedHeaderGrid.tsx` (L13-185, ColumnDef hierarchy + sort only) | `legacy/GroupedHeaderGrid.tsx` alias → `<Grid enableSort columns={columns}>` (★ TanStack 그룹 ColumnDef 그대로 통과 D11; basic shim D6) | 본 Goal basic shim 제공 + MOD-GRID-14 enhancement 후속 (createColumnGroup helper 등) | G-005 + MOD-GRID-14 |
| `TreeGrid.tsx` (L12-175, getSubRows + expandAll initial seed) | `legacy/TreeGrid.tsx` alias → `<Grid enableExpanding getSubRows defaultExpanded={expandAll ? true : {}}>` (★ D5 `defaultExpanded` 신규) | 본 Goal alias 제공 + 1 사용처 (MenuManagePage) import 경로 변경 + Grid.tsx + types.ts MODIFY (`defaultExpanded` prop 신규) | G-005 |
| `ChangeTrackingGrid.tsx`/`RangeSelectGrid.tsx`/`EditableGrid.tsx` (8 variant 중 나머지 3) | (본 Goal 범위 외 — AC-004 명시) | MOD-GRID-10 ChangeTrackingGrid alias / MOD-GRID-11 RangeSelectGrid alias / MOD-GRID-05 EditableGrid 흡수 | MOD-GRID-10/11/05 |

**본 G-005 직접 영향**: 3 사용처 import 경로 변경 + 5 alias 신규 + 2 사용처 no-op (D10).

---

## Section 4: 호환성 정책

| 항목 | 값 | 근거 |
|------|----|------|
| **breaking** | **false** | 5 alias 모두 AS-IS props 시그니처 100% 보존 (D11). 사용처 import 경로 변경은 트리비얼 (named import 경로만 — JSX 무수정). G-001~G-004 base wrapper API 무파괴. wrapper-goals.json G-005 `compatibilityPolicy.breaking: false` 일치. |
| **deprecationStrategy** | "1 minor 버전 alias 유지 (C-23), 다음 major 에서 제거" | wrapper-goals.json G-005 L283 + AC-002 + Section 2 deprecate JSDoc + dev console.warn 1회 (D3) |
| **migrationPath** | "각 alias 의 codemod 표 — MOD-GRID-99-B G-004 docs 참조" | wrapper-goals.json G-005 L284 — 본 Goal 사용자에게 `<Grid enable*>` 직접 마이그레이션 권장 (Section 2 예시) |
| **peerDependencies (C-22)** | 변경 없음 — 4 peer 그대로 (G-001~G-004 동일) | grid-core/package.json L23-28 |
| **devDependencies (workspace root)** | 변경 없음 — `@tanstack/react-virtual` G-004 시점 설치됨 | G-004 ADR-005 |
| **package.json `exports` field** | **MODIFY** — `"./legacy"` sub-entry 추가 (D8) | C-22 + D8 |
| **semver (C-23)** | `version: "0.0.0"` 유지 (1.0 전 — Changesets는 MOD-GRID-00 G-002 범위). G-005는 internal 신규 + MODIFY 누적 — 1.0 release까지 free patch 영역. 단 release 시점에 alias deprecate JSDoc 명기 의무 | grid-core/package.json:3 + C-23 |
| **외부 라이브러리 ADR (C-20)** | **N/A** — 신규 dependency/peer 추가 0건 (alias compat shim, 신규 외부 의존 없음). 단 D8 sub-entry 분리 정책은 ADR-MOD-GRID-01-006 후속 작성 권장 (Section 13) | C-20 + D8 |

**주의 사항** (D5 `defaultExpanded` prop 신규):
- types.ts MODIFY 1 prop 추가 — 기존 `enableExpanding` 인접. 기존 30 prop optional 보존 (backward compatible).
- Grid.tsx MODIFY L83 `useState<ExpandedState>(props.defaultExpanded ?? {})` — 기존 호출 사이트 (`defaultExpanded` 미전달) 동작 0 변화.

**주의 사항** (D11 VirtualGrid defaults 보존):
- AS-IS `rowHeight=40, containerHeight=500` vs Grid `estimateSize=36, virtualScrollHeight=400`. alias 매핑이 AS-IS defaults 명시 의무 — 누락 시 외관 회귀 (C-13).

---

## Section 5: 인수 기준 (출처 태그 100% — H-03)

| ID | 기준 | 검증 방법 | 출처 |
|----|------|----------|------|
| AC-001 | `BaseGrid`, `VirtualGrid`, `ColumnPinGrid`, `GroupedHeaderGrid`, `TreeGrid` 5개 함수 컴포넌트 export — 시그니처는 기존 `BaseGridProps/VirtualGridProps/...` 동일 (D11). C-4 strict — `any` 0건. | `import { BaseGrid, VirtualGrid, ColumnPinGrid, GroupedHeaderGrid, TreeGrid } from '@tomis/grid-core/legacy'` 0 error + grep `: any\|as any` 0 hit | C-6 + C-4 + D11 (wrapper-goals.json AC-001) |
| AC-002 | 각 alias 가 내부에서 `<Grid enable* />` 매핑 (Section 2.1~2.5 명세 정확). BaseGrid → `enableSort enableFilter enablePagination={pagination !== undefined}` (★ AS-IS conditional 보존). VirtualGrid → `enableVirtualization virtualScrollHeight={containerHeight ?? 500} virtualizerOptions={{estimateSize: rowHeight ?? 40}}` (★ AS-IS defaults). ColumnPinGrid → `enableSort enableColumnPinning defaultColumnPinning={{left: pinLeft, right: pinRight}}` (★ sort only). GroupedHeaderGrid → `enableSort` (★ basic shim, D6). TreeGrid → `enableExpanding getSubRows defaultExpanded={expandAll ? true : {}}` (★ D5). | Read 5 alias 파일 + Section 2 명세 cross-check | C-6 + D5 + D11 (wrapper-goals.json AC-002) |
| AC-003 | 개발 모드 1회 `console.warn` — `useDeprecationWarn(name)` hook 5 alias 호출 (`useEffect once + useRef guard`, D3/D4). production silent. StrictMode + HMR 호환. | grep `useDeprecationWarn` count = 5 (5 alias 모두 호출) + 단위 테스트 (StrictMode 2회 effect 시 1회만 console.warn) | C-23 + D3/D4 (wrapper-goals.json AC-003) |
| AC-004 | MOD-GRID-10 ChangeTrackingGrid / MOD-GRID-11 RangeSelectGrid / MOD-GRID-05 EditableGrid alias 는 해당 모듈에서 — 본 Goal 범위 외 명시. **MOD-GRID-14 GroupedHeaderGrid 는 D6 결정 — 본 G-005 basic shim + MOD-GRID-14 enhancement 후속 (semver minor — backward-compatible 확장)**. | Section 3 표 + Section 4 호환성 표 + D6 본문 | L0 + D6 (wrapper-goals.json AC-004 정정 해석) |
| AC-005 | 기존 `BaseGridProps` 인터페이스 export 보존 — `src/types.ts` MODIFY 추가 (D11 + Section 2.9). monorepo 내 alias 호환 — tw-framework-front 외부 의존 0 (D11). | `import type { BaseGridProps } from '@tomis/grid-core'` 0 error | C-6 + D11 (wrapper-goals.json AC-005) |
| AC-006 | C-13: 영향 사용처 3 페이지 (D10 actual) 시각 회귀 baseline 캡처 — 본 Goal에서 **즉시 캡처** (D9). MOD-GRID-17 27 페이지 baseline은 별도 Goal 책임. 본 G-005 baseline 방법: (a) 수동 스크린샷 (마이그레이션 전 commit hash + 후 commit hash 1쌍, 동일 데이터) 또는 (b) Storybook story `Legacy/{Variant}` 5개 + Chromatic. | baseline 스크린샷 N=3 (3 사용처) 또는 Storybook stories 5개 존재 | C-13/C-17 + D9 (wrapper-goals.json AC-006 정정 해석) |
| AC-007 | 사용처 마이그레이션 — D10 actual 3 페이지 (≤5 한도, C-19). DailyAttendance/AnnualLeaveStatus는 raw TanStack 사용으로 본 Goal no-op (MOD-GRID-17 영역). 마이그레이션 후 tsc 0 error (`pnpm --filter tw-framework-front typecheck` exit 0). | `git diff` 3 파일 import 라인 변경만 검증 + tsc exit 0 | C-19 + D10 (advisor item#1) |
| AC-008 | C-21: `pnpm size-limit` `@tomis/grid-core` ≤ 30 KB brotli 통과. 누적 G-001~G-004 = 24.21 KB / 30 KB (실측 ADR-005). G-005 예상 +5 KB → 누적 29.21 KB (여유 0.79 KB). 측정 후 > 28.5 KB 시 `/legacy` sub-entry 강제 분리 (D7). | size-limit run + JSON 파싱 + 누적 KB 검증 | C-21 + D7 (advisor item#5) |
| AC-009 | C-1 보존 (G-001~G-004 산출물 무파괴): Grid.tsx D5 변경은 L83 1줄만 (`useState<ExpandedState>({})` → `useState<ExpandedState>(props.defaultExpanded ?? {})`). types.ts D5 변경은 `defaultExpanded` 1 prop 추가만 (기존 30 prop 보존). index.ts D8 변경은 5 alias re-export 추가만 (기존 7 export 보존). package.json D8 변경은 `exports` field에 `./legacy` 항목 추가만 (기존 4 peer + main exports 보존). | git diff line count + Read+grep 보존 입증 | C-1 (2026-05-14 추가) + D5 + D8 |
| AC-010 | C-12: `pnpm --filter @tomis/grid-core typecheck` 0 error + `pnpm --filter @tomis/grid-core build` (tsup CJS+ESM dual + dts) exit 0. tsup multi-entry (D13 — `entry: ['src/index.ts', 'src/legacy/index.ts']`) 빌드 성공 — `dist/legacy.cjs/.mjs/.d.ts` 산출. | exit code 0 + dist 파일 존재 | C-12 + D13 |
| AC-011 | TreeGrid alias `expandAll={true}` 외관 보존 (D5 핵심). MenuManagePage.tsx `<TreeGrid expandAll={true}>` 마이그레이션 후 마운트 시 전체 트리 펼침 (children 모두 표시) — AS-IS와 동일 외관. C-13 baseline 스크린샷 검증. | 수동 스크린샷 비교 또는 Storybook `Legacy/TreeGridExpandAll` story | C-13 + D5 (advisor item#2) |
| AC-012 | C-25: 모든 5 alias + `useDeprecationWarn` hook + `defaultExpanded` 신규 prop 에 JSDoc (`@deprecated` + `@see G-005-spec.md` 명시). README.md 업데이트 (Legacy Aliases 섹션). | grep `@deprecated` count ≥ 5 + grep `@see G-005-spec` count ≥ 5 + README.md update 검증 | C-25 |

**카운트**: 12 AC ≥ 3 (rubric C-01 통과). 모든 AC `source: L0/C-NN/D#` 태그 본문 인용 (rubric H-03 통과).

**호환성 검증 AC (rubric C-05)**: AC-005/AC-007/AC-008/AC-009/AC-010/AC-011 — 보존 + 빌드 + 번들 + 시각 회귀 + 외관 보존. **사용처 3개 (D10 actual)** — high migrationImpact strict 검증 의무.

---

## Section 6: 엣지 케이스 (≥3개)

### EC-01: alias mount 후 `useDeprecationWarn` — production 환경

- **시나리오**: alias가 production build (`process.env.NODE_ENV === 'production'`)에서 mount
- **처리** (D3/D4):
  - `process.env.NODE_ENV === 'production'` 가드 → console.warn skip
  - useRef guard도 fired.current=true 설정 안 됨 (return 즉시)
  - production silent — 사용자 console 무영향
- **AC 매핑**: AC-003

### EC-02: alias mount — React 19 StrictMode (dev mode 2회 effect)

- **시나리오**: dev mode + StrictMode 활성 → useEffect 2회 호출
- **처리** (D4):
  - 1회차: `fired.current === false` → set true + console.warn 1회
  - 2회차: `fired.current === true` → early return (warn skip)
  - 결과: console.warn 정확히 1회 발생
- **AC 매핑**: AC-003 + 단위 테스트 T-03

### EC-03: TreeGrid `expandAll={true}` (D5 핵심)

- **시나리오**: `<TreeGrid data columns getSubRows expandAll={true}>`
- **처리** (D5):
  - alias 매핑: `<Grid enableExpanding getSubRows defaultExpanded={true}>`
  - Grid.tsx L83: `useState<ExpandedState>(props.defaultExpanded ?? {})` → 초기값 `true` (TanStack ExpandedState `true` = 전체 펼침)
  - 마운트 후 첫 render에서 모든 트리 노드 펼침 (depth N 모두) — AS-IS TreeGrid.tsx:35 동일 외관
  - 사용자 토글 시 setExpanded 정상 동작 (controlled state 그대로)
- **AC 매핑**: AC-002 + AC-011 + 시각 회귀 baseline

### EC-04: TreeGrid `expandAll` 미지정 또는 false

- **시나리오**: `<TreeGrid data columns getSubRows>` 또는 `<TreeGrid expandAll={false}>`
- **처리** (D5):
  - alias 매핑: `<Grid enableExpanding getSubRows defaultExpanded={{}}>`
  - Grid.tsx L83: 초기값 `{}` (TanStack `Record<string, boolean>` 빈 객체 = 전체 접힘)
  - 마운트 후 첫 render에서 root 행만 표시 — AS-IS TreeGrid 동일 외관
- **AC 매핑**: AC-002 + AC-011

### EC-05: VirtualGrid `rowHeight`/`containerHeight` 미지정 (defaults 보존)

- **시나리오**: `<VirtualGrid data columns>` (rowHeight + containerHeight 모두 미지정)
- **처리** (D11):
  - alias 매핑: `<Grid enableVirtualization virtualScrollHeight={undefined ?? 500} virtualizerOptions={{ estimateSize: undefined ?? 40 }}>`
  - 결과: virtualScrollHeight=500 (★ AS-IS containerHeight default 보존, Grid default 400과 다름), estimateSize=40 (★ AS-IS rowHeight default 보존, Grid default 36과 다름)
  - 외관: AS-IS와 동일 — 500px 컨테이너 + 40px 행 추정
- **AC 매핑**: AC-002 + AC-008 + 시각 회귀 baseline

### EC-06: ColumnPinGrid `pinLeft`/`pinRight` 미지정

- **시나리오**: `<ColumnPinGrid data columns>` (pin 없음)
- **처리** (D11):
  - alias 매핑: `<Grid enableSort enableColumnPinning defaultColumnPinning={{ left: undefined ?? [], right: undefined ?? [] }}>`
  - 결과: ColumnPinningState `{left: [], right: []}` (G-002 D2 정의 기본값 동일)
  - 외관: pinned column 없음 + sort 활성 — AS-IS 동일
- **AC 매핑**: AC-002

### EC-07: GroupedHeaderGrid columns 그룹 구조 (TanStack hierarchy)

- **시나리오**: `<GroupedHeaderGrid columns={[{header:'Group',columns:[...leaf]}, ...]}>` (AS-IS 사용 패턴)
- **처리** (D6/D11):
  - alias 매핑: `<Grid enableSort columns={[{header:'Group',columns:[...leaf]}, ...]}>`
  - G-001 buildTableOptions 가 ColumnDef 그룹 구조 무수정 통과 (TanStack `getHeaderGroups()` 내부 placeholder 메커니즘 — AS-IS GroupedHeaderGrid.tsx:79-86 와 동일)
  - 외관: 다중행 헤더 정상 렌더 — AS-IS 동일
  - 단 sticky group header CSS / 자식 visibility 토글 등 enhancement는 MOD-GRID-14 후속 (D6)
- **AC 매핑**: AC-002 + AC-004

### EC-08: 사용처 import 경로 변경 — JSX 시그니처 무수정 (3 actual)

- **시나리오**: SlipListPage.tsx L21 `import BaseGrid from '../../../components/tomis/Grid/BaseGrid'` → `import { BaseGrid } from '@tomis/grid-core/legacy'`
- **처리** (D10):
  - default import → named import 변경 의무 (alias는 named export — `export function BaseGrid<TData>(...)`)
  - JSX `<BaseGrid<SlipListItem> data columns ...>` 무수정 (props 시그니처 100% 동일 — D11)
  - tsc 0 error (BaseGridProps<TData> shape 동일)
  - 외관 회귀 0 — C-13 검증 의무
- **AC 매핑**: AC-005 + AC-007 + AC-009 + AC-011

### EC-09: 사용처 raw TanStack 직접 사용 — 본 Goal no-op (D10 nominal-only)

- **시나리오**: DailyAttendancePage.tsx + AnnualLeaveStatusPage.tsx — `useReactTable` 직접 사용 (5 variant 미사용)
- **처리** (D10):
  - 본 G-005 alias 마이그레이션 무관 — 두 페이지 무수정
  - MOD-GRID-17 후속 Goal에서 `useReactTable(...)` 호출을 `<Grid>` 컴포넌트로 마이그레이션
  - documented-deviation: `findings/MOD-GRID-01/wrapper/G-005-deviations.md` 권장 (wrapper-goals.json affectedUsageFiles 5 vs actual 3 차이 명시)
- **AC 매핑**: AC-007 + Section 8.3

### EC-10 (환경 의존): pnpm 미설치 환경에서 build 검증 불가 (AC-010)

- **시나리오**: CI가 아닌 로컬에서 pnpm CLI 미설치 또는 monorepo build 실패
- **처리**:
  - Implementer는 immediate stop + `findings/blocked/G-005-env.md` 생성
  - `npx tsc --noEmit` 폴백 가능하나 tsup multi-entry 빌드 검증 불가 (D13 — multi-entry 빌드 검증 필수)
- **AC 매핑 표** (rubric E-04 권장):

| AC | EC | 매핑 사유 |
|----|----|---------|
| AC-007 (3 사용처 마이그레이션 + tsc 0 error) | EC-10 (pnpm 미설치) | tw-framework-front tsc는 npx로도 가능하나 `@tomis/grid-core/legacy` 모듈 resolution은 pnpm workspace alias 의존 — Implementer immediate stop |
| AC-010 (build + multi-entry 산출) | EC-10 (pnpm 미설치) | tsup multi-entry 빌드 + dist legacy.cjs/.mjs/.d.ts 산출 검증 불가 — documented-deviation 처리 |

**합계**: 10 EC ≥ 3 (rubric E-04 통과). EC와 AC 매핑 표 (EC-10) 명시.

---

## Section 7: 구현 대상 파일 (NEW 7 + MODIFY 3 + 사용처 MODIFY 3 = 13개)

**경로 결정 근거 (D1 — C-28 N/A)**: wrapper-goals.json L287-294 G-005 `implementFiles` 6 파일 모두 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/...` 정확 prefix. C-28 정정 결정 불필요.

**spec 본문 변경 (wrapper-goals.json `implementFiles` 6 → spec 본문 7 NEW + 3 MODIFY + 3 사용처)** (D2):
- (a) `useDeprecationWarn.ts` 분리 추가 (D3 — 5 alias 공통 헬퍼) → NEW 7 (wrapper-goals.json 6 파일 + 1)
- (b) `src/types.ts` MODIFY 추가 (D5 — `defaultExpanded` prop 신규 + `BaseGridProps` 신규 export, Section 2.9) → MODIFY 3
- (c) `src/Grid.tsx` MODIFY 추가 (D5 — L83 `useState<ExpandedState>` 1줄 변경) → MODIFY 3
- (d) `src/index.ts` MODIFY 추가 (D8 — 5 alias re-export) → MODIFY 3
- (e) `package.json` MODIFY 추가 (D8 — `exports` field `./legacy` sub-entry) → MODIFY 3
- (f) `tsup.config.ts` MODIFY 추가 (D13 — multi-entry 추가) → MODIFY 3 (단 D13에서 단일 entry fallback 옵션 — Implementer 결정)
- (g) **사용처 3 (D10 actual)**: SlipListPage.tsx + AdminSlipEditPage.tsx + MenuManagePage.tsx (import 경로 변경)
- → **NEW 7 + MODIFY 3 + 사용처 MODIFY 3 = 13개** (또는 14개 if tsup.config.ts 별도 행)

**조부모 디렉토리 실재 확인** (H-02 외부 디렉토리 예외):
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/` 실재 (G-001~G-004 생성, ls 확인 — `Grid.tsx`/`index.ts`/`internal/`/`types.ts` 4 entries 존재)
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/legacy/` **부재** (★ 본 Goal이 직접 생성 — H-02 외부 디렉토리 예외 충족, Section 8.2 명시)
- `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/SlipListPage.tsx` 실재 + `AdminSlipEditPage.tsx` 실재 + `tw-framework-front/src/pages/tomis/admin/MenuManagePage.tsx` 실재 (Read 확인)

| # | 파일 경로 | 변경 유형 | 책임 |
|---|----------|---------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/legacy/BaseGrid.tsx` | **NEW** | `function BaseGrid<TData extends object>(props: BaseGridProps<TData>): JSX.Element` — `<Grid enableSort enableFilter enablePagination={pagination !== undefined} pagination={pagination} rowSelection onRowClick onRowDoubleClick loading emptyText className />` 매핑 (Section 2.1, D11). `useDeprecationWarn('BaseGrid')` 호출. |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/legacy/VirtualGrid.tsx` | **NEW** | `function VirtualGrid<TData extends object>(props: VirtualGridProps<TData>): JSX.Element` — `interface VirtualGridProps extends BaseGridProps + rowHeight + containerHeight` (★ defaults 40/500 보존, D11). `<Grid enableSort enableFilter enableVirtualization virtualScrollHeight={containerHeight ?? 500} virtualizerOptions={{estimateSize: rowHeight ?? 40}} ...>` 매핑 (Section 2.2). `useDeprecationWarn('VirtualGrid')` 호출. |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/legacy/ColumnPinGrid.tsx` | **NEW** | `function ColumnPinGrid<TData extends object>(props: ColumnPinGridProps<TData>): JSX.Element` — `interface ColumnPinGridProps + pinLeft + pinRight + sort only` (★ filter 미wiring, D11). `<Grid enableSort enableColumnPinning defaultColumnPinning={{left: pinLeft ?? [], right: pinRight ?? []}} enablePagination={pagination !== undefined} ...>` 매핑 (Section 2.3). `useDeprecationWarn('ColumnPinGrid')` 호출. |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/legacy/GroupedHeaderGrid.tsx` | **NEW** | `function GroupedHeaderGrid<TData extends object>(props: GroupedHeaderGridProps<TData>): JSX.Element` — `interface GroupedHeaderGridProps + ColumnDef hierarchy 그대로 + sort only` (★ basic shim D6, D11). `<Grid enableSort columns={columns} enablePagination={pagination !== undefined} ...>` 매핑 (Section 2.4). `useDeprecationWarn('GroupedHeaderGrid')` 호출. |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/legacy/TreeGrid.tsx` | **NEW** | `function TreeGrid<TData extends object>(props: TreeGridProps<TData>): JSX.Element` — `interface TreeGridProps + getSubRows + expandAll` (D11). `<Grid enableExpanding getSubRows defaultExpanded={expandAll ? true : {}} onRowClick ...>` 매핑 (Section 2.5, ★ D5 — `defaultExpanded` prop 활용). `useDeprecationWarn('TreeGrid')` 호출. |
| 6 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/legacy/index.ts` | **NEW** | 5 alias + `useDeprecationWarn` 모두 named re-export. 단 `BaseGridProps` type re-export 포함 (D8 — sub-entry tree-shake 호환). |
| 7 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/legacy/useDeprecationWarn.ts` | **NEW** | `useDeprecationWarn(name: string): void` — `useRef` guard + `useEffect once` + `process.env.NODE_ENV` dev guard (D3/D4). 5 alias 공통 호출. |
| 8 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/Grid.tsx` | **MODIFY** | L83 1줄 변경 — `useState<ExpandedState>({})` → `useState<ExpandedState>(props.defaultExpanded ?? {})`. (D5 — TreeGrid alias의 `expandAll={true}` 외관 보존). 기타 markup/state/hook 모두 보존 (D11 G-001~G-004 산출물 무파괴). |
| 9 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` | **MODIFY** | (a) `GridProps<TData>`에 `defaultExpanded?: ExpandedState \| boolean` 1 prop 추가 (`enableExpanding` 인접, D5 + AC-002). (b) `BaseGridProps<TData>` interface 신규 추가 — AS-IS `tw-framework-front/src/types/tomis/grid.ts:16-26` 시그니처 동일 (Section 2.9, D11 + AC-005). 기존 30 prop + 6 type export 보존. |
| 10 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` | **MODIFY** | (a) 5 alias + alias props types re-export (D8 + AC-001). (b) `BaseGridProps` type re-export (AC-005). 기존 7 export 보존. |
| 11 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/package.json` | **MODIFY** | `exports` field에 `"./legacy": { "types": "./dist/legacy.d.ts", "import": "./dist/legacy.mjs", "require": "./dist/legacy.cjs" }` 항목 추가 (D8 + AC-010). 기존 `peerDependencies` 4종 + `main`/`module`/`types` 보존. |
| 12 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/SlipListPage.tsx` | **MODIFY** | L21 import 경로 1줄 변경 — `import BaseGrid from '../../../components/tomis/Grid/BaseGrid'` → `import { BaseGrid } from '@tomis/grid-core/legacy'`. JSX (L1024 + L1236) 무수정 (D10/D11). |
| 13 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/account/AdminSlipEditPage.tsx` | **MODIFY** | L15 import 경로 1줄 변경 — `import BaseGrid from '../../../components/tomis/Grid/BaseGrid'` → `import { BaseGrid } from '@tomis/grid-core/legacy'`. JSX (L593 + L605) 무수정. |
| 14 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/admin/MenuManagePage.tsx` | **MODIFY** | L7 import 경로 1줄 변경 — `import TreeGrid from '../../../components/tomis/Grid/TreeGrid'` → `import { TreeGrid } from '@tomis/grid-core/legacy'`. JSX (L157 `<TreeGrid expandAll={true}>`) 무수정 (★ D5 효과 적용). |

→ **합계**: NEW 7 + grid-core MODIFY 4 (`src/Grid.tsx` + `src/types.ts` + `src/index.ts` + `package.json`) + 사용처 MODIFY 3 = **14 파일** (D2와 일치).

**Section 11 cross-check (rubric E-01 ★)**: Section 11.1 Step 1 (useDeprecationWarn NEW) → 행 #7, Step 2 (BaseGrid alias NEW) → 행 #1, Step 3 (VirtualGrid NEW) → 행 #2, Step 4 (ColumnPinGrid NEW) → 행 #3, Step 5 (GroupedHeaderGrid NEW) → 행 #4, Step 6 (TreeGrid NEW) → 행 #5, Step 7 (legacy/index.ts NEW) → 행 #6, Step 8 (Grid.tsx MODIFY D5) → 행 #8, Step 9 (types.ts MODIFY) → 행 #9, Step 10 (src/index.ts MODIFY) → 행 #10, Step 11 (package.json MODIFY + tsup.config.ts D13 fallback) → 행 #11, Step 12-14 (사용처 3 import 경로) → 행 #12/13/14. **Step ↔ 표 행 14/14 일치**.

**부수 변경**:
- **`tsup.config.ts` MODIFY** (D13 — multi-entry 채택 시) — 본 Section 7에서 별도 행 미표기 (Implementer가 Read 후 결정 — D13 fallback 가능). spec 권위는 multi-entry 채택 (Step 11 명시).
- ADR 신규 entry — `decisions/MOD-GRID-01-decisions.md`에 `ADR-MOD-GRID-01-006` 추가 (D8 sub-entry 분리 정책 — Step 13 권장, Section 13).
- README.md 업데이트 (Legacy Aliases 섹션) — Step 13 (Section 13).
- Storybook stories 추가 — `src/__stories__/Legacy.stories.tsx` 5 alias 각 1개 + TreeGridExpandAll story — Step 12 (Section 12).
- `.size-limit.json` 무수정 — 한도 30 KB 그대로 (D7).

---

## Section 8: 마이그레이션 영향도 Preflight (G-005 핵심)

### 8.1 영향 사용처 카운트

**`affectedUsageFiles: 5` (wrapper-goals.json L295-300) vs spec actual: 3** (D10 — advisor item#1).

| # | 파일 | nominal vs actual | 마이그레이션 |
|---|------|------------------|------------|
| 1 | `tw-framework-front/src/pages/tomis/account/SlipListPage.tsx` | actual (BaseGrid) | L21 import 경로 변경 + JSX 무수정 |
| 2 | `tw-framework-front/src/pages/tomis/account/AdminSlipEditPage.tsx` | actual (BaseGrid) | L15 import 경로 변경 + JSX 무수정 |
| 3 | `tw-framework-front/src/pages/tomis/hr/DailyAttendancePage.tsx` | nominal-only (raw TanStack — Grep `BaseGrid\|VirtualGrid\|...` 0 hit) | **no-op** — MOD-GRID-17 영역 |
| 4 | `tw-framework-front/src/pages/tomis/hr/AnnualLeaveStatusPage.tsx` | nominal-only (raw TanStack — Grep 0 hit) | **no-op** — MOD-GRID-17 영역 |
| 5 | `tw-framework-front/src/pages/tomis/admin/MenuManagePage.tsx` | actual (TreeGrid) | L7 import 경로 변경 + JSX 무수정 (★ `expandAll={true}` 보존, D5) |

→ **actual 3 + nominal-only 2 = 5** (wrapper-goals.json 표기 보존). **C-19 ≤5 한도 충족** (3 사용처 변경 + 트리비얼 import-only 변경 — C-19 "트리비얼 ≤10" 예외 해당).

**경로 결정 근거 (D1 — C-28 N/A)**: 모든 implementFiles `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/...` 정확 prefix (G-002~G-004 동일).

### 8.2 무파괴 검증

- **TOMIS 내부 변경 = 3 파일** (D10 actual, ★ 본 Goal 첫 사용처 변경):
  - `tw-framework-front/src/pages/tomis/account/SlipListPage.tsx` L21 (1줄)
  - `tw-framework-front/src/pages/tomis/account/AdminSlipEditPage.tsx` L15 (1줄)
  - `tw-framework-front/src/pages/tomis/admin/MenuManagePage.tsx` L7 (1줄)
  - **변경은 모두 default import → named import 경로 변경 1줄씩** — JSX/로직 무수정 (D10/D11)
  - **검증 의무 (C-1 2026-05-14 추가, F-03 ★)**: Implementer Stage에서 git diff 또는 Read+grep으로 보존 입증. 각 파일의 BaseGrid/TreeGrid 외 다른 코드 보존 확인 (예: SlipListPage 1500+ 라인 중 L21 1줄만 변경)
- **외부 monorepo MODIFY 보존 의무 (D11 + C-1)**:
  - `Grid.tsx` 434라인 → 변경은 **L83 1줄** (`useState<ExpandedState>({})` → `useState<ExpandedState>(props.defaultExpanded ?? {})`). 기타 forwardRef/useGridImperativeHandle/useGridVirtualizer/buildTableOptions/sticky thead/pinning markup/skeleton/empty/autoSelect/pagination footer 모두 보존
  - `types.ts` 459라인 → `GridProps`에 `defaultExpanded?: ExpandedState \| boolean` 1 prop 추가 + `BaseGridProps<TData>` interface 신규 추가. 기존 30 prop 시그니처/주석 보존
  - `index.ts` 11라인 → 5 alias + `BaseGridProps` re-export 추가. 기존 7 export 보존
  - `package.json` 29라인 → `exports` field에 `"./legacy"` 항목 추가. 기존 4 peer + main exports 보존
  - **검증 의무**: Implementer Stage에서 git diff 또는 Read+grep으로 보존 입증 (implement-rubric F-03)
- **부모 디렉토리 실재** (H-02 외부 디렉토리 예외 충족):
  - `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/` 실재 (G-001~G-004 생성, 4 entries — `Grid.tsx`/`index.ts`/`internal/`/`types.ts`)
  - **`D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/legacy/` 부재 — 본 G-005가 직접 생성** (H-02 외부 디렉토리 예외 첫 조건 부합 — 조부모 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/` 실재)
  - 7 NEW 파일 모두 `legacy/` 신규 디렉토리에 생성 — `mkdir legacy` 의무 (Step 1-1)
- **명명 컨벤션**: `legacy/{Variant}.tsx` (lowerCamelCase 디렉토리 + PascalCase 컴포넌트 파일) — `internal/` 디렉토리 패턴과 일관 (G-001~G-004 정착)

### 8.3 점진 마이그레이션 (C-19)

본 Goal: NEW 7 + grid-core MODIFY 4 + 사용처 MODIFY 3 = 14 파일. **사용처 마이그레이션 3개** ≤ C-19 한도 5 (actual 기준). C-19 "트리비얼 import-only ≤10" 예외도 충족.

**nominal-only 2 (DailyAttendance/AnnualLeaveStatus) deviation 처리** (D10):
- `findings/MOD-GRID-01/wrapper/G-005-deviations.md` 신규 생성 권장 — wrapper-goals.json `affectedUsageFiles` 5 vs actual 3 차이 명시. nominal-only 2는 raw TanStack `useReactTable` 사용 (Grep 0 hit) — MOD-GRID-17 영역. C-19 위반 아님.

후속 점진 (참고 — 본 Goal 범위 외):
- MOD-GRID-17 27 페이지 점진 (account/Slip*/Expense*/Vat* 등) — 각 5 파일 sub-Goal (F-17-01~F-17-06)
- MOD-GRID-10 ChangeTrackingGrid alias — 자체 모듈
- MOD-GRID-14 GroupedHeaderGrid enhancement — D6 결정 (basic shim G-005 + enhancement 후속)

### 8.4 롤백 전략

- **롤백 단순**: NEW 7 파일 삭제 + MODIFY 4 grid-core 파일 G-004 시점 복원 + 사용처 3 파일 import 라인 원복
- 명령:
  ```powershell
  cd D:\project\topvel_project\topvel-grid-monorepo
  Remove-Item -Recurse -Force packages\grid-core\src\legacy
  git checkout -- packages\grid-core\src\Grid.tsx packages\grid-core\src\types.ts packages\grid-core\src\index.ts packages\grid-core\package.json
  # tsup.config.ts (D13 채택 시) 도 git checkout

  cd D:\project\topvel_project\TOMIS\tw-framework-front
  git checkout -- src\pages\tomis\account\SlipListPage.tsx src\pages\tomis\account\AdminSlipEditPage.tsx src\pages\tomis\admin\MenuManagePage.tsx
  ```
- **TOMIS git 영향**: 사용처 3 파일 import 라인 1줄씩만 — git revert 단순
- 후속 Goal 영향:
  - G-005 alias 부재 시 MOD-GRID-17 27 페이지 마이그레이션 옵션 제약 (alias 경유 import 변경 불가 → 모든 페이지 직접 `<Grid>` 마이그레이션 의무)
  - MOD-GRID-10 ChangeTrackingGrid alias / MOD-GRID-14 enhancement도 alias 패턴 부재 시 영향 (alias deprecation 정책 부재)

### 8.5 번들 영향 (D7 ★ ADR-MOD-GRID-01-005 실측 trajectory inherit)

- **+5 KB 예상** (wrapper-goals.json G-005 `bundleImpact.expected: "+5 KB (5 alias 함수 + props 매핑)"`)
- **실측 trajectory 적용**: G-001 17.44 + G-002+G-003 +0.91 + G-004 +5.86 = **24.21 KB / 30 KB (실측, ADR-005 Consequences)**.
- **G-005 시나리오**:
  - **pessimistic** (+5 KB 그대로): 누적 29.21 KB / 30 KB (여유 0.79 KB) — ★ 한계 근접
  - **optimistic** (G-001-3 trajectory 14% 적용 → +0.7 KB): 누적 24.91 KB (여유 5.09 KB)
  - **G-004 trajectory 84% 적용 → +4.2 KB**: 누적 28.41 KB (여유 1.59 KB) — ★ 마진 박함
- **D7 정책 — extrapolation 금지** (advisor item#5):
  - prompt의 "G-004 trajectory 84% 적용 시 G-005 실측 +4.2 KB" 추정도 stale (G-001-3 14% vs G-004 84% — 공식 부재. trajectory는 Goal 별 변동성 큼)
  - **IMPLEMENT Step 12 측정 의무**: `pnpm size-limit` 실측. **누적 ≤28.5 KB** → 단일 entry 유지. **> 28.5 KB** → `/legacy` sub-entry 강제 분리 트리거 (D7 — D8 정의로 사전 인프라 마련됨)
  - C-21 사용자 승인 미필요 (본 G-005 +5 KB는 100 KB 미만)
- **외부 의존성 번들 영향 0**: alias 5종은 base Grid를 import할 뿐 — 신규 외부 dep 없음. tsup external 변경 0.

### prompt 산술 vs 실측 산술 정정 표 (C-27 promptSpecDrift)

| 항목 | prompt 값 | spec 본문 (실측) 값 | 정정 사유 |
|------|----------|-------------------|----------|
| 누적 G-001~G-004 | 24.21 KB | 24.21 KB (= 17.44 + 0.91 + 5.86) | 일치 ✓ |
| G-005 예상 추가 | +5 KB | +5 KB (pessimistic) / +0.7~4.2 KB (trajectory variants) | 명시는 wrapper-goals.json — 본 spec은 measure-then-decide 정책 |
| 누적 한도 위험 | 29.21 KB / 30 KB (여유 0.79 KB) → ★ 한도 근접 | 29.21 KB pessimistic vs 24.91~28.41 KB scenarios → 측정 의무 | prompt는 pessimistic 가정 — 본 spec은 trajectory variability 인지 + measure gate |
| trajectory 추정 | "G-004 trajectory 84% 적용 시 +4.2 KB → 28.41 KB 가능" | extrapolation 금지 (D7) — IMPLEMENT 직후 측정 의무 | G-001-3 14% vs G-004 84% — 공식 부재. Goal별 변동성 큼 (advisor item#5) |
| **결론** | "여유 0.79 KB — pessimistic risk" | "측정 게이트 (≤28.5 KB → 단일, >28.5 KB → /legacy 분리). 사전 인프라(D8) 마련됨" | D7 — Implementer는 본 spec을 권위로 따라야 함 (C-27) |

**Implementer 측 의무 (C-27)**: prompt의 "trajectory 84% 적용" extrapolation을 그대로 적용하지 말 것. spec D7 본문 권위 — implement Step 12에서 `pnpm size-limit` 실측 후 누적 ≤28.5 KB → 단일 entry, >28.5 KB → `/legacy` sub-entry 강제 분리. promptSpecDrift JSON 필드에 본 정정 기록 의무.

---

## Section 9: 의존성 (peerDeps/deps/devDeps)

### peerDependencies (C-22 — grid-core/package.json L23-28에 이미 선언됨)

```json
"peerDependencies": {
  "@tanstack/react-table": "^8.0.0",
  "@tanstack/react-virtual": "^3.0.0",
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0"
}
```

본 G-005 신규 import:
- `useEffect`, `useRef` from `react` — peer 이미 선언
- `Grid` from `'../Grid'` — internal
- `BaseGridProps`/`GridPaginationOptions`/`GridRowSelectionOptions` from `'../types'` — internal
- `ColumnDef` from `'@tanstack/react-table'` — peer 이미 선언

→ **신규 peerDependency 선언 추가 0건**. C-20 ADR 의무 N/A (외부 dep 추가 없음).

### dependencies

**없음** (pure alias compat shim). C-22 위반 없음.

### devDependencies (workspace root)

**변경 없음** — `@tanstack/react-virtual` G-004 시점 설치 (ADR-005). 본 G-005 추가 0.

### 외부 라이브러리 추가

**0건**. C-7 (AG Grid 금지) + C-16 (Wijmo 금지) 무관 — 둘 다 import 없음.

### `package.json exports` field 변경

`exports` field에 `"./legacy"` sub-entry 추가 (D8) — peer/dep 정책과 별개. tsup multi-entry 빌드 + dist 산출물 산출 의무.

---

## Section 10: 사용자 여정

### 개발자 여정 (구현 후)

(wrapper-goals.json G-005 `userJourneySteps` 인용 + D# 정합)

1. `import { BaseGrid } from '@tomis/grid-core/legacy'` (또는 `from '@tomis/grid-core'` main entry — D8)
2. `<BaseGrid data columns pagination rowSelection .../>` 호출 (AS-IS BaseGridProps 시그니처 그대로 — D11)
3. 내부에서 props 매핑 후 `<Grid enableSort enableFilter enablePagination={pagination !== undefined} ...>` 위임 (Section 2.1)
4. mount 시 console.warn (개발 모드만) — `useEffect once + ref guard` (D3/D4) + StrictMode 정확 1회
5. 1 minor 버전 유지 후 다음 major 에서 제거 (C-23) — 사용자가 그동안 `<Grid>` 직접 마이그레이션 의무

### 최종 사용자 여정 (페이지 사용 시 보이는 동작)

| 시나리오 | 보이는 동작 (마이그레이션 후) |
|---------|---------------------------|
| SlipListPage `<BaseGrid<SlipListItem>>` mount | AS-IS와 동일 외관 — 정렬/필터/페이지네이션 동작, 행 클릭 (D11) |
| SlipListPage 분개 그리드 `<BaseGrid<Slip02ListItem>>` | 동일 — 200px 최대 높이 컨테이너 내 BaseGrid (외관 회귀 0) |
| AdminSlipEditPage 차변/대변 `<BaseGrid<Slip02ListItem>>` | 동일 — 차변(blue-50)/대변(red-50) 헤더 + BaseGrid 본체 |
| MenuManagePage `<TreeGrid expandAll={true}>` mount | **마운트 시 전체 트리 펼침** (depth N 모두) — AS-IS 동일 (★ D5 효과 — `defaultExpanded={true}` 매핑) |
| MenuManagePage 트리 노드 토글 | 사용자 토글 시 setExpanded 정상 동작 (controlled state — TanStack 표준) |
| 개발자 콘솔 (dev mode) | 페이지 마운트 시 console.warn 1회: `[tomis/grid-core] BaseGrid is deprecated, migrate to <Grid>...` |
| 개발자 콘솔 (production mode) | 무경고 (silent — D3 production guard) |

---

## Section 11: 구현 계획

### 11.1 파일별 변경 명세 (Before/After ≥1 코드 블록 — rubric E-02)

**Step 1 (NEW) — `legacy/useDeprecationWarn.ts`** — D3/D4 dev mode 1회 console.warn 헬퍼

```ts
// legacy/useDeprecationWarn.ts (NEW)
import { useEffect, useRef } from 'react';

declare const process: { env: { NODE_ENV?: string } } | undefined;

export function useDeprecationWarn(name: string): void {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    if (typeof process === 'undefined' || process.env.NODE_ENV === 'production') return;
    fired.current = true;
    console.warn(
      `[tomis/grid-core] ${name} is deprecated, migrate to <Grid>. See migration guide.`,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
```

**Step 2 (NEW) — `legacy/BaseGrid.tsx`** — Section 2.1 정확 구현

```tsx
// legacy/BaseGrid.tsx (NEW — Section 2.1 D11)
import type { BaseGridProps } from '../types';
import { Grid } from '../Grid';
import { useDeprecationWarn } from './useDeprecationWarn';

export function BaseGrid<TData extends object>(props: BaseGridProps<TData>): JSX.Element {
  useDeprecationWarn('BaseGrid');
  return (
    <Grid<TData>
      data={props.data}
      columns={props.columns}
      enableSort
      enableFilter
      enablePagination={props.pagination !== undefined}
      pagination={props.pagination}
      rowSelection={props.rowSelection}
      onRowClick={props.onRowClick}
      onRowDoubleClick={props.onRowDoubleClick}
      loading={props.loading}
      emptyText={props.emptyText}
      className={props.className}
    />
  );
}
```

**Step 3 (NEW) — `legacy/VirtualGrid.tsx`** — Section 2.2 (★ AS-IS defaults 보존)

```tsx
// legacy/VirtualGrid.tsx (NEW — Section 2.2 D11)
import type { BaseGridProps } from '../types';
import { Grid } from '../Grid';
import { useDeprecationWarn } from './useDeprecationWarn';

export interface VirtualGridProps<TData> extends BaseGridProps<TData> {
  rowHeight?: number;        // default 40 (AS-IS L31)
  containerHeight?: number;  // default 500 (AS-IS L32)
}

export function VirtualGrid<TData extends object>(props: VirtualGridProps<TData>): JSX.Element {
  useDeprecationWarn('VirtualGrid');
  return (
    <Grid<TData>
      data={props.data}
      columns={props.columns}
      enableSort
      enableFilter
      enableVirtualization
      virtualScrollHeight={props.containerHeight ?? 500}
      virtualizerOptions={{ estimateSize: props.rowHeight ?? 40 }}
      rowSelection={props.rowSelection}
      onRowClick={props.onRowClick}
      onRowDoubleClick={props.onRowDoubleClick}
      loading={props.loading}
      emptyText={props.emptyText}
      className={props.className}
    />
  );
}
```

**Step 4 (NEW) — `legacy/ColumnPinGrid.tsx`** — Section 2.3 (★ filter 미wiring + pinLeft/pinRight → ColumnPinningState 변환)

```tsx
// legacy/ColumnPinGrid.tsx (NEW — Section 2.3 D11)
import type { ColumnDef } from '@tanstack/react-table';
import type { GridPaginationOptions, GridRowSelectionOptions } from '../types';
import { Grid } from '../Grid';
import { useDeprecationWarn } from './useDeprecationWarn';

export interface ColumnPinGridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  pinLeft?: string[];
  pinRight?: string[];
  pagination?: GridPaginationOptions;
  rowSelection?: GridRowSelectionOptions<TData>;
  onRowClick?: (row: TData) => void;
  loading?: boolean;
  emptyText?: string;
  className?: string;
}

export function ColumnPinGrid<TData extends object>(props: ColumnPinGridProps<TData>): JSX.Element {
  useDeprecationWarn('ColumnPinGrid');
  return (
    <Grid<TData>
      data={props.data}
      columns={props.columns}
      enableSort
      enableColumnPinning
      defaultColumnPinning={{ left: props.pinLeft ?? [], right: props.pinRight ?? [] }}
      enablePagination={props.pagination !== undefined}
      pagination={props.pagination}
      rowSelection={props.rowSelection}
      onRowClick={props.onRowClick}
      loading={props.loading}
      emptyText={props.emptyText}
      className={props.className}
    />
  );
}
```

**Step 5 (NEW) — `legacy/GroupedHeaderGrid.tsx`** — Section 2.4 (★ basic shim, D6)

```tsx
// legacy/GroupedHeaderGrid.tsx (NEW — Section 2.4 D6/D11)
import type { ColumnDef } from '@tanstack/react-table';
import type { GridPaginationOptions, GridRowSelectionOptions } from '../types';
import { Grid } from '../Grid';
import { useDeprecationWarn } from './useDeprecationWarn';

export interface GroupedHeaderGridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];   // TanStack 그룹 ColumnDef 그대로 (그룹 hierarchy)
  pagination?: GridPaginationOptions;
  rowSelection?: GridRowSelectionOptions<TData>;
  onRowClick?: (row: TData) => void;
  loading?: boolean;
  emptyText?: string;
  className?: string;
}

export function GroupedHeaderGrid<TData extends object>(props: GroupedHeaderGridProps<TData>): JSX.Element {
  useDeprecationWarn('GroupedHeaderGrid');
  return (
    <Grid<TData>
      data={props.data}
      columns={props.columns}
      enableSort
      enablePagination={props.pagination !== undefined}
      pagination={props.pagination}
      rowSelection={props.rowSelection}
      onRowClick={props.onRowClick}
      loading={props.loading}
      emptyText={props.emptyText}
      className={props.className}
    />
  );
}
```

**Step 6 (NEW) — `legacy/TreeGrid.tsx`** — Section 2.5 (★ D5 — `defaultExpanded` 활용)

```tsx
// legacy/TreeGrid.tsx (NEW — Section 2.5 D5/D11)
import type { ColumnDef } from '@tanstack/react-table';
import { Grid } from '../Grid';
import { useDeprecationWarn } from './useDeprecationWarn';

export interface TreeGridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  getSubRows?: (row: TData) => TData[] | undefined;
  expandAll?: boolean;
  onRowClick?: (row: TData) => void;
  loading?: boolean;
  emptyText?: string;
  className?: string;
}

export function TreeGrid<TData extends object>(props: TreeGridProps<TData>): JSX.Element {
  useDeprecationWarn('TreeGrid');
  return (
    <Grid<TData>
      data={props.data}
      columns={props.columns}
      enableExpanding
      {...(props.getSubRows ? { getSubRows: props.getSubRows } : {})}
      defaultExpanded={props.expandAll ? true : {}}
      onRowClick={props.onRowClick}
      loading={props.loading}
      emptyText={props.emptyText}
      className={props.className}
    />
  );
}
```

**Step 7 (NEW) — `legacy/index.ts`** — 5 alias re-export

```ts
// legacy/index.ts (NEW — D8)
export { BaseGrid } from './BaseGrid';
export { VirtualGrid, type VirtualGridProps } from './VirtualGrid';
export { ColumnPinGrid, type ColumnPinGridProps } from './ColumnPinGrid';
export { GroupedHeaderGrid, type GroupedHeaderGridProps } from './GroupedHeaderGrid';
export { TreeGrid, type TreeGridProps } from './TreeGrid';
export { useDeprecationWarn } from './useDeprecationWarn';
export type { BaseGridProps } from '../types';
```

**Step 8 (MODIFY) — `Grid.tsx`** — D5 1줄 변경 (`useState<ExpandedState>` 초기값)

Before (G-004 산출물 — Grid.tsx L83):

```tsx
const [expanded, setExpanded] = useState<ExpandedState>({});
```

After (G-005):

```tsx
const [expanded, setExpanded] = useState<ExpandedState>(props.defaultExpanded ?? {});   // ★ D5
```

**Step 9 (MODIFY) — `types.ts`** — D5 + D11 (`defaultExpanded` prop 신규 + `BaseGridProps` 신규)

Before (G-004 산출물 — types.ts L235-236):

```ts
export interface GridProps<TData> {
  // ...
  enableExpanding?: boolean;
  // ... (다음 prop)
}
```

After (G-005):

```ts
export interface GridProps<TData> {
  // ...
  enableExpanding?: boolean;
  /**
   * `enableExpanding=true` 시 expanded state 초기값 (uncontrolled).
   * `true` = 전체 펼침, `Record<string, boolean>` = 특정 row id만 펼침, 미지정 = `{}` (전체 접힘).
   * G-005 D5 — TreeGrid alias `expandAll={true}` 호환 진입점.
   *
   * @see G-005-spec.md Section 2.5 + D5
   */
  defaultExpanded?: ExpandedState | boolean;   // ★ G-005 D5 신규
  // ... (기존 다음 prop 보존)
}

// G-005 D11 — tw-framework-front BaseGridProps 시그니처 보존 (AS-IS src/types/tomis/grid.ts:16-26 동일)
export interface BaseGridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  pagination?: GridPaginationOptions;
  rowSelection?: GridRowSelectionOptions<TData>;
  onRowClick?: (row: TData) => void;
  onRowDoubleClick?: (row: TData) => void;
  loading?: boolean;
  emptyText?: string;
  className?: string;
}
```

**Step 10 (MODIFY) — `src/index.ts`** — 5 alias + types re-export (D8)

Before (G-004 산출물):

```ts
// @tomis/grid-core — public API (MOD-GRID-01 / G-001 + G-002 + G-003 + G-004).
export { Grid } from './Grid';
export type {
  GridProps,
  GridRowSelectionOptions,
  GridPaginationOptions,
  RowSelectionMode,
  GridColumnResizeMode,
  GridHandle,
  GridScrollToOptions,
} from './types';
```

After (G-005):

```ts
// @tomis/grid-core — public API (MOD-GRID-01 / G-001 + G-002 + G-003 + G-004 + G-005).
export { Grid } from './Grid';
export type {
  GridProps,
  GridRowSelectionOptions,
  GridPaginationOptions,
  RowSelectionMode,
  GridColumnResizeMode,
  GridHandle,
  GridScrollToOptions,
  BaseGridProps,        // ★ G-005 신규 (D11 + AC-005)
} from './types';

// G-005 D8: legacy alias 5종 (main entry 호환 — `/legacy` sub-entry 권장)
export {
  BaseGrid,
  VirtualGrid, type VirtualGridProps,
  ColumnPinGrid, type ColumnPinGridProps,
  GroupedHeaderGrid, type GroupedHeaderGridProps,
  TreeGrid, type TreeGridProps,
} from './legacy';
```

**Step 11 (MODIFY) — `package.json` + `tsup.config.ts`** — D8/D13 sub-entry

Before (G-004 산출물 — package.json L10-16 exports):

```json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.mjs",
    "require": "./dist/index.cjs"
  }
}
```

After (G-005 — D8):

```json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.mjs",
    "require": "./dist/index.cjs"
  },
  "./legacy": {
    "types": "./dist/legacy.d.ts",
    "import": "./dist/legacy.mjs",
    "require": "./dist/legacy.cjs"
  }
}
```

**`tsup.config.ts`** (D13 — multi-entry 채택 시):

```ts
// Before
entry: ['src/index.ts'],
// After (D13)
entry: ['src/index.ts', 'src/legacy/index.ts'],
```

(Implementer가 Read 후 결정 — D13 단일 entry fallback 시 Section 11.3 위험 표 명시)

**Step 12 (MODIFY) — `tw-framework-front/src/pages/tomis/account/SlipListPage.tsx`** — L21 import 1줄

Before:

```tsx
import BaseGrid from '../../../components/tomis/Grid/BaseGrid';
```

After:

```tsx
import { BaseGrid } from '@tomis/grid-core/legacy';
```

(JSX L1024 + L1236 무수정 — props 시그니처 100% 동일)

**Step 13 (MODIFY) — `tw-framework-front/src/pages/tomis/account/AdminSlipEditPage.tsx`** — L15 import 1줄

Before:

```tsx
import BaseGrid from '../../../components/tomis/Grid/BaseGrid';
```

After:

```tsx
import { BaseGrid } from '@tomis/grid-core/legacy';
```

(JSX L593 + L605 무수정)

**Step 14 (MODIFY) — `tw-framework-front/src/pages/tomis/admin/MenuManagePage.tsx`** — L7 import 1줄 (★ D5 효과 적용)

Before:

```tsx
import TreeGrid from '../../../components/tomis/Grid/TreeGrid';
```

After:

```tsx
import { TreeGrid } from '@tomis/grid-core/legacy';
```

(JSX L157 `<TreeGrid expandAll={true}>` 무수정 — ★ D5 alias 매핑으로 `defaultExpanded={true}` 자동 적용 + 외관 보존)

### 11.2 구현 순서 (의존성 고려, 14 Step — Section 7 행과 1:1)

**의존성 정렬**: D5 (Grid.tsx + types.ts MODIFY) 가 TreeGrid alias (Step 6 / 행 #5) 선행 의무 → 실제 실행 순서는 의존성 우선 (아래 Sequence 표 — 의존 reorder).

| Step ID (Section 7 행) | 파일 | 의존 (Sequence) | 검증 |
|----------------------|------|-----------------|------|
| Step 1 (행 #7) | `legacy/useDeprecationWarn.ts` NEW | none — Sequence 1 | Read + tsc 0 error |
| Step 8 (행 #8) | `Grid.tsx` MODIFY (D5 1줄) | none — Sequence 2 | tsc + G-001~G-004 stories 시각 보존 |
| Step 9 (행 #9) | `types.ts` MODIFY (D5 + D11) | none — Sequence 3 | tsc + `BaseGridProps` import 가능 |
| Step 2 (행 #1) | `legacy/BaseGrid.tsx` NEW | Step 1 + Step 9 — Sequence 4 | T-01~T-04 |
| Step 3 (행 #2) | `legacy/VirtualGrid.tsx` NEW | Step 1 + Step 9 — Sequence 5 | T-05 (defaults 40/500) |
| Step 4 (행 #3) | `legacy/ColumnPinGrid.tsx` NEW | Step 1 + Step 9 — Sequence 6 | T-06 (pinLeft/pinRight 변환) |
| Step 5 (행 #4) | `legacy/GroupedHeaderGrid.tsx` NEW | Step 1 + Step 9 — Sequence 7 | T-07 (TanStack 그룹 통과) |
| Step 6 (행 #5) | `legacy/TreeGrid.tsx` NEW | Step 1 + Step 8 + Step 9 — Sequence 8 (★ D5 의존) | T-08 (`expandAll={true}` → 전체 펼침) |
| Step 7 (행 #6) | `legacy/index.ts` NEW | Step 2-6 — Sequence 9 | 5 alias + types re-export |
| Step 10 (행 #10) | `src/index.ts` MODIFY | Step 7 — Sequence 10 | 외부 사용 시 type 가시성 |
| Step 11 (행 #11) | `package.json` MODIFY (+ `tsup.config.ts` D13 fallback) | Step 10 — Sequence 11 | `pnpm --filter @tomis/grid-core build` 통과 + dist `legacy.cjs/.mjs/.d.ts` 산출 |
| (post-Step 11) | `pnpm size-limit` 측정 (D7 gate) | Step 11 — Sequence 12 | 누적 ≤28.5 KB → 단일, >28.5 KB → multi-entry 강제 (D8 사전 인프라 활용) |
| Step 12 (행 #12) | `SlipListPage.tsx` MODIFY (L21 import) | Step 11 — Sequence 13 | `pnpm --filter tw-framework-front typecheck` 0 error |
| Step 13 (행 #13) | `AdminSlipEditPage.tsx` MODIFY (L15 import) | Step 11 — Sequence 14 | tsc 0 error + 시각 회귀 baseline (D9) |
| Step 14 (행 #14) | `MenuManagePage.tsx` MODIFY (L7 import) | Step 11 + Step 8 + Step 9 (D5) — Sequence 15 | tsc + ★ `expandAll={true}` 외관 보존 baseline |

**부수 작업** (Step 1-14 외, Section 13 F-03):
- (post-Step 14) Storybook stories `Legacy.stories.tsx` 9개 작성 (Section 12)
- (post-Step 14) ADR-MOD-GRID-01-006 작성 (D8 sub-entry 분리 정책 — Section 13)
- (post-Step 14) README.md 업데이트 (Legacy Aliases 섹션 — Section 13)
- 본 부수 작업은 14 파일 카운트 외 (Documents/stories — D2 정합성).

### 11.3 위험 요소

| 위험 | 가능성 | 처리 |
|------|--------|------|
| **D5 `defaultExpanded` Grid.tsx L83 변경 — 기존 호출 사이트 회귀** | 낮 | `?? {}` fallback이 G-001~G-004 동작 100% 동일 (`undefined ?? {}` = `{}`). 기존 stories 시각 회귀 0 |
| **D5 `defaultExpanded` types.ts MODIFY — `enableExpanding` 인접 prop 추가가 GridProps optional 수 증가 (TypeScript inference 영향)** | 낮 | optional prop 추가는 backward-compatible (모든 기존 호출 정상). G-004 stages.implement.score 100 patron 보존 |
| **D6 GroupedHeaderGrid basic shim vs MOD-GRID-14 enhancement — 동일 alias 이름 충돌** | 중 | semver minor — backward-compatible 확장 (createColumnGroup helper 등 추가만). Section 4 호환성 표 + Section 13 ADR-006 권장 |
| **D11 VirtualGrid defaults 누락 시 외관 회귀** (`rowHeight=40, containerHeight=500` vs Grid `36, 400`) | 중 | Section 2.2 + Section 11.1 Step 3 코드에 명시 (`?? 500, ?? 40`). AC-002 + EC-05 검증 의무 |
| **D11 ColumnPinGrid filter 미wiring — AS-IS 동등 의무 (BaseGrid는 filter 활성)** | 낮 | Section 2.3 코드에 명시 (`enableFilter` 미부여). AC-002 + AC-011 검증 |
| **D11 SlipListPage default import → named import 변경 (named export 의무)** | 낮 | alias는 `export function BaseGrid<TData>(...)` named export — Section 7 행 #1 명시. SlipListPage `import { BaseGrid } from ...` 변경 의무 (Step 12) |
| **D8 tsup multi-entry 빌드 — tsup 미지원 시 fallback** | 중 | Section 7 행 #11 + Section 11.1 Step 11 — Implementer가 `tsup.config.ts` Read 후 (a) 단일 entry + re-export (`src/index.ts`에서 `export * from './legacy'`) 또는 (b) multi-entry 결정. (a) fallback 시 dist `/legacy` 별도 산출 없음 — 단 `import from '@tomis/grid-core/legacy'` 동작 (subpath imports — `package.json exports` field 동일 dist 가리킴) |
| **D7 누적 번들 한도 근접 (29.21 KB / 30 KB)** | 중 | Step 12 measure-then-decide. > 28.5 KB → multi-entry 강제 분리 (D8 사전 인프라 활용) |
| **D9 시각 회귀 baseline 캡처 — Chromatic 미설치 환경** | 중 | EC-10 deviation. 수동 스크린샷 fallback (3 사용처 마이그레이션 전후 commit hash 1쌍) |
| **D10 nominal-only 2 사용처 (DailyAttendance/AnnualLeaveStatus) — wrapper-goals.json 5 vs spec actual 3 차이** | 발견됨 | `findings/MOD-GRID-01/wrapper/G-005-deviations.md` 신규 생성 + Section 8.3 + AC-007 명시 (D10). C-19 위반 아님 (≤5 한도 내) |
| **prompt 산술 stale (trajectory 84% → +4.2 KB extrapolation)** | 발견됨 | D7 + Section 8.5 정정 표 — measure-then-decide. promptSpecDrift JSON 필드 기록 의무 |
| **wrapper-goals.json `implementFiles` 6 vs spec NEW 7 + MODIFY 4 + 사용처 3 = 14 분류 불일치** | 발견됨 | D2 결정 — spec 본문 권위 (C-27). 후속: 메인이 wrapper-goals.json 정정 검토 (`useDeprecationWarn.ts` + Grid.tsx + types.ts + package.json 추가) |
| **wrapper-goals.json `affectedUsageFiles` 5 vs spec D10 actual 3 분류 불일치** | 발견됨 | D10 결정 — spec 본문 권위 (C-27). DailyAttendance/AnnualLeaveStatus는 Grep 검증으로 0 hit (5 variant 미사용) |
| **wrapper-goals.json AC-006 "별도 Goal 의존 (MOD-GRID-17)" vs spec D9 "본 Goal 즉시 캡처"** | 발견됨 | D9 결정 — 본 G-005 alias 첫 사용 → migrationImpact: high → C-17 의무. 사용처 3 페이지 baseline은 본 Goal 책임. 27 페이지 일괄 baseline은 MOD-GRID-17 |
| **TreeGrid alias getSubRows undefined 시 spread `{...(props.getSubRows ? {getSubRows} : {})}` 패턴** | 낮 | exactOptionalPropertyTypes 환경 대비 — undefined 명시 할당 회피. buildTableOptions.ts L194 동일 패턴 |

---

## Section 12: 검증 계획

### 단위 테스트 (vitest)

| 테스트 | 시나리오 |
|-------|---------|
| T-01 `<BaseGrid data columns pagination={{pageSize:20}}>` mount | dev mode console.warn 1회 + base `<Grid>` 렌더 + sort/filter/pagination 활성 검증 |
| T-02 `<BaseGrid data columns>` (pagination 미지정) mount | enablePagination=false 검증 (BaseGrid:100 conditional 보존) |
| T-03 `<BaseGrid>` + React.StrictMode wrap | console.warn 정확히 1회 발생 (D4 `useRef` guard) |
| T-04 production mode (`process.env.NODE_ENV='production'`) + `<BaseGrid>` mount | console.warn skip (D3 production guard) |
| T-05 `<VirtualGrid data columns>` (rowHeight/containerHeight 미지정) | virtualScrollHeight=500 + estimateSize=40 적용 검증 (D11 AS-IS defaults) |
| T-06 `<ColumnPinGrid pinLeft={['a']} pinRight={['b']}>` mount | base `<Grid>`에 `defaultColumnPinning={{left:['a'], right:['b']}}` 전달 검증 (D11 변환) |
| T-07 `<GroupedHeaderGrid columns={[{header:'G',columns:[...leaf]}]}>` mount | 다중행 헤더 정상 렌더 (TanStack getHeaderGroups 통과 — D6) |
| T-08 `<TreeGrid expandAll={true} getSubRows={...}>` mount (★ D5 핵심) | base `<Grid>`에 `defaultExpanded={true}` 전달 검증 + 마운트 시 모든 트리 노드 펼침 |
| T-09 `<TreeGrid>` (expandAll 미지정) mount | base `<Grid>`에 `defaultExpanded={{}}` 전달 검증 + 마운트 시 root만 표시 |
| T-10 `useDeprecationWarn('Test')` hook unit test | useEffect once + useRef guard 검증 |
| T-11 `useDeprecationWarn` 5회 호출 (5 alias 시뮬) | 각 인스턴스별 1회 console.warn (5 alias 별도 인스턴스) |
| T-12 `<BaseGrid<SlipListItem>>` import from `@tomis/grid-core/legacy` (subpath import) | tsc + 빌드 후 dist resolution 검증 (Step 11) |
| T-13 SlipListPage 마이그레이션 후 default import → named import 변경 | tsc 0 error 검증 (Step 12) |
| T-14 MenuManagePage 마이그레이션 후 `<TreeGrid expandAll={true}>` 외관 | 마운트 후 모든 메뉴 노드 펼침 외관 (★ D5 효과) |

위치: `packages/grid-core/src/__tests__/legacy/BaseGrid.test.tsx` + `VirtualGrid.test.tsx` + `ColumnPinGrid.test.tsx` + `GroupedHeaderGrid.test.tsx` + `TreeGrid.test.tsx` + `useDeprecationWarn.test.ts` (vitest + @testing-library/react)

### 시각 회귀 (Storybook + Chromatic 또는 수동 스크린샷 — C-13/C-17/D9)

**필수** (migrationImpact: high — C-17 + D9): 본 G-005는 첫 사용처 마이그레이션 — baseline 즉시 캡처 의무.

| Story | 시나리오 |
|-------|---------|
| `Legacy/BaseGridDefault` | `<BaseGrid data columns pagination={{pageSize:20}} rowSelection={{mode:'single'}}>` 외관 |
| `Legacy/BaseGridNoPagination` | `<BaseGrid data columns>` (pagination 미지정) — pagination 미렌더 외관 |
| `Legacy/VirtualGrid1500` | `<VirtualGrid data={1500_rows}>` (defaults 적용) — 부드러운 스크롤 + AS-IS 외관 |
| `Legacy/VirtualGridCustomDefaults` | `<VirtualGrid rowHeight={50} containerHeight={700}>` — 사용자 override 검증 |
| `Legacy/ColumnPinGridLeftRight` | `<ColumnPinGrid pinLeft={['a','b']} pinRight={['c']}>` — 좌/우 sticky |
| `Legacy/GroupedHeaderGrid2Rows` | `<GroupedHeaderGrid columns={[{header:'기본',columns:[...]},{header:'급여',columns:[...]}]}>` — 다중행 헤더 |
| `Legacy/TreeGridExpandAll` (★ D5/AC-011) | `<TreeGrid expandAll={true} getSubRows={(r) => r.children}>` — 마운트 시 전체 펼침 |
| `Legacy/TreeGridCollapsed` | `<TreeGrid getSubRows={...}>` (expandAll 미지정) — root만 표시 |
| `Legacy/DeprecationWarn` | dev mode console — 5 alias 각 1회 console.warn 출력 검증 |

**3 사용처 baseline 스크린샷 (D9 — 마이그레이션 전후)**:
- SlipListPage `<BaseGrid>` 메인 그리드 + 분개 그리드 (2 site, 1 페이지)
- AdminSlipEditPage 차변/대변 `<BaseGrid>` (2 site, 1 페이지)
- MenuManagePage `<TreeGrid expandAll={true}>` (1 site, 1 페이지) ★ 핵심

위치: `packages/grid-core/src/__stories__/Legacy.stories.tsx` (신규 stories file)

### 빌드 + 번들 검증 (C-12 + D7)

```powershell
cd D:\project\topvel_project\topvel-grid-monorepo

# typecheck (G-001~G-004 보존 + G-005 추가)
pnpm --filter @tomis/grid-core typecheck    # exit 0 (AC-010)

# build (tsup multi-entry CJS+ESM dual + dts)
pnpm --filter @tomis/grid-core build        # exit 0 (AC-010)
ls packages/grid-core/dist                   # legacy.cjs + legacy.mjs + legacy.d.ts 존재 검증

# size-limit (D7 게이트 ★)
pnpm size-limit --json                       # @tomis/grid-core 측정 — JSON 파싱 후 누적 KB
# 누적 ≤28.5 KB → 단일 entry 유지
# > 28.5 KB → multi-entry 강제 분리 결정

# 사용처 typecheck (D10 — 3 actual)
cd D:\project\topvel_project\TOMIS\tw-framework-front
pnpm typecheck                               # exit 0 (AC-007)

# G-001~G-004 보존 입증 (AC-009 + D11)
cd D:\project\topvel_project\topvel-grid-monorepo
git diff packages/grid-core/src/Grid.tsx packages/grid-core/src/types.ts packages/grid-core/src/index.ts packages/grid-core/package.json
# Grid.tsx: L83 1줄만 변경 (D5)
# types.ts: defaultExpanded prop 1개 + BaseGridProps interface 신규
# src/index.ts: 5 alias + BaseGridProps re-export 추가
# package.json: exports field "./legacy" 추가
```

### 자동 보완 가능 항목

- 누락된 alias type export → `legacy/index.ts` re-export 명시 (Step 7 의무)
- `any` 우발 사용 → ESLint `@typescript-eslint/no-explicit-any` rule 차단
- 인라인 style 우발 → 본 G-005 alias는 인라인 style 0 (Tailwind className만 — base `<Grid>` 위임)
- `process.env.NODE_ENV` 가용성 → tsup external + Vite/Webpack 표준 환경 변수 (peer 환경 정상 처리)

---

## Section 13: 상용 제품화 영향

### F-01: 패키지 분류

본 Goal 대상 패키지: **`@tomis/grid-core` (`packages/grid-core`)** — **MIT** licenseTier (canonical-modules.json L75 + grid-core/package.json:5 `"license": "MIT"`).

`/legacy` sub-entry (D8) 도 동일 MIT 라이선스 — alias는 base wrapper compat shim.

### F-02: Pro 라이선스 검증

**N/A** — MIT 패키지. `configureGridLicense()` 호출 불필요.

### F-03: 문서 작성 계획 (C-25)

| 산출물 | 위치 | 작성 시기 |
|--------|------|----------|
| Storybook stories 9개 (Legacy/* — Section 12) | `packages/grid-core/src/__stories__/Legacy.stories.tsx` | post-Step 14 (부수 작업) |
| README.md 업데이트 (Legacy Aliases 섹션 + DEPRECATED 경고 + migration guide 링크) | `packages/grid-core/README.md` | post-Step 14 |
| Docusaurus 페이지 (Legacy Migration Guide — 5 alias from→to 표 + codemod 권장) | `apps/docs/docs/grid-core/legacy-migration.mdx` | MOD-GRID-99-B (별도 Goal F-99B-06) |
| API reference (TypeDoc) | 자동 생성 | MOD-GRID-99-B |
| ADR-MOD-GRID-01-006 (D8 — `/legacy` sub-entry 분리 정책 + tree-shake 사전 대비 + multi-entry 빌드) | `decisions/MOD-GRID-01-decisions.md` | post-Step 14 (D8 권장) |

### F-04: peerDependencies 정책 (C-22)

**peer 변경 0건** — 4 peer 그대로 (G-001~G-004 동일).

본 G-005는 alias compat shim — 신규 외부 dep 0. dep/peer 분리 위반 0건.

### F-05: 라이선스 명시 (C-24)

`package.json:5` `"license": "MIT"` 보존 + `LICENSE` 파일 존재 (monorepo root 또는 grid-core 직접). `/legacy` sub-entry도 동일 MIT 라이선스 — 별도 EULA 불필요.

---

## ★ 메타 게이트 H 자가 점검 (점수 산정 전 필수 통과)

### H-01: referenceEvidence 경로 실재 — YES

| 경로 | 검증 |
|------|------|
| `tw-framework-front/src/components/tomis/Grid/BaseGrid.tsx` | Read 확인 (L1-291, 291L) — Section 1 L0 표 |
| `tw-framework-front/src/components/tomis/Grid/VirtualGrid.tsx` | Read 확인 (L1-220) |
| `tw-framework-front/src/components/tomis/Grid/ColumnPinGrid.tsx` | Read 확인 (L1-220) |
| `tw-framework-front/src/components/tomis/Grid/GroupedHeaderGrid.tsx` | Read 확인 (L1-185) |
| `tw-framework-front/src/components/tomis/Grid/TreeGrid.tsx` | Read 확인 (L1-175) |
| `tw-framework-front/src/types/tomis/grid.ts` | Read 확인 (L1-71) |
| `tw-framework-front/src/pages/tomis/account/SlipListPage.tsx` | Grep+Read 확인 (L21,L1024,L1236) |
| `tw-framework-front/src/pages/tomis/account/AdminSlipEditPage.tsx` | Grep+Read 확인 (L15,L593,L605) |
| `tw-framework-front/src/pages/tomis/admin/MenuManagePage.tsx` | Grep+Read 확인 (L7,L157) |
| `tw-framework-front/src/pages/tomis/hr/DailyAttendancePage.tsx` | Grep 0 hit + Read 확인 (raw TanStack — L13/L461) |
| `tw-framework-front/src/pages/tomis/hr/AnnualLeaveStatusPage.tsx` | Grep 0 hit + Read 확인 (raw TanStack — L14/L386) |
| `topvel-grid-monorepo/packages/grid-core/src/Grid.tsx` | Read 확인 (L1-200, 434L 전체) |
| `topvel-grid-monorepo/packages/grid-core/src/types.ts` | Read 확인 (L1-460, 459L 전체) |
| `topvel-grid-monorepo/packages/grid-core/src/index.ts` | Read 확인 (L1-11) |
| `topvel-grid-monorepo/packages/grid-core/package.json` | Read 확인 (L1-29) |
| `topvel-grid-monorepo/packages/grid-core/src/internal/buildTableOptions.ts` | Read 확인 (L100-200, expanded wiring 검증) |
| `topvel-grid-monorepo/packages/grid-core/src/internal/useGridImperativeHandle.ts` | Read 확인 (L41 dev guard 패턴 차용) |
| `.claude/tw-grid/canonical-modules.json` | Read 확인 (L72/L75/L484-491) |
| `.claude/tw-grid/goals/MOD-GRID-01/wrapper-goals.json` | Read 확인 (L267-313 G-005) |
| `.claude/tw-grid/decisions/MOD-GRID-01-decisions.md` | Read 확인 (5 ADR 누적) |
| `.claude/tw-grid/references/current-tanstack-analysis.md` | 명시 인용 |
| `.claude/tw-grid/references/tanstack-api-inventory.md` | 명시 인용 |

→ 모든 referenceEvidence 경로 Read 또는 Grep으로 직접 확인. spec.md 라인 인용 의무 충족.

### H-02: implementFiles 경로 합리성 — YES

| 경로 | 검증 |
|------|------|
| `topvel-grid-monorepo/packages/grid-core/src/legacy/BaseGrid.tsx` (NEW) | 부모 `legacy/` 부재 — H-02 외부 디렉토리 예외 충족: 조부모 `topvel-grid-monorepo/packages/grid-core/src/` 실재 (ls 확인) + Section 8.2 명시 + 명명 컨벤션 (`legacy/` lowercase + `{Variant}.tsx` PascalCase) `internal/` 패턴과 일관 |
| `topvel-grid-monorepo/packages/grid-core/src/legacy/VirtualGrid.tsx` 외 4 NEW alias | 동일 |
| `topvel-grid-monorepo/packages/grid-core/src/legacy/index.ts` (NEW) | 동일 |
| `topvel-grid-monorepo/packages/grid-core/src/legacy/useDeprecationWarn.ts` (NEW) | 동일 |
| `topvel-grid-monorepo/packages/grid-core/src/Grid.tsx` (MODIFY) | 부모 `src/` 실재 |
| `topvel-grid-monorepo/packages/grid-core/src/types.ts` (MODIFY) | 부모 `src/` 실재 |
| `topvel-grid-monorepo/packages/grid-core/src/index.ts` (MODIFY) | 부모 `src/` 실재 |
| `topvel-grid-monorepo/packages/grid-core/package.json` (MODIFY) | 부모 `grid-core/` 실재 |
| `tw-framework-front/src/pages/tomis/account/SlipListPage.tsx` 외 사용처 3 (MODIFY) | TOMIS 내부 — 부모 디렉토리 실재 + Read 확인 |

→ H-02 통과 (외부 디렉토리 예외 + 모든 부모/조부모 실재).

### H-03: AC 출처 태그 검증 — YES

12 AC 모두 `source: L0/C-NN/D#` 태그 + 본문 인용 100%:
- AC-001: C-6 + C-4 + D11 (Section 2.1~2.5 + Section 4 + D11 표)
- AC-002: C-6 + D5 + D11 (Section 2.1~2.5 + Section 11.1)
- AC-003: C-23 + D3/D4 (Section 2.6 + Section 6 EC-01/EC-02)
- AC-004: L0 + D6 (Section 3 표 + D6 표)
- AC-005: C-6 + D11 (Section 2.9)
- AC-006: C-13/C-17 + D9 (Section 12 시각 회귀 + D9 표)
- AC-007: C-19 + D10 (Section 8.1 + Section 8.3)
- AC-008: C-21 + D7 (Section 8.5)
- AC-009: C-1 + D5 + D8 (Section 8.2)
- AC-010: C-12 + D13 (Section 11.1 Step 11)
- AC-011: C-13 + D5 (Section 6 EC-03 + Section 12)
- AC-012: C-25 (Section 13 F-03)

→ H-03 통과 (모든 AC 출처 태그 + spec 내 본문 인용 100%).

---

## Cross-consistency 표 (D# ↔ 본문 ↔ Section 7 ↔ Section 11 — rubric G-01 v1.0.4)

| D# | 결정 합계/breakdown | 본문 인용 | Section 7 행 매핑 | Section 11 Step 매핑 |
|----|-----|---------|------------------|---------------------|
| D1 | monorepo 경로 (C-28 N/A) | Section 7 헤더 + 8.1 + 8.2 | 모든 행 prefix `topvel-grid-monorepo/...` | Step 1-11 |
| D2 | NEW 7 + grid-core MODIFY 4 + 사용처 3 = 14 | Section 7 표 14행 + Section 11 Step 1-14 | 행 #1-14 | Step 1-14 |
| D3 | useDeprecationWarn 분리 | Section 2.6 + Section 7 행 #7 | 행 #7 (NEW) | Step 1 |
| D4 | dev warn ref guard 패턴 | Section 2.6 + EC-01/EC-02 | 행 #7 내부 구현 | Step 1 |
| D5 | TreeGrid `defaultExpanded` prop NEW | Section 2.5 + Section 7 행 #8 (Grid.tsx) + 행 #9 (types.ts) | 행 #8 (Grid.tsx MODIFY) + 행 #9 (types.ts MODIFY) | Step 8 + Step 9 |
| D6 | GroupedHeaderGrid basic shim + MOD-GRID-14 후속 | Section 2.4 + Section 5 AC-004 + Section 4 호환성 | 행 #4 (GroupedHeaderGrid alias NEW) | Step 5 |
| D7 | 번들 measure-then-decide (≤28.5/>28.5) | Section 8.5 + Section 11.1 Step 11 + Section 11.3 | 행 #11 (package.json) + Section 11.2 post-Step 11 size-limit gate | Step 11 + post-Step 11 |
| D8 | `/legacy` sub-entry + package.json exports | Section 2.7 + Section 7 행 #6 + 행 #10 + 행 #11 + Section 11.2 Step 7/10/11 | 행 #6 (legacy/index.ts) + 행 #10 (src/index.ts) + 행 #11 (package.json) | Step 7 + Step 10 + Step 11 |
| D9 | C-13 baseline 본 Goal 즉시 + 27 페이지 MOD-GRID-17 | Section 12 시각 회귀 + AC-006 정정 | (Section 12 stories — 5 stories + 3 사용처 baseline) | Step 13 |
| D10 | 사용처 5 nominal vs 3 actual | Section 3 + Section 7 행 #12-14 + Section 8.1 + Section 8.3 + AC-007 | 행 #12 (SlipList) + 행 #13 (AdminSlipEdit) + 행 #14 (MenuManage) | Step 12 + Step 13 + Step 14 |
| D11 | 5 alias props 매핑 (각 AS-IS defaults + wiring 보존) | Section 2.1~2.5 + Section 11.1 Step 2-6 | 행 #1-5 (5 alias NEW) | Step 2-6 |
| D12 | B-05 N/A (alias forwardRef 미사용) | Section 2.10 + AC-001 | (Section 7 행 X — surface 미확장) | (Step X — 추가 코드 없음) |
| D13 | tsup multi-entry MODIFY (또는 단일 entry fallback) | Section 7 부수 변경 + Section 11.1 Step 11 + Section 11.3 | (Section 7 행 미표기 — Implementer 결정) + 행 #11 (Step 11에서 결정) | Step 11 |

**Breakdown 일치 검증 (rubric G-01 v1.0.4)**:
- **합계 일치**: D2 명시 14 (NEW 7 + grid-core MODIFY 4 + 사용처 MODIFY 3) == Section 7 표 14 행 ✓
- **분류 일치**: D2 명시 NEW/MODIFY 카운트 (7 NEW + 4 grid-core MODIFY + 3 사용처 MODIFY) == Section 7 표 분류 (NEW 행 #1-7 + MODIFY 행 #8-11 + MODIFY 행 #12-14) ✓
- **항목 이름 일치**: D2 enumerate (BaseGrid + VirtualGrid + ColumnPinGrid + GroupedHeaderGrid + TreeGrid + index.ts + useDeprecationWarn.ts + Grid.tsx + types.ts + src/index.ts + package.json + SlipListPage + AdminSlipEditPage + MenuManagePage) == Section 7 표 행 이름 1:1 매칭 ✓
- **Section 11 Step ↔ Section 7 행 매핑**: Step 1 → 행 #7, Step 2 → 행 #1, Step 3 → 행 #2, Step 4 → 행 #3, Step 5 → 행 #4, Step 6 → 행 #5, Step 7 → 행 #6, Step 8 → 행 #8, Step 9 → 행 #9, Step 10 → 행 #10, Step 11 → 행 #11, Step 12 → 행 #12, Step 13 → 행 #13, Step 14 → 행 #14 ✓ (14/14 일치)

---

## TBD/TODO 검증 (rubric G-01)

본 spec에 `TBD`/`TODO`/`미정` 표현 0건. 모든 결정 명시 (D1~D13). 환경 의존 deviation은 Section 11.3 위험 표 + Section 6 EC-10 명시.

---

**Spec 작성 완료**. 상기 13 Section + D# 13개 + 메타 게이트 H 3 + Cross-consistency 표 모두 충족. Implementer는 본 spec을 single source of truth (C-27 권위)로 IMPLEMENT 진행 의무.
