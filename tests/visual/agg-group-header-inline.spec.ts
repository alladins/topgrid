import { test, expect, type Page, type Locator } from '@playwright/test';

// MOD-GRID-54 — group-header inline aggregates. ★behavior-gated, non-vacuous (advisor): the
// correctness-critical claim is that the dept group's inline avg is the TRUE SOURCE mean (computed
// from leaf rows via computeAggregateRow), NOT avg-of-team-avgs. Fixture: 영업팀 has 1팀(10,20) and
// 2팀(60) — true avg(10,20,60)=30; avg-of-team-avgs=avg(15,60)=37.5. Assert 30, never 37.50.
//  1) the dept group HEADER row shows the source-correct inline aggregate (30).
//  2) it stays visible when the group is COLLAPSED (the gap's "incl. when collapsed").
//  3) OFF (showGroupAggregates omitted) → no inline aggregate cells (single colSpan label).
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;
const deptRow = (page: Page): Locator =>
  page
    .locator('#storybook-root tbody tr')
    .filter({ has: page.locator('td[data-group-label]:has-text("영업팀")') });

test('G-1: dept group header shows the source-correct inline avg (not avg-of-avgs)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-agg-aggregationgrid--group-header-aggregates'));
  await page.locator('#storybook-root table').first().waitFor({ state: 'visible' });

  // ★ dept (영업팀) inline avg = true source mean 30, NOT avg-of-team-avgs 37.5.
  await expect(deptRow(page).locator('[data-group-agg="score"]'), '★source avg 30').toHaveText('30');
  await expect(page.locator('#storybook-root tbody'), 'avg-of-avgs value never shown').not.toContainText('37.50');

  // sub-group (team) headers carry their own inline avg (1팀=15, 2팀=60).
  const team1 = page
    .locator('#storybook-root tbody tr')
    .filter({ has: page.locator('td[data-group-label]:has-text("1팀")') });
  await expect(team1.locator('[data-group-agg="score"]')).toHaveText('15');
});

test('G-1: the inline aggregate stays on the header when the group is collapsed', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-agg-aggregationgrid--group-header-aggregates'));
  await page.locator('#storybook-root table').first().waitFor({ state: 'visible' });

  // collapse 영업팀 (click its group label) → team headers + leaves hidden.
  await page.locator('td[data-group-label]:has-text("영업팀")').click();
  await expect(
    page.locator('td[data-group-label]:has-text("1팀")'),
    'sub-group hidden when collapsed',
  ).toHaveCount(0);

  // ★ the dept header (and its inline aggregate) is still present + correct.
  await expect(deptRow(page).locator('[data-group-agg="score"]'), '★agg visible when collapsed').toHaveText('30');
});

test('G-1 (OFF): showGroupAggregates omitted → no inline aggregate cells', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-agg-aggregationgrid--group-header-aggregates-off'));
  await page.locator('#storybook-root table').first().waitFor({ state: 'visible' });

  await expect(page.locator('#storybook-root [data-group-agg]'), 'no inline agg cells when OFF').toHaveCount(0);
  // group header still renders as a single colSpan label cell (existing byte-identical path).
  await expect(page.locator('#storybook-root tbody td[colspan]:has-text("영업팀")')).toHaveCount(1);
});
