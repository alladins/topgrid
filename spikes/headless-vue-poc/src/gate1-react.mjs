// === GATE 1: 동일 headless 컬럼/row-model 을 React(useReactTable)가 그대로 소비 ===
// Vue 와 동일한 headless 코어(columnData + table-core row models)를 React 어댑터로 구동.
// renderToStaticMarkup 으로 node 에서 실행(LESS-002: 단일 react 인스턴스 합성 가능).
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { data, columnData, SCENARIO } from './headless.mjs';
import assert from 'node:assert/strict';

function Probe({ sorting, columnFilters }) {
  const table = useReactTable({
    data,
    columns: columnData, // ← 동일 headless 컬럼 데이터(render 없음)
    state: { sorting, columnFilters },
    onSortingChange: () => {},
    onColumnFiltersChange: () => {},
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  const regions = table.getRowModel().rows.map((r) => r.getValue('region'));
  return React.createElement('output', null, regions.join(','));
}

function regionsFor(sorting, columnFilters) {
  const html = renderToStaticMarkup(
    React.createElement(Probe, { sorting, columnFilters }),
  );
  return html.replace(/<\/?output>/g, '').split(',').filter(Boolean);
}

const afterSort = regionsFor(SCENARIO.sortSalesDesc, []);
const afterFilter = regionsFor(SCENARIO.sortSalesDesc, [
  { id: 'region', value: SCENARIO.filterRegionContains },
]);

console.log('[react] afterSort  :', afterSort);
console.log('[react] afterFilter:', afterFilter);

assert.deepEqual(
  afterSort,
  SCENARIO.expectedSalesDescRegions,
  'GATE1-A: React 가 동일 headless 코어로 동일 정렬 결과',
);
assert.deepEqual(
  afterFilter,
  SCENARIO.expectedFilteredRegions,
  'GATE1-B: React 동일 필터 결과',
);

console.log('\n✅ GATE 1 PASS — 동일 headless 컬럼/row-model 을 React 가 그대로 소비, 결과 동일');
