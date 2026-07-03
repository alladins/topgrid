---
title: "@topgrid/grid-export"
sidebar_label: "grid-export"
sidebar_position: 7
---

# @topgrid/grid-export

> Excel, PDF, CSV export for grid data · **Free (MIT)**

:::info Auto-generated
This page is auto-generated from TSDoc comments in the source code (internal markers scrubbed). For a curated getting-started summary, see the [API Reference](../api-reference).
:::

**33** public exports — 17 functions · 0 hooks · 0 components · 16 types · 0 constants.

## Functions

### `buildRowsCsv`

Serializes a row array + `ExcelColumn[]` into an RFC 4180 CSV string (1 header row + N data rows, CRLF-separated).

Pure function — no Blob/DOM dependency, so a node unit test can assert the actual output string.
null/undefined cells serialize to an empty string (EC: matches exportToCSV behaviour).

```ts
buildRowsCsv(rows: TData[], columns: ExcelColumn[], delimiter: string): string
```

| Parameter | Type | Description |
|---|---|---|
| `rows` | `TData[]` | Data rows to serialize |
| `columns` | `ExcelColumn[]` | Column definitions (key = row key, header = header text) |
| `delimiter` | `string` | Delimiter — ',' (default) or '\t' |

### `buildRowsPdfTable`

```ts
buildRowsPdfTable(rows: TData[], columns: ExcelColumn[]): PdfTableData
```

### `copyToClipboard`

Copies TanStack Table data to the clipboard in TSV format.
TSV (tab-separated, newline row separator) — compatible with Excel paste.

Environments without navigator.clipboard: attempts a document.execCommand('copy') fallback.
When the fallback also fails, throws Error('[grid-export] copyToClipboard: Clipboard API not supported').

```ts
copyToClipboard(table: Table<TData>, options: ClipboardOptions): Promise<void>
```

| Parameter | Type | Description |
|---|---|---|
| `table` | `Table<TData>` | TanStack v8 Table&lt;TData> instance (useReactTable return value) |
| `options` | `ClipboardOptions` | Clipboard copy options (scope, emptyBehavior) |

**Returns** — Promise&lt;void> — navigator.clipboard.writeText is async

**Example**

```ts
await copyToClipboard(table);
```

### `escapeCsvValue`

RFC 4180 §2: when the delimiter/double-quote/newline is present, wraps in double quotes + doubles inner quotes.
Pure string manipulation — 0 external libraries.

```ts
escapeCsvValue(value: string, delimiter: string): string
```

### `exportRowsToCsv`

```ts
exportRowsToCsv(rows: TData[], columns: ExcelColumn[], options: ExportRowsCsvOptions): void
```

### `exportRowsToExcel`

Downloads a row array as an Excel file (.xlsx).

Usable without a TanStack `Table<TData>` instance.
Parallel support with `exportToExcel(table, options)` of `@topgrid/grid-export` (option A).

```ts
exportRowsToExcel(rows: TData[], columns: ExcelColumn[], options: ExportRowsOptions): void
```

| Parameter | Type | Description |
|---|---|---|
| `rows` | `TData[]` | Array of data rows to export |
| `columns` | `ExcelColumn[]` | Array of column definitions (key / header / width? / format?) |
| `options` | `ExportRowsOptions` | fileName / sheetName / emptyBehavior options |

**Example**

```ts
exportRowsToExcel(rows, columns, { fileName: '보고서_2026.xlsx' });
```

### `exportRowsToPdf`

```ts
exportRowsToPdf(rows: TData[], columns: ExcelColumn[], options: ExportRowsPdfOptions): Promise<void>
```

### `exportSheetCellsToXlsx`

Build an `.xlsx` workbook from a sheet cell map and (in a browser/node) trigger a download / write.
Formula cells are written as `.f` (preserved by the lib). Returns nothing — side-effecting write.

```ts
exportSheetCellsToXlsx(cells: Record<string, string>, computed: Record<string, string | number>, fileName: string, sheetName: string): void
```

### `exportSheetCellsToXlsxBuffer`

Build an `.xlsx` workbook as a Uint8Array buffer (node-testable; no file I/O).

```ts
exportSheetCellsToXlsxBuffer(cells: Record<string, string>, computed: Record<string, string | number>, sheetName: string): Uint8Array
```

### `exportSheetsToExcel`

Exports/downloads multiple TanStack Tables as **a single Excel workbook** (multiple sheets).
( — closes the multi-sheet export gap with XX Grid/DevExpress)

Each sheet reuses the same builder (`buildGridWorksheet`) as `exportToExcel` (single sheet), so
header merge · scope · native number format (`.z`) · column width behaviour is consistent with the single-sheet case.

```ts
exportSheetsToExcel(sheets: ExcelSheet[], options: MultiSheetOptions): void
```

| Parameter | Type | Description |
|---|---|---|
| `sheets` | `ExcelSheet[]` | Array of sheet definitions (`{ name, table, scope?, columnFormats?, columnWidths? }`) |
| `options` | `MultiSheetOptions` | fileName option |

**Returns** — void (synchronous — xlsx.writeFile)

**Example**

```ts
exportSheetsToExcel(
  [
    { name: '주문', table: ordersTable, columnFormats: { total: '#,##0' } },
    { name: '고객', table: customersTable, scope: 'selected' },
  ],
  { fileName: '월간보고.xlsx' },
);
```

### `exportToCSV`

Generates and downloads a CSV file based on a TanStack Table instance.
Includes a UTF-8 BOM — displays correctly in Korean Excel.

```ts
exportToCSV(table: Table<TData>, options: CSVExportOptions): void
```

| Parameter | Type | Description |
|---|---|---|
| `table` | `Table<TData>` | TanStack v8 Table&lt;TData> instance (useReactTable return value) |
| `options` | `CSVExportOptions` | CSV export options (fileName, scope, delimiter, emptyBehavior) |

**Returns** — void (pure string manipulation + createObjectURL — 0 external libraries)

**Example**

```ts
// Basic usage (filtered rows, comma delimiter)
exportToCSV(table, { fileName: '데이터.csv' });
```

### `exportToExcel`

Generates and downloads an Excel (.xlsx) file based on a TanStack Table instance.

```ts
exportToExcel(table: Table<TData>, options: ExcelExportOptions): void
```

| Parameter | Type | Description |
|---|---|---|
| `table` | `Table<TData>` | TanStack v8 Table&lt;TData> instance (useReactTable return value) |
| `options` | `ExcelExportOptions` | Excel export options (fileName, sheetName, scope, emptyBehavior, columnFormats, columnWidths) |

**Returns** — void (synchronous execution — xlsx.writeFile synchronous API)

**Example**

```ts
// Basic usage (filtered rows)
exportToExcel(table, { fileName: '데이터.xlsx' });
```

### `exportToPdf`

Generates and downloads a PDF file based on a TanStack Table instance.
Uses jspdf + jspdf-autotable via dynamic import as an optional peer.

```ts
exportToPdf(table: Table<TData>, options: PDFExportOptions): Promise<void>
```

| Parameter | Type | Description |
|---|---|---|
| `table` | `Table<TData>` | TanStack v8 Table&lt;TData> instance (useReactTable return value) |
| `options` | `PDFExportOptions` | PDF export options (fileName, title, scope, orientation, fontFamily, emptyBehavior) |

**Returns** — Promise&lt;void> — resolves after the jspdf dynamic import completes

**Example**

```ts
// Basic usage (portrait, filtered, Helvetica)
await exportToPdf(table, { fileName: '보고서.pdf' });
```

### `importXlsxToSheetCells`

Parse an `.xlsx` (the first worksheet) into a sheet cell map. Formula cells become `"=…"` raws so
the sheet engine re-evaluates them; value cells stringify. Feeds `createSheet` via `setCell`.

```ts
importXlsxToSheetCells(data: ArrayBuffer | Uint8Array<ArrayBufferLike>): Record<string, string>
```

### `printGrid`

Renders TanStack Table data as an HTML table in a new popup window and opens the print dialog.
Pure Web API only (window.open + document.write + window.print).

Popup-blocked environments: console.warn then return immediately ( — does not throw).
printGrid itself returns synchronously (void). The actual print is fired asynchronously inside popup.onload.

```ts
printGrid(table: Table<TData>, options: PrintOptions): void
```

| Parameter | Type | Description |
|---|---|---|
| `table` | `Table<TData>` | TanStack v8 Table&lt;TData> instance (useReactTable return value) |
| `options` | `PrintOptions` | Print options (title, scope, orientation, emptyBehavior) |

**Returns** — void

**Example**

```ts
printGrid(table);
```

### `sheetRawToXlsxCell`

Pure: a sheet raw input (`"=A1+A2"` | `"10"` | `"hi"`) → an xlsx cell object.

A formula cell **must carry a cached value** (`v`) or the lib drops it on write (probe-verified),
so `computed` (the engine's displayed value, from `getDisplay`) is written as the cache. Without
it, a fallback `v: 0` keeps the formula (Excel recalculates on open). Value cells ignore `computed`.

```ts
sheetRawToXlsxCell(raw: string, computed: string | number): XlsxCell
```

### `xlsxCellToSheetRaw`

Pure: an xlsx cell → a sheet raw input. Formula cells become `"=…"`; value cells stringify.

```ts
xlsxCellToSheetRaw(cell: XlsxCell): string
```

## Types & Interfaces

### `ClipboardOptions`

Clipboard copy options

| Property | Type | Description |
|---|---|---|
| `emptyBehavior?` | `EmptyBehavior` | Behaviour when there are 0 data rows - 'skip': do not copy (default) - 'empty': copy a header-only TSV to the clipboard |
| `includeHeader?` | `boolean` | Whether to include the header row - `true`: include the header row on the first line (default — existing behaviour) - `false`: copy data rows only (avoids duplicate headers when pasting into another region) |
| `scope?` | `ExportScope` | Row range to export - 'all': getCoreRowModel (ignores filters, all rows) - 'filtered': getFilteredRowModel (reflects current sort/filter) ← default - 'selected': table.getSelectedRowModel (selected rows only) |

### `CSVExportOptions`

CSV export options

| Property | Type | Description |
|---|---|---|
| `delimiter?` | `"," \| "\t"` | CSV delimiter — ',' (default, RFC 4180) or '\t' (TSV option) |
| `emptyBehavior?` | `EmptyBehavior` | Behaviour when there are 0 data rows - 'skip': do not create a file (default) - 'empty': create an empty header-only file |
| `fileName?` | `string` | Download file name (extension recommended; if absent, .csv is appended automatically) |
| `scope?` | `ExportScope` | Row range to export - 'all': getCoreRowModel (ignores filters, all rows) - 'filtered': getFilteredRowModel (reflects current sort/filter) ← default - 'selected': table.getSelectedRowModel (selected rows only) |

### `DownloadExcelOptions`

DataTable buttonInfo-compatible alias options (legacy)

| Property | Type | Description |
|---|---|---|
| `columnFormats?` | `Record<string, string>` | Per-column native Excel number-format codes key = column id, value = Excel format code (e.g. `'#,##0.00'`, `'yyyy-mm-dd'`, `'0.0%'`). Applied as `.z` to that column's data cells so cells stay numeric and sortable inside Excel. |
| `columnWidths?` | `Record<string, number>` | Per-column width — key = column id, value = width in xlsx `wch` units. Only specified columns are reflected in `!cols` (unspecified ones use the default width). |
| `emptyBehavior?` | `EmptyBehavior` | Behaviour when there are 0 data rows - 'skip': do not create a file (default) - 'empty': create an empty header-only file |
| `fileName?` | `string` | Download file name (extension recommended; if absent, .xlsx is appended automatically) |
| `scope?` | `ExportScope` |  |
| `sheetName?` | `string` | Excel sheet name |

### `ExcelColumn`

Column definition for row-array-based Excel export

| Property | Type | Description |
|---|---|---|
| `format?` | `"number" \| "date" \| "datetime" \| "currency"` | Cell value format |
| `header` | `string` | Text to display in the header cell |
| `key` | `string` | Key on the row object |
| `width?` | `number` | Column width (wch units). Default 15 |

### `ExcelExportOptions`

Excel export options

Shares the same type as (emptyBehavior) — types.ts single source-of-truth

| Property | Type | Description |
|---|---|---|
| `columnFormats?` | `Record<string, string>` | Per-column native Excel number-format codes key = column id, value = Excel format code (e.g. `'#,##0.00'`, `'yyyy-mm-dd'`, `'0.0%'`). Applied as `.z` to that column's data cells so cells stay numeric and sortable inside Excel. |
| `columnWidths?` | `Record<string, number>` | Per-column width — key = column id, value = width in xlsx `wch` units. Only specified columns are reflected in `!cols` (unspecified ones use the default width). |
| `emptyBehavior?` | `EmptyBehavior` | Behaviour when there are 0 data rows - 'skip': do not create a file (default) - 'empty': create an empty header-only file |
| `fileName?` | `string` | Download file name (extension recommended; if absent, .xlsx is appended automatically) |
| `scope?` | `ExportScope` | Row range to export - 'all': getCoreRowModel (ignores filters, all rows) - 'filtered': getFilteredRowModel (reflects current sort/filter) ← default - 'selected': table.getSelectedRowModel (selected rows only) |
| `sheetName?` | `string` | Excel sheet name |

### `ExcelSheet`

Definition of one sheet in a multi-sheet Excel export

| Property | Type | Description |
|---|---|---|
| `columnFormats?` | `Record<string, string>` | Per-column native number-format (same as ExcelExportOptions.columnFormats) |
| `columnWidths?` | `Record<string, number>` | Per-column width (same as ExcelExportOptions.columnWidths) |
| `name` | `string` | Sheet name (shown on the Excel tab) |
| `scope?` | `ExportScope` | Row range to export |
| `table` | `Table<any>` | TanStack v8 Table instance — source of the sheet contents. Multi-sheet inherently **mixes tables of different row types in one array** (`Table<Person>` + `Table<Order>`), so they cannot be unified under a single `TData`. `Table<TData>` is not assignable to `Table<unknown>` because of the contravariance of the function argument in `accessorFn` (`Table<Person>` ↛ `Table<unknown>`). To accept a heterogeneous array, `Table<any>` is the only practical solution (TS has no existential types). The export code only ever handles `getValue` results as `unknown`, preserving type safety. |

### `ExportRowsCsvOptions`

`exportRowsToCsv` options (CSV parallel of row-array export)

`scope` is meaningless for row-array input, so it is excluded.

| Property | Type | Description |
|---|---|---|
| `delimiter?` | `"," \| "\t"` | CSV delimiter — ',' (default, RFC 4180) or '\t' (TSV) |
| `emptyBehavior?` | `EmptyBehavior` | Behaviour when there are 0 data rows |
| `fileName?` | `string` | Download file name (if no extension, .csv is appended automatically) |

### `ExportRowsOptions`

`exportRowsToExcel` options

`scope` is meaningless for row-array input, so it is intentionally excluded.

| Property | Type | Description |
|---|---|---|
| `emptyBehavior?` | `EmptyBehavior` | Behaviour when there are 0 data rows - 'skip': do not create a file (default) - 'empty': create an empty header-only file |
| `fileName?` | `string` | Download file name (extension recommended; if absent, .xlsx is appended automatically) |
| `sheetName?` | `string` | Excel sheet name |

### `ExportRowsPdfOptions`

`exportRowsToPdf` options (PDF parallel of row-array export)

`scope` is meaningless for row-array input, so it is excluded.

| Property | Type | Description |
|---|---|---|
| `emptyBehavior?` | `EmptyBehavior` | Behaviour when there are 0 data rows |
| `fileName?` | `string` | Download file name (if no extension, .pdf is appended automatically) |
| `orientation?` | `"p" \| "l"` | Page orientation — 'p' portrait (default) / 'l' landscape |
| `title?` | `string` | Title row at the top of the PDF (omitted if absent) |

### `MultiSheetOptions`

`exportSheetsToExcel` options

| Property | Type | Description |
|---|---|---|
| `fileName?` | `string` | Download file name (if no extension, .xlsx is appended automatically) |

### `PDFExportOptions`

PDF export options

| Property | Type | Description |
|---|---|---|
| `emptyBehavior?` | `EmptyBehavior` | Behaviour when there are 0 data rows - 'skip': do not create a file (default) - 'empty': create an empty header-only file |
| `fileName?` | `string` | Download file name (extension recommended; if absent, .pdf is appended automatically) |
| `fontFamily?` | `"default" \| "korean"` | Font family - 'default': jspdf built-in Helvetica (Latin character support) - 'korean': NotoSansKR dynamic import (loadKoreanFont.ts — see W1) |
| `orientation?` | `"p" \| "l"` | PDF page orientation - 'p': portrait (default) - 'l': landscape |
| `scope?` | `ExportScope` | Row range to export - 'all': getCoreRowModel (ignores filters, all rows) - 'filtered': getFilteredRowModel (reflects current sort/filter) ← default - 'selected': table.getSelectedRowModel (selected rows only) |
| `title?` | `string` | Document title row to display at the top of the PDF (omitted if absent) |

### `PdfTableData`

| Property | Type | Description |
|---|---|---|
| `body` | `string[][]` | autotable body: data rows × column strings |
| `head` | `string[][]` | autotable head: single header row (row-array export does not support multi-row headers) |

### `PrintOptions`

Print options

| Property | Type | Description |
|---|---|---|
| `emptyBehavior?` | `EmptyBehavior` | Behaviour when there are 0 data rows - 'skip': do not open the print window (default) - 'empty': print a header-only table |
| `orientation?` | `"p" \| "l"` | Page orientation (CSS |
| `scope?` | `ExportScope` | Row range to export - 'all': getCoreRowModel (ignores filters, all rows) - 'filtered': getFilteredRowModel (reflects current sort/filter) ← default - 'selected': table.getSelectedRowModel (selected rows only) |
| `title?` | `string` | Title to display at the top of the print page (omitted if absent) |

### `XlsxCell`

A worksheet cell as understood by the xlsx lib (the subset this bridge reads/writes).

| Property | Type | Description |
|---|---|---|
| `f?` | `string` | Formula text WITHOUT the leading `=` (xlsx convention). |
| `t` | `"n" \| "s" \| "b"` | Cell type: `'n'` number, `'s'` string, `'b'` boolean. |
| `v?` | `string \| number \| boolean` | Literal value (absent/ignored when `f` is the source of truth for display). |

### `EmptyBehavior`

​Behaviour on 0 data rows at export time — single source-of-truth shared by 5 Options

```ts
type EmptyBehavior = "skip" | "empty"
```

### `ExportScope`

Excel export range specification

```ts
type ExportScope = "all" | "filtered" | "selected"
```
