---
"@tomis/grid-export": minor
---

feat(grid-export): add exportToExcel + downloadExcel alias (MOD-GRID-06/G-001)

- `exportToExcel<TData>(table, options?)` — TanStack Table 기반 Excel(.xlsx) 생성·다운로드
- `ExcelExportOptions` — fileName, sheetName, scope('all'|'filtered'|'selected'), emptyBehavior
- `ExportScope` / `DownloadExcelOptions` 타입 export
- `downloadExcel` legacy alias (`@tomis/grid-export/legacy`) — DataTable buttonInfo.downloadAction 호환
- 다중행 헤더(GroupColumnDef) → ws['!merges'] merge cells 처리 (AC-003)
- 한국어 UTF-8 정상 출력 (AC-004)
- xlsx peerDependency optional: true → false (C-22)
