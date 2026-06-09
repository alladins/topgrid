/**
 * `makeExportItem` — built-in context-menu item that exports the grid's rows to
 * an `.xlsx` file via `@topgrid/grid-export`'s `exportRowsToExcel`.
 *
 * Consumer-owns-data (same shape as {@link makeCopyCellItem}): the rows/columns
 * the consumer already passed to the grid are closed over here — the item's
 * `onClick` needs nothing from `(row, cell, event)`.
 *
 * The actual exporter is injectable (PAT-005) defaulting to the real
 * `exportRowsToExcel`, so invocation is node-testable without a browser download.
 *
 * @example
 * ```tsx
 * contextMenuItems={[
 *   makeCopyCellItem(),
 *   makeExportItem({ rows, columns: [{ key: 'id', header: 'ID' }, ...] }),
 * ]}
 * ```
 */
import { exportRowsToExcel } from '@topgrid/grid-export';
import type { ExcelColumn, ExportRowsOptions } from '@topgrid/grid-export';
import type { ContextMenuItem } from '../types';

export interface MakeExportItemOptions<TData extends Record<string, unknown>> {
  /** Rows to export (the dataset the consumer passed to the grid). */
  rows: TData[];
  /** Excel column spec (key/header/width/format). */
  columns: ExcelColumn[];
  /** Passed through to `exportRowsToExcel` (fileName/sheetName/emptyBehavior). */
  exportOptions?: ExportRowsOptions;
  /** Override the menu label. @default 'Excel 내보내기' */
  label?: string;
  /** Override the leading icon. @default '⤓' */
  icon?: ContextMenuItem<TData>['icon'];
  /**
   * Injectable exporter (PAT-005) — defaults to grid-export `exportRowsToExcel`.
   * Tests pass a spy to assert invocation without a real browser download.
   */
  exporter?: (rows: TData[], columns: ExcelColumn[], options?: ExportRowsOptions) => void;
}

export function makeExportItem<TData extends Record<string, unknown>>(
  opts: MakeExportItemOptions<TData>,
): ContextMenuItem<TData> {
  const { rows, columns, exportOptions, label, icon, exporter = exportRowsToExcel } = opts;
  return {
    label: label ?? 'Excel 내보내기',
    icon: icon ?? '⤓',
    onClick: () => {
      exporter(rows, columns, exportOptions);
    },
  };
}
