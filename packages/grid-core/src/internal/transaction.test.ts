// MOD-GRID-43 node spine — incremental row transactions. Run: node --experimental-strip-types src/internal/transaction.test.ts
import { applyRowTransaction, createTransactionBatcher, type RowTransaction } from './transaction.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

interface Row { id: number; name: string }
const getRowId = (r: Row) => r.id;
const base: Row[] = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }, { id: 3, name: 'c' }];

// ── G-1: applyRowTransaction ──
ok('add appends', eq(applyRowTransaction(base, { add: [{ id: 4, name: 'd' }] }, getRowId),
  [{ id: 1, name: 'a' }, { id: 2, name: 'b' }, { id: 3, name: 'c' }, { id: 4, name: 'd' }]));
ok('remove by id', eq(applyRowTransaction(base, { remove: [2] }, getRowId),
  [{ id: 1, name: 'a' }, { id: 3, name: 'c' }]));
ok('update replaces matched row', eq(applyRowTransaction(base, { update: [{ id: 2, name: 'B!' }] }, getRowId),
  [{ id: 1, name: 'a' }, { id: 2, name: 'B!' }, { id: 3, name: 'c' }]));
// composite: order remove → update → add (AG semantics).
ok('composite remove+update+add', eq(
  applyRowTransaction(base, { remove: [1], update: [{ id: 3, name: 'C!' }], add: [{ id: 9, name: 'z' }] }, getRowId),
  [{ id: 2, name: 'b' }, { id: 3, name: 'C!' }, { id: 9, name: 'z' }]));
// unknown ids ignored (no throw).
ok('update unknown id ignored', eq(applyRowTransaction(base, { update: [{ id: 99, name: 'x' }] }, getRowId), base));
ok('remove unknown id ignored', eq(applyRowTransaction(base, { remove: [99] }, getRowId), base));
ok('empty txn = equal copy', eq(applyRowTransaction(base, {}, getRowId), base));
// ★ immutability: input array + rows not mutated.
{
  const src: Row[] = [{ id: 1, name: 'a' }];
  const out = applyRowTransaction(src, { add: [{ id: 2, name: 'b' }], update: [{ id: 1, name: 'A' }] }, getRowId);
  ok('★ input array not mutated', eq(src, [{ id: 1, name: 'a' }]));
  ok('result is a new array', out !== src && out.length === 2);
}

// ── G-2: createTransactionBatcher (injected scheduler = deterministic) ──
{
  let data: Row[] = [{ id: 1, name: 'a' }];
  let setCalls = 0;
  let scheduled: (() => void) | null = null;
  const b = createTransactionBatcher<Row>({
    getData: () => data,
    setData: (next) => { data = next; setCalls++; },
    getRowId,
    schedule: (flush) => { scheduled = flush; }, // manual collector
  });
  b.enqueue({ add: [{ id: 2, name: 'b' }] });
  b.enqueue({ add: [{ id: 3, name: 'c' }] });
  b.enqueue({ update: [{ id: 1, name: 'A' }] });
  ok('before flush: not committed (setData 0)', setCalls === 0 && b.pending() === 3);
  ok('schedule armed once', scheduled !== null);
  scheduled!(); // fire the single scheduled flush
  ok('★ batched flush: setData called ONCE', setCalls === 1);
  ok('★ all 3 txns applied in order', eq(data,
    [{ id: 1, name: 'A' }, { id: 2, name: 'b' }, { id: 3, name: 'c' }]));
  ok('queue drained after flush', b.pending() === 0);

  // re-arm: a new enqueue after flush schedules a fresh batch.
  let scheduled2: (() => void) | null = null;
  const b2 = createTransactionBatcher<Row>({
    getData: () => data, setData: (next) => { data = next; setCalls++; }, getRowId,
    schedule: (flush) => { scheduled2 = flush; },
  });
  b2.enqueue({ remove: [2] });
  scheduled2!();
  ok('re-batch after flush works', setCalls === 2 && eq(data, [{ id: 1, name: 'A' }, { id: 3, name: 'c' }]));
}
// empty-queue flush is a no-op (no setData).
{
  let setCalls = 0;
  const b = createTransactionBatcher<Row>({
    getData: () => [], setData: () => { setCalls++; }, getRowId, schedule: () => {},
  });
  b.flush();
  ok('empty-queue flush = no commit', setCalls === 0);
}

console.log(`transaction spine: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
