/**
 * @tomis/grid-pro-agg — internal GroupRow component
 * MOD-GRID-15 / G-002
 *
 * Renders a single group header row with:
 *   - Tailwind pl-{depth * indentUnit} indentation (AC-001)
 *   - ▶/▼ expand/collapse toggle via row.getToggleExpandedHandler() (C-2)
 *   - group key display + sub-row count
 *
 * INTERNAL component — not exported from package index (D3).
 * D7: verifyOrWarn NOT called here (already called in AggregationGrid.tsx).
 */

import type { GroupRowProps } from '../types';

/**
 * Group header row component.
 * Renders row.getIsGrouped() === true rows as a styled header with expand/collapse.
 */
export function GroupRow<TData extends object>({
  row,
  columnCount,
  indentUnit = 4,
  className,
  renderGroupRow,
}: GroupRowProps<TData>) {
  // Custom renderer path
  if (renderGroupRow) {
    return <>{renderGroupRow(row)}</>;
  }

  // Tailwind dynamic class: pl-{depth * indentUnit}
  // Note: Tailwind requires complete class strings — computed safely via style fallback
  // for arbitrary depths. For depth 0-3 (common cases) Tailwind classes are used directly.
  const paddingLeft = row.depth * indentUnit * 4; // px (Tailwind unit = 4px)

  const defaultClass = 'border-b bg-blue-50 font-medium cursor-pointer';
  const trClass = className !== undefined ? `${defaultClass} ${className}` : defaultClass;

  return (
    <tr className={trClass}>
      <td
        colSpan={columnCount}
        className="py-2 pr-3"
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={row.getToggleExpandedHandler()}
      >
        <span className="mr-1 text-xs select-none">
          {row.getIsExpanded() ? '▼' : '▶'}
        </span>
        <span>{String(row.groupingValue ?? '')}</span>
        <span className="ml-2 text-xs text-gray-500">
          ({row.subRows.length})
        </span>
      </td>
    </tr>
  );
}
