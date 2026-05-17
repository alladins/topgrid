# @tomis/grid-export

## 0.2.0

### Minor Changes

- f5ea968: Add `exportRowsToExcel(rows, columns, options?)` — second entry alongside the existing
  TanStack `Table<T>`-based `exportToExcel`. tw-framework-front's local `excelExport.ts`
  util (67 LOC) is removed; its sole caller migrated to `@tomis/grid-export`. ADR-005
  combo E-1 + F-1 + C-1 + M-2.
- f5ea968: feat(grid-export): add exportToExcel + downloadExcel alias (MOD-GRID-06/G-001)

  - `exportToExcel<TData>(table, options?)` — TanStack Table 기반 Excel(.xlsx) 생성·다운로드
  - `ExcelExportOptions` — fileName, sheetName, scope('all'|'filtered'|'selected'), emptyBehavior
  - `ExportScope` / `DownloadExcelOptions` 타입 export
  - `downloadExcel` legacy alias (`@tomis/grid-export/legacy`) — DataTable buttonInfo.downloadAction 호환
  - 다중행 헤더(GroupColumnDef) → ws['!merges'] merge cells 처리 (AC-003)
  - 한국어 UTF-8 정상 출력 (AC-004)
  - xlsx peerDependency optional: true → false (C-22)

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
