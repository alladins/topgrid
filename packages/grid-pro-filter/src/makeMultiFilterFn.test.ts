// MOD-30 G-3 node spine — makeMultiFilterFn compound logic. Runs standalone via:
//   node --experimental-strip-types src/makeMultiFilterFn.test.ts   (see package.json "test")
// Uses a MOCK base so the compound reduce + empty-condition filtering are tested in isolation — the
// strongest verification of the pure core (the chromium spine covers only one OR+empty case in the
// shipped UI). ★ The discriminating case: OR + an EMPTY 2nd condition must NOT collapse to all rows.
import { makeMultiFilterFn, type MultiFilterValue } from './makeMultiFilterFn.ts';
import type { FilterFn, Row } from '@tanstack/react-table';

let pass = 0;
let fail = 0;
const ok = (n: string, c: boolean): void => {
  if (c) pass++;
  else {
    fail++;
    console.log('  ❌', n);
  }
};

// mock base: condition = { v: string }. matches when cell contains v. empty v = inactive (true + autoRemove).
interface Cond {
  v: string;
}
const base: FilterFn<unknown> = (row, _columnId, value): boolean => {
  const cell = String((row as unknown as { __cell: string }).__cell);
  const c = value as Cond;
  if (c.v === '') return true; // mirrors textFilterFn: empty → true (the trap source)
  return cell.includes(c.v);
};
base.autoRemove = (value): boolean => {
  const c = value as Cond | undefined;
  return !c || c.v === '';
};

const multi = makeMultiFilterFn<Cond>(base);
const row = (cell: string): Row<unknown> => ({ __cell: cell }) as unknown as Row<unknown>;
const run = (cell: string, val: MultiFilterValue<Cond>): boolean =>
  multi(row(cell), 'col', val as unknown, () => {});

// AND
ok('AND both match', run('김철수', { logic: 'and', conditions: [{ v: '김' }, { v: '철' }] }) === true);
ok('AND one fails', run('김철수', { logic: 'and', conditions: [{ v: '김' }, { v: '박' }] }) === false);
// OR
ok('OR first matches', run('김철수', { logic: 'or', conditions: [{ v: '김' }, { v: '박' }] }) === true);
ok('OR neither matches', run('이영희', { logic: 'or', conditions: [{ v: '김' }, { v: '박' }] }) === false);
// ★ SPINE: empty condition dropped, not treated as true
ok('OR + empty 2nd: filled match still selects', run('김철수', { logic: 'or', conditions: [{ v: '김' }, { v: '' }] }) === true);
ok('OR + empty 2nd: NON-match NOT pulled in (no all-rows collapse)', run('이영희', { logic: 'or', conditions: [{ v: '김' }, { v: '' }] }) === false);
ok('AND + empty 2nd: single filled (match)', run('김철수', { logic: 'and', conditions: [{ v: '김' }, { v: '' }] }) === true);
ok('AND + empty 2nd: single filled (non-match)', run('이영희', { logic: 'and', conditions: [{ v: '김' }, { v: '' }] }) === false);
// all-empty / none → inert
ok('all empty → inert (true)', run('이영희', { logic: 'or', conditions: [{ v: '' }, { v: '' }] }) === true);
ok('no conditions → inert (true)', run('이영희', { logic: 'and', conditions: [] }) === true);
// autoRemove
ok('autoRemove: all-empty → true', multi.autoRemove!({ logic: 'or', conditions: [{ v: '' }, { v: '' }] } as unknown) === true);
ok('autoRemove: one filled → false', multi.autoRemove!({ logic: 'or', conditions: [{ v: '김' }, { v: '' }] } as unknown) === false);
ok('autoRemove: undefined → true', multi.autoRemove!(undefined) === true);

console.log(`makeMultiFilterFn spine: ${pass} passed, ${fail} failed`);
// throw (not process.exit) → non-zero exit without a @types/node dependency in this package.
if (fail) throw new Error(`${fail} spine assertion(s) failed`);
