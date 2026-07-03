// MOD-31 G-3 node — transposePivotConfig. Runs via: node --experimental-strip-types.
import { transposePivotConfig } from './transposePivotConfig.ts';
import type { PivotConfig } from './types.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };

const cfg: PivotConfig = {
  rows: ['region', 'city'],
  columns: ['quarter'],
  values: [{ field: 'sales', aggregationFn: 'sum' }],
};

const t = transposePivotConfig(cfg);
ok('rows ← columns', JSON.stringify(t.rows) === JSON.stringify(['quarter']));
ok('columns ← rows', JSON.stringify(t.columns) === JSON.stringify(['region', 'city']));
ok('values preserved', t.values === cfg.values);
ok('original not mutated', JSON.stringify(cfg.rows) === JSON.stringify(['region', 'city']));
// involution: transpose twice = identity.
const tt = transposePivotConfig(t);
ok('double transpose = identity', JSON.stringify(tt) === JSON.stringify(cfg));

console.log(`transposePivotConfig: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
