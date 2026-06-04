// MOD-33 G-3 node spine — moveRow. Run: node --experimental-strip-types src/internal/moveRow.test.ts
// type-only/no imports → strip-types clean.
import { moveRow } from './moveRow.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };
const eq = (a: unknown[], b: unknown[]) => JSON.stringify(a) === JSON.stringify(b);

const r = ['A', 'B', 'C', 'D'];

// move DOWN (from < to): A(0) → index 2 → [B,C,A,D] (index adjustment handled by splice).
ok('down: A(0)→2 = B,C,A,D', eq(moveRow(r, 0, 2), ['B', 'C', 'A', 'D']));
// move UP (from > to): D(3) → index 1 → [A,D,B,C].
ok('up: D(3)→1 = A,D,B,C', eq(moveRow(r, 3, 1), ['A', 'D', 'B', 'C']));
// adjacent swaps.
ok('B(1)→0 = B,A,C,D', eq(moveRow(r, 1, 0), ['B', 'A', 'C', 'D']));
ok('C(2)→3 = A,B,D,C', eq(moveRow(r, 2, 3), ['A', 'B', 'D', 'C']));
// no-op + bounds → original copy (unchanged contents).
ok('no-op from===to', eq(moveRow(r, 1, 1), ['A', 'B', 'C', 'D']));
ok('out-of-bounds from', eq(moveRow(r, 9, 1), ['A', 'B', 'C', 'D']));
ok('out-of-bounds to', eq(moveRow(r, 1, 9), ['A', 'B', 'C', 'D']));
ok('negative', eq(moveRow(r, -1, 1), ['A', 'B', 'C', 'D']));
// immutability: input not mutated.
const src = ['X', 'Y', 'Z'];
moveRow(src, 0, 2);
ok('input not mutated', eq(src, ['X', 'Y', 'Z']));
// full reverse via sequence (sanity).
ok('first→last = B,C,D,A', eq(moveRow(r, 0, 3), ['B', 'C', 'D', 'A']));

console.log(`moveRow spine: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
