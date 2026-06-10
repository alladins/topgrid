import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-70 — sticky group headers. ★non-vacuous (advisor): the group header must STAY PUT at the
// top of the bounded scroll container while its children scroll under it. A 200px scroll would push a
// non-sticky header off the top; asserting the header's computed top ≈ container top AFTER the scroll
// (with scrollTop actually > 0) proves `position: sticky` engaged — not just "the header rendered".
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('a group header stays pinned to the top while its children scroll', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-agg-aggregationgrid--sticky-group-rows'));
  const root = page.locator('#storybook-root');
  const table = root.locator('table').first();
  await table.waitFor({ state: 'visible' });

  // the first group header (영업팀) — targeted via data-group-label (not the leaf dept cells).
  const header = root.locator('[data-group-label]').first();
  await expect(header).toContainText('영업팀');

  // before scroll: header sits at the top of the bounded scroll container.
  const containerTopBefore = await table.evaluate((t) => t.parentElement!.getBoundingClientRect().top);
  const headerTopBefore = (await header.boundingBox())!.y;
  expect(Math.abs(headerTopBefore - containerTopBefore), 'header starts at container top').toBeLessThan(60);

  // scroll the bounded container down by 200px (within the 영업팀 group's 12 children).
  const scrolled = await table.evaluate((t) => {
    const c = t.parentElement!;
    c.scrollTop = 200;
    return c.scrollTop;
  });
  expect(scrolled, 'container actually scrolled').toBeGreaterThan(100);

  // ★ after scroll: the header is STILL pinned at the container top (sticky engaged), not pushed up.
  // Retry the position read instead of guessing a settle time.
  await expect(async () => {
    const containerTopAfter = await table.evaluate((t) => t.parentElement!.getBoundingClientRect().top);
    const headerTopAfter = (await header.boundingBox())!.y;
    expect(Math.abs(headerTopAfter - containerTopAfter), 'header stayed pinned after scroll').toBeLessThan(60);
  }).toPass();
});
