---
title: Examples
sidebar_position: 4
---

# Examples — `@topgrid/grid` Usage Patterns

This page collects common Grid patterns as fully working code. You can copy them as-is and run them in your React project. **You can try the interactive demos in <a href="/storybook/" target="_blank" rel="noopener">Storybook</a>** (~30 stories across all packages).

```bash
pnpm add @topgrid/grid-core @tanstack/react-table
# For the change-tracking example, additionally:
pnpm add @topgrid/grid-pro-tracking @topgrid/grid-license
# For the server-side / spreadsheet examples, additionally:
pnpm add @topgrid/grid-pro-serverside @topgrid/grid-pro-sheet @tanstack/react-virtual
```

---

## Example 1: Basic Grid

Client-side pagination + multi-row selection + sorting.

```tsx
import { Grid } from '@topgrid/grid-core';
import { type ColumnDef } from '@tanstack/react-table';

type Employee = {
  id: string;
  name: string;
  department: string;
  salary: number;
};

const data: Employee[] = [
  { id: 'E001', name: '김철수', department: '개발팀', salary: 5500000 },
  { id: 'E002', name: '이영희', department: '인사팀', salary: 4800000 },
  { id: 'E003', name: '박민준', department: '회계팀', salary: 5200000 },
  { id: 'E004', name: '정수연', department: '개발팀', salary: 6000000 },
  { id: 'E005', name: '최동현', department: '영업팀', salary: 4500000 },
];

const columns: ColumnDef<Employee>[] = [
  { accessorKey: 'id',         header: '사원번호', size: 100 },
  { accessorKey: 'name',       header: '성명',     size: 120 },
  { accessorKey: 'department', header: '부서',     size: 120 },
  {
    accessorKey: 'salary',
    header: '급여',
    size: 150,
    cell: ({ getValue }) =>
      new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' })
        .format(getValue() as number),
  },
];

export default function App() {
  return (
    <Grid
      data={data}
      columns={columns}
      enableSort
      enablePagination
      pagination={{ pageSize: 3 }}
      rowSelection="multi"
      emptyText="조회 결과가 없습니다."
    />
  );
}
```

---

## Example 2: Virtualized Grid (Large Datasets)

A single `enableVirtualization` virtualizes the rendering of large row sets (only visible rows are kept in the DOM).

```tsx
import { Grid } from '@topgrid/grid-core';
import { type ColumnDef } from '@tanstack/react-table';

type Row = { id: number; item: string; category: string; value: number };

// Generate 1,000 rows
const data: Row[] = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  item: `항목_${i + 1}`,
  category: `분류_${(i % 10) + 1}`,
  value: (i * 137) % 100000,
}));

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'id',       header: '#',    size: 60  },
  { accessorKey: 'item',     header: '항목', size: 200 },
  { accessorKey: 'category', header: '분류', size: 150 },
  {
    accessorKey: 'value',
    header: '값',
    size: 120,
    cell: ({ getValue }) =>
      new Intl.NumberFormat('ko-KR').format(getValue() as number),
  },
];

export default function App() {
  return (
    <Grid
      data={data}
      columns={columns}
      enableVirtualization
      enableSort
      emptyText="데이터가 없습니다."
    />
  );
}
```

---

## Example 3: Change Tracking (`useChangeTracking`)

Track row-level additions, updates, and deletions, and build a change set (`getChangeSet`) ready to send to the server. This is a Pro package, so a license key must be configured (without it, a watermark is shown).

```tsx
import { Grid } from '@topgrid/grid-core';
import { useChangeTracking } from '@topgrid/grid-pro-tracking';
import { setLicenseKey } from '@topgrid/grid-license';
import { type ColumnDef } from '@tanstack/react-table';

setLicenseKey('YOUR-LICENSE-KEY'); // once at app startup

type Product = { id: string; name: string; price: number; stock: number };

const initialData: Product[] = [
  { id: 'P001', name: '노트북', price: 1200000, stock: 50 },
  { id: 'P002', name: '마우스', price: 35000,   stock: 200 },
  { id: 'P003', name: '키보드', price: 120000,  stock: 150 },
];

const columns: ColumnDef<Product>[] = [
  { accessorKey: 'id',    header: '상품코드', size: 100 },
  { accessorKey: 'name',  header: '상품명',   size: 180 },
  { accessorKey: 'price', header: '단가',     size: 120 },
  { accessorKey: 'stock', header: '재고',     size: 100 },
];

export default function App() {
  // Start tracking with data + rowKey (required)
  const tracking = useChangeTracking<Product>({
    data: initialData,
    rowKey: 'id',
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() =>
            tracking.addRow({ id: `P${Date.now()}`, name: '신규상품', price: 0, stock: 0 })
          }
        >
          행 추가
        </button>
        <button onClick={() => tracking.updateRow('P001', { price: 1100000 })}>
          P001 단가 수정
        </button>
        <button onClick={() => tracking.deleteRow('P002')}>P002 삭제</button>
        <button onClick={() => console.log(tracking.getChangeSet())}>
          변경 집합 출력
        </button>
        <button onClick={() => tracking.resetChanges()}>초기화</button>
      </div>

      <Grid data={tracking.rows} columns={columns} />

      <div style={{ marginTop: 12, fontSize: 14, color: '#555' }}>
        추가 {tracking.added.length}건 · 수정 {tracking.edited.length}건 · 삭제 {tracking.deleted.length}건
      </div>
    </div>
  );
}
```

`useChangeTracking` return value:

| Member | Description |
|---|---|
| `rows` | The current row array with tracking applied (pass to `<Grid data>`) |
| `added` / `edited` / `deleted` | Lists of changed rows |
| `addRow(seed)` | Add a row — returns the assigned key synchronously |
| `updateRow(key, patch)` | Partial update |
| `deleteRow(key)` | Delete |
| `getChangeSet()` | Build a change set ready to send to the server |
| `resetChanges()` | Reset tracking |

---

## Example 4: Column Virtualization (Many Columns)

`enableColumnVirtualization` — columns outside the viewport are not rendered, reducing the render cost of grids with 100+ columns. **Pinned columns are always rendered regardless of horizontal scroll.** Combined with vertical virtualization (`enableVirtualization`), both rows and columns are virtualized at once.

```tsx
import { Grid, createColumns } from '@topgrid/grid-core';

type Row = Record<string, string>;

// 50 columns
const columns = createColumns<Row>(
  Array.from({ length: 50 }, (_, i) => ({
    id: `c${i}`, name: `컬럼 ${i}`, type: 'text', width: '140',
  })),
);

const data: Row[] = Array.from({ length: 200 }, (_, r) => {
  const row: Row = {};
  for (let i = 0; i < 50; i++) row[`c${i}`] = `${r}-${i}`;
  return row;
});

export default function App() {
  return (
    <Grid
      data={data}
      columns={columns}
      enableColumnVirtualization                              // horizontal virtualization (opt-in)
      enableColumnPinning
      defaultColumnPinning={{ left: ['c0'], right: ['c49'] }} // pinned columns are always rendered
      enableVirtualization                                    // vertical too
      virtualScrollHeight={400}
    />
  );
}
```

---

## Example 5: Server-Side Infinite Scroll (SSRM)

`@topgrid/grid-pro-serverside` — lazily loads large server datasets block by block. As you scroll, only the visible blocks are requested (one request per block), and sorting/filtering are passed as server parameters. Pro package (license required).

```tsx
import { Grid } from '@topgrid/grid-core';
import { useServerSideData } from '@topgrid/grid-pro-serverside';
import type { ServerSideDatasource } from '@topgrid/grid-pro-serverside';
import { setLicenseKey } from '@topgrid/grid-license';
import { type ColumnDef } from '@tanstack/react-table';

setLicenseKey('YOUR-LICENSE-KEY');

type Row = { id: number; name: string; amount: number };

// datasource — in practice a real server call. getRows receives the block request.
const datasource: ServerSideDatasource<Row> = {
  async getRows({ startRow, endRow, sortModel, filterModel }) {
    const res = await fetch('/api/rows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startRow, endRow, sortModel, filterModel }),
    });
    const { rows, lastRow } = await res.json();
    // lastRow = the total count once the end is reached; undefined if there is more
    return { rows, lastRow };
  },
};

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'id',     header: '#',    size: 80  },
  { accessorKey: 'name',   header: '이름', size: 200 },
  { accessorKey: 'amount', header: '금액', size: 150 },
];

export default function App() {
  const { gridProps } = useServerSideData<Row>(datasource, {
    blockSize: 100,     // lazy-load blocks of 100 rows
    rowCount: 100_000,  // initial estimated total count (corrected via lastRow)
  });
  // gridProps = data (placeholder array) + enableVirtualization + manualSorting/Filtering
  //            + onSortingChange/onColumnFiltersChange + virtualizerOptions
  return <Grid columns={columns} {...gridProps} virtualScrollHeight={500} />;
}
```

> When sorting/filtering changes, responses from in-flight earlier queries are automatically discarded (epoch invariant — prevents row-order corruption when toggling sort rapidly). For lazy groups, see `useServerSideTree`.

---

## Example 6: Spreadsheet (Formula Cells)

`@topgrid/grid-pro-sheet` — A1 references + arithmetic + `SUM/AVERAGE/MIN/MAX/COUNT` formulas. A cell **stores a formula and displays a value**, and recalculates automatically when a dependent cell changes (circular reference → `#CYCLE!`). Pro package (license required).

```tsx
import { SheetGrid } from '@topgrid/grid-pro-sheet';
import { setLicenseKey } from '@topgrid/grid-license';

setLicenseKey('YOUR-LICENSE-KEY');

export default function App() {
  // Double-click a cell to edit: =A1+A2, =SUM(A1:A3)*2, =1/0 (→ #DIV/0!), etc.
  return <SheetGrid rows={12} cols={6} />;
}
```

You can also use the pure formula engine on its own (without the grid):

```tsx
import { compileCell, evaluate, formatValue } from '@topgrid/grid-pro-sheet';

const cells = { A1: 10, A2: 20, A3: 30 } as const;
const compiled = compileCell('=SUM(A1:A3)*2'); // { kind:'formula', ast, refs:['A1','A2','A3'] }
const value = evaluate(compiled.ast, (ref) => cells[ref] ?? ''); // 120
formatValue(value); // "120"
```

---

## Example 7: Charts — Lightweight (Sparkline · Range)

> topgrid charts are **all Pro (EULA)** — there is no free chart tier. They split into a
> **lightweight (zero-dep SVG)** layer and an **enterprise (17-type ECharts)** layer. The demos
> below are **live, rendered charts**. For data flow and the full catalog see the [Charting guide](/charting).

### Sparkline cells (`SparklineCell`)

Inline mini charts inside a cell (line/bar/area/win-loss). **Zero** chart-library dependency (pure SVG).

<iframe src="/storybook/iframe.html?id=grid-pro-chart-sparkline--min-max-markers&viewMode=story" title="Sparkline cell demo" loading="lazy" style={{ width: '100%', height: '260px', border: '1px solid #e5e7eb', borderRadius: '8px' }}></iframe>

```tsx
import { SparklineCell } from '@topgrid/grid-pro-chart';

// In a column cell renderer — a number array as an in-cell mini chart
{
  accessorKey: 'trend',
  header: 'Trend',
  cell: ({ getValue }) => <SparklineCell type="line" values={getValue() as number[]} />,
}
```

### Lightweight range chart (`RangeChart`)

Zero-dep SVG chart (bar/line/area) — cell-range selection → instant visualization.

<iframe src="/storybook/iframe.html?id=grid-pro-chart-rangechart--bar&viewMode=story" title="Range chart demo" loading="lazy" style={{ width: '100%', height: '320px', border: '1px solid #e5e7eb', borderRadius: '8px' }}></iframe>

```tsx
import { RangeChart } from '@topgrid/grid-pro-chart';

const categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const series = [{ name: 'Shipments', data: [120, 200, 150, 80, 170, 210] }];

export default function App() {
  return <RangeChart type="bar" categories={categories} series={series} />;
}
```

### Chart card — type switcher (`ChartCard`)

Toolbar to switch bar/line/area. Visualize a cell range or pivot result in a single card.

<iframe src="/storybook/iframe.html?id=grid-pro-chart-chartcard--type-switcher&viewMode=story" title="Chart card demo" loading="lazy" style={{ width: '100%', height: '380px', border: '1px solid #e5e7eb', borderRadius: '8px' }}></iframe>

---

## Example 8: Charts — Enterprise (17-type ECharts)

`@topgrid/grid-pro-chart-enterprise` — an Apache [ECharts](https://echarts.apache.org/) adapter (17 types).
Install `echarts` (5.x/6.x) as a **peer**; the whole app shares a single ECharts instance.

<iframe src="/storybook/iframe.html?id=grid-pro-chart-enterprise-enterprisechartpanel--default&viewMode=story" title="Enterprise chart demo" loading="lazy" style={{ width: '100%', height: '420px', border: '1px solid #e5e7eb', borderRadius: '8px' }}></iframe>

Switch among the 17 types via the toolbar — e.g. **radar**, **heatmap**.

<iframe src="/storybook/iframe.html?id=grid-pro-chart-enterprise-enterprisechartpanel--radar&viewMode=story" title="Radar chart" loading="lazy" style={{ width: '100%', height: '380px', border: '1px solid #e5e7eb', borderRadius: '8px' }}></iframe>

<iframe src="/storybook/iframe.html?id=grid-pro-chart-enterprise-enterprisechartpanel--heatmap&viewMode=story" title="Heatmap chart" loading="lazy" style={{ width: '100%', height: '380px', border: '1px solid #e5e7eb', borderRadius: '8px' }}></iframe>

```tsx
import { EnterpriseChartPanel } from '@topgrid/grid-pro-chart-enterprise';
import { setLicenseKey } from '@topgrid/grid-license';

setLicenseKey('YOUR-LICENSE-KEY'); // once at app entry (watermark if unset)

const data = {
  categories: ['Jan', 'Feb', 'Mar', 'Apr'],
  series: [
    { name: 'Seoul', values: [120, 200, 150, 180] },
    { name: 'Busan', values: [90, 130, 110, 160] },
  ],
};

export default function App() {
  return (
    <EnterpriseChartPanel
      data={data}
      initialType="bar"
      toolbarTypes={['bar', 'line', 'radar', 'heatmap', 'pie']} // which of the 17 to surface
      enableExport
      onCrossFilter={(sel) => applyGridFilter(sel.name)}         // chart click → grid filter
    />
  );
}
```

17 types: line·bar·area·stacked-bar·stacked-area·100-stacked-bar·scatter·bubble·pie·doughnut·
funnel·treemap·radar·heatmap·candlestick·boxplot·sankey.

### Vue 3 (same engine)

Nuxt/Vue apps use the **same engine**'s Vue package — zero React dependency, SSR-safe.

```ts
import { EnterpriseChartPanel, setLicenseKey } from '@topgrid/grid-pro-chart-enterprise-vue';

setLicenseKey('YOUR-LICENSE-KEY');
// <EnterpriseChartPanel :data="data" initial-type="bar"
//   :toolbar-types="['bar','radar','heatmap']" @cross-filter="onSelect" />
```

### Bring-your-own (Highcharts / AG Charts)

Inject your own licensed library instead of ECharts — the `renderChart` seam is library-agnostic (zero dep).

<iframe src="/storybook/iframe.html?id=grid-pro-chart-rangechartpanel--byo-renderer&viewMode=story" title="BYO renderer demo" loading="lazy" style={{ width: '100%', height: '320px', border: '1px solid #e5e7eb', borderRadius: '8px' }}></iframe>

```tsx
import { RangeChartPanel } from '@topgrid/grid-pro-chart';

<RangeChartPanel
  series={selectedSeries}
  renderChart={(s) => <MyOwnChart series={s} />} // Highcharts / AG Charts, etc.
/>;
```

---

## Related Documentation

- [Charting guide](/charting) — the 3-layer chart stack (sparkline · lightweight · 17-type enterprise)
- <a href="/storybook/" target="_blank" rel="noopener">Storybook</a> — interactive component demos for all packages
- [Getting Started](/getting-started) — installation and basic usage
- [Architecture](/architecture) — the 27-package layout
- [Migration Guide for the 8 Grid Variants](./8-variant-table.md)
- [DataTable Migration Guide](./dataTable-migration.md)
- [Deprecated Alias List](./deprecated-aliases.md)
