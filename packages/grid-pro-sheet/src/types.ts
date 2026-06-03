/**
 * @topgrid/grid-pro-sheet — value model + AST (MOD-GRID-26 G-1).
 *
 * The value model is the load-bearing decision (advisor): every formula function takes
 * **error-aware** inputs and propagates errors, so a cyclic/broken cell always yields a defined
 * {@link CellValue} (never NaN/throw). Build the evaluator on this from the start.
 */

/** Spreadsheet error codes (PoC set). */
export type ErrorCode = '#DIV/0!' | '#CYCLE!' | '#REF!' | '#ERROR!';

/** An error value — propagated through arithmetic and functions. */
export interface CellError {
  readonly error: ErrorCode;
}

/** A resolved cell value. */
export type CellValue = number | string | boolean | CellError;

/** Construct an error value. */
export function cellError(code: ErrorCode): CellError {
  return { error: code };
}

/** Type guard for {@link CellError}. */
export function isCellError(v: unknown): v is CellError {
  return typeof v === 'object' && v !== null && typeof (v as { error?: unknown }).error === 'string';
}

// ─── AST ───

/** Formula AST node. */
export type Ast =
  | { kind: 'num'; value: number }
  | { kind: 'str'; value: string }
  | { kind: 'bool'; value: boolean }
  | { kind: 'ref'; ref: string } // e.g. "A1"
  | { kind: 'range'; from: string; to: string } // e.g. A1:B3
  | { kind: 'unary'; op: '-'; operand: Ast }
  | { kind: 'binary'; op: '+' | '-' | '*' | '/'; left: Ast; right: Ast }
  | { kind: 'call'; name: string; args: Ast[] };

/** Resolves an A1 cell reference to its current value (PAT-005 host-capability injection). */
export type CellGetter = (ref: string) => CellValue;

/** Result of compiling a cell's raw input. */
export type CompiledCell =
  | { kind: 'literal'; value: CellValue }
  | { kind: 'formula'; ast: Ast; refs: string[] };
