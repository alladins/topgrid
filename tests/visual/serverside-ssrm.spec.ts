import { test, expect, type Locator, type Page } from '@playwright/test';

// MOD-GRID-22 G-2 — SSRM AC① browser gate (the real gate per LESS-006: the node controller test
// is necessary but cannot exercise a real scroll-driven virtualizer). Adaptive to dynamic row
// measurement: reads the actually-visible row indices from the DOM rather than guessing pixels,
// then asserts those rows' block was lazy-fetched exactly once and the rows appear — and that the
// whole grid was NOT loaded up front.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;
const ID = 'grid-pro-serverside-ssrm--infinite-scroll';
const BLOCK = 50;
const TOTAL_BLOCKS = 20; // 1000 rows / 50

const scrollerOf = (root: Locator) => root.locator('div:has(> table)').first();

async function startRows(page: Page): Promise<number[]> {
  return page.evaluate(
    () =>
      (
        (globalThis as unknown as { __ssrmCalls?: Array<{ startRow: number }> })
          .__ssrmCalls ?? []
      ).map((c) => c.startRow),
  );
}
async function visibleIndices(root: Locator): Promise<number[]> {
  return root
    .locator('tbody tr[data-index]')
    .evaluateAll((trs) => trs.map((t) => Number(t.getAttribute('data-index'))));
}
const countOf = (arr: number[], v: number) => arr.filter((s) => s === v).length;

test('far scroll lazy-loads the visible block exactly once; grid not loaded up front', async ({
  page,
}) => {
  await page.goto(FRAME(ID));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });

  // top block loads on mount (virtualizer's initial onChange → ensureRange).
  await expect(root.getByText('row-0', { exact: true })).toBeVisible();
  let starts = await startRows(page);
  expect(starts, 'top block fetched on mount').toContain(0);
  expect(countOf(starts, 0), 'top block fetched exactly once').toBe(1);
  // laziness: the grid is NOT fully loaded up front (far blocks absent).
  expect(new Set(starts).size, 'few blocks loaded on mount (lazy)').toBeLessThan(TOTAL_BLOCKS);

  // jump to the bottom; SSRM blocks lazy-load on scroll with dynamic measurement, so poll
  // (re-scroll + re-read) until a mid-visible row far from the top has its REAL data RENDERED
  // (block loaded) — a condition wait tied to the exact downstream check, not a settle-time guess.
  const scroller = scrollerOf(root);
  let idx = 0;
  await expect(async () => {
    await scroller.evaluate((el) => el.scrollTo(0, 10_000_000));
    const v = await visibleIndices(root);
    expect(v.length, 'rows visible after scroll').toBeGreaterThan(0);
    idx = v[Math.floor(v.length / 2)]!; // a row currently in view near the bottom
    expect(idx, 'scrolled far from the top').toBeGreaterThan(300);
    await expect(
      root.getByText(`row-${idx}`, { exact: true }),
      'mid-visible row data rendered (block loaded)',
    ).toBeVisible({ timeout: 1000 });
  }).toPass();

  // that visible row shows REAL data (its block lazy-loaded on scroll), and its block fired once.
  await expect(root.getByText(`row-${idx}`, { exact: true })).toBeVisible();
  const block = Math.floor(idx / BLOCK) * BLOCK;
  starts = await startRows(page);
  expect(starts, `block @${block} fetched after scroll`).toContain(block);
  expect(countOf(starts, block), `block @${block} fetched exactly once`).toBe(1);

  // still lazy after the jump: we did not end up loading every block.
  expect(new Set(starts).size, 'not all blocks loaded (jumped over middle)').toBeLessThan(
    TOTAL_BLOCKS,
  );

  // exactly-once invariant across the whole session (AC① dedup), through the mount onChange
  // cascade + far jump + re-measurement.
  const counts = new Map<number, number>();
  for (const s of starts) counts.set(s, (counts.get(s) ?? 0) + 1);
  expect(
    [...counts.entries()].filter(([, n]) => n > 1),
    'no block fetched more than once',
  ).toEqual([]);
});
