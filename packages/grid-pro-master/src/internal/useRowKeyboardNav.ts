/**
 * `useRowKeyboardNav` — WCAG 2.1 AA keyboard accessibility hook for Master-Detail rows.
 *
 * Adds `tabIndex=0` and `onKeyDown` (Enter/Space to toggle expand) to row elements.
 *
 * C-32 separation:
 * - Pure helper: `shouldToggleExpand(key)` — framework-independent key check.
 * - React shell: `useRowKeyboardNav(row, enabled)` — returns spreadable props object.
 *
 * @see G-003-spec.md Section 2.2 + D5
 * @see MOD-GRID-16-decisions.md D19
 *
 * @internal
 */

import { useCallback } from 'react';
import type { KeyboardEvent } from 'react';
import type { Row } from '@tanstack/react-table';

/**
 * Props returned by `useRowKeyboardNav` to spread onto a row element (`<tr>`).
 *
 * @example
 * ```tsx
 * const keyboardProps = useRowKeyboardNav(row, !!renderDetailRow);
 * <tr {...keyboardProps} className="...">
 * ```
 */
export interface RowKeyboardNavProps {
  /** Makes the row focusable via keyboard navigation. */
  tabIndex: 0;
  /** Handles Enter / Space keypress to toggle row expansion. */
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

/**
 * Pure helper — returns `true` when the key event should toggle row expansion.
 *
 * C-32: React-independent. Accepts the raw `event.key` string.
 *
 * @param key - `event.key` value from a `KeyboardEvent`.
 * @returns `true` for `'Enter'` or `' '` (Space); `false` otherwise.
 */
export function shouldToggleExpand(key: string): boolean {
  return key === 'Enter' || key === ' ';
}

/**
 * WCAG 2.1 AA keyboard accessibility hook for expandable rows.
 *
 * Returns `{ tabIndex: 0, onKeyDown }` when the row can be expanded and `enabled` is not
 * `false`. Returns an empty object (`{}`) otherwise — safe to spread unconditionally
 * (EC-04, EC-05).
 *
 * @param row     - TanStack `Row<TData>` — used for `getCanExpand()` / `toggleExpanded()`.
 * @param enabled - Pass `false` to skip keyboard wiring (e.g., when `renderDetailRow` is absent).
 *                  Defaults to `true`.
 * @returns Spreadable props object — either `RowKeyboardNavProps` or `{}`.
 *
 * @see G-003-spec.md Section 2.2
 */
export function useRowKeyboardNav<TData>(
  row: Row<TData>,
  enabled?: boolean,
): RowKeyboardNavProps | Record<string, never> {
  const canExpand = row.getCanExpand();

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (shouldToggleExpand(event.key)) {
        event.preventDefault();
        row.toggleExpanded();
      }
    },
    // Re-create only when row reference changes (row.toggleExpanded is bound to the row instance).
    [row],
  );

  // EC-05: enabled=false → no wiring.
  // EC-04: !canExpand → no wiring (row.toggleExpanded would be a no-op anyway).
  if (enabled === false || !canExpand) {
    return {};
  }

  return { tabIndex: 0, onKeyDown };
}
