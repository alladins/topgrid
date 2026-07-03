// MOD-GRID-53 node spine — computePivot characterization + column-group cells. Runs via "test".
// computePivot cross-imports `./reducers` → `@topgrid/grid-pro-agg` (bare specifier) → strip-types
// can't resolve, so esbuild-bundle the pure transform and import the bundle (MOD-32 engine pattern).
//
// ★characterization-first (advisor): MOD-18 이후 computePivot 첫 additive 터치. 커밋된 computePivot
// 테스트가 없었으므로(MOD-18 "26"=audit 일회성), 먼저 현 leaf/subtotal/grandTotal 값을 핀하고
// 그 위에 그룹-prefix 셀(additive, source 재집계)을 검증한다 — characterization 이 불변이면 additive 증명.
import { build } from 'esbuild';
import { rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const out = 'computePivot-bundle.tmp.mjs';
await build({
  entryPoints: ['src/computePivot.ts'],
  bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error',
});
const { computePivot, GRAND_TOTAL_COLUMN_KEY } = await import(pathToFileURL(out).href);

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.log('  ❌', n); } };

// ─── fixture: rows=[region,city], columns=[year,quarter], avg(amt) ───
// Seoul 2024 자식 분기 행 수 불균등(Q1 1행=10, Q2 3행=20,20,20) → 그룹 "2024" AVG 의
// avg-of-child-avgs(=avg(10,20)=15) ≠ true source AVG(=avg(10,20,20,20)=17.5). 정직성의 핵심.
const data = [
  { region: 'N', city: 'Seoul', year: '2024', quarter: 'Q1', amt: 10 },
  { region: 'N', city: 'Seoul', year: '2024', quarter: 'Q2', amt: 20 },
  { region: 'N', city: 'Seoul', year: '2024', quarter: 'Q2', amt: 20 },
  { region: 'N', city: 'Seoul', year: '2024', quarter: 'Q2', amt: 20 },
  { region: 'N', city: 'Seoul', year: '2023', quarter: 'Q4', amt: 100 },
  { region: 'N', city: 'Busan', year: '2024', quarter: 'Q1', amt: 200 },
  { region: 'S', city: 'Daegu', year: '2024', quarter: 'Q1', amt: 8 },
];
const config = {
  rows: ['region', 'city'],
  columns: ['year', 'quarter'],
  values: [{ field: 'amt', aggregationFn: 'avg' }],
};
const model = computePivot(data, config);
const GT = `${GRAND_TOTAL_COLUMN_KEY}__0`;
const seoul = model.rows.find((r) => r.__kind === 'data' && r.region === 'N' && r.city === 'Seoul');
const nSub = model.rows.find((r) => r.__kind === 'subtotal' && r.region === 'N');
const grand = model.rows.find((r) => r.__kind === 'grandTotal');

// ─── CHARACTERIZATION (leaf / subtotal / grandTotal — additive 수정에 불변) ───
ok('char: Seoul leaf 2024/Q1 = 10', seoul['2024/Q1__0'] === 10);
ok('char: Seoul leaf 2024/Q2 = 20', seoul['2024/Q2__0'] === 20);
ok('char: Seoul leaf 2023/Q4 = 100', seoul['2023/Q4__0'] === 100);
ok('char: region-N subtotal 2024/Q1 = avg(10,200)=105', nSub['2024/Q1__0'] === 105);
ok('char: grandTotal col = avg(all 7)=54', grand[GT] === 54);
ok('char: columnLeafKeys = 3 distinct (불변)', model.columnLeafKeys.length === 3);

// ─── COLUMN-GROUP CELLS (G-1, additive, source 재집계) ───
// ★avg-of-avgs: Seoul 그룹 "2024" = true source avg(10,20,20,20)=17.5, NOT avg-of-child-avgs(15).
ok('★group: Seoul 2024 = true source AVG 17.5 (NOT 15)', seoul['2024__0'] === 17.5);
ok('group: Seoul 2023 = avg(100)=100', seoul['2023__0'] === 100);
ok('group: region-N subtotal 2024 = avg(10,20,20,20,200)=54', nSub['2024__0'] === 54);
ok('group: grandTotal 2024 = avg(10,20,20,20,200,8)', grand['2024__0'] === (10 + 20 + 20 + 20 + 200 + 8) / 6);

// 3-column-dim: len-1 AND len-2 prefix 그룹 셀 둘 다 방출.
const model3 = computePivot(
  [
    { region: 'N', city: 'X', year: '2024', quarter: 'Q1', amt: 4 },
    { region: 'N', city: 'X', year: '2024', quarter: 'Q1', amt: 8 },
  ],
  { rows: ['region'], columns: ['year', 'quarter', 'city'], values: [{ field: 'amt', aggregationFn: 'avg' }] },
);
const g3 = model3.rows.find((r) => r.__kind === 'grandTotal');
ok('3-dim: len-1 prefix "2024" = avg(4,8)=6', g3['2024__0'] === 6);
ok('3-dim: len-2 prefix "2024/Q1" = avg(4,8)=6', g3['2024/Q1__0'] === 6);
ok('3-dim: leaf "2024/Q1/X" = avg(4,8)=6', g3['2024/Q1/X__0'] === 6);

// 0/1 column-dim: proper prefix 없음 → 그룹 셀 미방출(byte-identical inert).
const model1 = computePivot(data, { rows: ['region'], columns: ['year'], values: [{ field: 'amt', aggregationFn: 'avg' }] });
const g1 = model1.rows.find((r) => r.__kind === 'grandTotal');
ok('1-dim: leaf "2024" present', typeof g1['2024__0'] === 'number');
ok('1-dim: no extra group cell (only leaf "2024"/"2023" + grand)',
  Object.keys(g1).filter((k) => k.endsWith('__0')).sort().join(',') === ['2023__0', '2024__0', GT].sort().join(','));

rmSync(out, { force: true });
console.log(`computePivot (char + group cells): ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
