import { test, expect, type Page, type Locator } from '@playwright/test';

// MOD-GRID-63 — sheet per-cell styling. ★behavior-gated, non-vacuous: styled cells carry the
// mapped computed style (bold→fontWeight 700, fill→background, align→text-align); an unstyled cell
// keeps the base style. Asserted via getComputedStyle, not "a cell exists".
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;
const ID = 'grid-pro-sheet-sheetgrid--styled';
const cell = (page: Page, ref: string): Locator => page.locator(`#storybook-root [data-cell="${ref}"]`);
const cssOf = (loc: Locator, prop: string): Promise<string> =>
  loc.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);

test('G-1: cellStyles map to computed style; unstyled cell keeps base', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME(ID));
  await page.locator('#storybook-root table').first().waitFor({ state: 'visible' });

  // ★ bold cell.
  expect(await cssOf(cell(page, 'A1'), 'font-weight'), '★A1 bold').toBe('700');
  // ★ fill (background-color #ffeeee = rgb(255, 238, 238)).
  expect(await cssOf(cell(page, 'B1'), 'background-color'), '★B1 fill').toBe('rgb(255, 238, 238)');
  // ★ align right.
  expect(await cssOf(cell(page, 'C1'), 'text-align'), '★C1 align').toBe('right');

  // unstyled cell keeps base (not bold, default left align).
  expect(await cssOf(cell(page, 'D1'), 'font-weight'), 'D1 base weight').not.toBe('700');
  expect(await cssOf(cell(page, 'D1'), 'text-align'), 'D1 base align').not.toBe('right');
});
