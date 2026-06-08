import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-67 — server-side pivoting. The mock datasource returns server-pivoted rows + pivotResultFields;
// useServerSideData derives the nested pivot column tree (buildServerPivotColumns). ★end-to-end: the
// dynamic pivot-result columns (Q1/Q2 group headers) and the server values render after the response —
// proving the request/response pivot contract + column derivation are wired (not just the pure spine).
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('server-side pivot renders dynamic pivot-result columns with server values', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-serverside-ssrm-pivot--server-pivot'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });

  // the fixed row-dimension column is always present.
  await expect(root.locator('thead').getByText('Region', { exact: true })).toHaveCount(1);

  // ★ the dynamic pivot-result column group headers appear only after the pivot response arrives.
  await expect(root.locator('thead').getByText('Q1', { exact: true }), 'Q1 pivot group header').toHaveCount(1);
  await expect(root.locator('thead').getByText('Q2', { exact: true }), 'Q2 pivot group header').toHaveCount(1);

  // ★ server pivot values land in the cells (East row: Q1=100, Q2=200).
  const eastRow = root.locator('tbody tr', { hasText: 'East' });
  await expect(eastRow).toContainText('100');
  await expect(eastRow).toContainText('200');
  // West row values too.
  const westRow = root.locator('tbody tr', { hasText: 'West' });
  await expect(westRow).toContainText('70');
  await expect(westRow).toContainText('90');
});
