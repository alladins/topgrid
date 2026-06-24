import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-35 G-3 — indeterminate (partial) select-all. ★non-vacuous third state: selecting SOME
// (not all) rows makes the header checkbox `indeterminate === true` — distinct from checked (all)
// AND unchecked (none), with aria-checked="mixed". A test that only checks checked/unchecked would
// miss the partial state entirely (the exact bug AG/xxxx parity requires closing).
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('partial selection → indeterminate; all → checked; none → unchecked', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-select-all-indeterminate--default'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });
  const headerCb = root.locator('input[aria-label="select all rows"]');
  const rowCbs = root.locator('input[aria-label="select row"]');

  // none → unchecked, NOT indeterminate.
  await expect(headerCb).toHaveJSProperty('indeterminate', false);
  await expect(headerCb).not.toBeChecked();
  await expect(headerCb).toHaveAttribute('aria-checked', 'false');

  // check 1 of 3 → INDETERMINATE (the third state), still not "checked".
  await rowCbs.nth(0).check();
  await expect(headerCb).toHaveJSProperty('indeterminate', true);
  await expect(headerCb).not.toBeChecked();
  await expect(headerCb).toHaveAttribute('aria-checked', 'mixed');

  // check the rest → all selected → checked, NOT indeterminate.
  await rowCbs.nth(1).check();
  await rowCbs.nth(2).check();
  await expect(headerCb).toHaveJSProperty('indeterminate', false);
  await expect(headerCb).toBeChecked();
  await expect(headerCb).toHaveAttribute('aria-checked', 'true');

  // toggling the header off clears all → back to the none state.
  await headerCb.uncheck();
  await expect(rowCbs.nth(0)).not.toBeChecked();
  await expect(headerCb).toHaveJSProperty('indeterminate', false);
  await expect(headerCb).toHaveAttribute('aria-checked', 'false');
});
