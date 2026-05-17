/**
 * `<ContextMenuPortal>` — createPortal-based context menu renderer.
 *
 * G-002 (MOD-GRID-16): Renders a context menu into `document.body` via
 * `createPortal` to escape parent overflow/stacking contexts (D4).
 *
 * Responsibilities:
 * - `separator: true` items → `<hr>` element (AC-008)
 * - `disabled` evaluation at render time against `targetRow` (D7, AC-007)
 * - `shortcut` hint display on the right side of each item (AC-005)
 * - Outside-click → `onClose()` via `mousedown` listener (AC-012)
 * - Viewport-edge position clamping (Section 9 edge case)
 *
 * @see G-002-spec.md Section 5.3 / Section 9
 */

import { useEffect, useRef, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import type { Cell } from '@tanstack/react-table';
import type { ContextMenuItem } from '../types';

/**
 * Props for `<ContextMenuPortal>`.
 *
 * @typeParam TData - Row data type.
 */
interface ContextMenuPortalProps<TData> {
  /** Whether the menu is currently open. When false, nothing is rendered. */
  isOpen: boolean;
  /** Viewport-absolute position for the menu top-left corner (pre-computed by caller). */
  position: { x: number; y: number };
  /** Menu items to render. */
  items: ContextMenuItem<TData>[];
  /** The row data that was right-clicked. */
  targetRow: TData;
  /** The TanStack cell that was right-clicked. */
  targetCell: Cell<TData, unknown>;
  /** Called when the menu should close (outside-click or Esc handled at wrapper level). */
  onClose: () => void;
}

/**
 * Clamps menu position so it stays within the viewport.
 *
 * @param x - Requested left position (clientX from contextmenu event).
 * @param y - Requested top position (clientY from contextmenu event).
 * @param menuWidth - Estimated / measured menu width in px.
 * @param menuHeight - Estimated / measured menu height in px.
 * @returns Adjusted `{ x, y }` clamped to viewport bounds.
 */
function clampPosition(
  x: number,
  y: number,
  menuWidth: number,
  menuHeight: number,
): { x: number; y: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    x: x + menuWidth > vw ? Math.max(0, vw - menuWidth) : x,
    y: y + menuHeight > vh ? Math.max(0, vh - menuHeight) : y,
  };
}

/**
 * Context menu rendered into `document.body` via `createPortal`.
 *
 * @typeParam TData - Row data type.
 */
function ContextMenuPortalInner<TData>(
  props: ContextMenuPortalProps<TData>,
): ReactElement | null {
  const { isOpen, position, items, targetRow, targetCell, onClose } = props;

  const menuRef = useRef<HTMLUListElement>(null);

  // Outside-click → close (AC-012)
  useEffect(() => {
    if (!isOpen) return;

    function handleMouseDown(e: MouseEvent) {
      if (menuRef.current !== null && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Estimate menu dimensions for viewport clamping.
  // Use a generous estimate (200×(items.length * 32)) when DOM not yet measured.
  const estimatedHeight = items.length * 32 + 8;
  const estimatedWidth = 200;
  const { x, y } = clampPosition(position.x, position.y, estimatedWidth, estimatedHeight);

  const menu = (
    <ul
      ref={menuRef}
      role="menu"
      className="fixed z-50 bg-white border border-gray-200 rounded shadow-lg py-1 text-sm min-w-[160px]"
      style={{ left: x, top: y }}
    >
      {items.map((item, index) => {
        // Separator item (AC-008)
        if (item.separator === true) {
          return (
            <li key={index} role="separator">
              <hr className="my-1 border-gray-200" />
            </li>
          );
        }

        // Evaluate disabled (D7): function evaluated at render time against targetRow
        const isDisabled =
          typeof item.disabled === 'function'
            ? item.disabled(targetRow)
            : (item.disabled ?? false);

        return (
          <li key={index} role="menuitem" aria-disabled={isDisabled}>
            <button
              type="button"
              className={[
                'w-full flex items-center gap-2 px-3 py-1.5 text-left text-gray-700',
                'hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
                isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
              ].join(' ')}
              disabled={isDisabled}
              onClick={
                isDisabled
                  ? undefined
                  : (e) => {
                      item.onClick(targetRow, targetCell, e.nativeEvent);
                      onClose();
                    }
              }
            >
              <span className="flex-1">{item.label}</span>
              {item.shortcut !== undefined && (
                <span className="ml-auto text-xs text-gray-400 shrink-0">{item.shortcut}</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return createPortal(menu, document.body);
}

/**
 * `<ContextMenuPortal>` — exported as typed generic component.
 *
 * @typeParam TData - Row data type.
 */
export function ContextMenuPortal<TData>(
  props: ContextMenuPortalProps<TData>,
): ReactElement | null {
  return ContextMenuPortalInner(props);
}
