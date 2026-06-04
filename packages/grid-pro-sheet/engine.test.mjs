// MOD-GRID-32 node spine — sheet engine. Runs via package "test" script.
// The engine cross-imports with `.js` extensions (NodeNext) → strip-types can't resolve them, so we
// esbuild-bundle the pure engine (no react) and import the bundle (mirrors the i18n approach).
// Contains: ★ characterization regression (MOD-26 behavior pinned BEFORE the G-1 parser surgery) +
// G-1 (comparison ops, IF lazy, logical fns, dependency-tracked recalc through IF).
import { build } from 'esbuild'; // grid-pro-sheet devDependency (bare specifier — no version-pinned .pnpm path).
import { rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const out = 'engine-bundle.tmp.mjs';
await build({
  entryPoints: ['src/internal/__testapi.ts'],
  bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error',
});
const { createSheet, parseFormula, evaluate, isCellError } = await import(pathToFileURL(out).href);

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.log('  ❌', n); } };
// evaluate a standalone formula (no refs) via a one-cell sheet.
const evalF = (src) => { const s = createSheet(); s.setCell('Z9', src); return s.getValue('Z9'); };

// ── ★ CHARACTERIZATION (MOD-26 behavior — must stay green across the G-1 surgery) ──
ok('arith precedence =1+2*3 → 7', evalF('=1+2*3') === 7);
ok('parens =(1+2)*3 → 9', evalF('=(1+2)*3') === 9);
ok('unary minus =-5 → -5', evalF('=-5') === -5);
ok('division =10/4 → 2.5', evalF('=10/4') === 2.5);
{
  const s = createSheet();
  s.setCell('A1', '10'); s.setCell('B1', '=A1+5');
  ok('ref =A1+5 → 15', s.getValue('B1') === 15);
  s.setCell('A1', '20');
  ok('recalc on dep change → 25', s.getValue('B1') === 25);
}
{
  const s = createSheet();
  s.setCell('A1', '1'); s.setCell('A2', '2'); s.setCell('A3', '3');
  s.setCell('B1', '=SUM(A1:A3)'); ok('SUM range → 6', s.getValue('B1') === 6);
  s.setCell('B2', '=AVERAGE(A1:A3)'); ok('AVERAGE range → 2', s.getValue('B2') === 2);
}
ok('div by zero → #DIV/0!', isCellError(evalF('=1/0')) && evalF('=1/0').error === '#DIV/0!');
ok('unknown fn → #ERROR!', isCellError(evalF('=NOPE(1)')) && evalF('=NOPE(1)').error === '#ERROR!');
{
  const s = createSheet();
  s.setCell('A1', '=B1'); s.setCell('B1', '=A1');
  ok('cycle → #CYCLE!', isCellError(s.getValue('A1')) && s.getValue('A1').error === '#CYCLE!');
}

// ── G-1: comparison operators (boolean results, type-aware) ──
ok('=5>3 → true', evalF('=5>3') === true);
ok('=5<3 → false', evalF('=5<3') === false);
ok('=4=4 → true', evalF('=4=4') === true);
ok('=4<>5 → true', evalF('=4<>5') === true);
ok('=2>=2 → true', evalF('=2>=2') === true);
ok('string eq ="a"="a" → true', evalF('="a"="a"') === true);
ok('string lt ="a"<"b" → true', evalF('="a"<"b"') === true);
ok('compare below arith: =1+1=2 → true', evalF('=1+1=2') === true);

// ── G-1: IF (lazy) + logical fns ──
ok('IF true branch =IF(1>0,"y","n") → y', evalF('=IF(1>0,"y","n")') === 'y');
ok('IF false branch =IF(1<0,"y","n") → n', evalF('=IF(1<0,"y","n")') === 'n');
// ★ lazy: untaken branch (1/A1, A1=0) must NOT evaluate → no #DIV/0!.
{
  const s = createSheet();
  s.setCell('A1', '0');
  s.setCell('B1', '=IF(A1=0,"safe",1/A1)');
  ok('IF lazy: untaken 1/0 not evaluated → "safe"', s.getValue('B1') === 'safe');
}
ok('AND =AND(1>0,2>1) → true', evalF('=AND(1>0,2>1)') === true);
ok('AND short =AND(1>0,1>2) → false', evalF('=AND(1>0,1>2)') === false);
ok('OR =OR(1>2,2>1) → true', evalF('=OR(1>2,2>1)') === true);
ok('NOT =NOT(1>2) → true', evalF('=NOT(1>2)') === true);

// ── ★ G-1 spine: dependency-tracked recalc THROUGH IF (lazy eval vs static dep-tracking) ──
{
  const s = createSheet();
  s.setCell('A1', '3');
  s.setCell('B1', '=IF(A1>5,10,20)');
  ok('IF recalc baseline (A1=3) → 20', s.getValue('B1') === 20);
  s.setCell('A1', '7'); // change a ref used only in the condition
  ok('★ IF recalc on A1 3→7 → 10 (dep tracked despite lazy)', s.getValue('B1') === 10);
}

rmSync(out, { force: true });
console.log(`sheet engine: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
