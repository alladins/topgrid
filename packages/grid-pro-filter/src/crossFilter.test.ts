// MOD-47 node spine — selectionsToFilter (cross-filter mapping). Run: node --experimental-strip-types src/crossFilter.test.ts
import { selectionsToFilter, type FilterSelection } from './crossFilter.ts';
import { evaluateAdvancedFilter } from './advancedFilter.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };
const matches = (sels: FilterSelection[], row: Record<string, unknown>) =>
  evaluateAdvancedFilter(selectionsToFilter(sels), row);

// single selection → eq condition.
ok('single: category=North matches North', matches([{ field: 'category', type: 'text', value: 'North' }], { category: 'North' }) === true);
ok('single: category=North rejects East', matches([{ field: 'category', type: 'text', value: 'North' }], { category: 'East' }) === false);

// ★ same field → OR (North + South).
{
  const sels: FilterSelection[] = [
    { field: 'category', type: 'text', value: 'North' },
    { field: 'category', type: 'text', value: 'South' },
  ];
  ok('★ same-field OR: North matches', matches(sels, { category: 'North' }) === true);
  ok('★ same-field OR: South matches', matches(sels, { category: 'South' }) === true);
  ok('★ same-field OR: East rejected', matches(sels, { category: 'East' }) === false);
}

// ★ different fields → AND (category=North AND year=2024).
{
  const sels: FilterSelection[] = [
    { field: 'category', type: 'text', value: 'North' },
    { field: 'year', type: 'number', value: 2024 },
  ];
  ok('★ cross-field AND: North+2024 matches', matches(sels, { category: 'North', year: 2024 }) === true);
  ok('★ cross-field AND: North+2023 rejected', matches(sels, { category: 'North', year: 2023 }) === false);
  ok('★ cross-field AND: South+2024 rejected', matches(sels, { category: 'South', year: 2024 }) === false);
}

// ★ type carried from meta: numeric year compares numerically (not "2024" string eq mismatch).
ok('★ numeric type: year=2024 (number) matches row year 2024 (number)',
  matches([{ field: 'year', type: 'number', value: 2024 }], { year: 2024 }) === true);
ok('★ numeric type: year=2024 matches row year "2024" (string coerces numerically)',
  matches([{ field: 'year', type: 'number', value: 2024 }], { year: '2024' }) === true);

// combined: 2 same-field (OR) + 1 other field (AND).
{
  const sels: FilterSelection[] = [
    { field: 'category', type: 'text', value: 'North' },
    { field: 'category', type: 'text', value: 'South' },
    { field: 'year', type: 'number', value: 2024 },
  ];
  ok('combined OR-within + AND-across: North+2024 → true', matches(sels, { category: 'North', year: 2024 }) === true);
  ok('combined: South+2024 → true', matches(sels, { category: 'South', year: 2024 }) === true);
  ok('combined: North+2023 → false (year AND fails)', matches(sels, { category: 'North', year: 2023 }) === false);
  ok('combined: East+2024 → false (category OR fails)', matches(sels, { category: 'East', year: 2024 }) === false);
}

// empty selection → no constraint (every row passes).
ok('empty selections → no constraint (all rows pass)', matches([], { anything: 1 }) === true);

console.log(`crossFilter spine: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
