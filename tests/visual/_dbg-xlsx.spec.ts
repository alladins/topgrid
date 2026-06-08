import { test, type Page } from '@playwright/test';
test('dbg', async ({ page }: { page: Page }) => {
  await page.goto('/iframe.html?id=grid-pro-sheet-xlsx-import--import-formula&viewMode=story');
  const root = page.locator('#storybook-root');
  await root.locator('[data-cell="A1"]').waitFor({ state: 'visible' });
  for (const r of ['A1','A2','A3','B1']) {
    console.log(r, 'display=['+(await root.locator(`[data-cell="${r}"]`).innerText())+']');
  }
  console.log('TABLE:\n', await root.locator('table').innerText());
});
