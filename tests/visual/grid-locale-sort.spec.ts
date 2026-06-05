import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-37 G-1 — locale/collation-aware sort. ★non-vacuous: after sorting ascending, 'é' lands
// BETWEEN 'e' and 'f' (locale collation), NOT after 'z' (code-point / default text sort). The
// position of 'é' at index 1 is the discriminator — a code-point sort would put it at index 3.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test("locale sort puts é between e and f (not at code-point's after-z position)", async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-locale-sort--default'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });

  // sort ascending by clicking the column header.
  await root.locator('thead th', { hasText: '단어' }).click();

  // ★ locale order: e, é, f, z. (code-point order would be e, f, z, é.)
  await expect(root.locator('tbody tr td')).toHaveText(['e', 'é', 'f', 'z']);
});
