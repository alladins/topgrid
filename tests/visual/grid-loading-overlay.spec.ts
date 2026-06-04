import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-33 G-2 — loading overlay. ★non-vacuous: the overlay's whole point (vs the existing
// skeleton) is that EXISTING DATA STAYS in the DOM under the overlay. "overlay is visible" alone is
// vacuous. Asserts: data rows present + overlay on top + aria-busy + pointer-events block; and the
// reverse — plain loading still replaces with skeleton (additive, no regression).
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('overlay keeps existing data in the DOM + aria-busy + blocks pointer events', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-loading--overlay'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });

  // ★ existing data rows are STILL rendered (the only difference from skeleton).
  await expect(root.locator('tbody')).toContainText('김철수');
  await expect(root.locator('tbody')).toContainText('이영희');

  // overlay is present on top.
  const overlay = root.locator('[data-testid="loading-overlay"]');
  await expect(overlay).toBeVisible();
  await expect(overlay).toContainText('로딩');

  // aria-busy on the grid (SR signal).
  expect(await root.locator('table[role="grid"]').first().getAttribute('aria-busy')).toBe('true');

  // overlay blocks interaction below (opposite of the watermark's pointer-events-none).
  const pe = await overlay.evaluate((el) => getComputedStyle(el).pointerEvents);
  expect(pe, 'overlay blocks pointer events').not.toBe('none');
});

test('reverse: plain loading still replaces data with skeleton (additive, no regression)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-loading--skeleton'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });

  // skeleton path: data is NOT shown, and there is no overlay / aria-busy.
  await expect(root.locator('tbody')).not.toContainText('김철수');
  await expect(root.locator('[data-testid="loading-overlay"]')).toHaveCount(0);
  expect(await root.locator('table[role="grid"]').first().getAttribute('aria-busy')).toBeNull();
});
