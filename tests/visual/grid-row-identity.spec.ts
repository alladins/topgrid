import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-36 G-1 — stable row identity (getRowId). ★non-vacuous: after selecting row "B" and
// prepending a new row "Z", selection must FOLLOW the identity (B still selected, now at index 2),
// NOT the index (index-keyed selection would jump to whatever row is now at B's old position). The
// new top row Z must be UNSELECTED. This is the exact bug getRowId exists to fix.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('selection follows the row id across a data reorder (not the index)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-row-identity--default'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });
  const rows = root.locator('tbody tr[role="row"]');

  // initial order: A, B, C. select B (index 1) via its checkbox.
  await expect(rows.nth(1)).toContainText('바나나');
  await rows.nth(1).locator('input[aria-label="select row"]').check();
  await expect(rows.nth(1)).toHaveAttribute('aria-selected', 'true');

  // prepend Z → order becomes Z, A, B, C. B is now at index 2.
  await root.locator('[data-testid="prepend"]').click();
  await expect(rows.nth(0)).toContainText('신규'); // Z is the new top row

  // ★ B (now index 2) is STILL selected — selection followed its id, not the position.
  await expect(rows.nth(2), 'B kept its selection by id').toContainText('바나나');
  await expect(rows.nth(2)).toHaveAttribute('aria-selected', 'true');
  // the new top row Z is NOT selected (index-keyed selection would have left index-1 selected).
  await expect(rows.nth(0)).toHaveAttribute('aria-selected', 'false');
  await expect(rows.nth(1), 'A (old index 1) is NOT selected').toHaveAttribute('aria-selected', 'false');

  // exactly one row selected total (no phantom/duplicate selection).
  await expect(root.locator('tbody tr[aria-selected="true"]')).toHaveCount(1);
});
