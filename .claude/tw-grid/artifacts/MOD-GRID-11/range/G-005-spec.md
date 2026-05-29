# G-005 Spec: Delete 키 범위 삭제 + F2/Enter 셀 편집 시작 + 범위 단위 일괄 동일 값 입력

**Package**: `@tomis/grid-pro-range`  
**Goal ID**: G-005  
**Module**: MOD-GRID-11 (Cell Range Selection)  
**Spec Version**: v1.0.0  
**Date**: 2026-05-15  
**Author**: tw-grid Spec Writer  
**Status**: DRAFT

---

## Section 0: 결정 테이블 (D# Summary)

| D# | 결정 | 사유 | ADR 참조 |
|----|------|------|----------|
| D1 | `implementFiles` 경로: `topvel-grid-monorepo/packages/` 접두사 사용 | goals.json L342-344 `TOMIS/packages/` 접두사 오류 (C-28). 실제 monorepo root = `topvel-grid-monorepo/` | ADR-MOD-GRID-11-001 |
| D2 | 라이선스 검증: `_verifyGridLicenseStub` inline function 패턴 | `@ts-ignore + declare const` 패턴은 C-4 위반. G-002/G-004와 동일 inline stub 패턴 (B-06 compliant) | ADR-MOD-GRID-11-002 |
| D3 | MOD-GRID-10 의존 분리: `onDeleteRange(cells: CellCoord[]) => void` + `onBulkEdit(cells: CellCoord[], value: TCell) => void` callback 제공 | MOD-GRID-10/G-001 pending. G-003 `onFillComplete` / G-004 `onPaste` 와 동형 callback interface. caller가 updateRow 배치 호출 책임. G-006 capstone에서 전체 통합. trade-off (1) 유연성: caller가 데이터 레이어 직접 제어 가능; (2) 책임 분리: keyboard edit 로직과 데이터 레이어 분리 | ADR-MOD-GRID-11-003 |
| D4 | MOD-GRID-05 InlineEditCell 의존 분리: `onEditStart(cell: CellCoord, initialValue?: TCell) => void` callback | MOD-GRID-05/G-003 (EditableCell) pending. F2/Enter 키 수신 시 외부 컴포넌트(caller)가 인라인 편집 활성. 본 Hook은 키 이벤트 감지 + callback 호출만 담당. G-006 capstone에서 실제 InlineEditCell wiring. trade-off (1) 분리 명확성: hook 독립성 유지; (2) F2-only 변경 고려했으나 AC-003 Enter 요건 유지 — D5 분기 로직으로 충돌 해소. | — |
| D5 | Enter 키 충돌 해소: 단일 셀 선택 시에만 편집 시작, 범위 선택 시 Enter를 G-002 handleKeyDown에 위임 | G-002 `useKeyboardNav` 가 Enter를 이미 소비(e.preventDefault). 충돌 방지 전략: selection이 단일 셀(`start.row===end.row && start.col===end.col`)이면 G-005가 Enter 소비(편집 시작); 범위 선택이면 G-005는 Enter 처리 안 하고 체인 다음 핸들러(G-002)에 위임. Caller는 G-005 onKeyDown을 G-002 handleKeyDown 앞에 배치. G-005가 e.preventDefault()를 호출한 경우 G-002는 defaultPrevented 확인 후 skip. | — |
| D6 | 키 분기 규칙: printable key 감지 = `e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && !e.isComposing` | Ctrl/Meta 조합은 단축키 (C, V 등) 이므로 제외. IME 조합 중(한글 입력 등) `e.isComposing === true` → bulk edit 제외. trade-off: isComposing 미처리 시 한글 조합 중 중간 음절이 bulk edit 트리거 → UX 손상. | — |
| D7 | onKeyDown 컴포저블 반환: G-002/G-004와 동일 패턴 | G-002 `handleKeyDown`, G-004 `onKeyDown` 과 동일한 컴포저블 패턴. caller가 합성. | — |
| D8 | Storybook story 파일: `useKeyboardEdit.stories.tsx` Section 7 필수 포함 | AC-006 binding AC (E-01 v1.0.6 규칙) | ADR-MOD-GRID-11-005 |

**D# 파일 수 breakdown**: NEW 2 + MODIFY 2 = **4 files 합계**.  
NEW: `useKeyboardEdit.ts`, `useKeyboardEdit.stories.tsx`.  
MODIFY: `types.ts`, `index.ts`.

---

## Section 1: 목표 개요

### 1.1 Goal 기본 정보

| 항목 | 값 |
|------|-----|
| Goal ID | G-005 |
| 제목 | Delete 키 범위 삭제 + F2/Enter 셀 편집 시작 + 범위 단위 일괄 동일 값 입력 |
| Package | `@tomis/grid-pro-range` |
| Tier | Pro (EULA 라이선스) |
| migrationImpact | **medium** (goals.json L309 권위 값: `"migrationImpact": "medium"`) |
| Depends On | G-001 (CellRange 모델 + 마우스 선택), G-002 (키보드 내비게이션 — onKeyDown 합성 패턴), MOD-GRID-10/G-001 (D3으로 해소), MOD-GRID-99-A/G-001 (D2 stub으로 해소), MOD-GRID-05/G-003 (D4로 해소) |
| Blocks | G-006 (RangeSelectGrid 통합 capstone) |

### 1.2 Goal 설명

G-001/G-002에서 구현된 셀 범위 선택 + 키보드 내비게이션 위에 **편집 트리거 레이어**를 추가한다.

- **Delete 키**: 선택 범위 내 편집 가능 컬럼 셀을 `''` 또는 `null`로 초기화. `onDeleteRange(cells: CellCoord[])` callback 호출 (D3).
- **Printable key (일반 문자 타이핑)**: 선택 전체에 동일 값 입력. `onBulkEdit(cells: CellCoord[], value: TCell)` callback 호출 (D3). IME composition 중 제외 (D6).
- **F2 키**: 단일 활성 셀 편집 모드 시작. `onEditStart(cell: CellCoord, initialValue?: TCell)` callback 호출 (D4).
- **Enter 키**: 단일 셀 선택 시 편집 시작(= F2와 동일). 범위 선택 시 G-002 handleKeyDown에 위임 (D5).

### 1.3 참조 출처 (Section 1 — H-01 평가 대상)

- **L0**: N/A — `affectedUsageFiles: []` (goals.json L346: `"affectedUsageFiles": []`). 기존 구현 없음.
- **L1**: `D:\project\topvel_project\TOMIS\.claude\tw-grid\goals\MOD-GRID-11\range-goals.json` G-005 객체 (AC-001~AC-006 소스)
- **L2 (G-002 구현)**: `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\useKeyboardNav.ts` — handleKeyDown 패턴 (activeCellRef + onKeyDown 합성)  
  `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\useClipboard.ts` — G-004 onKeyDown 컴포저블 패턴  
  `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\types.ts` — CellCoord, CellRange, CellUpdate 기존 타입
- **L3 (ADR 카탈로그)**: `D:\project\topvel_project\TOMIS\.claude\tw-grid\decisions\MOD-GRID-11-decisions.md` ADR-MOD-GRID-11-006 (2D matrix isInRange + anchor 유지 패턴)
- **R-A (AG Grid 참조)**: `D:\project\topvel_project\TOMIS\.claude\tw-grid\references\publish-aggrid-analysis.md` — AG Grid Enterprise Range Delete + Cell editing 패턴 (C-7: import 금지, 패턴 shape 참조만)
- **R-W (Wijmo 참조)**: `D:\project\topvel_project\TOMIS\.claude\tw-grid\references\publish-wijmo-analysis.md` §3 — Wijmo `g.startEditing(true)` + `g.cellEditEnded` 이벤트 개념 학습 (C-16: import 금지, 개념 참조만)

---

## Section 2: Acceptance Criteria

| AC# | 설명 | 소스 |
|-----|------|------|
| AC-001 | Delete key → 선택 범위 내 편집 가능 컬럼(`isEditableColumn(col): boolean` 반환 `true`)에 한해 `''` \| `null` 값 배치. `onDeleteRange(cells: CellCoord[]) => void` callback 호출. selection null이면 no-op. `@ts-ignore`, `as any` 금지 (C-4). | C-4 (goals.json) |
| AC-002 | 범위 선택 후 일반 문자 타이핑(printable key: `e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && !e.isComposing`) → selection 전체 동일 값 입력. `onBulkEdit(cells: CellCoord[], value: TCell) => void` callback 호출. 편집 가능 컬럼만 필터링. | L1 (goals.json) |
| AC-003 | F2 / Enter → 단일 active 셀 편집 시작. `onEditStart(cell: CellCoord, initialValue?: TCell) => void` callback 호출 (D4 — MOD-GRID-05 InlineEditCell은 caller 책임). Enter 키: 단일 셀 선택 시에만 소비(D5 분기). | L1 (goals.json) |
| AC-004 | `@mescius/wijmo*` import 0건 (C-16). Wijmo `g.startEditing` + `g.cellEditEnded` 개념은 `publish-wijmo-analysis.md §3`에서 참조만. | C-16 (goals.json) |
| AC-005 | C-12: `tsc --noEmit` 0 error. | C-12 (goals.json) |
| AC-006 | C-25: Storybook story 1개 (Delete 삭제 + 일괄 타이핑 입력 + F2 편집 시나리오). | C-25 (goals.json) |

---

## Section 3: 설계 세부사항

### 3.1 신규 타입 (types.ts MODIFY)

```typescript
// topvel-grid-monorepo/packages/grid-pro-range/src/types.ts 추가 내용

/**
 * useKeyboardEdit hook props.
 *
 * C-29 (exactOptionalPropertyTypes): optional 필드는 '?: T' 선언.
 * 전달 시 spread-skip 패턴 사용 (Section 10.1 예시 참조).
 */
export interface UseKeyboardEditProps<TData, TCell = unknown> {
  /** 현재 선택 범위 (useCellRange의 range). null이면 Delete/printable no-op. */
  selection: CellRange | null;
  /** 현재 활성 셀 좌표 (useKeyboardNav의 activeCell). null이면 F2/Enter no-op. */
  activeCell: CellCoord | null;
  /** 컬럼 편집 가능 여부 판별 함수. 미제공 시 모든 컬럼 편집 가능으로 취급. */
  isEditableColumn?: (colIndex: number) => boolean;
  /** Delete 키 범위 삭제 callback (D3 MOD-GRID-10 분리). */
  onDeleteRange?: (cells: CellCoord[]) => void;
  /** 범위 일괄 입력 callback (D3 MOD-GRID-10 분리). */
  onBulkEdit?: (cells: CellCoord[], value: TCell) => void;
  /** F2/Enter 단일 셀 편집 시작 callback (D4 MOD-GRID-05 분리). */
  onEditStart?: (cell: CellCoord, initialValue?: TCell) => void;
  /** TanStack Table 인스턴스 — 향후 확장용 optional. */
  table?: import('@tanstack/react-table').Table<TData>;
}

/** useKeyboardEdit hook 반환 타입. */
export interface UseKeyboardEditReturn {
  /**
   * Grid container에 부착할 keydown 핸들러 (D7).
   * G-002 handleKeyDown / G-004 onKeyDown과 컴포저블 결합.
   * Caller는 G-005 onKeyDown을 체인 앞에 배치 (D5 Enter 우선순위).
   */
  onKeyDown: (e: React.KeyboardEvent) => void;
}
```

### 3.2 `useKeyboardEdit` hook (useKeyboardEdit.ts NEW)

```typescript
// topvel-grid-monorepo/packages/grid-pro-range/src/useKeyboardEdit.ts

/**
 * D2: _verifyGridLicenseStub — inline fallback stub 패턴 (B-06 compliant).
 * D3: onDeleteRange / onBulkEdit callback — MOD-GRID-10 분리.
 * D4: onEditStart callback — MOD-GRID-05 InlineEditCell 분리.
 * D5: Enter 키 충돌 해소 — 단일 셀 선택 시에만 편집 소비.
 * D6: printable key 감지 — isComposing 검사 포함.
 * D7: onKeyDown 반환 — G-002/G-004와 컴포저블 결합.
 * ADR-MOD-GRID-11-006: 2D matrix iteration (isInRange 패턴 재사용).
 */
import { useCallback, useEffect } from 'react';
import type {
  CellCoord,
  CellRange,
  UseKeyboardEditProps,
  UseKeyboardEditReturn,
} from './types';

/**
 * D2 Option A: inline license verification stub.
 * MOD-GRID-99-A/G-002 완료 후 실제 grid-license import로 교체.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _verifyGridLicenseStub(_packageName: string): void {
  /* MOD-GRID-99-A/G-002가 signature/expiry/domain 검증을 구현 예정. */
}

/** 선택 범위가 단일 셀인지 확인 (D5 Enter 분기 보조). */
function isSingleCell(range: CellRange): boolean {
  return range.start.row === range.end.row && range.start.col === range.end.col;
}

/** 범위 내 편집 가능 셀 좌표 배열 반환 (AC-001 Delete + AC-002 bulk). */
function getEditableCells(
  range: CellRange,
  isEditableColumn: (colIndex: number) => boolean,
): CellCoord[] {
  const cells: CellCoord[] = [];
  for (let r = range.start.row; r <= range.end.row; r++) {
    for (let c = range.start.col; c <= range.end.col; c++) {
      if (isEditableColumn(c)) {
        cells.push({ row: r, col: c });
      }
    }
  }
  return cells;
}

export function useKeyboardEdit<TData, TCell = unknown>(
  props: UseKeyboardEditProps<TData, TCell>,
): UseKeyboardEditReturn {
  const {
    selection,
    activeCell,
    isEditableColumn,
    onDeleteRange,
    onBulkEdit,
    onEditStart,
  } = props;

  // D2: 라이선스 검증 stub
  useEffect(() => {
    _verifyGridLicenseStub('@tomis/grid-pro-range');
  }, []);

  /** isEditableColumn 미제공 시 모든 컬럼 편집 가능으로 취급 (AC-001). */
  const resolvedIsEditable = useCallback(
    (colIndex: number): boolean => {
      if (isEditableColumn === undefined) return true;
      return isEditableColumn(colIndex);
    },
    [isEditableColumn],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      // ── Delete 키 (AC-001) ──────────────────────────────────────────────
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Ctrl/Meta 조합은 브라우저 단축키 — G-005 제외
        if (e.ctrlKey || e.metaKey) return;
        if (selection === null) return; // EC-001: selection null → no-op

        const cells = getEditableCells(selection, resolvedIsEditable);
        if (cells.length === 0) return; // EC-002: 편집 가능 컬럼 없음 → no-op

        e.preventDefault();
        if (onDeleteRange !== undefined) {
          onDeleteRange(cells);
        }
        return;
      }

      // ── F2 키 (AC-003) ──────────────────────────────────────────────────
      if (e.key === 'F2') {
        if (activeCell === null) return; // EC-004: activeCell null → no-op
        e.preventDefault();
        if (onEditStart !== undefined) {
          onEditStart(activeCell);
        }
        return;
      }

      // ── Enter 키 (AC-003, D5) ───────────────────────────────────────────
      if (e.key === 'Enter') {
        if (activeCell === null) return;
        // D5: 단일 셀 선택 시에만 편집 시작 소비
        const singleCell =
          selection !== null && isSingleCell(selection);
        if (!singleCell) return; // 범위 선택 시 G-002 handleKeyDown에 위임
        e.preventDefault();
        if (onEditStart !== undefined) {
          onEditStart(activeCell);
        }
        return;
      }

      // ── Printable key 일괄 입력 (AC-002, D6) ────────────────────────────
      const isPrintable =
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !e.nativeEvent.isComposing; // EC-007: IME 조합 중 제외

      if (isPrintable) {
        if (selection === null) return; // EC-001: selection null → no-op

        const cells = getEditableCells(selection, resolvedIsEditable);
        if (cells.length === 0) return;

        // printable key는 e.preventDefault() 생략 — 브라우저 기본 input 동작 유지.
        // 단일 셀의 경우 onEditStart + initialValue 호출 (AC-003 연동)
        if (isSingleCell(selection) && activeCell !== null) {
          if (onEditStart !== undefined) {
            onEditStart(activeCell, e.key as unknown as TCell);
          }
          return;
        }

        if (onBulkEdit !== undefined) {
          onBulkEdit(cells, e.key as unknown as TCell);
        }
      }
    },
    [selection, activeCell, resolvedIsEditable, onDeleteRange, onBulkEdit, onEditStart],
  );

  return { onKeyDown };
}
```

### 3.3 C-29 Optional Prop 전달 패턴 (exactOptionalPropertyTypes)

```typescript
// useKeyboardEdit hook 사용 시 optional props 전달 — spread-skip 패턴 (C-29)
const editProps: UseKeyboardEditProps<MyData, string> = {
  selection,
  activeCell,
  ...(isEditableColumn !== undefined ? { isEditableColumn } : {}),
  ...(onDeleteRange !== undefined ? { onDeleteRange } : {}),
  ...(onBulkEdit !== undefined ? { onBulkEdit } : {}),
  ...(onEditStart !== undefined ? { onEditStart } : {}),
};
const { onKeyDown: editKeyDown } = useKeyboardEdit(editProps);

// G-002 handleKeyDown + G-004 onKeyDown과 합성 (D7)
// G-005를 앞에 배치 — D5 Enter 우선순위 보장
const handleKeyDown = useCallback(
  (e: React.KeyboardEvent) => {
    editKeyDown(e);               // G-005: Delete / F2 / Enter(single) / printable
    if (e.defaultPrevented) return; // G-005가 소비한 경우 하위 핸들러 skip
    navKeyDown(e);                // G-002: Arrow / Tab / Enter(range)
    clipKeyDown(e);               // G-004: Ctrl+C / Ctrl+V
  },
  [editKeyDown, navKeyDown, clipKeyDown],
);
```

### 3.4 역할 분리 증거 (D3/D4)

| 항목 | 데이터 레이어 (caller) | 키보드 편집 레이어 (G-005) | InlineEdit 레이어 (caller/G-006) |
|------|----------------------|--------------------------|----------------------------------|
| Delete → 데이터 초기화 | updateRow/tracking 배치 호출 | `onDeleteRange(cells)` 트리거 | — |
| printable → 값 입력 | updateRow/tracking 배치 호출 | `onBulkEdit(cells, value)` 트리거 | — |
| F2/Enter → 편집 모드 | — | `onEditStart(cell, initial?)` 트리거 | InlineEditCell 활성 |
| Escape → 편집 취소 | — | — (편집 모드 외부 관리) | InlineEditCell 취소 |

---

## Section 4: 호환성 정책

| 항목 | 값 |
|------|-----|
| breaking | no |
| deprecation | 신규 기능 — alias 불필요 |
| migrationPath | G-006 RangeSelectGrid 통합 capstone에서 자동 합성 |
| peerDeps 변경 | 없음 (기존 react, @tanstack/react-table 유지) |
| 신규 외부 deps | 없음 |

---

## Section 5: 의존성

### 5.1 직접 의존성

| 항목 | 용도 |
|------|------|
| `react` | useCallback, useEffect (peerDep — C-22) |
| `@tanstack/react-table` | Table 타입 (optional prop — C-22 peerDep) |

### 5.2 내부 의존성 (기존 G-001/G-002 산출물)

| 파일 | 의존 항목 |
|------|----------|
| `./types` | CellCoord, CellRange, UseKeyboardEditProps, UseKeyboardEditReturn |

### 5.3 migrationImpact 분석

**migrationImpact = medium** (goals.json L309 권위 값: `"migrationImpact": "medium"`)

- `affectedUsageFiles = []` (goals.json L346) — 현재 마이그레이션 파일 직접 영향 없음
- Visual Regression: medium-tier 의무 (C-17). affectedUsageFiles 0건이므로 "사용처 0개" 조건으로 N/A 처리 가능 (C-17 N/A 조건: "migrationImpact: low 또는 사용처 0개 Goal")
- bundleImpact: **+2 KB** ≤ 20 KB. 누적 예상: G-001(+4 KB) + G-002(+2 KB) + G-003(+3 KB) + G-004(+2 KB) + G-005(+2 KB) = **13 KB**. G-006 여유 7 KB.

---

## Section 6: 엣지 케이스

| EC# | 상황 | 처리 | AC 매핑 |
|-----|------|------|---------|
| EC-001 | `selection === null` 상태에서 Delete/printable key | no-op (즉시 반환) | AC-001, AC-002 |
| EC-002 | `isEditableColumn` 판별 결과 편집 가능 컬럼이 0개 (모두 false) | `getEditableCells()` → 빈 배열 → callback 미호출, no-op | AC-001 |
| EC-003 | `activeCell === null` 상태에서 F2/Enter | no-op (즉시 반환) | AC-003 |
| EC-004 | Enter + 다중 셀 범위 선택 (D5 분기) | G-005 Enter 처리 안 함 → G-002 handleKeyDown에 위임 (아래 행 이동) | AC-003 |
| EC-005 | printable key + Ctrl/Meta/Alt 조합 | 단축키(Ctrl+C, Ctrl+V 등)로 취급 → G-005 처리 안 함 → G-004에 위임 | AC-002 |
| EC-006 | F2 + 다중 셀 범위 선택 | selection 상태와 무관하게 `activeCell` (단일) 편집 시작 | AC-003 |
| EC-007 | IME 조합 중 (`e.nativeEvent.isComposing === true`) printable key | D6: isComposing 검사 → no-op. 한글 조합 완료 후 확정 이벤트에서 처리 가능 | AC-002 |
| EC-008 | `onDeleteRange` / `onBulkEdit` / `onEditStart` 미제공 (undefined) | spread-skip 패턴 + `if (onXxx !== undefined)` 조건 검사 → 미호출, no-op | AC-001, AC-002, AC-003 |
| EC-009 | 단일 셀 선택 + printable key 입력 | `isSingleCell(selection)` = true → `onEditStart(activeCell, e.key)` 호출 (initialValue로 첫 글자 전달). `onBulkEdit` 미호출. | AC-002, AC-003 |

**AC↔EC 환경의존 매핑** (E-04 권장):

| AC | EC | 매핑 사유 |
|----|----|---------|
| AC-002 (printable key 감지) | EC-007 (IME composition) | 한글 등 조합형 입력 환경에서 isComposing 미처리 시 bulk edit 중간 음절 트리거 |
| AC-003 (Enter 편집 시작) | EC-004 (Enter + range) | G-002와 Enter 충돌 — D5 단일 셀 분기로 해소 |
| AC-001 (Delete 범위 삭제) | EC-002 (editable 0개) | 읽기 전용 컬럼만 선택된 경우 callback 미호출 |

---

## Section 7: 최종 구현 파일 목록

| # | 파일 경로 (topvel-grid-monorepo 기준) | 변경 유형 | 관련 AC | 설명 |
|---|---------------------------------------|----------|---------|------|
| 1 | `packages/grid-pro-range/src/useKeyboardEdit.ts` | **NEW** | AC-001, AC-002, AC-003, AC-004 | hook: `{ onKeyDown }` — Delete/F2/Enter/printable key 분기 |
| 2 | `packages/grid-pro-range/src/useKeyboardEdit.stories.tsx` | **NEW** | AC-006 | Storybook story — Delete 삭제 + 일괄 타이핑 + F2 편집 시나리오 |
| 3 | `packages/grid-pro-range/src/types.ts` | **MODIFY** | AC-001, AC-002, AC-003 | `UseKeyboardEditProps`, `UseKeyboardEditReturn` 타입 추가 |
| 4 | `packages/grid-pro-range/src/index.ts` | **MODIFY** | AC-001 | `useKeyboardEdit`, `UseKeyboardEditProps`, `UseKeyboardEditReturn` export 추가 |

**합계**: NEW 2 + MODIFY 2 = **4 files**

---

## Section 8: Pre-flight 체크리스트

### 8.1 H-01: L0/L1/L2/L3 경로 확인 (Section 1 referenceEvidence 대상만)

| 레이어 | 경로 | 상태 |
|--------|------|------|
| L0 (사용처) | N/A — affectedUsageFiles: [] | ✓ (해당 없음) |
| L1 (goals.json) | `D:\project\topvel_project\TOMIS\.claude\tw-grid\goals\MOD-GRID-11\range-goals.json` | ✓ 실존 확인 |
| L2 (useKeyboardNav.ts) | `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\useKeyboardNav.ts` | ✓ 실존 확인 |
| L2 (useClipboard.ts) | `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\useClipboard.ts` | ✓ 실존 확인 |
| L2 (types.ts) | `D:\project\topvel_project\topvel-grid-monorepo\packages\grid-pro-range\src\types.ts` | ✓ 실존 확인 |
| L3 (decisions) | `D:\project\topvel_project\TOMIS\.claude\tw-grid\decisions\MOD-GRID-11-decisions.md` | ✓ 실존 확인 |
| R-A (aggrid ref) | `D:\project\topvel_project\TOMIS\.claude\tw-grid\references\publish-aggrid-analysis.md` | ✓ 실존 확인 |
| R-W (wijmo ref) | `D:\project\topvel_project\TOMIS\.clone\tw-grid\references\publish-wijmo-analysis.md` | ✓ 실존 확인 |

### 8.2 H-02: implementFiles 부모 디렉토리 확인

| 파일 | 부모 디렉토리 | 상태 |
|------|-------------|------|
| `useKeyboardEdit.ts` | `packages/grid-pro-range/src/` | ✓ 실존 (`useKeyboardNav.ts`, `useClipboard.ts` 동일 위치) |
| `useKeyboardEdit.stories.tsx` | `packages/grid-pro-range/src/` | ✓ 실존 |
| `types.ts` (MODIFY) | `packages/grid-pro-range/src/` | ✓ 실존 |
| `index.ts` (MODIFY) | `packages/grid-pro-range/src/` | ✓ 실존 |

### 8.3 H-03: AC 소스 태그 검증

| AC# | 소스 태그 | goals.json 원문 일치 |
|-----|----------|-------------------|
| AC-001 | C-4 | ✓ |
| AC-002 | L1 | ✓ |
| AC-003 | L1 | ✓ |
| AC-004 | C-16 | ✓ |
| AC-005 | C-12 | ✓ |
| AC-006 | C-25 | ✓ |

### 8.4 C-4 / B-06 TypeScript 준수 체크

| 체크 항목 | 결과 |
|----------|------|
| `@ts-ignore` 사용 | 없음 ✓ |
| `as any` 사용 | 없음 ✓ (`e.key as unknown as TCell` 패턴 — `unknown` 경유, no `any`) |
| `<any>` 제네릭 | 없음 ✓ (`<TData, TCell = unknown>` 사용) |
| `declare const` for non-exported | 없음 ✓ |
| `_verifyGridLicenseStub` = inline function | ✓ (B-06 compliant, ADR-MOD-GRID-11-002 선례 재사용) |

### 8.5 C-29 exactOptionalPropertyTypes 준수 체크

| Optional Prop | 패턴 |
|--------------|------|
| `isEditableColumn?` | spread-skip: `...(isEditableColumn !== undefined ? { isEditableColumn } : {})` |
| `onDeleteRange?` | spread-skip: `...(onDeleteRange !== undefined ? { onDeleteRange } : {})` |
| `onBulkEdit?` | spread-skip: `...(onBulkEdit !== undefined ? { onBulkEdit } : {})` |
| `onEditStart?` | spread-skip: `...(onEditStart !== undefined ? { onEditStart } : {})` |
| `table?` | spread-skip: `...(table !== undefined ? { table } : {})` |

### 8.6 Pre-flight

| 항목 | 상태 |
|------|------|
| 영향 사용처 | 0개 (신규 기능) |
| 무파괴 tsc + build | 기존 export 미제거, 타입 추가만 |
| 점진 | G-006 통합 전까지 독립 사용 가능 |
| 롤백 | index.ts export 제거 |
| 번들 | +2 KB → 누적 13 KB (≤ 20 KB, C-21 준수). G-006 +2 KB 예상 → 15 KB로 여유 5 KB |

---

## Section 9: 의존성 그래프

```
MOD-GRID-11/G-005 (KeyboardEdit)
├── depends on: MOD-GRID-11/G-001 (CellRange 모델)
│   └── types.ts: CellCoord, CellRange ← G-001 export
├── depends on: MOD-GRID-11/G-002 (키보드 내비게이션 — onKeyDown 합성 패턴)
│   └── handleKeyDown 패턴 재사용 (D7 컴포저블)
├── depends on: MOD-GRID-99-A/G-001 (라이선스 — stub until 완료)
│   └── _verifyGridLicenseStub inline (D2, B-06)
├── MOD-GRID-10/G-001 (tracking) — D3으로 분리
│   └── onDeleteRange(cells: CellCoord[]) => void callback (caller 책임)
│   └── onBulkEdit(cells: CellCoord[], value: TCell) => void callback (caller 책임)
├── MOD-GRID-05/G-003 (InlineEditCell) — D4으로 분리
│   └── onEditStart(cell: CellCoord, initialValue?: TCell) => void callback (caller/G-006 책임)
└── provides:
    ├── useKeyboardEdit hook (onKeyDown)
    ├── UseKeyboardEditProps<TData, TCell> (type)
    └── UseKeyboardEditReturn (type)
```

---

## Section 10: 사용자 여정

### 10.1 개발자 여정

```typescript
// Grid 컴포넌트 내 useKeyboardEdit 통합 예시 (C-29 spread-skip)
const { range } = useCellRange();
const [activeCell, setActiveCell] = useState<CellCoord | null>(null);
const { handleKeyDown: navKeyDown } = useKeyboardNav({ table, activeCell, ... });
const { onKeyDown: clipKeyDown } = useClipboard({ ... });

const editProps: UseKeyboardEditProps<MyRow, string> = {
  selection: range,
  activeCell,
  ...(isEditable !== undefined ? { isEditableColumn: isEditable } : {}),
  ...(handleDelete !== undefined ? { onDeleteRange: handleDelete } : {}),
  ...(handleBulkEdit !== undefined ? { onBulkEdit: handleBulkEdit } : {}),
  ...(handleEditStart !== undefined ? { onEditStart: handleEditStart } : {}),
};
const { onKeyDown: editKeyDown } = useKeyboardEdit(editProps);

// D7: 세 핸들러 합성 — G-005 앞에 배치 (D5 Enter 우선순위)
const onKeyDown = useCallback(
  (e: React.KeyboardEvent) => {
    editKeyDown(e);               // G-005: Delete / F2 / Enter(single) / printable
    if (e.defaultPrevented) return;
    navKeyDown(e);                // G-002: Arrow / Tab / Enter(range)
    clipKeyDown(e);               // G-004: Ctrl+C / Ctrl+V
  },
  [editKeyDown, navKeyDown, clipKeyDown],
);
```

### 10.2 최종 사용자 여정 — Delete 범위 삭제

1. 사용자가 그리드에서 셀 범위 `[B2:D4]` 를 마우스 드래그로 선택 (G-001)
2. Delete 키 입력 → `useKeyboardEdit.onKeyDown` 수신
3. `getEditableCells(selection, isEditableColumn)` → 편집 가능 셀 목록
4. `onDeleteRange([{row:1,col:1}, {row:1,col:2}, ...])` callback 호출
5. caller가 `updateRow` 배치 호출 → 빈 값으로 초기화

### 10.3 최종 사용자 여정 — 일괄 값 입력

1. 셀 범위 `[A1:C3]` 선택 (다중 셀)
2. 키보드에서 `'A'` 입력 → printable key 감지 (`e.key.length === 1`)
3. `getEditableCells(selection, isEditableColumn)` → 9개 편집 가능 셀
4. `onBulkEdit([...9 cells...], 'A')` callback 호출
5. caller가 9개 셀에 `updateRow` 배치 호출 → 모두 `'A'`로 입력

### 10.4 최종 사용자 여정 — F2/Enter 단일 셀 편집

1. 단일 셀 `[C5]` 활성 (선택 단일 셀)
2. F2 키 또는 Enter 키 입력
3. D5 분기: `isSingleCell(selection) === true` → G-005가 소비 (`e.preventDefault()`)
4. `onEditStart({row:4, col:2})` callback 호출
5. caller(또는 G-006 capstone)가 InlineEditCell 활성화

---

## Section 11: 구현 계획 (Before/After)

### Step 1: types.ts MODIFY

**Before** (현재 상태 — G-001/G-002/G-003/G-004 구현 후):
```typescript
// 기존 G-004까지 타입
export interface UseClipboardReturn {
  onKeyDown: (e: React.KeyboardEvent) => void;
  copyToClipboard: () => Promise<void>;
  pasteFromClipboard: (tsvString?: string) => Promise<PasteResult>;
}
// ... (PasteResult, UseClipboardProps 등)
```

**After** (G-005 추가):
```typescript
// G-005 신규 타입 추가 (기존 타입 미변경)
export interface UseKeyboardEditProps<TData, TCell = unknown> {
  selection: CellRange | null;
  activeCell: CellCoord | null;
  isEditableColumn?: (colIndex: number) => boolean;
  onDeleteRange?: (cells: CellCoord[]) => void;
  onBulkEdit?: (cells: CellCoord[], value: TCell) => void;
  onEditStart?: (cell: CellCoord, initialValue?: TCell) => void;
  table?: import('@tanstack/react-table').Table<TData>;
}

export interface UseKeyboardEditReturn {
  onKeyDown: (e: React.KeyboardEvent) => void;
}
```

### Step 2: useKeyboardEdit.ts NEW

```typescript
// Before: 파일 없음

// After: useKeyboardEdit hook
import { useCallback, useEffect } from 'react';
import type { CellCoord, CellRange, UseKeyboardEditProps, UseKeyboardEditReturn } from './types';

function _verifyGridLicenseStub(_packageName: string): void { /* stub */ }
function isSingleCell(range: CellRange): boolean { /* ... */ }
function getEditableCells(range: CellRange, isEditable: (c: number) => boolean): CellCoord[] { /* ... */ }

export function useKeyboardEdit<TData, TCell = unknown>(
  props: UseKeyboardEditProps<TData, TCell>,
): UseKeyboardEditReturn {
  // Delete / F2 / Enter(D5 분기) / printable(D6 감지) 분기 로직
  const onKeyDown = useCallback((e: React.KeyboardEvent): void => { ... }, [...deps]);
  return { onKeyDown };
}
```

### Step 3: index.ts MODIFY

**Before**:
```typescript
// G-004까지 export
export { useClipboard } from './useClipboard';
export type { PasteResult, UseClipboardProps, UseClipboardReturn } from './types';
export { stringifyTsv, parseTsv } from './internal/tsvUtils';
```

**After** (G-005 추가):
```typescript
// G-005 신규 export
export { useKeyboardEdit } from './useKeyboardEdit';
export type { UseKeyboardEditProps, UseKeyboardEditReturn } from './types';
```

### Step 4: useKeyboardEdit.stories.tsx NEW

Storybook story 3개 시나리오 (AC-006):
1. **DeleteStory**: 범위 선택 후 Delete 키 → `onDeleteRange` 호출 로그 표시
2. **BulkEditStory**: 범위 선택 후 임의 문자 타이핑 → `onBulkEdit` 호출 로그 표시
3. **EditStartStory**: 단일 셀 활성 후 F2 키 → `onEditStart` 호출 로그 표시

### 11.1 구현 위험 요소

| 위험 | 확률 | 대응 |
|------|------|------|
| `e.nativeEvent.isComposing` — React 합성 이벤트 접근 패턴 | 중간 | `(e.nativeEvent as InputEvent).isComposing` 또는 `e.nativeEvent.isComposing` 직접 접근. tsc 타입 확인 필수 |
| Enter 키 G-002/G-005 충돌 | 중간 | D5 분기 + Caller 합성 순서 (G-005 앞 배치) 문서화 |
| `e.key as unknown as TCell` 타입 캐스팅 | 낮음 | `unknown` 경유 — any 미사용 (C-4). Storybook에서 `TCell = string`으로 검증 |

---

## Section 12: 검증 계획

### 12.1 단위 테스트

| 테스트 | 대상 | 검증 내용 |
|--------|------|----------|
| UT-001 | `useKeyboardEdit` — Delete key + selection 존재 | `onDeleteRange` 호출, 인수 = CellCoord 배열 |
| UT-002 | Delete key + selection null | no-op (onDeleteRange 미호출) |
| UT-003 | Delete key + isEditableColumn 모두 false | no-op (편집 불가 컬럼만) |
| UT-004 | F2 key + activeCell 존재 | `onEditStart({row, col})` 호출 |
| UT-005 | F2 key + activeCell null | no-op |
| UT-006 | Enter key + 단일 셀 선택 | `onEditStart` 호출 + `e.defaultPrevented === true` |
| UT-007 | Enter key + 다중 셀 범위 선택 | `onEditStart` 미호출, `e.defaultPrevented === false` (G-002 위임) |
| UT-008 | printable key 'A' + range 선택 | `onBulkEdit(cells, 'A')` 호출 |
| UT-009 | printable key + Ctrl 조합 | no-op (단축키 처리) |
| UT-010 | printable key + isComposing=true | no-op (IME 조합 중) |
| UT-011 | printable key + 단일 셀 | `onEditStart(activeCell, 'A')` 호출 (bulk 미호출) |
| UT-012 | onDeleteRange undefined + Delete key | no-op (crash 없음) |

### 12.2 Self-review 체크리스트

- [ ] D# breakdown (Section 0) ↔ Section 7 파일 목록 100% 일치 (NEW 2 + MODIFY 2 = 4)
- [ ] Section 7 ↔ Section 11 Step 모든 파일 1:1 매핑 확인 (E-01)
- [ ] Section 2 시그니처 ↔ Section 11 Before/After 시그니처 1:1 일치 (E-01 cross-check)
- [ ] Section 7 본문에 "재결정 | 대신 | 대체 | 수정함" 키워드 없음 (E-06)
- [ ] `@ts-ignore` 검색 결과 0건 (B-06)
- [ ] `as any` 검색 결과 0건 (C-4)
- [ ] `declare const` for non-exported 심볼 없음 (B-06)
- [ ] Wijmo import 검색 결과 0건 (C-16)
- [ ] AG Grid import 검색 결과 0건 (C-7)
- [ ] CSS 파일 신규 생성 없음 (C-5)
- [ ] `_verifyGridLicenseStub` inline function 패턴 (ADR-MOD-GRID-11-002)
- [ ] C-29 optional props spread-skip 패턴 (5개 props)
- [ ] `e.key as unknown as TCell` — `unknown` 경유, `any` 미사용 (C-4)
- [ ] goals.json L309 migrationImpact = "medium" (C-32)
- [ ] D5 Enter 분기 — `isSingleCell(selection)` 로직 검증
- [ ] D6 IME 검사 — `e.nativeEvent.isComposing` 타입 확인
- [ ] G-005 onKeyDown을 G-002 handleKeyDown 앞에 배치하는 합성 순서 Section 10.1에 명시

### 12.3 빌드 검증

- `npx tsc --noEmit` → 0 errors (AC-005, C-12)
- `tsup build` → dist 생성 + +2 KB 이내 (C-21)
- `size-limit` → ≤ 20 KB (C-21)

### 12.4 시각 회귀

- affectedUsageFiles: 0개 → N/A (C-17 N/A 조건 충족)

---

## Section 13: 상업화 노트

### 13.1 Pro Tier 위치

`@tomis/grid-pro-range/useKeyboardEdit`는 **Pro tier** 기능이다.

- `_verifyGridLicenseStub` → MOD-GRID-99-A/G-002 완료 후 실제 EULA 라이선스 검증으로 교체
- G-001/G-002/G-004 inline stub 패턴 재사용 (ADR-MOD-GRID-11-002)

### 13.2 번들 영향

| 항목 | 수치 |
|------|------|
| G-005 예상 번들 증가 | **+2 KB** (gzip) |
| 누적 grid-pro-range | G-001(4) + G-002(2) + G-003(3) + G-004(2) + G-005(2) = **13 KB** |
| C-21 한도 | ≤ 20 KB |
| G-006 여유 | 7 KB (G-006 +2 KB 예상 → 최종 15 KB) |
| 상태 | ✓ 준수 |

### 13.3 Breaking Change 없음

- `types.ts` 추가만 (기존 타입 미변경)
- `index.ts` 추가 export만 (기존 export 미제거)
- G-001/G-002/G-003/G-004 소비자 코드 변경 불필요

### 13.4 문서화 계획 (C-25)

- Docusaurus 페이지: `@tomis/grid-pro-range/useKeyboardEdit` API reference
- Storybook: `useKeyboardEdit.stories.tsx` — Delete + BulkEdit + EditStart 시나리오
- JSDoc: 모든 export 함수/타입에 JSDoc 의무 (C-25)
- 합성 순서 가이드: G-005 → G-002 → G-004 체인 순서 명시 (D5 Enter 우선순위)
