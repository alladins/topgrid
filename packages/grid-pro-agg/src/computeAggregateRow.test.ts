// MOD-45 node spine — computeAggregateRow. Run: node --experimental-strip-types src/computeAggregateRow.test.ts
import { computeAggregateRow } from './computeAggregateRow.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };

const data = [
  { region: 'A', sales: 1, qty: 3 },
  { region: 'A', sales: 2, qty: 1 },
  { region: 'A', sales: 3, qty: 2 },
  { region: 'B', sales: 10, qty: 5 },
];

// basic reducers over the whole grid.
ok('sum', computeAggregateRow(data, { sales: 'sum' }).sales === 16);
ok('avg', computeAggregateRow(data, { sales: 'avg' }).sales === 4); // 16/4
ok('min', computeAggregateRow(data, { sales: 'min' }).sales === 1);
ok('max', computeAggregateRow(data, { sales: 'max' }).sales === 10);
ok('count = row count', computeAggregateRow(data, { sales: 'count' }).sales === 4);

// ★ avg-of-avgs avoidance: group A avg = (1+2+3)/3 = 2, group B avg = 10 → avg-of-avgs = (2+10)/2 = 6.
// TRUE whole-grid avg over source = 16/4 = 4. computeAggregateRow must give 4, NOT 6.
ok('★ avg-of-avgs avoided (whole-grid avg = 4, not 6)', computeAggregateRow(data, { sales: 'avg' }).sales === 4);

// multi-column spec.
{
  const r = computeAggregateRow(data, { sales: 'sum', qty: 'max' });
  ok('multi-column: sales sum + qty max', r.sales === 16 && r.qty === 5);
}

// empty-set semantics: avg/min/max → null, sum → 0, count → 0.
{
  const empty = computeAggregateRow([], { x: 'avg' });
  ok('empty avg → null', empty.x === null);
  ok('empty sum → 0', computeAggregateRow([], { x: 'sum' }).x === 0);
  ok('empty min → null', computeAggregateRow([], { x: 'min' }).x === null);
  ok('empty count → 0', computeAggregateRow([], { x: 'count' }).x === 0);
}

// non-numeric / blank values ignored (Excel range behavior); count still counts rows.
{
  const mixed = [{ v: 5 }, { v: '' }, { v: 'abc' }, { v: '7' }, { v: null }];
  ok('non-numeric/blank ignored in sum (5+7=12)', computeAggregateRow(mixed, { v: 'sum' }).v === 12);
  ok('count counts ALL rows incl non-numeric (5)', computeAggregateRow(mixed, { v: 'count' }).v === 5);
  ok('avg over numeric only (12/2=6)', computeAggregateRow(mixed, { v: 'avg' }).v === 6);
}

// immutability: input not mutated.
ok('input not mutated', data.length === 4 && data[0].sales === 1);

console.log(`computeAggregateRow spine: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
