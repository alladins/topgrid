import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-35 G-1 — row-click selection. ★non-vacuous divergence: a plain click REPLACES the
// selection (others deselect), ctrl/cmd+click TOGGLES (keeps others; a second ctrl-click removes),
// single mode never holds >1, and the existing onRowClick callback STILL fires alongside selection.
// A "row got selected" test that ignores the modifier would pass on replace-vs-toggle bugs.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('plain replaces, ctrl toggles (multi), and onRowClick still fires', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-row-click-select--multi'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });
  const rows = root.locator('tbody tr[role="row"]');
  const count = root.locator('[data-testid="click-count"]');

  // plain click row 0 → only row 0 selected; onRowClick fired once.
  await rows.nth(0).click();
  await expect(rows.nth(0)).toHaveAttribute('aria-selected', 'true');
  await expect(rows.nth(1)).toHaveAttribute('aria-selected', 'false');
  await expect(count).toHaveText('clicks: 1');

  // plain click row 1 → selection MOVES (row 0 deselected), not accumulated.
  await rows.nth(1).click();
  await expect(rows.nth(0)).toHaveAttribute('aria-selected', 'false');
  await expect(rows.nth(1)).toHaveAttribute('aria-selected', 'true');

  // ctrl+click row 2 → row 1 AND row 2 (additive toggle).
  await rows.nth(2).click({ modifiers: ['Control'] });
  await expect(rows.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(rows.nth(2)).toHaveAttribute('aria-selected', 'true');

  // ctrl+click the already-selected row 1 → toggles OFF; row 2 stays.
  await rows.nth(1).click({ modifiers: ['Control'] });
  await expect(rows.nth(1)).toHaveAttribute('aria-selected', 'false');
  await expect(rows.nth(2)).toHaveAttribute('aria-selected', 'true');

  // onRowClick fired on every one of the 4 clicks (coexists with selection).
  await expect(count).toHaveText('clicks: 4');
});

test('single mode never keeps more than one selected row', async ({ page }: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-row-click-select--single'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });
  const rows = root.locator('tbody tr[role="row"]');

  await rows.nth(0).click();
  await expect(rows.nth(0)).toHaveAttribute('aria-selected', 'true');
  // a second click elsewhere moves the single selection (no accumulation, even without modifiers).
  await rows.nth(2).click();
  await expect(rows.nth(0)).toHaveAttribute('aria-selected', 'false');
  await expect(rows.nth(2)).toHaveAttribute('aria-selected', 'true');
});
