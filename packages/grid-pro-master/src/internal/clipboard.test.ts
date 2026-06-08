// MOD-61 node spine — pure cell→clipboard text. Run: node --experimental-strip-types src/internal/clipboard.test.ts
import { cellValueToClipboardText } from './clipboard.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };
const cell = (v: unknown) => ({ getValue: () => v });

ok('string passes through', cellValueToClipboardText(cell('Alice')) === 'Alice');
ok('number stringifies', cellValueToClipboardText(cell(1200)) === '1200');
ok('zero stringifies', cellValueToClipboardText(cell(0)) === '0');
ok('boolean true', cellValueToClipboardText(cell(true)) === 'true');
ok('boolean false', cellValueToClipboardText(cell(false)) === 'false');
ok('null → empty (not "null")', cellValueToClipboardText(cell(null)) === '');
ok('undefined → empty (not "undefined")', cellValueToClipboardText(cell(undefined)) === '');
ok('object → JSON', cellValueToClipboardText(cell({ a: 1 })) === '{"a":1}');
ok('array → JSON', cellValueToClipboardText(cell([1, 2])) === '[1,2]');

console.log(`clipboard.test.ts: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
