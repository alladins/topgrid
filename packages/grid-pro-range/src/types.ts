/**
 * @topgrid/grid-pro-range — Core types for CellRange selection + Drag-fill (G-003).
 *
 * CellCoord: 2D grid coordinate (row/col index, 0-based).
 * CellRange: Rectangular region defined by start + end CellCoord.
 * RangeSelectGridProps: Props for the RangeSelectGrid component (AC-001, AC-010).
 * FillDirection: 4-way fill direction (G-003, D5).
 * CellUpdate: Single cell update unit for drag-fill (G-003, AC-002).
 * DragFillHandleProps: Props for DragFillHandle component (G-003, AC-003).
 */
import type { ColumnDef } from '@tanstack/react-table';
import type { RefObject } from 'react';
// W1 Phase 0: 순수 범위 타입(CellCoord/CellRange/CellUpdate/FillDirection)은
// @topgrid/grid-core-headless 로 이관. 내부 prop 타입 사용(import) + 소비처 보존(re-export).
import type { CellCoord, CellRange, CellUpdate, FillDirection } from '@topgrid/grid-core-headless';
export type { CellCoord, CellRange, CellUpdate, FillDirection };

// (CellRange 는 상단 @topgrid/grid-core-headless import+re-export.)

/**
 * RangeSelectGrid props (L0 backward-compat 포함 — AC-010).
 *
 * C-29 (exactOptionalPropertyTypes): optional 필드는 '?: T' 선언.
 * 전달 시 spread-skip 패턴 사용 (Section 6.6).
 */
export interface RangeSelectGridProps<TData extends object> {
  data: TData[];
  columns: ColumnDef<TData>[];
  onRangeChange?: (range: CellRange | null) => void;
  loading?: boolean;
  emptyText?: string;
  className?: string;
}

// ── G-003: Drag-fill types ────────────────────────────────────────────────────

// (FillDirection 은 상단 @topgrid/grid-core-headless import+re-export.)

// (CellUpdate 는 상단 @topgrid/grid-core-headless import+re-export.)

/**
 * DragFillHandle 컴포넌트 Props (AC-003).
 *
 * C-29 (exactOptionalPropertyTypes): optional 필드는 '?: T' 선언.
 * 전달 시 spread-skip 패턴 사용 (spec Section 4.4).
 */
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
  containerRef: RefObject<HTMLElement>;
  /** 셀 크기 getter (px) — 드래그 위치 → cell coord 변환용. */
  getCellRect: (row: number, col: number) => { x: number; y: number; width: number; height: number };
}

// ── G-004: Clipboard types ────────────────────────────────────────────────────

/**
 * 붙여넣기 결과 메타정보 (AC-002 보완 — D8).
 * cells: 파싱된 CellUpdate 배열 (onPaste callback에 전달).
 * truncated: true이면 grid 경계 초과로 일부 셀 클램프됨.
 * rows: TSV 파싱 행 수.
 * cols: TSV 파싱 열 수.
 */
export interface PasteResult<TCell = unknown> {
  cells: CellUpdate<TCell>[];
  truncated: boolean;
  rows: number;
  cols: number;
}

/**
 * useClipboard hook props.
 *
 * C-29 (exactOptionalPropertyTypes): optional 필드는 '?: T' 선언.
 * 전달 시 spread-skip 패턴 사용 (spec Section 3.4 예시 참조).
 */
export interface UseClipboardProps<TData, TCell = unknown> {
  /** 현재 선택 범위 (useCellRange의 range). null이면 Ctrl+C no-op. */
  selection: CellRange | null;
  /** 현재 활성 셀 좌표 (useKeyboardNav의 activeCell). null이면 Ctrl+V no-op. */
  activeCell: CellCoord | null;
  /** 그리드 전체 행 수 (경계 clamp). */
  rowCount: number;
  /** 그리드 전체 열 수 (경계 clamp). */
  colCount: number;
  /** 셀 값 getter — 복사 시 매트릭스 추출용. */
  getCellValue: (row: number, col: number) => TCell;
  /** 붙여넣기 결과 콜백 (D3 MOD-GRID-10 분리). 미제공 시 붙여넣기 파싱만 수행. */
  onPaste?: (cells: CellUpdate<TCell>[]) => void;
  /** 클립보드 API 에러 핸들러 (권한 거부 등). */
  onError?: (error: Error) => void;
  /** TanStack Table 인스턴스 — 사용 안 함, 향후 확장용 optional. */
  table?: import('@tanstack/react-table').Table<TData>;
}

/** useClipboard hook 반환 타입. */
export interface UseClipboardReturn {
  /**
   * Grid container에 부착할 keydown 핸들러 (D7).
   * Ctrl+C → copyToClipboard, Ctrl+V → pasteFromClipboard 호출.
   * G-002 useKeyboardNav.handleKeyDown과 합성하여 사용.
   */
  onKeyDown: (e: React.KeyboardEvent) => void;
  /** Ctrl+C 프로그래매틱 복사. navigator.clipboard 비동기. */
  copyToClipboard: () => Promise<void>;
  /** Ctrl+V 프로그래매틱 붙여넣기. 명시적 tsvString 주입 가능 (Storybook/테스트용). */
  pasteFromClipboard: (tsvString?: string) => Promise<PasteResult>;
}

// ── G-005: Keyboard Edit types ────────────────────────────────────────────────

/**
 * useKeyboardEdit hook props.
 *
 * C-29 (exactOptionalPropertyTypes): optional 필드는 '?: T' 선언.
 * 전달 시 spread-skip 패턴 사용 (spec Section 10.1 예시 참조).
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

/**
 * useKeyboardEdit hook 반환 타입.
 */
export interface UseKeyboardEditReturn {
  /**
   * Grid container에 부착할 keydown 핸들러 (D7).
   * G-002 handleKeyDown / G-004 onKeyDown과 컴포저블 결합.
   * Caller는 G-005 onKeyDown을 체인 앞에 배치 (D5 Enter 우선순위).
   */
  onKeyDown: (e: React.KeyboardEvent) => void;
}

// ── G-006: RangeSelectGridAllProps ───────────────────────────────────────────

/**
 * G-006 확장 props — G-001 6-prop 유지 + 5개 enable 플래그 + 7개 callback (AC-001, C-6, C-29).
 *
 * enable* 플래그 설계 원칙 (D4, D5):
 *   - 모든 hook은 무조건 호출 (Rules of Hooks 준수)
 *   - enable* = false → hook 내부 early return (동작 게이팅)
 *   - DragFillHandle: 컴포넌트이므로 조건부 렌더 허용
 */
export interface RangeSelectGridAllProps<TData extends object, TCell = unknown>
  extends RangeSelectGridProps<TData> {
  // ── enable 플래그 (D4) ─────────────────────────────────────────────────
  /** 마우스 드래그 / Shift+Click 범위 선택 (default: true). */
  enableRangeSelection?: boolean;
  /** Arrow/Ctrl+Arrow 키보드 내비게이션 (default: true). */
  enableKeyboardNav?: boolean;
  /** Drag-fill 핸들 렌더링 + 채우기 기능 (default: false). */
  enableDragFill?: boolean;
  /** Ctrl+C/V 클립보드 (default: false). */
  enableClipboard?: boolean;
  /** Delete/F2/Enter/printable key 편집 트리거 (default: false). */
  enableKeyboardEdit?: boolean;
  /** @tanstack/react-virtual 가상화 (default: false, C-18). */
  enableVirtualization?: boolean;

  // ── 셀 값 getter (G-003/G-004 공유) ──────────────────────────────────
  /** 셀 값 getter — drag-fill 계산 + clipboard 복사용 (AC-001). */
  getCellValue?: (row: number, col: number) => TCell;

  // ── G-003 DragFillHandle callbacks ────────────────────────────────────
  /** Drag-fill 완료 콜백 (D3 MOD-GRID-10 분리). */
  onFillComplete?: (cells: CellUpdate<TCell>[]) => void;
  /** Drag-fill target 범위 변경 알림 (점선 outline). */
  onFillTargetChange?: (target: CellRange | null) => void;

  // ── G-004 useClipboard callbacks ─────────────────────────────────────
  /** 붙여넣기 결과 콜백 (D3 MOD-GRID-10 분리). */
  onPaste?: (cells: CellUpdate<TCell>[]) => void;
  /** 클립보드 API 에러 핸들러 (권한 거부 등). */
  onClipboardError?: (error: Error) => void;

  // ── G-005 useKeyboardEdit callbacks ───────────────────────────────────
  /** 컬럼 편집 가능 여부 판별. 미제공 시 전체 편집 가능. */
  isEditableColumn?: (colIndex: number) => boolean;
  /** Delete 키 범위 삭제 콜백 (D3 MOD-GRID-10 분리). */
  onDeleteRange?: (cells: CellCoord[]) => void;
  /** 범위 일괄 입력 콜백 (D3 MOD-GRID-10 분리). */
  onBulkEdit?: (cells: CellCoord[], value: TCell) => void;
  /** F2/Enter 단일 셀 편집 시작 콜백 (D4 MOD-GRID-05 분리). */
  onEditStart?: (cell: CellCoord, initialValue?: TCell) => void;
}
