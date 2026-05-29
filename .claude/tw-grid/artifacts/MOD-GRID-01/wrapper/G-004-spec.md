# G-004 Specification — Imperative API ref (GridHandle) + react-virtual 통합

**Module**: MOD-GRID-01 (공통 wrapper — variant 8 통합)
**Goal**: G-004
**Area**: wrapper
**Phase**: abstraction
**Priority**: P0
**migrationImpact**: high
**threshold**: 95 (specify/implement/verify 동일 — canonical-modules.json L72)
**spec 작성일**: 2026-05-14
**spec 버전**: v1.0 (loops 0/3, 첫 시도)
**의존**: MOD-GRID-01/G-001 (overallStatus=completed, score 100/100/100), MOD-GRID-01/G-002 (overallStatus=completed, score 100/100/100), MOD-GRID-01/G-003 (overallStatus=completed, score 100/100/100)

---

## ★ 사전 결정 표 (D# — 본문 cross-consistency 의무, rubric G-01 v1.0.4 강화)

| D# | 결정 | 본문 위치 | 출처 |
|----|------|----------|------|
| D1 | 구현 대상 monorepo `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/`. **wrapper-goals.json G-004 `implementFiles` 4개 모두 monorepo prefix 정확** — C-28 정정 불필요 (G-002/G-003 D1과 동일, G-001 D2와 대비). | Section 7 + 8.1 | wrapper-goals.json L227-232 Read 확인 |
| D2 | **NEW 2 + MODIFY 3 = 5 파일**. NEW: `internal/useGridVirtualizer.ts` + `internal/useGridImperativeHandle.ts`. MODIFY: `Grid.tsx` + `types.ts` + `index.ts`. **`package.json` 무수정** — `@tanstack/react-virtual ^3.0.0` peer는 G-001 시점에 이미 선언됨 (`grid-core/package.json:25` Read 확인). prompt의 "신규 peerDep" 프레이밍은 stale (G-001 spec Section 9 + ADR-MOD-GRID-01-001 Trade-off 항목에서 이미 4-peer 확정 — `react`/`react-dom`/`@tanstack/react-table`/`@tanstack/react-virtual`). 본 G-004는 **이미 선언된 peer의 첫 runtime wiring** — peer 선언 추가 X, ADR 의무는 여전히 적용 (D10). 단, **monorepo node_modules 미설치** 확인됨 (`D:/project/topvel_project/topvel-grid-monorepo/node_modules/@tanstack/`에 `react-table`만 존재) → **Step 0 사전 작업** = `pnpm add -DW @tanstack/react-virtual@^3.13.24` (workspace root devDep, AS-IS tw-framework-front 동일 버전 매칭). 본 Step 0은 monorepo `package.json` MODIFY 1건 — 5 파일 카운트에는 포함하지 않음 (lockfile/devDep 스캐폴딩, 핵심 spec surface 외부). | Section 7 표 (5행) + Section 11.1 Step 0 + Section 11.2 + AC-008 | grid-core/package.json:25 + monorepo/package.json Read + monorepo/node_modules ls + advisor item#2/#3 |
| D3 | **`addRow`/`deleteRow`/`updateRow` semantics — Callback-delegating 채택 (advisor item#1)**. Grid.tsx:46 `data: TData[]` 는 **controlled prop** (parent가 배열 owner). 따라서 GridHandle method 가 직접 mutation 불가. 정책: `ref.current.addRow(seed)` 호출 → 내부에서 `props.onAddRow?(seed)` invoke. parent 가 setState로 mutation 책임. **신규 3 prop 추가**: `onAddRow?: (seed?: Partial<TData>) => void`, `onDeleteRow?: (rowId: string \| number) => void`, `onUpdateRow?: (rowId: string \| number, patch: Partial<TData>) => void`. 호출자 미제공 시 dev mode `console.warn` 1회 + no-op (production silent — D11 선례 재사용). controlled philosophy 일관성 (G-001 buildTableOptions L116-155의 `onSortingChange`/`onPaginationChange` 패턴과 동일). **G-005/MOD-GRID-10 ChangeTrackingGrid alias는 internal trackedRows state 보유 → GridHandle 미사용 (직접 own handle)** — 본 G-004 base wrapper의 design 충돌 없음. | Section 2.1 GridHandle + Section 2.2 GridProps 추가 prop + AC-001 + Section 6 EC-04 | advisor item#1 + Grid.tsx:46 + buildTableOptions.ts:116-155 + ChangeTrackingGrid.tsx:110-112 |
| D4 | **forwardRef + generic cast 패턴 — ChangeTrackingGrid:215-217 차용**. TS 표준 `forwardRef` generic 미지원 → `forwardRef(GridInner) as <TData>(props: GridProps<TData> & { ref?: React.Ref<GridHandle<TData>> }) => React.ReactElement` 패턴. AS-IS template 그대로 (ref props.children 부재 — table 그리드는 children prop 없음). component displayName='Grid' 보존 (DevTools UX). | Section 2.3 + Section 11.1 Step 4 + AC-002 | ChangeTrackingGrid.tsx:215-217 직접 Read |
| D5 | **virtualization × G-002 sticky/pinning 호환 — Padding-row 패턴 (advisor item#4 P1)**. VirtualGrid.tsx:122-198의 "두 `<table>` + absolute-positioned `<tr>`" 패턴은 G-002의 single-table sticky thead + pinned column model을 깨뜨림. 채택안: **single `<table>` 내에서 padding row 패턴** — `<tbody>` 첫 자식 `<tr>` height = `virtualItems[0]?.start ?? 0`, 마지막 자식 `<tr>` height = `totalSize - (virtualItems[last]?.end ?? 0)`. 중간에 virtualItems 만 렌더. G-002 `<thead sticky>` + pinned cell sticky CSS + border-separate/divide-y 분기 모두 보존. TanStack v8 표준 패턴 (`virtual-core/dist/esm/index.d.ts` 의 `getVirtualItems`/`getTotalSize` 직접 사용). | Section 2.4 + Section 11.1 Step 4 (Grid.tsx tbody virtual 분기) + AC-003/AC-004 + Section 6 EC-05 | advisor item#4 + VirtualGrid.tsx:122-198 + Grid.tsx:159-211 (G-002 sticky/pinning 보존 대상) + virtual-core API |
| D6 | **`enableVirtualization` 활성 정책 — opt-in only (자동 임계값 X)**. `enableVirtualization=true` 시에만 virtual 분기 (data.length 무관). 임계값 자동 활성(예: data.length > 1000)은 채택 안 함 — 사용자가 scroll container 높이 (`virtualScrollHeight`) 를 명시적으로 지정해야 가상화가 의미 있음 (default container height 가정 시 short list에서 부적절). 사용자 책임 명시 — JSDoc + Section 6 EC. **ChangeTrackingGrid alias (MOD-GRID-10) 는 enableVirtualization off 유지** (자체 internal state — virtual 비호환). | Section 2.2 + AC-003 + Section 6 EC-06 | spec 자체 결정 — VirtualGrid.tsx:32 `containerHeight` 사용자 명시 패턴 + advisor item#4 |
| D7 | **`virtualScrollHeight` prop 신규** — virtualization 시 scroll container 높이 지정 (default `400px`). `enableVirtualization=true && virtualScrollHeight 미지정` 시 default 400 적용 + dev console.warn 1회 (사용자 의도 명시 권장). VirtualGrid.tsx:32 `containerHeight = 500` 패턴 차용하되 기본값 보수적 축소. | Section 2.2 + AC-003 + Section 6 EC-07 | VirtualGrid.tsx:32 + spec 자체 결정 |
| D8 | **`virtualizerOptions.estimateSize` default = `36`** (GridProps numerical, BaseGrid.tsx:122 `<td className="px-4 py-3">` height 추정 ≈ 36px), **`overscan` default = `10`** (VirtualGrid.tsx:102 동일). 사용자 override 가능. `useVirtualizer` API는 `estimateSize: (index: number) => number` 함수 시그니처 (`virtual-core/dist/esm/index.d.ts:51`) — 본 hook 내부에서 `() => virtualizerOptions.estimateSize ?? 36` 으로 wrap. 동적 행 높이 대응은 `measureElement` ref 패턴 (TanStack 표준). | Section 2.4 useGridVirtualizer + AC-003/AC-004 | virtual-core API + VirtualGrid.tsx:101-102 + advisor item#7 |
| D9 | **`scrollTo(index, options?)` 시그니처 — virtualizer.scrollToIndex 위임**. `virtual-core/dist/esm/index.d.ts:135` `scrollToIndex(index, { align?, behavior? })` API 그대로 노출. **enableVirtualization=false 시 fallback** = `tableRef.current?.querySelector(\`tbody tr[data-index="${index}"]\`)?.scrollIntoView({...})` (native DOM scroll). 두 모드 모두 음수/length 초과 index → **clamp [0, data.length-1]** + dev warn (advisor item#8 보안 UX). `scrollTo` GridHandle 의 옵션 타입 = `{ align?: 'start'\|'center'\|'end'\|'auto'; behavior?: 'auto'\|'smooth'\|'instant' }` (virtual-core ScrollToOptions 그대로 re-export). | Section 2.1 GridHandle + Section 2.4 + AC-003 + Section 6 EC-08 | virtual-core API + advisor item#8 |
| D10 | **C-20 ADR-MOD-GRID-01-005 작성 의무 — 본 Goal 신규 (peer 선언 추가 X, runtime wiring 첫 도입 + Step 0 devDep 설치)**. trade-off ≥2: (a) `@tanstack/react-virtual` v3 채택 vs `react-window` 대안 (선택: TanStack ecosystem 일관성, react-window는 별도 API + memorize-row 패턴 강제), (b) padding-row 패턴 채택 vs 두-`<table>` absolute 패턴 (D5 결정 인용), (c) opt-in `enableVirtualization` 대 자동 임계값 (D6 결정 인용). 라이선스 MIT (peer 동일). 번들: workspace devDep만이라 grid-core 번들 무영향 (peer external — `tsup.config.ts:14` external 배열 이미 포함). | Section 4 호환성 + Section 9 의존성 + Section 13 ADR | C-20 + 본 D# 누적 |
| D11 | **`refresh()` semantics — `table.resetRowSelection()` + dev JSDoc 명시** (advisor item#8). TanStack `table.reset()` 은 모든 state reset(sort/filter/pagination 모두 잃음 — UX 회귀 위험) → 채택 안 함. 채택안: `refresh()` 호출 시 `table.resetRowSelection()` 1회 호출 + JSDoc "data prop 변경은 자동 re-render 됨. refresh() 는 내부 selection state 재산정 trigger 용 (예: data sort 변경 시 stale selection key 정리)" 명시. AG api.refreshCells() 와 등가성 의도 명시. | Section 2.1 GridHandle.refresh + AC-001 | advisor item#8 + TanStack table.reset/resetRowSelection API |
| D12 | **`getSelection()` / `clearSelection()` — TanStack table 직접 위임**. `getSelection()` = `table.getSelectedRowModel().rows.map(r => r.original)` → `TData[]` 반환 (Row<TData> 객체 X — 호출자 가독성 + alias 호환). `clearSelection()` = `table.setRowSelection({})`. AggridTable gridRef + AG api.deselectAll() 패턴 (`AggridTreeTable.tsx:147`) 와 의미 등가. | Section 2.1 GridHandle + AC-001 | TanStack table API + AggridTreeTable.tsx:147 |
| D13 | **번들 D7 게이트 활성 (G-002 D7 + G-003 D10 inherit, ADR-MOD-GRID-01-004 실측 trajectory 반영)**. ADR-004 실측: G-001 17.44 KB + G-002+G-003 누적 +0.91 KB → **현재 18.35 KB / 30 KB**. 예상 spec +7 KB는 ADR-003/004 추세상 14% 효율 → 실측 +1~1.5 KB 가능 → 누적 ~19.5~20 KB / 30 KB (한도 67%). G-005 +5 KB도 동일 trajectory 적용 시 +0.7 KB → 누적 ~20.7 KB. **prompt의 "한도 0.35 KB 초과 위험" 산술은 stale (실측 추세 미반영)** — 그러나 측정 게이트 자체는 discipline으로 유지: G-004 implement 직후 `pnpm size-limit` 측정 (Step 8). 누적 > 25 KB 시에만 G-005 분리(`@tomis/grid-core/legacy` sub-entry) 검토 트리거. 현재 추세상 분리 트리거 발동 가능성 낮음 (advisor item#6). | Section 8.5 + Section 11.2 Step 8 | ADR-MOD-GRID-01-004 실측 + advisor item#6 |

---

## Section 1: 참조 추적

### L0: 현 구현 (tw-framework-front + monorepo G-001~G-003 산출물)

**파일 경로 + Read 확인 (2026-05-14)**:

| 파일 | Read 라인 | 본 G-004에서 흡수 / MODIFY 핵심 |
|------|----------|-----------------------------|
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx` | L1-220 (전체) | L1 `forwardRef`/`useImperativeHandle` import, L12-17 `ChangeTrackingHandle<TData>` interface, L36-46 `ChangeTrackingGridInner` forwardRef inner, L110-112 `useImperativeHandle(ref, ()=>(...), [deps])`, **L215-217 forwardRef + generic cast 패턴** (D4 직접 차용) |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/VirtualGrid.tsx` | L1-220 (전체) | L12 `useVirtualizer` import, L98-103 useVirtualizer 호출(`count, getScrollElement, estimateSize, overscan`), L105 getVirtualItems, L106 getTotalSize, **L165 `rows[virtualRow.index]` 매핑 패턴**, L170 `ref={virtualizer.measureElement}`, L162 absolute-positioned `<table>` (★ D5에서 **회피** 대상), L32 `containerHeight = 500` (D7 차용) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/Grid.tsx` | L1-278 (전체, G-001+G-002+G-003 산출물) | **D11 보존 대상**. L46 `function Grid<TData>(props): JSX.Element` (D4 forwardRef 변환 대상), L47-77 internal state + buildTableOptions 호출, L86-91 useAutoSelectFirstRow, L117 sticky thead + 단일 `<table>` (D5 보존), L159-211 tbody markup (D5 virtual 분기 추가) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` | L1-291 (전체) | **D11 보존 대상**. L19 import { MouseEvent, ReactNode } (확장), L112-290 GridProps 24 prop (D3 신규 4 prop + D9 `virtualScrollHeight` + D6 `enableVirtualization` + D8 `virtualizerOptions` 추가), L40 RowSelectionMode export |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` | L1-10 (전체) | **MODIFY** — `export type { GridHandle, GridScrollToOptions, GridVirtualizerOptions } from './types'` 추가 (D2) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/package.json` | L1-30 (전체) | **L25 `@tanstack/react-virtual: ^3.0.0`** peer 이미 선언됨 → MODIFY 불필요 (D2) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/buildTableOptions.ts` | L1-205 (전체) | L116-155 controlled callback 패턴 — D3 `onAddRow`/`onDeleteRow`/`onUpdateRow` 정책 정합 근거 (delegating handle) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/CheckboxColumn.tsx` | L1-58 (전체) | L49 `onClick={(e)=>e.stopPropagation()}` — virtual scroll 컨테이너 내 checkbox click 보존 |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/tsup.config.ts` | L1-21 (전체) | L13-20 external 배열에 `@tanstack/react-virtual` 이미 포함 — peer external 안전성 확인 (번들 영향 0) |
| `D:/project/topvel_project/topvel-grid-monorepo/.size-limit.json` | L1-7 (entry) | grid-core 30 KB brotli 한도 (D13 게이트) |
| `D:/project/topvel_project/topvel-grid-monorepo/package.json` | L1-30 (전체) | devDependencies에 `@tanstack/react-virtual` 부재 → **D2 Step 0 의무** (`pnpm add -DW @tanstack/react-virtual@^3.13.24`) |
| `D:/project/topvel_project/TOMIS/tw-framework-front/node_modules/@tanstack/react-virtual/package.json` | L1-3 (`version: 3.13.24`) | AS-IS 동일 버전 매칭 (D2) |
| `D:/project/topvel_project/TOMIS/tw-framework-front/node_modules/@tanstack/virtual-core/dist/esm/index.d.ts` | L1-200 (API surface) | `VirtualizerOptions` (L46-77), `Virtualizer` 클래스 (L78+), `scrollToIndex(index, {align, behavior})` (L135), `getVirtualItems()`/`getTotalSize()`/`measureElement` 시그니처 (D5/D8/D9 근거) |

**핵심 발췌 1 — ChangeTrackingGrid forwardRef + generic cast (ChangeTrackingGrid.tsx:215-217)** (D4 직접 차용):

```tsx
const ChangeTrackingGrid = forwardRef(ChangeTrackingGridInner) as <TData extends object>(
  props: ChangeTrackingGridProps<TData> & { ref?: React.Ref<ChangeTrackingHandle<TData>> }
) => React.ReactElement;
```

→ **D4 결정**: 본 G-004는 `<TData>` (without `extends object` — Grid는 generic 자유도 보존, types.ts L112 `GridProps<TData>` 와 일관) 동일 패턴 사용. 본 cast는 TS 한계 회피 (forwardRef는 generic 컴포넌트 native 미지원).

**핵심 발췌 2 — ChangeTrackingGrid useImperativeHandle (ChangeTrackingGrid.tsx:110-112)** (handle 매핑 패턴 차용):

```tsx
useImperativeHandle(ref, () => ({ getChanges, resetChanges, addRow, deleteRow }), [
  getChanges, resetChanges, addRow, deleteRow,
]);
```

→ **D2/D4 결정**: 본 G-004 `useGridImperativeHandle` 헬퍼가 동일 패턴 (deps 명시). 단 ChangeTrackingGrid는 internal trackedRows state 보유 → 자체 mutation OK. **G-004 base wrapper는 controlled data → callback 위임** (D3).

**핵심 발췌 3 — VirtualGrid useVirtualizer 호출 (VirtualGrid.tsx:98-103)** (D5/D8 근거):

```tsx
const virtualizer = useVirtualizer({
  count: rows.length,
  getScrollElement: () => scrollContainerRef.current,
  estimateSize: () => rowHeight,
  overscan: 10,
});
```

→ **D5/D8**: 본 G-004 `useGridVirtualizer` hook 동일 4-옵션 wiring. `estimateSize` 함수 시그니처 (`(index: number) => number`)는 virtual-core API 표준 — 본 G-004 hook은 `() => options.estimateSize ?? 36` 으로 단순화 (advisor item#7).

**핵심 발췌 4 — VirtualGrid virtualRow.index 매핑 + 두 `<table>` 패턴 (VirtualGrid.tsx:162-194)** (★ D5 회피 대상):

```tsx
<table className="min-w-full text-sm" style={{ position: 'absolute', top: 0, left: 0, width: '100%' }}>
  <tbody>
    {virtualItems.map((virtualRow) => {
      const row = rows[virtualRow.index];   // ★ virtualRow.index 매핑 패턴 (D5 채택, AC-004)
      return (
        <tr
          key={row.id}
          ref={virtualizer.measureElement}
          style={{ top: virtualRow.start, height: virtualRow.size }}
          ...
```

→ **D5 결정**: VirtualGrid의 두 `<table>` (thead 별도, tbody absolute) 분리 패턴은 **G-002 sticky thead + pinned column 모델 호환 X** (단일 `<table>` 가정). 본 G-004는 **single `<table>` + padding-row** 채택. virtualRow.index 매핑은 그대로 흡수 (AC-004 `rows[virtualRow.index]`).

**핵심 발췌 5 — virtual-core API surface (`virtual-core/dist/esm/index.d.ts`)** (D8/D9 근거):

```ts
export interface VirtualizerOptions<TScrollElement, TItemElement> {
  count: number;
  getScrollElement: () => TScrollElement | null;
  estimateSize: (index: number) => number;       // ★ 함수 시그니처 (D8)
  overscan?: number;
  // ... (L46-77)
}
export class Virtualizer<TScrollElement, TItemElement> {
  scrollToIndex: (index: number, { align, behavior }?: ScrollToIndexOptions) => void;  // ★ L135 (D9)
  getVirtualItems: () => VirtualItem[];
  getTotalSize: () => number;
  measureElement: (node: TItemElement | null) => void;
}
export interface ScrollToOptions {
  align?: 'start' | 'center' | 'end' | 'auto';
  behavior?: 'auto' | 'smooth' | 'instant';
}
```

### L1: TanStack v8 표준 API

**파일 + Read 확인**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/tanstack-api-inventory.md` §5 (가상화 호환).

핵심 시그니처 (본 G-004 사용):

```ts
// useVirtualizer (react-virtual L4-5)
export function useVirtualizer<TScrollElement extends Element, TItemElement extends Element>(
  options: PartialKeys<ReactVirtualizerOptions<TScrollElement, TItemElement>, 'observeElementRect' | 'observeElementOffset' | 'scrollToFn'>
): Virtualizer<TScrollElement, TItemElement>;

// TanStack table API (G-001/G-003 이미 사용)
interface Table<TData> {
  setRowSelection: OnChangeFn<RowSelectionState>;          // D11/D12
  resetRowSelection: (defaultState?: boolean) => void;     // ★ D11 refresh()
  getSelectedRowModel: () => RowModel<TData>;              // ★ D12 getSelection()
  getRowModel: () => RowModel<TData>;
}
```

본 G-004는 위 표준 export만 사용 — private API 접근 0 (C-2 준수).

### L2: 8 variant 공통 패턴 (DRY 추출)

**파일 + Read 확인**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/current-tanstack-analysis.md` §5 + §1.

| 중복 패턴 | 사용 variant | G-004에서 흡수 |
|----------|------------|----------------|
| useImperativeHandle handle | 1/8 (ChangeTrackingGrid only — L110-112) | ✅ NEW useGridImperativeHandle (D2/D4) — base wrapper로 일반화 |
| useVirtualizer wiring | 1/8 (VirtualGrid only — L98-103) | ✅ NEW useGridVirtualizer (D2) — base wrapper로 일반화 |
| virtualRow.index 매핑 | 1/8 (VirtualGrid only — L165) | ✅ Grid.tsx tbody 분기 (D5 padding-row) |

### L3: 영향 사용처

본 G-004는 **G-001~G-003 기반 ref + virtualization 추가** — `affectedUsageFiles: []` (wrapper-goals.json G-004 L233).

사용처 마이그레이션 (참고 — 본 Goal 범위 외):
- **G-005** legacy alias 5종 (`legacy/VirtualGrid.tsx` 등) — `enableVirtualization` 매핑 진입점
- **MOD-GRID-10** ChangeTrackingGrid alias — internal state owner이라 GridHandle 미사용 (자체 handle)
- **MOD-GRID-17** 페이지 27개 점진 마이그레이션 — `ref` + `scrollTo` imperative API 직접 활용 가능

### R-A: AG Grid 패턴 (참조 — C-7 코드 차용 금지)

**파일 + Read 확인**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-aggrid-analysis.md` §3 + AggridTable.tsx + AggridTreeTable.tsx Grep 검증.

| AG 패턴 | 본 G-004 채택 |
|--------|--------------|
| `gridRef` 외부 노출 (AggridTable.tsx:51 + AggridTreeTable.tsx:382) | ✅ D4 — forwardRef 변환 + GridHandle 노출 |
| AG `api.scrollToIndex(index)` 또는 `api.ensureNodeVisible(rowNode)` (AggridTreeTable.tsx:345) | ✅ D9 — `GridHandle.scrollTo(index, options?)` (virtualizer.scrollToIndex 위임) |
| AG `api.deselectAll()` (AggridTreeTable.tsx:147) | ✅ D12 — `GridHandle.clearSelection()` |
| AG `api.refreshCells()` 의미 등가성 | ✅ D11 — `GridHandle.refresh()` (table.resetRowSelection 위임) |

### R-W: Wijmo 패턴 (참조 — C-16 import 금지)

**파일 + Read 확인**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-wijmo-analysis.md` §3.

| Wijmo 패턴 | 본 G-004 흡수 |
|----------|--------------|
| FlexGrid `g.scrollIntoView(row, col)` | D9 GridHandle.scrollTo(index, options) — row index 단위 단순화 |
| FlexGrid host 컴포넌트 ref API | D4 forwardRef 패턴 (TanStack 표준 흡수) |

### migrationImpact: high (사유)

본 G-004 자체는 신규 prop + ref 추가 — 영향 0 사용처. 단:
1. **D4 forwardRef 변환** — Grid component 시그니처 변경 (`function Grid<TData>(props)` → `forwardRef`). 호출 사이트는 ref optional이라 backward-compatible이지만, 타입 추론 차이 발생 가능 (`React.ReactElement` 반환).
2. **D5 virtualization markup 분기** — single-table padding-row 패턴 도입. enableVirtualization=false 경로는 G-001~G-003 그대로 보존이지만 virtual=true 분기 자체가 G-002 sticky/pinning 호환 위험 표면 신규 도입.
3. **D2 Step 0 monorepo devDep 추가** — pnpm-lock.yaml 변경 발생.

→ canonical-modules.json L71 `migrationImpact: high` 일치.

---

## Section 2: API 계약 (TypeScript)

### 2.1 `interface GridHandle<TData>` (NEW — types.ts MODIFY)

**파일 위치**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` (MODIFY — D2)

```ts
// types.ts MODIFY — GridHandle 신규 export
import type { ScrollToOptions as VirtualScrollToOptions } from '@tanstack/react-virtual';   // ★ G-004 신규

/**
 * `<Grid>` ref 노출 imperative handle (G-004 D4).
 *
 * 사용 예시:
 * ```tsx
 * const gridRef = useRef<GridHandle<User>>(null);
 * <Grid<User> ref={gridRef} data={users} columns={columns} onAddRow={(seed) => setUsers(prev => [...prev, {...defaults, ...seed}])} />
 * gridRef.current?.scrollTo(50);
 * gridRef.current?.getSelection();   // User[]
 * ```
 *
 * @typeParam TData - 행 데이터 타입.
 *
 * @remarks
 * **데이터 mutation 정책 (D3 callback delegating)**:
 * - `addRow` / `deleteRow` / `updateRow` 는 props.data가 controlled 이므로 **GridHandle method 가 직접 mutation 불가**.
 * - 호출 시 props.onAddRow / onDeleteRow / onUpdateRow 콜백을 invoke. parent가 setState 책임.
 * - 핸들러 미제공 시 dev mode `console.warn` 1회 + no-op (production silent).
 * - `<ChangeTrackingGrid>` (MOD-GRID-10) 는 internal state owner — 자체 handle 사용 (본 GridHandle 미사용).
 *
 * @see G-004-spec.md Section 2.1 + D3/D4
 */
export interface GridHandle<TData> {
  /**
   * 행 추가 — props.onAddRow(seed?) 콜백 위임 (D3).
   * 콜백 미제공 시 dev mode console.warn.
   */
  addRow: (seed?: Partial<TData>) => void;

  /**
   * 행 삭제 — props.onDeleteRow(rowId) 콜백 위임 (D3).
   * `rowId` = TanStack `row.id` (default = row index string).
   */
  deleteRow: (rowId: string | number) => void;

  /**
   * 행 부분 업데이트 — props.onUpdateRow(rowId, patch) 콜백 위임 (D3).
   */
  updateRow: (rowId: string | number, patch: Partial<TData>) => void;

  /**
   * 인덱스 행으로 스크롤 (D9).
   *
   * - `enableVirtualization=true` 시 `virtualizer.scrollToIndex(index, options)` 위임 (virtual-core API).
   * - `enableVirtualization=false` 시 native DOM `tbody tr[data-index="N"].scrollIntoView({...})` fallback.
   * - 음수/length 초과 index → clamp `[0, data.length-1]` + dev console.warn.
   */
  scrollTo: (index: number, options?: GridScrollToOptions) => void;

  /**
   * 현재 선택된 행 데이터 배열 반환 — `table.getSelectedRowModel().rows.map(r => r.original)` 위임 (D12).
   * 빈 배열 = 선택 없음.
   */
  getSelection: () => TData[];

  /**
   * 모든 선택 해제 — `table.setRowSelection({})` 위임 (D12).
   * AG `api.deselectAll()` 등가.
   */
  clearSelection: () => void;

  /**
   * 내부 상태 재산정 — `table.resetRowSelection()` 위임 (D11).
   *
   * @remarks
   * data prop 변경은 자동 re-render 됨. refresh() 는 stale selection key 정리 등 selection state
   * 재산정 trigger 용 (예: data sort 변경 후 동일 rowId 가 다른 row 가리킬 때).
   * AG `api.refreshCells()` 와 의미 등가.
   * `table.reset()` 은 sort/filter/pagination 모두 reset → UX 회귀 위험 — 채택 안 함 (D11).
   */
  refresh: () => void;
}

/**
 * `GridHandle.scrollTo` 옵션 (D9).
 * `@tanstack/react-virtual` `ScrollToOptions` 와 시그니처 동일 — virtual=false 시도 동일 의미 적용 (DOM scrollIntoView).
 */
export type GridScrollToOptions = VirtualScrollToOptions;
```

### 2.2 `interface GridProps<TData>` 추가 (D3/D6/D7/D8 — types.ts MODIFY)

기존 G-001~G-003 GridProps (types.ts L112-290) 보존 (D11 + AC-008). 본 G-004 변경:
- (a) **3개 prop NEW** (D3): `onAddRow`, `onDeleteRow`, `onUpdateRow`
- (b) **3개 prop NEW** (D6/D7/D8): `enableVirtualization`, `virtualScrollHeight`, `virtualizerOptions`

```ts
// types.ts MODIFY — GridProps<TData> 멤버 추가
export interface GridProps<TData> {
  // ─── (G-001/G-002/G-003 기존 24 prop 모두 보존 — D11) ───

  // ─── G-004 신규: 데이터 mutation 콜백 (D3) ───
  /**
   * 행 추가 콜백 — `ref.current.addRow(seed?)` 호출 시 invoke (D3).
   * controlled data 정책: parent가 props.data 배열에 새 row append 책임.
   *
   * @example
   * ```tsx
   * const [rows, setRows] = useState<User[]>([]);
   * <Grid
   *   ref={gridRef}
   *   data={rows}
   *   onAddRow={(seed) => setRows((prev) => [...prev, { id: Date.now(), name: '', ...seed }])}
   * />;
   * gridRef.current?.addRow({ name: '신규' });
   * ```
   *
   * @see G-004-spec.md Section 2.1 + D3
   */
  onAddRow?: (seed?: Partial<TData>) => void;

  /**
   * 행 삭제 콜백 — `ref.current.deleteRow(rowId)` 호출 시 invoke (D3).
   * `rowId` = TanStack `row.id` (default = row index string).
   *
   * @see G-004-spec.md Section 2.1 + D3
   */
  onDeleteRow?: (rowId: string | number) => void;

  /**
   * 행 부분 업데이트 콜백 — `ref.current.updateRow(rowId, patch)` 호출 시 invoke (D3).
   *
   * @see G-004-spec.md Section 2.1 + D3
   */
  onUpdateRow?: (rowId: string | number, patch: Partial<TData>) => void;

  // ─── G-004 신규: 가상화 (D6/D7/D8) ───
  /**
   * 가상화 활성 (default `false`) — opt-in only (D6).
   * `true` 시 `useGridVirtualizer` 활성 + tbody padding-row 패턴 적용.
   * `false` 시 G-001~G-003 markup 그대로 (G-002 sticky/pinning 보존).
   *
   * @remarks
   * - 자동 임계값(예: data.length > 1000) 미적용 — short list 부적절성 회피 (D6).
   * - 활성 시 `virtualScrollHeight` 명시 권장 (미명시 시 default 400 + dev warn).
   * - G-002 sticky thead + pinning 호환 (single-table padding-row, D5).
   *
   * @see G-004-spec.md Section 2.4 + D5/D6
   */
  enableVirtualization?: boolean;

  /**
   * 가상화 시 scroll container 높이 (px, default `400`) (D7).
   * `enableVirtualization=true` 일 때만 효과 발휘.
   *
   * @see G-004-spec.md Section 2.4 + D7
   */
  virtualScrollHeight?: number;

  /**
   * `useVirtualizer` 옵션 override (D8).
   *
   * - `estimateSize`: 행 높이 추정 px (default `36`, BaseGrid `<td className="px-4 py-3">` 기준).
   * - `overscan`: viewport 위/아래 버퍼 행 (default `10`, VirtualGrid:102 동일).
   *
   * @see G-004-spec.md Section 2.4 + D8
   */
  virtualizerOptions?: {
    estimateSize?: number;
    overscan?: number;
  };
}
```

### 2.3 `function Grid` → `forwardRef` 변환 (Grid.tsx MODIFY — D4)

**파일 위치**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/Grid.tsx` (MODIFY — D2)

```tsx
// Grid.tsx MODIFY — forwardRef 변환 (D4)
import { forwardRef, useRef, type CSSProperties, type Ref } from 'react';
// ... (G-001~G-003 기존 import 보존)
import { useGridImperativeHandle } from './internal/useGridImperativeHandle';
import { useGridVirtualizer } from './internal/useGridVirtualizer';
import type { GridHandle, GridProps } from './types';

function GridInner<TData>(
  props: GridProps<TData>,
  ref: Ref<GridHandle<TData>>,
): JSX.Element {
  // ─── (G-001~G-003 기존 본문 모두 보존 — D11) ───
  // useState, buildTableOptions, useReactTable, useAutoSelectFirstRow ...

  // G-004: scroll container ref (virtualization wiring 시 필요)
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // G-004: useGridVirtualizer (enableVirtualization=true 시만 active)
  const virtualizer = useGridVirtualizer<TData>(
    table,
    scrollContainerRef,
    props.enableVirtualization === true,
    props.virtualizerOptions,
  );

  // G-004: useGridImperativeHandle (ref 노출)
  useGridImperativeHandle<TData>(ref, table, virtualizer, scrollContainerRef, {
    onAddRow: props.onAddRow,
    onDeleteRow: props.onDeleteRow,
    onUpdateRow: props.onUpdateRow,
    dataLength: props.data.length,
  });

  // ─── (G-001~G-003 기존 markup — Grid.tsx:114-277 — D11 보존) ───
  // tbody 분기만 D5 virtual 분기 추가 (Section 2.4)

  return (/* ... */);
}

/**
 * 통합 Grid 컴포넌트 (G-004: forwardRef + GridHandle ref API).
 *
 * @typeParam TData - 행 데이터 타입.
 */
export const Grid = forwardRef(GridInner) as <TData>(
  props: GridProps<TData> & { ref?: Ref<GridHandle<TData>> }
) => React.ReactElement;
// (D4: ChangeTrackingGrid.tsx:215-217 패턴 차용 — TS forwardRef generic 한계 회피 cast)
```

### 2.4 `internal/useGridVirtualizer.ts` 시그니처 (NEW — D2/D5/D8)

**파일 위치**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/useGridVirtualizer.ts` (NEW — D2)

```ts
// internal/useGridVirtualizer.ts (NEW — D2/D5/D8)
import { useVirtualizer, type Virtualizer } from '@tanstack/react-virtual';
import type { RefObject } from 'react';
import type { Table } from '@tanstack/react-table';

const DEFAULT_ESTIMATE_SIZE = 36;   // D8: BaseGrid <td className="px-4 py-3"> 기준
const DEFAULT_OVERSCAN = 10;        // D8: VirtualGrid.tsx:102 동일

export interface UseGridVirtualizerOptions {
  estimateSize?: number;
  overscan?: number;
}

/**
 * `<Grid enableVirtualization />` 시 `useVirtualizer` wiring (G-004 D5/D8).
 *
 * @param table - TanStack table 인스턴스.
 * @param scrollContainerRef - scroll 컨테이너 ref (`<div ref>`).
 * @param enabled - `props.enableVirtualization` 그대로 전달.
 * @param options - 사용자 override (estimateSize/overscan).
 * @returns `enabled=true` 시 Virtualizer 인스턴스, `false` 시 `null`.
 *
 * @remarks
 * - `enabled=false` 시 `useVirtualizer` 호출 자체 skip은 React rules-of-hooks 위반 → 항상 호출하되 count=0
 *   으로 사실상 비활성화. 반환값만 enabled에 따라 분기.
 * - `estimateSize` virtual-core API는 `(index: number) => number` 함수 시그니처.
 *   본 hook 은 사용자 number prop을 함수로 wrap (D8).
 * - `measureElement`는 virtualizer 인스턴스 method 노출 — 사용처(Grid.tsx tbody)에서 `<tr ref={virtualizer.measureElement}>` 직접 사용 (동적 행 높이 대응 — VirtualGrid.tsx:170 패턴).
 *
 * @see G-004-spec.md Section 2.4 + D5/D8
 */
export function useGridVirtualizer<TData>(
  table: Table<TData>,
  scrollContainerRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  options?: UseGridVirtualizerOptions,
): Virtualizer<HTMLDivElement, HTMLTableRowElement> | null;
```

### 2.5 `internal/useGridImperativeHandle.ts` 시그니처 (NEW — D2/D3/D4/D9/D11/D12)

**파일 위치**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/useGridImperativeHandle.ts` (NEW — D2)

```ts
// internal/useGridImperativeHandle.ts (NEW — D2)
import { useImperativeHandle, type RefObject, type Ref } from 'react';
import type { Table } from '@tanstack/react-table';
import type { Virtualizer } from '@tanstack/react-virtual';
import type { GridHandle, GridScrollToOptions } from '../types';

export interface UseGridImperativeHandleParams<TData> {
  onAddRow?: (seed?: Partial<TData>) => void;
  onDeleteRow?: (rowId: string | number) => void;
  onUpdateRow?: (rowId: string | number, patch: Partial<TData>) => void;
  dataLength: number;       // D9 clamp 계산용
}

/**
 * `<Grid ref>` 의 `useImperativeHandle` 매핑 헬퍼 (G-004 D3/D4/D9/D11/D12).
 *
 * @see G-004-spec.md Section 2.5
 */
export function useGridImperativeHandle<TData>(
  ref: Ref<GridHandle<TData>>,
  table: Table<TData>,
  virtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement> | null,
  scrollContainerRef: RefObject<HTMLDivElement | null>,
  params: UseGridImperativeHandleParams<TData>,
): void;
```

**내부 동작 명세** (Section 11 Step 3 구현 기준):

```ts
useImperativeHandle(ref, () => ({
  addRow: (seed) => {
    if (!params.onAddRow) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[tomis/grid-core] addRow() called but no onAddRow prop provided. No-op.');
      }
      return;
    }
    params.onAddRow(seed);
  },
  deleteRow: (rowId) => {
    if (!params.onDeleteRow) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[tomis/grid-core] deleteRow() called but no onDeleteRow prop provided. No-op.');
      }
      return;
    }
    params.onDeleteRow(rowId);
  },
  updateRow: (rowId, patch) => {
    if (!params.onUpdateRow) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[tomis/grid-core] updateRow() called but no onUpdateRow prop provided. No-op.');
      }
      return;
    }
    params.onUpdateRow(rowId, patch);
  },
  scrollTo: (index, options) => {
    // D9 clamp + dev warn
    const clamped = Math.max(0, Math.min(index, params.dataLength - 1));
    if (clamped !== index && process.env.NODE_ENV !== 'production') {
      console.warn(`[tomis/grid-core] scrollTo(${index}) out of range [0, ${params.dataLength - 1}]. Clamped to ${clamped}.`);
    }
    if (virtualizer) {
      virtualizer.scrollToIndex(clamped, options);   // D9 virtual-core 위임
      return;
    }
    // D9 fallback — DOM scrollIntoView
    const tr = scrollContainerRef.current?.querySelector(`tr[data-index="${clamped}"]`);
    if (tr instanceof HTMLElement) {
      tr.scrollIntoView({
        behavior: options?.behavior === 'instant' ? 'auto' : (options?.behavior ?? 'auto'),
        block: options?.align === 'center' ? 'center' : options?.align === 'end' ? 'end' : 'start',
      });
    }
  },
  getSelection: () => table.getSelectedRowModel().rows.map((r) => r.original),  // D12
  clearSelection: () => table.setRowSelection({}),                              // D12
  refresh: () => table.resetRowSelection(),                                     // D11
}), [table, virtualizer, scrollContainerRef, params.onAddRow, params.onDeleteRow, params.onUpdateRow, params.dataLength]);
```

### 2.6 사용 예시

**Example 1 — 최소 (ref + scrollTo)**:

```tsx
import { useRef } from 'react';
import { Grid, type GridHandle } from '@tomis/grid-core';

interface User { id: number; name: string; }

const gridRef = useRef<GridHandle<User>>(null);

<Grid<User>
  ref={gridRef}
  data={users}
  columns={columns}
/>;

// 50번째 행으로 스크롤
<button onClick={() => gridRef.current?.scrollTo(50, { align: 'center', behavior: 'smooth' })}>
  50번 행 보기
</button>
```

**Example 2 — 풀옵션 (가상화 1000+ 행 + addRow/deleteRow + getSelection)**:

```tsx
import { useRef, useState } from 'react';
import { Grid, type GridHandle } from '@tomis/grid-core';

const [users, setUsers] = useState<User[]>(initial1500Users);
const gridRef = useRef<GridHandle<User>>(null);

<Grid<User>
  ref={gridRef}
  data={users}
  columns={columns}
  rowSelection="multi"
  enableVirtualization
  virtualScrollHeight={600}
  virtualizerOptions={{ estimateSize: 40, overscan: 15 }}
  onAddRow={(seed) => setUsers((prev) => [...prev, { id: Date.now(), name: '', ...seed }])}
  onDeleteRow={(rowId) => setUsers((prev) => prev.filter((_, i) => String(i) !== String(rowId)))}
  onUpdateRow={(rowId, patch) =>
    setUsers((prev) => prev.map((u, i) => (String(i) === String(rowId) ? { ...u, ...patch } : u)))
  }
/>;

// imperative API
gridRef.current?.addRow({ name: '신규 사용자' });        // → onAddRow invoke
gridRef.current?.deleteRow('5');                         // → onDeleteRow invoke
const selected: User[] = gridRef.current?.getSelection() ?? [];
gridRef.current?.clearSelection();
gridRef.current?.refresh();
```

### 2.7 타입 export 경로

- `GridHandle<TData>` — `index.ts` MODIFY로 신규 export (D2)
- `GridScrollToOptions` — `index.ts` MODIFY로 신규 export (`@tanstack/react-virtual` ScrollToOptions re-export)
- `GridProps<TData>` 신규 6 prop은 기존 GridProps re-export로 자동 노출

`index.ts` After (D2):

```ts
// index.ts MODIFY (G-004)
export { Grid } from './Grid';
export type {
  GridProps,
  GridRowSelectionOptions,
  GridPaginationOptions,
  RowSelectionMode,
  GridColumnResizeMode,
  GridHandle,                    // ★ G-004 신규
  GridScrollToOptions,           // ★ G-004 신규
} from './types';
```

### 2.8 ref/imperative 방침 (B-05)

본 G-004는 **forwardRef + useImperativeHandle 도입 Goal** — B-05 명시적 충족.

---

## Section 3: 기존 사용처 대응표 (Variant → 신규 API)

| 기존 패턴 | 신규 G-004 API | 마이그레이션 액션 | 담당 Goal |
|----------|---------------|-------------------|----------|
| ChangeTrackingGrid `ChangeTrackingHandle<TData>` (`addRow/deleteRow/getChanges/resetChanges`) | base `GridHandle<TData>` (subset: addRow/deleteRow + base의 scrollTo/getSelection 추가) | MOD-GRID-10 alias가 `ChangeTrackingHandle` 확장 — 본 base handle은 controlled data 정책. ChangeTrackingGrid는 internal trackedRows owner이라 자체 handle 유지 | MOD-GRID-10 |
| VirtualGrid manual `useVirtualizer` (VirtualGrid.tsx:98-103) | `<Grid enableVirtualization virtualScrollHeight virtualizerOptions />` | G-005 VirtualGrid alias — props 매핑으로 base wrapper에 위임 | G-005 |
| AggridTable `gridRef` + AG `api.scrollToIndex(index)` (AggridTreeTable.tsx:345 ensureNodeVisible) | `gridRef.current?.scrollTo(index, options)` | publish는 별도 트랙. MOD-GRID-17 신규 사용 시 직접 ref 사용 | MOD-GRID-17 |
| AggridTable `api.deselectAll()` (AggridTreeTable.tsx:147) | `gridRef.current?.clearSelection()` | 동일 — MOD-GRID-17 직접 사용 | MOD-GRID-17 |

**본 G-004 직접 영향**: 0 사용처 (G-001~G-003 기반 ref + virtualization 추가).

---

## Section 4: 호환성 정책

| 항목 | 값 | 근거 |
|------|----|------|
| **breaking** | **false** | 모든 신규 prop optional. `ref` optional (forwardRef 변환은 ref 미전달 호출자 무영향). component 시그니처 함수형 → forwardRef는 호출 사이트 동일 (`<Grid ... />`). wrapper-goals.json G-004 `compatibilityPolicy.breaking: false` 일치. |
| **deprecationStrategy** | "ChangeTrackingGrid handle alias 별도 (MOD-GRID-10)" — base handle 자체는 신규 surface | wrapper-goals.json G-004 L223-224 |
| **migrationPath** | "useImperativeHandle 시그니처 호환 유지" — base GridHandle은 신규, ChangeTrackingHandle 확장 호환은 MOD-GRID-10 책임 | wrapper-goals.json G-004 L225 |
| **peerDependencies (C-22)** | 변경 없음 — `@tanstack/react-virtual ^3.0.0` 이미 G-001 시점 선언 (grid-core/package.json:25, ADR-MOD-GRID-01-001 Trade-off). 본 G-004는 첫 runtime wiring (D2/D10) | grid-core/package.json:25 Read + ADR-001 |
| **devDependencies (workspace root)** | **변경 있음** — `pnpm add -DW @tanstack/react-virtual@^3.13.24` (Step 0). monorepo node_modules에 미설치 확인 (D2) | monorepo/package.json + monorepo/node_modules ls |
| **semver (C-23)** | `version: "0.0.0"` 유지 (1.0 전 — Changesets는 MOD-GRID-00 G-002 범위). G-004는 internal 변경 누적 — 1.0 release까지 free patch 영역 | grid-core/package.json:3 |
| **외부 라이브러리 ADR (C-20)** | **ADR-MOD-GRID-01-005 작성 의무** (D10) — peer 첫 runtime wiring + Step 0 devDep 설치. trade-off ≥2 (D10 명시) | C-20 + D10 |

**주의 사항** (D4 forwardRef 변환):
- TS `forwardRef` 는 generic component native 미지원 — `as <TData>(...) => React.ReactElement` cast 필요 (ChangeTrackingGrid.tsx:215-217 검증된 패턴).
- 호출 사이트 영향 0: `<Grid<User> data={...} />` 그대로 동작 (ref optional). 단 IDE에서 component 타입이 `React.ReactElement` 반환으로 추론될 수 있음 — 정상 (`JSX.Element` 와 호환).

---

## Section 5: 인수 기준 (출처 태그 100%)

| ID | 기준 | 검증 방법 | 출처 |
|----|------|----------|------|
| AC-001 | `GridHandle<TData>` 인터페이스 — 7 메서드 (addRow/deleteRow/updateRow/scrollTo/getSelection/clearSelection/refresh). 각 메서드는 D3/D9/D11/D12 정책 준수. C-4 strict — `any` 0건. | tsc --noEmit 0 error + grep `: any\|as any\|<any>` 0 hit | C-4 + D3/D11/D12 (wrapper-goals.json AC-001) |
| AC-002 | `forwardRef` + `useImperativeHandle` 도입 — `Grid` 컴포넌트가 ref 매개변수 수신 + handle 노출. **ChangeTrackingGrid:215-217 forwardRef + generic cast 패턴 차용** (D4). | grep `forwardRef\|useImperativeHandle` count + Grid.tsx structure 검증 | L0 (ChangeTrackingGrid:215-217) + D4 (wrapper-goals.json AC-002) |
| AC-003 | `enableVirtualization=true` 시 `useGridVirtualizer` hook 활성 + `useVirtualizer({count, getScrollElement, estimateSize, overscan})` wiring (D5/D8). `enableVirtualization=false` 시 G-001~G-003 markup 그대로 (G-002 sticky/pinning 보존). | vitest T-01~T-03 + Storybook `Grid/Virtual1500` | C-18 + D5/D8 (wrapper-goals.json AC-003) |
| AC-004 | `virtualRow.index` 기반 `rows[index]` 매핑 (VirtualGrid.tsx:165 패턴 흡수). **single `<table>` + padding-row 패턴** (D5) — top padding tr height = `virtualItems[0]?.start ?? 0`, bottom padding tr height = `totalSize - (virtualItems[last]?.end ?? 0)`. virtualizer.measureElement ref 동적 행 높이 대응. | vitest T-04~T-05 + Storybook `Grid/VirtualWithPinning` | L0 (VirtualGrid.tsx:165) + D5 (wrapper-goals.json AC-004) |
| AC-005 | `@tanstack/react-virtual` peerDependency — **이미 grid-core/package.json:25 선언됨** (G-001 시점). 본 G-004는 첫 runtime wiring + Step 0 monorepo workspace devDep 설치 (D2 — `pnpm add -DW @tanstack/react-virtual@^3.13.24`). C-22 dep 중복 선언 0건 (peer만, dep 미추가). | grid-core/package.json L23-28 grep + monorepo/package.json devDeps grep | C-22 + D2 (wrapper-goals.json AC-005 — 정정 해석: 이미 peer 선언됨, runtime wiring + workspace 설치) |
| AC-006 | Storybook `Grid/Virtual1500` story 1+ — 1500행 가상화 + scroll 부드러움 + 헤더 sticky 보존 시각 검증 (C-18 의무). 추가 `Grid/VirtualWithPinning` (D5 G-002 호환) + `Grid/RefScrollTo` (D9). | Storybook 파일 존재 + story export count ≥ 3 | C-18 + C-25 (wrapper-goals.json AC-006) |
| AC-007 | C-12: `pnpm --filter @tomis/grid-core typecheck` 0 error + `pnpm --filter @tomis/grid-core build` (tsup CJS+ESM dual + dts) exit 0. **Step 0 (`pnpm add -DW @tanstack/react-virtual`) 사전 실행 의무** — 미설치 시 `useVirtualizer` import resolution 실패. | exit code 0 | C-12 + D2 |
| AC-008 | C-1 보존 (D11): G-001~G-003 Grid.tsx L43-278 + types.ts L112-290 (G-004 무관 24 prop) + buildTableOptions/computePinnedOffset/CheckboxColumn/ResizeHandle/Skeleton/EmptyState/useAutoSelectFirstRow 7개 internal 모듈 무수정. `git diff packages/grid-core` 변경 라인이 G-004 신규 6 prop / 3 callback prop / forwardRef 변환 / virtual 분기 / handle wiring 만인지 검증. | git diff line count + Read+grep | C-1 (2026-05-14 G-004 추가) + D11 |
| AC-009 | C-21: `pnpm size-limit` `@tomis/grid-core` ≤ 30 KB brotli 통과. 누적 G-001 17.44 + G-002+G-003 +0.91 (실측, ADR-004) + G-004 +1~1.5 KB 예상 ≈ 19.5~20 KB / 30 KB (한도 67%). spec 예상 +7 KB는 stale 산술 — D13 측정 게이트로 실제 측정. | size-limit run + JSON 파싱 | C-21 + D13 |
| AC-010 | virtualization × G-002 sticky/pinning 호환 (D5) — single `<table>` padding-row 패턴 적용 시 `<thead sticky>` + pinned cell sticky CSS + border-separate 보존. 시각 회귀 baseline 보존 (G-002/G-003 stories 확장). | Storybook `Grid/VirtualWithPinning` + 수동 스크린샷 vs G-002 baseline | C-13/C-17 + D5 |
| AC-011 | C-20 ADR-MOD-GRID-01-005 작성 — `@tanstack/react-virtual` 첫 runtime wiring + workspace devDep 설치. trade-off ≥2 (D10 명시 3건). 라이선스 MIT 명기. | decisions/MOD-GRID-01-decisions.md ADR-005 entry 존재 + grep `Trade-off`/`Alternatives` 섹션 | C-20 + D10 |
| AC-012 | C-25: 모든 신규 export (GridHandle, GridScrollToOptions) + 신규 6 prop (`onAddRow/onDeleteRow/onUpdateRow/enableVirtualization/virtualScrollHeight/virtualizerOptions`)에 JSDoc. 신규 internal 2 모듈 (useGridVirtualizer + useGridImperativeHandle)에도 JSDoc. README.md 업데이트 (Imperative API + Virtualization 섹션). | grep `@param`/`@returns` count + README.md update 검증 | C-25 + wrapper-goals.json AC-006 (Storybook 명시) |

**카운트**: 12 AC ≥ 3 (rubric C-01 통과). 모든 AC `source: L0/L1/L2/R-A/C-NN/D#` 태그 (rubric H-03 통과 — 본문 인용 100%).

**호환성 검증 AC (rubric C-05)**: AC-007/AC-008/AC-009/AC-010/AC-011 — 빌드 + 보존 + 번들 + 시각 회귀 + ADR. 사용처 0개이지만 G-005/MOD-GRID-17 발판이므로 strict 검증 의무.

---

## Section 6: 엣지 케이스 (≥3개)

### EC-01: `enableVirtualization=true` + `data.length === 0`

- **시나리오**: 가상화 활성 + 데이터 없음
- **처리**:
  - virtualizer count=0 → getVirtualItems()=[] + getTotalSize()=0
  - tbody padding-row top/bottom 모두 height=0 → 사실상 빈 영역
  - **G-003 EmptyState 분기 우선**: `data.length===0` 체크가 virtual 분기보다 먼저 평가 → `<EmptyState colSpan={...} />` 1행 렌더 (G-003 markup 보존)
  - virtual padding row 미렌더
- **AC 매핑**: AC-003 + AC-008 (G-003 EmptyState 보존)

### EC-02: `enableVirtualization=true` + `loading=true`

- **시나리오**: 가상화 활성 + 로딩 중
- **처리**:
  - **G-003 SkeletonRows 분기 우선**: `loading=true` 체크가 virtual 분기보다 먼저 평가 → SkeletonRows N개 렌더 (G-003 markup 보존)
  - virtualizer는 호출 자체는 skip 안 됨 (rules-of-hooks) — count=0 으로 사실상 비활성화
  - virtualizer.measureElement도 skeleton tr에 attach되지 않음 → 메모리 leak 0
- **AC 매핑**: AC-003 + AC-008 (G-003 Skeleton 보존)

### EC-03: `ref.current.addRow(seed)` 호출 + `onAddRow` 미제공

- **시나리오**: 사용자가 ref method 호출했지만 콜백 prop 미제공
- **처리** (D3):
  - dev mode (`process.env.NODE_ENV !== 'production'`) → `console.warn('[tomis/grid-core] addRow() called but no onAddRow prop provided. No-op.')` 1회
  - production silent + no-op
  - JSDoc 명시 (Section 2.1) — "controlled data 정책 + parent setState 책임"
- **AC 매핑**: AC-001 + AC-012

### EC-04: `ref` 미전달 (forwardRef는 ref optional)

- **시나리오**: `<Grid data columns />` (ref 인자 없음)
- **처리** (D4):
  - forwardRef는 ref optional — useImperativeHandle 내부에서 ref가 null이면 매핑 skip (React 표준)
  - virtualizer + table은 정상 wiring (ref와 무관)
  - 호출 사이트 backward-compatible (G-001~G-003 동일)
- **AC 매핑**: AC-002 + AC-008

### EC-05: virtualization × `enableColumnPinning=true` 동시 활성

- **시나리오**: virtualization + sticky pinned columns 동시
- **처리** (D5):
  - single `<table>` 유지 → G-002 `getPinnedCellStyle` 그대로 적용 (thead/tbody sticky offset)
  - padding-row `<tr>`도 동일 `<table>` 자식이라 sticky pinned column이 padding tr까지 영향 (정상 외관)
  - virtual virtualRow tr은 G-002 cell pinned style + cell width 보존
- **AC 매핑**: AC-003 + AC-004 + AC-010 (G-002 보존)
- **시각 회귀 baseline**: Storybook `Grid/VirtualWithPinning`

### EC-06: `enableVirtualization=true` + `data.length` 짧음 (e.g., 10행)

- **시나리오**: 가상화 활성했지만 short list (자동 임계값 미적용 D6)
- **처리** (D6):
  - virtualizer count=10 → 모든 행 렌더 (overscan 10 ≥ count)
  - padding row top/bottom height=0
  - 외관: 가상화 비활성과 거의 동일 (성능 overhead만 추가)
  - 사용자 의도 — "opt-in 했으니 사용자 책임" (D6 정책 명시 JSDoc)
- **AC 매핑**: AC-003 + AC-012

### EC-07: `enableVirtualization=true` + `virtualScrollHeight` 미지정

- **시나리오**: 가상화 활성했지만 height prop 미지정
- **처리** (D7):
  - default `400` 적용 + dev mode console.warn 1회 (사용자 의도 명시 권장)
  - production silent (default 적용만)
- **AC 매핑**: AC-003 + AC-012

### EC-08: `ref.current.scrollTo(index)` — index 범위 외

- **시나리오**: `scrollTo(-1)` 또는 `scrollTo(99999)` (data.length=100)
- **처리** (D9):
  - clamp `[0, data.length-1]` (예: -1→0, 99999→99)
  - dev mode console.warn 1회 (`out of range. Clamped to N`)
  - production silent (clamp만 적용 — UX 안전 — boundary clamp 기본)
- **AC 매핑**: AC-001 + AC-012

### EC-09 (환경 의존): pnpm 미설치 환경에서 build 검증 불가 (AC-007)

- **시나리오**: CI가 아닌 로컬에서 pnpm CLI 미설치 또는 monorepo Step 0 (`pnpm add -DW @tanstack/react-virtual`) 실패
- **처리**:
  - Step 0 실패 → Implementer는 **immediate stop** (typecheck 진행 불가)
  - 환경 deviation: `npx tsc --noEmit` 폴백 가능하나 `useVirtualizer` import resolution 실패 → fallback 무의미
  - documented-deviation 처리: `findings/blocked/G-004-env.md` 생성 권장 (Implementer가 환경 의존 미충족 시)
- **AC 매핑 표** (rubric E-04 권장):

| AC | EC | 매핑 사유 |
|----|----|---------|
| AC-005 (peer 선언) | (해당 없음 — peer 이미 선언됨, env 의존 X) | 본 검증은 grid-core/package.json:25 grep만 — pnpm 의존 없음 |
| AC-007 (build 0 error + Step 0 devDep 설치) | EC-09 (pnpm 미설치 또는 Step 0 실패) | Step 0 실패 시 typecheck 진행 불가 — Implementer immediate stop + documented-deviation |

**합계**: 9 EC ≥ 3 (rubric E-04 통과).

---

## Section 7: 구현 대상 파일 (NEW 2 + MODIFY 3 = 5개)

**경로 결정 근거 (D1 — C-28 N/A)**: wrapper-goals.json L227-232 G-004 `implementFiles` 4개 모두 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/...` 정확 prefix. C-28 정정 결정 불필요. 단 spec 본문 분석 결과:
- wrapper-goals.json은 4 파일 명시 (Grid.tsx + types.ts + useGridVirtualizer + useGridImperativeHandle) — 모두 변경 유형 미분류
- 본 spec은 (a) Grid.tsx + types.ts를 **MODIFY**로 분류 (D11 보존 의무), (b) `index.ts` MODIFY 추가 (D2 — `GridHandle`/`GridScrollToOptions` 신규 export 의무), (c) `package.json` MODIFY는 **무수정** (D2 — peer 이미 선언)
- → **NEW 2 + MODIFY 3 = 5개** (D2)

**조부모 디렉토리 실재 확인** (H-02 외부 디렉토리 예외):
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/` 실재 (G-001~G-003 생성, ls 확인 — 7 파일 존재: `CheckboxColumn.tsx`, `ResizeHandle.tsx`, `buildTableOptions.ts`, `computePinnedOffset.ts`, `Skeleton.tsx`, `EmptyState.tsx`, `useAutoSelectFirstRow.ts`)
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/Grid.tsx` 실재 (278 라인 Read)
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` 실재 (291 라인 Read)
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` 실재 (10 라인 Read)
- 신규 디렉토리 mkdir 불필요

| # | 파일 경로 | 변경 유형 | 책임 |
|---|----------|---------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` | **MODIFY** | (a) `ScrollToOptions as VirtualScrollToOptions` import 추가 (`@tanstack/react-virtual`). (b) **NEW** `interface GridHandle<TData>` (7 method, Section 2.1). (c) **NEW** `type GridScrollToOptions = VirtualScrollToOptions` (D9). (d) `GridProps<TData>`에 6 신규 prop 추가 — `onAddRow`/`onDeleteRow`/`onUpdateRow` (D3) + `enableVirtualization`/`virtualScrollHeight`/`virtualizerOptions` (D6/D7/D8). 기존 G-001~G-003 24 prop 시그니처/주석 보존 (D11). |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/useGridVirtualizer.ts` | **NEW** | `useGridVirtualizer<TData>(table, scrollContainerRef, enabled, options?)` — `useVirtualizer({count, getScrollElement, estimateSize, overscan})` wiring (D5/D8). `enabled=false` 시 count=0 fallback (rules-of-hooks 준수). 반환 = `Virtualizer<HTMLDivElement, HTMLTableRowElement> \| null`. |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/useGridImperativeHandle.ts` | **NEW** | `useGridImperativeHandle<TData>(ref, table, virtualizer, scrollContainerRef, params)` — `useImperativeHandle(ref, ()=>(7 methods), [deps])` 매핑. addRow/deleteRow/updateRow는 callback 위임 + 미제공 시 dev warn (D3). scrollTo는 virtualizer 우선 + DOM fallback + clamp (D9). getSelection/clearSelection/refresh는 table 직접 위임 (D11/D12). |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/Grid.tsx` | **MODIFY** | (a) `forwardRef`/`useRef`/`Ref` import 추가 + `useGridVirtualizer`/`useGridImperativeHandle` import (D2/D4). (b) `function Grid<TData>(props): JSX.Element` → `function GridInner<TData>(props, ref: Ref<GridHandle<TData>>): JSX.Element` 시그니처 변경 (D4). (c) `useGridVirtualizer` 호출 + `useGridImperativeHandle` 호출 (`useReactTable` 호출 직후) (D2). (d) tbody 분기에 virtual 분기 추가 — `enableVirtualization=true && !loading && data.length>0` 시 padding-row 패턴 (D5). 기존 G-001~G-003 sticky/pinning/resize/skeleton/empty/autoSelect markup 무변경 (D11). (e) `export const Grid = forwardRef(GridInner) as <TData>(...)=>React.ReactElement` 패턴 (D4 — ChangeTrackingGrid:215-217 차용). (f) Grid 외곽 `<div className="overflow-x-auto rounded-lg border border-gray-200">`을 `enableVirtualization=true` 시 `<div ref={scrollContainerRef} style={{ height: virtualScrollHeight ?? 400, overflow: 'auto' }} ...>`로 분기 (D7). |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` | **MODIFY** | `export type { GridHandle, GridScrollToOptions } from './types'` 추가 (D2 + AC-001/AC-012). 기존 5 type export 보존. |

**Section 11 cross-check (rubric E-01 ★)**: Section 11.1 Step 1 (types.ts MODIFY) → 행 #1, Step 2 (useGridVirtualizer NEW) → 행 #2, Step 3 (useGridImperativeHandle NEW) → 행 #3, Step 4 (Grid.tsx MODIFY) → 행 #4, Step 5 (index.ts MODIFY) → 행 #5. **Step ↔ 표 행 5/5 일치**.

**부수 변경**:
- **Step 0 (사전 작업)** = `pnpm add -DW @tanstack/react-virtual@^3.13.24` (workspace root devDep 설치). monorepo `package.json` + `pnpm-lock.yaml` 변경 — 5 파일 카운트에는 포함하지 않음 (lockfile/devDep 스캐폴딩, 핵심 spec surface 외부 — D2).
- ADR 신규 entry — `decisions/MOD-GRID-01-decisions.md`에 `ADR-MOD-GRID-01-005` 추가 (Step 9, 5 파일 카운트 외 — Documents).
- README.md 업데이트 (Imperative API + Virtualization 섹션) — Step 9 (5 파일 카운트 외 — Documents).
- Storybook stories 추가 — `src/__stories__/Grid.stories.tsx` (G-001~G-003 stories에 G-004 추가). Step 8 — 5 파일 카운트 외 (test/story).
- `package.json` (grid-core) 무수정 — peer 이미 선언 (D2).
- `tsup.config.ts` 무수정 — `external` 배열에 `@tanstack/react-virtual` 이미 포함 (Read 확인 L17).
- `.size-limit.json` 무수정 — 한도 30 KB 그대로 (D13).
- `tw-framework-front/` 0 파일 변경 (TOMIS 영향 0 — H-02 외부 디렉토리 무파괴).

---

## Section 8: 마이그레이션 영향도 Preflight

### 8.1 영향 사용처 카운트

**`affectedUsageFiles: []` (0개)** — wrapper-goals.json G-004 L233 일치.

**경로 결정 근거 (D1 — C-28 N/A)**:
- wrapper-goals.json L227-232: 모든 implementFiles `D:/project/topvel_project/topvel-grid-monorepo/packages/...` 정확 prefix
- G-001의 D2 (잘못된 TOMIS prefix → monorepo 채택)와 달리 본 G-004는 정정 결정 없음 (G-002 D1 + G-003 D1과 동일)
- spec 본문 결정으로 file count 변경 (NEW 4 → NEW 2 + MODIFY 3): D2 명시. wrapper-goals.json `implementFiles` 표면은 4 파일 — 본 spec이 권위 (C-27)

**잠재 후속 영향 (참고 — 본 Goal 범위 외)**:
- G-005 `legacy/VirtualGrid.tsx` — `enableVirtualization` props 매핑 진입점 (G-001 동일 prop 명 보존)
- MOD-GRID-10 `ChangeTrackingGrid` alias — internal trackedRows owner이라 자체 handle 유지 (base GridHandle 미사용)
- MOD-GRID-17 페이지 27개 — `ref` + `scrollTo`/`getSelection` 직접 활용 가능

### 8.2 무파괴 검증

- **TOMIS 내부 0 변경**: `tw-framework-front/src/components/tomis/Grid/*.tsx`, `src/types/tomis/grid.ts`, `src/pages/**` 모두 무수정. tsc 영향 0
- **외부 monorepo MODIFY 보존 의무 (D11 + C-1)**:
  - `Grid.tsx` 278라인 → 변경은 (a) import 4개 추가, (b) function 시그니처 forwardRef 변환 (D4), (c) `useGridVirtualizer` + `useGridImperativeHandle` 2개 hook 호출 추가 (`useReactTable` 호출 직후), (d) tbody 분기에 virtual padding-row 분기 추가, (e) Grid 외곽 div를 enableVirtualization 분기로 wrap, (f) `export const Grid = forwardRef(GridInner) as ...` 1줄 추가. 기타 G-001 buildTableOptions 호출 / G-002 sticky thead+pinning markup / G-003 skeleton+empty+autoSelect / pagination footer 모두 보존
  - `types.ts` 291라인 → import 1개 추가 + `GridHandle` interface NEW + `GridScrollToOptions` type NEW + GridProps에 6 prop 추가. 기존 24 prop 시그니처/주석 보존
  - `index.ts` 10라인 → 1라인 type export 추가 (`GridHandle`/`GridScrollToOptions`). 기존 5 type export 보존
  - **검증 의무 (C-1 2026-05-14 추가)**: Implementer Stage에서 git diff 또는 Read+grep으로 보존 입증 (implement-rubric F-03)
- **부모 디렉토리 실재** (H-02 외부 디렉토리 예외 충족):
  - `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/` 실재 (G-001~G-003 생성, ls 확인 — 7 파일)
  - 모든 NEW 2 파일은 기존 디렉토리에 추가 — mkdir 불필요
- **명명 컨벤션**: `useGridVirtualizer.ts`/`useGridImperativeHandle.ts` (lowerCamelCase hook — `buildTableOptions.ts`/`computePinnedOffset.ts`/`useAutoSelectFirstRow.ts`와 일치)
- **Step 0 monorepo lockfile 변경**: `pnpm-lock.yaml` 변경 + `monorepo/package.json` `devDependencies` 1줄 추가 — git diff 가능 (수술적 변경)

### 8.3 점진 마이그레이션 (C-19)

본 Goal: NEW 2 + MODIFY 3 → 사용처 0개 → C-19 ≤5 한도 무관.
후속 점진:
- G-005: 5 alias 신규 파일 (`legacy/VirtualGrid.tsx` 등) — 본 G-004의 `enableVirtualization`/`virtualScrollHeight`/`virtualizerOptions` props 직접 활용
- MOD-GRID-10: ChangeTrackingGrid alias — 자체 handle (ChangeTrackingHandle) 유지

### 8.4 롤백 전략

- **롤백 단순**: NEW 2 파일 삭제 + MODIFY 3 파일 G-003 시점 복원 + monorepo workspace `@tanstack/react-virtual` devDep 제거
- 명령:
  ```powershell
  cd D:\project\topvel_project\topvel-grid-monorepo
  Remove-Item -Force packages\grid-core\src\internal\useGridVirtualizer.ts, packages\grid-core\src\internal\useGridImperativeHandle.ts
  git checkout -- packages\grid-core\src\Grid.tsx packages\grid-core\src\types.ts packages\grid-core\src\index.ts
  pnpm remove -DW @tanstack/react-virtual
  ```
- TOMIS git 무영향 — `tw-framework-front/` revert 불필요
- 후속 Goal 영향:
  - G-005 spec은 `enableVirtualization` prop 가정 — G-004 부재 시 G-005 spec drift (재작성 필요)
  - MOD-GRID-10 ChangeTrackingHandle은 base GridHandle 미사용 → G-004 부재 시도 영향 0

### 8.5 번들 영향 (D13 ★ G-002 D7 + G-003 D10 + ADR-004 실측 trajectory inherit)

- **+7 KB 예상** (wrapper-goals.json G-004 `bundleImpact.expected: "+7 KB (virtual + handle)"`)
- **실측 trajectory 적용 (ADR-MOD-GRID-01-004)**: G-002+G-003 누적 +0.91 KB (실측, 예상 +7 KB의 13%) → G-004 실측 예상 +1~1.5 KB
- **누적 (G-001 17.44 + G-002+G-003 +0.91 + G-004 +1~1.5) ≈ 19.35~19.85 KB / 한도 30 KB → 여유 10~10.5 KB**
- **D13 측정 게이트 유지 (discipline)**: G-004 implement Step 8에서 `pnpm size-limit` 측정 의무. 누적 > 25 KB 시 G-005 분리 검토 트리거 (현재 추세상 발동 가능성 낮음 — advisor item#6).
- C-21 사용자 승인 미필요 (본 G-004 +1~1.5 KB는 100 KB 미만)
- **외부 의존성 번들 영향 0**: `@tanstack/react-virtual`은 peer + tsup external 배열 이미 포함 (`tsup.config.ts:14` Read 확인) → grid-core dist에 미포함

### prompt 산술 vs 실측 산술 정정 표 (C-27 promptSpecDrift)

| 항목 | prompt 값 | spec 본문 (실측) 값 | 정정 사유 |
|------|----------|-------------------|----------|
| 누적 G-001~G-003 | 18.35 KB | 18.35 KB (= 17.44 + 0.91) | 일치 ✓ |
| G-004 예상 추가 | +7 KB (spec 명시) | +1~1.5 KB (실측 trajectory) | 명시는 wrapper-goals.json — 실측은 ADR-004 검증 |
| G-005 예상 추가 | +5 KB | +0.7 KB 가능 | wrapper-goals.json 산술 — 실측은 미정 |
| 누적 한도 위험 | 30.35 KB / 30 KB (0.35 KB 초과) | 19.5~20 KB / 30 KB (한도 67%) | prompt 산술 stale (실측 trajectory 미반영, advisor item#6) |
| **결론** | "한도 초과 위험 + G-005 분리 의무 결정" | "측정 게이트 유지 (discipline) + 분리 트리거 발동 가능성 낮음" | D13 — Implementer는 본 spec을 권위로 따라야 함 (C-27) |

**Implementer 측 의무 (C-27)**: prompt의 "한도 0.35 KB 초과 위험" 명시를 그대로 적용하지 말 것. spec D13 본문 권위 — implement Step 8에서 `pnpm size-limit` 실측 후 누적 > 25 KB 시에만 G-005 분리 검토. promptSpecDrift JSON 필드에 본 정정 기록 의무.

---

## Section 9: 의존성 (peerDeps/deps/devDeps)

### peerDependencies (C-22 — grid-core/package.json L23-28에 이미 선언됨)

```json
"peerDependencies": {
  "@tanstack/react-table": "^8.0.0",
  "@tanstack/react-virtual": "^3.0.0",   // ★ G-001 시점 선언 — G-004 첫 runtime wiring (D2)
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0"
}
```

본 G-004 신규 import:
- `useVirtualizer`, `Virtualizer`, `ScrollToOptions` from `@tanstack/react-virtual` — peer 이미 선언 (D2)
- `forwardRef`, `useRef`, `useImperativeHandle`, `Ref`, `RefObject` from `react` — peer 이미 선언

→ **신규 peerDependency 선언 추가 0건** (D2 — peer 이미 존재). C-20 ADR 의무는 여전히 적용 (D10 — 첫 runtime wiring + Step 0 devDep 설치).

### dependencies

**없음** (pure wrapper). C-22 위반 없음 (peer를 dep로 중복 선언 금지).

### devDependencies (workspace root)

**Step 0 의무 (D2)**:
```bash
cd D:/project/topvel_project/topvel-grid-monorepo
pnpm add -DW @tanstack/react-virtual@^3.13.24
```
- `-DW` = devDependency at workspace root (모든 패키지에서 type resolution 가능)
- 버전 `^3.13.24` = AS-IS tw-framework-front node_modules 동일 (Read 확인 — `tw-framework-front/node_modules/@tanstack/react-virtual/package.json:3`)
- monorepo `package.json` `devDependencies` 1줄 추가 + `pnpm-lock.yaml` 변경 (5 파일 카운트 외)

### 외부 라이브러리 추가

**peer 1건의 첫 runtime wiring** (선언 자체는 G-001 시점). C-20 ADR-MOD-GRID-01-005 작성 의무 (D10 — trade-off ≥2). C-7 (AG Grid 금지) + C-16 (Wijmo 금지) 무관 — 둘 다 import 없음.

---

## Section 10: 사용자 여정

### 개발자 여정 (구현 후)

(wrapper-goals.json G-004 `userJourneySteps` 인용)

1. `const ref = useRef<GridHandle<Row>>(null)`
2. `<Grid ref={ref} data={rows} ... />`
3. `ref.current.addRow(seed)` / `deleteRow(key)` / `scrollTo(index)` / `getSelection()` 호출
4. `enableVirtualization=true` + `data.length > threshold` → useVirtualizer 자동 wiring
5. `measureElement` ref 패턴으로 동적 행 높이 대응

### 최종 사용자 여정 (페이지 사용 시 보이는 동작)

| 시나리오 | 보이는 동작 |
|---------|-----------|
| 1500행 + enableVirtualization | 부드러운 스크롤 (overscan 10행만 DOM 렌더), 메모리 100배 절감 |
| 가상화 + sticky thead (G-002 호환) | 스크롤 시 헤더 상단 고정 + pinned column 좌/우 고정 (D5 single-table 보존) |
| 가상화 + 동적 행 높이 (긴 텍스트 등) | virtualizer.measureElement ref가 실측 후 layout 자동 재계산 |
| imperative addRow (parent setState) | 새 행 즉시 표시 (parent가 props.data 배열 업데이트) |
| imperative scrollTo(50) | 50번 행으로 부드러운 스크롤 (가상화 시 virtualizer.scrollToIndex, native DOM scroll fallback 시 scrollIntoView) |
| imperative getSelection | 현재 선택된 행 데이터 배열 반환 (TanStack table.getSelectedRowModel 위임) |
| imperative refresh | selection state 재산정 (sort 변경 후 stale rowId 정리 등) |

---

## Section 11: 구현 계획

### 11.1 파일별 변경 명세 (Before/After ≥1 코드 블록 — rubric E-02)

**Step 0 (사전 작업) — monorepo workspace devDep 설치 (D2)**:

```powershell
cd D:\project\topvel_project\topvel-grid-monorepo
pnpm add -DW @tanstack/react-virtual@^3.13.24
# 검증: ls node_modules/@tanstack/react-virtual
# 검증: cat node_modules/@tanstack/react-virtual/package.json | grep version
```

→ 결과: monorepo `package.json` `devDependencies`에 `"@tanstack/react-virtual": "^3.13.24"` 1줄 추가 + `pnpm-lock.yaml` 변경. 본 Step은 5 파일 spec 카운트 외 (lockfile/devDep — D2).

**Step 1 (MODIFY) — `types.ts`** — D3/D6/D7/D8/D9 신규 prop + GridHandle/GridScrollToOptions

Before (G-003 산출물 — types.ts L19 imports + L290 마지막 prop `debug`):

```ts
import type { MouseEvent, ReactNode } from 'react';
// ... GridProps<TData> { ... debug?: boolean; }
```

After (G-004):

```ts
import type { MouseEvent, ReactNode } from 'react';
import type { ScrollToOptions as VirtualScrollToOptions } from '@tanstack/react-virtual';   // ★ G-004

// ─── G-004: GridScrollToOptions (D9) ───
export type GridScrollToOptions = VirtualScrollToOptions;

// ─── G-004: GridHandle<TData> (D3/D9/D11/D12) ───
export interface GridHandle<TData> {
  addRow: (seed?: Partial<TData>) => void;
  deleteRow: (rowId: string | number) => void;
  updateRow: (rowId: string | number, patch: Partial<TData>) => void;
  scrollTo: (index: number, options?: GridScrollToOptions) => void;
  getSelection: () => TData[];
  clearSelection: () => void;
  refresh: () => void;
}

// ─── GridProps<TData> (G-001~G-003 24 prop 보존 — D11 + G-004 6 prop 추가) ───
export interface GridProps<TData> {
  // ... (G-001~G-003 보존)

  // G-004 신규: 데이터 mutation 콜백 (D3)
  onAddRow?: (seed?: Partial<TData>) => void;
  onDeleteRow?: (rowId: string | number) => void;
  onUpdateRow?: (rowId: string | number, patch: Partial<TData>) => void;

  // G-004 신규: 가상화 (D6/D7/D8)
  enableVirtualization?: boolean;
  virtualScrollHeight?: number;
  virtualizerOptions?: { estimateSize?: number; overscan?: number };
}
```

**Step 2 (NEW) — `internal/useGridVirtualizer.ts`** — Section 2.4 시그니처 구현

```ts
// internal/useGridVirtualizer.ts (NEW — D2/D5/D8)
import { useVirtualizer, type Virtualizer } from '@tanstack/react-virtual';
import type { RefObject } from 'react';
import type { Table } from '@tanstack/react-table';

const DEFAULT_ESTIMATE_SIZE = 36;
const DEFAULT_OVERSCAN = 10;

export interface UseGridVirtualizerOptions {
  estimateSize?: number;
  overscan?: number;
}

export function useGridVirtualizer<TData>(
  table: Table<TData>,
  scrollContainerRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  options?: UseGridVirtualizerOptions,
): Virtualizer<HTMLDivElement, HTMLTableRowElement> | null {
  const rows = table.getRowModel().rows;
  const estimate = options?.estimateSize ?? DEFAULT_ESTIMATE_SIZE;
  // rules-of-hooks — useVirtualizer 항상 호출 (count로 비활성화)
  const virtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: enabled ? rows.length : 0,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => estimate,                  // D8: 함수 wrap
    overscan: options?.overscan ?? DEFAULT_OVERSCAN,
  });
  return enabled ? virtualizer : null;
}
```

**Step 3 (NEW) — `internal/useGridImperativeHandle.ts`** — Section 2.5 시그니처 구현 (D3/D9/D11/D12)

```ts
// internal/useGridImperativeHandle.ts (NEW — D2)
import { useImperativeHandle, type RefObject, type Ref } from 'react';
import type { Table } from '@tanstack/react-table';
import type { Virtualizer } from '@tanstack/react-virtual';
import type { GridHandle, GridScrollToOptions } from '../types';

export interface UseGridImperativeHandleParams<TData> {
  onAddRow?: (seed?: Partial<TData>) => void;
  onDeleteRow?: (rowId: string | number) => void;
  onUpdateRow?: (rowId: string | number, patch: Partial<TData>) => void;
  dataLength: number;
}

function devWarn(msg: string): void {
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.warn(`[tomis/grid-core] ${msg}`);
  }
}

export function useGridImperativeHandle<TData>(
  ref: Ref<GridHandle<TData>>,
  table: Table<TData>,
  virtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement> | null,
  scrollContainerRef: RefObject<HTMLDivElement | null>,
  params: UseGridImperativeHandleParams<TData>,
): void {
  useImperativeHandle(ref, () => ({
    addRow: (seed) => {
      if (!params.onAddRow) {
        devWarn('addRow() called but no onAddRow prop provided. No-op.');
        return;
      }
      params.onAddRow(seed);
    },
    deleteRow: (rowId) => {
      if (!params.onDeleteRow) {
        devWarn('deleteRow() called but no onDeleteRow prop provided. No-op.');
        return;
      }
      params.onDeleteRow(rowId);
    },
    updateRow: (rowId, patch) => {
      if (!params.onUpdateRow) {
        devWarn('updateRow() called but no onUpdateRow prop provided. No-op.');
        return;
      }
      params.onUpdateRow(rowId, patch);
    },
    scrollTo: (index, options) => {
      const max = Math.max(0, params.dataLength - 1);
      const clamped = Math.max(0, Math.min(index, max));
      if (clamped !== index) {
        devWarn(`scrollTo(${index}) out of range [0, ${max}]. Clamped to ${clamped}.`);
      }
      if (virtualizer) {
        virtualizer.scrollToIndex(clamped, options);
        return;
      }
      const tr = scrollContainerRef.current?.querySelector(`tr[data-index="${clamped}"]`);
      if (tr instanceof HTMLElement) {
        tr.scrollIntoView({
          behavior: options?.behavior === 'instant' ? 'auto' : (options?.behavior ?? 'auto'),
          block: options?.align === 'center' ? 'center' : options?.align === 'end' ? 'end' : 'start',
        });
      }
    },
    getSelection: () => table.getSelectedRowModel().rows.map((r) => r.original),
    clearSelection: () => table.setRowSelection({}),
    refresh: () => table.resetRowSelection(),
  }), [
    table, virtualizer, scrollContainerRef,
    params.onAddRow, params.onDeleteRow, params.onUpdateRow, params.dataLength,
  ]);
}
```

**Step 4 (MODIFY) — `Grid.tsx`** — forwardRef 변환 + virtual 분기 + handle wiring

Before (G-003 산출물 — Grid.tsx L14, L46, L114-117 외곽):

```tsx
import { useState, type CSSProperties } from 'react';
// ...
export function Grid<TData>(props: GridProps<TData>): JSX.Element {
  // ... internal state + buildTableOptions + useReactTable + useAutoSelectFirstRow ...
  return (
    <div className={`flex flex-col ${props.className ?? ''}`}>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className={tableClassName}>
          <thead ...>
          <tbody className={tbodyClassName}>
            {props.loading === true ? (
              <SkeletonRows count={...} table={table} />
            ) : table.getRowModel().rows.length === 0 ? (
              <EmptyState colSpan={...} ... />
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} ...>...</tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* pagination footer */}
    </div>
  );
}
```

After (G-004):

```tsx
import { forwardRef, useRef, useState, type CSSProperties, type Ref } from 'react';
// ... (G-003 imports 보존)
import { useGridImperativeHandle } from './internal/useGridImperativeHandle';
import { useGridVirtualizer } from './internal/useGridVirtualizer';
import type { GridHandle, GridProps } from './types';

const DEFAULT_VIRTUAL_SCROLL_HEIGHT = 400;   // D7

function GridInner<TData>(
  props: GridProps<TData>,
  ref: Ref<GridHandle<TData>>,
): JSX.Element {
  // ─── (G-001~G-003 internal state + buildTableOptions + useReactTable + useAutoSelectFirstRow 보존 — D11) ───

  // G-004: scroll container ref (virtualization 또는 fallback DOM scroll)
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // G-004: useGridVirtualizer (enabled=props.enableVirtualization)
  const virtualizer = useGridVirtualizer<TData>(
    table,
    scrollContainerRef,
    props.enableVirtualization === true,
    props.virtualizerOptions,
  );

  // G-004: useGridImperativeHandle (ref 노출)
  useGridImperativeHandle<TData>(ref, table, virtualizer, scrollContainerRef, {
    onAddRow: props.onAddRow,
    onDeleteRow: props.onDeleteRow,
    onUpdateRow: props.onUpdateRow,
    dataLength: props.data.length,
  });

  // G-004: virtual 활성 여부 (markup 분기용)
  const isVirtual = props.enableVirtualization === true && virtualizer !== null;
  const virtualItems = isVirtual ? virtualizer!.getVirtualItems() : [];
  const totalSize = isVirtual ? virtualizer!.getTotalSize() : 0;
  const paddingTop = virtualItems.length > 0 ? (virtualItems[0]?.start ?? 0) : 0;
  const paddingBottom = virtualItems.length > 0
    ? totalSize - (virtualItems[virtualItems.length - 1]?.end ?? 0)
    : 0;

  // ─── (G-001~G-003 markup 보존 — outer wrapper className/showPagination 등) ───

  // G-004: outer wrapper height + ref 분기 (D7)
  const containerStyle: CSSProperties = isVirtual
    ? { height: props.virtualScrollHeight ?? DEFAULT_VIRTUAL_SCROLL_HEIGHT, overflow: 'auto' }
    : {};
  const containerClassName = isVirtual
    ? 'rounded-lg border border-gray-200'
    : 'overflow-x-auto rounded-lg border border-gray-200';

  // dev warn (D7) — virtualScrollHeight 미지정
  if (isVirtual && props.virtualScrollHeight === undefined && process.env.NODE_ENV !== 'production') {
    // (mount/render마다 호출 회피용 useEffect 1회 권장 — Implementer 결정)
  }

  return (
    <div className={`flex flex-col ${props.className ?? ''}`}>
      <div ref={scrollContainerRef} className={containerClassName} style={containerStyle}>
        <table className={tableClassName}>
          <thead className="bg-gray-50 sticky top-0 z-10">
            {/* G-002 sticky thead + pinning markup 보존 (D11) */}
          </thead>
          <tbody className={tbodyClassName}>
            {props.loading === true ? (
              /* G-003 SkeletonRows 분기 보존 (EC-02) */
              <SkeletonRows count={...} table={table} />
            ) : table.getRowModel().rows.length === 0 ? (
              /* G-003 EmptyState 분기 보존 (EC-01) */
              <EmptyState colSpan={...} ... />
            ) : isVirtual ? (
              /* G-004 D5: padding-row 패턴 (single <table> + sticky/pinning 호환) */
              <>
                {paddingTop > 0 && (
                  <tr style={{ height: paddingTop }} aria-hidden="true">
                    <td colSpan={table.getAllLeafColumns().length} />
                  </tr>
                )}
                {virtualItems.map((virtualRow) => {
                  const row = table.getRowModel().rows[virtualRow.index];
                  return (
                    <tr
                      key={row.id}
                      data-index={virtualRow.index}
                      ref={virtualizer!.measureElement}
                      className={/* G-001~G-003 row className 보존 */}
                      onClick={(event) => props.onRowClick?.(row.original, event)}
                      onDoubleClick={(event) => props.onRowDoubleClick?.(row.original, event)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className={/* G-002 pinning markup 보존 */}
                          style={/* G-002 cellStyle 보존 */}
                          onClick={(event) => props.onCellClick?.(cell, row.original, event)}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {paddingBottom > 0 && (
                  <tr style={{ height: paddingBottom }} aria-hidden="true">
                    <td colSpan={table.getAllLeafColumns().length} />
                  </tr>
                )}
              </>
            ) : (
              /* G-001~G-003 normal tbody 분기 보존 — D11 */
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} data-index={row.index} /* G-004: data-index 추가 — fallback DOM scroll 용 */ ...>
                  {/* ... */}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* G-001 pagination footer 보존 */}
    </div>
  );
}

// G-004 D4: forwardRef + generic cast (ChangeTrackingGrid:215-217 패턴)
export const Grid = forwardRef(GridInner) as <TData>(
  props: GridProps<TData> & { ref?: Ref<GridHandle<TData>> }
) => React.ReactElement;
```

**Step 5 (MODIFY) — `index.ts`** — type export 추가

Before (G-003 산출물):

```ts
export { Grid } from './Grid';
export type {
  GridProps,
  GridRowSelectionOptions,
  GridPaginationOptions,
  RowSelectionMode,
  GridColumnResizeMode,
} from './types';
```

After (G-004):

```ts
export { Grid } from './Grid';
export type {
  GridProps,
  GridRowSelectionOptions,
  GridPaginationOptions,
  RowSelectionMode,
  GridColumnResizeMode,
  GridHandle,                    // ★ G-004 신규 (D2)
  GridScrollToOptions,           // ★ G-004 신규 (D2)
} from './types';
```

### 11.2 구현 순서 (의존성 고려, ≥2단계)

1. **Step 0 — Workspace devDep 설치** (D2): `pnpm add -DW @tanstack/react-virtual@^3.13.24` → 검증: `ls node_modules/@tanstack/react-virtual`
2. **Step 1 — `types.ts` MODIFY** (GridHandle/GridScrollToOptions/6 신규 prop) → 검증: `tsc --noEmit` 0 error
3. **Step 2 — `internal/useGridVirtualizer.ts` NEW** → 검증: `useVirtualizer` import resolution + tsc 통과
4. **Step 3 — `internal/useGridImperativeHandle.ts` NEW** → 검증: GridHandle import + tsc 통과 + 단위 테스트 (T-06~T-12)
5. **Step 4 — `Grid.tsx` MODIFY** (forwardRef 변환 + virtual 분기 + handle wiring + scrollContainerRef) → 검증: tsc + Storybook 시각
6. **Step 5 — `index.ts` MODIFY** (GridHandle/GridScrollToOptions export) → 검증: tsc + 외부 사용 시 type 가시성
7. **Step 6 — 빌드 검증** → `pnpm --filter @tomis/grid-core build` (tsup CJS+ESM dual + dts) (AC-007)
8. **Step 7 — `pnpm size-limit` 측정** (D13 게이트) → 누적 ≤25 KB 시 G-005 분리 미고려, >25 KB 시 G-005 분리 결정 트리거 (현재 추세상 ≤20 KB 예상)
9. **Step 8 — Storybook story 작성** (Section 12 — `Grid/Virtual1500` + `Grid/VirtualWithPinning` + `Grid/RefScrollTo` + `Grid/RefAddDelete` ≥4 시나리오)
10. **Step 9 — ADR-MOD-GRID-01-005 작성 + README.md 업데이트** (Section 13 — D10 + AC-011/AC-012)

### 11.3 위험 요소

| 위험 | 가능성 | 처리 |
|------|--------|------|
| **forwardRef + generic 타입 추론** — TS forwardRef는 generic 미지원 → cast 패턴 (D4). 호출 사이트에서 `<Grid<User> data ... />` IDE inference가 ReactElement 반환으로 추론될 수 있음 (JSX.Element 와 호환) | 낮 | ChangeTrackingGrid:215-217 검증된 패턴 — 동일 cast 사용. AC-002 + AC-007 통과로 sufficient |
| **D5 padding-row × G-002 sticky thead/pinning 호환** — single `<table>` 내 padding tr이 sticky thead/pinned column 시각에 영향 가능 | 중 | EC-05 + Storybook `Grid/VirtualWithPinning` baseline 캡처 + AC-010 시각 회귀 의무. padding tr는 `aria-hidden="true"` + content 빈 td (시각 영향 0) |
| **rules-of-hooks — useVirtualizer 조건부 호출 금지** | 낮 | D5 정책: 항상 호출 + count=0으로 비활성화 (반환값만 enabled에 따라 분기). useGridVirtualizer Step 2 hook 내부 |
| **measureElement ref × padding-row 충돌** — virtual tr에만 measureElement attach (padding tr에는 attach 안 함) | 낮 | Section 11.1 Step 4 markup에서 padding `<tr>`은 `ref` 미지정. virtual `<tr>`만 `ref={virtualizer!.measureElement}` 부여 |
| **Step 0 monorepo devDep 설치 실패** (pnpm 환경 의존) | 중 | EC-09 documented-deviation. Implementer immediate stop + `findings/blocked/G-004-env.md` 생성 |
| **`virtualizer` 타입 union (Virtualizer \| null)** — Implementer가 `virtualizer.measureElement` 호출 시 non-null assertion 필요 (`virtualizer!.measureElement`) | 낮 | Section 11.1 Step 4 markup에 `isVirtual` flag로 미리 검증 — `!` assertion 안전 (TS narrowing) |
| **번들 누적 한도 19~20 KB / 30 KB** (D13 inherit) | 낮 | D13 정책 — Step 8 측정 의무. 추세상 분리 트리거 발동 가능성 낮음 (advisor item#6) |
| **prompt 산술 stale (한도 0.35 KB 초과 위험)** | 발견됨 | D13 + Section 8.5 정정 표 — Implementer는 spec 본문 권위 (C-27). promptSpecDrift JSON 필드에 본 정정 기록 의무 |
| **wrapper-goals.json L227-232 NEW 4 vs 본 spec NEW 2 + MODIFY 3 분류 불일치** | 발견됨 | D2 결정 — spec 본문 권위 (C-27). 후속: 메인이 wrapper-goals.json 정정 검토 |
| **wrapper-goals.json AC-005 "신규 peerDep" 표현 vs 실제 G-001 시점 선언됨** | 발견됨 | D2 — peer 이미 선언, 본 G-004는 첫 runtime wiring + Step 0 workspace 설치. AC-005 본문 정정 해석 (Section 5) |
| **scrollIntoView fallback × align: 'auto' (virtual-core 옵션)** — DOM scrollIntoView는 'auto' block option 미지원 → 'start' fallback | 낮 | Step 3 코드 명시 — `align === 'center' ? 'center' : align === 'end' ? 'end' : 'start'` 매핑 |

---

## Section 12: 검증 계획

### 단위 테스트 (vitest)

| 테스트 | 시나리오 |
|-------|---------|
| T-01 `useGridVirtualizer(mockTable, ref, false)` | 반환 null (enabled=false) |
| T-02 `useGridVirtualizer(mockTable, ref, true, {estimateSize: 40, overscan: 5})` | Virtualizer 인스턴스 반환 + count=rows.length |
| T-03 useGridVirtualizer mount 후 getVirtualItems() length > 0 (1000행 + 400px height) | virtualization 활성 검증 |
| T-04 padding-row 계산 — virtualItems[0].start = paddingTop, totalSize - last.end = paddingBottom | Section 11.1 Step 4 산식 검증 |
| T-05 virtual tbody markup — padding tr aria-hidden + content td colSpan | Storybook 시각 검증 — vitest는 DOM markup count |
| T-06 `useGridImperativeHandle(ref, table, null, ...)` + ref.current.addRow(seed) (no callback) | dev mode console.warn 1회 + no-op |
| T-07 `ref.current.addRow(seed)` + onAddRow 제공 | onAddRow(seed) 호출 검증 (mock fn) |
| T-08 `ref.current.deleteRow('5')` + onDeleteRow 제공 | onDeleteRow('5') 호출 검증 |
| T-09 `ref.current.scrollTo(50)` + virtualizer | virtualizer.scrollToIndex(50, undefined) 호출 |
| T-10 `ref.current.scrollTo(-1)` + dataLength=10 | clamp 0 + dev warn + virtualizer.scrollToIndex(0) |
| T-11 `ref.current.scrollTo(99999)` + dataLength=10 | clamp 9 + dev warn + virtualizer.scrollToIndex(9) |
| T-12 `ref.current.getSelection()` + table 선택 1행 | TData[] 길이 1 반환 |
| T-13 `ref.current.clearSelection()` | table.setRowSelection({}) 호출 검증 |
| T-14 `ref.current.refresh()` | table.resetRowSelection() 호출 검증 |
| T-15 `<Grid ref={ref} />` (props.onAddRow 미제공) + ref.current.addRow() | dev warn + no-op (EC-03) |
| T-16 `<Grid />` (ref 미전달) | useImperativeHandle silent (EC-04) — render 정상 |
| T-17 `<Grid enableVirtualization data={[]} />` | EmptyState 렌더 (EC-01) |
| T-18 `<Grid enableVirtualization loading />` | SkeletonRows 렌더 (EC-02) |

위치: `packages/grid-core/src/__tests__/useGridVirtualizer.test.ts` + `useGridImperativeHandle.test.ts` + `Grid.G-004.test.tsx` (vitest + @testing-library/react + @testing-library/react-hooks)

### 시각 회귀 (Storybook + Chromatic 또는 수동 스크린샷 — C-13/C-17)

**필수** (migrationImpact: high — C-17): 본 G-004 자체는 사용처 0개이지만 G-005/MOD-GRID-17 비교 baseline 캡처 의무.

| Story | 시나리오 |
|-------|---------|
| `Grid/Virtual1500` | data=1500행 + enableVirtualization + virtualScrollHeight=600 → 부드러운 스크롤 + 스크롤 시 ~25행만 DOM |
| `Grid/VirtualWithPinning` (D5/AC-010) | 1500행 + enableVirtualization + enableColumnPinning (pinLeft 1 + pinRight 1) → sticky thead + pinned column 보존 시각 |
| `Grid/VirtualWithSticky` | 1500행 + enableVirtualization + sticky thead 단독 (G-002 호환) |
| `Grid/VirtualEmpty` (EC-01) | data=[] + enableVirtualization → EmptyState 표시 |
| `Grid/VirtualLoading` (EC-02) | loading=true + enableVirtualization → SkeletonRows 표시 |
| `Grid/RefScrollTo` (D9) | ref + button "Scroll to row 50" → 부드러운 스크롤 |
| `Grid/RefScrollToOutOfRange` (EC-08) | ref + button "Scroll to row -1" → clamp 0 + console.warn 검증 |
| `Grid/RefAddRow` (D3) | ref + button "Add Row" + onAddRow setState → 새 행 즉시 표시 |
| `Grid/RefAddRowNoCallback` (EC-03) | ref + button "Add Row" + onAddRow 미제공 → console.warn 검증 |
| `Grid/RefDeleteRow` (D3) | ref + onDeleteRow setState → 행 즉시 삭제 |
| `Grid/RefGetSelection` (D12) | ref + 행 선택 후 button "Get Selected" → alert 또는 console.log |
| `Grid/RefClearSelection` (D12) | ref + 행 선택 후 button "Clear" → 선택 해제 |
| `Grid/RefRefresh` (D11) | ref + 행 선택 후 button "Refresh" → resetRowSelection 검증 |

위치: `packages/grid-core/src/__stories__/Grid.stories.tsx` (G-001~G-003 story 파일에 추가)

### 빌드 + 번들 검증 (C-12 + D13)

```powershell
cd D:\project\topvel_project\topvel-grid-monorepo

# Step 0 사전 검증
ls node_modules/@tanstack/react-virtual    # 존재 확인

# typecheck (G-001~G-003 보존 + G-004 추가)
pnpm --filter @tomis/grid-core typecheck   # exit 0 (AC-007)

# build (tsup CJS+ESM dual + dts)
pnpm --filter @tomis/grid-core build       # exit 0 (AC-007)

# size-limit (D13 게이트)
pnpm size-limit --json                     # @tomis/grid-core 측정 — JSON 파싱 후 누적 KB

# G-001~G-003 보존 입증 (AC-008 + D11)
git diff packages/grid-core/src/Grid.tsx packages/grid-core/src/types.ts packages/grid-core/src/index.ts
# 변경 라인이 G-004 신규 6 prop / forwardRef 변환 / virtual 분기 / handle wiring / 신규 internal 2 hook 호출만인지 검증
```

### 자동 보완 가능 항목

- 누락된 type export → `index.ts` re-export 명시 (Step 5 의무)
- `any` 우발 사용 → ESLint `@typescript-eslint/no-explicit-any` rule 차단
- 인라인 style 우발 → 본 G-004는 동적 style만 (containerStyle height/overflow + padding tr height — D5/D7 dynamic 값)
- `process.env.NODE_ENV` 가용성 → tsup external + Vite/Webpack 표준 환경 변수 (peer 환경 정상 처리)

---

## Section 13: 상용 제품화 영향

### F-01: 패키지 분류

본 Goal 대상 패키지: **`@tomis/grid-core` (`packages/grid-core`)** — **MIT** licenseTier (canonical-modules.json L75 + grid-core/package.json:5 `"license": "MIT"`).

### F-02: Pro 라이선스 검증

**N/A** — MIT 패키지. `configureGridLicense()` 호출 불필요 (MOD-GRID-99-A는 Pro 패키지 전용).

### F-03: 문서 작성 계획 (C-25)

| 산출물 | 위치 | 작성 시기 |
|--------|------|----------|
| Storybook story 13개 (G-004 추가 — Section 12 시나리오) | `packages/grid-core/src/__stories__/Grid.stories.tsx` | Step 8 |
| README.md 업데이트 (Imperative API + Virtualization 섹션 + EC-03/EC-08 사용자 책임 노트) | `packages/grid-core/README.md` | Step 9 |
| Docusaurus 페이지 (Imperative API + Virtualization) | `apps/docs/docs/grid-core/Grid.mdx` | MOD-GRID-99-B (별도 Goal) |
| API reference (TypeDoc) | 자동 생성 | MOD-GRID-99-B |
| ADR-MOD-GRID-01-005 (D10 — peer 첫 runtime wiring + workspace devDep 설치) | `decisions/MOD-GRID-01-decisions.md` | Step 9 (AC-011) |

### F-04: peerDependencies 정책 (C-22)

**peer 변경 0건** — `@tanstack/react-virtual ^3.0.0` 이미 grid-core/package.json:25 선언 (G-001 시점, ADR-001).

본 G-004는 첫 runtime wiring (D2) + Step 0 workspace devDep 설치 (`pnpm add -DW @tanstack/react-virtual@^3.13.24`). dep 중복 선언 0건 (peer만, dep 미추가). `tsup.config.ts:14` external 배열에 이미 포함 — 번들 영향 0.

ADR-MOD-GRID-01-005 (Step 9, AC-011):
- Title: "G-004 — `@tanstack/react-virtual` 첫 runtime wiring + workspace devDep 설치"
- Decision: peer는 G-001 시점 선언 (ADR-001 Trade-off 항목). G-004가 첫 runtime wiring 도입 + monorepo workspace root에 devDep 설치 (`pnpm add -DW`).
- Trade-off ≥2 (D10 명시):
  - (a) `@tanstack/react-virtual` v3 채택 vs `react-window` 대안 — TanStack ecosystem 일관성
  - (b) padding-row 패턴 (D5 single-table) vs 두-`<table>` absolute (VirtualGrid 패턴) — G-002 sticky/pinning 호환
  - (c) opt-in `enableVirtualization` (D6) vs 자동 임계값 — short list 부적절성 회피
- License: MIT (peer 동일).
- Bundle impact: workspace devDep만 — grid-core dist 무영향 (peer external).

---

## ★ 메타 게이트 H 자가 점검

### H-01: referenceEvidence 경로 실재 (Read 직접 검증)

**모두 YES**. 본문 인용 라인 번호 + Read 결과:

| 출처 | 경로 | 검증 |
|------|------|------|
| L0 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx` | Read L1-220 ✓ — forwardRef + useImperativeHandle 패턴 (L1, L36-46, L110-112, L215-217) |
| L0 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/VirtualGrid.tsx` | Read L1-220 ✓ — useVirtualizer (L98-103), virtualRow.index 매핑 (L165) |
| L0 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/Grid.tsx` | Read L1-278 ✓ — G-001~G-003 산출물 |
| L0 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` | Read L1-291 ✓ — G-001~G-003 산출물 |
| L0 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` | Read L1-10 ✓ |
| L0 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/package.json` | Read L1-30 ✓ — peer L25 `@tanstack/react-virtual ^3.0.0` 확인 |
| L0 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/buildTableOptions.ts` | Read L1-205 ✓ — controlled callback 패턴 (L116-155) |
| L0 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/CheckboxColumn.tsx` | Read L1-58 ✓ |
| L0 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/tsup.config.ts` | Read L1-21 ✓ — external 배열 L13-20 |
| L0 | `D:/project/topvel_project/topvel-grid-monorepo/.size-limit.json` | Read L1-7 ✓ |
| L0 | `D:/project/topvel_project/topvel-grid-monorepo/package.json` | Read L1-30 ✓ — devDeps `@tanstack/react-virtual` 부재 확인 |
| L0 | `D:/project/topvel_project/TOMIS/tw-framework-front/node_modules/@tanstack/react-virtual/package.json` | Bash cat L1-3 ✓ — version 3.13.24 |
| L0 | `D:/project/topvel_project/TOMIS/tw-framework-front/node_modules/@tanstack/virtual-core/dist/esm/index.d.ts` | Bash cat L1-200 ✓ — VirtualizerOptions L46-77 + Virtualizer.scrollToIndex L135 |
| L1 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/tanstack-api-inventory.md` | Read L130-145 §5 가상화 |
| L2 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/current-tanstack-analysis.md` | Read L101-113 §5 |
| R-A | `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-aggrid-analysis.md` | Read L42-92 + Grep `scrollToIndex|gridRef` 검증 |
| R-W | `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-wijmo-analysis.md` | Read 전체 |
| C-NN | `D:/project/topvel_project/TOMIS/.claude/tw-grid/constraints.md` | Read L1-362 ✓ — C-1, C-4, C-12, C-18, C-20, C-21, C-22, C-25, C-27, C-28 |
| ADR | `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-01-decisions.md` | Read L1-220 ✓ — ADR-001~004 누적 |

**판정**: H-01 = **YES** (모든 경로 실재 + 라인 번호 인용 + Read 결과 evidence 명시).

### H-02: implementFiles 경로 합리성 (외부 디렉토리 예외 충족)

**부모 디렉토리 실재** ls 결과:
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/` 실재 (G-001~G-003 산출물 7 파일 존재 — Bash ls 확인)
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/` 실재
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/` 실재 (package.json 등)

**spec Section 8.2 명시**: "이 Goal이 부모 디렉토리를 직접 생성"이 아닌 "기존 디렉토리에 NEW 2 파일 추가" — H-02 외부 디렉토리 예외의 (1) 조부모 실재 + (2) 무파괴 명시 + (3) 명명 컨벤션 일치 모두 충족 (`useGridVirtualizer.ts`/`useGridImperativeHandle.ts` lowerCamelCase hook 컨벤션, `useAutoSelectFirstRow.ts`/`buildTableOptions.ts`와 일치).

**C-28 정정 결정**: D1 — wrapper-goals.json L227-232 G-004 implementFiles 4개 모두 정확 prefix → 정정 불필요.

**판정**: H-02 = **YES**.

### H-03: AC 출처 태그 검증 (본문 인용 100%)

**모든 AC 출처 태그 명시** + spec 본문 인용:

| AC | source | 본문 인용 위치 |
|----|--------|--------------|
| AC-001 | C-4 + D3/D11/D12 | Section 2.1 GridHandle interface + D3/D11/D12 (사전결정 표) |
| AC-002 | L0 (ChangeTrackingGrid:215-217) + D4 | Section 2.3 forwardRef cast + 핵심 발췌 1 |
| AC-003 | C-18 + D5/D8 | Section 2.4 useGridVirtualizer + 핵심 발췌 3 |
| AC-004 | L0 (VirtualGrid.tsx:165) + D5 | Section 2.4 padding-row + 핵심 발췌 4 |
| AC-005 | C-22 + D2 | Section 4 호환성 + Section 9 peer + grid-core/package.json:25 |
| AC-006 | C-18 + C-25 | Section 12 Storybook stories ≥3 |
| AC-007 | C-12 + D2 | Section 12 빌드 검증 + Step 0 |
| AC-008 | C-1 (2026-05-14 G-004 추가) + D11 | Section 8.2 무파괴 + D11 보존 의무 |
| AC-009 | C-21 + D13 | Section 8.5 번들 + D13 게이트 |
| AC-010 | C-13/C-17 + D5 | Section 12 Storybook + EC-05 + AC-010 |
| AC-011 | C-20 + D10 | Section 4 + Section 13 F-04 ADR-005 |
| AC-012 | C-25 + wrapper-goals.json AC-006 | Section 13 F-03 문서 계획 |

**판정**: H-03 = **YES**.

**메타 게이트 종합**: H-01 + H-02 + H-03 모두 YES → 일반 채점 진행 가능.

---

## ★ Cross-consistency 표 (D# ↔ 본문 ↔ Section 7 ↔ Section 11 — rubric G-01 v1.0.4)

| D# | 본문 위치 | Section 7 표 행 | Section 11 Step | breakdown 일치 검증 |
|----|----------|--------------|----------------|------------------|
| D1 | Section 7 + 8.1 | (전체 — 경로 prefix) | (전체 — Step 0~5 monorepo 경로) | 합계 일치 ✓ (모두 monorepo prefix) |
| D2 | Section 7 + 11.1 Step 0 + AC-005/AC-007 | 5 행 (NEW 2 + MODIFY 3) | Step 1~5 (5 파일) + Step 0 (devDep) | **합계 일치 ✓** (5 = 5) **분류 일치 ✓** (NEW 2 [`useGridVirtualizer`, `useGridImperativeHandle`] + MODIFY 3 [`types.ts`, `Grid.tsx`, `index.ts`]) **항목 이름 일치 ✓** (Section 7 #1~5 ↔ Step 1~5 1:1 매핑) |
| D3 | Section 2.1 + 2.2 + AC-001 + EC-03 | #1 types.ts (3 callback prop 추가) | Step 1 (types.ts MODIFY) + Step 3 (useGridImperativeHandle NEW callback wiring) | callback 3종 (`onAddRow`/`onDeleteRow`/`onUpdateRow`) ↔ GridHandle 3 method (`addRow`/`deleteRow`/`updateRow`) 1:1 ✓ |
| D4 | Section 2.3 + 11.1 Step 4 + AC-002 | #4 Grid.tsx MODIFY | Step 4 (Grid.tsx MODIFY — forwardRef 변환) | forwardRef + cast 패턴 ↔ ChangeTrackingGrid:215-217 출처 인용 일치 ✓ |
| D5 | Section 2.4 + 11.1 Step 4 + AC-003/AC-004 + EC-05 | #2 useGridVirtualizer + #4 Grid.tsx tbody 분기 | Step 2 (useGridVirtualizer NEW) + Step 4 (Grid.tsx tbody virtual 분기) | padding-row 패턴 ↔ single `<table>` 보존 일치 ✓ |
| D6 | Section 2.2 + AC-003 + EC-06 | #1 types.ts (`enableVirtualization` prop) | Step 1 (types.ts MODIFY) | opt-in only 정책 ↔ 자동 임계값 미적용 일치 ✓ |
| D7 | Section 2.2 + AC-003 + EC-07 | #1 types.ts (`virtualScrollHeight` prop) + #4 Grid.tsx (외곽 div 분기) | Step 1 + Step 4 | default 400 + dev warn 일치 ✓ |
| D8 | Section 2.4 + AC-003/AC-004 | #1 types.ts (`virtualizerOptions` prop) + #2 useGridVirtualizer (DEFAULT 36/10) | Step 1 + Step 2 | estimateSize 36 + overscan 10 default ↔ wrap 함수 시그니처 일치 ✓ |
| D9 | Section 2.1 + 2.5 + AC-001 + EC-08 | #3 useGridImperativeHandle (scrollTo 구현) | Step 3 (clamp + virtualizer/DOM fallback) | clamp [0, length-1] + ScrollToOptions re-export 일치 ✓ |
| D10 | Section 4 + 9 + 13 F-04 + AC-011 | (5 파일 외 — Documents) | Step 9 (ADR-005 작성) | trade-off ≥2 (D5/D6/lib 3건 명시) 일치 ✓ |
| D11 | Section 2.1 (refresh) + AC-001 | #3 useGridImperativeHandle (refresh 구현) | Step 3 | `table.resetRowSelection()` 위임 ↔ AG api.refreshCells() 등가 일치 ✓ |
| D12 | Section 2.1 (getSelection/clearSelection) + AC-001 | #3 useGridImperativeHandle | Step 3 | TData[] 반환 + `table.setRowSelection({})` 일치 ✓ |
| D13 | Section 8.5 + 11.2 Step 7 + AC-009 | (5 파일 외 — measurement gate) | Step 7 (size-limit 측정) | 누적 ≤25 KB 시 G-005 분리 미고려 + prompt stale 정정 표 일치 ✓ |

**Breakdown 검증 (rubric G-01 v1.0.4 — G-002 self-review 강화 룰)**:
- D2 표 본문: "**NEW 2 + MODIFY 3 = 5 파일**. NEW: `internal/useGridVirtualizer.ts` + `internal/useGridImperativeHandle.ts`. MODIFY: `Grid.tsx` + `types.ts` + `index.ts`."
- Section 7 표 5행: #1 types.ts MODIFY, #2 useGridVirtualizer NEW, #3 useGridImperativeHandle NEW, #4 Grid.tsx MODIFY, #5 index.ts MODIFY
- **합계 일치**: 5 = 5 ✓
- **분류 일치**: NEW 2 (#2, #3) + MODIFY 3 (#1, #4, #5) = 5 ✓
- **항목 이름 일치**: D2 enumerate 5 파일 ↔ Section 7 #1~5 1:1 ✓ + Section 11 Step 1~5 1:1 ✓

**Cross-consistency 검증 종합**: 모든 D# ↔ 본문 ↔ Section 7 ↔ Section 11 1:1 일치. G-01 v1.0.4 강화 룰 (breakdown 세부 일치) 통과.

---

## End of G-004 Spec
