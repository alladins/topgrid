// node --experimental-strip-types — cellValueToClipboardText 특성화. dist import.
import assert from 'node:assert/strict';
import { cellValueToClipboardText } from '../dist/index.mjs';

const cell = (v: unknown) => ({ getValue: () => v });
let pass = 0;
const ok = (c: boolean, m: string) => { assert.ok(c, m); pass++; };

ok(cellValueToClipboardText(cell(null)) === '', 'null → 빈문자');
ok(cellValueToClipboardText(cell(undefined)) === '', 'undefined → 빈문자');
ok(cellValueToClipboardText(cell('Seoul')) === 'Seoul', 'string passthrough');
ok(cellValueToClipboardText(cell(42)) === '42', 'number → String');
ok(cellValueToClipboardText(cell(true)) === 'true', 'boolean → String');
ok(cellValueToClipboardText(cell({ a: 1 })) === '{"a":1}', 'object → JSON');
ok(cellValueToClipboardText(cell([1, 2])) === '[1,2]', 'array → JSON');

console.log(`cellValueToClipboardText characterization: ${pass} passed, 0 failed`);
