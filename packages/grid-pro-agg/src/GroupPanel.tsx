/**
 * @tomis/grid-pro-agg — GroupPanel component
 * MOD-GRID-15 / G-004 GroupPanel + group-level sorting
 *
 * Drag-and-drop grouping bar rendered above the grid.
 * HTML5 native drag API (D4 — dnd-kit rejected for bundle size, C-21).
 * C-32: Pure helpers (getColumnLabel, removeFromGrouping, addToGrouping) outside component.
 * D7: verifyOrWarn not called here (AggregationGrid.tsx L48 handles it, 1-call-per-package).
 */

import { useRef, useState } from 'react';
import type { Column } from '@tanstack/react-table';
import type { GroupPanelProps } from './types';

// ---------------------------------------------------------------------------
// Pure helpers (C-32 — pure function separation)
// ---------------------------------------------------------------------------

/** Chip label: columnDef.header if string, else id fallback. */
function getColumnLabel<TData>(col: Column<TData, unknown>): string {
  const h = col.columnDef.header;
  return typeof h === 'string' ? h : col.id;
}

/** Return grouping array with id removed. */
function removeFromGrouping(grouping: string[], id: string): string[] {
  return grouping.filter((g) => g !== id);
}

/** Return grouping array with id appended (no-op if already present — EC-001). */
function addToGrouping(grouping: string[], id: string): string[] {
  if (grouping.includes(id)) return grouping;
  return [...grouping, id];
}

// ---------------------------------------------------------------------------
// GroupPanel component
// ---------------------------------------------------------------------------

/**
 * `GroupPanel` — drag-and-drop grouping bar.
 *
 * Renders above the grid table. Column `<th>` elements in `AggregationGrid`
 * are marked `draggable={true}` when `showGroupPanel=true`, allowing users to
 * drag a column header here to add it to the grouping.
 *
 * Chip X click removes the column from grouping (EC-005 uncontrolled support).
 */
export function GroupPanel<TData extends object>({
  grouping,
  columns,
  onGroupingChange,
  className,
  chipClassName,
  emptyText = 'Drag a column header here to group',
}: GroupPanelProps<TData>): React.ReactElement {
  const [isDragOver, setIsDragOver] = useState(false);
  // Safari fallback: dataTransfer.getData may be empty outside drop handler
  const dragSourceId = useRef<string | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    // Spec L128/L362-363: key is 'columnId' (not 'application/x-grid-column-id')
    const id = e.dataTransfer.getData('columnId') || dragSourceId.current;
    dragSourceId.current = null;
    if (!id) return;
    onGroupingChange(addToGrouping(grouping, id));
  };

  const handleChipRemove = (id: string) => {
    onGroupingChange(removeFromGrouping(grouping, id));
  };

  // Resolve grouping ids → Column objects (preserves order, filters missing ids)
  const groupedCols = grouping
    .map((id) => columns.find((c) => c.id === id))
    .filter((c): c is Column<TData, unknown> => c !== undefined);

  return (
    <div
      className={`flex flex-wrap gap-2 p-2 min-h-[40px] border rounded-md mb-2${
        isDragOver
          ? ' border-dashed border-blue-400 bg-blue-50'
          : ' border-gray-300 bg-gray-50'
      }${className !== undefined ? ` ${className}` : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {groupedCols.length === 0 ? (
        <span className="text-gray-400 text-sm self-center">{emptyText}</span>
      ) : (
        groupedCols.map((col) => (
          <span
            key={col.id}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium${
              chipClassName !== undefined ? ` ${chipClassName}` : ''
            }`}
          >
            {getColumnLabel(col)}
            <button
              type="button"
              aria-label={`Remove ${getColumnLabel(col)} from grouping`}
              className="ml-1 text-blue-600 hover:text-blue-900 focus:outline-none"
              onClick={() => handleChipRemove(col.id)}
            >
              ×
            </button>
          </span>
        ))
      )}
    </div>
  );
}
