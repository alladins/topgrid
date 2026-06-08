// @topgrid/grid-export — public API (MOD-GRID-06 / G-001 Excel + G-002 CSV + G-003 PDF + G-004 Clipboard/Print)

// Core export functions (TanStack Table-based)
export { exportToExcel } from './exportToExcel';
export { exportToCSV } from './exportToCSV';
export { exportToPdf } from './exportToPdf';

// G-004: Clipboard + Print
export { copyToClipboard } from './copyToClipboard';
export { printGrid } from './printGrid';

// ADR-005: Row-array based Excel export (non-Table entry)
export { exportRowsToExcel } from './exportRowsToExcel';

// MOD-GRID-25 G-2: 다중 시트 Excel export
export { exportSheetsToExcel } from './exportSheetsToExcel';

// MOD-GRID-69: 시트 엔진 ↔ .xlsx 브리지(수식 보존). community xlsx=수식 round-trip, 스타일(.s)=strip(별개).
export {
  sheetRawToXlsxCell,
  xlsxCellToSheetRaw,
  exportSheetCellsToXlsx,
  exportSheetCellsToXlsxBuffer,
  importXlsxToSheetCells,
  type XlsxCell,
} from './sheetXlsx';

// Types
export type {
  ExcelExportOptions,
  ExportScope,
  EmptyBehavior,
  DownloadExcelOptions,
  CSVExportOptions,
  PDFExportOptions,
  // ADR-005: Row-array export types
  ExcelColumn,
  ExportRowsOptions,
  // MOD-GRID-25: 다중 시트 export types
  ExcelSheet,
  MultiSheetOptions,
} from './types';

// G-004 Types
export type { ClipboardOptions, PrintOptions } from './types';

// Legacy alias is available via '@topgrid/grid-export/legacy' sub-entry (AC-005, D5).
// Import: import { downloadExcel } from '@topgrid/grid-export/legacy';
