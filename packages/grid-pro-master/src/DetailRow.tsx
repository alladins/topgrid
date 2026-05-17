/**
 * Detail row component for Master-Detail grid.
 *
 * Renders a full-width `<tr>` containing the detail content for an expanded master row.
 *
 * @see G-001-spec.md Section 8.3
 */

import type { Row } from '@tanstack/react-table';
import type { RenderDetailRow } from './types';

interface DetailRowProps<TData> {
  /** The TanStack Row object for the expanded master row. */
  row: Row<TData>;
  /** Number of columns to span (full width). */
  colSpan: number;
  /** Render function providing the detail row content. */
  renderDetailRow: RenderDetailRow<TData>;
}

/**
 * Renders a detail row below the master row when it is expanded.
 *
 * The `data-detail-row` attribute allows consumers to target detail rows
 * with CSS selectors or test queries.
 */
export function DetailRow<TData>({ row, colSpan, renderDetailRow }: DetailRowProps<TData>) {
  return (
    <tr data-detail-row className="bg-gray-50">
      <td colSpan={colSpan} className="px-4 py-2">
        {renderDetailRow(row)}
      </td>
    </tr>
  );
}
