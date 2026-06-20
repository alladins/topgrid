// W3 DX node spine — dev warnings. Run: node --experimental-strip-types src/internal/devWarnings.test.ts
import {
  shouldWarnMissingRowId,
  shouldWarnVirtualizationRowPinning,
  shouldWarnReorderWithPagination,
  collectGridDevWarnings,
  visibilityNoOpColumnIds,
} from './devWarnings.ts';

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

// F-B: virtualization + rowPinning.
ok('virt+pinning → WARN', shouldWarnVirtualizationRowPinning({ enableVirtualization: true, enableRowPinning: true }) === true);
ok('virt only → no warn', shouldWarnVirtualizationRowPinning({ enableVirtualization: true }) === false);
ok('pinning only → no warn', shouldWarnVirtualizationRowPinning({ enableRowPinning: true }) === false);

// F-F: reorder + pagination.
ok('reorder + enablePagination → WARN', shouldWarnReorderWithPagination({ enableRowReorder: true, enablePagination: true }) === true);
ok('reorder + pagination.mode server → WARN', shouldWarnReorderWithPagination({ enableRowReorder: true, pagination: { mode: 'server' } }) === true);
ok('reorder only → no warn', shouldWarnReorderWithPagination({ enableRowReorder: true }) === false);
ok('pagination only → no warn', shouldWarnReorderWithPagination({ enablePagination: true }) === false);

// collector: combines applicable warnings.
ok('collector: getRowId + virt-pin = 2 warnings',
  collectGridDevWarnings({ rowSelection: 'multi', enableVirtualization: true, enableRowPinning: true }).length === 2);
ok('collector: getRowId + virt-pin + reorder-pagination = 3',
  collectGridDevWarnings({ rowSelection: 'multi', enableVirtualization: true, enableRowPinning: true, enableRowReorder: true, enablePagination: true }).length === 3);
ok('collector: clean props = 0 warnings', collectGridDevWarnings({ getRowId: () => '1' }).length === 0);

// F-E: visibility:false column ids.
ok('visibility ids: picks false-only with id',
  JSON.stringify(visibilityNoOpColumnIds([
    { id: 'a', visibility: false },
    { id: 'b', visibility: true },
    { id: 'c' },
    { visibility: false }, // no id → skipped
  ])) === JSON.stringify(['a']));

console.log(`devWarnings spine: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
