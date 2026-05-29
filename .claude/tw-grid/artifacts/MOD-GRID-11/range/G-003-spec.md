# G-003 Spec: Drag-fill — 우하단 핸들 드래그로 Excel 스타일 패턴 채우기

**Package**: `@tomis/grid-pro-range`  
**Goal ID**: G-003  
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
| D3 | MOD-GRID-10 의존 분리: `onFillComplete(cells: CellUpdate[]) => void` callback 제공 | MOD-GRID-10/G-001 pending. callback interface로 caller에게 위임. G-006 capstone에서 전체 통합. 트레이드오프: (1) 유연성: caller가 updateRow 직접 호출 가능; (2) 책임 분리: 채우기 로직과 데이터 레이어 분리 | ADR-MOD-GRID-11-003 |
| D4 | Drag state: `isDraggingRef` + `dragStartRef` + `fillTargetRef` 3개 ref 사용 | mousedown/move/up 시퀀스에서 closure 갱신 없이 안정적 drag 상태 추적 (ADR-MOD-GRID-11-006 mousedown/move/up 패턴). useState 미사용 — re-render 최소화 | ADR-MOD-GRID-11-006 |
| D5 | fillRange 방향: `FillDirection = 'up' \| 'down' \| 'left' \| 'right'` 4방향 지원 | Excel 호환 (상하좌우 채우기). source range → 드래그 방향으로 확장 fill | — |
| D6 | Storybook story 파일: `DragFillHandle.stories.tsx` Section 7 필수 포함 | AC-007 binding AC (E-01 v1.0.6 규칙) | ADR-MOD-GRID-11-005 |

**D# 파일 수 breakdown**: NEW 3 + MODIFY 2 = **5 files 합계**.  
NEW: `DragFillHandle.tsx`, `internal/fillRange.ts`, `DragFillHandle.stories.tsx`.  
MODIFY: `types.ts`, `index.ts`.

---

## Section 1: 목표 개요

### 1.1 Goal 기본 정보

| 항목 | 값 |
|------|-----|
| Goal ID | G-003 |
| 제목 | Drag-fill — 우하단 핸들 드래그로 Excel 스타일 패턴 채우기 |
| Package | `@tomis/grid-pro-range` |
| Tier | Pro (EULA 라이선스) |
| migrationImpact | **medium** (goals.json L193 권위 값) |
| Depends On | G-001 (CellRange 모델 + 마우스 선택), MOD-GRID-99-A/G-001 (라이선스) |
| Blocks | G-004 (Clipboard), G-006 (RangeSelectGrid 통합 capstone) |

### 1.2 Goal 설명

G-001에서 구현된 셀 범위 선택 위에 **Excel 스타일 drag-fill 기능**을 추가한다.

선택된 셀 범위의 우하단에 파란 핸들(2×2 px 정사각형)을 렌더링하고, 핸들을 마우스로 드래그하면 소스 범위의 값을 대상 셀로 채운다. 숫자 시리즈(등차수열)는 패턴을 감지해 연장하고, 그 외 값은 그대로 복사한다.

채우기 완료 후 `onFillComplete(cells: CellUpdate[])` 콜백을 호출해 데이터 레이어 업데이트를 caller에게 위임한다 (D3). `DragFillHandle` React 컴포넌트와 `fillRange` 순수 함수 + `detectSeriesStep` 유틸리티를 제공한다.

### 1.3 참조 출처

- **L0 (사용처)**: N/A — `affectedUsageFiles: []` (goals.json 원문)
- **L1 (goals.json)**: `D:\project\topvel_project\TOMIS\.claude\tw-grid\goals\MOD-GRID-11\range-goals.json` G-003 객체 (AC-001~AC-007 소스)
- **L2 (G-001 구현)**: `topvel-grid-monorepo/packages/grid-pro-range/src/types.ts` — CellCoord, CellRange 기존 타입
- **L3 (패턴 카탈로그)**: `D:\project\topvel_project\TOMIS\.claude\tw-grid\decisions\MOD-GRID-11-decisions.md` ADR-MOD-GRID-11-006
- **R-W (Wijmo 참조)**: `references/publish-wijmo-analysis.md §3` — isDraggingRef, dragStartCellRef, CellRange clone 패턴 (C-16: import 금지, shape 참조만)
- **R-A (AG Grid 참조)**: `references/publish-aggrid-analysis.md §8` — AG Grid Enterprise Fill Handle API (C-7: import 금지, 패턴 shape 참조만; publish는 Enterprise 미사용 확인)

---

## Section 2: Acceptance Criteria

| AC# | 설명 | 소스 |
|-----|------|------|
| AC-001 | `DragFillHandle` 컴포넌트와 `fillRange` 함수는 TypeScript strict 모드(`exactOptionalPropertyTypes` 포함)에서 타입 에러 없이 컴파일된다. `@ts-ignore`, `as any`, `<any>` 금지. | C-5 (goals.json) |
| AC-002 | `fillRange` 순수 함수: 숫자 배열 입력 시 등차 step을 감지해 시리즈 연장. 숫자 외 값(문자열, boolean, null)은 순환 복사. 제네릭 `<TCell>`로 타입 안전 보장 — `any` 미사용. | C-4 (goals.json) |
| AC-003 | `DragFillHandle` 컴포넌트: `onFillComplete(cells: CellUpdate[])` 콜백으로 채우기 결과를 caller에게 전달. MOD-GRID-10 직접 import 없음 (D3). 트래킹 prop 주입 또는 onFillComplete callback 패턴. | L1 (goals.json) |
| AC-004 | `@tanstack/react-virtual` 가상화 환경에서 DragFillHandle의 mousedown/mousemove/mouseup 이벤트가 정상 동작한다. 뷰포트 밖 셀 드래그 시 row index 계산 오류 없음. | C-18 (goals.json) |
| AC-005 | Wijmo 코드(`@grapecity/wijmo.*`) import 없음. Wijmo drag-fill 패턴은 `publish-wijmo-analysis.md §3` 에서 shape만 참조. | C-16 (goals.json) |
| AC-006 | Pro tier EULA 라이선스 확인 stub: `_verifyGridLicenseStub('@tomis/grid-pro-range')` 호출. `@ts-ignore` 금지. B-06 compliant inline function 패턴. | C-12 (goals.json) |
| AC-007 | `DragFillHandle.stories.tsx` Storybook story 1개 이상 제공. Default + DragFill 시나리오 포함. | C-25 (goals.json) |

---

## Section 3: 설계 세부사항

### 3.1 신규 타입 (types.ts MODIFY)

```typescript
// topvel-grid-monorepo/packages/grid-pro-range/src/types.ts 추가 내용

/** 채우기 방향 (Excel 4방향) */
export type FillDirection = 'up' | 'down' | 'left' | 'right';

/**
 * 단일 셀 업데이트 단위.
 * 제네릭 <TCell>으로 any 미사용 (AC-001, AC-002).
 */
export interface CellUpdate<TCell = unknown> {
  row: number;
  col: number;
  value: TCell;
}

/** DragFillHandle 컴포넌트 Props */
export interface DragFillHandleProps<TCell = unknown> {
  /** 현재 선택된 소스 범위 (G-001 CellRange). null이면 핸들 미표시. */
  range: CellRange | null;
  /** 소스 셀 값 getter — 드래그 시 fill 계산용. */
  getCellValue: (row: number, col: number) => TCell;
  /** 채우기 완료 콜백 (D3 MOD-GRID-10 분리). */
  onFillComplete?: (cells: CellUpdate<TCell>[]) => void;
  /** 드래그 중 fill target 범위 변경 알림 (시각적 점선 outline용). */
  onFillTargetChange?: (target: CellRange | null) => void;
  /** 그리드 전체 행 수 (경계 clamp). */
  rowCount: number;
  /** 그리드 전체 열 수 (경계 clamp). */
  colCount: number;
  /** 핸들이 렌더링될 컨테이너 ref (좌표 계산). */
  containerRef: React.RefObject<HTMLElement>;
  /** 셀 크기 getter (px) — 드래그 위치 → cell coord 변환용. */
  getCellRect: (row: number, col: number) => { x: number; y: number; width: number; height: number };
}
```

### 3.2 `fillRange` 순수 함수 (internal/fillRange.ts NEW)

```typescript
// topvel-grid-monorepo/packages/grid-pro-range/src/internal/fillRange.ts

import type { CellRange, CellUpdate, FillDirection } from '../types';

/**
 * 숫자 배열에서 등차 step 감지.
 * 요소가 1개이면 step = 0 (단순 복사).
 * 요소가 2개 이상이고 모두 step 동일하면 해당 step 반환.
 * step 불일치 시 null 반환 (단순 복사 모드).
 */
export function detectSeriesStep(values: number[]): number | null {
  if (values.length < 2) return 0;
  const step = values[1] - values[0];
  for (let i = 2; i < values.length; i++) {
    if (values[i] - values[i - 1] !== step) return null;
  }
  return step;
}

/**
 * 소스 범위 값을 채울 방향·개수만큼 CellUpdate 배열 생성.
 * 제네릭 <TCell> — any 미사용 (AC-002).
 *
 * @param sourceRange  소스 CellRange (G-001 normalizeRange 보장된 값)
 * @param direction    채울 방향 (FillDirection)
 * @param fillCount    채울 셀 개수
 * @param getCellValue 소스 셀 값 getter
 */
export function fillRange<TCell>(
  sourceRange: CellRange,
  direction: FillDirection,
  fillCount: number,
  getCellValue: (row: number, col: number) => TCell,
): CellUpdate<TCell>[] {
  if (fillCount <= 0) return [];

  const { start, end } = sourceRange;
  const sourceRows: number[] = [];
  const sourceCols: number[] = [];

  for (let r = start.row; r <= end.row; r++) sourceRows.push(r);
  for (let c = start.col; c <= end.col; c++) sourceCols.push(c);

  // 소스 값 수집
  const sourceValues: TCell[][] = sourceRows.map((r) =>
    sourceCols.map((c) => getCellValue(r, c)),
  );

  const updates: CellUpdate<TCell>[] = [];

  if (direction === 'down') {
    const colLength = sourceCols.length;
    for (let fi = 0; fi < fillCount; fi++) {
      const targetRow = end.row + 1 + fi;
      for (let ci = 0; ci < colLength; ci++) {
        const colValues = sourceRows.map((_, ri) => sourceValues[ri][ci]);
        updates.push({
          row: targetRow,
          col: sourceCols[ci],
          value: generateFillValue(colValues, fi + 1),
        });
      }
    }
  } else if (direction === 'up') {
    const colLength = sourceCols.length;
    for (let fi = 0; fi < fillCount; fi++) {
      const targetRow = start.row - fillCount + fi;
      for (let ci = 0; ci < colLength; ci++) {
        const colValues = sourceRows.map((_, ri) => sourceValues[ri][ci]).reverse();
        updates.push({
          row: targetRow,
          col: sourceCols[ci],
          value: generateFillValue(colValues, fillCount - fi),
        });
      }
    }
  } else if (direction === 'right') {
    const rowLength = sourceRows.length;
    for (let fi = 0; fi < fillCount; fi++) {
      const targetCol = end.col + 1 + fi;
      for (let ri = 0; ri < rowLength; ri++) {
        const rowValues = sourceCols.map((_, ci) => sourceValues[ri][ci]);
        updates.push({
          row: sourceRows[ri],
          col: targetCol,
          value: generateFillValue(rowValues, fi + 1),
        });
      }
    }
  } else {
    // direction === 'left'
    const rowLength = sourceRows.length;
    for (let fi = 0; fi < fillCount; fi++) {
      const targetCol = start.col - fillCount + fi;
      for (let ri = 0; ri < rowLength; ri++) {
        const rowValues = sourceCols.map((_, ci) => sourceValues[ri][ci]).reverse();
        updates.push({
          row: sourceRows[ri],
          col: targetCol,
          value: generateFillValue(rowValues, fillCount - fi),
        });
      }
    }
  }

  return updates;
}

/**
 * 소스 값 배열 + step 인덱스로 단일 fill 값 산출.
 * - 숫자 배열 + 일정 step: 시리즈 연장
 * - 그 외: 순환 복사 (modulo)
 */
function generateFillValue<TCell>(sourceValues: TCell[], stepIndex: number): TCell {
  if (sourceValues.length === 0) return sourceValues[0];

  const allNumbers = sourceValues.every((v) => typeof v === 'number');
  if (allNumbers) {
    const nums = sourceValues as number[];
    const step = detectSeriesStep(nums);
    if (step !== null) {
      const lastVal = nums[nums.length - 1];
      return (lastVal + step * stepIndex) as TCell;
    }
  }

  // 순환 복사 (modulo)
  return sourceValues[stepIndex % sourceValues.length];
}
```

### 3.3 `DragFillHandle` 컴포넌트 (DragFillHandle.tsx NEW)

```typescript
// topvel-grid-monorepo/packages/grid-pro-range/src/DragFillHandle.tsx

/**
 * D2: _verifyGridLicenseStub — inline fallback stub 패턴 (B-06 compliant).
 * D4: isDraggingRef + dragStartRef + fillTargetRef 3개 ref로 drag 상태 추적.
 * ADR-MOD-GRID-11-006: mousedown/move/up 시퀀스 + drag state ref 패턴.
 */
import { useCallback, useEffect, useRef } from 'react';
import type { CellRange, CellUpdate, DragFillHandleProps, FillDirection } from './types';
import { normalizeRange } from './internal/normalize';
import { fillRange } from './internal/fillRange';

/**
 * D2 Option A: inline license verification stub.
 * MOD-GRID-99-A/G-002 완료 후 실제 grid-license import로 교체.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _verifyGridLicenseStub(_packageName: string): void {
  /* MOD-GRID-99-A/G-002가 signature/expiry/domain 검증을 구현 예정. */
}

export function DragFillHandle<TCell = unknown>({
  range,
  getCellValue,
  onFillComplete,
  onFillTargetChange,
  rowCount,
  colCount,
  containerRef,
  getCellRect,
}: DragFillHandleProps<TCell>): React.ReactElement | null {
  // D2: 라이선스 검증 stub (no-op until MOD-GRID-99-A)
  useEffect(() => {
    _verifyGridLicenseStub('@tomis/grid-pro-range');
  }, []);

  // D4: Drag state refs (ADR-MOD-GRID-11-006 mousedown/move/up 패턴)
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const fillTargetRef = useRef<CellRange | null>(null);

  const clampRow = (r: number) => Math.max(0, Math.min(r, rowCount - 1));
  const clampCol = (c: number) => Math.max(0, Math.min(c, colCount - 1));

  /** 마우스 좌표 → CellCoord 변환 (AC-004 가상화 호환) */
  const coordFromMouseEvent = useCallback(
    (clientX: number, clientY: number): { row: number; col: number } | null => {
      const container = containerRef.current;
      if (container === null) return null;
      const containerRect = container.getBoundingClientRect();
      const relX = clientX - containerRect.left;
      const relY = clientY - containerRect.top;

      if (range === null) return null;
      const { start, end } = range;
      // 간단 hit-test: 각 셀 rect와 비교 (AC-004: 가상화 환경에서도 row index 정확)
      for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < colCount; c++) {
          const rect = getCellRect(r, c);
          if (
            relX >= rect.x && relX < rect.x + rect.width &&
            relY >= rect.y && relY < rect.y + rect.height
          ) {
            return { row: clampRow(r), col: clampCol(c) };
          }
        }
      }
      return null;
    },
    [containerRef, range, rowCount, colCount, getCellRect],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      fillTargetRef.current = null;
    },
    [],
  );

  // window-level mousemove/mouseup: 컨테이너 밖으로 나가도 drag 유지 (D4)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || range === null) return;

      const targetCoord = coordFromMouseEvent(e.clientX, e.clientY);
      if (targetCoord === null) return;

      // 드래그 방향 감지 (D5)
      const { start, end } = range;
      let newTarget: CellRange | null = null;

      if (targetCoord.row > end.row) {
        // down
        newTarget = normalizeRange({
          start: { row: end.row + 1, col: start.col },
          end: { row: targetCoord.row, col: end.col },
        });
      } else if (targetCoord.row < start.row) {
        // up
        newTarget = normalizeRange({
          start: { row: targetCoord.row, col: start.col },
          end: { row: start.row - 1, col: end.col },
        });
      } else if (targetCoord.col > end.col) {
        // right
        newTarget = normalizeRange({
          start: { row: start.row, col: end.col + 1 },
          end: { row: end.row, col: targetCoord.col },
        });
      } else if (targetCoord.col < start.col) {
        // left
        newTarget = normalizeRange({
          start: { row: start.row, col: targetCoord.col },
          end: { row: end.row, col: start.col - 1 },
        });
      }

      fillTargetRef.current = newTarget;
      if (onFillTargetChange !== undefined) {
        onFillTargetChange(newTarget);
      }
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current || range === null) {
        isDraggingRef.current = false;
        return;
      }
      isDraggingRef.current = false;

      const target = fillTargetRef.current;
      if (target === null) return;

      // 방향 파생
      const { start, end } = range;
      let direction: FillDirection = 'down';
      let fillCount = 0;

      if (target.start.row > end.row) {
        direction = 'down';
        fillCount = target.end.row - end.row;
      } else if (target.end.row < start.row) {
        direction = 'up';
        fillCount = start.row - target.start.row;
      } else if (target.start.col > end.col) {
        direction = 'right';
        fillCount = target.end.col - end.col;
      } else {
        direction = 'left';
        fillCount = start.col - target.start.col;
      }

      if (fillCount > 0 && onFillComplete !== undefined) {
        const updates = fillRange<TCell>(range, direction, fillCount, getCellValue);
        onFillComplete(updates);
      }

      fillTargetRef.current = null;
      if (onFillTargetChange !== undefined) {
        onFillTargetChange(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [range, getCellValue, onFillComplete, onFillTargetChange, coordFromMouseEvent]);

  // range 없으면 핸들 미렌더링
  if (range === null) return null;

  // 핸들 위치: 소스 range 우하단 셀 rect 기준
  const endRect = getCellRect(range.end.row, range.end.col);
  const handleStyle: React.CSSProperties = {
    position: 'absolute',
    left: endRect.x + endRect.width - 4,
    top: endRect.y + endRect.height - 4,
  };

  return (
    // Tailwind: absolute 2×2 파란 핸들 (C-5 — CSS 파일 미사용)
    <div
      role="presentation"
      style={handleStyle}
      className="absolute w-2 h-2 bg-blue-500 cursor-crosshair border border-white z-10"
      onMouseDown={handleMouseDown}
    />
  );
}
```

### 3.4 CellRange Pattern Catalog 적용 (ADR-MOD-GRID-11-006)

G-003에서 직접 재사용되는 패턴:

| 패턴 | 적용 위치 | 원천 |
|------|----------|------|
| **mousedown/move/up 시퀀스 + drag state ref** | `isDraggingRef`, `dragStartRef`, `fillTargetRef` + window event listener | ADR-MOD-GRID-11-006, R-W §3 `isDraggingRef` shape |
| **anchor 유지 (anchorCell)** | 소스 range.start/end는 드래그 중 변경 안 함. fillTarget만 갱신 | ADR-MOD-GRID-11-006 |
| **normalize-on-extend** | `normalizeRange({ start: fillStart, end: cursor })` 호출로 target range 정규화 | ADR-MOD-GRID-11-006 |

### 3.5 FillDirection 감지 매트릭스 (C-30 Truth Table)

| 드래그 대상 위치 | 감지 방향 | fillCount 계산 |
|----------------|----------|---------------|
| `targetRow > range.end.row` | down | `targetRow - range.end.row` |
| `targetRow < range.start.row` | up | `range.start.row - targetRow` |
| `targetCol > range.end.col` | right | `targetCol - range.end.col` |
| `targetCol < range.start.col` | left | `range.start.col - targetCol` |
| 소스 범위 내부 | null (채우기 없음) | 0 |

---

## Section 4: 인터페이스 계약

### 4.1 DragFillHandleProps

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `range` | `CellRange \| null` | ✓ | 현재 선택 범위. null이면 핸들 미렌더링 |
| `getCellValue` | `(row: number, col: number) => TCell` | ✓ | 소스 셀 값 getter |
| `onFillComplete` | `(cells: CellUpdate<TCell>[]) => void` | ✗ | 채우기 완료 콜백 (D3) |
| `onFillTargetChange` | `(target: CellRange \| null) => void` | ✗ | drag 중 fill target 변경 알림 |
| `rowCount` | `number` | ✓ | 그리드 행 수 (경계 clamp) |
| `colCount` | `number` | ✓ | 그리드 열 수 (경계 clamp) |
| `containerRef` | `React.RefObject<HTMLElement>` | ✓ | 좌표 계산 컨테이너 ref |
| `getCellRect` | `(row: number, col: number) => { x: number; y: number; width: number; height: number }` | ✓ | 셀 위치/크기 getter |

### 4.2 CellUpdate<TCell>

```typescript
interface CellUpdate<TCell = unknown> {
  row: number;   // 0-indexed
  col: number;   // 0-indexed
  value: TCell;  // 채워질 값 (타입 안전, any 미사용)
}
```

### 4.3 FillDirection

```typescript
type FillDirection = 'up' | 'down' | 'left' | 'right';
```

### 4.4 사용 예시

```typescript
// Grid 컴포넌트 내부 사용 패턴

const [fillTarget, setFillTarget] = useState<CellRange | null>(null);

// C-29 주의: optional props onFillComplete, onFillTargetChange는 spread-skip 패턴
const fillHandleProps = {
  range,
  getCellValue,
  rowCount,
  colCount,
  containerRef,
  getCellRect,
  ...(onFillComplete !== undefined && { onFillComplete }),
  ...(onFillTargetChange !== undefined && { onFillTargetChange: setFillTarget }),
};

return (
  <div ref={containerRef} className="relative">
    {/* fill target 점선 outline */}
    {fillTarget !== null && (
      <div
        className="absolute outline outline-dashed outline-blue-400 pointer-events-none z-10"
        style={computeTargetStyle(fillTarget)}
      />
    )}
    <DragFillHandle {...fillHandleProps} />
  </div>
);
```

---

## Section 5: 의존성 및 영향 범위

### 5.1 직접 의존성

| 패키지 | 버전 요건 | 용도 |
|--------|----------|------|
| `react` | ^18.0.0 | `useCallback`, `useEffect`, `useRef`, `useState`, `ReactElement` |
| `@tanstack/react-table` | ^8.0.0 | 경계 계산 (rowCount, colCount 주입) |
| `@tanstack/react-virtual` | ^3.0.0 | AC-004 가상화 호환 (`getCellRect` 추상화로 virt 좌표 지원) |

### 5.2 내부 의존성 (G-001 산출물)

| 파일 | 의존 항목 |
|------|----------|
| `./types` | `CellRange`, `CellUpdate`, `FillDirection`, `DragFillHandleProps` |
| `./internal/normalize` | `normalizeRange` (normalize-on-extend 패턴) |
| `./internal/fillRange` | `fillRange`, `detectSeriesStep` (G-003 신규) |

### 5.3 migrationImpact 분석

**migrationImpact = medium** (goals.json L193 권위 값)

- `affectedUsageFiles = []` (goals.json 원문) — 현재 마이그레이션 파일 직접 영향 없음
- Visual Regression: **N/A** (affectedUsageFiles 0건이므로 스크린샷 비교 대상 없음)
- 향후 `RangeSelectGrid.tsx`가 `DragFillHandle`을 통합할 때 L0 컴포넌트 변경 발생 예정 (G-006 scope)
- bundleImpact: **+3 KB** ≤ 20 KB (C-21 준수)

### 5.4 C-16 / C-7 준수 확인

- Wijmo import: **0건** (import 금지, `publish-wijmo-analysis.md §3` shape만 참조)
  - 참조된 shape: `isDraggingRef`, `dragStartCellRef` 네이밍 패턴
- AG Grid import: **0건** (import 금지, `publish-aggrid-analysis.md §8` shape만 참조)
  - 참조 정보: AG Grid Enterprise Fill Handle = Enterprise-only, publish 미사용 확인

---

## Section 6: 엣지 케이스

### EG-001: 단일 셀 선택 시 핸들 표시 및 채우기

**상황**: `range.start === range.end` (1×1 range)  
**처리**: 핸들은 정상 표시. 방향별 fillCount 1 이상이면 `fillRange` 호출. 단일 값 복사 (시리즈 step = 0).  
**코드 패턴**:
```typescript
if (values.length < 2) return 0; // step = 0 → 동일값 복사
```

### EG-002: 소스 범위 내부로 드래그 (자기 자신)

**상황**: 드래그 대상이 소스 `range` 내부 셀  
**처리**: `FillDirection 감지 매트릭스` 기준 — 4방향 모두 해당 없음 → `fillCount = 0` → `fillRange` 미호출, `onFillComplete` 미전달.  
**결과**: 데이터 변경 없음.

### EG-003: 그리드 경계 초과 드래그

**상황**: `rowCount - 1` 행 아래로 드래그 (down 초과) 또는 col 0 왼쪽으로 드래그 (left 초과)  
**처리**: `clampRow`/`clampCol`로 경계 내 clamp. `getCellRect` 기반 hit-test는 실제 존재하는 셀만 반환.  
**결과**: fillCount = 실제 남은 셀 수 (초과 없음).

### EG-004: 혼합 타입 배열 (숫자 + 문자열)

**상황**: 소스 범위 `[1, "A", 2, "B"]` — 숫자/문자열 혼합  
**처리**: `allNumbers` 체크 실패 → 시리즈 감지 스킵 → 순환 복사 (modulo).  
**결과**: 채워진 셀 = `[1, "A", 2, "B", 1, "A", ...]`.

### EG-005: 비일정 step 숫자 배열

**상황**: 소스 배열 `[1, 2, 4, 8]` — 배가 수열 (step 불일치)  
**처리**: `detectSeriesStep` → step 불일치 → `null` 반환 → 순환 복사 모드.  
**결과**: 채워진 셀 = `[1, 2, 4, 8, 1, 2, ...]`.

### EG-006: 가상화 환경에서 뷰포트 밖 셀 드래그

**상황**: `@tanstack/react-virtual` 환경. 뷰포트 밖 row/col은 DOM에 미렌더링.  
**처리**: `getCellRect` 추상화 → 가상화 스크롤 offset 포함 rect 반환 (caller 구현 책임). hit-test는 index 기반으로 정확.  
**결과**: row index 계산 오류 없음 (AC-004). `containerRef` 상대 좌표 기준.

---

## Section 7: 최종 구현 파일 목록

| 파일 경로 (topvel-grid-monorepo 기준) | 변경 유형 | 관련 AC | 설명 |
|---------------------------------------|----------|---------|------|
| `packages/grid-pro-range/src/DragFillHandle.tsx` | **NEW** | AC-001, AC-003, AC-004, AC-006 | 드래그 핸들 컴포넌트 + window 이벤트 처리 |
| `packages/grid-pro-range/src/internal/fillRange.ts` | **NEW** | AC-001, AC-002 | `fillRange` + `detectSeriesStep` 순수 함수 |
| `packages/grid-pro-range/src/DragFillHandle.stories.tsx` | **NEW** | AC-007 | Storybook story (Default + DragFill 시나리오) |
| `packages/grid-pro-range/src/types.ts` | **MODIFY** | AC-001, AC-002, AC-003 | `CellUpdate<TCell>`, `FillDirection`, `DragFillHandleProps` 추가 |
| `packages/grid-pro-range/src/index.ts` | **MODIFY** | AC-001 (AC-009) | `DragFillHandle`, `fillRange`, `CellUpdate`, `FillDirection` re-export |

**합계**: NEW 3 + MODIFY 2 = **5 files**

---

## Section 8: Pre-flight 체크리스트

### 8.1 H-01: L0/L1/L2/L3 경로 확인

| 레이어 | 경로 | 상태 |
|--------|------|------|
| L0 (사용처) | N/A — affectedUsageFiles: [] | ✓ (해당 없음) |
| L1 (goals.json) | `D:\project\topvel_project\TOMIS\.claude\tw-grid\goals\MOD-GRID-11\range-goals.json` | ✓ 실존 확인 |
| L2 (구현 파일) | `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\types.ts` | ✓ 실존 확인 |
| L2 (구현 파일) | `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\index.ts` | ✓ 실존 확인 |
| L3 (decisions) | `D:\project\topvel_project\TOMIS\.claude\tw-grid\decisions\MOD-GRID-11-decisions.md` | ✓ 실존 확인 |

### 8.2 H-02: implementFiles 부모 디렉토리 확인

| 파일 | 부모 디렉토리 | 상태 |
|------|-------------|------|
| `DragFillHandle.tsx` | `packages/grid-pro-range/src/` | ✓ 실존 (G-001/G-002 파일 동일 위치) |
| `internal/fillRange.ts` | `packages/grid-pro-range/src/internal/` | ✓ 실존 (`normalize.ts` 동일 위치) |
| `DragFillHandle.stories.tsx` | `packages/grid-pro-range/src/` | ✓ 실존 |
| `types.ts` (MODIFY) | `packages/grid-pro-range/src/` | ✓ 실존 |
| `index.ts` (MODIFY) | `packages/grid-pro-range/src/` | ✓ 실존 |

### 8.3 H-03: AC 소스 태그 검증

| AC# | 소스 태그 | goals.json 원문 일치 |
|-----|----------|-------------------|
| AC-001 | C-5 | ✓ |
| AC-002 | C-4 | ✓ |
| AC-003 | L1 | ✓ |
| AC-004 | C-18 | ✓ |
| AC-005 | C-16 | ✓ |
| AC-006 | C-12 | ✓ |
| AC-007 | C-25 | ✓ |

### 8.4 C-4 / B-06 TypeScript 준수 체크

| 체크 항목 | 결과 |
|----------|------|
| `@ts-ignore` 사용 | 없음 ✓ |
| `as any` 사용 | 없음 ✓ |
| `<any>` 제네릭 | 없음 ✓ (`<TCell = unknown>` 사용) |
| `declare const` for non-exported | 없음 ✓ |
| `_verifyGridLicenseStub` = inline function | ✓ (B-06 compliant) |

### 8.5 C-29 exactOptionalPropertyTypes 준수 체크

| Optional Prop | 패턴 |
|--------------|------|
| `onFillComplete?` | spread-skip: `...(onFillComplete !== undefined && { onFillComplete })` |
| `onFillTargetChange?` | spread-skip: `...(onFillTargetChange !== undefined && { onFillTargetChange })` |

---

## Section 9: 의존성 그래프

```
MOD-GRID-11/G-003 (Drag-fill)
├── depends on: MOD-GRID-11/G-001 (CellRange 모델)
│   ├── types.ts: CellCoord, CellRange ← G-001 export
│   └── internal/normalize.ts: normalizeRange ← G-001 export
├── depends on: MOD-GRID-99-A/G-001 (라이선스 — stub until완료)
│   └── _verifyGridLicenseStub inline (D2, B-06)
└── provides:
    ├── DragFillHandle (component)
    ├── fillRange + detectSeriesStep (pure functions)
    ├── CellUpdate<TCell> (type)
    └── FillDirection (type)
```

---

## Section 10: 사용자 여정 (User Journey)

### 10.1 기본 시나리오 — 숫자 시리즈 채우기

1. 사용자가 그리드에서 셀 범위 `[A1:A3] = [1, 2, 3]` 을 마우스로 선택 (G-001)
2. 선택 범위 우하단에 파란 핸들(2×2 사각형) 표시
3. 사용자가 핸들을 아래로 드래그 → A4:A6 방향으로 점선 outline 표시
4. mouseup 시 `detectSeriesStep([1,2,3]) = 1` → 시리즈 연장: `[4, 5, 6]`
5. `onFillComplete([{row:3,col:0,value:4}, {row:4,col:0,value:5}, {row:5,col:0,value:6}])` 호출
6. Caller(Grid)가 콜백에서 데이터 업데이트 수행

### 10.2 값 복사 시나리오 — 문자열 반복

1. 셀 범위 `[B1:B2] = ["월", "화"]` 선택
2. 핸들을 아래로 드래그 B3:B5 방향
3. `detectSeriesStep` — 숫자 아님 → 순환 복사 모드
4. `fillRange` → `["수", "목", "금"]`? 아니면 `["월", "화", "월"]`
   - **G-003 구현 범위**: 순환 복사 (`["월", "화", "월"]`). 요일 시리즈는 G-006 이후 확장 scope.
5. `onFillComplete` 호출

### 10.3 취소 시나리오 — 소스 범위 내부 드래그

1. 선택 범위 `[C1:C3]` 에서 핸들 드래그
2. 드래그 대상이 C2 (소스 내부)
3. fillCount = 0 → onFillComplete 미호출 → 데이터 변경 없음

---

## Section 11: 구현 계획 (Before/After)

### 11.1 types.ts MODIFY

**Before** (현재 상태 — G-001/G-002 구현 후):
```typescript
export interface CellCoord { row: number; col: number; }
export interface CellRange { start: CellCoord; end: CellCoord; }
export interface RangeSelectGridProps<TData extends object> { /* ... */ }
```

**After** (G-003 추가):
```typescript
export interface CellCoord { row: number; col: number; }
export interface CellRange { start: CellCoord; end: CellCoord; }
export interface RangeSelectGridProps<TData extends object> { /* ... */ }

// G-003 신규 타입
export type FillDirection = 'up' | 'down' | 'left' | 'right';
export interface CellUpdate<TCell = unknown> {
  row: number;
  col: number;
  value: TCell;
}
export interface DragFillHandleProps<TCell = unknown> {
  range: CellRange | null;
  getCellValue: (row: number, col: number) => TCell;
  onFillComplete?: (cells: CellUpdate<TCell>[]) => void;
  onFillTargetChange?: (target: CellRange | null) => void;
  rowCount: number;
  colCount: number;
  containerRef: React.RefObject<HTMLElement>;
  getCellRect: (row: number, col: number) => { x: number; y: number; width: number; height: number };
}
```

### 11.2 index.ts MODIFY

**Before**:
```typescript
export type { CellCoord, CellRange, RangeSelectGridProps } from './types';
export { normalizeRange, isInRange } from './internal/normalize';
export { useCellRange } from './useCellRange';
export type { UseCellRangeReturn } from './useCellRange';
export { RangeSelectGrid } from './RangeSelectGrid';
export { useKeyboardNav } from './useKeyboardNav';
export type { UseKeyboardNavOptions, UseKeyboardNavReturn } from './useKeyboardNav';
```

**After** (G-003 추가):
```typescript
export type { CellCoord, CellRange, RangeSelectGridProps } from './types';
// G-003 신규 타입 export (AC-009)
export type { CellUpdate, FillDirection, DragFillHandleProps } from './types';

export { normalizeRange, isInRange } from './internal/normalize';
// G-003 순수 함수 export
export { fillRange, detectSeriesStep } from './internal/fillRange';

export { useCellRange } from './useCellRange';
export type { UseCellRangeReturn } from './useCellRange';
export { RangeSelectGrid } from './RangeSelectGrid';
export { useKeyboardNav } from './useKeyboardNav';
export type { UseKeyboardNavOptions, UseKeyboardNavReturn } from './useKeyboardNav';
// G-003 컴포넌트 export
export { DragFillHandle } from './DragFillHandle';
```

### 11.3 Storybook story 템플릿 (DragFillHandle.stories.tsx NEW)

```typescript
// topvel-grid-monorepo/packages/grid-pro-range/src/DragFillHandle.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import { DragFillHandle } from './DragFillHandle';
import type { CellRange } from './types';

const meta: Meta<typeof DragFillHandle> = {
  title: 'grid-pro-range/DragFillHandle',
  component: DragFillHandle,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof DragFillHandle>;

export const Default: Story = {
  render: () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [range] = useState<CellRange>({
      start: { row: 0, col: 0 },
      end: { row: 2, col: 1 },
    });
    const data = [[1, 2], [3, 4], [5, 6]];
    const getCellValue = (row: number, col: number) => data[row]?.[col] ?? null;
    const getCellRect = (row: number, col: number) => ({
      x: col * 80,
      y: row * 32,
      width: 80,
      height: 32,
    });
    return (
      <div ref={containerRef} className="relative w-48 h-24 border border-gray-300">
        <DragFillHandle
          range={range}
          getCellValue={getCellValue}
          rowCount={3}
          colCount={2}
          containerRef={containerRef}
          getCellRect={getCellRect}
          onFillComplete={(cells) => console.log('filled:', cells)}
        />
      </div>
    );
  },
};

export const DragFillSeries: Story = {
  render: () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [range] = useState<CellRange>({
      start: { row: 0, col: 0 },
      end: { row: 2, col: 0 },
    });
    // 숫자 시리즈 [1, 2, 3] → 드래그 시 [4, 5, 6] 자동 연장
    const data = [[1], [2], [3], [null], [null], [null]];
    const getCellValue = (row: number, col: number) => data[row]?.[col] ?? null;
    const getCellRect = (row: number, col: number) => ({
      x: col * 80,
      y: row * 32,
      width: 80,
      height: 32,
    });
    return (
      <div ref={containerRef} className="relative w-24 h-48 border border-gray-300">
        <DragFillHandle
          range={range}
          getCellValue={getCellValue}
          rowCount={6}
          colCount={1}
          containerRef={containerRef}
          getCellRect={getCellRect}
          onFillComplete={(cells) => console.log('series filled:', cells)}
        />
      </div>
    );
  },
};
```

---

## Section 12: 검증 계획 (Validation Plan)

### 12.1 단위 테스트 목록

| 테스트 | 대상 | 검증 내용 |
|--------|------|----------|
| UT-001 | `detectSeriesStep([1,2,3])` | 1 반환 |
| UT-002 | `detectSeriesStep([2,4,6])` | 2 반환 |
| UT-003 | `detectSeriesStep([1,2,4])` | null 반환 (불일치) |
| UT-004 | `detectSeriesStep([5])` | 0 반환 (단일값) |
| UT-005 | `fillRange(range, 'down', 3, getter)` — 숫자 시리즈 | `[{row:3,value:4},{row:4,value:5},{row:5,value:6}]` |
| UT-006 | `fillRange(range, 'right', 2, getter)` — 문자열 순환 | 순환 복사 결과 |
| UT-007 | `fillRange(range, 'down', 0, getter)` | `[]` 반환 |
| UT-008 | `fillRange` — 혼합 타입 | 순환 복사 모드 |

### 12.2 Self-review 체크리스트

- [ ] D# breakdown (Section 0) ↔ Section 7 파일 목록 100% 일치 (NEW 3 + MODIFY 2 = 5)
- [ ] `@ts-ignore` 검색 결과 0건 (B-06)
- [ ] `as any` 검색 결과 0건 (C-4)
- [ ] Wijmo import 검색 결과 0건 (C-16)
- [ ] AG Grid import 검색 결과 0건 (C-7)
- [ ] CSS 파일 신규 생성 없음 (C-5)
- [ ] `_verifyGridLicenseStub` inline function 패턴 (ADR-MOD-GRID-11-002)
- [ ] C-29 optional props spread-skip 패턴 (`onFillComplete`, `onFillTargetChange`)
- [ ] `CellUpdate<TCell>` 제네릭 — any 미사용 (AC-002)
- [ ] `FillDirection = 'up' | 'down' | 'left' | 'right'` (D5)
- [ ] fillCount = 0 시 onFillComplete 미호출 (EG-002)
- [ ] goals.json L193 migrationImpact = "medium" (C-32)
- [ ] Section 7 재결정 내용 ↔ D# 테이블 100% 일치 (E-06)

---

## Section 13: 상업화 노트 (Commercialization)

### 13.1 Pro Tier 위치

`@tomis/grid-pro-range/DragFillHandle`은 **Pro tier** 기능이다.

- `_verifyGridLicenseStub` → MOD-GRID-99-A/G-002 완료 후 실제 EULA 라이선스 검증으로 교체
- 라이선스 없는 환경: `verifyGridLicense` 실패 시 핸들 렌더링 억제 또는 watermark 표시 (MOD-GRID-99-A scope)

### 13.2 번들 영향

| 항목 | 수치 |
|------|------|
| 예상 번들 증가 | **+3 KB** (gzip) |
| C-21 한도 | ≤ 20 KB |
| 상태 | ✓ 준수 |

### 13.3 Breaking Change 없음

- `types.ts` 추가만 (기존 `CellCoord`, `CellRange`, `RangeSelectGridProps` 미변경)
- `index.ts` 추가 export만 (기존 export 미제거)
- G-001/G-002 소비자 코드 변경 불필요
