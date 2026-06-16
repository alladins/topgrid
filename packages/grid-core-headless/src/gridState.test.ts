// node --experimental-strip-types — resolveResetValues 특성화(reset 엣지). dist import(repo 관례).
// reset 값은 plain data → deep-equal 가능(buildTableOptions 와 달리 함수 인스턴스 없음).
import assert from 'node:assert/strict';
import {
  DEFAULT_GRID_STATE_VALUES,
  GRID_STATE_KEYS,
  resolveResetValues,
} from '../dist/index.mjs';

let pass = 0;
const ok = (cond: boolean, msg: string) => { assert.ok(cond, msg); pass++; };

// 1) 전체 reset, initialState 없음 → 전부 DEFAULT
{
  const r = resolveResetValues(GRID_STATE_KEYS, {});
  assert.deepEqual(r, DEFAULT_GRID_STATE_VALUES, '전체 reset = DEFAULT');
  pass++;
}

// 2) initialState[key] 우선
{
  const init = { sorting: [{ id: 'date', desc: true }], pagination: { pageIndex: 2, pageSize: 50 } };
  const r = resolveResetValues(['sorting', 'pagination'], init);
  assert.deepEqual(r.sorting, init.sorting, 'sorting = initial 우선');
  assert.deepEqual(r.pagination, init.pagination, 'pagination = initial 우선');
  ok(Object.keys(r).length === 2, '요청한 2개 key 만 반환');
}

// 3) 부분 key — 미요청 key 는 반환 안 함
{
  const r = resolveResetValues(['columnFilters'], {});
  ok(Object.keys(r).length === 1 && 'columnFilters' in r, '부분 reset = 요청 key 만');
  assert.deepEqual(r.columnFilters, [], 'columnFilters 기본 []');
}

// 4) Set dedup — 중복 key 멱등
{
  const r = resolveResetValues(['sorting', 'sorting', 'sorting'], {});
  ok(Object.keys(r).length === 1, '중복 key dedup');
}

// 5) unknown key 무시
{
  const r = resolveResetValues(['sorting', 'bogus', 'nope'] as never, {});
  ok(Object.keys(r).length === 1 && 'sorting' in r, 'unknown key no-op');
}

// 6) initial 일부만 제공 → 나머지는 DEFAULT
{
  const r = resolveResetValues(['sorting', 'rowSelection'], { sorting: [{ id: 'x', desc: false }] });
  assert.deepEqual(r.sorting, [{ id: 'x', desc: false }], 'sorting=initial');
  assert.deepEqual(r.rowSelection, {}, 'rowSelection=DEFAULT(미제공)');
  pass += 2;
}

console.log(`resolveResetValues characterization: ${pass} passed, 0 failed`);
