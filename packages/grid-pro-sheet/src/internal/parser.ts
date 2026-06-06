/**
 * Formula tokenizer + recursive-descent parser (MOD-GRID-26 G-1) — pure, no React.
 *
 * Grammar (precedence low→high): addSub → mulDiv → unary → primary.
 * primary = number | string | bool | "(" expr ")" | ref [":" ref] | NAME "(" args ")".
 * `parseFormula` takes the text **after** the leading `=`. Throws on malformed input
 * (the caller — {@link compileCell} — turns a parse error into an `#ERROR!` literal).
 */

import type { Ast, ErrorCode } from '../types.js';

type Tok =
  | { t: 'num'; v: number }
  | { t: 'str'; v: string }
  | { t: 'name'; v: string }
  // MOD-GRID-40 G-1: ref 토큰은 정규화 주소 v + 절대/혼합 플래그를 동반.
  | { t: 'ref'; v: string; colAbs: boolean; rowAbs: boolean }
  | { t: 'err'; v: ErrorCode } // MOD-GRID-40 G-2: #REF! 등 error-literal
  | { t: 'op'; v: '+' | '-' | '*' | '/' }
  | { t: 'cmp'; v: '<' | '>' | '=' | '<=' | '>=' | '<>' } // MOD-GRID-32 G-1
  | { t: 'lparen' }
  | { t: 'rparen' }
  | { t: 'comma' }
  | { t: 'colon' };

// MOD-GRID-40 G-2: 알려진 에러 코드(translate 가 방출하는 #REF! 포함). 라운드트립 시 파서가 인식해야 함.
const ERROR_CODES: readonly string[] = ['#DIV/0!', '#CYCLE!', '#REF!', '#ERROR!'];

function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  const isDigit = (c: string) => c >= '0' && c <= '9';
  const isAlpha = (c: string) => (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z');
  while (i < src.length) {
    const c = src[i]!;
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue; }
    if (isDigit(c) || (c === '.' && isDigit(src[i + 1] ?? ''))) {
      let j = i;
      while (j < src.length && (isDigit(src[j]!) || src[j] === '.')) j++;
      toks.push({ t: 'num', v: Number(src.slice(i, j)) });
      i = j;
      continue;
    }
    if (c === '"') {
      let j = i + 1;
      let s = '';
      while (j < src.length && src[j] !== '"') { s += src[j]; j++; }
      if (src[j] !== '"') throw new Error('unterminated string');
      toks.push({ t: 'str', v: s });
      i = j + 1;
      continue;
    }
    // MOD-GRID-40 G-1: ref(절대/혼합 `$` 허용) 또는 name. ref = `$?LETTERS$?DIGITS`(후행 숫자 필수);
    // 숫자 없이 letters 만이면 name(SUM/TRUE). 함수명은 숫자로 안 끝남(현 함수셋) → 충돌 없음.
    if (c === '$' || isAlpha(c)) {
      const m = /^(\$?)([A-Za-z]+)(\$?)([0-9]+)/.exec(src.slice(i));
      if (m) {
        toks.push({
          t: 'ref',
          v: (m[2]! + m[4]!).toUpperCase(), // 정규화(`$` 제거)
          colAbs: m[1] === '$',
          rowAbs: m[3] === '$',
        });
        i += m[0]!.length;
        continue;
      }
      if (isAlpha(c)) {
        let j = i;
        while (j < src.length && isAlpha(src[j]!)) j++;
        toks.push({ t: 'name', v: src.slice(i, j).toUpperCase() }); // SUM / TRUE
        i = j;
        continue;
      }
      throw new Error(`unexpected char: ${c}`); // 외톨이 `$`
    }
    // MOD-GRID-40 G-2: error-literal `#…!`(translate 라운드트립). 알려진 코드만 허용.
    if (c === '#') {
      let j = i + 1;
      while (j < src.length && src[j] !== '!') j++;
      if (src[j] !== '!') throw new Error('unterminated error literal');
      const code = src.slice(i, j + 1);
      if (!ERROR_CODES.includes(code)) throw new Error(`unknown error literal: ${code}`);
      toks.push({ t: 'err', v: code as ErrorCode });
      i = j + 1;
      continue;
    }
    if (c === '+' || c === '-' || c === '*' || c === '/') { toks.push({ t: 'op', v: c }); i++; continue; }
    // MOD-GRID-32 G-1: 비교연산자(2자 <= >= <> 우선, 그 외 1자 < > =).
    if (c === '<' || c === '>' || c === '=') {
      const two = c + (src[i + 1] ?? '');
      if (two === '<=' || two === '>=' || two === '<>') { toks.push({ t: 'cmp', v: two }); i += 2; continue; }
      toks.push({ t: 'cmp', v: c as '<' | '>' | '=' }); i++; continue;
    }
    if (c === '(') { toks.push({ t: 'lparen' }); i++; continue; }
    if (c === ')') { toks.push({ t: 'rparen' }); i++; continue; }
    if (c === ',') { toks.push({ t: 'comma' }); i++; continue; }
    if (c === ':') { toks.push({ t: 'colon' }); i++; continue; }
    throw new Error(`unexpected char: ${c}`);
  }
  return toks;
}

export function parseFormula(src: string): Ast {
  const toks = tokenize(src);
  let pos = 0;
  const peek = (): Tok | undefined => toks[pos];
  const next = (): Tok => {
    const tk = toks[pos];
    if (!tk) throw new Error('unexpected end of formula');
    pos++;
    return tk;
  };

  const parseExpr = (): Ast => parseCompare();

  // MOD-GRID-32 G-1: 비교 = 최저 precedence(산술 아래). `=1+1=2` → (1+1)=2.
  function parseCompare(): Ast {
    let left = parseAddSub();
    let tk = peek();
    while (tk && tk.t === 'cmp') {
      next();
      const right = parseAddSub();
      left = { kind: 'binary', op: tk.v, left, right };
      tk = peek();
    }
    return left;
  }

  function parseAddSub(): Ast {
    let left = parseMulDiv();
    let tk = peek();
    while (tk && tk.t === 'op' && (tk.v === '+' || tk.v === '-')) {
      next();
      const right = parseMulDiv();
      left = { kind: 'binary', op: tk.v, left, right };
      tk = peek();
    }
    return left;
  }

  function parseMulDiv(): Ast {
    let left = parseUnary();
    let tk = peek();
    while (tk && tk.t === 'op' && (tk.v === '*' || tk.v === '/')) {
      next();
      const right = parseUnary();
      left = { kind: 'binary', op: tk.v, left, right };
      tk = peek();
    }
    return left;
  }

  function parseUnary(): Ast {
    const tk = peek();
    if (tk && tk.t === 'op' && tk.v === '-') {
      next();
      return { kind: 'unary', op: '-', operand: parseUnary() };
    }
    return parsePrimary();
  }

  function parsePrimary(): Ast {
    const tk = next();
    if (tk.t === 'num') return { kind: 'num', value: tk.v };
    if (tk.t === 'str') return { kind: 'str', value: tk.v };
    if (tk.t === 'lparen') {
      const e = parseExpr();
      if (next().t !== 'rparen') throw new Error('expected )');
      return e;
    }
    if (tk.t === 'name') {
      if (tk.v === 'TRUE') return { kind: 'bool', value: true };
      if (tk.v === 'FALSE') return { kind: 'bool', value: false };
      if (peek()?.t === 'lparen') {
        next(); // (
        const args: Ast[] = [];
        if (peek()?.t !== 'rparen') {
          args.push(parseExpr());
          while (peek()?.t === 'comma') { next(); args.push(parseExpr()); }
        }
        if (next().t !== 'rparen') throw new Error('expected )');
        return { kind: 'call', name: tk.v, args };
      }
      throw new Error(`unexpected name: ${tk.v}`);
    }
    if (tk.t === 'ref') {
      if (peek()?.t === 'colon') {
        next(); // :
        const to = next();
        if (to.t !== 'ref') throw new Error('expected cell ref after :');
        // MOD-GRID-40 G-1: range 는 endpoint 별 절대/혼합 플래그를 따로 보존(translate 4-플래그 bookkeeping).
        return {
          kind: 'range',
          from: tk.v,
          to: to.v,
          fromColAbs: tk.colAbs,
          fromRowAbs: tk.rowAbs,
          toColAbs: to.colAbs,
          toRowAbs: to.rowAbs,
        };
      }
      return { kind: 'ref', ref: tk.v, colAbs: tk.colAbs, rowAbs: tk.rowAbs };
    }
    if (tk.t === 'err') return { kind: 'err', code: tk.v }; // MOD-GRID-40 G-2
    throw new Error('unexpected token');
  }

  const ast = parseExpr();
  if (pos !== toks.length) throw new Error('trailing tokens');
  return ast;
}
