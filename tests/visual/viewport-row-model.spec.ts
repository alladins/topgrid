import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-68 — viewport row model (push-based, real-time). The datasource pushes rows for the visible
// range and can push live in-place updates. ★end-to-end (LESS-006): the viewport rows render from the
// push, and a simulated server push mutates a visible cell IN PLACE — the real-time differentiator from
// pull-based SSRM (a client edit would not prove server-push).
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('viewport rows render from push, and a server push updates a visible cell in place', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-serverside-viewport--real-time-push'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });

  // viewport rows arrived via the datasource push (not a static data prop).
  const firstRow = root.locator('tbody tr').first();
  await expect(firstRow, 'row 0 pushed for the visible viewport').toContainText('row-0');

  // ★ simulate a real-time server push → row 0's value updates IN PLACE.
  await root.getByTestId('push').click();
  await expect(firstRow, 'row 0 cell mutated by the server push').toContainText('UPDATED');
  await expect(firstRow, 'old value gone').not.toContainText('row-0');
  // other rows are unaffected by the targeted push.
  await expect(root.locator('tbody tr').nth(1)).toContainText('row-1');
});
