# G-004 Specification: Group Panel UI + drag column → group + 그룹 단위 정렬

**Module**: MOD-GRID-15 / aggregation  
**Goal ID**: G-004  
**Priority**: P1  
**Migration Impact**: low  
**Score Threshold**: 90  
**Spec Version**: 1.0.0  
**Date**: 2026-05-15  
**Author**: tw-grid Spec Writer (automated)

---

## ★ 사전 결정 (Pre-Resolved Decisions)

| ID | 결정 내용 | 근거 |
|----|----------|------|
| **D1** | Section 7 implementFiles 경로 권한: `topvel-grid-monorepo/packages/grid-pro-agg/` 사용. goals.json G-004 `implementFiles` 5개 모두 `TOMIS/packages/...` prefix — discover 단계 stale 아티팩트. 실제 경로: `topvel-grid-monorepo/packages/grid-pro-agg/...` (C-28, G-001/G-002/G-003 D1 선례). | C-28, G-001/G-002/G-003 D1 선례 |
| **D2** | goals.json `implementFiles` 범위 보정: goals.json G-004에는 `GroupPanel.tsx`·`AggregationGrid.tsx`·`index.ts`·`package.json`·`EULA.md` 5개 명시. `types.ts` MODIFY(신규 props 추가) + `AggregationGrid.stories.tsx` MODIFY(G-007 story 추가) 2개 누락. `package.json`·`EULA.md`는 G-004 scope에서 변경 없음(HTML5 drag = 신규 peerDep 불필요). 최종 구현 파일: 6개. | HTML5 drag 결정(D4), types.ts 신규 props(Section 2), stories.tsx AC-007 요건 |
| **D3** | 번들 reconciliation: goals.json G-004 `bundleImpact.expected` = "+4 KB … 합계 ≤ 15 KB". C-21 권위 기준 = "≤ 20 KB per Pro 패키지". 두 값 충돌 시 C-21(≤ 20 KB)이 authoritative. G-001(+5 KB) + G-002(+3 KB) + G-003(+2 KB) = ~10 KB 누계. G-004 +4 KB → ~14 KB. ≤ 20 KB 한도 내 여유 있음. goals.json "≤ 15 KB" 기재는 구현 시점 추정치 — spec은 C-21을 따른다. | C-21 |
| **D4** | HTML5 native drag-and-drop (dnd-kit 미사용): GroupPanel에서 컬럼 헤더 `<th>` → Group Panel 영역 드롭. dnd-kit/core 약 8-10 KB → C-21 번들 한도 위협. HTML5 drag API 로 충분한 단순 drop-zone 패턴 (MOD-GRID-07 useColumnDrag.ts 선례). 신규 peerDep 불필요 → `package.json` no-op. ADR-MOD-GRID-15-008 신설. | C-21, MOD-GRID-07 G-001 선례, C-9 |
| **D5** | `getSortedRowModel()` + `SortingState` 신규 wiring: 현 AggregationGrid.tsx (G-001/G-002/G-003 완료 상태)의 `useReactTable` options에 `getSortedRowModel()`/`state.sorting`/`onSortingChange` 없음. AC-004 요건(그룹 단위 정렬). G-004에서 추가. controlled 또는 uncontrolled 양쪽 지원(props `sorting?`/`onSortingChange?` 옵션). ADR-MOD-GRID-15-009 신설. | AC-004, TanStack v8 getSortedRowModel, AggregationGrid.tsx L207-236 실증 |
| **D6** | `package.json` / `EULA.md` no-op: HTML5 drag 선택으로 신규 peerDep 없음. `package.json` 변경 없음. `EULA.md` 변경 없음. goals.json implementFiles에 명시된 두 파일 모두 G-004 범위에서 건드리지 않는다. | D4 결정, G-002에서 이미 `@tanstack/react-virtual` peerDep 추가 완료 |
| **D7** | `verifyOrWarn` 추가 호출 없음: `AggregationGrid.tsx` 모듈 레벨 L48에 이미 1회 호출됨(ADR-MOD-GRID-15-002). `GroupPanel.tsx`(NEW) 에 추가 호출 없음. 한 패키지 1회 원칙(G-002 D7, G-003 D5 선례). | ADR-MOD-GRID-15-002, G-002 D7, G-003 D5 |
| **D8** | sort wiring scope: `enableGroupSort?: boolean` prop이 `true`일 때만 `getSortedRowModel()` 활성. 집계값 컬럼(`meta.aggregationFn` 설정 컬럼)에 `enableSorting: true` 자동 적용. 비집계 컬럼은 기본 TanStack sorting 동작 그대로. Header click → `header.column.getToggleSortingHandler()` 이용. `enableGroupSort` 미설정 시 정렬 UI/로직 없음(backward compat). | AC-004, TanStack v8 getSortedRowModel API, C-6 backward compat |

### D1 결정 — goals.json implementFiles 경로 보정 결과

| goals.json 원문 (stale) | 본 Spec 채택 경로 |
|-------------------------|-----------------|
| `D:/project/topvel_project/TOMIS/packages/grid-pro-agg/src/GroupPanel.tsx` | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/GroupPanel.tsx` |
| `D:/project/topvel_project/TOMIS/packages/grid-pro-agg/src/AggregationGrid.tsx` | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/AggregationGrid.tsx` |
| `D:/project/topvel_project/TOMIS/packages/grid-pro-agg/src/index.ts` | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/index.ts` |
| `D:/project/topvel_project/TOMIS/packages/grid-pro-agg/package.json` | no-op (D6) |
| `D:/project/topvel_project/TOMIS/packages/grid-pro-agg/EULA.md` | no-op (D6) |

### D2 결정 — goals.json implementFiles 누락 보정

| 보정 파일 | 누락 원인 | 본 Spec 추가 |
|---------|---------|------------|
| `types.ts` MODIFY | goals.json G-004 implementFiles에 누락 | Section 7 표 추가 |
| `AggregationGrid.stories.tsx` MODIFY | goals.json G-004 implementFiles에 누락 | Section 7 표 추가 |

---

## Section 1: 현행 분석 (AS-IS)

### 참조 추적 테이블

| 레이어 | 참조 대상 | 결과 |
|--------|---------|------|
| **L0** | tw-framework-front 현 구현 파일 | N/A — 신규 Pro 패키지. 현 구현 없음 |
| **L1** | TanStack v8 grouping / sorting API | 아래 상세 |
| **L2** | publish 중간 참조 소스 | N/A — 신규 Pro 패키지 |
| **L3** | TO-BE 영향 사용처 | N/A — `affectedUsageFiles: []` 0개 |
| **R-A** | AG Grid Enterprise Group Panel 패턴 | 아래 상세 |
| **R-W** | Wijmo GroupPanel 컨트롤 | 아래 상세 (참조만 — C-16) |

### L0 — 현 구현 상태

N/A — 신규 Pro 패키지. 현행 tw-framework-front에 `@tomis/grid-pro-agg` import 없음.

현재 `packages/grid-pro-agg/src/AggregationGrid.tsx` (G-001/G-002/G-003 완료 상태, 395줄):
- L48: `verifyOrWarn('@tomis/grid-pro-agg')` 모듈 레벨 호출
- L207-236: `useReactTable` options — `state.grouping`, `state.expanded`, `onGroupingChange?`/`onExpandedChange?` 조건부 spread, `getCoreRowModel()`, 조건부 `getGroupedRowModel()`/`getExpandedRowModel()`
- **`getSortedRowModel()` 없음 — G-004 추가 대상**
- L313-326 (비가상화 `<th>`): 순수 `<th>` — draggable 속성 없음, sort handler 없음
- L355-370 (가상화 `<th>`): 순수 `<th>` — draggable 속성 없음, sort handler 없음
- `GroupPanel` 컴포넌트 없음 — G-004 신규 생성 대상

현재 `packages/grid-pro-agg/src/types.ts` (183줄):

`AggregationGridProps<TData>` 현재 props (G-001/G-002 추가분):
- G-001: `data`, `columns`, `enableAggregation?`, `grouping?`, `expanded?`
- G-002: `showFooter?`, `groupRowClassName?`, `footerRowClassName?`, `renderGroupRow?`, `renderFooterRow?`, `enableVirtualization?`, `estimatedRowHeight?`, `virtualOverscan?`, `onGroupingChange?`, `onExpandedChange?`
- **G-004 추가 대상**: `showGroupPanel?`, `groupPanelClassName?`, `groupChipClassName?`, `emptyGroupPanelText?`, `enableGroupSort?`, `sorting?`, `onSortingChange?`

### L1 — TanStack v8 Grouping + Sorting API

**Grouping state** (`@tanstack/react-table`):
```ts
type GroupingState = string[];  // 컬럼 id 배열

// useReactTable 옵션
state: { grouping: GroupingState }
onGroupingChange: OnChangeFn<GroupingState>
getGroupedRowModel: getGroupedRowModel   // 반드시 import
getExpandedRowModel: getExpandedRowModel
manualGrouping: false  // (기본값 — 명시 불필요)
```

**Sorting state** (`@tanstack/react-table`):
```ts
type SortingState = ColumnSort[];
// ColumnSort = { id: string; desc: boolean }

// useReactTable 옵션
state: { sorting: SortingState }
onSortingChange: OnChangeFn<SortingState>
getSortedRowModel: getSortedRowModel   // 반드시 import

// Column-level API
header.column.getCanSort()         // boolean — sortable 여부
header.column.getIsSorted()        // false | 'asc' | 'desc'
header.column.getToggleSortingHandler()  // (e: unknown) => void
```

`getSortedRowModel()`은 groupedRowModel 이후 적용된다. 즉 그룹 간 순서가 집계값 기준으로 재정렬됨 (AC-004 그룹 단위 정렬 요건).

**Header API**:
```ts
header.column.columnDef.header   // string | ColumnHeaderFn
header.column.id                 // 컬럼 id (drag payload에 사용)
```

### MOD-GRID-07 HTML5 DnD 선례 (grid-features useColumnDrag.ts L1-189)

MOD-GRID-07 `packages/grid-features/src/column-drag/useColumnDrag.ts` 확인된 패턴:

```ts
// drag SOURCE 추적 — ref (React re-render 불필요)
const dragSourceId = useRef<string | null>(null);

// drag OVER visual 표시 — state (UI 업데이트 필요)
const [dragOverId, setDragOverId] = useState<string | null>(null);

// onDragStart: dataTransfer에 컬럼 id 저장
e.dataTransfer?.setData('columnId', columnId);
dragSourceId.current = columnId;

// onDragOver: 드롭 허용
e.preventDefault();

// onDrop: 컬럼 id 추출 + 배열 조작
const id = e.dataTransfer?.getData('columnId') ?? dragSourceId.current;

// onDragEnd: 정리
dragSourceId.current = null;
setDragOverId(null);
```

**G-004 차이점**: MOD-GRID-07은 source=`<th>`, target=`<th>` (column reorder). G-004는 source=`<th>`, **target=GroupPanel div** (group panel drop zone). 드롭 후 동작도 다름: `table.setColumnOrder()` → `setGrouping()` (또는 `onGroupingChange` callback).

AggregationGrid에 **column pinning 없음** — MOD-GRID-07의 pinned column drag block EC는 G-004에 적용 불가.

### R-A (AG Grid Enterprise Group Panel — C-7 학습 전용)

AG Grid Enterprise에서 Group Panel은 별도 컴포넌트로, 사용자가 컬럼 헤더를 드래그하여 panel에 드롭하면 해당 컬럼 기준으로 행이 그룹화된다. 그룹 칩은 [레이블 + X 버튼] 형태. X 클릭 시 그룹 해제. AG Grid API 직접 사용 금지 (C-7).

### R-W (Wijmo GroupPanel — 참조만, C-16)

Wijmo `wjGrid.GroupPanel` 컨트롤: `<wjGrid.GroupPanel grid={grid} />` 형태. 컬럼 헤더 드래그 → 패널 드롭으로 그룹화. 소스 코드 차용 절대 금지 (C-16). 개념 참조만.

**migrationImpact**: low (G-001~G-003 기반 GroupPanel + 그룹 단위 정렬 추가, HTML5 drag 자체 구현으로 신규 peerDep 0, affectedUsageFiles 0개)

---

## Section 2: API 계약 (API Contract)

### 2.1 GroupPanel 컴포넌트 API (NEW)

```typescript
import type { Column } from '@tanstack/react-table';

export interface GroupPanelProps<TData> {
  /**
   * 현재 그룹화 컬럼 id 배열 (순서 유지).
   * AggregationGrid → GroupPanel로 전달.
   */
  grouping: string[];

  /**
   * 전체 컬럼 정의 — 그룹 칩 레이블 표시에 필요.
   * header 문자열 또는 id fallback.
   */
  columns: Column<TData, unknown>[];

  /**
   * 그룹화 변경 callback (칩 X 클릭 or 드롭 추가).
   * AggregationGrid의 setGrouping 또는 onGroupingChange prop 연결.
   */
  onGroupingChange: (grouping: string[]) => void;

  /**
   * 드롭 성공 시 호출 — 컬럼 id → grouping 배열에 추가.
   * GroupPanel 내부에서 onGroupingChange를 wrapping하여 처리.
   * 외부에서 직접 사용 불필요 (내부 구현 세부 — export 안 함).
   */

  /** GroupPanel 외부 컨테이너 className. Tailwind 조합 가능 (C-5). */
  className?: string;

  /** 각 그룹 칩 className. Tailwind 조합 가능 (C-5). */
  chipClassName?: string;

  /** 그룹 없을 때 표시 텍스트. 기본값: 'Drag a column header here to group' */
  emptyText?: string;
}

export declare function GroupPanel<TData extends object>(
  props: GroupPanelProps<TData>
): React.ReactElement;
```

### 2.2 AggregationGridProps 추가 props (types.ts MODIFY)

```typescript
// Before (G-001/G-002 기준):
export interface AggregationGridProps<TData extends object> {
  data: TData[];
  columns: AggregationColumnDef<TData>[];
  enableAggregation?: boolean;
  grouping?: string[];
  expanded?: boolean;
  showFooter?: boolean;
  groupRowClassName?: string;
  footerRowClassName?: string;
  renderGroupRow?: (props: GroupRowProps<TData>) => React.ReactNode;
  renderFooterRow?: (props: FooterRowProps<TData>) => React.ReactNode;
  enableVirtualization?: boolean;
  estimatedRowHeight?: number;
  virtualOverscan?: number;
  onGroupingChange?: (grouping: string[]) => void;
  onExpandedChange?: (expanded: ExpandedState) => void;
}

// After (G-004 추가 — D8):
export interface AggregationGridProps<TData extends object> {
  // ... 기존 props 모두 유지 (C-6 backward compat) ...

  /** Group Panel 영역 렌더 여부. 기본값: false */
  showGroupPanel?: boolean;

  /** GroupPanel 컨테이너 className. Tailwind 조합 가능 (C-5). */
  groupPanelClassName?: string;

  /** 각 그룹 칩 className. Tailwind 조합 가능 (C-5). */
  groupChipClassName?: string;

  /** 그룹 없을 때 표시 텍스트. 기본값: 'Drag a column header here to group' */
  emptyGroupPanelText?: string;

  /**
   * 그룹 단위 정렬 활성화. true 시 getSortedRowModel() 활성 (D5/D8).
   * header click → TanStack SortingState 업데이트.
   * 기본값: false.
   */
  enableGroupSort?: boolean;

  /**
   * 외부 controlled sorting state. 미설정 시 내부 useState로 uncontrolled.
   * enableGroupSort=true 일 때만 유효.
   */
  sorting?: SortingState;

  /**
   * sorting state 변경 callback (controlled 모드).
   * enableGroupSort=true + sorting prop 함께 제공 시 controlled 모드.
   */
  onSortingChange?: OnChangeFn<SortingState>;
}
```

### 2.3 index.ts 추가 exports

```typescript
// G-004 추가 (D2):
export { GroupPanel } from './GroupPanel';
export type { GroupPanelProps } from './types';
```

### 2.4 `exactOptionalPropertyTypes` 대응 (C-29)

optional props를 `useReactTable` options에 전달 시 conditional spread 패턴 준수:

```typescript
// ❌ 금지 — exactOptionalPropertyTypes 위반
{ onSortingChange: props.onSortingChange }

// ✅ 올바름 — conditional spread
...(props.onSortingChange !== undefined && { onSortingChange: props.onSortingChange }),
```

---

## Section 3: 수용 기준 (Acceptance Criteria)

| AC ID | 기준 | Source |
|-------|------|--------|
| **AC-001** | `showGroupPanel?: boolean` prop — Group Panel 영역(`<div>`) 조건부 렌더. `showGroupPanel=false`(기본) 시 GroupPanel 컴포넌트 DOM에 없음. Tailwind 스타일만(C-5). | C-5 |
| **AC-002** | 그룹 칩: 컬럼 header 이름 + X 아이콘. X 클릭 → `grouping` 배열에서 해당 id 제거 → `onGroupingChange` callback 호출. `onGroupingChange` 미설정 시 내부 grouping state 직접 업데이트. | C-2, goals.json G-004 AC-002 |
| **AC-003** | drag to group: HTML5 native drag API 사용(D4). 컬럼 `<th>` `draggable={true}` + `onDragStart`(`e.dataTransfer.setData('columnId', id)`) — `showGroupPanel=true` 시에만. GroupPanel div `onDragOver` + `onDrop`(id 추출 → grouping 배열 추가). 중복 id 추가 방지(Set 체크). | goals.json G-004 AC-003, D4 |
| **AC-004** | 그룹 단위 정렬: `enableGroupSort=true` 시 `getSortedRowModel()` 활성. 집계값 컬럼 header click → `header.column.getToggleSortingHandler()` 호출. `getIsSorted()` 반환값(`false`/`'asc'`/`'desc'`) 기반 정렬 아이콘 표시(▲/▼/무). | C-2, goals.json G-004 AC-004, D5, D8 |
| **AC-005** | `@mescius/wijmo*` import 0건 (C-16). | C-16 |
| **AC-006** | C-12: `tsc --noEmit` 0 error (packages/grid-pro-agg 전체). `SortingState`, `OnChangeFn` import from `'@tanstack/react-table'`. strict mode, no any (C-4). | C-12, C-4 |
| **AC-007** | C-25: Storybook story 1개 (`GroupPanelWithSort`) — Group Panel 드래그 그룹화 + 그룹 단위 정렬 + 1000행+ 가상화(C-18) 시나리오. CSF3 패턴(type-only import, no `@storybook/react` runtime). | C-25, C-18 |

---

## Section 4: 엣지 케이스 (Edge Cases)

| EC ID | 시나리오 | 기대 동작 | 처리 위치 |
|-------|---------|---------|---------|
| **EC-001** | 이미 그룹화된 컬럼을 GroupPanel에 재드롭 | 중복 추가 없음. `Set(grouping).has(id)` 체크 후 무시. drop event 정상 완료. | `GroupPanel.tsx` onDrop 핸들러 |
| **EC-002** | `grouping=[]` (그룹 없음) 상태에서 Group Panel 표시 | `emptyGroupPanelText` 표시 (기본: 'Drag a column header here to group'). 칩 0개. drag over 시 drop zone 활성 스타일(`border-dashed`). | `GroupPanel.tsx` render 조건 |
| **EC-003** | `enableGroupSort=false` + `showGroupPanel=true` 동시 | Group Panel 정상 렌더. `<th>` 정렬 핸들러/아이콘 없음. `getSortedRowModel()` 미활성. 두 기능 완전 독립. | `AggregationGrid.tsx` useReactTable options 조건 |
| **EC-004** | `enableGroupSort=true` + `enableVirtualization=true` 동시 | 가상화 `<th>` (L355-370 영역)에도 정렬 핸들러 연결. sort 후 virtual row offset 재계산은 `@tanstack/react-virtual` 자동 처리. 추가 코드 불필요. | `AggregationGrid.tsx` 가상화 `<th>` 렌더 블록 |
| **EC-005** | `onGroupingChange` 미설정 + GroupPanel 칩 X 클릭 | 내부 `setGrouping` (local state) 직접 호출. AggregationGrid 내부 grouping state 변경 → re-render. 외부 callback 없음 = uncontrolled 동작. | `AggregationGrid.tsx` handleGroupingChange 내부 함수 |
| **EC-006** | 가상화 모드에서 drag 중 scroll | `onDragEnd` + `onDragLeave` 핸들러에서 `dragOverId` 초기화. scroll 이벤트와의 충돌 없음(HTML5 DnD는 scroll 독립). drop 미완료 시 grouping 변경 없음. | `GroupPanel.tsx` drag event 핸들러 |
| **EC-007** | `sorting` (controlled) + `onSortingChange` 미설정 | console.error: `'[grid-pro-agg] sorting prop provided without onSortingChange — use uncontrolled mode instead'`. 내부 state로 fallback. throw 없음(AC-002 no-throw 정책). | `AggregationGrid.tsx` useEffect 또는 render-time guard |

---

## Section 5: 구현 가이드라인 (Implementation Guidelines)

### 5.1 GroupPanel.tsx 구조 (NEW — C-32 Pure Helper 분리)

```typescript
// packages/grid-pro-agg/src/GroupPanel.tsx
import React, { useRef, useState } from 'react';
import type { Column } from '@tanstack/react-table';

// ─── Pure helper ────────────────────────────────────────────────────────────

/** 그룹 칩 레이블: columnDef.header가 string이면 사용, 아니면 id */
function getColumnLabel<TData>(col: Column<TData, unknown>): string {
  const h = col.columnDef.header;
  return typeof h === 'string' ? h : col.id;
}

/** grouping 배열에서 id 제거 */
function removeFromGrouping(grouping: string[], id: string): string[] {
  return grouping.filter((g) => g !== id);
}

/** 중복 체크 후 id 추가 */
function addToGrouping(grouping: string[], id: string): string[] {
  if (grouping.includes(id)) return grouping;
  return [...grouping, id];
}

// ─── Component ──────────────────────────────────────────────────────────────

export function GroupPanel<TData extends object>({
  grouping,
  columns,
  onGroupingChange,
  className,
  chipClassName,
  emptyText = 'Drag a column header here to group',
}: GroupPanelProps<TData>): React.ReactElement {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragSourceId = useRef<string | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const id = e.dataTransfer.getData('columnId') || dragSourceId.current;
    if (!id) return;
    onGroupingChange(addToGrouping(grouping, id));
  };

  const handleChipRemove = (id: string) => {
    onGroupingChange(removeFromGrouping(grouping, id));
  };

  // grouping id → Column 매핑
  const groupedCols = grouping
    .map((id) => columns.find((c) => c.id === id))
    .filter((c): c is Column<TData, unknown> => c !== undefined);

  return (
    <div
      className={`flex flex-wrap gap-2 p-2 min-h-[40px] border rounded-md
        ${isDragOver ? 'border-dashed border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'}
        ${className ?? ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {groupedCols.length === 0 ? (
        <span className="text-gray-400 text-sm self-center">{emptyText}</span>
      ) : (
        groupedCols.map((col) => (
          <span
            key={col.id}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full
              bg-blue-100 text-blue-800 text-sm font-medium ${chipClassName ?? ''}`}
          >
            {getColumnLabel(col)}
            <button
              type="button"
              aria-label={`Remove ${getColumnLabel(col)} from grouping`}
              className="ml-1 text-blue-600 hover:text-blue-900 focus:outline-none"
              onClick={() => handleChipRemove(col.id)}
            >
              ×
            </button>
          </span>
        ))
      )}
    </div>
  );
}
```

### 5.2 AggregationGrid.tsx 변경 — getSortedRowModel wiring (D5)

**Before (G-001/G-002/G-003 완료 상태, L207-236 근사):**
```typescript
const table = useReactTable({
  data,
  columns: resolvedColumns,
  state: {
    grouping: groupingState,
    expanded: expandedState,
  },
  ...(onGroupingChange !== undefined && { onGroupingChange }),
  ...(onExpandedChange !== undefined && { onExpandedChange }),
  getCoreRowModel: getCoreRowModel(),
  ...(enableAggregation && {
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  }),
  // getSortedRowModel 없음
});
```

**After (G-004 추가):**
```typescript
import {
  // 기존
  getCoreRowModel, getGroupedRowModel, getExpandedRowModel,
  // G-004 추가
  getSortedRowModel,
} from '@tanstack/react-table';
import type { SortingState, OnChangeFn } from '@tanstack/react-table';

// 컴포넌트 내부 — uncontrolled sort state
const [internalSorting, setInternalSorting] = useState<SortingState>([]);
const sortingState: SortingState = sorting ?? internalSorting;
const handleSortingChange: OnChangeFn<SortingState> = onSortingChange ?? setInternalSorting;

const table = useReactTable({
  data,
  columns: resolvedColumns,
  state: {
    grouping: groupingState,
    expanded: expandedState,
    ...(enableGroupSort && { sorting: sortingState }),
  },
  ...(onGroupingChange !== undefined && { onGroupingChange }),
  ...(onExpandedChange !== undefined && { onExpandedChange }),
  ...(enableGroupSort && { onSortingChange: handleSortingChange }),
  getCoreRowModel: getCoreRowModel(),
  ...(enableAggregation && {
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  }),
  ...(enableGroupSort && { getSortedRowModel: getSortedRowModel() }),
});
```

### 5.3 AggregationGrid.tsx 변경 — GroupPanel 렌더 + 드래그 가능 `<th>`

**GroupPanel 렌더 (table 상단, `<table>` 태그 직전):**
```tsx
{showGroupPanel && (
  <GroupPanel<TData>
    grouping={groupingState}
    columns={table.getAllColumns()}
    onGroupingChange={handleGroupingChange}
    {...(groupPanelClassName !== undefined && { className: groupPanelClassName })}
    {...(groupChipClassName !== undefined && { chipClassName: groupChipClassName })}
    {...(emptyGroupPanelText !== undefined && { emptyText: emptyGroupPanelText })}
  />
)}
```

**`<th>` draggable 추가 (showGroupPanel=true 시):**
```tsx
<th
  key={header.id}
  colSpan={header.colSpan}
  {...(showGroupPanel && {
    draggable: true,
    onDragStart: (e: React.DragEvent<HTMLTableCellElement>) => {
      e.dataTransfer.setData('columnId', header.column.id);
    },
  })}
  {...(enableGroupSort && header.column.getCanSort() && {
    onClick: header.column.getToggleSortingHandler(),
    style: { cursor: 'pointer' },
  })}
>
  {header.isPlaceholder
    ? null
    : flexRender(header.column.columnDef.header, header.getContext())}
  {enableGroupSort && header.column.getCanSort() && (
    <span aria-hidden="true" className="ml-1 text-gray-400">
      {header.column.getIsSorted() === 'asc'
        ? '▲'
        : header.column.getIsSorted() === 'desc'
          ? '▼'
          : ''}
    </span>
  )}
</th>
```

동일 패턴을 가상화 `<th>` 블록(L355-370)에도 적용.

### 5.4 handleGroupingChange 내부 함수 (EC-005 처리)

```typescript
const handleGroupingChange = (newGrouping: string[]) => {
  setGroupingState(newGrouping);
  onGroupingChange?.(newGrouping);
};
```

> `setGroupingState`는 AggregationGrid 내부 state setter. `onGroupingChange` prop은 optional — EC-005 uncontrolled 동작.

### 5.5 controlled sorting 가드 (EC-007)

```typescript
useEffect(() => {
  if (sorting !== undefined && onSortingChange === undefined) {
    console.error(
      '[grid-pro-agg] sorting prop provided without onSortingChange — ' +
      'use uncontrolled mode instead'
    );
  }
}, [sorting, onSortingChange]);
```

---

## Section 6: 테스트 전략 (Test Strategy)

### 6.1 단위 테스트

| 대상 | 방법 | 검증 포인트 |
|------|------|-----------|
| `getColumnLabel` | 순수 함수 — Jest | header가 string이면 반환, object이면 id fallback |
| `removeFromGrouping` | 순수 함수 — Jest | 해당 id 제거, 나머지 순서 보존 |
| `addToGrouping` | 순수 함수 — Jest | 중복 id 추가 없음 (EC-001), 신규 id 끝에 추가 |
| `GroupPanel` render | RTL | `grouping=[]` → emptyText 표시 (EC-002) |
| `GroupPanel` chip X click | RTL | `onGroupingChange` 호출, 해당 id 제거 확인 (AC-002) |
| controlled sort guard | RTL | `sorting` without `onSortingChange` → console.error (EC-007) |

### 6.2 통합 테스트 시나리오

| 시나리오 | 검증 포인트 |
|---------|-----------|
| `showGroupPanel=true` + drag `<th>` → GroupPanel 드롭 | grouping state 업데이트 확인 (AC-003) |
| `enableGroupSort=true` + header click | sortingState 변경, 행 순서 재정렬 확인 (AC-004) |
| `enableGroupSort=true` + `enableVirtualization=true` | 가상화 `<th>` sort handler 존재 확인 (EC-004) |
| controlled mode (`sorting` + `onSortingChange` 제공) | 외부 callback 호출 확인 (D5) |
| `showGroupPanel=false` (기본) | GroupPanel DOM에 없음 (AC-001) |

### 6.3 빌드 검증

```bash
# packages/grid-pro-agg 디렉토리에서
npx tsc --noEmit   # 0 error 필수 (AC-006, C-12)
```

---

## Section 7: 구현 파일 목록 (implementFiles)

| 순서 | 파일 경로 (절대) | 동작 | 비고 |
|------|----------------|------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/GroupPanel.tsx` | **NEW** | D1 경로 보정, D2 D7 |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/AggregationGrid.tsx` | MODIFY | D5 getSortedRowModel, GroupPanel render, draggable `<th>` |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/types.ts` | MODIFY | D2 추가, 신규 props 7개 |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/index.ts` | MODIFY | GroupPanel + GroupPanelProps export |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/src/AggregationGrid.stories.tsx` | MODIFY | D2 추가, GroupPanelWithSort story |
| 6 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-15-decisions.md` | MODIFY | ADR-008, ADR-009 추가 |

**No-op (goals.json 명시 but G-004 변경 없음):**
- `packages/grid-pro-agg/package.json` — HTML5 drag 선택으로 신규 peerDep 없음 (D6)
- `packages/grid-pro-agg/EULA.md` — G-001 이후 변경 없음 (D6)

---

## Section 8: 번들 영향 (Bundle Impact)

| 구성요소 | 추정 크기 | 비고 |
|---------|---------|------|
| `GroupPanel.tsx` (React 컴포넌트 + pure helpers) | ~2 KB | HTML5 DnD = 0 외부 의존성 |
| `AggregationGrid.tsx` 변경분 (getSortedRowModel + drag `<th>` + GroupPanel 렌더) | ~1.5 KB | 기존 파일 diff |
| `types.ts` 추가 props | ~0.3 KB | type-only, no runtime |
| `index.ts` 추가 exports | ~0.1 KB | re-export만 |
| **G-004 추가분 합계** | **~4 KB** | goals.json 기재와 일치 |
| **grid-pro-agg 전체 누계** | **~14 KB** | G-001(+5) + G-002(+3) + G-003(+2) + G-004(+4) |
| **한도 (C-21)** | **≤ 20 KB** | 여유 ~6 KB |

---

## Section 9: 호환성 정책 (Compatibility Policy)

| 항목 | 내용 |
|------|------|
| **Breaking Change** | 없음. 신규 props 모두 optional (C-6). 기존 `AggregationGridProps` 사용 코드 그대로 동작. |
| **Deprecation** | 없음. |
| **Migration Path** | N/A — 신규 기능 opt-in. `showGroupPanel=true` + `enableGroupSort=true` 명시 시에만 활성. |
| **Backward Compat 검증** | G-001/G-002/G-003 기존 stories (BasicGrouping, MultiColumnGrouping 등) 변경 없이 정상 렌더 확인. |

---

## Section 10: 의존성 (Dependencies)

| 의존성 | 버전 | 타입 | 용도 | G-004 변경 |
|--------|------|------|------|-----------|
| `@tanstack/react-table` | `^8.0.0` | peerDep (기존) | getSortedRowModel, SortingState | import 추가만 |
| `@tanstack/react-virtual` | `^3.0.0` | peerDep optional (기존) | 가상화 (G-002 추가) | 변경 없음 |
| `react` / `react-dom` | `^18 \|\| ^19` | peerDep (기존) | UI | 변경 없음 |
| HTML5 Drag API | — | 브라우저 내장 | GroupPanel drop zone | 외부 의존성 0 |
| `dnd-kit/core` | — | **미사용 (D4 기각)** | — | — |

---

## Section 11: 위험 평가 (Risk Assessment)

| 위험 | 확률 | 영향 | 완화 |
|------|------|------|------|
| `getSortedRowModel` + `getGroupedRowModel` 순서 의존성 | Low | Medium | TanStack v8 공식: Grouped→Sorted 순서 보장. `useReactTable` options 객체 순서 무관. |
| HTML5 drag `dataTransfer` Safari 일부 버전 호환성 | Low | Low | `dragSourceId` ref로 fallback 제공 (MOD-GRID-07 선례 패턴). |
| `<th>` `draggable` 속성과 header sort click 이벤트 충돌 | Low | Low | drag 이벤트와 click 이벤트 별도 핸들러. `onDragStart` 내에서 click 이벤트 bubble 없음. |
| controlled sorting 미완성 (sorting without onSortingChange) | Medium | Low | EC-007 console.error + uncontrolled fallback. throw 없음. |

---

## Section 12: ADR (Architecture Decision Record)

### ADR-MOD-GRID-15-008: HTML5 native drag-and-drop (dnd-kit 미사용)

**날짜**: 2026-05-15  
**상태**: Accepted  
**결정자**: tw-grid Spec Writer

**Context**: G-004 GroupPanel의 "컬럼 헤더 → 패널 드롭으로 그룹화" 기능 구현에 drag-and-drop 라이브러리 선택 필요.

**Options considered**:

| 옵션 | 번들 크기 | 의존성 | 복잡도 |
|------|---------|--------|--------|
| dnd-kit/core | ~8-10 KB | 신규 peerDep 1개 | 낮음 (추상화) |
| HTML5 native DnD | 0 KB 추가 | 없음 | 중간 (직접 구현) |
| react-dnd | ~12 KB | 신규 peerDep 2개 | 낮음 (추상화) |

**Decision**: HTML5 native drag-and-drop 직접 구현.

**Rationale**:
1. C-21 번들 한도(≤ 20 KB). G-004 이전 ~10 KB + dnd-kit ~8-10 KB = 18-20 KB → 한도 근접/초과 위험
2. GroupPanel의 드롭 패턴이 단순(column → panel, 1개 drop zone). dnd-kit 추상화 불필요.
3. MOD-GRID-07 `useColumnDrag.ts`가 HTML5 DnD로 column reorder 구현 완료 — 검증된 선례.
4. C-9 MIT 라이선스 요건 충족 (브라우저 내장 = 라이선스 없음).

**Consequences**:
- `package.json` peerDeps 변경 없음 (D6)
- Safari `dataTransfer` 호환을 위해 `dragSourceId` ref fallback 필수
- dnd-kit의 accessibility 기능(키보드 DnD) 미제공 — 허용된 scope-out (EC는 별도 없음)

---

### ADR-MOD-GRID-15-009: getSortedRowModel 활성화 정책

**날짜**: 2026-05-15  
**상태**: Accepted  
**결정자**: tw-grid Spec Writer

**Context**: AggregationGrid에서 그룹 단위 정렬(AC-004) 구현을 위해 TanStack `getSortedRowModel()` wiring 방식 결정 필요.

**Options considered**:

| 옵션 | 특징 | 단점 |
|------|------|------|
| 항상 활성 | 코드 단순 | 미사용 시 불필요한 계산, sort UI 노출 |
| `enableGroupSort` prop으로 조건부 활성 | opt-in, backward compat | 약간의 조건 분기 추가 |
| `enableAggregation` prop에 통합 | prop 수 감소 | 집계 없이 정렬만 원하는 경우 지원 불가 |

**Decision**: `enableGroupSort?: boolean` 신규 prop으로 조건부 활성.

**Rationale**:
1. C-6 backward compat — 기존 `enableAggregation` 사용자에게 sort UI 강제 노출 방지.
2. `enableGroupSort=false`(기본) 시 `getSortedRowModel()` 미포함 → tree-shake 가능.
3. controlled/uncontrolled 양쪽 지원: `sorting?` + `onSortingChange?` prop optional 제공.
4. `enableGroupSort` + `enableVirtualization` 독립 조합 가능 (EC-004).

**Consequences**:
- `useReactTable` options에 조건부 spread 패턴 추가 (`enableGroupSort && { getSortedRowModel, state.sorting, onSortingChange }`)
- `SortingState` import 추가 (`@tanstack/react-table`)
- controlled 오용(sorting without onSortingChange) → console.error + uncontrolled fallback (EC-007)

---

## Section 13: 체크리스트 (Spec Checklist)

### A. 현행 분석 (AS-IS)

- [x] A-1: L0 (현 구현) 참조 — N/A (신규 패키지)
- [x] A-2: L1 (TanStack v8) grouping/sorting API 확인
- [x] A-3: R-A (AG Grid) 개념 참조 기록
- [x] A-4: R-W (Wijmo) 참조 기록 + C-16 코드 차용 금지 명시
- [x] A-5: 현 AggregationGrid.tsx 상태 실증 (getSortedRowModel 없음, `<th>` draggable 없음)

### B. API 계약

- [x] B-1: GroupPanel 컴포넌트 시그니처 완전 정의
- [x] B-2: AggregationGridProps 신규 props 7개 완전 정의 (all optional — C-6)
- [x] B-3: index.ts 추가 exports 명시
- [x] B-4: exactOptionalPropertyTypes 패턴 명시 (C-29)
- [x] B-5: SortingState import source 명시 (`@tanstack/react-table`)

### C. 수용 기준

- [x] C-1: 모든 AC에 Source 태그 포함 (AC-001~AC-007)
- [x] C-2: goals.json AC와 1:1 매핑 확인
- [x] C-3: C-16 Wijmo 금지 AC 포함 (AC-005)
- [x] C-4: C-12 tsc 0 error AC 포함 (AC-006)
- [x] C-5: C-25 Storybook story AC 포함 (AC-007)

### D. 사전 결정 (Goals.json 일관성 — G-01 rubric sub-rule)

- [x] D-1: goals.json G-004 AC 1:1 대응 확인 (AC-001~AC-007 모두 포함)
- [x] D-2: goals.json implementFiles 경로 보정 기록 (D1 표)
- [x] D-3: goals.json implementFiles 누락 파일 보정 기록 (D2 표)
- [x] D-4: bundleImpact 재조정 (D3 — C-21 기준 ~14 KB, 여유 ~6 KB)
- [x] D-5: HTML5 drag 결정 (D4 — ADR-008)
- [x] D-6: getSortedRowModel wiring 결정 (D5/D8 — ADR-009)

### E. 엣지 케이스

- [x] E-1: EC 7개 정의 (요건 5+ 충족)
- [x] E-2: 중복 그룹 추가 방지 (EC-001)
- [x] E-3: 빈 GroupPanel 텍스트 (EC-002)
- [x] E-4: enableGroupSort/showGroupPanel 독립성 (EC-003)
- [x] E-5: 가상화 + 정렬 조합 (EC-004)
- [x] E-6: controlled sort 오용 (EC-007)

### F. 구현 가이드라인

- [x] F-1: GroupPanel 전체 구조 pseudo-code 포함
- [x] F-2: AggregationGrid useReactTable before/after diff 제공 (D5)
- [x] F-3: draggable `<th>` 코드 스니펫 제공
- [x] F-4: verifyOrWarn 추가 호출 없음 명시 (D7)

### G. ADR

- [x] G-1: decisions.md MODIFY 포함 — ADR-008 (HTML5 drag), ADR-009 (sort wiring)

### H. Meta Gates (specify-rubric H-01~H-03)

- [x] H-01: referenceEvidence 경로 — L1(TanStack), R-A(AG Grid), R-W(Wijmo) 실존 근거 사용
- [x] H-02: implementFiles 절대 경로 합리성 — 6개 모두 실존 경로
- [x] H-03: AC Source 태그 — 전 AC Source 태그 포함

---

*Spec 작성 완료: 2026-05-15. G-004 implement Stage 진입 가능.*
