// MOD-GRID-74 node spine — computeSheetMerges pure model.
// computeSheetMerges cross-imports cellAddress with a `.js` extension (NodeNext) → strip-types
// can't resolve it, so esbuild-bundle the pure module and import the bundle (mirrors engine.test.mjs).
// Run via package "test" script.
import { build } from 'esbuild';
import { rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const out = 'merges-bundle.tmp.mjs';
await build({
  entryPoints: ['src/internal/computeSheetMerges.ts'],
  bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error',
});
const { computeSheetMerges } = await import(pathToFileURL(out).href);

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.log('  ❌', n); } };
const sorted = (s) => [...s].sort().join(',');

// 1) rectangular A1:C2 → anchor A1 (2 rows × 3 cols), 5 covered
{
  const { anchors, covered } = computeSheetMerges(['A1:C2'], 12, 6);
  ok('anchor A1 present', anchors.has('A1'));
  ok('anchor span 2×3', anchors.get('A1')?.rowSpan === 2 && anchors.get('A1')?.colSpan === 3);
  ok('anchor not in covered', !covered.has('A1'));
  ok('covered = A2,B1,B2,C1,C2', sorted(covered) === 'A2,B1,B2,C1,C2');
  ok('covered count 5', covered.size === 5);
}

// 2) single-row A1:C1 → 1×3
{
  const { anchors, covered } = computeSheetMerges(['A1:C1'], 12, 6);
  ok('single-row span 1×3', anchors.get('A1')?.rowSpan === 1 && anchors.get('A1')?.colSpan === 3);
  ok('single-row covered B1,C1', sorted(covered) === 'B1,C1');
}

// 3) single-col B2:B4 → 3×1
{
  const { anchors, covered } = computeSheetMerges(['B2:B4'], 12, 6);
  ok('single-col anchor B2', anchors.has('B2'));
  ok('single-col span 3×1', anchors.get('B2')?.rowSpan === 3 && anchors.get('B2')?.colSpan === 1);
  ok('single-col covered B3,B4', sorted(covered) === 'B3,B4');
}

// 4) 1×1 → no merge
{
  const { anchors, covered } = computeSheetMerges(['D5:D5'], 12, 6);
  ok('1x1 → no anchor', anchors.size === 0 && covered.size === 0);
}

// 5) reversed corners normalize (C2:A1 ≡ A1:C2)
{
  const { anchors } = computeSheetMerges(['C2:A1'], 12, 6);
  ok('reversed corners → anchor A1 2×3', anchors.get('A1')?.rowSpan === 2 && anchors.get('A1')?.colSpan === 3);
}

// 6) clamp far edge to grid (A1:Z99 in 3×3 → A1:C3)
{
  const { anchors, covered } = computeSheetMerges(['A1:Z99'], 3, 3);
  ok('clamp span 3×3', anchors.get('A1')?.rowSpan === 3 && anchors.get('A1')?.colSpan === 3);
  ok('clamp covered count 8', covered.size === 8);
}

// 7) anchor out of bounds → ignored
{
  const { anchors } = computeSheetMerges(['Z1:Z2'], 12, 6);
  ok('out-of-bounds anchor ignored', anchors.size === 0);
}

// 8) overlap first-wins (A1:B2 then B2:C3 — B2 already covered → second skipped)
{
  const { anchors, covered } = computeSheetMerges(['A1:B2', 'B2:C3'], 12, 6);
  ok('first merge kept', anchors.has('A1') && anchors.get('A1')?.rowSpan === 2);
  ok('overlapping second skipped', !anchors.has('B2'));
  ok('covered = A1 block only', sorted(covered) === 'A2,B1,B2');
}

// 9) malformed / single-cell specs skipped, valid kept
{
  const { anchors } = computeSheetMerges(['garbage', 'A1', 'A1:B1'], 12, 6);
  ok('only valid range applied', anchors.size === 1 && anchors.has('A1'));
}

rmSync(out, { force: true });
console.log(`\ncomputeSheetMerges: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
