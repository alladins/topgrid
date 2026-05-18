/**
 * MultiRowHeader — renders a multi-row `<thead>` section from TanStack
 * `table.getHeaderGroups()`.
 *
 * Extracts the header rendering logic from GroupedHeaderGrid.tsx (L75-117)
 * into a reusable Pro-package component. Uses only TanStack v8 standard APIs
 * (C-2): `getHeaderGroups`, `header.isPlaceholder`, `header.colSpan`,
 * `header.subHeaders`, `flexRender`.
 *
 * G-002 additions: `enableStickyHeader` prop for multi-row sticky (AC-001),
 * `frozenColumns` prop as on/off switch for column pinning left-offset (AC-002),
 * CSS variable `--grid-header-row-height` based top offset (AC-003).
 *
 * G-003 additions: `enableGroupToggle` prop for group header click to toggle
 * child column visibility (AC-001). Group cells get collapse icon ▼/▶ and
 * click handler; leaf cells retain sort handler (AC-002, D2 decision).
 *
 * Flat columns mixed with group columns are handled automatically by TanStack's
 * placeholder mechanism — do NOT add custom rowSpan calculation (spec §11.2).
 *
 * @see AC-001, AC-002, AC-003 in G-002-spec.md
 * @see Section 5.1/5.2 in G-002-spec.md — API design
 * @see Section 11.2/11.4 in G-002-spec.md — implementation guidelines
 * @see Section 6.1, 11.1 in G-003-spec.md — enableGroupToggle implementation
 */

import { type CSSProperties } from 'react';
import { flexRender, type Header, type Table } from '@tanstack/react-table';
import { useLicenseStatus, Watermark } from '@topgrid/grid-license';

/**
 * Props for `MultiRowHeader`.
 *
 * @typeParam TData - The row data type of the table.
 */
export interface MultiRowHeaderProps<TData = unknown> {
  /**
   * The TanStack table instance. Provides `getHeaderGroups()` used for
   * multi-row header rendering.
   */
  table: Table<TData>;
  /**
   * When true, applies sticky positioning to each header row so the multi-row
   * header remains fixed at the viewport top during vertical scroll (AC-001).
   * Default: false (G-001 behaviour preserved — breaking: false).
   */
  enableStickyHeader?: boolean;
  /**
   * Number of columns pinned on the left that should receive `sticky left`
   * positioning. Acts as an on/off switch; the actual frozen column identities
   * are determined from TanStack's `columnPinning.left` state via
   * `column.getIsPinned() === 'left'` (AC-002, D2 decision).
   * 0 or omitted: frozen positioning inactive.
   */
  frozenColumns?: number;
  /**
   * When true, group header cells (non-leaf) become clickable toggles that
   * show/hide all child (leaf) columns at once (G-003, AC-001).
   * Clicking a group header that has all leaves hidden will show them all;
   * clicking one with any visible leaf will hide them all.
   * Leaf columns retain their sort click handler regardless.
   * Default: false (G-001/G-002 behaviour preserved — breaking: false).
   */
  enableGroupToggle?: boolean;
}

/**
 * Returns the left pixel offset for a frozen header cell (AC-002, EC-05).
 *
 * TanStack's `column.getStart('left')` returns the correct offset for leaf
 * columns. For group header cells it may return `undefined`; in that case the
 * first leaf child's offset is used as a fallback (spec §11.4 EC-05).
 *
 * @typeParam TData - Row data type (matches the parent table's TData).
 * @see G-002-spec.md Section 11.4
 */
function getHeaderLeftOffset<TData>(header: Header<TData, unknown>): number {
  const direct = header.column.getStart('left');
  if (direct !== undefined) return direct;
  // EC-05 fallback: group header cell — use first leaf child's offset.
  const firstLeaf = header.subHeaders[0]?.column;
  return firstLeaf?.getStart('left') ?? 0;
}

/**
 * Renders a multi-row `<thead>` element from a TanStack table instance.
 *
 * Iterates `table.getHeaderGroups()` to produce one `<tr>` per header row.
 * Group header cells use `header.colSpan` (computed by TanStack automatically).
 * Placeholder cells (`header.isPlaceholder`) are rendered as empty `<th>` elements.
 * Sorting is enabled only on leaf columns (`!header.subHeaders.length`).
 *
 * @typeParam TData - The row data type of the table.
 * @param props - `MultiRowHeaderProps<TData>`.
 * @returns A `<thead>` JSX element with all header rows.
 */
export function MultiRowHeader<TData>({
  table,
  enableStickyHeader,
  frozenColumns,
  enableGroupToggle,
}: MultiRowHeaderProps<TData>): JSX.Element {
  // ADR-MOD-GRID-REFACTOR-2026-05-17-001 — license watermark wiring (H-D pattern)
  // sub-spec §8 Step 4: extra <tr><th colSpan> watermark row inside <thead>.
  // §9.3 D-3 = (a): sticky top-0 when enableStickyHeader is true.
  const _lic = useLicenseStatus();
  const headerGroups = table.getHeaderGroups();
  const visibleLeafCount = table.getVisibleLeafColumns().length;

  return (
    <thead className="bg-gray-50">
      {_lic.watermarkRequired && visibleLeafCount > 0 ? (
        <tr
          {...(enableStickyHeader === true
            ? { className: 'sticky top-0 z-20' }
            : {})}
        >
          <th
            colSpan={visibleLeafCount}
            className="relative bg-yellow-50 px-4 py-1 text-center text-xs text-gray-500"
          >
            <Watermark required />
          </th>
        </tr>
      ) : null}
      {headerGroups.map((headerGroup, rowIndex) => {
        // AC-001: sticky row props — C-29 conditional spread pattern.
        // Row 0: sticky top-0 z-10 (Tailwind only, no inline style needed).
        // Row N≥1: sticky z-10 + inline style top: calc(var(--grid-header-row-height, 40px) * N).
        const trProps = {
          ...(enableStickyHeader === true && rowIndex === 0 && {
            className: 'sticky top-0 z-10',
          }),
          ...(enableStickyHeader === true && rowIndex > 0 && {
            className: 'sticky z-10',
            style: {
              top: `calc(var(--grid-header-row-height, 40px) * ${rowIndex})`,
            } as CSSProperties,
          }),
        };

        return (
          <tr key={headerGroup.id} {...trProps}>
            {headerGroup.headers.map((header) => {
              // AC-002: frozen column detection via TanStack native API (D2 decision).
              // frozenColumns > 0 acts as the feature on/off switch;
              // actual pinned identity comes from TanStack columnPinning state.
              const isFrozen =
                (frozenColumns ?? 0) > 0 &&
                header.column.getIsPinned() === 'left';

              // D4: z-index layers.
              // frozen + sticky intersection → z-30.
              // frozen only (sticky off) → z-20.
              // Neither → no extra z-class.
              const frozenZClass =
                isFrozen && enableStickyHeader === true
                  ? 'sticky z-30'
                  : isFrozen
                  ? 'sticky z-20'
                  : '';

              // AC-002: left offset in px (inline style — dynamic runtime value, C-5 exception).
              // EC-05 fallback: group cell getStart('left') may be undefined → subHeaders[0] fallback.
              const thStyle: CSSProperties = isFrozen
                ? { left: `${getHeaderLeftOffset(header as Header<unknown, unknown>)}px` }
                : {};

              // Leaf columns: sorting enabled. Group columns: group toggle (if enabled).
              const isLeaf = header.subHeaders.length === 0;

              // G-003 AC-001: pre-compute allLeavesHidden once per non-leaf header.
              // Used for (a) click handler, (b) effectiveColSpan, (c) collapse icon.
              const allLeavesHidden =
                !isLeaf &&
                header.column.getLeafColumns().every((c) => !c.getIsVisible());

              // G-003 AC-001: group click handler — toggle all leaf column visibility.
              // allLeavesHidden → show all (true); any visible leaf → hide all (false).
              const groupClickHandler =
                enableGroupToggle === true && !isLeaf
                  ? () => {
                      const leafCols = header.column.getLeafColumns();
                      leafCols.forEach((c) => c.toggleVisibility(allLeavesHidden));
                    }
                  : undefined;

              // G-003: effectiveColSpan — collapsed group occupies 1 column (spec §6.1).
              const effectiveColSpan =
                enableGroupToggle === true && allLeavesHidden
                  ? 1
                  : header.colSpan;

              // isPlaceholder: filler cell for multi-row headers (TanStack placeholder mechanism).
              // Flat columns in the group row appear as placeholder cells — rendered empty.
              if (header.isPlaceholder) {
                return (
                  <th
                    key={header.id}
                    colSpan={effectiveColSpan}
                    className={`px-4 py-3 border border-gray-200${frozenZClass ? ` ${frozenZClass}` : ''}`}
                    {...(isFrozen ? { style: thStyle } : {})}
                  />
                );
              }

              return (
                <th
                  key={header.id}
                  colSpan={effectiveColSpan}
                  className={`px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border border-gray-200 whitespace-nowrap select-none${
                    header.column.getCanSort() && isLeaf
                      ? ' cursor-pointer hover:bg-gray-100'
                      : ''
                  }${
                    enableGroupToggle === true && !isLeaf
                      ? ' cursor-pointer hover:bg-gray-100'
                      : ''
                  }${frozenZClass ? ` ${frozenZClass}` : ''}`}
                  {...(isFrozen ? { style: thStyle } : {})}
                  onClick={
                    isLeaf ? header.column.getToggleSortingHandler() : groupClickHandler
                  }
                >
                  <div className="flex items-center justify-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && isLeaf && (
                      <span className="text-gray-400">
                        {({ asc: '▲', desc: '▼' } as Record<string, string>)[
                          header.column.getIsSorted() as string
                        ] ?? '⇅'}
                      </span>
                    )}
                    {enableGroupToggle === true && !isLeaf && (
                      <span className="text-gray-400 ml-1">
                        {allLeavesHidden ? '▶' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        );
      })}
    </thead>
  );
}
