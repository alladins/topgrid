/**
 * @topgrid/grid-pro-range — useKeyboardEdit hook (G-005).
 *
 * Delete 키: 선택 범위 내 편집 가능 컬럼 셀 초기화 → onDeleteRange callback (D3).
 * Printable key: 범위 전체 동일 값 입력 → onBulkEdit callback (D3, D6 IME 검사).
 * F2: 단일 활성 셀 편집 시작 → onEditStart callback (D4).
 * Enter: 단일 셀 선택 시 편집 시작(D5), 범위 선택 시 G-002에 위임.
 *
 * D3: onDeleteRange / onBulkEdit callback — MOD-GRID-10 분리.
 * D4: onEditStart callback — MOD-GRID-05 InlineEditCell 분리.
 * D5: Enter 키 충돌 해소 — 단일 셀 선택 시에만 편집 소비.
 * D6: printable key 감지 — isComposing 검사 포함.
 * D7: onKeyDown 반환 — G-002/G-004와 컴포저블 결합.
 * ADR-MOD-GRID-11-006: 2D matrix iteration (isInRange 패턴 재사용).
 */
import { useCallback } from 'react';
import type {
  CellCoord,
  CellRange,
  UseKeyboardEditProps,
  UseKeyboardEditReturn,
} from './types';

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

/**
 * useKeyboardEdit — Delete/F2/Enter/printable key 분기 hook.
 *
 * @returns `{ onKeyDown }` — Grid container에 부착할 keydown 핸들러 (D7).
 *
 * @example
 * ```tsx
 * const { onKeyDown: editKeyDown } = useKeyboardEdit({ selection, activeCell, ... });
 * // D7: G-005 앞에 배치 (D5 Enter 우선순위)
 * const onKeyDown = useCallback((e: React.KeyboardEvent) => {
 *   editKeyDown(e);
 *   if (e.defaultPrevented) return;
 *   navKeyDown(e);   // G-002
 *   clipKeyDown(e);  // G-004
 * }, [editKeyDown, navKeyDown, clipKeyDown]);
 * ```
 */
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
      // ── Delete / Backspace 키 (AC-001) ─────────────────────────────────
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
        if (activeCell === null) return; // EC-003: activeCell null → no-op
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
        if (!singleCell) return; // EC-004: 범위 선택 시 G-002 handleKeyDown에 위임
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
        !e.nativeEvent.isComposing; // EC-007: IME 조합 중 제외 (D6)

      if (isPrintable) {
        if (selection === null) return; // EC-001: selection null → no-op

        const cells = getEditableCells(selection, resolvedIsEditable);
        if (cells.length === 0) return;

        // printable key는 e.preventDefault() 생략 — 브라우저 기본 input 동작 유지.
        // 단일 셀의 경우 onEditStart + initialValue 호출 (AC-003 연동, EC-009)
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
