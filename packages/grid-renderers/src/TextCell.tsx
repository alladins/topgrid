import type { JSX } from 'react';

/**
 * Props for {@link TextCell}.
 *
 * @see Spec MOD-GRID-05/G-001 Section 2.1
 */
export interface TextCellProps {
  /** Text to render. null/undefined/'' → dash placeholder. Falsy 0 is preserved (EC-06). */
  value: string | number | null | undefined;
  /** Additional Tailwind className. */
  className?: string;
}

/**
 * Plain text cell renderer with null/empty dash placeholder.
 *
 * Distinguishes empty (null/undefined/'') from falsy zero — `0` renders as "0".
 */
export function TextCell({ value, className }: TextCellProps): JSX.Element {
  if (value == null || value === '') {
    return <span className={`text-gray-400 ${className ?? ''}`.trim()}>-</span>;
  }
  const text = typeof value === 'number' ? String(value) : value;
  return <span className={className ?? ''}>{text}</span>;
}
