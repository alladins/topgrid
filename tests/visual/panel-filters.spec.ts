import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-59 — FiltersToolPanel. ★behavior-gated, non-vacuous: editing a column's filter in the
// unified panel updates its value AND the active-filter count; multiple columns filter at once;
// clear-all resets. (Hosted in a SideBar to prove composition.)
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;
const ID = 'grid-pro-panel-panels--filters-tool-panel-story';
const activeCount = (page: Page) => page.locator('[data-active-count]');

test('G-1: FiltersToolPanel — editing filters updates value + active count; clear-all resets', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME(ID));
  await page.locator('[data-filters-panel]').first().waitFor({ state: 'visible' });

  // initially no active filters.
  await expect(activeCount(page)).toHaveText('0');
  await expect(page.locator('[data-filter-active="region"]')).toHaveCount(0);

  // ★ filter one column → value reflected + active indicator + count 1.
  await page.locator('[data-filter-input="region"]').fill('North');
  await expect(page.locator('[data-filter-input="region"]')).toHaveValue('North');
  await expect(page.locator('[data-filter-active="region"]'), '★active indicator').toHaveCount(1);
  await expect(activeCount(page), '★count 1').toHaveText('1');

  // ★ filter a second column → unified surface filters multiple at once → count 2.
  await page.locator('[data-filter-input="sales"]').fill('100');
  await expect(activeCount(page), '★count 2 (multi-column)').toHaveText('2');

  // ★ clear-all resets every filter.
  await page.locator('[data-clear-all]').click();
  await expect(activeCount(page), '★cleared').toHaveText('0');
  await expect(page.locator('[data-filter-input="region"]')).toHaveValue('');
  await expect(page.locator('[data-filter-input="sales"]')).toHaveValue('');
});
