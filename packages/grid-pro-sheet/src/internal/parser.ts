/**
 * Formula tokenizer + recursive-descent parser (MOD-GRID-26 G-1) — pure, no React.
 *
 * Grammar (precedence low→high): addSub → mulDiv → unary → primary.
 * primary = number | string | bool | "(" expr ")" | ref [":" ref] | NAME "(" args ")".
 * `parseFormula` takes the text **after** the leading `=`. Throws on malformed input
 * (the caller — {@link compileCell} — turns a parse error into an `#ERROR!` literal).
 */

import type { Ast } from '../types.js';

type Tok =
  | { t: 'num'; v: number }
  | { t: 'str'; v: string }
  | { t: 'name'; v: string }
  | { t: 'ref'; v: string }
  | { t: 'op'; v: '+' | '-' | '*' | '/' }
  | { t: 'lparen' }
  | { t: 'rparen' }
  | { t: 'comma' }
  | { t: 'colon' };

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
    if (isAlpha(c)) {
      let j = i;
      while (j < src.length && isAlpha(src[j]!)) j++;
      const letters = src.slice(i, j);
      let k = j;
      while (k < src.length && isDigit(src[k]!)) k++;
      if (k > j) {
        toks.push({ t: 'ref', v: src.slice(i, k).toUpperCase() }); // A1
        i = k;
      } else {
        toks.push({ t: 'name', v: letters.toUpperCase() }); // SUM / TRUE
        i = j;
      }
      continue;
    }
    if (c === '+' || c === '-' || c === '*' || c === '/') { toks.push({ t: 'op', v: c }); i++; continue; }
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

  const parseExpr = (): Ast => parseAddSub();

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
        return { kind: 'range', from: tk.v, to: to.v };
      }
      return { kind: 'ref', ref: tk.v };
    }
    throw new Error('unexpected token');
  }

  const ast = parseExpr();
  if (pos !== toks.length) throw new Error('trailing tokens');
  return ast;
}
