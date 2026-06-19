// W3 DX node spine — shouldWarnMissingRowId. Run: node --experimental-strip-types src/internal/devWarnings.test.ts
import { shouldWarnMissingRowId } from './devWarnings.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };

// getRowId present → never warn, regardless of features.
ok('getRowId present + selection → no warn', shouldWarnMissingRowId({ getRowId: () => '1', rowSelection: 'multi' }) === false);
ok('getRowId present + reorder → no warn', shouldWarnMissingRowId({ getRowId: () => '1', enableRowReorder: true }) === false);

// getRowId absent: warn only when an identity-dependent feature is on.
ok('no features → no warn', shouldWarnMissingRowId({}) === false);
ok('rowSelection none → no warn', shouldWarnMissingRowId({ rowSelection: 'none' }) === false);
ok('rowSelection single → WARN', shouldWarnMissingRowId({ rowSelection: 'single' }) === true);
ok('rowSelection multi → WARN', shouldWarnMissingRowId({ rowSelection: 'multi' }) === true);
ok('rowSelection options object → WARN', shouldWarnMissingRowId({ rowSelection: { mode: 'multi' } }) === true);
ok('enableRowReorder → WARN', shouldWarnMissingRowId({ enableRowReorder: true }) === true);
ok('enableRowPinning → WARN', shouldWarnMissingRowId({ enableRowPinning: true }) === true);
ok('enableCellChangeFlash → WARN', shouldWarnMissingRowId({ enableCellChangeFlash: true }) === true);

// explicit false flags → no warn.
ok('reorder false → no warn', shouldWarnMissingRowId({ enableRowReorder: false }) === false);

console.log(`devWarnings spine: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
