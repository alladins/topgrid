// MOD-GRID-60 G-1 node spine — versioned view-state envelope round-trip.
// Run: node --experimental-strip-types src/internal/viewStateEnvelope.test.ts
import { serializeViewState, deserializeViewState } from './viewStateEnvelope.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// round-trip: grouping (string[]) and pivot config (object).
const grouping = ['region', 'city'];
ok('round-trip grouping', eq(deserializeViewState<string[]>(serializeViewState(grouping, 1), 1), grouping));

const pivotCfg = { rows: ['region'], columns: ['year'], values: [{ field: 'sales', aggregationFn: 'sum' }] };
ok('round-trip pivot config', eq(deserializeViewState(serializeViewState(pivotCfg, 1), 1), pivotCfg));

// version mismatch → null (stale schema discarded).
ok('version mismatch → null', deserializeViewState(serializeViewState(grouping, 1), 2) === null);

// parse failure → null.
ok('garbage → null', deserializeViewState('{not json', 1) === null);
ok('null raw → null', deserializeViewState(null, 1) === null);

// wrong shape (no v/p) → null.
ok('non-envelope object → null', deserializeViewState(JSON.stringify({ x: 1 }), 1) === null);
ok('bare value (not enveloped) → null', deserializeViewState(JSON.stringify(grouping), 1) === null);

// empty value round-trips (distinct from null).
ok('empty array round-trips', eq(deserializeViewState<string[]>(serializeViewState([], 1), 1), []));
ok('empty object round-trips', eq(deserializeViewState(serializeViewState({}, 1), 1), {}));

// version 0 is a valid version (not falsy-confused).
ok('version 0 round-trips', eq(deserializeViewState(serializeViewState(grouping, 0), 0), grouping));
ok('version 0 vs 1 mismatch → null', deserializeViewState(serializeViewState(grouping, 0), 1) === null);

console.log(`viewStateEnvelope spine: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
