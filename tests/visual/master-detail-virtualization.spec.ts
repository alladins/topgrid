import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-71 — master-detail + virtualization. ★non-vacuous (advisor): with 200 master rows and
// enableVirtualization, the DOM must hold only a WINDOW (far fewer than 200 measured <tbody> rows),
// the window must MOVE on scroll, and expanding a visible row must render its detail — proving the
// virtualizer windows + measureElement measures the expanded panel, not "200 rows rendered".
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('virtualized master-detail windows 200 rows and expands a detail', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-master-masterdetailgrid--virtualized'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });

  // ★ only a window of master-row <tbody data-index> is in the DOM, not all 200.
  const rowTbodies = root.locator('tbody[data-index]');
  const windowCount = await rowTbodies.count();
  expect(windowCount, 'window rendered, not all 200 rows').toBeGreaterThan(0);
  expect(windowCount, 'window is far smaller than the dataset').toBeLessThan(60);

  // the first window starts at the top (data-index 0 present).
  await expect(root.locator('tbody[data-index="0"]')).toHaveCount(1);

  // ★ scroll the container down → the window moves: row 0 leaves the DOM (windowing is real, not a
  //   render-all). poll (measureElement re-measures async under load).
  await root.locator('table').first().evaluate((t) => {
    const c = t.closest('div[style*="overflow"]') as HTMLElement;
    c.scrollTop = 1500;
  });
  await expect
    .poll(async () => root.locator('tbody[data-index="0"]').count(), { timeout: 5000 })
    .toBe(0);

  // ★ expand a currently-visible master row → its detail panel renders (measureElement measures it).
  await root.locator('tbody[data-index] button').first().click();
  await expect(root.locator('[data-detail]'), 'a detail panel rendered after expand').not.toHaveCount(0);
});
