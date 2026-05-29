# G-001 Spec: HTML5 drag-and-drop 기반 컬럼 순서 변경 + 시각 인디케이터 + pinned 가드 + onColumnOrderChange

**Module**: MOD-GRID-07 (컬럼 드래그 재정렬)  
**Goal**: G-001  
**Priority**: P0  
**migrationImpact**: low  
**Specify threshold**: 90  
**Spec version**: 1.0  
**Spec date**: 2026-05-14  
**Status**: specify → in_progress

---

## D# — 결정 테이블 (Goals.json 보정 포함)

| ID | 결정 | 근거 |
|----|------|------|
| D1 | `enableColumnReorder`, `onColumnOrderChange` props를 `grid-core/types.ts` `GridProps<TData>`에 추가 | goals.json implementFiles에 grid-core 파일 없음 → C-31 wiring 의무 이행 불가 → 범위 확장 필요 |
| D2 | `grid-core/Grid.tsx` header `<th>` render block에 `useColumnDrag` 직접 wiring | C-31: 새 utility hook은 지정 call site에 반드시 wiring — dead-code 금지 |
| D3 | goals.json `implementFiles` 4파일 → 6파일로 보정 (grid-core 2개 추가 MODIFY) | AC-001 user story `<Grid enableColumnReorder .../>` 이행에 grid-core 수정 필수 (C-28 준수) |
| D4 | `DropIndicator.tsx` 컴포넌트는 `useColumnDrag` 반환 state를 소비하는 독립 TSX 파일로 분리 | 재사용성 + TSX/TS 혼재 회피; `<th>` 내부에서 조건부 렌더링 |
| D5 | `dataTransfer.setData/getData` type string = `'text/plain'` (컬럼 ID 전달) | HTML5 DnD spec 권장 MIME type; 외부 라이브러리 불필요 |
| D6 | `column.getIsPinned() !== false` 조건 — `draggable={false}` + `dragover`/`drop` early return | AC-004: pinned guard; TanStack `getIsPinned()` 반환 `'left' \| 'right' \| false` |
| D7 | `onColumnOrderChange` 콜백은 `table.setColumnOrder` 호출 직후 invoke | AC-005: 부모 external state 동기화; TanStack state 변경 후 호출이 안전 |
| D8 | `buildTableOptions.ts`에 `enableColumnReorder`/`onColumnOrderChange` 연결 **없음** — `useColumnDrag`가 Grid.tsx에서 직접 `table.setColumnOrder` 호출 | `buildTableOptions`는 `onColumnOrderChange: state.setColumnOrder` 이미 등록 완료(L184) — 중복 wiring 불필요; hook은 drop 시 직접 table instance 참조 |
| D9 | `packages/grid-features/src/column-drag/` 서브디렉토리는 G-001이 신규 생성 | H-02: 상위 `packages/grid-features/src/` 존재 확인(index.ts) — 외부 디렉토리 생성 허용 조건 충족 |
| D10 | `grid-features` 버전 `0.0.0` → `0.1.0` 범프 | AC-006 + C-23 semver: 신규 feature export = minor bump |

---

## Section 1. 목적 및 범위

G-001은 `<Grid enableColumnReorder onColumnOrderChange={...} />` prop으로 활성화되는 HTML5 Drag and Drop API 기반 컬럼 헤더 재정렬 기능을 구현한다.

**핵심 달성 항목:**
- 헤더 `<th>` 요소에 `draggable` 속성 동적 부여 (`enableColumnReorder=true` 시)
- `dragstart` / `dragover` / `dragleave` / `drop` 이벤트 핸들러 via `useColumnDrag` hook
- 드래그 중 drop 위치 시각 인디케이터 — Tailwind `border-l-2 border-blue-500` 클래스 (DropIndicator)
- pinned 컬럼 (`column.getIsPinned() !== false`) draggable=false + drop early return
- `table.setColumnOrder(newOrder)` — TanStack v8 표준 API (C-2)
- `onColumnOrderChange(columnOrder: string[])` 콜백 prop

**범위 외:**
- localStorage 영속화 — G-002 담당 (G-001에서는 in-memory state만)
- 키보드 단축키 (Alt+← / Alt+→) — G-002 담당
- 터치 이벤트 지원 — 이 Goal 범위 외
- 외부 dnd 라이브러리 — C-20/AC-006에 의해 금지

---

## Section 2. 의존성 및 전제조건

| 의존 Goal | 요구 사항 | 상태 |
|-----------|---------|------|
| MOD-GRID-01/G-001 | `Grid.tsx` 컴포넌트 존재, `GridProps<TData>` 타입 정의 | 완료 |
| MOD-GRID-02/G-001 | `columnOrder` state (`GridStateBag.columnOrder` + `setColumnOrder`) Grid.tsx에 존재 | 완료 |

**전제 확인:**
- `Grid.tsx` L99: `const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])`  — 존재 확인
- `buildTableOptions.ts` L184: `onColumnOrderChange: state.setColumnOrder` — TanStack columnOrder change 이미 wiring됨
- `buildTableOptions.ts` L129: `columnOrder: state.columnOrder` — TanStack state 이미 controlled
- `grid-features/src/index.ts`: placeholder만 존재 — G-001이 실제 exports 추가

**외부 패키지:**
- `@tanstack/react-table@^8.21.3` (peer dep 이미 등록) — `setColumnOrder`, `ColumnOrderState`, `getIsPinned()` 사용
- HTML5 DnD API — 네이티브 브라우저 API, 추가 dependency 없음 (AC-006, C-20)
- `@tanstack/react-virtual@^3.0.0` — G-001이 직접 사용하지 않으나, Grid.tsx 가상화와의 호환성 확인 필요 (C-18)

---

## Section 3. 수용 기준 (AC) 상세화

| AC-ID | 원문 | 구현 상세 | 파일 |
|-------|------|---------|------|
| AC-001 | `enableColumnReorder prop` 추가 시 헤더 th에 `draggable` 속성 동적 부여 — falsy 시 드래그 비활성 | `GridProps.enableColumnReorder?: boolean`; Grid.tsx `<th>`에 `draggable={props.enableColumnReorder === true && !column.getIsPinned()}` | types.ts, Grid.tsx |
| AC-002 | `table.setColumnOrder(newOrder)` 호출 — TanStack v8 columnOrder state 표준 API | `useColumnDrag` drop handler 내부: `table.setColumnOrder(newOrder)` | useColumnDrag.ts |
| AC-003 | 드래그 중 drop 위치 시각 인디케이터 — Tailwind className border 활용, style={{}} 최소화 | `DropIndicator.tsx`: `dragOverId` state 기반 조건부 `<div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500" />` 렌더; `<th>` 내 절대 위치 | DropIndicator.tsx, Grid.tsx |
| AC-004 | `column.getIsPinned() !== false`인 컬럼 `draggable={false}` + drop 이벤트 early return | `getIsPinned() !== false` 조건 → draggable=false; dragover/drop 핸들러 내 동일 조건으로 early return | useColumnDrag.ts, Grid.tsx |
| AC-005 | `onColumnOrderChange(columnOrder: string[])` 콜백 prop | `GridProps.onColumnOrderChange?: (order: string[]) => void`; drop 완료 후 `props.onColumnOrderChange?.(newOrder)` | types.ts, Grid.tsx |
| AC-006 | HTML5 DnD만 사용 — 외부 라이브러리 추가 없음 | `useColumnDrag.ts`의 모든 DnD 로직은 `DragEvent` Web API만 사용; package.json 수정 없음 | useColumnDrag.ts |
| AC-007 | C-12: `tsc --noEmit 0 error` | `exactOptionalPropertyTypes: true` 준수 + 모든 타입 명시 | 전체 |
| AC-008 | C-25: Storybook story 1개 (6컬럼 + enableColumnReorder + drop 시나리오) | `packages/grid-features/src/column-drag/useColumnDrag.stories.tsx` | useColumnDrag.stories.tsx |

---

## Section 4. 참조 증거 (L-layer)

### L0 — 현재 코드베이스
- `grid-features/src/index.ts`: `export {};` placeholder — 신규 exports 없음
- `grid-core/src/types.ts` L253-539: `GridProps<TData>`에 `enableColumnReorder`, `onColumnOrderChange` 부재 확인
- `grid-core/src/Grid.tsx` L246-263: `<th>` render block — `draggable` 속성, DnD 핸들러 없음
- `grid-core/src/internal/buildTableOptions.ts` L184: `onColumnOrderChange: state.setColumnOrder` 이미 등록
- `grid-core/src/internal/buildTableOptions.ts` L129: `columnOrder: state.columnOrder` TanStack controlled

### L1 — TanStack Table v8 API
- `§2.3 ColumnOrdering`: `columnOrder: ColumnOrderState` state key, `setColumnOrder` Table 메서드
- `§3 TableOptions.onColumnOrderChange?: OnChangeFn<ColumnOrderState>` — 이미 buildTableOptions에 wiring
- `column.getIsPinned(): 'left' | 'right' | false` — pinned guard condition
- HTML5 `DragEvent`: `dataTransfer.setData(type, value)` / `dataTransfer.getData(type)`
- `§5`: `@tanstack/react-virtual` 가상화는 row level (TanStack Table과 독립) — 헤더 drag 무영향

### R-A — AG Grid Community 참조
- AG Grid: `allowDragging: true` on `ColDef` — built-in column reorder
- 우리: HTML5 직접 구현 (C-7: AG Grid 코드 차용 금지)

### R-W — Wijmo FlexGrid 참조
- Wijmo: `grid.allowDragging` + `frozenColumns` (pinned 보호)
- 우리: `getIsPinned()` !== false 조건으로 동일 보호 (C-16: Wijmo import 금지)

---

## Section 5. 아키텍처 결정 (ADR)

**ADR 불필요** (AC-006, C-20):
- HTML5 Drag and Drop API는 네이티브 브라우저 API — 외부 라이브러리 도입 없음
- C-20 트리거 조건: "신규 외부 dependency 추가 시 ADR 작성" → 해당 없음

**핵심 아키텍처 선택:**

1. **Hook 분리 (`useColumnDrag`)**: DnD 상태 및 이벤트 핸들러를 hook으로 캡슐화. Grid.tsx는 hook 반환값만 `<th>` props에 spread. 관심사 분리 + 테스트 용이성.

2. **`DropIndicator` 컴포넌트 분리**: 시각 인디케이터를 독립 TSX 컴포넌트로 분리. `<th className="relative">` 내부에서 절대 위치로 렌더링. CSS `position: absolute`를 사용하되 `left: 0` / `inset-y-0` — Tailwind 클래스 우선 (C-5).

3. **단방향 DnD state flow**: `dragOverId` state는 `useColumnDrag` 내부에서만 관리. `table.setColumnOrder()`는 TanStack controlled state를 통해 Grid.tsx `columnOrder` state 업데이트 → 리렌더링. 별도 parallel state 없음 (C-2).

4. **`buildTableOptions.ts` 수정 없음**: `onColumnOrderChange: state.setColumnOrder` 이미 L184에 존재. `enableColumnReorder`는 TanStack option 없음 — Grid.tsx `<th>` draggable 조건만으로 충분.

---

## Section 6. C-17 시각 회귀 체크 (N/A)

**N/A 근거**: `migrationImpact: low` + `affectedUsageFiles: []` (0/23 usages affected) → C-17 시각 회귀 체크 의무 없음.

현재 23개 Grid 사용처(tw-framework-front)는 `enableColumnReorder` prop을 전달하지 않으므로, G-001 변경은 all opt-in — 기존 화면 렌더링 완전 무영향.

---

## Section 7. 구현 파일 목록 (확정 — D3 보정 반영)

> Goals.json `implementFiles` 4개 파일에서 grid-core 2개 파일 추가로 6개 파일로 보정 (D3).

| # | 파일 | 액션 | 사유 |
|---|------|------|------|
| 1 | `packages/grid-features/src/column-drag/useColumnDrag.ts` | NEW | DnD 핵심 hook |
| 2 | `packages/grid-features/src/column-drag/DropIndicator.tsx` | NEW | 시각 인디케이터 컴포넌트 |
| 3 | `packages/grid-features/src/column-drag/types.ts` | NEW | DnD 관련 타입 정의 |
| 4 | `packages/grid-features/src/index.ts` | MODIFY | placeholder → 실제 exports 추가 |
| 5 | `packages/grid-core/src/types.ts` | MODIFY | `GridProps`에 `enableColumnReorder?`, `onColumnOrderChange?` 추가 (D1) |
| 6 | `packages/grid-core/src/Grid.tsx` | MODIFY | `<th>` draggable 속성 + `useColumnDrag` wiring (D2, C-31) |

**Base path**: `D:/project/topvel_project/topvel-grid-monorepo/`

**NEW count**: 3  
**MODIFY count**: 3  
**Total**: 6

---

## Section 8. 파일별 구현 명세

### 8.1 `packages/grid-features/src/column-drag/types.ts` (NEW)

```ts
import type { Table } from '@tanstack/react-table';

/** useColumnDrag hook에 전달하는 props */
export interface UseColumnDragProps<TData> {
  /** TanStack table instance */
  table: Table<TData>;
  /** enableColumnReorder prop 활성 여부 */
  enabled: boolean;
  /** drop 완료 후 콜백 (외부 state 동기화용) */
  onColumnOrderChange?: (order: string[]) => void;
}

/** useColumnDrag hook 반환값 */
export interface UseColumnDragReturn {
  /** header.id → th에 적용할 DnD 핸들러 + draggable 속성 반환 함수 */
  getDragProps: (columnId: string, isPinned: boolean) => DragThProps;
  /** 현재 drop 인디케이터를 표시할 column ID (null=없음) */
  dragOverId: string | null;
}

/** <th>에 spread할 DnD 관련 props */
export interface DragThProps {
  draggable: boolean;
  onDragStart: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
}
```

**Note**: `DragEvent` — 전역 브라우저 타입 (lib.dom.d.ts). 추가 import 불필요.

### 8.2 `packages/grid-features/src/column-drag/useColumnDrag.ts` (NEW)

**중요 (D9/H-02)**: 이 파일 생성 시 `packages/grid-features/src/column-drag/` 서브디렉토리가 신규 생성된다. 상위 `packages/grid-features/src/` 존재 확인 완료 (index.ts 확인).

```ts
import { useState, useCallback } from 'react';
import type { UseColumnDragProps, UseColumnDragReturn, DragThProps } from './types';

const DRAG_COLUMN_ID_KEY = 'text/plain';

export function useColumnDrag<TData>({
  table,
  enabled,
  onColumnOrderChange,
}: UseColumnDragProps<TData>): UseColumnDragReturn {
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const getDragProps = useCallback(
    (columnId: string, isPinned: boolean): DragThProps => {
      // pinned 컬럼은 draggable=false + 모든 이벤트 no-op (AC-004)
      if (!enabled || isPinned) {
        return {
          draggable: false,
          onDragStart: () => {},
          onDragOver: () => {},
          onDragLeave: () => {},
          onDrop: () => {},
        };
      }

      return {
        draggable: true,

        onDragStart: (e: DragEvent) => {
          e.dataTransfer?.setData(DRAG_COLUMN_ID_KEY, columnId);
        },

        onDragOver: (e: DragEvent) => {
          e.preventDefault(); // drop 허용 필수
          // drop target이 pinned면 early return (AC-004)
          const col = table.getColumn(columnId);
          if (col?.getIsPinned() !== false) return;
          setDragOverId(columnId);
        },

        onDragLeave: () => {
          setDragOverId((prev) => (prev === columnId ? null : prev));
        },

        onDrop: (e: DragEvent) => {
          e.preventDefault();
          const sourceId = e.dataTransfer?.getData(DRAG_COLUMN_ID_KEY);
          if (!sourceId || sourceId === columnId) {
            setDragOverId(null);
            return;
          }
          // drop target이 pinned면 early return (AC-004)
          const targetCol = table.getColumn(columnId);
          if (targetCol?.getIsPinned() !== false) {
            setDragOverId(null);
            return;
          }
          // 현재 columnOrder 가져오기 (없으면 leaf column id 순서 fallback)
          const currentOrder: string[] =
            table.getState().columnOrder.length > 0
              ? [...table.getState().columnOrder]
              : table.getAllLeafColumns().map((c) => c.id);

          const sourceIdx = currentOrder.indexOf(sourceId);
          const targetIdx = currentOrder.indexOf(columnId);
          if (sourceIdx === -1 || targetIdx === -1) {
            setDragOverId(null);
            return;
          }

          // source 제거 후 target 위치에 삽입 (AC-002)
          const newOrder = [...currentOrder];
          newOrder.splice(sourceIdx, 1);
          newOrder.splice(targetIdx, 0, sourceId);

          // AC-002: table.setColumnOrder — TanStack v8 표준 API (C-2)
          table.setColumnOrder(newOrder);

          // AC-005: 부모 콜백 호출 (D7: setColumnOrder 이후)
          onColumnOrderChange?.(newOrder);

          setDragOverId(null);
        },
      };
    },
    [enabled, table, onColumnOrderChange],
  );

  return { getDragProps, dragOverId };
}
```

**AC 커버리지**:
- AC-002: `table.setColumnOrder(newOrder)` — TanStack v8 표준 API
- AC-004: `isPinned` 조건 → draggable=false + early return
- AC-005: `onColumnOrderChange?.(newOrder)` — drop 완료 후 콜백
- AC-006: `DragEvent`, `dataTransfer` — HTML5 브라우저 API만 사용

### 8.3 `packages/grid-features/src/column-drag/DropIndicator.tsx` (NEW)

```tsx
import React from 'react';

interface DropIndicatorProps {
  /** 이 컴포넌트가 속한 column의 ID */
  columnId: string;
  /** useColumnDrag에서 반환된 현재 dragOver 중인 column ID */
  dragOverId: string | null;
}

/**
 * 드래그 중 drop 위치 시각 인디케이터.
 * 부모 <th className="relative ..."> 내부에서 절대 위치로 렌더링.
 * AC-003: Tailwind className 만 사용, style={{}} 없음 (C-5).
 */
export function DropIndicator({ columnId, dragOverId }: DropIndicatorProps) {
  if (dragOverId !== columnId) return null;
  return (
    <div
      className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 pointer-events-none"
      aria-hidden="true"
    />
  );
}
```

**AC-003 준수**: Tailwind 클래스만 사용 (`absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500`). `style={{}}` 없음 (C-5).

### 8.4 `packages/grid-features/src/index.ts` (MODIFY)

```ts
// @tomis/grid-features — MOD-GRID-07 G-001: column drag exports
export { useColumnDrag } from './column-drag/useColumnDrag';
export { DropIndicator } from './column-drag/DropIndicator';
export type { UseColumnDragProps, UseColumnDragReturn, DragThProps } from './column-drag/types';
```

**C-23 semver**: package.json version `0.0.0` → `0.1.0` (minor bump — 신규 feature export).

### 8.5 `packages/grid-core/src/types.ts` (MODIFY)

`GridProps<TData>` interface에 다음 props 추가 (기존 `enableColumnPinning` 그룹 근처):

```ts
// G-001 (MOD-GRID-07): 컬럼 드래그 재정렬
/** HTML5 DnD 기반 컬럼 헤더 드래그 재정렬 활성화. falsy 시 draggable 비활성. */
enableColumnReorder?: boolean;
/** 컬럼 순서 변경 완료 콜백 — table.setColumnOrder 호출 직후 invoke. */
onColumnOrderChange?: (order: string[]) => void;
```

**C-29 exactOptionalPropertyTypes 준수**: `undefined` 리터럴 할당 없음 — `?:` 표기만 사용.

### 8.6 `packages/grid-core/src/Grid.tsx` (MODIFY)

섹션 11 (Section 11) Before/After 상세 기술.

---

## Section 9. 타입 정의 명세

### `GridProps<TData>` 추가 props (types.ts)

```ts
enableColumnReorder?: boolean;
onColumnOrderChange?: (order: string[]) => void;
```

### `UseColumnDragProps<TData>` (grid-features/types.ts)

```ts
interface UseColumnDragProps<TData> {
  table: Table<TData>;
  enabled: boolean;
  onColumnOrderChange?: (order: string[]) => void;
}
```

### `UseColumnDragReturn` (grid-features/types.ts)

```ts
interface UseColumnDragReturn {
  getDragProps: (columnId: string, isPinned: boolean) => DragThProps;
  dragOverId: string | null;
}
```

### `DragThProps` (grid-features/types.ts)

```ts
interface DragThProps {
  draggable: boolean;
  onDragStart: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
}
```

**C-29 주의**: `getDragProps` 반환값 `DragThProps`를 `<th>` props에 spread 시, React synthetic event 타입 주의 → Grid.tsx에서 spread 전 `as React.HTMLAttributes<HTMLTableCellElement>` 또는 개별 prop 매핑 필요 (Section 11 Before/After 참조).

---

## Section 10. 엣지 케이스 및 가드 조건

| 시나리오 | 처리 방법 |
|---------|---------|
| `enableColumnReorder=false` (또는 미전달) | `<th draggable={false}>` — 이벤트 핸들러 no-op (useColumnDrag enabled=false 경로) |
| pinned 컬럼 드래그 시도 | `draggable={false}` — 브라우저 DnD 자체 비활성화 |
| pinned 컬럼 위에 drop 시도 | `dragover`/`drop` handler early return (AC-004) |
| source === target (같은 컬럼에 drop) | `onDrop`: `sourceId === columnId` 조건 → 순서 변경 없이 state 리셋 |
| `columnOrder` 빈 배열 (초기 상태) | `table.getAllLeafColumns().map(c => c.id)` fallback — 전체 컬럼 ID 순서 사용 |
| source 또는 target이 columnOrder에 없음 | `indexOf === -1` 조건 → 순서 변경 없이 state 리셋 |
| 가상화(`enableVirtualization=true`) 활성 | header `<th>` drag는 virtualizer와 무관 — row 가상화만 적용됨 (C-18, §L1 §5) |
| `dataTransfer` null (드래그 소스 비정상) | optional chaining `e.dataTransfer?.getData(...)` — null 안전 |
| `onColumnOrderChange` 미전달 | optional chaining `onColumnOrderChange?.(newOrder)` — 무시 |

---

## Section 11. Grid.tsx 통합 명세 (C-31 wiring 의무)

### 11.1 imports 추가 (Grid.tsx 상단)

```tsx
// G-001 (MOD-GRID-07): column drag
import { useColumnDrag, DropIndicator } from '@tomis/grid-features';
```

### 11.2 hook 호출 (Grid.tsx 컴포넌트 함수 내 — Before/After)

**Before** (현재 Grid.tsx 약 L160 근처, hook 섹션):
```tsx
// (useColumnPersistence 호출 후)
// --- G-001 없음 ---
```

**After**:
```tsx
// G-001 (MOD-GRID-07): column drag hook
const { getDragProps, dragOverId } = useColumnDrag({
  table,
  enabled: props.enableColumnReorder === true,
  ...(props.onColumnOrderChange !== undefined
    ? { onColumnOrderChange: props.onColumnOrderChange }
    : {}),
});
```

**C-29 준수**: `onColumnOrderChange`가 `undefined`인 경우 spread-skip 패턴 사용.

### 11.3 `<th>` render block (Before/After — C-31 핵심)

**Before** (현재 Grid.tsx L246-263):
```tsx
return (
  <th
    key={header.id}
    colSpan={header.colSpan}
    className={`relative px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap select-none ${
      canSort ? 'cursor-pointer hover:bg-gray-100' : ''
    } ${pinned.className}`}
    style={combinedStyle}
    onClick={canSort ? onSortClick : undefined}
  >
    <div className="flex items-center gap-1">
      {header.isPlaceholder
        ? null
        : flexRender(header.column.columnDef.header, header.getContext())}
      {canSort && <span className="text-gray-400">{sortGlyph}</span>}
    </div>
    {useResizing && <ResizeHandle header={header} mode={resizeMode} />}
  </th>
);
```

**After** (G-001 통합):
```tsx
// G-001: DnD props 계산 (per-header)
const isPinned = header.column.getIsPinned() !== false;
const dragProps = getDragProps(header.column.id, isPinned);

return (
  <th
    key={header.id}
    colSpan={header.colSpan}
    className={`relative px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap select-none ${
      canSort ? 'cursor-pointer hover:bg-gray-100' : ''
    } ${pinned.className}`}
    style={combinedStyle}
    onClick={canSort ? onSortClick : undefined}
    draggable={dragProps.draggable}
    onDragStart={(e) => dragProps.onDragStart(e.nativeEvent)}
    onDragOver={(e) => dragProps.onDragOver(e.nativeEvent)}
    onDragLeave={(e) => dragProps.onDragLeave(e.nativeEvent)}
    onDrop={(e) => dragProps.onDrop(e.nativeEvent)}
  >
    {/* G-001: drop 위치 인디케이터 (AC-003) */}
    <DropIndicator columnId={header.column.id} dragOverId={dragOverId} />
    <div className="flex items-center gap-1">
      {header.isPlaceholder
        ? null
        : flexRender(header.column.columnDef.header, header.getContext())}
      {canSort && <span className="text-gray-400">{sortGlyph}</span>}
    </div>
    {useResizing && <ResizeHandle header={header} mode={resizeMode} />}
  </th>
);
```

**React synthetic event 주의**: React의 `onDragStart` 등은 `React.DragEvent<HTMLElement>` 타입 → `.nativeEvent`로 `DragEvent` (DOM) 추출 후 hook에 전달. hook의 `DragThProps`는 DOM `DragEvent` 타입 사용.

### 11.4 `buildTableOptions.ts` — 수정 없음 (D8)

`onColumnOrderChange: state.setColumnOrder` (L184) 이미 존재. `enableColumnReorder`는 TanStack TableOptions에 해당 속성 없음 — Grid.tsx `<th>` draggable 조건으로만 제어. buildTableOptions.ts 파일 변경 불필요.

---

## Section 12. 검증 계획 (Verify Stage 입력)

### 12.1 TypeScript 컴파일 (AC-007)
```bash
# grid-core
npx tsc --noEmit -p packages/grid-core/tsconfig.json
# grid-features
npx tsc --noEmit -p packages/grid-features/tsconfig.json
```
**기대**: 0 errors

### 12.2 기능 검증 항목

| 검증 항목 | 방법 | 기대 결과 |
|---------|------|---------|
| `enableColumnReorder=false` 시 draggable | Storybook / DOM inspection | `draggable="false"` on all `<th>` |
| `enableColumnReorder=true` 시 비-pinned 컬럼 | Storybook drag simulation | `draggable="true"` on non-pinned `<th>` |
| pinned 컬럼 draggable | Storybook | `draggable="false"` on pinned `<th>` |
| dragover 시 DropIndicator 표시 | Storybook | `.bg-blue-500` 요소 렌더 |
| dragleave 시 DropIndicator 사라짐 | Storybook | 요소 null |
| drop 시 columnOrder 변경 | Storybook + console | `onColumnOrderChange` 콜백 fired with new order |
| pinned 컬럼 위 drop 무시 | Storybook | columnOrder 변경 없음 |
| `tsc --noEmit` | CI | 0 errors |

### 12.3 Storybook Story (AC-008, C-25)

**파일**: `packages/grid-features/src/column-drag/useColumnDrag.stories.tsx`

```tsx
// 스토리 개요
// - 6컬럼 (이름, 나이, 부서, 직위, 입사일, 상태)
// - enableColumnReorder=true
// - onColumnOrderChange: 콘솔 로그 + args.action
// - 좌측 2컬럼 pinned (enableColumnPinning=true, pin left)
// - 드롭 시나리오: "나이" 컬럼을 "부서" 앞으로 이동
```

Story 1개 (C-25 최소 요구): `ColumnReorder` named export.

---

## Section 13. 번들 영향 분석

| 항목 | 내용 |
|------|------|
| 예상 번들 증가 | +3 KB (useColumnDrag ~1.5 KB + DropIndicator ~0.5 KB + types 0 KB + grid-core MODIFY ~1 KB) |
| 패키지 | `@tomis/grid-features` (C-21: grid-core 무영향 — types.ts/Grid.tsx MODIFY는 기존 패키지 내) |
| tree-shakeable | `useColumnDrag`, `DropIndicator` 각각 named export — 미사용 시 0 KB |
| 외부 dependency 추가 | 없음 (AC-006, C-20) |
| 버전 범프 | `grid-features` `0.0.0` → `0.1.0` (D10, C-23) |

---

## Section N/A 목록

이하 항목은 본 Goal에서 N/A 처리됨 (점수 분모에서 제외):

| 항목 | 근거 |
|------|------|
| A-03 (마이그레이션 리스크) | migrationImpact: low + affectedUsageFiles: 0 → 마이그레이션 리스크 없음 |
| A-04 (C-17 시각 회귀) | migrationImpact: low + affectedUsageFiles: 0 → C-17 의무 미해당 (Section 6) |
| B-05 (SSR 서버 사이드 고려) | tw-framework-front는 Vite CSR — SSR 환경 없음 (localStorage SSR는 G-002 범위) |
| C-05 (성능 가상화 row count) | G-001은 헤더 DnD — 가상화 row 성능 관련 없음 (C-18 호환성만 확인) |
| D-02 (DB 마이그레이션 SQL) | 신규 FE 기능 — DB 변경 없음 |
| D-04 (기존 API 하위호환 breaking) | 신규 prop (opt-in) — breaking 없음, compatibilityPolicy.breaking: false |
| D-05 (deprecation strategy) | 신규 prop — deprecation 없음 |

---

## 이상 기록 (Anomaly Notes)

1. **Goals.json implementFiles 보정 (D3)**: goals.json에 `grid-core/types.ts`, `grid-core/Grid.tsx` 누락. C-31 wiring 의무 이행을 위해 6개 파일로 확장. 이 spec이 canonical implementFiles 정의.

2. **buildTableOptions.ts `onColumnOrderChange` 이미 wiring됨**: L184에 `onColumnOrderChange: state.setColumnOrder` 이미 존재 — G-001이 props.onColumnOrderChange를 위한 추가 wiring은 Grid.tsx에서 직접 처리 (D8).

3. **React synthetic event → DOM event 변환 필요**: hook의 `DragThProps`는 DOM `DragEvent` 사용 — Grid.tsx에서 `e.nativeEvent` 추출 후 전달 (Section 11.3 After 코드 참조).

4. **H-02 신규 서브디렉토리**: `packages/grid-features/src/column-drag/` G-001에서 신규 생성. 상위 디렉토리 존재 확인 완료 (D9).
