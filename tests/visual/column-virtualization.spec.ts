import { test, expect, type Locator } from '@playwright/test';

// MOD-GRID-27 G-2 (Commit C) — column (horizontal) virtualization chromium matrix.
// First real-browser run of the ON windowing path (all node checks used the all-columns SSR
// fallback). Assertions are NON-VACUOUS: if windowing silently no-ops (all 22 columns render),
// the off-screen-absent + count<22 checks fail. Story pins are EDGE columns (c00→left, c21→right)
// so natural order == segment order → header↔body alignment is unambiguous.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;
const ID = 'grid-core-grid-column-virtualization';
const COL_COUNT = 22;

// scroll container = the div directly wrapping <table> (overflow-x-auto OR inline overflow:auto).
const scrollerOf = (root: Locator) => root.locator('div:has(> table)').first();

// real (non-pad) header labels in render order, normalized to 'Cnn'.
async function headerLabels(root: Locator): Promise<string[]> {
  return root
    .locator('thead tr')
    .first()
    .locator('th:not([aria-hidden="true"])')
    .evaluateAll((els) =>
      els
        .map((e) => (e.textContent ?? '').match(/C\d{2}/)?.[0] ?? '')
        .filter(Boolean),
    );
}

test.describe('column virtualization', () => {
  test('windowing drops off-screen center columns; pins persist across h-scroll', async ({
    page,
  }) => {
    // combined story = real inline overflow:auto scroller (storybook has no Tailwind, so the
    // column-only story's overflow-x-auto class is inert — see P27 finding). Horizontal scroll
    // here drives the column virtualizer; table-layout:fixed (ON) gives it real scroll width.
    await page.goto(FRAME(`${ID}--column-and-row-virtualized`));
    const root = page.locator('#storybook-root');
    await root.locator('table').first().waitFor({ state: 'visible' });

    // ── initial window ──────────────────────────────────────────────
    const before = await headerLabels(root);
    // windowing active: far fewer than all 22 columns are rendered.
    expect(before.length, 'rendered header count < COL_COUNT').toBeLessThan(COL_COUNT);
    // pins always rendered (invariant).
    expect(before, 'left pin present').toContain('C00');
    expect(before, 'right pin present').toContain('C21');
    // a far-right center column is NOT in the DOM yet (proves off-screen omission).
    expect(before, 'far center absent initially').not.toContain('C19');

    // ── scroll right ────────────────────────────────────────────────
    await scrollerOf(root).evaluate((el) => el.scrollTo(2200, 0));
    await page.waitForTimeout(200);

    const after = await headerLabels(root);
    // pins survive the scroll.
    expect(after, 'left pin persists').toContain('C00');
    expect(after, 'right pin persists').toContain('C21');
    // window shifted: an early center column dropped out, a far one came in.
    expect(after, 'early center now off-screen').not.toContain('C01');
    expect(after, 'far center now rendered').toContain('C19');
    expect(after.length, 'still windowed after scroll').toBeLessThan(COL_COUNT);
  });

  test('header ↔ body share the same cell structure and column alignment', async ({
    page,
  }) => {
    // NOTE: nth-child x-match proves ALIGNMENT (header/body/pads line up); it does NOT prove
    // windowing (passes even if all columns render) — that is the previous test's job.
    await page.goto(FRAME(`${ID}--column-and-row-virtualized`));
    const root = page.locator('#storybook-root');
    await root.locator('table').first().waitFor({ state: 'visible' });
    await scrollerOf(root).evaluate((el) => el.scrollTo(1200, 0));
    await page.waitForTimeout(200);

    const headerCells = root.locator('thead tr').first().locator('th');
    const bodyRow = root.locator('tbody tr[data-index]').first(); // data row, not pad/floating
    const bodyCells = bodyRow.locator('td');

    const hn = await headerCells.count();
    const bn = await bodyCells.count();
    expect(hn, 'header cell count == body cell count (same segments incl pads)').toBe(bn);
    expect(hn).toBeGreaterThan(2);

    for (let i = 0; i < hn; i++) {
      const hb = await headerCells.nth(i).boundingBox();
      const bb = await bodyCells.nth(i).boundingBox();
      expect(hb, `header cell ${i} box`).not.toBeNull();
      expect(bb, `body cell ${i} box`).not.toBeNull();
      expect(Math.abs(hb!.x - bb!.x), `column ${i} header/body x aligned`).toBeLessThan(2);
    }
  });

  test('vertical + horizontal virtualization run simultaneously', async ({ page }) => {
    await page.goto(FRAME(`${ID}--column-and-row-virtualized`));
    const root = page.locator('#storybook-root');
    await root.locator('table').first().waitFor({ state: 'visible' });

    await scrollerOf(root).evaluate((el) => el.scrollTo(2200, 1500));
    await page.waitForTimeout(200);

    // column windowing still active under combined scroll.
    const labels = await headerLabels(root);
    expect(labels, 'left pin present').toContain('C00');
    expect(labels, 'right pin present').toContain('C21');
    expect(labels.length, 'column-windowed').toBeLessThan(COL_COUNT);

    // row windowing active: not all 100 rows are in the DOM.
    const bodyRows = root.locator('tbody tr[data-index]');
    expect(await bodyRows.count(), 'row-windowed (< 100)').toBeLessThan(100);
  });

  test('column-only branch mounts windowed in browser (no row-virt)', async ({ page }) => {
    // Closes the one untested corner: the non-row-virt tbody branch + column windowing. Its
    // overflow-x-auto container is Tailwind-inert in storybook (P27-1) so SCROLL isn't asserted
    // here — only that it MOUNTS and is windowed (< COL_COUNT). Node covers its markup; this
    // proves the branch renders in a real browser without throwing.
    await page.goto(FRAME(`${ID}--column-virtualized`));
    const root = page.locator('#storybook-root');
    await root.locator('table').first().waitFor({ state: 'visible' });
    const labels = await headerLabels(root);
    expect(labels, 'left pin present').toContain('C00');
    expect(labels, 'right pin present').toContain('C21');
    expect(labels.length, 'windowed (< COL_COUNT)').toBeLessThan(COL_COUNT);
  });

  test('regression: virtualization OFF renders every column (non-vacuity anchor)', async ({
    page,
  }) => {
    await page.goto(FRAME(`${ID}--column-virtualization-off`));
    const root = page.locator('#storybook-root');
    await root.locator('table').first().waitFor({ state: 'visible' });
    const labels = await headerLabels(root);
    // OFF path renders all columns — this is what makes the ON "< COL_COUNT" checks meaningful.
    expect(labels.length, 'all columns rendered when OFF').toBe(COL_COUNT);
  });
});
