import { checkLicense } from '@tomis/grid-license';

checkLicense();

/**
 * @tomis/grid-pro-range — public API (MOD-GRID-11 / G-001, G-002, G-003).
 *
 * CellRange 모델 + 마우스 드래그/Shift+Click 셀 범위 선택 + Drag-fill.
 * AC-009: types, 함수, 훅, 컴포넌트 전부 named export.
 */

// Types (AC-001)
export type { CellCoord, CellRange, RangeSelectGridProps, RangeSelectGridAllProps } from './types';
// G-003 신규 타입 export (AC-009)
export type { CellUpdate, FillDirection, DragFillHandleProps } from './types';

// Pure functions (AC-002)
export { normalizeRange, isInRange } from './internal/normalize';
// G-003 순수 함수 export
export { fillRange, detectSeriesStep } from './internal/fillRange';

// Hook (AC-003, AC-004, AC-006)
export { useCellRange } from './useCellRange';
export type { UseCellRangeReturn } from './useCellRange';

// Component (AC-003, AC-004, AC-005, AC-006)
export { RangeSelectGrid } from './RangeSelectGrid';

// Keyboard navigation hook (G-002, AC-002~AC-007)
export { useKeyboardNav } from './useKeyboardNav';
export type { UseKeyboardNavOptions, UseKeyboardNavReturn } from './useKeyboardNav';
// G-003 컴포넌트 export
export { DragFillHandle } from './DragFillHandle';

// G-004 Clipboard (AC-001, AC-002, AC-003, AC-009)
export { useClipboard } from './useClipboard';
export type { PasteResult, UseClipboardProps, UseClipboardReturn } from './types';
export { stringifyTsv, parseTsv } from './internal/tsvUtils';

// G-005 Keyboard Edit (AC-001~AC-003, Delete/F2/Enter/printable key)
export { useKeyboardEdit } from './useKeyboardEdit';
export type { UseKeyboardEditProps, UseKeyboardEditReturn } from './types';
