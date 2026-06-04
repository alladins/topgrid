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

// HC-safe selection: bg-blue-50 flattens under forced-colors (the MOD-28 HC gap). The selected row
// must carry a STRUCTURAL cue (outline) that survives — non-vacuous = the cue is present AND a
// non-selected row lacks it, asserted under BOTH normal and forced-colors:active.
test('HC-safe selection: selected row has an outline that survives forced-colors', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-theme--selection-hc'));
  const root = page.locator('#storybook-root');
  await root.locator('tbody tr').first().waitFor({ state: 'visible' });

  // select the first data row via its checkbox.
  const firstRow = root.locator('tbody tr').first();
  await firstRow.locator('input[type="checkbox"]').check();

  const outlineStyleOf = (loc: typeof firstRow) =>
    loc.evaluate((el) => getComputedStyle(el).outlineStyle);

  // normal mode: selected row outlined, a non-selected row is not.
  expect(await outlineStyleOf(firstRow), 'selected row outlined').toBe('solid');
  expect(await outlineStyleOf(root.locator('tbody tr').nth(1)), 'unselected row not outlined').toBe('none');

  // forced-colors:active — bg would flatten here; the outline must persist (the HC claim).
  await page.emulateMedia({ forcedColors: 'active' });
  expect(await outlineStyleOf(firstRow), 'outline survives forced-colors').toBe('solid');
  expect(await outlineStyleOf(root.locator('tbody tr').nth(1)), 'unselected stays un-outlined in HC').toBe('none');
  await page.emulateMedia({ forcedColors: 'none' });
});

// cross-feature guard: a consumer cellClassName color must beat the theme cellText. If cellText is
// applied inline per-td it WINS over the class (inline > class) and silently grays out MOD-24
// conditional formatting — so the theme color must be inherited (from tbody), not inline on the td.
test('cellClassName color wins over theme cellText (conditional formatting not broken)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-theme--cell-color-override'));
  const root = page.locator('#storybook-root');
  await root.locator('tbody tr').first().waitFor({ state: 'visible' });
  // a score cell carries class .tg-red (rgb(255,0,0)); it must paint red, not gray-700.
  const scoreCell = root.locator('tbody td.tg-red').first();
  expect(await scoreCell.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(255, 0, 0)');
  // a non-score cell still inherits the theme default.
  expect(await root.locator('tbody td').first().evaluate((el) => getComputedStyle(el).color)).toBe('rgb(55, 65, 81)');
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
