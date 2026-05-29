# G-003 Spec — 그룹 헤더 자식 컬럼 visibility 일괄 토글 + GroupedHeaderGrid alias (C-6)

**Module**: MOD-GRID-14 / Multi-row Header (Column Groups)  
**Goal**: G-003  
**Spec Version**: 1.0.0  
**Rubric Version**: specify-rubric v1.0.8  
**Author**: tw-grid Spec Writer (C-15 위임)  
**Date**: 2026-05-15  
**Status**: Draft — pending Coverage Verifier (haiku)  
**Threshold**: 90 (goals.json `stages.specify.threshold` 기준 — rubric 기본값 85를 override. goals.json이 governing document)  
**Depends on**: MOD-GRID-14/G-001 ✅, MOD-GRID-14/G-002 ✅, MOD-GRID-99-A/G-001

---

## Section 1 — Goal Summary & User Story

**Goal Title**: 그룹 헤더 자식 컬럼 visibility 일괄 토글 + GroupedHeaderGrid alias (C-6)

**User Story**:  
사용자가 그룹 헤더를 클릭하면 해당 그룹 하위 컬럼들이 일괄 숨김/표시 토글되어야 한다. 기존 `GroupedHeaderGrid` 컴포넌트를 사용하던 코드가 최소 변경으로 동작해야 한다.

**User Journey Steps** (from goals.json):
1. `<Grid columns={groupedColumns} enableGroupToggle />` 설정
2. 그룹 헤더 클릭 → 해당 그룹 자식 컬럼 `columnVisibility` 일괄 `false` (접힘 표시 아이콘)
3. 다시 클릭 → 일괄 `true` (펼침)
4. `<GroupedHeaderGrid data={...} columns={...} />` (기존 사용처) — 동일 동작 보장 (C-6)

**Priority**: P1  
**Migration Impact**: low  
**Breaking**: false  
**Bundle Impact**: +2 KB (toggle 로직 + alias — 합계 ≤ 9 KB grid-pro-header 전체, 한도 ≤ 20 KB C-21)

---

## Section 2 — Acceptance Criteria

| ID | Criteria | Source Constraint |
|----|----------|-------------------|
| AC-001 | `enableGroupToggle?: boolean` prop — 그룹 헤더 클릭 시 TanStack `column.toggleVisibility()` 자식 일괄 호출 (C-2 표준 API). TypeScript strict (C-4) | C-2, C-4 |
| AC-002 | 그룹 접힘 시 그룹 헤더 셀 `colSpan=1` + 아이콘 표시 (Tailwind className — C-5). 그룹 헤더 자체는 항상 표시 | C-5 |
| AC-003 | `GroupedHeaderGrid` export alias — props: `{ data, columns, ...GridProps }` — C-6 1 minor 버전 alias 유지 (C-23) | C-6, C-23 |
| AC-004 | `@mescius/wijmo*` import 0건 (C-16) | C-16 |
| AC-005 | C-12: `tsc --noEmit` 0 error (packages/grid-pro-header 전체) | C-12 |
| AC-006 | C-25: Storybook story 1개 — 그룹 토글 + GroupedHeaderGrid alias 동일 동작 시나리오 | C-25 |

---

## Section 3 — Approach & Architecture Decision

### 3.1 Architecture Decision (load-bearing finding)

**Critical finding — Grid.tsx renders inline `<thead>` (does NOT call MultiRowHeader)**:

`packages/grid-core/src/Grid.tsx` L268-348은 `<thead>`를 직접 인라인 렌더링하며 `MultiRowHeader` 컴포넌트를 호출하지 않는다. 따라서 `enableGroupToggle`을 `grid-core/Grid.tsx`에 추가하면 cross-package 배선이 발생하고 G-003 scope를 초과한다.

**결론**: `enableGroupToggle` prop은 `MultiRowHeader`에만 추가한다. `GroupedHeaderGrid` legacy alias는 자체적으로 `useReactTable + MultiRowHeader`를 조합한다 (D2 결정).

### 3.2 Component Architecture

```
packages/grid-pro-header/
├── src/
│   ├── MultiRowHeader.tsx      ← MODIFY: enableGroupToggle prop 추가 (G-003 핵심)
│   ├── index.ts                ← MODIFY: GroupedHeaderGrid re-export 추가
│   ├── legacy/
│   │   └── GroupedHeaderGrid.tsx  ← NEW: alias 구현 (useReactTable + MultiRowHeader)
│   ├── createColumnGroup.ts    ← NO CHANGE (G-001 결과물)
│   ├── types.ts                ← MODIFY: GroupedHeaderGridProps export 추가
│   └── package.json            ← NO CHANGE (peerDeps 이미 충족)
│
tw-framework-front/
└── src/components/tomis/Grid/
    └── GroupedHeaderGrid.tsx   ← MODIFY: alias import로 교체 (C-34 경계 주의)
```

### 3.3 enableGroupToggle 구현 전략

- `header.column.getLeafColumns()`: TanStack 표준 API — 그룹의 모든 leaf 자식 컬럼 열거
- `leafColumn.toggleVisibility()`: 개별 leaf 컬럼 visibility 토글 (C-2 표준 API)
- 그룹이 "접혀 있는지" 판단: `header.column.getLeafColumns().every(c => !c.getIsVisible())`
- 접혀 있으면 → 모두 `true` (펼침), 그렇지 않으면 → 모두 `false` (접힘)
- leaf 컬럼(그룹 헤더가 아닌 컬럼)에는 toggle 미적용 (기존 sort handler 유지)
- `enableGroupToggle`이 false/undefined이면 → 기존 G-002 동작 완전 보존 (C-29 조건부 적용)

### 3.4 GroupedHeaderGrid alias 전략

- **신규 파일**: `packages/grid-pro-header/src/legacy/GroupedHeaderGrid.tsx`
- **역할**: `useReactTable` + `MultiRowHeader(enableGroupToggle)` 조합으로 기존 GroupedHeaderGrid 외관 완전 보존
- **props**: 기존 L0 참조(tw-framework-front/src/components/tomis/Grid/GroupedHeaderGrid.tsx)의 8개 props 그대로 수용
- **deprecation notice**: JSDoc `@deprecated` 태그 + console.warn (dev 환경) — C-6 1 minor 기간 유지
- **F-02**: index.ts를 통한 re-export 경로 → `verifyOrWarn` 자동 실행 (별도 호출 불필요)

---

## Section 4 — Affected Usage Files (A-04 v1.0.8)

| File | Repo | Change Type | C-34 Note |
|------|------|-------------|-----------|
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/GroupedHeaderGrid.tsx` | TOMIS base repo | MODIFY — alias import로 교체 (8 props → re-export, C-17 외관 보존) | **C-34**: 이 파일은 TOMIS base repo에 있어 worktree 경계 외부. Edit은 PowerShell-via-Bash 우회 필요. Implementer가 직접 확인 필수. |

**Dep resolution path (B-04 v1.0.8)**:  
`tw-framework-front/vite.config.ts` L26:
```typescript
'@tomis/grid-pro-header': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-pro-header/src'),
```
→ `import { GroupedHeaderGrid } from '@tomis/grid-pro-header'`가 `packages/grid-pro-header/src/index.ts`로 resolve됨.

---

## Section 5 — API Design

### 5.1 MultiRowHeaderProps 확장 (MODIFY)

```typescript
// packages/grid-pro-header/src/MultiRowHeader.tsx
export interface MultiRowHeaderProps<TData = unknown> {
  table: Table<TData>;
  enableStickyHeader?: boolean;   // G-002 (unchanged)
  frozenColumns?: number;          // G-002 (unchanged)
  /**
   * When true, clicking a group header cell toggles the visibility of all its
   * leaf child columns using TanStack `column.toggleVisibility()` (AC-001, C-2).
   * Leaf columns (non-group headers) retain their sort-click handler unchanged.
   * Default: false — G-001/G-002 behaviour preserved (breaking: false).
   */
  enableGroupToggle?: boolean;
}
```

### 5.2 GroupedHeaderGridProps (NEW — legacy alias)

```typescript
// packages/grid-pro-header/src/legacy/GroupedHeaderGrid.tsx
interface GroupedHeaderGridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  pagination?: GridPaginationOptions;
  rowSelection?: GridRowSelectionOptions;
  onRowClick?: (row: TData) => void;
  loading?: boolean;      // default: false
  emptyText?: string;     // default: '데이터가 없습니다.'
  className?: string;     // default: ''
}
```

Props는 L0 참조 파일(tw-framework-front의 기존 GroupedHeaderGrid.tsx)과 1:1 일치. 외관 보존 (C-17).

### 5.3 GridPaginationOptions / GridRowSelectionOptions

기존 L0에서 사용하는 타입 구조:
```typescript
interface GridPaginationOptions {
  pageSize?: number;    // default: 20
  showPageInfo?: boolean;
}
interface GridRowSelectionOptions {
  enabled: boolean;
  onSelectionChange?: (rows: TData[]) => void;
}
```
이 타입들은 legacy 파일 내부에 인라인 정의하거나, `tw-framework-front`에서 import하는 방식으로 처리. 단, Pro 패키지(grid-pro-header)가 tw-framework-front에 역방향 의존하면 안 됨 — 인라인 정의 권장.

---

## Section 6 — Implementation Guide

### 6.1 MultiRowHeader.tsx 수정 요점 (BEFORE → AFTER)

**BEFORE (G-002 결과물 — L82-86)**:
```typescript
export function MultiRowHeader<TData>({
  table,
  enableStickyHeader,
  frozenColumns,
}: MultiRowHeaderProps<TData>): JSX.Element {
```

**AFTER**:
```typescript
export function MultiRowHeader<TData>({
  table,
  enableStickyHeader,
  frozenColumns,
  enableGroupToggle,
}: MultiRowHeaderProps<TData>): JSX.Element {
```

**그룹 헤더 click handler (AC-001 구현)**:

```typescript
// 그룹 헤더 클릭 핸들러 — leaf 컬럼이 있는 경우만 적용
const groupClickHandler =
  enableGroupToggle === true && !isLeaf
    ? () => {
        const leafCols = header.column.getLeafColumns();
        // 모두 숨겨져 있으면 펼침, 하나라도 보이면 접힘
        const allHidden = leafCols.every((c) => !c.getIsVisible());
        leafCols.forEach((c) => c.toggleVisibility(allHidden));
      }
    : undefined;
```

**onClick 조건부 적용 (C-29 조건부 spread)**:
```typescript
// 기존: isLeaf ? header.column.getToggleSortingHandler() : undefined
// G-003: 그룹 헤더이면서 enableGroupToggle이면 groupClickHandler 사용
onClick={isLeaf ? header.column.getToggleSortingHandler() : groupClickHandler}
```

**접힘 아이콘 (AC-002 — Tailwind className, C-5)**:
```typescript
// 그룹 헤더 content — enableGroupToggle일 때 접힘/펼침 아이콘 추가
{enableGroupToggle === true && !isLeaf && (
  <span className="text-gray-400 ml-1">
    {header.column.getLeafColumns().every((c) => !c.getIsVisible()) ? '▶' : '▼'}
  </span>
)}
```

**그룹 헤더 접힌 경우 colSpan 오버라이드 (AC-002)**:
```typescript
// colSpan: 접혀 있으면 1, 아니면 TanStack 계산값
const effectiveColSpan =
  enableGroupToggle === true &&
  !isLeaf &&
  header.column.getLeafColumns().every((c) => !c.getIsVisible())
    ? 1
    : header.colSpan;
```

### 6.2 src/legacy/GroupedHeaderGrid.tsx — 신규 파일 구조

```typescript
/**
 * GroupedHeaderGrid — C-6 legacy alias for `MultiRowHeader`-based grouped grid.
 *
 * @deprecated Use `<Grid columns={createColumnGroup(...)} enableGroupToggle />`
 * instead. This alias will be removed after 1 minor version (C-6, C-23).
 *
 * @see G-003-spec.md Section 6.2
 */

import { useMemo, useState, type CSSProperties } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { MultiRowHeader } from '../MultiRowHeader';

// [인라인 타입 정의 — tw-framework-front 역참조 금지]
interface GridPaginationOptions { pageSize?: number; showPageInfo?: boolean; }
interface GridRowSelectionOptions<TData> {
  enabled: boolean;
  onSelectionChange?: (rows: TData[]) => void;
}

export interface GroupedHeaderGridProps<TData = unknown> {
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
 * @deprecated — C-6 alias. 1 minor version 유지.
 */
export function GroupedHeaderGrid<TData>({
  data, columns, pagination, rowSelection, onRowClick,
  loading = false, emptyText = '데이터가 없습니다.', className = '',
}: GroupedHeaderGridProps<TData>): JSX.Element {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn(
      '[GroupedHeaderGrid] deprecated — use <Grid enableGroupToggle columns={createColumnGroup(...)} /> (C-6)',
    );
  }

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: pagination?.pageSize ?? 20 } },
  });

  // ... tbody / pagination 렌더링 (L0 외관 보존 — C-17)
  // Implementer: L0(GroupedHeaderGrid.tsx L71-180) 패턴 복사 후 thead를 MultiRowHeader로 교체
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <MultiRowHeader table={table} enableGroupToggle />
          {/* tbody: L0 L119-145 패턴 그대로 유지 */}
        </table>
      </div>
      {/* pagination: L0 L148-158 패턴 그대로 유지 */}
    </div>
  );
}
```

> **Note**: Implementer는 L0 파일(`tw-framework-front/src/components/tomis/Grid/GroupedHeaderGrid.tsx`)의 tbody(L119-145)와 pagination(L148-158)을 그대로 이식하여 외관 완전 보존. tbody/pagination 상세 코드는 Implementation 단계에서 직접 이식 (C-17).

### 6.3 src/index.ts 수정 (MODIFY)

```typescript
// 기존 exports (G-001/G-002 결과물 — NO CHANGE):
export { createColumnGroup } from './createColumnGroup';
export { MultiRowHeader } from './MultiRowHeader';
export type { ColumnGroupConfig } from './createColumnGroup';
export type { MultiRowHeaderProps } from './MultiRowHeader';

// G-003 추가:
export { GroupedHeaderGrid } from './legacy/GroupedHeaderGrid';
export type { GroupedHeaderGridProps } from './legacy/GroupedHeaderGrid';
```

`verifyOrWarn('@tomis/grid-pro-header')` 호출은 index.ts L27-30에 이미 존재 — 수정 불필요. `GroupedHeaderGrid`를 `import { GroupedHeaderGrid } from '@tomis/grid-pro-header'`로 사용하면 index.ts evaluation 경로를 통해 자동 적용됨.

### 6.4 src/types.ts 수정 (MODIFY)

```typescript
export type { ColumnGroupConfig } from './createColumnGroup';
export type { MultiRowHeaderProps } from './MultiRowHeader';
// G-003 추가:
export type { GroupedHeaderGridProps } from './legacy/GroupedHeaderGrid';
```

### 6.5 tw-framework-front/src/components/tomis/Grid/GroupedHeaderGrid.tsx 교체 (C-34)

**BEFORE (현재 파일 — 인라인 구현, 185줄)**:
```typescript
// 직접 useReactTable + getHeaderGroups() 인라인 구현
import { useReactTable, ... } from '@tanstack/react-table';
// ... 185줄의 자체 구현
```

**AFTER (alias로 교체)**:
```typescript
/**
 * GroupedHeaderGrid — re-exported from @tomis/grid-pro-header (G-003 alias migration).
 * @deprecated — 1 minor version 유지 후 <Grid enableGroupToggle /> 사용 권장.
 */
export { GroupedHeaderGrid } from '@tomis/grid-pro-header';
export type { GroupedHeaderGridProps } from '@tomis/grid-pro-header';
```

**C-34 경계 주의**: 이 파일은 TOMIS base repo (`D:/project/topvel_project/TOMIS/`) 내부에 있어 현재 worktree 경계 외부. Implementer는 PowerShell-via-Bash 우회를 사용하여 직접 편집해야 함.

**vite.config.ts alias resolution** (B-04 v1.0.8 인용):  
`tw-framework-front/vite.config.ts` L26:
```typescript
'@tomis/grid-pro-header': path.resolve(__dirname, '../../topvel-grid-monorepo/packages/grid-pro-header/src'),
```
→ 위의 import는 `packages/grid-pro-header/src/index.ts`로 resolve됨 (no npm publish 필요).

---

## Section 7 — File Table (C-30 Truth Table — D# 결정 반영)

### D1 Decision: goals.json implementFiles prefix 수정 (C-28)

goals.json G-003 `implementFiles`는 모두 `D:/project/topvel_project/TOMIS/packages/...` 형태로 저장되어 있으나 실제 경로는 `D:/project/topvel_project/topvel-grid-monorepo/packages/...`. D1 결정으로 아래 테이블은 corrected prefix를 사용함.

### D2 Decision: enableGroupToggle — MultiRowHeader에만 추가 (grid-core/Grid 제외)

Grid.tsx(L268-348) 인라인 thead 렌더링 확인 → cross-package 배선 불필요. enableGroupToggle은 MultiRowHeader props에만 추가.

### D3 Decision: legacy alias — 역방향 의존 없는 인라인 타입

`GroupedHeaderGrid`가 tw-framework-front 타입을 import하면 역방향 의존 발생 → `GridPaginationOptions` 등은 legacy 파일 내 인라인 정의.

### D4 Decision: package.json NO CHANGE (D1 corrected path)

G-001/G-002에서 이미 `@tanstack/react-table ^8.0.0` peerDeps 설정됨. `GroupedHeaderGrid`가 `useReactTable`을 사용해도 추가 deps 불필요.

| File (D1-corrected path) | Repo | Action | Change Size |
|--------------------------|------|--------|-------------|
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/src/legacy/GroupedHeaderGrid.tsx` | monorepo | **NEW** | ~120줄 (alias + inline types + useReactTable) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/src/MultiRowHeader.tsx` | monorepo | **MODIFY** | +~25줄 (enableGroupToggle prop + handler + icon) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/src/index.ts` | monorepo | **MODIFY** | +2줄 (GroupedHeaderGrid re-export 2개) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/src/types.ts` | monorepo | **MODIFY** | +1줄 (GroupedHeaderGridProps re-export) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/package.json` | monorepo | **NO CHANGE** (D4) | — |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/EULA.md` | monorepo | **NO CHANGE** | — |
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/GroupedHeaderGrid.tsx` | TOMIS base (C-34) | **MODIFY** — alias re-export로 교체 | 185줄 → ~5줄 |

**C-30 검증**: 위 테이블의 모든 경로는 D1 corrected prefix(`topvel-grid-monorepo/packages`) 사용. goals.json의 잘못된 `TOMIS/packages` 경로는 D1에 의해 corrected됨. 산문과 테이블 간 모순 없음.

---

## Section 8 — Reference Evidence

| Key | Source | Usage |
|-----|--------|-------|
| L0 | `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/GroupedHeaderGrid.tsx` | alias 대상 — 8 props, 외관 보존 기준 (C-17) |
| L1 | TanStack Table v8: `column.toggleVisibility()`, `column.getLeafColumns()`, `getIsVisible()`, `VisibilityState` | AC-001 구현 근거 (C-2) |
| L2 | (N/A) | — |
| L3 | (N/A) | — |
| R-A | `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-aggrid-analysis.md` — AG Grid Column Groups Community feature | 개념 참조만 (C-7 준수) |
| R-W | `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/publish-wijmo-analysis.md §4` — Wijmo column group visibility 토글 패턴 | 참조만, 코드 차용 X (C-16 절대 준수) |
| G-001-spec | `D:/project/topvel_project/TOMIS/.claude/tw-grid/artifacts/MOD-GRID-14/header/G-001-spec.md` | D1 prefix correction 패턴, F-02 verifyOrWarn 패턴 |
| G-002-spec | `D:/project/topvel_project/TOMIS/.claude/tw-grid/artifacts/MOD-GRID-14/header/G-002-spec.md` | D# 결정 테이블 패턴, C-29 spread 패턴 |
| ADR-MOD-GRID-14-002 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-14-decisions.md` | Pro 인라인 stub fallback ADR |

---

## Section 9 — Pro Package Compliance (F-02)

### 9.1 F-02 — Pro 인라인 stub fallback (4가지 YES 조건)

constraints.md C-24 Pattern Catalog Note (G-001 Self-Review 정책 승격 적용):

| # | 조건 | 상태 | 근거 |
|---|------|------|------|
| F-02-1 | **인라인 함수 정의 위치**: `verifyOrWarn`은 `packages/grid-pro-header/src/index.ts` L27-30에 인라인 정의 (stub body: `/* MOD-GRID-99-A/G-002 will implement */`) | ✅ YES | G-001 결과물 — G-003은 수정하지 않음 |
| F-02-2 | **real import 금지**: `import { verifyOrWarn } from '@tomis/grid-license'` 구문 0건 유지 — `packages/grid-pro-header/src/index.ts`에 신규 real import 추가 금지 | ✅ YES | G-003 index.ts 수정은 GroupedHeaderGrid re-export만 |
| F-02-3 | **package.json optional peer 명시**: `peerDependencies: { "@tomis/grid-license": "^1.0.0" }` + `peerDependenciesMeta: { "@tomis/grid-license": { optional: true } }` — G-001에서 설정 완료 | ✅ YES | G-003 package.json NO CHANGE (D4) |
| F-02-4 | **환경 제약 ADR spec deliverable 포함**: ADR-MOD-GRID-14-002 (MOD-GRID-99-A/G-002 완료 전 인라인 stub 사용 결정) — G-001 implement 단계에서 작성, G-003 spec에서 인용 | ✅ YES | decisions/MOD-GRID-14-decisions.md |

**F-02 판정**: 4가지 조건 모두 YES — G-003 신규 Pro 패키지 dep 0건 추가.

### 9.2 legacy alias와 verifyOrWarn 자동 적용

`import { GroupedHeaderGrid } from '@tomis/grid-pro-header'`는 vite alias 경로:
```
@tomis/grid-pro-header → packages/grid-pro-header/src/index.ts
```
로 resolve됨. `index.ts` 모듈 evaluation 시 L27-30의 `verifyOrWarn('@tomis/grid-pro-header')` 자동 실행. legacy 파일(`src/legacy/GroupedHeaderGrid.tsx`)이 별도 verifyOrWarn 호출하면 이중 실행이므로 **금지**.

### 9.3 EULA 및 Pro 라이선스

`packages/grid-pro-header/EULA.md` — G-001에서 생성, G-003에서 수정 없음. `package.json` `"license": "SEE LICENSE IN EULA"` 동일.

---

## Section 10 — Compatibility (C-6 / C-17)

### 10.1 C-6 — 하위 호환성 (breaking: false)

| 항목 | 보존 여부 |
|------|-----------|
| `MultiRowHeaderProps.table`, `enableStickyHeader`, `frozenColumns` | ✅ 변경 없음 — G-002 동작 완전 보존 |
| `enableGroupToggle` 미설정 시 기존 동작 | ✅ `enableGroupToggle === true` 조건부로만 적용 |
| `createColumnGroup` / `MultiRowHeader` export | ✅ 변경 없음 |
| `GroupedHeaderGrid` alias | ✅ 신규 추가 — 기존 사용처에서 import 가능 |

### 10.2 C-23 — Deprecation Strategy

```
GroupedHeaderGrid → 1 minor version 유지 → 제거
```
- `@deprecated` JSDoc 태그 (src/legacy/GroupedHeaderGrid.tsx)
- `console.warn` (dev 환경 한정, `process.env.NODE_ENV !== 'production'`)
- Migration path: `기존 GroupedHeaderGrid → <Grid enableGroupToggle columns={createColumnGroup(...)} />`

### 10.3 C-17 — 외관 보존 검증 (Visual Regression)

**검증 대상**: `tw-framework-front/src/components/tomis/Grid/GroupedHeaderGrid.tsx` 교체 전후 렌더 결과

**검증 방법 1 — Tailwind className grep**:
```powershell
# 기존 파일의 모든 Tailwind 클래스 목록 추출
Select-String -Path "tw-framework-front/src/components/tomis/Grid/GroupedHeaderGrid.tsx" `
  -Pattern "className=" | Select-String -Pattern '"([^"]+)"' -AllMatches | ...
```

구체적으로 보존 필수 className 목록 (L0 참조 파일 기준):
- `flex flex-col` (outer wrapper — L71)
- `overflow-x-auto rounded-lg border border-gray-200` (table container — L72)
- `bg-gray-50` (thead — MultiRowHeader에서 보존)
- `min-w-full divide-y divide-gray-200` (table 태그)
- `px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border border-gray-200 whitespace-nowrap select-none` (th 기본)
- pagination 컨트롤 className 목록 (L148-158)

**검증 방법 2 — Storybook story diff**:
```
파일: packages/grid-pro-header/src/stories/GroupedHeaderGrid.stories.tsx
시나리오: 교체 전 GroupedHeaderGrid props 동일 → story snapshot 비교
```

**검증 방법 3 — grep 명령 (C-16 compliance)**:
```powershell
# Wijmo import 0건 확인
Select-String -Path "packages/grid-pro-header/src/**/*.tsx" -Pattern "@mescius/wijmo"
# → 결과 0건이어야 함
```

---

## Section 11 — Implementation Guidelines

### 11.1 enableGroupToggle — MultiRowHeader 구현 세부사항

1. **leaf 판별**: `const isLeaf = header.subHeaders.length === 0` (G-002 기존 코드 — 변경 없음)
2. **그룹 click handler**: `enableGroupToggle === true && !isLeaf`일 때만 생성 (C-29)
3. **toggleVisibility 순서**: `header.column.getLeafColumns()` 결과 순서대로 순회
4. **allHidden 계산**: `leafCols.every((c) => !c.getIsVisible())` — 모두 숨겨진 상태이면 펼침, 아니면 접힘
5. **placeholder 셀**: `header.isPlaceholder === true`이면 toggle handler 미적용 (기존 early return 로직 유지)
6. **cursor-pointer**: `enableGroupToggle === true && !isLeaf`이면 `cursor-pointer hover:bg-gray-100` Tailwind 클래스 추가 (C-5)
7. **colSpan 오버라이드**: 접혀 있을 때 `effectiveColSpan=1` — `colSpan={effectiveColSpan}` 사용

### 11.2 C-29 — exactOptionalPropertyTypes 준수

MultiRowHeader에서 legacy alias로 props 전달 시 optional prop 조건부 spread 필수:

```typescript
// ✅ CORRECT (C-29)
<MultiRowHeader
  table={table}
  enableGroupToggle  // always true in legacy alias
  {...(stickyEnabled ? { enableStickyHeader: true } : {})}
  {...(frozenCols ? { frozenColumns: frozenCols } : {})}
/>

// ❌ WRONG (C-29 violation)
<MultiRowHeader
  table={table}
  enableGroupToggle={true}
  enableStickyHeader={undefined}  // exactOptionalPropertyTypes 위반
/>
```

### 11.3 TanStack v8 표준 API 사용 (C-2 compliance)

| 사용 API | 출처 | 용도 |
|---------|------|------|
| `column.getLeafColumns()` | TanStack v8 표준 | 그룹 자식 leaf 컬럼 열거 |
| `column.toggleVisibility(nextValue?)` | TanStack v8 표준 | visibility 토글 (AC-001) |
| `column.getIsVisible()` | TanStack v8 표준 | 현재 visibility 상태 조회 |
| `header.subHeaders` | TanStack v8 표준 | leaf/group 판별 |
| `header.colSpan` | TanStack v8 표준 | 그룹 헤더 colSpan |
| `header.isPlaceholder` | TanStack v8 표준 | placeholder 셀 판별 |

비표준 API (`header.column.columnDef._groupColumnDef` 등) 사용 금지 (C-2).

### 11.4 TypeScript strict 준수 (C-4)

- `any` 타입 0건
- `enableGroupToggle?: boolean` — optional prop (undefined는 false와 동일 처리)
- `getLeafColumns()` 반환: `Column<TData, unknown>[]` — 타입 안전 순회
- `VisibilityState`: `Record<string, boolean>` — TanStack 표준 타입
- `GroupedHeaderGrid<TData>`: generic type parameter 유지

---

## Section 12 — Edge Cases

| ID | Scenario | Expected Behavior |
|----|----------|-------------------|
| EC-01 | `enableGroupToggle=true`이지만 그룹이 없는 flat 컬럼만 사용 | 모든 컬럼은 isLeaf=true → 그룹 toggle handler 0개 생성. sort handler 기존 동작 유지. 오류 없음. |
| EC-02 | 그룹 헤더 클릭 → 일부 자식 visible, 일부 hidden (부분 접힘 상태) | `every(c => !c.getIsVisible())` = false → 전체 접힘(false) 실행. 명확한 UX: 부분 상태는 → 접힘으로 수렴. |
| EC-03 | `enableGroupToggle=true` + `enableStickyHeader=true` + `frozenColumns=2` 동시 사용 | 각 prop 독립적 적용 — sticky top, frozen left, group toggle 핸들러 공존. z-index 레이어(G-002 D4) 유지. |
| EC-04 | 중첩 그룹 (3단 이상 header) | `getLeafColumns()`는 최종 leaf만 반환 → 중간 그룹 클릭 시 최종 leaf들만 toggle. 의도된 동작. |
| EC-05 | `enableGroupToggle=false` (기본값 / 미설정) | G-001/G-002 동작 완전 보존. 그룹 헤더 onClick=undefined, colSpan=TanStack 계산값, 아이콘 없음. |

---

## Section 13 — Rubric Self-Assessment (v1.0.8 — 32 items)

**Governing threshold**: `goals.json G-003 stages.specify.threshold: 90` (rubric 기본값 85를 override. goals.json이 governing document).

### Category A — Problem & Goal Clarity (5 items)

| ID | Item | Status | Evidence |
|----|------|--------|---------|
| A-01 | Goal ID + title + user story 명확 | ✅ YES | Section 1 |
| A-02 | User journey steps 구체적 | ✅ YES | Section 1 (4단계) |
| A-03 | Acceptance criteria — testable (≥3) | ✅ YES | Section 2 (AC-001~006 6개) |
| A-04 | affectedUsageFiles 목록 + C-34 boundary note (v1.0.8) | ✅ YES | Section 4 — tw-framework-front 파일 C-34 주석 명시 |
| A-05 | migrationImpact + breaking 명시 | ✅ YES | Section 1 (low / false) |

### Category B — Technical Clarity (5 items)

| ID | Item | Status | Evidence |
|----|------|--------|---------|
| B-01 | 구현 파일 목록 (D1 corrected) | ✅ YES | Section 7 테이블 — D1 prefix 수정 반영 |
| B-02 | API 시그니처 (TypeScript) | ✅ YES | Section 5 (MultiRowHeaderProps, GroupedHeaderGridProps) |
| B-03 | Before/After 코드 스니펫 | ✅ YES | Section 6.1 (MultiRowHeader), Section 6.5 (GroupedHeaderGrid.tsx) |
| B-04 | dep resolution path 인용 (v1.0.8) | ✅ YES | Section 4 + Section 6.5 — vite.config.ts L26 명시 |
| B-05 | bundle impact 수치 | ✅ YES | Section 1 (+2 KB, ≤ 9 KB, ≤ 20 KB C-21) |

### Category C — Constraint Compliance (5 items)

| ID | Item | Status | Evidence |
|----|------|--------|---------|
| C-01 | C-2 TanStack v8 표준 API only | ✅ YES | Section 11.3 테이블 — 6개 API 나열 |
| C-02 | C-4 TypeScript strict (no any) | ✅ YES | Section 11.4 |
| C-03 | C-5 Tailwind className only (inline style 예외 조건 명시) | ✅ YES | Section 6.1 아이콘/cursor-pointer |
| C-04 | C-16 Wijmo import 0건 (AC-004) | ✅ YES | Section 10.3 grep 검증 명시 |
| C-05 | C-29 exactOptionalPropertyTypes — conditional spread | ✅ YES | Section 11.2 CORRECT/WRONG 예시 |

### Category D — Decision Documentation (6 items)

| ID | Item | Status | Evidence |
|----|------|--------|---------|
| D-01 | D# 결정 목록 (≥2) | ✅ YES | Section 7 — D1, D2, D3, D4 |
| D-02 | 각 결정의 대안 + 거부 이유 | ✅ YES | D2(Grid.tsx cross-package 거부), D3(역방향 dep 거부) |
| D-03 | C-30 Truth Table (prose-table 일치) | ✅ YES | Section 7 테이블 — D1 corrected prefix |
| D-04 | Architecture decision load-bearing (front-load) | ✅ YES | Section 3.1 — Grid.tsx L268-348 인라인 thead 발견, Section 3 최상위 |
| D-05 | ADR 참조 (C-14) | ✅ YES | ADR-MOD-GRID-14-002 인용 (Section 9.1, Section 8) |
| D-06 | C-28 goals.json prefix 위반 인지 + D1 수정 | ✅ YES | Section 7 D1 Decision 명시 |

### Category E — Edge Cases & Risk (6 items)

| ID | Item | Status | Evidence |
|----|------|--------|---------|
| E-01 | Edge case ≥3개 | ✅ YES | Section 12 — EC-01~05 (5개) |
| E-02 | 접힘 → 부분 상태 처리 (EC-02) | ✅ YES | Section 12 EC-02 |
| E-03 | enableGroupToggle=false (기본값) 하위 호환 (EC-05) | ✅ YES | Section 12 EC-05 |
| E-04 | C-34 경계 리스크 명시 | ✅ YES | Section 4, Section 6.5 |
| E-05 | C-17 visual regression 구체적 방법 | ✅ YES | Section 10.3 — grep 명령, className 목록, Storybook story 경로 |
| E-06 | C-6 하위 호환 1 minor deprecation | ✅ YES | Section 10.1, 10.2 — breaking: false, @deprecated, console.warn |

### Category F — Pro Package Compliance (4 items)

| ID | Item | Status | Evidence |
|----|------|--------|---------|
| F-01 | C-24 Pro EULA + license 확인 | ✅ YES | Section 9.3 — EULA.md NO CHANGE 명시 |
| F-02 | Pro 인라인 stub fallback 4가지 조건 (v1.0.8) | ✅ YES | Section 9.1 — F-02-1~4 labeled list, 4/4 YES |
| F-03 | @tanstack/react-table peerDeps 확인 | ✅ YES | Section 7 D4 — G-001 이미 설정, NO CHANGE |
| F-04 | C-16 Wijmo 0건 (AC-004 이중 확인) | ✅ YES | Section 10.3 grep 명령 |

### Category G — Storybook (1 item)

| ID | Item | Status | Evidence |
|----|------|--------|---------|
| G-01 | C-25 Storybook story 1개 — 그룹 토글 + alias 동일 동작 시나리오 | ✅ YES | AC-006 명시, Section 10.3 검증 방법 2 |

### H — Meta Gates (3 gates, must all pass)

| Gate | Requirement | Status |
|------|-------------|--------|
| H-01 | implementFiles 테이블 경로가 실제 파일 시스템 경로와 일치 | ✅ PASS — D1 corrected prefix 적용, 실제 monorepo 구조 반영 |
| H-02 | Spec이 goals.json AC-001~006 전체를 coverage | ✅ PASS — 모든 AC를 Section 2, 5, 6, 11에서 다룸 |
| H-03 | F-02 4가지 조건 모두 labeled YES (v1.0.8 gate) | ✅ PASS — Section 9.1 F-02-1~4 |

---

## Appendix A — Constraint Violation Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| C-34: tw-framework-front 파일 편집 실패 | Medium | Implementer가 PowerShell-via-Bash 우회 사용. Section 6.5에 명시. |
| C-29: legacy alias에서 optional prop undefined 전달 | Medium | Section 11.2에 CORRECT/WRONG 예시 명시. |
| C-17: tbody/pagination 이식 시 className 누락 | Low | Section 10.3에 보존 필수 className 목록 명시. |
| C-2: TanStack 비표준 API 혼용 | Low | Section 11.3 테이블에 허용 API 목록 명시. |
| C-4: any 타입 creep (generic 전달 오류) | Low | Section 11.4에 타입 안전 순회 명시. |
| C-30: prose-table 불일치 (D1 prefix) | None | Section 7 D1 Decision + 테이블 동시 기재. 불일치 없음. |

---

## Appendix B — goals.json Update Required

G-003 `implementFiles` 경로의 C-28 위반을 spec 작성 완료 후 goals.json에 반영해야 함:

```
// WRONG (현재 goals.json G-003):
"D:/project/topvel_project/TOMIS/packages/grid-pro-header/..."

// CORRECT (D1):
"D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/..."
```

Implementer가 spec 작성 후 `header-goals.json` G-003 `implementFiles` 배열을 D1 corrected prefix로 업데이트해야 함 (G-001 패턴 재적용).
