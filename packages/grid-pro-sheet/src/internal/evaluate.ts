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
import { colToLetters, expandRange, parseA1, toA1 } from './cellAddress.js';
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
  // MOD-GRID-41: qualify 가 단 keyPrefix('' | 'Sheet2!')로 확장 셀을 시트 키화. 기본='' → byte-identical.
  if (ast.kind === 'range') {
    const prefix = ast.keyPrefix ?? '';
    return expandRange(ast.from, ast.to).map((c) => getCell(prefix + c));
  }
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
    case 'err':
      return cellError(ast.code); // MOD-GRID-40 G-2: error-literal (e.g. #REF! from a translate)
    case 'name':
      return cellError('#NAME?'); // MOD-GRID-41: un-inlined name = unresolved (qualify normally inlines the target)
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
      case 'range': {
        const prefix = a.keyPrefix ?? ''; // MOD-GRID-41: cross-sheet 키 접두
        for (const r of expandRange(a.from, a.to)) refs.add(prefix + r);
        break;
      }
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

// ─── MOD-GRID-41: multi-sheet qualification + named-range resolution ───

/** Workbook default sheet — its cells are keyed WITHOUT a prefix (so single-sheet keys stay bare). */
export const DEFAULT_SHEET = 'Sheet1';

/** Context for compiling a formula: the sheet it lives on + the workbook name table. */
export interface CompileContext {
  homeSheet?: string; // sheet of the cell holding this formula (bare refs qualify to it)
  defaultSheet?: string; // workbook default (unprefixed keys)
  nameTable?: Map<string, string>; // name → target ('A1' | 'A1:B2' | 'Sheet2!A1')
}

/** Storage key for a cell: bare on the default sheet, `Sheet!A1` otherwise. */
export function keyOf(sheet: string | undefined, a1: string, defaultSheet: string): string {
  return sheet && sheet !== defaultSheet ? `${sheet}!${a1}` : a1;
}

/**
 * Fold sheet qualifiers into `ref` keys and inline named ranges to their targets, so the resulting
 * AST carries fully-qualified keys and `evaluate`/`extractRefs` stay key-based (byte-identical for
 * single-sheet). Unresolved names → `#NAME?` (eval-time). Names are inlined here, so a later
 * `defineName` requires recompiling dependent cells (createSheet does this).
 */
export function qualifyAst(ast: Ast, ctx: CompileContext): Ast {
  const defaultSheet = ctx.defaultSheet ?? DEFAULT_SHEET;
  const homeSheet = ctx.homeSheet ?? defaultSheet;
  const q = (a: Ast): Ast => {
    switch (a.kind) {
      case 'num': case 'str': case 'bool': case 'err':
        return a;
      case 'ref':
        return { kind: 'ref', ref: keyOf(a.sheet ?? homeSheet, a.ref, defaultSheet) };
      case 'range': {
        const sheet = a.sheet ?? homeSheet;
        return { kind: 'range', from: a.from, to: a.to, keyPrefix: sheet !== defaultSheet ? `${sheet}!` : '' };
      }
      case 'name': {
        const target = ctx.nameTable?.get(a.name);
        if (target === undefined) return { kind: 'err', code: '#NAME?' };
        let targetAst: Ast;
        try { targetAst = parseFormula(target); } catch { return { kind: 'err', code: '#NAME?' }; }
        if (targetAst.kind === 'name') return { kind: 'err', code: '#NAME?' }; // 명명→명명 체인 비허용(PoC, no-loop)
        // 명명 타깃의 bare ref 는 글로벌(기본 시트) 기준. 타깃이 Sheet2! 명시면 그대로 보존.
        return qualifyAst(targetAst, { defaultSheet, homeSheet: defaultSheet, ...(ctx.nameTable && { nameTable: ctx.nameTable }) });
      }
      case 'unary': return { kind: 'unary', op: '-', operand: q(a.operand) };
      case 'binary': return { kind: 'binary', op: a.op, left: q(a.left), right: q(a.right) };
      case 'call': return { kind: 'call', name: a.name, args: a.args.map(q) };
    }
  };
  return q(ast);
}

/** Compile a cell's raw input: a `=`-prefixed formula (parsed + qualified + refs), else a literal. */
export function compileCell(raw: string, ctx: CompileContext = {}): CompiledCell {
  if (raw.startsWith('=')) {
    try {
      const ast = qualifyAst(parseFormula(raw.slice(1)), ctx);
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

// ─── MOD-GRID-40 G-2: formula serialization + copy/fill translation ───

/** Operator precedence (low→high) for parenthesis-minimal serialization. Primary leaves = 5. */
function prec(ast: Ast): number {
  if (ast.kind === 'binary') {
    switch (ast.op) {
      case '<': case '>': case '=': case '<=': case '>=': case '<>': return 1;
      case '+': case '-': return 2;
      case '*': case '/': return 3;
    }
  }
  return ast.kind === 'unary' ? 4 : 5;
}

/** Render a normalized address + abs flags → A1 text (`$A$1` / `$A1` / `A$1` / `A1`). */
function refText(ref: string, colAbs?: boolean, rowAbs?: boolean): string {
  const { col, row } = parseA1(ref);
  return `${colAbs ? '$' : ''}${colToLetters(col)}${rowAbs ? '$' : ''}${row + 1}`;
}

/**
 * Serialize an {@link Ast} back to formula text (no leading `=`). Parenthesizes only where
 * precedence/associativity require, so `serialize(parse(x))` round-trips to an equivalent formula.
 * Strings re-quote (the tokenizer has no escapes, so any string it produced round-trips verbatim).
 */
export function serializeAst(ast: Ast): string {
  switch (ast.kind) {
    case 'num': return String(ast.value);
    case 'str': return `"${ast.value}"`;
    case 'bool': return ast.value ? 'TRUE' : 'FALSE';
    case 'ref': return `${ast.sheet ? `${ast.sheet}!` : ''}${refText(ast.ref, ast.colAbs, ast.rowAbs)}`;
    case 'range':
      return `${ast.sheet ? `${ast.sheet}!` : ''}${refText(ast.from, ast.fromColAbs, ast.fromRowAbs)}:${refText(ast.to, ast.toColAbs, ast.toRowAbs)}`;
    case 'name': return ast.name; // MOD-GRID-41
    case 'err': return ast.code;
    case 'unary': {
      const o = serializeAst(ast.operand);
      return `-${prec(ast.operand) < 4 ? `(${o})` : o}`;
    }
    case 'binary': {
      const p = prec(ast);
      const ls = serializeAst(ast.left);
      const rs = serializeAst(ast.right);
      const lWrap = prec(ast.left) < p;
      // right operand: wrap if lower precedence, or equal-precedence under a non-commutative op
      // (`a-(b-c)` ≠ `a-b-c`, `a/(b/c)` ≠ `a/b/c`).
      const rWrap = prec(ast.right) < p || (prec(ast.right) === p && (ast.op === '-' || ast.op === '/'));
      return `${lWrap ? `(${ls})` : ls}${ast.op}${rWrap ? `(${rs})` : rs}`;
    }
    case 'call':
      return `${ast.name}(${ast.args.map(serializeAst).join(',')})`;
  }
}

/** Shift a normalized address by (dCol,dRow) honoring abs axes; `null` if it goes out of bounds. */
function shiftAddr(
  addr: string,
  colAbs: boolean | undefined,
  rowAbs: boolean | undefined,
  dCol: number,
  dRow: number,
): string | null {
  const { col, row } = parseA1(addr);
  const nc = colAbs ? col : col + dCol;
  const nr = rowAbs ? row : row + dRow;
  if (nc < 0 || nr < 0) return null;
  return toA1(nc, nr);
}

/** Recursively shift every relative ref/range in an AST; out-of-bounds → `#REF!` error leaf. */
function shiftAst(ast: Ast, dCol: number, dRow: number): Ast {
  switch (ast.kind) {
    case 'num': case 'str': case 'bool': case 'err': case 'name':
      return ast; // MOD-GRID-41: name 노드는 fill 시 이동 안 함(명명은 위치 불변)
    case 'ref': {
      const moved = shiftAddr(ast.ref, ast.colAbs, ast.rowAbs, dCol, dRow);
      return moved === null
        ? { kind: 'err', code: '#REF!' }
        : {
            kind: 'ref',
            ref: moved,
            colAbs: ast.colAbs ?? false,
            rowAbs: ast.rowAbs ?? false,
            ...(ast.sheet !== undefined && { sheet: ast.sheet }), // MOD-GRID-41: 시트 접두 보존
          };
    }
    case 'range': {
      const from = shiftAddr(ast.from, ast.fromColAbs, ast.fromRowAbs, dCol, dRow);
      const to = shiftAddr(ast.to, ast.toColAbs, ast.toRowAbs, dCol, dRow);
      return from === null || to === null
        ? { kind: 'err', code: '#REF!' }
        : {
            kind: 'range',
            from,
            to,
            fromColAbs: ast.fromColAbs ?? false,
            fromRowAbs: ast.fromRowAbs ?? false,
            toColAbs: ast.toColAbs ?? false,
            toRowAbs: ast.toRowAbs ?? false,
            ...(ast.sheet !== undefined && { sheet: ast.sheet }),
          };
    }
    case 'unary':
      return { kind: 'unary', op: '-', operand: shiftAst(ast.operand, dCol, dRow) };
    case 'binary':
      return { kind: 'binary', op: ast.op, left: shiftAst(ast.left, dCol, dRow), right: shiftAst(ast.right, dCol, dRow) };
    case 'call':
      return { kind: 'call', name: ast.name, args: ast.args.map((a) => shiftAst(a, dCol, dRow)) };
  }
}

/**
 * MOD-GRID-40 G-2: translate a formula for a copy/fill by (dCol,dRow) cells. Relative refs shift,
 * absolute (`$`) axes stay fixed; a ref shifted out of bounds becomes `#REF!`. Non-formula cells
 * (no leading `=`) and unparseable formulas are returned verbatim (mirrors {@link compileCell}'s
 * catch — downstream compile turns a bad formula into `#ERROR!`).
 */
export function translateFormula(raw: string, dCol: number, dRow: number): string {
  if (!raw.startsWith('=')) return raw;
  let ast: Ast;
  try {
    ast = parseFormula(raw.slice(1));
  } catch {
    return raw;
  }
  return `=${serializeAst(shiftAst(ast, dCol, dRow))}`;
}
