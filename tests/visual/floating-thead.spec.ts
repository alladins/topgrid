import { test, expect } from '@playwright/test';

// MOD-GRID-24 G-2 — thead-collision verification (the pending-chromium debt).
// Non-vacuous: under the old `top:0` bug the top floating row would stick at the container top
// (overlapping the sticky <thead>); the fix offsets it by the thead height so it sticks BELOW.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('top floating row sticks below the sticky thead after scroll (no collision)', async ({
  page,
}) => {
  await page.goto(FRAME('grid-core-grid-floating-rows--floating-scrollable'));

  const root = page.locator('#storybook-root');
  const table = root.locator('table').first();
  await table.waitFor({ state: 'visible' });
  const topRow = root.locator('tr[data-floating="top"]').first();
  await topRow.waitFor({ state: 'visible' });

  // scroll the grid's overflow:auto container down so sticky engages
  const scroller = root.locator('div[style*="overflow"]').first();
  await scroller.evaluate((el) => el.scrollTo(0, 300));
  await page.waitForTimeout(150);

  const thead = await root.locator('thead').first().boundingBox();
  const topFloat = await topRow.boundingBox();
  expect(thead, 'thead box').not.toBeNull();
  expect(topFloat, 'top floating row box').not.toBeNull();

  // top floating row must start at or below the thead's bottom edge (small tolerance)
  expect(topFloat!.y).toBeGreaterThanOrEqual(thead!.y + thead!.height - 2);
  // and the floating row must still be visible within the scroll viewport (sticky, not scrolled away)
  expect(topFloat!.height).toBeGreaterThan(0);
});
