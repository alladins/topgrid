import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-22 G-3 — lazy-group SSRM AC③ browser gate (the real gate per LESS-006: node proves the
// tree cache + epoch/node-existence rejection; the browser proves expand→child-fetch wiring).
// Non-vacuous: a SPECIFIC group's children are NOT fetched until it is expanded, then fetched
// EXACTLY once, the child rows appear, and collapse hides them.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;
const ID = 'grid-pro-serverside-ssrm-tree--lazy-groups';

async function groupCalls(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    (
      (globalThis as unknown as { __ssrmTreeCalls?: Array<{ groupKeys: string[] }> })
        .__ssrmTreeCalls ?? []
    ).map((c) => JSON.stringify(c.groupKeys)),
  );
}
const countOf = (arr: string[], v: string) => arr.filter((s) => s === v).length;

test('expanding a group lazy-fetches its children exactly once; collapse hides them', async ({
  page,
}) => {
  await page.goto(FRAME(ID));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });

  // root level loads on mount → top-level country groups appear.
  await expect(root.getByRole('button', { name: /USA/ })).toBeVisible();
  let calls = await groupCalls(page);
  expect(calls, 'root level fetched').toContain('[]');
  // laziness: USA's children are NOT fetched until expanded.
  expect(calls, 'USA children not fetched before expand').not.toContain('["USA"]');
  // a city under USA is not shown yet.
  await expect(root.getByText('NYC', { exact: true })).toHaveCount(0);

  // expand USA → its child block is fetched once and the cities appear.
  await root.getByRole('button', { name: /USA/ }).click();
  await expect(root.getByRole('button', { name: /NYC/ })).toBeVisible();
  calls = await groupCalls(page);
  expect(calls, 'USA children fetched after expand').toContain('["USA"]');
  expect(countOf(calls, '["USA"]'), 'USA children fetched exactly once').toBe(1);
  // a sibling group we did NOT expand stays lazy.
  expect(calls, 'UK children not fetched (not expanded)').not.toContain('["UK"]');

  // collapse USA → cities hidden again.
  await root.getByRole('button', { name: /USA/ }).click();
  await expect(root.getByRole('button', { name: /NYC/ })).toHaveCount(0);

  // re-expand must not double-fetch beyond a single re-request (purge-on-collapse v1: one more).
  await root.getByRole('button', { name: /USA/ }).click();
  await expect(root.getByRole('button', { name: /NYC/ })).toBeVisible();
  calls = await groupCalls(page);
  expect(countOf(calls, '["USA"]'), 'collapse purges → re-expand re-fetches (≤2 total)').toBeLessThanOrEqual(2);
});
