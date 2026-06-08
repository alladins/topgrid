/**
 * `<ContextMenuPortal>` — createPortal-based context menu renderer.
 *
 * G-002 (MOD-GRID-16): Renders a context menu into `document.body` via
 * `createPortal` to escape parent overflow/stacking contexts (D4).
 *
 * Responsibilities:
 * - `separator: true` items → `<hr>` element (AC-008)
 * - `icon` rendered leading the label; `children` → nested submenu (MOD-61 redo)
 * - `disabled` evaluation at render time against `targetRow` (D7, AC-007)
 * - `shortcut` hint display on the right side of each item (AC-005)
 * - Outside-click → `onClose()` via `mousedown` listener (AC-012)
 * - Viewport-edge position clamping (Section 9 edge case)
 *
 * @see G-002-spec.md Section 5.3 / Section 9
 */

import { useEffect, useRef, useState, type ReactElement } from 'react';
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
 * A single menu row. Recursive: an item with `children` renders a nested
 * `<ul role="menu">` submenu that opens on hover (onMouseEnter) or click-toggle.
 *
 * Click-toggle is the deterministic open path (the chromium gate clicks the
 * parent, avoiding React's synthetic-onMouseEnter timing — LESS-009 discipline).
 */
function MenuItemRow<TData>(props: {
  item: ContextMenuItem<TData>;
  index: number;
  targetRow: TData;
  targetCell: Cell<TData, unknown>;
  onClose: () => void;
}): ReactElement {
  const { item, index, targetRow, targetCell, onClose } = props;
  const [subOpen, setSubOpen] = useState(false);

  // Separator (AC-008)
  if (item.separator === true) {
    return (
      <li key={index} role="separator">
        <hr className="my-1 border-gray-200" />
      </li>
    );
  }

  const isDisabled =
    typeof item.disabled === 'function'
      ? item.disabled(targetRow)
      : (item.disabled ?? false);

  const hasChildren = item.children !== undefined && item.children.length > 0;

  function handleClick(e: { nativeEvent: MouseEvent }) {
    if (isDisabled) return;
    if (hasChildren) {
      // Parent: opens its submenu (idempotent, never fires onClick). Open — not
      // toggle — so it is deterministic regardless of a preceding hover-open
      // (Playwright click hovers first; a toggle would close it). Closing is via
      // hover-out (onMouseLeave) or outside-click.
      setSubOpen(true);
      return;
    }
    item.onClick?.(targetRow, targetCell, e.nativeEvent);
    onClose();
  }

  return (
    <li
      key={index}
      role="menuitem"
      aria-disabled={isDisabled}
      aria-haspopup={hasChildren ? 'menu' : undefined}
      className="relative"
      onMouseEnter={hasChildren ? () => setSubOpen(true) : undefined}
      onMouseLeave={hasChildren ? () => setSubOpen(false) : undefined}
    >
      <button
        type="button"
        className={[
          'w-full flex items-center gap-2 px-3 py-1.5 text-left text-gray-700',
          'hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
          isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
        ].join(' ')}
        disabled={isDisabled}
        onClick={isDisabled ? undefined : handleClick}
      >
        {item.icon !== undefined && (
          <span className="shrink-0 w-4 text-center" data-menu-icon>
            {item.icon}
          </span>
        )}
        <span className="flex-1">{item.label}</span>
        {hasChildren ? (
          <span className="ml-auto text-xs text-gray-400 shrink-0" data-submenu-arrow>
            ▶
          </span>
        ) : (
          item.shortcut !== undefined && (
            <span className="ml-auto text-xs text-gray-400 shrink-0">{item.shortcut}</span>
          )
        )}
      </button>

      {hasChildren && subOpen && (
        <ul
          role="menu"
          data-submenu
          className="absolute left-full top-0 -mt-1 bg-white border border-gray-200 rounded shadow-lg py-1 text-sm min-w-[140px]"
        >
          {item.children!.map((child, ci) => (
            <MenuItemRow<TData>
              key={ci}
              item={child}
              index={ci}
              targetRow={targetRow}
              targetCell={targetCell}
              onClose={onClose}
            />
          ))}
        </ul>
      )}
    </li>
  );
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
      {items.map((item, index) => (
        <MenuItemRow<TData>
          key={index}
          item={item}
          index={index}
          targetRow={targetRow}
          targetCell={targetCell}
          onClose={onClose}
        />
      ))}
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
