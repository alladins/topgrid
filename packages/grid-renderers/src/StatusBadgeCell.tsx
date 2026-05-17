import type { JSX } from 'react';

/**
 * Props for {@link StatusBadgeCell}.
 *
 * Absorbs tw-framework-front BadgeCell.tsx (L0 26 lines) with rename
 * (BadgeCell → StatusBadgeCell — spec D1). Prop signature fully preserved.
 *
 * @see Spec MOD-GRID-05/G-002 Section 2.1
 */
export interface StatusBadgeCellProps {
  /** Status value — used as colorMap lookup key. */
  value: string;
  /** Status → Tailwind class map. When undefined, default 7-state map applies (L0 L8-15 preserved). */
  colorMap?: Record<string, string>;
  /** Fallback Tailwind class when value not found in colorMap. Default `'bg-gray-100 text-gray-600'`. */
  defaultColor?: string;
  /** Additional Tailwind className appended to the rendered span. */
  className?: string;
}

const DEFAULT_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  approved: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  draft: 'bg-gray-100 text-gray-500',
};

/**
 * Status badge cell — renders {@link value} as a Tailwind rounded-full chip
 * coloured by {@link colorMap} (or a 7-state default).
 *
 * Equivalent to the legacy `BadgeCell` exported via `tw-framework-front`;
 * the shim there re-exports this component under the legacy name (D1 alias).
 */
export function StatusBadgeCell({
  value,
  colorMap,
  defaultColor = 'bg-gray-100 text-gray-600',
  className,
}: StatusBadgeCellProps): JSX.Element {
  const map = colorMap ?? DEFAULT_COLORS;
  const colorClass = map[value] ?? defaultColor;
  const composed = [
    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
    colorClass,
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return <span className={composed}>{value}</span>;
}
