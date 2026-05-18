/**
 * `<MasterDetailGrid>` — Pro-tier Master-Detail row expansion.
 *
 * Wraps `GridProps<TData>` surface with `renderDetailRow` + `masterDetail` expansion options.
 * Renders its own standalone `useReactTable` table — does NOT import `<Grid>` from
 * `@topgrid/grid-core` at runtime (Option B — MIT↔Pro EULA boundary preservation, D1).
 *
 * Features:
 * - `renderDetailRow` prop: render function for expanded detail row content.
 * - Controlled mode: `masterDetail.expandedRowKeys` + `onExpandChange` callback.
 * - Uncontrolled mode: internal `useState<ExpandedState>`.
 * - Imperative handle: `expandAll()` / `collapseAll()` via `ref`.
 *
 * @see G-001-spec.md Section 4/8/11
 * @see MOD-GRID-16-decisions.md D1/D3/D7/D8
 */

import {
  forwardRef,
  Fragment,
  useEffect,
  useImperativeHandle,
  useState,
  type ReactElement,
  type Ref,
} from 'react';
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  type ColumnDef,
  type ExpandedState,
  type Row,
} from '@tanstack/react-table';
import type { GridHandle, GridProps } from '@topgrid/grid-core';
import { useLicenseStatus, Watermark } from '@topgrid/grid-license';
import type { MasterDetailGridProps, RenderDetailRow } from './types';
import { ExpandToggleCell } from './internal/ExpandToggleCell';
import { DetailRow } from './DetailRow';
import { useRowKeyboardNav } from './internal/useRowKeyboardNav';

// Node `process` global 의 minimal local declare — `@types/node` 미설치 환경에서
// dev mode 가드 시 사용 (C-4 준수). Grid.tsx:61 동일 패턴.
declare const process: { env: { NODE_ENV?: string } } | undefined;

/** Expand toggle column id (reserved — must not conflict with consumer columns). */
const EXPAND_COLUMN_ID = '__expand__';

/**
 * Builds the expand-toggle prepend column definition.
 * Returns `null` when `renderDetailRow` is not provided (flat mode).
 */
function buildExpandColumn<TData>(
  renderDetailRowProvided: boolean,
): ColumnDef<TData, unknown> | null {
  if (!renderDetailRowProvided) return null;
  return {
    id: EXPAND_COLUMN_ID,
    header: () => null,
    cell: ({ row }: { row: Row<TData> }) => (
      <ExpandToggleCell
        isExpanded={row.getIsExpanded()}
        depth={row.depth}
        onToggle={() => row.toggleExpanded()}
      />
    ),
    size: 40,
    enableSorting: false,
    enableColumnFilter: false,
  };
}

/**
 * Derives TanStack `ExpandedState` from controlled `expandedRowKeys` string array.
 */
function keysToExpandedState(keys: string[]): ExpandedState {
  return keys.reduce<Record<string, boolean>>((acc, key) => {
    acc[key] = true;
    return acc;
  }, {});
}

/**
 * Derives string key array from TanStack `ExpandedState`.
 * `true` (all expanded) returns an empty array (callers should use `expandAll()` instead).
 */
function expandedStateToKeys(state: ExpandedState): string[] {
  if (state === true) return [];
  return Object.keys(state).filter((k) => state[k] === true);
}

// ── MasterRow sub-component (module scope) ────────────────────────────────
// Must be defined at MODULE scope — not inside MasterDetailGridInner — so that
// React's reconciler sees a stable component type across re-renders.
// Defining it inside the render function would cause a fresh function reference
// each render → unmount/remount every row → focus lost on keyboard toggle (D19).

interface MasterRowProps<TData> {
  row: Row<TData>;
  renderDetailRow: RenderDetailRow<TData> | undefined;
  colCount: number;
  onRowClick?: GridProps<TData>['onRowClick'];
  onRowDoubleClick?: GridProps<TData>['onRowDoubleClick'];
  onCellClick?: GridProps<TData>['onCellClick'];
}

/**
 * Single master row with optional expand toggle and keyboard accessibility.
 *
 * Extracted from `MasterDetailGridInner` so React's reconciler sees a stable
 * component type — a new function reference each parent render would unmount/
 * remount all rows and lose keyboard focus (WCAG 2.1 AA breakage).
 *
 * @see G-003-spec.md D19 / Rules-of-Hooks fix (specCodeDefect F-06)
 */
function MasterRow<TData>({
  row,
  renderDetailRow,
  colCount,
  onRowClick,
  onRowDoubleClick,
  onCellClick,
}: MasterRowProps<TData>) {
  // G-003: WCAG 2.1 AA keyboard accessibility — tabIndex=0 + Enter/Space toggle.
  const keyboardProps = useRowKeyboardNav<TData>(row, renderDetailRow !== undefined);

  return (
    <Fragment>
      <tr
        {...keyboardProps}
        className="border-b border-gray-100 hover:bg-gray-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-blue-500"
        onClick={
          onRowClick !== undefined
            ? (e) => onRowClick(row.original, e)
            : undefined
        }
        onDoubleClick={
          onRowDoubleClick !== undefined
            ? (e) => onRowDoubleClick(row.original, e)
            : undefined
        }
      >
        {row.getVisibleCells().map((cell) => (
          <td
            key={cell.id}
            className="px-4 py-2"
            onClick={
              onCellClick !== undefined
                ? (e) => onCellClick(cell, row.original, e)
                : undefined
            }
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
      </tr>
      {row.getIsExpanded() && renderDetailRow !== undefined && (
        <DetailRow<TData>
          row={row}
          colSpan={colCount}
          renderDetailRow={renderDetailRow}
        />
      )}
    </Fragment>
  );
}

/**
 * Inner implementation (unwrapped from forwardRef for generic type support).
 */
function MasterDetailGridInner<TData>(
  props: MasterDetailGridProps<TData>,
  ref: Ref<GridHandle<TData>>,
): ReactElement {
  // ADR-MOD-GRID-REFACTOR-2026-05-17-001 — license watermark wiring
  const _lic = useLicenseStatus();

  const { renderDetailRow, masterDetail } = props;

  // ── Expanded state: controlled vs uncontrolled ──
  const isControlled = masterDetail?.expandedRowKeys !== undefined;

  const [internalExpanded, setInternalExpanded] = useState<ExpandedState>(() =>
    isControlled ? keysToExpandedState(masterDetail!.expandedRowKeys!) : {},
  );

  // In controlled mode, sync external expandedRowKeys → internal ExpandedState.
  useEffect(() => {
    if (isControlled && masterDetail?.expandedRowKeys !== undefined) {
      setInternalExpanded(keysToExpandedState(masterDetail.expandedRowKeys));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterDetail?.expandedRowKeys]);

  const expanded = internalExpanded;

  function handleExpandedChange(updaterOrValue: ExpandedState | ((prev: ExpandedState) => ExpandedState)) {
    setInternalExpanded((prev) => {
      const next =
        typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;
      if (masterDetail?.onExpandChange !== undefined) {
        masterDetail.onExpandChange(expandedStateToKeys(next));
      }
      return next;
    });
  }

  // ── Column definitions: prepend expand toggle if renderDetailRow provided ──
  const expandCol = buildExpandColumn<TData>(renderDetailRow !== undefined);
  const effectiveColumns: ColumnDef<TData, unknown>[] = expandCol
    ? [expandCol, ...props.columns]
    : [...props.columns];

  // ── TanStack table instance ──
  const table = useReactTable<TData>({
    data: props.data,
    columns: effectiveColumns,
    state: {
      expanded,
    },
    onExpandedChange: handleExpandedChange,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    // C-29 spread-skip for exactOptionalPropertyTypes: true
    ...(props.getSubRows !== undefined ? { getSubRows: props.getSubRows } : {}),
    ...(props.debug !== undefined ? { debugTable: props.debug } : {}),
  });

  // ── Imperative handle (D8): GridHandle<TData> + optional expandAll/collapseAll ──
  useImperativeHandle(
    ref,
    () => ({
      addRow: (seed?: Partial<TData>) => {
        if (typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'production') {
          if (props.onAddRow === undefined) {
            console.warn('[tomis/grid-pro-master] addRow called but onAddRow prop is not provided.');
          }
        }
        props.onAddRow?.(seed);
      },
      deleteRow: (rowId: string | number) => {
        if (typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'production') {
          if (props.onDeleteRow === undefined) {
            console.warn('[tomis/grid-pro-master] deleteRow called but onDeleteRow prop is not provided.');
          }
        }
        props.onDeleteRow?.(rowId);
      },
      updateRow: (rowId: string | number, patch: Partial<TData>) => {
        if (typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'production') {
          if (props.onUpdateRow === undefined) {
            console.warn('[tomis/grid-pro-master] updateRow called but onUpdateRow prop is not provided.');
          }
        }
        props.onUpdateRow?.(rowId, patch);
      },
      scrollTo: (_index: number) => {
        // no-op stub — virtualization not wired in MasterDetailGrid (G-004 is grid-core scope)
      },
      getSelection: (): TData[] => {
        return table.getSelectedRowModel().rows.map((r) => r.original);
      },
      clearSelection: () => {
        table.setRowSelection({});
      },
      refresh: () => {
        table.resetRowSelection();
      },
      expandAll: () => {
        table.toggleAllRowsExpanded(true);
      },
      collapseAll: () => {
        table.toggleAllRowsExpanded(false);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table],
  );

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;
  const colCount = effectiveColumns.length;

  return (
    <div className={`${props.className ?? ''} relative`.trim()}>
      <table className="w-full border-collapse text-sm">
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-gray-200 bg-gray-100">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-2 text-left font-semibold text-gray-700"
                  style={header.column.id === EXPAND_COLUMN_ID ? { width: 40 } : undefined}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="px-4 py-8 text-center text-gray-400">
                {props.emptyText ?? '데이터가 없습니다.'}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <MasterRow<TData>
                key={row.id}
                row={row}
                renderDetailRow={renderDetailRow}
                colCount={colCount}
                onRowClick={props.onRowClick}
                onRowDoubleClick={props.onRowDoubleClick}
                onCellClick={props.onCellClick}
              />
            ))
          )}
        </tbody>
      </table>
      {_lic.watermarkRequired && <Watermark required />}
    </div>
  );
}

/**
 * `<MasterDetailGrid>` Pro-tier component with Master-Detail row expansion.
 *
 * @typeParam TData - Row data type.
 *
 * @example Uncontrolled
 * ```tsx
 * const gridRef = useRef<GridHandle<Order>>(null);
 *
 * <MasterDetailGrid<Order>
 *   ref={gridRef}
 *   data={orders}
 *   columns={columns}
 *   renderDetailRow={(row) => <OrderDetail order={row.original} />}
 * />
 *
 * gridRef.current?.expandAll();
 * ```
 *
 * @example Controlled
 * ```tsx
 * const [expanded, setExpanded] = useState<string[]>([]);
 *
 * <MasterDetailGrid<Order>
 *   data={orders}
 *   columns={columns}
 *   renderDetailRow={(row) => <OrderDetail order={row.original} />}
 *   masterDetail={{ expandedRowKeys: expanded, onExpandChange: setExpanded }}
 * />
 * ```
 */
export const MasterDetailGrid = forwardRef(MasterDetailGridInner) as <TData>(
  props: MasterDetailGridProps<TData> & { ref?: Ref<GridHandle<TData>> },
) => ReactElement;
