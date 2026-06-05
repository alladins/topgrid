// MOD-GRID-37 G-1 node spine — compareLocale. Run: node --experimental-strip-types.
// ★ Non-vacuous: the locale order must DIFFER from a code-point sort. Accented Latin is the proof —
// 'é' (U+00E9) sorts AFTER 'z' by code-point but BETWEEN 'e' and 'f' by locale. A test on already-
// ASCII-ordered data would pass under plain `<` too (vacuous). Also: numeric-aware (a2 < a10).
import { compareLocale } from './localeSort.ts';

let pass = 0,
  fail = 0;
const ok = (n: string, c: boolean): void => {
  if (c) pass++;
  else {
    fail++;
    console.log('  ❌', n);
  }
};
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const sortLocale = (xs: string[]) => [...xs].sort((a, b) => compareLocale(a, b));
const sortCodePoint = (xs: string[]) => [...xs].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

// accented Latin: locale puts 'é' between e and f; code-point puts it after z.
const accented = ['z', 'é', 'e', 'f'];
ok('locale orders é between e and f', eq(sortLocale(accented), ['e', 'é', 'f', 'z']));
ok('code-point orders é after z (the default text sort behavior)', eq(sortCodePoint(accented), ['e', 'f', 'z', 'é']));
ok(
  '★ locale order DIFFERS from code-point order (not a vacuous pass)',
  !eq(sortLocale(accented), sortCodePoint(accented)),
);

// numeric-aware: a2 should precede a10 (basic string sort puts a10 first).
const nums = ['a10', 'a2', 'a1'];
ok('numeric-aware: a1 < a2 < a10', eq(sortLocale(nums), ['a1', 'a2', 'a10']));
ok('basic string sort would mis-order a10 before a2', eq(sortCodePoint(nums), ['a1', 'a10', 'a2']));

// Korean collation: 자모 순 (가 < 나 < 다).
ok('Korean collates 가/나/다 in order', eq(sortLocale(['다', '가', '나']), ['가', '나', '다']));

// symmetry / sign sanity.
ok('compareLocale is antisymmetric', compareLocale('a', 'b') < 0 && compareLocale('b', 'a') > 0);
ok('equal values compare 0', compareLocale('x', 'x') === 0);

console.log(`\nlocaleSort: ${pass} passed, ${fail} failed.`);
if (fail > 0) process.exit(1);
