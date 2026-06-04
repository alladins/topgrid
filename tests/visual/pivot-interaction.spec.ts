import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-31 G-1 — pivot value sort. ★2-row-dim fixture: the claim is "data sorts WITHIN its group
// while subtotal/grandTotal stay anchored". A naive grid-core sort over the flat array would drag the
// subtotal into the sorted sequence — this asserts it does NOT.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

// East group has 2 data rows: NY(300), Boston(90). subtotal "East Total"(390). West: LA(160),
// subtotal "West Total"(160). grandTotal "Grand Total"(550).
async function rowSummary(page: Page): Promise<{ text: string; kind: string }[]> {
  const root = page.locator('#storybook-root');
  await root.locator('tbody tr').first().waitFor({ state: 'visible' });
  return root.locator('tbody tr').evaluateAll((trs) =>
    trs.map((tr) => {
      const cls = tr.className;
      // data rows carry 'hover:bg-gray-50' (substring-collides with bg-gray-50) → key off font-weight
      // instead: grandTotal=font-semibold, subtotal=font-medium, data=neither.
      const kind = cls.includes('font-semibold') ? 'grandTotal' : cls.includes('font-medium') ? 'subtotal' : 'data';
      return { text: (tr.textContent ?? '').trim(), kind };
    }),
  );
}

test('value header sort: data reorders within group; subtotal/grandTotal stay anchored', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-pivot-interaction--sort'));
  const root = page.locator('#storybook-root');
  await root.locator('tbody tr').first().waitFor({ state: 'visible' });

  // baseline kind sequence: data,data,subtotal,data,subtotal,grandTotal.
  const before = await rowSummary(page);
  const kindSeq = before.map((r) => r.kind).join(',');
  expect(kindSeq).toBe('data,data,subtotal,data,subtotal,grandTotal');

  // click the sortable 'sales' value header → ascending.
  await root.locator('th button[aria-label="sales 정렬"]').click();
  const asc = await rowSummary(page);
  // kind sequence UNCHANGED (only data rows reordered within their segment).
  expect(asc.map((r) => r.kind).join(',')).toBe(kindSeq);
  // East group (rows 0,1): Boston(90) now before NY(300).
  expect(asc[0].text).toContain('Boston');
  expect(asc[1].text).toContain('NY');
  // subtotal still at index 2 and is East's; grandTotal still last.
  expect(asc[2].kind).toBe('subtotal');
  expect(asc[2].text).toContain('East');
  expect(asc[5].kind).toBe('grandTotal');

  // click again → descending → NY before Boston.
  await root.locator('th button[aria-label="sales 정렬"]').click();
  const desc = await rowSummary(page);
  expect(desc.map((r) => r.kind).join(',')).toBe(kindSeq);
  expect(desc[0].text).toContain('NY');
  expect(desc[1].text).toContain('Boston');
});

test('collapse hides a group\'s data, subtotal survives; composes with sort', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-pivot-interaction--sort-collapse'));
  const root = page.locator('#storybook-root');
  await root.locator('tbody tr').first().waitFor({ state: 'visible' });

  // baseline: 6 rows (2 East data, East subtotal, 1 West data, West subtotal, grandTotal).
  expect((await rowSummary(page)).map((r) => r.kind).join(',')).toBe('data,data,subtotal,data,subtotal,grandTotal');

  // collapse East (click its subtotal toggle) → its 2 data rows hidden, subtotal survives.
  await root.locator('th button[aria-label="East Total 토글"], td button[aria-label="East Total 토글"]').first().click();
  let after = await rowSummary(page);
  expect(after.map((r) => r.kind).join(',')).toBe('subtotal,data,subtotal,grandTotal');
  expect(after.some((r) => r.text.includes('NY') || r.text.includes('Boston'))).toBe(false);
  expect(after[0].text).toContain('East'); // East subtotal still present as representative

  // re-expand → restored.
  await root.locator('td button[aria-label="East Total 토글"], th button[aria-label="East Total 토글"]').first().click();
  expect((await rowSummary(page)).map((r) => r.kind).join(',')).toBe('data,data,subtotal,data,subtotal,grandTotal');

  // ★ composition: sort asc (East: Boston 90 < NY 300), THEN collapse East, THEN re-expand → the
  // restored East data is STILL sorted (Boston before NY) — proves collapse(sort(rows)) chain.
  await root.locator('th button[aria-label="sales 정렬"]').click(); // asc
  expect((await rowSummary(page))[0].text).toContain('Boston');
  await root.locator('td button[aria-label="East Total 토글"], th button[aria-label="East Total 토글"]').first().click(); // collapse
  expect((await rowSummary(page)).some((r) => r.text.includes('Boston'))).toBe(false);
  await root.locator('td button[aria-label="East Total 토글"], th button[aria-label="East Total 토글"]').first().click(); // expand
  const restored = await rowSummary(page);
  expect(restored[0].text).toContain('Boston'); // sort survived the collapse/expand cycle
  expect(restored[1].text).toContain('NY');
});

test('runtime config: transpose swaps axes AND ★resets collapse (no stale group hiding)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-pivot-interaction--config-controls'));
  const root = page.locator('#storybook-root');
  await root.locator('tbody tr').first().waitFor({ state: 'visible' });

  // baseline: rows:['region','city'] → 6 rows (2 East data, East sub, LA, West sub, grandTotal).
  expect((await rowSummary(page)).length).toBe(6);

  // collapse East → 4 rows.
  await root.locator('td button[aria-label="East Total 토글"]').first().click();
  expect((await rowSummary(page)).length).toBe(4);

  // transpose → rows:[] columns:['region','city'] → a single grandTotal row (structure changed).
  await root.locator('button[aria-label="행/열 전치"]').click();
  expect((await rowSummary(page)).length).toBe(1);
  // onConfigChange fired with the transposed config (rows now empty) — verifies the exported callback.
  await expect(root.locator('[data-testid="cfg-notify"]')).toHaveText('[]');

  // ★ transpose back → rows:['region','city'] again. computePivot re-runs with the SAME deterministic
  // __ids, so if collapse had NOT been reset the stale East id would re-collapse → 4 rows. It is reset
  // → full 6 rows (East data visible). This is the composition trap (stale id hides wrong group).
  await root.locator('button[aria-label="행/열 전치"]').click();
  expect((await rowSummary(page)).length).toBe(6);
  expect((await rowSummary(page)).some((r) => r.text.includes('NY'))).toBe(true);
});

test('runtime config: pivotMode toggle switches between pivot and passthrough', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-pivot-interaction--config-controls'));
  const root = page.locator('#storybook-root');
  await root.locator('tbody tr').first().waitFor({ state: 'visible' });

  // pivot mode → has a grandTotal synthetic row.
  expect((await rowSummary(page)).some((r) => r.kind === 'grandTotal')).toBe(true);

  // toggle off → passthrough (raw 6 source rows, no synthetic grandTotal).
  await root.locator('button[aria-label="pivot 모드 토글"]').click();
  const off = await rowSummary(page);
  expect(off.some((r) => r.kind === 'grandTotal')).toBe(false);
  expect(off.length).toBe(6); // 6 raw source rows

  // toggle back → pivot again.
  await root.locator('button[aria-label="pivot 모드 토글"]').click();
  expect((await rowSummary(page)).some((r) => r.kind === 'grandTotal')).toBe(true);
});

test('nested-column value header sort: mapColumnNode path reorders within group, anchors subtotal', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-pivot-interaction--sort-nested-columns'));
  const root = page.locator('#storybook-root');
  await root.locator('tbody tr').first().waitFor({ state: 'visible' });

  const before = await rowSummary(page);
  const kindSeq = before.map((r) => r.kind).join(',');
  expect(kindSeq).toBe('data,data,subtotal,data,subtotal,grandTotal');

  // the Q1 column-dim header (nested value column, built by mapColumnNode) is clickable.
  // East/NY Q1=100, East/Boston Q1=30 → asc puts Boston before NY within the East group.
  await root.locator('th button[aria-label="Q1 정렬"]').click();
  const asc = await rowSummary(page);
  expect(asc.map((r) => r.kind).join(',')).toBe(kindSeq); // anchoring preserved
  expect(asc[0].text).toContain('Boston');
  expect(asc[1].text).toContain('NY');
  expect(asc[2].kind).toBe('subtotal');
  expect(asc[5].kind).toBe('grandTotal');
});
