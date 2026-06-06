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
  // MOD-GRID-40 G-1: ref/range 노드는 **정규화 주소**(`ref`/`from`/`to`, `$` 제거·대문자)를 유지해
  // evaluate/extractRefs 가 byte-identical(=`$`는 eval-cosmetic, `$A$1`≡`A1`). 절대/혼합 플래그는 **optional**
  // 이며 copy/fill 의 `translateFormula` 만 소비(상대=델타 이동·절대=고정). 기존 무플래그 노드 = 전부 상대(하위호환).
  | { kind: 'ref'; ref: string; colAbs?: boolean; rowAbs?: boolean } // e.g. "A1", "$A$1"
  | {
      kind: 'range';
      from: string;
      to: string;
      fromColAbs?: boolean;
      fromRowAbs?: boolean;
      toColAbs?: boolean;
      toRowAbs?: boolean;
    } // e.g. A1:B3, $A1:B$3
  // MOD-GRID-40 G-2: error-literal leaf — translate 가 out-of-bounds 상대이동을 `#REF!` 로 텍스트화하고 그 출력이
  // 다시 파서를 통과해야 하므로(라운드트립) 문법 차원의 표현 필요. ref 없는 leaf → extractRefs 가 무시(안전).
  | { kind: 'err'; code: ErrorCode }
  | { kind: 'unary'; op: '-'; operand: Ast }
  // MOD-GRID-32 G-1: 비교연산자는 별도 노드 kind 가 아니라 binary op 확장 — extractRefs 의 정적 walk 가
  // 새 kind 를 모르면 의존 ref 누락→recalc 깨짐. binary 면 left/right 이미 walk 하므로 extractRefs 수정 0.
  | {
      kind: 'binary';
      op: '+' | '-' | '*' | '/' | '<' | '>' | '=' | '<=' | '>=' | '<>';
      left: Ast;
      right: Ast;
    }
  | { kind: 'call'; name: string; args: Ast[] };

/** Resolves an A1 cell reference to its current value (PAT-005 host-capability injection). */
export type CellGetter = (ref: string) => CellValue;

/** Result of compiling a cell's raw input. */
export type CompiledCell =
  | { kind: 'literal'; value: CellValue }
  | { kind: 'formula'; ast: Ast; refs: string[] };
