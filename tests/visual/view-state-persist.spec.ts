import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-60 — view-state save/restore (useViewStatePersistence). ★behavior-gated, non-vacuous:
// state is written to storage and survives a REMOUNT (fresh component re-reads storage in its
// useState initializer). Without persistence the remount resets to the initial value — so the
// post-remount value being the EDITED one is the proof.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('row-group state save/restore: grouping survives remount', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-agg-aggregationgrid--grouping-persist'));
  await page.locator('#storybook-root table').first().waitFor({ state: 'visible' });

  await expect(page.getByTestId('grouping-state')).toHaveText('');
  // apply grouping (persisted setter) → group rows appear + storage written.
  await page.getByTestId('group-dept').click();
  await expect(page.getByTestId('grouping-state')).toHaveText('dept');

  // ★ remount the persisted component → it re-reads storage → grouping restored (not reset to '').
  await page.getByTestId('remount').click();
  await expect(page.getByTestId('grouping-state'), '★grouping restored after remount').toHaveText('dept');
});

test('pivot state save/restore: transposed config survives remount', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-pivot-interaction--pivot-config-persist'));
  await page.locator('#storybook-root table').first().waitFor({ state: 'visible' });

  await expect(page.getByTestId('pivot-rows')).toHaveText('region');
  // transpose (⇄) swaps rows↔columns → onConfigChange → persisted.
  await page.getByRole('button', { name: '행/열 전치' }).click();
  await expect(page.getByTestId('pivot-rows')).toHaveText('quarter');

  // ★ remount → transposed config restored (not reset to 'region').
  await page.getByTestId('remount').click();
  await expect(page.getByTestId('pivot-rows'), '★pivot config restored after remount').toHaveText('quarter');
});
