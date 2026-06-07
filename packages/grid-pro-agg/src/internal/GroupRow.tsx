/**
 * @topgrid/grid-pro-agg — internal GroupRow component
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

import { computeAggregateRow } from '../computeAggregateRow';
import type { GroupRowProps } from '../types';

/** Format an inline group aggregate: integers as-is, decimals to 2 places, null → blank. */
function formatGroupAgg(value: number | null): string {
  if (value === null) return '';
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

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
  aggSpec,
  leafColumns,
  showSelect,
}: GroupRowProps<TData>) {
  // Custom renderer path
  if (renderGroupRow) {
    return <>{renderGroupRow(row)}</>;
  }

  // MOD-GRID-56: tri-state group selection checkbox. checked = all sub-rows selected; indeterminate
  // = some-but-not-all (TanStack getIsSomeSelected); toggling selects/deselects the subtree.
  const groupCheckbox = showSelect ? (
    <input
      type="checkbox"
      checked={row.getIsAllSubRowsSelected()}
      ref={(el) => {
        if (el) el.indeterminate = !row.getIsAllSubRowsSelected() && row.getIsSomeSelected();
      }}
      aria-checked={
        row.getIsAllSubRowsSelected() ? 'true' : row.getIsSomeSelected() ? 'mixed' : 'false'
      }
      onChange={row.getToggleSelectedHandler()}
      onClick={(e) => e.stopPropagation()}
      className="w-4 h-4 cursor-pointer"
      aria-label="select group"
      data-group-select=""
    />
  ) : null;

  // Tailwind dynamic class: pl-{depth * indentUnit}
  // Note: Tailwind requires complete class strings — computed safely via style fallback
  // for arbitrary depths. For depth 0-3 (common cases) Tailwind classes are used directly.
  const paddingLeft = row.depth * indentUnit * 4; // px (Tailwind unit = 4px)

  const defaultClass = 'border-b bg-blue-50 font-medium cursor-pointer';
  const trClass = className !== undefined ? `${defaultClass} ${className}` : defaultClass;

  const labelCell = (
    <>
      <span className="mr-1 text-xs select-none">
        {row.getIsExpanded() ? '▼' : '▶'}
      </span>
      <span>{String(row.groupingValue ?? '')}</span>
      <span className="ml-2 text-xs text-gray-500">({row.subRows.length})</span>
    </>
  );

  // MOD-GRID-54: inline per-column aggregates on the group header (avg-of-avgs safe — computed from
  // this group's SOURCE leaf rows, not a re-aggregation of subgroup aggregates). Visible when collapsed.
  if (aggSpec && leafColumns) {
    // ★ getLeafRows() includes intermediate group rows in TanStack v8, and a group row's `original`
    // is its first child's — counting those double-weights and corrupts the source aggregate. Filter
    // to ACTUAL leaf data rows (no subRows) so computeAggregateRow sees only source rows (avg-of-avgs safe).
    const leaves = row
      .getLeafRows()
      .filter((r) => r.subRows.length === 0)
      .map((r) => r.original as Record<string, unknown>);
    const aggs = computeAggregateRow(leaves, aggSpec);
    return (
      <tr className={trClass}>
        {leafColumns.map((col) => {
          if (col.id === '__select__') {
            return (
              <td key={col.id} className="py-2 px-3">
                {groupCheckbox}
              </td>
            );
          }
          if (col.id === row.groupingColumnId) {
            return (
              <td
                key={col.id}
                className="py-2 pr-3"
                style={{ paddingLeft: `${paddingLeft}px` }}
                onClick={row.getToggleExpandedHandler()}
                data-group-label=""
              >
                {labelCell}
              </td>
            );
          }
          const hasAgg = Object.prototype.hasOwnProperty.call(aggs, col.field);
          return (
            <td
              key={col.id}
              className="py-2 px-3 text-sm"
              onClick={row.getToggleExpandedHandler()}
              {...(hasAgg ? { 'data-group-agg': col.field } : {})}
            >
              {hasAgg ? formatGroupAgg(aggs[col.field]) : ''}
            </td>
          );
        })}
      </tr>
    );
  }

  return (
    <tr className={trClass}>
      {groupCheckbox !== null && (
        <td className="py-2 px-3">{groupCheckbox}</td>
      )}
      <td
        colSpan={groupCheckbox !== null ? Math.max(1, columnCount - 1) : columnCount}
        className="py-2 pr-3"
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={row.getToggleExpandedHandler()}
      >
        {labelCell}
      </td>
    </tr>
  );
}
