// MOD-GRID-37 G-2 node spine — isBlank / blankToUndefined. Run: node --experimental-strip-types.
// ★ Non-vacuous: blanks (null/undefined/''/whitespace) → undefined, but real falsy values 0 and
// false PASS THROUGH unchanged. The classic bug is treating 0/false as blank (then a price of 0 or
// a boolean false would sort as "missing"). That distinction is the whole point of the helper.
import { isBlank, blankToUndefined } from './sortNulls.ts';

let pass = 0,
  fail = 0;
const ok = (n: string, c: boolean): void => {
  if (c) pass++;
  else {
    fail++;
    console.log('  ❌', n);
  }
};

// isBlank: blanks
ok('null is blank', isBlank(null) === true);
ok('undefined is blank', isBlank(undefined) === true);
ok('empty string is blank', isBlank('') === true);
ok('whitespace string is blank', isBlank('   ') === true);
// isBlank: NOT blank (the critical falsy cases)
ok('★ 0 is NOT blank', isBlank(0) === false);
ok('★ false is NOT blank', isBlank(false) === false);
ok('non-empty string is not blank', isBlank('x') === false);
ok('a real number is not blank', isBlank(42) === false);

// blankToUndefined wraps an accessor.
interface R {
  v: number | string | null | undefined;
}
const acc = blankToUndefined((r: R) => r.v);
ok('blank value → undefined', acc({ v: null }) === undefined && acc({ v: '' }) === undefined);
ok('★ 0 → 0 (not undefined)', acc({ v: 0 }) === 0);
ok('real value passes through', acc({ v: 42 }) === 42 && acc({ v: 'a' }) === 'a');

console.log(`\nsortNulls: ${pass} passed, ${fail} failed.`);
if (fail > 0) process.exit(1);
