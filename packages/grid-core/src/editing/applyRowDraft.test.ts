// MOD-GRID-50 G-1 node spine — 행 편집 draft 머지 (순수).
// Run: node --experimental-strip-types src/editing/applyRowDraft.test.ts
import { applyRowDraft } from './applyRowDraft.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

interface Row { id: number; name: string; score: number }
const row: Row = { id: 1, name: 'A', score: 10 };

ok('empty draft = equal copy', eq(applyRowDraft(row, {}), { id: 1, name: 'A', score: 10 }));
ok('single field override', eq(applyRowDraft(row, { name: 'B' }), { id: 1, name: 'B', score: 10 }));
ok('multi-field override (atomic merge)', eq(applyRowDraft(row, { name: 'B', score: 99 }), { id: 1, name: 'B', score: 99 }));
ok('draft-only keys override, others preserved', eq(applyRowDraft(row, { score: 0 }), { id: 1, name: 'A', score: 0 }));
ok('type-agnostic values (string from EditableCell)', eq(applyRowDraft(row, { score: '42' }), { id: 1, name: 'A', score: '42' }));

// ★immutability: input row not mutated, new object returned.
const before = JSON.stringify(row);
const out = applyRowDraft(row, { name: 'Z' });
ok('input row unchanged', JSON.stringify(row) === before);
ok('returns a new object (not same ref)', out !== (row as object));

// extra key not in row is added (consumer contract — draft keyed by row fields, but tolerant).
ok('unknown draft key added', eq(applyRowDraft(row, { extra: true }), { id: 1, name: 'A', score: 10, extra: true }));

console.log(`applyRowDraft spine: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
