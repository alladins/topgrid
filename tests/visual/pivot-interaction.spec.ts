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
