// MOD-69 node — sheet ↔ xlsx bridge. Run (from packages/grid-export): node --experimental-strip-types sheetXlsx.test.ts
// Uses the real xlsx lib (bare import resolves from node_modules) to prove formula round-trip (LESS-004).
import {
  sheetRawToXlsxCell,
  xlsxCellToSheetRaw,
  exportSheetCellsToXlsxBuffer,
  importXlsxToSheetCells,
} from './sheetXlsx.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };

// ── G-1 pure transforms ──
ok('raw formula → .f + cached computed v', JSON.stringify(sheetRawToXlsxCell('=A1+A2', 30)) === JSON.stringify({ t: 'n', f: 'A1+A2', v: 30 }));
ok('raw formula no computed → .f + fallback v:0', JSON.stringify(sheetRawToXlsxCell('=A1+A2')) === JSON.stringify({ t: 'n', f: 'A1+A2', v: 0 }));
ok('raw formula text result → t:s', JSON.stringify(sheetRawToXlsxCell('=B1', 'hi')) === JSON.stringify({ t: 's', f: 'B1', v: 'hi' }));
ok('raw number → t:n v', JSON.stringify(sheetRawToXlsxCell('10')) === JSON.stringify({ t: 'n', v: 10 }));
ok('raw text → t:s v', JSON.stringify(sheetRawToXlsxCell('hi')) === JSON.stringify({ t: 's', v: 'hi' }));
ok('raw empty → t:s v:""', JSON.stringify(sheetRawToXlsxCell('')) === JSON.stringify({ t: 's', v: '' }));

ok('xlsx .f → =formula', xlsxCellToSheetRaw({ t: 'n', f: 'A1+A2', v: 30 }) === '=A1+A2');
ok('xlsx value → string', xlsxCellToSheetRaw({ t: 'n', v: 10 }) === '10');
ok('xlsx text → string', xlsxCellToSheetRaw({ t: 's', v: 'hi' }) === 'hi');
ok('xlsx empty → ""', xlsxCellToSheetRaw({ t: 's' }) === '');

// transform involution on the formula/value level.
ok('round-trip raw: formula', xlsxCellToSheetRaw(sheetRawToXlsxCell('=SUM(A1:A2)')) === '=SUM(A1:A2)');
ok('round-trip raw: number', xlsxCellToSheetRaw(sheetRawToXlsxCell('42')) === '42');

// ── G-2 ★real xlsx lib round-trip: cells → .xlsx buffer → cells, FORMULA SURVIVES ──
const cells: Record<string, string> = { A1: '10', A2: '20', A3: '=A1+A2', B1: 'hi' };
const buf = exportSheetCellsToXlsxBuffer(cells, { A3: 30 });
ok('export produced a buffer', buf instanceof Uint8Array && buf.length > 0);
const back = importXlsxToSheetCells(buf);
ok('★ formula A3 survived round-trip', back['A3'] === '=A1+A2');
ok('value A1 survived', back['A1'] === '10');
ok('value A2 survived', back['A2'] === '20');
ok('text B1 survived', back['B1'] === 'hi');

console.log(`sheetXlsx: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
