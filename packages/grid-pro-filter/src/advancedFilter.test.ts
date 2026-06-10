// MOD-46 node spine — advanced filter. Run: node --experimental-strip-types src/advancedFilter.test.ts
import {
  evaluateAdvancedFilter,
  makeAdvancedFilterFn,
  matchCondition,
  advancedGlobalFilterFn,
  type AdvancedFilterExpr,
} from './advancedFilter.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };

const cond = (field: string, type: 'number'|'text'|'boolean'|'date', operator: string, value?: unknown): AdvancedFilterExpr =>
  ({ kind: 'condition', field, type, operator: operator as never, value });
const group = (logic: 'and'|'or', children: AdvancedFilterExpr[]): AdvancedFilterExpr => ({ kind: 'group', logic, children });

// ── ★ type-explicit divergence: same field+value, number vs text operator diverge ──
// row.x = "100". number gt 20 → 100 > 20 = TRUE. text gt "20" → "100" > "20" lexical = FALSE ('1' < '2').
ok('★ number gt 20 on "100" → true (numeric, not lexical)', evaluateAdvancedFilter(cond('x', 'number', 'gt', 20), { x: '100' }) === true);
ok('★ text gt "20" on "100" → false (lexical) — diverges from numeric', evaluateAdvancedFilter(cond('x', 'text', 'gt', '20'), { x: '100' }) === false);

// ── operators (number) ──
ok('number eq', matchCondition(5, 'number', 'eq', 5) === true);
ok('number neq', matchCondition(5, 'number', 'neq', 6) === true);
ok('number gte', matchCondition(5, 'number', 'gte', 5) === true);
ok('number lt', matchCondition(3, 'number', 'lt', 5) === true);
ok('number non-numeric cell → false', matchCondition('abc', 'number', 'gt', 1) === false);

// ── operators (text, case-insensitive — mirrors MOD-30) ──
ok('text contains (case-insensitive)', matchCondition('Hello World', 'text', 'contains', 'WORLD') === true);
ok('text startsWith', matchCondition('Hello', 'text', 'startsWith', 'he') === true);
ok('text eq exact', matchCondition('abc', 'text', 'eq', 'ABC') === true);
ok('text null cell → false (null-safe)', matchCondition(null, 'text', 'contains', 'x') === false);

// ── boolean / date ──
ok('boolean eq (string "true")', matchCondition('true', 'boolean', 'eq', true) === true);
ok('date gt', matchCondition('2024-06-01', 'date', 'gt', '2024-01-01') === true);
ok('date invalid → false', matchCondition('not-a-date', 'date', 'gt', '2024-01-01') === false);

// ── blank / notBlank ──
ok('blank on empty → true', matchCondition('', 'text', 'blank', undefined) === true);
ok('blank on value → false', matchCondition('x', 'text', 'blank', undefined) === false);
ok('notBlank on value → true', matchCondition('x', 'text', 'notBlank', undefined) === true);

// ── unknown operator → false (defined fallback, not true) ──
ok('unknown operator → false', matchCondition(5, 'number', 'xyz' as never, 5) === false);

// ── nested cross-column groups: (age>30 AND city contains "NY") OR status="active" ──
{
  const expr = group('or', [
    group('and', [cond('age', 'number', 'gt', 30), cond('city', 'text', 'contains', 'NY')]),
    cond('status', 'text', 'eq', 'active'),
  ]);
  const f = makeAdvancedFilterFn(expr);
  ok('nested: age 40 + city NYC → true', f({ age: 40, city: 'NYC', status: 'x' }) === true);
  ok('nested: age 20 but status active → true (OR)', f({ age: 20, city: 'LA', status: 'active' }) === true);
  ok('nested: age 20 + city LA + status x → false', f({ age: 20, city: 'LA', status: 'x' }) === false);
}

// ── ★ blank condition is INERT (removed), NOT identity-true-in-place (OR collapse trap) ──
{
  // OR [ incomplete(gt, no value) , status eq "active" ] — on a row where the REAL condition FAILS.
  const expr = group('or', [cond('age', 'number', 'gt'), cond('status', 'text', 'eq', 'active')]);
  ok('★ blank condition inert: OR(blank, real-fails) → false (NOT all-rows true)',
    evaluateAdvancedFilter(expr, { age: 99, status: 'x' }) === false);
  ok('★ blank condition inert: OR(blank, real-passes) → true (real governs)',
    evaluateAdvancedFilter(expr, { age: 1, status: 'active' }) === true);
}

// ── empty / all-inert group → true (no constraint) ──
ok('empty group → true', evaluateAdvancedFilter(group('and', []), { x: 1 }) === true);
ok('all-inert group → true', evaluateAdvancedFilter(group('or', [cond('a', 'number', 'eq')]), { a: 5 }) === true);

// ── MOD-76: advancedGlobalFilterFn (TanStack globalFilterFn adapter — reads row.original) ──
ok('★ globalFilterFn: matching expr on row.original → true',
  advancedGlobalFilterFn({ original: { region: 'North' } }, 'x', cond('region', 'text', 'eq', 'North')) === true);
ok('★ globalFilterFn: non-matching expr → false',
  advancedGlobalFilterFn({ original: { region: 'East' } }, 'x', cond('region', 'text', 'eq', 'North')) === false);
ok('★ globalFilterFn: null filterValue → true (unconstrained)',
  advancedGlobalFilterFn({ original: { region: 'East' } }, 'x', null) === true);
ok('★ globalFilterFn: undefined filterValue → true',
  advancedGlobalFilterFn({ original: { region: 'East' } }, 'x', undefined) === true);
ok('★ globalFilterFn: columnId ignored (row-level, same answer per column)',
  advancedGlobalFilterFn({ original: { region: 'North' } }, 'anyColumn', cond('region', 'text', 'eq', 'North')) === true);

console.log(`advancedFilter spine: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
