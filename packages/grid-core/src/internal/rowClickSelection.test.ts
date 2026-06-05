// MOD-GRID-35 G-1 node spine — computeRowClickSelection. Run: node --experimental-strip-types.
// type-only import (RowSelectionState) → strip-types clean.
// ★ Non-vacuous: the modifier keys produce DIFFERENT selections from the same click. plain REPLACES
// (deselects others), ctrl TOGGLES (keeps others, and a second ctrl-click removes), single never
// keeps >1. A "selection changed" test that ignores the modifier would pass on wrong behavior.
import { computeRowClickSelection } from './rowClickSelection.ts';

let pass = 0,
  fail = 0;
const ok = (n: string, c: boolean): void => {
  if (c) pass++;
  else {
    fail++;
    console.log('  ❌', n);
  }
};
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// plain click on B, with A already selected → ONLY B (A deselected).
ok(
  'multi plain click replaces selection',
  eq(
    computeRowClickSelection({ current: { A: true }, clickedId: 'B', ctrl: false, mode: 'multi' })
      .selection,
    { B: true },
  ),
);

// ctrl+click on B, with A selected → A AND B (additive).
ok(
  'multi ctrl+click adds to selection',
  eq(
    computeRowClickSelection({ current: { A: true }, clickedId: 'B', ctrl: true, mode: 'multi' })
      .selection,
    { A: true, B: true },
  ),
);

// ctrl+click on an already-selected row → removes it (toggle off), keeps others.
ok(
  'multi ctrl+click toggles OFF a selected row',
  eq(
    computeRowClickSelection({
      current: { A: true, B: true },
      clickedId: 'B',
      ctrl: true,
      mode: 'multi',
    }).selection,
    { A: true },
  ),
);

// single mode: plain click → just clicked; even ctrl can't accumulate.
ok(
  'single mode keeps only the clicked row (plain)',
  eq(
    computeRowClickSelection({ current: { A: true }, clickedId: 'B', ctrl: false, mode: 'single' })
      .selection,
    { B: true },
  ),
);
ok(
  'single mode ignores ctrl (never >1)',
  eq(
    computeRowClickSelection({ current: { A: true }, clickedId: 'B', ctrl: true, mode: 'single' })
      .selection,
    { B: true },
  ),
);

// ── G-2: shift-range ─────────────────────────────────────────────────────────
const order = ['A', 'B', 'C', 'D', 'E'];

// shift+click E with anchor B → contiguous B..E selected (range, replacing).
ok(
  'shift selects the contiguous range from anchor to clicked',
  eq(
    computeRowClickSelection({
      current: { B: true },
      clickedId: 'E',
      ctrl: false,
      shift: true,
      mode: 'multi',
      anchorId: 'B',
      orderedIds: order,
    }).selection,
    { B: true, C: true, D: true, E: true },
  ),
);

// shift works UPWARD too (clicked above anchor) — range A..C with anchor C.
ok(
  'shift range works upward (clicked before anchor)',
  eq(
    computeRowClickSelection({
      current: {},
      clickedId: 'A',
      ctrl: false,
      shift: true,
      mode: 'multi',
      anchorId: 'C',
      orderedIds: order,
    }).selection,
    { A: true, B: true, C: true },
  ),
);

// shift PRESERVES the anchor so a second shift-click re-extends from the SAME anchor (not the last click).
ok(
  'shift preserves the anchor (re-extendable range)',
  computeRowClickSelection({
    current: { B: true },
    clickedId: 'E',
    ctrl: false,
    shift: true,
    mode: 'multi',
    anchorId: 'B',
    orderedIds: order,
  }).anchorId === 'B',
);

// shift with no anchor → falls back to plain (just the clicked row).
ok(
  'shift without anchor falls back to plain select',
  eq(
    computeRowClickSelection({
      current: { A: true },
      clickedId: 'C',
      ctrl: false,
      shift: true,
      mode: 'multi',
      anchorId: null,
      orderedIds: order,
    }).selection,
    { C: true },
  ),
);

// anchor is always the clicked row (consumed by shift-range in G-2).
ok(
  'anchor = clicked row',
  computeRowClickSelection({ current: {}, clickedId: 'C', ctrl: false, mode: 'multi' }).anchorId ===
    'C',
);

// plain click does not mutate the input selection object (purity).
const input = { A: true };
computeRowClickSelection({ current: input, clickedId: 'B', ctrl: true, mode: 'multi' });
ok('does not mutate input', eq(input, { A: true }));

console.log(`\nrowClickSelection: ${pass} passed, ${fail} failed.`);
if (fail > 0) process.exit(1);
