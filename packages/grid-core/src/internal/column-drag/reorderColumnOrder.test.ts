// MOD-65 G-1 node spine — reorderColumnOrder. Run: node --experimental-strip-types reorderColumnOrder.test.ts
// type-only/no runtime imports → strip-types clean.
import { reorderColumnOrder } from './reorderColumnOrder.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };
const eq = (a: unknown[], b: unknown[]) => JSON.stringify(a) === JSON.stringify(b);

const base = ['A', 'B', 'C', 'D'];

// insert-before: source lands immediately BEFORE the target.
ok('drag A onto C → A before C: B,A,C,D', eq(reorderColumnOrder(base, 'A', 'C'), ['B', 'A', 'C', 'D']));
ok('drag D onto B → D before B: A,D,B,C', eq(reorderColumnOrder(base, 'D', 'B'), ['A', 'D', 'B', 'C']));
ok('drag C onto A → C before A: C,A,B,D', eq(reorderColumnOrder(base, 'C', 'A'), ['C', 'A', 'B', 'D']));
// adjacent (drag A onto B = A stays before B → unchanged contents, but new array).
ok('drag A onto B → A before B: A,B,C,D', eq(reorderColumnOrder(base, 'A', 'B'), ['A', 'B', 'C', 'D']));
// drag onto the last → source before last.
ok('drag A onto D → A before D: B,C,A,D', eq(reorderColumnOrder(base, 'A', 'D'), ['B', 'C', 'A', 'D']));

// no-op cases return the SAME reference (callers detect via ===).
ok('source===target → same ref', reorderColumnOrder(base, 'B', 'B') === base);
ok('target absent → same ref', reorderColumnOrder(base, 'A', 'Z') === base);

// original never mutated.
ok('original not mutated', eq(base, ['A', 'B', 'C', 'D']));

// a real reorder returns a NEW array (not the same ref).
ok('real reorder → new array (not same ref)', reorderColumnOrder(base, 'A', 'C') !== base);

// two-column minimal: drag B onto A → swap.
ok('two cols: B onto A → B,A', eq(reorderColumnOrder(['A', 'B'], 'B', 'A'), ['B', 'A']));

console.log(`reorderColumnOrder: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
