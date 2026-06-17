// node --experimental-strip-types — range 순수 함수 특성화. dist import(repo 관례). deep-equal OK(plain data).
import assert from 'node:assert/strict';
import {
  normalizeRange,
  isInRange,
  detectSeriesStep,
  fillRange,
  stringifyTsv,
  parseTsv,
} from '../dist/index.mjs';

let pass = 0;
const ok = (c: boolean, m: string) => { assert.ok(c, m); pass++; };

// normalizeRange: 역방향 드래그 정규화
{
  const n = normalizeRange({ start: { row: 3, col: 2 }, end: { row: 0, col: 0 } });
  assert.deepEqual(n, { start: { row: 0, col: 0 }, end: { row: 3, col: 2 } }, '역방향 정규화'); pass++;
}
// isInRange
ok(isInRange(1, 1, { start: { row: 0, col: 0 }, end: { row: 2, col: 2 } }) === true, '범위 내');
ok(isInRange(3, 3, { start: { row: 0, col: 0 }, end: { row: 2, col: 2 } }) === false, '범위 밖');
ok(isInRange(0, 0, null) === false, 'null range → false');

// detectSeriesStep
ok(detectSeriesStep([2, 4, 6]) === 2, '등차 step=2');
ok(detectSeriesStep([1, 2, 4]) === null, '불일치 → null');
ok(detectSeriesStep([5]) === 0, '단일 → 0(복사)');

// fillRange down: 시리즈 연장 (소스 [10,20] 세로 → down 2 = 30,40)
{
  const src = { start: { row: 0, col: 0 }, end: { row: 1, col: 0 } };
  const vals: Record<string, number> = { '0,0': 10, '1,0': 20 };
  const updates = fillRange<number>(src, 'down', 2, (r, c) => vals[`${r},${c}`]);
  assert.deepEqual(
    updates,
    [{ row: 2, col: 0, value: 30 }, { row: 3, col: 0, value: 40 }],
    'down fill 등차 연장 30,40',
  ); pass++;
}
// fillRange 비수치 → 순환 복사
{
  const src = { start: { row: 0, col: 0 }, end: { row: 1, col: 0 } };
  const vals: Record<string, string> = { '0,0': 'A', '1,0': 'B' };
  const updates = fillRange<string>(src, 'down', 2, (r, c) => vals[`${r},${c}`]);
  // 비수치 → modulo 순환(stepIndex=fi+1): [A,B] → idx1,idx0 = B,A (기존 grid-pro-range 동작 보존).
  ok(updates.map((u) => u.value).join('') === 'BA', '비수치 순환 복사 B,A(보존)');
}

// TSV roundtrip + 특수문자(탭/따옴표) RFC4180
{
  const matrix = [['a', 'b'], ['c\td', 'e"f']];
  const tsv = stringifyTsv(matrix);
  const parsed = parseTsv(tsv);
  assert.deepEqual(parsed, [['a', 'b'], ['c\td', 'e"f']], 'TSV roundtrip(탭/따옴표 보존)'); pass++;
}

console.log(`range characterization: ${pass} passed, 0 failed`);
