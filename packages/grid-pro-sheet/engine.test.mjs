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
const { createSheet, parseFormula, evaluate, isCellError, translateFormula, serializeAst } =
  await import(pathToFileURL(out).href);

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

// ── G-2: text functions (per-arg, number→string coercion) ──
ok('LEN("hello") → 5', evalF('=LEN("hello")') === 5);
ok('LEN(123) → 3 (number→string)', evalF('=LEN(123)') === 3);
ok('UPPER("ab") → AB', evalF('=UPPER("ab")') === 'AB');
ok('LOWER("AB") → ab', evalF('=LOWER("AB")') === 'ab');
ok('TRIM("  x  ") → x', evalF('=TRIM("  x  ")') === 'x');
ok('LEFT("hello",2) → he', evalF('=LEFT("hello",2)') === 'he');
ok('RIGHT("hello",2) → lo', evalF('=RIGHT("hello",2)') === 'lo');
ok('MID("hello",2,3) → ell', evalF('=MID("hello",2,3)') === 'ell');
ok('CONCATENATE("a","b","c") → abc', evalF('=CONCATENATE("a","b","c")') === 'abc');
ok('CONCATENATE with number → a1', evalF('=CONCATENATE("a",1)') === 'a1');

// ── G-2: math functions ──
ok('ABS(-5) → 5', evalF('=ABS(-5)') === 5);
ok('INT(3.7) → 3', evalF('=INT(3.7)') === 3);
ok('ROUND(3.14159,2) → 3.14', evalF('=ROUND(3.14159,2)') === 3.14);
ok('ROUND(2.5,0) → 3', evalF('=ROUND(2.5,0)') === 3);
ok('MOD(7,3) → 1', evalF('=MOD(7,3)') === 1);
ok('MOD(-1,3) → 2 (sign of divisor)', evalF('=MOD(-1,3)') === 2);
ok('MOD(5,0) → #DIV/0!', isCellError(evalF('=MOD(5,0)')) && evalF('=MOD(5,0)').error === '#DIV/0!');
ok('POWER(2,10) → 1024', evalF('=POWER(2,10)') === 1024);

// ── ★ G-2 spine (advisor #2): positional fn with a RANGE arg → #ERROR! (not silent mis-read) ──
{
  const s = createSheet();
  s.setCell('A1', '1'); s.setCell('A2', '2'); s.setCell('A3', '3');
  s.setCell('B1', '=ROUND(A1:A3,2)');
  ok('★ ROUND(range,2): range arg → #ERROR! (per-arg boundary, no flatten mis-read)',
    isCellError(s.getValue('B1')) && s.getValue('B1').error === '#ERROR!');
  // scalar arg still works.
  s.setCell('B2', '=ROUND(A2,0)');
  ok('ROUND scalar arg works → 2', s.getValue('B2') === 2);
}
// text fn recalc through refs.
{
  const s = createSheet();
  s.setCell('A1', 'world'); // a bare literal string cell.
  s.setCell('B1', '=CONCATENATE("hello ",A1)');
  ok('CONCATENATE ref → "hello world"', s.getValue('B1') === 'hello world');
}

// ── G-3: cell-edit undo/redo (raw snapshot command stack + recompute) ──
{
  const s = createSheet();
  s.setCell('A1', '10');
  s.setCell('B1', '=A1*2'); // depends on A1
  ok('G-3 baseline B1 → 20', s.getValue('B1') === 20);

  s.setCell('A1', '50');
  ok('after edit B1 → 100', s.getValue('B1') === 100);

  // ★ undo restores A1's prev raw AND recomputes the dependent B1.
  ok('undo returns true', s.undo() === true);
  ok('★ undo restores A1=10 (raw)', s.getRaw('A1') === '10');
  ok('★ undo recomputes dependent B1 → 20', s.getValue('B1') === 20);

  // redo re-applies.
  ok('redo returns true', s.redo() === true);
  ok('redo A1=50', s.getRaw('A1') === '50');
  ok('redo dependent B1 → 100', s.getValue('B1') === 100);

  // undo to the very first edit (B1 formula), then A1, then A1's creation.
  ok('canUndo true', s.canUndo() === true);
  s.undo(); // A1 50→10
  s.undo(); // B1 formula → '' (its creation)
  ok('undo B1 creation → B1 empty', s.getValue('B1') === '');
  ok('A1 still 10', s.getValue('A1') === 10);

  // redo past the branch, then a NEW edit truncates the redo future.
  s.redo(); // B1 formula back
  ok('redo restores B1 → 20', s.getValue('B1') === 20);
  s.setCell('A1', '7'); // new edit at this cursor → truncates remaining redo
  ok('new edit B1 recompute → 14', s.getValue('B1') === 14);
  ok('redo future truncated (canRedo false)', s.canRedo() === false);

  // exhaust undo.
  ok('undo empty stack eventually returns false', (() => { let g = 0; while (s.undo()) g++; return s.undo() === false; })());
}
// no-op setCell does not create a history entry.
{
  const s = createSheet();
  s.setCell('A1', '1');
  s.setCell('A1', '1'); // same value → no-op, no history
  ok('no-op setCell: single undo clears A1', s.undo() === true && s.getValue('A1') === '');
  ok('no second undo (no-op left no entry)', s.canUndo() === false);
}

// ── MOD-GRID-40 G-1: absolute / mixed references ($A$1 / $A1 / A$1) ──
// AC①: abs flags survive parse — asserted via serialize round-trip (no AST-shape peek, all behavioral).
ok('parse $A$1 → serialize $A$1', serializeAst(parseFormula('$A$1')) === '$A$1');
ok('parse $A1 → serialize $A1 (col abs)', serializeAst(parseFormula('$A1')) === '$A1');
ok('parse A$1 → serialize A$1 (row abs)', serializeAst(parseFormula('A$1')) === 'A$1');
ok('parse A1 → serialize A1 (relative)', serializeAst(parseFormula('A1')) === 'A1');
ok('lowercase $a$1 normalizes → $A$1', serializeAst(parseFormula('$a$1')) === '$A$1');
// AC②: ★ $A$1 evaluates identically to A1 AND tracks the same dependency (the $ is eval-cosmetic).
{
  const s = createSheet();
  s.setCell('A1', '10');
  s.setCell('B1', '=$A$1+1');
  ok('★ $A$1 evaluates like A1 → 11', s.getValue('B1') === 11);
  s.setCell('A1', '20');
  ok('★ $A$1 tracks dep (A1 10→20) → B1 recalcs 21', s.getValue('B1') === 21);
}

// ── MOD-GRID-40 G-2: translateFormula (copy/fill relative shift, absolute fixed) ──
// A1+(1col,2row)=B3 ; B1+(1col,2row)=C3 (B is col-1, +1col → col-2 = C).
ok('relative: =A1+B1 by (1,2) → =B3+C3', translateFormula('=A1+B1', 1, 2) === '=B3+C3');
ok('absolute fixed: =$A$1+B1 by (1,0) → =$A$1+C1', translateFormula('=$A$1+B1', 1, 0) === '=$A$1+C1');
ok('mixed col-abs: =$A1 by (1,1) → =$A2', translateFormula('=$A1', 1, 1) === '=$A2');
ok('mixed row-abs: =A$1 by (1,1) → =B$1', translateFormula('=A$1', 1, 1) === '=B$1');
// AC⑤: out-of-bounds → #REF!, and it ROUND-TRIPS through the parser.
ok('out-of-bounds: =A1 by (-1,0) → =#REF!', translateFormula('=A1', -1, 0) === '=#REF!');
{
  const s = createSheet();
  s.setCell('Z1', translateFormula('=A1', -1, 0)); // '=#REF!'
  ok('★ #REF! round-trips through parser → value #REF!',
    isCellError(s.getValue('Z1')) && s.getValue('Z1').error === '#REF!');
}
ok('partial out-of-bounds: =A1+B1 by (-1,0) → =#REF!+A1', translateFormula('=A1+B1', -1, 0) === '=#REF!+A1');
// AC⑥: range shift + ★ mixed-absolute range (4-flag per-endpoint bookkeeping = the real break point).
ok('range: =SUM(A1:A2) by (1,0) → =SUM(B1:B2)', translateFormula('=SUM(A1:A2)', 1, 0) === '=SUM(B1:B2)');
ok('★ mixed range: =SUM($A1:B$2) by (1,1) → =SUM($A2:C$2)',
  translateFormula('=SUM($A1:B$2)', 1, 1) === '=SUM($A2:C$2)');
// identity / literal / unparseable / precedence preservation.
ok('identity (0,0) preserves =A1+B1*2', translateFormula('=A1+B1*2', 0, 0) === '=A1+B1*2');
ok('literal cell (no =) unchanged', translateFormula('42', 1, 1) === '42');
ok('unparseable =A1++ returned verbatim', translateFormula('=A1++', 1, 1) === '=A1++');
ok('precedence: =(A1+B1)*2 keeps parens', translateFormula('=(A1+B1)*2', 0, 0) === '=(A1+B1)*2');
ok('precedence: =A1-(B1-C1) keeps right parens', translateFormula('=A1-(B1-C1)', 0, 0) === '=A1-(B1-C1)');

// ── MOD-GRID-41 G-1: multi-sheet (Sheet2!A1), single qualified-key graph ──
// AC①: a bare ref in a non-default-sheet formula qualifies to its OWN sheet, not the default.
{
  const s = createSheet();
  s.setCell('Sheet2!A1', '5');
  s.setCell('Sheet2!B1', '=A1*2'); // bare A1 here → Sheet2!A1
  ok('★ bare ref qualifies to own sheet: Sheet2!B1 → 10', s.getValue('Sheet2!B1') === 10);
  s.setCell('A1', '100'); // Sheet1!A1 (different cell)
  ok('Sheet2!B1 unaffected by Sheet1!A1 → still 10', s.getValue('Sheet2!B1') === 10);
}
// AC②: ★ cross-sheet recalc — the non-vacuous proof of the single-graph claim.
{
  const s = createSheet();
  s.setCell('A1', '7');
  s.setCell('Sheet2!C1', '=Sheet1!A1+1');
  ok('cross-sheet ref baseline: Sheet2!C1 → 8', s.getValue('Sheet2!C1') === 8);
  s.setCell('A1', '70');
  ok('★ cross-sheet recalc: edit Sheet1!A1 → Sheet2!C1 → 71', s.getValue('Sheet2!C1') === 71);
}
// AC③: cross-sheet cycle → both #CYCLE! (falls out of the single graph for free).
{
  const s = createSheet();
  s.setCell('Sheet1!A1', '=Sheet2!A1');
  s.setCell('Sheet2!A1', '=Sheet1!A1');
  ok('cross-sheet cycle → Sheet1!A1 #CYCLE!', isCellError(s.getValue('A1')) && s.getValue('A1').error === '#CYCLE!');
  ok('cross-sheet cycle → Sheet2!A1 #CYCLE!', isCellError(s.getValue('Sheet2!A1')) && s.getValue('Sheet2!A1').error === '#CYCLE!');
}
// explicit Sheet1! = default = bare key (consistency, no double-storage).
{
  const s = createSheet();
  s.setCell('A1', '9');
  ok('explicit Sheet1!A1 reads bare A1 → 9', s.getValue('Sheet1!A1') === 9);
}
// cross-sheet RANGE (keyPrefix path).
{
  const s = createSheet();
  s.setCell('Sheet2!A1', '1'); s.setCell('Sheet2!A2', '2'); s.setCell('Sheet2!A3', '3');
  s.setCell('B1', '=SUM(Sheet2!A1:A3)');
  ok('cross-sheet range: SUM(Sheet2!A1:A3) → 6', s.getValue('B1') === 6);
  s.setCell('Sheet2!A2', '20');
  ok('cross-sheet range recalc → 24', s.getValue('B1') === 24);
}

// ── MOD-GRID-41 G-2: named ranges ──
// AC④: define → use → recalc on target change → ★ redefine recomputes dependents.
{
  const s = createSheet();
  s.setCell('A1', '10'); s.setCell('B1', '5');
  s.defineName('TaxRate', 'A1');
  s.setCell('C1', '=TaxRate*B1');
  ok('named cell: TaxRate(A1=10)*B1(5) → 50', s.getValue('C1') === 50);
  s.setCell('A1', '20');
  ok('named cell recalc on target change → 100', s.getValue('C1') === 100);
  s.setCell('A2', '3');
  s.defineName('TaxRate', 'A2'); // redefine
  ok('★ redefine name recomputes dependents: TaxRate→A2(3)*B1(5) → 15', s.getValue('C1') === 15);
}
// named RANGE in a function + recalc.
{
  const s = createSheet();
  s.setCell('A1', '1'); s.setCell('A2', '2'); s.setCell('A3', '3');
  s.defineName('Data', 'A1:A3');
  s.setCell('B1', '=SUM(Data)');
  ok('named range: SUM(Data=A1:A3) → 6', s.getValue('B1') === 6);
  s.setCell('A2', '20');
  ok('named range recalc → 24', s.getValue('B1') === 24);
}
// AC⑤: undefined name → #NAME?, and defining it later resolves (recompile-all).
{
  const s = createSheet();
  s.setCell('A1', '=Nope+1');
  ok('undefined name → #NAME?', isCellError(s.getValue('A1')) && s.getValue('A1').error === '#NAME?');
  s.setCell('B1', '5');
  s.defineName('Nope', 'B1');
  ok('★ defining the name resolves the #NAME? cell → 6', s.getValue('A1') === 6);
}
// named ref to another sheet.
{
  const s = createSheet();
  s.setCell('Sheet2!A1', '42');
  s.defineName('Answer', 'Sheet2!A1');
  s.setCell('B1', '=Answer');
  ok('named ref to other sheet: Answer→Sheet2!A1 → 42', s.getValue('B1') === 42);
}

// ── MOD-GRID-41 × MOD-40: translate handles sheet-qualified + name nodes ──
ok('translate cross-sheet row: =Sheet2!A1 by (0,1) → =Sheet2!A2 (qualifier kept)',
  translateFormula('=Sheet2!A1', 0, 1) === '=Sheet2!A2');
ok('translate cross-sheet col: =Sheet2!A1 by (1,0) → =Sheet2!B1', translateFormula('=Sheet2!A1', 1, 0) === '=Sheet2!B1');
ok('translate cross-sheet range: =SUM(Sheet2!A1:A2) by (1,0) → =SUM(Sheet2!B1:B2)',
  translateFormula('=SUM(Sheet2!A1:A2)', 1, 0) === '=SUM(Sheet2!B1:B2)');
// names are tokenized upper-case (shared with fn-name tokenizing / nameTable keys), so fill normalizes case.
ok('★ translate name node fixed, ref moves: =TaxRate*A1 by (1,1) → =TAXRATE*B2',
  translateFormula('=TaxRate*A1', 1, 1) === '=TAXRATE*B2');

rmSync(out, { force: true });
console.log(`sheet engine: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
