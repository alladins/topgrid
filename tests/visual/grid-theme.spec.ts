import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-29 G-2 — CSS-variable theming, computed-style gate (the spec forbids claiming
// "themeable" from node: themeToVars is a pure map; only the browser proves the var flows
// root→surface and paints). Spike surface = header bg. Two assertions, both required:
//   default → thead bg === the gray-50 it replaced (no regression)
//   override → thead bg === the distinctive color (the var actually painted)
// "thead has some bg" is the vacuous version (LESS-006).
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

async function theadBg(page: Page): Promise<string> {
  const root = page.locator('#storybook-root');
  await root.locator('table thead').first().waitFor({ state: 'visible' });
  return root.locator('table thead').first().evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
}

test('default (no theme): header bg falls back to gray-50 (#f9fafb)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-theme--default'));
  expect(await theadBg(page)).toBe('rgb(249, 250, 251)');
});

test('headerBg override: var flows root→thead and paints the distinctive color', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-theme--header-bg-override'));
  expect(await theadBg(page)).toBe('rgb(255, 0, 0)');
});
