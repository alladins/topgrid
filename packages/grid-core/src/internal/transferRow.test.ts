// MOD-66 G-1 node spine — transferRow. Run: node --experimental-strip-types transferRow.test.ts
// type-only/no runtime imports → strip-types clean.
import { transferRow } from './transferRow.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };

interface R { id: string; name: string; }
const getId = (r: R) => r.id;
const A: R[] = [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }, { id: 'c', name: 'Cara' }];
const B: R[] = [{ id: 'x', name: 'Xena' }];
const ids = (rows: R[]) => rows.map((r) => r.id).join(',');

// transfer b from A → B (appended at end).
const r1 = transferRow(A, B, 'b', getId);
ok('source loses b', ids(r1.source) === 'a,c');
ok('target gains b at end', ids(r1.target) === 'x,b');
ok('moved row carries data', r1.target[1]!.name === 'Bob');

// transfer first / last.
ok('transfer a (first)', ids(transferRow(A, B, 'a', getId).source) === 'b,c');
ok('transfer c (last) → target x,c', ids(transferRow(A, B, 'c', getId).target) === 'x,c');

// no-op: id absent in source → SAME refs.
const noop = transferRow(A, B, 'zzz', getId);
ok('absent id → source same ref', noop.source === A);
ok('absent id → target same ref', noop.target === B);

// originals never mutated.
ok('A not mutated', ids(A) === 'a,b,c');
ok('B not mutated', ids(B) === 'x');

// real transfer → NEW arrays (not same ref).
ok('real transfer → new source array', transferRow(A, B, 'b', getId).source !== A);
ok('real transfer → new target array', transferRow(A, B, 'b', getId).target !== B);

// empty target accepts.
ok('into empty target', ids(transferRow(A, [], 'a', getId).target) === 'a');

console.log(`transferRow: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
