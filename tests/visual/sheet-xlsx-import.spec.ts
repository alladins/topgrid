import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-69 — .xlsx import of the spreadsheet (with formulas). A real base64 .xlsx (A3 = A1+A2) is
// imported → createSheet → the engine re-evaluates the imported formula. ★end-to-end (LESS-006): the
// formula cell A3 shows the engine-computed 30 AND its raw is "=A1+A2" — proving import preserved the
// formula and the engine evaluated it (not just a cached value read).
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('importing an .xlsx preserves formulas and the engine recomputes them', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-sheet-xlsx-import--import-formula'));
  const root = page.locator('#storybook-root');
  await root.locator('[data-cell="A1"]').waitFor({ state: 'visible' });

  // imported literal values.
  await expect(root.locator('[data-cell="A1"]')).toHaveText('10');
  await expect(root.locator('[data-cell="A2"]')).toHaveText('20');
  await expect(root.locator('[data-cell="B1"]')).toHaveText('hi');

  // ★ the imported formula A3 was preserved (raw = "=A1+A2") AND the engine computed it (display = 30).
  await expect(root.locator('[data-cell="A3"]'), 'A3 engine-computed value').toHaveText('30');
  // the raw formula text is shown in the A3 row (third column) — proves the formula survived import.
  await expect(root.getByText('=A1+A2', { exact: true }), 'A3 raw formula preserved').toHaveCount(1);
});
