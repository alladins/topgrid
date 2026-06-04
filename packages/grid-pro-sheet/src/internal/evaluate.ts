/**
 * Formula evaluator + ref extraction + cell compilation (MOD-GRID-26 G-1) — pure.
 *
 * `evaluate(ast, getCell)` resolves A1 refs through the injected {@link CellGetter}
 * (PAT-005 host-capability-injection) so the engine never touches a cell store. Errors propagate
 * through every operator and function. `extractRefs(ast)` reads the dependency set off the SAME
 * parse (G-2 never re-parses).
 */

import {
  cellError,
  isCellError,
  type Ast,
  type CellValue,
  type CellError,
  type CellGetter,
  type CompiledCell,
} from '../types.js';
import { expandRange } from './cellAddress.js';
import { parseFormula } from './parser.js';
import { FUNCTIONS, POSITIONAL_FUNCTIONS } from './functions.js';

/** Coerce a value to a number for arithmetic; non-numeric text → `#ERROR!`. */
function toNumber(v: CellValue): number | CellError {
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'string') {
    if (v.trim() === '') return 0; // empty cell behaves as 0 in arithmetic (Excel)
    const n = Number(v);
    return Number.isFinite(n) ? n : cellError('#ERROR!');
  }
  return cellError('#ERROR!');
}

/** MOD-GRID-32 G-1: 조건/논리에서 진리값 판정. boolean→자신, number→0 아님, 그 외(문자열)→#ERROR!. */
function toBool(v: CellValue): boolean | CellError {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  return cellError('#ERROR!');
}

/** MOD-GRID-32 G-1: 동등 비교 — 강제 변환 없이 같은 타입 + 같은 값일 때만 true(number 4 ≠ string "4"). */
function valuesEqual(l: CellValue, r: CellValue): boolean {
  return typeof l === typeof r && l === r;
}

/**
 * MOD-GRID-32 G-1: type-aware 비교(→boolean). 기존 binary 의 toNumber 산술 경로와 **분리** — 비교를 거기
 * 끼우면 `"a"="a"` 가 toNumber("a")=#ERROR! 로 깨진다. 동등(`=`/`<>`)=타입+값. 순서(`<` 등)=둘 다 문자열이면
 * lexical, 아니면 수치 강제(bool→1/0, 비수치 문자열→#ERROR!).
 */
function compareValues(
  l: CellValue,
  r: CellValue,
  op: '<' | '>' | '=' | '<=' | '>=' | '<>',
): CellValue {
  if (op === '=') return valuesEqual(l, r);
  if (op === '<>') return !valuesEqual(l, r);
  if (typeof l === 'string' && typeof r === 'string') {
    const c = l < r ? -1 : l > r ? 1 : 0;
    return op === '<' ? c < 0 : op === '>' ? c > 0 : op === '<=' ? c <= 0 : c >= 0;
  }
  const ln = toNumber(l);
  if (isCellError(ln)) return ln;
  const rn = toNumber(r);
  if (isCellError(rn)) return rn;
  return op === '<' ? ln < rn : op === '>' ? ln > rn : op === '<=' ? ln <= rn : ln >= rn;
}

/** Evaluate one argument to a value list (a range expands; a scalar is a singleton). */
function evalArgValues(ast: Ast, getCell: CellGetter): CellValue[] {
  if (ast.kind === 'range') return expandRange(ast.from, ast.to).map(getCell);
  return [evaluate(ast, getCell)];
}

/** Evaluate a formula AST to a scalar {@link CellValue}. Errors propagate; never throws. */
export function evaluate(ast: Ast, getCell: CellGetter): CellValue {
  switch (ast.kind) {
    case 'num':
      return ast.value;
    case 'str':
      return ast.value;
    case 'bool':
      return ast.value;
    case 'ref':
      return getCell(ast.ref);
    case 'range':
      return cellError('#ERROR!'); // a range has no scalar value
    case 'unary': {
      const v = evaluate(ast.operand, getCell);
      if (isCellError(v)) return v;
      const n = toNumber(v);
      return isCellError(n) ? n : -n;
    }
    case 'binary': {
      const l = evaluate(ast.left, getCell);
      if (isCellError(l)) return l;
      const r = evaluate(ast.right, getCell);
      if (isCellError(r)) return r;
      // MOD-GRID-32 G-1: 비교연산자는 toNumber 산술 경로 우회(type-aware, →boolean).
      switch (ast.op) {
        case '<': case '>': case '=': case '<=': case '>=': case '<>':
          return compareValues(l, r, ast.op);
      }
      const ln = toNumber(l);
      if (isCellError(ln)) return ln;
      const rn = toNumber(r);
      if (isCellError(rn)) return rn;
      switch (ast.op) {
        case '+': return ln + rn;
        case '-': return ln - rn;
        case '*': return ln * rn;
        case '/': return rn === 0 ? cellError('#DIV/0!') : ln / rn;
      }
    }
    // eslint-disable-next-line no-fallthrough
    case 'call': {
      // MOD-GRID-32 G-1: IF 만 lazy — cond 평가 후 취한 분기 1개만 평가(미취 분기의 에러 미전파).
      // parse/extractRefs 는 평범한 call 로 둬 세 분기 ref 가 모두 정적 추적된다(recalc 정확).
      if (ast.name === 'IF') {
        const cond = evaluate(ast.args[0]!, getCell);
        if (isCellError(cond)) return cond;
        const b = toBool(cond);
        if (isCellError(b)) return b;
        if (b) return evaluate(ast.args[1]!, getCell);
        return ast.args[2] !== undefined ? evaluate(ast.args[2], getCell) : false;
      }
      // 가변/집계 함수(SUM·AND 등) = flat-values(range 전개).
      const fn = FUNCTIONS[ast.name];
      if (fn) {
        const values = ast.args.flatMap((a) => evalArgValues(a, getCell));
        return fn(values);
      }
      // MOD-GRID-32 G-2: 위치 함수(LEFT·ROUND 등) = **per-arg 스칼라**(경계 보존). range 인자는
      // evaluate(range)=#ERROR! 로 전파(flat 전개의 조용한 오독 방지).
      const pf = POSITIONAL_FUNCTIONS[ast.name];
      if (pf) {
        const args = ast.args.map((a) => evaluate(a, getCell));
        return pf(args);
      }
      return cellError('#ERROR!');
    }
  }
}

/** Cells this formula depends on (refs + expanded ranges), de-duplicated. */
export function extractRefs(ast: Ast): string[] {
  const refs = new Set<string>();
  const walk = (a: Ast): void => {
    switch (a.kind) {
      case 'ref':
        refs.add(a.ref);
        break;
      case 'range':
        for (const r of expandRange(a.from, a.to)) refs.add(r);
        break;
      case 'unary':
        walk(a.operand);
        break;
      case 'binary':
        walk(a.left);
        walk(a.right);
        break;
      case 'call':
        a.args.forEach(walk);
        break;
      default:
        break;
    }
  };
  walk(ast);
  return [...refs];
}

/** Coerce raw literal text → a {@link CellValue} (number / boolean / string; `""` for empty). */
export function coerceLiteral(raw: string): CellValue {
  if (raw === '') return '';
  const upper = raw.toUpperCase();
  if (upper === 'TRUE') return true;
  if (upper === 'FALSE') return false;
  const n = Number(raw);
  if (raw.trim() !== '' && Number.isFinite(n)) return n;
  return raw;
}

/** Compile a cell's raw input: a `=`-prefixed formula (parsed + refs), else a literal. */
export function compileCell(raw: string): CompiledCell {
  if (raw.startsWith('=')) {
    try {
      const ast = parseFormula(raw.slice(1));
      return { kind: 'formula', ast, refs: extractRefs(ast) };
    } catch {
      return { kind: 'literal', value: cellError('#ERROR!') };
    }
  }
  return { kind: 'literal', value: coerceLiteral(raw) };
}

/** Render a {@link CellValue} for display (errors → their code, booleans → TRUE/FALSE). */
export function formatValue(v: CellValue): string {
  if (isCellError(v)) return v.error;
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number') return String(v);
  return v;
}
