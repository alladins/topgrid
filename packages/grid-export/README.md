# @tomis/grid-export

Excel, PDF, CSV export for grid data

## Installation

```bash
pnpm add @tomis/grid-export
# or
npm install @tomis/grid-export
# or
yarn add @tomis/grid-export
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
import { exportToExcel } from '@tomis/grid-export';

// Export all visible rows to Excel
exportToExcel(table, {
  fileName: 'my-data.xlsx',
  sheetName: 'Sheet1',
});
```

### Excel Export (Row Array — ADR-005)

Use when you have raw row data without a TanStack `Table` instance.

```tsx
import { exportRowsToExcel, type ExcelColumn } from '@tomis/grid-export';

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

### CSV Export

```tsx
import { exportToCSV } from '@tomis/grid-export';

exportToCSV(table, {
  fileName: 'my-data.csv',
  delimiter: ',',
});
```

### PDF Export

```tsx
import { exportToPdf } from '@tomis/grid-export';

exportToPdf(table, {
  fileName: 'my-data.pdf',
  title: 'My Grid Report',
});
```

### Clipboard & Print

```tsx
import { copyToClipboard, printGrid } from '@tomis/grid-export';

// Copy selected data to clipboard
copyToClipboard(table);

// Print the grid
printGrid(table, { title: 'Report' });
```

## Main API

| Export | Description |
|--------|-------------|
| `exportToExcel` | Export grid data to Excel (.xlsx) — TanStack `Table<TData>` based |
| `exportRowsToExcel` | Export row array to Excel (.xlsx) — raw `TData[]` + `ExcelColumn[]` based (ADR-005) |
| `exportToCSV` | Export grid data to CSV |
| `exportToPdf` | Export grid data to PDF |
| `copyToClipboard` | Copy grid data to clipboard |
| `printGrid` | Print grid content |

## License

MIT

---

[Documentation](https://grid.tomis.dev) | [API Reference](https://grid.tomis.dev/api)
