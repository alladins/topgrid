---
'@tomis/grid-export': minor
---

Add `exportRowsToExcel(rows, columns, options?)` — second entry alongside the existing
TanStack `Table<T>`-based `exportToExcel`. tw-framework-front's local `excelExport.ts`
util (67 LOC) is removed; its sole caller migrated to `@tomis/grid-export`. ADR-005
combo E-1 + F-1 + C-1 + M-2.
