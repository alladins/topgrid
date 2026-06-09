/**
 * `makeExportItem` — built-in context-menu item that exports the grid's rows to
 * a file via `@topgrid/grid-export`'s row-array exporters.
 *
 * Format-dispatched (MOD-73): `format: 'excel' | 'csv' | 'pdf'` (default `'excel'`)
 * picks the matching row-array exporter, default label, and file behavior. The
 * Excel/CSV serialization is fully deterministic (node-testable); PDF renders via
 * jspdf (browser) but its item wiring is node-testable through the injectable.
 *
 * Consumer-owns-data (same shape as {@link makeCopyCellItem}): the rows/columns
 * the consumer already passed to the grid are closed over here — the item's
 * `onClick` needs nothing from `(row, cell, event)`.
 *
 * The actual exporter is injectable (PAT-005) defaulting to the real exporter for
 * the chosen format, so invocation is node-testable without a browser download.
 *
 * @example
 * ```tsx
 * contextMenuItems={[
 *   makeCopyCellItem(),
 *   makeExportItem({ rows, columns }),                 // Excel (default)
 *   makeExportItem({ rows, columns, format: 'csv' }),  // CSV
 *   makeExportItem({ rows, columns, format: 'pdf' }),  // PDF
 * ]}
 * ```
 */
import {
  exportRowsToExcel,
  exportRowsToCsv,
  exportRowsToPdf,
} from '@topgrid/grid-export';
import type {
  ExcelColumn,
  ExportRowsOptions,
  ExportRowsCsvOptions,
  ExportRowsPdfOptions,
} from '@topgrid/grid-export';
import type { ContextMenuItem } from '../types';

/** Export 형식. */
export type ExportFormat = 'excel' | 'csv' | 'pdf';

/** 형식별 export 옵션(서로소 union — 형식에 맞는 필드만 유효). */
export type ExportItemOptions =
  | ExportRowsOptions
  | ExportRowsCsvOptions
  | ExportRowsPdfOptions;

const DEFAULTS: Record<
  ExportFormat,
  {
    label: string;
    exporter: (
      rows: never[],
      columns: ExcelColumn[],
      options?: ExportItemOptions,
    ) => void | Promise<void>;
  }
> = {
  excel: { label: 'Excel 내보내기', exporter: exportRowsToExcel as never },
  csv: { label: 'CSV 내보내기', exporter: exportRowsToCsv as never },
  pdf: { label: 'PDF 내보내기', exporter: exportRowsToPdf as never },
};

export interface MakeExportItemOptions<TData extends Record<string, unknown>> {
  /** Rows to export (the dataset the consumer passed to the grid). */
  rows: TData[];
  /** Column spec (key/header/width/format). */
  columns: ExcelColumn[];
  /**
   * Export format — picks the matching row-array exporter + default label.
   * @default 'excel'
   */
  format?: ExportFormat;
  /** Passed through to the chosen exporter (fileName/etc; format-specific fields). */
  exportOptions?: ExportItemOptions;
  /** Override the menu label. @default per-format (e.g. 'Excel 내보내기') */
  label?: string;
  /** Override the leading icon. @default '⤓' */
  icon?: ContextMenuItem<TData>['icon'];
  /**
   * Injectable exporter (PAT-005) — defaults to the grid-export exporter for the
   * chosen format. Tests pass a spy to assert invocation without a real download.
   */
  exporter?: (
    rows: TData[],
    columns: ExcelColumn[],
    options?: ExportItemOptions,
  ) => void | Promise<void>;
}

export function makeExportItem<TData extends Record<string, unknown>>(
  opts: MakeExportItemOptions<TData>,
): ContextMenuItem<TData> {
  const { rows, columns, format = 'excel', exportOptions, label, icon, exporter } = opts;
  const def = DEFAULTS[format];
  const resolvedExporter = exporter ?? (def.exporter as MakeExportItemOptions<TData>['exporter'])!;
  return {
    label: label ?? def.label,
    icon: icon ?? '⤓',
    onClick: () => {
      // PDF exporter is async (returns Promise) — fire-and-forget on click.
      void resolvedExporter(rows, columns, exportOptions);
    },
  };
}
