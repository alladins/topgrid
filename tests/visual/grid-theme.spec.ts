import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-29 G-2 — CSS-variable theming, computed-style gate (the spec forbids claiming
// "themeable" from node: themeToVars is a pure map; only the browser proves the var flows
// root→surface and paints). Two complementary non-vacuous claims (LESS-006):
//   default story  → every converted surface computes to the literal hex it replaced (NO regression
//                    despite the class→inline-var rewrite — the markup changed, the paint must not).
//   dark story     → the same surfaces flip to the darkTheme values (the vars actually flow).
// "surface has some color" is the vacuous version.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

// computed color of a surface inside the grid root.
async function styleOf(
  page: Page,
  selector: string,
  prop: 'backgroundColor' | 'color' | 'borderTopColor',
): Promise<string> {
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });
  return root.locator(selector).first().evaluate(
    (el, p) => getComputedStyle(el)[p as 'backgroundColor'],
    prop,
  );
}

// default: each surface keeps the gray/white it had before the var rewrite.
test('default (no theme): all 5 surfaces keep their original colors', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-theme--default'));
  expect(await styleOf(page, 'thead', 'backgroundColor'), 'headerBg=gray-50').toBe('rgb(249, 250, 251)');
  expect(await styleOf(page, 'tbody', 'backgroundColor'), 'bodyBg=white').toBe('rgb(255, 255, 255)');
  expect(await styleOf(page, 'tbody td', 'color'), 'cellText=gray-700').toBe('rgb(55, 65, 81)');
  expect(await styleOf(page, 'thead th', 'color'), 'headerText=gray-500').toBe('rgb(107, 114, 128)');
  // container border (the div wrapping the table).
  const border = await page
    .locator('#storybook-root')
    .locator('div.rounded-lg.border')
    .first()
    .evaluate((el) => getComputedStyle(el).borderTopColor);
  expect(border, 'border=gray-200').toBe('rgb(229, 231, 235)');
});

// distinctive single-key override → var flows root→thead.
test('headerBg override: var flows root→thead and paints the distinctive color', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-theme--header-bg-override'));
  expect(await styleOf(page, 'thead', 'backgroundColor')).toBe('rgb(255, 0, 0)');
});

// dark preset → the same surfaces flip to the dark values (multi-surface var flow).
test('dark preset: all 5 surfaces flip to darkTheme values', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-theme--dark'));
  expect(await styleOf(page, 'thead', 'backgroundColor'), 'headerBg #1f2937').toBe('rgb(31, 41, 55)');
  expect(await styleOf(page, 'tbody', 'backgroundColor'), 'bodyBg #111827').toBe('rgb(17, 24, 39)');
  expect(await styleOf(page, 'tbody td', 'color'), 'cellText #e5e7eb').toBe('rgb(229, 231, 235)');
  expect(await styleOf(page, 'thead th', 'color'), 'headerText #d1d5db').toBe('rgb(209, 213, 219)');
  const border = await page
    .locator('#storybook-root')
    .locator('div.rounded-lg.border')
    .first()
    .evaluate((el) => getComputedStyle(el).borderTopColor);
  expect(border, 'border #374151').toBe('rgb(55, 65, 81)');
});
