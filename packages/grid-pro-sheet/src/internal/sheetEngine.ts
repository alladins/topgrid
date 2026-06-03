/**
 * `createSheet` — dependency-graph recalculation engine (MOD-GRID-26 G-2), React-free and
 * node-verifiable. Holds the cell store + forward/reverse dependency graph; on a cell edit it
 * recomputes only the affected cells (the edited cell + its transitive dependents) in topological
 * order, each exactly once.
 *
 * ★ Spine (advisor — all node-decidable):
 * 1. **Cycle detection** — `A1=B1, B1=A1` → both `#CYCLE!`, with **no stack overflow** (an explicit
 *    visit stack, not naive recursion through `evaluate`).
 * 2. **Transitive recalc order** — `A1=1, B1=A1+1, C1=B1+1`; edit A1 → B1 then C1, each once, in
 *    dependency order.
 * 3. **Error propagation through the graph** — `A1=1/0` → `B1=A1+1` is `#DIV/0!` (getCell returns
 *    the upstream error, which propagates).
 */

import { cellError, isCellError, type CellValue, type CompiledCell } from '../types.js';
import { compileCell, evaluate, formatValue } from './evaluate.js';

/** A recomputed cell (in recompute order). */
export interface SheetChange {
  ref: string;
  value: CellValue;
}

export interface Sheet {
  /** Set a cell's raw input; recomputes affected cells and notifies via `onChange`. */
  setCell(ref: string, raw: string): void;
  /** Current computed value of a cell (`''` if unset). */
  getValue(ref: string): CellValue;
  /** Current raw input of a cell (`''` if unset). */
  getRaw(ref: string): string;
  /** Display string for a cell (errors → code). */
  getDisplay(ref: string): string;
}

export function createSheet(onChange?: (changes: SheetChange[]) => void): Sheet {
  const raw = new Map<string, string>();
  const compiled = new Map<string, CompiledCell>();
  const values = new Map<string, CellValue>();
  const deps = new Map<string, Set<string>>(); // ref → cells it depends on
  const dependents = new Map<string, Set<string>>(); // ref → cells depending on it

  const getValue = (ref: string): CellValue => values.get(ref) ?? '';

  const setForwardDeps = (ref: string, refs: string[]): void => {
    // remove old reverse links
    for (const d of deps.get(ref) ?? []) dependents.get(d)?.delete(ref);
    const set = new Set(refs);
    deps.set(ref, set);
    for (const d of set) {
      let rev = dependents.get(d);
      if (!rev) { rev = new Set(); dependents.set(d, rev); }
      rev.add(ref);
    }
  };

  // edited cell + all transitive dependents.
  const downstream = (start: string): Set<string> => {
    const out = new Set<string>([start]);
    const queue = [start];
    while (queue.length) {
      const cur = queue.shift()!;
      for (const dep of dependents.get(cur) ?? []) {
        if (!out.has(dep)) { out.add(dep); queue.push(dep); }
      }
    }
    return out;
  };

  const recompute = (affected: Set<string>): SheetChange[] => {
    // topological order of `affected` (deps before dependents) + cycle marking, via an explicit
    // stack — never recurses through evaluate(), so a formula cycle cannot overflow the stack.
    const order: string[] = [];
    const done = new Set<string>();
    const onStack = new Set<string>();
    const stack: string[] = [];
    const cyclic = new Set<string>();

    const visit = (n: string): void => {
      if (done.has(n)) return;
      if (onStack.has(n)) {
        const idx = stack.indexOf(n);
        for (let i = idx; i < stack.length; i++) cyclic.add(stack[i]!);
        return;
      }
      stack.push(n);
      onStack.add(n);
      for (const d of deps.get(n) ?? []) {
        if (affected.has(d)) visit(d);
      }
      onStack.delete(n);
      stack.pop();
      done.add(n);
      order.push(n);
    };
    for (const n of affected) visit(n);

    const changes: SheetChange[] = [];
    for (const ref of order) {
      const prev = values.get(ref);
      let next: CellValue;
      if (cyclic.has(ref)) {
        next = cellError('#CYCLE!');
      } else {
        const c = compiled.get(ref);
        next = !c || c.kind === 'literal' ? c?.value ?? '' : evaluate(c.ast, getValue);
      }
      values.set(ref, next);
      if (!sameValue(prev, next)) changes.push({ ref, value: next });
    }
    return changes;
  };

  return {
    setCell(ref, input) {
      raw.set(ref, input);
      const c = compileCell(input);
      compiled.set(ref, c);
      setForwardDeps(ref, c.kind === 'formula' ? c.refs : []);
      const changes = recompute(downstream(ref));
      if (onChange && changes.length > 0) onChange(changes);
    },
    getValue,
    getRaw: (ref) => raw.get(ref) ?? '',
    getDisplay: (ref) => formatValue(getValue(ref)),
  };
}

function sameValue(a: CellValue | undefined, b: CellValue): boolean {
  if (a === undefined) return false;
  if (isCellError(a) || isCellError(b)) {
    return isCellError(a) && isCellError(b) && a.error === b.error;
  }
  return a === b;
}
