import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-58 — SideBar accordion. ★behavior-gated, non-vacuous: only the open panel's content is
// in the DOM; clicking another header swaps which content renders (accordion-exclusive); clicking
// the open header collapses it.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;
const ID = 'grid-pro-panel-panels--side-bar-story';

test('G-1: SideBar accordion — exclusive open, header toggles content', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME(ID));
  await page.locator('[data-sidebar]').first().waitFor({ state: 'visible' });

  // initially the first panel (Columns) is open; Filters content is absent.
  await expect(page.locator('[data-sidebar-content="columns"]'), 'columns open initially').toHaveCount(1);
  await expect(page.locator('[data-sidebar-content="filters"]'), 'filters closed initially').toHaveCount(0);
  await expect(page.locator('[data-sidebar-toggle="columns"]')).toHaveAttribute('aria-expanded', 'true');

  // ★ click Filters header → its content appears, Columns content removed (accordion-exclusive).
  await page.locator('[data-sidebar-toggle="filters"]').click();
  await expect(page.locator('[data-sidebar-content="filters"]'), '★filters opened').toHaveCount(1);
  await expect(page.getByTestId('filters-body')).toBeVisible();
  await expect(page.locator('[data-sidebar-content="columns"]'), '★columns closed on switch').toHaveCount(0);

  // ★ click the open Filters header again → it collapses.
  await page.locator('[data-sidebar-toggle="filters"]').click();
  await expect(page.locator('[data-sidebar-content="filters"]'), '★collapses on re-click').toHaveCount(0);
  await expect(page.locator('[data-sidebar-toggle="filters"]')).toHaveAttribute('aria-expanded', 'false');
});
