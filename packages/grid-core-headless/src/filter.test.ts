// node --experimental-strip-types — 이관된 filterFn 특성화. dist import(repo 관례).
// FilterFn 은 row.getValue(columnId) 만 의존 → fake row 로 직접 호출(deep-equal 불요, boolean 단언).
import assert from 'node:assert/strict';
import { textFilterFn, numberFilterFn, dateRangeFilterFn } from '../dist/index.mjs';

// fake row: getValue(id) → 고정 셀 값
const rowOf = (v: unknown) => ({ getValue: (_id: string) => v }) as never;
const f = (fn: (r: never, id: string, v: never) => boolean, cell: unknown, val: unknown) =>
  fn(rowOf(cell), 'c', val as never);

let pass = 0;
const ok = (c: boolean, m: string) => { assert.ok(c, m); pass++; };

// text
ok(f(textFilterFn, 'Seoul', { operator: 'contains', value: 'eo' }) === true, 'contains 대소문자 무시 매치');
ok(f(textFilterFn, 'Seoul', { operator: 'equals', value: 'busan' }) === false, 'equals 불일치');
ok(f(textFilterFn, 'Seoul', { operator: 'startsWith', value: 'se' }) === true, 'startsWith');
ok(f(textFilterFn, null, { operator: 'contains', value: 'x' }) === false, 'null cell → false(null-safe)');
ok(f(textFilterFn, 'x', { operator: 'contains', value: '  ' }) === true, 'empty(trim) → true');

// number
ok(f(numberFilterFn, 510, { operator: '>', value: 300 }) === true, '> 매치');
ok(f(numberFilterFn, 150, { operator: '>', value: 300 }) === false, '> 불일치');
ok(f(numberFilterFn, 320, { operator: 'between', min: 300, max: 400 }) === true, 'between inclusive');
ok(f(numberFilterFn, 'NaN-ish', { operator: '=', value: 1 }) === false, '비수치 cell → false');

// date (from/to)
const d = (s: string) => new Date(s);
ok(f(dateRangeFilterFn, d('2026-06-15'), { from: d('2026-06-01'), to: d('2026-06-30') }) === true, '범위 내');
ok(f(dateRangeFilterFn, d('2026-07-15'), { from: d('2026-06-01'), to: d('2026-06-30') }) === false, '범위 밖');
ok(f(dateRangeFilterFn, d('2026-06-15'), { from: d('2026-06-01') }) === true, 'from-only 하한');
ok(f(dateRangeFilterFn, null, { from: d('2026-06-01') }) === false, 'null cell → false');

console.log(`filterFns characterization: ${pass} passed, 0 failed`);
