# @topgrid/grid-export

Excel, PDF, CSV export for grid data

## Installation

```bash
pnpm add @topgrid/grid-export
# or
npm install @topgrid/grid-export
# or
yarn add @topgrid/grid-export
```

## Peer Dependencies

| Package | Version | Required |
|---------|---------|---------|
| `@tanstack/react-table` | `^8.0.0` | Yes |
| `react` | `^18.0.0 \|\| ^19.0.0` | Yes |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` | Yes |
| `xlsx` | `^0.18.5` | Yes |
| `jspdf` | `^2.5.0` | Optional (PDF only) |
| `jspdf-autotable` | `^3.5.0` | Optional (PDF only) |

## Usage

### Excel Export (TanStack Table)

```tsx
import { exportToExcel } from '@topgrid/grid-export';

// Export all visible rows to Excel
exportToExcel(table, {
  fileName: 'my-data.xlsx',
  sheetName: 'Sheet1',
});
```

### Excel Export (Row Array — ADR-005)

Use when you have raw row data without a TanStack `Table` instance.

```tsx
import { exportRowsToExcel, type ExcelColumn } from '@topgrid/grid-export';

const columns: ExcelColumn[] = [
  { key: 'name', header: '이름', width: 20 },
  { key: 'score', header: '점수', width: 10, format: 'number' },
  { key: 'date', header: '날짜', width: 15, format: 'date' },
];

exportRowsToExcel(rows, columns, {
  fileName: '보고서_2026.xlsx',
  sheetName: 'Sheet1',
  // emptyBehavior: 'empty' — emit header-only file when rows is empty (default: 'skip')
});
```

### Excel — Native Number Formats & Column Widths

Apply native Excel number-format codes (`.z`) per column. Cells stay **numeric and
sortable** inside Excel (unlike pre-formatting values to strings). Optionally set
column widths.

```tsx
import { exportToExcel } from '@topgrid/grid-export';

exportToExcel(table, {
  fileName: 'sales.xlsx',
  columnFormats: {
    price: '#,##0.00',     // 1,234.50
    rate: '0.0%',          // 12.3%
    orderedAt: 'yyyy-mm-dd', // applies only if the cell value is a Date / number
  },
  columnWidths: { name: 30, memo: 40 },
});
```

> **Number formats apply to numeric cells only.** A format code is set on a cell
> only when its value is a number (and `Date` values, which Excel stores as numeric
> serials — so `'yyyy-mm-dd'` formats a `Date` but **not** an ISO date *string*).
> String cells pass through unchanged: a format on a text value would be a no-op, so
> it is skipped rather than silently stored. Format string-typed dates upstream, or
> provide `Date`/number values.

> **Cell styling limitation (font / background):** the `xlsx` community edition
> (`^0.18.5`) **does not persist cell styles (`.s` — font, fill/background, borders)
> on write** — they are silently dropped from the output file. `grid-export`
> therefore exposes only what survives a real write→read round-trip: **number
> formats (`.z`) and column widths (`!cols`)**. It does not claim font/background
> support. For styled cells, a styling-capable writer (e.g. a Pro xlsx build) is
> required.

### Excel — Multiple Sheets

Export several tables into one workbook, one sheet each. Each sheet reuses the same
header-merge / scope / number-format behavior as single-sheet `exportToExcel`.

```tsx
import { exportSheetsToExcel, type ExcelSheet } from '@topgrid/grid-export';

const sheets: ExcelSheet[] = [
  { name: '주문', table: ordersTable, columnFormats: { total: '#,##0' } },
  { name: '고객', table: customersTable, scope: 'selected' },
];

exportSheetsToExcel(sheets, { fileName: '월간보고.xlsx' });
```

### CSV Export

```tsx
import { exportToCSV } from '@topgrid/grid-export';

exportToCSV(table, {
  fileName: 'my-data.csv',
  delimiter: ',',
});
```

### PDF Export

```tsx
import { exportToPdf } from '@topgrid/grid-export';

exportToPdf(table, {
  fileName: 'my-data.pdf',
  title: 'My Grid Report',
});
```

### Clipboard & Print

```tsx
import { copyToClipboard, printGrid } from '@topgrid/grid-export';

// Copy selected data to clipboard (header row included by default)
copyToClipboard(table);

// Copy data rows only (no header) — useful when pasting under existing headers
copyToClipboard(table, { includeHeader: false });

// Print the grid
printGrid(table, { title: 'Report' });
```

## Main API

| Export | Description |
|--------|-------------|
| `exportToExcel` | Export grid data to Excel (.xlsx) — TanStack `Table<TData>` based. Supports native number formats (`columnFormats`) + column widths |
| `exportSheetsToExcel` | Export multiple tables into one multi-sheet workbook (.xlsx) |
| `exportRowsToExcel` | Export row array to Excel (.xlsx) — raw `TData[]` + `ExcelColumn[]` based (ADR-005) |
| `exportToCSV` | Export grid data to CSV |
| `exportToPdf` | Export grid data to PDF |
| `copyToClipboard` | Copy grid data to clipboard |
| `printGrid` | Print grid content |

## License

MIT

---

[Documentation](https://topgrid.platree.com) | [API Reference](https://topgrid.platree.com/api)
