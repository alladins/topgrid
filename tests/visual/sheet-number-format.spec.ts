import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-62 — sheet cell number formatting. ★behavior-gated, non-vacuous: typing a numeric value
// into a formatted cell shows the FORMATTED display (currency/percent/decimals); an unformatted cell
// shows the raw value (passthrough). The stored value is unchanged — only the display is formatted.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;
const ID = 'grid-pro-sheet-sheetgrid--formatted';

async function typeInto(page: Page, ref: string, value: string): Promise<void> {
  await page.locator(`#storybook-root [data-cell="${ref}"]`).dblclick();
  await page.locator(`#storybook-root [data-testid="edit-${ref}"]`).fill(value);
  await page.locator(`#storybook-root [data-testid="edit-${ref}"]`).press('Enter');
}

test('G-2: formatted cells display currency/percent/decimals; unformatted passes through', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME(ID));
  await page.locator('#storybook-root table').first().waitFor({ state: 'visible' });

  // ★ currency: 1234 → $1,234.00
  await typeInto(page, 'B2', '1234');
  await expect(page.locator('[data-cell="B2"]'), '★currency').toHaveText('$1,234.00');

  // ★ percent (1dp): 0.125 → 12.5%
  await typeInto(page, 'C2', '0.125');
  await expect(page.locator('[data-cell="C2"]'), '★percent').toHaveText('12.5%');

  // ★ number (2dp): 5 → 5.00
  await typeInto(page, 'D2', '5');
  await expect(page.locator('[data-cell="D2"]'), '★decimals').toHaveText('5.00');

  // ★ unformatted cell passes through raw.
  await typeInto(page, 'A2', '7');
  await expect(page.locator('[data-cell="A2"]'), 'unformatted passthrough').toHaveText('7');
});
