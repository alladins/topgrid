# MOD-GRID-16 / G-001 Specification + Implementation Plan
## Master-Detail — 행 클릭 시 자식 컴포넌트 확장 + 동적 자식 그리드 `renderDetailRow`

**버전**: 1.1.0  
**작성일**: 2026-05-15  
**작성자**: tw-grid Spec Writer Agent  
**상태**: DRAFT  
**패키지 대상**: `packages/grid-pro-master` (Pro, 주요 구현) + `packages/grid-core` (MIT, MODIFY — types.ts + GridHandle만)  
**threshold**: specify 90 (canonical-modules.json MOD-GRID-16)

---

## ★ 사전 결정 (D# 요약표)

| # | 제목 | 결정 | 영향 파일 |
|---|------|------|-----------|
| D1 | 통합 형태 — Option B (wrapper) 채택 | `<MasterDetailGrid>` wrapper in grid-pro-master. `<Grid>` props 변경 없음. MIT↔Pro 경계 보존. | grid-pro-master/src/MasterDetailGrid.tsx (NEW), grid-pro-master/src/DetailRow.tsx (NEW), grid-pro-master/src/types.ts (NEW), grid-pro-master/src/internal/ExpandToggleCell.tsx (NEW) |
| D2 | C-28 경로 수정 | goals.json `implementFiles` prefix `TOMIS/packages/` → `topvel-grid-monorepo/packages/` | — (goals.json 수정 사항, spec 문서화만) |
| D3 | AC-002 upstream expanded state 재사용 | TanStack `ExpandedState` + `getExpandedRowModel` 는 MOD-GRID-01 wiring 재사용. `MasterDetailGrid` 내부에서 `useState<ExpandedState>` + `useReactTable` 직접 사용. | grid-pro-master/src/MasterDetailGrid.tsx |
| D4 | peerDependency 추가 | grid-pro-master `package.json` 에 `"@tomis/grid-core": "workspace:*"` peer 추가 (C-22). `MasterDetailGrid` 가 `@tomis/grid-core` 의 `Grid` 를 내부 렌더에 사용. | grid-pro-master/package.json |
| D5 | 가상화 + Master-Detail 동시 사용 경고 | `enableVirtualization=true` 전달 시 dev mode `console.warn` 1회 + detail row 미렌더 (defer to future Goal) | grid-pro-master/src/MasterDetailGrid.tsx |
| D6 | `src/internal/` 디렉토리 신규 생성 | 이 Goal 이 `grid-pro-master/src/internal/` 디렉토리를 신규 생성 (기존 비존재 확인). | grid-pro-master/src/internal/ExpandToggleCell.tsx |
| D7 | Pro license 검증 call site | `verifyLicense('@tomis/grid-pro-master')` = `MasterDetailGrid.tsx` module-level. 실제 import path 존재 (Option B 구조에서 사용자가 반드시 `@tomis/grid-pro-master` import). | grid-pro-master/src/MasterDetailGrid.tsx |
| D8 | GridHandle expandAll/collapseAll | grid-core `GridHandle<TData>` 인터페이스에 `expandAll?(): void` + `collapseAll?(): void` optional method 추가. `MasterDetailGrid` 내부 `useImperativeHandle` 로 구현. | grid-core/src/types.ts (MODIFY), grid-pro-master/src/MasterDetailGrid.tsx |

---

## Section 1. Goal 개요

**Goal ID**: MOD-GRID-16 / enhancement / G-001  
**Goal 이름**: Master-Detail — 행 클릭 시 자식 컴포넌트 확장 + 동적 자식 그리드 `renderDetailRow`  
**모듈**: MOD-GRID-16 — Master-Detail + TreeGrid + Context Menu + Row Pinning  
**License Tier**: Pro (`"SEE LICENSE IN EULA"` — canonical-modules.json)  
**패키지**: `@tomis/grid-pro-master` (주요 구현 4 NEW) + `@tomis/grid-core` (MODIFY 2 — types.ts + GridHandle)  
**의존**: MOD-GRID-01 (Grid.tsx + types.ts 기반 — canonical-modules.json `dependsOn`)  
**우선 Feature**: F-16-01 (renderDetailRow), F-16-02 (expandedRowKeys + onExpandChange), F-16-03 (tree mode 흡수), F-16-04 (전체 펼치기/접기 API) — P0  
**보류 Feature**: F-16-05 (ContextMenu), F-16-06 (Row Pinning) — 후속 Goal 범위  
**보류 Feature**: F-16-07 (TreeGrid/ColumnPinGrid alias) — 후속 Goal

**통합 형태**: Option B (wrapper) — `<MasterDetailGrid>` in grid-pro-master. Grid.tsx DOM 구조 변경 없음. MIT↔Pro EULA 경계 보존.

**userStory**:
```tsx
// Master-Detail 기본 사용
import { MasterDetailGrid } from '@tomis/grid-pro-master';

<MasterDetailGrid
  data={orders}
  columns={orderColumns}
  renderDetailRow={(row) => (
    <Grid data={row.original.items} columns={itemColumns} />
  )}
/>

// 전체 펼치기 / 접기 (GridHandle — D8)
const ref = useRef<GridHandle<Order>>(null);
ref.current?.expandAll?.();
ref.current?.collapseAll?.();
```

> **Option B 채택 근거 (D1)**: `<Grid>` userStory 를 직접 구현하려면 `grid-core` 가 `grid-pro-master` 를 import 해야 하고, 그러면 MIT↔Pro EULA 경계가 혼합된다. 더 중요하게는, Pro license 검증(MOD-GRID-99-A)의 call site 가 사용자 import 경로에 없어지면 F-99A-03 ("Pro 패키지 import 시 자동 검증") 이 발동하지 않는다. `<MasterDetailGrid>` wrapper 패턴에서 사용자는 반드시 `@tomis/grid-pro-master` 를 import 하므로 license 검증이 자동 발동한다.

**migrationImpact**: medium (TreeGrid 패턴 참조 + 신규 Pro 패키지 grid-pro-master, MasterDetailGrid wrapper Pro license 검증 의존, OrgMasterPage 등 사용처 후속 영향)

---

## Section 2. 사용자 스토리 + Acceptance Criteria

### 2.1 userStory 분해

| ID | 스토리 | 우선순위 |
|----|--------|---------|
| US-01 | 사용자는 `renderDetailRow` prop 으로 행 확장 시 렌더링될 자식 컴포넌트를 지정할 수 있다. | P0 |
| US-02 | 사용자는 토글 버튼 클릭으로 해당 행의 Master-Detail 을 열고 닫을 수 있다. | P0 |
| US-03 | 사용자는 `expandedRowKeys` + `onExpandChange` 로 expanded state 를 controlled 모드로 관리할 수 있다. | P0 |
| US-04 | 기존 `<Grid>` 컴포넌트 사용자는 이 Goal 배포 후에도 아무 변경 없이 기존 동작을 유지한다. | P0 |
| US-05 | 사용자는 `getSubRows` + `renderDetailRow` 동시 사용으로 tree + detail 복합 레이아웃을 구성할 수 있다. | P1 |

### 2.2 Acceptance Criteria

| AC-ID | 기준 | 검증 방법 |
|-------|------|----------|
| AC-001 | `<MasterDetailGrid renderDetailRow={fn} />` 렌더 시, 첫 번째 컬럼 앞에 expand 토글 버튼 컬럼 자동 prepend | Storybook 시각 + TypeScript 컴파일 |
| AC-002 | expanded state 는 TanStack `ExpandedState` + `getExpandedRowModel` 재사용. `MasterDetailGrid` 내부 `useState<ExpandedState>` + `useReactTable` 직접 관리. | MasterDetailGrid.tsx 코드 확인 |
| AC-003 | `renderDetailRow(row)` 의 `row` 파라미터 타입 = TanStack `Row<TData>` — `row.original`, `row.id`, `row.depth` 접근 가능 | TypeScript strict 컴파일 통과 |
| AC-004 | `<Grid>` 컴포넌트 props / DOM 구조 / CSS 변경 없음 (C-6 backward compat) | Grid.tsx diff = 0 행 변경 (types.ts + GridHandle 제외) |
| AC-005 | `expandedRowKeys` (controlled) 제공 시 internal state 무시 + `onExpandChange` 콜백 호출 | unit test (vitest) |
| AC-006 | `GridHandle.expandAll?.()` / `collapseAll?.()` 호출 시 전체 행 펼침/접힘 | unit test + TypeScript type check |
| AC-007 | detail row `<tr>` 에 `data-detail-row` attribute 부여 (테스트 선택자 + 접근성) | DOM snapshot |
| AC-008 | `enableVirtualization={true}` 전달 시 dev console.warn 1회, detail 미렌더 | console.warn spy test |
| AC-009 | `@tomis/grid-license` `verifyLicense('@tomis/grid-pro-master')` 가 `MasterDetailGrid` 를 import 할 때 1회 호출 | unit test — vi.mock('@tomis/grid-license') + import 확인 |

---

## Section 3. 기술 스택 + 제약 요약

### 3.1 핵심 의존성 (실측)

| 패키지 | 버전 | 역할 |
|--------|------|------|
| `@tanstack/react-table` | `^8.21.3` (grid-core package.json 실측) | ExpandedState, Row<TData>, getExpandedRowModel, useReactTable |
| `react` | `^18 \|\| ^19` (peerDep) | JSX + hooks |
| `@tomis/grid-core` | `workspace:*` (신규 peer — D4) | `GridProps` 타입 + `Grid` 컴포넌트 내부 렌더 |
| `@tomis/grid-license` | `workspace:*` (기존 — C-24) | verifyLicense — Pro license 검증 |

### 3.2 활성 제약 (constraints.md)

| 제약 | 내용 | 적용 포인트 |
|------|------|------------|
| C-4 | TypeScript strict, any 0개 | 모든 신규 파일 |
| C-5 | Tailwind-only styling, .css 금지 | DetailRow.tsx, ExpandToggleCell.tsx |
| C-6 | 기존 Grid prop/behavior 변경 없음 | Grid.tsx 변경 없음 (Option B 선택 이유) |
| C-16 | Wijmo/AG Grid 코드 차용 금지 (학습만) | RowDetailProvider 패턴 학습 후 독립 구현 |
| C-21 | grid-pro-master ≤ 20 KB gzipped | 4 신규 파일 합산 |
| C-22 | react/react-dom/@tanstack/react-table peerDependencies 필수 + @tomis/grid-core 추가 (D4) | package.json |
| C-24 | Pro EULA + runtime license verify | MasterDetailGrid.tsx module-level verifyLicense |
| C-29 | exactOptionalPropertyTypes spread-skip | optional prop 전달 패턴 (Section 11.2) |
| C-30 | Spec Truth Table (D# 요약표 ↔ Section 7 ↔ 본문) | Section 7 = 단독 권위 |
| C-31 | Functional Wiring Audit — util 생성 시 call site 명시 | ExpandToggleCell → MasterDetailGrid.tsx 컬럼 ColumnDef cell. DetailRow → MasterDetailGrid.tsx tbody |
| C-32 | Pure helpers + React Shell 분리 | MasterDetailGrid.tsx = shell. ExpandToggleCell.tsx + DetailRow.tsx = helpers |
| C-33 | spec.md 단독 권위 | 이 파일이 구현의 최종 근거 |

### 3.3 L0 참조 패턴 (TreeGrid.tsx)

`tw-framework-front/src/components/tomis/Grid/TreeGrid.tsx` (실측):
- `useState<ExpandedState>({})` / `(true)` — initialExpanded seed
- `useReactTable` + `getExpandedRowModel()` + `state: { expanded }` + `onExpandedChange`
- 토글 버튼: `row.getIsExpanded() ? '▼' : '▶'` + `row.toggleExpanded()`
- `INDENT_PX = 16` per `row.depth` (들여쓰기)
- `expandAll() = setExpanded(true)`, `collapseAll() = setExpanded({})`

이 Goal 은 TreeGrid 의 expand/collapse 메커니즘에서 패턴만 학습하고, `MasterDetailGrid` 로 독립 구현한다.

> **R-W 참조**: Wijmo `RowDetailProvider` (current-tanstack-analysis.md L155, publish-wijmo-analysis.md L162) — Master-Detail provider 패턴 학습. C-16: 코드 차용 금지, 패턴만 학습.

---

## Section 4. 데이터 모델 + 타입 정의

### 4.1 신규 타입 (`grid-pro-master/src/types.ts`)

```typescript
import type { Row } from '@tanstack/react-table';
import type { ReactNode } from 'react';

/**
 * Master-Detail expandedRowKeys controlled 모드.
 * @see F-16-02
 */
export interface MasterDetailOptions<TData> {
  /**
   * controlled expanded row id 목록.
   * 제공 시 internal ExpandedState 를 이 값으로 override (AC-005).
   * 미제공 시 uncontrolled (internal state 사용).
   */
  expandedRowKeys?: string[];
  /**
   * expanded state 변경 콜백 (controlled 모드).
   * @param expandedKeys - 변경 후 expanded row id 목록.
   */
  onExpandChange?: (expandedKeys: string[]) => void;
}

/**
 * `renderDetailRow` 함수 타입.
 * @typeParam TData - 행 데이터 타입.
 * @see F-16-01, AC-003
 */
export type RenderDetailRow<TData> = (row: Row<TData>) => ReactNode;
```

### 4.2 `MasterDetailGridProps<TData>` (`grid-pro-master/src/MasterDetailGrid.tsx`)

`MasterDetailGrid` 는 `GridProps<TData>` 를 extend + Master-Detail 전용 props 추가.

```typescript
import type { GridProps } from '@tomis/grid-core';
import type { MasterDetailOptions, RenderDetailRow } from './types';

export interface MasterDetailGridProps<TData> extends GridProps<TData> {
  /**
   * 행 확장 시 렌더링할 자식 컴포넌트 반환 함수. (F-16-01)
   * `Row<TData>` 전체 접근 (row.original / row.id / row.depth 포함).
   */
  renderDetailRow?: RenderDetailRow<TData>;
  /**
   * Master-Detail controlled state 옵션 (F-16-02).
   * 미제공 시 uncontrolled.
   */
  masterDetail?: MasterDetailOptions<TData>;
}
```

### 4.3 `GridHandle<TData>` 확장 (`grid-core/src/types.ts` — MODIFY)

기존 `GridHandle<TData>` 인터페이스에 두 메서드 추가 (D8):

```typescript
/**
 * 전체 행 펼치기 — `enableExpanding=true` 또는 `<MasterDetailGrid>` 에서 사용 (F-16-04).
 * TreeGrid `expandAll()` 패턴 보존.
 */
expandAll?: () => void;

/**
 * 전체 행 접기 — `enableExpanding=true` 또는 `<MasterDetailGrid>` 에서 사용 (F-16-04).
 * TreeGrid `collapseAll()` 패턴 보존.
 */
collapseAll?: () => void;
```

> **optional method** (`?:`) 선택 이유: 기존 `GridHandle` 구현체(`useGridImperativeHandle.ts`)를 변경하지 않고 backward compat 유지 (C-6). `MasterDetailGrid` 의 `useImperativeHandle` 에서만 구현.

---

## Section 5. Feature 상세

### 5.1 F-16-01: `renderDetailRow` prop

- `<MasterDetailGrid data={...} columns={...} renderDetailRow={fn} />` 형태.
- `fn` 시그니처: `(row: Row<TData>) => ReactNode`.
- `renderDetailRow` 미제공 시 토글 컬럼 미렌더 (EC-001).
- 행 확장 여부: `row.getIsExpanded()`.
- `row.getIsExpanded() === true` 인 행에만 `<DetailRow>` 렌더.

### 5.2 F-16-02: `expandedRowKeys` + `onExpandChange`

- `masterDetail.expandedRowKeys` 제공 시: `useEffect` 에서 `table.setExpanded(rowIdsToExpandedState(expandedRowKeys))`.
- `masterDetail.onExpandChange` 제공 시: `onExpandedChange` 에서 `expandedState → string[]` 변환 후 콜백.
- 변환 헬퍼 (MasterDetailGrid.tsx 내부):
  ```typescript
  function rowIdsToExpandedState(ids: string[]): ExpandedState {
    return ids.reduce<Record<string, boolean>>((acc, id) => {
      acc[id] = true;
      return acc;
    }, {});
  }
  ```

### 5.3 F-16-03: Tree mode (getSubRows 흡수)

- `getSubRows` + `renderDetailRow` 동시 사용 지원.
- `ExpandToggleCell` 내 `row.depth * INDENT_PX` 들여쓰기 (`INDENT_PX = 16` — TreeGrid.tsx:17 동일).
- `getSubRows` 반환 sub-row 는 TanStack 트리로 처리; `renderDetailRow` 는 각 expanded row 아래 detail tr 렌더.

### 5.4 F-16-04: 전체 펼치기/접기

- `GridHandle` ref의 `expandAll?.()` / `collapseAll?.()` 메서드.
- 구현: `table.toggleAllRowsExpanded(true)` / `table.toggleAllRowsExpanded(false)`.
- TreeGrid.tsx:L58-61 패턴 보존: `setExpanded(true)` / `setExpanded({})`.

---

## Section 6. 엣지 케이스 (EC)

| EC-ID | 케이스 | 처리 |
|-------|--------|------|
| EC-001 | `renderDetailRow` 미제공 | 토글 컬럼 미prepend. detail tr 미렌더. `<MasterDetailGrid>` 는 내부적으로 `<Grid>` 위임만 수행. |
| EC-002 | `enableVirtualization={true}` 전달 (virtualization + Master-Detail 동시) | dev mode `console.warn('[tomis/grid-pro-master] enableVirtualization + renderDetailRow 동시 미지원. detail render skip.')` 1회 mount 시. detail tr 미렌더 (D5). |
| EC-003 | `masterDetail.expandedRowKeys` 에 실제 row.id 와 불일치 id 포함 | TanStack 이 unknown id silently ignore. 정상 동작. |
| EC-004 | `renderDetailRow` 가 `null` 반환 | React 표준: detail tr 내부가 null. 빈 `<tr data-detail-row>` 가시. (허용) |
| EC-005 | `expandAll()` 호출 후 `collapseAll()` 즉시 호출 | `toggleAllRowsExpanded` 직렬 — React state batching 내 최종 상태 적용. |
| EC-006 | `renderDetailRow` 내 `<MasterDetailGrid>` 중첩 | 지원. 독립 인스턴스. 성능 책임 호출자. |
| EC-007 | `expandedRowKeys` controlled + `expandAll()` handle 동시 | handle 호출 시 `table.toggleAllRowsExpanded(true)` → `onExpandedChange` → `onExpandChange` 콜백 발화. controlled 상태 sync는 parent 책임. |

---

## Section 7. 구현 파일 목록 (Truth Table)

> **C-30 Truth Table 기준 파일 (단독 권위)**: D# 요약표 + Section 8~13 본문은 모두 이 표와 일치해야 한다. 이 표가 최종 권위.

| 파일 경로 (monorepo 상대) | NEW/MODIFY | 설명 |
|--------------------------|-----------|------|
| `topvel-grid-monorepo/packages/grid-pro-master/src/MasterDetailGrid.tsx` | **NEW** | Pro wrapper shell — verifyLicense + MasterDetailGridProps + 내부 테이블 렌더 |
| `topvel-grid-monorepo/packages/grid-pro-master/src/DetailRow.tsx` | **NEW** | detail `<tr>` pure helper 컴포넌트 |
| `topvel-grid-monorepo/packages/grid-pro-master/src/types.ts` | **NEW** | `RenderDetailRow<TData>`, `MasterDetailOptions<TData>`, `MasterDetailGridProps<TData>` |
| `topvel-grid-monorepo/packages/grid-pro-master/src/internal/ExpandToggleCell.tsx` | **NEW** | 토글 버튼 + 들여쓰기 pure helper (internal) |
| `topvel-grid-monorepo/packages/grid-core/src/types.ts` | **MODIFY** | `GridHandle<TData>` 에 `expandAll?()` + `collapseAll?()` optional method 추가 (D8) |
| `topvel-grid-monorepo/packages/grid-pro-master/package.json` | **MODIFY** | `@tomis/grid-core: "workspace:*"` peerDependency 추가 (D4) |
| `topvel-grid-monorepo/packages/grid-pro-master/src/index.ts` | **MODIFY** | `MasterDetailGrid`, `RenderDetailRow`, `MasterDetailOptions`, `MasterDetailGridProps` export 추가 |

**합계**: NEW 4개 + MODIFY 3개 = 7개 파일

**grid-core/src/Grid.tsx 변경 없음**: Option B 채택으로 Grid.tsx DOM 구조 보존. C-6 완전 충족.

---

## Section 8. 파일별 상세 설계

### 8.1 `grid-pro-master/src/types.ts` (NEW)

역할: Pro 패키지 전용 타입 정의.  
내용: `RenderDetailRow<TData>`, `MasterDetailOptions<TData>`, `MasterDetailGridProps<TData>` (Section 4 정의 그대로).  
의존: `@tanstack/react-table` (`Row`), `react` (`ReactNode`), `@tomis/grid-core` (`GridProps`).

### 8.2 `grid-pro-master/src/internal/ExpandToggleCell.tsx` (NEW)

> **D6**: 이 Goal 이 `grid-pro-master/src/internal/` 디렉토리를 신규 생성한다. 현재 해당 디렉토리는 존재하지 않음 (실측 — Glob 검색 결과 파일 없음).

역할: Master-Detail 토글 버튼 셀 pure helper. row depth 들여쓰기 포함.

```typescript
const INDENT_PX = 16; // TreeGrid.tsx:17 동일값

interface ExpandToggleCellProps {
  isExpanded: boolean;
  depth: number;
  onToggle: (e: React.MouseEvent) => void;
}

export function ExpandToggleCell({ isExpanded, depth, onToggle }: ExpandToggleCellProps) {
  return (
    <div className="flex items-center" style={{ paddingLeft: `${depth * INDENT_PX}px` }}>
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(e); }}
        className="text-gray-500 hover:text-gray-700 focus:outline-none"
        aria-label={isExpanded ? '접기' : '펼치기'}
        aria-expanded={isExpanded}
      >
        {isExpanded ? '▼' : '▶'}
      </button>
    </div>
  );
}
```

**call site (C-31)**: `MasterDetailGrid.tsx` 의 toggle 컬럼 `ColumnDef.cell` 렌더러.

### 8.3 `grid-pro-master/src/DetailRow.tsx` (NEW)

역할: detail `<tr>` pure helper. `renderDetailRow(row)` 결과를 `colSpan` 전체로 감싸 렌더.

```typescript
import type { Row } from '@tanstack/react-table';
import type { ReactNode } from 'react';

interface DetailRowProps<TData> {
  row: Row<TData>;
  colSpan: number;
  renderDetailRow: (row: Row<TData>) => ReactNode;
}

export function DetailRow<TData>({ row, colSpan, renderDetailRow }: DetailRowProps<TData>) {
  return (
    <tr data-detail-row className="bg-gray-50">
      <td colSpan={colSpan} className="px-4 py-2">
        {renderDetailRow(row)}
      </td>
    </tr>
  );
}
```

**call site (C-31)**: `MasterDetailGrid.tsx` tbody 루프에서 `row.getIsExpanded() === true` 시 `<DetailRow>` 렌더.  
`colSpan` = `table.getAllLeafColumns().length` (Grid.tsx L252 패턴 동일).

### 8.4 `grid-pro-master/src/MasterDetailGrid.tsx` (NEW)

역할: Pro license verify 진입점 + Master-Detail 전체 렌더링 shell.

**C-32 Pure Helpers + React Shell 분리**: Shell = MasterDetailGrid.tsx (side-effect: license verify, state, render 조율). Helpers = ExpandToggleCell.tsx + DetailRow.tsx (pure, no license dependency).

**핵심 구현 스케치** (C-33: spec 이 구현 권위 — 실제 코드는 구현 단계에서 이 설계를 따름):

```typescript
import { verifyLicense } from '@tomis/grid-license';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  type ExpandedState,
  type Ref,
} from '@tanstack/react-table';
import type { GridHandle } from '@tomis/grid-core';
import { ExpandToggleCell } from './internal/ExpandToggleCell';
import { DetailRow } from './DetailRow';
import type { MasterDetailGridProps } from './types';

// D7: Pro license 검증 — 모듈 import 시 1회 자동 실행 (MOD-GRID-99-A F-99A-03)
verifyLicense('@tomis/grid-pro-master');

function MasterDetailGridInner<TData>(
  props: MasterDetailGridProps<TData>,
  ref: Ref<GridHandle<TData>>,
): JSX.Element {
  const { renderDetailRow, masterDetail, ...gridProps } = props;

  // D3: expanded state — TanStack ExpandedState 재사용 (AC-002)
  const [expanded, setExpanded] = useState<ExpandedState>({});

  // EC-002 / D5: enableVirtualization + renderDetailRow 동시 → dev warn
  useEffect(() => {
    if (
      props.enableVirtualization === true &&
      renderDetailRow !== undefined &&
      typeof process !== 'undefined' &&
      process?.env?.NODE_ENV !== 'production'
    ) {
      console.warn(
        '[tomis/grid-pro-master] enableVirtualization + renderDetailRow 동시 미지원. detail render skip.',
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // F-16-02: masterDetail.expandedRowKeys controlled 모드 (AC-005)
  useEffect(() => {
    if (masterDetail?.expandedRowKeys !== undefined) {
      setExpanded(rowIdsToExpandedState(masterDetail.expandedRowKeys));
    }
  }, [masterDetail?.expandedRowKeys]);

  // toggle column — renderDetailRow 제공 시만 prepend (AC-001)
  const toggleColumn = renderDetailRow
    ? [{
        id: '__master_detail__',
        header: '',
        size: 40,
        enableSorting: false,
        enableResizing: false,
        cell: ({ row }: { row: Row<TData> }) => (
          <ExpandToggleCell
            isExpanded={row.getIsExpanded()}
            depth={row.depth}
            onToggle={() => row.toggleExpanded()}
          />
        ),
      }]
    : [];

  const table = useReactTable<TData>({
    data: props.data,
    columns: [...toggleColumn, ...props.columns],
    state: { expanded },
    onExpandedChange: (updater) => {
      const next = typeof updater === 'function' ? updater(expanded) : updater;
      setExpanded(next);
      if (masterDetail?.onExpandChange) {
        const keys = next === true ? [] : Object.keys(next).filter((k) => (next as Record<string, boolean>)[k]);
        masterDetail.onExpandChange(keys);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    ...(props.getSubRows ? { getSubRows: props.getSubRows } : {}),
  });

  // D8: expandAll / collapseAll GridHandle (F-16-04, AC-006)
  useImperativeHandle(ref, () => ({
    expandAll: () => table.toggleAllRowsExpanded(true),
    collapseAll: () => table.toggleAllRowsExpanded(false),
    // 나머지 GridHandle 메서드 (addRow, deleteRow 등)는 no-op (MasterDetailGrid 는 mutation 미지원)
    addRow: () => { props.onAddRow?.(); },
    deleteRow: () => {},
    updateRow: () => {},
    getSelection: () => [],
    scrollTo: () => {},
  }));

  const colSpan = table.getAllLeafColumns().length;

  return (
    <div className={`flex flex-col ${props.className ?? ''}`}>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <tr
                  className={`transition-colors ${props.onRowClick ? 'cursor-pointer' : ''} hover:bg-gray-50`}
                  onClick={(e) => props.onRowClick?.(row.original, e)}
                  onDoubleClick={(e) => props.onRowDoubleClick?.(row.original, e)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 whitespace-nowrap text-gray-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
                {/* Master-Detail detail row (renderDetailRow 제공 + expanded 시) */}
                {renderDetailRow &&
                  row.getIsExpanded() &&
                  props.enableVirtualization !== true && (
                    <DetailRow
                      row={row}
                      colSpan={colSpan}
                      renderDetailRow={renderDetailRow}
                    />
                  )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const MasterDetailGrid = forwardRef(MasterDetailGridInner) as <TData>(
  props: MasterDetailGridProps<TData> & { ref?: Ref<GridHandle<TData>> },
) => ReactElement;
```

> **Note**: `Fragment` import — `react` 에서 import. `Row` type — `@tanstack/react-table` 에서 import.  
> `process` declare 패턴 — Grid.tsx:61 동일 패턴 적용 (C-4 준수, @types/node 미설치 환경).  
> `ReactElement` import — `react` 에서 import (forwardRef cast 패턴 — Grid.tsx:490 동일).

### 8.5 `grid-core/src/types.ts` (MODIFY)

변경 범위: `GridHandle<TData>` interface 에 2개 optional method 추가 (D8).

추가 위치: 기존 `scrollTo` 메서드 선언 다음.

```typescript
/**
 * 전체 행 펼치기 (F-16-04, MOD-GRID-16 G-001).
 * `enableExpanding=true` 또는 `<MasterDetailGrid>` ref 에서 사용.
 * optional: 기존 Grid ref 구현체 변경 없음 (C-6 backward compat).
 */
expandAll?: () => void;

/**
 * 전체 행 접기 (F-16-04, MOD-GRID-16 G-001).
 * optional: 기존 Grid ref 구현체 변경 없음 (C-6 backward compat).
 */
collapseAll?: () => void;
```

> `grid-core/src/Grid.tsx` **변경 없음** (Section 7 Truth Table 확인 — MODIFY 항목 없음).

### 8.6 `grid-pro-master/package.json` (MODIFY)

`peerDependencies` 에 추가:

```json
"@tomis/grid-core": "workspace:*"
```

> **C-22 준수**: `MasterDetailGrid` 가 `@tomis/grid-core` 의 `GridHandle`, `GridProps` 타입을 사용하므로 peer 선언 필수. 버전: `workspace:*` (monorepo 내부, 배포 시 실제 semver range 로 변환).

### 8.7 `grid-pro-master/src/index.ts` (MODIFY)

현재: `export {};`  
추가:

```typescript
export { MasterDetailGrid } from './MasterDetailGrid';
export type {
  MasterDetailGridProps,
  MasterDetailOptions,
  RenderDetailRow,
} from './types';
```

---

## Section 9. 비기능 요건 (NFR)

| NFR-ID | 항목 | 기준 |
|--------|------|------|
| NFR-001 | Bundle size | grid-pro-master 신규 코드 < 5 KB gzipped (전체 ≤ 20 KB — C-21) |
| NFR-002 | TypeScript strict | `any` 0개, `as unknown` 0개 (C-4) |
| NFR-003 | Tailwind-only | `.css`/`.scss` 신규 파일 0개 (C-5) |
| NFR-004 | peerDependencies | react, react-dom, @tanstack/react-table, @tomis/grid-core 모두 peer (C-22) |
| NFR-005 | backward compat | `<Grid>` props / DOM 변경 없음 (C-6). Grid.tsx diff = 0 |
| NFR-006 | Pro EULA | EULA.md 존재 + `"SEE LICENSE IN EULA"` package.json (C-24 — EULA.md 존재 여부 구현 단계 확인) |
| NFR-007 | accessibility | ExpandToggleCell `aria-expanded` + `aria-label` (AC-001) |

---

## Section 10. 테스트 계획

### 10.1 Unit Tests (Vitest + @testing-library/react)

| 테스트 | 파일 위치 | AC |
|--------|---------|-----|
| `renderDetailRow` 미제공 시 토글 컬럼 없음 + detail tr 없음 | `MasterDetailGrid.test.tsx` | AC-001 |
| 토글 버튼 클릭 → detail tr `data-detail-row` 출현 | `MasterDetailGrid.test.tsx` | AC-001, AC-007 |
| `masterDetail.expandedRowKeys` controlled 모드 | `MasterDetailGrid.test.tsx` | AC-005 |
| `enableVirtualization={true}` console.warn | `MasterDetailGrid.test.tsx` | AC-008 |
| `expandAll?.()` / `collapseAll?.()` GridHandle ref | `MasterDetailGrid.test.tsx` | AC-006 |
| `verifyLicense` module-level 1회 호출 | `MasterDetail.test.tsx` | AC-009 |
| `ExpandToggleCell` aria-expanded toggle | `ExpandToggleCell.test.tsx` | AC-007 |
| `<Grid>` prop 목록 변경 없음 (GridProps diff 0) | `types.test-d.ts` (tsd) | AC-004 |

### 10.2 Storybook Stories (C-25)

| Story | 파일 |
|-------|------|
| Default — `renderDetailRow` 기본 expand | `MasterDetailGrid.stories.tsx` |
| Controlled — `expandedRowKeys` + `onExpandChange` | `MasterDetailGrid.stories.tsx` |
| TreeMode — `getSubRows` + `renderDetailRow` 복합 | `MasterDetailGrid.stories.tsx` |
| ExpandCollapseAll — `GridHandle` ref | `MasterDetailGrid.stories.tsx` |

---

## Section 11. 구현 단계

### 11.1 단계 목록

| 단계 | 작업 | 검증 |
|------|------|------|
| Step 1 | `grid-pro-master/src/types.ts` NEW | `tsc --noEmit` 통과 |
| Step 2 | `grid-pro-master/src/internal/ExpandToggleCell.tsx` NEW (D6: `src/internal/` 신규 생성) | `aria-expanded` 확인 |
| Step 3 | `grid-pro-master/src/DetailRow.tsx` NEW | `data-detail-row` attribute 확인 |
| Step 4 | `grid-pro-master/src/MasterDetailGrid.tsx` NEW (verifyLicense mock) | TypeScript + AC-009 |
| Step 5 | `grid-core/src/types.ts` MODIFY (GridHandle에 expandAll/collapseAll 추가) | `tsc --noEmit` grid-core 통과 |
| Step 6 | `grid-pro-master/package.json` MODIFY (peerDep 추가) | pnpm install + type resolution |
| Step 7 | `grid-pro-master/src/index.ts` MODIFY (exports 추가) | import path test |
| Step 8 | 테스트 작성 + Storybook stories | 전체 AC 통과 |

### 11.2 C-29 spread-skip 패턴 예시

`MasterDetailGrid.tsx` 에서 `getSubRows` optional prop 을 `useReactTable` 에 전달할 때:

**BEFORE** (잘못된 패턴 — `exactOptionalPropertyTypes: true` 위반):
```typescript
// ❌ props.getSubRows 가 undefined 일 수 있음 — 직접 할당 위반
const tableOptions = {
  getSubRows: props.getSubRows, // possibly undefined literal — 금지
};
```

**AFTER** (C-29 준수 — spread-skip 패턴):
```typescript
// ✅ C-29: exactOptionalPropertyTypes — undefined literal 직접 할당 금지
// 값이 있을 때만 spread (MasterDetailGrid.tsx useReactTable 호출부에서 사용)
const tableOptions = {
  // ...기타 옵션
  ...(props.getSubRows !== undefined ? { getSubRows: props.getSubRows } : {}),
};
// useReactTable<TData>({ data, columns, state, ...tableOptions, ... })
```

---

## Section 12. 위험 + 완화

| 위험 | 가능성 | 영향 | 완화 |
|------|--------|------|------|
| `MasterDetailGrid` 가 `Grid.tsx` 기능 중복 구현 — 유지보수 diverge | 중간 | 중간 | Option B 채택 결정 시 주요 tradeoff. 후속 Goals 에서 `MasterDetailGrid` → `<Grid>` composition 패턴으로 점진적 개선 가능. |
| expandAll/collapseAll optional method — 기존 GridHandle 구현 미구현 | 낮음 | 낮음 | optional (`?:`) 선언으로 기존 구현체 타입 에러 없음 (C-6 보존). |
| `@tomis/grid-license` 미구현 (MOD-GRID-99-A 미완료) | 높음 | 낮음 | 구현 단계에서 mock stub 사용. `verifyLicense` 는 no-op export 로 임시 제공. |
| virtualization 지원 누락 | 중간 | 중간 | EC-002 dev warn + detail skip. TODO: MOD-GRID-16/G-00X |
| `MasterDetailGridProps extends GridProps` — 미래 GridProps 변경 시 충돌 | 낮음 | 낮음 | `extends` 패턴 — GridProps 하위 호환 변경 시 자동 흡수. breaking change 시 spec 갱신. |

---

## Section 13. Pro License 검증 연동 (C-24)

**call site (D7, AC-009)**: `grid-pro-master/src/MasterDetailGrid.tsx` 최상단 module-level:

```typescript
import { verifyLicense } from '@tomis/grid-license';

// MOD-GRID-99-A F-99A-03: Pro 패키지 import 시 자동 검증 (1회).
// 유효 라이선스 없음 → console.warn + watermark (block 없음 — F-99A-04).
verifyLicense('@tomis/grid-pro-master');
```

**발동 경로**: 사용자가 `import { MasterDetailGrid } from '@tomis/grid-pro-master'` 실행 시 모듈 평가와 함께 `verifyLicense` 1회 자동 호출. Option B 구조에서 사용자는 반드시 `@tomis/grid-pro-master` 를 import 하므로 발동 보장 (D7 근거).

**EULA.md**: `grid-pro-master/EULA.md` 존재 여부 구현 단계에서 확인. 없으면 신규 생성 (C-24 요건).

**package.json**: `"license": "SEE LICENSE IN EULA"` ✓ (실측 확인 — grid-pro-master/package.json L5).

**테스트 (AC-009)**:
```typescript
// MasterDetail.test.tsx
vi.mock('@tomis/grid-license', () => ({
  verifyLicense: vi.fn(),
}));
// dynamic import 후 verifyLicense spy 호출 횟수 = 1 검증
const { verifyLicense } = await import('@tomis/grid-license');
await import('../MasterDetailGrid');
expect(verifyLicense).toHaveBeenCalledOnce();
expect(verifyLicense).toHaveBeenCalledWith('@tomis/grid-pro-master');
```

---

## Appendix A. D# 전체 결정 상세

### D1: 통합 형태 — Option B (wrapper) 채택

**3가지 후보**:
- Option A: Grid.tsx + types.ts MODIFY (prop-based — `enableMasterDetail` prop 추가)
- **Option B: `<MasterDetailGrid>` wrapper in grid-pro-master (채택)**
- Option C: plugin hook pattern

**채택**: Option B

**근거**:
1. **MIT↔Pro EULA 경계 보존**: Option A 에서 `grid-core/Grid.tsx` 가 `@tomis/grid-pro-master` import → MIT 패키지가 Pro 패키지에 의존. 이는 Pro 패키지 없이 MIT 패키지가 동작해야 하는 계약을 깨뜨림.
2. **license 검증 발동 보장**: Option A 에서 `<Grid enableMasterDetail>` 는 `grid-core` 를 import하므로 `grid-pro-master` 모듈 평가 없음 → `verifyLicense` 미발동. Option B 에서 사용자가 반드시 `@tomis/grid-pro-master` 를 import (F-99A-03 보장).
3. **C-6 완전 충족**: Grid.tsx 변경 없음.

**tradeoff (기록)**: Option B 는 `MasterDetailGrid` 가 `Grid.tsx` 의 sorting/pagination/filtering 등 기능을 재구현하거나 내부 `<Grid>` 로 composition 해야 한다. 이 spec 에서 `MasterDetailGrid` 는 standalone table 렌더러로 구현한다. 후속 Goals 에서 `<Grid>` composition 패턴으로 점진적 개선 가능.

### D2: C-28 경로 수정

**근거**: goals.json `implementFiles` 의 `TOMIS/packages/` prefix 오류. 실제 경로: `D:/project/topvel_project/topvel-grid-monorepo/packages/`. 이 spec 의 모든 파일 경로는 `topvel-grid-monorepo/packages/` prefix 사용.

### D3: AC-002 upstream expanded state 재사용

**실측**: `buildTableOptions.ts` L210-212, Grid.tsx L92-98, L117-118 — `expanded` state + `getExpandedRowModel` 이미 wiring (MOD-GRID-01).

`MasterDetailGrid` 는 자체 `useState<ExpandedState>` + `getExpandedRowModel()` 를 별도로 사용. "재사용"의 의미: 동일한 TanStack API 패턴 재사용 (코드 복사 아님 — C-16).

### D4: @tomis/grid-core peerDependency 추가

`MasterDetailGrid.tsx` 가 `GridHandle<TData>` type + `MasterDetailGridProps extends GridProps<TData>` 를 사용. 동일 `@tomis/grid-core` 인스턴스 사용 보장. 버전: `workspace:*`.

### D5: 가상화 + Master-Detail 동시 사용 — dev warn + defer

`MasterDetailGrid` 는 padding-row 패턴의 virtual tbody 미구현. `enableVirtualization={true}` 전달 시 detail row 미렌더 + dev warn. TODO: MOD-GRID-16/G-00X.

### D6: src/internal/ 디렉토리 신규 생성

현재 `grid-pro-master/src/internal/` 비존재 확인. 이 Goal 이 최초 생성.

### D7: Pro license 검증 call site

`MasterDetailGrid.tsx` module-level `verifyLicense` 호출. Option B 에서 실제 import 경로 보장.

### D8: GridHandle expandAll/collapseAll

`GridHandle<TData>` 인터페이스 optional method 추가. `MasterDetailGrid` 의 `useImperativeHandle` 에서만 구현. 기존 `useGridImperativeHandle.ts` 변경 없음 (C-6).

---

## Appendix B. E-06 Prose ↔ Section 7 Truth Table Cross-Check

| Prose 주장 | Section 7 Truth Table 확인 |
|-----------|--------------------------|
| "MasterDetailGrid.tsx NEW — verifyLicense + render shell" | MasterDetailGrid.tsx NEW ✓ |
| "DetailRow.tsx NEW — pure helper" | DetailRow.tsx NEW ✓ |
| "types.ts NEW — RenderDetailRow, MasterDetailOptions" | types.ts NEW ✓ |
| "ExpandToggleCell.tsx NEW — src/internal/ 신규" | ExpandToggleCell.tsx NEW + D6 ✓ |
| "grid-core/src/types.ts MODIFY — GridHandle expandAll/collapseAll" | grid-core/src/types.ts MODIFY ✓ |
| "package.json MODIFY — @tomis/grid-core peer" | package.json MODIFY + D4 ✓ |
| "index.ts MODIFY — exports 추가" | index.ts MODIFY ✓ |
| "Grid.tsx 변경 없음 (Option B)" | Section 7 에 grid-core/Grid.tsx 없음 ✓ |
| "buildTableOptions.ts 변경 없음" | Section 7 에 buildTableOptions.ts 없음 ✓ |
| "useGridImperativeHandle.ts 변경 없음 (C-6)" | Section 7 에 useGridImperativeHandle.ts 없음 ✓ |
