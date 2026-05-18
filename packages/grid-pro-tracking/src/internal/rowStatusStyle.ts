// @topgrid/grid-pro-tracking — row status Tailwind class helpers (MOD-GRID-10/G-004)
//
// Pure helper — zero React imports. No CSS files.
// Spec: artifacts/MOD-GRID-10/tracking/G-004-spec.md Section 2.1
// AC-002: default className values are canonical.

import type { RowStatus, RowStatusClassNames } from '../types';

/**
 * Default Tailwind classNames for each row status.
 * @see AC-002 — canonical values; override via `getRowStatusClassName` second arg.
 */
export const defaultRowStatusClassNames: Readonly<RowStatusClassNames> = {
  added: 'bg-green-50 border-l-2 border-green-400',
  edited: 'bg-yellow-50 border-l-2 border-yellow-400',
  deleted: 'bg-red-50 line-through opacity-60',
};

/**
 * Returns the Tailwind className string for a given row status.
 * If `classNames` is provided, it is merged over `defaultRowStatusClassNames`
 * (consumer override). Returns `''` for an unknown status (defensive).
 *
 * @param status - RowStatus value from `row.__rowStatus`.
 * @param classNames - Optional override map (full `RowStatusClassNames` shape).
 * @returns Tailwind className string, or `''` if status is not recognised.
 * @see AC-002 — default values canonical.
 * @see AC-003 — zero Wijmo import; pure helper (C-32).
 */
export function getRowStatusClassName(
  status: RowStatus,
  classNames?: RowStatusClassNames,
): string {
  const merged: RowStatusClassNames = classNames
    ? { ...defaultRowStatusClassNames, ...classNames }
    : defaultRowStatusClassNames;
  return merged[status] ?? '';
}
