import { test, expect, type Page } from '@playwright/test';

// MOD-61 (redo) — ContextMenuGrid submenu/icon/built-in items.
// 우클릭은 결정적 dispatchEvent('contextmenu'); 서브메뉴 열림은 부모 click-토글로 검증
// (React 합성 onMouseEnter 의 dispatch 타이밍 회피 — LESS-009 규율). absent→present 비공허.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('base: grid renders and right-click opens a flat menu (harness regression)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-master-contextmenugrid--base'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });

  await expect(root.getByText('Alice', { exact: true })).toHaveCount(1);
  await expect(root.getByText('Bob', { exact: true })).toHaveCount(1);

  await expect(page.locator('[role="menu"]')).toHaveCount(0);
  await root.locator('tbody td', { hasText: 'Alice' }).first().dispatchEvent('contextmenu');

  const menu = page.locator('[role="menu"]');
  await expect(menu).toHaveCount(1);
  await expect(menu.getByRole('menuitem', { name: '수정' })).toHaveCount(1);
  await expect(menu.getByRole('menuitem', { name: '삭제' })).toHaveCount(1);
});

test('rich: icon + built-in copy item + submenu opens on click revealing children', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-master-contextmenugrid--with-submenu'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });

  // 우클릭 → 메뉴 출현.
  await root.locator('tbody td', { hasText: 'Alice' }).first().dispatchEvent('contextmenu');
  const menu = page.locator('[role="menu"]').first();
  await expect(menu).toBeVisible();

  // ★ 아이콘 렌더 (data-menu-icon, ≥1).
  await expect(menu.locator('[data-menu-icon]').first()).toBeVisible();

  // ★ 내장 복사 항목 (makeCopyCellItem).
  await expect(menu.getByRole('menuitem', { name: /셀 복사/ })).toHaveCount(1);

  // ★ 서브메뉴 부모(aria-haspopup)는 ▶ 어포던스, 초기엔 서브메뉴 닫힘.
  const exportItem = menu.locator('[role="menuitem"][aria-haspopup="menu"]');
  await expect(exportItem).toHaveCount(1);
  await expect(exportItem.locator('[data-submenu-arrow]')).toHaveCount(1);
  await expect(page.locator('[data-submenu]')).toHaveCount(0);

  // ★ 부모 click → 서브메뉴 출현, 자식 항목 보임 (absent→present 비공허).
  await exportItem.locator('button').first().click();
  const submenu = page.locator('[data-submenu]');
  await expect(submenu).toHaveCount(1);
  await expect(submenu.getByRole('menuitem', { name: 'CSV로 내보내기' })).toBeVisible();
  await expect(submenu.getByRole('menuitem', { name: 'Excel로 내보내기' })).toBeVisible();
});
