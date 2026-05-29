# G-002 Spec: 키보드 범위 확장 — Shift+방향키, 키보드 내비게이션

**Package**: `@tomis/grid-pro-range`  
**Goal ID**: G-002  
**Module**: MOD-GRID-11 (Cell Range Selection)  
**Spec Version**: v1.0.0  
**Date**: 2026-05-14  
**Author**: tw-grid Spec Writer  
**Status**: DRAFT

---

## Section 0: 결정 테이블 (D# Summary)

| D# | 결정 | 사유 | ADR 참조 |
|----|------|------|----------|
| D1 | `implementFiles` 경로: `topvel-grid-monorepo/packages/` 접두사 사용 | goals.json `TOMIS/packages/` 접두사 오류 (C-28). 실제 monorepo root = `topvel-grid-monorepo/` | ADR-MOD-GRID-11-001 |
| D2 | 라이선스 검증: `_verifyGridLicenseStub` inline function 패턴 | `@ts-ignore + declare const` 패턴은 C-4 위반 + 런타임 ReferenceError. inline stub = B-06 compliant | ADR-MOD-GRID-11-002 |
| D3 | `onKeyDown` 이벤트: Grid container `<div>` 에 부착 (tabIndex=0) | 셀 단위 이벤트 분산 대신 컨테이너 위임 패턴. 이벤트 버블링으로 모든 키 이벤트 수신 가능 | — |
| D4 | `useKeyboardNav` API: controlled 패턴 — `{ range, onRangeChange }` 수신 | `useCellRange.ts` 미수정 원칙. `UseCellRangeReturn`에 `setRange` 추가 불필요. 두 훅 독립 레이어 유지 | ADR-MOD-GRID-11-003 |
| D5 | 그리드 경계(rowCount, colCount): TanStack `table.getRowModel()` + `table.getAllColumns()` 에서 파생 | 외부 prop 최소화. TanStack 인스턴스가 유일한 출처 | — |
| D6 | Storybook story 파일: `useKeyboardNav.stories.tsx` Section 7 필수 포함 | AC-008 binding AC (E-01 v1.0.6 규칙) | ADR-MOD-GRID-11-005 |

**D# 파일 수 breakdown**: NEW 2 + MODIFY 2 = **4 files 합계**.  
NEW: `useKeyboardNav.ts`, `useKeyboardNav.stories.tsx`.  
MODIFY: `types.ts`, `index.ts`.

---

## Section 1: 목표 개요

### 1.1 Goal 기본 정보

| 항목 | 값 |
|------|-----|
| Goal ID | G-002 |
| 제목 | 키보드 범위 확장 — Shift+방향키, 키보드 내비게이션 |
| Package | `@tomis/grid-pro-range` |
| Tier | Pro (EULA 라이선스) |
| migrationImpact | **medium** |
| Depends On | G-001 (CellRange 모델 + 마우스 선택) |
| Blocks | G-003 (Drag-fill), G-004 (Clipboard) |

### 1.2 Goal 설명

G-001에서 구현된 마우스 드래그/Shift+Click 기반 셀 범위 선택에 **키보드 내비게이션 레이어**를 추가한다.

키보드로 현재 셀을 이동하고 (Arrow/Tab/Enter), Shift+방향키로 선택 범위를 확장하며, Ctrl+방향키로 데이터 경계(채워진 셀의 끝)로 이동하는 기능을 `useKeyboardNav` 훅으로 제공한다.

G-001의 `useCellRange`는 수정하지 않는다 (D4). `useKeyboardNav`는 `useCellRange`가 반환하는 `{ range, onRangeChange }` 콜백을 수신해 range를 확장하는 controlled 패턴으로 동작한다.

### 1.3 참조 출처

- AG Grid Range Selection API shape: `references/ag-grid-feature-matrix.md L34` (C-7: 패턴 참조만. import 금지)
- Wijmo 키보드 단축키 패턴: `references/publish-wijmo-analysis.md §4` (C-16: import 금지)
- ADR-MOD-GRID-11-006 Pattern Catalog: `normalize-on-extend` + `anchor 유지` 패턴 G-002 직접 재사용

---

## Section 2: Acceptance Criteria

| AC# | 설명 | 소스 |
|-----|------|------|
| AC-001 | `useKeyboardNav` 훅은 TypeScript strict 모드(`exactOptionalPropertyTypes` 포함)에서 타입 에러 없이 컴파일된다. `@ts-ignore`, `as any`, `<any>` 금지. | C-4 |
| AC-002 | Arrow 키(↑↓←→) 입력 시 `activeCell`이 1칸씩 이동한다. 경계 도달 시 이동 없음(clamp). | L1 (goals.json) |
| AC-003 | Shift+Arrow 키 입력 시 range의 `start`(anchor)는 고정되고 `end`(cursor)가 방향에 따라 확장/축소된다. normalizeRange 적용으로 start ≤ end 보장. | L1 (goals.json) |
| AC-004 | `useKeyboardNav`는 `useCellRange`와 독립적으로 동작한다. `useCellRange.ts`를 수정하지 않는다. | C-2 |
| AC-005 | Tab 키: 오른쪽으로 이동. 마지막 열 도달 시 다음 행 첫 번째 열로 wrap. Shift+Tab: 역방향. | C-18 |
| AC-006 | Enter 키: 아래로 이동. 마지막 행 도달 시 다음 열 첫 번째 행으로 wrap (선택적). | C-18 |
| AC-007 | Ctrl+Arrow: 해당 방향으로 연속 채워진 셀의 끝(data-edge)으로 이동. 빈 셀 만나면 정지. | C-12 |
| AC-008 | `useKeyboardNav.stories.tsx` Storybook story 1개 이상 제공 (Default + KeyboardNav 시나리오). | C-25 |

---

## Section 3: 설계 세부사항

### 3.1 훅 시그니처

```typescript
// topvel-grid-monorepo/packages/grid-pro-range/src/useKeyboardNav.ts

import type { Table } from '@tanstack/react-table';
import type { CellCoord, CellRange } from './types';

export interface UseKeyboardNavOptions<TData> {
  /** TanStack table 인스턴스 (경계 계산용 — D5). */
  table: Table<TData>;
  /** 현재 활성 셀 좌표 (controlled). */
  activeCell: CellCoord | null;
  /** 활성 셀 변경 콜백. */
  onActiveCellChange: (cell: CellCoord) => void;
  /** 현재 선택 범위 (useCellRange에서 수신 — D4 controlled). */
  range: CellRange | null;
  /** 범위 변경 콜백 (useCellRange의 onRangeChange와 동일 시그니처 — D4). */
  onRangeChange: (range: CellRange | null) => void;
  /** Ctrl+Arrow data-edge 탐색 함수 (선택적). */
  getCellValue?: (row: number, col: number) => unknown;
}

export interface UseKeyboardNavReturn {
  /** Grid container에 부착할 keydown 핸들러 (D3). */
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

export function useKeyboardNav<TData>(
  options: UseKeyboardNavOptions<TData>,
): UseKeyboardNavReturn;
```

### 3.2 CellRange Pattern Catalog 적용 (ADR-MOD-GRID-11-006)

G-002에서 직접 재사용되는 패턴:

| 패턴 | 적용 위치 |
|------|----------|
| **normalize-on-extend** | Shift+Arrow 시 `normalizeRange({ start: anchor, end: cursor })` 호출 |
| **anchor 유지 (Shift+Click ↔ Shift+Arrow 일관성)** | `dragStart` ref 대신 `anchorCell` ref 사용. anchor는 첫 Arrow 키 입력 시 세팅, Shift 해제까지 유지 |
| **2D isInRange 체크** | `handleKeyDown` 내부 범위 포함 여부 확인 (선택적 활용) |

### 3.3 키 입력 처리 매트릭스 (C-30 Truth Table)

| 키 조합 | shiftKey | ctrlKey | activeCell 변화 | range 변화 |
|---------|----------|---------|----------------|-----------|
| Arrow (↑↓←→) | false | false | ±1 (clamp) | null (선택 해제) |
| Shift+Arrow | true | false | 변화 없음 (anchor 고정) | end 이동, normalizeRange |
| Ctrl+Arrow | false | true | data-edge 좌표로 이동 | null (선택 해제) |
| Ctrl+Shift+Arrow | true | true | 변화 없음 (anchor 고정) | data-edge까지 확장, normalizeRange |
| Tab | false | — | +1 col (wrap 허용) | null |
| Shift+Tab | true | — | -1 col (wrap 허용) | null |
| Enter | false | — | +1 row (wrap 선택적) | null |
| 기타 | — | — | 변화 없음 | 변화 없음 |

### 3.4 경계 계산 (D5)

```typescript
// TanStack table 인스턴스에서 경계 파생
const rowCount = table.getRowModel().rows.length;
const colCount = table.getAllColumns().filter(c => c.getIsVisible()).length;
```

경계 초과 시 clamp:
- `Math.max(0, Math.min(row, rowCount - 1))`
- `Math.max(0, Math.min(col, colCount - 1))`

### 3.5 Ctrl+Arrow data-edge 알고리즘

```typescript
function findDataEdge(
  start: CellCoord,
  direction: 'up' | 'down' | 'left' | 'right',
  rowCount: number,
  colCount: number,
  getCellValue?: (row: number, col: number) => unknown,
): CellCoord {
  if (!getCellValue) {
    // getCellValue 미제공 시 경계로 이동
    switch (direction) {
      case 'up':    return { row: 0, col: start.col };
      case 'down':  return { row: rowCount - 1, col: start.col };
      case 'left':  return { row: start.row, col: 0 };
      case 'right': return { row: start.row, col: colCount - 1 };
    }
  }
  // getCellValue 제공 시 첫 번째 빈 셀 직전까지 탐색
  let { row, col } = start;
  // ... step logic
  return { row, col };
}
```

---

## Section 4: 인터페이스 계약

### 4.1 입력 Props

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `table` | `Table<TData>` | ✓ | TanStack table 인스턴스 (경계 계산) |
| `activeCell` | `CellCoord \| null` | ✓ | 현재 포커스 셀 (controlled) |
| `onActiveCellChange` | `(cell: CellCoord) => void` | ✓ | 활성 셀 변경 콜백 |
| `range` | `CellRange \| null` | ✓ | 현재 선택 범위 (useCellRange 연동) |
| `onRangeChange` | `(range: CellRange \| null) => void` | ✓ | 범위 변경 콜백 |
| `getCellValue` | `(row: number, col: number) => unknown` | ✗ | Ctrl+Arrow data-edge 탐색용 |

### 4.2 반환값

| 키 | 타입 | 설명 |
|----|------|------|
| `handleKeyDown` | `(e: React.KeyboardEvent) => void` | Grid container `<div tabIndex={0}>` 에 부착 (D3) |

### 4.3 사용 예시

```typescript
// Grid container 컴포넌트 내부
const [activeCell, setActiveCell] = useState<CellCoord | null>(null);
const { range, handleMouseDown, handleMouseEnter, handleMouseUp, onRangeChange } =
  useCellRange((r) => console.log('range:', r));

const { handleKeyDown } = useKeyboardNav({
  table,
  activeCell,
  onActiveCellChange: setActiveCell,
  range,
  onRangeChange,
});

return (
  <div
    tabIndex={0}
    onKeyDown={handleKeyDown}
    onMouseUp={handleMouseUp}
    style={{ outline: 'none' }}
  >
    {/* TanStack 테이블 렌더링 */}
  </div>
);
```

> **C-29 주의**: `UseKeyboardNavOptions`의 optional prop(`getCellValue`)을 spread 전달 시 `exactOptionalPropertyTypes` 위반 방지를 위해 undefined 명시 패턴 사용:
> ```typescript
> // ❌ 잘못된 예 — exactOptionalPropertyTypes 위반 가능
> const opts = { table, activeCell, onActiveCellChange, range, onRangeChange };
> useKeyboardNav(opts); // getCellValue 속성 자체가 없으면 OK, 있으면 undefined 불가
>
> // ✅ 올바른 예 — 조건부 spread 패턴
> const opts: UseKeyboardNavOptions<TData> = {
>   table, activeCell, onActiveCellChange, range, onRangeChange,
>   ...(getCellValue !== undefined && { getCellValue }),
> };
> ```

---

## Section 5: 의존성 및 영향 범위

### 5.1 직접 의존성

| 패키지 | 버전 요건 | 용도 |
|--------|----------|------|
| `react` | ^18.0.0 | `useCallback`, `useRef`, `KeyboardEvent` |
| `@tanstack/react-table` | ^8.0.0 | `Table<TData>` 타입, 경계 계산 |

### 5.2 내부 의존성 (G-001 산출물)

| 파일 | 의존 항목 |
|------|----------|
| `./types` | `CellCoord`, `CellRange` |
| `./internal/normalize` | `normalizeRange` (normalize-on-extend 패턴) |

### 5.3 migrationImpact 분석

**migrationImpact = medium** (goals.json L135 권위 값)

- `affectedUsageFiles = []` (goals.json 원문) — 현재 마이그레이션 파일 직접 영향 없음
- Visual Regression: **N/A** (affectedUsageFiles 0건이므로 스크린샷 비교 대상 없음)
- 그러나 향후 `RangeSelectGrid.tsx`가 `useKeyboardNav`를 통합할 때 L0 컴포넌트 변경 발생 예정 (G-006 scope)

### 5.4 C-16 / C-7 준수 확인

- Wijmo import: **0건** (import 금지, 패턴 shape만 참조)
- AG Grid import: **0건** (import 금지, 패턴 shape만 참조)
- 참조 출처: `references/publish-wijmo-analysis.md §4`, `references/ag-grid-feature-matrix.md L34`

---

## Section 6: 구현 가이드라인

### 6.1 파일 구조

```
topvel-grid-monorepo/packages/grid-pro-range/src/
├── useKeyboardNav.ts          ← NEW (G-002 핵심)
├── useKeyboardNav.stories.tsx ← NEW (AC-008, Storybook)
├── types.ts                   ← MODIFY (UseKeyboardNavOptions, UseKeyboardNavReturn export 추가)
└── index.ts                   ← MODIFY (useKeyboardNav, UseKeyboardNavOptions, UseKeyboardNavReturn re-export)
```

### 6.2 `useKeyboardNav.ts` 구현 템플릿

```typescript
/**
 * @tomis/grid-pro-range — useKeyboardNav 훅 (AC-002~AC-007).
 *
 * 키보드 내비게이션 + Shift+방향키 범위 확장 headless React 훅.
 *
 * D2: _verifyGridLicenseStub — inline fallback stub 패턴 (B-06 compliant).
 * D4: controlled 패턴 — useCellRange 미수정, { range, onRangeChange } 수신.
 * D3: handleKeyDown → Grid container <div tabIndex={0}> 부착.
 * ADR-MOD-GRID-11-006: normalize-on-extend + anchor 유지 패턴 재사용.
 */
import { useCallback, useEffect, useRef } from 'react';
import type { Table } from '@tanstack/react-table';

import type { CellCoord, CellRange } from './types';
import { normalizeRange } from './internal/normalize';

/**
 * D2 Option A: inline license verification stub.
 * MOD-GRID-99-A/G-002 완료 후 실제 grid-license import로 교체:
 *   import { verifyGridLicense } from '@tomis/grid-license';
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _verifyGridLicenseStub(_packageName: string): void {
  /* MOD-GRID-99-A/G-002가 signature/expiry/domain 검증을 구현 예정. */
}

export interface UseKeyboardNavOptions<TData> {
  table: Table<TData>;
  activeCell: CellCoord | null;
  onActiveCellChange: (cell: CellCoord) => void;
  range: CellRange | null;
  onRangeChange: (range: CellRange | null) => void;
  getCellValue?: (row: number, col: number) => unknown;
}

export interface UseKeyboardNavReturn {
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

export function useKeyboardNav<TData>(
  options: UseKeyboardNavOptions<TData>,
): UseKeyboardNavReturn {
  const { table, activeCell, onActiveCellChange, range, onRangeChange, getCellValue } = options;

  // anchor ref: Shift+Arrow 시 start 고정 (ADR-MOD-GRID-11-006 anchor 유지 패턴)
  const anchorCellRef = useRef<CellCoord | null>(null);

  // D2: 라이선스 검증 stub (no-op until MOD-GRID-99-A)
  useEffect(() => {
    _verifyGridLicenseStub('@tomis/grid-pro-range');
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const rowCount = table.getRowModel().rows.length;
      const colCount = table.getAllColumns().filter((c) => c.getIsVisible()).length;

      if (rowCount === 0 || colCount === 0) return;

      const current = activeCell ?? { row: 0, col: 0 };

      const clampRow = (r: number) => Math.max(0, Math.min(r, rowCount - 1));
      const clampCol = (c: number) => Math.max(0, Math.min(c, colCount - 1));

      const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
      const isTab = e.key === 'Tab';
      const isEnter = e.key === 'Enter';

      if (!isArrow && !isTab && !isEnter) return;

      e.preventDefault();

      if (isArrow) {
        const delta: Record<string, CellCoord> = {
          ArrowUp:    { row: -1, col: 0 },
          ArrowDown:  { row: 1,  col: 0 },
          ArrowLeft:  { row: 0,  col: -1 },
          ArrowRight: { row: 0,  col: 1 },
        };
        const d = delta[e.key];

        if (e.shiftKey) {
          // anchor 유지 패턴: 첫 Shift+Arrow 시 anchor 세팅
          if (!anchorCellRef.current) {
            anchorCellRef.current = range?.start ?? current;
          }
          const anchor = anchorCellRef.current;

          // cursor = range.end (또는 activeCell) 이동
          const cursor = range?.end ?? current;
          let nextCursor: CellCoord;

          if (e.ctrlKey) {
            // Ctrl+Shift+Arrow: data-edge까지 확장
            nextCursor = findDataEdge(cursor, e.key, rowCount, colCount, getCellValue);
          } else {
            nextCursor = {
              row: clampRow(cursor.row + d.row),
              col: clampCol(cursor.col + d.col),
            };
          }

          // normalize-on-extend 패턴 (ADR-MOD-GRID-11-006)
          const newRange = normalizeRange({ start: anchor, end: nextCursor });
          onRangeChange(newRange);
          // activeCell은 cursor 위치 추적
          onActiveCellChange(nextCursor);
        } else {
          // 일반 Arrow: anchor 초기화, 범위 해제
          anchorCellRef.current = null;
          onRangeChange(null);

          if (e.ctrlKey) {
            // Ctrl+Arrow: data-edge 이동
            const next = findDataEdge(current, e.key, rowCount, colCount, getCellValue);
            onActiveCellChange(next);
          } else {
            onActiveCellChange({
              row: clampRow(current.row + d.row),
              col: clampCol(current.col + d.col),
            });
          }
        }
      } else if (isTab) {
        anchorCellRef.current = null;
        onRangeChange(null);

        if (e.shiftKey) {
          // Shift+Tab: 역방향 (AC-005)
          if (current.col > 0) {
            onActiveCellChange({ row: current.row, col: current.col - 1 });
          } else if (current.row > 0) {
            onActiveCellChange({ row: current.row - 1, col: colCount - 1 });
          }
        } else {
          // Tab: wrap (AC-005)
          if (current.col < colCount - 1) {
            onActiveCellChange({ row: current.row, col: current.col + 1 });
          } else if (current.row < rowCount - 1) {
            onActiveCellChange({ row: current.row + 1, col: 0 });
          }
        }
      } else if (isEnter) {
        anchorCellRef.current = null;
        onRangeChange(null);
        // Enter: 아래로 이동 (AC-006)
        if (current.row < rowCount - 1) {
          onActiveCellChange({ row: current.row + 1, col: current.col });
        }
      }
    },
    [table, activeCell, onActiveCellChange, range, onRangeChange, getCellValue],
  );

  return { handleKeyDown };
}

/** Ctrl+Arrow data-edge 탐색 (AC-007). */
function findDataEdge(
  start: CellCoord,
  key: string,
  rowCount: number,
  colCount: number,
  getCellValue?: (row: number, col: number) => unknown,
): CellCoord {
  if (!getCellValue) {
    // getCellValue 미제공: 경계로 이동
    switch (key) {
      case 'ArrowUp':    return { row: 0,            col: start.col };
      case 'ArrowDown':  return { row: rowCount - 1, col: start.col };
      case 'ArrowLeft':  return { row: start.row,    col: 0 };
      case 'ArrowRight': return { row: start.row,    col: colCount - 1 };
    }
  }
  let { row, col } = start;
  let dRow = 0, dCol = 0;
  switch (key) {
    case 'ArrowUp':    dRow = -1; break;
    case 'ArrowDown':  dRow =  1; break;
    case 'ArrowLeft':  dCol = -1; break;
    case 'ArrowRight': dCol =  1; break;
  }
  while (
    row + dRow >= 0 && row + dRow < rowCount &&
    col + dCol >= 0 && col + dCol < colCount &&
    getCellValue(row + dRow, col + dCol) !== undefined &&
    getCellValue(row + dRow, col + dCol) !== null &&
    getCellValue(row + dRow, col + dCol) !== ''
  ) {
    row += dRow;
    col += dCol;
  }
  return { row, col };
}
```

### 6.3 `useKeyboardNav.stories.tsx` 구현 템플릿

```typescript
/**
 * @tomis/grid-pro-range — useKeyboardNav Storybook 스토리 (AC-008).
 */
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';

import { useKeyboardNav } from './useKeyboardNav';
import { useCellRange } from './useCellRange';
import type { CellCoord, CellRange } from './types';

// ─── 샘플 데이터 ───────────────────────────────────────────────────────────────
interface Row {
  id: string;
  name: string;
  value: number;
  status: string;
}

const DATA: Row[] = Array.from({ length: 10 }, (_, i) => ({
  id: String(i + 1),
  name: `Item ${i + 1}`,
  value: (i + 1) * 100,
  status: i % 2 === 0 ? 'active' : 'inactive',
}));

const columnHelper = createColumnHelper<Row>();
const COLUMNS = [
  columnHelper.accessor('id',     { header: 'ID' }),
  columnHelper.accessor('name',   { header: 'Name' }),
  columnHelper.accessor('value',  { header: 'Value' }),
  columnHelper.accessor('status', { header: 'Status' }),
];

// ─── 데모 컴포넌트 ─────────────────────────────────────────────────────────────
function KeyboardNavDemo() {
  const [activeCell, setActiveCell] = useState<CellCoord | null>({ row: 0, col: 0 });
  const [rangeState, setRangeState] = useState<CellRange | null>(null);

  const table = useReactTable({
    data: DATA,
    columns: COLUMNS,
    getCoreRowModel: getCoreRowModel(),
  });

  const { range, handleMouseDown, handleMouseEnter, handleMouseUp } = useCellRange(setRangeState);
  const { handleKeyDown } = useKeyboardNav({
    table,
    activeCell,
    onActiveCellChange: setActiveCell,
    range: rangeState,
    onRangeChange: setRangeState,
  });

  const rows = table.getRowModel().rows;
  const headers = table.getFlatHeaders();

  return (
    <div style={{ fontFamily: 'monospace', padding: 16 }}>
      <p style={{ marginBottom: 8, color: '#666' }}>
        클릭 후 Arrow / Shift+Arrow / Ctrl+Arrow / Tab / Enter 키를 사용하세요.
      </p>
      <div
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseUp={handleMouseUp}
        style={{ outline: 'none', display: 'inline-block', border: '1px solid #ccc' }}
      >
        <table style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {headers.map((header) => (
                <th
                  key={header.id}
                  style={{ padding: '4px 8px', border: '1px solid #ddd', background: '#f5f5f5' }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) =>
              row.getVisibleCells().map((cell, colIdx) => {
                const isActive =
                  activeCell?.row === rowIdx && activeCell?.col === colIdx;
                const inRange =
                  range !== null &&
                  rowIdx >= range.start.row && rowIdx <= range.end.row &&
                  colIdx >= range.start.col && colIdx <= range.end.col;
                return (
                  <td
                    key={cell.id}
                    onMouseDown={(e) => handleMouseDown(rowIdx, colIdx, e.shiftKey)}
                    onMouseEnter={() => handleMouseEnter(rowIdx, colIdx)}
                    onClick={() => setActiveCell({ row: rowIdx, col: colIdx })}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #ddd',
                      background: inRange ? '#dbeafe' : 'white',
                      outline: isActive ? '2px solid #3b82f6' : 'none',
                      outlineOffset: '-2px',
                      cursor: 'cell',
                      userSelect: 'none',
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                );
              }),
            )}
          </tbody>
        </table>
      </div>
      <pre style={{ marginTop: 12, fontSize: 12, color: '#555' }}>
        activeCell: {JSON.stringify(activeCell)}{'\n'}
        range: {JSON.stringify(range)}
      </pre>
    </div>
  );
}

// ─── Meta ──────────────────────────────────────────────────────────────────────
const meta: Meta = {
  title: 'grid-pro-range/useKeyboardNav',
  component: KeyboardNavDemo,
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ShiftArrowRange: Story = {
  name: 'Shift+Arrow Range Extension',
  render: () => <KeyboardNavDemo />,
};

export const LargeDataset: Story = {
  name: 'Large Dataset (50 rows)',
  render: () => {
    const largeData: Row[] = Array.from({ length: 50 }, (_, i) => ({
      id: String(i + 1),
      name: `Row ${i + 1}`,
      value: (i + 1) * 10,
      status: i % 3 === 0 ? 'active' : 'inactive',
    }));
    // KeyboardNavDemo를 데이터만 교체하는 간단 래퍼
    // (Storybook 데코레이터 패턴 생략 — stub)
    return <div style={{ opacity: 0.5 }}>LargeDataset story placeholder — {largeData.length} rows</div>;
  },
};
```

### 6.4 `types.ts` 수정 가이드

```typescript
// MODIFY: UseKeyboardNavOptions, UseKeyboardNavReturn 타입을 types.ts에서
// re-export 하지 않고 useKeyboardNav.ts에서 직접 export 한다.
// types.ts는 CellCoord, CellRange, RangeSelectGridProps 세 타입만 유지.
// (추가 변경 없음 — Section 7 MODIFY 표시는 index.ts re-export 추가 때문)
```

> **Note**: `types.ts`의 MODIFY는 index.ts에서 새 훅 타입을 re-export 하기 위한 경로 확인 목적이다. `UseKeyboardNavOptions`, `UseKeyboardNavReturn`은 `useKeyboardNav.ts`에서 직접 정의 및 export 한다. `types.ts` 자체 내용 변경은 최소화한다.

### 6.5 `index.ts` 수정 가이드

```typescript
// MODIFY: 기존 export에 아래 3개 추가
export { useKeyboardNav } from './useKeyboardNav';
export type { UseKeyboardNavOptions, UseKeyboardNavReturn } from './useKeyboardNav';
```

---

## Section 7: 구현 파일 목록

**D# Breakdown**: NEW 2 + MODIFY 2 = **4 files 합계**  
NEW: `useKeyboardNav.ts`, `useKeyboardNav.stories.tsx`  
MODIFY: `types.ts`, `index.ts`

| # | 경로 (C-28 수정 적용) | 상태 | 설명 |
|---|----------------------|------|------|
| 1 | `topvel-grid-monorepo/packages/grid-pro-range/src/useKeyboardNav.ts` | **NEW** | 키보드 내비게이션 훅 (AC-002~AC-007) |
| 2 | `topvel-grid-monorepo/packages/grid-pro-range/src/useKeyboardNav.stories.tsx` | **NEW** | Storybook 스토리 (AC-008) |
| 3 | `topvel-grid-monorepo/packages/grid-pro-range/src/types.ts` | **MODIFY** | 타입 확인 (신규 export 검토) |
| 4 | `topvel-grid-monorepo/packages/grid-pro-range/src/index.ts` | **MODIFY** | `useKeyboardNav` re-export 추가 |

---

## Section 8: 비기능 요건

### 8.1 성능

- `handleKeyDown` 콜백: `useCallback` 의존성 배열 최소화 (table 인스턴스는 stable ref)
- Ctrl+Arrow 탐색: 최악 O(n) 순회. rowCount/colCount ≤ 10,000 기준 단일 keydown 이벤트 내 완료 예상

### 8.2 접근성 (a11y)

- Grid container `<div tabIndex={0}>`: 키보드 포커스 수신 필수
- `aria-activedescendant`: 현재 구현 scope 밖 (G-006 통합 시 추가 검토)
- `role="grid"` + `role="row"` + `role="gridcell"`: L0 마이그레이션 또는 G-006 통합 시 추가 검토

### 8.3 테스트

- Jest + Testing Library로 키 이벤트 시뮬레이션 테스트 권장
- `fireEvent.keyDown(container, { key: 'ArrowDown' })` 패턴
- 경계 clamp, Shift+Arrow normalize, Tab wrap 시나리오 필수 커버

### 8.4 마이그레이션 영향

- **migrationImpact = medium** (goals.json L135 권위 값)
- `affectedUsageFiles = []`: 현재 마이그레이션 파일 직접 영향 없음
- Visual Regression: **N/A** (affectedUsageFiles 0건)
- 향후 `TOMIS/tw-framework-front/src/components/tomis/Grid/RangeSelectGrid.tsx`에서 `useKeyboardNav` 통합 예정 (G-006 scope, 별도 migrationImpact 평가)

---

## Section 9: 위험 및 완화

| 위험 | 가능성 | 영향 | 완화 |
|------|--------|------|------|
| `useCellRange`와 `anchorCellRef` 상태 desync | 중 | 중 | `range` prop이 null이 되면 `anchorCellRef.current = null` 리셋 |
| `table.getAllColumns()` 숨겨진 열 포함 | 중 | 중 | `.filter(c => c.getIsVisible())` 필터링 필수 |
| Storybook peerDependency 누락 | 낮 | 낮 | `@storybook/react` peerDependency 선언 (package.json) |
| `getCellValue` prop이 stale closure 반환 | 중 | 낮 | useCallback 의존성에 포함하거나 ref로 최신값 유지 권고 |
| Tab 키 기본동작(포커스 이동) 방해 | 높 | 낮 | `e.preventDefault()` 호출. Grid container tabIndex=0으로 포커스 유지 |

---

## Section 10: 테스트 시나리오

### 10.1 단위 테스트 (Jest)

| 시나리오 | 입력 | 기대 출력 |
|---------|------|---------|
| ArrowDown: 일반 이동 | activeCell={row:0,col:0}, key=ArrowDown | activeCell={row:1,col:0}, range=null |
| ArrowDown: 경계 clamp | activeCell={row:9,col:0} (rowCount=10), key=ArrowDown | activeCell={row:9,col:0} (변화 없음) |
| Shift+ArrowRight: 범위 확장 | activeCell={row:2,col:2}, key=ArrowRight+shift | range={start:{row:2,col:2},end:{row:2,col:3}} |
| Shift+ArrowLeft: 범위 축소 (normalize) | range={start:{row:2,col:1},end:{row:2,col:3}}, cursor at end, key=ArrowLeft+shift | range={start:{row:2,col:1},end:{row:2,col:2}} |
| Tab: wrap | activeCell={row:1,col:3} (colCount=4), key=Tab | activeCell={row:2,col:0} |
| Shift+Tab: 역방향 첫 열 | activeCell={row:1,col:0}, key=Tab+shift | activeCell={row:0,col:3} |
| Enter: 아래 이동 | activeCell={row:3,col:1}, key=Enter | activeCell={row:4,col:1} |
| Ctrl+ArrowRight: getCellValue 미제공 | activeCell={row:0,col:0}, key=ArrowRight+ctrl, colCount=4 | activeCell={row:0,col:3} |

### 10.2 통합 테스트 (Storybook)

- `Default` story: 모든 키 입력 수동 검증
- `ShiftArrowRange` story: 범위 확장 시각적 확인

---

## Section 11: 후속 Goal 연계

| Goal | 연계 사항 |
|------|---------|
| G-003 (Drag-fill) | `anchorCellRef` 패턴 재사용 가능. `useKeyboardNav`와 충돌 없음 (독립 훅) |
| G-004 (Clipboard) | `range` 상태 공유 패턴 동일. `onRangeChange` 콜백 체인 가능 |
| G-005 (Delete) | `range` 기반 셀 삭제. `isInRange` 유틸 재사용 |
| G-006 (통합) | `RangeSelectGrid.tsx`에 `useKeyboardNav` 통합. `handleKeyDown` Grid container 부착 |

---

## Section 12: 검토 체크리스트 (Spec Writer Self-Review)

| 항목 | 확인 |
|------|------|
| B-06: `@ts-ignore` 0건 | ✅ |
| B-06: `as any` 0건 | ✅ |
| B-06: `<any>` 0건 | ✅ |
| B-06: 실제 export 없는 `declare const` 0건 | ✅ |
| C-28: `topvel-grid-monorepo/packages/` 접두사 | ✅ |
| C-29: `exactOptionalPropertyTypes` 준수 (spread-skip 패턴 설명) | ✅ |
| C-30: Truth Table 포함 (Section 3.3) | ✅ |
| C-32: `migrationImpact = "medium"` (goals.json L135 일치) | ✅ |
| D# breakdown: Section 0 + Section 7 일치 (NEW 2 + MODIFY 2 = 4) | ✅ |
| E-01: Storybook story Section 7 포함 | ✅ |
| ADR-MOD-GRID-11-006: normalize-on-extend + anchor 유지 패턴 명시 | ✅ |
| ADR-MOD-GRID-11-002: _verifyGridLicenseStub 패턴 (B-06 compliant) | ✅ |
| AC-001~AC-008 8개 전체 포함 (소스 태그 포함) | ✅ |
| migrationImpact visual regression N/A 명시 (affectedUsageFiles=0) | ✅ |
| C-16/C-7: Wijmo/AG Grid import 금지 명시 | ✅ |

---

## Section 13: 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|---------|
| v1.0.0 | 2026-05-14 | 최초 작성 |

---

*Spec format: tw-grid harness v1.0.6 | rubric: specify-rubric v1.0.6 | generated: 2026-05-14*  
*ADR 참조: ADR-MOD-GRID-11-001 (C-28), ADR-MOD-GRID-11-002 (D2 license), ADR-MOD-GRID-11-003 (D4 controlled), ADR-MOD-GRID-11-005 (D6 Storybook), ADR-MOD-GRID-11-006 (Pattern Catalog)*
