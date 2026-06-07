// @topgrid/grid-pro-sheet — public API
// MOD-GRID-26 / G-1: spreadsheet PoC — pure formula engine + Pro scaffold.
//
// REUSE ([[LESS-003]]): G-3 will reuse grid-pro-range editing/clipboard/range. The pivot's
// BUILT_IN_REDUCERS are NOT reused (ADR-002 / ADR-001 N=2 re-read): sheet functions are
// error-aware with sheet semantics (SUM([])=0, AVERAGE([])=#DIV/0!), a different input contract
// than the pivot's clean `number[]` + null-on-empty. The engine is pure (getCell injection =
// PAT-005) and node-verified.
//
// AP-001 vacuous: no external/optional peer is imported by the engine (grid-license is a required
// Pro runtime dep; react/range/grid-core are G-3 type-only peers).
import { checkLicense } from '@topgrid/grid-license';

// PAT-003 — module-load license gate.
checkLicense();

// G-1 pure formula engine.
export { parseFormula } from './internal/parser.js';
export {
  evaluate,
  extractRefs,
  compileCell,
  coerceLiteral,
  formatValue,
  // MOD-GRID-40 G-2: copy/fill 상대참조 조정 프리미티브 + AST→수식텍스트 serializer.
  translateFormula,
  serializeAst,
} from './internal/evaluate.js';
export { FUNCTIONS, POSITIONAL_FUNCTIONS } from './internal/functions.js';
export { parseA1, toA1, expandRange } from './internal/cellAddress.js';

// G-2 dependency-graph recalc engine (React-free, node-verified).
export { createSheet } from './internal/sheetEngine.js';
export type { Sheet, SheetChange } from './internal/sheetEngine.js';

// G-3 thin React surface (reuses grid-pro-range editing/clipboard).
export { useSheet } from './useSheet.js';
export type { UseSheetResult } from './useSheet.js';
export { SheetGrid } from './SheetGrid.js';
export type { SheetGridProps } from './SheetGrid.js';
// MOD-GRID-62: pure cell number-format + spec type (for the SheetGrid `formats` prop).
export { formatSheetValue } from './internal/formatSheetValue.js';
export type { SheetCellFormat } from './internal/formatSheetValue.js';
// MOD-GRID-63: pure cell style→CSS + spec type (for the SheetGrid `cellStyles` prop).
export { sheetStyleToCss } from './internal/sheetStyleToCss.js';
export type { SheetCellStyle } from './internal/sheetStyleToCss.js';

// Value model + AST.
export { cellError, isCellError } from './types.js';
export type {
  CellValue,
  CellError,
  ErrorCode,
  Ast,
  CellGetter,
  CompiledCell,
} from './types.js';
