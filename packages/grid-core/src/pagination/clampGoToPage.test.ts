// MOD-GRID-49 G-2 node spine — go-to-page 입력 클램프 (1-based 입력 → 0-based 인덱스).
// Run: node --experimental-strip-types src/pagination/clampGoToPage.test.ts
import { clampGoToPage } from './clampGoToPage.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };

ok('valid in-range: "7" of 10 → 0-based 6', clampGoToPage('7', 10) === 6);
ok('first page: "1" → 0', clampGoToPage('1', 10) === 0);
ok('lower clamp: "0" → 0', clampGoToPage('0', 10) === 0);
ok('lower clamp: "-5" → 0', clampGoToPage('-5', 10) === 0);
ok('upper clamp: "99" of 10 → 9 (last)', clampGoToPage('99', 10) === 9);
ok('non-numeric "abc" → null (no-op)', clampGoToPage('abc', 10) === null);
ok('empty "" → null', clampGoToPage('', 10) === null);
ok('whitespace "   " → null', clampGoToPage('   ', 10) === null);
ok('zero pageCount → null', clampGoToPage('1', 0) === null);
ok('decimal "3.9" floors → 1-based 3 → 0-based 2', clampGoToPage('3.9', 10) === 2);
ok('padded "  4  " → 3', clampGoToPage('  4  ', 10) === 3);

console.log(`clampGoToPage spine: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
