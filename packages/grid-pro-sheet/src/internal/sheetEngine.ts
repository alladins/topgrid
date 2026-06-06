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
import { compileCell, evaluate, formatValue, keyOf, DEFAULT_SHEET } from './evaluate.js';

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
  /** MOD-GRID-32 G-3: 직전 셀 편집 취소(prev raw 재적용 + 재계산). 적용됐으면 true. */
  undo(): boolean;
  /** MOD-GRID-32 G-3: 취소한 편집 재적용. 적용됐으면 true. */
  redo(): boolean;
  /** 취소 가능 여부. */
  canUndo(): boolean;
  /** 재적용 가능 여부. */
  canRedo(): boolean;
  /** MOD-GRID-41: 명명 범위 정의/재정의(target='A1' | 'A1:B2' | 'Sheet2!A1'). 전 수식 셀 recompile-all. */
  defineName(name: string, target: string): void;
}

export function createSheet(onChange?: (changes: SheetChange[]) => void): Sheet {
  const raw = new Map<string, string>();
  const compiled = new Map<string, CompiledCell>();
  const values = new Map<string, CellValue>();
  const deps = new Map<string, Set<string>>(); // ref → cells it depends on
  const dependents = new Map<string, Set<string>>(); // ref → cells depending on it

  // MOD-GRID-41: 명명 테이블 + 키 헬퍼. 저장 키 = 기본시트 bare 'A1' · 비-기본 'Sheet2!A1'(단일 그래프).
  const nameTable = new Map<string, string>();
  /** public ref('A1' | 'Sheet2!A1' | 'Sheet1!A1') → 저장 키(기본시트는 bare). */
  const toKey = (publicRef: string): string => {
    const i = publicRef.indexOf('!');
    return i < 0 ? publicRef : keyOf(publicRef.slice(0, i), publicRef.slice(i + 1), DEFAULT_SHEET);
  };
  /** 저장 키 → 그 셀의 home 시트(bare 키 = 기본시트). */
  const homeOf = (key: string): string => {
    const i = key.indexOf('!');
    return i < 0 ? DEFAULT_SHEET : key.slice(0, i);
  };
  /** ★evaluate 에 주입되는 key-기반 조회(컴파일 ast 의 ref 는 qualified 키). */
  const getByKey = (key: string): CellValue => values.get(key) ?? '';

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
        next = !c || c.kind === 'literal' ? c?.value ?? '' : evaluate(c.ast, getByKey);
      }
      values.set(ref, next);
      if (!sameValue(prev, next)) changes.push({ ref, value: next });
    }
    return changes;
  };

  // 셀 raw 적용 + 증분 재계산(history 기록 없음 — setCell/undo/redo 가 공유). ref = 저장 키.
  // MOD-GRID-41: home 시트(키에서 도출)·nameTable 을 compile ctx 로 전달 → bare ref qualify·명명 inline.
  const applyCell = (ref: string, input: string): void => {
    raw.set(ref, input);
    const c = compileCell(input, { homeSheet: homeOf(ref), defaultSheet: DEFAULT_SHEET, nameTable });
    compiled.set(ref, c);
    setForwardDeps(ref, c.kind === 'formula' ? c.refs : []);
    const changes = recompute(downstream(ref));
    if (onChange && changes.length > 0) onChange(changes);
  };

  // MOD-GRID-32 G-3: per-cell 편집 command 스택. raw Map 이 진실원천이고 한 setCell = 한 셀 단위 명령
  // {ref, prev, next} 이라 undo = prev 재적용(증분 재계산이 dependents 처리), redo = next 재적용. 전체
  // rebuild 불필요(명령이 원자적). cursor = 적용된 history 길이; [cursor..] = redo future.
  const history: { ref: string; prev: string; next: string }[] = [];
  let cursor = 0;

  return {
    setCell(publicRef, input) {
      const key = toKey(publicRef); // MOD-GRID-41: public ref → 저장 키
      const prev = raw.get(key) ?? '';
      if (prev === input) return; // no-op 은 history 에 안 남김
      applyCell(key, input);
      history.length = cursor; // redo future 잘라냄(새 분기)
      history.push({ ref: key, prev, next: input });
      cursor++;
    },
    defineName(name, target) {
      // MOD-GRID-41: 명명 inline 이라 재정의 시 stale AST → 전 수식 셀 recompile-all 후 전체 재계산.
      nameTable.set(name.toUpperCase(), target);
      for (const [key, input] of raw) {
        if (!input.startsWith('=')) continue;
        const c = compileCell(input, { homeSheet: homeOf(key), defaultSheet: DEFAULT_SHEET, nameTable });
        compiled.set(key, c);
        setForwardDeps(key, c.kind === 'formula' ? c.refs : []);
      }
      const changes = recompute(new Set(raw.keys()));
      if (onChange && changes.length > 0) onChange(changes);
    },
    undo() {
      if (cursor === 0) return false;
      cursor--;
      const e = history[cursor]!;
      applyCell(e.ref, e.prev);
      return true;
    },
    redo() {
      if (cursor >= history.length) return false;
      const e = history[cursor]!;
      applyCell(e.ref, e.next);
      cursor++;
      return true;
    },
    canUndo: () => cursor > 0,
    canRedo: () => cursor < history.length,
    // MOD-GRID-41: public 접근자는 ref(bare | Sheet2!A1) → 저장 키 변환.
    getValue: (ref) => getByKey(toKey(ref)),
    getRaw: (ref) => raw.get(toKey(ref)) ?? '',
    getDisplay: (ref) => formatValue(getByKey(toKey(ref))),
  };
}

function sameValue(a: CellValue | undefined, b: CellValue): boolean {
  if (a === undefined) return false;
  if (isCellError(a) || isCellError(b)) {
    return isCellError(a) && isCellError(b) && a.error === b.error;
  }
  return a === b;
}
