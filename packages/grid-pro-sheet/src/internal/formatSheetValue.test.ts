// MOD-GRID-62 G-1 node spine — pure cell number-format. Run: node --experimental-strip-types src/internal/formatSheetValue.test.ts
import { formatSheetValue } from './formatSheetValue.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };
const eq = (label: string, got: string, want: string) => ok(`${label} → "${got}"`, got === want);

// passthrough: no format / empty / non-numeric.
eq('no format', formatSheetValue('42'), '42');
eq('empty', formatSheetValue('', { type: 'number', decimals: 2 }), '');
eq('error passthrough', formatSheetValue('#DIV/0!', { type: 'currency' }), '#DIV/0!');
eq('text passthrough', formatSheetValue('hello', { type: 'percent' }), 'hello');

// number (grouping + decimals).
eq('number int', formatSheetValue('1234', { type: 'number' }), '1,234');
eq('number 2dp', formatSheetValue('1234.5', { type: 'number', decimals: 2 }), '1,234.50');
eq('number millions', formatSheetValue('1234567.891', { type: 'number', decimals: 1 }), '1,234,567.9');
eq('number negative', formatSheetValue('-1234.5', { type: 'number', decimals: 1 }), '-1,234.5');

// currency (symbol default $, 2dp default, grouping).
eq('currency default', formatSheetValue('1234.5', { type: 'currency' }), '$1,234.50');
eq('currency won 0dp', formatSheetValue('1234567', { type: 'currency', symbol: '₩', decimals: 0 }), '₩1,234,567');

// percent (×100).
eq('percent', formatSheetValue('0.125', { type: 'percent', decimals: 1 }), '12.5%');
eq('percent 0dp', formatSheetValue('0.5', { type: 'percent' }), '50%');

// date (serial days → ISO).
eq('date serial 0', formatSheetValue('0', { type: 'date' }), '1970-01-01');
eq('date serial 20000', formatSheetValue('20000', { type: 'date' }), '2024-10-04');

console.log(`formatSheetValue spine: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
