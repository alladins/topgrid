// MOD-GRID-49 G-3 node spine — auto-page-size 산술 (측정=Grid 배선, chromium).
// Run: node --experimental-strip-types src/pagination/computeAutoPageSize.test.ts
import { computeAutoPageSize } from './computeAutoPageSize.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };

ok('exact floor: 300 / 36 → 8', computeAutoPageSize({ availableHeight: 300, rowHeight: 36 }) === 8);
ok('taller viewport → more rows: 720 / 36 → 20', computeAutoPageSize({ availableHeight: 720, rowHeight: 36 }) === 20);
ok('rowHeight > viewport → 1 (at least one row)', computeAutoPageSize({ availableHeight: 30, rowHeight: 40 }) === 1);
ok('zero height → 1 (guard)', computeAutoPageSize({ availableHeight: 0, rowHeight: 36 }) === 1);
ok('negative height → 1 (guard)', computeAutoPageSize({ availableHeight: -100, rowHeight: 36 }) === 1);
ok('zero rowHeight → 1 (no divide-by-zero)', computeAutoPageSize({ availableHeight: 300, rowHeight: 0 }) === 1);
ok('negative rowHeight → 1 (guard)', computeAutoPageSize({ availableHeight: 300, rowHeight: -10 }) === 1);
ok('NaN height → 1 (guard)', computeAutoPageSize({ availableHeight: NaN, rowHeight: 36 }) === 1);
ok('Infinity rowHeight → 1 (guard)', computeAutoPageSize({ availableHeight: 300, rowHeight: Infinity }) === 1);

console.log(`computeAutoPageSize spine: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
