/**
 * `<ContextMenuGrid>` — Pro-tier right-click context menu grid.
 *
 * Wraps `GridProps<TData>` surface with `contextMenuItems` prop.
 * Renders its own standalone `useReactTable` table — does NOT import `<Grid>`
 * from `@topgrid/grid-core` at runtime (Option B — MIT↔Pro EULA boundary, D1).
 *
 * Features:
 * - `contextMenuItems` prop: declarative right-click context menu items.
 * - `createPortal` menu rendering into `document.body` (D4).
 * - Keyboard shortcut support via wrapper div `onKeyDown` (D5).
 * - `disabled` evaluation at render time (D7).
 *
 * @see G-002-spec.md Section 4/5/8
 * @see MOD-GRID-16-decisions.md D9–D16
 */

import {
  forwardRef,
  useImperativeHandle,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type Ref,
} from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type Cell,
} from '@tanstack/react-table';
import type { GridHandle } from '@topgrid/grid-core';
import type { ContextMenuGridProps } from './types';
import { useContextMenu } from './internal/useContextMenu';
import { ContextMenuPortal } from './internal/ContextMenuPortal';

// Node `process` global 의 minimal local declare — `@types/node` 미설치 환경에서
// dev mode 가드 시 사용 (C-4 준수). Grid.tsx:61 동일 패턴.
declare const process: { env: { NODE_ENV?: string } } | undefined;

/**
 * Parses a shortcut string into its modifier + key parts.
 *
 * Grammar: `"[Modifier+]Key"` where Modifier ∈ {Ctrl, Alt, Shift}.
 * Returns `null` if the string is empty; logs a warning for invalid grammar.
 *
 * @example
 * ```ts
 * parseShortcut("Ctrl+C")  // { ctrl: true, alt: false, shift: false, key: "c" }
 * parseShortcut("Delete")  // { ctrl: false, alt: false, shift: false, key: "delete" }
 * parseShortcut("Ctrl+")   // null (invalid grammar — warns)
 * ```
 */
function parseShortcut(shortcut: string): {
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  key: string;
} | null {
  if (shortcut.trim() === '') return null;

  const parts = shortcut.split('+');
  const keyPart = parts[parts.length - 1];

  // Grammar validation: key part must be non-empty
  if (keyPart === undefined || keyPart.trim() === '') {
    if (typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'production') {
      console.warn(`[topgrid/grid-pro-master] Invalid shortcut grammar: "${shortcut}". Key part is empty.`);
    }
    return null;
  }

  const modifiers = parts.slice(0, -1).map((m) => m.toLowerCase());
  const validModifiers = new Set(['ctrl', 'alt', 'shift']);

  for (const mod of modifiers) {
    if (!validModifiers.has(mod)) {
      if (typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'production') {
        console.warn(`[topgrid/grid-pro-master] Invalid shortcut modifier: "${mod}" in "${shortcut}". Valid modifiers: Ctrl, Alt, Shift.`);
      }
      return null;
    }
  }

  return {
    ctrl: modifiers.includes('ctrl'),
    alt: modifiers.includes('alt'),
    shift: modifiers.includes('shift'),
    key: keyPart.toLowerCase(),
  };
}

/**
 * Tests whether a `KeyboardEvent` matches a parsed shortcut.
 */
function matchesShortcut(
  e: KeyboardEvent<HTMLDivElement>,
  parsed: { ctrl: boolean; alt: boolean; shift: boolean; key: string },
): boolean {
  return (
    e.ctrlKey === parsed.ctrl &&
    e.altKey === parsed.alt &&
    e.shiftKey === parsed.shift &&
    e.key.toLowerCase() === parsed.key
  );
}

/**
 * Inner implementation (unwrapped from forwardRef for generic type support).
 */
function ContextMenuGridInner<TData>(
  props: ContextMenuGridProps<TData>,
  ref: Ref<GridHandle<TData>>,
): ReactElement {
  const { contextMenuItems, ...rest } = props;

  const { isOpen, position, targetRow, targetCell, openAt, close } = useContextMenu<TData>();

  // ── TanStack table instance ──
  const table = useReactTable<TData>({
    data: rest.data,
    columns: rest.columns,
    getCoreRowModel: getCoreRowModel(),
    // C-29 spread-skip for exactOptionalPropertyTypes: true
    ...(rest.getSubRows !== undefined ? { getSubRows: rest.getSubRows } : {}),
    ...(rest.debug !== undefined ? { debugTable: rest.debug } : {}),
  });

  // ── Imperative handle: GridHandle<TData> ──
  useImperativeHandle(
    ref,
    () => ({
      addRow: (seed?: Partial<TData>) => {
        if (typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'production') {
          if (props.onAddRow === undefined) {
            console.warn('[topgrid/grid-pro-master] addRow called but onAddRow prop is not provided.');
          }
        }
        props.onAddRow?.(seed);
      },
      deleteRow: (rowId: string | number) => {
        if (typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'production') {
          if (props.onDeleteRow === undefined) {
            console.warn('[topgrid/grid-pro-master] deleteRow called but onDeleteRow prop is not provided.');
          }
        }
        props.onDeleteRow?.(rowId);
      },
      updateRow: (rowId: string | number, patch: Partial<TData>) => {
        if (typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'production') {
          if (props.onUpdateRow === undefined) {
            console.warn('[topgrid/grid-pro-master] updateRow called but onUpdateRow prop is not provided.');
          }
        }
        props.onUpdateRow?.(rowId, patch);
      },
      scrollTo: (_index: number) => {
        // no-op stub — virtualization not wired in ContextMenuGrid
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
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table],
  );

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;
  const colCount = rest.columns.length;

  // ── Keyboard shortcut handler (D5) ──
  // Handles: shortcut key dispatch (AC-004/AC-005) + Esc close (AC-012)
  // Runs only when contextMenuItems are provided.
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    // Esc always closes the menu (AC-012)
    if (e.key === 'Escape') {
      close();
      return;
    }

    if (contextMenuItems === undefined || contextMenuItems.length === 0) return;
    if (targetRow === null || targetCell === null) return;

    for (const item of contextMenuItems) {
      if (item.separator === true || item.shortcut === undefined) continue;

      const parsed = parseShortcut(item.shortcut);
      if (parsed === null) continue;

      if (matchesShortcut(e, parsed)) {
        // Evaluate disabled at trigger time (D7)
        const isDisabled =
          typeof item.disabled === 'function'
            ? item.disabled(targetRow)
            : (item.disabled ?? false);

        if (!isDisabled) {
          // The spec signature requires `MouseEvent` (native, not React synthetic).
          // targetCell is narrowed to Cell<TData, unknown> by the null guard above.
          item.onClick(targetRow, targetCell, new MouseEvent('click'));
          close();
        }
        e.preventDefault();
        return;
      }
    }
  }

  // ── onContextMenu handler ──
  // Extracts row/cell from TanStack row model using DOM data attributes.
  function handleCellContextMenu(
    e: MouseEvent<HTMLTableCellElement>,
    row: TData,
    cell: Cell<TData, unknown>,
  ) {
    if (contextMenuItems === undefined || contextMenuItems.length === 0) return;
    e.preventDefault();
    openAt(e.clientX, e.clientY, row, cell);
  }

  return (
    // tabIndex={0} makes the wrapper focusable for onKeyDown (D5).
    // focus:outline-none suppresses default browser focus ring on the container.
    <div
      className={['focus:outline-none', rest.className].filter(Boolean).join(' ')}
      tabIndex={contextMenuItems !== undefined ? 0 : undefined}
      onKeyDown={contextMenuItems !== undefined ? handleKeyDown : undefined}
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-gray-200 bg-gray-100">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-2 text-left font-semibold text-gray-700"
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
                {rest.emptyText ?? '데이터가 없습니다.'}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-gray-100 hover:bg-gray-50"
                onClick={
                  rest.onRowClick !== undefined
                    ? (e) => rest.onRowClick!(row.original, e)
                    : undefined
                }
                onDoubleClick={
                  rest.onRowDoubleClick !== undefined
                    ? (e) => rest.onRowDoubleClick!(row.original, e)
                    : undefined
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-2"
                    onClick={
                      rest.onCellClick !== undefined
                        ? (e) => rest.onCellClick!(cell, row.original, e)
                        : undefined
                    }
                    onContextMenu={
                      contextMenuItems !== undefined
                        ? (e) => handleCellContextMenu(e, row.original, cell)
                        : undefined
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {isOpen && targetRow !== null && targetCell !== null && contextMenuItems !== undefined && (
        <ContextMenuPortal<TData>
          isOpen={isOpen}
          position={position}
          items={contextMenuItems}
          targetRow={targetRow}
          targetCell={targetCell}
          onClose={close}
        />
      )}
    </div>
  );
}

/**
 * `<ContextMenuGrid>` Pro-tier component with right-click context menu support.
 *
 * @typeParam TData - Row data type.
 *
 * @example Uncontrolled
 * ```tsx
 * const gridRef = useRef<GridHandle<Order>>(null);
 *
 * const menuItems: ContextMenuItem<Order>[] = [
 *   { label: '수정', shortcut: 'E', onClick: (row) => openEdit(row) },
 *   { separator: true, label: '', onClick: () => {} },
 *   {
 *     label: '삭제',
 *     shortcut: 'Delete',
 *     disabled: (row) => row.status === 'completed',
 *     onClick: (row) => deleteOrder(row),
 *   },
 * ];
 *
 * <ContextMenuGrid<Order>
 *   ref={gridRef}
 *   data={orders}
 *   columns={columns}
 *   contextMenuItems={menuItems}
 * />
 * ```
 */
export const ContextMenuGrid = forwardRef(ContextMenuGridInner) as <TData>(
  props: ContextMenuGridProps<TData> & { ref?: Ref<GridHandle<TData>> },
) => ReactElement;
