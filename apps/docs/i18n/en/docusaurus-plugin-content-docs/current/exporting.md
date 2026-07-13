# Exporting data (Excel · CSV · PDF)

topgrid exports grid data to **Excel (.xlsx) · CSV · PDF**, plus **clipboard copy and print**. All of it
lives in the **Community (MIT)** package `@topgrid/grid-export` — it's **free**.

There are two ways to use it: ① a drop-in **button component**, or ② the **function API** you wire to any UI.

## At a glance

| What you want | How |
|---|---|
| A download button on the grid | `<GridExportButton>` (see "Fastest path") |
| Wire it to your own button/menu | `exportToExcel(table, …)` and friends |
| Only a row array, no grid | `exportRowsToExcel(rows, columns, …)` |
| Multiple sheets in one file | `exportSheetsToExcel([{name, table}, …])` |
| Spreadsheet engine ↔ .xlsx (formulas) | `exportSheetCellsToXlsx` / `importXlsxToSheetCells` |
| Vue 3 / Nuxt | `<VueGridExportButton>` or `exportRowsToExcel` ([Vue](#vue-3--nuxt)) |

## Install

```bash
npm i @topgrid/grid-export
# Excel uses xlsx, PDF uses jspdf as peers (only when you use that feature)
npm i xlsx            # for Excel/CSV
npm i jspdf jspdf-autotable   # for PDF (optional)
```

## Fastest path — the button component

Pass the grid (a TanStack Table instance) and a download control renders. With two or more formats it
becomes a dropdown menu.

```tsx
import { GridExportButton } from '@topgrid/grid-export/react';

function Toolbar({ table }) {
  return (
    <GridExportButton
      table={table}
      formats={['xlsx', 'csv', 'pdf']}   // one → single button, 2+ → dropdown
      scope="filtered"                    // 'all' | 'filtered' | 'selected'
      fileName="orders"                   // extension added automatically
    />
  );
}
```

- The button auto-disables when there is no data.
- For large exports (`scope='all'` and over 10,000 rows) it confirms before running (main-thread warning).
- Label language: `locale="en"` / `locale="ko"` (default).

> **Toolbar / StatusBar placement**: `<GridExportButton>` is a self-contained component, so drop it into
> the Pro `@topgrid/grid-pro-panel` StatusBar or your own toolbar — no wiring needed beyond the grid instance.

## Wire it yourself — the function API

Attach the functions to any UI event without the button.

```tsx
import { exportToExcel, exportToCSV, exportToPdf } from '@topgrid/grid-export';

<button onClick={() => exportToExcel(table, { fileName: 'data.xlsx' })}>
  Download Excel
</button>
```

Or get a bound callback bundle via the hook:

```tsx
import { useGridExport } from '@topgrid/grid-export/react';

const ex = useGridExport(table, { fileNameBase: 'orders' });
// ex.toExcel() · ex.toCsv() · ex.toPdf() · ex.copy() · ex.print()
// ex.isEmpty('filtered') → decide the disabled state
```

## Scope — what gets exported

| scope | Rows exported |
|---|---|
| `'filtered'` (default) | Rows with the current sort/filter applied |
| `'all'` | All rows, ignoring filters |
| `'selected'` | Only checked rows |

```ts
exportToExcel(table, { scope: 'selected', fileName: 'selection.xlsx' });
```

## Formats · column widths · multi-row headers

Keep Excel cells **numeric/date** by passing native number-format codes.

```ts
exportToExcel(table, {
  columnFormats: { price: '#,##0', orderedAt: 'yyyy-mm-dd', rate: '0.0%' },
  columnWidths: { name: 30 },   // xlsx wch units
});
```

- Group headers (GroupColumnDef) are exported as **multi-row headers with cell merging** automatically.
- Cell fonts/background colors are not offered — the Community `xlsx` build strips them on write (see below).

## Multiple sheets in one file

```ts
import { exportSheetsToExcel } from '@topgrid/grid-export';

exportSheetsToExcel(
  [
    { name: 'Orders', table: orderTable },
    { name: 'Customers', table: customerTable },
  ],
  { fileName: 'monthly-report.xlsx' },
);
```

## Spreadsheet engine ↔ .xlsx (formula round-trip)

With the spreadsheet (`@topgrid/grid-pro-sheet`), you can round-trip to .xlsx **with formulas intact**.

```ts
import { exportSheetCellsToXlsx, importXlsxToSheetCells } from '@topgrid/grid-export';
```

- Formulas (`=SUM(A1:A9)`, etc.) are preserved across the round-trip.
- **Limitation**: cell styles (`.s`) are stripped by the Community `xlsx@0.18.5` on write — values, formulas, and number formats are kept.

## When you only have a row array (no grid)

You can export a plain data array without a TanStack Table.

```ts
import { exportRowsToExcel } from '@topgrid/grid-export';

exportRowsToExcel(
  rows,                                          // array of objects
  [
    { key: 'name', header: 'Name', width: 20 },
    { key: 'price', header: 'Amount', format: 'currency' },
  ],
  { fileName: 'list.xlsx' },
);
```

## Vue 3 / Nuxt

The same works in Vue.

```vue
<script setup lang="ts">
import { VueGridExportButton } from '@topgrid/grid-vue/export';
</script>

<template>
  <VueGridExportButton :table="table" :formats="['xlsx', 'csv']" file-name="orders" />
</template>
```

- Hook: `useVueGridExport(table)` → `toExcel/toCsv/toPdf/copy/print` (`@topgrid/grid-vue/export`).
- With only a row array, use the framework-agnostic `exportRowsToExcel(rows, columns, opts)` directly.
- Nuxt SSR/SSG safe — downloads run on the client only.

## Large data note

Exporting tens of thousands of rows with `scope='all'` runs `xlsx` write synchronously and can briefly
freeze the browser. `<GridExportButton>` confirms above 10,000 rows; for direct calls, wrap in a Web Worker.

## Clipboard · print

```ts
import { copyToClipboard, printGrid } from '@topgrid/grid-export';

copyToClipboard(table, { scope: 'selected' });   // copy as TSV
printGrid(table, { title: 'Monthly report', orientation: 'l' });
```

See the [API reference — grid-export](/api/grid-export) for full function signatures.
