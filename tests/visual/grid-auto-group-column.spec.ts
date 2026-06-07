import { test, expect, type Page, type Locator } from '@playwright/test';

// MOD-GRID-57 — auto group column. ★behavior-gated, non-vacuous: the single auto-group column
// carries indent-by-depth + the expand toggle; expanding a node reveals deeper-indented children.
//  1) initially collapsed → children (Korea/Japan) absent; root rows have an expand toggle.
//  2) expanding Asia → Korea/Japan appear, indented deeper than the root value.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;
const ID = 'grid-core-grid-auto-group-column--default';
const valueLeft = async (loc: Locator): Promise<number> => {
  const box = await loc.boundingBox();
  if (!box) throw new Error('no box');
  return box.x;
};

test('G-1: auto group column — collapsed→expand reveals indented children via the toggle', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME(ID));
  await page.locator('#storybook-root table').first().waitFor({ state: 'visible' });

  // initially collapsed: roots present, children absent.
  await expect(page.getByText('Asia', { exact: true })).toBeVisible();
  await expect(page.getByText('Korea', { exact: true }), 'children collapsed').toHaveCount(0);
  // root is expandable → has a toggle.
  const asiaRow = page.locator('#storybook-root tbody tr', { has: page.getByText('Asia', { exact: true }) });
  await expect(asiaRow.locator('[data-expand-toggle]'), '★root has expand toggle').toHaveCount(1);

  // ★ expand Asia → its children appear.
  await asiaRow.locator('[data-expand-toggle]').click();
  await expect(page.getByText('Korea', { exact: true }), '★child revealed on expand').toBeVisible();
  await expect(asiaRow.locator('[data-expand-toggle]')).toHaveAttribute('aria-expanded', 'true');

  // ★ child value is indented deeper than the root value (row.depth * indentUnit).
  const asiaValue = asiaRow.locator('[data-auto-group-value]');
  const koreaRow = page.locator('#storybook-root tbody tr', { has: page.getByText('Korea', { exact: true }) });
  const koreaValue = koreaRow.locator('[data-auto-group-value]');
  expect(await valueLeft(koreaValue), '★child indented deeper').toBeGreaterThan(await valueLeft(asiaValue) + 8);

  // ★ leaf (Korea) has no expand toggle.
  await expect(koreaRow.locator('[data-expand-toggle]'), 'leaf has no toggle').toHaveCount(0);
});
