/**
 * @tomis/grid-pro-agg — AggregationGrid React component
 * MOD-GRID-15 / G-001 (initial scaffold)
 * MOD-GRID-15 / G-002 (GroupRow + FooterRow integration, virtualization, callbacks)
 * MOD-GRID-15 / G-003 (3-branch aggregationFn registry lookup)
 * MOD-GRID-15 / G-004 (GroupPanel UI + group-level sorting)
 *
 * Standalone Pro component that wraps TanStack Table v8 with:
 *   - getGroupedRowModel()  (enabled via enableAggregation)
 *   - getExpandedRowModel() (enabled via enableAggregation)
 *   - getSortedRowModel()   (enabled via enableGroupSort — G-004)
 *   - built-in aggregationFns: sum, avg(→mean), min, max, count
 *   - synthetic footer rows via GroupRow/FooterRow components (G-002)
 *   - optional row virtualization via @tanstack/react-virtual (G-002)
 *   - GroupPanel drag-and-drop grouping bar (G-004)
 *
 * NOT an extension of <Grid> — this is a self-contained component (spec Section 2).
 *
 * License: SEE LICENSE IN EULA
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  flexRender,
  type ExpandedState,
  type GroupingState,
  type OnChangeFn,
  type Row,
  type Cell,
  type SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useLicenseStatus, Watermark } from '@tomis/grid-license';

import { resolveAggregationFn, getAggregationFn, BUILT_IN_AGGREGATION_KEYS } from './aggregationFns';
import { GroupPanel } from './GroupPanel';
import { GroupRow } from './internal/GroupRow';
import { FooterRow } from './internal/FooterRow';
import type { AggregationColumnDef, AggregationFnKey, AggregationGridProps } from './types';

// ---------------------------------------------------------------------------
// Interleaved row descriptor (used by both virtualized and non-virtualized paths)
//
// D4: TanStack getExpandedRowModel() emits [groupHeader, leaf1, leaf2, ...].
// Footer rows are NOT emitted automatically — we interleave them manually.
// Pre-computing descriptors lets the virtualizer use the correct total count
// (allRows.length + footer row count) and dispatch on kind in both render paths.
// ---------------------------------------------------------------------------

type RowDescriptor<TData extends object> =
  | { kind: 'group'; row: Row<TData> }
  | { kind: 'leaf'; row: Row<TData> }
  | { kind: 'footer'; row: Row<TData>; cells: Cell<TData, unknown>[] };

/**
 * Build an interleaved descriptor array from TanStack's flat row model.
 *
 * Stack-based parent tracking (spec Section 11.4 fallback):
 * `getParentRow()` does not exist in TanStack v8. Instead, we maintain a
 * `groupStack` indexed by depth to track which group header is currently open.
 *
 * Footer insertion trigger: a leaf row is the last in its group when:
 *   nextRow.depth < currentRow.depth  OR  no nextRow exists.
 * At that point we emit footer descriptors for all closing group depths.
 */
function buildInterleavedRows<TData extends object>(
  allRows: Row<TData>[],
  showFooter: boolean,
): RowDescriptor<TData>[] {
  const descriptors: RowDescriptor<TData>[] = [];
  const groupStack: Array<Row<TData>> = [];

  allRows.forEach((row, idx) => {
    if (row.getIsGrouped()) {
      // Close any open groups at same or deeper depth before opening this group
      // (handles sibling groups at the same depth)
      while (groupStack.length > 0 && groupStack[groupStack.length - 1].depth >= row.depth) {
        groupStack.pop();
      }
      groupStack.push(row);
      descriptors.push({ kind: 'group', row });
    } else {
      // Leaf row
      descriptors.push({ kind: 'leaf', row });

      // Check if this leaf is the last in its current group(s)
      if (showFooter) {
        const nextRow = idx < allRows.length - 1 ? allRows[idx + 1] : undefined;
        const nextDepth = nextRow !== undefined ? nextRow.depth : -1;
        const isGroupEnd = nextDepth < row.depth || nextRow === undefined;

        if (isGroupEnd) {
          // Emit footer descriptors for all groups that just closed (deepest first)
          const closingFrom = nextDepth + 1; // groups at depth >= closingFrom are closing

          const closingGroups: Array<Row<TData>> = [];
          for (let i = groupStack.length - 1; i >= 0; i--) {
            if (groupStack[i].depth >= closingFrom) {
              closingGroups.push(groupStack[i]);
            } else {
              break;
            }
          }

          for (const groupRow of closingGroups) {
            // EC-002: skip footer if group has no subRows
            if (groupRow.subRows.length === 0) continue;
            descriptors.push({
              kind: 'footer',
              row: groupRow,
              cells: groupRow.getVisibleCells(),
            });
          }
        }
      }
    }
  });

  return descriptors;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * `AggregationGrid` — Pro component for row grouping + aggregation.
 *
 * @example
 * ```tsx
 * <AggregationGrid
 *   data={rows}
 *   columns={columns}
 *   enableAggregation
 *   grouping={['region']}
 *   showFooter
 * />
 * ```
 */
export function AggregationGrid<TData extends object>({
  data,
  columns,
  enableAggregation = false,
  grouping = [],
  expanded = {},
  // G-002 new props
  showFooter = true,
  groupRowClassName,
  footerRowClassName,
  renderGroupRow,
  renderFooterRow,
  enableVirtualization = false,
  estimatedRowHeight = 40,
  virtualOverscan = 5,
  onGroupingChange,
  onExpandedChange,
  // G-004 new props
  showGroupPanel = false,
  groupPanelClassName,
  groupChipClassName,
  emptyGroupPanelText,
  enableGroupSort = false,
  sorting,
  onSortingChange,
}: AggregationGridProps<TData>) {
  // ADR-MOD-GRID-REFACTOR-2026-05-17-001 — license watermark wiring
  const _lic = useLicenseStatus();

  // Normalise expanded: TanStack ExpandedState = true | Record<string, boolean>.
  // 'false' is not a valid ExpandedState value — normalise to {}.
  const expandedState: ExpandedState = expanded === false ? {} : expanded;

  // EC-005: groupingState must be useState-backed so chip X click (uncontrolled mode)
  // causes a re-render. Initialised from the `grouping` prop (which may change externally).
  const [groupingState, setGroupingState] = useState<GroupingState>(grouping);

  // G-004: uncontrolled/controlled sorting state (D5, EC-007)
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const sortingState: SortingState = sorting ?? internalSorting;
  const handleSortingChange: OnChangeFn<SortingState> = onSortingChange ?? setInternalSorting;

  // EC-007: warn when sorting is provided without onSortingChange (controlled misuse)
  useEffect(() => {
    if (sorting !== undefined && onSortingChange === undefined) {
      console.error(
        '[grid-pro-agg] sorting prop provided without onSortingChange — ' +
        'use uncontrolled mode instead',
      );
    }
  }, [sorting, onSortingChange]);

  // G-004: internal grouping change handler — updates local state + calls prop callback
  // EC-005: setGroupingState ensures uncontrolled chip X click triggers re-render.
  const handleGroupingChange = (newGrouping: string[]) => {
    setGroupingState(newGrouping);
    onGroupingChange?.(newGrouping);
  };

  // Scroll container ref for virtualization (always created — Hook order guarantee)
  const scrollRef = useRef<HTMLDivElement>(null);

  // Map AggregationColumnDef → ColumnDef, resolving meta.aggregationFn keys.
  // G-003: 3-branch registry lookup (spec Section 11.2 After).
  const resolvedColumns = useMemo(
    () =>
      columns.map((col: AggregationColumnDef<TData>) => {
        const key = col.meta?.aggregationFn;
        if (key === undefined) return col;

        // 1. registry lookup (사용자 정의 우선)
        const customFn = getAggregationFn<TData>(key);
        if (customFn !== undefined) {
          return { ...col, aggregationFn: customFn };
        }

        // 2. 내장 키 확인
        if ((BUILT_IN_AGGREGATION_KEYS as readonly string[]).includes(key)) {
          return {
            ...col,
            aggregationFn: resolveAggregationFn(key as AggregationFnKey),
          };
        }

        // 3. 미등록 → console.error + 'count' fallback (AC-002)
        console.error(
          `[grid-pro-agg] Unknown aggregationFn "${key}". Falling back to "count".`,
        );
        return { ...col, aggregationFn: 'count' as const };
      }),
    [columns],
  );

  const table = useReactTable<TData>({
    data,
    columns: resolvedColumns,
    state: {
      grouping: groupingState,
      expanded: expandedState,
      // G-004: only include sorting in state when enableGroupSort is active (C-29)
      ...(enableGroupSort ? { sorting: sortingState } : {}),
    },
    // G-004: route groupingChange through handleGroupingChange (EC-005 uncontrolled support)
    onGroupingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(groupingState) : updater;
      handleGroupingChange(next);
    },
    // onExpandedChange callback wiring (G-002 OI-01)
    ...(onExpandedChange !== undefined
      ? { onExpandedChange: (updater) => {
          const next = typeof updater === 'function' ? updater(expandedState) : updater;
          onExpandedChange(next);
        }}
      : {}),
    // G-004: sorting change handler (always set when enableGroupSort, C-29)
    ...(enableGroupSort ? { onSortingChange: handleSortingChange } : {}),
    getCoreRowModel: getCoreRowModel(),
    // Spread grouping / expanded row models only when aggregation is enabled (C-29).
    ...(enableAggregation
      ? {
          getGroupedRowModel: getGroupedRowModel(),
          getExpandedRowModel: getExpandedRowModel(),
        }
      : {}),
    // G-004: getSortedRowModel only when enableGroupSort (D5, D8, C-29)
    ...(enableGroupSort ? { getSortedRowModel: getSortedRowModel() } : {}),
  });

  const allRows = table.getRowModel().rows;
  const columnCount = table.getAllColumns().length;

  // ---------------------------------------------------------------------------
  // Pre-compute interleaved descriptor array (D4: synthetic footer interleaving)
  // Used by BOTH render paths so virtualizer count is correct (allRows + footers).
  // ---------------------------------------------------------------------------
  const interleavedRows = useMemo(
    () => buildInterleavedRows(allRows, showFooter),
    [allRows, showFooter],
  );

  // ---------------------------------------------------------------------------
  // Virtualization hook (always called — Hook order guarantee, D6)
  // count uses interleavedRows.length so footer descriptors count toward virtualizer.
  // count=0 when virtualization disabled.
  // ---------------------------------------------------------------------------
  const virtualizer = useVirtualizer({
    count: enableVirtualization ? interleavedRows.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: virtualOverscan,
  });

  // ---------------------------------------------------------------------------
  // Shared descriptor renderer (used by both virtualized and non-virtualized paths)
  // ---------------------------------------------------------------------------
  const renderDescriptor = (descriptor: RowDescriptor<TData>): React.ReactNode => {
    if (descriptor.kind === 'group') {
      return (
        <GroupRow
          key={`g-${descriptor.row.id}`}
          row={descriptor.row}
          columnCount={columnCount}
          {...(groupRowClassName !== undefined ? { className: groupRowClassName } : {})}
          {...(renderGroupRow !== undefined ? { renderGroupRow } : {})}
        />
      );
    }
    if (descriptor.kind === 'footer') {
      return (
        <FooterRow
          key={`footer-${descriptor.row.id}`}
          row={descriptor.row}
          cells={descriptor.cells}
          {...(footerRowClassName !== undefined ? { className: footerRowClassName } : {})}
          {...(renderFooterRow !== undefined ? { renderFooterRow } : {})}
        />
      );
    }
    // kind === 'leaf'
    const row = descriptor.row;
    return (
      <tr key={row.id} className="border-b hover:bg-gray-50">
        {row.getVisibleCells().map((cell) => (
          <td key={cell.id} className="px-3 py-2 text-sm">
            {cell.getIsPlaceholder()
              ? null
              : flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
      </tr>
    );
  };

  // ---------------------------------------------------------------------------
  // Non-virtualized render path
  // ---------------------------------------------------------------------------
  if (!enableVirtualization) {
    return (
      <div className="overflow-x-auto relative">
        {/* G-004: GroupPanel rendered above table (AC-001) */}
        {showGroupPanel && (
          <GroupPanel<TData>
            grouping={groupingState}
            columns={table.getAllColumns()}
            onGroupingChange={handleGroupingChange}
            {...(groupPanelClassName !== undefined ? { className: groupPanelClassName } : {})}
            {...(groupChipClassName !== undefined ? { chipClassName: groupChipClassName } : {})}
            {...(emptyGroupPanelText !== undefined ? { emptyText: emptyGroupPanelText } : {})}
          />
        )}
        <table className="w-full border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-gray-100">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-3 py-2 text-left font-semibold text-gray-700${
                      enableGroupSort && header.column.getCanSort() ? ' cursor-pointer select-none' : ''
                    }`}
                    {...(showGroupPanel
                      ? {
                          draggable: true,
                          onDragStart: (e: React.DragEvent<HTMLTableCellElement>) => {
                            // Spec L128/L362-363: key is 'columnId'
                            e.dataTransfer.setData('columnId', header.column.id);
                          },
                        }
                      : {})}
                    {...(enableGroupSort && header.column.getCanSort()
                      ? { onClick: header.column.getToggleSortingHandler() }
                      : {})}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                    {enableGroupSort && header.column.getCanSort() && (
                      <span aria-hidden="true" className="ml-1 text-gray-400">
                        {header.column.getIsSorted() === 'asc'
                          ? '▲'
                          : header.column.getIsSorted() === 'desc'
                            ? '▼'
                            : ''}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {interleavedRows.map(renderDescriptor)}
          </tbody>
        </table>
        {_lic.watermarkRequired && <Watermark required />}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Virtualized render path (D6: flow-layout spacer rows — C-18)
  // AC-004: group rows, leaf rows, AND footer rows all included in virt window.
  // EC-004: group header/footer rows outside the virtual window are removed from
  // DOM as the user scrolls — accepted trade-off for large dataset performance.
  // ---------------------------------------------------------------------------
  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const startOffset = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const endOffset =
    totalSize -
    (virtualItems.length > 0 ? virtualItems[virtualItems.length - 1].end : 0);

  return (
    <div className="overflow-x-auto relative">
      {/* G-004: GroupPanel rendered above table — outside scrollable div (AC-001, C-18) */}
      {showGroupPanel && (
        <GroupPanel<TData>
          grouping={groupingState}
          columns={table.getAllColumns()}
          onGroupingChange={handleGroupingChange}
          {...(groupPanelClassName !== undefined ? { className: groupPanelClassName } : {})}
          {...(groupChipClassName !== undefined ? { chipClassName: groupChipClassName } : {})}
          {...(emptyGroupPanelText !== undefined ? { emptyText: emptyGroupPanelText } : {})}
        />
      )}
      <div ref={scrollRef} style={{ overflow: 'auto', position: 'relative' }}>
        <table className="w-full border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-gray-100">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-3 py-2 text-left font-semibold text-gray-700${
                      enableGroupSort && header.column.getCanSort() ? ' cursor-pointer select-none' : ''
                    }`}
                    {...(showGroupPanel
                      ? {
                          draggable: true,
                          onDragStart: (e: React.DragEvent<HTMLTableCellElement>) => {
                            // Spec L128/L362-363: key is 'columnId' (EC-004)
                            e.dataTransfer.setData('columnId', header.column.id);
                          },
                        }
                      : {})}
                    {...(enableGroupSort && header.column.getCanSort()
                      ? { onClick: header.column.getToggleSortingHandler() }
                      : {})}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                    {enableGroupSort && header.column.getCanSort() && (
                      <span aria-hidden="true" className="ml-1 text-gray-400">
                        {header.column.getIsSorted() === 'asc'
                          ? '▲'
                          : header.column.getIsSorted() === 'desc'
                            ? '▼'
                            : ''}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {/* Top spacer (flow-layout — position:absolute forbidden, C-18) */}
            {startOffset > 0 && (
              <tr style={{ height: startOffset }}>
                <td colSpan={columnCount} />
              </tr>
            )}
            {virtualItems.map((virtualItem) =>
              renderDescriptor(interleavedRows[virtualItem.index])
            )}
            {/* Bottom spacer (flow-layout — C-18) */}
            {endOffset > 0 && (
              <tr style={{ height: endOffset }}>
                <td colSpan={columnCount} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {_lic.watermarkRequired && <Watermark required />}
    </div>
  );
}
