// MOD-GRID-52 G-1 node spine — 본문 셀 가로 병합(colSpan) 순수 계산.
// Run: node --experimental-strip-types src/computeColSpans.test.ts
import { computeColSpans } from './computeColSpans.ts';
import type { ColSpanFn } from './types.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };

interface Row { a: number; b: number; c: number; d: number; e: number }
const rows: Row[] = [
  { a: 1, b: 2, c: 3, d: 4, e: 5 },
  { a: 6, b: 7, c: 8, d: 9, e: 10 },
];
const ALL = ['a', 'b', 'c', 'd', 'e'];
const cols = (spans: Record<string, ColSpanFn<Row>>) =>
  ALL.map((id) => ({ id, colSpan: spans[id] }));

// 1) 스팬 없음 — 빈 Map (모든 셀 일반).
{
  const m = computeColSpans(rows, cols({}));
  ok('no colSpan → empty map', m.size === 0);
}

// 2) n>1 시작 + 우측 피복 skip.
{
  // row 0 의 'b' 가 3컬럼(b,c,d) 스팬.
  const m = computeColSpans(rows, cols({ b: ({ rowIndex }) => (rowIndex === 0 ? 3 : 1) }));
  ok('start cell span=3', m.get('0_b') === 3);
  ok('covered c → 0', m.get('0_c') === 0);
  ok('covered d → 0', m.get('0_d') === 0);
  ok('a (before) normal/unset', m.get('0_a') === undefined);
  ok('e (after span) normal/unset', m.get('0_e') === undefined);
  ok('row 1 untouched (span=1)', m.get('1_b') === undefined && m.get('1_c') === undefined);
}

// 3) clamp — 행 끝 초과 스팬은 남은 컬럼 수로 절단.
{
  // 'd' 에서 span=10 → 남은 컬럼(d,e)=2 로 절단.
  const m = computeColSpans(rows, cols({ d: () => 10 }));
  ok('clamp to remaining (d span=2)', m.get('0_d') === 2);
  ok('clamp covers e → 0', m.get('0_e') === 0);
  ok('clamp does not wrap past row end', m.get('1_a') === undefined);
}

// 4) skip-of-skip — 피복된 컬럼 자신의 colSpan 은 무시.
{
  // 'b' span=3(b,c,d 피복). 'c' 도 span=2 선언하지만 피복 상태라 평가 안 됨.
  const m = computeColSpans(rows, cols({
    b: () => 3,
    c: () => 2, // c 는 b 에 피복 → 무시
  }));
  ok('b span=3', m.get('0_b') === 3);
  ok('c covered=0 (own colSpan ignored)', m.get('0_c') === 0);
  ok('d still covered by b (not re-spanned by c)', m.get('0_d') === 0);
  ok('e free after b span', m.get('0_e') === undefined);
}

// 5) 다중 독립 스팬 한 행.
{
  // 'a' span=2(a,b), 'd' span=2(d,e). c 는 일반.
  const m = computeColSpans(rows, cols({ a: () => 2, d: () => 2 }));
  ok('a span=2', m.get('0_a') === 2);
  ok('b covered', m.get('0_b') === 0);
  ok('c normal', m.get('0_c') === undefined);
  ok('d span=2', m.get('0_d') === 2);
  ok('e covered', m.get('0_e') === 0);
}

// 6) invalid 값 정규화 → 1(스팬 없음).
{
  const m = computeColSpans(rows, cols({
    a: () => 0,
    b: () => -3,
    c: () => Number.NaN,
    d: () => Infinity, // 비유한 → 1
  }));
  ok('span 0 → no span', m.get('0_a') === undefined);
  ok('span <0 → no span', m.get('0_b') === undefined);
  ok('NaN → no span', m.get('0_c') === undefined);
  ok('Infinity → no span', m.get('0_d') === undefined);
}

// 7) 소수 → floor.
{
  const m = computeColSpans(rows, cols({ b: () => 2.9 }));
  ok('2.9 → floor 2', m.get('0_b') === 2);
  ok('floor covers c only', m.get('0_c') === 0 && m.get('0_d') === undefined);
}

// 8) 빈 rows → 빈 Map.
{
  const m = computeColSpans([] as Row[], cols({ b: () => 3 }));
  ok('empty rows → empty map', m.size === 0);
}

console.log(`computeColSpans spine: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
