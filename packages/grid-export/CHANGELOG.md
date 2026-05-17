# @tomis/grid-export

## 0.2.0 — 2026-05-17

### Added
- `exportRowsToExcel(rows, columns, options?)` — row-array based Excel export entry (ADR-005 E-1 + F-1). Non-Table entry alongside existing TanStack `Table<TData>`-based `exportToExcel`.
- `ExcelColumn` type export — `{ key, header, width?, format? }`.
- `ExportRowsOptions` type export — `{ fileName?, sheetName?, emptyBehavior? }`.

### Removed
- `columnsToExcel` helper from `tw-framework-front/src/utils/tomis/excelExport.ts` (ADR-005 C-1 — production callers 0). Note: this helper was in the tw-front local util, not in this package.

### Migration
- `tw-framework-front/src/utils/tomis/excelExport.ts` (67 LOC) deleted. Sole caller `BscEval01ListPage.tsx` migrated to `exportRowsToExcel` from this package.

## 0.0.0

Initial scaffold.
