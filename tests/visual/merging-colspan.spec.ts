import { test, expect, type Page, type Locator } from '@playwright/test';

// MOD-GRID-52 — column spanning (body cell colSpan) in grid-pro-merging. ★behavior-gated,
// non-vacuous (advisor): "a td appeared" is vacuous. width=sum would flake (table-layout:auto).
// The real assertions:
//  1) a spanning row has columnCount−(N−1) <td>s — covered cells ABSENT from the DOM.
//  2) the spanning <td>'s colSpan attribute = N (native colSpan; plain table → no aria-colspan).
//  3) right-edge alignment: spanning cell's right edge == Nth column's right edge in a reference row.
//  4) row-virt coherence: under row virtualization, a scrolled-in spanning row stays coherent
//     (within-row → no rowSpan-style L-01 orphan).
//  5) OFF (enableColSpan=false) byte-identical: no colSpan attribute, all cells present.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;
const rows = (page: Page): Locator => page.locator('#storybook-root tbody tr');
const rightEdge = async (loc: Locator): Promise<number> => {
  const box = await loc.boundingBox();
  if (!box) throw new Error('no bounding box');
  return box.x + box.width;
};

test('G-2 (non-virt): spanning row drops covered cells; colSpan attr = 3; right edges align', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-merging-merginggrid-column-span--default'));
  await page.locator('#storybook-root table').first().waitFor({ state: 'visible' });

  const row0 = rows(page).nth(0); // 'b' spans 3 (b,c,d)
  const row1 = rows(page).nth(1); // non-spanned reference (5 cells)

  // ★ covered cells absent: 5 columns, span 3 → 5 − (3−1) = 3 cells.
  await expect(row0.locator('td'), '★covered cells absent').toHaveCount(3);
  await expect(row1.locator('td'), 'reference row intact').toHaveCount(5);

  // ★ the spanning cell carries native colSpan=3 (and there is exactly one).
  const spanCell = row0.locator('td[colspan="3"]');
  await expect(spanCell).toHaveCount(1);
  await expect(spanCell).toHaveText('b0');

  // ★ right-edge alignment: span covers b,c,d → its right edge == column d's right edge
  //   in the reference row (row1 td index 3 = d). Layout-robust (no width=sum assumption).
  const spanRight = await rightEdge(spanCell);
  const dRight = await rightEdge(row1.locator('td').nth(3));
  expect(Math.abs(spanRight - dRight), '★span right edge aligns with column D').toBeLessThan(2);
});

test('G-2 (OFF): enableColSpan=false → no colSpan attribute, all cells present (byte-identical)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-merging-merginggrid-column-span--off'));
  await page.locator('#storybook-root table').first().waitFor({ state: 'visible' });

  await expect(rows(page).nth(0).locator('td'), 'all cells present when OFF').toHaveCount(5);
  await expect(page.locator('#storybook-root tbody td[colspan]'), 'no colSpan when OFF').toHaveCount(0);
});

test('G-2 (row-virt): a scrolled-in spanning row stays coherent (no L-01 orphan, within-row)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-merging-merginggrid-column-span--virtualized'));
  await page.locator('#storybook-root table').first().waitFor({ state: 'visible' });

  // row 40 carries the span; it is below the initial window → not rendered yet (proves windowing).
  await expect(page.getByText('b40', { exact: true }), 'span row not yet windowed').toHaveCount(0);

  // scroll the MergingGrid internal scroll container (its CSS height is bounded by the story).
  const scroller = page.locator('.cs-virt-wrap > div');
  await scroller.evaluate((el) => {
    el.scrollTop = 1400; // ≈ row 40 × 36px estimated height
  });

  // ★ after scrolling row 40 into the window, its colSpan is intact and covered cells are absent.
  const spanCell = page.locator('#storybook-root tbody td[colspan="3"]');
  await expect(spanCell, '★spanning row windowed').toHaveCount(1);
  await expect(spanCell).toHaveText('b40');
  const spanRow = rows(page).filter({ has: page.locator('td[colspan="3"]') });
  await expect(spanRow.locator('td'), '★covered cells absent under virt').toHaveCount(3);
});
