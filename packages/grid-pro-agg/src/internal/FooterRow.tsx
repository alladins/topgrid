/**
 * @tomis/grid-pro-agg — internal FooterRow component
 * MOD-GRID-15 / G-002
 *
 * Renders a synthetic footer row after each group's leaf rows (D4).
 * TanStack's getExpandedRowModel() does NOT emit footer rows automatically —
 * AggregationGrid.tsx interleaves FooterRow instances manually.
 *
 * Cell aggregation detected via cell.getIsAggregated() (D5: row-level API does not exist).
 *
 * INTERNAL component — not exported from package index (D3).
 * D7: verifyOrWarn NOT called here (already called in AggregationGrid.tsx).
 */

import { flexRender } from '@tanstack/react-table';

import type { FooterRowProps } from '../types';

/**
 * Synthetic footer row component.
 * Renders aggregated values for each column where cell.getIsAggregated() === true.
 */
export function FooterRow<TData extends object>({
  row,
  cells,
  className,
  renderFooterRow,
}: FooterRowProps<TData>) {
  // Custom renderer path
  if (renderFooterRow) {
    return <>{renderFooterRow(row, cells)}</>;
  }

  const defaultClass = 'border-b bg-gray-50';
  const trClass = className !== undefined ? `${defaultClass} ${className}` : defaultClass;

  return (
    <tr className={trClass}>
      {cells.map((cell) => (
        <td key={cell.id} className="px-3 py-2 text-sm">
          {cell.getIsAggregated()
            ? flexRender(
                cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell,
                cell.getContext(),
              )
            : null}
        </td>
      ))}
    </tr>
  );
}
